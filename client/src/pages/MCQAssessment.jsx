import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { assessmentAPI } from "../services/api";
import {
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Send,
  Layers,
  BookOpen,
  ShieldAlert,
} from "lucide-react";

export default function MCQAssessment() {
  const { id: assessmentId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [integrityWarning, setIntegrityWarning] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);

  const loadMCQRoom = useCallback(async () => {
    try {
      setLoading(true);
      let qs = await assessmentAPI.getQuestions(assessmentId);

      if (!qs || qs.length === 0) {
        qs = await assessmentAPI.generateMCQs(assessmentId);
      }
      setQuestions(qs);

      // Initialize persistent countdown timer if set
      if (qs && qs.length > 0 && qs[0].remaining_seconds !== undefined && qs[0].remaining_seconds !== null) {
        setRemainingSeconds(qs[0].remaining_seconds);
      } else {
        // Default 15 minutes timer for MCQ
        setRemainingSeconds(15 * 60);
      }
    } catch (err) {
      console.error("Failed to load MCQ assessment:", err);
      setError(err.message || "Failed to load MCQ questions.");
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    loadMCQRoom();
  }, [loadMCQRoom]);

  // Anti-Cheating Event Listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIntegrityWarning(true);
        assessmentAPI.recordIntegrityEvent(assessmentId, {
          event_type: "tab_switch",
          details: "Candidate switched away from assessment tab",
        }).catch(() => {});
      }
    };

    const handleWindowBlur = () => {
      assessmentAPI.recordIntegrityEvent(assessmentId, {
        event_type: "window_blur",
        details: "Candidate clicked outside assessment window",
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
    if (submitting) return;
    try {
      setSubmitting(true);
      const answersPayload = questions.map((q) => ({
        question_id: q.id,
        selected_option: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1,
      }));
      await assessmentAPI.submitMCQ(assessmentId, { answers: answersPayload });
      navigate(`/assessment/${assessmentId}/results`);
    } catch (err) {
      console.error("Auto submit failed:", err);
    }
  };

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const isFinalQuestion = currentIndex === totalQuestions - 1;

  const handleSelectOption = (optionIndex) => {
    if (!currentQ) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  const handleSubmitAssessment = async () => {
    if (answeredCount < totalQuestions) {
      const confirmSubmit = window.confirm(
        `You have answered ${answeredCount} of ${totalQuestions} questions. Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const answersPayload = questions.map((q) => ({
        question_id: q.id,
        selected_option: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1,
      }));

      await assessmentAPI.submitMCQ(assessmentId, { answers: answersPayload });
      navigate(`/assessment/${assessmentId}/results`);
    } catch (err) {
      console.error("MCQ submission failed:", err);
      setError(err.message || "Failed to submit assessment.");
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
        <p style={{ color: "var(--text-secondary)" }}>Loading MCQ Assessment questions...</p>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="container" style={{ padding: "40px 20px", textAlign: "center" }}>
        <div className="alert alert-danger" style={{ display: "inline-flex" }}>
          <AlertCircle size={16} />
          <span>No MCQ questions found for this assessment session.</span>
        </div>
      </div>
    );
  }

  const optionLetters = ["A", "B", "C", "D"];

  return (
    <div style={{ padding: "28px 0 60px" }}>
      <div className="container" style={{ maxWidth: "860px" }}>
        {/* Top Bar with Timer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="badge badge-primary">MCQ Assessment</span>
            {currentQ.topic && <span className="badge badge-neutral">{currentQ.topic}</span>}
            {currentQ.difficulty && <span className="badge badge-warning">{currentQ.difficulty}</span>}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Visible Countdown Timer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "8px",
                backgroundColor: remainingSeconds && remainingSeconds < 120 ? "rgba(239, 68, 68, 0.15)" : "var(--bg-surface)",
                border: remainingSeconds && remainingSeconds < 120 ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid var(--border-card)",
                color: remainingSeconds && remainingSeconds < 120 ? "#ef4444" : "#f8fafc",
                fontWeight: 700,
                fontSize: "14px",
                fontFamily: "var(--font-mono)",
              }}
            >
              <Clock size={16} color={remainingSeconds && remainingSeconds < 120 ? "#ef4444" : "#06b6d4"} />
              <span>{formatTime(remainingSeconds)}</span>
            </div>

            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>
              Q {currentIndex + 1} of {totalQuestions}
            </span>
          </div>
        </div>

        {integrityWarning && (
          <div
            className="alert alert-warning"
            style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldAlert size={16} />
              <span>Integrity Notice: Tab switches and focus changes are recorded.</span>
            </div>
            <button onClick={() => setIntegrityWarning(false)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>
              ✕
            </button>
          </div>
        )}

        {/* Progress Bar */}
        <div
          style={{
            height: "6px",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "3px",
            overflow: "hidden",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #6366f1, #06b6d4)",
              transition: "width 0.3s ease",
            }}
          ></div>
        </div>

        {/* Question Stepper Buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "24px",
            overflowX: "auto",
            paddingBottom: "4px",
          }}
        >
          {questions.map((q, idx) => {
            const isAnswered = selectedAnswers[q.id] !== undefined;
            const isCurrent = currentIndex === idx;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  border: isCurrent
                    ? "2px solid #6366f1"
                    : isAnswered
                    ? "1px solid rgba(16, 185, 129, 0.5)"
                    : "1px solid var(--border-card)",
                  backgroundColor: isCurrent
                    ? "rgba(99, 102, 241, 0.2)"
                    : isAnswered
                    ? "rgba(16, 185, 129, 0.12)"
                    : "var(--bg-surface)",
                  color: isCurrent
                    ? "#ffffff"
                    : isAnswered
                    ? "var(--success)"
                    : "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Question Card */}
        <div
          className="card"
          style={{
            marginBottom: "24px",
            padding: "28px",
            borderLeft: "4px solid #6366f1",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-muted)",
              marginBottom: "8px",
            }}
          >
            Question {currentIndex + 1}
          </div>
          <h2
            style={{
              fontSize: "18px",
              lineHeight: "1.5",
              fontWeight: 600,
              color: "#f8fafc",
            }}
          >
            {currentQ.question_text}
          </h2>
        </div>

        {/* Options List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
          {currentQ.options &&
            currentQ.options.map((optionText, optIdx) => {
              const isSelected = selectedAnswers[currentQ.id] === optIdx;
              return (
                <div
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  style={{
                    padding: "16px 20px",
                    borderRadius: "10px",
                    border: isSelected
                      ? "2px solid #6366f1"
                      : "1px solid var(--border-card)",
                    backgroundColor: isSelected
                      ? "rgba(99, 102, 241, 0.12)"
                      : "var(--bg-surface)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      border: isSelected
                        ? "2px solid #6366f1"
                        : "2px solid var(--border-card)",
                      backgroundColor: isSelected ? "#6366f1" : "transparent",
                      color: isSelected ? "#ffffff" : "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {optionLetters[optIdx]}
                  </div>

                  <span
                    style={{
                      fontSize: "14.5px",
                      color: isSelected ? "#ffffff" : "var(--text-primary)",
                      fontWeight: isSelected ? 500 : 400,
                      lineHeight: "1.4",
                    }}
                  >
                    {optionText}
                  </span>
                </div>
              );
            })}
        </div>

        {/* Submitting Overlay */}
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
              marginBottom: "20px",
            }}
          >
            <div className="spinner"></div>
            <span style={{ fontSize: "13.5px", color: "#818cf8" }}>
              Evaluating MCQ answers & generating topic performance analysis...
            </span>
          </div>
        )}

        {/* Navigation Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0 || submitting}
            className="btn btn-outline"
          >
            <ArrowLeft size={16} />
            <span>Previous</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {isFinalQuestion ? (
              <button
                onClick={handleSubmitAssessment}
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  padding: "10px 22px",
                }}
              >
                <Send size={16} />
                <span>Submit Assessment</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                disabled={submitting}
                className="btn btn-primary"
              >
                <span>Next</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
