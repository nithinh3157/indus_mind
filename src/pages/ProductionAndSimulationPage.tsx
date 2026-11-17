import React, { useMemo, useState } from 'react';
import { ArrowRight, Play, RotateCcw, Sliders } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calcDelayPercentage,
  calcMachineUtilization,
  calcProcessingDelay,
  calcProductionEfficiency,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../utils/calculations';
import { SectionPanel, SimulatedBanner, StatusLabel } from '../components/common/UiPrimitives';
import { ActiveIndustry } from '../types/indusmind';

export const ProductionAndSimulationPage: React.FC = () => {
  const { stages, machines, industryScope } = useApp();

  const defaultTab: ActiveIndustry =
    industryScope === 'dairyflow' ? 'dairyflow' : 'autoforge';
  const [selectedIndustry, setSelectedIndustry] = useState<ActiveIndustry>(defaultTab);

  // What-If Simulation Parameters
  const [paintingCapDeltaPct, setPaintingCapDeltaPct] = useState<number>(20);
  const [simulatedDowntimeHrs, setSimulatedDowntimeHrs] = useState<number>(0);
  const [packagingCapDeltaPct, setPackagingCapDeltaPct] = useState<number>(25);
  const [milkSupplyDeltaPct, setMilkSupplyDeltaPct] = useState<number>(0);

  const activeStages = stages.filter((s) => s.industry === selectedIndustry);
  const activeMachines = machines.filter((m) => m.industry === selectedIndustry);

  // Hypothetical What-If Computation (clearly labeled as hypothetical)
  const simulationResult = useMemo(() => {
    if (selectedIndustry === 'autoforge') {
      const paintingStage = activeStages.find((s) => s.name === 'Painting');
      const finalStage = activeStages[activeStages.length - 1];
      const baseOutput = finalStage?.unitsProcessed ?? 132;
      const baseQueue = paintingStage?.queueLength ?? 14;
      const baseCycleMin = activeStages.reduce((s, st) => s + st.actualTimeMin, 0);

      // Adjust capacity and downtime
      const capFactor = 1 + paintingCapDeltaPct / 100;
      const effectiveDowntimePenaltyUnits = Math.round(simulatedDowntimeHrs * 14);
      const paintAdjustedCap = Math.round((paintingStage?.productionCapacity ?? 145) * capFactor);
      const rawProjectedOutput = Math.min(
        160,
        Math.round(baseOutput * Math.min(1.22, capFactor * 0.96)) - effectiveDowntimePenaltyUnits
      );
      const projectedOutput = Math.max(0, rawProjectedOutput);
      const projectedQueue = Math.max(
        0,
        Math.round(baseQueue / capFactor + simulatedDowntimeHrs * 6)
      );
      const projectedCycleMin = Math.max(
        180,
        Math.round(baseCycleMin - (paintingCapDeltaPct > 0 ? paintingCapDeltaPct * 0.35 : paintingCapDeltaPct * 0.5) + simulatedDowntimeHrs * 18)
      );
      const deltaUnits = projectedOutput - baseOutput;
      const estRevenueImpact = deltaUnits * 1245000;

      return {
        baselineOutput: `${baseOutput} vehicles`,
        projectedOutput: `${projectedOutput} vehicles`,
        deltaLabel: `${deltaUnits >= 0 ? '+' : ''}${deltaUnits} vehicles`,
        baselineCycle: `${baseCycleMin} min`,
        projectedCycle: `${projectedCycleMin} min`,
        baselineQueue: `${baseQueue} chassis`,
        projectedQueue: `${projectedQueue} chassis`,
        capacityNote: `Painting Capacity: ${paintAdjustedCap} units/shift`,
        estFinancialImpact: estRevenueImpact,
      };
    } else {
      const pkgStage = activeStages.find((s) => s.name === 'Packaging');
      const finalStage = activeStages[activeStages.length - 1];
      const baseOutput = finalStage?.unitsProcessed ?? 41950;
      const baseQueue = pkgStage?.queueLength ?? 4200;
      const baseCycleMin = activeStages.reduce((s, st) => s + st.actualTimeMin, 0);

      const pkgFactor = 1 + packagingCapDeltaPct / 100;
      const supplyFactor = 1 + milkSupplyDeltaPct / 100;
      const downtimePenaltyLitres = Math.round(simulatedDowntimeHrs * 3600);

      const supplyCappedMax = Math.round(48500 * supplyFactor);
      const pkgAdjustedCap = Math.round((pkgStage?.productionCapacity ?? 44000) * pkgFactor);
      const projectedOutput = Math.max(
        0,
        Math.min(supplyCappedMax, Math.round(baseOutput * Math.min(1.16, pkgFactor * 0.94))) -
          downtimePenaltyLitres
      );
      const projectedQueue = Math.max(
        0,
        Math.round((baseQueue * supplyFactor) / pkgFactor + simulatedDowntimeHrs * 1800)
      );
      const projectedCycleMin = Math.max(
        105,
        Math.round(baseCycleMin - packagingCapDeltaPct * 0.2 + simulatedDowntimeHrs * 14)
      );
      const deltaLitres = projectedOutput - baseOutput;
      const estRevenueImpact = deltaLitres * 64;

      return {
        baselineOutput: `${formatNumber(baseOutput)} L eq.`,
        projectedOutput: `${formatNumber(projectedOutput)} L eq.`,
        deltaLabel: `${deltaLitres >= 0 ? '+' : ''}${formatNumber(deltaLitres)} L eq.`,
        baselineCycle: `${baseCycleMin} min`,
        projectedCycle: `${projectedCycleMin} min`,
        baselineQueue: `${formatNumber(baseQueue)} L`,
        projectedQueue: `${formatNumber(projectedQueue)} L`,
        capacityNote: `Packaging Cap: ${formatNumber(pkgAdjustedCap)} L/shift`,
        estFinancialImpact: estRevenueImpact,
      };
    }
  }, [
    selectedIndustry,
    activeStages,
    paintingCapDeltaPct,
    simulatedDowntimeHrs,
    packagingCapDeltaPct,
    milkSupplyDeltaPct,
  ]);

  const resetSim = () => {
    setPaintingCapDeltaPct(20);
    setSimulatedDowntimeHrs(0);
    setPackagingCapDeltaPct(25);
    setMilkSupplyDeltaPct(0);
  };

  return (
    <div className="space-y-6">
      <SimulatedBanner label="Digital Factory Flow & Stage Telemetry · What-If projections are hypothetical scenario estimates" />

      {/* Industry Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Production Monitoring & Digital Factory Flow
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Stage-by-stage WIP accumulation, cycle delays, and interactive capacity what-if simulation
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
          <button
            onClick={() => setSelectedIndustry('autoforge')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selectedIndustry === 'autoforge'
                ? 'bg-[#0A1628] text-white dark:bg-blue-600'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            AutoForge Line (7 Stages)
          </button>
          <button
            onClick={() => setSelectedIndustry('dairyflow')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selectedIndustry === 'dairyflow'
                ? 'bg-emerald-700 text-white dark:bg-emerald-600'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            DairyFlow Line (7 Stages)
          </button>
        </div>
      </div>

      {/* Interactive Digital Factory Flow Diagram */}
      <SectionPanel
        title={
          selectedIndustry === 'autoforge'
            ? 'AutoForge Digital Process Pipeline'
            : 'DairyFlow Digital Cold-Chain Pipeline'
        }
        subtitle="Sequential stage status, WIP queue length, processing delay, and assigned machine health"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
          {activeStages.map((stage, idx) => {
            const delayMin = calcProcessingDelay(stage.actualTimeMin, stage.expectedTimeMin);
            const delayPct = calcDelayPercentage(stage.actualTimeMin, stage.expectedTimeMin);
            const stageMachine = activeMachines.find((m) => m.stageName === stage.name);
            const isBottleneck = stage.status === 'Bottleneck';

            return (
              <div key={stage.id} className="relative flex flex-col">
                <div
                  className={`flex-1 p-3.5 rounded-xl border transition-colors ${
                    isBottleneck
                      ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20'
                      : stage.status === 'Delayed'
                      ? 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 font-mono mb-1">
                    <span>STAGE {stage.orderIndex}</span>
                    {idx < activeStages.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 hidden xl:inline text-slate-400" />
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white leading-snug min-h-[2.25rem]">
                    {stage.name}
                  </div>
                  <div className="mt-2">
                    <StatusLabel status={stage.status} />
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 space-y-1 text-[11px] font-mono tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cycle:</span>
                      <span>
                        {stage.actualTimeMin}m / {stage.expectedTimeMin}m
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Delay:</span>
                      <span className={delayPct > 15 ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}>
                        +{delayMin}m ({formatPercent(delayPct)})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Queue:</span>
                      <span>{formatNumber(stage.queueLength)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Down:</span>
                      <span>{stage.machineDowntimeMin}m</span>
                    </div>
                  </div>
                  {stageMachine && (
                    <div className="mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-800 text-[10px] text-slate-500 truncate">
                      {stageMachine.id} · Util{' '}
                      <span className="font-mono">
                        {formatPercent(
                          calcMachineUtilization(
                            stageMachine.actualOperatingMin,
                            stageMachine.availableOperatingMin
                          )
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SectionPanel>

      {/* What-If Simulation Workbench */}
      <SectionPanel
        title="What-If Capacity & Disruption Simulator (Hypothetical Simulation)"
        subtitle="Adjust stage capacity, machine downtime, or raw milk supply to estimate throughput, queue, and revenue impact"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400">
              HYPOTHETICAL SIMULATION
            </span>
            <button
              onClick={resetSim}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        }
      >
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-5">
            {selectedIndustry === 'autoforge' ? (
              <>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span>Painting Booth Capacity Adjustment</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      {paintingCapDeltaPct >= 0 ? '+' : ''}
                      {paintingCapDeltaPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-30}
                    max={50}
                    step={5}
                    value={paintingCapDeltaPct}
                    onChange={(e) => setPaintingCapDeltaPct(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>-30% Restriction</span>
                    <span>Baseline (0%)</span>
                    <span>+50% Expansion</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span>Dairy Packaging Line Capacity Adjustment</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">
                      {packagingCapDeltaPct >= 0 ? '+' : ''}
                      {packagingCapDeltaPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-30}
                    max={50}
                    step={5}
                    value={packagingCapDeltaPct}
                    onChange={(e) => setPackagingCapDeltaPct(Number(e.target.value))}
                    className="w-full accent-emerald-700"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span>Raw Milk Supply Variation</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">
                      {milkSupplyDeltaPct >= 0 ? '+' : ''}
                      {milkSupplyDeltaPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-40}
                    max={25}
                    step={5}
                    value={milkSupplyDeltaPct}
                    onChange={(e) => setMilkSupplyDeltaPct(Number(e.target.value))}
                    className="w-full accent-emerald-700"
                  />
                </div>
              </>
            )}

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span>Simulated Unplanned Machine Downtime</span>
                <span className="font-mono text-rose-600 dark:text-rose-400">
                  {simulatedDowntimeHrs} hrs
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={4}
                step={0.5}
                value={simulatedDowntimeHrs}
                onChange={(e) => setSimulatedDowntimeHrs(Number(e.target.value))}
                className="w-full accent-rose-600"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>0 hrs (No extra fault)</span>
                <span>2 hrs</span>
                <span>4 hrs Severe Outage</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {selectedIndustry === 'autoforge' ? (
                <>
                  <button
                    onClick={() => {
                      setPaintingCapDeltaPct(20);
                      setSimulatedDowntimeHrs(0);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Play className="w-3 h-3" />
                    <span>+20% Painting Cap</span>
                  </button>
                  <button
                    onClick={() => {
                      setPaintingCapDeltaPct(0);
                      setSimulatedDowntimeHrs(2);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>2h Booth Downtime</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setPackagingCapDeltaPct(25);
                      setMilkSupplyDeltaPct(0);
                      setSimulatedDowntimeHrs(0);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Play className="w-3 h-3" />
                    <span>+25% Packaging Cap</span>
                  </button>
                  <button
                    onClick={() => {
                      setPackagingCapDeltaPct(0);
                      setMilkSupplyDeltaPct(-20);
                      setSimulatedDowntimeHrs(0);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>-20% Raw Milk Supply</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
              <div className="text-xs text-slate-500">Projected Shift Output</div>
              <div className="text-2xl font-display font-semibold font-mono tabular-nums mt-1">
                {simulationResult.projectedOutput}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Baseline: <span className="font-mono">{simulationResult.baselineOutput}</span> · Delta:{' '}
                <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {simulationResult.deltaLabel}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
              <div className="text-xs text-slate-500">Projected Bottleneck Queue (WIP)</div>
              <div className="text-2xl font-display font-semibold font-mono tabular-nums mt-1">
                {simulationResult.projectedQueue}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Baseline: <span className="font-mono">{simulationResult.baselineQueue}</span> · {simulationResult.capacityNote}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
              <div className="text-xs text-slate-500">Estimated Total Cycle Time</div>
              <div className="text-2xl font-display font-semibold font-mono tabular-nums mt-1">
                {simulationResult.projectedCycle}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Baseline: <span className="font-mono">{simulationResult.baselineCycle}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
              <div className="text-xs text-slate-500">Hypothetical Revenue Impact</div>
              <div
                className={`text-2xl font-display font-semibold font-mono tabular-nums mt-1 ${
                  simulationResult.estFinancialImpact >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {simulationResult.estFinancialImpact >= 0 ? '+' : ''}
                {formatCurrency(simulationResult.estFinancialImpact)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Hypothetical scenario calculation · Not real telemetry
              </div>
            </div>
          </div>
        </div>
      </SectionPanel>

      {/* Complete Stage Telemetry Table */}
      <SectionPanel
        title="Calculated Stage Telemetry & Capacity Metrics"
        subtitle="Processing Delay = Actual − Expected · Efficiency = Actual Output / Planned Output × 100"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-2 pr-3 font-medium">Stage</th>
                <th className="py-2 pr-3 font-medium text-right">Expected</th>
                <th className="py-2 pr-3 font-medium text-right">Actual</th>
                <th className="py-2 pr-3 font-medium text-right">Delay %</th>
                <th className="py-2 pr-3 font-medium text-right">Wait Time</th>
                <th className="py-2 pr-3 font-medium text-right">Downtime</th>
                <th className="py-2 pr-3 font-medium text-right">Throughput / Cap</th>
                <th className="py-2 pr-3 font-medium text-right">Efficiency</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeStages.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 pr-3 font-medium">{s.orderIndex}. {s.name}</td>
                  <td className="py-2.5 pr-3 text-right font-mono">{s.expectedTimeMin}m</td>
                  <td className="py-2.5 pr-3 text-right font-mono">{s.actualTimeMin}m</td>
                  <td className="py-2.5 pr-3 text-right font-mono">
                    {formatPercent(calcDelayPercentage(s.actualTimeMin, s.expectedTimeMin))}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono">{s.waitingTimeMin}m</td>
                  <td className="py-2.5 pr-3 text-right font-mono">{s.machineDowntimeMin}m</td>
                  <td className="py-2.5 pr-3 text-right font-mono">
                    {formatNumber(s.unitsProcessed)} / {formatNumber(s.productionCapacity)}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono">
                    {formatPercent(calcProductionEfficiency(s.unitsProcessed, s.plannedOutput))}
                  </td>
                  <td className="py-2.5">
                    <StatusLabel status={s.status} />
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
