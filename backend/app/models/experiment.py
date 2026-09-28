import hashlib
import json
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.sql import func

from app.db.database import Base


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Experiment Types:
    # 1. adaptive_vs_static
    # 2. rag_vs_non_rag
    # 3. validated_vs_unvalidated
    # 4. personalized_vs_role_only
    # 5. mastery_vs_latest_score
    experiment_type = Column(String, nullable=False, index=True)

    control_strategy = Column(String, nullable=False)
    treatment_strategy = Column(String, nullable=False)

    target_role = Column(String, nullable=True, default="All")
    target_topic = Column(String, nullable=True, default="All")

    status = Column(String, default="draft", index=True) # "draft", "active", "completed", "archived"
    sample_size_target = Column(Integer, default=50)

    created_by = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Algorithm versions & configuration for scientific reproducibility
    adaptive_engine_version = Column(String, default="v2.1-deterministic-rank")
    rag_version = Column(String, default="v2.0-bounded-hybrid")
    validator_version = Column(String, default="v2.0-structural-ai-quality")
    scoring_version = Column(String, default="v2.0-weighted-continual")
    gemini_model_version = Column(String, default="gemini-3.6-flash")

    configuration_json = Column(Text, nullable=True)


class ExperimentParticipant(Base):
    __tablename__ = "experiment_participants"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(Integer, ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Salted pseudonymous identifier to prevent candidate PII leakage
    anonymized_id = Column(String, nullable=False, index=True)

    group = Column(String, nullable=False, index=True) # "control" or "treatment"
    assignment_timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Observed Quantitative Metrics (Computed from actual assessment performance)
    final_score = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    completion_time_seconds = Column(Integer, nullable=True)
    questions_attempted = Column(Integer, default=0)
    questions_required_for_convergence = Column(Integer, default=3)
    topic_coverage = Column(Float, nullable=True) # percentage or count
    average_question_difficulty = Column(String, nullable=True)
    mastery_before = Column(Float, nullable=True)
    mastery_after = Column(Float, nullable=True)
    mastery_improvement = Column(Float, nullable=True)
    coding_score = Column(Float, nullable=True)
    question_quality_score = Column(Float, nullable=True)
    integrity_warning_count = Column(Integer, default=0)


class ExperimentAuditLog(Base):
    __tablename__ = "experiment_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(Integer, ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String, nullable=False) # "created", "started", "assigned", "stopped", "results_generated", "exported", "snapshot_created"
    details_json = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class ExperimentDatasetSnapshot(Base):
    __tablename__ = "experiment_dataset_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    snapshot_id = Column(String, unique=True, index=True, nullable=False)
    experiment_id = Column(Integer, ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, nullable=True)

    observation_count = Column(Integer, default=0)
    valid_count = Column(Integer, default=0)
    invalid_count = Column(Integer, default=0)

    # Scientific Reproducibility Metadata
    dataset_version = Column(String, default="v1.0-empirical")
    scoring_version = Column(String, default="v2.0-weighted-continual")
    rag_version = Column(String, default="v2.0-bounded-hybrid")
    adaptive_engine_version = Column(String, default="v2.1-deterministic-rank")
    validator_version = Column(String, default="v2.0-structural-ai-quality")
    gemini_model_version = Column(String, default="gemini-3.6-flash")
    statistical_methodology_version = Column(String, default="v1.0-empirical-cohens-d")

    algorithm_versions_json = Column(Text, nullable=True)
    observations_json = Column(Text, nullable=True) # JSON list of valid research observations
    invalid_observations_json = Column(Text, nullable=True) # JSON list of invalid observations with reasons
    summary_statistics_json = Column(Text, nullable=True) # JSON snapshot of comparative group stats
    metadata_json = Column(Text, nullable=True)


def generate_anonymized_participant_id(experiment_id: int, user_id: int, assessment_id: int) -> str:
    """
    Generates a deterministic pseudonymous participant ID without exposing DB serial IDs or PII.
    Example output: participant_c4f81a
    """
    salt = f"codevigilant_research_exp_{experiment_id}_u_{user_id}_a_{assessment_id}"
    digest = hashlib.sha256(salt.encode("utf-8")).hexdigest()[:8]
    return f"participant_{digest}"
