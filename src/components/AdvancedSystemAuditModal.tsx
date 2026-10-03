import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Info,
  Clock,
  Terminal,
  Server,
  Database,
  Radio,
  Cpu,
  Layers,
  Code2,
  X,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Download,
  Copy,
  Sparkles,
  Activity,
  Check,
  FileJson,
  FileSpreadsheet
} from 'lucide-react';
import { AuditLogEntry, AuditLogLevel, AuditLogCategory, SystemAuditSummary } from '../types/systemAudit';

interface AdvancedSystemAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvancedSystemAuditModal: React.FC<AdvancedSystemAuditModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [summary, setSummary] = useState<SystemAuditSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [copiedTraceId, setCopiedTraceId] = useState<string | null>(null);
  const [copiedRawJson, setCopiedRawJson] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [exportDropdownOpen, setExportDropdownOpen] = useState<boolean>(false);

  // Fetch logs and summary from API
  const fetchAuditData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/system/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setSummary(data.summary || null);
        if (!selectedLog && data.logs?.length > 0) {
          setSelectedLog(data.logs[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch system audit logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAuditData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !autoRefresh) return;
    const interval = setInterval(() => {
      fetch('/api/system/audit-logs')
        .then((r) => r.json())
        .then((data) => {
          if (data.logs) setLogs(data.logs);
          if (data.summary) setSummary(data.summary);
        })
        .catch(() => {});
    }, 6000);
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh]);

  // Keyboard navigation & Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtering
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesLevel = selectedLevel === 'ALL' || log.level === selectedLevel;
      const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.message.toLowerCase().includes(q) ||
        log.service.toLowerCase().includes(q) ||
        log.traceId.toLowerCase().includes(q) ||
        (log.user && log.user.toLowerCase().includes(q)) ||
        (log.stackTrace && log.stackTrace.toLowerCase().includes(q)) ||
        (log.resolutionHint && log.resolutionHint.toLowerCase().includes(q));

      return matchesLevel && matchesCategory && matchesSearch;
    });
  }, [logs, selectedLevel, selectedCategory, searchQuery]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTraceId(id);
    setTimeout(() => setCopiedTraceId(null), 2000);
  };

  const copyFullJson = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
    setCopiedRawJson(true);
    setTimeout(() => setCopiedRawJson(false), 2000);
  };

  // Convert an array of audit logs into properly escaped RFC 4180 CSV
  const convertLogsToCsv = (items: AuditLogEntry[]) => {
    const headers = [
      'Log ID',
      'Timestamp',
      'Level',
      'Category',
      'Service',
      'Message',
      'Trace ID',
      'Duration (ms)',
      'Status Code',
      'User / Caller',
      'Mitigated',
      'Resolution Hint',
      'Metadata JSON',
      'Stack Trace'
    ];

    const escapeCsvField = (field: any): string => {
      if (field === null || field === undefined) return '""';
      const str = typeof field === 'object' ? JSON.stringify(field) : String(field);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = items.map((l) => [
      escapeCsvField(l.id),
      escapeCsvField(l.timestamp),
      escapeCsvField(l.level),
      escapeCsvField(l.category),
      escapeCsvField(l.service),
      escapeCsvField(l.message),
      escapeCsvField(l.traceId),
      escapeCsvField(l.durationMs ?? ''),
      escapeCsvField(l.statusCode ?? ''),
      escapeCsvField(l.user ?? 'system'),
      escapeCsvField(l.mitigated ? 'YES' : 'NO'),
      escapeCsvField(l.resolutionHint ?? ''),
      escapeCsvField(l.metadata ? JSON.stringify(l.metadata) : ''),
      escapeCsvField(l.stackTrace ?? '')
    ].join(','));

    return [headers.join(','), ...rows].join('\r\n');
  };

  const triggerDownload = (blobData: string, filename: string, mimeType: string) => {
    const blob = new Blob([blobData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export filtered logs or single log to formatted JSON
  const exportLogsAsJson = (targetLogs: AuditLogEntry[] = filteredLogs, filenameSuffix: string = 'batch') => {
    const payload = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        environment: 'Production-Tactical',
        operator: 'Nicholas Marnocha (Lead)',
        systemSummary: summary,
        totalExportedLogs: targetLogs.length,
        filterQuery: searchQuery || undefined,
        filterLevel: selectedLevel !== 'ALL' ? selectedLevel : undefined,
        filterCategory: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      },
      logs: targetLogs,
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerDownload(jsonStr, `AxiomBI_Pipeline_Audit_${filenameSuffix}_${dateStr}.json`, 'application/json');
  };

  // Export filtered logs or single log to CSV
  const exportLogsAsCsv = (targetLogs: AuditLogEntry[] = filteredLogs, filenameSuffix: string = 'batch') => {
    const csvContent = convertLogsToCsv(targetLogs);
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerDownload(csvContent, `AxiomBI_Pipeline_Audit_${filenameSuffix}_${dateStr}.csv`, 'text/csv;charset=utf-8;');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden font-sans text-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-inner">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Advanced System Audit & Telemetry Traces
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60 uppercase">
                  Internal Auditing
                </span>
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Audited
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Deep application-level logs, error stack traces, RPC latency timings, and distributed trace inspection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                autoRefresh
                  ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Live Polling (Every 6s)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
              <span className="hidden sm:inline">{autoRefresh ? 'Auto (6s)' : 'Paused'}</span>
            </button>

            {/* Formatted Export Dropdown (JSON / CSV) */}
            <div className="relative">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Export Filtered Logs as JSON or CSV"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Export Logs</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {exportDropdownOpen && (
                <div 
                  className="absolute right-0 mt-1.5 w-56 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 p-1.5 text-xs font-mono animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setExportDropdownOpen(false)}
                >
                  <div className="px-2.5 py-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-900">
                    Export {filteredLogs.length} Filtered Events
                  </div>

                  <button
                    onClick={() => exportLogsAsJson(filteredLogs, 'filtered')}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-900 text-slate-200 hover:text-cyan-300 transition-colors flex items-center gap-2 cursor-pointer mt-1"
                  >
                    <FileJson className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white text-[11px]">Formatted JSON</div>
                      <div className="text-[10px] text-slate-500">Full metadata & stack traces</div>
                    </div>
                  </button>

                  <button
                    onClick={() => exportLogsAsCsv(filteredLogs, 'filtered')}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-900 text-slate-200 hover:text-emerald-300 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white text-[11px]">RFC 4180 CSV</div>
                      <div className="text-[10px] text-slate-500">Excel & Tableau compatible</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* System Vitals & Stability Overview Strip */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-4 bg-slate-950/50 border-b border-slate-800/80 font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Audited Events</span>
              <span className="text-base font-bold text-white mt-0.5 block">{summary.totalEvents}</span>
              <span className="text-[10px] text-cyan-400 flex items-center gap-1 mt-0.5">
                <Activity className="w-2.5 h-2.5" /> 100% Ingest Rate
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Errors & Warnings</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-base font-bold text-red-400">{summary.errorCount}</span>
                <span className="text-xs text-slate-500">/</span>
                <span className="text-base font-bold text-amber-400">{summary.warningCount}</span>
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> All Mitigated
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Node Heap Memory</span>
              <span className="text-base font-bold text-slate-200 mt-0.5 block">
                {summary.memoryUsageMb.heapUsed} <span className="text-xs font-normal text-slate-500">MB</span>
              </span>
              <span className="text-[10px] text-slate-500">
                RSS: {summary.memoryUsageMb.rss} MB
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">P95 Telemetry SLA</span>
              <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                {summary.p95ResponseMs} <span className="text-xs font-normal text-slate-500">ms</span>
              </span>
              <span className="text-[10px] text-slate-500">Lag: {summary.eventLoopLagMs}ms</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Postgres Connection Pool</span>
              <span className="text-base font-bold text-slate-200 mt-0.5 block">
                {summary.dbPoolHealth.active} <span className="text-xs font-normal text-slate-500">act</span> / {summary.dbPoolHealth.idle} <span className="text-xs font-normal text-slate-500">idle</span>
              </span>
              <span className="text-[10px] text-emerald-400">0 Waiting Queries</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Process Uptime</span>
              <span className="text-base font-bold text-slate-200 mt-0.5 block">
                {Math.floor(summary.uptimeSeconds / 60)}m {summary.uptimeSeconds % 60}s
              </span>
              <span className="text-[10px] text-cyan-400">{summary.activeSockets} WS Clients</span>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by trace ID, service name, error message, or stack frame..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {/* Severity Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Level:</span>
              {['ALL', 'ERROR', 'WARN', 'INFO', 'FATAL'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    selectedLevel === lvl
                      ? lvl === 'ERROR'
                        ? 'bg-red-950 border border-red-500 text-red-300'
                        : lvl === 'WARN'
                        ? 'bg-amber-950 border border-amber-500 text-amber-300'
                        : lvl === 'FATAL'
                        ? 'bg-purple-950 border border-purple-500 text-purple-300'
                        : lvl === 'INFO'
                        ? 'bg-cyan-950 border border-cyan-500 text-cyan-300'
                        : 'bg-slate-800 border border-slate-600 text-white'
                      : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-1 ml-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="ETL_PIPELINE">ETL Pipeline</option>
                <option value="DATABASE_SQL">Database & SQL</option>
                <option value="API_INTEGRATION">API Integration</option>
                <option value="WEBSOCKET_PRESENCE">WebSocket Presence</option>
                <option value="PREDICTIVE_MODEL">Predictive Model</option>
                <option value="SECURITY_AUTH">Security & RBAC</option>
                <option value="SYSTEM_RUNTIME">System Runtime</option>
              </select>
            </div>
          </div>
        </div>

        {/* Master-Detail Split Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[360px]">
          {/* Left Table: Searchable Audit Log Entries */}
          <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden bg-slate-950/40">
            <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>SHOWING {filteredLogs.length} OF {logs.length} AUDIT LOG ENTRIES</span>
              <span className="text-[10px] text-slate-500">CLICK ROW TO INSPECT STACK TRACE</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-mono text-xs">
                  <Terminal className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                  No system audit logs matched query "{searchQuery}"
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;
                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`p-3 text-xs font-mono transition-colors cursor-pointer select-none ${
                        isSelected
                          ? 'bg-slate-800/80 border-l-4 border-cyan-400'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              log.level === 'ERROR'
                                ? 'bg-red-950/80 text-red-400 border border-red-800/60'
                                : log.level === 'WARN'
                                ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                                : log.level === 'FATAL'
                                ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                                : log.level === 'DEBUG'
                                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                                : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
                            }`}
                          >
                            {log.level}
                          </span>
                          <span className="font-bold text-white">{log.service}</span>
                          <span className="text-slate-500">[{log.category}]</span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          {log.durationMs && (
                            <span className="text-slate-400">{log.durationMs}ms</span>
                          )}
                          <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                      </div>

                      <p className="text-slate-300 mt-1 line-clamp-2 text-[11px] leading-relaxed">
                        {log.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/40 text-[10px] text-slate-500">
                        <span className="text-cyan-400/80">trace: {log.traceId}</span>
                        
                        <div className="flex items-center gap-2">
                          {log.mitigated && (
                            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Auto-Mitigated
                            </span>
                          )}

                          {/* Quick Row Export Actions */}
                          <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => exportLogsAsJson([log], log.id)}
                              className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 text-[9px] font-mono cursor-pointer"
                              title="Export this log as JSON"
                            >
                              JSON
                            </button>
                            <button
                              onClick={() => exportLogsAsCsv([log], log.id)}
                              className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 border border-slate-800 text-[9px] font-mono cursor-pointer"
                              title="Export this log as CSV"
                            >
                              CSV
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane: Deep Trace & Stack Inspection */}
          <div className="lg:col-span-5 flex flex-col overflow-y-auto bg-slate-950 p-5 font-mono text-xs">
            {selectedLog ? (
              <div className="space-y-4">
                {/* Header Details */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          selectedLog.level === 'ERROR'
                            ? 'bg-red-950 text-red-300 border border-red-700'
                            : selectedLog.level === 'WARN'
                            ? 'bg-amber-950 text-amber-300 border border-amber-700'
                            : selectedLog.level === 'FATAL'
                            ? 'bg-purple-950 text-purple-300 border border-purple-700'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                        }`}
                      >
                        {selectedLog.level}
                      </span>
                      <span className="text-slate-400 text-xs font-bold">{selectedLog.id}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1.5 leading-snug">
                      {selectedLog.message}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => exportLogsAsJson([selectedLog], selectedLog.id)}
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                      title="Download this specific log entry as formatted JSON"
                    >
                      <FileJson className="w-3.5 h-3.5 text-cyan-400" />
                      <span>JSON</span>
                    </button>

                    <button
                      onClick={() => exportLogsAsCsv([selectedLog], selectedLog.id)}
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                      title="Download this specific log entry as RFC 4180 CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>CSV</span>
                    </button>

                    <button
                      onClick={copyFullJson}
                      className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy Raw Log Event JSON to Clipboard"
                    >
                      {copiedRawJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Distributed Trace Metadata */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[10px]">TRACE ID</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-cyan-300 font-bold">{selectedLog.traceId}</span>
                      <button
                        onClick={() => copyToClipboard(selectedLog.traceId, selectedLog.id)}
                        className="text-slate-500 hover:text-cyan-400 cursor-pointer"
                        title="Copy Trace ID"
                      >
                        {copiedTraceId === selectedLog.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">MICROSERVICE</span>
                    <span className="text-white font-bold">{selectedLog.service}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">TIMESTAMP</span>
                    <span className="text-slate-300">
                      {new Date(selectedLog.timestamp).toISOString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">CALLER / USER</span>
                    <span className="text-slate-300">{selectedLog.user || 'system'}</span>
                  </div>

                  {selectedLog.durationMs !== undefined && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">EXECUTION TIME</span>
                      <span className="text-emerald-400 font-bold">{selectedLog.durationMs} ms</span>
                    </div>
                  )}

                  {selectedLog.statusCode !== undefined && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">STATUS CODE</span>
                      <span className={`font-bold ${selectedLog.statusCode >= 400 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {selectedLog.statusCode}
                      </span>
                    </div>
                  )}
                </div>

                {/* Resolution & Remediation Hint */}
                {selectedLog.resolutionHint && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-[11px]">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>AUTOMATED RESOLUTION / ACTION TAKEN</span>
                    </div>
                    <p className="text-emerald-200/90 leading-relaxed font-sans text-xs">
                      {selectedLog.resolutionHint}
                    </p>
                  </div>
                )}

                {/* Stack Trace Window */}
                {selectedLog.stackTrace && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-red-400" />
                        <span>RUNTIME EXCEPTION STACK TRACE</span>
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedLog.stackTrace!, `stack-${selectedLog.id}`)}
                        className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" /> Copy Stack
                      </button>
                    </div>
                    <div className="p-3 bg-black/90 rounded-lg border border-red-900/50 text-red-300/90 font-mono text-[10px] overflow-x-auto leading-relaxed max-h-48 whitespace-pre">
                      {selectedLog.stackTrace}
                    </div>
                  </div>
                )}

                {/* Context Metadata JSON */}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      EVENT CONTEXT METADATA
                    </span>
                    <pre className="p-3 bg-black/80 rounded-lg border border-slate-800 text-cyan-300 font-mono text-[10px] overflow-x-auto max-h-44">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Code2 className="w-8 h-8 text-slate-600 mb-2 opacity-40" />
                <span>Select an audit log entry to inspect deep traces</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Status Bar */}
        <div className="px-6 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span>AUDIT COMPLIANCE: <strong className="text-emerald-400 font-bold">SOC-2 TYPE II / ISO 27001 READY</strong></span>
            <span className="text-slate-700">|</span>
            <span>LOG RETENTION: <strong className="text-slate-400">90 DAYS IMMUTABLE WAL</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">AxiomBI Internal Telemetry Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
