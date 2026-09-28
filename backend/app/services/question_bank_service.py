import hashlib
import json
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.question_bank import QuestionBank
from app.models.question import Question
from app.models.interview import Interview


def _normalize_text(text: str) -> str:
    """Normalizes question text for duplicate detection by stripping punctuation and casing."""
    return re.sub(r'\W+', '', text.lower().strip())


def compute_question_hash(text: str) -> str:
    """Generates SHA-256 hash of normalized text for instant exact duplicate matching."""
    norm = _normalize_text(text)
    return hashlib.sha256(norm.encode('utf-8')).hexdigest()


def calculate_jaccard_similarity(text1: str, text2: str) -> float:
    """Calculates word-level Jaccard similarity between two question strings."""
    words1 = set(re.findall(r'\w+', text1.lower()))
    words2 = set(re.findall(r'\w+', text2.lower()))
    if not words1 or not words2:
        return 0.0
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / len(union)


def is_duplicate_question(
    db: Session,
    question_text: str,
    role: str,
    user_id: Optional[int] = None,
    similarity_threshold: float = 0.75,
) -> bool:
    """
    Checks if a question is an exact duplicate or semantically similar to:
    1. An existing entry in the Question Bank.
    2. Any question previously served to this specific candidate.
    """
    q_hash = compute_question_hash(question_text)

    # 1. Exact hash check in QuestionBank
    exact_bank = db.query(QuestionBank).filter(QuestionBank.normalized_hash == q_hash).first()
    if exact_bank:
        return True

    # 2. Check candidate's past interview history to avoid repeat questions
    if user_id:
        user_past_questions = (
            db.query(Question.question_text)
            .join(Interview, Interview.id == Question.interview_id)
            .filter(Interview.user_id == user_id)
            .all()
        )
        for past_q in user_past_questions:
            past_text = past_q[0]
            if compute_question_hash(past_text) == q_hash:
                return True
            if calculate_jaccard_similarity(question_text, past_text) >= similarity_threshold:
                return True

    return False


def save_to_question_bank(
    db: Session,
    role: str,
    question_text: str,
    question_type: str = "text",
    topic: Optional[str] = None,
    difficulty: str = "Intermediate",
    options: Optional[List[str]] = None,
    correct_answer: Optional[int] = None,
    explanation: Optional[str] = None,
    coding_metadata: Optional[Dict[str, Any]] = None,
) -> QuestionBank:
    """
    Saves a verified, high-quality question into the persistent Question Bank for future reuse.
    """
    q_hash = compute_question_hash(question_text)
    existing = db.query(QuestionBank).filter(QuestionBank.normalized_hash == q_hash).first()
    if existing:
        existing.usage_count += 1
        db.commit()
        return existing

    qb_item = QuestionBank(
        role=role,
        topic=topic or "Core Technical",
        difficulty=difficulty,
        question_type=question_type,
        question_text=question_text,
        options_json=json.dumps(options) if options else None,
        correct_answer=correct_answer,
        explanation=explanation,
        coding_metadata_json=json.dumps(coding_metadata) if coding_metadata else None,
        source="gemini",
        usage_count=1,
        normalized_hash=q_hash,
    )
    db.add(qb_item)
    db.commit()
    db.refresh(qb_item)
    return qb_item
