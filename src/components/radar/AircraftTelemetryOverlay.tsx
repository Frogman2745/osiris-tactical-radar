import React, { useState, useEffect } from 'react';
import {
  X,
  Plane,
  Gauge,
  Clock,
  Wrench,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Compass,
  Crosshair,
  Droplets,
  Fuel,
  Thermometer,
  ExternalLink,
  ChevronRight,
  Radio,
  Video,
  FileText,
  Sliders,
  Copy,
  Check,
  Zap,
  Target
} from 'lucide-react';
import { AircraftDossier } from '../../data/aircraftMaintenanceData';

interface AircraftTelemetryOverlayProps {
  dossier: AircraftDossier;
  isOpen: boolean;
  onClose: () => void;
  onOpenLiveCam?: (cameraData: {
    title: string;
    sensor: string;
    desc: string;
    assetName: string;
    baseCode?: string;
    lat?: number;
    lng?: number;
  }) => void;
  onPlayBeep?: (freq?: number, type?: OscillatorType, duration?: number) => void;
}

export const AircraftTelemetryOverlay: React.FC<AircraftTelemetryOverlayProps> = ({
  dossier,
  isOpen,
  onClose,
  onOpenLiveCam,
  onPlayBeep,
}) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'flight_hours' | 'maintenance' | 'avionics'>('telemetry');
  const [copiedHex, setCopiedHex] = useState<boolean>(false);
  const [dropGateTesting, setDropGateTesting] = useState<boolean>(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
        onPlayBeep?.(500, 'sine', 0.04);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onPlayBeep]);

  if (!isOpen) return null;

  const { telemetry, flightHours, maintenanceHistory, transponder } = dossier;

  const handleCopyHex = () => {
    navigator.clipboard?.writeText(transponder.hex);
    setCopiedHex(true);
    onPlayBeep?.(1200, 'sine', 0.05);
    setTimeout(() => setCopiedHex(false), 2000);
  };

  const handleTestDropGate = () => {
    setDropGateTesting(true);
    onPlayBeep?.(880, 'sawtooth', 0.1);
    setTimeout(() => {
      setDropGateTesting(false);
      onPlayBeep?.(1100, 'sine', 0.08);
    }, 1800);
  };

  const isAirTanker = dossier.category === 'air_tanker';
  const isHelicopter = dossier.category === 'helicopter';

  return (
    <div
      className="absolute top-0 right-0 bottom-0 z-40 w-full sm:w-[480px] md:w-[540px] bg-slate-950/95 backdrop-blur-xl border-l border-cyan-500/50 shadow-2xl flex flex-col font-mono text-xs overflow-hidden transition-all duration-300 animate-in slide-in-from-right"
      style={{
        boxShadow: '-10px 0 35px rgba(6, 182, 212, 0.15)',
      }}
    >
      {/* Top Aircraft Header */}
      <div className="p-4 sm:p-5 border-b border-slate-900 bg-slate-950/90 relative">
        {/* Subtle scanline line */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <span>TARGET LOCK ACQUIRED</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-300">{dossier.operator}</span>
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                {dossier.name}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-800 font-bold">
                {dossier.callsign}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 pt-0.5">
              <span>{dossier.modelOrType}</span>
              <span className="text-slate-700">·</span>
              <span>TAIL: <strong className="text-white">{dossier.registration}</strong></span>
              <span className="text-slate-700">·</span>
              <span>BASE: <strong className="text-slate-300">{telemetry.homeAirbase}</strong></span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              onClose();
              onPlayBeep?.(550, 'sine', 0.04);
            }}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Close Panel (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status & Airworthiness Badge Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900/80">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                maintenanceHistory.overallAirworthiness === 'Full Mission Capable (FMC)'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                  : 'bg-amber-950/80 text-amber-300 border-amber-700'
              }`}
            >
              {maintenanceHistory.overallAirworthiness}
            </span>

            <span className="text-[10px] text-slate-400">
              NEXT PHASE IN: <strong className="text-white">{maintenanceHistory.nextPhaseDueInHours}h</strong>
            </span>
          </div>

          {/* Direct Live Camera Stream Action (If available) */}
          <button
            onClick={() => {
              onOpenLiveCam?.({
                title: `${dossier.callsign} // ON-BOARD OPTICAL NOSE SENSOR`,
                sensor: `${dossier.modelOrType} · Star SAFIRE 380-HD LWIR / 4K Optical`,
                desc: `Live real-time targeting feed from ${dossier.name} currently operating over ${telemetry.targetIncident}.`,
                assetName: dossier.name,
                lat: telemetry.coordinates.lat,
                lng: telemetry.coordinates.lng,
              });
              onPlayBeep?.(1200, 'sine', 0.05);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/80 border border-red-700 hover:bg-red-900/80 text-red-300 text-[10px] font-bold uppercase transition-all cursor-pointer shadow-sm"
          >
            <Video className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>OPTICAL SENSOR FEED</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center border-b border-slate-900 bg-slate-950 px-4 pt-2 gap-1 overflow-x-auto text-[11px]">
        {[
          { id: 'telemetry', label: 'Live Telemetry', icon: Gauge },
          { id: 'flight_hours', label: 'Flight Hours & Cycles', icon: Clock },
          { id: 'maintenance', label: 'Maintenance Log', icon: Wrench },
          { id: 'avionics', label: 'Avionics & Link', icon: Radio },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                onPlayBeep?.(850, 'sine', 0.02);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold cursor-pointer transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {/* ================= TAB 1: LIVE TELEMETRY ================= */}
        {activeTab === 'telemetry' && (
          <div className="space-y-4">
            {/* Primary Flight Instrument Gauges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase block">INDICATED SPEED</span>
                <div className="flex items-baseline justify-center gap-1 mt-0.5">
                  <span className="text-xl font-bold text-white tabular-nums">{telemetry.airspeedKts}</span>
                  <span className="text-[10px] text-slate-400">kts</span>
                </div>
                <span className="text-[9px] text-slate-400">GS: {telemetry.groundSpeedKts} kts</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase block">ALTITUDE MSL</span>
                <div className="flex items-baseline justify-center gap-1 mt-0.5">
                  <span className="text-xl font-bold text-cyan-400 tabular-nums">
                    {telemetry.altitudeMslFt.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400">ft</span>
                </div>
                <span className="text-[9px] text-slate-400">AGL: {telemetry.altitudeAglFt.toLocaleString()} ft</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase block">VERTICAL RATE</span>
                <div className="flex items-baseline justify-center gap-1 mt-0.5">
                  <span
                    className={`text-xl font-bold tabular-nums ${
                      telemetry.verticalRateFpm < 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {telemetry.verticalRateFpm > 0 ? `+${telemetry.verticalRateFpm}` : telemetry.verticalRateFpm}
                  </span>
                  <span className="text-[10px] text-slate-400">FPM</span>
                </div>
                <span className="text-[9px] text-slate-400">G-FORCE: {telemetry.gForce}G</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase block">COMPASS TRACK</span>
                <div className="flex items-baseline justify-center gap-1 mt-0.5">
                  <span className="text-xl font-bold text-white tabular-nums">
                    {telemetry.headingDeg.toString().padStart(3, '0')}°
                  </span>
                </div>
                <span className="text-[9px] text-slate-400">PITCH: {telemetry.pitchDeg}°</span>
              </div>
            </div>

            {/* Fire Retardant / Water Suppressant Subsystem */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-orange-400" />
                  <span className="font-bold text-white uppercase text-xs">
                    RETARDANT & SUPPRESSANT DELIVERY SYSTEM
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-orange-950 text-orange-400 border border-orange-800">
                  {telemetry.dropCoverageLevel}
                </span>
              </div>

              {/* Tank Fill Level Progress Bar */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">TANK PAYLOAD STATUS ({telemetry.payloadType}):</span>
                  <span className="text-white font-bold tabular-nums">
                    {telemetry.payloadCurrentGal.toLocaleString()} / {telemetry.payloadCapacityGal.toLocaleString()} Gal ({Math.round(
                      (telemetry.payloadCurrentGal / (telemetry.payloadCapacityGal || 1)) * 100
                    )}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((telemetry.payloadCurrentGal / (telemetry.payloadCapacityGal || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Subsystem Details & Proof Test */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2 rounded bg-black/40 border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] block">DROP SYSTEM:</span>
                  <span className="text-white font-medium truncate block">{telemetry.dropSystemType}</span>
                </div>

                <div className="p-2 rounded bg-black/40 border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] block">GATE ACTUATOR STATUS:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        dropGateTesting
                          ? 'bg-amber-400 animate-ping'
                          : telemetry.dropGateStatus === 'Armed & Ready'
                          ? 'bg-emerald-400'
                          : 'bg-cyan-400'
                      }`}
                    />
                    <span className="text-white font-bold">
                      {dropGateTesting ? 'GATE ACTUATING...' : telemetry.dropGateStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Proof Test Trigger Button */}
              <button
                onClick={handleTestDropGate}
                disabled={dropGateTesting}
                className="w-full py-2 px-3 rounded-lg bg-orange-950/40 hover:bg-orange-900/60 border border-orange-800/80 text-orange-300 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 text-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{dropGateTesting ? 'CYCLE PROOF TEST IN PROGRESS...' : 'EXECUTE DROP GATE ACTUATOR PROOF CYCLE'}</span>
              </button>
            </div>

            {/* Fuel & Powerplant Diagnostics */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white uppercase text-xs">
                    FUEL RESERVES & POWERPLANT HEALTH
                  </span>
                </div>
                <span className="text-[11px] text-cyan-300 font-bold tabular-nums">
                  ENDURANCE: {telemetry.enduranceRemaining}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded bg-black/40 border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] block">FUEL ON BOARD</span>
                  <span className="text-white font-bold tabular-nums">
                    {telemetry.fuelRemainingLbs.toLocaleString()} lbs
                  </span>
                  <span className="text-[9px] text-slate-400 block">{telemetry.fuelBurnRatePph} PPH</span>
                </div>

                <div className="p-2 rounded bg-black/40 border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] block">HYDRAULIC SYS A/B</span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    {telemetry.hydraulicPressureSysA} / {telemetry.hydraulicPressureSysB} PSI
                  </span>
                  <span className="text-[9px] text-slate-400 block">Nominal (3,000)</span>
                </div>

                <div className="p-2 rounded bg-black/40 border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] block">ENGINE OIL SYS</span>
                  <span className="text-white font-bold tabular-nums">
                    {telemetry.oilPressurePsi} PSI · {telemetry.oilTempC}°C
                  </span>
                  <span className="text-[9px] text-slate-400 block">Grade Royco 500</span>
                </div>

                <div className="p-2 rounded bg-black/40 border border-slate-800/80">
                  <span className="text-slate-500 text-[10px] block">TURBINE INLET (TIT)</span>
                  <span className="text-white font-bold tabular-nums">
                    {telemetry.engineTIT.map((t) => `${t}°`).join(' · ')}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Peak Max 750°C</span>
                </div>
              </div>
            </div>

            {/* Target Intercept & Spatial Telemetry */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-400" />
                  <span className="font-bold text-white uppercase text-xs">
                    TARGET FIRE INTERCEPT & SPATIAL VECTOR
                  </span>
                </div>
                <span className="text-red-400 font-bold text-[11px] truncate max-w-[200px]">
                  {telemetry.targetIncident}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded bg-black/40 border border-slate-800/80 text-center">
                  <span className="text-slate-500 text-[10px] block">DISTANCE TO FIRE</span>
                  <span className="text-white font-bold text-sm tabular-nums">
                    {telemetry.distanceToTargetNm} NM
                  </span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-slate-800/80 text-center">
                  <span className="text-slate-500 text-[10px] block">ETA TO DROP RUN</span>
                  <span className="text-amber-400 font-bold text-sm tabular-nums">
                    {telemetry.etaToTargetMin} Min
                  </span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-slate-800/80 text-center">
                  <span className="text-slate-500 text-[10px] block">BEARING TO FIRE</span>
                  <span className="text-cyan-400 font-bold text-sm tabular-nums">
                    {telemetry.bearingToTargetDeg}° MAG
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                <span>
                  COORDINATES: {telemetry.coordinates.lat.toFixed(4)}°N, {Math.abs(telemetry.coordinates.lng).toFixed(4)}°W
                </span>
                <span className="text-slate-500">WGS-84 / FAA ADS-B DERIVED</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: FLIGHT HOURS & CYCLES ================= */}
        {activeTab === 'flight_hours' && (
          <div className="space-y-4">
            {/* Airframe & Seasonal Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">AIRFRAME TOTAL TIME (TTSN)</span>
                <div className="text-xl font-bold text-white mt-1 tabular-nums">
                  {flightHours.airframeTTSN.toLocaleString()} <span className="text-xs text-slate-400">hrs</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {flightHours.totalCycles.toLocaleString()} Total Flight Cycles
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">2026 TACTICAL FIRE HOURS</span>
                <div className="text-xl font-bold text-cyan-400 mt-1 tabular-nums">
                  {flightHours.seasonFlightHours2026} <span className="text-xs text-slate-400">/ {flightHours.seasonQuotaMaxHours}h</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{
                      width: `${(flightHours.seasonFlightHours2026 / flightHours.seasonQuotaMaxHours) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">HOURS SINCE PHASE CHECK</span>
                <div className="text-xl font-bold text-amber-400 mt-1 tabular-nums">
                  {flightHours.hoursSincePhaseCheck} <span className="text-xs text-slate-400">/ {flightHours.phaseCheckLimitHours}h Limit</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {flightHours.phaseCheckLimitHours - flightHours.hoursSincePhaseCheck}h remaining until inspection
                </span>
              </div>
            </div>

            {/* Tactical Mission Sortie Breakdown */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase">
                  2026 FIRE SEASON SORTIES & DROP CYCLES ({flightHours.dropCyclesLogged} Drops Logged)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2.5 rounded bg-black/40 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">INITIAL ATTACK</span>
                  <span className="text-white font-bold text-sm tabular-nums">
                    {flightHours.missionSorties2026.initialAttack} Sorties
                  </span>
                </div>

                <div className="p-2.5 rounded bg-black/40 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">RETARDANT REINFORCE</span>
                  <span className="text-orange-400 font-bold text-sm tabular-nums">
                    {flightHours.missionSorties2026.retardantReinforce} Sorties
                  </span>
                </div>

                <div className="p-2.5 rounded bg-black/40 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">RECONNAISSANCE</span>
                  <span className="text-cyan-400 font-bold text-sm tabular-nums">
                    {flightHours.missionSorties2026.reconnaissance} Sorties
                  </span>
                </div>

                <div className="p-2.5 rounded bg-black/40 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">TRANSIT / FERRY</span>
                  <span className="text-slate-300 font-bold text-sm tabular-nums">
                    {flightHours.missionSorties2026.transitFerry} Sorties
                  </span>
                </div>
              </div>
            </div>

            {/* Engine Overhaul & Hot Section Inspection (TSOH) */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase">
                  POWERPLANT TIME SINCE OVERHAUL (TSOH) & HSI STATUS
                </span>
              </div>

              <div className="space-y-2">
                {flightHours.enginesTSOH.map((eng) => (
                  <div
                    key={eng.engineIndex}
                    className="p-3 rounded-lg bg-black/40 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">ENGINE #{eng.engineIndex}:</span>
                        <span className="text-slate-300">{eng.model}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {eng.cycles.toLocaleString()} operating cycles logged
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">TSOH</span>
                        <span className="font-bold text-white tabular-nums">{eng.tsohHours.toLocaleString()}h</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">HSI DUE IN</span>
                        <span className="font-bold text-emerald-400 tabular-nums">+{eng.hsiDueHours}h</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Crew Flight Hours on Type */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white uppercase block">
                CREW TYPE-RATING QUALIFICATIONS & LOGGED HOURS
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2.5 rounded bg-black/40 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">PILOT-IN-COMMAND (PIC)</span>
                  <span className="text-white font-bold tabular-nums">
                    {flightHours.crewHoursOnType.picHours.toLocaleString()} hrs on type
                  </span>
                </div>
                <div className="p-2.5 rounded bg-black/40 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">CO-PILOT (SIC)</span>
                  <span className="text-white font-bold tabular-nums">
                    {flightHours.crewHoursOnType.sicHours.toLocaleString()} hrs on type
                  </span>
                </div>
                {flightHours.crewHoursOnType.flightEngineerHours && (
                  <div className="p-2.5 rounded bg-black/40 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">FLIGHT ENGINEER</span>
                    <span className="text-white font-bold tabular-nums">
                      {flightHours.crewHoursOnType.flightEngineerHours.toLocaleString()} hrs on type
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: MAINTENANCE HISTORY ================= */}
        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            {/* Airworthiness Header Status */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  AIRWORTHINESS RELEASE STATUS
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  FAA Form 337 / Cal Fire Maintenance Authorization
                </h4>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Last Annual Inspection: {maintenanceHistory.lastAnnualInspectionDate} · Next Phase: {maintenanceHistory.nextPhaseDueInHours}h
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-bold text-xs shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>FLIGHT RELEASE ACTIVE</span>
              </div>
            </div>

            {/* Work Order Records Log */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white uppercase block">
                RECENT LOGBOOK ENTRIES & WORK ORDERS
              </span>

              {maintenanceHistory.records.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{rec.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                        {rec.workOrder}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">{rec.date}</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">{rec.description}</p>

                  {rec.partReplaced && (
                    <div className="p-2 rounded bg-black/40 border border-slate-800/80 text-[10px] text-slate-400">
                      <span className="text-slate-500 font-bold uppercase block">REPLACED PART:</span>
                      <span className="text-white font-mono">{rec.partReplaced}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                    <span>
                      TECH: <strong className="text-slate-400">{rec.technician}</strong> ({rec.inspectorCert})
                    </span>
                    <span className="text-emerald-400 font-bold uppercase">{rec.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Life Limited Parts (LLP) Tracker */}
            {maintenanceHistory.lifeLimitedParts.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white uppercase block">
                  LIFE-LIMITED PARTS (LLP) & COMPONENT FATIGUE TRACKER
                </span>

                <div className="space-y-2.5">
                  {maintenanceHistory.lifeLimitedParts.map((llp, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <div>
                          <span className="text-white font-bold">{llp.partName}</span>
                          <span className="text-slate-500 ml-1 text-[10px]">({llp.partNumber})</span>
                        </div>
                        <span className="text-cyan-400 font-bold tabular-nums">
                          {llp.percentRemaining}% Life Remaining
                        </span>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            llp.percentRemaining < 20
                              ? 'bg-red-400'
                              : llp.percentRemaining < 30
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{ width: `${llp.percentRemaining}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>ACCUMULATED: {llp.currentAccumulated} / {llp.lifeLimitHoursOrCycles}</span>
                        <span className="text-slate-400">{llp.replacementDue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Airworthiness Directives (AD) Compliance */}
            {maintenanceHistory.airworthinessDirectives.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white uppercase block">
                  FAA / CAL FIRE AIRWORTHINESS DIRECTIVES (AD) COMPLIANCE
                </span>

                <div className="space-y-1.5">
                  {maintenanceHistory.airworthinessDirectives.map((ad, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded bg-black/40 border border-slate-800 text-[11px] flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-cyan-400" />
                          <strong className="text-white">{ad.adNumber}</strong>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{ad.subject}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase block">
                          {ad.status}
                        </span>
                        <span className="text-[9px] text-slate-500">Next: {ad.nextDue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: AVIONICS & LINK ================= */}
        {activeTab === 'avionics' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase">
                  MODE-S ADS-B OUT & TACNET SQUAWK
                </span>
                <button
                  onClick={handleCopyHex}
                  className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-white cursor-pointer transition-colors"
                >
                  {copiedHex ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedHex ? 'COPIED' : 'COPY HEX'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded bg-black/40 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">TRANSPONDER HEX</span>
                  <span className="text-white font-bold text-sm tracking-widest">{transponder.hex}</span>
                </div>

                <div className="p-2.5 rounded bg-black/40 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">TACTICAL SQUAWK</span>
                  <span className="text-cyan-400 font-bold text-sm tracking-widest">{transponder.squawk} (FIRE)</span>
                </div>

                <div className="p-2.5 rounded bg-black/40 border border-slate-800 col-span-2">
                  <span className="text-slate-500 text-[10px] block">TRANSMISSION PROTOCOL</span>
                  <span className="text-slate-300 font-medium">{transponder.mode}</span>
                </div>

                <div className="p-2.5 rounded bg-black/40 border border-slate-800 col-span-2">
                  <span className="text-slate-500 text-[10px] block">ICAO AIRFRAME REGISTRATION</span>
                  <span className="text-slate-300 font-medium">{transponder.icao}</span>
                </div>
              </div>
            </div>

            {/* Tactical Radio Frequencies */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white uppercase block">
                COMMUNICATIONS FREQUENCIES IN USE
              </span>
              <div className="space-y-1.5 text-[11px]">
                <div className="p-2 rounded bg-black/40 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">CAL FIRE AIR TACTICS PRIMARY:</span>
                  <span className="text-cyan-300 font-bold tabular-nums">126.025 MHz</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">AIR-TO-GROUND (AG TACTICAL 1):</span>
                  <span className="text-white font-bold tabular-nums">151.280 MHz (FM)</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">FLIGHT FOLLOWING / STATE DISPATCH:</span>
                  <span className="text-white font-bold tabular-nums">168.650 MHz</span>
                </div>
                <div className="p-2 rounded bg-black/40 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">CAL FIRE STATE AIR GUARD EMERGENCY:</span>
                  <span className="text-red-400 font-bold tabular-nums">168.625 MHz (PL 110.9)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Panel Status Bar */}
      <div className="p-3 border-t border-slate-900 bg-slate-950 flex items-center justify-between text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>REAL-TIME TELEMETRIC LINK: 24ms LATENCY</span>
        </div>
        <button
          onClick={() => {
            onClose();
            onPlayBeep?.(500, 'sine', 0.04);
          }}
          className="px-2 py-0.5 rounded border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
        >
          CLOSE [ESC]
        </button>
      </div>
    </div>
  );
};
