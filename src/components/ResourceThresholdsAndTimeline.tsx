import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Dot,
} from 'recharts';
import {
  BellRing,
  AlertTriangle,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Clock,
  Zap,
  Activity,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  Flame,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { PipelineRunStatus } from '../types';

export interface PipelineExecutionHistoryPoint {
  runId: string;
  runNumber: number;
  timestamp: string;
  timeLabel: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  successScore: number; // 100 for success, 0 for failure, 65 for warning
  durationMs: number;
  rowsProcessed: number;
  anomaliesDetected: number;
  avgCpuPct: number;
  avgRamPct: number;
  failureReason?: string;
}

export interface ResourceThresholdConfig {
  enabled: boolean;
  cpuThresholdPct: number;
  ramThresholdPct: number;
  durationSeconds: number; // e.g. 30 seconds
  alertSoundEnabled: boolean;
  autoThrottleOnBreach: boolean;
  notifyWebhook: boolean;
}

interface ResourceThresholdsAndTimelineProps {
  pipelineStatus: PipelineRunStatus;
  isPipelineRunning: boolean;
  onAddActivityLog?: (action: string) => void;
  onTriggerAutoThrottle?: () => void;
  isPredictiveScalingEnabled?: boolean;
  onTogglePredictiveScaling?: (enabled: boolean) => void;
  predictiveStageAllocations?: Record<string, { cpuLimitPct: number; ramLimitMb: number; rationale: string; speedupFactor: number }>;
}

export const ResourceThresholdsAndTimeline: React.FC<ResourceThresholdsAndTimelineProps> = ({
  pipelineStatus,
  isPipelineRunning,
  onAddActivityLog,
  onTriggerAutoThrottle,
  isPredictiveScalingEnabled = false,
  onTogglePredictiveScaling,
  predictiveStageAllocations = {},
}) => {
  // 1. Configurable Resource Thresholds
  const [config, setConfig] = useState<ResourceThresholdConfig>({
    enabled: true,
    cpuThresholdPct: 85,
    ramThresholdPct: 85,
    durationSeconds: 30,
    alertSoundEnabled: true,
    autoThrottleOnBreach: true,
    notifyWebhook: true,
  });

  // Current live resource simulation
  const [currentCpu, setCurrentCpu] = useState<number>(64);
  const [currentRam, setCurrentRam] = useState<number>(58);
  const [cpuBreachSeconds, setCpuBreachSeconds] = useState<number>(0);
  const [ramBreachSeconds, setRamBreachSeconds] = useState<number>(0);
  const [activeAlerts, setActiveAlerts] = useState<Array<{
    id: string;
    timestamp: string;
    type: 'CPU' | 'RAM';
    value: number;
    threshold: number;
    duration: number;
    acknowledged: boolean;
  }>>([]);

  // Simulation mode: allows tester to force high CPU/RAM > 85% to test the 30-second timer
  const [forceHighPressure, setForceHighPressure] = useState<boolean>(false);

  // 2. Historical Execution Runs (Last 10 Runs)
  const [executionHistory, setExecutionHistory] = useState<PipelineExecutionHistoryPoint[]>(() => {
    const runs: PipelineExecutionHistoryPoint[] = [
      {
        runId: 'RUN-1091',
        runNumber: 1,
        timestamp: '10:05 AM',
        timeLabel: 'Run #1',
        status: 'SUCCESS',
        successScore: 100,
        durationMs: 1420,
        rowsProcessed: 478200,
        anomaliesDetected: 1,
        avgCpuPct: 54,
        avgRamPct: 48,
      },
      {
        runId: 'RUN-1092',
        runNumber: 2,
        timestamp: '10:12 AM',
        timeLabel: 'Run #2',
        status: 'SUCCESS',
        successScore: 100,
        durationMs: 1380,
        rowsProcessed: 481100,
        anomaliesDetected: 0,
        avgCpuPct: 58,
        avgRamPct: 50,
      },
      {
        runId: 'RUN-1093',
        runNumber: 3,
        timestamp: '10:20 AM',
        timeLabel: 'Run #3',
        status: 'FAILED',
        successScore: 0,
        durationMs: 980,
        rowsProcessed: 120400,
        anomaliesDetected: 4,
        avgCpuPct: 91,
        avgRamPct: 88,
        failureReason: 'CDC Postgres replication slot timeout during Shasta perimeter surge',
      },
      {
        runId: 'RUN-1094',
        runNumber: 4,
        timestamp: '10:28 AM',
        timeLabel: 'Run #4',
        status: 'SUCCESS',
        successScore: 100,
        durationMs: 1540,
        rowsProcessed: 489300,
        anomaliesDetected: 2,
        avgCpuPct: 62,
        avgRamPct: 54,
      },
      {
        runId: 'RUN-1095',
        runNumber: 5,
        timestamp: '10:35 AM',
        timeLabel: 'Run #5',
        status: 'SUCCESS',
        successScore: 100,
        durationMs: 1410,
        rowsProcessed: 482000,
        anomaliesDetected: 1,
        avgCpuPct: 60,
        avgRamPct: 53,
      },
      {
        runId: 'RUN-1096',
        runNumber: 6,
        timestamp: '10:41 AM',
        timeLabel: 'Run #6',
        status: 'WARNING',
        successScore: 65,
        durationMs: 1890,
        rowsProcessed: 484000,
        anomaliesDetected: 5,
        avgCpuPct: 79,
        avgRamPct: 81,
        failureReason: 'High flight-hour telemetry drift on Tanker 118 triggered fallback heuristic',
      },
      {
        runId: 'RUN-1097',
        runNumber: 7,
        timestamp: '10:48 AM',
        timeLabel: 'Run #7',
        status: 'SUCCESS',
        successScore: 100,
        durationMs: 1390,
        rowsProcessed: 480500,
        anomaliesDetected: 0,
        avgCpuPct: 56,
        avgRamPct: 49,
      },
      {
        runId: 'RUN-1098',
        runNumber: 8,
        timestamp: '10:55 AM',
        timeLabel: 'Run #8',
        status: 'SUCCESS',
        successScore: 100,
        durationMs: 1360,
        rowsProcessed: 483100,
        anomaliesDetected: 2,
        avgCpuPct: 61,
        avgRamPct: 52,
      },
      {
        runId: 'RUN-1099',
        runNumber: 9,
        timestamp: '11:02 AM',
        timeLabel: 'Run #9',
        status: 'SUCCESS',
        successScore: 100,
        durationMs: 1400,
        rowsProcessed: 482900,
        anomaliesDetected: 1,
        avgCpuPct: 59,
        avgRamPct: 51,
      },
      {
        runId: 'RUN-1100',
        runNumber: 10,
        timestamp: '11:10 AM',
        timeLabel: 'Run #10 (Latest)',
        status: 'SUCCESS',
        successScore: 100,
        durationMs: 1350,
        rowsProcessed: 485000,
        anomaliesDetected: 2,
        avgCpuPct: 62,
        avgRamPct: 55,
      },
    ];
    return runs;
  });

  // Track new runs when pipeline completes
  useEffect(() => {
    if (pipelineStatus.state === 'idle' && pipelineStatus.rowsProcessed > 0) {
      setExecutionHistory((prev) => {
        const last = prev[prev.length - 1];
        const nextNum = (last?.runNumber || 10) + 1;
        const newRun: PipelineExecutionHistoryPoint = {
          runId: `RUN-${1090 + nextNum}`,
          runNumber: nextNum,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeLabel: `Run #${nextNum}`,
          status: pipelineStatus.anomaliesFound > 3 ? 'WARNING' : 'SUCCESS',
          successScore: pipelineStatus.anomaliesFound > 3 ? 65 : 100,
          durationMs: pipelineStatus.durationMs || 1420,
          rowsProcessed: pipelineStatus.rowsProcessed,
          anomaliesDetected: pipelineStatus.anomaliesFound,
          avgCpuPct: Math.round(55 + Math.random() * 15),
          avgRamPct: Math.round(50 + Math.random() * 12),
        };
        // Keep strictly last 10 runs
        return [...prev.slice(1), newRun];
      });
    }
  }, [pipelineStatus.lastRunAt]);

  // Live timer tick for evaluating resource threshold breaches (CPU/RAM > 85% for > 30s)
  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate resource fluctuation
      let cpu: number;
      let ram: number;

      if (forceHighPressure) {
        cpu = Math.min(99, Math.round(88 + Math.random() * 9));
        ram = Math.min(96, Math.round(87 + Math.random() * 8));
      } else if (isPipelineRunning) {
        cpu = Math.min(84, Math.round(72 + Math.random() * 10));
        ram = Math.min(82, Math.round(68 + Math.random() * 8));
      } else {
        cpu = Math.max(35, Math.round(58 + Math.sin(Date.now() / 8000) * 12));
        ram = Math.max(40, Math.round(52 + Math.cos(Date.now() / 9000) * 8));
      }

      setCurrentCpu(cpu);
      setCurrentRam(ram);

      if (!config.enabled) return;

      // Evaluate CPU breach duration
      if (cpu >= config.cpuThresholdPct) {
        setCpuBreachSeconds((prev) => {
          const next = prev + 2;
          if (next >= config.durationSeconds && prev < config.durationSeconds) {
            // Trigger threshold alert
            const alert = {
              id: `alert-cpu-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              type: 'CPU' as const,
              value: cpu,
              threshold: config.cpuThresholdPct,
              duration: config.durationSeconds,
              acknowledged: false,
            };
            setActiveAlerts((a) => [alert, ...a.slice(0, 5)]);
            onAddActivityLog?.(
              `🚨 HIGH RESOURCE BREACH: CPU saturation at ${cpu}% exceeded ${config.cpuThresholdPct}% threshold for ${config.durationSeconds}s!`
            );
            if (config.autoThrottleOnBreach) {
              onTriggerAutoThrottle?.();
            }
          }
          return next;
        });
      } else {
        setCpuBreachSeconds(0);
      }

      // Evaluate RAM breach duration
      if (ram >= config.ramThresholdPct) {
        setRamBreachSeconds((prev) => {
          const next = prev + 2;
          if (next >= config.durationSeconds && prev < config.durationSeconds) {
            const alert = {
              id: `alert-ram-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              type: 'RAM' as const,
              value: ram,
              threshold: config.ramThresholdPct,
              duration: config.durationSeconds,
              acknowledged: false,
            };
            setActiveAlerts((a) => [alert, ...a.slice(0, 5)]);
            onAddActivityLog?.(
              `🚨 HIGH RESOURCE BREACH: RAM heap allocation at ${ram}% exceeded ${config.ramThresholdPct}% threshold for ${config.durationSeconds}s!`
            );
            if (config.autoThrottleOnBreach) {
              onTriggerAutoThrottle?.();
            }
          }
          return next;
        });
      } else {
        setRamBreachSeconds(0);
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [forceHighPressure, isPipelineRunning, config]);

  // Overall health stats across the last 10 runs
  const stats = useMemo(() => {
    const total = executionHistory.length;
    const successes = executionHistory.filter((r) => r.status === 'SUCCESS').length;
    const failures = executionHistory.filter((r) => r.status === 'FAILED').length;
    const warnings = executionHistory.filter((r) => r.status === 'WARNING').length;
    const avgDuration = Math.round(
      executionHistory.reduce((acc, curr) => acc + curr.durationMs, 0) / total
    );
    const successRate = Math.round(((successes + warnings * 0.5) / total) * 100);

    return {
      total,
      successes,
      failures,
      warnings,
      avgDuration,
      successRate,
    };
  }, [executionHistory]);

  const dismissAlert = (id: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* 1. RESOURCE THRESHOLD CONFIGURATION SECTION */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 font-mono text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-inner">
              <BellRing className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight uppercase">
                  Resource Threshold & Auto-Trigger Alerts
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700/60">
                  SLO RULEGUARD
                </span>
                {config.enabled ? (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    RULE ACTIVE
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">DISABLED</span>
                )}
              </div>
              <p className="text-slate-400 font-sans text-xs mt-0.5">
                Automatically raise high-priority incident alerts and trigger stage throttling when CPU or RAM exceeds safety limits for extended durations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setForceHighPressure(!forceHighPressure)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                forceHighPressure
                  ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-lg shadow-rose-950/50'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title="Force simulate continuous >85% CPU/RAM saturation to verify auto-trigger threshold"
            >
              <Flame className={`w-3.5 h-3.5 ${forceHighPressure ? 'text-rose-400 animate-bounce' : 'text-slate-500'}`} />
              <span>{forceHighPressure ? 'Stop Simulated Overload' : 'Simulate >85% Saturation Spike'}</span>
            </button>

            <button
              onClick={() => setConfig((c) => ({ ...c, enabled: !c.enabled }))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                config.enabled
                  ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {config.enabled ? 'Alerting Enabled' : 'Alerting Paused'}
            </button>
          </div>
        </div>

        {/* Live Saturation Gauges & Breach Timers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* CPU Saturation Meter */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300">Live Cluster CPU Utilization</span>
                <span className="text-[10px] text-slate-500">Threshold: {config.cpuThresholdPct}%</span>
              </div>
              <span className={`text-base font-bold tabular-nums ${currentCpu >= config.cpuThresholdPct ? 'text-rose-400 animate-pulse' : 'text-cyan-300'}`}>
                {currentCpu}%
              </span>
            </div>

            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  currentCpu >= config.cpuThresholdPct
                    ? 'bg-rose-500 shadow-sm shadow-rose-500'
                    : currentCpu >= 70
                    ? 'bg-amber-400'
                    : 'bg-cyan-400'
                }`}
                style={{ width: `${currentCpu}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2.5 text-[11px]">
              <span className="text-slate-400">
                Breach Duration Timer: <strong className={cpuBreachSeconds > 0 ? 'text-amber-400' : 'text-slate-500'}>{cpuBreachSeconds}s / {config.durationSeconds}s</strong>
              </span>
              {cpuBreachSeconds >= config.durationSeconds ? (
                <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-300 font-bold text-[10px]">
                  BREACH TRIGGERED (OVER {config.durationSeconds}s)
                </span>
              ) : cpuBreachSeconds > 0 ? (
                <span className="text-amber-400 animate-pulse text-[10px]">
                  Breach counter accumulating...
                </span>
              ) : (
                <span className="text-emerald-400 text-[10px]">Normal (Within SLA)</span>
              )}
            </div>
          </div>

          {/* RAM Heap Saturation Meter */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300">Live Container RAM Allocation</span>
                <span className="text-[10px] text-slate-500">Threshold: {config.ramThresholdPct}%</span>
              </div>
              <span className={`text-base font-bold tabular-nums ${currentRam >= config.ramThresholdPct ? 'text-rose-400 animate-pulse' : 'text-purple-300'}`}>
                {currentRam}%
              </span>
            </div>

            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  currentRam >= config.ramThresholdPct
                    ? 'bg-rose-500 shadow-sm shadow-rose-500'
                    : currentRam >= 70
                    ? 'bg-amber-400'
                    : 'bg-purple-400'
                }`}
                style={{ width: `${currentRam}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2.5 text-[11px]">
              <span className="text-slate-400">
                Breach Duration Timer: <strong className={ramBreachSeconds > 0 ? 'text-amber-400' : 'text-slate-500'}>{ramBreachSeconds}s / {config.durationSeconds}s</strong>
              </span>
              {ramBreachSeconds >= config.durationSeconds ? (
                <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-300 font-bold text-[10px]">
                  BREACH TRIGGERED (OVER {config.durationSeconds}s)
                </span>
              ) : ramBreachSeconds > 0 ? (
                <span className="text-amber-400 animate-pulse text-[10px]">
                  Breach counter accumulating...
                </span>
              ) : (
                <span className="text-emerald-400 text-[10px]">Normal (Within SLA)</span>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          {/* CPU Threshold Input */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">
              CPU Trigger Ceiling (%)
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={config.cpuThresholdPct}
                onChange={(e) => setConfig({ ...config, cpuThresholdPct: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-cyan-300 font-bold text-sm w-12 text-right">
                {config.cpuThresholdPct}%
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Default alert baseline: 85%</span>
          </div>

          {/* RAM Threshold Input */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">
              RAM Trigger Ceiling (%)
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={config.ramThresholdPct}
                onChange={(e) => setConfig({ ...config, ramThresholdPct: Number(e.target.value) })}
                className="w-full accent-purple-400 cursor-pointer"
              />
              <span className="text-purple-300 font-bold text-sm w-12 text-right">
                {config.ramThresholdPct}%
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Default alert baseline: 85%</span>
          </div>

          {/* Duration in Seconds */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">
              Sustained Breach Window
            </div>
            <div className="flex items-center gap-2">
              <select
                value={config.durationSeconds}
                onChange={(e) => setConfig({ ...config, durationSeconds: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1 text-xs cursor-pointer focus:outline-none focus:border-cyan-500"
              >
                <option value="15">15 Seconds (Aggressive)</option>
                <option value="30">30 Seconds (Default Standard)</option>
                <option value="60">60 Seconds (Conservative)</option>
                <option value="120">120 Seconds (Batch Bulk)</option>
              </select>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Requires sustained breach</span>
          </div>

          {/* Mitigation Actions */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">
              Auto-Remediation Hooks
            </div>
            <div className="space-y-1.5 text-[11px]">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoThrottleOnBreach}
                  onChange={(e) => setConfig({ ...config, autoThrottleOnBreach: e.target.checked })}
                  className="rounded accent-cyan-400"
                />
                <span>Auto-Throttle Stages (50%)</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifyWebhook}
                  onChange={(e) => setConfig({ ...config, notifyWebhook: e.target.checked })}
                  className="rounded accent-cyan-400"
                />
                <span>Dispatch PagerDuty Incident</span>
              </label>
            </div>
          </div>
        </div>

        {/* Predictive Auto-Scaling Configuration Strip */}
        {onTogglePredictiveScaling && (
          <div className="mt-4 p-3.5 rounded-lg bg-slate-950 border border-purple-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-400 shrink-0">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-xs uppercase tracking-wider">
                    Predictive Auto-Scaling Engine
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isPredictiveScalingEnabled
                      ? 'bg-purple-950 text-purple-300 border border-purple-700'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}>
                    {isPredictiveScalingEnabled ? 'ACTIVE: HISTORICAL DURATION PATTERNS' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Analyzes rolling duration percentiles across recent pipeline runs to dynamically expand compute &amp; memory allocations for heavy bottlenecks before execution spikes occur.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onTogglePredictiveScaling(!isPredictiveScalingEnabled)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isPredictiveScalingEnabled
                    ? 'bg-purple-950 border-purple-500 text-purple-200 shadow-md shadow-purple-950/50'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${isPredictiveScalingEnabled ? 'text-purple-300 animate-bounce' : 'text-slate-400'}`} />
                <span>{isPredictiveScalingEnabled ? 'Predictive Scaling Active' : 'Enable Predictive Scaling'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Allocation Details when Predictive Scaling is Enabled */}
        {isPredictiveScalingEnabled && Object.keys(predictiveStageAllocations).length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-purple-950/20 border border-purple-800/40 animate-in fade-in">
            <div className="text-[10px] text-purple-300 uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Current Dynamic Stage Allocations (Derived from 10-Run Duration Variance):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {Object.entries(predictiveStageAllocations).map(([stageId, alloc]) => (
                <div key={stageId} className="p-2 rounded bg-slate-950/90 border border-purple-900/60 text-[11px]">
                  <div className="flex items-center justify-between text-slate-300 font-bold">
                    <span className="truncate">{stageId}</span>
                    <span className="text-purple-300 text-[10px]">{alloc.speedupFactor}x Target</span>
                  </div>
                  <div className="text-[10px] text-cyan-400 mt-1 font-mono">
                    Limits: {alloc.cpuLimitPct}% CPU · {alloc.ramLimitMb} MB
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5 truncate font-sans">
                    {alloc.rationale}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Alert Banner if any alert fired */}
        {activeAlerts.length > 0 && (
          <div className="mt-4 space-y-2">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/80 text-rose-200 flex items-center justify-between gap-3 animate-in fade-in"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-xs">
                    <strong>CRITICAL SLA BREACH ({alert.type}):</strong> Current {alert.type} consumption ({alert.value}%) exceeded {alert.threshold}% threshold for &gt;{alert.duration}s! Automated throttle dispatched.
                  </span>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="px-2 py-0.5 rounded bg-rose-900 hover:bg-rose-800 text-rose-100 border border-rose-600 text-[10px] cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. HISTORICAL EXECUTION TIMELINE VISUALIZER (Last 10 Runs via Recharts) */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-tight uppercase">
                Historical Execution Timeline Visualizer (Last 10 Pipeline Runs)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                10-RUN SLIDING WINDOW
              </span>
            </div>
            <p className="text-slate-400 font-sans text-xs mt-0.5">
              Continuous trend line of pipeline execution outcomes, runtime durations, and statistical data quality health across recent batch cycles.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-sans">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-semibold">{stats.successRate}% Success Rate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-slate-300">Avg {stats.avgDuration}ms</span>
            </div>
          </div>
        </div>

        {/* 10-Run Score & Trend Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Successful Sorties</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-emerald-400">{stats.successes}</span>
              <span className="text-xs text-slate-400">/ 10 runs</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 block mt-0.5">Zero unmapped records</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Failed Runs</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-xl font-bold ${stats.failures > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {stats.failures}
              </span>
              <span className="text-xs text-slate-400">/ 10 runs</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">1 auto-recovered via WAL</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Telemetry Anomaly Warnings</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-xl font-bold ${stats.warnings > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {stats.warnings}
              </span>
              <span className="text-xs text-slate-400">/ 10 runs</span>
            </div>
            <span className="text-[10px] text-amber-400/80 block mt-0.5">Z-score outliers flagged</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Average Duration</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-cyan-300 font-mono">{stats.avgDuration}</span>
              <span className="text-xs text-slate-400">ms</span>
            </div>
            <span className="text-[10px] text-cyan-400/80 block mt-0.5">&lt; 2000ms SLA target</span>
          </div>
        </div>

        {/* Recharts Execution Trend Chart */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
            <span className="font-bold text-slate-200">
              Run Quality Score & Execution Duration Trajectory
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Success Score (0-100)</span>
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Duration (ms / 20)</span>
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-0.5 bg-rose-500" />
                <span>Failure Floor</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={executionHistory} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="timeLabel"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(val: any, name: any, item: any) => {
                    if (name === 'Success Score') {
                      const st = item.payload.status;
                      return [`${val} / 100 (${st})`, name];
                    }
                    if (name === 'Duration Index') {
                      return [`${item.payload.durationMs} ms`, 'Execution Duration'];
                    }
                    return [val, name];
                  }}
                  labelFormatter={(_label, payload) => {
                    const item = payload[0]?.payload;
                    if (!item) return '';
                    return `${item.runId} (${item.timestamp}) - ${item.status}`;
                  }}
                />
                <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.4} />
                <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="3 3" strokeOpacity={0.4} />
                
                {/* Scaled Duration Curve */}
                <Line
                  type="monotone"
                  dataKey={(d) => Math.round(d.durationMs / 20)}
                  name="Duration Index"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#22d3ee' }}
                  activeDot={{ r: 5 }}
                />

                {/* Success Score Curve */}
                <Line
                  type="monotone"
                  dataKey="successScore"
                  name="Success Score"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const fill =
                      payload.status === 'SUCCESS'
                        ? '#10b981'
                        : payload.status === 'WARNING'
                        ? '#f59e0b'
                        : '#f43f5e';
                    return (
                      <circle
                        key={`dot-${payload.runId}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={fill}
                        stroke="#020617"
                        strokeWidth={1.5}
                      />
                    );
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 10-Run Interactive Log Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-lg mt-4">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Run ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Rows Processed</th>
                <th className="py-2.5 px-3">Anomalies</th>
                <th className="py-2.5 px-3">Avg CPU / RAM</th>
                <th className="py-2.5 px-3 text-right">Diagnosis / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 tabular-nums">
              {executionHistory.map((run) => (
                <tr key={run.runId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">{run.runId}</td>
                  <td className="py-2.5 px-3 text-slate-400">{run.timestamp}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        run.status === 'SUCCESS'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : run.status === 'WARNING'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-cyan-300 font-bold">{run.durationMs} ms</td>
                  <td className="py-2.5 px-3 text-slate-300">{run.rowsProcessed.toLocaleString()}</td>
                  <td className="py-2.5 px-3">
                    <span className={run.anomaliesDetected > 2 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                      {run.anomaliesDetected}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {run.avgCpuPct}% / {run.avgRamPct}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400 text-[11px] truncate max-w-xs font-sans">
                    {run.failureReason || 'Nominal execution; invariants validated'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
