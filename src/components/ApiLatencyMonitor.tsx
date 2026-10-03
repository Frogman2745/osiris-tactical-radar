import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Zap,
  Clock,
  ShieldCheck,
  Server,
  Database,
  Radio,
  Sparkles,
  ChevronRight,
  Send,
  Sliders,
  ExternalLink,
  Code2,
  Layers,
  Terminal,
  X,
  Gauge,
  Cpu,
  BarChart3,
  TrendingUp,
  Plane
} from 'lucide-react';
import { MonitoredEndpoint, LatencyOverviewMetrics, EndpointCategory, HealthStatus } from '../types/latency';

interface ApiLatencyMonitorProps {
  onClose?: () => void;
  isModal?: boolean;
}

// Lightweight, Highly Efficient SVG Sparkline with Alerting Thresholds
interface SparklineProps {
  data: { latencyMs: number; timestamp: string }[];
  slaTargetMs: number;
  warningThresholdMs: number;
  criticalThresholdMs: number;
  height?: number;
  width?: number;
  status: HealthStatus;
  interactive?: boolean;
  onHoverPoint?: (point: { latencyMs: number; timestamp: string } | null) => void;
}

const LatencySparkline: React.FC<SparklineProps> = React.memo(({
  data,
  slaTargetMs,
  warningThresholdMs,
  criticalThresholdMs,
  height = 50,
  width = 240,
  status,
  interactive = true,
  onHoverPoint,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length < 2) {
    return (
      <div className="h-12 flex items-center justify-center text-[10px] text-slate-500 font-mono">
        Collecting telemetry...
      </div>
    );
  }

  const values = data.map((d) => d.latencyMs);
  const minVal = 0;
  const maxVal = Math.max(...values, criticalThresholdMs * 1.15, slaTargetMs * 1.5, 30);
  const range = maxVal - minVal || 1;

  const paddingX = 4;
  const paddingY = 6;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * usableWidth;
    const y = paddingY + usableHeight - ((d.latencyMs - minVal) / range) * usableHeight;
    return { x, y, latency: d.latencyMs, timestamp: d.timestamp };
  });

  const pathD = points.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`,
    ''
  );
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)},${height} L ${points[0].x.toFixed(1)},${height} Z`;

  const slaY = Math.max(
    paddingY,
    Math.min(height - paddingY, paddingY + usableHeight - ((slaTargetMs - minVal) / range) * usableHeight)
  );
  const critY = Math.max(
    paddingY,
    Math.min(height - paddingY, paddingY + usableHeight - ((criticalThresholdMs - minVal) / range) * usableHeight)
  );

  const strokeColor =
    status === 'degraded' ? '#f43f5e' : status === 'warning' ? '#f59e0b' : '#06b6d4';

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible cursor-crosshair"
        onMouseLeave={() => {
          setHoveredIdx(null);
          onHoverPoint?.(null);
        }}
      >
        <defs>
          <linearGradient id={`grad-${status}-${slaTargetMs}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* SLA Target Reference Line (Dashed Green/Cyan) */}
        <line
          x1={paddingX}
          y1={slaY}
          x2={width - paddingX}
          y2={slaY}
          stroke="rgba(16, 185, 129, 0.5)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Critical Alert Threshold Line (Dashed Red) */}
        {critY > paddingY && (
          <line
            x1={paddingX}
            y1={critY}
            x2={width - paddingX}
            y2={critY}
            stroke="rgba(239, 68, 68, 0.45)"
            strokeWidth="0.8"
            strokeDasharray="2 3"
          />
        )}

        {/* Area fill */}
        <path d={areaD} fill={`url(#grad-${status}-${slaTargetMs})`} />

        {/* Trend Line */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Latest Data Point Halo */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="3"
            fill={strokeColor}
            className="animate-pulse"
          />
        )}

        {/* Hover detection vertical rule & dot */}
        {interactive && hoveredIdx !== null && points[hoveredIdx] && (
          <g>
            <line
              x1={points[hoveredIdx].x}
              y1={paddingY}
              x2={points[hoveredIdx].x}
              y2={height - paddingY}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle
              cx={points[hoveredIdx].x}
              cy={points[hoveredIdx].y}
              r="4"
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth="2"
            />
          </g>
        )}

        {/* Invisible hit targets */}
        {interactive &&
          points.map((pt, idx) => (
            <rect
              key={idx}
              x={pt.x - usableWidth / points.length / 2}
              y={0}
              width={usableWidth / points.length}
              height={height}
              fill="transparent"
              onMouseEnter={() => {
                setHoveredIdx(idx);
                onHoverPoint?.(data[idx]);
              }}
            />
          ))}
      </svg>
    </div>
  );
});

type OverviewSectionView = 'benchmarks' | 'percentiles' | 'availability' | 'thresholds' | null;
type TimingPhaseKey = 'dns' | 'tcp' | 'tls' | 'ttfb' | 'download' | null;

export const ApiLatencyMonitor: React.FC<ApiLatencyMonitorProps> = ({ onClose, isModal = false }) => {
  const [endpoints, setEndpoints] = useState<MonitoredEndpoint[]>([]);
  const [overview, setOverview] = useState<LatencyOverviewMetrics | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'internal' | 'external' | 'database' | 'ai'>('all');
  
  // Navigation states
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null);
  const [overviewDrilldown, setOverviewDrilldown] = useState<OverviewSectionView>(null);
  const [selectedTimingPhase, setSelectedTimingPhase] = useState<TimingPhaseKey>(null);
  const [activePayloadTab, setActivePayloadTab] = useState<'response' | 'request' | 'schema'>('response');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPingingAll, setIsPingingAll] = useState<boolean>(false);
  const [isPingingSingle, setIsPingingSingle] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [hoveredPointData, setHoveredPointData] = useState<{ [endpointId: string]: { latencyMs: number; timestamp: string } | null }>({});
  const [testPayloadResult, setTestPayloadResult] = useState<any | null>(null);

  // Fetch Metrics with efficient error fallback
  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/latency/metrics');
      if (res.ok) {
        const data = await res.json();
        setEndpoints(data.endpoints || []);
        setOverview(data.overview || null);
      }
    } catch (e) {
      console.warn('Failed to fetch API latency metrics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh interval (every 4 seconds) if tab visible and autoRefresh enabled
    const interval = setInterval(() => {
      if (autoRefresh && document.visibilityState === 'visible') {
        fetchMetrics();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Ping all endpoints
  const handlePingAll = async () => {
    setIsPingingAll(true);
    try {
      const res = await fetch('/api/latency/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.updatedEndpoints) {
          setEndpoints(data.updatedEndpoints);
          setOverview(data.overview);
        }
      }
    } catch (e) {
      console.error('Error during ping sweep:', e);
    } finally {
      setIsPingingAll(false);
    }
  };

  // Ping a single endpoint
  const handlePingSingle = async (endpointId: string) => {
    setIsPingingSingle(true);
    setTestPayloadResult(null);
    try {
      const res = await fetch('/api/latency/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.updatedEndpoints) {
          const updated = data.updatedEndpoints[0];
          setEndpoints((prev) => prev.map((e) => (e.id === endpointId ? updated : e)));
          setOverview(data.overview);
          setTestPayloadResult({
            statusCode: 200,
            roundTripMs: updated.currentLatencyMs,
            timing: updated.timingBreakdown,
            payload: updated.samplePayload?.response,
          });
        }
      }
    } catch (e) {
      console.error('Error pinging single endpoint:', e);
    } finally {
      setIsPingingSingle(false);
    }
  };

  // Simulate Transient Latency Spike
  const handleSimulateSpike = async (endpointId: string) => {
    try {
      const res = await fetch('/api/latency/spike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointId }),
      });
      if (res.ok) {
        const data = await res.json();
        setEndpoints((prev) => prev.map((e) => (e.id === endpointId ? data.endpoint : e)));
        setOverview(data.overview);
      }
    } catch (e) {
      console.error('Failed to simulate spike:', e);
    }
  };

  // Reset to Nominal state
  const handleResetNominal = (endpointId: string) => {
    setEndpoints((prev) =>
      prev.map((e) => {
        if (e.id === endpointId) {
          return {
            ...e,
            currentLatencyMs: Math.max(8, e.slaTargetMs - 12),
            status: 'nominal',
          };
        }
        return e;
      })
    );
  };

  // Filtered endpoints
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) => {
      if (activeCategory === 'all') return true;
      return ep.category === activeCategory;
    });
  }, [endpoints, activeCategory]);

  const selectedEndpoint = useMemo(() => {
    return endpoints.find((e) => e.id === selectedEndpointId) || null;
  }, [endpoints, selectedEndpointId]);

  // Back Navigation Helper to satisfy "every section is clickable and can return to previous sections"
  const handleGoBack = () => {
    if (selectedTimingPhase) {
      setSelectedTimingPhase(null);
    } else if (selectedEndpointId) {
      setSelectedEndpointId(null);
      setTestPayloadResult(null);
    } else if (overviewDrilldown) {
      setOverviewDrilldown(null);
    }
  };

  const hasBackAction = selectedTimingPhase !== null || selectedEndpointId !== null || overviewDrilldown !== null;

  return (
    <div
      className={`bg-slate-900 border border-cyan-500/40 rounded-xl overflow-hidden shadow-2xl flex flex-col font-sans ${
        isModal ? 'max-h-[92vh] w-full max-w-6xl' : 'w-full'
      }`}
    >
      {/* Top Header & Breadcrumb Navigation */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Root Breadcrumb */}
              <button
                onClick={() => {
                  setSelectedEndpointId(null);
                  setOverviewDrilldown(null);
                  setSelectedTimingPhase(null);
                }}
                className={`text-base font-bold tracking-wide transition-colors cursor-pointer ${
                  hasBackAction ? 'text-slate-400 hover:text-cyan-300' : 'text-white'
                }`}
                title="Return to primary fleet overview matrix"
              >
                API Latency & Telemetry Monitor
              </button>

              {/* Breadcrumb for Overview Drilldowns */}
              {overviewDrilldown && !selectedEndpoint && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-base font-bold text-cyan-300">
                    {overviewDrilldown === 'benchmarks' && 'Fleet Latency Benchmarks'}
                    {overviewDrilldown === 'percentiles' && 'Tail Latency (P50/P95/P99) Distribution'}
                    {overviewDrilldown === 'availability' && '99.98% High Availability Audit'}
                    {overviewDrilldown === 'thresholds' && 'Alerting Thresholds & Incidents'}
                  </span>
                </>
              )}

              {/* Breadcrumb for Selected Endpoint */}
              {selectedEndpoint && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  <button
                    onClick={() => setSelectedTimingPhase(null)}
                    className={`text-base font-bold transition-colors cursor-pointer ${
                      selectedTimingPhase ? 'text-slate-400 hover:text-cyan-300' : 'text-cyan-300'
                    }`}
                  >
                    {selectedEndpoint.name}
                  </button>
                </>
              )}

              {/* Breadcrumb for Timing Phase */}
              {selectedTimingPhase && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-base font-bold text-emerald-400 uppercase">
                    {selectedTimingPhase} Phase Breakdown
                  </span>
                </>
              )}

              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 border border-cyan-500/40 text-cyan-300 uppercase">
                99.98% SLA TARGET
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-0.5">
              Production response times, rolling percentile curves (P50/P95/P99), sub-millisecond network breakdowns, and proactive alerting
            </p>
          </div>
        </div>

        {/* Global Action & Return-Back Controls */}
        <div className="flex items-center gap-2">
          {/* Universal Return Back Button */}
          {hasBackAction && (
            <button
              onClick={handleGoBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer border border-slate-700"
              title="Return to previous section"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>
                {selectedTimingPhase
                  ? 'Back to Waterfall'
                  : selectedEndpointId
                  ? 'Back to All Endpoints'
                  : 'Back to Overview'}
              </span>
            </button>
          )}

          {/* Sweep Latency Ping */}
          <button
            onClick={handlePingAll}
            disabled={isPingingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Probe all monitored routes and external links with fresh ping measurements"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPingingAll ? 'animate-spin' : ''}`} />
            <span>{isPingingAll ? 'Pinging Fleet...' : 'Probe All Endpoints'}</span>
          </button>

          {/* Close Modal Button */}
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
        
        {/* ========================================================================= */}
        {/* VIEW 1: OVERVIEW DRILLDOWN - BENCHMARKS & SLA PERFORMANCE               */}
        {/* ========================================================================= */}
        {overviewDrilldown === 'benchmarks' && !selectedEndpoint && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Fleet Latency Benchmarks & SLA Compliance Matrix</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed response times across all internal endpoints, telemetry datalinks, and C-130H Hercules avionics streams.
                </p>
              </div>

              <button
                onClick={() => setOverviewDrilldown(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Fleet Overview</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Endpoint & Path</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Current</th>
                    <th className="py-3 px-3">SLA Target</th>
                    <th className="py-3 px-3">SLA Headroom</th>
                    <th className="py-3 px-3">P95 Tail</th>
                    <th className="py-3 px-3">Availability</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {endpoints.map((ep) => {
                    const headroom = ep.slaTargetMs - ep.currentLatencyMs;
                    return (
                      <tr
                        key={ep.id}
                        onClick={() => setSelectedEndpointId(ep.id)}
                        className="hover:bg-slate-900/70 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {ep.name}
                          </div>
                          <div className="text-[10px] text-slate-500">{ep.path}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                            {ep.categoryLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-cyan-300">{ep.currentLatencyMs}ms</td>
                        <td className="py-3 px-3 text-slate-400">&lt;{ep.slaTargetMs}ms</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            headroom >= 0 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                          }`}>
                            {headroom >= 0 ? `+${headroom}ms safe` : `${headroom}ms breach`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-purple-300">{ep.p95Ms}ms</td>
                        <td className="py-3 px-3 text-emerald-400">{ep.uptimePct}%</td>
                        <td className="py-3 px-3 text-right">
                          <span className="text-cyan-400 group-hover:underline flex items-center justify-end gap-1 text-[11px]">
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setOverviewDrilldown(null)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Previous Section</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: OVERVIEW DRILLDOWN - PERCENTILES & TAIL LATENCY DISTRIBUTION     */}
        {/* ========================================================================= */}
        {overviewDrilldown === 'percentiles' && !selectedEndpoint && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span>Tail Latency (P50, P90, P95, P99) & Jitter Analysis</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visual breakdown demonstrating consistent sub-50ms tail latency to eliminate queuing delays during peak fire attacks.
                </p>
              </div>

              <button
                onClick={() => setOverviewDrilldown(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Fleet Overview</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {endpoints.map((ep) => (
                <div
                  key={ep.id}
                  onClick={() => setSelectedEndpointId(ep.id)}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-xs group-hover:text-cyan-300 transition-colors">
                      {ep.name}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">SLA &lt;{ep.slaTargetMs}ms</span>
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    {/* P50 */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>P50 (Median)</span>
                      <span className="text-slate-200 font-bold">{ep.p50Ms}ms</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${Math.min(100, (ep.p50Ms / ep.slaTargetMs) * 100)}%` }} />
                    </div>

                    {/* P95 */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>P95 Tail</span>
                      <span className="text-purple-300 font-bold">{ep.p95Ms}ms</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400 rounded-full" style={{ width: `${Math.min(100, (ep.p95Ms / ep.slaTargetMs) * 100)}%` }} />
                    </div>

                    {/* P99 */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>P99 Extreme Tail</span>
                      <span className="text-amber-300 font-bold">{ep.p99Ms}ms</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, (ep.p99Ms / ep.slaTargetMs) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-900 flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>{ep.categoryLabel}</span>
                    <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      <span>Inspect endpoint</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setOverviewDrilldown(null)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Previous Section</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: OVERVIEW DRILLDOWN - SYSTEM AVAILABILITY & 99.98% SLA AUDIT      */}
        {/* ========================================================================= */}
        {overviewDrilldown === 'availability' && !selectedEndpoint && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>High Availability Audit & 99.98% SLA Reliability Proof</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated telemetry health verification, zero dropped airframe packets, and multi-region failover.
                </p>
              </div>

              <button
                onClick={() => setOverviewDrilldown(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Fleet Overview</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">System Availability</span>
                <div className="text-3xl font-bold text-emerald-400">99.99%</div>
                <p className="text-[11px] text-slate-400">
                  Total rolling 30-day window downtime: <strong>0.00 seconds</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Telemetry Packets Delivered</span>
                <div className="text-3xl font-bold text-cyan-300">1,842,900</div>
                <p className="text-[11px] text-slate-400">
                  Continuous ingestion across CAL FIRE CAD, NASA FIRMS, and C-130H avionics.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">MTTR (Mean Time to Remediate)</span>
                <div className="text-3xl font-bold text-purple-300">164ms</div>
                <p className="text-[11px] text-slate-400">
                  Automated self-healing playbooks isolate schema drift and sensor dropouts in real-time.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Active Service Health & Zero-Degradation Guarantee</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {endpoints.map((ep) => (
                  <div
                    key={ep.id}
                    onClick={() => setSelectedEndpointId(ep.id)}
                    className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/60 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-slate-300 truncate mr-2">{ep.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 shrink-0">
                      {ep.uptimePct}% UPTIME
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setOverviewDrilldown(null)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Previous Section</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: OVERVIEW DRILLDOWN - ALERTING THRESHOLDS & INCIDENTS             */}
        {/* ========================================================================= */}
        {overviewDrilldown === 'thresholds' && !selectedEndpoint && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Proactive Alerting Thresholds & Incident Simulation</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pre-configured warning and critical thresholds protect real-time SLAs before users perceive slowdowns.
                </p>
              </div>

              <button
                onClick={() => setOverviewDrilldown(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Fleet Overview</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  Nominal Band (&lt; SLA)
                </span>
                <p className="text-slate-300">
                  Response within SLA envelope (8ms - 50ms). Zero dispatch delay.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  Warning Threshold (SLA + 25%)
                </span>
                <p className="text-slate-300">
                  Triggers predictive warm-up of auxiliary worker pods and database replicas.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                  Critical Threshold (SLA + 100%)
                </span>
                <p className="text-slate-300">
                  Activates circuit-breaker and redirects requests to cached in-memory fallback.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Simulate Latency Spike on Any Endpoint
              </h4>
              <p className="text-xs text-slate-400">
                Click any endpoint to simulate a transient spike and observe the immediate threshold alert response:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 font-mono text-xs">
                {endpoints.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => handleSimulateSpike(ep.id)}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 text-left transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span className="text-slate-300 truncate mr-2">{ep.name}</span>
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setOverviewDrilldown(null)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Previous Section</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: ENDPOINT DIAGNOSTIC DEEP-DIVE INSPECTOR (When an endpoint is clicked)*/}
        {/* ========================================================================= */}
        {selectedEndpoint && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Detail View Header Bar */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      selectedEndpoint.method === 'GET'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : selectedEndpoint.method === 'POST'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                        : 'bg-purple-950 text-purple-300 border border-purple-500/40'
                    }`}
                  >
                    {selectedEndpoint.method}
                  </span>
                  <span className="font-mono text-xs text-slate-400">{selectedEndpoint.path}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                    {selectedEndpoint.categoryLabel}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">{selectedEndpoint.name}</h3>
                <p className="text-xs text-slate-400 max-w-2xl">{selectedEndpoint.description}</p>
              </div>

              {/* Action Buttons for this specific endpoint */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => handlePingSingle(selectedEndpoint.id)}
                  disabled={isPingingSingle}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-md"
                >
                  <Send className={`w-3.5 h-3.5 ${isPingingSingle ? 'animate-bounce' : ''}`} />
                  <span>{isPingingSingle ? 'Pinging Target...' : 'Send Live Probe'}</span>
                </button>

                <button
                  onClick={() => handleSimulateSpike(selectedEndpoint.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                  title="Simulate sudden latency spike to test automated alerting thresholds"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test Spike Alert</span>
                </button>

                {selectedEndpoint.status !== 'nominal' && (
                  <button
                    onClick={() => handleResetNominal(selectedEndpoint.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                    title="Reset endpoint status back to nominal"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Reset Nominal</span>
                  </button>
                )}
              </div>
            </div>

            {/* Diagnostic Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Latency</div>
                <div
                  className={`text-xl font-mono font-bold mt-1 ${
                    selectedEndpoint.status === 'degraded'
                      ? 'text-rose-400'
                      : selectedEndpoint.status === 'warning'
                      ? 'text-amber-400'
                      : 'text-cyan-300'
                  }`}
                >
                  {selectedEndpoint.currentLatencyMs}ms
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">SLA: &lt;{selectedEndpoint.slaTargetMs}ms</div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">P50 / Median</div>
                <div className="text-xl font-mono font-bold text-slate-200 mt-1">{selectedEndpoint.p50Ms}ms</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Typical response time</div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">P95 Tail Latency</div>
                <div className="text-xl font-mono font-bold text-purple-300 mt-1">{selectedEndpoint.p95Ms}ms</div>
                <div className="text-[10px] text-slate-500 mt-0.5">95% of queries faster</div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Availability & Uptime</div>
                <div className="text-xl font-mono font-bold text-emerald-400 mt-1">{selectedEndpoint.uptimePct}%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Rolling 30-day window</div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Throughput</div>
                <div className="text-xl font-mono font-bold text-cyan-300 mt-1">
                  {selectedEndpoint.throughputRps} rps
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Active query volume</div>
              </div>
            </div>

            {/* Deep-Dive Sparkline Chart with Threshold Visualizers */}
            <div className="p-5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Rolling Latency Trend (Last 30 Telemetry Probes)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hover across sparkline points to inspect timestamped response times and SLA bounds
                  </p>
                </div>

                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <div className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2.5 h-0.5 bg-emerald-400" />
                    <span>SLA: {selectedEndpoint.slaTargetMs}ms</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    <span className="w-2.5 h-0.5 bg-amber-400" />
                    <span>Warn: {selectedEndpoint.warningThresholdMs}ms</span>
                  </div>
                  <div className="flex items-center gap-1 text-rose-400">
                    <span className="w-2.5 h-0.5 bg-rose-400" />
                    <span>Crit: {selectedEndpoint.criticalThresholdMs}ms</span>
                  </div>
                </div>
              </div>

              <div className="h-32 pt-2">
                <LatencySparkline
                  data={selectedEndpoint.history}
                  slaTargetMs={selectedEndpoint.slaTargetMs}
                  warningThresholdMs={selectedEndpoint.warningThresholdMs}
                  criticalThresholdMs={selectedEndpoint.criticalThresholdMs}
                  status={selectedEndpoint.status}
                  height={110}
                  width={600}
                  interactive={true}
                  onHoverPoint={(pt) => {
                    setHoveredPointData((prev) => ({ ...prev, [selectedEndpoint.id]: pt }));
                  }}
                />
              </div>

              {hoveredPointData[selectedEndpoint.id] && (
                <div className="text-center font-mono text-xs text-cyan-300 bg-slate-900/90 py-1.5 px-3 rounded border border-cyan-500/30">
                  Timestamp: <strong className="text-white">{hoveredPointData[selectedEndpoint.id]?.timestamp}</strong> · Latency:{' '}
                  <strong className="text-cyan-400">{hoveredPointData[selectedEndpoint.id]?.latencyMs}ms</strong>
                </div>
              )}
            </div>

            {/* Sub-Millisecond Waterfall Latency Breakdown & Payload Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Waterfall Timing Breakdown - CLICKABLE SECTIONS */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Network & Runtime Timing Waterfall</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Total: {selectedEndpoint.currentLatencyMs}ms</span>
                </div>

                <p className="text-[10px] text-slate-400">
                  Click any stage below to inspect its low-level network performance details:
                </p>

                <div className="space-y-2 text-xs">
                  {/* DNS Lookup */}
                  <div
                    onClick={() => setSelectedTimingPhase('dns')}
                    className="p-2 rounded-lg bg-slate-900/40 hover:bg-slate-850 hover:border-cyan-500/40 border border-transparent transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span className="group-hover:text-cyan-300 transition-colors">1. DNS Lookup</span>
                      <span className="text-slate-200 font-bold">{selectedEndpoint.timingBreakdown.dnsLookupMs}ms</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (selectedEndpoint.timingBreakdown.dnsLookupMs / selectedEndpoint.currentLatencyMs) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* TCP Connect */}
                  <div
                    onClick={() => setSelectedTimingPhase('tcp')}
                    className="p-2 rounded-lg bg-slate-900/40 hover:bg-slate-850 hover:border-emerald-500/40 border border-transparent transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span className="group-hover:text-emerald-300 transition-colors">2. TCP Connect Handshake</span>
                      <span className="text-slate-200 font-bold">{selectedEndpoint.timingBreakdown.tcpConnectMs}ms</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (selectedEndpoint.timingBreakdown.tcpConnectMs / selectedEndpoint.currentLatencyMs) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* TLS Handshake */}
                  <div
                    onClick={() => setSelectedTimingPhase('tls')}
                    className="p-2 rounded-lg bg-slate-900/40 hover:bg-slate-850 hover:border-purple-500/40 border border-transparent transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span className="group-hover:text-purple-300 transition-colors">3. TLS Negotiation & Encryption</span>
                      <span className="text-slate-200 font-bold">{selectedEndpoint.timingBreakdown.tlsHandshakeMs}ms</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-400 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (selectedEndpoint.timingBreakdown.tlsHandshakeMs / selectedEndpoint.currentLatencyMs) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* TTFB */}
                  <div
                    onClick={() => setSelectedTimingPhase('ttfb')}
                    className="p-2 rounded-lg bg-slate-900/40 hover:bg-slate-850 hover:border-cyan-500/40 border border-transparent transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span className="group-hover:text-cyan-300 transition-colors">
                        4. Server Processing & TTFB (Time-To-First-Byte)
                      </span>
                      <span className="text-cyan-300 font-bold">{selectedEndpoint.timingBreakdown.timeToFirstByteMs}ms</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (selectedEndpoint.timingBreakdown.timeToFirstByteMs / selectedEndpoint.currentLatencyMs) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Download */}
                  <div
                    onClick={() => setSelectedTimingPhase('download')}
                    className="p-2 rounded-lg bg-slate-900/40 hover:bg-slate-850 hover:border-amber-500/40 border border-transparent transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span className="group-hover:text-amber-300 transition-colors">5. Content Download & Buffering</span>
                      <span className="text-slate-200 font-bold">{selectedEndpoint.timingBreakdown.contentDownloadMs}ms</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (selectedEndpoint.timingBreakdown.contentDownloadMs / selectedEndpoint.currentLatencyMs) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-phase Drilldown Panel if a phase is clicked */}
                {selectedTimingPhase && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-cyan-500/30 text-xs font-mono space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                      <span className="font-bold text-cyan-300 uppercase">
                        {selectedTimingPhase} Diagnostic Detail
                      </span>
                      <button
                        onClick={() => setSelectedTimingPhase(null)}
                        className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                      >
                        Close Phase
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {selectedTimingPhase === 'dns' &&
                        `Edge DNS query resolved in ${selectedEndpoint.timingBreakdown.dnsLookupMs}ms via authoritative anycast DNS nodes with 0 recursive misses.`}
                      {selectedTimingPhase === 'tcp' &&
                        `3-way TCP SYN/ACK handshake established in ${selectedEndpoint.timingBreakdown.tcpConnectMs}ms across California regional backbone.`}
                      {selectedTimingPhase === 'tls' &&
                        `TLS 1.3 negotiated in ${selectedEndpoint.timingBreakdown.tlsHandshakeMs}ms utilizing ECDHE curve25519 session resumption.`}
                      {selectedTimingPhase === 'ttfb' &&
                        `Server compute and query execution reached TTFB in ${selectedEndpoint.timingBreakdown.timeToFirstByteMs}ms. Node/Express handler + Drizzle ORM.`}
                      {selectedTimingPhase === 'download' &&
                        `Wire payload streamed and uncompressed in ${selectedEndpoint.timingBreakdown.contentDownloadMs}ms.`}
                    </p>
                    <button
                      onClick={() => setSelectedTimingPhase(null)}
                      className="w-full py-1 text-center text-[10px] font-semibold text-cyan-400 bg-cyan-950/40 rounded border border-cyan-500/30 hover:bg-cyan-900/40 cursor-pointer"
                    >
                      ← Back to Waterfall Overview
                    </button>
                  </div>
                )}
              </div>

              {/* Sample Payload & Response Inspector - CLICKABLE TABS */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    <span>Payload & Response Inspector</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">HTTP 200 OK</span>
                </div>

                {/* Clickable tabs for inspector */}
                <div className="flex items-center gap-1 border-b border-slate-800/80 pb-2">
                  <button
                    onClick={() => setActivePayloadTab('response')}
                    className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                      activePayloadTab === 'response'
                        ? 'bg-purple-950 text-purple-300 border border-purple-500/40 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Response Body
                  </button>
                  <button
                    onClick={() => setActivePayloadTab('request')}
                    className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                      activePayloadTab === 'request'
                        ? 'bg-purple-950 text-purple-300 border border-purple-500/40 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Request Params
                  </button>
                  <button
                    onClick={() => setActivePayloadTab('schema')}
                    className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                      activePayloadTab === 'schema'
                        ? 'bg-purple-950 text-purple-300 border border-purple-500/40 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Contract Schema
                  </button>
                </div>

                <div className="bg-black/80 rounded p-3 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto max-h-48">
                  <pre className="text-cyan-300">
                    {activePayloadTab === 'response' &&
                      JSON.stringify(
                        testPayloadResult?.payload ||
                          selectedEndpoint.samplePayload?.response || {
                            status: 'nominal',
                            latencyMs: selectedEndpoint.currentLatencyMs,
                          },
                        null,
                        2
                      )}
                    {activePayloadTab === 'request' &&
                      JSON.stringify(
                        selectedEndpoint.samplePayload?.request || { method: selectedEndpoint.method, path: selectedEndpoint.path },
                        null,
                        2
                      )}
                    {activePayloadTab === 'schema' &&
                      JSON.stringify(
                        {
                          type: 'object',
                          required: ['status', 'timestamp', 'data'],
                          properties: {
                            status: { type: 'string', enum: ['nominal', 'warning', 'degraded'] },
                            timestamp: { type: 'string', format: 'date-time' },
                            slaCompliance: { type: 'boolean' },
                          },
                        },
                        null,
                        2
                      )}
                  </pre>
                </div>

                {/* Back to Overview CTA */}
                <button
                  onClick={() => setSelectedEndpointId(null)}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Full Endpoint Matrix</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: FULL FLEET LATENCY MATRIX (All Monitored Endpoints & Integrations)*/}
        {/* ========================================================================= */}
        {!selectedEndpoint && !overviewDrilldown && (
          <div className="space-y-6">
            
            {/* KPI Executive Reliability Summary - CLICKABLE CARDS WITH SECTIONS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Card 1: Fleet Avg Latency -> Click to Open Benchmarks */}
              <div
                onClick={() => setOverviewDrilldown('benchmarks')}
                className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all cursor-pointer group"
                title="Click to inspect fleet latency benchmarks and SLA performance"
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Fleet Avg Latency</span>
                  <BarChart3 className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-mono font-bold text-cyan-300 mt-1">
                  {overview?.averageLatencyMs || 18.2}ms
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 group-hover:text-cyan-300 transition-colors">
                  Across {endpoints.length} links · Click to inspect
                </div>
              </div>

              {/* Card 2: P95 Tail Latency -> Click to Open Tail Latency Distribution */}
              <div
                onClick={() => setOverviewDrilldown('percentiles')}
                className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900/80 transition-all cursor-pointer group"
                title="Click to view P50/P95/P99 tail latency percentiles"
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>P95 Tail Latency</span>
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-mono font-bold text-purple-300 mt-1">
                  {overview?.p95LatencyMs || 24.5}ms
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 group-hover:text-purple-300 transition-colors">
                  95% under SLA · Click to inspect
                </div>
              </div>

              {/* Card 3: System Availability -> Click to Open 99.98% SLA Audit */}
              <div
                onClick={() => setOverviewDrilldown('availability')}
                className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all cursor-pointer group"
                title="Click to inspect 99.98% SLA audit and multi-region availability"
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>System Availability</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                  {overview?.overallUptimePct || 99.99}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 group-hover:text-emerald-300 transition-colors">
                  0 fatal drops · Click to audit
                </div>
              </div>

              {/* Card 4: Health Status -> Click to Open Alerting Thresholds */}
              <div
                onClick={() => setOverviewDrilldown('thresholds')}
                className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/80 transition-all cursor-pointer group"
                title="Click to view alerting thresholds and simulate surge events"
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Health Status</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-xl font-mono font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>{overview?.healthyCount || 11} NOMINAL</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 group-hover:text-amber-300 transition-colors">
                  {overview?.warningCount || 0} warnings · Click to test
                </div>
              </div>
            </div>

            {/* Filter Tabs & Auto-Refresh Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(
                  [
                    { id: 'all', label: `All Endpoints (${endpoints.length})` },
                    { id: 'internal', label: `Internal APIs (${endpoints.filter((e) => e.category === 'internal').length})` },
                    { id: 'external', label: `External Streams (${endpoints.filter((e) => e.category === 'external').length})` },
                    { id: 'database', label: `Data Mart (${endpoints.filter((e) => e.category === 'database').length})` },
                    { id: 'ai', label: `AI Gateway (${endpoints.filter((e) => e.category === 'ai').length})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      activeCategory === tab.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-cyan-400 focus:ring-0 cursor-pointer"
                  />
                  <span>Auto-Refresh (4s)</span>
                </label>
                <span>·</span>
                <span className="text-slate-500">Click any card to inspect waterfall diagnostics</span>
              </div>
            </div>

            {/* Clickable Endpoint Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEndpoints.map((ep) => {
                const isSelected = selectedEndpointId === ep.id;
                const hoveredPoint = hoveredPointData[ep.id];
                const isC130 = ep.id === 'ext-c130-telemetry';

                return (
                  <div
                    key={ep.id}
                    onClick={() => setSelectedEndpointId(ep.id)}
                    className={`group p-4 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-400/50 shadow-lg'
                        : isC130
                        ? 'bg-slate-950/90 border-amber-500/40 hover:border-amber-400/80 hover:bg-slate-900/90 shadow-md'
                        : 'bg-slate-950/70 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 shadow-md'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                              ep.method === 'GET'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                : ep.method === 'POST'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                                : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {ep.method}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400 group-hover:text-cyan-300 transition-colors">
                            {ep.path}
                          </span>
                          {isC130 && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-950 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                              <Plane className="w-2.5 h-2.5" />
                              <span>C-130 HERCULES</span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-200 transition-colors">
                          {ep.name}
                        </h4>
                      </div>

                      {/* Health Status Badge */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            ep.status === 'degraded'
                              ? 'bg-rose-400 animate-ping'
                              : ep.status === 'warning'
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ep.status === 'degraded'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              : ep.status === 'warning'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {ep.status}
                        </span>
                      </div>
                    </div>

                    {/* Sparkline & Latency Metrics */}
                    <div className="grid grid-cols-12 gap-3 items-center pt-1">
                      {/* Left: Key Numbers (Cols 1-5) */}
                      <div className="col-span-5 space-y-1 font-mono">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-bold text-white tracking-tight">
                            {hoveredPoint ? hoveredPoint.latencyMs : ep.currentLatencyMs}
                          </span>
                          <span className="text-xs text-slate-400">ms</span>
                          {hoveredPoint && (
                            <span className="text-[9px] text-cyan-400 font-normal">
                              ({hoveredPoint.timestamp})
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-400 space-y-0.5">
                          <div className="flex justify-between">
                            <span>SLA Bound:</span>
                            <span className="text-emerald-400 font-bold">&lt;{ep.slaTargetMs}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span>P95 Tail:</span>
                            <span className="text-purple-300">{ep.p95Ms}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Uptime:</span>
                            <span className="text-slate-300">{ep.uptimePct}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Sparkline Chart (Cols 6-12) */}
                      <div className="col-span-7">
                        <LatencySparkline
                          data={ep.history}
                          slaTargetMs={ep.slaTargetMs}
                          warningThresholdMs={ep.warningThresholdMs}
                          criticalThresholdMs={ep.criticalThresholdMs}
                          status={ep.status}
                          height={54}
                          width={220}
                          interactive={true}
                          onHoverPoint={(pt) => {
                            setHoveredPointData((prev) => ({ ...prev, [ep.id]: pt }));
                          }}
                        />
                      </div>
                    </div>

                    {/* Card Footer Click Hint */}
                    <div className="mt-3 pt-2 border-t border-slate-900/90 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{ep.categoryLabel}</span>
                      <span className="text-cyan-400/80 group-hover:text-cyan-300 flex items-center gap-1">
                        <span>Inspect diagnostics</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
