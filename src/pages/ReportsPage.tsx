import React, { useMemo, useState } from 'react';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calcDelayPercentage,
  calcMachineUtilization,
  calcProcessingDelay,
  calcQualityAcceptanceRate,
  computeFinancialSummary,
  computeNormalizedIndustryKPIs,
  exportRowsToCsv,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../utils/calculations';
import { SectionPanel, SimulatedBanner } from '../components/common/UiPrimitives';

type ReportType =
  | 'Production'
  | 'Machine Performance'
  | 'Delays'
  | 'Bottlenecks'
  | 'Quality'
  | 'Inventory'
  | 'Finance'
  | 'Dairy Temperature Verification'
  | 'Cross-Industry';

const REPORT_TYPES: ReportType[] = [
  'Production',
  'Machine Performance',
  'Delays',
  'Bottlenecks',
  'Quality',
  'Inventory',
  'Finance',
  'Dairy Temperature Verification',
  'Cross-Industry',
];

export const ReportsPage: React.FC = () => {
  const {
    stages,
    machines,
    qualityMetrics,
    inventory,
    financials,
    tempVerifications,
  } = useApp();

  const [selectedReport, setSelectedReport] = useState<ReportType>('Production');

  const reportPayload = useMemo(() => {
    switch (selectedReport) {
      case 'Production':
        return {
          headers: ['Industry', 'Stage', 'Units Processed', 'Planned Output', 'Capacity', 'Status'],
          rows: stages.map((s) => [
            s.industry === 'autoforge' ? 'AutoForge' : 'DairyFlow',
            s.name,
            s.unitsProcessed,
            s.plannedOutput,
            s.productionCapacity,
            s.status,
          ]),
        };
      case 'Machine Performance':
        return {
          headers: ['ID', 'Machine Name', 'Industry', 'Stage', 'Status', 'Utilization %', 'Downtime (min)', 'Risk Level'],
          rows: machines.map((m) => [
            m.id,
            m.name,
            m.industry === 'autoforge' ? 'AutoForge' : 'DairyFlow',
            m.stageName,
            m.operatingStatus,
            formatPercent(calcMachineUtilization(m.actualOperatingMin, m.availableOperatingMin)),
            m.downtimeMin,
            m.riskLevel,
          ]),
        };
      case 'Delays':
        return {
          headers: ['Industry', 'Stage', 'Expected (min)', 'Actual (min)', 'Delay (min)', 'Delay %', 'Wait Time (min)'],
          rows: stages.map((s) => [
            s.industry === 'autoforge' ? 'AutoForge' : 'DairyFlow',
            s.name,
            s.expectedTimeMin,
            s.actualTimeMin,
            calcProcessingDelay(s.actualTimeMin, s.expectedTimeMin),
            formatPercent(calcDelayPercentage(s.actualTimeMin, s.expectedTimeMin)),
            s.waitingTimeMin,
          ]),
        };
      case 'Bottlenecks':
        return {
          headers: ['Industry', 'Stage', 'Queue Length', 'Wait (min)', 'Delay %', 'Status', 'Recommended Action'],
          rows: stages
            .filter((s) => s.status === 'Bottleneck' || s.status === 'Delayed')
            .map((s) => [
              s.industry === 'autoforge' ? 'AutoForge' : 'DairyFlow',
              s.name,
              s.queueLength,
              s.waitingTimeMin,
              formatPercent(calcDelayPercentage(s.actualTimeMin, s.expectedTimeMin)),
              s.status,
              s.recommendedAction || 'Monitor queue flow',
            ]),
        };
      case 'Quality':
        return {
          headers: ['Industry', 'Stage', 'Inspected', 'Accepted', 'Defects', 'Rework', 'Rejected', 'Acceptance Rate'],
          rows: qualityMetrics.map((q) => [
            q.industry === 'autoforge' ? 'AutoForge' : 'DairyFlow',
            q.stage,
            q.inspectedUnits,
            q.acceptedUnits,
            q.defectCount,
            q.reworkCount,
            q.rejectedUnits,
            formatPercent(calcQualityAcceptanceRate(q.acceptedUnits, q.inspectedUnits)),
          ]),
        };
      case 'Inventory':
        return {
          headers: ['SKU', 'Material', 'Industry', 'Stock', 'Reorder Level', 'Unit', 'Daily Use', 'Status'],
          rows: inventory.map((i) => [
            i.sku,
            i.name,
            i.industry === 'autoforge' ? 'AutoForge' : 'DairyFlow',
            i.currentStock,
            i.reorderLevel,
            i.unit,
            i.dailyConsumption,
            i.status,
          ]),
        };
      case 'Finance': {
        return {
          headers: ['Date', 'Industry', 'Manufactured', 'Sold', 'Revenue (Est.)', 'Total Expenses (Est.)', 'Net Profit (Est.)'],
          rows: financials.map((f) => {
            const sum = computeFinancialSummary([f]);
            return [
              f.dateLabel,
              f.industry === 'autoforge' ? 'AutoForge' : 'DairyFlow',
              formatNumber(f.unitsManufactured),
              formatNumber(f.unitsSold),
              formatCurrency(sum.revenue),
              formatCurrency(sum.totalExpenses),
              formatCurrency(sum.netProfit),
            ];
          }),
        };
      }
      case 'Dairy Temperature Verification':
        return {
          headers: ['Audit ID', 'Batch', 'Stage', 'Equipment', 'Expert Temp', 'OCR Extracted', 'Status', 'Human Confirmed'],
          rows: tempVerifications.map((t) => [
            t.id,
            t.batchId,
            t.stage,
            t.equipment,
            `${t.enteredTemp}°${t.unit}`,
            t.extractedReadingC !== null ? `${t.extractedReadingC}°C` : 'Pending OCR',
            t.verificationStatus,
            t.humanConfirmed ? 'Yes' : 'No',
          ]),
        };
      case 'Cross-Industry': {
        const af = computeNormalizedIndustryKPIs(
          'autoforge',
          stages,
          machines,
          qualityMetrics,
          financials.filter((f) => f.industry === 'autoforge'),
          6,
          162
        );
        const df = computeNormalizedIndustryKPIs(
          'dairyflow',
          stages,
          machines,
          qualityMetrics,
          financials.filter((f) => f.industry === 'dairyflow'),
          1280,
          48500
        );
        return {
          headers: ['Normalized Metric', 'AutoForge', 'DairyFlow'],
          rows: [
            ['Production Efficiency', formatPercent(af.productionEfficiencyPercent), formatPercent(df.productionEfficiencyPercent)],
            ['Machine Utilization', formatPercent(af.machineUtilizationPercent), formatPercent(df.machineUtilizationPercent)],
            ['Downtime %', formatPercent(af.downtimePercent), formatPercent(df.downtimePercent)],
            ['Quality Acceptance Rate', formatPercent(af.qualityAcceptanceRatePercent), formatPercent(df.qualityAcceptanceRatePercent)],
            ['Waste Rate', formatPercent(af.wasteRatePercent), formatPercent(df.wasteRatePercent)],
            ['Average Delay %', formatPercent(af.avgDelayPercent), formatPercent(df.avgDelayPercent)],
            ['Net Profit Margin (Est.)', formatPercent(af.profitMarginPercent), formatPercent(df.profitMarginPercent)],
          ],
        };
      }
    }
  }, [selectedReport, stages, machines, qualityMetrics, inventory, financials, tempVerifications]);

  const handleDownloadCsv = () => {
    const slug = selectedReport.toLowerCase().replace(/\s+/g, '_');
    exportRowsToCsv(`indusmind_${slug}_report.csv`, reportPayload.headers, reportPayload.rows);
  };

  return (
    <div className="space-y-6">
      <SimulatedBanner label="INDUSMIND Export & Compliance Reporting · Simulated dataset preview with Excel CSV & Print/PDF export" />

      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Operational & Compliance Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Preview structured datasets and export to Excel-compatible CSV or formatted PDF printouts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 text-white text-xs font-medium"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Report Category Selector */}
      <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 no-print">
        {REPORT_TYPES.map((rt) => (
          <button
            key={rt}
            onClick={() => setSelectedReport(rt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedReport === rt
                ? 'bg-slate-900 text-white dark:bg-blue-600'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {rt}
          </button>
        ))}
      </div>

      <SectionPanel
        title={`INDUSMIND ${selectedReport} Report`}
        subtitle={`Generated from current application state · ${reportPayload.rows.length} rows · SIMULATED DATA`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                {reportPayload.headers.map((h) => (
                  <th key={h} className="py-2 pr-4 font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reportPayload.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2.5 pr-4 font-mono tabular-nums whitespace-nowrap">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </div>
  );
};
