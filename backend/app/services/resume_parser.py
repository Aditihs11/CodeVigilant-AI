import io
import json
import re
from typing import Dict, Any, List
try:
    from pypdf import PdfReader
except ImportError:
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        PdfReader = None
from docx import Document
from app.services.gemini import _call_gemini_with_retry, _clean_and_parse_json


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts raw text from PDF file bytes."""
    reader = PdfReader(io.BytesIO(file_bytes))
    text_content = []
    for page in reader.pages:
        txt = page.extract_text()
        if txt:
            text_content.append(txt)
    return "\n".join(text_content).strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extracts raw text from DOCX file bytes."""
    doc = Document(io.BytesIO(file_bytes))
    text_content = [p.text for p in doc.paragraphs if p.text]
    return "\n".join(text_content).strip()


def parse_resume_content(raw_text: str) -> Dict[str, Any]:
    """
    Parses unstructured resume text into structured entities using Gemini with heuristic fallback.
    """
    if not raw_text or len(raw_text.strip()) < 20:
        return {
            "skills": ["General Software Engineering"],
            "programming_languages": ["Python", "JavaScript"],
            "frameworks": ["FastAPI", "React"],
            "projects": [],
            "experience": [],
            "education": [],
            "certifications": [],
            "summary": "Candidate profile uploaded with limited text.",
        }

    prompt = f"""
You are an expert technical recruiter and resume analyzer.

Extract structured data from the following resume text:

RESUME TEXT:
\"\"\"
{raw_text[:4000]}
\"\"\"

Extract:
1. "skills": List of technical and engineering skills
2. "programming_languages": List of programming languages (e.g. Python, Java, TypeScript, C++)
3. "frameworks": List of frameworks and tools (e.g. React, Spring Boot, FastAPI, Docker, Kubernetes)
4. "projects": Array of objects with "title", "description", "technologies" (list)
5. "experience": Array of objects with "role", "company", "duration"
6. "education": Array of objects with "degree", "institution", "year"
7. "certifications": List of technical certifications
8. "summary": Concise professional summary of candidate experience and focus

Return STRICTLY a valid JSON object matching this schema:
{{
  "skills": ["Python", "Java", "REST APIs", "SQL", "Docker"],
  "programming_languages": ["Python", "Java", "JavaScript"],
  "frameworks": ["FastAPI", "React", "Spring Boot"],
  "projects": [
    {{
      "title": "AI Interview Platform",
      "description": "Built full-stack assessment platform with automated scoring",
      "technologies": ["FastAPI", "React", "PostgreSQL"]
    }}
  ],
  "experience": [
    {{
      "role": "Software Engineer",
      "company": "Tech Corp",
      "duration": "2023 - Present"
    }}
  ],
  "education": [
    {{
      "degree": "B.S. Computer Science",
      "institution": "State University",
      "year": "2023"
    }}
  ],
  "certifications": ["AWS Certified Developer"],
  "summary": "Full stack engineer experienced in Python, React, and cloud architecture."
}}
"""
    try:
        raw_output = _call_gemini_with_retry(prompt)
        parsed = _clean_and_parse_json(raw_output)
        return {
            "skills": list(parsed.get("skills", [])),
            "programming_languages": list(parsed.get("programming_languages", [])),
            "frameworks": list(parsed.get("frameworks", [])),
            "projects": list(parsed.get("projects", [])),
            "experience": list(parsed.get("experience", [])),
            "education": list(parsed.get("education", [])),
            "certifications": list(parsed.get("certifications", [])),
            "summary": str(parsed.get("summary", "Technical candidate profile.")),
        }
    except Exception:
        # Heuristic entity extraction fallback
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        common_langs = ["Python", "Java", "JavaScript", "TypeScript", "C++", "Go", "Rust", "SQL", "HTML", "CSS"]
        found_langs = [l for l in common_langs if re.search(r'\b' + re.escape(l) + r'\b', raw_text, re.IGNORECASE)]

        return {
            "skills": found_langs or ["Software Engineering", "Problem Solving"],
            "programming_languages": found_langs or ["Python", "JavaScript"],
            "frameworks": ["Modern Web Frameworks", "REST APIs"],
            "projects": [{"title": "Software Project", "description": "Developed full-stack application", "technologies": found_langs}],
            "experience": [],
            "education": [],
            "certifications": [],
            "summary": f"Technical candidate with competencies in {', '.join(found_langs) if found_langs else 'modern software engineering'}.",
        }
