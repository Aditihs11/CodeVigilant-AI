import json
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.sql import func

from app.db.database import Base


class InterviewEvent(Base):
    __tablename__ = "interview_events"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="SET NULL"), nullable=True, index=True)
    
    sequence_order = Column(Integer, nullable=False, default=1)
    
    # Question Metadata
    question_text = Column(Text, nullable=False)
    topic = Column(String, nullable=True)
    difficulty = Column(String, default="Intermediate")
    question_audio_url = Column(String, nullable=True)
    
    # Candidate Response & Speech
    response_mode = Column(String, default="text") # "voice", "text", "multimodal"
    candidate_raw_transcript = Column(Text, nullable=True)
    candidate_final_text = Column(Text, nullable=True)
    candidate_audio_duration_seconds = Column(Float, nullable=True)
    
    # Response Time & Latency
    question_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    response_timestamp = Column(DateTime(timezone=True), nullable=True)
    response_latency_seconds = Column(Float, nullable=True)
    
    # AI Evaluation Breakdown
    score = Column(Float, nullable=True) # 0-10
    evaluation_json = Column(Text, nullable=True) # {feedback, strengths, improvements, depth_score, communication_score}
    
    # Follow-up & Adaptive Links
    is_follow_up = Column(Boolean, default=False)
    parent_event_id = Column(Integer, ForeignKey("interview_events.id", ondelete="SET NULL"), nullable=True)
    follow_up_reason = Column(String, nullable=True) # "probe_incomplete", "clarification", "edge_case", "trade_off", "complexity"
    adaptive_decision = Column(String, nullable=True) # "promote_difficulty", "demote_difficulty", "change_topic", "revisit_weakness"

    def get_evaluation(self):
        if not self.evaluation_json:
            return {}
        try:
            return json.loads(self.evaluation_json)
        except Exception:
            return {}
