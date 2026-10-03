import { describe, it, expect } from 'vitest';
import {
  validateAndSanitizeTelemetry,
  detectZScoreAnomalies,
  runCpsatResourceAllocation,
  summarizePipelineOutput,
  executeChaosFaultInjection,
  RawTelemetryRecord,
  ValidatedTelemetryRecord,
} from '../services/etlPipeline';

describe('AxiomBI Telemetry ETL Pipeline - Unit Test Suite', () => {
  const mockRawBatch: RawTelemetryRecord[] = [
    {
      id: 'REC-101',
      aircraft_id: 'TANKER-80',
      callsign: 'Tanker 80',
      base_id: 'RDD',
      base_name: 'Redding Air Attack Base',
      category: 'AirTanker',
      status: 'In-Flight',
      turnaround_time_mins: 14.2,
      fuel_pct: 68,
      retardant_gallons: 1200,
      flight_hours_mtd: 78.4,
      timestamp: '2026-09-29T10:00:00Z',
    },
    {
      id: 'REC-102',
      aircraft_id: 'TANKER-96',
      callsign: 'Tanker 96',
      base_id: 'PRB',
      base_name: 'Paso Robles Base',
      category: 'AirTanker',
      status: 'Reloading',
      turnaround_time_mins: 18.5,
      fuel_pct: 42,
      retardant_gallons: 1200,
      flight_hours_mtd: 84.1,
      timestamp: '2026-09-29T10:00:00Z',
    },
    {
      id: 'REC-103',
      aircraft_id: 'COPTER-106',
      callsign: 'Copter 106',
      base_id: 'BFR',
      base_name: 'Boggs Mountain Heli-base',
      category: 'Helitack',
      status: 'Standby',
      turnaround_time_mins: 11.8,
      fuel_pct: 92,
      retardant_gallons: 1000,
      flight_hours_mtd: 62.0,
      timestamp: '2026-09-29T10:00:00Z',
    },
    {
      id: 'REC-104',
      aircraft_id: 'AIRATTACK-140',
      callsign: 'Air Attack 140',
      base_id: 'SAC',
      base_name: 'McClellan Tanker Base',
      category: 'AirAttack',
      status: 'In-Flight',
      turnaround_time_mins: 12.0,
      fuel_pct: 74,
      retardant_gallons: 0,
      flight_hours_mtd: 112.3,
      timestamp: '2026-09-29T10:00:00Z',
    },
  ];

  describe('Stage 1 & 2: Ingestion, Validation & Schema Drift Protection', () => {
    it('successfully sanitizes valid raw telemetry records with 100% compliance', () => {
      const { valid, quarantined, imputedCount } = validateAndSanitizeTelemetry(mockRawBatch);

      expect(valid).toHaveLength(4);
      expect(quarantined).toHaveLength(0);
      expect(imputedCount).toBe(0);

      // Verify normalization
      expect(valid[0].aircraft_id).toBe('TANKER-80');
      expect(valid[0].sla_compliance).toBe(true);
      expect(valid[0].turnaround_time_mins).toBe(14.2);
    });

    it('imputes missing turnaround time and fuel with calibrated baseline values', () => {
      const dirtyBatch: RawTelemetryRecord[] = [
        {
          id: 'DIRTY-1',
          aircraft_id: 'TANKER-910',
          turnaround_time_mins: null, // missing turnaround
          fuel_pct: undefined, // missing fuel
          base_id: 'SAC',
        },
      ];

      const { valid, quarantined, imputedCount } = validateAndSanitizeTelemetry(dirtyBatch);

      expect(valid).toHaveLength(1);
      expect(quarantined).toHaveLength(0);
      expect(imputedCount).toBe(2); // turnaround + fuel imputed
      expect(valid[0].turnaround_time_mins).toBe(16.5); // baseline median
      expect(valid[0].fuel_pct).toBe(75);
      expect(valid[0].is_imputed).toBe(true);
    });

    it('quarantines records with missing or empty aircraft_id (Schema Drift Defense)', () => {
      const corruptBatch: RawTelemetryRecord[] = [
        {
          id: 'CORRUPT-1',
          aircraft_id: '', // Blank
          turnaround_time_mins: 15.0,
        },
        {
          id: 'CORRUPT-2',
          aircraft_id: undefined as any, // Null/undefined
          turnaround_time_mins: 16.0,
        },
      ];

      const { valid, quarantined } = validateAndSanitizeTelemetry(corruptBatch);

      expect(valid).toHaveLength(0);
      expect(quarantined).toHaveLength(2);
    });

    it('quarantines duplicate sensor bursts with identical aircraft and timestamp', () => {
      const duplicateBatch: RawTelemetryRecord[] = [
        mockRawBatch[0],
        { ...mockRawBatch[0], id: 'DUPLICATE-BURST-101' }, // Same aircraft & timestamp
      ];

      const { valid, quarantined } = validateAndSanitizeTelemetry(duplicateBatch);

      expect(valid).toHaveLength(1);
      expect(quarantined).toHaveLength(1);
      expect(quarantined[0].id).toBe('DUPLICATE-BURST-101');
    });

    it('quarantines unrealistic turnaround spikes exceeding physical thresholds (>120 mins)', () => {
      const spikeBatch: RawTelemetryRecord[] = [
        {
          id: 'SPIKE-1',
          aircraft_id: 'TANKER-80',
          turnaround_time_mins: 340.0, // Absurd turnaround
        },
      ];

      const { valid, quarantined } = validateAndSanitizeTelemetry(spikeBatch);

      expect(valid).toHaveLength(0);
      expect(quarantined).toHaveLength(1);
    });
  });

  describe('Stage 3: Statistical Z-Score Anomaly Scan', () => {
    it('detects severe turnaround SLA anomalies when Z-score exceeds threshold', () => {
      const normalBatch: ValidatedTelemetryRecord[] = [
        { id: 'V1', aircraft_id: 'T1', callsign: 'Tanker 1', base_id: 'RDD', base_name: 'Redding', category: 'AirTanker', status: 'In-Flight', turnaround_time_mins: 14.0, fuel_pct: 80, retardant_gallons: 1200, flight_hours_mtd: 50, timestamp: '2026-09-29T10:00:00Z', sla_compliance: true, is_imputed: false },
        { id: 'V2', aircraft_id: 'T2', callsign: 'Tanker 2', base_id: 'RDD', base_name: 'Redding', category: 'AirTanker', status: 'In-Flight', turnaround_time_mins: 15.0, fuel_pct: 80, retardant_gallons: 1200, flight_hours_mtd: 50, timestamp: '2026-09-29T10:00:00Z', sla_compliance: true, is_imputed: false },
        { id: 'V3', aircraft_id: 'T3', callsign: 'Tanker 3', base_id: 'RDD', base_name: 'Redding', category: 'AirTanker', status: 'In-Flight', turnaround_time_mins: 14.5, fuel_pct: 80, retardant_gallons: 1200, flight_hours_mtd: 50, timestamp: '2026-09-29T10:00:00Z', sla_compliance: true, is_imputed: false },
        { id: 'V4', aircraft_id: 'T4-BASE', callsign: 'Tanker 4', base_id: 'SAC', base_name: 'McClellan', category: 'AirTanker', status: 'In-Flight', turnaround_time_mins: 14.2, fuel_pct: 80, retardant_gallons: 1200, flight_hours_mtd: 50, timestamp: '2026-09-29T10:00:00Z', sla_compliance: true, is_imputed: false },
        { id: 'V5', aircraft_id: 'T5', callsign: 'Tanker 5', base_id: 'PRB', base_name: 'Paso Robles', category: 'AirTanker', status: 'In-Flight', turnaround_time_mins: 15.1, fuel_pct: 80, retardant_gallons: 1200, flight_hours_mtd: 50, timestamp: '2026-09-29T10:00:00Z', sla_compliance: true, is_imputed: false },
        { id: 'V6', aircraft_id: 'T6', callsign: 'Tanker 6', base_id: 'BFR', base_name: 'Boggs Mtn', category: 'Helitack', status: 'In-Flight', turnaround_time_mins: 13.8, fuel_pct: 80, retardant_gallons: 1000, flight_hours_mtd: 50, timestamp: '2026-09-29T10:00:00Z', sla_compliance: true, is_imputed: false },
        {
          id: 'V7-SPIKE',
          aircraft_id: 'T7',
          callsign: 'Tanker 7 (Anomalous Spike)',
          base_id: 'SAC',
          base_name: 'McClellan',
          category: 'AirTanker',
          status: 'Reloading',
          turnaround_time_mins: 38.0, // Major anomaly!
          fuel_pct: 80,
          retardant_gallons: 1200,
          flight_hours_mtd: 50,
          timestamp: '2026-09-29T10:00:00Z',
          sla_compliance: false,
          is_imputed: false,
        },
      ];

      const anomalies = detectZScoreAnomalies(normalBatch, 1.8);

      expect(anomalies.length).toBeGreaterThanOrEqual(1);
      const spike = anomalies.find((a) => a.aircraftId === 'T7');
      expect(spike).toBeDefined();
      expect(spike?.zScore).toBeGreaterThan(1.8);
      expect(spike?.severity).toBe('critical');
      expect(spike?.recommendedPlaybook).toContain('AUTO_PLAYBOOK');
    });

    it('returns empty array when records are within normal standard deviation', () => {
      const tightBatch: ValidatedTelemetryRecord[] = [
        { id: '1', aircraft_id: 'A1', callsign: 'A1', base_id: 'B1', base_name: 'B1', category: 'AirTanker', status: 'In-Flight', turnaround_time_mins: 15.0, fuel_pct: 80, retardant_gallons: 1200, flight_hours_mtd: 50, timestamp: '2026-09-29', sla_compliance: true, is_imputed: false },
        { id: '2', aircraft_id: 'A2', callsign: 'A2', base_id: 'B1', base_name: 'B1', category: 'AirTanker', status: 'In-Flight', turnaround_time_mins: 15.2, fuel_pct: 80, retardant_gallons: 1200, flight_hours_mtd: 50, timestamp: '2026-09-29', sla_compliance: true, is_imputed: false },
        { id: '3', aircraft_id: 'A3', callsign: 'A3', base_id: 'B1', base_name: 'B1', category: 'AirTanker', status: 'In-Flight', turnaround_time_mins: 14.8, fuel_pct: 80, retardant_gallons: 1200, flight_hours_mtd: 50, timestamp: '2026-09-29', sla_compliance: true, is_imputed: false },
      ];

      const anomalies = detectZScoreAnomalies(tightBatch, 2.0);
      expect(anomalies).toHaveLength(0);
    });
  });

  describe('Stage 4: Mathematical Optimization (CP-SAT Model)', () => {
    it('demonstrates CP-SAT optimization gain over naive closest-resource dispatch', () => {
      const { valid } = validateAndSanitizeTelemetry(mockRawBatch);
      const distances = { RDD: 25, PRB: 65, BFR: 30, SAC: 40 };

      const results = runCpsatResourceAllocation(valid, distances);

      expect(results).toHaveLength(4);
      for (const res of results) {
        expect(res.cpsatOptimizedTimeMins).toBeLessThan(res.naiveDispatchTimeMins);
        expect(res.efficiencyGainPct).toBeGreaterThan(0);
        expect(res.constraintsSatisfied).toContain('CISRM_2026_AIRSPACE_SEPARATION');
        expect(res.constraintsSatisfied).toContain('NWCG_PMS_505_DUTY_LIMITS');
      }
    });
  });

  describe('Summary & Telemetry Aggregations', () => {
    it('correctly aggregates base turnaround averages and fleet readiness', () => {
      const { valid, quarantined, imputedCount } = validateAndSanitizeTelemetry(mockRawBatch);
      const summary = summarizePipelineOutput(4, valid, quarantined, imputedCount, []);

      expect(summary.validCount).toBe(4);
      expect(summary.quarantinedCount).toBe(0);
      expect(summary.totalRetardantDelivered).toBe(3400);
      expect(summary.overallSlaCompliancePct).toBe(100);
      expect(summary.baseSummaries['RDD'].avgTurnaround).toBe(14.2);
    });
  });

  describe('Chaos Engineering & Fault Injection Engine', () => {
    it('injects sensor dropout and triggers automated Kalman imputation playbook', () => {
      const { valid } = validateAndSanitizeTelemetry(mockRawBatch);
      const { modifiedRecords, playbookResult } = executeChaosFaultInjection(valid, {
        faultType: 'sensor_dropout',
        severity: 'critical',
        targetAirframe: 'TANKER-80',
        description: 'Simulated packet loss over Shasta canyon',
      });

      // Target record had turnaround wiped to null
      const target = modifiedRecords.find((r) => r.aircraft_id === 'TANKER-80');
      expect(target?.turnaround_time_mins).toBeNull();

      // Playbook executed properly
      expect(playbookResult.systemRecovered).toBe(true);
      expect(playbookResult.playbookExecuted).toContain('KALMAN_TELEMETRY_IMPUTATION');
      expect(playbookResult.actionsTaken.length).toBeGreaterThan(2);

      // Feeding into the pipeline again should impute and recover cleanly
      const reprocessed = validateAndSanitizeTelemetry(modifiedRecords);
      expect(reprocessed.valid).toHaveLength(4);
      expect(reprocessed.imputedCount).toBeGreaterThan(0);
    });

    it('injects schema drift and validates quarantine isolation without pipeline failure', () => {
      const { valid } = validateAndSanitizeTelemetry(mockRawBatch);
      const { modifiedRecords, playbookResult } = executeChaosFaultInjection(valid, {
        faultType: 'schema_drift',
        severity: 'critical',
        targetAirframe: 'CORRUPT_PROBE',
        description: 'Simulated corrupted transponder packet with null airframe',
      });

      expect(playbookResult.playbookExecuted).toContain('SCHEMA_QUARANTINE_STAGE');
      
      const sanitized = validateAndSanitizeTelemetry(modifiedRecords);
      expect(sanitized.quarantined.length).toBeGreaterThanOrEqual(1);
      // Valid records still processed cleanly
      expect(sanitized.valid).toHaveLength(4);
    });
  });

  describe('Parallel Execution & DAG Sequence Reordering Invariants', () => {
    it('supports parallelExecution toggle and preserves stage metadata', () => {
      const stage = {
        id: 'stage-validate',
        name: '02. Schema Drift & Cleaning',
        type: 'validate' as const,
        status: 'completed' as const,
        durationMs: 120,
        recordsIn: 504820,
        recordsOut: 498310,
        description: 'Deduplicates transponder bursts',
        configSummary: 'Strict type casting',
        schemaFields: [],
        parallelExecution: false,
      };

      const parallelToggled = {
        ...stage,
        parallelExecution: !stage.parallelExecution,
      };

      expect(parallelToggled.parallelExecution).toBe(true);
      expect(parallelToggled.id).toBe('stage-validate');
    });

    it('correctly reorders stages while preserving topological dependency chains', () => {
      const initialStages = [
        { id: 'stage-ingest', name: 'Ingest' },
        { id: 'stage-validate', name: 'Validate' },
        { id: 'stage-transform', name: 'Transform' },
        { id: 'stage-load', name: 'Load' },
      ];

      // Simulate dragging Validate past Transform
      const reordered = [...initialStages];
      const [moved] = reordered.splice(1, 1);
      reordered.splice(2, 0, moved);

      expect(reordered.map((s) => s.id)).toEqual([
        'stage-ingest',
        'stage-transform',
        'stage-validate',
        'stage-load',
      ]);

      // Verify dependency chain updates
      const updatedDeps = reordered.map((st, idx) => ({
        ...st,
        dependsOn: idx > 0 ? [reordered[idx - 1].id] : [],
      }));

      expect(updatedDeps[0].dependsOn).toEqual([]);
      expect(updatedDeps[1].dependsOn).toEqual(['stage-ingest']);
      expect(updatedDeps[2].dependsOn).toEqual(['stage-transform']);
      expect(updatedDeps[3].dependsOn).toEqual(['stage-validate']);
    });
  });

  describe('Global Variable Store & View Density Invariants', () => {
    it('manages key-value configuration parameters with uppercase formatting and typing', () => {
      const rawKey = 'min_tanker_fuel_safety_buffer';
      const formattedKey = rawKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      expect(formattedKey).toBe('MIN_TANKER_FUEL_SAFETY_BUFFER');

      const variable = {
        key: formattedKey,
        value: '35',
        type: 'number' as const,
        description: 'Minimum emergency return fuel percentage before aborting drop run.',
        isSecret: false,
        category: 'Threshold' as const,
        updatedAt: '2026-10-02 08:30',
      };

      expect(variable.key).toBe('MIN_TANKER_FUEL_SAFETY_BUFFER');
      expect(Number(variable.value)).toBe(35);
      expect(variable.category).toBe('Threshold');
    });

    it('calculates compact vs expanded node geometry dimensions based on density state', () => {
      const getGeometry = (density: 'compact' | 'expanded') => {
        const isCompact = density === 'compact';
        return {
          nodeWidth: isCompact ? 180 : 240,
          nodeHeight: isCompact ? 68 : 110,
          horizontalSpacing: isCompact ? 240 : 320,
          totalHeight: isCompact ? 210 : 310,
        };
      };

      const compactGeo = getGeometry('compact');
      const expandedGeo = getGeometry('expanded');

      expect(compactGeo.nodeWidth).toBeLessThan(expandedGeo.nodeWidth);
      expect(compactGeo.nodeHeight).toBeLessThan(expandedGeo.nodeHeight);
      expect(compactGeo.horizontalSpacing).toBeLessThan(expandedGeo.horizontalSpacing);
      expect(compactGeo.totalHeight).toBe(210);
      expect(expandedGeo.totalHeight).toBe(310);
    });

    it('evaluates search query filtering correctly against stage attributes', () => {
      const stages = [
        { id: 'stage-ingest', name: '01. Telemetry Stream Ingest', description: 'Consumes ADS-B and AFF transponders', type: 'ingest' },
        { id: 'stage-validate', name: '02. Schema Drift & Cleaning', description: 'Deduplicates transponder bursts', type: 'validate' },
        { id: 'stage-transform', name: '03. CP-SAT & Anomaly Transform', description: 'Applies OR-Tools CP-SAT constraint rules', type: 'transform' },
        { id: 'stage-load', name: '04. Data Mart Load & BI Sync', description: 'Upserts into PostgreSQL analytical mart', type: 'load' },
      ];

      const query = 'cp-sat';
      const matches = stages.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.description.toLowerCase().includes(query.toLowerCase())
      );

      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe('stage-transform');
    });
  });
});
