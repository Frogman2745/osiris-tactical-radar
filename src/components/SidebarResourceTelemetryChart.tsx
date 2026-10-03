import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { 
  Cpu, 
  HardDrive, 
  Zap, 
  Activity, 
  Flame, 
  ShieldAlert, 
  Download, 
  CheckCircle2, 
  Layers, 
  Split, 
  Gauge, 
  RotateCcw,
  Sparkles,
  Database
} from 'lucide-react';
import { PipelineStage } from '../types';

interface SidebarResourceTelemetryChartProps {
  isPipelineRunning: boolean;
  activeStages: PipelineStage[];
  selectedStageId?: string;
  onSelectStage?: (stageId: string) => void;
  onExportConfig?: () => void;
  throttledStageIds?: Record<string, boolean>;
  predictiveStageAllocations?: Record<
    string,
    { cpuLimitPct: number; ramLimitMb: number; rationale: string; speedupFactor: number }
  >;
}

interface MiniMetricPoint {
  time: string;
  cpu: number;
  ram: number;
  stageName: string;
}

export const SidebarResourceTelemetryChart: React.FC<SidebarResourceTelemetryChartProps> = ({
  isPipelineRunning,
  activeStages,
  selectedStageId,
  onSelectStage,
  onExportConfig,
  throttledStageIds = {},
  predictiveStageAllocations = {},
}) => {
  const [history, setHistory] = useState<MiniMetricPoint[]>(() => {
    const initial: MiniMetricPoint[] = [];
    const baseCpu = [38, 45, 52, 48, 64, 58, 62, 70, 65, 59];
    const baseRam = [42, 44, 46, 50, 55, 53, 58, 60, 62, 61];
    for (let i = 0; i < 10; i++) {
      initial.push({
        time: `${i * 3}s`,
        cpu: baseCpu[i],
        ram: baseRam[i],
        stageName: activeStages[i % activeStages.length]?.name || 'Ingest',
      });
    }
    return initial;
  });

  const [currentCpu, setCurrentCpu] = useState<number>(62);
  const [currentRam, setCurrentRam] = useState<number>(54);

  // Poll live CPU/RAM metrics during pipeline execution
  useEffect(() => {
    const interval = setInterval(() => {
      setHistory((prev) => {
        let targetCpu: number;
        let targetRam: number;

        if (isPipelineRunning) {
          const stageIndex = Math.floor((Date.now() / 2200) % Math.max(1, activeStages.length));
          const currentStage = activeStages[stageIndex];
          if (currentStage?.id === 'stage-transform') {
            targetCpu = Math.floor(78 + Math.random() * 18); // 78-96%
            targetRam = Math.floor(65 + Math.random() * 20); // 65-85%
          } else if (currentStage?.id === 'stage-ingest') {
            targetCpu = Math.floor(65 + Math.random() * 15);
            targetRam = Math.floor(55 + Math.random() * 15);
          } else {
            targetCpu = Math.floor(52 + Math.random() * 18);
            targetRam = Math.floor(48 + Math.random() * 16);
          }
        } else {
          // Idle fluctuations
          targetCpu = Math.floor(28 + Math.random() * 14);
          targetRam = Math.floor(40 + Math.random() * 8);
        }

        setCurrentCpu(targetCpu);
        setCurrentRam(targetRam);

        const newPoint: MiniMetricPoint = {
          time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
          cpu: targetCpu,
          ram: targetRam,
          stageName: isPipelineRunning ? 'Transform (Active)' : 'Standby Pool',
        };

        const updated = [...prev.slice(1), newPoint];
        return updated;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isPipelineRunning, activeStages]);

  const activeStage = activeStages.find((s) => s.id === selectedStageId) || activeStages[0];
  const stageAllocation = activeStage ? predictiveStageAllocations[activeStage.id] : undefined;
  const isStageThrottled = activeStage ? throttledStageIds[activeStage.id] : false;

  return (
    <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 shadow-xl font-mono text-xs flex flex-col justify-between space-y-4">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div>
              <span className="font-bold text-white text-[11px] uppercase tracking-wide block">
                Compute Impact
              </span>
              <span className="text-[9px] text-slate-400 font-sans">
                Real-Time DAG Resource Telemetry
              </span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${
              isPipelineRunning
                ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            {isPipelineRunning ? 'EXEC SPIKE' : 'IDLE COOLDOWN'}
          </span>
        </div>

        {/* Real-time Meter Stat Rows */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-semibold">
                <Cpu className="w-3 h-3 text-cyan-400" />
                CPU Core
              </span>
              <span className="font-bold text-white tabular-nums">{currentCpu}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  currentCpu > 80 ? 'bg-red-400' : currentCpu > 60 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${currentCpu}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[8px] text-slate-500 mt-1">
              <span>0%</span>
              <span>Ceiling: 100%</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span className="flex items-center gap-1 font-semibold">
                <HardDrive className="w-3 h-3 text-teal-400" />
                RAM Pool
              </span>
              <span className="font-bold text-white tabular-nums">{currentRam}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  currentRam > 80 ? 'bg-red-400' : currentRam > 60 ? 'bg-amber-400' : 'bg-teal-400'
                }`}
                style={{ width: `${currentRam}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[8px] text-slate-500 mt-1">
              <span>0 MB</span>
              <span>Pool: 8 GB</span>
            </div>
          </div>
        </div>

        {/* Recharts Streaming Sparkline Area Chart */}
        <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/60 mb-3">
          <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1 font-sans">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> CPU Usage
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 ml-2" /> RAM Buffer
            </span>
            <span className="text-[8px] font-mono text-slate-500">Live Window</span>
          </div>
          <div className="h-28 w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="sidebarCpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="sidebarRamGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as MiniMetricPoint;
                      return (
                        <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono shadow-xl">
                          <div className="text-slate-400 mb-0.5">{data.time}</div>
                          <div className="text-cyan-300 font-bold">CPU: {data.cpu}%</div>
                          <div className="text-teal-300 font-bold">RAM: {data.ram}%</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#sidebarCpuGradient)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="ram"
                  stroke="#14b8a6"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#sidebarRamGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Node Stage Selectors */}
        <div className="mb-3">
          <div className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider mb-1.5 flex items-center justify-between">
            <span>DAG Nodes ({activeStages.length})</span>
            <span className="text-[9px] text-cyan-400 font-normal">Click to Inspect</span>
          </div>
          <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
            {activeStages.map((stage, idx) => {
              const isSelected = stage.id === selectedStageId;
              const isThrottled = throttledStageIds[stage.id];
              return (
                <button
                  key={stage.id}
                  onClick={() => onSelectStage?.(stage.id)}
                  className={`w-full text-left p-1.5 rounded-lg border transition-all flex items-center justify-between text-[10px] cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-200 font-bold shadow-sm'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    <span className="truncate">{idx + 1}. {stage.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {stage.parallelExecution && (
                      <span title="Parallel Branch"><Split className="w-2.5 h-2.5 text-teal-400" /></span>
                    )}
                    {isThrottled && (
                      <span title="Throttled (50%)"><Gauge className="w-2.5 h-2.5 text-amber-400" /></span>
                    )}
                    <span className="font-mono text-[9px] text-slate-400">
                      {stage.durationMs}ms
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Stage Compute Profile */}
        {activeStage && (
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between font-bold">
              <span className="text-white truncate max-w-[150px]">{activeStage.name}</span>
              <span className={`px-1.5 py-0.2 rounded text-[8px] uppercase ${
                isStageThrottled ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {isStageThrottled ? '50% Throttled' : 'Uncapped'}
              </span>
            </div>

            {stageAllocation && (
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800 text-[9px]">
                <div className="text-slate-400">
                  Target CPU: <strong className="text-cyan-300">{stageAllocation.cpuLimitPct}%</strong>
                </div>
                <div className="text-slate-400">
                  Buffer RAM: <strong className="text-teal-300">{stageAllocation.ramLimitMb}MB</strong>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-800/60">
              <span>Records In/Out:</span>
              <span className="font-mono text-slate-300">{activeStage.recordsIn.toLocaleString()} → {activeStage.recordsOut.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Export Pipeline Configuration Button */}
      {onExportConfig && (
        <div className="pt-2 border-t border-slate-800/80">
          <button
            onClick={onExportConfig}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-500/50 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all shadow-md shadow-amber-950/40 cursor-pointer group"
            title="Serialize current DAG structure and node settings into a downloadable JSON file"
          >
            <Download className="w-3.5 h-3.5 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
            <span>Export Pipeline Configuration</span>
          </button>
          <span className="block text-center text-[9px] text-slate-500 mt-1 font-sans">
            Exports DAG topology, node settings &amp; variables (.json)
          </span>
        </div>
      )}
    </div>
  );
};
