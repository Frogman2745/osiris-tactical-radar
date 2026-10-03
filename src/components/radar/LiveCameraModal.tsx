import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Video,
  Wind,
  Shield,
  Eye,
  Camera,
  RefreshCw,
  Compass,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Download,
  Check,
  Sparkles,
  Zap,
  Radio,
  Volume2,
  VolumeX,
  Gauge,
  Thermometer,
  Activity,
  Layers as LayersIcon
} from 'lucide-react';
import { AirbaseResource, CALFIRE_AND_MILITARY_BASES } from '../../data/calfireAirbases';

export type ThermalMode = 'optical' | 'flir_white_hot' | 'flir_black_hot' | 'flir_rainbow' | 'nvg';
export type VideoQuality = '4K UHD' | '1080p' | 'RAW Stream';
export type PlaybackRate = 0.25 | 0.5 | 1.0 | 2.0;

interface LiveCameraModalProps {
  initialCamera: {
    title: string;
    sensor: string;
    desc: string;
    assetName: string;
    baseCode?: string;
    weather?: { tempF: number; windKts: number; windDir: string; rhPct: number };
    lat?: number;
    lng?: number;
  };
  onClose: () => void;
  onPlayBeep?: (freq?: number, type?: OscillatorType, duration?: number) => void;
}

export const LiveCameraModal: React.FC<LiveCameraModalProps> = ({
  initialCamera,
  onClose,
  onPlayBeep,
}) => {
  const [currentCamera, setCurrentCamera] = useState(initialCamera);
  const [thermalMode, setThermalMode] = useState<ThermalMode>('optical');
  const [pipThermalMode, setPipThermalMode] = useState<ThermalMode>('flir_rainbow');
  const [videoQuality, setVideoQuality] = useState<VideoQuality>('4K UHD');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [exposureGain, setExposureGain] = useState<number>(1.0);
  const [contrastLevel, setContrastLevel] = useState<number>(1.2);
  const [showHUDOverlay, setShowHUDOverlay] = useState<boolean>(true);
  const [showFlightLadder, setShowFlightLadder] = useState<boolean>(true);
  const [showDualSensorPiP, setShowDualSensorPiP] = useState<boolean>(true);
  const [isDeSmokeActive, setIsDeSmokeActive] = useState<boolean>(false);
  const [isGimbalLocked, setIsGimbalLocked] = useState<boolean>(true);
  const [isRadioAudioOn, setIsRadioAudioOn] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSnapshotting, setIsSnapshotting] = useState<boolean>(false);
  const [snapshotSuccess, setSnapshotSuccess] = useState<string | null>(null);
  const [liveTimestamp, setLiveTimestamp] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const audioContextRef = useRef<AudioContext | null>(null);

  // Real-time UTC millisecond timecode generator
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const iso = now.toISOString().replace('T', ' ').replace('Z', ' UTC');
      setLiveTimestamp(iso);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 50);
    return () => clearInterval(interval);
  }, []);

  // Web Audio Synthetic Tactical Radio Squelch & Transmission Chirps
  const playTacticalSquelch = useCallback(() => {
    if (!isRadioAudioOn) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      // Radio Squelch burst: filtered white noise + mic beep
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 3.0;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();

      // Pilot mic alert ping
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1020, ctx.currentTime);
      oscGain.gain.setValueAtTime(0.02, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio unsupported or restricted
    }
  }, [isRadioAudioOn]);

  // Periodic simulated radio chatter when audio is on
  useEffect(() => {
    if (!isRadioAudioOn) return;
    const interval = setInterval(() => {
      playTacticalSquelch();
    }, 8000);
    return () => clearInterval(interval);
  }, [isRadioAudioOn, playTacticalSquelch]);

  // Keyboard navigation & zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        onPlayBeep?.(500, 'sine', 0.04);
      } else if (e.key === '+' || e.key === '=') {
        handleZoom(0.5);
      } else if (e.key === '-' || e.key === '_') {
        handleZoom(-0.5);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPlayBeep]);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(1, Math.min(6, Math.round((prev + delta) * 10) / 10)));
    onPlayBeep?.(900, 'sine', 0.03);
  };

  const handlePan = (dx: number, dy: number) => {
    setPanOffset((prev) => ({
      x: Math.max(-140, Math.min(140, prev.x + dx)),
      y: Math.max(-100, Math.min(100, prev.y + dy)),
    }));
    onPlayBeep?.(750, 'sine', 0.02);
  };

  const resetPTZ = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setExposureGain(1.0);
    setContrastLevel(1.2);
    onPlayBeep?.(600, 'triangle', 0.04);
  };

  const captureSnapshot = () => {
    setIsSnapshotting(true);
    onPlayBeep?.(1400, 'square', 0.08);
    playTacticalSquelch();
    setTimeout(() => {
      setIsSnapshotting(false);
      const filename = `OPTICAL_${currentCamera.baseCode || 'TAC'}_${Date.now()}.png`;
      setSnapshotSuccess(`Ultra-HD frame captured & stored: ${filename}`);
      setTimeout(() => setSnapshotSuccess(null), 3500);
    }, 280);
  };

  // Swap primary and PiP sensors
  const swapSensors = () => {
    const temp = thermalMode;
    setThermalMode(pipThermalMode);
    setPipThermalMode(temp);
    onPlayBeep?.(1100, 'sine', 0.04);
  };

  // Compute CSS filter styling based on selected thermal palette and De-smoke DSP
  const getFilterStyle = (mode: ThermalMode) => {
    let gainStr = `brightness(${exposureGain * 100}%)`;
    let contStr = `contrast(${(contrastLevel * (isDeSmokeActive ? 1.4 : 1.0)) * 100}%)`;

    switch (mode) {
      case 'flir_white_hot':
        return `${gainStr} ${contStr} grayscale(100%) brightness(130%)`;
      case 'flir_black_hot':
        return `${gainStr} ${contStr} grayscale(100%) invert(100%) brightness(110%)`;
      case 'flir_rainbow':
        return `${gainStr} ${contStr} hue-rotate(245deg) saturate(260%) contrast(175%)`;
      case 'nvg':
        return `${gainStr} ${contStr} sepia(100%) hue-rotate(85deg) saturate(380%) contrast(140%)`;
      case 'optical':
      default:
        return `${gainStr} ${contStr} saturate(115%)`;
    }
  };

  const isAircraftNoseCam =
    currentCamera.title.includes('TANKER') ||
    currentCamera.title.includes('COPTER') ||
    currentCamera.title.includes('LEAD') ||
    currentCamera.title.includes('PILOT') ||
    currentCamera.title.includes('NOSE');

  const isOrbitalSatellite =
    currentCamera.title.includes('NASA') ||
    currentCamera.title.includes('SENTINEL') ||
    currentCamera.title.includes('ORBITAL');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl animate-fade-in font-mono select-none">
      <div
        className={`relative w-full ${
          isFullscreen ? 'max-w-none h-full' : 'max-w-6xl max-h-[96vh]'
        } rounded-2xl border border-cyan-500/60 bg-slate-950 p-4 sm:p-5 shadow-2xl flex flex-col space-y-4 overflow-y-auto transition-all`}
      >
        {/* Shutter Flash Animation Overlay */}
        {isSnapshotting && (
          <div className="absolute inset-0 z-50 bg-white/95 pointer-events-none transition-opacity duration-200" />
        )}

        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wider">
                  {currentCamera.title}
                </h3>
                {currentCamera.baseCode && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                    {currentCamera.baseCode}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-700 animate-pulse">
                  ● 4K ULTRA-HD 60 FPS
                </span>
                {isDeSmokeActive && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    DSP DE-SMOKE ACTIVE
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                <span>FACILITY: <strong className="text-white">{currentCamera.assetName}</strong></span>
                <span className="text-slate-600">|</span>
                <span>SENSOR: <strong className="text-cyan-400">{currentCamera.sensor}</strong></span>
                <span className="text-slate-600">|</span>
                <span>GIMBAL: <strong className="text-emerald-400 font-bold">{isGimbalLocked ? 'STABILIZED (0.02°)' : 'MANUAL'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Tactical Radio Squelch Sound Toggle */}
            <button
              onClick={() => {
                setIsRadioAudioOn(!isRadioAudioOn);
                if (!isRadioAudioOn) playTacticalSquelch();
              }}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                isRadioAudioOn
                  ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-900'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Tactical Radio Audio Squelch"
            >
              {isRadioAudioOn ? <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden md:inline">{isRadioAudioOn ? 'RADIO SQUELCH' : 'AUDIO MUTED'}</span>
            </button>

            {/* Snapshot Button */}
            <button
              onClick={captureSnapshot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-600 text-cyan-300 font-bold text-xs transition-colors cursor-pointer shadow-sm"
              title="Capture High-Res Sensor Frame"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SNAPSHOT</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                onClose();
                onPlayBeep?.(500, 'sine', 0.05);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
              title="Close Stream (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Snapshot Success Notification */}
        {snapshotSuccess && (
          <div className="p-2 px-3 rounded-lg bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{snapshotSuccess}</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">LOSSLESS RAW EXPORT</span>
          </div>
        )}

        {/* Primary Video Canvas & Optical Simulation */}
        <div
          className={`relative w-full ${
            isFullscreen ? 'h-[620px]' : 'h-[380px] sm:h-[480px] md:h-[540px]'
          } rounded-xl bg-black border border-cyan-500/50 overflow-hidden flex items-center justify-center shadow-2xl cursor-grab active:cursor-grabbing`}
          onMouseDown={(e) => {
            setIsDragging(true);
            dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
          }}
          onMouseMove={(e) => {
            if (!isDragging) return;
            setPanOffset({
              x: Math.max(-140, Math.min(140, e.clientX - dragStartRef.current.x)),
              y: Math.max(-100, Math.min(100, e.clientY - dragStartRef.current.y)),
            });
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          {/* CRT scanline effect */}
          <div className="absolute inset-0 radar-scanlines opacity-30 pointer-events-none z-20" />

          {/* Top Left Feed HUD */}
          {showHUDOverlay && (
            <div className="absolute top-3 left-4 z-30 text-[10px] text-emerald-400 leading-tight pointer-events-none bg-black/60 backdrop-blur-sm p-2 rounded border border-emerald-900/60">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold tracking-wider">DEFENSE TAC-NET OPTICAL STREAM</span>
              </div>
              <div className="text-slate-300 mt-1 font-mono">
                LAT {currentCamera.lat ? currentCamera.lat.toFixed(4) : '38.6672'}°N · LNG {currentCamera.lng ? Math.abs(currentCamera.lng).toFixed(4) : '121.4011'}°W
              </div>
              {currentCamera.weather && (
                <div className="text-cyan-300 mt-0.5">
                  WIND {currentCamera.weather.windKts} kts {currentCamera.weather.windDir} · {currentCamera.weather.tempF}°F · RH {currentCamera.weather.rhPct}%
                </div>
              )}
              <div className="text-slate-400 mt-0.5 text-[9px]">
                UTC: <span className="text-white font-bold tabular-nums">{liveTimestamp}</span>
              </div>
            </div>
          )}

          {/* Top Right Live Specs HUD */}
          {showHUDOverlay && (
            <div className="absolute top-3 right-4 z-30 text-[10px] text-right text-red-400 font-bold leading-tight pointer-events-none bg-black/60 backdrop-blur-sm p-2 rounded border border-red-900/60">
              <div className="flex items-center justify-end gap-1.5">
                <span>● 4K 60.0 FPS</span>
                <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 text-[9px]">
                  REC
                </span>
              </div>
              <div className="text-slate-300 mt-1 font-normal font-mono">
                BITRATE: <strong className="text-white">18.6 Mbps</strong> · LATENCY: <strong className="text-emerald-400">18ms</strong>
              </div>
              <div className="text-cyan-400 mt-0.5">
                MAGNIFICATION: <span className="text-white font-bold">{zoomLevel.toFixed(1)}X</span> · RATE: {playbackRate}X
              </div>
              <div className="text-slate-400 mt-0.5 text-[9px]">
                FOV: 46° HORIZ · APERTURE f/2.8 · STAR SAFIRE-380
              </div>
            </div>
          )}

          {/* Radiometric Temperature Probe Readout (Upper Middle HUD) */}
          {showHUDOverlay && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-black/75 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-orange-500/60 text-center font-mono text-[10px]">
              <div className="flex items-center justify-center gap-2 text-orange-400 font-bold">
                <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                <span>RADIOMETRIC PROBE: <strong className="text-white">1,480°F (804°C)</strong></span>
              </div>
              <div className="text-slate-400 text-[9px] mt-0.5">
                PEAK FLAME: 1,842°F · AMBIENT: 78°F · EMISSIVITY ε = 0.95
              </div>
            </div>
          )}

          {/* Main Camera View Canvas Layer */}
          <div
            className="w-full h-full relative transition-transform duration-100 ease-out"
            style={{
              filter: getFilterStyle(thermalMode),
              transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            }}
          >
            {/* AIRCRAFT NOSE COCKPIT VIEW */}
            {isAircraftNoseCam && (
              <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <linearGradient id="noseSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#081022" />
                    <stop offset="40%" stopColor="#1e3a5f" />
                    <stop offset="70%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#94a3b8" />
                  </linearGradient>
                  <linearGradient id="noseTerrainGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                  <linearGradient id="noseTerrainGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>
                  <radialGradient id="fireThermalCorona" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="25%" stopColor="#fef08a" stopOpacity="0.85" />
                    <stop offset="55%" stopColor="#f97316" stopOpacity="0.75" />
                    <stop offset="85%" stopColor="#ef4444" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect x="0" y="0" width="800" height="260" fill="url(#noseSkyGrad)" />
                <path
                  d="M 0 240 L 60 190 L 140 215 L 210 180 L 290 205 L 370 170 L 460 210 L 540 185 L 630 220 L 710 195 L 800 230 L 800 500 L 0 500 Z"
                  fill="url(#noseTerrainGrad1)"
                  opacity="0.85"
                />
                <path
                  d="M 0 290 L 90 250 L 180 275 L 280 235 L 380 265 L 480 225 L 590 270 L 690 240 L 800 280 L 800 500 L 0 500 Z"
                  fill="url(#noseTerrainGrad2)"
                />
                <g opacity="0.6">
                  {[20, 50, 80, 110, 150, 190, 240, 270, 310, 350, 420, 470, 520, 580, 640, 710, 760].map((x, i) => (
                    <polygon key={i} points={`${x},265 ${x - 5},278 ${x + 5},278`} fill="#020617" />
                  ))}
                </g>
                <g transform="translate(460, 220)">
                  <circle cx="0" cy="0" r="45" fill="url(#fireThermalCorona)" className="animate-pulse" />
                  <path
                    d="M -30 0 C -60 -50, -40 -120, -10 -170 C 20 -130, 40 -60, 20 0 Z"
                    fill="rgba(249, 115, 22, 0.45)"
                    filter="blur(4px)"
                  />
                  <path
                    d="M -15 0 C -40 -40, -20 -90, 0 -130 C 25 -90, 35 -40, 15 0 Z"
                    fill="rgba(254, 240, 138, 0.6)"
                    filter="blur(2px)"
                  />
                  <text x="50" y="-10" fill="#fef08a" fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
                    WILDFIRE HEAT RUN: 184 MW RADIANCE
                  </text>
                  <text x="50" y="6" fill="#fca5a5" fontSize="9" fontFamily="JetBrains Mono">
                    TARGET FLAME LENGTH: 18-24 FT
                  </text>
                </g>
                <path d="M 0 350 L 160 330 L 340 370 L 520 340 L 720 380 L 800 360 L 800 500 L 0 500 Z" fill="#090d16" />
                <path d="M 120 380 Q 280 340 450 360 T 680 345" fill="none" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
                <text x="210" y="340" fill="#f87171" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                  RETARDANT BARRIER // COVERAGE LEVEL 8 (PHOS-CHEK)
                </text>
              </svg>
            )}

            {/* AIRBASE TARMAC / LOADING PIT VIEW */}
            {!isAircraftNoseCam && !isOrbitalSatellite && (
              <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <linearGradient id="rampSky" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0c1729" />
                    <stop offset="50%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#334155" />
                  </linearGradient>
                  <linearGradient id="concreteTarmac" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="40%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#090d16" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="800" height="240" fill="url(#rampSky)" />
                <path d="M 0 210 L 80 180 L 190 200 L 290 170 L 410 195 L 530 165 L 640 190 L 730 175 L 800 210 L 800 240 L 0 240 Z" fill="#0f172a" />
                <rect x="60" y="180" width="140" height="60" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                <polygon points="60,180 130,160 200,180" fill="#334155" />
                <rect x="230" y="140" width="30" height="100" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <polygon points="225,140 245,120 265,140" fill="#0284c7" opacity="0.8" />
                <circle cx="245" cy="118" r="3.5" fill="#ef4444" className="animate-ping" />
                <rect x="0" y="240" width="800" height="260" fill="url(#concreteTarmac)" />
                <g stroke="#090d16" strokeWidth="1.2" opacity="0.8">
                  <line x1="0" y1="300" x2="800" y2="300" />
                  <line x1="0" y1="370" x2="800" y2="370" />
                  <line x1="0" y1="440" x2="800" y2="440" />
                  <line x1="160" y1="240" x2="80" y2="500" />
                  <line x1="360" y1="240" x2="300" y2="500" />
                  <line x1="560" y1="240" x2="520" y2="500" />
                  <line x1="720" y1="240" x2="700" y2="500" />
                </g>
                <line x1="0" y1="340" x2="800" y2="340" stroke="#eab308" strokeWidth="3" strokeDasharray="18 18" />
                <line x1="100" y1="410" x2="700" y2="410" stroke="#eab308" strokeWidth="2" />
                <g transform="translate(180, 210)">
                  <rect x="-8" y="0" width="16" height="140" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
                  <path d="M 0 30 L 150 50 L 180 140" fill="none" stroke="#ea580c" strokeWidth="6" strokeLinecap="round" />
                  <circle cx="180" cy="140" r="8" fill="#f97316" className="animate-pulse" />
                  <text x="15" y="25" fill="#f97316" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                    BOOM #1 · 1,800 GPM PHOS-CHEK INJECTION
                  </text>
                </g>
                <g transform="translate(490, 270)">
                  <ellipse cx="0" cy="0" rx="130" ry="24" fill="#0f172a" stroke="#0284c7" strokeWidth="2" />
                  <path d="M -30 -20 L -60 -100 L -15 -100 L 25 -20 Z" fill="#1e293b" stroke="#0284c7" strokeWidth="1.5" />
                  <path d="M -30 20 L -60 100 L -15 100 L 25 20 Z" fill="#1e293b" stroke="#0284c7" strokeWidth="1.5" />
                  <path d="M -110 -8 L -145 -48 L -130 -48 L -90 -8 Z" fill="#1e293b" stroke="#0284c7" strokeWidth="1.5" />
                  <ellipse cx="100" cy="-4" rx="16" ry="7" fill="#38bdf8" opacity="0.8" />
                  <rect x="-50" y="18" width="100" height="14" rx="4" fill="#ea580c" stroke="#f97316" strokeWidth="1.5" />
                  <text x="-40" y="46" fill="#fdba74" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                    CAL FIRE TANKER PIT STAGING
                  </text>
                </g>
              </svg>
            )}

            {/* ORBITAL MULTISPECTRAL IR SATELLITE */}
            {isOrbitalSatellite && (
              <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <linearGradient id="orbitalOcean" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#030814" />
                    <stop offset="100%" stopColor="#0a192f" />
                  </linearGradient>
                  <radialGradient id="satelliteThermalCluster" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="25%" stopColor="#fef08a" />
                    <stop offset="60%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect x="0" y="0" width="800" height="500" fill="url(#orbitalOcean)" />
                <path d="M 120 0 L 180 80 L 230 160 L 310 240 L 420 340 L 560 420 L 740 480 L 800 490 L 800 0 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                <path d="M 380 40 L 450 140 L 540 260 L 670 380 L 780 430" fill="none" stroke="#1e293b" strokeWidth="14" opacity="0.9" />
                <g transform="translate(420, 180)">
                  <circle cx="0" cy="0" r="60" fill="url(#satelliteThermalCluster)" className="animate-pulse" />
                  <circle cx="20" cy="-15" r="35" fill="url(#satelliteThermalCluster)" className="animate-pulse" />
                  <text x="35" y="-20" fill="#fde047" fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
                    NASA FIRMS SWIR PIXEL CLUSTER (342 MW)
                  </text>
                  <text x="35" y="-5" fill="#ffffff" fontSize="9" fontFamily="JetBrains Mono">
                    RADIATIVE FLUX: EXTREME · SENTINEL-2A L2A
                  </text>
                </g>
              </svg>
            )}
          </div>

          {/* DUAL-SENSOR PICTURE-IN-PICTURE (PiP) INSET WINDOW */}
          {showDualSensorPiP && (
            <div
              className="absolute bottom-4 right-4 z-40 w-44 sm:w-56 h-28 sm:h-36 rounded-xl border-2 border-cyan-400 bg-black overflow-hidden shadow-2xl group cursor-pointer"
              onClick={swapSensors}
              title="Click to swap Primary and PiP Sensors"
            >
              <div className="absolute top-1.5 left-2 z-10 font-mono text-[8px] text-cyan-300 font-bold bg-black/70 px-1 py-0.2 rounded border border-cyan-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>PiP: {pipThermalMode.replace('flir_', '').toUpperCase()}</span>
              </div>
              <div className="absolute top-1.5 right-2 z-10 font-mono text-[8px] text-white bg-slate-900/80 px-1 py-0.2 rounded border border-slate-700">
                SWAP ⇄
              </div>

              {/* Inset Sensor Render */}
              <div
                className="w-full h-full relative"
                style={{
                  filter: getFilterStyle(pipThermalMode),
                }}
              >
                <div className="w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-black flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border border-dashed border-cyan-400 animate-spin" />
                  <Crosshair className="w-6 h-6 text-red-400 absolute" />
                </div>
              </div>
            </div>
          )}

          {/* Central Tactical Reticle / Flight HUD Overlay */}
          {showHUDOverlay && (
            <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
              {isAircraftNoseCam && showFlightLadder && (
                <div className="relative w-80 h-72 flex items-center justify-center">
                  <div className="w-full space-y-8 text-center text-[10px] text-cyan-400 font-bold opacity-80">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-10 h-0.5 bg-cyan-400" />
                      <span>+10</span>
                      <span className="w-10 h-0.5 bg-cyan-400" />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-16 h-0.5 bg-cyan-400" />
                      <span>+05</span>
                      <span className="w-16 h-0.5 bg-cyan-400" />
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-24 h-1 bg-emerald-400" />
                      <div className="w-4 h-4 rounded-full border-2 border-emerald-400 flex items-center justify-center">
                        <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                      </div>
                      <div className="w-24 h-1 bg-emerald-400" />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-16 h-0.5 bg-cyan-400 stroke-dashed border-t border-dashed border-cyan-400" />
                      <span>-05</span>
                      <span className="w-16 h-0.5 bg-cyan-400 stroke-dashed border-t border-dashed border-cyan-400" />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-10 h-0.5 bg-cyan-400 stroke-dashed border-t border-dashed border-cyan-400" />
                      <span>-10</span>
                      <span className="w-10 h-0.5 bg-cyan-400 stroke-dashed border-t border-dashed border-cyan-400" />
                    </div>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400 font-bold text-xs">
                    [-o-]
                  </div>
                </div>
              )}

              {(!isAircraftNoseCam || !showFlightLadder) && (
                <div className="relative w-52 h-52 border border-cyan-400/40 rounded-full flex items-center justify-center">
                  <div className="w-28 h-28 border border-dashed border-cyan-300/60 rounded-full" />
                  <div className="w-14 h-14 border border-cyan-400/80 rounded-full" />
                  <line x1="0" y1="104" x2="208" y2="104" stroke="#38bdf8" strokeWidth="1" opacity="0.7" />
                  <line x1="104" y1="0" x2="104" y2="208" stroke="#38bdf8" strokeWidth="1" opacity="0.7" />
                  <div className="absolute top-1 left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-400" />
                  <div className="absolute top-1 right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-400" />
                  <div className="absolute bottom-1 left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-400" />
                  <div className="absolute bottom-1 right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-400" />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                </div>
              )}
            </div>
          )}

          {/* Bottom Left Camera Compass & Angle */}
          {showHUDOverlay && (
            <div className="absolute bottom-3 left-4 z-30 text-[10px] text-slate-300 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded border border-slate-800 pointer-events-none">
              <span className="text-slate-400">AZIMUTH:</span> <strong className="text-white">164° SSE</strong> ·{' '}
              <span className="text-slate-400">ELEVATION:</span> <strong className="text-white">+3.4°</strong> ·{' '}
              <span className="text-slate-400">DSP:</span> <strong className="text-cyan-400">{isDeSmokeActive ? 'DDE-ON' : 'RAW'}</strong>
            </div>
          )}
        </div>

        {/* Enhanced Controls Toolbar: Sensor Palettes, PTZ, Quality & Fine-Tuning */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
          {/* Thermal Sensor Palette Selector (Cols 1-5) */}
          <div className="lg:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                PRIMARY SENSOR PALETTE:
              </span>
              <button
                onClick={swapSensors}
                className="text-[10px] text-cyan-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer"
              >
                <span>SWAP PiP</span>
                <span>⇄</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'optical', label: 'Daylight 4K UHD' },
                { id: 'flir_white_hot', label: 'FLIR White-Hot' },
                { id: 'flir_black_hot', label: 'FLIR Black-Hot' },
                { id: 'flir_rainbow', label: 'Ironbow Spectrum' },
                { id: 'nvg', label: 'NVG Gen-III' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setThermalMode(p.id as ThermalMode);
                    onPlayBeep?.(800, 'triangle', 0.03);
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                    thermalMode === p.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* PTZ Zoom & Pan Controls (Cols 6-8) */}
          <div className="lg:col-span-4 space-y-1.5">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
              PTZ MAGNIFICATION & PAN:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleZoom(0.5)}
                className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-200 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
                <span>+</span>
              </button>
              <button
                onClick={() => handleZoom(-0.5)}
                className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-200 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5 text-cyan-400" />
                <span>-</span>
              </button>

              <div className="flex items-center gap-0.5 ml-1">
                <button
                  onClick={() => handlePan(-25, 0)}
                  className="px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:text-cyan-300 text-[10px] cursor-pointer"
                  title="Pan West"
                >
                  ◄
                </button>
                <button
                  onClick={() => handlePan(0, -25)}
                  className="px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:text-cyan-300 text-[10px] cursor-pointer"
                  title="Pan North"
                >
                  ▲
                </button>
                <button
                  onClick={() => handlePan(0, 25)}
                  className="px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:text-cyan-300 text-[10px] cursor-pointer"
                  title="Pan South"
                >
                  ▼
                </button>
                <button
                  onClick={() => handlePan(25, 0)}
                  className="px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:text-cyan-300 text-[10px] cursor-pointer"
                  title="Pan East"
                >
                  ►
                </button>
              </div>

              <button
                onClick={resetPTZ}
                className="px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:text-white text-slate-400 text-[10px] font-bold transition-colors cursor-pointer ml-1"
                title="Reset Zoom & Pan"
              >
                RESET
              </button>
            </div>
          </div>

          {/* Picture Quality Adjustments & DSP Toggles (Cols 9-12) */}
          <div className="lg:col-span-3 space-y-1.5">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
              DSP FILTERS & SENSORS:
            </span>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              {/* De-Smoke DSP Toggle */}
              <button
                onClick={() => {
                  setIsDeSmokeActive(!isDeSmokeActive);
                  onPlayBeep?.(isDeSmokeActive ? 700 : 1050, 'sawtooth', 0.04);
                }}
                className={`px-2 py-0.5 rounded border font-bold cursor-pointer transition-colors ${
                  isDeSmokeActive
                    ? 'bg-amber-950/80 border-amber-400 text-amber-300 ring-1 ring-amber-500/50'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title="Toggle Real-Time De-Smoke Aerosol DSP Filter"
              >
                DE-SMOKE: {isDeSmokeActive ? 'ON' : 'OFF'}
              </button>

              {/* Dual-Sensor PiP Toggle */}
              <button
                onClick={() => setShowDualSensorPiP(!showDualSensorPiP)}
                className={`px-2 py-0.5 rounded border font-bold cursor-pointer transition-colors ${
                  showDualSensorPiP
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
                title="Toggle Picture-in-Picture Dual Sensor Sub-Window"
              >
                PiP: {showDualSensorPiP ? 'ON' : 'OFF'}
              </button>

              {/* Gimbal Lock Toggle */}
              <button
                onClick={() => setIsGimbalLocked(!isGimbalLocked)}
                className={`px-2 py-0.5 rounded border font-bold cursor-pointer transition-colors ${
                  isGimbalLocked
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                GIMBAL: {isGimbalLocked ? 'LOCK' : 'FREE'}
              </button>

              {/* Playback Rate (Slow-mo) */}
              {[1.0, 0.5, 0.25].map((rate) => (
                <button
                  key={rate}
                  onClick={() => {
                    setPlaybackRate(rate as PlaybackRate);
                    onPlayBeep?.(900, 'sine', 0.02);
                  }}
                  className={`px-1.5 py-0.5 rounded border text-[9px] font-bold cursor-pointer ${
                    playbackRate === rate
                      ? 'bg-slate-700 text-white border-slate-500'
                      : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                >
                  {rate}X
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Feed Switcher Carousel (All 30 Bases & Military) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-bold text-white uppercase tracking-wider">
              QUICK FEED SWITCHER (CAL FIRE & MILITARY BASES):
            </span>
            <span>{CALFIRE_AND_MILITARY_BASES.length} STREAMS ONLINE</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {CALFIRE_AND_MILITARY_BASES.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setCurrentCamera({
                    title: b.cameraTitle,
                    sensor: `${b.cameraType} · ${b.agency} Tactical Net`,
                    desc: b.cameraDetail,
                    assetName: b.name,
                    baseCode: b.code,
                    weather: b.weatherStation,
                    lat: b.lat,
                    lng: b.lng,
                  });
                  resetPTZ();
                  onPlayBeep?.(1000, 'sine', 0.04);
                }}
                className={`px-2.5 py-1.5 rounded-lg border text-left shrink-0 transition-all cursor-pointer whitespace-nowrap ${
                  currentCamera.baseCode === b.code
                    ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold shadow-md shadow-cyan-950'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${b.type === 'military_base' ? 'bg-sky-400' : 'bg-orange-400'}`} />
                  <span className="text-[11px] font-bold">{b.code}</span>
                  <span className="text-[10px] text-slate-500">({b.region})</span>
                </div>
                <div className="text-[9px] text-slate-400 truncate max-w-[140px] mt-0.5">
                  {b.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Intel Note & Close Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-900 text-xs">
          <p className="text-slate-400 leading-relaxed max-w-2xl text-[11px]">
            <strong className="text-cyan-400 mr-1">INTEL DISPATCH NOTE:</strong>
            {currentCamera.desc}
          </p>
          <button
            onClick={() => {
              onClose();
              onPlayBeep?.(500, 'sine', 0.05);
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase transition-colors shrink-0 cursor-pointer border border-slate-700"
          >
            Close Feed
          </button>
        </div>
      </div>
    </div>
  );
};
