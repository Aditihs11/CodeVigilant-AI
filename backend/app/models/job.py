import json
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.sql import func

from app.db.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    department = Column(String, nullable=True, default="Engineering")
    description = Column(Text, nullable=False)
    
    # Skills & Requirements
    required_skills_json = Column(Text, nullable=True) # JSON list of strings
    preferred_skills_json = Column(Text, nullable=True) # JSON list of strings
    experience_level = Column(String, default="Mid-Level") # "Entry-Level", "Mid-Level", "Senior", "Lead"
    min_experience_years = Column(Float, default=2.0)
    education_requirements = Column(String, default="Bachelor's Degree in Computer Science or related field")
    
    # Workplace & Employment
    location = Column(String, default="Remote / Hybrid")
    workplace_type = Column(String, default="Remote") # "Remote", "Hybrid", "On-Site"
    employment_type = Column(String, default="Full-Time") # "Full-Time", "Part-Time", "Contract", "Internship"
    openings_count = Column(Integer, default=1)
    application_deadline = Column(DateTime(timezone=True), nullable=True)
    
    # Assessment Configuration
    assessment_duration_minutes = Column(Integer, default=45)
    min_qualifying_score = Column(Float, default=6.0) # 0-10 scale or percentage
    interview_required = Column(Boolean, default=True)
    coding_required = Column(Boolean, default=True)
    assessment_config_json = Column(Text, nullable=True) # Full structured section weights & cutoffs
    
    # Status: DRAFT, PUBLISHED, CLOSED, ARCHIVED
    status = Column(String, default="DRAFT", index=True)
    
    created_by = Column(String, nullable=False) # Recruiter email
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def get_required_skills(self):
        if not self.required_skills_json:
            return []
        try:
            return json.loads(self.required_skills_json)
        except Exception:
            return []

    def get_preferred_skills(self):
        if not self.preferred_skills_json:
            return []
        try:
            return json.loads(self.preferred_skills_json)
        except Exception:
            return []

    def get_assessment_config(self):
        if not self.assessment_config_json:
            return {
                "sections": [
                    {"name": "CS Fundamentals", "questions": 5, "weight": 25, "min_score": 50},
                    {"name": "DSA", "questions": 5, "weight": 25, "min_score": 50},
                    {"name": "Coding", "questions": 1, "weight": 25, "min_score": 50},
                    {"name": "AI Interview", "questions": 3, "weight": 25, "min_score": 50},
                ],
                "overall_cutoff": 60,
                "negative_marking": False,
            }
        try:
            return json.loads(self.assessment_config_json)
        except Exception:
            return {}
