import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.experiment import Experiment, ExperimentParticipant
from app.services.research_dataset_service import extract_experiment_dataset, get_latest_dataset_snapshot
from app.services.statistical_analysis_service import (
    compare_groups_statistically,
    analyze_adaptive_convergence,
    calculate_item_discrimination,
    analyze_question_quality_and_rag,
    analyze_mastery_dynamics,
)


def generate_comprehensive_research_report(db: Session, experiment_id: int) -> Dict[str, Any]:
    """
    Compiles a comprehensive, rigorous scientific research report for an experiment.
    Clearly labels OBSERVED RESULT, CONFIGURATION, EXPECTED RESULT, NOT MEASURABLE, and INSUFFICIENT DATA.
    """
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise ValueError(f"Experiment #{experiment_id} not found")

    # 1. Extract Observations
    dataset_info = extract_experiment_dataset(db, experiment_id)
    observations = dataset_info["observations"]
    latest_snapshot = get_latest_dataset_snapshot(db, experiment_id)

    control_obs = [o for o in observations if o.get("experiment_group") == "control"]
    treat_obs = [o for o in observations if o.get("experiment_group") == "treatment"]

    def get_vals(obs_list: List[Dict[str, Any]], field: str) -> List[float]:
        return [float(o[field]) for o in obs_list if o.get(field) is not None]

    # 2. Comparative Primary & Secondary Metrics
    primary_metrics = {
        "final_score": compare_groups_statistically(
            get_vals(control_obs, "final_score"),
            get_vals(treat_obs, "final_score"),
            metric_name="Final Assessment Score (0-10)",
            higher_is_better=True,
        ),
        "accuracy": compare_groups_statistically(
            get_vals(control_obs, "accuracy"),
            get_vals(treat_obs, "accuracy"),
            metric_name="Accuracy (%)",
            higher_is_better=True,
        ),
        "questions_required_for_convergence": compare_groups_statistically(
            get_vals(control_obs, "convergence_questions"),
            get_vals(treat_obs, "convergence_questions"),
            metric_name="Questions Required for Convergence",
            higher_is_better=False,
        ),
        "completion_time_seconds": compare_groups_statistically(
            get_vals(control_obs, "completion_time_seconds"),
            get_vals(treat_obs, "completion_time_seconds"),
            metric_name="Completion Time (seconds)",
            higher_is_better=False,
        ),
        "mastery_improvement": compare_groups_statistically(
            get_vals(control_obs, "mastery_improvement"),
            get_vals(treat_obs, "mastery_improvement"),
            metric_name="Skill Mastery Improvement (%)",
            higher_is_better=True,
        ),
        "question_quality_score": compare_groups_statistically(
            get_vals(control_obs, "question_quality_score"),
            get_vals(treat_obs, "question_quality_score"),
            metric_name="Question Quality Score (0-10)",
            higher_is_better=True,
        ),
    }

    # 3. Domain Modules
    convergence_analysis = analyze_adaptive_convergence(observations)
    discrimination_analysis = calculate_item_discrimination(db, percentile=0.27, target_role=exp.target_role)
    mastery_analysis = analyze_mastery_dynamics(observations)
    rag_quality_analysis = analyze_question_quality_and_rag(db, target_role=exp.target_role)

    # 4. Explicit Research Limitations
    limitations = [
        {
            "category": "Sample Size",
            "description": f"Study sample size: {len(control_obs)} Control vs {len(treat_obs)} Treatment participants.",
            "status": "Sufficient for inferential statistics (N >= 5)" if (len(control_obs) >= 5 and len(treat_obs) >= 5) else "Insufficient sample size (N < 5) - results should be interpreted as preliminary.",
            "observation_type": "OBSERVED RESULT",
        },
        {
            "category": "RAG Grounding & Hallucination",
            "description": "Grounding fidelity and hallucination rates require human-verified reference benchmarks.",
            "status": "Not measurable with current dataset (Requires ground-truth annotations).",
            "observation_type": "NOT MEASURABLE",
        },
        {
            "category": "Assignment Cohort",
            "description": "Participant assignments are deterministic / alternating across assessment IDs.",
            "status": "Deterministic experimental allocation.",
            "observation_type": "CONFIGURATION",
        },
        {
            "category": "Subprocess Sandbox Environment",
            "description": "Code execution metrics reflect local isolated subprocesses with environment variable scrubbing.",
            "status": "Local subprocess sandbox limits (Containerized sandbox recommended for cloud multi-tenancy).",
            "observation_type": "CONFIGURATION",
        },
    ]

    return {
        "report_id": f"rep_{exp.id}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "experiment": {
            "id": exp.id,
            "name": exp.name,
            "description": exp.description,
            "experiment_type": exp.experiment_type,
            "status": exp.status,
            "control_strategy": exp.control_strategy,
            "treatment_strategy": exp.treatment_strategy,
            "target_role": exp.target_role,
            "sample_size_target": exp.sample_size_target,
            "created_by": exp.created_by,
            "created_at": exp.created_at.isoformat() if exp.created_at else None,
            "started_at": exp.started_at.isoformat() if exp.started_at else None,
            "completed_at": exp.completed_at.isoformat() if exp.completed_at else None,
            "observation_type": "CONFIGURATION",
        },
        "dataset_summary": {
            "total_extracted": dataset_info["total_extracted"],
            "valid_observations_count": dataset_info["valid_count"],
            "invalid_observations_count": dataset_info["invalid_count"],
            "control_sample_size": len(control_obs),
            "treatment_sample_size": len(treat_obs),
            "latest_snapshot_id": latest_snapshot.snapshot_id if latest_snapshot else None,
            "latest_snapshot_created_at": latest_snapshot.created_at.isoformat() if latest_snapshot else None,
            "observation_type": "OBSERVED RESULT",
        },
        "reproducibility": {
            "dataset_version": "v1.0-empirical",
            "scoring_version": exp.scoring_version or "v2.0-weighted-continual",
            "rag_version": exp.rag_version or "v2.0-bounded-hybrid",
            "adaptive_engine_version": exp.adaptive_engine_version or "v2.1-deterministic-rank",
            "validator_version": exp.validator_version or "v2.0-structural-ai-quality",
            "gemini_model_version": exp.gemini_model_version or "gemini-3.6-flash",
            "statistical_methodology_version": "v1.0-empirical-cohens-d",
            "observation_type": "CONFIGURATION",
        },
        "primary_metrics": primary_metrics,
        "adaptive_convergence": convergence_analysis,
        "item_discrimination": discrimination_analysis,
        "continual_mastery": mastery_analysis,
        "question_quality_and_rag": rag_quality_analysis,
        "research_limitations": limitations,
    }
