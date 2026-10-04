# OSIRIS — Wildfire Operations Simulation

OSIRIS is a React and TypeScript portfolio prototype for exploring wildfire-aviation status views and dependency-aware data workflows in one operator-oriented interface.

> All operational values are synthetic demo scenarios. OSIRIS is not a dispatch, incident-command, flight-following, or safety-of-flight system and has no live agency data connection.

## Implemented features

- Canvas 2D California map with ten-category vector symbology
- Interactive aircraft, incident, airspace, weather, and base overlays
- Configurable DAG visualization, stage controls, notes, and JSON export
- Express/WebSocket collaboration for local multi-client demonstrations
- Synthetic predictive-dashboard, base-allocation, autoscaling, and failure-injection scenarios
- Vitest suites covering pipeline, predictive-dashboard, and autoscaling behavior
- Portable documentation and sample-scenario package

## Local quickstart

```bash
npm install
npm run dev
```

## Verification

```bash
npm test
npm run lint
npm run build
```

Report the current command results, commit SHA, and environment when publishing test evidence. The repository does not claim live-agency integration or verified production-scale performance.

Verified locally on October 3, 2026: 30/30 Vitest tests passed across three suites, `tsc --noEmit` completed with zero errors, and the Vite production build completed successfully. Vite emitted a bundle-size advisory for the largest generated chunk.

## Scenario parameters

The 16.5-minute baseline and 20-minute threshold are configurable simulation values. They are not represented as universal CAL FIRE or NWCG airtanker-turnaround mandates.

## Repository

https://github.com/Frogman2745/osiris-tactical-radar
