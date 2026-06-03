'use client';

declare global {
  interface Window {
    setTab: (el: HTMLElement, id: string) => void;
  }
}

export default function Home() {
  return (
    <>
      <style>{`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Inter',system-ui,sans-serif;background:#fff;color:#000;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{text-decoration:none;color:inherit}
nav{position:fixed;top:0;left:0;right:0;z-index:999;display:flex;align-items:center;justify-content:space-between;padding:18px 48px;background:rgba(255,255,255,0.92);backdrop-filter:blur(12px);border-bottom:1px solid rgba(0,0,0,0.06)}
.nav-logo{font-size:15px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
.nav-links{display:flex;gap:32px;position:relative}
.nav-links a{font-size:14px;font-weight:500;color:#555;transition:color .2s}
.nav-links a:hover{color:#000}
.nav-ctas{display:flex;gap:10px}
.btn{padding:10px 22px;border-radius:999px;font-size:14px;font-weight:700;cursor:pointer;border:none;display:inline-block;transition:all .2s}
.btn-dark{background:#000;color:#fff}.btn-dark:hover{background:#222}
.btn-grey{background:#f0f0f0;color:#000}.btn-grey:hover{background:#e5e5e5}
.btn-teal{background:#00E5CC;color:#000}.btn-teal:hover{background:#00cdb8}
.btn-white-outline{background:transparent;color:#fff;border:2px solid rgba(255,255,255,.4)}.btn-white-outline:hover{border-color:#fff;background:rgba(255,255,255,.1)}
.reveal{opacity:0;transform:translateY(48px);transition:opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1)}
.reveal.in{opacity:1;transform:none}
.reveal-scale{opacity:0;transform:scale(.94);transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1)}
.reveal-scale.in{opacity:1;transform:none}
.hero{min-height:100vh;padding:132px 48px 72px;background:#fff;display:flex;flex-direction:column;overflow:hidden}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:#f5f5f5;border-radius:999px;padding:6px 18px 6px 6px;font-size:13px;font-weight:600;margin-bottom:44px;width:fit-content}
.badge-dot{width:8px;height:8px;border-radius:50%;background:#00E5CC;box-shadow:0 0 0 0 rgba(0,229,204,.4);animation:bpulse 2s infinite}
@keyframes bpulse{0%,100%{box-shadow:0 0 0 0 rgba(0,229,204,.4)}50%{box-shadow:0 0 0 10px rgba(0,229,204,0)}}
.hero-h1{font-size:clamp(3.2rem,8.5vw,9rem);font-weight:900;line-height:.87;letter-spacing:-.03em;text-transform:uppercase;color:#000;margin-bottom:36px}
.hero-h1 .teal{color:#00E5CC}
.hero-sub{font-size:clamp(1rem,1.6vw,1.2rem);color:#666;max-width:580px;line-height:1.65;margin-bottom:40px}
.hero-btns{display:flex;gap:12px;margin-bottom:56px}
.graph-wrap{flex:1;min-height:380px;max-height:480px;border-radius:20px;overflow:hidden;background:#050505;border:1px solid #1a1a1a;position:relative}
#graph{width:100%;height:100%;display:block}
.partners{padding:52px 48px;border-top:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0}
.partners-label{text-align:center;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#aaa;margin-bottom:28px}
.partners-row{display:flex;align-items:center;justify-content:center;gap:52px;flex-wrap:wrap}
.partner{font-size:15px;font-weight:800;color:#bbb;letter-spacing:.04em;transition:color .2s}
.partner:hover{color:#000}
.tagline-section{min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:100px 48px;background:#fff}
.tagline-pre{font-size:clamp(2.8rem,7vw,7.5rem);font-weight:900;letter-spacing:-.03em;text-transform:uppercase;color:#000;line-height:.9}
.tagline-words{display:flex;flex-direction:column;font-size:clamp(2.8rem,7vw,7.5rem);font-weight:900;letter-spacing:-.03em;text-transform:uppercase;line-height:.9}
.tw{color:#00E5CC;opacity:0;transform:translateY(32px) skewY(3deg);transition:opacity .55s,transform .55s;display:block}
.tw.in{opacity:1;transform:none}
.features{padding:100px 48px;background:#fff}
.features-label{font-size:clamp(1.4rem,2.5vw,2rem);font-weight:700;font-style:italic;color:#bbb;margin-bottom:48px}
.cards-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.card3{border-radius:28px;padding:40px 36px 52px;min-height:420px;display:flex;flex-direction:column;cursor:default;transition:transform .4s cubic-bezier(.22,1,.36,1),box-shadow .4s}
.card3:hover{transform:translateY(-6px) scale(1.01);box-shadow:0 24px 60px rgba(0,0,0,.12)}
.card3.dark{background:#111;color:#fff}
.card3.teal{background:#00E5CC;color:#000}
.card3.light{background:#f5f5f5;color:#000}
.c3-icon{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:28px}
.card3.dark .c3-icon{background:rgba(0,229,204,.12)}
.card3.teal .c3-icon{background:rgba(0,0,0,.1)}
.card3.light .c3-icon{background:#fff}
.c3-tag{display:inline-block;border-radius:999px;padding:4px 14px;font-size:12px;font-weight:700;margin-bottom:24px;width:fit-content}
.card3.dark .c3-tag{background:rgba(255,255,255,.08);color:#888;border:1px solid rgba(255,255,255,.08)}
.card3.teal .c3-tag{background:rgba(0,0,0,.1);color:#333}
.card3.light .c3-tag{background:#e8e8e8;color:#666}
.card3 h3{font-size:clamp(1.5rem,2.2vw,2rem);font-weight:800;line-height:1.1;margin-bottom:16px}
.card3 p{font-size:15px;line-height:1.65;opacity:.75}
.bento{padding:100px 48px 120px;background:#fff;overflow:hidden}
.bento-h{font-size:clamp(2.2rem,5.5vw,5.5rem);font-weight:900;letter-spacing:-.03em;text-transform:uppercase;text-align:center;margin-bottom:0;color:#000}
.bento-arena{position:relative;width:100%;min-height:620px;margin-top:0;overflow:hidden}
.bi{position:absolute;display:flex;user-select:none;will-change:transform;cursor:default;transition:transform .25s cubic-bezier(.22,1,.36,1),outline .15s}
.score-sec{min-height:100vh;background:#00E5CC;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:100px 48px;position:relative;overflow:hidden}
.score-sec::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 70% 50% at 50% 50%,rgba(255,255,255,.18) 0%,transparent 70%)}
.score-eye{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(0,0,0,.45);margin-bottom:16px;position:relative}
.score-h{font-size:clamp(2rem,5vw,4rem);font-weight:900;letter-spacing:-.03em;color:#000;text-align:center;margin-bottom:56px;position:relative;line-height:1.05}
.gauge-wrap{position:relative;display:flex;align-items:center;justify-content:center;margin-bottom:48px;position:relative}
#gauge{display:block}
.gauge-text{position:absolute;top:50%;left:50%;transform:translate(-50%,-44%);text-align:center}
.gauge-num{font-size:80px;font-weight:900;letter-spacing:-.03em;color:#000;line-height:1}
.gauge-denom{font-size:16px;font-weight:600;color:rgba(0,0,0,.45)}
.score-tag{font-size:clamp(1.1rem,2.5vw,1.8rem);font-weight:700;color:#000;text-align:center;margin-bottom:40px;position:relative}
.chips{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-bottom:44px;position:relative}
.chip{background:rgba(0,0,0,.1);border-radius:999px;padding:8px 20px;font-size:13px;font-weight:600;color:#000}
.score-btns{display:flex;gap:14px;position:relative}
.sbtn{padding:13px 32px;border-radius:999px;font-size:14px;font-weight:700;border:2px solid #000;background:transparent;color:#000;cursor:pointer;transition:all .2s}
.sbtn:hover{background:#000;color:#00E5CC}
.modules{padding:100px 48px;background:#fff}
.modules-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
.mod-cards{display:flex;flex-direction:row;gap:10px;align-items:stretch;perspective:1000px}
.mc{background:#111;color:#fff;border-radius:18px;padding:22px 26px;transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s;cursor:default;flex:1;min-width:0}
.mc:nth-child(1){transform:rotateY(-15deg)}.mc:nth-child(2){transform:rotateY(0deg)}.mc:nth-child(3){transform:rotateY(15deg)}
.mc:hover{transform:rotateY(0deg) scale(1.02) !important;box-shadow:0 12px 40px rgba(0,0,0,.3)}
.mc-lbl{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#00E5CC;margin-bottom:6px}
.mc h4{font-size:15px;font-weight:700;margin-bottom:8px}
.mc-meta{display:flex;align-items:center;gap:8px}
.badge{padding:2px 10px;border-radius:999px;font-size:11px;font-weight:700}
.badge-crit{background:rgba(255,80,80,.2);color:#FF5050}
.badge-ok{background:rgba(34,197,94,.2);color:#22C55E}
.badge-warn{background:rgba(234,179,8,.2);color:#EAB308}
.mod-text h2{font-size:clamp(2rem,3.5vw,3rem);font-weight:900;letter-spacing:-.03em;margin-bottom:20px;line-height:1.1}
.mod-text p{font-size:15px;color:#666;line-height:1.7;margin-bottom:28px}
.src-pills{display:flex;gap:8px;flex-wrap:wrap}
.src{background:#f5f5f5;border-radius:999px;padding:6px 16px;font-size:13px;font-weight:600;color:#444}
.agents-bar{background:#000;padding:52px 48px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:center}
.ap{display:flex;align-items:center;gap:8px;background:#111;border:1px solid #1e1e1e;border-radius:999px;padding:10px 20px;font-size:13px;font-weight:600;color:#fff}
.ad{width:8px;height:8px;border-radius:50%}
.ad.run{background:#00E5CC;animation:adp 1.8s infinite}
.ad.ok{background:#22C55E;animation:adp 2.4s infinite}
.ad.idle{background:#555}
@keyframes adp{0%,100%{opacity:1}50%{opacity:.4}}
.dev{background:#0a0a0a;padding:100px 48px;display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center}
.dev-eye{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#555;margin-bottom:18px}
.dev-h{font-size:clamp(2rem,3.5vw,3rem);font-weight:900;letter-spacing:-.03em;color:#fff;margin-bottom:20px;line-height:1.1}
.dev-sub{font-size:15px;color:#666;line-height:1.6;margin-bottom:36px}
.code-block{background:#111;border-radius:18px;overflow:hidden;border:1px solid #1e1e1e}
.code-tabs{display:flex;border-bottom:1px solid #1e1e1e;padding:0 20px;overflow-x:auto}
.ct{padding:14px 14px;font-size:13px;font-weight:600;color:#555;cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;white-space:nowrap}
.ct.on{color:#00E5CC;border-bottom-color:#00E5CC}
.code-panel{display:none;padding:24px 28px}
.code-panel.on{display:block}
pre{font-family:'Courier New',monospace;font-size:12.5px;line-height:1.75;color:#888;overflow-x:auto;white-space:pre}
.kw{color:#7B2FFF}.str{color:#00E5CC}.cm{color:#444}.ky{color:#ddd}.vl{color:#DCFF2E}.nm{color:#FF9955}
footer{background:#000;color:#fff;padding:72px 48px 44px;border-top:1px solid #111}
.ft{display:grid;grid-template-columns:1.8fr 1fr 1fr 1fr 1fr;gap:40px;margin-bottom:56px}
.ft-brand h2{font-size:22px;font-weight:900;margin-bottom:14px;letter-spacing:.08em}
.ft-brand p{font-size:14px;color:#555;line-height:1.6;margin-bottom:22px;max-width:240px}
.ft-social{display:flex;gap:10px}
.ft-social a{width:34px;height:34px;border-radius:50%;background:#1a1a1a;display:flex;align-items:center;justify-content:center;font-size:13px;color:#888;transition:all .2s}
.ft-social a:hover{background:#333;color:#fff}
.ft-col h4{font-size:12px;font-weight:700;color:#fff;margin-bottom:18px;letter-spacing:.06em;text-transform:uppercase}
.ft-col ul{list-style:none;display:flex;flex-direction:column;gap:10px}
.ft-col li a{font-size:14px;color:#555;transition:color .2s}
.ft-col li a:hover{color:#fff}
.ft-bot{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #111;padding-top:28px;font-size:13px;color:#444}
.ft-note{font-style:italic;font-size:12px}
@media(max-width:900px){
  nav{padding:16px 24px}.nav-links{display:none}
  .hero{padding:100px 24px 60px}
  .partners{padding:40px 24px}.partners-row{gap:28px}
  .tagline-section,.features,.bento,.modules,.agents-bar,.dev,.score-sec,footer{padding-left:24px;padding-right:24px}
  .cards-grid{grid-template-columns:1fr;gap:12px}
  .bento-arena{height:900px}
  .modules-grid{grid-template-columns:1fr;gap:40px}
  .mod-cards{flex-direction:column}
  .mc:nth-child(1){transform:none}.mc:nth-child(2){transform:none}.mc:nth-child(3){transform:none}
  .dev{grid-template-columns:1fr;gap:40px}
  .ft{grid-template-columns:1fr 1fr;gap:28px}
}
#cursor-glow{position:fixed;pointer-events:none;z-index:9999;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,rgba(0,229,204,.38) 0%,rgba(0,229,204,.08) 50%,transparent 70%);transform:translate(-50%,-50%);mix-blend-mode:multiply;will-change:left,top;opacity:0;transition:opacity .3s}
#pixel-canvas{position:fixed;top:0;left:0;pointer-events:none;z-index:998;opacity:0}
.nav-indicator{position:absolute;bottom:0;height:2px;background:#00E5CC;border-radius:2px;pointer-events:none;opacity:0;transition:left .32s cubic-bezier(.22,1,.36,1),width .32s cubic-bezier(.22,1,.36,1),opacity .2s}
.hero-loop-svg{animation:loopSpin 22s linear infinite;flex-shrink:0;opacity:.7}
@keyframes loopSpin{to{transform:rotate(360deg)}}
.hero-btns-row{display:flex;align-items:center;gap:28px;margin-bottom:56px;flex-wrap:wrap}
      `}</style>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div id="cursor-glow" />
      <canvas id="pixel-canvas" />

      <nav>
        <div className="nav-logo">⬡ Nexus Drift</div>
        <div className="nav-links">
          <a href="#features">Platform</a>
          <a href="#modules">Use Cases</a>
          <a href="#dev">API</a>
          <a href="https://nexus-drift.vercel.app/dashboard">Dashboard</a>
        </div>
        <div className="nav-ctas">
          <a href="https://nexus-drift.vercel.app/sign-up" className="btn btn-dark">Start Free</a>
          <a href="#score" className="btn btn-grey">See Score</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-badge"><span className="badge-dot"></span>11 AI Agents Running Now</div>
        <h1 className="hero-h1">
          ORGANIZATIONAL<br />
          COGNITION<br />
          <span className="teal">ENGINE</span>
        </h1>
        <p className="hero-sub">Your organization thinks, remembers, and fails. Nexus Drift makes that intelligence visible — in real time, autonomously, forever.</p>
        <div className="hero-btns-row">
          <div className="hero-btns" style={{margin:0}}>
            <a href="https://nexus-drift.vercel.app/sign-up" className="btn btn-dark">Start Free Trial</a>
            <a href="https://nexus-drift.vercel.app/dashboard" className="btn btn-grey">Book a Demo</a>
          </div>
          <svg className="hero-loop-svg" width="140" height="140" viewBox="0 0 140 140">
            <defs>
              <path id="loopCircle" d="M 70,70 m -52,0 a 52,52 0 1,1 104,0 a 52,52 0 1,1 -104,0" />
            </defs>
            <text fontSize="9.5" fontWeight="700" letterSpacing="2.2" fill="#00E5CC" fontFamily="Inter,sans-serif" textAnchor="start">
              <textPath href="#loopCircle">ORGANIZATIONAL COGNITION ENGINE · AUTONOMOUS AGENTS · KNOWLEDGE GRAPH ·</textPath>
            </text>
          </svg>
        </div>
        <div className="graph-wrap reveal">
          <canvas id="graph" />
        </div>
      </section>

      <div className="partners reveal">
        <p className="partners-label">Trusted by intelligence-driven teams</p>
        <div className="partners-row">
          <span className="partner">GitHub</span>
          <span className="partner">Jira</span>
          <span className="partner">Slack</span>
          <span className="partner">Confluence</span>
          <span className="partner">Linear</span>
          <span className="partner">Google Meet</span>
          <span className="partner">Notion</span>
        </div>
      </div>

      <section className="tagline-section" id="tagline">
        <div className="tagline-pre reveal">A NEW WAY TO</div>
        <div className="tagline-words" id="tw-root">
          <span className="tw" data-d="0">THINK</span>
          <span className="tw" data-d="180">REMEMBER</span>
          <span className="tw" data-d="360">DECIDE</span>
        </div>
      </section>

      <section className="features" id="features">
        <p className="features-label reveal">What makes Nexus Drift different</p>
        <div className="cards-grid">
          <div className="card3 dark reveal" style={{transitionDelay:'.05s'}}>
            <div className="c3-icon">⚡</div>
            <span className="c3-tag">Instant Insights</span>
            <h3>Instant Intelligence</h3>
            <p>Knowledge surfaces in seconds. Not buried in Confluence or lost when engineers leave. Every decision, every reason — instantly queryable.</p>
          </div>
          <div className="card3 teal reveal" style={{transitionDelay:'.15s'}}>
            <div className="c3-icon">🧠</div>
            <span className="c3-tag">Persistent Memory</span>
            <h3>Zero Knowledge Loss</h3>
            <p>Reasoning chains, architectural intent, and institutional decisions preserved — even when employees exit. The org remembers what people forget.</p>
          </div>
          <div className="card3 light reveal" style={{transitionDelay:'.25s'}}>
            <div className="c3-icon">🤖</div>
            <span className="c3-tag">Autonomous</span>
            <h3>11 Autonomous Agents</h3>
            <p>Multi-agent system running 24/7, ingesting GitHub, Jira, Slack, Confluence and more. No configuration. No maintenance. Always on.</p>
          </div>
        </div>
      </section>

      <section className="bento" id="bento">
        <h2 className="bento-h reveal">YOUR COGNITION<br />GRAPH AWAITS</h2>
        <div className="bento-arena" id="arena">
          <canvas id="bento-lines" style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0}} />
        </div>
      </section>

      <section className="score-sec" id="score">
        <p className="score-eye reveal">For Organizations</p>
        <h2 className="score-h reveal">Organizational<br />Consciousness Score</h2>
        <div className="gauge-wrap reveal">
          <canvas id="gauge" width={340} height={230} />
          <div className="gauge-text">
            <div className="gauge-num" id="gnum">0</div>
            <div className="gauge-denom">/ 100</div>
          </div>
        </div>
        <p className="score-tag reveal">Your organization&apos;s intelligence, measured.</p>
        <div className="chips reveal">
          <span className="chip">Knowledge Coherence: 88</span>
          <span className="chip">Decision Consistency: 79</span>
          <span className="chip">Expertise Coverage: 91</span>
          <span className="chip">Memory Completeness: 76</span>
          <span className="chip">Risk Awareness: 84</span>
        </div>
        <div className="score-btns reveal">
          <button className="sbtn">For Enterprises</button>
          <button className="sbtn">For Startups</button>
        </div>
      </section>

      <section className="modules" id="modules">
        <div className="modules-grid">
          <div className="mod-cards reveal">
            <div className="mc">
              <div className="mc-lbl">Watchtower Agent</div>
              <h4>Alert: Knowledge Silo Detected</h4>
              <div className="mc-meta">
                <span className="badge badge-crit">CRITICAL</span>
                <span style={{color:'#666',fontSize:'12px'}}>marcus owns 73% of payment knowledge</span>
              </div>
            </div>
            <div className="mc">
              <div className="mc-lbl">Risk Forecasting</div>
              <h4>Architectural Drift Risk Score: 0.87</h4>
              <div className="mc-meta">
                <span className="badge badge-crit">CRITICAL</span>
                <span style={{color:'#666',fontSize:'12px'}}>GraphQL → REST revert pattern detected</span>
              </div>
            </div>
            <div className="mc">
              <div className="mc-lbl">Decision DNA</div>
              <h4>Adopt Neo4j as primary graph store</h4>
              <div className="mc-meta">
                <span className="badge badge-ok">SUCCESS</span>
                <span style={{color:'#666',fontSize:'12px'}}>Confidence 0.95 · 180 days ago</span>
              </div>
            </div>
          </div>
          <div className="mod-text reveal" style={{transitionDelay:'.15s'}}>
            <h2>Accept intelligence everywhere</h2>
            <p>Get insights from GitHub, Jira, Slack, Confluence, Linear and more. 11 agents ingest, parse, and reason — continuously, without human intervention.</p>
            <div className="src-pills">
              <span className="src">GitHub</span><span className="src">Jira</span><span className="src">Slack</span>
              <span className="src">Confluence</span><span className="src">Linear</span><span className="src">+ 5 more</span>
            </div>
          </div>
        </div>
      </section>

      <div className="agents-bar">
        <div className="ap"><span className="ad run"></span>Watchtower Agent <span style={{color:'#444',marginLeft:'4px'}}>ACTIVE</span></div>
        <div className="ap"><span className="ad ok"></span>Parser Agent <span style={{color:'#444',marginLeft:'4px'}}>RUNNING</span></div>
        <div className="ap"><span className="ad run"></span>Scorer Agent <span style={{color:'#444',marginLeft:'4px'}}>CYCLE 847</span></div>
        <div className="ap"><span className="ad ok"></span>Graph Writer <span style={{color:'#444',marginLeft:'4px'}}>WRITING</span></div>
        <div className="ap"><span className="ad run"></span>Reasoning Agent <span style={{color:'#444',marginLeft:'4px'}}>ACTIVE</span></div>
        <div className="ap"><span className="ad idle"></span>Ingestion Agent <span style={{color:'#444',marginLeft:'4px'}}>POLLING</span></div>
        <div className="ap"><span className="ad ok"></span>MCP Server <span style={{color:'#444',marginLeft:'4px'}}>LISTENING</span></div>
      </div>

      <section className="dev" id="dev">
        <div className="reveal">
          <p className="dev-eye">For Developers</p>
          <h2 className="dev-h">Built for engineers.<br />Designed for organizational scale.</h2>
          <p className="dev-sub">REST API, MCP server, Python SDK. Query your organization&apos;s knowledge graph with a single HTTP call. Stream real-time agent events via SSE.</p>
          <a href="https://nexus-drift.vercel.app/dashboard" className="btn btn-teal" style={{fontSize:'15px',padding:'14px 32px'}}>EXPLORE API →</a>
        </div>
        <div className="code-block reveal" style={{transitionDelay:'.15s'}}>
          <div className="code-tabs">
            <div className="ct on" onClick={(e) => window.setTab(e.currentTarget as HTMLElement,'t1')}>Graph Nodes</div>
            <div className="ct" onClick={(e) => window.setTab(e.currentTarget as HTMLElement,'t2')}>Agents</div>
            <div className="ct" onClick={(e) => window.setTab(e.currentTarget as HTMLElement,'t3')}>Score</div>
            <div className="ct" onClick={(e) => window.setTab(e.currentTarget as HTMLElement,'t4')}>Watchtower</div>
          </div>
          <div id="t1" className="code-panel on"><pre dangerouslySetInnerHTML={{__html:`<span class="kw">curl</span> -X GET <span class="str">"https://nexusdrift-api-7wguxf7noq-uc.a.run.app/api/graph/nodes"</span> \\
  -H <span class="str">"Authorization: Bearer &lt;clerk-session-token&gt;"</span> \\
  -G --data-urlencode <span class="str">"node_type=Decision"</span> \\
     --data-urlencode <span class="str">"limit=5"</span>

<span class="cm"># Response</span>
{
  <span class="ky">"nodes"</span>: [
    {
      <span class="ky">"id"</span>: <span class="str">"d_4f8a2b1c"</span>,
      <span class="ky">"node_type"</span>: <span class="str">"Decision"</span>,
      <span class="ky">"title"</span>: <span class="str">"Adopt Neo4j as graph store"</span>,
      <span class="ky">"outcome"</span>: <span class="str">"success"</span>,
      <span class="ky">"confidence"</span>: <span class="nm">0.95</span>
    }
  ],
  <span class="ky">"total"</span>: <span class="nm">8</span>
}`}} /></div>
          <div id="t2" className="code-panel"><pre dangerouslySetInnerHTML={{__html:`<span class="kw">curl</span> -X GET <span class="str">"https://nexusdrift-api-7wguxf7noq-uc.a.run.app/api/agents/status"</span> \\
  -H <span class="str">"Authorization: Bearer &lt;clerk-session-token&gt;"</span>

<span class="cm"># Response</span>
[
  { <span class="ky">"name"</span>: <span class="str">"watchtower"</span>, <span class="ky">"status"</span>: <span class="str">"running"</span>, <span class="ky">"cycle"</span>: <span class="nm">847</span> },
  { <span class="ky">"name"</span>: <span class="str">"scorer"</span>,     <span class="ky">"status"</span>: <span class="str">"running"</span>, <span class="ky">"score"</span>: <span class="nm">84</span>  },
  { <span class="ky">"name"</span>: <span class="str">"parser"</span>,     <span class="ky">"status"</span>: <span class="str">"running"</span>               },
  { <span class="ky">"name"</span>: <span class="str">"ingestion"</span>,  <span class="ky">"status"</span>: <span class="str">"running"</span>               }
]`}} /></div>
          <div id="t3" className="code-panel"><pre dangerouslySetInnerHTML={{__html:`<span class="kw">curl</span> -X GET <span class="str">"https://nexusdrift-api-7wguxf7noq-uc.a.run.app/api/health"</span>

<span class="cm"># Response</span>
{
  <span class="ky">"status"</span>: <span class="str">"ok"</span>,
  <span class="ky">"version"</span>: <span class="str">"0.1.0"</span>,
  <span class="ky">"environment"</span>: <span class="str">"production"</span>,
  <span class="ky">"dependencies"</span>: {
    <span class="ky">"neo4j"</span>:     <span class="str">"ok"</span>,
    <span class="ky">"firestore"</span>: <span class="str">"ok"</span>
  }
}`}} /></div>
          <div id="t4" className="code-panel"><pre dangerouslySetInnerHTML={{__html:`<span class="kw">curl</span> -X GET <span class="str">"https://nexusdrift-api-7wguxf7noq-uc.a.run.app/api/alerts"</span> \\
  -H <span class="str">"Authorization: Bearer &lt;clerk-session-token&gt;"</span>

<span class="cm"># Response</span>
[
  {
    <span class="ky">"alert_type"</span>: <span class="str">"knowledge_silo"</span>,
    <span class="ky">"severity"</span>:   <span class="str">"critical"</span>,
    <span class="ky">"explanation"</span>: <span class="str">"marcus.rodriguez owns 73% of payment architecture"</span>,
    <span class="ky">"score"</span>: <span class="nm">0.87</span>
  }
]`}} /></div>
        </div>
      </section>

      <footer>
        <div className="ft">
          <div className="ft-brand">
            <h2>⬡ NEXUS DRIFT</h2>
            <p>The autonomous organizational cognition engine. 11 AI agents make your company&apos;s intelligence visible and actionable.</p>
            <div className="ft-social">
              <a href="#" title="X">𝕏</a>
              <a href="#" title="LinkedIn">in</a>
              <a href="https://github.com/Yusra-Shah/Nexus-Drift" title="GitHub">⌥</a>
            </div>
          </div>
          <div className="ft-col"><h4>Platform</h4><ul>
            <li><a href="#">Graph Explorer</a></li><li><a href="#">Time Machine</a></li>
            <li><a href="#">Risk Dashboard</a></li><li><a href="#">Expertise Map</a></li>
            <li><a href="#">Simulation Studio</a></li><li><a href="#">API</a></li>
          </ul></div>
          <div className="ft-col"><h4>Use Cases</h4><ul>
            <li><a href="#">Engineering Teams</a></li><li><a href="#">Onboarding</a></li>
            <li><a href="#">Enterprise</a></li><li><a href="#">Startups</a></li>
            <li><a href="#">AI Teams</a></li>
          </ul></div>
          <div className="ft-col"><h4>Company</h4><ul>
            <li><a href="#">About</a></li><li><a href="#">Blog</a></li>
            <li><a href="#">Careers</a></li><li><a href="#">Press</a></li>
          </ul></div>
          <div className="ft-col"><h4>Legal</h4><ul>
            <li><a href="#">Terms</a></li><li><a href="#">Privacy</a></li>
            <li><a href="#">Security</a></li><li><a href="#">Cookies</a></li>
          </ul></div>
        </div>
        <div className="ft-bot">
          <span>© Nexus Drift 2026. Built for Gemini XPRIZE Hackathon.</span>
          <span className="ft-note">Nexus Drift is not a consulting firm. AI agents are autonomous.</span>
        </div>
      </footer>

      <script dangerouslySetInnerHTML={{__html:`
// CONSTELLATION GRAPH
(function(){
const canvas = document.getElementById('graph');
if(!canvas) return;
const ctx = canvas.getContext('2d');
let W, H;
function resize(){
  W = canvas.width = canvas.parentElement.offsetWidth || 800;
  H = canvas.height = Math.max(canvas.parentElement.offsetHeight||0, 400);
}
resize();
window.addEventListener('resize', ()=>{ resize(); initNodes(); });
const NODE_DEF = [
  {label:'Migrate auth',      type:'Decision',      color:'#00E5CC', r:6},
  {label:'Q3 decision',       type:'Decision',      color:'#00E5CC', r:6},
  {label:'Neo4j adoption',    type:'Decision',      color:'#00E5CC', r:6},
  {label:'Deprecate API',     type:'Decision',      color:'#00E5CC', r:5},
  {label:'Adopt Clerk',       type:'Decision',      color:'#00E5CC', r:5},
  {label:'Turbopack switch',  type:'Decision',      color:'#00E5CC', r:5},
  {label:'Python 3.11',       type:'Decision',      color:'#00E5CC', r:5},
  {label:'Stripe billing',    type:'Decision',      color:'#00E5CC', r:5},
  {label:'Q4 planning',       type:'Decision',      color:'#00E5CC', r:5},
  {label:'Bus factor risk',   type:'Risk',          color:'#FF4444', r:6},
  {label:'Auth gap risk',     type:'Risk',          color:'#FF4444', r:5},
  {label:'ML pipeline gap',   type:'Risk',          color:'#FF4444', r:5},
  {label:'React stale risk',  type:'Risk',          color:'#FF4444', r:5},
  {label:'DevOps SPOF',       type:'Risk',          color:'#FF4444', r:5},
  {label:'Slack bus factor',  type:'Risk',          color:'#FF4444', r:5},
  {label:'Mobile SPOF',       type:'Risk',          color:'#FF4444', r:5},
  {label:'Sarah Chen',        type:'Person',        color:'#7B2FFF', r:6},
  {label:'James Park',        type:'Person',        color:'#7B2FFF', r:5},
  {label:'Priya Nair',        type:'Person',        color:'#7B2FFF', r:5},
  {label:'Alex Kim',          type:'Person',        color:'#7B2FFF', r:5},
  {label:'Jordan Lee',        type:'Person',        color:'#7B2FFF', r:5},
  {label:'Marcus Rodriguez',  type:'Person',        color:'#7B2FFF', r:5},
  {label:'Org Cognition',     type:'Concept',       color:'#FFB800', r:5},
  {label:'Knowledge Graph',   type:'Concept',       color:'#FFB800', r:5},
  {label:'Bus Factor',        type:'Concept',       color:'#FFB800', r:4},
  {label:'Decision DNA',      type:'Concept',       color:'#FFB800', r:4},
  {label:'Expertise Domain',  type:'Concept',       color:'#FFB800', r:4},
  {label:'Arch contradiction',type:'Contradiction', color:'#FF6B2B', r:6},
  {label:'API contradiction', type:'Contradiction', color:'#FF6B2B', r:5},
  {label:'Monolith vs MSvc',  type:'Contradiction', color:'#FF6B2B', r:5},
];
let gNodes=[];
function initNodes(){
  gNodes=NODE_DEF.map(nd=>({...nd,
    x:nd.r+24+Math.random()*(W-nd.r*2-48),
    y:nd.r+24+Math.random()*(H-nd.r*2-52),
    vx:(Math.random()-.5)*0.38, vy:(Math.random()-.5)*0.38,
  }));
}
initNodes();
const PROX=180; let hov=null;
canvas.addEventListener('mousemove',e=>{
  const rect=canvas.getBoundingClientRect();
  const mx=e.clientX-rect.left,my=e.clientY-rect.top;
  let best=null,bd=65;
  gNodes.forEach(n=>{const d=Math.hypot(n.x-mx,n.y-my);if(d<bd){bd=d;best=n;}});
  hov=best;
});
canvas.addEventListener('mouseleave',()=>{hov=null;});
function frame(){
  ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
  const edges=[];
  for(let i=0;i<gNodes.length-1;i++){
    for(let j=i+1;j<gNodes.length;j++){
      const d=Math.hypot(gNodes[j].x-gNodes[i].x,gNodes[j].y-gNodes[i].y);
      if(d<PROX) edges.push([i,j]);
    }
  }
  const hovIdx=hov?gNodes.indexOf(hov):-1;
  const hovConn=new Set();
  edges.forEach(([a,b])=>{if(a===hovIdx)hovConn.add(b);if(b===hovIdx)hovConn.add(a);});
  edges.forEach(([a,b])=>{
    const isHE=hovIdx>=0&&(a===hovIdx||b===hovIdx);
    ctx.beginPath(); ctx.moveTo(gNodes[a].x,gNodes[a].y); ctx.lineTo(gNodes[b].x,gNodes[b].y);
    ctx.strokeStyle=isHE?'rgba(0,229,204,0.6)':'rgba(255,255,255,0.15)';
    ctx.lineWidth=1; ctx.stroke();
  });
  gNodes.forEach((n,i)=>{
    const isHov=i===hovIdx,isConn=hovConn.has(i);
    ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
    ctx.strokeStyle=isHov?n.color:(isConn?n.color+'cc':n.color+'99');
    ctx.lineWidth=isHov?2.5:1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(n.x,n.y,n.r*(isHov?.52:.40),0,Math.PI*2);
    ctx.fillStyle=isHov?'#fff':'rgba(255,255,255,0.88)'; ctx.fill();
    ctx.font='11px Inter,sans-serif'; ctx.textAlign='center';
    ctx.fillStyle=isHov?'#00E5CC':'rgba(255,255,255,0.52)';
    ctx.fillText(n.label,n.x,n.y+n.r+13);
  });
  gNodes.forEach(n=>{
    n.x+=n.vx; n.y+=n.vy;
    if(n.x-n.r<0||n.x+n.r>W){n.vx*=-1;n.x=Math.max(n.r,Math.min(W-n.r,n.x));}
    if(n.y-n.r<0||n.y+n.r>H-28){n.vy*=-1;n.y=Math.max(n.r,Math.min(H-28-n.r,n.y));}
  });
  ctx.fillStyle='#000'; ctx.fillRect(0,H-28,W,28);
  ctx.beginPath(); ctx.moveTo(0,H-28); ctx.lineTo(W,H-28);
  ctx.strokeStyle='rgba(0,229,204,0.18)'; ctx.lineWidth=1; ctx.stroke();
  ctx.font='11px Inter,sans-serif'; ctx.textAlign='left';
  ctx.fillStyle='rgba(255,255,255,0.38)';
  ctx.fillText(gNodes.length+' nodes \xb7 '+edges.length+' edges \xb7 '+gNodes.filter(n=>n.type==='Contradiction').length+' contradictions detected',16,H-9);
  requestAnimationFrame(frame);
}
frame();
})();

// BENTO LISSAJOUS CONSTELLATION
(function(){
  var arena2=document.getElementById('arena');
  if(!arena2) return;
  var ELEMS=[
    {w:180,h:80, sx:35, sy:35, fx:.52,fy:.61,ax:22,ay:18,px:0,   py:.8,
     cs:'background:#111;border-radius:16px;padding:0 18px;flex-direction:column;align-items:flex-start;justify-content:center;gap:5px;',
     ht:'<span style="font-size:10px;color:#00E5CC;font-weight:800;letter-spacing:.1em;text-transform:uppercase">GRAPH EXPLORER</span><span style="font-size:13px;color:#fff;font-weight:500">25 nodes in view</span>'},
    {w:90, h:90, sx:278,sy:28, fx:.63,fy:.48,ax:18,ay:24,px:1.2, py:2.1,
     cs:'background:#00E5CC;border-radius:20px;flex-direction:column;align-items:center;justify-content:center;gap:4px;',
     ht:'<span style="font-size:11px;color:#000;font-weight:800;letter-spacing:.08em;text-transform:uppercase">DECISION</span><span style="font-size:11px;color:rgba(0,0,0,.7);font-weight:500">architectural</span>'},
    {w:200,h:72, sx:470,sy:52, fx:.71,fy:.55,ax:20,ay:20,px:.5,  py:1.7,
     cs:'background:#111;border-radius:12px;padding:0 18px;flex-direction:column;align-items:flex-start;justify-content:center;gap:5px;',
     ht:'<span style="font-size:10px;color:#FF4444;font-weight:800;letter-spacing:.08em;text-transform:uppercase">RISK FORECASTING</span><span style="font-size:13px;color:#fff;font-weight:500">Predict before it breaks</span>'},
    {w:190,h:72, sx:688,sy:38, fx:.44,fy:.67,ax:16,ay:22,px:2.3, py:.4,
     cs:'background:#f5f5f5;border-radius:12px;padding:0 18px;flex-direction:column;align-items:flex-start;justify-content:center;gap:5px;',
     ht:'<span style="font-size:10px;color:#333;font-weight:800;letter-spacing:.08em;text-transform:uppercase">TIME MACHINE</span><span style="font-size:13px;color:#333;font-weight:500">Navigate your history</span>'},
    {w:160,h:44, sx:55, sy:200,fx:.58,fy:.72,ax:24,ay:16,px:3.1, py:1.0,
     cs:'background:#DCFF2E;border-radius:999px;padding:0 22px;align-items:center;justify-content:center;',
     ht:'<span style="font-size:12px;color:#000;font-weight:800">Near-instant reasoning</span>'},
    {w:170,h:44, sx:298,sy:180,fx:.66,fy:.49,ax:20,ay:20,px:.9,  py:2.8,
     cs:'background:#111;border-radius:999px;padding:0 16px;align-items:center;gap:10px;',
     ht:'<span style="width:8px;height:8px;border-radius:50%;background:#00E5CC;flex-shrink:0;display:inline-block"></span><span style="font-size:13px;color:#fff;font-weight:500;font-family:Courier New,monospace">Consciousness 84</span>'},
    {w:170,h:64, sx:542,sy:158,fx:.53,fy:.69,ax:22,ay:18,px:1.8, py:.3,
     cs:'background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:12px;padding:0 16px;flex-direction:column;align-items:flex-start;justify-content:center;gap:8px;',
     ht:'<span style="font-size:13px;color:#333;font-weight:500">11 agents running</span><div style="display:flex;gap:5px;align-items:center"><span style="width:6px;height:6px;border-radius:50%;background:#00E5CC;display:inline-block"></span><span style="width:6px;height:6px;border-radius:50%;background:#7B2FFF;display:inline-block"></span><span style="width:6px;height:6px;border-radius:50%;background:#00E5CC;display:inline-block"></span><span style="width:6px;height:6px;border-radius:50%;background:#7B2FFF;display:inline-block"></span></div>'},
    {w:72, h:72, sx:760,sy:180,fx:.79,fy:.56,ax:14,ay:22,px:2.6, py:1.5,
     cs:'background:#00E5CC;border-radius:50%;flex-direction:column;align-items:center;justify-content:center;gap:2px;',
     ht:'<span style="font-size:11px;color:#000;font-weight:800;letter-spacing:.06em">LIVE</span><span style="font-size:11px;color:#000;font-weight:800;letter-spacing:.06em">AI</span>'},
    {w:160,h:72, sx:38, sy:380,fx:.47,fy:.64,ax:20,ay:18,px:1.4, py:3.2,
     cs:'background:#111;border-radius:12px;padding:0 18px;flex-direction:column;align-items:flex-start;justify-content:center;gap:5px;position:relative;overflow:hidden;',
     ht:'<span style="font-size:10px;color:#00E5CC;font-weight:800;letter-spacing:.08em;text-transform:uppercase">WATCHTOWER</span><span style="font-size:13px;color:#fff;font-weight:500">3 alerts active</span><div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:#FF4444"></div>'},
    {w:180,h:64, sx:255,sy:398,fx:.61,fy:.43,ax:18,ay:24,px:.7,  py:1.9,
     cs:'background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:12px;padding:0 16px;flex-direction:column;align-items:flex-start;justify-content:center;gap:8px;',
     ht:'<span style="font-size:10px;color:#333;font-weight:800;letter-spacing:.08em;text-transform:uppercase">EXPERTISE MAP</span><div style="display:flex;align-items:flex-end;gap:3px;height:14px"><span style="width:8px;height:8px;background:#00E5CC;border-radius:1px;display:inline-block"></span><span style="width:8px;height:14px;background:#00E5CC;border-radius:1px;display:inline-block"></span><span style="width:8px;height:6px;background:#00E5CC;border-radius:1px;display:inline-block"></span><span style="width:8px;height:12px;background:#00E5CC;border-radius:1px;display:inline-block"></span><span style="width:8px;height:10px;background:#00E5CC;border-radius:1px;display:inline-block"></span></div>'},
    {w:160,h:72, sx:502,sy:380,fx:.55,fy:.73,ax:22,ay:16,px:2.0, py:.6,
     cs:'background:#7B2FFF;border-radius:16px;padding:0 18px;flex-direction:column;align-items:flex-start;justify-content:center;gap:5px;',
     ht:'<span style="font-size:10px;color:#fff;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.8">SIMULATION</span><span style="font-size:13px;color:#fff;font-weight:500">73% success rate</span>'},
    {w:190,h:72, sx:700,sy:380,fx:.68,fy:.51,ax:16,ay:20,px:3.4, py:2.2,
     cs:'background:#f0f0f0;border-radius:12px;padding:0 18px;flex-direction:column;align-items:flex-start;justify-content:center;gap:5px;',
     ht:'<span style="font-size:10px;color:#333;font-weight:800;letter-spacing:.08em;text-transform:uppercase">DECISION DNA</span><span style="font-size:12px;color:#888;font-weight:400">Pattern: avoid vendor lock-in</span>'},
  ];
  var items=ELEMS.map(function(cfg){
    var el=document.createElement('div');
    el.className='bi';
    el.style.cssText='display:flex;position:absolute;z-index:1;'+cfg.cs;
    el.style.width=cfg.w+'px'; el.style.height=cfg.h+'px';
    el.style.left=cfg.sx+'px'; el.style.top=cfg.sy+'px';
    el.innerHTML=cfg.ht;
    arena2.appendChild(el);
    var h=false;
    el.addEventListener('mouseenter',function(){h=true;el.style.transform='scale(1.04)';el.style.outline='1px solid rgba(0,0,0,0.15)';});
    el.addEventListener('mouseleave',function(){h=false;el.style.transform='';el.style.outline='';});
    return {el:el,cfg:cfg,hov:function(){return h;},cx:cfg.sx+cfg.w*.5,cy:cfg.sy+cfg.h*.5};
  });
  var wm=document.createElement('div');
  wm.style.cssText='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;z-index:0';
  wm.innerHTML='<div style="font-size:clamp(3rem,6vw,5.5rem);font-weight:900;letter-spacing:-.03em;color:#f0f0f0;text-transform:uppercase;line-height:.9">YOUR COGNITION<br>GRAPH AWAITS</div>';
  arena2.insertBefore(wm,arena2.firstChild);
  var lc=document.getElementById('bento-lines');
  var lctx=lc?lc.getContext('2d'):null;
  function resizeLC(){if(!lc)return;lc.width=arena2.offsetWidth||900;lc.height=arena2.offsetHeight||620;}
  resizeLC(); window.addEventListener('resize',resizeLC);
  var t0=null,lastLF=0;
  function bentoFrame(ts){
    if(!t0)t0=ts;
    var t=(ts-t0)*0.001;
    items.forEach(function(it){
      if(it.hov())return;
      var x=it.cfg.sx+it.cfg.ax*Math.sin(it.cfg.fx*t+it.cfg.px);
      var y=it.cfg.sy+it.cfg.ay*Math.sin(it.cfg.fy*t+it.cfg.py);
      it.el.style.left=x+'px'; it.el.style.top=y+'px';
      it.cx=x+it.cfg.w*.5; it.cy=y+it.cfg.h*.5;
    });
    if(lctx&&ts-lastLF>=33){
      lastLF=ts; lctx.clearRect(0,0,lc.width,lc.height);
      var P=220;
      for(var i=0;i<items.length-1;i++){
        for(var j=i+1;j<items.length;j++){
          var dx=items[j].cx-items[i].cx,dy=items[j].cy-items[i].cy;
          var d=Math.sqrt(dx*dx+dy*dy);
          if(d<P){
            var isH=items[i].hov()||items[j].hov();
            var a=(1-d/P);
            lctx.beginPath();lctx.moveTo(items[i].cx,items[i].cy);lctx.lineTo(items[j].cx,items[j].cy);
            lctx.strokeStyle=isH?'rgba(0,229,204,'+(a*.5).toFixed(3)+')':'rgba(0,0,0,'+(a*.08).toFixed(3)+')';
            lctx.lineWidth=1;lctx.stroke();
          }
        }
      }
    }
    requestAnimationFrame(bentoFrame);
  }
  requestAnimationFrame(bentoFrame);
})();

// SCORE GAUGE
function drawGauge(val) {
  const gc = document.getElementById('gauge');
  const g = gc.getContext('2d');
  const cx2=gc.width/2, cy2=gc.height*.68, r=100;
  const sa=Math.PI*1.05, ea=Math.PI*1.95;
  g.clearRect(0,0,gc.width,gc.height);
  g.strokeStyle='rgba(0,0,0,.12)'; g.lineWidth=16; g.lineCap='round';
  g.beginPath(); g.arc(cx2,cy2,r,sa,ea); g.stroke();
  if(val>0) {
    const pe=sa+(ea-sa)*(val/100);
    g.strokeStyle='#000'; g.lineWidth=16; g.lineCap='round';
    g.beginPath(); g.arc(cx2,cy2,r,sa,pe); g.stroke();
    const ex=cx2+r*Math.cos(pe), ey=cy2+r*Math.sin(pe);
    g.fillStyle='#000'; g.beginPath(); g.arc(ex,ey,9,0,Math.PI*2); g.fill();
  }
}
drawGauge(0);

// INTERSECTION OBSERVER
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('in'); });
}, {threshold:.12});
document.querySelectorAll('.reveal,.reveal-scale').forEach(el=>io.observe(el));

const twIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if(e.isIntersecting) {
      document.querySelectorAll('.tw').forEach(w => {
        setTimeout(()=>w.classList.add('in'), +w.dataset.d);
      });
    }
  });
}, {threshold:.3});
twIO.observe(document.getElementById('tw-root'));

let gaugeRan=false;
const gsIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if(e.isIntersecting && !gaugeRan) {
      gaugeRan=true;
      const target=84, dur=2200, t0=performance.now();
      (function anim(now) {
        const p=Math.min((now-t0)/dur,1);
        const eased=1-Math.pow(1-p,3);
        const cur=Math.round(eased*target);
        document.getElementById('gnum').textContent=cur;
        drawGauge(cur);
        if(p<1) requestAnimationFrame(anim);
      })(performance.now());
    }
  });
}, {threshold:.4});
gsIO.observe(document.getElementById('score'));

// 3D CARD TILT
document.querySelectorAll('.card3').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r=card.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5;
    const y=(e.clientY-r.top)/r.height-.5;
    card.style.transform='perspective(700px) rotateX('+(-y*10)+'deg) rotateY('+(x*10)+'deg) translateY(-6px) scale(1.01)';
  });
  card.addEventListener('mouseleave', ()=>{ card.style.transform=''; });
});

// DEV TABS
function setTab(el,id) {
  document.querySelectorAll('.ct').forEach(t=>t.classList.remove('on'));
  document.querySelectorAll('.code-panel').forEach(p=>p.classList.remove('on'));
  el.classList.add('on');
  document.getElementById(id).classList.add('on');
}

// MODULE CARD HOVER (dome)
const domeAngles=[-15,0,15];
document.querySelectorAll('.mc').forEach((mc,i)=>{
  mc.addEventListener('mouseenter',()=>{ mc.style.transform='rotateY(0deg) scale(1.02)'; });
  mc.addEventListener('mouseleave',()=>{ mc.style.transform='rotateY('+(domeAngles[i]||0)+'deg)'; });
});

// CURSOR GLOW (80ms lag via lerp)
const glow=document.getElementById('cursor-glow');
let gx=window.innerWidth/2,gy=window.innerHeight/2,tx=gx,ty=gy;
document.addEventListener('mousemove',e=>{tx=e.clientX;ty=e.clientY;glow.style.opacity='1';});
(function animGlow(){
  gx+=(tx-gx)*.18; gy+=(ty-gy)*.18;
  glow.style.left=gx+'px'; glow.style.top=gy+'px';
  const ex=Math.min(gx/window.innerWidth,(window.innerWidth-gx)/window.innerWidth);
  const ey=Math.min(gy/window.innerHeight,(window.innerHeight-gy)/window.innerHeight);
  glow.style.opacity=Math.min(Math.min(ex,ey)*14,1);
  requestAnimationFrame(animGlow);
})();

// FLOWING NAV INDICATOR
const navL=document.querySelector('.nav-links');
if(navL){
  const ind=document.createElement('div');
  ind.className='nav-indicator';
  navL.appendChild(ind);
  navL.querySelectorAll('a').forEach(a=>{
    a.addEventListener('mouseenter',()=>{
      const ar=a.getBoundingClientRect(),nr=navL.getBoundingClientRect();
      ind.style.left=(ar.left-nr.left)+'px';
      ind.style.width=ar.width+'px';
      ind.style.opacity='1';
    });
  });
  navL.addEventListener('mouseleave',()=>{ind.style.opacity='0';});
}

// PIXEL DISSOLVE TRANSITION
const pcvs=document.getElementById('pixel-canvas');
const pctx=pcvs.getContext('2d');
function resizePc(){pcvs.width=window.innerWidth;pcvs.height=window.innerHeight;}
resizePc();
window.addEventListener('resize',resizePc);
let lastSec=null,pixId=null;
function runPixel(){
  if(pixId) cancelAnimationFrame(pixId);
  pcvs.style.opacity='1';
  const sz=9,cols=Math.ceil(pcvs.width/sz),rows=Math.ceil(pcvs.height/sz);
  const cells=[];
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) cells.push({x:c*sz,y:r*sz,dl:Math.random()*300});
  const t0=performance.now(),dur=650;
  (function anim(now){
    pctx.clearRect(0,0,pcvs.width,pcvs.height);
    let done=true;
    cells.forEach(cl=>{
      const p=Math.max(0,Math.min(1,(now-t0-cl.dl)/(dur-cl.dl)));
      if(p<1){done=false;pctx.fillStyle='rgba(0,229,204,'+(0.55*(1-p))+')';pctx.fillRect(cl.x,cl.y,sz-1,sz-1);}
    });
    if(!done){pixId=requestAnimationFrame(anim);}else{pcvs.style.opacity='0';}
  })(performance.now());
}
const secIO2=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){if(lastSec&&lastSec!==e.target) runPixel();lastSec=e.target;}
  });
},{threshold:0.25});
document.querySelectorAll('section').forEach(s=>secIO2.observe(s));
`}} />
    </>
  );
}
