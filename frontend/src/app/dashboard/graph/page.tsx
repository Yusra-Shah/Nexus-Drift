"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Network, X } from "lucide-react";
import type { GraphNode } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";

const GraphCanvas = dynamic(() => import("@/components/GraphCanvas"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: "100%", height: "100%", background: "#0a0a0a", borderRadius: "12px",
      border: "1px solid #2a2a2a", display: "flex", alignItems: "center",
      justifyContent: "center", color: "#555", fontSize: "14px",
    }}>
      Loading graph engine…
    </div>
  ),
});

const MOCK_NODES: GraphNode[] = [
  // Decision nodes (teal) — 8
  { id: "d1", node_type: "Decision", title: "Migrate auth to microservices", description: "Break auth into dedicated service for independent scaling and security isolation. Confidence: 0.88.", outcome: "pending", decision_type: "architectural", created_at: new Date(Date.now() - 2 * 24 * 3600_000).toISOString() },
  { id: "d2", node_type: "Decision", title: "Adopt Neo4j as primary graph store", description: "Chose Neo4j over TigerGraph after performance benchmarks. ACID-compliant, native Cypher support.", outcome: "success", decision_type: "architectural", created_at: new Date(Date.now() - 30 * 24 * 3600_000).toISOString() },
  { id: "d3", node_type: "Decision", title: "Deprecate v1 REST API", description: "All consumers must migrate to v2 GraphQL by Q4. Legacy clients given 6-month sunset.", outcome: "pending", decision_type: "technical", created_at: new Date(Date.now() - 14 * 24 * 3600_000).toISOString() },
  { id: "d4", node_type: "Decision", title: "Q3 architecture decision: microservices", description: "Organization committed to service decomposition strategy in Q3 planning.", outcome: "success", decision_type: "organizational", created_at: new Date(Date.now() - 60 * 24 * 3600_000).toISOString() },
  { id: "d5", node_type: "Decision", title: "Adopt Clerk for authentication", description: "Replacing custom JWT implementation with Clerk. Reduces maintenance burden by estimated 40%.", outcome: "pending", decision_type: "technical", created_at: new Date(Date.now() - 5 * 24 * 3600_000).toISOString() },
  { id: "d6", node_type: "Decision", title: "Switch to Turbopack for Next.js builds", description: "Build times reduced from 42s to 14s in testing. Adopted as default for all frontend services.", outcome: "success", decision_type: "technical", created_at: new Date(Date.now() - 10 * 24 * 3600_000).toISOString() },
  { id: "d7", node_type: "Decision", title: "Standardize on Python 3.11 across services", description: "Locked Python version to 3.11 for all backend services to ensure consistency in CI.", outcome: "success", decision_type: "technical", created_at: new Date(Date.now() - 45 * 24 * 3600_000).toISOString() },
  { id: "d8", node_type: "Decision", title: "Migrate billing to Stripe", description: "Replaced legacy payment processor. Migration completed in 8 weeks with zero downtime.", outcome: "success", decision_type: "architectural", created_at: new Date(Date.now() - 90 * 24 * 3600_000).toISOString() },
  // Risk nodes (red) — 6
  { id: "r1", node_type: "Risk", title: "Bus factor risk: payments team", description: "Marcus Rodriguez is sole owner of payments module. Bus factor: 1. Critical risk score: 0.94.", created_at: new Date(Date.now() - 1 * 24 * 3600_000).toISOString() },
  { id: "r2", node_type: "Risk", title: "Auth rationale gap after departures", description: "3 engineers with auth context departed. No knowledge handoff documented.", created_at: new Date(Date.now() - 3 * 24 * 3600_000).toISOString() },
  { id: "r3", node_type: "Risk", title: "ML pipeline knowledge gap", description: "0 decision nodes for ML ingestion→training→serving. Lead departed 60 days ago.", created_at: new Date(Date.now() - 7 * 24 * 3600_000).toISOString() },
  { id: "r4", node_type: "Risk", title: "Slack integration bus factor: 1", description: "Jordan Lee is sole contributor to Slack connector. No knowledge transfer in 6 months.", created_at: new Date(Date.now() - 12 * 24 * 3600_000).toISOString() },
  { id: "r5", node_type: "Risk", title: "React expertise stale: 180 days", description: "Last active React expertise node is 180 days old. 2 knowledge holders, no recent activity.", created_at: new Date(Date.now() - 20 * 24 * 3600_000).toISOString() },
  { id: "r6", node_type: "Risk", title: "DevOps single point of failure", description: "Infrastructure automation concentrated in 1 engineer. CI/CD pipeline undocumented.", created_at: new Date(Date.now() - 25 * 24 * 3600_000).toISOString() },
  // Person nodes (violet) — 5
  { id: "p1", node_type: "Person", name: "Sarah Chen", title: "Sarah Chen — Lead Engineer", description: "Lead distributed systems engineer. Expert in consensus protocols, API design, and Kafka.", role: "Lead Engineer", team: "Platform", expertise_domains: ["distributed-systems", "api-design", "kafka"] },
  { id: "p2", node_type: "Person", name: "James Park", title: "James Park — ML Engineer", description: "Machine learning engineer focused on the ingestion and training pipelines.", role: "ML Engineer", team: "AI", expertise_domains: ["ml-pipeline", "python", "data-engineering"] },
  { id: "p3", node_type: "Person", name: "Priya Nair", title: "Priya Nair — Security Engineer", description: "Security and auth specialist. Led the original JWT implementation.", role: "Security Engineer", team: "Platform", expertise_domains: ["auth", "security", "cryptography"] },
  { id: "p4", node_type: "Person", name: "Alex Kim", title: "Alex Kim — Frontend Lead", description: "Frontend lead. Owns Next.js architecture and design system.", role: "Frontend Lead", team: "Product", expertise_domains: ["frontend", "nextjs", "design-systems"] },
  { id: "p5", node_type: "Person", name: "Jordan Lee", title: "Jordan Lee — DevOps Engineer", description: "DevOps engineer. Owns Slack integration and CI/CD pipeline.", role: "DevOps Engineer", team: "Infrastructure", expertise_domains: ["devops", "ci-cd", "slack-integration"] },
  // Concept nodes (blue) — 4
  { id: "c1", node_type: "Concept", title: "Organizational Cognition", description: "The collective intelligence, memory, and decision-making capacity of the organization as a system." },
  { id: "c2", node_type: "Concept", title: "Knowledge Graph", description: "Graph-based representation of organizational decisions, people, risks, and relationships." },
  { id: "c3", node_type: "Concept", title: "Bus Factor", description: "The minimum number of team members who must be unavailable before a project stalls." },
  { id: "c4", node_type: "Concept", title: "Decision DNA", description: "The complete chain of reasoning, context, and evidence behind an architectural decision." },
  // Contradiction nodes (orange) — 2
  { id: "x1", node_type: "Contradiction", title: "Contradicts: monolith strategy", description: "Q3 microservices decision contradicts the Q1 monolith commitment. 4 services mid-migration with no resolved direction." },
  { id: "x2", node_type: "Contradiction", title: "Contradicts: REST API deprecation", description: "New services are being built on v1 REST while v1 deprecation is in progress. Conflicting signals detected." },
];

const NODE_COLORS: Record<string, string> = {
  Decision: "#00e5cc",
  Risk: "#ef4444",
  Person: "#7b2fff",
  Concept: "#3b82f6",
  Contradiction: "#f97316",
};

const TYPE_COUNTS = Object.entries(
  MOCK_NODES.reduce((acc, n) => { acc[n.node_type] = (acc[n.node_type] ?? 0) + 1; return acc; }, {} as Record<string, number>)
);

export default function GraphPage() {
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [filter, setFilter] = useState<string>("All");

  const filtered = filter === "All" ? MOCK_NODES : MOCK_NODES.filter((n) => n.node_type === filter);

  const handleNodeClick = useCallback((node: GraphNode) => { setSelected(node); }, []);

  return (
    <div style={{ height: "calc(100vh - 96px)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Network size={28} color="#00e5cc" />
          <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.01em", color: "#ffffff" }}>
            Knowledge Graph
          </h1>
        </div>
        {/* Type filter pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["All", "Decision", "Risk", "Person", "Concept", "Contradiction"].map((type) => (
            <button key={type} onClick={() => setFilter(type)} style={{
              padding: "6px 14px",
              background: filter === type ? (NODE_COLORS[type] ?? "#00e5cc") : "#1a1a1a",
              color: filter === type ? "#000" : "#888",
              border: "1px solid " + (filter === type ? "transparent" : "#2a2a2a"),
              borderRadius: "999px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
            }}>{type}</button>
          ))}
        </div>
      </div>

      {/* Canvas + detail panel */}
      <div style={{ flex: 1, display: "flex", gap: "16px", minHeight: 0 }}>
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          <GraphCanvas nodes={filtered} onNodeClick={handleNodeClick} />
        </div>

        {selected && (
          <div style={{
            width: "300px", flexShrink: 0, background: "#111111", border: "1px solid #2a2a2a",
            borderRadius: "12px", padding: "20px", overflowY: "auto",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <StatusBadge status={selected.node_type} />
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: 0 }}>
                <X size={18} />
              </button>
            </div>
            <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#ffffff", marginBottom: "12px", lineHeight: "1.4" }}>
              {selected.title ?? selected.name ?? "Node"}
            </h2>
            {selected.description && (
              <p style={{ color: "#888", fontSize: "13px", lineHeight: "1.6", marginBottom: "14px" }}>{selected.description}</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {selected.role && <div><span style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Role</span><div style={{ fontSize: "13px", color: "#aaa", marginTop: "2px" }}>{selected.role}</div></div>}
              {selected.team && <div><span style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Team</span><div style={{ fontSize: "13px", color: "#aaa", marginTop: "2px" }}>{selected.team}</div></div>}
              {selected.outcome && <div><span style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Outcome</span><div style={{ fontSize: "13px", color: "#00e5cc", marginTop: "2px" }}>{selected.outcome}</div></div>}
              {selected.decision_type && <div><span style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Type</span><div style={{ fontSize: "13px", color: "#aaa", marginTop: "2px" }}>{selected.decision_type}</div></div>}
              {selected.expertise_domains && selected.expertise_domains.length > 0 && (
                <div>
                  <span style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Expertise</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                    {selected.expertise_domains.map((d) => (
                      <span key={d} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "4px", padding: "2px 8px", fontSize: "11px", color: "#00e5cc" }}>{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div style={{ marginTop: "12px", display: "flex", gap: "24px", flexShrink: 0, flexWrap: "wrap" }}>
        <span style={{ fontSize: "12px", color: "#555" }}>
          Showing <b style={{ color: "#888" }}>{filtered.length}</b> of <b style={{ color: "#888" }}>{MOCK_NODES.length}</b> nodes · ~47 edges
        </span>
        {TYPE_COUNTS.map(([type, count]) => (
          <span key={type} style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: NODE_COLORS[type] ?? "#888", display: "inline-block" }} />
            <span style={{ color: "#666" }}>{count} {type}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
