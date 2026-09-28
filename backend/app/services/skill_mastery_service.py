import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.candidate_skill import CandidateSkill

# ============================================================
# ROLE TOPIC TAXONOMY
# ============================================================

ROLE_TOPIC_TAXONOMY = {
    "Java Developer": [
        "OOP & Core Java",
        "Collections & Generics",
        "Multithreading & Concurrency",
        "JVM Internals & GC",
        "Streams & Modern Java",
        "Spring Boot & Microservices",
    ],
    "MERN Stack Developer": [
        "React Architecture & Hooks",
        "Node.js Event Loop & Streams",
        "Express Middleware & Security",
        "MongoDB Aggregations & Indexing",
        "RESTful API & State Management",
    ],
    "Python Developer": [
        "Core Python & Data Model",
        "Asyncio & Concurrency",
        "Memory Management & GIL",
        "Decorators & Generators",
        "FastAPI & Backend Design",
    ],
    "Data Structures & Algorithms": [
        "Arrays & Hash Tables",
        "Two Pointers & Sliding Window",
        "Trees & Graphs",
        "Dynamic Programming",
        "Binary Search & Sorting",
    ],
    "Software Development Engineer (SDE)": [
        "System Architecture & Scaling",
        "Distributed Caching & Redis",
        "Database Indexing & ACID",
        "Load Balancing & Microservices",
        "Concurrency & Fault Tolerance",
    ],
}


def classify_mastery_status(mastery_score: float) -> str:
    """
    Deterministic skill status thresholds:
    0–39%: Weak
    40–59%: Developing
    60–74%: Competent
    75–89%: Strong
    90–100%: Mastered
    """
    if mastery_score >= 90.0:
        return "Mastered"
    elif mastery_score >= 75.0:
        return "Strong"
    elif mastery_score >= 60.0:
        return "Competent"
    elif mastery_score >= 40.0:
        return "Developing"
    else:
        return "Weak"


def compute_confidence_level(attempts: int) -> str:
    """Computes statistical confidence based on number of assessed attempts."""
    if attempts >= 6:
        return "High"
    elif attempts >= 3:
        return "Medium"
    else:
        return "Low"


def get_or_create_candidate_skills(
    db: Session,
    user_id: int,
    role: str,
) -> List[CandidateSkill]:
    """Ensures a baseline skill profile exists for the candidate and role."""
    clean_role = role.split("(")[0].strip()
    existing = (
        db.query(CandidateSkill)
        .filter(CandidateSkill.user_id == user_id, CandidateSkill.role == clean_role)
        .all()
    )
    if existing:
        return existing

    # Seed baseline topics for the role
    topics = ROLE_TOPIC_TAXONOMY.get(clean_role) or ROLE_TOPIC_TAXONOMY["Java Developer"]
    created_skills = []
    for t in topics:
        skill = CandidateSkill(
            user_id=user_id,
            role=clean_role,
            topic=t,
            mastery_score=50.0,
            confidence="Low",
            attempts=0,
            trend="Stable",
            status="Developing",
            history_json=json.dumps([]),
        )
        db.add(skill)
        created_skills.append(skill)

    db.commit()
    return created_skills


def update_candidate_skill_mastery(
    db: Session,
    user_id: int,
    role: str,
    topic: str,
    score_out_of_10: float,
    subtopic: Optional[str] = None,
) -> CandidateSkill:
    """
    Continual Skill Mastery update:
    - new_mastery = 0.7 * previous_mastery + 0.3 * (score * 10)
    - updates trend, confidence, attempts, and history log.
    """
    clean_role = role.split("(")[0].strip()
    normalized_score = float(score_out_of_10) * 10.0 # 0.0 - 100.0

    skill = (
        db.query(CandidateSkill)
        .filter(
            CandidateSkill.user_id == user_id,
            CandidateSkill.role == clean_role,
            CandidateSkill.topic == topic,
        )
        .first()
    )

    if not skill:
        # Fallback to fuzzy match or create
        skill = CandidateSkill(
            user_id=user_id,
            role=clean_role,
            topic=topic,
            subtopic=subtopic,
            mastery_score=50.0,
            confidence="Low",
            attempts=0,
            trend="Stable",
            status="Developing",
            history_json=json.dumps([]),
        )
        db.add(skill)
        db.flush()

    prev_mastery = float(skill.mastery_score or 50.0)

    # Weighted update formula
    if skill.attempts == 0:
        new_mastery = round(normalized_score, 1)
    else:
        new_mastery = round((0.7 * prev_mastery) + (0.3 * normalized_score), 1)

    new_mastery = max(0.0, min(100.0, new_mastery))

    # Trend calculation
    diff = new_mastery - prev_mastery
    if diff > 1.5:
        trend = "Improving"
    elif diff < -1.5:
        trend = "Declining"
    else:
        trend = "Stable"

    # Attempts & Confidence
    new_attempts = int(skill.attempts or 0) + 1
    confidence = compute_confidence_level(new_attempts)
    status = classify_mastery_status(new_mastery)

    # Append to history log
    history = json.loads(skill.history_json) if skill.history_json else []
    history.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "score": score_out_of_10,
        "mastery": new_mastery,
        "status": status,
    })

    skill.mastery_score = new_mastery
    skill.recent_score = float(score_out_of_10)
    skill.attempts = new_attempts
    skill.confidence = confidence
    skill.trend = trend
    skill.status = status
    skill.history_json = json.dumps(history[-20:]) # keep latest 20 updates

    db.commit()
    db.refresh(skill)
    return skill
