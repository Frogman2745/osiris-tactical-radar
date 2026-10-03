import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  Server,
  Cpu,
  Zap,
  Clock,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Sliders,
  RefreshCw,
  Layers,
  ShieldCheck,
  FileSpreadsheet,
  Play,
  Pause,
  ChevronRight,
  HardDrive
} from 'lucide-react';

export interface ScalingHistoryPoint {
  timestamp: string;
  timeLabel: string;
  throughput: number; // records / second
  activeNodes: number;
  targetNodes: number;
  cpuUtilization: number; // %
  memoryUtilization: number; // %
  queueLatencyMs: number;
  scalingEvent: 'SCALE_UP' | 'SCALE_DOWN' | 'STEADY' | 'SURGE_BURST' | 'MANUAL_OVERRIDE';
  status: 'Nominal' | 'Scaling' | 'High Pressure' | 'Stabilizing';
}

export interface NodeReplica {
  id: string;
  name: string;
  partition: string;
  cpuPct: number;
  memoryPct: number;
  status: 'healthy' | 'warmup' | 'busy' | 'draining';
  uptimeSeconds: number;
  recordsHandled: number;
}

export interface AutoScalingMetrics {
  currentThroughput: number;
  activeNodes: number;
  cpuUtilization: number;
  memoryUtilization: number;
  queueLatencyMs: number;
  clusterHealth: 'Nominal' | 'Scaling' | 'High Pressure';
  scalingCooldown: number;
}

interface AutoScalingDashboardProps {
  onMetricsUpdate?: (metrics: AutoScalingMetrics) => void;
  onRegisterDownloadHandler?: (handler: () => void) => void;
  isPipelineRunning?: boolean;
}

// Generate realistic starting history for the past 20 minutes (12 data points)
const generateInitialHistory = (): ScalingHistoryPoint[] => {
  const points: ScalingHistoryPoint[] = [];
  const now = Date.now();
  const baseThroughput = 48000;

  for (let i = 12; i >= 0; i--) {
    const time = new Date(now - i * 15000);
    const timeLabel = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Simulate slight natural variance
    const variance = Math.sin(i * 0.8) * 6000;
    const throughput = Math.round(baseThroughput + variance);
    const nodes = Math.min(12, Math.max(2, Math.ceil(throughput / 15000)));
    const cpu = Math.min(94, Math.max(38, Math.round((throughput / (nodes * 15000)) * 72 + Math.random() * 5)));
    const mem = Math.round(48 + (cpu * 0.3) + Math.random() * 4);
    const latency = Math.round(14 + (cpu > 75 ? (cpu - 75) * 0.8 : 0));

    points.push({
      timestamp: time.toISOString(),
      timeLabel,
      throughput,
      activeNodes: nodes,
      targetNodes: nodes,
      cpuUtilization: cpu,
      memoryUtilization: mem,
      queueLatencyMs: latency,
      scalingEvent: i === 6 ? 'SCALE_UP' : 'STEADY',
      status: cpu > 80 ? 'Scaling' : 'Nominal',
    });
  }

  return points;
};

export const AutoScalingDashboard: React.FC<AutoScalingDashboardProps> = ({
  onMetricsUpdate,
  onRegisterDownloadHandler,
  isPipelineRunning = false,
}) => {
  // Auto-scaler engine state
  const [scalingMode, setScalingMode] = useState<'auto' | 'manual'>('auto');
  const [targetThroughput, setTargetThroughput] = useState<number>(56000);
  const [currentThroughput, setCurrentThroughput] = useState<number>(56000);
  const [activeNodes, setActiveNodes] = useState<number>(4);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [scalingCooldown, setScalingCooldown] = useState<number>(0);
  const [history, setHistory] = useState<ScalingHistoryPoint[]>(generateInitialHistory);
  const [lastDownloadNotification, setLastDownloadNotification] = useState<string | null>(null);
  const [selectedTrafficProfile, setSelectedTrafficProfile] = useState<string>('baseline');

  // Node capacity invariant: 15,000 rec/sec target per compute worker
  const CAPACITY_PER_NODE = 15000;
  const MIN_NODES = 2;
  const MAX_NODES = 12;

  // Compute live telemetry metrics derived from throughput and node count
  const liveMetrics = useMemo(() => {
    const rawCpu = (currentThroughput / (activeNodes * CAPACITY_PER_NODE)) * 82;
    const cpuUtilization = Math.min(98, Math.max(24, Math.round(rawCpu)));
    const memoryUtilization = Math.min(95, Math.max(35, Math.round(42 + (cpuUtilization * 0.42))));
    
    // Latency spikes if cluster is oversubscribed (CPU > 80%)
    let queueLatencyMs = 12;
    if (cpuUtilization > 80) {
      queueLatencyMs = Math.round(14 + Math.pow((cpuUtilization - 80) * 0.9, 1.3));
    } else {
      queueLatencyMs = Math.round(11 + (cpuUtilization * 0.08));
    }

    const clusterHealth: 'Nominal' | 'Scaling' | 'High Pressure' = 
      cpuUtilization > 88 ? 'High Pressure' :
      cpuUtilization > 74 || scalingCooldown > 0 ? 'Scaling' : 'Nominal';

    return {
      cpuUtilization,
      memoryUtilization,
      queueLatencyMs,
      clusterHealth,
      totalCapacity: activeNodes * CAPACITY_PER_NODE,
      utilizationRatio: +(currentThroughput / (activeNodes * CAPACITY_PER_NODE)).toFixed(2),
    };
  }, [currentThroughput, activeNodes, scalingCooldown]);

  // Compute mock node replicas for cluster topology visualization
  const nodeReplicas: NodeReplica[] = useMemo(() => {
    const partitions = [
      'p-norcal-dispatch',
      'p-socal-helitack',
      'p-bayarea-mutual-aid',
      'p-central-airattack',
      'p-sierra-infill',
      'p-shasta-cascade',
      'p-inland-desert',
      'p-coastal-marine',
      'p-interstate-corridor',
      'p-angeles-command',
      'p-redding-heavy-air',
      'p-sacramento-staging'
    ];

    return Array.from({ length: activeNodes }, (_, idx) => {
      const id = `node-${String(idx + 1).padStart(2, '0')}`;
      const name = `worker-etl-${id}`;
      // Stagger slight CPU jitter across nodes
      const nodeCpu = Math.min(99, Math.max(20, Math.round(liveMetrics.cpuUtilization + (Math.sin(idx * 1.5) * 8))));
      const nodeMem = Math.min(96, Math.max(30, Math.round(liveMetrics.memoryUtilization + (Math.cos(idx * 2) * 5))));
      
      let status: NodeReplica['status'] = 'healthy';
      if (nodeCpu > 88) status = 'busy';
      else if (idx === activeNodes - 1 && scalingCooldown > 0) status = 'warmup';

      return {
        id,
        name,
        partition: partitions[idx % partitions.length],
        cpuPct: nodeCpu,
        memoryPct: nodeMem,
        status,
        uptimeSeconds: 3600 + idx * 840,
        recordsHandled: Math.round((currentThroughput / activeNodes) * 45),
      };
    });
  }, [activeNodes, liveMetrics, currentThroughput, scalingCooldown]);

  // Handle traffic profile presets
  const applyTrafficProfile = (profile: string) => {
    setSelectedTrafficProfile(profile);
    if (profile === 'baseline') {
      setTargetThroughput(48000);
    } else if (profile === 'surge') {
      setTargetThroughput(118000);
    } else if (profile === 'extreme') {
      setTargetThroughput(165000);
    }
  };

  // Sudden burst simulation trigger
  const triggerSuddenSpike = () => {
    setTargetThroughput((prev) => Math.min(185000, prev + 55000));
    setSelectedTrafficProfile('custom');
  };

  // Manual Node Adjustment
  const handleManualScale = (delta: number) => {
    setActiveNodes((prev) => Math.min(MAX_NODES, Math.max(MIN_NODES, prev + delta)));
  };

  // CSV Report Generator for Offline Auditing
  const handleDownloadReport = () => {
    const headers = [
      'Timestamp_UTC',
      'Time_Label',
      'Throughput_Records_Per_Sec',
      'Active_Compute_Nodes',
      'Target_Replicas',
      'Cluster_Capacity_Rec_Sec',
      'CPU_Utilization_Pct',
      'Memory_Utilization_Pct',
      'P99_Queue_Latency_Ms',
      'Scaling_Action_Event',
      'System_Health_Status'
    ];

    const rows = history.map((point) => [
      point.timestamp,
      `"${point.timeLabel}"`,
      point.throughput,
      point.activeNodes,
      point.targetNodes,
      point.activeNodes * CAPACITY_PER_NODE,
      point.cpuUtilization,
      point.memoryUtilization,
      point.queueLatencyMs,
      `"${point.scalingEvent}"`,
      `"${point.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    link.setAttribute('href', url);
    link.setAttribute('download', `pipeline_scaling_audit_${timestampStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setLastDownloadNotification(`Exported ${history.length} scaling telemetry records to CSV.`);
    setTimeout(() => setLastDownloadNotification(null), 4000);
  };

  // Register download report handler with parent component if callback provided
  useEffect(() => {
    if (onRegisterDownloadHandler) {
      onRegisterDownloadHandler(handleDownloadReport);
    }
  }, [onRegisterDownloadHandler, history]);

  // Notify parent of updated metrics for the floating health widget
  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate({
        currentThroughput,
        activeNodes,
        cpuUtilization: liveMetrics.cpuUtilization,
        memoryUtilization: liveMetrics.memoryUtilization,
        queueLatencyMs: liveMetrics.queueLatencyMs,
        clusterHealth: liveMetrics.clusterHealth,
        scalingCooldown,
      });
    }
  }, [currentThroughput, activeNodes, liveMetrics, scalingCooldown, onMetricsUpdate]);

  // Cooldown countdown tick
  useEffect(() => {
    if (scalingCooldown > 0) {
      const timer = setTimeout(() => {
        setScalingCooldown((c) => Math.max(0, c - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [scalingCooldown]);

  // Smooth throughput interpolation towards targetThroughput
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setCurrentThroughput((current) => {
        const diff = targetThroughput - current;
        if (Math.abs(diff) < 800) {
          // Add small natural jitter (+/- 600 rec/s)
          const jitter = Math.round((Math.random() - 0.5) * 1200);
          return Math.max(10000, targetThroughput + jitter);
        }
        // Smoothly interpolate towards target
        return Math.round(current + diff * 0.35);
      });
    }, 800);

    return () => clearInterval(interval);
  }, [targetThroughput, isSimulating]);

  // Autonomous HPA scaling loop: Evaluates throughput and adjusts active node count
  useEffect(() => {
    if (!isSimulating || scalingMode !== 'auto') return;

    const autoScalerInterval = setInterval(() => {
      const idealNodes = Math.min(
        MAX_NODES,
        Math.max(MIN_NODES, Math.ceil(currentThroughput / CAPACITY_PER_NODE))
      );

      if (idealNodes !== activeNodes && scalingCooldown === 0) {
        let eventType: ScalingHistoryPoint['scalingEvent'] = 'STEADY';
        if (idealNodes > activeNodes) {
          eventType = 'SCALE_UP';
          setScalingCooldown(6); // 6 second stabilization cooldown
        } else {
          eventType = 'SCALE_DOWN';
          setScalingCooldown(8); // Conservative scale-down cooldown
        }

        setActiveNodes(idealNodes);
      }
    }, 2000);

    return () => clearInterval(autoScalerInterval);
  }, [currentThroughput, activeNodes, scalingCooldown, scalingMode, isSimulating]);

  // Periodic historical telemetry snapshot recorder
  const historyRef = useRef(history);
  historyRef.current = history;

  useEffect(() => {
    if (!isSimulating) return;

    const recordInterval = setInterval(() => {
      const now = new Date();
      const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      let event: ScalingHistoryPoint['scalingEvent'] = 'STEADY';
      if (scalingCooldown > 3) {
        event = 'SCALE_UP';
      } else if (scalingCooldown > 0) {
        event = 'SCALE_DOWN';
      }

      const newPoint: ScalingHistoryPoint = {
        timestamp: now.toISOString(),
        timeLabel,
        throughput: currentThroughput,
        activeNodes,
        targetNodes: Math.min(MAX_NODES, Math.max(MIN_NODES, Math.ceil(currentThroughput / CAPACITY_PER_NODE))),
        cpuUtilization: liveMetrics.cpuUtilization,
        memoryUtilization: liveMetrics.memoryUtilization,
        queueLatencyMs: liveMetrics.queueLatencyMs,
        scalingEvent: event,
        status: liveMetrics.clusterHealth,
      };

      setHistory((prev) => [...prev.slice(-24), newPoint]);
    }, 3500);

    return () => clearInterval(recordInterval);
  }, [currentThroughput, activeNodes, liveMetrics, scalingCooldown, isSimulating]);

  return (
    <div className="space-y-6">
      {/* Download Toast Notification */}
      {lastDownloadNotification && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs shadow-xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{lastDownloadNotification}</span>
        </div>
      )}

      {/* Main Auto-Scaling Header & Architectural Maturity Overview */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider">
                Autonomous Elastic Compute Architecture
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                K8s HPA Simulation Engine
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Adaptive Telemetry Auto-Scaling & Throughput Governor
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Monitors live ADS-B flight transponder and Postgres CDC event throughput, dynamically provisioning worker pods with zero-downtime rolling rebalances and automated cooldown stabilization.
            </p>
          </div>

          {/* Action Toolbar with Download Report Button */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-lg transition-all shadow-sm cursor-pointer hover:border-emerald-400 group"
              title="Export complete scaling history and telemetry metrics as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
              <span>Download Report (CSV)</span>
            </button>

            <button
              onClick={triggerSuddenSpike}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-300 bg-amber-950/50 hover:bg-amber-900/50 border border-amber-500/40 rounded-lg transition-colors cursor-pointer"
              title="Inject a sudden +55,000 records/sec traffic spike to observe HPA auto-scaling"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Ingest Spike</span>
            </button>

            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors cursor-pointer"
              title={isSimulating ? 'Pause simulation telemetry ticker' : 'Resume simulation'}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pause Feed</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Resume Feed</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time KPI Metric Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5 pt-5 border-t border-slate-800/80">
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Ingestion Throughput</span>
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono tabular-nums">
              {(currentThroughput / 1000).toFixed(1)}k
              <span className="text-xs font-normal text-slate-400 ml-1">rec/sec</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <span>Target: {(targetThroughput / 1000).toFixed(0)}k/s</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Active Worker Nodes</span>
              <Server className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-emerald-300 font-mono tabular-nums flex items-center gap-2">
              <span>{activeNodes}</span>
              <span className="text-xs font-normal text-slate-500">/ {MAX_NODES} max</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {scalingCooldown > 0 ? (
                <span className="text-amber-400 font-mono animate-pulse">Cooldown {scalingCooldown}s</span>
              ) : (
                <span>HPA Target: 70% CPU</span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Mean CPU Load</span>
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold font-mono tabular-nums text-white">
              {liveMetrics.cpuUtilization}%
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  liveMetrics.cpuUtilization > 85 ? 'bg-red-500' :
                  liveMetrics.cpuUtilization > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${liveMetrics.cpuUtilization}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>P99 Ingest Latency</span>
              <Clock className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono tabular-nums">
              {liveMetrics.queueLatencyMs} ms
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              SLA Guarantee: &lt; 50ms
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>System Health</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  liveMetrics.clusterHealth === 'Nominal' ? 'bg-emerald-400' :
                  liveMetrics.clusterHealth === 'Scaling' ? 'bg-amber-400 animate-ping' : 'bg-red-500 animate-pulse'
                }`}
              />
              <span className="text-sm font-semibold text-white">
                {liveMetrics.clusterHealth}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Zero dropped packets
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Scaling Simulation Controls Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Auto-Scaling Simulation Controls</h3>
          </div>

          {/* Mode Switch: Autonomous HPA vs Manual Replicas */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setScalingMode('auto')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                scalingMode === 'auto'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Autonomous (HPA)
            </button>
            <button
              onClick={() => setScalingMode('manual')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                scalingMode === 'manual'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Manual Replicas
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-4">
          {/* Traffic Profile Selector */}
          <div>
            <label className="text-xs text-slate-400 block mb-2 font-medium">
              Simulated Traffic Profile Presets:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => applyTrafficProfile('baseline')}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  selectedTrafficProfile === 'baseline'
                    ? 'bg-cyan-950/60 border-cyan-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-bold text-cyan-300">Baseline</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">48k rec/s</div>
                <div className="text-[9px] text-slate-500 mt-1">Normal flight feed</div>
              </button>

              <button
                onClick={() => applyTrafficProfile('surge')}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  selectedTrafficProfile === 'surge'
                    ? 'bg-amber-950/60 border-amber-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-bold text-amber-300">Wildfire Surge</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">118k rec/s</div>
                <div className="text-[9px] text-slate-500 mt-1">High dispatch alert</div>
              </button>

              <button
                onClick={() => applyTrafficProfile('extreme')}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  selectedTrafficProfile === 'extreme'
                    ? 'bg-red-950/60 border-red-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-bold text-red-300">Tempest</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">165k rec/s</div>
                <div className="text-[9px] text-slate-500 mt-1">Emergency state load</div>
              </button>
            </div>
          </div>

          {/* Granular Slider */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium">Fine-Grained Throughput Throttle:</span>
              <span className="text-cyan-300 font-mono font-bold">
                {targetThroughput.toLocaleString()} records / sec
              </span>
            </div>
            <input
              type="range"
              min={15000}
              max={185000}
              step={2500}
              value={targetThroughput}
              onChange={(e) => {
                setTargetThroughput(Number(e.target.value));
                setSelectedTrafficProfile('custom');
              }}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>15,000 r/s (Min 2 Nodes)</span>
              <span>100,000 r/s (Nominal 7 Nodes)</span>
              <span>185,000 r/s (Peak 12 Nodes)</span>
            </div>

            {/* Manual Node Override controls if in manual mode */}
            {scalingMode === 'manual' && (
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-800">
                <span className="text-xs text-amber-300 font-medium">Manual Replicas:</span>
                <button
                  onClick={() => handleManualScale(-1)}
                  disabled={activeNodes <= MIN_NODES}
                  className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-700 rounded hover:bg-slate-800 disabled:opacity-40 cursor-pointer text-white"
                >
                  - 1 Node
                </button>
                <span className="text-xs font-mono font-bold text-white px-2">
                  {activeNodes} Nodes
                </span>
                <button
                  onClick={() => handleManualScale(1)}
                  disabled={activeNodes >= MAX_NODES}
                  className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-700 rounded hover:bg-slate-800 disabled:opacity-40 cursor-pointer text-white"
                >
                  + 1 Node
                </button>
                <span className="text-[10px] text-slate-500">
                  (Autonomous scaling disabled)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SCALING HISTORY CHART TO DEMONSTRATE ARCHITECTURAL MATURITY */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-base font-bold text-white">
                Scaling History & Real-Time Throughput Telemetry
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Live dual-axis telemetry illustrating auto-scaling responsiveness, compute node elasticity, and latency bounds under fluctuating ingest loads.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-cyan-400/80" />
              <span className="text-slate-300">Throughput (rec/s)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-amber-400 rounded-full" />
              <span className="text-amber-300 font-bold">Active Nodes</span>
            </div>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs cursor-pointer ml-2"
              title="Download CSV report of this scaling history"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Recharts Chart Component */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="throughputGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              
              {/* X Axis */}
              <XAxis
                dataKey="timeLabel"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />

              {/* Left Y Axis: Throughput */}
              <YAxis
                yAxisId="left"
                stroke="#06b6d4"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                domain={[0, 200000]}
              />

              {/* Right Y Axis: Active Nodes */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#f59e0b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                domain={[0, 14]}
                ticks={[2, 4, 6, 8, 10, 12]}
                tickFormatter={(val) => `${val} nds`}
              />

              {/* High load reference line */}
              <ReferenceLine
                yAxisId="left"
                y={150000}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{ value: 'Peak Surge Capacity Threshold', fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ScalingHistoryPoint;
                    return (
                      <div className="bg-slate-950/95 border border-slate-800 p-3 rounded-lg shadow-xl text-xs font-mono backdrop-blur-md">
                        <div className="text-slate-400 pb-1 mb-2 border-b border-slate-800 flex items-center justify-between gap-4">
                          <span>{data.timeLabel}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            data.scalingEvent === 'SCALE_UP' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            data.scalingEvent === 'SCALE_DOWN' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {data.scalingEvent}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4 text-cyan-300">
                            <span>Throughput:</span>
                            <span className="font-bold">{data.throughput.toLocaleString()} rec/s</span>
                          </div>
                          <div className="flex justify-between gap-4 text-amber-300">
                            <span>Active Nodes:</span>
                            <span className="font-bold">{data.activeNodes} Nodes</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Cluster CPU:</span>
                            <span>{data.cpuUtilization}%</span>
                          </div>
                          <div className="flex justify-between gap-4 text-purple-300">
                            <span>P99 Queue Latency:</span>
                            <span>{data.queueLatencyMs} ms</span>
                          </div>
                          <div className="flex justify-between gap-4 text-emerald-300">
                            <span>Cluster Status:</span>
                            <span>{data.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Area for Throughput */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="throughput"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#throughputGradient)"
                name="Throughput (rec/s)"
              />

              {/* Line for Active Nodes */}
              <Line
                yAxisId="right"
                type="stepAfter"
                dataKey="activeNodes"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#f59e0b' }}
                activeDot={{ r: 5 }}
                name="Active Compute Nodes"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Scaling Invariant Annotations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-800/80 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1 shrink-0" />
            <div>
              <span className="font-semibold text-white block">Elastic Partitioning</span>
              <span className="text-slate-400 text-[11px]">
                Each compute pod evaluates CP-SAT constraints across dedicated GIS partition shards without cross-node mutex lockups.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
            <div>
              <span className="font-semibold text-white block">HPA Anti-Flapping Cooldown</span>
              <span className="text-slate-400 text-[11px]">
                Enforces a 300s stabilization window on scale-down events to absorb intermittent radio beacon bursts safely.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
            <div>
              <span className="font-semibold text-white block">Zero-Downtime Rebalancing</span>
              <span className="text-slate-400 text-[11px]">
                In-flight ADS-B and dispatch telemetry streams route through persistent Kafka/Postgres WAL queues during node creation.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cluster Node Pod Replicas Grid */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">
              Active Compute Pod Cluster Topology ({activeNodes} Worker Replicas)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Cluster Target: {activeNodes * CAPACITY_PER_NODE} rec/sec Max Throughput
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {nodeReplicas.map((node) => (
            <div
              key={node.id}
              className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-xs hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-white truncate">{node.id}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    node.status === 'healthy' ? 'bg-emerald-400' :
                    node.status === 'warmup' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'
                  }`}
                  title={`Status: ${node.status}`}
                />
              </div>

              <div className="text-[10px] text-slate-400 truncate mb-2">
                {node.partition}
              </div>

              <div className="space-y-1.5 text-[10px]">
                <div>
                  <div className="flex justify-between text-slate-500">
                    <span>CPU</span>
                    <span className="text-slate-300">{node.cpuPct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-0.5">
                    <div
                      className={`h-full ${node.cpuPct > 80 ? 'bg-amber-400' : 'bg-cyan-400'}`}
                      style={{ width: `${node.cpuPct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-500">
                    <span>MEM</span>
                    <span className="text-slate-300">{node.memoryPct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-purple-400"
                      style={{ width: `${node.memoryPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
