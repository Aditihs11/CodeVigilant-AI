from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.sql import func

from app.db.database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    interview_id = Column(
        Integer,
        ForeignKey("interviews.id"),
        nullable=False,
        index=True,
    )

    question_text = Column(
        Text,
        nullable=False,
    )

    question_number = Column(
        Integer,
        nullable=False,
    )

    question_type = Column(
        String,
        nullable=False,
        default="text", # "text", "mcq", "coding"
    )

    options_json = Column(
        Text,
        nullable=True, # JSON string of array of string options
    )

    correct_answer = Column(
        Integer,
        nullable=True, # Index 0, 1, 2, 3 (hidden from candidate before submission)
    )

    explanation = Column(
        Text,
        nullable=True, # Explanation of the correct answer
    )

    topic = Column(
        String,
        nullable=True,
    )

    subtopic = Column(
        String,
        nullable=True,
    )

    difficulty = Column(
        String,
        nullable=True,
    )

    coding_metadata_json = Column(
        Text,
        nullable=True,
    )

    # RAG & Explainable AI Traceability
    retrieval_metadata_json = Column(
        Text,
        nullable=True, # {"retrieval_source": "question_bank", "source_ids": [12, 15], "model": "gemini-3.6-flash"}
    )

    adaptive_metadata_json = Column(
        Text,
        nullable=True, # {"reason": "Targeting weak topic: Multithreading", "selection_score": 8.4, "mastery": 51}
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )