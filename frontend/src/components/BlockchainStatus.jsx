import React from 'react';
import { Link2, Clock, CheckCircle2, MinusCircle, ShieldCheck, ExternalLink } from 'lucide-react';

export default function BlockchainStatus({ status = 'PENDING', txHash = null, blockNumber = null }) {
  const normStatus = (status || 'PENDING').toUpperCase();

  if (normStatus === 'RECORDED' || normStatus === 'VERIFIED') {
    const isEthTx = txHash && txHash.startsWith('0x') && txHash.length >= 40;
    const etherscanUrl = isEthTx ? `https://sepolia.etherscan.io/tx/${txHash}` : null;

    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-500/40 text-indigo-800 dark:text-indigo-300 text-xs font-mono shadow-sm">
        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span className="font-semibold text-indigo-800 dark:text-indigo-300">RECORDED</span>
        {etherscanUrl ? (
          <a
            href={etherscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-0.5 text-cyan-700 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 underline underline-offset-2 ml-1 text-[11px] font-semibold"
            title={`View on Sepolia Etherscan: ${txHash}`}
          >
            <span>{txHash.slice(0, 6)}...{txHash.slice(-4)}</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        ) : txHash ? (
          <span className="text-indigo-600 dark:text-indigo-400/80 text-[11px] ml-1" title={txHash}>
            {txHash.slice(0, 6)}...{txHash.slice(-4)}
          </span>
        ) : null}
      </div>
    );
  }

  if (normStatus === 'PENDING') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-mono shadow-sm">
        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        <span>PENDING</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-mono">
      <MinusCircle className="w-3 h-3 text-slate-400 dark:text-slate-500" />
      <span>NOT ELIGIBLE</span>
    </div>
  );
}
