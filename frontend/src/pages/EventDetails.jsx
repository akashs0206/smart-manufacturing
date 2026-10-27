import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Hash,
  Blocks,
  Clock,
  Cpu,
  Flame,
  Gauge,
  Waves,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Wallet,
  Send,
  ExternalLink
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import BlockchainStatus from '../components/BlockchainStatus';
import { eventService, blockchainService } from '../services/api';
import { useWeb3 } from '../context/Web3Context';

export default function EventDetails({ eventId, onBack, onSelectMachine }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [notarizingMetaMask, setNotarizingMetaMask] = useState(false);
  const [notarizingServer, setNotarizingServer] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [txNotice, setTxNotice] = useState(null);

  const {
    account,
    isConnected,
    isMetaMaskInstalled,
    connectWallet,
    recordEventWithMetaMask
  } = useWeb3();

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await eventService.getById(eventId);
      setData(res.data);
      if (res.data.blockchain_verification) {
        setVerificationResult(res.data.blockchain_verification);
      }
    } catch (err) {
      console.error('Error fetching event:', err);
      setError(`Failed to retrieve event record for ${eventId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOnChain = async () => {
    try {
      setVerifying(true);
      const res = await blockchainService.verifyEvidence(eventId);
      setVerificationResult(res.data.verification);
    } catch (err) {
      alert('Verification error: ' + (err.response?.data?.message || err.message));
    } finally {
      setVerifying(false);
    }
  };

  const handleRecordMetaMask = async () => {
    if (!data?.event) return;
    try {
      setNotarizingMetaMask(true);
      setTxNotice(null);
      
      const res = await recordEventWithMetaMask(data.event);
      setTxNotice(`Successfully committed to Ethereum blockchain via MetaMask! Tx: ${res.txHash.slice(0, 10)}... (Block #${res.blockNumber})`);
      await fetchDetails();
    } catch (err) {
      console.error('MetaMask notarization error:', err);
      alert('MetaMask Error: ' + (err.reason || err.message || 'Transaction rejected'));
    } finally {
      setNotarizingMetaMask(false);
    }
  };

  const handleRecordServerBlockchain = async () => {
    try {
      setNotarizingServer(true);
      setTxNotice(null);
      await eventService.recordToBlockchain(eventId);
      setTxNotice('Notarized successfully via Server Web3 provider.');
      await fetchDetails();
    } catch (err) {
      alert('Error recording to blockchain: ' + (err.response?.data?.message || err.message));
    } finally {
      setNotarizingServer(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchDetails();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center font-mono text-cyan-400">
        Loading cryptographic event audit record {eventId}...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-400 border border-red-500/40 rounded-xl bg-red-950/60 font-mono">
        <p>{error || 'Event not found'}</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-xs">
          Return to Events
        </button>
      </div>
    );
  }

  const { event, telemetry_context } = data;
  const tel = telemetry_context || {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-industrial-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{event.event_id}</span>
              <button
                onClick={() => onSelectMachine && onSelectMachine(event.machine_id)}
                className="px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-400 font-mono font-bold text-xs hover:bg-cyan-200 dark:hover:bg-cyan-900 shadow-sm"
              >
                {event.machine_id}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Logged: {event.timestamp} • Type: <strong className="text-slate-700 dark:text-slate-300">{event.event_type}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RiskBadge level={event.risk_level} size="lg" />
          <BlockchainStatus
            status={event.blockchain_status}
            txHash={event.blockchain_tx}
            blockNumber={event.block_number}
          />
        </div>
      </div>

      {/* Transaction Notice */}
      {txNotice && (
        <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-mono flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{txNotice}</span>
          </div>
          <button onClick={() => setTxNotice(null)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-white">✕</button>
        </div>
      )}

      {/* Main Grid: Forensic Overview & Cryptographic Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Event Metadata & AI Diagnostics */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: AI Diagnostics */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-mono flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              AI Evaluation & Anomaly Classification
            </h3>

            <div className="grid grid-cols-3 gap-3 font-mono text-xs">
              <div className="rounded-lg bg-slate-50 dark:bg-industrial-950 p-3 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block mb-1">Anomaly Score</span>
                <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{event.anomaly_score?.toFixed(4)}</span>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-industrial-950 p-3 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block mb-1">XGBoost Class</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{event.classification}</span>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-industrial-950 p-3 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block mb-1">Risk Severity</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{event.risk_level}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-industrial-950/80 p-4 space-y-1.5 text-xs">
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">Diagnostic Description:</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{event.description || 'No description recorded.'}</p>
            </div>
          </div>

          {/* Card: Sensor Snapshot at Event Time */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-industrial-900/90 p-5 space-y-3 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Telemetry Context (At Event Occurrence)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs font-mono">
              <div className="rounded-lg bg-slate-50 dark:bg-industrial-950 p-2.5 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1 mb-1">
                  <Flame className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Temp
                </span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">{tel.temperature !== undefined ? `${tel.temperature}°C` : '--'}</span>
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-industrial-950 p-2.5 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1 mb-1">
                  <Gauge className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Pressure
                </span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">{tel.pressure !== undefined ? `${tel.pressure} bar` : '--'}</span>
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-industrial-950 p-2.5 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1 mb-1">
                  <Waves className="w-3 h-3 text-orange-500 dark:text-orange-400" /> Vibration
                </span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">{tel.vibration !== undefined ? `${tel.vibration} mm/s` : '--'}</span>
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-industrial-950 p-2.5 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1 mb-1">
                  <Activity className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> RPM
                </span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">{tel.rpm !== undefined ? `${tel.rpm}` : '--'}</span>
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-industrial-950 p-2.5 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1 mb-1">
                  <Zap className="w-3 h-3 text-amber-500 dark:text-yellow-400" /> Current
                </span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">{tel.current !== undefined ? `${tel.current} A` : '--'}</span>
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-industrial-950 p-2.5 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1 mb-1">
                  <Zap className="w-3 h-3 text-purple-500 dark:text-purple-400" /> Voltage
                </span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">{tel.voltage !== undefined ? `${tel.voltage} V` : '--'}</span>
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-industrial-950 p-2.5 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1 mb-1">
                  <Cpu className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Energy
                </span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">{tel.energy !== undefined ? `${tel.energy} kWh` : '--'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Blockchain Evidence & Verification */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/40 bg-white dark:bg-industrial-900/90 p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-mono flex items-center gap-2">
              <Blocks className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Cryptographic Blockchain Evidence
            </h3>

            {/* SHA-256 Hash Card */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                SHA-256 Canonical Data Hash:
              </span>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-industrial-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-indigo-800 dark:text-indigo-300 break-all select-all shadow-inner">
                {event.data_hash || 'Hash not generated'}
              </div>
            </div>

            {/* Transaction Hash */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Blocks className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Smart Contract Transaction Hash:
              </span>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-industrial-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-300 break-all select-all shadow-inner">
                {event.blockchain_tx && event.blockchain_tx.startsWith('0x') && event.blockchain_tx.length >= 40 ? (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${event.blockchain_tx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:underline flex items-center gap-1.5"
                    title="Open on Sepolia Etherscan"
                  >
                    <span>{event.blockchain_tx}</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                ) : (
                  <span>{event.blockchain_tx || 'Not committed to blockchain'}</span>
                )}
              </div>
            </div>

            {/* Block Info */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-industrial-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Block Height</span>
                {event.block_number ? (
                  <a
                    href={`https://sepolia.etherscan.io/block/${event.block_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>#{event.block_number}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-700 dark:text-slate-200 font-semibold">N/A</span>
                )}
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-industrial-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Ledger Status</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{event.blockchain_status}</span>
              </div>
            </div>

            {/* Live On-Chain Verification / Notarization Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              {event.blockchain_status === 'RECORDED' ? (
                <button
                  type="button"
                  onClick={handleVerifyOnChain}
                  disabled={verifying}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-mono font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
                  <span>{verifying ? 'VERIFYING ON-CHAIN HASH...' : 'VERIFY ON-CHAIN INTEGRITY'}</span>
                </button>
              ) : (
                <div className="space-y-2">
                  {/* Option 1: MetaMask In-Browser Notarization */}
                  <button
                    type="button"
                    onClick={isConnected ? handleRecordMetaMask : connectWallet}
                    disabled={notarizingMetaMask}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 py-2.5 text-xs font-mono font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Wallet className={`w-4 h-4 ${notarizingMetaMask ? 'animate-spin' : ''}`} />
                    <span>
                      {notarizingMetaMask
                        ? 'SIGNING WITH METAMASK...'
                        : isConnected
                        ? 'NOTARIZE VIA METAMASK WALLET'
                        : 'CONNECT METAMASK & NOTARIZE'}
                    </span>
                  </button>

                  {/* Option 2: Server-Side Web3 Fallback */}
                  <button
                    type="button"
                    onClick={handleRecordServerBlockchain}
                    disabled={notarizingServer}
                    className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-2 text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Blocks className={`w-3.5 h-3.5 ${notarizingServer ? 'animate-spin' : ''}`} />
                    <span>{notarizingServer ? 'NOTARIZING ON SERVER...' : 'NOTARIZE VIA SERVER WEB3'}</span>
                  </button>
                </div>
              )}

              {/* Verification Result Pill */}
              {verificationResult && (
                <div
                  className={`p-3.5 rounded-xl border font-mono text-xs space-y-1.5 shadow-sm ${
                    verificationResult.verified
                      ? 'border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {verificationResult.verified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    )}
                    <span>{verificationResult.status}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                    {verificationResult.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
