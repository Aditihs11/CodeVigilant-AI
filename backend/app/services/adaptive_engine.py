import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.candidate_skill import CandidateSkill
from app.services.skill_mastery_service import get_or_create_candidate_skills


def rank_next_adaptive_topic(
    db: Session,
    user_id: int,
    role: str,
    asked_topics_in_session: Optional[List[str]] = None,
    resume_skills: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Deterministic & Explainable Adaptive Topic Ranking Algorithm.
    Selection Score = Topic Need + Difficulty Fit + Resume Relevance + Diversity Bonus - Repetition Penalty
    """
    skills = get_or_create_candidate_skills(db, user_id=user_id, role=role)
    asked_topics = asked_topics_in_session or []
    resume_lower = [s.lower() for s in (resume_skills or [])]

    ranked = []
    for s in skills:
        mastery = float(s.mastery_score or 50.0)
        topic_name = s.topic

        # 1. Topic Need: lower mastery -> higher need (range: 0 to 10)
        topic_need = round((100.0 - mastery) / 10.0, 2)

        # 2. Recommended Difficulty based on current mastery
        if mastery < 45.0:
            target_difficulty = "Beginner"
            diff_fit = 2.0
        elif mastery >= 75.0:
            target_difficulty = "Advanced"
            diff_fit = 2.0
        else:
            target_difficulty = "Intermediate"
            diff_fit = 2.0

        # 3. Resume Relevance (+1.5 if mentioned in resume)
        is_in_resume = any(r in topic_name.lower() or topic_name.lower() in r for r in resume_lower)
        resume_relevance = 1.5 if is_in_resume else 0.0

        # 4. Diversity Bonus & Repetition Penalty
        times_asked = asked_topics.count(topic_name)
        if times_asked == 0:
            diversity_bonus = 1.5
            repetition_penalty = 0.0
        else:
            diversity_bonus = 0.0
            repetition_penalty = times_asked * 3.5 # penalize repeating topics within same session

        # Final Deterministic Selection Score
        selection_score = round(
            topic_need + diff_fit + resume_relevance + diversity_bonus - repetition_penalty, 2
        )

        ranked.append({
            "topic": topic_name,
            "mastery": mastery,
            "target_difficulty": target_difficulty,
            "selection_score": selection_score,
            "topic_need": topic_need,
            "resume_relevance": resume_relevance,
            "times_asked": times_asked,
            "status": s.status,
            "trend": s.trend,
        })

    # Sort descending by selection score
    ranked.sort(key=lambda x: x["selection_score"], reverse=True)
    best = ranked[0]

    # Generate explainable decision rationale
    if best["times_asked"] == 0 and best["mastery"] < 60.0:
        reason = f"Targeting priority weak area '{best['topic']}' (Mastery: {best['mastery']}%)"
    elif best["times_asked"] == 0:
        reason = f"Advancing session topic coverage to '{best['topic']}' ({best['target_difficulty']} level)"
    else:
        reason = f"Re-assessing '{best['topic']}' with adjusted difficulty to confirm competency progression"

    return {
        "selected_topic": best["topic"],
        "target_difficulty": best["target_difficulty"],
        "mastery_score": best["mastery"],
        "selection_score": best["selection_score"],
        "reason": reason,
        "full_ranking": ranked,
    }
