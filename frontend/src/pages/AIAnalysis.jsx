import React, { useState } from 'react';
import {
  Microscope,
  Cpu,
  Flame,
  Gauge,
  Waves,
  Activity,
  Zap,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Blocks,
  ArrowRight,
  RefreshCw,
  Hash,
  Sliders,
  Wallet,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import RiskBadge from '../components/RiskBadge';
import { aiService } from '../services/api';
import { useWeb3 } from '../context/Web3Context';
import { useTheme } from '../context/ThemeContext';

export default function AIAnalysis({ initialTelemetry = null, initialMachineId = 'M01', onEventLogged, onNavigateBlockchain }) {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState(() => ({
    machine_id: initialMachineId || 'M01',
    temperature: initialTelemetry?.temperature ?? 55.0,
    pressure: initialTelemetry?.pressure ?? 4.5,
    vibration: initialTelemetry?.vibration ?? 1.2,
    rpm: initialTelemetry?.rpm ?? 2800.0,
    current: initialTelemetry?.current ?? 14.5,
    voltage: initialTelemetry?.voltage ?? 400.0,
    energy: initialTelemetry?.energy ?? 8.5,
  }));

  const [analyzing, setAnalyzing] = useState(false);
  const [metaMaskNotarizing, setMetaMaskNotarizing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [persistedNotice, setPersistedNotice] = useState(null);
  const [metaMaskReceipt, setMetaMaskReceipt] = useState(null);

  const { recordEventWithMetaMask, isConnected, connectWallet } = useWeb3();

  const presets = [
    {
      name: '1. Normal Baseline',
      desc: 'Nominal operating state across all physical variables',
      data: { machine_id: 'M01', temperature: 54.2, pressure: 4.5, vibration: 1.15, rpm: 2800, current: 14.2, voltage: 400.0, energy: 8.4 },
    },
    {
      name: '2. Mechanical Bearing Fault',
      desc: 'Physical degradation: High vibration & elevated friction heating',
      data: { machine_id: 'M04', temperature: 78.5, pressure: 4.8, vibration: 4.85, rpm: 2710, current: 18.2, voltage: 398.0, energy: 11.2 },
    },
    {
      name: '3. Severe Thermal Runaway',
      desc: 'Critical physical anomaly: Extreme cooling failure (>95°C)',
      data: { machine_id: 'M05', temperature: 98.4, pressure: 5.8, vibration: 2.9, rpm: 1250, current: 28.5, voltage: 388.0, energy: 16.8 },
    },
    {
      name: '4. [Simulated] Sensor Freeze Spoofing',
      desc: 'Data tampering: Flatline sensor readings despite 2x electrical current draw',
      data: { machine_id: 'M02', temperature: 62.0, pressure: 8.5, vibration: 1.8, rpm: 1450, current: 48.0, voltage: 400.0, energy: 28.5 },
    },
    {
      name: '5. [Simulated] Energy Metering Tamper',
      desc: 'Physics violation: Heavy power draw with falsified zero-energy report',
      data: { machine_id: 'M07', temperature: 84.0, pressure: 7.2, vibration: 2.2, rpm: 0.0, current: 38.0, voltage: 400.0, energy: 0.05 },
    },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: parseFloat(value) || value }));
  };

  const handleAnalyze = async (saveEvent = false) => {
    setAnalyzing(true);
    setError(null);
    setPersistedNotice(null);
    setMetaMaskReceipt(null);

    try {
      const payload = {
        ...formData,
        save_event: saveEvent,
      };
      const res = await aiService.predict(payload);
      setResult(res.data);

      if (saveEvent && res.data.persisted_event) {
        setPersistedNotice(`Event ${res.data.persisted_event.event_id} permanently saved into database & blockchain.`);
        if (onEventLogged) onEventLogged();
      }
    } catch (err) {
      console.error('Inference error:', err);
      setError(err.response?.data?.message || 'Failed to communicate with AI inference engine.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Direct In-Browser MetaMask Notarization
  const handleNotarizeMetaMask = async () => {
    if (!result) return;
    try {
      setMetaMaskNotarizing(true);
      setError(null);

      if (!isConnected) {
        await connectWallet();
      }

      const eventId = result.persisted_event?.event_id || `EVT-${Date.now().toString().slice(-6)}`;
      const eventToRecord = {
        event_id: eventId,
        machine_id: formData.machine_id,
        risk_level: result.analysis?.risk?.level || 'CRITICAL',
        event_type: result.analysis?.classification?.is_suspicious ? 'SUSPICIOUS_DATA_TAMPER' : 'PHYSICAL_ANOMALY',
        timestamp: new Date().toISOString(),
        data_hash: result.prospective_canonical_hash
      };

      const res = await recordEventWithMetaMask(eventToRecord);
      setMetaMaskReceipt(res);
      setPersistedNotice(`✅ Block successfully committed via MetaMask! Block #${res.blockNumber} (Tx: ${res.txHash.slice(0, 10)}...)`);
      if (onEventLogged) onEventLogged();
    } catch (err) {
      console.error('MetaMask error in AI Lab:', err);
      setError(err.reason || err.message || 'MetaMask transaction canceled.');
    } finally {
      setMetaMaskNotarizing(false);
    }
  };

  const applyPreset = (preset) => {
    setFormData(preset.data);
    setResult(null);
    setPersistedNotice(null);
    setMetaMaskReceipt(null);
  };

  // Format feature impacts for chart
  const featureChartData = result?.analysis?.risk?.feature_impacts
    ? Object.entries(result.analysis.risk.feature_impacts).map(([key, val]) => ({
        feature: key.toUpperCase(),
        impact: Math.round(val * 100),
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
          <Microscope className="w-4 h-4" />
          <span>Interactive AI Laboratory</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Manual Machine Telemetry Analysis</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
          Execute multi-stage inference (Isolation Forest + XGBoost) and generate cryptographic SHA-256 evidence.
        </p>
      </div>

      {/* Preset Scenarios */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/60 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-3">
          <Sliders className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Quick Scenario Presets (Standard & Simulated Tampering)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-industrial-950 p-2.5 text-left transition-all hover:border-cyan-400 dark:hover:border-cyan-500/50 hover:bg-slate-100 dark:hover:bg-industrial-850 group shadow-sm"
            >
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 font-mono">{p.name}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Input Form (Left) & AI Output (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Parameter Inputs */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
              <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Machine Telemetry Inputs
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">8 Feature Attributes</span>
            </div>

            {/* Machine Selector */}
            <div>
              <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1">Target Machine ID</label>
              <select
                value={formData.machine_id}
                onChange={(e) => handleInputChange('machine_id', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-industrial-950 px-3 py-2 text-xs font-mono text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none shadow-sm"
              >
                {[...Array(10)].map((_, i) => {
                  const id = `M${String(i + 1).padStart(2, '0')}`;
                  return (
                    <option key={id} value={id}>
                      Machine {id}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Temperature */}
              <div>
                <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500 dark:text-orange-400" /> Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange('temperature', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-industrial-950 px-3 py-2 text-xs font-mono text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none shadow-sm"
                />
              </div>

              {/* Pressure */}
              <div>
                <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Pressure (bar)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.pressure}
                  onChange={(e) => handleInputChange('pressure', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-industrial-950 px-3 py-2 text-xs font-mono text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none shadow-sm"
                />
              </div>

              {/* Vibration */}
              <div>
                <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Waves className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Vibration (mm/s)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.vibration}
                  onChange={(e) => handleInputChange('vibration', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-industrial-950 px-3 py-2 text-xs font-mono text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none shadow-sm"
                />
              </div>

              {/* Speed / RPM */}
              <div>
                <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Speed (RPM)
                </label>
                <input
                  type="number"
                  step="10"
                  value={formData.rpm}
                  onChange={(e) => handleInputChange('rpm', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-industrial-950 px-3 py-2 text-xs font-mono text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none shadow-sm"
                />
              </div>

              {/* Current */}
              <div>
                <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500 dark:text-yellow-400" /> Current (A)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.current}
                  onChange={(e) => handleInputChange('current', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-industrial-950 px-3 py-2 text-xs font-mono text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none shadow-sm"
                />
              </div>

              {/* Voltage */}
              <div>
                <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-purple-500 dark:text-purple-400" /> Voltage (V)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formData.voltage}
                  onChange={(e) => handleInputChange('voltage', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-industrial-950 px-3 py-2 text-xs font-mono text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none shadow-sm"
                />
              </div>

              {/* Energy Consumption */}
              <div className="col-span-2">
                <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Active Energy (kWh)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.energy}
                  onChange={(e) => handleInputChange('energy', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-industrial-950 px-3 py-2 text-xs font-mono text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none shadow-sm"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handleAnalyze(false)}
                disabled={analyzing}
                className="flex-1 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 py-3 px-4 text-xs font-mono font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>EXECUTING ML INFERENCE...</span>
                  </>
                ) : (
                  <>
                    <span>ANALYZE MACHINE</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleAnalyze(true)}
                disabled={analyzing}
                className="rounded-xl border border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/40 py-3 px-4 text-xs font-mono font-semibold text-indigo-800 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                title="Run inference and automatically log event with blockchain notarization"
              >
                <Blocks className="w-4 h-4" />
                <span>Log & Notarize</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Output: ML Results Breakdown */}
        <div className="lg:col-span-6 space-y-4">
          {error && (
            <div className="p-4 rounded-xl border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs shadow-sm">
              {error}
            </div>
          )}

          {persistedNotice && (
            <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-mono flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{persistedNotice}</span>
              </div>
              {onNavigateBlockchain && (
                <button
                  onClick={onNavigateBlockchain}
                  className="px-2.5 py-1 rounded bg-emerald-700 dark:bg-emerald-900/80 hover:bg-emerald-800 text-[10px] text-white flex items-center gap-1 transition-colors"
                >
                  <span>View Ledger</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {result ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-5 shadow-sm space-y-5">
              {/* Header result row */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Dual-Stage Evaluation Output
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono">Inference Diagnostics</h3>
                </div>
                <RiskBadge level={result.analysis?.risk?.level || 'LOW'} />
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
                {/* 1. Anomaly Status */}
                <div className="rounded-lg bg-slate-50 dark:bg-industrial-950 p-3 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] block mb-1">Anomaly Detected</span>
                  <span
                    className={`font-bold text-sm ${result.analysis?.anomaly?.detected ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                  >
                    {result.analysis?.anomaly?.status || (result.analysis?.anomaly?.detected ? 'YES' : 'NO')}
                  </span>
                </div>

                {/* 2. Anomaly Score */}
                <div className="rounded-lg bg-slate-50 dark:bg-industrial-950 p-3 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] block mb-1">Anomaly Score</span>
                  <span className="font-bold text-sm text-cyan-600 dark:text-cyan-400">
                    {result.analysis?.anomaly?.score?.toFixed(4)}
                  </span>
                </div>

                {/* 3. Classification */}
                <div className="rounded-lg bg-slate-50 dark:bg-industrial-950 p-3 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] block mb-1">XGBoost Category</span>
                  <span
                    className={`font-bold text-xs ${result.analysis?.classification?.is_suspicious ? 'text-orange-600 dark:text-orange-400' : 'text-slate-800 dark:text-slate-200'}`}
                  >
                    {result.analysis?.classification?.is_suspicious ? 'Suspicious' : 'Standard'}
                  </span>
                </div>

                {/* 4. Composite Risk */}
                <div className="rounded-lg bg-slate-50 dark:bg-industrial-950 p-3 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] block mb-1">Risk Score</span>
                  <span className="font-bold text-sm text-amber-600 dark:text-amber-400">
                    {result.analysis?.risk?.composite_score} / 100
                  </span>
                </div>
              </div>

              {/* Diagnostic Explanation */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-industrial-950/80 p-4 space-y-2 text-xs">
                <div className="font-mono font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>Diagnostic Rationale & Root Causes:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1 leading-relaxed">
                  {(result.analysis?.risk?.reasons || []).map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>

                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 text-[11px]">
                  <strong>Recommended Action:</strong> {result.analysis?.risk?.recommended_action}
                </div>
              </div>

              {/* Feature Impact Chart */}
              {featureChartData.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                    Sensor Feature Deviation & Risk Impact (%)
                  </span>
                  <div className="h-44 w-full">
                    <ResponsiveContainer>
                      <BarChart data={featureChartData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                        <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={10} fontFamily="monospace" />
                        <YAxis dataKey="feature" type="category" stroke="#64748b" fontSize={10} fontFamily="monospace" />
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
                        <Bar dataKey="impact" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                          {featureChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.impact > 80 ? '#ef4444' : entry.impact > 50 ? '#f59e0b' : '#06b6d4'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Cryptographic SHA-256 Hash & Block Notarization Actions */}
              <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between text-xs font-mono text-indigo-800 dark:text-indigo-300">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Hash className="w-3.5 h-3.5" />
                    <span>Canonical SHA-256 Evidence Fingerprint</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/80 text-[10px] text-indigo-700 dark:text-cyan-300 border border-indigo-300 dark:border-indigo-500/30">
                    {result.analysis?.risk?.eligible_for_blockchain ? 'BLOCKCHAIN ELIGIBLE (HIGH/CRITICAL)' : 'MYSQL ONLY (LOW RISK)'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-industrial-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-indigo-900 dark:text-indigo-200 break-all select-all shadow-inner">
                  {result.prospective_canonical_hash}
                </div>

                {/* Blockchain Notarization Status / Actions */}
                {result.analysis?.risk?.eligible_for_blockchain && (
                  <div className="pt-2 border-t border-indigo-200 dark:border-indigo-500/20 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-700 dark:text-slate-300 font-mono">
                        {metaMaskReceipt
                          ? `Block Confirmed: #${metaMaskReceipt.blockNumber}`
                          : (result.persisted_event?.block_number
                              ? `Block Number: #${result.persisted_event.block_number}`
                              : 'Ready for on-chain notarization')}
                      </span>

                      {(metaMaskReceipt?.txHash || result.persisted_event?.blockchain_tx) && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${metaMaskReceipt?.txHash || result.persisted_event?.blockchain_tx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-300 hover:text-cyan-900 dark:hover:text-cyan-200 text-[10px] font-mono flex items-center gap-1 hover:underline transition-colors shadow-sm"
                          title="Open on Sepolia Etherscan"
                        >
                          <span>Etherscan</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleNotarizeMetaMask}
                      disabled={metaMaskNotarizing}
                      className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 font-mono ml-auto"
                    >
                      <Wallet className={`w-3.5 h-3.5 ${metaMaskNotarizing ? 'animate-spin' : ''}`} />
                      <span>{metaMaskNotarizing ? 'Mining Block...' : 'Notarize via MetaMask Wallet'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-industrial-900/40 p-8 text-center text-slate-500 dark:text-slate-400 shadow-sm">
              <Microscope className="w-12 h-12 text-slate-400 mb-3" />
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm font-mono">Awaiting Parameter Submission</h4>
              <p className="text-xs max-w-sm mt-1">
                Enter machine readings on the left or select a preset scenario, then click <strong>ANALYZE MACHINE</strong> to trigger the AI pipeline.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
