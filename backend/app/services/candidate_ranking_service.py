import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.job import Job
from app.models.application import CandidateApplication
from app.models.user import User
from app.models.interview import Interview
from app.models.resume import Resume


def compare_and_rank_candidates_for_job(
    db: Session,
    job_id: int,
    candidate_application_ids: List[int],
    weights: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """
    Computes deterministic, explainable candidate rankings for the SAME job.
    Enforces same-job constraint and weight validation (sum = 100%).
    Zero LLM hallucinated ranks.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Default weights: Skill Match (20%), Assessment (30%), Coding (25%), Interview (25%)
    if not weights:
        weights = {
            "skill_match": 20.0,
            "assessment": 30.0,
            "coding": 25.0,
            "interview": 25.0,
        }

    total_weight = sum(weights.values())
    if round(total_weight) != 100:
        raise HTTPException(status_code=400, detail=f"Weights must sum to 100% (currently sums to {total_weight}%)")

    # Fetch candidate applications
    applications = db.query(CandidateApplication).filter(
        CandidateApplication.id.in_(candidate_application_ids)
    ).all()

    # Same-Job Restriction Validation
    for app in applications:
        if app.job_id != job_id:
            raise HTTPException(
                status_code=400,
                detail=f"Candidate application #{app.id} belongs to job #{app.job_id}, not the target job #{job_id}. Cross-job ranking is prohibited."
            )

    ranked_candidates = []

    for app in applications:
        cand_user = db.query(User).filter(User.id == app.candidate_id).first()
        resume = db.query(Resume).filter(Resume.id == app.resume_id).first() if app.resume_id else None

        skill_match_pct = float(app.match_score if app.match_score is not None else 50.0)
        assessment_pct = float(app.assessment_score * 10.0 if app.assessment_score is not None else (app.weighted_composite_score or 0.0))
        coding_pct = float(app.coding_score * 10.0 if app.coding_score is not None else 0.0)
        interview_pct = float(app.interview_score * 10.0 if app.interview_score is not None else 0.0)

        # Deterministic Weighted Formula
        w_skill = weights.get("skill_match", 20.0) / 100.0
        w_assess = weights.get("assessment", 30.0) / 100.0
        w_coding = weights.get("coding", 25.0) / 100.0
        w_interview = weights.get("interview", 25.0) / 100.0

        composite_score = round(
            (skill_match_pct * w_skill) +
            (assessment_pct * w_assess) +
            (coding_pct * w_coding) +
            (interview_pct * w_interview),
            2
        )

        # Recommendation Label
        if composite_score >= 80.0 and app.is_eligible is not False:
            recommendation = "STRONG_HIRE"
        elif composite_score >= 68.0 and app.is_eligible is not False:
            recommendation = "HIRE"
        elif composite_score >= 50.0:
            recommendation = "REVIEW"
        else:
            recommendation = "NO_HIRE"

        ranked_candidates.append({
            "application_id": app.id,
            "candidate_id": app.candidate_id,
            "candidate_name": cand_user.full_name if cand_user else f"Candidate #{app.candidate_id}",
            "candidate_email": cand_user.email if cand_user else "",
            "is_eligible": app.is_eligible,
            "status": app.status,
            "metrics": {
                "skill_match_percent": skill_match_pct,
                "assessment_percent": assessment_pct,
                "coding_percent": coding_pct,
                "interview_percent": interview_pct,
            },
            "weighted_composite_score": composite_score,
            "recommendation": recommendation,
        })

    # Sort descending by composite score
    ranked_candidates.sort(key=lambda x: x["weighted_composite_score"], reverse=True)

    # Assign ranks and generate mathematical explanations
    for rank_idx, cand in enumerate(ranked_candidates, 1):
        cand["rank"] = rank_idx
        m = cand["metrics"]
        cand["explanation"] = (
            f"Rank #{rank_idx} with composite score of {cand['weighted_composite_score']}/100. "
            f"Calculated from: Skill Match ({m['skill_match_percent']}%), "
            f"Assessment ({m['assessment_percent']}%), Coding ({m['coding_percent']}%), "
            f"and Technical Interview ({m['interview_percent']}%)."
        )

    return {
        "job_id": job.id,
        "job_title": job.title,
        "weights_applied": weights,
        "total_compared": len(ranked_candidates),
        "candidates": ranked_candidates,
    }
