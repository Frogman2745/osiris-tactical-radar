import React, { useState, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { 
  Database, 
  Play, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  ChevronRight,
  ChevronDown,
  Search,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Layers,
  Flame,
  RotateCcw
} from 'lucide-react';

export interface SchemaColumn {
  name: string;
  type: string;
  isPk?: boolean;
  isIndex?: boolean;
  sample?: string;
}

export interface SchemaTable {
  name: string;
  description: string;
  rowCount: string;
  columns: SchemaColumn[];
}

export const MonacoSqlQueryEditor: React.FC = () => {
  // Monaco SQL Query State
  const [sqlQuery, setSqlQuery] = useState<string>(
`-- AxiomBI Production Telemetry Query (PostgreSQL 16)
-- Keyboard Shortcut: Press Cmd+Enter or Ctrl+Enter to execute live
SELECT 
    base_name,
    category,
    COUNT(*) AS total_aircraft,
    ROUND(AVG(turnaround_time_mins), 1) AS avg_turnaround_mins,
    SUM(retardant_gallons) AS total_gallons_capacity,
    SUM(CASE WHEN sla_compliance = TRUE THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS sla_compliance_pct
FROM flight_telemetry
GROUP BY base_name, category
ORDER BY avg_turnaround_mins ASC;`
  );

  const [nlSqlPrompt, setNlSqlPrompt] = useState<string>('');
  const [isAiGeneratingSql, setIsAiGeneratingSql] = useState<boolean>(false);
  const [isExecutingSql, setIsExecutingSql] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Live Query Results State
  const [sqlResults, setSqlResults] = useState<{
    columns: string[];
    rows: any[];
    executionPlan?: { scanType: string; actualTimeMs: number; rowsReturned: number; estimatedCost?: number };
  }>({
    columns: ['base_name', 'category', 'total_aircraft', 'avg_turnaround_mins', 'total_gallons_capacity', 'sla_compliance_pct'],
    rows: [
      { base_name: 'Redding Air Attack Base', category: 'AirTanker', total_aircraft: 2, avg_turnaround_mins: 14.2, total_gallons_capacity: 1200, sla_compliance_pct: 100.0 },
      { base_name: 'Boggs Mountain Heli-base', category: 'Helitack', total_aircraft: 1, avg_turnaround_mins: 11.8, total_gallons_capacity: 1000, sla_compliance_pct: 100.0 },
      { base_name: 'McClellan Tanker Base', category: 'AirTanker', total_aircraft: 2, avg_turnaround_mins: 20.7, total_gallons_capacity: 4000, sla_compliance_pct: 50.0 },
      { base_name: 'Humboldt Bay Ops Base', category: 'Helitack', total_aircraft: 2, avg_turnaround_mins: 17.8, total_gallons_capacity: 1360, sla_compliance_pct: 50.0 },
      { base_name: 'Paso Robles Base', category: 'AirTanker', total_aircraft: 1, avg_turnaround_mins: 18.5, total_gallons_capacity: 0, sla_compliance_pct: 100.0 },
    ],
    executionPlan: { scanType: 'Index Scan on idx_flight_telemetry_base', actualTimeMs: 14.2, rowsReturned: 5, estimatedCost: 1.42 },
  });

  // Schema Browser State
  const [schemaSearch, setSchemaSearch] = useState<string>('');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({
    flight_telemetry: true,
    pacific_wildfire_missions: false,
    base_locations: false,
    cpsat_dispatch_decisions: false,
    job_market_signals: false,
  });

  // Monaco Editor Reference
  const editorRef = useRef<any>(null);

  // PostgreSQL Internal Schema Definition
  const schemaTables: SchemaTable[] = [
    {
      name: 'flight_telemetry',
      description: 'Mixed-fleet transponder telemetry, SLAs, fuel %, & load tickets',
      rowCount: '482.1k rows',
      columns: [
        { name: 'aircraft_id', type: 'VARCHAR(32)', isPk: true, isIndex: true, sample: 'TANKER-80' },
        { name: 'callsign', type: 'VARCHAR(48)', sample: 'Tanker 80' },
        { name: 'model', type: 'VARCHAR(32)', sample: 'S-2T Turbo Tracker' },
        { name: 'category', type: 'VARCHAR(24)', isIndex: true, sample: 'AirTanker' },
        { name: 'base_id', type: 'CHAR(3)', isIndex: true, sample: 'RDD' },
        { name: 'base_name', type: 'VARCHAR(64)', sample: 'Redding Air Attack Base' },
        { name: 'status', type: 'VARCHAR(24)', sample: 'In-Flight' },
        { name: 'fuel_pct', type: 'NUMERIC(5,2)', sample: '68.0' },
        { name: 'retardant_gallons', type: 'INTEGER', sample: '1200' },
        { name: 'flight_hours_mtd', type: 'NUMERIC(6,2)', sample: '78.4' },
        { name: 'turnaround_time_mins', type: 'NUMERIC(5,2)', isIndex: true, sample: '14.2' },
        { name: 'last_maintenance_date', type: 'DATE', sample: '2026-09-18' },
        { name: 'sla_compliance', type: 'BOOLEAN', isIndex: true, sample: 'TRUE' },
      ],
    },
    {
      name: 'pacific_wildfire_missions',
      description: 'Active Pacific wildfire suppression sorties, VLAT air tankers & NASA FIRMS thermal perimeters',
      rowCount: '20 active resources',
      columns: [
        { name: 'mission_id', type: 'UUID', isPk: true, sample: 'wf-pac-098' },
        { name: 'incident_name', type: 'VARCHAR(64)', isIndex: true, sample: 'Shasta Complex Fire' },
        { name: 'fire_acres', type: 'INTEGER', sample: '4820' },
        { name: 'containment_pct', type: 'NUMERIC(4,1)', sample: '15.0' },
        { name: 'primary_airframe', type: 'VARCHAR(48)', sample: 'Tanker 910 (DC-10 VLAT)' },
        { name: 'retardant_dropped_gal', type: 'INTEGER', sample: '9400' },
        { name: 'wind_speed_kts', type: 'INTEGER', sample: '22' },
        { name: 'status', type: 'VARCHAR(24)', sample: 'Extreme Crown Run' },
      ],
    },
    {
      name: 'base_locations',
      description: 'Air attack tanker bases & forward staging heli-bases',
      rowCount: '8 bases',
      columns: [
        { name: 'base_id', type: 'CHAR(3)', isPk: true, sample: 'RDD' },
        { name: 'base_name', type: 'VARCHAR(64)', sample: 'Redding Air Attack Base' },
        { name: 'latitude', type: 'NUMERIC(8,5)', sample: '40.5089' },
        { name: 'longitude', type: 'NUMERIC(8,5)', sample: '-122.2934' },
        { name: 'retardant_pit_capacity_gal', type: 'INTEGER', sample: '120000' },
        { name: 'simultaneous_load_slots', type: 'INTEGER', sample: '3' },
        { name: 'runway_length_ft', type: 'INTEGER', sample: '7003' },
      ],
    },
    {
      name: 'cpsat_dispatch_decisions',
      description: 'Google OR-Tools CP-SAT mathematical optimization solver decisions',
      rowCount: '1.4k decisions',
      columns: [
        { name: 'decision_id', type: 'UUID', isPk: true, sample: 'd198-44b2' },
        { name: 'incident_id', type: 'VARCHAR(32)', isIndex: true, sample: 'INC-SHASTA-01' },
        { name: 'assigned_airframe_id', type: 'VARCHAR(32)', sample: 'TANKER-80' },
        { name: 'solver_runtime_ms', type: 'INTEGER', sample: '210' },
        { name: 'naive_baseline_mins', type: 'NUMERIC(5,2)', sample: '21.1' },
        { name: 'cpsat_optimized_mins', type: 'NUMERIC(5,2)', sample: '16.2' },
        { name: 'optimization_gain_pct', type: 'NUMERIC(4,2)', sample: '23.4' },
        { name: 'cisrm_hard_constraints_met', type: 'BOOLEAN', sample: 'TRUE' },
      ],
    },
    {
      name: 'job_market_signals',
      description: 'Career application pipeline & portfolio performance tracking',
      rowCount: '24 applications',
      columns: [
        { name: 'app_id', type: 'VARCHAR(32)', isPk: true, sample: 'app-anduril' },
        { name: 'company', type: 'VARCHAR(64)', sample: 'Anduril Industries' },
        { name: 'role', type: 'VARCHAR(64)', sample: 'Operations Specialist' },
        { name: 'stage', type: 'VARCHAR(32)', sample: 'Technical' },
        { name: 'resume_version', type: 'VARCHAR(32)', sample: 'Defense / Operations' },
        { name: 'match_score_pct', type: 'INTEGER', sample: '96' },
        { name: 'portfolio_proof_verified', type: 'BOOLEAN', sample: 'TRUE' },
      ],
    },
  ];

  // Execute SQL Query against the backend PostgreSQL engine
  const handleExecuteSql = async () => {
    setIsExecutingSql(true);
    setQueryError(null);
    try {
      const res = await fetch('/api/sql/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      setSqlResults(data);
    } catch (err: any) {
      setQueryError(err.message || 'Execution error against live Postgres instance');
    } finally {
      setIsExecutingSql(false);
    }
  };

  // Natural Language to SQL Assistant via Gemini API
  const handleNlToSql = async () => {
    if (!nlSqlPrompt.trim()) return;
    setIsAiGeneratingSql(true);
    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: nlSqlPrompt, mode: 'sql' }),
      });
      const data = await res.json();
      if (data.sql) {
        setSqlQuery(data.sql);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiGeneratingSql(false);
    }
  };

  // Monaco Editor onMount handler: bind Cmd+Enter / Ctrl+Enter shortcut
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Add Cmd+Enter / Ctrl+Enter shortcut for live execution
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleExecuteSql();
    });
  };

  // Insert text into Monaco editor at the current cursor location
  const insertTextAtCursor = (text: string) => {
    if (editorRef.current) {
      const position = editorRef.current.getPosition();
      editorRef.current.executeEdits('', [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
          text,
          forceMoveMarkers: true,
        },
      ]);
      editorRef.current.focus();
    } else {
      setSqlQuery((prev) => prev + '\n' + text);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const exportCsv = () => {
    if (!sqlResults.columns.length) return;
    const header = sqlResults.columns.join(',');
    const rows = sqlResults.rows.map(r => sqlResults.columns.map(c => JSON.stringify(r[c] ?? '')).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + header + '\n' + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "axiombi_postgres_telemetry_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleTableExpansion = (tableName: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

  // Filter schema tables and columns
  const filteredTables = schemaTables.map((table) => {
    if (!schemaSearch.trim()) return table;
    const searchLower = schemaSearch.toLowerCase();
    const tableMatches = table.name.toLowerCase().includes(searchLower) || table.description.toLowerCase().includes(searchLower);
    const matchedColumns = table.columns.filter(c => c.name.toLowerCase().includes(searchLower) || c.type.toLowerCase().includes(searchLower));
    
    if (tableMatches || matchedColumns.length > 0) {
      return {
        ...table,
        columns: tableMatches ? table.columns : matchedColumns,
      };
    }
    return null;
  }).filter(Boolean) as SchemaTable[];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT: INTERACTIVE POSTGRES SCHEMA BROWSER SIDEBAR (4 cols) */}
      <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col space-y-3 max-h-[740px]">
        
        {/* Schema Sidebar Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Postgres Schema Browser
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
            LIVE POSTGRESQL 16
          </span>
        </div>

        {/* Quick Schema Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={schemaSearch}
            onChange={(e) => setSchemaSearch(e.target.value)}
            placeholder="Filter tables or columns (e.g. turnaround, status)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        {/* Tables & Columns Tree View */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredTables.map((table) => {
            const isExpanded = expandedTables[table.name] ?? false;

            return (
              <div key={table.name} className="border border-slate-900 rounded-lg bg-slate-900/30 overflow-hidden">
                {/* Table Header Row */}
                <div
                  onClick={() => toggleTableExpansion(table.name)}
                  className="flex items-center justify-between p-2.5 hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-cyan-300 font-mono truncate">
                      {table.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono shrink-0">
                    <span className="text-slate-500">{table.rowCount}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        insertTextAtCursor(`SELECT * FROM ${table.name} LIMIT 10;\n`);
                      }}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-cyan-900/60 hover:text-cyan-300 text-slate-400 transition-colors"
                      title={`Insert SELECT * FROM ${table.name}`}
                    >
                      +SELECT
                    </button>
                  </div>
                </div>

                {/* Columns Dropdown List */}
                {isExpanded && (
                  <div className="p-2 pt-0 border-t border-slate-900/80 bg-slate-950/60 space-y-1">
                    <div className="text-[10px] text-slate-500 font-mono py-1 px-1">
                      {table.description}
                    </div>
                    {table.columns.map((col) => (
                      <div
                        key={col.name}
                        onClick={() => insertTextAtCursor(col.name)}
                        className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-800/60 text-[11px] font-mono transition-colors cursor-pointer group"
                        title={`Click to insert '${col.name}' into editor (Sample: ${col.sample || 'N/A'})`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {col.isPk ? (
                            <span title="Primary Key" className="shrink-0"><KeyRound className="w-3 h-3 text-amber-400" /></span>
                          ) : col.isIndex ? (
                            <span title="Indexed Column" className="shrink-0"><CheckCircle2 className="w-3 h-3 text-cyan-500" /></span>
                          ) : (
                            <span className="w-3 h-3 block text-slate-600 font-bold text-center">·</span>
                          )}
                          <span className="text-slate-300 group-hover:text-cyan-300 font-medium truncate">
                            {col.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 group-hover:text-slate-400 shrink-0">
                          {col.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Preset Queries Bar */}
        <div className="pt-2.5 border-t border-slate-800/80">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block mb-1.5">
            Preset Operational Templates
          </span>
          <div className="space-y-1">
            {[
              {
                label: 'Turnaround SLA by Airbase',
                query: `SELECT \n    base_name, \n    category, \n    COUNT(*) AS sorties, \n    ROUND(AVG(turnaround_time_mins), 1) AS avg_turnaround \nFROM flight_telemetry \nGROUP BY base_name, category \nORDER BY avg_turnaround ASC;`,
              },
              {
                label: 'Critical SLA Breaches (>20m)',
                query: `SELECT \n    callsign, \n    model, \n    base_name, \n    turnaround_time_mins, \n    retardant_gallons \nFROM flight_telemetry \nWHERE sla_compliance = FALSE OR turnaround_time_mins > 20.0;`,
              },
              {
                label: 'Pacific Wildfire Suppression Payloads',
                query: `SELECT \n    incident_name, \n    primary_airframe, \n    fire_acres, \n    containment_pct, \n    retardant_dropped_gal \nFROM pacific_wildfire_missions \nORDER BY fire_acres DESC;`,
              },
              {
                label: 'High-Utilization Airframes (>=75 hrs)',
                query: `SELECT \n    aircraft_id, \n    callsign, \n    flight_hours_mtd, \n    last_maintenance_date \nFROM flight_telemetry \nWHERE flight_hours_mtd >= 75.0 \nORDER BY flight_hours_mtd DESC;`,
              },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSqlQuery(item.query)}
                className="w-full text-left text-[11px] font-mono text-slate-400 hover:text-cyan-300 p-1.5 rounded hover:bg-slate-900 transition-colors truncate cursor-pointer block"
              >
                › {item.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT: MONACO EDITOR & LIVE RESULTS GRID (8 cols) */}
      <div className="lg:col-span-8 space-y-4">
        
        {/* Natural Language to SQL Assistant Bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            type="text"
            value={nlSqlPrompt}
            onChange={(e) => setNlSqlPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNlToSql()}
            placeholder="Ask Gemini to generate SQL (e.g., 'Find all aircraft with turnaround > 15m and compliance status')"
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none font-mono"
          />
          <button
            onClick={handleNlToSql}
            disabled={isAiGeneratingSql || !nlSqlPrompt.trim()}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors disabled:opacity-40 whitespace-nowrap cursor-pointer shrink-0"
          >
            {isAiGeneratingSql ? 'Generating...' : 'Generate SQL'}
          </button>
        </div>

        {/* Monaco Editor Container */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          
          {/* Editor Top Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-white font-bold">Monaco SQL Query Console</span>
              <span className="text-slate-500 text-[11px]">· PostgreSQL 16</span>
              <span className="hidden sm:inline text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                Cmd+Enter to Execute
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(sqlQuery, 'sql')}
                className="flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-white transition-colors cursor-pointer text-[11px] rounded hover:bg-slate-800"
                title="Copy Query"
              >
                {copiedKey === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'sql' ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleExecuteSql}
                disabled={isExecutingSql}
                className="flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 rounded-md transition-all cursor-pointer shadow-sm shadow-cyan-950"
              >
                <Play className={`w-3 h-3 fill-current ${isExecutingSql ? 'animate-spin' : ''}`} />
                <span>{isExecutingSql ? 'Executing...' : 'Run Query'}</span>
              </button>
            </div>
          </div>

          {/* Monaco Component */}
          <div className="border-b border-slate-900">
            <Editor
              height="280px"
              language="sql"
              theme="vs-dark"
              value={sqlQuery}
              onChange={(val) => setSqlQuery(val || '')}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                tabSize: 2,
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          {/* Execution Error Banner (if any) */}
          {queryError && (
            <div className="p-3 bg-red-950/60 border-b border-red-800/80 text-red-300 font-mono text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Query Execution Error: {queryError}</span>
            </div>
          )}

          {/* Query Execution Plan Status Bar */}
          <div className="px-4 py-2 bg-slate-950 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Plan: {sqlResults.executionPlan?.scanType || 'Index Scan'}</span>
              </span>
              <span>Execution: <strong className="text-cyan-400 font-bold">{sqlResults.executionPlan?.actualTimeMs || 14.2}ms</strong></span>
              <span>Cost: {sqlResults.executionPlan?.estimatedCost || 1.42}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{sqlResults.rows.length} rows returned</span>
            </div>
          </div>
        </div>

        {/* Live Query Results Grid */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="font-bold text-white uppercase tracking-wider">Live Results Grid</span>
              <span className="text-slate-500">({sqlResults.rows.length} records)</span>
            </div>

            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Tabular Output */}
          <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-64">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0">
                <tr>
                  {sqlResults.columns.map((col) => (
                    <th key={col} className="py-2.5 px-3 whitespace-nowrap text-cyan-400 font-bold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 tabular-nums">
                {sqlResults.rows.length > 0 ? (
                  sqlResults.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      {sqlResults.columns.map((col) => (
                        <td key={col} className="py-2 px-3 text-slate-300 whitespace-nowrap">
                          {typeof row[col] === 'boolean' 
                            ? (row[col] ? <span className="text-emerald-400 font-bold">TRUE</span> : <span className="text-red-400 font-bold">FALSE</span>)
                            : String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={sqlResults.columns.length || 1} className="py-6 text-center text-slate-500">
                      0 rows returned from query
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
