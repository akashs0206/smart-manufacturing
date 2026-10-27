import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'cyan', trend = null }) {
  const colorMap = {
    cyan: 'border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 group-hover:border-cyan-400 dark:group-hover:border-cyan-500/60',
    emerald: 'border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 group-hover:border-emerald-400 dark:group-hover:border-emerald-500/60',
    amber: 'border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 group-hover:border-amber-400 dark:group-hover:border-amber-500/60',
    orange: 'border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 group-hover:border-orange-400 dark:group-hover:border-orange-500/60',
    crimson: 'border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 group-hover:border-red-400 dark:group-hover:border-red-500/60',
    indigo: 'border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 group-hover:border-indigo-400 dark:group-hover:border-indigo-500/60',
  };

  const iconBg = colorMap[color] || colorMap.cyan;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-industrial-900/90 p-5 backdrop-blur-sm transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-industrial-850 shadow-sm">
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color === 'crimson' ? 'from-red-500 to-rose-600' : color === 'indigo' ? 'from-indigo-500 to-cyan-500' : color === 'emerald' ? 'from-emerald-500 to-teal-400' : color === 'orange' ? 'from-orange-500 to-amber-500' : color === 'amber' ? 'from-amber-500 to-yellow-400' : 'from-cyan-500 to-blue-500'}`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
            {title}
          </p>
          <h3 className="mt-2 text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
            {value ?? '--'}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg border ${iconBg} transition-all duration-300 shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
