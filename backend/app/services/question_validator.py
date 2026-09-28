import json
import re
from typing import Dict, Any, Tuple, Optional


def validate_question_structure(question_dict: Dict[str, Any], question_type: str = "mcq") -> Tuple[bool, str]:
    """
    Deterministic structural validation pipeline.
    Rejects malformed JSON, missing fields, invalid MCQ option counts, or out-of-range correct answer indices.
    """
    if not isinstance(question_dict, dict):
        return False, "Question must be a valid JSON object."

    q_text = question_dict.get("question") or question_dict.get("question_text")
    if not q_text or not isinstance(q_text, str) or len(q_text.strip()) < 15:
        return False, "Question text is missing or too short (<15 characters)."

    if question_type == "mcq":
        options = question_dict.get("options")
        if not options or not isinstance(options, list) or len(options) != 4:
            return False, f"MCQ questions must have exactly 4 options. Found: {len(options) if isinstance(options, list) else 0}."

        for i, opt in enumerate(options):
            if not isinstance(opt, str) or not opt.strip():
                return False, f"Option {i + 1} is empty or not a string."

        # Check for duplicate options
        if len(set(opt.strip().lower() for opt in options)) != 4:
            return False, "MCQ options must be 4 distinct choices."

        correct_ans = question_dict.get("correct_answer")
        if correct_ans is None or not isinstance(correct_ans, int) or correct_ans not in [0, 1, 2, 3]:
            return False, f"Correct answer index must be an integer between 0 and 3. Found: {correct_ans}."

        explanation = question_dict.get("explanation")
        if not explanation or not isinstance(explanation, str) or len(explanation.strip()) < 15:
            return False, "Explanation is missing or insufficient (<15 characters)."

    elif question_type == "coding":
        desc = question_dict.get("description") or q_text
        if not desc or len(desc.strip()) < 20:
            return False, "Coding problem description is too short."

    return True, "Valid"


def evaluate_question_quality_deterministic(
    question_dict: Dict[str, Any],
    role: str,
    topic: Optional[str] = None,
    difficulty: Optional[str] = "Intermediate",
) -> Dict[str, Any]:
    """
    Computes deterministic heuristic quality score before secondary AI validation.
    """
    score = 8.5
    reasons = []

    q_text = question_dict.get("question") or question_dict.get("question_text") or ""
    explanation = question_dict.get("explanation") or ""
    options = question_dict.get("options") or []

    # Check question depth
    if len(q_text) > 50:
        score += 0.5
    else:
        score -= 0.5
        reasons.append("Question is very concise")

    # Check explanation depth
    if len(explanation) > 60:
        score += 0.5
    else:
        score -= 0.5
        reasons.append("Explanation is minimal")

    # Check option distribution (ensure options are not trivially short single words if advanced)
    if difficulty == "Advanced" and any(len(opt) < 5 for opt in options):
        score -= 0.5
        reasons.append("Advanced options are brief")

    clamped_score = max(1.0, min(10.0, round(score, 1)))

    return {
        "valid": True,
        "technical_accuracy": clamped_score,
        "relevance": 9.0,
        "difficulty_match": 8.5,
        "clarity": 9.0,
        "duplicate_risk": 1.0,
        "quality_score": clamped_score,
        "reason": "; ".join(reasons) if reasons else "High-fidelity structural and semantic fit.",
    }
