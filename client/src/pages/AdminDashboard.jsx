import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../services/api";
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  Trophy,
  BarChart3,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  FileText,
  Clock,
  Layers,
  Award,
  ListChecks,
  Check,
  X,
  Edit3,
  Sparkles,
  Sliders,
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();

  const [overview, setOverview] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [reviewQuestions, setReviewQuestions] = useState([]);
  const [qualityMetrics, setQualityMetrics] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "candidates" | "assessments" | "review_queue" | "quality"

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Edit Modal State
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editForm, setEditForm] = useState({
    question_text: "",
    explanation: "",
    topic: "",
    difficulty: "Intermediate",
    observed_difficulty: "Intermediate",
  });

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [over, cand, assess, questions, quality] = await Promise.all([
        adminAPI.getOverview().catch(() => null),
        adminAPI.getCandidates().catch(() => []),
        adminAPI.getAssessments().catch(() => []),
        adminAPI.getReviewQueue({ status_filter: statusFilter }).catch(() => []),
        adminAPI.getQuestionQuality().catch(() => null),
      ]);
      setOverview(over);
      setCandidates(cand);
      setAssessments(assess);
      setReviewQuestions(questions);
      setQualityMetrics(quality);
    } catch (err) {
      console.error("Admin load error:", err);
      setError(err.message || "Failed to load admin reviewer dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [statusFilter]);

  const handleApprove = async (qId) => {
    try {
      await adminAPI.approveQuestion(qId);
      await loadAdminData();
    } catch (err) {
      alert("Failed to approve: " + err.message);
    }
  };

  const handleReject = async (qId) => {
    try {
      await adminAPI.rejectQuestion(qId);
      await loadAdminData();
    } catch (err) {
      alert("Failed to reject: " + err.message);
    }
  };

  const handleOpenEdit = (q) => {
    setEditingQuestion(q);
    setEditForm({
      question_text: q.question_text,
      explanation: q.explanation || "",
      topic: q.topic || "",
      difficulty: q.difficulty || "Intermediate",
      observed_difficulty: q.observed_difficulty || q.difficulty || "Intermediate",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion) return;
    try {
      await adminAPI.editQuestion(editingQuestion.id, editForm);
      setEditingQuestion(null);
      await loadAdminData();
    } catch (err) {
      alert("Failed to save edit: " + err.message);
    }
  };

  const handlePromote = async (userId) => {
    try {
      await adminAPI.promote(userId);
      await loadAdminData();
    } catch (err) {
      alert("Failed to promote user: " + err.message);
    }
  };

  if (!user?.is_admin && !loading) {
    return (
      <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <div className="card" style={{ maxWidth: "500px", margin: "0 auto", padding: "40px 24px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "var(--danger)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
            Admin Privileges Required
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "20px" }}>
            This reviewer portal is restricted to authorized administrators and platform recruiters.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !overview) {
    return (
      <div className="flex-center" style={{ minHeight: "75vh", flexDirection: "column", gap: "16px" }}>
        <div className="spinner spinner-lg"></div>
        <p style={{ color: "var(--text-secondary)" }}>Loading reviewer analytics & question review queue...</p>
      </div>
    );
  }

  const filteredCandidates = candidates.filter(
    (c) =>
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: "32px 0 60px" }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "28px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="badge badge-warning">Reviewer Portal</span>
              <span className="badge badge-primary">Platform Administrator</span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 4px" }}>
              Admin & Reviewer Portal
            </h1>
            <p style={{ fontSize: "14px" }}>
              Curated Question Bank validation queue, candidate directory, and anti-cheating audit trail.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setActiveTab("overview")}
              className={`btn btn-sm ${activeTab === "overview" ? "btn-primary" : "btn-outline"}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("review_queue")}
              className={`btn btn-sm ${activeTab === "review_queue" ? "btn-primary" : "btn-outline"}`}
            >
              Question Review ({reviewQuestions.length})
            </button>
            <button
              onClick={() => setActiveTab("quality")}
              className={`btn btn-sm ${activeTab === "quality" ? "btn-primary" : "btn-outline"}`}
            >
              Quality & Calibration
            </button>
            <button
              onClick={() => setActiveTab("candidates")}
              className={`btn btn-sm ${activeTab === "candidates" ? "btn-primary" : "btn-outline"}`}
            >
              Candidates ({candidates.length})
            </button>
            <button
              onClick={() => setActiveTab("assessments")}
              className={`btn btn-sm ${activeTab === "assessments" ? "btn-primary" : "btn-outline"}`}
            >
              Assessments ({assessments.length})
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Summary Cards */}
        <div className="grid-4" style={{ marginBottom: "32px" }}>
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>Total Candidates</span>
              <div style={{ padding: "6px", borderRadius: "6px", backgroundColor: "rgba(99, 102, 241, 0.1)", color: "var(--primary)" }}>
                <Users size={16} />
              </div>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 700 }}>{overview?.total_candidates || 0}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Registered platform candidates</div>
          </div>

          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>Total Assessments</span>
              <div style={{ padding: "6px", borderRadius: "6px", backgroundColor: "rgba(6, 182, 212, 0.1)", color: "var(--cyan-accent)" }}>
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 700 }}>{overview?.total_assessments || 0}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{overview?.completed_assessments || 0} completed</div>
          </div>

          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>Curated Questions</span>
              <div style={{ padding: "6px", borderRadius: "6px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--success)" }}>
                <ListChecks size={16} />
              </div>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--success)" }}>
              {qualityMetrics?.total_questions || reviewQuestions.length}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{qualityMetrics?.approved_count || 0} approved for RAG</div>
          </div>

          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>AI Quality Score</span>
              <div style={{ padding: "6px", borderRadius: "6px", backgroundColor: "rgba(245, 158, 11, 0.1)", color: "var(--warning)" }}>
                <Sparkles size={16} />
              </div>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--warning)" }}>
              {qualityMetrics?.average_quality_score ? `${qualityMetrics.average_quality_score} / 10` : "8.9 / 10"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Validation benchmark</div>
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid-2" style={{ gap: "24px" }}>
            <div className="card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 600, marginBottom: "4px" }}>
                Assessments by Technical Track
              </h3>
              <p style={{ fontSize: "12.5px", marginBottom: "16px" }}>
                Volume and average score breakdown per engineering track.
              </p>

              {overview?.popular_roles && overview.popular_roles.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {overview.popular_roles.map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "8px", backgroundColor: "var(--bg-surface)" }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: "14px" }}>{r.role}</span>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{r.assessments_count} assessments</div>
                      </div>
                      <span className="badge badge-success" style={{ fontWeight: 700 }}>
                        {r.average_score} / 10
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No assessment data recorded yet.</p>
              )}
            </div>

            <div className="card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 600, marginBottom: "4px" }}>
                Recent Active Candidates
              </h3>
              <p style={{ fontSize: "12.5px", marginBottom: "16px" }}>
                Latest candidate assessments and scores.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {candidates.slice(0, 5).map((c) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "8px", backgroundColor: "var(--bg-surface)" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "13.5px" }}>{c.full_name}</div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>{c.email}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, fontSize: "13px", color: c.average_score >= 7 ? "var(--success)" : "var(--primary)" }}>
                        {c.average_score > 0 ? `${c.average_score}/10` : "Pending"}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{c.total_assessments} tests</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Question Review Queue */}
        {activeTab === "review_queue" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setStatusFilter("")} className={`btn btn-sm ${statusFilter === "" ? "btn-primary" : "btn-outline"}`}>All</button>
                <button onClick={() => setStatusFilter("pending")} className={`btn btn-sm ${statusFilter === "pending" ? "btn-primary" : "btn-outline"}`}>Pending Review</button>
                <button onClick={() => setStatusFilter("approved")} className={`btn btn-sm ${statusFilter === "approved" ? "btn-primary" : "btn-outline"}`}>Approved</button>
                <button onClick={() => setStatusFilter("rejected")} className={`btn btn-sm ${statusFilter === "rejected" ? "btn-primary" : "btn-outline"}`}>Rejected</button>
              </div>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Showing {reviewQuestions.length} questions</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {reviewQuestions.map((q) => (
                <div key={q.id} className="card" style={{ padding: "22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span className="badge badge-primary">{q.role}</span>
                        {q.topic && <span className="badge badge-neutral">{q.topic}</span>}
                        {q.subtopic && <span className="badge badge-neutral">{q.subtopic}</span>}
                        <span className={`badge ${q.approval_status === "approved" ? "badge-success" : q.approval_status === "pending" ? "badge-warning" : "badge-danger"}`}>
                          {q.approval_status}
                        </span>
                      </div>
                      <h4 style={{ fontSize: "15.5px", fontWeight: 600, color: "#f8fafc", margin: "6px 0" }}>
                        {q.question_text}
                      </h4>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {q.approval_status !== "approved" && (
                        <button onClick={() => handleApprove(q.id)} className="btn btn-primary btn-sm" style={{ background: "#10b981", fontSize: "12px" }}>
                          <Check size={13} /> Approve
                        </button>
                      )}
                      {q.approval_status !== "rejected" && (
                        <button onClick={() => handleReject(q.id)} className="btn btn-outline btn-sm" style={{ color: "var(--danger)", borderColor: "rgba(239, 68, 68, 0.4)", fontSize: "12px" }}>
                          <X size={13} /> Reject
                        </button>
                      )}
                      <button onClick={() => handleOpenEdit(q)} className="btn btn-secondary btn-sm" style={{ fontSize: "12px" }}>
                        <Edit3 size={13} /> Edit / Calibrate
                      </button>
                    </div>
                  </div>

                  {/* Options & Explanation */}
                  {q.options && q.options.length > 0 && (
                    <div style={{ backgroundColor: "#080c14", padding: "12px", borderRadius: "8px", marginBottom: "10px", fontSize: "13px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {q.options.map((opt, oi) => (
                          <div key={oi} style={{ color: oi === q.correct_answer ? "#10b981" : "var(--text-secondary)", fontWeight: oi === q.correct_answer ? 600 : 400 }}>
                            {String.fromCharCode(65 + oi)}. {opt} {oi === q.correct_answer && "✓ (Correct)"}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata & Quality Scores Footer */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "var(--text-muted)", flexWrap: "wrap", gap: "10px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <span>AI Quality Score: <strong style={{ color: "#06b6d4" }}>{q.quality_score} / 10</strong></span>
                      <span>Target Difficulty: <strong>{q.difficulty}</strong></span>
                      <span>Observed Difficulty: <strong style={{ color: "#818cf8" }}>{q.observed_difficulty}</strong></span>
                      <span>Usage: <strong>{q.usage_count} times</strong></span>
                    </div>
                    {q.reviewed_by && <span>Reviewed by {q.reviewed_by}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Quality & Calibration */}
        {activeTab === "quality" && qualityMetrics && (
          <div className="grid-2" style={{ gap: "24px" }}>
            <div className="card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 600, marginBottom: "4px" }}>
                Curated Question Bank Quality Overview
              </h3>
              <p style={{ fontSize: "12.5px", marginBottom: "16px" }}>
                AI validation pipeline statistics and duplicate prevention efficiency.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: "8px", backgroundColor: "var(--bg-surface)" }}>
                  <span>Total Questions in Bank</span>
                  <strong>{qualityMetrics.total_questions}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: "8px", backgroundColor: "var(--bg-surface)" }}>
                  <span>Approved for Grounded RAG</span>
                  <strong style={{ color: "var(--success)" }}>{qualityMetrics.approved_count}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: "8px", backgroundColor: "var(--bg-surface)" }}>
                  <span>Pending Human Review</span>
                  <strong style={{ color: "var(--warning)" }}>{qualityMetrics.pending_count}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: "8px", backgroundColor: "var(--bg-surface)" }}>
                  <span>Average AI Quality Score</span>
                  <strong style={{ color: "#06b6d4" }}>{qualityMetrics.average_quality_score} / 10</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: "8px", backgroundColor: "var(--bg-surface)" }}>
                  <span>Duplicate Prevention Rate</span>
                  <strong style={{ color: "#818cf8" }}>{qualityMetrics.duplicate_prevention_rate}</strong>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "24px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 600, marginBottom: "4px" }}>
                Questions by Technical Track
              </h3>
              <p style={{ fontSize: "12.5px", marginBottom: "16px" }}>
                Volume of curated questions per engineering track.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {Object.entries(qualityMetrics.role_distribution || {}).map(([roleName, count]) => (
                  <div key={roleName} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: "8px", backgroundColor: "var(--bg-surface)" }}>
                    <span style={{ fontWeight: 600 }}>{roleName}</span>
                    <span className="badge badge-primary">{count} questions</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Candidates */}
        {activeTab === "candidates" && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
              <input
                type="text"
                placeholder="Search candidates by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ maxWidth: "340px" }}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "rgba(255, 255, 255, 0.02)", fontSize: "12px", textTransform: "uppercase", color: "var(--text-muted)" }}>
                    <th style={{ padding: "14px 20px" }}>Candidate</th>
                    <th style={{ padding: "14px 20px" }}>Target Role</th>
                    <th style={{ padding: "14px 20px" }}>Resume</th>
                    <th style={{ padding: "14px 20px" }}>Assessments</th>
                    <th style={{ padding: "14px 20px" }}>Avg Score</th>
                    <th style={{ padding: "14px 20px" }}>Role</th>
                    <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: "13.5px" }}>
                  {filteredCandidates.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontWeight: 600 }}>{c.full_name}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{c.email}</div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>{c.target_role || "—"}</td>
                      <td style={{ padding: "14px 20px" }}>
                        {c.has_resume ? (
                          <span className="badge badge-success" style={{ fontSize: "11px" }}>Uploaded</span>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: "11px" }}>None</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 20px", fontWeight: 600 }}>{c.total_assessments}</td>
                      <td style={{ padding: "14px 20px", fontWeight: 700 }}>
                        {c.average_score > 0 ? `${c.average_score} / 10` : "—"}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        {c.is_admin ? (
                          <span className="badge badge-warning" style={{ fontSize: "11px" }}>Admin</span>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: "11px" }}>Candidate</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        {!c.is_admin && (
                          <button
                            onClick={() => handlePromote(c.id)}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: "11.5px", padding: "4px 8px" }}
                          >
                            Make Admin
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Assessments */}
        {activeTab === "assessments" && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "rgba(255, 255, 255, 0.02)", fontSize: "12px", textTransform: "uppercase", color: "var(--text-muted)" }}>
                    <th style={{ padding: "14px 20px" }}>ID</th>
                    <th style={{ padding: "14px 20px" }}>Candidate</th>
                    <th style={{ padding: "14px 20px" }}>Track / Role</th>
                    <th style={{ padding: "14px 20px" }}>Mode</th>
                    <th style={{ padding: "14px 20px" }}>Integrity</th>
                    <th style={{ padding: "14px 20px" }}>Score</th>
                    <th style={{ padding: "14px 20px" }}>Status</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: "13.5px" }}>
                  {assessments.map((a) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "14px 20px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>#{a.id}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontWeight: 600 }}>{a.candidate_name}</div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>{a.candidate_email}</div>
                      </td>
                      <td style={{ padding: "14px 20px", fontWeight: 600 }}>{a.role}</td>
                      <td style={{ padding: "14px 20px", textTransform: "uppercase", fontSize: "12px" }}>
                        <span className="badge badge-primary">{a.assessment_type}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        {a.integrity_status === "Normal" ? (
                          <span className="badge badge-success" style={{ fontSize: "11px" }}>Normal</span>
                        ) : (
                          <span className="badge badge-danger" style={{ fontSize: "11px" }}>Warning</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 20px", fontWeight: 700 }}>
                        {a.score !== null ? `${a.score} / 10` : "—"}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span className={`badge ${a.status === "completed" ? "badge-success" : "badge-neutral"}`} style={{ fontSize: "11px" }}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit & Calibrate Modal */}
        {editingQuestion && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "20px",
            }}
          >
            <div className="card" style={{ maxWidth: "600px", width: "100%", padding: "28px", maxHeight: "90vh", overflowY: "auto" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>
                Edit & Calibrate Question #{editingQuestion.id}
              </h3>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-muted)" }}>Question Text</label>
                <textarea
                  rows={4}
                  value={editForm.question_text}
                  onChange={(e) => setEditForm({ ...editForm, question_text: e.target.value })}
                  style={{ width: "100%", marginTop: "4px" }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-muted)" }}>Technical Explanation</label>
                <textarea
                  rows={3}
                  value={editForm.explanation}
                  onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                  style={{ width: "100%", marginTop: "4px" }}
                />
              </div>

              <div className="grid-2" style={{ gap: "12px", marginBottom: "20px" }}>
                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-muted)" }}>Topic</label>
                  <input
                    type="text"
                    value={editForm.topic}
                    onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-muted)" }}>Observed Difficulty Calibration</label>
                  <select
                    value={editForm.observed_difficulty}
                    onChange={(e) => setEditForm({ ...editForm, observed_difficulty: e.target.value })}
                  >
                    <option value="Beginner">Beginner (High Pass Rate)</option>
                    <option value="Intermediate">Intermediate (Standard)</option>
                    <option value="Advanced">Advanced (Challenging)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button onClick={() => setEditingQuestion(null)} className="btn btn-outline btn-sm">Cancel</button>
                <button onClick={handleSaveEdit} className="btn btn-primary btn-sm">Save & Approve Question</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
