# OSIRIS Tactical Air Operations & Pipeline Orchestrator: Operator User Manual

**System Version:** 2.4.0 Production  
**Classification:** Interagency Wildfire Air Operations & Compute Scheduling  
**Author:** Nicholas Marnocha (Froghaus Studios · @Frogman2745)  
**Target Audience:** Incident Commanders, Air Tactical Supervisors (ATGS), Dispatch Coordinators & Operations Engineers  

---

## 1. Tactical Radar Console (OSIRIS TAC-RADAR)

### 1.1 Navigating the Viewport & Zoom Controls
The OSIRIS radar displays high-resolution georeferenced maps of the California theater spanning 32.1°N to 42.1°N latitude and 113.8°W to 125.0°W longitude.

- **Mouse Wheel Zoom:** Scroll the mouse wheel up over the radar canvas to zoom in toward the cursor focus point; scroll down to zoom out (0.7x to 6.0x dynamic scaling).
- **Click & Drag Pan:** Click and hold the primary mouse button or middle mouse button to drag and pan across sectors seamlessly.
- **HUD Zoom Buttons:** Located at the top right of the canvas:
  - `+` : Quick zoom in (+30% magnification)
  - `-` : Quick zoom out (-23% magnification)
  - `100%` : Instant reset to baseline center view and 1:1 scale
- **Sector Preset Selectors:** Use the top toolbar sector buttons to snap the radar view to key operational areas:
  - `All California`: Full statewide theater view (800x600 coordinate baseline)
  - `NorCal / Shasta`: Northern California Cascade and Shasta-Trinity National Forest corridor
  - `Central / Sierra`: Central Valley, Bay Area, Stanislaus, and Sierra Nevada ridge passes
  - `SoCal / Angeles`: Southern California, Angeles National Forest, Cajon Pass, and San Diego sectors

### 1.2 Color Themes (X-Band, FLIR & NVG)
Match ambient lighting or optical sensor modes using the top-right color theme buttons:
- **X-BAND (Cyan):** Default high-contrast marine/airspace surveillance mode for daylight operations.
- **FLIR (Orange/Amber):** Forward-Looking Infrared mode simulating airborne thermal sensor displays for tracking heat plumes and fire fronts through thick smoke.
- **NVG (Night Vision Green):** Low-luminance phosphor mode calibrated for night-vision goggle helicopter operations and night retardant drops.

### 1.3 Tactical Layer & Airspace Toggles
Fine-tune radar visibility by toggling individual tactical overlays on or off:
- **AIRWAYS (ON/OFF):** Displays Federal Victor Airways (V23, V25, V107) and VOR navigation beacons (Sacramento, Red Bluff, Modesto, Shafter, Palmdale).
- **WINDS (ON/OFF):** Displays surface automated meteorological wind barbs with directional arrows and speed/gust feathers, specifically warning of Diablo and Santa Ana offshore wind vectors.
- **CLASS B (ON/OFF):** Renders controlled airspace terminal rings around San Francisco (SFO) and Los Angeles (LAX) to ensure firefighting aircraft maintain positive airspace deconfliction.
- **DROPS (ON/OFF):** Displays active Phos-Chek retardant drop footprints and atomized dispersal droplet spray cones trailing behind airtankers during drop runs.
- **BASES (ON/OFF):** Displays CAL FIRE tactical air attack bases and DoD military airfields with loading pit availability tags.
- **TFRs (ON/OFF):** Renders 5-nautical-mile Temporary Flight Restriction boundaries (`SFC to 12,500' MSL`) around active wildfire complexes.
- **TERRAIN (ON/OFF):** Highlights prominent California mountain peaks (Mt. Shasta, Mt. Whitney, Lassen Peak, Mt. Diablo) and terrain elevation hazard contours.
- **SWEEP (SCAN/HOLD):** Toggles the 360-degree rotating radar scan beam with realistic phosphor persistence decay.
- **DENSITY (2,200+ SURGE):** Engages stress-test mode rendering over 2,200 synthetic targets simultaneously at 60 FPS.

---

## 2. Icon Distinction & Interactive Cursor Hover

### 2.1 Visual Symbology Key
Every icon on the radar represents a distinct operational category with a dedicated vector silhouette:

1. **Lockheed C-130H MAFFS II (`🛩️`)**:
   - *Visual Shape:* Wide-body cargo fuselage with high straight wings, 4 amber engine nacelles, and pressurized retardant nozzle.
   - *Operational Function:* 4-engine heavy turboprop airtanker delivering 4,000 gallons of pressurized Phos-Chek retardant for massive ridge-top containment lines.
2. **Fixed-Wing Airtankers (`✈️`)**:
   - *Visual Shape:* Swept-wing twin or tri-jet/turboprop silhouette (DC-10 VLAT or S-2T Tracker) with a bright retardant beacon.
   - *Operational Function:* Drops high-capacity fire retardant ahead of crowning fire fronts.
3. **Helitack Helicopters (`🚁`)**:
   - *Visual Shape:* Rotary-wing fuselage with spinning dashed rotor blade disk, tail boom, and power snorkel/Bambi bucket attachment.
   - *Operational Function:* Precision drops on canyon flare-ups, structure defense, and rapid insertion of initial-attack crews.
4. **Lead & Recon Planes (`🎯`)**:
   - *Visual Shape:* High-speed tactical diamond silhouette with forward sensor gimbal.
   - *Operational Function:* Air Tactical Group Supervisor (ATGS) scouting smoke paths, setting drop lines with white smoke, and managing TFR airspace.
5. **Active Wildfire Complexes (`🌋`)**:
   - *Visual Shape:* Pulsing red thermal corona ring with high-temperature core hotspot.
   - *Operational Function:* Active wildland fires monitored via satellite VIIRS/MODIS infrared and airborne thermal imaging.
6. **CAL FIRE Air Attack Bases (`🔥`)**:
   - *Visual Shape:* Orange airfield ramp strip with Phos-Chek loading pits and turnaround SLA tracking.
   - *Operational Function:* State rapid-reload airbase with aviation turbine fuel and high-throughput retardant mixing plants.
7. **DoD Military Airfields (`🛡️`)**:
   - *Visual Shape:* Dual crossed runway airfield layout with military shield emblem.
   - *Operational Function:* Federal staging base supporting Air National Guard C-130 MAFFS wings and joint defense logistics.
8. **Victor Airway VOR Waypoints (`🧭`)**:
   - *Visual Shape:* Deep blue navigation triangle with beacon ID and VHF radio frequency.
   - *Operational Function:* Federal transit corridor waypoint for civilian/fire air traffic deconfliction.
9. **Meteorological Wind Stations (`💨`)**:
   - *Visual Shape:* Directional wind arrow with speed barbs and gust flags.
   - *Operational Function:* Automated surface weather station alerting to sudden offshore wind shifts.
10. **Mountain Summits (`⛰️`)**:
    - *Visual Shape:* Topographical peak contour triangle with snowcap accent and elevation label.
    - *Operational Function:* Elevation obstacle with strict minimum safe altitude margins (+2,000' AGL).

### 2.2 Hovering to Inspect Individual Icon Descriptions
- **Move Cursor Over Any Icon:** Simply hover the mouse over any icon on the radar map.
- **In-Canvas Reticle:** A glowing cyan target reticle bracket `[ ⌖ ]` and callout tag immediately illuminate around the hovered target on the canvas.
- **Floating Tactical HUD Tooltip:** A high-contrast glassmorphism tooltip appears adjacent to the cursor displaying:
  - Icon Symbol & Category Label
  - Visual Glyph Shape Description
  - Full Operational Role & Capabilities Paragraph
  - Live Telemetry Breakdown (Altitude MSL, Ground Speed, Heading, Geo Coordinates)
  - Specialized Specs (Payload, Drop System, Assigned Fire, Radio Frequency, Peak Wind Gusts, Elevation)
- **Click to Lock Dossier:** Clicking any aircraft icon locks the target, opening the comprehensive **Aircraft Dossier & Maintenance History** sidebar panel.

---

## 3. DAG Pipeline Orchestrator

### 3.1 Viewing and Running the Pipeline
Select the **ETL Orchestrator** tab in the main navigation:
1. **Interactive SVG Execution Graph:** Visualizes all pipeline stages in topological dependency order (Data Ingestion → Validation → Geospatial Indexing → Plume Modeling → SLA Dispatch).
2. **Parallel Branches:** Identifies concurrent stages executing simultaneously with branch indicators.
3. **Execution Controls:**
   - Click **Run ETL** or **Trigger Pipeline** to start execution.
   - Observe stages transition from `Pending` (amber) → `Running` (cyan pulse) → `Success` (emerald).
   - Real-time elapsed duration and record count update live.

### 3.2 Real-Time Compute Resource Sidebar (CPU & RAM)
The orchestrator sidebar includes a real-time Recharts area chart:
- **Telemetry Metrics:** Tracks dynamic CPU utilization (0-100%) and RAM memory footprint (GB) during pipeline execution.
- **Throttling Badges:** Warns if a stage exceeds compute budget and undergoes rate-limiting.
- **Stage Selector Pills:** Click any stage pill in the sidebar to inspect its specific duration, retry threshold, and predictive compute allocation.
- **Sidebar Toggle:** Toggle the sidebar open or closed via the top view switcher to maximize DAG graph width.

### 3.3 Exporting Pipeline Configurations
Click the **Export Pipeline Configuration** button in the orchestrator action bar:
- Instantly serializes the active DAG topological graph, node settings, execution timeouts, SLA targets, and global variables into a standardized JSON file.
- The browser automatically initiates a download named `pipeline-dag-config-<templateId>-<timestamp>.json`.
- This exported JSON can be stored in source control or ingested by automated CI/CD runners.

---

## 4. Predictive BI & SLA Logistics Console

### 4.1 Predictive Horizon & Interactive Historical Telemetry Tooltips
The **Predictive BI Console** provides continuous evaluation of air operations efficiency, comparing historical turnaround actuals against forward CP-SAT predictive optimization models:

1. **Hovering Over Historical Data Points:**
   - Move your cursor over any historical data point on the cyan turnaround curve.
   - The interactive war room HUD tooltip surfaces complete flight operations telemetry:
     - **Observed Turnaround Time:** Formatted in minutes with a comparative margin indicator (e.g. `-1.8m margin` under ceiling or `+2.8m breach`).
     - **SLA Benchmark Compliance:** Evaluated against California's 20.0-minute mandatory turnaround ceiling.
     - **Variance Z-Score:** Statistical deviation rating (`Z = ±X.Xσ`) indicating whether a turnaround represents nominal variance or an operational outlier.
     - **Sortie Volume:** Exact count of sorties completed on that date across the fleet.
     - **Retardant Dispersal:** Cumulative Phos-Chek retardant delivered in gallons.
     - **Command Airbase:** Designated primary loading airbase for that operational cycle.
     - **Local Meteorological Telemetry:** Temperature, ambient relative humidity, wind speed, and thermal inversion status.
     - **Deployed Fleet:** Tail numbers and callsigns of all aircraft active during the shift.

2. **Inspecting Anomaly Markers on the Chart:**
   - Data points flagged with turnaround delays display custom animated targeting reticles with pulsing beacon cores.
   - Hovering over an anomaly marker reveals an in-depth **Tactical Anomaly Dossier**:
     - **Anomaly Ticket ID & Severity:** e.g. `ANOM-SEP-08` rated `CRITICAL`, `HIGH`, or `MEDIUM`.
     - **Affected Airframe:** Specific tail number (e.g. `TANKER-80 (S-2T Turbo Tracker)`).
     - **Staged Base Sector:** Airbase location (e.g. `Redding Air Attack Base (RDD)`).
     - **Observed vs Expected Limit:** Exact latency breach calculation (e.g. `22.8m observed vs 18.0m expected`).
     - **Diagnosed Root Cause:** Deep mechanical, logistical, or meteorological root cause analysis.
     - **Tactical Mitigation Executed:** Immediate countermeasure implemented by dispatch.
     - **Interactive RCA Resolution CTA:** Click the marker directly on the chart to launch the **Root Cause Resolution & Mitigation Modal**, select an engineering fix, and sign off the investigation.

### 4.2 Real-Time Operational Bases Resource Allocation Bar Chart
Access the dedicated **Base Resource Allocation** view via the top view switcher or toggle the section into your active view using the **BASE BARS ON** button:

1. **Multi-Dimensional Metric Modes:**
   - **Pit Occupancy (`Pits`):** Stacked bar chart showing occupied vs available open loading pits across each base, highlighting congested airbases with >75% utilization in amber.
   - **Retardant Stock (`Retardant`):** Compares on-deck mixed Phos-Chek MVP-Fx against total storage capacity in thousands of gallons (`k Gal`), alerting when reserves fall below 25,000 gallons.
   - **Aircraft Fleet (`Aircraft`):** Visualizes staged aviation units broken down into fixed-wing airtankers, helitack rotorcraft, and lead/recon planes.
   - **Turnaround Latency (`Turnaround`):** Compares average base turnaround times against the red 20.0-minute state SLA ceiling reference line.
   - **Sorties Flown (`Sorties`):** Displays total tactical sorties dispatched from each base today.

2. **Regional Triage & Sorting Controls:**
   - **Region Filters:** Filter the chart to `All Bases (14)`, `North Ops (6)`, `South Ops (5)`, or `Military Airfields (3)`.
   - **Sort Orders:** Sort bases dynamically by `Utilization` (highest congestion first), `Fast Turnaround` (fastest base first), `Max Capacity` (largest facility first), or `Code (A-Z)`.

3. **Interactive Base Dossier & Dispatch Actions:**
   - Hover over any base bar to view real-time pit occupancy, retardant mixes, runway lengths, pumping speeds in GPM, weather, and stationed aircraft.
   - Click any base bar to lock its telemetry in the **Base Logistics Dossier Card**.
   - Trigger a simulated reload sequence or open high-resolution live ramp camera optical feeds directly from the base inspector.
   - Pull complete statewide base allocation records from the desktop directory using `desktop_export/base-resource-allocation-sample.json`.

---

## 5. System Audit & Chaos Harness

- **System Audit (Shield Icon in Header):** Opens the real-time event ledger recording all WebSocket broadcasts, pipeline runs, and operator overrides.
- **Chaos Engineering Harness:** Injects synthetic API latency, database connection drops, or malformed schema payloads to verify pipeline retry resilience.
- **Vitest Live Test Runner:** View results from the 22 automated unit and integration tests verifying pipeline sequencing and autoscaling logic.
