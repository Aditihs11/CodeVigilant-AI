from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func

from app.db.database import Base


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    resume_id = Column(
        Integer,
        ForeignKey("resumes.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    role = Column(
        String,
        nullable=False,
    )

    assessment_type = Column(
        String,
        nullable=False,
        default="interview", # "interview", "mcq", "coding"
    )

    difficulty = Column(
        String,
        nullable=True,
        default="Intermediate", # "Beginner", "Intermediate", "Advanced"
    )

    language = Column(
        String,
        nullable=True, # For coding mode: "java", "python", "javascript"
    )

    status = Column(
        String,
        nullable=False,
        default="created", # "created", "in_progress", "completed"
    )

    score = Column(
        Integer,
        nullable=True,
    )

    # Timing fields
    time_limit_minutes = Column(
        Integer,
        nullable=True,
    )

    started_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Anti-cheating & Integrity
    integrity_status = Column(
        String,
        nullable=False,
        default="Normal", # "Normal", "Integrity Warning"
    )

    integrity_summary_json = Column(
        Text,
        nullable=True,
    )

    # Results & Reports
    questions_json = Column(
        Text,
        nullable=True,
    )

    answers_json = Column(
        Text,
        nullable=True,
    )

    feedback_json = Column(
        Text,
        nullable=True,
    )

    skill_gap_json = Column(
        Text,
        nullable=True,
    )

    learning_roadmap_json = Column(
        Text,
        nullable=True,
    )

    metadata_json = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )