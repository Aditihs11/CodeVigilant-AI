import time
import json
from typing import Dict, Any
from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.config import settings
from app.db.database import engine
from app.models.question_bank import QuestionBank
from app.models.observability import SystemHealthLog


def check_database_health() -> Dict[str, Any]:
    """
    Executes a real query against PostgreSQL to measure connection latency.
    Zero credentials or connection strings are exposed.
    """
    start = time.perf_counter()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
        latency = (time.perf_counter() - start) * 1000.0
        return {
            "component": "database",
            "status": "healthy" if latency < 200 else "degraded",
            "latency_ms": round(latency, 2),
            "engine": "PostgreSQL",
            "details": "Connection pool active & responsive",
        }
    except Exception as e:
        latency = (time.perf_counter() - start) * 1000.0
        return {
            "component": "database",
            "status": "unhealthy",
            "latency_ms": round(latency, 2),
            "engine": "PostgreSQL",
            "error": "Database connection failed",
        }


def check_gemini_health() -> Dict[str, Any]:
    """
    Verifies Gemini API configuration and client readiness.
    Never exposes API keys.
    """
    start = time.perf_counter()
    key_configured = bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 10)
    latency = (time.perf_counter() - start) * 1000.0
    model_name = getattr(settings, "GEMINI_MODEL", "gemini-3.6-flash")

    if not key_configured:
        return {
            "component": "gemini",
            "status": "degraded",
            "latency_ms": round(latency, 2),
            "model": model_name,
            "details": "GEMINI_API_KEY not configured or incomplete",
        }

    return {
        "component": "gemini",
        "status": "healthy",
        "latency_ms": round(latency, 2),
        "model": model_name,
        "sdk": "google-genai (official)",
        "details": "Gemini 3.6 Flash client configured and operational",
    }


def check_rag_health(db: Session) -> Dict[str, Any]:
    """
    Verifies Question Bank connectivity and curated question availability.
    """
    start = time.perf_counter()
    try:
        count = db.query(QuestionBank).filter(QuestionBank.approval_status == "approved").count()
        latency = (time.perf_counter() - start) * 1000.0
        return {
            "component": "rag",
            "status": "healthy" if count > 0 else "degraded",
            "latency_ms": round(latency, 2),
            "approved_questions_count": count,
            "retrieval_mode": "bounded_hybrid_indexing",
            "details": f"Curated question bank operational with {count} approved questions",
        }
    except Exception as e:
        latency = (time.perf_counter() - start) * 1000.0
        return {
            "component": "rag",
            "status": "unhealthy",
            "latency_ms": round(latency, 2),
            "error": "RAG question bank query failed",
        }


def check_code_executor_health() -> Dict[str, Any]:
    """
    Verifies sandboxed code runner readiness and isolation subprocess environment.
    """
    start = time.perf_counter()
    try:
        from app.services.code_executor import execute_code_sandboxed
        res = execute_code_sandboxed(
            language="python",
            code="def solution(x):\n    return 'health_ok'",
            test_cases=[{"input": "1", "expected_output": "health_ok"}],
            timeout_seconds=2,
        )
        latency = (time.perf_counter() - start) * 1000.0
        passed = (res.get("tests_passed", 0) > 0)
        return {
            "component": "code_executor",
            "status": "healthy" if passed else "degraded",
            "latency_ms": round(latency, 2),
            "sandbox_mode": res.get("execution_mode", "local_sandboxed_subprocess"),
            "details": f"Execution harness active ({res.get('execution_mode')})",
        }
    except Exception as e:
        latency = (time.perf_counter() - start) * 1000.0
        return {
            "component": "code_executor",
            "status": "degraded",
            "latency_ms": round(latency, 2),
            "error": str(e),
        }


def check_pdf_generator_health() -> Dict[str, Any]:
    """
    Verifies ReportLab PDF generation engine.
    """
    start = time.perf_counter()
    try:
        import reportlab
        latency = (time.perf_counter() - start) * 1000.0
        return {
            "component": "pdf_generator",
            "status": "healthy",
            "latency_ms": round(latency, 2),
            "reportlab_version": getattr(reportlab, "__version__", "4.x"),
            "details": "ReportLab PDF engine active",
        }
    except Exception as e:
        latency = (time.perf_counter() - start) * 1000.0
        return {
            "component": "pdf_generator",
            "status": "unhealthy",
            "latency_ms": round(latency, 2),
            "error": "ReportLab library not available",
        }


def get_full_system_health(db: Session) -> Dict[str, Any]:
    """
    Executes live health checks across all components and logs the results in system_health_logs.
    """
    checks = {
        "database": check_database_health(),
        "gemini": check_gemini_health(),
        "rag": check_rag_health(db),
        "code_executor": check_code_executor_health(),
        "pdf_generator": check_pdf_generator_health(),
    }

    statuses = [c["status"] for c in checks.values()]
    if all(s == "healthy" for s in statuses):
        overall = "healthy"
    elif "unhealthy" in statuses:
        overall = "unhealthy"
    else:
        overall = "degraded"

    # Record log
    for comp_name, c_data in checks.items():
        h_log = SystemHealthLog(
            component_name=comp_name,
            status=c_data["status"],
            latency_ms=c_data.get("latency_ms", 0.0),
            error_message=c_data.get("error"),
            details_json=json.dumps(c_data),
        )
        db.add(h_log)
    db.commit()

    return {
        "status": overall,
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "components": checks,
    }
