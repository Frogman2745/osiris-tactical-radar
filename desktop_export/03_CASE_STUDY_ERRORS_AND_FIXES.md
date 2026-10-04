# Engineering Case Study — Errors, Fixes, and Evidence Boundaries

## JSX and component integrity

Large dashboard components became difficult to reason about when nested controls and conditional panels grew together. The repair separated concerns into components, restored balanced JSX, and used TypeScript checks plus production builds as the gate.

## Canvas state freshness

Animation callbacks can capture stale React state. Mutable values used inside the render loop were mirrored in refs, while declarative UI state remained in React. Automated tests cover surrounding transformation and autoscaling behavior; frame-rate claims require a separate reproducible browser benchmark and are not presented as verified release evidence.

## Dense-marker interaction

The map keeps drawing and hit-testing in one Canvas surface instead of creating thousands of DOM nodes. Spatial-hover and surge behavior are implemented, but historic sub-millisecond numbers from app-builder summaries are excluded until a benchmark harness records environment, sample size, percentile statistics, and commit SHA.

## Chart event typing

Chart click payloads were normalized at the component boundary rather than propagated as loosely typed objects. This keeps selection behavior explicit and limits library-specific assumptions.

## Synthetic-data disclosure

The most important correction was product truthfulness: labels that implied live agency feeds were changed to demo-scenario language, the header exposes provenance, fake production endpoints and credentials were removed, and the 16.5/20-minute values are described as configurable scenario parameters.

## Verification gate

The release is ready to cite only after the current checkout passes `npm test`, `npm run lint`, and `npm run build`.
