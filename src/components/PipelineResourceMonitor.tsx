import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Cpu,
  Activity,
  Zap,
  Clock,
  Layers,
  HardDrive,
  Gauge,
  Sparkles,
  Server,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info
} from 'lucide-react';
import { PipelineStage, PipelineRunStatus } from '../types';

export interface ResourceTelemetrySnapshot {
  timestamp: string;
  timeLabel: string;
  totalCpuPct: number;
  totalRamPct: number;
  ramUsageMb: number;
  cpuCoresUsed: number;
  activeJobCount: number;
  // Per active stage consumption
  stageIngestCpu: number;
  stageIngestRam: number;
  stageValidateCpu: number;
  stageValidateRam: number;
  stageTransformCpu: number;
  stageTransformRam: number;
  stageLoadCpu: number;
  stageLoadRam: number;
}

interface PipelineResourceMonitorProps {
  activeStages: PipelineStage[];
  pipelineStatus: PipelineRunStatus;
  isPipelineRunning: boolean;
  selectedStageId?: string;
  onSelectStage?: (stageId: string) => void;
  throttledStageIds?: Record<string, boolean>;
  isPredictiveScalingEnabled?: boolean;
  onTogglePredictiveScaling?: (enabled: boolean) => void;
  predictiveStageAllocations?: Record<string, { cpuLimitPct: number; ramLimitMb: number; rationale: string; speedupFactor: number }>;
}

export const PipelineResourceMonitor: React.FC<PipelineResourceMonitorProps> = ({
  activeStages,
  pipelineStatus,
  isPipelineRunning,
  selectedStageId,
  onSelectStage,
  throttledStageIds = {},
  isPredictiveScalingEnabled = false,
  onTogglePredictiveScaling,
  predictiveStageAllocations = {},
}) => {
  const [metricMode, setMetricMode] = useState<'both' | 'cpu' | 'ram'>('both');
  const [chartType, setChartType] = useState<'timeline' | 'per_stage'>('timeline');
  const [history, setHistory] = useState<ResourceTelemetrySnapshot[]>(() => {
    // Generate initial 12 ticks of recent telemetry
    const initial: ResourceTelemetrySnapshot[] = [];
    const now = Date.now();
    for (let i = 12; i >= 0; i--) {
      const t = new Date(now - i * 4000);
      const timeLabel = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const baseCpu = 28 + Math.sin(i * 0.7) * 8;
      const baseRam = 38 + Math.cos(i * 0.5) * 5;
      
      initial.push({
        timestamp: t.toISOString(),
        timeLabel,
        totalCpuPct: Math.round(baseCpu),
        totalRamPct: Math.round(baseRam),
        ramUsageMb: Math.round((baseRam / 100) * 16384),
        cpuCoresUsed: Number(((baseCpu / 100) * 16).toFixed(2)),
        activeJobCount: 4,
        stageIngestCpu: Math.round(baseCpu * 0.28),
        stageIngestRam: Math.round(baseRam * 0.22),
        stageValidateCpu: Math.round(baseCpu * 0.18),
        stageValidateRam: Math.round(baseRam * 0.20),
        stageTransformCpu: Math.round(baseCpu * 0.38),
        stageTransformRam: Math.round(baseRam * 0.40),
        stageLoadCpu: Math.round(baseCpu * 0.16),
        stageLoadRam: Math.round(baseRam * 0.18),
      });
    }
    return initial;
  });

  // Dynamically stream live ticks every 3 seconds, reacting to pipeline running state & throttling
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // If pipeline is actively running, simulate significant spike in transform/ingest
      const multiplier = isPipelineRunning ? 2.1 : 1.0;

      // Base allocations per stage considering throttling
      const getStageOverhead = (stageId: string, baseC: number, baseR: number) => {
        const isThrottled = throttledStageIds[stageId];
        const throttleFactor = isThrottled ? 0.5 : 1.0;
        const noise = (Math.random() - 0.5) * 4;
        const c = Math.max(2, Math.round((baseC * multiplier + noise) * throttleFactor));
        const r = Math.max(4, Math.round((baseR * (isPipelineRunning ? 1.5 : 1.0) + noise * 0.5) * throttleFactor));
        return { c, r };
      };

      const ingest = getStageOverhead('stage-ingest', 12, 10);
      const validate = getStageOverhead('stage-validate', 8, 8);
      const transform = getStageOverhead('stage-transform', 22, 18);
      const load = getStageOverhead('stage-load', 9, 8);

      const totalCpu = Math.min(98, ingest.c + validate.c + transform.c + load.c);
      const totalRam = Math.min(92, ingest.r + validate.r + transform.r + load.r);

      const snapshot: ResourceTelemetrySnapshot = {
        timestamp: now.toISOString(),
        timeLabel,
        totalCpuPct: totalCpu,
        totalRamPct: totalRam,
        ramUsageMb: Math.round((totalRam / 100) * 16384),
        cpuCoresUsed: Number(((totalCpu / 100) * 16).toFixed(2)),
        activeJobCount: activeStages.length,
        stageIngestCpu: ingest.c,
        stageIngestRam: ingest.r,
        stageValidateCpu: validate.c,
        stageValidateRam: validate.r,
        stageTransformCpu: transform.c,
        stageTransformRam: transform.r,
        stageLoadCpu: load.c,
        stageLoadRam: load.r,
      };

      setHistory((prev) => {
        const updated = [...prev.slice(1), snapshot];
        return updated;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [isPipelineRunning, activeStages.length, throttledStageIds]);

  const latest = history[history.length - 1] || history[0];

  // Stage Breakdown Data for the comparative Bar Chart
  const stageBreakdownData = useMemo(() => {
    return activeStages.map((stage) => {
      let cpu = 10;
      let ram = 12;
      let cores = 1.6;
      let mb = 1800;

      if (stage.type === 'ingest') {
        cpu = latest.stageIngestCpu;
        ram = latest.stageIngestRam;
      } else if (stage.type === 'validate') {
        cpu = latest.stageValidateCpu;
        ram = latest.stageValidateRam;
      } else if (stage.type === 'transform') {
        cpu = latest.stageTransformCpu;
        ram = latest.stageTransformRam;
      } else if (stage.type === 'load') {
        cpu = latest.stageLoadCpu;
        ram = latest.stageLoadRam;
      }

      cores = Number(((cpu / 100) * 16).toFixed(2));
      mb = Math.round((ram / 100) * 16384);

      return {
        id: stage.id,
        name: stage.name.replace(/^\d+\.\s*/, ''),
        fullName: stage.name,
        type: stage.type,
        cpuPct: cpu,
        ramPct: ram,
        coresUsed: cores,
        memoryMb: mb,
        isThrottled: !!throttledStageIds[stage.id],
        recordsPerSec: Math.round(stage.recordsOut / (stage.durationMs / 1000)),
      };
    });
  }, [activeStages, latest, throttledStageIds]);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 font-mono text-xs space-y-4">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Real-Time Process Overhead & Compute Saturation</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {isPipelineRunning && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 border border-cyan-800 text-cyan-300">
                ACTIVE PIPELINE LOAD
              </span>
            )}
          </div>
          <h2 className="text-sm font-bold text-white tracking-tight mt-0.5">
            Real-Time CPU/RAM Usage Per Active ETL Pipeline Process
          </h2>
          <p className="text-slate-400 font-sans text-xs mt-0.5">
            Continuous telemetry monitoring of container cores, heap allocation, and stage overhead across OR-Tools, CDC, and Postgres buffers.
          </p>
        </div>

        {/* View Mode & Metric Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeline vs Per-Stage Breakdown */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setChartType('timeline')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                chartType === 'timeline'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Overhead Timeline</span>
            </button>
            <button
              onClick={() => setChartType('per_stage')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                chartType === 'per_stage'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Per-Stage Breakdown</span>
            </button>
          </div>

          {/* Metric Selector: Both, CPU, RAM */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setMetricMode('both')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                metricMode === 'both' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              CPU + RAM
            </button>
            <button
              onClick={() => setMetricMode('cpu')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                metricMode === 'cpu' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              CPU Only
            </button>
            <button
              onClick={() => setMetricMode('ram')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                metricMode === 'ram' ? 'bg-purple-500/20 text-purple-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              RAM Only
            </button>
          </div>

          {/* Predictive Auto-Scaling Toggle */}
          {onTogglePredictiveScaling && (
            <button
              onClick={() => onTogglePredictiveScaling(!isPredictiveScalingEnabled)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isPredictiveScalingEnabled
                  ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-md shadow-purple-950/60'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title="Dynamically adjusts CPU cores and RAM limits for ETL stages based on historical duration patterns"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isPredictiveScalingEnabled ? 'text-purple-400 animate-pulse' : 'text-slate-500'}`} />
              <span>Predictive Auto-Scaling: {isPredictiveScalingEnabled ? 'ACTIVE' : 'OFF'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards: Live Resource Meters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total CPU Usage */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1.5 font-sans font-medium">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cluster CPU Saturation</span>
            </span>
            <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/80">
              16 Cores
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white tabular-nums">
              {latest.totalCpuPct}%
            </span>
            <span className="text-[11px] text-slate-400 tabular-nums">
              ({latest.cpuCoresUsed} / 16.0 cores)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full transition-all duration-500 ${
                latest.totalCpuPct > 80 ? 'bg-rose-500' : latest.totalCpuPct > 60 ? 'bg-amber-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${latest.totalCpuPct}%` }}
            />
          </div>
        </div>

        {/* Total RAM Usage */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="flex items-center gap-1.5 font-sans font-medium">
              <HardDrive className="w-3.5 h-3.5 text-purple-400" />
              <span>Container Heap / RAM</span>
            </span>
            <span className="text-[10px] text-purple-400 bg-purple-950/80 px-1.5 py-0.2 rounded border border-purple-800/80">
              16 GB Pool
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white tabular-nums">
              {latest.totalRamPct}%
            </span>
            <span className="text-[11px] text-slate-400 tabular-nums">
              ({(latest.ramUsageMb / 1024).toFixed(1)} GB / 16.0 GB)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full transition-all duration-500 ${
                latest.totalRamPct > 80 ? 'bg-rose-500' : latest.totalRamPct > 60 ? 'bg-amber-400' : 'bg-purple-400'
              }`}
              style={{ width: `${latest.totalRamPct}%` }}
            />
          </div>
        </div>

        {/* Peak Stage Consumer */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="text-slate-400 text-[11px] mb-1 font-sans font-medium flex items-center justify-between">
            <span>Heaviest Process</span>
            <span className="text-[10px] text-amber-400 font-mono">CP-SAT SOLVER</span>
          </div>
          <div className="text-sm font-bold text-slate-200 truncate">
            03. CP-SAT & Anomaly Transform
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
            <span className="text-cyan-300 font-bold">{latest.stageTransformCpu}% CPU</span>
            <span>·</span>
            <span className="text-purple-300 font-bold">{latest.stageTransformRam}% RAM</span>
          </div>
        </div>

        {/* Process Scheduling & Throttling Status */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="text-slate-400 text-[11px] mb-1 font-sans font-medium flex items-center justify-between">
            <span>Scheduling SLA Status</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-sm font-bold text-emerald-400">
            Deterministic Zero-Drop
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
            <span>{Object.values(throttledStageIds).filter(Boolean).length} Throttled</span>
            <span>·</span>
            <span className="text-slate-300 font-mono">{activeStages.length} Active Workers</span>
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization */}
      <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-4">
        {chartType === 'timeline' ? (
          <div>
            <div className="flex items-center justify-between mb-3 text-slate-400 text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-2">
                <span>Real-Time Ingestion Overhead Velocity</span>
                <span className="text-[10px] text-slate-500 font-mono">(Rolling 45-Second Window)</span>
              </span>
              <div className="flex items-center gap-4 text-[11px]">
                {(metricMode === 'both' || metricMode === 'cpu') && (
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
                    <span>Total CPU %</span>
                  </span>
                )}
                {(metricMode === 'both' || metricMode === 'ram') && (
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-purple-400" />
                    <span>Total RAM %</span>
                  </span>
                )}
                <span className="text-slate-500">Warning: 80%</span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis
                    dataKey="timeLabel"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                    itemStyle={{ padding: 0 }}
                  />
                  <ReferenceLine y={80} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'SLA Limit (80%)', fill: '#f43f5e', fontSize: 10, position: 'insideTopRight' }} />
                  {(metricMode === 'both' || metricMode === 'cpu') && (
                    <Area
                      type="monotone"
                      dataKey="totalCpuPct"
                      name="CPU Utilization"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#cpuGradient)"
                    />
                  )}
                  {(metricMode === 'both' || metricMode === 'ram') && (
                    <Area
                      type="monotone"
                      dataKey="totalRamPct"
                      name="RAM Utilization"
                      stroke="#c084fc"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#ramGradient)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3 text-slate-400 text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-2">
                <span>Resource Consumption Per Active Pipeline Stage</span>
                <span className="text-[10px] text-slate-500 font-mono">(Instantaneous Allocation)</span>
              </span>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
                  <span>CPU %</span>
                </span>
                <span className="flex items-center gap-1.5 text-purple-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-400" />
                  <span>RAM %</span>
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageBreakdownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    domain={[0, 60]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val}% (${name === 'CPU Allocation' ? `${item.payload.coresUsed} cores` : `${item.payload.memoryMb} MB`})`,
                      name,
                    ]}
                  />
                  <Bar
                    dataKey="cpuPct"
                    name="CPU Allocation"
                    fill="#22d3ee"
                    radius={[4, 4, 0, 0]}
                    onClick={(entry: any) => {
                      if (entry?.id) onSelectStage?.(entry.id);
                    }}
                    className="cursor-pointer"
                  />
                  <Bar
                    dataKey="ramPct"
                    name="RAM Allocation"
                    fill="#c084fc"
                    radius={[4, 4, 0, 0]}
                    onClick={(entry: any) => {
                      if (entry?.id) onSelectStage?.(entry.id);
                    }}
                    className="cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Stage Resource Footprint Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2 px-3">Active Process / Stage</th>
              <th className="py-2 px-3">Stage Type</th>
              <th className="py-2 px-3">CPU % (Cores)</th>
              <th className="py-2 px-3">RAM % (Heap MB)</th>
              <th className="py-2 px-3">Throughput Rate</th>
              <th className="py-2 px-3">Dynamic Scaling Limit</th>
              <th className="py-2 px-3 text-right">Resource Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 tabular-nums">
            {stageBreakdownData.map((stage) => {
              const isSelected = stage.id === selectedStageId;
              const pred = predictiveStageAllocations[stage.id];
              return (
                <tr
                  key={stage.id}
                  onClick={() => onSelectStage?.(stage.id)}
                  className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                    isSelected ? 'bg-cyan-950/40' : ''
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{stage.fullName}</span>
                      {isSelected && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                          SELECTED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 uppercase text-slate-400 text-[10px]">
                    {stage.type}
                  </td>
                  <td className="py-2.5 px-3 text-cyan-300 font-medium">
                    {stage.cpuPct}% <span className="text-slate-500 font-normal">({stage.coresUsed} cores)</span>
                  </td>
                  <td className="py-2.5 px-3 text-purple-300 font-medium">
                    {stage.ramPct}% <span className="text-slate-500 font-normal">({stage.memoryMb} MB)</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {stage.recordsPerSec.toLocaleString()} rows/s
                  </td>
                  <td className="py-2.5 px-3">
                    {isPredictiveScalingEnabled && pred ? (
                      <div>
                        <div className="flex items-center gap-1.5 text-purple-300 font-bold text-[10px]">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>Auto: {pred.cpuLimitPct}% CPU / {pred.ramLimitMb}MB</span>
                        </div>
                        <span className="text-[9px] text-slate-500 block">{pred.rationale}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[10px]">Static (Standard SLA)</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {stage.isThrottled ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 border border-amber-500/50 text-amber-300 font-bold">
                        50% THROTTLED
                      </span>
                    ) : isPredictiveScalingEnabled && pred ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/60 text-purple-300 font-bold">
                        PREDICTIVE ({pred.speedupFactor}x GAIN)
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
                        FULL CAPACITY
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
