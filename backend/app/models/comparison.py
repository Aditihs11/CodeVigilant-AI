import json
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func

from app.db.database import Base


class CandidateComparisonSnapshot(Base):
    __tablename__ = "candidate_comparison_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(String, nullable=False) # Recruiter email
    
    weights_json = Column(Text, nullable=False) # Configured weights e.g. {skill_match: 20, assessment: 30, coding: 25, interview: 25}
    comparison_data_json = Column(Text, nullable=False) # Full structured comparison table & ranking explanations
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def get_weights(self):
        if not self.weights_json:
            return {}
        try:
            return json.loads(self.weights_json)
        except Exception:
            return {}

    def get_comparison_data(self):
        if not self.comparison_data_json:
            return {}
        try:
            return json.loads(self.comparison_data_json)
        except Exception:
            return {}
