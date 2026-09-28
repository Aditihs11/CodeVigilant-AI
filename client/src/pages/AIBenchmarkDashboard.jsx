import { useState, useEffect } from "react";
import { benchmarksAPI } from "../services/api";
import {
  Activity,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  BarChart2,
  RefreshCw,
} from "lucide-react";

export default function AIBenchmarkDashboard() {
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [benchmarkSuite, setBenchmarkSuite] = useState("gemini_generation_benchmark");

  useEffect(() => {
    fetchBenchmarkRuns();
  }, []);

  const fetchBenchmarkRuns = async () => {
    try {
      setLoading(true);
      const data = await benchmarksAPI.getRuns();
      setRuns(Array.isArray(data) ? data : []);
      if (data && data.length > 0) {
        setSelectedRun(data[0]);
      }
    } catch (err) {
      setError(err.message || "Failed to load benchmark runs");
    } finally {
      setLoading(false);
    }
  };

  const handleRunBenchmark = async () => {
    try {
      setRunning(true);
      setError(null);
      const result = await benchmarksAPI.runBenchmark({
        benchmark_suite: benchmarkSuite,
        sample_size: 10,
      });
      setSuccessMsg(`Benchmark run #${result.id} completed! Reliability: ${result.success_rate}%, Avg Latency: ${result.avg_latency_ms}ms.`);
      setTimeout(() => setSuccessMsg(""), 4000);
      fetchBenchmarkRuns();
    } catch (err) {
      setError(err.message || "Benchmark evaluation failed");
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "75vh", flexDirection: "column", gap: "16px" }}>
        <div className="spinner spinner-lg"></div>
        <p style={{ color: "var(--text-secondary)" }}>Loading AI benchmark telemetry...</p>
      </div>
    );
  }

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
              <span className="badge badge-primary">AI Observability</span>
              <span className="badge badge-neutral">Empirical Benchmarks</span>
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
              AI Model Reliability & Latency Benchmarks
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
              Statistical evaluation of LLM response latency, prompt template drift, and system availability.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              value={benchmarkSuite}
              onChange={(e) => setBenchmarkSuite(e.target.value)}
              className="input-field"
              style={{ padding: "8px 12px", fontSize: "13px", minWidth: "220px" }}
            >
              <option value="gemini_generation_benchmark">Gemini Generation Suite</option>
              <option value="adaptive_assessment_benchmark">Adaptive Assessment Suite</option>
              <option value="code_eval_benchmark">Code Sandbox Suite</option>
            </select>
            <button
              onClick={handleRunBenchmark}
              disabled={running}
              className="btn btn-primary"
            >
              {running ? <RefreshCw size={15} className="spinner" /> : <Play size={15} />}
              <span>{running ? "Evaluating..." : "Run Live Benchmark"}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success" style={{ marginBottom: "20px" }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Top KPIs of Selected Run */}
        {selectedRun && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
              marginBottom: "28px",
            }}
          >
            <div className="card" style={{ padding: "20px", borderLeft: "4px solid #10b981" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Success / Reliability Rate
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#10b981", marginTop: "8px" }}>
                {selectedRun.success_rate !== undefined ? `${selectedRun.success_rate}%` : "100%"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Model: {selectedRun.model_name || "gemini-3.6-flash"}
              </div>
            </div>

            <div className="card" style={{ padding: "20px", borderLeft: "4px solid #06b6d4" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Average Latency
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#06b6d4", marginTop: "8px" }}>
                {selectedRun.avg_latency_ms ? `${Math.round(selectedRun.avg_latency_ms)}ms` : "—"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                p95 Latency: {selectedRun.p95_latency_ms ? `${Math.round(selectedRun.p95_latency_ms)}ms` : "—"}
              </div>
            </div>

            <div className="card" style={{ padding: "20px", borderLeft: "4px solid #6366f1" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Sample Size
              </div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#f8fafc", marginTop: "8px" }}>
                {selectedRun.total_requests || selectedRun.sample_size || 0}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Requests evaluated
              </div>
            </div>
          </div>
        )}

        {/* Benchmark Run History Table */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 16px 0", color: "#f8fafc" }}>
            Benchmark Run History
          </h3>

          {runs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
              No empirical benchmark runs yet. Click "Run Live Benchmark" to evaluate system performance.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-card)", color: "var(--text-muted)", textAlign: "left" }}>
                    <th style={{ padding: "10px" }}>Run ID</th>
                    <th style={{ padding: "10px" }}>Benchmark Suite</th>
                    <th style={{ padding: "10px" }}>Model</th>
                    <th style={{ padding: "10px" }}>Success Rate</th>
                    <th style={{ padding: "10px" }}>Avg Latency</th>
                    <th style={{ padding: "10px" }}>p95 Latency</th>
                    <th style={{ padding: "10px" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRun(r)}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                        backgroundColor: selectedRun?.id === r.id ? "rgba(99, 102, 241, 0.1)" : "transparent",
                      }}
                    >
                      <td style={{ padding: "12px 10px", fontWeight: 600, color: "#f8fafc" }}>#{r.id}</td>
                      <td style={{ padding: "12px 10px", color: "#818cf8" }}>{r.benchmark_suite}</td>
                      <td style={{ padding: "12px 10px" }}>{r.model_name || "gemini-3.6-flash"}</td>
                      <td style={{ padding: "12px 10px" }}>
                        <span className="badge badge-success" style={{ fontWeight: 700 }}>
                          {r.success_rate}%
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px", color: "#06b6d4" }}>
                        {r.avg_latency_ms ? `${Math.round(r.avg_latency_ms)}ms` : "—"}
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        {r.p95_latency_ms ? `${Math.round(r.p95_latency_ms)}ms` : "—"}
                      </td>
                      <td style={{ padding: "12px 10px", color: "var(--text-muted)", fontSize: "12px" }}>
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
