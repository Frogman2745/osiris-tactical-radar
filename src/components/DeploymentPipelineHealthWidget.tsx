import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  GitCommit,
  GitBranch,
  Clock,
  Server,
  CloudCheck,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Terminal,
  Activity,
  Layers,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Play
} from 'lucide-react';

export interface DeploymentBuildRecord {
  id: string;
  buildNumber: number;
  commitHash: string;
  commitMsg: string;
  branch: string;
  author: string;
  status: 'success' | 'failure' | 'in_progress';
  durationSeconds: number;
  timestamp: string;
  environment: 'production' | 'staging' | 'preview';
  testPassRate: number; // e.g. 100%
  deployLatencySec: number;
}

export interface DeploymentEnvironmentStatus {
  name: 'production' | 'staging' | 'preview';
  displayName: string;
  version: string;
  health: 'healthy' | 'degraded' | 'deploying';
  uptimePct: number;
  activePods: number;
  p95LatencyMs: number;
  lastDeployedAt: string;
  cloudRegion: string;
  releaseCommit: string;
}

// Recent chronological builds for sparkline visualization (oldest to newest)
export const MOCK_BUILD_RECORDS: DeploymentBuildRecord[] = [
  {
    id: 'build-101',
    buildNumber: 101,
    commitHash: '8f2a1b9',
    commitMsg: 'feat: add CP-SAT solver constraint weights for Helitack',
    branch: 'main',
    author: 'Nicholas Marnocha',
    status: 'success',
    durationSeconds: 42,
    timestamp: '2h ago',
    environment: 'production',
    testPassRate: 100,
    deployLatencySec: 42,
  },
  {
    id: 'build-102',
    buildNumber: 102,
    commitHash: '3c7d91e',
    commitMsg: 'fix: dead-letter quarantine for corrupt ADS-B burst packets',
    branch: 'main',
    author: 'Nicholas Marnocha',
    status: 'success',
    durationSeconds: 38,
    timestamp: '4h ago',
    environment: 'production',
    testPassRate: 100,
    deployLatencySec: 38,
  },
  {
    id: 'build-103',
    buildNumber: 103,
    commitHash: '9e41b2c',
    commitMsg: 'test: add synthetic fault injection assertions for airbase timeouts',
    branch: 'feature/chaos',
    author: 'Nicholas Marnocha',
    status: 'failure',
    durationSeconds: 29,
    timestamp: '7h ago',
    environment: 'staging',
    testPassRate: 88,
    deployLatencySec: 29,
  },
  {
    id: 'build-104',
    buildNumber: 104,
    commitHash: '7a18d4f',
    commitMsg: 'fix: resolve timeout race in Vitest autoscaling mock harness',
    branch: 'feature/chaos',
    author: 'Nicholas Marnocha',
    status: 'success',
    durationSeconds: 44,
    timestamp: '6h ago',
    environment: 'staging',
    testPassRate: 100,
    deployLatencySec: 44,
  },
  {
    id: 'build-105',
    buildNumber: 105,
    commitHash: '5b83f01',
    commitMsg: 'perf: Polars zero-copy buffer streaming for telemetry ingestion',
    branch: 'main',
    author: 'Nicholas Marnocha',
    status: 'success',
    durationSeconds: 36,
    timestamp: '12h ago',
    environment: 'production',
    testPassRate: 100,
    deployLatencySec: 36,
  },
  {
    id: 'build-106',
    buildNumber: 106,
    commitHash: '2d44e89',
    commitMsg: 'chore: update PostgreSQL connection pool idle timeout',
    branch: 'main',
    author: 'Nicholas Marnocha',
    status: 'success',
    durationSeconds: 34,
    timestamp: '18h ago',
    environment: 'production',
    testPassRate: 100,
    deployLatencySec: 34,
  },
  {
    id: 'build-107',
    buildNumber: 107,
    commitHash: '1a95c32',
    commitMsg: 'feat: tactical PDF export generator with military HUD styling',
    branch: 'main',
    author: 'Nicholas Marnocha',
    status: 'success',
    durationSeconds: 46,
    timestamp: '1d ago',
    environment: 'production',
    testPassRate: 100,
    deployLatencySec: 46,
  },
  {
    id: 'build-108',
    buildNumber: 108,
    commitHash: '6f02a44',
    commitMsg: 'ci: configure automated lint and Vitest gate on pull request',
    branch: 'main',
    author: 'Nicholas Marnocha',
    status: 'success',
    durationSeconds: 40,
    timestamp: '1d ago',
    environment: 'production',
    testPassRate: 100,
    deployLatencySec: 40,
  },
  {
    id: 'build-109',
    buildNumber: 109,
    commitHash: '4e7b89d',
    commitMsg: 'feat: add drag-and-drop pipeline stage prioritizer',
    branch: 'main',
    author: 'Nicholas Marnocha',
    status: 'success',
    durationSeconds: 41,
    timestamp: '10m ago',
    environment: 'production',
    testPassRate: 100,
    deployLatencySec: 41,
  },
  {
    id: 'build-110',
    buildNumber: 110,
    commitHash: '0c32f81',
    commitMsg: 'feat: resource capacity forecasting with ARIMA forward projections',
    branch: 'main',
    author: 'Nicholas Marnocha',
    status: 'success',
    durationSeconds: 39,
    timestamp: 'Just now',
    environment: 'production',
    testPassRate: 100,
    deployLatencySec: 39,
  },
];

export const ENVIRONMENTS_DATA: DeploymentEnvironmentStatus[] = [
  {
    name: 'production',
    displayName: 'Production (GCP Cloud Run)',
    version: 'v2.4.2-cadf',
    health: 'healthy',
    uptimePct: 99.98,
    activePods: 4,
    p95LatencyMs: 18,
    lastDeployedAt: '10 mins ago',
    cloudRegion: 'us-east1 (Monitored)',
    releaseCommit: '0c32f81',
  },
  {
    name: 'staging',
    displayName: 'Staging Integration Cluster',
    version: 'v2.5.0-rc1',
    health: 'healthy',
    uptimePct: 99.91,
    activePods: 2,
    p95LatencyMs: 22,
    lastDeployedAt: '1 hour ago',
    cloudRegion: 'us-central1',
    releaseCommit: '7a18d4f',
  },
  {
    name: 'preview',
    displayName: 'PR Ephemeral Previews',
    version: 'v2.5.0-feat-forecast',
    health: 'healthy',
    uptimePct: 100.0,
    activePods: 1,
    p95LatencyMs: 25,
    lastDeployedAt: '25 mins ago',
    cloudRegion: 'us-east1',
    releaseCommit: '4e7b89d',
  },
];

interface DeploymentPipelineHealthWidgetProps {
  onTriggerDryRunBuild?: () => void;
}

export const DeploymentPipelineHealthWidget: React.FC<DeploymentPipelineHealthWidgetProps> = ({
  onTriggerDryRunBuild,
}) => {
  const [selectedBuild, setSelectedBuild] = useState<DeploymentBuildRecord>(MOCK_BUILD_RECORDS[MOCK_BUILD_RECORDS.length - 1]);
  const [filterEnv, setFilterEnv] = useState<'all' | 'production' | 'staging'>('all');
  const [isSimulatingBuild, setIsSimulatingBuild] = useState<boolean>(false);

  const filteredBuilds = filterEnv === 'all' 
    ? MOCK_BUILD_RECORDS 
    : MOCK_BUILD_RECORDS.filter(b => b.environment === filterEnv);

  const totalBuilds = filteredBuilds.length;
  const successfulBuilds = filteredBuilds.filter((b) => b.status === 'success').length;
  const successRate = Math.round((successfulBuilds / totalBuilds) * 100);
  const avgDurationSec = Math.round(
    filteredBuilds.reduce((sum, b) => sum + b.durationSeconds, 0) / totalBuilds
  );

  // SVG Sparkline Geometry Generation
  const svgWidth = 280;
  const svgHeight = 44;
  const paddingX = 10;
  const paddingY = 8;

  const minDuration = Math.min(...filteredBuilds.map((b) => b.durationSeconds));
  const maxDuration = Math.max(...filteredBuilds.map((b) => b.durationSeconds));
  const durationSpan = maxDuration - minDuration || 1;

  // Calculate coordinates for sparkline points
  const points = filteredBuilds.map((b, idx) => {
    const x = paddingX + (idx / (filteredBuilds.length - 1)) * (svgWidth - paddingX * 2);
    // Invert Y so shorter duration is higher (better)
    const normalizedY = (b.durationSeconds - minDuration) / durationSpan;
    const y = svgHeight - paddingY - (1 - normalizedY) * (svgHeight - paddingY * 2);
    return { x, y, build: b };
  });

  const pathD = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`
    : '';

  const handleSimulateBuild = () => {
    setIsSimulatingBuild(true);
    setTimeout(() => {
      setIsSimulatingBuild(false);
      onTriggerDryRunBuild?.();
    }, 1200);
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 font-mono text-slate-200 shadow-xl space-y-5">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                Continuous Delivery & Deployment Pipeline Health
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold">
                {successRate}% 30-DAY SUCCESS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Automated Cloud Run builds, Docker container artifact attestations, and zero-downtime rolling canary stages.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
            {(['all', 'production', 'staging'] as const).map((env) => (
              <button
                key={env}
                onClick={() => setFilterEnv(env)}
                className={`px-2 py-0.5 rounded uppercase font-bold transition-all cursor-pointer ${
                  filterEnv === env
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {env}
              </button>
            ))}
          </div>

          <button
            onClick={handleSimulateBuild}
            disabled={isSimulatingBuild}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            title="Execute CI/CD build dry-run validation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingBuild ? 'animate-spin' : ''}`} />
            <span>{isSimulatingBuild ? 'Validating...' : 'Trigger Dry-Run'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards & Sparkline Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Metric Summary Left Cards */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Deployment Success</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-emerald-400 font-mono">{successRate}%</span>
              <span className="text-[10px] text-slate-400">({successfulBuilds}/{totalBuilds})</span>
            </div>
            <span className="text-[10px] text-slate-500 font-sans block mt-1">1 failure isolated in staging</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Average Build Time</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-cyan-300 font-mono">{avgDurationSec}s</span>
              <span className="text-[10px] text-slate-400 font-mono">P95: 46s</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-sans block mt-1">Vite + esbuild caching</span>
          </div>
        </div>

        {/* Center: Sparkline Chart of Build Durations & Pass/Fail Status */}
        <div className="lg:col-span-8 p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Recent Build Latency Velocity (Sparkline)</span>
            </span>
            <span className="text-slate-500 text-[10px]">
              Min: {minDuration}s · Max: {maxDuration}s · Click points to inspect build logs
            </span>
          </div>

          {/* Interactive SVG Sparkline */}
          <div className="relative w-full h-14 flex items-center justify-center">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="buildSparklineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              {/* Shaded Area Under Curve */}
              <path d={areaD} fill="url(#buildSparklineGradient)" />

              {/* Connecting Sparkline Stroke */}
              <path
                d={pathD}
                fill="none"
                stroke="#06b6d4"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Individual Interactive Build Points */}
              {points.map((p) => {
                const isSelected = selectedBuild.id === p.build.id;
                const isSuccess = p.build.status === 'success';

                return (
                  <g key={p.build.id} className="cursor-pointer" onClick={() => setSelectedBuild(p.build)}>
                    {isSelected && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={7}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth={1.5}
                        className="animate-ping"
                      />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isSelected ? 4.5 : 3.2}
                      fill={isSuccess ? '#10b981' : '#ef4444'}
                      stroke="#0f172a"
                      strokeWidth={1.5}
                      className="transition-all hover:scale-150"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Sparkline Bottom Axis Ticker */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 font-mono">
            <span>Older Builds (1d ago)</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Success
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Failure
              </span>
            </div>
            <span>Latest Release (#110)</span>
          </div>
        </div>
      </div>

      {/* Target Environments & Live Status Matrix */}
      <div>
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Deployment Environments (Canary & Prod Pools)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ENVIRONMENTS_DATA.map((env) => (
            <div
              key={env.name}
              className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase">{env.displayName}</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-1.5 py-0.2 rounded">
                  {env.version}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2.5 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-500 block">Uptime SLA:</span>
                  <span className="text-emerald-400 font-bold">{env.uptimePct}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Active Replicas:</span>
                  <span className="text-white font-bold">{env.activePods} Pods</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">P95 Response:</span>
                  <span className="text-cyan-300 font-bold">{env.p95LatencyMs}ms</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Release Commit:</span>
                  <span className="text-slate-400 font-mono">{env.releaseCommit}</span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span>{env.cloudRegion}</span>
                <span className="text-slate-400">Deployed {env.lastDeployedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Build Drilldown Terminal Inspector */}
      {selectedBuild && (
        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-cyan-900/50 text-xs animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              {selectedBuild.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className="font-bold text-white">
                Build #{selectedBuild.buildNumber} ({selectedBuild.commitHash})
              </span>
              <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                selectedBuild.status === 'success' 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-red-950 text-red-300 border border-red-500/40'
              }`}>
                {selectedBuild.status}
              </span>
              <span className="text-slate-500 text-[11px]">Branch: {selectedBuild.branch}</span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
              <span>Author: <strong className="text-slate-300">{selectedBuild.author}</strong></span>
              <span>Duration: <strong className="text-cyan-300">{selectedBuild.durationSeconds}s</strong></span>
              <span>{selectedBuild.timestamp}</span>
            </div>
          </div>

          <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
            <p className="text-slate-300 font-sans">
              <span className="text-slate-500 font-mono">Commit: </span>
              "{selectedBuild.commitMsg}"
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-emerald-400 font-bold">100% Vitest Suite Passed</span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-400">Docker Image Digest Verified</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
