import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { assessmentAPI } from "../services/api";
import {
  Code2,
  Terminal,
  Play,
  Send,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  FileCode,
  Layers,
  Clock,
  ShieldAlert,
} from "lucide-react";

export default function CodingAssessment() {
  const { id: assessmentId } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [activeTab, setActiveTab] = useState("problem");
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [integrityWarning, setIntegrityWarning] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);

  const loadCodingRoom = useCallback(async () => {
    try {
      setLoading(true);
      let res = await assessmentAPI.getQuestions(assessmentId);

      if (!res || res.length === 0) {
        const genRes = await assessmentAPI.generateCoding(assessmentId);
        setProblem(genRes);
        setCode(genRes.starter_code || "# Write your solution function here\n");
      } else {
        const prob = res[0];
        setProblem(prob);
        setCode(prob.starter_code || "# Write your solution function here\n");
        if (prob.remaining_seconds !== undefined && prob.remaining_seconds !== null) {
          setRemainingSeconds(prob.remaining_seconds);
        } else {
          setRemainingSeconds(30 * 60); // 30 minutes default
        }
      }
    } catch (err) {
      console.error("Failed to load coding challenge:", err);
      setError(err.message || "Failed to load coding challenge.");
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    loadCodingRoom();
  }, [loadCodingRoom]);

  // Anti-Cheating Event Listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIntegrityWarning(true);
        assessmentAPI.recordIntegrityEvent(assessmentId, {
          event_type: "tab_switch",
          details: "Candidate navigated away from code editor tab",
        }).catch(() => {});
      }
    };

    const handleWindowBlur = () => {
      assessmentAPI.recordIntegrityEvent(assessmentId, {
        event_type: "window_blur",
        details: "Candidate clicked outside editor window",
      }).catch(() => {});
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [assessmentId]);

  // Countdown Timer
  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [remainingSeconds]);

  const handleAutoSubmit = async () => {
    if (submitting || !problem) return;
    try {
      setSubmitting(true);
      await assessmentAPI.submitCode(assessmentId, {
        question_id: problem.id,
        code,
        language,
      });
      navigate(`/assessment/${assessmentId}/results`);
    } catch (err) {
      console.error("Auto submit code failed:", err);
    }
  };

  const handleSubmitCode = async () => {
    if (!code.trim()) {
      setError("Please implement a solution before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await assessmentAPI.submitCode(assessmentId, {
        question_id: problem.id,
        code,
        language,
      });

      navigate(`/assessment/${assessmentId}/results`);
    } catch (err) {
      console.error("Code submission failed:", err);
      setError(err.message || "Failed to evaluate code submission.");
      setSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    if (secs === null) return "--:--";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "75vh", flexDirection: "column", gap: "16px" }}>
        <div className="spinner spinner-lg"></div>
        <p style={{ color: "var(--text-secondary)" }}>
          Generating algorithmic challenge with Gemini AI...
        </p>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="container" style={{ padding: "40px 20px", textAlign: "center" }}>
        <div className="alert alert-danger" style={{ display: "inline-flex" }}>
          <AlertCircle size={16} />
          <span>No coding problem found for this session.</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 0 60px" }}>
      <div className="container" style={{ maxWidth: "1280px" }}>
        {/* Top Bar with Timer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "rgba(99, 102, 241, 0.15)",
                color: "#818cf8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Code2 size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
                {problem.title || "Coding Challenge"}
              </h1>
              <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                <span className="badge badge-primary">Coding Mode</span>
                {problem.difficulty && <span className="badge badge-warning">{problem.difficulty}</span>}
                {problem.topic && <span className="badge badge-neutral">{problem.topic}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Timer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "8px",
                backgroundColor: remainingSeconds && remainingSeconds < 180 ? "rgba(239, 68, 68, 0.15)" : "var(--bg-surface)",
                border: remainingSeconds && remainingSeconds < 180 ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid var(--border-card)",
                color: remainingSeconds && remainingSeconds < 180 ? "#ef4444" : "#f8fafc",
                fontWeight: 700,
                fontSize: "14px",
                fontFamily: "var(--font-mono)",
              }}
            >
              <Clock size={16} color={remainingSeconds && remainingSeconds < 180 ? "#ef4444" : "#10b981"} />
              <span>{formatTime(remainingSeconds)}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <label htmlFor="lang-select" style={{ fontSize: "13px", margin: 0 }}>
                Language:
              </label>
              <select
                id="lang-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ width: "auto", padding: "6px 12px", fontSize: "13px" }}
              >
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript (ES6)</option>
                <option value="java">Java 17</option>
              </select>
            </div>

            <button
              onClick={handleSubmitCode}
              disabled={submitting || !code.trim()}
              className="btn btn-primary"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                padding: "8px 18px",
              }}
            >
              {submitting ? (
                <>
                  <div className="spinner"></div>
                  <span>Running & Evaluating...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Run & Submit Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {integrityWarning && (
          <div
            className="alert alert-warning"
            style={{ marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldAlert size={16} />
              <span>Integrity Notice: Screen focus and tab switches are logged for this assessment session.</span>
            </div>
            <button onClick={() => setIntegrityWarning(false)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "16px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* 2-Column Split Workspace */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.2fr",
            gap: "20px",
            minHeight: "560px",
          }}
        >
          {/* Left Panel: Problem Specifications */}
          <div
            className="card"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              maxHeight: "700px",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "8px",
                borderBottom: "1px solid var(--border-card)",
                paddingBottom: "12px",
                marginBottom: "20px",
              }}
            >
              <button
                onClick={() => setActiveTab("problem")}
                className={`btn btn-sm ${activeTab === "problem" ? "btn-primary" : "btn-outline"}`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab("examples")}
                className={`btn btn-sm ${activeTab === "examples" ? "btn-primary" : "btn-outline"}`}
              >
                Examples ({problem.examples?.length || 0})
              </button>
            </div>

            {activeTab === "problem" && (
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>
                  Problem Statement
                </h3>
                <p style={{ fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap", marginBottom: "20px", color: "#e2e8f0" }}>
                  {problem.description}
                </p>

                {problem.input_format && (
                  <div style={{ marginBottom: "16px" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>
                      Input Format
                    </h4>
                    <p style={{ fontSize: "13.5px", color: "#cbd5e1" }}>{problem.input_format}</p>
                  </div>
                )}

                {problem.output_format && (
                  <div style={{ marginBottom: "16px" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>
                      Output Format
                    </h4>
                    <p style={{ fontSize: "13.5px", color: "#cbd5e1" }}>{problem.output_format}</p>
                  </div>
                )}

                {problem.constraints && (
                  <div style={{ marginBottom: "16px" }}>
                    <h4 style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>
                      Constraints
                    </h4>
                    <pre
                      style={{
                        backgroundColor: "#080c14",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-card)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "12.5px",
                        color: "#94a3b8",
                      }}
                    >
                      {problem.constraints}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === "examples" && (
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
                  Sample Examples
                </h3>
                {problem.examples && problem.examples.length > 0 ? (
                  problem.examples.map((ex, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: "#080c14",
                        padding: "14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-card)",
                        marginBottom: "14px",
                        fontSize: "13px",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "#818cf8", marginBottom: "6px" }}>
                        Example {i + 1}:
                      </div>
                      <div style={{ marginBottom: "4px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Input: </span>
                        <code style={{ color: "#06b6d4" }}>{ex.input}</code>
                      </div>
                      <div style={{ marginBottom: "4px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Output: </span>
                        <code style={{ color: "var(--success)" }}>{ex.output}</code>
                      </div>
                      {ex.explanation && (
                        <div style={{ marginTop: "6px", color: "var(--text-secondary)", fontSize: "12.5px" }}>
                          <em>Explanation:</em> {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: "13.5px", color: "var(--text-muted)" }}>
                    No explicit examples provided.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Panel: Code Editor */}
          <div
            className="card"
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13.5px", fontWeight: 600 }}>
                <Terminal size={16} color="#06b6d4" />
                <span>Solution Implementation</span>
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Tab indentation enabled
              </span>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="# Write your clean algorithmic solution..."
              rows={22}
              style={{
                flex: 1,
                fontFamily: "var(--font-mono)",
                fontSize: "13.5px",
                lineHeight: "1.6",
                padding: "16px",
                backgroundColor: "#050810",
                border: "1px solid var(--border-card)",
                borderRadius: "8px",
                color: "#f8fafc",
                resize: "none",
              }}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const start = e.target.selectionStart;
                  const end = e.target.selectionEnd;
                  setCode(code.substring(0, start) + "    " + code.substring(end));
                  setTimeout(() => {
                    e.target.selectionStart = e.target.selectionEnd = start + 4;
                  }, 0);
                }
              }}
            />

            {submitting && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  backgroundColor: "rgba(99, 102, 241, 0.1)",
                  borderRadius: "8px",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  marginTop: "16px",
                }}
              >
                <div className="spinner"></div>
                <span style={{ fontSize: "13.5px", color: "#818cf8" }}>
                  Executing solution in isolated sandbox harness and evaluating Big-O complexity with Gemini...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
