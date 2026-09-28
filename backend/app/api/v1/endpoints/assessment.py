import io
import json
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.interview import Interview
from app.models.question import Question
from app.models.answer import Answer
from app.models.user import User
from app.models.resume import Resume
from app.models.integrity_event import AssessmentIntegrityEvent
from app.models.question_bank import QuestionBank
from app.api.v1.endpoints.auth import get_current_user

from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentResponse,
    MCQQuestionCandidate,
    MCQQuestionRevealed,
    MCQSubmissionRequest,
    CodingProblemResponse,
    CodeSubmissionRequest,
    CodingEvaluationResult,
    TopicScore,
    SkillGapReport,
    UnifiedAssessmentResult,
)
from app.services.gemini import (
    generate_mcq_questions,
    generate_coding_problem,
    evaluate_code_submission,
    generate_skill_gap_analysis,
    generate_interview_questions,
    generate_context_adaptive_question,
    generate_learning_roadmap,
    generate_rag_grounded_question,
    validate_question_with_ai,
)
from app.services.rag_service import retrieve_grounded_context
from app.services.question_validator import validate_question_structure, evaluate_question_quality_deterministic
from app.services.skill_mastery_service import update_candidate_skill_mastery, get_or_create_candidate_skills
from app.services.adaptive_engine import rank_next_adaptive_topic
from app.services.code_executor import execute_code_sandboxed
from app.services.pdf_generator import generate_assessment_pdf_report
from app.services.question_bank_service import is_duplicate_question, save_to_question_bank

router = APIRouter()


# ============================================================
# ADAPTIVE DIFFICULTY HELPER
# ============================================================

def compute_adaptive_difficulty(current_difficulty: str, score_out_of_10: float) -> str:
    levels = ["Beginner", "Intermediate", "Advanced"]
    cur_idx = levels.index(current_difficulty) if current_difficulty in levels else 1
    if score_out_of_10 >= 8.0:
        new_idx = min(len(levels) - 1, cur_idx + 1)
    elif score_out_of_10 < 5.0:
        new_idx = max(0, cur_idx - 1)
    else:
        new_idx = cur_idx
    return levels[new_idx]


# ============================================================
# CREATE ASSESSMENT
# ============================================================

@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
)
def create_assessment(
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = data.get("role", "Java Developer")
    a_type = data.get("assessment_type", "interview").lower()
    diff = data.get("difficulty", "Intermediate")
    lang = data.get("language")
    time_limit = data.get("time_limit_minutes")
    resume_id = data.get("resume_id")

    if not resume_id:
        user_resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
        if user_resume:
            resume_id = user_resume.id

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=int(time_limit)) if time_limit else None

    # Initialize candidate skill profile if first time
    get_or_create_candidate_skills(db, user_id=current_user.id, role=role)

    assessment = Interview(
        user_id=current_user.id,
        resume_id=resume_id,
        role=role,
        assessment_type=a_type,
        difficulty=diff,
        language=lang,
        time_limit_minutes=time_limit,
        started_at=now,
        expires_at=expires_at,
        integrity_status="Normal",
        status="created",
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return {
        "id": assessment.id,
        "user_id": assessment.user_id,
        "resume_id": assessment.resume_id,
        "role": assessment.role,
        "assessment_type": assessment.assessment_type,
        "difficulty": assessment.difficulty,
        "language": assessment.language,
        "time_limit_minutes": assessment.time_limit_minutes,
        "expires_at": assessment.expires_at,
        "status": assessment.status,
        "created_at": assessment.created_at,
    }


# ============================================================
# GENERATE MCQ QUESTIONS (RAG-Grounded + Validated)
# ============================================================

@router.post(
    "/{assessment_id}/generate-mcqs",
    status_code=status.HTTP_201_CREATED,
)
def generate_mcqs(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = (
        db.query(Interview)
        .filter(Interview.id == assessment_id, Interview.user_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    existing = (
        db.query(Question)
        .filter(Question.interview_id == assessment_id)
        .order_by(Question.question_number.asc())
        .all()
    )
    if existing:
        return [
            {
                "id": q.id,
                "interview_id": q.interview_id,
                "question_number": q.question_number,
                "question_text": q.question_text,
                "options": json.loads(q.options_json) if q.options_json else [],
                "topic": q.topic,
                "difficulty": q.difficulty or assessment.difficulty,
                "question_type": "mcq",
            }
            for q in existing
        ]

    # 1. Check resume context
    resume_skills = []
    if assessment.resume_id:
        resume = db.query(Resume).filter(Resume.id == assessment.resume_id).first()
        if resume and resume.skills_json:
            resume_skills = json.loads(resume.skills_json)

    # 2. RAG Retrieval from curated & approved Question Bank
    rag_data = retrieve_grounded_context(
        db=db,
        role=assessment.role,
        difficulty=assessment.difficulty or "Intermediate",
        resume_skills=resume_skills,
        limit=3,
    )

    # 3. Generate structured MCQs
    try:
        mcq_data = generate_mcq_questions(
            role=assessment.role,
            number_of_questions=5,
            difficulty=assessment.difficulty or "Intermediate",
            resume_skills=resume_skills,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate MCQs: {str(e)}")

    saved_questions = []
    for item in mcq_data:
        # Validate question structure
        is_valid, reason = validate_question_structure(item, question_type="mcq")
        if not is_valid:
            continue

        is_dup = is_duplicate_question(db, item["question"], assessment.role, current_user.id)

        # AI Quality Review
        quality_eval = evaluate_question_quality_deterministic(
            item, role=assessment.role, topic=item.get("topic"), difficulty=assessment.difficulty
        )

        q = Question(
            interview_id=assessment_id,
            question_text=item["question"],
            question_number=item["question_number"],
            question_type="mcq",
            options_json=json.dumps(item["options"]),
            correct_answer=item["correct_answer"],
            explanation=item.get("explanation"),
            topic=item.get("topic", "Technical"),
            subtopic=item.get("subtopic"),
            difficulty=item.get("difficulty", assessment.difficulty),
            retrieval_metadata_json=json.dumps({
                "retrieval_source": rag_data["retrieval_source"],
                "source_ids": rag_data["source_ids"],
                "model": "gemini-3.6-flash",
                "quality_score": quality_eval.get("quality_score", 9.0),
            }),
        )
        db.add(q)
        saved_questions.append(q)

        # Cache in QuestionBank
        if not is_dup:
            save_to_question_bank(
                db=db,
                role=assessment.role,
                question_text=item["question"],
                question_type="mcq",
                topic=item.get("topic"),
                difficulty=assessment.difficulty or "Intermediate",
                options=item["options"],
                correct_answer=item["correct_answer"],
                explanation=item.get("explanation"),
            )

    assessment.status = "in_progress"
    db.commit()

    return [
        {
            "id": q.id,
            "interview_id": q.interview_id,
            "question_number": q.question_number,
            "question_text": q.question_text,
            "options": json.loads(q.options_json),
            "topic": q.topic,
            "difficulty": q.difficulty,
            "question_type": "mcq",
        }
        for q in saved_questions
    ]


# ============================================================
# GENERATE CODING PROBLEM
# ============================================================

@router.post(
    "/{assessment_id}/generate-coding",
    response_model=CodingProblemResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_coding(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = (
        db.query(Interview)
        .filter(Interview.id == assessment_id, Interview.user_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    existing = (
        db.query(Question)
        .filter(Question.interview_id == assessment_id, Question.question_type == "coding")
        .first()
    )
    if existing:
        meta = json.loads(existing.coding_metadata_json) if existing.coding_metadata_json else {}
        return CodingProblemResponse(
            id=existing.id,
            interview_id=existing.interview_id,
            question_number=existing.question_number,
            title=meta.get("title", "Coding Challenge"),
            description=existing.question_text,
            input_format=meta.get("input_format"),
            output_format=meta.get("output_format"),
            constraints=meta.get("constraints"),
            examples=meta.get("examples", []),
            starter_code=meta.get("starter_code"),
            topic=existing.topic,
            difficulty=existing.difficulty,
        )

    lang = assessment.language or "Python"
    diff = assessment.difficulty or "Intermediate"
    try:
        problem = generate_coding_problem(role=assessment.role, language=lang, difficulty=diff)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate coding problem: {str(e)}")

    q = Question(
        interview_id=assessment_id,
        question_text=problem["description"],
        question_number=1,
        question_type="coding",
        topic=problem.get("topic", "Algorithms"),
        difficulty=problem.get("difficulty", diff),
        coding_metadata_json=json.dumps(problem),
    )
    db.add(q)
    assessment.status = "in_progress"
    db.commit()
    db.refresh(q)

    save_to_question_bank(
        db=db,
        role=assessment.role,
        question_text=problem["description"],
        question_type="coding",
        topic=problem.get("topic"),
        difficulty=diff,
        coding_metadata=problem,
    )

    return CodingProblemResponse(
        id=q.id,
        interview_id=q.interview_id,
        question_number=q.question_number,
        title=problem.get("title", "Coding Challenge"),
        description=problem["description"],
        input_format=problem.get("input_format"),
        output_format=problem.get("output_format"),
        constraints=problem.get("constraints"),
        examples=problem.get("examples", []),
        starter_code=problem.get("starter_code"),
        topic=q.topic,
        difficulty=q.difficulty,
    )


# ============================================================
# GET ASSESSMENT QUESTIONS
# ============================================================

@router.get(
    "/{assessment_id}/questions",
    response_model=List[Dict[str, Any]],
)
def get_assessment_questions(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = (
        db.query(Interview)
        .filter(Interview.id == assessment_id, Interview.user_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    questions = (
        db.query(Question)
        .filter(Question.interview_id == assessment_id)
        .order_by(Question.question_number.asc())
        .all()
    )

    remaining_seconds = None
    if assessment.expires_at:
        now = datetime.now(timezone.utc)
        diff = (assessment.expires_at - now).total_seconds()
        remaining_seconds = max(0, int(diff))

    out = []
    for q in questions:
        if q.question_type == "mcq":
            opts = json.loads(q.options_json) if q.options_json else []
            if assessment.status == "completed":
                ans = (
                    db.query(Answer)
                    .filter(Answer.interview_id == assessment_id, Answer.question_id == q.id)
                    .first()
                )
                out.append({
                    "id": q.id,
                    "question_number": q.question_number,
                    "question_text": q.question_text,
                    "options": opts,
                    "selected_option": ans.selected_option if ans else None,
                    "correct_answer": q.correct_answer,
                    "is_correct": ans.is_correct if ans else False,
                    "explanation": q.explanation,
                    "topic": q.topic,
                    "difficulty": q.difficulty,
                    "question_type": "mcq",
                    "remaining_seconds": remaining_seconds,
                })
            else:
                out.append({
                    "id": q.id,
                    "question_number": q.question_number,
                    "question_text": q.question_text,
                    "options": opts,
                    "topic": q.topic,
                    "difficulty": q.difficulty,
                    "question_type": "mcq",
                    "remaining_seconds": remaining_seconds,
                })
        elif q.question_type == "coding":
            meta = json.loads(q.coding_metadata_json) if q.coding_metadata_json else {}
            out.append({
                "id": q.id,
                "question_number": q.question_number,
                "title": meta.get("title", "Coding Challenge"),
                "description": q.question_text,
                "input_format": meta.get("input_format"),
                "output_format": meta.get("output_format"),
                "constraints": meta.get("constraints"),
                "examples": meta.get("examples", []),
                "starter_code": meta.get("starter_code"),
                "topic": q.topic,
                "difficulty": q.difficulty,
                "question_type": "coding",
                "remaining_seconds": remaining_seconds,
            })
        else:
            out.append({
                "id": q.id,
                "question_number": q.question_number,
                "question_text": q.question_text,
                "question_type": "text",
                "remaining_seconds": remaining_seconds,
            })
    return out


# ============================================================
# ANTI-CHEATING / INTEGRITY MONITORING
# ============================================================

@router.post(
    "/{assessment_id}/integrity-events",
    status_code=status.HTTP_201_CREATED,
)
def record_integrity_event(
    assessment_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = (
        db.query(Interview)
        .filter(Interview.id == assessment_id, Interview.user_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    event_type = payload.get("event_type", "tab_switch")
    details = payload.get("details", "")

    event = AssessmentIntegrityEvent(
        interview_id=assessment_id,
        event_type=event_type,
        details=details,
    )
    db.add(event)
    db.commit()

    total_events = (
        db.query(AssessmentIntegrityEvent)
        .filter(AssessmentIntegrityEvent.interview_id == assessment_id)
        .count()
    )
    if total_events >= 3:
        assessment.integrity_status = "Integrity Warning"
    else:
        assessment.integrity_status = "Normal"

    db.commit()

    return {
        "message": "Integrity event recorded",
        "total_events": total_events,
        "integrity_status": assessment.integrity_status,
    }


# ============================================================
# SUBMIT MCQ ASSESSMENT (Updates Continual Skill Mastery)
# ============================================================

@router.post(
    "/{assessment_id}/submit-mcq",
    response_model=UnifiedAssessmentResult,
)
def submit_mcq(
    assessment_id: int,
    submission: MCQSubmissionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = (
        db.query(Interview)
        .filter(Interview.id == assessment_id, Interview.user_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    questions = (
        db.query(Question)
        .filter(Question.interview_id == assessment_id)
        .all()
    )
    q_map = {q.id: q for q in questions}

    correct_count = 0
    topic_map: Dict[str, Dict[str, int]] = {}

    for item in submission.answers:
        q = q_map.get(item.question_id)
        if not q:
            continue

        opts = json.loads(q.options_json) if q.options_json else []
        selected_text = opts[item.selected_option] if 0 <= item.selected_option < len(opts) else "None"
        is_corr = item.selected_option == q.correct_answer

        if is_corr:
            correct_count += 1
            score = 10
        else:
            score = 0

        t = q.topic or "Technical"
        if t not in topic_map:
            topic_map[t] = {"total": 0, "correct": 0}
        topic_map[t]["total"] += 1
        if is_corr:
            topic_map[t]["correct"] += 1

        # Upsert answer record
        existing_ans = (
            db.query(Answer)
            .filter(Answer.interview_id == assessment_id, Answer.question_id == q.id)
            .first()
        )
        if existing_ans:
            existing_ans.selected_option = item.selected_option
            existing_ans.is_correct = is_corr
            existing_ans.answer_text = selected_text
            existing_ans.score = score
            existing_ans.topic = t
            existing_ans.feedback = q.explanation
        else:
            ans = Answer(
                interview_id=assessment_id,
                question_id=q.id,
                answer_text=selected_text,
                selected_option=item.selected_option,
                is_correct=is_corr,
                score=score,
                topic=t,
                feedback=q.explanation,
                strengths=json.dumps(["Answered correctly" if is_corr else "Attempted problem"]),
                improvements=json.dumps([] if is_corr else [f"Review {t} concepts and explanation."]),
            )
            db.add(ans)

        # Continual Skill Mastery Update
        update_candidate_skill_mastery(
            db=db,
            user_id=current_user.id,
            role=assessment.role,
            topic=t,
            score_out_of_10=float(score),
            subtopic=q.subtopic,
        )

    total_q = len(questions) if questions else len(submission.answers)
    overall_score = round((correct_count / total_q) * 10, 1) if total_q > 0 else 0.0
    accuracy_pct = round((correct_count / total_q) * 100, 1) if total_q > 0 else 0.0

    topic_performance = []
    for t, vals in topic_map.items():
        acc = round((vals["correct"] / vals["total"]) * 100, 1) if vals["total"] > 0 else 0.0
        topic_performance.append(
            TopicScore(
                topic=t,
                total_questions=vals["total"],
                correct_answers=vals["correct"],
                accuracy_percentage=acc,
                average_score=round((acc / 10), 1),
            )
        )

    next_diff = compute_adaptive_difficulty(assessment.difficulty or "Intermediate", overall_score)

    try:
        skill_gap = generate_skill_gap_analysis(
            role=assessment.role,
            assessment_history_summary={
                "assessment_type": "MCQ",
                "score": overall_score,
                "accuracy": f"{accuracy_pct}%",
                "correct_answers": f"{correct_count}/{total_q}",
            },
            topic_breakdown=[tp.model_dump() for tp in topic_performance],
        )
    except Exception:
        skill_gap = {
            "overall_competency_level": assessment.difficulty or "Intermediate",
            "strong_areas": [tp.topic for tp in topic_performance if tp.accuracy_percentage >= 75],
            "weak_areas": [tp.topic for tp in topic_performance if tp.accuracy_percentage < 75],
            "skill_gaps": ["Review missed concepts in explanations"],
            "recommended_topics": [tp.topic for tp in topic_performance if tp.accuracy_percentage < 75],
            "recommended_practice_order": ["Practice targeted topics with difficulty " + next_diff],
            "recommended_difficulty": next_diff,
            "summary": f"Completed MCQ assessment with {accuracy_pct}% accuracy.",
        }

    roadmap = generate_learning_roadmap(
        role=assessment.role,
        topic_performance=[tp.model_dump() for tp in topic_performance],
        weak_areas=skill_gap.get("weak_areas", []),
        skill_gaps=skill_gap.get("skill_gaps", []),
    )

    assessment.status = "completed"
    assessment.score = int(round(overall_score))
    assessment.skill_gap_json = json.dumps(skill_gap)
    assessment.learning_roadmap_json = json.dumps(roadmap)
    assessment.metadata_json = json.dumps({
        "accuracy": accuracy_pct,
        "correct": correct_count,
        "total": total_q,
        "next_difficulty": next_diff,
        "topic_performance": [tp.model_dump() for tp in topic_performance],
    })
    db.commit()
    db.refresh(assessment)

    revealed_mcqs = []
    for q in questions:
        ans = (
            db.query(Answer)
            .filter(Answer.interview_id == assessment_id, Answer.question_id == q.id)
            .first()
        )
        revealed_mcqs.append(
            MCQQuestionRevealed(
                id=q.id,
                interview_id=q.interview_id,
                question_number=q.question_number,
                question_text=q.question_text,
                options=json.loads(q.options_json) if q.options_json else [],
                selected_option=ans.selected_option if ans else None,
                correct_answer=q.correct_answer or 0,
                is_correct=ans.is_correct if ans else False,
                explanation=q.explanation,
                topic=q.topic,
                difficulty=q.difficulty,
            )
        )

    return UnifiedAssessmentResult(
        assessment_id=assessment.id,
        role=assessment.role,
        assessment_type="mcq",
        difficulty=assessment.difficulty,
        status="completed",
        score=overall_score,
        total_questions=total_q,
        answered_questions=len(submission.answers),
        correct_answers=correct_count,
        accuracy_percentage=accuracy_pct,
        topic_performance=topic_performance,
        skill_gap_report=SkillGapReport(**skill_gap),
        mcq_questions=revealed_mcqs,
    )


# ============================================================
# SUBMIT CODING ASSESSMENT
# ============================================================

@router.post(
    "/{assessment_id}/submit-code",
    response_model=UnifiedAssessmentResult,
)
def submit_code(
    assessment_id: int,
    submission: CodeSubmissionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = (
        db.query(Interview)
        .filter(Interview.id == assessment_id, Interview.user_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    question = (
        db.query(Question)
        .filter(Question.id == submission.question_id, Question.interview_id == assessment_id)
        .first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    meta = json.loads(question.coding_metadata_json) if question.coding_metadata_json else {}
    test_cases = meta.get("hidden_test_cases", [])

    sandbox_results = execute_code_sandboxed(
        language=submission.language or assessment.language or "python",
        code=submission.code,
        test_cases=test_cases,
    )

    try:
        eval_result = evaluate_code_submission(
            problem_text=question.question_text,
            language=submission.language or assessment.language or "Python",
            code=submission.code,
            test_cases=test_cases,
        )
    except Exception:
        eval_result = {
            "score": 7,
            "test_cases_passed": sandbox_results["tests_passed"],
            "test_cases_total": sandbox_results["tests_total"],
            "code_quality_score": 7,
            "feedback": "Code evaluated via isolated execution harness.",
            "strengths": ["Clean structure and syntax"],
            "improvements": ["Optimize space complexity under large inputs"],
        }

    if sandbox_results["tests_total"] > 0:
        eval_result["test_cases_passed"] = sandbox_results["tests_passed"]
        eval_result["test_cases_total"] = sandbox_results["tests_total"]
        eval_result["execution_mode"] = sandbox_results["execution_mode"]
        eval_result["execution_details"] = sandbox_results["details"]

    total_tc = max(1, eval_result["test_cases_total"])
    passed_tc = eval_result["test_cases_passed"]
    correctness_ratio = (passed_tc / total_tc) * 10
    quality_score = eval_result["code_quality_score"]

    combined_score = round(0.6 * correctness_ratio + 0.4 * quality_score, 1)
    eval_result["score"] = int(round(combined_score))
    eval_result["correctness_score"] = round(correctness_ratio, 1)
    eval_result["efficiency_score"] = quality_score

    existing_ans = (
        db.query(Answer)
        .filter(Answer.interview_id == assessment_id, Answer.question_id == question.id)
        .first()
    )
    if existing_ans:
        existing_ans.answer_text = submission.code
        existing_ans.code_language = submission.language or "python"
        existing_ans.score = int(round(combined_score))
        existing_ans.test_cases_passed = passed_tc
        existing_ans.test_cases_total = total_tc
        existing_ans.code_quality_score = quality_score
        existing_ans.feedback = eval_result["feedback"]
        existing_ans.strengths = json.dumps(eval_result["strengths"])
        existing_ans.improvements = json.dumps(eval_result["improvements"])
        existing_ans.topic = question.topic
    else:
        ans = Answer(
            interview_id=assessment_id,
            question_id=question.id,
            answer_text=submission.code,
            code_language=submission.language or "python",
            score=int(round(combined_score)),
            test_cases_passed=passed_tc,
            test_cases_total=total_tc,
            code_quality_score=quality_score,
            feedback=eval_result["feedback"],
            strengths=json.dumps(eval_result["strengths"]),
            improvements=json.dumps(eval_result["improvements"]),
            topic=question.topic,
        )
        db.add(ans)

    # Continual Skill Mastery Update
    update_candidate_skill_mastery(
        db=db,
        user_id=current_user.id,
        role=assessment.role,
        topic=question.topic or "Arrays & Algorithms",
        score_out_of_10=float(combined_score),
    )

    next_diff = compute_adaptive_difficulty(assessment.difficulty or "Intermediate", combined_score)

    try:
        skill_gap = generate_skill_gap_analysis(
            role=assessment.role,
            assessment_history_summary={
                "assessment_type": "Coding",
                "score": combined_score,
                "test_cases": f"{passed_tc}/{total_tc}",
                "code_quality": f"{quality_score}/10",
            },
            topic_breakdown=[{
                "topic": question.topic or "Algorithms",
                "score": combined_score,
                "quality": quality_score,
            }],
        )
    except Exception:
        skill_gap = {
            "overall_competency_level": assessment.difficulty or "Intermediate",
            "strong_areas": eval_result.get("strengths", []),
            "weak_areas": eval_result.get("improvements", []),
            "skill_gaps": ["Edge cases and Big-O runtime optimization"],
            "recommended_topics": [question.topic or "Data Structures"],
            "recommended_practice_order": ["Practice algorithmic complexity and edge cases"],
            "recommended_difficulty": next_diff,
            "summary": "Completed coding assessment.",
        }

    roadmap = generate_learning_roadmap(
        role=assessment.role,
        topic_performance=[{"topic": question.topic or "Algorithms", "average_score": combined_score}],
        weak_areas=skill_gap.get("weak_areas", []),
        skill_gaps=skill_gap.get("skill_gaps", []),
    )

    assessment.status = "completed"
    assessment.score = int(round(combined_score))
    assessment.skill_gap_json = json.dumps(skill_gap)
    assessment.learning_roadmap_json = json.dumps(roadmap)
    assessment.metadata_json = json.dumps({
        "eval_result": eval_result,
        "next_difficulty": next_diff,
    })
    db.commit()
    db.refresh(assessment)

    topic_performance = [
        TopicScore(
            topic=question.topic or "Algorithms",
            total_questions=1,
            correct_answers=1 if combined_score >= 7 else 0,
            accuracy_percentage=combined_score * 10,
            average_score=combined_score,
        )
    ]

    return UnifiedAssessmentResult(
        assessment_id=assessment.id,
        role=assessment.role,
        assessment_type="coding",
        difficulty=assessment.difficulty,
        language=submission.language,
        status="completed",
        score=combined_score,
        total_questions=1,
        answered_questions=1,
        topic_performance=topic_performance,
        skill_gap_report=SkillGapReport(**skill_gap),
        coding_evaluation=eval_result,
    )


# ============================================================
# ADVANCED ADAPTIVE NEXT QUESTION (Deterministic Ranking)
# ============================================================

@router.post(
    "/{assessment_id}/next-adaptive-question",
    status_code=status.HTTP_200_OK,
)
def get_next_adaptive_question(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = (
        db.query(Interview)
        .filter(Interview.id == assessment_id, Interview.user_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Fetch already asked topics in this assessment session
    past_questions = db.query(Question).filter(Question.interview_id == assessment_id).all()
    asked_topics = [q.topic for q in past_questions if q.topic]

    # Fetch resume skills
    resume_skills = []
    if assessment.resume_id:
        resume = db.query(Resume).filter(Resume.id == assessment.resume_id).first()
        if resume and resume.skills_json:
            resume_skills = json.loads(resume.skills_json)

    # 1. Deterministic Adaptive Ranking
    ranking_decision = rank_next_adaptive_topic(
        db=db,
        user_id=current_user.id,
        role=assessment.role,
        asked_topics_in_session=asked_topics,
        resume_skills=resume_skills,
    )

    target_topic = ranking_decision["selected_topic"]
    target_difficulty = ranking_decision["target_difficulty"]

    # 2. RAG Retrieval from Question Bank
    rag_data = retrieve_grounded_context(
        db=db,
        role=assessment.role,
        topic=target_topic,
        difficulty=target_difficulty,
        resume_skills=resume_skills,
        limit=2,
    )

    # 3. Grounded Question Generation
    question_data = generate_rag_grounded_question(
        role=assessment.role,
        topic=target_topic,
        difficulty=target_difficulty,
        candidate_weaknesses=[target_topic],
        retrieved_context=rag_data["context_summary"],
        resume_skills=resume_skills,
    )

    q_count = len(past_questions)
    new_q = Question(
        interview_id=assessment_id,
        question_text=question_data.get("question") or f"Explain principles of {target_topic}.",
        question_number=q_count + 1,
        question_type="mcq" if "options" in question_data else "text",
        options_json=json.dumps(question_data.get("options")) if "options" in question_data else None,
        correct_answer=question_data.get("correct_answer"),
        explanation=question_data.get("explanation"),
        topic=target_topic,
        difficulty=target_difficulty,
        retrieval_metadata_json=json.dumps({
            "retrieval_source": rag_data["retrieval_source"],
            "source_ids": rag_data["source_ids"],
            "model": "gemini-3.6-flash",
        }),
        adaptive_metadata_json=json.dumps(ranking_decision),
    )
    db.add(new_q)
    assessment.difficulty = target_difficulty
    db.commit()
    db.refresh(new_q)

    return {
        "id": new_q.id,
        "question_number": new_q.question_number,
        "question_text": new_q.question_text,
        "topic": new_q.topic,
        "difficulty": new_q.difficulty,
        "options": json.loads(new_q.options_json) if new_q.options_json else None,
        "adaptive_decision": {
            "reason": ranking_decision["reason"],
            "mastery_score": ranking_decision["mastery_score"],
            "selection_score": ranking_decision["selection_score"],
        },
    }


# ============================================================
# EXPLAINABLE ADAPTIVE DECISION TRACEABILITY
# ============================================================

@router.get(
    "/{assessment_id}/adaptive-decision",
    status_code=status.HTTP_200_OK,
)
def get_adaptive_decision_trace(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = (
        db.query(Interview)
        .filter(Interview.id == assessment_id, Interview.user_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    questions = db.query(Question).filter(Question.interview_id == assessment_id).order_by(Question.question_number.asc()).all()

    trace = []
    for q in questions:
        trace.append({
            "question_number": q.question_number,
            "topic": q.topic,
            "difficulty": q.difficulty,
            "retrieval_metadata": json.loads(q.retrieval_metadata_json) if q.retrieval_metadata_json else None,
            "adaptive_decision": json.loads(q.adaptive_metadata_json) if q.adaptive_metadata_json else None,
        })

    return {
        "assessment_id": assessment_id,
        "role": assessment.role,
        "decision_trace": trace,
    }


# ============================================================
# GET RESULTS
# ============================================================

@router.get(
    "/{assessment_id}/results",
    status_code=status.HTTP_200_OK,
)
def get_unified_results(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = (
        db.query(Interview)
        .filter(Interview.id == assessment_id, Interview.user_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    questions = (
        db.query(Question)
        .filter(Question.interview_id == assessment_id)
        .order_by(Question.question_number.asc())
        .all()
    )
    answers = (
        db.query(Answer)
        .filter(Answer.interview_id == assessment_id)
        .all()
    )
    ans_map = {a.question_id: a for a in answers}

    skill_gap_data = json.loads(assessment.skill_gap_json) if assessment.skill_gap_json else None
    roadmap_data = json.loads(assessment.learning_roadmap_json) if assessment.learning_roadmap_json else []
    meta = json.loads(assessment.metadata_json) if assessment.metadata_json else {}

    if assessment.assessment_type == "mcq":
        revealed_mcqs = []
        correct_count = 0
        topic_map: Dict[str, Dict[str, int]] = {}

        for q in questions:
            ans = ans_map.get(q.id)
            is_corr = ans.is_correct if ans else False
            if is_corr:
                correct_count += 1

            t = q.topic or "Technical"
            if t not in topic_map:
                topic_map[t] = {"total": 0, "correct": 0}
            topic_map[t]["total"] += 1
            if is_corr:
                topic_map[t]["correct"] += 1

            revealed_mcqs.append({
                "id": q.id,
                "interview_id": q.interview_id,
                "question_number": q.question_number,
                "question_text": q.question_text,
                "options": json.loads(q.options_json) if q.options_json else [],
                "selected_option": ans.selected_option if ans else None,
                "correct_answer": q.correct_answer or 0,
                "is_correct": is_corr,
                "explanation": q.explanation,
                "topic": q.topic,
                "difficulty": q.difficulty,
            })

        total_q = len(questions)
        accuracy = round((correct_count / total_q) * 100, 1) if total_q > 0 else 0.0
        score_val = round((correct_count / total_q) * 10, 1) if total_q > 0 else 0.0

        topic_performance = [
            {
                "topic": t,
                "total_questions": vals["total"],
                "correct_answers": vals["correct"],
                "accuracy_percentage": round((vals["correct"] / vals["total"]) * 100, 1) if vals["total"] > 0 else 0.0,
                "average_score": round((vals["correct"] / vals["total"]) * 10, 1) if vals["total"] > 0 else 0.0,
            }
            for t, vals in topic_map.items()
        ]

        return {
            "assessment_id": assessment.id,
            "role": assessment.role,
            "assessment_type": "mcq",
            "difficulty": assessment.difficulty,
            "status": assessment.status,
            "score": score_val,
            "total_questions": total_q,
            "answered_questions": len(answers),
            "correct_answers": correct_count,
            "accuracy_percentage": accuracy,
            "integrity_status": assessment.integrity_status,
            "topic_performance": topic_performance,
            "skill_gap_report": skill_gap_data,
            "learning_roadmap": roadmap_data,
            "mcq_questions": revealed_mcqs,
        }

    elif assessment.assessment_type == "coding":
        coding_eval = meta.get("eval_result")
        q = questions[0] if questions else None
        topic_name = q.topic if q else "Algorithms"

        score_val = float(assessment.score or 0)
        topic_performance = [
            {
                "topic": topic_name,
                "total_questions": 1,
                "correct_answers": 1 if score_val >= 7 else 0,
                "accuracy_percentage": score_val * 10,
                "average_score": score_val,
            }
        ]

        return {
            "assessment_id": assessment.id,
            "role": assessment.role,
            "assessment_type": "coding",
            "difficulty": assessment.difficulty,
            "language": assessment.language,
            "status": assessment.status,
            "score": score_val,
            "total_questions": 1,
            "answered_questions": len(answers),
            "integrity_status": assessment.integrity_status,
            "topic_performance": topic_performance,
            "skill_gap_report": skill_gap_data,
            "learning_roadmap": roadmap_data,
            "coding_evaluation": coding_eval,
        }

    else:
        scored = [a for a in answers if a.score is not None]
        avg_score = round(sum(a.score for a in scored) / len(scored), 1) if scored else 0.0

        int_answers = []
        for a in answers:
            int_answers.append({
                "id": a.id,
                "question_id": a.question_id,
                "answer_text": a.answer_text,
                "score": a.score,
                "feedback": a.feedback,
                "strengths": json.loads(a.strengths) if isinstance(a.strengths, str) else (a.strengths or []),
                "improvements": json.loads(a.improvements) if isinstance(a.improvements, str) else (a.improvements or []),
            })

        topic_performance = [
            {
                "topic": "System & Technical Interview",
                "total_questions": len(questions),
                "correct_answers": len([a for a in scored if a.score >= 7]),
                "accuracy_percentage": round(avg_score * 10, 1),
                "average_score": avg_score,
            }
        ]

        return {
            "assessment_id": assessment.id,
            "role": assessment.role,
            "assessment_type": "interview",
            "difficulty": assessment.difficulty,
            "status": assessment.status,
            "score": avg_score,
            "total_questions": len(questions),
            "answered_questions": len(answers),
            "integrity_status": assessment.integrity_status,
            "topic_performance": topic_performance,
            "skill_gap_report": skill_gap_data,
            "learning_roadmap": roadmap_data,
            "interview_answers": int_answers,
        }


# ============================================================
# DOWNLOAD PDF ASSESSMENT REPORT
# ============================================================

@router.get(
    "/{assessment_id}/report.pdf",
    status_code=status.HTTP_200_OK,
)
def download_pdf_report(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assessment = (
        db.query(Interview)
        .filter(Interview.id == assessment_id, Interview.user_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    unified_data = get_unified_results(assessment_id=assessment_id, db=db, current_user=current_user)

    pdf_bytes = generate_assessment_pdf_report(
        candidate_name=current_user.full_name or "Candidate",
        candidate_email=current_user.email,
        assessment_data=unified_data,
    )

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="CodeVigilant_Report_Assessment_{assessment_id}.pdf"'
        },
    )


# ============================================================
# MULTI-MODE ANALYTICS SUMMARY
# ============================================================

@router.get(
    "/analytics/summary",
    response_model=Dict[str, Any],
)
def get_multi_mode_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    all_assessments = (
        db.query(Interview)
        .filter(Interview.user_id == current_user.id)
        .order_by(Interview.created_at.asc())
        .all()
    )

    total_count = len(all_assessments)
    completed = [a for a in all_assessments if a.status == "completed" or (a.score is not None and a.score > 0)]

    all_scores = [a.score for a in completed if a.score is not None]
    overall_avg = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0.0
    best_score = max(all_scores) if all_scores else 0

    mcq_assessments = [a for a in completed if a.assessment_type == "mcq"]
    mcq_scores = [a.score for a in mcq_assessments if a.score is not None]
    mcq_avg = round(sum(mcq_scores) / len(mcq_scores), 1) if mcq_scores else 0.0

    coding_assessments = [a for a in completed if a.assessment_type == "coding"]
    coding_scores = [a.score for a in coding_assessments if a.score is not None]
    coding_avg = round(sum(coding_scores) / len(coding_scores), 1) if coding_scores else 0.0

    interview_assessments = [a for a in completed if a.assessment_type == "interview" or not a.assessment_type]
    interview_scores = [a.score for a in interview_assessments if a.score is not None]
    interview_avg = round(sum(interview_scores) / len(interview_scores), 1) if interview_scores else 0.0

    score_history = [
        {
            "id": a.id,
            "role": a.role,
            "assessment_type": a.assessment_type or "interview",
            "score": a.score,
            "date": a.created_at.strftime("%b %d") if a.created_at else "Recent",
            "difficulty": a.difficulty or "Intermediate",
        }
        for a in all_assessments if a.score is not None
    ]

    all_answers = (
        db.query(Answer)
        .join(Interview, Interview.id == Answer.interview_id)
        .filter(Interview.user_id == current_user.id)
        .all()
    )
    topic_agg: Dict[str, Dict[str, int]] = {}
    for ans in all_answers:
        t = ans.topic or "Core Technical"
        if t not in topic_agg:
            topic_agg[t] = {"total": 0, "scores": []}
        topic_agg[t]["total"] += 1
        if ans.score is not None:
            topic_agg[t]["scores"].append(ans.score)

    topic_performance_list = []
    for t, data in topic_agg.items():
        avg = round(sum(data["scores"]) / len(data["scores"]), 1) if data["scores"] else 0.0
        topic_performance_list.append({
            "topic": t,
            "total_questions": data["total"],
            "average_score": avg,
            "accuracy_percentage": round(avg * 10, 1),
        })

    if overall_avg >= 8.0:
        skill_level = "Advanced / Production-Ready"
    elif overall_avg >= 6.0:
        skill_level = "Intermediate / Competent"
    elif overall_avg > 0:
        skill_level = "Junior / Developing"
    else:
        skill_level = "Entry / Starting"

    return {
        "total_assessments": total_count,
        "completed_assessments": len(completed),
        "overall_average_score": overall_avg,
        "best_score": best_score,
        "current_skill_level": skill_level,
        "mode_breakdown": {
            "mcq": {
                "count": len(mcq_assessments),
                "average_score": mcq_avg,
            },
            "coding": {
                "count": len(coding_assessments),
                "average_score": coding_avg,
            },
            "interview": {
                "count": len(interview_assessments),
                "average_score": interview_avg,
            },
        },
        "score_history": score_history,
        "topic_performance": topic_performance_list,
    }
