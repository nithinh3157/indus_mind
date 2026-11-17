export type IndustryScope = 'overview' | 'autoforge' | 'dairyflow' | 'cross-industry';

export type ActiveIndustry = 'autoforge' | 'dairyflow';

export type UserRole =
  | 'Plant Director'
  | 'AutoForge Operations Lead'
  | 'DairyFlow Quality Expert'
  | 'Maintenance Engineer'
  | 'Financial Analyst'
  | 'Systems Administrator';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedFactory: string;
  industryAccess: 'all' | 'autoforge' | 'dairyflow';
  status: 'Active' | 'Inactive';
  lastLogin: string;
}

export interface FactorySite {
  id: string;
  name: string;
  industry: ActiveIndustry;
  location: string;
  status: 'Operational' | 'Degraded' | 'Maintenance';
  shiftActive: string;
  activeOperators: number;
  dailyEnergyKwh: number;
}

export interface ManufacturingStage {
  id: string;
  industry: ActiveIndustry;
  orderIndex: number;
  name: string;
  expectedTimeMin: number;
  actualTimeMin: number;
  unitsProcessed: number;
  plannedOutput: number;
  productionCapacity: number; // units or litres per shift
  queueLength: number; // WIP waiting
  waitingTimeMin: number;
  machineDowntimeMin: number;
  availableOperatingMin: number;
  actualOperatingMin: number;
  energyKwh: number;
  status: 'Nominal' | 'Delayed' | 'Bottleneck' | 'Halted';
  bottleneckReason?: string;
  recommendedAction?: string;
}

export interface MachineRecord {
  id: string;
  name: string;
  industry: ActiveIndustry;
  factoryId: string;
  stageName: string;
  operatingStatus: 'Running' | 'Idle' | 'Warning' | 'Down';
  availableOperatingMin: number;
  actualOperatingMin: number;
  downtimeMin: number;
  temperatureC: number;
  vibrationMmS: number;
  powerDrawKw: number;
  lastMaintenanceDate: string;
  nextScheduledDate: string;
  maintenanceHistory: string[];
  abnormalBehaviour: string | null;
  maintenanceWarning: string | null;
  riskScore: number; // 0-100 simulated risk index
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  recommendedMaintenanceAction: string;
}

export interface VehicleProductionOrder {
  id: string;
  chassisId: string;
  model: 'AF-Sedan X4' | 'AF-SUV Terra' | 'AF-EV Pulse' | 'AF-Cargo Pro';
  currentStage: string;
  status: 'Completed' | 'In Progress' | 'Delayed' | 'Quality Hold';
  scheduledDate: string;
  completedUnits: number;
  targetUnits: number;
  unitCost: number;
  sellingPrice: number;
  fulfilmentPercent: number;
}

export interface VehicleDefectInspection {
  id: string;
  chassisId: string;
  model: string;
  stage: 'Welding' | 'Painting' | 'Component Assembly' | 'Final Assembly' | 'Quality Inspection';
  inspectorName: string;
  timestamp: string;
  imageUrl: string;
  fileName: string;
  defectCategory: 'Surface Scratch' | 'Panel Dent' | 'Paint Swirl / Inconsistency' | 'Weld Seam Variance' | 'No Defect Found';
  severity: 'Minor' | 'Moderate' | 'Critical' | 'None';
  verificationStatus: 'Pending CV Model' | 'Manually Verified - Pass' | 'Manually Verified - Rework';
  notes: string;
}

export type DairyProductType = 'Milk' | 'Curd' | 'Butter' | 'Ghee' | 'Paneer';

export interface DairyBatch {
  batchId: string;
  productType: DairyProductType;
  rawMilkSource: string;
  volumeLitres: number;
  outputQuantityKgOrL: number;
  unitLabel: 'L' | 'kg';
  productionDate: string;
  expiryDate: string;
  currentStage: string;
  fatPercent: number;
  snfPercent: number;
  acidityPercent: number;
  pasteurizationTempC: number;
  packagingInfo: string;
  qualityStatus: 'Accepted' | 'Pending Verification' | 'Rejected';
  contaminationIncident: string | null;
  processingCostPerUnit: number;
  sellingPricePerUnit: number;
}

export interface DairyTemperatureReading {
  id: string;
  stage: string;
  equipment: string;
  batchId: string;
  temperatureC: number;
  minThresholdC: number;
  maxThresholdC: number;
  timestamp: string;
  durationMin: number;
  status: 'Within Limits' | 'Threshold Alert';
}

export type OcrVerificationStatus =
  | 'Verified'
  | 'Requires Review'
  | 'Mismatch Detected'
  | 'Unreadable Evidence';

export interface ExpertTemperatureVerificationRecord {
  id: string;
  stage: string;
  equipment: string;
  batchId: string;
  expertName: string;
  enteredTemp: number;
  unit: 'C' | 'F';
  enteredTempC: number;
  measuredAt: string;
  durationMin: number;
  measurementMethod: string;
  notes: string;
  imageUrl: string;
  imageFileName: string;
  ocrIntegrationState: 'Pending Tesseract OCR Backend' | 'Simulated Preview Comparison';
  extractedReadingC: number | null;
  ocrConfidencePercent: number | null;
  verificationStatus: OcrVerificationStatus;
  humanConfirmed: boolean;
  auditTrail: { timestamp: string; actor: string; action: string }[];
}

export interface ColdStorageUnit {
  id: string;
  name: string;
  storedBatches: string[];
  currentTempC: number;
  configuredMaxC: number;
  refrigerationStatus: 'Nominal' | 'High Load' | 'Threshold Warning';
  energyKwhToday: number;
  avgStorageHours: number;
  nearestExpiryDate: string;
}

export interface InventoryItem {
  id: string;
  industry: ActiveIndustry;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  dailyConsumption: number;
  wastageUnits: number;
  unitCost: number;
  status: 'Optimal' | 'Low Stock' | 'Critical Reorder';
}

export interface QualityStageMetric {
  industry: ActiveIndustry;
  stage: string;
  inspectedUnits: number;
  acceptedUnits: number;
  defectCount: number;
  reworkCount: number;
  rejectedUnits: number;
}

export interface FinancialPeriodRecord {
  dateLabel: string;
  periodType: 'daily' | 'weekly' | 'monthly';
  industry: ActiveIndustry;
  unitsManufactured: number;
  unitsSold: number;
  rejectedUnits: number;
  rawMaterialCost: number;
  componentOrProcurementCost: number;
  electricityCost: number;
  refrigerationCost: number;
  packagingOrPaintCost: number;
  labourCost: number;
  maintenanceCost: number;
  reworkAndWastageCost: number;
  delayLostContribution: number;
  delayExtraLabourCost: number;
  delayExtraEnergyCost: number;
  delayedOrderPenalty: number;
  revenue: number;
  cogs: number;
}

export interface AlertItem {
  id: string;
  industry: ActiveIndustry;
  category:
    | 'Machine Downtime'
    | 'Production Delay'
    | 'Bottleneck'
    | 'Low Inventory'
    | 'Quality Rejection'
    | 'Temperature Violation'
    | 'Pending Verification'
    | 'Maintenance Warning'
    | 'Abnormal Energy';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  sourceEntity: string;
  timestamp: string;
  status: 'Active' | 'Acknowledged' | 'Resolved';
}

export interface AnomalyDetectionRecord {
  id: string;
  industry: ActiveIndustry;
  metricType: 'Machine Reading' | 'Production Output' | 'Processing Time' | 'Energy Consumption' | 'Quality Value' | 'Temperature Reading';
  entityName: string;
  observedValue: string;
  expectedBaseline: string;
  deviationLabel: string;
  severity: 'High' | 'Medium' | 'Low';
  timestamp: string;
  explanation: string;
}

export interface ThresholdSettings {
  dairyPasteurizationMinC: number;
  dairyPasteurizationMaxC: number;
  dairyColdStorageMaxC: number;
  dairyTempMismatchToleranceC: number;
  autoforgeDelayWarningPercent: number;
  machineUtilizationWarningPercent: number;
  showSimulatedBadges: boolean;
}
