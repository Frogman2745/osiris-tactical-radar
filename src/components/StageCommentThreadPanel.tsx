import React, { useState, useEffect, useMemo } from 'react';
import { StageComment, PipelineStage } from '../types';
import {
  MessageSquare,
  Send,
  X,
  User,
  Clock,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ThumbsUp,
  Trash2,
  Filter,
  Shield,
  Layers,
  ChevronDown
} from 'lucide-react';

interface StageCommentThreadPanelProps {
  isOpen: boolean;
  onClose: () => void;
  stages: PipelineStage[];
  selectedStageId: string;
  onSelectStage: (stageId: string) => void;
  onAddActivityLog?: (action: string) => void;
}

const LOCAL_STORAGE_COMMENTS_KEY = 'calfire_pipeline_dag_comment_threads';

const DEFAULT_COMMENTS: StageComment[] = [
  {
    id: 'comm-1',
    stageId: 'stage-transform',
    author: 'Elena Rostova',
    role: 'Staff SRE & Incident Commander',
    avatarColor: 'bg-rose-500',
    timestamp: '14:22:10 PST',
    content: 'Root cause for the 3.8x turnaround latency spike on Tanker 118: Geofence polygon rasterizer encountered non-convex boundary intersection in Butte County dispatch zone.',
    tag: 'Root Cause',
    anomalyReference: 'ANOMALY-4091: Turnaround Duration Spike (18.4m vs 12.0m baseline)',
    likes: 4,
  },
  {
    id: 'comm-2',
    stageId: 'stage-transform',
    author: 'Marcus Vance',
    role: 'Lead ML Optimization Eng',
    avatarColor: 'bg-purple-500',
    timestamp: '14:25:40 PST',
    content: 'Applied convex-hull pre-filter on incoming GeoJSON boundaries before feeding into OR-Tools CP-SAT solver. Mitigation cut CPU constraint propagation time from 420ms to 48ms.',
    tag: 'Mitigation',
    anomalyReference: 'ANOMALY-4091: Turnaround Duration Spike',
    likes: 6,
  },
  {
    id: 'comm-3',
    stageId: 'stage-ingest',
    author: 'Devon Lee',
    role: 'Senior Data Platform Eng',
    avatarColor: 'bg-cyan-500',
    timestamp: '14:38:15 PST',
    content: 'CDC WAL queue buffer overflowed during initial multi-aircraft retardant drop dispatch. Increasing Postgres max_wal_size to 16GB mitigated spillback.',
    tag: 'Hotfix',
    likes: 3,
  },
  {
    id: 'comm-4',
    stageId: 'stage-validate',
    author: 'Sarah Chen',
    role: 'Aviation Compliance Auditor',
    avatarColor: 'bg-emerald-500',
    timestamp: '14:50:02 PST',
    content: 'Verified that transponder telemetry dropouts are now caught by the Kalman-filter heuristic before downstream indexing. Zero false-positive drops recorded in last 3 batches.',
    tag: 'Observation',
    likes: 5,
  },
  {
    id: 'comm-5',
    stageId: 'stage-load',
    author: 'Tyler Ross',
    role: 'Database Administrator',
    avatarColor: 'bg-amber-500',
    timestamp: '15:02:18 PST',
    content: 'TimescaleDB hypertable chunks are now properly partitioned daily. Query latency on 100k flight records dropped under 12ms.',
    tag: 'Action Item',
    likes: 2,
  },
];

export const StageCommentThreadPanel: React.FC<StageCommentThreadPanelProps> = ({
  isOpen,
  onClose,
  stages,
  selectedStageId,
  onSelectStage,
  onAddActivityLog,
}) => {
  const [comments, setComments] = useState<StageComment[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_COMMENTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load comments from storage:', e);
    }
    return DEFAULT_COMMENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_COMMENTS_KEY, JSON.stringify(comments));
    } catch (e) {
      console.warn('Failed to save comments to storage:', e);
    }
  }, [comments]);

  const [activeStageFilter, setActiveStageFilter] = useState<string>('ALL');
  const [activeTagFilter, setActiveTagFilter] = useState<string>('ALL');
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [newCommentTag, setNewCommentTag] = useState<StageComment['tag']>('Observation');
  const [newCommentAuthor, setNewCommentAuthor] = useState<string>('Operational SRE (You)');
  const [attachCurrentAnomaly, setAttachCurrentAnomaly] = useState<boolean>(true);

  // Sync active stage filter when opened with a selected stage
  useEffect(() => {
    if (selectedStageId) {
      // keep current or allow user to filter
    }
  }, [selectedStageId]);

  const currentStage = stages.find((s) => s.id === selectedStageId) || stages[0];

  const filteredComments = useMemo(() => {
    return comments.filter((c) => {
      const matchStage = activeStageFilter === 'ALL' || c.stageId === activeStageFilter;
      const matchTag = activeTagFilter === 'ALL' || c.tag === activeTagFilter;
      return matchStage && matchTag;
    });
  }, [comments, activeStageFilter, activeTagFilter]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const targetStageId = activeStageFilter !== 'ALL' ? activeStageFilter : selectedStageId || stages[0]?.id;
    const targetStage = stages.find((s) => s.id === targetStageId);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' PST';

    const newComment: StageComment = {
      id: `comm-${Date.now()}`,
      stageId: targetStageId,
      author: newCommentAuthor,
      role: 'Pipeline Ops & Investigation',
      avatarColor: 'bg-cyan-500',
      timestamp: timeStr,
      content: newCommentText.trim(),
      tag: newCommentTag,
      anomalyReference: attachCurrentAnomaly ? 'Live Pipeline Anomaly Investigation' : undefined,
      likes: 1,
    };

    setComments((prev) => [newComment, ...prev]);
    onAddActivityLog?.(`Posted investigation note on stage "${targetStage?.name || targetStageId}": ${newComment.content.slice(0, 40)}...`);
    setNewCommentText('');
  };

  const handleLike = (id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, likes: (c.likes || 0) + 1 } : c))
    );
  };

  const handleDelete = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    onAddActivityLog?.('Deleted stage investigation comment');
  };

  if (!isOpen) return null;

  const tagStyles = {
    'Root Cause': 'bg-rose-950 text-rose-300 border-rose-600',
    Mitigation: 'bg-purple-950 text-purple-300 border-purple-600',
    Observation: 'bg-cyan-950 text-cyan-300 border-cyan-600',
    'Action Item': 'bg-amber-950 text-amber-300 border-amber-600',
    Hotfix: 'bg-emerald-950 text-emerald-300 border-emerald-600',
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col font-mono text-xs animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                Investigation Comment Thread
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                {comments.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Time-stamped notes on DAG stages during telemetry triage
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-slate-950 border-b border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target Stage:</span>
          </div>
          <select
            value={activeStageFilter}
            onChange={(e) => setActiveStageFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white rounded px-2 py-1 text-[11px] cursor-pointer outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Stages ({comments.length})</option>
            {stages.map((s) => {
              const count = comments.filter((c) => c.stageId === s.id).length;
              return (
                <option key={s.id} value={s.id}>
                  {s.name} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap items-center gap-1 text-[10px]">
          <span className="text-slate-500 mr-1">Tag:</span>
          {['ALL', 'Root Cause', 'Mitigation', 'Hotfix', 'Observation', 'Action Item'].map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTagFilter(tag)}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                activeTagFilter === tag
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {filteredComments.map((comment) => {
          const stage = stages.find((s) => s.id === comment.stageId);
          return (
            <div
              key={comment.id}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2 hover:border-slate-700 transition-colors"
            >
              {/* Header: Author, Role, Time, Tag */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                      comment.avatarColor || 'bg-cyan-600'
                    }`}
                  >
                    {comment.author.charAt(0)}
                  </div>
                  <div>
                    <div className="text-slate-200 font-bold text-[11px] leading-tight">
                      {comment.author}
                    </div>
                    <div className="text-[10px] text-slate-500">{comment.role}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-600" />
                    {comment.timestamp}
                  </span>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-slate-600 hover:text-rose-400 p-0.5 rounded cursor-pointer"
                    title="Delete note"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Tag & Stage Pill */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => {
                    onSelectStage(comment.stageId);
                    setActiveStageFilter(comment.stageId);
                  }}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-cyan-300 hover:border-cyan-500/50 cursor-pointer flex items-center gap-1"
                >
                  <Layers className="w-2.5 h-2.5 text-cyan-400" />
                  <span className="truncate max-w-[140px]">{stage?.name || comment.stageId}</span>
                </button>

                {comment.tag && (
                  <span
                    className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${
                      tagStyles[comment.tag] || 'bg-slate-900 text-slate-300'
                    }`}
                  >
                    {comment.tag}
                  </span>
                )}
              </div>

              {/* Anomaly Reference Banner if attached */}
              {comment.anomalyReference && (
                <div className="p-2 rounded bg-amber-950/30 border border-amber-800/40 text-[10px] text-amber-300 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="truncate font-sans">{comment.anomalyReference}</span>
                </div>
              )}

              {/* Comment Content */}
              <p className="text-slate-300 font-sans text-xs leading-relaxed break-words">
                {comment.content}
              </p>

              {/* Footer: Like Action */}
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                <button
                  onClick={() => handleLike(comment.id)}
                  className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 cursor-pointer transition-colors"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>Helpful ({comment.likes || 0})</span>
                </button>
                <span className="text-[9px] text-slate-600">ACID Audited</span>
              </div>
            </div>
          );
        })}

        {filteredComments.length === 0 && (
          <div className="p-8 text-center text-slate-500 font-sans">
            No notes found for current filter. Post the first investigation note below!
          </div>
        )}
      </div>

      {/* New Comment Input Box */}
      <form onSubmit={handlePostComment} className="p-3.5 bg-slate-950 border-t border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400 font-bold uppercase">
            Post Investigation Note
          </span>
          <select
            value={newCommentTag}
            onChange={(e) => setNewCommentTag(e.target.value as StageComment['tag'])}
            className="bg-slate-900 border border-slate-800 text-cyan-300 rounded px-2 py-0.5 text-[10px] cursor-pointer outline-none focus:border-cyan-400"
          >
            <option value="Observation">Observation</option>
            <option value="Root Cause">Root Cause</option>
            <option value="Mitigation">Mitigation Strategy</option>
            <option value="Action Item">Action Item</option>
            <option value="Hotfix">Hotfix</option>
          </select>
        </div>

        <textarea
          rows={3}
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder={`Note findings on ${activeStageFilter !== 'ALL' ? activeStageFilter : currentStage?.name || 'stage'}...`}
          className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2.5 text-xs font-sans placeholder-slate-500 outline-none focus:border-cyan-400 resize-none"
          required
        />

        <div className="flex items-center justify-between gap-2 pt-1">
          <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={attachCurrentAnomaly}
              onChange={(e) => setAttachCurrentAnomaly(e.target.checked)}
              className="accent-cyan-400 rounded"
            />
            <span>Link to Anomaly Investigation</span>
          </label>

          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post Note</span>
          </button>
        </div>
      </form>
    </div>
  );
};
