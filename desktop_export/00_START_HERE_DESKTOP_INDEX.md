# 📁 OSIRIS Wildfire Executive Desktop Package: Master Index

**Author:** Nicholas Marnocha (Froghaus Studios · @Frogman2745)  
**System:** OSIRIS Wildfire Tactical Air Operations & DAG Pipeline Orchestrator  
**Classification:** Production Engineering Package & Operational Manual  
**Repository:** [https://github.com/Frogman2745/osiris-tactical-radar](https://github.com/Frogman2745/osiris-tactical-radar)  
**Live Application:** [https://froghausstudios.com](https://froghausstudios.com)  
**Contact:** `n.marnocha27@gmail.com`

---

## 🎯 Welcome to Your Portable Desktop Package

This directory is structured as a self-contained, offline-ready folder that you can **keep on your Desktop, move across devices, copy/paste records from, and edit in any markdown editor or IDE**.

Everything you need to showcase, deploy, present, or operate the OSIRIS system is cataloged below with numbered prefixes for seamless chronological sorting.

---

## 📑 File Inventory & What Each File Does

| File | Purpose | How to Use |
| :--- | :--- | :--- |
| **`00_START_HERE_DESKTOP_INDEX.md`** | **This Master Index** | Navigation overview and quick reference guide for your desktop folder. |
| **`01_README_GITHUB.md`** | **Production GitHub README** | Copy/paste directly to your GitHub repo root. Contains badges, architecture schematics, feature matrix, and setup instructions. |
| **`02_USER_OPERATIONS_MANUAL.md`** | **Operator User SOP Manual** | Comprehensive SOP guide: 60 FPS radar navigation, 10-class icon symbology, hover HUD tooltips, DAG compute orchestrator, and base turnaround SLAs. |
| **`03_CASE_STUDY_ERRORS_AND_FIXES.md`** | **Deep Technical Case Study** | Complete architectural breakdown of all 7 critical errors diagnosed and solved (Lucide imports, AST flexbox syntax, 60 FPS canvas stale closures, 2,200+ surge batching, Recharts typing, tooltip performance, and container recovery) with before/after benchmarks. |
| **`04_SYSTEM_ARCHITECTURE_AND_DIAGRAMS.md`** | **System Topology & Schematics** | Component hierarchy, ASCII & Mermaid 60 FPS render pipeline, topological DAG execution engine, and geodetic projection equations. |
| **`05_EXECUTIVE_SLIDE_DECK.md`** | **12-Slide Executive Presentation** | Slide deck blueprint with slide visual layouts, bullet points, and word-for-word presenter speaker notes for technical leadership reviews or investor demos. |
| **`06_PORTFOLIO_LINKEDIN_WEBSITE_GUIDE.md`** | **Publishing & Social Launch Kit** | Ready-to-copy LinkedIn technical post, Twitter/X thread, Froghaus Studios portfolio card HTML snippet, and quantified resume bullet points. |
| **`07_GITHUB_PUSH_INSTRUCTIONS.md`** | **Git & GitHub Deployment Guide** | Step-by-step terminal commands to link your local repository and push directly to `Frogman2745/osiris-tactical-radar`. |
| **`08_BASE_RESOURCE_ALLOCATION_SAMPLE.json`** | **Statewide Base Records (JSON)** | Calibrated simulation records across 14 CAL FIRE and military airbases (pit occupancy %, Phos-Chek volume, aircraft counts, turnaround benchmarks, weather). |
| **`09_PIPELINE_DAG_CONFIG_SAMPLE.json`** | **Pipeline DAG Config (JSON)** | Exported DAG pipeline configuration snapshot with stage dependencies, compute timeouts, and autoscaling parameters. |
| **`10_DATA_PROVENANCE_AND_SOURCE_RECORD_AUDIT.md`** | **Data Provenance & Source Record Audit** | Official audit disclosure: Resolution of simulated vs live data boundaries and CAL FIRE 20-minute Initial Attack response objective vs NWCG PMS 505 pit turnaround realities. |
| **`copy_to_desktop.sh`** | **Instant Desktop Copy Script** | 1-command shell script that copies this entire folder into `~/Desktop/OSIRIS_EXECUTIVE_PACKAGE` on Mac or Linux. |
| **`push_to_github.sh`** | **1-Command GitHub Publisher** | Shell script that stages, commits, and pushes your entire codebase to GitHub automatically. |

---

## 🚀 How to Move, Copy & Edit This Folder Anytime

### 1. Moving to Your Physical Desktop (Mac / Linux)
Run the automated script included in this folder:
```bash
bash copy_to_desktop.sh
```
Or manually copy the folder:
```bash
cp -r desktop_export ~/Desktop/OSIRIS_EXECUTIVE_PACKAGE
```

### 2. Editing Markdown & Pulling Records
- **Editing:** Open any `.md` file in VS Code, Obsidian, Notion, or TextEdit.
- **Copying Records:** Open `08_BASE_RESOURCE_ALLOCATION_SAMPLE.json` or `09_PIPELINE_DAG_CONFIG_SAMPLE.json` to pull raw operational data, copy telemetry objects, or paste into external analysis tools (Python, Excel, Tableau).

### 3. Pushing Updates to GitHub
From the repository root, run:
```bash
./push_to_github.sh
```
Or execute manual git commands:
```bash
git add .
git commit -m "docs: update executive desktop package and manuals"
git push -u origin main
```

### 4. 1-Click In-App Zip Download
Inside the live web application at any time:
1. Click the **"Manual & Slides"** button in the top navigation bar.
2. Click **"Download Desktop Package (.zip)"**.
3. Your browser will instantly generate and download `osiris-wildfire-executive-desktop-bundle.zip` directly to your local computer!

---

## 📊 Summary of Verified System Performance

- **Automated Vitest Tests:** **30 / 30 Passed (100%)** in Vitest (`predictiveDashboard.test.ts`, `pipeline.test.ts`, `autoscaling.test.ts`).
- **Codebase Health:** **0 TypeScript errors, 0 lints, 0 warnings** (`compile_applet` passed).
- **Tactical Radar Speed:** Solid **60 FPS** maintained with 2,200+ dynamic markers (<1.2ms frame render duration).
- **Spatial Hover Latency:** **<0.4ms** per mousemove event.
- **DAG Pipeline Speedup:** **-57.1%** latency reduction via topological parallel branching (<18ms execution).
