"use client";

import { useEffect, useState } from "react";
import { Users, AlertTriangle } from "lucide-react";
import type { GraphNode } from "@/lib/api";
import { getGraphNodes } from "@/lib/api";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorMessage from "@/components/ErrorMessage";

export default function ExpertisePage() {
  const [persons, setPersons] = useState<GraphNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGraphNodes({ node_type: "Person", limit: 100 })
      .then((res) => setPersons(res.nodes))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const noExpertise = persons.filter(
    (p) => !p.expertise_domains || p.expertise_domains.length === 0,
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <Users size={28} color="#00e5cc" />
        <h1 style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-0.01em", color: "#ffffff" }}>
          Expertise Map
        </h1>
      </div>
      <p style={{ color: "#888", fontSize: "14px", marginBottom: "32px" }}>
        Knowledge distribution across the organization
      </p>

      {/* Bus-factor warning */}
      {!loading && noExpertise.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px 20px",
            background: "rgba(234,179,8,0.08)",
            border: "1px solid rgba(234,179,8,0.3)",
            borderRadius: "8px",
            marginBottom: "24px",
            color: "#eab308",
            fontSize: "14px",
          }}
        >
          <AlertTriangle size={18} />
          <span>
            {noExpertise.length} team member{noExpertise.length !== 1 ? "s" : ""} have no recorded expertise domains —
            potential knowledge gaps.
          </span>
        </div>
      )}

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ background: "#111111", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "24px" }}>
              <LoadingSkeleton lines={4} />
            </div>
          ))}
        </div>
      )}

      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && persons.length === 0 && (
        <div style={{ color: "#888", textAlign: "center", padding: "64px 0", fontSize: "14px" }}>
          No people found in the knowledge graph
        </div>
      )}

      {!loading && !error && persons.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {persons.map((person) => (
            <div
              key={person.id}
              style={{
                background: "#111111",
                border: "1px solid #2a2a2a",
                borderRadius: "12px",
                padding: "24px",
                transition: "border-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#444";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a";
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#ffffff",
                  marginBottom: "8px",
                }}
              >
                {person.name ?? person.title ?? "Unknown"}
              </h3>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                {person.role && (
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
                    {person.role}
                  </span>
                )}
                {person.team && (
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
                    {person.team}
                  </span>
                )}
              </div>

              {person.expertise_domains && person.expertise_domains.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {person.expertise_domains.map((domain) => (
                    <span
                      key={domain}
                      style={{
                        background: "#1a1a1a",
                        border: "1px solid #2a2a2a",
                        borderRadius: "4px",
                        padding: "2px 8px",
                        fontSize: "11px",
                        color: "#00e5cc",
                      }}
                    >
                      {domain}
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: "12px", color: "#555" }}>No expertise recorded</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
