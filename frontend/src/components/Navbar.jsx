import React, { useEffect, useState, useRef } from 'react';
import {
  Shield,
  Cpu,
  Database,
  Blocks,
  User,
  LogOut,
  RefreshCw,
  Layers,
  Wallet,
  CheckCircle2,
  Copy,
  ChevronDown,
  ExternalLink,
  PowerOff,
  AlertCircle,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { useTheme } from '../context/ThemeContext';
import { systemService } from '../services/api';

export default function Navbar({ onRefresh, isRefreshing }) {
  const { user, logout, switchRole } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const {
    account,
    networkName,
    chainId,
    balance,
    isConnected,
    isConnecting,
    isMetaMaskInstalled,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    error: web3Error,
    pendingNotice,
    clearError
  } = useWeb3();

  const [health, setHealth] = useState(null);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  const fetchHealth = async () => {
    try {
      const res = await systemService.getHealth();
      setHealth(res.data);
    } catch (e) {
      console.warn('Health check unreachable:', e);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowWalletMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex flex-col w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-industrial-900/95 backdrop-blur-md transition-colors duration-200">
      {/* Top Notification Banner if Pending Notice or Error */}
      {(pendingNotice || web3Error) && (
        <div className={`px-6 py-2 text-xs font-mono flex items-center justify-between transition-all ${
          pendingNotice ? 'bg-amber-100 dark:bg-amber-950/90 text-amber-900 dark:text-amber-200 border-b border-amber-300 dark:border-amber-500/40' : 'bg-red-100 dark:bg-red-950/90 text-red-900 dark:text-red-200 border-b border-red-300 dark:border-red-500/40'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>{pendingNotice || web3Error}</span>
          </div>
          <button onClick={clearError} className="hover:opacity-80 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Navbar Header */}
      <div className="flex min-h-[4.25rem] h-auto w-full items-center justify-between px-4 sm:px-6 py-2.5 gap-4">
        {/* Project Title & Badge */}
        <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 shadow-glow-cyan shadow-sm">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                Anomaly & Fraud Detection Framework
              </h1>
              <span className="inline-flex items-center rounded-md bg-cyan-100 dark:bg-cyan-950/90 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/40 whitespace-nowrap shadow-sm">
                SMART MANUFACTURING
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tracking-tight whitespace-nowrap mt-0.5">
              Cryptographic Integrity & Dual-Stage AI Monitoring System
            </p>
          </div>
        </div>

        {/* System Status Indicators & User Controls */}
        <div className="flex items-center gap-2.5 md:gap-3 flex-shrink-0">
          {/* System Health Indicators */}
          <div className="hidden xl:flex items-center gap-4 border-r border-slate-200 dark:border-slate-800 pr-4 text-xs font-mono">
            {/* DB Status */}
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap" title={`Database: ${health?.database?.engine || 'Connecting...'}`}>
              <Database className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
              <span>DB: <strong className="text-emerald-600 dark:text-emerald-400 font-medium">ONLINE</strong></span>
            </div>

            {/* ML Status */}
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap" title="Isolation Forest + XGBoost">
              <Cpu className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
              <span>ML: <strong className="text-cyan-600 dark:text-cyan-400 font-medium">READY</strong></span>
            </div>

            {/* Blockchain Status */}
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap" title={`Network: ${isConnected ? networkName : (health?.blockchain?.network || 'EVM')}`}>
              <Blocks className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-500 dark:text-emerald-400' : 'text-indigo-500 dark:text-indigo-400'} flex-shrink-0`} />
              <span>
                CHAIN: <strong className={`${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'} font-medium`}>
                  {isConnected ? 'METAMASK LIVE' : 'EVM SYNC'}
                </strong>
              </span>
            </div>
          </div>

          {/* Theme Toggle Button (Light/Dark Mode) */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-amber-500 dark:hover:text-cyan-400 transition-all shadow-sm group"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* MetaMask Wallet Connection Widget */}
          <div className="relative" ref={menuRef}>
            {isConnected ? (
              <button
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                className="flex items-center gap-2 rounded-lg border border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 text-xs font-mono text-indigo-900 dark:text-indigo-200 hover:border-indigo-400 transition-all shadow-sm"
                title="MetaMask Wallet Connected"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden sm:inline font-semibold">{balance} ETH</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-200/80 dark:bg-indigo-900/80 text-indigo-900 dark:text-cyan-300 text-[11px] font-semibold">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              </button>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center gap-2 rounded-lg border border-amber-400 dark:border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 px-3 py-1.5 text-xs font-mono font-bold text-amber-800 dark:text-amber-300 hover:border-amber-500 transition-all shadow-sm"
                title={isMetaMaskInstalled ? 'Click to connect MetaMask wallet and accept request' : 'MetaMask not detected'}
              >
                <Wallet className={`w-3.5 h-3.5 text-amber-600 dark:text-amber-400 ${isConnecting ? 'animate-spin' : ''}`} />
                <span>{isConnecting ? 'Waiting...' : 'Connect Wallet'}</span>
              </button>
            )}

            {/* MetaMask Dropdown Menu */}
            {showWalletMenu && isConnected && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 dark:border-indigo-500/40 bg-white dark:bg-industrial-900 p-4 shadow-2xl z-50 text-xs font-mono space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400">MetaMask Account</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] border border-emerald-300 dark:border-emerald-500/30">
                    Connected
                  </span>
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Wallet Address</span>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-100 dark:bg-industrial-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                    <span className="truncate mr-2 text-[11px]">{account}</span>
                    <button
                      onClick={handleCopyAddress}
                      className="text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"
                      title="Copy full address"
                    >
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Balance & Network */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-slate-100 dark:bg-industrial-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Balance</span>
                    <span className="text-slate-900 dark:text-white font-bold text-xs">{balance} ETH</span>
                  </div>
                  <div className="p-2 rounded bg-slate-100 dark:bg-industrial-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Network</span>
                    <span className="text-cyan-700 dark:text-cyan-300 font-semibold text-[11px] truncate block" title={networkName}>
                      {networkName}
                    </span>
                  </div>
                </div>

                {/* Network Switcher Helpers */}
                <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Quick Network Switch:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => switchNetwork('0x539')}
                      className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] text-center border border-slate-300 dark:border-slate-700"
                    >
                      Ganache (8545)
                    </button>
                    <button
                      onClick={() => switchNetwork('0xaa36a7')}
                      className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] text-center border border-slate-300 dark:border-slate-700"
                    >
                      Sepolia Testnet
                    </button>
                  </div>
                </div>

                {/* Disconnect */}
                <button
                  onClick={() => {
                    disconnectWallet();
                    setShowWalletMenu(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 text-xs transition-colors"
                >
                  <PowerOff className="w-3.5 h-3.5" />
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
              title="Refresh Telemetry and Event Stream"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          )}

          {/* User Role Switcher & Profile */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-industrial-950 px-2.5 py-1 text-xs shadow-sm">
              <User className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span className="text-slate-700 dark:text-slate-300 font-mono hidden sm:inline">{user?.role || 'Admin'}</span>
              <button
                onClick={() => switchRole(user?.role === 'Admin' ? 'Operator' : 'Admin')}
                className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline font-mono border-l border-slate-300 dark:border-slate-800 pl-2 ml-1"
                title="Click to toggle between Admin and Operator role"
              >
                Switch Role
              </button>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-industrial-950 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-500/30 transition-colors shadow-sm"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
