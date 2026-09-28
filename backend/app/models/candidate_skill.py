from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.sql import func

from app.db.database import Base


class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    role = Column(String, nullable=False, index=True)
    topic = Column(String, nullable=False, index=True)
    subtopic = Column(String, nullable=True)

    mastery_score = Column(Float, default=50.0) # Continuous score: 0.0 - 100.0
    confidence = Column(String, default="Low") # "Low", "Medium", "High"
    attempts = Column(Integer, default=0)
    recent_score = Column(Float, nullable=True)
    trend = Column(String, default="Stable") # "Improving", "Stable", "Declining"
    status = Column(String, default="Developing") # "Weak", "Developing", "Competent", "Strong", "Mastered"

    history_json = Column(Text, nullable=True) # Historical updates array: [{"score": 8.0, "mastery": 65.0, "timestamp": "..."}]

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
