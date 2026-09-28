import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { assessmentAPI, interviewAPI } from "../services/api";
import {
  BarChart3,
  TrendingUp,
  Trophy,
  CheckCircle2,
  Brain,
  Sparkles,
  AlertCircle,
  Play,
  ArrowRight,
  Layers,
  Lightbulb,
  ListChecks,
  FileCode,
  Terminal,
  Target,
  Award,
} from "lucide-react";

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const data = await assessmentAPI.getAnalytics().catch(() => interviewAPI.getAnalytics());
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
        setError("Failed to load performance analytics.");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div
        className="flex-center"
        style={{ minHeight: "75vh", flexDirection: "column", gap: "16px" }}
      >
        <div className="spinner spinner-lg"></div>
        <p style={{ color: "var(--text-secondary)" }}>
          Compiling multi-mode candidate metrics & AI skill-gap data...
        </p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="container" style={{ padding: "60px 20px", textAlign: "center" }}>
        <div className="alert alert-danger" style={{ display: "inline-flex" }}>
          <AlertCircle size={16} />
          <span>{error || "Analytics unavailable."}</span>
        </div>
      </div>
    );
  }

  const scoreHistory = analytics.score_history || [];
  const topicPerformance = analytics.topic_performance || [];
  const modeBreakdown = analytics.mode_breakdown || {};

  // Calculate SVG chart coordinates for Score Over Time
  const chartHeight = 200;
  const chartWidth = 640;
  const padding = 40;

  const points = scoreHistory.map((item, index) => {
    const x =
      scoreHistory.length === 1
        ? chartWidth / 2
        : padding + (index / (scoreHistory.length - 1)) * (chartWidth - padding * 2);
    const y =
      chartHeight -
      padding -
      ((item.score || 0) / 10) * (chartHeight - padding * 2);
    return { x, y, score: item.score, role: item.role, date: item.date, mode: item.assessment_type };
  });

  const pathD =
    points.length > 0
      ? `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`
      : "";

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x},${chartHeight - padding} L ${points[0].x},${
          chartHeight - padding
        } Z`
      : "";

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
              <span className="badge badge-primary">Skill Intelligence</span>
              {analytics.current_skill_level && (
                <span className="badge badge-warning">{analytics.current_skill_level}</span>
              )}
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 4px" }}>
              Multi-Mode Performance Analytics
            </h1>
            <p style={{ fontSize: "14px" }}>
              Holistic technical evaluation tracking across MCQs, Algorithmic Coding, and Mock Interviews.
            </p>
          </div>

          <Link to="/interview/start" className="btn btn-primary">
            <Play size={16} />
            <span>Start Assessment</span>
          </Link>
        </div>

        {/* 4 Multi-Mode KPI Cards */}
        <div className="grid-4" style={{ marginBottom: "32px" }}>
          {/* Overall Average */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>
                Overall Score
              </span>
              <div style={{ padding: "6px", borderRadius: "6px", backgroundColor: "rgba(99, 102, 241, 0.1)", color: "var(--primary)" }}>
                <Trophy size={16} />
              </div>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 700 }}>
              {(analytics.overall_average_score ?? analytics.average_score) > 0
                ? `${analytics.overall_average_score ?? analytics.average_score} / 10`
                : "N/A"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              {analytics.completed_assessments || analytics.completed_interviews || 0} sessions
            </div>
          </div>

          {/* MCQ Score */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>
                MCQ Average
              </span>
              <div style={{ padding: "6px", borderRadius: "6px", backgroundColor: "rgba(6, 182, 212, 0.1)", color: "var(--cyan-accent)" }}>
                <ListChecks size={16} />
              </div>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--cyan-accent)" }}>
              {modeBreakdown.mcq?.average_score > 0
                ? `${modeBreakdown.mcq.average_score} / 10`
                : "N/A"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              {modeBreakdown.mcq?.count || 0} MCQ tests
            </div>
          </div>

          {/* Coding Score */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>
                Coding Score
              </span>
              <div style={{ padding: "6px", borderRadius: "6px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--success)" }}>
                <FileCode size={16} />
              </div>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--success)" }}>
              {modeBreakdown.coding?.average_score > 0
                ? `${modeBreakdown.coding.average_score} / 10`
                : "N/A"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              {modeBreakdown.coding?.count || 0} challenges
            </div>
          </div>

          {/* Interview Score */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>
                Mock Interview
              </span>
              <div style={{ padding: "6px", borderRadius: "6px", backgroundColor: "rgba(245, 158, 11, 0.1)", color: "var(--warning)" }}>
                <Terminal size={16} />
              </div>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--warning)" }}>
              {modeBreakdown.interview?.average_score > 0
                ? `${modeBreakdown.interview.average_score} / 10`
                : "N/A"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              {modeBreakdown.interview?.count || 0} interviews
            </div>
          </div>
        </div>

        {/* Charts & Breakdown Grid */}
        <div className="grid-2" style={{ gap: "24px", marginBottom: "32px" }}>
          {/* Progression Chart */}
          <div className="card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 600, marginBottom: "4px" }}>
              Score Progression Timeline
            </h2>
            <p style={{ fontSize: "12.5px", marginBottom: "16px" }}>
              Performance trajectory over sequential assessments.
            </p>

            {scoreHistory.length === 0 ? (
              <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                Complete an assessment to view score trends.
              </div>
            ) : (
              <div style={{ width: "100%", overflowX: "auto" }}>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: "100%", height: "220px", overflow: "visible" }}>
                  <defs>
                    <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {[0, 2.5, 5, 7.5, 10].map((val) => {
                    const y = chartHeight - padding - (val / 10) * (chartHeight - padding * 2);
                    return (
                      <g key={val}>
                        <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#1e293b" strokeDasharray="4" />
                        <text x={padding - 8} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {areaD && <path d={areaD} fill="url(#analyticsGradient)" />}
                  {pathD && <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />}

                  {points.map((p, idx) => (
                    <g key={idx}>
                      <circle cx={p.x} cy={p.y} r="5" fill="#06b6d4" stroke="#0f172a" strokeWidth="2" />
                      <text x={p.x} y={p.y - 10} fill="#ffffff" fontSize="11" fontWeight="600" textAnchor="middle" fontFamily="var(--font-mono)">
                        {p.score}
                      </text>
                      <text x={p.x} y={chartHeight - 12} fill="#94a3b8" fontSize="10" textAnchor="middle">
                        {p.date}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            )}
          </div>

          {/* Topic-Wise Competency */}
          <div className="card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 600, marginBottom: "4px" }}>
              Topic-Wise Competency Analysis
            </h2>
            <p style={{ fontSize: "12.5px", marginBottom: "16px" }}>
              Aggregated technical depth across specific language & CS topics.
            </p>

            {topicPerformance.length === 0 ? (
              <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                Topic data will appear after submitting assessments.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "240px", overflowY: "auto" }}>
                {topicPerformance.map((tp, idx) => (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px" }}>
                      <span style={{ fontWeight: 600 }}>{tp.topic}</span>
                      <span style={{ fontWeight: 700, color: tp.average_score >= 7 ? "var(--success)" : "var(--warning)" }}>
                        {tp.average_score} / 10 ({tp.total_questions} Qs)
                      </span>
                    </div>
                    <div style={{ height: "7px", backgroundColor: "var(--bg-surface)", borderRadius: "4px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${tp.accuracy_percentage}%`,
                          background: tp.average_score >= 7 ? "linear-gradient(90deg, #10b981, #06b6d4)" : "linear-gradient(90deg, #f59e0b, #6366f1)",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Skill-Gap Recommendations Banner */}
        <div
          className="card"
          style={{
            padding: "24px",
            border: "1px solid rgba(6, 182, 212, 0.3)",
            backgroundColor: "rgba(6, 182, 212, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div style={{ padding: "10px", borderRadius: "10px", backgroundColor: "rgba(6, 182, 212, 0.15)", color: "var(--cyan-accent)" }}>
              <Lightbulb size={24} />
            </div>

            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 600, marginBottom: "6px" }}>
                AI Learning & Practice Recommendation
              </h3>
              <p style={{ fontSize: "13.5px", lineHeight: "1.5", marginBottom: "14px" }}>
                To increase your readiness for senior engineering roles, practice <strong>MCQ assessments</strong> to lock down language edge cases, and solve <strong>Coding Challenges</strong> focused on tree/graph traversals and concurrency.
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <Link to="/interview/start" state={{ mode: "coding" }} className="btn btn-secondary btn-sm">
                  Practice Coding Challenge
                </Link>
                <Link to="/interview/start" state={{ mode: "mcq" }} className="btn btn-outline btn-sm">
                  Take MCQ Assessment
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
