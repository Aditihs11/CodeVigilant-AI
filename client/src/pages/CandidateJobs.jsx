import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { jobsAPI, applicationsAPI } from "../services/api";
import {
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Award,
  ChevronRight,
  Send,
  Sparkles,
} from "lucide-react";

export default function CandidateJobs() {
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchJobsAndApplications();
  }, []);

  const fetchJobsAndApplications = async () => {
    try {
      setLoading(true);
      const [jobsData, myAppsData] = await Promise.all([
        jobsAPI.list({ status: "PUBLISHED" }).catch(() => []),
        applicationsAPI.getMyApplications().catch(() => []),
      ]);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setMyApplications(Array.isArray(myAppsData) ? myAppsData : []);
    } catch (err) {
      setError(err.message || "Failed to load open positions");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    try {
      setApplyingId(jobId);
      setError(null);
      await applicationsAPI.apply(jobId);
      setSuccessMsg("Application submitted successfully! Your resume is being screened for eligibility.");
      setTimeout(() => setSuccessMsg(""), 4000);
      fetchJobsAndApplications();
    } catch (err) {
      setError(err.message || "Application submission failed");
    } finally {
      setApplyingId(null);
    }
  };

  const appliedJobIds = myApplications.map((a) => a.job_id);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "75vh", flexDirection: "column", gap: "16px" }}>
        <div className="spinner spinner-lg"></div>
        <p style={{ color: "var(--text-secondary)" }}>Loading available engineering roles...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 0 60px" }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="badge badge-primary">Open Positions</span>
            <span className="badge badge-neutral">AI-Powered Assessment</span>
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
            Explore Engineering Roles & Opportunities
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Apply with your candidate profile and complete adaptive technical assessments.
          </p>
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

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="card" style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>
            <Briefcase size={36} style={{ margin: "0 auto 12px" }} />
            <p>No published job openings available at the moment.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
            {jobs.map((job) => {
              const hasApplied = appliedJobIds.includes(job.id);
              const myApp = myApplications.find((a) => a.job_id === job.id);

              return (
                <div
                  key={job.id}
                  className="card"
                  style={{
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
                          {job.title}
                        </h3>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          {job.department || "Engineering"} • Min {job.min_experience_years} yrs experience
                        </span>
                      </div>
                      {hasApplied && (
                        <span className="badge badge-success" style={{ fontSize: "11px" }}>
                          Applied ({myApp?.status})
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: "1.5" }}>
                      {job.description || "Exciting software engineering role evaluating core fundamentals and coding problem solving."}
                    </p>

                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
                      <div>
                        <strong>Duration:</strong> {job.assessment_duration_minutes} mins •{" "}
                        <strong>Cutoff:</strong> {job.shortlist_cutoff_score}%
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}>
                    {hasApplied ? (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                          Status: <strong>{myApp?.status}</strong>
                        </span>
                        {myApp?.status === "ASSESSMENT_INVITED" && (
                          <Link to={`/assessment/invite/token`} className="btn btn-sm btn-primary">
                            Take Assessment →
                          </Link>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApply(job.id)}
                        disabled={applyingId === job.id}
                        className="btn btn-primary"
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        <Send size={14} />
                        <span>{applyingId === job.id ? "Submitting..." : "Apply with Profile"}</span>
                      </button>
                    )}
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
