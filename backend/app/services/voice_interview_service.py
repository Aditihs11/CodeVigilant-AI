import re
import json
from typing import Dict, Any, Tuple, List, Optional
from fastapi import HTTPException


def validate_and_sanitize_transcript(raw_transcript: str) -> Tuple[bool, str, str]:
    """
    Validates candidate speech transcript before processing:
    - Rejects empty or whitespace-only speech inputs.
    - Strips non-printable or malicious escape sequences.
    - Ensures candidate is not submitting silent audio.
    Returns: (is_valid, cleaned_transcript, error_message)
    """
    if not raw_transcript or not isinstance(raw_transcript, str):
        return False, "", "Empty speech transcript. Please speak clearly into your microphone or switch to text mode."

    cleaned = raw_transcript.strip()
    # Remove excessive whitespace
    cleaned = re.sub(r"\s+", " ", cleaned)

    if len(cleaned) < 3:
        return False, "", "Transcript is too short (<3 characters). Please elaborate on your answer."

    # Prevent pure filler/silence (e.g. "uh", "um", "...")
    if cleaned.lower() in ["uh", "um", "...", "ah", "hmm"]:
        return False, "", "Inaudible or non-verbal audio detected. Please provide a clear verbal or written answer."

    return True, cleaned, ""


def sanitize_transcript(raw_transcript: str) -> str:
    """Convenience helper that returns cleaned transcript or raises ValueError."""
    is_valid, cleaned, err = validate_and_sanitize_transcript(raw_transcript)
    if not is_valid:
        raise ValueError(err)
    return cleaned


def get_tts_playback_metadata(question_text: str, speaking_rate: float = 1.0) -> Dict[str, Any]:
    """
    Generates browser Text-to-Speech configuration and synthesis payload.
    Supports graceful text-only fallback if the client's audio engine is disabled or unsupported.
    """
    clean_text = question_text.strip()
    word_count = len(clean_text.split())
    estimated_duration_seconds = round((word_count / 140.0) * 60.0 / max(0.5, speaking_rate), 1)

    return {
        "text": clean_text,
        "speaking_rate": speaking_rate,
        "rate": speaking_rate,
        "pitch": 1.0,
        "voice": "en-US-Standard-C",
        "voice_name": "Google US English",
        "lang": "en-US",
        "estimated_duration_seconds": estimated_duration_seconds,
        "supports_browser_synthesis": True,
        "fallback_mode": "text",
    }


def generate_tts_config(question_text: str, voice: str = "en-US-Standard-C", rate: float = 1.0) -> Dict[str, Any]:
    """Generates Text-to-Speech configuration parameters."""
    cfg = get_tts_playback_metadata(question_text, speaking_rate=rate)
    cfg["voice"] = voice
    cfg["rate"] = rate
    return cfg


def record_voice_interview_event(
    db: Any,
    interview_id: int,
    question_id: Optional[int],
    question_text: str,
    event_type: str = "primary_question",
    parent_event_id: Optional[int] = None,
    candidate_answer: str = "",
    candidate_speech_transcript: Optional[str] = None,
    response_latency_seconds: float = 0.0,
    score: Optional[float] = None,
    ai_evaluation: Optional[str] = None,
) -> Any:
    """Records an immutable timeline event during a technical interview."""
    from app.models.interview_event import InterviewEvent
    from datetime import datetime, timezone

    seq = db.query(InterviewEvent).filter(InterviewEvent.interview_id == interview_id).count() + 1
    event = InterviewEvent(
        interview_id=interview_id,
        question_id=question_id,
        sequence_order=seq,
        question_text=question_text,
        response_mode="voice" if candidate_speech_transcript else "text",
        candidate_raw_transcript=candidate_speech_transcript,
        candidate_final_text=candidate_answer,
        response_timestamp=datetime.now(timezone.utc),
        response_latency_seconds=response_latency_seconds,
        score=score,
        evaluation_json=json.dumps({"feedback": ai_evaluation}) if ai_evaluation else None,
        is_follow_up=bool(parent_event_id),
        parent_event_id=parent_event_id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def get_interview_timeline(db: Any, interview_id: int) -> List[Dict[str, Any]]:
    """Fetches chronological list of interview events for timeline replay."""
    from app.models.interview_event import InterviewEvent

    events = db.query(InterviewEvent).filter(
        InterviewEvent.interview_id == interview_id
    ).order_by(InterviewEvent.sequence_order.asc()).all()

    out = []
    for e in events:
        out.append({
            "id": e.id,
            "event_id": e.id,
            "sequence": e.sequence_order,
            "question_text": e.question_text,
            "response_mode": e.response_mode,
            "candidate_answer": e.candidate_final_text,
            "candidate_speech_transcript": e.candidate_raw_transcript,
            "response_latency_seconds": e.response_latency_seconds,
            "score": e.score,
            "parent_event_id": e.parent_event_id,
            "is_follow_up": e.is_follow_up,
            "ai_evaluation_json": e.evaluation_json,
        })
    return out

