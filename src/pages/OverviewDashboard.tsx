import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, Car, ClipboardCheck, Droplets } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ASSET_IMAGES } from '../data/simulatedFactoryData';
import {
  calcDelayPercentage,
  calcMachineUtilization,
  calcProductionEfficiency,
  calcQualityAcceptanceRate,
  computeFinancialSummary,
  computeNormalizedIndustryKPIs,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../utils/calculations';
import {
  KpiCard,
  ResilientImage,
  SectionPanel,
  SimulatedBanner,
  StatusLabel,
} from '../components/common/UiPrimitives';

export const OverviewDashboard: React.FC = () => {
  const {
    factories,
    stages,
    machines,
    qualityMetrics,
    financials,
    alerts,
    dairyBatches,
    tempVerifications,
    setIndustryScope,
  } = useApp();
  const navigate = useNavigate();

  const operationalFactories = factories.filter((f) => f.status !== 'Maintenance').length;

  const afFinDaily = financials.filter((f) => f.industry === 'autoforge' && f.periodType === 'daily');
  const dfFinDaily = financials.filter((f) => f.industry === 'dairyflow' && f.periodType === 'daily');
  const latestAfFin = afFinDaily[afFinDaily.length - 1];
  const latestDfFin = dfFinDaily[dfFinDaily.length - 1];

  const todaySummary = computeFinancialSummary(
    [latestAfFin, latestDfFin].filter(Boolean)
  );

  const afStages = stages.filter((s) => s.industry === 'autoforge');
  const dfStages = stages.filter((s) => s.industry === 'dairyflow');
  const afFinal = afStages[afStages.length - 1];
  const dfFinal = dfStages[dfStages.length - 1];

  const afEfficiency = afFinal ? calcProductionEfficiency(afFinal.unitsProcessed, afFinal.plannedOutput) : 0;
  const dfEfficiency = dfFinal ? calcProductionEfficiency(dfFinal.unitsProcessed, dfFinal.plannedOutput) : 0;
  const overallEfficiency = (afEfficiency + dfEfficiency) / 2;

  const totalActualOp = machines.reduce((s, m) => s + m.actualOperatingMin, 0);
  const totalAvailOp = machines.reduce((s, m) => s + m.availableOperatingMin, 0);
  const overallUtilization = calcMachineUtilization(totalActualOp, totalAvailOp);

  const activeAlerts = alerts.filter((a) => a.status === 'Active');
  const delayedStages = stages.filter(
    (s) => calcDelayPercentage(s.actualTimeMin, s.expectedTimeMin) >= 10
  );

  const afQuality = qualityMetrics.filter((q) => q.industry === 'autoforge');
  const dfQuality = qualityMetrics.filter((q) => q.industry === 'dairyflow');
  const afQualityRate = calcQualityAcceptanceRate(
    afQuality.reduce((s, q) => s + q.acceptedUnits, 0),
    afQuality.reduce((s, q) => s + q.inspectedUnits, 0)
  );
  const dfQualityRate = calcQualityAcceptanceRate(
    dfQuality.reduce((s, q) => s + q.acceptedUnits, 0),
    dfQuality.reduce((s, q) => s + q.inspectedUnits, 0)
  );
  const avgQualityRate = (afQualityRate + dfQualityRate) / 2;

  // Normalized KPI comparison
  const afNorm = computeNormalizedIndustryKPIs('autoforge', stages, machines, qualityMetrics, afFinDaily, 6, 162);
  const dfNorm = computeNormalizedIndustryKPIs('dairyflow', stages, machines, qualityMetrics, dfFinDaily, 1280, 48500);

  const comparisonData = [
    {
      metric: 'Production Efficiency',
      AutoForge: Number(afNorm.productionEfficiencyPercent.toFixed(1)),
      DairyFlow: Number(dfNorm.productionEfficiencyPercent.toFixed(1)),
    },
    {
      metric: 'Machine Utilization',
      AutoForge: Number(afNorm.machineUtilizationPercent.toFixed(1)),
      DairyFlow: Number(dfNorm.machineUtilizationPercent.toFixed(1)),
    },
    {
      metric: 'Quality Acceptance',
      AutoForge: Number(afNorm.qualityAcceptanceRatePercent.toFixed(1)),
      DairyFlow: Number(dfNorm.qualityAcceptanceRatePercent.toFixed(1)),
    },
    {
      metric: 'Avg Stage Delay %',
      AutoForge: Number(afNorm.avgDelayPercent.toFixed(1)),
      DairyFlow: Number(dfNorm.avgDelayPercent.toFixed(1)),
    },
    {
      metric: 'Net Profit Margin %',
      AutoForge: Number(afNorm.profitMarginPercent.toFixed(1)),
      DairyFlow: Number(dfNorm.profitMarginPercent.toFixed(1)),
    },
  ];

  const pendingTempVerif = tempVerifications.filter((v) => !v.humanConfirmed).length;

  return (
    <div className="space-y-6">
      <SimulatedBanner label="INDUSMIND Unified Executive View · All production, telemetry, and financial figures are simulated estimates" />

      {/* Hero Executive Intro Banner (Industrial image strictly on module intro, never behind charts) */}
      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-white grid lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs text-slate-300 font-medium">
              Unified Multi-Industry Operations Command · {operationalFactories} Active Plants
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-semibold leading-tight text-balance">
              Cross-Plant Manufacturing Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Real-time unified visibility across AutoForge automobile assembly and DairyFlow dairy
              processing. Switch directly into an industry module or compare normalized efficiency.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                setIndustryScope('autoforge');
                navigate('/autoforge');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
            >
              <Car className="w-4 h-4" />
              <span>Open AutoForge</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setIndustryScope('dairyflow');
                navigate('/dairyflow');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium transition-colors"
            >
              <Droplets className="w-4 h-4" />
              <span>Open DairyFlow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/dairyflow/temperature-verification')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-medium transition-colors"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Verify Dairy Temp ({pendingTempVerif} pending)</span>
            </button>
          </div>
        </div>
        <div className="lg:col-span-5 relative min-h-[200px]">
          <ResilientImage
            src={ASSET_IMAGES.loginHero}
            alt="INDUSMIND Smart Manufacturing Facility"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/20 to-transparent" />
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Factories"
          value={`${operationalFactories} / ${factories.length}`}
          subtitle="2 AutoForge · 2 DairyFlow"
          trend="100% Online"
          tone="positive"
        />
        <KpiCard
          title="AutoForge Production Today"
          value={`${afFinal?.unitsProcessed ?? 0} Vehicles`}
          subtitle={`Planned: ${afFinal?.plannedOutput ?? 0} units`}
          trend={formatPercent(afEfficiency)}
          tone={afEfficiency < 90 ? 'warning' : 'positive'}
        />
        <KpiCard
          title="DairyFlow Production Today"
          value={`${formatNumber(dfFinal?.unitsProcessed ?? 0)} L eq.`}
          subtitle={`Across ${dairyBatches.length} active batches`}
          trend={formatPercent(dfEfficiency)}
          tone={dfEfficiency < 90 ? 'warning' : 'positive'}
        />
        <KpiCard
          title="Overall Efficiency & Utilization"
          value={`${formatPercent(overallEfficiency)}`}
          subtitle={`Machine Util: ${formatPercent(overallUtilization)}`}
          trend={`${delayedStages.length} delayed stages`}
          tone={overallEfficiency < 90 ? 'warning' : 'positive'}
        />
        <KpiCard
          title="Active Machine & Process Alerts"
          value={`${activeAlerts.length}`}
          subtitle={`${activeAlerts.filter((a) => a.severity === 'Critical').length} Critical · ${pendingTempVerif} Temp Audit`}
          trend="Action Needed"
          tone={activeAlerts.length > 0 ? 'critical' : 'positive'}
        />
        <KpiCard
          title="Quality Acceptance Rate"
          value={formatPercent(avgQualityRate)}
          subtitle={`AF ${formatPercent(afQualityRate)} · DF ${formatPercent(dfQualityRate)}`}
          trend="Simulated QC"
          tone="positive"
        />
        <KpiCard
          title="Est. Manufacturing Expenditure (Today)"
          value={formatCurrency(todaySummary.totalExpenses)}
          subtitle="Mfg + Operating (Simulated)"
          trend={`Delay loss: ${formatCurrency(todaySummary.totalDelayRelatedLoss)}`}
          tone="warning"
        />
        <KpiCard
          title="Today's Revenue & Est. Net Profit"
          value={formatCurrency(todaySummary.revenue)}
          subtitle={`Est. Net Profit: ${formatCurrency(todaySummary.netProfit)}`}
          trend={`${formatPercent(todaySummary.profitMarginPercent)} margin`}
          tone="positive"
        />
      </div>

      {/* Cross-Industry Normalized Chart + Active Factory Matrix */}
      <div className="grid lg:grid-cols-12 gap-6">
        <SectionPanel
          title="Cross-Industry Normalized Performance (%)"
          subtitle="Standardized percentage ratios — vehicle units and milk litres are never directly compared"
          className="lg:col-span-7"
          actions={
            <button
              onClick={() => navigate('/cross-industry')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
            >
              Full Comparison
            </button>
          }
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="metric" tick={{ fontSize: 11 }} stroke="#64748b" />
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
          title="Active Factory Network"
          subtitle="Operational status across both industry divisions"
          className="lg:col-span-5"
          actions={
            <button
              onClick={() => navigate('/bottlenecks')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
            >
              Bottleneck View
            </button>
          }
        >
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {factories.map((fac) => (
              <div key={fac.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {fac.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {fac.location} · {fac.activeOperators} operators ·{' '}
                    <span className="font-mono">{formatNumber(fac.dailyEnergyKwh)} kWh</span>
                  </div>
                </div>
                <StatusLabel status={fac.status} />
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>

      {/* Priority Alerts Snapshot */}
      <SectionPanel
        title="Priority Operational Alerts"
        subtitle="Real-time bottlenecks, temperature verifications, and inventory triggers"
        actions={
          <button
            onClick={() => navigate('/alerts')}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
          >
            Open Alerts Centre ({activeAlerts.length})
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-4 font-medium">Alert ID</th>
                <th className="py-2.5 pr-4 font-medium">Industry</th>
                <th className="py-2.5 pr-4 font-medium">Category</th>
                <th className="py-2.5 pr-4 font-medium">Summary</th>
                <th className="py-2.5 pr-4 font-medium">Timestamp</th>
                <th className="py-2.5 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {activeAlerts.slice(0, 5).map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 pr-4 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {alert.id}
                  </td>
                  <td className="py-2.5 pr-4 whitespace-nowrap">
                    {alert.industry === 'autoforge' ? 'AutoForge' : 'DairyFlow'}
                  </td>
                  <td className="py-2.5 pr-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {alert.category}
                  </td>
                  <td className="py-2.5 pr-4 max-w-md truncate font-medium text-slate-900 dark:text-slate-100">
                    {alert.title}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-slate-500 whitespace-nowrap">
                    {alert.timestamp}
                  </td>
                  <td className="py-2.5 whitespace-nowrap">
                    <StatusLabel status={alert.severity} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </div>
  );
};
