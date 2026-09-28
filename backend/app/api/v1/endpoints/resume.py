import json
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.api.v1.endpoints.auth import get_current_user
from app.services.resume_parser import extract_text_from_pdf, extract_text_from_docx, parse_resume_content

router = APIRouter()


@router.post("/upload", status_code=status.HTTP_200_OK)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_bytes = await file.read()
    
    from app.security.file_security import validate_resume_file
    is_valid, safe_filename, err_msg = validate_resume_file(file.filename, file_bytes)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=err_msg,
        )

    filename = safe_filename
    ext = filename.split(".")[-1].lower()

    # Extract text based on file format
    try:
        if ext == "pdf":
            raw_text = extract_text_from_pdf(file_bytes)
        else:
            raw_text = extract_text_from_docx(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read {ext.upper()} file: {str(e)}")

    if not raw_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No readable text could be extracted from the uploaded document.",
        )

    # Parse with Gemini AI
    parsed_data = parse_resume_content(raw_text)

    # Upsert Resume record for user
    existing_resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    if existing_resume:
        existing_resume.filename = filename
        existing_resume.file_type = ext
        existing_resume.raw_text = raw_text
        existing_resume.skills_json = json.dumps(parsed_data["skills"])
        existing_resume.programming_languages_json = json.dumps(parsed_data["programming_languages"])
        existing_resume.frameworks_json = json.dumps(parsed_data["frameworks"])
        existing_resume.projects_json = json.dumps(parsed_data["projects"])
        existing_resume.experience_json = json.dumps(parsed_data["experience"])
        existing_resume.education_json = json.dumps(parsed_data["education"])
        existing_resume.certifications_json = json.dumps(parsed_data["certifications"])
        existing_resume.summary = parsed_data["summary"]
        resume_record = existing_resume
    else:
        resume_record = Resume(
            user_id=current_user.id,
            filename=filename,
            file_type=ext,
            raw_text=raw_text,
            skills_json=json.dumps(parsed_data["skills"]),
            programming_languages_json=json.dumps(parsed_data["programming_languages"]),
            frameworks_json=json.dumps(parsed_data["frameworks"]),
            projects_json=json.dumps(parsed_data["projects"]),
            experience_json=json.dumps(parsed_data["experience"]),
            education_json=json.dumps(parsed_data["education"]),
            certifications_json=json.dumps(parsed_data["certifications"]),
            summary=parsed_data["summary"],
        )
        db.add(resume_record)

    db.commit()
    db.refresh(resume_record)

    return {
        "message": "Resume uploaded and parsed successfully",
        "resume_id": resume_record.id,
        "filename": resume_record.filename,
        "summary": resume_record.summary,
        "skills": parsed_data["skills"],
        "programming_languages": parsed_data["programming_languages"],
        "frameworks": parsed_data["frameworks"],
        "projects": parsed_data["projects"],
        "experience": parsed_data["experience"],
        "education": parsed_data["education"],
        "certifications": parsed_data["certifications"],
    }


@router.get("/me", status_code=status.HTTP_200_OK)
def get_my_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    if not resume:
        return {"has_resume": False, "resume": None}

    return {
        "has_resume": True,
        "resume": {
            "id": resume.id,
            "filename": resume.filename,
            "file_type": resume.file_type,
            "summary": resume.summary,
            "skills": json.loads(resume.skills_json) if resume.skills_json else [],
            "programming_languages": json.loads(resume.programming_languages_json) if resume.programming_languages_json else [],
            "frameworks": json.loads(resume.frameworks_json) if resume.frameworks_json else [],
            "projects": json.loads(resume.projects_json) if resume.projects_json else [],
            "experience": json.loads(resume.experience_json) if resume.experience_json else [],
            "education": json.loads(resume.education_json) if resume.education_json else [],
            "certifications": json.loads(resume.certifications_json) if resume.certifications_json else [],
            "created_at": resume.created_at,
            "updated_at": resume.updated_at,
        }
    }


@router.delete("/me", status_code=status.HTTP_200_OK)
def delete_my_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    if resume:
        db.delete(resume)
        db.commit()
    return {"message": "Resume profile removed"}
