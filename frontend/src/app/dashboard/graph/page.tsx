"use client";

import { useEffect, useRef, useState } from "react";
import { Network, X, Filter } from "lucide-react";

const NODE_COLORS: Record<string, string> = {
  Decision:      "#00E5CC",
  Risk:          "#EF4444",
  Person:        "#7B2FFF",
  Concept:       "#F59E0B",
  Contradiction: "#F97316",
};

type GNode = {
  id: string; node_type: string; title?: string; name?: string;
  description?: string; outcome?: string; decision_type?: string;
  expertise_domains?: string[]; role?: string; team?: string; created_at?: string;
  x: number; y: number; vx: number; vy: number; r: number;
};

const RAW_NODES = [
  { id:"d1", node_type:"Decision", title:"Migrate auth to microservices", description:"Break auth into dedicated service for independent scaling and security isolation. Confidence: 0.88.", outcome:"pending", decision_type:"architectural", created_at: new Date(Date.now()-2*86400_000).toISOString() },
  { id:"d2", node_type:"Decision", title:"Adopt Neo4j as primary graph store", description:"Chose Neo4j over TigerGraph after performance benchmarks. ACID-compliant, native Cypher support.", outcome:"success", decision_type:"architectural", created_at: new Date(Date.now()-30*86400_000).toISOString() },
  { id:"d3", node_type:"Decision", title:"Deprecate v1 REST API", description:"All consumers migrate to v2 GraphQL by Q4. Legacy clients 6-month sunset.", outcome:"pending", decision_type:"technical", created_at: new Date(Date.now()-14*86400_000).toISOString() },
  { id:"d4", node_type:"Decision", title:"Q3 microservices commitment", description:"Org-wide service decomposition strategy decided in Q3 planning.", outcome:"success", decision_type:"organizational", created_at: new Date(Date.now()-60*86400_000).toISOString() },
  { id:"d5", node_type:"Decision", title:"Adopt Clerk for authentication", description:"Replacing custom JWT. Reduces maintenance burden ~40%.", outcome:"pending", decision_type:"technical", created_at: new Date(Date.now()-5*86400_000).toISOString() },
  { id:"d6", node_type:"Decision", title:"Switch to Turbopack", description:"Build times: 42s → 14s. Adopted as default for all frontend.", outcome:"success", decision_type:"technical", created_at: new Date(Date.now()-10*86400_000).toISOString() },
  { id:"d7", node_type:"Decision", title:"Standardize Python 3.11", description:"Locked version for all backend services, consistent CI.", outcome:"success", decision_type:"technical", created_at: new Date(Date.now()-45*86400_000).toISOString() },
  { id:"d8", node_type:"Decision", title:"Migrate billing to Stripe", description:"Replaced legacy payment processor in 8 weeks, zero downtime.", outcome:"success", decision_type:"architectural", created_at: new Date(Date.now()-90*86400_000).toISOString() },
  { id:"r1", node_type:"Risk", title:"Bus factor: payments team", description:"Marcus Rodriguez sole owner. Critical risk score: 0.94." },
  { id:"r2", node_type:"Risk", title:"Auth rationale gap", description:"3 engineers departed. No knowledge handoff documented." },
  { id:"r3", node_type:"Risk", title:"ML pipeline knowledge gap", description:"0 decision nodes for ML pathway. Lead departed 60 days ago." },
  { id:"r4", node_type:"Risk", title:"Slack integration bus factor", description:"Jordan Lee sole contributor. No transfer in 6 months." },
  { id:"r5", node_type:"Risk", title:"React expertise stale", description:"Last active 180 days ago. 2 knowledge holders, no recent activity." },
  { id:"r6", node_type:"Risk", title:"DevOps single point of failure", description:"CI/CD pipeline undocumented. 1 engineer with full access." },
  { id:"p1", node_type:"Person", name:"Sarah Chen",      title:"Sarah Chen — Lead Engineer",    description:"Lead distributed systems engineer. Kafka, API design, consensus protocols.", role:"Lead Engineer",    team:"Platform",        expertise_domains:["distributed-systems","api-design","kafka"] },
  { id:"p2", node_type:"Person", name:"James Park",      title:"James Park — ML Engineer",      description:"ML engineer: ingestion and training pipelines.",                            role:"ML Engineer",      team:"AI",              expertise_domains:["ml-pipeline","python","data-engineering"] },
  { id:"p3", node_type:"Person", name:"Priya Nair",      title:"Priya Nair — Security Engineer",description:"Security and auth. Led original JWT implementation.",                     role:"Security Engineer",team:"Platform",        expertise_domains:["auth","security","cryptography"] },
  { id:"p4", node_type:"Person", name:"Alex Kim",        title:"Alex Kim — Frontend Lead",      description:"Frontend lead. Next.js, design systems.",                                  role:"Frontend Lead",    team:"Product",         expertise_domains:["frontend","nextjs","design-systems"] },
  { id:"p5", node_type:"Person", name:"Jordan Lee",      title:"Jordan Lee — DevOps",           description:"Owns Slack integration and CI/CD pipeline.",                               role:"DevOps Engineer",  team:"Infrastructure",  expertise_domains:["devops","ci-cd","slack-integration"] },
  { id:"c1", node_type:"Concept", title:"Organizational Cognition", description:"Collective intelligence and decision-making capacity of the org as a system." },
  { id:"c2", node_type:"Concept", title:"Knowledge Graph",          description:"Graph-based representation of decisions, people, risks, and relationships." },
  { id:"c3", node_type:"Concept", title:"Bus Factor",               description:"Minimum team members who must be unavailable before a project stalls." },
  { id:"c4", node_type:"Concept", title:"Decision DNA",             description:"Complete chain of reasoning and evidence behind an architectural decision." },
  { id:"x1", node_type:"Contradiction", title:"Contradicts: monolith strategy",    description:"Q3 microservices decision contradicts Q1 monolith commitment. 4 services mid-migration." },
  { id:"x2", node_type:"Contradiction", title:"Contradicts: REST API deprecation", description:"New services built on v1 REST while v1 deprecation is active." },
];

function buildNodes(W: number, H: number): GNode[] {
  return RAW_NODES.map(n => ({
    ...n, r: n.node_type === "Decision" ? 7 : n.node_type === "Contradiction" ? 7 : 6,
    x: 60 + Math.random() * (W - 120), y: 60 + Math.random() * (H - 120),
    vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
  }));
}

const TYPE_COUNTS = Object.entries(
  RAW_NODES.reduce((acc, n) => { acc[n.node_type] = (acc[n.node_type] ?? 0) + 1; return acc; }, {} as Record<string, number>)
);

export default function GraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<GNode[]>([]);
  const [selected, setSelected] = useState<GNode | null>(null);
  const [filter, setFilter] = useState<string>("All");
  const [showFilter, setShowFilter] = useState(true);
  const [edgeCount, setEdgeCount] = useState(0);

  const PROX = 160;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W; canvas.height = H;

    nodesRef.current = buildNodes(W, H);
    let rafId: number;
    let hov: GNode | null = null;
    let edgeCnt = 0;

    function frame() {
      if (!canvas) return;
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W; canvas.height = H;

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, W, H);

      const allNodes = nodesRef.current;
      const visible = filter === "All" ? allNodes : allNodes.filter(n => n.node_type === filter);

      const edges: [GNode, GNode][] = [];
      for (let i = 0; i < visible.length - 1; i++) {
        for (let j = i + 1; j < visible.length; j++) {
          const d = Math.hypot(visible[j].x - visible[i].x, visible[j].y - visible[i].y);
          if (d < PROX) edges.push([visible[i], visible[j]]);
        }
      }
      edgeCnt = edges.length;

      const hovConn = new Set<GNode>();
      if (hov) edges.forEach(([a, b]) => {
        if (a === hov) hovConn.add(b);
        if (b === hov) hovConn.add(a);
      });

      // edges
      edges.forEach(([a, b]) => {
        const isHov = hov && (a === hov || b === hov);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = isHov ? "rgba(0,229,204,0.55)" : "rgba(0,0,0,0.07)";
        ctx.lineWidth = isHov ? 1.5 : 1;
        ctx.stroke();
      });

      // nodes
      visible.forEach(n => {
        const col = NODE_COLORS[n.node_type] ?? "#888";
        const isHov = n === hov, isSel = n === selected, isConn = hovConn.has(n);
        const r = n.r + (isHov ? 2 : 0);
        // colored filled circle
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isHov || isSel ? col : (isConn ? col + "CC" : col + "99");
        ctx.fill();
        if (isSel) { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); }
        // white center
        ctx.beginPath(); ctx.arc(n.x, n.y, r * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF"; ctx.fill();
        // label
        ctx.font = "11px Inter, sans-serif"; ctx.textAlign = "center";
        ctx.fillStyle = isHov || isSel ? col : "#777";
        ctx.fillText((n.title ?? n.name ?? "").split(" ").slice(0, 2).join(" "), n.x, n.y + r + 13);
      });

      // physics
      visible.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x - n.r < 0 || n.x + n.r > W) { n.vx *= -1; n.x = Math.max(n.r, Math.min(W - n.r, n.x)); }
        if (n.y - n.r < 0 || n.y + n.r > H) { n.vy *= -1; n.y = Math.max(n.r, Math.min(H - n.r, n.y)); }
      });

      setEdgeCount(edgeCnt);
      rafId = requestAnimationFrame(frame);
    }
    frame();

    // hover + click
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const visible = filter === "All" ? nodesRef.current : nodesRef.current.filter(n => n.node_type === filter);
      let best: GNode | null = null, bd = 60;
      visible.forEach(n => { const d = Math.hypot(n.x - mx, n.y - my); if (d < bd) { bd = d; best = n; } });
      hov = best;
      canvas.style.cursor = best ? "pointer" : "default";
    };
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const visible = filter === "All" ? nodesRef.current : nodesRef.current.filter(n => n.node_type === filter);
      let best: GNode | null = null, bd = 30;
      visible.forEach(n => { const d = Math.hypot(n.x - mx, n.y - my); if (d < bd) { bd = d; best = n; } });
      setSelected(best);
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("click", onClick);
    return () => { cancelAnimationFrame(rafId); canvas.removeEventListener("mousemove", onMove); canvas.removeEventListener("click", onClick); };
  }, [filter, selected]);

  const filteredCount = filter === "All" ? RAW_NODES.length : RAW_NODES.filter(n => n.node_type === filter).length;

  return (
    <div style={{ height: "calc(100vh - 96px)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Network size={24} color="#00e5cc" />
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em", color: "#111" }}>Knowledge Graph</h1>
        </div>
        <button onClick={() => setShowFilter(p => !p)} style={{
          display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px",
          background: showFilter ? "#F0FDFB" : "#F5F5F5", border: "1px solid " + (showFilter ? "#99F6E4" : "#EEE"),
          borderRadius: "8px", fontSize: "13px", color: showFilter ? "#0D9488" : "#666",
          cursor: "pointer", fontWeight: 600,
        }}>
          <Filter size={14} /> Filters
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", gap: "14px", minHeight: 0 }}>
        {/* Canvas */}
        <div style={{ flex: 1, position: "relative", background: "#FFFFFF", border: "1px solid #EEEEEE", borderRadius: "16px", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

          {/* Floating filter panel */}
          {showFilter && (
            <div style={{
              position: "absolute", top: "14px", left: "14px",
              background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
              border: "1px solid #EEEEEE", borderRadius: "14px", padding: "14px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "6px",
            }}>
              <p style={{ fontSize: "11px", color: "#AAA", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px" }}>Node Type</p>
              {["All", ...Object.keys(NODE_COLORS)].map(type => (
                <button key={type} onClick={() => setFilter(type)} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "6px 10px", border: "1px solid " + (filter === type ? (NODE_COLORS[type] ?? "#00e5cc") + "44" : "#EEE"),
                  borderRadius: "7px", background: filter === type ? (NODE_COLORS[type] ?? "#00e5cc") + "12" : "transparent",
                  fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  color: filter === type ? (NODE_COLORS[type] ?? "#00e5cc") : "#666",
                }}>
                  {type !== "All" && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: NODE_COLORS[type], display: "inline-block" }} />}
                  {type}
                </button>
              ))}
            </div>
          )}

          {/* Bottom status bar */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "10px 16px", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)",
            borderTop: "1px solid #EEEEEE", display: "flex", gap: "24px", flexWrap: "wrap",
          }}>
            <span style={{ fontSize: "12px", color: "#AAA", fontFamily: "JetBrains Mono" }}>
              <b style={{ color: "#555" }}>{filteredCount}</b> nodes · <b style={{ color: "#555" }}>{edgeCount}</b> edges
            </span>
            {TYPE_COUNTS.map(([type, count]) => (
              <span key={type} style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: NODE_COLORS[type] ?? "#888", display: "inline-block" }} />
                <span style={{ color: "#999" }}>{count} {type}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Node detail slide-in panel */}
        {selected && (
          <div style={{
            width: "300px", flexShrink: 0, background: "#FFFFFF", border: "1px solid #EEEEEE",
            borderRadius: "16px", padding: "20px", overflowY: "auto",
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
            animation: "pageFadeIn 0.2s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{
                background: (NODE_COLORS[selected.node_type] ?? "#888") + "18",
                color: NODE_COLORS[selected.node_type] ?? "#888",
                border: `1px solid ${(NODE_COLORS[selected.node_type] ?? "#888")}33`,
                padding: "3px 10px", borderRadius: "5px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
              }}>{selected.node_type}</span>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#CCC" }}>
                <X size={16} />
              </button>
            </div>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#111", marginBottom: "10px", lineHeight: "1.4" }}>
              {selected.title ?? selected.name}
            </h2>
            {selected.description && (
              <p style={{ color: "#888", fontSize: "12px", lineHeight: "1.6", marginBottom: "14px" }}>{selected.description}</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {selected.outcome && (
                <div><div style={{ fontSize: "10px", color: "#CCC", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>Outcome</div>
                  <span style={{ fontSize: "13px", color: selected.outcome === "success" ? "#16a34a" : selected.outcome === "pending" ? "#ca8a04" : "#888", fontWeight: 600 }}>{selected.outcome}</span></div>
              )}
              {selected.decision_type && (
                <div><div style={{ fontSize: "10px", color: "#CCC", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>Decision Type</div>
                  <span style={{ fontSize: "13px", color: "#555" }}>{selected.decision_type}</span></div>
              )}
              {selected.role && (
                <div><div style={{ fontSize: "10px", color: "#CCC", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>Role</div>
                  <span style={{ fontSize: "13px", color: "#555" }}>{selected.role}</span></div>
              )}
              {selected.created_at && (
                <div><div style={{ fontSize: "10px", color: "#CCC", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>Created</div>
                  <span style={{ fontSize: "12px", color: "#AAA", fontFamily: "JetBrains Mono" }}>{new Date(selected.created_at).toLocaleDateString()}</span></div>
              )}
              {selected.expertise_domains && selected.expertise_domains.length > 0 && (
                <div>
                  <div style={{ fontSize: "10px", color: "#CCC", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Expertise</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {selected.expertise_domains.map(d => (
                      <span key={d} style={{ background: "#F0FDFB", border: "1px solid #99F6E4", borderRadius: "4px", padding: "2px 8px", fontSize: "11px", color: "#0D9488" }}>{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
