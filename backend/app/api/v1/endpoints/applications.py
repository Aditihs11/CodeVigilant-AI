import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.application import CandidateApplication, VALID_APPLICATION_STATUSES
from app.models.resume import Resume
from app.models.interview import Interview
from app.models.hiring_audit import HiringAuditLog
from app.api.v1.endpoints.auth import oauth2_scheme
from app.api.v1.endpoints.admin import require_admin
from app.core.security import verify_token
from app.crud.user import get_user_by_id
from app.services.eligibility_service import evaluate_candidate_eligibility
from app.services.invitation_service import issue_assessment_invitation
from app.services.scoring_service import compute_deterministic_assessment_score
from app.services.shortlisting_service import evaluate_shortlisting_criteria

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


# ============================================================
# CANDIDATE APPLICATION ENDPOINTS
# ============================================================

@router.post("/apply", status_code=status.HTTP_201_CREATED)
def apply_to_job(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_authenticated_user),
):
    """Candidate submits application to a published job."""
    job_id = payload.get("job_id")
    if not job_id:
        raise HTTPException(status_code=400, detail="job_id is required")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status != "PUBLISHED":
        raise HTTPException(status_code=400, detail="Job is not open for applications")

    # Prevent duplicate application
    existing = db.query(CandidateApplication).filter(
        CandidateApplication.job_id == job.id,
        CandidateApplication.candidate_id == current_user.id,
    ).first()
    if existing:
        return {
            "message": "Application already submitted",
            "application_id": existing.id,
            "status": existing.status,
        }

    # Find latest resume
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.uploaded_at.desc()).first()

    # Instant deterministic eligibility screening
    elig_result = evaluate_candidate_eligibility(job, resume, current_user)

    app = CandidateApplication(
        job_id=job.id,
        candidate_id=current_user.id,
        resume_id=resume.id if resume else None,
        status="ELIGIBLE" if elig_result["is_eligible"] else "SCREENING",
        is_eligible=elig_result["is_eligible"],
        match_score=elig_result["match_score"],
        eligibility_decision_json=json.dumps(elig_result),
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    # Log Audit
    audit = HiringAuditLog(
        actor=current_user.email,
        action="application_submitted",
        entity_type="application",
        entity_id=app.id,
        new_state=app.status,
        details_json=json.dumps({"job_title": job.title, "match_score": elig_result["match_score"]}),
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Application submitted successfully",
        "application_id": app.id,
        "status": app.status,
        "is_eligible": app.is_eligible,
        "match_score": app.match_score,
    }


@router.get("/me", status_code=status.HTTP_200_OK)
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_authenticated_user),
):
    """Candidate views their own job applications (IDOR isolated)."""
    apps = db.query(CandidateApplication).filter(
        CandidateApplication.candidate_id == current_user.id
    ).order_by(CandidateApplication.applied_at.desc()).all()

    out = []
    for a in apps:
        job = db.query(Job).filter(Job.id == a.job_id).first()
        out.append({
            "id": a.id,
            "job_id": a.job_id,
            "job_title": job.title if job else "Unknown Position",
            "department": job.department if job else "",
            "location": job.location if job else "",
            "status": a.status,
            "applied_at": a.applied_at,
            "match_score": a.match_score,
            "is_eligible": a.is_eligible,
            "assessment_id": a.assessment_id,
            "assessment_score": a.assessment_score,
            "final_recommendation": a.final_recommendation,
        })
    return out


@router.get("/{application_id}", status_code=status.HTTP_200_OK)
def get_application_details(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_authenticated_user),
):
    """Fetches full application details (Accessible by Candidate owner or Admin)."""
    app = db.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Anti-IDOR Authorization Check
    if not current_user.is_admin and app.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this application record")

    job = db.query(Job).filter(Job.id == app.job_id).first()
    cand = db.query(User).filter(User.id == app.candidate_id).first()
    resume = db.query(Resume).filter(Resume.id == app.resume_id).first() if app.resume_id else None

    return {
        "id": app.id,
        "job_id": app.job_id,
        "job_title": job.title if job else "",
        "department": job.department if job else "",
        "candidate_id": app.candidate_id,
        "candidate_name": cand.full_name if cand else "",
        "candidate_email": cand.email if cand else "",
        "status": app.status,
        "applied_at": app.applied_at,
        "is_eligible": app.is_eligible,
        "match_score": app.match_score,
        "eligibility_details": app.get_eligibility(),
        "resume_filename": resume.filename if resume else None,
        "assessment_id": app.assessment_id,
        "technical_interview_id": app.technical_interview_id,
        "assessment_score": app.assessment_score,
        "coding_score": app.coding_score,
        "interview_score": app.interview_score,
        "weighted_composite_score": app.weighted_composite_score,
        "is_shortlisted": app.is_shortlisted,
        "shortlist_details": app.get_shortlist_details(),
        "final_recommendation": app.final_recommendation,
        "final_decision": app.final_decision,
        "final_decision_notes": app.final_decision_notes,
    }


@router.post("/{application_id}/invite", status_code=status.HTTP_200_OK)
def send_assessment_invitation(
    application_id: int,
    payload: Optional[Dict[str, Any]] = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Issues an assessment invitation for an application (Recruiter only)."""
    app = db.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    valid_hours = int(payload.get("valid_hours", 72)) if payload else 72
    invitation = issue_assessment_invitation(db, app, recruiter_email=admin_user.email, valid_hours=valid_hours)
    return {
        "message": "Assessment invitation issued",
        "invitation_token": invitation.token,
        "expires_at": invitation.expires_at,
        "status": invitation.status,
    }


@router.post("/{application_id}/score", status_code=status.HTTP_200_OK)
def evaluate_application_scoring_and_shortlist(
    application_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Computes deterministic multi-section score and evaluates shortlisting criteria."""
    app = db.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if not app.assessment_id:
        raise HTTPException(status_code=400, detail="No assessment session linked to this application")

    assessment = db.query(Interview).filter(Interview.id == app.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment session not found")

    job = db.query(Job).filter(Job.id == app.job_id).first()

    # Compute deterministic score
    score_data = compute_deterministic_assessment_score(db, assessment, job)

    # Evaluate shortlisting cutoffs
    shortlist_data = evaluate_shortlisting_criteria(job, app, score_data)

    app.assessment_score = score_data["raw_score_out_of_10"]
    app.coding_score = score_data["coding_score"]
    app.weighted_composite_score = score_data["weighted_composite_score"]
    app.is_shortlisted = shortlist_data["is_shortlisted"]
    app.shortlist_decision_json = json.dumps(shortlist_data)

    if app.is_shortlisted:
        app.status = "SHORTLISTED"
    else:
        app.status = "ASSESSMENT_COMPLETED"

    db.commit()
    db.refresh(app)

    # Audit log
    audit = HiringAuditLog(
        actor=admin_user.email,
        action="assessment_scored_and_shortlisted",
        entity_type="application",
        entity_id=app.id,
        new_state=app.status,
        details_json=json.dumps({"is_shortlisted": app.is_shortlisted, "composite_score": app.weighted_composite_score}),
    )
    db.add(audit)
    db.commit()

    return {
        "application_id": app.id,
        "scoring": score_data,
        "shortlisting": shortlist_data,
        "new_status": app.status,
    }


@router.post("/{application_id}/decision", status_code=status.HTTP_200_OK)
def record_final_hiring_decision(
    application_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Recruiter records final employment decision (Human-in-the-Loop decision)."""
    app = db.query(CandidateApplication).filter(CandidateApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    decision = payload.get("decision", "").upper() # "SELECTED", "REJECTED", "HOLD"
    if decision not in ["SELECTED", "REJECTED", "HOLD"]:
        raise HTTPException(status_code=400, detail="Decision must be 'SELECTED', 'REJECTED', or 'HOLD'")

    prev_status = app.status
    app.final_decision = decision
    app.final_decision_notes = payload.get("notes", "")
    app.final_decision_by = admin_user.email
    app.final_decision_at = datetime.now(timezone.utc)

    if decision == "SELECTED":
        app.status = "SELECTED"
    elif decision == "REJECTED":
        app.status = "REJECTED"

    db.commit()
    db.refresh(app)

    # Audit log
    audit = HiringAuditLog(
        actor=admin_user.email,
        action="final_decision_made",
        entity_type="application",
        entity_id=app.id,
        previous_state=prev_status,
        new_state=app.status,
        details_json=json.dumps({"decision": decision, "notes": app.final_decision_notes}),
    )
    db.add(audit)
    db.commit()

    return {"message": f"Final decision '{decision}' recorded successfully", "application_id": app.id, "status": app.status}
