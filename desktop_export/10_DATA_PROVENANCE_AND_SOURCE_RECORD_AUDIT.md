# OSIRIS Data Provenance and Source-Record Audit

## Finding

Earlier app-builder output used unqualified “live” and “real-time” language for generated dashboard values and described 16.5/20-minute scenario thresholds as universal CAL FIRE or NWCG airtanker-turnaround mandates. Those representations were not supported and were unsafe to publish.

## Corrected classification

- All aircraft tracks, incidents, base allocations, weather, turnaround values, pipeline metrics, compute readings, alerts, users, and activity records are synthetic demo data.
- OSIRIS has no live connection to CAL FIRE, USFS, DoD, FAA, NASA FIRMS, CAD, AFF, IRWIN, PagerDuty, PostgreSQL, Kafka, or agency storage.
- The 16.5-minute baseline and 20-minute threshold are configurable scenario parameters used to demonstrate optimization and anomaly behavior.
- OSIRIS makes no claim that either value is a universal statutory, CAL FIRE, or NWCG PMS 505 pit-turnaround mandate.

## Remediation

1. Added an always-available demo-scenario control in the header.
2. Added provenance language across the public documentation and career copy.
3. Replaced the agency-looking endpoint with `example.invalid` and removed the secret-looking placeholder value.
4. Removed unverified performance, uptime, and operational-readiness claims from public career materials.
5. Restricted the résumé-tailoring helper to résumé-grounded facts and explicit prototype language.

## Evidence policy

Only current, reproducible `npm test`, `npm run lint`, and `npm run build` results may be cited. Performance claims require a benchmark artifact that records hardware, browser, dataset, method, sample count, percentile statistics, and commit SHA.

This audit does not certify the software for operational use or independently validate agency policy.
