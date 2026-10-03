export type EndpointCategory = 'internal' | 'external' | 'database' | 'ai';
export type HealthStatus = 'nominal' | 'warning' | 'degraded';

export interface LatencyDataPoint {
  timestamp: string;
  latencyMs: number;
  statusCode: number;
}

export interface TimingBreakdown {
  dnsLookupMs: number;
  tcpConnectMs: number;
  tlsHandshakeMs: number;
  timeToFirstByteMs: number;
  contentDownloadMs: number;
}

export interface MonitoredEndpoint {
  id: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'WS';
  category: EndpointCategory;
  categoryLabel: string;
  currentLatencyMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  uptimePct: number;
  errorRatePct: number;
  throughputRps: number;
  status: HealthStatus;
  slaTargetMs: number;
  warningThresholdMs: number;
  criticalThresholdMs: number;
  description: string;
  history: LatencyDataPoint[];
  timingBreakdown: TimingBreakdown;
  recentAlerts: {
    id: string;
    timestamp: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    resolved: boolean;
  }[];
  samplePayload?: {
    request?: Record<string, any>;
    response?: Record<string, any>;
  };
}

export interface LatencyOverviewMetrics {
  averageLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  overallUptimePct: number;
  endpointsMonitored: number;
  healthyCount: number;
  warningCount: number;
  degradedCount: number;
  totalRequests24h: number;
  lastUpdated: string;
}
