import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { assessmentAPI, interviewAPI } from "../services/api";
import {
  Calendar,
  Sparkles,
  Target,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Play,
  Layers,
  BookOpen,
  Trophy,
} from "lucide-react";

export default function LearningRoadmap() {
  const [roadmap, setRoadmap] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRoadmap = async () => {
      try {
        setLoading(true);
        const [interviews, analyticsData] = await Promise.all([
          interviewAPI.getAll(),
          assessmentAPI.getAnalytics().catch(() => null),
        ]);

        setAnalytics(analyticsData);

        // Find the latest completed assessment that has a roadmap
        const completedWithRoadmap = interviews.find((i) => i.learning_roadmap_json);
        if (completedWithRoadmap && completedWithRoadmap.learning_roadmap_json) {
          try {
            const parsed = JSON.parse(completedWithRoadmap.learning_roadmap_json);
            setRoadmap(parsed);
          } catch {
            setRoadmap([]);
          }
        } else if (interviews.length > 0) {
          // Fetch results of the latest assessment
          try {
            const latestRes = await assessmentAPI.getResults(interviews[0].id);
            if (latestRes.learning_roadmap) {
              setRoadmap(latestRes.learning_roadmap);
            }
          } catch {
            setRoadmap([]);
          }
        }
      } catch (err) {
        console.error("Failed to load roadmap:", err);
        setError("Failed to load your personalized learning roadmap.");
      } finally {
        setLoading(false);
      }
    };

    loadRoadmap();
  }, []);

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "75vh", flexDirection: "column", gap: "16px" }}>
        <div className="spinner spinner-lg"></div>
        <p style={{ color: "var(--text-secondary)" }}>Generating personalized learning roadmap...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 0 60px" }}>
      <div className="container" style={{ maxWidth: "960px" }}>
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
              <span className="badge badge-primary">Personalized Curriculum</span>
              {analytics?.current_skill_level && (
                <span className="badge badge-warning">{analytics.current_skill_level}</span>
              )}
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 4px" }}>
              Personalized Technical Learning Roadmap
            </h1>
            <p style={{ fontSize: "14px" }}>
              Step-by-step engineering study plan synthesized by Gemini AI from your actual assessment gaps.
            </p>
          </div>

          <Link to="/interview/start" className="btn btn-primary">
            <Play size={16} />
            <span>Practice Next Topic</span>
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {roadmap.length === 0 ? (
          <div
            className="card flex-center"
            style={{
              padding: "60px 24px",
              flexDirection: "column",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <Calendar size={28} />
            </div>
            <h3 style={{ fontSize: "18px", marginBottom: "6px" }}>
              No learning roadmap generated yet
            </h3>
            <p style={{ fontSize: "14px", maxWidth: "420px", marginBottom: "20px" }}>
              Complete an MCQ test, coding challenge, or mock interview to automatically generate your personalized 4-week study curriculum.
            </p>
            <Link to="/interview/start" className="btn btn-primary">
              <Play size={16} />
              <span>Start an Assessment</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {roadmap.map((step, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  padding: "24px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "20px",
                  borderLeft: `4px solid ${idx === 0 ? "#6366f1" : idx === 1 ? "#06b6d4" : idx === 2 ? "#10b981" : "#f59e0b"}`,
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    color: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "14px",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Wk</span>
                  <span>{idx + 1}</span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>
                      {step.topic}
                    </h3>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <span className="badge badge-warning" style={{ fontSize: "11px" }}>
                        {step.priority || "High Priority"}
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: "11px" }}>
                        {step.recommended_difficulty || "Intermediate"}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: "13.5px", lineHeight: "1.5", color: "var(--text-secondary)", marginBottom: "14px" }}>
                    {step.description}
                  </p>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <Link
                      to="/interview/start"
                      state={{ selectedRole: step.topic, mode: "coding" }}
                      className="btn btn-secondary btn-sm"
                    >
                      <span>Practice Coding</span>
                      <ArrowRight size={13} />
                    </Link>
                    <Link
                      to="/interview/start"
                      state={{ selectedRole: step.topic, mode: "mcq" }}
                      className="btn btn-outline btn-sm"
                    >
                      <span>Take MCQ Test</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
