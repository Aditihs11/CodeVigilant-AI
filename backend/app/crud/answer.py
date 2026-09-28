import json

from sqlalchemy.orm import Session

from app.models.answer import Answer
from app.schemas.answer import AnswerCreate


def create_answer(
    db: Session,
    interview_id: int,
    answer: AnswerCreate,
):
    db_answer = Answer(
        interview_id=interview_id,
        question_id=answer.question_id,
        answer_text=answer.answer_text,
    )

    db.add(db_answer)
    db.commit()
    db.refresh(db_answer)

    return db_answer


def get_answers_by_interview(
    db: Session,
    interview_id: int,
):
    answers = (
        db.query(Answer)
        .filter(Answer.interview_id == interview_id)
        .order_by(Answer.created_at.asc())
        .all()
    )

    for answer in answers:
        answer.strengths = _parse_json_list(answer.strengths)
        answer.improvements = _parse_json_list(answer.improvements)

    return answers


def get_answer_by_question(
    db: Session,
    interview_id: int,
    question_id: int,
):
    return (
        db.query(Answer)
        .filter(
            Answer.interview_id == interview_id,
            Answer.question_id == question_id,
        )
        .first()
    )


def update_answer_evaluation(
    db: Session,
    answer: Answer,
    evaluation: dict,
):
    answer.score = evaluation.get("score")
    answer.feedback = evaluation.get("feedback")

    strengths = evaluation.get("strengths", [])
    improvements = evaluation.get("improvements", [])

    answer.strengths = json.dumps(strengths)
    answer.improvements = json.dumps(improvements)

    db.commit()
    db.refresh(answer)

    # Return Python lists to FastAPI
    answer.strengths = strengths
    answer.improvements = improvements

    return answer


def _parse_json_list(value):
    if value is None:
        return []

    if isinstance(value, list):
        return value

    try:
        parsed = json.loads(value)

        if isinstance(parsed, list):
            return parsed

        return []

    except (json.JSONDecodeError, TypeError):
        return []