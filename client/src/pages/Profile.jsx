import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { resumeAPI, assessmentAPI } from "../services/api";
import {
  User as UserIcon,
  Mail,
  FileText,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Code,
  Layers,
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  Target,
  RefreshCw,
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [resumeData, setResumeData] = useState(null);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [resData, analyticsData] = await Promise.all([
        resumeAPI.getMe().catch(() => ({ has_resume: false })),
        assessmentAPI.getAnalytics().catch(() => null),
      ]);

      if (resData && resData.has_resume) {
        setResumeData(resData.resume);
      } else {
        setResumeData(null);
      }
      setStats(analyticsData);
    } catch (err) {
      console.error("Failed to load profile:", err);
      setError("Failed to load profile information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx"].includes(ext)) {
      setError("Only PDF and DOCX documents are supported.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccessMsg(null);

      await resumeAPI.upload(file);
      setSuccessMsg("Resume uploaded and parsed successfully by Gemini AI!");
      await loadProfileData();
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload and parse resume.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteResume = async () => {
    const confirm = window.confirm("Are you sure you want to remove your uploaded resume profile?");
    if (!confirm) return;

    try {
      setLoading(true);
      await resumeAPI.deleteMe();
      setResumeData(null);
      setSuccessMsg("Resume profile removed.");
    } catch (err) {
      setError(err.message || "Failed to delete resume.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !resumeData && !stats) {
    return (
      <div className="flex-center" style={{ minHeight: "75vh", flexDirection: "column", gap: "16px" }}>
        <div className="spinner spinner-lg"></div>
        <p style={{ color: "var(--text-secondary)" }}>Loading candidate profile...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 0 60px" }}>
      <div className="container" style={{ maxWidth: "960px" }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 4px" }}>
            Candidate Profile & Resume Intelligence
          </h1>
          <p style={{ fontSize: "14px" }}>
            Manage your credentials, uploaded resume, extracted skills, and track records.
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

        {/* User Identity & Stats Banner */}
        <div
          className="card"
          style={{
            marginBottom: "28px",
            padding: "28px",
            background: "radial-gradient(ellipse at 90% 10%, rgba(99, 102, 241, 0.12) 0%, rgba(15, 23, 42, 1) 70%)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div
                style={{
                  width: "68px",
                  height: "68px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 700,
                  boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
                  flexShrink: 0,
                }}
              >
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
              </div>

              <div>
                <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 4px" }}>
                  {user?.full_name || "Engineering Candidate"}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "13.5px" }}>
                  <Mail size={14} />
                  <span>{user?.email}</span>
                  {user?.is_admin && (
                    <span className="badge badge-warning" style={{ marginLeft: "8px" }}>
                      Admin / Reviewer
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick KPIs */}
            <div style={{ display: "flex", gap: "16px", borderLeft: "1px solid var(--border-card)", paddingLeft: "20px" }}>
              <div>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                  Assessments
                </div>
                <div style={{ fontSize: "20px", fontWeight: 700 }}>
                  {stats?.total_assessments || 0}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                  Average Score
                </div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--primary)" }}>
                  {stats?.overall_average_score > 0 ? `${stats.overall_average_score}/10` : "N/A"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                  Skill Level
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--cyan-accent)", marginTop: "4px" }}>
                  {stats?.current_skill_level || "Intermediate"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resume Upload & Intelligence Section */}
        <div className="card" style={{ marginBottom: "28px", padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px" }}>
                Resume Profile (AI-Aware Questions)
              </h2>
              <p style={{ fontSize: "13.5px" }}>
                Upload your resume (PDF or DOCX). Gemini AI extracts your real projects, tools, and experience to generate personalized questions.
              </p>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn btn-primary btn-sm"
              >
                {uploading ? (
                  <>
                    <div className="spinner"></div>
                    <span>Parsing Resume...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>{resumeData ? "Replace Resume" : "Upload Resume"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {!resumeData ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed var(--border-card)",
                borderRadius: "12px",
                padding: "36px 20px",
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: "rgba(255, 255, 255, 0.01)",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(99, 102, 241, 0.1)",
                  color: "#818cf8",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <FileText size={24} />
              </div>
              <h3 style={{ fontSize: "15.5px", fontWeight: 600, marginBottom: "4px" }}>
                Click to upload your resume (PDF / DOCX)
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-muted)", margin: 0 }}>
                Automatic AI extraction of skills, real-world projects, frameworks, and education.
              </p>
            </div>
          ) : (
            <div>
              {/* Active Resume Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(6, 182, 212, 0.08)",
                  border: "1px solid rgba(6, 182, 212, 0.25)",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FileText size={18} color="#06b6d4" />
                  <span style={{ fontWeight: 600, fontSize: "14px" }}>{resumeData.filename}</span>
                  <span className="badge badge-success" style={{ fontSize: "11px" }}>
                    Parsed & Active
                  </span>
                </div>

                <button
                  onClick={handleDeleteResume}
                  className="btn btn-outline btn-sm"
                  style={{ color: "var(--danger)", borderColor: "rgba(239, 68, 68, 0.3)" }}
                >
                  <Trash2 size={13} />
                  <span>Remove</span>
                </button>
              </div>

              {/* Summary */}
              {resumeData.summary && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>
                    Professional Summary
                  </div>
                  <p style={{ fontSize: "13.5px", lineHeight: "1.5", color: "#e2e8f0" }}>
                    {resumeData.summary}
                  </p>
                </div>
              )}

              {/* Skills & Frameworks Tags */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Extracted Technical Skills & Languages
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {resumeData.skills?.map((s, i) => (
                    <span key={i} className="badge badge-primary" style={{ fontSize: "12px", padding: "4px 10px" }}>
                      {s}
                    </span>
                  ))}
                  {resumeData.frameworks?.map((f, i) => (
                    <span key={i} className="badge badge-neutral" style={{ fontSize: "12px", padding: "4px 10px" }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Projects List */}
              {resumeData.projects && resumeData.projects.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
                    Recognized Projects
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {resumeData.projects.map((p, i) => (
                      <div
                        key={i}
                        style={{
                          backgroundColor: "var(--bg-surface)",
                          padding: "12px 16px",
                          borderRadius: "8px",
                          border: "1px solid var(--border-card)",
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: "14px", color: "#818cf8", marginBottom: "4px" }}>
                          {p.title}
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 6px" }}>
                          {p.description}
                        </p>
                        {p.technologies && (
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                            {p.technologies.map((t, ti) => (
                              <span key={ti} style={{ fontSize: "11px", color: "var(--text-muted)", backgroundColor: "#0f172a", padding: "2px 6px", borderRadius: "4px" }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
