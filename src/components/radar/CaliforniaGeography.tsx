import React from 'react';

interface CaliforniaGeographyProps {
  themeColors: {
    bg: string;
    landFill: string;
    coastStroke: string;
    gridStroke: string;
    ring: string;
    textAccent: string;
  };
  showTopography?: boolean;
  showHydrography?: boolean;
  showCorridors?: boolean;
}

export const GEO_BOUNDS = {
  minLat: 32.1,
  maxLat: 42.1,
  minLng: -125.0,
  maxLng: -113.8,
};

export const projectGeo = (lat: number, lng: number) => {
  const { minLat, maxLat, minLng, maxLng } = GEO_BOUNDS;
  const normX = (lng - minLng) / (maxLng - minLng);
  const normY = (maxLat - lat) / (maxLat - minLat);
  return {
    x: Math.max(10, Math.min(790, normX * 800)),
    y: Math.max(10, Math.min(590, normY * 600)),
  };
};

export const CaliforniaGeography: React.FC<CaliforniaGeographyProps> = ({
  themeColors,
  showTopography = true,
  showHydrography = true,
  showCorridors = true,
}) => {
  // Key points along California's coastline from Oregon to Mexico
  const coastPoints = [
    { lat: 42.00, lng: -124.21 }, // Oregon Border
    { lat: 41.78, lng: -124.25 }, // Crescent City / Point St. George
    { lat: 41.54, lng: -124.08 }, // Klamath River mouth
    { lat: 41.05, lng: -124.15 }, // Trinidad Head
    { lat: 40.76, lng: -124.23 }, // Humboldt Bay / Arcata
    { lat: 40.44, lng: -124.41 }, // Cape Mendocino (West horn)
    { lat: 40.26, lng: -124.36 }, // Punta Gorda
    { lat: 40.02, lng: -124.07 }, // Shelter Cove / Lost Coast
    { lat: 39.43, lng: -123.81 }, // Fort Bragg / Noyo
    { lat: 39.30, lng: -123.80 }, // Mendocino Headlands
    { lat: 38.95, lng: -123.74 }, // Point Arena
    { lat: 38.71, lng: -123.53 }, // Gualala
    { lat: 38.51, lng: -123.25 }, // Salt Point
    { lat: 38.45, lng: -123.13 }, // Russian River / Jenner
    { lat: 38.31, lng: -123.06 }, // Bodega Head
    { lat: 38.23, lng: -122.98 }, // Tomales Bay
    { lat: 37.99, lng: -123.02 }, // Point Reyes Peninsula
    { lat: 37.91, lng: -122.68 }, // Drakes Bay / Bolinas
    { lat: 37.82, lng: -122.53 }, // Marin Headlands / Point Bonita
    // Golden Gate Strait
    { lat: 37.78, lng: -122.51 }, // Lands End / Ocean Beach SF
    { lat: 37.59, lng: -122.51 }, // Pacifica / Pedro Point
    { lat: 37.50, lng: -122.49 }, // Pillar Point / Half Moon Bay
    { lat: 37.18, lng: -122.39 }, // Pigeon Point Lighthouse
    { lat: 37.11, lng: -122.33 }, // Point Año Nuevo
    { lat: 36.96, lng: -122.01 }, // Santa Cruz Harbor
    { lat: 36.80, lng: -121.79 }, // Monterey Bay (Moss Landing canyon apex)
    { lat: 36.63, lng: -121.93 }, // Point Pinos / Monterey
    { lat: 36.58, lng: -121.98 }, // Cypress Point / Pebble Beach
    { lat: 36.52, lng: -121.95 }, // Point Lobos / Carmel
    { lat: 36.31, lng: -121.90 }, // Point Sur Headland
    { lat: 36.18, lng: -121.70 }, // Pfeiffer Point
    { lat: 35.89, lng: -121.46 }, // Cape San Martin
    { lat: 35.66, lng: -121.28 }, // Piedras Blancas / San Simeon
    { lat: 35.45, lng: -120.90 }, // Cambria / Cayucos
    { lat: 35.37, lng: -120.86 }, // Morro Rock / Morro Bay
    { lat: 35.25, lng: -120.90 }, // Point Buchon
    { lat: 35.17, lng: -120.65 }, // Port San Luis / Pismo Beach
    { lat: 34.90, lng: -120.66 }, // Point Sal
    { lat: 34.75, lng: -120.64 }, // Point Purisima
    { lat: 34.58, lng: -120.65 }, // Point Argüello
    { lat: 34.45, lng: -120.47 }, // Point Conception (Critical 90° bend!)
    { lat: 34.43, lng: -119.83 }, // Gaviota / Goleta
    { lat: 34.40, lng: -119.52 }, // Santa Barbara Harbor
    { lat: 34.20, lng: -119.22 }, // Ventura / Oxnard
    { lat: 34.09, lng: -119.06 }, // Point Mugu
    { lat: 34.00, lng: -118.80 }, // Point Dume / Malibu
    { lat: 33.98, lng: -118.45 }, // Santa Monica Bay / Marina del Rey
    { lat: 33.74, lng: -118.40 }, // Palos Verdes (Point Vicente)
    { lat: 33.70, lng: -118.28 }, // Point Fermin
    { lat: 33.74, lng: -118.19 }, // Long Beach / San Pedro Bay
    { lat: 33.65, lng: -117.98 }, // Huntington Beach (AxiomBI Ops)
    { lat: 33.60, lng: -117.88 }, // Newport Beach
    { lat: 33.46, lng: -117.71 }, // Dana Point Headlands
    { lat: 33.20, lng: -117.38 }, // San Clemente / Oceanside
    { lat: 33.04, lng: -117.29 }, // Carlsbad / Encinitas
    { lat: 32.85, lng: -117.27 }, // Torrey Pines / Point La Jolla
    { lat: 32.75, lng: -117.25 }, // Mission Beach / Ocean Beach
    { lat: 32.67, lng: -117.24 }, // Point Loma
    { lat: 32.62, lng: -117.13 }, // San Diego Bay & Silver Strand
    { lat: 32.53, lng: -117.12 }, // Border Field / Tijuana border
  ];

  // Eastern & Inland State Border segments
  const borderPoints = [
    { lat: 32.53, lng: -117.12 }, // Mexican Border at Pacific
    { lat: 32.75, lng: -114.72 }, // Colorado River junction (Yuma)
    { lat: 33.61, lng: -114.59 }, // Blythe
    { lat: 34.30, lng: -114.15 }, // Parker Dam
    { lat: 34.84, lng: -114.61 }, // Needles
    { lat: 35.00, lng: -114.64 }, // Colorado River border corner (Nevada boundary)
    { lat: 39.00, lng: -120.00 }, // Lake Tahoe border apex (diagonal)
    { lat: 42.00, lng: -120.00 }, // Oregon / Nevada northeast corner
    { lat: 42.00, lng: -124.21 }, // Oregon northwest corner at Pacific
  ];

  // Build the complete closed California polygon path
  const coastPathStr = coastPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${projectGeo(pt.lat, pt.lng).x.toFixed(1)} ${projectGeo(pt.lat, pt.lng).y.toFixed(1)}`)
    .join(' ');

  const borderPathStr = borderPoints
    .map((pt) => `L ${projectGeo(pt.lat, pt.lng).x.toFixed(1)} ${projectGeo(pt.lat, pt.lng).y.toFixed(1)}`)
    .join(' ');

  const fullCaliforniaD = `${coastPathStr} ${borderPathStr} Z`;

  return (
    <g id="california-geography">
      {/* 1. PACIFIC BATHYMETRY & OFFSHORE TRENCHES */}
      <g opacity="0.35" stroke={themeColors.gridStroke} fill="none" strokeWidth="0.8">
        {/* 200m Continental Shelf break */}
        <path
          d={`
            M ${projectGeo(42.0, -124.6).x} ${projectGeo(42.0, -124.6).y}
            C ${projectGeo(40.4, -124.8).x} ${projectGeo(40.4, -124.8).y}, ${projectGeo(38.0, -123.5).x} ${projectGeo(38.0, -123.5).y}, ${projectGeo(36.8, -122.2).x} ${projectGeo(36.8, -122.2).y}
            C ${projectGeo(35.0, -121.5).x} ${projectGeo(35.0, -121.5).y}, ${projectGeo(34.2, -120.8).x} ${projectGeo(34.2, -120.8).y}, ${projectGeo(33.0, -118.8).x} ${projectGeo(33.0, -118.8).y}
            L ${projectGeo(32.1, -117.8).x} ${projectGeo(32.1, -117.8).y}
          `}
          strokeDasharray="3 3"
        />
        <text x="35" y="18" fill="#64748b" fontSize="6" fontFamily="JetBrains Mono">
          PACIFIC CONTINENTAL SHELF (200m ISOBATH)
        </text>

        {/* Monterey Submarine Canyon (Cuts deep toward Moss Landing) */}
        <path
          d={`
            M ${projectGeo(36.6, -122.6).x} ${projectGeo(36.6, -122.6).y}
            Q ${projectGeo(36.75, -122.1).x} ${projectGeo(36.75, -122.1).y} ${projectGeo(36.80, -121.79).x} ${projectGeo(36.80, -121.79).y}
          `}
          stroke="#38bdf8"
          strokeWidth="1.2"
          opacity="0.6"
        />
        <text
          x={projectGeo(36.6, -122.6).x + 4}
          y={projectGeo(36.6, -122.6).y - 4}
          fill="#38bdf8"
          fontSize="6"
          fontFamily="JetBrains Mono"
          opacity="0.8"
        >
          MONTEREY SUBMARINE CANYON (3,250m DEEP)
        </text>

        {/* Mendocino Fracture Zone / Escarpment */}
        <line
          x1={projectGeo(40.44, -125.0).x}
          y1={projectGeo(40.44, -125.0).y}
          x2={projectGeo(40.44, -124.41).x}
          y2={projectGeo(40.44, -124.41).y}
          stroke="#f97316"
          strokeWidth="1"
          strokeDasharray="4 2"
          opacity="0.6"
        />
        <text
          x={projectGeo(40.44, -125.0).x + 8}
          y={projectGeo(40.44, -125.0).y - 4}
          fill="#fb923c"
          fontSize="6"
          fontFamily="JetBrains Mono"
          opacity="0.8"
        >
          MENDOCINO TRIPLE JUNCTION / GORDA ESCARPMENT
        </text>
      </g>

      {/* 2. MAIN CALIFORNIA LANDMASS */}
      <path
        d={fullCaliforniaD}
        fill={themeColors.landFill}
        stroke={themeColors.coastStroke}
        strokeWidth="1.6"
      />

      {/* 3. CENTRAL VALLEY FERTILE BASIN (Subtle Depressed Shading) */}
      <path
        d={`
          M ${projectGeo(40.6, -122.4).x} ${projectGeo(40.6, -122.4).y}
          L ${projectGeo(40.0, -122.2).x} ${projectGeo(40.0, -122.2).y}
          L ${projectGeo(38.5, -121.5).x} ${projectGeo(38.5, -121.5).y}
          L ${projectGeo(36.8, -120.2).x} ${projectGeo(36.8, -120.2).y}
          L ${projectGeo(35.2, -119.0).x} ${projectGeo(35.2, -119.0).y}
          L ${projectGeo(35.0, -119.3).x} ${projectGeo(35.0, -119.3).y}
          L ${projectGeo(36.5, -120.7).x} ${projectGeo(36.5, -120.7).y}
          L ${projectGeo(38.3, -121.9).x} ${projectGeo(38.3, -121.9).y}
          L ${projectGeo(39.8, -122.5).x} ${projectGeo(39.8, -122.5).y}
          Z
        `}
        fill="rgba(16, 185, 129, 0.04)"
        stroke={themeColors.coastStroke}
        strokeWidth="0.5"
        strokeDasharray="2 3"
        opacity="0.7"
      />
      <text
        x={projectGeo(37.5, -120.8).x}
        y={projectGeo(37.5, -120.8).y}
        fill="#64748b"
        fontSize="7"
        fontFamily="JetBrains Mono"
        opacity="0.6"
        textAnchor="middle"
      >
        GREAT CENTRAL VALLEY (SACRAMENTO & SAN JOAQUIN BASINS)
      </text>

      {/* 4. SAN FRANCISCO BAY ESTUARY, SUISUN BAY & DELTA */}
      <g fill={themeColors.bg} stroke={themeColors.coastStroke} strokeWidth="0.9">
        <path
          d={`
            M ${projectGeo(37.82, -122.53).x} ${projectGeo(37.82, -122.53).y}
            C ${projectGeo(37.87, -122.45).x} ${projectGeo(37.87, -122.45).y}, ${projectGeo(38.05, -122.45).x} ${projectGeo(38.05, -122.45).y}, ${projectGeo(38.10, -122.30).x} ${projectGeo(38.10, -122.30).y}
            C ${projectGeo(38.08, -122.10).x} ${projectGeo(38.08, -122.10).y}, ${projectGeo(38.12, -121.90).x} ${projectGeo(38.12, -121.90).y}, ${projectGeo(38.02, -121.75).x} ${projectGeo(38.02, -121.75).y}
            C ${projectGeo(37.95, -121.90).x} ${projectGeo(37.95, -121.90).y}, ${projectGeo(37.80, -122.25).x} ${projectGeo(37.80, -122.25).y}, ${projectGeo(37.55, -122.15).x} ${projectGeo(37.55, -122.15).y}
            C ${projectGeo(37.45, -122.05).x} ${projectGeo(37.45, -122.05).y}, ${projectGeo(37.50, -122.25).x} ${projectGeo(37.50, -122.25).y}, ${projectGeo(37.65, -122.38).x} ${projectGeo(37.65, -122.38).y}
            C ${projectGeo(37.75, -122.40).x} ${projectGeo(37.75, -122.40).y}, ${projectGeo(37.80, -122.45).x} ${projectGeo(37.80, -122.45).y}, ${projectGeo(37.78, -122.51).x} ${projectGeo(37.78, -122.51).y}
            Z
          `}
        />
        <text
          x={projectGeo(37.85, -122.35).x}
          y={projectGeo(37.85, -122.35).y}
          fill="#38bdf8"
          fontSize="6"
          fontFamily="JetBrains Mono"
          opacity="0.8"
        >
          SF BAY & DELTA
        </text>
      </g>

      {/* 5. MAJOR INLAND RIVERS & HYDROGRAPHY */}
      {showHydrography && (
        <g opacity="0.55" fill="none" stroke="#0284c7" strokeWidth="0.9">
          {/* Sacramento River (Mt Shasta down through Redding, Chico, Sacramento into Bay) */}
          <path
            d={`
              M ${projectGeo(41.4, -122.2).x} ${projectGeo(41.4, -122.2).y}
              L ${projectGeo(40.5, -122.3).x} ${projectGeo(40.5, -122.3).y}
              L ${projectGeo(39.8, -122.0).x} ${projectGeo(39.8, -122.0).y}
              L ${projectGeo(38.6, -121.5).x} ${projectGeo(38.6, -121.5).y}
              L ${projectGeo(38.05, -121.8).x} ${projectGeo(38.05, -121.8).y}
            `}
          />
          <text x={projectGeo(40.2, -122.2).x + 4} y={projectGeo(40.2, -122.2).y} fill="#38bdf8" fontSize="6" fontFamily="JetBrains Mono">
            SACRAMENTO RIVER
          </text>

          {/* San Joaquin River (Sierra into Stockton Delta) */}
          <path
            d={`
              M ${projectGeo(37.1, -119.3).x} ${projectGeo(37.1, -119.3).y}
              L ${projectGeo(36.8, -119.9).x} ${projectGeo(36.8, -119.9).y}
              L ${projectGeo(37.3, -120.8).x} ${projectGeo(37.3, -120.8).y}
              L ${projectGeo(37.9, -121.3).x} ${projectGeo(37.9, -121.3).y}
              L ${projectGeo(38.05, -121.75).x} ${projectGeo(38.05, -121.75).y}
            `}
          />

          {/* Feather River Canyon */}
          <path
            d={`
              M ${projectGeo(40.0, -121.0).x} ${projectGeo(40.0, -121.0).y}
              L ${projectGeo(39.5, -121.5).x} ${projectGeo(39.5, -121.5).y}
              L ${projectGeo(38.9, -121.6).x} ${projectGeo(38.9, -121.6).y}
            `}
            strokeDasharray="2 2"
          />

          {/* Russian River */}
          <path
            d={`
              M ${projectGeo(39.2, -123.1).x} ${projectGeo(39.2, -123.1).y}
              L ${projectGeo(38.6, -122.9).x} ${projectGeo(38.6, -122.9).y}
              L ${projectGeo(38.45, -123.13).x} ${projectGeo(38.45, -123.13).y}
            `}
          />

          {/* Colorado River Border */}
          <path
            d={`
              M ${projectGeo(35.0, -114.64).x} ${projectGeo(35.0, -114.64).y}
              L ${projectGeo(34.84, -114.61).x} ${projectGeo(34.84, -114.61).y}
              L ${projectGeo(34.30, -114.15).x} ${projectGeo(34.30, -114.15).y}
              L ${projectGeo(33.61, -114.59).x} ${projectGeo(33.61, -114.59).y}
              L ${projectGeo(32.75, -114.72).x} ${projectGeo(32.75, -114.72).y}
            `}
            strokeWidth="1.2"
            stroke="#0ea5e9"
          />
        </g>
      )}

      {/* 6. MAJOR LAKES & RESERVOIRS */}
      <g fill={themeColors.bg} stroke="#38bdf8" strokeWidth="0.8">
        {/* Lake Shasta (3-pronged dendritic reservoir) */}
        <path
          d={`
            M ${projectGeo(40.85, -122.40).x} ${projectGeo(40.85, -122.40).y}
            L ${projectGeo(40.75, -122.38).x} ${projectGeo(40.75, -122.38).y}
            L ${projectGeo(40.70, -122.42).x} ${projectGeo(40.70, -122.42).y}
            L ${projectGeo(40.72, -122.30).x} ${projectGeo(40.72, -122.30).y}
            L ${projectGeo(40.82, -122.25).x} ${projectGeo(40.82, -122.25).y}
            Z
          `}
        />
        <text x={projectGeo(40.75, -122.25).x + 4} y={projectGeo(40.75, -122.25).y} fill="#38bdf8" fontSize="6" fontFamily="JetBrains Mono">
          LAKE SHASTA (4.5M AF)
        </text>

        {/* Lake Oroville */}
        <circle cx={projectGeo(39.54, -121.48).x} cy={projectGeo(39.54, -121.48).y} r="3.5" />
        <text x={projectGeo(39.54, -121.48).x + 5} y={projectGeo(39.54, -121.48).y + 2} fill="#38bdf8" fontSize="6" fontFamily="JetBrains Mono">
          LAKE OROVILLE
        </text>

        {/* Clear Lake (Lake County) */}
        <ellipse cx={projectGeo(39.03, -122.78).x} cy={projectGeo(39.03, -122.78).y} rx="5" ry="3" transform={`rotate(-25, ${projectGeo(39.03, -122.78).x}, ${projectGeo(39.03, -122.78).y})`} />
        <text x={projectGeo(39.03, -122.78).x + 7} y={projectGeo(39.03, -122.78).y + 2} fill="#38bdf8" fontSize="6" fontFamily="JetBrains Mono">
          CLEAR LAKE
        </text>

        {/* Lake Tahoe */}
        <ellipse cx={projectGeo(39.09, -120.03).x} cy={projectGeo(39.09, -120.03).y} rx="5.5" ry="9" />
        <text x={projectGeo(39.09, -120.03).x + 8} y={projectGeo(39.09, -120.03).y + 3} fill="#38bdf8" fontSize="6.5" fontFamily="JetBrains Mono" fontWeight="bold">
          LAKE TAHOE
        </text>

        {/* Mono Lake */}
        <ellipse cx={projectGeo(38.01, -119.01).x} cy={projectGeo(38.01, -119.01).y} rx="4" ry="3" />
        <text x={projectGeo(38.01, -119.01).x + 6} y={projectGeo(38.01, -119.01).y + 2} fill="#38bdf8" fontSize="6" fontFamily="JetBrains Mono">
          MONO LAKE
        </text>

        {/* Salton Sea */}
        <ellipse
          cx={projectGeo(33.35, -115.85).x}
          cy={projectGeo(33.35, -115.85).y}
          rx="11"
          ry="5.5"
          transform={`rotate(-35, ${projectGeo(33.35, -115.85).x}, ${projectGeo(33.35, -115.85).y})`}
        />
        <text x={projectGeo(33.35, -115.85).x + 13} y={projectGeo(33.35, -115.85).y + 2} fill="#38bdf8" fontSize="6.5" fontFamily="JetBrains Mono">
          SALTON SEA (-236' MSL)
        </text>
      </g>

      {/* 7. ALL 8 CHANNEL ISLANDS & FARALLON ISLANDS */}
      <g fill={themeColors.landFill} stroke={themeColors.coastStroke} strokeWidth="1">
        {/* Northern Channel Islands */}
        {/* San Miguel Island */}
        <ellipse cx={projectGeo(34.04, -120.37).x} cy={projectGeo(34.04, -120.37).y} rx="5" ry="2.5" />
        {/* Santa Rosa Island */}
        <ellipse cx={projectGeo(33.97, -120.10).x} cy={projectGeo(33.97, -120.10).y} rx="6.5" ry="3.5" />
        {/* Santa Cruz Island */}
        <ellipse cx={projectGeo(34.02, -119.75).x} cy={projectGeo(34.02, -119.75).y} rx="9.5" ry="3.8" transform={`rotate(-12, ${projectGeo(34.02, -119.75).x}, ${projectGeo(34.02, -119.75).y})`} />
        {/* Anacapa Island */}
        <ellipse cx={projectGeo(34.01, -119.39).x} cy={projectGeo(34.01, -119.39).y} rx="3" ry="1.2" />

        {/* Southern Channel Islands */}
        {/* Santa Barbara Island */}
        <circle cx={projectGeo(33.48, -119.03).x} cy={projectGeo(33.48, -119.03).y} r="1.5" />
        {/* San Nicolas Island (US Navy Pacific Missile Range) */}
        <ellipse cx={projectGeo(33.24, -119.49).x} cy={projectGeo(33.24, -119.49).y} rx="6" ry="2.5" transform={`rotate(-20, ${projectGeo(33.24, -119.49).x}, ${projectGeo(33.24, -119.49).y})`} />
        {/* Santa Catalina Island */}
        <ellipse cx={projectGeo(33.38, -118.42).x} cy={projectGeo(33.38, -118.42).y} rx="7.5" ry="3" transform={`rotate(40, ${projectGeo(33.38, -118.42).x}, ${projectGeo(33.38, -118.42).y})`} />
        {/* San Clemente Island (US Navy live-fire shore range) */}
        <ellipse cx={projectGeo(32.90, -118.50).x} cy={projectGeo(32.90, -118.50).y} rx="6.5" ry="2.5" transform={`rotate(45, ${projectGeo(32.90, -118.50).x}, ${projectGeo(32.90, -118.50).y})`} />

        {/* Farallon Islands (off San Francisco) */}
        <circle cx={projectGeo(37.70, -123.00).x} cy={projectGeo(37.70, -123.00).y} r="1.8" />
        <text x={projectGeo(37.70, -123.00).x + 4} y={projectGeo(37.70, -123.00).y + 2} fill="#64748b" fontSize="5.5" fontFamily="JetBrains Mono">
          FARALLONS
        </text>
      </g>

      {/* 8. TOPOGRAPHIC RIDGELINES & HIGH PEAKS */}
      {showTopography && (
        <g opacity="0.45" stroke={themeColors.ring} strokeWidth="0.9" fill="none">
          {/* Sierra Nevada Ridge Spine */}
          <path
            d={`
              M ${projectGeo(41.4, -121.7).x} ${projectGeo(41.4, -121.7).y}
              L ${projectGeo(40.5, -121.5).x} ${projectGeo(40.5, -121.5).y}
              L ${projectGeo(39.3, -120.2).x} ${projectGeo(39.3, -120.2).y}
              L ${projectGeo(38.0, -119.5).x} ${projectGeo(38.0, -119.5).y}
              L ${projectGeo(36.8, -118.6).x} ${projectGeo(36.8, -118.6).y}
              L ${projectGeo(35.5, -118.4).x} ${projectGeo(35.5, -118.4).y}
            `}
            strokeDasharray="4 2"
          />
          <text
            x={projectGeo(37.8, -119.2).x + 4}
            y={projectGeo(37.8, -119.2).y}
            fill="#94a3b8"
            fontSize="6.5"
            fontFamily="JetBrains Mono"
          >
            SIERRA NEVADA CREST (MT WHITNEY 14,505' // YOSEMITE)
          </text>

          {/* Mount Shasta Peak */}
          <polygon
            points={`
              ${projectGeo(41.41, -122.19).x},${projectGeo(41.41, -122.19).y - 7} 
              ${projectGeo(41.41, -122.19).x - 5},${projectGeo(41.41, -122.19).y + 3} 
              ${projectGeo(41.41, -122.19).x + 5},${projectGeo(41.41, -122.19).y + 3}
            `}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.4"
          />
          <text
            x={projectGeo(41.41, -122.19).x + 8}
            y={projectGeo(41.41, -122.19).y + 2}
            fill="#38bdf8"
            fontSize="7"
            fontFamily="JetBrains Mono"
            fontWeight="bold"
          >
            MT SHASTA 14,179'
          </text>

          {/* Lassen Peak */}
          <circle cx={projectGeo(40.49, -121.51).x} cy={projectGeo(40.49, -121.51).y} r="2.5" fill="none" stroke="#f59e0b" strokeWidth="1.2" />
          <text x={projectGeo(40.49, -121.51).x + 5} y={projectGeo(40.49, -121.51).y + 2} fill="#f59e0b" fontSize="6.5" fontFamily="JetBrains Mono">
            LASSEN PEAK
          </text>

          {/* San Gabriel & San Bernardino Mountains (SoCal Barrier) */}
          <path
            d={`
              M ${projectGeo(34.3, -118.5).x} ${projectGeo(34.3, -118.5).y}
              L ${projectGeo(34.3, -117.8).x} ${projectGeo(34.3, -117.8).y}
              L ${projectGeo(34.1, -116.9).x} ${projectGeo(34.1, -116.9).y}
            `}
            stroke="#f97316"
            strokeWidth="1.1"
            strokeDasharray="3 3"
          />
          <text
            x={projectGeo(34.3, -117.8).x - 20}
            y={projectGeo(34.3, -117.8).y - 6}
            fill="#fb923c"
            fontSize="6.5"
            fontFamily="JetBrains Mono"
          >
            SAN GABRIEL / SAN BERNARDINO MTNS (MT BALDY 10,064')
          </text>

          {/* San Jacinto Peak */}
          <polygon
            points={`
              ${projectGeo(33.81, -116.68).x},${projectGeo(33.81, -116.68).y - 5}
              ${projectGeo(33.81, -116.68).x - 4},${projectGeo(33.81, -116.68).y + 2}
              ${projectGeo(33.81, -116.68).x + 4},${projectGeo(33.81, -116.68).y + 2}
            `}
            stroke="#f59e0b"
            strokeWidth="1"
          />
          <text x={projectGeo(33.81, -116.68).x + 6} y={projectGeo(33.81, -116.68).y + 2} fill="#fbbf24" fontSize="6" fontFamily="JetBrains Mono">
            SAN JACINTO 10,834'
          </text>
        </g>
      )}

      {/* 9. TACTICAL TRANSPORTATION & SUPPLY CORRIDORS */}
      {showCorridors && (
        <g opacity="0.25" stroke="#94a3b8" strokeWidth="0.8" fill="none" strokeDasharray="3 4">
          {/* Interstate 5 (Spine from Oregon to Mexico) */}
          <path
            d={`
              M ${projectGeo(42.0, -122.6).x} ${projectGeo(42.0, -122.6).y}
              L ${projectGeo(40.5, -122.3).x} ${projectGeo(40.5, -122.3).y}
              L ${projectGeo(38.6, -121.5).x} ${projectGeo(38.6, -121.5).y}
              L ${projectGeo(37.8, -121.3).x} ${projectGeo(37.8, -121.3).y}
              L ${projectGeo(35.3, -119.0).x} ${projectGeo(35.3, -119.0).y}
              L ${projectGeo(34.4, -118.5).x} ${projectGeo(34.4, -118.5).y}
              L ${projectGeo(34.0, -118.2).x} ${projectGeo(34.0, -118.2).y}
              L ${projectGeo(32.7, -117.1).x} ${projectGeo(32.7, -117.1).y}
            `}
          />
          {/* US-101 Coastal Corridor */}
          <path
            d={`
              M ${projectGeo(41.8, -124.2).x} ${projectGeo(41.8, -124.2).y}
              L ${projectGeo(40.8, -124.1).x} ${projectGeo(40.8, -124.1).y}
              L ${projectGeo(39.1, -123.2).x} ${projectGeo(39.1, -123.2).y}
              L ${projectGeo(38.4, -122.7).x} ${projectGeo(38.4, -122.7).y}
              L ${projectGeo(37.8, -122.4).x} ${projectGeo(37.8, -122.4).y}
              L ${projectGeo(36.7, -121.6).x} ${projectGeo(36.7, -121.6).y}
              L ${projectGeo(35.3, -120.7).x} ${projectGeo(35.3, -120.7).y}
              L ${projectGeo(34.4, -119.7).x} ${projectGeo(34.4, -119.7).y}
              L ${projectGeo(34.1, -118.7).x} ${projectGeo(34.1, -118.7).y}
            `}
          />
        </g>
      )}
    </g>
  );
};
