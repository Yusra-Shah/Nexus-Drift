"use client";

import { Clock } from "lucide-react";

const EVENT_TYPES: Record<string, { color: string; bg: string }> = {
  decision:    { color: "#00e5cc", bg: "rgba(0,229,204,0.12)" },
  risk:        { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  contradiction: { color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  agent:       { color: "#7b2fff", bg: "rgba(123,47,255,0.12)" },
};

const now = Date.now();
const MOCK_EVENTS = [
  {
    id: "e1", type: "agent", agent: "Ingestion Agent",
    title: "GitHub connector sync completed",
    description: "Ingested 14 PRs, 6 issues, and 3 README updates. 8 new artifacts queued for parsing.",
    ts: new Date(now - 18 * 60_000).toISOString(),
  },
  {
    id: "e2", type: "decision", agent: "Parser Agent",
    title: "Decision node created: Migrate auth to Clerk",
    description: "Extracted from PR #441 — confidence 0.88. Decision type: architectural. Outcome: pending.",
    ts: new Date(now - 47 * 60_000).toISOString(),
  },
  {
    id: "e3", type: "risk", agent: "Watchtower Agent",
    title: "Risk alert: payments knowledge silo reached 0.94",
    description: "Threshold 0.80 exceeded. Marcus Rodriguez identified as sole knowledge holder. Alert dispatched.",
    ts: new Date(now - 2.1 * 3600_000).toISOString(),
  },
  {
    id: "e4", type: "agent", agent: "Scorer Agent",
    title: "Consciousness score updated: 81 → 84",
    description: "Cycle 847 complete. Knowledge coherence +3, decision consistency stable, expertise coverage +2.",
    ts: new Date(now - 4 * 3600_000).toISOString(),
  },
  {
    id: "e5", type: "contradiction", agent: "Reasoning Agent",
    title: "Contradiction detected: microservices vs monolith",
    description: "Q3 microservices commitment contradicts Q1 monolith decision. 4 services mid-migration. Contradiction node created.",
    ts: new Date(now - 6 * 3600_000).toISOString(),
  },
  {
    id: "e6", type: "decision", agent: "Parser Agent",
    title: "Decision node created: Adopt Neo4j as graph store",
    description: "Extracted from Confluence page 'Architecture 2024'. Confidence: 0.95. Outcome: success. Linked to 3 existing nodes.",
    ts: new Date(now - 10 * 3600_000).toISOString(),
  },
  {
    id: "e7", type: "agent", agent: "Graph Writer",
    title: "Expertise edges added for Sarah Chen",
    description: "Domains: distributed-systems, consensus-protocols, API-design. Derived from PR review activity across 12 repositories.",
    ts: new Date(now - 18 * 3600_000).toISOString(),
  },
  {
    id: "e8", type: "risk", agent: "Watchtower Agent",
    title: "Risk alert: ML pipeline knowledge gap detected",
    description: "0 decision nodes for ingestion→training→serving pathway. Lead engineer departed 60 days ago. Severity: high.",
    ts: new Date(now - 1.1 * 24 * 3600_000).toISOString(),
  },
  {
    id: "e9", type: "agent", agent: "Parser Agent",
    title: "Artifact batch processed: Slack export",
    description: "Processed 234 messages from #architecture and #eng-decisions. Extracted 3 decisions, 7 person mentions, 2 concept nodes.",
    ts: new Date(now - 1.8 * 24 * 3600_000).toISOString(),
  },
  {
    id: "e10", type: "decision", agent: "Parser Agent",
    title: "Decision node created: Deprecate v1 REST API",
    description: "Sourced from Linear ticket ARCH-88. Decision type: technical. Confidence: 0.79. Affects 6 downstream services.",
    ts: new Date(now - 3 * 24 * 3600_000).toISOString(),
  },
  {
    id: "e11", type: "agent", agent: "Scorer Agent",
    title: "Weekly organizational health report generated",
    description: "Bus factor: 2 critical warnings. Memory completeness: 76%. Expertise coverage: 91%. Full report attached.",
    ts: new Date(now - 7 * 24 * 3600_000).toISOString(),
  },
  {
    id: "e12", type: "contradiction", agent: "Reasoning Agent",
    title: "Contradiction resolved: database selection",
    description: "Previous contradiction between PostgreSQL and MongoDB nodes resolved. Neo4j decision supersedes both for graph data. Node marked resolved.",
    ts: new Date(now - 14 * 24 * 3600_000).toISOString(),
  },
];

export default function TimelinePage() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <Clock size={28} color="#00e5cc" />
        <h1 style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-0.01em", color: "#ffffff" }}>
          Organizational Time Machine
        </h1>
      </div>
      <p style={{ color: "#888", fontSize: "14px", marginBottom: "40px" }}>
        {MOCK_EVENTS.length} events across the last 90 days · live agent activity
      </p>

      <div style={{ position: "relative", paddingLeft: "32px" }}>
        <div style={{
          position: "absolute", left: "7px", top: 0, bottom: 0, width: "2px",
          background: "linear-gradient(to bottom, #00e5cc44, #1a1a1a)",
        }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {MOCK_EVENTS.map((ev) => {
            const palette = EVENT_TYPES[ev.type] ?? EVENT_TYPES.agent;
            return (
              <div key={ev.id} style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", left: "-28px", top: "14px",
                  width: "12px", height: "12px", borderRadius: "50%",
                  background: palette.color, border: "2px solid #0a0a0a",
                  boxShadow: `0 0 8px ${palette.color}88`,
                }} />
                <div style={{
                  background: "#111111", border: "1px solid #2a2a2a", borderRadius: "12px",
                  padding: "18px 22px", transition: "border-color 0.15s ease",
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#444"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <span style={{
                      background: palette.bg, border: `1px solid ${palette.color}44`,
                      borderRadius: "4px", padding: "2px 8px", fontSize: "11px",
                      color: palette.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>{ev.type}</span>
                    <span style={{
                      background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "4px",
                      padding: "2px 8px", fontSize: "11px", color: "#666",
                    }}>{ev.agent}</span>
                    <span style={{ fontSize: "11px", color: "#555", fontFamily: "JetBrains Mono, monospace", marginLeft: "auto" }}>
                      {new Date(ev.ts).toLocaleString()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", marginBottom: "6px" }}>{ev.title}</h3>
                  <p style={{ color: "#888", fontSize: "13px", lineHeight: "1.5" }}>{ev.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
