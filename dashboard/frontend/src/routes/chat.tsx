import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore";
import { streamAIChat } from "../api/client";
import AppShell from "../components/AppShell";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "Why did our GDPR score drop?",
  "What are our top 3 critical risks?",
  "Which files need the most urgent attention?",
];

function ChatPage() {
  const navigate = useNavigate();
  const token = useStore((s) => s.token);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) navigate({ to: "/login" });
  }, [token, navigate]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const handleSubmit = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { id: Date.now(), role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setStreaming(true);
    const assistantId = Date.now() + 1;
    setMessages((p) => [...p, { id: assistantId, role: "assistant", content: "" }]);
    try {
      for await (const chunk of streamAIChat(text)) {
        setMessages((p) => p.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)));
      }
    } catch (e) {
      setMessages((p) =>
        p.map((m) => (m.id === assistantId ? { ...m, content: m.content + "\n[AI service unavailable]" } : m)),
      );
    } finally {
      setStreaming(false);
    }
  };

  return (
    <AppShell>
      <div className="fade-up" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>
          AI Compliance Assistant
        </h2>

        <div className="glass" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.length === 0 && (
              <div style={{ margin: "auto", textAlign: "center", color: "var(--color-muted-foreground)" }}>
                <div
                  style={{
                    fontSize: 56,
                    marginBottom: 12,
                    background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  ✦
                </div>
                <h3 style={{ margin: 0, fontWeight: 600, color: "var(--color-foreground)" }}>
                  How can I help with compliance today?
                </h3>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={m.role === "assistant" ? "glass" : ""}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  background:
                    m.role === "user"
                      ? "linear-gradient(135deg, var(--color-primary), var(--color-accent))"
                      : undefined,
                  color: m.role === "user" ? "var(--primary-foreground)" : "var(--color-foreground)",
                  padding: "12px 16px",
                  borderRadius: 16,
                  maxWidth: "72%",
                  fontSize: 14,
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                  boxShadow: m.role === "user" ? "0 6px 20px -8px oklch(0.7 0.18 25 / 0.6)" : undefined,
                }}
              >
                {m.content || (streaming && m.role === "assistant" ? "…" : "")}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div
            style={{
              padding: 20,
              borderTop: "1px solid var(--glass-border)",
              background: "oklch(1 0 0 / 0.04)",
            }}
          >
            {messages.length === 0 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                {STARTERS.map((s, i) => (
                  <button key={i} onClick={() => handleSubmit(s)} className="glass-button-ghost" style={{ fontSize: 12, borderRadius: 999 }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit(input);
                }}
                placeholder="Ask about compliance risks, GDPR, SOC 2…"
                disabled={streaming}
                className="glass-input"
                style={{ flex: 1, padding: 14, fontSize: 14 }}
              />
              <button
                onClick={() => handleSubmit(input)}
                disabled={streaming || !input.trim()}
                className="glass-button"
                style={{ padding: "0 24px" }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}