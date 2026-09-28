import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import Response, JSONResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.interview import Interview
from app.models.experiment import Experiment, ExperimentParticipant, ExperimentAuditLog
from app.api.v1.endpoints.admin import require_admin
from app.services.experiment_service import (
    assign_participant_to_experiment,
    get_experiment_aggregated_results,
    generate_anonymized_csv,
    generate_anonymized_json,
)

router = APIRouter()


# ============================================================
# 1. EXPERIMENT CRUD & LIFECYCLE
# ============================================================

@router.post("/experiments", status_code=status.HTTP_201_CREATED)
def create_experiment(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    name = payload.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Experiment name is required.")

    exp_type = payload.get("experiment_type", "adaptive_vs_static")
    control_strat = payload.get("control_strategy", "Static / Fixed Difficulty Assessment")
    treat_strat = payload.get("treatment_strategy", "Adaptive Assessment Engine")
    target_role = payload.get("target_role", "All")
    target_topic = payload.get("target_topic", "All")
    sample_target = int(payload.get("sample_size_target", 50))

    experiment = Experiment(
        name=name,
        description=payload.get("description", ""),
        experiment_type=exp_type,
        control_strategy=control_strat,
        treatment_strategy=treat_strat,
        target_role=target_role,
        target_topic=target_topic,
        status="draft",
        sample_size_target=sample_target,
        created_by=admin_user.email,
        configuration_json=json.dumps(payload.get("configuration", {})),
    )
    db.add(experiment)
    db.commit()
    db.refresh(experiment)

    # Record Audit
    audit = ExperimentAuditLog(
        experiment_id=experiment.id,
        action="created",
        details_json=json.dumps({"name": name, "type": exp_type}),
    )
    db.add(audit)
    db.commit()

    return {
        "id": experiment.id,
        "name": experiment.name,
        "description": experiment.description,
        "experiment_type": experiment.experiment_type,
        "status": experiment.status,
        "control_strategy": experiment.control_strategy,
        "treatment_strategy": experiment.treatment_strategy,
        "target_role": experiment.target_role,
        "target_topic": experiment.target_topic,
        "sample_size_target": experiment.sample_size_target,
        "current_participants": 0,
        "created_by": experiment.created_by,
        "created_at": experiment.created_at,
        "started_at": experiment.started_at,
        "completed_at": experiment.completed_at,
        "reproducibility": {
            "adaptive_engine_version": experiment.adaptive_engine_version,
            "rag_version": experiment.rag_version,
            "validator_version": experiment.validator_version,
            "scoring_version": experiment.scoring_version,
            "gemini_model_version": experiment.gemini_model_version,
        },
    }


@router.get("/experiments", status_code=status.HTTP_200_OK)
def list_experiments(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    query = db.query(Experiment)
    if status_filter:
        query = query.filter(Experiment.status == status_filter)
    experiments = query.order_by(Experiment.created_at.desc()).all()

    out = []
    for exp in experiments:
        participants_count = db.query(ExperimentParticipant).filter(ExperimentParticipant.experiment_id == exp.id).count()
        out.append({
            "id": exp.id,
            "name": exp.name,
            "description": exp.description,
            "experiment_type": exp.experiment_type,
            "status": exp.status,
            "control_strategy": exp.control_strategy,
            "treatment_strategy": exp.treatment_strategy,
            "target_role": exp.target_role,
            "target_topic": exp.target_topic,
            "sample_size_target": exp.sample_size_target,
            "current_participants": participants_count,
            "created_by": exp.created_by,
            "created_at": exp.created_at,
            "started_at": exp.started_at,
            "completed_at": exp.completed_at,
        })
    return out


@router.get("/experiments/{experiment_id}", status_code=status.HTTP_200_OK)
def get_experiment_details(
    experiment_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    participants_count = db.query(ExperimentParticipant).filter(ExperimentParticipant.experiment_id == exp.id).count()
    return {
        "id": exp.id,
        "name": exp.name,
        "description": exp.description,
        "experiment_type": exp.experiment_type,
        "status": exp.status,
        "control_strategy": exp.control_strategy,
        "treatment_strategy": exp.treatment_strategy,
        "target_role": exp.target_role,
        "target_topic": exp.target_topic,
        "sample_size_target": exp.sample_size_target,
        "current_participants": participants_count,
        "created_by": exp.created_by,
        "created_at": exp.created_at,
        "started_at": exp.started_at,
        "completed_at": exp.completed_at,
        "reproducibility": {
            "adaptive_engine_version": exp.adaptive_engine_version,
            "rag_version": exp.rag_version,
            "validator_version": exp.validator_version,
            "scoring_version": exp.scoring_version,
            "gemini_model_version": exp.gemini_model_version,
        },
    }


@router.post("/experiments/{experiment_id}/start", status_code=status.HTTP_200_OK)
def start_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    exp.status = "active"
    exp.started_at = datetime.now(timezone.utc)
    db.commit()

    # Record Audit
    audit = ExperimentAuditLog(
        experiment_id=exp.id,
        action="started",
        details_json=json.dumps({"started_by": admin_user.email}),
    )
    db.add(audit)
    db.commit()

    return {"message": f"Experiment '{exp.name}' is now ACTIVE.", "status": exp.status}


@router.post("/experiments/{experiment_id}/stop", status_code=status.HTTP_200_OK)
def stop_experiment(
    experiment_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    exp.status = "completed"
    exp.completed_at = datetime.now(timezone.utc)
    db.commit()

    # Record Audit
    audit = ExperimentAuditLog(
        experiment_id=exp.id,
        action="stopped",
        details_json=json.dumps({"stopped_by": admin_user.email}),
    )
    db.add(audit)
    db.commit()

    return {"message": f"Experiment '{exp.name}' is now COMPLETED.", "status": exp.status}


# ============================================================
# 2. ASSIGNMENT & PARTICIPANTS (Zero PII)
# ============================================================

@router.post("/experiments/{experiment_id}/assign", status_code=status.HTTP_200_OK)
def assign_assessment(
    experiment_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    assessment_id = payload.get("assessment_id")
    if not assessment_id:
        raise HTTPException(status_code=400, detail="assessment_id is required.")

    assessment = db.query(Interview).filter(Interview.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    force_group = payload.get("group")
    participant = assign_participant_to_experiment(
        db=db,
        experiment=exp,
        assessment=assessment,
        user_id=assessment.user_id,
        force_group=force_group,
    )

    return {
        "message": "Assessment assigned to experiment group",
        "participant_id": participant.anonymized_id,
        "group": participant.group,
        "assigned_at": participant.assignment_timestamp,
    }


@router.get("/experiments/{experiment_id}/participants", status_code=status.HTTP_200_OK)
def list_participants(
    experiment_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    participants = db.query(ExperimentParticipant).filter(
        ExperimentParticipant.experiment_id == experiment_id
    ).order_by(ExperimentParticipant.assignment_timestamp.desc()).all()

    # Guaranteed Zero PII (no names, no emails, no passwords, no raw text)
    return [
        {
            "participant_id": p.anonymized_id,
            "group": p.group,
            "final_score": p.final_score,
            "accuracy": p.accuracy,
            "completion_time_seconds": p.completion_time_seconds,
            "questions_attempted": p.questions_attempted,
            "questions_required_for_convergence": p.questions_required_for_convergence,
            "topic_coverage": p.topic_coverage,
            "average_difficulty": p.average_question_difficulty,
            "mastery_before": p.mastery_before,
            "mastery_after": p.mastery_after,
            "mastery_improvement": p.mastery_improvement,
            "question_quality_score": p.question_quality_score,
            "integrity_warning_count": p.integrity_warning_count,
            "assigned_at": p.assignment_timestamp,
        }
        for p in participants
    ]


# ============================================================
# 3. RESULTS & STATISTICAL COMPARISONS
# ============================================================

@router.get("/experiments/{experiment_id}/results", status_code=status.HTTP_200_OK)
def get_experiment_results(
    experiment_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    results = get_experiment_aggregated_results(db, exp)

    # Record Audit
    audit = ExperimentAuditLog(
        experiment_id=exp.id,
        action="results_generated",
        details_json=json.dumps({"total_participants": results["total_participants"]}),
    )
    db.add(audit)
    db.commit()

    return results


# ============================================================
# 4. DATASET & IMMUTABLE SNAPSHOTS
# ============================================================

from app.services.research_dataset_service import (
    extract_experiment_dataset,
    create_dataset_snapshot,
    get_latest_dataset_snapshot,
    list_dataset_snapshots,
)
from app.services.statistical_analysis_service import (
    compare_groups_statistically,
    analyze_adaptive_convergence,
    calculate_item_discrimination,
    analyze_question_quality_and_rag,
    analyze_mastery_dynamics,
)
from app.services.research_report_service import generate_comprehensive_research_report


@router.post("/experiments/{experiment_id}/snapshot", status_code=status.HTTP_201_CREATED)
def trigger_dataset_snapshot(
    experiment_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Creates an immutable research dataset snapshot for reproducible analysis."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    snapshot = create_dataset_snapshot(db, experiment_id, created_by=admin_user.email)
    return {
        "snapshot_id": snapshot.snapshot_id,
        "experiment_id": snapshot.experiment_id,
        "created_at": snapshot.created_at,
        "observation_count": snapshot.observation_count,
        "valid_count": snapshot.valid_count,
        "invalid_count": snapshot.invalid_count,
        "dataset_version": snapshot.dataset_version,
        "reproducibility": {
            "scoring_version": snapshot.scoring_version,
            "rag_version": snapshot.rag_version,
            "adaptive_engine_version": snapshot.adaptive_engine_version,
            "validator_version": snapshot.validator_version,
            "gemini_model_version": snapshot.gemini_model_version,
            "statistical_methodology_version": snapshot.statistical_methodology_version,
        },
    }


@router.get("/experiments/{experiment_id}/dataset", status_code=status.HTTP_200_OK)
def get_experiment_dataset(
    experiment_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Extracts research-safe observations and validation breakdown from database."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    return extract_experiment_dataset(db, experiment_id)


@router.get("/experiments/{experiment_id}/statistics", status_code=status.HTTP_200_OK)
def get_experiment_statistics(
    experiment_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Calculates statistical metrics, Cohen's d effect sizes, and 95% CIs."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    dataset_info = extract_experiment_dataset(db, experiment_id)
    obs = dataset_info["observations"]
    control_obs = [o for o in obs if o.get("experiment_group") == "control"]
    treat_obs = [o for o in obs if o.get("experiment_group") == "treatment"]

    def get_vals(obs_list, key):
        return [float(o[key]) for o in obs_list if o.get(key) is not None]

    stats_map = {
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
        "convergence_questions": compare_groups_statistically(
            get_vals(control_obs, "convergence_questions"),
            get_vals(treat_obs, "convergence_questions"),
            metric_name="Questions for Convergence",
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
            metric_name="Mastery Improvement (%)",
            higher_is_better=True,
        ),
        "question_quality_score": compare_groups_statistically(
            get_vals(control_obs, "question_quality_score"),
            get_vals(treat_obs, "question_quality_score"),
            metric_name="Question Quality (0-10)",
            higher_is_better=True,
        ),
    }

    return {
        "experiment_id": exp.id,
        "control_n": len(control_obs),
        "treatment_n": len(treat_obs),
        "total_valid_observations": len(obs),
        "metrics": stats_map,
    }


@router.get("/experiments/{experiment_id}/convergence", status_code=status.HTTP_200_OK)
def get_experiment_convergence(
    experiment_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Returns adaptive convergence analysis distinguishing observed vs configured convergence."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    dataset_info = extract_experiment_dataset(db, experiment_id)
    return analyze_adaptive_convergence(dataset_info["observations"])


@router.get("/experiments/{experiment_id}/question-quality", status_code=status.HTTP_200_OK)
def get_experiment_question_quality(
    experiment_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Evaluates question bank quality, difficulty calibration, and RAG grounding status."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    return analyze_question_quality_and_rag(db, target_role=exp.target_role)


@router.get("/experiments/{experiment_id}/discrimination", status_code=status.HTTP_200_OK)
def get_experiment_discrimination(
    experiment_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Calculates item discrimination D = P_upper - P_lower using top/bottom 27% cohorts."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    return calculate_item_discrimination(db, percentile=0.27, target_role=exp.target_role)


@router.get("/experiments/{experiment_id}/mastery", status_code=status.HTTP_200_OK)
def get_experiment_mastery(
    experiment_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Analyzes continual mastery baseline, post-assessment scores, and group improvement."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    dataset_info = extract_experiment_dataset(db, experiment_id)
    return analyze_mastery_dynamics(dataset_info["observations"])


@router.get("/experiments/{experiment_id}/report", status_code=status.HTTP_200_OK)
def get_experiment_comprehensive_report(
    experiment_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Generates complete structured scientific experiment report with explicit limitations."""
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    return generate_comprehensive_research_report(db, experiment_id)


# ============================================================
# 5. EXPORT (CSV / JSON)
# ============================================================

@router.get("/experiments/{experiment_id}/export/csv", status_code=status.HTTP_200_OK)
def export_experiment_csv(
    experiment_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    csv_data = generate_anonymized_csv(db, exp)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="experiment_{experiment_id}_anonymized.csv"'
        },
    )


@router.get("/experiments/{experiment_id}/export/json", status_code=status.HTTP_200_OK)
def export_experiment_json(
    experiment_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    json_data = generate_anonymized_json(db, exp)
    return JSONResponse(
        content=json_data,
        headers={
            "Content-Disposition": f'attachment; filename="experiment_{experiment_id}_anonymized.json"'
        },
    )
