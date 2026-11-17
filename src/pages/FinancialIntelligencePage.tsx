import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { computeFinancialSummary, formatCurrency, formatNumber, formatPercent } from '../utils/calculations';
import { KpiCard, SectionPanel, SimulatedBanner } from '../components/common/UiPrimitives';
import { ActiveIndustry } from '../types/indusmind';

export const FinancialIntelligencePage: React.FC = () => {
  const { financials, industryScope } = useApp();
  const [industry, setIndustry] = useState<'combined' | ActiveIndustry>(
    industryScope === 'autoforge' || industryScope === 'dairyflow' ? industryScope : 'combined'
  );
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const filtered = financials.filter((f) =>
    industry === 'combined' ? true : f.industry === industry
  );

  // Scale factor for simulated weekly/monthly projection views
  const scale = period === 'daily' ? 1 : period === 'weekly' ? 4 : 16;
  const summary = computeFinancialSummary(filtered);

  const afOnly = computeFinancialSummary(financials.filter((f) => f.industry === 'autoforge'));
  const dfOnly = computeFinancialSummary(financials.filter((f) => f.industry === 'dairyflow'));

  // Trend Data grouped by dateLabel
  const dateLabels = Array.from(new Set(filtered.map((f) => f.dateLabel)));
  const trendData = dateLabels.map((date, idx) => {
    const dayRecs = filtered.filter((f) => f.dateLabel === date);
    const daySum = computeFinancialSummary(dayRecs);
    return {
      label: period === 'daily' ? date : period === 'weekly' ? `Week ${idx + 1}` : `Month ${idx + 1}`,
      RevenueCr: Number(((daySum.revenue * scale) / 100000).toFixed(2)),
      ExpensesCr: Number(((daySum.totalExpenses * scale) / 100000).toFixed(2)),
      NetProfitCr: Number(((daySum.netProfit * scale) / 100000).toFixed(2)),
    };
  });

  // Section-wise expense breakdown
  const expenseSections = [
    {
      section: 'Raw Materials',
      amount: filtered.reduce((s, f) => s + f.rawMaterialCost, 0) * scale,
    },
    {
      section: industry === 'dairyflow' ? 'Milk Procurement & Culture' : 'Vehicle Components',
      amount: filtered.reduce((s, f) => s + f.componentOrProcurementCost, 0) * scale,
    },
    {
      section: 'Labour',
      amount: filtered.reduce((s, f) => s + f.labourCost, 0) * scale,
    },
    {
      section: industry === 'dairyflow' ? 'Packaging' : 'Paint & Finishing',
      amount: filtered.reduce((s, f) => s + f.packagingOrPaintCost, 0) * scale,
    },
    {
      section: 'Maintenance',
      amount: filtered.reduce((s, f) => s + f.maintenanceCost, 0) * scale,
    },
    {
      section: 'Electricity & Refrigeration',
      amount: filtered.reduce((s, f) => s + f.electricityCost + f.refrigerationCost, 0) * scale,
    },
    {
      section: 'Rework & Wastage',
      amount: filtered.reduce((s, f) => s + f.reworkAndWastageCost, 0) * scale,
    },
  ];

  // Non-double-counted Delay-Related Loss Breakdown
  const delayLosses = [
    {
      driver: 'Lost Production Contribution',
      amount: filtered.reduce((s, f) => s + f.delayLostContribution, 0) * scale,
      note: 'Unfulfilled margin from throughput blocked at bottlenecks.',
    },
    {
      driver: 'Additional Overtime Labour',
      amount: filtered.reduce((s, f) => s + f.delayExtraLabourCost, 0) * scale,
      note: 'Incremental shift extension required to clear queued WIP.',
    },
    {
      driver: 'Additional Idle / Holding Energy',
      amount: filtered.reduce((s, f) => s + f.delayExtraEnergyCost, 0) * scale,
      note: 'Standby curing oven & cold-vault hold power during line stops.',
    },
    {
      driver: 'Delayed Order Penalties',
      amount: filtered.reduce((s, f) => s + f.delayedOrderPenalty, 0) * scale,
      note: 'SLA dispatch variance estimates.',
    },
  ];

  return (
    <div className="space-y-6">
      <SimulatedBanner label="Simulated Financial Estimates · Products manufactured are tracked separately from products sold; delay losses avoid double counting" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Financial Intelligence & Delay Loss Attribution
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Estimated Revenue, COGS, Gross & Net Profit, and non-duplicated bottleneck delay loss analysis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
            {(['combined', 'autoforge', 'dairyflow'] as const).map((ind) => (
              <button
                key={ind}
                onClick={() => setIndustry(ind)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${
                  industry === ind
                    ? 'bg-slate-900 text-white dark:bg-blue-600'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {ind === 'combined' ? 'Combined' : ind === 'autoforge' ? 'AutoForge' : 'DairyFlow'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${
                  period === p
                    ? 'bg-slate-900 text-white dark:bg-blue-600'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Financial Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Estimated Revenue"
          value={formatCurrency(summary.revenue * scale)}
          subtitle={`Sold vs Manufactured tracked per division`}
          tone="positive"
        />
        <KpiCard
          title="Est. Manufacturing + Operating Exp."
          value={formatCurrency(summary.totalExpenses * scale)}
          subtitle={`COGS: ${formatCurrency(summary.cogs * scale)}`}
        />
        <KpiCard
          title="Est. Gross & Net Profit"
          value={formatCurrency(summary.netProfit * scale)}
          subtitle={`Gross Profit: ${formatCurrency(summary.grossProfit * scale)}`}
          trend={`${formatPercent(summary.profitMarginPercent)} net margin`}
          tone="positive"
        />
        <KpiCard
          title="Est. Delay-Related Economic Loss"
          value={formatCurrency(summary.totalDelayRelatedLoss * scale)}
          subtitle="Non-double-counted bottleneck impact"
          tone="critical"
        />
      </div>

      {/* Manufactured vs Sold Explicit Separation */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
          <div>
            <div className="text-slate-500">AutoForge (7-Day Simulated Ledger)</div>
            <div className="font-semibold text-sm mt-0.5">
              Manufactured: <span className="font-mono">{afOnly.unitsManufactured}</span> · Sold:{' '}
              <span className="font-mono">{afOnly.unitsSold}</span> · Rejected:{' '}
              <span className="font-mono text-rose-600">{afOnly.rejectedUnits}</span> vehicles
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-500">Est. Cost / Vehicle</div>
            <div className="font-mono font-semibold text-sm">
              {formatCurrency(afOnly.totalExpenses / Math.max(1, afOnly.unitsManufactured))}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
          <div>
            <div className="text-slate-500">DairyFlow (7-Day Simulated Ledger)</div>
            <div className="font-semibold text-sm mt-0.5">
              Manufactured: <span className="font-mono">{formatNumber(dfOnly.unitsManufactured)}</span> · Sold:{' '}
              <span className="font-mono">{formatNumber(dfOnly.unitsSold)}</span> · Rejected:{' '}
              <span className="font-mono text-rose-600">{formatNumber(dfOnly.rejectedUnits)}</span> L eq.
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-500">Est. Cost / Litre eq.</div>
            <div className="font-mono font-semibold text-sm">
              ₹{(dfOnly.totalExpenses / Math.max(1, dfOnly.unitsManufactured)).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue, Expense, Profit Trend & Expense Breakdown */}
      <div className="grid lg:grid-cols-12 gap-6">
        <SectionPanel
          title="Revenue, Expenses & Net Profit Trend (₹ Lakhs)"
          subtitle={`Simulated ${period} trajectory`}
          className="lg:col-span-7"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#64748b" />
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
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="RevenueCr" name="Revenue (₹L)" stroke="#2563eb" fill="#2563eb" fillOpacity={0.12} />
                <Area type="monotone" dataKey="ExpensesCr" name="Expenses (₹L)" stroke="#64748b" fill="#64748b" fillOpacity={0.12} />
                <Area type="monotone" dataKey="NetProfitCr" name="Net Profit (₹L)" stroke="#16a34a" fill="#16a34a" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionPanel>

        <SectionPanel
          title="Section-Wise Expenditure Breakdown"
          subtitle="Non-overlapping cost categories (Simulated Estimates)"
          className="lg:col-span-5"
        >
          <div className="space-y-3 text-xs">
            {expenseSections.map((sec) => {
              const share = (sec.amount / Math.max(1, summary.totalExpenses * scale)) * 100;
              return (
                <div key={sec.section} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{sec.section}</span>
                    <span className="font-mono">
                      {formatCurrency(sec.amount)} ({formatPercent(share)})
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 dark:bg-blue-500"
                      style={{ width: `${Math.min(100, Math.max(2, share))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionPanel>
      </div>

      {/* Delay-Related Financial Loss Attribution */}
      <SectionPanel
        title="Delay-Related Loss Attribution (Estimated)"
        subtitle="Separately attributes lost contribution, overtime labour, holding energy, and SLA penalties without double-counting direct rework"
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {delayLosses.map((dl) => (
            <div key={dl.driver} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-medium text-slate-600 dark:text-slate-400">{dl.driver}</div>
              <div className="text-xl font-mono font-semibold text-rose-700 dark:text-rose-400">
                {formatCurrency(dl.amount)}
              </div>
              <p className="text-[11px] text-slate-500">{dl.note}</p>
            </div>
          ))}
        </div>
      </SectionPanel>
    </div>
  );
};
