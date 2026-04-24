import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useStore } from "../store/useStore";

const navItems = [
  { path: "/", label: "Overview" },
  { path: "/findings", label: "Findings" },
  { path: "/frameworks", label: "Frameworks" },
  { path: "/chat", label: "AI Chat" },
  { path: "/audit", label: "Audit Report" },
] as const;

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useStore((s) => s.logout);

  return (
    <nav
      className="glass-strong"
      style={{
        position: "fixed",
        top: 16,
        left: 16,
        right: 16,
        height: 64,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        zIndex: 1000,
        justifyContent: "space-between",
        borderRadius: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
          <span
            style={{
              background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Compliance
          </span>
          <span style={{ color: "var(--color-foreground)" }}>AI</span>
        </h1>
        <div style={{ display: "flex", gap: 4 }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  color: active ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                  fontWeight: active ? 600 : 500,
                  fontSize: 14,
                  padding: "8px 14px",
                  borderRadius: 10,
                  background: active ? "oklch(1 0 0 / 0.12)" : "transparent",
                  border: active ? "1px solid var(--glass-border)" : "1px solid transparent",
                  transition: "all 0.2s",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
      <button
        onClick={() => {
          logout();
          navigate({ to: "/login" });
        }}
        className="glass-button-ghost"
      >
        Logout
      </button>
    </nav>
  );
}