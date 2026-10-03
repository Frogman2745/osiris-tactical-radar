import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Flame,
  Activity,
  Users,
  TrendingUp,
  Sparkles,
  Info,
  ChevronRight,
  Filter,
  BarChart2,
  Zap,
  CheckCircle2
} from 'lucide-react';

export interface HourlyInteractionCell {
  dayIndex: number; // 0: Mon, 1: Tue, ... 6: Sun
  dayName: string;
  hour: number; // 0 to 23
  intensity: number; // 0 to 100
  totalEvents: number;
  activeUsers: number;
  primaryAction: string;
  isPeak: boolean;
}

// Generate realistic 7-day x 24-hour interaction heat data
// Peak dispatch hours are typically 11:00 to 17:00 (11 AM to 5 PM) when California wildfire sorties peak
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const generateWeeklyHourlyHeatmap = (): HourlyInteractionCell[] => {
  const cells: HourlyInteractionCell[] = [];

  DAYS.forEach((day, dIdx) => {
    for (let h = 0; h < 24; h++) {
      // Baseline diurnal operational curve
      let base = 8;

      // Night hours (00:00 - 05:00)
      if (h >= 0 && h < 6) {
        base = 5 + (h % 3) * 2;
      }
      // Morning ramp-up (06:00 - 10:00)
      else if (h >= 6 && h < 11) {
        base = 25 + (h - 6) * 12;
      }
      // Peak operational war room & wildfire dispatch (11:00 - 17:00)
      else if (h >= 11 && h < 18) {
        base = 72 + Math.sin((h - 11) * 0.5) * 22;
        // Wednesday and Thursday afternoon fire weather peaks
        if (dIdx === 2 || dIdx === 3 || dIdx === 4) {
          base += 12;
        }
      }
      // Evening wind-down (18:00 - 21:00)
      else if (h >= 18 && h < 22) {
        base = 45 - (h - 18) * 8;
      }
      // Late night operations
      else {
        base = 15;
      }

      // Weekend slight modulation
      if (dIdx >= 5) {
        base = Math.max(12, base * 0.88);
      }

      const intensity = Math.min(100, Math.max(2, Math.round(base)));
      const totalEvents = Math.round(intensity * 14.8 + (h * 3));
      const activeUsers = Math.max(1, Math.round(intensity * 0.28));
      const isPeak = intensity >= 80;

      let primaryAction = 'Automated Telemetry Polling';
      if (intensity >= 85) {
        primaryAction = 'Sortie CP-SAT Dispatch & Anomaly Mitigations';
      } else if (intensity >= 65) {
        primaryAction = 'Live Geospatial Vector Tracking';
      } else if (intensity >= 40) {
        primaryAction = 'Schema Drift & Pipeline ETL Validation';
      }

      cells.push({
        dayIndex: dIdx,
        dayName: day,
        hour: h,
        intensity,
        totalEvents,
        activeUsers,
        primaryAction,
        isPeak,
      });
    }
  });

  return cells;
};

interface UserActivityHeatmapProps {
  onSelectTimeSlot?: (cell: HourlyInteractionCell) => void;
  className?: string;
}

export const UserActivityHeatmap: React.FC<UserActivityHeatmapProps> = ({
  onSelectTimeSlot,
  className = '',
}) => {
  const [data] = useState<HourlyInteractionCell[]>(generateWeeklyHourlyHeatmap);
  const [selectedCell, setSelectedCell] = useState<HourlyInteractionCell>(() => {
    // Default to Wednesday 14:00 (peak operational window)
    return (
      data.find((c) => c.dayIndex === 2 && c.hour === 14) || data[0]
    );
  });
  const [filterMode, setFilterMode] = useState<'all' | 'peaks' | 'business_hours'>('all');
  const [hoveredCell, setHoveredCell] = useState<HourlyInteractionCell | null>(null);

  // Intensity color mapper: Jet / Cyberpunk theme
  const getCellColor = (intensity: number) => {
    if (intensity >= 88) return 'bg-red-500 text-white';
    if (intensity >= 72) return 'bg-orange-500 text-slate-950';
    if (intensity >= 55) return 'bg-amber-400 text-slate-950';
    if (intensity >= 35) return 'bg-cyan-500/80 text-slate-950';
    if (intensity >= 20) return 'bg-cyan-900/60 text-cyan-200';
    return 'bg-slate-900 text-slate-500 border border-slate-800/80';
  };

  // Filter cells if needed
  const peakCells = useMemo(() => data.filter((c) => c.isPeak), [data]);
  const totalWeeklyInteractions = useMemo(() => data.reduce((acc, c) => acc + c.totalEvents, 0), [data]);
  const avgHourlyEvents = Math.round(totalWeeklyInteractions / (7 * 24));

  const hoursList = Array.from({ length: 24 }, (_, i) => i);

  const displayCell = hoveredCell || selectedCell;

  return (
    <div className={`bg-slate-950/80 border border-slate-800 rounded-xl p-5 font-mono text-slate-200 shadow-xl space-y-5 ${className}`}>
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-950/80 border border-orange-500/40 text-orange-400">
            <Calendar className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                HOURLY USER INTERACTION INTENSITY & OPERATIONAL PEAK HEATMAP
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-orange-950 border border-orange-500/50 text-orange-300 font-bold">
                7-DAY MATRIX (168h)
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Aggregates war room dashboard clicks, CP-SAT solve runs, anomaly resolution mitigations, and WebSocket events across 24-hour cycles.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded uppercase font-bold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full 24/7
            </button>
            <button
              onClick={() => setFilterMode('peaks')}
              className={`px-2.5 py-1 rounded uppercase font-bold transition-all cursor-pointer ${
                filterMode === 'peaks'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Peaks Only (&gt;80%)
            </button>
            <button
              onClick={() => setFilterMode('business_hours')}
              className={`px-2.5 py-1 rounded uppercase font-bold transition-all cursor-pointer ${
                filterMode === 'business_hours'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Air Ops Core (08-20h)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Primary Peak Hours</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-bold text-orange-400 font-mono">13:00 - 16:30</span>
            <span className="text-[10px] text-slate-400">PST</span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans block mt-0.5">Afternoon fire spread sorties</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Peak Windows Identified</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-red-400 font-mono">{peakCells.length} Hours</span>
            <span className="text-[10px] text-slate-400 font-mono">({Math.round((peakCells.length / 168) * 100)}% of week)</span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans block mt-0.5">Auto-scaler hot standby</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Average Interaction Rate</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-bold text-cyan-300 font-mono">{avgHourlyEvents}</span>
            <span className="text-[10px] text-slate-400">actions / hour</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-sans block mt-0.5">14.8 events/intensity unit</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Weekly Total Activity</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-bold text-white font-mono">{totalWeeklyInteractions.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400">events</span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans block mt-0.5">Telemetry, clicks & edits</span>
        </div>
      </div>

      {/* The 7x24 Matrix Grid View */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[760px] space-y-1.5">
          {/* Hour header label row */}
          <div className="grid grid-cols-[56px_repeat(24,1fr)] gap-1 text-[10px] text-slate-500 text-center font-mono">
            <div className="text-left pl-1">DAY</div>
            {hoursList.map((h) => {
              const isBusinessHour = h >= 8 && h <= 20;
              const isFaded = filterMode === 'business_hours' && !isBusinessHour;

              return (
                <div
                  key={h}
                  className={`truncate ${isFaded ? 'opacity-30' : ''} ${h % 3 === 0 ? 'text-slate-300 font-bold' : ''}`}
                >
                  {h < 10 ? `0${h}` : `${h}`}
                </div>
              );
            })}
          </div>

          {/* 7 Days Matrix Rows */}
          {DAYS.map((day, dIdx) => {
            const dayCells = data.filter((c) => c.dayIndex === dIdx);

            return (
              <div key={day} className="grid grid-cols-[56px_repeat(24,1fr)] gap-1 items-center">
                {/* Day label */}
                <span className="text-xs font-bold text-slate-300 pl-1">{day}</span>

                {/* 24 Hourly heat blocks */}
                {dayCells.map((cell) => {
                  const isSelected = selectedCell.dayIndex === cell.dayIndex && selectedCell.hour === cell.hour;
                  const isBusinessHour = cell.hour >= 8 && cell.hour <= 20;
                  const isFaded =
                    (filterMode === 'peaks' && !cell.isPeak) ||
                    (filterMode === 'business_hours' && !isBusinessHour);

                  return (
                    <button
                      key={cell.hour}
                      onClick={() => {
                        setSelectedCell(cell);
                        onSelectTimeSlot?.(cell);
                      }}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${DAY_LABELS[cell.dayIndex]} at ${cell.hour}:00 - Intensity: ${cell.intensity}%, ${cell.totalEvents} events`}
                      className={`h-7 rounded transition-all cursor-pointer relative group flex items-center justify-center text-[10px] font-bold ${getCellColor(
                        cell.intensity
                      )} ${isFaded ? 'opacity-20' : 'hover:scale-110 hover:z-20'} ${
                        isSelected ? 'ring-2 ring-white scale-105 z-10 shadow-lg' : ''
                      }`}
                    >
                      {cell.intensity >= 80 && (
                        <span className="text-[9px] font-mono leading-none">
                          {cell.intensity}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-300">INTERACTION INTENSITY:</span>
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-800" />
            <span>&lt;20% Low</span>
            <span className="w-3.5 h-3.5 rounded bg-cyan-900/60" />
            <span className="w-3.5 h-3.5 rounded bg-cyan-500/80" />
            <span>Moderate</span>
            <span className="w-3.5 h-3.5 rounded bg-amber-400" />
            <span className="w-3.5 h-3.5 rounded bg-orange-500" />
            <span>High</span>
            <span className="w-3.5 h-3.5 rounded bg-red-500" />
            <span className="text-red-400 font-bold">&gt;88% Critical Peak</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Hover or click any cell to inspect hourly workload telemetry
        </div>
      </div>

      {/* Selected / Hovered Hour Inspector Card */}
      {displayCell && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-900/50 text-xs animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white text-sm">
                {DAY_LABELS[displayCell.dayIndex]} @ {displayCell.hour < 10 ? `0${displayCell.hour}` : displayCell.hour}:00 - {displayCell.hour < 10 ? `0${displayCell.hour}` : displayCell.hour}:59 PST
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                displayCell.isPeak
                  ? 'bg-red-950 text-red-300 border border-red-500/50'
                  : displayCell.intensity >= 55
                  ? 'bg-orange-950 text-orange-300 border border-orange-500/50'
                  : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              }`}>
                {displayCell.intensity}% INTENSITY · {displayCell.isPeak ? 'PEAK FLIGHT WINDOW' : 'NOMINAL LOAD'}
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
              <span>Concurrent Users: <strong className="text-white">{displayCell.activeUsers}</strong></span>
              <span>Total Dispatches: <strong className="text-cyan-300">{displayCell.totalEvents}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Primary Workload Activity</span>
              <span className="text-white font-bold block mt-0.5">{displayCell.primaryAction}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Cluster Autoscaler Recommendation</span>
              <span className="text-cyan-300 font-bold block mt-0.5">
                {displayCell.isPeak ? 'Hot-Standby: 4-6 Worker Pods' : 'Baseline: 2 Worker Pods'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Operational Priority</span>
              <span className={`font-bold block mt-0.5 ${displayCell.isPeak ? 'text-red-400' : 'text-emerald-400'}`}>
                {displayCell.isPeak ? 'Tier 1 Priority: Low Latency Dispatch' : 'Tier 3 Priority: Scheduled ETL Sync'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
