"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Play, Pause } from "lucide-react";

const TYPE_STYLE: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  decision:    { border: "#00e5cc", bg: "#F0FDFB", text: "#0D9488", dot: "#00e5cc" },
  risk:        { border: "#ef4444", bg: "#FEF2F2", text: "#DC2626", dot: "#ef4444" },
  contradiction:{ border: "#f97316", bg: "#FFF7ED", text: "#EA580C", dot: "#f97316" },
  agent:       { border: "#7b2fff", bg: "#FAF5FF", text: "#7C3AED", dot: "#7b2fff" },
};

const now = Date.now();
const EVENTS = [
  { id:"e1",  type:"agent",        agent:"Ingestion Agent",  title:"GitHub connector sync completed",                   description:"Ingested 14 PRs, 6 issues, and 3 README updates. 8 new artifacts queued for parsing.",                                             ts: new Date(now - 18*60_000).toISOString() },
  { id:"e2",  type:"decision",     agent:"Parser Agent",     title:"Decision node created: Migrate auth to Clerk",      description:"Extracted from PR #441 — confidence 0.88. Decision type: architectural. Outcome: pending.",                                      ts: new Date(now - 47*60_000).toISOString() },
  { id:"e3",  type:"risk",         agent:"Watchtower Agent", title:"Risk alert: payments knowledge silo reached 0.94",  description:"Threshold 0.80 exceeded. Marcus Rodriguez identified as sole knowledge holder.",                                                ts: new Date(now - 2.1*3600_000).toISOString() },
  { id:"e4",  type:"agent",        agent:"Scorer Agent",     title:"Consciousness score updated: 81 → 84",              description:"Cycle 847 complete. Knowledge coherence +3, decision consistency stable, expertise coverage +2.",                                ts: new Date(now - 4*3600_000).toISOString() },
  { id:"e5",  type:"contradiction",agent:"Reasoning Agent",  title:"Contradiction detected: microservices vs monolith", description:"Q3 microservices commitment contradicts Q1 monolith decision. 4 services mid-migration.",                                       ts: new Date(now - 6*3600_000).toISOString() },
  { id:"e6",  type:"decision",     agent:"Parser Agent",     title:"Decision node created: Adopt Neo4j as graph store", description:"Extracted from Confluence page. Confidence: 0.95. Outcome: success. Linked to 3 existing nodes.",                              ts: new Date(now - 10*3600_000).toISOString() },
  { id:"e7",  type:"agent",        agent:"Graph Writer",     title:"Expertise edges added for Sarah Chen",              description:"Domains: distributed-systems, consensus-protocols, API-design. Derived from PR review activity.",                               ts: new Date(now - 18*3600_000).toISOString() },
  { id:"e8",  type:"risk",         agent:"Watchtower Agent", title:"Risk alert: ML pipeline knowledge gap detected",    description:"0 decision nodes for ingestion→training→serving pathway. Lead departed 60 days ago.",                                          ts: new Date(now - 1.1*24*3600_000).toISOString() },
  { id:"e9",  type:"agent",        agent:"Parser Agent",     title:"Artifact batch processed: Slack export",           description:"Processed 234 messages from #architecture. Extracted 3 decisions, 7 person mentions, 2 concept nodes.",                        ts: new Date(now - 1.8*24*3600_000).toISOString() },
  { id:"e10", type:"decision",     agent:"Parser Agent",     title:"Decision node created: Deprecate v1 REST API",      description:"Sourced from Linear ticket ARCH-88. Decision type: technical. Confidence: 0.79. Affects 6 downstream services.",                ts: new Date(now - 3*24*3600_000).toISOString() },
  { id:"e11", type:"agent",        agent:"Scorer Agent",     title:"Weekly organizational health report generated",     description:"Bus factor: 2 critical warnings. Memory completeness: 76%. Expertise coverage: 91%.",                                          ts: new Date(now - 7*24*3600_000).toISOString() },
  { id:"e12", type:"contradiction",agent:"Reasoning Agent",  title:"Contradiction resolved: database selection",        description:"Previous contradiction between PostgreSQL and MongoDB nodes resolved. Neo4j decision supersedes both.",                          ts: new Date(now - 14*24*3600_000).toISOString() },
];

function TimelineCard({ ev, idx }: { ev: typeof EVENTS[0]; idx: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const s = TYPE_STYLE[ev.type] ?? TYPE_STYLE.agent;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(28px)", transition: `opacity 0.45s ${idx * 0.05}s ease, transform 0.45s ${idx * 0.05}s ease` }}>
      <div style={{ position: "absolute", left: "-29px", top: "16px", width: "12px", height: "12px", borderRadius: "50%", background: s.dot, border: "3px solid #F7F8FA", boxShadow: `0 0 0 2px ${s.dot}44` }} />
      <div className="tilt-card" style={{
        background: "#FFFFFF", border: `1px solid #EEEEEE`, borderLeft: `4px solid ${s.border}`,
        borderRadius: "12px", padding: "18px 20px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
          <span style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}33`, borderRadius: "4px", padding: "2px 8px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{ev.type}</span>
          <span style={{ background: "#F5F5F5", color: "#888", borderRadius: "4px", padding: "2px 8px", fontSize: "11px" }}>{ev.agent}</span>
          <span style={{ fontSize: "11px", color: "#CCC", fontFamily: "JetBrains Mono", marginLeft: "auto" }}>{new Date(ev.ts).toLocaleString()}</span>
        </div>
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#111", marginBottom: "4px" }}>{ev.title}</h3>
        <p style={{ color: "#888", fontSize: "13px", lineHeight: "1.5" }}>{ev.description}</p>
      </div>
    </div>
  );
}

export default function TimelinePage() {
  const [playing, setPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itvRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      itvRef.current = setInterval(() => {
        const el = containerRef.current;
        if (!el) return;
        el.scrollBy({ top: 120, behavior: "smooth" });
      }, 1200);
    } else {
      if (itvRef.current) clearInterval(itvRef.current);
    }
    return () => { if (itvRef.current) clearInterval(itvRef.current); };
  }, [playing]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Clock size={24} color="#00e5cc" />
          <h1 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.02em", color: "#111" }}>Organizational Time Machine</h1>
        </div>
        <button onClick={() => setPlaying(p => !p)} style={{
          display: "flex", alignItems: "center", gap: "8px", padding: "9px 18px",
          background: playing ? "#F0FDFB" : "#00e5cc", color: playing ? "#0D9488" : "#000",
          border: playing ? "1px solid #00e5cc44" : "none", borderRadius: "8px",
          fontSize: "13px", fontWeight: 600, cursor: "pointer",
        }}>
          {playing ? <><Pause size={14} />Pause</> : <><Play size={14} />Auto-scroll</>}
        </button>
      </div>
      <p style={{ color: "#888", fontSize: "14px", marginBottom: "36px" }}>{EVENTS.length} events · last 90 days · live agent activity</p>

      <div ref={containerRef} style={{ position: "relative", paddingLeft: "32px", maxHeight: "72vh", overflowY: "auto", paddingRight: "4px" }}>
        <div style={{ position: "absolute", left: "7px", top: 0, bottom: 0, width: "2px", background: "linear-gradient(to bottom, #00e5cc, #EEEEEE)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {EVENTS.map((ev, idx) => <TimelineCard key={ev.id} ev={ev} idx={idx} />)}
        </div>
      </div>
    </div>
  );
}
