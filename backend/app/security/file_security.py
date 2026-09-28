import os
from typing import Tuple, Optional
from app.security.input_sanitizer import sanitize_filename

MAX_RESUME_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = {"pdf", "docx"}

PDF_MAGIC = b"%PDF-"
ZIP_MAGIC = b"PK\x03\x04"  # DOCX files are ZIP containers starting with PK\x03\x04


def verify_magic_bytes(file_bytes: bytes, ext: str) -> bool:
    """
    Verifies that the initial bytes of the file match the expected file signature.
    Prevents file extension spoofing (e.g., uploading an executable disguised as .pdf).
    """
    if not file_bytes or len(file_bytes) < 4:
        return False

    clean_ext = ext.lower().strip(".")
    if clean_ext == "pdf":
        return file_bytes.startswith(PDF_MAGIC)
    elif clean_ext == "docx":
        return file_bytes.startswith(ZIP_MAGIC)

    return False


def validate_resume_file(
    filename: Optional[str],
    file_bytes: bytes,
    max_size: int = MAX_RESUME_FILE_SIZE,
) -> Tuple[bool, str, str]:
    """
    Validates an uploaded resume file:
    1. Sanitizes filename against path traversal.
    2. Enforces allowed extensions (.pdf, .docx).
    3. Validates file size limits (non-empty and <= max_size).
    4. Validates file magic bytes.

    Returns:
        (is_valid: bool, clean_filename: str, error_message: str)
    """
    if not file_bytes or len(file_bytes) == 0:
        return False, "", "Uploaded file is empty."

    if len(file_bytes) > max_size:
        return False, "", f"File size ({len(file_bytes)} bytes) exceeds the maximum allowed limit of {max_size // (1024*1024)}MB."

    safe_name = sanitize_filename(filename, default_name="resume.pdf")
    ext = safe_name.split(".")[-1].lower() if "." in safe_name else ""

    if ext not in ALLOWED_EXTENSIONS:
        return False, safe_name, f"Invalid file extension '.{ext}'. Only PDF and DOCX files are supported."

    if not verify_magic_bytes(file_bytes, ext):
        return False, safe_name, f"File content header does not match declared .{ext} format."

    return True, safe_name, ""


def is_safe_storage_path(target_path: str, base_directory: str) -> bool:
    """
    Ensures that a resolved target path strictly resides within the base directory.
    Guards against path traversal attacks.
    """
    try:
        resolved_base = os.path.abspath(base_directory)
        resolved_target = os.path.abspath(target_path)
        common = os.path.commonpath([resolved_base, resolved_target])
        return common == resolved_base
    except Exception:
        return False
