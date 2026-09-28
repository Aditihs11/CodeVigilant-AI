from sqlalchemy import Column, Integer, String, DateTime, Text, Float
from sqlalchemy.sql import func

from app.db.database import Base


class QuestionBank(Base):
    __tablename__ = "question_bank"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, nullable=False, index=True)
    topic = Column(String, nullable=True, index=True)
    subtopic = Column(String, nullable=True, index=True)
    difficulty = Column(String, nullable=True, default="Intermediate")
    question_type = Column(String, nullable=False, default="text") # "text", "mcq", "coding"
    question_text = Column(Text, nullable=False)
    options_json = Column(Text, nullable=True)
    correct_answer = Column(Integer, nullable=True)
    explanation = Column(Text, nullable=True)
    coding_metadata_json = Column(Text, nullable=True)
    source = Column(String, default="gemini") # "gemini", "curated", "custom"

    # Human-in-the-loop and quality approval workflow
    quality_status = Column(String, default="approved") # "pending", "approved", "rejected", "archived"
    approval_status = Column(String, default="approved") # "pending", "approved", "rejected", "archived"
    quality_score = Column(Float, default=8.5) # AI Quality Score out of 10

    # Calibration & Performance Feedback
    usage_count = Column(Integer, default=1)
    attempts_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    success_rate = Column(Float, nullable=True) # Percentage (e.g. 75.0%)
    observed_difficulty = Column(String, nullable=True) # Calibrated difficulty based on candidate accuracy

    reviewed_by = Column(String, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    validation_metadata_json = Column(Text, nullable=True) # AI validation details

    normalized_hash = Column(String, index=True, nullable=True) # SHA-256 for instant deduplication
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
