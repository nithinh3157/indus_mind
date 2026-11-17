import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Wrench } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calcDowntimePercentage, calcMachineUtilization, formatPercent } from '../utils/calculations';
import {
  KpiCard,
  SearchInput,
  SectionPanel,
  SimulatedBanner,
  StatusLabel,
} from '../components/common/UiPrimitives';

export const MachineMonitoringPage: React.FC = () => {
  const { machines, industryScope, logMachineMaintenance } = useApp();
  const [search, setSearch] = useState('');
  const [filterIndustry, setFilterIndustry] = useState<'all' | 'autoforge' | 'dairyflow'>(
    industryScope === 'autoforge' || industryScope === 'dairyflow' ? industryScope : 'all'
  );
  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[2]?.id || machines[0]?.id);
  const [maintNote, setMaintNote] = useState('');

  const filtered = machines.filter((m) => {
    const indMatch = filterIndustry === 'all' || m.industry === filterIndustry;
    const textMatch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.stageName.toLowerCase().includes(search.toLowerCase());
    return indMatch && textMatch;
  });

  const selectedMachine = machines.find((m) => m.id === selectedMachineId) || filtered[0] || machines[0];

  const totalActual = filtered.reduce((s, m) => s + m.actualOperatingMin, 0);
  const totalAvail = filtered.reduce((s, m) => s + m.availableOperatingMin, 0);
  const totalDown = filtered.reduce((s, m) => s + m.downtimeMin, 0);
  const warningsCount = filtered.filter((m) => m.operatingStatus === 'Warning' || m.operatingStatus === 'Down').length;

  const chartData = filtered.map((m) => ({
    id: m.id,
    Utilization: Number(calcMachineUtilization(m.actualOperatingMin, m.availableOperatingMin).toFixed(1)),
    DowntimePct: Number(calcDowntimePercentage(m.downtimeMin, m.availableOperatingMin).toFixed(1)),
  }));

  const handleLogMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintNote.trim() || !selectedMachine) return;
    logMachineMaintenance(selectedMachine.id, maintNote.trim());
    setMaintNote('');
  };

  return (
    <div className="space-y-6">
      <SimulatedBanner label="Machine Telemetry & Health Console · Sensor readings, vibration, and downtime are simulated" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Monitored Machines" value={`${filtered.length}`} subtitle="Active sensor fleet" />
        <KpiCard
          title="Fleet Machine Utilization"
          value={formatPercent(calcMachineUtilization(totalActual, totalAvail))}
          subtitle="Actual / Available Operating Time"
          tone="positive"
        />
        <KpiCard
          title="Total Downtime Today"
          value={`${totalDown} min`}
          subtitle={`Downtime %: ${formatPercent(calcDowntimePercentage(totalDown, totalAvail))}`}
          tone={totalDown > 120 ? 'critical' : 'warning'}
        />
        <KpiCard
          title="Active Maintenance Warnings"
          value={`${warningsCount}`}
          subtitle="Machines flagged for inspection"
          tone={warningsCount > 0 ? 'warning' : 'positive'}
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <SectionPanel
          title="Machine Fleet Telemetry"
          subtitle="Click any machine row to inspect maintenance history and log service"
          className="lg:col-span-8"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                {(['all', 'autoforge', 'dairyflow'] as const).map((ind) => (
                  <button
                    key={ind}
                    onClick={() => setFilterIndustry(ind)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize ${
                      filterIndustry === ind
                        ? 'bg-slate-900 text-white dark:bg-blue-600'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {ind === 'all' ? 'All' : ind === 'autoforge' ? 'AutoForge' : 'DairyFlow'}
                  </button>
                ))}
              </div>
              <SearchInput value={search} onChange={setSearch} placeholder="Search ID, machine, stage..." />
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-2 pr-3 font-medium">Machine ID & Name</th>
                  <th className="py-2 pr-3 font-medium">Stage</th>
                  <th className="py-2 pr-3 font-medium text-right">Utilization</th>
                  <th className="py-2 pr-3 font-medium text-right">Downtime</th>
                  <th className="py-2 pr-3 font-medium text-right">Temp / Vib</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((m) => {
                  const util = calcMachineUtilization(m.actualOperatingMin, m.availableOperatingMin);
                  const isSelected = selectedMachine?.id === m.id;
                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedMachineId(m.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 pr-3">
                        <div className="font-medium text-slate-900 dark:text-white">{m.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {m.id} · {m.industry === 'autoforge' ? 'AutoForge' : 'DairyFlow'}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">{m.stageName}</td>
                      <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{formatPercent(util)}</td>
                      <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{m.downtimeMin}m</td>
                      <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                        {m.temperatureC}°C · {m.vibrationMmS}mm/s
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <StatusLabel status={m.operatingStatus} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionPanel>

        {/* Machine Detail & Maintenance Logger */}
        <SectionPanel
          title={selectedMachine ? `${selectedMachine.id} Diagnostics` : 'Machine Diagnostics'}
          subtitle={selectedMachine?.name}
          className="lg:col-span-4"
        >
          {selectedMachine && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <StatusLabel status={selectedMachine.operatingStatus} />
                <span className="font-mono text-slate-500">Power: {selectedMachine.powerDrawKw} kW</span>
              </div>

              {selectedMachine.abnormalBehaviour && (
                <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200">
                  <div className="font-medium">Abnormal Behaviour Detected</div>
                  <div className="mt-1">{selectedMachine.abnormalBehaviour}</div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="font-medium text-slate-700 dark:text-slate-300">Maintenance History</div>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  {selectedMachine.maintenanceHistory.map((h, i) => (
                    <li key={i} className="font-mono">
                      • {h}
                    </li>
                  ))}
                </ul>
              </div>

              <form onSubmit={handleLogMaintenance} className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <label className="block font-medium text-slate-700 dark:text-slate-300">
                  Record Completed Maintenance
                </label>
                <input
                  type="text"
                  value={maintNote}
                  onChange={(e) => setMaintNote(e.target.value)}
                  placeholder="e.g., Replaced atomizer turbine seal..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 text-white font-medium inline-flex items-center justify-center gap-1.5"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Log Maintenance & Clear Warning</span>
                </button>
              </form>
            </div>
          )}
        </SectionPanel>
      </div>

      <SectionPanel
        title="Utilization vs Downtime Distribution"
        subtitle="Computed using Actual Operating Time / Available Operating Time × 100"
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="id" tick={{ fontSize: 11 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 11 }} stroke="#64748b" unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: 8,
                  color: '#f8fafc',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="Utilization" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="DowntimePct" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionPanel>
    </div>
  );
};
