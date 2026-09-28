import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../services/api";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock,
  FileCheck,
  Code2,
  Database,
  EyeOff,
  Globe,
  Sliders,
  Terminal,
  Filter,
} from "lucide-react";

export default function SecurityAuditDashboard() {
  const { user } = useAuth();

  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningAudit, setRunningAudit] = useState(false);
  const [error, setError] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const loadLatestAudit = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getLatestSecurityAudit();
      setAuditData(data);
    } catch (err) {
      console.error("Failed to load security audit data", err);
      setError(err.response?.data?.detail || "Failed to load security audit results");
    } finally {
      setLoading(false);
    }
  };

  const handleRunAudit = async () => {
    try {
      setRunningAudit(true);
      setError(null);
      const result = await adminAPI.runSecurityAudit();
      setAuditData(result);
    } catch (err) {
      console.error("Failed to execute security audit", err);
      setError(err.response?.data?.detail || "Failed to execute security audit");
    } finally {
      setRunningAudit(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      loadLatestAudit();
    }
  }, [user]);

  if (!user?.is_admin) {
    return (
      <div style={{ maxWidth: 1200, margin: "40px auto", padding: "0 24px", textAlign: "center" }}>
        <div style={{ padding: "40px 24px", background: "#fef2f2", borderRadius: 12, border: "1px solid #fecaca" }}>
          <ShieldAlert size={48} style={{ color: "#dc2626", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#991b1b", marginBottom: 8 }}>Access Denied</h2>
          <p style={{ color: "#b91c1c", fontSize: 15 }}>
            Security Audit Console is strictly restricted to administrator accounts.
          </p>
        </div>
      </div>
    );
  }

  const categorySummary = auditData?.category_summary || {};
  const severityCounts = auditData?.severity_counts || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  const findings = auditData?.findings || [];

  const filteredFindings = severityFilter === "ALL"
    ? findings
    : findings.filter((f) => f.severity.toUpperCase() === severityFilter);

  const getSeverityBadgeColor = (sev) => {
    switch (sev?.toUpperCase()) {
      case "CRITICAL":
        return { bg: "#fef2f2", text: "#991b1b", border: "#f87171" };
      case "HIGH":
        return { bg: "#fff7ed", text: "#9a3412", border: "#fb923c" };
      case "MEDIUM":
        return { bg: "#fefce8", text: "#854d0e", border: "#facc15" };
      case "LOW":
        return { bg: "#f0fdf4", text: "#166534", border: "#4ade80" };
      case "INFO":
      default:
        return { bg: "#f8fafc", text: "#475569", border: "#cbd5e1" };
    }
  };

  const getStatusBadge = (status) => {
    if (status === "PASS") {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 12, background: "#ecfdf5", color: "#065f46", fontSize: 12, fontWeight: 600 }}>
          <CheckCircle2 size={14} /> PASS
        </span>
      );
    } else if (status === "WARNING") {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 12, background: "#fffbeb", color: "#92400e", fontSize: 12, fontWeight: 600 }}>
          <AlertTriangle size={14} /> WARNING
        </span>
      );
    } else {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 12, background: "#fef2f2", color: "#991b1b", fontSize: 12, fontWeight: 600 }}>
          <XCircle size={14} /> FAIL
        </span>
      );
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: "32px auto", padding: "0 24px", color: "#1e293b", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={24} style={{ color: "#2563eb" }} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                Security & Adversarial Audit Engine
              </h1>
              <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 14 }}>
                Automated adversarial defense evaluation, data isolation, and sandbox boundaries
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={handleRunAudit}
            disabled={runningAudit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 8,
              background: "#2563eb",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              fontSize: 14,
              cursor: runningAudit ? "not-allowed" : "pointer",
              opacity: runningAudit ? 0.7 : 1,
              boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
            }}
          >
            <RefreshCw size={16} className={runningAudit ? "animate-spin" : ""} />
            {runningAudit ? "Executing Security Audit..." : "Run Security Audit"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 24, padding: "12px 16px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading && !auditData ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: "0 auto 12px", color: "#2563eb" }} />
          <p>Loading security audit results...</p>
        </div>
      ) : (
        <>
          {/* Summary Overview Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
            <div style={{ background: "#fff", padding: "20px", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>
                Audit Status
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: auditData?.status === "completed" ? "#16a34a" : "#dc2626", display: "flex", alignItems: "center", gap: 8 }}>
                {auditData?.status === "completed" ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                {auditData?.status?.toUpperCase() || "UNKNOWN"}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
                Run: {auditData?.run_id || "N/A"}
              </div>
            </div>

            <div style={{ background: "#fff", padding: "20px", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>
                Total Checks
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>
                {auditData?.total_checks || 0}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                Automated defensive validations
              </div>
            </div>

            <div style={{ background: "#fff", padding: "20px", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>
                Passed Validations
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#16a34a" }}>
                {auditData?.passed_count || 0}
              </div>
              <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>
                100% verified controls
              </div>
            </div>

            <div style={{ background: "#fff", padding: "20px", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ color: "#64748b", fontSize: 13, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>
                Warnings / Info
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: severityCounts.HIGH > 0 ? "#dc2626" : "#eab308" }}>
                {auditData?.warning_count || 0}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                Architectural notices & findings
              </div>
            </div>
          </div>

          {/* Severity Breakdown Strip */}
          <div style={{ background: "#fff", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 28, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginRight: 8 }}>
              Findings by Severity:
            </span>
            <span style={{ padding: "4px 12px", borderRadius: 20, background: "#fef2f2", color: "#991b1b", fontSize: 13, fontWeight: 600, border: "1px solid #fecaca" }}>
              Critical: {severityCounts.CRITICAL || 0}
            </span>
            <span style={{ padding: "4px 12px", borderRadius: 20, background: "#fff7ed", color: "#9a3412", fontSize: 13, fontWeight: 600, border: "1px solid #fed7aa" }}>
              High: {severityCounts.HIGH || 0}
            </span>
            <span style={{ padding: "4px 12px", borderRadius: 20, background: "#fefce8", color: "#854d0e", fontSize: 13, fontWeight: 600, border: "1px solid #fef08a" }}>
              Medium: {severityCounts.MEDIUM || 0}
            </span>
            <span style={{ padding: "4px 12px", borderRadius: 20, background: "#f0fdf4", color: "#166534", fontSize: 13, fontWeight: 600, border: "1px solid #bbf7d0" }}>
              Low: {severityCounts.LOW || 0}
            </span>
            <span style={{ padding: "4px 12px", borderRadius: 20, background: "#f8fafc", color: "#475569", fontSize: 13, fontWeight: 600, border: "1px solid #e2e8f0" }}>
              Info: {severityCounts.INFO || 0}
            </span>
          </div>

          {/* Category Summary Matrix */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "24px", marginBottom: 28, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 16px", color: "#0f172a" }}>
              Security Defense Category Matrix
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
              {Object.entries(categorySummary).map(([cat, status]) => (
                <div
                  key={cat}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderRadius: 8,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>{cat}</span>
                  {getStatusBadge(status)}
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Findings Table */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  Detailed Security Findings & Recommendations ({findings.length})
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
                  Structured architectural findings and operational notices
                </p>
              </div>

              {/* Severity Filter Controls */}
              <div style={{ display: "flex", gap: 6 }}>
                {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      border: "1px solid",
                      borderColor: severityFilter === sev ? "#2563eb" : "#cbd5e1",
                      background: severityFilter === sev ? "#eff6ff" : "#fff",
                      color: severityFilter === sev ? "#2563eb" : "#475569",
                      cursor: "pointer",
                    }}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {filteredFindings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "36px 0", color: "#64748b" }}>
                <CheckCircle2 size={32} style={{ color: "#16a34a", margin: "0 auto 8px" }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No findings matching the selected severity filter.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredFindings.map((f, idx) => {
                  const colors = getSeverityBadgeColor(f.severity);
                  return (
                    <div
                      key={f.finding_id || idx}
                      style={{
                        padding: "16px",
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        background: colors.bg,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#fff", border: `1px solid ${colors.border}`, color: colors.text }}>
                            {f.severity}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
                            {f.title}
                          </span>
                          <span style={{ fontSize: 12, color: "#64748b" }}>({f.finding_id})</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", background: "#fff", padding: "2px 8px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                          Status: {f.status}
                        </span>
                      </div>

                      <div style={{ fontSize: 13, color: "#334155", marginBottom: 8 }}>
                        <strong>Component:</strong> <code>{f.component}</code> | <strong>Category:</strong> {f.category}
                      </div>

                      <div style={{ fontSize: 14, color: "#1e293b", marginBottom: 6 }}>
                        {f.description}
                      </div>

                      {f.evidence && (
                        <div style={{ fontSize: 12, color: "#475569", background: "#ffffff80", padding: "8px 12px", borderRadius: 6, marginBottom: 6, fontFamily: "monospace" }}>
                          <strong>Evidence:</strong> {f.evidence}
                        </div>
                      )}

                      {f.remediation && (
                        <div style={{ fontSize: 13, color: "#047857", fontWeight: 500 }}>
                          <strong>Recommendation:</strong> {f.remediation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
