export interface ModuleResourceMetric {
  id: string;
  name: string;
  category: 'Ingestion & ETL' | 'Analytics & SQL' | 'Predictive AI' | 'Real-time WebSockets' | 'Reporting Engine' | 'Resilience & Sandbox';
  cpuUtilizationPct: number;
  memoryUtilizationPct: number;
  iopsRate: number;
  networkThroughputMbps: number;
  activeThreads: number;
  status: 'nominal' | 'elevated' | 'critical';
  heatScore: number; // 0 - 100 aggregate density score
  recentAnomalies: number;
  subservices: {
    name: string;
    loadPct: number;
    latencyMs: number;
    throughputRps: number;
  }[];
  peakHourLoad: number[]; // 24-hour load trend
}

export interface ResourceHeatmapDensityGrid {
  modules: ModuleResourceMetric[];
  overallDensityPct: number;
  maxHeatModule: string;
  clusterHealth: 'optimal' | 'warning' | 'throttling';
  timestamp: string;
}
