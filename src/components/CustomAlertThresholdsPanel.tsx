import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Send,
  ExternalLink,
  Info,
  X
} from 'lucide-react';

export type AlertNotificationChannel = 'browser' | 'audio' | 'activity_log';

export interface StreamThresholdRule {
  id: string;
  name: string;
  stream: 'telemetry_adsb' | 'turnaround_sla' | 'cpu_compute' | 'hydraulic_pressure' | 'wildfire_firms';
  streamDisplayName: string;
  metric: string;
  unit: string;
  operator: '>' | '<' | '>=' | '<=';
  thresholdValue: number;
  severity: 'critical' | 'high' | 'medium';
  enabled: boolean;
  channels: AlertNotificationChannel[];
  lastTriggered?: string;
  triggerCount: number;
}

export const DEFAULT_STREAM_RULES: StreamThresholdRule[] = [
  {
    id: 'rule-turnaround',
    name: 'Turnaround Latency SLA Breach',
    stream: 'turnaround_sla',
    streamDisplayName: 'Airbase Sortie Dispatch Stream',
    metric: 'Turnaround Duration',
    unit: 'mins',
    operator: '>',
    thresholdValue: 20.0,
    severity: 'critical',
    enabled: true,
    channels: ['browser', 'audio', 'activity_log'],
    lastTriggered: '12m ago',
    triggerCount: 4,
  },
  {
    id: 'rule-hydraulic',
    name: 'Airframe Hydraulic Subsystem Drop',
    stream: 'hydraulic_pressure',
    streamDisplayName: 'ADS-B Sensor Telemetry Stream',
    metric: 'Bay Door Actuator Pressure',
    unit: 'PSI',
    operator: '<',
    thresholdValue: 2600,
    severity: 'critical',
    enabled: true,
    channels: ['browser', 'audio', 'activity_log'],
    lastTriggered: '24m ago',
    triggerCount: 2,
  },
  {
    id: 'rule-cpu',
    name: 'Pod Node CPU Compute Saturation',
    stream: 'cpu_compute',
    streamDisplayName: 'Cluster Workload Telemetry',
    metric: 'Core Compute Load',
    unit: '%',
    operator: '>=',
    thresholdValue: 85,
    severity: 'high',
    enabled: true,
    channels: ['browser', 'activity_log'],
    lastTriggered: '1h ago',
    triggerCount: 6,
  },
  {
    id: 'rule-thermal',
    name: 'NASA FIRMS Fire Perimeter Expansion',
    stream: 'wildfire_firms',
    streamDisplayName: 'Satellite Thermal Anomaly Stream',
    metric: 'Fire Radiative Power (FRP)',
    unit: 'MW',
    operator: '>',
    thresholdValue: 450,
    severity: 'high',
    enabled: true,
    channels: ['browser', 'audio', 'activity_log'],
    lastTriggered: '45m ago',
    triggerCount: 3,
  },
];

interface CustomAlertThresholdsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerSimulatedAnomaly?: (rule: StreamThresholdRule) => void;
  onRuleTriggered?: (rule: StreamThresholdRule, observedValue: number) => void;
}

export const CustomAlertThresholdsPanel: React.FC<CustomAlertThresholdsPanelProps> = ({
  isOpen,
  onClose,
  onTriggerSimulatedAnomaly,
  onRuleTriggered,
}) => {
  const [rules, setRules] = useState<StreamThresholdRule[]>(() => {
    const saved = localStorage.getItem('custom_threshold_rules');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_STREAM_RULES;
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default';
  });

  const [isCreatingRule, setIsCreatingRule] = useState<boolean>(false);
  const [newRuleStream, setNewRuleStream] = useState<StreamThresholdRule['stream']>('turnaround_sla');
  const [newRuleName, setNewRuleName] = useState<string>('');
  const [newRuleThreshold, setNewRuleThreshold] = useState<number>(22);
  const [newRuleOperator, setNewRuleOperator] = useState<StreamThresholdRule['operator']>('>');
  const [newRuleSeverity, setNewRuleSeverity] = useState<StreamThresholdRule['severity']>('high');
  const [recentNotificationMsg, setRecentNotificationMsg] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('custom_threshold_rules', JSON.stringify(rules));
  }, [rules]);

  // Request browser notification permission
  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setRecentNotificationMsg('Browser notifications are not supported in this environment.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        new Notification('OSIRIS Alerts Activated', {
          body: 'Real-time telemetry stream anomaly notifications are now enabled.',
          icon: '/favicon.ico',
        });
        setRecentNotificationMsg('Browser notifications granted successfully!');
      } else {
        setRecentNotificationMsg('Browser notification permission was denied or dismissed.');
      }
    } catch {
      setRecentNotificationMsg('Notification permission request was blocked by the browser.');
    }
  };

  // Dispatch a real notification and in-app feedback
  const sendRealNotification = (title: string, body: string, severity: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: `osiris-${Date.now()}`,
        });
      } catch (err) {
        console.warn('Native notification failed, falling back to in-app feedback', err);
      }
    }

    setRecentNotificationMsg(`[${severity.toUpperCase()} DISPATCHED] ${title}: ${body}`);
    setTimeout(() => {
      setRecentNotificationMsg(null);
    }, 6000);
  };

  // Toggle a rule
  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  // Update rule threshold
  const handleUpdateThreshold = (id: string, val: number) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, thresholdValue: val } : r))
    );
  };

  // Delete rule
  const handleDeleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  // Test trigger a rule
  const handleTestTrigger = (rule: StreamThresholdRule) => {
    const testValues: Record<StreamThresholdRule['stream'], number> = {
      turnaround_sla: 24.8,
      hydraulic_pressure: 2380,
      cpu_compute: 92,
      telemetry_adsb: 110,
      wildfire_firms: 580,
    };

    const observed = testValues[rule.stream] || rule.thresholdValue + 5;
    const title = `🚨 ${rule.severity.toUpperCase()}: ${rule.name}`;
    const body = `Observed ${observed} ${rule.unit} (${rule.operator} ${rule.thresholdValue} ${rule.unit}) on ${rule.streamDisplayName}.`;

    sendRealNotification(title, body, rule.severity);

    // Update rule trigger count
    setRules((prev) =>
      prev.map((r) =>
        r.id === rule.id
          ? { ...r, lastTriggered: 'Just now', triggerCount: r.triggerCount + 1 }
          : r
      )
    );

    onTriggerSimulatedAnomaly?.(rule);
    onRuleTriggered?.(rule, observed);
  };

  // Create new rule
  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const streamConfigs: Record<StreamThresholdRule['stream'], { displayName: string; metric: string; unit: string }> = {
      turnaround_sla: { displayName: 'Airbase Sortie Dispatch Stream', metric: 'Turnaround Latency', unit: 'mins' },
      telemetry_adsb: { displayName: 'ADS-B Vector Transponder Stream', metric: 'Ground Speed / Alt Delta', unit: 'kts' },
      cpu_compute: { displayName: 'Cluster Workload Telemetry', metric: 'CPU Saturation', unit: '%' },
      hydraulic_pressure: { displayName: 'Airframe Actuator Sensors', metric: 'Hydraulic Pressure', unit: 'PSI' },
      wildfire_firms: { displayName: 'Satellite Thermal Radiance Stream', metric: 'Thermal Fire Radiance', unit: 'MW' },
    };

    const config = streamConfigs[newRuleStream];

    const newRule: StreamThresholdRule = {
      id: `rule-custom-${Date.now()}`,
      name: newRuleName.trim(),
      stream: newRuleStream,
      streamDisplayName: config.displayName,
      metric: config.metric,
      unit: config.unit,
      operator: newRuleOperator,
      thresholdValue: Number(newRuleThreshold),
      severity: newRuleSeverity,
      enabled: true,
      channels: ['browser', 'audio', 'activity_log'],
      lastTriggered: 'Never',
      triggerCount: 0,
    };

    setRules((prev) => [newRule, ...prev]);
    setIsCreatingRule(false);
    setNewRuleName('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-mono text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
              <Sliders className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  DATA STREAM THRESHOLD ALERT CONFIGURATOR
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold uppercase">
                  {rules.filter((r) => r.enabled).length} Active Rules
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Define custom quantitative thresholds on flight dispatch telemetry, sensor dropouts, and CPU compute. Triggers instant browser notifications upon anomaly detection.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Browser Notification Status Banner */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            {notificationPermission === 'granted' ? (
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <BellRing className="w-4 h-4 text-emerald-400" />
                <span>Browser Push Notifications: ACTIVATED</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <BellOff className="w-4 h-4 text-amber-400" />
                <span>Browser Push Notifications: {notificationPermission.toUpperCase()}</span>
              </div>
            )}
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-400 font-sans hidden sm:inline">
              Receive OS-level desktop toasts even when tab is backgrounded.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {notificationPermission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Desktop Alerts</span>
              </button>
            )}

            <button
              onClick={() => setIsCreatingRule(!isCreatingRule)}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>New Stream Rule</span>
            </button>
          </div>
        </div>

        {/* Live Notification Feedback Toast */}
        {recentNotificationMsg && (
          <div className="px-5 py-2.5 bg-cyan-950/80 border-b border-cyan-800 text-xs text-cyan-200 flex items-center gap-2 animate-in slide-in-from-top-1">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-mono">{recentNotificationMsg}</span>
          </div>
        )}

        {/* Create Rule Form Drawer */}
        {isCreatingRule && (
          <form
            onSubmit={handleCreateRule}
            className="p-5 border-b border-cyan-500/40 bg-slate-900/90 text-xs space-y-4 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5 uppercase">
                <Plus className="w-4 h-4" />
                <span>Create Custom Stream Threshold Rule</span>
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingRule(false)}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S-2T Turbo Tracker Fuel Minimum"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Target Telemetry Stream</label>
                <select
                  value={newRuleStream}
                  onChange={(e) => setNewRuleStream(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="turnaround_sla">Airbase Turnaround SLA</option>
                  <option value="hydraulic_pressure">Hydraulic Sensors</option>
                  <option value="cpu_compute">Cluster CPU Saturation</option>
                  <option value="wildfire_firms">NASA FIRMS Satellite</option>
                  <option value="telemetry_adsb">ADS-B Vector Telemetry</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Severity Level</label>
                <select
                  value={newRuleSeverity}
                  onChange={(e) => setNewRuleSeverity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="critical">CRITICAL (Immediate Dispatch)</option>
                  <option value="high">HIGH (Warning Alert)</option>
                  <option value="medium">MEDIUM (Informational)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Evaluation Operator</label>
                <select
                  value={newRuleOperator}
                  onChange={(e) => setNewRuleOperator(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                >
                  <option value=">">Greater than (&gt;)</option>
                  <option value=">=">Greater than or equal (&gt;=)</option>
                  <option value="<">Less than (&lt;)</option>
                  <option value="<=">Less than or equal (&lt;=)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Numeric Threshold Value</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newRuleThreshold}
                  onChange={(e) => setNewRuleThreshold(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-all cursor-pointer shadow-md"
                >
                  Save & Arm Rule
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Threshold Rules Table & Controls */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold text-slate-300">ARMED MONITORING RULES</span>
            <span>Adjust sliders to re-tune thresholds in real time</span>
          </div>

          <div className="space-y-3">
            {rules.map((rule) => {
              const isCrit = rule.severity === 'critical';
              const isHigh = rule.severity === 'high';

              return (
                <div
                  key={rule.id}
                  className={`p-4 rounded-xl border transition-all ${
                    rule.enabled
                      ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          rule.enabled ? (isCrit ? 'bg-red-400 animate-ping' : 'bg-amber-400') : 'bg-slate-600'
                        }`} />
                        <h3 className="text-sm font-bold text-white">{rule.name}</h3>
                        <span className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase ${
                          isCrit
                            ? 'bg-red-950 border border-red-500/50 text-red-300'
                            : isHigh
                            ? 'bg-amber-950 border border-amber-500/50 text-amber-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {rule.severity}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <span>Stream: <strong className="text-cyan-300">{rule.streamDisplayName}</strong></span>
                        <span className="mx-2">·</span>
                        <span>Metric: <strong className="text-slate-300">{rule.metric}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Test Fire Button */}
                      <button
                        onClick={() => handleTestTrigger(rule)}
                        disabled={!rule.enabled}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold border border-slate-700 hover:border-cyan-500/40 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                        title="Simulate an anomaly event and trigger browser notification"
                      >
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Test Notification</span>
                      </button>

                      {/* Enable/Disable Toggle */}
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer border ${
                          rule.enabled
                            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                      >
                        {rule.enabled ? 'ARMED' : 'MUTED'}
                      </button>

                      {/* Delete Rule */}
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Interactive Slider to Re-Tune Threshold */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
                    <div className="sm:col-span-4">
                      <span className="text-[10px] text-slate-500 block uppercase">Trigger Condition</span>
                      <div className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                        <span className="text-cyan-400">{rule.metric}</span>
                        <span className="text-amber-400">{rule.operator}</span>
                        <span className="text-emerald-400 tabular-nums">
                          {rule.thresholdValue} {rule.unit}
                        </span>
                      </div>
                    </div>

                    <div className="sm:col-span-5 flex items-center gap-2">
                      <input
                        type="range"
                        min={rule.unit === '%' ? 50 : rule.unit === 'PSI' ? 1500 : 10}
                        max={rule.unit === '%' ? 100 : rule.unit === 'PSI' ? 3500 : 60}
                        step={rule.unit === 'mins' ? 0.5 : 10}
                        value={rule.thresholdValue}
                        onChange={(e) => handleUpdateThreshold(rule.id, Number(e.target.value))}
                        disabled={!rule.enabled}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-30"
                      />
                      <span className="text-xs font-bold text-cyan-300 font-mono shrink-0 w-16 text-right">
                        {rule.thresholdValue} {rule.unit}
                      </span>
                    </div>

                    <div className="sm:col-span-3 text-right text-[11px] text-slate-500">
                      <span>Triggered {rule.triggerCount}x</span>
                      <span className="block text-[10px] text-slate-600">Last: {rule.lastTriggered}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-sans">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Rules are evaluated against the continuous Python/CP-SAT stream and ADS-B ingest pipeline.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRules(DEFAULT_STREAM_RULES);
                setRecentNotificationMsg('Rules reset to operational standards.');
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-xs"
            >
              Reset to Defaults
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-all cursor-pointer text-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
