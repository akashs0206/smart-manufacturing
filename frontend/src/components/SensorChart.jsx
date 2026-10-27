import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

export default function SensorChart({ data = [], title = 'Telemetry Trend', height = 280, defaultMetric = 'all' }) {
  const [metric, setMetric] = useState(defaultMetric);
  const { isDark } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/60 text-slate-500 dark:text-slate-400 text-sm shadow-sm">
        No sensor data available for plotting.
      </div>
    );
  }

  const metricConfigs = {
    all: [
      { key: 'temperature', name: 'Temperature (°C)', color: '#f59e0b', yAxis: 'left' },
      { key: 'vibration', name: 'Vibration (mm/s)', color: '#06b6d4', yAxis: 'right' },
      { key: 'energy', name: 'Energy (kWh)', color: '#6366f1', yAxis: 'left' },
    ],
    temperature: [{ key: 'temperature', name: 'Temperature (°C)', color: '#f59e0b' }],
    vibration: [{ key: 'vibration', name: 'Vibration (mm/s)', color: '#06b6d4' }],
    pressure: [{ key: 'pressure', name: 'Pressure (bar)', color: '#3b82f6' }],
    rpm: [{ key: 'rpm', name: 'RPM', color: '#10b981' }],
    current: [{ key: 'current', name: 'Current (A)', color: '#f97316' }],
    voltage: [{ key: 'voltage', name: 'Voltage (V)', color: '#a855f7' }],
    energy: [{ key: 'energy', name: 'Energy (kWh)', color: '#6366f1' }],
  };

  const activeSeries = metricConfigs[metric] || metricConfigs.all;

  const chartTheme = {
    grid: isDark ? '#1e293b' : '#e2e8f0',
    axisText: isDark ? '#64748b' : '#64748b',
    tooltipBg: isDark ? '#0f172a' : '#ffffff',
    tooltipBorder: isDark ? '#334155' : '#cbd5e1',
    tooltipText: isDark ? '#f8fafc' : '#0f172a',
    tooltipShadow: isDark ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.08)',
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white text-sm tracking-wide">{title}</h4>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Real-time synchronized time-series stream</span>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-industrial-950/80 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
          {[
            { id: 'all', label: 'Overview' },
            { id: 'temperature', label: 'Temp' },
            { id: 'vibration', label: 'Vib' },
            { id: 'pressure', label: 'Press' },
            { id: 'rpm', label: 'RPM' },
            { id: 'energy', label: 'Energy' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMetric(item.id)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                metric === item.id
                  ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorVib" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.8} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(t) => (t ? t.split(' ')[1] || t : '')}
              stroke={chartTheme.axisText}
              fontSize={11}
              fontFamily="monospace"
            />
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
            <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />
            {activeSeries.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                fill={`url(#${s.key === 'temperature' ? 'colorTemp' : s.key === 'vibration' ? 'colorVib' : 'colorEnergy'})`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
