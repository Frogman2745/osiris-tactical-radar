import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Cpu,
  Server,
  Zap,
  ShieldAlert,
  Flame,
  Clock,
  Sparkles,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info
} from 'lucide-react';

export interface DailyCapacityForecastPoint {
  dayLabel: string;
  dateStr: string;
  dayIndex: number;
  projectedCpuLoad: number;
  projectedMemoryGb: number;
  projectedIopsRate: number;
  requiredWorkerNodes: number;
  surgeRiskPct: number;
  confidenceIntervalMin: number;
  confidenceIntervalMax: number;
  annotation?: string;
}

// 7-Day Forward Projections based on current telemetry velocity & wildfire thermal indices
export const FORECAST_7_DAY_PROJECTION_DATA: DailyCapacityForecastPoint[] = [
  {
    dayLabel: 'Day 1 (Today)',
    dateStr: 'Oct 01',
    dayIndex: 1,
    projectedCpuLoad: 68,
    projectedMemoryGb: 54,
    projectedIopsRate: 3420,
    requiredWorkerNodes: 4,
    surgeRiskPct: 22,
    confidenceIntervalMin: 64,
    confidenceIntervalMax: 72,
    annotation: 'Nominal Baseline Operating State',
  },
  {
    dayLabel: 'Day 2',
    dateStr: 'Oct 02',
    dayIndex: 2,
    projectedCpuLoad: 72,
    projectedMemoryGb: 58,
    projectedIopsRate: 3680,
    requiredWorkerNodes: 4,
    surgeRiskPct: 28,
    confidenceIntervalMin: 67,
    confidenceIntervalMax: 78,
  },
  {
    dayLabel: 'Day 3',
    dateStr: 'Oct 03',
    dayIndex: 3,
    projectedCpuLoad: 79,
    projectedMemoryGb: 64,
    projectedIopsRate: 4120,
    requiredWorkerNodes: 5,
    surgeRiskPct: 44,
    confidenceIntervalMin: 72,
    confidenceIntervalMax: 86,
    annotation: 'NorCal Red Flag Wind Shift Forecast',
  },
  {
    dayLabel: 'Day 4',
    dateStr: 'Oct 04',
    dayIndex: 4,
    projectedCpuLoad: 88,
    projectedMemoryGb: 74,
    projectedIopsRate: 4890,
    requiredWorkerNodes: 6,
    surgeRiskPct: 82,
    confidenceIntervalMin: 80,
    confidenceIntervalMax: 96,
    annotation: 'Peak Dispatch Vectoring Volume · Saturation Alert',
  },
  {
    dayLabel: 'Day 5',
    dateStr: 'Oct 05',
    dayIndex: 5,
    projectedCpuLoad: 84,
    projectedMemoryGb: 71,
    projectedIopsRate: 4560,
    requiredWorkerNodes: 6,
    surgeRiskPct: 68,
    confidenceIntervalMin: 76,
    confidenceIntervalMax: 91,
    annotation: 'Sustained Wildfire Air Attack Ops',
  },
  {
    dayLabel: 'Day 6',
    dateStr: 'Oct 06',
    dayIndex: 6,
    projectedCpuLoad: 75,
    projectedMemoryGb: 62,
    projectedIopsRate: 3890,
    requiredWorkerNodes: 5,
    surgeRiskPct: 36,
    confidenceIntervalMin: 69,
    confidenceIntervalMax: 82,
  },
  {
    dayLabel: 'Day 7',
    dateStr: 'Oct 07',
    dayIndex: 7,
    projectedCpuLoad: 66,
    projectedMemoryGb: 55,
    projectedIopsRate: 3350,
    requiredWorkerNodes: 4,
    surgeRiskPct: 18,
    confidenceIntervalMin: 60,
    confidenceIntervalMax: 72,
    annotation: 'Post-Frontal Stabilization',
  },
];

interface ResourceCapacityForecastingWidgetProps {
  onTriggerScalingRecommendation?: (nodes: number) => void;
}

export const ResourceCapacityForecastingWidget: React.FC<ResourceCapacityForecastingWidgetProps> = ({
  onTriggerScalingRecommendation,
}) => {
  const [forecastHorizon, setForecastHorizon] = useState<'7d' | '3d' | 'weekend'>('7d');
  const [selectedMetric, setSelectedMetric] = useState<'cpu' | 'memory' | 'nodes' | 'all'>('cpu');
  const [growthScenario, setGrowthScenario] = useState<number>(15); // +15% surge factor slider
  const [includeConfidenceBand, setIncludeConfidenceBand] = useState<boolean>(true);

  // Compute dynamic scenario based on growth slider
  const adjustedData = useMemo(() => {
    const factor = 1 + (growthScenario - 15) / 100;
    let sliceData = FORECAST_7_DAY_PROJECTION_DATA;

    if (forecastHorizon === '3d') {
      sliceData = sliceData.slice(0, 3);
    } else if (forecastHorizon === 'weekend') {
      sliceData = sliceData.slice(3, 6);
    }

    return sliceData.map((d) => {
      const cpu = Math.min(100, Math.round(d.projectedCpuLoad * factor));
      const mem = Math.min(128, Math.round(d.projectedMemoryGb * factor));
      const nodes = cpu >= 85 ? Math.max(d.requiredWorkerNodes, 6) : cpu >= 75 ? Math.max(d.requiredWorkerNodes, 5) : 4;
      const ciMin = Math.round(d.confidenceIntervalMin * factor);
      const ciMax = Math.min(100, Math.round(d.confidenceIntervalMax * factor));
      const risk = Math.min(100, Math.round(d.surgeRiskPct * factor));

      return {
        ...d,
        projectedCpuLoad: cpu,
        projectedMemoryGb: mem,
        requiredWorkerNodes: nodes,
        confidenceIntervalMin: ciMin,
        confidenceIntervalMax: ciMax,
        surgeRiskPct: risk,
      };
    });
  }, [forecastHorizon, growthScenario]);

  // Aggregate forecasting insights
  const peakDay = useMemo(() => {
    return adjustedData.reduce((prev, curr) => (curr.projectedCpuLoad > prev.projectedCpuLoad ? curr : prev), adjustedData[0]);
  }, [adjustedData]);

  const recommendedNodePeak = useMemo(() => {
    return Math.max(...adjustedData.map((d) => d.requiredWorkerNodes));
  }, [adjustedData]);

  // Futuristic Custom Tooltip
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const pt = payload[0].payload as DailyCapacityForecastPoint;

    return (
      <div className="p-3.5 rounded-xl bg-slate-950/95 border border-cyan-500/60 shadow-2xl backdrop-blur-md font-mono text-xs max-w-xs z-50">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px] mb-2">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{pt.dayLabel} ({pt.dateStr})</span>
          </span>
          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
            pt.projectedCpuLoad >= 85 ? 'bg-red-950 text-red-300 border border-red-500/60' : 'bg-slate-900 text-cyan-300'
          }`}>
            {pt.surgeRiskPct}% Surge Risk
          </span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Projected CPU Saturation:</span>
            <strong className={`font-bold tabular-nums ${pt.projectedCpuLoad >= 85 ? 'text-red-400' : 'text-cyan-300'}`}>
              {pt.projectedCpuLoad}%
            </strong>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">95% Confidence Bounds:</span>
            <span className="font-mono text-slate-300 tabular-nums">
              [{pt.confidenceIntervalMin}% - {pt.confidenceIntervalMax}%]
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Estimated RAM Requirement:</span>
            <span className="font-bold text-amber-300 tabular-nums">{pt.projectedMemoryGb} GB / 128 GB</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Recommended Pod Replicas:</span>
            <span className="font-bold text-emerald-400 tabular-nums">{pt.requiredWorkerNodes} Worker Nodes</span>
          </div>
        </div>

        {pt.annotation && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80">
            <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1 mb-0.5">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>FORECAST CATALYST</span>
            </div>
            <p className="text-[10px] text-slate-300 font-sans leading-tight">
              {pt.annotation}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl p-5 shadow-2xl relative overflow-hidden font-mono text-slate-200 mt-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f49_1px,transparent_1px),linear-gradient(to_bottom,#082f49_1px,transparent_1px)] bg-[size:24px_24px] opacity-25 pointer-events-none" />

      {/* Widget Header & Tactical View Controls */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Resource Capacity Forecasting & Horizon Modeling</span>
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">Model: <strong className="text-white">ARIMA + Holt-Winters</strong></span>
          </div>
          <p className="text-xs text-slate-400 font-sans max-w-2xl">
            Projects forward-looking CPU compute saturation, memory footprint, and autoscaling pod commitments over the next 7 days based on current dispatch trends and telemetry velocity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Horizon Window Selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
            {[
              { id: '7d', label: '7-Day Horizon' },
              { id: '3d', label: 'Next 72 Hours' },
              { id: 'weekend', label: 'Peak Days (4-6)' },
            ].map((h) => (
              <button
                key={h.id}
                onClick={() => setForecastHorizon(h.id as any)}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  forecastHorizon === h.id
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>

          {/* Metric Filter */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
            {[
              { id: 'cpu', label: 'CPU Load' },
              { id: 'memory', label: 'RAM Load' },
              { id: 'nodes', label: 'Worker Pods' },
              { id: 'all', label: 'Composite' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMetric(m.id as any)}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  selectedMetric === m.id
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Toggle Confidence Intervals */}
          <button
            onClick={() => setIncludeConfidenceBand(!includeConfidenceBand)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
              includeConfidenceBand
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle 95% Confidence Band Projection"
          >
            <span>{includeConfidenceBand ? '95% CI: ON' : '95% CI: OFF'}</span>
          </button>
        </div>
      </div>

      {/* Top Predictive Forecast Indicators */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-4 gap-3 my-4">
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Projected Peak Date</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-base font-bold text-white">{peakDay.dayLabel}</span>
            <span className="text-xs text-red-400 font-mono font-bold">{peakDay.projectedCpuLoad}% Peak</span>
          </div>
          <span className="text-[10px] text-slate-400">NorCal wind-shift window</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Recommended Cluster Scale</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-base font-bold text-emerald-400">{recommendedNodePeak} Pod Nodes</span>
            <span className="text-xs text-slate-400 font-mono">+2 vs baseline</span>
          </div>
          <span className="text-[10px] text-emerald-400">Zero SLA degradation</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Max Memory Footprint</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-base font-bold text-amber-300">{peakDay.projectedMemoryGb} GB</span>
            <span className="text-xs text-slate-400 font-mono">/ 128 GB Pool</span>
          </div>
          <span className="text-[10px] text-slate-400">Postgres + Polars buffer</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Capacity Surge Slider</span>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="range"
              min="0"
              max="40"
              value={growthScenario}
              onChange={(e) => setGrowthScenario(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-xs font-bold text-cyan-300 font-mono shrink-0">+{growthScenario}%</span>
          </div>
          <span className="text-[10px] text-slate-500">Simulate incident volume surge</span>
        </div>
      </div>

      {/* Main Forward-Looking Recharts Line Chart */}
      <div className="relative z-10 h-72 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={adjustedData}
            margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="forecastCpuFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
              </linearGradient>

              <linearGradient id="forecastCiBand" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.03} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" opacity={0.6} />

            <XAxis
              dataKey="dateStr"
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
                value: 'AUTOSCALE TRIGGER (85%)',
                position: 'insideTopRight',
                fill: '#ef4444',
                fontSize: 9,
                fontFamily: 'JetBrains Mono',
                fontWeight: 'bold',
              }}
            />

            <ReferenceLine
              y={70}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{
                value: 'TARGET OPERATING ENVELOPE (70%)',
                position: 'insideBottomRight',
                fill: '#f59e0b',
                fontSize: 9,
                fontFamily: 'JetBrains Mono',
              }}
            />

            <Tooltip content={renderCustomTooltip} />

            {/* Confidence Interval Upper and Lower Bounds */}
            {includeConfidenceBand && (
              <Area
                type="monotone"
                dataKey="confidenceIntervalMax"
                stroke="transparent"
                fill="url(#forecastCiBand)"
                name="Confidence Bound Upper"
              />
            )}

            {/* Projected CPU Utilization Line */}
            {(selectedMetric === 'cpu' || selectedMetric === 'all') && (
              <Line
                type="monotone"
                dataKey="projectedCpuLoad"
                name="Projected CPU Load (%)"
                stroke="#22d3ee"
                strokeWidth={2.8}
                dot={{ r: 4, fill: '#06b6d4', stroke: '#fff', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
              />
            )}

            {/* Projected Memory Saturation Line */}
            {(selectedMetric === 'memory' || selectedMetric === 'all') && (
              <Line
                type="monotone"
                dataKey="projectedMemoryGb"
                name="Projected Memory (GB)"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray={selectedMetric === 'all' ? '4 3' : 'none'}
                dot={{ r: 3, fill: '#f59e0b' }}
              />
            )}

            {/* Required Worker Pods Line */}
            {(selectedMetric === 'nodes' || selectedMetric === 'all') && (
              <Line
                type="stepAfter"
                dataKey="requiredWorkerNodes"
                name="Recommended Pods"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3, fill: '#10b981' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Actionable Pre-Provisioning Recommendations Bar */}
      <div className="relative z-10 mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300 font-bold">Autoscaling Advisory:</span>
          <span className="text-slate-400 font-sans">
            Schedule scale-out to <strong className="text-emerald-400">{recommendedNodePeak} worker nodes</strong> prior to Oct 04 (Day 4) to maintain &lt;20ms API latency.
          </span>
        </div>

        <button
          onClick={() => onTriggerScalingRecommendation?.(recommendedNodePeak)}
          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap"
        >
          Pre-Provision {recommendedNodePeak} Nodes
        </button>
      </div>
    </div>
  );
};
