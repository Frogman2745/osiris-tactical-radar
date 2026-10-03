import React, { useState, useMemo } from 'react';
import {
  Layers,
  Sparkles,
  Database,
  Share2,
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
  TrendingUp,
  Cpu,
  Clock,
  Filter,
  Flame,
  Plane,
  Building2,
  Stethoscope,
  Briefcase,
  DollarSign,
  Copy,
  Check,
  Search,
  ChevronRight,
  Info,
  X
} from 'lucide-react';
import { PipelineStage } from '../types';

export interface WorkflowTemplate {
  id: string;
  name: string;
  category: 'Defense & Emergency' | 'SaaS & FinTech' | 'Healthcare & Life Sciences' | 'Autonomous & IoT' | 'Supply Chain';
  tagline: string;
  description: string;
  slaTarget: string;
  recordsPerBatch: string;
  recommendedNodes: number;
  stages: PipelineStage[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'calfire-aviation',
    name: 'CAL FIRE Mixed-Fleet Aviation Dispatch ETL',
    category: 'Defense & Emergency',
    tagline: 'Statewide airborne wildfire suppression, transponder deduplication & CP-SAT turnaround scheduling.',
    description: 'Polls dual-redundant ADS-B transponders, performs proximity polygon spatial indexing for base staging, enforces strict PMS-505 ground turnaround SLAs, and syncs optimal aerial drop assignments.',
    slaTarget: '≤ 16.5m Turnaround',
    recordsPerBatch: '500K / 5 min',
    recommendedNodes: 6,
    stages: [
      {
        id: 'stage-ingest-calfire',
        name: '01. ADS-B & Base Load Ingest',
        type: 'ingest',
        status: 'completed',
        durationMs: 380,
        recordsIn: 512400,
        recordsOut: 504820,
        description: 'CDC WAL extraction from flight dispatch Postgres and FAA radar transponder feeds.',
        configSummary: 'Batch: 25,000 · CDC: WAL stream · Protocol: DO-260B / PMS-505',
        schemaFields: [
          { field: 'aircraft_id', type: 'VARCHAR(32)', nullPct: 0.0 },
          { field: 'callsign', type: 'VARCHAR(48)', nullPct: 0.0 },
          { field: 'base_id', type: 'CHAR(3)', nullPct: 0.0 },
          { field: 'lat_lon', type: 'POINT / GEOMETRY', nullPct: 0.1 },
          { field: 'fuel_level_pct', type: 'DECIMAL(5,2)', nullPct: 0.1 },
          { field: 'retardant_gal', type: 'INTEGER', nullPct: 0.0 },
        ],
      },
      {
        id: 'stage-validate-calfire',
        name: '02. Transponder Burst Cleaning',
        type: 'validate',
        status: 'completed',
        durationMs: 240,
        recordsIn: 504820,
        recordsOut: 498310,
        description: 'Deduplicates burst transmissions and imputes missing transponder coordinates.',
        configSummary: 'Strict Type Casting · Quarantine Outliers · Proximity Polygons',
        schemaFields: [
          { field: 'clean_aircraft_id', type: 'VARCHAR(32)', nullPct: 0.0 },
          { field: 'standard_utc_ts', type: 'TIMESTAMPTZ', nullPct: 0.0 },
          { field: 'validated_base_id', type: 'CHAR(3)', nullPct: 0.0 },
          { field: 'is_duplicate_burst', type: 'BOOLEAN', nullPct: 0.0 },
        ],
      },
      {
        id: 'stage-transform-calfire',
        name: '03. CP-SAT Flight Constraint Solver',
        type: 'transform',
        status: 'completed',
        durationMs: 510,
        recordsIn: 498310,
        recordsOut: 482190,
        description: 'Solves ground crew turnaround allocations and flags turnaround anomalies.',
        configSummary: 'Solver: Google OR-Tools CP-SAT · Window: 30m rolling · SLA: 16.5m',
        schemaFields: [
          { field: 'sortie_id', type: 'UUID', nullPct: 0.0 },
          { field: 'turnaround_time_mins', type: 'NUMERIC(6,2)', nullPct: 0.0 },
          { field: 'sla_compliance', type: 'BOOLEAN', nullPct: 0.0 },
          { field: 'anomaly_z_score', type: 'FLOAT', nullPct: 0.0 },
        ],
      },
      {
        id: 'stage-load-calfire',
        name: '04. Tactical Operational Mart Load',
        type: 'load',
        status: 'completed',
        durationMs: 290,
        recordsIn: 482190,
        recordsOut: 482190,
        description: 'Upserts to analytical partitioned Postgres and pushes WebSocket alerts to War Room.',
        configSummary: 'Target: Postgres bi_telemetry_mart · WebSocket push to UI',
        schemaFields: [
          { field: 'mart_record_id', type: 'BIGINT (PK)', nullPct: 0.0 },
          { field: 'bi_sync_timestamp', type: 'TIMESTAMPTZ', nullPct: 0.0 },
          { field: 'powerbi_cache_status', type: 'VARCHAR(16)', nullPct: 0.0 },
        ],
      },
    ],
  },
  {
    id: 'saas-retention',
    name: 'SaaS Revenue, Churn & Cohort Intelligence ETL',
    category: 'SaaS & FinTech',
    tagline: 'High-throughput subscription event billing stream with automated revenue cohort indexing.',
    description: 'Ingests Stripe billing webhooks, Segment clickstreams, and CRM subscription records; calculates rolling NRR/MRR decay curves and detects high-value account churn vectors.',
    slaTarget: '≤ 3.0s Event-to-Mart',
    recordsPerBatch: '1.2M / 15 min',
    recommendedNodes: 5,
    stages: [
      {
        id: 'stage-ingest-saas',
        name: '01. Stripe & Event Webhook Ingestion',
        type: 'ingest',
        status: 'completed',
        durationMs: 310,
        recordsIn: 1250000,
        recordsOut: 1248000,
        description: 'Kafka partition consumer listening to idempotency-verified webhook queues.',
        configSummary: 'Format: CloudEvents JSON · Compression: Zstandard · Dead-Letter Queue: Active',
        schemaFields: [
          { field: 'event_uuid', type: 'UUID', nullPct: 0.0 },
          { field: 'customer_tenant_id', type: 'VARCHAR(48)', nullPct: 0.0 },
          { field: 'invoice_amount_usd', type: 'DECIMAL(10,2)', nullPct: 0.0 },
          { field: 'billing_period_start', type: 'DATE', nullPct: 0.0 },
        ],
      },
      {
        id: 'stage-validate-saas',
        name: '02. Ledger Idempotency & Currency Normalization',
        type: 'validate',
        status: 'completed',
        durationMs: 195,
        recordsIn: 1248000,
        recordsOut: 1247100,
        description: 'Enforces double-entry balance check and converts 42 currencies to USD spot rates.',
        configSummary: 'Forex Provider: Live ECB / Federal Reserve spot · Precision: 6 decimals',
        schemaFields: [
          { field: 'verified_tx_hash', type: 'VARCHAR(64)', nullPct: 0.0 },
          { field: 'usd_normalized_value', type: 'DECIMAL(12,2)', nullPct: 0.0 },
          { field: 'tax_jurisdiction', type: 'CHAR(2)', nullPct: 0.0 },
        ],
      },
      {
        id: 'stage-transform-saas',
        name: '03. Cohort Retention & Churn Scoring Matrix',
        type: 'transform',
        status: 'completed',
        durationMs: 440,
        recordsIn: 1247100,
        recordsOut: 1247100,
        description: 'Polars lazy dataframe aggregations for monthly retention cohorts and customer health scores.',
        configSummary: 'Engine: Rust/Polars 0.40 · Cohorts: 12-Month Rolling · Churn ML: XGBoost inference',
        schemaFields: [
          { field: 'cohort_month', type: 'CHAR(7)', nullPct: 0.0 },
          { field: 'net_revenue_retention_pct', type: 'FLOAT', nullPct: 0.0 },
          { field: 'risk_tier', type: 'VARCHAR(16)', nullPct: 0.0 },
        ],
      },
      {
        id: 'stage-load-saas',
        name: '04. Columnar OLAP Mart & Stripe Sync',
        type: 'load',
        status: 'completed',
        durationMs: 260,
        recordsIn: 1247100,
        recordsOut: 1247100,
        description: 'Upserts to DuckDB/ClickHouse analytics cluster and invalidates executive KPI cache.',
        configSummary: 'Target: ClickHouse `revenue_mart_v2` · Cache TTL: 60s Redis',
        schemaFields: [
          { field: 'mart_row_id', type: 'BIGINT', nullPct: 0.0 },
          { field: 'loaded_at', type: 'TIMESTAMPTZ', nullPct: 0.0 },
        ],
      },
    ],
  },
  {
    id: 'healthcare-ehr',
    name: 'HIPAA Critical EHR & Patient Vitals Streaming',
    category: 'Healthcare & Life Sciences',
    tagline: 'Zero-loss HL7 FHIR v4 streaming with automated PHI de-identification and ICU triage scoring.',
    description: 'Streams bedside telemetry, ventilators, and vitals monitors with cryptographic pseudonymization, schema compliance validation, and continuous sepsis early-warning detection.',
    slaTarget: '≤ 850ms Zero-Loss',
    recordsPerBatch: '350K / 1 min',
    recommendedNodes: 8,
    stages: [
      {
        id: 'stage-ingest-health',
        name: '01. HL7 FHIR v4 Vitals Gateway',
        type: 'ingest',
        status: 'completed',
        durationMs: 280,
        recordsIn: 360000,
        recordsOut: 359400,
        description: 'Subscribes to hospital network mTLS WebSocket feeds for ICU bedside telemetry.',
        configSummary: 'Protocol: FHIR v4 JSON · TLS 1.3 · Audit Trail: WORM Compliance',
        schemaFields: [
          { field: 'device_uuid', type: 'UUID', nullPct: 0.0 },
          { field: 'heart_rate_bpm', type: 'SMALLINT', nullPct: 0.0 },
          { field: 'spo2_pct', type: 'TINYINT', nullPct: 0.0 },
          { field: 'systolic_bp', type: 'SMALLINT', nullPct: 0.0 },
        ],
      },
      {
        id: 'stage-validate-health',
        name: '02. Cryptographic PHI Tokenization & Sanitizer',
        type: 'validate',
        status: 'completed',
        durationMs: 310,
        recordsIn: 359400,
        recordsOut: 359400,
        description: 'Replaces patient PII with salted SHA-256 tokens and validates physiologic ranges.',
        configSummary: 'HIPAA Safe Harbor Compliant · Hardware KMS Enclave HSM',
        schemaFields: [
          { field: 'tokenized_subject_id', type: 'VARCHAR(64)', nullPct: 0.0 },
          { field: 'anonymized_ward_id', type: 'VARCHAR(16)', nullPct: 0.0 },
          { field: 'is_physiologic_artifact', type: 'BOOLEAN', nullPct: 0.0 },
        ],
      },
      {
        id: 'stage-transform-health',
        name: '03. qSOFA & Sepsis Severity Predictor',
        type: 'transform',
        status: 'completed',
        durationMs: 390,
        recordsIn: 359400,
        recordsOut: 359400,
        description: 'Calculates continuous qSOFA score and detects microvascular collapse markers.',
        configSummary: 'Algorithm: qSOFA 2026 Guidelines · Alert Threshold: Score ≥ 2',
        schemaFields: [
          { field: 'qsofa_score', type: 'TINYINT', nullPct: 0.0 },
          { field: 'sepsis_probability_pct', type: 'FLOAT', nullPct: 0.0 },
          { field: 'alert_criticality', type: 'VARCHAR(12)', nullPct: 0.0 },
        ],
      },
      {
        id: 'stage-load-health',
        name: '04. Fast FHIR Data Lake & Nurse Station Sync',
        type: 'load',
        status: 'completed',
        durationMs: 210,
        recordsIn: 359400,
        recordsOut: 359400,
        description: 'Pushes high-priority alerts to nurse station tablets and writes to Parquet data lake.',
        configSummary: 'Storage: S3 Encrypted Parquet · Event Bus: MQTT QoS-2',
        schemaFields: [
          { field: 'lake_partition', type: 'VARCHAR(32)', nullPct: 0.0 },
          { field: 'broadcast_receipt_ack', type: 'BOOLEAN', nullPct: 0.0 },
        ],
      },
    ],
  },
  {
    id: 'iot-smartgrid',
    name: 'Autonomous Industrial Smart Grid & SCADA Telemetry',
    category: 'Autonomous & IoT',
    tagline: 'Microsecond smart inverter and transformer load balancing across distributed solar & wind arrays.',
    description: 'Processes Modbus and OPC-UA streams from 14,000 sub-stations, filters thermal overload spikes, runs harmonic distortion transforms, and balances localized battery storage dispatch.',
    slaTarget: '≤ 150ms Deterministic',
    recordsPerBatch: '2.5M / 1 min',
    recommendedNodes: 12,
    stages: [
      {
        id: 'stage-ingest-iot',
        name: '01. Modbus TCP & OPC-UA Ingestion Bus',
        type: 'ingest',
        status: 'completed',
        durationMs: 240,
        recordsIn: 2500000,
        recordsOut: 2496000,
        description: 'Parallel socket listeners connected to regional distribution substations.',
        configSummary: 'Protocol: OPC-UA binary / Modbus TCP · Ingest Rate: 42,000 pkt/sec',
        schemaFields: [
          { field: 'inverter_id', type: 'INT', nullPct: 0.0 },
          { field: 'active_power_kw', type: 'FLOAT', nullPct: 0.0 },
          { field: 'grid_frequency_hz', type: 'FLOAT', nullPct: 0.0 },
          { field: 'bus_voltage_v', type: 'FLOAT', nullPct: 0.0 },
        ],
      },
      {
        id: 'stage-validate-iot',
        name: '02. Outlier Spike & Phase Angle Validation',
        type: 'validate',
        status: 'completed',
        durationMs: 180,
        recordsIn: 2496000,
        recordsOut: 2495100,
        description: 'Filters electromagnetic sensor transients and verifies phase lock synchronization.',
        configSummary: 'Nyquist Frequency Filter · 3-Sigma Gaussian Thresholding',
        schemaFields: [
          { field: 'clean_power_kw', type: 'FLOAT', nullPct: 0.0 },
          { field: 'phase_angle_rad', type: 'FLOAT', nullPct: 0.0 },
          { field: 'is_sensor_fault', type: 'BOOLEAN', nullPct: 0.0 },
        ],
      },
      {
        id: 'stage-transform-iot',
        name: '03. Harmonic Distortion & Thermal Overload Solver',
        type: 'transform',
        status: 'completed',
        durationMs: 420,
        recordsIn: 2495100,
        recordsOut: 2495100,
        description: 'Computes Total Harmonic Distortion (THD) and predicts transformer winding degradation.',
        configSummary: 'Fast Fourier Transform (FFT) · IEEE 519 Standard Compliance',
        schemaFields: [
          { field: 'thd_pct', type: 'FLOAT', nullPct: 0.0 },
          { field: 'predicted_winding_temp_c', type: 'FLOAT', nullPct: 0.0 },
          { field: 'battery_dispatch_kw', type: 'FLOAT', nullPct: 0.0 },
        ],
      },
      {
        id: 'stage-load-iot',
        name: '04. TimescaleDB & SCADA Dashboard Push',
        type: 'load',
        status: 'completed',
        durationMs: 250,
        recordsIn: 2495100,
        recordsOut: 2495100,
        description: 'Compresses into TimescaleDB hypertable with 12:1 compression ratio.',
        configSummary: 'Target: TimescaleDB Hypertables · Compression: Gorilla / Delta-of-delta',
        schemaFields: [
          { field: 'hypertable_chunk_id', type: 'BIGINT', nullPct: 0.0 },
          { field: 'compression_ratio', type: 'FLOAT', nullPct: 0.0 },
        ],
      },
    ],
  },
  {
    id: 'supply-chain-logistics',
    name: 'Global Multimodal Supply Chain & Port Logistics',
    category: 'Supply Chain',
    tagline: 'Cross-docking container tracking, customs EDI parsing, and cold-chain temperature telemetry.',
    description: 'Ingests EDI 214 and 315 shipping events, AIS maritime vessel beacons, and BLE refrigeration logs; automatically recalculates vessel ETAs and detects temperature excursions.',
    slaTarget: '≤ 5.0m Worldwide',
    recordsPerBatch: '800K / 10 min',
    recommendedNodes: 6,
    stages: [
      {
        id: 'stage-ingest-logistics',
        name: '01. EDI 214/315 & AIS Vessel Stream',
        type: 'ingest',
        status: 'completed',
        durationMs: 340,
        recordsIn: 820000,
        recordsOut: 814000,
        description: 'Ingests X12 EDI shipping manifests, port terminal TOS APIs, and satellite AIS.',
        configSummary: 'Formats: ANSI X12, EDIFACT, NMEA 0183 AIS',
        schemaFields: [
          { field: 'container_iso_code', type: 'VARCHAR(11)', nullPct: 0.0 },
          { field: 'vessel_imo_number', type: 'INTEGER', nullPct: 0.0 },
          { field: 'current_port_code', type: 'CHAR(5)', nullPct: 0.0 },
          { field: 'cargo_temp_celsius', type: 'DECIMAL(4,1)', nullPct: 0.2 },
        ],
      },
      {
        id: 'stage-validate-logistics',
        name: '02. Container Customs & Seal Integrity Check',
        type: 'validate',
        status: 'completed',
        durationMs: 220,
        recordsIn: 814000,
        recordsOut: 811200,
        description: 'Matches container seals against bill-of-lading hashes and verifies customs release status.',
        configSummary: 'Automated CBP 24-Hour Rule validation · Geofence crossing alerts',
        schemaFields: [
          { field: 'verified_seal_match', type: 'BOOLEAN', nullPct: 0.0 },
          { field: 'customs_hold_flag', type: 'BOOLEAN', nullPct: 0.0 },
          { field: 'cold_chain_breach', type: 'BOOLEAN', nullPct: 0.0 },
        ],
      },
      {
        id: 'stage-transform-logistics',
        name: '03. Dynamic ETA & Drayage Route Optimizer',
        type: 'transform',
        status: 'completed',
        durationMs: 480,
        recordsIn: 811200,
        recordsOut: 808900,
        description: 'Calculates berth congestion delays and solves drayage truck gate appointment assignments.',
        configSummary: 'Routing: Dijkstra / OpenStreetMap · Berth Queue Model: M/M/c simulation',
        schemaFields: [
          { field: 'predicted_berth_delay_hrs', type: 'NUMERIC(5,2)', nullPct: 0.0 },
          { field: 'assigned_gate_slot', type: 'TIMESTAMPTZ', nullPct: 0.0 },
          { field: 'carbon_intensity_kg', type: 'FLOAT', nullPct: 0.0 },
        ],
      },
      {
        id: 'stage-load-logistics',
        name: '04. Supply Chain Control Tower Sync',
        type: 'load',
        status: 'completed',
        durationMs: 270,
        recordsIn: 808900,
        recordsOut: 808900,
        description: 'Syncs unified shipment statuses to SAP S/4HANA and pushes PagerDuty exception webhooks.',
        configSummary: 'Target: Snowflake Logistics Lakehouse & SAP S/4HANA RFC',
        schemaFields: [
          { field: 'lakehouse_record_id', type: 'UUID', nullPct: 0.0 },
          { field: 'sap_sync_status', type: 'VARCHAR(16)', nullPct: 0.0 },
        ],
      },
    ],
  },
];

interface WorkflowTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: WorkflowTemplate) => void;
  currentTemplateId?: string;
}

export const WorkflowTemplateModal: React.FC<WorkflowTemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  currentTemplateId = 'calfire-aviation',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewTemplate, setPreviewTemplate] = useState<WorkflowTemplate>(() => {
    return WORKFLOW_TEMPLATES.find((t) => t.id === currentTemplateId) || WORKFLOW_TEMPLATES[0];
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const list = Array.from(new Set(WORKFLOW_TEMPLATES.map((t) => t.category)));
    return ['All', ...list];
  }, []);

  const filteredTemplates = useMemo(() => {
    return WORKFLOW_TEMPLATES.filter((tpl) => {
      const matchCat = selectedCategory === 'All' || tpl.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleCopyConfig = (tpl: WorkflowTemplate) => {
    const jsonStr = JSON.stringify(
      {
        blueprint: tpl.name,
        category: tpl.category,
        slaTarget: tpl.slaTarget,
        recordsPerBatch: tpl.recordsPerBatch,
        recommendedNodes: tpl.recommendedNodes,
        stages: tpl.stages.map((s) => ({
          name: s.name,
          type: s.type,
          durationMs: s.durationMs,
          recordsIn: s.recordsIn,
          recordsOut: s.recordsOut,
          description: s.description,
          configSummary: s.configSummary,
        })),
      },
      null,
      2
    );
    navigator.clipboard.writeText(jsonStr);
    setCopiedId(tpl.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Defense & Emergency':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'SaaS & FinTech':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'Healthcare & Life Sciences':
        return <Stethoscope className="w-4 h-4 text-rose-400" />;
      case 'Autonomous & IoT':
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'Supply Chain':
        return <Building2 className="w-4 h-4 text-purple-400" />;
      default:
        return <Layers className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-slate-950 border border-cyan-500/50 rounded-2xl shadow-2xl shadow-cyan-950/60 overflow-hidden font-mono flex flex-col max-h-[90vh] border-t-2 border-t-cyan-400"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Layers className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide uppercase">
                  WORKFLOW TEMPLATE & BLUEPRINT LIBRARY
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold uppercase">
                  {WORKFLOW_TEMPLATES.length} Enterprise Blueprints
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Select pre-configured ETL pipelines and analytical architectures categorized by industry use-case.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-sm shadow-cyan-950'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {cat !== 'All' && getCategoryIcon(cat)}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pipelines or schemas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>
        </div>

        {/* Main Content: Split Master-Detail Layout */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Column: List of Blueprints */}
          <div className="md:col-span-5 border-r border-slate-800 overflow-y-auto p-3 space-y-2 bg-slate-950/40">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-sans">
                No pipeline templates found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredTemplates.map((tpl) => {
                const isSelected = previewTemplate.id === tpl.id;
                const isCurrentActive = currentTemplateId === tpl.id;

                return (
                  <div
                    key={tpl.id}
                    onClick={() => setPreviewTemplate(tpl)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500 shadow-md shadow-cyan-950/40'
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(tpl.category)}
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          {tpl.category}
                        </span>
                      </div>
                      {isCurrentActive && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold uppercase">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-bold text-white line-clamp-1 mb-1">
                      {tpl.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-sans line-clamp-2 leading-relaxed">
                      {tpl.tagline}
                    </p>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-500">
                      <span>{tpl.stages.length} Stages</span>
                      <span className="text-cyan-400 font-bold">{tpl.slaTarget}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Blueprint Deep-Dive Inspector */}
          <div className="md:col-span-7 overflow-y-auto p-5 space-y-5 bg-slate-900/30">
            {/* Header of selected preview */}
            <div className="pb-4 border-b border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5 uppercase">
                  {getCategoryIcon(previewTemplate.category)}
                  <span>{previewTemplate.category}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyConfig(previewTemplate)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 cursor-pointer transition-colors"
                    title="Copy blueprint JSON representation"
                  >
                    {copiedId === previewTemplate.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onSelectTemplate(previewTemplate);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold font-mono rounded bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-md shadow-cyan-950 transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Deploy Blueprint</span>
                  </button>
                </div>
              </div>

              <h2 className="text-base font-bold text-white tracking-tight">
                {previewTemplate.name}
              </h2>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {previewTemplate.description}
              </p>
            </div>

            {/* Architectural Constraints & Specs */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono">
                <span className="text-[10px] text-slate-500 block uppercase">SLA Target</span>
                <span className="text-sm font-bold text-emerald-400 block mt-0.5">
                  {previewTemplate.slaTarget}
                </span>
                <span className="text-[9px] text-slate-500">End-to-end delivery</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono">
                <span className="text-[10px] text-slate-500 block uppercase">Batch Ingestion</span>
                <span className="text-sm font-bold text-cyan-300 block mt-0.5">
                  {previewTemplate.recordsPerBatch}
                </span>
                <span className="text-[9px] text-slate-500">Continuous telemetry</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono">
                <span className="text-[10px] text-slate-500 block uppercase">Worker Cluster</span>
                <span className="text-sm font-bold text-purple-400 block mt-0.5">
                  {previewTemplate.recommendedNodes} Replicas
                </span>
                <span className="text-[9px] text-slate-500">Auto-scaling profile</span>
              </div>
            </div>

            {/* Stages Breakdown List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Pipeline Execution Stages ({previewTemplate.stages.length})</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Sequential Dependency Graph
                </span>
              </div>

              <div className="space-y-2.5">
                {previewTemplate.stages.map((stage, idx) => (
                  <div
                    key={stage.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 text-xs font-mono space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white text-xs">{stage.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400 uppercase">
                          {stage.type}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{stage.durationMs}ms</span>
                        <span>·</span>
                        <span>{stage.recordsOut.toLocaleString()} rows</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 font-sans">
                      {stage.description}
                    </p>

                    <div className="p-2 rounded bg-black/50 border border-slate-900 text-[10px] text-slate-400 flex items-center gap-2">
                      <span className="text-cyan-400 font-bold">CONFIG:</span>
                      <span className="truncate">{stage.configSummary}</span>
                    </div>

                    {/* Schema preview tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {stage.schemaFields.map((f) => (
                        <span
                          key={f.field}
                          className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 border border-slate-800 text-slate-400"
                        >
                          <strong className="text-slate-300">{f.field}:</strong> {f.type}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span className="font-sans">Deploying replaces the active staged configuration and notifies all connected peer sessions.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSelectTemplate(previewTemplate);
                onClose();
              }}
              className="px-4 py-1.5 text-xs font-mono font-bold rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-colors cursor-pointer shadow-sm shadow-cyan-950"
            >
              Deploy &quot;{previewTemplate.name.split(' ')[0]}&quot; Pipeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
