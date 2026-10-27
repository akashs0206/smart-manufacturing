import React, { useEffect, useState } from 'react';
import { AlertOctagon, Search, Filter, RefreshCw, ShieldCheck } from 'lucide-react';
import EventTable from '../components/EventTable';
import RiskBadge from '../components/RiskBadge';
import { eventService } from '../services/api';
import { useWeb3 } from '../context/Web3Context';

export default function Events({ onSelectEvent }) {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [machineFilter, setMachineFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [blockchainFilter, setBlockchainFilter] = useState('ALL');
  const { isConnected, recordEventWithMetaMask } = useWeb3();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        search,
        machine_id: machineFilter,
        risk_level: riskFilter,
        blockchain_status: blockchainFilter,
        limit: 100,
      };
      const res = await eventService.getAll(params);
      setEvents(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordBlockchain = async (eventId) => {
    try {
      if (isConnected) {
        const evt = events.find((e) => e.event_id === eventId);
        if (evt) {
          await recordEventWithMetaMask(evt);
          await fetchEvents();
          return;
        }
      }
      await eventService.recordToBlockchain(eventId);
      fetchEvents();
    } catch (err) {
      alert('Error recording to blockchain: ' + (err.reason || err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [machineFilter, riskFilter, blockchainFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            Security & Anomaly Event Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Full audit log of detected operational anomalies, simulated data manipulation scenarios, and blockchain proofs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Total Records: <strong className="text-cyan-600 dark:text-cyan-400">{total}</strong>
          </span>
          <button
            onClick={fetchEvents}
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-industrial-900 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors shadow-sm"
            title="Refresh Event Log"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Multi-Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/80 shadow-sm">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search event ID, type, or diagnostic description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-industrial-950 py-2 pl-9 pr-4 text-xs text-slate-800 dark:text-white font-mono placeholder-slate-400 focus:border-cyan-500 focus:outline-none shadow-sm"
            />
          </div>
        </form>

        {/* Machine Filter */}
        <select
          value={machineFilter}
          onChange={(e) => setMachineFilter(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-industrial-950 px-3 py-2 text-xs font-mono text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none shadow-sm"
        >
          <option value="">All Machines</option>
          {['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10'].map((m) => (
            <option key={m} value={m}>
              Machine {m}
            </option>
          ))}
        </select>

        {/* Risk Level Filter */}
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-industrial-950 px-3 py-2 text-xs font-mono text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none shadow-sm"
        >
          <option value="ALL">All Risk Levels</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {/* Blockchain Status Filter */}
        <select
          value={blockchainFilter}
          onChange={(e) => setBlockchainFilter(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-industrial-950 px-3 py-2 text-xs font-mono text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none shadow-sm"
        >
          <option value="ALL">All Blockchain States</option>
          <option value="RECORDED">Recorded On-Chain</option>
          <option value="PENDING">Pending Notarization</option>
          <option value="NOT_ELIGIBLE">Not Eligible (Low Risk)</option>
        </select>
      </div>

      {/* Events Table */}
      <EventTable
        events={events}
        onSelectEvent={onSelectEvent}
        onRecordBlockchain={handleRecordBlockchain}
        showMachine={true}
      />
    </div>
  );
}
