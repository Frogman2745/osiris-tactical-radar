import React, { useRef, useState, useEffect } from 'react';
import { NavigationTab, ConnectedUser } from '../types';
import { Play, Radio, Users, Sparkles, CheckCircle2, Code2, Activity, ShieldAlert, ChevronLeft, ChevronRight, Command, BookOpen } from 'lucide-react';

interface HeaderProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  connectedUsers: ConnectedUser[];
  onTriggerPipeline: () => void;
  isPipelineRunning: boolean;
  isSocketConnected: boolean;
  onOpenRecruiterTour: () => void;
  onOpenEngineeringModal: () => void;
  onOpenLatencyMonitor: () => void;
  onOpenAuditModal: () => void;
  onOpenCommandPalette: () => void;
  onOpenDocumentationModal?: (tab?: 'manual' | 'casestudy' | 'architecture' | 'slides' | 'publish' | 'provenance') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  connectedUsers,
  onTriggerPipeline,
  isPipelineRunning,
  isSocketConnected,
  onOpenRecruiterTour,
  onOpenEngineeringModal,
  onOpenLatencyMonitor,
  onOpenAuditModal,
  onOpenCommandPalette,
  onOpenDocumentationModal,
}) => {
  const navScrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  const checkScroll = () => {
    if (navScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navScrollRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scrollNav = (direction: 'left' | 'right') => {
    if (navScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      navScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  const navCategories: { id: NavigationTab; label: string; badge?: string }[] = [
    { id: 'pipelines', label: 'ETL Orchestrator' },
    { id: 'predictive-bi', label: 'Predictive BI & SLAs' },
    { id: 'analytics-studio', label: 'SQL & Python Studio' },
    { id: 'reporting', label: 'Collaborative Briefings' },
    { id: 'career-hub', label: 'Career & Portfolio Hub' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Primary row: brand + system actions */}
        <div className="flex items-center shrink-0">
          <button 
            onClick={() => onTabChange('pipelines')}
            className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors shrink-0 text-left cursor-pointer"
          >
            AxiomBI
          </button>
        </div>

        {/* Zone 3: Primary System Actions & Presence */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Real-Time Live Presence Cluster */}
          <div 
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
            title={`${connectedUsers.length} active collaborator(s) online`}
          >
            <span className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className="hidden md:inline font-mono tabular-nums text-slate-400">
              {connectedUsers.length} live
            </span>
            <div className="flex -space-x-1.5 overflow-hidden ml-1">
              {connectedUsers.slice(0, 3).map((u, i) => (
                <div
                  key={u.id || i}
                  style={{ backgroundColor: u.color || '#06b6d4' }}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-950 ring-1 ring-slate-950 uppercase"
                  title={`${u.name} (${u.role})`}
                >
                  {u.name.slice(0, 1)}
                </div>
              ))}
            </div>
          </div>

          {/* Command Palette Trigger Button (Cmd+K) */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-mono text-slate-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-lg transition-all whitespace-nowrap cursor-pointer shadow-sm group"
            title="Open Global Command Palette (Cmd+K or Ctrl+K)"
          >
            <Command className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Commands</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.2 rounded text-[10px] bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-cyan-300">
              ⌘K
            </kbd>
          </button>

          {/* Advanced System Audit Button */}
          <button
            onClick={onOpenAuditModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-500/50 rounded-lg transition-all whitespace-nowrap cursor-pointer shadow-sm group"
            title="Open Advanced System Audit: Application logs, exception traces & runtime health"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 group-hover:animate-pulse" />
            <span className="hidden sm:inline">System Audit</span>
            <span className="sm:hidden">Audit</span>
          </button>

          {/* Data Provenance & Demo Scenario Disclosure Pill */}
          <button
            onClick={() => onOpenDocumentationModal?.('provenance')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/70 hover:bg-amber-900/70 border border-amber-500/50 rounded-lg transition-all whitespace-nowrap cursor-pointer shadow-sm group font-mono"
            title="Data Provenance & Regulatory Source Record Audit: Synthetic simulation scenario based on CAL FIRE 20m Initial Attack response objectives. Click to inspect full disclosure."
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="hidden sm:inline">DEMO SCENARIO</span>
            <span className="sm:hidden">DEMO</span>
          </button>

          {/* Simulated API Latency Beacon Pill */}
          <button
            onClick={onOpenLatencyMonitor}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-xs text-slate-300 font-mono transition-all cursor-pointer shadow-sm group"
            title="Simulated API latency monitor · generated scenario values"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400 group-hover:animate-pulse" />
            <span className="text-cyan-300 font-bold">18ms</span>
            <span className="text-[10px] text-slate-500">(P95)</span>
          </button>

          {/* Engineering ADRs & Live Vitest Tests */}
          <button
            onClick={onOpenEngineeringModal}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-lg transition-all whitespace-nowrap cursor-pointer shadow-sm"
            title="View Vitest unit test suite and Architecture Decision Records (ADRs)"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>ADRs & Tests (17)</span>
          </button>

          {/* Executive Documentation, Case Study & Slide Deck */}
          <button
            onClick={() => onOpenDocumentationModal?.('manual')}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 rounded-lg transition-all whitespace-nowrap cursor-pointer shadow-sm group"
            title="Open Executive Documentation Hub: Operator manual, error case study, architecture diagrams & interactive slide deck"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-6 transition-transform" />
            <span>Manual & Slides</span>
          </button>

          {/* Interactive Recruiter Guided Tour CTA */}
          <button
            onClick={onOpenRecruiterTour}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 hover:from-cyan-300 hover:to-indigo-200 rounded-lg transition-all shadow-md shadow-cyan-500/20 whitespace-nowrap cursor-pointer ring-1 ring-cyan-300/50"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-current animate-pulse" />
            <span>Tour</span>
          </button>

          {/* Trigger Pipeline Action */}
          <button
            onClick={onTriggerPipeline}
            disabled={isPipelineRunning}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer shadow-sm ${
              isPipelineRunning
                ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-cyan-500/20 hover:shadow-cyan-500/30'
            }`}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isPipelineRunning ? 'animate-spin' : ''}`} />
            <span>{isPipelineRunning ? 'Running...' : 'Run ETL'}</span>
          </button>
        </div>

      </div>

      {/* Dedicated navigation row keeps every workspace reachable at all widths. */}
      <div className="max-w-7xl mx-auto relative flex items-center min-w-0 mt-2.5 pt-2 border-t border-slate-900 group">
        {canScrollLeft && (
          <button
            onClick={() => scrollNav('left')}
            className="absolute left-0 z-20 w-7 h-8 rounded-l bg-slate-950/95 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-400 flex items-center justify-center transition-colors cursor-pointer shadow-md backdrop-blur-sm"
            aria-label="Scroll left categories"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div
          ref={navScrollRef}
          onScroll={checkScroll}
          className="flex w-full items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth px-1 pb-0.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {navCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onTabChange(cat.id)}
              className={`whitespace-nowrap transition-all cursor-pointer px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border shrink-0 ${
                activeTab === cat.id
                  ? 'bg-cyan-950/80 border-cyan-500/70 text-cyan-300 font-semibold shadow-sm shadow-cyan-950'
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scrollNav('right')}
            className="absolute right-0 z-20 w-7 h-8 rounded-r bg-slate-950/95 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-400 flex items-center justify-center transition-colors cursor-pointer shadow-md backdrop-blur-sm"
            aria-label="Scroll right categories"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
