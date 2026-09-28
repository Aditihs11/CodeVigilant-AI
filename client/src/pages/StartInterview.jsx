import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { assessmentAPI, interviewAPI, questionAPI } from "../services/api";
import {
  Sparkles,
  ArrowRight,
  Brain,
  Code,
  Layers,
  Terminal,
  Cpu,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  FileText,
  FileCode,
  ListChecks,
} from "lucide-react";

export default function StartInterview() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState(location.state?.mode || "interview"); // "mcq" | "coding" | "interview"
  const [selectedRole, setSelectedRole] = useState(location.state?.selectedRole || "Java");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [language, setLanguage] = useState("Python");
  const [questionCount, setQuestionCount] = useState(5);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState(null);

  const assessmentModes = [
    {
      id: "mcq",
      title: "MCQ Assessment",
      desc: "Fast-paced, high-density multiple choice evaluation testing language semantics, core APIs & fundamentals.",
      icon: ListChecks,
      badge: "Multiple Choice",
      color: "#06b6d4",
    },
    {
      id: "coding",
      title: "Coding Challenge",
      desc: "Algorithmic and practical problem solving with custom test cases, edge cases, and code quality scoring.",
      icon: FileCode,
      badge: "Hands-on Code",
      color: "#10b981",
    },
    {
      id: "interview",
      title: "AI Technical Interview",
      desc: "Full mock technical interview with open-ended design prompts, conceptual deep-dives, and AI feedback.",
      icon: Terminal,
      badge: "Comprehensive",
      color: "#6366f1",
    },
  ];

  const availableRoles = [
    {
      id: "Java",
      title: "Java Developer",
      desc: "Core Java, Concurrency, OOP, Collections, JVM Internals & Spring Boot",
      icon: Cpu,
      color: "#f59e0b",
    },
    {
      id: "MERN",
      title: "MERN Stack Developer",
      desc: "React 19, Node.js, Express, MongoDB, RESTful APIs & State Management",
      icon: Layers,
      color: "#06b6d4",
    },
    {
      id: "SDE",
      title: "SDE / Systems Engineer",
      desc: "System Architecture, Design Patterns, Scalability, Concurrency & API Design",
      icon: Terminal,
      color: "#6366f1",
    },
    {
      id: "Python",
      title: "Python Backend Engineer",
      desc: "Python Fundamentals, AsyncIO, FastAPI/Django, ORMs & Data Pipelines",
      icon: Code,
      color: "#10b981",
    },
    {
      id: "DSA",
      title: "Data Structures & Algorithms",
      desc: "Dynamic Programming, Trees, Graphs, Sorting & Space-Time Complexity",
      icon: Brain,
      color: "#ec4899",
    },
  ];

  const difficulties = [
    { id: "Beginner", label: "Junior / Entry", desc: "Core syntax, definitions, fundamental mechanisms" },
    { id: "Intermediate", label: "Mid-Level", desc: "Practical problem-solving, architectural tradeoffs" },
    { id: "Advanced", label: "Senior / Lead", desc: "Deep internals, performance tuning, concurrency & failure recovery" },
  ];

  const handleStart = async () => {
    setError(null);
    setLoading(true);

    try {
      if (mode === "mcq") {
        setLoadingStep("Initializing MCQ session...");
        const assessment = await assessmentAPI.create({
          role: selectedRole,
          assessment_type: "mcq",
          difficulty,
          question_count: questionCount,
        });

        setLoadingStep("Generating structured technical MCQs with Gemini AI...");
        await assessmentAPI.generateMCQs(assessment.id);

        setLoadingStep("Entering assessment room...");
        setTimeout(() => navigate(`/assessment/mcq/${assessment.id}`), 400);
      } else if (mode === "coding") {
        setLoadingStep("Initializing Coding workspace...");
        const assessment = await assessmentAPI.create({
          role: selectedRole,
          assessment_type: "coding",
          difficulty,
          language,
        });

        setLoadingStep("Generating custom coding challenge with Gemini AI...");
        await assessmentAPI.generateCoding(assessment.id);

        setLoadingStep("Entering code editor...");
        setTimeout(() => navigate(`/assessment/coding/${assessment.id}`), 400);
      } else {
        // AI Interview Mode
        setLoadingStep("Creating technical interview session...");
        const interview = await interviewAPI.create({
          role: `${selectedRole} (${difficulty})`,
        });

        setLoadingStep("Generating in-depth technical questions with Gemini AI...");
        await questionAPI.generate(interview.id);

        setLoadingStep("Preparing interview room...");
        setTimeout(() => navigate(`/interview/${interview.id}`), 400);
      }
    } catch (err) {
      console.error("Failed to start assessment:", err);
      setError(err.message || "Failed to initialize assessment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "32px 0 60px" }}>
      <div className="container" style={{ maxWidth: "920px" }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 6px" }}>
            Configure New Technical Assessment
          </h1>
          <p style={{ fontSize: "14.5px" }}>
            Choose your assessment format, target domain, and difficulty. Gemini will customize dynamic technical challenges.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "24px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Modal */}
        {loading && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(9, 13, 22, 0.85)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: "20px",
            }}
          >
            <div
              className="card"
              style={{
                maxWidth: "460px",
                width: "100%",
                padding: "36px 28px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8)",
                border: "1px solid var(--border-focus)",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                  boxShadow: "0 0 24px rgba(99, 102, 241, 0.5)",
                }}
              >
                <Sparkles size={28} color="#ffffff" />
              </div>

              <div className="spinner spinner-lg" style={{ marginBottom: "20px" }}></div>

              <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
                Preparing Assessment
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "#06b6d4",
                  fontWeight: 500,
                  minHeight: "24px",
                }}
              >
                {loadingStep}
              </p>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "16px" }}>
                Generating role-tailored technical questions using Google Gemini 3.6 Flash.
              </span>
            </div>
          </div>
        )}

        {/* Step 1: Assessment Mode */}
        <div className="card" style={{ marginBottom: "24px", padding: "28px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>
            1. Select Assessment Mode
          </h2>
          <p style={{ fontSize: "13.5px", marginBottom: "20px" }}>
            Choose the format of your technical evaluation.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "14px",
            }}
          >
            {assessmentModes.map((m) => {
              const Icon = m.icon;
              const isSelected = mode === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  style={{
                    padding: "18px",
                    borderRadius: "12px",
                    border: isSelected
                      ? `2px solid ${m.color}`
                      : "1px solid var(--border-card)",
                    backgroundColor: isSelected
                      ? `${m.color}15`
                      : "var(--bg-surface)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
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
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "8px",
                        backgroundColor: `${m.color}25`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={20} color={m.color} />
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "12px",
                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {m.badge}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "15.5px", marginBottom: "4px" }}>
                    {m.title}
                  </div>
                  <div style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                    {m.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Role Selection */}
        <div className="card" style={{ marginBottom: "24px", padding: "28px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>
            2. Select Technical Track
          </h2>
          <p style={{ fontSize: "13.5px", marginBottom: "20px" }}>
            Choose the target engineering domain.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "14px",
            }}
          >
            {availableRoles.map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    border: isSelected
                      ? "2px solid #6366f1"
                      : "1px solid var(--border-card)",
                    backgroundColor: isSelected
                      ? "rgba(99, 102, 241, 0.1)"
                      : "var(--bg-surface)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        backgroundColor: `${r.color}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={18} color={r.color} />
                    </div>
                    {isSelected && <CheckCircle2 size={18} color="#818cf8" />}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "4px" }}>
                    {r.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                    {r.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Difficulty & Parameters */}
        <div className="card" style={{ marginBottom: "28px", padding: "28px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>
            3. Difficulty & Configuration
          </h2>
          <p style={{ fontSize: "13.5px", marginBottom: "20px" }}>
            Configure assessment parameters and difficulty rigor.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "14px",
              marginBottom: "24px",
            }}
          >
            {difficulties.map((d) => {
              const isSelected = difficulty === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    border: isSelected
                      ? "2px solid #06b6d4"
                      : "1px solid var(--border-card)",
                    backgroundColor: isSelected
                      ? "rgba(6, 182, 212, 0.1)"
                      : "var(--bg-surface)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: "14.5px" }}>{d.label}</span>
                    {isSelected && <CheckCircle2 size={16} color="#06b6d4" />}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {d.desc}
                  </div>
                </div>
              );
            })}
          </div>

          {mode === "coding" && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "13.5px", fontWeight: 600, marginBottom: "8px" }}>
                Select Solution Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ maxWidth: "260px" }}
              >
                <option value="Python">Python 3</option>
                <option value="Java">Java 17</option>
                <option value="JavaScript">JavaScript (ES6)</option>
              </select>
            </div>
          )}

          {mode === "mcq" && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "13.5px", fontWeight: 600, marginBottom: "8px" }}>
                Number of MCQs
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                {[5, 10, 15].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`btn btn-sm ${questionCount === cnt ? "btn-primary" : "btn-outline"}`}
                    style={{ padding: "8px 18px" }}
                  >
                    {cnt} Questions
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 16px",
              backgroundColor: "rgba(99, 102, 241, 0.06)",
              borderRadius: "10px",
              border: "1px solid rgba(99, 102, 241, 0.2)",
            }}
          >
            <ShieldCheck size={20} color="#818cf8" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              <strong>Adaptive Engine Active:</strong> Your performance will calibrate topic-level skill gaps and recommend dynamic practice paths automatically upon completion.
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn btn-outline"
            style={{ padding: "12px 24px" }}
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ minWidth: "220px" }}
          >
            <Sparkles size={18} />
            <span>Generate & Start</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
