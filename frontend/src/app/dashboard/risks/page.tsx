"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Zap, GitBranch, Activity } from "lucide-react";
import type { Risk } from "@/lib/api";
import { getRisks } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorMessage from "@/components/ErrorMessage";

const SEVERITY_BORDER: Record<string, string> = {
  critical: "#ff5050",
  high:     "#ef4444",
  medium:   "#eab308",
  low:      "#22d3ee",
};

function StatCard({
  icon: Icon,
  label,
  value,
  iconColor,
  glow,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconColor: string;
  glow?: boolean;
}) {
  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid #2a2a2a",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: glow ? "0 0 16px rgba(255,80,80,0.3)" : "0 1px 4px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <Icon size={18} color={iconColor} />
        <span style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: "32px", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "#ffffff" }}>
        {value}
      </div>
    </div>
  );
}

export default function RisksPage() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRisks()
      .then(setRisks)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const totalRisks = risks.length;
  const criticalRisks = risks.filter((r) => r.severity === "critical").length;
  const contradictions = 0; // populated from graph in real usage

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "40px",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            marginBottom: "8px",
            color: "#ffffff",
          }}
        >
          Risk Dashboard
        </h1>
        <p style={{ color: "#888", fontSize: "14px" }}>Active organizational risk signals</p>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <StatCard
          icon={AlertTriangle}
          label="Total Risks"
          value={loading ? "—" : totalRisks}
          iconColor="#ef4444"
        />
        <StatCard
          icon={Zap}
          label="Critical"
          value={loading ? "—" : criticalRisks}
          iconColor="#ff5050"
          glow={criticalRisks > 0}
        />
        <StatCard
          icon={GitBranch}
          label="Contradictions"
          value={loading ? "—" : contradictions}
          iconColor="#7b2fff"
        />
        <StatCard
          icon={Activity}
          label="Consciousness"
          value={loading ? "—/100" : "—/100"}
          iconColor="#00e5cc"
        />
      </div>

      {/* Risk list */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: "#111111",
                border: "1px solid #2a2a2a",
                borderRadius: "12px",
                padding: "24px",
              }}
            >
              <LoadingSkeleton lines={3} />
            </div>
          ))}
        </div>
      )}

      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && risks.length === 0 && (
        <div style={{ color: "#888", textAlign: "center", padding: "64px 0", fontSize: "14px" }}>
          No risks detected — system is healthy
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {risks.map((risk) => (
            <div
              key={risk.id}
              style={{
                background: "#111111",
                border: "1px solid #2a2a2a",
                borderLeft: `3px solid ${SEVERITY_BORDER[risk.severity] ?? "#444"}`,
                borderRadius: "12px",
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <span
                  style={{
                    background: "#1a1a1a",
                    border: "1px solid #2a2a2a",
                    borderRadius: "4px",
                    padding: "2px 8px",
                    fontSize: "11px",
                    color: "#aaa",
                    fontWeight: 500,
                  }}
                >
                  {risk.risk_type}
                </span>
                <StatusBadge status={risk.severity} />
              </div>

              <p style={{ color: "#cccccc", fontSize: "14px", marginBottom: "16px", lineHeight: "1.5" }}>
                {risk.description}
              </p>

              {/* Score bar */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: "#666" }}>Risk Score</span>
                  <span style={{ fontSize: "12px", fontFamily: "JetBrains Mono, monospace", color: "#00e5cc" }}>
                    {(risk.score * 100).toFixed(0)}%
                  </span>
                </div>
                <div
                  style={{
                    height: "4px",
                    background: "#2a2a2a",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(risk.score * 100, 100)}%`,
                      background: SEVERITY_BORDER[risk.severity] ?? "#00e5cc",
                      borderRadius: "2px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              <div style={{ fontSize: "11px", color: "#666" }}>
                Predicted{" "}
                {risk.predicted_at
                  ? new Date(risk.predicted_at).toLocaleString()
                  : "unknown"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
