import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { voiceInterviewAPI, interviewAPI } from "../services/api";
import {
  PlayCircle,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  CornerDownRight,
  ShieldCheck,
  Award,
} from "lucide-react";

export default function InterviewReplay() {
  const { id: interviewId } = useParams();

  const [interview, setInterview] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingEventId, setPlayingEventId] = useState(null);

  useEffect(() => {
    fetchTimeline();
  }, [interviewId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const [intRes, timeRes] = await Promise.all([
        interviewAPI.getById(interviewId).catch(() => null),
        voiceInterviewAPI.getTimeline(interviewId),
      ]);
      setInterview(intRes);
      setTimeline(timeRes?.timeline || []);
    } catch (err) {
      setError(err.message || "Failed to load interview timeline replay");
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakText = (eventId, text) => {
    if (!("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported in this browser.");
      return;
    }

    if (playingEventId === eventId) {
      window.speechSynthesis.cancel();
      setPlayingEventId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setPlayingEventId(null);
    utterance.onerror = () => setPlayingEventId(null);

    setPlayingEventId(eventId);
    window.speechSynthesis.speak(utterance);
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "75vh", flexDirection: "column", gap: "16px" }}>
        <div className="spinner spinner-lg"></div>
        <p style={{ color: "var(--text-secondary)" }}>Reconstructing technical interview replay...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 0 60px" }}>
      <div className="container" style={{ maxWidth: "900px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span className="badge badge-primary">Multimodal Interview Replay</span>
            <span className="badge badge-neutral">Event Timeline</span>
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
            Technical Interview Replay & Adaptive Probing
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            {interview?.role ? `Target Track: ${interview.role}` : `Session #${interviewId}`} • Chronological audit of questions, voice transcripts, and dynamic follow-up trees.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Timeline Events */}
        {timeline.length === 0 ? (
          <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            <PlayCircle size={36} style={{ margin: "0 auto 12px" }} />
            <p>No recorded interview events found for this session.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {timeline.map((event, idx) => {
              const isFollowUp = !!event.parent_event_id;
              const isPlaying = playingEventId === event.id;

              return (
                <div
                  key={event.id}
                  className="card"
                  style={{
                    padding: "24px",
                    marginLeft: isFollowUp ? "32px" : "0",
                    borderLeft: isFollowUp ? "4px solid #8b5cf6" : "4px solid #6366f1",
                    backgroundColor: isFollowUp ? "rgba(139, 92, 246, 0.04)" : "var(--bg-card)",
                  }}
                >
                  {/* Event Top Bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {isFollowUp && <CornerDownRight size={16} color="#8b5cf6" />}
                      <span className="badge badge-neutral" style={{ fontSize: "11px" }}>
                        #{idx + 1} {event.event_type}
                      </span>
                      {isFollowUp && (
                        <span className="badge badge-warning" style={{ fontSize: "11px" }}>
                          Adaptive Follow-up Probe
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {event.response_latency_seconds && (
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={13} /> {event.response_latency_seconds}s latency
                        </span>
                      )}
                      {event.score !== null && (
                        <span className="badge badge-success" style={{ fontWeight: 700 }}>
                          Score: {event.score}/10
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
                      Technical Question:
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#f8fafc", lineHeight: "1.4" }}>
                      {event.question_text}
                    </div>
                  </div>

                  {/* Candidate Speech / Text Answer */}
                  <div
                    style={{
                      backgroundColor: "rgba(15, 23, 42, 0.6)",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-card)",
                      marginBottom: "14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Candidate Answer (Transcribed):
                      </div>
                      <button
                        onClick={() => handleSpeakText(event.id, event.candidate_speech_transcript || event.candidate_answer)}
                        className="btn btn-xs btn-outline"
                        style={{ padding: "4px 8px" }}
                        title="TTS Audio playback"
                      >
                        {isPlaying ? <VolumeX size={13} color="#ef4444" /> : <Volume2 size={13} color="#06b6d4" />}
                        <span>{isPlaying ? "Stop" : "Listen Audio"}</span>
                      </button>
                    </div>
                    <p style={{ fontSize: "13.5px", color: "#e2e8f0", margin: 0, lineHeight: "1.6" }}>
                      {event.candidate_speech_transcript || event.candidate_answer || "No response provided."}
                    </p>
                  </div>

                  {/* Rubric / AI Evaluation Notes */}
                  {event.ai_evaluation_json && (
                    <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Sparkles size={14} color="#06b6d4" />
                      <span>{event.ai_evaluation_json}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
