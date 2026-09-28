import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { interviewAPI } from "../services/api";
import {
  History as HistoryIcon,
  Search,
  Filter,
  Play,
  ArrowRight,
  AlertCircle,
  Clock,
  Award,
  Layers,
  ListChecks,
  FileCode,
  Terminal,
} from "lucide-react";

export default function History() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    const loadInterviews = async () => {
      try {
        setLoading(true);
        const data = await interviewAPI.getAll();
        setInterviews(data);
      } catch (err) {
        console.error("Failed to load interview history:", err);
        setError("Failed to load history records.");
      } finally {
        setLoading(false);
      }
    };

    loadInterviews();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 8) return "var(--success)";
    if (score >= 6) return "var(--warning)";
    return "var(--danger)";
  };

  const getModeBadge = (type) => {
    const t = (type || "interview").toLowerCase();
    if (t === "mcq") {
      return <span className="badge badge-neutral" style={{ color: "#06b6d4", borderColor: "rgba(6, 182, 212, 0.3)" }}>MCQ</span>;
    }
    if (t === "coding") {
      return <span className="badge badge-neutral" style={{ color: "#10b981", borderColor: "rgba(16, 185, 129, 0.3)" }}>Coding</span>;
    }
    return <span className="badge badge-neutral" style={{ color: "#818cf8", borderColor: "rgba(99, 102, 241, 0.3)" }}>AI Interview</span>;
  };

  const getStatusBadge = (status) => {
    if (status === "completed") {
      return <span className="badge badge-success">Completed</span>;
    }
    if (status === "in_progress") {
      return <span className="badge badge-warning">In Progress</span>;
    }
    return <span className="badge badge-neutral">Created</span>;
  };

  const getResumeRoute = (item) => {
    const t = (item.assessment_type || "interview").toLowerCase();
    if (t === "mcq") return `/assessment/mcq/${item.id}`;
    if (t === "coding") return `/assessment/coding/${item.id}`;
    return `/interview/${item.id}`;
  };

  const filteredInterviews = interviews.filter((item) => {
    const itemType = (item.assessment_type || "interview").toLowerCase();
    const matchesSearch = item.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || itemType === selectedType;
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "completed" && (item.status === "completed" || item.score !== null)) ||
      (selectedStatus === "in_progress" && item.status !== "completed" && item.score === null);
    return matchesSearch && matchesType && matchesStatus;
  });

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
            <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 6px" }}>
              Assessment History
            </h1>
            <p style={{ fontSize: "14.5px" }}>
              Track past MCQ tests, coding challenges, and mock interview performance records.
            </p>
          </div>

          <Link to="/interview/start" className="btn btn-primary">
            <Play size={16} />
            <span>New Assessment</span>
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Controls */}
        <div
          className="card"
          style={{
            marginBottom: "24px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", minWidth: "240px", flex: 1 }}>
            <input
              type="text"
              placeholder="Search by track or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: "36px" }}
            />
            <Search
              size={16}
              color="var(--text-muted)"
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
          </div>

          {/* Mode filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ width: "auto", minWidth: "140px" }}
            >
              <option value="all">All Modes</option>
              <option value="mcq">MCQ Assessment</option>
              <option value="coding">Coding Challenge</option>
              <option value="interview">AI Interview</option>
            </select>
          </div>

          {/* Status filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ width: "auto", minWidth: "140px" }}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="card flex-center" style={{ padding: "60px" }}>
            <div className="spinner spinner-lg"></div>
          </div>
        ) : filteredInterviews.length === 0 ? (
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
                backgroundColor: "var(--bg-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
                color: "var(--text-muted)",
              }}
            >
              <HistoryIcon size={28} />
            </div>
            <h3 style={{ fontSize: "18px", marginBottom: "6px" }}>
              {searchTerm || selectedType !== "all" || selectedStatus !== "all"
                ? "No matching records found"
                : "No assessment history yet"}
            </h3>
            <p style={{ fontSize: "14px", maxWidth: "400px", marginBottom: "20px" }}>
              {searchTerm || selectedType !== "all" || selectedStatus !== "all"
                ? "Try adjusting your search criteria or mode filters."
                : "Your completed assessments and AI feedback reports will be tracked here."}
            </p>
            <Link to="/interview/start" className="btn btn-primary">
              <Play size={16} />
              <span>Start an Assessment</span>
            </Link>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--text-muted)",
                    }}
                  >
                    <th style={{ padding: "16px 20px" }}>Session ID</th>
                    <th style={{ padding: "16px 20px" }}>Mode</th>
                    <th style={{ padding: "16px 20px" }}>Track / Role</th>
                    <th style={{ padding: "16px 20px" }}>Date</th>
                    <th style={{ padding: "16px 20px" }}>Status</th>
                    <th style={{ padding: "16px 20px" }}>Score</th>
                    <th style={{ padding: "16px 20px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: "14px" }}>
                  {filteredInterviews.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <td style={{ padding: "16px 20px", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)" }}>
                        #{item.id}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        {getModeBadge(item.assessment_type)}
                      </td>
                      <td style={{ padding: "16px 20px", fontWeight: 600 }}>
                        {item.role}
                      </td>
                      <td style={{ padding: "16px 20px", color: "var(--text-muted)" }}>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Recent"}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        {getStatusBadge(item.status)}
                      </td>
                      <td style={{ padding: "16px 20px", fontWeight: 700 }}>
                        {item.score !== null ? (
                          <span style={{ color: getScoreColor(item.score) }}>
                            {item.score} / 10
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>Pending</span>
                        )}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        {item.status === "completed" || item.score !== null ? (
                          <Link
                            to={`/assessment/${item.id}/results`}
                            className="btn btn-secondary btn-sm"
                          >
                            <span>View Report</span>
                            <ArrowRight size={14} />
                          </Link>
                        ) : (
                          <Link
                            to={getResumeRoute(item)}
                            className="btn btn-primary btn-sm"
                          >
                            <span>Resume</span>
                            <ArrowRight size={14} />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
