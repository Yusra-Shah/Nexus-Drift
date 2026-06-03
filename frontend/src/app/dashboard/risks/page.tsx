"use client";

import { useState } from "react";
import { AlertTriangle, Zap, GitBranch, Activity } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

const SEVERITY_BORDER: Record<string, string> = {
  critical: "#ff5050",
  high:     "#ef4444",
  medium:   "#eab308",
  low:      "#22d3ee",
};

const MOCK_RISKS = [
  {
    id: "r1", risk_type: "knowledge_silo", severity: "critical", score: 0.94,
    description: "Single point of failure: payments module owned by 1 engineer. Marcus Rodriguez holds 73% of payments architecture knowledge with no documented handoff path.",
    predicted_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
  {
    id: "r2", risk_type: "rationale_gap", severity: "critical", score: 0.87,
    description: "Auth service has no documented decision rationale — 3 engineers departed in the last 90 days, taking architectural context with them.",
    predicted_at: new Date(Date.now() - 5 * 3600_000).toISOString(),
  },
  {
    id: "r3", risk_type: "architectural_drift", severity: "high", score: 0.71,
    description: "Contradiction detected: microservices decision (Q3) directly contradicts Q1 monolith commitment. GraphQL → REST revert pattern detected across 4 services.",
    predicted_at: new Date(Date.now() - 18 * 3600_000).toISOString(),
  },
  {
    id: "r4", risk_type: "knowledge_gap", severity: "high", score: 0.68,
    description: "ML pipeline undocumented since lead engineer left 60 days ago. 0 decision nodes found for the ingestion → training → serving pathway.",
    predicted_at: new Date(Date.now() - 24 * 3600_000).toISOString(),
  },
  {
    id: "r5", risk_type: "bus_factor", severity: "medium", score: 0.52,
    description: "Bus factor warning: Slack integration owned by 1 person (Jordan Lee). No secondary contributor detected in the last 6 months.",
    predicted_at: new Date(Date.now() - 3 * 24 * 3600_000).toISOString(),
  },
  {
    id: "r6", risk_type: "stale_expertise", severity: "low", score: 0.31,
    description: "Stale expertise: React expertise last active 180 days ago. 2 team members hold React knowledge nodes with no recent commits or decisions.",
    predicted_at: new Date(Date.now() - 7 * 24 * 3600_000).toISOString(),
  },
];

function StatCard({ icon: Icon, label, value, iconColor, glow }: {
  icon: React.ElementType; label: string; value: string | number; iconColor: string; glow?: boolean;
}) {
  return (
    <div style={{
      background: "#111111", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "24px",
      boxShadow: glow ? "0 0 20px rgba(255,80,80,0.25)" : "0 1px 4px rgba(0,0,0,0.6)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <Icon size={18} color={iconColor} />
        <span style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      </div>
      <div style={{ fontSize: "32px", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "#ffffff" }}>{value}</div>
    </div>
  );
}

export default function RisksPage() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const risks = MOCK_RISKS.filter((r) => !dismissed.has(r.id));

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-0.01em", marginBottom: "8px", color: "#ffffff" }}>
          Risk Dashboard
        </h1>
        <p style={{ color: "#888", fontSize: "14px" }}>Active organizational risk signals — 6 detected</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        <StatCard icon={AlertTriangle} label="Total Risks"   value={6}         iconColor="#ef4444" />
        <StatCard icon={Zap}          label="Critical"       value={2}         iconColor="#ff5050" glow />
        <StatCard icon={GitBranch}    label="Contradictions" value={1}         iconColor="#7b2fff" />
        <StatCard icon={Activity}     label="Consciousness"  value="84 / 100"  iconColor="#00e5cc" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {risks.map((risk) => (
          <div key={risk.id} style={{
            background: "#111111", border: "1px solid #2a2a2a",
            borderLeft: `3px solid ${SEVERITY_BORDER[risk.severity] ?? "#444"}`,
            borderRadius: "12px", padding: "24px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <span style={{
                    background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "4px",
                    padding: "2px 8px", fontSize: "11px", color: "#aaa", fontWeight: 500,
                  }}>{risk.risk_type.replace(/_/g, " ")}</span>
                  <StatusBadge status={risk.severity} />
                </div>
                <p style={{ color: "#cccccc", fontSize: "14px", marginBottom: "16px", lineHeight: "1.6" }}>{risk.description}</p>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#666" }}>Risk Score</span>
                    <span style={{ fontSize: "12px", fontFamily: "JetBrains Mono, monospace", color: "#00e5cc" }}>
                      {(risk.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ height: "4px", background: "#2a2a2a", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${Math.min(risk.score * 100, 100)}%`,
                      background: SEVERITY_BORDER[risk.severity] ?? "#00e5cc", borderRadius: "2px",
                    }} />
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "#555" }}>Predicted {new Date(risk.predicted_at).toLocaleString()}</div>
              </div>
              <button
                onClick={() => setDismissed((p) => new Set([...p, risk.id]))}
                style={{
                  padding: "6px 14px", background: "transparent", border: "1px solid #2a2a2a",
                  borderRadius: "6px", color: "#666", fontSize: "12px", cursor: "pointer", flexShrink: 0,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#444"; (e.currentTarget as HTMLButtonElement).style.color = "#ccc"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a2a"; (e.currentTarget as HTMLButtonElement).style.color = "#666"; }}
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
        {risks.length === 0 && (
          <div style={{ color: "#22c55e", textAlign: "center", padding: "64px 0", fontSize: "14px" }}>
            All risks dismissed — great work!
          </div>
        )}
      </div>
    </div>
  );
}
