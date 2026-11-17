import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  computeNormalizedIndustryKPIs,
  exportRowsToCsv,
  formatCurrency,
  formatPercent,
} from '../utils/calculations';
import { SectionPanel, SimulatedBanner } from '../components/common/UiPrimitives';

const KPI_GLOSSARY = [
  { name: 'Production Efficiency', meaning: 'Actual completed output divided by planned output (%).' },
  { name: 'Machine Utilization', meaning: 'Actual operating time divided by scheduled available operating time (%).' },
  { name: 'Downtime Percentage', meaning: 'Unplanned + maintenance machine stoppage relative to available time (%).' },
  { name: 'Quality Acceptance Rate', meaning: 'Accepted units passing inspection divided by total inspected units (%).' },
  { name: 'Waste Rate', meaning: 'Scrapped/rejected input material divided by total input (%).' },
  { name: 'Delay Percentage', meaning: '(Actual processing time − Expected processing time) / Expected time (%).' },
  { name: 'Energy per Output Unit', meaning: 'Total kWh consumed per finished vehicle (AutoForge) or per litre eq. (DairyFlow).' },
  { name: 'Maintenance Cost Ratio', meaning: 'Equipment maintenance expenditure as a share of total operating expenses (%).' },
  { name: 'Profit Margin', meaning: 'Net profit divided by total revenue (%).' },
];

export const CrossIndustryPage: React.FC = () => {
  const { stages, machines, qualityMetrics, financials } = useApp();
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const afFin = financials.filter((f) => f.industry === 'autoforge');
  const dfFin = financials.filter((f) => f.industry === 'dairyflow');

  const afNorm = computeNormalizedIndustryKPIs('autoforge', stages, machines, qualityMetrics, afFin, 6, 162);
  const dfNorm = computeNormalizedIndustryKPIs('dairyflow', stages, machines, qualityMetrics, dfFin, 1280, 48500);

  const multiplier = timeframe === 'daily' ? 1 : timeframe === 'weekly' ? 7 : 30;

  const percentageComparison = [
    {
      kpi: 'Production Efficiency',
      AutoForge: Number(afNorm.productionEfficiencyPercent.toFixed(1)),
      DairyFlow: Number(dfNorm.productionEfficiencyPercent.toFixed(1)),
    },
    {
      kpi: 'Machine Utilization',
      AutoForge: Number(afNorm.machineUtilizationPercent.toFixed(1)),
      DairyFlow: Number(dfNorm.machineUtilizationPercent.toFixed(1)),
    },
    {
      kpi: 'Downtime %',
      AutoForge: Number(afNorm.downtimePercent.toFixed(1)),
      DairyFlow: Number(dfNorm.downtimePercent.toFixed(1)),
    },
    {
      kpi: 'Quality Acceptance',
      AutoForge: Number(afNorm.qualityAcceptanceRatePercent.toFixed(1)),
      DairyFlow: Number(dfNorm.qualityAcceptanceRatePercent.toFixed(1)),
    },
    {
      kpi: 'Waste Rate %',
      AutoForge: Number(afNorm.wasteRatePercent.toFixed(1)),
      DairyFlow: Number(dfNorm.wasteRatePercent.toFixed(1)),
    },
    {
      kpi: 'Avg Stage Delay %',
      AutoForge: Number(afNorm.avgDelayPercent.toFixed(1)),
      DairyFlow: Number(dfNorm.avgDelayPercent.toFixed(1)),
    },
    {
      kpi: 'Profit Margin %',
      AutoForge: Number(afNorm.profitMarginPercent.toFixed(1)),
      DairyFlow: Number(dfNorm.profitMarginPercent.toFixed(1)),
    },
  ];

  // Daily profit margin & efficiency trend across 7 simulated days
  const marginTrend = afFin.map((afDay, idx) => {
    const dfDay = dfFin[idx];
    const afTotalExp =
      afDay.rawMaterialCost +
      afDay.componentOrProcurementCost +
      afDay.electricityCost +
      afDay.packagingOrPaintCost +
      afDay.labourCost +
      afDay.maintenanceCost +
      afDay.reworkAndWastageCost;
    const dfTotalExp = dfDay
      ? dfDay.rawMaterialCost +
        dfDay.componentOrProcurementCost +
        dfDay.electricityCost +
        dfDay.refrigerationCost +
        dfDay.packagingOrPaintCost +
        dfDay.labourCost +
        dfDay.maintenanceCost +
        dfDay.reworkAndWastageCost
      : 0;
    const afMargin = ((afDay.revenue - afTotalExp) / Math.max(1, afDay.revenue)) * 100;
    const dfMargin = dfDay ? ((dfDay.revenue - dfTotalExp) / Math.max(1, dfDay.revenue)) * 100 : 0;

    return {
      date: timeframe === 'daily' ? afDay.dateLabel : timeframe === 'weekly' ? `W${idx + 1}` : `M${idx + 1}`,
      AutoForgeMargin: Number(afMargin.toFixed(1)),
      DairyFlowMargin: Number(dfMargin.toFixed(1)),
    };
  });

  const handleExportComparison = () => {
    exportRowsToCsv(
      `indusmind_cross_industry_${timeframe}.csv`,
      ['Normalized KPI', 'AutoForge', 'DairyFlow'],
      [
        ...percentageComparison.map((r) => [r.kpi, `${r.AutoForge}%`, `${r.DairyFlow}%`]),
        [
          'Energy per Output Unit',
          `${afNorm.energyPerOutputUnitKwh.toFixed(1)} kWh/vehicle`,
          `${dfNorm.energyPerOutputUnitKwh.toFixed(2)} kWh/L eq.`,
        ],
        [
          'Maintenance Cost Ratio',
          formatPercent(afNorm.maintenanceCostRatioPercent),
          formatPercent(dfNorm.maintenanceCostRatioPercent),
        ],
        [
          'Cost per Output Unit (Simulated Est.)',
          `${formatCurrency(afNorm.costPerOutputUnit)} / vehicle`,
          `${formatCurrency(dfNorm.costPerOutputUnit)} / L eq.`,
        ],
      ]
    );
  };

  return (
    <div className="space-y-6">
      <SimulatedBanner label="Cross-Industry Normalized Intelligence · Vehicle counts and milk litres are normalized into dimensionless % ratios" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Cross-Industry Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Apples-to-apples operational benchmarking between AutoForge and DairyFlow using normalized KPIs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
            {(['daily', 'weekly', 'monthly'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${
                  timeframe === tf
                    ? 'bg-slate-900 text-white dark:bg-blue-600'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportComparison}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Normalized Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: 'Production Efficiency',
            af: formatPercent(afNorm.productionEfficiencyPercent),
            df: formatPercent(dfNorm.productionEfficiencyPercent),
          },
          {
            label: 'Machine Utilization',
            af: formatPercent(afNorm.machineUtilizationPercent),
            df: formatPercent(dfNorm.machineUtilizationPercent),
          },
          {
            label: 'Quality Acceptance',
            af: formatPercent(afNorm.qualityAcceptanceRatePercent),
            df: formatPercent(dfNorm.qualityAcceptanceRatePercent),
          },
          {
            label: 'Avg Stage Delay %',
            af: formatPercent(afNorm.avgDelayPercent),
            df: formatPercent(dfNorm.avgDelayPercent),
          },
          {
            label: 'Net Profit Margin',
            af: formatPercent(afNorm.profitMarginPercent),
            df: formatPercent(dfNorm.profitMarginPercent),
          },
        ].map((card) => (
          <div
            key={card.label}
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5"
          >
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">AutoForge</span>
              <span className="font-mono font-semibold text-base">{card.af}</span>
            </div>
            <div className="flex items-baseline justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">DairyFlow</span>
              <span className="font-mono font-semibold text-base">{card.df}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-12 gap-6">
        <SectionPanel
          title="Normalized Percentage KPI Comparison"
          subtitle={`Benchmarking operational ratios (${timeframe} view · simulated)`}
          className="lg:col-span-7"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={percentageComparison} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="kpi" tick={{ fontSize: 10 }} stroke="#64748b" />
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
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="AutoForge" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="DairyFlow" fill="#15803d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionPanel>

        <SectionPanel
          title="Net Profit Margin Trend (%)"
          subtitle={`Normalized margin trajectory (${multiplier}x window)`}
          className="lg:col-span-5"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marginTrend} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
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
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="AutoForgeMargin" name="AutoForge %" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="DairyFlowMargin" name="DairyFlow %" stroke="#15803d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionPanel>
      </div>

      {/* Unit-Specific Normalized Metrics & Glossary */}
      <div className="grid lg:grid-cols-12 gap-6">
        <SectionPanel
          title="Intensity & Cost Ratio Comparison"
          subtitle="Contextualized per native output unit (Vehicle vs Litre Equivalent)"
          className="lg:col-span-5"
        >
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="py-3 flex justify-between">
              <span className="text-slate-600 dark:text-slate-300">Energy per Output Unit</span>
              <span className="font-mono">
                AF {afNorm.energyPerOutputUnitKwh.toFixed(1)} kWh/veh · DF{' '}
                {dfNorm.energyPerOutputUnitKwh.toFixed(2)} kWh/L
              </span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-600 dark:text-slate-300">Maintenance Cost Ratio</span>
              <span className="font-mono">
                AF {formatPercent(afNorm.maintenanceCostRatioPercent)} · DF{' '}
                {formatPercent(dfNorm.maintenanceCostRatioPercent)}
              </span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-600 dark:text-slate-300">Est. Cost per Output Unit</span>
              <span className="font-mono">
                AF {formatCurrency(afNorm.costPerOutputUnit)}/veh · DF{' '}
                {formatCurrency(dfNorm.costPerOutputUnit)}/L
              </span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-600 dark:text-slate-300">Waste Rate</span>
              <span className="font-mono">
                AF {formatPercent(afNorm.wasteRatePercent)} · DF{' '}
                {formatPercent(dfNorm.wasteRatePercent)}
              </span>
            </div>
          </div>
        </SectionPanel>

        <SectionPanel
          title="KPI Methodology & Definitions"
          subtitle="Explicit mathematical definitions behind normalized cross-industry indicators"
          className="lg:col-span-7"
        >
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            {KPI_GLOSSARY.map((item) => (
              <div key={item.name} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.meaning}</div>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>
    </div>
  );
};
