from typing import Dict, Any, List, Optional
from app.models.job import Job
from app.models.application import CandidateApplication


def evaluate_shortlisting_criteria(
    job: Job,
    application: CandidateApplication,
    scores: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Evaluates deterministic shortlisting rules against candidate assessment scores and job cutoffs.
    Zero blackbox AI overrides.
    """
    config = job.get_assessment_config()
    overall_cutoff = float(config.get("overall_cutoff", job.min_qualifying_score * 10 if job.min_qualifying_score else 60.0))
    
    reasons = []
    is_shortlisted = True
    section_evaluations = {}

    # 1. Eligibility Check
    if application.is_eligible is False:
        is_shortlisted = False
        reasons.append("Candidate did not meet preliminary eligibility criteria.")

    # 2. Overall Weighted Score Cutoff
    composite_score = float(scores.get("weighted_composite_score", scores.get("accuracy_percent", 0.0)))
    if composite_score < overall_cutoff:
        is_shortlisted = False
        reasons.append(f"Overall composite score {composite_score}% is below required cutoff of {overall_cutoff}%.")
    else:
        reasons.append(f"Passed overall composite cutoff: {composite_score}% >= {overall_cutoff}%.")

    # 3. Section Cutoffs
    configured_sections = config.get("sections", [])
    section_scores = scores.get("section_scores", {})

    for cs in configured_sections:
        s_name = cs.get("name", "")
        min_sec_score = float(cs.get("min_score", 40.0))
        
        # Match section score
        sec_data = None
        for sn, sd in section_scores.items():
            if s_name.lower() in sn.lower() or sn.lower() in s_name.lower():
                sec_data = sd
                break
        
        earned_pct = sec_data.get("percentage", 0.0) if sec_data else composite_score
        passed = (earned_pct >= min_sec_score)
        section_evaluations[s_name] = {
            "score": earned_pct,
            "cutoff": min_sec_score,
            "passed": passed,
        }

        if not passed:
            is_shortlisted = False
            reasons.append(f"Section '{s_name}' score {earned_pct}% is below section cutoff of {min_sec_score}%.")

    # 4. Coding Cutoff (if coding required)
    if job.coding_required:
        coding_score = scores.get("coding_score")
        if coding_score is not None:
            coding_pct = coding_score * 10.0
            coding_min = float(config.get("coding_cutoff", 50.0))
            if coding_pct < coding_min:
                is_shortlisted = False
                reasons.append(f"Coding score {coding_pct}% is below coding cutoff of {coding_min}%.")
            else:
                reasons.append(f"Passed coding requirement: {coding_pct}% >= {coding_min}%.")

    status = "SHORTLISTED" if is_shortlisted else "NOT_SHORTLISTED"

    return {
        "is_shortlisted": is_shortlisted,
        "status": status,
        "composite_score": composite_score,
        "overall_cutoff": overall_cutoff,
        "section_evaluations": section_evaluations,
        "reasons": reasons,
    }
