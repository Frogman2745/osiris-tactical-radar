import React, { useState, useEffect } from 'react';
import { GlobalPipelineVariable } from '../types';
import {
  Variable,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Lock,
  Eye,
  EyeOff,
  Search,
  Filter,
  RefreshCw,
  Copy,
  Sliders,
  Database,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';

interface GlobalVariableStoreProps {
  onAddActivityLog?: (action: string) => void;
  isPipelineRunning: boolean;
}

const LOCAL_STORAGE_KEY = 'axiom_bi_global_pipeline_variables';

const DEFAULT_GLOBAL_VARIABLES: GlobalPipelineVariable[] = [
  {
    key: 'MAX_SORTIE_AIRTIME_MINS',
    value: '240',
    type: 'number',
    description: 'FAA NWCG Part 135 flight time ceiling per pilot mission sortie.',
    isSecret: false,
    category: 'Threshold',
    updatedAt: '2026-10-01 14:30',
  },
  {
    key: 'AIRFRAME_TELEMETRY_INGEST_ENDPOINT',
    value: 'wss://example.invalid/demo/adsb-stream',
    type: 'string',
    description: 'Non-routable example endpoint for synthetic scenario wiring. No agency connection is configured.',
    isSecret: false,
    category: 'API Endpoint',
    updatedAt: '2026-10-01 12:15',
  },
  {
    key: 'CPSAT_TIME_LIMIT_SECS',
    value: '45',
    type: 'number',
    description: 'Maximum Google OR-Tools CP-SAT constraint solver iteration deadline.',
    isSecret: false,
    category: 'Tuning',
    updatedAt: '2026-09-30 09:00',
  },
  {
    key: 'SIMULATION_ARCHIVE_TOKEN',
    value: 'DEMO_ONLY_NOT_A_SECRET',
    type: 'string',
    description: 'Masked placeholder used to demonstrate secret-field behavior. It is not a credential.',
    isSecret: true,
    category: 'Environment',
    updatedAt: '2026-09-28 18:22',
  },
  {
    key: 'DATA_PARTITION_RETENTION_MONTHS',
    value: '36',
    type: 'number',
    description: 'Partition expiration window for PostgreSQL telemetry analytical tables.',
    isSecret: false,
    category: 'Data Partition',
    updatedAt: '2026-09-29 11:40',
  },
  {
    key: 'STRICT_SCHEMA_DRIFT_ENFORCEMENT',
    value: 'true',
    type: 'boolean',
    description: 'Immediately quarantine non-compliant transponder bursts without pipeline halt.',
    isSecret: false,
    category: 'Threshold',
    updatedAt: '2026-10-01 08:10',
  },
];

export const GlobalVariableStore: React.FC<GlobalVariableStoreProps> = ({
  onAddActivityLog,
  isPipelineRunning,
}) => {
  const [variables, setVariables] = useState<GlobalPipelineVariable[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load global variables from localStorage:', e);
    }
    return DEFAULT_GLOBAL_VARIABLES;
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(variables));
    } catch (e) {
      console.warn('Failed to save global variables to localStorage:', e);
    }
  }, [variables]);

  // Filtering & search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New variable modal / inline creation state
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newKey, setNewKey] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');
  const [newType, setNewType] = useState<GlobalPipelineVariable['type']>('string');
  const [newCategory, setNewCategory] = useState<GlobalPipelineVariable['category']>('Environment');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newIsSecret, setNewIsSecret] = useState<boolean>(false);

  // Editing state
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');

  const filteredVariables = variables.filter((v) => {
    const matchesSearch =
      v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (!v.isSecret && v.value.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'ALL' || v.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const toggleRevealSecret = (key: string) => {
    setRevealedSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCreateVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    // Normalize key name (uppercase snake_case)
    const formattedKey = newKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    // Check if already exists
    if (variables.some((v) => v.key === formattedKey)) {
      alert(`Variable with key "${formattedKey}" already exists.`);
      return;
    }

    const created: GlobalPipelineVariable = {
      key: formattedKey,
      value: newValue.trim(),
      type: newType,
      description: newDesc.trim() || 'Global pipeline runtime parameter.',
      isSecret: newIsSecret,
      category: newCategory,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setVariables((prev) => [created, ...prev]);
    onAddActivityLog?.(`Added global pipeline variable: ${created.key} [${created.category}]`);

    // Reset form
    setNewKey('');
    setNewValue('');
    setNewDesc('');
    setNewIsSecret(false);
    setIsAddingNew(false);
  };

  const handleDeleteVariable = (keyToDelete: string) => {
    setVariables((prev) => prev.filter((v) => v.key !== keyToDelete));
    onAddActivityLog?.(`Removed global pipeline variable: ${keyToDelete}`);
  };

  const handleStartEdit = (v: GlobalPipelineVariable) => {
    setEditingKey(v.key);
    setEditValue(v.value);
    setEditDesc(v.description);
  };

  const handleSaveEdit = (key: string) => {
    setVariables((prev) =>
      prev.map((v) =>
        v.key === key
          ? {
              ...v,
              value: editValue,
              description: editDesc,
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : v
      )
    );
    setEditingKey(null);
    onAddActivityLog?.(`Updated global variable parameter: ${key}`);
  };

  const handleResetDefaults = () => {
    setVariables(DEFAULT_GLOBAL_VARIABLES);
    onAddActivityLog?.('Reset global pipeline variables to calibrated default baseline');
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-950/80 border border-teal-500/50 flex items-center justify-center text-teal-400 shadow-inner">
            <Variable className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight uppercase">
                Global Variable Store
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800/80">
                PERSISTENT CONFIG
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-slate-400 border border-slate-800">
                {variables.length} PARAMETERS
              </span>
            </div>
            <p className="text-slate-400 font-sans text-xs mt-0.5">
              Centralized runtime parameter store accessible across all pipeline stages (Ingest, Validation, CP-SAT Transform, and Load).
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingNew(true)}
            disabled={isPipelineRunning}
            className="px-3 py-1.5 rounded-lg bg-teal-950 hover:bg-teal-900 border border-teal-500/60 text-teal-300 font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-teal-950/40 disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-teal-400" />
            <span>Add Variable</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            title="Reset variables to defaults"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-slate-950/80 border border-slate-800/90 mb-4">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search variables by key, description, or value..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-teal-500/80 text-xs text-white placeholder-slate-500 transition-all outline-none"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
          {['ALL', 'Environment', 'Threshold', 'Data Partition', 'API Endpoint', 'Tuning'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-teal-950 text-teal-300 border border-teal-700/80 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* New Variable Inline Form Modal */}
      {isAddingNew && (
        <form
          onSubmit={handleCreateVariable}
          className="mb-5 p-4 rounded-xl bg-slate-950 border border-teal-500/50 shadow-lg shadow-teal-950/40 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-400" />
              <h4 className="text-xs font-bold text-white uppercase">Define New Global Variable</h4>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">
                Variable Key (SNAKE_CASE)
              </label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. MIN_TANKER_RETARDANT_GAL"
                required
                className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-teal-500 text-xs text-teal-300 font-mono outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">
                Value
              </label>
              <input
                type={newIsSecret ? 'password' : 'text'}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Parameter value..."
                required
                className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-teal-500 text-xs text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as GlobalPipelineVariable['category'])}
                className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-teal-500 text-xs text-slate-200 font-mono outline-none cursor-pointer"
              >
                <option value="Environment">Environment</option>
                <option value="Threshold">Threshold</option>
                <option value="Data Partition">Data Partition</option>
                <option value="API Endpoint">API Endpoint</option>
                <option value="Tuning">Tuning</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div className="sm:col-span-2">
              <label className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">
                Description / Engineering Purpose
              </label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Explanation of operational impact and consuming pipeline stages..."
                className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 focus:border-teal-500 text-xs text-slate-300 font-sans outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsSecret}
                  onChange={(e) => setNewIsSecret(e.target.checked)}
                  className="rounded border-slate-800 text-teal-500 focus:ring-teal-400 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  Mask Secret Value
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Variable</span>
            </button>
          </div>
        </form>
      )}

      {/* Variables Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-4 font-bold uppercase text-[10px] tracking-wider">Key Name</th>
              <th className="py-2.5 px-4 font-bold uppercase text-[10px] tracking-wider">Category</th>
              <th className="py-2.5 px-4 font-bold uppercase text-[10px] tracking-wider">Current Value</th>
              <th className="py-2.5 px-4 font-bold uppercase text-[10px] tracking-wider">Description</th>
              <th className="py-2.5 px-4 font-bold uppercase text-[10px] tracking-wider">Updated</th>
              <th className="py-2.5 px-4 font-bold uppercase text-[10px] tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
            {filteredVariables.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                  No matching variables found. Click "Add Variable" to create one.
                </td>
              </tr>
            ) : (
              filteredVariables.map((v) => {
                const isEditing = editingKey === v.key;
                const isSecretRevealed = revealedSecrets[v.key];
                const displayValue = v.isSecret && !isSecretRevealed ? '••••••••••••••••' : v.value;

                return (
                  <tr key={v.key} className="hover:bg-slate-800/30 transition-colors">
                    {/* Key Name */}
                    <td className="py-3 px-4 font-bold text-teal-300">
                      <div className="flex items-center gap-1.5">
                        {v.isSecret && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                        <span className="tracking-tight">{v.key}</span>
                        <button
                          onClick={() => handleCopy(v.key, `key-${v.key}`)}
                          className="text-slate-500 hover:text-teal-400 transition-colors p-0.5"
                          title="Copy key reference"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {copiedKey === `key-${v.key}` && (
                          <span className="text-[9px] text-teal-400 font-bold">Copied!</span>
                        )}
                      </div>
                    </td>

                    {/* Category Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          v.category === 'Threshold'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                            : v.category === 'API Endpoint'
                            ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80'
                            : v.category === 'Tuning'
                            ? 'bg-purple-950/80 text-purple-300 border-purple-800/80'
                            : v.category === 'Data Partition'
                            ? 'bg-blue-950/80 text-blue-300 border-blue-800/80'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {v.category}
                      </span>
                    </td>

                    {/* Value */}
                    <td className="py-3 px-4 font-mono text-white max-w-[260px] truncate">
                      {isEditing ? (
                        <input
                          type={v.isSecret ? 'password' : 'text'}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-2 py-1 rounded bg-slate-950 border border-teal-500 text-xs text-white outline-none"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{displayValue}</span>
                          {v.isSecret && (
                            <button
                              onClick={() => toggleRevealSecret(v.key)}
                              className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                              title={isSecretRevealed ? 'Hide Secret' : 'Reveal Secret'}
                            >
                              {isSecretRevealed ? (
                                <EyeOff className="w-3 h-3 text-amber-400" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleCopy(v.value, `val-${v.key}`)}
                            className="text-slate-500 hover:text-cyan-400 transition-colors p-0.5"
                            title="Copy value"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {copiedKey === `val-${v.key}` && (
                            <span className="text-[9px] text-cyan-400 font-bold">Copied!</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 text-slate-400 font-sans text-xs max-w-[280px]">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full px-2 py-1 rounded bg-slate-950 border border-teal-500 text-xs text-slate-200 outline-none"
                        />
                      ) : (
                        <span className="line-clamp-2" title={v.description}>
                          {v.description}
                        </span>
                      )}
                    </td>

                    {/* Updated At */}
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {v.updatedAt}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(v.key)}
                            className="p-1 rounded bg-teal-900/80 hover:bg-teal-800 text-teal-300 border border-teal-600 transition-colors cursor-pointer"
                            title="Save changes"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingKey(null)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Cancel edit"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEdit(v)}
                            disabled={isPipelineRunning}
                            className="p-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-teal-300 border border-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Edit parameter"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVariable(v.key)}
                            disabled={isPipelineRunning}
                            className="p-1 rounded bg-slate-950 hover:bg-red-950 text-slate-500 hover:text-red-400 border border-slate-800 hover:border-red-900 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Delete variable"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Usage Helper Footer */}
      <div className="mt-4 p-3 rounded-lg bg-teal-950/20 border border-teal-800/40 flex items-start gap-2.5 text-xs font-sans text-teal-200/90">
        <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-teal-300 font-mono">Consuming Variables in Code: </span>
          Reference global parameters inside custom ETL stages, CP-SAT constraints, and SQL partition sinks using{' '}
          <code className="px-1.5 py-0.5 rounded bg-slate-950 border border-teal-800/60 font-mono text-teal-300 text-[11px]">
            axiom.config.get('VARIABLE_KEY')
          </code>{' '}
          or environment variable mapping{' '}
          <code className="px-1.5 py-0.5 rounded bg-slate-950 border border-teal-800/60 font-mono text-teal-300 text-[11px]">
            process.env.AXIOM_VARIABLE_KEY
          </code>.
        </div>
      </div>
    </div>
  );
};
