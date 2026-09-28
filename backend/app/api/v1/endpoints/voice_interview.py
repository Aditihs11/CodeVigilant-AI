import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.interview import Interview
from app.models.question import Question
from app.models.answer import Answer
from app.models.interview_event import InterviewEvent
from app.api.v1.endpoints.auth import oauth2_scheme
from app.core.security import verify_token
from app.crud.user import get_user_by_id
from app.services.voice_interview_service import validate_and_sanitize_transcript, get_tts_playback_metadata
from app.services.gemini import evaluate_answer
from app.services.adaptive_followup_service import should_trigger_followup, generate_contextual_followup_question

router = APIRouter()


def get_authenticated_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = int(payload.get("sub"))
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/{interview_id}/voice/tts", status_code=status.HTTP_200_OK)
def get_question_tts(
    interview_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_authenticated_user),
):
    """Generates Text-to-Speech metadata and synthesis configuration for a question."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if not current_user.is_admin and interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to interview")

    question_text = payload.get("question_text", "")
    if not question_text:
        question_id = payload.get("question_id")
        if question_id:
            q = db.query(Question).filter(Question.id == question_id).first()
            if q:
                question_text = q.question_text

    if not question_text:
        raise HTTPException(status_code=400, detail="question_text or question_id required")

    rate = float(payload.get("speaking_rate", 1.0))
    return get_tts_playback_metadata(question_text, speaking_rate=rate)


@router.post("/{interview_id}/voice/transcribe", status_code=status.HTTP_200_OK)
def transcribe_candidate_speech(
    interview_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_authenticated_user),
):
    """Validates and processes candidate speech transcript from browser Speech-to-Text."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if not current_user.is_admin and interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to interview")

    raw_transcript = payload.get("raw_transcript", "")
    is_valid, clean_transcript, error_msg = validate_and_sanitize_transcript(raw_transcript)

    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    return {
        "valid": True,
        "transcript": clean_transcript,
        "word_count": len(clean_transcript.split()),
    }


@router.post("/{interview_id}/voice/answer", status_code=status.HTTP_200_OK)
def submit_voice_or_text_answer(
    interview_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_authenticated_user),
):
    """
    Submits candidate voice or text answer, evaluates with AI rubric, records structured InterviewEvent,
    and determines adaptive follow-up question.
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if not current_user.is_admin and interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to interview")

    question_id = payload.get("question_id")
    answer_text = payload.get("answer_text", "")
    response_mode = payload.get("response_mode", "text") # "voice", "text", "multimodal"
    latency_seconds = float(payload.get("response_latency_seconds", 15.0))
    parent_event_id = payload.get("parent_event_id")

    # If voice, validate non-empty transcript
    if response_mode == "voice":
        is_val, clean_ans, err_msg = validate_and_sanitize_transcript(answer_text)
        if not is_val:
            raise HTTPException(status_code=400, detail=err_msg)
        answer_text = clean_ans

    # Fetch Question
    question = db.query(Question).filter(Question.id == question_id).first()
    question_text = question.question_text if question else payload.get("question_text", "Technical Question")
    topic = question.topic if question else "Technical Knowledge"
    difficulty = question.difficulty if question else "Intermediate"

    # Evaluate answer using Gemini
    eval_result = evaluate_answer(
        role=interview.role,
        question=question_text,
        answer=answer_text,
        difficulty=difficulty,
    )
    score = float(eval_result.get("score", 7.0))

    # Save to Answer table for backward compatibility
    existing_ans = db.query(Answer).filter(
        Answer.interview_id == interview.id,
        Answer.question_id == question_id,
    ).first()

    if existing_ans:
        existing_ans.answer_text = answer_text
        existing_ans.score = score
        existing_ans.feedback = eval_result.get("feedback", "")
        existing_ans.strengths = eval_result.get("strengths", "")
        existing_ans.improvements = eval_result.get("improvements", "")
        existing_ans.topic = topic
    else:
        new_ans = Answer(
            interview_id=interview.id,
            question_id=question_id,
            answer_text=answer_text,
            score=score,
            feedback=eval_result.get("feedback", ""),
            strengths=eval_result.get("strengths", ""),
            improvements=eval_result.get("improvements", ""),
            topic=topic,
        )
        db.add(new_ans)

    # Sequence Order
    seq = db.query(InterviewEvent).filter(InterviewEvent.interview_id == interview.id).count() + 1

    # Record Structured Interview Event
    event = InterviewEvent(
        interview_id=interview.id,
        question_id=question_id,
        sequence_order=seq,
        question_text=question_text,
        topic=topic,
        difficulty=difficulty,
        response_mode=response_mode,
        candidate_raw_transcript=answer_text if response_mode == "voice" else None,
        candidate_final_text=answer_text,
        response_timestamp=datetime.now(timezone.utc),
        response_latency_seconds=latency_seconds,
        score=score,
        evaluation_json=json.dumps(eval_result),
        is_follow_up=bool(parent_event_id),
        parent_event_id=parent_event_id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Check Follow-Up Decision
    followup_decision = should_trigger_followup(
        db=db,
        interview_id=interview.id,
        current_question_id=question_id or event.id,
        candidate_answer=answer_text,
        answer_score=score,
    )

    followup_question_data = None
    if followup_decision["trigger_followup"]:
        followup_type = followup_decision["followup_type"]
        followup_question_data = generate_contextual_followup_question(
            role=interview.role,
            topic=topic,
            original_question=question_text,
            candidate_response=answer_text,
            followup_type=followup_type,
        )
        event.adaptive_decision = f"trigger_followup:{followup_type}"
        event.follow_up_reason = followup_decision["reason"]
        db.commit()

    return {
        "event_id": event.id,
        "score": score,
        "feedback": eval_result.get("feedback"),
        "strengths": eval_result.get("strengths"),
        "improvements": eval_result.get("improvements"),
        "follow_up": followup_question_data,
        "parent_event_id": event.id if followup_question_data else None,
    }


@router.get("/{interview_id}/replay", status_code=status.HTTP_200_OK)
def get_interview_replay_timeline(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_authenticated_user),
):
    """Returns complete question-by-question interview timeline events for interview replay."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    # Authorization Check
    if not current_user.is_admin and interview.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to interview replay")

    events = db.query(InterviewEvent).filter(
        InterviewEvent.interview_id == interview.id
    ).order_by(InterviewEvent.sequence_order.asc()).all()

    timeline = []
    for e in events:
        timeline.append({
            "event_id": e.id,
            "sequence": e.sequence_order,
            "question_text": e.question_text,
            "topic": e.topic,
            "difficulty": e.difficulty,
            "response_mode": e.response_mode,
            "candidate_transcript": e.candidate_raw_transcript or e.candidate_final_text,
            "candidate_response": e.candidate_final_text,
            "latency_seconds": e.response_latency_seconds,
            "score": e.score,
            "evaluation": e.get_evaluation(),
            "is_follow_up": e.is_follow_up,
            "parent_event_id": e.parent_event_id,
            "follow_up_reason": e.follow_up_reason,
            "adaptive_decision": e.adaptive_decision,
            "timestamp": e.question_timestamp,
        })

    return {
        "interview_id": interview.id,
        "role": interview.role,
        "status": interview.status,
        "final_score": interview.score,
        "total_events": len(timeline),
        "timeline": timeline,
    }
