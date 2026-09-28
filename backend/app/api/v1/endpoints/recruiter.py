import json
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.application import CandidateApplication
from app.models.invitation import AssessmentInvitation
from app.models.interview import Interview
from app.models.hiring_audit import HiringAuditLog
from app.models.comparison import CandidateComparisonSnapshot
from app.api.v1.endpoints.admin import require_admin
from app.services.candidate_ranking_service import compare_and_rank_candidates_for_job

router = APIRouter()


@router.get("/overview", status_code=status.HTTP_200_OK)
def get_recruiter_hiring_funnel(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Calculates overall recruitment hiring funnel metrics."""
    total_jobs = db.query(Job).count()
    active_jobs = db.query(Job).filter(Job.status == "PUBLISHED").count()
    
    total_apps = db.query(CandidateApplication).count()
    eligible_apps = db.query(CandidateApplication).filter(CandidateApplication.is_eligible == True).count()
    invited_apps = db.query(AssessmentInvitation).count()
    completed_assessments = db.query(CandidateApplication).filter(CandidateApplication.status.in_(["ASSESSMENT_COMPLETED", "SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEW_IN_PROGRESS", "INTERVIEW_COMPLETED", "SELECTED"])).count()
    shortlisted_apps = db.query(CandidateApplication).filter(CandidateApplication.is_shortlisted == True).count()
    interviewed_apps = db.query(CandidateApplication).filter(CandidateApplication.technical_interview_id.isnot(None)).count()
    selected_apps = db.query(CandidateApplication).filter(CandidateApplication.status == "SELECTED").count()
    rejected_apps = db.query(CandidateApplication).filter(CandidateApplication.status == "REJECTED").count()

    return {
        "summary": {
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "total_applications": total_apps,
            "selected_candidates": selected_apps,
        },
        "hiring_funnel": [
            {"stage": "1. Applications", "count": total_apps, "color": "#6366f1"},
            {"stage": "2. Eligible", "count": eligible_apps, "color": "#06b6d4"},
            {"stage": "3. Assessments", "count": completed_assessments, "color": "#f59e0b"},
            {"stage": "4. Shortlisted", "count": shortlisted_apps, "color": "#8b5cf6"},
            {"stage": "5. Interviewed", "count": interviewed_apps, "color": "#ec4899"},
            {"stage": "6. Selected", "count": selected_apps, "color": "#10b981"},
        ],
        "drop_offs": {
            "rejected_count": rejected_apps,
        },
    }


@router.post("/candidates/compare", status_code=status.HTTP_200_OK)
def compare_candidates_for_job(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Compares and ranks multiple candidates applying for the SAME job with configurable weights."""
    job_id = payload.get("job_id")
    if not job_id:
        raise HTTPException(status_code=400, detail="job_id is required")

    application_ids = payload.get("application_ids", [])
    if not application_ids or not isinstance(application_ids, list):
        raise HTTPException(status_code=400, detail="application_ids must be a non-empty list")

    weights = payload.get("weights")
    comparison_result = compare_and_rank_candidates_for_job(
        db=db,
        job_id=job_id,
        candidate_application_ids=application_ids,
        weights=weights,
    )

    # Save snapshot of comparison
    snap = CandidateComparisonSnapshot(
        job_id=job_id,
        created_by=admin_user.email,
        weights_json=json.dumps(comparison_result["weights_applied"]),
        comparison_data_json=json.dumps(comparison_result),
    )
    db.add(snap)
    db.commit()

    return comparison_result


@router.get("/audit-logs", status_code=status.HTTP_200_OK)
def get_hiring_audit_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Fetches chronological audit trail of all hiring workflow events."""
    logs = db.query(HiringAuditLog).order_by(HiringAuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "actor": l.actor,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "previous_state": l.previous_state,
            "new_state": l.new_state,
            "details": l.get_details(),
            "timestamp": l.timestamp,
        }
        for l in logs
    ]
