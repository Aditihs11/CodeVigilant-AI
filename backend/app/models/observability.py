import uuid
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean, BigInteger
from sqlalchemy.sql import func

from app.db.database import Base


class AIRequestLog(Base):
    __tablename__ = "ai_request_logs"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String, default=lambda: f"req_{uuid.uuid4().hex[:12]}", index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    service_name = Column(String, nullable=False, index=True) # "gemini", "rag", "validator", "code_executor", "pdf_generator"
    operation = Column(String, nullable=False, index=True) # "generate_question", "evaluate_answer", "validate_quality", "retrieve_context", "execute_code", "generate_pdf"
    model_name = Column(String, nullable=True, default="gemini-3.6-flash")

    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    latency_ms = Column(Float, nullable=False) # exact measured duration in ms
    success = Column(Boolean, default=True, index=True)
    error_type = Column(String, nullable=True) # e.g., "RateLimitError", "StructuralValidationError", "TimeoutError", "ExecutionError"

    # Token Usage & Estimated Cost
    input_tokens = Column(Integer, nullable=True)
    output_tokens = Column(Integer, nullable=True)
    total_tokens = Column(Integer, nullable=True)
    estimated_cost = Column(Float, nullable=True) # in USD ($)

    # Sanitized Context & Correlation Metadata (Never stores secrets, passwords, or raw resume PII)
    metadata_json = Column(Text, nullable=True)


class SystemHealthLog(Base):
    __tablename__ = "system_health_logs"

    id = Column(Integer, primary_key=True, index=True)
    component_name = Column(String, nullable=False, index=True) # "database", "gemini", "rag", "code_executor", "pdf_generator"
    status = Column(String, nullable=False, index=True) # "healthy", "degraded", "unhealthy"
    latency_ms = Column(Float, nullable=False)
    error_message = Column(Text, nullable=True) # Sanitized, zero credentials
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    details_json = Column(Text, nullable=True)


class EvaluationReliabilityLog(Base):
    __tablename__ = "evaluation_reliability_logs"

    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(String, default=lambda: f"eval_{uuid.uuid4().hex[:12]}", index=True, nullable=False)
    assessment_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="SET NULL"), nullable=True, index=True)

    service_name = Column(String, default="gemini", nullable=False)
    operation = Column(String, default="evaluate_answer", nullable=False)
    model_name = Column(String, default="gemini-3.6-flash", nullable=False)
    rubric_version = Column(String, default="v2.1-multidimensional-rubric", nullable=False)

    score = Column(Float, nullable=False)
    latency_ms = Column(Float, nullable=False)
    success = Column(Boolean, default=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    details_json = Column(Text, nullable=True)
