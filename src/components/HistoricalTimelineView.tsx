import React, { useState, useMemo } from 'react';
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
  Brush,
} from 'recharts';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Flame,
  Info,
  Layers,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ChevronRight,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { ModuleResourceMetric } from '../types/resourceHeatmap';

export interface TimelineDataPoint {
  timestamp: string;
  timeLabel: string;
  hour: number;
  overallHeat: number;
  etlLoad: number;
  predictiveAiLoad: number;
  analyticsSqlLoad: number;
  realtimeWsLoad: number;
  reportingLoad: number;
  chaosSandboxLoad: number;
  spikeEvent?: {
    type: 'surge' | 'dip' | 'incident' | 'batch_rollover';
    title: string;
    description: string;
    affectedModule: string;
    magnitudePct: number;
    severity: 'critical' | 'warning' | 'info';
  };
}

// 48-Hour Historical Dataset with Temporal Patterns (diurnal morning rush, shift change dip, batch rollover, wildfire surge)
export const HISTORICAL_RESOURCE_TIMELINE_DATA: TimelineDataPoint[] = [
  // Day 1 - Night hours (00:00 - 05:00)
  { timestamp: 'Day 1 00:00', timeLabel: '00:00', hour: 0, overallHeat: 28, etlLoad: 32, predictiveAiLoad: 24, analyticsSqlLoad: 16, realtimeWsLoad: 22, reportingLoad: 10, chaosSandboxLoad: 18 },
  { timestamp: 'Day 1 01:00', timeLabel: '01:00', hour: 1, overallHeat: 24, etlLoad: 28, predictiveAiLoad: 20, analyticsSqlLoad: 14, realtimeWsLoad: 18, reportingLoad: 8, chaosSandboxLoad: 15 },
  { timestamp: 'Day 1 02:00', timeLabel: '02:00', hour: 2, overallHeat: 38, etlLoad: 78, predictiveAiLoad: 22, analyticsSqlLoad: 35, realtimeWsLoad: 16, reportingLoad: 26, chaosSandboxLoad: 16, 
    spikeEvent: { type: 'batch_rollover', title: 'Nightly Partition Archival', description: 'Automatic Postgres partitioned table rotation and vacuum analyze.', affectedModule: 'ETL Pipeline & Ingestion Engine', magnitudePct: 78, severity: 'info' }
  },
  { timestamp: 'Day 1 03:00', timeLabel: '03:00', hour: 3, overallHeat: 22, etlLoad: 25, predictiveAiLoad: 18, analyticsSqlLoad: 12, realtimeWsLoad: 15, reportingLoad: 7, chaosSandboxLoad: 14 },
  { timestamp: 'Day 1 04:00', timeLabel: '04:00', hour: 4, overallHeat: 19, etlLoad: 20, predictiveAiLoad: 16, analyticsSqlLoad: 10, realtimeWsLoad: 14, reportingLoad: 6, chaosSandboxLoad: 12,
    spikeEvent: { type: 'dip', title: 'Operational Quiescence Dip', description: 'System-wide minimum baseline before morning shift briefing ingestion.', affectedModule: 'All Modules', magnitudePct: -32, severity: 'info' }
  },
  { timestamp: 'Day 1 05:00', timeLabel: '05:00', hour: 5, overallHeat: 26, etlLoad: 30, predictiveAiLoad: 22, analyticsSqlLoad: 16, realtimeWsLoad: 20, reportingLoad: 12, chaosSandboxLoad: 16 },
  
  // Day 1 - Morning ramp (06:00 - 11:00)
  { timestamp: 'Day 1 06:00', timeLabel: '06:00', hour: 6, overallHeat: 42, etlLoad: 52, predictiveAiLoad: 40, analyticsSqlLoad: 32, realtimeWsLoad: 35, reportingLoad: 24, chaosSandboxLoad: 25 },
  { timestamp: 'Day 1 07:00', timeLabel: '07:00', hour: 7, overallHeat: 64, etlLoad: 74, predictiveAiLoad: 62, analyticsSqlLoad: 48, realtimeWsLoad: 54, reportingLoad: 45, chaosSandboxLoad: 42,
    spikeEvent: { type: 'surge', title: 'CAL FIRE Morning Shift Handover Surge', description: 'Simultaneous ingestion of 18 regional CAL FIRE command log dispatch packages.', affectedModule: 'ETL Pipeline & Ingestion Engine', magnitudePct: 74, severity: 'warning' }
  },
  { timestamp: 'Day 1 08:00', timeLabel: '08:00', hour: 8, overallHeat: 78, etlLoad: 82, predictiveAiLoad: 84, analyticsSqlLoad: 62, realtimeWsLoad: 64, reportingLoad: 58, chaosSandboxLoad: 55 },
  { timestamp: 'Day 1 09:00', timeLabel: '09:00', hour: 9, overallHeat: 84, etlLoad: 86, predictiveAiLoad: 92, analyticsSqlLoad: 68, realtimeWsLoad: 68, reportingLoad: 60, chaosSandboxLoad: 62 },
  { timestamp: 'Day 1 10:00', timeLabel: '10:00', hour: 10, overallHeat: 86, etlLoad: 88, predictiveAiLoad: 94, analyticsSqlLoad: 70, realtimeWsLoad: 72, reportingLoad: 62, chaosSandboxLoad: 68 },
  { timestamp: 'Day 1 11:00', timeLabel: '11:00', hour: 11, overallHeat: 82, etlLoad: 84, predictiveAiLoad: 90, analyticsSqlLoad: 66, realtimeWsLoad: 70, reportingLoad: 58, chaosSandboxLoad: 64 },

  // Day 1 - Afternoon Peak & Surge (12:00 - 17:00)
  { timestamp: 'Day 1 12:00', timeLabel: '12:00', hour: 12, overallHeat: 76, etlLoad: 78, predictiveAiLoad: 82, analyticsSqlLoad: 60, realtimeWsLoad: 66, reportingLoad: 52, chaosSandboxLoad: 60 },
  { timestamp: 'Day 1 13:00', timeLabel: '13:00', hour: 13, overallHeat: 80, etlLoad: 82, predictiveAiLoad: 86, analyticsSqlLoad: 64, realtimeWsLoad: 69, reportingLoad: 55, chaosSandboxLoad: 65 },
  { timestamp: 'Day 1 14:00', timeLabel: '14:00', hour: 14, overallHeat: 94, etlLoad: 92, predictiveAiLoad: 98, analyticsSqlLoad: 82, realtimeWsLoad: 85, reportingLoad: 68, chaosSandboxLoad: 78,
    spikeEvent: { type: 'incident', title: 'Extreme Wildfire Thermal Surge (Shasta Fire)', description: 'CP-SAT optimization solver overwhelmed by 4 simultaneous VLAT emergency re-vectorings.', affectedModule: 'CP-SAT Optimization & Flight Models', magnitudePct: 98, severity: 'critical' }
  },
  { timestamp: 'Day 1 15:00', timeLabel: '15:00', hour: 15, overallHeat: 91, etlLoad: 89, predictiveAiLoad: 95, analyticsSqlLoad: 78, realtimeWsLoad: 82, reportingLoad: 64, chaosSandboxLoad: 76 },
  { timestamp: 'Day 1 16:00', timeLabel: '16:00', hour: 16, overallHeat: 85, etlLoad: 84, predictiveAiLoad: 89, analyticsSqlLoad: 72, realtimeWsLoad: 78, reportingLoad: 58, chaosSandboxLoad: 70 },
  { timestamp: 'Day 1 17:00', timeLabel: '17:00', hour: 17, overallHeat: 74, etlLoad: 76, predictiveAiLoad: 78, analyticsSqlLoad: 62, realtimeWsLoad: 68, reportingLoad: 50, chaosSandboxLoad: 58 },

  // Day 1 - Evening unwind (18:00 - 23:00)
  { timestamp: 'Day 1 18:00', timeLabel: '18:00', hour: 18, overallHeat: 68, etlLoad: 70, predictiveAiLoad: 72, analyticsSqlLoad: 56, realtimeWsLoad: 60, reportingLoad: 46, chaosSandboxLoad: 52 },
  { timestamp: 'Day 1 19:00', timeLabel: '19:00', hour: 19, overallHeat: 58, etlLoad: 62, predictiveAiLoad: 60, analyticsSqlLoad: 48, realtimeWsLoad: 52, reportingLoad: 38, chaosSandboxLoad: 45 },
  { timestamp: 'Day 1 20:00', timeLabel: '20:00', hour: 20, overallHeat: 48, etlLoad: 50, predictiveAiLoad: 48, analyticsSqlLoad: 38, realtimeWsLoad: 42, reportingLoad: 32, chaosSandboxLoad: 38 },
  { timestamp: 'Day 1 21:00', timeLabel: '21:00', hour: 21, overallHeat: 40, etlLoad: 42, predictiveAiLoad: 38, analyticsSqlLoad: 30, realtimeWsLoad: 35, reportingLoad: 25, chaosSandboxLoad: 30 },
  { timestamp: 'Day 1 22:00', timeLabel: '22:00', hour: 22, overallHeat: 32, etlLoad: 34, predictiveAiLoad: 30, analyticsSqlLoad: 22, realtimeWsLoad: 28, reportingLoad: 18, chaosSandboxLoad: 24 },
  { timestamp: 'Day 1 23:00', timeLabel: '23:00', hour: 23, overallHeat: 28, etlLoad: 30, predictiveAiLoad: 26, analyticsSqlLoad: 18, realtimeWsLoad: 24, reportingLoad: 14, chaosSandboxLoad: 20 },

  // Day 2 - Night hours (00:00 - 05:00)
  { timestamp: 'Day 2 00:00', timeLabel: '00:00', hour: 0, overallHeat: 25, etlLoad: 28, predictiveAiLoad: 22, analyticsSqlLoad: 15, realtimeWsLoad: 20, reportingLoad: 11, chaosSandboxLoad: 17 },
  { timestamp: 'Day 2 01:00', timeLabel: '01:00', hour: 1, overallHeat: 23, etlLoad: 26, predictiveAiLoad: 20, analyticsSqlLoad: 14, realtimeWsLoad: 18, reportingLoad: 9, chaosSandboxLoad: 15 },
  { timestamp: 'Day 2 02:00', timeLabel: '02:00', hour: 2, overallHeat: 40, etlLoad: 82, predictiveAiLoad: 25, analyticsSqlLoad: 38, realtimeWsLoad: 17, reportingLoad: 28, chaosSandboxLoad: 18,
    spikeEvent: { type: 'batch_rollover', title: 'Nightly Vector Cache Re-Index', description: 'Polars in-memory parquet vector database compacting index chunks.', affectedModule: 'SQL Analytics & Python Polars Engine', magnitudePct: 82, severity: 'info' }
  },
  { timestamp: 'Day 2 03:00', timeLabel: '03:00', hour: 3, overallHeat: 21, etlLoad: 24, predictiveAiLoad: 18, analyticsSqlLoad: 13, realtimeWsLoad: 15, reportingLoad: 8, chaosSandboxLoad: 14 },
  { timestamp: 'Day 2 04:00', timeLabel: '04:00', hour: 4, overallHeat: 18, etlLoad: 20, predictiveAiLoad: 15, analyticsSqlLoad: 11, realtimeWsLoad: 13, reportingLoad: 6, chaosSandboxLoad: 12 },
  { timestamp: 'Day 2 05:00', timeLabel: '05:00', hour: 5, overallHeat: 24, etlLoad: 28, predictiveAiLoad: 21, analyticsSqlLoad: 15, realtimeWsLoad: 19, reportingLoad: 10, chaosSandboxLoad: 16 },

  // Day 2 - Morning peak (06:00 - 11:00)
  { timestamp: 'Day 2 06:00', timeLabel: '06:00', hour: 6, overallHeat: 44, etlLoad: 55, predictiveAiLoad: 42, analyticsSqlLoad: 34, realtimeWsLoad: 38, reportingLoad: 26, chaosSandboxLoad: 28 },
  { timestamp: 'Day 2 07:00', timeLabel: '07:00', hour: 7, overallHeat: 68, etlLoad: 78, predictiveAiLoad: 66, analyticsSqlLoad: 52, realtimeWsLoad: 58, reportingLoad: 48, chaosSandboxLoad: 46 },
  { timestamp: 'Day 2 08:00', timeLabel: '08:00', hour: 8, overallHeat: 80, etlLoad: 85, predictiveAiLoad: 88, analyticsSqlLoad: 65, realtimeWsLoad: 66, reportingLoad: 60, chaosSandboxLoad: 58 },
  { timestamp: 'Day 2 09:00', timeLabel: '09:00', hour: 9, overallHeat: 88, etlLoad: 90, predictiveAiLoad: 95, analyticsSqlLoad: 72, realtimeWsLoad: 74, reportingLoad: 65, chaosSandboxLoad: 66 },
  { timestamp: 'Day 2 10:00', timeLabel: '10:00', hour: 10, overallHeat: 87, etlLoad: 89, predictiveAiLoad: 93, analyticsSqlLoad: 71, realtimeWsLoad: 73, reportingLoad: 63, chaosSandboxLoad: 65 },
  { timestamp: 'Day 2 11:00', timeLabel: '11:00', hour: 11, overallHeat: 81, etlLoad: 83, predictiveAiLoad: 88, analyticsSqlLoad: 64, realtimeWsLoad: 68, reportingLoad: 56, chaosSandboxLoad: 62 },

  // Day 2 - Afternoon & Chaos Drill (12:00 - 17:00)
  { timestamp: 'Day 2 12:00', timeLabel: '12:00', hour: 12, overallHeat: 75, etlLoad: 77, predictiveAiLoad: 80, analyticsSqlLoad: 58, realtimeWsLoad: 64, reportingLoad: 50, chaosSandboxLoad: 58 },
  { timestamp: 'Day 2 13:00', timeLabel: '13:00', hour: 13, overallHeat: 79, etlLoad: 80, predictiveAiLoad: 85, analyticsSqlLoad: 62, realtimeWsLoad: 67, reportingLoad: 54, chaosSandboxLoad: 64 },
  { timestamp: 'Day 2 14:00', timeLabel: '14:00', hour: 14, overallHeat: 92, etlLoad: 88, predictiveAiLoad: 96, analyticsSqlLoad: 78, realtimeWsLoad: 80, reportingLoad: 66, chaosSandboxLoad: 94,
    spikeEvent: { type: 'surge', title: 'Automated Chaos Latency Drill', description: 'Fault injection test injecting 140ms latency across California airbase gateways.', affectedModule: 'Chaos Engineering & Latency Probes', magnitudePct: 94, severity: 'warning' }
  },
  { timestamp: 'Day 2 15:00', timeLabel: '15:00', hour: 15, overallHeat: 88, etlLoad: 86, predictiveAiLoad: 92, analyticsSqlLoad: 74, realtimeWsLoad: 78, reportingLoad: 62, chaosSandboxLoad: 85 },
  { timestamp: 'Day 2 16:00', timeLabel: '16:00', hour: 16, overallHeat: 82, etlLoad: 81, predictiveAiLoad: 86, analyticsSqlLoad: 68, realtimeWsLoad: 72, reportingLoad: 55, chaosSandboxLoad: 72 },
  { timestamp: 'Day 2 17:00', timeLabel: '17:00', hour: 17, overallHeat: 72, etlLoad: 74, predictiveAiLoad: 76, analyticsSqlLoad: 60, realtimeWsLoad: 65, reportingLoad: 48, chaosSandboxLoad: 56 },

  // Day 2 - Evening unwind (18:00 - 23:00)
  { timestamp: 'Day 2 18:00', timeLabel: '18:00', hour: 18, overallHeat: 65, etlLoad: 68, predictiveAiLoad: 70, analyticsSqlLoad: 54, realtimeWsLoad: 58, reportingLoad: 44, chaosSandboxLoad: 50 },
  { timestamp: 'Day 2 19:00', timeLabel: '19:00', hour: 19, overallHeat: 56, etlLoad: 60, predictiveAiLoad: 58, analyticsSqlLoad: 46, realtimeWsLoad: 50, reportingLoad: 36, chaosSandboxLoad: 42 },
  { timestamp: 'Day 2 20:00', timeLabel: '20:00', hour: 20, overallHeat: 46, etlLoad: 48, predictiveAiLoad: 45, analyticsSqlLoad: 36, realtimeWsLoad: 40, reportingLoad: 30, chaosSandboxLoad: 35 },
  { timestamp: 'Day 2 21:00', timeLabel: '21:00', hour: 21, overallHeat: 38, etlLoad: 40, predictiveAiLoad: 36, analyticsSqlLoad: 28, realtimeWsLoad: 32, reportingLoad: 22, chaosSandboxLoad: 28 },
  { timestamp: 'Day 2 22:00', timeLabel: '22:00', hour: 22, overallHeat: 30, etlLoad: 32, predictiveAiLoad: 28, analyticsSqlLoad: 20, realtimeWsLoad: 26, reportingLoad: 16, chaosSandboxLoad: 22 },
  { timestamp: 'Day 2 23:00', timeLabel: '23:00', hour: 23, overallHeat: 26, etlLoad: 28, predictiveAiLoad: 24, analyticsSqlLoad: 16, realtimeWsLoad: 22, reportingLoad: 12, chaosSandboxLoad: 18 },
];

interface HistoricalTimelineViewProps {
  currentMetrics?: ModuleResourceMetric[];
  onSelectEvent?: (event: TimelineDataPoint['spikeEvent']) => void;
}

export const HistoricalTimelineView: React.FC<HistoricalTimelineViewProps> = ({
  currentMetrics,
  onSelectEvent,
}) => {
  const [timeWindow, setTimeWindow] = useState<'48h' | '24h' | 'day1' | 'day2'>('48h');
  const [selectedSeries, setSelectedSeries] = useState<'overall' | 'etl' | 'predictive' | 'analytics' | 'all'>('overall');
  const [selectedSpike, setSelectedSpike] = useState<TimelineDataPoint['spikeEvent'] | null>(null);

  // Filter dataset by chosen time window
  const filteredData = useMemo(() => {
    switch (timeWindow) {
      case '24h':
        return HISTORICAL_RESOURCE_TIMELINE_DATA.slice(-24);
      case 'day1':
        return HISTORICAL_RESOURCE_TIMELINE_DATA.slice(0, 24);
      case 'day2':
        return HISTORICAL_RESOURCE_TIMELINE_DATA.slice(24);
      case '48h':
      default:
        return HISTORICAL_RESOURCE_TIMELINE_DATA;
    }
  }, [timeWindow]);

  // Detected spikes and dips in the selected range
  const detectedEvents = useMemo(() => {
    return filteredData.filter((d) => d.spikeEvent !== undefined).map((d) => ({
      timestamp: d.timestamp,
      ...d.spikeEvent!,
    }));
  }, [filteredData]);

  // Compute Temporal Insights
  const temporalInsights = useMemo(() => {
    const morningAvg = Math.round(
      filteredData.filter((d) => d.hour >= 7 && d.hour <= 11).reduce((acc, d) => acc + d.overallHeat, 0) /
        Math.max(1, filteredData.filter((d) => d.hour >= 7 && d.hour <= 11).length)
    );
    const afternoonPeak = Math.round(
      filteredData.filter((d) => d.hour >= 13 && d.hour <= 16).reduce((acc, d) => acc + d.overallHeat, 0) /
        Math.max(1, filteredData.filter((d) => d.hour >= 13 && d.hour <= 16).length)
    );
    const nightTrough = Math.round(
      filteredData.filter((d) => d.hour >= 1 && d.hour <= 5).reduce((acc, d) => acc + d.overallHeat, 0) /
        Math.max(1, filteredData.filter((d) => d.hour >= 1 && d.hour <= 5).length)
    );

    return { morningAvg, afternoonPeak, nightTrough };
  }, [filteredData]);

  // Custom Futuristic Tooltip
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const pt = payload[0].payload as TimelineDataPoint;

    return (
      <div className="p-3 rounded-xl bg-slate-950/95 border border-cyan-500/60 shadow-2xl backdrop-blur-md font-mono text-xs max-w-xs z-50">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px] mb-2">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{pt.timestamp}</span>
          </span>
          <span className="text-cyan-400 font-bold">{pt.overallHeat}% Composite</span>
        </div>

        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">ETL Pipeline:</span>
            <span className={`font-bold tabular-nums ${pt.etlLoad >= 80 ? 'text-red-400' : 'text-slate-200'}`}>{pt.etlLoad}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">CP-SAT Predictive AI:</span>
            <span className={`font-bold tabular-nums ${pt.predictiveAiLoad >= 80 ? 'text-red-400' : 'text-slate-200'}`}>{pt.predictiveAiLoad}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">SQL Analytics (Polars):</span>
            <span className="font-bold text-slate-200 tabular-nums">{pt.analyticsSqlLoad}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Real-Time WebSockets:</span>
            <span className="font-bold text-slate-200 tabular-nums">{pt.realtimeWsLoad}%</span>
          </div>
        </div>

        {pt.spikeEvent && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase mb-0.5 text-orange-400">
              <Zap className="w-3 h-3 text-orange-400" />
              <span>{pt.spikeEvent.title}</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              {pt.spikeEvent.description}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl p-5 shadow-2xl relative overflow-hidden font-mono text-slate-200 mt-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f49_1px,transparent_1px),linear-gradient(to_bottom,#082f49_1px,transparent_1px)] bg-[size:24px_24px] opacity-25 pointer-events-none" />

      {/* Header and Controls */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Historical Resource Utilization Timeline & Temporal Spikes</span>
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">Window: <strong className="text-white uppercase">{timeWindow}</strong></span>
          </div>
          <p className="text-xs text-slate-400 font-sans max-w-3xl">
            Correlates diurnal patterns, shift turnover surges, and wildfire emergency spikes against baseline heat density to predict upcoming resource saturation windows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Time Window Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
            {[
              { id: '48h', label: '48-Hour Horizon' },
              { id: '24h', label: 'Last 24 Hours' },
              { id: 'day1', label: 'Day 1' },
              { id: 'day2', label: 'Day 2' },
            ].map((w) => (
              <button
                key={w.id}
                onClick={() => setTimeWindow(w.id as any)}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  timeWindow === w.id
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          {/* Series View Selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
            {[
              { id: 'overall', label: 'Composite Heat' },
              { id: 'etl', label: 'ETL Pipeline' },
              { id: 'predictive', label: 'Predictive AI' },
              { id: 'all', label: 'Multi-Series' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSeries(s.id as any)}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  selectedSeries === s.id
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Temporal Pattern Metric Gauges */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Night Quiescence Trough</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-cyan-300">{temporalInsights.nightTrough}%</span>
              <span className="text-[10px] text-emerald-400 font-mono">01:00 - 05:00</span>
            </div>
            <span className="text-[10px] text-slate-500">Ideal for batch compaction & vacs</span>
          </div>
          <TrendingDown className="w-5 h-5 text-cyan-400 opacity-60" />
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Morning Shift Handover</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-amber-300">{temporalInsights.morningAvg}%</span>
              <span className="text-[10px] text-amber-400 font-mono">07:00 - 11:00</span>
            </div>
            <span className="text-[10px] text-slate-500">Dispatch package ingest surges</span>
          </div>
          <TrendingUp className="w-5 h-5 text-amber-400 opacity-60" />
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Afternoon Tactical Peak</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-red-400">{temporalInsights.afternoonPeak}%</span>
              <span className="text-[10px] text-red-400 font-mono">13:00 - 16:00</span>
            </div>
            <span className="text-[10px] text-slate-500">VLAT dispatch & wildfire re-vectors</span>
          </div>
          <Flame className="w-5 h-5 text-red-400 opacity-70 animate-pulse" />
        </div>
      </div>

      {/* Main Historical Recharts Line / Area Timeline */}
      <div className="relative z-10 h-72 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={filteredData}
            margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="overallHeatGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#f97316" stopOpacity={0.25} />
                <stop offset="85%" stopColor="#06b6d4" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#0891b2" stopOpacity={0.01} />
              </linearGradient>

              <linearGradient id="predictiveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0.02} />
              </linearGradient>

              <linearGradient id="etlGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" opacity={0.6} />

            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={{ stroke: '#334155' }}
            />

            <YAxis
              domain={[0, 100]}
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={{ stroke: '#334155' }}
              tickFormatter={(val) => `${val}%`}
            />

            {/* Threshold References */}
            <ReferenceLine
              y={85}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.2}
              label={{
                value: 'CRITICAL THRESHOLD (85%)',
                position: 'insideTopRight',
                fill: '#ef4444',
                fontSize: 9,
                fontFamily: 'JetBrains Mono',
                fontWeight: 'bold',
              }}
            />

            <ReferenceLine
              y={65}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{
                value: 'ELEVATED SATURATION (65%)',
                position: 'insideBottomRight',
                fill: '#f59e0b',
                fontSize: 9,
                fontFamily: 'JetBrains Mono',
              }}
            />

            <Tooltip content={renderCustomTooltip} />

            {/* Series Rendering based on selection */}
            {(selectedSeries === 'overall' || selectedSeries === 'all') && (
              <Area
                type="monotone"
                dataKey="overallHeat"
                name="Composite Heat Index"
                stroke="#f97316"
                strokeWidth={2.5}
                fill="url(#overallHeatGradient)"
                activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 1.5 }}
              />
            )}

            {(selectedSeries === 'predictive' || selectedSeries === 'all') && (
              <Line
                type="monotone"
                dataKey="predictiveAiLoad"
                name="CP-SAT Solver Load"
                stroke="#c084fc"
                strokeWidth={selectedSeries === 'predictive' ? 2.5 : 1.8}
                strokeDasharray={selectedSeries === 'all' ? '4 3' : 'none'}
                dot={false}
                activeDot={{ r: 5, fill: '#c084fc' }}
              />
            )}

            {(selectedSeries === 'etl' || selectedSeries === 'all') && (
              <Line
                type="monotone"
                dataKey="etlLoad"
                name="ETL Pipeline Load"
                stroke="#38bdf8"
                strokeWidth={selectedSeries === 'etl' ? 2.5 : 1.8}
                strokeDasharray={selectedSeries === 'all' ? '3 3' : 'none'}
                dot={false}
                activeDot={{ r: 5, fill: '#38bdf8' }}
              />
            )}

            {selectedSeries === 'all' && (
              <Line
                type="monotone"
                dataKey="chaosSandboxLoad"
                name="Chaos Fault Injection"
                stroke="#fb7185"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Identified Temporal Patterns & Incident Log */}
      <div className="relative z-10 mt-5 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Temporal Anomalies & Ingestion Events ({detectedEvents.length})</span>
          </span>
          <span className="text-[10px] text-slate-400">Click any event to inspect root causes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {detectedEvents.map((evt, idx) => (
            <div
              key={idx}
              onClick={() => {
                setSelectedSpike(evt);
                onSelectEvent?.(evt);
              }}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                evt.severity === 'critical'
                  ? 'bg-red-950/40 border-red-500/50 hover:border-red-400 shadow-sm shadow-red-950'
                  : evt.severity === 'warning'
                  ? 'bg-amber-950/40 border-amber-500/50 hover:border-amber-400 shadow-sm shadow-amber-950'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-slate-400 font-mono">{evt.timestamp}</span>
                <span
                  className={`font-bold uppercase px-1.5 py-0.2 rounded text-[9px] ${
                    evt.type === 'incident' || evt.type === 'surge'
                      ? 'text-red-300 bg-red-950 border border-red-600/50'
                      : evt.type === 'dip'
                      ? 'text-emerald-300 bg-emerald-950 border border-emerald-600/50'
                      : 'text-cyan-300 bg-cyan-950 border border-cyan-600/50'
                  }`}
                >
                  {evt.type}
                </span>
              </div>

              <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">{evt.title}</h4>
              <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed font-sans mb-2">
                {evt.description}
              </p>

              <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/80">
                <span className="text-slate-500 truncate max-w-[140px]">{evt.affectedModule}</span>
                <span className={`font-bold font-mono ${evt.magnitudePct > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {evt.magnitudePct > 0 ? `+${evt.magnitudePct}%` : `${evt.magnitudePct}%`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
