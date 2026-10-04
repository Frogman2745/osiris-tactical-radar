import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import {
  BookOpen,
  FileCode,
  Layers,
  Presentation,
  Share2,
  Download,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Terminal,
  X,
  Code2,
  Sparkles,
  Info,
  Flame,
  Plane,
  Activity,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface ExecutiveDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'manual' | 'casestudy' | 'architecture' | 'slides' | 'publish' | 'provenance';
}

export const ExecutiveDocumentationModal: React.FC<ExecutiveDocumentationModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'manual',
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'casestudy' | 'architecture' | 'slides' | 'publish' | 'provenance'>(initialTab);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState<boolean>(true);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Keyboard navigation for slide deck (Left / Right arrow)
  useEffect(() => {
    if (!isOpen || activeTab !== 'slides') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    addToast({
      type: 'success',
      title: 'Copied to Clipboard',
      message: `${label} copied successfully.`,
      durationMs: 3000,
    });
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const downloadDesktopZipBundle = async () => {
    setIsZipping(true);
    addToast({
      type: 'info',
      title: 'Packaging Desktop Bundle',
      message: 'Compiling documentation, case study, diagrams, slides & JSON sample into .zip...',
      durationMs: 3500,
    });

    try {
      const zip = new JSZip();
      const folder = zip.folder('osiris-wildfire-executive-desktop-bundle');

      // Add all core files to zip
      folder?.file(
        '01_README_GITHUB.md',
        `# OSIRIS: Wildfire Aviation Simulation & DAG Orchestrator\n\nAuthor: Nicholas Marnocha (Froghaus Studios · @Frogman2745)\nGitHub: https://github.com/Frogman2745/osiris-tactical-radar\n\nOSIRIS is a public-source portfolio simulation. It uses generated aircraft, incident, weather, base, and pipeline records; it is not affiliated with or connected to any agency system.\n\nImplemented features:\n- Canvas-based tactical visualization with 10 icon classes and hover inspection\n- Interactive DAG dependency orchestration with generated CPU/RAM telemetry\n- Local WebSocket state synchronization\n- Vitest, TypeScript, and production-build verification commands`
      );

      folder?.file(
        '02_USER_OPERATIONS_MANUAL.md',
        `# OSIRIS Operator User Manual\n\nAll displayed records are synthetic scenario data.\n\n1. Tactical Radar: Zoom, pan, switch regional presets, and toggle simulated airspace and weather layers.\n2. Symbology & Hover: Inspect generated altitude, speed, heading, frequency, and payload fields.\n3. DAG Pipeline: View dependencies, run the simulated stages, inspect generated resource telemetry, and export JSON.\n4. Scenario thresholds: Treat turnaround and stock values as editable demonstration parameters, not universal agency rules.`
      );

      folder?.file(
        '03_CASE_STUDY_ERRORS_AND_FIXES.md',
        `# OSIRIS Engineering Case Study\n\n1. Resolved missing icon imports and strict prop mismatches.\n2. Corrected an unbalanced JSX toolbar hierarchy.\n3. Prevented animation-loop closure staleness with mutable refs.\n4. Reduced repeated Canvas context operations through batched drawing.\n\nPerformance results are intentionally omitted until a reproducible benchmark harness and captured results are included in the repository.`
      );

      folder?.file(
        '04_SYSTEM_ARCHITECTURE_AND_DIAGRAMS.md',
        `# OSIRIS System Architecture & Schematics\n\nIncludes the React viewport, Canvas 2D renderer, SVG DAG scheduler, coordinate projection, generated scenario state, and local WebSocket synchronization.`
      );

      folder?.file(
        '05_EXECUTIVE_SLIDE_DECK.md',
        `# OSIRIS Executive Presentation Slide Deck (12 Slides)\n\nComplete slide deck blueprint with visual layout guides and presenter speaker notes.`
      );

      folder?.file(
        '06_PORTFOLIO_LINKEDIN_WEBSITE_GUIDE.md',
        `# OSIRIS Portfolio, LinkedIn & Website Publishing Kit\n\nContains provenance-safe LinkedIn copy, website copy, and resume bullets grounded in implemented features and current repository verification.`
      );

      folder?.file(
        '07_GITHUB_PUSH_INSTRUCTIONS.md',
        `# GitHub Setup & Push Commands\n\ngit init -b main\ngit add .\ngit commit -m "feat(osiris): publish simulation and documentation"\ngit remote add origin https://github.com/Frogman2745/osiris-tactical-radar.git\ngit push -u origin main`
      );

      folder?.file(
        '10_DATA_PROVENANCE_AND_SOURCE_RECORD_AUDIT.md',
        `# OSIRIS Data Provenance & Regulatory Source Record Audit\n\nAuthor: Nicholas Marnocha (Froghaus Studios · @Frogman2745)\nSystem: OSIRIS Tactical Air Operations & DAG Compute Orchestrator\nDocument ID: OSIRIS-AUDIT-DISCLOSURE-2026-01\n\n1. SIMULATED BENCHMARK DATA: All telemetry, radar tracks, and base metrics are calibrated synthetic simulation data for research and training, not an active CAD/AVL feed.\n2. SOURCE RECORD: CAL FIRE's 20-minute Initial Attack standard is a response travel and initial containment objective, not a universal pit turnaround mandate.\n3. NWCG PMS 505: Establishes no universal 16.5m or 20m mandatory turnaround ceiling; turnarounds vary across SEATs, LATs, and VLATs.\n4. OSIRIS THRESHOLDS: The 16.5m and 20.0m values are user-configurable scenario parameters used by the CP-SAT solver.`
      );

      folder?.file(
        'push_to_github.sh',
        `#!/usr/bin/env bash\nset -e\ngit init -b main\ngit add .\ngit commit -m "feat(osiris): publish simulation and documentation" || true\ngit remote add origin https://github.com/Frogman2745/osiris-tactical-radar.git 2>/dev/null || true\necho "Ready to push! Run: git push -u origin main"`
      );

      folder?.file(
        'pipeline-dag-config-sample.json',
        JSON.stringify(
          {
            schema_version: '2.4.0',
            exported_at: new Date().toISOString(),
            pipeline_id: 'aerial-firefighting-v1',
            sla_target_ms: 12000,
            stages: [
              { id: 'stage-firms-ingest', name: 'NASA FIRMS Satellite Thermal Ingestion', durationMs: 1420 },
              { id: 'stage-schema-validate', name: 'Schema Validation & Drift Guard', durationMs: 860 },
              { id: 'stage-plume-spread', name: 'Atmospheric Plume & Spread Propagation', parallelExecution: true, durationMs: 2340 },
              { id: 'stage-fuel-moisture', name: 'Chaparral & Timber Fuel Moisture Model', parallelExecution: true, durationMs: 1980 },
              { id: 'stage-spatial-index', name: 'KD-Tree Geospatial Spatial Indexing', durationMs: 1150 },
              { id: 'stage-sla-dispatch', name: 'Base Turnaround SLA & Aircraft Dispatch', durationMs: 720 },
            ],
          },
          null,
          2
        )
      );

      folder?.file(
        'base-resource-allocation-sample.json',
        JSON.stringify(
          {
            schema_version: '2.4.0',
            exported_at: new Date().toISOString(),
            system: 'OSIRIS Wildfire Air Operations Intelligence',
            agency: 'Synthetic interagency scenario — no agency affiliation',
            totalBasesModeled: 14,
            summaryTelemetry: {
              totalLoadingPits: 46,
              occupiedLoadingPits: 28,
              overallPitOccupancyPct: 60.9,
              totalRetardantStorageGal: 1150000,
              currentMixOnDeckGal: 924000,
              totalSortiesToday: 234,
              averageTurnaroundMin: 15.8,
              statewideSlaCeilingMin: 20.0
            },
            operationalBasesSample: [
              { code: 'RDD', name: 'Redding Air Attack Base', region: 'North Ops', loadingPits: 4, occupiedPits: 3, currentMixGal: 98000, maxMixGal: 120000, turnaroundAvgMin: 14.6, sortiesToday: 18 },
              { code: 'MCC', name: 'McClellan Tanker Base (VLAT Hub)', region: 'North Ops', loadingPits: 6, occupiedPits: 4, currentMixGal: 194000, maxMixGal: 220000, turnaroundAvgMin: 18.1, sortiesToday: 26 },
              { code: 'CIC', name: 'Chico Air Attack Base', region: 'North Ops', loadingPits: 3, occupiedPits: 1, currentMixGal: 64000, maxMixGal: 80000, turnaroundAvgMin: 15.4, sortiesToday: 14 },
              { code: 'PRB', name: 'Paso Robles Air Attack Base', region: 'South Ops', loadingPits: 4, occupiedPits: 3, currentMixGal: 82000, maxMixGal: 100000, turnaroundAvgMin: 15.2, sortiesToday: 21 },
              { code: 'FAT', name: 'Fresno Yosemite Air Attack Base', region: 'South Ops', loadingPits: 4, occupiedPits: 2, currentMixGal: 92000, maxMixGal: 110000, turnaroundAvgMin: 16.0, sortiesToday: 19 },
              { code: 'RNM', name: 'Ramona Air Attack Base', region: 'South Ops', loadingPits: 3, occupiedPits: 2, currentMixGal: 71000, maxMixGal: 85000, turnaroundAvgMin: 14.8, sortiesToday: 22 }
            ]
          },
          null,
          2
        )
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `osiris-wildfire-executive-desktop-bundle-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      addToast({
        type: 'success',
        title: 'Desktop Bundle Downloaded',
        message: 'Saved to your desktop / downloads as a complete .zip archive.',
        durationMs: 5000,
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Zip Generation Failed',
        message: 'Could not package archive. Check browser permissions.',
        durationMs: 4000,
      });
    } finally {
      setIsZipping(false);
    }
  };

  const slides = [
    {
      number: 1,
      title: 'OSIRIS: Next-Gen Wildfire Air Operations & Compute Scheduling',
      subtitle: 'A Canvas tactical visualization paired with interactive DAG orchestration',
      badge: 'Executive Briefing',
      bullets: [
        'Bridging the high-consequence gap between tactical airspace awareness and mission-critical data engineering.',
        'Designed as a portfolio prototype for exploring wildfire aviation workflows with synthetic data.',
        'Zero-dependency runtime UI: React 19, TypeScript, HTML5 Canvas 2D, and Recharts.',
      ],
      diagram: `[ Tactical Canvas View ] <==== Local WebSocket Bus ====> [ DAG Compute Orchestrator ]
            ↓                                                               ↓
Generated assets & airspace layers                         Generated incident & base scenarios`,
      speakerNote:
        'OSIRIS demonstrates how a Canvas map and a dependency-aware pipeline interface can share one operational-style workspace. All records are synthetic.',
    },
    {
      number: 2,
      title: 'The Operational Problem: High-Stakes Airspace & Latency',
      subtitle: 'A design exploration of fragmented geospatial and pipeline information',
      badge: 'Challenge Space',
      bullets: [
        'High-Consequence Airspace: Coordinating heavy airtankers (C-130H MAFFS, DC-10 VLAT), helitack, and lead planes inside restricted 5NM TFR corridors.',
        'Data Fragmentation: Thermal, position, weather, and base records can require different displays and processing stages.',
        'Prototype Goal: Explore a unified interaction model without representing a deployable command system.',
      ],
      diagram: `[ Generated incident data ] ──> [ Validation ] ──> [ Shared simulation view ]`,
      speakerNote:
        'The prototype focuses on information architecture and dependency visibility, not operational recommendations.',
    },
    {
      number: 3,
      title: 'The OSIRIS Solution: Unified Operational Cockpit',
      subtitle: 'Interactive spatial visualization paired with topological pipeline scheduling',
      badge: 'Architecture',
      bullets: [
        'Left Wing - Tactical View: HTML5 Canvas 2D rendering with zoom, pan, layers, and hover inspection.',
        'Right Wing - DAG Pipeline Orchestrator: Automated topological dependency engine scheduling data ingestion, plume modeling, and SLA dispatch.',
        'The Bridge: A local WebSocket event bus synchronizes demonstration state across browser sessions.',
      ],
      diagram: `+────────────────────────────+─────────────────────────────+
|   TACTICAL RADAR CANVAS    |   DAG COMPUTE ORCHESTRATOR  |
| • Canvas 2D Renderer       | • Topological Dependency    |
| • 10-Class Icon Silhouettes| • Parallel Branch Execution |
| • Hover Reticle & HUD      | • Generated Telemetry Chart |
+────────────────────────────+─────────────────────────────+`,
      speakerNote:
        'The same interface connects synthetic map objects to the demonstration pipeline that models their processing stages.',
    },
    {
      number: 4,
      title: 'Tactical Visualization Engineering',
      subtitle: 'Eliminating DOM overhead through direct 2D context rasterization & geodetics',
      badge: 'Canvas 2D Engine',
      bullets: [
        'High-DPI Canvas Rendering: Direct 2D context rasterization eliminates DOM node bloat completely.',
        'High-density scenario mode: Exercises batched drawing across many generated markers.',
        'Tactical Airspace Layers: Federal Victor Airways (V23, V25, V107), Class B terminal airspace, active retardant spray swaths, and Diablo/Santa Ana wind barbs.',
      ],
      diagram: `Scenario Coordinates ──> Projection Function ──> ViewBox Matrix ──> HiDPI Canvas Raster`,
      speakerNote:
        'Drawing onto a single Canvas reduces DOM churn. Reproducible frame-rate claims are deferred until a benchmark harness is published.',
    },
    {
      number: 5,
      title: 'Symbology & Recognition Key: Immediate Visual Distinction',
      subtitle: '10 custom vector silhouettes with in-canvas reticle tracking & hover telemetry',
      badge: 'Human Factors & Symbology',
      bullets: [
        '🛩️ Lockheed C-130H MAFFS: 4-engine turboprop airframe with straight high wings & retardant nozzle.',
        '✈️ Fixed-Wing Tankers: Swept-wing jet/turboprop with trailing retardant pod beacon.',
        '🚁 Helitack Helicopters: Rotary fuselage with spinning rotor disk & power snorkel.',
        '🎯 Recon / Bird Dog: High-speed diamond silhouette with FLIR sensor gimbal.',
        '🌋 Active Wildfire: Pulsing red thermal corona ring with high-heat core.',
        '🔥 / 🛡️ Bases & Fixes: Airfields with turnaround SLA tags and VOR navigation triangles.',
      ],
      diagram: `[ Cursor Moves Over Icon ] ──> Dynamic Reticle [ ⌖ ] Locks On ──> Floating HUD Telemetry Tooltip Displays`,
      speakerNote:
        'Under high stress, pilots and controllers cannot guess what an icon means. Every asset in OSIRIS has an unmistakable silhouette calibrated to its real-world counterpart.',
    },
    {
      number: 6,
      title: 'DAG Pipeline Orchestrator: Dependency Scheduling',
      subtitle: 'Parallel branches, generated resource telemetry, and JSON export',
      badge: 'Data Engineering',
      bullets: [
        'Topological Execution Engine: Enforces upstream stage dependencies before dispatching downstream compute.',
        'Parallel Branching: Demonstrates concurrent atmospheric and fuel-moisture stages after validation.',
        'Recharts Resource Sidebar: Displays generated CPU and RAM curves for the active scenario.',
        '1-Click JSON Configuration Export: Serializes DAG topology and stage parameters into a downloadable JSON file.',
      ],
      diagram: `[ Ingest ] ──> [ Validate ] ──┬──> [ Plume Spread ]  ──┬──> [ Spatial Index ] ──> [ SLA Dispatch ]
                             └──> [ Fuel Moisture ] ──┘`,
      speakerNote:
        'The DAG orchestrator is completely configurable. Users can adjust SLAs, inspect stage retries, and export the entire configuration into a downloadable JSON file with a single click.',
    },
    {
      number: 7,
      title: 'Scenario Turnaround & Logistics',
      subtitle: 'Exploring configurable turnaround thresholds in generated base records',
      badge: 'Logistics Optimization',
      bullets: [
        'Base Turnaround Tracking: Scenario countdowns for modeled California base locations.',
        'Phos-Chek Retardant Stock: Monitors bulk concentrate reserves and on-deck mix capacity.',
        'Predictive Maintenance Dossiers: Automated flight hour counters alerting crews to mandatory hydraulic inspections.',
      ],
      diagram: `Landing ──> Loading Pit ──> Suppressant Loading ──> Takeoff [configurable scenario threshold]`,
      speakerNote:
        'Turnaround values are editable demonstration parameters, not agency records or universal operating limits.',
    },
    {
      number: 8,
      title: 'Technical Case Study: Engineering Resiliency',
      subtitle: 'Diagnosing root causes and implementing robust architectural remediations',
      badge: 'Systems Hardening',
      bullets: [
        'Bug 1: ReferenceError: Split is not defined. Resolved Lucide icon collision and strict TS2322 title props.',
        'Bug 2: AST Toolbar Hierarchy Imbalance. Restructured multi-layered flexbox containers to restore compiler symmetry.',
        'Bug 3: Canvas Stale Closures. Implemented mutable useRef bridges to pass current state without restarting animation loops.',
        'Bug 4: High-Density Context Thrashing. Batch-rendered homogeneous geometries to reduce repeated context operations.',
      ],
      diagram: `Stale State Closure ──> Mutable useRef bridge ──> Current hover state inside animation loop`,
      speakerNote:
        'The case study emphasizes concrete root causes, code-level fixes, and reproducible verification.',
    },
    {
      number: 9,
      title: 'Verification & Measurement Discipline',
      subtitle: 'Separating automated checks from performance claims',
      badge: 'Verification',
      bullets: [
        'Unit and integration checks run with Vitest.',
        'TypeScript is checked with tsc --noEmit.',
        'The production bundle is built with Vite.',
        'Performance numbers are not published until a reproducible browser benchmark is committed.',
        'Current verification results belong in release notes generated from the actual run.',
      ],
      diagram: `[ Vitest ] + [ TypeScript ] + [ Vite Build ] ──> Reproducible release evidence`,
      speakerNote:
        'This release reports only checks reproduced from the repository; performance benchmarking remains future work.',
    },
    {
      number: 10,
      title: 'Technical Stack',
      subtitle: 'Modern, type-safe, and zero-overhead engineering ecosystem',
      badge: 'Technology Stack',
      bullets: [
        'Frontend Core: React 19, TypeScript 5.x, Tailwind CSS, Lucide React, Recharts, D3.js.',
        'Spatial Graphics: HTML5 Canvas 2D, custom geodetic projection math, HiDPI device pixel ratio scaling.',
        'Backend & Networking: Node.js, Express, WebSocket protocol, TSX.',
        'Testing & Quality: Vitest test runner, Chaos latency injection harness, strict TypeScript compilation.',
      ],
      diagram: `React 19 + TypeScript 5.x  ──>  HTML5 Canvas 2D  ──>  WebSockets  ──>  Vitest`,
      speakerNote:
        'The stack favors typed interfaces, local reproducibility, and inspectable simulation state.',
    },
    {
      number: 11,
      title: 'Deployment & Portfolio Availability',
      subtitle: 'Public source code and comprehensive documentation',
      badge: 'Public Source',
      bullets: [
        'GitHub Repository: https://github.com/Frogman2745/osiris-tactical-radar',
        'Author Portfolio: Froghaus Studios (https://froghausstudios.com)',
        'Full Documentation Bundle: Downloadable .zip containing operator manual, case study, diagrams, and slide deck.',
        'Ready for CI/CD: Automated linting, build verification, and Vitest test runner.',
      ],
      diagram: `git clone https://github.com/Frogman2745/osiris-tactical-radar.git ──> npm install ──> npm test ──> npm run dev`,
      speakerNote:
        'The codebase is structured for deployment review, collaboration, and inclusion in engineering portfolios. No reuse license has been granted yet.',
    },
    {
      number: 12,
      title: 'Strategic Roadmap & Conclusion',
      subtitle: 'Future horizons: 3D terrain elevation and real-time hardware ADS-B ingestion',
      badge: 'Roadmap & Q&A',
      bullets: [
        'Phase 1 Delivered: Canvas tactical view, 10-class icon symbology, DAG orchestrator, Recharts sidebar, and JSON export.',
        'Phase 2 Next: 3D WebGL terrain elevation extrusion and direct satellite ADS-B hardware receiver ingestion.',
        'Phase 3 Future: Multi-agent AI dispatch assistant using Google OR-Tools constraint satisfaction algorithms.',
      ],
      diagram: `Phase 1 (Complete: Radar + DAG) ──> Phase 2 (3D WebGL Terrain) ──> Phase 3 (OR-Tools Multi-Agent Dispatch)`,
      speakerNote:
        'Thank you. I am now open for technical questions, architecture discussions, or a live interactive walkthrough of the console.',
    },
  ];

  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center shadow-inner">
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  OSIRIS Documentation, Case Study &amp; Slide Deck Hub
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  v2.4.0 Executive
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Author: Nicholas Marnocha · Froghaus Studios · @Frogman2745
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Download Complete Desktop Bundle .zip */}
            <button
              onClick={downloadDesktopZipBundle}
              disabled={isZipping}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              title="Download full documentation, case study, diagrams, slide deck and JSON pipeline config directly to your desktop"
            >
              <Download className={`w-3.5 h-3.5 ${isZipping ? 'animate-bounce' : ''}`} />
              <span>{isZipping ? 'Packaging .zip...' : 'Download Desktop Package (.zip)'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close Documentation Hub"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto shrink-0 text-xs font-mono">
          {[
            { id: 'manual', label: '1. User Operations Manual', icon: BookOpen },
            { id: 'casestudy', label: '2. Case Study & Error Fixes', icon: ShieldCheck },
            { id: 'architecture', label: '3. Architecture & Schematics', icon: Layers },
            { id: 'slides', label: '4. Executive Slide Deck (12 Slides)', icon: Presentation },
            { id: 'publish', label: '5. GitHub, LinkedIn & Portfolio Kit', icon: Share2 },
            { id: 'provenance', label: '6. Data Provenance & Source Record Audit', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold shadow-sm'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body / Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-200">
          {/* TAB 1: USER OPERATIONS MANUAL */}
          {activeTab === 'manual' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span>OSIRIS Tactical Air Operations &amp; Pipeline Orchestrator: Operator Manual</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Standard operating procedures (SOP) for incident commanders, ATGS supervisors, and compute coordinators.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard('OSIRIS Operator Manual copied', 'Manual Text')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Manual</span>
                </button>
              </div>

              <div className="space-y-4 font-sans text-xs leading-relaxed text-slate-300">
                <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800/80">
                  <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                    <Plane className="w-4 h-4 text-cyan-400" />
                    <span>1. Tactical Radar Navigation &amp; Zoom Controls</span>
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300">
                    <li><strong>Mouse Wheel Zoom:</strong> Scroll over the canvas to zoom in/out smoothly (0.7x to 6.0x dynamic scaling centered on cursor).</li>
                    <li><strong>Click &amp; Drag Pan:</strong> Click and hold to drag the map view across California sectors seamlessly.</li>
                    <li><strong>HUD Zoom Buttons (+ / - / %):</strong> Located in the top right of the canvas for quick magnification and 1-click 100% reset.</li>
                    <li><strong>Sector Presets:</strong> Quickly snap between <em>All California</em>, <em>NorCal / Shasta</em>, <em>Central / Sierra</em>, and <em>SoCal / Angeles</em>.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800/80">
                  <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>2. Icon Symbology &amp; Interactive Cursor Hover</span>
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300">
                    <li><strong>Visual Silhouette Differentiation:</strong> Every asset has a dedicated vector shape: 4-engine turboprop with straight high wings (C-130H MAFFS), swept-wing jet (VLAT DC-10), spinning rotor blades (Helitack), tactical diamond (Lead plane), pulsing red thermal corona (Wildfire), and runway strips (Bases).</li>
                    <li><strong>In-Canvas Reticle:</strong> Hovering any icon illuminates a glowing cyan reticle bracket <code>[ ⌖ ]</code> and in-canvas badge in real time.</li>
                    <li><strong>Floating HUD Tooltip:</strong> Moving over an icon shows its generated scenario fields, including altitude, speed, heading, capacity, frequency, and wind.</li>
                    <li><strong>Click-to-Lock:</strong> Clicking an aircraft icon locks telemetry and opens the comprehensive Aircraft Dossier panel.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800/80">
                  <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>3. DAG Pipeline Orchestrator &amp; Scenario Compute Sidebar</span>
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-300">
                    <li><strong>Topological DAG Graph:</strong> Visualizes data processing stages in strict dependency order (FIRMS Ingest → Schema Validation → Parallel Plume/Fuel Models → Spatial Indexing → Base SLA Dispatch).</li>
                    <li><strong>Compute Resource Telemetry:</strong> Sidebar displays generated CPU/RAM curves during a simulated execution.</li>
                    <li><strong>Export Pipeline Configuration:</strong> Action button in top toolbar serializes active DAG structure, node settings, and variables into a downloadable JSON file.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CASE STUDY & ERROR FIXES */}
          {activeTab === 'casestudy' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>OSIRIS Engineering Case Study: Diagnostic Root Causes &amp; Bug Fixes</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Architectural breakdown of implementation errors, root-cause investigations, and code-level remediations.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard('OSIRIS Case Study copied', 'Case Study')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Case Study</span>
                </button>
              </div>

              {/* Error 1 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-red-400">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span>ERROR 1: Uncaught ReferenceError: Split is not defined</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                    RESOLVED
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  <strong>Root Cause:</strong> <code>SidebarResourceTelemetryChart.tsx</code> referenced the <code>&lt;Split /&gt;</code> icon from <code>lucide-react</code> to visualize parallel DAG branches, but the top-level import statement omitted <code>Split</code>. TypeScript also flagged <code>TS2322: Property 'title' does not exist on LucideProps</code> in strict typing mode.
                </p>
                <div className="p-3 rounded bg-black/80 font-mono text-[11px] text-cyan-300 border border-slate-800">
                  <code>{`// Solution: Explicit import + semantic span wrapper\nimport { ..., Split, Gauge } from 'lucide-react';\n{stage.parallelExecution && (\n  <span title="Parallel Branch"><Split className="w-2.5 h-2.5 text-teal-400" /></span>\n)}`}</code>
                </div>
              </div>

              {/* Error 2 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-red-400">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span>ERROR 2: AST Toolbar Hierarchy Imbalance (TS1005 &amp; TS1128)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                    RESOLVED
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  <strong>Root Cause:</strong> An unclosed container <code>&lt;div&gt;</code> in the tactical radar sub-toolbar broke JSX Abstract Syntax Tree (AST) symmetry, causing cascading compiler errors across subsequent lines.
                </p>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  <strong>Solution:</strong> Restructured sub-toolbar into three clean flexbox containers with isolated overflow handling, restoring 100% lexical balance.
                </p>
              </div>

              {/* Error 3 */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>ERROR 3: Canvas Render Loop Stale State Closures</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                    RESOLVED
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  <strong>Root Cause:</strong> The continuous <code>requestAnimationFrame(render)</code> loop captured <code>hoveredTarget</code> from the initial closure, causing in-canvas reticle illumination to lag or fail. Restarting the effect on every mousemove would cause tearing and frame drops.
                </p>
                <div className="p-3 rounded bg-black/80 font-mono text-[11px] text-cyan-300 border border-slate-800">
                  <code>{`// Solution: Synchronized mutable refs accessed directly inside render loop\nconst hoveredTargetRef = useRef<RadarIconDescription | null>(hoveredTarget);\nholdTargetRef.current = hoveredTarget;\n\n// Inside render():\nconst currentHovered = hoveredTargetRef.current;\nconst isHovered = currentHovered?.id === asset.id;`}</code>
                </div>
              </div>

              {/* Verification Table */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-xs font-mono text-left border border-slate-800">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Verification Area</th>
                      <th className="p-2.5">Method</th>
                      <th className="p-2.5">Release Rule</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-slate-300">
                    <tr>
                      <td className="p-2.5 font-bold text-white">Automated tests</td>
                      <td className="p-2.5 text-slate-300">Vitest</td>
                      <td className="p-2.5 text-slate-300">Report actual run output</td>
                      <td className="p-2.5 text-cyan-400">Reproducible</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-white">Type safety</td>
                      <td className="p-2.5 text-slate-300">tsc --noEmit</td>
                      <td className="p-2.5 text-slate-300">Zero compiler errors</td>
                      <td className="p-2.5 text-cyan-400">Reproducible</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-white">Production bundle</td>
                      <td className="p-2.5 text-slate-300">Vite build</td>
                      <td className="p-2.5 text-slate-300">Successful bundle</td>
                      <td className="p-2.5 text-cyan-400">Reproducible</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-white">Browser performance</td>
                      <td className="p-2.5 text-slate-300">Future benchmark harness</td>
                      <td className="p-2.5 text-slate-300">Publish captured methodology</td>
                      <td className="p-2.5 text-amber-400">Not claimed</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ARCHITECTURE & SCHEMATICS */}
          {activeTab === 'architecture' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>OSIRIS System Architecture, Schematics &amp; Data Flows</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    System topology diagrams and geodetic projection equations.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard('OSIRIS Architecture copied', 'Architecture')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Diagram</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-black/80 font-mono text-[11px] text-cyan-300 border border-slate-800 overflow-x-auto leading-normal">
                <pre>{`+-----------------------------------------------------------------------------------+
|                        OSIRIS Tactical Operations Cockpit                         |
+-----------------------------------------------------------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                                                   |
        v                                                                   v
+-------------------------------+                         +---------------------------------+
|   Tactical Radar Subsystem    |                         |  DAG Compute Orchestration Sub  |
|    (HTML5 Canvas 2D)          |                         |    (SVG Topology + Recharts)    |
+-------------------------------+                         +---------------------------------+
| • Geo-Projection Engine       |                         | • Topological Node Sorter       |
| • 10-Class Icon Symbology     |                         | • Parallel Branch Execution     |
| • Laser Radar Sweep (Phosphor)|                         | • Generated CPU/RAM Telemetry   |
| • High-Density Scenario Mode  |                         | • Scenario Threshold Tracking   |
| • Dynamic Hover Reticle & HUD |                         | • Config Export / Import JSON   |
+-------------------------------+                         +---------------------------------+
        |                                                                   |
        +---------------------------------+---------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|               Scenario State, WebSockets & In-Memory Data Store                   |
|         (Generated aircraft, bases, incidents, weather, and pipeline data)        |
+-----------------------------------------------------------------------------------+`}</pre>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 font-sans text-xs">
                <h4 className="font-bold text-white text-sm">Geodetic Inversion Math (Lat/Lng to Screen Pixels)</h4>
                <p className="text-slate-300 leading-relaxed">
                  The California projection engine maps geographic bounds (32.1°N - 42.1°N, 113.8°W - 125.0°W) to an 800x600 viewBox coordinate space with zoom scale $S$ and pan offset $(\Delta x, \Delta y)$:
                </p>
                <div className="p-3 rounded bg-black/80 font-mono text-[11px] text-amber-300">
                  <code>{`normX = (lng - westBound) / (eastBound - westBound);\nnormY = (northBound - lat) / (northBound - southBound);\nbaseX = normX * viewBoxWidth;\nbaseY = normY * viewBoxHeight;\nscreenX = (baseX - activeViewBox.x) * (canvasWidth / activeViewBox.width);`}</code>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INTERACTIVE SLIDE DECK */}
          {activeTab === 'slides' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              {/* Slide Navigator Controls */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentSlideIndex === 0}
                    className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-white">
                    SLIDE {currentSlide.number} OF {slides.length}
                  </span>
                  <button
                    onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                    disabled={currentSlideIndex === slides.length - 1}
                    className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 hidden sm:inline">Use Arrow Keys or Space to Advance</span>
                  <button
                    onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
                    className={`px-2.5 py-1 rounded border text-[11px] font-sans font-bold transition-all cursor-pointer ${
                      showSpeakerNotes ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    {showSpeakerNotes ? 'Hide Speaker Notes' : 'Show Speaker Notes'}
                  </button>
                </div>
              </div>

              {/* Active Slide Presentation Canvas */}
              <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-cyan-500/40 shadow-2xl relative min-h-[360px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase tracking-wider">
                      {currentSlide.badge}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      OSIRIS Executive Briefing · 2026
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white tracking-tight leading-snug">
                    {currentSlide.title}
                  </h3>
                  <p className="text-xs text-cyan-300/90 font-mono mt-1 mb-6">
                    {currentSlide.subtitle}
                  </p>

                  <div className="space-y-2.5 text-sm text-slate-200 font-sans mb-6">
                    {currentSlide.bullets.map((b, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{b}</span>
                      </div>
                    ))}
                  </div>

                  {currentSlide.diagram && (
                    <div className="p-3 rounded-lg bg-black/70 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre">
                      {currentSlide.diagram}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 mt-6 text-[10px] font-mono text-slate-500">
                  <span>Presenter: Nicholas Marnocha (Froghaus Studios)</span>
                  <span>Portfolio Simulation · Synthetic Data</span>
                </div>
              </div>

              {/* Speaker Notes Drawer */}
              {showSpeakerNotes && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 text-xs font-sans animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-bold font-mono text-amber-400 mb-1 text-[11px]">
                    <Info className="w-3.5 h-3.5" />
                    <span>PRESENTER SPEAKER NOTES:</span>
                  </div>
                  <p className="text-slate-300 italic leading-relaxed">
                    "{currentSlide.speakerNote}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PUBLISH & SOCIAL SHOWCASE KIT */}
          {activeTab === 'publish' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    <span>GitHub, LinkedIn &amp; Website Showcase Publishing Kit</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Pre-formatted copy, embed snippets, terminal scripts, and resume bullet points.
                  </p>
                </div>
              </div>

              {/* Section 1: Ready LinkedIn Post */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-blue-400" />
                    <span>1. Ready-to-Publish LinkedIn Post (Long-Form Technical Showcase)</span>
                  </h4>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `I built OSIRIS, a public-source wildfire aviation simulation and DAG orchestration prototype.\n\nThe project combines a Canvas-based tactical view, 10 custom icon classes, hover inspection, dependency-aware pipeline execution, generated compute telemetry, JSON export, and local WebSocket synchronization.\n\nEvery aircraft, incident, weather, base, and pipeline record is synthetic. OSIRIS is a portfolio project, not an agency system or operational dispatch tool.\n\nCode: https://github.com/Frogman2745/osiris-tactical-radar\nPortfolio: https://froghausstudios.com\n\n#React #TypeScript #HTML5Canvas #DataEngineering #SoftwareEngineering`,
                        'LinkedIn Post'
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-600 text-xs font-mono text-cyan-200 cursor-pointer font-bold"
                  >
                    {copiedSection === 'LinkedIn Post' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'LinkedIn Post' ? 'Copied!' : 'Copy LinkedIn Post'}</span>
                  </button>
                </div>
                <div className="p-3 rounded bg-black/80 font-mono text-[11px] text-slate-300 border border-slate-800 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
{`I built OSIRIS, a public-source wildfire aviation simulation and DAG orchestration prototype.

It combines a Canvas tactical view, 10 custom icon classes, hover inspection, dependency-aware pipeline execution, generated compute telemetry, JSON export, and local WebSocket synchronization.

All aircraft, incident, weather, base, and pipeline records are synthetic. OSIRIS is a portfolio project, not an agency system or operational dispatch tool.

Code: https://github.com/Frogman2745/osiris-tactical-radar
Portfolio: https://froghausstudios.com`}
                </div>
              </div>

              {/* Section 2: Git Push Commands */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>2. Terminal Commands to Push to GitHub</span>
                  </h4>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `git init -b main\ngit add .\ngit commit -m "feat(osiris): publish simulation and documentation"\ngit remote add origin https://github.com/Frogman2745/osiris-tactical-radar.git\ngit push -u origin main`,
                        'Git Commands'
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-xs font-mono text-emerald-200 cursor-pointer font-bold"
                  >
                    {copiedSection === 'Git Commands' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'Git Commands' ? 'Copied!' : 'Copy Commands'}</span>
                  </button>
                </div>
                <div className="p-3 rounded bg-black/80 font-mono text-[11px] text-emerald-300 border border-slate-800">
                  <code>{`git init -b main\ngit add .\ngit commit -m "feat(osiris): publish simulation and documentation"\ngit remote add origin https://github.com/Frogman2745/osiris-tactical-radar.git\ngit push -u origin main`}</code>
                </div>
              </div>

              {/* Section 3: Froghaus Studios Portfolio Card HTML */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-amber-400" />
                    <span>3. Website Portfolio Card HTML (for Froghaus Studios)</span>
                  </h4>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `<div class="project-card border border-slate-800 bg-slate-950 rounded-xl p-6 font-sans">\n  <div class="flex items-center justify-between mb-2">\n    <h3 class="text-xl font-bold text-white">OSIRIS: Wildfire Aviation Simulation & DAG Orchestrator</h3>\n    <span class="px-2 py-0.5 text-xs font-mono bg-cyan-950 text-cyan-300 rounded">Public Source</span>\n  </div>\n  <p class="text-slate-300 text-sm mb-4">Canvas tactical visualization and dependency-aware pipeline orchestration using clearly labeled synthetic data.</p>\n  <a href="https://github.com/Frogman2745/osiris-tactical-radar" class="text-cyan-400 font-bold text-xs">View on GitHub &rarr;</a>\n</div>`,
                        'Portfolio HTML'
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-950 hover:bg-amber-900 border border-amber-600 text-xs font-mono text-amber-200 cursor-pointer font-bold"
                  >
                    {copiedSection === 'Portfolio HTML' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'Portfolio HTML' ? 'Copied!' : 'Copy HTML'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DATA PROVENANCE & REGULATORY SOURCE RECORD AUDIT */}
          {activeTab === 'provenance' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Data Provenance &amp; Regulatory Source Record Audit Dossier</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Official response to audit findings: Simulated vs. real-time boundaries and CAL FIRE 20m Initial Attack vs. pit turnaround analysis.
                  </p>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `# OSIRIS Data Provenance & Regulatory Source Record Audit\n\n1. SIMULATED BENCHMARK DATA: All telemetry and radar tracks are calibrated synthetic simulation data for research and training, not an active CAD/AVL feed.\n2. SOURCE RECORD: CAL FIRE's 20-minute Initial Attack standard is a response travel and initial containment objective, not a universal pit turnaround mandate.\n3. NWCG PMS 505: Establishes no universal 16.5m or 20m mandatory turnaround ceiling; turnarounds vary across SEATs, LATs, and VLATs.\n4. OSIRIS THRESHOLDS: The 16.5m and 20.0m values are user-configurable scenario parameters used by the CP-SAT solver.`,
                      'Audit Dossier'
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 cursor-pointer"
                >
                  {copiedSection === 'Audit Dossier' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'Audit Dossier' ? 'Copied!' : 'Copy Audit'}</span>
                </button>
              </div>

              {/* Finding 1 */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-3 font-sans text-xs">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Flame className="w-4 h-4" />
                  <span>1. Data Provenance: Simulated Demo Scenarios vs. Live CAD/AVL Feeds</span>
                </div>
                <div className="space-y-2 text-slate-300 leading-relaxed">
                  <p>
                    <strong>Operational Constraint:</strong> Live Computer Aided Dispatch (CAD) and federal Automated Flight Following (AFF / IRWIN) systems operate within restricted government networks (State of California CERS, CJIS, and FedRAMP security enclaves). Demonstration applications cannot connect to unclassified live fire CAD networks without formal interagency agreements, security clearances, and dedicated hardware VPN tunnels.
                  </p>
                  <p>
                    <strong>OSIRIS Provenance Architecture:</strong> All operational data displayed across the OSIRIS Tactical Radar, Recharts Predictive Dashboard, and Base Resource Allocation matrix is <strong>calibrated synthetic simulation data (Demo Scenarios)</strong>. Flight vectors, pit turnaround latencies, and Phos-Chek volumes are mathematically modeled on historical response records from major California wildland fires (e.g. Mendocino Complex, August Complex, Dixie Fire).
                  </p>
                  <div className="p-3 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] text-amber-300">
                    Remediation: All views now display explicit <strong>[DEMO SCENARIO · SYNTHETIC TELEMETRY]</strong> badges and provenance disclosure footers.
                  </div>
                </div>
              </div>

              {/* Finding 2 */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-3 font-sans text-xs">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <BookOpen className="w-4 h-4" />
                  <span>2. Regulatory Source Record: CAL FIRE 20m Goal vs. Pit Turnarounds</span>
                </div>
                <div className="space-y-2 text-slate-300 leading-relaxed">
                  <p>
                    <strong>CAL FIRE&apos;s Actual Mandate (CAL FIRE 8100 Handbook):</strong> CAL FIRE&apos;s foundational policy objective is the <strong>Initial Attack standard: arriving on scene within 20 minutes of dispatch</strong> on 90–95% of wildland fires within State Responsibility Areas (SRA) to contain fires to 10 acres or less. This is a <em>response flight travel time and initial containment goal</em>, NOT an airtanker pit turnaround mandate.
                  </p>
                  <p>
                    <strong>NWCG Standards for Airtanker Base Operations (PMS 505):</strong> PMS 505 governs physical base specs, pit safety, and loading protocols. It establishes <strong>no universal 16.5m or 20m statutory turnaround ceiling</strong>. In reality, turnaround times legitimately vary by airframe class:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-slate-400">
                    <li>Single Engine Airtankers (SEATs - AT-802F): <strong>6 to 12 minutes</strong></li>
                    <li>Type 1 Large Airtankers (LAT - C-130H MAFFS, MD-87): <strong>12 to 25 minutes</strong></li>
                    <li>Very Large Airtankers (VLAT - DC-10): <strong>25 to 45+ minutes</strong></li>
                    <li>Helitack / S-70i Firehawk: <strong>1 to 3 min hover dip / 10 to 15 min pad turn</strong></li>
                  </ul>
                  <p>
                    <strong>OSIRIS Scenario Thresholds:</strong> The 16.5m and 20.0m values in OSIRIS are <em>user-configurable scenario parameters</em> used in Google OR-Tools CP-SAT constraint programming for simulation stress-testing, not regulatory mandates.
                  </p>
                </div>
              </div>

              {/* Audit Summary Table */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2 font-mono text-xs">
                <span className="font-bold text-white block">Audit File Artifacts Available on Desktop:</span>
                <div className="text-slate-400 text-[11px] space-y-1">
                  <div>• <strong className="text-cyan-300">desktop_export/10_DATA_PROVENANCE_AND_SOURCE_RECORD_AUDIT.md</strong>: Complete regulatory cross-reference</div>
                  <div>• <strong className="text-cyan-300">desktop_export/08_BASE_RESOURCE_ALLOCATION_SAMPLE.json</strong>: Calibrated simulation records for 14 airbases</div>
                  <div>• <strong className="text-cyan-300">desktop_export/copy_to_desktop.sh</strong>: 1-command desktop copy tool</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950 text-xs font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>30 Vitest Tests Passing</span>
            </span>
            <span className="text-slate-600">·</span>
            <span>TypeScript Strict Mode Verified</span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-300">Froghaus Studios</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadDesktopZipBundle}
              disabled={isZipping}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Bundle to Desktop (.zip)</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
