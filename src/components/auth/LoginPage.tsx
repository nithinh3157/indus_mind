import React, { useState } from 'react';
import { ArrowRight, Car, Droplets, Lock, Mail } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ASSET_IMAGES } from '../../data/simulatedFactoryData';
import { ResilientImage } from '../common/UiPrimitives';

export const LoginPage: React.FC = () => {
  const { login, users } = useApp();
  const [email, setEmail] = useState('arjun.menon@indusmind.io');
  const [password, setPassword] = useState('indusmind-demo-2026');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid operator email address.');
      return;
    }
    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError(null);
    login(email.trim());
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Left: Industrial Architecture & Platform Identity */}
      <div className="lg:col-span-7 relative min-h-[340px] lg:min-h-screen flex flex-col justify-between overflow-hidden bg-slate-950 text-white">
        <ResilientImage
          src={ASSET_IMAGES.loginHero}
          alt="INDUSMIND Automated Multi-Industry Manufacturing Floor"
          className="absolute inset-0 w-full h-full object-cover opacity-75"
          fallbackTitle="INDUSMIND Smart Manufacturing Platform"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-950/35" />

        <div className="relative z-10 p-8 lg:p-12 flex items-center justify-between">
          <div>
            <div className="font-display font-bold text-2xl tracking-tight">INDUSMIND</div>
            <div className="text-xs text-slate-300 mt-0.5">
              Multi-Industry Manufacturing Intelligence
            </div>
          </div>
          <div className="text-xs text-slate-300 font-mono">SIMULATED PROTOTYPE</div>
        </div>

        <div className="relative z-10 p-8 lg:p-12 max-w-2xl space-y-6">
          <h1 className="font-display text-3xl lg:text-4xl font-semibold leading-tight text-balance">
            Unified Production, Bottleneck & Financial Intelligence Across Diverse Plants
          </h1>
          <p className="text-sm text-slate-200 leading-relaxed max-w-xl">
            Monitor automobile chassis assembly and hygienic dairy processing from one unified
            control layer. Switch industries seamlessly without changing sessions.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/70 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-medium mb-1">
                <Car className="w-4 h-4" />
                <span>AutoForge Module</span>
              </div>
              <p className="text-xs text-slate-300">
                7-stage chassis assembly, paint-booth bottleneck tracking, vehicle defect inspection & cost-per-vehicle analytics.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/70 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium mb-1">
                <Droplets className="w-4 h-4" />
                <span>DairyFlow Module</span>
              </div>
              <p className="text-xs text-slate-300">
                7-stage cold-chain & pasteurization monitoring, batch traceability, and expert thermometer photo verification.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Authentication Panel */}
      <div className="lg:col-span-5 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
              Sign in to INDUSMIND
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Access unified plant telemetry, bottleneck diagnostics, and financial intelligence.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Operator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  placeholder="name@indusmind.io"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <span>Enter INDUSMIND Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Quick Role Demonstration Sign-In
            </div>
            <div className="grid grid-cols-1 gap-2">
              {users.slice(0, 3).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => login(u.email, u)}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-left transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                      {u.name} · {u.role}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {u.assignedFactory}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 shrink-0">
                    Sign In
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
