import React, { useState, useMemo } from 'react';
import {
  Trash2,
  HardDrive,
  Cpu,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Server,
  Zap,
  ShieldCheck,
  FileX,
  Layers,
  ArrowRight,
  Filter,
  Info
} from 'lucide-react';

export interface StaleArtifact {
  id: string;
  name: string;
  type: 'temp_parquet' | 'spill_buffer' | 'dangling_node' | 'orphan_wal' | 'dead_letter_dump';
  category: 'Storage' | 'Compute';
  pipelineRunId: string;
  createdAt: string;
  ageHours: number;
  sizeMb: number;
  estimatedCostHourUsd: number;
  status: 'flagged' | 'purged' | 'retained';
  reason: string;
  nodeIpOrPath: string;
}

export const INITIAL_STALE_ARTIFACTS: StaleArtifact[] = [
  {
    id: 'art-001',
    name: 'tmp_spill_telemetry_batch_482190.parquet',
    type: 'temp_parquet',
    category: 'Storage',
    pipelineRunId: 'RUN-2026-09-28-0914',
    createdAt: '18 hours ago',
    ageHours: 18.2,
    sizeMb: 1420, // 1.42 GB
    estimatedCostHourUsd: 0.03,
    status: 'flagged',
    reason: 'Unreferenced Polars scratch spill buffer from completed batch 482190.',
    nodeIpOrPath: '/var/data/scratch/tmp_spill_telemetry_batch_482190.parquet',
  },
  {
    id: 'art-002',
    name: 'worker-pod-telemetry-c7f8a (Dangling Replica)',
    type: 'dangling_node',
    category: 'Compute',
    pipelineRunId: 'RUN-2026-09-28-0410',
    createdAt: '22 hours ago',
    ageHours: 22.5,
    sizeMb: 0,
    estimatedCostHourUsd: 0.18,
    status: 'flagged',
    reason: 'Autoscaler scale-down stranded worker pod; zero active TCP sockets in >4 hours.',
    nodeIpOrPath: 'k8s-pod: 10.244.3.89 (us-east1-b)',
  },
  {
    id: 'art-003',
    name: 'orphan_cdc_wal_stream_segment_01A94.log',
    type: 'orphan_wal',
    category: 'Storage',
    pipelineRunId: 'RUN-2026-09-27-2100',
    createdAt: '34 hours ago',
    ageHours: 34.0,
    sizeMb: 890,
    estimatedCostHourUsd: 0.02,
    status: 'flagged',
    reason: 'Postgres WAL replication slot disconnected after consumer ACK.',
    nodeIpOrPath: '/var/lib/postgresql/wal_archive/01A94.log',
  },
  {
    id: 'art-004',
    name: 'dead_letter_quarantine_corrupt_bursts.jsonl',
    type: 'dead_letter_dump',
    category: 'Storage',
    pipelineRunId: 'RUN-2026-09-27-1420',
    createdAt: '42 hours ago',
    ageHours: 42.1,
    sizeMb: 340,
    estimatedCostHourUsd: 0.01,
    status: 'flagged',
    reason: 'Schema validation dead-letter dump parsed and archived to BigQuery.',
    nodeIpOrPath: '/tmp/quarantine/dead_letter_corrupt_bursts.jsonl',
  },
  {
    id: 'art-005',
    name: 'worker-pod-telemetry-99x2e (Zombie Executor)',
    type: 'dangling_node',
    category: 'Compute',
    pipelineRunId: 'RUN-2026-09-26-1800',
    createdAt: '64 hours ago',
    ageHours: 64.0,
    sizeMb: 0,
    estimatedCostHourUsd: 0.18,
    status: 'flagged',
    reason: 'Executor task terminated abnormally during chaos network fault test; node leak.',
    nodeIpOrPath: 'k8s-pod: 10.244.5.112 (us-east1-c)',
  },
];

interface AutomatedCleanupUtilityProps {
  onAddActivityLog?: (action: string) => void;
  isPipelineRunning?: boolean;
}

export const AutomatedCleanupUtility: React.FC<AutomatedCleanupUtilityProps> = ({
  onAddActivityLog,
  isPipelineRunning = false,
}) => {
  const [artifacts, setArtifacts] = useState<StaleArtifact[]>(() => {
    const saved = localStorage.getItem('pipeline_cleanup_artifacts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_STALE_ARTIFACTS;
  });

  const [filterType, setFilterType] = useState<'all' | 'Storage' | 'Compute'>('all');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [periodicCleanupEnabled, setPeriodicCleanupEnabled] = useState<boolean>(true);
  const [retentionTtlHours, setRetentionTtlHours] = useState<number>(12); // Purge items > 12h old

  const filteredArtifacts = useMemo(() => {
    if (filterType === 'all') return artifacts;
    return artifacts.filter((a) => a.category === filterType);
  }, [artifacts, filterType]);

  const flaggedItems = artifacts.filter((a) => a.status === 'flagged');
  const totalReclaimableMb = flaggedItems.reduce((acc, curr) => acc + curr.sizeMb, 0);
  const danglingNodesCount = flaggedItems.filter((a) => a.category === 'Compute').length;
  const estimatedHourlySavings = flaggedItems.reduce((acc, curr) => acc + curr.estimatedCostHourUsd, 0);

  // Scan & detect stale artifacts
  const handleScanForStale = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      onAddActivityLog?.('Ran automated garbage collection scan: identified 5 stale artifacts and 2 dangling compute pods');
    }, 800);
  };

  // Purge all flagged artifacts
  const handlePurgeAll = () => {
    setIsPurging(true);
    setTimeout(() => {
      setArtifacts((prev) =>
        prev.map((a) => (a.status === 'flagged' ? { ...a, status: 'purged' } : a))
      );
      setIsPurging(false);
      onAddActivityLog?.(
        `Purged ${flaggedItems.length} stale pipeline artifacts: reclaimed ${(totalReclaimableMb / 1024).toFixed(2)} GB disk space & terminated ${danglingNodesCount} dangling worker nodes`
      );
    }, 1000);
  };

  // Purge single artifact
  const handlePurgeSingle = (id: string) => {
    const target = artifacts.find((a) => a.id === id);
    if (!target) return;

    setArtifacts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'purged' } : a))
    );

    onAddActivityLog?.(
      `Cleaned artifact ${target.name} (${target.category === 'Compute' ? 'Terminated Node' : `${target.sizeMb} MB reclaimed`})`
    );
  };

  // Reset to demo state
  const handleReset = () => {
    setArtifacts(INITIAL_STALE_ARTIFACTS);
    onAddActivityLog?.('Reset automated cleanup ledger to baseline audit state');
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 font-mono text-slate-200 shadow-xl space-y-5">
      {/* Header and Auto-Cleanup Policy */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Trash2 className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                  AUTOMATED PIPELINE GARBAGE COLLECTION & COMPUTE CLEANUP
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 border border-amber-500/50 text-amber-300 font-bold">
                  {flaggedItems.length} ARTIFACTS FLAGGED
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Identifies unreferenced Polars temporary files, disk spill buffers, and orphaned compute pods from previous pipeline runs for scheduled or immediate reclamation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Periodic Cron Toggle */}
          <button
            onClick={() => setPeriodicCleanupEnabled(!periodicCleanupEnabled)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              periodicCleanupEnabled
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Enable hourly background cron to sweep and purge stale pipeline state"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{periodicCleanupEnabled ? 'CRON SWEEPER: ON (Hourly)' : 'CRON SWEEPER: OFF'}</span>
          </button>

          {/* Trigger Scan */}
          <button
            onClick={handleScanForStale}
            disabled={isScanning}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning Cluster...' : 'Scan Stale State'}</span>
          </button>

          {/* Purge All */}
          <button
            onClick={handlePurgeAll}
            disabled={isPurging || flaggedItems.length === 0}
            className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-slate-950 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isPurging ? 'Purging State...' : `Purge Flagged (${flaggedItems.length})`}</span>
          </button>
        </div>
      </div>

      {/* Reclaimable Resources KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block">Reclaimable Disk Space</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold text-amber-400 font-mono">
              {(totalReclaimableMb / 1024).toFixed(2)} GB
            </span>
            <span className="text-[10px] text-slate-400 font-mono">({totalReclaimableMb} MB)</span>
          </div>
          <span className="text-[10px] text-slate-400 font-sans block mt-1">Parquet spills & WAL logs</span>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block">Dangling Compute Nodes</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold text-red-400 font-mono">{danglingNodesCount} Pods</span>
            <span className="text-[10px] text-slate-400 font-mono">Zero Traffic</span>
          </div>
          <span className="text-[10px] text-slate-400 font-sans block mt-1">Stranded during scale-down</span>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Estimated Run Cost Burn</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold text-cyan-300 font-mono">
              ${(estimatedHourlySavings * 24 * 30).toFixed(2)}/mo
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-sans block mt-1">
            +${estimatedHourlySavings.toFixed(3)}/hr saved after purge
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Retention Policy Threshold</span>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="range"
              min="2"
              max="48"
              step="2"
              value={retentionTtlHours}
              onChange={(e) => setRetentionTtlHours(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-xs font-bold text-white font-mono shrink-0">&gt;{retentionTtlHours}h</span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans block mt-0.5">Flag artifacts older than TTL</span>
        </div>
      </div>

      {/* Filter and Table of Flagged Stale Artifacts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
            {(['all', 'Storage', 'Compute'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterType(cat)}
                className={`px-2.5 py-0.5 rounded uppercase font-bold transition-all cursor-pointer ${
                  filterType === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Items' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>Periodic Garbage Collector: <strong className="text-emerald-400">Armed</strong></span>
            <span>·</span>
            <button
              onClick={handleReset}
              className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Reset Audit Ledger
            </button>
          </div>
        </div>

        {/* Artifacts List */}
        <div className="space-y-2">
          {filteredArtifacts.map((art) => {
            const isFlagged = art.status === 'flagged';
            const isCompute = art.category === 'Compute';

            return (
              <div
                key={art.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  isFlagged
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-900 opacity-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {isCompute ? (
                        <Cpu className={`w-4 h-4 ${isFlagged ? 'text-red-400' : 'text-slate-600'}`} />
                      ) : (
                        <HardDrive className={`w-4 h-4 ${isFlagged ? 'text-amber-400' : 'text-slate-600'}`} />
                      )}
                      <span className={`text-xs font-bold ${isFlagged ? 'text-white' : 'text-slate-500 line-through'}`}>
                        {art.name}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                        art.status === 'flagged'
                          ? isCompute ? 'bg-red-950 text-red-300 border border-red-500/40' : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {art.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-sans">
                      {art.reason}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-mono">
                      <span>Source Run: <strong className="text-slate-400">{art.pipelineRunId}</strong></span>
                      <span>·</span>
                      <span>Created: <strong className="text-slate-400">{art.createdAt}</strong></span>
                      <span>·</span>
                      <span className="text-cyan-400">{art.nodeIpOrPath}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 sm:self-center">
                    <div className="text-right text-xs">
                      {isCompute ? (
                        <span className="font-bold text-red-400 block">${art.estimatedCostHourUsd}/hr burn</span>
                      ) : (
                        <span className="font-bold text-amber-400 block">{art.sizeMb} MB</span>
                      )}
                      <span className="text-[10px] text-slate-500">{art.ageHours}h unreferenced</span>
                    </div>

                    {isFlagged ? (
                      <button
                        onClick={() => handlePurgeSingle(art.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-red-950 hover:text-red-300 hover:border-red-500/50 border border-slate-700 text-slate-300 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                        title={isCompute ? 'Terminate dangling pod' : 'Delete temporary spill file'}
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                        <span>Purge</span>
                      </button>
                    ) : (
                      <span className="text-emerald-400 text-xs flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Purged</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
