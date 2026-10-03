import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Command,
  Play,
  FileDown,
  Settings,
  Shield,
  Activity,
  Zap,
  Terminal,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  Cpu,
  Sliders,
  ExternalLink,
  ChevronRight,
  Flame,
  Radio,
  FileText,
  Clock,
  Printer,
  CheckCircle2,
  X,
  TrendingUp,
  Rocket,
  Trash2,
  Calendar,
  Filter,
  History,
  Bell,
  FileSpreadsheet,
  GitFork,
  StickyNote,
  MessageSquare,
  Split,
  ArrowDownUp,
  Variable
} from 'lucide-react';
import { NavigationTab, ActivityLog, PipelineRunStatus } from '../types';

export interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: 'Modules' | 'Actions & Pipelines' | 'Exports & PDF' | 'System & Auditing';
  icon: React.ReactNode;
  shortcut?: string;
  badge?: string;
  onSelect: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavigationTab) => void;
  onTriggerPipeline: () => void;
  onOpenAuditModal: () => void;
  onOpenEngineeringModal: () => void;
  onOpenLatencyMonitor: () => void;
  onOpenChaosHarness: () => void;
  onOpenTour: () => void;
  onExportPdf: (options?: { scope?: 'executive' | 'full' | 'audit' }) => void;
  isPipelineRunning: boolean;
  pipelineStatus?: PipelineRunStatus;
  activityLogs?: ActivityLog[];
  onOpenWorkflowTemplates?: () => void;
  onRetryStage?: (stageName: string) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onTriggerPipeline,
  onOpenAuditModal,
  onOpenEngineeringModal,
  onOpenLatencyMonitor,
  onOpenChaosHarness,
  onOpenTour,
  onExportPdf,
  isPipelineRunning,
  pipelineStatus,
  activityLogs = [],
  onOpenWorkflowTemplates,
  onRetryStage,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Focus input whenever opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Construct all available command items
  const commands: CommandItem[] = useMemo(() => [
    // 1. MODULE NAVIGATION
    {
      id: 'nav-pipelines',
      title: 'Go to ETL Pipeline Orchestrator',
      description: 'Staged ingestion, schema validation, and real-time data mart load pipeline.',
      category: 'Modules',
      icon: <Database className="w-4 h-4 text-cyan-400" />,
      shortcut: 'G P',
      onSelect: () => {
        onNavigateTab('pipelines');
        onClose();
      },
    },
    {
      id: 'nav-predictive-bi',
      title: 'Go to Predictive Flight Dynamics & OSIRIS War Room',
      description: 'Multi-domain tactical radar, CP-SAT optimization, and resource utilization density heat-map.',
      category: 'Modules',
      icon: <Activity className="w-4 h-4 text-purple-400" />,
      shortcut: 'G B',
      onSelect: () => {
        onNavigateTab('predictive-bi');
        onClose();
      },
    },
    {
      id: 'nav-capacity-forecast',
      title: 'Jump to 7-Day Resource Capacity Forecasting',
      description: 'ARIMA & Holt-Winters forward projections for CPU saturation, RAM pools, and autoscaling pod replicas.',
      category: 'Modules',
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
      shortcut: 'G F',
      badge: '7-DAY',
      onSelect: () => {
        onNavigateTab('predictive-bi');
        onClose();
      },
    },
    {
      id: 'nav-peak-activity-matrix',
      title: 'Inspect 24/7 Hourly User Interaction Intensity & Peak Heatmap',
      description: '7-day by 24-hour visual matrix of user activity density to identify peak wildfire dispatch hours.',
      category: 'Modules',
      icon: <Calendar className="w-4 h-4 text-orange-400" />,
      badge: 'PEAKS',
      onSelect: () => {
        onNavigateTab('predictive-bi');
        onClose();
      },
    },
    {
      id: 'nav-analytics-studio',
      title: 'Go to SQL Analytics & Python Polars Studio',
      description: 'In-memory telemetry analysis, query planner, and natural language Gemini AI generation.',
      category: 'Modules',
      icon: <Terminal className="w-4 h-4 text-emerald-400" />,
      shortcut: 'G S',
      onSelect: () => {
        onNavigateTab('analytics-studio');
        onClose();
      },
    },
    {
      id: 'nav-reporting',
      title: 'Go to Collaborative Briefings & Automated Reporting',
      description: 'Real-time collaborative executive summary with revision history and PDF generator.',
      category: 'Modules',
      icon: <FileText className="w-4 h-4 text-amber-400" />,
      shortcut: 'G R',
      onSelect: () => {
        onNavigateTab('reporting');
        onClose();
      },
    },
    {
      id: 'nav-career-hub',
      title: 'Go to Career & Portfolio Hub',
      description: 'Nicholas Marnocha credentials, architecture blueprints, and engineering leadership resume.',
      category: 'Modules',
      icon: <Sparkles className="w-4 h-4 text-sky-400" />,
      shortcut: 'G C',
      onSelect: () => {
        onNavigateTab('career-hub');
        onClose();
      },
    },

    // 2. ACTIONS & PIPELINES
    {
      id: 'act-trigger-pipeline',
      title: isPipelineRunning ? 'ETL Pipeline is Currently Running...' : 'Trigger Telemetry Pipeline Run',
      description: 'Dispatch real-time ingestion, schema drift scan, and CP-SAT anomaly detection.',
      category: 'Actions & Pipelines',
      icon: <Play className={`w-4 h-4 ${isPipelineRunning ? 'text-amber-400 animate-spin' : 'text-cyan-400'}`} />,
      shortcut: '↵ Run',
      badge: isPipelineRunning ? 'ACTIVE' : 'IDLE',
      onSelect: () => {
        if (!isPipelineRunning) {
          onTriggerPipeline();
        }
        onClose();
      },
    },
    {
      id: 'act-workflow-templates',
      title: 'Open Workflow Template & Blueprint Library',
      description: 'Deploy pre-configured ETL pipelines categorized by industry use-case (Defense, SaaS, Healthcare, IoT, Logistics).',
      category: 'Actions & Pipelines',
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
      shortcut: '⌘ T',
      badge: 'BLUEPRINTS',
      onSelect: () => {
        if (onOpenWorkflowTemplates) {
          onOpenWorkflowTemplates();
        } else {
          onNavigateTab('pipelines');
        }
        onClose();
      },
    },
    {
      id: 'act-inspect-process-overhead',
      title: 'Inspect Real-Time CPU/RAM Process Overhead Chart',
      description: 'Continuous Recharts telemetry visualization of container cores, heap allocation, and stage overhead.',
      category: 'Actions & Pipelines',
      icon: <Cpu className="w-4 h-4 text-cyan-400" />,
      shortcut: 'G M',
      badge: 'CPU / RAM',
      onSelect: () => {
        onNavigateTab('pipelines');
        onClose();
      },
    },
    {
      id: 'act-resource-thresholds-timeline',
      title: 'Configure Resource Thresholds & View 10-Run Historical Timeline',
      description: 'Auto-trigger alert rules when CPU or RAM exceeds 85% for >30s, and inspect line chart success trend of last 10 runs.',
      category: 'Actions & Pipelines',
      icon: <Bell className="w-4 h-4 text-amber-400" />,
      shortcut: 'G T',
      badge: 'THRESHOLDS',
      onSelect: () => {
        onNavigateTab('pipelines');
        onClose();
      },
    },
    {
      id: 'act-predictive-auto-scaling',
      title: 'Toggle Predictive Auto-Scaling for ETL Compute Stages',
      description: 'Dynamically scale CPU and RAM quotas per stage derived from historical run duration patterns and CP-SAT bottlenecks.',
      category: 'Actions & Pipelines',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      shortcut: 'G P',
      badge: 'PREDICTIVE',
      onSelect: () => {
        onNavigateTab('pipelines');
        onClose();
      },
    },
    {
      id: 'act-inspect-dag-flow',
      title: 'Inspect Inter-Stage DAG Execution Dependency Graph',
      description: 'Directed Acyclic Graph visualization with topological sorting, animated dataflow particles, and stage lineage.',
      category: 'Actions & Pipelines',
      icon: <GitFork className="w-4 h-4 text-cyan-400" />,
      shortcut: 'G D',
      badge: 'DAG GRAPH',
      onSelect: () => {
        onNavigateTab('pipelines');
        onClose();
      },
    },
    {
      id: 'act-dag-sticky-notes',
      title: 'Attach Sticky Notes & Engineering Annotations to DAG Stages',
      description: 'Pin persistent engineering documentation, SLA constraints, and schema rules directly onto DAG stages.',
      category: 'Actions & Pipelines',
      icon: <StickyNote className="w-4 h-4 text-amber-400" />,
      shortcut: 'G N',
      badge: 'NOTES',
      onSelect: () => {
        onNavigateTab('pipelines');
        onClose();
      },
    },
    {
      id: 'act-investigation-comment-thread',
      title: 'Open Investigation Comment Thread on DAG Pipeline Stages',
      description: 'Side-panel for time-stamped notes, root-cause tags, and mitigation strategies on specific DAG stages.',
      category: 'Actions & Pipelines',
      icon: <MessageSquare className="w-4 h-4 text-cyan-400" />,
      shortcut: 'G C',
      badge: 'COMMENTS',
      onSelect: () => {
        onNavigateTab('pipelines');
        onClose();
      },
    },
    {
      id: 'act-dag-auto-documenter',
      title: 'Run AI Auto-Documenter on Pipeline DAG (README.md Summary)',
      description: 'Uses Gemini 3.8 Flash to scan workflow stages and output a concise README-style markdown architectural summary.',
      category: 'Actions & Pipelines',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      shortcut: 'G M',
      badge: 'AUTO-DOC',
      onSelect: () => {
        onNavigateTab('pipelines');
        onClose();
      },
    },
    {
      id: 'act-dag-latency-heatmap',
      title: 'Toggle DAG Latency Heatmap Overlay (Node Duration vs Historical Baseline)',
      description: 'Colorizes DAG stage nodes dynamically based on execution time variance against historical averages.',
      category: 'Actions & Pipelines',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      shortcut: 'G H',
      badge: 'HEATMAP',
      onSelect: () => {
        onNavigateTab('pipelines');
        onClose();
      },
    },
    {
      id: 'act-dag-parallel-execution',
      title: 'Configure Parallel Concurrent Processing on Independent DAG Stages',
      description: 'Enable or disable parallel concurrent branches across independent stages to maximize throughput and minimize latency.',
      category: 'Actions & Pipelines',
      icon: <Split className="w-4 h-4 text-teal-400" />,
      shortcut: 'G P',
      badge: 'PARALLEL',
      onSelect: () => {
        onNavigateTab('pipelines');
        onClose();
      },
    },
    {
      id: 'act-global-variables',
      title: 'Open Global Variable Store (Persistent Cross-Stage Runtime Config)',
      description: 'Manage persistent key-value parameters, thresholds, and secrets accessible across all pipeline stages.',
      category: 'Actions & Pipelines',
      icon: <Variable className="w-4 h-4 text-teal-400" />,
      shortcut: 'G V',
      badge: 'STORE',
      onSelect: () => {
        onNavigateTab('pipelines');
        onClose();
      },
    },
    {
      id: 'act-dag-density',
      title: 'Toggle DAG View Density (Compact Overview vs Expanded Details)',
      description: 'Switch between condensed layout for large topological workflows and full detail node cards with latency stats.',
      category: 'Actions & Pipelines',
      icon: <Sliders className="w-4 h-4 text-cyan-400" />,
      shortcut: 'G D',
      badge: 'DENSITY',
      onSelect: () => {
        onNavigateTab('pipelines');
        onClose();
      },
    },
    {
      id: 'act-pipeline-gc',
      title: 'Run Automated Pipeline Garbage Collection & Compute Cleanup',
      description: 'Identify and purge unreferenced Parquet spill buffers, dead-letter dumps, and dangling pods.',
      category: 'Actions & Pipelines',
      icon: <Trash2 className="w-4 h-4 text-red-400" />,
      badge: 'GC CLEANUP',
      onSelect: () => {
        onNavigateTab('pipelines');
        onClose();
      },
    },
    {
      id: 'act-start-tour',
      title: 'Launch Interactive Recruiter Guided Tour',
      description: 'Step-by-step product walkthrough spotlighting full-stack architecture, SLAs, and live sockets.',
      category: 'Actions & Pipelines',
      icon: <Sparkles className="w-4 h-4 text-amber-300" />,
      shortcut: 'T',
      onSelect: () => {
        onOpenTour();
        onClose();
      },
    },
    {
      id: 'act-open-chaos',
      title: 'Simulate Network Chaos & Fault Injection',
      description: 'Inject synthetic packet drops, airbase API timeouts, and inspect auto-healing playbooks.',
      category: 'Actions & Pipelines',
      icon: <Zap className="w-4 h-4 text-orange-400" />,
      onSelect: () => {
        onOpenChaosHarness();
        onClose();
      },
    },

    // 3. EXPORT PDF SECTION
    {
      id: 'export-executive-pdf',
      title: 'Export Executive Flight Operations PDF Report',
      description: 'Generate publication-grade dark tactical PDF with KPI telemetry pills and RCA summaries.',
      category: 'Exports & PDF',
      icon: <FileDown className="w-4 h-4 text-rose-400" />,
      shortcut: '⌘ E',
      badge: 'PDF',
      onSelect: () => {
        onExportPdf({ scope: 'executive' });
        onClose();
      },
    },
    {
      id: 'export-audit-pdf',
      title: 'Export Complete System Audit & Compliance PDF',
      description: 'Full audit ledger of WebSocket sessions, pipeline transformations, and error exception traces.',
      category: 'Exports & PDF',
      icon: <Printer className="w-4 h-4 text-orange-400" />,
      badge: 'PDF',
      onSelect: () => {
        onExportPdf({ scope: 'audit' });
        onClose();
      },
    },
    {
      id: 'export-audit-json-csv',
      title: 'Export Pipeline Audit Logs & Traces (JSON / CSV)',
      description: 'Open Advanced System Audit modal with direct access to filtered JSON and RFC 4180 CSV telemetry export.',
      category: 'Exports & PDF',
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" />,
      shortcut: '⌘ J',
      badge: 'JSON / CSV',
      onSelect: () => {
        onOpenAuditModal();
        onClose();
      },
    },

    // 4. SYSTEM & SETTINGS
    {
      id: 'sys-audit-modal',
      title: 'Open Advanced System Audit & Log Telemetry',
      description: 'Live distributed event stream, HTTP request traces, and WebSocket frame inspect.',
      category: 'System & Auditing',
      icon: <Shield className="w-4 h-4 text-cyan-400" />,
      onSelect: () => {
        onOpenAuditModal();
        onClose();
      },
    },
    {
      id: 'sys-latency-monitor',
      title: 'Open Real-Time API & Integration Latency Monitor',
      description: 'Live latency probes across California airbase endpoints and database response timers.',
      category: 'System & Auditing',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      badge: '18ms P95',
      onSelect: () => {
        onOpenLatencyMonitor();
        onClose();
      },
    },
    {
      id: 'sys-engineering-modal',
      title: 'Open Architecture Decision Records (ADRs) & Vitest Suite',
      description: '17 passing unit test specs and verified architectural decision records.',
      category: 'System & Auditing',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      badge: '17 Tests',
      onSelect: () => {
        onOpenEngineeringModal();
        onClose();
      },
    },
    {
      id: 'sys-deployment-health',
      title: 'View Deployment Pipeline Health & Cloud Run Status',
      description: 'Recent build success sparkline velocity, Canary/Prod uptime SLA, and commit digest ledger.',
      category: 'System & Auditing',
      icon: <Rocket className="w-4 h-4 text-emerald-400" />,
      badge: '100% CI',
      onSelect: () => {
        onOpenEngineeringModal();
        onClose();
      },
    },
    {
      id: 'sys-alert-thresholds',
      title: 'Configure Custom Stream Thresholds & Browser Alerts',
      description: 'Tune quantitative trigger limits on turnaround SLA, hydraulic PSI, and CPU saturation.',
      category: 'System & Auditing',
      icon: <Bell className="w-4 h-4 text-cyan-400" />,
      badge: 'ALERTS',
      onSelect: () => {
        onNavigateTab('predictive-bi');
        onClose();
      },
    },
  ], [
    isPipelineRunning,
    onNavigateTab,
    onTriggerPipeline,
    onOpenTour,
    onOpenChaosHarness,
    onExportPdf,
    onOpenAuditModal,
    onOpenLatencyMonitor,
    onOpenEngineeringModal,
    onClose,
  ]);

  // Filter commands based on search + matching pipeline logs and activity records
  const filteredCommands = useMemo(() => {
    let result = [...commands];

    // If user typed a search query, search through pipeline logs and historical activity records
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();

      // Filter standard commands
      const matchedCommands = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );

      // Search matching pipeline stages / logs
      const matchedPipelineStages: CommandItem[] = [];
      if (pipelineStatus?.stages) {
        pipelineStatus.stages.forEach((stage, idx) => {
          if (stage.name.toLowerCase().includes(q) || stage.status.toLowerCase().includes(q)) {
            matchedPipelineStages.push({
              id: `log-stage-${idx}`,
              title: `Pipeline Log: ${stage.name}`,
              description: `Status: ${stage.status.toUpperCase()} · Execution Time: ${stage.durationMs}ms`,
              category: 'Actions & Pipelines',
              icon: <Terminal className="w-4 h-4 text-cyan-400" />,
              badge: stage.status.toUpperCase(),
              onSelect: () => {
                onNavigateTab('pipelines');
                onClose();
              },
            });
          }
        });
      }

      // Search matching historical activity records
      const matchedActivityLogs: CommandItem[] = [];
      if (activityLogs && activityLogs.length > 0) {
        activityLogs.forEach((log) => {
          if (
            log.action.toLowerCase().includes(q) ||
            log.user.toLowerCase().includes(q) ||
            log.category.toLowerCase().includes(q)
          ) {
            matchedActivityLogs.push({
              id: `log-act-${log.id}`,
              title: `Activity Record: ${log.action}`,
              description: `${log.timestamp} by ${log.user} · Category: ${log.category}`,
              category: 'System & Auditing',
              icon: <History className="w-4 h-4 text-amber-400" />,
              badge: log.category.toUpperCase(),
              onSelect: () => {
                onNavigateTab('predictive-bi');
                onClose();
              },
            });
          }
        });
      }

      return [...matchedCommands, ...matchedPipelineStages, ...matchedActivityLogs];
    }

    return result;
  }, [commands, searchQuery, pipelineStatus, activityLogs, onNavigateTab, onClose]);

  // Group commands by category
  const categories = useMemo(() => {
    const cats: { name: string; items: CommandItem[] }[] = [];
    const order: CommandItem['category'][] = ['Modules', 'Actions & Pipelines', 'Exports & PDF', 'System & Auditing'];
    
    order.forEach((catName) => {
      const items = filteredCommands.filter((c) => c.category === catName);
      if (items.length > 0) {
        cats.push({ name: catName, items });
      }
    });
    return cats;
  }, [filteredCommands]);

  // Keyboard Navigation: Up, Down, Enter, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].onSelect();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Keep selected index valid
  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(0);
    }
  }, [filteredCommands.length, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-950 border border-cyan-500/50 rounded-2xl shadow-2xl shadow-cyan-950/50 overflow-hidden font-mono flex flex-col max-h-[80vh] border-t-2 border-t-cyan-400"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/60">
          <Search className="w-5 h-5 text-cyan-400 shrink-0 mr-3 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search modules, settings, or PDF exports..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Filter Category Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-900 bg-slate-950/70 overflow-x-auto text-[11px]">
          <span className="text-slate-500 text-[10px] uppercase font-bold mr-1">Filter:</span>
          {['All', 'Modules', 'Actions & Pipelines', 'Exports & PDF', 'System & Auditing'].map((cat) => {
            const isMatch = (cat === 'All' && !searchQuery) || searchQuery.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => {
                  if (cat === 'All') setSearchQuery('');
                  else setSearchQuery(cat);
                }}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer whitespace-nowrap border ${
                  isMatch
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'Exports & PDF' ? '📄 Exports & PDF' : cat}
              </button>
            );
          })}
        </div>

        {/* Command Items List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2.5 space-y-4 max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-800"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-sans text-xs">
              <Command className="w-8 h-8 mx-auto mb-2 text-slate-700" />
              <span>No commands or modules matched "{searchQuery}"</span>
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.name}>
                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {category.name}
                </div>
                <div className="space-y-1 mt-1">
                  {category.items.map((cmd) => {
                    const globalIdx = filteredCommands.findIndex((c) => c.id === cmd.id);
                    const isSelected = globalIdx === selectedIndex;

                    return (
                      <div
                        key={cmd.id}
                        onClick={cmd.onSelect}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-cyan-950/80 border-cyan-500/60 shadow-md text-white'
                            : 'bg-slate-900/40 border-transparent hover:bg-slate-900/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-1.5 rounded-lg shrink-0 ${
                              isSelected ? 'bg-cyan-500/20 border border-cyan-500/40' : 'bg-slate-950 border border-slate-800'
                            }`}
                          >
                            {cmd.icon}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs truncate text-white">{cmd.title}</span>
                              {cmd.badge && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                                  {cmd.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-sans truncate mt-0.5">
                              {cmd.description}
                            </p>
                          </div>
                        </div>

                        {cmd.shortcut && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800 shrink-0">
                            {cmd.shortcut}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2.5 border-t border-slate-900 bg-slate-950/90 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-300">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-300">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-300">↵</kbd>
              <span>to execute</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-300">esc</kbd>
              <span>to close</span>
            </span>
          </div>

          <div className="text-slate-400 flex items-center gap-1.5">
            <Command className="w-3 h-3 text-cyan-400" />
            <span>AxiomBI Command Center</span>
          </div>
        </div>
      </div>
    </div>
  );
};
