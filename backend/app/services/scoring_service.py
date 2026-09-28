import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.interview import Interview
from app.models.question import Question
from app.models.answer import Answer
from app.models.integrity_event import AssessmentIntegrityEvent
from app.models.job import Job


def compute_deterministic_assessment_score(
    db: Session,
    assessment: Interview,
    job: Optional[Job] = None,
) -> Dict[str, Any]:
    """
    Computes deterministic, reproducible scores across all configured assessment sections.
    Zero hallucinated scores.
    """
    questions = db.query(Question).filter(Question.interview_id == assessment.id).all()
    answers = db.query(Answer).filter(Answer.interview_id == assessment.id).all()
    integrity_count = db.query(AssessmentIntegrityEvent).filter(AssessmentIntegrityEvent.interview_id == assessment.id).count()

    # Answers lookup map by question_id
    ans_by_q = {a.question_id: a for a in answers}

    # Group by section / topic
    section_scores: Dict[str, Dict[str, Any]] = {}
    total_correct = 0
    total_questions = len(questions)

    coding_passed = 0
    coding_total = 0
    coding_scores = []

    for q in questions:
        section_name = q.topic or "CS Fundamentals"
        if section_name not in section_scores:
            section_scores[section_name] = {
                "total_questions": 0,
                "correct_count": 0,
                "earned_score": 0.0,
                "max_score": 0.0,
            }

        section_scores[section_name]["total_questions"] += 1
        section_scores[section_name]["max_score"] += 10.0

        ans = ans_by_q.get(q.id)
        if ans:
            if q.question_type == "coding":
                coding_total += 1
                c_score = float(ans.score if ans.score is not None else 0.0)
                coding_scores.append(c_score)
                section_scores[section_name]["earned_score"] += c_score
                if ans.test_cases_passed and ans.test_cases_total:
                    if ans.test_cases_passed == ans.test_cases_total:
                        coding_passed += 1
                        total_correct += 1
                elif c_score >= 7.0:
                    coding_passed += 1
                    total_correct += 1
            else:
                # MCQ or Text question
                if ans.is_correct is True:
                    total_correct += 1
                    section_scores[section_name]["correct_count"] += 1
                    section_scores[section_name]["earned_score"] += 10.0
                elif ans.score is not None:
                    section_scores[section_name]["earned_score"] += float(ans.score)
                    if ans.score >= 7.0:
                        total_correct += 1

    # Calculate percentage per section
    for sec_name, data in section_scores.items():
        if data["max_score"] > 0:
            data["percentage"] = round((data["earned_score"] / data["max_score"]) * 100.0, 1)
        else:
            data["percentage"] = 0.0

    # Overall raw accuracy & score
    accuracy = round((total_correct / max(1, total_questions)) * 100.0, 1)
    raw_mean_score = round(sum(d["earned_score"] for d in section_scores.values()) / max(1, total_questions), 2)
    avg_coding_score = round(sum(coding_scores) / len(coding_scores), 1) if coding_scores else None

    # Weighted Composite Score based on Job Assessment Config (if present)
    config = job.get_assessment_config() if job else {}
    configured_sections = config.get("sections", [])
    
    if configured_sections and len(configured_sections) > 1:
        weighted_sum = 0.0
        weight_accounted = 0.0
        for cs in configured_sections:
            c_name = cs.get("name", "")
            c_weight = float(cs.get("weight", 0.0))
            # Find closest matching section
            matched_sec = None
            for sn, sdata in section_scores.items():
                if c_name.lower() in sn.lower() or sn.lower() in c_name.lower():
                    matched_sec = sdata
                    break
            sec_pct = matched_sec["percentage"] if matched_sec else accuracy
            weighted_sum += (sec_pct * (c_weight / 100.0))
            weight_accounted += c_weight
        
        weighted_score = round(weighted_sum, 1) if weight_accounted > 0 else accuracy
    else:
        weighted_score = accuracy

    return {
        "assessment_id": assessment.id,
        "total_questions": total_questions,
        "total_correct": total_correct,
        "accuracy_percent": accuracy,
        "raw_score_out_of_10": raw_mean_score,
        "weighted_composite_score": weighted_score,
        "coding_score": avg_coding_score,
        "coding_problems_passed": f"{coding_passed}/{coding_total}" if coding_total > 0 else None,
        "section_scores": section_scores,
        "integrity_warning_count": integrity_count,
    }
