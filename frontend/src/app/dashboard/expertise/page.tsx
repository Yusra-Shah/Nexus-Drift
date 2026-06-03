"use client";

import { useState } from "react";
import { Users, AlertTriangle, X } from "lucide-react";

const PEOPLE = ["Sarah Chen", "James Park", "Priya Nair", "Alex Kim", "Jordan Lee", "Sam Torres"];
const DOMAINS = ["Auth", "ML Pipeline", "Frontend", "DevOps", "Data", "API", "Mobile", "Security"];

function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const rng = seededRng(42);
const SCORES: number[][] = PEOPLE.map(() => DOMAINS.map(() => Math.round(rng() * 10)));

const LAST_ACTIVE: string[][] = PEOPLE.map(() => DOMAINS.map(() => {
  const daysAgo = Math.floor(rng() * 120);
  const d = new Date(Date.now() - daysAgo * 86400_000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}));

// Bus factor: domains where exactly 1 person scores ≥ 8
const busFlagKeys = new Set<string>();
DOMAINS.forEach((domain, di) => {
  const experts = PEOPLE.filter((_, pi) => SCORES[pi][di] >= 8);
  if (experts.length === 1) busFlagKeys.add(`${experts[0]}__${domain}`);
});

function cellColor(score: number): string {
  if (score === 0) return "#FAFAFA";
  const t = score / 10;
  return `rgba(0,229,204,${(0.08 + t * 0.82).toFixed(2)})`;
}

export default function ExpertisePage() {
  const [search, setSearch] = useState("");
  const [tooltip, setTooltip] = useState<{ person: string; domain: string; score: number; lastActive: string } | null>(null);
  const [busDismissed, setBusDismissed] = useState(false);

  const filteredPeople = PEOPLE.filter(p => p.toLowerCase().includes(search.toLowerCase()));
  const busFlagCount = busFlagKeys.size;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
        <Users size={24} color="#00e5cc" />
        <h1 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.02em", color: "#111" }}>Expertise Map</h1>
      </div>
      <p style={{ color: "#888", fontSize: "14px", marginBottom: "24px" }}>
        Knowledge distribution heatmap — {PEOPLE.length} people × {DOMAINS.length} domains
      </p>

      {/* Search + Bus factor banner */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "flex-start" }}>
        <input
          type="text" placeholder="Search people…" value={search} onChange={e => setSearch(e.target.value)}
          style={{
            padding: "9px 14px", border: "1px solid #E5E5E5", borderRadius: "8px",
            fontSize: "13px", width: "220px", outline: "none", color: "#111",
            background: "#FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
          onFocus={e => { (e.currentTarget).style.borderColor = "#00e5cc"; }}
          onBlur={e => { (e.currentTarget).style.borderColor = "#E5E5E5"; }}
        />
        {busFlagCount > 0 && !busDismissed && (
          <div style={{
            display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px",
            background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "8px",
            color: "#92400E", fontSize: "13px", flex: 1,
          }}>
            <AlertTriangle size={16} color="#F59E0B" />
            <span>{busFlagCount} bus-factor warning{busFlagCount > 1 ? "s" : ""} — domains with a single expert scoring 8+ are marked ⚠</span>
            <button onClick={() => setBusDismissed(true)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#D97706" }}><X size={14} /></button>
          </div>
        )}
      </div>

      {/* Heatmap */}
      <div style={{ background: "#FFFFFF", border: "1px solid #EEEEEE", borderRadius: "16px", padding: "24px", overflowX: "auto", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: "4px", minWidth: "640px" }}>
          <thead>
            <tr>
              <th style={{ width: "130px", textAlign: "left", fontSize: "11px", color: "#BBB", fontWeight: 600, paddingBottom: "8px" }}>Person</th>
              {DOMAINS.map(d => (
                <th key={d} style={{ fontSize: "11px", color: "#888", fontWeight: 700, textAlign: "center", paddingBottom: "8px", whiteSpace: "nowrap", letterSpacing: "0.04em" }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredPeople.map((person) => {
              const pi = PEOPLE.indexOf(person);
              return (
                <tr key={person}>
                  <td style={{ fontSize: "13px", color: "#333", fontWeight: 500, paddingRight: "12px", whiteSpace: "nowrap" }}>{person}</td>
                  {DOMAINS.map((domain, di) => {
                    const score = SCORES[pi][di];
                    const isBus = busFlagKeys.has(`${person}__${domain}`);
                    const bg = cellColor(score);
                    return (
                      <td key={domain} style={{ padding: "2px" }}>
                        <div
                          style={{
                            width: "60px", height: "40px", borderRadius: "6px", background: bg,
                            border: isBus ? "2px solid #F59E0B" : "1px solid #EEEEEE",
                            display: "flex", flexDirection: "column", alignItems: "center",
                            justifyContent: "center", cursor: "default", position: "relative",
                          }}
                          onMouseEnter={() => setTooltip({ person, domain, score, lastActive: LAST_ACTIVE[pi][di] })}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          <span style={{ fontSize: "13px", fontWeight: 700, fontFamily: "JetBrains Mono", color: score >= 7 ? "#005C52" : "#444" }}>{score}</span>
                          {isBus && <span style={{ fontSize: "8px", color: "#F59E0B", lineHeight: 1 }}>⚠</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #F0F0F0" }}>
          <span style={{ fontSize: "12px", color: "#BBB" }}>0</span>
          <div style={{ display: "flex", gap: "2px" }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
              <div key={v} style={{ width: "22px", height: "14px", borderRadius: "3px", background: cellColor(v), border: "1px solid #EEE" }} />
            ))}
          </div>
          <span style={{ fontSize: "12px", color: "#00e5cc", fontWeight: 700 }}>10</span>
          <span style={{ fontSize: "12px", color: "#BBB", marginLeft: "6px" }}>Expertise Score</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          marginTop: "14px", padding: "12px 18px", background: "#FFFFFF",
          border: "1px solid #EEEEEE", borderRadius: "10px", fontSize: "13px",
          color: "#444", display: "flex", gap: "20px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}>
          <span><b style={{ color: "#111" }}>{tooltip.person}</b> · {tooltip.domain}</span>
          <span>Score: <b style={{ color: "#00e5cc", fontFamily: "JetBrains Mono" }}>{tooltip.score}/10</b></span>
          <span style={{ color: "#AAA" }}>Last active: {tooltip.lastActive}</span>
          {busFlagKeys.has(`${tooltip.person}__${tooltip.domain}`) && <span style={{ color: "#F59E0B" }}>⚠ Sole expert — bus factor 1</span>}
        </div>
      )}

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginTop: "20px" }}>
        {[
          { label: "Team Members",       value: PEOPLE.length },
          { label: "Domains Tracked",    value: DOMAINS.length },
          { label: "Bus Factor Warnings",value: busFlagCount, color: "#F59E0B" },
          { label: "Avg. Expertise",     value: (SCORES.flat().reduce((a, b) => a + b, 0) / SCORES.flat().length).toFixed(1), color: "#00e5cc" },
        ].map(({ label, value, color }) => (
          <div key={label} className="tilt-card" style={{
            background: "#FFFFFF", border: "1px solid #EEEEEE", borderRadius: "12px",
            padding: "18px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}>
            <div style={{ fontSize: "11px", color: "#AAA", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>{label}</div>
            <div style={{ fontSize: "26px", fontWeight: 800, fontFamily: "JetBrains Mono", color: color ?? "#111" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
