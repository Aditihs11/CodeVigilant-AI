import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { assessmentAPI, interviewAPI, skillsAPI } from "../services/api";
import {
  Sparkles,
  Trophy,
  CheckCircle2,
  Clock,
  ArrowRight,
  Play,
  Layers,
  Code,
  Terminal,
  Cpu,
  Brain,
  AlertCircle,
  ListChecks,
  FileCode,
  Target,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [skillProfile, setSkillProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [analyticsData, interviewsData, skillsData] = await Promise.all([
          assessmentAPI.getAnalytics().catch(() => interviewAPI.getAnalytics()),
          interviewAPI.getAll(),
          skillsAPI.getMySkills().catch(() => null),
        ]);
        setAnalytics(analyticsData);
        setInterviews(interviewsData);
        setSkillProfile(skillsData);
      } catch (err) {
        console.error("Dashboard data load error:", err);
        setError("Failed to load dashboard data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const assessmentModes = [
    {
      id: "mcq",
      title: "MCQ Assessment",
      desc: "5–15 high-density technical questions with instant topic-level accuracy & feedback.",
      icon: ListChecks,
      badge: "Fast Pace",
      color: "#06b6d4",
    },
    {
      id: "coding",
      title: "Coding Challenge",
      desc: "Algorithmic problem-solving with custom test cases & code quality scoring.",
      icon: FileCode,
      badge: "Hands-on",
      color: "#10b981",
    },
    {
      id: "interview",
      title: "AI Mock Interview",
      desc: "Conversational open-ended technical questions with granular strengths & improvement tips.",
      icon: Terminal,
      badge: "Comprehensive",
      color: "#6366f1",
    },
  ];

  const handleStartMode = (modeId) => {
    navigate("/interview/start", { state: { mode: modeId } });
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "var(--success)";
    if (score >= 6) return "var(--warning)";
    return "var(--danger)";
  };

  const getStatusBadge = (status) => {
    if (status === "completed") {
      return <span className="badge badge-success">Completed</span>;
    }
    if (status === "in_progress") {
      return <span className="badge badge-warning">In Progress</span>;
    }
    return <span className="badge badge-neutral">Created</span>;
  };

  const getMasteryStatusBadge = (status) => {
    switch (status) {
      case "Mastered":
        return <span className="badge badge-success" style={{ fontSize: "11px" }}>Mastered</span>;
      case "Strong":
        return <span className="badge badge-primary" style={{ fontSize: "11px" }}>Strong</span>;
      case "Competent":
        return <span className="badge badge-neutral" style={{ fontSize: "11px", color: "#06b6d4", borderColor: "rgba(6, 182, 212, 0.3)" }}>Competent</span>;
      case "Developing":
        return <span className="badge badge-warning" style={{ fontSize: "11px" }}>Developing</span>;
      default:
        return <span className="badge badge-danger" style={{ fontSize: "11px" }}>Weak</span>;
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === "Improving") {
      return <span style={{ color: "var(--success)", display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "12px", fontWeight: 600 }}><TrendingUp size={13} /> Improving</span>;
    }
    if (trend === "Declining") {
      return <span style={{ color: "var(--danger)", display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "12px", fontWeight: 600 }}><TrendingDown size={13} /> Declining</span>;
    }
    return <span style={{ color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "12px" }}><Minus size={13} /> Stable</span>;
  };

  const getResumeRoute = (item) => {
    const t = (item.assessment_type || "interview").toLowerCase();
    if (t === "mcq") return `/assessment/mcq/${item.id}`;
    if (t === "coding") return `/assessment/coding/${item.id}`;
    return `/interview/${item.id}`;
  };

  return (
    <div style={{ padding: "32px 0 60px" }}>
      <div className="container">
        {/* Welcome Section */}
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>
                Welcome back, {user?.full_name || user?.email?.split("@")[0]}
              </h1>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#06b6d4",
                  backgroundColor: "rgba(6, 182, 212, 0.1)",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(6, 182, 212, 0.2)",
                }}
              >
                <Sparkles size={13} /> Active Candidate
              </span>
            </div>
            <p style={{ fontSize: "14.5px" }}>
              Multi-mode AI assessment platform: Practice MCQs, solve algorithmic coding challenges, and track continual skill mastery.
            </p>
          </div>

          <Link to="/interview/start" className="btn btn-primary btn-lg">
            <Play size={18} />
            <span>Configure Assessment</span>
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid-4" style={{ marginBottom: "36px" }}>
          {/* Total Assessments */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>Total Assessments</span>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--success)" }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700 }}>
              {loading ? "-" : analytics?.total_assessments || analytics?.total_interviews || 0}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              {analytics?.completed_assessments || analytics?.completed_interviews || 0} completed
            </div>
          </div>

          {/* Average Score */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>Average Score</span>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "rgba(99, 102, 241, 0.1)", color: "var(--primary)" }}>
                <Trophy size={18} />
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700 }}>
              {loading
                ? "-"
                : (analytics?.overall_average_score ?? analytics?.average_score) > 0
                ? `${analytics.overall_average_score ?? analytics.average_score} / 10`
                : "N/A"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Across all modes
            </div>
          </div>

          {/* Best Score */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>Best Performance</span>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "rgba(245, 158, 11, 0.1)", color: "var(--warning)" }}>
                <Award size={18} />
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700 }}>
              {loading
                ? "-"
                : analytics?.best_score > 0
                ? `${analytics.best_score} / 10`
                : "N/A"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Personal high score
            </div>
          </div>

          {/* Current Skill Level */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>Assessed Skill Level</span>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "rgba(6, 182, 212, 0.1)", color: "var(--cyan-accent)" }}>
                <Target size={18} />
              </div>
            </div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "#06b6d4", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {loading ? "-" : analytics?.current_skill_level || "Intermediate"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Dynamic AI calibration
            </div>
          </div>
        </div>

        {/* Continual Skill Mastery Matrix Section */}
        {skillProfile && skillProfile.skills && skillProfile.skills.length > 0 && (
          <div className="card" style={{ marginBottom: "36px", padding: "26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Brain size={20} color="#818cf8" />
                  <h2 style={{ fontSize: "19px", fontWeight: 700, margin: 0 }}>
                    My Continual Skill Mastery Profile ({skillProfile.target_role})
                  </h2>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0" }}>
                  Continual competency weights (70% historical mastery + 30% recent performance).
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Average Mastery:</span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#06b6d4" }}>
                  {skillProfile.overall_average_mastery}%
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
              {skillProfile.skills.map((s) => (
                <div
                  key={s.id}
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    padding: "16px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-card)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontWeight: 600, fontSize: "14px" }}>{s.topic}</span>
                    {getMasteryStatusBadge(s.status)}
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: "6px", backgroundColor: "#080c14", borderRadius: "3px", overflow: "hidden", marginBottom: "10px" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${s.mastery_score}%`,
                        background: s.mastery_score >= 75 ? "linear-gradient(90deg, #10b981, #06b6d4)" : "linear-gradient(90deg, #f59e0b, #6366f1)",
                        borderRadius: "3px",
                        transition: "width 0.4s ease",
                      }}
                    ></div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <span style={{ fontWeight: 700, color: "#e2e8f0" }}>{s.mastery_score}% Mastery</span>
                    <div>{getTrendIcon(s.trend)}</div>
                    <span style={{ color: "var(--text-muted)" }}>{s.attempts} tests ({s.confidence} conf)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assessment Modes Grid Section */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Select Assessment Mode</h2>
            <p style={{ fontSize: "13.5px" }}>Practice specific evaluation formats powered by Google Gemini AI.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
            {assessmentModes.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.id}
                  onClick={() => handleStartMode(m.id)}
                  className="card card-interactive"
                  style={{
                    cursor: "pointer",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    border: "1px solid var(--border-card)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "10px", backgroundColor: `${m.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={22} color={m.color} />
                      </div>
                      <span className="badge badge-neutral" style={{ fontSize: "11px" }}>{m.badge}</span>
                    </div>

                    <h3 style={{ fontSize: "17px", fontWeight: 600, marginBottom: "6px" }}>{m.title}</h3>
                    <p style={{ fontSize: "13px", lineHeight: "1.5", color: "var(--text-muted)" }}>{m.desc}</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "20px", fontSize: "13.5px", fontWeight: 600, color: m.color }}>
                    <span>Launch Mode</span>
                    <ArrowRight size={15} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Assessments Section */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Recent Assessments & Interviews</h2>
              <p style={{ fontSize: "13.5px" }}>Review past sessions, tracked scores, and skill gap reports.</p>
            </div>
            {interviews.length > 0 && (
              <Link to="/history" style={{ fontSize: "13.5px", fontWeight: 500 }}>
                View All ({interviews.length})
              </Link>
            )}
          </div>

          {loading ? (
            <div className="card flex-center" style={{ padding: "48px" }}>
              <div className="spinner spinner-lg"></div>
            </div>
          ) : interviews.length === 0 ? (
            <div className="card flex-center" style={{ padding: "48px 24px", flexDirection: "column", textAlign: "center" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "var(--bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", color: "var(--text-muted)" }}>
                <Code size={28} />
              </div>
              <h3 style={{ fontSize: "17px", marginBottom: "6px" }}>No assessments taken yet</h3>
              <p style={{ fontSize: "13.5px", maxWidth: "380px", marginBottom: "20px" }}>
                Take your first MCQ test, coding challenge, or technical mock interview to build your AI skill profile.
              </p>
              <Link to="/interview/start" className="btn btn-primary">
                <Play size={16} />
                <span>Start First Assessment</span>
              </Link>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "rgba(255, 255, 255, 0.02)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
                      <th style={{ padding: "14px 20px" }}>Track / Role</th>
                      <th style={{ padding: "14px 20px" }}>Mode</th>
                      <th style={{ padding: "14px 20px" }}>Date</th>
                      <th style={{ padding: "14px 20px" }}>Status</th>
                      <th style={{ padding: "14px 20px" }}>Score</th>
                      <th style={{ padding: "14px 20px", textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: "13.5px" }}>
                    {interviews.slice(0, 6).map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "16px 20px", fontWeight: 600 }}>{item.role}</td>
                        <td style={{ padding: "16px 20px", textTransform: "uppercase", fontSize: "12px" }}>
                          <span className="badge badge-primary">{item.assessment_type || "interview"}</span>
                        </td>
                        <td style={{ padding: "16px 20px", color: "var(--text-muted)" }}>
                          {item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Recent"}
                        </td>
                        <td style={{ padding: "16px 20px" }}>{getStatusBadge(item.status)}</td>
                        <td style={{ padding: "16px 20px", fontWeight: 700 }}>
                          {item.score !== null ? <span style={{ color: getScoreColor(item.score) }}>{item.score} / 10</span> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                        </td>
                        <td style={{ padding: "16px 20px", textAlign: "right" }}>
                          {item.status === "completed" || item.score !== null ? (
                            <Link to={`/assessment/${item.id}/results`} className="btn btn-secondary btn-sm">View Report</Link>
                          ) : (
                            <Link to={getResumeRoute(item)} className="btn btn-primary btn-sm">Continue</Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
