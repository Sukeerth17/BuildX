interface KPICardProps {
  label: string;
  value: string | number;
  color: string;
  icon?: string;
}

export default function KPICard({ label, value, color, icon }: KPICardProps) {
  return (
    <div
      className="glass fade-up"
      style={{
        flex: 1,
        padding: 22,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: color,
          opacity: 0.18,
          filter: "blur(30px)",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div
          style={{
            fontSize: 11,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 600,
          }}
        >
          {label}
        </div>
        {icon && <span style={{ fontSize: 18, opacity: 0.8 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em" }}>{value}</div>
      <div
        style={{
          marginTop: 14,
          height: 3,
          width: "100%",
          borderRadius: 2,
          background: "oklch(1 0 0 / 0.08)",
          overflow: "hidden",
        }}
      >
        <div style={{ width: "60%", height: "100%", background: color, borderRadius: 2 }} />
      </div>
    </div>
  );
}