import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { jobsAPI, recruiterAPI } from "../services/api";
import {
  BarChart2,
  Users,
  Briefcase,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Award,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Calculator,
} from "lucide-react";

export default function CandidateComparison() {
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get("job_id") || "";

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [applications, setApplications] = useState([]);
  const [selectedAppIds, setSelectedAppIds] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState(null);

  // Custom weights for calibration
  const [weights, setWeights] = useState({
    aptitude: 15,
    cs_fundamentals: 15,
    dsa: 20,
    dbms: 10,
    coding: 25,
    interview: 15,
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      fetchJobApplications(selectedJobId);
    } else {
      setApplications([]);
      setSelectedAppIds([]);
      setComparisonResult(null);
    }
  }, [selectedJobId]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await jobsAPI.list();
      setJobs(Array.isArray(data) ? data : []);
      if (!selectedJobId && data.length > 0) {
        setSelectedJobId(String(data[0].id));
      }
    } catch (err) {
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchJobApplications = async (jobId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await jobsAPI.getApplications(jobId);
      const apps = Array.isArray(data) ? data : [];
      setApplications(apps);

      // Pre-select completed / assessed candidates
      const assessedIds = apps.map((a) => a.id);
      setSelectedAppIds(assessedIds);

      // Auto compare if we have at least 1 candidate
      if (assessedIds.length > 0) {
        runComparison(jobId, assessedIds, weights);
      } else {
        setComparisonResult(null);
      }
    } catch (err) {
      setError(err.message || "Failed to load candidates for selected job");
    } finally {
      setLoading(false);
    }
  };

  const totalWeight =
    Number(weights.aptitude || 0) +
    Number(weights.cs_fundamentals || 0) +
    Number(weights.dsa || 0) +
    Number(weights.dbms || 0) +
    Number(weights.coding || 0) +
    Number(weights.interview || 0);

  const handleWeightChange = (field, val) => {
    const updated = { ...weights, [field]: Number(val) };
    setWeights(updated);
  };

  const handleToggleCandidate = (id) => {
    setSelectedAppIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const runComparison = async (jobId = selectedJobId, appIds = selectedAppIds, customWeights = weights) => {
    if (!jobId) {
      setError("Please select a target job role.");
      return;
    }
    if (appIds.length === 0) {
      setError("Please select at least one candidate application to compare.");
      return;
    }
    if (totalWeight !== 100) {
      setError(`Section weights must sum to exactly 100% (currently ${totalWeight}%).`);
      return;
    }

    try {
      setComparing(true);
      setError(null);
      const result = await recruiterAPI.compareCandidates({
        job_id: Number(jobId),
        application_ids: appIds.map(Number),
        custom_weights: customWeights,
      });
      setComparisonResult(result);
    } catch (err) {
      setError(err.message || "Candidate comparison failed");
    } finally {
      setComparing(false);
    }
  };

  const rankings = comparisonResult?.rankings || [];

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "75vh", flexDirection: "column", gap: "16px" }}>
        <div className="spinner spinner-lg"></div>
        <p style={{ color: "var(--text-secondary)" }}>Loading candidate pipeline data...</p>
      </div>
    );
  }

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
            marginBottom: "28px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="badge badge-primary">Same-Job Cohort Evaluation</span>
              <span className="badge badge-success">Explainable Ranking Engine</span>
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
              Multi-Candidate Comparison Matrix
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
              Transparent mathematical ranking across multi-section assessments with zero black-box scoring.
            </p>
          </div>

          {/* Target Job Role Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 600 }}>
              Comparing for Job:
            </span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                backgroundColor: "#080c14",
                border: "1px solid var(--border-card)",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department || "Engineering"})
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

        {/* Dynamic Weight Configuration Bar */}
        <div className="card" style={{ padding: "20px", marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calculator size={18} color="#6366f1" />
              <h3 style={{ fontSize: "15px", fontWeight: 600, margin: 0, color: "#f8fafc" }}>
                Scoring Formula & Section Weight Calibration
              </h3>
            </div>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: totalWeight === 100 ? "#10b981" : "#ef4444",
              }}
            >
              Weight Total: {totalWeight}% / 100%
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
            {["aptitude", "cs_fundamentals", "dsa", "dbms", "coding", "interview"].map((sec) => (
              <div key={sec} style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", padding: "10px", borderRadius: "6px" }}>
                <label style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  {sec.replace("_", " ")} (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weights[sec]}
                  onChange={(e) => handleWeightChange(sec, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px",
                    backgroundColor: "#080c14",
                    border: "1px solid var(--border-card)",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "14px" }}>
            <button
              onClick={() => runComparison()}
              disabled={comparing || totalWeight !== 100}
              className="btn btn-sm btn-primary"
            >
              <Sliders size={14} />
              <span>{comparing ? "Recalculating..." : "Recalculate Rankings"}</span>
            </button>
          </div>
        </div>

        {/* Candidate Selector Checkboxes */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: 600 }}>
            Select Candidates to Include in Cohort:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {applications.map((app) => {
              const isChecked = selectedAppIds.includes(app.id);
              return (
                <button
                  key={app.id}
                  onClick={() => handleToggleCandidate(app.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    border: isChecked ? "1px solid #6366f1" : "1px solid var(--border-card)",
                    backgroundColor: isChecked ? "rgba(99, 102, 241, 0.2)" : "var(--bg-surface)",
                    color: isChecked ? "#ffffff" : "var(--text-muted)",
                    fontSize: "12.5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <input type="checkbox" checked={isChecked} readOnly />
                  <span>App #{app.id} (Candidate #{app.candidate_id})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rankings Table */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
              Deterministic Ranking & Explainability Report
            </h3>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {rankings.length} Candidates Evaluated
            </span>
          </div>

          {rankings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
              No candidates ranked. Ensure candidates have applied to this job role.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-card)", textAlign: "left", color: "var(--text-muted)" }}>
                    <th style={{ padding: "10px" }}>Rank</th>
                    <th style={{ padding: "10px" }}>Candidate</th>
                    <th style={{ padding: "10px" }}>Composite Score</th>
                    <th style={{ padding: "10px" }}>Recommendation</th>
                    <th style={{ padding: "10px" }}>Mathematical Explanation</th>
                    <th style={{ padding: "10px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((r) => {
                    const isStrong = r.recommendation === "STRONG_HIRE";
                    const isHire = r.recommendation === "HIRE";
                    const isReview = r.recommendation === "REVIEW";

                    return (
                      <tr
                        key={r.application_id}
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          backgroundColor: r.rank === 1 ? "rgba(99, 102, 241, 0.06)" : "transparent",
                        }}
                      >
                        <td style={{ padding: "12px 10px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "26px",
                              height: "26px",
                              borderRadius: "50%",
                              backgroundColor: r.rank === 1 ? "#6366f1" : "var(--bg-surface)",
                              color: "#ffffff",
                              fontWeight: 700,
                              fontSize: "12px",
                            }}
                          >
                            #{r.rank}
                          </span>
                        </td>
                        <td style={{ padding: "12px 10px", fontWeight: 600, color: "#f8fafc" }}>
                          Candidate #{r.candidate_id}
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            App #{r.application_id}
                          </div>
                        </td>
                        <td style={{ padding: "12px 10px" }}>
                          <span
                            style={{
                              fontSize: "15px",
                              fontWeight: 700,
                              color: r.composite_score >= 75 ? "#10b981" : r.composite_score >= 60 ? "#f59e0b" : "#ef4444",
                            }}
                          >
                            {r.composite_score}%
                          </span>
                        </td>
                        <td style={{ padding: "12px 10px" }}>
                          <span
                            className={`badge ${
                              isStrong || isHire
                                ? "badge-success"
                                : isReview
                                ? "badge-warning"
                                : "badge-danger"
                            }`}
                            style={{ fontSize: "11px", fontWeight: 700 }}
                          >
                            {r.recommendation}
                          </span>
                        </td>
                        <td style={{ padding: "12px 10px", color: "var(--text-secondary)", fontSize: "12px", maxWidth: "340px" }}>
                          {r.explanation}
                        </td>
                        <td style={{ padding: "12px 10px" }}>
                          <Link to={`/recruiter/candidate/${r.application_id}`} className="btn btn-xs btn-outline">
                            View Dossier →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
