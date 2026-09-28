import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { researchAPI } from "../services/api";
import {
  FlaskConical,
  Play,
  Square,
  Download,
  Plus,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  HelpCircle,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  TrendingUp,
  Sliders,
  ChevronRight,
  ShieldAlert,
  Camera,
  Target,
  Database,
  GitBranch,
  BookOpen,
} from "lucide-react";

export default function ResearchDashboard() {
  const { user } = useAuth();

  const [experiments, setExperiments] = useState([]);
  const [selectedExp, setSelectedExp] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "dataset", "convergence", "discrimination", "quality", "mastery", "limitations"
  
  // Data State
  const [results, setResults] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [convergenceData, setConvergenceData] = useState(null);
  const [discriminationData, setDiscriminationData] = useState(null);
  const [qualityData, setQualityData] = useState(null);
  const [masteryData, setMasteryData] = useState(null);
  const [reportData, setReportData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    experiment_type: "adaptive_vs_static",
    control_strategy: "Static / Fixed Difficulty Assessment",
    treatment_strategy: "Deterministic Adaptive Assessment Engine",
    target_role: "All",
    sample_size_target: 50,
  });

  const loadExperiments = async () => {
    try {
      setLoading(true);
      setError(null);
      const exps = await researchAPI.getExperiments();
      setExperiments(exps);

      if (exps.length > 0) {
        const currentId = selectedExp ? selectedExp.id : exps[0].id;
        const target = exps.find((e) => e.id === currentId) || exps[0];
        setSelectedExp(target);
        await loadExperimentDetails(target.id);
      } else {
        setSelectedExp(null);
        setResults(null);
        setParticipants([]);
      }
    } catch (err) {
      console.error("Research load error:", err);
      setError(err.message || "Failed to load research experiments.");
    } finally {
      setLoading(false);
    }
  };

  const loadExperimentDetails = async (expId) => {
    try {
      const [resData, partData, dsData, convData, discData, qData, mData, repData] = await Promise.all([
        researchAPI.getResults(expId).catch(() => null),
        researchAPI.getParticipants(expId).catch(() => []),
        researchAPI.getDataset(expId).catch(() => null),
        researchAPI.getConvergence(expId).catch(() => null),
        researchAPI.getDiscrimination(expId).catch(() => null),
        researchAPI.getQuestionQuality(expId).catch(() => null),
        researchAPI.getMastery(expId).catch(() => null),
        researchAPI.getReport(expId).catch(() => null),
      ]);
      setResults(resData);
      setParticipants(partData);
      setDatasetInfo(dsData);
      setConvergenceData(convData);
      setDiscriminationData(discData);
      setQualityData(qData);
      setMasteryData(mData);
      setReportData(repData);
    } catch (err) {
      console.error("Failed to load experiment details:", err);
    }
  };

  useEffect(() => {
    loadExperiments();
  }, []);

  const handleSelectExperiment = async (exp) => {
    setSelectedExp(exp);
    await loadExperimentDetails(exp.id);
  };

  const handleCreateExperiment = async (e) => {
    e.preventDefault();
    try {
      await researchAPI.createExperiment(form);
      setIsModalOpen(false);
      setForm({
        name: "",
        description: "",
        experiment_type: "adaptive_vs_static",
        control_strategy: "Static / Fixed Difficulty Assessment",
        treatment_strategy: "Deterministic Adaptive Assessment Engine",
        target_role: "All",
        sample_size_target: 50,
      });
      await loadExperiments();
    } catch (err) {
      alert("Failed to create experiment: " + err.message);
    }
  };

  const handleStart = async () => {
    if (!selectedExp) return;
    try {
      await researchAPI.startExperiment(selectedExp.id);
      await loadExperiments();
    } catch (err) {
      alert("Failed to start experiment: " + err.message);
    }
  };

  const handleStop = async () => {
    if (!selectedExp) return;
    try {
      await researchAPI.stopExperiment(selectedExp.id);
      await loadExperiments();
    } catch (err) {
      alert("Failed to stop experiment: " + err.message);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!selectedExp) return;
    try {
      setSnapshotLoading(true);
      const snap = await researchAPI.createSnapshot(selectedExp.id);
      alert(`Immutable dataset snapshot created successfully: ${snap.snapshot_id} (${snap.valid_count} valid records)`);
      await loadExperimentDetails(selectedExp.id);
    } catch (err) {
      alert("Failed to create dataset snapshot: " + err.message);
    } finally {
      setSnapshotLoading(false);
    }
  };

  const handleExportCsv = async () => {
    if (!selectedExp) return;
    try {
      const blob = await researchAPI.exportCsv(selectedExp.id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `experiment_${selectedExp.id}_anonymized.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Failed to export CSV: " + err.message);
    }
  };

  const handleExportJson = async () => {
    if (!selectedExp) return;
    try {
      const data = await researchAPI.exportJson(selectedExp.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `experiment_${selectedExp.id}_anonymized.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Failed to export JSON: " + err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <span className="badge badge-success" style={{ fontSize: "11px" }}>Active</span>;
      case "completed":
        return <span className="badge badge-primary" style={{ fontSize: "11px" }}>Completed</span>;
      default:
        return <span className="badge badge-warning" style={{ fontSize: "11px" }}>Draft</span>;
    }
  };

  const handleTypeChange = (type) => {
    let ctrl = "Static / Fixed Difficulty Assessment";
    let treat = "Deterministic Adaptive Assessment Engine";
    if (type === "rag_vs_non_rag") {
      ctrl = "Standard LLM Zero-Shot Generation";
      treat = "Bounded Hybrid RAG + Grounded Gemini 3.6 Flash";
    } else if (type === "validated_vs_unvalidated") {
      ctrl = "Unvalidated LLM Output";
      treat = "Two-Phase Structural + AI Quality Validator";
    } else if (type === "personalized_vs_role_only") {
      ctrl = "Generic Role-Based Assessment";
      treat = "Resume & Weakness-Aware Personalization";
    } else if (type === "mastery_vs_latest_score") {
      ctrl = "Single Assessment Score Overwriting";
      treat = "Weighted Continual Skill Mastery (70/30)";
    }
    setForm({
      ...form,
      experiment_type: type,
      control_strategy: ctrl,
      treatment_strategy: treat,
    });
  };

  if (!user?.is_admin && !loading) {
    return (
      <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <div className="card" style={{ maxWidth: "500px", margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Researcher / Admin Access Required</h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>This scientific A/B testing portal is restricted to authorized platform administrators and research scientists.</p>
        </div>
      </div>
    );
  }

  if (loading && !selectedExp) {
    return (
      <div className="flex-center" style={{ minHeight: "75vh", flexDirection: "column", gap: "16px" }}>
        <div className="spinner spinner-lg"></div>
        <p style={{ color: "var(--text-secondary)" }}>Loading research experiments & empirical statistical engine...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 0 60px" }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <FlaskConical size={12} /> Scientific Research Engine
              </span>
              <span className="badge badge-primary">Empirical Statistical Evaluation</span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 4px" }}>
              Research Experiments & Dataset Engine
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              Extracts research-safe experimental records, computes Cohen's d effect sizes, and evaluates adaptive convergence with zero fabricated metrics.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={15} />
              <span>New Experiment</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Main Grid: Experiments Sidebar + Active Experiment Details */}
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px" }}>
          {/* Left: Experiment List Sidebar */}
          <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", height: "fit-content" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                Experiments ({experiments.length})
              </span>
            </div>

            {experiments.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "10px 0" }}>No research experiments created yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {experiments.map((exp) => (
                  <div
                    key={exp.id}
                    onClick={() => handleSelectExperiment(exp)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: selectedExp?.id === exp.id ? "2px solid #6366f1" : "1px solid var(--border-card)",
                      backgroundColor: selectedExp?.id === exp.id ? "rgba(99, 102, 241, 0.12)" : "var(--bg-surface)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, fontSize: "13px", color: selectedExp?.id === exp.id ? "#ffffff" : "var(--text-primary)" }}>
                        {exp.name}
                      </span>
                      {getStatusBadge(exp.status)}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                      N = {exp.current_participants} / {exp.sample_size_target}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Selected Experiment Dashboard */}
          {selectedExp && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Top Banner Card */}
              <div className="card" style={{ padding: "20px 24px", background: "radial-gradient(ellipse at 90% 10%, rgba(99, 102, 241, 0.12) 0%, rgba(15, 23, 42, 1) 70%)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "14px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span className="badge badge-primary">{selectedExp.experiment_type}</span>
                      {getStatusBadge(selectedExp.status)}
                      <span className="badge badge-neutral">Role: {selectedExp.target_role}</span>
                    </div>
                    <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px" }}>{selectedExp.name}</h2>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                      {selectedExp.description || "Controlled assessment experiment evaluating empirical candidate outcomes."}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {selectedExp.status === "draft" && (
                      <button onClick={handleStart} className="btn btn-primary btn-sm" style={{ background: "#10b981" }}>
                        <Play size={13} /> Start Study
                      </button>
                    )}
                    {selectedExp.status === "active" && (
                      <button onClick={handleStop} className="btn btn-outline btn-sm" style={{ color: "var(--warning)", borderColor: "rgba(245, 158, 11, 0.4)" }}>
                        <Square size={13} /> Stop / Complete
                      </button>
                    )}
                    <button onClick={handleCreateSnapshot} disabled={snapshotLoading} className="btn btn-outline btn-sm" style={{ color: "#818cf8", borderColor: "#6366f1" }}>
                      <Camera size={13} /> {snapshotLoading ? "Freezing..." : "Freeze Snapshot"}
                    </button>
                    <button onClick={handleExportCsv} className="btn btn-secondary btn-sm">
                      <FileSpreadsheet size={13} /> CSV
                    </button>
                    <button onClick={handleExportJson} className="btn btn-outline btn-sm">
                      <FileCode size={13} /> JSON
                    </button>
                  </div>
                </div>

                {/* Strategy Specs */}
                <div className="grid-2" style={{ gap: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px", fontSize: "12.5px" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>CONTROL (A):</span>{" "}
                    <span style={{ color: "#e2e8f0" }}>{selectedExp.control_strategy}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--cyan-accent)", fontWeight: 600 }}>TREATMENT (B):</span>{" "}
                    <span style={{ color: "#e2e8f0" }}>{selectedExp.treatment_strategy}</span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div style={{ display: "flex", gap: "6px", borderBottom: "1px solid var(--border-card)", paddingBottom: "4px", overflowX: "auto" }}>
                {[
                  { id: "overview", label: "Control vs Treatment", icon: BarChart3 },
                  { id: "dataset", label: "Dataset & Snapshots", icon: Database },
                  { id: "convergence", label: "Adaptive Convergence", icon: TrendingUp },
                  { id: "discrimination", label: "Item Discrimination (D)", icon: Target },
                  { id: "quality", label: "Question Quality & RAG", icon: Sparkles },
                  { id: "mastery", label: "Continual Mastery", icon: BookOpen },
                  { id: "limitations", label: "Research Limitations", icon: AlertCircle },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`btn btn-sm ${activeTab === tab.id ? "btn-primary" : "btn-outline"}`}
                      style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* ------------------------------------------------------------- */}
              {/* TAB 1: OVERVIEW & COMPARATIVE STATISTICS                      */}
              {/* ------------------------------------------------------------- */}
              {activeTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Sample Size Warning Banner (If N < 5) */}
                  {results && (results.control_sample_size < 5 || results.treatment_sample_size < 5) && (
                    <div className="alert alert-warning" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <AlertCircle size={18} />
                      <div>
                        <strong>Scientific Notice: Insufficient sample size (N &lt; 5 per group).</strong>
                        <div style={{ fontSize: "12px", marginTop: "2px" }}>
                          Current sample: Control N = {results.control_sample_size}, Treatment N = {results.treatment_sample_size}. Cohen's d effect sizes and 95% confidence intervals are displayed once &ge; 5 records per group are logged.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comparative Metrics Grid */}
                  {results && results.metrics && (
                    <div className="grid-2" style={{ gap: "14px" }}>
                      {Object.entries(results.metrics).map(([key, stat]) => {
                        const isInsufficient = stat.insufficient_sample;
                        const pct = stat.percentage_improvement;
                        const cohen = stat.effect_size_cohens_d;
                        const ci = stat.confidence_interval_95;

                        return (
                          <div key={key} className="card" style={{ padding: "18px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                              <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#f8fafc" }}>
                                {stat.metric_name}
                              </span>
                              <span className="badge badge-neutral" style={{ fontSize: "10px" }}>
                                {stat.status}
                              </span>
                            </div>

                            <div className="grid-2" style={{ gap: "10px", marginBottom: "12px" }}>
                              {/* Control */}
                              <div style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-card)" }}>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Control</div>
                                <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "2px" }}>
                                  {stat.control.mean !== null ? stat.control.mean : "—"}
                                </div>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                  Med: {stat.control.median ?? "—"} | &sigma;: {stat.control.std_dev ?? "—"} (N={stat.control.count})
                                </div>
                              </div>

                              {/* Treatment */}
                              <div style={{ backgroundColor: "rgba(6, 182, 212, 0.05)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(6, 182, 212, 0.25)" }}>
                                <div style={{ fontSize: "11px", color: "var(--cyan-accent)", textTransform: "uppercase", fontWeight: 600 }}>Treatment</div>
                                <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--cyan-accent)", marginTop: "2px" }}>
                                  {stat.treatment.mean !== null ? stat.treatment.mean : "—"}
                                </div>
                                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                  Med: {stat.treatment.median ?? "—"} | &sigma;: {stat.treatment.std_dev ?? "—"} (N={stat.treatment.count})
                                </div>
                              </div>
                            </div>

                            {/* Difference and Effect Size */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "10px", color: "var(--text-muted)" }}>
                              <div>
                                <span>&Delta;: </span>
                                <strong style={{ color: stat.absolute_difference > 0 ? "var(--success)" : "#f8fafc" }}>
                                  {stat.absolute_difference !== null ? `${stat.absolute_difference > 0 ? "+" : ""}${stat.absolute_difference}` : "—"}
                                </strong>
                                {pct !== null && (
                                  <span style={{ marginLeft: "4px", color: pct > 0 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
                                    ({pct > 0 ? "+" : ""}{pct}%)
                                  </span>
                                )}
                              </div>

                              <div>
                                {isInsufficient ? (
                                  <span style={{ fontSize: "11px", color: "var(--warning)" }}>Insufficient Data (N &lt; 5)</span>
                                ) : (
                                  <span>
                                    Cohen's d: <strong style={{ color: "#818cf8" }}>{cohen}</strong>
                                    {ci && <span style={{ marginLeft: "6px", fontSize: "10.5px" }}>CI: [{ci[0]}, {ci[1]}]</span>}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Anonymized Participants Table */}
                  <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <ShieldCheck size={16} color="#10b981" />
                        <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>Anonymized Participants ({participants.length})</h4>
                      </div>
                      <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Zero PII (Deterministic Salted Hashes)</span>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "rgba(255, 255, 255, 0.02)", fontSize: "11.5px", textTransform: "uppercase", color: "var(--text-muted)" }}>
                            <th style={{ padding: "10px 14px" }}>Participant ID</th>
                            <th style={{ padding: "10px 14px" }}>Group</th>
                            <th style={{ padding: "10px 14px" }}>Final Score</th>
                            <th style={{ padding: "10px 14px" }}>Accuracy</th>
                            <th style={{ padding: "10px 14px" }}>Convergence (K)</th>
                            <th style={{ padding: "10px 14px" }}>Mastery &Delta;</th>
                          </tr>
                        </thead>
                        <tbody style={{ fontSize: "12.5px" }}>
                          {participants.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: "18px", textAlign: "center", color: "var(--text-muted)" }}>
                                No participants assigned yet.
                              </td>
                            </tr>
                          ) : (
                            participants.map((p, i) => (
                              <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", color: "#818cf8" }}>{p.participant_id}</td>
                                <td style={{ padding: "10px 14px" }}>
                                  <span className={`badge ${p.group === "treatment" ? "badge-primary" : "badge-neutral"}`} style={{ textTransform: "uppercase", fontSize: "10px" }}>
                                    {p.group}
                                  </span>
                                </td>
                                <td style={{ padding: "10px 14px", fontWeight: 600 }}>{p.final_score !== null ? `${p.final_score}/10` : "—"}</td>
                                <td style={{ padding: "10px 14px" }}>{p.accuracy !== null ? `${p.accuracy}%` : "—"}</td>
                                <td style={{ padding: "10px 14px", fontWeight: 600 }}>{p.questions_required_for_convergence} Qs</td>
                                <td style={{ padding: "10px 14px", color: p.mastery_improvement > 0 ? "var(--success)" : "#cbd5e1" }}>
                                  {p.mastery_improvement !== null ? `${p.mastery_improvement > 0 ? "+" : ""}${p.mastery_improvement}%` : "—"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 2: DATASET & IMMUTABLE SNAPSHOTS                          */}
              {/* ------------------------------------------------------------- */}
              {activeTab === "dataset" && datasetInfo && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="grid-3" style={{ gap: "14px" }}>
                    <div className="card" style={{ padding: "16px" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Total Extracted</div>
                      <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px" }}>{datasetInfo.total_extracted}</div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Raw Database Records</div>
                    </div>
                    <div className="card" style={{ padding: "16px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                      <div style={{ fontSize: "11px", color: "var(--success)", textTransform: "uppercase", fontWeight: 600 }}>Valid Observations</div>
                      <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--success)", marginTop: "4px" }}>{datasetInfo.valid_count}</div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Passed All Range & Integrity Tests</div>
                    </div>
                    <div className="card" style={{ padding: "16px", border: datasetInfo.invalid_count > 0 ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid var(--border-card)" }}>
                      <div style={{ fontSize: "11px", color: datasetInfo.invalid_count > 0 ? "var(--danger)" : "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Invalid Observations</div>
                      <div style={{ fontSize: "24px", fontWeight: 700, color: datasetInfo.invalid_count > 0 ? "var(--danger)" : "#cbd5e1", marginTop: "4px" }}>{datasetInfo.invalid_count}</div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Excluded from Analysis</div>
                    </div>
                  </div>

                  {/* Schema Info */}
                  <div className="card" style={{ padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>Research Observation Schema & Privacy Locks</h4>
                      <span className="badge badge-success" style={{ fontSize: "10.5px" }}>Strictly Zero PII</span>
                    </div>
                    <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: "0 0 12px" }}>
                      Observations contain anonymized candidate performance, scores, convergence points, and topic masteries. PII fields (names, emails, passwords, raw resume text, raw answers) are strictly excluded at the query boundary.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px", fontSize: "12px", fontFamily: "var(--font-mono)", color: "#818cf8" }}>
                      <div>&bull; anonymized_participant_id</div>
                      <div>&bull; experiment_group (control/treatment)</div>
                      <div>&bull; final_score [0-10]</div>
                      <div>&bull; accuracy [0-100%]</div>
                      <div>&bull; convergence_questions (K)</div>
                      <div>&bull; mastery_improvement (%)</div>
                      <div>&bull; question_quality_score [0-10]</div>
                      <div>&bull; completion_time_seconds</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 3: ADAPTIVE CONVERGENCE                                   */}
              {/* ------------------------------------------------------------- */}
              {activeTab === "convergence" && convergenceData && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="card" style={{ padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <h4 style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>Observed vs Configured Convergence</h4>
                      <span className="badge badge-neutral" style={{ fontSize: "10px" }}>{convergenceData.observed_convergence?.status}</span>
                    </div>

                    <div className="grid-2" style={{ gap: "14px", marginBottom: "16px" }}>
                      <div className="card" style={{ padding: "14px", background: "rgba(255, 255, 255, 0.02)" }}>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Control Mean Questions</div>
                        <div style={{ fontSize: "22px", fontWeight: 700, marginTop: "2px" }}>
                          {convergenceData.observed_convergence?.control?.mean_questions ?? "—"} Qs
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                          Early convergence rate: {convergenceData.observed_convergence?.control?.convergence_rate_percent ?? "—"}%
                        </div>
                      </div>

                      <div className="card" style={{ padding: "14px", background: "rgba(6, 182, 212, 0.05)", border: "1px solid rgba(6, 182, 212, 0.25)" }}>
                        <div style={{ fontSize: "11px", color: "var(--cyan-accent)", textTransform: "uppercase", fontWeight: 600 }}>Treatment Mean Questions</div>
                        <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--cyan-accent)", marginTop: "2px" }}>
                          {convergenceData.observed_convergence?.treatment?.mean_questions ?? "—"} Qs
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                          Early convergence rate: {convergenceData.observed_convergence?.treatment?.convergence_rate_percent ?? "—"}%
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "12px", fontSize: "12.5px" }}>
                      <strong>Configured Convergence Thresholds (Expected):</strong> Stability window = {convergenceData.configured_convergence?.target_stability_window} Qs, Variance &le; {convergenceData.configured_convergence?.variance_threshold}, Mastery &Delta; &lt; {convergenceData.configured_convergence?.continual_mastery_delta_threshold_percent}%.
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 4: ITEM DISCRIMINATION                                    */}
              {/* ------------------------------------------------------------- */}
              {activeTab === "discrimination" && discriminationData && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="card" style={{ padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div>
                        <h4 style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>Item Discrimination Index (D = P_upper - P_lower)</h4>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                          Evaluates item discrimination power using upper 27% vs lower 27% candidate cohorts.
                        </div>
                      </div>
                      <span className="badge badge-neutral" style={{ fontSize: "10px" }}>{discriminationData.status}</span>
                    </div>

                    <div className="grid-3" style={{ gap: "12px", marginBottom: "14px" }}>
                      <div className="card" style={{ padding: "12px", background: "rgba(255,255,255,0.02)" }}>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Candidates Analyzed</div>
                        <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "2px" }}>{discriminationData.total_candidates}</div>
                      </div>
                      <div className="card" style={{ padding: "12px", background: "rgba(255,255,255,0.02)" }}>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Cohort Size (27%)</div>
                        <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "2px" }}>{discriminationData.upper_group_size} per group</div>
                      </div>
                      <div className="card" style={{ padding: "12px", background: "rgba(255,255,255,0.02)" }}>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Mean Discrimination D</div>
                        <div style={{ fontSize: "18px", fontWeight: 700, color: "#818cf8", marginTop: "2px" }}>{discriminationData.mean_discrimination ?? "—"}</div>
                      </div>
                    </div>

                    {/* Discrimination Items List */}
                    {discriminationData.items && discriminationData.items.length > 0 ? (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "11px" }}>
                              <th style={{ padding: "8px 12px" }}>Topic / Item</th>
                              <th style={{ padding: "8px 12px" }}>P_upper (Top 27%)</th>
                              <th style={{ padding: "8px 12px" }}>P_lower (Bottom 27%)</th>
                              <th style={{ padding: "8px 12px" }}>D = P_up - P_low</th>
                              <th style={{ padding: "8px 12px" }}>Qualification</th>
                            </tr>
                          </thead>
                          <tbody>
                            {discriminationData.items.map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                <td style={{ padding: "8px 12px", fontWeight: 600 }}>{item.topic}</td>
                                <td style={{ padding: "8px 12px" }}>{(item.p_upper * 100).toFixed(0)}%</td>
                                <td style={{ padding: "8px 12px" }}>{(item.p_lower * 100).toFixed(0)}%</td>
                                <td style={{ padding: "8px 12px", fontWeight: 700, color: item.discrimination_index_d >= 0.3 ? "var(--success)" : "#e2e8f0" }}>
                                  {item.discrimination_index_d}
                                </td>
                                <td style={{ padding: "8px 12px" }}>
                                  <span className="badge badge-neutral" style={{ fontSize: "10.5px" }}>{item.qualification}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="alert alert-neutral" style={{ fontSize: "12.5px" }}>
                        {discriminationData.qualification || "Insufficient candidate sessions (N < 10) to calculate item discrimination index."}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 5: QUESTION QUALITY & RAG GROUNDING                       */}
              {/* ------------------------------------------------------------- */}
              {activeTab === "quality" && qualityData && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="grid-3" style={{ gap: "12px" }}>
                    <div className="card" style={{ padding: "14px" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Approval Rate</div>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--success)", marginTop: "2px" }}>
                        {qualityData.approval_rate_percent}%
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{qualityData.approved_count} / {qualityData.total_question_bank_items} Approved</div>
                    </div>
                    <div className="card" style={{ padding: "14px" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Average Quality Score</div>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: "#818cf8", marginTop: "2px" }}>
                        {qualityData.average_quality_score}/10
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Structural + Semantic Rubric</div>
                    </div>
                    <div className="card" style={{ padding: "14px" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Duplicate Rate</div>
                      <div style={{ fontSize: "20px", fontWeight: 700, marginTop: "2px" }}>
                        {qualityData.duplicate_rate_percent}%
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Exact Hash & Semantic Match</div>
                    </div>
                  </div>

                  {/* Explicit Grounding & Hallucination Disclosures */}
                  <div className="card" style={{ padding: "18px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 10px" }}>RAG Grounding & Hallucination Status</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--border-card)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "12.5px" }}>Grounding Fidelity:</strong>
                          <span className="badge badge-warning" style={{ fontSize: "10.5px" }}>Not Measurable</span>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
                          {qualityData.grounding_fidelity?.reason || "Requires explicit factual ground-truth reference pairs to calculate grounding fidelity."}
                        </p>
                      </div>

                      <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--border-card)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "12.5px" }}>Hallucination Rate:</strong>
                          <span className="badge badge-warning" style={{ fontSize: "10.5px" }}>Not Measurable</span>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
                          {qualityData.hallucination_rate?.reason || "Requires human-annotated ground-truth verification data to measure hallucination rates."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 6: CONTINUAL MASTERY DYNAMICS                             */}
              {/* ------------------------------------------------------------- */}
              {activeTab === "mastery" && masteryData && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="grid-2" style={{ gap: "14px" }}>
                    <div className="card" style={{ padding: "16px" }}>
                      <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 10px" }}>Control Group Mastery Progression</h4>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px" }}>
                        Baseline Mean: <strong>{masteryData.control_group?.mastery_before_mean ?? "—"}%</strong>
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px" }}>
                        Post-Assessment Mean: <strong>{masteryData.control_group?.mastery_after_mean ?? "—"}%</strong>
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--success)" }}>
                        Improvement &Delta;: <strong>{masteryData.control_group?.improvement_stats?.mean ?? "—"}%</strong>
                      </div>
                    </div>

                    <div className="card" style={{ padding: "16px", border: "1px solid rgba(6, 182, 212, 0.3)" }}>
                      <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 10px", color: "var(--cyan-accent)" }}>Treatment Group Mastery Progression</h4>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px" }}>
                        Baseline Mean: <strong>{masteryData.treatment_group?.mastery_before_mean ?? "—"}%</strong>
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px" }}>
                        Post-Assessment Mean: <strong>{masteryData.treatment_group?.mastery_after_mean ?? "—"}%</strong>
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--success)" }}>
                        Improvement &Delta;: <strong>{masteryData.treatment_group?.improvement_stats?.mean ?? "—"}%</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 7: RESEARCH LIMITATIONS & REPRODUCIBILITY                 */}
              {/* ------------------------------------------------------------- */}
              {activeTab === "limitations" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="card" style={{ padding: "18px" }}>
                    <h4 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 12px" }}>Explicit Scientific Research Limitations</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {(reportData?.research_limitations || []).map((lim, idx) => (
                        <div key={idx} style={{ padding: "12px 14px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid var(--border-card)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{lim.category}</strong>
                            <span className="badge badge-neutral" style={{ fontSize: "10.5px" }}>{lim.observation_type}</span>
                          </div>
                          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: "4px 0" }}>{lim.description}</p>
                          <div style={{ fontSize: "12px", color: "#818cf8" }}>Status: {lim.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reproducibility Versions */}
                  <div className="card" style={{ padding: "18px", fontSize: "12.5px", color: "var(--text-muted)" }}>
                    <div style={{ fontWeight: 600, color: "#f8fafc", marginBottom: "8px" }}>Scientific Reproducibility & Version Lock</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
                      <div>Adaptive Engine: <code>{selectedExp.adaptive_engine_version}</code></div>
                      <div>RAG Pipeline: <code>{selectedExp.rag_version}</code></div>
                      <div>Validator: <code>{selectedExp.validator_version}</code></div>
                      <div>LLM: <code>{selectedExp.gemini_model_version}</code></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Experiment Modal */}
        {isModalOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
            <div className="card" style={{ maxWidth: "600px", width: "100%", padding: "28px", maxHeight: "90vh", overflowY: "auto" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>Create Controlled Research Experiment</h3>

              <form onSubmit={handleCreateExperiment}>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-muted)" }}>Experiment Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Adaptive Convergence vs Static Assessment"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{ width: "100%", marginTop: "4px" }}
                  />
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-muted)" }}>Experiment Type</label>
                  <select
                    value={form.experiment_type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    style={{ width: "100%", marginTop: "4px" }}
                  >
                    <option value="adaptive_vs_static">1. Adaptive vs Static Assessment</option>
                    <option value="rag_vs_non_rag">2. RAG-Grounded vs Zero-Shot Generation</option>
                    <option value="validated_vs_unvalidated">3. Validated vs Unvalidated Questions</option>
                    <option value="personalized_vs_role_only">4. Personalized vs Role-Only</option>
                    <option value="mastery_vs_latest_score">5. Continual Mastery vs Single Score</option>
                  </select>
                </div>

                <div className="grid-2" style={{ gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-muted)" }}>Control Strategy (Group A)</label>
                    <input
                      type="text"
                      value={form.control_strategy}
                      onChange={(e) => setForm({ ...form, control_strategy: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-muted)" }}>Treatment Strategy (Group B)</label>
                    <input
                      type="text"
                      value={form.treatment_strategy}
                      onChange={(e) => setForm({ ...form, treatment_strategy: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-muted)" }}>Target Role</label>
                    <input
                      type="text"
                      value={form.target_role}
                      onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-muted)" }}>Sample Size Target</label>
                    <input
                      type="number"
                      min={10}
                      max={1000}
                      value={form.sample_size_target}
                      onChange={(e) => setForm({ ...form, sample_size_target: parseInt(e.target.value) || 50 })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-muted)" }}>Description & Scientific Hypothesis</label>
                  <textarea
                    rows={3}
                    placeholder="Document research objectives and expected comparative outcomes..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ width: "100%", marginTop: "4px" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Save Experiment</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
