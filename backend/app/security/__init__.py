"""
CodeVigilant AI — Security & Adversarial Testing Engine
"""

from app.security.input_sanitizer import (
    sanitize_text_input,
    sanitize_filename,
    redact_sensitive_keys,
    contains_sql_injection_pattern,
    contains_xss_pattern,
)
from app.security.file_security import (
    validate_resume_file,
    verify_magic_bytes,
    is_safe_storage_path,
)
from app.security.prompt_security import (
    wrap_untrusted_prompt_context,
    validate_ai_output_schema,
    detect_prompt_injection_heuristics,
)
from app.security.authorization_audit import (
    audit_object_ownership,
    audit_rbac_access,
)
from app.security.security_audit_service import (
    run_comprehensive_security_audit,
    get_latest_security_audit_run,
    list_security_findings,
)

__all__ = [
    "sanitize_text_input",
    "sanitize_filename",
    "redact_sensitive_keys",
    "contains_sql_injection_pattern",
    "contains_xss_pattern",
    "validate_resume_file",
    "verify_magic_bytes",
    "is_safe_storage_path",
    "wrap_untrusted_prompt_context",
    "validate_ai_output_schema",
    "detect_prompt_injection_heuristics",
    "audit_object_ownership",
    "audit_rbac_access",
    "run_comprehensive_security_audit",
    "get_latest_security_audit_run",
    "list_security_findings",
]
