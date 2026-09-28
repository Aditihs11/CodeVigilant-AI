from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func

from app.db.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=True) # "pdf", "docx"
    raw_text = Column(Text, nullable=True)

    # Structured Extracted Entities (JSON strings)
    skills_json = Column(Text, nullable=True) # ["React", "Python", "Docker", "PostgreSQL", ...]
    programming_languages_json = Column(Text, nullable=True) # ["Java", "Python", "TypeScript"]
    frameworks_json = Column(Text, nullable=True) # ["FastAPI", "React 19", "Spring Boot"]
    projects_json = Column(Text, nullable=True) # [{"title": "...", "description": "...", "technologies": [...]}]
    experience_json = Column(Text, nullable=True) # [{"role": "...", "company": "...", "duration": "..."}]
    education_json = Column(Text, nullable=True) # [{"degree": "...", "institution": "...", "year": "..."}]
    certifications_json = Column(Text, nullable=True) # ["AWS Solutions Architect", "CKA"]

    summary = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
