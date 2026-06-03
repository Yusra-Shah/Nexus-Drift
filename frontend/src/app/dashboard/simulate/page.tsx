"use client";

import { useState } from "react";
import { FlaskConical, TrendingUp } from "lucide-react";

// Pre-built mock result shown on the right
const MOCK_RESULT = {
  scenario: "Migrate auth to microservices",
  successProbability: 0.73,
  impactScore: 0.81,
  similarDecisions: 3,
  confidence: 0.86,
  outcomes: [
    { label: "Full success", probability: 0.73, color: "#00e5cc" },
    { label: "Partial success", probability: 0.16, color: "#eab308" },
    { label: "Stall / rollback", probability: 0.08, color: "#f97316" },
    { label: "Failure", probability: 0.03, color: "#ef4444" },
  ],
  historicalDecisions: [
    { title: "Migrate billing to Stripe", outcome: "success", confidence: 0.91, date: "2024-02" },
    { title: "Extract notification service", outcome: "success", confidence: 0.88, date: "2023-11" },
    { title: "Decompose legacy monolith (partial)", outcome: "pending", confidence: 0.74, date: "2024-06" },
  ],
  risks: ["Auth migration requires 6-week freeze on auth changes", "Knowledge silo: 1 engineer owns 70% of auth code", "No fallback path documented"],
};

// SVG area chart data points for probability distribution
const CHART_W = 480;
const CHART_H = 160;
function buildCurve() {
  // Approximate a right-skewed bell curve peaking at ~0.73
  const pts: [number, number][] = [];
  for (let i = 0; i <= 60; i++) {
    const x = i / 60;
    const mu = 0.73; const sigma = 0.14;
    const y = Math.exp(-0.5 * ((x - mu) / sigma) ** 2);
    pts.push([x, y]);
  }
  const maxY = Math.max(...pts.map((p) => p[1]));
  return pts.map(([x, y]) => [x * CHART_W, CHART_H - (y / maxY) * (CHART_H - 20)] as [number, number]);
}
const CURVE = buildCurve();
const pathD = "M " + CURVE.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L ") +
  ` L ${CHART_W},${CHART_H} L 0,${CHART_H} Z`;
const linePath = "M " + CURVE.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L ");

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px",
  padding: "10px 14px", color: "#ffffff", fontSize: "14px", outline: "none",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", color: "#888", marginBottom: "6px",
  textTransform: "uppercase", letterSpacing: "0.06em",
};

export default function SimulatePage() {
  const [scenarioName, setScenarioName] = useState("Migrate auth to microservices");
  const [complexity, setComplexity] = useState("high");
  const [teamSize, setTeamSize] = useState(12);
  const [ran, setRan] = useState(true); // show result by default

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <FlaskConical size={28} color="#00e5cc" />
        <h1 style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-0.01em", color: "#ffffff" }}>
          Simulation Studio
        </h1>
      </div>
      <p style={{ color: "#888", fontSize: "14px", marginBottom: "32px" }}>
        Model decision outcomes with AI-powered scenario analysis
      </p>

      <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
        {/* Form */}
        <div style={{
          width: "360px", flexShrink: 0, background: "#111111",
          border: "1px solid #2a2a2a", borderRadius: "12px", padding: "24px",
        }}>
          <form onSubmit={(e) => { e.preventDefault(); setRan(true); }}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={labelStyle}>Scenario Name</label>
              <input type="text" value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "#00e5cc"; }}
                onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "#2a2a2a"; }}
              />
            </div>
            <div>
              <label style={labelStyle}>Architecture Complexity</label>
              <select value={complexity} onChange={(e) => setComplexity(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={(e) => { (e.currentTarget as HTMLSelectElement).style.borderColor = "#00e5cc"; }}
                onBlur={(e) => { (e.currentTarget as HTMLSelectElement).style.borderColor = "#2a2a2a"; }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Team Size</label>
              <input type="number" min={1} max={1000} value={teamSize}
                onChange={(e) => setTeamSize(Number(e.target.value))}
                style={inputStyle}
                onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "#00e5cc"; }}
                onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "#2a2a2a"; }}
              />
            </div>
            <button type="submit" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              padding: "12px 24px", background: "#00e5cc", color: "#0a0a0a",
              border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
            }}>
              <FlaskConical size={16} />
              Run Simulation
            </button>
          </form>
        </div>

        {/* Results */}
        {ran && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Key metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {[
                { label: "Success Probability", value: `${(MOCK_RESULT.successProbability * 100).toFixed(0)}%`, color: "#00e5cc", glow: true },
                { label: "Impact Score", value: MOCK_RESULT.impactScore.toFixed(2), color: "#7b2fff" },
                { label: "Similar Decisions", value: MOCK_RESULT.similarDecisions, color: "#eab308" },
              ].map(({ label, value, color, glow }) => (
                <div key={label} style={{
                  background: "#111", border: "1px solid #2a2a2a", borderRadius: "10px", padding: "18px",
                  boxShadow: glow ? `0 0 20px ${color}33` : undefined,
                }}>
                  <div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{label}</div>
                  <div style={{ fontSize: "28px", fontWeight: 700, fontFamily: "JetBrains Mono", color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Probability distribution chart */}
            <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <TrendingUp size={16} color="#00e5cc" />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#ccc" }}>
                  Outcome Probability Distribution — {scenarioName}
                </span>
              </div>
              <svg width="100%" viewBox={`0 0 ${CHART_W} ${CHART_H + 24}`} style={{ display: "block" }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e5cc" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00e5cc" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0.25, 0.5, 0.75, 1.0].map((v) => (
                  <line key={v} x1="0" y1={CHART_H - v * (CHART_H - 20)} x2={CHART_W} y2={CHART_H - v * (CHART_H - 20)}
                    stroke="#1a1a1a" strokeWidth="1" />
                ))}
                {/* Area */}
                <path d={pathD} fill="url(#areaGrad)" />
                {/* Line */}
                <path d={linePath} fill="none" stroke="#00e5cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {/* Peak marker at 73% */}
                <line x1={CHART_W * 0.73} y1="0" x2={CHART_W * 0.73} y2={CHART_H}
                  stroke="#00e5cc" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
                <text x={CHART_W * 0.73 + 6} y="18" fill="#00e5cc" fontSize="11" fontFamily="JetBrains Mono">73%</text>
                {/* X-axis labels */}
                {["0%", "25%", "50%", "75%", "100%"].map((label, i) => (
                  <text key={label} x={CHART_W * i * 0.25} y={CHART_H + 18}
                    fill="#555" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono">{label}</text>
                ))}
              </svg>
            </div>

            {/* Outcome breakdown */}
            <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
              <p style={{ fontSize: "12px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Outcome Breakdown</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {MOCK_RESULT.outcomes.map((o) => (
                  <div key={o.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "13px", color: "#ccc" }}>{o.label}</span>
                      <span style={{ fontSize: "13px", fontFamily: "JetBrains Mono", color: o.color }}>{(o.probability * 100).toFixed(0)}%</span>
                    </div>
                    <div style={{ height: "4px", background: "#1a1a1a", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${o.probability * 100}%`, background: o.color, borderRadius: "2px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical similar decisions */}
            <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px" }}>
              <p style={{ fontSize: "12px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>
                {MOCK_RESULT.similarDecisions} Similar Historical Decisions
              </p>
              {MOCK_RESULT.historicalDecisions.map((d) => (
                <div key={d.title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1a1a1a" }}>
                  <span style={{ fontSize: "13px", color: "#ccc" }}>{d.title}</span>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#555" }}>{d.date}</span>
                    <span style={{
                      background: d.outcome === "success" ? "rgba(34,197,94,0.15)" : "rgba(234,179,8,0.15)",
                      color: d.outcome === "success" ? "#22c55e" : "#eab308",
                      padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600,
                    }}>{d.outcome}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Risks */}
            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "20px" }}>
              <p style={{ fontSize: "12px", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Identified Risks</p>
              {MOCK_RESULT.risks.map((r) => (
                <div key={r} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-start" }}>
                  <span style={{ color: "#ef4444", marginTop: "1px" }}>›</span>
                  <span style={{ fontSize: "13px", color: "#ccc" }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
