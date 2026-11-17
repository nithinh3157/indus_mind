import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, ClipboardCheck, Plus, Thermometer } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ASSET_IMAGES } from '../data/simulatedFactoryData';
import {
  calcDelayPercentage,
  calcProcessingDelay,
  calcProductionEfficiency,
  computeFinancialSummary,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../utils/calculations';
import {
  KpiCard,
  ResilientImage,
  SearchInput,
  SectionPanel,
  SimulatedBanner,
  StatusLabel,
} from '../components/common/UiPrimitives';
import { DairyBatch, DairyProductType } from '../types/indusmind';

export const DairyFlowDashboard: React.FC = () => {
  const {
    stages,
    dairyBatches,
    tempLogs,
    tempVerifications,
    coldStorage,
    inventory,
    financials,
    thresholds,
    addDairyBatch,
  } = useApp();
  const navigate = useNavigate();

  const [batchSearch, setBatchSearch] = useState('');
  const [productFilter, setProductFilter] = useState<string>('All');
  const [showBatchForm, setShowBatchForm] = useState(false);

  const [newProduct, setNewProduct] = useState<DairyProductType>('Milk');
  const [newSource, setNewSource] = useState('Anand Cooperative Route B');
  const [newVolume, setNewVolume] = useState(5000);
  const [newTemp, setNewTemp] = useState(72.5);

  const dfStages = stages.filter((s) => s.industry === 'dairyflow');
  const dfInventory = inventory.filter((i) => i.industry === 'dairyflow');
  const dfFinDaily = financials.filter((f) => f.industry === 'dairyflow' && f.periodType === 'daily');
  const latestDfFin = dfFinDaily[dfFinDaily.length - 1];
  const dfSummary = computeFinancialSummary(dfFinDaily);

  const totalRawMilkReceived = dairyBatches.reduce((s, b) => s + b.volumeLitres, 0);
  const acceptedBatches = dairyBatches.filter((b) => b.qualityStatus === 'Accepted');
  const rejectedBatches = dairyBatches.filter((b) => b.qualityStatus === 'Rejected');
  const rejectedVolume = rejectedBatches.reduce((s, b) => s + b.volumeLitres, 0);
  const pendingVerifs = tempVerifications.filter((v) => !v.humanConfirmed).length;

  const weeklyOutput = dfFinDaily.reduce((s, f) => s + f.unitsManufactured, 0);
  const monthlyEstimate = weeklyOutput * 4;

  const filteredBatches = dairyBatches.filter((b) => {
    const matchesProd = productFilter === 'All' || b.productType === productFilter;
    const matchesText =
      b.batchId.toLowerCase().includes(batchSearch.toLowerCase()) ||
      b.rawMilkSource.toLowerCase().includes(batchSearch.toLowerCase()) ||
      b.productType.toLowerCase().includes(batchSearch.toLowerCase());
    return matchesProd && matchesText;
  });

  const stageChartData = dfStages.map((s) => ({
    name: s.name.replace('Raw Milk ', '').replace('Processing and ', ''),
    Expected: s.expectedTimeMin,
    Actual: s.actualTimeMin,
  }));

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newVolume <= 0 || !newSource.trim()) return;
    const withinLimit =
      newTemp >= thresholds.dairyPasteurizationMinC &&
      newTemp <= thresholds.dairyPasteurizationMaxC;
    const newBatch: DairyBatch = {
      batchId: `DF-B-20261116-${String(dairyBatches.length + 1).padStart(2, '0')}`,
      productType: newProduct,
      rawMilkSource: newSource.trim(),
      volumeLitres: Number(newVolume),
      outputQuantityKgOrL:
        newProduct === 'Milk'
          ? Math.round(newVolume * 0.97)
          : newProduct === 'Curd'
          ? Math.round(newVolume * 0.94)
          : Math.round(newVolume * 0.22),
      unitLabel: newProduct === 'Milk' ? 'L' : 'kg',
      productionDate: '2026-11-16',
      expiryDate: '2026-11-22',
      currentStage: 'Pasteurization',
      fatPercent: newProduct === 'Ghee' ? 99.5 : 4.4,
      snfPercent: 8.8,
      acidityPercent: 0.14,
      pasteurizationTempC: Number(newTemp),
      packagingInfo: 'Standard Hygienic Pack',
      qualityStatus: withinLimit ? 'Pending Verification' : 'Rejected',
      contaminationIncident: withinLimit
        ? null
        : `Pasteurization temp ${newTemp}°C outside configured threshold (${thresholds.dairyPasteurizationMinC}–${thresholds.dairyPasteurizationMaxC}°C).`,
      processingCostPerUnit: 48,
      sellingPricePerUnit: 62,
    };
    addDairyBatch(newBatch);
    setShowBatchForm(false);
  };

  const topDfDelayStage = [...dfStages].sort(
    (a, b) =>
      calcDelayPercentage(b.actualTimeMin, b.expectedTimeMin) -
      calcDelayPercentage(a.actualTimeMin, a.expectedTimeMin)
  )[0];
  const topDfDelayPct = topDfDelayStage
    ? calcDelayPercentage(topDfDelayStage.actualTimeMin, topDfDelayStage.expectedTimeMin)
    : 0;
  const dfDelayTone =
    topDfDelayStage?.status === 'Bottleneck'
      ? 'critical'
      : topDfDelayStage?.status === 'Delayed'
      ? 'warning'
      : 'positive';

  return (
    <div className="space-y-6">
      <SimulatedBanner label="DairyFlow Dairy Processing Module · Sample Fat/SNF, batch, cold-chain & cost metrics are simulated" />

      {/* DairyFlow Hygienic Green, Cream & Soft Blue Intro Banner */}
      <div className="rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-900 grid lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col justify-between gap-4 bg-gradient-to-br from-[#FAFBF7] to-emerald-50/70 dark:from-slate-900 dark:to-emerald-950/30">
          <div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              DairyFlow Division · Anand Complex & Sahyadri Cold-Chain Plant
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-semibold text-slate-900 dark:text-white mt-1 text-balance">
              Hygienic Dairy Processing & Cold-Chain Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-xl leading-relaxed">
              7-stage continuous tracking for Milk, Curd, Butter, Ghee, and Paneer. Includes
              configurable thermal limits, cold-vault monitoring, and expert thermometer photo verification.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => navigate('/dairyflow/temperature-verification')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium transition-colors"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Expert Temperature Verification ({pendingVerifs} pending)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
              7-Day Output: {formatNumber(weeklyOutput)} L/kg · Est. Monthly: {formatNumber(monthlyEstimate)}
            </div>
          </div>
        </div>
        <div className="lg:col-span-5 relative min-h-[200px]">
          <ResilientImage
            src={ASSET_IMAGES.dairyflowBanner}
            alt="DairyFlow Stainless Steel Hygienic Pasteurization Facility"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Raw Milk Received Today"
          value={`${formatNumber(totalRawMilkReceived)} L`}
          subtitle={`Accepted Batches: ${acceptedBatches.length} · Rejected: ${rejectedBatches.length}`}
          trend={`${formatNumber(rejectedVolume)} L rejected`}
          tone={rejectedBatches.length > 0 ? 'warning' : 'positive'}
        />
        <KpiCard
          title="Active Bottleneck Stage"
          value={
            topDfDelayStage
              ? `${topDfDelayStage.name} (${formatPercent(topDfDelayPct)})`
              : 'All Nominal'
          }
          subtitle={
            topDfDelayStage
              ? `Queue: ${formatNumber(topDfDelayStage.queueLength)} L · Wait: ${topDfDelayStage.waitingTimeMin} min`
              : 'No active bottlenecks'
          }
          trend={
            topDfDelayStage?.status === 'Nominal'
              ? 'Nominal Flow'
              : `${topDfDelayStage?.id ?? 'Line'} Alert`
          }
          tone={dfDelayTone}
        />
        <KpiCard
          title="Configured Pasteurization Limits"
          value={`${thresholds.dairyPasteurizationMinC}–${thresholds.dairyPasteurizationMaxC}°C`}
          subtitle={`Cold Vault Ceiling: ${thresholds.dairyColdStorageMaxC}°C`}
          trend={`${pendingVerifs} awaiting verify`}
          tone="warning"
        />
        <KpiCard
          title="Cost Per Litre Eq. (Latest Est.)"
          value={`₹${((latestDfFin?.cogs ?? 0) / Math.max(1, latestDfFin?.unitsManufactured ?? 1)).toFixed(2)}`}
          subtitle={`7-Day Est. Net Profit: ${formatCurrency(dfSummary.netProfit)}`}
          trend={`${formatPercent(dfSummary.profitMarginPercent)} margin`}
          tone="positive"
        />
      </div>

      {/* Batch Tracking & Temperature Logs */}
      <SectionPanel
        title="Batch Traceability & Product Mix (Simulated)"
        subtitle="Milk, Curd, Butter, Ghee, and Paneer batch-wise quality parameters (Fat %, SNF %, Acidity)"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              {['All', 'Milk', 'Curd', 'Butter', 'Ghee', 'Paneer'].map((prod) => (
                <button
                  key={prod}
                  onClick={() => setProductFilter(prod)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    productFilter === prod
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {prod}
                </button>
              ))}
            </div>
            <SearchInput value={batchSearch} onChange={setBatchSearch} placeholder="Search batch ID or source..." />
            <button
              onClick={() => setShowBatchForm((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Batch</span>
            </button>
          </div>
        }
      >
        {showBatchForm && (
          <form
            onSubmit={handleAddBatch}
            className="mb-4 p-4 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-slate-800/40 grid sm:grid-cols-5 gap-3 items-end"
          >
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                Product
              </label>
              <select
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value as DairyProductType)}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="Milk">Milk</option>
                <option value="Curd">Curd</option>
                <option value="Butter">Butter</option>
                <option value="Ghee">Ghee</option>
                <option value="Paneer">Paneer</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                Raw Milk Source
              </label>
              <input
                type="text"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                Milk Volume (L)
              </label>
              <input
                type="number"
                min={100}
                value={newVolume}
                onChange={(e) => setNewVolume(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newTemp}
                  onChange={(e) => setNewTemp(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md bg-emerald-700 text-white text-xs font-medium"
              >
                Save
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2 pr-3 font-medium">Batch ID</th>
                <th className="py-2 pr-3 font-medium">Product</th>
                <th className="py-2 pr-3 font-medium">Raw Source</th>
                <th className="py-2 pr-3 font-medium text-right">Output</th>
                <th className="py-2 pr-3 font-medium text-right">Fat / SNF / Acid</th>
                <th className="py-2 pr-3 font-medium text-right">Past. Temp</th>
                <th className="py-2 pr-3 font-medium">Expiry</th>
                <th className="py-2 font-medium">Batch Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBatches.map((b) => (
                <tr key={b.batchId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 pr-3 font-mono font-medium whitespace-nowrap">{b.batchId}</td>
                  <td className="py-2.5 pr-3 font-medium whitespace-nowrap">{b.productType}</td>
                  <td className="py-2.5 pr-3 max-w-xs truncate text-slate-600 dark:text-slate-300">
                    {b.rawMilkSource}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono tabular-nums whitespace-nowrap">
                    {formatNumber(b.outputQuantityKgOrL)} {b.unitLabel}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono tabular-nums whitespace-nowrap">
                    {b.fatPercent}% / {b.snfPercent}% / {b.acidityPercent}%
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono tabular-nums whitespace-nowrap">
                    {b.pasteurizationTempC.toFixed(1)}°C
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-slate-500 whitespace-nowrap">{b.expiryDate}</td>
                  <td className="py-2.5 whitespace-nowrap">
                    <StatusLabel status={b.qualityStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>

      {/* Temperature Monitoring + 7-Stage Chart */}
      <div className="grid lg:grid-cols-12 gap-6">
        <SectionPanel
          title="Configurable Temperature Monitoring"
          subtitle="Monitored against user-configured operating limits (configurable in Settings)"
          className="lg:col-span-7"
          actions={
            <button
              onClick={() => navigate('/dairyflow/temperature-verification')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>Open Expert Photo Verification</span>
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-2 pr-3 font-medium">Equipment & Stage</th>
                  <th className="py-2 pr-3 font-medium">Batch</th>
                  <th className="py-2 pr-3 font-medium text-right">Reading</th>
                  <th className="py-2 pr-3 font-medium text-right">Configured Limits</th>
                  <th className="py-2 pr-3 font-medium text-right">Duration</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tempLogs.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 pr-3">
                      <div className="font-medium">{t.equipment}</div>
                      <div className="text-[11px] text-slate-500">{t.stage} · {t.timestamp}</div>
                    </td>
                    <td className="py-2.5 pr-3 font-mono whitespace-nowrap">{t.batchId}</td>
                    <td className="py-2.5 pr-3 text-right font-mono font-semibold">{t.temperatureC.toFixed(1)}°C</td>
                    <td className="py-2.5 pr-3 text-right font-mono text-slate-500">
                      {t.minThresholdC}–{t.maxThresholdC}°C
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono">{t.durationMin}m</td>
                    <td className="py-2.5 whitespace-nowrap">
                      <StatusLabel status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionPanel>

        <SectionPanel
          title="DairyFlow 7-Stage Cycle Time"
          subtitle="Expected vs actual stage duration (minutes)"
          className="lg:col-span-5"
        >
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" unit="m" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="Expected" fill="#64748b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Actual" fill="#15803d" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionPanel>
      </div>

      {/* Cold Storage, Inventory & Product Profitability */}
      <div className="grid lg:grid-cols-3 gap-6">
        <SectionPanel title="Cold Storage Vaults" subtitle="Temperature, refrigeration energy & expiry">
          <div className="space-y-3 text-xs">
            {coldStorage.map((cs) => (
              <div
                key={cs.id}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{cs.name}</span>
                  <StatusLabel status={cs.refrigerationStatus} />
                </div>
                <div className="font-mono text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>Temp: {cs.currentTempC}°C (Max {cs.configuredMaxC}°C)</span>
                  <span>{formatNumber(cs.energyKwhToday)} kWh</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Avg dwell: {cs.avgStorageHours}h · Nearest expiry: <span className="font-mono">{cs.nearestExpiryDate}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="Dairy Inventory & Packaging" subtitle="Raw milk buffer, film rolls & labels">
          <div className="space-y-2.5 text-xs">
            {dfInventory.map((inv) => (
              <div
                key={inv.id}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{inv.name}</div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {formatNumber(inv.currentStock)} {inv.unit} · Daily use {formatNumber(inv.dailyConsumption)}
                  </div>
                </div>
                <StatusLabel status={inv.status} />
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="Product-Wise Financial Estimates" subtitle="Cost vs selling price per L or kg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-1.5 pr-2 font-medium">Product</th>
                  <th className="py-1.5 pr-2 font-medium text-right">Cost</th>
                  <th className="py-1.5 pr-2 font-medium text-right">Price</th>
                  <th className="py-1.5 font-medium text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dairyBatches.map((b) => {
                  const margin = ((b.sellingPricePerUnit - b.processingCostPerUnit) / b.sellingPricePerUnit) * 100;
                  return (
                    <tr key={b.batchId}>
                      <td className="py-2 pr-2 font-medium">
                        {b.productType} <span className="text-[10px] text-slate-500">/{b.unitLabel}</span>
                      </td>
                      <td className="py-2 pr-2 text-right font-mono">₹{b.processingCostPerUnit}</td>
                      <td className="py-2 pr-2 text-right font-mono">₹{b.sellingPricePerUnit}</td>
                      <td className="py-2 text-right font-mono text-emerald-700 dark:text-emerald-400">
                        {formatPercent(margin)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>7-Day Bottleneck Delay Efficiency:</span>
            <span className="font-mono">
              {formatPercent(
                calcProductionEfficiency(
                  dfStages[dfStages.length - 1]?.unitsProcessed ?? 0,
                  dfStages[dfStages.length - 1]?.plannedOutput ?? 1
                )
              )}{' '}
              (Delay +{calcProcessingDelay(28, 20)}m Packaging / {formatPercent(calcDelayPercentage(28, 20))})
            </span>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
};
