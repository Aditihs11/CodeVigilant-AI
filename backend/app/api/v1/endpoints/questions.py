from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.interview import Interview
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User

from app.crud.question import (
    create_question,
    get_questions_by_interview,
)

from app.schemas.question import (
    QuestionCreate,
    QuestionResponse,
)

from app.services.gemini import generate_interview_questions


router = APIRouter()


# ============================================================
# CREATE QUESTION MANUALLY
# ============================================================

@router.post(
    "/{interview_id}/questions",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_question(
    interview_id: int,
    question: QuestionCreate,
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

    return create_question(
        db=db,
        interview_id=interview_id,
        question=question,
    )


# ============================================================
# GET QUESTIONS FOR INTERVIEW
# ============================================================

@router.get(
    "/{interview_id}/questions",
    response_model=List[QuestionResponse],
)
def get_questions(
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

    return get_questions_by_interview(
        db=db,
        interview_id=interview_id,
    )


# ============================================================
# GENERATE QUESTIONS USING GEMINI
# ============================================================

@router.post(
    "/{interview_id}/generate-questions",
    response_model=List[QuestionResponse],
    status_code=status.HTTP_201_CREATED,
)
def generate_questions(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find interview belonging to the authenticated user
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

    # Check if questions already exist for this interview (idempotent)
    existing_questions = get_questions_by_interview(db=db, interview_id=interview_id)
    if existing_questions and len(existing_questions) > 0:
        return existing_questions

    # Generate questions using Gemini
    try:
        generated_questions = generate_interview_questions(
            role=interview.role,
            number_of_questions=5,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate questions: {str(e)}",
        )

    saved_questions = []
    for question in generated_questions:
        question_data = QuestionCreate(
            question_text=question["question_text"],
            question_number=question["question_number"],
        )
        saved_question = create_question(
            db=db,
            interview_id=interview_id,
            question=question_data,
        )
        saved_questions.append(saved_question)

    interview.status = "in_progress"
    db.commit()
    db.refresh(interview)

    return saved_questions