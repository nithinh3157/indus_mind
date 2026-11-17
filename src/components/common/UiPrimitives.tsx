import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Factory, Info, Search, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ResilientImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}> = ({ src, alt, className = '', fallbackTitle }) => {
  const [errored, setErrored] = useState(false);

  if (errored || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 ${className}`}
      >
        <Factory className="w-8 h-8 mb-2 opacity-60" />
        <span className="text-xs font-medium text-center px-4">{fallbackTitle || alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={className}
    />
  );
};

export const SimulatedBanner: React.FC<{ label?: string }> = ({
  label = 'Simulated Operational Dataset · Pre-FastAPI / MySQL Prototype Mode',
}) => {
  const { thresholds } = useApp();
  if (!thresholds.showSimulatedBadges) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-300">
      <div className="flex items-center gap-2 min-w-0">
        <Info className="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
        <span className="truncate">{label}</span>
      </div>
      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
        SIMULATED DATA
      </span>
    </div>
  );
};

export const KpiCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'critical';
}> = ({ title, value, subtitle, trend, tone = 'neutral' }) => {
  const toneClasses = {
    neutral: 'text-slate-600 dark:text-slate-400',
    positive: 'text-emerald-700 dark:text-emerald-400',
    warning: 'text-amber-700 dark:text-amber-400',
    critical: 'text-rose-700 dark:text-rose-400',
  }[tone];

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2">
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{title}</div>
      <div className="text-2xl font-display font-semibold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums">
        {value}
      </div>
      {(subtitle || trend) && (
        <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-slate-500 dark:text-slate-400 truncate">{subtitle}</span>
          {trend && <span className={`font-medium font-mono tabular-nums whitespace-nowrap shrink-0 ${toneClasses}`}>{trend}</span>}
        </div>
      )}
    </div>
  );
};

export const SectionPanel: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, actions, children, className = '' }) => {
  return (
    <section
      className={`rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden ${className}`}
    >
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-display font-semibold text-slate-900 dark:text-slate-100 truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
};

/**
 * Accessible status indicator combining icon + text label (no pill capsules, no hue-only signaling).
 */
export const StatusLabel: React.FC<{
  status: string;
}> = ({ status }) => {
  const s = status.toLowerCase();
  if (
    s.includes('nominal') ||
    s.includes('running') ||
    s.includes('completed') ||
    s.includes('accepted') ||
    s.includes('verified') ||
    s.includes('optimal') ||
    s.includes('within') ||
    s.includes('resolved') ||
    s.includes('active') && !s.includes('alert') ||
    s.includes('operational') ||
    s === 'low'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  if (
    s.includes('bottleneck') ||
    s.includes('critical') ||
    s.includes('rejected') ||
    s.includes('mismatch') ||
    s.includes('halted') ||
    s.includes('down') ||
    s.includes('violation') ||
    s.includes('unreadable')
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  if (
    s.includes('delay') ||
    s.includes('warning') ||
    s.includes('high') ||
    s.includes('low stock') ||
    s.includes('rework') ||
    s.includes('degraded') ||
    s.includes('moderate') ||
    s.includes('hold')
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <span>{status}</span>
    </span>
  );
};

export const SearchInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = 'Search records...' }) => (
  <div className="relative">
    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 w-56"
    />
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="py-12 px-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</p>
    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
