import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AlertTriangle, Home, LayoutDashboard, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <div
      style={{
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          padding: "48px 32px",
          border: "1px solid var(--border-card)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            backgroundColor: "rgba(245, 158, 11, 0.12)",
            color: "var(--warning)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <AlertTriangle size={32} />
        </div>

        <h1 style={{ fontSize: "36px", fontWeight: 800, margin: "0 0 8px", color: "#f8fafc" }}>
          404
        </h1>

        <h2 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 12px", color: "#e2e8f0" }}>
          Page Not Found
        </h2>

        <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "28px", lineHeight: 1.5 }}>
          The page you are looking for does not exist or has been moved. Please check the URL or return to the platform home.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/" className="btn btn-secondary">
            <Home size={16} />
            <span>Return Home</span>
          </Link>
          {isAuthenticated && (
            <Link to="/dashboard" className="btn btn-primary">
              <LayoutDashboard size={16} />
              <span>Go to Dashboard</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
