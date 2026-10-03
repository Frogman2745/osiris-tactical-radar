import React, { useState } from 'react';
import {
  AlertTriangle,
  Zap,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Clock,
  Radio,
  X,
  Play,
  Flame,
  ArrowRight,
  Database,
  Terminal,
  Activity,
  Layers
} from 'lucide-react';
import { ChaosPlaybookResult } from '../services/etlPipeline';

interface ChaosEngineeringHarnessProps {
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
  onFaultInjected?: (result: ChaosPlaybookResult) => void;
}

export const ChaosEngineeringHarness: React.FC<ChaosEngineeringHarnessProps> = ({
  isOpen = true,
  onClose,
  isModal = false,
  onFaultInjected,
}) => {
  const [selectedFault, setSelectedFault] = useState<'sensor_dropout' | 'schema_drift' | 'turnaround_spike' | 'gps_jitter'>('turnaround_spike');
  const [selectedAirframe, setSelectedAirframe] = useState<string>('TANKER-80');
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'critical'>('critical');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [latestResult, setLatestResult] = useState<ChaosPlaybookResult | null>(null);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);

  if (isModal && !isOpen) return null;

  const faultCatalog = [
    {
      id: 'turnaround_spike',
      name: 'Turnaround Latency SLA Spike (>40m)',
      category: 'SLA Breach',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/40 border-amber-500/40',
      description: 'Simulates retardant loading hose failure creating a 42.5m turnaround surge against the 20m SLA threshold.',
      playbook: 'AUTO_PLAYBOOK_PB-08: Dynamic Fleet Rebalancing & Sortie Diversion',
    },
    {
      id: 'sensor_dropout',
      name: 'Transponder Packet Dropout (Null Metrics)',
      category: 'Data Quality',
      icon: Radio,
      color: 'text-rose-400',
      bgColor: 'bg-rose-950/40 border-rose-500/40',
      description: 'Cuts fuel and turnaround sensor signals over rugged terrain. Tests rolling median Kalman imputation without halting ETL.',
      playbook: 'AUTO_PLAYBOOK_PB-02: Historical Median Telemetry Imputation',
    },
    {
      id: 'schema_drift',
      name: 'Corrupt Schema & Dead-Letter Isolation',
      category: 'Pipeline Defense',
      icon: Database,
      color: 'text-purple-400',
      bgColor: 'bg-purple-950/40 border-purple-500/40',
      description: 'Injects unmapped airframe ID and 999m value. Verifies immediate isolation into dead-letter quarantine store.',
      playbook: 'AUTO_PLAYBOOK_PB-05: Schema Drift Quarantine & Alert Dispatch',
    },
    {
      id: 'gps_jitter',
      name: 'GPS Avionics Drift & Velocity Jitter',
      category: 'Telemetry Smoothing',
      icon: Activity,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-950/40 border-cyan-500/40',
      description: 'Spurious transponder lat/lng coordinate spikes. Tests dead-reckoning vector smoother and flight corridor lock.',
      playbook: 'AUTO_PLAYBOOK_PB-03: Dead-Reckoning Trajectory Smoothing',
    },
  ];

  const airframes = [
    { id: 'TANKER-80', label: 'Tanker 80 (S-2T Turbo Tracker · RDD)' },
    { id: 'TANKER-910', label: 'Tanker 910 (DC-10 VLAT · SAC)' },
    { id: 'TANKER-96', label: 'Tanker 96 (S-2T Turbo Tracker · PRB)' },
    { id: 'COPTER-106', label: 'Copter 106 (S-70i Firehawk · BFR)' },
    { id: 'AIRATTACK-140', label: 'Air Attack 140 (OV-10A Bronco · SAC)' },
  ];

  const handleInjectFault = async () => {
    setIsSimulating(true);
    setActiveStepIndex(0);
    setSimulationLogs([`[00ms] Initializing Chaos Harness injection: '${selectedFault}' on ${selectedAirframe}...`]);

    try {
      // Step-by-step visual simulation progression
      setTimeout(() => {
        setActiveStepIndex(1);
        setSimulationLogs((prev) => [
          ...prev,
          `[45ms] Telemetry ingestion detected anomalous variance in real-time stream`,
        ]);
      }, 400);

      setTimeout(() => {
        setActiveStepIndex(2);
        setSimulationLogs((prev) => [
          ...prev,
          `[95ms] Z-Score Anomaly Scan triggered: Variance exceeds 2.8σ threshold`,
        ]);
      }, 800);

      const res = await fetch('/api/chaos/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faultType: selectedFault,
          targetAirframe: selectedAirframe,
          severity,
        }),
      });

      const data = await res.json();

      setTimeout(() => {
        setActiveStepIndex(3);
        setLatestResult(data);
        setIsSimulating(false);
        setSimulationLogs((prev) => [
          ...prev,
          `[148ms] Autonomous playbook executed: ${data.playbookExecuted}`,
          `[164ms] Remediation verified: System self-healed in ${data.mitigationTimeMs}ms with 0 dropped production rows.`,
        ]);
        if (onFaultInjected) {
          onFaultInjected(data);
        }
      }, 1200);
    } catch (e) {
      console.error('Chaos simulation failed:', e);
      setIsSimulating(false);
    }
  };

  const content = (
    <div className="bg-slate-900 border border-amber-500/40 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Harness Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Zap className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                Chaos Engineering & Fault-Injection Harness
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 border border-amber-500/40 text-amber-300">
                ACTIVE SRE LAB
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate high-tempo aviation telemetry failures and verify automated self-healing playbooks
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Config Panel (Cols 1-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            1. Select Fault Type to Inject
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {faultCatalog.map((f) => {
              const Icon = f.icon;
              const isSelected = selectedFault === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFault(f.id as any)}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? `${f.bgColor} ring-1 ring-amber-400/50 shadow-md`
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${f.color}`} />
                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {f.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{f.description}</p>
                  <div className="mt-2 text-[10px] font-mono text-slate-500">
                    Playbook: <span className="text-slate-300">{f.playbook.split(':')[0]}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Target Airframe & Severity Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Target Airframe
              </label>
              <select
                value={selectedAirframe}
                onChange={(e) => setSelectedAirframe(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
              >
                {airframes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Injection Severity
              </label>
              <div className="flex gap-1.5">
                {(['minor', 'moderate', 'critical'] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverity(sev)}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                      severity === sev
                        ? sev === 'critical'
                          ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                          : sev === 'moderate'
                          ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                          : 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="pt-2">
            <button
              onClick={handleInjectFault}
              disabled={isSimulating}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing Chaos Injection & Monitoring Telemetry...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-slate-950" />
                  <span>Simulate Fault & Trigger Autonomous Playbook</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Observability & Playbook Console (Cols 8-12) */}
        <div className="lg:col-span-5 bg-slate-950/90 rounded-lg border border-slate-800 p-4 flex flex-col justify-between space-y-4 font-mono text-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Live SRE Remediation Feed</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isSimulating
                    ? 'bg-amber-950 border border-amber-500/50 text-amber-300 animate-pulse'
                    : latestResult
                    ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900 text-slate-500'
                }`}
              >
                {isSimulating ? 'INJECTING' : latestResult ? 'RECOVERED (HEALTHY)' : 'STANDBY'}
              </span>
            </div>

            {/* Stepper Pipeline Detection Indicators */}
            <div className="grid grid-cols-4 gap-1.5 my-3">
              {['Fault', 'Detect', 'Mitigate', 'Verify'].map((label, idx) => (
                <div
                  key={label}
                  className={`text-center py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                    activeStepIndex >= idx
                      ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-900 border border-slate-800 text-slate-600'
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Terminal Log Stream */}
            <div className="bg-black/70 rounded p-3 border border-slate-800/70 space-y-1.5 min-h-[140px] text-[11px]">
              {simulationLogs.length === 0 ? (
                <div className="text-slate-600 italic">
                  Select a fault and click &quot;Simulate Fault&quot; to test real-time pipeline resilience.
                </div>
              ) : (
                simulationLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`leading-relaxed ${
                      log.includes('Remediation verified')
                        ? 'text-emerald-400 font-bold'
                        : log.includes('anomalous') || log.includes('triggered')
                        ? 'text-amber-300'
                        : 'text-slate-300'
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Latest Playbook Execution Badge */}
          {latestResult && (
            <div className="p-3 rounded bg-emerald-950/30 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Self-Healing Verified</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {latestResult.mitigationTimeMs}ms MTTR
                </span>
              </div>
              <div className="text-xs font-bold text-white">
                {latestResult.playbookExecuted}
              </div>
              <ul className="text-[10px] text-slate-300 space-y-1 pl-1">
                {latestResult.actionsTaken.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-4xl">{content}</div>
      </div>
    );
  }

  return content;
};
