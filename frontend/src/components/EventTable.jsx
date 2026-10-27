import React from 'react';
import RiskBadge from './RiskBadge';
import BlockchainStatus from './BlockchainStatus';
import { Eye, ShieldCheck, ChevronRight } from 'lucide-react';

export default function EventTable({ events = [], onSelectEvent, onRecordBlockchain, showMachine = true }) {
  if (!events || events.length === 0) {
    return (
      <div className="p-8 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/60 text-slate-500 dark:text-slate-400 shadow-sm">
        No security or operational events recorded matching the criteria.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 shadow-sm">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-industrial-950/80 text-slate-600 dark:text-slate-400 font-mono uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3.5">Event ID</th>
            {showMachine && <th className="px-4 py-3.5">Machine</th>}
            <th className="px-4 py-3.5">Event Type</th>
            <th className="px-4 py-3.5">Anomaly Score</th>
            <th className="px-4 py-3.5">Risk Level</th>
            <th className="px-4 py-3.5">Timestamp</th>
            <th className="px-4 py-3.5">Blockchain Notarization</th>
            <th className="px-4 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
          {events.map((evt) => {
            const isEligible = (evt.risk_level === 'HIGH' || evt.risk_level === 'CRITICAL') && evt.blockchain_status !== 'RECORDED';

            return (
              <tr
                key={evt.id || evt.event_id}
                className="hover:bg-slate-50/90 dark:hover:bg-industrial-850/80 transition-colors group cursor-pointer"
                onClick={() => onSelectEvent && onSelectEvent(evt.event_id)}
              >
                <td className="px-4 py-3.5 font-mono font-semibold text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-cyan-400"></span>
                  {evt.event_id}
                </td>
                {showMachine && (
                  <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-cyan-300 border border-slate-300 dark:border-slate-700 font-semibold text-[11px]">
                      {evt.machine_id}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3.5 font-medium max-w-[200px] truncate text-slate-800 dark:text-slate-200" title={evt.event_type}>
                  {evt.event_type.replace(/_/g, ' ')}
                </td>
                <td className="px-4 py-3.5 font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-12 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${evt.anomaly_score > 0.75 ? 'bg-red-500' : evt.anomaly_score > 0.5 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(100, Math.round((evt.anomaly_score || 0) * 100))}%` }}
                      />
                    </div>
                    <span>{typeof evt.anomaly_score === 'number' ? evt.anomaly_score.toFixed(3) : evt.anomaly_score}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <RiskBadge level={evt.risk_level} />
                </td>
                <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                  {evt.timestamp}
                </td>
                <td className="px-4 py-3.5">
                  <BlockchainStatus
                    status={evt.blockchain_status}
                    txHash={evt.blockchain_tx}
                    blockNumber={evt.block_number}
                  />
                </td>
                <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    {isEligible && onRecordBlockchain && (
                      <button
                        onClick={() => onRecordBlockchain(evt.event_id)}
                        className="px-2.5 py-1 text-xs font-mono rounded bg-indigo-50 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/40 hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-1 shadow-sm font-semibold"
                        title="Commit cryptographic SHA-256 evidence to Smart Contract"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Record
                      </button>
                    )}
                    <button
                      onClick={() => onSelectEvent && onSelectEvent(evt.event_id)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
                      title="View complete event audit breakdown"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
