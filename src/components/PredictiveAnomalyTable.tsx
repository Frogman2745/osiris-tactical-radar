import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  ExternalLink, 
  Crosshair, 
  Radio, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Maximize2, 
  X, 
  Eye, 
  Activity, 
  ArrowUpRight,
  Database,
  RefreshCw,
  Zap,
  ChevronRight
} from 'lucide-react';

export interface DetailedAnomaly {
  id: string;
  timestamp: string;
  relativeTime: string;
  airframeId: string;
  callsign: string;
  model: string;
  base: string;
  baseCode: string;
  metric: string;
  value: number;
  expectedLimit: number;
  deltaPct: number;
  zScore: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  rootCause: string;
  mitigation: string;
  status: 'active' | 'mitigated' | 'quarantined';
  telemetrySnapshot: {
    lat: number;
    lng: number;
    altitudeFt: number;
    speedKts: number;
    headingDeg: number;
    fuelRemainingPct: number;
    retardantCapacityGal: number;
    hydraulicPressurePsi: number;
    ambientTempF: number;
    windVelocityKts: number;
    transponderSquawk: string;
  };
}

interface PredictiveAnomalyTableProps {
  onSelectAnomaly?: (anomaly: any) => void;
  onNavigateToAsset?: (assetIdOrCallsign: string) => void;
  activeAnomalyId?: string;
}

export const PredictiveAnomalyTable: React.FC<PredictiveAnomalyTableProps> = ({
  onSelectAnomaly,
  onNavigateToAsset,
  activeAnomalyId,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [selectedSnapshot, setSelectedSnapshot] = useState<DetailedAnomaly | null>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);

  // Real-time anomalies database
  const anomalies: DetailedAnomaly[] = useMemo(() => [
    {
      id: 'ANOM-SEP-28',
      timestamp: '2026-09-28 20:14:22 UTC',
      relativeTime: '12m ago',
      airframeId: 'air-118',
      callsign: 'TANKER-118',
      model: 'C-130H Hercules',
      base: 'McClellan Tanker Base',
      baseCode: 'SAC',
      metric: 'Turnaround Latency',
      value: 23.2,
      expectedLimit: 20.0,
      deltaPct: +16.0,
      zScore: 2.84,
      severity: 'critical',
      rootCause: 'Telemetry sensor flagged micro-leakage in secondary bay door actuator cylinder prior to taxi clearance.',
      mitigation: 'Grounded airframe for rapid pneumatic seal rebuild; shifted primary drop queue to 2x S-2T Turbo Trackers.',
      status: 'quarantined',
      telemetrySnapshot: {
        lat: 38.6675,
        lng: -121.3982,
        altitudeFt: 75,
        speedKts: 0,
        headingDeg: 160,
        fuelRemainingPct: 82.4,
        retardantCapacityGal: 4000,
        hydraulicPressurePsi: 2420,
        ambientTempF: 98,
        windVelocityKts: 8,
        transponderSquawk: '1200'
      }
    },
    {
      id: 'ANOM-SEP-23',
      timestamp: '2026-09-23 15:42:08 UTC',
      relativeTime: '5d ago',
      airframeId: 'air-96',
      callsign: 'TANKER-96',
      model: 'S-2T Turbo Tracker',
      base: 'Paso Robles Base',
      baseCode: 'PRB',
      metric: 'Reload Duration',
      value: 19.8,
      expectedLimit: 17.0,
      deltaPct: +16.5,
      zScore: 1.95,
      severity: 'medium',
      rootCause: 'Secondary retardant slurry mixer pump manifold pressure dropped below 45 PSI during simultaneous fill sequence.',
      mitigation: 'Engaged auxiliary booster tender; established staggered 4.5-minute queue intervals.',
      status: 'mitigated',
      telemetrySnapshot: {
        lat: 35.6322,
        lng: -120.6942,
        altitudeFt: 840,
        speedKts: 185,
        headingDeg: 310,
        fuelRemainingPct: 61.0,
        retardantCapacityGal: 1200,
        hydraulicPressurePsi: 3050,
        ambientTempF: 101,
        windVelocityKts: 14,
        transponderSquawk: '5241'
      }
    },
    {
      id: 'ANOM-SEP-15',
      timestamp: '2026-09-15 18:22:50 UTC',
      relativeTime: '13d ago',
      airframeId: 'air-902',
      callsign: 'COPTER-902',
      model: 'UH-1H Super Huey',
      base: 'Humboldt Bay Ops Base',
      baseCode: 'HMB',
      metric: 'Turnaround Latency',
      value: 21.4,
      expectedLimit: 17.5,
      deltaPct: +22.3,
      zScore: 2.31,
      severity: 'high',
      rootCause: 'Vapor lock cavitation in auxiliary fueling tender during high ambient temperature (104°F) ground operation.',
      mitigation: 'Replaced high-pressure bleed valve; pre-staged refrigerated fuel tender at Boggs Mountain.',
      status: 'mitigated',
      telemetrySnapshot: {
        lat: 40.8012,
        lng: -124.1624,
        altitudeFt: 2100,
        speedKts: 110,
        headingDeg: 45,
        fuelRemainingPct: 48.5,
        retardantCapacityGal: 360,
        hydraulicPressurePsi: 2980,
        ambientTempF: 104,
        windVelocityKts: 6,
        transponderSquawk: '5202'
      }
    },
    {
      id: 'ANOM-SEP-08',
      timestamp: '2026-09-08 14:05:11 UTC',
      relativeTime: '20d ago',
      airframeId: 'air-80',
      callsign: 'TANKER-80',
      model: 'S-2T Turbo Tracker',
      base: 'Redding Air Attack Base',
      baseCode: 'RDD',
      metric: 'Turnaround Latency',
      value: 22.8,
      expectedLimit: 18.0,
      deltaPct: +26.7,
      zScore: 2.72,
      severity: 'critical',
      rootCause: 'Severe microburst turbulence forced holding pattern; ground reload sequence halted pending wind velocity stabilization.',
      mitigation: 'Rerouted Tanker 96 from Paso Robles; automated dispatch diverted reload sequence to Chico auxiliary runway.',
      status: 'mitigated',
      telemetrySnapshot: {
        lat: 40.5089,
        lng: -122.2934,
        altitudeFt: 8500,
        speedKts: 242,
        headingDeg: 42,
        fuelRemainingPct: 68.2,
        retardantCapacityGal: 1200,
        hydraulicPressurePsi: 3100,
        ambientTempF: 96,
        windVelocityKts: 34,
        transponderSquawk: '5214'
      }
    }
  ], []);

  // Filter anomalies based on search query and severity
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter((a) => {
      if (severityFilter !== 'all' && a.severity !== severityFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.id.toLowerCase().includes(q) ||
        a.callsign.toLowerCase().includes(q) ||
        a.model.toLowerCase().includes(q) ||
        a.base.toLowerCase().includes(q) ||
        a.baseCode.toLowerCase().includes(q) ||
        a.rootCause.toLowerCase().includes(q)
      );
    });
  }, [anomalies, severityFilter, searchQuery]);

  // CSV Exporter for Anomaly Audit
  const handleExportCsv = () => {
    const headers = ['ID', 'Timestamp', 'Airframe', 'Base', 'Metric', 'Observed', 'Limit', 'DeltaPct', 'ZScore', 'Severity', 'RootCause'];
    const rows = filteredAnomalies.map(a => [
      a.id,
      a.timestamp,
      `${a.callsign} (${a.model})`,
      `${a.base} (${a.baseCode})`,
      a.metric,
      a.value,
      a.expectedLimit,
      `${a.deltaPct}%`,
      a.zScore,
      a.severity.toUpperCase(),
      `"${a.rootCause.replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `axiombi_predictive_anomalies_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
      
      {/* Top Header & Live Telemetry Feed Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Radio className={`w-3.5 h-3.5 text-cyan-400 ${isLiveStreaming ? 'animate-pulse' : ''}`} />
            <span className="font-bold uppercase tracking-wider">REAL-TIME PREDICTIVE ANOMALY FEED</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">TELEMETRY SURVEILLANCE & INVESTIGATION</span>
          </div>
          <h2 className="text-base font-bold text-white font-mono tracking-tight flex items-center gap-2">
            <span>OPERATIONAL ANOMALIES & TELEMETRY AUDIT LOG</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-normal">
              {filteredAnomalies.length} Flagged
            </span>
          </h2>
        </div>

        {/* Live Stream Status & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
              isLiveStreaming
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-sm shadow-emerald-950'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLiveStreaming ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
            <span>{isLiveStreaming ? 'STREAM: LIVE' : 'STREAM: PAUSED'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by callsign, base, or diagnosis..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Severity Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <span className="text-slate-500 text-[11px] shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-cyan-400" />
            <span>Severity:</span>
          </span>
          {[
            { id: 'all', label: 'All Severities' },
            { id: 'critical', label: 'Critical' },
            { id: 'high', label: 'High' },
            { id: 'medium', label: 'Medium' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSeverityFilter(f.id as any)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-all cursor-pointer whitespace-nowrap ${
                severityFilter === f.id
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-sm shadow-cyan-950'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Anomalies Table */}
      <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 sticky top-0">
            <tr>
              <th className="py-2.5 px-3 whitespace-nowrap text-cyan-400 font-bold">Severity / ID</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Timestamp</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Airframe & Base</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Observed vs Limit</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Z-Score</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Root Cause Diagnosis</th>
              <th className="py-2.5 px-3 whitespace-nowrap text-right">Telemetry Navigation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 tabular-nums">
            {filteredAnomalies.length > 0 ? (
              filteredAnomalies.map((anom) => {
                const isActive = activeAnomalyId === anom.id;

                return (
                  <tr 
                    key={anom.id}
                    className={`transition-colors cursor-pointer ${
                      isActive 
                        ? 'bg-cyan-950/40 border-l-2 border-l-cyan-400' 
                        : 'hover:bg-slate-900/50'
                    }`}
                    onClick={() => onSelectAnomaly?.(anom)}
                  >
                    {/* Severity & ID */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          anom.severity === 'critical' ? 'bg-red-500 animate-pulse' :
                          anom.severity === 'high' ? 'bg-amber-500' : 'bg-yellow-400'
                        }`} />
                        <div>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            anom.severity === 'critical' 
                              ? 'bg-red-950/80 border-red-500 text-red-300' 
                              : anom.severity === 'high'
                              ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                              : 'bg-yellow-950/80 border-yellow-500 text-yellow-300'
                          }`}>
                            {anom.severity}
                          </span>
                          <span className="text-white font-bold block mt-0.5 text-[11px]">{anom.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{anom.relativeTime}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">{anom.timestamp.split(' ')[0]}</span>
                    </td>

                    {/* Airframe & Base */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-cyan-300 text-[11px]">{anom.callsign}</div>
                      <div className="text-[10px] text-slate-400">
                        {anom.model} · <strong className="text-slate-300">{anom.baseCode}</strong>
                      </div>
                    </td>

                    {/* Observed vs Limit */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-red-400 font-bold text-sm">{anom.value}m</span>
                        <span className="text-[10px] text-slate-500">/ {anom.expectedLimit}m</span>
                      </div>
                      <span className="text-[10px] text-red-400 font-bold block">
                        +{anom.deltaPct}% Breach
                      </span>
                    </td>

                    {/* Z-Score */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="px-2 py-0.5 rounded bg-black/60 border border-slate-800 text-amber-400 font-bold text-xs inline-block">
                        +{anom.zScore}σ
                      </div>
                      <span className="text-[9px] text-slate-500 block mt-0.5">Gaussian StdDev</span>
                    </td>

                    {/* Root Cause */}
                    <td className="py-3 px-3 max-w-xs">
                      <div className="text-slate-300 text-[11px] line-clamp-2 leading-relaxed">
                        {anom.rootCause}
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-0.5 truncate flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>{anom.mitigation}</span>
                      </div>
                    </td>

                    {/* Telemetry Navigation Actions */}
                    <td className="py-3 px-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Inspect Raw Telemetry Snapshot Modal */}
                        <button
                          onClick={() => setSelectedSnapshot(anom)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 rounded transition-all cursor-pointer"
                          title="Open live telemetry sensor snapshot"
                        >
                          <Activity className="w-3 h-3 text-cyan-400" />
                          <span>Telemetry</span>
                        </button>

                        {/* Focus on Radar Map */}
                        <button
                          onClick={() => {
                            onNavigateToAsset?.(anom.airframeId);
                            onSelectAnomaly?.(anom);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded transition-all cursor-pointer"
                          title="Center target on OSIRIS radar map"
                        >
                          <Crosshair className="w-3 h-3 text-amber-400" />
                          <span>Radar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No anomalies match the current filter or search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* RAW TELEMETRY INSPECTOR MODAL */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-950 border border-cyan-500/80 rounded-2xl p-6 max-w-2xl w-full shadow-2xl font-mono text-xs relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    SOURCE TELEMETRY DOSSIER // {selectedSnapshot.id}
                  </h3>
                  <span className="text-[11px] text-cyan-400">
                    Asset: {selectedSnapshot.callsign} ({selectedSnapshot.model}) · {selectedSnapshot.base}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedSnapshot(null)}
                className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Telemetry Sensor Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">GPS COORDINATES</span>
                <span className="text-cyan-300 font-bold text-xs">
                  {selectedSnapshot.telemetrySnapshot.lat.toFixed(4)}°N, {Math.abs(selectedSnapshot.telemetrySnapshot.lng).toFixed(4)}°W
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">ALTITUDE / SPEED</span>
                <span className="text-white font-bold text-xs">
                  {selectedSnapshot.telemetrySnapshot.altitudeFt.toLocaleString()} ft · {selectedSnapshot.telemetrySnapshot.speedKts} kts
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">HYDRAULIC PRESSURE</span>
                <span className={`font-bold text-xs ${
                  selectedSnapshot.telemetrySnapshot.hydraulicPressurePsi < 2600 ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {selectedSnapshot.telemetrySnapshot.hydraulicPressurePsi} PSI
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">FUEL REMAINING</span>
                <span className="text-amber-400 font-bold text-xs">
                  {selectedSnapshot.telemetrySnapshot.fuelRemainingPct}%
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">RETARDANT PAYLOAD</span>
                <span className="text-cyan-300 font-bold text-xs">
                  {selectedSnapshot.telemetrySnapshot.retardantCapacityGal.toLocaleString()} gal
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">AMBIENT WEATHER</span>
                <span className="text-slate-300 font-bold text-xs">
                  {selectedSnapshot.telemetrySnapshot.ambientTempF}°F · Wind {selectedSnapshot.telemetrySnapshot.windVelocityKts} kts
                </span>
              </div>
            </div>

            {/* Root Cause & Tactical Mitigation */}
            <div className="space-y-2 mb-4">
              <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/40">
                <span className="text-red-400 font-bold block mb-1">DIAGNOSED ROOT CAUSE:</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {selectedSnapshot.rootCause}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
                <span className="text-emerald-400 font-bold block mb-1">AUTOMATED TACTICAL MITIGATION:</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {selectedSnapshot.mitigation}
                </p>
              </div>
            </div>

            {/* Raw JSON ADS-B Transponder Stream */}
            <div>
              <span className="text-slate-400 text-[11px] font-bold block mb-1.5 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Raw Ingested ADS-B Sensor Packet (PostgreSQL Record)</span>
              </span>
              <pre className="p-3 rounded-lg bg-black border border-slate-800 text-[10px] text-cyan-300 overflow-x-auto leading-relaxed">
                {JSON.stringify(
                  {
                    anomaly_id: selectedSnapshot.id,
                    airframe: selectedSnapshot.callsign,
                    base_id: selectedSnapshot.baseCode,
                    recorded_utc: selectedSnapshot.timestamp,
                    metric: selectedSnapshot.metric,
                    observed_value_min: selectedSnapshot.value,
                    expected_sla_min: selectedSnapshot.expectedLimit,
                    variance_delta: `+${selectedSnapshot.deltaPct}%`,
                    z_score: selectedSnapshot.zScore,
                    transponder_telemetry: selectedSnapshot.telemetrySnapshot
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            {/* Modal Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                Calibrated against CAL FIRE CISRM 2026 Data Mart
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onNavigateToAsset?.(selectedSnapshot.airframeId);
                    onSelectAnomaly?.(selectedSnapshot);
                    setSelectedSnapshot(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Focus On OSIRIS Radar</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
