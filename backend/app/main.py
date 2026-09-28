from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import sync_database_schema

# Models
from app.models.user import User
from app.models.resume import Resume
from app.models.interview import Interview
from app.models.question import Question
from app.models.answer import Answer
from app.models.question_bank import QuestionBank
from app.models.candidate_skill import CandidateSkill
from app.models.integrity_event import AssessmentIntegrityEvent
from app.models.experiment import Experiment, ExperimentParticipant, ExperimentAuditLog
from app.models.observability import AIRequestLog, SystemHealthLog, EvaluationReliabilityLog

# Routers
from app.api.v1.endpoints import auth
from app.api.v1.endpoints import resume
from app.api.v1.endpoints import interview
from app.api.v1.endpoints import questions
from app.api.v1.endpoints import answers
from app.api.v1.endpoints import assessment
from app.api.v1.endpoints import skills
from app.api.v1.endpoints import admin
from app.api.v1.endpoints import research
from app.api.v1.endpoints import health
from app.api.v1.endpoints import jobs
from app.api.v1.endpoints import applications
from app.api.v1.endpoints import invitations
from app.api.v1.endpoints import voice_interview
from app.api.v1.endpoints import recruiter
from app.api.v1.endpoints import benchmarks


# ============================================================
# DATABASE INITIALIZATION & SCHEMA SYNC
# ============================================================

sync_database_schema()


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)


cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if settings.BACKEND_CORS_ORIGINS:
    for origin in settings.BACKEND_CORS_ORIGINS:
        origin_str = str(origin).rstrip("/")
        if origin_str not in cors_origins:
            cors_origins.append(origin_str)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# SECURITY HEADERS MIDDLEWARE
# ============================================================

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


# ============================================================
# AUTHENTICATION
# ============================================================

app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["Authentication"],
)


# ============================================================
# RESUME & CANDIDATE PROFILE
# ============================================================

app.include_router(
    resume.router,
    prefix=f"{settings.API_V1_STR}/resume",
    tags=["Resume"],
)


# ============================================================
# CANDIDATE CONTINUAL SKILLS & MASTERY
# ============================================================

app.include_router(
    skills.router,
    prefix=f"{settings.API_V1_STR}/skills",
    tags=["Skills"],
)


# ============================================================
# ASSESSMENTS (Multi-Mode: MCQ, Coding, AI Interview, PDF)
# ============================================================

app.include_router(
    assessment.router,
    prefix=f"{settings.API_V1_STR}/assessments",
    tags=["Assessments"],
)


# ============================================================
# INTERVIEWS (Existing Endpoints - 100% Backward Compatible)
# ============================================================

app.include_router(
    interview.router,
    prefix=f"{settings.API_V1_STR}/interviews",
    tags=["Interviews"],
)


# ============================================================
# QUESTIONS (Existing Endpoints)
# ============================================================

app.include_router(
    questions.router,
    prefix=f"{settings.API_V1_STR}/interviews",
    tags=["Questions"],
)


# ============================================================
# ANSWERS (Existing Endpoints)
# ============================================================

app.include_router(
    answers.router,
    prefix=f"{settings.API_V1_STR}/interviews",
    tags=["Answers"],
)


# ============================================================
# ADMIN & REVIEWER DASHBOARD
# ============================================================

app.include_router(
    admin.router,
    prefix=f"{settings.API_V1_STR}/admin",
    tags=["Admin"],
)


# ============================================================
# RESEARCH EXPERIMENTS & A/B TESTING ENGINE
# ============================================================

app.include_router(
    research.router,
    prefix=f"{settings.API_V1_STR}/research",
    tags=["Research"],
)


# ============================================================
# SYSTEM HEALTH & OBSERVABILITY
# ============================================================

app.include_router(
    health.router,
    prefix=f"{settings.API_V1_STR}/health",
    tags=["Health"],
)


# ============================================================
# JOBS & ASSESSMENT CONFIGURATION
# ============================================================

app.include_router(
    jobs.router,
    prefix=f"{settings.API_V1_STR}/jobs",
    tags=["Jobs"],
)


# ============================================================
# CANDIDATE APPLICATIONS & HIRING PIPELINE
# ============================================================

app.include_router(
    applications.router,
    prefix=f"{settings.API_V1_STR}/applications",
    tags=["Applications"],
)


# ============================================================
# ASSESSMENT INVITATIONS & SECURE LAUNCH
# ============================================================

app.include_router(
    invitations.router,
    prefix=f"{settings.API_V1_STR}/invitations",
    tags=["Invitations"],
)


# ============================================================
# MULTIMODAL VOICE INTERVIEW & TIMELINE REPLAY
# ============================================================

app.include_router(
    voice_interview.router,
    prefix=f"{settings.API_V1_STR}/voice-interview",
    tags=["Voice Interview"],
)


# ============================================================
# RECRUITER COMPARISON, RANKING & AUDITING
# ============================================================

app.include_router(
    recruiter.router,
    prefix=f"{settings.API_V1_STR}/recruiter",
    tags=["Recruiter"],
)


# ============================================================
# EMPIRICAL AI BENCHMARKS
# ============================================================

app.include_router(
    benchmarks.router,
    prefix=f"{settings.API_V1_STR}/benchmarks",
    tags=["AI Benchmarks"],
)


# ============================================================
# ROOT HEALTH CHECK
# ============================================================

@app.get("/", tags=["Health"])
async def health_check():
    return {
        "status": "active",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }