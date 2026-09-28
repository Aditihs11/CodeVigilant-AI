import os
import re
import html
from typing import Any, Dict, List, Optional, Union

# Common secret keys to redact in logs/metadata
SENSITIVE_KEY_TERMS = {
    "password", "secret", "token", "key", "api_key", "jwt", "authorization",
    "access_token", "hashed_password", "postgres_password", "secret_key"
}

# Regex patterns for diagnostic detection
SQL_INJECTION_HEURISTICS = [
    r"(\b(UNION(\s+ALL)?|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)\b)",
    r"(--|#|/\*|\*/)",
    r"('|\")\s*(OR|AND)\s*('|\")?\d+('|\")?\s*=\s*('|\")?\d+",
    r"('|\")\s*(OR|AND)\s*('|\")[a-zA-Z]+('|\")?\s*=\s*('|\")[a-zA-Z]+",
]

XSS_HEURISTICS = [
    r"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>",
    r"javascript\s*:",
    r"onerror\s*=",
    r"onload\s*=",
    r"onclick\s*=",
    r"<img\s+[^>]*src\s*=\s*['\"]?javascript:",
    r"<iframe\b",
]


def sanitize_filename(filename: Optional[str], default_name: str = "document.pdf") -> str:
    """
    Strips directory traversal sequences, null bytes, backslashes, absolute paths,
    and control characters from an uploaded filename.
    """
    if not filename or not isinstance(filename, str):
        return default_name

    # Remove null bytes and path separators
    clean = filename.replace("\x00", "").replace("%00", "")
    clean = os.path.basename(clean)
    
    # Strip any remaining relative traversal prefixes
    clean = re.sub(r"^(\.\.[\/\\])+", "", clean)
    clean = re.sub(r"[\/\\]", "", clean)
    
    # Remove non-printable or control characters
    clean = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", clean)
    clean = clean.strip(". ")

    if not clean:
        return default_name

    return clean


def sanitize_text_input(text: Optional[str], max_length: int = 20000, escape_html: bool = False) -> str:
    """
    Enforces maximum length bounds and optional HTML entity escaping.
    """
    if text is None:
        return ""
    
    s = str(text)
    if len(s) > max_length:
        s = s[:max_length]
    
    if escape_html:
        s = html.escape(s)
    
    return s


def redact_sensitive_keys(data: Any) -> Any:
    """
    Recursively redacts values matching sensitive terms (password, token, api_key, etc.)
    from dicts, lists, and primitives without modifying original inputs.
    """
    if isinstance(data, dict):
        cleaned = {}
        for k, v in data.items():
            k_lower = str(k).lower()
            if any(term in k_lower for term in SENSITIVE_KEY_TERMS):
                cleaned[k] = "[REDACTED]"
            else:
                cleaned[k] = redact_sensitive_keys(v)
        return cleaned
    elif isinstance(data, list):
        return [redact_sensitive_keys(item) for item in data]
    elif isinstance(data, str):
        # Redact JWT token strings if detected (header.payload.signature pattern)
        if re.match(r"^eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$", data):
            return "[REDACTED_JWT]"
        return data
    else:
        return data


def contains_sql_injection_pattern(text: str) -> bool:
    """Diagnostic check to flag potential SQL injection probe strings in audit reports."""
    if not text or not isinstance(text, str):
        return False
    for pattern in SQL_INJECTION_HEURISTICS:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False


def contains_xss_pattern(text: str) -> bool:
    """Diagnostic check to flag potential XSS script/tag probe strings in audit reports."""
    if not text or not isinstance(text, str):
        return False
    for pattern in XSS_HEURISTICS:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False
