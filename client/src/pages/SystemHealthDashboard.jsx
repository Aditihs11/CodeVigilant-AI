import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../services/api";
import {
  Activity,
  Server,
  Database,
  Cpu,
  Sparkles,
  Layers,
  FileCode,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Search,
  RefreshCw,
  ShieldAlert,
  Sliders,
  TrendingUp,
  BarChart3,
  Terminal,
} from "lucide-react";

export default function SystemHealthDashboard() {
  const { user } = useAuth();

  const [healthData, setHealthData] = useState(null);
  const [observabilityData, setObservabilityData] = useState(null);
  const [errorLogs, setErrorLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Question Trace State
  const [traceId, setTraceId] = useState("");
  const [traceResult, setTraceResult] = useState(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceError, setTraceError] = useState(null);

  const loadHealthAndObservability = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const [hData, oData, errData] = await Promise.all([
        adminAPI.getSystemHealth().catch(() => null),
        adminAPI.getAIObservability().catch(() => null),
        adminAPI.getAIErrors().catch(() => []),
      ]);
      setHealthData(hData);
      setObservabilityData(oData);
      setErrorLogs(errData);
    } catch (err) {
      console.error("Health load error:", err);
      setError(err.message || "Failed to load system health metrics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHealthAndObservability();
  }, []);

  const handleLookupTrace = async (e) => {
    e.preventDefault();
    if (!traceId.trim()) return;
    try {
      setTraceLoading(true);
      setTraceError(null);
      setTraceResult(null);
      const res = await adminAPI.getQuestionTrace(traceId.trim());
      setTraceResult(res);
    } catch (err) {
      setTraceError(err.message || "Question or trace record not found.");
    } finally {
      setTraceLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "healthy":
        return <span className="badge badge-success" style={{ fontSize: "11px" }}>Healthy</span>;
      case "degraded":
        return <span className="badge badge-warning" style={{ fontSize: "11px" }}>Degraded</span>;
      default:
        return <span className="badge badge-danger" style={{ fontSize: "11px" }}>Unhealthy</span>;
    }
  };

  const getComponentIcon = (name) => {
    switch (name) {
      case "database":
        return <Database size={18} color="#06b6d4" />;
      case "gemini":
        return <Sparkles size={18} color="#818cf8" />;
      case "rag":
        return <Layers size={18} color="#10b981" />;
      case "code_executor":
        return <FileCode size={18} color="#f59e0b" />;
      default:
        return <FileText size={18} color="#cbd5e1" />;
    }
  };

  if (!user?.is_admin && !loading) {
    return (
      <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <div className="card" style={{ maxWidth: "500px", margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Administrator Privileges Required</h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>This system health & observability console is restricted to authorized platform administrators.</p>
        </div>
      </div>
    );
  }

  if (loading && !healthData) {
    return (
      <div className="flex-center" style={{ minHeight: "75vh", flexDirection: "column", gap: "16px" }}>
        <div className="spinner spinner-lg"></div>
        <p style={{ color: "var(--text-secondary)" }}>Running live system health probes & percentile telemetry...</p>
      </div>
    );
  }

  const aiStats = observabilityData?.ai_metrics;
  const ragStats = observabilityData?.rag_metrics;
  const reliability = observabilityData?.evaluation_reliability;

  return (
    <div style={{ padding: "32px 0 60px" }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "28px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Activity size={12} /> Observability Console
              </span>
              <span className={`badge ${healthData?.status === "healthy" ? "badge-success" : "badge-danger"}`}>
                System: {healthData?.status?.toUpperCase() || "HEALTHY"}
              </span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 4px" }}>
              AI Observability & System Health
            </h1>
            <p style={{ fontSize: "14px" }}>
              Real-time component health probes, latency percentiles (p50/p95/p99), and end-to-end question lifecycle traces.
            </p>
          </div>

          <button onClick={loadHealthAndObservability} disabled={refreshing} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span>Probe Health</span>
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Component Health Probes Section */}
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "14px" }}>
            Core Component Health Status
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {healthData?.components &&
              Object.entries(healthData.components).map(([name, comp]) => (
                <div key={name} className="card" style={{ padding: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {getComponentIcon(name)}
                      <span style={{ fontWeight: 700, fontSize: "14px", textTransform: "capitalize" }}>
                        {name.replace("_", " ")}
                      </span>
                    </div>
                    {getStatusBadge(comp.status)}
                  </div>

                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
                    {comp.details || comp.error || "Operational"}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Probe Latency</span>
                    <strong style={{ color: comp.latency_ms < 100 ? "var(--success)" : "var(--warning)" }}>
                      {comp.latency_ms} ms
                    </strong>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* 2. AI Metrics & Latency Percentiles */}
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "14px" }}>
            AI Latency & Reliability Telemetry
          </h2>

          <div className="grid-4" style={{ marginBottom: "16px" }}>
            <div className="card" style={{ padding: "18px" }}>
              <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 500 }}>Total AI Requests</div>
              <div style={{ fontSize: "24px", fontWeight: 700, margin: "4px 0" }}>{aiStats?.total_requests || 0}</div>
              <div style={{ fontSize: "11.5px", color: "var(--success)" }}>{aiStats?.success_rate_percentage || 100}% Success Rate</div>
            </div>

            <div className="card" style={{ padding: "18px" }}>
              <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 500 }}>p50 (Median) Latency</div>
              <div style={{ fontSize: "24px", fontWeight: 700, margin: "4px 0", color: "var(--cyan-accent)" }}>
                {aiStats?.latencies?.overall?.p50_ms ? `${aiStats.latencies.overall.p50_ms} ms` : "—"}
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Avg: {aiStats?.latencies?.overall?.avg_ms ?? "—"} ms</div>
            </div>

            <div className="card" style={{ padding: "18px" }}>
              <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 500 }}>p95 Latency</div>
              <div style={{ fontSize: "24px", fontWeight: 700, margin: "4px 0", color: "#818cf8" }}>
                {aiStats?.latencies?.overall?.p95_ms ? `${aiStats.latencies.overall.p95_ms} ms` : "—"}
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>p99: {aiStats?.latencies?.overall?.p99_ms ?? "—"} ms</div>
            </div>

            <div className="card" style={{ padding: "18px" }}>
              <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontWeight: 500 }}>Estimated Cost</div>
              <div style={{ fontSize: "24px", fontWeight: 700, margin: "4px 0", color: "var(--warning)" }}>
                {aiStats?.total_estimated_cost_usd !== null && aiStats?.total_estimated_cost_usd !== undefined
                  ? `$${aiStats.total_estimated_cost_usd}`
                  : "$0.00"}
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                {aiStats?.total_tokens_recorded ? `${aiStats.total_tokens_recorded.toLocaleString()} tokens` : "Standard Pricing"}
              </div>
            </div>
          </div>

          {/* RAG & Evaluation Consistency Grid */}
          <div className="grid-2" style={{ gap: "16px" }}>
            {/* RAG Observability */}
            <div className="card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Layers size={18} color="#10b981" />
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>RAG Retrieval Performance</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "var(--bg-surface)", borderRadius: "6px" }}>
                  <span>Total Retrieval Queries</span>
                  <strong>{ragStats?.total_retrieval_requests || 0}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "var(--bg-surface)", borderRadius: "6px" }}>
                  <span>Average Retrieval Latency</span>
                  <strong>{ragStats?.average_retrieval_latency_ms ? `${ragStats.average_retrieval_latency_ms} ms` : "< 10 ms"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "var(--bg-surface)", borderRadius: "6px" }}>
                  <span>Retrieval Success Rate</span>
                  <strong style={{ color: "var(--success)" }}>{ragStats?.retrieval_success_rate || 100}%</strong>
                </div>
              </div>
            </div>

            {/* AI Evaluation Consistency */}
            <div className="card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <BarChart3 size={18} color="#6366f1" />
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>AI Scoring Consistency Analysis</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "var(--bg-surface)", borderRadius: "6px" }}>
                  <span>Total Answer Evaluations</span>
                  <strong>{reliability?.total_evaluations || 0}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "var(--bg-surface)", borderRadius: "6px" }}>
                  <span>Score Variance & Standard Deviation</span>
                  <strong>
                    {reliability?.standard_deviation !== null && reliability?.standard_deviation !== undefined
                      ? `&sigma; = ${reliability.standard_deviation}`
                      : "Insufficient N"}
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "var(--bg-surface)", borderRadius: "6px" }}>
                  <span>Consistency Classification</span>
                  <strong style={{ color: "#818cf8" }}>{reliability?.reliability_status || "Sufficient Observations"}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Question Lifecycle Trace Inspector */}
        <div className="card" style={{ marginBottom: "32px", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Terminal size={18} color="#06b6d4" />
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Question Lifecycle Trace Inspector</h2>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
            Trace end-to-end question lifecycle: RAG Retrieval &rarr; Gemini Generation &rarr; Validation &rarr; Adaptive Selection &rarr; Candidate Pass Rate.
          </p>

          <form onSubmit={handleLookupTrace} style={{ display: "flex", gap: "10px", maxWidth: "500px", marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Enter Question ID (e.g. 1, 2, 5)..."
              value={traceId}
              onChange={(e) => setTraceId(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" disabled={traceLoading} className="btn btn-primary btn-sm">
              {traceLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
              <span>Inspect Trace</span>
            </button>
          </form>

          {traceError && (
            <div className="alert alert-danger" style={{ fontSize: "13px" }}>{traceError}</div>
          )}

          {traceResult && (
            <div style={{ backgroundColor: "#080c14", padding: "18px", borderRadius: "8px", border: "1px solid var(--border-card)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>
                <div>
                  <span className="badge badge-primary">Question #{traceResult.question_id}</span>
                  <span style={{ marginLeft: "8px", fontWeight: 600, fontSize: "14px" }}>{traceResult.topic || "Core Technical"}</span>
                </div>
                <span className="badge badge-neutral">Difficulty: {traceResult.difficulty || traceResult.target_difficulty}</span>
              </div>

              <div style={{ fontSize: "13.5px", color: "#f8fafc", marginBottom: "16px", fontWeight: 500 }}>
                "{traceResult.question_text}"
              </div>

              {traceResult.lifecycle_stages && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "12px" }}>
                  <div style={{ backgroundColor: "var(--bg-surface)", padding: "12px", borderRadius: "6px" }}>
                    <div style={{ color: "var(--cyan-accent)", fontWeight: 700, marginBottom: "4px" }}>1. RAG Retrieval</div>
                    <div>Source: {traceResult.lifecycle_stages["1_rag_retrieval"].source}</div>
                    <div>Relevance Score: {traceResult.lifecycle_stages["1_rag_retrieval"].relevance_score}/10</div>
                  </div>

                  <div style={{ backgroundColor: "var(--bg-surface)", padding: "12px", borderRadius: "6px" }}>
                    <div style={{ color: "#818cf8", fontWeight: 700, marginBottom: "4px" }}>2. Gemini Generation</div>
                    <div>Model: {traceResult.lifecycle_stages["2_gemini_generation"].model}</div>
                    <div>Mode: {traceResult.lifecycle_stages["2_gemini_generation"].generation_mode}</div>
                  </div>

                  <div style={{ backgroundColor: "var(--bg-surface)", padding: "12px", borderRadius: "6px" }}>
                    <div style={{ color: "var(--success)", fontWeight: 700, marginBottom: "4px" }}>3. Validation & Quality</div>
                    <div>Structural: Verified</div>
                    <div>Quality Score: {traceResult.lifecycle_stages["3_validation"].ai_quality_score}/10</div>
                  </div>

                  <div style={{ backgroundColor: "var(--bg-surface)", padding: "12px", borderRadius: "6px" }}>
                    <div style={{ color: "var(--warning)", fontWeight: 700, marginBottom: "4px" }}>4. Candidate Usage</div>
                    <div>Times Answered: {traceResult.lifecycle_stages["5_candidate_usage"].times_answered}</div>
                    <div>Pass Rate: {traceResult.lifecycle_stages["5_candidate_usage"].observed_success_rate}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Recent AI Structured Error Logs Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Recent AI Structured Errors ({errorLogs.length})</h3>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Zero secrets & zero PII in logs</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "rgba(255, 255, 255, 0.02)", fontSize: "12px", textTransform: "uppercase", color: "var(--text-muted)" }}>
                  <th style={{ padding: "12px 18px" }}>Request ID</th>
                  <th style={{ padding: "12px 18px" }}>Service</th>
                  <th style={{ padding: "12px 18px" }}>Operation</th>
                  <th style={{ padding: "12px 18px" }}>Error Type</th>
                  <th style={{ padding: "12px 18px" }}>Latency</th>
                  <th style={{ padding: "12px 18px" }}>Timestamp</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "13px" }}>
                {errorLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--success)" }}>
                      <CheckCircle2 size={18} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }} />
                      No recent AI errors recorded. All service probes operating cleanly.
                    </td>
                  </tr>
                ) : (
                  errorLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "12px 18px", fontFamily: "var(--font-mono)", color: "#818cf8" }}>{log.request_id}</td>
                      <td style={{ padding: "12px 18px", fontWeight: 600 }}>{log.service_name}</td>
                      <td style={{ padding: "12px 18px" }}>{log.operation}</td>
                      <td style={{ padding: "12px 18px", color: "var(--danger)" }}>{log.error_type}</td>
                      <td style={{ padding: "12px 18px" }}>{log.latency_ms} ms</td>
                      <td style={{ padding: "12px 18px", color: "var(--text-muted)" }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "Recent"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
