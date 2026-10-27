import React, { useEffect, useState } from 'react';
import {
  Server,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Blocks,
  Flame,
  Waves,
  Zap,
  TrendingUp,
  Cpu,
  RefreshCw,
  PieChart as PieIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

import StatCard from '../components/StatCard';
import EventTable from '../components/EventTable';
import SensorChart from '../components/SensorChart';
import { reportService, eventService, sensorService } from '../services/api';
import { useWeb3 } from '../context/Web3Context';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard({ onSelectMachine, onSelectEvent }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFleetStreaming, setIsFleetStreaming] = useState(true);
  const [isTicking, setIsTicking] = useState(false);
  const { isConnected, recordEventWithMetaMask } = useWeb3();
  const { isDark } = useTheme();

  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const res = await reportService.getSummary();
      setSummary(res.data);
    } catch (err) {
      console.error('Error fetching summary:', err);
      setError('Unable to reach backend REST API. Check if Flask is running on port 5000.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const triggerFleetTick = async () => {
    try {
      setIsTicking(true);
      await sensorService.simulateFleetTick();
      await fetchDashboardData(false);
    } catch (err) {
      console.warn('Fleet simulation tick notice:', err);
    } finally {
      setIsTicking(false);
    }
  };

  const handleRecordBlockchain = async (eventId) => {
    try {
      if (isConnected) {
        const evt = summary?.recent_events?.find((e) => e.event_id === eventId);
        if (evt) {
          await recordEventWithMetaMask(evt);
          await fetchDashboardData(false);
          return;
        }
      }
      await eventService.recordToBlockchain(eventId);
      fetchDashboardData(false);
    } catch (err) {
      alert('Error recording to blockchain: ' + (err.reason || err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
  }, []);

  // Continuous Live Factory Floor Simulation
  useEffect(() => {
    let interval = null;
    if (isFleetStreaming) {
      interval = setInterval(triggerFleetTick, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFleetStreaming]);

  const metrics = summary?.metrics || {};

  const chartTheme = {
    grid: isDark ? '#1e293b' : '#e2e8f0',
    axisText: '#64748b',
    tooltipBg: isDark ? '#0f172a' : '#ffffff',
    tooltipBorder: isDark ? '#334155' : '#cbd5e1',
    tooltipText: isDark ? '#f8fafc' : '#0f172a',
    tooltipShadow: isDark ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.08)',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome with Live Simulation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Smart Manufacturing Overview</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Real-time condition monitoring, AI anomaly classification, and blockchain cryptographic evidence ledger
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Simulator Toggle */}
          <button
            onClick={() => setIsFleetStreaming(!isFleetStreaming)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs transition-all ${
              isFleetStreaming
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/50 shadow-sm font-semibold'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Toggle automatic 3-second live factory floor sensor simulation across all machines"
          >
            <span className="relative flex h-2 w-2">
              {isFleetStreaming && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isFleetStreaming ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'}`}></span>
            </span>
            <span>{isFleetStreaming ? 'LIVE FACTORY SIMULATOR (3s)' : 'SIMULATOR PAUSED'}</span>
          </button>

          {/* Pulse Fleet Telemetry Button */}
          <button
            onClick={triggerFleetTick}
            disabled={isTicking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-mono transition-colors shadow-sm"
            title="Generate a live physical sensor pulse across all 10 factory machines"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTicking ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
            <span>Pulse Fleet</span>
          </button>

          <button
            onClick={() => fetchDashboardData(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-industrial-900 text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-400 hover:border-cyan-400 dark:hover:border-cyan-500/40 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs shadow-sm">
          {error}
        </div>
      )}

      {/* 1. Summary Cards (7 Total) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard
          title="Total Machines"
          value={metrics.total_machines}
          subtitle="Monitored Units"
          icon={Server}
          color="cyan"
        />
        <StatCard
          title="Normal Machines"
          value={metrics.normal_machines}
          subtitle="Nominal Regime"
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Anomalies"
          value={metrics.anomalies_detected}
          subtitle="Isolation Forest"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Suspicious"
          value={metrics.suspicious_events}
          subtitle="Tamper Scenarios"
          icon={AlertOctagon}
          color="orange"
        />
        <StatCard
          title="High Risk"
          value={metrics.high_risk_events}
          subtitle="Critical Action Req."
          icon={Flame}
          color="orange"
        />
        <StatCard
          title="Critical Events"
          value={metrics.critical_events}
          subtitle="Severe Violations"
          icon={ShieldAlert}
          color="crimson"
        />
        <StatCard
          title="Blockchain Notarized"
          value={metrics.blockchain_recorded_events}
          subtitle="SHA-256 On-Chain"
          icon={Blocks}
          color="indigo"
        />
      </div>

      {/* 2. Analytical Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Machine Status Distribution Donut Chart */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Machine Health Distribution</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Current Fleet Operational Status</p>
            </div>
            <PieIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={summary?.machine_status_distribution || []}
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(summary?.machine_status_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    borderColor: chartTheme.tooltipBorder,
                    color: chartTheme.tooltipText,
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    boxShadow: chartTheme.tooltipShadow,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Level Distribution Bar Chart */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Risk Level Distribution</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Classified Severity Levels</p>
            </div>
            <TrendingUp className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer>
              <BarChart data={summary?.risk_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="name" stroke={chartTheme.axisText} fontSize={11} fontFamily="monospace" />
                <YAxis stroke={chartTheme.axisText} fontSize={11} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    borderColor: chartTheme.tooltipBorder,
                    color: chartTheme.tooltipText,
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    boxShadow: chartTheme.tooltipShadow,
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(summary?.risk_distribution || []).map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Machines by Anomalies */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Machine Anomaly Frequency</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Units with Highest Deviation Rates</p>
            </div>
            <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="space-y-3">
            {(summary?.machine_anomalies?.slice(0, 5) || []).map((m, idx) => (
              <div
                key={m.machine_id}
                onClick={() => onSelectMachine && onSelectMachine(m.machine_id)}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-industrial-950/80 border border-slate-200 dark:border-slate-800/80 hover:border-cyan-400 dark:hover:border-cyan-500/40 cursor-pointer transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded bg-slate-200 dark:bg-slate-800 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
                    {m.machine_id}
                  </span>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">Machine {m.machine_id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">{m.count} events</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">VIEW →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Global Multi-Sensor Telemetry Trends */}
      <SensorChart
        data={summary?.telemetry_trend || []}
        title="Factory Floor Telemetry Trends (Multi-Sensor Synchronization)"
        height={260}
      />

      {/* 4. Recent Events Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Recent Anomaly & Security Events</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Live stream of detected physical faults and controlled tampering scenarios</p>
          </div>
        </div>
        <EventTable
          events={summary?.recent_events || []}
          onSelectEvent={onSelectEvent}
          onRecordBlockchain={handleRecordBlockchain}
        />
      </div>
    </div>
  );
}
