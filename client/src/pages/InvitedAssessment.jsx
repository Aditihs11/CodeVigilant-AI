import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { invitationsAPI } from "../services/api";
import {
  Play,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Code2,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function InvitedAssessment() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      verifyInvitation();
    }
  }, [token]);

  const verifyInvitation = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invitationsAPI.verifyToken(token);
      setInvitation(data);
    } catch (err) {
      setError(err.message || "Invalid or expired assessment invitation token");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      setStarting(true);
      setError(null);
      const res = await invitationsAPI.startAssessment(token);
      const assessmentId = res.assessment_id;
      // Navigate to assessment session
      navigate(`/interview/${assessmentId}`);
    } catch (err) {
      setError(err.message || "Failed to start invited assessment");
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "75vh", flexDirection: "column", gap: "16px" }}>
        <div className="spinner spinner-lg"></div>
        <p style={{ color: "var(--text-secondary)" }}>Verifying assessment authorization...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 0 60px" }}>
      <div className="container" style={{ maxWidth: "720px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span className="badge badge-primary">Candidate Assessment Portal</span>
            <span className="badge badge-success">Single-Use Secure Token</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
            {invitation?.job_title || "Technical Hiring Assessment"}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "6px" }}>
            You have been invited to complete a calibrated multi-section technical assessment.
          </p>
        </div>

        {error ? (
          <div className="card" style={{ padding: "32px", textAlign: "center" }}>
            <AlertCircle size={40} color="#ef4444" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "18px", color: "#f8fafc", marginBottom: "8px" }}>
              Invitation Verification Failed
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
              {error}
            </p>
            <button onClick={() => navigate("/dashboard")} className="btn btn-outline">
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: "32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", padding: "16px", borderRadius: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "12px", marginBottom: "4px" }}>
                  <Clock size={15} color="#06b6d4" />
                  <span>Time Limit</span>
                </div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#f8fafc" }}>
                  {invitation?.duration_minutes || 60} Minutes
                </div>
              </div>

              <div style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", padding: "16px", borderRadius: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "12px", marginBottom: "4px" }}>
                  <ShieldCheck size={15} color="#10b981" />
                  <span>Attempt Tracking</span>
                </div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#f8fafc" }}>
                  Attempt {invitation?.attempts_used + 1} of {invitation?.allowed_attempts}
                </div>
              </div>
            </div>

            {/* Assessment Integrity Notice */}
            <div style={{ backgroundColor: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
              <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#818cf8", marginBottom: "4px" }}>
                Anti-Cheating & Integrity Monitored
              </div>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
                Tab switching, window blurs, and paste activity are tracked. Ensure you are in a quiet environment with a working microphone.
              </p>
            </div>

            {/* Launch Button */}
            <button
              onClick={handleStart}
              disabled={starting}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "15px", fontWeight: 700 }}
            >
              <Play size={16} />
              <span>{starting ? "Initializing Session..." : "Launch Technical Assessment"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
