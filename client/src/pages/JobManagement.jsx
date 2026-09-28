import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { jobsAPI } from "../services/api";
import {
  Briefcase,
  Plus,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  Code2,
  Layers,
  ChevronRight,
  Edit2,
  Archive,
  Power,
} from "lucide-react";

export default function JobManagement() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Create form state
  const [formData, setFormData] = useState({
    title: "",
    department: "Engineering",
    description: "",
    min_experience_years: 2,
    required_skills: "Python, FastAPI, SQL, Docker",
    preferred_skills: "Kubernetes, Redis, PyTorch",
    education_requirement: "Bachelor's in CS or equivalent",
    coding_required: true,
    interview_required: true,
    shortlist_cutoff_score: 70.0,
    assessment_duration_minutes: 60,
    // Weights
    weight_aptitude: 15,
    weight_cs_fundamentals: 15,
    weight_dsa: 20,
    weight_dbms: 10,
    weight_coding: 25,
    weight_interview: 15,
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await jobsAPI.list();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const totalWeight =
    Number(formData.weight_aptitude || 0) +
    Number(formData.weight_cs_fundamentals || 0) +
    Number(formData.weight_dsa || 0) +
    Number(formData.weight_dbms || 0) +
    Number(formData.weight_coding || 0) +
    Number(formData.weight_interview || 0);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (totalWeight !== 100) {
      setError(`Assessment section weights must sum to exactly 100% (currently ${totalWeight}%).`);
      return;
    }

    try {
      setError(null);
      const skillsArray = formData.required_skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const prefSkillsArray = formData.preferred_skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title: formData.title,
        department: formData.department,
        description: formData.description,
        min_experience_years: Number(formData.min_experience_years),
        required_skills: skillsArray,
        preferred_skills: prefSkillsArray,
        education_requirement: formData.education_requirement,
        coding_required: Boolean(formData.coding_required),
        interview_required: Boolean(formData.interview_required),
        shortlist_cutoff_score: Number(formData.shortlist_cutoff_score),
        assessment_duration_minutes: Number(formData.assessment_duration_minutes),
        assessment_config: {
          sections: {
            aptitude: { weight: Number(formData.weight_aptitude), marks: 20, duration_minutes: 15 },
            cs_fundamentals: { weight: Number(formData.weight_cs_fundamentals), marks: 20, duration_minutes: 15 },
            dsa: { weight: Number(formData.weight_dsa), marks: 20, duration_minutes: 15 },
            dbms: { weight: Number(formData.weight_dbms), marks: 15, duration_minutes: 10 },
            coding: { weight: Number(formData.weight_coding), marks: 25, duration_minutes: 30 },
            interview: { weight: Number(formData.weight_interview), marks: 25, duration_minutes: 20 },
          },
          passing_cutoff_percent: Number(formData.shortlist_cutoff_score),
        },
      };

      await jobsAPI.create(payload);
      setShowCreateModal(false);
      setSuccessMsg("Job posting and assessment configuration created successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchJobs();
    } catch (err) {
      setError(err.message || "Failed to create job posting");
    }
  };

  const handlePublish = async (id) => {
    try {
      await jobsAPI.publish(id);
      fetchJobs();
    } catch (err) {
      setError(err.message || "Failed to publish job");
    }
  };

  const handleClose = async (id) => {
    try {
      await jobsAPI.close(id);
      fetchJobs();
    } catch (err) {
      setError(err.message || "Failed to close job");
    }
  };

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
              <span className="badge badge-primary">Recruiter Workspace</span>
              <span className="badge badge-neutral">Assessment Architecture</span>
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
              Job Profiles & Assessment Calibration
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
              Define deterministic multi-section assessment structures, section weights, and pass cutoffs.
            </p>
          </div>

          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Create Job Profile</span>
          </button>
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

        {/* Jobs Grid */}
        {loading ? (
          <div className="flex-center" style={{ minHeight: "40vh" }}>
            <div className="spinner spinner-lg"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
            <Briefcase size={36} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "18px", color: "#f8fafc", marginBottom: "8px" }}>No Job Postings Yet</h3>
            <p style={{ color: "var(--text-secondary)", maxWidth: "450px", margin: "0 auto 20px" }}>
              Create your first job profile to configure multi-section technical assessment weights and eligibility rules.
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus size={16} />
              <span>Create First Job</span>
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
            {jobs.map((job) => {
              const cfg = job.assessment_config_json ? JSON.parse(job.assessment_config_json) : {};
              const sections = cfg.sections || {};

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
                        <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
                          {job.title}
                        </h3>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          {job.department || "Engineering"} • Min {job.min_experience_years} yrs exp
                        </span>
                      </div>
                      <span
                        className={`badge ${
                          job.status === "PUBLISHED"
                            ? "badge-success"
                            : job.status === "DRAFT"
                            ? "badge-neutral"
                            : "badge-danger"
                        }`}
                        style={{ fontSize: "11px", textTransform: "uppercase" }}
                      >
                        {job.status}
                      </span>
                    </div>

                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: "1.5" }}>
                      {job.description ? job.description.slice(0, 110) + (job.description.length > 110 ? "..." : "") : "Technical engineering role."}
                    </p>

                    {/* Section Weights Visual */}
                    <div style={{ marginBottom: "16px", backgroundColor: "rgba(15, 23, 42, 0.6)", padding: "12px", borderRadius: "8px" }}>
                      <div style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                        Section Calibration (100% Weight)
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", fontSize: "11.5px" }}>
                        <div>
                          <span style={{ color: "var(--text-secondary)" }}>Aptitude:</span>{" "}
                          <strong style={{ color: "#f8fafc" }}>{sections.aptitude?.weight ?? 15}%</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-secondary)" }}>CS Fund:</span>{" "}
                          <strong style={{ color: "#f8fafc" }}>{sections.cs_fundamentals?.weight ?? 15}%</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-secondary)" }}>DSA:</span>{" "}
                          <strong style={{ color: "#f8fafc" }}>{sections.dsa?.weight ?? 20}%</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-secondary)" }}>DBMS:</span>{" "}
                          <strong style={{ color: "#f8fafc" }}>{sections.dbms?.weight ?? 10}%</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-secondary)" }}>Coding:</span>{" "}
                          <strong style={{ color: "#f8fafc" }}>{sections.coding?.weight ?? 25}%</strong>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-secondary)" }}>Interview:</span>{" "}
                          <strong style={{ color: "#f8fafc" }}>{sections.interview?.weight ?? 15}%</strong>
                        </div>
                      </div>
                    </div>

                    {/* Cutoff & Duration Info */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
                      <span>Cutoff: <strong style={{ color: "#f59e0b" }}>{job.shortlist_cutoff_score}%</strong></span>
                      <span>Duration: <strong style={{ color: "#06b6d4" }}>{job.assessment_duration_minutes} mins</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}>
                    <Link to={`/recruiter/pipeline?job_id=${job.id}`} className="btn btn-sm btn-primary">
                      <span>View Pipeline</span>
                      <ChevronRight size={14} />
                    </Link>

                    <div style={{ display: "flex", gap: "6px" }}>
                      {job.status === "DRAFT" && (
                        <button onClick={() => handlePublish(job.id)} className="btn btn-xs btn-outline" title="Publish Job">
                          <Power size={13} color="#10b981" />
                          <span>Publish</span>
                        </button>
                      )}
                      {job.status === "PUBLISHED" && (
                        <button onClick={() => handleClose(job.id)} className="btn btn-xs btn-outline" title="Close Job">
                          <Power size={13} color="#f59e0b" />
                          <span>Close</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Job Modal */}
        {showCreateModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "20px",
            }}
          >
            <div
              className="card"
              style={{
                maxWidth: "680px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "28px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
                  Create Job & Configure Assessment
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "18px" }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateJob} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Job Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="e.g. Senior Backend Engineer"
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", backgroundColor: "#080c14", border: "1px solid var(--border-card)", color: "#ffffff" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleInputChange("department", e.target.value)}
                      placeholder="e.g. Platform Engineering"
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", backgroundColor: "#080c14", border: "1px solid var(--border-card)", color: "#ffffff" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Job Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Brief description of the role, responsibilities, and team context..."
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", backgroundColor: "#080c14", border: "1px solid var(--border-card)", color: "#ffffff" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Min Experience (Years)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.min_experience_years}
                      onChange={(e) => handleInputChange("min_experience_years", e.target.value)}
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", backgroundColor: "#080c14", border: "1px solid var(--border-card)", color: "#ffffff" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Shortlist Cutoff Score (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.shortlist_cutoff_score}
                      onChange={(e) => handleInputChange("shortlist_cutoff_score", e.target.value)}
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", backgroundColor: "#080c14", border: "1px solid var(--border-card)", color: "#ffffff" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>Required Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.required_skills}
                    onChange={(e) => handleInputChange("required_skills", e.target.value)}
                    placeholder="Python, PostgreSQL, Distributed Systems"
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", backgroundColor: "#080c14", border: "1px solid var(--border-card)", color: "#ffffff" }}
                  />
                </div>

                {/* Section Weight Sliders */}
                <div style={{ backgroundColor: "rgba(15, 23, 42, 0.7)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-card)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#f8fafc" }}>
                      Assessment Section Weights
                    </div>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: totalWeight === 100 ? "#10b981" : "#ef4444",
                      }}
                    >
                      Total: {totalWeight}% / 100%
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>Aptitude (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={formData.weight_aptitude}
                        onChange={(e) => handleInputChange("weight_aptitude", e.target.value)}
                        style={{ width: "100%", padding: "6px", backgroundColor: "#080c14", border: "1px solid var(--border-card)", borderRadius: "4px", color: "#fff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>CS Fundamentals (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={formData.weight_cs_fundamentals}
                        onChange={(e) => handleInputChange("weight_cs_fundamentals", e.target.value)}
                        style={{ width: "100%", padding: "6px", backgroundColor: "#080c14", border: "1px solid var(--border-card)", borderRadius: "4px", color: "#fff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>DSA (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={formData.weight_dsa}
                        onChange={(e) => handleInputChange("weight_dsa", e.target.value)}
                        style={{ width: "100%", padding: "6px", backgroundColor: "#080c14", border: "1px solid var(--border-card)", borderRadius: "4px", color: "#fff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>DBMS (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={formData.weight_dbms}
                        onChange={(e) => handleInputChange("weight_dbms", e.target.value)}
                        style={{ width: "100%", padding: "6px", backgroundColor: "#080c14", border: "1px solid var(--border-card)", borderRadius: "4px", color: "#fff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>Coding Section (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={formData.weight_coding}
                        onChange={(e) => handleInputChange("weight_coding", e.target.value)}
                        style={{ width: "100%", padding: "6px", backgroundColor: "#080c14", border: "1px solid var(--border-card)", borderRadius: "4px", color: "#fff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>AI Interview (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={formData.weight_interview}
                        onChange={(e) => handleInputChange("weight_interview", e.target.value)}
                        style={{ width: "100%", padding: "6px", backgroundColor: "#080c14", border: "1px solid var(--border-card)", borderRadius: "4px", color: "#fff" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit & Cancel */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline">
                    Cancel
                  </button>
                  <button type="submit" disabled={totalWeight !== 100} className="btn btn-primary">
                    Create & Save Job
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
