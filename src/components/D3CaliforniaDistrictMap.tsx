import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Plane,
  Flame,
  Radio,
  Navigation,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Activity,
  Shield,
  MapPin,
  Gauge,
  Layers,
  Filter,
  Play,
  Pause,
  ChevronRight,
  Maximize2
} from 'lucide-react';

export interface DistrictAsset {
  id: string;
  callsign: string;
  name: string;
  type: 'tanker' | 'copter';
  model: string;
  transponderHex: string;
  districtId: string;
  districtName: string;
  lat: number;
  lng: number;
  heading: number; // degrees 0-360
  speedKts: number;
  altitudeFt: number;
  fuelPct: number;
  retardantGal: number;
  maxRetardantGal: number;
  status: 'En Route' | 'Retardant Drop' | 'Initial Attack' | 'Reloading' | 'Patrol';
  assignedIncident: string;
  targetWaypoints: Array<{ lat: number; lng: number }>;
}

export interface CaliforniaDistrict {
  id: string;
  name: string;
  code: string;
  region: 'North Ops' | 'South Ops' | 'Joint Defense';
  commandBase: string;
  activeFires: number;
  threatLevel: 'Low' | 'Moderate' | 'High' | 'Extreme';
  coordinates: [number, number][]; // [lng, lat] polygon boundary
  centroid: [number, number]; // [lng, lat]
}

interface D3CaliforniaDistrictMapProps {
  isPipelineRunning?: boolean;
  onAssetSelect?: (asset: DistrictAsset) => void;
}

// California Operational Fire Districts (GeoJSON-compatible polygon coordinates: [lng, lat])
export const CALIFORNIA_DISTRICTS: CaliforniaDistrict[] = [
  {
    id: 'dist-cascade-shasta',
    name: 'Cascade & Shasta Operational District',
    code: 'SHU/SKU',
    region: 'North Ops',
    commandBase: 'Redding Air Attack Base (RDD)',
    activeFires: 3,
    threatLevel: 'Extreme',
    centroid: [-122.2, 40.8],
    coordinates: [
      [-124.21, 42.00],
      [-120.00, 42.00],
      [-120.00, 40.50],
      [-121.50, 40.30],
      [-122.80, 40.40],
      [-124.41, 40.44],
      [-124.23, 40.76],
      [-124.25, 41.78],
      [-124.21, 42.00],
    ],
  },
  {
    id: 'dist-sierra-motherlode',
    name: 'Sierra Foothills & Mother Lode District',
    code: 'NEU/TCU',
    region: 'North Ops',
    commandBase: 'McClellan Tanker Base (MCC)',
    activeFires: 2,
    threatLevel: 'High',
    centroid: [-120.8, 39.1],
    coordinates: [
      [-121.50, 40.30],
      [-120.00, 40.50],
      [-120.00, 39.00],
      [-119.50, 38.00],
      [-120.40, 37.80],
      [-121.30, 38.40],
      [-121.60, 39.50],
      [-121.50, 40.30],
    ],
  },
  {
    id: 'dist-north-coast',
    name: 'North Coast & Wine Country District',
    code: 'MEU/LNU',
    region: 'North Ops',
    commandBase: 'Sonoma / Santa Rosa Base (STS)',
    activeFires: 1,
    threatLevel: 'Moderate',
    centroid: [-123.1, 39.0],
    coordinates: [
      [-124.41, 40.44],
      [-122.80, 40.40],
      [-122.00, 38.80],
      [-122.40, 38.10],
      [-122.53, 37.82],
      [-123.02, 37.99],
      [-123.06, 38.31],
      [-123.74, 38.95],
      [-124.07, 40.02],
      [-124.41, 40.44],
    ],
  },
  {
    id: 'dist-central-coast',
    name: 'Central Coast & Monterey Bay District',
    code: 'BEU/CZU',
    region: 'South Ops',
    commandBase: 'Paso Robles Air Attack Base (PRB)',
    activeFires: 2,
    threatLevel: 'High',
    centroid: [-121.4, 36.3],
    coordinates: [
      [-122.53, 37.82],
      [-121.80, 37.60],
      [-121.20, 36.50],
      [-120.60, 35.40],
      [-120.65, 34.90],
      [-120.47, 34.45],
      [-120.90, 35.25],
      [-121.28, 35.66],
      [-121.90, 36.31],
      [-122.01, 36.96],
      [-122.51, 37.78],
      [-122.53, 37.82],
    ],
  },
  {
    id: 'dist-san-joaquin',
    name: 'San Joaquin & High Sierra District',
    code: 'FKU/MMU',
    region: 'South Ops',
    commandBase: 'Fresno Yosemite Base (FAT)',
    activeFires: 2,
    threatLevel: 'Extreme',
    centroid: [-119.6, 36.8],
    coordinates: [
      [-121.30, 38.40],
      [-120.40, 37.80],
      [-119.50, 38.00],
      [-118.40, 36.50],
      [-118.80, 35.40],
      [-120.00, 35.80],
      [-120.60, 36.40],
      [-121.20, 37.20],
      [-121.30, 38.40],
    ],
  },
  {
    id: 'dist-angeles-transverse',
    name: 'Angeles Basin & Transverse District',
    code: 'BDU/LAC',
    region: 'South Ops',
    commandBase: 'Fox Field / San Bernardino (WJF/SBD)',
    activeFires: 4,
    threatLevel: 'Extreme',
    centroid: [-117.8, 34.4],
    coordinates: [
      [-120.47, 34.45],
      [-120.00, 35.00],
      [-118.80, 35.40],
      [-117.20, 35.20],
      [-116.50, 34.40],
      [-117.00, 33.90],
      [-117.88, 33.60],
      [-118.40, 33.74],
      [-118.80, 34.00],
      [-119.52, 34.40],
      [-120.47, 34.45],
    ],
  },
  {
    id: 'dist-southern-border',
    name: 'Peninsular & Border Backcountry District',
    code: 'RRU/MVU',
    region: 'South Ops',
    commandBase: 'Ramona Air Attack Base (RNM)',
    activeFires: 2,
    threatLevel: 'High',
    centroid: [-116.8, 33.2],
    coordinates: [
      [-117.88, 33.60],
      [-117.00, 33.90],
      [-116.50, 34.40],
      [-114.65, 35.00],
      [-114.72, 32.75],
      [-117.12, 32.53],
      [-117.24, 32.67],
      [-117.38, 33.20],
      [-117.71, 33.46],
      [-117.88, 33.60],
    ],
  },
  {
    id: 'dist-mojave-desert',
    name: 'Mojave Basin & Eastern Sierra District',
    code: 'CND/FED',
    region: 'Joint Defense',
    commandBase: 'Edwards AFB / March ARB (EDW/RIV)',
    activeFires: 1,
    threatLevel: 'Moderate',
    centroid: [-116.2, 35.5],
    coordinates: [
      [-118.40, 36.50],
      [-119.50, 38.00],
      [-120.00, 39.00],
      [-114.64, 35.00],
      [-116.50, 34.40],
      [-117.20, 35.20],
      [-118.80, 35.40],
      [-118.40, 36.50],
    ],
  }
];

// Initial Real-Time Aviation Asset Fleet
export const INITIAL_ASSETS: DistrictAsset[] = [
  // --- HEAVY AIR TANKERS (VLAT & LAT) ---
  {
    id: 'tanker-910',
    callsign: 'TANKER-910',
    name: 'Tanker 910 (DC-10 VLAT)',
    type: 'tanker',
    model: 'McDonnell Douglas DC-10-30',
    transponderHex: 'A3C8B1',
    districtId: 'dist-angeles-transverse',
    districtName: 'Angeles Basin & Transverse District',
    lat: 34.34,
    lng: -118.08,
    heading: 122,
    speedKts: 275,
    altitudeFt: 4800,
    fuelPct: 78,
    retardantGal: 9400,
    maxRetardantGal: 9400,
    status: 'Retardant Drop',
    assignedIncident: 'Angeles Ridge Complex',
    targetWaypoints: [
      { lat: 34.50, lng: -118.30 },
      { lat: 34.34, lng: -118.08 },
      { lat: 34.20, lng: -117.85 },
    ],
  },
  {
    id: 'tanker-118',
    callsign: 'TANKER-118',
    name: 'Tanker 118 (C-130H Hercules)',
    type: 'tanker',
    model: 'Lockheed C-130H Hercules',
    transponderHex: 'AC14F2',
    districtId: 'dist-sierra-motherlode',
    districtName: 'Sierra Foothills & Mother Lode District',
    lat: 38.72,
    lng: -121.35,
    heading: 42,
    speedKts: 240,
    altitudeFt: 6100,
    fuelPct: 84,
    retardantGal: 4000,
    maxRetardantGal: 4000,
    status: 'En Route',
    assignedIncident: 'Feather River Fire',
    targetWaypoints: [
      { lat: 38.50, lng: -121.50 },
      { lat: 38.72, lng: -121.35 },
      { lat: 39.40, lng: -121.10 },
    ],
  },
  {
    id: 'tanker-102',
    callsign: 'TANKER-102',
    name: 'Tanker 102 (MD-87 LAT)',
    type: 'tanker',
    model: 'McDonnell Douglas MD-87',
    transponderHex: 'A5E902',
    districtId: 'dist-cascade-shasta',
    districtName: 'Cascade & Shasta Operational District',
    lat: 40.25,
    lng: -121.90,
    heading: 215,
    speedKts: 260,
    altitudeFt: 5400,
    fuelPct: 62,
    retardantGal: 3000,
    maxRetardantGal: 3000,
    status: 'Initial Attack',
    assignedIncident: 'Lassen Flank Wildfire',
    targetWaypoints: [
      { lat: 40.60, lng: -121.60 },
      { lat: 40.25, lng: -121.90 },
      { lat: 39.80, lng: -122.20 },
    ],
  },
  {
    id: 'tanker-80',
    callsign: 'TANKER-80',
    name: 'Tanker 80 (S-2T Turbo Tracker)',
    type: 'tanker',
    model: 'Grumman S-2T Turbo Tracker',
    transponderHex: 'A21D88',
    districtId: 'dist-cascade-shasta',
    districtName: 'Cascade & Shasta Operational District',
    lat: 40.55,
    lng: -122.42,
    heading: 95,
    speedKts: 210,
    altitudeFt: 3500,
    fuelPct: 55,
    retardantGal: 1200,
    maxRetardantGal: 1200,
    status: 'Retardant Drop',
    assignedIncident: 'Shasta West Fire',
    targetWaypoints: [
      { lat: 40.50, lng: -122.60 },
      { lat: 40.55, lng: -122.42 },
      { lat: 40.60, lng: -122.10 },
    ],
  },
  {
    id: 'tanker-96',
    callsign: 'TANKER-96',
    name: 'Tanker 96 (S-2T Turbo Tracker)',
    type: 'tanker',
    model: 'Grumman S-2T Turbo Tracker',
    transponderHex: 'A99C04',
    districtId: 'dist-central-coast',
    districtName: 'Central Coast & Monterey Bay District',
    lat: 35.85,
    lng: -121.30,
    heading: 320,
    speedKts: 215,
    altitudeFt: 3200,
    fuelPct: 69,
    retardantGal: 1200,
    maxRetardantGal: 1200,
    status: 'Retardant Drop',
    assignedIncident: 'Big Sur Ridge Fire',
    targetWaypoints: [
      { lat: 35.65, lng: -121.10 },
      { lat: 35.85, lng: -121.30 },
      { lat: 36.15, lng: -121.65 },
    ],
  },
  {
    id: 'tanker-160',
    callsign: 'TANKER-160',
    name: 'Tanker 160 (Avro RJ85)',
    type: 'tanker',
    model: 'British Aerospace RJ85',
    transponderHex: 'B0182C',
    districtId: 'dist-southern-border',
    districtName: 'Peninsular & Border Backcountry District',
    lat: 33.15,
    lng: -116.80,
    heading: 180,
    speedKts: 250,
    altitudeFt: 4600,
    fuelPct: 73,
    retardantGal: 3100,
    maxRetardantGal: 3100,
    status: 'En Route',
    assignedIncident: 'Cuyamaca Crest Fire',
    targetWaypoints: [
      { lat: 33.40, lng: -116.80 },
      { lat: 33.15, lng: -116.80 },
      { lat: 32.80, lng: -116.70 },
    ],
  },

  // --- HELITACK & HELITANKERS (COPTER FLEET) ---
  {
    id: 'copter-106',
    callsign: 'COPTER-106',
    name: 'Copter 106 (S-70i Firehawk)',
    type: 'copter',
    model: 'Sikorsky S-70i Firehawk',
    transponderHex: 'A1B2C3',
    districtId: 'dist-north-coast',
    districtName: 'North Coast & Wine Country District',
    lat: 38.86,
    lng: -122.75,
    heading: 260,
    speedKts: 135,
    altitudeFt: 2200,
    fuelPct: 82,
    retardantGal: 1000,
    maxRetardantGal: 1000,
    status: 'Retardant Drop',
    assignedIncident: 'Mendocino Complex Fire',
    targetWaypoints: [
      { lat: 38.80, lng: -122.60 },
      { lat: 38.86, lng: -122.75 },
      { lat: 38.92, lng: -122.95 },
    ],
  },
  {
    id: 'copter-501',
    callsign: 'COPTER-501',
    name: 'Copter 501 (CH-47D Chinook)',
    type: 'copter',
    model: 'Boeing CH-47D Chinook',
    transponderHex: 'A77DF1',
    districtId: 'dist-san-joaquin',
    districtName: 'San Joaquin & High Sierra District',
    lat: 36.90,
    lng: -119.55,
    heading: 75,
    speedKts: 140,
    altitudeFt: 3800,
    fuelPct: 68,
    retardantGal: 2600,
    maxRetardantGal: 2600,
    status: 'Initial Attack',
    assignedIncident: 'Sierra Creek Fire',
    targetWaypoints: [
      { lat: 36.80, lng: -119.70 },
      { lat: 36.90, lng: -119.55 },
      { lat: 37.10, lng: -119.30 },
    ],
  },
  {
    id: 'copter-301',
    callsign: 'COPTER-301',
    name: 'Copter 301 (S-70i Firehawk)',
    type: 'copter',
    model: 'Sikorsky S-70i Firehawk',
    transponderHex: 'A33201',
    districtId: 'dist-angeles-transverse',
    districtName: 'Angeles Basin & Transverse District',
    lat: 33.78,
    lng: -116.95,
    heading: 310,
    speedKts: 130,
    altitudeFt: 2900,
    fuelPct: 75,
    retardantGal: 1000,
    maxRetardantGal: 1000,
    status: 'Patrol',
    assignedIncident: 'San Jacinto Ridge Monitor',
    targetWaypoints: [
      { lat: 33.70, lng: -116.80 },
      { lat: 33.78, lng: -116.95 },
      { lat: 33.90, lng: -117.15 },
    ],
  },
  {
    id: 'copter-408',
    callsign: 'COPTER-408',
    name: 'Copter 408 (S-64F Skycrane)',
    type: 'copter',
    model: 'Erickson S-64F Aircrane',
    transponderHex: 'A90E45',
    districtId: 'dist-angeles-transverse',
    districtName: 'Angeles Basin & Transverse District',
    lat: 34.65,
    lng: -118.25,
    heading: 145,
    speedKts: 110,
    altitudeFt: 3100,
    fuelPct: 58,
    retardantGal: 2500,
    maxRetardantGal: 2650,
    status: 'Retardant Drop',
    assignedIncident: 'Angeles Ridge Complex',
    targetWaypoints: [
      { lat: 34.75, lng: -118.35 },
      { lat: 34.65, lng: -118.25 },
      { lat: 34.50, lng: -118.15 },
    ],
  },
  {
    id: 'copter-205',
    callsign: 'COPTER-205',
    name: 'Copter 205 (Bell 205A++ Super Huey)',
    type: 'copter',
    model: 'Bell 205A++ Super Huey',
    transponderHex: 'A12F90',
    districtId: 'dist-cascade-shasta',
    districtName: 'Cascade & Shasta Operational District',
    lat: 39.95,
    lng: -122.10,
    heading: 15,
    speedKts: 115,
    altitudeFt: 1800,
    fuelPct: 88,
    retardantGal: 360,
    maxRetardantGal: 360,
    status: 'Patrol',
    assignedIncident: 'Tehama Foothills Survey',
    targetWaypoints: [
      { lat: 39.85, lng: -122.15 },
      { lat: 39.95, lng: -122.10 },
      { lat: 40.10, lng: -122.05 },
    ],
  },
  {
    id: 'copter-538',
    callsign: 'COPTER-538',
    name: 'Copter 538 (S-70M Firehawk)',
    type: 'copter',
    model: 'Sikorsky S-70M Firehawk',
    transponderHex: 'A55B77',
    districtId: 'dist-southern-border',
    districtName: 'Peninsular & Border Backcountry District',
    lat: 33.68,
    lng: -116.65,
    heading: 230,
    speedKts: 125,
    altitudeFt: 4200,
    fuelPct: 64,
    retardantGal: 1000,
    maxRetardantGal: 1000,
    status: 'Initial Attack',
    assignedIncident: 'San Jacinto Highland Fire',
    targetWaypoints: [
      { lat: 33.75, lng: -116.55 },
      { lat: 33.68, lng: -116.65 },
      { lat: 33.60, lng: -116.80 },
    ],
  },
];

export const D3CaliforniaDistrictMap: React.FC<D3CaliforniaDistrictMapProps> = ({
  isPipelineRunning = false,
  onAssetSelect,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // State management
  const [assets, setAssets] = useState<DistrictAsset[]>(INITIAL_ASSETS);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('tanker-910');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [assetFilter, setAssetFilter] = useState<'all' | 'tanker' | 'copter'>('all');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [hoveredDistrict, setHoveredDistrict] = useState<CaliforniaDistrict | null>(null);
  const [hoveredAsset, setHoveredAsset] = useState<DistrictAsset | null>(null);
  const [telemetryTick, setTelemetryTick] = useState<number>(0);

  // Zoom reference to trigger programmatic zoom actions
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Currently selected asset
  const selectedAsset = useMemo(() => {
    return assets.find((a) => a.id === selectedAssetId) || assets[0];
  }, [assets, selectedAssetId]);

  // Filtered asset pool
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (assetFilter === 'tanker' && a.type !== 'tanker') return false;
      if (assetFilter === 'copter' && a.type !== 'copter') return false;
      if (selectedDistrictId && a.districtId !== selectedDistrictId) return false;
      return true;
    });
  }, [assets, assetFilter, selectedDistrictId]);

  // Real-Time Simulation Interval: Move aircraft along flight vectors
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setAssets((prevAssets) =>
        prevAssets.map((asset) => {
          // Slight jitter and vector translation based on speed and heading
          const rad = (asset.heading * Math.PI) / 180;
          const deltaLat = Math.cos(rad) * 0.0035 * simSpeed;
          const deltaLng = Math.sin(rad) * 0.0045 * simSpeed;

          // Keep within California bounds
          let newLat = asset.lat + deltaLat;
          let newLng = asset.lng + deltaLng;
          let newHeading = asset.heading;

          if (newLat > 41.8 || newLat < 32.5) {
            newHeading = (newHeading + 180) % 360;
            newLat = Math.max(32.5, Math.min(41.8, newLat));
          }
          if (newLng < -124.2 || newLng > -114.5) {
            newHeading = (newHeading + 180) % 360;
            newLng = Math.max(-124.2, Math.min(-114.5, newLng));
          }

          // Random slight heading drift
          if (Math.random() < 0.2) {
            newHeading = (newHeading + (Math.random() * 8 - 4) + 360) % 360;
          }

          return {
            ...asset,
            lat: Number(newLat.toFixed(4)),
            lng: Number(newLng.toFixed(4)),
            heading: Math.round(newHeading),
            speedKts: Math.max(90, Math.min(320, asset.speedKts + Math.round((Math.random() - 0.5) * 4))),
          };
        })
      );
      setTelemetryTick((t) => t + 1);
    }, 1200 / (isPipelineRunning ? 2 : 1));

    return () => clearInterval(interval);
  }, [isSimulating, simSpeed, isPipelineRunning]);

  // D3 Projection and Map Initialization
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 620;

    const currentTransform = svgRef.current ? d3.zoomTransform(svgRef.current) : d3.zoomIdentity;

    svg.selectAll('*').remove();

    // D3 Mercator Projection calibrated specifically for California
    const projection = d3
      .geoMercator()
      .center([-119.4179, 37.1])
      .scale(2700)
      .translate([width / 2 - 20, height / 2 - 10]);

    const pathGenerator = d3.geoPath().projection(projection);

    // Root container for zoom/pan
    const g = svg.append('g').attr('class', 'map-root');
    if (currentTransform && (currentTransform.k !== 1 || currentTransform.x !== 0 || currentTransform.y !== 0)) {
      g.attr('transform', currentTransform.toString());
    }

    // Setup D3 Zoom Behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 5.0])
      .translateExtent([
        [-100, -100],
        [width + 100, height + 100],
      ])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Defs for gradients, patterns, and glow filters
    const defs = svg.append('defs');

    // Glow filter for active transponder signals
    const filter = defs.append('filter').attr('id', 'd3-glow').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'blur');
    filter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    // Grid background
    const gridPattern = defs
      .append('pattern')
      .attr('id', 'd3-grid')
      .attr('width', 24)
      .attr('height', 24)
      .attr('patternUnits', 'userSpaceOnUse');
    gridPattern.append('path').attr('d', 'M 24 0 L 0 0 0 24').attr('fill', 'none').attr('stroke', '#0f2942').attr('stroke-width', 0.6);

    // Background rect
    g.append('rect')
      .attr('width', width * 1.5)
      .attr('height', height * 1.5)
      .attr('x', -width * 0.25)
      .attr('y', -height * 0.25)
      .attr('fill', '#020617')
      .attr('opacity', 0.95);

    g.append('rect')
      .attr('width', width * 1.5)
      .attr('height', height * 1.5)
      .attr('x', -width * 0.25)
      .attr('y', -height * 0.25)
      .attr('fill', 'url(#d3-grid)')
      .attr('opacity', 0.4);

    // Latitude & Longitude Reference Lines (D3 projected)
    const graticuleGroup = g.append('g').attr('class', 'graticules').attr('opacity', 0.25);
    [42, 40, 38, 36, 34, 32].forEach((lat) => {
      const p1 = projection([-125, lat]);
      const p2 = projection([-113, lat]);
      if (p1 && p2) {
        graticuleGroup
          .append('line')
          .attr('x1', p1[0])
          .attr('y1', p1[1])
          .attr('x2', p2[0])
          .attr('y2', p2[1])
          .attr('stroke', '#38bdf8')
          .attr('stroke-dasharray', '2 4')
          .attr('stroke-width', 0.7);
        graticuleGroup
          .append('text')
          .attr('x', p1[0] + 6)
          .attr('y', p1[1] - 3)
          .text(`${lat}°N`)
          .attr('fill', '#64748b')
          .attr('font-size', '8px')
          .attr('font-family', 'JetBrains Mono');
      }
    });

    // 1. RENDER CALIFORNIA DISTRICT POLYGONS VIA D3 GEO PATH
    const districtsGroup = g.append('g').attr('class', 'districts');

    CALIFORNIA_DISTRICTS.forEach((district) => {
      // Build GeoJSON Polygon Feature from coordinates
      const geoFeature: any = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [district.coordinates],
        },
        properties: { ...district },
      };

      const pathData = pathGenerator(geoFeature);
      const isSelected = selectedDistrictId === district.id;

      if (pathData) {
        // District boundary path
        districtsGroup
          .append('path')
          .attr('d', pathData)
          .attr('class', `district-path-${district.id}`)
          .attr('fill', isSelected ? '#083344' : district.region === 'North Ops' ? '#082f49' : '#0f172a')
          .attr('fill-opacity', isSelected ? 0.8 : 0.45)
          .attr('stroke', isSelected ? '#38bdf8' : district.region === 'North Ops' ? '#0284c7' : '#0369a1')
          .attr('stroke-width', isSelected ? 2 : 1.1)
          .attr('stroke-dasharray', isSelected ? 'none' : '4 2')
          .style('cursor', 'pointer')
          .on('mouseover', function () {
            d3.select(this)
              .transition()
              .duration(150)
              .attr('fill-opacity', 0.7)
              .attr('stroke', '#38bdf8')
              .attr('stroke-width', 1.8);
            setHoveredDistrict(district);
          })
          .on('mouseout', function () {
            if (selectedDistrictId !== district.id) {
              d3.select(this)
                .transition()
                .duration(200)
                .attr('fill-opacity', 0.45)
                .attr('stroke', district.region === 'North Ops' ? '#0284c7' : '#0369a1')
                .attr('stroke-width', 1.1);
            }
            setHoveredDistrict(null);
          })
          .on('click', () => {
            setSelectedDistrictId((prev) => (prev === district.id ? null : district.id));
          });

        // District Centroid Label & Badge
        const center = projection(district.centroid);
        if (center) {
          const labelGroup = districtsGroup
            .append('g')
            .attr('transform', `translate(${center[0]}, ${center[1]})`)
            .style('pointer-events', 'none');

          labelGroup
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-4')
            .text(district.code)
            .attr('fill', isSelected ? '#ffffff' : '#7dd3fc')
            .attr('font-size', '9px')
            .attr('font-family', 'JetBrains Mono')
            .attr('font-weight', 'bold');

          labelGroup
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '7')
            .text(`${district.activeFires} FIRES`)
            .attr('fill', district.threatLevel === 'Extreme' ? '#f87171' : '#fbbf24')
            .attr('font-size', '7px')
            .attr('font-family', 'JetBrains Mono');
        }
      }
    });

    // 2. RENDER FLIGHT FLIGHT CORRIDOR VECTORS (D3 Paths)
    const corridorsGroup = g.append('g').attr('class', 'flight-corridors');

    filteredAssets.forEach((asset) => {
      if (asset.targetWaypoints.length > 1) {
        const lineGenerator = d3
          .line<{ lat: number; lng: number }>()
          .x((d) => projection([d.lng, d.lat])?.[0] || 0)
          .y((d) => projection([d.lng, d.lat])?.[1] || 0)
          .curve(d3.curveCatmullRom);

        const corridorPath = lineGenerator(asset.targetWaypoints);
        if (corridorPath) {
          corridorsGroup
            .append('path')
            .attr('d', corridorPath)
            .attr('fill', 'none')
            .attr('stroke', asset.type === 'tanker' ? '#0284c7' : '#059669')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3 3')
            .attr('opacity', 0.45);
        }
      }
    });

    // 3. RENDER REAL-TIME ASSETS (TANKER & COPTER SVG GLYPHS)
    const assetsGroup = g.append('g').attr('class', 'aircraft-assets');

    filteredAssets.forEach((asset) => {
      const coords = projection([asset.lng, asset.lat]);
      if (!coords) return;

      const isSelected = selectedAsset?.id === asset.id;
      const [x, y] = coords;

      const assetNode = assetsGroup
        .append('g')
        .attr('transform', `translate(${x}, ${y})`)
        .style('cursor', 'pointer')
        .on('click', () => {
          setSelectedAssetId(asset.id);
          onAssetSelect?.(asset);
        })
        .on('mouseover', () => setHoveredAsset(asset))
        .on('mouseout', () => setHoveredAsset(null));

      // Animated transponder radar ping ring
      if (asset.status === 'Retardant Drop' || isPipelineRunning) {
        assetNode
          .append('circle')
          .attr('r', isSelected ? 16 : 12)
          .attr('fill', 'none')
          .attr('stroke', asset.type === 'tanker' ? '#38bdf8' : '#34d399')
          .attr('stroke-width', 1.2)
          .attr('stroke-dasharray', '2 2')
          .attr('opacity', 0.7);
      }

      // Aircraft glyph container rotated by aircraft heading
      const glyphGroup = assetNode.append('g').attr('transform', `rotate(${asset.heading})`);

      if (asset.type === 'tanker') {
        // High-altitude Air Tanker fixed-wing silhouette
        glyphGroup
          .append('path')
          .attr(
            'd',
            'M 0 -11 L 2 -3 L 10 2 L 10 4 L 2 2 L 2 8 L 5 11 L 5 12 L 0 11 L -5 12 L -5 11 L -2 8 L -2 2 L -10 4 L -10 2 L -2 -3 Z'
          )
          .attr('fill', isSelected ? '#ffffff' : '#38bdf8')
          .attr('stroke', '#0369a1')
          .attr('stroke-width', 0.8)
          .attr('filter', isSelected ? 'url(#d3-glow)' : null);

        // Retardant armed beacon indicator
        glyphGroup.append('circle').attr('cx', 0).attr('cy', 1).attr('r', 1.6).attr('fill', '#f97316');
      } else {
        // Helitack / Helitanker rotary silhouette with rotor disc
        glyphGroup
          .append('circle')
          .attr('r', 9)
          .attr('fill', 'none')
          .attr('stroke', isSelected ? '#6ee7b7' : '#10b981')
          .attr('stroke-width', 0.8)
          .attr('stroke-dasharray', '2 2')
          .attr('opacity', 0.8);

        glyphGroup
          .append('ellipse')
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('rx', 2.8)
          .attr('ry', 7.5)
          .attr('fill', isSelected ? '#ffffff' : '#34d399')
          .attr('stroke', '#065f46')
          .attr('stroke-width', 0.8);

        glyphGroup
          .append('line')
          .attr('x1', 0)
          .attr('y1', 7)
          .attr('x2', 0)
          .attr('y2', 12)
          .attr('stroke', '#34d399')
          .attr('stroke-width', 1.2);
      }

      // Callsign and Altitude Text Tag
      assetNode
        .append('text')
        .attr('x', 12)
        .attr('y', 3)
        .text(asset.callsign)
        .attr('fill', isSelected ? '#ffffff' : asset.type === 'tanker' ? '#7dd3fc' : '#6ee7b7')
        .attr('font-size', '8px')
        .attr('font-family', 'JetBrains Mono')
        .attr('font-weight', 'bold');

      assetNode
        .append('text')
        .attr('x', 12)
        .attr('y', 11)
        .text(`${asset.altitudeFt}' MSL · ${asset.speedKts}kt`)
        .attr('fill', '#94a3b8')
        .attr('font-size', '6.5px')
        .attr('font-family', 'JetBrains Mono');

      // Selection reticle brackets around chosen aircraft
      if (isSelected) {
        const reticle = assetNode.append('g').attr('class', 'reticle');
        reticle.append('path').attr('d', 'M -14 -8 L -14 -14 L -8 -14').attr('fill', 'none').attr('stroke', '#38bdf8').attr('stroke-width', 1.5);
        reticle.append('path').attr('d', 'M 8 -14 L 14 -14 L 14 -8').attr('fill', 'none').attr('stroke', '#38bdf8').attr('stroke-width', 1.5);
        reticle.append('path').attr('d', 'M 14 8 L 14 14 L 8 14').attr('fill', 'none').attr('stroke', '#38bdf8').attr('stroke-width', 1.5);
        reticle.append('path').attr('d', 'M -8 14 L -14 14 L -14 8').attr('fill', 'none').attr('stroke', '#38bdf8').attr('stroke-width', 1.5);
      }
    });
  }, [filteredAssets, selectedAsset, selectedDistrictId, isPipelineRunning]);

  // Programmatic Zoom Handlers
  const handleZoom = (scaleFactor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, scaleFactor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(400).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-2xl font-mono text-xs">
      {/* 1. TOP HEADER & TELEMETRY STREAM BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800 bg-slate-950/90 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-bold tracking-wider text-white uppercase text-sm">
              REAL-TIME CALIFORNIA AVIATION DISPATCH MAP (D3.JS)
            </span>
          </div>
          <span className="text-[10px] text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 hidden sm:inline">
            TRANSIT TELEMETRY INGEST
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>STAGE 01 TELEMETRY FEED: <strong>ACTIVE</strong></span>
          </span>
          <span className="text-slate-700">|</span>
          <span>TICK: <strong className="text-cyan-300 tabular-nums">#{telemetryTick}</strong></span>
        </div>
      </div>

      {/* 2. CONTROL TOOLBAR & FILTER MATRIX */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 text-[11px]">
        {/* Asset Filter Tabs */}
        <div className="flex items-center gap-1">
          <span className="text-slate-500 mr-1 text-[10px] font-bold">ASSET FILTER:</span>
          {[
            { id: 'all', label: 'All Fleet', count: assets.length },
            { id: 'tanker', label: '✈️ Air Tankers', count: assets.filter((a) => a.type === 'tanker').length },
            { id: 'copter', label: '🚁 Helitack Copters', count: assets.filter((a) => a.type === 'copter').length },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setAssetFilter(f.id as any)}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer border ${
                assetFilter === f.id
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{f.label}</span>
              <span className="ml-1 opacity-60">({f.count})</span>
            </button>
          ))}

          {selectedDistrictId && (
            <button
              onClick={() => setSelectedDistrictId(null)}
              className="ml-2 px-2 py-1 rounded bg-amber-950/60 border border-amber-500 text-amber-300 text-[10px] cursor-pointer hover:bg-amber-900/60"
            >
              Clear District Filter ✕
            </button>
          )}
        </div>

        {/* Real-time simulation and zoom controls */}
        <div className="flex items-center gap-2">
          {/* Sim Play/Pause */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 ${
              isSimulating
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {isSimulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isSimulating ? 'STREAMING' : 'PAUSED'}</span>
          </button>

          {/* Speed Toggle */}
          <button
            onClick={() => setSimSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
            className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:border-cyan-400 text-[10px] cursor-pointer"
            title="Adjust simulation velocity"
          >
            {simSpeed}X SPEED
          </button>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
            <button
              onClick={() => handleZoom(1.3)}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(0.7)}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 cursor-pointer"
              title="Reset Zoom Extents"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN MAP & TELEMETRY SPLIT VIEWPORT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
        {/* D3 SVG VIEWPORT (Cols 1-8) */}
        <div ref={containerRef} className="lg:col-span-8 relative bg-slate-950 overflow-hidden select-none border-b lg:border-b-0 lg:border-r border-slate-800">
          <svg
            ref={svgRef}
            className="w-full h-full min-h-[500px]"
            viewBox="0 0 800 620"
            preserveAspectRatio="xMidYMid meet"
          />

          {/* District Quick Info Banner on Hover */}
          {hoveredDistrict && (
            <div className="absolute top-3 left-4 z-20 pointer-events-none p-2.5 rounded-lg bg-slate-950/90 border border-cyan-500/60 shadow-xl text-[11px] font-mono leading-tight max-w-xs">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <MapPin className="w-3 h-3 text-cyan-400" />
                <span>{hoveredDistrict.name}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Command: {hoveredDistrict.commandBase}
              </div>
              <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-slate-800 text-[10px]">
                <span className="text-red-400 font-bold">{hoveredDistrict.activeFires} Active Fires</span>
                <span className="text-slate-600">·</span>
                <span className="text-amber-400">{hoveredDistrict.threatLevel} Threat</span>
              </div>
            </div>
          )}

          {/* D3 Map Corner Legend */}
          <div className="absolute bottom-3 left-4 z-20 pointer-events-none text-[10px] text-slate-500 font-mono flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 bg-cyan-400 inline-block" />
              <span>Tanker (Fixed-Wing VLAT/LAT)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full border border-emerald-400 inline-block" />
              <span>Helitack / Helitanker</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-2 border border-dashed border-sky-400 inline-block" />
              <span>CAL FIRE District Polygon</span>
            </span>
          </div>
        </div>

        {/* RIGHT TELEMETRY INSPECTOR DOSSIER (Cols 9-12) */}
        <div className="lg:col-span-4 p-5 flex flex-col justify-between space-y-4 bg-slate-950">
          <div>
            {/* Header of Inspector */}
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                  TRANSPONDER TELEMETRY INGEST
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedAsset.name}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                  <span>{selectedAsset.model}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-cyan-300 font-bold">{selectedAsset.callsign}</span>
                </div>
              </div>

              <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 border ${
                selectedAsset.status === 'Retardant Drop'
                  ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
                  : 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
              }`}>
                {selectedAsset.status}
              </div>
            </div>

            {/* Ingestion Stream Metrics */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">ADS-B HEX CODE</span>
                <span className="text-cyan-300 font-bold font-mono">0x{selectedAsset.transponderHex}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">ALTITUDE / AIRSPEED</span>
                <span className="text-white font-bold tabular-nums">
                  {selectedAsset.altitudeFt.toLocaleString()}' MSL · {selectedAsset.speedKts} kts
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">RETARDANT LOAD</span>
                <span className="text-white font-bold tabular-nums">
                  {selectedAsset.retardantGal.toLocaleString()} / {selectedAsset.maxRetardantGal.toLocaleString()} Gal
                </span>
                <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-orange-400 h-full"
                    style={{ width: `${Math.round((selectedAsset.retardantGal / selectedAsset.maxRetardantGal) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">FUEL RESERVE</span>
                <span className="text-emerald-400 font-bold tabular-nums">{selectedAsset.fuelPct}% Capacity</span>
                <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-emerald-400 h-full" style={{ width: `${selectedAsset.fuelPct}%` }} />
                </div>
              </div>
            </div>

            {/* Mission Profile & Assigned Fire */}
            <div className="mt-3 p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-slate-400">
                <span>ASSIGNED SECTOR:</span>
                <span className="text-white font-bold">{selectedAsset.districtName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>ACTIVE WILDFIRE TARGET:</span>
                <span className="text-red-400 font-bold">{selectedAsset.assignedIncident}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>CURRENT VECTOR / COORDS:</span>
                <span className="text-cyan-300 tabular-nums">
                  {selectedAsset.lat.toFixed(3)}°N, {Math.abs(selectedAsset.lng).toFixed(3)}°W
                </span>
              </div>
            </div>

            {/* Quick Fleet Carousel in Current District */}
            <div className="mt-4">
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-2">
                ACTIVE SORTIES IN THEATER ({filteredAssets.length}):
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                {filteredAssets.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setSelectedAssetId(a.id);
                      onAssetSelect?.(a);
                    }}
                    className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      selectedAsset.id === a.id
                        ? 'bg-cyan-950/60 border-cyan-400 text-white'
                        : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${a.type === 'tanker' ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
                      <span className="font-bold text-xs">{a.callsign}</span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{a.model}</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 tabular-nums font-bold">
                      {a.altitudeFt}'
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Ingest Pipeline Link */}
          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
            <span>ETL STAGE 01: ADS-B STREAM INGEST</span>
            <span className="text-emerald-400 font-bold">ZERO DRIFT NOMINAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
