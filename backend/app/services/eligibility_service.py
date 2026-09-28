import json
from typing import Dict, Any, List, Optional
from app.models.job import Job
from app.models.resume import Resume
from app.models.user import User


def evaluate_candidate_eligibility(job: Job, resume: Optional[Resume], user: User) -> Dict[str, Any]:
    """
    Evaluates candidate eligibility deterministically from actual job requirements and resume profile.
    Never fabricates skills or experience not present in the record.
    """
    required_skills = [s.strip().lower() for s in job.get_required_skills() if s.strip()]
    preferred_skills = [s.strip().lower() for s in job.get_preferred_skills() if s.strip()]
    
    candidate_skills = []
    experience_years = 0.0

    if resume:
        raw_skills = getattr(resume, "skills_json", None) or getattr(resume, "parsed_skills_json", None)
        if raw_skills:
            try:
                candidate_skills = [s.strip().lower() for s in json.loads(raw_skills)]
            except Exception:
                candidate_skills = []
        if getattr(resume, "experience_years", None) is not None:
            experience_years = float(resume.experience_years)
        elif getattr(resume, "experience_json", None):
            try:
                exp_list = json.loads(resume.experience_json)
                if isinstance(exp_list, list):
                    total_exp = 0.0
                    for item in exp_list:
                        if isinstance(item, dict) and "years" in item:
                            total_exp += float(item["years"])
                        else:
                            total_exp += 1.5
                    experience_years = total_exp
            except Exception:
                pass

    # 1. Evaluate Required Skills
    matched_req_skills = []
    missing_req_skills = []

    for req in required_skills:
        # Check direct or substring match (e.g. "python" in "python 3" or "fastapi" in "fastapi framework")
        if any(req in cs or cs in req for cs in candidate_skills):
            matched_req_skills.append(req)
        else:
            missing_req_skills.append(req)

    # 2. Evaluate Preferred Skills
    matched_pref_skills = []
    for pref in preferred_skills:
        if any(pref in cs or cs in pref for cs in candidate_skills):
            matched_pref_skills.append(pref)

    # 3. Evaluate Experience
    min_exp = float(job.min_experience_years or 0.0)
    exp_matched = (experience_years >= min_exp)

    # 4. Calculate Skill Match Percentage
    total_eval_skills = len(required_skills) + (0.5 * len(preferred_skills))
    matched_weight = len(matched_req_skills) + (0.5 * len(matched_pref_skills))
    
    if total_eval_skills > 0:
        match_score = round((matched_weight / total_eval_skills) * 100.0, 1)
    else:
        match_score = 100.0 if candidate_skills else 50.0

    # 5. Deterministic Hard Eligibility Rule
    # Candidate is eligible if they have >= 50% of required skills AND meet experience threshold
    reasons = []
    is_eligible = True
    insufficient_info = False

    if not resume or not candidate_skills:
        insufficient_info = True
        is_eligible = False
        reasons.append("Insufficient information: No parsed resume skills available.")

    if missing_req_skills:
        if len(matched_req_skills) < len(required_skills) * 0.5:
            is_eligible = False
            reasons.append(f"Missing core required skills: {', '.join(missing_req_skills)}")

    if not exp_matched and min_exp > 0:
        is_eligible = False
        reasons.append(f"Experience below required threshold: {experience_years} years (Job requires minimum {min_exp} years)")

    if is_eligible and not reasons:
        reasons.append(f"Candidate meets all required criteria with {len(matched_req_skills)}/{len(required_skills)} required skills matched and {experience_years} years experience.")

    return {
        "is_eligible": is_eligible,
        "match_score": match_score,
        "matched_required_skills": matched_req_skills,
        "missing_required_skills": missing_req_skills,
        "matched_preferred_skills": matched_pref_skills,
        "candidate_experience_years": experience_years,
        "required_min_experience_years": min_exp,
        "experience_matched": exp_matched,
        "insufficient_information": insufficient_info,
        "reasons": reasons,
    }
