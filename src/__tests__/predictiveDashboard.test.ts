import { describe, it, expect } from 'vitest';
import { CALFIRE_AND_MILITARY_BASES, AirbaseResource } from '../data/calfireAirbases';
import { PredictivePoint, AnomalyRecord } from '../types';

describe('Predictive Dashboard & Base Resource Allocation Suite', () => {
  // 1. Airbase Data & Readiness Tests
  describe('CAL FIRE & Military Airbase Telemetry', () => {
    it('contains all 14 monitored airbases across California sectors', () => {
      expect(CALFIRE_AND_MILITARY_BASES.length).toBeGreaterThanOrEqual(14);
      
      const codes = CALFIRE_AND_MILITARY_BASES.map(b => b.code);
      expect(codes).toContain('RDD'); // Redding
      expect(codes).toContain('MCC'); // McClellan VLAT Hub
      expect(codes).toContain('CIC'); // Chico
      expect(codes).toContain('PRB'); // Paso Robles
      expect(codes).toContain('FAT'); // Fresno
      expect(codes).toContain('RNM'); // Ramona
    });

    it('calculates loading pit occupancy accurately across bases', () => {
      const totalPits = CALFIRE_AND_MILITARY_BASES.reduce((acc, b) => acc + b.loadingPits, 0);
      const occupiedPits = CALFIRE_AND_MILITARY_BASES.reduce((acc, b) => acc + b.activePitsOccupied, 0);

      expect(totalPits).toBeGreaterThan(30);
      expect(occupiedPits).toBeLessThanOrEqual(totalPits);

      const redding = CALFIRE_AND_MILITARY_BASES.find(b => b.code === 'RDD');
      expect(redding).toBeDefined();
      if (redding) {
        const pitPct = Math.round((redding.activePitsOccupied / redding.loadingPits) * 100);
        expect(pitPct).toBe(75); // 3 of 4 pits occupied
      }
    });

    it('verifies Phos-Chek retardant stockpiles and reserves', () => {
      CALFIRE_AND_MILITARY_BASES.forEach(base => {
        expect(base.retardantStorageGal).toBeGreaterThan(0);
        expect(base.currentMixGal).toBeLessThanOrEqual(base.retardantStorageGal);
        expect(base.pumpingRateGpm).toBeGreaterThanOrEqual(500);
      });

      const mcclellan = CALFIRE_AND_MILITARY_BASES.find(b => b.code === 'MCC');
      expect(mcclellan?.type).toBe('vlat_hub');
      expect(mcclellan?.retardantStorageGal).toBe(220000); // VLAT high-capacity hub
    });

    it('filters bases by operational region correctly', () => {
      const northOps = CALFIRE_AND_MILITARY_BASES.filter(b => b.region === 'North Ops');
      const southOps = CALFIRE_AND_MILITARY_BASES.filter(b => b.region === 'South Ops');
      const military = CALFIRE_AND_MILITARY_BASES.filter(b => b.region === 'Joint Defense' || b.type === 'military_base');

      expect(northOps.length).toBeGreaterThanOrEqual(5);
      expect(southOps.length).toBeGreaterThanOrEqual(4);
      expect(military.length).toBeGreaterThanOrEqual(2);
    });

    it('sorts bases by turnaround latency and capacity', () => {
      const sortedByTurnaround = [...CALFIRE_AND_MILITARY_BASES].sort(
        (a, b) => a.turnaroundAvgMin - b.turnaroundAvgMin
      );
      expect(sortedByTurnaround[0].turnaroundAvgMin).toBeLessThanOrEqual(
        sortedByTurnaround[sortedByTurnaround.length - 1].turnaroundAvgMin
      );

      const sortedByCapacity = [...CALFIRE_AND_MILITARY_BASES].sort(
        (a, b) => b.retardantStorageGal - a.retardantStorageGal
      );
      expect(sortedByCapacity[0].retardantStorageGal).toBeGreaterThanOrEqual(220000);
      expect(['VCV', 'MCC']).toContain(sortedByCapacity[0].code);
    });
  });

  // 2. Predictive Horizon & Historical Telemetry Tooltip Tests
  describe('Historical Flight Operations Telemetry & Anomaly Markers', () => {
    const sampleHistoricalPoints: PredictivePoint[] = [
      {
        date: '09/01',
        actual: 18.2,
        sortiesFlown: 24,
        zScore: -0.3,
        primaryBase: 'Redding Air Attack Base (RDD)',
        weatherSummary: '88°F · RH 18% · Winds 12kt NW',
      },
      {
        date: '09/08',
        actual: 22.8,
        sortiesFlown: 36,
        zScore: +2.8,
        primaryBase: 'Redding Air Attack Base (RDD)',
        anomaly: {
          id: 'ANOM-SEP-08',
          title: 'Thermal Plume Downburst Over Shasta Sector',
          severity: 'critical',
          airframe: 'TANKER-80 (S-2T Turbo Tracker)',
          base: 'Redding Air Attack Base (RDD)',
          metric: 'Turnaround Latency',
          value: 22.8,
          expectedLimit: 18.0,
          rootCause: 'Severe microburst turbulence forced holding pattern',
          mitigation: 'Rerouted Tanker 96 from Paso Robles'
        }
      },
      {
        date: '09/15',
        actual: 21.4,
        sortiesFlown: 35,
        zScore: +2.1,
        anomaly: {
          id: 'ANOM-SEP-15',
          title: 'Helitack Fuel Booster Valve Cavitation',
          severity: 'high',
          airframe: 'COPTER-902 (UH-1H Super Huey)',
          base: 'Humboldt Bay Ops Base (HMB)',
          metric: 'Turnaround Latency',
          value: 21.4,
          expectedLimit: 17.5,
          rootCause: 'Vapor lock in auxiliary fueling tender during high ambient temp',
          mitigation: 'Replaced high-pressure bleed valve'
        }
      }
    ];

    it('verifies historical data points have valid turnaround metrics and margins', () => {
      const slaCeiling = 20.0;
      sampleHistoricalPoints.forEach(point => {
        expect(point.actual).toBeDefined();
        if (point.actual) {
          const delta = +(point.actual - slaCeiling).toFixed(1);
          if (point.actual > slaCeiling) {
            expect(delta).toBeGreaterThan(0);
          } else {
            expect(delta).toBeLessThanOrEqual(0);
          }
        }
      });
    });

    it('flags anomaly markers when observed turnaround exceeds expected limit', () => {
      const anomalyPoints = sampleHistoricalPoints.filter(p => p.anomaly);
      expect(anomalyPoints.length).toBe(2);

      anomalyPoints.forEach(p => {
        const anom = p.anomaly!;
        expect(anom.value).toBeGreaterThan(anom.expectedLimit);
        expect(['critical', 'high', 'medium', 'low']).toContain(anom.severity);
        expect(anom.airframe).toBeTruthy();
        expect(anom.rootCause).toBeTruthy();
        expect(anom.mitigation).toBeTruthy();
      });
    });

    it('computes CP-SAT scenario reduction formulas correctly', () => {
      const baseForecast = 16.2;
      const slaTargetReduction = 20; // 20% reduction target
      const incidentSurgeFactor = 1.0;
      const preventativeMaintBuffer = 100;

      const scenarioFactor = (1 - slaTargetReduction / 100) * (incidentSurgeFactor > 1.2 ? 1.07 : 0.98) * (100 / preventativeMaintBuffer);
      const projected = +(baseForecast * scenarioFactor).toFixed(1);

      expect(projected).toBeLessThan(baseForecast);
      expect(projected).toBe(12.7);
    });
  });
});
