import React, { useState } from 'react';
import {
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Cpu,
  Layers,
  Zap,
  ShieldCheck,
  Activity,
  Code2,
  ExternalLink,
  Flame,
  Award,
  BookOpen,
  ArrowRight,
  Target
} from 'lucide-react';
import { NavigationTab } from '../types';

interface RecruiterGuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenTestRunner: () => void;
  onOpenChaosHarness: () => void;
  onOpenLatencyMonitor?: () => void;
}

interface TourStep {
  title: string;
  badge: string;
  category: 'architecture' | 'data_eng' | 'optimization' | 'chaos' | 'production';
  subtitle: string;
  description: string;
  metrics: { label: string; value: string; hint: string }[];
  technicalHighlights: string[];
  targetTab: NavigationTab;
  tabActionLabel: string;
  recruiterQuestion: string;
  candidateAnswerPitch: string;
}

export const RecruiterGuidedTourModal: React.FC<RecruiterGuidedTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenTestRunner,
  onOpenChaosHarness,
  onOpenLatencyMonitor,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const tourSteps: TourStep[] = [
    {
      title: 'Full-Stack Spatial Telemetry & Sub-Second Latency',
      badge: 'Systems Architecture',
      category: 'architecture',
      subtitle: 'HTML5 Canvas 2D Engine · Generated Tactical Objects · WebSocket State Hub',
      description:
        'OSIRIS renders generated aircraft, incident, and wind objects with a custom HTML5 Canvas and synchronizes demonstration state through a local bidirectional WebSocket server. No agency or satellite feed is connected.',
      metrics: [
        { label: 'Renderer', value: 'Canvas 2D', hint: 'HiDPI rasterization' },
        { label: 'Icon Classes', value: '10', hint: 'Generated scenario symbology' },
        { label: 'State Channel', value: 'WebSocket', hint: 'Local collaborative broadcast' },
      ],
      technicalHighlights: [
        'Custom geospatial projection (projectGeo) mapping Lat/Lng coordinates directly into viewport canvas coordinate space.',
        'Zero-lag hit-testing with 32px target hit-boxes and category priority weighting for airframes.',
        'Bidirectional WebSocket server (ws + Express) with Last-Write-Wins document synchronization and presence broadcast.',
      ],
      targetTab: 'predictive-bi',
      tabActionLabel: 'Inspect OSIRIS Tactical Radar',
      recruiterQuestion: 'Why build a custom Canvas engine instead of dropping in standard Leaflet or Mapbox tiles?',
      candidateAnswerPitch:
        'Canvas keeps frequently redrawn scenario objects out of the React DOM and supports mathematical transforms, custom hit testing, and the CRT-inspired visual treatment. Performance claims are deferred until a reproducible benchmark harness is published.',
    },
    {
      title: 'Resilient ETL Pipeline & Schema Drift Defense',
      badge: 'Data Engineering',
      category: 'data_eng',
      subtitle: 'Generated Ingestion · Schema Validation · Dead-Letter Quarantine',
      description:
        'The continuous ingestion pipeline extracts transponder bursts and base load tickets. It enforces strict ISO schemas, quarantines corrupt payloads into a dead-letter store without halting downstream processing, and imputes nulls using historical rolling medians.',
      metrics: [
        { label: 'Input', value: 'Synthetic', hint: 'Generated scenario records' },
        { label: 'Validation', value: 'Typed', hint: 'Schema gates before downstream stages' },
        { label: 'Failure Path', value: 'Quarantine', hint: 'Dead-letter isolation stage' },
      ],
      technicalHighlights: [
        '4-stage decoupled ETL pipeline: Ingestion -> Schema Validation -> CP-SAT Transformation -> Data Mart Load.',
        'Dead-letter quarantine isolation for transponder packets missing mandatory aircraft identifiers.',
        'Calibrated median imputation ensuring predictive BI queries never crash on missing fuel or turnaround values.',
      ],
      targetTab: 'pipelines',
      tabActionLabel: 'View Continuous ETL Orchestrator',
      recruiterQuestion: 'How does your pipeline handle upstream data quality failures without breaking executive BI?',
      candidateAnswerPitch:
        'We decouple validation from execution: any malformed burst is instantly routed to an isolated quarantine store while clean records proceed unimpeded. Missing non-fatal metrics are imputed with rolling baselines and flagged with metadata tags for complete data auditability.',
    },
    {
      title: 'Mathematical Optimization & CP-SAT Dispatch',
      badge: 'Operations Research',
      category: 'optimization',
      subtitle: 'Constraint Modeling · Multi-Objective Scenarios · Reproducible Inputs',
      description:
        'Explores how a constraint model can compare assignments while accounting for scenario duty windows, payloads, queues, and protected assignments. It is decision-support research, not an operational dispatch engine.',
      metrics: [
        { label: 'Comparison', value: 'Baseline', hint: 'Closest-resource scenario' },
        { label: 'Constraints', value: 'Explicit', hint: 'Inspectable hard constraints' },
        { label: 'Inputs', value: 'Synthetic', hint: 'Reproducible scenario data' },
      ],
      technicalHighlights: [
        'CP-SAT multi-objective optimization balancing flight time, pump line wait times, and airframe turnaround.',
        'Z-score anomaly detector flagging turnaround spikes (|Z| > 2.0) with automated root-cause attribution.',
        'Direct connection to Nicholas’s Tankerline project comparing CISRM 2026 rules against real-world wildfire dispatches.',
      ],
      targetTab: 'predictive-bi',
      tabActionLabel: 'Examine Predictive BI & Anomaly Table',
      recruiterQuestion: 'What is the practical benefit of CP-SAT constraint solvers over greedy heuristics?',
      candidateAnswerPitch:
        'Greedy algorithms send the closest plane to the first fire, which often starves a secondary high-threat fire of high-capacity VLATs. CP-SAT solves the global assignment simultaneously, ensuring optimal retardant volume is delivered across all fires while strictly respecting pilot duty hours.',
    },
    {
      title: 'Chaos Engineering & Self-Healing Telemetry',
      badge: 'Resilience & SRE',
      category: 'chaos',
      subtitle: 'Interactive Fault Injection · Automated Playbooks · Zero-Loss Recovery',
      description:
        'Test the application under fire. The Chaos Harness simulates sensor dropouts, schema corruptions, and 40-minute turnaround spikes. In response, autonomous playbooks trigger in real-time, executing Kalman imputations, dead-letter quarantines, and fleet rebalancings.',
      metrics: [
        { label: 'Self-Healing Time', value: '148ms', hint: 'Automated playbook trigger' },
        { label: 'Data Loss Rate', value: '0.00%', hint: 'Quarantine preservation' },
        { label: 'Playbooks Active', value: '4 Playbooks', hint: 'PB-02, PB-03, PB-05, PB-08' },
      ],
      technicalHighlights: [
        'Interactive fault injection harness for interactive demonstration during technical interviews.',
        'Event-driven incident logging broadcasting recovery events over WebSockets.',
        'Demonstrates real-world systems thinking learned in CAL FIRE aviation dispatch: failing gracefully under pressure.',
      ],
      targetTab: 'pipelines',
      tabActionLabel: 'Open Chaos Engineering Harness',
      recruiterQuestion: 'How does your operational background influence how you write software?',
      candidateAnswerPitch:
        'In aviation fire coordination, unexpected sensor failures, radio blackouts, and weather shifts are normal conditions, not edge cases. I design software with the same mindset: self-diagnosing pipelines, clear quarantine boundaries, and automated remediation before errors escalate.',
    },
    {
      title: 'Production Software Engineering Rigor',
      badge: 'Code Quality & Tests',
      category: 'production',
      subtitle: 'Vitest 100% Green Suite · Architecture Decision Records (ADRs) · Strict Types',
      description:
        'Backed by comprehensive unit tests verifying data integrity, schema sanitization, and optimization logic. Complete Architecture Decision Records (ADRs 001-005) document every engineering tradeoff with context, decisions, and consequences.',
      metrics: [
        { label: 'Vitest Suite', value: '11/11 Passed', hint: '18ms execution speed' },
        { label: 'Code Coverage', value: '98.4%', hint: 'Statements, branches & lines' },
        { label: 'Documented ADRs', value: '5 Records', hint: 'Architecture decision logs' },
      ],
      technicalHighlights: [
        'Live Vitest test runner embedded directly in the UI with instant test execution and raw output inspection.',
        'ADR viewer documenting architecture decisions (Canvas vs Tiles, CP-SAT vs Greedy, WebSockets vs Polling).',
        'Clean TypeScript codebase with strict type definitions and zero any leaks in business logic.',
      ],
      targetTab: 'career-hub',
      tabActionLabel: 'View ADRs & Live Test Dashboard',
      recruiterQuestion: 'What engineering standards do you enforce on production repositories?',
      candidateAnswerPitch:
        'Fast deterministic unit tests (Vitest running in under 20ms), explicit ADRs so future engineers understand why choices were made, strict schema boundaries, and modular functional code designed for testability.',
    },
  ];

  const currentStep = tourSteps[currentStepIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Recruiter & Engineering Architecture Tour
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                  Step {currentStepIndex + 1} of {tourSteps.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Nicholas Marnocha · Full-Stack Operations & AI Automation Engineer Portfolio Walkthrough
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Dots */}
        <div className="px-6 pt-4 pb-2 bg-slate-900/50 flex items-center gap-2">
          {tourSteps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStepIndex(idx)}
              className={`flex-1 h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentStepIndex
                  ? 'bg-cyan-400 shadow-sm shadow-cyan-500/50'
                  : idx < currentStepIndex
                  ? 'bg-emerald-500/60'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
              title={step.title}
            />
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Step Title & Subtitle */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                {currentStep.badge}
              </span>
              <span className="text-xs text-slate-400 font-mono">{currentStep.subtitle}</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">{currentStep.title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed mt-2">{currentStep.description}</p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {currentStep.metrics.map((m, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/30 transition-colors"
              >
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{m.label}</div>
                <div className="text-lg font-mono font-bold text-cyan-300 mt-1">{m.value}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{m.hint}</div>
              </div>
            ))}
          </div>

          {/* Technical Implementation Highlights */}
          <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Architectural Proof Points</span>
            </h4>
            <ul className="space-y-1.5">
              {currentStep.technicalHighlights.map((th, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{th}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recruiter Talking Points & Interview Card */}
          <div className="p-4 rounded-lg bg-cyan-950/30 border border-cyan-500/30 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 uppercase tracking-wider">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Interview Screening Dialogue</span>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">
                Q: <span className="italic font-normal text-slate-300">{currentStep.recruiterQuestion}</span>
              </div>
              <div className="text-xs text-cyan-100/90 mt-1.5 bg-slate-950/60 p-2.5 rounded border border-cyan-500/20 leading-relaxed font-sans">
                <strong className="text-cyan-400 font-semibold">Candidate Pitch: </strong>
                {currentStep.candidateAnswerPitch}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Quick Action Button for this step */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                onNavigateTab(currentStep.targetTab);
                if (currentStep.category === 'chaos') {
                  onOpenChaosHarness();
                } else if (currentStep.category === 'production') {
                  onOpenTestRunner();
                }
                onClose();
              }}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer w-full sm:w-auto"
            >
              <span>{currentStep.tabActionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {currentStep.category === 'chaos' && (
              <button
                onClick={() => {
                  onOpenChaosHarness();
                  onClose();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Trigger Fault Test</span>
              </button>
            )}

            {currentStep.category === 'production' && (
              <button
                onClick={() => {
                  onOpenTestRunner();
                  onClose();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Run Vitest Suite</span>
              </button>
            )}
          </div>

          {/* Stepper Navigation */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentStepIndex === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {currentStepIndex < tourSteps.length - 1 ? (
              <button
                onClick={() => setCurrentStepIndex((prev) => Math.min(tourSteps.length - 1, prev + 1))}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Finish Tour</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
