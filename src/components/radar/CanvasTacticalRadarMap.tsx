import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { WildfireAsset, RadarColorTheme, SectorPreset } from '../TacticalRadar';
import { projectGeo, GEO_BOUNDS } from './CaliforniaGeography';

interface CanvasTacticalRadarMapProps {
  filteredAssets: WildfireAsset[];
  selectedAssetId: string | null;
  onSelectAsset: (asset: WildfireAsset) => void;
  colorTheme: RadarColorTheme;
  sectorPreset: SectorPreset;
  isSweepActive: boolean;
  sweepSpeed: 'normal' | 'fast';
  showVectorTrails: boolean;
  showTFRZones: boolean;
  showTopography: boolean;
  showHydrography: boolean;
  showAirBases: boolean;
  showMilitaryBases: boolean;
  showAirways?: boolean;
  showWinds?: boolean;
  showClassBAirspace?: boolean;
  showRetardantDrops?: boolean;
  highDensityMode: boolean; // Thousands of simultaneous asset markers
  densityMultiplier?: number;
  onPlayBeep?: (freq?: number, type?: OscillatorType, duration?: number) => void;
  externalZoomScale?: number;
  onZoomChange?: (newZoom: number) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  highlightedIconCategory?: string | null;
}

// Full description & identification details for each individual icon on the radar
export interface RadarIconDescription {
  id: string;
  name: string;
  callsign: string;
  category: 'c130' | 'air_tanker' | 'helicopter' | 'wildfire' | 'recon_lead' | 'air_base' | 'military_base' | 'airway_fix' | 'wind_station' | 'mountain_peak';
  categoryLabel: string;
  iconSymbol: string;
  iconVisualShape: string;
  iconRoleDescription: string;
  modelOrType?: string;
  status?: string;
  altitudeFt?: number;
  speedKnots?: number;
  heading?: number;
  lat: number;
  lng: number;
  specs?: Record<string, string | number>;
  rawAsset?: WildfireAsset;
}

// Extra generated targets for high-density stress testing (thousands of simultaneous markers)
interface SurgeMarker {
  id: string;
  lat: number;
  lng: number;
  heading: number;
  speedKnots: number;
  altitudeFt: number;
  category: 'air_tanker' | 'helicopter' | 'recon_lead' | 'wildfire_hotspot';
  callsign: string;
}

// Federal Victor Airway Fix / VOR waypoint definition
interface AirwayFix {
  id: string;
  name: string;
  freq: string;
  lat: number;
  lng: number;
}

// Meteorological surface wind reporting station
interface WindStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  speedKnots: number;
  gustKnots: number;
  dirDeg: number;
  type: 'diablo' | 'santa_ana' | 'onshore' | 'sierra';
}

export function getRadarIconDescription(target: {
  type: 'asset' | 'airway' | 'wind' | 'peak';
  data: any;
}): RadarIconDescription {
  if (target.type === 'asset') {
    const asset: WildfireAsset = target.data;
    const isC130 =
      asset.modelOrType?.includes('C-130') ||
      asset.callsign?.includes('118') ||
      asset.callsign?.includes('116') ||
      asset.callsign?.includes('131') ||
      asset.name?.includes('C-130');

    if (isC130) {
      return {
        id: asset.id,
        name: asset.name,
        callsign: asset.callsign,
        category: 'c130',
        categoryLabel: 'LOCKHEED C-130H // HEAVY MAFFS AIR TANKER',
        iconSymbol: '🛩️',
        iconVisualShape: '4-Engine Turboprop Silhouette with High Straight Wing & Amber Engine Nacelles',
        iconRoleDescription:
          'Tactical 4-engine turboprop heavy airtanker equipped with 4,000-gal MAFFS II pressurized constant-flow system. Lays continuous heavy chemical retardant barrier lines ahead of crowning wildfire fronts.',
        modelOrType: asset.modelOrType,
        status: asset.status,
        altitudeFt: asset.altitudeFt,
        speedKnots: asset.speedKnots,
        heading: asset.heading,
        lat: asset.lat,
        lng: asset.lng,
        specs: {
          Airframe: 'Lockheed C-130H Hercules',
          RetardantPayload: `${asset.currentPayloadGal?.toLocaleString() || 4000} Gal Phos-Chek`,
          DropSystem: 'MAFFS II Pressurized Constant-Flow Nozzle',
          BaseLogistics: asset.baseLocation || 'McClellan Tanker Base (MCC)',
          AssignedFire: asset.assignedIncident || 'Active California Sector',
        },
        rawAsset: asset,
      };
    }

    if (asset.category === 'air_tanker') {
      return {
        id: asset.id,
        name: asset.name,
        callsign: asset.callsign,
        category: 'air_tanker',
        categoryLabel: 'FIXED-WING AIR TANKER // VLAT & LAT BOMBER',
        iconSymbol: '✈️',
        iconVisualShape: 'Swept-Wing Jet / Turbo-Tracker Silhouette with Trailing Retardant Pod Beacon',
        iconRoleDescription:
          'Heavy/Large fixed-wing retardant bomber (DC-10 VLAT 9,400 gal / S-2T Tracker 1,200 gal). Drops Phos-Chek fire retardant on active ridgelines to halt wildfire advance and protect critical infrastructure.',
        modelOrType: asset.modelOrType,
        status: asset.status,
        altitudeFt: asset.altitudeFt,
        speedKnots: asset.speedKnots,
        heading: asset.heading,
        lat: asset.lat,
        lng: asset.lng,
        specs: {
          Model: asset.modelOrType,
          PayloadCapacity: `${asset.payloadCapacityGal?.toLocaleString() || '1,200'} Gal`,
          DropCoverage: asset.dropSystem || 'Computerized Constant Flow Gravity System',
          BaseHub: asset.baseLocation || 'State Logistics Hub',
          TacticalRadio: asset.frequency || '124.625 MHz (Air Tactical)',
        },
        rawAsset: asset,
      };
    }

    if (asset.category === 'helicopter') {
      return {
        id: asset.id,
        name: asset.name,
        callsign: asset.callsign,
        category: 'helicopter',
        categoryLabel: 'HELITACK HELICOPTER // ROTARY SUPPRESSANT ATTACK',
        iconSymbol: '🚁',
        iconVisualShape: 'Rotor Disk Blade Silhouette with Snorkel & Helitack Fuselage',
        iconRoleDescription:
          'Tactical rotary-wing aircraft (CH-47D Chinook, S-64 Skycrane, S-70i Firehawk). Uses high-volume snorkels or Bambi buckets for precision drops on active flare-ups, structure defense, and rapid smokejumper insertion.',
        modelOrType: asset.modelOrType,
        status: asset.status,
        altitudeFt: asset.altitudeFt,
        speedKnots: asset.speedKnots,
        heading: asset.heading,
        lat: asset.lat,
        lng: asset.lng,
        specs: {
          Airframe: asset.modelOrType,
          DropPayload: `${asset.currentPayloadGal?.toLocaleString() || '1,000'} Gal Water/Gel`,
          RefillMethod: asset.dropSystem || 'Power Snorkel / Bambi Bucket',
          AssignedMission: asset.missionSummary || 'Initial Attack Precision Drops',
          BaseLocation: asset.baseLocation || 'Helitack Base',
        },
        rawAsset: asset,
      };
    }

    if (asset.category === 'recon_lead') {
      return {
        id: asset.id,
        name: asset.name,
        callsign: asset.callsign,
        category: 'recon_lead',
        categoryLabel: 'AERIAL RECON // BIRD DOG LEAD PLANE',
        iconSymbol: '🎯',
        iconVisualShape: 'High-Speed Diamond Tactical Silhouette with Sensor Gimbal',
        iconRoleDescription:
          'Air Tactical Group Supervisor (ATGS) and Bird Dog lead plane (King Air 200, OV-10 Bronco). Scouts smoke corridors, verifies flight visibility, guides tankers into drop runs with smoke, and coordinates TFR traffic.',
        modelOrType: asset.modelOrType,
        status: asset.status,
        altitudeFt: asset.altitudeFt,
        speedKnots: asset.speedKnots,
        heading: asset.heading,
        lat: asset.lat,
        lng: asset.lng,
        specs: {
          AircraftType: asset.modelOrType,
          SensorSuite: 'FLIR Star SAFIRE HD Thermal Gimbal',
          RadioFrequencies: asset.frequency || 'Air-to-Air 124.150 MHz',
          MissionProfile: asset.missionSummary || 'Air Tactical Supervision & Lead-In',
        },
        rawAsset: asset,
      };
    }

    if (asset.category === 'wildfire') {
      return {
        id: asset.id,
        name: asset.name,
        callsign: asset.callsign,
        category: 'wildfire',
        categoryLabel: 'ACTIVE WILDFIRE COMPLEX // NASA FIRMS THERMAL INCIDENT',
        iconSymbol: '🌋',
        iconVisualShape: 'Pulsing Crimson Heat Corona Ring with Thermal Hotspot Core',
        iconRoleDescription:
          'Active wildland fire complex tracked in real time by NASA FIRMS VIIRS/MODIS infrared satellite sensors and airborne thermal telemetry. Evaluated for acreage, spread rate, and perimeter defense.',
        modelOrType: asset.modelOrType,
        status: asset.status,
        lat: asset.lat,
        lng: asset.lng,
        specs: {
          Acreage: `${asset.acreage?.toLocaleString() || 850} Acres`,
          Containment: `${asset.containmentPercent || 15}% Contained`,
          FuelModel: asset.fuelModel || 'Chaparral / Heavy Timber',
          TacticalFrequency: asset.frequency || '124.625 MHz',
        },
        rawAsset: asset,
      };
    }

    if (asset.category === 'air_base') {
      return {
        id: asset.id,
        name: asset.name,
        callsign: asset.callsign,
        category: 'air_base',
        categoryLabel: 'CAL FIRE AIR ATTACK BASE // OPERATIONAL LOGISTICS',
        iconSymbol: '🔥',
        iconVisualShape: 'Runway Strip Geometry with Orange Ramps & Retardant Reload Pits',
        iconRoleDescription:
          'State wildland aviation facility equipped with high-throughput Phos-Chek retardant mixing pits, aviation turbine fuel farms, and rapid turnaround ramps with under 15-minute turnaround SLA.',
        modelOrType: asset.modelOrType,
        status: asset.status,
        lat: asset.lat,
        lng: asset.lng,
        specs: {
          FacilityType: 'CAL FIRE Reloading Hub',
          RetardantStorage: `${asset.payloadCapacityGal?.toLocaleString() || '150,000'} Gal`,
          MixOnDeck: `${asset.currentPayloadGal?.toLocaleString() || '120,000'} Gal`,
          Location: asset.baseLocation || 'California',
        },
        rawAsset: asset,
      };
    }

    if (asset.category === 'military_base') {
      return {
        id: asset.id,
        name: asset.name,
        callsign: asset.callsign,
        category: 'military_base',
        categoryLabel: 'DoD MILITARY AIRFIELD // JOINT DEFENSE & MAFFS BASE',
        iconSymbol: '🛡️',
        iconVisualShape: 'Dual Crossed Runway Airfield with Defense Shield Emblem',
        iconRoleDescription:
          'Active Department of Defense installation supporting Air National Guard MAFFS wings, heavy C-17/C-130 transport staging, and interagency wildfire logistics.',
        modelOrType: asset.modelOrType,
        status: asset.status,
        lat: asset.lat,
        lng: asset.lng,
        specs: {
          BranchAgency: 'DoD / Air National Guard',
          StationSquadron: asset.callsign,
          RetardantCapacity: `${asset.payloadCapacityGal?.toLocaleString() || '200,000'} Gal`,
          OperationalRole: 'Federal Joint Aerial Firefighting Staging',
        },
        rawAsset: asset,
      };
    }
  } else if (target.type === 'airway') {
    const fix = target.data;
    return {
      id: fix.id,
      name: fix.name,
      callsign: fix.id,
      category: 'airway_fix',
      categoryLabel: 'VICTOR AIRWAY VOR // FEDERAL NAVIGATION FIX',
      iconSymbol: '🧭',
      iconVisualShape: 'Compass Star / Navigation Fix Triangle with VHF Frequency Badge',
      iconRoleDescription:
        'Federal aviation VHF Omnidirectional Range (VOR) navigation beacon and victor airway waypoint. Used for strategic transit corridor deconfliction between civilian airliners and firefighting tankers.',
      lat: fix.lat,
      lng: fix.lng,
      specs: {
        WaypointID: fix.id,
        VORFrequency: `${fix.freq} MHz`,
        AirwaySystem: 'Federal Victor Airways (V23, V25, V107)',
        Role: 'Airspace Deconfliction Fix',
      },
    };
  } else if (target.type === 'wind') {
    const wind = target.data;
    return {
      id: wind.id,
      name: wind.name,
      callsign: wind.id,
      category: 'wind_station',
      categoryLabel: 'METEOROLOGICAL SENSOR // SURFACE WIND VECTOR',
      iconSymbol: '💨',
      iconVisualShape: 'Directional Wind Barb Arrow with Speed & Gust Feather Flags',
      iconRoleDescription:
        'Remote automated meteorological sensor measuring live wind speed, peak gusts, and directional vector. Critical for anticipating dangerous Diablo and Santa Ana wind-driven fire runs.',
      lat: wind.lat,
      lng: wind.lng,
      specs: {
        SustainedVelocity: `${wind.speedKnots} Knots`,
        PeakGusts: `${wind.gustKnots} Knots`,
        CompassHeading: `${wind.dirDeg}° (${wind.type.toUpperCase()} VECTOR)`,
        FireDangerLevel: wind.gustKnots > 30 ? 'EXTREME (RED FLAG WARNING)' : 'HIGH',
      },
    };
  } else if (target.type === 'peak') {
    const peak = target.data;
    return {
      id: peak.name,
      name: peak.name,
      callsign: peak.name,
      category: 'mountain_peak',
      categoryLabel: 'TOPOGRAPHICAL OBSTACLE // MOUNTAIN SUMMIT',
      iconSymbol: '⛰️',
      iconVisualShape: 'Mountain Summit Elevation Contour Triangle with Snowcap Accent',
      iconRoleDescription:
        'Prominent topographical elevation obstacle. Generates severe mechanical wind shear, lee-side downdrafts, and terrain hazards requiring strict minimum safe altitude margins for airtankers.',
      lat: peak.lat,
      lng: peak.lng,
      specs: {
        PeakElevation: `${peak.elev} MSL`,
        TerrainHazard: 'Severe Ridge Down-Drafts & Wind Shear',
        MinimumSafeAltitude: 'Peak Elevation + 2,000 ft AGL',
      },
    };
  }

  return {
    id: 'unknown',
    name: 'Tactical Asset',
    callsign: 'TGT',
    category: 'air_tanker',
    categoryLabel: 'TACTICAL RADAR TARGET',
    iconSymbol: '⌖',
    iconVisualShape: 'Target Symbol',
    iconRoleDescription: 'Operational asset tracked on OSIRIS Tactical Radar.',
    lat: 37,
    lng: -120,
  };
}

export const CanvasTacticalRadarMap: React.FC<CanvasTacticalRadarMapProps> = ({
  filteredAssets,
  selectedAssetId,
  onSelectAsset,
  colorTheme,
  sectorPreset,
  isSweepActive,
  sweepSpeed,
  showVectorTrails,
  showTFRZones,
  showTopography,
  showHydrography,
  showAirBases,
  showMilitaryBases,
  showAirways = true,
  showWinds = true,
  showClassBAirspace = true,
  showRetardantDrops = true,
  highDensityMode,
  densityMultiplier = 1500,
  onPlayBeep,
  externalZoomScale,
  onZoomChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  highlightedIconCategory = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Hover state for interactive tooltips on canvas with complete individual icon description
  const [hoveredTarget, setHoveredTarget] = useState<RadarIconDescription | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const hoveredAsset = hoveredTarget?.rawAsset || null;

  // Refs for 60 FPS animation loop synchronization
  const hoveredTargetRef = useRef<RadarIconDescription | null>(hoveredTarget);
  hoveredTargetRef.current = hoveredTarget;

  const highlightedCategoryRef = useRef<string | null | undefined>(highlightedIconCategory);
  highlightedCategoryRef.current = highlightedIconCategory;

  // Animation sweep angle in radians
  const sweepAngleRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number>(0);

  // User zoom scale & pan offset (Allows scrolling in/out with mousewheel, touchpad, or HUD buttons)
  const [zoomScale, setZoomScaleState] = useState<number>(externalZoomScale ?? 1.0);
  const setZoomScale = useCallback((updater: number | ((prev: number) => number)) => {
    setZoomScaleState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const clamped = Math.max(0.7, Math.min(6.0, +next.toFixed(2)));
      onZoomChange?.(clamped);
      return clamped;
    });
  }, [onZoomChange]);

  // Synchronize when externalZoomScale changes
  useEffect(() => {
    if (externalZoomScale !== undefined && externalZoomScale !== zoomScale) {
      setZoomScaleState(externalZoomScale);
    }
  }, [externalZoomScale]);

  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);
  const didDragRef = useRef<boolean>(false);

  // Sector viewBox mapping for canvas transform
  const baseSectorViewBox = useMemo(() => {
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

  // Reset user zoom and pan when switching sector preset
  useEffect(() => {
    setZoomScale(1.0);
    setPanOffset({ x: 0, y: 0 });
  }, [sectorPreset]);

  // Active composite sectorViewBox factoring in user zoomScale and panOffset
  const sectorViewBox = useMemo(() => {
    const width = baseSectorViewBox.width / zoomScale;
    const height = baseSectorViewBox.height / zoomScale;
    const centerX = baseSectorViewBox.x + baseSectorViewBox.width / 2 + panOffset.x;
    const centerY = baseSectorViewBox.y + baseSectorViewBox.height / 2 + panOffset.y;
    return {
      x: centerX - width / 2,
      y: centerY - height / 2,
      width,
      height,
      name: zoomScale !== 1.0 ? `${baseSectorViewBox.name} [${Math.round(zoomScale * 100)}% ZOOM]` : baseSectorViewBox.name,
    };
  }, [baseSectorViewBox, zoomScale, panOffset]);

  // Color theme palette
  const themeColors = useMemo(() => {
    switch (colorTheme) {
      case 'flir':
        return {
          bg: '#0a0302',
          landFill: '#1a0705',
          coastStroke: '#9a3412',
          gridStroke: '#431407',
          ring: '#ea580c',
          sweepBeam: 'rgba(249, 115, 22, 0.45)',
          sweepTrail: 'rgba(234, 88, 12, 0.12)',
          tankerColor: '#fb923c',
          heliColor: '#fdba74',
          fireColor: '#ef4444',
          reticleColor: '#f97316',
          airwayStroke: '#7c2d12',
          windColor: '#fdba74',
        };
      case 'nvg':
        return {
          bg: '#020d04',
          landFill: '#041d0b',
          coastStroke: '#065f46',
          gridStroke: '#064e3b',
          ring: '#16a34a',
          sweepBeam: 'rgba(34, 197, 94, 0.45)',
          sweepTrail: 'rgba(22, 163, 74, 0.12)',
          tankerColor: '#4ade80',
          heliColor: '#86efac',
          fireColor: '#ef4444',
          reticleColor: '#22c55e',
          airwayStroke: '#064e3b',
          windColor: '#86efac',
        };
      case 'cyan':
      default:
        return {
          bg: '#030814',
          landFill: '#061325',
          coastStroke: '#0e3a5a',
          gridStroke: '#0f2b48',
          ring: '#0891b2',
          sweepBeam: 'rgba(6, 182, 212, 0.45)',
          sweepTrail: 'rgba(8, 145, 178, 0.12)',
          tankerColor: '#38bdf8',
          heliColor: '#34d399',
          fireColor: '#ef4444',
          reticleColor: '#38bdf8',
          airwayStroke: '#164e63',
          windColor: '#38bdf8',
        };
    }
  }, [colorTheme]);

  // Major Federal Victor Airway Fixes & VORs
  const airwayFixes = useMemo<AirwayFix[]>(() => [
    { id: 'RBL', name: 'RED BLUFF VOR', freq: '115.7', lat: 40.16, lng: -122.24 },
    { id: 'SAC', name: 'SACRAMENTO VOR', freq: '115.2', lat: 38.45, lng: -121.50 },
    { id: 'MOD', name: 'MODESTO VOR', freq: '114.6', lat: 37.63, lng: -120.96 },
    { id: 'CZQ', name: 'CLOVIS VOR', freq: '112.9', lat: 36.88, lng: -119.78 },
    { id: 'EHF', name: 'SHAFTER VOR', freq: '115.4', lat: 35.48, lng: -119.09 },
    { id: 'PMD', name: 'PALMDALE VOR', freq: '114.5', lat: 34.60, lng: -118.06 },
    { id: 'VNY', name: 'VAN NUYS VOR', freq: '113.1', lat: 34.21, lng: -118.49 },
    { id: 'PSP', name: 'PALM SPRINGS VOR', freq: '115.5', lat: 33.82, lng: -116.51 },
    { id: 'MZB', name: 'MISSION BAY VOR', freq: '117.8', lat: 32.78, lng: -117.22 },
  ], []);

  // Prominent California Mountain Peaks
  const mountainPeaks = useMemo(() => [
    { name: 'MT SHASTA', elev: '14,179\'', lat: 41.41, lng: -122.19 },
    { name: 'MT WHITNEY', elev: '14,505\'', lat: 36.58, lng: -118.29 },
    { name: 'LASSEN PEAK', elev: '10,457\'', lat: 40.49, lng: -121.51 },
    { name: 'MT DIABLO', elev: '3,849\'', lat: 37.88, lng: -121.91 },
    { name: 'SAN GORGONIO', elev: '11,503\'', lat: 34.10, lng: -116.82 },
    { name: 'MT TAMALPAIS', elev: '2,571\'', lat: 37.92, lng: -122.60 },
  ], []);

  // Real-time Tactical Surface Wind Reporting Stations
  const windStations = useMemo<WindStation[]>(() => [
    { id: 'W-SHASTA', name: 'SHASTA PASS', lat: 40.70, lng: -122.30, speedKnots: 18, gustKnots: 26, dirDeg: 340, type: 'onshore' },
    { id: 'W-VALLEY', name: 'SACRAMENTO CORRIDOR', lat: 38.60, lng: -121.55, speedKnots: 15, gustKnots: 22, dirDeg: 355, type: 'onshore' },
    { id: 'W-DIABLO', name: 'DIABLO GAP SURGE', lat: 37.85, lng: -121.80, speedKnots: 24, gustKnots: 36, dirDeg: 45, type: 'diablo' },
    { id: 'W-SIERRA', name: 'TIOGA PASS RIDGE', lat: 37.90, lng: -119.30, speedKnots: 16, gustKnots: 24, dirDeg: 240, type: 'sierra' },
    { id: 'W-SO-CAL', name: 'SANTA ANA PASS (CAJON)', lat: 34.30, lng: -117.40, speedKnots: 32, gustKnots: 48, dirDeg: 60, type: 'santa_ana' },
    { id: 'W-DESERT', name: 'CLEVELAND ESCAVAL', lat: 33.30, lng: -116.60, speedKnots: 22, gustKnots: 30, dirDeg: 80, type: 'santa_ana' },
  ], []);

  // Generate thousands of synthetic surge markers when high-density mode is active
  const surgeMarkers = useMemo<SurgeMarker[]>(() => {
    if (!highDensityMode) return [];
    const count = Math.min(2500, densityMultiplier);
    const markers: SurgeMarker[] = [];
    const fireHotspots = [
      { lat: 40.85, lng: -122.45, name: 'SHASTA' },
      { lat: 39.80, lng: -121.50, name: 'DIXIE' },
      { lat: 36.15, lng: -121.65, name: 'BIG-SUR' },
      { lat: 33.45, lng: -116.70, name: 'CLEVELAND' },
      { lat: 36.50, lng: -118.60, name: 'SEQUOIA' },
      { lat: 34.32, lng: -118.06, name: 'ANGELES' },
    ];

    for (let i = 0; i < count; i++) {
      const center = fireHotspots[i % fireHotspots.length];
      const spreadLat = (Math.random() - 0.5) * 1.8;
      const spreadLng = (Math.random() - 0.5) * 2.2;
      const isAircraft = i % 4 !== 0;

      markers.push({
        id: `surge-${i}`,
        lat: center.lat + spreadLat,
        lng: center.lng + spreadLng,
        heading: Math.floor(Math.random() * 360),
        speedKnots: isAircraft ? 110 + Math.floor(Math.random() * 160) : 0,
        altitudeFt: isAircraft ? 1800 + Math.floor(Math.random() * 6500) : 0,
        category: !isAircraft
          ? 'wildfire_hotspot'
          : i % 3 === 0
          ? 'helicopter'
          : i % 5 === 0
          ? 'recon_lead'
          : 'air_tanker',
        callsign: !isAircraft
          ? `FIRMS-HOTSPOT-${i}`
          : i % 3 === 0
          ? `HELI-${100 + (i % 50)}`
          : `TANKER-${i % 80}`,
      });
    }
    return markers;
  }, [highDensityMode, densityMultiplier]);

  // Coordinate conversion helper: client mouse event -> viewBox (800x600 coordinate space)
  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const normX = clientX / rect.width;
      const normY = clientY / rect.height;

      const x = sectorViewBox.x + normX * sectorViewBox.width;
      const y = sectorViewBox.y + normY * sectorViewBox.height;

      return { x, y };
    },
    [sectorViewBox]
  );

  // Wheel Zoom Listener (Scroll in/out to pick & choose incidents or resources)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); // Prevent page scroll while interacting with tactical radar

      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const normX = clientX / rect.width;
      const normY = clientY / rect.height;

      // Determine zoom direction: deltaY negative = scroll up (zoom in), positive = scroll down (zoom out)
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;

      setZoomScale((prevZoom) => {
        const nextZoom = Math.min(6.0, Math.max(0.7, prevZoom * zoomFactor));

        // Adjust pan offset so zoom centers around current mouse position
        setPanOffset((prevPan) => {
          const baseW = baseSectorViewBox.width;
          const baseH = baseSectorViewBox.height;

          const oldW = baseW / prevZoom;
          const oldH = baseH / prevZoom;
          const newW = baseW / nextZoom;
          const newH = baseH / nextZoom;

          // Focus point shift in viewBox coordinates
          const focusX = (normX - 0.5);
          const focusY = (normY - 0.5);

          const deltaX = focusX * (oldW - newW);
          const deltaY = focusY * (oldH - newH);

          return {
            x: Math.max(-500, Math.min(500, prevPan.x + deltaX)),
            y: Math.max(-400, Math.min(400, prevPan.y + deltaY)),
          };
        });

        return nextZoom;
      });
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [baseSectorViewBox]);

  // Mouse Down for drag panning
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only drag with left click or middle click
    if (e.button === 0 || e.button === 1) {
      dragStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        panX: panOffset.x,
        panY: panOffset.y,
      };
      didDragRef.current = false;
      setIsDragging(true);
    }
  }, [panOffset]);

  // Mouse Up to finish dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Canvas Mouse Move (Pan update when dragging, otherwise hover detection)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // If currently dragging to pan
      if (isDragging && dragStartRef.current) {
        const dx = e.clientX - dragStartRef.current.clientX;
        const dy = e.clientY - dragStartRef.current.clientY;

        if (Math.hypot(dx, dy) > 4) {
          didDragRef.current = true;
        }

        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          // Convert pixel delta to viewBox coordinate delta
          const scaleFactorX = sectorViewBox.width / rect.width;
          const scaleFactorY = sectorViewBox.height / rect.height;

          setPanOffset({
            x: dragStartRef.current.panX - dx * scaleFactorX,
            y: dragStartRef.current.panY - dy * scaleFactorY,
          });
        }
        return;
      }

      // Normal hover target acquisition across all radar icon types
      const { x, y } = getCanvasCoords(e);
      let foundTarget: RadarIconDescription | null = null;
      let minDistance = 34 / Math.sqrt(zoomScale); // Dynamic hit testing adapts to zoom level

      // 1. Check Wildfire & Aviation Assets (Airtankers, Helitack, C-130, Lead, Wildfires, Bases)
      for (const asset of filteredAssets) {
        const pt = projectGeo(asset.lat, asset.lng);
        const dist = Math.hypot(pt.x - x, pt.y - y);
        // Priority boost for aircraft over stationary bases or fires
        const isAircraft = asset.category === 'air_tanker' || asset.category === 'helicopter' || asset.category === 'recon_lead';
        const weightedDist = isAircraft ? dist * 0.75 : dist;
        
        if (weightedDist < minDistance) {
          minDistance = weightedDist;
          foundTarget = getRadarIconDescription({ type: 'asset', data: asset });
        }
      }

      // 2. Check Federal Victor Airway Fixes / VOR Waypoints
      if (showAirways) {
        for (const fix of airwayFixes) {
          const pt = projectGeo(fix.lat, fix.lng);
          const dist = Math.hypot(pt.x - x, pt.y - y);
          if (dist < minDistance && dist < 24 / Math.sqrt(zoomScale)) {
            minDistance = dist;
            foundTarget = getRadarIconDescription({ type: 'airway', data: fix });
          }
        }
      }

      // 3. Check Meteorological Surface Wind Reporting Stations
      if (showWinds) {
        for (const wind of windStations) {
          const pt = projectGeo(wind.lat, wind.lng);
          const dist = Math.hypot(pt.x - x, pt.y - y);
          if (dist < minDistance && dist < 24 / Math.sqrt(zoomScale)) {
            minDistance = dist;
            foundTarget = getRadarIconDescription({ type: 'wind', data: wind });
          }
        }
      }

      // 4. Check Topographical Mountain Peaks
      if (showTopography) {
        for (const peak of mountainPeaks) {
          const pt = projectGeo(peak.lat, peak.lng);
          const dist = Math.hypot(pt.x - x, pt.y - y);
          if (dist < minDistance && dist < 24 / Math.sqrt(zoomScale)) {
            minDistance = dist;
            foundTarget = getRadarIconDescription({ type: 'peak', data: peak });
          }
        }
      }

      setHoveredTarget(foundTarget);
      if (foundTarget) {
        setHoverPos({ x: e.clientX, y: e.clientY });
      } else {
        setHoverPos(null);
      }
    },
    [filteredAssets, airwayFixes, windStations, mountainPeaks, showAirways, showWinds, showTopography, getCanvasCoords, isDragging, sectorViewBox, zoomScale]
  );

  // Canvas Mouse Click (Target selection & overlay triggering with generous hit radius)
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // If the user was dragging/panning the radar, do not trigger asset selection
      if (didDragRef.current) {
        didDragRef.current = false;
        return;
      }

      const { x, y } = getCanvasCoords(e);
      let closest: WildfireAsset | null = null;
      let minDistance = 36 / Math.sqrt(zoomScale); // Adapt click target threshold to current zoom

      for (const asset of filteredAssets) {
        const pt = projectGeo(asset.lat, asset.lng);
        const dist = Math.hypot(pt.x - x, pt.y - y);
        // Aircraft priority weighting
        const isAircraft = asset.category === 'air_tanker' || asset.category === 'helicopter' || asset.category === 'recon_lead';
        const weightedDist = isAircraft ? dist * 0.72 : dist;

        if (weightedDist < minDistance) {
          minDistance = weightedDist;
          closest = asset;
        }
      }

      if (closest) {
        onSelectAsset(closest);
        onPlayBeep?.(
          closest.category === 'wildfire' ? 1200 : closest.category === 'air_tanker' ? 880 : 700,
          'sawtooth',
          0.08
        );
      } else if (hoveredTarget && !hoveredTarget.rawAsset) {
        // If clicked on an airway fix, wind station, or peak, play audio confirmation
        onPlayBeep?.(920, 'sine', 0.05);
      }
    },
    [filteredAssets, getCanvasCoords, onSelectAsset, onPlayBeep, zoomScale]
  );

  // Master Canvas 60 FPS Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      // Handle HiDPI scaling
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth || 800;
      const height = canvas.clientHeight || 600;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Map ViewBox to Canvas dimensions
      const scaleX = width / sectorViewBox.width;
      const scaleY = height / sectorViewBox.height;
      ctx.scale(scaleX, scaleY);
      ctx.translate(-sectorViewBox.x, -sectorViewBox.y);

      // 1. Background Fill (Pacific Ocean)
      ctx.fillStyle = themeColors.bg;
      ctx.fillRect(sectorViewBox.x, sectorViewBox.y, sectorViewBox.width, sectorViewBox.height);

      // 2. Pacific Bathymetry Graticules & Shelf
      ctx.strokeStyle = themeColors.gridStroke;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.setLineDash([3, 4]);
      // 200m shelf
      ctx.moveTo(50, 15);
      ctx.bezierCurveTo(85, 180, 185, 380, 525, 580);
      // 1000m slope
      ctx.moveTo(25, 40);
      ctx.bezierCurveTo(45, 230, 185, 470, 325, 550);
      ctx.stroke();

      // Monterey Canyon
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.moveTo(125, 320);
      ctx.lineTo(195, 330);
      ctx.lineTo(235, 332);
      ctx.stroke();

      // 3. Latitude & Longitude Coordinate Graticules
      ctx.strokeStyle = themeColors.gridStroke;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 5]);
      [42, 40, 38, 36, 34, 32].forEach((lat) => {
        const p = projectGeo(lat, -125.0);
        ctx.beginPath();
        ctx.moveTo(0, p.y);
        ctx.lineTo(800, p.y);
        ctx.stroke();
      });
      [-124, -122, -120, -118, -116, -114].forEach((lng) => {
        const p = projectGeo(32.1, lng);
        ctx.beginPath();
        ctx.moveTo(p.x, 0);
        ctx.lineTo(p.x, 600);
        ctx.stroke();
      });

      // 4. California Landmass Polygon Fill
      const coastPoints = [
        { lat: 42.0, lng: -124.21 },
        { lat: 41.78, lng: -124.25 },
        { lat: 41.54, lng: -124.08 },
        { lat: 41.05, lng: -124.15 },
        { lat: 40.76, lng: -124.23 },
        { lat: 40.44, lng: -124.41 },
        { lat: 40.26, lng: -124.36 },
        { lat: 40.02, lng: -124.07 },
        { lat: 39.43, lng: -123.81 },
        { lat: 39.3, lng: -123.8 },
        { lat: 38.95, lng: -123.74 },
        { lat: 38.71, lng: -123.53 },
        { lat: 38.51, lng: -123.25 },
        { lat: 38.45, lng: -123.13 },
        { lat: 38.31, lng: -123.06 },
        { lat: 38.23, lng: -122.98 },
        { lat: 37.99, lng: -123.02 },
        { lat: 37.91, lng: -122.68 },
        { lat: 37.82, lng: -122.53 },
        { lat: 37.78, lng: -122.51 },
        { lat: 37.59, lng: -122.51 },
        { lat: 37.5, lng: -122.49 },
        { lat: 37.18, lng: -122.39 },
        { lat: 37.11, lng: -122.33 },
        { lat: 36.96, lng: -122.01 },
        { lat: 36.8, lng: -121.79 },
        { lat: 36.63, lng: -121.93 },
        { lat: 36.58, lng: -121.98 },
        { lat: 36.52, lng: -121.95 },
        { lat: 36.31, lng: -121.9 },
        { lat: 36.18, lng: -121.7 },
        { lat: 35.89, lng: -121.46 },
        { lat: 35.66, lng: -121.28 },
        { lat: 35.45, lng: -120.9 },
        { lat: 35.37, lng: -120.86 },
        { lat: 35.25, lng: -120.9 },
        { lat: 35.17, lng: -120.65 },
        { lat: 34.9, lng: -120.66 },
        { lat: 34.75, lng: -120.64 },
        { lat: 34.58, lng: -120.65 },
        { lat: 34.45, lng: -120.47 },
        { lat: 34.43, lng: -119.83 },
        { lat: 34.4, lng: -119.52 },
        { lat: 34.2, lng: -119.22 },
        { lat: 34.09, lng: -119.06 },
        { lat: 34.0, lng: -118.8 },
        { lat: 33.98, lng: -118.45 },
        { lat: 33.74, lng: -118.4 },
        { lat: 33.7, lng: -118.28 },
        { lat: 33.74, lng: -118.19 },
        { lat: 33.65, lng: -117.98 },
        { lat: 33.6, lng: -117.88 },
        { lat: 33.46, lng: -117.71 },
        { lat: 33.2, lng: -117.38 },
        { lat: 33.04, lng: -117.29 },
        { lat: 32.85, lng: -117.27 },
        { lat: 32.75, lng: -117.25 },
        { lat: 32.67, lng: -117.24 },
        { lat: 32.62, lng: -117.13 },
        { lat: 32.53, lng: -117.12 },
        // Border points
        { lat: 32.75, lng: -114.72 },
        { lat: 33.61, lng: -114.59 },
        { lat: 34.3, lng: -114.15 },
        { lat: 34.84, lng: -114.61 },
        { lat: 35.0, lng: -114.64 },
        { lat: 39.0, lng: -120.0 },
        { lat: 42.0, lng: -120.0 },
      ];

      ctx.beginPath();
      coastPoints.forEach((pt, idx) => {
        const p = projectGeo(pt.lat, pt.lng);
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fillStyle = themeColors.landFill;
      ctx.fill();
      ctx.strokeStyle = themeColors.coastStroke;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // 5. Central Valley Depressed Basin Shading
      ctx.beginPath();
      const cvPoints = [
        { lat: 40.6, lng: -122.4 },
        { lat: 40.0, lng: -122.2 },
        { lat: 38.5, lng: -121.5 },
        { lat: 36.8, lng: -120.2 },
        { lat: 35.2, lng: -119.0 },
        { lat: 35.0, lng: -119.3 },
        { lat: 36.5, lng: -120.7 },
        { lat: 38.3, lng: -121.9 },
        { lat: 39.8, lng: -122.5 },
      ];
      cvPoints.forEach((pt, idx) => {
        const p = projectGeo(pt.lat, pt.lng);
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.03)';
      ctx.fill();

      // 6. Major Lakes (Lake Tahoe, Salton Sea, Shasta)
      const tahoe = projectGeo(39.09, -120.03);
      ctx.fillStyle = themeColors.bg;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(tahoe.x, tahoe.y, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const salton = projectGeo(33.35, -115.85);
      ctx.beginPath();
      ctx.ellipse(salton.x, salton.y, 10, 5, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 7. Channel Islands
      const islands = [
        { lat: 34.04, lng: -120.37, rx: 5, ry: 2.5 },
        { lat: 33.97, lng: -120.1, rx: 6, ry: 3 },
        { lat: 34.02, lng: -119.75, rx: 9, ry: 3.5 },
        { lat: 33.38, lng: -118.42, rx: 7, ry: 3 },
        { lat: 32.9, lng: -118.5, rx: 6, ry: 2.5 },
      ];
      ctx.fillStyle = themeColors.landFill;
      ctx.strokeStyle = themeColors.coastStroke;
      islands.forEach((isl) => {
        const p = projectGeo(isl.lat, isl.lng);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, isl.rx, isl.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // 8. Topography & Prominent Mountain Peaks
      if (showTopography) {
        mountainPeaks.forEach((peak) => {
          const p = projectGeo(peak.lat, peak.lng);
          // Mountain Triangle icon
          ctx.strokeStyle = '#38bdf8';
          ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - 7);
          ctx.lineTo(p.x + 5, p.y + 3);
          ctx.lineTo(p.x - 5, p.y + 3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Peak elevation tag
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 6.5px JetBrains Mono, monospace';
          ctx.fillText(`${peak.name} (${peak.elev})`, p.x + 7, p.y + 2);
        });
      }

      // 9. Federal Victor Airways & VOR Navigation Fixes
      if (showAirways) {
        ctx.save();
        ctx.strokeStyle = themeColors.airwayStroke;
        ctx.lineWidth = 0.9;
        ctx.setLineDash([4, 4]);

        // Airway V25 (Central Valley corridor: RBL -> SAC -> MOD -> CZQ -> EHF)
        const v25Points = ['RBL', 'SAC', 'MOD', 'CZQ', 'EHF'].map((id) =>
          airwayFixes.find((f) => f.id === id)!
        );
        ctx.beginPath();
        v25Points.forEach((fix, idx) => {
          const pt = projectGeo(fix.lat, fix.lng);
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // Airway V23 (Coastal route: MZB -> VNY -> Santa Barbara -> Paso Robles -> Salinas -> SFO)
        const v23Points = [
          { lat: 32.78, lng: -117.22 },
          { lat: 34.21, lng: -118.49 },
          { lat: 34.43, lng: -119.83 },
          { lat: 35.65, lng: -120.65 },
          { lat: 36.65, lng: -121.60 },
          { lat: 37.62, lng: -122.37 },
          { lat: 38.00, lng: -122.85 },
        ];
        ctx.beginPath();
        v23Points.forEach((pt, idx) => {
          const p = projectGeo(pt.lat, pt.lng);
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Airway V107 / J5 Sierra Connector
        const v107Points = [
          { lat: 37.62, lng: -122.37 },
          { lat: 38.45, lng: -121.50 },
          { lat: 39.09, lng: -120.03 },
        ];
        ctx.beginPath();
        v107Points.forEach((pt, idx) => {
          const p = projectGeo(pt.lat, pt.lng);
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Render VOR Navigation Fix Triangles
        airwayFixes.forEach((fix) => {
          const p = projectGeo(fix.lat, fix.lng);
          ctx.strokeStyle = '#0284c7';
          ctx.fillStyle = '#082f49';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - 4);
          ctx.lineTo(p.x + 3.5, p.y + 3);
          ctx.lineTo(p.x - 3.5, p.y + 3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 6.5px JetBrains Mono, monospace';
          ctx.fillText(`▲ ${fix.id} ${fix.freq}`, p.x + 6, p.y + 2);
        });

        // Airway route markers
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 7px JetBrains Mono, monospace';
        const v25Mid = projectGeo(37.2, -120.4);
        ctx.fillText('FED AIRWAY V25', v25Mid.x + 6, v25Mid.y);
        const v23Mid = projectGeo(35.1, -120.5);
        ctx.fillText('FED AIRWAY V23', v23Mid.x + 6, v23Mid.y);

        ctx.restore();
      }

      // 10. Class B Controlled Airspace Terminal Rings
      if (showClassBAirspace) {
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);

        // SFO Class B (Concentric 10 NM & 25 NM rings)
        const sfo = projectGeo(37.62, -122.37);
        [16, 32].forEach((r) => {
          ctx.beginPath();
          ctx.arc(sfo.x, sfo.y, r, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.font = 'bold 6.5px JetBrains Mono, monospace';
        ctx.fillText('SFO CLASS B [SFC-10,000\']', sfo.x - 38, sfo.y - 35);

        // LAX Class B (Concentric 12 NM & 30 NM rings)
        const lax = projectGeo(33.94, -118.41);
        [18, 36].forEach((r) => {
          ctx.beginPath();
          ctx.arc(lax.x, lax.y, r, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.fillText('LAX CLASS B [SFC-10,000\']', lax.x - 38, lax.y - 39);

        ctx.setLineDash([]);
        ctx.restore();
      }

      // 11. Azimuth Tactical Range Rings & Graticule
      ctx.strokeStyle = themeColors.ring;
      ctx.lineWidth = 0.6;
      ctx.setLineDash([3, 4]);
      [90, 180, 270].forEach((r) => {
        ctx.beginPath();
        ctx.arc(400, 300, r, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(400, 20);
      ctx.lineTo(400, 580);
      ctx.moveTo(80, 300);
      ctx.lineTo(720, 300);
      ctx.stroke();
      ctx.setLineDash([]);

      // 12. Rotating Phased Array Radar Sweep Beam
      let currentSweepAngle = 0;
      if (isSweepActive) {
        const sweepSpeedFactor = sweepSpeed === 'fast' ? 0.035 : 0.018;
        sweepAngleRef.current += sweepSpeedFactor;
        if (sweepAngleRef.current > Math.PI * 2) {
          sweepAngleRef.current -= Math.PI * 2;
        }
        currentSweepAngle = sweepAngleRef.current;

        ctx.save();
        ctx.translate(400, 300);
        ctx.rotate(currentSweepAngle);

        // Sweep trail wedge gradient
        const trailGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 380);
        trailGrad.addColorStop(0, themeColors.sweepBeam);
        trailGrad.addColorStop(0.7, themeColors.sweepTrail);
        trailGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = trailGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 360, -0.6, 0);
        ctx.closePath();
        ctx.fill();

        // Laser scan line
        ctx.strokeStyle = themeColors.ring;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(360, 0);
        ctx.stroke();

        ctx.restore();
      }

      // 13. Surface Wind Barbs & Atmospheric Vectors
      if (showWinds) {
        windStations.forEach((ws) => {
          const pt = projectGeo(ws.lat, ws.lng);
          const rad = (ws.dirDeg * Math.PI) / 180;

          ctx.save();
          ctx.translate(pt.x, pt.y);
          ctx.rotate(rad);

          // Arrow shaft
          const isHighWind = ws.speedKnots >= 25;
          ctx.strokeStyle = isHighWind ? '#f59e0b' : themeColors.windColor;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(0, 14);
          ctx.lineTo(0, -14);
          // Arrow head
          ctx.lineTo(-3, -9);
          ctx.moveTo(0, -14);
          ctx.lineTo(3, -9);
          ctx.stroke();

          // Barb feathers (speed indicator)
          const barbs = Math.floor(ws.speedKnots / 10);
          for (let b = 0; b < barbs; b++) {
            ctx.beginPath();
            ctx.moveTo(0, 10 - b * 4);
            ctx.lineTo(6, 6 - b * 4);
            ctx.stroke();
          }

          ctx.rotate(-rad);
          // Label
          ctx.fillStyle = isHighWind ? '#fbbf24' : '#7dd3fc';
          ctx.font = 'bold 6.5px JetBrains Mono, monospace';
          ctx.fillText(`${ws.speedKnots}G${ws.gustKnots} KT`, 10, 3);
          ctx.restore();
        });
      }

      // 14. Vector Flight Trails
      if (showVectorTrails) {
        filteredAssets.forEach((a) => {
          if (a.vectorTrail && a.vectorTrail.length > 1) {
            ctx.strokeStyle = a.category === 'air_tanker' ? '#38bdf8' : '#34d399';
            ctx.lineWidth = 1.1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            a.vectorTrail.forEach((pt, idx) => {
              const p = projectGeo(pt.lat, pt.lng);
              if (idx === 0) ctx.moveTo(p.x, p.y);
              else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });
      }

      // 15. Active Phos-Chek Fire Retardant Swaths & Spray Footprints
      if (showRetardantDrops) {
        filteredAssets
          .filter((a) => a.category === 'air_tanker' && a.status === 'Retardant Drop')
          .forEach((tanker) => {
            const p = projectGeo(tanker.lat, tanker.lng);
            const headingRad = ((tanker.heading || 0) * Math.PI) / 180;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(headingRad);

            // Crimson / pink Phos-Chek retardant swath footprint trailing behind aircraft
            const swathGradient = ctx.createLinearGradient(0, 0, 0, 48);
            swathGradient.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
            swathGradient.addColorStop(0.6, 'rgba(244, 63, 94, 0.45)');
            swathGradient.addColorStop(1, 'rgba(244, 63, 94, 0)');

            ctx.fillStyle = swathGradient;
            ctx.beginPath();
            ctx.moveTo(-6, 2);
            ctx.lineTo(-9, 45);
            ctx.lineTo(9, 45);
            ctx.lineTo(6, 2);
            ctx.closePath();
            ctx.fill();

            // Dispersal droplet simulation particles
            ctx.fillStyle = '#fda4af';
            for (let i = 0; i < 6; i++) {
              const rx = (Math.random() - 0.5) * 12;
              const ry = 8 + Math.random() * 32;
              ctx.fillRect(rx, ry, 1.5, 1.5);
            }

            ctx.rotate(-headingRad);
            // Drop HUD banner
            ctx.fillStyle = '#f43f5e';
            ctx.font = 'bold 7px JetBrains Mono, monospace';
            ctx.fillText('DISPERSAL: CL-8 (9,400 GAL DROP ACTIVE)', 15, -12);

            ctx.restore();
          });
      }

      // 16. TFR 5 NM Wildfire Flight Restrictions
      if (showTFRZones) {
        filteredAssets
          .filter((a) => a.category === 'wildfire')
          .forEach((fire) => {
            const p = projectGeo(fire.lat, fire.lng);
            ctx.strokeStyle = '#ef4444';
            ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
            ctx.lineWidth = 1.3;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 24, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);

            // TFR NOTAM label
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 6.5px JetBrains Mono, monospace';
            ctx.fillText(`TFR 5NM SFC-12,500' MSL`, p.x - 30, p.y + 32);
          });
      }

      // 17. High-Density Surge Markers (Thousands of simultaneous points)
      if (highDensityMode && surgeMarkers.length > 0) {
        surgeMarkers.forEach((sm) => {
          const pt = projectGeo(sm.lat, sm.lng);
          if (sm.category === 'wildfire_hotspot') {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3);
          } else {
            ctx.fillStyle = sm.category === 'air_tanker' ? '#38bdf8' : '#34d399';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // 18. Primary Tactical Assets (Tankers, Helitack, Recon, Bases, Wildfires)
      const currentHoveredTarget = hoveredTargetRef.current;
      const currentHighlightedCategory = highlightedCategoryRef.current;

      filteredAssets.forEach((asset) => {
        const p = projectGeo(asset.lat, asset.lng);
        const isSelected = selectedAssetId === asset.id;
        const isHovered = currentHoveredTarget?.id === asset.id;
        const headingRad = ((asset.heading || 0) * Math.PI) / 180;

        const isC130Asset =
          asset.modelOrType?.includes('C-130') ||
          asset.callsign?.includes('118') ||
          asset.callsign?.includes('116') ||
          asset.callsign?.includes('131') ||
          asset.name?.includes('C-130');

        const isCategoryHighlighted =
          currentHighlightedCategory &&
          ((currentHighlightedCategory === 'c130' && isC130Asset) ||
            (currentHighlightedCategory === 'tankers' && asset.category === 'air_tanker' && !isC130Asset) ||
            (currentHighlightedCategory === 'air_tanker' && asset.category === 'air_tanker') ||
            (currentHighlightedCategory === 'helicopters' && asset.category === 'helicopter') ||
            (currentHighlightedCategory === 'helicopter' && asset.category === 'helicopter') ||
            (currentHighlightedCategory === 'wildfires' && asset.category === 'wildfire') ||
            (currentHighlightedCategory === 'wildfire' && asset.category === 'wildfire') ||
            (currentHighlightedCategory === 'calfire_bases' && asset.category === 'air_base') ||
            (currentHighlightedCategory === 'air_base' && asset.category === 'air_base') ||
            (currentHighlightedCategory === 'military_bases' && asset.category === 'military_base') ||
            (currentHighlightedCategory === 'military_base' && asset.category === 'military_base') ||
            (currentHighlightedCategory === 'recon' && asset.category === 'recon_lead') ||
            (currentHighlightedCategory === 'recon_lead' && asset.category === 'recon_lead'));

        // Radar Sweep Phosphor Persistence Calculation
        let phosphorGlow = 0;
        if (isSweepActive) {
          const assetAngle = Math.atan2(p.y - 300, p.x - 400);
          const normalizedAssetAngle = assetAngle < 0 ? assetAngle + Math.PI * 2 : assetAngle;
          let angleDiff = currentSweepAngle - normalizedAssetAngle;
          if (angleDiff < 0) angleDiff += Math.PI * 2;
          if (angleDiff < 0.35) {
            phosphorGlow = 1.0 - angleDiff / 0.35;
          }
        }

        ctx.save();
        ctx.translate(p.x, p.y);

        // Highlight ring if matching category hovered in legend
        if (isCategoryHighlighted) {
          ctx.save();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }

        // Apply Phosphor Glow if recently swept
        if (phosphorGlow > 0) {
          ctx.shadowColor = themeColors.ring;
          ctx.shadowBlur = 12 * phosphorGlow;
        }

        // A. WILDFIRE NASA FIRMS CORONA
        if (asset.category === 'wildfire') {
          // Heat pulse ring
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = isSelected ? 2 : 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, isSelected ? 18 : 12, 0, Math.PI * 2);
          ctx.stroke();

          // Core hot spot
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(0, 0, isSelected ? 7 : 5, 0, Math.PI * 2);
          ctx.fill();

          // Callsign label
          ctx.fillStyle = isSelected ? '#ffffff' : '#fca5a5';
          ctx.font = 'bold 8px JetBrains Mono, monospace';
          ctx.fillText(`${asset.callsign} (${asset.acreage} ac)`, 12, 3);
        }

        // B. AIR TANKER (VLAT & LAT)
        else if (asset.category === 'air_tanker') {
          ctx.rotate(headingRad);

          // Flight vector leader line
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(0, -12);
          ctx.lineTo(0, -26);
          ctx.stroke();
          ctx.setLineDash([]);

          // Aircraft silhouette (Specialized C-130 Hercules 4-engine turboprop vs VLAT/LAT)
          const isC130 = asset.modelOrType?.includes('C-130') || asset.callsign?.includes('118') || asset.callsign?.includes('116') || asset.callsign?.includes('131') || asset.name?.includes('C-130');

          ctx.fillStyle = isSelected || isHovered ? '#ffffff' : isC130 ? '#38bdf8' : themeColors.tankerColor;
          ctx.strokeStyle = isC130 ? '#0284c7' : '#0369a1';
          ctx.lineWidth = 0.8;

          if (isC130) {
            // Lockheed C-130 Hercules (Wide cargo fuselage, straight high-wing, 4 Allison T56 turboprops)
            ctx.beginPath();
            ctx.moveTo(0, -15); // Nose
            ctx.lineTo(2.5, -4);
            ctx.lineTo(14, -3); // Right straight wingtip
            ctx.lineTo(14, 0);
            ctx.lineTo(2.5, 1);
            ctx.lineTo(2.5, 11); // Cargo sponson aft
            ctx.lineTo(8, 13); // Tailplane
            ctx.lineTo(8, 15);
            ctx.lineTo(0, 14);
            ctx.lineTo(-8, 15);
            ctx.lineTo(-8, 13);
            ctx.lineTo(-2.5, 11);
            ctx.lineTo(-2.5, 1);
            ctx.lineTo(-14, 0); // Left wingtip
            ctx.lineTo(-14, -3);
            ctx.lineTo(-2.5, -4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 4 Turboprop Engine Nacelles
            ctx.fillStyle = '#f59e0b';
            [-10, -5.5, 5.5, 10].forEach((engX) => {
              ctx.fillRect(engX - 1, -4.5, 2, 4.5);
            });
          } else {
            ctx.beginPath();
            // Fuselage + wings (Swept-wing Jet / S-2T Turbo Tracker)
            ctx.moveTo(0, -12);
            ctx.lineTo(2, -3);
            ctx.lineTo(10, 4);
            ctx.lineTo(10, 6);
            ctx.lineTo(2, 3);
            ctx.lineTo(2, 9);
            ctx.lineTo(5, 12);
            ctx.lineTo(0, 11);
            ctx.lineTo(-5, 12);
            ctx.lineTo(-2, 9);
            ctx.lineTo(-2, 3);
            ctx.lineTo(-10, 6);
            ctx.lineTo(-10, 4);
            ctx.lineTo(-2, -3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }

          // Retardant pod beacon
          ctx.fillStyle = isC130 ? '#ef4444' : '#f97316';
          ctx.beginPath();
          ctx.arc(0, 1, isC130 ? 2.2 : 1.8, 0, Math.PI * 2);
          ctx.fill();

          // Reset rotation for text label & altitude badge
          ctx.rotate(-headingRad);
          // Callsign badge pill background
          ctx.fillStyle = isSelected ? 'rgba(8, 47, 73, 0.92)' : isHovered ? 'rgba(3, 105, 161, 0.85)' : 'rgba(2, 6, 23, 0.75)';
          ctx.strokeStyle = isSelected ? '#38bdf8' : isHovered ? '#0ea5e9' : isC130 ? 'rgba(56, 189, 248, 0.6)' : 'rgba(56, 189, 248, 0.3)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.roundRect(11, -8, isC130 ? 68 : 56, 14, 3);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isSelected ? '#ffffff' : isC130 ? '#38bdf8' : '#7dd3fc';
          ctx.font = 'bold 7.5px JetBrains Mono, monospace';
          ctx.fillText(isC130 ? `C130 ${asset.callsign.replace('TANKER-', 'T-')}` : asset.callsign, 14, -1);

          if (asset.altitudeFt) {
            ctx.fillStyle = isSelected ? '#38bdf8' : '#94a3b8';
            ctx.font = '6px JetBrains Mono, monospace';
            ctx.fillText(`${(asset.altitudeFt / 1000).toFixed(1)}k' · ${asset.speedKnots}k`, 14, 5);
          }
        }

        // C. HELICOPTER / HELITACK
        else if (asset.category === 'helicopter') {
          ctx.rotate(headingRad);

          // Spinning rotor circle
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 0.8;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(0, 0, 11, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Helicopter fuselage & tail boom
          ctx.fillStyle = isSelected || isHovered ? '#ffffff' : themeColors.heliColor;
          ctx.beginPath();
          ctx.ellipse(0, 0, 3, 7, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(0, 7);
          ctx.lineTo(0, 13);
          ctx.moveTo(-3, 13);
          ctx.lineTo(3, 13);
          ctx.stroke();

          ctx.rotate(-headingRad);
          // Callsign badge pill background
          ctx.fillStyle = isSelected ? 'rgba(6, 78, 59, 0.92)' : isHovered ? 'rgba(4, 120, 87, 0.85)' : 'rgba(2, 6, 23, 0.75)';
          ctx.strokeStyle = isSelected ? '#34d399' : isHovered ? '#10b981' : 'rgba(52, 211, 153, 0.3)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.roundRect(11, -8, 56, 14, 3);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isSelected ? '#ffffff' : '#6ee7b7';
          ctx.font = 'bold 7.5px JetBrains Mono, monospace';
          ctx.fillText(asset.callsign, 14, -1);

          if (asset.altitudeFt) {
            ctx.fillStyle = isSelected ? '#34d399' : '#94a3b8';
            ctx.font = '6px JetBrains Mono, monospace';
            ctx.fillText(`${(asset.altitudeFt / 1000).toFixed(1)}k' · ${asset.speedKnots}k`, 14, 5);
          }
        }

        // D. CAL FIRE / MILITARY AIR ATTACK BASES
        else if ((asset.category === 'air_base' && showAirBases) || (asset.category === 'military_base' && showMilitaryBases)) {
          const isMil = asset.category === 'military_base';

          // Base runway / ramp line
          ctx.strokeStyle = isMil ? '#38bdf8' : '#f97316';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(-7, 0);
          ctx.lineTo(7, 0);
          ctx.stroke();

          ctx.fillStyle = isMil ? '#082f49' : '#ea580c';
          ctx.beginPath();
          ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Base badge
          ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
          ctx.strokeStyle = isMil ? 'rgba(56, 189, 248, 0.4)' : 'rgba(249, 115, 22, 0.4)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.roundRect(10, -7, isMil ? 50 : 36, 12, 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isSelected ? '#ffffff' : isMil ? '#7dd3fc' : '#fdba74';
          ctx.font = 'bold 7px JetBrains Mono, monospace';
          ctx.fillText(`${asset.callsign}${isMil ? ' [DoD]' : ''}`, 13, 2);
        }

        // E. RECON & LEAD PLANES
        else if (asset.category === 'recon_lead') {
          ctx.rotate(headingRad);
          ctx.fillStyle = isSelected || isHovered ? '#ffffff' : '#0284c7';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.lineTo(5, 0);
          ctx.lineTo(0, 8);
          ctx.lineTo(-5, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.rotate(-headingRad);
          ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.roundRect(10, -7, 44, 12, 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 7px JetBrains Mono, monospace';
          ctx.fillText(asset.callsign, 13, 2);
        }

        // SELECTION RETICLE BRACKETS [ ⌖ ]
        if (isSelected || isHovered) {
          ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(56, 189, 248, 0.7)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          // Top-left
          ctx.moveTo(-16, -10);
          ctx.lineTo(-16, -16);
          ctx.lineTo(-10, -16);
          // Top-right
          ctx.moveTo(10, -16);
          ctx.lineTo(16, -16);
          ctx.lineTo(16, -10);
          // Bottom-right
          ctx.moveTo(16, 10);
          ctx.lineTo(16, 16);
          ctx.lineTo(10, 16);
          // Bottom-left
          ctx.moveTo(-10, 16);
          ctx.lineTo(-16, 16);
          ctx.lineTo(-16, 10);
          ctx.stroke();

          // Tactical In-Canvas Callout Tag on Hover
          if (isHovered && !isSelected) {
            ctx.save();
            ctx.fillStyle = 'rgba(2, 6, 23, 0.94)';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(14, -22, 110, 16, 3);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 7px JetBrains Mono, monospace';
            ctx.fillText(`${hoveredTarget?.iconSymbol || '⌖'} ${asset.callsign}`, 18, -11);
            ctx.restore();
          }

          // Tactical Aircraft Leader Tag & Data Block
          if (isSelected && asset.altitudeFt) {
            ctx.save();
            ctx.setLineDash([]);
            // Leader Line
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(16, -16);
            ctx.lineTo(36, -36);
            ctx.lineTo(105, -36);
            ctx.stroke();

            // Tactical Box
            ctx.fillStyle = 'rgba(3, 8, 20, 0.9)';
            ctx.fillRect(36, -65, 85, 28);
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(36, -65, 85, 28);

            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 6.5px JetBrains Mono, monospace';
            ctx.fillText(asset.callsign, 40, -55);
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '6px JetBrains Mono, monospace';
            ctx.fillText(`ALT: ${(asset.altitudeFt / 100).toFixed(0).padStart(3, '0')}  SPD: ${asset.speedKnots}K`, 40, -47);
            ctx.fillText(`HDG: ${asset.heading}°  ${asset.status}`, 40, -39);
            ctx.restore();
          }
        }

        ctx.restore();
      });

      // Tactical Reticle for Hovered Non-Asset Targets (VOR Airway Fixes, Wind Stations, Mountain Peaks)
      if (currentHoveredTarget && !currentHoveredTarget.rawAsset) {
        const pt = projectGeo(currentHoveredTarget.lat, currentHoveredTarget.lng);
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        const rSize = 14;
        const bLen = 5;
        // Top-left
        ctx.moveTo(-rSize, -rSize + bLen); ctx.lineTo(-rSize, -rSize); ctx.lineTo(-rSize + bLen, -rSize);
        // Top-right
        ctx.moveTo(rSize - bLen, -rSize); ctx.lineTo(rSize, -rSize); ctx.lineTo(rSize, -rSize + bLen);
        // Bottom-right
        ctx.moveTo(rSize, rSize - bLen); ctx.lineTo(rSize, rSize); ctx.lineTo(rSize - bLen, rSize);
        // Bottom-left
        ctx.moveTo(-rSize + bLen, rSize); ctx.lineTo(-rSize, rSize); ctx.lineTo(-rSize, rSize - bLen);
        ctx.stroke();

        // Pulsing circular boundary
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, rSize + 4, 0, Math.PI * 2);
        ctx.stroke();

        // In-Canvas Callout Tag on Hover
        ctx.fillStyle = 'rgba(2, 6, 23, 0.94)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.roundRect(rSize + 4, -10, 110, 20, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 7px JetBrains Mono, monospace';
        ctx.fillText(`${currentHoveredTarget.iconSymbol} ${currentHoveredTarget.callsign || currentHoveredTarget.name}`, rSize + 8, 3);
        ctx.restore();
      }

      // 19. Tactical Geodetic Scale Bar in Corner
      ctx.save();
      const scaleX1 = sectorViewBox.x + 20;
      const scaleY1 = sectorViewBox.y + sectorViewBox.height - 25;
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(scaleX1, scaleY1);
      ctx.lineTo(scaleX1 + 65, scaleY1);
      ctx.moveTo(scaleX1, scaleY1 - 4);
      ctx.lineTo(scaleX1, scaleY1 + 4);
      ctx.moveTo(scaleX1 + 32.5, scaleY1 - 2);
      ctx.lineTo(scaleX1 + 32.5, scaleY1 + 2);
      ctx.moveTo(scaleX1 + 65, scaleY1 - 4);
      ctx.lineTo(scaleX1 + 65, scaleY1 + 4);
      ctx.stroke();

      ctx.fillStyle = '#7dd3fc';
      ctx.font = 'bold 6.5px JetBrains Mono, monospace';
      ctx.fillText('0       50 NM      100 NM', scaleX1, scaleY1 - 6);
      ctx.restore();

      ctx.restore();

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [
    sectorViewBox,
    themeColors,
    filteredAssets,
    selectedAssetId,
    hoveredAsset,
    isSweepActive,
    sweepSpeed,
    showVectorTrails,
    showTFRZones,
    showTopography,
    showAirways,
    showWinds,
    showClassBAirspace,
    showRetardantDrops,
    highDensityMode,
    surgeMarkers,
    showAirBases,
    showMilitaryBases,
    airwayFixes,
    mountainPeaks,
    windStations,
  ]);

  return (
    <div ref={containerRef} className={`relative w-full h-full select-none overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}>
      {/* High-Performance Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
        onMouseLeave={() => {
          setIsDragging(false);
          setHoveredTarget(null);
          setHoverPos(null);
        }}
        className="w-full h-full min-h-[540px] block"
      />

      {/* Interactive Quick-Zoom HUD Controls Overlay */}
      <div className="absolute top-14 right-4 z-30 flex flex-col items-end gap-1.5 font-mono">
        <div className="flex items-center gap-1 bg-slate-950/85 backdrop-blur-md p-1 rounded-lg border border-slate-800 shadow-xl text-[10px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoomScale((z) => Math.min(6.0, +(z * 1.3).toFixed(2)));
              onPlayBeep?.(980, 'sine', 0.03);
            }}
            className="w-7 h-7 flex items-center justify-center rounded bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-slate-200 hover:text-cyan-300 font-bold transition-all cursor-pointer"
            title="Scroll In / Zoom In (or use Mousewheel Up)"
          >
            +
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoomScale((z) => Math.max(0.7, +(z / 1.3).toFixed(2)));
              onPlayBeep?.(750, 'sine', 0.03);
            }}
            className="w-7 h-7 flex items-center justify-center rounded bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-slate-200 hover:text-cyan-300 font-bold transition-all cursor-pointer"
            title="Scroll Out / Zoom Out (or use Mousewheel Down)"
          >
            -
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoomScale(1.0);
              setPanOffset({ x: 0, y: 0 });
              onPlayBeep?.(650, 'sine', 0.03);
            }}
            className="px-2 h-7 flex items-center justify-center rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white font-bold text-[9px] transition-all cursor-pointer uppercase"
            title="Reset Zoom & Center View"
          >
            {Math.round(zoomScale * 100)}%
          </button>
        </div>
        <div className="text-[9px] text-slate-400 bg-black/60 px-2 py-0.5 rounded border border-slate-800/80 pointer-events-none">
          SCROLL WHEEL TO ZOOM · DRAG TO PAN
        </div>
      </div>

      {/* Floating Canvas HUD Tooltip on Hover with Rich Individual Icon Description */}
      {hoveredTarget && hoverPos && (
        <div
          className="fixed pointer-events-none z-50 p-3 rounded-xl bg-slate-950/95 border border-cyan-500/80 shadow-2xl font-mono text-[11px] text-white space-y-2 backdrop-blur-md max-w-sm sm:max-w-md animate-in fade-in zoom-in-95"
          style={{
            left: typeof window !== 'undefined' ? Math.max(12, Math.min(window.innerWidth - 380, hoverPos.x + 18)) : hoverPos.x,
            top: typeof window !== 'undefined' ? Math.max(12, Math.min(window.innerHeight - 280, hoverPos.y - 50)) : hoverPos.y,
          }}
        >
          {/* Header with Icon Symbol & Category Badge */}
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xl select-none leading-none">{hoveredTarget.iconSymbol}</span>
              <div>
                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wide block">
                  {hoveredTarget.categoryLabel}
                </span>
                <span className="text-[9px] text-slate-400 font-sans block">
                  Visual Glyph: {hoveredTarget.iconVisualShape}
                </span>
              </div>
            </div>
            {hoveredTarget.status && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 border ${
                hoveredTarget.status === 'Retardant Drop' || hoveredTarget.status === 'Active Burn'
                  ? 'bg-red-950/90 text-red-300 border-red-700 animate-pulse'
                  : 'bg-slate-900 text-emerald-300 border-slate-700'
              }`}>
                {hoveredTarget.status}
              </span>
            )}
          </div>

          {/* Name & Callsign */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-white text-xs">{hoveredTarget.name}</span>
            <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 text-[10px] font-bold border border-cyan-800">
              {hoveredTarget.callsign}
            </span>
          </div>

          {/* Full Icon Description & Operational Role */}
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/90 text-[10px] text-slate-200 leading-relaxed font-sans shadow-inner">
            <div className="text-[9px] font-bold uppercase text-amber-400 font-mono tracking-wider mb-1 flex items-center gap-1">
              <span>● ICON DESCRIPTION &amp; ROLE:</span>
            </div>
            <p className="text-slate-300 leading-normal">
              {hoveredTarget.iconRoleDescription}
            </p>
          </div>

          {/* Generated Telemetry Specs Breakdown */}
          {hoveredTarget.specs && Object.keys(hoveredTarget.specs).length > 0 && (
            <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-800/70 text-[9px]">
              {Object.entries(hoveredTarget.specs).map(([key, val]) => (
                <div key={key} className="text-slate-400">
                  <span className="text-slate-500 uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
                  <strong className="text-white font-mono">{String(val)}</strong>
                </div>
              ))}
            </div>
          )}

          {hoveredTarget.altitudeFt && (
            <div className="text-[9px] text-slate-400 flex items-center justify-between gap-3 pt-1 border-t border-slate-800/80 font-mono">
              <span>ALT: <strong className="text-cyan-300">{hoveredTarget.altitudeFt.toLocaleString()}' MSL</strong></span>
              <span>SPD: <strong className="text-emerald-300">{hoveredTarget.speedKnots} kts</strong></span>
              <span>HDG: <strong className="text-amber-300">{hoveredTarget.heading}°</strong></span>
            </div>
          )}

          {/* Action Prompt */}
          <div className="text-[9px] text-cyan-400/90 pt-1 border-t border-slate-800/60 flex items-center justify-between">
            <span>[CLICK TARGET TO LOCK TELEMETRY &amp; MAINTENANCE]</span>
            <span className="text-slate-500 font-mono text-[8px]">
              LAT {hoveredTarget.lat.toFixed(2)}° · LNG {hoveredTarget.lng.toFixed(2)}°
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
