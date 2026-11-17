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
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calcDelayPercentage,
  calcMachineUtilization,
  calcProcessingDelay,
  calcProductionEfficiency,
  formatNumber,
  formatPercent,
} from '../utils/calculations';
import { SectionPanel, SimulatedBanner, StatusLabel } from '../components/common/UiPrimitives';
import { ActiveIndustry } from '../types/indusmind';

export const BottleneckAnalysisPage: React.FC = () => {
  const { stages, industryScope } = useApp();
  const [industry, setIndustry] = useState<ActiveIndustry>(
    industryScope === 'dairyflow' ? 'dairyflow' : 'autoforge'
  );

  const indStages = stages.filter((s) => s.industry === industry);
  const rankedStages = [...indStages].sort(
    (a, b) =>
      calcDelayPercentage(b.actualTimeMin, b.expectedTimeMin) -
      calcDelayPercentage(a.actualTimeMin, a.expectedTimeMin)
  );
  const primaryBottleneck = rankedStages[0];

  const finalStage = indStages[indStages.length - 1];
  const bottleneckCapacity = primaryBottleneck?.productionCapacity ?? 0;
  const downstreamDeficit = primaryBottleneck
    ? Math.max(0, primaryBottleneck.plannedOutput - (finalStage?.unitsProcessed ?? 0))
    : 0;

  const chartData = indStages.map((s) => ({
    stage: s.name.replace(' Supply', '').replace('Raw Milk ', ''),
    DelayPct: Number(calcDelayPercentage(s.actualTimeMin, s.expectedTimeMin).toFixed(1)),
    WaitTimeMin: s.waitingTimeMin,
  }));

  return (
    <div className="space-y-6">
      <SimulatedBanner label="Bottleneck Intelligence Engine · Formulas strictly prevent double-counting queue wait, delay, and downtime" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Bottleneck Detection & Constraint Analysis
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pinpoints throughput constraints, WIP queue accumulation, and corrective capacity actions
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
          <button
            onClick={() => setIndustry('autoforge')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium ${
              industry === 'autoforge'
                ? 'bg-[#0A1628] text-white dark:bg-blue-600'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            AutoForge Constraints
          </button>
          <button
            onClick={() => setIndustry('dairyflow')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium ${
              industry === 'dairyflow'
                ? 'bg-emerald-700 text-white dark:bg-emerald-600'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            DairyFlow Constraints
          </button>
        </div>
      </div>

      {/* Primary Bottleneck Diagnostic Card */}
      {primaryBottleneck && (
        <div className="p-6 rounded-xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>ACTIVE PRIMARY BOTTLENECK · {industry === 'autoforge' ? 'AUTOFORGE' : 'DAIRYFLOW'}</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
              Stage {primaryBottleneck.orderIndex}: {primaryBottleneck.name}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Root Cause:</strong> {primaryBottleneck.bottleneckReason}
            </p>
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                Recommended Engineering Improvement
              </div>
              <p className="text-slate-600 dark:text-slate-300">{primaryBottleneck.recommendedAction}</p>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500">Queue Length (WIP)</div>
              <div className="text-xl font-mono font-semibold mt-1">
                {formatNumber(primaryBottleneck.queueLength)}{' '}
                <span className="text-xs font-normal text-slate-500">
                  {industry === 'autoforge' ? 'units' : 'L'}
                </span>
              </div>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500">Avg Waiting Time</div>
              <div className="text-xl font-mono font-semibold mt-1">
                {primaryBottleneck.waitingTimeMin} min
              </div>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500">Stage Machine Util</div>
              <div className="text-xl font-mono font-semibold mt-1">
                {formatPercent(
                  calcMachineUtilization(
                    primaryBottleneck.actualOperatingMin,
                    primaryBottleneck.availableOperatingMin
                  )
                )}
              </div>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="text-slate-500">Est. Production Impact</div>
              <div className="text-xl font-mono font-semibold text-rose-700 dark:text-rose-400 mt-1">
                -{formatNumber(downstreamDeficit)} {industry === 'autoforge' ? 'units' : 'L'}
              </div>
              <div className="text-[11px] text-slate-500">Cap: {formatNumber(bottleneckCapacity)}/shift</div>
            </div>
          </div>
        </div>
      )}

      {/* Stage-Wise Flow Strip */}
      <SectionPanel
        title="Stage-Wise Constraint Propagation Diagram"
        subtitle="Visualizing how upstream delays accumulate WIP queue into the constraint stage"
      >
        <div className="flex flex-col lg:flex-row items-stretch gap-2">
          {indStages.map((s, idx) => {
            const delayPct = calcDelayPercentage(s.actualTimeMin, s.expectedTimeMin);
            return (
              <React.Fragment key={s.id}>
                <div
                  className={`flex-1 p-3 rounded-lg border text-xs ${
                    s.status === 'Bottleneck'
                      ? 'border-rose-400 dark:border-rose-700 bg-rose-50/70 dark:bg-rose-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50'
                  }`}
                >
                  <div className="font-semibold text-slate-900 dark:text-white truncate">{s.name}</div>
                  <div className="mt-1">
                    <StatusLabel status={s.status} />
                  </div>
                  <div className="mt-2 font-mono text-[11px] space-y-0.5 text-slate-600 dark:text-slate-300">
                    <div>Delay: {formatPercent(delayPct)}</div>
                    <div>Queue: {formatNumber(s.queueLength)}</div>
                    <div>Eff: {formatPercent(calcProductionEfficiency(s.unitsProcessed, s.plannedOutput))}</div>
                  </div>
                </div>
                {idx < indStages.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center text-slate-400">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </SectionPanel>

      {/* Delay % & Waiting Time Chart + Formula Reference */}
      <div className="grid lg:grid-cols-12 gap-6">
        <SectionPanel
          title="Delay Percentage & Queue Wait Time by Stage"
          subtitle="Clear separation of cycle delay % vs upstream waiting time (minutes)"
          className="lg:col-span-8"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} stroke="#64748b" />
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
                <Bar dataKey="DelayPct" name="Delay (%)" fill="#dc2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="WaitTimeMin" name="Wait Time (min)" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionPanel>

        <SectionPanel
          title="Stage Bottleneck Ranking"
          subtitle="Ranked by Delay Percentage"
          className="lg:col-span-4"
        >
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {rankedStages.slice(0, 5).map((s) => (
              <div key={s.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-[11px] font-mono text-slate-500">
                    +{calcProcessingDelay(s.actualTimeMin, s.expectedTimeMin)}m delay · Queue {formatNumber(s.queueLength)}
                  </div>
                </div>
                <span className="font-mono font-semibold text-rose-700 dark:text-rose-400">
                  {formatPercent(calcDelayPercentage(s.actualTimeMin, s.expectedTimeMin))}
                </span>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>
    </div>
  );
};
