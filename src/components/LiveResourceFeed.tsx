import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Radio, 
  Flame, 
  Plane, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Compass, 
  Filter,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export interface DispatchItem {
  id: string;
  timestamp: string;
  timeAgoSec: number;
  priority: 'FLASH' | 'PRIORITY' | 'DROP ACTIVE' | 'SURGE RELOAD' | 'ROUTINE';
  callsign: string;
  assetName: string;
  category: 'air_tanker' | 'helicopter' | 'wildfire' | 'recon_lead' | 'air_base';
  incidentName: string;
  incidentId: string;
  actionText: string;
  telemetrySnippet?: {
    altitude?: string;
    speed?: string;
    heading?: string;
    payload?: string;
    frequency?: string;
  };
}

interface LiveResourceFeedProps {
  onSelectResource?: (callsignOrId: string) => void;
  soundEnabled?: boolean;
}

const INITIAL_DISPATCHES: DispatchItem[] = [
  {
    id: 'disp-101',
    timestamp: '09:24:12',
    timeAgoSec: 2,
    priority: 'DROP ACTIVE',
    callsign: 'TANKER-910',
    assetName: 'DC-10 VLAT #1',
    category: 'air_tanker',
    incidentName: 'Angeles Crest Complex',
    incidentId: 'INC-#241',
    actionText: 'Discharging 9,400 gal Phos-Chek CL-8 retardant line along ridge perimeter',
    telemetrySnippet: {
      altitude: '4,600\' MSL',
      speed: '142 kts',
      heading: '118°',
      payload: '9,400 gal',
      frequency: '124.625 MHz',
    },
  },
  {
    id: 'disp-102',
    timestamp: '09:23:55',
    timeAgoSec: 18,
    priority: 'FLASH',
    callsign: 'TANKER-80',
    assetName: 'S-2T Turbo Tracker',
    category: 'air_tanker',
    incidentName: 'Shasta Complex',
    incidentId: 'INC-#102',
    actionText: 'Scrambled for immediate initial attack drops to defend evacuation corridor',
    telemetrySnippet: {
      altitude: '3,900\' MSL',
      speed: '215 kts',
      heading: '310°',
      payload: '1,200 gal',
      frequency: '124.050 MHz',
    },
  },
  {
    id: 'disp-103',
    timestamp: '09:23:40',
    timeAgoSec: 34,
    priority: 'PRIORITY',
    callsign: 'COPTER-106',
    assetName: 'S-70i Firehawk',
    category: 'helicopter',
    incidentName: 'Lake Berryessa Surge',
    incidentId: 'INC-#115',
    actionText: 'Completed 1,000 gal snorkel hover dip; turnaround cycle 7.2 min',
    telemetrySnippet: {
      altitude: '2,200\' MSL',
      speed: '130 kts',
      heading: '075°',
      payload: '1,000 gal',
      frequency: '123.025 MHz',
    },
  },
  {
    id: 'disp-104',
    timestamp: '09:23:15',
    timeAgoSec: 58,
    priority: 'ROUTINE',
    callsign: 'TANKER-118',
    assetName: 'C-130H MAFFS II',
    category: 'air_tanker',
    incidentName: 'Dixie Ridge Secondary',
    incidentId: 'INC-#089',
    actionText: 'Airborne McClellan (MCC) holding flight vector 038° toward Feather River',
    telemetrySnippet: {
      altitude: '6,200\' MSL',
      speed: '245 kts',
      heading: '038°',
      payload: '4,000 gal',
      frequency: '122.925 MHz',
    },
  },
  {
    id: 'disp-105',
    timestamp: '09:22:50',
    timeAgoSec: 84,
    priority: 'SURGE RELOAD',
    callsign: 'TANKER-96',
    assetName: 'S-2T Turbo Tracker',
    category: 'air_tanker',
    incidentName: 'Big Sur Wilderness',
    incidentId: 'INC-#044',
    actionText: 'Pit 2 fast-fill completed at Paso Robles (PRB) in 11.8 min; taxiing to runway 19',
    telemetrySnippet: {
      altitude: '840\' MSL',
      speed: '18 kts',
      heading: '190°',
      payload: '1,200 gal',
      frequency: '123.825 MHz',
    },
  },
  {
    id: 'disp-106',
    timestamp: '09:22:20',
    timeAgoSec: 114,
    priority: 'PRIORITY',
    callsign: 'LEAD-41',
    assetName: 'King Air 200 Lead Plane',
    category: 'recon_lead',
    incidentName: 'Dixie Ridge Secondary',
    incidentId: 'INC-#089',
    actionText: 'Air Tactical Group Supervisor (ATGS) guiding Tanker 102 for flank line tie-in',
    telemetrySnippet: {
      altitude: '4,800\' MSL',
      speed: '195 kts',
      heading: '220°',
      frequency: '123.975 MHz',
    },
  },
  {
    id: 'disp-107',
    timestamp: '09:21:45',
    timeAgoSec: 148,
    priority: 'FLASH',
    callsign: 'COPTER-501',
    assetName: 'CH-47D Chinook',
    category: 'helicopter',
    incidentName: 'Sequoia Lightning Complex',
    incidentId: 'INC-#314',
    actionText: 'Executing precision heavy drop (2,600 gal) on Division Charlie ancient grove flume',
    telemetrySnippet: {
      altitude: '3,100\' MSL',
      speed: '140 kts',
      heading: '110°',
      payload: '2,600 gal',
      frequency: '124.150 MHz',
    },
  },
  {
    id: 'disp-108',
    timestamp: '09:21:10',
    timeAgoSec: 184,
    priority: 'ROUTINE',
    callsign: 'TANKER-160',
    assetName: 'RJ85 LAT',
    category: 'air_tanker',
    incidentName: 'Cleveland National Forest',
    incidentId: 'INC-#177',
    actionText: 'Drop cycle completed; RTB Ramona Air Attack Base (RNM) for fuel & slurry top-off',
    telemetrySnippet: {
      altitude: '5,400\' MSL',
      speed: '255 kts',
      heading: '290°',
      frequency: '122.975 MHz',
    },
  },
];

// Mock stream templates that trigger periodically
const STREAM_TEMPLATES = [
  {
    callsign: 'TANKER-80',
    assetName: 'S-2T Turbo Tracker',
    category: 'air_tanker' as const,
    incidentName: 'Shasta Complex',
    incidentId: 'INC-#102',
    priority: 'DROP ACTIVE' as const,
    actionText: 'Commenced retardant drop pass over Highway 5 corridor ridge buffer',
    telemetrySnippet: { altitude: '3,600\' MSL', speed: '125 kts', heading: '315°', payload: '1,200 gal', frequency: '124.050 MHz' },
  },
  {
    callsign: 'COPTER-106',
    assetName: 'S-70i Firehawk',
    category: 'helicopter' as const,
    incidentName: 'Lake Berryessa Surge',
    incidentId: 'INC-#115',
    priority: 'FLASH' as const,
    actionText: 'Spot fire breakout detected across ridge; executing direct snorkel dump on canyon drainage',
    telemetrySnippet: { altitude: '1,950\' MSL', speed: '110 kts', heading: '082°', payload: '1,000 gal', frequency: '123.025 MHz' },
  },
  {
    callsign: 'TANKER-912',
    assetName: 'DC-10 VLAT #2',
    category: 'air_tanker' as const,
    incidentName: 'Dixie Ridge Secondary',
    incidentId: 'INC-#089',
    priority: 'PRIORITY' as const,
    actionText: 'Castle Airport (MER) dispatch confirmed; VLAT #2 inbound flight level 075',
    telemetrySnippet: { altitude: '7,200\' MSL', speed: '280 kts', heading: '325°', payload: '9,400 gal', frequency: '124.625 MHz' },
  },
  {
    callsign: 'AIR-ATTACK-140',
    assetName: 'OV-10A Bronco',
    category: 'recon_lead' as const,
    incidentName: 'Shasta Complex',
    incidentId: 'INC-#102',
    priority: 'ROUTINE' as const,
    actionText: 'Establishing orbital 360° overhead orbit; clearance given for lead plane pass',
    telemetrySnippet: { altitude: '5,500\' MSL', speed: '160 kts', heading: '040°', frequency: '124.050 MHz' },
  },
  {
    callsign: 'MCCLELLAN-AIR-BASE',
    assetName: 'McClellan Logistics Hub',
    category: 'air_base' as const,
    incidentName: 'Statewide Readiness',
    incidentId: 'BASE-MCC',
    priority: 'SURGE RELOAD' as const,
    actionText: 'Slurry batching system mixed 45,000 gal Phos-Chek; 6 loading pits active',
    telemetrySnippet: { frequency: '121.700 MHz', payload: '150,000 gal cap' },
  },
];

export const LiveResourceFeed: React.FC<LiveResourceFeedProps> = ({
  onSelectResource,
  soundEnabled = false,
}) => {
  const [dispatches, setDispatches] = useState<DispatchItem[]>(INITIAL_DISPATCHES);
  const [filter, setFilter] = useState<'all' | 'air_tanker' | 'helicopter' | 'recon_lead' | 'air_base'>('all');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [audioBeep, setAudioBeep] = useState<boolean>(soundEnabled);
  const [streamCount, setStreamCount] = useState<number>(INITIAL_DISPATCHES.length);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Audio chirp feedback for new dispatches
  const playDispatchChirp = () => {
    if (!audioBeep) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Audio restricted or unsupported
    }
  };

  // Mock stream generator interval: pushes a new dispatch event every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const template = STREAM_TEMPLATES[Math.floor(Math.random() * STREAM_TEMPLATES.length)];

      const newDispatch: DispatchItem = {
        id: `stream-${Date.now()}`,
        timestamp: timeStr,
        timeAgoSec: 0,
        ...template,
      };

      setDispatches((prev) => [newDispatch, ...prev.slice(0, 35)]);
      setStreamCount((prev) => prev + 1);
      playDispatchChirp();
    }, 4500);

    return () => clearInterval(timer);
  }, [audioBeep]);

  // Filtered dispatches
  const filteredDispatches = useMemo(() => {
    if (filter === 'all') return dispatches;
    return dispatches.filter((d) => d.category === filter);
  }, [dispatches, filter]);

  // Priority color styling
  const getPriorityStyle = (p: DispatchItem['priority']) => {
    switch (p) {
      case 'FLASH':
        return 'bg-red-950/80 text-red-300 border-red-500 animate-pulse';
      case 'DROP ACTIVE':
        return 'bg-pink-950/80 text-pink-300 border-pink-500 animate-pulse';
      case 'PRIORITY':
        return 'bg-amber-950/80 text-amber-300 border-amber-500';
      case 'SURGE RELOAD':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500';
      case 'ROUTINE':
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-cyan-900/60 bg-slate-950 shadow-2xl overflow-hidden font-mono text-xs mb-5 transition-all">
      {/* 1. TACTICAL FEED HEADER & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-950/95 border-b border-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="absolute w-2 h-2 rounded-full bg-red-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wider text-xs flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-red-400" />
              <span>LIVE RESOURCE FEED · CAL FIRE STATEWIDE DISPATCH NET</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-red-950 border border-red-500/70 text-[9px] font-bold text-red-300">
              DISPATCH STREAM ACTIVE
            </span>
          </div>
        </div>

        {/* Action Buttons & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter Pills */}
          <div className="flex items-center rounded border border-slate-800 bg-black/60 p-0.5 text-[10px]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              ALL ({dispatches.length})
            </button>
            <button
              onClick={() => setFilter('air_tanker')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                filter === 'air_tanker' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              TANKERS
            </button>
            <button
              onClick={() => setFilter('helicopter')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                filter === 'helicopter' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              HELITACK
            </button>
            <button
              onClick={() => setFilter('recon_lead')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                filter === 'recon_lead' ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              LEAD/RECON
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setAudioBeep(!audioBeep)}
            className={`px-2 py-1 rounded border text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
              audioBeep ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Toggle Live Audio Dispatch Chirp"
          >
            {audioBeep ? <Volume2 className="w-3 h-3 text-cyan-400" /> : <VolumeX className="w-3 h-3" />}
            <span>{audioBeep ? 'CHIRP ON' : 'MUTED'}</span>
          </button>

          {/* Expand / Minimize Console Drawer */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] transition-colors cursor-pointer"
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            <span>{isExpanded ? 'TICKER ONLY' : 'EXPAND CONSOLE'}</span>
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME SCROLLING TICKER MARQUEE */}
      <div 
        className="relative bg-slate-950/90 py-2 px-3 overflow-hidden border-b border-slate-900"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="flex items-center gap-2 text-[11px] overflow-hidden">
          <span className="shrink-0 text-[10px] font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded flex items-center gap-1">
            <Activity className="w-3 h-3 animate-spin" />
            <span>TAC-STREAM</span>
          </span>

          {/* Marquee Content */}
          <div 
            className={`flex items-center gap-6 overflow-x-auto no-scrollbar whitespace-nowrap ${
              isPaused ? '' : 'animate-marquee'
            }`}
            style={{ animationDuration: '38s' }}
          >
            {filteredDispatches.slice(0, 12).map((disp) => (
              <div
                key={disp.id}
                onClick={() => onSelectResource?.(disp.callsign)}
                className="inline-flex items-center gap-2 group cursor-pointer hover:bg-slate-900/80 px-2 py-0.5 rounded transition-colors"
              >
                <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${getPriorityStyle(disp.priority)}`}>
                  {disp.priority}
                </span>

                <span className="text-cyan-300 font-bold group-hover:underline">
                  {disp.callsign}
                </span>

                <span className="text-slate-400">
                  [{disp.incidentName}]:
                </span>

                <span className="text-slate-200">
                  {disp.actionText}
                </span>

                {disp.telemetrySnippet?.payload && (
                  <span className="text-[10px] text-pink-400 font-bold bg-pink-950/40 px-1 rounded border border-pink-900">
                    💧 {disp.telemetrySnippet.payload}
                  </span>
                )}

                <span className="text-[10px] text-slate-500 font-mono">
                  ({disp.timestamp} UTC)
                </span>

                <span className="text-slate-700">·</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hover Pause Notification Overlay */}
        {isPaused && (
          <div className="absolute right-3 top-2 text-[9px] text-cyan-400/80 bg-slate-950/90 px-2 py-0.5 rounded border border-cyan-800">
            [SCROLL PAUSED · CLICK DISPATCH TO ACQUIRE ASSET]
          </div>
        )}
      </div>

      {/* 3. EXPANDABLE WAR-ROOM DISPATCH TERMINAL CONSOLE */}
      {isExpanded && (
        <div className="p-4 bg-slate-950 border-t border-slate-900 max-h-72 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500 pb-2 border-b border-slate-900">
            <span>SHOWING {filteredDispatches.length} DISPATCH COMMUNICATIONS · LIVE AIR ATTACK NET</span>
            <span>TOTAL SIGNALS LOGGED: {streamCount}</span>
          </div>

          <div className="divide-y divide-slate-900/60">
            {filteredDispatches.map((disp) => (
              <div
                key={disp.id}
                onClick={() => onSelectResource?.(disp.callsign)}
                className="py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-900/40 px-2 rounded-lg transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-slate-500 text-[10px] shrink-0 font-mono mt-0.5">
                    {disp.timestamp}
                  </span>

                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold shrink-0 ${getPriorityStyle(disp.priority)}`}>
                    {disp.priority}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {disp.callsign}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        ({disp.assetName})
                      </span>
                      <span className="text-slate-600">→</span>
                      <span className="text-red-400 font-bold text-[11px]">
                        {disp.incidentName} ({disp.incidentId})
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs mt-0.5">
                      {disp.actionText}
                    </p>
                  </div>
                </div>

                {/* Telemetry Chips */}
                {disp.telemetrySnippet && (
                  <div className="flex items-center gap-2 text-[10px] shrink-0 font-mono bg-black/50 p-1.5 rounded border border-slate-900">
                    {disp.telemetrySnippet.altitude && (
                      <span className="text-slate-300">ALT: <strong className="text-cyan-400">{disp.telemetrySnippet.altitude}</strong></span>
                    )}
                    {disp.telemetrySnippet.speed && (
                      <span className="text-slate-300">SPD: <strong className="text-cyan-400">{disp.telemetrySnippet.speed}</strong></span>
                    )}
                    {disp.telemetrySnippet.frequency && (
                      <span className="text-slate-400 hidden sm:inline">{disp.telemetrySnippet.frequency}</span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
