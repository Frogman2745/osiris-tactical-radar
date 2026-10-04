# OSIRIS — Wildfire Operations Simulation

OSIRIS is an interactive portfolio prototype that explores how wildfire aviation status views, synthetic resource-allocation scenarios, and dependency-aware data workflows can share one operator-oriented interface.

> **Provenance:** All aircraft tracks, incident details, base allocations, weather, turnaround values, pipeline throughput, compute utilization, and alerts in this repository are synthetic demo data. OSIRIS is not connected to CAL FIRE, USFS, DoD, FAA, FIRMS, CAD, AFF, IRWIN, PagerDuty, or any operational agency system.

## What is implemented

- React 19 and TypeScript interface with Canvas 2D geospatial rendering
- Ten-category vector symbology and interactive aircraft/incident dossiers
- Configurable DAG stages with dependency visualization and JSON export
- WebSocket collaboration implemented by the included Express server
- Synthetic predictive-dashboard, base-allocation, autoscaling, and failure-injection scenarios
- Vitest suites for pipeline, dashboard, and autoscaling behavior
- An in-app documentation hub plus a portable `desktop_export/` package

## Run locally

Requirements: Node.js 22 or newer.

```bash
npm install
npm run dev
```

Then open the local URL printed by the server.

## Verification

```bash
npm test
npm run lint
npm run build
```

The release notes and public portfolio copy should report results from the current commit only. Historic timings or app-builder summaries are not treated as verified evidence.

Verified locally on October 3, 2026: 30/30 Vitest tests passed across three suites, `tsc --noEmit` completed with zero errors, and the Vite production build completed successfully. Vite reports a bundle-size advisory for the largest generated chunk; that warning is tracked separately from correctness.

## Data and policy boundaries

- The 16.5-minute baseline and 20-minute threshold are configurable **scenario parameters**, not universal CAL FIRE or NWCG airtanker-turnaround mandates.
- URLs under `example.invalid` are deliberately non-routable examples.
- `.env.example` contains placeholders only. Never commit real keys.
- This software is for demonstration and portfolio review, not dispatch, flight following, incident command, or safety-of-flight use.

## Documentation

Start with [`desktop_export/00_START_HERE_DESKTOP_INDEX.md`](desktop_export/00_START_HERE_DESKTOP_INDEX.md) and the provenance audit in [`desktop_export/10_DATA_PROVENANCE_AND_SOURCE_RECORD_AUDIT.md`](desktop_export/10_DATA_PROVENANCE_AND_SOURCE_RECORD_AUDIT.md).

## License

No license has been granted yet. Source is publicly inspectable once the repository is made public, but reuse rights remain reserved until a license is added.
