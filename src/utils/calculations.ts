import {
  ActiveIndustry,
  FinancialPeriodRecord,
  MachineRecord,
  ManufacturingStage,
  QualityStageMetric,
} from '../types/indusmind';

/** Safe division guarding against zero or NaN denominators */
export function safeDiv(numerator: number, denominator: number, fallback = 0): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return fallback;
  }
  return numerator / denominator;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/**
 * Core Engineering Formulas specified by INDUSMIND:
 * Processing Delay = Actual Processing Time - Expected Processing Time
 */
export function calcProcessingDelay(actualTimeMin: number, expectedTimeMin: number): number {
  return Math.max(0, actualTimeMin - expectedTimeMin);
}

/**
 * Delay Percentage = Processing Delay / Expected Processing Time * 100
 */
export function calcDelayPercentage(actualTimeMin: number, expectedTimeMin: number): number {
  const delay = calcProcessingDelay(actualTimeMin, expectedTimeMin);
  return safeDiv(delay, expectedTimeMin) * 100;
}

/**
 * Machine Utilization = Actual Operating Time / Available Operating Time * 100
 */
export function calcMachineUtilization(actualOperatingMin: number, availableOperatingMin: number): number {
  return clamp(safeDiv(actualOperatingMin, availableOperatingMin) * 100, 0, 100);
}

/**
 * Downtime Percentage = Machine Downtime / Available Operating Time * 100
 */
export function calcDowntimePercentage(downtimeMin: number, availableOperatingMin: number): number {
  return clamp(safeDiv(downtimeMin, availableOperatingMin) * 100, 0, 100);
}

/**
 * Quality Acceptance Rate = Accepted Units / Inspected Units * 100
 */
export function calcQualityAcceptanceRate(acceptedUnits: number, inspectedUnits: number): number {
  return clamp(safeDiv(acceptedUnits, inspectedUnits) * 100, 0, 100);
}

/**
 * Waste Rate = Wasted Units / Total Input Units * 100
 */
export function calcWasteRate(wastedUnits: number, totalInputUnits: number): number {
  return clamp(safeDiv(wastedUnits, totalInputUnits) * 100, 0, 100);
}

/**
 * Production Efficiency = Actual Output / Planned Output * 100
 */
export function calcProductionEfficiency(actualOutput: number, plannedOutput: number): number {
  return clamp(safeDiv(actualOutput, plannedOutput) * 100, 0, 150);
}

/**
 * Financial Formulas:
 * Gross Profit = Revenue - COGS
 * Total Expenses = Operating & Manufacturing Expenses (non-duplicated)
 * Net Profit = Revenue - Total Expenses
 * Profit Margin = Net Profit / Revenue * 100
 */
export interface ComputedFinancialSummary {
  unitsManufactured: number;
  unitsSold: number;
  rejectedUnits: number;
  manufacturingExpenditure: number;
  operatingExpenses: number;
  totalExpenses: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  netProfit: number;
  profitMarginPercent: number;
  totalDelayRelatedLoss: number;
}

export function computeFinancialSummary(records: FinancialPeriodRecord[]): ComputedFinancialSummary {
  const acc = records.reduce(
    (sum, r) => {
      const mfgExp =
        r.rawMaterialCost +
        r.componentOrProcurementCost +
        r.electricityCost +
        r.refrigerationCost +
        r.packagingOrPaintCost +
        r.labourCost;
      const opExp = r.maintenanceCost + r.reworkAndWastageCost;
      // Delay losses are tracked separately as economic attribution without double-counting direct rework/energy already inside opExp/mfgExp
      const delayLoss =
        r.delayLostContribution +
        r.delayExtraLabourCost +
        r.delayExtraEnergyCost +
        r.delayedOrderPenalty;

      return {
        unitsManufactured: sum.unitsManufactured + r.unitsManufactured,
        unitsSold: sum.unitsSold + r.unitsSold,
        rejectedUnits: sum.rejectedUnits + r.rejectedUnits,
        manufacturingExpenditure: sum.manufacturingExpenditure + mfgExp,
        operatingExpenses: sum.operatingExpenses + opExp,
        revenue: sum.revenue + r.revenue,
        cogs: sum.cogs + r.cogs,
        totalDelayRelatedLoss: sum.totalDelayRelatedLoss + delayLoss,
      };
    },
    {
      unitsManufactured: 0,
      unitsSold: 0,
      rejectedUnits: 0,
      manufacturingExpenditure: 0,
      operatingExpenses: 0,
      revenue: 0,
      cogs: 0,
      totalDelayRelatedLoss: 0,
    }
  );

  const totalExpenses = acc.manufacturingExpenditure + acc.operatingExpenses;
  const grossProfit = acc.revenue - acc.cogs;
  const netProfit = acc.revenue - totalExpenses;
  const profitMarginPercent = safeDiv(netProfit, acc.revenue) * 100;

  return {
    ...acc,
    totalExpenses,
    grossProfit,
    netProfit,
    profitMarginPercent,
  };
}

export interface NormalizedIndustryKPIs {
  industry: ActiveIndustry;
  productionEfficiencyPercent: number;
  machineUtilizationPercent: number;
  downtimePercent: number;
  qualityAcceptanceRatePercent: number;
  wasteRatePercent: number;
  avgDelayPercent: number;
  energyPerOutputUnitKwh: number;
  maintenanceCostRatioPercent: number;
  costPerOutputUnit: number;
  profitMarginPercent: number;
}

export function computeNormalizedIndustryKPIs(
  industry: ActiveIndustry,
  stages: ManufacturingStage[],
  machines: MachineRecord[],
  qualityMetrics: QualityStageMetric[],
  financials: FinancialPeriodRecord[],
  totalWastedInputUnits: number,
  totalInputUnits: number
): NormalizedIndustryKPIs {
  const indStages = stages.filter((s) => s.industry === industry);
  const indMachines = machines.filter((m) => m.industry === industry);
  const indQuality = qualityMetrics.filter((q) => q.industry === industry);
  const indFinance = financials.filter((f) => f.industry === industry);

  // Average stage production efficiency (final stage actual vs planned)
  const finalStage = indStages[indStages.length - 1];
  const productionEfficiencyPercent = finalStage
    ? calcProductionEfficiency(finalStage.unitsProcessed, finalStage.plannedOutput)
    : 0;

  const totalActualOp = indMachines.reduce((s, m) => s + m.actualOperatingMin, 0);
  const totalAvailOp = indMachines.reduce((s, m) => s + m.availableOperatingMin, 0);
  const totalDowntime = indMachines.reduce((s, m) => s + m.downtimeMin, 0);

  const machineUtilizationPercent = calcMachineUtilization(totalActualOp, totalAvailOp);
  const downtimePercent = calcDowntimePercentage(totalDowntime, totalAvailOp);

  const totalInspected = indQuality.reduce((s, q) => s + q.inspectedUnits, 0);
  const totalAccepted = indQuality.reduce((s, q) => s + q.acceptedUnits, 0);
  const qualityAcceptanceRatePercent = calcQualityAcceptanceRate(totalAccepted, totalInspected);

  const wasteRatePercent = calcWasteRate(totalWastedInputUnits, totalInputUnits);

  const avgDelayPercent =
    indStages.length > 0
      ? indStages.reduce((s, st) => s + calcDelayPercentage(st.actualTimeMin, st.expectedTimeMin), 0) /
        indStages.length
      : 0;

  const totalEnergyKwh = indStages.reduce((s, st) => s + st.energyKwh, 0);
  const finSummary = computeFinancialSummary(indFinance);
  const outputBaseline = finalStage ? finalStage.unitsProcessed : 1;

  const energyPerOutputUnitKwh = safeDiv(totalEnergyKwh, outputBaseline);
  const totalMaint = indFinance.reduce((s, f) => s + f.maintenanceCost, 0);
  const maintenanceCostRatioPercent = safeDiv(totalMaint, finSummary.totalExpenses) * 100;
  const costPerOutputUnit = safeDiv(finSummary.totalExpenses, Math.max(1, finSummary.unitsManufactured));

  return {
    industry,
    productionEfficiencyPercent,
    machineUtilizationPercent,
    downtimePercent,
    qualityAcceptanceRatePercent,
    wasteRatePercent,
    avgDelayPercent,
    energyPerOutputUnitKwh,
    maintenanceCostRatioPercent,
    costPerOutputUnit,
    profitMarginPercent: finSummary.profitMarginPercent,
  };
}

export function formatCurrency(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 10_000_000) {
    return `${sign}₹${(abs / 10_000_000).toFixed(2)} Cr`;
  }
  if (abs >= 100_000) {
    return `${sign}₹${(abs / 100_000).toFixed(2)} L`;
  }
  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
}

export function formatNumber(val: number, decimals = 0): string {
  return val.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(val: number, decimals = 1): string {
  return `${val.toFixed(decimals)}%`;
}

export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

export function fahrenheitToCelsius(f: number): number {
  return ((f - 32) * 5) / 9;
}

export function exportRowsToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCell = (cell: string | number) => {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
