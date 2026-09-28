import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Code2,
  LayoutDashboard,
  PlayCircle,
  History,
  BarChart3,
  User,
  LogOut,
  Calendar,
  ShieldAlert,
  FlaskConical,
  Activity,
  ShieldCheck,
  Briefcase,
  Users,
  LogIn,
  UserPlus,
  Home,
} from "lucide-react";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/jobs", label: "Jobs", icon: Briefcase },
    { to: "/interview/start", label: "Practice", icon: PlayCircle },
    { to: "/learning-roadmap", label: "Roadmap", icon: Calendar },
    { to: "/history", label: "History", icon: History },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/profile", label: "Profile", icon: User },
  ];

  if (user?.is_admin) {
    navLinks.push({ to: "/recruiter", label: "Hiring Portal", icon: Users });
    navLinks.push({ to: "/research", label: "Research Lab", icon: FlaskConical });
    navLinks.push({ to: "/admin/system-health", label: "System Health", icon: Activity });
    navLinks.push({ to: "/admin/security-audit", label: "Security Audit", icon: ShieldCheck });
    navLinks.push({ to: "/admin", label: "Admin", icon: ShieldAlert });
  }

  return (
    <header
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-subtle)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "68px",
        }}
      >
        {/* Brand Logo */}
        <Link
          to={isAuthenticated ? "/dashboard" : "/"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Code2 size={22} color="#ffffff" />
          </div>
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              CodeVigilant
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#06b6d4",
                  backgroundColor: "rgba(6, 182, 212, 0.12)",
                  border: "1px solid rgba(6, 182, 212, 0.3)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  letterSpacing: "0.05em",
                }}
              >
                AI
              </span>
            </div>
          </div>
        </Link>

        {/* Navigation Items */}
        {isAuthenticated ? (
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                location.pathname === link.to ||
                (link.to !== "/dashboard" && location.pathname.startsWith(link.to));

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontSize: "13.5px",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "#ffffff" : "var(--text-secondary)",
                    backgroundColor: isActive
                      ? "rgba(99, 102, 241, 0.15)"
                      : "transparent",
                    border: isActive
                      ? "1px solid rgba(99, 102, 241, 0.3)"
                      : "1px solid transparent",
                    transition: "all 0.15s ease",
                    textDecoration: "none",
                  }}
                >
                  <Icon size={16} color={isActive ? "#818cf8" : "currentColor"} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        ) : (
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: location.pathname === "/" ? 600 : 500,
                color: location.pathname === "/" ? "#ffffff" : "var(--text-secondary)",
                textDecoration: "none",
              }}
            >
              <Home size={16} />
              <span>Home</span>
            </Link>
            <Link
              to="/jobs"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: location.pathname === "/jobs" ? 600 : 500,
                color: location.pathname === "/jobs" ? "#ffffff" : "var(--text-secondary)",
                textDecoration: "none",
              }}
            >
              <Briefcase size={16} />
              <span>Explore Jobs</span>
            </Link>
          </nav>
        )}

        {/* Right Section: User Profile or Auth CTA buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {isAuthenticated ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "4px 10px",
                  backgroundColor: "var(--bg-surface)",
                  borderRadius: "20px",
                  border: "1px solid var(--border-card)",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: "var(--primary)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--text-primary)",
                    fontWeight: 500,
                    maxWidth: "120px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user?.full_name || user?.email?.split("@")[0]}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
                title="Log out"
                style={{
                  padding: "7px 12px",
                  color: "var(--text-secondary)",
                  borderColor: "var(--border-card)",
                }}
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link
                to="/login"
                className="btn btn-outline btn-sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  fontSize: "13.5px",
                  textDecoration: "none",
                }}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  fontSize: "13.5px",
                  textDecoration: "none",
                }}
              >
                <UserPlus size={15} />
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
