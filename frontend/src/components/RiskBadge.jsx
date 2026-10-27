import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';

export default function RiskBadge({ level = 'LOW', size = 'sm' }) {
  const normLevel = (level || 'LOW').toUpperCase();

  const configs = {
    LOW: {
      label: 'LOW',
      bg: 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400',
      dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      icon: ShieldCheck,
    },
    NORMAL: {
      label: 'NORMAL',
      bg: 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400',
      dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      icon: ShieldCheck,
    },
    MEDIUM: {
      label: 'MEDIUM',
      bg: 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300',
      dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
      icon: AlertTriangle,
    },
    HIGH: {
      label: 'HIGH',
      bg: 'bg-orange-50 dark:bg-orange-950/70 border-orange-300 dark:border-orange-500/40 text-orange-800 dark:text-orange-400',
      dot: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]',
      icon: AlertCircle,
    },
    ANOMALY: {
      label: 'HIGH / ANOMALY',
      bg: 'bg-orange-50 dark:bg-orange-950/70 border-orange-300 dark:border-orange-500/40 text-orange-800 dark:text-orange-400',
      dot: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]',
      icon: AlertCircle,
    },
    CRITICAL: {
      label: 'CRITICAL',
      bg: 'bg-red-50 dark:bg-red-950/80 border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-400 animate-pulse',
      dot: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
      icon: ShieldAlert,
    },
  };

  const current = configs[normLevel] || configs.LOW;
  const IconComponent = current.icon;
  const sizeClasses = size === 'lg' ? 'px-3 py-1.5 text-sm font-semibold' : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${current.bg} ${sizeClasses} font-mono tracking-wide`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
      <IconComponent className="w-3.5 h-3.5" />
      {current.label}
    </span>
  );
}
