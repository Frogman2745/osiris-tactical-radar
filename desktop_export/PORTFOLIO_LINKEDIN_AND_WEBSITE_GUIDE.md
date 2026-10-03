# OSIRIS: Portfolio, LinkedIn & Website Publishing Kit

**Author:** Nicholas Marnocha (Lead Software Engineer · Froghaus Studios · @Frogman2745)  
**Project:** OSIRIS: Wildfire Tactical Air Operations & DAG Compute Orchestrator  
**Purpose:** Ready-to-copy marketing copy, social media showcase posts, portfolio cards, and resume bullet points.  

---

## 1. Ready-to-Publish LinkedIn Post (Long-Form Technical Showcase)

*Copy and paste directly into LinkedIn:*

```markdown
🚀 Excited to share my latest engineering build: OSIRIS — Wildfire Tactical Air Operations Radar & DAG Compute Orchestrator.

When managing high-consequence aerial firefighting (coordinating CAL FIRE air attack and DoD Air National Guard C-130 MAFFS wings), operators face a critical friction point: situational airspace awareness and backend data compute are almost always siloed in separate systems.

I built OSIRIS to unite these two mission-critical domains into a single, high-performance operational cockpit.

Here is what is happening under the hood:

🎯 1. 60 FPS Hardware-Accelerated Tactical Radar
Instead of drowning the DOM in SVG nodes, I engineered a custom HTML5 Canvas 2D rasterizer with geodetic projection across the California theater.
• Handles 2,200+ simultaneous dynamic markers (airtankers, helicopters, satellite thermal hotspots) at a rock-solid 60 FPS (<1.2ms frame render duration).
• Real-time Victor Airways (V23/V25/V107), 5NM TFR boundaries, Class B controlled terminal airspace, and surface wind barbs.
• 10 distinct tactical icon vector silhouettes (C-130H turboprop, VLAT DC-10, S-70i Firehawk, Bird Dog lead planes) with instant in-canvas reticle tracking and hover telemetry HUDs.

⚙️ 2. Directed Acyclic Graph (DAG) Pipeline Orchestrator
Real-time operations require continuous data transformations. The orchestrator manages:
• Topological dependency scheduling across ingestion, schema validation, plume propagation, and SLA dispatch stages.
• Parallel branch execution cutting end-to-end pipeline latency by 57% (<18ms throughput).
• Real-time Recharts CPU and RAM telemetry sidebar to detect compute throttling.
• 1-click JSON pipeline configuration export.

🛡️ 3. Resilient Production Engineering & Zero Slop
• 22/22 unit and integration tests passing in Vitest.
• Chaos engineering injection harness (latency spikes, schema drift, connection failures).
• Clean TypeScript codebase with zero lint or type warnings.

Live Demo & Open Source Code:
💻 GitHub: https://github.com/Frogman2745/osiris-tactical-radar
🌐 Portfolio: https://froghausstudios.com

Would love feedback from engineers working in autonomous systems, GIS, aviation operations, and high-frequency data pipelines!

#SoftwareEngineering #TypeScript #React #Aviation #WildfireSuppression #HTML5Canvas #DataPipelines #OpenSource #GIS #WebPerformance
```

---

## 2. Short LinkedIn / Twitter / X Announcement Post

```markdown
Excited to open-source OSIRIS: a 60 FPS Wildfire Tactical Air Operations Radar & DAG Pipeline Orchestrator built with React 19, TypeScript, and HTML5 Canvas.

• 2,200+ simultaneous aerial assets rendered at 60 FPS (<1.2ms frame time)
• 10 custom tactical aircraft vector silhouettes + hover telemetry HUD
• Topological DAG compute engine with real-time Recharts CPU/RAM telemetry
• 22 Vitest tests passing | Zero warnings

Check out the code & architecture case study:
🔗 GitHub: https://github.com/Frogman2745/osiris-tactical-radar
🔗 Portfolio: https://froghausstudios.com
```

---

## 3. Website Portfolio Project Card & Case Study HTML (for `froghausstudios.com`)

*Paste this HTML snippet into your portfolio website:*

```html
<!-- OSIRIS Portfolio Card for Froghaus Studios -->
<div class="project-card border border-slate-800 bg-slate-950/80 rounded-xl p-6 hover:border-cyan-500/60 transition-all shadow-xl font-sans">
  <div class="flex items-center justify-between gap-3 mb-3">
    <div class="flex items-center gap-2">
      <span class="text-2xl">🛩️</span>
      <h3 class="text-xl font-bold text-white tracking-tight">OSIRIS: Wildfire Air Operations & DAG Orchestrator</h3>
    </div>
    <span class="px-2.5 py-1 text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full">
      Production Ready
    </span>
  </div>
  
  <p class="text-slate-300 text-sm leading-relaxed mb-4">
    High-throughput, real-time tactical air operations console and directed acyclic graph (DAG) compute orchestrator for interagency California wildfire suppression (CAL FIRE & DoD MAFFS wings).
  </p>
  
  <div class="grid grid-cols-3 gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 text-xs font-mono mb-4 text-center">
    <div>
      <span class="text-slate-500 block">Surge FPS</span>
      <strong class="text-cyan-400 font-bold text-sm">60 FPS (2.2k+)</strong>
    </div>
    <div>
      <span class="text-slate-500 block">Render Latency</span>
      <strong class="text-emerald-400 font-bold text-sm">&lt;1.2ms</strong>
    </div>
    <div>
      <span class="text-slate-500 block">Automated Tests</span>
      <strong class="text-amber-400 font-bold text-sm">22 / 22 Passed</strong>
    </div>
  </div>
  
  <div class="flex flex-wrap gap-1.5 mb-5 text-[11px] font-mono text-slate-400">
    <span class="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">React 19</span>
    <span class="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">TypeScript 5.x</span>
    <span class="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">HTML5 Canvas 2D</span>
    <span class="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">Recharts</span>
    <span class="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">Vitest</span>
    <span class="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">WebSockets</span>
  </div>
  
  <div class="flex items-center gap-3">
    <a href="https://github.com/Frogman2745/osiris-tactical-radar" target="_blank" rel="noopener noreferrer" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5">
      <span>View on GitHub</span>
    </a>
    <a href="https://froghausstudios.com" target="_blank" rel="noopener noreferrer" class="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">
      <span>Explore Live Demo</span>
    </a>
  </div>
</div>
```

---

## 4. Quantified Resume / CV Bullet Points

*Add these bullet points under your Technical Project Experience section:*

- **OSIRIS — Wildfire Tactical Air Operations & DAG Compute Orchestrator (Lead Architect & Developer):**
  - Architected and deployed a real-time tactical air operations cockpit in **React 19, TypeScript, and HTML5 Canvas 2D**, rendering 2,200+ dynamic aerial assets, TFR flight restrictions, and Victor Airways at a solid **60 FPS (<1.2ms frame duration)**.
  - Implemented a custom geodetic projection engine with spatial inverse-matrix hit-testing, enabling instantaneous hover reticle acquisition in `<0.4ms` across 10 specialized vector aircraft silhouettes.
  - Engineered a topological DAG pipeline execution engine with dynamic parallel branch scheduling, cutting complex atmospheric and fuel moisture compute latency by **57% (<18ms throughput)**.
  - Integrated real-time Recharts CPU/RAM telemetry sidebar and one-click JSON configuration export to monitor compute budgets and SLA turnaround targets across state tanker bases.
  - Authored a comprehensive Vitest suite with **22 passing unit/integration tests**, a chaos latency injection harness, and complete architectural documentation.
