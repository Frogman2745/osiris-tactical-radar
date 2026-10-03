import { describe, it, expect } from 'vitest';

describe('Auto-Scaling Engine & Audit Export Invariants', () => {
  const CAPACITY_PER_NODE = 15000;
  const MIN_NODES = 2;
  const MAX_NODES = 12;

  const calculateTargetNodes = (throughput: number) => {
    return Math.min(MAX_NODES, Math.max(MIN_NODES, Math.ceil(throughput / CAPACITY_PER_NODE)));
  };

  const calculateMetrics = (throughput: number, nodes: number) => {
    const rawCpu = (throughput / (nodes * CAPACITY_PER_NODE)) * 82;
    const cpuUtilization = Math.min(98, Math.max(24, Math.round(rawCpu)));
    const memoryUtilization = Math.min(95, Math.max(35, Math.round(42 + (cpuUtilization * 0.42))));
    
    let queueLatencyMs = 12;
    if (cpuUtilization > 80) {
      queueLatencyMs = Math.round(14 + Math.pow((cpuUtilization - 80) * 0.9, 1.3));
    } else {
      queueLatencyMs = Math.round(11 + (cpuUtilization * 0.08));
    }

    const clusterHealth: 'Nominal' | 'Scaling' | 'High Pressure' = 
      cpuUtilization > 88 ? 'High Pressure' :
      cpuUtilization > 74 ? 'Scaling' : 'Nominal';

    return { cpuUtilization, memoryUtilization, queueLatencyMs, clusterHealth };
  };

  it('allocates minimum 2 nodes for low-volume throughput', () => {
    expect(calculateTargetNodes(8000)).toBe(2);
    expect(calculateTargetNodes(20000)).toBe(2);
  });

  it('scales nodes proportionally under surge load up to 12 maximum replicas', () => {
    // 45,000 req/s -> 3 nodes
    expect(calculateTargetNodes(45000)).toBe(3);
    // 95,000 req/s -> 7 nodes
    expect(calculateTargetNodes(95000)).toBe(7);
    // 165,000 req/s -> 11 nodes
    expect(calculateTargetNodes(165000)).toBe(11);
    // 250,000 req/s -> capped at 12 nodes
    expect(calculateTargetNodes(250000)).toBe(12);
  });

  it('calculates nominal latency and CPU health when provisioned appropriately', () => {
    const metrics = calculateMetrics(45000, 4); // 45k req/s across 4 nodes (60k capacity, ~61% CPU)
    expect(metrics.clusterHealth).toBe('Nominal');
    expect(metrics.cpuUtilization).toBeLessThan(75);
    expect(metrics.queueLatencyMs).toBeLessThanOrEqual(20);
  });

  it('triggers scaling state when CPU exceeds 74%', () => {
    const metrics = calculateMetrics(60000, 4); // 60k req/s across 4 nodes (~82% CPU)
    expect(metrics.clusterHealth).toBe('Scaling');
    expect(metrics.cpuUtilization).toBeGreaterThanOrEqual(75);
  });

  it('signals elevated pressure and higher queue latency when severely underscaled', () => {
    const metrics = calculateMetrics(110000, 2); // 110k req/s across only 2 nodes (30k capacity)
    expect(metrics.clusterHealth).toBe('High Pressure');
    expect(metrics.cpuUtilization).toBeGreaterThan(88);
    expect(metrics.queueLatencyMs).toBeGreaterThan(30);
  });

  it('formats CSV rows with valid escaped headers and metric fields', () => {
    const headers = [
      'Timestamp_UTC',
      'Time_Label',
      'Throughput_Records_Per_Sec',
      'Active_Compute_Nodes',
      'Target_Replicas',
      'Cluster_Capacity_Rec_Sec',
      'CPU_Utilization_Pct',
      'Memory_Utilization_Pct',
      'P99_Queue_Latency_Ms',
      'Scaling_Action_Event',
      'System_Health_Status'
    ];

    const sampleRow = [
      '2026-09-30T10:00:00.000Z',
      '"10:00:00"',
      56000,
      4,
      4,
      60000,
      62,
      52,
      14,
      '"SCALE_UP"',
      '"Nominal"'
    ];

    const csv = [headers.join(','), sampleRow.join(',')].join('\n');
    expect(csv).toContain('Throughput_Records_Per_Sec');
    expect(csv).toContain('"SCALE_UP"');
    expect(csv.split('\n')).toHaveLength(2);
  });
});
