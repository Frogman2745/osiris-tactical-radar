import React, { useState, useEffect, useRef } from 'react';
import { NavigationTab, ConnectedUser, ActivityLog, PipelineRunStatus } from './types';
import { realtimeSocket } from './services/socket';
import { Header } from './components/Header';
import { PipelineOrchestrator } from './components/PipelineOrchestrator';
import { PredictiveDashboard } from './components/PredictiveDashboard';
import { AnalyticsStudio } from './components/AnalyticsStudio';
import { AutomatedReporting } from './components/AutomatedReporting';
import { CareerPortfolioHub } from './components/CareerPortfolioHub';
import { RecruiterGuidedTourModal } from './components/RecruiterGuidedTourModal';
import { EngineeringDashboard } from './components/EngineeringDashboard';
import { ChaosEngineeringHarness } from './components/ChaosEngineeringHarness';
import { ApiLatencyMonitor } from './components/ApiLatencyMonitor';
import { AdvancedSystemAuditModal } from './components/AdvancedSystemAuditModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { WorkflowTemplateModal, WORKFLOW_TEMPLATES } from './components/WorkflowTemplateModal';
import { ExecutiveDocumentationModal } from './components/ExecutiveDocumentationModal';
import { exportMarkdownToTacticalPdf } from './services/pdfReportGenerator';
import { useToast } from './context/ToastContext';
import { 
  CheckCircle2, 
  Terminal, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Radio
} from 'lucide-react';

const TAB_STORAGE_KEY = 'axiombi_active_tab';
const VALID_TABS: NavigationTab[] = [
  'pipelines',
  'predictive-bi',
  'analytics-studio',
  'reporting',
  'career-hub'
];

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    try {
      const savedTab = localStorage.getItem(TAB_STORAGE_KEY);
      if (savedTab && VALID_TABS.includes(savedTab as NavigationTab)) {
        return savedTab as NavigationTab;
      }
    } catch {
      // Ignore localStorage access failures (e.g. private browsing restrictions)
    }
    return 'pipelines';
  });

  useEffect(() => {
    try {
      localStorage.setItem(TAB_STORAGE_KEY, activeTab);
    } catch {
      // Ignore write errors (quota or restrictions)
    }
  }, [activeTab]);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isEngineeringModalOpen, setIsEngineeringModalOpen] = useState<boolean>(false);
  const [isChaosHarnessOpen, setIsChaosHarnessOpen] = useState<boolean>(false);
  const [isLatencyMonitorOpen, setIsLatencyMonitorOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isWorkflowTemplatesOpen, setIsWorkflowTemplatesOpen] = useState<boolean>(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [docInitialTab, setDocInitialTab] = useState<'manual' | 'casestudy' | 'architecture' | 'slides' | 'publish' | 'provenance'>('manual');
  const [engineeringInitialTab, setEngineeringInitialTab] = useState<'tests' | 'adrs' | 'chaos' | 'deployments'>('tests');
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([
    { id: 'usr-default', name: 'Nicholas Marnocha', role: 'Full-Stack Developer & Ops Lead', color: '#06b6d4' }
  ]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineRunStatus>({
    state: 'idle',
    lastRunAt: '2026-09-28T21:40:00Z',
    durationMs: 1420,
    rowsProcessed: 482190,
    anomaliesFound: 2,
    stages: [
      { name: 'Ingest (Postgres + Dispatch APIs)', status: 'completed', durationMs: 380 },
      { name: 'Schema Validation & Deduplication', status: 'completed', durationMs: 240 },
      { name: 'CP-SAT Feature Engineering & Z-Score Anomaly Scan', status: 'completed', durationMs: 510 },
      { name: 'Data Mart Load & PowerBI/Tableau Sync', status: 'completed', durationMs: 290 },
    ],
  });
  const [reportMarkdown, setReportMarkdown] = useState<string>(
`# Executive Operations & Predictive BI Briefing
**Author:** Nicholas Marnocha (Lead Operations & AI Automation Engineer)
**Generated:** September 2026 · AxiomBI Operational Intelligence Engine
**Scope:** California Aviation Dispatch Telemetry & Predictive SLA Optimization

---

## 1. Executive Summary & Fleet Readiness
This report is generated from a synthetic 30-day demonstration scenario. Its values illustrate the reporting workflow and are not agency performance records or field-validated benchmarks.

- **Total Retardant & Suppressant Delivered:** 428,500 gallons
- **Active Missions Coordinated:** 142 tactical sorties
- **Allocation Comparison:** Demonstration comparison between a constraint-based assignment and a closest-resource baseline
- **Predicted Resource Pressure (Next 14 Days):** Elevated in Northern District (Redding / Humboldt sector) due to projected dry lightning patterns.

---

## 2. Automated ETL & Data Quality Health
The demonstration pipeline models ingestion, validation, quarantine, and delivery stages using generated records.
- **Anomaly Detection:** Flagged 2 turnaround spikes (>25 mins) at McClellan Base during peak surge hours; resolved via ground crew re-sequencing.
- **Automated Schema Drift Protection:** Zero unmapped field errors recorded.

---

## 3. Recommended Actions
1. **Pre-Positioning:** Transition Copter 106 and Tanker 80 to high-readiness alert status between 1300 and 1900 hours.
2. **Predictive Maintenance:** Schedule preemptive hydraulic valve inspections for Tanker 96 prior to reaching the 90.0 flight hour threshold.
3. **Continuous Automation:** Enable automated Slack/PagerDuty webhook alerts for any base exceeding a 19.5-minute average turnaround window.`
  );

  const { addToast } = useToast();
  const prevPipelineStatusRef = useRef<string>('idle');

  useEffect(() => {
    // Initial fetch of state from server
    fetch('/api/state')
      .then((res) => res.json())
      .then((data) => {
        if (data.reportMarkdown) setReportMarkdown(data.reportMarkdown);
        if (data.pipelineStatus) setPipelineStatus(data.pipelineStatus);
        if (data.activityLogs) setActivityLogs(data.activityLogs);
        if (data.connectedUsers?.length) setConnectedUsers(data.connectedUsers);
      })
      .catch((e) => console.log('Loaded initial offline state', e));

    // WebSocket event listeners with Non-Intrusive Global Toasts
    const unsubConn = realtimeSocket.on('connection:status', (data: any) => {
      const connected = !!data.connected;
      setIsSocketConnected(connected);
      if (connected) {
        addToast({
          type: 'success',
          title: 'AxiomBI Telemetry Stream Connected',
          message: 'WebSocket Link established with operational data mart.',
          durationMs: 3500,
        });
      }
    });

    const unsubInit = realtimeSocket.on('init:state', (data: any) => {
      if (data.reportMarkdown) setReportMarkdown(data.reportMarkdown);
      if (data.pipelineStatus) setPipelineStatus(data.pipelineStatus);
      if (data.activityLogs) setActivityLogs(data.activityLogs);
      if (data.connectedUsers) setConnectedUsers(data.connectedUsers);
      setIsSocketConnected(true);
    });

    const unsubPresence = realtimeSocket.on('presence:update', (data: any) => {
      if (data.users) {
        setConnectedUsers(data.users);
      }
    });

    const unsubPipeline = realtimeSocket.on('pipeline:update', (data: any) => {
      if (data.status) {
        const nextState = data.status.state;
        const prevState = prevPipelineStatusRef.current;
        prevPipelineStatusRef.current = nextState;

        setPipelineStatus(data.status);

        if (nextState === 'running' && prevState !== 'running') {
          addToast({
            type: 'pipeline',
            title: 'ETL Pipeline Commenced',
            message: 'Continuous ingestion & schema validation stages in progress.',
            durationMs: 4000,
          });
        } else if (nextState === 'success' && prevState === 'running') {
          addToast({
            type: 'success',
            title: 'ETL Pipeline Completed',
            message: `Processed ${data.status.rowsProcessed?.toLocaleString() || '482,190'} records in ${(data.status.durationMs / 1000).toFixed(2)}s with 0 errors.`,
            actionLabel: 'View Audit Logs',
            onAction: () => setIsAuditModalOpen(true),
            durationMs: 5500,
          });
        }
      }
      if (data.newLog) {
        setActivityLogs((prev) => [data.newLog, ...prev.slice(0, 15)]);
      }
    });

    const unsubActivity = realtimeSocket.on('activity:broadcast', (data: any) => {
      if (data.log) {
        setActivityLogs((prev) => [data.log, ...prev.slice(0, 15)]);
        addToast({
          type: 'info',
          title: data.log.action || 'System Event',
          message: `${data.log.user}: ${data.log.category}`,
          durationMs: 4000,
        });
      }
    });

    return () => {
      unsubConn();
      unsubInit();
      unsubPresence();
      unsubPipeline();
      unsubActivity();
    };
  }, [addToast]);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExportPdf = async (options?: { scope?: 'executive' | 'full' | 'audit' }) => {
    addToast({
      type: 'info',
      title: 'Generating Tactical PDF Report',
      message: `Compiling ${options?.scope || 'executive'} briefing with telemetry matrices...`,
      durationMs: 3000,
    });

    try {
      await exportMarkdownToTacticalPdf(reportMarkdown, {
        reportVersion: 1,
        lastAuthor: 'Nicholas Marnocha (Lead)',
        lastUpdated: new Date().toLocaleTimeString(),
        title: options?.scope === 'audit' ? 'AxiomBI System Audit & Compliance Ledger' : 'Executive Operations & Predictive BI Briefing',
      });
      addToast({
        type: 'success',
        title: 'PDF Export Ready',
        message: 'Tactical PDF document downloaded successfully.',
        durationMs: 4000,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'PDF Export Failed',
        message: 'Unable to compile document. Check browser download permissions.',
        durationMs: 4500,
      });
    }
  };

  const handleTriggerPipeline = () => {
    addToast({
      type: 'pipeline',
      title: 'Triggering Telemetry Pipeline',
      message: 'Dispatching staged execution request to backend...',
      durationMs: 3000,
    });
    realtimeSocket.triggerPipeline();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Header adheres strictly to Top Bar Contract */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        connectedUsers={connectedUsers}
        onTriggerPipeline={handleTriggerPipeline}
        isPipelineRunning={pipelineStatus.state === 'running'}
        isSocketConnected={isSocketConnected}
        onOpenRecruiterTour={() => setIsTourOpen(true)}
        onOpenEngineeringModal={() => {
          setEngineeringInitialTab('tests');
          setIsEngineeringModalOpen(true);
        }}
        onOpenLatencyMonitor={() => setIsLatencyMonitorOpen(true)}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenDocumentationModal={(tab) => {
          if (tab) setDocInitialTab(tab);
          setIsDocModalOpen(true);
        }}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {activeTab === 'pipelines' && (
          <PipelineOrchestrator
            pipelineStatus={pipelineStatus}
            onTriggerPipeline={handleTriggerPipeline}
            isPipelineRunning={pipelineStatus.state === 'running'}
            onOpenChaosHarness={() => setIsChaosHarnessOpen(true)}
            onOpenLiveTests={() => {
              setEngineeringInitialTab('tests');
              setIsEngineeringModalOpen(true);
            }}
            onAddActivityLog={(actionMsg) => {
              setActivityLogs((prev) => [
                {
                  id: `log-clean-${Date.now()}`,
                  timestamp: new Date().toLocaleTimeString(),
                  user: 'Nicholas Marnocha (Lead)',
                  action: actionMsg,
                  category: 'ETL Pipeline',
                },
                ...prev.slice(0, 19),
              ]);
            }}
          />
        )}

        {activeTab === 'predictive-bi' && (
          <PredictiveDashboard
            activityLogs={activityLogs}
            onAddActivityLog={(newLog) => setActivityLogs((prev) => [newLog, ...prev.slice(0, 19)])}
          />
        )}

        {activeTab === 'analytics-studio' && (
          <AnalyticsStudio />
        )}

        {activeTab === 'reporting' && (
          <AutomatedReporting
            initialMarkdown={reportMarkdown}
            connectedUsers={connectedUsers}
          />
        )}

        {activeTab === 'career-hub' && (
          <CareerPortfolioHub />
        )}
      </main>

      {/* Recruiter Guided Tour Modal */}
      <RecruiterGuidedTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenTestRunner={() => {
          setEngineeringInitialTab('tests');
          setIsEngineeringModalOpen(true);
        }}
        onOpenChaosHarness={() => setIsChaosHarnessOpen(true)}
      />

      {/* Engineering Architecture & Live Test Runner Dashboard Modal */}
      {isEngineeringModalOpen && (
        <EngineeringDashboard
          isOpen={isEngineeringModalOpen}
          onClose={() => setIsEngineeringModalOpen(false)}
          isModal={true}
          initialTab={engineeringInitialTab}
        />
      )}

      {/* Chaos Engineering & Fault-Injection Harness Modal */}
      {isChaosHarnessOpen && (
        <ChaosEngineeringHarness
          isOpen={isChaosHarnessOpen}
          onClose={() => setIsChaosHarnessOpen(false)}
          isModal={true}
        />
      )}

      {/* Real-Time API & Integration Latency Monitor Modal */}
      {isLatencyMonitorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <ApiLatencyMonitor onClose={() => setIsLatencyMonitorOpen(false)} isModal={true} />
        </div>
      )}

      {/* Advanced System Audit & Application-Level Log Modal */}
      {isAuditModalOpen && (
        <AdvancedSystemAuditModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
        />
      )}

      {/* Global Cmd+K Command Palette Modal */}
      {isCommandPaletteOpen && (
        <CommandPaletteModal
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            setIsCommandPaletteOpen(false);
          }}
          onTriggerPipeline={handleTriggerPipeline}
          onOpenAuditModal={() => {
            setIsAuditModalOpen(true);
            setIsCommandPaletteOpen(false);
          }}
          onOpenEngineeringModal={() => {
            setEngineeringInitialTab('tests');
            setIsEngineeringModalOpen(true);
            setIsCommandPaletteOpen(false);
          }}
          onOpenLatencyMonitor={() => {
            setIsLatencyMonitorOpen(true);
            setIsCommandPaletteOpen(false);
          }}
          onOpenChaosHarness={() => {
            setIsChaosHarnessOpen(true);
            setIsCommandPaletteOpen(false);
          }}
          onOpenTour={() => {
            setIsTourOpen(true);
            setIsCommandPaletteOpen(false);
          }}
          onExportPdf={handleExportPdf}
          isPipelineRunning={pipelineStatus.state === 'running'}
          pipelineStatus={pipelineStatus}
          activityLogs={activityLogs}
          onOpenWorkflowTemplates={() => {
            setIsWorkflowTemplatesOpen(true);
            setIsCommandPaletteOpen(false);
          }}
        />
      )}

      {/* Global Workflow Template Library Modal */}
      {isWorkflowTemplatesOpen && (
        <WorkflowTemplateModal
          isOpen={isWorkflowTemplatesOpen}
          onClose={() => setIsWorkflowTemplatesOpen(false)}
          onSelectTemplate={(template) => {
            setActiveTab('pipelines');
            addToast({
              type: 'success',
              title: `Blueprint Deployed: ${template.name}`,
              message: `Loaded ${template.stages.length} pipeline stages (${template.category}) targeting ${template.slaTarget}.`,
              durationMs: 4000,
            });
            setActivityLogs((prev) => [
              {
                id: `log-tpl-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                user: 'Nicholas Marnocha (Lead)',
                action: `Deployed workflow blueprint: ${template.name} (${template.category})`,
                category: 'ETL Pipeline',
              },
              ...prev.slice(0, 19),
            ]);
          }}
        />
      )}

      {/* Executive Documentation, Case Study & Slide Deck Modal */}
      {isDocModalOpen && (
        <ExecutiveDocumentationModal
          isOpen={isDocModalOpen}
          onClose={() => setIsDocModalOpen(false)}
          initialTab={docInitialTab}
        />
      )}

      {/* Minimal Footer adhering to anti-slop guidelines */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Nicholas Marnocha</span>
            <span aria-hidden="true">·</span>
            <span>AxiomBI Operations Engine</span>
            <span aria-hidden="true">·</span>
            <span>Huntington Beach, CA</span>
          </div>

          <div className="flex items-center gap-5 text-slate-400">
            <a 
              href="https://github.com/Frogman2745" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              GitHub / Frogman2745
            </a>
            <a 
              href="https://froghausstudios.com" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              froghausstudios.com
            </a>
            <a 
              href="https://linkedin.com/in/nicholas-m-a36726260" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
