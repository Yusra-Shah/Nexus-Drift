"use client";

import { useState, useEffect } from "react";
import { FlaskConical, TrendingUp } from "lucide-react";

const MOCK_RESULT = {
  scenario: "Migrate auth to microservices",
  successProbability: 0.73, impactScore: 0.81, similarDecisions: 3, confidence: 0.86,
  outcomes: [
    { label: "Full success",    probability: 0.73, color: "#00e5cc" },
    { label: "Partial success", probability: 0.16, color: "#eab308" },
    { label: "Stall / rollback",probability: 0.08, color: "#f97316" },
    { label: "Failure",         probability: 0.03, color: "#ef4444" },
  ],
  historicalDecisions: [
    { title: "Migrate billing to Stripe",        outcome: "success", confidence: 0.91, date: "2024-02" },
    { title: "Extract notification service",      outcome: "success", confidence: 0.88, date: "2023-11" },
    { title: "Decompose legacy monolith (partial)",outcome: "pending", confidence: 0.74, date: "2024-06" },
  ],
  risks: ["Auth migration requires 6-week freeze on auth changes","Knowledge silo: 1 engineer owns 70% of auth code","No fallback path documented"],
};

// SVG area chart
const CW = 400, CH = 140;
function buildCurve() {
  const pts: [number,number][] = [];
  for (let i = 0; i <= 60; i++) {
    const x = i / 60, mu = 0.73, sigma = 0.14;
    pts.push([x, Math.exp(-0.5*((x-mu)/sigma)**2)]);
  }
  const maxY = Math.max(...pts.map(p=>p[1]));
  return pts.map(([x,y])=>[x*CW, CH-(y/maxY)*(CH-16)] as [number,number]);
}
const CURVE = buildCurve();
const areaD = "M "+CURVE.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(" L ")+` L ${CW},${CH} L 0,${CH} Z`;
const lineD  = "M "+CURVE.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(" L ");

function OutcomeBar({ label, probability, color, delay }: { label: string; probability: number; color: string; delay: number }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(probability*100), delay); return () => clearTimeout(t); }, [probability, delay]);
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "13px", color: "#444" }}>{label}</span>
        <span style={{ fontSize: "13px", fontFamily: "JetBrains Mono", color, fontWeight: 700 }}>{(probability*100).toFixed(0)}%</span>
      </div>
      <div style={{ height: "5px", background: "#F0F0F0", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: "3px", transition: "width 0.8s cubic-bezier(.22,1,.36,1)" }} />
      </div>
    </div>
  );
}

function HistCard({ d, delay }: { d: typeof MOCK_RESULT.historicalDecisions[0]; delay: number }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{
      opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(12px)",
      transition: "all 0.4s ease",
      background: "#FAFAFA", border: "1px solid #EEEEEE", borderRadius: "10px",
      padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <span style={{ fontSize: "13px", color: "#333" }}>{d.title}</span>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "#CCC", fontFamily: "JetBrains Mono" }}>{d.date}</span>
        <span style={{
          background: d.outcome === "success" ? "#F0FDF4" : "#FEFCE8",
          color: d.outcome === "success" ? "#16a34a" : "#ca8a04",
          border: `1px solid ${d.outcome === "success" ? "#bbf7d0" : "#fde68a"}`,
          padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700,
        }}>{d.outcome}</span>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#FAFAFA", border: "1px solid #E5E5E5",
  borderRadius: "8px", padding: "10px 14px", color: "#111", fontSize: "14px", outline: "none",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "11px", color: "#888", marginBottom: "5px",
  textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600,
};

export default function SimulatePage() {
  const [scenarioName, setScenarioName] = useState("Migrate auth to microservices");
  const [complexity, setComplexity] = useState("high");
  const [teamSize, setTeamSize] = useState(12);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(true);

  function runSimulation(e: React.FormEvent) {
    e.preventDefault();
    setDone(false); setRunning(true); setProgress(0);
    let p = 0;
    const itv = setInterval(() => {
      p += Math.random() * 18 + 6;
      setProgress(Math.min(p, 100));
      if (p >= 100) { clearInterval(itv); setTimeout(() => { setRunning(false); setDone(true); }, 300); }
    }, 200);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
        <FlaskConical size={24} color="#00e5cc" />
        <h1 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.02em", color: "#111" }}>Simulation Studio</h1>
      </div>
      <p style={{ color: "#888", fontSize: "14px", marginBottom: "32px" }}>Model decision outcomes with AI-powered scenario analysis</p>

      <div style={{ display: "flex", gap: "28px", alignItems: "flex-start" }}>
        {/* Form */}
        <div style={{ width: "340px", flexShrink: 0, background: "#FFFFFF", border: "1px solid #EEEEEE", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
          <form onSubmit={runSimulation} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={labelStyle}>Scenario Name</label>
              <input type="text" value={scenarioName} onChange={e=>setScenarioName(e.target.value)} style={inputStyle}
                onFocus={e=>{(e.currentTarget).style.borderColor="#00e5cc";}} onBlur={e=>{(e.currentTarget).style.borderColor="#E5E5E5";}} />
            </div>
            <div>
              <label style={labelStyle}>Architecture Complexity</label>
              <select value={complexity} onChange={e=>setComplexity(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}
                onFocus={e=>{(e.currentTarget).style.borderColor="#00e5cc";}} onBlur={e=>{(e.currentTarget).style.borderColor="#E5E5E5";}}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Team Size</label>
              <input type="number" min={1} max={1000} value={teamSize} onChange={e=>setTeamSize(Number(e.target.value))} style={inputStyle}
                onFocus={e=>{(e.currentTarget).style.borderColor="#00e5cc";}} onBlur={e=>{(e.currentTarget).style.borderColor="#E5E5E5";}} />
            </div>

            {running && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ fontSize: "12px", color: "#888" }}>Running simulation…</span>
                  <span style={{ fontSize: "12px", fontFamily: "JetBrains Mono", color: "#00e5cc" }}>{Math.round(progress)}%</span>
                </div>
                <div style={{ height: "6px", background: "#F0F0F0", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: "#00e5cc", borderRadius: "3px", transition: "width 0.25s" }} />
                </div>
              </div>
            )}

            <button type="submit" disabled={running} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              padding: "12px", background: running ? "#F0F0F0" : "#00e5cc", color: running ? "#AAA" : "#000",
              border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700,
              cursor: running ? "not-allowed" : "pointer",
            }}>
              <FlaskConical size={16} />
              {running ? "Simulating…" : "Run Simulation"}
            </button>
          </form>
        </div>

        {/* Results */}
        {done && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Key metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
              {[
                { label: "Success Probability", value: `${(MOCK_RESULT.successProbability*100).toFixed(0)}%`, color: "#00e5cc" },
                { label: "Impact Score",         value: MOCK_RESULT.impactScore.toFixed(2),                  color: "#7b2fff" },
                { label: "Similar Decisions",    value: MOCK_RESULT.similarDecisions,                        color: "#eab308" },
              ].map(({ label, value, color }) => (
                <div key={label} className="tilt-card" style={{
                  background: "#FFFFFF", border: "1px solid #EEEEEE", borderRadius: "12px", padding: "18px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}>
                  <div style={{ fontSize: "11px", color: "#AAA", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>{label}</div>
                  <div style={{ fontSize: "28px", fontWeight: 800, fontFamily: "JetBrains Mono", color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Probability distribution */}
            <div style={{ background: "#FFFFFF", border: "1px solid #EEEEEE", borderRadius: "14px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <TrendingUp size={16} color="#00e5cc" />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}>Outcome Probability Distribution — {scenarioName}</span>
              </div>
              <svg width="100%" viewBox={`0 0 ${CW} ${CH+20}`} style={{ display: "block" }}>
                <defs>
                  <linearGradient id="aG2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00e5cc" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#00e5cc" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                {[0.25,0.5,0.75].map(v=>(
                  <line key={v} x1="0" y1={CH-v*(CH-16)} x2={CW} y2={CH-v*(CH-16)} stroke="#F0F0F0" strokeWidth="1"/>
                ))}
                <path d={areaD} fill="url(#aG2)" />
                <path d={lineD} fill="none" stroke="#00e5cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1={CW*0.73} y1="0" x2={CW*0.73} y2={CH} stroke="#00e5cc" strokeWidth="1" strokeDasharray="4 3" opacity="0.5"/>
                <text x={CW*0.73+6} y="14" fill="#00e5cc" fontSize="11" fontFamily="JetBrains Mono">73%</text>
                {["0%","25%","50%","75%","100%"].map((l,i)=>(
                  <text key={l} x={CW*i*0.25} y={CH+16} fill="#CCC" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono">{l}</text>
                ))}
              </svg>
            </div>

            {/* Outcome breakdown */}
            <div style={{ background: "#FFFFFF", border: "1px solid #EEEEEE", borderRadius: "14px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <p style={{ fontSize: "11px", color: "#AAA", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "14px" }}>Outcome Breakdown</p>
              {MOCK_RESULT.outcomes.map((o, i) => <OutcomeBar key={o.label} {...o} delay={300 + i*120} />)}
            </div>

            {/* Historical */}
            <div style={{ background: "#FFFFFF", border: "1px solid #EEEEEE", borderRadius: "14px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <p style={{ fontSize: "11px", color: "#AAA", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px" }}>3 Similar Historical Decisions</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {MOCK_RESULT.historicalDecisions.map((d, i) => <HistCard key={d.title} d={d} delay={500 + i*150} />)}
              </div>
            </div>

            {/* Risks */}
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "14px", padding: "18px" }}>
              <p style={{ fontSize: "11px", color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "10px" }}>Identified Risks</p>
              {MOCK_RESULT.risks.map(r => (
                <div key={r} style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ color: "#ef4444" }}>›</span>
                  <span style={{ fontSize: "13px", color: "#666" }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
