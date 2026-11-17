import React, { useState } from 'react';
import { BellRing, Check, CheckCheck, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  EmptyState,
  KpiCard,
  SearchInput,
  SectionPanel,
  SimulatedBanner,
  StatusLabel,
} from '../components/common/UiPrimitives';

export const AlertsPage: React.FC = () => {
  const {
    alerts,
    stages,
    industryScope,
    updateAlertStatus,
    triggerSimulatedDelaySpike,
    sirenEnabled,
    toggleSiren,
    sirenPlaying,
    silenceSiren,
  } = useApp();
  const [search, setSearch] = useState('');
  const [selectedStageId, setSelectedStageId] = useState<string>('auto');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Acknowledged' | 'Resolved'>('All');
  const [industryFilter, setIndustryFilter] = useState<'all' | 'autoforge' | 'dairyflow'>(
    industryScope === 'autoforge' || industryScope === 'dairyflow' ? industryScope : 'all'
  );

  const filtered = alerts.filter((a) => {
    const indOk = industryFilter === 'all' || a.industry === industryFilter;
    const statusOk = statusFilter === 'All' || a.status === statusFilter;
    const textOk =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase());
    return indOk && statusOk && textOk;
  });

  const activeCount = alerts.filter((a) => a.status === 'Active').length;
  const critCount = alerts.filter((a) => a.status === 'Active' && a.severity === 'Critical').length;
  const ackCount = alerts.filter((a) => a.status === 'Acknowledged').length;
  const resolvedCount = alerts.filter((a) => a.status === 'Resolved').length;

  return (
    <div className="space-y-6">
      <SimulatedBanner label="INDUSMIND Alerts & Incident Centre · Live production delays automatically appear here and sound the siren" />

      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">
            Immediate Delay & Siren Verification Controls
          </div>
          <div className="text-slate-500 dark:text-slate-400 mt-0.5">
            Delays rotate automatically across all stages (Painting, Stamping, Assembly, Packaging, Welding, Pasteurization) or select a specific stage below
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedStageId}
            onChange={(e) => setSelectedStageId(e.target.value)}
            aria-label="Target production stage for delay simulation"
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium"
          >
            <option value="auto">Rotate All Stages (Auto)</option>
            <optgroup label="AutoForge Stages">
              {stages
                .filter((s) => s.industry === 'autoforge')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    AutoForge · {s.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="DairyFlow Stages">
              {stages
                .filter((s) => s.industry === 'dairyflow')
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    DairyFlow · {s.name}
                  </option>
                ))}
            </optgroup>
          </select>
          <button
            onClick={() =>
              selectedStageId === 'auto'
                ? triggerSimulatedDelaySpike('autoforge')
                : triggerSimulatedDelaySpike(undefined, selectedStageId)
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A1628] dark:bg-blue-600 text-white font-medium"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>
              {selectedStageId === 'auto'
                ? 'Trigger AutoForge Delay + Siren'
                : `Trigger ${stages.find((s) => s.id === selectedStageId)?.name ?? 'Stage'} Delay`}
            </span>
          </button>
          <button
            onClick={() => triggerSimulatedDelaySpike('dairyflow')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Trigger DairyFlow Delay + Siren</span>
          </button>
          <button
            onClick={toggleSiren}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium"
          >
            {sirenEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{sirenEnabled ? 'Siren Enabled' : 'Siren Muted'}</span>
          </button>
          {sirenPlaying && (
            <button
              onClick={silenceSiren}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-medium"
            >
              Silence Active Siren
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Active Unresolved Alerts" value={`${activeCount}`} subtitle={`${critCount} Critical severity`} tone={activeCount > 0 ? 'critical' : 'positive'} />
        <KpiCard title="Acknowledged In Progress" value={`${ackCount}`} subtitle="Assigned to engineering shift" tone="warning" />
        <KpiCard title="Resolved Today" value={`${resolvedCount}`} subtitle="Closed incident logs" tone="positive" />
        <KpiCard title="Total Tracked Events" value={`${alerts.length}`} subtitle="Across AutoForge & DairyFlow" />
      </div>

      <SectionPanel
        title="Operational Alerts & Notifications"
        subtitle="Covers machine downtime, delays, bottlenecks, low inventory, quality rejections, and temperature checks"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              {(['all', 'autoforge', 'dairyflow'] as const).map((ind) => (
                <button
                  key={ind}
                  onClick={() => setIndustryFilter(ind)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                    industryFilter === ind
                      ? 'bg-slate-900 text-white dark:bg-blue-600'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {ind === 'all' ? 'All' : ind === 'autoforge' ? 'AutoForge' : 'DairyFlow'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              {(['All', 'Active', 'Acknowledged', 'Resolved'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white dark:bg-blue-600'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <SearchInput value={search} onChange={setSearch} placeholder="Search alerts..." />
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            title="No alerts match the selected filters"
            description="Adjust the industry, status, or search filter to inspect other operational notifications."
            action={
              <button
                onClick={() => {
                  setStatusFilter('All');
                  setIndustryFilter('all');
                  setSearch('');
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium"
              >
                Reset Filters
              </button>
            }
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((a) => (
              <div
                key={a.id}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-wrap items-start justify-between gap-4 text-xs"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-slate-500">{a.id}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {a.industry === 'autoforge' ? 'AutoForge' : 'DairyFlow'} · {a.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <StatusLabel status={a.severity} />
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{a.title}</div>
                  <p className="text-slate-600 dark:text-slate-300">{a.description}</p>
                  <div className="text-[11px] font-mono text-slate-500">
                    Source: {a.sourceEntity} · {a.timestamp}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusLabel status={a.status} />
                  {a.status === 'Active' && (
                    <button
                      onClick={() => updateAlertStatus(a.id, 'Acknowledged')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium"
                    >
                      <Check className="w-3 h-3" />
                      <span>Acknowledge</span>
                    </button>
                  )}
                  {a.status !== 'Resolved' && (
                    <button
                      onClick={() => updateAlertStatus(a.id, 'Resolved')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-medium"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>Resolve</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionPanel>
    </div>
  );
};
