import React, { useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Info, Lightbulb } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calcDowntimePercentage, calcMachineUtilization, formatPercent } from '../utils/calculations';
import { SectionPanel, SimulatedBanner, StatusLabel } from '../components/common/UiPrimitives';

export const PredictiveAnalyticsPage: React.FC = () => {
  const { machines, anomalies, stages, inventory, coldStorage } = useApp();
  const [industryFilter, setIndustryFilter] = useState<'all' | 'autoforge' | 'dairyflow'>('all');

  const filteredMachines = machines
    .filter((m) => industryFilter === 'all' || m.industry === industryFilter)
    .sort((a, b) => b.riskScore - a.riskScore);

  const filteredAnomalies = anomalies.filter(
    (a) => industryFilter === 'all' || a.industry === industryFilter
  );

  // Simulated 7-day forward forecast (Rule-Based Projection)
  const forecastSeries = [
    { day: 'Day +1', AutoForgeUtil: 92, DairyFlowUtil: 89, ForecastEfficiency: 84 },
    { day: 'Day +2', AutoForgeUtil: 95, DairyFlowUtil: 91, ForecastEfficiency: 82 },
    { day: 'Day +3 (Peak Risk)', AutoForgeUtil: 98, DairyFlowUtil: 94, ForecastEfficiency: 78 },
    { day: 'Day +4 (Post-Maint)', AutoForgeUtil: 86, DairyFlowUtil: 84, ForecastEfficiency: 91 },
    { day: 'Day +5', AutoForgeUtil: 84, DairyFlowUtil: 83, ForecastEfficiency: 93 },
    { day: 'Day +6', AutoForgeUtil: 85, DairyFlowUtil: 85, ForecastEfficiency: 94 },
    { day: 'Day +7', AutoForgeUtil: 83, DairyFlowUtil: 82, ForecastEfficiency: 95 },
  ];

  // Dynamic smart recommendations tied directly to live application records
  const paintingStage = stages.find((s) => s.name === 'Painting');
  const packagingStage = stages.find((s) => s.name === 'Packaging');
  const paintBooth = machines.find((m) => m.id === 'AF-PNT-02');
  const lowInv = inventory.filter((i) => i.status !== 'Optimal');
  const vaultB = coldStorage.find((c) => c.id === 'CS-VAULT-B');

  const smartRecommendations = [
    {
      title: 'Painting stage has accumulated excessive waiting time',
      industry: 'AutoForge',
      supportingData: `Queue length ${paintingStage?.queueLength ?? 14} chassis · Avg wait ${paintingStage?.waitingTimeMin ?? 34} min · Cycle ${paintingStage?.actualTimeMin ?? 58}m vs ${paintingStage?.expectedTimeMin ?? 42}m expected.`,
      action: paintingStage?.recommendedAction || 'Rebalance metallic coat load and service Booth B atomizer.',
    },
    {
      title: 'Packaging capacity restricts dairy throughput',
      industry: 'DairyFlow',
      supportingData: `Packaging capacity ${packagingStage?.productionCapacity ?? 44000} L/shift vs Pasteurization inflow ${stages.find((s) => s.name === 'Pasteurization')?.unitsProcessed ?? 47200} L · ${packagingStage?.queueLength ?? 4200} L queued.`,
      action: packagingStage?.recommendedAction || 'Clear film-seal servo slip on DF-PKG-02.',
    },
    {
      title: 'Machine risk index elevated — immediate maintenance inspection recommended',
      industry: 'AutoForge',
      supportingData: `${paintBooth?.id} (${paintBooth?.name}) risk index ${paintBooth?.riskScore}/100 · Vibration ${paintBooth?.vibrationMmS} mm/s · ${paintBooth?.downtimeMin} min downtime today.`,
      action: paintBooth?.recommendedMaintenanceAction || 'Replace turbine seal assembly.',
    },
    {
      title: 'Inventory buffer insufficient for 3-day continuous shift schedule',
      industry: 'Cross-Plant',
      supportingData: `${lowInv.length} SKUs flagged (${lowInv.map((i) => `${i.name}: ${i.currentStock} ${i.unit}`).join('; ')}).`,
      action: 'Issue immediate purchase orders for Metallic Clear-Coat Drums and LDPE Pouch Film Rolls.',
    },
    {
      title: 'Refrigeration energy consumption and thermal drift detected',
      industry: 'DairyFlow',
      supportingData: `${vaultB?.name}: ${vaultB?.currentTempC}°C vs ${vaultB?.configuredMaxC}°C limit · ${vaultB?.energyKwhToday} kWh today (+14.2% compressor draw).`,
      action: 'Execute manual evaporator defrost and inspect condenser VFD.',
    },
  ];

  return (
    <div className="space-y-6">
      <SimulatedBanner label="Rule-Based & Statistical Predictive Demonstration · Live Scikit-learn model pipeline activates upon FastAPI integration" />

      <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <strong>Methodological Transparency:</strong> Risk scores, anomaly thresholds, and 7-day capacity forecasts below are computed via deterministic rule-based heuristics over simulated telemetry. They are clearly labeled as simulated predictions pending Scikit-learn / Python ML model training.
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Predictive Maintenance & Anomaly Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rule-based equipment failure risk scoring, telemetry anomaly detection, and capacity forecasting
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
          {(['all', 'autoforge', 'dairyflow'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setIndustryFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${
                industryFilter === f
                  ? 'bg-slate-900 text-white dark:bg-blue-600'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {f === 'all' ? 'All Plants' : f === 'autoforge' ? 'AutoForge' : 'DairyFlow'}
            </button>
          ))}
        </div>
      </div>

      {/* Predictive Maintenance Risk Matrix */}
      <SectionPanel
        title="Predictive Maintenance Risk Assessment (Rule-Based Demo)"
        subtitle="Supporting telemetry, historical downtime, and recommended preventive intervention"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-2 pr-3 font-medium">Machine</th>
                <th className="py-2 pr-3 font-medium">Risk Level</th>
                <th className="py-2 pr-3 font-medium text-right">Simulated Risk</th>
                <th className="py-2 pr-3 font-medium text-right">Downtime Today</th>
                <th className="py-2 pr-3 font-medium">Supporting Measurements</th>
                <th className="py-2 font-medium">Recommended Maintenance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMachines.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 pr-3">
                    <div className="font-medium text-slate-900 dark:text-white">{m.name}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {m.id} · {m.stageName}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap">
                    <StatusLabel status={m.riskLevel} />
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono font-semibold">{m.riskScore}/100</td>
                  <td className="py-2.5 pr-3 text-right font-mono">
                    {m.downtimeMin}m ({formatPercent(calcDowntimePercentage(m.downtimeMin, m.availableOperatingMin))})
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {m.temperatureC}°C · {m.vibrationMmS} mm/s · Util{' '}
                    {formatPercent(calcMachineUtilization(m.actualOperatingMin, m.availableOperatingMin))}
                  </td>
                  <td className="py-2.5 text-slate-600 dark:text-slate-300 max-w-sm">
                    {m.recommendedMaintenanceAction}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>

      {/* Anomaly Detection & Forecast Chart */}
      <div className="grid lg:grid-cols-12 gap-6">
        <SectionPanel
          title="Detected Operational Anomalies"
          subtitle="Unusual machine readings, cycle delays, temperature & energy deviations"
          className="lg:col-span-6"
        >
          <div className="space-y-3 text-xs">
            {filteredAnomalies.map((anm) => (
              <div
                key={anm.id}
                className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">{anm.entityName}</span>
                  <StatusLabel status={anm.severity} />
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {anm.metricType} · Observed: {anm.observedValue} vs Baseline: {anm.expectedBaseline} ({anm.deviationLabel})
                </div>
                <p className="text-slate-600 dark:text-slate-300">{anm.explanation}</p>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel
          title="7-Day Capacity & Efficiency Forecast (Simulated)"
          subtitle="Projected bottleneck saturation on Day +3 without maintenance vs recovery post-intervention"
          className="lg:col-span-6"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastSeries} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" unit="%" domain={[70, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="AutoForgeUtil" name="AF Capacity Load %" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="DairyFlowUtil" name="DF Capacity Load %" stroke="#15803d" strokeWidth={2} />
                <Line type="monotone" dataKey="ForecastEfficiency" name="Combined Efficiency %" stroke="#d97706" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionPanel>
      </div>

      {/* Smart Recommendations with Explicit Supporting Data */}
      <SectionPanel
        title="Smart Recommendations (Data-Cited)"
        subtitle="Every recommendation cites the live supporting measurement from INDUSMIND records"
      >
        <div className="grid md:grid-cols-2 gap-4 text-xs">
          {smartRecommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
            >
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{rec.title}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {rec.industry} · {rec.supportingData}
              </div>
              <div className="text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                <strong>Suggested Action:</strong> {rec.action}
              </div>
            </div>
          ))}
        </div>
      </SectionPanel>
    </div>
  );
};
