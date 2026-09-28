import json
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.benchmark import AIBenchmarkRun
from app.api.v1.endpoints.admin import require_admin
from app.services.ai_benchmark_service import run_ai_benchmarking_audit, list_ai_benchmarks

router = APIRouter()


@router.post("/run", status_code=status.HTTP_201_CREATED)
def trigger_ai_benchmark(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Executes empirical AI benchmark across stored logs and records quantitative metrics."""
    name = payload.get("name", f"Benchmark Run {AIBenchmarkRun.__tablename__}")
    description = payload.get("description", "Evaluation of Gemini 3.6 Flash reliability and latency.")

    benchmark = run_ai_benchmarking_audit(
        db=db,
        benchmark_name=name,
        creator_email=admin_user.email,
        description=description,
    )

    return {
        "id": benchmark.id,
        "name": benchmark.name,
        "model_version": benchmark.model_version,
        "total_evaluations_analyzed": benchmark.total_evaluations_analyzed,
        "validation_pass_rate_percent": benchmark.validation_pass_rate_percent,
        "average_quality_score": benchmark.average_quality_score,
        "evaluation_consistency_stddev": benchmark.evaluation_consistency_stddev,
        "average_latency_ms": benchmark.average_latency_ms,
        "p95_latency_ms": benchmark.p95_latency_ms,
        "total_tokens_used": benchmark.total_tokens_used,
        "estimated_cost_usd": benchmark.estimated_cost_usd,
        "failure_rate_percent": benchmark.failure_rate_percent,
        "metrics": benchmark.get_metrics(),
        "created_at": benchmark.created_at,
    }


@router.get("/", status_code=status.HTTP_200_OK)
@router.get("/runs", status_code=status.HTTP_200_OK)
def get_all_benchmarks(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Lists historical AI benchmark runs."""
    benchmarks = list_ai_benchmarks(db)
    return [
        {
            "id": b.id,
            "name": b.name,
            "benchmark_suite": b.name,
            "model_name": b.model_version,
            "model_version": b.model_version,
            "sample_size": b.total_evaluations_analyzed,
            "total_requests": b.total_evaluations_analyzed,
            "total_evaluations_analyzed": b.total_evaluations_analyzed,
            "success_rate": round(100.0 - (b.failure_rate_percent or 0.0), 1),
            "validation_pass_rate_percent": b.validation_pass_rate_percent,
            "average_quality_score": b.average_quality_score,
            "avg_latency_ms": b.average_latency_ms,
            "average_latency_ms": b.average_latency_ms,
            "p95_latency_ms": b.p95_latency_ms,
            "total_tokens_used": b.total_tokens_used,
            "estimated_cost_usd": b.estimated_cost_usd,
            "failure_rate_percent": b.failure_rate_percent,
            "created_by": b.created_by,
            "created_at": b.created_at,
        }
        for b in benchmarks
    ]


@router.get("/runs/{benchmark_id}", status_code=status.HTTP_200_OK)
@router.get("/{benchmark_id}", status_code=status.HTTP_200_OK)
def get_benchmark_details(
    benchmark_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Fetches details and metrics breakdown for a specific AI benchmark run."""
    b = db.query(AIBenchmarkRun).filter(AIBenchmarkRun.id == benchmark_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Benchmark run not found")

    return {
        "id": b.id,
        "name": b.name,
        "benchmark_suite": b.name,
        "description": b.description,
        "model_name": b.model_version,
        "model_version": b.model_version,
        "prompt_version": b.prompt_version,
        "validator_version": b.validator_version,
        "scoring_version": b.scoring_version,
        "rag_version": b.rag_version,
        "sample_size": b.total_evaluations_analyzed,
        "total_requests": b.total_evaluations_analyzed,
        "total_evaluations_analyzed": b.total_evaluations_analyzed,
        "success_rate": round(100.0 - (b.failure_rate_percent or 0.0), 1),
        "validation_pass_rate_percent": b.validation_pass_rate_percent,
        "average_quality_score": b.average_quality_score,
        "evaluation_consistency_stddev": b.evaluation_consistency_stddev,
        "avg_latency_ms": b.average_latency_ms,
        "average_latency_ms": b.average_latency_ms,
        "p95_latency_ms": b.p95_latency_ms,
        "total_tokens_used": b.total_tokens_used,
        "estimated_cost_usd": b.estimated_cost_usd,
        "failure_rate_percent": b.failure_rate_percent,
        "metrics": b.get_metrics(),
        "created_by": b.created_by,
        "created_at": b.created_at,
    }
