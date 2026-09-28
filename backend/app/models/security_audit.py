from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.db.database import Base


class SecurityAuditRun(Base):
    __tablename__ = "security_audit_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default="completed", nullable=False) # completed, failed, running
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=True)
    total_checks = Column(Integer, default=0, nullable=False)
    passed_count = Column(Integer, default=0, nullable=False)
    failed_count = Column(Integer, default=0, nullable=False)
    warning_count = Column(Integer, default=0, nullable=False)
    
    # Category summary JSON: {"Authentication": "PASS", "RBAC": "PASS", "IDOR": "PASS", ...}
    summary_json = Column(Text, nullable=True)
    
    # Severity breakdown JSON: {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 1, "LOW": 2, "INFO": 3}
    findings_count_by_severity = Column(Text, nullable=True)
    
    triggered_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    findings = relationship("SecurityFinding", back_populates="run", cascade="all, delete-orphan")


class SecurityFinding(Base):
    __tablename__ = "security_findings"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("security_audit_runs.id"), nullable=False)
    finding_id = Column(String, index=True, nullable=False) # e.g. FIND-AUTH-001
    category = Column(String, index=True, nullable=False) # Authentication, RBAC, IDOR, Prompt Injection, etc.
    severity = Column(String, index=True, nullable=False) # CRITICAL, HIGH, MEDIUM, LOW, INFO
    component = Column(String, nullable=False) # e.g. /api/v1/auth/me, code_executor.py
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    remediation = Column(Text, nullable=True)
    status = Column(String, default="OPEN", nullable=False) # OPEN, MITIGATED, ACCEPTED_RISK

    run = relationship("SecurityAuditRun", back_populates="findings")
