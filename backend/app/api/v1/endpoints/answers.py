from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.interview import Interview
from app.models.question import Question
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user

from app.crud.answer import (
    create_answer,
    get_answer_by_question,
    get_answers_by_interview,
    update_answer_evaluation,
)
from app.crud.question import get_questions_by_interview

from app.schemas.answer import (
    AnswerCreate,
    AnswerResponse,
)
from app.schemas.result import InterviewResult
from app.services.gemini import evaluate_answer


router = APIRouter()


# ============================================================
# SUBMIT ANSWER + AI EVALUATION
# ============================================================

@router.post(
    "/{interview_id}/answers",
    response_model=AnswerResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_answer(
    interview_id: int,
    answer: AnswerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # Check interview & ownership
    # --------------------------------------------------------
    interview = (
        db.query(Interview)
        .filter(Interview.id == interview_id, Interview.user_id == current_user.id)
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found",
        )

    # --------------------------------------------------------
    # Check question belongs to this interview
    # --------------------------------------------------------
    question = (
        db.query(Question)
        .filter(
            Question.id == answer.question_id,
            Question.interview_id == interview_id,
        )
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found for this interview",
        )

    # --------------------------------------------------------
    # Save or update candidate answer
    # --------------------------------------------------------
    existing_answer = get_answer_by_question(
        db=db,
        interview_id=interview_id,
        question_id=answer.question_id,
    )

    if existing_answer:
        existing_answer.answer_text = answer.answer_text
        db.commit()
        db.refresh(existing_answer)
        db_answer = existing_answer
    else:
        db_answer = create_answer(
            db=db,
            interview_id=interview_id,
            answer=answer,
        )

    # --------------------------------------------------------
    # Evaluate answer using Gemini
    # --------------------------------------------------------
    try:
        evaluation = evaluate_answer(
            question=question.question_text,
            answer=answer.answer_text,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate answer: {str(e)}",
        )

    # --------------------------------------------------------
    # Save AI evaluation
    # --------------------------------------------------------
    db_answer = update_answer_evaluation(
        db=db,
        answer=db_answer,
        evaluation=evaluation,
    )

    return db_answer


# ============================================================
# GET ALL ANSWERS FOR AN INTERVIEW
# ============================================================

@router.get(
    "/{interview_id}/answers",
    response_model=List[AnswerResponse],
)
def get_answers(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interview = (
        db.query(Interview)
        .filter(Interview.id == interview_id, Interview.user_id == current_user.id)
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found",
        )

    return get_answers_by_interview(
        db=db,
        interview_id=interview_id,
    )


# ============================================================
# GET INTERVIEW RESULTS
# ============================================================

@router.get(
    "/{interview_id}/results",
    response_model=InterviewResult,
)
def get_interview_results(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interview = (
        db.query(Interview)
        .filter(Interview.id == interview_id, Interview.user_id == current_user.id)
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found",
        )

    questions = get_questions_by_interview(db=db, interview_id=interview_id)
    total_questions = len(questions) if questions else 5

    answers = get_answers_by_interview(
        db=db,
        interview_id=interview_id,
    )

    scored_answers = [
        answer for answer in answers if answer.score is not None
    ]

    if scored_answers:
        total_score = sum(answer.score for answer in scored_answers)
        overall_score = round(total_score / len(scored_answers), 1)
    else:
        overall_score = 0.0

    # Mark interview completed if all questions are answered and scored
    if answers and len(scored_answers) >= total_questions:
        interview.status = "completed"
        interview.score = int(round(overall_score))
        db.commit()
        db.refresh(interview)
    elif answers:
        # If partially answered, save current calculated score
        interview.score = int(round(overall_score))
        db.commit()
        db.refresh(interview)

    return {
        "interview_id": interview.id,
        "role": interview.role,
        "status": interview.status,
        "total_questions": total_questions,
        "answered_questions": len(answers),
        "score": overall_score,
        "answers": answers,
    }