import React, { useState, useMemo } from 'react';
import {
  AirbaseResource,
  CALFIRE_AND_MILITARY_BASES,
} from '../../data/calfireAirbases';
import {
  Database,
  Plane,
  Video,
  Wind,
  Shield,
  Flame,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Gauge,
  Sliders,
  Send
} from 'lucide-react';

interface ResourceAllocationTableProps {
  onOpenLiveCam: (base: AirbaseResource) => void;
  onPlayBeep?: (freq?: number, type?: OscillatorType, duration?: number) => void;
}

export const ResourceAllocationTable: React.FC<ResourceAllocationTableProps> = ({
  onOpenLiveCam,
  onPlayBeep,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<'All' | 'North Ops' | 'South Ops' | 'Joint Defense'>('All');
  const [agencyFilter, setAgencyFilter] = useState<string>('All');
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  // Filtered dataset
  const filteredBases = useMemo(() => {
    return CALFIRE_AND_MILITARY_BASES.filter((b) => {
      if (regionFilter !== 'All' && b.region !== regionFilter) return false;
      if (agencyFilter !== 'All' && b.agency !== agencyFilter) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return (
          b.name.toLowerCase().includes(query) ||
          b.code.toLowerCase().includes(query) ||
          b.assignedAircraft.some((a) => a.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [searchTerm, regionFilter, agencyFilter]);

  // Aggregated Statewide Totals
  const totals = useMemo(() => {
    const totalStorage = CALFIRE_AND_MILITARY_BASES.reduce((s, b) => s + b.retardantStorageGal, 0);
    const totalCurrentMix = CALFIRE_AND_MILITARY_BASES.reduce((s, b) => s + b.currentMixGal, 0);
    const totalPits = CALFIRE_AND_MILITARY_BASES.reduce((s, b) => s + b.loadingPits, 0);
    const occupiedPits = CALFIRE_AND_MILITARY_BASES.reduce((s, b) => s + b.activePitsOccupied, 0);
    const totalSorties = CALFIRE_AND_MILITARY_BASES.reduce((s, b) => s + b.activeSortiesToday, 0);
    const activeReloadCount = CALFIRE_AND_MILITARY_BASES.filter((b) => b.status === 'Active Reload').length;

    return { totalStorage, totalCurrentMix, totalPits, occupiedPits, totalSorties, activeReloadCount };
  }, []);

  const handleSimulateDispatch = (base: AirbaseResource) => {
    onPlayBeep?.(1200, 'sawtooth', 0.08);
    setDispatchSuccessMsg(`Sortie scramble dispatched from ${base.name} (${base.code}). Assigned payload: ${(base.currentMixGal > 4000 ? 4000 : base.currentMixGal).toLocaleString()} gal Phos-Chek.`);
    setTimeout(() => {
      setDispatchSuccessMsg(null);
    }, 4500);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 font-mono text-xs">
      {/* Top Resource Allocation Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
              STATEWIDE CAL FIRE & MILITARY AIRBASE RESOURCE ALLOCATION MATRIX
            </h3>
          </div>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-3xl">
            Live telemetry monitoring Phos-Chek MVP-Fx mixed retardant capacity, high-flow pumping rates, loading pit occupancy, and SLA turnaround compliance across 30 California defense airfields and tanker bases.
          </p>
        </div>

        {/* Global Key Metrics Badges */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 text-[11px]">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase">RETARDANT STOCK</span>
            <span className="text-white font-bold tabular-nums">
              {(totals.totalCurrentMix / 1000).toFixed(0)}k / {(totals.totalStorage / 1000).toFixed(0)}k Gal
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase">PITS OCCUPIED</span>
            <span className="text-cyan-400 font-bold tabular-nums">
              {totals.occupiedPits} / {totals.totalPits} ({totals.activeReloadCount} Reloading)
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase">SORTIES TODAY</span>
            <span className="text-emerald-400 font-bold tabular-nums">
              {totals.totalSorties} Dispatched
            </span>
          </div>
        </div>
      </div>

      {/* Dispatch Success Alert Banner */}
      {dispatchSuccessMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{dispatchSuccessMsg}</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold uppercase">TAC-NET ACKNOWLEDGED</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search airbase, code, aircraft..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-56"
            />
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1">
            {(['All', 'North Ops', 'South Ops', 'Joint Defense'] as const).map((reg) => (
              <button
                key={reg}
                onClick={() => {
                  setRegionFilter(reg);
                  onPlayBeep?.(800, 'sine', 0.02);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer border ${
                  regionFilter === reg
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>
        </div>

        {/* Agency Filter */}
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-slate-500">AGENCY:</span>
          {['All', 'CAL FIRE', 'USFS', 'USAF', 'USMC', 'ANG', 'NAVY'].map((ag) => (
            <button
              key={ag}
              onClick={() => {
                setAgencyFilter(ag);
                onPlayBeep?.(750, 'sine', 0.02);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer border ${
                agencyFilter === ag
                  ? 'bg-slate-800 border-slate-600 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {ag}
            </button>
          ))}
        </div>
      </div>

      {/* Main Airbase Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase bg-slate-900/60">
              <th className="py-3 px-3.5">Airbase & Runway</th>
              <th className="py-3 px-3">Agency / Sector</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Retardant Capacity</th>
              <th className="py-3 px-3">Loading Pits</th>
              <th className="py-3 px-3">Turnaround / SLA</th>
              <th className="py-3 px-3">Weather Station</th>
              <th className="py-3 px-3">Assigned Fleet</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {filteredBases.map((base) => {
              const mixPercent = Math.round((base.currentMixGal / base.retardantStorageGal) * 100);
              const isSlaBreached = base.turnaroundAvgMin > base.slaTargetMin;

              return (
                <tr key={base.id} className="hover:bg-slate-900/40 transition-colors">
                  {/* Airbase Name & Runway */}
                  <td className="py-3 px-3.5">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{base.name}</span>
                      <span className="text-[10px] text-cyan-400 px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-800">
                        {base.code}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {base.runwayFt > 0 ? `RWY ${base.runwayFt.toLocaleString()}' (Heading ${base.runwayHeadingDeg || '000'}°)` : 'Helitack Pad Facility'} · {base.elevationFt}' MSL
                    </div>
                  </td>

                  {/* Agency / Sector */}
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      base.type === 'military_base'
                        ? 'bg-sky-950/80 border-sky-600 text-sky-300'
                        : 'bg-orange-950/80 border-orange-600 text-orange-300'
                    }`}>
                      {base.agency}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">{base.region}</div>
                  </td>

                  {/* Operational Status */}
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      base.status === 'Active Reload'
                        ? 'bg-amber-950/80 border-amber-500 text-amber-300 animate-pulse'
                        : base.status === 'Surge Alert'
                        ? 'bg-red-950/80 border-red-500 text-red-300'
                        : 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                    }`}>
                      {base.status}
                    </span>
                    <div className="text-[9px] text-slate-500 mt-0.5">{base.preparednessLevel}</div>
                  </td>

                  {/* Retardant Storage Bar */}
                  <td className="py-3 px-3 min-w-[150px]">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-white font-bold tabular-nums">
                        {(base.currentMixGal / 1000).toFixed(0)}k / {(base.retardantStorageGal / 1000).toFixed(0)}k gal
                      </span>
                      <span className="text-slate-400 text-[10px]">{mixPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${mixPercent < 40 ? 'bg-red-500' : mixPercent < 70 ? 'bg-amber-500' : 'bg-cyan-400'}`}
                        style={{ width: `${mixPercent}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">{base.pumpingRateGpm} GPM pump rate</div>
                  </td>

                  {/* Loading Pits */}
                  <td className="py-3 px-3">
                    <div className="text-white font-bold tabular-nums">
                      {base.activePitsOccupied} / {base.loadingPits} Pits
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {base.activeSortiesToday} Sorties Logged
                    </div>
                  </td>

                  {/* Turnaround / SLA */}
                  <td className="py-3 px-3">
                    <div className={`font-bold tabular-nums ${isSlaBreached ? 'text-red-400' : 'text-emerald-400'}`}>
                      {base.turnaroundAvgMin} min
                    </div>
                    <div className="text-[10px] text-slate-500">SLA: {base.slaTargetMin} min</div>
                  </td>

                  {/* Weather Station */}
                  <td className="py-3 px-3 text-[10px]">
                    <div className="text-slate-300">
                      {base.weatherStation.windKts} kts {base.weatherStation.windDir}
                    </div>
                    <div className="text-slate-500">
                      {base.weatherStation.tempF}°F · RH {base.weatherStation.rhPct}%
                    </div>
                  </td>

                  {/* Assigned Aircraft */}
                  <td className="py-3 px-3 max-w-[200px]">
                    <div className="text-slate-300 text-[11px] truncate" title={base.assignedAircraft.join(', ')}>
                      {base.assignedAircraft.join(', ')}
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenLiveCam(base)}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:border-red-500 hover:text-red-300 text-slate-300 text-[10px] font-bold uppercase transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="View Live Optical Feed"
                      >
                        <Video className="w-3 h-3 text-red-400" />
                        <span>Live Cam</span>
                      </button>

                      <button
                        onClick={() => handleSimulateDispatch(base)}
                        className="px-2 py-1 rounded bg-cyan-950 border border-cyan-800 hover:border-cyan-400 hover:text-white text-cyan-300 text-[10px] font-bold uppercase transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Scramble Sortie from this airbase"
                      >
                        <Send className="w-3 h-3 text-cyan-400" />
                        <span>Dispatch</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
