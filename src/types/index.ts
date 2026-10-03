export type NavigationTab = 
  | 'pipelines' 
  | 'predictive-bi' 
  | 'analytics-studio' 
  | 'reporting' 
  | 'career-hub';

export interface ConnectedUser {
  id: string;
  name: string;
  role: string;
  color: string;
  lastSeen?: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  category: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  type: 'ingest' | 'validate' | 'transform' | 'load';
  status: 'completed' | 'running' | 'pending' | 'idle';
  durationMs: number;
  recordsIn: number;
  recordsOut: number;
  description: string;
  configSummary: string;
  schemaFields: { field: string; type: string; nullPct: number }[];
  dependsOn?: string[];
  parallelExecution?: boolean;
}

export interface StageStickyNote {
  id: string;
  stageId: string;
  author: string;
  role: string;
  color: 'yellow' | 'cyan' | 'purple' | 'emerald' | 'amber';
  content: string;
  createdAt: string;
  category: 'Documentation' | 'SLA Rule' | 'Schema Constraint' | 'Incident Post-Mortem' | 'Optimization Tip';
  resolved?: boolean;
}

export interface StageComment {
  id: string;
  stageId: string;
  author: string;
  role: string;
  avatarColor: string;
  timestamp: string;
  content: string;
  tag?: 'Root Cause' | 'Mitigation' | 'Observation' | 'Action Item' | 'Hotfix';
  anomalyReference?: string;
  likes?: number;
}

export interface GlobalPipelineVariable {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  isSecret?: boolean;
  category: 'Environment' | 'Threshold' | 'Data Partition' | 'API Endpoint' | 'Tuning';
  updatedAt: string;
}

export interface PipelineRunStatus {
  state: 'idle' | 'running' | 'success' | 'failed';
  lastRunAt: string;
  durationMs: number;
  rowsProcessed: number;
  anomaliesFound: number;
  stages: { name: string; status: 'completed' | 'running' | 'pending'; durationMs: number }[];
}

export interface PredictivePoint {
  date: string;
  actual?: number;
  forecast?: number;
  lowerConfidence?: number;
  upperConfidence?: number;
  scenarioProjected?: number;
  dayOfWeek?: string;
  fullDate?: string;
  sortiesFlown?: number;
  activeAirframes?: string[];
  retardantDeliveredGal?: number;
  weatherSummary?: string;
  zScore?: number;
  statusLabel?: string;
  primaryBase?: string;
  baselineMargin?: string;
  anomaly?: {
    id: string;
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    airframe: string;
    base: string;
    metric: string;
    value: number;
    expectedLimit: number;
    rootCause: string;
    mitigation: string;
  };
}

export interface AnomalyRecord {
  id: string;
  timestamp: string;
  aircraftId: string;
  base: string;
  metric: string;
  value: number;
  expectedRange: string;
  severity: 'low' | 'medium' | 'high';
  rootCause: string;
  actionTaken: string;
}

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  targetTrack: 'Data Analyst' | 'AI Automation Engineer' | 'Operations Specialist' | 'Technical Solutions';
  status: 'Wishlist' | 'Applied' | 'Screening' | 'Technical' | 'Final' | 'Offer';
  appliedDate: string;
  lastActivity: string;
  resumeVersion: 'AI / Automation' | 'Product / Hardware' | 'Defense / Operations';
  location: string;
  compensation: string;
  matchScore: number;
  keySkillsMatched: string[];
  proofPointsLinked: string[];
  notes: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  subtitle: string;
  category: 'Operations Optimization' | 'Client Web Engineering' | 'Quantitative Decision Models' | 'Autonomous Systems';
  techStack: string[];
  metrics: { label: string; value: string; detail: string }[];
  problem: string;
  architecture: string;
  outcome: string;
  githubUrl: string;
  liveDemoUrl: string;
  caseStudyDoc: string;
}
