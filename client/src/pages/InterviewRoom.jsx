import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { interviewAPI, questionAPI, answerAPI } from "../services/api";
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Save,
  Send,
  Code2,
  FileText,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PlayCircle,
} from "lucide-react";

export default function InterviewRoom() {
  const { id: interviewId } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answersMap, setAnswersMap] = useState({}); // { [questionId]: answerText }
  const [evaluatedMap, setEvaluatedMap] = useState({}); // { [questionId]: answerResponse }
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [savingStatus, setSavingStatus] = useState("");
  const [error, setError] = useState(null);

  // Voice STT & TTS State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speakingQuestion, setSpeakingQuestion] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpeechSupported(false);
    }
  }, []);

  // Load Interview, Questions, and Existing Answers
  const loadInterviewRoom = useCallback(async () => {
    try {
      setLoading(true);
      const [interviewData, questionsData, existingAnswers] = await Promise.all([
        interviewAPI.getById(interviewId),
        questionAPI.getByInterview(interviewId),
        answerAPI.getByInterview(interviewId),
      ]);

      // If no questions exist yet, generate them
      let finalQuestions = questionsData;
      if (!questionsData || questionsData.length === 0) {
        finalQuestions = await questionAPI.generate(interviewId);
      }

      setInterview(interviewData);
      setQuestions(finalQuestions);

      // Hydrate answers map and evaluated map
      const initialAnswers = {};
      const initialEvaluated = {};
      if (existingAnswers && existingAnswers.length > 0) {
        existingAnswers.forEach((ans) => {
          initialAnswers[ans.question_id] = ans.answer_text;
          initialEvaluated[ans.question_id] = ans;
        });
      }
      setAnswersMap(initialAnswers);
      setEvaluatedMap(initialEvaluated);

      // Set current index to first unanswered question if any
      if (finalQuestions && finalQuestions.length > 0) {
        const firstUnansweredIndex = finalQuestions.findIndex(
          (q) => !initialEvaluated[q.id]
        );
        if (firstUnansweredIndex !== -1) {
          setCurrentIndex(firstUnansweredIndex);
        }
      }
    } catch (err) {
      console.error("Failed to load interview room:", err);
      setError(err.message || "Failed to load interview session.");
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    loadInterviewRoom();
  }, [loadInterviewRoom]);

  const currentQuestion = questions[currentIndex];
  const currentAnswerText = currentQuestion ? (answersMap[currentQuestion.id] || "") : "";
  const currentEvaluated = currentQuestion ? evaluatedMap[currentQuestion.id] : null;

  const handleAnswerChange = (val) => {
    if (!currentQuestion) return;
    setAnswersMap((prev) => ({
      ...prev,
      [currentQuestion.id]: val,
    }));
  };

  // Voice STT Microphone Toggle
  const toggleSpeechRecognition = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setError("Speech recognition is not supported in this browser. Please type your response.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      try {
        setError(null);
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => setIsListening(true);
        recognition.onerror = (e) => {
          console.error("Speech recognition error:", e);
          setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript + " ";
          }
          if (currentQuestion && transcript.trim()) {
            setAnswersMap((prev) => ({
              ...prev,
              [currentQuestion.id]: transcript.trim(),
            }));
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error("Speech start error:", err);
        setIsListening(false);
      }
    }
  };

  // Voice TTS Question Readout
  const handleSpeakQuestion = () => {
    if (!("speechSynthesis" in window)) {
      setError("Text-to-speech is not supported in this browser.");
      return;
    }
    if (speakingQuestion) {
      window.speechSynthesis.cancel();
      setSpeakingQuestion(false);
      return;
    }
    if (!currentQuestion) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentQuestion.question_text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingQuestion(false);
    utterance.onerror = () => setSpeakingQuestion(false);

    setSpeakingQuestion(true);
    window.speechSynthesis.speak(utterance);
  };

  // Submit Answer to Gemini AI
  const handleSubmitCurrentAnswer = async (moveToNext = false) => {
    if (!currentQuestion) return;
    const text = (answersMap[currentQuestion.id] || "").trim();

    if (!text) {
      setError("Please write an answer before submitting for evaluation.");
      return;
    }

    try {
      setError(null);
      setEvaluating(true);
      setSavingStatus("Evaluating answer with Gemini AI...");

      const evaluatedAnswer = await answerAPI.submit(interviewId, {
        question_id: currentQuestion.id,
        answer_text: text,
      });

      // Update maps
      setEvaluatedMap((prev) => ({
        ...prev,
        [currentQuestion.id]: evaluatedAnswer,
      }));

      setSavingStatus("Answer evaluated & saved!");
      setTimeout(() => setSavingStatus(""), 2000);

      if (moveToNext) {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          // Final question completed -> go to results
          navigate(`/interview/${interviewId}/results`);
        }
      }
    } catch (err) {
      console.error("Evaluation failed:", err);
      setError(err.message || "Failed to submit answer for AI evaluation.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleFinishInterview = async () => {
    // If current question has text but not evaluated yet, evaluate first
    const text = (answersMap[currentQuestion?.id] || "").trim();
    if (text && (!currentEvaluated || currentEvaluated.answer_text !== text)) {
      await handleSubmitCurrentAnswer(true);
    } else {
      navigate(`/interview/${interviewId}/results`);
    }
  };

  if (loading) {
    return (
      <div
        className="flex-center"
        style={{ minHeight: "75vh", flexDirection: "column", gap: "16px" }}
      >
        <div className="spinner spinner-lg"></div>
        <p style={{ color: "var(--text-secondary)" }}>Loading interview session...</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="container" style={{ padding: "40px 20px", textAlign: "center" }}>
        <div className="alert alert-danger" style={{ display: "inline-flex" }}>
          <AlertCircle size={16} />
          <span>No questions available for this interview.</span>
        </div>
      </div>
    );
  }

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(evaluatedMap).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);
  const isFinalQuestion = currentIndex === totalQuestions - 1;

  return (
    <div style={{ padding: "28px 0 60px" }}>
      <div className="container" style={{ maxWidth: "1000px" }}>
        {/* Top Header Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="badge badge-primary">{interview?.role}</span>
              <span className="badge badge-neutral">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {savingStatus && (
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--success)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <CheckCircle2 size={14} /> {savingStatus}
              </span>
            )}
            <Link
              to={`/interview/${interviewId}/replay`}
              className="btn btn-outline btn-sm"
              style={{ borderColor: "var(--border-card)" }}
            >
              <PlayCircle size={14} color="#818cf8" />
              <span>Timeline Replay</span>
            </Link>
            <button
              onClick={handleFinishInterview}
              className="btn btn-outline btn-sm"
              style={{ borderColor: "var(--border-card)" }}
            >
              View Results Summary
            </button>
          </div>
        </div>

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
              width: `${progressPercent}%`,
              backgroundColor: "var(--primary)",
              background: "linear-gradient(90deg, #6366f1, #06b6d4)",
              transition: "width 0.3s ease",
            }}
          ></div>
        </div>

        {/* Question Navigation Tabs */}
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
            const isEvaluated = !!evaluatedMap[q.id];
            const isCurrent = currentIndex === idx;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  border: isCurrent
                    ? "2px solid #6366f1"
                    : isEvaluated
                    ? "1px solid rgba(16, 185, 129, 0.4)"
                    : "1px solid var(--border-card)",
                  backgroundColor: isCurrent
                    ? "rgba(99, 102, 241, 0.15)"
                    : isEvaluated
                    ? "rgba(16, 185, 129, 0.08)"
                    : "var(--bg-surface)",
                  color: isCurrent
                    ? "#ffffff"
                    : isEvaluated
                    ? "var(--success)"
                    : "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                {isEvaluated && <CheckCircle2 size={13} color="var(--success)" />}
                <span>Question {idx + 1}</span>
                {isEvaluated && evaluatedMap[q.id]?.score !== null && (
                  <span
                    style={{
                      fontSize: "11px",
                      opacity: 0.85,
                      marginLeft: "2px",
                    }}
                  >
                    ({evaluatedMap[q.id].score}/10)
                  </span>
                )}
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

        {/* Question Display Card */}
        <div
          className="card"
          style={{
            marginBottom: "24px",
            padding: "24px",
            borderLeft: "4px solid #6366f1",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--text-muted)",
                fontSize: "12.5px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 600,
              }}
            >
              <Code2 size={16} color="#818cf8" />
              <span>Technical Prompt</span>
            </div>

            {/* Voice TTS Button */}
            <button
              onClick={handleSpeakQuestion}
              className="btn btn-xs btn-outline"
              title="Text-to-speech audio readout"
              style={{ padding: "4px 10px", fontSize: "12px" }}
            >
              {speakingQuestion ? <VolumeX size={14} color="#ef4444" /> : <Volume2 size={14} color="#06b6d4" />}
              <span>{speakingQuestion ? "Stop Audio" : "Read Aloud"}</span>
            </button>
          </div>
          <h2
            style={{
              fontSize: "18px",
              lineHeight: "1.5",
              fontWeight: 600,
              color: "#f8fafc",
            }}
          >
            {currentQuestion.question_text}
          </h2>
        </div>

        {/* Answer Box & Live Feedback */}
        <div className="card" style={{ marginBottom: "24px", padding: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label
                htmlFor="answerText"
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Your Response
              </label>

              {/* Voice STT Microphone Toggle */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`btn btn-xs ${isListening ? "btn-primary" : "btn-outline"}`}
                style={{
                  padding: "4px 10px",
                  fontSize: "12px",
                  backgroundColor: isListening ? "#ef4444" : "transparent",
                  borderColor: isListening ? "#ef4444" : "var(--border-card)",
                }}
                title={speechSupported ? "Speak via microphone" : "Voice dictation not supported"}
              >
                {isListening ? <MicOff size={13} /> : <Mic size={13} color="#06b6d4" />}
                <span>{isListening ? "Stop Mic" : "Voice Dictate"}</span>
              </button>

              {isListening && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "#ef4444",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span className="spinner" style={{ width: "12px", height: "12px" }}></span>
                  Listening...
                </span>
              )}
            </div>

            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Voice STT & Markdown supported
            </span>
          </div>

          <textarea
            id="answerText"
            rows={10}
            value={currentAnswerText}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Structure your answer clearly. You can speak into your microphone or type your technical explanation, design trade-offs, and code examples..."
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "14px",
              lineHeight: "1.6",
              padding: "16px",
              backgroundColor: "#080c14",
              border: isListening ? "1px solid #ef4444" : "1px solid var(--border-card)",
              borderRadius: "10px",
              marginBottom: "16px",
            }}
          />

          {/* AI Instant Feedback Pill (if evaluated) */}
          {currentEvaluated && (
            <div
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.8)",
                border: "1px solid var(--border-card)",
                borderRadius: "10px",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Sparkles size={16} color="#06b6d4" />
                  <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#06b6d4" }}>
                    Gemini AI Assessment
                  </span>
                </div>
                <span
                  className="badge badge-success"
                  style={{ fontSize: "13px", fontWeight: 700 }}
                >
                  Score: {currentEvaluated.score} / 10
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                {currentEvaluated.feedback}
              </p>
            </div>
          )}

          {/* Evaluation Overlay while submitting */}
          {evaluating && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                borderRadius: "8px",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                marginBottom: "16px",
              }}
            >
              <div className="spinner"></div>
              <span style={{ fontSize: "13.5px", color: "#818cf8" }}>
                Gemini AI is analyzing your code and technical explanation...
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              paddingTop: "12px",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            {/* Previous */}
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0 || evaluating}
              className="btn btn-outline"
            >
              <ArrowLeft size={16} />
              <span>Previous</span>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Save & Evaluate */}
              <button
                onClick={() => handleSubmitCurrentAnswer(false)}
                disabled={evaluating || !currentAnswerText.trim()}
                className="btn btn-secondary"
                title="Save and evaluate without advancing"
              >
                <Save size={16} />
                <span>Save & Evaluate</span>
              </button>

              {/* Next / Submit */}
              {isFinalQuestion ? (
                <button
                  onClick={() => handleSubmitCurrentAnswer(true)}
                  disabled={evaluating || !currentAnswerText.trim()}
                  className="btn btn-primary"
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  }}
                >
                  <Send size={16} />
                  <span>Submit Interview</span>
                </button>
              ) : (
                <button
                  onClick={() => handleSubmitCurrentAnswer(true)}
                  disabled={evaluating || !currentAnswerText.trim()}
                  className="btn btn-primary"
                >
                  <span>Save & Next</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
