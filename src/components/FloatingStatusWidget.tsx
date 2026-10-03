import React, { useState } from 'react';
import {
  Server,
  Zap,
  Clock,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Download,
  ChevronDown,
  ChevronUp,
  Cpu,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

interface FloatingStatusWidgetProps {
  currentThroughput: number;
  activeNodes: number;
  maxNodes?: number;
  cpuUtilization: number;
  queueLatencyMs: number;
  clusterHealth: 'Nominal' | 'Scaling' | 'High Pressure';
  scalingCooldown?: number;
  onDownloadReport: () => void;
  onSimulateSpike?: () => void;
  onTriggerPipeline?: () => void;
  isPipelineRunning?: boolean;
}

export const FloatingStatusWidget: React.FC<FloatingStatusWidgetProps> = ({
  currentThroughput,
  activeNodes,
  maxNodes = 12,
  cpuUtilization,
  queueLatencyMs,
  clusterHealth,
  scalingCooldown = 0,
  onDownloadReport,
  onSimulateSpike,
  onTriggerPipeline,
  isPipelineRunning = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  if (isDismissed) {
    return (
      <button
        onClick={() => setIsDismissed(false)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:scale-105"
        title="Show Pipeline Health Status HUD"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            clusterHealth === 'Nominal' ? 'bg-emerald-400 animate-pulse' :
            clusterHealth === 'Scaling' ? 'bg-amber-400 animate-ping' : 'bg-red-500 animate-bounce'
          }`}
        />
        <span className="font-mono font-bold text-white">Cluster HUD</span>
      </button>
    );
  }

  // Color mappings based on stability
  const getStabilityBadge = () => {
    switch (clusterHealth) {
      case 'Nominal':
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />,
          label: 'NOMINAL · 99.99% SLA',
          dot: 'bg-emerald-400',
        };
      case 'Scaling':
        return {
          bg: 'bg-amber-950/80 border-amber-500/40 text-amber-300',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          label: 'AUTOSCALING ACTIVE',
          dot: 'bg-amber-400 animate-pulse',
        };
      case 'High Pressure':
      default:
        return {
          bg: 'bg-red-950/80 border-red-500/40 text-red-300',
          icon: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
          label: 'ELEVATED INGEST PRESSURE',
          dot: 'bg-red-500 animate-ping',
        };
    }
  };

  const badge = getStabilityBadge();

  return (
    <aside 
      aria-label="Real-Time Health Status Widget"
      className="fixed bottom-5 right-5 z-40 max-w-sm w-full sm:w-84 font-sans select-none animate-in slide-in-from-bottom-3 duration-300"
    >
      <div className="bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden ring-1 ring-slate-800/80">
        {/* Floating Widget Header / Banner */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${badge.dot}`} />
            <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Cluster Health HUD</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                Live
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:text-white rounded transition-colors cursor-pointer"
              title={isExpanded ? 'Minimize widget' : 'Expand widget'}
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:text-red-400 rounded transition-colors cursor-pointer text-slate-500 hover:bg-slate-800 text-[10px]"
              title="Hide widget to dock"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Collapsed Compact State */}
        {!isExpanded && (
          <div 
            onClick={() => setIsExpanded(true)}
            className="p-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-900/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
                <Server className="w-3.5 h-3.5" />
                <span>{activeNodes} Nodes</span>
              </span>
              <span className="flex items-center gap-1 text-cyan-300 font-mono">
                <Zap className="w-3.5 h-3.5" />
                <span>{(currentThroughput / 1000).toFixed(1)}k/s</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {queueLatencyMs}ms · {cpuUtilization}% CPU
            </span>
          </div>
        )}

        {/* Expanded Rich State */}
        {isExpanded && (
          <div className="p-3.5 space-y-3">
            {/* Color-Coded Stability Status Badge */}
            <div className={`flex items-center justify-between p-2 rounded-lg border text-xs font-semibold ${badge.bg}`}>
              <div className="flex items-center gap-2">
                {badge.icon}
                <span className="tracking-wide text-[11px] font-mono">{badge.label}</span>
              </div>
              <span className="text-[10px] font-mono font-normal">
                {scalingCooldown > 0 ? `Hold: ${scalingCooldown}s` : 'Stable'}
              </span>
            </div>

            {/* Real-time Metric Grid with Color-Coded Iconography */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Compute Cluster Node Count */}
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 mb-0.5">
                  <span className="text-[10px] uppercase font-mono">Worker Nodes</span>
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-white font-mono">{activeNodes}</span>
                  <span className="text-[10px] text-slate-500">/ {maxNodes} pods</span>
                </div>
                <span className="text-[9px] text-emerald-400/90 font-mono">
                  {(activeNodes * 15).toFixed(0)}k/s alloc cap
                </span>
              </div>

              {/* Throughput Metric */}
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 mb-0.5">
                  <span className="text-[10px] uppercase font-mono">Throughput</span>
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-cyan-300 font-mono">
                    {(currentThroughput / 1000).toFixed(1)}k
                  </span>
                  <span className="text-[10px] text-slate-500">rec/sec</span>
                </div>
                <span className="text-[9px] text-cyan-400/80 font-mono">
                  Live flight CDC
                </span>
              </div>

              {/* P99 Queue Latency Metric */}
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 mb-0.5">
                  <span className="text-[10px] uppercase font-mono">P99 Latency</span>
                  <Clock className={`w-3.5 h-3.5 ${queueLatencyMs > 40 ? 'text-amber-400' : 'text-purple-400'}`} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-white font-mono">
                    {queueLatencyMs}
                  </span>
                  <span className="text-[10px] text-slate-500">ms</span>
                </div>
                <span className={`text-[9px] font-mono ${queueLatencyMs > 40 ? 'text-amber-400' : 'text-slate-500'}`}>
                  {queueLatencyMs > 40 ? 'Buffering queue' : 'Within SLA (<50ms)'}
                </span>
              </div>

              {/* Cluster CPU Load */}
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 mb-0.5">
                  <span className="text-[10px] uppercase font-mono">Cluster CPU</span>
                  <Cpu className={`w-3.5 h-3.5 ${cpuUtilization > 85 ? 'text-red-400' : cpuUtilization > 70 ? 'text-amber-400' : 'text-emerald-400'}`} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-white font-mono">
                    {cpuUtilization}%
                  </span>
                  <span className="text-[10px] text-slate-500">load</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full ${
                      cpuUtilization > 85 ? 'bg-red-500' :
                      cpuUtilization > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${cpuUtilization}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Action Footer */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <button
                onClick={onDownloadReport}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-200 text-[11px] font-semibold transition-colors cursor-pointer"
                title="Download CSV Audit Report"
              >
                <Download className="w-3 h-3 text-emerald-400" />
                <span>Export CSV</span>
              </button>

              {onSimulateSpike && (
                <button
                  onClick={onSimulateSpike}
                  className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 text-[11px] font-medium transition-colors cursor-pointer"
                  title="Inject sudden telemetry surge"
                >
                  <TrendingUp className="w-3 h-3 text-amber-400" />
                  <span>Spike +50k</span>
                </button>
              )}

              {onTriggerPipeline && (
                <button
                  onClick={onTriggerPipeline}
                  disabled={isPipelineRunning}
                  className="flex items-center justify-center p-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-800 text-cyan-300 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Run Full Pipeline Stages"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPipelineRunning ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
