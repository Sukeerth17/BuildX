import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "../store/useStore";
import { login } from "../api/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("compliance2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setToken = useStore((s) => s.setToken);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(username, password);
      setToken(data.access_token);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        position: "relative",
        zIndex: 1,
      }}
    >
      <div className="glass-strong fade-up" style={{ width: 420, padding: 36, borderRadius: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ComplianceAI
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--color-muted-foreground)" }}>
            Sign in to your compliance workspace
          </p>
        </div>
        {error && (
          <div
            style={{
              color: "var(--sev-critical)",
              marginBottom: 16,
              textAlign: "center",
              fontSize: 13,
              padding: 10,
              background: "color-mix(in oklab, var(--sev-critical) 12%, transparent)",
              borderRadius: 10,
            }}
          >
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
              style={{ width: "100%" }}
            />
          </div>
          <button type="submit" disabled={loading} className="glass-button" style={{ marginTop: 8, padding: 14, fontSize: 15 }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}