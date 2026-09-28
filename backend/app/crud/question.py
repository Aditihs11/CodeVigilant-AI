from sqlalchemy.orm import Session

from app.models.question import Question
from app.schemas.question import QuestionCreate


def create_question(
    db: Session,
    interview_id: int,
    question: QuestionCreate,
):
    db_question = Question(
        interview_id=interview_id,
        question_text=question.question_text,
        question_number=question.question_number,
    )

    db.add(db_question)
    db.commit()
    db.refresh(db_question)

    return db_question


def get_questions_by_interview(
    db: Session,
    interview_id: int,
):
    return (
        db.query(Question)
        .filter(
            Question.interview_id == interview_id
        )
        .order_by(
            Question.question_number.asc()
        )
        .all()
    )