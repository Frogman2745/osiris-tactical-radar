import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  ArrowUpRight, 
  Clock, 
  Filter, 
  Search, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  Terminal, 
  Crosshair, 
  ExternalLink, 
  Activity, 
  Database, 
  ChevronRight,
  RefreshCw,
  Eye,
  Sliders,
  Check,
  Copy,
  Zap
} from 'lucide-react';
import { PredictivePoint } from '../types';

export interface PredictiveAlert {
  id: string;
  logEventId: string;
  timestamp: string;
  relativeTime: string;
  airframeId: string;
  callsign: string;
  model: string;
  base: string;
  baseCode: string;
  metric: string;
  observedValue: number;
  expectedLimit: number;
  deltaPct: number;
  zScore: number;
  severity: 'critical' | 'high' | 'medium';
  status: 'active' | 'investigating' | 'mitigated';
  rootCause: string;
  mitigation: string;
  telemetryLogEntry: {
    logId: string;
    level: 'CRITICAL' | 'WARN' | 'INFO';
    facility: string;
    subsystem: string;
    rawMessage: string;
    ingestLatencyMs: number;
    metrics: Record<string, any>;
  };
}

interface AlertManagerProps {
  onSelectAnomaly?: (anomaly: any) => void;
  onNavigateToAsset?: (assetIdOrCallsign: string) => void;
  onOpenResolveAnomaly?: (anomaly: any) => void;
  resolvedAnomalyIds?: string[];
  activeAnomalyId?: string;
  className?: string;
}

export const AlertManager: React.FC<AlertManagerProps> = ({
  onSelectAnomaly,
  onNavigateToAsset,
  onOpenResolveAnomaly,
  resolvedAnomalyIds = [],
  activeAnomalyId,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'mitigated'>('all');
  const [highlightedLogId, setHighlightedLogId] = useState<string | null>('LOG-EV-9821');
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [isLiveStreamActive, setIsLiveStreamActive] = useState<boolean>(true);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const logItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Real-time predictive anomalies integrated with the PredictiveDashboard dataset
  const alerts: PredictiveAlert[] = useMemo(() => [
    {
      id: 'ANOM-SEP-28',
      logEventId: 'LOG-EV-9821',
      timestamp: '2026-09-28 20:14:22 UTC',
      relativeTime: '12m ago',
      airframeId: 'air-118',
      callsign: 'TANKER-118',
      model: 'C-130H Hercules',
      base: 'McClellan Tanker Base',
      baseCode: 'SAC',
      metric: 'Turnaround Latency',
      observedValue: 23.2,
      expectedLimit: 20.0,
      deltaPct: 16.0,
      zScore: 2.84,
      severity: 'critical',
      status: 'active',
      rootCause: 'Telemetry sensor flagged micro-leakage in secondary bay door actuator cylinder prior to taxi clearance.',
      mitigation: 'Grounded airframe for rapid pneumatic seal rebuild; shifted primary drop queue to 2x S-2T Turbo Trackers.',
      telemetryLogEntry: {
        logId: 'LOG-EV-9821',
        level: 'CRITICAL',
        facility: 'SAC-OPS-LINE',
        subsystem: 'HYDRAULIC_MONITOR',
        rawMessage: '[CRITICAL ANOMALY ALERT] TANKER-118 (C-130H) hydraulic actuator quarantine hold. Turnaround latency reached 23.2m (exceeded 20.0m limit). Pneumatic bypass valve flagged pressure drop to 2,420 PSI.',
        ingestLatencyMs: 14.2,
        metrics: {
          HydraulicPressure: '2,420 PSI (Threshold: >2,800)',
          TurnaroundMins: '23.2m',
          RunwaySlot: 'Ramp-4B',
          DispatchAction: 'Quarantine Hold & Ground Seal Swap'
        }
      }
    },
    {
      id: 'ANOM-SEP-23',
      logEventId: 'LOG-EV-9644',
      timestamp: '2026-09-23 15:42:08 UTC',
      relativeTime: '5d ago',
      airframeId: 'air-96',
      callsign: 'TANKER-96',
      model: 'S-2T Turbo Tracker',
      base: 'Paso Robles Base',
      baseCode: 'PRB',
      metric: 'Reload Duration',
      observedValue: 19.8,
      expectedLimit: 17.0,
      deltaPct: 16.5,
      zScore: 1.95,
      severity: 'medium',
      status: 'mitigated',
      rootCause: 'Secondary retardant slurry mixer pump manifold pressure dropped below 45 PSI during simultaneous fill sequence.',
      mitigation: 'Engaged auxiliary booster tender; established staggered 4.5-minute queue intervals.',
      telemetryLogEntry: {
        logId: 'LOG-EV-9644',
        level: 'WARN',
        facility: 'PRB-SLURRY-PIT',
        subsystem: 'RETARDANT_MANIFOLD',
        rawMessage: '[PREDICTIVE WARNING] TANKER-96 (S-2T) reload duration spike to 19.8m. Slurry mixer pump manifold pressure oscillated between 41-45 PSI during simultaneous dual-fill.',
        ingestLatencyMs: 12.8,
        metrics: {
          PumpPressure: '42.4 PSI (Nominal: 60)',
          SlurryFlowRate: '410 GPM',
          TurnaroundMins: '19.8m',
          DispatchAction: 'Standby Booster Pump Engaged'
        }
      }
    },
    {
      id: 'ANOM-SEP-15',
      logEventId: 'LOG-EV-9412',
      timestamp: '2026-09-15 18:22:50 UTC',
      relativeTime: '13d ago',
      airframeId: 'air-902',
      callsign: 'COPTER-902',
      model: 'UH-1H Super Huey',
      base: 'Humboldt Bay Ops Base',
      baseCode: 'HMB',
      metric: 'Turnaround Latency',
      observedValue: 21.4,
      expectedLimit: 17.5,
      deltaPct: 22.3,
      zScore: 2.31,
      severity: 'high',
      status: 'mitigated',
      rootCause: 'Vapor lock cavitation in auxiliary fueling tender during high ambient temperature (104°F) ground operation.',
      mitigation: 'Replaced high-pressure bleed valve; pre-staged refrigerated fuel tender at Boggs Mountain.',
      telemetryLogEntry: {
        logId: 'LOG-EV-9412',
        level: 'WARN',
        facility: 'HMB-HELITACK-02',
        subsystem: 'FUEL_DISPATCH',
        rawMessage: '[HIGH SEVERITY ANOMALY] COPTER-902 (UH-1H) fuel booster valve cavitation recorded. Ambient heat wave 104°F created thermal vapor lock in ground tender manifold. Sortie turnaround: 21.4m.',
        ingestLatencyMs: 18.1,
        metrics: {
          AmbientTemp: '104°F',
          FuelPressure: '18.2 PSI (Erratic)',
          TurnaroundMins: '21.4m',
          DispatchAction: 'Refrigerated Tender Dispatched'
        }
      }
    },
    {
      id: 'ANOM-SEP-08',
      logEventId: 'LOG-EV-9108',
      timestamp: '2026-09-08 14:05:11 UTC',
      relativeTime: '20d ago',
      airframeId: 'air-80',
      callsign: 'TANKER-80',
      model: 'S-2T Turbo Tracker',
      base: 'Redding Air Attack Base',
      baseCode: 'RDD',
      metric: 'Turnaround Latency',
      observedValue: 22.8,
      expectedLimit: 18.0,
      deltaPct: 26.7,
      zScore: 2.72,
      severity: 'critical',
      status: 'mitigated',
      rootCause: 'Severe microburst turbulence forced holding pattern; ground reload sequence halted pending wind velocity stabilization.',
      mitigation: 'Rerouted Tanker 96 from Paso Robles; automated dispatch diverted reload sequence to Chico auxiliary runway.',
      telemetryLogEntry: {
        logId: 'LOG-EV-9108',
        level: 'CRITICAL',
        facility: 'RDD-DISPATCH-01',
        subsystem: 'AIR_TRAFFIC_SUPERVISION',
        rawMessage: '[CRITICAL ANOMALY ALERT] TANKER-80 (S-2T) holding pattern forced due to severe thermal microburst over Shasta sector. Ground reload halted. Turnaround latency: 22.8m (Limit: 18.0m).',
        ingestLatencyMs: 9.4,
        metrics: {
          MicroburstWind: '34 kts (Gusting 48)',
          HoldingPatternMins: '5.8m',
          TurnaroundMins: '22.8m',
          DispatchAction: 'Diverted Sorties to Chico'
        }
      }
    }
  ], []);

  // Filtered anomalies list
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (severityFilter !== 'all' && alert.severity !== severityFilter) {
        return false;
      }
      if (statusFilter !== 'all' && alert.status !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        alert.id.toLowerCase().includes(q) ||
        alert.callsign.toLowerCase().includes(q) ||
        alert.model.toLowerCase().includes(q) ||
        alert.base.toLowerCase().includes(q) ||
        alert.rootCause.toLowerCase().includes(q) ||
        alert.telemetryLogEntry.rawMessage.toLowerCase().includes(q)
      );
    });
  }, [alerts, severityFilter, statusFilter, searchQuery]);

  // Operational logs derived directly from alert telemetry entries
  const operationalLogs = useMemo(() => {
    return alerts.map(a => a.telemetryLogEntry);
  }, [alerts]);

  // "Jump to Telemetry" action handler
  const handleJumpToTelemetry = (alert: PredictiveAlert) => {
    const logId = alert.telemetryLogEntry.logId;
    setHighlightedLogId(logId);
    onSelectAnomaly?.(alert);

    // Smooth scroll the target log into view in the operational logs terminal
    setTimeout(() => {
      const targetElement = logItemRefs.current[logId];
      if (targetElement && logContainerRef.current) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  };

  const copyLogText = (text: string, logId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLogId(logId);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  return (
    <div className={`bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-6 ${className}`}>
      
      {/* Alert Manager Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Radio className={`w-3.5 h-3.5 text-cyan-400 ${isLiveStreamActive ? 'animate-pulse' : ''}`} />
            <span className="font-bold uppercase tracking-wider">AxiomBI AlertManager</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">Real-Time Predictive Anomaly Triage</span>
          </div>
          <h2 className="text-lg font-bold text-white font-mono tracking-tight flex items-center gap-3">
            <span>PREDICTIVE ANOMALY STREAM & TELEMETRY LOG TRACER</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-normal">
              {filteredAlerts.length} Flagged Events
            </span>
          </h2>
        </div>

        {/* Live Status & Quick Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsLiveStreamActive(!isLiveStreamActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
              isLiveStreamActive
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-sm shadow-emerald-950'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLiveStreamActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
            <span>{isLiveStreamActive ? 'STREAM: LIVE' : 'STREAM: PAUSED'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search anomalies or logs (e.g. C-130H, hydraulic, SAC)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Severity Filter */}
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 px-1 uppercase font-bold">Severity:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'critical', label: 'Critical' },
              { id: 'high', label: 'High' },
              { id: 'medium', label: 'Medium' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSeverityFilter(f.id as any)}
                className={`px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                  severityFilter === f.id
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 px-1 uppercase font-bold">Status:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'mitigated', label: 'Mitigated' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id as any)}
                className={`px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                  statusFilter === s.id
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DUAL PANE: LEFT = ANOMALY TABLE (7 COLS), RIGHT = OPERATIONAL LOG TRACER (5 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANE: REAL-TIME ANOMALIES TABLE */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              <span>Flagged Predictive Anomalies ({filteredAlerts.length})</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Click &apos;Jump to Telemetry&apos; to locate log event
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 text-cyan-400 font-bold whitespace-nowrap">Severity / ID</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Airframe & Base</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Observed SLA</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Z-Score</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 tabular-nums">
                {filteredAlerts.length > 0 ? (
                  filteredAlerts.map((alert) => {
                    const isSelected = activeAnomalyId === alert.id || highlightedLogId === alert.telemetryLogEntry.logId;

                    return (
                      <tr
                        key={alert.id}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/40 border-l-2 border-l-cyan-400'
                            : 'hover:bg-slate-900/40'
                        }`}
                        onClick={() => handleJumpToTelemetry(alert)}
                      >
                        {/* Severity & ID */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              alert.severity === 'critical' ? 'bg-red-500 animate-pulse' :
                              alert.severity === 'high' ? 'bg-amber-500' : 'bg-yellow-400'
                            }`} />
                            <div>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                alert.severity === 'critical' ? 'bg-red-950/80 border-red-500 text-red-300' :
                                alert.severity === 'high' ? 'bg-amber-950/80 border-amber-500 text-amber-300' :
                                'bg-yellow-950/80 border-yellow-500 text-yellow-300'
                              }`}>
                                {alert.severity}
                              </span>
                              <span className="text-white font-bold block mt-0.5 text-[11px]">{alert.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Airframe & Base */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-bold text-cyan-300 text-[11px]">{alert.callsign}</div>
                          <div className="text-[10px] text-slate-400">
                            {alert.model} · <strong className="text-slate-300">{alert.baseCode}</strong>
                          </div>
                        </td>

                        {/* Observed vs Limit */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-baseline gap-1">
                            <span className="text-red-400 font-bold text-sm">{alert.observedValue}m</span>
                            <span className="text-[10px] text-slate-500">/ {alert.expectedLimit}m</span>
                          </div>
                          <span className="text-[10px] text-red-400 font-bold block">
                            +{alert.deltaPct}% Exceeded
                          </span>
                        </td>

                        {/* Z-Score */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-black/60 border border-slate-800 text-amber-400 font-bold text-xs inline-block">
                            +{alert.zScore}σ
                          </span>
                        </td>

                        {/* Action Buttons: Resolve RCA & Jump to Telemetry */}
                        <td className="py-3 px-3 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                onOpenResolveAnomaly?.(alert);
                              }}
                              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold rounded-lg shadow-sm transition-all cursor-pointer ${
                                resolvedAnomalyIds.includes(alert.id)
                                  ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                                  : 'bg-red-950/80 border border-red-500/40 text-red-200 hover:bg-red-900/60'
                              }`}
                              title="Draft Root-Cause Analysis (RCA) note and suggest fix"
                            >
                              {resolvedAnomalyIds.includes(alert.id) ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Resolved</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3 h-3 text-amber-400" />
                                  <span>Resolve RCA</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleJumpToTelemetry(alert)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 rounded-lg shadow-sm shadow-cyan-950 transition-all cursor-pointer active:scale-95"
                              title={`Highlight ${alert.logEventId} in operational logs terminal`}
                            >
                              <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                              <span>Telemetry</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No predictive anomalies found for current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT PANE: OPERATIONAL LOGS TERMINAL & TELEMETRY EVENT TRACER */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Operational Telemetry Logs</span>
            </span>
            {highlightedLogId && (
              <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
                LOCKED: {highlightedLogId}
              </span>
            )}
          </div>

          <div
            ref={logContainerRef}
            className="overflow-y-auto max-h-[380px] space-y-2.5 p-3 rounded-xl bg-black/90 border border-slate-800/90 font-mono text-xs"
          >
            {operationalLogs.map((log) => {
              const isTargetLog = highlightedLogId === log.logId;

              return (
                <div
                  key={log.logId}
                  ref={(el) => {
                    logItemRefs.current[log.logId] = el;
                  }}
                  className={`p-3 rounded-lg border transition-all ${
                    isTargetLog
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-950/70 ring-1 ring-cyan-400/50'
                      : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Log Header Row */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/60 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        log.level === 'CRITICAL' ? 'bg-red-950 border border-red-500 text-red-300' :
                        log.level === 'WARN' ? 'bg-amber-950 border border-amber-500 text-amber-300' :
                        'bg-cyan-950 border border-cyan-500 text-cyan-300'
                      }`}>
                        {log.level}
                      </span>
                      <span className="text-cyan-300 font-bold text-[11px]">{log.logId}</span>
                      <span className="text-slate-500 text-[10px]">· {log.facility}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => copyLogText(log.rawMessage, log.logId)}
                        className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
                        title="Copy raw telemetry string"
                      >
                        {copiedLogId === log.logId ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Raw Telemetry Text */}
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5 select-text">
                    {log.rawMessage}
                  </p>

                  {/* Decoded Telemetry Key-Value Matrix */}
                  <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-900/90 text-[10px]">
                    {Object.entries(log.metrics).map(([k, v]) => (
                      <div key={k} className="p-1.5 rounded bg-black/60 border border-slate-900">
                        <span className="text-slate-500 block truncate">{k}:</span>
                        <strong className="text-cyan-300 font-bold block truncate">{v}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
            <span>Direct Socket Link: `ws://localhost:3000`</span>
            <span>Buffer: 4 Flagged Events</span>
          </div>
        </div>

      </div>

    </div>
  );
};
