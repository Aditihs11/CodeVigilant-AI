import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { assessmentAPI, answerAPI } from "../services/api";
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  LayoutDashboard,
  BarChart3,
  RotateCcw,
  Code2,
  ChevronDown,
  ChevronUp,
  Award,
  ListChecks,
  FileCode,
  Terminal,
  Lightbulb,
  Check,
  X,
  Target,
  Download,
  ShieldCheck,
  ShieldAlert,
  Calendar,
} from "lucide-react";

export default function InterviewResults() {
  const { id: assessmentId } = useParams();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      try {
        const unifiedData = await assessmentAPI.getResults(assessmentId);
        setResults(unifiedData);
      } catch {
        const legacyData = await answerAPI.getResults(assessmentId);
        setResults({
          assessment_id: legacyData.interview_id,
          role: legacyData.role,
          assessment_type: "interview",
          status: legacyData.status,
          score: legacyData.score,
          total_questions: legacyData.total_questions,
          answered_questions: legacyData.answered_questions,
          interview_answers: legacyData.answers,
          topic_performance: [],
        });
      }
    } catch (err) {
      console.error("Failed to load results:", err);
      setError(err.message || "Failed to load assessment report.");
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const toggleExpand = (id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const blobData = await assessmentAPI.downloadReport(assessmentId);
      const url = window.URL.createObjectURL(new Blob([blobData], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `CodeVigilant_Report_Assessment_${assessmentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to download PDF report. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getPerformanceBadge = (score) => {
    if (score >= 8.5) {
      return {
        label: "Exceptional / Production Ready",
        color: "#10b981",
        bg: "rgba(16, 185, 129, 0.12)",
        border: "rgba(16, 185, 129, 0.3)",
      };
    }
    if (score >= 7.0) {
      return {
        label: "Strong Technical Competency",
        color: "#06b6d4",
        bg: "rgba(6, 182, 212, 0.12)",
        border: "rgba(6, 182, 212, 0.3)",
      };
    }
    if (score >= 5.0) {
      return {
        label: "Developing / Needs Focused Review",
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.12)",
        border: "rgba(245, 158, 11, 0.3)",
      };
    }
    return {
      label: "Needs Substantial Practice",
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.12)",
      border: "rgba(239, 68, 68, 0.3)",
    };
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "75vh", flexDirection: "column", gap: "16px" }}>
        <div className="spinner spinner-lg"></div>
        <p style={{ color: "var(--text-secondary)" }}>
          Compiling comprehensive evaluation report & learning roadmap...
        </p>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="container" style={{ padding: "60px 20px", textAlign: "center" }}>
        <div className="alert alert-danger" style={{ display: "inline-flex" }}>
          {error || "Assessment results not available."}
        </div>
        <div style={{ marginTop: "20px" }}>
          <Link to="/dashboard" className="btn btn-secondary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const badge = getPerformanceBadge(results.score);
  const aType = (results.assessment_type || "interview").toLowerCase();
  const skillGap = results.skill_gap_report;
  const codingEval = results.coding_evaluation;
  const roadmap = results.learning_roadmap || [];
  const integrity = results.integrity_status || "Normal";

  return (
    <div style={{ padding: "36px 0 70px" }}>
      <div className="container" style={{ maxWidth: "980px" }}>
        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="badge badge-primary" style={{ textTransform: "uppercase" }}>
                {aType} Assessment
              </span>
              {results.difficulty && (
                <span className="badge badge-warning">{results.difficulty}</span>
              )}
              {integrity === "Normal" ? (
                <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <ShieldCheck size={12} /> Integrity Verified
                </span>
              ) : (
                <span className="badge badge-danger" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <ShieldAlert size={12} /> Integrity Warning
                </span>
              )}
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, margin: 0 }}>
              {results.role} Evaluation Report
            </h1>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="btn btn-primary btn-sm"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)" }}
            >
              {downloadingPdf ? (
                <>
                  <div className="spinner"></div>
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Download PDF Report</span>
                </>
              )}
            </button>

            <Link to="/dashboard" className="btn btn-outline btn-sm">
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Overall Score Card */}
        <div
          className="card"
          style={{
            marginBottom: "32px",
            padding: "32px",
            background:
              "radial-gradient(ellipse at 80% 20%, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 1) 70%)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "24px",
            }}
          >
            {/* Score Pill */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <div
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 0 28px rgba(99, 102, 241, 0.4)",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "28px", fontWeight: 800, lineHeight: "1" }}>
                  {results.score}
                </span>
                <span style={{ fontSize: "12px", opacity: 0.85, fontWeight: 500 }}>
                  out of 10
                </span>
              </div>

              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: badge.color,
                    backgroundColor: badge.bg,
                    border: `1px solid ${badge.border}`,
                    marginBottom: "8px",
                  }}
                >
                  <Award size={14} />
                  <span>{badge.label}</span>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px" }}>
                  Overall Assessment Score
                </h2>
                <p style={{ fontSize: "13.5px", margin: 0 }}>
                  Evaluated with Gemini AI across technical depth, correctness, and problem-solving.
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div
              style={{
                display: "flex",
                gap: "20px",
                borderLeft: "1px solid var(--border-card)",
                paddingLeft: "24px",
              }}
            >
              {aType === "mcq" && (
                <>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                      Accuracy
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--cyan-accent)" }}>
                      {results.accuracy_percentage !== undefined ? `${results.accuracy_percentage}%` : "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                      Correct
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--success)" }}>
                      {results.correct_answers || 0} / {results.total_questions}
                    </div>
                  </div>
                </>
              )}

              {aType === "coding" && codingEval && (
                <>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                      Test Cases
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--success)" }}>
                      {codingEval.test_cases_passed} / {codingEval.test_cases_total}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                      Code Quality
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--primary)" }}>
                      {codingEval.code_quality_score} / 10
                    </div>
                  </div>
                </>
              )}

              {aType === "interview" && (
                <>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                      Questions
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 700 }}>
                      {results.total_questions}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                      Answered
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--cyan-accent)" }}>
                      {results.answered_questions}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Personalized 4-Week Learning Roadmap Section */}
        {roadmap && roadmap.length > 0 && (
          <div className="card" style={{ marginBottom: "32px", padding: "26px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
                <Calendar size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                  Personalized 4-Week Technical Learning Roadmap
                </h3>
                <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                  Targeted curriculum generated from your assessment performance
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
              {roadmap.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    padding: "16px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-card)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#06b6d4" }}>
                        {step.week}
                      </span>
                      <span className="badge badge-warning" style={{ fontSize: "10.5px" }}>
                        {step.priority || "High"}
                      </span>
                    </div>
                    <h4 style={{ fontSize: "14.5px", fontWeight: 600, margin: "0 0 6px", color: "#f8fafc" }}>
                      {step.topic}
                    </h4>
                    <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4", margin: 0 }}>
                      {step.description}
                    </p>
                  </div>

                  <div style={{ marginTop: "12px", fontSize: "11px", color: "var(--text-muted)" }}>
                    Target: {step.recommended_difficulty || "Intermediate"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topic-Wise Performance Section */}
        {results.topic_performance && results.topic_performance.length > 0 && (
          <div className="card" style={{ marginBottom: "32px", padding: "24px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>
              Topic-Wise Performance Breakdown
            </h3>
            <p style={{ fontSize: "13px", marginBottom: "20px" }}>
              Accuracy and competency rating across targeted technical categories.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {results.topic_performance.map((tp, idx) => (
                <div key={idx}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                      fontSize: "13.5px",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{tp.topic}</span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: tp.accuracy_percentage >= 70 ? "var(--success)" : "var(--warning)",
                      }}
                    >
                      {tp.accuracy_percentage}% ({tp.correct_answers}/{tp.total_questions})
                    </span>
                  </div>
                  <div
                    style={{
                      height: "8px",
                      backgroundColor: "var(--bg-surface)",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${tp.accuracy_percentage}%`,
                        background:
                          tp.accuracy_percentage >= 70
                            ? "linear-gradient(90deg, #10b981, #06b6d4)"
                            : "linear-gradient(90deg, #f59e0b, #6366f1)",
                        borderRadius: "4px",
                        transition: "width 0.4s ease",
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Skill Gap Analysis Card */}
        {skillGap && (
          <div
            className="card"
            style={{
              marginBottom: "32px",
              padding: "26px",
              border: "1px solid rgba(6, 182, 212, 0.35)",
              backgroundColor: "rgba(6, 182, 212, 0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "rgba(6, 182, 212, 0.15)", color: "var(--cyan-accent)" }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                  AI Skill-Gap Analysis & Competency Matrix
                </h3>
                <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                  Personalized recommendations generated by Gemini AI
                </div>
              </div>
            </div>

            <p style={{ fontSize: "13.5px", lineHeight: "1.6", color: "#e2e8f0", marginBottom: "20px" }}>
              {skillGap.summary}
            </p>

            <div className="grid-2" style={{ gap: "16px", marginBottom: "20px" }}>
              {/* Strong Areas */}
              <div
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.05)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  borderRadius: "10px",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--success)", fontWeight: 600, fontSize: "13.5px", marginBottom: "10px" }}>
                  <CheckCircle2 size={16} />
                  <span>Demonstrated Strengths</span>
                </div>
                <ul style={{ paddingLeft: "18px", margin: 0, fontSize: "13px", color: "#cbd5e1" }}>
                  {skillGap.strong_areas && skillGap.strong_areas.map((s, i) => (
                    <li key={i} style={{ marginBottom: "4px" }}>{s}</li>
                  ))}
                </ul>
              </div>

              {/* Weak Areas / Skill Gaps */}
              <div
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.05)",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                  borderRadius: "10px",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--warning)", fontWeight: 600, fontSize: "13.5px", marginBottom: "10px" }}>
                  <AlertTriangle size={16} />
                  <span>Identified Skill Gaps</span>
                </div>
                <ul style={{ paddingLeft: "18px", margin: 0, fontSize: "13px", color: "#cbd5e1" }}>
                  {skillGap.skill_gaps && skillGap.skill_gaps.map((g, i) => (
                    <li key={i} style={{ marginBottom: "4px" }}>{g}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* MCQ Detailed Breakdown with Revealed Answers */}
        {aType === "mcq" && results.mcq_questions && (
          <div style={{ marginBottom: "36px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>
              Question-by-Question Review & Explanations
            </h3>
            <p style={{ fontSize: "13px", marginBottom: "18px" }}>
              Review correct answers, your chosen selections, and detailed rationale.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {results.mcq_questions.map((q, idx) => {
                const isExpanded = expandedCards[q.id] !== false;
                const isCorrect = q.is_correct;
                const optLetters = ["A", "B", "C", "D"];

                return (
                  <div
                    key={q.id}
                    className="card"
                    style={{
                      padding: 0,
                      overflow: "hidden",
                      border: isCorrect
                        ? "1px solid rgba(16, 185, 129, 0.4)"
                        : "1px solid rgba(239, 68, 68, 0.4)",
                    }}
                  >
                    <div
                      onClick={() => toggleExpand(q.id)}
                      style={{
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                        <div
                          style={{
                            width: "26px",
                            height: "26px",
                            borderRadius: "50%",
                            backgroundColor: isCorrect ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                            color: isCorrect ? "var(--success)" : "var(--danger)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {isCorrect ? <Check size={14} /> : <X size={14} />}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: "14.5px" }}>
                          Q{idx + 1}: {q.question_text}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span className={`badge ${isCorrect ? "badge-success" : "badge-danger"}`}>
                          {isCorrect ? "Correct (+10)" : "Incorrect (0)"}
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: "20px", borderTop: "1px solid var(--border-subtle)" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                          {q.options.map((opt, oIdx) => {
                            const isUserChoice = q.selected_option === oIdx;
                            const isCorrectChoice = q.correct_answer === oIdx;

                            let optBorder = "1px solid var(--border-card)";
                            let optBg = "var(--bg-surface)";
                            if (isCorrectChoice) {
                              optBorder = "2px solid #10b981";
                              optBg = "rgba(16, 185, 129, 0.1)";
                            } else if (isUserChoice && !isCorrectChoice) {
                              optBorder = "2px solid #ef4444";
                              optBg = "rgba(239, 68, 68, 0.1)";
                            }

                            return (
                              <div
                                key={oIdx}
                                style={{
                                  padding: "10px 14px",
                                  borderRadius: "8px",
                                  border: optBorder,
                                  backgroundColor: optBg,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  fontSize: "13.5px",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <span style={{ fontWeight: 700, color: "var(--text-muted)" }}>
                                    {optLetters[oIdx]}.
                                  </span>
                                  <span>{opt}</span>
                                </div>

                                <div style={{ display: "flex", gap: "6px" }}>
                                  {isUserChoice && (
                                    <span style={{ fontSize: "11px", fontWeight: 600, color: isCorrectChoice ? "#10b981" : "#ef4444" }}>
                                      [Your Choice]
                                    </span>
                                  )}
                                  {isCorrectChoice && (
                                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#10b981" }}>
                                      [Correct Answer]
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div
                            style={{
                              backgroundColor: "rgba(15, 23, 42, 0.8)",
                              padding: "12px 16px",
                              borderRadius: "8px",
                              border: "1px solid var(--border-card)",
                              fontSize: "13px",
                              color: "#cbd5e1",
                            }}
                          >
                            <strong style={{ color: "#06b6d4" }}>Explanation: </strong>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Coding Mode Review */}
        {aType === "coding" && codingEval && (
          <div className="card" style={{ marginBottom: "36px", padding: "24px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>
              Coding Assessment AI & Sandbox Breakdown
            </h3>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ color: "#06b6d4", fontWeight: 600, fontSize: "13.5px", marginBottom: "4px" }}>
                AI Evaluator Commentary
              </div>
              <p style={{ fontSize: "14px", lineHeight: "1.5", margin: 0 }}>
                {codingEval.feedback}
              </p>
            </div>

            <div className="grid-2" style={{ gap: "16px" }}>
              <div style={{ backgroundColor: "rgba(16, 185, 129, 0.05)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                <div style={{ color: "var(--success)", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                  Code Strengths
                </div>
                <ul style={{ paddingLeft: "18px", margin: 0, fontSize: "12.5px", color: "#cbd5e1" }}>
                  {codingEval.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>

              <div style={{ backgroundColor: "rgba(245, 158, 11, 0.05)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                <div style={{ color: "var(--warning)", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>
                  Optimization Areas
                </div>
                <ul style={{ paddingLeft: "18px", margin: 0, fontSize: "12.5px", color: "#cbd5e1" }}>
                  {codingEval.improvements?.map((imp, i) => <li key={i}>{imp}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* AI Interview Question-by-Question Review */}
        {aType === "interview" && results.interview_answers && (
          <div style={{ marginBottom: "36px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>
              Interview Responses & AI Scoring
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {results.interview_answers.map((a, idx) => (
                <div key={a.id || idx} className="card" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontWeight: 600, fontSize: "15px" }}>Question {idx + 1}</span>
                    <span className="badge badge-success" style={{ fontWeight: 700 }}>
                      {a.score} / 10
                    </span>
                  </div>
                  <div style={{ backgroundColor: "#080c14", padding: "12px", borderRadius: "6px", fontSize: "13px", fontFamily: "var(--font-mono)", marginBottom: "12px" }}>
                    {a.answer_text}
                  </div>
                  <div style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: "1.4" }}>
                    <strong>Feedback:</strong> {a.feedback}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            paddingTop: "24px",
            borderTop: "1px solid var(--border-card)",
          }}
        >
          <Link to="/dashboard" className="btn btn-outline">
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>

          <div style={{ display: "flex", gap: "12px" }}>
            <Link to="/interview/start" className="btn btn-secondary">
              <RotateCcw size={16} />
              <span>Practice Another Track</span>
            </Link>
            <Link to="/analytics" className="btn btn-primary">
              <BarChart3 size={16} />
              <span>View Analytics</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
