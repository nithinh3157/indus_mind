import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  Bot,
  Boxes,
  Car,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  Droplets,
  FileSpreadsheet,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Pause,
  Play,
  Settings,
  ShieldCheck,
  Sliders,
  Sun,
  TrendingUp,
  Users,
  Volume2,
  VolumeX,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { IndustryScope } from '../../types/indusmind';

export const NAV_ITEMS = [
  { path: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
  { path: '/autoforge', label: 'AutoForge', icon: Car },
  { path: '/dairyflow', label: 'DairyFlow', icon: Droplets },
  { path: '/cross-industry', label: 'Cross-Industry Intelligence', icon: BarChart3 },
  { path: '/production', label: 'Production Monitoring', icon: Activity },
  { path: '/machines', label: 'Machine Monitoring', icon: Cpu },
  { path: '/bottlenecks', label: 'Bottleneck Analysis', icon: GitBranch },
  { path: '/predictive', label: 'Predictive Maintenance', icon: TrendingUp },
  { path: '/quality', label: 'Quality Management', icon: ShieldCheck },
  { path: '/inventory', label: 'Inventory Management', icon: Boxes },
  { path: '/finance', label: 'Financial Intelligence', icon: Wallet },
  { path: '/energy', label: 'Energy and Sustainability', icon: Zap },
  { path: '/assistant', label: 'AI Factory Assistant', icon: Bot },
  { path: '/alerts', label: 'Alerts and Notifications', icon: AlertTriangle },
  { path: '/reports', label: 'Reports', icon: FileSpreadsheet },
  { path: '/users', label: 'User Management', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const INDUSTRY_OPTIONS: { id: IndustryScope; label: string; route?: string }[] = [
  { id: 'overview', label: 'INDUSMIND Overview' },
  { id: 'autoforge', label: 'AutoForge' },
  { id: 'dairyflow', label: 'DairyFlow' },
  { id: 'cross-industry', label: 'Cross-Industry' },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentUser,
    logout,
    industryScope,
    setIndustryScope,
    darkMode,
    toggleDarkMode,
    liveSimulationActive,
    toggleLiveSimulation,
    sirenEnabled,
    toggleSiren,
    sirenPlaying,
    silenceSiren,
    latestLiveAlert,
    lastVoiceAlertText,
    dismissLiveAlert,
    resolvedNotice,
    lastResolvedVoiceText,
    dismissResolvedNotice,
    lastTelemetryTick,
    triggerSimulatedDelaySpike,
    updateAlertStatus,
    alerts,
    stages,
    tempVerifications,
  } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const activeAlertsCount = alerts.filter((a) => a.status === 'Active').length;
  const pendingVerifCount = tempVerifications.filter((v) => !v.humanConfirmed).length;

  const currentNav =
    NAV_ITEMS.find((n) => n.path === location.pathname) ||
    (location.pathname.includes('temperature-verification')
      ? { label: 'Expert Temperature Verification' }
      : { label: 'INDUSMIND Workspace' });

  // Industry-specific theme tokens (accent & sidebar surface)
  const themeAccent =
    industryScope === 'autoforge'
      ? {
          activeBg: 'bg-[#0A1628] text-white dark:bg-blue-600 dark:text-white',
          accentText: 'text-blue-600 dark:text-blue-400',
          sidebarTint: 'bg-slate-950 text-slate-200 border-slate-800',
          sidebarMuted: 'text-slate-400 hover:text-white hover:bg-slate-900',
          sidebarActive: 'bg-blue-600 text-white',
          topBorder: 'border-blue-500/30',
          modeTag: 'AutoForge · Navy & Electric Blue',
        }
      : industryScope === 'dairyflow'
      ? {
          activeBg: 'bg-emerald-700 text-white dark:bg-emerald-600 dark:text-white',
          accentText: 'text-emerald-700 dark:text-emerald-400',
          sidebarTint:
            'bg-[#FAFBF7] dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-emerald-200/80 dark:border-slate-800',
          sidebarMuted:
            'text-slate-600 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-white hover:bg-emerald-50 dark:hover:bg-slate-800',
          sidebarActive: 'bg-emerald-700 text-white dark:bg-emerald-600',
          topBorder: 'border-emerald-200 dark:border-slate-800',
          modeTag: 'DairyFlow · Hygienic Green & Cream',
        }
      : {
          activeBg: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
          accentText: 'text-slate-900 dark:text-slate-100',
          sidebarTint:
            'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800',
          sidebarMuted:
            'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800',
          sidebarActive: 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white',
          topBorder: 'border-slate-200 dark:border-slate-800',
          modeTag: 'Unified Cross-Industry Analytics',
        };

  const handleIndustrySwitch = (scope: IndustryScope) => {
    setIndustryScope(scope);
    if (scope === 'autoforge' && (location.pathname === '/' || location.pathname === '/dairyflow' || location.pathname === '/cross-industry')) {
      navigate('/autoforge');
    } else if (scope === 'dairyflow' && (location.pathname === '/' || location.pathname === '/autoforge' || location.pathname === '/cross-industry')) {
      navigate('/dairyflow');
    } else if (scope === 'cross-industry' && (location.pathname === '/' || location.pathname === '/autoforge' || location.pathname === '/dairyflow')) {
      navigate('/cross-industry');
    } else if (scope === 'overview' && (location.pathname === '/autoforge' || location.pathname === '/dairyflow' || location.pathname === '/cross-industry')) {
      navigate('/');
    }
  };

  const sidebarContent = (
    <div className={`flex flex-col h-full border-r transition-colors duration-200 ${themeAccent.sidebarTint}`}>
      <div className="px-5 py-4 border-b border-inherit flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="font-display font-bold text-lg tracking-tight truncate">INDUSMIND</div>
          <div className="text-[11px] opacity-70 truncate">{themeAccent.modeTag}</div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-md opacity-70 hover:opacity-100"
          aria-label="Close navigation menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Industry Switcher inside Sidebar */}
      <div className="px-3 py-3 border-b border-inherit">
        <div className="text-[11px] font-medium opacity-60 px-2 mb-1.5">Industry Workspace</div>
        <div className="grid grid-cols-2 gap-1">
          {INDUSTRY_OPTIONS.map((opt) => {
            const active = industryScope === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleIndustrySwitch(opt.id)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium text-left truncate transition-colors ${
                  active ? themeAccent.sidebarActive : themeAccent.sidebarMuted
                }`}
              >
                {opt.label.replace('INDUSMIND ', '')}
              </button>
            );
          })}
        </div>
      </div>

      {/* 17 Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isAlerts = item.path === '/alerts';
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive ? themeAccent.sidebarActive : themeAccent.sidebarMuted
                }`
              }
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 shrink-0 opacity-85" />
                <span className="truncate">{item.label}</span>
              </span>
              {isAlerts && activeAlertsCount > 0 && (
                <span className="font-mono text-[11px] tabular-nums opacity-85 shrink-0">
                  {activeAlertsCount}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Quick shortcut to Expert Dairy Temp Verification */}
        <div className="pt-2 mt-2 border-t border-inherit">
          <NavLink
            to="/dairyflow/temperature-verification"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                isActive ? themeAccent.sidebarActive : themeAccent.sidebarMuted
              }`
            }
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <ClipboardCheck className="w-4 h-4 shrink-0 opacity-85" />
              <span className="truncate">Temp Verification</span>
            </span>
            {pendingVerifCount > 0 && (
              <span className="font-mono text-[11px] tabular-nums text-amber-500 shrink-0">
                {pendingVerifCount}
              </span>
            )}
          </NavLink>
        </div>
      </nav>

      {/* Signed-in operator footer */}
      <div className="p-3 border-t border-inherit flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-medium truncate">{currentUser?.name}</div>
          <div className="text-[11px] opacity-70 truncate">{currentUser?.role}</div>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="p-2 rounded-lg opacity-75 hover:opacity-100 hover:bg-slate-200/20 transition-colors shrink-0"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen flex ${
        industryScope === 'dairyflow'
          ? 'bg-[#F6F8F3] dark:bg-slate-950'
          : 'bg-slate-50 dark:bg-slate-950'
      } text-slate-900 dark:text-slate-100`}
    >
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen no-print">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10">{sidebarContent}</aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Clean 3-Zone Top Header */}
        <header
          className={`sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b px-4 lg:px-6 py-3 flex items-center justify-between gap-8 no-print ${themeAccent.topBorder}`}
        >
          {/* Zone 1: Breadcrumb / Active View */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-display font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                INDUSMIND
              </span>
              <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                /
              </span>
              <span className="font-medium text-slate-600 dark:text-slate-300 truncate">
                {currentNav.label}
              </span>
            </div>
          </div>

          {/* Zone 2: Segmented Industry Selector */}
          <div className="hidden xl:flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
            {INDUSTRY_OPTIONS.map((opt) => {
              const active = industryScope === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleIndustrySwitch(opt.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? themeAccent.activeBg
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Zone 3: Theme Toggle & Alerts Link */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              title={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => navigate('/production')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${themeAccent.activeBg}`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>What-If Simulator</span>
            </button>
          </div>
        </header>

        {/* Workspace Live Telemetry & Siren Control Bar */}
        <div className="bg-slate-100/90 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {liveSimulationActive ? 'Live Production Fluctuation Active' : 'Live Fluctuation Paused'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              Updated {lastTelemetryTick}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleLiveSimulation}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-[11px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {liveSimulationActive ? (
                <>
                  <Pause className="w-3 h-3" />
                  <span>Pause Stream</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  <span>Resume Stream</span>
                </>
              )}
            </button>

            <button
              onClick={toggleSiren}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                sirenEnabled
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400'
              }`}
            >
              {sirenEnabled ? (
                <>
                  <Volume2 className="w-3 h-3" />
                  <span>Alert Siren Armed</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3 h-3" />
                  <span>Siren Muted</span>
                </>
              )}
            </button>

            {sirenPlaying && (
              <button
                onClick={silenceSiren}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-medium"
              >
                <VolumeX className="w-3 h-3" />
                <span>Silence Siren</span>
              </button>
            )}

            <button
              onClick={() => triggerSimulatedDelaySpike()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-medium"
            >
              <BellRing className="w-3 h-3" />
              <span>Simulate Delay & Siren</span>
            </button>
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-6 max-w-[1440px] w-full mx-auto space-y-6">
          {/* Immediate Urgent Delay Alert Banner when triggered automatically */}
          {latestLiveAlert && (() => {
            const matchedStage = stages.find(
              (s) =>
                latestLiveAlert.sourceEntity.includes(s.id) ||
                latestLiveAlert.title.toLowerCase().includes(s.name.toLowerCase())
            );
            const activeVoiceLabel =
              lastVoiceAlertText ??
              (matchedStage ? `There is an issue in ${matchedStage.name}` : 'There is an issue');
            return (
              <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 flex flex-wrap items-center justify-between gap-4 text-xs no-print">
                <div className="flex items-start gap-3 min-w-0">
                  <BellRing className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-rose-900 dark:text-rose-100">
                        {latestLiveAlert.title}
                      </span>
                      {matchedStage && (
                        <span className="font-mono text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                          · Stage: {matchedStage.name} ({matchedStage.industry === 'autoforge' ? 'AutoForge' : 'DairyFlow'})
                        </span>
                      )}
                    </div>
                    <p className="text-rose-800 dark:text-rose-200 mt-0.5">
                      {latestLiveAlert.description}
                    </p>
                    <div className="font-mono text-[11px] text-rose-700 dark:text-rose-300 mt-1">
                      Alert ID: {latestLiveAlert.id} · Logged to Alerts Tab at {latestLiveAlert.timestamp}
                      {sirenPlaying
                        ? ` · 4s Siren Playing -> Voice: "${activeVoiceLabel}"`
                        : ` · Voice: "${activeVoiceLabel}"`}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {sirenPlaying && (
                    <button
                      onClick={silenceSiren}
                      className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-medium"
                    >
                      Silence Siren
                    </button>
                  )}
                  <button
                    onClick={() => updateAlertStatus(latestLiveAlert.id, 'Resolved')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium"
                  >
                    Resolve Issue
                  </button>
                  <button
                    onClick={() => {
                      navigate('/alerts');
                      dismissLiveAlert();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium"
                  >
                    Open Alerts Tab
                  </button>
                  <button
                    onClick={() => updateAlertStatus(latestLiveAlert.id, 'Acknowledged')}
                    className="px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-100 font-medium"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Automatic / Manual Issue Resolved Top Banner */}
          {resolvedNotice && (
            <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-between gap-4 text-xs no-print">
              <div className="flex items-center gap-2.5 text-emerald-900 dark:text-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-semibold">Issue Resolved:</span> {resolvedNotice}{' '}
                  <span className="font-mono text-[11px] opacity-80">
                    · Voice announced &quot;{lastResolvedVoiceText ?? 'Issue resolved'}&quot;
                  </span>
                </div>
              </div>
              <button
                onClick={dismissResolvedNotice}
                className="text-emerald-800 dark:text-emerald-200 hover:underline font-medium shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
};
