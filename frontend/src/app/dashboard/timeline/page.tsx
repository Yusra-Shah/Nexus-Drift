"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import type { GraphNode } from "@/lib/api";
import { getGraphNodes } from "@/lib/api";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorMessage from "@/components/ErrorMessage";

const OUTCOME_COLORS: Record<string, string> = {
  success:  "#22c55e",
  failure:  "#ef4444",
  pending:  "#eab308",
  unknown:  "#888888",
};

export default function TimelinePage() {
  const [decisions, setDecisions] = useState<GraphNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGraphNodes({ node_type: "Decision", limit: 50 })
      .then((res) => {
        const sorted = [...res.nodes].sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        });
        setDecisions(sorted);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <Clock size={28} color="#00e5cc" />
        <h1 style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-0.01em", color: "#ffffff" }}>
          Organizational Time Machine
        </h1>
      </div>
      <p style={{ color: "#888", fontSize: "14px", marginBottom: "40px" }}>
        Decision history, in reverse chronological order
      </p>

      {loading && <LoadingSkeleton lines={6} />}
      {!loading && error && <ErrorMessage message={error} />}
      {!loading && !error && decisions.length === 0 && (
        <div style={{ color: "#888", textAlign: "center", padding: "64px 0", fontSize: "14px" }}>
          No decisions found in the knowledge graph
        </div>
      )}

      {!loading && !error && decisions.length > 0 && (
        <div style={{ position: "relative", paddingLeft: "32px" }}>
          {/* Timeline line */}
          <div
            style={{
              position: "absolute",
              left: "7px",
              top: 0,
              bottom: 0,
              width: "2px",
              background: "#1a1a1a",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {decisions.map((decision) => {
              const outcomeKey = (decision.outcome ?? "unknown").toLowerCase();
              const outcomeColor = OUTCOME_COLORS[outcomeKey] ?? "#888888";

              return (
                <div key={decision.id} style={{ position: "relative" }}>
                  {/* Dot */}
                  <div
                    style={{
                      position: "absolute",
                      left: "-28px",
                      top: "12px",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: "#00e5cc",
                      border: "2px solid #0a0a0a",
                      boxShadow: "0 0 8px rgba(0,229,204,0.4)",
                    }}
                  />

                  <div
                    style={{
                      background: "#111111",
                      border: "1px solid #2a2a2a",
                      borderRadius: "12px",
                      padding: "20px 24px",
                      transition: "border-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#444";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a";
                    }}
                  >
                    {decision.created_at && (
                      <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px", fontFamily: "JetBrains Mono, monospace" }}>
                        {new Date(decision.created_at).toLocaleString()}
                      </div>
                    )}

                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#ffffff", marginBottom: "10px" }}>
                      {decision.title ?? decision.name ?? "Untitled Decision"}
                    </h3>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {decision.decision_type && (
                        <span
                          style={{
                            background: "#1a1a1a",
                            border: "1px solid #2a2a2a",
                            borderRadius: "4px",
                            padding: "2px 8px",
                            fontSize: "11px",
                            color: "#888",
                          }}
                        >
                          {decision.decision_type}
                        </span>
                      )}
                      {decision.outcome && (
                        <span
                          style={{
                            background: `${outcomeColor}22`,
                            border: `1px solid ${outcomeColor}55`,
                            borderRadius: "4px",
                            padding: "2px 8px",
                            fontSize: "11px",
                            color: outcomeColor,
                            fontWeight: 500,
                          }}
                        >
                          {decision.outcome}
                        </span>
                      )}
                    </div>

                    {decision.description && (
                      <p style={{ color: "#888", fontSize: "13px", lineHeight: "1.5", marginTop: "10px" }}>
                        {decision.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
