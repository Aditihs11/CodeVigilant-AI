from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings


engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def sync_database_schema():
    """
    Ensures all tables and newly added columns exist in PostgreSQL without data loss.
    """
    try:
        from app.models.user import User
        from app.models.resume import Resume
        from app.models.interview import Interview
        from app.models.question import Question
        from app.models.answer import Answer
        from app.models.question_bank import QuestionBank
        from app.models.candidate_skill import CandidateSkill
        from app.models.integrity_event import AssessmentIntegrityEvent
        from app.models.experiment import Experiment, ExperimentParticipant, ExperimentAuditLog, ExperimentDatasetSnapshot
        from app.models.observability import AIRequestLog, SystemHealthLog, EvaluationReliabilityLog
        from app.models.security_audit import SecurityAuditRun, SecurityFinding
        from app.models.job import Job
        from app.models.application import CandidateApplication
        from app.models.invitation import AssessmentInvitation
        from app.models.interview_event import InterviewEvent
        from app.models.hiring_audit import HiringAuditLog
        from app.models.comparison import CandidateComparisonSnapshot
        from app.models.benchmark import AIBenchmarkRun

        Base.metadata.create_all(bind=engine)

        with engine.connect() as conn:
            # users columns
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS target_role VARCHAR DEFAULT 'Java Developer';"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR DEFAULT 'Python';"))

            # interviews columns
            conn.execute(text("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS assessment_type VARCHAR DEFAULT 'interview';"))
            conn.execute(text("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS difficulty VARCHAR DEFAULT 'Intermediate';"))
            conn.execute(text("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS language VARCHAR;"))
            conn.execute(text("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS resume_id INTEGER;"))
            conn.execute(text("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER;"))
            conn.execute(text("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;"))
            conn.execute(text("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;"))
            conn.execute(text("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS integrity_status VARCHAR DEFAULT 'Normal';"))
            conn.execute(text("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS integrity_summary_json TEXT;"))
            conn.execute(text("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS learning_roadmap_json TEXT;"))
            conn.execute(text("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS skill_gap_json TEXT;"))
            conn.execute(text("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS metadata_json TEXT;"))

            # questions columns
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type VARCHAR DEFAULT 'text';"))
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS options_json TEXT;"))
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_answer INTEGER;"))
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation TEXT;"))
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic VARCHAR;"))
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS subtopic VARCHAR;"))
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty VARCHAR;"))
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS coding_metadata_json TEXT;"))
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS retrieval_metadata_json TEXT;"))
            conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS adaptive_metadata_json TEXT;"))

            # answers columns
            conn.execute(text("ALTER TABLE answers ADD COLUMN IF NOT EXISTS selected_option INTEGER;"))
            conn.execute(text("ALTER TABLE answers ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;"))
            conn.execute(text("ALTER TABLE answers ADD COLUMN IF NOT EXISTS code_language VARCHAR;"))
            conn.execute(text("ALTER TABLE answers ADD COLUMN IF NOT EXISTS test_cases_passed INTEGER;"))
            conn.execute(text("ALTER TABLE answers ADD COLUMN IF NOT EXISTS test_cases_total INTEGER;"))
            conn.execute(text("ALTER TABLE answers ADD COLUMN IF NOT EXISTS code_quality_score INTEGER;"))
            conn.execute(text("ALTER TABLE answers ADD COLUMN IF NOT EXISTS topic VARCHAR;"))

            # question_bank columns
            conn.execute(text("ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS subtopic VARCHAR;"))
            conn.execute(text("ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS quality_status VARCHAR DEFAULT 'approved';"))
            conn.execute(text("ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS approval_status VARCHAR DEFAULT 'approved';"))
            conn.execute(text("ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS quality_score FLOAT DEFAULT 8.5;"))
            conn.execute(text("ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS attempts_count INTEGER DEFAULT 0;"))
            conn.execute(text("ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS correct_count INTEGER DEFAULT 0;"))
            conn.execute(text("ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS success_rate FLOAT;"))
            conn.execute(text("ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS observed_difficulty VARCHAR;"))
            conn.execute(text("ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR;"))
            conn.execute(text("ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;"))
            conn.execute(text("ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS validation_metadata_json TEXT;"))
            conn.execute(text("ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS normalized_hash VARCHAR;"))
            conn.execute(text("ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();"))

            conn.commit()
    except Exception as e:
        print(f"Schema sync notice: {e}")


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()