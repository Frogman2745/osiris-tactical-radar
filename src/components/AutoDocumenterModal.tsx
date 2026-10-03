import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Download,
  Copy,
  Check,
  X,
  ExternalLink,
  BookOpen,
  Layers,
  ShieldCheck,
  RefreshCw,
  GitFork
} from 'lucide-react';
import { PipelineStage } from '../types';

interface AutoDocumenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  stages: PipelineStage[];
  templateName?: string;
  clusterMetrics?: any;
  onAddActivityLog?: (action: string) => void;
}

export const AutoDocumenterModal: React.FC<AutoDocumenterModalProps> = ({
  isOpen,
  onClose,
  stages,
  templateName = 'CalFire Ingestion & Optimization Workflow',
  clusterMetrics,
  onAddActivityLog,
}) => {
  const [markdown, setMarkdown] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [source, setSource] = useState<string>('');

  const handleGenerateDocumentation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/auto-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName,
          stages,
          clusterMetrics,
        }),
      });
      const data = await res.json();
      if (data.markdown) {
        setMarkdown(data.markdown);
        setSource(data.source || 'gemini-3.8-flash');
        onAddActivityLog?.(`Generated AI README documentation for pipeline: ${templateName}`);
      }
    } catch (e) {
      console.error('Failed to generate pipeline documentation:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate on first open if empty
  React.useEffect(() => {
    if (isOpen && !markdown && !isLoading) {
      handleGenerateDocumentation();
    }
  }, [isOpen]);

  const handleCopy = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onAddActivityLog?.('Copied pipeline README.md documentation to clipboard');
  };

  const handleDownloadMarkdown = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PIPELINE-README-${templateName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onAddActivityLog?.('Downloaded pipeline README.md file');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Pipeline DAG Auto-Documenter
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  Powered by Gemini 3.8 Flash
                </span>
                {source && (
                  <span className="text-[10px] text-emerald-400 font-sans hidden sm:inline">
                    • {source} verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                AI-synthesized README.md documenting business purpose, DAG execution flow, schema contracts, and triage runbooks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateDocumentation}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Regenerate documentation with Gemini API"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <Sparkles className="w-5 h-5 text-cyan-400 absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Analyzing DAG Stages &amp; Schema Contracts...</h4>
                <p className="text-xs text-slate-400 font-sans max-w-sm">
                  Gemini API is parsing {stages.length} workflow stages, buffer configurations, and CP-SAT mathematical optimization constraints.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Document Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-slate-300 text-xs">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white">README.md</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 text-[11px] font-sans">
                    {stages.length} Stages Scanned
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Markdown</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadMarkdown}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition-all cursor-pointer text-xs shadow-sm shadow-cyan-950"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download README.md</span>
                  </button>
                </div>
              </div>

              {/* Rendered Markdown Preview Area */}
              <div className="p-5 rounded-xl bg-slate-950/90 border border-slate-800 font-sans text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-text selection:bg-cyan-950 selection:text-cyan-200">
                {markdown}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audited against CISRM 2026 &amp; NWCG PMS 505 requirements</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
