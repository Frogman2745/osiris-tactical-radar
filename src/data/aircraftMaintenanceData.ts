export interface EngineOverhaulRecord {
  engineIndex: number;
  model: string;
  tsohHours: number;
  cycles: number;
  hsiDueHours: number;
}

export interface MaintenanceLogRecord {
  id: string;
  date: string;
  workOrder: string;
  type: 'Phase Inspection' | 'Unscheduled Repair' | 'Avionics Calibration' | 'Drop System Service' | 'AD Compliance' | 'Engine Overhaul';
  title: string;
  description: string;
  technician: string;
  inspectorCert: string;
  station: string;
  status: 'Signed Off & Closed' | 'Complied With' | 'In Progress';
  partReplaced?: string;
}

export interface LifeLimitedPart {
  partName: string;
  partNumber: string;
  lifeLimitHoursOrCycles: string;
  currentAccumulated: string;
  percentRemaining: number;
  replacementDue: string;
}

export interface AirworthinessDirective {
  adNumber: string;
  effectiveDate: string;
  subject: string;
  status: 'Complied With' | 'Recurring Check Active' | 'N/A By Serial';
  nextDue: string;
}

export interface AircraftDossier {
  aircraftId: string;
  callsign: string;
  name: string;
  modelOrType: string;
  registration: string;
  operator: string;
  category: 'air_tanker' | 'helicopter' | 'recon_lead';
  transponder: {
    hex: string;
    squawk: string;
    mode: string;
    icao: string;
  };
  telemetry: {
    altitudeMslFt: number;
    altitudeAglFt: number;
    airspeedKts: number;
    groundSpeedKts: number;
    verticalRateFpm: number;
    headingDeg: number;
    pitchDeg: number;
    rollDeg: number;
    gForce: number;
    fuelRemainingLbs: number;
    fuelCapacityLbs: number;
    fuelBurnRatePph: number;
    enduranceRemaining: string;
    payloadType: string;
    payloadCapacityGal: number;
    payloadCurrentGal: number;
    dropCoverageLevel: string;
    dropSystemType: string;
    dropGateStatus: 'Armed & Ready' | 'Dispensing' | 'Closed / Sealed' | 'Standby';
    tankPressurePsi: number;
    engineTIT: number[];
    engineN1: number[];
    engineN2: number[];
    hydraulicPressureSysA: number;
    hydraulicPressureSysB: number;
    oilPressurePsi: number;
    oilTempC: number;
    coordinates: { lat: number; lng: number };
    targetIncident: string;
    distanceToTargetNm: number;
    etaToTargetMin: number;
    bearingToTargetDeg: number;
    homeAirbase: string;
  };
  flightHours: {
    airframeTTSN: number;
    totalCycles: number;
    seasonFlightHours2026: number;
    seasonQuotaMaxHours: number;
    hoursSincePhaseCheck: number;
    phaseCheckLimitHours: number;
    dropCyclesLogged: number;
    enginesTSOH: EngineOverhaulRecord[];
    crewHoursOnType: {
      picHours: number;
      sicHours: number;
      flightEngineerHours?: number;
    };
    missionSorties2026: {
      initialAttack: number;
      retardantReinforce: number;
      reconnaissance: number;
      transitFerry: number;
    };
  };
  maintenanceHistory: {
    overallAirworthiness: 'Full Mission Capable (FMC)' | 'Mission Capable with Limitations' | 'Scheduled Phase Due Soon';
    lastAnnualInspectionDate: string;
    nextPhaseDueInHours: number;
    records: MaintenanceLogRecord[];
    lifeLimitedParts: LifeLimitedPart[];
    airworthinessDirectives: AirworthinessDirective[];
  };
}

export const AIRCRAFT_MAINTENANCE_REGISTRY: Record<string, AircraftDossier> = {
  'tanker-910': {
    aircraftId: 'tanker-910',
    callsign: 'TANKER-910',
    name: 'Tanker 910 (DC-10 Air Tanker)',
    modelOrType: 'McDonnell Douglas DC-10-30 VLAT',
    registration: 'N222AU',
    operator: '10 Tanker Air Carrier / Cal Fire Joint Fleet',
    category: 'air_tanker',
    transponder: {
      hex: 'A1E9D0',
      squawk: '1255',
      mode: 'ADS-B Out (DO-260B Mode-S)',
      icao: 'A1E9D0 (FAA Registry 10-T)',
    },
    telemetry: {
      altitudeMslFt: 4600,
      altitudeAglFt: 1850,
      airspeedKts: 275,
      groundSpeedKts: 284,
      verticalRateFpm: -350,
      headingDeg: 118,
      pitchDeg: -1.8,
      rollDeg: 4.2,
      gForce: 1.15,
      fuelRemainingLbs: 38400,
      fuelCapacityLbs: 94000,
      fuelBurnRatePph: 7200,
      enduranceRemaining: '4h 18m',
      payloadType: 'Phos-Chek MVP-Fx Long-Term Retardant',
      payloadCapacityGal: 9400,
      payloadCurrentGal: 9400,
      dropCoverageLevel: 'Coverage Level 8 (CL-8 Dense Timber)',
      dropSystemType: 'Triple-Barrel Computerized Constant Flow External Pod',
      dropGateStatus: 'Armed & Ready',
      tankPressurePsi: 44.5,
      engineTIT: [642, 658, 649],
      engineN1: [88.4, 89.1, 88.6],
      engineN2: [92.1, 92.5, 92.2],
      hydraulicPressureSysA: 3020,
      hydraulicPressureSysB: 2980,
      oilPressurePsi: 58,
      oilTempC: 84,
      coordinates: { lat: 34.32, lng: -118.06 },
      targetIncident: 'Angeles Crest Fire Complex',
      distanceToTargetNm: 4.2,
      etaToTargetMin: 0.9,
      bearingToTargetDeg: 122,
      homeAirbase: 'Victorville VLAT Logistics Hub (VCV)',
    },
    flightHours: {
      airframeTTSN: 34812.4,
      totalCycles: 14920,
      seasonFlightHours2026: 318.6,
      seasonQuotaMaxHours: 450.0,
      hoursSincePhaseCheck: 28.4,
      phaseCheckLimitHours: 50.0,
      dropCyclesLogged: 4112,
      enginesTSOH: [
        { engineIndex: 1, model: 'CF6-50C2 Left Wing', tsohHours: 1840.2, cycles: 910, hsiDueHours: 459.8 },
        { engineIndex: 2, model: 'CF6-50C2 Tail Mount', tsohHours: 1220.0, cycles: 620, hsiDueHours: 780.0 },
        { engineIndex: 3, model: 'CF6-50C2 Right Wing', tsohHours: 2110.5, cycles: 1040, hsiDueHours: 189.5 },
      ],
      crewHoursOnType: {
        picHours: 4280.0,
        sicHours: 2140.0,
        flightEngineerHours: 3600.0,
      },
      missionSorties2026: {
        initialAttack: 48,
        retardantReinforce: 94,
        reconnaissance: 0,
        transitFerry: 16,
      },
    },
    maintenanceHistory: {
      overallAirworthiness: 'Full Mission Capable (FMC)',
      lastAnnualInspectionDate: '2026-06-11',
      nextPhaseDueInHours: 21.6,
      records: [
        {
          id: 'WO-DC10-9014',
          date: '2026-09-24',
          workOrder: 'WO-9014-VLAT',
          type: 'Phase Inspection',
          title: '50-Hour Airframe & Retardant Gate Actuator Inspection',
          description: 'Inspected triple pneumatic drop gate actuators, hydraulic bypass seals, and tank release interlock linkages. Measured zero back-leakage under 50 PSI proof pressure.',
          technician: 'Marcus Vance, Lead A&P',
          inspectorCert: 'A&P / IA #3841920',
          station: 'Victorville AAB Station 10',
          status: 'Signed Off & Closed',
        },
        {
          id: 'WO-DC10-8841',
          date: '2026-09-18',
          workOrder: 'WO-8841-CAL',
          type: 'Avionics Calibration',
          title: 'Computerized Constant Flow Sensor & Load Cell Recalibration',
          description: 'Recalibrated forward, middle, and aft tank capacitive fuel/retardant load probes against calibrated ground delivery meter (+/- 0.25% variance). Firmware updated to v4.81.',
          technician: 'E. Gutierrez, Avionics Tech',
          inspectorCert: 'FAA Repair Station #10TC-440',
          station: 'Victorville VLAT Logistics Hub',
          status: 'Signed Off & Closed',
        },
        {
          id: 'WO-DC10-8702',
          date: '2026-09-02',
          workOrder: 'WO-8702-ENG',
          type: 'Engine Overhaul',
          title: 'CF6-50C2 Center Tail Engine Borescope & Oil Spectrometry',
          description: '360° video borescope performed on HP turbine stages 1 and 2. Zero thermal cracking or leading edge erosion detected. Oil soap sample cleared for metal trace content.',
          technician: 'D. Henderson, Turbine Spec.',
          inspectorCert: 'A&P #4190331',
          station: 'San Bernardino Maintenance Depot',
          status: 'Signed Off & Closed',
        },
        {
          id: 'WO-DC10-8450',
          date: '2026-08-15',
          workOrder: 'WO-8450-HYD',
          type: 'Unscheduled Repair',
          title: 'Main Gear Assembly Brake Wear Compensator & Hydraulic O-Ring Repl.',
          description: 'Replaced left main gear carbon brake stack and high-temperature Viton hydraulic return seal following rapid succession landing runs at McClellan.',
          technician: 'R. Kincaid, A&P',
          inspectorCert: 'A&P #2940118',
          station: 'McClellan Tanker Base (MCC)',
          status: 'Signed Off & Closed',
          partReplaced: 'Brembo Aero Carbon Brake Disk Assembly P/N 300-4491-B',
        },
        {
          id: 'WO-DC10-7980',
          date: '2026-07-29',
          workOrder: 'WO-7980-NDT',
          type: 'AD Compliance',
          title: 'FAA AD 2026-14-08 Wing Spar Eddy-Current High-Frequency NDT',
          description: 'Non-destructive ultrasonic and eddy-current inspection along lower wing spar cap fastener holes between Ribs 12 and 22. Zero structural micro-fractures detected.',
          technician: 'J. Arispe, ASNT Level III',
          inspectorCert: 'NDT Cert #L3-84910',
          station: 'Victorville Heavy Structural Hangar',
          status: 'Complied With',
        },
      ],
      lifeLimitedParts: [
        {
          partName: 'Retardant Venturi Discharge Gate Seal',
          partNumber: '10T-GAT-9400-S',
          lifeLimitHoursOrCycles: '500 Drops',
          currentAccumulated: '382 Drops',
          percentRemaining: 23.6,
          replacementDue: 'In 118 Drops',
        },
        {
          partName: 'CF6-50C2 Stage 1 HP Turbine Disk',
          partNumber: '9211M45P02',
          lifeLimitHoursOrCycles: '15,000 Cycles',
          currentAccumulated: '11,420 Cycles',
          percentRemaining: 23.9,
          replacementDue: 'In 3,580 Cycles',
        },
        {
          partName: 'Pneumatic Dump Valve Solenoid Dual Manifold',
          partNumber: 'SOL-500-10T',
          lifeLimitHoursOrCycles: '2,000 Flight Hours',
          currentAccumulated: '1,420 Flight Hours',
          percentRemaining: 29.0,
          replacementDue: 'In 580 Hours',
        },
        {
          partName: 'Center Fuselage Retardant Pod Structural Saddle',
          partNumber: 'STR-910-SADL-01',
          lifeLimitHoursOrCycles: '25,000 Drops',
          currentAccumulated: '14,920 Drops',
          percentRemaining: 40.3,
          replacementDue: 'In 10,080 Drops',
        },
      ],
      airworthinessDirectives: [
        {
          adNumber: 'AD 2026-14-08',
          effectiveDate: '2026-07-15',
          subject: 'DC-10 Wing Lower Spar Cap High-Stress Firefighting Eddy Current Testing',
          status: 'Complied With',
          nextDue: '2027-07-15 (Annual)',
        },
        {
          adNumber: 'AD 2025-22-03',
          effectiveDate: '2025-11-10',
          subject: 'Emergency Retardant Jettison Switch Guard Secondary Redundant Circuit',
          status: 'Complied With',
          nextDue: 'Terminating Action Complete',
        },
      ],
    },
  },

  'tanker-116': {
    aircraftId: 'tanker-116',
    callsign: 'TANKER-116',
    name: 'Tanker 116 (CAL FIRE HC-130H Hercules)',
    modelOrType: 'Lockheed HC-130H Hercules (Coulson RADS-XXL)',
    registration: 'N116CG (Ex-USCG 1721)',
    operator: 'CAL FIRE Aviation Management (State Owned & Operated)',
    category: 'air_tanker',
    transponder: {
      hex: 'A03F19',
      squawk: '1255',
      mode: 'ADS-B Out + Mode-S ES',
      icao: 'A03F19 (State Aircraft)',
    },
    telemetry: {
      altitudeMslFt: 5800,
      altitudeAglFt: 1800,
      airspeedKts: 250,
      groundSpeedKts: 255,
      verticalRateFpm: -350,
      headingDeg: 320,
      pitchDeg: -1.0,
      rollDeg: 2.2,
      gForce: 1.05,
      fuelRemainingLbs: 26800,
      fuelCapacityLbs: 45000,
      fuelBurnRatePph: 4200,
      enduranceRemaining: '6h 15m',
      payloadType: 'Phos-Chek MVP-Fx Retardant',
      payloadCapacityGal: 4000,
      payloadCurrentGal: 4000,
      dropCoverageLevel: 'Coverage Level 8 (CL-8 Continuous)',
      dropSystemType: 'Coulson RADS-XXL 4,000-Gal Constant Flow System',
      dropGateStatus: 'Dispensing',
      tankPressurePsi: 45.0,
      engineTIT: [712, 718, 715, 710],
      engineN1: [100.0, 100.2, 100.0, 100.1],
      engineN2: [99.8, 99.9, 99.8, 99.8],
      hydraulicPressureSysA: 3000,
      hydraulicPressureSysB: 3000,
      oilPressurePsi: 55,
      oilTempC: 74,
      coordinates: { lat: 40.25, lng: -121.90 },
      targetIncident: 'Shasta Complex Wildfire',
      distanceToTargetNm: 28.2,
      etaToTargetMin: 6.8,
      bearingToTargetDeg: 322,
      homeAirbase: 'Chico Air Attack Base (CIC)',
    },
    flightHours: {
      airframeTTSN: 14820.5,
      totalCycles: 8940,
      seasonFlightHours2026: 184.2,
      seasonQuotaMaxHours: 400.0,
      hoursSincePhaseCheck: 18.0,
      phaseCheckLimitHours: 50.0,
      dropCyclesLogged: 1240,
      enginesTSOH: [
        { engineIndex: 1, model: 'Rolls-Royce T56-A-15 Eng 1', tsohHours: 820.0, cycles: 540, hsiDueHours: 1180.0 },
        { engineIndex: 2, model: 'Rolls-Royce T56-A-15 Eng 2', tsohHours: 710.5, cycles: 490, hsiDueHours: 1289.5 },
        { engineIndex: 3, model: 'Rolls-Royce T56-A-15 Eng 3', tsohHours: 1120.0, cycles: 760, hsiDueHours: 880.0 },
        { engineIndex: 4, model: 'Rolls-Royce T56-A-15 Eng 4', tsohHours: 640.2, cycles: 410, hsiDueHours: 1359.8 },
      ],
      crewHoursOnType: {
        picHours: 4210.0,
        sicHours: 2150.0,
        flightEngineerHours: 3480.0,
      },
      missionSorties2026: {
        initialAttack: 48,
        retardantReinforce: 92,
        reconnaissance: 0,
        transitFerry: 16,
      },
    },
    maintenanceHistory: {
      overallAirworthiness: 'Full Mission Capable (FMC)',
      lastAnnualInspectionDate: '2026-06-12',
      nextPhaseDueInHours: 32.0,
      records: [
        {
          id: 'WO-C130-116-01',
          date: '2026-09-24',
          workOrder: 'WO-116-RADS',
          type: 'Drop System Service',
          title: 'Coulson RADS-XXL 4,000-Gal Constant Flow Controller & Computer Door Calibration',
          description: 'Verified digital linear actuator positioning across coverage levels 1 through 8. Calibrated flow rate sensor within 1.2% variance.',
          technician: 'M. Gallagher, Lead Avionics Tech',
          inspectorCert: 'FAA A&P #3819024 / IA',
          station: 'Chico Air Attack Base (CIC)',
          status: 'Signed Off & Closed',
        },
        {
          id: 'WO-C130-116-02',
          date: '2026-09-15',
          workOrder: 'WO-116-TIRES',
          type: 'Unscheduled Repair',
          title: 'Tandem Main Gear Tire Pressure & Anti-Skid Sensor Check',
          description: 'Replaced outboard right main landing gear tire after heavy load-out cycle. Tested pneumatic anti-skid modulation valves.',
          technician: 'R. Kincaid, A&P',
          inspectorCert: 'A&P #2940118',
          station: 'McClellan Air Logistics Depot',
          status: 'Signed Off & Closed',
          partReplaced: 'Goodyear Aviation 56x20.0-20 Tire Assembly',
        },
      ],
      lifeLimitedParts: [
        {
          partName: 'RADS-XXL Main Retardant Discharge Venturi Doors',
          partNumber: 'RADS-4000-XXL-01',
          lifeLimitHoursOrCycles: '3,000 Drops',
          currentAccumulated: '1,240 Drops',
          percentRemaining: 58.7,
          replacementDue: 'In 1,760 Drops',
        },
        {
          partName: 'Outer Wing Center Section Lower Spar Joint Fasteners',
          partNumber: 'MS90354-08',
          lifeLimitHoursOrCycles: '20,000 Hours',
          currentAccumulated: '14,820 Hours',
          percentRemaining: 25.9,
          replacementDue: 'In 5,180 Hours',
        },
      ],
      airworthinessDirectives: [
        {
          adNumber: 'AD 2026-11-04',
          effectiveDate: '2026-05-20',
          subject: 'Lockheed C-130 Outer Wing Box Structural Ultrasonic NDT Inspection',
          status: 'Complied With',
          nextDue: '2027-05-20 (Annual)',
        },
      ],
    },
  },

  'tanker-118': {
    aircraftId: 'tanker-118',
    callsign: 'TANKER-118',
    name: 'Tanker 118 (C-130H Hercules)',
    modelOrType: 'Lockheed C-130H Hercules (MAFFS II)',
    registration: 'AF 74-1688',
    operator: 'USAF / 146th Airlift Wing (Channel Islands) & Cal Fire Joint MAFFS',
    category: 'air_tanker',
    transponder: {
      hex: 'AE02A3',
      squawk: '1255',
      mode: 'ADS-B Out + Link-16 Tactical TacNet',
      icao: 'AE02A3 (Mil Registry)',
    },
    telemetry: {
      altitudeMslFt: 6200,
      altitudeAglFt: 2100,
      airspeedKts: 245,
      groundSpeedKts: 258,
      verticalRateFpm: 120,
      headingDeg: 38,
      pitchDeg: 1.2,
      rollDeg: -1.5,
      gForce: 1.02,
      fuelRemainingLbs: 24600,
      fuelCapacityLbs: 45000,
      fuelBurnRatePph: 4100,
      enduranceRemaining: '5h 42m',
      payloadType: 'Phos-Chek MVP-Fx Retardant',
      payloadCapacityGal: 4000,
      payloadCurrentGal: 4000,
      dropCoverageLevel: 'Coverage Level 6 (CL-6 Heavy Brush)',
      dropSystemType: 'USFS / DoD MAFFS II Pressurized Air Delivery Pod',
      dropGateStatus: 'Armed & Ready',
      tankPressurePsi: 1195,
      engineTIT: [710, 715, 712, 708],
      engineN1: [99.8, 100.1, 99.9, 100.0],
      engineN2: [99.7, 99.9, 99.8, 99.8],
      hydraulicPressureSysA: 3000,
      hydraulicPressureSysB: 3000,
      oilPressurePsi: 54,
      oilTempC: 76,
      coordinates: { lat: 38.65, lng: -121.40 },
      targetIncident: 'Dixie Ridge Secondary Fire',
      distanceToTargetNm: 71.4,
      etaToTargetMin: 16.6,
      bearingToTargetDeg: 36,
      homeAirbase: 'McClellan Tanker Base (MCC)',
    },
    flightHours: {
      airframeTTSN: 18940.2,
      totalCycles: 11430,
      seasonFlightHours2026: 264.8,
      seasonQuotaMaxHours: 400.0,
      hoursSincePhaseCheck: 34.0,
      phaseCheckLimitHours: 50.0,
      dropCyclesLogged: 1820,
      enginesTSOH: [
        { engineIndex: 1, model: 'Allison T56-A-15 Eng 1', tsohHours: 1420.0, cycles: 940, hsiDueHours: 580.0 },
        { engineIndex: 2, model: 'Allison T56-A-15 Eng 2', tsohHours: 980.5, cycles: 710, hsiDueHours: 1019.5 },
        { engineIndex: 3, model: 'Allison T56-A-15 Eng 3', tsohHours: 1650.0, cycles: 1120, hsiDueHours: 350.0 },
        { engineIndex: 4, model: 'Allison T56-A-15 Eng 4', tsohHours: 1110.2, cycles: 820, hsiDueHours: 889.8 },
      ],
      crewHoursOnType: {
        picHours: 3890.0,
        sicHours: 1740.0,
        flightEngineerHours: 3120.0,
      },
      missionSorties2026: {
        initialAttack: 32,
        retardantReinforce: 78,
        reconnaissance: 0,
        transitFerry: 22,
      },
    },
    maintenanceHistory: {
      overallAirworthiness: 'Full Mission Capable (FMC)',
      lastAnnualInspectionDate: '2026-05-18',
      nextPhaseDueInHours: 16.0,
      records: [
        {
          id: 'WO-C130-9932',
          date: '2026-09-26',
          workOrder: 'WO-9932-MAFFS',
          type: 'Drop System Service',
          title: 'MAFFS II 1,200 PSI Pressure Relief & Dual Nozzle Discharge Overhaul',
          description: 'Replaced elastomeric seals on both rear discharge nozzles; pressurized accumulator tanks to 1,200 PSI and verified zero drop over 4-hour hold period.',
          technician: 'TSgt. Kevin Bradley, USAF Crew Chief',
          inspectorCert: 'USAF Form 781A / Cal Fire IA #3104921',
          station: 'Channel Islands ANGS Tanker Base',
          status: 'Signed Off & Closed',
        },
        {
          id: 'WO-C130-9811',
          date: '2026-09-19',
          workOrder: 'WO-9811-PROP',
          type: 'Avionics Calibration',
          title: 'Hamilton Standard 54H60 Propeller Synchrophaser Rigging',
          description: 'Dynamic electronic vibration balancing completed on all 4 four-blade propellers. Synchronized phase angles within 2 degrees across all quadrants.',
          technician: 'MSgt. David Torres',
          inspectorCert: 'DoD Quality Assurance Inspector #9021',
          station: 'McClellan Tanker Base',
          status: 'Signed Off & Closed',
        },
        {
          id: 'WO-C130-9640',
          date: '2026-09-05',
          workOrder: 'WO-9640-ENG',
          type: 'Unscheduled Repair',
          title: 'Engine #3 Bleed Air Duct V-Band Clamp Replacement',
          description: 'Detected minor hot bleed air trace during post-drop ground run. Replaced inconel V-band clamp and high-temp silicone donut gasket.',
          technician: 'A. Stovall, A&P',
          inspectorCert: 'A&P #3648102',
          station: 'McClellan Air Depot',
          status: 'Signed Off & Closed',
          partReplaced: 'Inconel 718 V-Band Duct Clamp P/N 33021-04',
        },
      ],
      lifeLimitedParts: [
        {
          partName: 'MAFFS II High-Pressure Air Accumulator Bottles (x2)',
          partNumber: 'DOT-3AA-1200',
          lifeLimitHoursOrCycles: '10,000 Pressurizations',
          currentAccumulated: '6,140 Cycles',
          percentRemaining: 38.6,
          replacementDue: 'In 3,860 Cycles',
        },
        {
          partName: 'Propeller Blade Shank Bearings (Set of 16)',
          partNumber: '54H60-BRG-04',
          lifeLimitHoursOrCycles: '4,000 Flight Hours',
          currentAccumulated: '2,940 Flight Hours',
          percentRemaining: 26.5,
          replacementDue: 'In 1,060 Hours',
        },
      ],
      airworthinessDirectives: [
        {
          adNumber: 'T.O. 1C-130H-2-12',
          effectiveDate: '2026-04-01',
          subject: 'USAF / USFS Center Wing Box Fatigue Life Extension Inspection',
          status: 'Complied With',
          nextDue: '2027-04-01',
        },
      ],
    },
  },

  'tanker-102': {
    aircraftId: 'tanker-102',
    callsign: 'TANKER-102',
    name: 'Tanker 102 (MD-87 LAT)',
    modelOrType: 'McDonnell Douglas MD-87',
    registration: 'N292EA',
    operator: 'Erickson Aero Tanker / Cal Fire LAT Fleet',
    category: 'air_tanker',
    transponder: {
      hex: 'A3045E',
      squawk: '1255',
      mode: 'ADS-B Out (DO-260B Mode-S)',
      icao: 'A3045E (FAA Registry)',
    },
    telemetry: {
      altitudeMslFt: 5100,
      altitudeAglFt: 1950,
      airspeedKts: 260,
      groundSpeedKts: 268,
      verticalRateFpm: -420,
      headingDeg: 235,
      pitchDeg: -1.4,
      rollDeg: -3.8,
      gForce: 1.10,
      fuelRemainingLbs: 18400,
      fuelCapacityLbs: 35000,
      fuelBurnRatePph: 5400,
      enduranceRemaining: '3h 24m',
      payloadType: 'Phos-Chek MVP-Fx Retardant',
      payloadCapacityGal: 3000,
      payloadCurrentGal: 3000,
      dropCoverageLevel: 'Coverage Level 6 (CL-6)',
      dropSystemType: 'RADS-II Constant Flow External Tank',
      dropGateStatus: 'Armed & Ready',
      tankPressurePsi: 38.0,
      engineTIT: [610, 614],
      engineN1: [89.2, 89.5],
      engineN2: [91.8, 92.0],
      hydraulicPressureSysA: 2990,
      hydraulicPressureSysB: 3010,
      oilPressurePsi: 52,
      oilTempC: 78,
      coordinates: { lat: 39.80, lng: -121.50 },
      targetIncident: 'Dixie Ridge Secondary Fire',
      distanceToTargetNm: 2.1,
      etaToTargetMin: 0.5,
      bearingToTargetDeg: 238,
      homeAirbase: 'Chico Air Attack Base (CIC)',
    },
    flightHours: {
      airframeTTSN: 29480.0,
      totalCycles: 21800,
      seasonFlightHours2026: 289.4,
      seasonQuotaMaxHours: 420.0,
      hoursSincePhaseCheck: 19.5,
      phaseCheckLimitHours: 50.0,
      dropCyclesLogged: 2450,
      enginesTSOH: [
        { engineIndex: 1, model: 'Pratt & Whitney JT8D-219 Eng 1', tsohHours: 1930.0, cycles: 1420, hsiDueHours: 570.0 },
        { engineIndex: 2, model: 'Pratt & Whitney JT8D-219 Eng 2', tsohHours: 1480.2, cycles: 1110, hsiDueHours: 1019.8 },
      ],
      crewHoursOnType: {
        picHours: 5120.0,
        sicHours: 2310.0,
      },
      missionSorties2026: {
        initialAttack: 41,
        retardantReinforce: 82,
        reconnaissance: 0,
        transitFerry: 14,
      },
    },
    maintenanceHistory: {
      overallAirworthiness: 'Full Mission Capable (FMC)',
      lastAnnualInspectionDate: '2026-04-20',
      nextPhaseDueInHours: 30.5,
      records: [
        {
          id: 'WO-MD87-1940',
          date: '2026-09-27',
          workOrder: 'WO-1940-RADS',
          type: 'Drop System Service',
          title: 'RADS-II Constant Flow Gate Limit Switch & Hydraulic Actuator Test',
          description: 'Replaced microswitch sensor on secondary drop gate door; verified millisecond response time during automated sequence drop calibration.',
          technician: 'L. Albright, A&P',
          inspectorCert: 'A&P #4029112',
          station: 'Chico Air Attack Base (CIC)',
          status: 'Signed Off & Closed',
          partReplaced: 'Honeywell Aerospace Microswitch Limit P/N 1HM1-1',
        },
        {
          id: 'WO-MD87-1822',
          date: '2026-09-21',
          workOrder: 'WO-1822-ENG',
          type: 'Phase Inspection',
          title: 'JT8D-219 Engine Oil Scavenge Filter Differential Pressure Test',
          description: 'Filter clean; zero metallic particulate or soot bridging. Engine accessory gearbox drive splines checked within 0.003-inch backlash allowance.',
          technician: 'R. Fontaine, A&P',
          inspectorCert: 'A&P #3718990',
          station: 'Redding Air Attack Base',
          status: 'Signed Off & Closed',
        },
      ],
      lifeLimitedParts: [
        {
          partName: 'RADS-II Primary Dispersal Door Cylinder',
          partNumber: 'RADS-CYL-3000',
          lifeLimitHoursOrCycles: '3,000 Drops',
          currentAccumulated: '2,450 Drops',
          percentRemaining: 18.3,
          replacementDue: 'In 550 Drops',
        },
        {
          partName: 'JT8D-219 1st Stage Fan Hub',
          partNumber: '5001221-01',
          lifeLimitHoursOrCycles: '20,000 Cycles',
          currentAccumulated: '14,800 Cycles',
          percentRemaining: 26.0,
          replacementDue: 'In 5,200 Cycles',
        },
      ],
      airworthinessDirectives: [
        {
          adNumber: 'AD 2026-08-11',
          effectiveDate: '2026-05-12',
          subject: 'MD-80 Series Horizontal Stabilizer Trim Jackscrew Lubrication & Free-Play Inspection',
          status: 'Complied With',
          nextDue: '2026-11-12',
        },
      ],
    },
  },

  'tanker-80': {
    aircraftId: 'tanker-80',
    callsign: 'TANKER-80',
    name: 'Tanker 80 (S-2T Turbo Tracker)',
    modelOrType: 'Grumman S-2T Turbo Tracker',
    registration: 'N415DF',
    operator: 'Cal Fire Aviation / Dyncorp Maintenance Division',
    category: 'air_tanker',
    transponder: {
      hex: 'A4E120',
      squawk: '1255',
      mode: 'ADS-B Out (DO-260B Mode-S)',
      icao: 'A4E120 (Cal Fire Fleet)',
    },
    telemetry: {
      altitudeMslFt: 3900,
      altitudeAglFt: 1400,
      airspeedKts: 215,
      groundSpeedKts: 224,
      verticalRateFpm: -480,
      headingDeg: 310,
      pitchDeg: -2.1,
      rollDeg: 5.4,
      gForce: 1.25,
      fuelRemainingLbs: 3200,
      fuelCapacityLbs: 5800,
      fuelBurnRatePph: 1250,
      enduranceRemaining: '2h 33m',
      payloadType: 'Phos-Chek MVP-Fx Retardant',
      payloadCapacityGal: 1200,
      payloadCurrentGal: 1200,
      dropCoverageLevel: 'Coverage Level 4 (CL-4)',
      dropSystemType: 'Cal Fire Computer-Controlled Constant Flow Tank',
      dropGateStatus: 'Armed & Ready',
      tankPressurePsi: 28.5,
      engineTIT: [670, 672],
      engineN1: [94.5, 94.6],
      engineN2: [98.2, 98.4],
      hydraulicPressureSysA: 2980,
      hydraulicPressureSysB: 3000,
      oilPressurePsi: 64,
      oilTempC: 72,
      coordinates: { lat: 40.75, lng: -122.35 },
      targetIncident: 'Shasta Complex Wildfire',
      distanceToTargetNm: 7.8,
      etaToTargetMin: 2.1,
      bearingToTargetDeg: 315,
      homeAirbase: 'Redding Air Attack Base (RDD)',
    },
    flightHours: {
      airframeTTSN: 14210.5,
      totalCycles: 9840,
      seasonFlightHours2026: 342.1,
      seasonQuotaMaxHours: 450.0,
      hoursSincePhaseCheck: 12.0,
      phaseCheckLimitHours: 50.0,
      dropCyclesLogged: 3920,
      enginesTSOH: [
        { engineIndex: 1, model: 'Garrett TPE331-14GR Left', tsohHours: 820.0, cycles: 980, hsiDueHours: 1680.0 },
        { engineIndex: 2, model: 'Garrett TPE331-14GR Right', tsohHours: 950.4, cycles: 1120, hsiDueHours: 1549.6 },
      ],
      crewHoursOnType: {
        picHours: 3420.0,
        sicHours: 0,
      },
      missionSorties2026: {
        initialAttack: 64,
        retardantReinforce: 98,
        reconnaissance: 0,
        transitFerry: 18,
      },
    },
    maintenanceHistory: {
      overallAirworthiness: 'Full Mission Capable (FMC)',
      lastAnnualInspectionDate: '2026-05-02',
      nextPhaseDueInHours: 38.0,
      records: [
        {
          id: 'WO-S2T-4481',
          date: '2026-09-28',
          workOrder: 'WO-4481-S2T',
          type: 'Drop System Service',
          title: 'Constant Flow Gate Actuator Servo Motor Quick-Turnaround Inspection',
          description: 'Inspected 4-compartment retardant door electric torque motor brushes and emergency manual jettison cable tension (32 lbs pull confirmed).',
          technician: 'W. Miller, Lead S-2T Specialist',
          inspectorCert: 'A&P #2810931',
          station: 'Redding Air Attack Base',
          status: 'Signed Off & Closed',
        },
        {
          id: 'WO-S2T-4390',
          date: '2026-09-22',
          workOrder: 'WO-4390-ENG',
          type: 'Phase Inspection',
          title: '50-Hour TPE331 Turboprop Gearbox Magnetic Chip Detector Inspection',
          description: 'Both left and right propeller reduction gearboxes inspected. Chip detectors clean of ferrous debris. Engine wash completed.',
          technician: 'J. Chen, A&P',
          inspectorCert: 'A&P #3928104',
          station: 'Redding AAB',
          status: 'Signed Off & Closed',
        },
      ],
      lifeLimitedParts: [
        {
          partName: 'S-2T Retardant Door Inflatable Pneumatic Seal',
          partNumber: 'DF-SEAL-1200',
          lifeLimitHoursOrCycles: '1,000 Drops',
          currentAccumulated: '780 Drops',
          percentRemaining: 22.0,
          replacementDue: 'In 220 Drops',
        },
        {
          partName: 'Hartzell 5-Blade Composite Propeller Hub',
          partNumber: 'HC-E5N-3AL',
          lifeLimitHoursOrCycles: '8,000 Flight Hours',
          currentAccumulated: '5,820 Flight Hours',
          percentRemaining: 27.2,
          replacementDue: 'In 2,180 Hours',
        },
      ],
      airworthinessDirectives: [
        {
          adNumber: 'AD 2026-04-02',
          effectiveDate: '2026-04-10',
          subject: 'S-2T Wing Fold Hinge Fitting Ultrasonic Inspection',
          status: 'Complied With',
          nextDue: '2027-04-10',
        },
      ],
    },
  },

  'tanker-96': {
    aircraftId: 'tanker-96',
    callsign: 'TANKER-96',
    name: 'Tanker 96 (S-2T Turbo Tracker)',
    modelOrType: 'Grumman S-2T Turbo Tracker',
    registration: 'N421DF',
    operator: 'Cal Fire Aviation / Central Operations',
    category: 'air_tanker',
    transponder: {
      hex: 'A5089C',
      squawk: '1255',
      mode: 'ADS-B Out (DO-260B Mode-S)',
      icao: 'A5089C (Cal Fire Fleet)',
    },
    telemetry: {
      altitudeMslFt: 4200,
      altitudeAglFt: 1700,
      airspeedKts: 220,
      groundSpeedKts: 228,
      verticalRateFpm: -180,
      headingDeg: 195,
      pitchDeg: -0.8,
      rollDeg: -2.2,
      gForce: 1.05,
      fuelRemainingLbs: 3450,
      fuelCapacityLbs: 5800,
      fuelBurnRatePph: 1280,
      enduranceRemaining: '2h 41m',
      payloadType: 'Phos-Chek MVP-Fx Retardant',
      payloadCapacityGal: 1200,
      payloadCurrentGal: 1200,
      dropCoverageLevel: 'Coverage Level 4 (CL-4)',
      dropSystemType: 'Cal Fire Computer-Controlled Constant Flow Tank',
      dropGateStatus: 'Armed & Ready',
      tankPressurePsi: 29.0,
      engineTIT: [668, 674],
      engineN1: [94.2, 94.8],
      engineN2: [98.1, 98.3],
      hydraulicPressureSysA: 2970,
      hydraulicPressureSysB: 2990,
      oilPressurePsi: 62,
      oilTempC: 74,
      coordinates: { lat: 35.85, lng: -121.20 },
      targetIncident: 'Big Sur Coastal Wilderness Fire',
      distanceToTargetNm: 28.5,
      etaToTargetMin: 7.5,
      bearingToTargetDeg: 320,
      homeAirbase: 'Paso Robles Air Attack Base (PRB)',
    },
    flightHours: {
      airframeTTSN: 13890.0,
      totalCycles: 9210,
      seasonFlightHours2026: 320.5,
      seasonQuotaMaxHours: 450.0,
      hoursSincePhaseCheck: 44.5,
      phaseCheckLimitHours: 50.0,
      dropCyclesLogged: 3640,
      enginesTSOH: [
        { engineIndex: 1, model: 'Garrett TPE331-14GR Left', tsohHours: 1120.0, cycles: 1240, hsiDueHours: 1380.0 },
        { engineIndex: 2, model: 'Garrett TPE331-14GR Right', tsohHours: 1040.2, cycles: 1180, hsiDueHours: 1459.8 },
      ],
      crewHoursOnType: {
        picHours: 2980.0,
        sicHours: 0,
      },
      missionSorties2026: {
        initialAttack: 58,
        retardantReinforce: 89,
        reconnaissance: 0,
        transitFerry: 15,
      },
    },
    maintenanceHistory: {
      overallAirworthiness: 'Scheduled Phase Due Soon',
      lastAnnualInspectionDate: '2026-04-14',
      nextPhaseDueInHours: 5.5,
      records: [
        {
          id: 'WO-S2T-4402',
          date: '2026-09-25',
          workOrder: 'WO-4402-HYD',
          type: 'Unscheduled Repair',
          title: 'Hydraulic System B Return Line Hose Replacement & Bleed',
          description: 'Replaced chafed flexible hydraulic return hose on right main gear retract circuit. System filled with Royco 756 red fluid and operational test completed.',
          technician: 'E. Mercer, A&P',
          inspectorCert: 'A&P #3194012',
          station: 'Paso Robles Air Attack Base',
          status: 'Signed Off & Closed',
          partReplaced: 'Stratoflex Aero Hydraulic Hose P/N 111-6-18',
        },
      ],
      lifeLimitedParts: [
        {
          partName: 'Retardant Load Cell Weigh Bar',
          partNumber: 'CL-LOAD-04',
          lifeLimitHoursOrCycles: '5,000 Drops',
          currentAccumulated: '3,640 Drops',
          percentRemaining: 27.2,
          replacementDue: 'In 1,360 Drops',
        },
      ],
      airworthinessDirectives: [
        {
          adNumber: 'AD 2026-04-02',
          effectiveDate: '2026-04-10',
          subject: 'S-2T Wing Fold Ultrasonic Inspection',
          status: 'Complied With',
          nextDue: '2027-04-10',
        },
      ],
    },
  },

  'tanker-160': {
    aircraftId: 'tanker-160',
    callsign: 'TANKER-160',
    name: 'Tanker 160 (RJ85 Air Tanker)',
    modelOrType: 'Avro RJ85 Airtanker',
    registration: 'N355AC',
    operator: 'Conair Aerial Firefighting / Cal Fire South Ops',
    category: 'air_tanker',
    transponder: {
      hex: 'A3F890',
      squawk: '1255',
      mode: 'ADS-B Out (DO-260B Mode-S)',
      icao: 'A3F890 (FAA Registry)',
    },
    telemetry: {
      altitudeMslFt: 5400,
      altitudeAglFt: 1850,
      airspeedKts: 255,
      groundSpeedKts: 262,
      verticalRateFpm: -380,
      headingDeg: 145,
      pitchDeg: -1.6,
      rollDeg: 3.1,
      gForce: 1.12,
      fuelRemainingLbs: 16800,
      fuelCapacityLbs: 31000,
      fuelBurnRatePph: 4800,
      enduranceRemaining: '3h 30m',
      payloadType: 'Phos-Chek MVP-Fx Retardant',
      payloadCapacityGal: 3100,
      payloadCurrentGal: 3100,
      dropCoverageLevel: 'Coverage Level 6 (CL-6)',
      dropSystemType: 'Retardant Aerial Delivery Tank (RADS Internal)',
      dropGateStatus: 'Armed & Ready',
      tankPressurePsi: 34.0,
      engineTIT: [620, 625, 622, 619],
      engineN1: [91.0, 91.2, 91.1, 90.9],
      engineN2: [93.4, 93.6, 93.5, 93.3],
      hydraulicPressureSysA: 3010,
      hydraulicPressureSysB: 2990,
      oilPressurePsi: 56,
      oilTempC: 80,
      coordinates: { lat: 33.30, lng: -116.85 },
      targetIncident: 'Cleveland National Forest Fire',
      distanceToTargetNm: 11.2,
      etaToTargetMin: 2.6,
      bearingToTargetDeg: 152,
      homeAirbase: 'Ramona Air Attack Base (RNM)',
    },
    flightHours: {
      airframeTTSN: 22410.8,
      totalCycles: 16920,
      seasonFlightHours2026: 275.0,
      seasonQuotaMaxHours: 420.0,
      hoursSincePhaseCheck: 22.0,
      phaseCheckLimitHours: 50.0,
      dropCyclesLogged: 2180,
      enginesTSOH: [
        { engineIndex: 1, model: 'Honeywell LF 507-1F Eng 1', tsohHours: 1320.0, cycles: 980, hsiDueHours: 1180.0 },
        { engineIndex: 2, model: 'Honeywell LF 507-1F Eng 2', tsohHours: 1410.5, cycles: 1040, hsiDueHours: 1089.5 },
        { engineIndex: 3, model: 'Honeywell LF 507-1F Eng 3', tsohHours: 1180.0, cycles: 890, hsiDueHours: 1320.0 },
        { engineIndex: 4, model: 'Honeywell LF 507-1F Eng 4', tsohHours: 1540.2, cycles: 1120, hsiDueHours: 959.8 },
      ],
      crewHoursOnType: {
        picHours: 4620.0,
        sicHours: 1980.0,
      },
      missionSorties2026: {
        initialAttack: 38,
        retardantReinforce: 74,
        reconnaissance: 0,
        transitFerry: 16,
      },
    },
    maintenanceHistory: {
      overallAirworthiness: 'Full Mission Capable (FMC)',
      lastAnnualInspectionDate: '2026-05-10',
      nextPhaseDueInHours: 28.0,
      records: [
        {
          id: 'WO-RJ85-3290',
          date: '2026-09-23',
          workOrder: 'WO-3290-RADS',
          type: 'Drop System Service',
          title: 'RADS Constant Flow Internal Suppressant Tank Baffle Weld NDT',
          description: 'Ultrasonic inspection of internal titanium tank anti-surge baffles. No microfissures detected following high-G drop sequences over steep terrain.',
          technician: 'T. Holcomb, A&P / NDT',
          inspectorCert: 'A&P #3819201',
          station: 'Ramona Air Attack Base',
          status: 'Signed Off & Closed',
        },
      ],
      lifeLimitedParts: [
        {
          partName: 'RADS Hydraulic Door Actuator Pack',
          partNumber: 'RJ-RADS-ACT-02',
          lifeLimitHoursOrCycles: '2,500 Drops',
          currentAccumulated: '2,180 Drops',
          percentRemaining: 12.8,
          replacementDue: 'In 320 Drops',
        },
      ],
      airworthinessDirectives: [
        {
          adNumber: 'AD 2026-02-14',
          effectiveDate: '2026-03-01',
          subject: 'Avro RJ85 Flap Control Unit Electronic Rigging',
          status: 'Complied With',
          nextDue: '2027-03-01',
        },
      ],
    },
  },

  'heli-106': {
    aircraftId: 'heli-106',
    callsign: 'COPTER-106',
    name: 'Copter 106 (S-70i Firehawk)',
    modelOrType: 'Sikorsky S-70i Cal Fire Firehawk',
    registration: 'N106DF',
    operator: 'Cal Fire Helitack / Northern Region',
    category: 'helicopter',
    transponder: {
      hex: 'A095FC',
      squawk: '1255',
      mode: 'ADS-B Out (DO-260B Mode-S)',
      icao: 'A095FC (Cal Fire Air Program)',
    },
    telemetry: {
      altitudeMslFt: 2200,
      altitudeAglFt: 650,
      airspeedKts: 130,
      groundSpeedKts: 125,
      verticalRateFpm: -220,
      headingDeg: 75,
      pitchDeg: -4.5,
      rollDeg: 6.2,
      gForce: 1.18,
      fuelRemainingLbs: 2200,
      fuelCapacityLbs: 3400,
      fuelBurnRatePph: 980,
      enduranceRemaining: '2h 14m',
      payloadType: 'Water with Foam Suppressant Injector',
      payloadCapacityGal: 1000,
      payloadCurrentGal: 850,
      dropCoverageLevel: 'CL-8 Variable Pattern (Precision Direct Helitack)',
      dropSystemType: 'Kawak Aviation 1,000-Gallon Belly Tank + Retractable Snorkel',
      dropGateStatus: 'Armed & Ready',
      tankPressurePsi: 22.0,
      engineTIT: [780, 785],
      engineN1: [96.4, 96.6],
      engineN2: [100.0, 100.0],
      hydraulicPressureSysA: 3050,
      hydraulicPressureSysB: 3040,
      oilPressurePsi: 70,
      oilTempC: 88,
      coordinates: { lat: 38.85, lng: -122.75 },
      targetIncident: 'Mendocino Lightning Strike Cluster',
      distanceToTargetNm: 2.8,
      etaToTargetMin: 1.3,
      bearingToTargetDeg: 82,
      homeAirbase: 'Boggs Mountain Helitack Base',
    },
    flightHours: {
      airframeTTSN: 3420.0,
      totalCycles: 4980,
      seasonFlightHours2026: 395.2,
      seasonQuotaMaxHours: 480.0,
      hoursSincePhaseCheck: 18.0,
      phaseCheckLimitHours: 50.0,
      dropCyclesLogged: 4120,
      enginesTSOH: [
        { engineIndex: 1, model: 'GE T700-GE-701D Eng 1', tsohHours: 920.0, cycles: 1840, hsiDueHours: 1580.0 },
        { engineIndex: 2, model: 'GE T700-GE-701D Eng 2', tsohHours: 920.0, cycles: 1840, hsiDueHours: 1580.0 },
      ],
      crewHoursOnType: {
        picHours: 2450.0,
        sicHours: 1280.0,
      },
      missionSorties2026: {
        initialAttack: 112,
        retardantReinforce: 184,
        reconnaissance: 24,
        transitFerry: 28,
      },
    },
    maintenanceHistory: {
      overallAirworthiness: 'Full Mission Capable (FMC)',
      lastAnnualInspectionDate: '2026-06-01',
      nextPhaseDueInHours: 32.0,
      records: [
        {
          id: 'WO-S70I-2104',
          date: '2026-09-28',
          workOrder: 'WO-2104-SNRK',
          type: 'Drop System Service',
          title: '25-Hour Retractable Snorkel Pump Impeller & Hydro-Seals Check',
          description: 'Checked 1,000-gal belly tank fill pump impeller clearance; zero cavitation wear observed. Filled 1,000 gallons in 42-second ground timed proof run.',
          technician: 'G. Morales, Cal Fire Helitack Tech',
          inspectorCert: 'A&P #4091823',
          station: 'Boggs Mountain Helitack Base',
          status: 'Signed Off & Closed',
        },
        {
          id: 'WO-S70I-2089',
          date: '2026-09-20',
          workOrder: 'WO-2089-ROTOR',
          type: 'Phase Inspection',
          title: 'Chadwick-Helmuth 192A Main Rotor Track & Balance Analysis',
          description: 'Executed ground and forward flight track and balance run. Trim tab adjustments reduced 1/rev lateral vibration to 0.08 IPS (Sikorsky limit is 0.20 IPS).',
          technician: 'K. Larson, Rotorcraft Specialist',
          inspectorCert: 'A&P #3290114',
          station: 'McClellan Air Depot',
          status: 'Signed Off & Closed',
        },
      ],
      lifeLimitedParts: [
        {
          partName: 'Main Rotor Spindle Elastomeric Bearings (Set of 4)',
          partNumber: '70102-08100-044',
          lifeLimitHoursOrCycles: '2,500 Flight Hours',
          currentAccumulated: '1,840 Flight Hours',
          percentRemaining: 26.4,
          replacementDue: 'In 660 Hours',
        },
        {
          partName: 'Belly Tank Rapid Vent Snorkel Hose',
          partNumber: 'KWK-SNK-1000',
          lifeLimitHoursOrCycles: '1,500 Dips',
          currentAccumulated: '892 Dips',
          percentRemaining: 40.5,
          replacementDue: 'In 608 Dips',
        },
      ],
      airworthinessDirectives: [
        {
          adNumber: 'AD 2026-01-09',
          effectiveDate: '2026-02-15',
          subject: 'Sikorsky S-70i Tail Rotor Servo Pitch Link Inspection',
          status: 'Complied With',
          nextDue: '2027-02-15',
        },
      ],
    },
  },

  'heli-501': {
    aircraftId: 'heli-501',
    callsign: 'COPTER-501',
    name: 'Copter 501 (CH-47D Chinook Helitanker)',
    modelOrType: 'Boeing CH-47D Chinook',
    registration: 'N303CH',
    operator: 'Billings Flying Service / Cal Fire Heavy Helitanker',
    category: 'helicopter',
    transponder: {
      hex: 'A32D91',
      squawk: '1255',
      mode: 'ADS-B Out (DO-260B Mode-S)',
      icao: 'A32D91 (FAA Registry)',
    },
    telemetry: {
      altitudeMslFt: 3100,
      altitudeAglFt: 950,
      airspeedKts: 140,
      groundSpeedKts: 146,
      verticalRateFpm: -300,
      headingDeg: 110,
      pitchDeg: -3.2,
      rollDeg: 2.8,
      gForce: 1.15,
      fuelRemainingLbs: 6400,
      fuelCapacityLbs: 10400,
      fuelBurnRatePph: 2400,
      enduranceRemaining: '2h 40m',
      payloadType: 'Phos-Chek MVP-Fx Retardant or Lake Water',
      payloadCapacityGal: 2600,
      payloadCurrentGal: 2600,
      dropCoverageLevel: 'CL-8 Heavy Suppressant Blanket',
      dropSystemType: 'Internal Fire Retardant Delivery System (2,600 Gal)',
      dropGateStatus: 'Armed & Ready',
      tankPressurePsi: 31.0,
      engineTIT: [740, 745],
      engineN1: [98.2, 98.4],
      engineN2: [100.0, 100.0],
      hydraulicPressureSysA: 3000,
      hydraulicPressureSysB: 3000,
      oilPressurePsi: 68,
      oilTempC: 82,
      coordinates: { lat: 36.65, lng: -119.50 },
      targetIncident: 'Sequoia Lightning Complex',
      distanceToTargetNm: 44.8,
      etaToTargetMin: 18.4,
      bearingToTargetDeg: 102,
      homeAirbase: 'Fresno Yosemite Air Attack Base (FAT)',
    },
    flightHours: {
      airframeTTSN: 11840.4,
      totalCycles: 8940,
      seasonFlightHours2026: 290.8,
      seasonQuotaMaxHours: 420.0,
      hoursSincePhaseCheck: 26.5,
      phaseCheckLimitHours: 50.0,
      dropCyclesLogged: 1680,
      enginesTSOH: [
        { engineIndex: 1, model: 'Honeywell T55-GA-714A Eng 1', tsohHours: 1240.0, cycles: 1420, hsiDueHours: 760.0 },
        { engineIndex: 2, model: 'Honeywell T55-GA-714A Eng 2', tsohHours: 1180.2, cycles: 1380, hsiDueHours: 819.8 },
      ],
      crewHoursOnType: {
        picHours: 4100.0,
        sicHours: 1890.0,
      },
      missionSorties2026: {
        initialAttack: 44,
        retardantReinforce: 86,
        reconnaissance: 0,
        transitFerry: 18,
      },
    },
    maintenanceHistory: {
      overallAirworthiness: 'Full Mission Capable (FMC)',
      lastAnnualInspectionDate: '2026-05-14',
      nextPhaseDueInHours: 23.5,
      records: [
        {
          id: 'WO-CH47-1904',
          date: '2026-09-26',
          workOrder: 'WO-1904-SYN',
          type: 'Phase Inspection',
          title: 'Tandem Rotor Synchronization Drive Shaft & Transmission Inspection',
          description: 'Checked forward, aft, and combining transmission oil levels; magnetic plugs 100% clean. Synchronizing shaft coupling splines inspected and greased.',
          technician: 'N. O’Connor, CH-47 Specialist',
          inspectorCert: 'A&P #3719002',
          station: 'Fresno Yosemite AAB',
          status: 'Signed Off & Closed',
        },
      ],
      lifeLimitedParts: [
        {
          partName: 'Forward Rotor Head Pitch Housing',
          partNumber: '145R2001-11',
          lifeLimitHoursOrCycles: '3,000 Flight Hours',
          currentAccumulated: '2,140 Flight Hours',
          percentRemaining: 28.7,
          replacementDue: 'In 860 Hours',
        },
      ],
      airworthinessDirectives: [
        {
          adNumber: 'AD 2026-03-21',
          effectiveDate: '2026-04-18',
          subject: 'Boeing Vertol CH-47 Rotor Blade Leading Edge Abrasion Strip Inspection',
          status: 'Complied With',
          nextDue: '2027-04-18',
        },
      ],
    },
  },

  'heli-902': {
    aircraftId: 'heli-902',
    callsign: 'COPTER-902',
    name: 'Copter 902 (UH-1H Super Huey)',
    modelOrType: 'Bell UH-1H Super Huey',
    registration: 'N902DF',
    operator: 'Cal Fire Aviation / Humboldt District',
    category: 'helicopter',
    transponder: {
      hex: 'A0CD41',
      squawk: '1255',
      mode: 'ADS-B Out (DO-260B Mode-S)',
      icao: 'A0CD41 (Cal Fire Air Operations)',
    },
    telemetry: {
      altitudeMslFt: 1800,
      altitudeAglFt: 550,
      airspeedKts: 115,
      groundSpeedKts: 112,
      verticalRateFpm: -100,
      headingDeg: 15,
      pitchDeg: -2.5,
      rollDeg: 1.8,
      gForce: 1.04,
      fuelRemainingLbs: 1150,
      fuelCapacityLbs: 1400,
      fuelBurnRatePph: 620,
      enduranceRemaining: '1h 51m',
      payloadType: 'Water Dip / SEI 360-gal Bambi Bucket',
      payloadCapacityGal: 360,
      payloadCurrentGal: 360,
      dropCoverageLevel: 'CL-4 Precision Spot Suppression',
      dropSystemType: 'SEI 360-gal Bambi Bucket with Remote Valve Release',
      dropGateStatus: 'Armed & Ready',
      tankPressurePsi: 18.0,
      engineTIT: [690],
      engineN1: [97.5],
      engineN2: [100.0],
      hydraulicPressureSysA: 1500,
      hydraulicPressureSysB: 1500,
      oilPressurePsi: 58,
      oilTempC: 75,
      coordinates: { lat: 40.90, lng: -124.10 },
      targetIncident: 'Shasta Complex Wildfire',
      distanceToTargetNm: 75.0,
      etaToTargetMin: 39.0,
      bearingToTargetDeg: 86,
      homeAirbase: 'Humboldt Bay Ops Base',
    },
    flightHours: {
      airframeTTSN: 16840.2,
      totalCycles: 12400,
      seasonFlightHours2026: 245.0,
      seasonQuotaMaxHours: 380.0,
      hoursSincePhaseCheck: 31.0,
      phaseCheckLimitHours: 50.0,
      dropCyclesLogged: 2980,
      enginesTSOH: [
        { engineIndex: 1, model: 'Honeywell T53-L-703', tsohHours: 1410.0, cycles: 1980, hsiDueHours: 590.0 },
      ],
      crewHoursOnType: {
        picHours: 2940.0,
        sicHours: 1100.0,
      },
      missionSorties2026: {
        initialAttack: 62,
        retardantReinforce: 48,
        reconnaissance: 18,
        transitFerry: 20,
      },
    },
    maintenanceHistory: {
      overallAirworthiness: 'Full Mission Capable (FMC)',
      lastAnnualInspectionDate: '2026-04-12',
      nextPhaseDueInHours: 19.0,
      records: [
        {
          id: 'WO-UH1-1180',
          date: '2026-09-25',
          workOrder: 'WO-1180-BAM',
          type: 'Drop System Service',
          title: '360-gal Bambi Bucket Hook Release Proof-Load & Solenoid Test',
          description: 'Tested dual manual mechanical release and electronic solenoid trigger under 3,200 lb simulated proof load. Release instant and positive.',
          technician: 'S. Gallagher, A&P',
          inspectorCert: 'A&P #3491021',
          station: 'Humboldt Bay Ops Base',
          status: 'Signed Off & Closed',
        },
      ],
      lifeLimitedParts: [
        {
          partName: 'Main Rotor Grip Assembly',
          partNumber: '204-011-121-009',
          lifeLimitHoursOrCycles: '2,500 Flight Hours',
          currentAccumulated: '1,890 Flight Hours',
          percentRemaining: 24.4,
          replacementDue: 'In 610 Hours',
        },
      ],
      airworthinessDirectives: [
        {
          adNumber: 'AD 2025-18-04',
          effectiveDate: '2025-09-30',
          subject: 'Bell UH-1H Tail Rotor Blade Inspection for Skin Separation',
          status: 'Complied With',
          nextDue: '2027-03-30',
        },
      ],
    },
  },

  'heli-408': {
    aircraftId: 'heli-408',
    callsign: 'COPTER-408',
    name: 'Copter 408 (CH-54 Skycrane)',
    modelOrType: 'Sikorsky S-64 / CH-54 Tarhe Skycrane',
    registration: 'N178AC',
    operator: 'Erickson Air-Crane / Cal Fire Heavy Attack',
    category: 'helicopter',
    transponder: {
      hex: 'A1324E',
      squawk: '1255',
      mode: 'ADS-B Out (DO-260B Mode-S)',
      icao: 'A1324E (FAA Registry)',
    },
    telemetry: {
      altitudeMslFt: 2900,
      altitudeAglFt: 880,
      airspeedKts: 125,
      groundSpeedKts: 130,
      verticalRateFpm: -240,
      headingDeg: 90,
      pitchDeg: -3.8,
      rollDeg: 3.5,
      gForce: 1.14,
      fuelRemainingLbs: 5800,
      fuelCapacityLbs: 8800,
      fuelBurnRatePph: 2100,
      enduranceRemaining: '2h 45m',
      payloadType: 'Phos-Chek MVP-Fx or Sea Water',
      payloadCapacityGal: 2500,
      payloadCurrentGal: 2400,
      dropCoverageLevel: 'CL-8 Deluge (Urban Wildland Interface Shield)',
      dropSystemType: 'Erickson 2,500-Gal Constant Flow Belly Tank + High-Flow Sea Snorkel',
      dropGateStatus: 'Armed & Ready',
      tankPressurePsi: 32.0,
      engineTIT: [725, 730],
      engineN1: [97.8, 98.1],
      engineN2: [100.0, 100.0],
      hydraulicPressureSysA: 3000,
      hydraulicPressureSysB: 3000,
      oilPressurePsi: 65,
      oilTempC: 80,
      coordinates: { lat: 34.25, lng: -118.45 },
      targetIncident: 'Angeles Crest Fire Complex',
      distanceToTargetNm: 18.2,
      etaToTargetMin: 8.4,
      bearingToTargetDeg: 78,
      homeAirbase: 'Van Nuys Tanker Base / Fox Field',
    },
    flightHours: {
      airframeTTSN: 15480.0,
      totalCycles: 11200,
      seasonFlightHours2026: 310.2,
      seasonQuotaMaxHours: 440.0,
      hoursSincePhaseCheck: 20.0,
      phaseCheckLimitHours: 50.0,
      dropCyclesLogged: 2940,
      enginesTSOH: [
        { engineIndex: 1, model: 'Pratt & Whitney JFTD12A Eng 1', tsohHours: 1340.0, cycles: 1620, hsiDueHours: 660.0 },
        { engineIndex: 2, model: 'Pratt & Whitney JFTD12A Eng 2', tsohHours: 1290.5, cycles: 1580, hsiDueHours: 709.5 },
      ],
      crewHoursOnType: {
        picHours: 4890.0,
        sicHours: 1940.0,
      },
      missionSorties2026: {
        initialAttack: 52,
        retardantReinforce: 98,
        reconnaissance: 0,
        transitFerry: 16,
      },
    },
    maintenanceHistory: {
      overallAirworthiness: 'Full Mission Capable (FMC)',
      lastAnnualInspectionDate: '2026-05-08',
      nextPhaseDueInHours: 30.0,
      records: [
        {
          id: 'WO-S64-4412',
          date: '2026-09-24',
          workOrder: 'WO-4412-SNK',
          type: 'Drop System Service',
          title: 'Sea-Snorkel High-Flow Hydro Turbine Impeller Verification',
          description: 'Tested ram-water pickup sea snorkel; filled 2,500 gallons in 44 seconds during Castaic Lake hover test. Retardant water cannon gimbal servos tested at 3,000 PSI.',
          technician: 'F. Calderon, A&P',
          inspectorCert: 'A&P #3819440',
          station: 'Van Nuys Tanker Base',
          status: 'Signed Off & Closed',
        },
      ],
      lifeLimitedParts: [
        {
          partName: 'Main Rotor Head Damper Assembly',
          partNumber: '64101-04100-041',
          lifeLimitHoursOrCycles: '2,000 Flight Hours',
          currentAccumulated: '1,480 Flight Hours',
          percentRemaining: 26.0,
          replacementDue: 'In 520 Hours',
        },
      ],
      airworthinessDirectives: [
        {
          adNumber: 'AD 2026-05-18',
          effectiveDate: '2026-06-01',
          subject: 'Sikorsky S-64 Main Rotor Swashplate Bearing Eddy Current Check',
          status: 'Complied With',
          nextDue: '2027-06-01',
        },
      ],
    },
  },

  'recon-140': {
    aircraftId: 'recon-140',
    callsign: 'AIR ATTACK 140',
    name: 'Air Attack 140 (OV-10A Bronco)',
    modelOrType: 'North American Rockwell OV-10A Bronco',
    registration: 'N410DF',
    operator: 'Cal Fire Aviation / Northern Region ATGS',
    category: 'recon_lead',
    transponder: {
      hex: 'A4DE9B',
      squawk: '1255',
      mode: 'ADS-B Out (DO-260B Mode-S)',
      icao: 'A4DE9B (Cal Fire Fleet)',
    },
    telemetry: {
      altitudeMslFt: 7500,
      altitudeAglFt: 5100,
      airspeedKts: 190,
      groundSpeedKts: 198,
      verticalRateFpm: 0,
      headingDeg: 280,
      pitchDeg: 0.5,
      rollDeg: 1.2,
      gForce: 1.02,
      fuelRemainingLbs: 1680,
      fuelCapacityLbs: 2500,
      fuelBurnRatePph: 520,
      enduranceRemaining: '3h 14m',
      payloadType: 'Air Tactical Communications & Airborne Sensor Suite',
      payloadCapacityGal: 0,
      payloadCurrentGal: 0,
      dropCoverageLevel: 'Air Tactical Group Supervisor (ATGS)',
      dropSystemType: 'Multi-Band TacNet Radio Stack + Forward FLIR Turret',
      dropGateStatus: 'Standby',
      tankPressurePsi: 0,
      engineTIT: [640, 642],
      engineN1: [92.0, 92.1],
      engineN2: [96.5, 96.8],
      hydraulicPressureSysA: 3000,
      hydraulicPressureSysB: 3000,
      oilPressurePsi: 60,
      oilTempC: 72,
      coordinates: { lat: 40.40, lng: -122.10 },
      targetIncident: 'Shasta Complex Wildfire',
      distanceToTargetNm: 31.2,
      etaToTargetMin: 9.4,
      bearingToTargetDeg: 330,
      homeAirbase: 'Redding Air Attack Base (RDD)',
    },
    flightHours: {
      airframeTTSN: 12410.0,
      totalCycles: 10400,
      seasonFlightHours2026: 330.4,
      seasonQuotaMaxHours: 450.0,
      hoursSincePhaseCheck: 16.0,
      phaseCheckLimitHours: 50.0,
      dropCyclesLogged: 0,
      enginesTSOH: [
        { engineIndex: 1, model: 'Garrett TPE331-G-417 Left', tsohHours: 740.0, cycles: 890, hsiDueHours: 1760.0 },
        { engineIndex: 2, model: 'Garrett TPE331-G-417 Right', tsohHours: 810.5, cycles: 940, hsiDueHours: 1689.5 },
      ],
      crewHoursOnType: {
        picHours: 3940.0,
        sicHours: 2180.0,
      },
      missionSorties2026: {
        initialAttack: 84,
        retardantReinforce: 110,
        reconnaissance: 68,
        transitFerry: 14,
      },
    },
    maintenanceHistory: {
      overallAirworthiness: 'Full Mission Capable (FMC)',
      lastAnnualInspectionDate: '2026-05-22',
      nextPhaseDueInHours: 34.0,
      records: [
        {
          id: 'WO-OV10-8910',
          date: '2026-09-27',
          workOrder: 'WO-8910-AVN',
          type: 'Avionics Calibration',
          title: 'Air Attack Tactical Multi-Band VHF/UHF/FM Radio Stack Calibration',
          description: 'Tested 4 separate radio tranceivers on Cal Fire Air Tactics frequencies (126.025, 122.925, 123.975 MHz). VSWR < 1.3:1 across all antennas.',
          technician: 'H. Miller, Avionics Lead',
          inspectorCert: 'A&P #4190821',
          station: 'Redding Air Attack Base',
          status: 'Signed Off & Closed',
        },
      ],
      lifeLimitedParts: [
        {
          partName: 'Wing Carrythrough Center Section Spar Fitting',
          partNumber: 'OV10-SPAR-01',
          lifeLimitHoursOrCycles: '15,000 Flight Hours',
          currentAccumulated: '12,410 Flight Hours',
          percentRemaining: 17.3,
          replacementDue: 'In 2,590 Hours',
        },
      ],
      airworthinessDirectives: [
        {
          adNumber: 'AD 2025-11-08',
          effectiveDate: '2025-12-01',
          subject: 'Rockwell OV-10 Elevator Control Pushrod Inspection',
          status: 'Complied With',
          nextDue: '2026-12-01',
        },
      ],
    },
  },

  'recon-lead51': {
    aircraftId: 'recon-lead51',
    callsign: 'LEAD-51',
    name: 'Lead Plane 51 (King Air 200)',
    modelOrType: 'Beechcraft Super King Air 200',
    registration: 'N511FS',
    operator: 'US Forest Service / Cal Fire Lead Plane Division',
    category: 'recon_lead',
    transponder: {
      hex: 'A65C30',
      squawk: '1255',
      mode: 'ADS-B Out (DO-260B Mode-S)',
      icao: 'A65C30 (USFS Aviation)',
    },
    telemetry: {
      altitudeMslFt: 5800,
      altitudeAglFt: 2200,
      airspeedKts: 210,
      groundSpeedKts: 216,
      verticalRateFpm: -120,
      headingDeg: 215,
      pitchDeg: -0.5,
      rollDeg: -1.8,
      gForce: 1.06,
      fuelRemainingLbs: 2100,
      fuelCapacityLbs: 3600,
      fuelBurnRatePph: 680,
      enduranceRemaining: '3h 05m',
      payloadType: 'Smoke Oil Target Marker Injector System',
      payloadCapacityGal: 40,
      payloadCurrentGal: 35,
      dropCoverageLevel: 'Lead Plane Guidance & Smoke Line Marker',
      dropSystemType: 'Engine Exhaust Smoke Oil Injector Nozzles',
      dropGateStatus: 'Armed & Ready',
      tankPressurePsi: 45.0,
      engineTIT: [660, 665],
      engineN1: [94.0, 94.2],
      engineN2: [97.0, 97.2],
      hydraulicPressureSysA: 2800,
      hydraulicPressureSysB: 2800,
      oilPressurePsi: 60,
      oilTempC: 70,
      coordinates: { lat: 39.95, lng: -121.30 },
      targetIncident: 'Dixie Ridge Secondary Fire',
      distanceToTargetNm: 12.4,
      etaToTargetMin: 3.4,
      bearingToTargetDeg: 220,
      homeAirbase: 'Chico Air Attack Base (CIC)',
    },
    flightHours: {
      airframeTTSN: 10920.0,
      totalCycles: 9400,
      seasonFlightHours2026: 298.5,
      seasonQuotaMaxHours: 420.0,
      hoursSincePhaseCheck: 24.0,
      phaseCheckLimitHours: 50.0,
      dropCyclesLogged: 620,
      enginesTSOH: [
        { engineIndex: 1, model: 'Pratt & Whitney PT6A-42 Left', tsohHours: 920.0, cycles: 1140, hsiDueHours: 880.0 },
        { engineIndex: 2, model: 'Pratt & Whitney PT6A-42 Right', tsohHours: 960.5, cycles: 1190, hsiDueHours: 839.5 },
      ],
      crewHoursOnType: {
        picHours: 4800.0,
        sicHours: 1950.0,
      },
      missionSorties2026: {
        initialAttack: 68,
        retardantReinforce: 92,
        reconnaissance: 44,
        transitFerry: 12,
      },
    },
    maintenanceHistory: {
      overallAirworthiness: 'Full Mission Capable (FMC)',
      lastAnnualInspectionDate: '2026-04-28',
      nextPhaseDueInHours: 26.0,
      records: [
        {
          id: 'WO-B200-7712',
          date: '2026-09-28',
          workOrder: 'WO-7712-SMK',
          type: 'Drop System Service',
          title: 'Smoke Oil Injection Exhaust Delivery Pressure Nozzle Service',
          description: 'Flushed Corvus smoke oil injector lines; replaced both exhaust nozzle spray tips to eliminate carbon coking. Verified clean, immediate white smoke trail generation.',
          technician: 'P. Johansen, USFS Mechanic',
          inspectorCert: 'A&P #3610992',
          station: 'Chico Air Attack Base',
          status: 'Signed Off & Closed',
        },
      ],
      lifeLimitedParts: [
        {
          partName: 'PT6A-42 Compressor Turbine Disk',
          partNumber: '3024801',
          lifeLimitHoursOrCycles: '12,000 Cycles',
          currentAccumulated: '7,420 Cycles',
          percentRemaining: 38.2,
          replacementDue: 'In 4,580 Cycles',
        },
      ],
      airworthinessDirectives: [
        {
          adNumber: 'AD 2026-07-03',
          effectiveDate: '2026-05-01',
          subject: 'Beechcraft King Air 200 Rudder Boost System Operational Inspection',
          status: 'Complied With',
          nextDue: '2027-05-01',
        },
      ],
    },
  },
};

/**
 * Fallback synthesizer for any dynamically provided aircraft
 */
export function getAircraftDossier(asset: {
  id: string;
  name: string;
  category: string;
  modelOrType: string;
  callsign: string;
  lat: number;
  lng: number;
  heading?: number;
  speedKnots?: number;
  altitudeFt?: number;
  status?: string;
  payloadCapacityGal?: number;
  currentPayloadGal?: number;
  baseLocation?: string;
  assignedIncident?: string;
  missionSummary?: string;
}): AircraftDossier | null {
  // If it's an airbase or wildfire, it is not an aircraft
  if (asset.category === 'air_base' || asset.category === 'military_base' || asset.category === 'wildfire') {
    return null;
  }

  // If in registry, return registered record
  if (AIRCRAFT_MAINTENANCE_REGISTRY[asset.id]) {
    // Sync latest real-time spatial properties
    const existing = AIRCRAFT_MAINTENANCE_REGISTRY[asset.id];
    return {
      ...existing,
      telemetry: {
        ...existing.telemetry,
        airspeedKts: asset.speedKnots || existing.telemetry.airspeedKts,
        altitudeMslFt: asset.altitudeFt || existing.telemetry.altitudeMslFt,
        headingDeg: asset.heading !== undefined ? asset.heading : existing.telemetry.headingDeg,
        coordinates: { lat: asset.lat, lng: asset.lng },
        payloadCurrentGal: asset.currentPayloadGal !== undefined ? asset.currentPayloadGal : existing.telemetry.payloadCurrentGal,
      },
    };
  }

  // Synthesize realistic dossier for any newly added aircraft
  const isTanker = asset.category === 'air_tanker';
  const isHeli = asset.category === 'helicopter';
  const isRecon = asset.category === 'recon_lead';

  const defaultCategory: 'air_tanker' | 'helicopter' | 'recon_lead' = isTanker
    ? 'air_tanker'
    : isHeli
    ? 'helicopter'
    : 'recon_lead';

  const hexCode = `A${Math.floor(100000 + Math.random() * 899999).toString(16).toUpperCase()}`;

  return {
    aircraftId: asset.id,
    callsign: asset.callsign || asset.name.split(' ')[0] || 'TACTICAL-AC',
    name: asset.name,
    modelOrType: asset.modelOrType,
    registration: `N${Math.floor(100 + Math.random() * 899)}DF`,
    operator: 'Cal Fire Aviation Division',
    category: defaultCategory,
    transponder: {
      hex: hexCode,
      squawk: '1255',
      mode: 'ADS-B Out (DO-260B Mode-S)',
      icao: `${hexCode} (Cal Fire)`,
    },
    telemetry: {
      altitudeMslFt: asset.altitudeFt || 4500,
      altitudeAglFt: Math.max(800, (asset.altitudeFt || 4500) - 2200),
      airspeedKts: asset.speedKnots || 220,
      groundSpeedKts: (asset.speedKnots || 220) + 6,
      verticalRateFpm: -150,
      headingDeg: asset.heading || 180,
      pitchDeg: -1.2,
      rollDeg: 2.0,
      gForce: 1.08,
      fuelRemainingLbs: isTanker ? 14500 : isHeli ? 2200 : 1800,
      fuelCapacityLbs: isTanker ? 28000 : isHeli ? 3500 : 2600,
      fuelBurnRatePph: isTanker ? 3800 : isHeli ? 950 : 540,
      enduranceRemaining: '3h 15m',
      payloadType: isTanker ? 'Phos-Chek MVP-Fx Retardant' : isHeli ? 'Water Suppressant' : 'Sensor Telemetry',
      payloadCapacityGal: asset.payloadCapacityGal || (isTanker ? 3000 : isHeli ? 1000 : 0),
      payloadCurrentGal: asset.currentPayloadGal || (isTanker ? 3000 : isHeli ? 1000 : 0),
      dropCoverageLevel: isTanker ? 'Coverage Level 6 (CL-6)' : isHeli ? 'CL-8 Precision Helitack' : 'Observation',
      dropSystemType: isTanker ? 'Constant Flow Retardant Tank' : isHeli ? 'Belly Tank + Snorkel' : 'Electronic Sensors',
      dropGateStatus: 'Armed & Ready',
      tankPressurePsi: 32.0,
      engineTIT: isTanker ? [640, 645] : isHeli ? [760, 765] : [630, 635],
      engineN1: [94.0, 94.2],
      engineN2: [98.0, 98.2],
      hydraulicPressureSysA: 3000,
      hydraulicPressureSysB: 3000,
      oilPressurePsi: 60,
      oilTempC: 78,
      coordinates: { lat: asset.lat, lng: asset.lng },
      targetIncident: asset.assignedIncident || 'Active Wildfire Complex',
      distanceToTargetNm: 14.5,
      etaToTargetMin: 3.8,
      bearingToTargetDeg: 135,
      homeAirbase: asset.baseLocation || 'Sacramento McClellan Airbase',
    },
    flightHours: {
      airframeTTSN: 14500.0,
      totalCycles: 10200,
      seasonFlightHours2026: 285.4,
      seasonQuotaMaxHours: 420.0,
      hoursSincePhaseCheck: 21.0,
      phaseCheckLimitHours: 50.0,
      dropCyclesLogged: 2100,
      enginesTSOH: [
        { engineIndex: 1, model: 'Primary Turbine #1', tsohHours: 1100.0, cycles: 1200, hsiDueHours: 900.0 },
        { engineIndex: 2, model: 'Primary Turbine #2', tsohHours: 1150.0, cycles: 1240, hsiDueHours: 850.0 },
      ],
      crewHoursOnType: {
        picHours: 3600.0,
        sicHours: 1400.0,
      },
      missionSorties2026: {
        initialAttack: 42,
        retardantReinforce: 78,
        reconnaissance: 12,
        transitFerry: 16,
      },
    },
    maintenanceHistory: {
      overallAirworthiness: 'Full Mission Capable (FMC)',
      lastAnnualInspectionDate: '2026-05-15',
      nextPhaseDueInHours: 29.0,
      records: [
        {
          id: `WO-${asset.id}-01`,
          date: '2026-09-26',
          workOrder: `WO-${Math.floor(1000 + Math.random() * 9000)}-TAC`,
          type: 'Phase Inspection',
          title: '50-Hour Airframe & Flight Control System Operational Check',
          description: 'Completed 50-hour routine airframe phase check, drop gate actuator cycle test, and pit turnaround inspection. Cleared for flight.',
          technician: 'Lead A&P Inspection Crew',
          inspectorCert: 'A&P / IA #3910244',
          station: asset.baseLocation || 'Cal Fire Air Operations',
          status: 'Signed Off & Closed',
        },
      ],
      lifeLimitedParts: [
        {
          partName: 'Dispersal Door Main Actuator Seal',
          partNumber: 'SEAL-TAC-01',
          lifeLimitHoursOrCycles: '2,000 Drops',
          currentAccumulated: '1,420 Drops',
          percentRemaining: 29.0,
          replacementDue: 'In 580 Drops',
        },
      ],
      airworthinessDirectives: [
        {
          adNumber: 'AD 2026-01-01',
          effectiveDate: '2026-02-01',
          subject: 'Wildfire Fleet Mission Equipment Recurring Inspection',
          status: 'Complied With',
          nextDue: '2027-02-01',
        },
      ],
    },
  };
}
