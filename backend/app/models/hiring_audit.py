import json
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func

from app.db.database import Base


class HiringAuditLog(Base):
    __tablename__ = "hiring_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    actor = Column(String, nullable=False) # User email or "system"
    action = Column(String, nullable=False, index=True) # "job_created", "job_published", "application_submitted", "eligibility_evaluated", "invitation_sent", "assessment_completed", "shortlisted", "interview_completed", "ranked", "final_decision_made"
    
    entity_type = Column(String, nullable=False) # "job", "application", "invitation", "interview", "assessment"
    entity_id = Column(Integer, nullable=False, index=True)
    
    previous_state = Column(String, nullable=True)
    new_state = Column(String, nullable=True)
    
    details_json = Column(Text, nullable=True) # Safe metadata without candidate PII or secrets
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    def get_details(self):
        if not self.details_json:
            return {}
        try:
            return json.loads(self.details_json)
        except Exception:
            return {}
