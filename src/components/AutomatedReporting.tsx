import React, { useState, useEffect } from 'react';
import { ConnectedUser } from '../types';
import { realtimeSocket } from '../services/socket';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Printer, 
  Users, 
  Clock, 
  CheckCircle2, 
  Eye, 
  Edit3,
  FileDown,
  Shield,
  Loader2
} from 'lucide-react';
import { exportMarkdownToTacticalPdf } from '../services/pdfReportGenerator';

interface AutomatedReportingProps {
  initialMarkdown: string;
  connectedUsers: ConnectedUser[];
}

export const AutomatedReporting: React.FC<AutomatedReportingProps> = ({
  initialMarkdown,
  connectedUsers,
}) => {
  const [markdown, setMarkdown] = useState<string>(initialMarkdown);
  const [reportVersion, setReportVersion] = useState<number>(1);
  const [lastAuthor, setLastAuthor] = useState<string>('Nicholas Marnocha (Lead)');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfSuccessToast, setPdfSuccessToast] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');

  useEffect(() => {
    // Listen for real-time collaborative updates from other peers
    const unsub = realtimeSocket.on('report:sync', (data: any) => {
      if (data.markdown) {
        setMarkdown(data.markdown);
        setReportVersion(data.version || 1);
        setLastAuthor(data.author || 'Collaborator');
        setLastUpdated(new Date().toLocaleTimeString());
      }
    });

    return () => {
      unsub();
    };
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setMarkdown(newText);
    setReportVersion((prev) => prev + 1);
    setLastAuthor('You (Nicholas Marnocha)');
    setLastUpdated(new Date().toLocaleTimeString());

    // Broadcast change in real-time over WebSocket
    realtimeSocket.sendReportEdit(newText, 'Nicholas Marnocha');
  };

  const handleGenerateAiReport = async () => {
    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusArea: 'flight_operations', timeRange: '30d' }),
      });
      const data = await res.json();
      if (data.reportMarkdown) {
        setMarkdown(data.reportMarkdown);
        setReportVersion((prev) => prev + 1);
        setLastAuthor('Gemini AI Engine');
        setLastUpdated(new Date().toLocaleTimeString());
        realtimeSocket.sendReportEdit(data.reportMarkdown, 'Gemini AI Engine');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportTacticalPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportMarkdownToTacticalPdf(markdown, {
        reportVersion,
        lastAuthor,
        lastUpdated,
        title: 'Executive Operations & Predictive BI Briefing',
      });
      setPdfSuccessToast(`AxiomBI_Tactical_Briefing_v${reportVersion}.pdf generated successfully!`);
      setTimeout(() => setPdfSuccessToast(null), 4000);
    } catch (err) {
      console.error('Failed to export tactical PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const downloadMarkdownFile = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AxiomBI_Executive_Briefing_v${reportVersion}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
        {/* Futuristic Tactical Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Executive Reporting & BI Synthesis</span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-400 font-mono">Real-Time Collaborative WebSockets</span>
            <span aria-hidden="true">·</span>
            <span>Version {reportVersion}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Automated Operations Briefings & Real-Time Collaborative Drafter
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Simultaneously co-author executive briefings with operations leaders. Changes sync instantly across all connected sessions with Last-Write-Wins consistency.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Dedicated Futuristic Dark War-Room PDF Export Button */}
          <button
            onClick={handleExportTacticalPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-cyan-300 bg-slate-950 hover:bg-cyan-950/80 border border-cyan-500/70 hover:border-cyan-400 rounded-lg shadow-md shadow-cyan-950/60 transition-all cursor-pointer disabled:opacity-50 group"
            title="Export Dark Tactical War-Room Formatted PDF"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            )}
            <span>{isExportingPdf ? 'Exporting PDF...' : 'Export Tactical PDF'}</span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-800 text-[9px] font-mono rounded">
              DEFENSE HUD
            </span>
          </button>

          <button
            onClick={handleGenerateAiReport}
            disabled={isAiGenerating}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAiGenerating ? 'Synthesizing...' : 'Regenerate via Gemini'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Browser Print"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={downloadMarkdownFile}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Download Markdown (.md)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* PDF Export Success Toast */}
      {pdfSuccessToast && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-950/80 border border-emerald-500/80 rounded-xl text-xs font-mono text-emerald-300 animate-in fade-in shadow-lg shadow-emerald-950/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{pdfSuccessToast}</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 uppercase">TOP SECRET // TACTICAL PDF SAVED</span>
        </div>
      )}

      {/* Collaboration Live Status Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/40 border border-slate-800 rounded-xl text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Sync Active</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono text-[11px]">
            Revision v{reportVersion} · Last edit by <strong className="text-slate-200">{lastAuthor}</strong> at {lastUpdated}
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg">
          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer ${
              viewMode === 'split' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Split View
          </button>
          <button
            onClick={() => setViewMode('edit')}
            className={`px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer ${
              viewMode === 'edit' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Editor Only
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer ${
              viewMode === 'preview' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Executive Preview
          </button>
        </div>
      </div>

      {/* Editor & Preview Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Collaborative Markdown Editor */}
        {(viewMode === 'split' || viewMode === 'edit') && (
          <div className={`bg-slate-950 border border-slate-800 rounded-xl overflow-hidden ${viewMode === 'edit' ? 'lg:col-span-2' : ''}`}>
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-mono text-slate-300">Markdown Source (Live Broadcast)</span>
              </div>
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              value={markdown}
              onChange={handleTextChange}
              rows={22}
              className="w-full bg-slate-950 p-5 font-mono text-xs text-slate-200 outline-none resize-none leading-relaxed"
              spellCheck={false}
              placeholder="Draft your operational briefing here..."
            />
          </div>
        )}

        {/* Executive Formatted Preview */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className={`bg-slate-900/30 border border-slate-800 rounded-xl p-6 overflow-y-auto max-h-[620px] ${viewMode === 'preview' ? 'lg:col-span-2' : ''}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Formatted Document Preview
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
                Print & Executive Ready
              </span>
            </div>

            {/* Custom Styled Clean Markdown Display */}
            <div className="prose prose-invert prose-sm max-w-none text-slate-300 space-y-4">
              {markdown.split('\n\n').map((block, idx) => {
                const trimmed = block.trim();
                if (trimmed.startsWith('# ')) {
                  return (
                    <h1 key={idx} className="text-xl font-bold text-white tracking-tight pb-2 border-b border-slate-800">
                      {trimmed.replace('# ', '')}
                    </h1>
                  );
                }
                if (trimmed.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-base font-bold text-cyan-300 tracking-tight mt-5 mb-2">
                      {trimmed.replace('## ', '')}
                    </h2>
                  );
                }
                if (trimmed.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-sm font-semibold text-slate-200 mt-3 mb-1">
                      {trimmed.replace('### ', '')}
                    </h3>
                  );
                }
                if (trimmed.startsWith('- ')) {
                  const items = trimmed.split('\n').filter(i => i.startsWith('- '));
                  return (
                    <ul key={idx} className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
                      {items.map((item, iIdx) => (
                        <li key={iIdx} dangerouslySetInnerHTML={{ __html: item.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>') }} />
                      ))}
                    </ul>
                  );
                }
                if (trimmed.startsWith('1. ')) {
                  const items = trimmed.split('\n');
                  return (
                    <ol key={idx} className="list-decimal pl-5 space-y-1.5 text-xs text-slate-300">
                      {items.map((item, iIdx) => (
                        <li key={iIdx} dangerouslySetInnerHTML={{ __html: item.replace(/^\d+\.\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>') }} />
                      ))}
                    </ol>
                  );
                }
                if (trimmed.startsWith('---')) {
                  return <hr key={idx} className="border-slate-800 my-4" />;
                }
                return (
                  <p 
                    key={idx} 
                    className="text-xs text-slate-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>') }}
                  />
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
