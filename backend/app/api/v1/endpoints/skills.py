import json
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.candidate_skill import CandidateSkill
from app.api.v1.endpoints.auth import get_current_user
from app.services.skill_mastery_service import get_or_create_candidate_skills

router = APIRouter()


@router.get("/me", status_code=status.HTTP_200_OK)
def get_my_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_role = current_user.target_role or "Java Developer"
    skills = get_or_create_candidate_skills(db, user_id=current_user.id, role=target_role)

    scores = [s.mastery_score for s in skills if s.mastery_score is not None]
    avg_mastery = round(sum(scores) / len(scores), 1) if scores else 50.0

    skill_tree = []
    for s in skills:
        history = json.loads(s.history_json) if s.history_json else []
        skill_tree.append({
            "id": s.id,
            "role": s.role,
            "topic": s.topic,
            "subtopic": s.subtopic,
            "mastery_score": s.mastery_score,
            "status": s.status,
            "trend": s.trend,
            "confidence": s.confidence,
            "attempts": s.attempts,
            "recent_score": s.recent_score,
            "last_updated": s.updated_at,
        })

    return {
        "user_id": current_user.id,
        "target_role": target_role,
        "overall_average_mastery": avg_mastery,
        "total_skills_tracked": len(skill_tree),
        "skills": skill_tree,
    }


@router.get("/me/history", status_code=status.HTTP_200_OK)
def get_my_skills_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_role = current_user.target_role or "Java Developer"
    skills = (
        db.query(CandidateSkill)
        .filter(CandidateSkill.user_id == current_user.id)
        .order_by(CandidateSkill.updated_at.desc())
        .all()
    )

    history_log = []
    for s in skills:
        history = json.loads(s.history_json) if s.history_json else []
        for entry in history:
            history_log.append({
                "topic": s.topic,
                "role": s.role,
                "score": entry.get("score"),
                "mastery": entry.get("mastery"),
                "status": entry.get("status"),
                "timestamp": entry.get("timestamp"),
            })

    history_log.sort(key=lambda x: x.get("timestamp") or "", reverse=True)

    return {
        "user_id": current_user.id,
        "history": history_log,
    }
