import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { applicationsAPI } from "../services/api";
import {
  User,
  Briefcase,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  FileText,
  PlayCircle,
  ShieldCheck,
  AlertCircle,
  Save,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export default function CandidateDetail() {
  const { applicationId } = useParams();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Recruiter Decision Form
  const [decision, setDecision] = useState("SELECTED");
  const [rationale, setRationale] = useState("");

  useEffect(() => {
    fetchApplicationDetails();
  }, [applicationId]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      const data = await applicationsAPI.getById(applicationId);
      setApplication(data);
      if (data.status) {
        if (data.status === "REJECTED") setDecision("REJECTED");
        else if (data.status === "SELECTED") setDecision("SELECTED");
      }
    } catch (err) {
      setError(err.message || "Failed to load candidate application dossier");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordDecision = async (e) => {
    e.preventDefault();
    try {
      setSubmittingDecision(true);
      setError(null);
      await applicationsAPI.recordDecision(applicationId, {
        status: decision,
        decision_rationale: rationale || `Recruiter final hiring evaluation recorded as ${decision}.`,
      });
      setSuccessMsg(`Hiring decision (${decision}) submitted and logged successfully!`);
      setTimeout(() => setSuccessMsg(""), 3500);
      fetchApplicationDetails();
    } catch (err) {
      setError(err.message || "Failed to record decision");
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "75vh", flexDirection: "column", gap: "16px" }}>
        <div className="spinner spinner-lg"></div>
        <p style={{ color: "var(--text-secondary)" }}>Loading candidate dossier...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container" style={{ padding: "40px 20px" }}>
        <div className="alert alert-danger">Candidate application not found.</div>
      </div>
    );
  }

  const sectionScores = application.assessment_section_scores_json
    ? JSON.parse(application.assessment_section_scores_json)
    : {};

  const skillAnalysis = application.skill_match_analysis_json
    ? JSON.parse(application.skill_match_analysis_json)
    : {};

  const matchedSkills = skillAnalysis.matched_skills || [];
  const missingSkills = skillAnalysis.missing_skills || [];

  return (
    <div style={{ padding: "32px 0 60px" }}>
      <div className="container" style={{ maxWidth: "1050px" }}>
        {/* Back Link */}
        <Link
          to={`/recruiter/pipeline?job_id=${application.job_id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--text-secondary)",
            fontSize: "13px",
            textDecoration: "none",
            marginBottom: "20px",
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to Recruitment Pipeline</span>
        </Link>

        {/* Top Header Card */}
        <div className="card" style={{ padding: "28px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                C{application.candidate_id}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
                    Candidate #{application.candidate_id}
                  </h1>
                  <span
                    className={`badge ${
                      application.status === "SELECTED"
                        ? "badge-success"
                        : application.status === "REJECTED"
                        ? "badge-danger"
                        : "badge-primary"
                    }`}
                  >
                    {application.status}
                  </span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
                  Application ID: #{application.id} • Job Posting #{application.job_id} • Applied{" "}
                  {new Date(application.applied_at || application.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Quick Score Badges */}
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ textAlign: "center", backgroundColor: "rgba(15, 23, 42, 0.6)", padding: "10px 16px", borderRadius: "8px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Resume Match</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#10b981" }}>
                  {application.resume_match_score !== null ? `${application.resume_match_score}%` : "N/A"}
                </div>
              </div>
              <div style={{ textAlign: "center", backgroundColor: "rgba(15, 23, 42, 0.6)", padding: "10px 16px", borderRadius: "8px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Composite Score</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#06b6d4" }}>
                  {application.assessment_composite_score !== null ? `${application.assessment_composite_score}%` : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success" style={{ marginBottom: "20px" }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 2 Column Layout: Skills/Resume Match & Assessment Breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: "24px", marginBottom: "24px" }}>
          {/* Resume & Eligibility Screening */}
          <div className="card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <FileText size={18} color="#6366f1" />
              <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: "#f8fafc" }}>
                Resume & Skill Match Analysis
              </h3>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Matched Required Skills:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {matchedSkills.length > 0 ? (
                  matchedSkills.map((s, idx) => (
                    <span key={idx} className="badge badge-success" style={{ fontSize: "12px" }}>
                      ✓ {s}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>None detected</span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Missing / Skill Gaps:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {missingSkills.length > 0 ? (
                  missingSkills.map((s, idx) => (
                    <span key={idx} className="badge badge-neutral" style={{ fontSize: "12px", color: "#ef4444" }}>
                      ✕ {s}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>None (Complete Match)</span>
                )}
              </div>
            </div>

            <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", backgroundColor: "rgba(15, 23, 42, 0.4)", padding: "12px", borderRadius: "6px" }}>
              {skillAnalysis.summary || "Candidate eligibility screened deterministically against required skills and experience."}
            </div>
          </div>

          {/* Multi-Section Assessment Breakdown */}
          <div className="card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Award size={18} color="#06b6d4" />
              <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: "#f8fafc" }}>
                Multi-Section Assessment Breakdown
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {Object.keys(sectionScores).length > 0 ? (
                Object.entries(sectionScores).map(([section, data]) => {
                  const score = typeof data === "number" ? data : data.score ?? 0;
                  const weight = typeof data === "object" ? data.weight ?? 0 : 0;
                  return (
                    <div
                      key={section}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        backgroundColor: "rgba(15, 23, 42, 0.5)",
                        borderRadius: "6px",
                      }}
                    >
                      <span style={{ fontSize: "13px", textTransform: "capitalize", color: "#f8fafc" }}>
                        {section.replace("_", " ")} {weight ? `(${weight}% wt)` : ""}
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444",
                        }}
                      >
                        {score}%
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "13px" }}>
                  Candidate has not completed assessment yet.
                </div>
              )}
            </div>

            {application.technical_interview_id && (
              <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}>
                <Link
                  to={`/interview/${application.technical_interview_id}/replay`}
                  className="btn btn-sm btn-outline"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <PlayCircle size={15} color="#818cf8" />
                  <span>Launch Technical Interview Replay</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recruiter Decision Panel */}
        <div className="card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <ShieldCheck size={20} color="#10b981" />
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
              Recruiter Final Hiring Decision & Sign-off
            </h3>
          </div>

          <form onSubmit={handleRecordDecision} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setDecision("SELECTED")}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: decision === "SELECTED" ? "2px solid #10b981" : "1px solid var(--border-card)",
                  backgroundColor: decision === "SELECTED" ? "rgba(16, 185, 129, 0.15)" : "var(--bg-surface)",
                  color: decision === "SELECTED" ? "#10b981" : "var(--text-secondary)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ✓ HIRE / SELECTED
              </button>

              <button
                type="button"
                onClick={() => setDecision("SHORTLISTED")}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: decision === "SHORTLISTED" ? "2px solid #f59e0b" : "1px solid var(--border-card)",
                  backgroundColor: decision === "SHORTLISTED" ? "rgba(245, 158, 11, 0.15)" : "var(--bg-surface)",
                  color: decision === "SHORTLISTED" ? "#f59e0b" : "var(--text-secondary)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ⚑ KEEP ON HOLD / REVIEW
              </button>

              <button
                type="button"
                onClick={() => setDecision("REJECTED")}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: decision === "REJECTED" ? "2px solid #ef4444" : "1px solid var(--border-card)",
                  backgroundColor: decision === "REJECTED" ? "rgba(239, 68, 68, 0.15)" : "var(--bg-surface)",
                  color: decision === "REJECTED" ? "#ef4444" : "var(--text-secondary)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ✕ REJECT APPLICATION
              </button>
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>
                Decision Rationale & Auditor Notes
              </label>
              <textarea
                rows={3}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Explain the justification for this hiring decision (e.g. Strong coding and system design mastery, passed cutoff thresholds)..."
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  backgroundColor: "#080c14",
                  border: "1px solid var(--border-card)",
                  color: "#ffffff",
                  fontSize: "13px",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={submittingDecision}
                className="btn btn-primary"
                style={{ minWidth: "160px" }}
              >
                <Save size={15} />
                <span>{submittingDecision ? "Recording..." : "Record Final Decision"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
