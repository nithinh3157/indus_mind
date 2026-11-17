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
import { Camera, CheckCircle2, Info, Plus, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ASSET_IMAGES } from '../data/simulatedFactoryData';
import {
  calcDelayPercentage,
  calcMachineUtilization,
  calcProcessingDelay,
  calcProductionEfficiency,
  calcQualityAcceptanceRate,
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
import { VehicleDefectInspection, VehicleProductionOrder } from '../types/indusmind';

export const AutoForgeDashboard: React.FC = () => {
  const {
    stages,
    machines,
    vehicleOrders,
    vehicleDefects,
    qualityMetrics,
    inventory,
    financials,
    addVehicleOrder,
    addVehicleDefect,
    verifyVehicleDefect,
  } = useApp();

  const [orderSearch, setOrderSearch] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [newModel, setNewModel] = useState<VehicleProductionOrder['model']>('AF-EV Pulse');
  const [newChassis, setNewChassis] = useState('AF26-EV-01189');
  const [newTargetUnits, setNewTargetUnits] = useState(24);

  // Vehicle Defect Image Upload Workflow State
  const [defectChassis, setDefectChassis] = useState('AF26-TR-00325');
  const [defectModel, setDefectModel] = useState('AF-SUV Terra');
  const [defectStage, setDefectStage] = useState<VehicleDefectInspection['stage']>('Painting');
  const [defectCategory, setDefectCategory] =
    useState<VehicleDefectInspection['defectCategory']>('Paint Swirl / Inconsistency');
  const [defectSeverity, setDefectSeverity] = useState<VehicleDefectInspection['severity']>('Moderate');
  const [defectNotes, setDefectNotes] = useState('');
  const [uploadedPreview, setUploadedPreview] = useState<string>(ASSET_IMAGES.vehiclePanelSample);
  const [uploadedFileName, setUploadedFileName] = useState<string>('autoforge_panel_sample.jpg');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const afStages = stages.filter((s) => s.industry === 'autoforge');
  const afMachines = machines.filter((m) => m.industry === 'autoforge');
  const afQuality = qualityMetrics.filter((q) => q.industry === 'autoforge');
  const afInventory = inventory.filter((i) => i.industry === 'autoforge');
  const afFinDaily = financials.filter((f) => f.industry === 'autoforge' && f.periodType === 'daily');
  const latestAfFin = afFinDaily[afFinDaily.length - 1];
  const afSummary = computeFinancialSummary(afFinDaily);

  const totalCompletedToday = vehicleOrders.reduce((s, o) => s + o.completedUnits, 0);
  const totalTargetToday = vehicleOrders.reduce((s, o) => s + o.targetUnits, 0);
  const totalWeeklyVehicles = afFinDaily.reduce((s, f) => s + f.unitsManufactured, 0);
  const totalMonthlyEstimate = totalWeeklyVehicles * 4;

  const avgFulfilment =
    vehicleOrders.length > 0
      ? vehicleOrders.reduce((s, o) => s + o.fulfilmentPercent, 0) / vehicleOrders.length
      : 0;

  const totalInspected = afQuality.reduce((s, q) => s + q.inspectedUnits, 0);
  const totalAccepted = afQuality.reduce((s, q) => s + q.acceptedUnits, 0);
  const totalDefects = afQuality.reduce((s, q) => s + q.defectCount, 0);
  const totalRework = afQuality.reduce((s, q) => s + q.reworkCount, 0);
  const totalRejected = afQuality.reduce((s, q) => s + q.rejectedUnits, 0);

  const filteredOrders = vehicleOrders.filter(
    (o) =>
      o.chassisId.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.model.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.status.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const stageChartData = afStages.map((s) => ({
    name: s.name.replace(' Supply', '').replace(' Assembly', ' Asm.'),
    Expected: s.expectedTimeMin,
    Actual: s.actualTimeMin,
    Queue: s.queueLength,
  }));

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChassis.trim() || newTargetUnits <= 0) return;
    addVehicleOrder({
      id: `ORD-AF-${Math.floor(905 + Math.random() * 90)}`,
      chassisId: newChassis.trim().toUpperCase(),
      model: newModel,
      currentStage: 'Metal Stamping',
      status: 'In Progress',
      scheduledDate: '2026-11-16',
      completedUnits: 0,
      targetUnits: Number(newTargetUnits),
      unitCost: newModel === 'AF-EV Pulse' ? 1290000 : 950000,
      sellingPrice: newModel === 'AF-EV Pulse' ? 1640000 : 1220000,
      fulfilmentPercent: 0,
    });
    setShowOrderForm(false);
    setNewChassis(`AF26-EV-0${Math.floor(1200 + Math.random() * 800)}`);
  };

  const handleDefectFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload a valid PNG, JPG, or WEBP vehicle inspection photograph.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image exceeds 5 MB maximum upload size.');
      return;
    }
    setUploadError(null);
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setUploadedPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleLogDefectInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defectChassis.trim()) return;
    addVehicleDefect({
      id: `VDI-2026-${Math.floor(105 + Math.random() * 890)}`,
      chassisId: defectChassis.trim().toUpperCase(),
      model: defectModel,
      stage: defectStage,
      inspectorName: 'Vikramaditya Rao',
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      imageUrl: uploadedPreview,
      fileName: uploadedFileName,
      defectCategory,
      severity: defectCategory === 'No Defect Found' ? 'None' : defectSeverity,
      verificationStatus: 'Pending CV Model',
      notes:
        defectNotes.trim() ||
        'Logged via AutoForge inspection workbench. Awaiting human QC sign-off / future CV model pipeline.',
    });
    setDefectNotes('');
  };

  const modelProfitability = vehicleOrders.map((v) => ({
    model: v.model,
    unitCost: v.unitCost,
    sellingPrice: v.sellingPrice,
    unitMargin: v.sellingPrice - v.unitCost,
    marginPct: ((v.sellingPrice - v.unitCost) / v.sellingPrice) * 100,
  }));

  const topAfDelayStage = [...afStages].sort(
    (a, b) =>
      calcDelayPercentage(b.actualTimeMin, b.expectedTimeMin) -
      calcDelayPercentage(a.actualTimeMin, a.expectedTimeMin)
  )[0];
  const topAfDelayPct = topAfDelayStage
    ? calcDelayPercentage(topAfDelayStage.actualTimeMin, topAfDelayStage.expectedTimeMin)
    : 0;
  const topAfMachine = afMachines.find((m) => m.stageName === topAfDelayStage?.name);
  const afDelayTone =
    topAfDelayStage?.status === 'Bottleneck'
      ? 'critical'
      : topAfDelayStage?.status === 'Delayed'
      ? 'warning'
      : 'positive';

  return (
    <div className="space-y-6">
      <SimulatedBanner label="AutoForge Automobile Manufacturing Module · Simulated chassis, stage, machine, and cost data" />

      {/* AutoForge Dark Navy & Electric Blue Module Header */}
      <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#0A1628] text-white grid lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col justify-between gap-4">
          <div>
            <div className="text-xs text-blue-400 font-medium">
              AutoForge Division · Pune Chakan Plant A & Chennai EV Wing B
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-semibold mt-1 text-balance">
              Automobile Assembly & Paint-Line Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
              7-stage discrete manufacturing telemetry from steel stamping to final optical metrology.{' '}
              {topAfDelayStage && topAfDelayStage.status !== 'Nominal'
                ? `${topAfDelayStage.name} (${topAfMachine?.id ?? topAfDelayStage.id}) is currently flagged ${topAfDelayStage.status} at +${formatPercent(topAfDelayPct)} delay.`
                : 'All 7 AutoForge stages are currently operating within nominal cycle limits.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-300 font-mono">
            <div>Today: {totalCompletedToday} / {totalTargetToday} vehicles</div>
            <div>7-Day: {formatNumber(totalWeeklyVehicles)} units</div>
            <div>Est. Monthly Run-Rate: {formatNumber(totalMonthlyEstimate)} units</div>
          </div>
        </div>
        <div className="lg:col-span-5 relative min-h-[200px]">
          <ResilientImage
            src={ASSET_IMAGES.autoforgeBanner}
            alt="AutoForge Robotic Automobile Welding Line"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628] via-[#0A1628]/25 to-transparent" />
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Vehicles Completed Today"
          value={`${totalCompletedToday} units`}
          subtitle={`Pending: ${Math.max(0, totalTargetToday - totalCompletedToday)} · Fulfilment ${formatPercent(avgFulfilment)}`}
          trend={formatPercent((totalCompletedToday / Math.max(1, totalTargetToday)) * 100)}
          tone="warning"
        />
        <KpiCard
          title="Primary Stage Bottleneck"
          value={
            topAfDelayStage
              ? `${topAfDelayStage.name} (${formatPercent(topAfDelayPct)})`
              : 'All Nominal'
          }
          subtitle={
            topAfDelayStage
              ? `Queue: ${topAfDelayStage.queueLength} chassis · Wait: ${topAfDelayStage.waitingTimeMin} min`
              : 'No queued bottlenecks'
          }
          trend={
            topAfDelayStage?.status === 'Nominal'
              ? 'Nominal Flow'
              : `${topAfMachine?.id ?? topAfDelayStage?.id ?? 'Line'} Alert`
          }
          tone={afDelayTone}
        />
        <KpiCard
          title="Quality Acceptance & Rework"
          value={formatPercent(calcQualityAcceptanceRate(totalAccepted, totalInspected))}
          subtitle={`${totalDefects} defects · ${totalRework} rework · ${totalRejected} rejected`}
          trend={`Rej ${formatPercent((totalRejected / Math.max(1, totalInspected)) * 100)}`}
          tone="positive"
        />
        <KpiCard
          title="Cost Per Vehicle (Latest Est.)"
          value={formatCurrency((latestAfFin?.cogs ?? 0) / Math.max(1, latestAfFin?.unitsManufactured ?? 1))}
          subtitle={`7-Day Net Profit: ${formatCurrency(afSummary.netProfit)}`}
          trend={`${formatPercent(afSummary.profitMarginPercent)} margin`}
          tone="positive"
        />
      </div>

      {/* A. Vehicle Production Tracking + B. Stage Monitoring Chart */}
      <div className="grid lg:grid-cols-12 gap-6">
        <SectionPanel
          title="Vehicle Production Orders & Chassis Tracking"
          subtitle="Live order status, chassis identification, and target fulfilment"
          className="lg:col-span-7"
          actions={
            <div className="flex items-center gap-2">
              <SearchInput value={orderSearch} onChange={setOrderSearch} placeholder="Filter chassis or model..." />
              <button
                onClick={() => setShowOrderForm((p) => !p)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Order</span>
              </button>
            </div>
          }
        >
          {showOrderForm && (
            <form
              onSubmit={handleCreateOrder}
              className="mb-4 p-4 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-slate-800/50 grid sm:grid-cols-4 gap-3 items-end"
            >
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Vehicle Model
                </label>
                <select
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value as VehicleProductionOrder['model'])}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="AF-Sedan X4">AF-Sedan X4</option>
                  <option value="AF-SUV Terra">AF-SUV Terra</option>
                  <option value="AF-EV Pulse">AF-EV Pulse</option>
                  <option value="AF-Cargo Pro">AF-Cargo Pro</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Lead Chassis ID
                </label>
                <input
                  type="text"
                  value={newChassis}
                  onChange={(e) => setNewChassis(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Target Units
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={newTargetUnits}
                  onChange={(e) => setNewTargetUnits(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md bg-slate-900 dark:bg-blue-600 text-white text-xs font-medium"
              >
                Save Order
              </button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2 pr-3 font-medium">Chassis ID</th>
                  <th className="py-2 pr-3 font-medium">Model</th>
                  <th className="py-2 pr-3 font-medium">Stage</th>
                  <th className="py-2 pr-3 font-medium text-right">Done / Target</th>
                  <th className="py-2 pr-3 font-medium text-right">Fulfilment</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 pr-3 font-mono font-medium whitespace-nowrap">{o.chassisId}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">{o.model}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-slate-600 dark:text-slate-300">{o.currentStage}</td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums whitespace-nowrap">
                      {o.completedUnits} / {o.targetUnits}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums whitespace-nowrap">
                      {formatPercent(o.fulfilmentPercent)}
                    </td>
                    <td className="py-2.5 whitespace-nowrap">
                      <StatusLabel status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionPanel>

        <SectionPanel
          title="Stage Processing Time (Expected vs Actual)"
          subtitle="Minutes per vehicle across the 7 assembly stages"
          className="lg:col-span-5"
        >
          <div className="h-64">
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
                <Bar dataKey="Actual" fill="#2563eb" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionPanel>
      </div>

      {/* 7-Stage Detailed Monitoring Table */}
      <SectionPanel
        title="AutoForge 7-Stage Line Monitoring"
        subtitle="Expected vs actual cycle time, processing delay, queue accumulation, and stage efficiency"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2 pr-3 font-medium">Stage</th>
                <th className="py-2 pr-3 font-medium text-right">Expected</th>
                <th className="py-2 pr-3 font-medium text-right">Actual</th>
                <th className="py-2 pr-3 font-medium text-right">Delay</th>
                <th className="py-2 pr-3 font-medium text-right">Units / Cap</th>
                <th className="py-2 pr-3 font-medium text-right">Queue (WIP)</th>
                <th className="py-2 pr-3 font-medium text-right">Wait Time</th>
                <th className="py-2 pr-3 font-medium text-right">Efficiency</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {afStages.map((s) => {
                const delay = calcProcessingDelay(s.actualTimeMin, s.expectedTimeMin);
                const delayPct = calcDelayPercentage(s.actualTimeMin, s.expectedTimeMin);
                const eff = calcProductionEfficiency(s.unitsProcessed, s.plannedOutput);
                return (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 pr-3 font-medium whitespace-nowrap">
                      {s.orderIndex}. {s.name}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{s.expectedTimeMin}m</td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{s.actualTimeMin}m</td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                      +{delay}m ({formatPercent(delayPct)})
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                      {s.unitsProcessed} / {s.productionCapacity}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{s.queueLength}</td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{s.waitingTimeMin}m</td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{formatPercent(eff)}</td>
                    <td className="py-2.5 whitespace-nowrap">
                      <StatusLabel status={s.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionPanel>

      {/* E. Vehicle Image Defect Detection Upload & Human Verification Workflow */}
      <SectionPanel
        title="Vehicle Surface Defect Image Inspection Workflow"
        subtitle="Upload panel photography for quality verification. Automated CV defect detection model integration is pending — manual inspector verification is required."
      >
        <div className="mb-4 p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Honest Model Notice:</strong> This workbench implements the upload, metadata capture, and human quality-verification audit flow. Automated computer-vision scratch/dent classification is not yet connected to a trained FastAPI OpenCV/PyTorch model.
          </span>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <form onSubmit={handleLogDefectInspection} className="lg:col-span-5 space-y-3">
            {uploadError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                {uploadError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Chassis ID
                </label>
                <input
                  type="text"
                  value={defectChassis}
                  onChange={(e) => setDefectChassis(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Model
                </label>
                <select
                  value={defectModel}
                  onChange={(e) => setDefectModel(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                >
                  <option>AF-SUV Terra</option>
                  <option>AF-Sedan X4</option>
                  <option>AF-EV Pulse</option>
                  <option>AF-Cargo Pro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Inspection Stage
                </label>
                <select
                  value={defectStage}
                  onChange={(e) => setDefectStage(e.target.value as VehicleDefectInspection['stage'])}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                >
                  <option>Welding</option>
                  <option>Painting</option>
                  <option>Component Assembly</option>
                  <option>Final Assembly</option>
                  <option>Quality Inspection</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Inspector Observation
                </label>
                <select
                  value={defectCategory}
                  onChange={(e) =>
                    setDefectCategory(e.target.value as VehicleDefectInspection['defectCategory'])
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                >
                  <option>Surface Scratch</option>
                  <option>Panel Dent</option>
                  <option>Paint Swirl / Inconsistency</option>
                  <option>Weld Seam Variance</option>
                  <option>No Defect Found</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                Vehicle Panel Image Upload
              </label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Photo</span>
                  <input type="file" accept="image/*" onChange={handleDefectFileChange} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedPreview(ASSET_IMAGES.vehiclePanelSample);
                    setUploadedFileName('autoforge_panel_sample.jpg');
                    setUploadError(null);
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Use Sample Panel Photo
                </button>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono truncate">{uploadedFileName}</div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                Inspector Notes
              </label>
              <textarea
                rows={2}
                value={defectNotes}
                onChange={(e) => setDefectNotes(e.target.value)}
                placeholder="Describe scratch location, clear-coat gloss variance, or weld mark..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Submit Evidence for Inspection</span>
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
                <ResilientImage
                  src={uploadedPreview}
                  alt="Uploaded Vehicle Panel Preview"
                  className="w-full h-44 object-cover"
                />
                <div className="px-3 py-2 text-[11px] text-slate-300 flex items-center justify-between">
                  <span className="truncate font-mono">{uploadedFileName}</span>
                  <span>Preview Ready</span>
                </div>
              </div>
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col justify-between text-xs">
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    Inspection Verification Queue
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Each uploaded photograph enters the audit log in <code className="font-mono">Pending CV Model</code> state until an inspector confirms Pass or Rework.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  Total Logs: {vehicleDefects.length} · Pending: {vehicleDefects.filter((d) => d.verificationStatus === 'Pending CV Model').length}
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
              {vehicleDefects.map((d) => (
                <div key={d.id} className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      <span className="font-mono">{d.chassisId}</span> · {d.stage} · {d.defectCategory}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-lg">
                      {d.notes}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusLabel status={d.verificationStatus} />
                    {d.verificationStatus === 'Pending CV Model' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => verifyVehicleDefect(d.id, 'Manually Verified - Pass')}
                          className="px-2 py-1 rounded border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] font-medium"
                        >
                          Pass
                        </button>
                        <button
                          onClick={() => verifyVehicleDefect(d.id, 'Manually Verified - Rework')}
                          className="px-2 py-1 rounded border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[11px] font-medium"
                        >
                          Rework
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionPanel>

      {/* Machine, Inventory & Model-Wise Financial Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SectionPanel title="AutoForge Machine Utilization & Alerts" subtitle="Real-time equipment status">
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {afMachines.map((m) => (
              <div key={m.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {m.name} <span className="font-mono text-slate-500">({m.id})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {m.stageName} · Util:{' '}
                    <span className="font-mono">
                      {formatPercent(calcMachineUtilization(m.actualOperatingMin, m.availableOperatingMin))}
                    </span>{' '}
                    · Downtime: <span className="font-mono">{m.downtimeMin}m</span>
                  </div>
                </div>
                <StatusLabel status={m.operatingStatus} />
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="Model-Wise Profitability & Critical Inventory" subtitle="Estimated unit economics (Simulated)">
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-1.5 pr-3 font-medium">Model</th>
                    <th className="py-1.5 pr-3 font-medium text-right">Unit Cost</th>
                    <th className="py-1.5 pr-3 font-medium text-right">Selling Price</th>
                    <th className="py-1.5 font-medium text-right">Est. Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {modelProfitability.map((mp) => (
                    <tr key={mp.model}>
                      <td className="py-2 pr-3 font-medium">{mp.model}</td>
                      <td className="py-2 pr-3 text-right font-mono">{formatCurrency(mp.unitCost)}</td>
                      <td className="py-2 pr-3 text-right font-mono">{formatCurrency(mp.sellingPrice)}</td>
                      <td className="py-2 text-right font-mono text-emerald-700 dark:text-emerald-400">
                        {formatPercent(mp.marginPct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                AutoForge Materials Status
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                {afInventory.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{inv.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {inv.currentStock} {inv.unit}
                      </div>
                    </div>
                    <StatusLabel status={inv.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
};
