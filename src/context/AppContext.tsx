import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  INITIAL_ALERTS,
  INITIAL_ANOMALIES,
  INITIAL_COLD_STORAGE,
  INITIAL_DAIRY_BATCHES,
  INITIAL_DAIRY_TEMP_LOGS,
  INITIAL_FACTORIES,
  INITIAL_FINANCIAL_RECORDS,
  INITIAL_INVENTORY,
  INITIAL_MACHINES,
  INITIAL_QUALITY_METRICS,
  INITIAL_STAGES,
  INITIAL_TEMP_VERIFICATIONS,
  INITIAL_THRESHOLDS,
  INITIAL_USERS,
  INITIAL_VEHICLE_DEFECTS,
  INITIAL_VEHICLE_ORDERS,
} from '../data/simulatedFactoryData';
import {
  ActiveIndustry,
  AlertItem,
  AnomalyDetectionRecord,
  ColdStorageUnit,
  DairyBatch,
  DairyTemperatureReading,
  ExpertTemperatureVerificationRecord,
  FactorySite,
  FinancialPeriodRecord,
  IndustryScope,
  InventoryItem,
  MachineRecord,
  ManufacturingStage,
  QualityStageMetric,
  ThresholdSettings,
  UserAccount,
  VehicleDefectInspection,
  VehicleProductionOrder,
} from '../types/indusmind';
import { calcDelayPercentage } from '../utils/calculations';
import { alertSiren } from '../utils/alertSiren';

interface AppContextValue {
  // Session & Theme
  currentUser: UserAccount | null;
  login: (email: string, roleUser?: UserAccount) => void;
  logout: () => void;
  industryScope: IndustryScope;
  setIndustryScope: (scope: IndustryScope) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Live Telemetry Fluctuation & Siren Controls
  liveSimulationActive: boolean;
  toggleLiveSimulation: () => void;
  sirenEnabled: boolean;
  toggleSiren: () => void;
  sirenPlaying: boolean;
  silenceSiren: () => void;
  latestLiveAlert: AlertItem | null;
  lastVoiceAlertText: string | null;
  dismissLiveAlert: () => void;
  resolvedNotice: string | null;
  lastResolvedVoiceText: string | null;
  dismissResolvedNotice: () => void;
  lastTelemetryTick: string;
  triggerSimulatedDelaySpike: (targetIndustry?: ActiveIndustry, targetStageId?: string) => void;

  // Domain Data
  factories: FactorySite[];
  stages: ManufacturingStage[];
  machines: MachineRecord[];
  vehicleOrders: VehicleProductionOrder[];
  vehicleDefects: VehicleDefectInspection[];
  dairyBatches: DairyBatch[];
  tempLogs: DairyTemperatureReading[];
  tempVerifications: ExpertTemperatureVerificationRecord[];
  coldStorage: ColdStorageUnit[];
  inventory: InventoryItem[];
  qualityMetrics: QualityStageMetric[];
  financials: FinancialPeriodRecord[];
  alerts: AlertItem[];
  anomalies: AnomalyDetectionRecord[];
  users: UserAccount[];
  thresholds: ThresholdSettings;

  // Interactive Mutations
  addVehicleOrder: (order: VehicleProductionOrder) => void;
  addVehicleDefect: (defect: VehicleDefectInspection) => void;
  verifyVehicleDefect: (id: string, status: VehicleDefectInspection['verificationStatus']) => void;
  addDairyBatch: (batch: DairyBatch) => void;
  addTempVerification: (record: ExpertTemperatureVerificationRecord) => void;
  updateTempVerificationStatus: (
    id: string,
    status: ExpertTemperatureVerificationRecord['verificationStatus'],
    actorName: string,
    actionNote: string,
    extractedReadingC?: number | null,
    ocrConfidencePercent?: number | null,
    ocrMode?: ExpertTemperatureVerificationRecord['ocrIntegrationState']
  ) => void;
  restockInventoryItem: (id: string, addedQty: number) => void;
  updateAlertStatus: (id: string, status: AlertItem['status']) => void;
  logMachineMaintenance: (id: string, note: string) => void;
  addUserAccount: (user: UserAccount) => void;
  updateThresholds: (next: ThresholdSettings) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function formatNowTimestamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
}

const STAGE_ROTATION_PRIORITY = [
  'AF-STG-4', // Painting
  'DF-STG-6', // Packaging
  'AF-STG-2', // Metal Stamping
  'DF-STG-3', // Pasteurization
  'AF-STG-5', // Component Assembly
  'DF-STG-4', // Homogenization
  'AF-STG-6', // Final Assembly
  'DF-STG-5', // Processing and Storage
  'AF-STG-3', // Welding
  'DF-STG-2', // Filtration
  'AF-STG-7', // Quality Inspection (AutoForge)
  'DF-STG-7', // Quality Inspection (DairyFlow)
  'AF-STG-1', // Raw Material Supply
  'DF-STG-1', // Raw Milk Reception
];

function getStageDiagnosticCopy(stage: ManufacturingStage, delayMin: number): {
  reason: string;
  action: string;
} {
  const map: Record<string, { reason: string; action: string }> = {
    'AF-STG-1': {
      reason: `Sheet coil staging crane delay (+${delayMin}m) slowed raw steel feed into stamping.`,
      action: 'Switch feed to Standby Coil Bay 2 and prioritize high-runner chassis blanks.',
    },
    'AF-STG-2': {
      reason: `2500T Hydraulic Press die change and cushion pressure variance (+${delayMin}m cycle drift).`,
      action: 'Run quick-die calibration check on AF-STP-01 and rebalance press stroke cadence.',
    },
    'AF-STG-3': {
      reason: `Spot-weld electrode dressing and servo alignment added +${delayMin}m on Welding Line 2.`,
      action: 'Run automated tip-dresser cycle on AF-WLD-01 and verify secondary weld current.',
    },
    'AF-STG-4': {
      reason: `Paint Booth B atomizer pressure variance & thermal curing queue added +${delayMin}m delay in Painting.`,
      action: 'Divert 20% metallic coats to Booth A and inspect AF-PNT-02 rotary atomizer seal.',
    },
    'AF-STG-5': {
      reason: `Sub-frame torque sequencer synchronization lag (+${delayMin}m) queued chassis at Component Assembly.`,
      action: 'Shift harness sub-assembly to Parallel Cell B and verify DC nutrunner calibration.',
    },
    'AF-STG-6': {
      reason: `Final trim & glass-fitment robot indexing slow-down (+${delayMin}m) at Final Assembly.`,
      action: 'Assign buffer AGV carrier to relieve Final Assembly Bay 3 congestion.',
    },
    'AF-STG-7': {
      reason: `Optical metrology camera recalibration added +${delayMin}m queue at Quality Inspection.`,
      action: 'Enable secondary coordinate laser scanner lane to clear vehicle inspection backlog.',
    },
    'DF-STG-1': {
      reason: `Raw milk tanker unloading manifold cleaning extended reception by +${delayMin}m.`,
      action: 'Route incoming tanker B to Reception Bay 2 duplex strainer.',
    },
    'DF-STG-2': {
      reason: `Micro-filtration membrane differential pressure rise (+${delayMin}m cycle slowdown).`,
      action: 'Initiate automated backflush on Filter Bank A and switch flow to Bank B.',
    },
    'DF-STG-3': {
      reason: `HTST Pasteurizer regeneration valve drift & CIP hold added +${delayMin}m delay.`,
      action: 'Verify HTST diversion valve seat and confirm expert temperature verification log.',
    },
    'DF-STG-4': {
      reason: `Two-stage homogenizer pressure valve wear increased batch cycle by +${delayMin}m.`,
      action: 'Adjust Stage-2 homogenizer relief pressure and schedule plunger seal inspection.',
    },
    'DF-STG-5': {
      reason: `Chilled silo agitator & holding buffer transfer lag (+${delayMin}m) in Processing and Storage.`,
      action: 'Balance transfer flow across Silo Tanks 2 & 3 and verify glycol chiller loop.',
    },
    'DF-STG-6': {
      reason: `High-speed Pouch Filler Line 2 film-seal tension drift created +${delayMin}m delay in Packaging.`,
      action: 'Re-tension film servo on DF-PKG-02 and divert overflow to Packaging Line 3.',
    },
    'DF-STG-7': {
      reason: `Microbial & fat/SNF lab release queue added +${delayMin}m hold at Quality Inspection.`,
      action: 'Prioritize rapid FT-IR milk analyzer testing for pending pasteurized lots.',
    },
  };
  return (
    map[stage.id] ?? {
      reason: `${stage.name} cycle drifted +${delayMin}m above expected target.`,
      action: `Inspect ${stage.name} equipment telemetry and rebalance upstream WIP.`,
    }
  );
}

function resolveEntityLabelFromAlert(
  alert: AlertItem,
  stageList: ManufacturingStage[],
  vaultList: ColdStorageUnit[]
): string | null {
  const matchedStage = stageList.find(
    (s) =>
      alert.sourceEntity.includes(s.id) ||
      alert.title.toLowerCase().includes(s.name.toLowerCase())
  );
  if (matchedStage) return matchedStage.name;

  const matchedVault = vaultList.find(
    (v) =>
      alert.sourceEntity.includes(v.id) ||
      alert.title.toLowerCase().includes(v.name.toLowerCase())
  );
  if (matchedVault) return matchedVault.name;

  return null;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [industryScope, setIndustryScope] = useState<IndustryScope>('overview');
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Live telemetry & siren states
  const [liveSimulationActive, setLiveSimulationActive] = useState<boolean>(true);
  const [sirenEnabled, setSirenEnabled] = useState<boolean>(true);
  const [sirenPlaying, setSirenPlaying] = useState<boolean>(false);
  const [latestLiveAlert, setLatestLiveAlert] = useState<AlertItem | null>(null);
  const [lastVoiceAlertText, setLastVoiceAlertText] = useState<string | null>(null);
  const [resolvedNotice, setResolvedNotice] = useState<string | null>(null);
  const [lastResolvedVoiceText, setLastResolvedVoiceText] = useState<string | null>(null);
  const [lastTelemetryTick, setLastTelemetryTick] = useState<string>(formatNowTimestamp());

  const [factories] = useState<FactorySite[]>(INITIAL_FACTORIES);
  const [stages, setStages] = useState<ManufacturingStage[]>(INITIAL_STAGES);
  const [machines, setMachines] = useState<MachineRecord[]>(INITIAL_MACHINES);
  const [vehicleOrders, setVehicleOrders] = useState<VehicleProductionOrder[]>(INITIAL_VEHICLE_ORDERS);
  const [vehicleDefects, setVehicleDefects] = useState<VehicleDefectInspection[]>(INITIAL_VEHICLE_DEFECTS);
  const [dairyBatches, setDairyBatches] = useState<DairyBatch[]>(INITIAL_DAIRY_BATCHES);
  const [tempLogs] = useState<DairyTemperatureReading[]>(INITIAL_DAIRY_TEMP_LOGS);
  const [tempVerifications, setTempVerifications] =
    useState<ExpertTemperatureVerificationRecord[]>(INITIAL_TEMP_VERIFICATIONS);
  const [coldStorage, setColdStorage] = useState<ColdStorageUnit[]>(INITIAL_COLD_STORAGE);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [qualityMetrics] = useState<QualityStageMetric[]>(INITIAL_QUALITY_METRICS);
  const [financials, setFinancials] = useState<FinancialPeriodRecord[]>(INITIAL_FINANCIAL_RECORDS);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [anomalies] = useState<AnomalyDetectionRecord[]>(INITIAL_ANOMALIES);
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [thresholds, setThresholds] = useState<ThresholdSettings>(INITIAL_THRESHOLDS);

  const sirenEnabledRef = useRef(sirenEnabled);
  sirenEnabledRef.current = sirenEnabled;
  const thresholdsRef = useRef(thresholds);
  thresholdsRef.current = thresholds;
  const stagesRef = useRef(stages);
  stagesRef.current = stages;
  const coldStorageRef = useRef(coldStorage);
  coldStorageRef.current = coldStorage;
  const industryScopeRef = useRef(industryScope);
  industryScopeRef.current = industryScope;

  const tickCountRef = useRef(0);
  const startupFiredRef = useRef(false);
  const autoSurgeCursorRef = useRef(0);
  const manualSpikeCursorRef = useRef(0);
  const stageDelayedTicksRef = useRef<Record<string, number>>({});

  const dispatchUrgentAlert = useCallback(
    (newAlert: AlertItem, shouldPrepend = true, explicitLabel?: string) => {
      if (shouldPrepend) {
        setAlerts((prev) => [newAlert, ...prev]);
      }
      const entityLabel =
        explicitLabel ??
        resolveEntityLabelFromAlert(newAlert, stagesRef.current, coldStorageRef.current);
      const voiceText = entityLabel
        ? `There is an issue in ${entityLabel}`
        : 'There is an issue';

      setResolvedNotice(null);
      setLastResolvedVoiceText(null);
      setLastVoiceAlertText(voiceText);
      setLatestLiveAlert(newAlert);

      if (sirenEnabledRef.current) {
        setSirenPlaying(true);
        alertSiren.playDelaySirenAndVoice(4000, voiceText, () => {
          setSirenPlaying(false);
        });
      } else {
        alertSiren.speak(voiceText);
      }
    },
    []
  );

  const announceIssueResolved = useCallback((summaryText: string, explicitLabel?: string) => {
    alertSiren.stop();
    setSirenPlaying(false);
    setLatestLiveAlert(null);
    const voiceText = explicitLabel ? `Issue resolved in ${explicitLabel}` : 'Issue resolved';
    setResolvedNotice(summaryText);
    setLastResolvedVoiceText(voiceText);
    alertSiren.announceResolved(voiceText);
    window.setTimeout(() => {
      setResolvedNotice((curr) => (curr === summaryText ? null : curr));
    }, 6500);
  }, []);

  const silenceSiren = useCallback(() => {
    alertSiren.stop();
    setSirenPlaying(false);
  }, []);

  const dismissLiveAlert = useCallback(() => {
    setLatestLiveAlert(null);
  }, []);

  const dismissResolvedNotice = useCallback(() => {
    setResolvedNotice(null);
  }, []);

  const toggleLiveSimulation = useCallback(() => {
    setLiveSimulationActive((prev) => !prev);
  }, []);

  const toggleSiren = useCallback(() => {
    alertSiren.unlock();
    setSirenEnabled((prev) => {
      if (prev) {
        alertSiren.stop();
        setSirenPlaying(false);
      }
      return !prev;
    });
  }, []);

  const triggerSimulatedDelaySpike = useCallback(
    (targetIndustry?: ActiveIndustry, targetStageId?: string) => {
      alertSiren.unlock();
      const chosenIndustry: ActiveIndustry =
        targetIndustry ?? (industryScope === 'dairyflow' ? 'dairyflow' : 'autoforge');
      const nowStr = formatNowTimestamp();

      const preferredOrder =
        chosenIndustry === 'autoforge'
          ? ['AF-STG-4', 'AF-STG-2', 'AF-STG-5', 'AF-STG-6', 'AF-STG-3', 'AF-STG-7', 'AF-STG-1']
          : ['DF-STG-6', 'DF-STG-3', 'DF-STG-4', 'DF-STG-5', 'DF-STG-2', 'DF-STG-7', 'DF-STG-1'];

      setStages((prevStages) => {
        const candidates = prevStages.filter((s) => s.industry === chosenIndustry);
        let targetStage: ManufacturingStage | undefined;

        if (targetStageId) {
          targetStage = prevStages.find((s) => s.id === targetStageId);
        }

        if (!targetStage) {
          // Rotate through all stages starting with Painting (AutoForge) or Packaging (DairyFlow)
          for (let offset = 0; offset < preferredOrder.length; offset++) {
            const idx = (manualSpikeCursorRef.current + offset) % preferredOrder.length;
            const candidate = candidates.find((s) => s.id === preferredOrder[idx]);
            if (candidate && candidate.status === 'Nominal') {
              targetStage = candidate;
              manualSpikeCursorRef.current = (idx + 1) % preferredOrder.length;
              break;
            }
          }
          if (!targetStage) {
            const idx = manualSpikeCursorRef.current % preferredOrder.length;
            targetStage =
              candidates.find((s) => s.id === preferredOrder[idx]) || candidates[0];
            manualSpikeCursorRef.current = (idx + 1) % preferredOrder.length;
          }
        }

        if (!targetStage) return prevStages;

        const effectiveIndustry = targetStage.industry;
        const spikeMinutes = Math.max(7, Math.round(targetStage.expectedTimeMin * 0.42));
        const nextActual = targetStage.expectedTimeMin + spikeMinutes;
        const nextDelayPct = calcDelayPercentage(nextActual, targetStage.expectedTimeMin);
        const diag = getStageDiagnosticCopy(targetStage, spikeMinutes);

        const alertItem: AlertItem = {
          id: `ALT-${Math.floor(200 + Math.random() * 799)}`,
          industry: effectiveIndustry,
          category: 'Production Delay',
          severity: 'Critical',
          title: `Immediate Delay Spike in ${targetStage.name} (+${spikeMinutes} min / ${nextDelayPct.toFixed(1)}%)`,
          description: `${
            effectiveIndustry === 'autoforge' ? 'AutoForge' : 'DairyFlow'
          } ${targetStage.name} cycle jumped to ${nextActual} min (expected ${
            targetStage.expectedTimeMin
          } min). ${diag.reason}`,
          sourceEntity: targetStage.id,
          timestamp: nowStr,
          status: 'Active',
        };

        stageDelayedTicksRef.current[targetStage.id] = 0;

        // Fire alert, 4s siren, and stage-specific voice immediately
        window.setTimeout(() => dispatchUrgentAlert(alertItem, true, targetStage!.name), 0);

        return prevStages.map((s) =>
          s.id === targetStage!.id
            ? {
                ...s,
                actualTimeMin: nextActual,
                queueLength:
                  s.queueLength + (effectiveIndustry === 'autoforge' ? 4 : 750),
                waitingTimeMin: s.waitingTimeMin + 10,
                unitsProcessed: Math.max(
                  1,
                  s.unitsProcessed - (effectiveIndustry === 'autoforge' ? 5 : 1100)
                ),
                status: 'Bottleneck',
                bottleneckReason: diag.reason,
                recommendedAction: diag.action,
              }
            : s
        );
      });
    },
    [dispatchUrgentAlert, industryScope]
  );

  // Unlock Web Audio + SpeechSynthesis on any first interaction
  useEffect(() => {
    const unlockHandler = () => {
      alertSiren.unlock();
    };
    window.addEventListener('pointerdown', unlockHandler, { once: true });
    window.addEventListener('keydown', unlockHandler, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
    };
  }, []);

  // Automatically trigger 4s siren + stage-specific voice at startup when initial delays exist (prioritizing Bottleneck like Painting)
  useEffect(() => {
    if (!currentUser) {
      startupFiredRef.current = false;
      return;
    }
    if (startupFiredRef.current) return;
    startupFiredRef.current = true;

    const existingActiveDelayAlert = alerts.find(
      (a) => a.status === 'Active' && (a.category === 'Bottleneck' || a.category === 'Production Delay')
    );
    const matchedAlertStage = existingActiveDelayAlert
      ? stages.find((s) => existingActiveDelayAlert.sourceEntity.includes(s.id))
      : undefined;
    const initialDelayedStage =
      matchedAlertStage ??
      stages.find((s) => s.status === 'Bottleneck') ??
      stages.find((s) => s.status === 'Delayed');

    if (initialDelayedStage || existingActiveDelayAlert) {
      const stageName = initialDelayedStage?.name ?? 'Painting';
      const startupAlert: AlertItem = existingActiveDelayAlert ?? {
        id: `ALT-${Math.floor(200 + Math.random() * 799)}`,
        industry: initialDelayedStage?.industry ?? 'autoforge',
        category: 'Production Delay',
        severity: 'Critical',
        title: `Startup Production Delay Detected in ${stageName}`,
        description: `Active bottleneck detected in ${stageName} (${initialDelayedStage?.actualTimeMin}m vs ${initialDelayedStage?.expectedTimeMin}m expected).`,
        sourceEntity: initialDelayedStage?.id ?? 'AF-STG-4',
        timestamp: formatNowTimestamp(),
        status: 'Active',
      };

      const startupTimer = window.setTimeout(() => {
        dispatchUrgentAlert(startupAlert, !existingActiveDelayAlert, stageName);
      }, 350);

      return () => window.clearTimeout(startupTimer);
    }
  }, [currentUser, stages, alerts, dispatchUrgentAlert]);

  // Real-time fluctuating telemetry loop (every 2.8 seconds when signed in)
  useEffect(() => {
    if (!currentUser || !liveSimulationActive) return;

    const timer = window.setInterval(() => {
      tickCountRef.current += 1;
      const tick = tickCountRef.current;
      const nowStr = formatNowTimestamp();
      setLastTelemetryTick(nowStr);

      let newlyTriggeredAlert: AlertItem | null = null;
      let triggeredStageLabel: string | undefined;
      let autoResolvedInfo: { stageId: string; entityName: string; industry: ActiveIndustry } | null =
        null;

      // Determine which stage (rotating across ALL stages, including Painting, Metal Stamping, Component Assembly, Packaging, etc.) surges on tick % 4 === 0
      const currentStages = stagesRef.current;
      let surgeTargetId: string | null = null;
      if (tick % 4 === 0) {
        const activeScope = industryScopeRef.current;
        const preferredOrder = STAGE_ROTATION_PRIORITY.filter((id) => {
          if (activeScope === 'autoforge') return id.startsWith('AF-');
          if (activeScope === 'dairyflow') return id.startsWith('DF-');
          return true;
        });
        const searchPool = preferredOrder.length > 0 ? preferredOrder : STAGE_ROTATION_PRIORITY;

        for (let offset = 0; offset < searchPool.length; offset++) {
          const idx = (autoSurgeCursorRef.current + offset) % searchPool.length;
          const candidateId = searchPool[idx];
          const candidate = currentStages.find((s) => s.id === candidateId);
          if (candidate && candidate.status === 'Nominal') {
            surgeTargetId = candidate.id;
            autoSurgeCursorRef.current = (idx + 1) % searchPool.length;
            break;
          }
        }
      }

      // Determine one delayed stage eligible for automatic recovery on tick % 6 === 0 (never pinned permanently)
      let recoverTargetId: string | null = null;
      if (tick % 6 === 0) {
        const recoverable = currentStages.find(
          (s) =>
            (s.status === 'Delayed' || s.status === 'Bottleneck') &&
            (stageDelayedTicksRef.current[s.id] ?? 0) >= 2
        );
        if (recoverable) {
          recoverTargetId = recoverable.id;
        }
      }

      // 1. Fluctuate Manufacturing Stages (AutoForge & DairyFlow)
      setStages((prevStages) =>
        prevStages.map((s) => {
          const isAf = s.industry === 'autoforge';
          const warnThreshold = thresholdsRef.current.autoforgeDelayWarningPercent;

          if (s.status === 'Delayed' || s.status === 'Bottleneck') {
            stageDelayedTicksRef.current[s.id] = (stageDelayedTicksRef.current[s.id] ?? 0) + 1;
          } else {
            stageDelayedTicksRef.current[s.id] = 0;
          }

          const isSurgeTarget = s.id === surgeTargetId;
          const isRecoverTarget = s.id === recoverTargetId;

          let nextActual: number;
          if (isSurgeTarget) {
            nextActual = Math.round(s.expectedTimeMin * (1 + (warnThreshold + 16) / 100));
          } else if (isRecoverTarget) {
            nextActual = s.expectedTimeMin;
          } else {
            // Keep Nominal stages fluctuating gently below warning threshold unless surged; let delayed stages jitter realistically
            const timeJitter = Math.floor(Math.random() * 5) - 2;
            const maxAllow =
              s.status === 'Nominal'
                ? Math.max(s.expectedTimeMin + 1, Math.floor(s.expectedTimeMin * (1 + (warnThreshold - 3) / 100)))
                : Math.round(s.expectedTimeMin * 1.65);
            const minAllow =
              s.status === 'Nominal'
                ? Math.round(s.expectedTimeMin * 0.9)
                : Math.round(s.expectedTimeMin * 1.05);
            nextActual = Math.max(minAllow, Math.min(maxAllow, s.actualTimeMin + timeJitter));
          }

          const delayPct = calcDelayPercentage(nextActual, s.expectedTimeMin);
          const nextStatus: ManufacturingStage['status'] =
            delayPct >= warnThreshold + 12
              ? 'Bottleneck'
              : delayPct >= warnThreshold
              ? 'Delayed'
              : 'Nominal';

          const delayDeltaMin = Math.max(1, nextActual - s.expectedTimeMin);
          const diag = getStageDiagnosticCopy(s, delayDeltaMin);

          // Automatic delay alert & siren when stage transitions Nominal -> Delayed/Bottleneck
          if (
            s.status === 'Nominal' &&
            (nextStatus === 'Delayed' || nextStatus === 'Bottleneck') &&
            !newlyTriggeredAlert
          ) {
            stageDelayedTicksRef.current[s.id] = 0;
            triggeredStageLabel = s.name;
            newlyTriggeredAlert = {
              id: `ALT-${Math.floor(200 + Math.random() * 799)}`,
              industry: s.industry,
              category: 'Production Delay',
              severity: nextStatus === 'Bottleneck' ? 'Critical' : 'High',
              title: `Automatic Delay Alert: ${s.name} (${delayPct.toFixed(1)}% above target)`,
              description: `${
                isAf ? 'AutoForge' : 'DairyFlow'
              } ${s.name} fluctuated to ${nextActual}m vs ${s.expectedTimeMin}m expected (${s.queueLength} queued). ${diag.reason}`,
              sourceEntity: s.id,
              timestamp: nowStr,
              status: 'Active',
            };
          }

          // Automatic recovery announcement when a previously delayed stage stabilizes back to Nominal
          if (
            (s.status === 'Delayed' || s.status === 'Bottleneck') &&
            nextStatus === 'Nominal' &&
            !autoResolvedInfo
          ) {
            stageDelayedTicksRef.current[s.id] = 0;
            autoResolvedInfo = { stageId: s.id, entityName: s.name, industry: s.industry };
          }

          const outputDelta = isAf
            ? Math.floor(Math.random() * 5) - 2
            : Math.floor(Math.random() * 650) - 310;
          const nextUnits = Math.max(
            Math.round(s.plannedOutput * 0.72),
            Math.min(s.productionCapacity, s.unitsProcessed + outputDelta)
          );

          const queueDelta = isSurgeTarget
            ? isAf
              ? 4
              : 750
            : isRecoverTarget
            ? -(isAf ? 4 : 700)
            : isAf
            ? Math.floor(Math.random() * 3) - 1
            : Math.floor(Math.random() * 240) - 115;
          const nextQueue = Math.max(0, s.queueLength + queueDelta);

          const waitDelta = isSurgeTarget ? 8 : isRecoverTarget ? -8 : Math.floor(Math.random() * 3) - 1;
          const nextWait = Math.max(2, s.waitingTimeMin + waitDelta);

          return {
            ...s,
            actualTimeMin: nextActual,
            unitsProcessed: nextUnits,
            queueLength: nextQueue,
            waitingTimeMin: nextWait,
            energyKwh: Math.max(200, s.energyKwh + (Math.floor(Math.random() * 40) - 18)),
            status: nextStatus,
            bottleneckReason:
              nextStatus === 'Nominal' ? undefined : s.bottleneckReason ?? diag.reason,
            recommendedAction:
              nextStatus === 'Nominal' ? undefined : s.recommendedAction ?? diag.action,
          };
        })
      );

      // 2. Fluctuate Machine Telemetry
      setMachines((prevMachines) =>
        prevMachines.map((m) => {
          const tempDrift = (Math.random() - 0.48) * 0.6;
          const vibDrift = (Math.random() - 0.5) * 0.25;
          const pwrDrift = Math.floor(Math.random() * 14) - 7;
          return {
            ...m,
            temperatureC: Number((m.temperatureC + tempDrift).toFixed(1)),
            vibrationMmS: Number(Math.max(0.4, m.vibrationMmS + vibDrift).toFixed(1)),
            powerDrawKw: Math.max(40, m.powerDrawKw + pwrDrift),
          };
        })
      );

      // 3. Fluctuate Vehicle Production Orders (Automobile counts)
      setVehicleOrders((prevOrders) =>
        prevOrders.map((o) => {
          const delta = Math.random() > 0.65 ? (Math.random() > 0.45 ? 1 : -1) : 0;
          const nextDone = Math.max(0, Math.min(o.targetUnits, o.completedUnits + delta));
          return {
            ...o,
            completedUnits: nextDone,
            fulfilmentPercent: Number(((nextDone / Math.max(1, o.targetUnits)) * 100).toFixed(1)),
          };
        })
      );

      // 4. Fluctuate Dairy Batches (Milk litres, product output, pasteurization temps)
      setDairyBatches((prevBatches) =>
        prevBatches.map((b) => {
          const volJitter = Math.floor(Math.random() * 180) - 85;
          const nextVol = Math.max(1200, b.volumeLitres + volJitter);
          const nextOut =
            b.productType === 'Milk'
              ? Math.round(nextVol * 0.975)
              : b.productType === 'Curd'
              ? Math.round(nextVol * 0.94)
              : b.outputQuantityKgOrL + (Math.floor(Math.random() * 16) - 8);
          const tempJitter = (Math.random() - 0.5) * 0.3;
          return {
            ...b,
            volumeLitres: nextVol,
            outputQuantityKgOrL: Math.max(100, nextOut),
            pasteurizationTempC: Number((b.pasteurizationTempC + tempJitter).toFixed(1)),
          };
        })
      );

      // 5. Fluctuate Cold Storage Telemetry & trigger thermal alerts if crossing ceiling
      setColdStorage((prevCs) =>
        prevCs.map((cs) => {
          const nextTemp = Number(
            Math.max(1.5, cs.currentTempC + (Math.random() - 0.49) * 0.25).toFixed(1)
          );
          const isHigh = nextTemp > cs.configuredMaxC;
          if (!cs.refrigerationStatus.includes('Warning') && isHigh && !newlyTriggeredAlert) {
            triggeredStageLabel = cs.name;
            newlyTriggeredAlert = {
              id: `ALT-${Math.floor(200 + Math.random() * 799)}`,
              industry: 'dairyflow',
              category: 'Temperature Violation',
              severity: 'Critical',
              title: `Cold-Chain Threshold Breach in ${cs.name} (${nextTemp}°C)`,
              description: `${cs.name} rose to ${nextTemp}°C, exceeding configured ceiling (${cs.configuredMaxC}°C). Immediate evaporator check needed.`,
              sourceEntity: cs.id,
              timestamp: nowStr,
              status: 'Active',
            };
          }
          return {
            ...cs,
            currentTempC: nextTemp,
            refrigerationStatus: isHigh ? 'Threshold Warning' : 'Nominal',
            energyKwhToday: Math.max(200, cs.energyKwhToday + (Math.floor(Math.random() * 18) - 8)),
          };
        })
      );

      // 6. Fluctuate Latest Daily Financial Records in sync with production
      setFinancials((prevFin) => {
        const lastAfIdx = prevFin.map((f) => f.industry).lastIndexOf('autoforge');
        const lastDfIdx = prevFin.map((f) => f.industry).lastIndexOf('dairyflow');
        return prevFin.map((f, idx) => {
          if (idx === lastAfIdx) {
            const unitDelta = Math.floor(Math.random() * 3) - 1;
            const nextMfg = Math.max(115, Math.min(160, f.unitsManufactured + unitDelta));
            const nextSold = Math.max(110, Math.min(nextMfg, f.unitsSold + unitDelta));
            return {
              ...f,
              unitsManufactured: nextMfg,
              unitsSold: nextSold,
              revenue: nextSold * 1107800,
            };
          }
          if (idx === lastDfIdx) {
            const litreDelta = Math.floor(Math.random() * 500) - 240;
            const nextMfg = Math.max(38000, Math.min(48500, f.unitsManufactured + litreDelta));
            const nextSold = Math.max(37000, Math.min(nextMfg, f.unitsSold + litreDelta));
            return {
              ...f,
              unitsManufactured: nextMfg,
              unitsSold: nextSold,
              revenue: Math.round(nextSold * 76.5),
            };
          }
          return f;
        });
      });

      if (newlyTriggeredAlert) {
        dispatchUrgentAlert(newlyTriggeredAlert, true, triggeredStageLabel);
      } else if (autoResolvedInfo) {
        const info = autoResolvedInfo as {
          stageId: string;
          entityName: string;
          industry: ActiveIndustry;
        };
        setAlerts((prev) =>
          prev.map((a) =>
            a.status !== 'Resolved' && a.sourceEntity.includes(info.stageId)
              ? { ...a, status: 'Resolved' }
              : a
          )
        );
        announceIssueResolved(
          `${info.industry === 'autoforge' ? 'AutoForge' : 'DairyFlow'} ${info.entityName} delay cleared automatically.`,
          info.entityName
        );
      }
    }, 2800);

    return () => window.clearInterval(timer);
  }, [currentUser, liveSimulationActive, dispatchUrgentAlert, announceIssueResolved]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const login = (email: string, roleUser?: UserAccount) => {
    alertSiren.unlock();
    if (roleUser) {
      setCurrentUser(roleUser);
      if (roleUser.industryAccess === 'autoforge') setIndustryScope('autoforge');
      else if (roleUser.industryAccess === 'dairyflow') setIndustryScope('dairyflow');
      else setIndustryScope('overview');
      return;
    }
    const matched = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    setCurrentUser(
      matched || {
        id: 'USR-DEMO',
        name: email.split('@')[0] || 'Operations Lead',
        email,
        role: 'Plant Director',
        assignedFactory: 'All INDUSMIND Sites',
        industryAccess: 'all',
        status: 'Active',
        lastLogin: new Date().toISOString().slice(0, 16).replace('T', ' '),
      }
    );
  };

  const logout = () => {
    alertSiren.stop();
    setSirenPlaying(false);
    setCurrentUser(null);
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const addVehicleOrder = (order: VehicleProductionOrder) => {
    setVehicleOrders((prev) => [order, ...prev]);
  };

  const addVehicleDefect = (defect: VehicleDefectInspection) => {
    setVehicleDefects((prev) => [defect, ...prev]);
  };

  const verifyVehicleDefect = (id: string, status: VehicleDefectInspection['verificationStatus']) => {
    setVehicleDefects((prev) =>
      prev.map((d) => (d.id === id ? { ...d, verificationStatus: status } : d))
    );
  };

  const addDairyBatch = (batch: DairyBatch) => {
    setDairyBatches((prev) => [batch, ...prev]);
  };

  const addTempVerification = (record: ExpertTemperatureVerificationRecord) => {
    setTempVerifications((prev) => [record, ...prev]);
    if (record.verificationStatus === 'Mismatch Detected' || record.verificationStatus === 'Requires Review') {
      const newAlert: AlertItem = {
        id: `ALT-${Math.floor(110 + Math.random() * 890)}`,
        industry: 'dairyflow',
        category:
          record.verificationStatus === 'Mismatch Detected' ? 'Temperature Violation' : 'Pending Verification',
        severity: record.verificationStatus === 'Mismatch Detected' ? 'Critical' : 'High',
        title: `Temperature Verification ${record.verificationStatus} (${record.batchId})`,
        description: `${record.equipment} logged ${record.enteredTemp}°${record.unit} by ${record.expertName}.`,
        sourceEntity: record.id,
        timestamp: record.measuredAt,
        status: 'Active',
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }
  };

  const updateTempVerificationStatus = (
    id: string,
    status: ExpertTemperatureVerificationRecord['verificationStatus'],
    actorName: string,
    actionNote: string,
    extractedReadingC?: number | null,
    ocrConfidencePercent?: number | null,
    ocrMode?: ExpertTemperatureVerificationRecord['ocrIntegrationState']
  ) => {
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setTempVerifications((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          verificationStatus: status,
          humanConfirmed: status === 'Verified',
          extractedReadingC: extractedReadingC !== undefined ? extractedReadingC : r.extractedReadingC,
          ocrConfidencePercent:
            ocrConfidencePercent !== undefined ? ocrConfidencePercent : r.ocrConfidencePercent,
          ocrIntegrationState: ocrMode ?? r.ocrIntegrationState,
          auditTrail: [
            ...r.auditTrail,
            { timestamp: nowStr, actor: actorName, action: actionNote },
          ],
        };
      })
    );
    if (status === 'Verified') {
      setAlerts((prev) =>
        prev.map((a) => (a.sourceEntity === id ? { ...a, status: 'Resolved' } : a))
      );
    }
  };

  const restockInventoryItem = (id: string, addedQty: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextStock = item.currentStock + addedQty;
        const nextStatus: InventoryItem['status'] =
          nextStock < item.reorderLevel * 0.85
            ? 'Critical Reorder'
            : nextStock <= item.reorderLevel * 1.15
            ? 'Low Stock'
            : 'Optimal';
        return { ...item, currentStock: nextStock, status: nextStatus };
      })
    );
  };

  const updateAlertStatus = (id: string, status: AlertItem['status']) => {
    const targetAlert = alerts.find((a) => a.id === id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));

    if (status === 'Resolved') {
      let resolvedStageName: string | undefined;
      if (targetAlert) {
        const matchedStage = stagesRef.current.find(
          (s) =>
            targetAlert.sourceEntity.includes(s.id) ||
            targetAlert.title.toLowerCase().includes(s.name.toLowerCase())
        );
        if (matchedStage) {
          resolvedStageName = matchedStage.name;
          stageDelayedTicksRef.current[matchedStage.id] = 0;
        } else {
          const matchedVault = coldStorageRef.current.find(
            (v) =>
              targetAlert.sourceEntity.includes(v.id) ||
              targetAlert.title.toLowerCase().includes(v.name.toLowerCase())
          );
          if (matchedVault) {
            resolvedStageName = matchedVault.name;
            setColdStorage((prevCs) =>
              prevCs.map((cs) =>
                cs.id === matchedVault.id
                  ? {
                      ...cs,
                      currentTempC: Math.min(cs.currentTempC, cs.configuredMaxC - 0.6),
                      refrigerationStatus: 'Nominal',
                    }
                  : cs
              )
            );
          }
        }

        setStages((prevStages) =>
          prevStages.map((s) =>
            targetAlert.sourceEntity.includes(s.id) ||
            targetAlert.title.toLowerCase().includes(s.name.toLowerCase())
              ? {
                  ...s,
                  actualTimeMin: s.expectedTimeMin,
                  waitingTimeMin: 6,
                  status: 'Nominal',
                  bottleneckReason: undefined,
                  recommendedAction: undefined,
                }
              : s
          )
        );
      }
      announceIssueResolved(
        targetAlert ? `Resolved: ${targetAlert.title}` : 'Issue resolved.',
        resolvedStageName
      );
    } else if (latestLiveAlert?.id === id) {
      setLatestLiveAlert(null);
      silenceSiren();
    }
  };

  const logMachineMaintenance = (id: string, note: string) => {
    const dateStr = new Date().toISOString().slice(0, 10);
    setMachines((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              lastMaintenanceDate: dateStr,
              maintenanceHistory: [`${dateStr}: ${note}`, ...m.maintenanceHistory],
              operatingStatus: 'Running',
              riskScore: Math.max(15, m.riskScore - 35),
              riskLevel: m.riskScore - 35 < 35 ? 'Low' : 'Moderate',
              maintenanceWarning: null,
            }
          : m
      )
    );
  };

  const addUserAccount = (user: UserAccount) => {
    setUsers((prev) => [...prev, user]);
  };

  const updateThresholds = (next: ThresholdSettings) => {
    setThresholds(next);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        logout,
        industryScope,
        setIndustryScope,
        darkMode,
        toggleDarkMode,
        liveSimulationActive,
        toggleLiveSimulation,
        sirenEnabled,
        toggleSiren,
        sirenPlaying,
        silenceSiren,
        latestLiveAlert,
        lastVoiceAlertText,
        dismissLiveAlert,
        resolvedNotice,
        lastResolvedVoiceText,
        dismissResolvedNotice,
        lastTelemetryTick,
        triggerSimulatedDelaySpike,
        factories,
        stages,
        machines,
        vehicleOrders,
        vehicleDefects,
        dairyBatches,
        tempLogs,
        tempVerifications,
        coldStorage,
        inventory,
        qualityMetrics,
        financials,
        alerts,
        anomalies,
        users,
        thresholds,
        addVehicleOrder,
        addVehicleDefect,
        verifyVehicleDefect,
        addDairyBatch,
        addTempVerification,
        updateTempVerificationStatus,
        restockInventoryItem,
        updateAlertStatus,
        logMachineMaintenance,
        addUserAccount,
        updateThresholds,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
