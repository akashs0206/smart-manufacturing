import React, { useEffect, useState } from 'react';
import { Radio, Search, Filter, RefreshCw } from 'lucide-react';
import MachineCard from '../components/MachineCard';
import { machineService, sensorService } from '../services/api';

export default function Machines({ onSelectMachine }) {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isFleetStreaming, setIsFleetStreaming] = useState(true);
  const [isTicking, setIsTicking] = useState(false);

  const fetchMachines = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await machineService.getAll();
      setMachines(res.data.data || []);
    } catch (err) {
      console.error('Error fetching machines:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const triggerFleetTick = async () => {
    try {
      setIsTicking(true);
      await sensorService.simulateFleetTick();
      await fetchMachines(false);
    } catch (err) {
      console.warn('Fleet simulation tick notice:', err);
    } finally {
      setIsTicking(false);
    }
  };

  useEffect(() => {
    fetchMachines(true);
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

  const filteredMachines = machines.filter((m) => {
    const matchSearch =
      m.machine_id.toLowerCase().includes(search.toLowerCase()) ||
      m.machine_name.toLowerCase().includes(search.toLowerCase()) ||
      m.machine_type.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === 'ALL' ? true : m.status.toUpperCase() === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Machine Monitoring Fleet
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Active industrial equipment telemetry stream and localized condition states
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-industrial-900 py-1.5 pl-9 pr-4 text-xs text-slate-800 dark:text-white font-mono placeholder-slate-400 focus:border-cyan-500 focus:outline-none shadow-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-industrial-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
            {['ALL', 'NORMAL', 'ANOMALY', 'CRITICAL'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === st
                    ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-semibold border border-cyan-300 dark:border-cyan-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Live Simulator Toggle */}
          <button
            onClick={() => setIsFleetStreaming(!isFleetStreaming)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs transition-all ${
              isFleetStreaming
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/50 shadow-sm font-semibold'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Toggle continuous 3-second live factory floor sensor simulation"
          >
            <span className="relative flex h-2 w-2">
              {isFleetStreaming && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isFleetStreaming ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'}`}></span>
            </span>
            <span>{isFleetStreaming ? 'LIVE SIMULATOR (3s)' : 'SIMULATOR PAUSED'}</span>
          </button>

          {/* Pulse Fleet Button */}
          <button
            onClick={triggerFleetTick}
            disabled={isTicking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-mono transition-colors shadow-sm"
            title="Pulse new sensor readings across all machines"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTicking ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
            <span>Pulse Fleet</span>
          </button>

          <button
            onClick={() => fetchMachines(true)}
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-industrial-900 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors shadow-sm"
            title="Refresh Fleet"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Machine Cards Grid */}
      {loading && machines.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-industrial-900/40 animate-pulse" />
          ))}
        </div>
      ) : filteredMachines.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/60 text-slate-500 dark:text-slate-400 font-mono text-sm shadow-sm">
          No machines found matching "{search}"
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMachines.map((m) => (
            <MachineCard
              key={m.machine_id}
              machine={m}
              onSelect={onSelectMachine}
            />
          ))}
        </div>
      )}
    </div>
  );
}
