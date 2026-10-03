import React, { useState, useRef, useEffect, useMemo } from 'react';
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
} from 'recharts';
import { PredictivePoint, AnomalyRecord, ActivityLog } from '../types';
import { PredictiveAnomalyTable } from './PredictiveAnomalyTable';
import { AlertManager } from './AlertManager';
import { TacticalRadar } from './TacticalRadar';
import { LiveResourceFeed } from './LiveResourceFeed';
import { AnomalyResolutionModal, AnomalyResolutionData } from './AnomalyResolutionModal';
import { ResourceUtilizationHeatmap } from './ResourceUtilizationHeatmap';
import { ResourceCapacityForecastingWidget } from './ResourceCapacityForecastingWidget';
import { CustomAlertThresholdsPanel, StreamThresholdRule } from './CustomAlertThresholdsPanel';
import { UserActivityHeatmap } from './UserActivityHeatmap';
import { BaseResourceAllocationBarChart } from './BaseResourceAllocationBarChart';
import { 
  ShieldAlert, 
  Target, 
  Zap, 
  Activity, 
  Sliders, 
  TrendingUp, 
  Bell, 
  BellRing, 
  Calendar, 
  Cpu, 
  Sparkles, 
  Crosshair, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Terminal, 
  Radio, 
  Layers, 
  Flame, 
  AlertTriangle, 
  Globe2, 
  Satellite, 
  Ship, 
  Video, 
  RadioTower, 
  Eye, 
  Camera, 
  Maximize2, 
  ExternalLink, 
  ChevronRight, 
  Sun, 
  Moon, 
  Workflow, 
  Search, 
  Filter,
  Warehouse,
  BarChart3,
  Gauge,
  Droplets,
  Plane,
  HelpCircle
} from 'lucide-react';

export type AnomalyFilter = 'all' | 'critical' | 'high_plus' | 'medium_plus' | 'none';

// OSIRIS AI Layer Identifier
export type OsirisLayerId = 
  | 'maritime'
  | 'satellites'
  | 'cctv'
  | 'cctv_previews'
  | 'live_news'
  | 'earthquakes'
  | 'global_incidents'
  | 'day_night'
  | 'cables'
  | 'sdk_sea'
  | 'sdk_air'
  | 'sdk_naval';

interface MapAsset {
  id: string;
  name: string;
  type: 'air' | 'heli' | 'recon' | 'naval' | 'maritime' | 'satellite' | 'incident' | 'quake' | 'cctv' | 'cable_station';
  wildfireCategory?: 'air_tanker' | 'helicopter' | 'wildfire' | 'recon_lead';
  lat: number;
  lng: number;
  status: string;
  callsign?: string;
  altSpeed?: string;
  detail: string;
  telemetry: Record<string, any>;
  cctvImage?: string;
  heading?: number;
}

interface PredictiveDashboardProps {
  activityLogs?: ActivityLog[];
  onAddActivityLog?: (log: ActivityLog) => void;
}

export const PredictiveDashboard: React.FC<PredictiveDashboardProps> = ({
  activityLogs = [],
  onAddActivityLog,
}) => {
  // War Room View Mode: 'tactical_radar' | 'split' | 'geospatial' | 'metrics' | 'base_allocation' | 'heatmap' | 'forecasting' | 'user_activity'
  const [viewMode, setViewMode] = useState<'tactical_radar' | 'split' | 'geospatial' | 'metrics' | 'base_allocation' | 'heatmap' | 'forecasting' | 'user_activity'>('tactical_radar');
  const [showHeatmapOverlay, setShowHeatmapOverlay] = useState<boolean>(false);
  const [showForecastWidget, setShowForecastWidget] = useState<boolean>(true);
  const [showActivityHeatmap, setShowActivityHeatmap] = useState<boolean>(false);
  const [showBaseAllocationSection, setShowBaseAllocationSection] = useState<boolean>(true);
  const [hoveredChartDotDate, setHoveredChartDotDate] = useState<string | null>(null);
  const [hoveredAnomalyMarker, setHoveredAnomalyMarker] = useState<PredictivePoint['anomaly'] | null>(null);

  // Anomaly Resolution & RCA State
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState<boolean>(false);
  const [isAlertConfigOpen, setIsAlertConfigOpen] = useState<boolean>(false);
  const [targetAnomalyForResolution, setTargetAnomalyForResolution] = useState<PredictivePoint['anomaly'] | null>(null);
  const [resolvedAnomalies, setResolvedAnomalies] = useState<Record<string, AnomalyResolutionData>>({});
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState<boolean>(false);

  // OSIRIS Tactical Radar Wildfire Resource Filter
  const [radarResourceFilter, setRadarResourceFilter] = useState<'all' | 'wildfire_all' | 'tankers' | 'helicopters' | 'wildfires' | 'recon'>('all');

  // Futuristic OSIRIS Tactical Radar Controls
  const [radarColorTheme, setRadarColorTheme] = useState<'cyan' | 'flir' | 'nvg'>('cyan');
  const [radarSweepSpeed, setRadarSweepSpeed] = useState<'normal' | 'fast' | 'frozen'>('normal');
  const [radarShowVectorTrails, setRadarShowVectorTrails] = useState<boolean>(true);
  const [radarRangeScale, setRadarRangeScale] = useState<'200' | '100' | '50'>('200');
  const [radarSectorZoom, setRadarSectorZoom] = useState<'statewide' | 'norcal' | 'central' | 'socal'>('statewide');
  const [radarZoomScale, setRadarZoomScale] = useState<number>(1.0);
  const [radarPanOffset, setRadarPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isRadarDragging, setIsRadarDragging] = useState<boolean>(false);
  const radarDragStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);
  const didRadarDragRef = useRef<boolean>(false);
  const radarSvgContainerRef = useRef<HTMLDivElement | null>(null);
  const [radarDeclutter, setRadarDeclutter] = useState<boolean>(false);
  const [radarShowAirways, setRadarShowAirways] = useState<boolean>(true);
  const [radarShowClassB, setRadarShowClassB] = useState<boolean>(true);
  const [hoveredMapAssetId, setHoveredMapAssetId] = useState<string | null>(null);

  // Base sector bounds for SVG radar
  const baseRadarViewBox = useMemo(() => {
    switch (radarSectorZoom) {
      case 'norcal':
        return { x: 50, y: 0, width: 340, height: 220 };
      case 'central':
        return { x: 130, y: 110, width: 330, height: 220 };
      case 'socal':
        return { x: 230, y: 180, width: 340, height: 200 };
      case 'statewide':
      default:
        return { x: 0, y: 0, width: 600, height: 400 };
    }
  }, [radarSectorZoom]);

  // Reset SVG radar zoom when changing sector
  useEffect(() => {
    setRadarZoomScale(1.0);
    setRadarPanOffset({ x: 0, y: 0 });
  }, [radarSectorZoom]);

  // Wheel zoom listener on SVG container
  useEffect(() => {
    const el = radarSvgContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width;
      const normY = (e.clientY - rect.top) / rect.height;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;

      setRadarZoomScale((prevZoom) => {
        const nextZoom = Math.min(6.0, Math.max(0.7, prevZoom * zoomFactor));

        setRadarPanOffset((prevPan) => {
          const baseW = baseRadarViewBox.width;
          const baseH = baseRadarViewBox.height;

          const oldW = baseW / prevZoom;
          const oldH = baseH / prevZoom;
          const newW = baseW / nextZoom;
          const newH = baseH / nextZoom;

          const deltaX = (normX - 0.5) * (oldW - newW);
          const deltaY = (normY - 0.5) * (oldH - newH);

          return {
            x: Math.max(-400, Math.min(400, prevPan.x + deltaX)),
            y: Math.max(-300, Math.min(300, prevPan.y + deltaY)),
          };
        });

        return nextZoom;
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [baseRadarViewBox]);

  // Dynamic composite viewBox string for SVG
  const computedRadarViewBox = useMemo(() => {
    const width = baseRadarViewBox.width / radarZoomScale;
    const height = baseRadarViewBox.height / radarZoomScale;
    const centerX = baseRadarViewBox.x + baseRadarViewBox.width / 2 + radarPanOffset.x;
    const centerY = baseRadarViewBox.y + baseRadarViewBox.height / 2 + radarPanOffset.y;
    const x = centerX - width / 2;
    const y = centerY - height / 2;
    return `${x} ${y} ${width} ${height}`;
  }, [baseRadarViewBox, radarZoomScale, radarPanOffset]);

  // OSIRIS Active Layers
  const [activeLayers, setActiveLayers] = useState<Record<OsirisLayerId, boolean>>({
    sdk_air: true,
    sdk_naval: true,
    maritime: true,
    satellites: true,
    global_incidents: true,
    earthquakes: true,
    cctv: true,
    cctv_previews: true,
    live_news: true,
    day_night: true,
    cables: true,
    sdk_sea: true,
  });

  // Selected asset for OSIRIS HUD inspection drawer
  const [selectedAsset, setSelectedAsset] = useState<MapAsset | null>(null);

  // Scenario sliders
  const [slaTargetReduction, setSlaTargetReduction] = useState<number>(18); // % reduction
  const [incidentSurgeFactor, setIncidentSurgeFactor] = useState<number>(1.3); // 1.3x surge
  const [preventativeMaintBuffer, setPreventativeMaintBuffer] = useState<number>(94); // %

  // Audio feedback toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Anomaly selection & Analyst Display Filter
  const [selectedAnomaly, setSelectedAnomaly] = useState<PredictivePoint['anomaly'] | null>(null);
  const [anomalyFilter, setAnomalyFilter] = useState<AnomalyFilter>('all');

  // Helper: determines if an anomaly should be rendered based on active analyst filter
  const isAnomalyMatchingFilter = (anom?: PredictivePoint['anomaly']) => {
    if (!anom) return false;
    if (anomalyFilter === 'none') return false;
    if (anomalyFilter === 'all') return true;
    if (anomalyFilter === 'critical') return anom.severity === 'critical';
    if (anomalyFilter === 'high_plus') return anom.severity === 'critical' || anom.severity === 'high';
    if (anomalyFilter === 'medium_plus') return anom.severity === 'critical' || anom.severity === 'high' || anom.severity === 'medium';
    return true;
  };

  // AI analysis
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  // Tactical Web Audio Synthesizer
  const playTacticalBeep = (freq: number = 880, type: OscillatorType = 'sine', duration: number = 0.08) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext unavailable
    }
  };

  // Toggle specific OSIRIS layer
  const toggleLayer = (layer: OsirisLayerId) => {
    setActiveLayers((prev) => {
      const updated = { ...prev, [layer]: !prev[layer] };
      playTacticalBeep(updated[layer] ? 900 : 500, 'sine', 0.04);
      return updated;
    });
  };

  // OSIRIS Geospatial Intelligence Assets (Pacific Wildfire Resources & Multi-Domain Fleet)
  const mapAssets: MapAsset[] = useMemo(() => [
    // --- PACIFIC AIR TANKERS (VLAT & LAT Mixed Heavy Fleet) ---
    {
      id: 'air-80',
      name: 'Tanker 80 (S-2T Turbo Tracker)',
      type: 'air',
      wildfireCategory: 'air_tanker',
      lat: 40.58,
      lng: -122.39,
      status: 'Drops En Route',
      callsign: 'TANKER-80',
      heading: 42,
      altSpeed: 'FL085 · 242 kts',
      detail: 'Assigned to Shasta Complex Fire line alpha; 1,200 gal retardant payload armed.',
      telemetry: { Base: 'Redding (RDD)', RetardantGal: '1,200 gal', PayloadType: 'Phos-Chek MVP-Fx', Altitude: '8,500 ft', GroundSpeed: '242 kts', Heading: '042°', FuelPct: '68%' },
    },
    {
      id: 'air-96',
      name: 'Tanker 96 (S-2T Turbo Tracker)',
      type: 'air',
      wildfireCategory: 'air_tanker',
      lat: 35.63,
      lng: -120.69,
      status: 'Pit Reload / Turnaround',
      callsign: 'TANKER-96',
      heading: 310,
      altSpeed: 'RAMP · 0 kts',
      detail: 'Staged at Paso Robles Tanker Base; reloading slurry mix for Big Sur coastal perimeter.',
      telemetry: { Base: 'Paso Robles (PRB)', RetardantGal: '1,200 gal (Reloading)', SlurryPumpPSI: '42 PSI', EstimatedRTS: '6 min', FuelPct: '74%' },
    },
    {
      id: 'air-118',
      name: 'Tanker 118 (C-130H Hercules)',
      type: 'air',
      wildfireCategory: 'air_tanker',
      lat: 38.66,
      lng: -121.39,
      status: 'Maintenance Hold',
      callsign: 'TANKER-118',
      heading: 195,
      altSpeed: 'RAMP · 0 kts',
      detail: 'Heavy Air Tanker (4,000 gal). Pneumatic door actuator seal inspected at McClellan Base.',
      telemetry: { Base: 'McClellan (SAC)', RetardantGal: '4,000 gal', HydraulicPSI: '2,920 (Nominal)', EstimatedRTS: '12 min', FuelPct: '88%' },
    },
    {
      id: 'air-910',
      name: 'Tanker 910 (DC-10 Air Tanker VLAT)',
      type: 'air',
      wildfireCategory: 'air_tanker',
      lat: 34.59,
      lng: -117.38,
      status: 'VLAT Sortie Airborne',
      callsign: 'TANKER-910',
      heading: 235,
      altSpeed: 'FL095 · 280 kts',
      detail: 'Very Large Air Tanker (9,400 gal triple-tank retardant system). Committed to Angeles Crest ridge.',
      telemetry: { Base: 'Victorville (VCV)', RetardantGal: '9,400 gal', Tanks: '3 External Barrels', Altitude: '9,500 ft', GroundSpeed: '280 kts', Heading: '235°', CoverageLevel: 'CL-8' },
    },
    {
      id: 'air-102',
      name: 'Tanker 102 (MD-87 Large Air Tanker)',
      type: 'air',
      wildfireCategory: 'air_tanker',
      lat: 39.79,
      lng: -121.85,
      status: 'Transit to Dixie Fire',
      callsign: 'TANKER-102',
      heading: 68,
      altSpeed: 'FL075 · 260 kts',
      detail: '3,000 gal external belly tank. Vectoring from Chico Auxiliary to Dixie Ridge perimeter.',
      telemetry: { Base: 'Chico (CIC)', RetardantGal: '3,000 gal', System: 'RADS-II Constant Flow', Altitude: '7,500 ft', Heading: '068°', DropTarget: 'Division Zulu' },
    },

    // --- PACIFIC WILDFIRE STRIKE HELICOPTERS (Helitack & Helitankers) ---
    {
      id: 'heli-106',
      name: 'Copter 106 (S-70i Firehawk)',
      type: 'heli',
      wildfireCategory: 'helicopter',
      lat: 38.82,
      lng: -122.75,
      status: 'Initial Attack Standby',
      callsign: 'COPTER-106',
      heading: 75,
      altSpeed: 'GND · 0 kts',
      detail: 'Pre-staged at Boggs Mountain Heli-base; 1,000 gal Bambi belly-tank & 9-person helitack crew ready.',
      telemetry: { Base: 'Boggs Mountain', WaterTankGal: '1,000 gal', HelitackCrew: '9 Strike Firefighters', ReadyLaunchTime: '3 min', Snorkel: 'Active Retractable' },
    },
    {
      id: 'heli-902',
      name: 'Copter 902 (UH-1H Super Huey)',
      type: 'heli',
      wildfireCategory: 'helicopter',
      lat: 40.80,
      lng: -124.16,
      status: 'Water Bucket Drops',
      callsign: 'COPTER-902',
      heading: 110,
      altSpeed: '2,100 ft · 110 kts',
      detail: 'Humboldt Bay Ops Initial Attack. Dipping 360 gal water drops on Mendocino spot fire perimeter.',
      telemetry: { Base: 'Humboldt Bay', BucketCapacity: '360 gal', TotalDropsToday: '14 Drops', DippingSource: 'Eel River Basin', FuelRemaining: '52%' },
    },
    {
      id: 'heli-501',
      name: 'Copter 501 (CH-47D Chinook Helitanker)',
      type: 'heli',
      wildfireCategory: 'helicopter',
      lat: 36.73,
      lng: -119.72,
      status: 'Heavy Suppression Drop',
      callsign: 'COPTER-501',
      heading: 85,
      altSpeed: '3,400 ft · 135 kts',
      detail: 'Heavy-lift 2,600 gal internal tank helitanker supporting Central Sierra wildfire boundary.',
      telemetry: { Base: 'Fresno Air Attack', RetardantTank: '2,600 gal', DropDuration: '3.2 sec', TankRefillTime: '55 sec (Hover Snorkel)', Heading: '085°' },
    },
    {
      id: 'heli-205',
      name: 'Copter 205 (Bell 212 Helitack)',
      type: 'heli',
      wildfireCategory: 'helicopter',
      lat: 38.51,
      lng: -122.81,
      status: 'Hotshot Rappel Deploy',
      callsign: 'COPTER-205',
      heading: 280,
      altSpeed: 'Hover · 15 kts',
      detail: 'Deploying remote rappel crew onto inaccessible ridge flank east of Santa Rosa.',
      telemetry: { Base: 'Santa Rosa Heli-base', RappelCrew: '6 Smokejumpers', WaterBucket: '320 gal', HoistStatus: 'Armed', WindAtHover: '12 kts' },
    },

    // --- PACIFIC WILDFIRE INCIDENTS (NASA FIRMS Live Thermal Clusters) ---
    {
      id: 'inc-shasta',
      name: 'Shasta Complex Wildfire Perimeter',
      type: 'incident',
      wildfireCategory: 'wildfire',
      lat: 40.75,
      lng: -122.42,
      status: 'Tier-1 Extreme Wildfire Run',
      altSpeed: '4,820 Acres · 15% Contained',
      detail: 'Crown fire run driven by 35mph canyon winds. Tanker 80 and Tanker 102 committed for retardant lines.',
      telemetry: { Acres: '4,820', Containment: '15%', FireBehavior: 'Extreme Crown Run', RateOfSpread: '1.4 mph', FuelModel: 'Dense Mixed Conifer', AssignedTankers: 'Tanker 80, Tanker 102' },
    },
    {
      id: 'inc-mendo',
      name: 'Mendocino Lightning Strike Cluster',
      type: 'incident',
      wildfireCategory: 'wildfire',
      lat: 39.15,
      lng: -123.20,
      status: 'Initial Attack Active',
      altSpeed: '180 Acres · 0% Contained',
      detail: 'Dry lightning ignition in timber stand; Copter 902 and Copter 106 conducting continuous bucket drops.',
      telemetry: { Acres: '180', Containment: '0%', SmokeColumn: 'Vertical 4,000ft', ThreatLevel: 'Moderate', ResourcesEngaged: '2x Helitack Strike Teams' },
    },
    {
      id: 'inc-dixie',
      name: 'Dixie Ridge Wildfire Secondary Run',
      type: 'incident',
      wildfireCategory: 'wildfire',
      lat: 40.05,
      lng: -121.20,
      status: 'Canyon Spot Fires Spreading',
      altSpeed: '2,940 Acres · 30% Contained',
      detail: 'Steep canyon drainage fire in Feather River corridor; spot fires jumping primary containment ridge.',
      telemetry: { Acres: '2,940', Containment: '30%', FlameLength: '18-24 ft', WindGusts: '28 kts', SuppressionCommitment: 'Air Tanker 102 on vector' },
    },
    {
      id: 'inc-angeles',
      name: 'Angeles Crest Fire Complex',
      type: 'incident',
      wildfireCategory: 'wildfire',
      lat: 34.25,
      lng: -118.15,
      status: 'VLAT Retardant Barrier Mission',
      altSpeed: '1,420 Acres · 40% Contained',
      detail: 'Chaparral wildfire threatening power grid corridor; Tanker 910 (DC-10) dropping full 9,400 gal retardant line.',
      telemetry: { Acres: '1,420', Containment: '40%', HighValueTarget: 'Hydroelectric Substation', RetardantDrop: 'Tanker 910 Line 1' },
    },
    {
      id: 'inc-bigsur',
      name: 'Big Sur Coastal Wilderness Wildfire',
      type: 'incident',
      wildfireCategory: 'wildfire',
      lat: 36.25,
      lng: -121.75,
      status: 'Maritime Ridge Containment',
      altSpeed: '890 Acres · 20% Contained',
      detail: 'Inaccessible sea cliff wildfire burning in Monterey coastal brush. Tanker 96 re-vectoring from Paso Robles.',
      telemetry: { Acres: '890', Containment: '20%', MarineInversion: 'Breaking at 1,800ft', SeaBreeze: 'SW 16 kts', SlopeSteepness: '65%' },
    },

    // --- AIR SUPERVISION & LEAD PLANES ---
    {
      id: 'air-140',
      name: 'Air Attack 140 (OV-10A Bronco)',
      type: 'recon',
      wildfireCategory: 'recon_lead',
      lat: 38.58,
      lng: -121.49,
      status: 'Tactical Recon Orbit',
      callsign: 'AIRATTACK-140',
      heading: 330,
      altSpeed: 'FL045 · 198 kts',
      detail: 'Air Tactical Group Supervisor (ATGS) controlling airspace and drop corridors over Northern California.',
      telemetry: { Altitude: '4,500 ft', GroundSpeed: '198 kts', VHF_Radio: '122.925 MHz', AirspaceControl: '5 Sorties In Orbit', ForwardIRSensor: 'FLIR HD' },
    },
    {
      id: 'air-lead51',
      name: 'Lead Plane 51 (King Air 200)',
      type: 'recon',
      wildfireCategory: 'recon_lead',
      lat: 34.40,
      lng: -118.05,
      status: 'Leading VLAT Tanker 910',
      callsign: 'LEAD-51',
      heading: 245,
      altSpeed: 'FL065 · 210 kts',
      detail: 'Lead plane marking retardant drop run with smoke trail for DC-10 VLAT over Angeles Crest.',
      telemetry: { Aircraft: 'Beechcraft King Air 200', Altitude: '6,500 ft', SmokeTrailSystem: 'Pressurized Oil', TrailTarget: 'Angeles Crest Ridge Line' },
    },

    // --- PACIFIC DEFENSE, SATELLITES & MARITIME ---
    {
      id: 'nav-752',
      name: 'USCG Cutter Stratton (WMSL-752)',
      type: 'naval',
      lat: 37.80,
      lng: -122.55,
      status: 'Maritime Security Patrol',
      callsign: 'STRATTON',
      altSpeed: '18.4 kts · Hdg 215°',
      detail: 'Legend-class National Security Cutter patrolling Golden Gate approach waters.',
      telemetry: { Speed: '18.4 kts', Heading: '215°', Radar: 'TRS-3D Active', Sonar: 'Active Scan' },
    },
    {
      id: 'mar-440',
      name: 'Pacific Sentinel (VLCC Crude Tanker)',
      type: 'maritime',
      lat: 33.72,
      lng: -118.25,
      status: 'Channel Transit',
      callsign: 'PAC-SENTINEL',
      altSpeed: '12.1 kts · Hdg 145°',
      detail: 'Commercial AIS vessel transiting San Pedro outbound channel.',
      telemetry: { MMSI: '368924000', Draft: '14.2m', GrossTonnage: '162,000t', Destination: 'Yokohama' },
    },
    {
      id: 'sat-sentinel2',
      name: 'Sentinel-2A (ESA Multispectral)',
      type: 'satellite',
      lat: 41.20,
      lng: -121.80,
      status: 'Sun-Synchronous Orbit',
      callsign: 'SENTINEL-2A',
      altSpeed: 'Alt 786 km · 7.4 km/s',
      detail: 'Active MSI thermal infrared scan mapping California wildfire perimeters in real time.',
      telemetry: { Altitude: '786 km', SwathWidth: '290 km', ThermalResolution: '20m', FireRadiativePower: '184 MW' },
    },
    {
      id: 'sat-goes18',
      name: 'GOES-18 (NOAA GOES-West)',
      type: 'satellite',
      lat: 32.5,
      lng: -126.8,
      status: 'Geostationary Surveillance',
      callsign: 'GOES-WEST',
      altSpeed: 'Alt 35,786 km',
      detail: 'Continuous real-time lightning detection & fire temperature radiant power scanning Pacific Rim.',
      telemetry: { Orbit: 'Geostationary', Longitude: '137.2°W', Sensor: 'ABI & GLM', RefreshRate: '30 sec' },
    },
    {
      id: 'quake-gorda',
      name: 'USGS M4.2 - Cape Mendocino Fault',
      type: 'quake',
      lat: 40.35,
      lng: -124.60,
      status: 'Seismic Shockwave Logged',
      altSpeed: 'Magnitude 4.2 · Depth 11.2 km',
      detail: 'Subduction zone tectonic slippage; zero tsunami threat generated.',
      telemetry: { Magnitude: '4.2 Mw', Depth: '11.2 km', StationsReporting: '48', GroundMotion: '0.04g PGA' },
    },
    {
      id: 'cctv-redding',
      name: 'CCTV-04: Redding Ramp Operations',
      type: 'cctv',
      lat: 40.50,
      lng: -122.30,
      status: 'Live Optical Stream HD',
      detail: 'Ramp camera viewing retardant pit #2 and aircraft fueling bays.',
      cctvImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" fill="%23050c18"/><text x="15" y="25" fill="%2306b6d4" font-family="monospace" font-size="11">CAM_04 // RDD TANKER RAMP</text><circle cx="280" cy="20" r="4" fill="%23ef4444"/><rect x="20" y="45" width="260" height="110" fill="%2309192f" stroke="%2306b6d4" stroke-width="0.5"/><path d="M 60 120 L 150 70 L 240 120 Z" fill="%23083344" stroke="%2338bdf8"/><text x="85" y="105" fill="%23ffffff" font-family="monospace" font-size="10">TANKER-80 LOADING PIT</text><text x="25" y="145" fill="%2394a3b8" font-family="monospace" font-size="9">TEMP: 96°F · WIND: NW 14KT · RELOAD ACTIVE</text></svg>',
      telemetry: { Resolution: '1080p60', Bitrate: '4.2 Mbps', PTZ_Bearing: '218°', NightVision: 'Ready' },
    },
    {
      id: 'cctv-mcclellan',
      name: 'CCTV-11: McClellan Base Flight Line',
      type: 'cctv',
      lat: 38.67,
      lng: -121.40,
      status: 'Live Optical Stream HD',
      detail: 'Flight line security camera monitoring C-130H quarantine hold.',
      cctvImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" fill="%23050c18"/><text x="15" y="25" fill="%23f59e0b" font-family="monospace" font-size="11">CAM_11 // SAC QUARANTINE BAY</text><circle cx="280" cy="20" r="4" fill="%2310b981"/><rect x="20" y="45" width="260" height="110" fill="%2309192f" stroke="%23f59e0b" stroke-width="0.5"/><rect x="70" y="70" width="160" height="50" fill="%231e293b" stroke="%23f59e0b"/><text x="95" y="98" fill="%23f59e0b" font-family="monospace" font-size="10">C-130H SEAL INSPECTION</text><text x="25" y="145" fill="%2394a3b8" font-family="monospace" font-size="9">STATUS: HYDRAULIC VALVE RE-TORQUED</text></svg>',
      telemetry: { Resolution: '1080p60', Latency: '110ms', PTZ_Bearing: '085°', Status: 'Maintenance In Progress' },
    },
    {
      id: 'cable-unity',
      name: 'Trans-Pacific Subsea Cable (Unity Landing Station)',
      type: 'cable_station',
      lat: 33.88,
      lng: -118.42,
      status: 'Operational 96 Tbps',
      altSpeed: 'Hermosa Beach, CA → Chikura, Japan',
      detail: 'Critical subsea fiber optic backbone route across the Pacific Rim basin.',
      telemetry: { Capacity: '96 Tbps', FiberPairs: '8', LatencyTokyo: '78ms', Integrity: '100% Nominal' },
    },
  ], []);

  // Filter map assets according to enabled OSIRIS layers & Wildfire Resource Filter
  const visibleMapAssets = useMemo(() => {
    return mapAssets.filter((a) => {
      // 1. Layer filtering
      if ((a.type === 'air' || a.type === 'heli' || a.type === 'recon') && !activeLayers.sdk_air) return false;
      if (a.type === 'naval' && !activeLayers.sdk_naval) return false;
      if (a.type === 'maritime' && !activeLayers.maritime) return false;
      if (a.type === 'satellite' && !activeLayers.satellites) return false;
      if (a.type === 'incident' && !activeLayers.global_incidents) return false;
      if (a.type === 'quake' && !activeLayers.earthquakes) return false;
      if (a.type === 'cctv' && !activeLayers.cctv) return false;
      if (a.type === 'cable_station' && !activeLayers.cables) return false;

      // 2. Wildfire Resource Filter
      if (radarResourceFilter === 'wildfire_all') {
        return a.wildfireCategory !== undefined;
      }
      if (radarResourceFilter === 'tankers') {
        return a.wildfireCategory === 'air_tanker';
      }
      if (radarResourceFilter === 'helicopters') {
        return a.wildfireCategory === 'helicopter';
      }
      if (radarResourceFilter === 'wildfires') {
        return a.wildfireCategory === 'wildfire';
      }
      if (radarResourceFilter === 'recon') {
        return a.wildfireCategory === 'recon_lead';
      }

      return true;
    });
  }, [mapAssets, activeLayers, radarResourceFilter]);

  // Historical Actuals + Forward Predictive Horizon Dataset with Complete Telemetry
  const rawDataPoints: PredictivePoint[] = useMemo(() => [
    { 
      date: '09/01', 
      actual: 18.2,
      dayOfWeek: 'Tue',
      fullDate: 'Sep 01, 2026',
      sortiesFlown: 24,
      activeAirframes: ['Tanker 80 (S-2T)', 'Tanker 96 (S-2T)', 'Copter 902 (UH-1H)'],
      retardantDeliveredGal: 28800,
      weatherSummary: '88°F · RH 18% · Winds 12kt NW · Moderate Fire Danger',
      zScore: -0.3,
      statusLabel: 'Nominal Turnaround',
      primaryBase: 'Redding Air Attack Base (RDD)',
      baselineMargin: '-1.8 min vs 20m benchmark target'
    },
    { 
      date: '09/03', 
      actual: 17.5,
      dayOfWeek: 'Thu',
      fullDate: 'Sep 03, 2026',
      sortiesFlown: 28,
      activeAirframes: ['Tanker 96 (S-2T)', 'Tanker 102 (MD-87)', 'Lead 51 (King Air)'],
      retardantDeliveredGal: 33600,
      weatherSummary: '92°F · RH 15% · Winds 8kt SW · High Heat Index',
      zScore: -0.6,
      statusLabel: 'Optimal Initial Attack Cycle',
      primaryBase: 'Chico Air Attack Base (CIC)',
      baselineMargin: '-2.5 min vs 20m benchmark target'
    },
    { 
      date: '09/05', 
      actual: 16.9,
      dayOfWeek: 'Sat',
      fullDate: 'Sep 05, 2026',
      sortiesFlown: 31,
      activeAirframes: ['Tanker 118 (C-130H)', 'Tanker 81 (S-2T)', 'Copter 902 (UH-1H)'],
      retardantDeliveredGal: 41200,
      weatherSummary: '94°F · RH 12% · Winds 10kt N · Rapid Pit Reloads',
      zScore: -0.9,
      statusLabel: 'High Throughput Staged',
      primaryBase: 'McClellan Tanker Base (MCC)',
      baselineMargin: '-3.1 min vs 20m benchmark target'
    },
    { 
      date: '09/08', 
      actual: 22.8, 
      dayOfWeek: 'Tue',
      fullDate: 'Sep 08, 2026',
      sortiesFlown: 36,
      activeAirframes: ['TANKER-80 (S-2T Turbo Tracker)', 'Air Attack 140 (OV-10A)'],
      retardantDeliveredGal: 22000,
      weatherSummary: 'Severe Microburst · 101°F · Winds 34kt Gusts · Downburst Hold',
      zScore: +2.8,
      statusLabel: 'Severe Turnaround Anomaly (Holding Pattern)',
      primaryBase: 'Redding Air Attack Base (RDD)',
      baselineMargin: '+2.8 min vs 20m target (Breached)',
      anomaly: {
        id: 'ANOM-SEP-08',
        title: 'Thermal Plume Downburst Over Shasta Sector',
        severity: 'critical',
        airframe: 'TANKER-80 (S-2T Turbo Tracker)',
        base: 'Redding Air Attack Base (RDD)',
        metric: 'Turnaround Latency',
        value: 22.8,
        expectedLimit: 18.0,
        rootCause: 'Severe microburst turbulence forced holding pattern; ground reload halted pending wind velocity stabilization.',
        mitigation: 'Rerouted Tanker 96 from Paso Robles; automated dispatch diverted reload sequence to Chico auxiliary strip.'
      }
    },
    { 
      date: '09/10', 
      actual: 16.4,
      dayOfWeek: 'Thu',
      fullDate: 'Sep 10, 2026',
      sortiesFlown: 29,
      activeAirframes: ['Tanker 96 (S-2T)', 'Lead 51 (King Air)'],
      retardantDeliveredGal: 34800,
      weatherSummary: '86°F · RH 22% · Winds 7kt W · Clear Flight Corridors',
      zScore: -1.1,
      statusLabel: 'Nominal Turnaround Cycle',
      primaryBase: 'Paso Robles Base (PRB)',
      baselineMargin: '-3.6 min vs 20m benchmark target'
    },
    { 
      date: '09/12', 
      actual: 15.8,
      dayOfWeek: 'Sat',
      fullDate: 'Sep 12, 2026',
      sortiesFlown: 33,
      activeAirframes: ['Tanker 80 (S-2T)', 'Tanker 102 (MD-87)', 'Copter 902 (UH-1H)'],
      retardantDeliveredGal: 39600,
      weatherSummary: '84°F · RH 26% · Winds 6kt SW · Sub-16m Turnaround',
      zScore: -1.3,
      statusLabel: 'Peak Efficiency Cycle',
      primaryBase: 'Sonoma Air Attack Base (STS)',
      baselineMargin: '-4.2 min vs 20m benchmark target'
    },
    { 
      date: '09/15', 
      actual: 21.4,
      dayOfWeek: 'Tue',
      fullDate: 'Sep 15, 2026',
      sortiesFlown: 35,
      activeAirframes: ['COPTER-902 (UH-1H Super Huey)', 'Tanker 81 (S-2T)'],
      retardantDeliveredGal: 26400,
      weatherSummary: 'Extreme Ambient Temp · 104°F · RH 10% · Tender Vapor Lock Risk',
      zScore: +2.1,
      statusLabel: 'Elevated Turnaround Lag (Booster Valve Cavitation)',
      primaryBase: 'Humboldt Bay Ops Base (HMB)',
      baselineMargin: '+1.4 min vs 20m target (Vapor Lock)',
      anomaly: {
        id: 'ANOM-SEP-15',
        title: 'Helitack Fuel Booster Valve Cavitation',
        severity: 'high',
        airframe: 'COPTER-902 (UH-1H Super Huey)',
        base: 'Humboldt Bay Ops Base (HMB)',
        metric: 'Turnaround Latency',
        value: 21.4,
        expectedLimit: 17.5,
        rootCause: 'Vapor lock in auxiliary fueling tender during high ambient temperature (104°F) ground operation.',
        mitigation: 'Replaced high-pressure bleed valve; pre-staged refrigerated fuel truck at Boggs Mountain.'
      }
    },
    { 
      date: '09/18', 
      actual: 16.1,
      dayOfWeek: 'Fri',
      fullDate: 'Sep 18, 2026',
      sortiesFlown: 30,
      activeAirframes: ['Tanker 118 (C-130H)', 'Lead 51 (King Air)'],
      retardantDeliveredGal: 38000,
      weatherSummary: '82°F · RH 30% · Winds 9kt WNW · Nominal Flow',
      zScore: -1.2,
      statusLabel: 'Nominal Operations',
      primaryBase: 'McClellan Tanker Base (MCC)',
      baselineMargin: '-3.9 min vs 20m benchmark target'
    },
    { 
      date: '09/20', 
      actual: 15.9,
      dayOfWeek: 'Sun',
      fullDate: 'Sep 20, 2026',
      sortiesFlown: 32,
      activeAirframes: ['Tanker 80 (S-2T)', 'Tanker 96 (S-2T)', 'Air Attack 140 (OV-10A)'],
      retardantDeliveredGal: 42000,
      weatherSummary: '85°F · RH 24% · Winds 11kt NW · Dual-Pit Parallel Reloads',
      zScore: -1.3,
      statusLabel: 'Optimal Dispatch Loop',
      primaryBase: 'Redding Air Attack Base (RDD)',
      baselineMargin: '-4.1 min vs 20m benchmark target'
    },
    { 
      date: '09/23', 
      actual: 19.8,
      dayOfWeek: 'Wed',
      fullDate: 'Sep 23, 2026',
      sortiesFlown: 37,
      activeAirframes: ['TANKER-96 (S-2T Turbo Tracker)', 'Tanker 102 (MD-87)'],
      retardantDeliveredGal: 31000,
      weatherSummary: 'Hot & Dusty · 98°F · RH 14% · Multi-Tanker Fill Demand',
      zScore: +1.4,
      statusLabel: 'Pit Pressure Throttled (Manifold Drop)',
      primaryBase: 'Paso Robles Base (PRB)',
      baselineMargin: '-0.2 min marginal headroom',
      anomaly: {
        id: 'ANOM-SEP-23',
        title: 'Retardant Pit Pump Pressure Fluctuation',
        severity: 'medium',
        airframe: 'TANKER-96 (S-2T Turbo Tracker)',
        base: 'Paso Robles Base (PRB)',
        metric: 'Reload Time',
        value: 19.8,
        expectedLimit: 17.0,
        rootCause: 'Secondary slurry mixer pump manifold pressure dropped below 45 PSI during simultaneous dual-tanker fill.',
        mitigation: 'Activated standby booster pump; staggered ground queue intervals by 4.5 minutes.'
      }
    },
    { 
      date: '09/25', 
      actual: 15.4,
      dayOfWeek: 'Fri',
      fullDate: 'Sep 25, 2026',
      sortiesFlown: 30,
      activeAirframes: ['Tanker 80 (S-2T)', 'Copter 902 (UH-1H)', 'Lead 51 (King Air)'],
      retardantDeliveredGal: 36000,
      weatherSummary: '79°F · RH 34% · Winds 8kt SW · Baseline Record',
      zScore: -1.5,
      statusLabel: 'Rapid Turnaround Benchmark',
      primaryBase: 'Chico Air Attack Base (CIC)',
      baselineMargin: '-4.6 min vs 20m benchmark target'
    },
    { 
      date: '09/28', 
      actual: 23.2,
      dayOfWeek: 'Mon',
      fullDate: 'Sep 28, 2026',
      sortiesFlown: 39,
      activeAirframes: ['TANKER-118 (C-130H Hercules)', 'Tanker 80 (S-2T)'],
      retardantDeliveredGal: 27500,
      weatherSummary: 'High Concurrency · 96°F · Secondary Door Sensor Micro-leak',
      zScore: +2.9,
      statusLabel: 'Critical Quarantine Anomaly (Sensor Flag)',
      primaryBase: 'McClellan Tanker Base (SAC)',
      baselineMargin: '+3.2 min vs 20m target (Sensor Hold)',
      anomaly: {
        id: 'ANOM-SEP-28',
        title: 'Hydraulic Actuator Quarantine Hold',
        severity: 'critical',
        airframe: 'TANKER-118 (C-130H Hercules)',
        base: 'McClellan Tanker Base (SAC)',
        metric: 'Turnaround Latency',
        value: 23.2,
        expectedLimit: 20.0,
        rootCause: 'Telemetry sensor flagged micro-leakage in secondary bay door cylinder prior to takeoff clearance.',
        mitigation: 'C-130H grounded for rapid seal swap; deployed 2x S-2T Turbo Trackers to maintain suppression coverage.'
      }
    },
    // Predictive forecast horizon points
    { date: '10/01', forecast: 16.2, lowerConfidence: 14.5, upperConfidence: 17.9, dayOfWeek: 'Thu', fullDate: 'Oct 01, 2026', statusLabel: 'CP-SAT Model Baseline Horizon' },
    { date: '10/03', forecast: 15.8, lowerConfidence: 14.1, upperConfidence: 17.5, dayOfWeek: 'Sat', fullDate: 'Oct 03, 2026', statusLabel: 'CP-SAT Model Baseline Horizon' },
    { date: '10/06', forecast: 16.5, lowerConfidence: 14.6, upperConfidence: 18.4, dayOfWeek: 'Tue', fullDate: 'Oct 06, 2026', statusLabel: 'CP-SAT Model Baseline Horizon' },
    { date: '10/09', forecast: 17.1, lowerConfidence: 15.1, upperConfidence: 19.1, dayOfWeek: 'Fri', fullDate: 'Oct 09, 2026', statusLabel: 'Projected Santa Ana Wind Surge' },
    { date: '10/12', forecast: 16.7, lowerConfidence: 14.8, upperConfidence: 18.6, dayOfWeek: 'Mon', fullDate: 'Oct 12, 2026', statusLabel: 'CP-SAT Model Baseline Horizon' },
    { date: '10/15', forecast: 16.1, lowerConfidence: 14.2, upperConfidence: 18.0, dayOfWeek: 'Thu', fullDate: 'Oct 15, 2026', statusLabel: 'CP-SAT Model Baseline Horizon' },
    { date: '10/18', forecast: 15.7, lowerConfidence: 13.8, upperConfidence: 17.6, dayOfWeek: 'Sun', fullDate: 'Oct 18, 2026', statusLabel: 'CP-SAT Model Baseline Horizon' },
    { date: '10/21', forecast: 15.3, lowerConfidence: 13.4, upperConfidence: 17.2, dayOfWeek: 'Wed', fullDate: 'Oct 21, 2026', statusLabel: 'Fleet Sustainment Stabilization' },
    { date: '10/24', forecast: 15.0, lowerConfidence: 13.1, upperConfidence: 16.9, dayOfWeek: 'Sat', fullDate: 'Oct 24, 2026', statusLabel: 'Pre-Winter Front Taper' },
    { date: '10/28', forecast: 14.8, lowerConfidence: 12.8, upperConfidence: 16.8, dayOfWeek: 'Wed', fullDate: 'Oct 28, 2026', statusLabel: 'Optimized Turnaround Floor' },
  ], []);

  // Compute dynamic Recharts data series with confidence bands and CP-SAT scenario formulas
  const rechartsData = useMemo(() => {
    return rawDataPoints.map((pt) => {
      let confidenceBand: [number, number] | undefined = undefined;
      let scenarioProjected: number | undefined = undefined;

      if (pt.forecast !== undefined) {
        const scenarioFactor = (1 - slaTargetReduction / 100) * (incidentSurgeFactor > 1.2 ? 1.07 : 0.98) * (100 / preventativeMaintBuffer);
        scenarioProjected = +(pt.forecast * scenarioFactor).toFixed(1);
        confidenceBand = [pt.lowerConfidence || 13, pt.upperConfidence || 18];
      }

      if (pt.date === '09/28') {
        scenarioProjected = pt.actual;
      }

      const visibleAnomaly = isAnomalyMatchingFilter(pt.anomaly) ? pt.anomaly : undefined;

      return {
        date: pt.date,
        actual: pt.actual,
        forecast: pt.forecast,
        scenarioProjected,
        confidenceBand,
        lowerConfidence: pt.lowerConfidence,
        upperConfidence: pt.upperConfidence,
        dayOfWeek: pt.dayOfWeek,
        fullDate: pt.fullDate,
        sortiesFlown: pt.sortiesFlown,
        activeAirframes: pt.activeAirframes,
        retardantDeliveredGal: pt.retardantDeliveredGal,
        weatherSummary: pt.weatherSummary,
        zScore: pt.zScore,
        statusLabel: pt.statusLabel,
        primaryBase: pt.primaryBase,
        baselineMargin: pt.baselineMargin,
        anomaly: visibleAnomaly,
      };
    });
  }, [rawDataPoints, slaTargetReduction, incidentSurgeFactor, preventativeMaintBuffer, anomalyFilter]);

  // Set default selected anomaly and default map asset
  useEffect(() => {
    if (!selectedAnomaly) {
      const firstCrit = rawDataPoints.find(p => p.anomaly?.severity === 'critical')?.anomaly;
      if (firstCrit) setSelectedAnomaly(firstCrit);
    }
    if (!selectedAsset) {
      setSelectedAsset(mapAssets[0]);
    }
  }, [rawDataPoints, mapAssets, selectedAnomaly, selectedAsset]);

  // Trigger Gemini AI Ultron Directive
  const handleEngageUltronAi = async () => {
    setIsAiGenerating(true);
    playTacticalBeep(980, 'sawtooth', 0.15);
    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `ACTIVATE OSIRIS AI DEFENSE PROTOCOL (War Room Intelligence):
Operational Parameters:
- Active Defense Layers: [sdk_air, sdk_naval, maritime, satellites, global_incidents, earthquakes, cctv, cables]
- SLA Target Reduction: ${slaTargetReduction}%
- Wildfire Surge Factor: ${incidentSurgeFactor}x
- Fleet Sustainment Health: ${preventativeMaintBuffer}%
- Assets Under Surveillance: Tanker 80, C-130H, Sentinel-2A, USCG Stratton, Shasta Fire Complex.
Produce a high-tempo, futuristic OSIRIS AI war room situational briefing with 3 numbered directives:
1. Geospatial Threat Assessment
2. Predictive CP-SAT Aviation Vector Commitments
3. Infrastructure & Anomaly Elimination.`,
          mode: 'sql',
        }),
      });
      const data = await res.json();
      setAiAnalysisResult(data.explanation || 'OSIRIS PROTOCOL 11 ACTIVE: Multispectral satellite telemetry from Sentinel-2A detects 15% acceleration in Shasta Ridge thermal boundary. 1. Reroute Tanker 80 to drop 1,200 gallons retardant barrier along sector Bravo. 2. C-130H quarantine inspection cleared; auxiliary ground booster engaged. 3. Zero trans-Pacific subsea fiber packet loss recorded at Unity landing station.');
    } catch {
      setAiAnalysisResult('OSIRIS WAR ROOM DEFENSE DIRECTIVE: 1. Aerial wildfire perimeter contained via CP-SAT dynamic air tanker vectoring. 2. Maritime choke points in San Pedro Channel reporting nominal AIS clearance. 3. Seismic and satellite feeds indicate stable Pacific rim operations.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Handler for completing an Anomaly Resolution & Root-Cause Analysis
  const handleResolveAnomaly = (resolution: AnomalyResolutionData) => {
    setResolvedAnomalies((prev) => ({
      ...prev,
      [resolution.anomalyId]: resolution,
    }));
    playTacticalBeep(1800, 'sine', 0.15);
    if (onAddActivityLog) {
      onAddActivityLog({
        id: `act-${Date.now()}`,
        timestamp: resolution.resolvedAt,
        user: resolution.resolvedBy,
        action: `[RCA RESOLVED] Nicholas Marnocha resolved ${resolution.anomalyId} on ${resolution.airframe}: ${resolution.selectedFixLabel}. RCA: "${resolution.rcaNote.slice(0, 60)}..."`,
        category: 'Predictive BI',
      });
    }
  };

  // Custom Futuristic Recharts Dot for Anomalies and Historical Actuals
  const renderCustomizedDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;

    const isHovered = hoveredChartDotDate === payload.date;

    if (payload.anomaly) {
      const isSelected = selectedAnomaly && selectedAnomaly.id === payload.anomaly.id;
      const isResolved = !!resolvedAnomalies[payload.anomaly.id];
      const severityColor = payload.anomaly.severity === 'critical' ? '#ef4444' : payload.anomaly.severity === 'high' ? '#f97316' : '#eab308';
      
      return (
        <g 
          key={`dot-${payload.date}`} 
          className="cursor-pointer group"
          onMouseEnter={() => {
            setHoveredChartDotDate(payload.date);
            setHoveredAnomalyMarker(payload.anomaly);
            playTacticalBeep(1100, 'sine', 0.03);
          }}
          onMouseLeave={() => {
            setHoveredChartDotDate(null);
            setHoveredAnomalyMarker(null);
          }}
          onClick={() => {
            setSelectedAnomaly(payload.anomaly);
            setTargetAnomalyForResolution(payload.anomaly);
            setIsResolutionModalOpen(true);
            playTacticalBeep(1400, 'sawtooth', 0.12);
          }}
        >
          {/* Outer pulsing radar reticle ring when hovered or selected */}
          {(isHovered || isSelected) && (
            <circle
              cx={cx}
              cy={cy}
              r={18}
              fill="none"
              stroke={isResolved ? '#10b981' : severityColor}
              strokeWidth={1.5}
              strokeDasharray="4 2"
              className="animate-spin"
              style={{ transformOrigin: `${cx}px ${cy}px`, animationDuration: '4s' }}
            />
          )}

          {/* Primary Target Bracket Ring */}
          <circle
            cx={cx}
            cy={cy}
            r={isSelected ? 14 : isHovered ? 12 : 9}
            fill={isHovered ? 'rgba(239, 68, 68, 0.15)' : 'none'}
            stroke={isResolved ? '#10b981' : severityColor}
            strokeWidth={isHovered ? 2 : 1.5}
            strokeDasharray={isResolved ? 'none' : '3 3'}
            className={isResolved ? '' : 'animate-spin'}
            style={{ transformOrigin: `${cx}px ${cy}px`, animationDuration: '6s' }}
          />

          {/* Tactical Crosshairs */}
          <line x1={cx - 12} y1={cy} x2={cx + 12} y2={cy} stroke={isResolved ? '#10b981' : severityColor} strokeWidth={isHovered ? 1.5 : 0.8} opacity={isHovered ? 1 : 0.75} />
          <line x1={cx} y1={cy - 12} x2={cx} y2={cy + 12} stroke={isResolved ? '#10b981' : severityColor} strokeWidth={isHovered ? 1.5 : 0.8} opacity={isHovered ? 1 : 0.75} />

          {/* Anomaly Core Beacon */}
          <circle
            cx={cx}
            cy={cy}
            r={isHovered ? 6 : 4.5}
            fill={isResolved ? '#059669' : severityColor}
            stroke="#ffffff"
            strokeWidth={1.5}
            className="animate-pulse"
          />

          {/* Hover Callout Label Badge in SVG */}
          {isHovered && (
            <g transform={`translate(${cx},${cy - 22})`}>
              <rect
                x={-45}
                y={-14}
                width={90}
                height={16}
                rx={4}
                fill="#020617"
                stroke={isResolved ? '#10b981' : severityColor}
                strokeWidth={1}
                opacity={0.95}
              />
              <text
                x={0}
                y={-3}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={9}
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
              >
                {payload.anomaly.id}
              </text>
            </g>
          )}

          <title>{`[ANOMALY MARKER: ${payload.anomaly.id}] ${payload.anomaly.title} (${isResolved ? 'RESOLVED' : 'CLICK TO RESOLVE'})`}</title>
        </g>
      );
    }

    // Nominal Historical Data Point Dot
    return (
      <g
        key={`dot-${payload.date}`}
        className="cursor-pointer"
        onMouseEnter={() => {
          setHoveredChartDotDate(payload.date);
          playTacticalBeep(920, 'sine', 0.02);
        }}
        onMouseLeave={() => {
          setHoveredChartDotDate(null);
        }}
      >
        {isHovered && (
          <circle
            cx={cx}
            cy={cy}
            r={9}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={1.5}
            strokeDasharray="2 2"
            className="animate-spin"
            style={{ transformOrigin: `${cx}px ${cy}px`, animationDuration: '3s' }}
          />
        )}
        <circle
          cx={cx}
          cy={cy}
          r={isHovered ? 5.5 : 3.5}
          fill={isHovered ? '#38bdf8' : '#06b6d4'}
          stroke={isHovered ? '#ffffff' : '#083344'}
          strokeWidth={isHovered ? 2 : 1.5}
        />
      </g>
    );
  };

  // Custom Futuristic War Room Tooltip for Recharts displaying specific historical data & anomaly markers
  const CustomWarRoomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const hasAnomaly = !!data.anomaly;
    const isHistorical = data.actual !== undefined;
    const isForecast = data.forecast !== undefined;
    const resolvedData = hasAnomaly ? resolvedAnomalies[data.anomaly.id] : null;
    const isResolved = !!resolvedData;
    const isCeilingBreached = isHistorical && data.actual > 20.0;

    return (
      <div className="bg-slate-950/98 backdrop-blur-md border border-cyan-500/80 rounded-xl p-4 shadow-2xl shadow-cyan-950/80 text-xs font-mono text-white min-w-[280px] max-w-[360px] space-y-3 z-50 pointer-events-none">
        
        {/* Header: Date + Source Identification */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <div>
              <span className="text-cyan-300 font-bold tracking-wider">
                {data.fullDate || `DATE // ${label}`}
              </span>
              {data.dayOfWeek && (
                <span className="ml-1 text-[10px] text-slate-400">({data.dayOfWeek})</span>
              )}
            </div>
          </div>

          {hasAnomaly ? (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border flex items-center gap-1 ${
              isResolved 
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' 
                : 'bg-red-950/90 border-red-500 text-red-300 animate-pulse'
            }`}>
              <ShieldAlert className="w-3 h-3 shrink-0" />
              <span>{isResolved ? 'RESOLVED' : `${data.anomaly.severity.toUpperCase()} ANOMALY`}</span>
            </span>
          ) : isHistorical ? (
            <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/80 text-[10px] text-cyan-300 font-medium">
              HISTORICAL LOG
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-[10px] text-emerald-300 font-medium">
              CP-SAT FORECAST
            </span>
          )}
        </div>

        {/* Section 1: Specific Historical Data Points (When Historical Sample Hovered) */}
        {isHistorical && (
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              <span>Historical Turnaround Telemetry</span>
              <span className="text-amber-400 text-[9px] font-mono">SIMULATED SCENARIO</span>
            </div>

            {/* Actual Turnaround Metric with Target Comparison */}
            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isCeilingBreached ? 'bg-red-400 animate-pulse' : 'bg-cyan-400'}`} />
                <span>Observed Turnaround:</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`font-bold font-mono tabular-nums text-sm ${isCeilingBreached ? 'text-red-400' : 'text-cyan-300'}`}>
                  {data.actual} min
                </span>
                <span className={`text-[10px] px-1 py-0.2 rounded border font-semibold ${
                  isCeilingBreached 
                    ? 'bg-red-950/60 border-red-600 text-red-300' 
                    : data.actual <= 17.0 
                    ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300' 
                    : 'bg-cyan-950/60 border-cyan-700 text-cyan-300'
                }`}>
                  {data.actual <= 20.0 ? `-${(20.0 - data.actual).toFixed(1)}m under target` : `+${(data.actual - 20.0).toFixed(1)}m over target`}
                </span>
              </div>
            </div>

            {/* Target Reference & Z-Score Bar */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              <div>
                <span className="text-slate-500 block">SCENARIO TARGET (SLA):</span>
                <span className="font-bold text-slate-200">20.0 min target*</span>
              </div>
              <div>
                <span className="text-slate-500 block">VARIANCE Z-SCORE:</span>
                <span className={`font-bold ${data.zScore && data.zScore > 2.0 ? 'text-red-400' : 'text-slate-200'}`}>
                  {data.zScore !== undefined ? (data.zScore > 0 ? `+${data.zScore}σ` : `${data.zScore}σ`) : '0.0σ'}
                </span>
              </div>
            </div>

            <div className="text-[9px] text-slate-500 italic pt-1 border-t border-slate-800/60 leading-tight">
              *Configurable scenario target based on CAL FIRE 20m Initial Attack response time objective; not a universal pit turnaround mandate.
            </div>

            {/* Operational Metrics: Sorties, Fuel/Slurry & Dispatch Base */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
              <div>
                <span className="text-slate-500 block">SORTIES COMPLETED:</span>
                <span className="text-white font-bold">{data.sortiesFlown || 24} missions</span>
              </div>
              <div>
                <span className="text-slate-500 block">RETARDANT DELIVERED:</span>
                <span className="text-amber-300 font-bold">{(data.retardantDeliveredGal || 28800).toLocaleString()} Gal</span>
              </div>
            </div>

            {/* Operational Base & Weather */}
            {data.primaryBase && (
              <div className="text-[10px] pt-1 border-t border-slate-800/80">
                <span className="text-slate-500 block">STATIONED COMMAND BASE:</span>
                <span className="text-cyan-300 font-medium">{data.primaryBase}</span>
              </div>
            )}

            {data.weatherSummary && (
              <div className="text-[10px] text-slate-400">
                <span className="text-slate-500 block">LOCAL WEATHER TELEMETRY:</span>
                <span className="text-slate-300">{data.weatherSummary}</span>
              </div>
            )}

            {/* Airframes on Mission */}
            {data.activeAirframes && data.activeAirframes.length > 0 && (
              <div className="pt-1 border-t border-slate-800/80">
                <span className="text-[9px] text-slate-500 uppercase block mb-1">Deployed Fleet Callout:</span>
                <div className="flex flex-wrap gap-1">
                  {data.activeAirframes.map((airframe: string, idx: number) => (
                    <span key={idx} className="px-1.5 py-0.2 rounded text-[9px] bg-slate-950 border border-slate-800 text-cyan-200 font-mono">
                      {airframe}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 2: Predictive Forecast Horizon Data Points (When Forecast Hovered) */}
        {isForecast && (
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">
              <span>Predictive CP-SAT Horizon</span>
              <span className="text-emerald-400 text-[9px]">Google OR-Tools</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Base Forecast:</span>
              </span>
              <span className="font-bold text-slate-300 font-mono tabular-nums">{data.forecast} min</span>
            </div>

            {data.scenarioProjected !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>CP-SAT Scenario Projection:</span>
                </span>
                <span className="font-bold text-emerald-300 font-mono tabular-nums">{data.scenarioProjected} min</span>
              </div>
            )}

            {data.lowerConfidence !== undefined && (
              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-0.5">
                <span>95% Confidence Band:</span>
                <span className="font-mono tabular-nums text-slate-300">[{data.lowerConfidence}m - {data.upperConfidence}m]</span>
              </div>
            )}

            {data.statusLabel && (
              <div className="text-[10px] text-emerald-400/90 pt-1 border-t border-slate-800/80">
                Mode: <strong className="text-white">{data.statusLabel}</strong>
              </div>
            )}
          </div>
        )}

        {/* Section 3: Anomaly Marker Inspection Card upon Hover */}
        {hasAnomaly && (
          <div className={`p-3 rounded-xl border space-y-2 transition-all ${
            isResolved 
              ? 'bg-emerald-950/30 border-emerald-700/60' 
              : 'bg-red-950/40 border-red-600/80 shadow-lg shadow-red-950/50'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase pb-1 border-b border-red-900/50">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className={isResolved ? 'text-emerald-300' : 'text-red-400'}>
                  ANOMALY MARKER // {data.anomaly.id}
                </span>
              </div>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                data.anomaly.severity === 'critical' ? 'bg-red-900 text-white' : 'bg-amber-900 text-amber-200'
              }`}>
                {data.anomaly.severity.toUpperCase()}
              </span>
            </div>

            <div className="text-white font-bold text-[11px] leading-tight">
              {data.anomaly.title}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/60 p-2 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block">ASSET / AIRFRAME:</span>
                <span className="text-cyan-300 font-bold">{data.anomaly.airframe}</span>
              </div>
              <div>
                <span className="text-slate-500 block">BASE SECTOR:</span>
                <span className="text-slate-200">{data.anomaly.base}</span>
              </div>
              <div>
                <span className="text-slate-500 block">OBSERVED VALUE:</span>
                <span className="text-red-400 font-bold">{data.anomaly.value} min</span>
              </div>
              <div>
                <span className="text-slate-500 block">SCENARIO TARGET:</span>
                <span className="text-slate-400">{data.anomaly.expectedLimit} min</span>
              </div>
            </div>

            <div className="text-[10px] text-red-200/90 leading-relaxed bg-red-950/50 p-2 rounded border border-red-900/40">
              <span className="text-red-400 font-bold block mb-0.5">DIAGNOSED ROOT CAUSE:</span>
              {data.anomaly.rootCause}
            </div>

            <div className="text-[10px] text-emerald-200/90 leading-relaxed bg-emerald-950/30 p-2 rounded border border-emerald-900/40">
              <span className="text-emerald-400 font-bold block mb-0.5">TACTICAL MITIGATION:</span>
              {data.anomaly.mitigation}
            </div>

            <div className="pt-1.5 border-t border-red-900/40 flex items-center justify-between text-[10px] font-mono">
              {isResolved ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>RESOLVED · {resolvedData.selectedFixLabel}</span>
                </span>
              ) : (
                <span className="text-amber-300 font-semibold flex items-center gap-1 animate-pulse">
                  <span>› CLICK MARKER DOT TO OPEN RCA &amp; RESOLUTION</span>
                </span>
              )}
            </div>
          </div>
        )}

      </div>
    );
  };

  // Convert real geographic lat/lng to normalized SVG map coordinates
  // Bounding box for Western US / Pacific Rim corridor:
  // Lat: 30° to 45°N, Lng: -130° to -114°W
  const projectGeoToSvg = (lat: number, lng: number, width: number, height: number) => {
    const minLat = 30.0;
    const maxLat = 44.0;
    const minLng = -128.0;
    const maxLng = -114.0;

    const x = ((lng - minLng) / (maxLng - minLng)) * width;
    const y = ((maxLat - lat) / (maxLat - minLat)) * height;
    return {
      x: Math.max(20, Math.min(width - 20, x)),
      y: Math.max(20, Math.min(height - 20, y)),
    };
  };

  const anomalyCount = rawDataPoints.filter(p => p.anomaly).length;

  return (
    <div className="space-y-6">
      
      {/* OSIRIS AI TOP WAR ROOM COMMAND HEADER */}
      <div className="relative overflow-hidden rounded-xl border border-cyan-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-cyan-950/40">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f49_1px,transparent_1px),linear-gradient(to_bottom,#082f49_1px,transparent_1px)] bg-[size:28px_28px] opacity-35 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 text-xs font-mono tracking-widest text-cyan-400 mb-1.5 uppercase">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>OSIRIS AI // GLOBAL INTELLIGENCE & WAR ROOM CONSOLE</span>
              </span>
              <span className="text-slate-600">/</span>
              <span className="text-blue-400">PACIFIC THEATER: ACTIVE</span>
              <span className="text-slate-600">/</span>
              <span className="text-amber-400">{visibleMapAssets.length} ASSETS TRACKED</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3 font-mono">
              <span>PREDICTIVE FLIGHT DYNAMICS & OSIRIS RECON MATRIX</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed font-mono">
              Multi-domain situational awareness dashboard modeled on OSIRIS tactical air operations. Integrates simulated ADS-B transponder telemetry, satellite passes, maritime traffic, seismic sensors, and CCTV optics with Recharts predictive turnaround metrics.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-800/80 flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>DEMO SCENARIO · SYNTHETIC TELEMETRY</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Data Provenance: Calibrated synthetic operational scenario benchmark. Not a live CAD/AVL feed. Turnaround targets configured for dispatch simulation (CAL FIRE Initial Attack goal is 20m response travel time).
              </span>
            </div>
          </div>

          {/* View Mode & Controls */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg">
              <button
                onClick={() => setViewMode('tactical_radar')}
                className={`px-3 py-1.5 text-xs font-mono rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'tactical_radar' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50 shadow-sm shadow-cyan-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>Tactical Radar (Full CA)</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 text-xs font-mono rounded transition-colors cursor-pointer ${
                  viewMode === 'split' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                Split Tactical View
              </button>
              <button
                onClick={() => setViewMode('geospatial')}
                className={`px-3 py-1.5 text-xs font-mono rounded transition-colors cursor-pointer ${
                  viewMode === 'geospatial' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                OSIRIS Multi-Domain Map
              </button>
              <button
                onClick={() => setViewMode('metrics')}
                className={`px-3 py-1.5 text-xs font-mono rounded transition-colors cursor-pointer ${
                  viewMode === 'metrics' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                Recharts SLA Matrix
              </button>
              <button
                onClick={() => setViewMode('base_allocation')}
                className={`px-3 py-1.5 text-xs font-mono rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'base_allocation' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50 shadow-sm shadow-cyan-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Warehouse className="w-3.5 h-3.5 text-cyan-400" />
                <span>Base Allocation (Bar Chart)</span>
              </button>
              <button
                onClick={() => setViewMode('heatmap')}
                className={`px-3 py-1.5 text-xs font-mono rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'heatmap' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50 shadow-sm shadow-cyan-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Resource Heat-Map</span>
              </button>
              <button
                onClick={() => setViewMode('forecasting')}
                className={`px-3 py-1.5 text-xs font-mono rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'forecasting' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50 shadow-sm shadow-cyan-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>7-Day Capacity Forecast</span>
              </button>
              <button
                onClick={() => setViewMode('user_activity')}
                className={`px-3 py-1.5 text-xs font-mono rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'user_activity' ? 'bg-orange-500/20 text-orange-300 font-bold border border-orange-500/50 shadow-sm shadow-orange-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                <span>Peak Hours Matrix (24/7)</span>
              </button>
            </div>

            {/* Quick Toggle Base Allocation Section Button */}
            <button
              onClick={() => setShowBaseAllocationSection(!showBaseAllocationSection)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                showBaseAllocationSection
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-950'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
              title="Toggle Real-Time Operational Base Resource Allocation Bar Chart Section"
            >
              <BarChart3 className={`w-3.5 h-3.5 ${showBaseAllocationSection ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{showBaseAllocationSection ? 'BASE BARS ON' : 'SHOW BASE BARS'}</span>
            </button>

            {/* Quick Toggle Forecast Widget Button */}
            <button
              onClick={() => setShowForecastWidget(!showForecastWidget)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                showForecastWidget
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-950'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
              title="Toggle 7-Day Resource Capacity Forecasting Widget"
            >
              <TrendingUp className={`w-3.5 h-3.5 ${showForecastWidget ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{showForecastWidget ? 'FORECAST ON' : 'SHOW FORECAST'}</span>
            </button>

            {/* Quick Toggle Heat-Map Overlay Button */}
            <button
              onClick={() => setShowHeatmapOverlay(!showHeatmapOverlay)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                showHeatmapOverlay
                  ? 'bg-orange-950/80 border-orange-500 text-orange-300 shadow-sm shadow-orange-950'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
              title="Toggle Live Module Resource Density Heat-Map Overlay"
            >
              <Flame className={`w-3.5 h-3.5 ${showHeatmapOverlay ? 'text-orange-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{showHeatmapOverlay ? 'HEAT-MAP ON' : 'HEAT-MAP OVERLAY'}</span>
            </button>

            {/* Quick Toggle 24/7 User Activity Matrix */}
            <button
              onClick={() => setShowActivityHeatmap(!showActivityHeatmap)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                showActivityHeatmap
                  ? 'bg-orange-950/80 border-orange-500 text-orange-300 shadow-sm shadow-orange-950'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
              title="Toggle 7-Day / 24-Hour User Interaction Intensity Heatmap"
            >
              <Calendar className={`w-3.5 h-3.5 ${showActivityHeatmap ? 'text-orange-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{showActivityHeatmap ? 'PEAK HOURS ON' : 'PEAK HOURS MATRIX'}</span>
            </button>

            {/* Custom Alert Thresholds Config Button */}
            <button
              onClick={() => {
                setIsAlertConfigOpen(true);
                playTacticalBeep(920, 'sine', 0.05);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/50 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-xs font-mono transition-all cursor-pointer shadow-sm hover:border-cyan-400"
              title="Configure Custom Telemetry Stream Thresholds & Browser Notifications"
            >
              <Bell className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>ALERT RULES</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playTacticalBeep(soundEnabled ? 440 : 880, 'sine', 0.1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-900' 
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle War Room Audio Synthesizer"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'HUD AUDIO' : 'MUTED'}</span>
            </button>

            {/* AI Directive Button */}
            <button
              onClick={handleEngageUltronAi}
              disabled={isAiGenerating}
              className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 rounded-lg shadow-lg shadow-cyan-950/60 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <Crosshair className={`w-4 h-4 ${isAiGenerating ? 'animate-spin' : ''}`} />
              <span>{isAiGenerating ? 'COMPUTING...' : 'ENGAGE OSIRIS AI'}</span>
            </button>
          </div>
        </div>

        {/* AI Directive Execution Box */}
        {aiAnalysisResult && (
          <div className="relative z-10 mt-5 p-4 rounded-lg bg-cyan-950/40 border border-cyan-500/60 text-xs font-mono text-cyan-200 flex items-start gap-3 shadow-inner">
            <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <span className="font-bold text-cyan-300 tracking-wider">OSIRIS TACTICAL DIRECTIVE EXECUTION:</span>
              <p className="text-slate-200 leading-relaxed whitespace-pre-line">{aiAnalysisResult}</p>
            </div>
          </div>
        )}
      </div>

      {/* Central ActivityLog Status Ribbon & Live Resolution Ticker */}
      <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold uppercase shrink-0">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>CENTRAL ACTIVITY LOG</span>
          </div>

          <div className="text-slate-300 truncate text-[11px]">
            {activityLogs.length > 0 ? (
              <span>
                <strong className="text-white">{activityLogs[0].user}:</strong> {activityLogs[0].action}{' '}
                <span className="text-slate-500">({activityLogs[0].timestamp})</span>
              </span>
            ) : (
              <span className="text-slate-400 italic">
                Operational telemetry synchronized. Zero unmitigated critical faults. Click any anomaly to resolve.
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {Object.keys(resolvedAnomalies).length > 0 && (
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{Object.keys(resolvedAnomalies).length} RESOLVED</span>
            </span>
          )}

          <button
            onClick={() => setIsActivityDrawerOpen(!isActivityDrawerOpen)}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-[10px] font-semibold"
          >
            {isActivityDrawerOpen ? 'Hide Log Stream' : `Activity Logs (${activityLogs.length})`}
          </button>
        </div>
      </div>

      {/* Expandable Activity Log Stream */}
      {isActivityDrawerOpen && (
        <div className="p-4 rounded-xl bg-slate-950 border border-cyan-900/40 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Central Audit & ActivityLog Stream</span>
            </span>
            <span className="text-[10px] text-slate-400">Broadcasts across all connected workstations</span>
          </div>
          <div className="max-h-44 overflow-y-auto space-y-1.5 font-mono text-[11px]">
            {activityLogs.map((log) => (
              <div key={log.id} className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">{log.user}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-400 uppercase font-mono">{log.category}</span>
                  </div>
                  <p className="text-slate-300">{log.action}</p>
                </div>
                <span className="text-slate-500 text-[10px] shrink-0 font-mono">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OSIRIS AI LAYER CONTROLLER TOOLBAR (Matches the user URL layers directly) */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[780px] gap-2 text-xs font-mono">
          <span className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 mr-2">
            <Layers className="w-3.5 h-3.5" />
            <span>OSIRIS LAYERS:</span>
          </span>

          <div className="flex items-center gap-1.5 flex-1">
            {[
              { id: 'sdk_air', label: 'Air Telemetry (ADS-B)' },
              { id: 'sdk_naval', label: 'Naval Defense' },
              { id: 'maritime', label: 'Maritime (AIS)' },
              { id: 'satellites', label: 'Satellites (N2YO)' },
              { id: 'global_incidents', label: 'Wildfires / FIRMS' },
              { id: 'earthquakes', label: 'Quakes (USGS)' },
              { id: 'cctv', label: 'CCTV Feeds' },
              { id: 'cctv_previews', label: 'CCTV Previews' },
              { id: 'cables', label: 'Subsea Cables' },
              { id: 'day_night', label: 'Day / Night' },
              { id: 'live_news', label: 'SIGINT News' },
            ].map((layer) => {
              const active = activeLayers[layer.id as OsirisLayerId];
              return (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id as OsirisLayerId)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all cursor-pointer whitespace-nowrap border ${
                    active
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-950'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${active ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                  {layer.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SIGINT LIVE NEWS TICKER (When live_news layer active) */}
      {activeLayers.live_news && (
        <div className="bg-slate-950/80 border border-cyan-900/60 rounded-xl px-4 py-2 flex items-center gap-3 overflow-hidden text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-red-950 border border-red-500 text-[10px] text-red-300 font-bold uppercase shrink-0 flex items-center gap-1">
            <Radio className="w-3 h-3 text-red-400 animate-pulse" />
            <span>SIGINT STREAM</span>
          </span>
          <div className="flex-1 overflow-x-auto whitespace-nowrap text-slate-300 flex items-center gap-6 text-[11px]">
            <span><strong>CAL FIRE:</strong> Shasta Complex Fire expanded to 4,820 acres; Tanker 80 committed for retardant drops.</span>
            <span className="text-slate-600">|</span>
            <span><strong>USGS:</strong> M4.2 seismic shockwave detected off Cape Mendocino; zero pipeline disruption.</span>
            <span className="text-slate-600">|</span>
            <span><strong>ORBITAL:</strong> Sentinel-2A satellite pass over Northern California sector commencing in 18 mins.</span>
            <span className="text-slate-600">|</span>
            <span><strong>SUBSEA:</strong> Unity trans-Pacific fiber optic cable operating at 96 Tbps nominal capacity.</span>
          </div>
        </div>
      )}

      {/* LIVE RESOURCE FEED (Scrolling real-time ticker of active CAL FIRE resource dispatches) */}
      <LiveResourceFeed 
        onSelectResource={(id) => {
          const found = mapAssets.find((a) => a.callsign === id || a.id === id || a.name.includes(id));
          if (found) {
            setSelectedAsset(found);
            playTacticalBeep(920, 'sine', 0.05);
          }
        }}
        soundEnabled={soundEnabled}
      />

      {/* REAL-TIME RESOURCE UTILIZATION DENSITY HEAT-MAP (Overlay or Dedicated View) */}
      {(showHeatmapOverlay || viewMode === 'heatmap') && (
        <div className="w-full mb-6 animate-in fade-in duration-200">
          <ResourceUtilizationHeatmap
            isOverlay={showHeatmapOverlay}
            onClose={showHeatmapOverlay ? () => setShowHeatmapOverlay(false) : undefined}
          />
        </div>
      )}

      {/* RESOURCE CAPACITY FORECASTING WIDGET (Next 7-Day Projections) */}
      {(showForecastWidget || viewMode === 'forecasting') && (
        <div className="w-full mb-6 animate-in fade-in duration-200">
          <ResourceCapacityForecastingWidget
            onTriggerScalingRecommendation={(nodes) => {
              playTacticalBeep(900, 'sine', 0.08);
              onAddActivityLog?.({
                id: `log-scale-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                user: 'Nicholas Marnocha (Lead)',
                action: `Pre-provisioned cluster autoscaler to ${nodes} worker node replicas for projected peak`,
                category: 'Autoscaling',
              });
            }}
          />
        </div>
      )}

      {/* 24/7 HOURLY USER INTERACTION INTENSITY & OPERATIONAL PEAK HEATMAP */}
      {(showActivityHeatmap || viewMode === 'user_activity') && (
        <div className="w-full mb-6 animate-in fade-in duration-200">
          <UserActivityHeatmap
            onSelectTimeSlot={(slot) => {
              playTacticalBeep(slot.isPeak ? 1150 : 840, 'sine', 0.05);
            }}
          />
        </div>
      )}

      {/* 1. PRIMARY FLAGSHIP VIEW: TACTICAL RADAR (ALL CA WILDFIRE & MILITARY OPS) */}
      {viewMode === 'tactical_radar' && (
        <div className="w-full mb-6">
          <TacticalRadar />
        </div>
      )}

      {/* 2. OPERATIONAL BASES RESOURCE ALLOCATION BAR CHART (FLAGSHIP FULL VIEW) */}
      {viewMode === 'base_allocation' && (
        <div className="w-full mb-6 animate-in fade-in duration-200">
          <BaseResourceAllocationBarChart
            onSelectBase={(base) => {
              playTacticalBeep(940, 'triangle', 0.08);
              onAddActivityLog?.({
                id: `base-select-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                user: 'Nicholas Marnocha (Lead)',
                action: `Inspected Operational Base: ${base.name} (${base.code}) · Region: ${base.region} · Pits: ${base.activePitsOccupied}/${base.loadingPits} · Mix: ${(base.currentMixGal/1000).toFixed(0)}k Gal`,
                category: 'Base Logistics',
              });
            }}
            onAddActivityLog={onAddActivityLog}
            onPlayBeep={playTacticalBeep}
          />
        </div>
      )}

      {/* MAIN VIEWPORT: SPLIT OR FULLSCREEN MODE */}
      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        
        {/* LEFT / TOP: OSIRIS GEOSPATIAL INTELLIGENCE MAP */}
        {(viewMode === 'split' || viewMode === 'geospatial') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-7' : 'w-full'} bg-slate-950 border border-cyan-900/50 rounded-xl p-5 relative overflow-hidden shadow-2xl`}>
            
            {/* Map Header */}
            <div className="flex flex-col gap-2 pb-3 border-b border-slate-900 mb-3 text-xs font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-white font-bold uppercase tracking-wider">
                    OSIRIS TACTICAL RADAR: PACIFIC WILDFIRE & DEFENSE CORRIDOR
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span>GRID: 37.8°N / 122.4°W</span>
                  <span className="text-cyan-400 font-bold">{visibleMapAssets.length} Active Targets</span>
                </div>
              </div>

              {/* Pacific Wildfire Resources Triage Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-black/60 border border-slate-800 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  <span className="font-bold text-slate-300">WILDFIRE RADAR FILTER:</span>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto">
                  {[
                    { id: 'all', label: 'All Targets', badge: '20' },
                    { id: 'wildfire_all', label: '🔥 All Wildfire Ops', badge: '16' },
                    { id: 'tankers', label: '✈️ Air Tankers', badge: '5' },
                    { id: 'helicopters', label: '🚁 Helicopters', badge: '4' },
                    { id: 'wildfires', label: '🌋 Wildfires', badge: '5' },
                    { id: 'recon', label: '🎯 Lead & Recon', badge: '2' },
                  ].map((btn) => {
                    const isSelected = radarResourceFilter === btn.id;
                    return (
                      <button
                        key={btn.id}
                        onClick={() => {
                          setRadarResourceFilter(btn.id as any);
                          playTacticalBeep(btn.id === 'wildfires' ? 1100 : 780, 'sine', 0.04);
                        }}
                        className={`px-2 py-0.5 rounded transition-all cursor-pointer whitespace-nowrap border ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-sm shadow-cyan-950'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{btn.label}</span>
                        <span className="ml-1 opacity-60">({btn.badge})</span>
                      </button>
                    );
                  })}
                </div>
                {/* Futuristic Radar Controls: Display Matrix Theme, Sweep Speed, and Vectors */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-bold uppercase">DISPLAY MATRIX:</span>
                    <button
                      onClick={() => {
                        setRadarColorTheme('cyan');
                        playTacticalBeep(880, 'sine', 0.04);
                      }}
                      className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        radarColorTheme === 'cyan'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-sm shadow-cyan-950'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      X-BAND CYAN
                    </button>
                    <button
                      onClick={() => {
                        setRadarColorTheme('flir');
                        playTacticalBeep(980, 'sine', 0.04);
                      }}
                      className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        radarColorTheme === 'flir'
                          ? 'bg-orange-500/20 border-orange-400 text-orange-300 font-bold shadow-sm shadow-orange-950'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      FLIR THERMAL
                    </button>
                    <button
                      onClick={() => {
                        setRadarColorTheme('nvg');
                        playTacticalBeep(1100, 'sine', 0.04);
                      }}
                      className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        radarColorTheme === 'nvg'
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-sm shadow-emerald-950'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      NVG PHOSPHOR
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-bold uppercase">PHASED ARRAY SWEEP:</span>
                    <button
                      onClick={() => {
                        setRadarSweepSpeed('normal');
                        playTacticalBeep(750, 'sine', 0.03);
                      }}
                      className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        radarSweepSpeed === 'normal'
                          ? 'bg-slate-800 border-slate-600 text-white font-bold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      6s SCAN
                    </button>
                    <button
                      onClick={() => {
                        setRadarSweepSpeed('fast');
                        playTacticalBeep(1150, 'triangle', 0.05);
                      }}
                      className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        radarSweepSpeed === 'fast'
                          ? 'bg-slate-800 border-slate-600 text-cyan-300 font-bold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      2.5s COMBAT
                    </button>
                    <button
                      onClick={() => {
                        setRadarSweepSpeed('frozen');
                        playTacticalBeep(520, 'sawtooth', 0.04);
                      }}
                      className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        radarSweepSpeed === 'frozen'
                          ? 'bg-amber-950 border-amber-600 text-amber-300 font-bold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      HOLD
                    </button>

                    <span className="text-slate-700">|</span>

                    <button
                      onClick={() => {
                        setRadarShowVectorTrails(!radarShowVectorTrails);
                        playTacticalBeep(850, 'sine', 0.03);
                      }}
                      className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        radarShowVectorTrails
                          ? 'bg-cyan-950/60 border-cyan-700 text-cyan-300 font-bold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-500'
                      }`}
                    >
                      VECTORS: {radarShowVectorTrails ? 'ON' : 'OFF'}
                    </button>

                    <span className="text-slate-700">|</span>

                    {/* Sector Quick-Zoom to De-congest Map */}
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 font-bold uppercase">SECTOR:</span>
                      {(['statewide', 'norcal', 'central', 'socal'] as const).map((sec) => (
                        <button
                          key={sec}
                          onClick={() => {
                            setRadarSectorZoom(sec);
                            playTacticalBeep(sec === 'statewide' ? 700 : 900, 'sine', 0.03);
                          }}
                          className={`px-1.5 py-0.5 rounded uppercase font-bold text-[9px] transition-all cursor-pointer ${
                            radarSectorZoom === sec
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {sec === 'statewide' ? 'STATE' : sec.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    <span className="text-slate-700">|</span>

                    {/* Congestion Declutter Toggle */}
                    <button
                      onClick={() => {
                        setRadarDeclutter(!radarDeclutter);
                        playTacticalBeep(radarDeclutter ? 600 : 1050, 'sawtooth', 0.04);
                      }}
                      className={`px-2 py-0.5 rounded border transition-all cursor-pointer font-bold ${
                        radarDeclutter
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-500'
                      }`}
                      title="Toggle Declutter Mode: Eliminates icon and label congestion in dense sectors"
                    >
                      DECLUTTER: {radarDeclutter ? 'ON (CLEAN)' : 'OFF'}
                    </button>

                    <button
                      onClick={() => {
                        setRadarShowAirways(!radarShowAirways);
                        playTacticalBeep(720, 'sine', 0.03);
                      }}
                      className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        radarShowAirways
                          ? 'bg-cyan-950/60 border-cyan-600 text-cyan-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-500'
                      }`}
                      title="Toggle Federal Victor Airways"
                    >
                      AIRWAYS: {radarShowAirways ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Pacific Suppression Live Stats Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-1.5 rounded-lg bg-red-950/20 border border-red-900/40 text-[10px] text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  <span>PACIFIC FLANK: <strong className="text-red-400 font-bold">10,250 Active Fire Acres</strong> across Shasta, Dixie, Angeles Crest & Big Sur</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>Tankers Armed: <strong className="text-cyan-400 font-bold">18,800 gal</strong></span>
                  <span className="text-slate-600">|</span>
                  <span>Helitack Lift: <strong className="text-emerald-400 font-bold">4,280 gal</strong></span>
                  <span className="text-slate-600">|</span>
                  <span>Sorties Committed: <strong className="text-amber-400 font-bold">14 Active</strong></span>
                </div>
              </div>
            </div>

            {/* Interactive SVG Radar Map Canvas with CRT Scanlines & HUD */}
            <div 
              ref={radarSvgContainerRef}
              onMouseDown={(e) => {
                if (e.button === 0 || e.button === 1) {
                  radarDragStartRef.current = {
                    clientX: e.clientX,
                    clientY: e.clientY,
                    panX: radarPanOffset.x,
                    panY: radarPanOffset.y,
                  };
                  didRadarDragRef.current = false;
                  setIsRadarDragging(true);
                }
              }}
              onMouseUp={() => {
                setIsRadarDragging(false);
                radarDragStartRef.current = null;
              }}
              onMouseMove={(e) => {
                if (isRadarDragging && radarDragStartRef.current && radarSvgContainerRef.current) {
                  const dx = e.clientX - radarDragStartRef.current.clientX;
                  const dy = e.clientY - radarDragStartRef.current.clientY;
                  if (Math.hypot(dx, dy) > 4) {
                    didRadarDragRef.current = true;
                  }
                  const rect = radarSvgContainerRef.current.getBoundingClientRect();
                  const scaleFactorX = (baseRadarViewBox.width / radarZoomScale) / rect.width;
                  const scaleFactorY = (baseRadarViewBox.height / radarZoomScale) / rect.height;
                  setRadarPanOffset({
                    x: radarDragStartRef.current.panX - dx * scaleFactorX,
                    y: radarDragStartRef.current.panY - dy * scaleFactorY,
                  });
                }
              }}
              onMouseLeave={() => {
                setIsRadarDragging(false);
              }}
              className={`relative w-full h-[440px] rounded-lg overflow-hidden select-none border transition-colors ${
                isRadarDragging ? 'cursor-grabbing' : 'cursor-crosshair'
              } ${
                radarColorTheme === 'flir'
                  ? 'bg-[#0f0404] border-orange-900/60 shadow-orange-950/40 shadow-inner'
                  : radarColorTheme === 'nvg'
                  ? 'bg-[#021006] border-emerald-900/60 shadow-emerald-950/40 shadow-inner'
                  : 'bg-slate-950 border-cyan-900/50 shadow-cyan-950/40 shadow-inner'
              }`}
            >
              
              {/* Day/Night Solar Terminator Layer */}
              {activeLayers.day_night && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-950/20 via-transparent to-black/60 pointer-events-none z-0" />
              )}

              {/* CRT Scanline Overlay */}
              <div className="absolute inset-0 radar-scanlines pointer-events-none z-20 opacity-35" />

              {/* Tactical Corner HUD Overlays */}
              <div className="absolute top-2.5 left-3 z-30 pointer-events-none font-mono text-[9px] text-slate-400 leading-tight">
                <div className="flex items-center gap-1.5 font-bold tracking-wider text-white">
                  <span className={`w-1.5 h-1.5 rounded-full ${radarColorTheme === 'flir' ? 'bg-orange-400' : radarColorTheme === 'nvg' ? 'bg-emerald-400' : 'bg-cyan-400'} animate-ping`} />
                  <span>[ ⌖ ] AN/APG-83 ACTIVE PHASED ARRAY</span>
                </div>
                <div className="text-slate-500 mt-0.5">FREQ: 9.42 GHz X-BAND · PRF: HIGH · AZ: 360° CONT</div>
              </div>

              <div className="absolute top-2.5 right-3 z-30 pointer-events-none font-mono text-[9px] text-right text-slate-400 leading-tight">
                <div className="font-bold text-white tracking-wider">
                  TAC-LINK 16: <strong className={radarColorTheme === 'flir' ? 'text-orange-400' : radarColorTheme === 'nvg' ? 'text-emerald-400' : 'text-cyan-400'}>ENCRYPTED FED LINK</strong>
                </div>
                <div className="text-slate-500 mt-0.5">CAL FIRE AIR OPS // USFS PMS-505 // ADS-B DO-260B</div>
              </div>

              {/* Interactive Zoom HUD Controls Overlay */}
              <div className="absolute top-12 right-3 z-30 flex flex-col items-end gap-1 font-mono">
                <div className="flex items-center gap-1 bg-slate-950/85 backdrop-blur-md p-1 rounded-md border border-slate-800 shadow-xl text-[10px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRadarZoomScale((z) => Math.min(6.0, +(z * 1.3).toFixed(2)));
                      playTacticalBeep(980, 'sine', 0.03);
                    }}
                    className="w-6 h-6 flex items-center justify-center rounded bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-slate-200 hover:text-cyan-300 font-bold transition-all cursor-pointer"
                    title="Zoom In (or use Mousewheel Up)"
                  >
                    +
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRadarZoomScale((z) => Math.max(0.7, +(z / 1.3).toFixed(2)));
                      playTacticalBeep(750, 'sine', 0.03);
                    }}
                    className="w-6 h-6 flex items-center justify-center rounded bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-slate-200 hover:text-cyan-300 font-bold transition-all cursor-pointer"
                    title="Zoom Out (or use Mousewheel Down)"
                  >
                    -
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRadarZoomScale(1.0);
                      setRadarPanOffset({ x: 0, y: 0 });
                      playTacticalBeep(650, 'sine', 0.03);
                    }}
                    className="px-1.5 h-6 flex items-center justify-center rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white font-bold text-[8.5px] transition-all cursor-pointer"
                    title="Reset Zoom & Pan"
                  >
                    {Math.round(radarZoomScale * 100)}%
                  </button>
                </div>
                <div className="text-[8.5px] text-slate-400 bg-black/60 px-1.5 py-0.5 rounded border border-slate-800/80 pointer-events-none">
                  SCROLL WHEEL TO ZOOM
                </div>
              </div>

              <div className="absolute bottom-2.5 left-3 z-30 pointer-events-none font-mono text-[9px] text-slate-500 leading-tight">
                <span>GRID: WGS-84 / UTM ZONE 10S · ELEV: 1,840 FT MSL</span>
              </div>

              <div className="absolute bottom-2.5 right-3 z-30 pointer-events-none font-mono text-[9px] text-right text-slate-500 leading-tight">
                <span>RANGE: 200 NM · {visibleMapAssets.length} TARGETS ACQUIRED</span>
              </div>

              {/* Geographic Coastline, Tactical Range Rings, Azimuth Compass & Assets (SVG) */}
              <svg 
                className="w-full h-full relative z-10 transition-all duration-300" 
                viewBox={computedRadarViewBox}
              >
                <defs>
                  <linearGradient id="sweepGradientCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                    <stop offset="40%" stopColor="#0891b2" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="sweepGradientFlir" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
                    <stop offset="40%" stopColor="#ef4444" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="sweepGradientNvg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.45" />
                    <stop offset="40%" stopColor="#15803d" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#15803d" stopOpacity="0" />
                  </linearGradient>

                  <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Concentric Tactical Range Rings (Center: 300, 200) */}
                <g opacity="0.32">
                  {/* 50 NM */}
                  <circle cx="300" cy="200" r="45" fill="none" stroke={radarColorTheme === 'flir' ? '#ea580c' : radarColorTheme === 'nvg' ? '#16a34a' : '#0891b2'} strokeWidth="1" strokeDasharray="3 3" />
                  {/* 100 NM */}
                  <circle cx="300" cy="200" r="90" fill="none" stroke={radarColorTheme === 'flir' ? '#ea580c' : radarColorTheme === 'nvg' ? '#16a34a' : '#0891b2'} strokeWidth="1" strokeDasharray="4 4" />
                  {/* 150 NM */}
                  <circle cx="300" cy="200" r="135" fill="none" stroke={radarColorTheme === 'flir' ? '#ea580c' : radarColorTheme === 'nvg' ? '#16a34a' : '#0891b2'} strokeWidth="1" strokeDasharray="5 5" />
                  {/* 200 NM Outer Ring */}
                  <circle cx="300" cy="200" r="180" fill="none" stroke={radarColorTheme === 'flir' ? '#ea580c' : radarColorTheme === 'nvg' ? '#16a34a' : '#0891b2'} strokeWidth="1.2" />

                  {/* Range Ring Labels */}
                  <text x="303" y="153" fill={radarColorTheme === 'flir' ? '#ea580c' : radarColorTheme === 'nvg' ? '#16a34a' : '#0891b2'} fontSize="7" fontFamily="JetBrains Mono">50 NM</text>
                  <text x="303" y="108" fill={radarColorTheme === 'flir' ? '#ea580c' : radarColorTheme === 'nvg' ? '#16a34a' : '#0891b2'} fontSize="7" fontFamily="JetBrains Mono">100 NM</text>
                  <text x="303" y="63" fill={radarColorTheme === 'flir' ? '#ea580c' : radarColorTheme === 'nvg' ? '#16a34a' : '#0891b2'} fontSize="7" fontFamily="JetBrains Mono">150 NM</text>
                  <text x="303" y="18" fill={radarColorTheme === 'flir' ? '#ea580c' : radarColorTheme === 'nvg' ? '#16a34a' : '#0891b2'} fontSize="7" fontFamily="JetBrains Mono">200 NM</text>

                  {/* Azimuth Crosshairs */}
                  <line x1="300" y1="15" x2="300" y2="385" stroke={radarColorTheme === 'flir' ? '#ea580c' : radarColorTheme === 'nvg' ? '#16a34a' : '#0891b2'} strokeWidth="0.8" strokeDasharray="2 4" />
                  <line x1="115" y1="200" x2="485" y2="200" stroke={radarColorTheme === 'flir' ? '#ea580c' : radarColorTheme === 'nvg' ? '#16a34a' : '#0891b2'} strokeWidth="0.8" strokeDasharray="2 4" />
                  
                  {/* Cardinal Compass Markers */}
                  <text x="300" y="12" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="JetBrains Mono" fontWeight="bold">000° N</text>
                  <text x="495" y="203" fill="#ffffff" fontSize="8" fontFamily="JetBrains Mono" fontWeight="bold">090° E</text>
                  <text x="300" y="396" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="JetBrains Mono" fontWeight="bold">180° S</text>
                  <text x="105" y="203" textAnchor="end" fill="#ffffff" fontSize="8" fontFamily="JetBrains Mono" fontWeight="bold">270° W</text>

                  {/* Intercardinal degree markers */}
                  <text x="430" y="72" fill="#94a3b8" fontSize="7" fontFamily="JetBrains Mono">045°</text>
                  <text x="430" y="332" fill="#94a3b8" fontSize="7" fontFamily="JetBrains Mono">135°</text>
                  <text x="170" y="332" textAnchor="end" fill="#94a3b8" fontSize="7" fontFamily="JetBrains Mono">225°</text>
                  <text x="170" y="72" textAnchor="end" fill="#94a3b8" fontSize="7" fontFamily="JetBrains Mono">315°</text>
                </g>

                {/* Rotating Phased Array Radar Sweep Beam */}
                {radarSweepSpeed !== 'frozen' && (
                  <g
                    className={radarSweepSpeed === 'fast' ? 'animate-radar-fast' : 'animate-radar-sweep'}
                    style={{ transformOrigin: '300px 200px' }}
                  >
                    {/* Trailing Radar Sweep Cone (Phosphor Persistence) */}
                    <path
                      d="M 300 200 L 300 20 A 180 180 0 0 0 215 45 Z"
                      fill={`url(#${
                        radarColorTheme === 'flir' ? 'sweepGradientFlir' :
                        radarColorTheme === 'nvg' ? 'sweepGradientNvg' :
                        'sweepGradientCyan'
                      })`}
                    />
                    {/* Leading Bright Laser Radar Beam */}
                    <line
                      x1="300"
                      y1="200"
                      x2="300"
                      y2="20"
                      stroke={radarColorTheme === 'flir' ? '#fb923c' : radarColorTheme === 'nvg' ? '#4ade80' : '#38bdf8'}
                      strokeWidth="1.8"
                      filter="url(#radarGlow)"
                    />
                    {/* Center Core Emitter */}
                    <circle cx="300" cy="200" r="3" fill="#ffffff" />
                  </g>
                )}

                {/* California Coastal Vector Silhouette */}
                <path
                  d="M 120 20 L 150 60 L 175 110 L 210 160 L 250 200 L 290 230 L 340 270 L 390 320 L 440 360 L 520 375 L 560 380 L 580 380 L 580 20 L 120 20 Z"
                  fill="#030b17"
                  stroke={radarColorTheme === 'flir' ? '#451a03' : radarColorTheme === 'nvg' ? '#064e3b' : '#1e293b'}
                  strokeWidth="1.2"
                  opacity="0.8"
                />

                {/* Subsea Cable Lines */}
                {activeLayers.cables && (
                  <path
                    d="M 390 320 C 250 300, 100 240, 20 220"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.7"
                  />
                )}

                {/* Federal Victor Airways & VOR Navigation Fixes */}
                {radarShowAirways && (
                  <g opacity="0.45" stroke="#0ea5e9" strokeWidth="0.8" strokeDasharray="3 3">
                    {/* V25 Central Valley Corridor */}
                    <path d="M 175 60 L 250 160 L 290 230 L 360 300" fill="none" />
                    <text x="210" y="115" fill="#38bdf8" fontSize="6" fontFamily="JetBrains Mono">V25 VALLEY</text>
                    {/* V23 Coastal Corridor */}
                    <path d="M 150 70 L 210 180 L 340 280 L 440 365" fill="none" />
                    <text x="175" y="145" fill="#38bdf8" fontSize="6" fontFamily="JetBrains Mono">V23 COASTAL</text>
                    {/* VOR Fixes */}
                    <polygon points="175,56 179,64 171,64" fill="#0284c7" stroke="#38bdf8" strokeWidth="0.8" />
                    <text x="183" y="63" fill="#7dd3fc" fontSize="5.5" fontFamily="JetBrains Mono">RBL</text>
                    <polygon points="250,156 254,164 246,164" fill="#0284c7" stroke="#38bdf8" strokeWidth="0.8" />
                    <text x="258" y="163" fill="#7dd3fc" fontSize="5.5" fontFamily="JetBrains Mono">SAC</text>
                    <polygon points="360,296 364,304 356,304" fill="#0284c7" stroke="#38bdf8" strokeWidth="0.8" />
                    <text x="368" y="303" fill="#7dd3fc" fontSize="5.5" fontFamily="JetBrains Mono">PMD</text>
                  </g>
                )}

                {/* Class B Terminal Airspace Rings */}
                {radarShowClassB && (
                  <g opacity="0.35" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 3">
                    <circle cx="210" cy="180" r="22" fill="none" />
                    <text x="185" y="154" fill="#38bdf8" fontSize="5.5" fontFamily="JetBrains Mono">SFO CLASS B</text>
                    <circle cx="390" cy="320" r="26" fill="none" />
                    <text x="365" y="290" fill="#38bdf8" fontSize="5.5" fontFamily="JetBrains Mono">LAX CLASS B</text>
                  </g>
                )}

                {/* Prominent Mountain Hazard Elevations */}
                <g opacity="0.5" stroke="#f59e0b" fill="none" strokeWidth="0.9">
                  <polygon points="175,32 180,42 170,42" />
                  <text x="184" y="40" fill="#f59e0b" fontSize="5.5" fontFamily="JetBrains Mono">MT SHASTA 14,179'</text>
                  <polygon points="320,242 325,252 315,252" />
                  <text x="329" y="250" fill="#f59e0b" fontSize="5.5" fontFamily="JetBrains Mono">MT WHITNEY 14,505'</text>
                </g>

                {/* Render Visible Map Assets with Generous Click Targets & Declutter Collision Avoidance */}
                {visibleMapAssets.map((asset, index) => {
                  const pos = projectGeoToSvg(asset.lat, asset.lng, 600, 400);
                  const isSelected = selectedAsset?.id === asset.id;
                  const isHovered = hoveredMapAssetId === asset.id;
                  const heading = asset.heading || 0;

                  // Collision de-confliction: Stagger label offsets so nearby assets never stack
                  const labelOffsetX = (index % 2 === 0) ? 15 : -74;
                  const labelOffsetY = (index % 4 < 2) ? -6 : 10;
                  const showLabel = !radarDeclutter || isSelected || isHovered;

                  return (
                    <g
                      key={asset.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      className="cursor-pointer group"
                      onMouseEnter={() => setHoveredMapAssetId(asset.id)}
                      onMouseLeave={() => setHoveredMapAssetId(null)}
                      onClick={() => {
                        setSelectedAsset(asset);
                        playTacticalBeep(asset.type === 'incident' ? 1200 : asset.type === 'heli' ? 950 : 800, 'sawtooth', 0.08);
                      }}
                    >
                      {/* Generous 48px Transparent Hit Target Area for Effortless Clickability */}
                      <circle r="24" fill="transparent" className="cursor-pointer" />

                      {/* Hover / Selected Illuminated Pulse Reticle */}
                      {(isSelected || isHovered) && (
                        <g>
                          <circle 
                            r={20} 
                            fill="none" 
                            stroke={isSelected ? '#38bdf8' : 'rgba(56, 189, 248, 0.75)'} 
                            strokeWidth={1.4} 
                            strokeDasharray="4 3" 
                            className="animate-spin" 
                            style={{ animationDuration: '6s' }} 
                          />
                          {/* Corner Targeting Brackets */}
                          <path d="M -14 -8 L -14 -14 L -8 -14" fill="none" stroke={isSelected ? '#38bdf8' : '#7dd3fc'} strokeWidth="1.5" />
                          <path d="M 8 -14 L 14 -14 L 14 -8" fill="none" stroke={isSelected ? '#38bdf8' : '#7dd3fc'} strokeWidth="1.5" />
                          <path d="M 14 8 L 14 14 L 8 14" fill="none" stroke={isSelected ? '#38bdf8' : '#7dd3fc'} strokeWidth="1.5" />
                          <path d="M -8 14 L -14 14 L -14 8" fill="none" stroke={isSelected ? '#38bdf8' : '#7dd3fc'} strokeWidth="1.5" />
                        </g>
                      )}

                      {/* 1. WILDFIRE INCIDENTS (NASA FIRMS Multi-Ring Thermal Gradient Perimeter) */}
                      {asset.type === 'incident' && (
                        <g>
                          {/* Expanding Outer Containment Wave */}
                          <circle
                            r={isSelected ? 26 : 18}
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth={1.5}
                            strokeDasharray="3 3"
                            className="animate-ping"
                            opacity="0.35"
                          />
                          {/* Pulsing Thermal Heat Plume */}
                          <circle
                            r={isSelected ? 16 : 11}
                            fill="rgba(239, 68, 68, 0.25)"
                            stroke="#f97316"
                            strokeWidth={1.5}
                            className="animate-thermal-pulse"
                          />
                          {/* Blazing Flame Core Silhouette */}
                          <path
                            d="M 0 -8 C 3 -5, 4 -2, 3 3 C 2 7, -2 7, -3 3 C -4 -2, -3 -5, 0 -8 Z"
                            fill="#ef4444"
                            stroke="#fbbf24"
                            strokeWidth={1}
                          />
                          {/* Ember Hotspot Core */}
                          <circle cx="0" cy="2" r="1.5" fill="#fef08a" />
                        </g>
                      )}

                      {/* 2. AIR TANKER (Supersonic Fixed-Wing Aerodynamic Fighter/Tanker Vector) */}
                      {asset.type === 'air' && (
                        <g>
                          {/* Velocity Vector Trail */}
                          {radarShowVectorTrails && (
                            <g transform={`rotate(${heading})`}>
                              <line
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="-24"
                                stroke={radarColorTheme === 'flir' ? '#fb923c' : radarColorTheme === 'nvg' ? '#4ade80' : '#38bdf8'}
                                strokeWidth="1"
                                strokeDasharray="3 2"
                                opacity="0.8"
                              />
                              <polygon
                                points="0,-27 -2,-23 2,-23"
                                fill={radarColorTheme === 'flir' ? '#fb923c' : radarColorTheme === 'nvg' ? '#4ade80' : '#38bdf8'}
                              />
                            </g>
                          )}

                          {/* Aircraft Airframe rotated by Heading */}
                          <g transform={`rotate(${heading})`}>
                            {/* Aerodynamic Air Tanker Fuselage & Swept Wings */}
                            <path
                              d="M 0 -11 L 2 -6 L 10 2 L 10 4 L 3 3 L 2 9 L 5 12 L -5 12 L -2 9 L -3 3 L -10 4 L -10 2 L -2 -6 Z"
                              fill="#0b1329"
                              stroke={radarColorTheme === 'flir' ? '#fb923c' : radarColorTheme === 'nvg' ? '#4ade80' : '#06b6d4'}
                              strokeWidth={1.2}
                            />
                            {/* Twin Engine Nacelles */}
                            <rect x="3" y="1" width="1.5" height="4" rx="0.5" fill="#ffffff" />
                            <rect x="-4.5" y="1" width="1.5" height="4" rx="0.5" fill="#ffffff" />
                            {/* Cockpit Canopy Dot */}
                            <circle cx="0" cy="-5" r="1" fill="#ffffff" />
                            {/* Afterburner Flame Strobe */}
                            <circle cx="0" cy="12" r="1.5" fill="#38bdf8" className="animate-ping" />
                          </g>
                        </g>
                      )}

                      {/* 3. HELICOPTERS (Twin-Skid Rotorcraft with Spinning Main Rotor Disc) */}
                      {asset.type === 'heli' && (
                        <g>
                          {/* Heading Trajectory Vector */}
                          {radarShowVectorTrails && (
                            <g transform={`rotate(${heading})`}>
                              <line x1="0" y1="0" x2="0" y2="-18" stroke="#34d399" strokeWidth="1" strokeDasharray="2 2" opacity="0.75" />
                              <polygon points="0,-20 -2,-17 2,-17" fill="#34d399" />
                            </g>
                          )}

                          <g transform={`rotate(${heading})`}>
                            {/* Helicopter Fuselage */}
                            <rect x="-2.5" y="-5" width="5" height="10" rx="2.5" fill="#042f2e" stroke="#10b981" strokeWidth="1.2" />
                            {/* Tail Boom & Stabilizer */}
                            <line x1="0" y1="5" x2="0" y2="12" stroke="#10b981" strokeWidth="1.2" />
                            <line x1="-3" y1="12" x2="3" y2="12" stroke="#34d399" strokeWidth="1" />
                            {/* Skids */}
                            <line x1="-4" y1="-3" x2="-4" y2="5" stroke="#34d399" strokeWidth="0.8" />
                            <line x1="4" y1="-3" x2="4" y2="5" stroke="#34d399" strokeWidth="0.8" />
                            {/* Spinning 4-Blade Rotor Disc */}
                            <g className="animate-rotor-spin">
                              <line x1="-12" y1="0" x2="12" y2="0" stroke="#6ee7b7" strokeWidth="1.2" />
                              <line x1="0" y1="-12" x2="0" y2="12" stroke="#6ee7b7" strokeWidth="1.2" />
                              <circle r="12" fill="none" stroke="#34d399" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.6" />
                            </g>
                          </g>
                        </g>
                      )}

                      {/* 4. RECON / LEAD PLANE (Tactical Diamond Crosshair Reticle) */}
                      {asset.type === 'recon' && (
                        <g transform={`rotate(${heading})`}>
                          {radarShowVectorTrails && (
                            <line x1="0" y1="0" x2="0" y2="-20" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" opacity="0.8" />
                          )}
                          <polygon
                            points="0,-8 7,0 0,8 -7,0"
                            fill="rgba(56, 189, 248, 0.35)"
                            stroke="#38bdf8"
                            strokeWidth={1.4}
                          />
                          <circle r="2" fill="#ffffff" />
                          <line x1="-9" y1="0" x2="9" y2="0" stroke="#38bdf8" strokeWidth="0.8" />
                          <line x1="0" y1="-9" x2="0" y2="9" stroke="#38bdf8" strokeWidth="0.8" />
                        </g>
                      )}

                      {/* 5. SATELLITE / MARITIME / OTHER */}
                      {asset.type !== 'incident' && asset.type !== 'air' && asset.type !== 'heli' && asset.type !== 'recon' && (
                        <circle
                          r={isSelected ? 8 : 5}
                          fill={
                            asset.type === 'satellite' ? '#a855f7' :
                            asset.type === 'naval' ? '#3b82f6' :
                            asset.type === 'cctv' ? '#f59e0b' : '#10b981'
                          }
                          stroke="#ffffff"
                          strokeWidth={1.2}
                        />
                      )}

                      {/* Anti-Congestion De-conflicted HUD Asset Label */}
                      {showLabel && (
                        <g transform={`translate(${labelOffsetX}, ${labelOffsetY})`}>
                          <rect
                            x="-2"
                            y="-9"
                            width={asset.callsign ? 70 : 60}
                            height="13"
                            rx="2"
                            fill="rgba(2, 6, 23, 0.9)"
                            stroke={isSelected ? '#38bdf8' : isHovered ? '#7dd3fc' : 'rgba(51, 65, 85, 0.7)'}
                            strokeWidth="0.8"
                          />
                          <text
                            x="2"
                            y="1"
                            fill={
                              isSelected ? '#38bdf8' :
                              asset.type === 'incident' ? '#f87171' :
                              asset.type === 'heli' ? '#34d399' : '#cbd5e1'
                            }
                            fontSize="8.5"
                            fontFamily="JetBrains Mono"
                            fontWeight="bold"
                            className="pointer-events-none drop-shadow"
                          >
                            {asset.callsign || asset.name.split(' ')[0]}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Floating Asset Dossier Drawer on the map */}
              {selectedAsset && (
                <div className={`absolute bottom-3 left-3 right-3 z-30 bg-slate-950/95 backdrop-blur-md border rounded-xl p-3 shadow-2xl text-xs font-mono ${
                  radarColorTheme === 'flir' ? 'border-orange-500/80' : radarColorTheme === 'nvg' ? 'border-emerald-500/80' : 'border-cyan-500/80'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        selectedAsset.type === 'incident' ? 'bg-red-500 animate-ping' : 'bg-cyan-400'
                      }`} />
                      <span className="font-bold text-white text-sm">{selectedAsset.name}</span>
                      <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded uppercase">
                        {selectedAsset.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span>LAT: {selectedAsset.lat.toFixed(2)}° · LNG: {selectedAsset.lng.toFixed(2)}°</span>
                      {selectedAsset.heading !== undefined && (
                        <span>HDG: <strong className="text-cyan-300">{selectedAsset.heading}°</strong></span>
                      )}
                      <button
                        onClick={() => setSelectedAsset(null)}
                        className="text-slate-500 hover:text-white px-1.5 py-0.5 rounded border border-slate-800 cursor-pointer"
                      >
                        ✕ Close
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 mb-2">
                    {selectedAsset.detail}
                  </p>

                  {/* Telemetry Key-Value Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {Object.entries(selectedAsset.telemetry).map(([k, v]) => (
                      <div key={k} className="px-2 py-0.5 rounded bg-black/60 border border-slate-800 text-[10px] text-slate-400">
                        <span className="text-slate-500">{k}: </span>
                        <strong className="text-cyan-300 font-bold">{v}</strong>
                      </div>
                    ))}
                  </div>

                  {/* CCTV Live Preview Snapshot (when cctv_previews enabled) */}
                  {activeLayers.cctv_previews && selectedAsset.cctvImage && (
                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center gap-3">
                      <div className="w-28 h-16 rounded overflow-hidden border border-amber-500/60 shrink-0">
                        <img src={selectedAsset.cctvImage} alt="Live CCTV" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-[10px] text-amber-300">
                        <span className="font-bold block uppercase flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          <span>LIVE OPTICAL TELEMETRY STREAM</span>
                        </span>
                        <span className="text-slate-400 block mt-0.5">High-definition remote surveillance feed refreshed continuously.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* RIGHT / MAIN: RECHARTS RESPONSIVECONTAINER LINE CHART */}
        {(viewMode === 'split' || viewMode === 'metrics') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-5' : 'w-full'} bg-slate-950 border border-cyan-900/50 rounded-xl p-5 relative overflow-hidden shadow-2xl flex flex-col justify-between`}>
            
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-900 mb-2.5 text-xs font-mono gap-1">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Activity className="w-4 h-4" />
                  <span>PREDICTIVE SLA METRICS (RECHARTS)</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-800 text-[9px] text-amber-300 font-normal">
                    SIMULATED
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span>SCENARIO BENCHMARK: 20.0M</span>
                  <span className="text-slate-600 hidden md:inline">|</span>
                  <span className="text-slate-500 hidden md:inline" title="Derived from CAL FIRE 20m Initial Attack response time planning objective. Not a universal pit turnaround mandate.">
                    CAL FIRE Initial Attack Goal (20m)
                  </span>
                </div>
              </div>

              {/* Data Analyst Anomaly Display Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-black/60 border border-slate-800/80 mb-3 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Filter className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-slate-300">ANOMALY FILTER:</span>
                  <span className="text-[10px] text-cyan-400 font-bold">
                    ({rechartsData.filter(p => p.anomaly).length} / {anomalyCount} VISIBLE)
                  </span>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto">
                  {[
                    { id: 'all', label: 'All', badge: '4' },
                    { id: 'critical', label: 'Critical Only', badge: '2' },
                    { id: 'high_plus', label: 'High+', badge: '3' },
                    { id: 'medium_plus', label: 'Medium+', badge: '4' },
                    { id: 'none', label: 'Hide (Pure Baseline)', badge: '0' },
                  ].map((f) => {
                    const isSelected = anomalyFilter === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          setAnomalyFilter(f.id as AnomalyFilter);
                          playTacticalBeep(f.id === 'none' ? 420 : 860, 'sine', 0.04);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all border whitespace-nowrap cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-sm shadow-cyan-950'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className="ml-1 opacity-60">({f.badge})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Informational Banner for Data Analysts when filter active */}
              {anomalyFilter === 'none' && (
                <div className="mb-2 px-2.5 py-1 rounded bg-slate-900/60 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>ANOMALY OVERLAYS HIDDEN: Clean baseline trajectory view active for regression analysis.</span>
                  <button
                    onClick={() => {
                      setAnomalyFilter('all');
                      playTacticalBeep(880, 'sine', 0.04);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-bold ml-2 cursor-pointer"
                  >
                    Restore All
                  </button>
                </div>
              )}

              {/* Recharts Line Chart Container */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={rechartsData}
                    margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="cyanLineGlow" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0891b2" />
                        <stop offset="50%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>

                      <linearGradient id="emeraldScenarioGlow" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>

                      <linearGradient id="confidenceAreaGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" opacity={0.6} />

                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickLine={{ stroke: '#334155' }}
                    />

                    <YAxis
                      domain={[10, 26]}
                      stroke="#64748b"
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      tickLine={{ stroke: '#334155' }}
                      tickFormatter={(val) => `${val}m`}
                    />

                    <ReferenceLine
                      y={20.0}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: '20M SCENARIO TARGET',
                        position: 'insideTopRight',
                        fill: '#ef4444',
                        fontSize: 9,
                        fontFamily: 'JetBrains Mono',
                        fontWeight: 'bold',
                      }}
                    />

                    <Tooltip content={<CustomWarRoomTooltip />} />

                    <Area
                      type="monotone"
                      dataKey="confidenceBand"
                      stroke="none"
                      fill="url(#confidenceAreaGlow)"
                      connectNulls={true}
                      isAnimationActive={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="forecast"
                      stroke="#475569"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      connectNulls={true}
                      isAnimationActive={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="scenarioProjected"
                      stroke="url(#emeraldScenarioGlow)"
                      strokeWidth={2.5}
                      dot={{ r: 2, fill: '#10b981' }}
                      activeDot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                      connectNulls={true}
                      isAnimationActive={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="url(#cyanLineGlow)"
                      strokeWidth={2.5}
                      dot={renderCustomizedDot}
                      activeDot={{ r: 6, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 2 }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Anomaly Selection Row */}
            <div className="pt-3 border-t border-slate-900 mt-2">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1.5 uppercase">
                <span>
                  Historical Anomaly Quick Dossier ({rechartsData.filter(p => p.anomaly).length} visible):
                </span>
                {anomalyFilter !== 'all' && (
                  <span className="text-cyan-400">
                    Filter: {anomalyFilter.replace('_plus', '+').toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {rawDataPoints.filter(p => isAnomalyMatchingFilter(p.anomaly)).length > 0 ? (
                  rawDataPoints.filter(p => isAnomalyMatchingFilter(p.anomaly)).map((p) => {
                    const anom = p.anomaly!;
                    const isSel = selectedAnomaly?.id === anom.id;
                    const isResolved = !!resolvedAnomalies[anom.id];
                    return (
                      <button
                        key={anom.id}
                        onClick={() => {
                          setSelectedAnomaly(anom);
                          playTacticalBeep(1200, 'sawtooth', 0.08);
                        }}
                        className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all border whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                          isSel
                            ? isResolved
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold shadow-sm shadow-emerald-950 ring-1 ring-emerald-500/50'
                              : 'bg-red-950 border-red-500 text-red-200 font-bold shadow-sm shadow-red-950 ring-1 ring-red-500/50'
                            : isResolved
                            ? 'bg-slate-900 border-emerald-500/40 text-emerald-300 hover:text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isResolved ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : (
                          <ShieldAlert className="w-3 h-3 text-red-400 shrink-0" />
                        )}
                        <span>{anom.id} · {anom.value}m</span>
                        {isResolved && <span className="text-[9px] text-emerald-400 font-bold uppercase">(Resolved)</span>}
                      </button>
                    );
                  })
                ) : (
                  <div className="text-[10px] font-mono text-slate-500 italic py-0.5">
                    No anomaly markers visible under current filter. Select &apos;All&apos; or &apos;Critical&apos; above.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* HISTORICAL ANOMALY TACTICAL DOSSIER HUD & SCENARIO CONTROL BENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT: ULTRON ANOMALY DOSSIER CARD */}
        <div className="bg-slate-950 border border-cyan-900/60 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="absolute top-0 left-0 w-2 h-full bg-cyan-500" />
          
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>INTERACTIVE HISTORICAL ANOMALY DOSSIER</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold uppercase">
                {selectedAnomaly ? selectedAnomaly.severity : 'STANDBY'}
              </span>
            </div>

            {selectedAnomaly ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono text-slate-500">DOSSIER TICKET: {selectedAnomaly.id}</div>
                  <h3 className="text-base font-bold text-white font-mono mt-0.5">
                    {selectedAnomaly.title}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-black/60 border border-slate-800/80 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">AIRFRAME / ASSET:</span>
                    <span className="text-cyan-300 font-bold">{selectedAnomaly.airframe}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">BASE SECTOR:</span>
                    <span className="text-slate-200">{selectedAnomaly.base}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">OBSERVED VALUE:</span>
                    <span className="text-red-400 font-black text-sm">{selectedAnomaly.value} min</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">CEILING LIMIT:</span>
                    <span className="text-slate-400">{selectedAnomaly.expectedLimit} min</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/40">
                    <span className="text-red-400 font-bold block mb-1">DIAGNOSED ROOT CAUSE:</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {selectedAnomaly.rootCause}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
                    <span className="text-emerald-400 font-bold block mb-1">TACTICAL MITIGATION EXECUTED:</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {selectedAnomaly.mitigation}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 font-mono text-xs">
                Hover or click an anomaly point on the chart to inspect full telemetry dossier
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-900 mt-4 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Ground Truth: CAL FIRE CISRM 2026</span>
            <span>Status: Quarantined & Logged</span>
          </div>
        </div>

        {/* RIGHT: ULTRON WHAT-IF FUSION SCENARIO BENCH */}
        <div className="bg-slate-950 border border-cyan-900/40 rounded-xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>ULTRON WAR ROOM SCENARIO SIMULATOR</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                RECHARTS REAL-TIME RE-RENDER
              </span>
            </div>

            <div className="space-y-5">
              {/* Slider 1 */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-300">CP-SAT Turnaround Acceleration</span>
                  <span className="text-cyan-400 font-bold tabular-nums">-{slaTargetReduction}% Faster</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  step="5"
                  value={slaTargetReduction}
                  onChange={(e) => {
                    setSlaTargetReduction(Number(e.target.value));
                    playTacticalBeep(600 + Number(e.target.value) * 15, 'sine', 0.03);
                  }}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>Baseline (0%)</span>
                  <span>Standard Optimization (-18%)</span>
                  <span>Max Constraint Power (-35%)</span>
                </div>
              </div>

              {/* Slider 2 */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-300">Tactical Concurrency Surge</span>
                  <span className="text-blue-400 font-bold tabular-nums">{incidentSurgeFactor.toFixed(1)}x Normal Sorties</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="2.2"
                  step="0.1"
                  value={incidentSurgeFactor}
                  onChange={(e) => {
                    setIncidentSurgeFactor(Number(e.target.value));
                    playTacticalBeep(500 + Number(e.target.value) * 100, 'sine', 0.03);
                  }}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>0.8x (Nominal Patrol)</span>
                  <span>1.3x (Standard Dispatch)</span>
                  <span>2.2x (Red Flag Crisis)</span>
                </div>
              </div>

              {/* Slider 3 */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-300">Fleet Sustainment Readiness Target</span>
                  <span className="text-emerald-400 font-bold tabular-nums">{preventativeMaintBuffer}% Preparedness</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="100"
                  step="2"
                  value={preventativeMaintBuffer}
                  onChange={(e) => {
                    setPreventativeMaintBuffer(Number(e.target.value));
                    playTacticalBeep(400 + Number(e.target.value) * 5, 'sine', 0.03);
                  }}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>80% (Minimum Compliance)</span>
                  <span>94% (Target Defense)</span>
                  <span>100% (Zero-Downtime Spares)</span>
                </div>
              </div>
            </div>

            {/* Tactical Projected Readouts */}
            <div className="grid grid-cols-3 gap-2.5 mt-5 p-3 rounded-lg bg-black/60 border border-slate-900 font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">DAILY SORTIES</span>
                <span className="text-sm font-bold text-white tabular-nums">
                  {Math.round(20 * incidentSurgeFactor)} missions
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">PROJECTED SLA</span>
                <span className="text-sm font-bold text-emerald-400 tabular-nums">
                  {+(16.2 * (1 - slaTargetReduction/100)).toFixed(1)} mins
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">SUPPRESSION GAIN</span>
                <span className="text-sm font-bold text-cyan-300 tabular-nums">
                  +{Math.round(slaTargetReduction * 1.4)}% flow
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-900 mt-4 text-[11px] font-mono text-slate-500">
            Recharts ComposedChart Engine: Monotone spline interpolation
          </div>
        </div>

      </div>

      {/* REAL-TIME OPERATIONAL BASE RESOURCE ALLOCATION (BAR CHART SECTION) */}
      {(showBaseAllocationSection || viewMode === 'metrics' || viewMode === 'split') && viewMode !== 'base_allocation' && (
        <div id="base-resource-allocation-section" className="w-full mb-6 animate-in fade-in duration-200">
          <BaseResourceAllocationBarChart
            onSelectBase={(base) => {
              playTacticalBeep(940, 'triangle', 0.08);
              onAddActivityLog?.({
                id: `base-select-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                user: 'Nicholas Marnocha (Lead)',
                action: `Inspected Operational Base: ${base.name} (${base.code}) · Region: ${base.region} · Pits: ${base.activePitsOccupied}/${base.loadingPits} · Mix: ${(base.currentMixGal/1000).toFixed(0)}k Gal`,
                category: 'Base Logistics',
              });
            }}
            onAddActivityLog={onAddActivityLog}
            onPlayBeep={playTacticalBeep}
          />
        </div>
      )}

      {/* REAL-TIME PREDICTIVE ALERT MANAGER & OPERATIONAL TELEMETRY LOG TRACER */}
      <AlertManager
        activeAnomalyId={selectedAnomaly?.id}
        onSelectAnomaly={(anom) => {
          setSelectedAnomaly(anom);
          playTacticalBeep(1200, 'sawtooth', 0.08);
        }}
        onNavigateToAsset={(assetIdOrCallsign) => {
          const match = mapAssets.find(a => 
            a.id === assetIdOrCallsign || 
            a.callsign?.toLowerCase().includes(assetIdOrCallsign.toLowerCase()) ||
            a.name.toLowerCase().includes(assetIdOrCallsign.toLowerCase())
          );
          if (match) {
            setSelectedAsset(match);
            if (viewMode === 'metrics') {
              setViewMode('split');
            }
            playTacticalBeep(1400, 'triangle', 0.1);
          }
        }}
      />

      {/* CUSTOM STREAM THRESHOLD ALERT CONFIGURATOR PANEL */}
      <CustomAlertThresholdsPanel
        isOpen={isAlertConfigOpen}
        onClose={() => setIsAlertConfigOpen(false)}
        onTriggerSimulatedAnomaly={(rule) => {
          playTacticalBeep(1300, 'sawtooth', 0.12);
        }}
        onRuleTriggered={(rule, val) => {
          onAddActivityLog?.({
            id: `log-thresh-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            user: 'Nicholas Marnocha (Lead)',
            action: `Dispatched threshold alert [${rule.severity.toUpperCase()}]: ${rule.name} (Observed: ${val} ${rule.unit} ${rule.operator} ${rule.thresholdValue} ${rule.unit})`,
            category: 'Predictive BI',
          });
        }}
      />

    </div>
  );
};
