import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Microscope,
  AlertOctagon,
  Blocks,
  FileBarChart2,
  ShieldCheck,
  Radio,
  Server
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activePage, setActivePage }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const navItems = [
    { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard, minRole: 'Operator' },
    { id: 'machines', label: 'Machine Monitoring', icon: Radio, minRole: 'Operator' },
    { id: 'ai-analysis', label: 'AI Analysis & Lab', icon: Microscope, minRole: 'Operator' },
    { id: 'events', label: 'Event Management', icon: AlertOctagon, minRole: 'Operator' },
    { id: 'blockchain', label: 'Blockchain Audit', icon: Blocks, minRole: 'Admin' },
    { id: 'reports', label: 'Reports & Analytics', icon: FileBarChart2, minRole: 'Operator' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800/90 bg-white dark:bg-industrial-950 flex flex-col justify-between py-6 px-4 transition-colors duration-200">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div>
          <p className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Core Modules
          </p>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              const isLocked = item.minRole === 'Admin' && !isAdmin;

              return (
                <button
                  key={item.id}
                  onClick={() => !isLocked && setActivePage(item.id)}
                  disabled={isLocked}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30 shadow-sm font-semibold'
                      : isLocked
                      ? 'text-slate-400 dark:text-slate-600 opacity-60 cursor-not-allowed'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isLocked && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      ADMIN
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Academic Architecture Spec Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-industrial-900/60 p-3.5 text-xs text-slate-600 dark:text-slate-400 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-mono font-semibold text-[11px] mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Architecture Rule</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            Raw telemetry is stored in <strong className="text-slate-800 dark:text-slate-200">MySQL</strong>. Only cryptographic <strong className="text-slate-800 dark:text-slate-200">SHA-256 evidence</strong> of critical events is committed to the <strong className="text-slate-800 dark:text-slate-200">Blockchain</strong>.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span>Active Role:</span>
          <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{user?.role || 'Admin'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>ML Engine:</span>
          <span className="text-emerald-600 dark:text-emerald-400">Dual-Stage Active</span>
        </div>
      </div>
    </aside>
  );
}
