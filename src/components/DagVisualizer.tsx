import React, { useState, useEffect, useMemo } from 'react';
import { PipelineStage, StageStickyNote } from '../types';
import {
  GitCommit,
  GitFork,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  Database,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  Info,
  ChevronRight,
  Maximize2,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Check,
  StickyNote,
  Plus,
  Trash2,
  MessageSquare,
  Pin,
  X,
  FileText,
  User,
  Tag,
  BookOpen,
  Flame,
  Activity,
  Shuffle,
  Split,
  ArrowDownUp,
  Search,
  Minimize2
} from 'lucide-react';

interface DagVisualizerProps {
  stages: PipelineStage[];
  selectedStageId: string;
  onSelectStage: (id: string) => void;
  isPipelineRunning: boolean;
  onAddActivityLog?: (action: string) => void;
  onOpenAutoDocumenter?: () => void;
  onReorderStages?: (newStages: PipelineStage[]) => void;
  onToggleParallelExecution?: (stageId: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  viewDensity?: 'compact' | 'expanded';
  onViewDensityChange?: (density: 'compact' | 'expanded') => void;
}

interface DagNode {
  id: string;
  stage: PipelineStage;
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  dependencies: string[];
}

const LOCAL_STORAGE_KEY = 'calfire_pipeline_dag_sticky_notes';

const DEFAULT_NOTES: StageStickyNote[] = [
  {
    id: 'note-ingest-1',
    stageId: 'stage-ingest',
    author: 'Principal Data Engineer',
    role: 'Infrastructure Lead',
    color: 'yellow',
    category: 'Documentation',
    content: 'State dispatch Postgres replication stream configured with WAL slot wal2json; checkpoint occurs every 60s.',
    createdAt: '10:14 AM',
    resolved: false,
  },
  {
    id: 'note-validate-1',
    stageId: 'stage-validate',
    author: 'SRE On-Call',
    role: 'Reliability',
    color: 'cyan',
    category: 'Schema Constraint',
    content: 'ADS-B transponder burst deduplication uses 5-second sliding window keyed on aircraft_id + lat_lon.',
    createdAt: '10:28 AM',
    resolved: false,
  },
  {
    id: 'note-transform-1',
    stageId: 'stage-transform',
    author: 'Lead ML / Optimization Eng',
    role: 'Operations Research',
    color: 'purple',
    category: 'SLA Rule',
    content: 'CP-SAT Scenario Objective: Turnaround target configured at ≤16.5m (User-Configurable Dispatch Objective; CAL FIRE Initial Attack planning goal is 20m response travel time, not a universal pit turnaround mandate). CP-SAT solver penalizes scenario deviations quadratically.',
    createdAt: '10:45 AM',
    resolved: false,
  },
  {
    id: 'note-load-1',
    stageId: 'stage-load',
    author: 'BI Architect',
    role: 'Analytics Platform',
    color: 'emerald',
    category: 'Optimization Tip',
    content: 'Partitioned by monthly calendar date. Automated index vacuuming runs concurrently at 02:00 UTC.',
    createdAt: '11:00 AM',
    resolved: false,
  },
];

export const DagVisualizer: React.FC<DagVisualizerProps> = ({
  stages,
  selectedStageId,
  onSelectStage,
  isPipelineRunning,
  onAddActivityLog,
  onOpenAutoDocumenter,
  onReorderStages,
  onToggleParallelExecution,
  searchQuery = '',
  onSearchQueryChange,
  viewDensity = 'expanded',
  onViewDensityChange,
}) => {
  const [internalSearch, setInternalSearch] = useState<string>('');
  const [internalDensity, setInternalDensity] = useState<'compact' | 'expanded'>('expanded');

  const effectiveSearch = searchQuery !== undefined ? searchQuery : internalSearch;
  const setEffectiveSearch = (val: string) => {
    if (onSearchQueryChange) onSearchQueryChange(val);
    else setInternalSearch(val);
  };

  const effectiveDensity = viewDensity !== undefined ? viewDensity : internalDensity;
  const setEffectiveDensity = (val: 'compact' | 'expanded') => {
    if (onViewDensityChange) onViewDensityChange(val);
    else setInternalDensity(val);
  };

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [highlightBranch, setHighlightBranch] = useState<string | null>(null);
  const [showDataFlowParticles, setShowDataFlowParticles] = useState<boolean>(true);
  const [showNotesDrawer, setShowNotesDrawer] = useState<boolean>(true);
  const [activeFilterCategory, setActiveFilterCategory] = useState<string>('ALL');
  const [showLatencyHeatmap, setShowLatencyHeatmap] = useState<boolean>(true);

  // Drag and Drop Node Reordering state on DAG Canvas
  const [draggedNodeStageId, setDraggedNodeStageId] = useState<string | null>(null);
  const [dragOverNodeStageId, setDragOverNodeStageId] = useState<string | null>(null);

  // Historical Average Duration Baselines (ms) per stage for Latency Heatmap comparison
  const HISTORICAL_STAGE_LATENCIES: Record<string, number> = useMemo(() => ({
    'stage-ingest': 180,
    'stage-validate': 120,
    'stage-transform': 420,
    'stage-load': 160,
  }), []);

  // Helper to calculate latency heat ratio and corresponding theme color
  const getLatencyHeatStatus = (stageId: string, currentDurationMs: number) => {
    const historicalAvg = HISTORICAL_STAGE_LATENCIES[stageId] || 200;
    const ratio = currentDurationMs / historicalAvg;
    const diffPct = Math.round((ratio - 1) * 100);

    if (ratio <= 0.85) {
      // Faster than average: Emerald/Green
      return {
        ratio,
        diffPct,
        tier: 'fast' as const,
        label: `${Math.abs(diffPct)}% faster`,
        nodeFill: 'rgba(16, 185, 129, 0.12)',
        nodeStroke: '#10b981',
        headerFill: 'rgba(16, 185, 129, 0.25)',
        badgeBg: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80',
        textColor: '#34d399',
        glowColor: '#10b981'
      };
    } else if (ratio <= 1.15) {
      // Nominal: Cyan/Blue
      return {
        ratio,
        diffPct,
        tier: 'nominal' as const,
        label: diffPct >= 0 ? `+${diffPct}% (nominal)` : `${diffPct}% (nominal)`,
        nodeFill: 'rgba(6, 182, 212, 0.08)',
        nodeStroke: '#06b6d4',
        headerFill: 'rgba(6, 182, 212, 0.2)',
        badgeBg: 'bg-cyan-950/90 text-cyan-300 border-cyan-700/80',
        textColor: '#38bdf8',
        glowColor: '#06b6d4'
      };
    } else if (ratio <= 1.40) {
      // Elevated: Amber/Orange
      return {
        ratio,
        diffPct,
        tier: 'elevated' as const,
        label: `+${diffPct}% elevated`,
        nodeFill: 'rgba(245, 158, 11, 0.12)',
        nodeStroke: '#f59e0b',
        headerFill: 'rgba(245, 158, 11, 0.28)',
        badgeBg: 'bg-amber-950/90 text-amber-300 border-amber-700/80',
        textColor: '#fbbf24',
        glowColor: '#f59e0b'
      };
    } else {
      // Severe lag / Bottleneck: Red/Crimson
      return {
        ratio,
        diffPct,
        tier: 'bottleneck' as const,
        label: `+${diffPct}% BOTTLENECK`,
        nodeFill: 'rgba(239, 68, 68, 0.18)',
        nodeStroke: '#ef4444',
        headerFill: 'rgba(239, 68, 68, 0.35)',
        badgeBg: 'bg-red-950/90 text-red-300 border-red-700/80',
        textColor: '#f87171',
        glowColor: '#ef4444'
      };
    }
  };

  // Persistent Sticky Notes state (persists to localStorage)
  const [notes, setNotes] = useState<StageStickyNote[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load sticky notes from localStorage:', e);
    }
    return DEFAULT_NOTES;
  });

  // Save notes whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.warn('Failed to save sticky notes to localStorage:', e);
    }
  }, [notes]);

  // New Note Modal state
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);
  const [targetStageForNote, setTargetStageForNote] = useState<string>(selectedStageId || stages[0]?.id || 'stage-ingest');
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [newNoteCategory, setNewNoteCategory] = useState<StageStickyNote['category']>('Documentation');
  const [newNoteColor, setNewNoteColor] = useState<StageStickyNote['color']>('yellow');

  // Compute dependency relationships and node layout (supporting parallel concurrent branches, drag-and-drop, and compact/expanded density)
  const isCompact = effectiveDensity === 'compact';

  const { nodes, edges, maxLevel, viewBoxHeight, viewBoxWidth } = useMemo(() => {
    const nodeMap = new Map<string, DagNode>();
    const nodeWidth = isCompact ? 180 : 240;
    const nodeHeight = isCompact ? 68 : 110;
    const horizontalSpacing = isCompact ? 240 : 320;

    // Track vertical branches for stages executing in parallel with previous stages
    let currentXLevel = 0;

    stages.forEach((stage, idx) => {
      // If stage has parallelExecution enabled and is not the first stage, it can run concurrently alongside the previous stage
      let level = idx;
      let yOffset = isCompact ? 40 : 80;

      if (stage.parallelExecution && idx > 0) {
        // Run parallel at same X level as previous stage, offset vertically
        level = Math.max(0, currentXLevel - 1);
        yOffset = isCompact ? 100 : 150;
      } else {
        level = currentXLevel;
        currentXLevel += 1;
        yOffset = isCompact ? 25 : 40;
      }

      // Dependencies
      let deps = stage.dependsOn && stage.dependsOn.length > 0 
        ? stage.dependsOn 
        : idx > 0 
        ? (stage.parallelExecution ? (idx > 1 ? [stages[idx - 2].id] : []) : [stages[idx - 1].id])
        : [];

      // Avoid self-dependency
      deps = deps.filter((d) => d !== stage.id);

      nodeMap.set(stage.id, {
        id: stage.id,
        stage,
        x: 40 + level * horizontalSpacing,
        y: yOffset,
        width: nodeWidth,
        height: nodeHeight,
        level,
        dependencies: deps,
      });
    });

    const nodeList = Array.from(nodeMap.values());
    const edgeList: Array<{ from: DagNode; to: DagNode; id: string; active: boolean }> = [];

    nodeList.forEach((toNode) => {
      toNode.dependencies.forEach((fromId) => {
        const fromNode = nodeMap.get(fromId);
        if (fromNode) {
          const isActive = isPipelineRunning || toNode.stage.status === 'running' || toNode.stage.status === 'completed';
          edgeList.push({
            from: fromNode,
            to: toNode,
            id: `${fromNode.id}->${toNode.id}`,
            active: isActive,
          });
        }
      });
    });

    const totalWidth = Math.max(isCompact ? 760 : 920, 100 + currentXLevel * horizontalSpacing);
    const totalHeight = isCompact ? 210 : 310;

    return {
      nodes: nodeList,
      edges: edgeList,
      maxLevel: currentXLevel,
      viewBoxWidth: totalWidth,
      viewBoxHeight: totalHeight,
    };
  }, [stages, isPipelineRunning, isCompact]);

  // Group notes by stage
  const notesByStage = useMemo(() => {
    const map = new Map<string, StageStickyNote[]>();
    notes.forEach((n) => {
      const existing = map.get(n.stageId) || [];
      existing.push(n);
      map.set(n.stageId, existing);
    });
    return map;
  }, [notes]);

  const handleAddStickyNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    const newNote: StageStickyNote = {
      id: `note-${Date.now()}`,
      stageId: targetStageForNote,
      author: 'Current Operator',
      role: 'Pipeline Engineer',
      color: newNoteColor,
      category: newNoteCategory,
      content: newNoteContent.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      resolved: false,
    };

    setNotes((prev) => [newNote, ...prev]);
    const targetStage = stages.find((s) => s.id === targetStageForNote);
    onAddActivityLog?.(`Added sticky note to stage "${targetStage?.name || targetStageForNote}": "${newNote.content.slice(0, 36)}..."`);

    setNewNoteContent('');
    setIsAddingNote(false);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    onAddActivityLog?.('Removed sticky note annotation from DAG stage');
  };

  // Drag and drop node reordering handlers on the DAG Canvas
  const handleNodeDragStart = (e: React.DragEvent, stageId: string) => {
    if (isPipelineRunning) return;
    setDraggedNodeStageId(stageId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', stageId);
  };

  const handleNodeDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (isPipelineRunning || draggedNodeStageId === stageId) return;
    e.dataTransfer.dropEffect = 'move';
    if (dragOverNodeStageId !== stageId) {
      setDragOverNodeStageId(stageId);
    }
  };

  const handleNodeDragLeave = (e: React.DragEvent, stageId: string) => {
    if (dragOverNodeStageId === stageId) {
      setDragOverNodeStageId(null);
    }
  };

  const handleNodeDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    if (isPipelineRunning || !draggedNodeStageId || draggedNodeStageId === targetStageId) {
      setDraggedNodeStageId(null);
      setDragOverNodeStageId(null);
      return;
    }

    const sourceIndex = stages.findIndex((s) => s.id === draggedNodeStageId);
    const targetIndex = stages.findIndex((s) => s.id === targetStageId);

    if (sourceIndex !== -1 && targetIndex !== -1 && onReorderStages) {
      const updated = [...stages];
      const [movedItem] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, movedItem);

      // Automatically recalculate dependencies to preserve DAG validity
      const remapped = updated.map((st, idx) => ({
        ...st,
        dependsOn: idx > 0 ? [updated[idx - 1].id] : [],
      }));

      onReorderStages(remapped);
      onAddActivityLog?.(`Reordered DAG stage sequence: "${movedItem.name}" moved to slot ${targetIndex + 1} of ${updated.length}`);
    }

    setDraggedNodeStageId(null);
    setDragOverNodeStageId(null);
  };

  const handleToggleResolveNote = (noteId: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, resolved: !n.resolved } : n))
    );
  };

  const filteredNotes = useMemo(() => {
    if (activeFilterCategory === 'ALL') return notes;
    return notes.filter((n) => n.category === activeFilterCategory);
  }, [notes, activeFilterCategory]);

  const colorStyles = {
    yellow: {
      bg: 'bg-amber-950/80 border-amber-500/60 text-amber-200',
      badge: 'bg-amber-900/80 text-amber-300 border-amber-600',
      accent: '#f59e0b',
    },
    cyan: {
      bg: 'bg-cyan-950/80 border-cyan-500/60 text-cyan-200',
      badge: 'bg-cyan-900/80 text-cyan-300 border-cyan-600',
      accent: '#06b6d4',
    },
    purple: {
      bg: 'bg-purple-950/80 border-purple-500/60 text-purple-200',
      badge: 'bg-purple-900/80 text-purple-300 border-purple-600',
      accent: '#a855f7',
    },
    emerald: {
      bg: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200',
      badge: 'bg-emerald-900/80 text-emerald-300 border-emerald-600',
      accent: '#10b981',
    },
    amber: {
      bg: 'bg-orange-950/80 border-orange-500/60 text-orange-200',
      badge: 'bg-orange-900/80 text-orange-300 border-orange-600',
      accent: '#f97316',
    },
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 font-mono text-xs">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-inner">
            <GitFork className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight uppercase">
                Directed Acyclic Graph (DAG) Execution Flow
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                TOPOLOGICAL SORT
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800/80 flex items-center gap-1">
                <Split className="w-3 h-3 text-teal-400" />
                PARALLEL READY
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800/80 flex items-center gap-1">
                <ArrowDownUp className="w-3 h-3 text-purple-400" />
                DRAG REORDER
              </span>
              <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/70">
                <StickyNote className="w-3 h-3 text-amber-400" />
                {notes.length} PERSISTENT NOTES
              </span>
            </div>
            <p className="text-slate-400 font-sans text-xs mt-0.5">
              Interactive inter-stage execution hierarchy, parallel concurrent execution branches, drag-and-drop sequencing, and persistent annotations.
            </p>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Search Input for fast stage node filtering */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={effectiveSearch}
              onChange={(e) => setEffectiveSearch(e.target.value)}
              placeholder="Search stage nodes..."
              className="pl-8 pr-7 py-1.5 w-44 sm:w-52 rounded-lg bg-slate-950/90 border border-slate-800 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 text-xs text-white placeholder-slate-500 transition-all outline-none"
            />
            {effectiveSearch && (
              <button
                onClick={() => setEffectiveSearch('')}
                className="absolute right-2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Density Toggle */}
          <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5">
            <button
              onClick={() => {
                setEffectiveDensity('compact');
                onAddActivityLog?.('Switched DAG view density to Compact');
              }}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                effectiveDensity === 'compact'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
              title="Compact View: Condensed node layout for high-level topological workflow overview"
            >
              <Minimize2 className="w-3 h-3" />
              <span>Compact</span>
            </button>
            <button
              onClick={() => {
                setEffectiveDensity('expanded');
                onAddActivityLog?.('Switched DAG view density to Expanded');
              }}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                effectiveDensity === 'expanded'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-sm'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
              title="Expanded View: Full detail node view with metrics, latency baselines, and annotations"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Expanded</span>
            </button>
          </div>

          {onOpenAutoDocumenter && (
            <button
              onClick={onOpenAutoDocumenter}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/50 text-cyan-300 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-cyan-950/40"
              title="Generate a concise README-style markdown summary of the pipeline logic flow and business purpose using Gemini API"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Auto-Documenter</span>
            </button>
          )}

          <button
            onClick={() => {
              setTargetStageForNote(selectedStageId || stages[0]?.id || 'stage-ingest');
              setIsAddingNote(true);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-amber-950/40"
            title="Attach a new persistent sticky note or engineering annotation to a stage"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Sticky Note</span>
          </button>

          <button
            onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            className={`px-2.5 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              showNotesDrawer
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle sticky note annotations panel alongside the DAG"
          >
            <StickyNote className="w-3.5 h-3.5 text-amber-400" />
            <span>Notes Panel: {showNotesDrawer ? 'OPEN' : 'COLLAPSED'}</span>
          </button>

          {/* Latency Heatmap Toggle */}
          <button
            onClick={() => {
              setShowLatencyHeatmap(!showLatencyHeatmap);
              onAddActivityLog?.(`Toggled DAG Latency Heatmap overlay: ${!showLatencyHeatmap ? 'ON' : 'OFF'}`);
            }}
            className={`px-2.5 py-1.5 rounded-lg border font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
              showLatencyHeatmap
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-amber-950/40'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Colorize DAG nodes dynamically based on execution time relative to historical averages (Fast/Nominal/Elevated/Bottleneck)"
          >
            <Flame className={`w-3.5 h-3.5 ${showLatencyHeatmap ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
            <span>Latency Heatmap: {showLatencyHeatmap ? 'ACTIVE' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowDataFlowParticles(!showDataFlowParticles)}
            className={`px-2.5 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              showDataFlowParticles
                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle animated data packet flow along DAG dependency edges"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Particle Flow: {showDataFlowParticles ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setZoomLevel((z) => (z === 1 ? 1.15 : 1))}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            title="Toggle Zoom Scaling"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{zoomLevel > 1 ? 'Zoom 100%' : 'Zoom 115%'}</span>
          </button>
        </div>
      </div>

      {/* SVG-based DAG Canvas */}
      <div className="mt-4 p-4 rounded-xl bg-slate-950/90 border border-slate-800/90 relative overflow-x-auto select-none shadow-inner">
        <div
          className="relative min-w-[860px] transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
        >
          <svg
            className="w-full h-[260px] overflow-visible"
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          >
            <defs>
              {/* Arrow Marker Definitions */}
              <marker
                id="dag-arrow-active"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#06b6d4" />
              </marker>

              <marker
                id="dag-arrow-idle"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#475569" />
              </marker>

              {/* Edge Gradient */}
              <linearGradient id="edgeGradientCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0891b2" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.9" />
              </linearGradient>

              {/* Glow Filter for Active Edges & Heatmap Nodes */}
              <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glowAmber" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glowEmerald" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Grid Pattern */}
            <g opacity="0.12">
              {Array.from({ length: 25 }).map((_, i) => (
                <line
                  key={`grid-x-${i}`}
                  x1={i * 45}
                  y1={0}
                  x2={i * 45}
                  y2={viewBoxHeight}
                  stroke="#38bdf8"
                  strokeWidth="1"
                />
              ))}
              {Array.from({ length: 8 }).map((_, j) => (
                <line
                  key={`grid-y-${j}`}
                  x1={0}
                  y1={j * 40}
                  x2={viewBoxWidth}
                  y2={j * 40}
                  stroke="#38bdf8"
                  strokeWidth="1"
                />
              ))}
            </g>

            {/* 1. DEPENDENCY EDGES & BEZIER PATHS */}
            {edges.map((edge) => {
              const startX = edge.from.x + edge.from.width;
              const startY = edge.from.y + edge.from.height / 2;
              const endX = edge.to.x;
              const endY = edge.to.y + edge.to.height / 2;

              const cX1 = startX + (endX - startX) * 0.45;
              const cY1 = startY;
              const cX2 = startX + (endX - startX) * 0.55;
              const cY2 = endY;

              const pathData = `M ${startX} ${startY} C ${cX1} ${cY1}, ${cX2} ${cY2}, ${endX} ${endY}`;
              const isHighlighted =
                highlightBranch === edge.from.id ||
                highlightBranch === edge.to.id ||
                selectedStageId === edge.from.id ||
                selectedStageId === edge.to.id;

              return (
                <g key={edge.id}>
                  {/* Subtle Shadow Path */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#020617"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />

                  {/* Main Bezier Edge */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={
                      isHighlighted
                        ? '#38bdf8'
                        : edge.active
                        ? 'url(#edgeGradientCyan)'
                        : '#334155'
                    }
                    strokeWidth={isHighlighted ? 3 : 2}
                    strokeDasharray={edge.active ? 'none' : '4 4'}
                    markerEnd={edge.active ? 'url(#dag-arrow-active)' : 'url(#dag-arrow-idle)'}
                    className="transition-all duration-300"
                    filter={isHighlighted ? 'url(#glowCyan)' : undefined}
                  />

                  {/* Edge Metric Label (Records Streamed / Latency) */}
                  <g
                    transform={`translate(${(startX + endX) / 2}, ${(startY + endY) / 2 - 12})`}
                  >
                    <rect
                      x="-38"
                      y="-10"
                      width="76"
                      height="18"
                      rx="4"
                      fill="#020617"
                      stroke="#1e293b"
                      strokeWidth="1"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#38bdf8"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {edge.from.stage.recordsOut.toLocaleString()} rows
                    </text>
                  </g>

                  {/* Animated Stream Particle */}
                  {showDataFlowParticles && edge.active && (
                    <circle r="3.5" fill="#38bdf8" filter="url(#glowCyan)">
                      <animateMotion
                        path={pathData}
                        dur={isPipelineRunning ? '1.8s' : '3.6s'}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* 2. DAG NODES */}
            {nodes.map((node) => {
              const isSelected = selectedStageId === node.id;
              const isRunning = isPipelineRunning || node.stage.status === 'running';
              const isCompleted = node.stage.status === 'completed';
              const stageNotes = notesByStage.get(node.id) || [];
              const heat = getLatencyHeatStatus(node.id, node.stage.durationMs);

              // Search match evaluation
              const isSearchMatch = Boolean(
                effectiveSearch.trim() &&
                (node.stage.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                 node.stage.description.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                 node.stage.configSummary.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                 node.stage.type.toLowerCase().includes(effectiveSearch.toLowerCase()))
              );
              const isSearchActive = Boolean(effectiveSearch.trim());
              const isDimmedBySearch = isSearchActive && !isSearchMatch;

              const filterId = isSearchMatch
                ? 'url(#glowCyan)'
                : isSelected 
                ? 'url(#glowCyan)' 
                : (showLatencyHeatmap ? (heat.tier === 'bottleneck' ? 'url(#glowRed)' : heat.tier === 'elevated' ? 'url(#glowAmber)' : undefined) : undefined);

              const isDraggedNode = draggedNodeStageId === node.id;
              const isDragOverNode = dragOverNodeStageId === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className={`cursor-pointer transition-opacity duration-300 ${
                    isDimmedBySearch ? 'opacity-30' : isDraggedNode ? 'opacity-40' : 'opacity-100'
                  }`}
                  onClick={() => onSelectStage(node.id)}
                  onMouseEnter={() => setHighlightBranch(node.id)}
                  onMouseLeave={() => setHighlightBranch(null)}
                  {...({
                    draggable: !isPipelineRunning,
                    onDragStart: (e: React.DragEvent) => handleNodeDragStart(e, node.id),
                    onDragOver: (e: React.DragEvent) => handleNodeDragOver(e, node.id),
                    onDragLeave: (e: React.DragEvent) => handleNodeDragLeave(e, node.id),
                    onDrop: (e: React.DragEvent) => handleNodeDrop(e, node.id),
                  } as React.HTMLAttributes<SVGGElement>)}
                >
                  {/* Outer selection border & drop shadow with Heatmap and Drag styling */}
                  <rect
                    x="0"
                    y="0"
                    width={node.width}
                    height={node.height}
                    rx="12"
                    fill={
                      isDragOverNode
                        ? 'rgba(6, 182, 212, 0.25)'
                        : isSearchMatch
                        ? 'rgba(6, 182, 212, 0.18)'
                        : showLatencyHeatmap
                        ? (isSelected ? '#0f172a' : heat.nodeFill)
                        : (isSelected ? '#0f172a' : '#090d16')
                    }
                    stroke={
                      isDragOverNode
                        ? '#22d3ee'
                        : isSearchMatch
                        ? '#38bdf8'
                        : isSelected
                        ? '#06b6d4'
                        : showLatencyHeatmap
                        ? heat.nodeStroke
                        : isRunning
                        ? '#eab308'
                        : isCompleted
                        ? '#1e293b'
                        : '#334155'
                    }
                    strokeWidth={isDragOverNode ? '3.0' : isSearchMatch ? '2.5' : isSelected ? '2.5' : showLatencyHeatmap ? '2.0' : '1.5'}
                    strokeDasharray={isDragOverNode ? '4 3' : 'none'}
                    filter={filterId}
                    className="transition-all duration-300"
                  />

                  {/* Compact vs Expanded Node Internal Layout */}
                  {isCompact ? (
                    /* COMPACT DENSITY NODE */
                    <g>
                      {/* Compact Header */}
                      <rect
                        x="6"
                        y="6"
                        width={node.width - 12}
                        height="20"
                        rx="5"
                        fill={
                          showLatencyHeatmap
                            ? heat.headerFill
                            : isRunning
                            ? 'rgba(234, 179, 8, 0.15)'
                            : isCompleted
                            ? 'rgba(6, 182, 212, 0.12)'
                            : 'rgba(51, 65, 85, 0.2)'
                        }
                      />
                      <text
                        x="12"
                        y="20"
                        fill="#f8fafc"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {node.stage.name.length > 15
                          ? node.stage.name.substring(0, 15) + '...'
                          : node.stage.name}
                      </text>

                      {/* Status indicator dot */}
                      <circle
                        cx={node.width - 14}
                        cy="16"
                        r="3.5"
                        fill={
                          showLatencyHeatmap
                            ? heat.nodeStroke
                            : isRunning
                            ? '#eab308'
                            : isCompleted
                            ? '#10b981'
                            : '#64748b'
                        }
                        className={isRunning ? 'animate-ping' : ''}
                      />

                      {/* Compact Metrics Row */}
                      <text x="12" y="44" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                        {node.stage.recordsOut.toLocaleString()} rows ·{' '}
                        <tspan fill={showLatencyHeatmap ? heat.textColor : '#38bdf8'} fontWeight="bold">
                          {node.stage.durationMs}ms
                        </tspan>
                      </text>

                      {/* Compact Tag / Parallel Indicator */}
                      <g transform="translate(12, 51)">
                        <rect
                          x="0"
                          y="0"
                          width={node.width - 24}
                          height="12"
                          rx="3"
                          fill="#020617"
                          stroke={node.stage.parallelExecution ? '#14b8a6' : '#1e293b'}
                          strokeWidth="0.8"
                        />
                        <text
                          x="4"
                          y="9"
                          fill={node.stage.parallelExecution ? '#2dd4bf' : '#64748b'}
                          fontSize="7.5"
                          fontFamily="monospace"
                        >
                          {node.stage.parallelExecution ? 'PARALLEL BRANCH' : 'SEQUENTIAL STEP'}
                        </text>
                      </g>
                    </g>
                  ) : (
                    /* EXPANDED DENSITY NODE */
                    <g>
                      {/* Node Header Pill */}
                      <rect
                        x="10"
                        y="10"
                        width={node.width - 20}
                        height="24"
                        rx="6"
                        fill={
                          showLatencyHeatmap
                            ? heat.headerFill
                            : isRunning
                            ? 'rgba(234, 179, 8, 0.15)'
                            : isCompleted
                            ? 'rgba(6, 182, 212, 0.12)'
                            : 'rgba(51, 65, 85, 0.2)'
                        }
                      />

                      {/* Drag Grip Indicator */}
                      <g transform="translate(14, 16)" opacity="0.6">
                        <line x1="0" y1="2" x2="6" y2="2" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="0" y1="6" x2="6" y2="6" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="0" y1="10" x2="6" y2="10" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                      </g>

                      {/* Stage Order & Title */}
                      <text
                        x="26"
                        y="26"
                        fill="#f8fafc"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {node.stage.name.length > 18
                          ? node.stage.name.substring(0, 18) + '...'
                          : node.stage.name}
                      </text>

                      {/* Parallel Execution Toggle & Badge */}
                      <g
                        transform={`translate(${node.width - 66}, 13)`}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleParallelExecution) {
                            onToggleParallelExecution(node.id);
                          }
                        }}
                      >
                        <rect
                          x="0"
                          y="0"
                          width="42"
                          height="18"
                          rx="4"
                          fill={node.stage.parallelExecution ? '#042f2e' : '#0f172a'}
                          stroke={node.stage.parallelExecution ? '#14b8a6' : '#334155'}
                          strokeWidth="1"
                        />
                        <text
                          x="21"
                          y="12"
                          textAnchor="middle"
                          fill={node.stage.parallelExecution ? '#2dd4bf' : '#64748b'}
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {node.stage.parallelExecution ? 'PARALLEL' : 'SERIAL'}
                        </text>
                      </g>

                      {/* Status Indicator Icon & Heatmap Variance Badge */}
                      <g transform={`translate(${node.width - 16}, 22)`}>
                        <circle
                          cx="0"
                          cy="0"
                          r="4"
                          fill={
                            showLatencyHeatmap
                              ? heat.nodeStroke
                              : isRunning
                              ? '#eab308'
                              : isCompleted
                              ? '#10b981'
                              : '#64748b'
                          }
                          className={isRunning ? 'animate-ping' : ''}
                        />
                      </g>

                      {/* Metrics: Records and Duration */}
                      <text x="18" y="54" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                        Records Out:
                      </text>
                      <text
                        x="100"
                        y="54"
                        fill="#38bdf8"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {node.stage.recordsOut.toLocaleString()}
                      </text>

                      <text x="18" y="72" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                        Latency vs Avg:
                      </text>
                      <text
                        x="100"
                        y="72"
                        fill={showLatencyHeatmap ? heat.textColor : '#f8fafc'}
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {node.stage.durationMs}ms
                        <tspan dx="5" fontSize="9" fill={showLatencyHeatmap ? heat.textColor : '#64748b'}>
                          ({heat.label})
                        </tspan>
                      </text>

                      {/* Dependencies Tag & Heat tier baseline comparison */}
                      <g transform="translate(18, 86)">
                        <rect
                          x="0"
                          y="0"
                          width={node.width - 36}
                          height="16"
                          rx="4"
                          fill="#020617"
                          stroke={showLatencyHeatmap ? heat.nodeStroke : '#1e293b'}
                          strokeWidth={showLatencyHeatmap ? '1' : '1'}
                          strokeOpacity={showLatencyHeatmap ? '0.4' : '1'}
                        />
                        <text
                          x="6"
                          y="11"
                          fill={showLatencyHeatmap ? heat.textColor : '#64748b'}
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {showLatencyHeatmap
                            ? `Historical Avg: ${HISTORICAL_STAGE_LATENCIES[node.id] || 200}ms (${heat.tier.toUpperCase()})`
                            : node.dependencies.length > 0
                            ? `Upstream: [${node.dependencies.join(', ')}]`
                            : 'Root Source Ingest'}
                        </text>
                      </g>
                    </g>
                  )}

                  {/* STICKY NOTES BADGE ATTACHED TO STAGE NODE (Top-Right Pin) */}
                  {stageNotes.length > 0 && (
                    <g
                      transform={`translate(${node.width - 12}, -8)`}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStage(node.id);
                        setShowNotesDrawer(true);
                      }}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="11"
                        fill="#f59e0b"
                        stroke="#0f172a"
                        strokeWidth="2"
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fill="#020617"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {stageNotes.length}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* LATENCY HEATMAP INTERACTIVE LEGEND BAR */}
      {showLatencyHeatmap && (
        <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white text-[11px] uppercase tracking-wide">
              Latency Heatmap Calibration:
            </span>
            <span className="text-[10px] text-slate-400 font-sans hidden md:inline">
              Execution time evaluated against 30-day baseline historical average
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              <span className="text-emerald-300 font-bold">Fast (&lt; 85% avg)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
              <span className="text-cyan-300 font-bold">Nominal (85% – 115% avg)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <span className="text-amber-300 font-bold">Elevated (115% – 140% avg)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse shadow-sm shadow-red-400/50" />
              <span className="text-red-400 font-bold">Bottleneck (&gt; 140% avg)</span>
            </div>
          </div>
        </div>
      )}

      {/* PERSISTENT STICKY NOTES & ANNOTATIONS DOCUMENTATION PANEL */}
      {showNotesDrawer && (
        <div className="mt-4 pt-4 border-t border-slate-800 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Stage Documentation &amp; Engineering Sticky Notes
              </h4>
              <span className="text-[10px] text-amber-400/80 font-sans">
                (Kept alongside dataflow in localStorage)
              </span>
            </div>

            {/* Filter by Category */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-slate-500 mr-1">Filter:</span>
              {['ALL', 'Documentation', 'SLA Rule', 'Schema Constraint', 'Optimization Tip'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilterCategory(cat)}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    activeFilterCategory === cat
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Sticky Notes Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredNotes.map((note) => {
              const stage = stages.find((s) => s.id === note.stageId);
              const style = colorStyles[note.color] || colorStyles.yellow;

              return (
                <div
                  key={note.id}
                  className={`p-3 rounded-xl border relative shadow-md transition-all flex flex-col justify-between group ${style.bg} ${
                    note.resolved ? 'opacity-60 saturate-50' : ''
                  }`}
                >
                  {/* Pin Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Pin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="text-[10px] font-bold text-white truncate max-w-[130px]">
                          {stage?.name || note.stageId}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border font-sans ${style.badge}`}>
                          {note.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleResolveNote(note.id)}
                          className={`p-1 rounded hover:bg-slate-900/60 cursor-pointer ${
                            note.resolved ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-300'
                          }`}
                          title={note.resolved ? 'Mark as Unresolved' : 'Mark as Verified/Resolved'}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 rounded hover:bg-slate-900/60 text-slate-400 hover:text-rose-400 cursor-pointer"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-[11px] font-sans text-slate-100 leading-relaxed mb-3 break-words">
                      {note.content}
                    </p>
                  </div>

                  {/* Footer Meta */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-400">
                    <span className="truncate max-w-[120px]">{note.author}</span>
                    <span>{note.createdAt}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredNotes.length === 0 && (
            <div className="p-6 text-center rounded-xl bg-slate-950/60 border border-slate-800 text-slate-500 font-sans text-xs">
              No sticky notes found for category: &quot;{activeFilterCategory}&quot;. Click &quot;Add Sticky Note&quot; to pin one to the DAG.
            </div>
          )}
        </div>
      )}

      {/* CREATE NEW STICKY NOTE MODAL */}
      {isAddingNote && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Pin Sticky Note to Stage
                </h3>
              </div>
              <button
                onClick={() => setIsAddingNote(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStickyNote} className="space-y-3.5 text-xs font-sans">
              {/* Target Stage */}
              <div>
                <label className="block text-[11px] text-slate-400 font-mono uppercase mb-1">
                  Target Pipeline Stage:
                </label>
                <select
                  value={targetStageForNote}
                  onChange={(e) => setTargetStageForNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Note Category */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 font-mono uppercase mb-1">
                    Category:
                  </label>
                  <select
                    value={newNoteCategory}
                    onChange={(e) => setNewNoteCategory(e.target.value as StageStickyNote['category'])}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="Documentation">Documentation</option>
                    <option value="SLA Rule">SLA Rule</option>
                    <option value="Schema Constraint">Schema Constraint</option>
                    <option value="Incident Post-Mortem">Incident Post-Mortem</option>
                    <option value="Optimization Tip">Optimization Tip</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-mono uppercase mb-1">
                    Color Accent:
                  </label>
                  <select
                    value={newNoteColor}
                    onChange={(e) => setNewNoteColor(e.target.value as StageStickyNote['color'])}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2 font-mono text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="yellow">Yellow (Standard)</option>
                    <option value="cyan">Cyan (Dataflow)</option>
                    <option value="purple">Purple (SLA / Model)</option>
                    <option value="emerald">Emerald (Storage / Sync)</option>
                    <option value="amber">Amber (Warning / Alert)</option>
                  </select>
                </div>
              </div>

              {/* Note Body */}
              <div>
                <label className="block text-[11px] text-slate-400 font-mono uppercase mb-1">
                  Sticky Note Content / Documentation:
                </label>
                <textarea
                  rows={4}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="e.g. Turnaround SLAs require strict CISRM 2026 conformance; fallback solver is activated if latency exceeds 500ms..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-amber-400 resize-none font-sans"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingNote(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer font-mono flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>Pin Note to Stage</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DAG Legend & Lineage Inspector */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Completed Stage (Idempotent)</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Active Worker Transformation</span>
          </span>
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-3 h-0.5 bg-cyan-400" />
            <span>Directed Edge (Non-Cyclic Stream)</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <Pin className="w-3 h-3 text-amber-400" />
            <span>Pinned Sticky Notes Badge</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <span>Click any DAG node to inspect stage schemas &amp; attached engineering notes</span>
        </div>
      </div>
    </div>
  );
};
