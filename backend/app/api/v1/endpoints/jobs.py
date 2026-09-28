import json
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.application import CandidateApplication
from app.api.v1.endpoints.auth import oauth2_scheme
from app.api.v1.endpoints.admin import require_admin
from app.core.security import verify_token
from app.crud.user import get_user_by_id
from app.services.job_service import create_job, update_job_status, validate_assessment_config

router = APIRouter()


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = verify_token(token)
        if not payload:
            return None
        user_id = int(payload.get("sub"))
        return get_user_by_id(db, user_id)
    except Exception:
        return None


# ============================================================
# JOB ENDPOINTS
# ============================================================

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_new_job(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Creates a new job requisition with assessment configuration (Recruiter / Admin only)."""
    return create_job(db, payload, recruiter_email=admin_user.email)


@router.get("/", status_code=status.HTTP_200_OK)
def list_jobs(
    status_filter: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Lists published jobs for candidates or all jobs for recruiters."""
    query = db.query(Job)
    if status_filter:
        query = query.filter(Job.status == status_filter.upper())
    else:
        query = query.filter(Job.status.in_(["PUBLISHED", "DRAFT", "CLOSED"]))
    
    if department:
        query = query.filter(Job.department.ilike(f"%{department}%"))

    jobs = query.order_by(Job.created_at.desc()).all()

    out = []
    for j in jobs:
        app_count = db.query(CandidateApplication).filter(CandidateApplication.job_id == j.id).count()
        out.append({
            "id": j.id,
            "title": j.title,
            "department": j.department,
            "description": j.description,
            "experience_level": j.experience_level,
            "min_experience_years": j.min_experience_years,
            "location": j.location,
            "workplace_type": j.workplace_type,
            "employment_type": j.employment_type,
            "openings_count": j.openings_count,
            "status": j.status,
            "required_skills": j.get_required_skills(),
            "preferred_skills": j.get_preferred_skills(),
            "assessment_config": j.get_assessment_config(),
            "total_applications": app_count,
            "created_by": j.created_by,
            "created_at": j.created_at,
            "updated_at": j.updated_at,
        })
    return out


@router.get("/{job_id}", status_code=status.HTTP_200_OK)
def get_job_by_id(
    job_id: int,
    db: Session = Depends(get_db),
):
    """Fetches job details."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    app_count = db.query(CandidateApplication).filter(CandidateApplication.job_id == job.id).count()
    return {
        "id": job.id,
        "title": job.title,
        "department": job.department,
        "description": job.description,
        "experience_level": job.experience_level,
        "min_experience_years": job.min_experience_years,
        "education_requirements": job.education_requirements,
        "location": job.location,
        "workplace_type": job.workplace_type,
        "employment_type": job.employment_type,
        "openings_count": job.openings_count,
        "status": job.status,
        "required_skills": job.get_required_skills(),
        "preferred_skills": job.get_preferred_skills(),
        "assessment_duration_minutes": job.assessment_duration_minutes,
        "min_qualifying_score": job.min_qualifying_score,
        "interview_required": job.interview_required,
        "coding_required": job.coding_required,
        "assessment_config": job.get_assessment_config(),
        "total_applications": app_count,
        "created_by": job.created_by,
        "created_at": job.created_at,
        "updated_at": job.updated_at,
    }


@router.put("/{job_id}", status_code=status.HTTP_200_OK)
def update_job(
    job_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Updates job specifications and assessment configuration."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if "assessment_config" in payload:
        is_valid, errs = validate_assessment_config(payload["assessment_config"])
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Invalid assessment config: {'; '.join(errs)}")
        job.assessment_config_json = json.dumps(payload["assessment_config"])

    if "title" in payload:
        job.title = payload["title"]
    if "department" in payload:
        job.department = payload["department"]
    if "description" in payload:
        job.description = payload["description"]
    if "required_skills" in payload:
        job.required_skills_json = json.dumps(payload["required_skills"])
    if "preferred_skills" in payload:
        job.preferred_skills_json = json.dumps(payload["preferred_skills"])
    if "min_experience_years" in payload:
        job.min_experience_years = float(payload["min_experience_years"])
    if "status" in payload:
        update_job_status(db, job, payload["status"], admin_user.email)

    db.commit()
    db.refresh(job)
    return {"message": "Job updated successfully", "id": job.id, "status": job.status}


@router.post("/{job_id}/publish", status_code=status.HTTP_200_OK)
def publish_job(
    job_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return update_job_status(db, job, "PUBLISHED", admin_user.email)


@router.post("/{job_id}/close", status_code=status.HTTP_200_OK)
def close_job(
    job_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return update_job_status(db, job, "CLOSED", admin_user.email)
