from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.crud.interview import (
    create_interview,
    get_interview,
    get_user_interviews,
)
from app.schemas.interview import (
    InterviewCreate,
    InterviewResponse,
)
from app.models.interview import Interview
from app.models.answer import Answer
from app.models.question import Question
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User


router = APIRouter()


# ============================================================
# CREATE INTERVIEW
# ============================================================

@router.post(
    "/",
    response_model=InterviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_interview(
    interview_data: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_interview(
        db=db,
        user_id=current_user.id,
        role=interview_data.role,
    )


# ============================================================
# GET USER INTERVIEWS
# ============================================================

@router.get(
    "/",
    response_model=List[InterviewResponse],
)
def list_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_user_interviews(
        db=db,
        user_id=current_user.id,
    )


# ============================================================
# GET ANALYTICS SUMMARY
# Note: Placed before /{interview_id} to avoid path collision
# ============================================================

@router.get(
    "/analytics/summary",
    response_model=Dict[str, Any],
)
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == current_user.id)
        .order_by(Interview.created_at.asc())
        .all()
    )

    total_interviews = len(interviews)
    completed_interviews = [i for i in interviews if i.status == "completed" or (i.score is not None and i.score > 0)]
    completed_count = len(completed_interviews)

    scores = [i.score for i in completed_interviews if i.score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    best_score = max(scores) if scores else 0

    # Score timeline for charts
    score_history = []
    for i in interviews:
        if i.score is not None:
            score_history.append({
                "interview_id": i.id,
                "role": i.role,
                "score": i.score,
                "date": i.created_at.strftime("%b %d") if i.created_at else "Recent",
                "status": i.status,
            })

    # Role-based breakdown
    roles_map: Dict[str, Dict[str, Any]] = {}
    for i in interviews:
        role = i.role
        if role not in roles_map:
            roles_map[role] = {"role": role, "total": 0, "completed": 0, "scores": []}
        roles_map[role]["total"] += 1
        if i.score is not None:
            roles_map[role]["completed"] += 1
            roles_map[role]["scores"].append(i.score)

    role_performance = []
    for role, data in roles_map.items():
        role_scores = data["scores"]
        role_avg = round(sum(role_scores) / len(role_scores), 1) if role_scores else 0.0
        role_best = max(role_scores) if role_scores else 0
        role_performance.append({
            "role": role,
            "total_interviews": data["total"],
            "completed_interviews": data["completed"],
            "average_score": role_avg,
            "best_score": role_best,
        })

    # Recent 5 interviews
    recent = sorted(interviews, key=lambda x: x.created_at if x.created_at else "", reverse=True)[:5]
    recent_interviews = [
        {
            "id": i.id,
            "role": i.role,
            "status": i.status,
            "score": i.score,
            "created_at": i.created_at.isoformat() if i.created_at else None,
        }
        for i in recent
    ]

    return {
        "total_interviews": total_interviews,
        "completed_interviews": completed_count,
        "average_score": avg_score,
        "best_score": best_score,
        "score_history": score_history,
        "role_performance": role_performance,
        "recent_interviews": recent_interviews,
    }


# ============================================================
# GET SINGLE INTERVIEW
# ============================================================

@router.get(
    "/{interview_id}",
    response_model=InterviewResponse,
)
def get_single_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interview = get_interview(
        db=db,
        interview_id=interview_id,
        user_id=current_user.id,
    )

    if interview is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found",
        )

    return interview