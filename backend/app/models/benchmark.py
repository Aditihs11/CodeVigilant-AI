import json
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.sql import func

from app.db.database import Base


class AIBenchmarkRun(Base):
    __tablename__ = "ai_benchmark_runs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Version Locks
    model_version = Column(String, default="gemini-3.6-flash")
    prompt_version = Column(String, default="v2.0-isolated-context")
    validator_version = Column(String, default="v2.0-structural-ai-quality")
    scoring_version = Column(String, default="v2.0-weighted-continual")
    rag_version = Column(String, default="v2.0-bounded-hybrid")
    
    # Quantitative Benchmarks Extracted from Real AI Logs
    total_evaluations_analyzed = Column(Integer, default=0)
    validation_pass_rate_percent = Column(Float, nullable=True)
    average_quality_score = Column(Float, nullable=True)
    evaluation_consistency_stddev = Column(Float, nullable=True)
    average_latency_ms = Column(Float, nullable=True)
    p95_latency_ms = Column(Float, nullable=True)
    total_tokens_used = Column(Integer, default=0)
    estimated_cost_usd = Column(Float, default=0.0)
    failure_rate_percent = Column(Float, default=0.0)
    
    # Full Metrics Breakdown
    metrics_json = Column(Text, nullable=True)
    created_by = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def get_metrics(self):
        if not self.metrics_json:
            return {}
        try:
            return json.loads(self.metrics_json)
        except Exception:
            return {}
