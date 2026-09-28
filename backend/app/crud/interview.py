from sqlalchemy.orm import Session

from app.models.interview import Interview


def create_interview(
    db: Session,
    user_id: int,
    role: str,
):
    interview = Interview(
        user_id=user_id,
        role=role,
        status="created",
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)

    return interview


def get_interview(
    db: Session,
    interview_id: int,
    user_id: int,
):
    return (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == user_id,
        )
        .first()
    )


def get_user_interviews(
    db: Session,
    user_id: int,
):
    return (
        db.query(Interview)
        .filter(Interview.user_id == user_id)
        .order_by(Interview.created_at.desc())
        .all()
    )