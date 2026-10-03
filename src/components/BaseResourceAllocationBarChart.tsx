import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  CALFIRE_AND_MILITARY_BASES,
  AirbaseResource,
} from '../data/calfireAirbases';
import { ActivityLog } from '../types';
import {
  Warehouse,
  Droplets,
  Plane,
  Gauge,
  Activity,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Camera,
  Radio,
  Sliders,
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export type BaseMetricMode = 'pits' | 'retardant' | 'aircraft' | 'turnaround' | 'sorties';
export type BaseRegionFilter = 'all' | 'north' | 'south' | 'military';
export type BaseSortOrder = 'utilization' | 'turnaround' | 'capacity' | 'name';

interface BaseResourceAllocationBarChartProps {
  onSelectBase?: (base: AirbaseResource) => void;
  onAddActivityLog?: (log: ActivityLog) => void;
  onPlayBeep?: (freq?: number, type?: OscillatorType, duration?: number) => void;
  onOpenLiveCamera?: (base: AirbaseResource) => void;
}

export const BaseResourceAllocationBarChart: React.FC<BaseResourceAllocationBarChartProps> = ({
  onSelectBase,
  onAddActivityLog,
  onPlayBeep,
  onOpenLiveCamera,
}) => {
  const [metricMode, setMetricMode] = useState<BaseMetricMode>('pits');
  const [regionFilter, setRegionFilter] = useState<BaseRegionFilter>('all');
  const [sortOrder, setSortOrder] = useState<BaseSortOrder>('utilization');
  const [selectedBaseId, setSelectedBaseId] = useState<string>('base-rdd');
  const [hoveredBaseId, setHoveredBaseId] = useState<string | null>(null);

  const playBeep = (freq = 880, type: OscillatorType = 'sine', duration = 0.05) => {
    onPlayBeep?.(freq, type, duration);
  };

  // Filter bases by selected region
  const filteredBases = useMemo(() => {
    return CALFIRE_AND_MILITARY_BASES.filter((base) => {
      if (regionFilter === 'north') return base.region === 'North Ops';
      if (regionFilter === 'south') return base.region === 'South Ops';
      if (regionFilter === 'military') return base.region === 'Joint Defense' || base.type === 'military_base';
      return true;
    });
  }, [regionFilter]);

  // Transform bases into Recharts-formatted data series and sort
  const chartData = useMemo(() => {
    const data = filteredBases.map((b) => {
      const pitUtilizationPct = b.loadingPits > 0 ? Math.round((b.activePitsOccupied / b.loadingPits) * 100) : 0;
      const retardantUtilizationPct = b.retardantStorageGal > 0 ? Math.round((b.currentMixGal / b.retardantStorageGal) * 100) : 0;
      const fuelUtilizationPct = b.fuelCapacityGal > 0 ? Math.round((b.currentFuelGal / b.fuelCapacityGal) * 100) : 0;

      // Classify assigned aircraft count
      const fixedWingCount = b.assignedAircraft.filter((a) => a.includes('Tanker') || a.includes('Air Attack') || a.includes('Lead')).length;
      const helitackCount = b.assignedAircraft.filter((a) => a.includes('Copter') || a.includes('UH-1') || a.includes('CH-47') || a.includes('S-70')).length;
      const otherAircraftCount = b.assignedAircraft.length - fixedWingCount - helitackCount;

      return {
        id: b.id,
        code: b.code,
        name: b.name,
        region: b.region,
        type: b.type,
        status: b.status,
        // Metric: Pits
        loadingPits: b.loadingPits,
        activePitsOccupied: b.activePitsOccupied,
        availablePits: Math.max(0, b.loadingPits - b.activePitsOccupied),
        pitUtilizationPct,
        // Metric: Retardant (k Gal)
        currentMixKGal: +(b.currentMixGal / 1000).toFixed(1),
        storageCapacityKGal: +(b.retardantStorageGal / 1000).toFixed(1),
        currentMixGal: b.currentMixGal,
        retardantStorageGal: b.retardantStorageGal,
        retardantUtilizationPct,
        // Metric: Aircraft Fleets
        assignedAircraftCount: b.assignedAircraft.length,
        fixedWingCount,
        helitackCount,
        otherAircraftCount: Math.max(0, otherAircraftCount),
        assignedAircraft: b.assignedAircraft,
        // Metric: Turnaround vs SLA
        turnaroundAvgMin: b.turnaroundAvgMin,
        slaTargetMin: b.slaTargetMin,
        turnaroundDelta: +(b.turnaroundAvgMin - b.slaTargetMin).toFixed(1),
        isTurnaroundBreached: b.turnaroundAvgMin > b.slaTargetMin,
        // Metric: Sorties
        activeSortiesToday: b.activeSortiesToday,
        // Operations
        pumpingRateGpm: b.pumpingRateGpm,
        preparednessLevel: b.preparednessLevel,
        weatherStation: b.weatherStation,
        fuelCapacityGal: b.fuelCapacityGal,
        currentFuelGal: b.currentFuelGal,
        fuelUtilizationPct,
        rawBase: b,
      };
    });

    // Apply Sorting
    return [...data].sort((a, b) => {
      if (sortOrder === 'utilization') {
        if (metricMode === 'pits') return b.pitUtilizationPct - a.pitUtilizationPct;
        if (metricMode === 'retardant') return b.retardantUtilizationPct - a.retardantUtilizationPct;
        if (metricMode === 'aircraft') return b.assignedAircraftCount - a.assignedAircraftCount;
        if (metricMode === 'turnaround') return b.turnaroundAvgMin - a.turnaroundAvgMin;
        return b.activeSortiesToday - a.activeSortiesToday;
      }
      if (sortOrder === 'turnaround') return a.turnaroundAvgMin - b.turnaroundAvgMin; // fastest first
      if (sortOrder === 'capacity') {
        if (metricMode === 'retardant') return b.retardantStorageGal - a.retardantStorageGal;
        if (metricMode === 'pits') return b.loadingPits - a.loadingPits;
        return b.assignedAircraftCount - a.assignedAircraftCount;
      }
      return a.code.localeCompare(b.code);
    });
  }, [filteredBases, sortOrder, metricMode]);

  // Currently selected base object
  const selectedBase = useMemo(() => {
    return CALFIRE_AND_MILITARY_BASES.find((b) => b.id === selectedBaseId) || CALFIRE_AND_MILITARY_BASES[0];
  }, [selectedBaseId]);

  // Aggregate stats across visible bases
  const summaryStats = useMemo(() => {
    const totalBases = filteredBases.length;
    const totalPits = filteredBases.reduce((acc, b) => acc + b.loadingPits, 0);
    const occupiedPits = filteredBases.reduce((acc, b) => acc + b.activePitsOccupied, 0);
    const pitPct = totalPits > 0 ? Math.round((occupiedPits / totalPits) * 100) : 0;
    const totalStorage = filteredBases.reduce((acc, b) => acc + b.retardantStorageGal, 0);
    const totalMix = filteredBases.reduce((acc, b) => acc + b.currentMixGal, 0);
    const mixPct = totalStorage > 0 ? Math.round((totalMix / totalStorage) * 100) : 0;
    const totalSorties = filteredBases.reduce((acc, b) => acc + b.activeSortiesToday, 0);
    const avgTurnaround = +(
      filteredBases.reduce((acc, b) => acc + b.turnaroundAvgMin, 0) / (totalBases || 1)
    ).toFixed(1);
    const totalAircraft = filteredBases.reduce((acc, b) => acc + b.assignedAircraft.length, 0);

    return {
      totalBases,
      totalPits,
      occupiedPits,
      pitPct,
      totalStorage,
      totalMix,
      mixPct,
      totalSorties,
      avgTurnaround,
      totalAircraft,
    };
  }, [filteredBases]);

  // Handle Quick Dispatch / Reroute Action
  const handleSimulateDispatch = (base: AirbaseResource) => {
    playBeep(1200, 'sawtooth', 0.1);
    onAddActivityLog?.({
      id: `dispatch-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      user: 'Nicholas Marnocha (Lead)',
      action: `Dispatched tactical reload sequence at ${base.name} (${base.code}) · Assigned Pit #2 · Pumping ${base.pumpingRateGpm} GPM`,
      category: 'Base Dispatch',
    });
  };

  // Custom Interactive Tooltip for Bar Chart
  const CustomBaseBarTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    const isOccupiedBreached = data.pitUtilizationPct >= 80;
    const isTurnaroundBreached = data.isTurnaroundBreached;

    return (
      <div className="bg-slate-950/95 backdrop-blur-md border border-cyan-500/80 rounded-xl p-3.5 shadow-2xl font-mono text-xs text-white max-w-sm space-y-2 animate-in fade-in zoom-in-95 pointer-events-none z-50">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <strong className="text-white font-bold">{data.code} · {data.name}</strong>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-900 text-cyan-300 border border-slate-800">
            {data.region}
          </span>
        </div>

        {/* Dynamic Metric Readout based on metricMode */}
        <div className="space-y-1.5 text-[11px]">
          {metricMode === 'pits' && (
            <div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Loading Pits Occupied:</span>
                <strong className={isOccupiedBreached ? 'text-amber-400' : 'text-cyan-300'}>
                  {data.activePitsOccupied} of {data.loadingPits} Pits ({data.pitUtilizationPct}%)
                </strong>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 mt-1 overflow-hidden border border-slate-800">
                <div
                  className={`h-full ${isOccupiedBreached ? 'bg-amber-400' : 'bg-cyan-400'}`}
                  style={{ width: `${data.pitUtilizationPct}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Pumping Speed: <strong className="text-slate-300">{data.pumpingRateGpm} GPM</strong> · Ready: {data.availablePits} Pits Free
              </div>
            </div>
          )}

          {metricMode === 'retardant' && (
            <div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Retardant Mix on Deck:</span>
                <strong className="text-amber-400">
                  {data.currentMixKGal}k / {data.storageCapacityKGal}k Gal ({data.retardantUtilizationPct}%)
                </strong>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 mt-1 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-red-500"
                  style={{ width: `${data.retardantUtilizationPct}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Formula: Phos-Chek MVP-Fx · Storage: {(data.retardantStorageGal).toLocaleString()} Gal Max
              </div>
            </div>
          )}

          {metricMode === 'aircraft' && (
            <div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Assigned Fleet:</span>
                <strong className="text-cyan-300">{data.assignedAircraftCount} Aircraft Staged</strong>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-1">
                <span>Tankers: <strong className="text-sky-300">{data.fixedWingCount}</strong> ·</span>
                <span>Helitack: <strong className="text-emerald-300">{data.helitackCount}</strong> ·</span>
                <span>Recon: <strong className="text-amber-300">{data.otherAircraftCount}</strong></span>
              </div>
            </div>
          )}

          {metricMode === 'turnaround' && (
            <div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Avg Turnaround Time:</span>
                <strong className={isTurnaroundBreached ? 'text-red-400' : 'text-emerald-400'}>
                  {data.turnaroundAvgMin} min (Target: {data.slaTargetMin} min)
                </strong>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {isTurnaroundBreached
                  ? `⚠️ Exceeding scenario benchmark by +${data.turnaroundDelta}m due to simulated ground queue surge.`
                  : `✓ Within scenario benchmark (${Math.abs(data.turnaroundDelta)}m margin vs target).`}
              </div>
            </div>
          )}

          {metricMode === 'sorties' && (
            <div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Sorties Flown Today:</span>
                <strong className="text-white text-xs">{data.activeSortiesToday} Missions</strong>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Estimated Retardant Dispersed: ~{(data.activeSortiesToday * 1800).toLocaleString()} Gallons
              </div>
            </div>
          )}
        </div>

        {/* Assigned Aircraft Chips */}
        {data.assignedAircraft && data.assignedAircraft.length > 0 && (
          <div className="pt-1.5 border-t border-slate-800/80">
            <span className="text-[9px] text-slate-500 uppercase block mb-1">Stationed Assets:</span>
            <div className="flex flex-wrap gap-1">
              {data.assignedAircraft.slice(0, 3).map((ac: string, idx: number) => (
                <span key={idx} className="px-1.5 py-0.2 rounded text-[9px] bg-slate-900 border border-slate-800 text-slate-300">
                  {ac}
                </span>
              ))}
              {data.assignedAircraft.length > 3 && (
                <span className="text-[9px] text-slate-500">+{data.assignedAircraft.length - 3} more</span>
              )}
            </div>
          </div>
        )}

        {/* Weather & Preparedness */}
        <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
          <span>WX: {data.weatherStation.tempF}°F · {data.weatherStation.windKts} kts {data.weatherStation.windDir}</span>
          <span className="text-cyan-400 font-bold">{data.preparednessLevel}</span>
        </div>

        <div className="text-[9px] text-cyan-400/90 pt-1 text-center font-mono">
          [CLICK BAR TO INSPECT BASE DOSSIER &amp; DISPATCH CONTROLS]
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-slate-950 border border-cyan-900/60 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden font-sans space-y-5">
      {/* Background Subtle Grid Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f49_1px,transparent_1px),linear-gradient(to_bottom,#082f49_1px,transparent_1px)] bg-[size:32px_32px] opacity-25 pointer-events-none" />

      {/* 1. Header with Live Status Ribbon */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Warehouse className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex flex-wrap items-center gap-2">
              <span>OPERATIONAL BASE RESOURCE ALLOCATION</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                DEMO SCENARIO · SYNTHETIC BENCHMARK
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                14 BASES MONITORED
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Calibrated simulation matrix: Loading pit occupancy, Phos-Chek stocks, fleet deployments, and scenario turnaround targets (derived from CAL FIRE Initial Attack response objectives).
          </p>
        </div>

        {/* Real-Time Aggregate Status Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>PITS:</span>
            <strong className="text-cyan-300 tabular-nums">
              {summaryStats.occupiedPits} / {summaryStats.totalPits} ({summaryStats.pitPct}%)
            </strong>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-2 shadow-sm">
            <Droplets className="w-3.5 h-3.5 text-amber-400" />
            <span>RETARDANT:</span>
            <strong className="text-amber-300 tabular-nums">
              {(summaryStats.totalMix / 1000).toFixed(0)}k / {(summaryStats.totalStorage / 1000).toFixed(0)}k Gal ({summaryStats.mixPct}%)
            </strong>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-2 shadow-sm">
            <Plane className="w-3.5 h-3.5 text-emerald-400" />
            <span>SORTIES:</span>
            <strong className="text-emerald-300 tabular-nums">{summaryStats.totalSorties} Today</strong>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-2 shadow-sm">
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
            <span>AVG SLA:</span>
            <strong className="text-sky-300 tabular-nums">{summaryStats.avgTurnaround} min</strong>
          </div>
        </div>
      </div>

      {/* 2. Controls Toolbar: Metric Mode, Region Filters & Sort Order */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
        {/* Metric Mode Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] text-slate-500 font-bold uppercase mr-1 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span>METRIC:</span>
          </span>
          {[
            { id: 'pits', label: 'Pit Occupancy' },
            { id: 'retardant', label: 'Retardant Stock (k Gal)' },
            { id: 'aircraft', label: 'Aircraft Fleet' },
            { id: 'turnaround', label: 'Turnaround Latency' },
            { id: 'sorties', label: 'Sorties Flown' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                setMetricMode(mode.id as BaseMetricMode);
                playBeep(mode.id === 'pits' ? 880 : 980, 'sine', 0.03);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap border ${
                metricMode === mode.id
                  ? 'bg-cyan-950 border-cyan-400 text-cyan-200 font-bold shadow-sm shadow-cyan-950'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Region Filter & Sort Group */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Region Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase mr-0.5 flex items-center gap-0.5">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>REGION:</span>
            </span>
            {[
              { id: 'all', label: 'All (14)' },
              { id: 'north', label: 'North (6)' },
              { id: 'south', label: 'South (5)' },
              { id: 'military', label: 'Mil (3)' },
            ].map((reg) => (
              <button
                key={reg.id}
                onClick={() => {
                  setRegionFilter(reg.id as BaseRegionFilter);
                  playBeep(750, 'sine', 0.03);
                }}
                className={`px-2 py-0.5 rounded text-[10px] transition-all cursor-pointer border ${
                  regionFilter === reg.id
                    ? 'bg-slate-800 border-slate-600 text-white font-bold'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-500 hover:text-slate-300'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>

          {/* Sort Order Selector */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as BaseSortOrder);
                playBeep(680, 'sine', 0.03);
              }}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="utilization">Sort: Utilization</option>
              <option value="turnaround">Sort: Fast Turnaround</option>
              <option value="capacity">Sort: Max Capacity</option>
              <option value="name">Sort: Code (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Recharts Bar Chart Container */}
      <div className="relative z-10 w-full h-80 bg-slate-950/80 p-3 rounded-xl border border-slate-900">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 18, right: 12, left: -8, bottom: 22 }}
            onClick={(state: any) => {
              const activePayload = (state as any)?.activePayload;
              if (activePayload && activePayload.length > 0) {
                const clickedBase = activePayload[0]?.payload?.rawBase;
                if (clickedBase) {
                  setSelectedBaseId(clickedBase.id);
                  onSelectBase?.(clickedBase);
                  playBeep(940, 'triangle', 0.06);
                }
              }
            }}
          >
            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" opacity={0.6} />

            <XAxis
              dataKey="code"
              stroke="#64748b"
              tick={({ x, y, payload }) => {
                const isSelected = chartData.find((d) => d.code === payload.value)?.id === selectedBaseId;
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0}
                      y={14}
                      textAnchor="middle"
                      fill={isSelected ? '#38bdf8' : '#94a3b8'}
                      fontSize={10}
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      fontFamily="JetBrains Mono, monospace"
                      className="cursor-pointer"
                    >
                      {payload.value}
                    </text>
                  </g>
                );
              }}
              tickLine={{ stroke: '#334155' }}
            />

            <YAxis
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              tickLine={{ stroke: '#334155' }}
              tickFormatter={(val) => {
                if (metricMode === 'retardant') return `${val}k`;
                if (metricMode === 'turnaround') return `${val}m`;
                return `${val}`;
              }}
            />

            <Tooltip content={<CustomBaseBarTooltip />} cursor={{ fill: 'rgba(6, 182, 212, 0.08)' }} />

            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '8px', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
            />

            {/* Reference Line for 20-min Scenario Benchmark Target in Turnaround mode */}
            {metricMode === 'turnaround' && (
              <ReferenceLine
                y={20.0}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: '20M SCENARIO TARGET (CONFIGURABLE)',
                  position: 'insideTopRight',
                  fill: '#ef4444',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono',
                  fontWeight: 'bold',
                }}
              />
            )}

            {/* Bars for METRIC: PITS */}
            {metricMode === 'pits' && [
              <Bar
                key="occupiedPits"
                name="Occupied Pits"
                dataKey="activePitsOccupied"
                stackId="pits"
                fill="#38bdf8"
                radius={[0, 0, 0, 0]}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.id === selectedBaseId ? '#38bdf8' : entry.pitUtilizationPct >= 75 ? '#f59e0b' : '#0284c7'}
                    stroke={entry.id === selectedBaseId ? '#ffffff' : 'none'}
                    strokeWidth={1.5}
                    className="cursor-pointer transition-all hover:opacity-85"
                  />
                ))}
              </Bar>,
              <Bar
                key="availablePits"
                name="Available Open Pits"
                dataKey="availablePits"
                stackId="pits"
                fill="#1e293b"
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.id === selectedBaseId ? '#334155' : '#0f172a'}
                    stroke={entry.id === selectedBaseId ? '#0284c7' : 'none'}
                    className="cursor-pointer transition-all hover:opacity-85"
                  />
                ))}
              </Bar>,
            ]}

            {/* Bars for METRIC: RETARDANT */}
            {metricMode === 'retardant' && [
              <Bar
                key="mixKGal"
                name="Current Mix on Deck (k Gal)"
                dataKey="currentMixKGal"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.id === selectedBaseId ? '#fbbf24' : '#d97706'}
                    stroke={entry.id === selectedBaseId ? '#ffffff' : 'none'}
                    strokeWidth={1.5}
                    className="cursor-pointer transition-all hover:opacity-85"
                  />
                ))}
              </Bar>,
              <Bar
                key="storageKGal"
                name="Total Tank Storage (k Gal)"
                dataKey="storageCapacityKGal"
                fill="#1e293b"
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.id === selectedBaseId ? '#334155' : '#1e293b'}
                    className="cursor-pointer transition-all hover:opacity-85"
                  />
                ))}
              </Bar>,
            ]}

            {/* Bars for METRIC: AIRCRAFT FLEET */}
            {metricMode === 'aircraft' && [
              <Bar
                key="fixedWing"
                name="Fixed-Wing Airtankers"
                dataKey="fixedWingCount"
                stackId="ac"
                fill="#38bdf8"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.id === selectedBaseId ? '#38bdf8' : '#0284c7'}
                    className="cursor-pointer"
                  />
                ))}
              </Bar>,
              <Bar
                key="helitack"
                name="Helitack Helicopters"
                dataKey="helitackCount"
                stackId="ac"
                fill="#10b981"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.id === selectedBaseId ? '#34d399' : '#059669'}
                    className="cursor-pointer"
                  />
                ))}
              </Bar>,
              <Bar
                key="otherAc"
                name="Lead & Recon"
                dataKey="otherAircraftCount"
                stackId="ac"
                fill="#a855f7"
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.id === selectedBaseId ? '#c084fc' : '#7e22ce'}
                    className="cursor-pointer"
                  />
                ))}
              </Bar>,
            ]}

            {/* Bars for METRIC: TURNAROUND */}
            {metricMode === 'turnaround' && (
              <Bar
                name="Avg Turnaround (min)"
                dataKey="turnaroundAvgMin"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={
                      entry.id === selectedBaseId
                        ? entry.isTurnaroundBreached
                          ? '#ef4444'
                          : '#10b981'
                        : entry.isTurnaroundBreached
                        ? '#dc2626'
                        : '#059669'
                    }
                    stroke={entry.id === selectedBaseId ? '#ffffff' : 'none'}
                    strokeWidth={1.5}
                    className="cursor-pointer transition-all hover:opacity-85"
                  />
                ))}
              </Bar>
            )}

            {/* Bars for METRIC: SORTIES */}
            {metricMode === 'sorties' && (
              <Bar
                name="Missions / Sorties Flown Today"
                dataKey="activeSortiesToday"
                fill="#38bdf8"
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={entry.id === selectedBaseId ? '#38bdf8' : '#0369a1'}
                    stroke={entry.id === selectedBaseId ? '#ffffff' : 'none'}
                    strokeWidth={1.5}
                    className="cursor-pointer transition-all hover:opacity-85"
                  />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Quick Base Selector Buttons (Jump to any base) */}
      <div className="relative z-10 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono no-scrollbar">
        <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0 mr-1">BASES:</span>
        {chartData.map((b) => {
          const isSelected = b.id === selectedBaseId;
          return (
            <button
              key={b.id}
              onClick={() => {
                setSelectedBaseId(b.id);
                onSelectBase?.(b.rawBase);
                playBeep(880, 'sine', 0.03);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap border shrink-0 text-[11px] font-mono flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-cyan-950 border-cyan-400 text-white font-bold shadow-md shadow-cyan-950 ring-1 ring-cyan-500/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-slate-600'}`} />
              <span>{b.code}</span>
              <span className="text-[9px] opacity-60">({b.activePitsOccupied}/{b.loadingPits}p)</span>
            </button>
          );
        })}
      </div>

      {/* 5. Selected Base Detailed Tactical Logistics Dossier */}
      {selectedBase && (
        <div className="relative z-10 p-4 sm:p-5 rounded-xl bg-slate-950/95 border border-cyan-500/60 shadow-xl text-xs font-mono space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {selectedBase.agency} · {selectedBase.region}
                </span>
                <span className="text-slate-500 text-[11px]">
                  ICAO / FAA CODE: <strong className="text-white">{selectedBase.code}</strong>
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white mt-0.5 tracking-wide">
                {selectedBase.name}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              {/* Live Camera View Trigger */}
              {selectedBase.cameraTitle && (
                <button
                  onClick={() => {
                    onOpenLiveCamera?.(selectedBase);
                    playBeep(1100, 'sine', 0.05);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/60 text-cyan-200 text-xs font-mono transition-all cursor-pointer shadow-sm hover:border-cyan-400"
                  title="Open high-definition optical ramp camera feed"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>Ramp Cam ({selectedBase.cameraType})</span>
                </button>
              )}

              {/* Simulate Dispatch Action */}
              <button
                onClick={() => handleSimulateDispatch(selectedBase)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md shadow-cyan-500/20"
              >
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Reload Dispatch</span>
              </button>
            </div>
          </div>

          {/* Operational Metrics 4-Col Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* 1. Loading Pits Occupancy */}
            <div className="p-3 rounded-lg bg-black/60 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block uppercase">Pits Occupancy:</span>
              <div className="text-sm font-bold text-cyan-300 flex items-center justify-between">
                <span>{selectedBase.activePitsOccupied} of {selectedBase.loadingPits} Pits</span>
                <span className="text-[11px] text-slate-400">
                  {Math.round((selectedBase.activePitsOccupied / selectedBase.loadingPits) * 100)}%
                </span>
              </div>
              {/* Visual Pit Dots */}
              <div className="flex items-center gap-1.5 pt-1">
                {Array.from({ length: selectedBase.loadingPits }).map((_, i) => {
                  const isOccupied = i < selectedBase.activePitsOccupied;
                  return (
                    <span
                      key={i}
                      className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold ${
                        isOccupied ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-500'
                      }`}
                      title={`Pit #${i + 1}: ${isOccupied ? 'OCCUPIED' : 'OPEN'}`}
                    >
                      {i + 1}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 2. Retardant Reserves */}
            <div className="p-3 rounded-lg bg-black/60 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block uppercase">Retardant Reserves:</span>
              <div className="text-sm font-bold text-amber-400 flex items-center justify-between">
                <span>{(selectedBase.currentMixGal / 1000).toFixed(0)}k Gal</span>
                <span className="text-[11px] text-slate-400">
                  {Math.round((selectedBase.currentMixGal / selectedBase.retardantStorageGal) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800 mt-1">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: `${(selectedBase.currentMixGal / selectedBase.retardantStorageGal) * 100}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-500 block">Pumping: {selectedBase.pumpingRateGpm} GPM</span>
            </div>

            {/* 3. Turnaround SLA Performance */}
            <div className="p-3 rounded-lg bg-black/60 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block uppercase">Turnaround Performance:</span>
              <div className="text-sm font-bold text-white flex items-center justify-between">
                <span className={selectedBase.turnaroundAvgMin > selectedBase.slaTargetMin ? 'text-red-400' : 'text-emerald-400'}>
                  {selectedBase.turnaroundAvgMin} min Avg
                </span>
                <span className="text-[10px] text-slate-500">Target: {selectedBase.slaTargetMin}m</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {selectedBase.turnaroundAvgMin <= selectedBase.slaTargetMin ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Compliant with SLA</span>
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Queue Congestion Warning</span>
                  </span>
                )}
              </div>
            </div>

            {/* 4. Airfield & Weather Station */}
            <div className="p-3 rounded-lg bg-black/60 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block uppercase">Airfield &amp; Weather:</span>
              <div className="text-slate-200 text-xs font-bold">
                Runway: {selectedBase.runwayFt.toLocaleString()}&apos; MSL {selectedBase.elevationFt}&apos;
              </div>
              <div className="text-[10px] text-slate-400">
                WX: {selectedBase.weatherStation.tempF}°F · {selectedBase.weatherStation.windKts} kts {selectedBase.weatherStation.windDir} · {selectedBase.weatherStation.rhPct}% RH
              </div>
              <span className="text-[9px] text-cyan-400 block font-bold">PL: {selectedBase.preparednessLevel}</span>
            </div>
          </div>

          {/* Assigned Aircraft Fleet Chips */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">
                Assigned Aircraft ({selectedBase.assignedAircraft.length}):
              </span>
              {selectedBase.assignedAircraft.map((ac, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-cyan-300 font-mono flex items-center gap-1"
                >
                  <Plane className="w-2.5 h-2.5 text-cyan-400" />
                  <span>{ac}</span>
                </span>
              ))}
            </div>

            <div className="text-[10px] text-slate-500">
              Fuel Reserves: {(selectedBase.currentFuelGal).toLocaleString()} / {(selectedBase.fuelCapacityGal).toLocaleString()} Gal Jet-A
            </div>
          </div>
        </div>
      )}

      {/* Data Provenance & Operational Benchmark Disclosure */}
      <div className="pt-3 border-t border-slate-900/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-slate-400">Data Provenance:</strong> Calibrated synthetic simulation data modeled on historical CAL FIRE &amp; USFS facility profiles. Not a live CAD/AVL feed.
          </span>
        </div>
        <div className="text-slate-400">
          <span>*20m Target: User-configurable scenario benchmark derived from CAL FIRE Initial Attack response planning objectives.</span>
        </div>
      </div>
    </div>
  );
};
