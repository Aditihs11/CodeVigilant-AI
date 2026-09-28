from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.health_service import (
    check_database_health,
    check_gemini_health,
    check_rag_health,
    check_code_executor_health,
    get_full_system_health,
)

router = APIRouter()


@router.get("", status_code=status.HTTP_200_OK)
def get_basic_health(db: Session = Depends(get_db)):
    """Basic application health check."""
    return get_full_system_health(db)


@router.get("/database", status_code=status.HTTP_200_OK)
def get_database_health():
    """PostgreSQL database health and connection latency check."""
    return check_database_health()


@router.get("/gemini", status_code=status.HTTP_200_OK)
def get_gemini_health():
    """Google Gemini AI service health and configuration check."""
    return check_gemini_health()


@router.get("/rag", status_code=status.HTTP_200_OK)
def get_rag_health(db: Session = Depends(get_db)):
    """Curated Question Bank & RAG index health check."""
    return check_rag_health(db)


@router.get("/code-executor", status_code=status.HTTP_200_OK)
def get_code_executor_health():
    """Sandboxed code execution harness health check."""
    return check_code_executor_health()
