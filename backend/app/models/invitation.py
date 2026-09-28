import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func

from app.db.database import Base


class AssessmentInvitation(Base):
    __tablename__ = "assessment_invitations"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False, default=lambda: uuid.uuid4().hex)
    
    application_id = Column(Integer, ForeignKey("candidate_applications.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("interviews.id", ondelete="SET NULL"), nullable=True, index=True)
    
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    allowed_attempts = Column(Integer, default=1)
    attempts_used = Column(Integer, default=0)
    
    # Status: CREATED, SENT, OPENED, STARTED, COMPLETED, EXPIRED, CANCELLED
    status = Column(String, default="SENT", index=True)
    
    opened_at = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    def is_valid_for_entry(self) -> bool:
        if self.status in ["COMPLETED", "CANCELLED", "EXPIRED"]:
            return False
        if self.attempts_used >= self.allowed_attempts:
            return False
        if self.expires_at:
            # Check expiry
            now = datetime.now(timezone.utc)
            exp = self.expires_at if self.expires_at.tzinfo else self.expires_at.replace(tzinfo=timezone.utc)
            if now > exp:
                return False
        return True
