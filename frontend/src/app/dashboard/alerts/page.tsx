"use client";

import { useEffect, useState } from "react";
import { Eye, CheckCircle2 } from "lucide-react";

const SEV_STYLE: Record<string, { border: string; bg: string; text: string; label: string }> = {
  critical: { border: "#ef4444", bg: "#fef2f2", text: "#DC2626", label: "CRITICAL" },
  high:     { border: "#f97316", bg: "#fff7ed", text: "#EA580C", label: "HIGH" },
  medium:   { border: "#eab308", bg: "#fefce8", text: "#CA8A04", label: "MEDIUM" },
};

type Alert = { alert_id: string; severity: string; alert_type: string; explanation: string; timestamp: string; acknowledged: boolean };

const SEED_ALERTS: Alert[] = [
  { alert_id:"a1", severity:"critical", alert_type:"Contradiction Detected",         explanation:"Decision 'Adopt microservices architecture' (2024-Q3) directly contradicts committed monolith strategy from Q1. 4 services mid-migration.", timestamp: new Date(Date.now()-22*60_000).toISOString(), acknowledged:false },
  { alert_id:"a2", severity:"critical", alert_type:"Critical Risk Threshold Exceeded",explanation:"Knowledge silo score for payments module reached 0.94 (threshold: 0.80). Marcus Rodriguez is sole knowledge holder with no documented succession.", timestamp: new Date(Date.now()-1.5*3600_000).toISOString(), acknowledged:false },
  { alert_id:"a3", severity:"critical", alert_type:"Agent Pipeline Stalled",          explanation:"Ingestion agent has not produced output in 47 minutes. Jira and Slack connectors queued but blocked by upstream failure.",                        timestamp: new Date(Date.now()-2*3600_000).toISOString(), acknowledged:false },
  { alert_id:"a4", severity:"high",     alert_type:"Bus Factor Warning",              explanation:"Slack integration module has bus factor 1. Jordan Lee is the only contributor in 6 months. Recommend knowledge transfer session.",                  timestamp: new Date(Date.now()-4*3600_000).toISOString(), acknowledged:false },
  { alert_id:"a5", severity:"high",     alert_type:"Knowledge Gap Detected",          explanation:"ML pipeline has 0 decision nodes and 0 person expertise edges. Lead departed 60 days ago with no documented handoff.",                              timestamp: new Date(Date.now()-8*3600_000).toISOString(), acknowledged:false },
  { alert_id:"a6", severity:"high",     alert_type:"Stale Expertise Alert",           explanation:"Auth service expertise last active 95 days ago. 3 engineers listed as domain experts have no recent activity signals.",                              timestamp: new Date(Date.now()-14*3600_000).toISOString(), acknowledged:false },
  { alert_id:"a7", severity:"medium",   alert_type:"New Decision Node Created",       explanation:"Parser agent extracted 'Migrate auth to Clerk'. Confidence: 0.88. Linked to 2 existing risk nodes. Review recommended.",                           timestamp: new Date(Date.now()-22*3600_000).toISOString(), acknowledged:false },
  { alert_id:"a8", severity:"medium",   alert_type:"Expertise Edge Added",            explanation:"Sarah Chen identified as expert in distributed-systems and consensus-protocols based on PR review patterns. Graph updated automatically.",             timestamp: new Date(Date.now()-28*3600_000).toISOString(), acknowledged:false },
];

const AUTO_ALERTS: Alert[] = [
  { alert_id:"auto1", severity:"high",   alert_type:"Drift Pattern Detected",    explanation:"Repeated revert pattern in services/auth: 3 rollbacks in 14 days. Scorer flagged architectural drift risk 0.74.",  timestamp: new Date().toISOString(), acknowledged:false },
  { alert_id:"auto2", severity:"critical",alert_type:"New Silo Risk: DevOps",    explanation:"Automated analysis found DevOps knowledge concentrated in 1 engineer. No documented runbooks. Score: 0.81.",          timestamp: new Date().toISOString(), acknowledged:false },
  { alert_id:"auto3", severity:"medium",  alert_type:"Concept Node Cluster Found",explanation:"Reasoning agent found 7 concept nodes related to 'observability' with no linked decision nodes. Knowledge gap likely.", timestamp: new Date().toISOString(), acknowledged:false },
];

function PulsingDot() {
  return (
    <span style={{ position: "relative", display: "inline-block", width: "10px", height: "10px", flexShrink: 0, marginRight: "6px" }}>
      <style>{`
        @keyframes ping { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(2);opacity:0} }
        .ping-ring { position:absolute;inset:0;border-radius:50%;background:#ef4444;animation:ping 1.4s cubic-bezier(0,0,.2,1) infinite; }
      `}</style>
      <span className="ping-ring" />
      <span style={{ position: "absolute", inset: "2px", borderRadius: "50%", background: "#ef4444" }} />
    </span>
  );
}

function SeverityMiniBar({ alerts }: { alerts: Alert[] }) {
  const counts = { critical: 0, high: 0, medium: 0 };
  alerts.forEach(a => { if (a.severity in counts) counts[a.severity as keyof typeof counts]++; });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "11px", color: "#AAA" }}>Distribution</span>
      <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", width: "120px" }}>
        {(["critical","high","medium"] as const).map(s => (
          <div key={s} style={{ width: `${(counts[s]/total)*100}%`, background: SEV_STYLE[s].border, transition: "width 0.4s" }} />
        ))}
      </div>
      {(["critical","high","medium"] as const).map(s => counts[s] > 0 && (
        <span key={s} style={{ fontSize: "11px", color: SEV_STYLE[s].text, fontWeight: 700 }}>{counts[s]} {s}</span>
      ))}
    </div>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(SEED_ALERTS);
  const [ackIds, setAckIds] = useState<Set<string>>(new Set());
  const [dismissIds, setDismissIds] = useState<Set<string>>(new Set());
  const [autoIdx, setAutoIdx] = useState(0);

  // Every 8s, inject a new mock alert at the top
  useEffect(() => {
    const itv = setInterval(() => {
      const next = AUTO_ALERTS[autoIdx % AUTO_ALERTS.length];
      const fresh = { ...next, alert_id: next.alert_id + "_" + Date.now(), timestamp: new Date().toISOString() };
      setAlerts(prev => [fresh, ...prev]);
      setAutoIdx(i => i + 1);
    }, 8000);
    return () => clearInterval(itv);
  }, [autoIdx]);

  const visible = alerts.filter(a => !ackIds.has(a.alert_id) && !dismissIds.has(a.alert_id));
  const acked = alerts.filter(a => ackIds.has(a.alert_id));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Eye size={24} color="#00e5cc" />
          <h1 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.02em", color: "#111" }}>Watchtower Feed</h1>
        </div>
        <SeverityMiniBar alerts={visible} />
      </div>
      <p style={{ color: "#888", fontSize: "14px", marginBottom: "28px" }}>
        {visible.length} active · {acked.length} acknowledged · auto-refreshing every 8s
      </p>

      {visible.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", padding: "56px 0" }}>
          <CheckCircle2 size={44} color="#22c55e" />
          <p style={{ color: "#22c55e", fontSize: "16px", fontWeight: 600 }}>All alerts resolved — system is healthy</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {visible.map(alert => {
          const s = SEV_STYLE[alert.severity] ?? SEV_STYLE.medium;
          return (
            <div key={alert.alert_id} className="tilt-card" style={{
              background: "#FFFFFF", border: "1px solid #EEEEEE",
              borderLeft: `4px solid ${s.border}`,
              borderRadius: "14px", padding: "20px",
              boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
              animation: "pageFadeIn 0.3s ease forwards",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "14px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    {alert.severity === "critical" && <PulsingDot />}
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#111" }}>{alert.alert_type}</span>
                    <span style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}33`, padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>{s.label}</span>
                  </div>
                  <p style={{ color: "#555", fontSize: "13px", lineHeight: "1.6", marginBottom: "10px" }}>{alert.explanation}</p>
                  <span style={{ fontSize: "11px", color: "#CCC" }}>{new Date(alert.timestamp).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button onClick={() => setAckIds(p => new Set([...p, alert.alert_id]))} style={{
                    padding: "7px 14px", background: "#F0FDFB", border: "1px solid #99F6E4",
                    borderRadius: "8px", color: "#0D9488", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  }}>Acknowledge</button>
                  <button onClick={() => setDismissIds(p => new Set([...p, alert.alert_id]))} style={{
                    padding: "7px 14px", background: "#FAFAFA", border: "1px solid #EEEEEE",
                    borderRadius: "8px", color: "#888", fontSize: "12px", cursor: "pointer",
                  }}>Dismiss</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {acked.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <p style={{ fontSize: "12px", color: "#CCC", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Acknowledged ({acked.length})</p>
          {acked.map(a => (
            <div key={a.alert_id} style={{ background: "#FAFAFA", border: "1px solid #F0F0F0", borderRadius: "10px", padding: "12px 16px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "10px", opacity: 0.6 }}>
              <CheckCircle2 size={14} color="#22c55e" />
              <span style={{ fontSize: "13px", color: "#888" }}>{a.alert_type}</span>
              <span style={{ background: SEV_STYLE[a.severity]?.bg, color: SEV_STYLE[a.severity]?.text, padding: "1px 7px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>{a.severity}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
