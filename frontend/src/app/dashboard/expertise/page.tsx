"use client";

import { useState } from "react";
import { Users, AlertTriangle } from "lucide-react";

const PEOPLE = ["Sarah Chen", "James Park", "Priya Nair", "Alex Kim", "Jordan Lee", "Sam Torres"];
const DOMAINS = ["Auth", "ML Pipeline", "Frontend", "DevOps", "Data", "API", "Mobile", "Security"];

// Seeded pseudo-random scores so they're consistent (not random per render)
function seedRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}
const rng = seedRand(42);
const SCORES: number[][] = PEOPLE.map(() => DOMAINS.map(() => Math.round(rng() * 10)));

// Bus factor: domains where only 1 person scores >= 8
const busFactor: Record<string, string[]> = {};
DOMAINS.forEach((domain, di) => {
  const experts = PEOPLE.filter((_, pi) => SCORES[pi][di] >= 8);
  if (experts.length === 1) {
    busFactor[`${experts[0]}-${domain}`] = experts;
  }
});

function scoreToColor(score: number): string {
  if (score === 0) return "#0d0d0d";
  const t = score / 10;
  // near-black (#111) to teal (#00e5cc)
  const r = Math.round(0 + t * 0);
  const g = Math.round(17 + t * (229 - 17));
  const b = Math.round(17 + t * (204 - 17));
  return `rgb(${r},${g},${b})`;
}

export default function ExpertisePage() {
  const [hovered, setHovered] = useState<string | null>(null);

  const busFlagCount = Object.keys(busFactor).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <Users size={28} color="#00e5cc" />
        <h1 style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-0.01em", color: "#ffffff" }}>
          Expertise Map
        </h1>
      </div>
      <p style={{ color: "#888", fontSize: "14px", marginBottom: "24px" }}>
        Knowledge distribution heatmap — {PEOPLE.length} people × {DOMAINS.length} domains
      </p>

      {busFlagCount > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px",
          background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.3)",
          borderRadius: "8px", marginBottom: "28px", color: "#eab308", fontSize: "14px",
        }}>
          <AlertTriangle size={18} />
          <span>
            {busFlagCount} bus-factor warning{busFlagCount !== 1 ? "s" : ""} detected —
            cells marked ⚠ have a single expert with score 8+.
          </span>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <span style={{ fontSize: "12px", color: "#666" }}>0</span>
        <div style={{ display: "flex", gap: "2px" }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
            <div key={v} style={{
              width: "24px", height: "16px", borderRadius: "3px",
              background: scoreToColor(v), border: "1px solid #1a1a1a",
            }} />
          ))}
        </div>
        <span style={{ fontSize: "12px", color: "#00e5cc" }}>10</span>
        <span style={{ fontSize: "12px", color: "#555", marginLeft: "8px" }}>Expertise Score</span>
      </div>

      {/* Heatmap table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: "4px", minWidth: "660px" }}>
          <thead>
            <tr>
              <th style={{ width: "140px", textAlign: "left", fontSize: "12px", color: "#555", fontWeight: 500, paddingBottom: "8px" }}>
                Person
              </th>
              {DOMAINS.map((d) => (
                <th key={d} style={{
                  fontSize: "11px", color: "#888", fontWeight: 600, textAlign: "center",
                  paddingBottom: "8px", whiteSpace: "nowrap", letterSpacing: "0.04em",
                }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PEOPLE.map((person, pi) => (
              <tr key={person}>
                <td style={{ fontSize: "13px", color: "#ccc", fontWeight: 500, paddingRight: "12px", whiteSpace: "nowrap" }}>
                  {person}
                </td>
                {DOMAINS.map((domain, di) => {
                  const score = SCORES[pi][di];
                  const key = `${person}-${domain}`;
                  const isBus = !!busFactor[key];
                  const isHov = hovered === key;
                  return (
                    <td key={domain} style={{ padding: "2px" }}>
                      <div
                        style={{
                          width: "64px", height: "42px", borderRadius: "6px",
                          background: scoreToColor(score),
                          border: isHov ? "2px solid #ffffff" : isBus ? "2px solid #eab308" : "1px solid transparent",
                          display: "flex", flexDirection: "column", alignItems: "center",
                          justifyContent: "center", gap: "2px",
                          cursor: "default", transition: "border-color 0.15s",
                          position: "relative",
                        }}
                        onMouseEnter={() => setHovered(key)}
                        onMouseLeave={() => setHovered(null)}
                      >
                        <span style={{
                          fontSize: "13px", fontWeight: 700,
                          fontFamily: "JetBrains Mono, monospace",
                          color: score >= 6 ? "#000" : "#aaa",
                        }}>{score}</span>
                        {isBus && (
                          <span style={{ fontSize: "9px", color: "#eab308", lineHeight: 1 }}>⚠</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hovered && (() => {
        const [person, ...domParts] = hovered.split("-");
        const domain = domParts.join("-");
        const pi = PEOPLE.indexOf(person);
        const di = DOMAINS.indexOf(domain);
        if (pi === -1 || di === -1) return null;
        const score = SCORES[pi][di];
        return (
          <div style={{
            marginTop: "20px", padding: "14px 20px",
            background: "#111", border: "1px solid #2a2a2a", borderRadius: "10px",
            fontSize: "13px", color: "#ccc", display: "flex", gap: "20px",
          }}>
            <span><b style={{ color: "#fff" }}>{person}</b> · {domain}</span>
            <span>Score: <b style={{ color: "#00e5cc", fontFamily: "JetBrains Mono" }}>{score}/10</b></span>
            {busFactor[hovered] && <span style={{ color: "#eab308" }}>⚠ Bus factor: sole expert</span>}
          </div>
        );
      })()}

      {/* Summary row */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginTop: "32px",
      }}>
        {[
          { label: "Team Members", value: PEOPLE.length },
          { label: "Domains Tracked", value: DOMAINS.length },
          { label: "Bus Factor Warnings", value: busFlagCount, color: "#eab308" },
          { label: "Avg. Expertise Score", value: (SCORES.flat().reduce((a, b) => a + b, 0) / SCORES.flat().length).toFixed(1), color: "#00e5cc" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "#111", border: "1px solid #2a2a2a", borderRadius: "10px", padding: "20px",
          }}>
            <div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>{label}</div>
            <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: color ?? "#fff" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
