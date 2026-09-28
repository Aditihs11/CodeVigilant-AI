import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.job import Job
from app.models.hiring_audit import HiringAuditLog


VALID_JOB_STATUSES = ["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]


def validate_assessment_config(config: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validates job-specific assessment configuration:
    - Non-negative durations
    - Valid question counts
    - Weights sum to 100% if multiple sections are configured
    - Valid cutoffs between 0 and 100
    """
    errors = []
    if not isinstance(config, dict):
        return False, ["assessment_config must be an object"]

    sections_raw = config.get("sections", [])
    if isinstance(sections_raw, dict):
        sections = []
        for k, v in sections_raw.items():
            if isinstance(v, dict):
                s_obj = dict(v)
                if "name" not in s_obj:
                    s_obj["name"] = k.replace("_", " ").title()
                if "questions" not in s_obj and "marks" in s_obj:
                    s_obj["questions"] = s_obj["marks"]
                elif "questions" not in s_obj:
                    s_obj["questions"] = 5
                sections.append(s_obj)
        config["sections"] = sections
    elif isinstance(sections_raw, list):
        sections = sections_raw
    else:
        return False, ["Assessment must have at least one section"]

    if not sections:
        return False, ["Assessment must have at least one section"]

    total_weight = 0
    for idx, s in enumerate(sections):
        if not s.get("name"):
            errors.append(f"Section #{idx+1} is missing a name")
        q_count = s.get("questions", s.get("marks", s.get("question_count", 5)))
        s["questions"] = q_count
        if not isinstance(q_count, int) or q_count <= 0:
            errors.append(f"Section '{s.get('name', idx)}' question count must be a positive integer")
        
        weight = s.get("weight", 0)
        if not isinstance(weight, (int, float)) or weight < 0:
            errors.append(f"Section '{s.get('name', idx)}' weight must be non-negative")
        else:
            total_weight += weight

        min_score = s.get("min_score", 0)
        if not isinstance(min_score, (int, float)) or min_score < 0 or min_score > 100:
            errors.append(f"Section '{s.get('name', idx)}' min_score must be between 0 and 100")

    # If weights are defined across sections, verify sum equals 100%
    if len(sections) > 1 and round(total_weight) != 100:
        errors.append(f"Section weights must sum to 100% (currently sums to {total_weight}%)")

    overall_cutoff = config.get("overall_cutoff", 60)
    if not isinstance(overall_cutoff, (int, float)) or overall_cutoff < 0 or overall_cutoff > 100:
        errors.append("overall_cutoff must be between 0 and 100")

    return len(errors) == 0, errors


def create_job(db: Session, payload: Dict[str, Any], recruiter_email: str) -> Job:
    title = payload.get("title")
    if not title:
        raise HTTPException(status_code=400, detail="Job title is required")

    config = payload.get("assessment_config", {})
    if config:
        is_valid, errs = validate_assessment_config(config)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Invalid assessment config: {'; '.join(errs)}")

    req_skills = payload.get("required_skills", [])
    pref_skills = payload.get("preferred_skills", [])

    job = Job(
        title=title,
        department=payload.get("department", "Engineering"),
        description=payload.get("description", "Software Engineering Role"),
        required_skills_json=json.dumps(req_skills) if isinstance(req_skills, list) else json.dumps([]),
        preferred_skills_json=json.dumps(pref_skills) if isinstance(pref_skills, list) else json.dumps([]),
        experience_level=payload.get("experience_level", "Mid-Level"),
        min_experience_years=float(payload.get("min_experience_years", 2.0)),
        education_requirements=payload.get("education_requirements", "Bachelor's Degree"),
        location=payload.get("location", "Remote"),
        workplace_type=payload.get("workplace_type", "Remote"),
        employment_type=payload.get("employment_type", "Full-Time"),
        openings_count=int(payload.get("openings_count", 1)),
        assessment_duration_minutes=int(payload.get("assessment_duration_minutes", 45)),
        min_qualifying_score=float(payload.get("min_qualifying_score", 6.0)),
        interview_required=bool(payload.get("interview_required", True)),
        coding_required=bool(payload.get("coding_required", True)),
        assessment_config_json=json.dumps(config) if config else None,
        status=payload.get("status", "DRAFT").upper(),
        created_by=recruiter_email,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Log Audit
    audit = HiringAuditLog(
        actor=recruiter_email,
        action="job_created",
        entity_type="job",
        entity_id=job.id,
        new_state=job.status,
        details_json=json.dumps({"title": job.title, "department": job.department}),
    )
    db.add(audit)
    db.commit()

    return job


def update_job_status(db: Session, job: Any, new_status: str, recruiter_email: Optional[str] = "system") -> Job:
    if isinstance(job, int):
        job_obj = db.query(Job).filter(Job.id == job).first()
        if not job_obj:
            raise HTTPException(status_code=404, detail="Job not found")
        job = job_obj

    new_status = new_status.upper()
    if new_status not in VALID_JOB_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid job status '{new_status}'")

    prev_status = job.status
    job.status = new_status
    job.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(job)

    audit = HiringAuditLog(
        actor=recruiter_email,
        action="job_status_updated",
        entity_type="job",
        entity_id=job.id,
        previous_state=prev_status,
        new_state=new_status,
        details_json=json.dumps({"title": job.title}),
    )
    db.add(audit)
    db.commit()

    return job
