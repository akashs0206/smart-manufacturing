import React from 'react';
import { Activity, Gauge, Flame, Zap, Waves, Cpu, ChevronRight } from 'lucide-react';
import RiskBadge from './RiskBadge';

export default function MachineCard({ machine, onSelect }) {
  const tel = machine.latest_telemetry || {};

  return (
    <div
      onClick={() => onSelect(machine.machine_id)}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-industrial-900/90 p-5 transition-all duration-300 hover:border-cyan-400 dark:hover:border-cyan-500/50 hover:bg-slate-50/90 dark:hover:bg-industrial-850 shadow-sm dark:shadow-none hover:shadow-md"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800/60 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-200 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 font-mono font-bold text-sm group-hover:scale-105 transition-transform shadow-sm">
            {machine.machine_id}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
              {machine.machine_name}
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider">
              {machine.machine_type}
            </span>
          </div>
        </div>
        <RiskBadge level={machine.status} />
      </div>

      {/* Sensor Metrics Grid */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        {/* Temp */}
        <div className="rounded-lg bg-slate-100/80 dark:bg-industrial-950/60 p-2 border border-slate-200/80 dark:border-slate-800/60">
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
            <Flame className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Temp
          </span>
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
            {tel.temperature !== undefined ? `${tel.temperature}°C` : '--'}
          </span>
        </div>

        {/* Pressure */}
        <div className="rounded-lg bg-slate-100/80 dark:bg-industrial-950/60 p-2 border border-slate-200/80 dark:border-slate-800/60">
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
            <Gauge className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Press
          </span>
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
            {tel.pressure !== undefined ? `${tel.pressure} bar` : '--'}
          </span>
        </div>

        {/* Vibration */}
        <div className="rounded-lg bg-slate-100/80 dark:bg-industrial-950/60 p-2 border border-slate-200/80 dark:border-slate-800/60">
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
            <Waves className="w-3 h-3 text-orange-500 dark:text-orange-400" /> Vib
          </span>
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
            {tel.vibration !== undefined ? `${tel.vibration} mm/s` : '--'}
          </span>
        </div>

        {/* RPM */}
        <div className="rounded-lg bg-slate-100/80 dark:bg-industrial-950/60 p-2 border border-slate-200/80 dark:border-slate-800/60">
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
            <Activity className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> RPM
          </span>
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
            {tel.rpm !== undefined ? `${tel.rpm}` : '--'}
          </span>
        </div>

        {/* Current */}
        <div className="rounded-lg bg-slate-100/80 dark:bg-industrial-950/60 p-2 border border-slate-200/80 dark:border-slate-800/60">
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
            <Zap className="w-3 h-3 text-amber-500 dark:text-yellow-400" /> Current
          </span>
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
            {tel.current !== undefined ? `${tel.current} A` : '--'}
          </span>
        </div>

        {/* Energy */}
        <div className="rounded-lg bg-slate-100/80 dark:bg-industrial-950/60 p-2 border border-slate-200/80 dark:border-slate-800/60">
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
            <Cpu className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Energy
          </span>
          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
            {tel.energy !== undefined ? `${tel.energy} kWh` : '--'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/40 text-xs text-slate-500 dark:text-slate-400">
        <span>Logged Events: <strong className="text-slate-800 dark:text-slate-200">{machine.total_events || 0}</strong></span>
        <span className="flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400 font-medium group-hover:translate-x-1 transition-transform">
          Diagnostics <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}
