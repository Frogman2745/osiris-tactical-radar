# OSIRIS: Wildfire Tactical Air Operations Radar & DAG Pipeline Orchestrator

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)](https://froghausstudios.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.0-cyan.svg)](https://react.dev/)
[![HTML5 Canvas](https://img.shields.io/badge/Canvas%202D-60%20FPS-orange.svg)](https://developer.mozilla.org/)
[![Vitest](https://img.shields.io/badge/Vitest-22%20Passed-green.svg)](https://vitest.dev/)
[![Author](https://img.shields.io/badge/Author-Nicholas%20Marnocha-purple.svg)](https://github.com/Frogman2745)

> High-throughput, real-time tactical air operations console and directed acyclic graph (DAG) compute orchestrator for interagency California wildfire suppression (CAL FIRE & DoD Air National Guard MAFFS wings).

---

## 🌟 Live Demos & Author Links

- **Live Application:** [OSIRIS Live Deployment](https://froghausstudios.com)
- **Author Portfolio:** [Froghaus Studios](https://froghausstudios.com)
- **GitHub Profile:** [@Frogman2745](https://github.com/Frogman2745)
- **Contact:** `n.marnocha27@gmail.com`

---

## 🎯 Executive Overview & Purpose

In active wildland fire operations, incident commanders, air attack supervisors (ATGS), and dispatch coordinators must manage high-consequence spatial airspace while scheduling multi-stage compute pipelines (FIRMS thermal ingestion, plume propagation, fuel moisture modeling, and base turnaround tracking).

**OSIRIS** unites these mission-critical domains into a unified, high-performance operational cockpit:
1. **60 FPS Hardware-Accelerated Tactical Radar:** Renders 2,200+ simultaneous air assets, thermal fire hotspots, Class B terminal airspace, active Phos-Chek retardant drop swaths, Victor airways, and surface wind barbs on custom California geodetic projections.
2. **Interactive Symbology & Recognition Key:** Decodes 10 specialized tactical icon categories with instant in-canvas reticle tracking, cursor hover telemetry, and operational role breakdowns.
3. **Directed Acyclic Graph (DAG) Pipeline Orchestrator:** Schedules inter-stage dependencies with parallel branching, real-time Recharts CPU/RAM telemetry, SLA breach detection, chaos injection testing, and one-click JSON pipeline configuration export.
4. **Predictive Dashboard with Interactive Telemetry Tooltips:** Monitors historical actuals and CP-SAT predictive turnaround horizons with customized interactive Recharts tooltips. Hovering over historical flight records surfaces exact sorties flown, statistical Z-scores, retardant volume delivered, station weather, and margin to the 20m scenario target benchmark. Hovering over anomaly markers reveals pulsating severity tags, root-cause diagnostic reports, and instant root-cause resolution actions.
5. **Operational Bases Resource Allocation Bar Chart (Simulated Benchmark):** Visualizes ground infrastructure across 14 CAL FIRE and military airbases using Recharts BarChart. Features multi-dimensional metric modes (loading pit occupancy, Phos-Chek retardant stockpiles in k Gal, deployed aircraft fleet counts, scenario turnaround benchmarks, and daily sorties), regional filters (North Ops, South Ops, Joint Defense), sorting, and interactive base dossier telemetry.

---

## 🛡️ Data Provenance & Regulatory Source Record Disclosure

> **Transparency Notice:** OSIRIS is a tactical air operations and simulation platform designed for operational research, capacity planning, and dispatch algorithm evaluation.
>
> 1. **Calibrated Synthetic Data (Demo Scenarios):** All telemetry, transponder tracks, pit occupancy rates, and turnaround times are synthetic simulation data calibrated against historical California wildfire flight profiles (e.g. Mendocino Complex, August Complex, Dixie Fire). OSIRIS is **not** an active, unclassified link to live CAL FIRE Computer Aided Dispatch (CAD) or federal Automated Flight Following (AFF) / IRWIN feeds.
> 2. **Regulatory Source Record Clarification:**
>    - **CAL FIRE's 20-Minute Initial Attack Goal:** CAL FIRE's foundational policy standard (CAL FIRE 8100 Handbook / Public Resources Code) is the **Initial Attack response travel time standard**: initiating attack within **20 minutes of dispatch** on 90–95% of wildland fires to keep them at 10 acres or less. This is a *response travel and initial containment objective*, NOT an airtanker pit turnaround mandate.
>    - **NWCG PMS 505 (Airtanker Base Operations):** PMS 505 governs physical base specs, pit safety, and loading protocols. It establishes **no universal 16.5m or 20m statutory turnaround ceiling**; pit turnarounds legitimately vary by airframe (Type 1 LATs: 12–25m, VLATs: 25–45m, SEATs: 6–12m, Helitack: 1–15m).
>    - **OSIRIS Scenario Parameters:** The 16.5m target and 20.0m ceiling in OSIRIS are **user-configurable scenario parameters** used in mathematical constraint programming (Google OR-Tools CP-SAT) for simulation stress-testing, not regulatory mandates. See `10_DATA_PROVENANCE_AND_SOURCE_RECORD_AUDIT.md` for full citations.

---

## 🚀 Key Feature Matrix

| Subsystem | Capabilities | Technology Stack |
| :--- | :--- | :--- |
| **Tactical Radar Canvas** | 60 FPS HiDPI rendering, CRT phosphor scanlines, 2,200+ surge stress mode, Victor Airways (V23/V25/V107), 5NM TFR NOTAMs, Diablo/Santa Ana wind vectors | HTML5 Canvas 2D, Geodetic Math, HiDPI DPR scaling |
| **Icon Symbology & Hover** | Distinct silhouettes for C-130H MAFFS, VLAT DC-10, S-2T Tracker, Helitack CH-47D/Firehawk, Bird Dog OV-10, FIRMS Hotspots, and Airfields. In-canvas reticle + dynamic hover tooltip | React 19, Vector Geometry, Viewport Collision Math |
| **Predictive Dashboard Charts** | Interactive tooltips displaying specific historical ground truth points (sorties, Z-score, weather, fuel/slurry) and pulsating anomaly markers with RCA resolution triggers | Recharts ComposedChart, Monotone Splines, Custom Dot Reticles |
| **Base Resource Bar Chart** | Calibrated loading pit utilization %, Phos-Chek retardant stocks, fleet distributions, and scenario turnaround targets across 14 bases with region filtering and sorting | Recharts BarChart, Stacking, ResponsiveContainer |
| **Pipeline Orchestrator** | Visual topological DAG execution, dynamic parallel execution branches, real-time Recharts compute telemetry, auto-scaling SLA thresholds, and JSON configuration serialization | React, SVG Topological Layout, Recharts, Blob API |
| **Predictive Logistics** | CAL FIRE base loading pits, retardant stock levels, scenario turnaround monitors, and aircraft maintenance dossiers | WebSockets, Synthetic telemetry ETL, Statistical Forecasting |
| **Resilience & Testing** | Comprehensive automated test suite (30/30 tests), Chaos latency injection harness, schema drift guards, and zero TypeScript lint errors | Vitest, TypeScript, Strict Linting |

---

## 🏗️ Architectural Topology

```
+-----------------------------------------------------------------------------------+
|                        OSIRIS Tactical Operations Cockpit                         |
+-----------------------------------------------------------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                                                   |
        v                                                                   v
+-------------------------------+                         +---------------------------------+
|   Tactical Radar Subsystem    |                         |  DAG Compute Orchestration Sub  |
|  (60 FPS HTML5 Canvas 2D)     |                         |    (SVG Topology + Recharts)    |
+-------------------------------+                         +---------------------------------+
| • Geo-Projection Engine       |                         | • Topological Node Sorter       |
| • 10-Class Icon Symbology     |                         | • Parallel Branch Execution     |
| • Laser Radar Sweep (Phosphor)|                         | • Real-Time CPU/RAM Telemetry   |
| • 2,200+ Surge Marker Stress  |                         | • SLA Turnaround Enforcement    |
| • Dynamic Hover Reticle & HUD |                         | • Config Export / Import JSON   |
+-------------------------------+                         +---------------------------------+
        |                                                                   |
        +---------------------------------+---------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                Telemetry Dispatch, WebSockets & In-Memory Data Store              |
|          (Aircraft Dossiers, Base Turnaround SLAs, FIRMS Satellite Feeds)         |
+-----------------------------------------------------------------------------------+
```

---

## 🛠️ Quickstart & Local Setup

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/Frogman2745/osiris-tactical-radar.git
cd osiris-tactical-radar

# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests
npm test

# Verify type safety and linting
npm run lint
```

The application runs on `http://localhost:3000` with hot reloading and interactive mock telemetry streaming.

---

## 📊 Benchmark Performance

- **Radar Frame Latency:** `<1.2ms` render loop duration per frame at 60 FPS with 2,200+ markers.
- **DAG Execution Throughput:** 12 pipeline stages evaluated in under `18ms` with zero unhandled promise rejections.
- **Hover Hit-Testing Latency:** Dynamic spatial radius search executes in `<0.4ms` per mouse move event.
- **Memory Footprint:** Baseline browser memory consumption stays under `68MB` during continuous animation.

---

## 📄 License & Attribution

Architected and developed by **Nicholas Marnocha** ([Froghaus Studios](https://froghausstudios.com) / [@Frogman2745](https://github.com/Frogman2745)).
Licensed under the [MIT License](LICENSE).
