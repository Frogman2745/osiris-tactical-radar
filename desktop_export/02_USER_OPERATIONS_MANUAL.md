# OSIRIS User Operations Manual

## Safety and provenance notice

OSIRIS is a synthetic portfolio simulation. Do not use it for dispatch, flight following, incident command, resource ordering, or safety-of-flight decisions.

## Navigation

- Use the header tabs to open the ETL Orchestrator, Predictive BI, Analytics Studio, Collaborative Briefings, and Career & Portfolio Hub.
- The amber `DEMO SCENARIO` control opens the provenance disclosure.
- Use mouse-wheel zoom and drag-to-pan on the tactical map. Hover for scenario details; click a target to lock its dossier.

## DAG workflow

1. Review stage dependencies and the synthetic record counts.
2. Use `Run ETL` to exercise the local simulation.
3. Inspect stage states, notes, retry behavior, and generated configuration.
4. Export JSON to capture the current scenario; exported values remain synthetic.

## Predictive dashboard

- Switch among pits, retardant stock, aircraft, turnaround, and sorties.
- Filters and sort controls change only the in-browser scenario dataset.
- The 20-minute line is a configurable scenario target, not a statutory or agency-wide pit-turnaround rule.

## Failure injection

Chaos and saturation controls intentionally generate simulated latency, schema drift, connection failures, and resource pressure. They do not contact PagerDuty, CAL FIRE, USFS, or infrastructure outside the local app.

## Documentation bundle

Open `Manual & Slides` to browse the package and download a ZIP. Use the PowerShell copy script for a persistent Windows Desktop copy.
