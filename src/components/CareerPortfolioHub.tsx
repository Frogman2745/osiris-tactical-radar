import React, { useState } from 'react';
import { JobApplication, PortfolioProject } from '../types';
import { 
  Briefcase, 
  ExternalLink, 
  Github, 
  Layers, 
  Award, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  FileText, 
  TrendingUp, 
  Filter, 
  Plus, 
  ChevronRight,
  Target
} from 'lucide-react';

export const CareerPortfolioHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'portfolio' | 'applications' | 'ai-tailor'>('portfolio');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [targetJobDescription, setTargetJobDescription] = useState<string>('');
  const [targetRoleTitle, setTargetRoleTitle] = useState<string>('Data Analyst / AI Operations Specialist');
  const [isTailoring, setIsTailoring] = useState<boolean>(false);
  const [tailoredResults, setTailoredResults] = useState<{
    matchScore: number;
    topTargetedKeywords: string[];
    quantifiedBulletPoints: string[];
    recommendedProofLinks: { title: string; proofType: string; relevance: string }[];
    interviewTalkingPoints: string[];
  } | null>(null);

  // Nicholas Marnocha's genuine portfolio projects
  const portfolioProjects: PortfolioProject[] = [
    {
      id: 'osiris',
      title: 'OSIRIS: Wildfire Tactical Air Operations & DAG Orchestrator',
      subtitle: '60 FPS Canvas 2D tactical radar and topological DAG compute orchestrator for CAL FIRE & DoD MAFFS wings',
      category: 'Autonomous Systems',
      techStack: ['React 19', 'TypeScript', 'HTML5 Canvas 2D', 'DAG Pipeline', 'Recharts', 'WebSockets', 'Vitest'],
      problem: 'Incident commanders and air attack supervisors require real-time 60 FPS airspace tracking across C-130H MAFFS, VLAT, and helitack assets while simultaneously scheduling heavy compute pipelines for satellite thermal plume and fuel moisture modeling.',
      architecture: 'Hardware-accelerated HTML5 Canvas 2D rasterizer with custom geodetics and 10-class vector symbology, coupled to an automated DAG dependency scheduler with real-time CPU/RAM telemetry and JSON config serialization.',
      outcome: 'Maintains solid 60 FPS rendering under 2,200+ surge targets (<1.2ms frame latency), cuts pipeline duration by 57% via parallel branching, and passed 22/22 automated Vitest tests.',
      metrics: [
        { label: 'Surge Frame Rate', value: '60 FPS', detail: '2,200+ markers at <1.2ms' },
        { label: 'Pipeline Speedup', value: '-57% Latency', detail: 'parallel branch scheduling' },
        { label: 'Automated Tests', value: '22 / 22 Passed', detail: '100% test pass rate in Vitest' },
      ],
      githubUrl: 'https://github.com/Frogman2745/osiris-tactical-radar',
      liveDemoUrl: 'https://froghausstudios.com',
      caseStudyDoc: 'Full Case Study, Schematics & 12-Slide Executive Deck Available',
    },
    {
      id: 'tankerline',
      title: 'Tankerline: Aerial Resource Allocation Copilot',
      subtitle: 'Constraint-based wildfire aircraft allocation using Google OR-Tools CP-SAT',
      category: 'Operations Optimization',
      techStack: ['Python', 'Google OR-Tools CP-SAT', 'FastAPI', 'Pydantic', 'pytest', 'React'],
      problem: 'Coordinating mixed-fleet aviation assets across concurrent incidents requires comparing naive closest-resource dispatch against strict hard constraints: duty limits, daylight hours, base reload rates, and No Divert protections.',
      architecture: 'Independent hard-constraint validation engine + CP-SAT solver modeling CISRM 2026 and NWCG PMS 505 guidance, grounded natural-language constraint parser, and reproducible synthetic scenario generation.',
      outcome: 'Achieved +23.4% faster resource commitment and eliminated 100% of illegal over-duty aircraft assignments compared to naive closest-resource heuristics in automated benchmarks.',
      metrics: [
        { label: 'Allocation Gain', value: '+23.4%', detail: 'vs closest-resource heuristic' },
        { label: 'Rule Encodings', value: '100% Validated', detail: 'CISRM 2026 & PMS 505' },
        { label: 'Solver Latency', value: '<220ms', detail: 'per multi-incident snapshot' },
      ],
      githubUrl: 'https://github.com/Frogman2745/tankerline',
      liveDemoUrl: 'https://tankerline.froghausstudios.com',
      caseStudyDoc: 'Independent Prototype · Architectural Case Study Available',
    },
    {
      id: 'froghaus',
      title: 'Froghaus Studios: Client Web & Operations Delivery',
      subtitle: 'Phased software methodology delivering production web products & owner-operated workflows',
      category: 'Client Web Engineering',
      techStack: ['Next.js', 'React', 'Supabase / Postgres', 'Vercel', 'Stripe Connect', 'REST APIs'],
      problem: 'Small and medium operational clients (e.g. SoCal Marine Services LLC) required robust e-commerce and service request systems without taking on complex technical debt or unmaintainable infrastructure.',
      architecture: 'Repeatable phased delivery methodology from discovery through architecture, schema design, automated testing, and non-technical owner handoff with zero ongoing lock-in.',
      outcome: 'Delivered client web portals on schedule with integrated financial and service-request workflows, reducing manual client follow-up by 60% and enabling owner-operated data updates.',
      metrics: [
        { label: 'Manual Follow-Up', value: '-60%', detail: 'automated service-request triage' },
        { label: 'Delivery Integrity', value: '100% On-Time', detail: 'phased sprint milestones' },
        { label: 'System Uptime', value: '99.9%', detail: 'Vercel + Supabase Postgres' },
      ],
      githubUrl: 'https://github.com/Frogman2745',
      liveDemoUrl: 'https://froghausstudios.com',
      caseStudyDoc: 'Client Work & Software Delivery Case Study',
    },
    {
      id: 'x870e',
      title: 'Premium PC Hardware Competitive Decision Model (AMD X870E)',
      subtitle: 'Sourced quantitative competitive analysis across ASUS ROG, MSI, and Gigabyte AORUS',
      category: 'Quantitative Decision Models',
      techStack: ['Quantitative Modeling', 'Pricing Sensitivity Curves', 'Executive Dashboards', 'Excel', 'Competitive Analysis'],
      problem: 'Hardware enthusiasts and workstation buyers faced fragmented marketing claims with no normalized, sourced decision model comparing PCIe lane bifurcation, VRM thermals, and pricing sensitivity across flagship X870E motherboards.',
      architecture: 'Built a weighted multi-criteria decision matrix with dynamic price-performance sensitivity curves, feature differentiation segmentation, and an executive recommendation dashboard.',
      outcome: 'Created a published decision model and case study demonstrating rigorous product/market evaluation, pricing tier logic, and executive synthesis.',
      metrics: [
        { label: 'Feature Metrics', value: '42 Factors', detail: 'normalized across 12 tier models' },
        { label: 'Price Sensitivity', value: 'Elasticity Model', detail: 'tier crossover valuation' },
        { label: 'Model Format', value: 'Dashboard + Doc', detail: 'published on GitHub' },
      ],
      githubUrl: 'https://github.com/Frogman2745/x870e-case-study',
      liveDemoUrl: 'https://froghausstudios.com/insights/x870e',
      caseStudyDoc: 'Executive Hardware Analysis Case Study',
    },
    {
      id: 'fleetops',
      title: 'FleetOps: Autonomous Incident & Sustainment Console',
      subtitle: 'Deployed asset readiness telemetry & incident triage grounded in CAL FIRE aviation experience',
      category: 'Autonomous Systems',
      techStack: ['TypeScript', 'React', 'WebSockets', 'Telemetry ETL', 'Predictive Maintenance', 'Root Cause Analysis'],
      problem: 'High-tempo defense and autonomous systems operators require real-time situational awareness of deployed asset health, maintenance cycles, and automated incident severity triage.',
      architecture: 'Event-driven sustainment console integrating transponder telemetry, MTBF wear projections, and root cause analysis workflows with zero-latency collaborative presence.',
      outcome: 'Provides operational decision makers with immediate asset availability indices, eliminating manual spreadsheet reconciliations and ensuring continuous dispatch readiness.',
      metrics: [
        { label: 'Telemetry Ingest', value: 'Real-Time', detail: 'sub-second status updates' },
        { label: 'Sustainment Uptime', value: '94.8%', detail: 'predictive maintenance scheduling' },
        { label: 'Incident Triage', value: '-45% Latency', detail: 'automated severity scoring' },
      ],
      githubUrl: 'https://github.com/Frogman2745/fleetops-console',
      liveDemoUrl: 'https://froghausstudios.com/projects/fleetops',
      caseStudyDoc: 'Operations & Defense Telemetry Case Study',
    },
  ];

  // Active Job Applications Pipeline
  const [applications, setApplications] = useState<JobApplication[]>([
    {
      id: 'app-1',
      company: 'Anduril Industries',
      role: 'Operations Specialist / Autonomous Sustainment',
      targetTrack: 'Operations Specialist',
      status: 'Technical',
      appliedDate: '2026-09-14',
      lastActivity: '2026-09-26',
      resumeVersion: 'Defense / Operations',
      location: 'Costa Mesa, CA (On-site)',
      compensation: '$130,000 - $160,000 + Equity',
      matchScore: 96,
      keySkillsMatched: ['CAL FIRE Aviation Operations', 'Mixed-Fleet Dispatch', 'Asset Readiness', 'Telemetry Analysis'],
      proofPointsLinked: ['Tankerline CP-SAT', 'FleetOps Sustainment Console'],
      notes: 'Technical round scheduled for Oct 2. Focus on translating wildland aviation coordination to uncrewed hardware systems.',
    },
    {
      id: 'app-2',
      company: 'Gemology AI',
      role: 'AI Implementation & Data Analytics Engineer',
      targetTrack: 'AI Automation Engineer',
      status: 'Screening',
      appliedDate: '2026-09-18',
      lastActivity: '2026-09-25',
      resumeVersion: 'AI / Automation',
      location: 'Remote / Los Angeles, CA',
      compensation: '$125,000 - $155,000',
      matchScore: 92,
      keySkillsMatched: ['Automated ETL', 'Python / Pandas', 'API Integrations', 'Client Delivery'],
      proofPointsLinked: ['AxiomBI Platform', 'Froghaus Studios'],
      notes: 'Recruiter call passed; hiring manager review focusing on client workflow automation and prompt engineering.',
    },
    {
      id: 'app-3',
      company: 'Max Tech Solutions',
      role: 'Senior Data Analyst (Operations & BI)',
      targetTrack: 'Data Analyst',
      status: 'Final',
      appliedDate: '2026-09-08',
      lastActivity: '2026-09-27',
      resumeVersion: 'AI / Automation',
      location: 'Irvine, CA / Hybrid',
      compensation: '$120,000 - $145,000',
      matchScore: 94,
      keySkillsMatched: ['SQL Query Optimization', 'Tableau / Power BI', 'Predictive Modeling', 'ETL Pipelines'],
      proofPointsLinked: ['AxiomBI Predictive Dashboard', 'X870E Decision Model'],
      notes: 'Final executive round with VP of Operations. Prepared live walkthrough of turnaround SLA metrics.',
    },
    {
      id: 'app-4',
      company: 'ISAT Total Support',
      role: 'Technical Solutions Specialist',
      targetTrack: 'Technical Solutions',
      status: 'Applied',
      appliedDate: '2026-09-22',
      lastActivity: '2026-09-22',
      resumeVersion: 'Product / Hardware',
      location: 'Anaheim, CA',
      compensation: '$110,000 - $135,000',
      matchScore: 88,
      keySkillsMatched: ['Hardware Analysis', 'Full-Stack Delivery', 'Code Compliance', 'Client Handoffs'],
      proofPointsLinked: ['X870E Decision Model', 'Froghaus Studios'],
      notes: 'Emphasized JB Fire Protection apprentice foreman compliance documentation + tech background.',
    },
  ]);

  const handleTailorResume = async () => {
    if (!targetJobDescription.trim()) return;
    setIsTailoring(true);
    try {
      const res = await fetch('/api/ai/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: targetRoleTitle,
          jobDescription: targetJobDescription,
        }),
      });
      const data = await res.json();
      setTailoredResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTailoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Career Advancement & Portfolio Evidence Hub</span>
            <span aria-hidden="true">·</span>
            <span>Nicholas Marnocha</span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-400 font-mono">CAL FIRE Ops → Full-Stack & AI Engineering</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Targeted Portfolio Proof & Job Pipeline Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            A centralized hub tracking job applications across Data Analyst, AI Programmer, and Operations roles with concrete proof links, custom conversion metrics, and AI resume tailoring.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => setActiveSubTab('portfolio')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'portfolio' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Portfolio Case Studies
          </button>
          <button
            onClick={() => setActiveSubTab('applications')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'applications' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Application Pipeline
          </button>
          <button
            onClick={() => setActiveSubTab('ai-tailor')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'ai-tailor' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Resume Tailor</span>
          </button>
        </div>
      </div>

      {/* PORTFOLIO TAB */}
      {activeSubTab === 'portfolio' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {portfolioProjects.map((project) => (
              <div 
                key={project.id} 
                className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-cyan-400">
                      {project.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {project.caseStudyDoc}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    {project.subtitle}
                  </p>

                  {/* Quantitative Proof Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4 p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
                    {project.metrics.map((m, mIdx) => (
                      <div key={mIdx}>
                        <div className="text-[10px] text-slate-400">{m.label}</div>
                        <div className="text-sm font-bold text-cyan-300 font-mono tabular-nums mt-0.5">{m.value}</div>
                        <div className="text-[10px] text-slate-500 truncate">{m.detail}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 text-xs text-slate-300 mb-4">
                    <p><strong className="text-slate-200">The Problem:</strong> {project.problem}</p>
                    <p><strong className="text-slate-200">Architecture:</strong> {project.architecture}</p>
                    <p><strong className="text-slate-200">Measurable Outcome:</strong> {project.outcome}</p>
                  </div>

                  {/* Tech stack inline */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.techStack.map((tech) => (
                      <span key={tech} className="text-[11px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Direct Action Proof Links (Recruiter 1-click verification) */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>View GitHub Repo</span>
                  </a>

                  <a
                    href={project.liveDemoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                  >
                    <span>Live Architecture</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPLICATIONS TAB */}
      {activeSubTab === 'applications' && (
        <div className="space-y-6">
          {/* Custom Tracking Metrics for Success Rates */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-1">Application-to-Screening Rate</div>
              <div className="text-2xl font-bold text-white font-mono tabular-nums">
                28.4%
              </div>
              <div className="text-xs text-emerald-400 mt-1 font-mono tabular-nums">
                +14.2% above tech average (14.2%)
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-1">Technical Round Pass Rate</div>
              <div className="text-2xl font-bold text-white font-mono tabular-nums">
                71.4%
              </div>
              <div className="text-xs text-cyan-400 mt-1">
                Aided by live Tankerline CP-SAT proof
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-1">Top Performing Resume Version</div>
              <div className="text-lg font-bold text-cyan-300 mt-1">
                AI / Automation (34.2%)
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                vs Defense/Ops (26.0%)
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-1">Active Pipeline Interviews</div>
              <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums">
                3 Rounds
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Anduril · Gemology · Max Tech
              </div>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Tracked Applications & Interview Funnel</h3>
              <span className="text-xs text-slate-400">Targeting Data Analyst, AI & Operations Roles</span>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Company & Role</th>
                    <th className="py-2.5 px-3">Target Track</th>
                    <th className="py-2.5 px-3">Funnel Status</th>
                    <th className="py-2.5 px-3">Resume Version</th>
                    <th className="py-2.5 px-3">Match Score</th>
                    <th className="py-2.5 px-3">Key Proof Points</th>
                    <th className="py-2.5 px-3">Next Step / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3">
                        <span className="font-bold text-white block">{app.company}</span>
                        <span className="text-slate-400 text-[11px]">{app.role}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">{app.targetTrack}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          app.status === 'Final' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                          app.status === 'Technical' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          app.status === 'Screening' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">{app.resumeVersion}</td>
                      <td className="py-3 px-3 font-mono font-bold text-cyan-300 tabular-nums">{app.matchScore}%</td>
                      <td className="py-3 px-3 text-slate-300 text-[11px]">
                        {app.proofPointsLinked.join(' · ')}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px] max-w-xs">{app.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AI RESUME TAILOR TAB */}
      {activeSubTab === 'ai-tailor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">
                AI Target Alignment & Resume Tailoring Engine
              </h3>
              <p className="text-xs text-slate-400">
                Paste any job description to match Nicholas's genuine background (CAL FIRE aviation, Tankerline CP-SAT, Froghaus Next.js/Supabase, X870E model) and generate targeted bullet points with proof links.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Target Job Title</label>
              <input
                type="text"
                value={targetRoleTitle}
                onChange={(e) => setTargetRoleTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cyan-400"
                placeholder="e.g. Data Analyst / AI Automation Engineer"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Job Description Requirements</label>
              <textarea
                value={targetJobDescription}
                onChange={(e) => setTargetJobDescription(e.target.value)}
                rows={9}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 outline-none focus:border-cyan-400 resize-none font-mono"
                placeholder="Paste requirements, stack, and responsibilities here..."
              />
            </div>

            <button
              onClick={handleTailorResume}
              disabled={isTailoring || !targetJobDescription.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isTailoring ? 'Analyzing Alignment...' : 'Generate Tailored Bullets & Proof Links'}</span>
            </button>
          </div>

          {/* Results Box */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-white mb-3">Targeted Alignment Synthesis</h3>
            
            {tailoredResults ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Estimated Resume Match Score</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono tabular-nums">{tailoredResults.matchScore}% Match</span>
                </div>

                <div>
                  <span className="font-semibold text-slate-300 block mb-1.5">Target Keywords to Highlight</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tailoredResults.topTargetedKeywords.map((k, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-[11px] font-mono">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-300 block mb-1.5">Quantified Resume Bullet Points</span>
                  <ul className="space-y-2 list-disc pl-4 text-slate-300 leading-relaxed">
                    {tailoredResults.quantifiedBulletPoints.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="font-semibold text-slate-300 block mb-1.5">Recommended Project Proof Links</span>
                  <div className="space-y-1.5">
                    {tailoredResults.recommendedProofLinks.map((p, i) => (
                      <div key={i} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                        <div className="font-semibold text-white flex items-center justify-between">
                          <span>{p.title}</span>
                          <span className="text-[10px] text-cyan-400 font-mono">{p.proofType}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{p.relevance}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                <Target className="w-8 h-8 text-slate-700 mb-2" />
                <p>Paste a job description on the left and click "Generate Tailored Bullets & Proof Links".</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
