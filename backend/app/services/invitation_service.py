import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.invitation import AssessmentInvitation
from app.models.application import CandidateApplication
from app.models.job import Job
from app.models.interview import Interview
from app.models.hiring_audit import HiringAuditLog


def issue_assessment_invitation(
    db: Session,
    application: CandidateApplication,
    recruiter_email: str,
    valid_hours: int = 72,
    allowed_attempts: int = 1,
) -> AssessmentInvitation:
    """
    Issues a secure, time-bounded assessment invitation for an eligible candidate application.
    """
    if application.status not in ["ELIGIBLE", "SCREENING", "APPLIED"]:
        # If already invited or beyond, check existing
        existing = db.query(AssessmentInvitation).filter(
            AssessmentInvitation.application_id == application.id,
            AssessmentInvitation.status.in_(["SENT", "OPENED", "STARTED"])
        ).first()
        if existing and existing.is_valid_for_entry():
            return existing

    job = db.query(Job).filter(Job.id == application.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    expires_at = datetime.now(timezone.utc) + timedelta(hours=valid_hours)
    token = uuid.uuid4().hex

    invitation = AssessmentInvitation(
        token=token,
        application_id=application.id,
        job_id=job.id,
        candidate_id=application.candidate_id,
        expires_at=expires_at,
        allowed_attempts=allowed_attempts,
        attempts_used=0,
        status="SENT",
    )
    db.add(invitation)

    # Update application status
    application.status = "ASSESSMENT_INVITED"
    db.commit()
    db.refresh(invitation)

    # Audit log
    audit = HiringAuditLog(
        actor=recruiter_email,
        action="invitation_sent",
        entity_type="invitation",
        entity_id=invitation.id,
        new_state="SENT",
        details_json=f'{{"application_id": {application.id}, "job_id": {job.id}}}',
    )
    db.add(audit)
    db.commit()

    return invitation


def verify_and_claim_invitation(
    db: Session,
    token: str,
    candidate_user_id: int,
) -> AssessmentInvitation:
    """
    Verifies token validity, candidate ownership (anti-IDOR), expiry, and attempts.
    """
    invitation = db.query(AssessmentInvitation).filter(
        AssessmentInvitation.token == token
    ).first()

    if not invitation:
        raise HTTPException(status_code=404, detail="Assessment invitation not found or invalid token.")

    # IDOR Check: Ensure token belongs to the requesting authenticated candidate
    if invitation.candidate_id != candidate_user_id:
        raise HTTPException(status_code=403, detail="Unauthorized: This assessment invitation belongs to a different candidate.")

    if not invitation.is_valid_for_entry():
        if invitation.status == "COMPLETED":
            raise HTTPException(status_code=400, detail="This assessment invitation has already been completed.")
        elif invitation.attempts_used >= invitation.allowed_attempts:
            raise HTTPException(status_code=400, detail="Maximum assessment attempts reached.")
        else:
            raise HTTPException(status_code=400, detail="Assessment invitation has expired or been cancelled.")

    if invitation.status == "SENT":
        invitation.status = "OPENED"
        invitation.opened_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(invitation)

    return invitation
