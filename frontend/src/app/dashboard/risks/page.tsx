"use client";

import { useState, useEffect, useRef } from "react";
import { AlertTriangle, Zap, GitBranch, Activity } from "lucide-react";

const SEVERITY_COLOR: Record<string, { border: string; bg: string; text: string }> = {
  critical: { border: "#ef4444", bg: "#fef2f2", text: "#ef4444" },
  high:     { border: "#f97316", bg: "#fff7ed", text: "#f97316" },
  medium:   { border: "#eab308", bg: "#fefce8", text: "#ca8a04" },
  low:      { border: "#22c55e", bg: "#f0fdf4", text: "#16a34a" },
};

const ALL_RISKS = [
  { id: "r1", risk_type: "knowledge_silo",     severity: "critical", score: 0.94, description: "Single point of failure: payments module owned by 1 engineer. Marcus Rodriguez holds 73% of payments architecture knowledge with no documented handoff path.", predicted_at: new Date(Date.now() - 2 * 3600_000).toISOString() },
  { id: "r2", risk_type: "rationale_gap",      severity: "critical", score: 0.87, description: "Auth service has no documented decision rationale — 3 engineers departed in the last 90 days, taking architectural context with them.", predicted_at: new Date(Date.now() - 5 * 3600_000).toISOString() },
  { id: "r3", risk_type: "architectural_drift",severity: "high",     score: 0.71, description: "Contradiction detected: microservices decision (Q3) directly contradicts Q1 monolith commitment. GraphQL → REST revert pattern detected across 4 services.", predicted_at: new Date(Date.now() - 18 * 3600_000).toISOString() },
  { id: "r4", risk_type: "knowledge_gap",      severity: "high",     score: 0.68, description: "ML pipeline undocumented since lead engineer left 60 days ago. 0 decision nodes found for the ingestion → training → serving pathway.", predicted_at: new Date(Date.now() - 24 * 3600_000).toISOString() },
  { id: "r5", risk_type: "bus_factor",         severity: "medium",   score: 0.52, description: "Bus factor warning: Slack integration owned by 1 person (Jordan Lee). No secondary contributor detected in the last 6 months.", predicted_at: new Date(Date.now() - 3 * 24 * 3600_000).toISOString() },
  { id: "r6", risk_type: "stale_expertise",    severity: "low",      score: 0.31, description: "Stale expertise: React expertise last active 180 days ago. 2 team members hold React knowledge nodes with no recent commits or decisions.", predicted_at: new Date(Date.now() - 7 * 24 * 3600_000).toISOString() },
];

function ScoreBar({ score, color }: { score: number; color: string }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setWidth(score * 100); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [score]);

  return (
    <div ref={ref} style={{ height: "4px", background: "#F0F0F0", borderRadius: "2px", overflow: "hidden", marginBottom: "12px" }}>
      <div style={{ height: "100%", width: `${width}%`, background: color, borderRadius: "2px", transition: "width 0.9s cubic-bezier(.22,1,.36,1)" }} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, iconColor, glow }: { icon: React.ElementType; label: string; value: string | number; iconColor: string; glow?: boolean }) {
  return (
    <div className="tilt-card" style={{
      background: "#FFFFFF", border: "1px solid #EEEEEE", borderRadius: "14px", padding: "24px",
      boxShadow: glow ? `0 0 0 1px ${iconColor}22, 0 4px 24px ${iconColor}18` : "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${iconColor}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={iconColor} />
        </div>
        <span style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: "36px", fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: "#111" }}>{value}</div>
    </div>
  );
}

const TABS = ["All", "Critical", "High", "Medium", "Low"] as const;

export default function RisksPage() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<typeof TABS[number]>("All");
  const [fading, setFading] = useState(false);

  const filtered = ALL_RISKS.filter(r =>
    !dismissed.has(r.id) && (tab === "All" || r.severity === tab.toLowerCase())
  );

  function changeTab(t: typeof TABS[number]) {
    setFading(true);
    setTimeout(() => { setTab(t); setFading(false); }, 120);
  }

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.02em", color: "#111", marginBottom: "6px" }}>Risk Dashboard</h1>
        <p style={{ color: "#888", fontSize: "14px" }}>Active organizational risk signals — {ALL_RISKS.length} detected</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "28px" }}>
        <StatCard icon={AlertTriangle} label="Total Risks"   value={6}         iconColor="#ef4444" />
        <StatCard icon={Zap}          label="Critical"       value={2}         iconColor="#ff5050" glow />
        <StatCard icon={GitBranch}    label="Contradictions" value={1}         iconColor="#7b2fff" />
        <StatCard icon={Activity}     label="Consciousness"  value="84 / 100"  iconColor="#00e5cc" />
      </div>

      {/* Severity filter tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "#F5F5F5", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => changeTab(t)} style={{
            padding: "6px 18px", border: "none", borderRadius: "7px", cursor: "pointer",
            fontSize: "13px", fontWeight: 600, transition: "all 0.15s",
            background: tab === t ? "#FFFFFF" : "transparent",
            color: tab === t ? "#111" : "#888",
            boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
          }}>{t}</button>
        ))}
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px",
        opacity: fading ? 0 : 1, transition: "opacity 0.12s",
      }}>
        {filtered.map(risk => {
          const col = SEVERITY_COLOR[risk.severity] ?? SEVERITY_COLOR.low;
          return (
            <div key={risk.id} className="tilt-card" style={{
              background: "#FFFFFF", border: "1px solid #EEEEEE",
              borderLeft: `4px solid ${col.border}`,
              borderRadius: "14px", padding: "22px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              transition: "box-shadow 0.2s, transform 0.25s",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.12)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    background: col.bg, color: col.text, border: `1px solid ${col.border}33`,
                    borderRadius: "5px", padding: "2px 8px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                  }}>{risk.severity}</span>
                  <span style={{ background: "#F5F5F5", color: "#666", borderRadius: "5px", padding: "2px 8px", fontSize: "11px" }}>
                    {risk.risk_type.replace(/_/g, " ")}
                  </span>
                </div>
                <button onClick={() => setDismissed(p => new Set([...p, risk.id]))} style={{
                  background: "none", border: "1px solid #EEE", borderRadius: "6px",
                  padding: "3px 10px", fontSize: "11px", color: "#999", cursor: "pointer",
                }}>Dismiss</button>
              </div>
              <p style={{ color: "#333", fontSize: "13px", lineHeight: "1.6", marginBottom: "14px" }}>{risk.description}</p>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", color: "#AAA" }}>Risk Score</span>
                <span style={{ fontSize: "12px", fontFamily: "JetBrains Mono", color: col.text, fontWeight: 700 }}>{(risk.score * 100).toFixed(0)}%</span>
              </div>
              <ScoreBar score={risk.score} color={col.border} />
              <div style={{ fontSize: "11px", color: "#BBB" }}>Predicted {new Date(risk.predicted_at).toLocaleString()}</div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px", color: "#22c55e", fontSize: "14px" }}>
            No risks in this category ✓
          </div>
        )}
      </div>
    </div>
  );
}
