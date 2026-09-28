import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { recruiterAPI, jobsAPI } from "../services/api";
import {
  Users,
  Briefcase,
  UserCheck,
  Award,
  ChevronRight,
  TrendingUp,
  Clock,
  PlusCircle,
  Filter,
  CheckCircle2,
  XCircle,
  BarChart2,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

export default function RecruiterDashboard() {
  const [loading, setLoading] = useState(true);
  const [funnelData, setFunnelData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [funnelRes, jobsRes, auditRes] = await Promise.all([
        recruiterAPI.getFunnelOverview().catch(() => null),
        jobsAPI.list().catch(() => []),
        recruiterAPI.getAuditLogs({ limit: 8 }).catch(() => []),
      ]);

      setFunnelData(funnelRes || {
        total_applications: 0,
        stage_counts: {},
        pass_through_rates: {},
        active_jobs_count: 0,
        average_time_to_hire_days: null,
      });
      setJobs(Array.isArray(jobsRes) ? jobsRes : []);
      setAuditLogs(Array.isArray(auditRes) ? auditRes : []);
    } catch (err) {
      setError(err.message || "Failed to load recruiter dashboard");
    } finally {
      setLoading(false);
    }
  };

  const stages = [
    { key: "APPLIED", label: "Applied", color: "#6366f1" },
    { key: "ELIGIBLE", label: "Eligible", color: "#3b82f6" },
    { key: "ASSESSMENT_INVITED", label: "Invited", color: "#06b6d4" },
    { key: "ASSESSMENT_COMPLETED", label: "Assessed", color: "#8b5cf6" },
    { key: "SHORTLISTED", label: "Shortlisted", color: "#f59e0b" },
    { key: "INTERVIEW_COMPLETED", label: "Interviewed", color: "#10b981" },
    { key: "SELECTED", label: "Hired", color: "#22c55e" },
  ];

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "75vh", flexDirection: "column", gap: "16px" }}>
        <div className="spinner spinner-lg"></div>
        <p style={{ color: "var(--text-secondary)" }}>Loading recruiter intelligence...</p>
      </div>
    );
  }

  const stageCounts = funnelData?.stage_counts || {};
  const totalApps = funnelData?.total_applications || 0;

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
            marginBottom: "32px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span className="badge badge-primary">Enterprise Hiring</span>
              <span className="badge badge-neutral">Production Suite</span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
              Recruiter Command Center
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
              End-to-end recruitment funnel, AI technical interview orchestration, and explainable ranking.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link to="/recruiter/comparison" className="btn btn-outline">
              <BarChart2 size={16} />
              <span>Compare Candidates</span>
            </Link>
            <Link to="/recruiter/jobs" className="btn btn-primary">
              <PlusCircle size={16} />
              <span>Create Job / Configure</span>
            </Link>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "24px" }}>
            {error}
          </div>
        )}

        {/* Top KPIs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          <div className="card" style={{ padding: "20px", borderLeft: "4px solid #6366f1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                Active Job Postings
              </span>
              <Briefcase size={20} color="#6366f1" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#f8fafc", marginTop: "10px" }}>
              {jobs.filter((j) => j.status === "PUBLISHED").length}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              {jobs.length} total postings configured
            </div>
          </div>

          <div className="card" style={{ padding: "20px", borderLeft: "4px solid #3b82f6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                Total Applicants
              </span>
              <Users size={20} color="#3b82f6" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#f8fafc", marginTop: "10px" }}>
              {totalApps}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Across all pipeline stages
            </div>
          </div>

          <div className="card" style={{ padding: "20px", borderLeft: "4px solid #f59e0b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                Shortlisted for Interview
              </span>
              <Award size={20} color="#f59e0b" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#f8fafc", marginTop: "10px" }}>
              {stageCounts["SHORTLISTED"] || 0}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Passed multi-section cutoffs
            </div>
          </div>

          <div className="card" style={{ padding: "20px", borderLeft: "4px solid #22c55e" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                Hired Candidates
              </span>
              <UserCheck size={20} color="#22c55e" />
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#f8fafc", marginTop: "10px" }}>
              {stageCounts["SELECTED"] || 0}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              {stageCounts["REJECTED"] ? `${stageCounts["REJECTED"]} rejected` : "Zero unverified decisions"}
            </div>
          </div>
        </div>

        {/* Hiring Funnel Progression Bar */}
        <div className="card" style={{ padding: "24px", marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: "#f8fafc" }}>
              Recruitment Conversion Funnel
            </h3>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Deterministic Stage Breakdown</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${stages.length}, 1fr)`,
              gap: "8px",
            }}
          >
            {stages.map((st) => {
              const count = stageCounts[st.key] || 0;
              const pct = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0;
              return (
                <div
                  key={st.key}
                  style={{
                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid var(--border-card)",
                    borderRadius: "8px",
                    padding: "12px",
                    textAlign: "center",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      height: "4px",
                      backgroundColor: st.color,
                      borderRadius: "2px",
                      marginBottom: "8px",
                    }}
                  ></div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                    {st.label}
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>
                    {count}
                  </div>
                  <div style={{ fontSize: "11px", color: st.color, marginTop: "2px" }}>
                    {pct}% of total
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two Column Section: Active Jobs & Recent Audit Logs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
            gap: "24px",
          }}
        >
          {/* Active Job Postings */}
          <div className="card" style={{ padding: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: "#f8fafc" }}>
                Job Roles & Assessment Profiles
              </h3>
              <Link to="/recruiter/jobs" style={{ fontSize: "13px", color: "var(--primary)", textDecoration: "none" }}>
                Manage All →
              </Link>
            </div>

            {jobs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
                <p>No job postings created yet.</p>
                <Link to="/recruiter/jobs" className="btn btn-sm btn-primary" style={{ marginTop: "12px" }}>
                  Create First Job
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {jobs.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      backgroundColor: "rgba(15, 23, 42, 0.5)",
                      border: "1px solid var(--border-card)",
                      borderRadius: "8px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 600, fontSize: "14px", color: "#f8fafc" }}>
                          {job.title}
                        </span>
                        <span
                          className={`badge ${
                            job.status === "PUBLISHED"
                              ? "badge-success"
                              : job.status === "DRAFT"
                              ? "badge-neutral"
                              : "badge-danger"
                          }`}
                          style={{ fontSize: "11px" }}
                        >
                          {job.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {job.department || "Engineering"} • {job.min_experience_years}+ yrs exp • Cutoff: {job.shortlist_cutoff_score}%
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <Link
                        to={`/recruiter/pipeline?job_id=${job.id}`}
                        className="btn btn-xs btn-outline"
                        title="View applicants pipeline"
                      >
                        Pipeline
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hiring Decision & Audit Log */}
          <div className="card" style={{ padding: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={18} color="#10b981" />
                <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: "#f8fafc" }}>
                  Hiring Audit Trail
                </h3>
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Immutable Records</span>
            </div>

            {auditLogs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
                <p>No hiring transitions logged yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: "10px 14px",
                      backgroundColor: "rgba(15, 23, 42, 0.4)",
                      border: "1px solid var(--border-card)",
                      borderRadius: "6px",
                      fontSize: "12.5px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#f8fafc" }}>
                      <span style={{ fontWeight: 600 }}>{log.action}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                        {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div style={{ color: "var(--text-secondary)", marginTop: "3px" }}>
                      {log.rationale || `Application #${log.application_id} updated`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
