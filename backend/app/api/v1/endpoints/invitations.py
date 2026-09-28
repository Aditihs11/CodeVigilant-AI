import json
from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.application import CandidateApplication
from app.models.invitation import AssessmentInvitation
from app.models.interview import Interview
from app.models.question import Question
from app.api.v1.endpoints.auth import oauth2_scheme
from app.core.security import verify_token
from app.crud.user import get_user_by_id
from app.services.invitation_service import verify_and_claim_invitation

router = APIRouter()


def get_authenticated_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = int(payload.get("sub"))
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.get("/{token}/verify", status_code=status.HTTP_200_OK)
def verify_assessment_token(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_authenticated_user),
):
    """Verifies invitation token and returns assessment specifications."""
    invitation = verify_and_claim_invitation(db, token, current_user.id)
    job = db.query(Job).filter(Job.id == invitation.job_id).first()
    app = db.query(CandidateApplication).filter(CandidateApplication.id == invitation.application_id).first()

    return {
        "valid": True,
        "token": invitation.token,
        "job_id": job.id if job else None,
        "job_title": job.title if job else "Technical Assessment",
        "duration_minutes": job.assessment_duration_minutes if job else 45,
        "assessment_config": job.get_assessment_config() if job else {},
        "expires_at": invitation.expires_at,
        "attempts_used": invitation.attempts_used,
        "allowed_attempts": invitation.allowed_attempts,
        "application_status": app.status if app else "INVITED",
        "existing_assessment_id": invitation.assessment_id,
    }


@router.post("/{token}/start", status_code=status.HTTP_200_OK)
def start_invited_assessment(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_authenticated_user),
):
    """Claims invitation token, increments attempt count, and launches or links the assessment session."""
    invitation = verify_and_claim_invitation(db, token, current_user.id)
    job = db.query(Job).filter(Job.id == invitation.job_id).first()
    app = db.query(CandidateApplication).filter(CandidateApplication.id == invitation.application_id).first()

    # If already created, return existing
    if invitation.assessment_id:
        existing_assessment = db.query(Interview).filter(Interview.id == invitation.assessment_id).first()
        if existing_assessment:
            return {
                "message": "Resuming existing assessment session",
                "assessment_id": existing_assessment.id,
                "role": existing_assessment.role,
                "status": existing_assessment.status,
            }

    # Create new Interview session configured for the job
    assessment = Interview(
        user_id=current_user.id,
        role=job.title if job else "Technical Assessment",
        assessment_type="mcq" if not job.coding_required else "interview",
        difficulty="Intermediate",
        time_limit_minutes=job.assessment_duration_minutes if job else 45,
        started_at=datetime.now(timezone.utc),
        status="in_progress",
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # Link to invitation and application
    invitation.assessment_id = assessment.id
    invitation.status = "STARTED"
    invitation.started_at = datetime.now(timezone.utc)
    invitation.attempts_used += 1

    if app:
        app.assessment_id = assessment.id
        app.status = "ASSESSMENT_IN_PROGRESS"

    db.commit()

    return {
        "message": "Assessment session started successfully",
        "assessment_id": assessment.id,
        "job_title": job.title if job else "Technical Assessment",
        "duration_minutes": assessment.time_limit_minutes,
        "status": assessment.status,
    }
