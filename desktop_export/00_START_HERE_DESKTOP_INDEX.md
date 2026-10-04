# OSIRIS Desktop Package — Start Here

OSIRIS is a portfolio simulation built by Nicholas Marnocha / Froghaus Studios. It is not affiliated with or connected to CAL FIRE, USFS, DoD, FAA, NASA FIRMS, CAD, AFF, or IRWIN.

All aircraft tracks, incidents, base allocations, weather, turnaround values, pipeline timings, compute utilization, and alerts are synthetic demonstration data.

## Package map

| File | Purpose |
| --- | --- |
| `01_README_GITHUB.md` | Accurate GitHub overview and local quickstart |
| `02_USER_OPERATIONS_MANUAL.md` | How to navigate and exercise the simulation |
| `03_CASE_STUDY_ERRORS_AND_FIXES.md` | Engineering case study with evidence boundaries |
| `04_SYSTEM_ARCHITECTURE_AND_DIAGRAMS.md` | System topology and data-flow diagrams |
| `05_EXECUTIVE_SLIDE_DECK.md` | Twelve-slide presentation outline |
| `06_PORTFOLIO_LINKEDIN_WEBSITE_GUIDE.md` | Grounded website, résumé, and LinkedIn copy |
| `07_GITHUB_PUSH_INSTRUCTIONS.md` | Repository update workflow |
| `08_BASE_RESOURCE_ALLOCATION_SAMPLE.json` | Synthetic base-allocation scenario |
| `09_PIPELINE_DAG_CONFIG_SAMPLE.json` | Synthetic pipeline configuration and results |
| `10_DATA_PROVENANCE_AND_SOURCE_RECORD_AUDIT.md` | Provenance and policy-boundary record |

## Copy to the Windows Desktop

From PowerShell in the repository root:

```powershell
.\desktop_export\copy_to_desktop.ps1
```

The script creates `Desktop\OSIRIS_EXECUTIVE_PACKAGE` and copies this package there.

## Verify before quoting results

Run `npm test`, `npm run lint`, and `npm run build` from the repository root. Publish only the results from the current commit; do not reuse historic app-builder timings as benchmark evidence.
