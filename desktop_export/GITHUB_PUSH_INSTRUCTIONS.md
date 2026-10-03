# GitHub Push & Setup Guide

**Repository Target:** `https://github.com/Frogman2745/osiris-tactical-radar`  
**Author:** Nicholas Marnocha (@Frogman2745)  

---

## Method 1: Automated Script (Fastest)

Run the automated setup and push script directly from your terminal:

```bash
chmod +x ./push_to_github.sh
./push_to_github.sh
```

---

## Method 2: Manual Step-by-Step Terminal Commands

If you prefer to run each command manually:

```bash
# 1. Initialize local git repository (if not already initialized)
git init -b main

# 2. Add all source files, documentation, and tests
git add .

# 3. Create initial production commit
git commit -m "feat(osiris): production-ready release of tactical radar, DAG orchestrator, 22 vitest tests & executive documentation"

# 4. Create your remote repository on GitHub:
# You can create it via the GitHub website (https://github.com/new) named 'osiris-tactical-radar',
# or via the GitHub CLI:
# gh repo create Frogman2745/osiris-tactical-radar --public --source=. --remote=origin --push

# 5. Link your local repository to GitHub
git remote add origin https://github.com/Frogman2745/osiris-tactical-radar.git

# 6. Push your code to main
git branch -M main
git push -u origin main
```

---

## Recommended Repository Settings on GitHub
- **Description:** `60 FPS Wildfire Tactical Air Operations Radar & DAG Compute Orchestrator for interagency aerial firefighting (CAL FIRE & DoD MAFFS) built with React 19, TypeScript & HTML5 Canvas 2D.`
- **Website URL:** `https://froghausstudios.com`
- **Topics / Tags:** `react`, `typescript`, `canvas-2d`, `wildfire`, `aviation`, `dag-orchestrator`, `data-engineering`, `recharts`, `vitest`, `california`
