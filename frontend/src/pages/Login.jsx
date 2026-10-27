import React, { useState } from 'react';
import { Layers, ShieldCheck, Lock, Mail, ArrowRight, ShieldAlert, Cpu, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onLoginSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@smart-manufacturing.io');
  const [password, setPassword] = useState('cybersecurity2026');
  const [role, setRole] = useState('Admin');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide valid credentials');
      return;
    }
    login(email, password, role);
    if (onLoginSuccess) onLoginSuccess();
  };

  const handleQuickFill = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'Admin') {
      setEmail('admin@smart-manufacturing.io');
      setPassword('adminPass@2026');
    } else {
      setEmail('operator@smart-manufacturing.io');
      setPassword('operatorPass@2026');
    }
  };

  return (
    <div className="min-h-screen bg-grid-pattern flex items-center justify-center p-6 relative">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-blue-600 shadow-md hover:shadow-lg mb-4">
            <Layers className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
            SMART MANUFACTURING
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            AI & Blockchain-Based Anomaly and Fraud Detection Framework
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-industrial-900/90 p-8 backdrop-blur-xl shadow-xl dark:shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-400 text-xs flex items-center gap-2 shadow-sm">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Authentication Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-industrial-950/80 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-white font-mono placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-sm"
                  placeholder="operator@smart-manufacturing.io"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Access Token / Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-industrial-950/80 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-white font-mono placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-sm"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Target Role & Permission Tier
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickFill('Admin')}
                  className={`p-3 rounded-xl border text-left transition-all shadow-sm ${
                    role === 'Admin'
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-industrial-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold font-mono">Admin</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Full Blockchain & AI Control</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('Operator')}
                  className={`p-3 rounded-xl border text-left transition-all shadow-sm ${
                    role === 'Operator'
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-industrial-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold font-mono">Operator</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Telemetry & AI Diagnostics</div>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 font-mono"
            >
              <span>ACCESS WORKSPACE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Academic Prototype Notice */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Academic & Research Framework • Final-Year Implementation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
