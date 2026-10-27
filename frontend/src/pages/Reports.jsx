import React, { useEffect, useState } from 'react';
import {
  FileBarChart2,
  Download,
  Printer,
  ShieldCheck,
  AlertOctagon,
  Blocks,
  Cpu,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import { reportService, eventService } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [sumRes, evtRes] = await Promise.all([
        reportService.getSummary(),
        eventService.getAll({ limit: 500 }),
      ]);
      setSummary(sumRes.data);
      setEvents(evtRes.data.data || []);
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const handleExportCSV = () => {
    if (!events.length) return;
    const headers = ['Event_ID', 'Machine_ID', 'Timestamp', 'Event_Type', 'Anomaly_Score', 'Classification', 'Risk_Level', 'SHA256_Hash', 'Blockchain_Status', 'Blockchain_TX'];
    const rows = events.map((e) => [
      e.event_id,
      e.machine_id,
      e.timestamp,
      `"${e.event_type}"`,
      e.anomaly_score,
      `"${e.classification}"`,
      e.risk_level,
      e.data_hash || '',
      e.blockchain_status,
      e.blockchain_tx || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smart_manufacturing_audit_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      generated_at: new Date().toISOString(),
      metrics: summary?.metrics,
      machine_anomalies: summary?.machine_anomalies,
      events: events
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `smart_manufacturing_audit_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const metrics = summary?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileBarChart2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Operational & Forensic Audit Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Aggregated metrics, machine deviation distributions, risk stratification, and export-ready compliance audits
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-mono font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/40 text-xs font-mono font-semibold text-indigo-800 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-industrial-900 text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-4 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Total Machines</span>
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">{metrics.total_machines || '--'}</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-4 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Total Anomalies</span>
          <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">{metrics.anomalies_detected || '--'}</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-4 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Suspicious Events</span>
          <span className="text-2xl font-bold font-mono text-orange-600 dark:text-orange-400 mt-1 block">{metrics.suspicious_events || '--'}</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-4 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block">High Risk Events</span>
          <span className="text-2xl font-bold font-mono text-orange-600 dark:text-orange-400 mt-1 block">{metrics.high_risk_events || '--'}</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-4 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Critical Events</span>
          <span className="text-2xl font-bold font-mono text-red-600 dark:text-red-400 mt-1 block">{metrics.critical_events || '--'}</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-4 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block">On-Chain Evidence</span>
          <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1 block">{metrics.blockchain_recorded_events || '--'}</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-4 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 block">Integrity Rate</span>
          <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">100%</span>
        </div>
      </div>

      {/* Charts: Machine-wise and Event Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Machine Breakdown */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Machine-Wise Anomaly Distribution</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-4">Total detected faults per machine ID</p>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <BarChart data={summary?.machine_anomalies || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="machine_id" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Event Type Breakdown */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Detected Fault & Scenario Breakdown</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-4">Physical failure modes vs simulated data tampering</p>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <BarChart data={summary?.event_type_distribution || []} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis type="number" stroke="#64748b" fontSize={10} fontFamily="monospace" />
                <YAxis dataKey="type" type="category" stroke="#64748b" fontSize={10} fontFamily="monospace" tickFormatter={(t) => t.slice(0, 14)} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Compliance / Summary Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-5 space-y-3 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Forensic Compliance Log</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2 px-3">Event ID</th>
                <th className="py-2 px-3">Machine</th>
                <th className="py-2 px-3">Classification</th>
                <th className="py-2 px-3">Risk Level</th>
                <th className="py-2 px-3">SHA-256 Digest</th>
                <th className="py-2 px-3">Blockchain Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-800 dark:text-slate-300">
              {events.slice(0, 15).map((e) => (
                <tr key={e.id || e.event_id} className="hover:bg-slate-50 dark:hover:bg-industrial-950/60 transition-colors">
                  <td className="py-2.5 px-3 text-cyan-700 dark:text-cyan-400 font-bold">{e.event_id}</td>
                  <td className="py-2.5 px-3">{e.machine_id}</td>
                  <td className="py-2.5 px-3">{e.classification}</td>
                  <td className="py-2.5 px-3"><RiskBadge level={e.risk_level} /></td>
                  <td className="py-2.5 px-3 text-[10px] text-slate-500 dark:text-slate-400">{e.data_hash ? `${e.data_hash.slice(0, 16)}...` : 'N/A'}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${e.blockchain_status === 'RECORDED' ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                      {e.blockchain_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
