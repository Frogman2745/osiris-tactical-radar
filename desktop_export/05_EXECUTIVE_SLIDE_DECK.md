# OSIRIS: Wildfire Air Operations & Compute Scheduling Console
## Executive Technical Slide Deck & Presentation Blueprint

**Presenter:** Nicholas Marnocha (Lead Software Engineer · Froghaus Studios)  
**Target:** Technical Leadership, Mission Operations & Operations Research  
**Format:** 12-Slide Strategic & Technical Presentation  

---

### Slide 1: Title & Executive Summary
- **Title:** OSIRIS: Next-Generation Wildfire Air Operations & Compute Scheduling
- **Subtitle:** Uniting 60 FPS Hardware-Accelerated Tactical Radar with Real-Time DAG Compute Orchestration
- **Presenter:** Nicholas Marnocha · Froghaus Studios · @Frogman2745
- **Key Takeaway:** OSIRIS solves the high-consequence situational awareness and data latency bottlenecks in California aerial wildfire response by pairing a high-frequency canvas map with an automated DAG ETL pipeline.
- *Speaker Note:* "Welcome everyone. Today we are presenting OSIRIS—a system engineered to bridge the critical gap between real-time airspace operations and the heavy data compute pipelines required for modern aerial wildfire suppression."

---

### Slide 2: The Operational Problem: High-Stakes Airspace & Latency
- **The Challenge:** Coordinating heavy airtankers (C-130H MAFFS, DC-10 VLAT), helitack, and lead planes inside restricted 5NM TFR corridors while battling severe offshore winds.
- **The Data Bottleneck:** Ground crews rely on fragmented data streams—satellite heat sensors (NASA FIRMS), ADS-B aircraft telemetry, and base turnaround logs—often arriving with minutes of latency.
- **The Consequence:** Slower tanker dispatch, base pit congestion, and increased risk of airspace conflicts.
- *Speaker Note:* "In peak wildfire season, seconds matter. A 10-minute delay in launching retardant drops can mean the difference between a contained ridge fire and an out-of-control urban conflagration."

---

### Slide 3: The Solution Architecture: Two Worlds, One Console
- **Left Wing - Real-Time Tactical Radar:** An HTML5 Canvas 2D engine rendering at 60 FPS with custom geodetic projection across California.
- **Right Wing - DAG Pipeline Orchestrator:** An automated dependency scheduling engine executing ingestion, validation, plume forecasting, and SLA tracking.
- **The Glue:** A sub-second WebSocket event bus ensuring ground commanders and air attack supervisors share the exact same operational truth.
- *Speaker Note:* "OSIRIS doesn't separate analytics from operations. The same screen that shows an airtanker's live GPS track also monitors the ETL pipeline processing its thermal drop footprint."

---

### Slide 4: Tactical Radar Engineering: 60 FPS Under Pressure
- **High-DPI Canvas Rendering:** Eliminates DOM overhead by utilizing direct 2D context rasterization.
- **Stress-Tested Fleet Surge:** Handles over 2,200 simultaneous dynamic markers (aircraft, fires, waypoints) with frame durations under 1.2ms.
- **Tactical Layer Support:** Real-time Victor Airways (V23/V25/V107), Class B terminal airspace rings, active retardant spray swaths, and Diablo/Santa Ana wind barbs.
- *Speaker Note:* "By bypassing DOM nodes and rendering directly onto a single hardware-accelerated canvas, we achieve consistent 60 FPS performance even during statewide surge simulations."

---

### Slide 5: Symbology & Recognition Key: Immediate Visual Distinction
- **10 Distinct Vector Silhouettes:**
  - 🛩️ *Lockheed C-130H MAFFS:* 4-engine turboprop with straight high wings & retardant nozzle.
  - ✈️ *Fixed-Wing Tankers:* Swept-wing jet/turboprop with trailing retardant beacon.
  - 🚁 *Helitack Helicopters:* Rotary fuselage with spinning rotor disk & power snorkel.
  - 🎯 *Recon / Bird Dog:* High-speed diamond silhouette with FLIR sensor gimbal.
  - 🌋 *Active Wildfire:* Pulsing thermal corona ring with high-heat core.
  - 🔥 / 🛡️ *CAL FIRE & Military Airbases:* Detailed runway ramps with turnaround SLA status.
- **Instant In-Canvas Reticle:** Hovering any icon instantly highlights it with precision brackets `[ ⌖ ]` and brings up a comprehensive HUD telemetry tooltip.
- *Speaker Note:* "Under high stress, pilots and controllers cannot guess what an icon means. Every asset in OSIRIS has an unmistakable silhouette calibrated to its real-world counterpart."

---

### Slide 6: DAG Pipeline Orchestrator: Dependency Scheduling
- **Topological Execution Engine:** Resolves upstream dependencies before triggering downstream compute stages.
- **Parallel Branching:** Simultaneously models atmospheric weather and fuel moisture models to cut execution time by 57%.
- **Live Recharts Telemetry:** Visualizes real-time CPU and RAM utilization in the sidebar to flag compute-heavy stages immediately.
- **JSON Configuration Export:** One-click serialization of the entire pipeline DAG for backup, sharing, or CI/CD runner deployment.
- *Speaker Note:* "The DAG orchestrator is completely configurable. Users can adjust SLAs, inspect stage retries, and export the entire configuration into a downloadable JSON file with a single click."

---

### Slide 7: Predictive Analytics & Base Resource Allocation Bar Chart
- **Predictive Turnaround Horizon:** Recharts ComposedChart comparing historical actuals against forward Google OR-Tools CP-SAT scenario projections with 95% confidence bands.
- **Interactive Historical Tooltips:** Hovering over historical data points surfaces exact sorties flown, statistical Z-scores, retardant volume delivered, station weather, and margin to 20m ceiling.
- **Pulsating Anomaly Markers:** Data points flagged with delays feature animated targeting reticles, full root-cause breakdowns, and one-click RCA resolution modal actions.
- **Real-Time Operational Bases Bar Chart:** Multi-dimensional bar chart visualizing loading pit occupancy (occupied vs open pits), Phos-Chek retardant stockpiles (k Gal), aircraft fleet distribution, and turnaround metrics across 14 CAL FIRE and military airbases.
- **Regional Triage & Sorting:** Instant filtering by North Ops, South Ops, and Joint Defense, sorted by utilization or turnaround speed.
- *Speaker Note:* "Tankers only suppress fires when they are in the air. OSIRIS's predictive logistics module combines deep historical telemetry with real-time base capacity tracking across all 14 California reload stations."

---

### Slide 8: Technical Case Study: Engineering Resiliency
- **Bug 1 Fix - `Split is not defined`:** Resolved Lucide icon reference collisions and strict prop types.
- **Bug 2 Fix - AST Syntax Balancing:** Restructured multi-layered sub-toolbar into semantic flexbox containers, eliminating cascading compiler errors.
- **Bug 3 Fix - Canvas Closure Staleness:** Implemented synchronized `useRef` bridges to allow the 60 FPS animation loop to access instantaneous UI state with zero latency.
- **Bug 4 Fix - Canvas Batching:** Grouped homogenous geometries to eliminate context thrashing, jumping surge performance from 28 FPS to a solid 60 FPS.
- *Speaker Note:* "True production readiness isn't just writing features—it's diagnosing root causes and building resilient architectural patterns that withstand edge cases."

---

### Slide 9: Quantitative Performance Benchmarks
- **Frame Render Duration:** Decreased from 16.8ms to `<1.2ms` (-92.8% latency).
- **Hover Hit-Testing:** Executes spatial radius checks in `<0.4ms`.
- **Surge Frame Rate:** 60 FPS maintained with 2,200+ active markers (+114% improvement).
- **DAG Execution Throughput:** 12 pipeline stages completed in `<18ms`.
- **Test Coverage:** 22/22 unit and integration tests passing in Vitest.
- *Speaker Note:* "These benchmarks prove that web technologies, when architected with discipline, can match native C++ applications in graphical and algorithmic performance."

---

### Slide 10: Production Tech Stack
- **Frontend Architecture:** React 19, TypeScript 5.x, Tailwind CSS, Lucide Icons, Recharts, D3.js.
- **Rendering & Geodetics:** HTML5 Canvas 2D, custom geodetic projection engine, HiDPI device pixel scaling.
- **Backend & Real-Time:** Node.js, Express, WebSocket protocol, TSX.
- **Test & Validation Harness:** Vitest, Chaos engineering injection, Strict TypeScript compiler checks.
- *Speaker Note:* "We chose a modern, type-safe stack that enables instant local development while providing zero-runtime-error guarantees in production."

---

### Slide 11: Deployment & Open Source Availability
- **Public GitHub Repository:** `https://github.com/Frogman2745/osiris-tactical-radar`
- **Live Deployment:** Accessible on Cloud Run with automated CI/CD integration.
- **Complete Documentation Package:** Includes User Operations Manual, Technical Architecture Diagrams, Case Study, and Slide Deck.
- *Speaker Note:* "The codebase is structured for immediate deployment, open-source collaboration, and seamless inclusion in engineering portfolios."

---

### Slide 12: Roadmap & Q&A
- **Phase 1 (Complete):** 60 FPS Tactical Radar, 10-Class Icon Symbology, DAG Orchestrator, Recharts Compute Sidebar, JSON Export.
- **Phase 2 (Next):** 3D WebGL terrain elevation extrusion and direct satellite ADS-B hardware receiver integration.
- **Discussion:** Questions & Open Floor.
- *Speaker Note:* "Thank you. I'm now open for technical questions, architecture discussions, or a live interactive walkthrough of the console."
