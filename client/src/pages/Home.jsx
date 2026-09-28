import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Sparkles,
  Play,
  ArrowRight,
  ShieldCheck,
  Brain,
  Terminal,
  FileCode,
  ListChecks,
  Users,
  Briefcase,
} from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: ListChecks,
      title: "Adaptive MCQ Assessment",
      description: "High-density technical questions with real-time accuracy scoring, immediate explanations, and adaptive difficulty progression.",
      color: "#06b6d4",
    },
    {
      icon: FileCode,
      title: "Algorithmic Coding Sandbox",
      description: "Hands-on coding challenges executed in sandboxed environments with hidden test-case validation and code quality analysis.",
      color: "#10b981",
    },
    {
      icon: Terminal,
      title: "Multimodal Voice Interview",
      description: "Interactive technical interviews with speech-to-text transcription, browser TTS question readout, and contextual probing follow-ups.",
      color: "#6366f1",
    },
    {
      icon: Brain,
      title: "Continual Skill Mastery",
      description: "Weighted historical skill tracking across core technical competencies with dynamic calibration and 4-week learning roadmaps.",
      color: "#f59e0b",
    },
    {
      icon: Users,
      title: "Recruiter Hiring Pipeline",
      description: "Job requisition management with 100% section weight validation, deterministic eligibility screening, and same-job candidate comparison.",
      color: "#ec4899",
    },
    {
      icon: ShieldCheck,
      title: "Integrity & Observability",
      description: "Anti-cheating monitoring, empirical AI reliability benchmarking, and immutable audit logs with zero blackbox fabrication.",
      color: "#8b5cf6",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Hero Section */}
      <section
        style={{
          padding: "80px 0 60px",
          background: "radial-gradient(ellipse at 50% 10%, rgba(99, 102, 241, 0.15) 0%, rgba(9, 13, 22, 1) 70%)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="container" style={{ textAlign: "center", maxWidth: "860px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "20px",
              backgroundColor: "rgba(99, 102, 241, 0.12)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              marginBottom: "24px",
            }}
          >
            <Sparkles size={14} color="#818cf8" />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#818cf8" }}>
              Adaptive Multi-Modal AI Technical Assessment Platform
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: "20px",
              color: "#ffffff",
              letterSpacing: "-0.03em",
            }}
          >
            Smarter Technical Hiring & AI-Powered Candidate Evaluation
          </h1>

          <p
            style={{
              fontSize: "clamp(15px, 2vw, 18px)",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: "36px",
              maxWidth: "720px",
              margin: "0 auto 36px",
            }}
          >
            CodeVigilant AI combines retrieval-augmented question generation, multi-mode technical evaluations (MCQ, coding, voice interview), deterministic mathematical scoring, and comprehensive recruiter comparison matrices.
          </p>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                <Play size={18} />
                <span>Go to Candidate Dashboard</span>
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  <span>Get Started — Create Account</span>
                  <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg">
                  <span>Sign In</span>
                </Link>
              </>
            )}
            <Link to="/jobs" className="btn btn-outline btn-lg">
              <Briefcase size={18} />
              <span>Explore Open Jobs</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ padding: "64px 0", flex: 1 }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "10px" }}>
              Platform Capabilities
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", maxWidth: "560px", margin: "0 auto" }}>
              Engineered with transparent mathematical explainability, strict candidate isolation, and production reliability.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "24px",
            }}
          >
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="card card-interactive"
                  style={{
                    padding: "28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      backgroundColor: `${item.color}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={24} color={item.color} />
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#f8fafc", margin: 0 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tech Stack Banner */}
      <section
        style={{
          padding: "36px 0",
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div className="container" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "12px" }}>
            Built With Modern Production Technologies
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "20px",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--text-secondary)",
            }}
          >
            <span>⚛️ React 19</span>
            <span>•</span>
            <span>⚡ Vite 8</span>
            <span>•</span>
            <span>🎨 Responsive Design</span>
            <span>•</span>
            <span>🐍 FastAPI Backend</span>
            <span>•</span>
            <span>🐘 PostgreSQL</span>
            <span>•</span>
            <span>✨ Google Gemini AI</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "24px 0",
          borderTop: "1px solid var(--border-subtle)",
          textAlign: "center",
          fontSize: "13px",
          color: "var(--text-muted)",
        }}
      >
        <div className="container">
          <p>© {new Date().getFullYear()} CodeVigilant AI. Adaptive Multi-Modal AI Technical Assessment Platform.</p>
        </div>
      </footer>
    </div>
  );
}
