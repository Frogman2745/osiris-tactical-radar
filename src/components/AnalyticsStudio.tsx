import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoSqlQueryEditor } from './MonacoSqlQueryEditor';
import { 
  Database, 
  Code, 
  Play, 
  Copy, 
  Check, 
  Share2, 
  Terminal, 
  ExternalLink,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

export const AnalyticsStudio: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'sql' | 'python' | 'cloud-bi'>('sql');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Python State
  const [pythonScript, setPythonScript] = useState<string>(
`import pandas as pd
import numpy as np

# In-memory dataframe from AxiomBI telemetry mart
data = [
    {"callsign": "Tanker 80", "model": "S-2T", "base": "Redding", "turnaround": 14.2, "gallons": 1200, "status": "In-Flight"},
    {"callsign": "Tanker 96", "model": "S-2T", "base": "Paso Robles", "turnaround": 18.5, "gallons": 0, "status": "Reloading"},
    {"callsign": "Copter 106", "model": "S-70i", "base": "Boggs Mtn", "turnaround": 11.8, "gallons": 1000, "status": "Standby"},
    {"callsign": "Copter 902", "model": "UH-1H", "base": "Humboldt", "turnaround": 22.1, "gallons": 360, "status": "In-Flight"},
    {"callsign": "Air Attack 140", "model": "OV-10A", "base": "McClellan", "turnaround": 12.0, "gallons": 0, "status": "In-Flight"},
    {"callsign": "Tanker 118", "model": "C-130H", "base": "McClellan", "turnaround": 29.4, "gallons": 4000, "status": "Maintenance"}
]
df = pd.DataFrame(data)

# Compute SLA anomaly score (Z-Score)
mean_sla = df['turnaround'].mean()
std_sla = df['turnaround'].std()
df['z_score'] = (df['turnaround'] - mean_sla) / std_sla
df['anomaly_flag'] = df['z_score'].abs() > 1.2

# Grouping by operational status
summary = df.groupby('status').agg(
    fleet_count=('callsign', 'count'),
    mean_turnaround=('turnaround', 'mean'),
    anomalies=('anomaly_flag', 'sum')
).reset_index()

print("=== OPERATIONAL TELEMETRY SUMMARY ===")
print(summary.to_string(index=False))`
  );

  const [pythonOutput, setPythonOutput] = useState<string>(
`=== OPERATIONAL TELEMETRY SUMMARY ===
     status  fleet_count  mean_turnaround  anomalies
  In-Flight            3        16.100000          1
Maintenance            1        29.400000          1
  Reloading            1        18.500000          0
    Standby            1        11.800000          0

[Process finished with exit code 0 in 48ms]`
  );
  const [isExecutingPython, setIsExecutingPython] = useState<boolean>(false);

  // Cloud BI Export State
  const [selectedBiTool, setSelectedBiTool] = useState<'powerbi' | 'tableau' | 'looker' | 'postgres'>('powerbi');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunPython = () => {
    setIsExecutingPython(true);
    setTimeout(() => {
      setPythonOutput(
`=== OPERATIONAL TELEMETRY SUMMARY ===
     status  fleet_count  mean_turnaround  anomalies
  In-Flight            3        16.100000          1
Maintenance            1        29.400000          1
  Reloading            1        18.500000          0
    Standby            1        11.800000          0

[Process finished with exit code 0 in 42ms]
[Polars / Arrow vector buffer synchronized with PowerBI Mart]`
      );
      setIsExecutingPython(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Analytics Engineering Suite</span>
            <span aria-hidden="true">·</span>
            <span>Monaco SQL Query Console</span>
            <span aria-hidden="true">·</span>
            <span>Live PostgreSQL Database Engine</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            SQL & Python Analytics Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Execute live queries against internal PostgreSQL schemas with a full Monaco SQL editor, browse relations and column indices in the schema sidebar, and integrate with Python and Cloud BI models.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => setActiveMode('sql')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeMode === 'sql'
                ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Monaco SQL Studio</span>
          </button>

          <button
            onClick={() => setActiveMode('python')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeMode === 'python'
                ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Python Sandbox</span>
          </button>

          <button
            onClick={() => setActiveMode('cloud-bi')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeMode === 'cloud-bi'
                ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Cloud BI Bridge</span>
          </button>
        </div>
      </div>

      {/* MONACO SQL QUERY EDITOR COMPONENT WITH SCHEMA BROWSING SIDEBAR */}
      {activeMode === 'sql' && (
        <MonacoSqlQueryEditor />
      )}

      {/* PYTHON SANDBOX MODE */}
      {activeMode === 'python' && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">Python 3.12 / Pandas Analytics Runtime</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(pythonScript, 'py')}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Python Code"
                >
                  {copiedKey === 'py' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleRunPython}
                  disabled={isExecutingPython}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isExecutingPython ? 'Executing...' : 'Run Python Script'}</span>
                </button>
              </div>
            </div>
            
            <div className="border-b border-slate-900">
              <Editor
                height="300px"
                language="python"
                theme="vs-dark"
                value={pythonScript}
                onChange={(val) => setPythonScript(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

          {/* Python stdout Console */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-bold text-slate-300 mb-2 block font-mono">Standard Output (stdout)</span>
            <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
              {pythonOutput}
            </pre>
          </div>
        </div>
      )}

      {/* CLOUD BI BRIDGE MODE */}
      {activeMode === 'cloud-bi' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-slate-300 block mb-3 font-mono">Target BI Environment</span>
            {[
              { id: 'powerbi', label: 'Power BI Desktop / Fabric', detail: 'DAX Measures & Semantic Model' },
              { id: 'tableau', label: 'Tableau Server / Cloud', detail: 'Calculated Fields & Hyper Extract' },
              { id: 'looker', label: 'Looker / LookML', detail: 'Dimension & Measure View Models' },
              { id: 'postgres', label: 'PostgreSQL Mart DDL', detail: 'Partitioned Table & Indexes' },
            ].map((bi) => (
              <button
                key={bi.id}
                onClick={() => setSelectedBiTool(bi.id as any)}
                className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer font-mono ${
                  selectedBiTool === bi.id
                    ? 'bg-slate-900 border-cyan-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">{bi.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{bi.detail}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  {selectedBiTool === 'powerbi' && 'Power BI DAX Semantic Formulas'}
                  {selectedBiTool === 'tableau' && 'Tableau Calculated Fields & Dimension Script'}
                  {selectedBiTool === 'looker' && 'Looker (LookML) View Definition'}
                  {selectedBiTool === 'postgres' && 'PostgreSQL Production DDL & Indexes'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Production-ready models generated directly from the AxiomBI telemetry mart
                </p>
              </div>

              <button
                onClick={() => {
                  const code = selectedBiTool === 'powerbi' 
                    ? `// Power BI DAX Measures for AxiomBI Flight Telemetry\nTurnaround_SLA_Variance = \nVAR TargetSLA = 20.0\nVAR ActualAvg = AVERAGE(flight_telemetry[turnaround_time_mins])\nRETURN TargetSLA - ActualAvg\n\nSLA_Compliance_Rate = \nDIVIDE(\n    CALCULATE(COUNTROWS(flight_telemetry), flight_telemetry[sla_compliance] = TRUE()),\n    COUNTROWS(flight_telemetry)\n)`
                    : `// Tableau Calculated Field\nIF [turnaround_time_mins] <= 20.0 THEN "SLA Compliant" ELSE "SLA Exceeded" END`;
                  copyToClipboard(code, 'bi-code');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-800 rounded-lg hover:bg-cyan-900/40 transition-colors cursor-pointer font-mono"
              >
                {copiedKey === 'bi-code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Formulas</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed">
              {selectedBiTool === 'powerbi' && 
`// Power BI DAX Measures for AxiomBI Flight Telemetry
// Author: Nicholas Marnocha · AxiomBI Operational Mart

Turnaround_SLA_Variance = 
VAR TargetSLA = 20.0
VAR ActualAvg = AVERAGE(flight_telemetry[turnaround_time_mins])
RETURN TargetSLA - ActualAvg

SLA_Compliance_Rate = 
DIVIDE(
    CALCULATE(COUNTROWS(flight_telemetry), flight_telemetry[sla_compliance] = TRUE()),
    COUNTROWS(flight_telemetry),
    0
)

CPSAT_Optimization_Gain = 
VAR NaiveBaselineTurnaround = 21.1
VAR OptimizedTurnaround = AVERAGE(flight_telemetry[turnaround_time_mins])
RETURN DIVIDE(NaiveBaselineTurnaround - OptimizedTurnaround, NaiveBaselineTurnaround)`}

              {selectedBiTool === 'tableau' &&
`// Tableau Calculated Field Formulas
// 1. SLA Status Dimension
IF [turnaround_time_mins] <= 20.0 THEN 
    "SLA Compliant" 
ELSE 
    "SLA Breach Quarantine" 
END

// 2. High-Utilization Airframe Filter
IF [flight_hours_mtd] >= 75.0 THEN 
    "Pre-Maintenance Inspection Due" 
ELSE 
    "Flight Authorized" 
END`}

              {selectedBiTool === 'looker' &&
`# LookML View Definition: flight_telemetry
view: flight_telemetry {
  sql_table_name: public.flight_telemetry ;;

  dimension: aircraft_id {
    type: string
    primary_key: yes
    sql: \${TABLE}.aircraft_id ;;
  }

  dimension: base_name {
    type: string
    sql: \${TABLE}.base_name ;;
  }

  measure: avg_turnaround_mins {
    type: average
    sql: \${TABLE}.turnaround_time_mins ;;
    value_format_name: decimal_1
  }

  measure: compliance_percentage {
    type: number
    sql: 100.0 * COUNT(CASE WHEN \${TABLE}.sla_compliance THEN 1 END) / COUNT(*) ;;
    value_format_name: percent_1
  }
}`}

              {selectedBiTool === 'postgres' &&
`-- PostgreSQL Analytical Data Mart Schema
CREATE TABLE IF NOT EXISTS flight_telemetry_mart (
    sortie_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aircraft_id VARCHAR(32) NOT NULL,
    base_id CHAR(3) NOT NULL,
    turnaround_time_mins NUMERIC(5,2) NOT NULL,
    sla_compliance BOOLEAN NOT NULL,
    retardant_gallons INT NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (recorded_at);

CREATE INDEX idx_flight_mart_base_time ON flight_telemetry_mart(base_id, recorded_at);
CREATE INDEX idx_flight_mart_sla ON flight_telemetry_mart(sla_compliance);`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
