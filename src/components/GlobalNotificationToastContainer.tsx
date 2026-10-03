import React from 'react';
import { useToast, ToastNotification, ToastType } from '../context/ToastContext';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Play,
  X,
  Radio,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Activity,
  Check
} from 'lucide-react';

const getToastIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
    case 'error':
      return <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
    case 'pipeline':
      return <Activity className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />;
    case 'info':
    default:
      return <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />;
  }
};

const getToastStyles = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'border-emerald-500/40 bg-slate-950/95 shadow-emerald-950/20';
    case 'error':
      return 'border-red-500/40 bg-slate-950/95 shadow-red-950/20';
    case 'warning':
      return 'border-amber-500/40 bg-slate-950/95 shadow-amber-950/20';
    case 'pipeline':
      return 'border-cyan-500/50 bg-slate-950/95 shadow-cyan-950/30';
    case 'info':
    default:
      return 'border-slate-800 bg-slate-950/95 shadow-slate-950/40';
  }
};

export const GlobalNotificationToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-16 right-4 sm:right-6 z-50 flex flex-col items-end gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto w-full p-3 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 font-sans text-xs flex items-start gap-3 animate-in slide-in-from-top-2 fade-in ${getToastStyles(
            toast.type
          )}`}
          role="status"
        >
          {getToastIcon(toast.type)}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-white text-[12px] truncate">
                {toast.title}
              </span>
              <span className="font-mono text-[10px] text-slate-500 shrink-0">
                {toast.timestamp}
              </span>
            </div>

            {toast.message && (
              <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">
                {toast.message}
              </p>
            )}

            {toast.actionLabel && toast.onAction && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.onAction?.();
                  removeToast(toast.id);
                }}
                className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 transition-colors cursor-pointer"
              >
                <span>{toast.actionLabel}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors cursor-pointer shrink-0 mt-0.5"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
