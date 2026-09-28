import json
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.sql import func

from app.db.database import Base


VALID_APPLICATION_STATUSES = [
    "APPLIED",
    "SCREENING",
    "ELIGIBLE",
    "ASSESSMENT_INVITED",
    "ASSESSMENT_IN_PROGRESS",
    "ASSESSMENT_COMPLETED",
    "SHORTLISTED",
    "INTERVIEW_SCHEDULED",
    "INTERVIEW_IN_PROGRESS",
    "INTERVIEW_COMPLETED",
    "SELECTED",
    "REJECTED",
    "WITHDRAWN",
]


class CandidateApplication(Base):
    __tablename__ = "candidate_applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Status progression
    status = Column(String, default="APPLIED", index=True)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Eligibility & Matching Results
    is_eligible = Column(Boolean, nullable=True)
    eligibility_decision_json = Column(Text, nullable=True) # Detailed reasons, matched/missing skills
    match_score = Column(Float, nullable=True) # 0-100% skill match
    
    # Associated Assessment & Technical Interview Sessions
    assessment_id = Column(Integer, ForeignKey("interviews.id", ondelete="SET NULL"), nullable=True, index=True)
    technical_interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Deterministic Assessment Scores
    assessment_score = Column(Float, nullable=True) # 0-10 or percentage
    coding_score = Column(Float, nullable=True)
    interview_score = Column(Float, nullable=True)
    weighted_composite_score = Column(Float, nullable=True) # Configured weighted composite
    
    # Shortlisting Decision
    is_shortlisted = Column(Boolean, nullable=True)
    shortlist_decision_json = Column(Text, nullable=True) # Cutoff evaluations & rationale
    
    # Final Recruiter Decision & Recommendation
    final_recommendation = Column(String, nullable=True) # "STRONG_HIRE", "HIRE", "REVIEW", "NO_HIRE"
    final_decision = Column(String, nullable=True) # "SELECTED", "REJECTED", "HOLD"
    final_decision_notes = Column(Text, nullable=True)
    final_decision_by = Column(String, nullable=True) # Recruiter email
    final_decision_at = Column(DateTime(timezone=True), nullable=True)

    def get_eligibility(self):
        if not self.eligibility_decision_json:
            return {}
        try:
            return json.loads(self.eligibility_decision_json)
        except Exception:
            return {}

    def get_shortlist_details(self):
        if not self.shortlist_decision_json:
            return {}
        try:
            return json.loads(self.shortlist_decision_json)
        except Exception:
            return {}
