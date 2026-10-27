import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  Flame,
  Gauge,
  Waves,
  Activity,
  Zap,
  Cpu,
  ShieldAlert,
  Microscope,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  Play,
  Pause,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import SensorChart from '../components/SensorChart';
import EventTable from '../components/EventTable';
import { machineService, eventService, sensorService } from '../services/api';

export default function MachineDetails({ machineId, onBack, onSelectEvent, onAnalyzeTelemetry }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [isTicking, setIsTicking] = useState(false);
  const streamIntervalRef = useRef(null);

  const fetchDetails = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await machineService.getById(machineId);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching machine details:', err);
      setError(`Failed to retrieve machine details for ${machineId}`);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Live real-time telemetry pulse
  const triggerLiveTick = async () => {
    try {
      setIsTicking(true);
      const res = await sensorService.simulateTick(machineId);
      const newTelemetry = res.data.telemetry;
      const analysis = res.data.analysis;

      setData((prev) => {
        if (!prev) return prev;
        const updatedHistory = [...(prev.telemetry_history || []), newTelemetry].slice(-60); // keep last 60 points
        return {
          ...prev,
          latest_reading: newTelemetry,
          telemetry_history: updatedHistory,
          machine: {
            ...prev.machine,
            status: analysis?.risk?.level || prev.machine.status
          }
        };
      });
    } catch (err) {
      console.warn('Live telemetry tick warning:', err);
    } finally {
      setIsTicking(false);
    }
  };

  const handleRecordBlockchain = async (eventId) => {
    try {
      await eventService.recordToBlockchain(eventId);
      fetchDetails(false);
    } catch (err) {
      alert('Blockchain recording error: ' + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    if (machineId) {
      fetchDetails(true);
    }
  }, [machineId]);

  // Live Streaming Timer
  useEffect(() => {
    if (isLiveStreaming && machineId) {
      streamIntervalRef.current = setInterval(triggerLiveTick, 3000);
    }
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, [isLiveStreaming, machineId]);

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center font-mono text-cyan-400">
        Loading real-time telemetry stream for machine {machineId}...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-400 border border-red-500/40 rounded-xl bg-red-950/60 font-mono">
        <p>{error || 'Machine not found'}</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-xs">
          Return to Fleet
        </button>
      </div>
    );
  }

  const { machine, latest_reading, telemetry_history, events } = data;
  const tel = latest_reading || {};

  return (
    <div className="space-y-6">
      {/* Top Bar with Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-industrial-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-400 font-mono font-bold text-xs shadow-sm">
                {machine.machine_id}
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{machine.machine_name}</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Type: <strong className="text-slate-700 dark:text-slate-300">{machine.machine_type}</strong> • Real-Time Sensor Stream Active
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live Streaming Toggle */}
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs transition-all ${
              isLiveStreaming
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/50 shadow-sm font-semibold'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Toggle continuous 3-second live sensor telemetry streaming"
          >
            <span className="relative flex h-2 w-2">
              {isLiveStreaming && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveStreaming ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'}`}></span>
            </span>
            <span>{isLiveStreaming ? 'LIVE STREAMING (3s)' : 'STREAM PAUSED'}</span>
          </button>

          {/* Trigger Single Live Pulse */}
          <button
            onClick={triggerLiveTick}
            disabled={isTicking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-mono transition-colors shadow-sm"
            title="Send an instant live sensor pulse from the factory floor"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTicking ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
            <span>Pulse Reading</span>
          </button>

          <RiskBadge level={machine.status} size="lg" />

          {onAnalyzeTelemetry && (
            <button
              onClick={() => onAnalyzeTelemetry(tel, machine.machine_id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-100 dark:bg-cyan-600/30 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 hover:bg-cyan-200 dark:hover:bg-cyan-600 hover:text-cyan-900 dark:hover:text-white text-xs font-mono font-semibold transition-colors shadow-sm"
            >
              <Microscope className="w-4 h-4" />
              <span>Analyze in AI Lab</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-time Telemetry Snapshot Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Temp */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-4 transition-all hover:border-amber-400 dark:hover:border-amber-500/40 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1 font-mono">
            <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Temp
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {tel.temperature !== undefined ? `${tel.temperature}°C` : '--'}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Limit: 75°C</span>
        </div>

        {/* Pressure */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-4 transition-all hover:border-cyan-400 dark:hover:border-cyan-500/40 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1 font-mono">
            <Gauge className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Pressure
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {tel.pressure !== undefined ? `${tel.pressure} bar` : '--'}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Nominal: 4.5 bar</span>
        </div>

        {/* Vibration */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-4 transition-all hover:border-orange-400 dark:hover:border-orange-500/40 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1 font-mono">
            <Waves className="w-4 h-4 text-orange-500 dark:text-orange-400" /> Vibration
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {tel.vibration !== undefined ? `${tel.vibration}` : '--'}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">RMS mm/s</span>
        </div>

        {/* RPM */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-4 transition-all hover:border-emerald-400 dark:hover:border-emerald-500/40 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1 font-mono">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> RPM
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {tel.rpm !== undefined ? `${tel.rpm}` : '--'}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Speed</span>
        </div>

        {/* Current */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-4 transition-all hover:border-yellow-400 dark:hover:border-yellow-500/40 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1 font-mono">
            <Zap className="w-4 h-4 text-amber-500 dark:text-yellow-400" /> Current
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {tel.current !== undefined ? `${tel.current} A` : '--'}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">3-Phase Amps</span>
        </div>

        {/* Voltage */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-4 transition-all hover:border-purple-400 dark:hover:border-purple-500/40 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1 font-mono">
            <Zap className="w-4 h-4 text-purple-500 dark:text-purple-400" /> Voltage
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {tel.voltage !== undefined ? `${tel.voltage} V` : '--'}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Line Volts</span>
        </div>

        {/* Energy */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-4 transition-all hover:border-indigo-400 dark:hover:border-indigo-500/40 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1 font-mono">
            <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Energy
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {tel.energy !== undefined ? `${tel.energy} kWh` : '--'}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Active Power</span>
        </div>
      </div>

      {/* Real-time Ticking Telemetry Chart */}
      <SensorChart
        data={telemetry_history || []}
        title={`Live Continuous Sensor Telemetry: ${machine.machine_name} (${machine.machine_id})`}
        height={320}
      />

      {/* Logged Events for this machine */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Machine Security & Anomaly Log</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Events recorded for {machine.machine_id}</p>
          </div>
        </div>
        <EventTable
          events={events || []}
          onSelectEvent={onSelectEvent}
          onRecordBlockchain={handleRecordBlockchain}
          showMachine={false}
        />
      </div>
    </div>
  );
}
