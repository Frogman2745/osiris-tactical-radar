export type AuditLogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'FATAL';

export type AuditLogCategory = 
  | 'ETL_PIPELINE' 
  | 'DATABASE_SQL' 
  | 'WEBSOCKET_PRESENCE' 
  | 'API_INTEGRATION' 
  | 'SECURITY_AUTH' 
  | 'PREDICTIVE_MODEL'
  | 'SYSTEM_RUNTIME';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  level: AuditLogLevel;
  category: AuditLogCategory;
  service: string;
  message: string;
  statusCode?: number;
  durationMs?: number;
  traceId: string;
  clientIp?: string;
  user?: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
  resolutionHint?: string;
  mitigated?: boolean;
}

export interface SystemAuditSummary {
  totalEvents: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  fatalCount: number;
  uptimeSeconds: number;
  memoryUsageMb: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  eventLoopLagMs: number;
  activeSockets: number;
  dbPoolHealth: {
    total: number;
    idle: number;
    active: number;
    waiting: number;
  };
  p95ResponseMs: number;
}
