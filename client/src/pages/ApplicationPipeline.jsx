import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { jobsAPI, applicationsAPI } from "../services/api";
import {
  Users,
  Briefcase,
  Filter,
  CheckCircle2,
  XCircle,
  Mail,
  Award,
  ChevronRight,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

export default function ApplicationPipeline() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedJobId = searchParams.get("job_id") || "";

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [error, setError] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const stages = [
    { key: "ALL", label: "All Applicants" },
    { key: "APPLIED", label: "Applied" },
    { key: "ELIGIBLE", label: "Eligible" },
    { key: "ASSESSMENT_INVITED", label: "Invited" },
    { key: "ASSESSMENT_COMPLETED", label: "Assessed" },
    { key: "SHORTLISTED", label: "Shortlisted" },
    { key: "INTERVIEW_COMPLETED", label: "Interviewed" },
    { key: "SELECTED", label: "Selected / Hired" },
    { key: "REJECTED", label: "Rejected" },
  ];

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [selectedJobId, selectedStage]);

  const fetchJobs = async () => {
    try {
      const data = await jobsAPI.list();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      let data = [];
      if (selectedJobId) {
        data = await jobsAPI.getApplications(selectedJobId);
      } else {
        // Fallback: list apps of all jobs
        const allJobs = await jobsAPI.list().catch(() => []);
        const appPromises = allJobs.map((j) => jobsAPI.getApplications(j.id).catch(() => []));
        const results = await Promise.all(appPromises);
        data = results.flat();
      }

      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleScreenEligibility = async (appId) => {
    try {
      setActionLoading((p) => ({ ...p, [appId]: "screening" }));
      setError(null);
      const res = await applicationsAPI.screenEligibility(appId);
      setFeedbackMsg(`Application #${appId} screened: ${res.eligible ? "ELIGIBLE" : "NOT ELIGIBLE"} (${res.match_score}% match).`);
      setTimeout(() => setFeedbackMsg(""), 3500);
      fetchApplications();
    } catch (err) {
      setError(err.message || "Eligibility screening failed");
    } finally {
      setActionLoading((p) => ({ ...p, [appId]: null }));
    }
  };

  const handleSendInvitation = async (appId) => {
    try {
      setActionLoading((p) => ({ ...p, [appId]: "inviting" }));
      setError(null);
      const res = await applicationsAPI.invite(appId, { expiry_days: 7 });
      setFeedbackMsg(`Assessment invitation issued for Application #${appId}. Secure Token: ${res.invitation_token.slice(0, 8)}...`);
      setTimeout(() => setFeedbackMsg(""), 4000);
      fetchApplications();
    } catch (err) {
      setError(err.message || "Invitation issuance failed");
    } finally {
      setActionLoading((p) => ({ ...p, [appId]: null }));
    }
  };

  const handleScoreAndShortlist = async (appId) => {
    try {
      setActionLoading((p) => ({ ...p, [appId]: "scoring" }));
      setError(null);
      const res = await applicationsAPI.scoreAndShortlist(appId);
      setFeedbackMsg(`Application #${appId} evaluated. Score: ${res.composite_score}%. Shortlist Status: ${res.shortlisted ? "SHORTLISTED" : "REJECTED"}.`);
      setTimeout(() => setFeedbackMsg(""), 4000);
      fetchApplications();
    } catch (err) {
      setError(err.message || "Shortlisting evaluation failed");
    } finally {
      setActionLoading((p) => ({ ...p, [appId]: null }));
    }
  };

  const filteredApps = selectedStage === "ALL"
    ? applications
    : applications.filter((a) => a.status === selectedStage);

  return (
    <div style={{ padding: "32px 0 60px" }}>
      <div className="container">
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="badge badge-primary">Pipeline Management</span>
              <span className="badge badge-neutral">Stage Transitions</span>
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
              Hiring Pipeline & Candidate Workflow
            </h1>
          </div>

          {/* Job Filter Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Job Role:</span>
            <select
              value={selectedJobId}
              onChange={(e) => setSearchParams(e.target.value ? { job_id: e.target.value } : {})}
              style={{
                padding: "8px 14px",
                borderRadius: "6px",
                backgroundColor: "#080c14",
                border: "1px solid var(--border-card)",
                color: "#ffffff",
                fontSize: "13px",
              }}
            >
              <option value="">All Job Roles</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {feedbackMsg && (
          <div className="alert alert-success" style={{ marginBottom: "20px" }}>
            <CheckCircle2 size={16} />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Stage Filter Tabs */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "24px",
            overflowX: "auto",
            paddingBottom: "4px",
          }}
        >
          {stages.map((st) => {
            const isSelected = selectedStage === st.key;
            return (
              <button
                key={st.key}
                onClick={() => setSelectedStage(st.key)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: isSelected ? "1px solid #6366f1" : "1px solid var(--border-card)",
                  backgroundColor: isSelected ? "rgba(99, 102, 241, 0.15)" : "var(--bg-surface)",
                  color: isSelected ? "#ffffff" : "var(--text-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex-center" style={{ minHeight: "35vh" }}>
            <div className="spinner spinner-lg"></div>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
            <Users size={36} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "17px", color: "#f8fafc", marginBottom: "6px" }}>
              No candidates in this stage
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
              Candidates will appear here as they apply and advance through eligibility screening and assessments.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredApps.map((app) => {
              const currentAction = actionLoading[app.id];
              return (
                <div
                  key={app.id}
                  className="card"
                  style={{
                    padding: "18px 22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "16px",
                  }}
                >
                  {/* Candidate / Job Summary */}
                  <div style={{ minWidth: "260px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: "#f8fafc" }}>
                        Application #{app.id} — Candidate #{app.candidate_id}
                      </span>
                      <span
                        className={`badge ${
                          app.status === "SELECTED"
                            ? "badge-success"
                            : app.status === "REJECTED"
                            ? "badge-danger"
                            : app.status === "SHORTLISTED"
                            ? "badge-warning"
                            : "badge-primary"
                        }`}
                        style={{ fontSize: "11px" }}
                      >
                        {app.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                      Job #{app.job_id} • Applied {new Date(app.applied_at || app.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Quantitative Scores */}
                  <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Resume Match
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 700,
                          color: app.resume_match_score >= 70 ? "#10b981" : "#f59e0b",
                        }}
                      >
                        {app.resume_match_score !== null ? `${app.resume_match_score}%` : "—"}
                      </div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Assessment Score
                      </div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 700,
                          color: app.assessment_composite_score >= 70 ? "#10b981" : "#06b6d4",
                        }}
                      >
                        {app.assessment_composite_score !== null ? `${app.assessment_composite_score}%` : "—"}
                      </div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Interview Score
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "#818cf8" }}>
                        {app.interview_score !== null ? `${app.interview_score}%` : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {app.status === "APPLIED" && (
                      <button
                        onClick={() => handleScreenEligibility(app.id)}
                        disabled={!!currentAction}
                        className="btn btn-sm btn-primary"
                      >
                        <Sparkles size={14} />
                        <span>Screen Eligibility</span>
                      </button>
                    )}

                    {app.status === "ELIGIBLE" && (
                      <button
                        onClick={() => handleSendInvitation(app.id)}
                        disabled={!!currentAction}
                        className="btn btn-sm btn-primary"
                        style={{ background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)" }}
                      >
                        <Mail size={14} />
                        <span>Invite Assessment</span>
                      </button>
                    )}

                    {app.status === "ASSESSMENT_COMPLETED" && (
                      <button
                        onClick={() => handleScoreAndShortlist(app.id)}
                        disabled={!!currentAction}
                        className="btn btn-sm btn-primary"
                        style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
                      >
                        <Award size={14} />
                        <span>Score & Shortlist</span>
                      </button>
                    )}

                    <Link to={`/recruiter/candidate/${app.id}`} className="btn btn-sm btn-outline">
                      <span>View Dossier</span>
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
