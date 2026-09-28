import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, field_validator


# ============================================================
# ASSESSMENT CREATION & RESPONSE
# ============================================================

class AssessmentCreate(BaseModel):
    role: str
    assessment_type: str = "interview" # "interview", "mcq", "coding"
    difficulty: str = "Intermediate" # "Beginner", "Intermediate", "Advanced"
    language: Optional[str] = None # For coding: "java", "python", "javascript"
    question_count: Optional[int] = 5


class AssessmentResponse(BaseModel):
    id: int
    user_id: int
    role: str
    assessment_type: str
    difficulty: Optional[str] = "Intermediate"
    language: Optional[str] = None
    status: str
    score: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# MCQ SCHEMAS
# ============================================================

class MCQQuestionCandidate(BaseModel):
    """Secured MCQ representation sent to the candidate during assessment."""
    id: int
    interview_id: int
    question_number: int
    question_text: str
    options: List[str]
    topic: Optional[str] = None
    difficulty: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MCQQuestionRevealed(BaseModel):
    """Revealed MCQ representation sent only after submission."""
    id: int
    interview_id: int
    question_number: int
    question_text: str
    options: List[str]
    selected_option: Optional[int] = None
    correct_answer: int
    is_correct: Optional[bool] = None
    explanation: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None


class MCQAnswerItem(BaseModel):
    question_id: int
    selected_option: int # 0, 1, 2, 3


class MCQSubmissionRequest(BaseModel):
    answers: List[MCQAnswerItem]


# ============================================================
# CODING SCHEMAS
# ============================================================

class CodingProblemResponse(BaseModel):
    id: int
    interview_id: int
    question_number: int
    title: str
    description: str
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None
    examples: List[Dict[str, Any]] = []
    starter_code: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None


class CodeSubmissionRequest(BaseModel):
    question_id: int
    code: str
    language: Optional[str] = "python"


class CodingEvaluationResult(BaseModel):
    score: int
    test_cases_passed: int
    test_cases_total: int
    code_quality_score: int
    feedback: str
    strengths: List[str] = []
    improvements: List[str] = []


# ============================================================
# TOPIC PERFORMANCE & SKILL GAP
# ============================================================

class TopicScore(BaseModel):
    topic: str
    total_questions: int
    correct_answers: int
    accuracy_percentage: float
    average_score: float


class SkillGapReport(BaseModel):
    overall_competency_level: str
    strong_areas: List[str] = []
    weak_areas: List[str] = []
    skill_gaps: List[str] = []
    recommended_topics: List[str] = []
    recommended_practice_order: List[str] = []
    recommended_difficulty: str
    summary: str


# ============================================================
# UNIFIED RESULT
# ============================================================

class UnifiedAssessmentResult(BaseModel):
    assessment_id: int
    role: str
    assessment_type: str
    difficulty: Optional[str] = "Intermediate"
    language: Optional[str] = None
    status: str
    score: float # Overall score out of 10
    total_questions: int
    answered_questions: int
    correct_answers: Optional[int] = None
    accuracy_percentage: Optional[float] = None
    topic_performance: List[TopicScore] = []
    skill_gap_report: Optional[SkillGapReport] = None
    mcq_questions: Optional[List[MCQQuestionRevealed]] = None
    coding_evaluation: Optional[Dict[str, Any]] = None
    interview_answers: Optional[List[Dict[str, Any]]] = None
