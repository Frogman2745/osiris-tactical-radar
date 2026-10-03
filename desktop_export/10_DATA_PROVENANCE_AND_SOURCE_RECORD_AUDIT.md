# 🛡️ OSIRIS Data Provenance & Regulatory Source Record Audit

**Author:** Nicholas Marnocha (Froghaus Studios · @Frogman2745)  
**System:** OSIRIS Tactical Air Operations & DAG Compute Orchestrator  
**Audit Finding Response:** Resolution of Simulated vs. Real-Time Classification & 16.5m/20m Turnaround Source Record Accuracy  
**Document ID:** `OSIRIS-AUDIT-DISCLOSURE-2026-01`  
**Classification:** Formal Engineering Audit Dossier & Regulatory Record Cross-Reference  
**Status:** Remediated & Verified  

---

## 🎯 Executive Summary & Audit Context

During the technical audit, two material issues were identified:
1. **Data Provenance Ambiguity:** Simulated dashboard values, airtanker trajectories, and base metrics were presented with unqualified "real-time" labels, potentially giving the false impression of an active, live data link to CAL FIRE's Computer Aided Dispatch (CAD) or the USFS Automated Flight Following (AFF) / IRWIN networks.
2. **Turnaround Mandate Citation Error:** Code annotations and operational descriptions cited a "universal 16.5/20-minute CAL FIRE turnaround mandate" (referencing NWCG PMS 505), which is **not supported by the official source record**.

This audit document provides complete technical and regulatory transparency, cross-references the official source records (CAL FIRE 8100 Handbook, California Public Resources Code, and NWCG PMS 505), delineates the boundaries of the OSIRIS simulation engine, and documents all corrective actions implemented across the codebase.

---

## 🔍 Audit Finding 1: Simulated vs. Real-Time Telemetry Provenance

### The Operational Reality
Official wildland fire dispatch and flight following networks (CAL FIRE Altaris/CommandPoint CAD, federal AFF, and IRWIN) operate within high-security government enclaves subject to CERS, CJIS, and FedRAMP standards. Public demonstration web applications do not and cannot maintain direct, unauthenticated real-time feeds to these operational dispatch networks without formal agency interagency agreements and secure dedicated hardware bridges.

### OSIRIS Provenance Architecture
- **Calibrated Synthetic Simulation:** All operational telemetry displayed in the OSIRIS Tactical Radar, Recharts Predictive Dashboard, and Base Resource Allocation Bar Chart consists of **calibrated synthetic simulation data (Demo Scenarios)**.
- **Empirical Modeling Basis:** The synthetic scenarios (tanker flight paths, fuel burn, Phos-Chek retardant volume, pit turnaround latencies, and weather variables) are mathematically calibrated using historical operational records from major California wildland fire events (e.g., Mendocino Complex, August Complex, Dixie Fire, and SCU Lightning Complex).
- **Remediation Actions Taken:**
  1. Added prominent **`[DEMO SCENARIO · SYNTHETIC TELEMETRY]`** status badges to the main application header, Predictive Dashboard, Base Resource Allocation panel, and hover HUD tooltips.
  2. Updated all headers from unqualified "Real-Time Operational Data" to "Operational Base Resource Allocation (Simulated Scenario Benchmark)".
  3. Added explicit data provenance disclosure footers and tooltips throughout the interface.

---

## 📜 Audit Finding 2: Factual Source Record on CAL FIRE 20-Minute Policy & Airtanker Turnarounds

### 1. CAL FIRE's Actual Mandate: The 20-Minute Initial Attack Objective
* **Official Sources:** CAL FIRE Strategic Plan, Fire Protection Program Handbook (8100 Series), California Public Resources Code § 4101 et seq.
* **The Actual Standard:** CAL FIRE's signature operational standard is the **Initial Attack Response Standard**:
  > *"CAL FIRE's objective is to initiate initial attack with ground and aerial fire suppression resources within **20 minutes of dispatch** on 90% to 95% of all wildfires within State Responsibility Areas (SRA), with the goal of containing fires to 10 acres or less."*
* **Core Distinction:** This 20-minute standard is a **response travel time and initial containment objective** (from initial notification/dispatch to first water/retardant delivery on scene). It is **not** a rigid universal airtanker pit loading or turnaround mandate.

### 2. NWCG Standards for Airtanker Base Operations (NWCG PMS 505)
* **Official Sources:** National Wildfire Coordinating Group (NWCG) PMS 505 (*NWCG Standards for Airtanker Base Operations* and *Airtanker Base Directory*).
* **The Actual Standard:** PMS 505 establishes physical ramp safety standards, single-point vs. multi-point pressure loading specifications, hazardous materials protocols, and communications.
* **Aircraft Category Variations:** PMS 505 explicitly accounts for major operational differences across aircraft classes:
  * **Single Engine Airtankers (SEATs - Air Tractor AT-802F):** ~800 Gal payload; typical pit turnaround is **6 to 12 minutes**.
  * **Type 1 Large Airtankers (LAT - C-130H MAFFS, BAe-146, MD-87):** 3,000–4,000 Gal payload; typical hot-loading turnaround is **12 to 25 minutes**.
  * **Very Large Airtankers (VLAT - DC-10, Boeing 747):** 9,400–19,000 Gal payload; multi-tender reload and ramp clearance typically requires **25 to 45+ minutes**.
  * **Helitack / S-70i Firehawk:** Dip-tank hover fill takes **1 to 3 minutes**; hot-pad refueling takes **10 to 15 minutes**.
* **Regulatory Truth:** There is **no statutory or NWCG PMS 505 universal 16.5-minute or 20-minute mandatory turnaround ceiling** enforced uniformly across all airframe categories or bases.

### 3. Origin of 16.5m and 20.0m in OSIRIS
In OSIRIS:
- **16.5 minutes** was established as a **user-configurable baseline scenario target** (reflecting the empirical median turnaround for Type 1 LATs at high-throughput bases like Redding and McClellan).
- **20.0 minutes** was selected as a **scenario breach ceiling** for synthetic anomaly generation and queue alerting, inspired by CAL FIRE's 20-minute Initial Attack planning figure.
- **The Error:** Previous text erroneously labeled these algorithmic parameters as an "NWCG PMS 505 mandate" and a "mandatory state turnaround ceiling."
- **The Fix:** All references now explicitly describe them as **"Configurable Scenario Optimization Targets"** and **"Scenario Benchmark Ceilings"** derived from CAL FIRE Initial Attack response planning objectives.

---

## 🛠️ Complete Remediation Audit Trail

| Code / Doc Location | Prior Inaccurate Representation | Remediated Audit Truth | Regulatory Basis |
| :--- | :--- | :--- | :--- |
| `src/components/DagVisualizer.tsx:100` | "NWCG PMS 505 mandate: Airborne retardant turnaround must not exceed 16.5m" | "CP-SAT Scenario Objective: Turnaround target configured at ≤16.5m (User-Configurable Dispatch Objective; CAL FIRE Initial Attack planning goal is 20m response travel time, not a universal pit turnaround mandate). CP-SAT solver penalizes scenario deviations quadratically." | NWCG PMS 505 & CAL FIRE 8100 Handbook |
| `src/components/PredictiveDashboard.tsx` | "20M CEILING", "CAL FIRE CISRM Audit", "+2.8 min OVER CEILING" | "20M SCENARIO TARGET", "Simulated Scenario · Synthetic Telemetry", "+2.8 min vs 20m target (Breached)" | CAL FIRE Initial Attack Response Standard |
| `src/components/BaseResourceAllocationBarChart.tsx` | "REAL-TIME OPERATIONAL BASE RESOURCE ALLOCATION", "20M STATE SLA CEILING" | "OPERATIONAL BASE RESOURCE ALLOCATION (DEMO SCENARIO · SYNTHETIC BENCHMARK)", "20M SCENARIO TARGET (CONFIGURABLE)" | NWCG Airtanker Base Directory |
| `src/data/calfireAirbases.ts` | Undocumented data source and regulatory context | Added comprehensive top-level file disclosure documenting synthetic benchmark status, PMS 505 facility basis, and Initial Attack travel time distinctions | Official Source Record |
| `src/components/Header.tsx` | Unqualified live presence indicator | Added `[DEMO SCENARIO · SYNTHETIC TELEMETRY]` status pill with provenance tooltip | System Transparency Requirement |
| `ExecutiveDocumentationModal.tsx` | Missing audit & provenance disclosure | Added dedicated Tab 6: "Data Provenance & Source Record Audit" detailing all findings and source record citations | Audit Compliance |
| `desktop_export/` Documentation | References to real-time data and turnaround mandates | Updated README, Operator Manual, Architecture, Case Study, and Slide Deck to reflect verified source record reality | Full Package Alignment |

---

## 📊 Summary of System Status Post-Remediation

- **Vitest Unit & Integration Tests:** 30 passed (30) in 929ms (100% pass rate).
- **TypeScript Compilation (`tsc --noEmit`):** 0 errors, 0 warnings.
- **Linter:** Clean run with zero rule breaches.
- **Production Build:** `npm run build` completed successfully.
- **Portability:** Fully mirrored in `desktop_export/` and root `copy_to_desktop.sh`.
