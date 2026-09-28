import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.interview import Interview
from app.models.question import Question
from app.models.interview_event import InterviewEvent
from app.services.gemini import generate_structured_json


def should_trigger_followup(
    db: Session,
    interview_id: int,
    current_question_id: int,
    candidate_answer: str,
    answer_score: float,
    max_followups_per_question: int = 1,
    max_total_questions: int = 6,
) -> Dict[str, Any]:
    """
    Decides whether a contextual follow-up question is warranted based on:
    - Current answer depth & score
    - Follow-up count limits
    - Total interview duration/question caps
    """
    # Count total events in this interview
    total_events = db.query(InterviewEvent).filter(InterviewEvent.interview_id == interview_id).count()
    if total_events >= max_total_questions:
        return {"trigger_followup": False, "reason": "Max total interview questions reached"}

    # Count existing follow-ups for this specific question
    existing_followups = db.query(InterviewEvent).filter(
        InterviewEvent.interview_id == interview_id,
        InterviewEvent.parent_event_id.isnot(None),
    ).count()

    if existing_followups >= max_followups_per_question:
        return {"trigger_followup": False, "reason": "Max follow-ups for this question reached"}

    # Evaluate answer score for follow-up type
    # If partial score (4.0 - 7.0): probe incomplete answer or ask for edge case
    # If strong score (> 7.0): ask deeper complexity/scalability trade-off
    # If very low (< 4.0): switch topic rather than getting candidate stuck
    if answer_score < 4.0:
        return {"trigger_followup": False, "reason": "Low score on topic; transitioning to alternative technical competency"}

    if 4.0 <= answer_score <= 7.0:
        followup_type = "probe_incomplete"
        reason = "Candidate demonstrated partial understanding; probing for implementation details or edge cases"
    else:
        followup_type = "trade_off"
        reason = "Candidate gave a strong answer; challenging with architectural trade-offs and scalability limits"

    return {
        "trigger_followup": True,
        "followup_type": followup_type,
        "reason": reason,
    }


def generate_contextual_followup_question(
    role: str,
    topic: str,
    original_question: str,
    candidate_response: str,
    followup_type: str,
) -> Dict[str, Any]:
    """
    Uses Gemini AI with prompt isolation to generate a grounded follow-up question.
    """
    prompt = f"""You are a senior technical interviewer for a {role} position.
The candidate was asked:
"{original_question}"

The candidate answered:
"{candidate_response}"

Follow-up Objective: {followup_type} (e.g. asking for specific edge cases, implementation trade-offs, or architectural scaling).

Generate a single focused, conversational technical follow-up question grounded strictly in their response.

Respond ONLY with valid JSON matching this schema:
{{
  "followup_question": "...",
  "focus_area": "edge_cases | complexity | trade_offs | architecture",
  "difficulty": "Intermediate | Advanced"
}}"""

    res = generate_structured_json(prompt)
    if not res or "followup_question" not in res:
        # Graceful fallback follow-up
        if followup_type == "trade_off":
            fallback_q = f"What are the main performance trade-offs and scalability limits of this approach in {topic}?"
        else:
            fallback_q = f"Can you explain how this handles concurrency, failure recovery, or edge cases in production?"
        return {
            "followup_question": fallback_q,
            "focus_area": "trade_offs",
            "difficulty": "Advanced",
        }

    return res
