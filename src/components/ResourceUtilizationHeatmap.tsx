import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Activity,
  Cpu,
  Layers,
  Database,
  Radio,
  RefreshCw,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ChevronRight,
  TrendingUp,
  Server,
  ArrowUpRight,
  Maximize2,
  X,
  Info,
  Clock,
  History
} from 'lucide-react';
import { ModuleResourceMetric } from '../types/resourceHeatmap';
import { INITIAL_MODULE_RESOURCE_METRICS } from '../data/resourceHeatmapData';
import { HistoricalTimelineView } from './HistoricalTimelineView';

interface ResourceUtilizationHeatmapProps {
  onClose?: () => void;
  isOverlay?: boolean;
}

export const ResourceUtilizationHeatmap: React.FC<ResourceUtilizationHeatmapProps> = ({
  onClose,
  isOverlay = false,
}) => {
  const [metrics, setMetrics] = useState<ModuleResourceMetric[]>(INITIAL_MODULE_RESOURCE_METRICS);
  const [selectedModule, setSelectedModule] = useState<ModuleResourceMetric>(INITIAL_MODULE_RESOURCE_METRICS[0]);
  const [activeMetricView, setActiveMetricView] = useState<'heatScore' | 'cpu' | 'memory' | 'iops'>('heatScore');
  const [activeTab, setActiveTab] = useState<'heatmap' | 'timeline'>('heatmap');
  const [isLiveSimulating, setIsLiveSimulating] = useState<boolean>(true);

  // Live jitter / fluctuation simulation
  useEffect(() => {
    if (!isLiveSimulating) return;

    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((mod) => {
          const cpuDelta = (Math.random() - 0.48) * 3;
          const memDelta = (Math.random() - 0.49) * 2;
          const newCpu = Math.max(15, Math.min(99, +(mod.cpuUtilizationPct + cpuDelta).toFixed(1)));
          const newMem = Math.max(15, Math.min(98, +(mod.memoryUtilizationPct + memDelta).toFixed(1)));
          const newHeat = Math.round(newCpu * 0.55 + newMem * 0.45);
          const newStatus = newHeat >= 85 ? 'critical' : newHeat >= 65 ? 'elevated' : 'nominal';

          return {
            ...mod,
            cpuUtilizationPct: newCpu,
            memoryUtilizationPct: newMem,
            heatScore: newHeat,
            status: newStatus,
          };
        })
      );
    }, 2800);

    return () => clearInterval(interval);
  }, [isLiveSimulating]);

  // Keep selected module in sync
  useEffect(() => {
    const updated = metrics.find((m) => m.id === selectedModule.id);
    if (updated) setSelectedModule(updated);
  }, [metrics, selectedModule.id]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const avgHeat = Math.round(metrics.reduce((acc, m) => acc + m.heatScore, 0) / metrics.length);
    const avgCpu = +(metrics.reduce((acc, m) => acc + m.cpuUtilizationPct, 0) / metrics.length).toFixed(1);
    const avgMem = +(metrics.reduce((acc, m) => acc + m.memoryUtilizationPct, 0) / metrics.length).toFixed(1);
    const criticalCount = metrics.filter((m) => m.status === 'critical').length;
    const elevatedCount = metrics.filter((m) => m.status === 'elevated').length;

    return { avgHeat, avgCpu, avgMem, criticalCount, elevatedCount };
  }, [metrics]);

  // Heat color mapper
  const getHeatColor = (value: number) => {
    if (value >= 85) {
      return {
        bg: 'bg-red-500/20 hover:bg-red-500/30',
        border: 'border-red-500/70',
        text: 'text-red-400',
        glow: 'shadow-red-950/50 shadow-md',
        badge: 'bg-red-950 border-red-500/60 text-red-300',
      };
    }
    if (value >= 70) {
      return {
        bg: 'bg-orange-500/20 hover:bg-orange-500/30',
        border: 'border-orange-500/60',
        text: 'text-orange-400',
        glow: 'shadow-orange-950/40 shadow-md',
        badge: 'bg-orange-950 border-orange-500/60 text-orange-300',
      };
    }
    if (value >= 50) {
      return {
        bg: 'bg-amber-500/15 hover:bg-amber-500/25',
        border: 'border-amber-500/50',
        text: 'text-amber-400',
        glow: 'shadow-amber-950/30 shadow-sm',
        badge: 'bg-amber-950 border-amber-500/60 text-amber-300',
      };
    }
    return {
      bg: 'bg-cyan-500/10 hover:bg-cyan-500/20',
      border: 'border-cyan-500/40',
      text: 'text-cyan-400',
      glow: 'shadow-cyan-950/20 shadow-sm',
      badge: 'bg-cyan-950 border-cyan-500/60 text-cyan-300',
    };
  };

  const getMetricValue = (mod: ModuleResourceMetric) => {
    switch (activeMetricView) {
      case 'cpu':
        return { val: mod.cpuUtilizationPct, label: `${mod.cpuUtilizationPct}% CPU` };
      case 'memory':
        return { val: mod.memoryUtilizationPct, label: `${mod.memoryUtilizationPct}% RAM` };
      case 'iops':
        return { val: Math.round((mod.iopsRate / 5000) * 100), label: `${mod.iopsRate.toLocaleString()} IOPS` };
      case 'heatScore':
      default:
        return { val: mod.heatScore, label: `${mod.heatScore} / 100 Index` };
    }
  };

  return (
    <div className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl p-5 shadow-2xl relative overflow-hidden font-mono text-slate-200">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f49_1px,transparent_1px),linear-gradient(to_bottom,#082f49_1px,transparent_1px)] bg-[size:24px_24px] opacity-25 pointer-events-none" />

      {/* Top Header & Tactical Controls */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <Flame className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Resource Utilization Density Heat-Map</span>
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">Cluster Density: <strong className="text-white">{aggregateStats.avgHeat}%</strong></span>
          </div>
          <p className="text-xs text-slate-400 font-sans max-w-2xl">
            Live multi-module telemetry heatmap assessing CPU load, memory saturation, and IOPS density across AxiomBI microservices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Main Mode Toggle: Real-Time Density Grid vs Historical Timeline View */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'heatmap'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-cyan-400" />
              <span>Density Grid</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span>Historical Timeline & Spikes</span>
            </button>
          </div>

          {/* Metric View Switcher (Only active when in heatmap mode) */}
          {activeTab === 'heatmap' && (
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
              {[
                { id: 'heatScore', label: 'Composite Heat' },
                { id: 'cpu', label: 'CPU Load' },
                { id: 'memory', label: 'RAM Load' },
                { id: 'iops', label: 'Storage IOPS' },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setActiveMetricView(v.id as any)}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    activeMetricView === v.id
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}

          {/* Toggle Live Jitter */}
          <button
            onClick={() => setIsLiveSimulating(!isLiveSimulating)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
              isLiveSimulating
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Live Telemetry Jitter"
          >
            <RefreshCw className={`w-3 h-3 ${isLiveSimulating ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            <span>{isLiveSimulating ? 'Live Jitter' : 'Frozen'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title="Close Heat-Map Overlay"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Vitals Bar */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
          <span className="text-[10px] text-slate-500 block uppercase">Average Heat Index</span>
          <span className="text-base font-bold text-white mt-0.5 block">{aggregateStats.avgHeat} / 100</span>
          <span className="text-[10px] text-cyan-400">Target Ceiling: &lt;80</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
          <span className="text-[10px] text-slate-500 block uppercase">Cluster CPU Saturation</span>
          <span className="text-base font-bold text-white mt-0.5 block">{aggregateStats.avgCpu}%</span>
          <span className="text-[10px] text-emerald-400">PostgreSQL + Node Pool</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
          <span className="text-[10px] text-slate-500 block uppercase">Cluster RAM Saturation</span>
          <span className="text-base font-bold text-white mt-0.5 block">{aggregateStats.avgMem}%</span>
          <span className="text-[10px] text-slate-400">Polars Vector Mart</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
          <span className="text-[10px] text-slate-500 block uppercase">Heat Hotspots</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-base font-bold text-red-400">{aggregateStats.criticalCount}</span>
            <span className="text-xs text-slate-500">critical</span>
            <span className="text-slate-600">/</span>
            <span className="text-base font-bold text-amber-400">{aggregateStats.elevatedCount}</span>
            <span className="text-xs text-slate-500">elevated</span>
          </div>
          <span className="text-[10px] text-emerald-400">Auto-Balancing Active</span>
        </div>
      </div>

      {/* Main Heat-Map Grid + Detailed Inspector Layout */}
      {activeTab === 'heatmap' ? (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Module Density Tiles Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {metrics.map((mod) => {
              const heatProps = getHeatColor(mod.heatScore);
              const isSelected = selectedModule.id === mod.id;
              const displayMetric = getMetricValue(mod);

              return (
                <div
                  key={mod.id}
                  onClick={() => setSelectedModule(mod)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    isSelected
                      ? 'ring-2 ring-cyan-400 bg-slate-900/90 shadow-xl'
                      : 'bg-slate-900/50 hover:bg-slate-800/60'
                  } ${heatProps.border}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] text-slate-400 uppercase font-mono tracking-tight line-clamp-1">
                        {mod.category}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border ${heatProps.badge}`}
                      >
                        {mod.status}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-white leading-snug line-clamp-2 mb-2">
                      {mod.name}
                    </h3>
                  </div>

                  <div className="space-y-2 mt-2 pt-2 border-t border-slate-800/80">
                    {/* Heat Density Visual Bar */}
                    <div>
                      <div className="flex justify-between items-center text-[10px] mb-1">
                        <span className="text-slate-400">Resource Load:</span>
                        <strong className={`font-bold ${heatProps.text}`}>{displayMetric.label}</strong>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800 p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            mod.heatScore >= 85
                              ? 'bg-gradient-to-r from-orange-500 to-red-500'
                              : mod.heatScore >= 70
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                              : mod.heatScore >= 50
                              ? 'bg-gradient-to-r from-cyan-500 to-amber-400'
                              : 'bg-gradient-to-r from-cyan-600 to-cyan-400'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(8, displayMetric.val))}%` }}
                        />
                      </div>
                    </div>

                    {/* Micro Sparkline of 24h trend */}
                    <div className="flex items-end gap-0.5 h-5 pt-1">
                      {mod.peakHourLoad.slice(-16).map((val, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-t-sm transition-all ${
                            val >= 85 ? 'bg-red-500/70' : val >= 65 ? 'bg-amber-500/60' : 'bg-cyan-500/40'
                          }`}
                          style={{ height: `${Math.max(15, val)}%` }}
                          title={`Hour -${16 - i}h: ${val}% load`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>{mod.subservices.length} subservices</span>
                      <span className="text-slate-400">{mod.networkThroughputMbps.toFixed(0)} Mbps</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Module Detail Inspector */}
          <div className="lg:col-span-4 bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Module Deep Inspector</span>
                </span>
                <span className="text-cyan-400 text-[10px]">{selectedModule.id}</span>
              </div>

              <div className="mt-3 space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedModule.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                    Target module executing continuous operational workloads for the AxiomBI platform.
                  </p>
                </div>

                {/* Gauges */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">CPU SATURATION</span>
                    <span className="text-base font-bold text-cyan-300 block">{selectedModule.cpuUtilizationPct}%</span>
                    <span className="text-[10px] text-slate-400">{selectedModule.activeThreads} Worker Threads</span>
                  </div>

                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">MEMORY PRESSURE</span>
                    <span className="text-base font-bold text-amber-300 block">{selectedModule.memoryUtilizationPct}%</span>
                    <span className="text-[10px] text-slate-400">Allocated RAM Pool</span>
                  </div>

                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">STORAGE IOPS</span>
                    <span className="text-base font-bold text-slate-200 block">{selectedModule.iopsRate.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400">Transactions/sec</span>
                  </div>

                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">NETWORK IN/OUT</span>
                    <span className="text-base font-bold text-slate-200 block">{selectedModule.networkThroughputMbps} <span className="text-xs">Mbps</span></span>
                    <span className="text-[10px] text-emerald-400">0 Packet Drops</span>
                  </div>
                </div>

                {/* Subservice Breakdown */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    SUBSERVICE RESOURCE BREAKDOWN
                  </span>
                  <div className="space-y-1.5">
                    {selectedModule.subservices.map((sub, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-slate-950/70 border border-slate-800/80 text-[11px] flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-slate-200 font-semibold truncate block">{sub.name}</span>
                          <span className="text-[10px] text-slate-500">{sub.throughputRps} req/s · {sub.latencyMs}ms avg</span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`font-bold ${sub.loadPct >= 80 ? 'text-red-400' : sub.loadPct >= 60 ? 'text-amber-400' : 'text-cyan-400'}`}>
                            {sub.loadPct}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
              <span>Dynamic Load Balancer: Round-Robin</span>
              <span className="text-emerald-400 font-semibold">Healthy Pods (4/4)</span>
            </div>
          </div>
        </div>
      ) : (
        <HistoricalTimelineView currentMetrics={metrics} />
      )}
    </div>
  );
};
