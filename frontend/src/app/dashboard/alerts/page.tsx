"use client";

import { useState } from "react";
import { Eye, CheckCircle2 } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

const SEVERITY_BORDER: Record<string, string> = {
  critical: "#ff5050",
  high:     "#f97316",
  medium:   "#eab308",
  low:      "#22d3ee",
};

const MOCK_ALERTS = [
  {
    alert_id: "a1", severity: "critical",
    alert_type: "Contradiction Detected",
    explanation: "Decision 'Adopt microservices architecture' (2024-Q3) directly contradicts committed monolith strategy from Q1. 4 services are mid-migration with no reconciled decision node.",
    timestamp: new Date(Date.now() - 22 * 60_000).toISOString(), acknowledged: false,
  },
  {
    alert_id: "a2", severity: "critical",
    alert_type: "Critical Risk Threshold Exceeded",
    explanation: "Knowledge silo score for payments module reached 0.94 (threshold: 0.80). Marcus Rodriguez is the sole knowledge holder with no documented succession path.",
    timestamp: new Date(Date.now() - 1.5 * 3600_000).toISOString(), acknowledged: false,
  },
  {
    alert_id: "a3", severity: "critical",
    alert_type: "Agent Pipeline Stalled",
    explanation: "Ingestion agent has not produced output in 47 minutes. Last successful run: GitHub connector. Jira and Slack connectors are queued but blocked.",
    timestamp: new Date(Date.now() - 2 * 3600_000).toISOString(), acknowledged: false,
  },
  {
    alert_id: "a4", severity: "high",
    alert_type: "Bus Factor Warning",
    explanation: "Slack integration module has a bus factor of 1. Jordan Lee is the only contributor in the last 6 months. Recommend knowledge transfer session.",
    timestamp: new Date(Date.now() - 4 * 3600_000).toISOString(), acknowledged: false,
  },
  {
    alert_id: "a5", severity: "high",
    alert_type: "Knowledge Gap Detected",
    explanation: "ML pipeline (ingestion → training → serving) has 0 decision nodes and 0 person expertise edges. Lead departed 60 days ago with no documented handoff.",
    timestamp: new Date(Date.now() - 8 * 3600_000).toISOString(), acknowledged: false,
  },
  {
    alert_id: "a6", severity: "high",
    alert_type: "Stale Expertise Alert",
    explanation: "Auth service expertise last active 95 days ago. 3 engineers listed as domain experts have no recent activity signals from GitHub, Jira, or Slack.",
    timestamp: new Date(Date.now() - 14 * 3600_000).toISOString(), acknowledged: false,
  },
  {
    alert_id: "a7", severity: "medium",
    alert_type: "New Decision Node Created",
    explanation: "Parser agent extracted a new architectural decision: 'Migrate auth to Clerk'. Confidence: 0.88. Linked to 2 existing risk nodes. Review recommended.",
    timestamp: new Date(Date.now() - 22 * 3600_000).toISOString(), acknowledged: false,
  },
  {
    alert_id: "a8", severity: "medium",
    alert_type: "Expertise Edge Added",
    explanation: "Sarah Chen identified as expert in 'distributed-systems' and 'consensus-protocols' based on PR review patterns. Expertise graph updated automatically.",
    timestamp: new Date(Date.now() - 28 * 3600_000).toISOString(), acknowledged: false,
  },
];

export default function AlertsPage() {
  const [ackIds, setAckIds] = useState<Set<string>>(new Set());
  const [dismissIds, setDismissIds] = useState<Set<string>>(new Set());

  const visible = MOCK_ALERTS.filter((a) => !ackIds.has(a.alert_id) && !dismissIds.has(a.alert_id));
  const acked = MOCK_ALERTS.filter((a) => ackIds.has(a.alert_id));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <Eye size={28} color="#00e5cc" />
        <h1 style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-0.01em", color: "#ffffff" }}>
          Watchtower Feed
        </h1>
      </div>
      <p style={{ color: "#888", fontSize: "14px", marginBottom: "32px" }}>
        {visible.length} active alerts · {acked.length} acknowledged
      </p>

      {visible.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "64px 0" }}>
          <CheckCircle2 size={48} color="#22c55e" />
          <p style={{ color: "#22c55e", fontSize: "16px", fontWeight: 500 }}>All alerts resolved — system is healthy</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {visible.map((alert) => (
          <div key={alert.alert_id} style={{
            background: "#111111", border: "1px solid #2a2a2a",
            borderLeft: `3px solid ${SEVERITY_BORDER[alert.severity] ?? "#444"}`,
            borderRadius: "12px", padding: "24px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 600, color: "#ffffff" }}>{alert.alert_type}</span>
                  <StatusBadge status={alert.severity} />
                </div>
                <p style={{ color: "#aaaaaa", fontSize: "14px", lineHeight: "1.6", marginBottom: "12px" }}>{alert.explanation}</p>
                <span style={{ fontSize: "11px", color: "#555" }}>{new Date(alert.timestamp).toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <button
                  onClick={() => setAckIds((p) => new Set([...p, alert.alert_id]))}
                  style={{
                    padding: "8px 16px", background: "rgba(0,229,204,0.1)", border: "1px solid rgba(0,229,204,0.3)",
                    borderRadius: "8px", color: "#00e5cc", fontSize: "13px", cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,229,204,0.2)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,229,204,0.1)"; }}
                >
                  Acknowledge
                </button>
                <button
                  onClick={() => setDismissIds((p) => new Set([...p, alert.alert_id]))}
                  style={{
                    padding: "8px 16px", background: "transparent", border: "1px solid #2a2a2a",
                    borderRadius: "8px", color: "#666", fontSize: "13px", cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#444"; (e.currentTarget as HTMLButtonElement).style.color = "#ccc"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a2a"; (e.currentTarget as HTMLButtonElement).style.color = "#666"; }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ))}

        {acked.length > 0 && (
          <div style={{ marginTop: "8px" }}>
            <p style={{ fontSize: "12px", color: "#555", marginBottom: "12px" }}>Acknowledged ({acked.length})</p>
            {acked.map((alert) => (
              <div key={alert.alert_id} style={{
                background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "10px",
                padding: "16px 20px", marginBottom: "8px", opacity: 0.5,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <CheckCircle2 size={14} color="#22c55e" />
                  <span style={{ fontSize: "14px", color: "#666" }}>{alert.alert_type}</span>
                  <StatusBadge status={alert.severity} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
