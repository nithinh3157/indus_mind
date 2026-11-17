import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { calcWasteRate, formatNumber, formatPercent } from '../utils/calculations';
import { KpiCard, SectionPanel, SimulatedBanner, StatusLabel } from '../components/common/UiPrimitives';

export const EnergySustainabilityPage: React.FC = () => {
  const { stages, coldStorage, anomalies, factories } = useApp();

  const afStages = stages.filter((s) => s.industry === 'autoforge');
  const dfStages = stages.filter((s) => s.industry === 'dairyflow');

  const afEnergy = afStages.reduce((s, st) => s + st.energyKwh, 0);
  const dfEnergy = dfStages.reduce((s, st) => s + st.energyKwh, 0);
  const totalEnergy = afEnergy + dfEnergy;
  const coldEnergy = coldStorage.reduce((s, c) => s + c.energyKwhToday, 0);

  const energyChart = stages.map((s) => ({
    name: `${s.industry === 'autoforge' ? 'AF' : 'DF'} · ${s.name.split(' ')[0]}`,
    kWh: s.energyKwh,
  }));

  const energyAnomalies = anomalies.filter(
    (a) => a.metricType === 'Energy Consumption' || a.entityName.includes('Paint')
  );

  return (
    <div className="space-y-6">
      <SimulatedBanner label="Energy & Sustainability Telemetry · Power draw (kWh) and waste metrics are simulated estimates" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Combined Plant Energy Today"
          value={`${formatNumber(totalEnergy)} kWh`}
          subtitle={`AutoForge ${formatNumber(afEnergy)} · DairyFlow ${formatNumber(dfEnergy)}`}
        />
        <KpiCard
          title="AutoForge Energy / Vehicle"
          value={`${(afEnergy / 132).toFixed(1)} kWh`}
          subtitle="Dominated by Painting Curing & Welding"
          tone="warning"
        />
        <KpiCard
          title="DairyFlow Refrigeration Load"
          value={`${formatNumber(coldEnergy)} kWh`}
          subtitle={`${formatPercent((coldEnergy / Math.max(1, dfEnergy)) * 100)} of dairy plant energy`}
          tone="warning"
        />
        <KpiCard
          title="Material Waste Rate"
          value={`AF ${formatPercent(calcWasteRate(6, 162))} · DF ${formatPercent(calcWasteRate(1280, 48500))}`}
          subtitle="Scrap chassis & rejected milk/paneer"
          tone="positive"
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <SectionPanel
          title="Stage-Wise Energy Consumption (kWh)"
          subtitle="Comparing thermal curing, welding, pasteurization, and cold-storage power demand"
          className="lg:col-span-8"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyChart} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="kWh" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionPanel>

        <SectionPanel
          title="Abnormal Energy Usage & Refrigeration Alerts"
          subtitle="High-draw anomalies across plants"
          className="lg:col-span-4"
        >
          <div className="space-y-3 text-xs">
            {energyAnomalies.map((e) => (
              <div key={e.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{e.entityName}</span>
                  <StatusLabel status={e.severity} />
                </div>
                <div className="font-mono text-[11px] text-slate-500">
                  {e.observedValue} vs {e.expectedBaseline} ({e.deviationLabel})
                </div>
                <p className="text-slate-600 dark:text-slate-300">{e.explanation}</p>
              </div>
            ))}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-medium text-slate-700 dark:text-slate-300">Site Energy Totals</div>
              {factories.map((f) => (
                <div key={f.id} className="flex justify-between text-[11px]">
                  <span className="truncate pr-2">{f.name}</span>
                  <span className="font-mono shrink-0">{formatNumber(f.dailyEnergyKwh)} kWh</span>
                </div>
              ))}
            </div>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
};
