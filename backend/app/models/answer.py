from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, Boolean, String
from sqlalchemy.sql import func

from app.db.database import Base


class Answer(Base):
    __tablename__ = "answers"

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

    question_id = Column(
        Integer,
        ForeignKey("questions.id"),
        nullable=False,
        index=True,
    )

    answer_text = Column(
        Text,
        nullable=False, # candidate answer text or code snippet
    )

    selected_option = Column(
        Integer,
        nullable=True, # For MCQ: 0, 1, 2, 3
    )

    is_correct = Column(
        Boolean,
        nullable=True, # For MCQ: True/False
    )

    code_language = Column(
        String,
        nullable=True, # For Coding: "java", "python", "javascript"
    )

    test_cases_passed = Column(
        Integer,
        nullable=True, # For Coding: e.g. 4
    )

    test_cases_total = Column(
        Integer,
        nullable=True, # For Coding: e.g. 5
    )

    code_quality_score = Column(
        Integer,
        nullable=True, # For Coding: 0-10
    )

    topic = Column(
        String,
        nullable=True,
    )

    score = Column(
        Integer,
        nullable=True, # 0-10
    )

    feedback = Column(
        Text,
        nullable=True,
    )

    strengths = Column(
        Text,
        nullable=True,
    )

    improvements = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )