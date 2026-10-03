import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Flame,
  Volume2,
  VolumeX,
  Maximize2,
  Crosshair,
  Compass,
  Layers,
  Shield,
  Plane,
  Radio,
  MapPin,
  RefreshCw,
  Info,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Eye,
  Activity,
  Wind,
  Video,
  ChevronRight,
  Database,
  Gauge,
  X,
  Camera,
  Search,
  Target
} from 'lucide-react';
import { CALFIRE_AND_MILITARY_BASES, AirbaseResource } from '../data/calfireAirbases';
import { CaliforniaGeography, projectGeo } from './radar/CaliforniaGeography';
import { LiveCameraModal } from './radar/LiveCameraModal';
import { ResourceAllocationTable } from './radar/ResourceAllocationTable';
import { AircraftTelemetryOverlay } from './radar/AircraftTelemetryOverlay';
import { CanvasTacticalRadarMap } from './radar/CanvasTacticalRadarMap';
import { getAircraftDossier, AircraftDossier } from '../data/aircraftMaintenanceData';

export type RadarColorTheme = 'cyan' | 'flir' | 'nvg';
export type SectorPreset = 'statewide' | 'norcal' | 'central' | 'socal';
export type ResourceFilter = 'all' | 'c130' | 'tankers' | 'helicopters' | 'wildfires' | 'calfire_bases' | 'military_bases' | 'recon';

export interface WildfireAsset {
  id: string;
  name: string;
  category: 'air_tanker' | 'helicopter' | 'wildfire' | 'recon_lead' | 'air_base' | 'military_base';
  modelOrType: string;
  callsign: string;
  lat: number;
  lng: number;
  heading: number; // 0 - 360 degrees
  speedKnots?: number;
  altitudeFt?: number;
  status: 'In Flight' | 'Retardant Drop' | 'Initial Attack' | 'En Route' | 'On Deck' | 'Active Burn' | 'Operational Base';
  baseLocation?: string;
  payloadCapacityGal?: number;
  currentPayloadGal?: number;
  dropSystem?: string;
  acreage?: number;
  containmentPercent?: number;
  fuelModel?: string;
  frequency?: string;
  assignedIncident?: string;
  missionSummary: string;
  telemetry: Record<string, string | number | undefined>;
  vectorTrail?: Array<{ lat: number; lng: number }>;
  liveFeedTitle?: string;
  liveFeedSensor?: string;
  liveFeedDesc?: string;
}

interface TacticalRadarProps {
  onSelectAsset?: (asset: WildfireAsset) => void;
  externalSelectedId?: string;
  initialTheme?: RadarColorTheme;
  compact?: boolean;
}



export const TacticalRadar: React.FC<TacticalRadarProps> = ({
  onSelectAsset,
  externalSelectedId,
  initialTheme = 'cyan',
  compact = false,
}) => {
  // Settings & Toggles
  const [colorTheme, setColorTheme] = useState<RadarColorTheme>(initialTheme);
  const [sectorPreset, setSectorPreset] = useState<SectorPreset>('statewide');
  const [resourceFilter, setResourceFilter] = useState<ResourceFilter>('all');
  const [isSweepActive, setIsSweepActive] = useState<boolean>(true);
  const [sweepSpeed, setSweepSpeed] = useState<'normal' | 'fast'>('normal');
  const [showVectorTrails, setShowVectorTrails] = useState<boolean>(true);
  const [showTFRZones, setShowTFRZones] = useState<boolean>(true);
  const [showTopography, setShowTopography] = useState<boolean>(true);
  const [showAirBases, setShowAirBases] = useState<boolean>(true);
  const [showMilitaryBases, setShowMilitaryBases] = useState<boolean>(true);
  const [showOceanBuoys, setShowOceanBuoys] = useState<boolean>(true);
  const [showHydrography, setShowHydrography] = useState<boolean>(true);
  const [showAirways, setShowAirways] = useState<boolean>(true);
  const [showWinds, setShowWinds] = useState<boolean>(true);
  const [showClassBAirspace, setShowClassBAirspace] = useState<boolean>(true);
  const [showRetardantDrops, setShowRetardantDrops] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'radar' | 'allocation_matrix' | 'live_cameras'>('radar');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(externalSelectedId || 'tanker-910');
  const [isSelectionModeActive, setIsSelectionModeActive] = useState<boolean>(true);
  const [showIconLegend, setShowIconLegend] = useState<boolean>(true);
  const [highlightedLegendCategory, setHighlightedLegendCategory] = useState<string | null>(null);
  const [activeLegendDescription, setActiveLegendDescription] = useState<string | null>(null);
  const [highDensityMode, setHighDensityMode] = useState<boolean>(false);
  const [radarZoomScale, setRadarZoomScale] = useState<number>(1.0);
  const [isTelemetryOverlayOpen, setIsTelemetryOverlayOpen] = useState<boolean>(false);
  const [selectedAircraftDossier, setSelectedAircraftDossier] = useState<AircraftDossier | null>(() =>
    getAircraftDossier({
      id: 'tanker-910',
      name: 'Tanker 910 (DC-10 Air Tanker)',
      category: 'air_tanker',
      modelOrType: 'McDonnell Douglas DC-10-30 VLAT',
      callsign: 'TANKER-910',
      lat: 34.32,
      lng: -118.06,
    })
  );
  const [activeLiveModal, setActiveLiveModal] = useState<{
    title: string;
    sensor: string;
    desc: string;
    assetName: string;
    baseCode?: string;
    weather?: { tempF: number; windKts: number; windDir: string; rhPct: number };
    lat?: number;
    lng?: number;
  } | null>(null);

  // Web Audio Context for War Room Clicks/Beeps
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = (freq: number = 880, type: OscillatorType = 'sine', duration: number = 0.05) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
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
      // Audio unsupported or restricted
    }
  };



  // Comprehensive statewide dataset of wildfire aviation assets & fires
  const wildfireAssets: WildfireAsset[] = useMemo(() => [
    // --- AIR TANKERS (VLAT & LAT FLEET) ---
    {
      id: 'tanker-910',
      name: 'Tanker 910 (DC-10 Air Tanker)',
      category: 'air_tanker',
      modelOrType: 'McDonnell Douglas DC-10-30 VLAT',
      callsign: 'TANKER-910',
      lat: 34.32,
      lng: -118.06,
      heading: 118,
      speedKnots: 275,
      altitudeFt: 4600,
      status: 'Retardant Drop',
      baseLocation: 'Victorville VLAT Logistics Hub (VCV)',
      payloadCapacityGal: 9400,
      currentPayloadGal: 9400,
      dropSystem: 'Triple-Barrel Computerized Constant Flow (Coverage Level 8)',
      frequency: '124.625 MHz (Air Tactical)',
      assignedIncident: 'Angeles Crest Fire Complex',
      missionSummary: 'VLAT heavy retardant barrier run along ridge crest to protect critical high-voltage transmission lines.',
      telemetry: {
        Airframe: 'DC-10-30',
        DropSpeed: '142 kts',
        CoverageLevel: 'CL-8',
        LineLength: '1.2 Miles',
        TurnaroundAvg: '21.4 min',
      },
      vectorTrail: [
        { lat: 34.55, lng: -118.35 },
        { lat: 34.45, lng: -118.20 },
        { lat: 34.32, lng: -118.06 }
      ],
      liveFeedTitle: 'OPTICAL CAM // TANKER-910 NOSE FLIR',
      liveFeedSensor: 'HD LWIR Thermal Infrared 1080p60 · FLIR Star SAFIRE 380-HD',
      liveFeedDesc: 'Real-time forward targeting crosshair aligned with Angeles Crest ridgeline prior to 9,400 gal retardant drop valve release.'
    },
    {
      id: 'tanker-912',
      name: 'Tanker 912 (DC-10 Air Tanker #2)',
      category: 'air_tanker',
      modelOrType: 'McDonnell Douglas DC-10-30 VLAT',
      callsign: 'TANKER-912',
      lat: 37.36,
      lng: -120.56,
      heading: 325,
      speedKnots: 280,
      altitudeFt: 7200,
      status: 'In Flight',
      baseLocation: 'Castle Airport Logistics Base (MER)',
      payloadCapacityGal: 9400,
      currentPayloadGal: 9400,
      dropSystem: 'Computerized Constant Flow Gravity Drop System',
      frequency: '124.625 MHz (NorCal Tac)',
      assignedIncident: 'Dixie Ridge Secondary Fire',
      missionSummary: 'Pre-positioned VLAT surge asset responding to North Ops request for heavy ridgeline suppression.',
      telemetry: {
        Airframe: 'DC-10-30',
        DropSpeed: '144 kts',
        CoverageLevel: 'CL-8',
        LineLength: '1.2 Miles',
        TurnaroundAvg: '22.0 min',
      },
      vectorTrail: [
        { lat: 37.10, lng: -120.30 },
        { lat: 37.25, lng: -120.45 },
        { lat: 37.36, lng: -120.56 }
      ],
      liveFeedTitle: 'OPTICAL CAM // TANKER-912 COCKPIT FORWARD FLIR',
      liveFeedSensor: 'Ultra-HD Thermal LWIR Sensor 1080p60 · FLIR Star SAFIRE',
      liveFeedDesc: 'Central Valley corridor climb profile en route to Dixie Ridge incident box.'
    },
    {
      id: 'tanker-118',
      name: 'Tanker 118 (C-130H Hercules)',
      category: 'air_tanker',
      modelOrType: 'Lockheed C-130H Hercules',
      callsign: 'TANKER-118',
      lat: 38.65,
      lng: -121.40,
      heading: 38,
      speedKnots: 245,
      altitudeFt: 6200,
      status: 'In Flight',
      baseLocation: 'McClellan Tanker Base (MCC)',
      payloadCapacityGal: 4000,
      currentPayloadGal: 4000,
      dropSystem: 'MAFFS II Modular Airborne FireFighting System',
      frequency: '122.925 MHz (NorCal Ops)',
      assignedIncident: 'Dixie Ridge Secondary Fire',
      missionSummary: 'En route northward following Feather River canyon vector for containment line reinforcement.',
      telemetry: {
        Airframe: 'C-130H',
        DropSpeed: '135 kts',
        CoverageLevel: 'CL-6',
        LineLength: '0.8 Miles',
        TurnaroundAvg: '18.1 min',
      },
      vectorTrail: [
        { lat: 38.45, lng: -121.60 },
        { lat: 38.55, lng: -121.50 },
        { lat: 38.65, lng: -121.40 }
      ],
      liveFeedTitle: 'AFT CARGO RAMP CAM // TANKER-118 MAFFS II',
      liveFeedSensor: 'High-Speed Optical Telemetry · 60 FPS',
      liveFeedDesc: 'Rearward camera monitoring pressurized retardant dispersal nozzles over Sacramento Valley corridor.'
    },
    {
      id: 'tanker-116',
      name: 'Tanker 116 (CAL FIRE HC-130H Hercules)',
      category: 'air_tanker',
      modelOrType: 'Lockheed HC-130H Hercules (Coulson RADS-XXL)',
      callsign: 'TANKER-116',
      lat: 40.25,
      lng: -121.90,
      heading: 320,
      speedKnots: 250,
      altitudeFt: 5800,
      status: 'Retardant Drop',
      baseLocation: 'Chico Air Attack Base (CIC)',
      payloadCapacityGal: 4000,
      currentPayloadGal: 4000,
      dropSystem: 'Coulson RADS-XXL 4,000-Gal Constant Flow System',
      frequency: '122.925 MHz (Cal Fire Air-to-Ground)',
      assignedIncident: 'Shasta Complex Wildfire',
      missionSummary: 'Direct drop sequence supporting Division Charlie perimeter; heavy 4,000-gallon line reinforcement.',
      telemetry: {
        Airframe: 'HC-130H',
        DropSpeed: '130 kts',
        CoverageLevel: 'CL-8 Maximum',
        LineLength: '0.9 Miles',
        TurnaroundAvg: '17.4 min',
      },
      vectorTrail: [
        { lat: 40.05, lng: -121.75 },
        { lat: 40.15, lng: -121.82 },
        { lat: 40.25, lng: -121.90 }
      ],
      liveFeedTitle: 'FORWARD FLIR CAM // TANKER-116 HC-130H',
      liveFeedSensor: 'Long-Wave Infrared Optical Array 1080p60',
      liveFeedDesc: 'Thermal imaging camera tracking ridge retardant line over timber canopy in Tehama County.'
    },
    {
      id: 'tanker-131',
      name: 'Tanker 131 (C-130H Hercules MAFFS II)',
      category: 'air_tanker',
      modelOrType: 'Lockheed C-130H Hercules (USAF/USFS MAFFS II)',
      callsign: 'TANKER-131',
      lat: 34.65,
      lng: -119.25,
      heading: 145,
      speedKnots: 255,
      altitudeFt: 6400,
      status: 'In Flight',
      baseLocation: 'Channel Islands Air Guard Station / Point Mugu',
      payloadCapacityGal: 4000,
      currentPayloadGal: 4000,
      dropSystem: 'MAFFS II Modular Airborne FireFighting System (4,000 Gallon)',
      frequency: '123.075 MHz (SoCal Air Attack)',
      assignedIncident: 'Canyon Fire Initial Attack',
      missionSummary: 'Tactical ridge retardant line reinforcement in Topatopa mountains; rapid turnaround out of Channel Islands staging base.',
      telemetry: {
        Airframe: 'C-130H MAFFS',
        DropSpeed: '138 kts',
        CoverageLevel: 'CL-6',
        LineLength: '0.85 Miles',
        TurnaroundAvg: '18.8 min',
      },
      vectorTrail: [
        { lat: 34.85, lng: -119.45 },
        { lat: 34.75, lng: -119.35 },
        { lat: 34.65, lng: -119.25 }
      ],
      liveFeedTitle: 'MAFFS II DISCHARGE NOZZLE CAM // TANKER-131',
      liveFeedSensor: 'High-Cadence Optical Sensor · 60 FPS HD',
      liveFeedDesc: 'Port side paratroop door retardant nozzle camera monitoring pressure dump readiness.'
    },
    {
      id: 'tanker-102',
      name: 'Tanker 102 (MD-87 LAT)',
      category: 'air_tanker',
      modelOrType: 'McDonnell Douglas MD-87',
      callsign: 'TANKER-102',
      lat: 39.80,
      lng: -121.50,
      heading: 235,
      speedKnots: 260,
      altitudeFt: 5100,
      status: 'In Flight',
      baseLocation: 'Chico Air Attack Base (CIC)',
      payloadCapacityGal: 3000,
      currentPayloadGal: 3000,
      dropSystem: 'RADS-II Constant Flow External Tank',
      frequency: '123.975 MHz',
      assignedIncident: 'Dixie Ridge Secondary Fire',
      missionSummary: 'Flank containment sweep on west ridge flank; sequenced 3 minutes behind Lead Plane 51.',
      telemetry: {
        Airframe: 'MD-87',
        DropSpeed: '140 kts',
        CoverageLevel: 'CL-6',
        LineLength: '0.7 Miles',
        TurnaroundAvg: '15.4 min',
      },
      vectorTrail: [
        { lat: 39.95, lng: -121.30 },
        { lat: 39.88, lng: -121.40 },
        { lat: 39.80, lng: -121.50 }
      ]
    },
    {
      id: 'tanker-80',
      name: 'Tanker 80 (S-2T Turbo Tracker)',
      category: 'air_tanker',
      modelOrType: 'Grumman S-2T Turbo Tracker',
      callsign: 'TANKER-80',
      lat: 40.75,
      lng: -122.35,
      heading: 310,
      speedKnots: 215,
      altitudeFt: 3900,
      status: 'Retardant Drop',
      baseLocation: 'Redding Air Attack Base (RDD)',
      payloadCapacityGal: 1200,
      currentPayloadGal: 1200,
      dropSystem: 'Cal Fire Computer-Controlled Constant Flow',
      frequency: '124.050 MHz',
      assignedIncident: 'Shasta Complex Wildfire',
      missionSummary: 'Initial attack precision drops along division Alpha access road to protect evacuation corridor.',
      telemetry: {
        Airframe: 'S-2T',
        DropSpeed: '125 kts',
        CoverageLevel: 'CL-4',
        LineLength: '0.4 Miles',
        TurnaroundAvg: '14.2 min',
      },
      vectorTrail: [
        { lat: 40.55, lng: -122.25 },
        { lat: 40.65, lng: -122.30 },
        { lat: 40.75, lng: -122.35 }
      ]
    },
    {
      id: 'tanker-96',
      name: 'Tanker 96 (S-2T Turbo Tracker)',
      category: 'air_tanker',
      modelOrType: 'Grumman S-2T Turbo Tracker',
      callsign: 'TANKER-96',
      lat: 35.85,
      lng: -121.20,
      heading: 195,
      speedKnots: 220,
      altitudeFt: 4200,
      status: 'In Flight',
      baseLocation: 'Paso Robles Air Attack Base (PRB)',
      payloadCapacityGal: 1200,
      currentPayloadGal: 1200,
      dropSystem: 'Cal Fire Computer-Controlled Constant Flow',
      frequency: '123.825 MHz',
      assignedIncident: 'Big Sur Coastal Wilderness Fire',
      missionSummary: 'Navigating coastal canyon winds for drop over Highway 1 eastern firebreak barrier.',
      telemetry: {
        Airframe: 'S-2T',
        DropSpeed: '125 kts',
        CoverageLevel: 'CL-4',
        LineLength: '0.4 Miles',
        TurnaroundAvg: '16.9 min',
      },
      vectorTrail: [
        { lat: 36.10, lng: -121.40 },
        { lat: 35.98, lng: -121.30 },
        { lat: 35.85, lng: -121.20 }
      ]
    },
    {
      id: 'tanker-160',
      name: 'Tanker 160 (RJ85 Air Tanker)',
      category: 'air_tanker',
      modelOrType: 'Avro RJ85 Airtanker',
      callsign: 'TANKER-160',
      lat: 33.30,
      lng: -116.85,
      heading: 145,
      speedKnots: 255,
      altitudeFt: 5400,
      status: 'Initial Attack',
      baseLocation: 'Ramona Air Attack Base (RNM)',
      payloadCapacityGal: 3100,
      currentPayloadGal: 3100,
      dropSystem: 'Retardant Aerial Delivery Tank (RADS)',
      frequency: '122.975 MHz',
      assignedIncident: 'Cleveland National Forest Fire',
      missionSummary: 'Hot-spot containment line on southern flank to halt wind-driven brush run.',
      telemetry: {
        Airframe: 'RJ85',
        DropSpeed: '135 kts',
        CoverageLevel: 'CL-6',
        LineLength: '0.7 Miles',
        TurnaroundAvg: '17.3 min',
      },
      vectorTrail: [
        { lat: 33.50, lng: -117.00 },
        { lat: 33.40, lng: -116.92 },
        { lat: 33.30, lng: -116.85 }
      ]
    },

    // --- HELITACK & HEAVY HELITANKERS ---
    {
      id: 'heli-106',
      name: 'Copter 106 (S-70i Firehawk)',
      category: 'helicopter',
      modelOrType: 'Sikorsky S-70i Cal Fire Firehawk',
      callsign: 'COPTER-106',
      lat: 38.85,
      lng: -122.75,
      heading: 75,
      speedKnots: 130,
      altitudeFt: 2200,
      status: 'Retardant Drop',
      baseLocation: 'Boggs Mountain Helitack Base',
      payloadCapacityGal: 1000,
      currentPayloadGal: 850,
      dropSystem: 'Retractable Snorkel + 1,000-gal Belly Tank',
      frequency: '123.025 MHz',
      assignedIncident: 'Mendocino Lightning Strike Cluster',
      missionSummary: 'Hover dip from Lake Berryessa reservoir, executing rapid direct water drops on steep draws.',
      telemetry: {
        Airframe: 'S-70i',
        HoverDipTime: '45 sec',
        DropsPerHour: '8 Sorties',
        Crew: '2 Pilots + 10 Helitack',
        TurnaroundAvg: '7.8 min',
      },
      vectorTrail: [
        { lat: 38.75, lng: -122.90 },
        { lat: 38.80, lng: -122.82 },
        { lat: 38.85, lng: -122.75 }
      ],
      liveFeedTitle: 'PILOT HUD OPTICAL // COPTER-106',
      liveFeedSensor: 'Belly Cam + Snorkel Fill Telemetry · 1080p',
      liveFeedDesc: 'Hover water intake sequence over Lake Berryessa, refilling 1,000 gallons in 42 seconds.'
    },
    {
      id: 'heli-501',
      name: 'Copter 501 (CH-47D Chinook Helitanker)',
      category: 'helicopter',
      modelOrType: 'Boeing CH-47D Chinook',
      callsign: 'COPTER-501',
      lat: 36.65,
      lng: -119.50,
      heading: 110,
      speedKnots: 140,
      altitudeFt: 3100,
      status: 'Initial Attack',
      baseLocation: 'Fresno Yosemite Air Attack Base (FAT)',
      payloadCapacityGal: 2600,
      currentPayloadGal: 2600,
      dropSystem: 'Internal Retardant Tank with High-Volume Snorkel',
      frequency: '124.150 MHz',
      assignedIncident: 'Sequoia Lightning Complex',
      missionSummary: 'Heavy water drops targeting high-intensity timber torching in rugged Sierra canyons.',
      telemetry: {
        Airframe: 'CH-47D',
        HoverDipTime: '60 sec',
        DropsPerHour: '6 Sorties',
        Payload: '21,000 lbs',
        TurnaroundAvg: '11.5 min',
      },
      vectorTrail: [
        { lat: 36.75, lng: -119.70 },
        { lat: 36.70, lng: -119.60 },
        { lat: 36.65, lng: -119.50 }
      ]
    },
    {
      id: 'heli-902',
      name: 'Copter 902 (UH-1H Super Huey)',
      category: 'helicopter',
      modelOrType: 'Bell UH-1H Super Huey',
      callsign: 'COPTER-902',
      lat: 40.90,
      lng: -124.10,
      heading: 15,
      speedKnots: 115,
      altitudeFt: 1800,
      status: 'In Flight',
      baseLocation: 'Humboldt Bay Ops Base',
      payloadCapacityGal: 360,
      currentPayloadGal: 360,
      dropSystem: '360-gal Bambi Bucket',
      frequency: '122.850 MHz',
      assignedIncident: 'Shasta Complex Wildfire',
      missionSummary: 'Coastal recon & smokejumper crew deployment over Redwood ridge perimeter.',
      telemetry: {
        Airframe: 'UH-1H',
        Crew: '2 Crew + 7 Helitack',
        TurnaroundAvg: '9.2 min',
      },
      vectorTrail: [
        { lat: 40.75, lng: -124.15 },
        { lat: 40.82, lng: -124.12 },
        { lat: 40.90, lng: -124.10 }
      ]
    },
    {
      id: 'heli-408',
      name: 'Copter 408 (CH-54 Skycrane)',
      category: 'helicopter',
      modelOrType: 'Sikorsky S-64 / CH-54 Tarhe Skycrane',
      callsign: 'COPTER-408',
      lat: 34.25,
      lng: -118.45,
      heading: 90,
      speedKnots: 125,
      altitudeFt: 2900,
      status: 'Retardant Drop',
      baseLocation: 'Van Nuys Tanker Base / Fox Field',
      payloadCapacityGal: 2500,
      currentPayloadGal: 2400,
      dropSystem: 'Power-Fill Sea Snorkel + Retardant Cannon',
      frequency: '123.450 MHz',
      assignedIncident: 'Angeles Crest Fire Complex',
      missionSummary: 'Direct suppressant deluge on canyon structure protection line in La Crescenta foothills.',
      telemetry: {
        Airframe: 'S-64E',
        PumpingRate: '2,500 gal in 45s',
        CoverageLevel: 'CL-8',
        TurnaroundAvg: '8.5 min',
      },
      vectorTrail: [
        { lat: 34.20, lng: -118.60 },
        { lat: 34.22, lng: -118.52 },
        { lat: 34.25, lng: -118.45 }
      ]
    },

    // --- AIR TACTICAL & LEAD RECON ---
    {
      id: 'recon-140',
      name: 'Air Attack 140 (OV-10A Bronco)',
      category: 'recon_lead',
      modelOrType: 'North American Rockwell OV-10A Bronco',
      callsign: 'AIR ATTACK 140',
      lat: 40.40,
      lng: -122.10,
      heading: 280,
      speedKnots: 190,
      altitudeFt: 7500,
      status: 'In Flight',
      baseLocation: 'Redding Air Attack Base (RDD)',
      frequency: '126.025 MHz (NorCal ATGS Primary)',
      assignedIncident: 'Shasta Complex Wildfire',
      missionSummary: 'Air Tactical Group Supervisor (ATGS) directing drop pattern sequencing for Tanker 80 and Tanker 118.',
      telemetry: {
        Airframe: 'OV-10A',
        Role: 'Air Tactical Group Supervisor',
        Endurance: '4.5 Hours',
        FlockControlled: '6 Aircraft',
      },
      vectorTrail: [
        { lat: 40.30, lng: -121.90 },
        { lat: 40.35, lng: -122.00 },
        { lat: 40.40, lng: -122.10 }
      ]
    },
    {
      id: 'recon-lead51',
      name: 'Lead Plane 51 (King Air 200)',
      category: 'recon_lead',
      modelOrType: 'Beechcraft Super King Air 200',
      callsign: 'LEAD-51',
      lat: 39.95,
      lng: -121.30,
      heading: 215,
      speedKnots: 210,
      altitudeFt: 5800,
      status: 'In Flight',
      baseLocation: 'Chico Air Attack Base (CIC)',
      frequency: '123.975 MHz',
      assignedIncident: 'Dixie Ridge Secondary Fire',
      missionSummary: 'Laying lead smoke markers for Tanker 102 (MD-87) over steep terrain ridge line.',
      telemetry: {
        Airframe: 'King Air B200',
        SmokeSystem: 'Puff Smoke Oil Injector',
        LeadSeparation: '45 seconds',
      },
      vectorTrail: [
        { lat: 40.10, lng: -121.15 },
        { lat: 40.02, lng: -121.22 },
        { lat: 39.95, lng: -121.30 }
      ]
    },

    // --- NASA FIRMS ACTIVE WILDFIRE PERIMETERS ---
    {
      id: 'fire-shasta',
      name: 'Shasta Complex Wildfire',
      category: 'wildfire',
      modelOrType: 'Timber / Heavy Slash Complex',
      callsign: 'SHASTA-COMPLEX',
      lat: 40.85,
      lng: -122.45,
      heading: 45,
      status: 'Active Burn',
      acreage: 4820,
      containmentPercent: 15,
      fuelModel: 'Fuel Model 10 (Dense Mixed Conifer / Understory)',
      frequency: '132.450 MHz',
      missionSummary: 'Rapid uphill expansion driven by 24 mph ridgetop gusts. Critical threat to highway 5 corridor and transmission lines.',
      telemetry: {
        ThermalHotspots: '342 FIRMS Pixels',
        FireRadiativePower: '184.2 MW',
        FlameLengths: '12-25 ft',
        RateOfSpread: '28 ch/hr',
        CommittedAirAssets: '4 Air Tankers, 2 Helitack',
      },
      liveFeedTitle: 'NASA FIRMS / SENTINEL-2A MULTISPECTRAL IR',
      liveFeedSensor: 'Shortwave Infrared (SWIR) 2.2 µm · 20m Spatial Res',
      liveFeedDesc: 'Intense crown fire runs illuminating eastern ridge flume; high fire radiative power (184 MW).'
    },
    {
      id: 'fire-dixie',
      name: 'Dixie Ridge Secondary Fire',
      category: 'wildfire',
      modelOrType: 'Timber / Chaparral Mountain Fire',
      callsign: 'DIXIE-RIDGE',
      lat: 39.90,
      lng: -121.20,
      heading: 65,
      status: 'Active Burn',
      acreage: 2940,
      containmentPercent: 30,
      fuelModel: 'Fuel Model 4 (High Chaparral / Pine)',
      frequency: '123.975 MHz',
      missionSummary: 'Steep canyon fire with rolling burning debris generating spot fires across river barrier.',
      telemetry: {
        ThermalHotspots: '215 FIRMS Pixels',
        FireRadiativePower: '96.5 MW',
        FlameLengths: '8-16 ft',
        RateOfSpread: '18 ch/hr',
        CommittedAirAssets: '2 Air Tankers, 1 Lead Plane',
      }
    },
    {
      id: 'fire-angeles',
      name: 'Angeles Crest Fire Complex',
      category: 'wildfire',
      modelOrType: 'Chaparral / Mountain Foothill',
      callsign: 'ANGELES-CREST',
      lat: 34.30,
      lng: -118.10,
      heading: 130,
      status: 'Active Burn',
      acreage: 1420,
      containmentPercent: 40,
      fuelModel: 'Fuel Model 4 (Old Growth Chamise / Ceanothus)',
      frequency: '124.625 MHz',
      missionSummary: 'Active crown run in steep drainage above residential interface; Tanker 910 VLAT retardant line holding.',
      telemetry: {
        ThermalHotspots: '128 FIRMS Pixels',
        FireRadiativePower: '68.0 MW',
        FlameLengths: '10-20 ft',
        RateOfSpread: '22 ch/hr',
        CommittedAirAssets: 'Tanker 910, Copter 408',
      }
    },
    {
      id: 'fire-bigsur',
      name: 'Big Sur Coastal Wilderness Fire',
      category: 'wildfire',
      modelOrType: 'Coastal Scrub / Redwood Canyon',
      callsign: 'BIG-SUR-COAST',
      lat: 36.15,
      lng: -121.65,
      heading: 330,
      status: 'Active Burn',
      acreage: 890,
      containmentPercent: 20,
      fuelModel: 'Fuel Model 5 (Coastal Sage / Maritime Chaparral)',
      frequency: '123.825 MHz',
      missionSummary: 'Inaccessible ocean cliff terrain; suppression completely reliant on aerial retardant delivery and helicopter bucket drops.',
      telemetry: {
        ThermalHotspots: '62 FIRMS Pixels',
        FireRadiativePower: '34.8 MW',
        FlameLengths: '6-12 ft',
        RateOfSpread: '14 ch/hr',
        CommittedAirAssets: 'Tanker 96',
      }
    },
    {
      id: 'fire-mendo',
      name: 'Mendocino Lightning Strike Cluster',
      category: 'wildfire',
      modelOrType: 'Oak Woodland / Dry Grass',
      callsign: 'MENDO-LIGHTNING',
      lat: 39.20,
      lng: -123.10,
      heading: 90,
      status: 'Active Burn',
      acreage: 180,
      containmentPercent: 0,
      fuelModel: 'Fuel Model 1 (Short Grass / Oak)',
      frequency: '123.025 MHz',
      missionSummary: 'New ignition verified via satellite infrared; Copter 106 committed for initial attack containment.',
      telemetry: {
        ThermalHotspots: '18 FIRMS Pixels',
        FireRadiativePower: '12.4 MW',
        FlameLengths: '4-8 ft',
        RateOfSpread: '35 ch/hr',
        CommittedAirAssets: 'Copter 106 Firehawk',
      }
    },
    {
      id: 'fire-cleveland',
      name: 'Cleveland National Forest Fire',
      category: 'wildfire',
      modelOrType: 'Desert Transition / Heavy Brush',
      callsign: 'CLEVELAND-FIRE',
      lat: 33.45,
      lng: -116.70,
      heading: 160,
      status: 'Active Burn',
      acreage: 650,
      containmentPercent: 55,
      fuelModel: 'Fuel Model 4 (Manzanita / Scrub Oak)',
      frequency: '122.975 MHz',
      missionSummary: 'Southern California inland thermal surge; Tanker 160 establishing drop barrier ahead of wind shift.',
      telemetry: {
        ThermalHotspots: '45 FIRMS Pixels',
        FireRadiativePower: '28.1 MW',
        FlameLengths: '6-14 ft',
        RateOfSpread: '16 ch/hr',
        CommittedAirAssets: 'Tanker 160 RJ85',
      }
    },
    {
      id: 'fire-sequoia',
      name: 'Sequoia Lightning Complex',
      category: 'wildfire',
      modelOrType: 'High Sierra Timber / Giant Sequoia Grove',
      callsign: 'SEQUOIA-LIGHTNING',
      lat: 36.50,
      lng: -118.60,
      heading: 20,
      status: 'Active Burn',
      acreage: 1150,
      containmentPercent: 25,
      fuelModel: 'Fuel Model 10 (Red Fir / Lodgepole Pine)',
      frequency: '124.150 MHz',
      missionSummary: 'High-elevation wilderness protection; Copter 501 helitanker executing precision drops to defend ancient grove boundaries.',
      telemetry: {
        ThermalHotspots: '88 FIRMS Pixels',
        FireRadiativePower: '52.3 MW',
        FlameLengths: '8-18 ft',
        RateOfSpread: '12 ch/hr',
        CommittedAirAssets: 'Copter 501 Chinook',
      }
    }
  ], []);

  // Merge Cal Fire bases & Military bases as selectable WildfireAsset objects
  const baseAssets: WildfireAsset[] = useMemo(() => {
    return CALFIRE_AND_MILITARY_BASES.map((b) => ({
      id: b.id,
      name: b.name,
      category: b.type === 'military_base' ? 'military_base' : 'air_base',
      modelOrType: `${b.agency} · ${b.type === 'military_base' ? 'Defense Airfield' : 'Air Attack Base'}`,
      callsign: b.code,
      lat: b.lat,
      lng: b.lng,
      heading: 0,
      status: b.status === 'Active Reload' ? 'Retardant Drop' : 'Operational Base',
      baseLocation: `${b.region} (${b.elevationFt} ft MSL)`,
      payloadCapacityGal: b.retardantStorageGal,
      currentPayloadGal: b.currentMixGal,
      missionSummary: `${b.agency} ${b.region} air logistics facility. Pumping rate ${b.pumpingRateGpm} GPM across ${b.loadingPits} loading pits. Turnaround avg ${b.turnaroundAvgMin} min.`,
      telemetry: {
        RunwayLength: `${b.runwayFt.toLocaleString()} ft`,
        RetardantStorage: `${b.retardantStorageGal.toLocaleString()} gal Phos-Chek`,
        MixOnDeck: `${b.currentMixGal.toLocaleString()} gal (${Math.round((b.currentMixGal / b.retardantStorageGal) * 100)}%)`,
        PitsActive: `${b.activePitsOccupied} / ${b.loadingPits} Pits`,
        TurnaroundAvg: `${b.turnaroundAvgMin} min (SLA: ${b.slaTargetMin} min)`,
        Preparedness: b.preparednessLevel,
        AssignedFleet: b.assignedAircraft.join(', '),
      },
      liveFeedTitle: b.cameraTitle,
      liveFeedSensor: '1080p60 Optical Surveillance · CAL FIRE / DoD Live Link',
      liveFeedDesc: b.cameraDetail,
    }));
  }, []);

  // Combined asset pool
  const allCombinedAssets = useMemo(() => {
    return [...wildfireAssets, ...baseAssets];
  }, [wildfireAssets, baseAssets]);

  // Filter based on active filter button
  const filteredAssets = useMemo(() => {
    return allCombinedAssets.filter((asset) => {
      if (resourceFilter === 'all') return true;
      if (resourceFilter === 'c130') {
        return asset.modelOrType?.includes('C-130') || asset.callsign?.includes('118') || asset.callsign?.includes('116') || asset.callsign?.includes('131') || asset.name?.includes('C-130');
      }
      if (resourceFilter === 'tankers') return asset.category === 'air_tanker';
      if (resourceFilter === 'helicopters') return asset.category === 'helicopter';
      if (resourceFilter === 'wildfires') return asset.category === 'wildfire';
      if (resourceFilter === 'recon') return asset.category === 'recon_lead';
      if (resourceFilter === 'calfire_bases') return asset.category === 'air_base';
      if (resourceFilter === 'military_bases') return asset.category === 'military_base';
      return true;
    });
  }, [allCombinedAssets, resourceFilter]);

  // Selected asset
  const selectedAsset = useMemo(() => {
    return allCombinedAssets.find((a) => a.id === selectedAssetId) || wildfireAssets[0];
  }, [allCombinedAssets, selectedAssetId]);

  useEffect(() => {
    if (externalSelectedId && externalSelectedId !== selectedAssetId) {
      setSelectedAssetId(externalSelectedId);
    }
  }, [externalSelectedId]);

  // ViewBox presets for sector zoom
  const sectorViewBox = useMemo(() => {
    switch (sectorPreset) {
      case 'norcal':
        return { x: 30, y: 10, width: 440, height: 320, name: 'NORCAL CASCADE SECTOR' };
      case 'central':
        return { x: 130, y: 160, width: 460, height: 330, name: 'CENTRAL SIERRA & BAY SECTOR' };
      case 'socal':
        return { x: 320, y: 300, width: 460, height: 320, name: 'SOCAL ANGELES & SAN DIEGO SECTOR' };
      case 'statewide':
      default:
        return { x: 0, y: 0, width: 800, height: 600, name: 'STATEWIDE CALIFORNIA THEATER' };
    }
  }, [sectorPreset]);

  // Dynamic Theme Styling
  const themeColors = useMemo(() => {
    switch (colorTheme) {
      case 'flir':
        return {
          bg: '#0a0302',
          border: 'border-orange-900/60',
          ring: '#ea580c',
          textAccent: 'text-orange-400',
          landFill: '#1a0705',
          coastStroke: '#78350f',
          gridStroke: '#451a03',
          sweepGradient: 'sweepGradFlir',
          laserStroke: '#f97316',
          hudTitle: 'FLIR THERMAL INFRARED (LWIR)',
        };
      case 'nvg':
        return {
          bg: '#020d04',
          border: 'border-emerald-900/60',
          ring: '#16a34a',
          textAccent: 'text-emerald-400',
          landFill: '#041d0b',
          coastStroke: '#064e3b',
          gridStroke: '#064e3b',
          sweepGradient: 'sweepGradNvg',
          laserStroke: '#22c55e',
          hudTitle: 'NVG GEN-III NIGHT VISION PHOSPHOR',
        };
      case 'cyan':
      default:
        return {
          bg: '#030814',
          border: 'border-cyan-900/60',
          ring: '#0891b2',
          textAccent: 'text-cyan-400',
          landFill: '#061325',
          coastStroke: '#0e3a5a',
          gridStroke: '#0f2b48',
          sweepGradient: 'sweepGradCyan',
          laserStroke: '#38bdf8',
          hudTitle: 'AN/APG-83 ACTIVE PHASED ARRAY RADAR',
        };
    }
  }, [colorTheme]);

  // Aggregated Statewide Logistics & Readiness Metrics
  const statewideStats = useMemo(() => {
    const totalStorage = CALFIRE_AND_MILITARY_BASES.reduce((s, b) => s + b.retardantStorageGal, 0);
    const totalCurrentMix = CALFIRE_AND_MILITARY_BASES.reduce((s, b) => s + b.currentMixGal, 0);
    const totalPits = CALFIRE_AND_MILITARY_BASES.reduce((s, b) => s + b.loadingPits, 0);
    const occupiedPits = CALFIRE_AND_MILITARY_BASES.reduce((s, b) => s + b.activePitsOccupied, 0);
    const calfireCount = CALFIRE_AND_MILITARY_BASES.filter((b) => b.type !== 'military_base').length;
    const militaryCount = CALFIRE_AND_MILITARY_BASES.filter((b) => b.type === 'military_base').length;

    return { totalStorage, totalCurrentMix, totalPits, occupiedPits, calfireCount, militaryCount };
  }, []);

  return (
    <div className={`flex flex-col rounded-xl border ${themeColors.border} bg-slate-950 overflow-hidden shadow-2xl transition-colors`}>
      {/* 1. TOP TACTICAL WAR ROOM COMMAND BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-3 border-b border-slate-900 bg-slate-950/95 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-white text-sm">
                OSIRIS TACTICAL RADAR · PACIFIC DEFENSE & WILDFIRE THEATER
              </span>
              <span className="text-[10px] text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 hidden sm:inline">
                ALL CALIFORNIA COVERAGE
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              CAL FIRE NORTH/SOUTH OPS · 16 AIR ATTACK BASES · 8 MILITARY INSTALLATIONS · MAFFS II JOINT FLEET
            </span>
          </div>
        </div>

        {/* Global Controls & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Tab Switcher */}
          <div className="flex items-center rounded border border-slate-800 bg-black/60 p-0.5 text-[11px]">
            <button
              onClick={() => {
                setActiveTab('radar');
                playBeep(750, 'sine', 0.03);
              }}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeTab === 'radar' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tactical Map
            </button>
            <button
              onClick={() => {
                setActiveTab('allocation_matrix');
                playBeep(900, 'sine', 0.03);
              }}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeTab === 'allocation_matrix' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              Airbase Allocation
            </button>
            <button
              onClick={() => {
                setActiveTab('live_cameras');
                playBeep(1100, 'sine', 0.03);
              }}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'live_cameras' ? 'bg-red-500/20 text-red-300 font-bold border border-red-500/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3 h-3 text-red-400 animate-pulse" />
              <span>Live Feeds ({CALFIRE_AND_MILITARY_BASES.filter(b => b.cameraTitle).length + 4})</span>
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playBeep(soundEnabled ? 400 : 880, 'sine', 0.08);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-mono transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-900'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Tactical Audio Feedback"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'HUD AUDIO' : 'MUTED'}</span>
          </button>

          {/* Theme Selector */}
          <div className="flex items-center rounded border border-slate-800 bg-black/60 p-0.5 text-[10px]">
            {(['cyan', 'flir', 'nvg'] as RadarColorTheme[]).map((thm) => (
              <button
                key={thm}
                onClick={() => {
                  setColorTheme(thm);
                  playBeep(thm === 'flir' ? 950 : thm === 'nvg' ? 1100 : 800, 'sine', 0.04);
                }}
                className={`px-2 py-0.5 rounded uppercase font-bold transition-all cursor-pointer ${
                  colorTheme === thm
                    ? thm === 'flir'
                      ? 'bg-orange-500 text-slate-950'
                      : thm === 'nvg'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-cyan-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {thm === 'cyan' ? 'X-BAND' : thm === 'flir' ? 'FLIR' : 'NVG'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. LOGISTICS & ALLOCATION SUMMARY BANNER */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2 bg-black/60 border-b border-slate-900 text-[11px] font-mono text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>CALIFORNIA THEATER RESOURCE ALLOCATION:</span>
          <strong className="text-white font-bold">{statewideStats.calfireCount} Cal Fire Bases</strong>
          <span className="text-slate-600">·</span>
          <strong className="text-sky-400 font-bold">{statewideStats.militaryCount} Military Bases</strong>
          <span className="text-slate-600">·</span>
          <span>{statewideStats.occupiedPits} of {statewideStats.totalPits} Loading Pits Active</span>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-slate-400">
          <span>
            STATEWIDE RETARDANT STOCK: <strong className="text-amber-400 font-bold tabular-nums">{(statewideStats.totalCurrentMix / 1000).toFixed(1)}k / {(statewideStats.totalStorage / 1000).toFixed(1)}k Gal</strong> ({Math.round((statewideStats.totalCurrentMix / statewideStats.totalStorage) * 100)}%)
          </span>
          <span className="text-slate-700">|</span>
          <span>
            COMMITTED VLAT / MAFFS: <strong className="text-cyan-400 font-bold">8 Heavy Aircraft</strong>
          </span>
          <span className="text-slate-700">|</span>
          <span>
            STATE SLA TURNAROUND: <strong className="text-emerald-400 font-bold">16.2 min (Avg)</strong>
          </span>
        </div>
      </div>

      {/* 3. RADAR SUB-TOOLBAR (Sector, Resource Filter & Layer Toggles) */}
      {activeTab === 'radar' && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2 border-b border-slate-900/80 bg-slate-950/70 text-xs font-mono">
          {/* Sector Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-[10px] text-slate-500 font-bold mr-1 shrink-0 flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>SECTOR:</span>
            </span>
            {[
              { id: 'statewide', label: 'All California' },
              { id: 'norcal', label: 'NorCal / Shasta' },
              { id: 'central', label: 'Central / Sierra' },
              { id: 'socal', label: 'SoCal / Angeles' },
            ].map((sec) => (
              <button
                key={sec.id}
                onClick={() => {
                  setSectorPreset(sec.id as SectorPreset);
                  setRadarZoomScale(1.0);
                  playBeep(sec.id === 'statewide' ? 700 : 920, 'sine', 0.04);
                }}
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer whitespace-nowrap border ${
                  sectorPreset === sec.id
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold shadow-sm shadow-cyan-950'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {sec.label}
              </button>
            ))}

            {/* Tactical Zoom In / Out Controls */}
            <div className="flex items-center gap-1 ml-1 pl-2 border-l border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold mr-0.5 shrink-0 flex items-center gap-0.5">
                <Search className="w-3 h-3 text-cyan-400" />
                <span>ZOOM:</span>
              </span>
              <button
                onClick={() => {
                  setRadarZoomScale((z) => Math.min(6.0, +(z * 1.3).toFixed(2)));
                  playBeep(980, 'sine', 0.03);
                }}
                className="w-6 h-6 flex items-center justify-center rounded bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 font-bold transition-all cursor-pointer"
                title="Zoom In on Map (or scroll mouse wheel up)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setRadarZoomScale((z) => Math.max(0.7, +(z / 1.3).toFixed(2)));
                  playBeep(750, 'sine', 0.03);
                }}
                className="w-6 h-6 flex items-center justify-center rounded bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 font-bold transition-all cursor-pointer"
                title="Zoom Out on Map (or scroll mouse wheel down)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setRadarZoomScale(1.0);
                  playBeep(650, 'sine', 0.03);
                }}
                className="px-1.5 h-6 flex items-center justify-center rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white font-bold text-[10px] transition-all cursor-pointer uppercase"
                title="Reset Map Scale & Pan"
              >
                {Math.round(radarZoomScale * 100)}%
              </button>
            </div>
          </div>

          {/* Resource Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-[10px] text-slate-500 font-bold mr-1 shrink-0 flex items-center gap-1">
              <Flame className="w-3 h-3 text-red-500 animate-pulse" />
              <span>FILTER:</span>
            </span>
            {[
              { id: 'all', label: 'All Targets', count: allCombinedAssets.length },
              { id: 'c130', label: '🛩️ C-130 Fleet', count: allCombinedAssets.filter((a) => a.modelOrType?.includes('C-130') || a.callsign?.includes('118') || a.callsign?.includes('116') || a.callsign?.includes('131')).length },
              { id: 'tankers', label: '✈️ Tankers', count: allCombinedAssets.filter((a) => a.category === 'air_tanker').length },
              { id: 'helicopters', label: '🚁 Helitack', count: allCombinedAssets.filter((a) => a.category === 'helicopter').length },
              { id: 'wildfires', label: '🌋 Fires', count: allCombinedAssets.filter((a) => a.category === 'wildfire').length },
              { id: 'calfire_bases', label: '🔥 Cal Fire Bases', count: CALFIRE_AND_MILITARY_BASES.filter((b) => b.type !== 'military_base').length },
              { id: 'military_bases', label: '🛡️ Military Airfields', count: CALFIRE_AND_MILITARY_BASES.filter((b) => b.type === 'military_base').length },
              { id: 'recon', label: '🎯 Lead / Recon', count: allCombinedAssets.filter((a) => a.category === 'recon_lead').length },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  setResourceFilter(filter.id as ResourceFilter);
                  playBeep(840, 'triangle', 0.03);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer whitespace-nowrap border ${
                  resourceFilter === filter.id
                    ? 'bg-slate-800 border-slate-600 text-white font-bold'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-300'
                }`}
              >
                <span>{filter.label}</span>
                <span className="ml-1 opacity-60">({filter.count})</span>
              </button>
            ))}
          </div>

          {/* Layer and Mode Toggles */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {/* Interactive Icon Symbology & Recognition Key Toggle */}
            <button
              onClick={() => {
                setShowIconLegend(!showIconLegend);
                playBeep(showIconLegend ? 650 : 950, 'sine', 0.04);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                showIconLegend
                  ? 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-sm shadow-amber-950'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Toggle Tactical Icon Symbology & Recognition Key: Distinguish between every icon, shape, and operational role"
            >
              <Info className={`w-3 h-3 ${showIconLegend ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>ICON LEGEND ({showIconLegend ? 'OPEN' : 'CLOSED'})</span>
            </button>

            {/* Interactive Selection Mode Button */}
            <button
              onClick={() => {
                setIsSelectionModeActive(!isSelectionModeActive);
                playBeep(isSelectionModeActive ? 600 : 1000, 'triangle', 0.04);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                isSelectionModeActive
                  ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-950 ring-1 ring-cyan-500/50'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Interactive Target Lock: Click any aircraft icon on the radar to trigger detailed telemetry, flight hours & maintenance history overlay"
            >
              <Crosshair className={`w-3 h-3 ${isSelectionModeActive ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
              <span>TARGET LOCK: {isSelectionModeActive ? 'ACTIVE' : 'STANDBY'}</span>
            </button>

            {/* Canvas High-Density Fleet Surge Toggle */}
            <button
              onClick={() => {
                setHighDensityMode(!highDensityMode);
                playBeep(highDensityMode ? 650 : 1150, 'sawtooth', 0.05);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase transition-all cursor-pointer ${
                highDensityMode
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle High-Density Canvas Engine: Simulates thousands of active wildfire hotspots & air assets at 60 FPS"
            >
              <Activity className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>DENSITY: {highDensityMode ? '2,200+ SURGE (60FPS)' : 'STANDARD'}</span>
            </button>

            <button
              onClick={() => {
                setShowAirways(!showAirways);
                playBeep(700, 'sine', 0.03);
              }}
              className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                showAirways ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title="Federal Victor Airways & VOR Navigation Fixes (V23, V25, V107)"
            >
              AIRWAYS: {showAirways ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => {
                setShowWinds(!showWinds);
                playBeep(780, 'sine', 0.03);
              }}
              className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                showWinds ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title="Surface Meteorological Wind Barbs & Santa Ana/Diablo Vectors"
            >
              WINDS: {showWinds ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => {
                setShowClassBAirspace(!showClassBAirspace);
                playBeep(740, 'sine', 0.03);
              }}
              className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                showClassBAirspace ? 'bg-sky-950/60 border-sky-500 text-sky-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title="Class B Terminal Controlled Airspace Rings (SFO / LAX)"
            >
              CLASS B: {showClassBAirspace ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => {
                setShowRetardantDrops(!showRetardantDrops);
                playBeep(820, 'sine', 0.03);
              }}
              className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                showRetardantDrops ? 'bg-red-950/60 border-red-500 text-red-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title="Phos-Chek Active Retardant Drop Swaths & Dispersal Footprint"
            >
              DROPS: {showRetardantDrops ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => {
                setShowAirBases(!showAirBases);
                playBeep(750, 'sine', 0.03);
              }}
              className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                showAirBases ? 'bg-orange-950/60 border-orange-600 text-orange-300' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              BASES: {showAirBases ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => {
                setShowTFRZones(!showTFRZones);
                playBeep(800, 'sine', 0.03);
              }}
              className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                showTFRZones ? 'bg-red-950/60 border-red-500 text-red-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              TFRs: {showTFRZones ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => {
                setShowTopography(!showTopography);
                playBeep(720, 'sine', 0.03);
              }}
              className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                showTopography ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              TERRAIN: {showTopography ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => {
                setIsSweepActive(!isSweepActive);
                playBeep(isSweepActive ? 500 : 1050, 'sawtooth', 0.04);
              }}
              className={`px-2 py-0.5 rounded border font-bold uppercase transition-all cursor-pointer ${
                isSweepActive ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              SWEEP: {isSweepActive ? 'SCAN' : 'HOLD'}
            </button>
          </div>
        </div>
      )}

      {/* 4. MAIN CONTENT AREA */}
      {activeTab === 'radar' && (
        <div className="flex flex-col border border-slate-900 rounded-lg overflow-hidden bg-slate-950">
          {/* INTERACTIVE TACTICAL RADAR ICON SYMBOLOGY & RECOGNITION KEY */}
          {showIconLegend && (
            <div className="px-5 py-3 border-b border-slate-900 bg-slate-950/95 font-mono text-xs animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-900 mb-2.5">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white text-[11px] uppercase tracking-wide">
                    Tactical Icon Symbology &amp; Recognition Key
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans hidden md:inline">
                    Hover any icon card to illuminate matching assets across California; hover canvas icons to inspect live telemetry
                  </span>
                </div>
                <div className="text-[10px] text-cyan-400 font-sans flex items-center gap-2">
                  <span>{highlightedLegendCategory ? `Highlighting: ${highlightedLegendCategory.toUpperCase()}` : 'Hover icon for details'}</span>
                  {highlightedLegendCategory && (
                    <button
                      onClick={() => {
                        setHighlightedLegendCategory(null);
                        setActiveLegendDescription(null);
                      }}
                      className="text-slate-400 hover:text-white cursor-pointer underline text-[9px]"
                    >
                      Reset Highlight
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of 10 Recognizable Icon Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
                {[
                  {
                    id: 'c130',
                    filterKey: 'c130',
                    symbol: '🛩️',
                    title: 'C-130 Hercules',
                    sub: '4-Turboprop Heavy',
                    color: 'text-amber-300 border-amber-500/50 bg-amber-950/40',
                    desc: 'Lockheed C-130H tactical airframe with 4,000-gal MAFFS II pressurized constant-flow retardant nozzle. High-volume ridgeline barrier lines.',
                  },
                  {
                    id: 'air_tanker',
                    filterKey: 'tankers',
                    symbol: '✈️',
                    title: 'Air Tanker (VLAT/LAT)',
                    sub: 'Swept-Wing Jet',
                    color: 'text-sky-300 border-sky-500/50 bg-sky-950/40',
                    desc: 'McDonnell Douglas DC-10 VLAT (9,400 gal) and Grumman S-2T Tracker (1,200 gal). Lays Phos-Chek fire retardant ahead of wildfire front.',
                  },
                  {
                    id: 'helicopter',
                    filterKey: 'helicopters',
                    symbol: '🚁',
                    title: 'Helitack Copter',
                    sub: 'Rotor Snorkel / Bucket',
                    color: 'text-emerald-300 border-emerald-500/50 bg-emerald-950/40',
                    desc: 'CH-47D Chinook, S-64 Skycrane, and S-70i Firehawk. Surgical water/foam drops on canyon flare-ups and rapid smokejumper insertion.',
                  },
                  {
                    id: 'recon_lead',
                    filterKey: 'recon',
                    symbol: '🎯',
                    title: 'Lead / Bird Dog',
                    sub: 'Diamond Airframe',
                    color: 'text-cyan-300 border-cyan-500/50 bg-cyan-950/40',
                    desc: 'Air Tactical Group Supervisor (King Air 200, OV-10). Scouts drop corridors, lays trailing smoke markers, and directs TFR airspace.',
                  },
                  {
                    id: 'wildfire',
                    filterKey: 'wildfires',
                    symbol: '🌋',
                    title: 'Wildfire Incident',
                    sub: 'Pulsing Corona',
                    color: 'text-red-400 border-red-500/50 bg-red-950/40',
                    desc: 'Active wildland fire perimeter tracked by NASA FIRMS VIIRS/MODIS infrared satellite detections and airborne thermal imaging sensors.',
                  },
                  {
                    id: 'air_base',
                    filterKey: 'calfire_bases',
                    symbol: '🔥',
                    title: 'Cal Fire Airbase',
                    sub: 'Runway & Mix Pits',
                    color: 'text-orange-300 border-orange-500/50 bg-orange-950/40',
                    desc: 'State tactical reloading hub with high-volume Phos-Chek retardant mixing pits, aviation turbine fuel, and 15-minute turnaround SLA.',
                  },
                  {
                    id: 'military_base',
                    filterKey: 'military_bases',
                    symbol: '🛡️',
                    title: 'Military Airfield',
                    sub: 'Crossed DoD Runway',
                    color: 'text-blue-300 border-blue-500/50 bg-blue-950/40',
                    desc: 'Department of Defense installation supporting Air National Guard MAFFS wings, heavy C-17/C-130 transports, and federal staging.',
                  },
                  {
                    id: 'airway_fix',
                    filterKey: 'all',
                    symbol: '🧭',
                    title: 'Victor Airway VOR',
                    sub: 'Navigation Fix',
                    color: 'text-cyan-300 border-cyan-700/50 bg-cyan-950/30',
                    desc: 'Federal aviation VHF Omnidirectional Range navigation fix and victor airway intersection for tactical transit deconfliction.',
                  },
                  {
                    id: 'wind_station',
                    filterKey: 'all',
                    symbol: '💨',
                    title: 'Wind Station',
                    sub: 'Surface Anemometer',
                    color: 'text-amber-300 border-amber-700/50 bg-amber-950/30',
                    desc: 'Automated remote meteorological sensor measuring live wind speed, peak gusts, and direction (Diablo/Santa Ana fire spread vectors).',
                  },
                  {
                    id: 'mountain_peak',
                    filterKey: 'all',
                    symbol: '⛰️',
                    title: 'Mountain Peak',
                    sub: 'Topographical Summit',
                    color: 'text-slate-300 border-slate-700/60 bg-slate-900/40',
                    desc: 'Prominent mountain elevation obstacle. Monitored for mechanical wind shear, lee-side downdrafts, and terrain clearance.',
                  },
                ].map((iconItem) => {
                  const isHovered = highlightedLegendCategory === iconItem.id;
                  return (
                    <div
                      key={iconItem.id}
                      onMouseEnter={() => {
                        setHighlightedLegendCategory(iconItem.id);
                        setActiveLegendDescription(iconItem.desc);
                      }}
                      onMouseLeave={() => {
                        setHighlightedLegendCategory(null);
                        setActiveLegendDescription(null);
                      }}
                      onClick={() => {
                        if (iconItem.filterKey !== 'all') {
                          setResourceFilter(iconItem.filterKey as any);
                        }
                        playBeep(850, 'sine', 0.03);
                      }}
                      className={`p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between select-none ${
                        isHovered
                          ? `${iconItem.color} ring-2 ring-cyan-400 scale-102 shadow-lg shadow-cyan-950`
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">{iconItem.symbol}</span>
                        <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-black/40 text-slate-400">
                          IDENT
                        </span>
                      </div>
                      <div>
                        <h5 className="font-bold text-[10px] text-white truncate leading-tight">
                          {iconItem.title}
                        </h5>
                        <span className="text-[8.5px] text-slate-400 block truncate font-sans">
                          {iconItem.sub}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active Legend Description Callout Banner */}
              {activeLegendDescription && (
                <div className="mt-2.5 p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/80 text-[11px] text-cyan-200 font-sans flex items-center gap-2 animate-in fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
                  <span>
                    <strong className="text-cyan-300 font-mono text-[10px] uppercase mr-1">Operational Purpose:</strong>
                    {activeLegendDescription}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tactical Direct-Target Quick-Lock Ribbon */}
          <div className="border-b border-slate-900 bg-slate-950/95 px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs font-mono">
            <div className="flex items-center gap-2 overflow-x-auto max-w-full">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 shrink-0">
                <Target className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>DIRECT TARGET LOCK:</span>
              </span>
              <div className="flex items-center gap-1">
                {(['all', 'c130', 'tankers', 'helicopters', 'wildfires', 'calfire_bases'] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    onClick={() => {
                      setResourceFilter(filterKey);
                      playBeep(650, 'sine', 0.02);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      resourceFilter === filterKey
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : filterKey === 'c130'
                        ? 'bg-amber-950/60 text-amber-300 hover:text-white border border-amber-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {filterKey === 'all' ? 'ALL' : filterKey === 'c130' ? 'C-130' : filterKey.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick scrollable target chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-0.5">
              {filteredAssets.slice(0, 16).map((asset) => {
                const isSelected = selectedAssetId === asset.id;
                const isC130 = asset.modelOrType?.includes('C-130') || asset.callsign?.includes('118') || asset.callsign?.includes('116');
                return (
                  <button
                    key={asset.id}
                    onClick={() => {
                      setSelectedAssetId(asset.id);
                      if (onSelectAsset) onSelectAsset(asset);
                      playBeep(asset.category === 'wildfire' ? 1200 : asset.category === 'air_tanker' ? 880 : 700, 'sawtooth', 0.06);
                      if (asset.category === 'air_tanker' || asset.category === 'helicopter' || asset.category === 'recon_lead') {
                        const dossier = getAircraftDossier(asset);
                        if (dossier) {
                          setSelectedAircraftDossier(dossier);
                          setIsTelemetryOverlayOpen(true);
                        }
                      }
                    }}
                    className={`px-2.5 py-1 rounded border text-[11px] font-mono shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950 border-cyan-400 text-white ring-1 ring-cyan-400/50 shadow-md'
                        : isC130
                        ? 'bg-slate-900/95 border-amber-500/40 text-amber-200 hover:border-amber-400 hover:text-white'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {asset.category === 'wildfire' ? (
                      <Flame className="w-3 h-3 text-red-400 shrink-0" />
                    ) : asset.category === 'air_tanker' ? (
                      <Plane className={`w-3 h-3 ${isC130 ? 'text-amber-400' : 'text-cyan-400'} shrink-0`} />
                    ) : asset.category === 'helicopter' ? (
                      <Compass className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : (
                      <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                    )}
                    {isC130 && (
                      <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-amber-950 border border-amber-500/50 text-amber-300">
                        C-130
                      </span>
                    )}
                    <span className="font-bold">{asset.callsign}</span>
                    {asset.altitudeFt && (
                      <span className="text-[9px] text-slate-400">
                        {(asset.altitudeFt / 1000).toFixed(0)}k'
                      </span>
                    )}
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] relative overflow-hidden">
          {/* SVG RADAR & DETAILED CALIFORNIA MAP (Cols 1-8) */}
          <div className="lg:col-span-8 relative overflow-hidden select-none border-b lg:border-b-0 lg:border-r border-slate-900" style={{ backgroundColor: themeColors.bg }}>
            {/* CRT Scanline Overlay */}
            <div className="absolute inset-0 radar-scanlines pointer-events-none z-20 opacity-30" />

            {/* Tactical Corner HUD Overlays */}
            <div className="absolute top-3 left-4 z-30 pointer-events-none font-mono text-[9px] text-slate-400 leading-tight">
              <div className="flex items-center gap-1.5 font-bold tracking-wider text-white">
                <span className={`w-1.5 h-1.5 rounded-full ${colorTheme === 'flir' ? 'bg-orange-400' : colorTheme === 'nvg' ? 'bg-emerald-400' : 'bg-cyan-400'} animate-ping`} />
                <span>[ ⌖ ] {themeColors.hudTitle}</span>
              </div>
              <div className="text-slate-500 mt-0.5">STATEWIDE SENSOR FUSION // CAL FIRE TAC-NET // DOD LINK-16</div>

              {/* Interactive Target Selection & Scroll Zoom Mode Banner */}
              {isSelectionModeActive && (
                <div className="mt-1.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/85 border border-cyan-500/50 text-cyan-300 font-bold text-[9px] shadow-sm animate-pulse">
                  <Crosshair className="w-3 h-3 text-cyan-400" />
                  <span>TARGET LOCK MODE: SCROLL IN/OUT TO ZOOM · DRAG TO PAN · CLICK ANY INCIDENT OR RESOURCE</span>
                </div>
              )}
            </div>

            <div className="absolute top-3 right-4 z-30 pointer-events-none font-mono text-[9px] text-right text-slate-400 leading-tight">
              <div className="font-bold text-white tracking-wider">
                SECTOR: <strong className={themeColors.textAccent}>{sectorViewBox.name}</strong>
              </div>
              <div className="text-slate-500 mt-0.5">LAT 32.1°N - 42.1°N · LNG 125.0°W - 113.8°W</div>
            </div>

            <div className="absolute bottom-3 left-4 z-30 pointer-events-none font-mono text-[9px] text-slate-500 leading-tight">
              <span>PACIFIC BASIN CONTINENTAL MARGIN · BATHYMETRY MAPPED</span>
            </div>

            <div className="absolute bottom-3 right-4 z-30 pointer-events-none font-mono text-[9px] text-right text-slate-400 leading-tight bg-black/60 px-2 py-1 rounded border border-slate-800">
              <div>ENGINE: <strong className="text-cyan-400 font-bold">HTML5 CANVAS 2D (60 FPS)</strong></div>
              <div>TARGETS: <strong className="text-white font-bold">{highDensityMode ? `${(filteredAssets.length + 2200).toLocaleString()} (SURGE)` : filteredAssets.length}</strong></div>
            </div>

            {/* HIGH-PERFORMANCE CANVAS-BASED MAP ENGINE (THOUSANDS OF ASSET MARKERS AT 60 FPS) */}
            <CanvasTacticalRadarMap
              filteredAssets={filteredAssets}
              selectedAssetId={selectedAssetId}
              onSelectAsset={(asset) => {
                setSelectedAssetId(asset.id);
                if (onSelectAsset) onSelectAsset(asset);

                // If asset is an aircraft (tanker, helicopter, recon), trigger telemetry, flight hours & maintenance history overlay
                if (asset.category === 'air_tanker' || asset.category === 'helicopter' || asset.category === 'recon_lead') {
                  const dossier = getAircraftDossier(asset);
                  if (dossier) {
                    setSelectedAircraftDossier(dossier);
                    setIsTelemetryOverlayOpen(true);
                  }
                }
              }}
              colorTheme={colorTheme}
              sectorPreset={sectorPreset}
              isSweepActive={isSweepActive}
              sweepSpeed={sweepSpeed}
              showVectorTrails={showVectorTrails}
              showTFRZones={showTFRZones}
              showTopography={showTopography}
              showHydrography={showHydrography}
              showAirBases={showAirBases}
              showMilitaryBases={showMilitaryBases}
              showAirways={showAirways}
              showWinds={showWinds}
              showClassBAirspace={showClassBAirspace}
              showRetardantDrops={showRetardantDrops}
              highDensityMode={highDensityMode}
              densityMultiplier={2200}
              onPlayBeep={playBeep}
              externalZoomScale={radarZoomScale}
              onZoomChange={setRadarZoomScale}
              highlightedIconCategory={highlightedLegendCategory}
            />
          </div>

          {/* RIGHT TACTICAL DOSSIER & LIVE FEED PREVIEW (Cols 9-12) */}
          <div className="lg:col-span-4 bg-slate-950 p-5 flex flex-col justify-between space-y-4 font-mono text-xs">
            {selectedAsset ? (
              <div className="space-y-4">
                {/* Asset Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-900">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                        TACTICAL DOSSIER // {selectedAsset.category.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white tracking-wide mt-0.5">
                      {selectedAsset.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>{selectedAsset.modelOrType}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-cyan-300 font-bold">{selectedAsset.callsign}</span>
                    </div>
                  </div>

                  <div className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase shrink-0 border ${
                    selectedAsset.status === 'Retardant Drop' || selectedAsset.status === 'Active Burn'
                      ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
                      : 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                  }`}>
                    {selectedAsset.status}
                  </div>
                </div>

                {/* Inspect Aircraft Telemetry, Hours & Maintenance Button */}
                {(selectedAsset.category === 'air_tanker' || selectedAsset.category === 'helicopter' || selectedAsset.category === 'recon_lead') && (
                  <button
                    onClick={() => {
                      const dossier = getAircraftDossier(selectedAsset);
                      if (dossier) {
                        setSelectedAircraftDossier(dossier);
                        setIsTelemetryOverlayOpen(true);
                        playBeep(1000, 'sine', 0.05);
                      }
                    }}
                    className="w-full py-2.5 px-3 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/80 text-cyan-300 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-cyan-950/50 text-xs group"
                  >
                    <Sliders className="w-4 h-4 text-cyan-400 group-hover:rotate-90 transition-transform" />
                    <span>INSPECT TELEMETRY, FLIGHT HOURS & MAINTENANCE</span>
                  </button>
                )}

                {/* Live Camera View Trigger Banner (If asset has live camera feed) */}
                {selectedAsset.liveFeedTitle && (
                  <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
                      <div className="text-[10px]">
                        <span className="font-bold text-red-300 block">{selectedAsset.liveFeedTitle}</span>
                        <span className="text-slate-400">{selectedAsset.liveFeedSensor}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveLiveModal({
                          title: selectedAsset.liveFeedTitle!,
                          sensor: selectedAsset.liveFeedSensor || 'Optical Stream',
                          desc: selectedAsset.liveFeedDesc || selectedAsset.missionSummary,
                          assetName: selectedAsset.name
                        });
                        playBeep(1200, 'sine', 0.05);
                      }}
                      className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase transition-colors shrink-0 cursor-pointer"
                    >
                      OPEN LIVE VIEW
                    </button>
                  </div>
                )}

                {/* Mission Summary Box */}
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    OPERATIONAL PROFILE & STATUS:
                  </span>
                  {selectedAsset.missionSummary}
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {selectedAsset.payloadCapacityGal && (
                    <div className="p-2.5 rounded bg-slate-900/40 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">RETARDANT CAPACITY</span>
                      <span className="text-white font-bold tabular-nums">
                        {selectedAsset.currentPayloadGal?.toLocaleString()} / {selectedAsset.payloadCapacityGal?.toLocaleString()} Gal
                      </span>
                    </div>
                  )}

                  {selectedAsset.altitudeFt && (
                    <div className="p-2.5 rounded bg-slate-900/40 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">ALTITUDE / AIRSPEED</span>
                      <span className="text-white font-bold tabular-nums">
                        {selectedAsset.altitudeFt.toLocaleString()}' MSL · {selectedAsset.speedKnots} kts
                      </span>
                    </div>
                  )}

                  {selectedAsset.acreage && (
                    <div className="p-2.5 rounded bg-slate-900/40 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">BURN ACREAGE</span>
                      <span className="text-red-400 font-bold tabular-nums">{selectedAsset.acreage.toLocaleString()} Acres</span>
                    </div>
                  )}

                  {selectedAsset.containmentPercent !== undefined && (
                    <div className="p-2.5 rounded bg-slate-900/40 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">CONTAINMENT STATUS</span>
                      <span className="text-emerald-400 font-bold tabular-nums">{selectedAsset.containmentPercent}% Contained</span>
                    </div>
                  )}
                </div>

                {/* Telemetric Specifications List */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    TELEMETRIC LOGISTICS:
                  </span>
                  <div className="space-y-1 text-[11px]">
                    {Object.entries(selectedAsset.telemetry).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between py-1 border-b border-slate-900/80">
                        <span className="text-slate-400">{key}:</span>
                        <span className="text-white font-bold tabular-nums text-right">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-center py-12">
                Select any base, tanker, or wildfire to inspect live telemetry.
              </div>
            )}

            {/* Bottom Link Status */}
            <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
              <span>CAL FIRE STATEWIDE TAC-NET</span>
              <span className="text-cyan-400 font-bold">24 BASES LINKED NOMINAL</span>
            </div>
          </div>

          {/* Side Panel Overlay: Detailed Telemetry, Flight Hours, and Maintenance History */}
          {selectedAircraftDossier && (
            <AircraftTelemetryOverlay
              dossier={selectedAircraftDossier}
              isOpen={isTelemetryOverlayOpen}
              onClose={() => {
                setIsTelemetryOverlayOpen(false);
                playBeep(600, 'sine', 0.04);
              }}
              onOpenLiveCam={(cam) => {
                setActiveLiveModal({
                  title: cam.title,
                  sensor: cam.sensor,
                  desc: cam.desc,
                  assetName: cam.assetName,
                  baseCode: cam.baseCode,
                  lat: cam.lat,
                  lng: cam.lng,
                });
                playBeep(1200, 'sine', 0.05);
              }}
              onPlayBeep={playBeep}
            />
          )}
        </div>
      </div>
    )}

      {/* 5. TAB 2: AIRBASE ALLOCATION MATRIX VIEW */}
      {activeTab === 'allocation_matrix' && (
        <ResourceAllocationTable
          onOpenLiveCam={(base) => {
            setActiveLiveModal({
              title: base.cameraTitle,
              sensor: `${base.cameraType} · ${base.agency} Tactical Net`,
              desc: base.cameraDetail,
              assetName: base.name,
              baseCode: base.code,
              weather: base.weatherStation,
              lat: base.lat,
              lng: base.lng,
            });
            playBeep(1100, 'sine', 0.05);
          }}
          onPlayBeep={playBeep}
        />
      )}

      {/* 6. TAB 3: LIVE CAMERAS & OPTICAL FEEDS GRID */}
      {activeTab === 'live_cameras' && (
        <div className="p-5 space-y-5">
          <div className="pb-3 border-b border-slate-900">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Video className="w-4 h-4 text-red-500 animate-pulse" />
              <span>LIVE OPTICAL FEEDS & COCKPIT FLIR STREAMING</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live streaming viewpoints from Cal Fire tanker bases, aircraft nose-mount FLIR cameras, and military ISR satellites.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCombinedAssets.filter((a) => a.liveFeedTitle).map((asset) => (
              <div
                key={asset.id}
                className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden group hover:border-cyan-500/50 transition-all cursor-pointer"
                onClick={() => {
                  setActiveLiveModal({
                    title: asset.liveFeedTitle!,
                    sensor: asset.liveFeedSensor || 'Optical Stream',
                    desc: asset.liveFeedDesc || asset.missionSummary,
                    assetName: asset.name
                  });
                  playBeep(1000, 'sine', 0.05);
                }}
              >
                {/* Polished Ultra-HD Optical Sensor Preview Canvas */}
                <div className="relative h-40 bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800 group-hover:border-cyan-500/40 transition-colors">
                  {/* Atmospheric and Terrain Background Simulation */}
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black opacity-90" />
                  
                  {/* Subtle Horizon & Mountain Terrain Contour */}
                  <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 300 160" preserveAspectRatio="none">
                    <path d="M 0 90 L 50 70 L 110 85 L 170 65 L 230 80 L 300 70 L 300 160 L 0 160 Z" fill="#0f172a" />
                    <path d="M 0 115 L 70 100 L 150 110 L 220 95 L 300 105 L 300 160 L 0 160 Z" fill="#090d16" />
                    {/* Simulated Heat Plume or Runway light */}
                    {asset.category === 'wildfire' || asset.category === 'air_tanker' ? (
                      <g transform="translate(180, 80)">
                        <circle cx="0" cy="0" r="16" fill="rgba(239, 68, 68, 0.4)" className="animate-pulse" />
                        <circle cx="0" cy="0" r="6" fill="#f97316" />
                      </g>
                    ) : (
                      <g transform="translate(150, 110)">
                        <line x1="-80" y1="0" x2="80" y2="0" stroke="#eab308" strokeWidth="1" strokeDasharray="6 6" opacity="0.6" />
                        <circle cx="-60" cy="0" r="2" fill="#38bdf8" />
                        <circle cx="60" cy="0" r="2" fill="#38bdf8" />
                      </g>
                    )}
                  </svg>

                  {/* Scanline CRT overlay */}
                  <div className="absolute inset-0 radar-scanlines opacity-40 pointer-events-none" />
                  
                  {/* Camera Top HUD */}
                  <div className="absolute top-2 left-2.5 z-10 font-mono text-[9px] text-white flex items-center gap-1.5 bg-black/60 px-1.5 py-0.5 rounded border border-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-bold tracking-wider">{asset.callsign}</span>
                  </div>
                  <div className="absolute top-2 right-2.5 z-10 font-mono text-[9px] text-cyan-400 font-bold bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
                    4K · 60 FPS
                  </div>

                  {/* Centered Precision Optical Crosshair */}
                  <div className="relative z-10 text-center pointer-events-none">
                    <div className="w-14 h-14 rounded-full border border-cyan-400/40 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <div className="w-6 h-6 rounded-full border border-dashed border-cyan-300/60" />
                      <div className="w-1 h-1 rounded-full bg-cyan-400" />
                    </div>
                    <span className="text-[9px] font-mono text-cyan-200 mt-1 block font-bold tracking-wider drop-shadow">
                      {asset.liveFeedTitle}
                    </span>
                  </div>

                  {/* Bottom Camera Timestamp & Specs */}
                  <div className="absolute bottom-2 left-2.5 z-10 font-mono text-[8px] text-slate-300 bg-black/60 px-1.5 py-0.5 rounded">
                    LAT {asset.lat.toFixed(2)}°N · LNG {Math.abs(asset.lng).toFixed(2)}°W
                  </div>
                  <div className="absolute bottom-2 right-2.5 z-10 font-mono text-[8px] text-emerald-400 font-bold uppercase bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                    FLIR SAFIRE-HD
                  </div>
                </div>

                <div className="p-3">
                  <h4 className="text-xs font-bold text-white truncate">{asset.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {asset.liveFeedDesc || asset.missionSummary}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/80">
                    <span>{asset.category.replace('_', ' ').toUpperCase()}</span>
                    <span className="text-cyan-400 font-bold flex items-center gap-1 group-hover:text-white transition-colors">
                      <span>EXPAND VIEW</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. LIVE VIDEO / OPTICAL FEED FULLSCREEN MODAL */}
      {activeLiveModal && (
        <LiveCameraModal
          initialCamera={activeLiveModal}
          onClose={() => {
            setActiveLiveModal(null);
            playBeep(600, 'sine', 0.04);
          }}
          onPlayBeep={playBeep}
        />
      )}
    </div>
  );
};
