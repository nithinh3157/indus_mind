import React, { useState } from 'react';
import { AlertTriangle, Camera, CheckCircle2, FileCheck2, Info, ShieldAlert, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ASSET_IMAGES } from '../data/simulatedFactoryData';
import { celsiusToFahrenheit, fahrenheitToCelsius } from '../utils/calculations';
import { ResilientImage, SectionPanel, SimulatedBanner, StatusLabel } from '../components/common/UiPrimitives';
import { ExpertTemperatureVerificationRecord, OcrVerificationStatus } from '../types/indusmind';

export const DairyTemperatureVerificationPage: React.FC = () => {
  const {
    tempVerifications,
    dairyBatches,
    thresholds,
    currentUser,
    addTempVerification,
    updateTempVerificationStatus,
  } = useApp();

  const [stage, setStage] = useState('Pasteurization');
  const [equipment, setEquipment] = useState('HTST Plate Pasteurizer 1');
  const [batchId, setBatchId] = useState(dairyBatches[2]?.batchId || 'DF-B-20261116-03');
  const [enteredTemp, setEnteredTemp] = useState('72.4');
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [measuredAt, setMeasuredAt] = useState('2026-11-16 15:20');
  const [durationMin, setDurationMin] = useState('18');
  const [method, setMethod] = useState('Calibrated Inline Digital RTD Probe (DT-500)');
  const [notes, setNotes] = useState('');

  const [photoPreview, setPhotoPreview] = useState<string>(ASSET_IMAGES.thermometerSample);
  const [photoName, setPhotoName] = useState<string>('sanitherm_dt500_72_4c.jpg');
  const [fileError, setFileError] = useState<string | null>(null);

  // Honest OCR workflow simulation controls (explicitly labeled as Pending Tesseract Integration)
  const [simulatedOcrToggle, setSimulatedOcrToggle] = useState<
    'pending' | 'match' | 'mismatch' | 'unreadable'
  >('pending');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFileError('Invalid file type. Upload a JPG, PNG, or WEBP photograph of the thermometer display.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File exceeds 5 MB limit.');
      return;
    }
    setFileError(null);
    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    const numericTemp = parseFloat(enteredTemp);
    if (!Number.isFinite(numericTemp)) {
      setFileError('Enter a valid numeric temperature.');
      return;
    }
    if (!photoPreview) {
      setFileError('Photograph evidence of the thermometer or display is required.');
      return;
    }

    const tempInC = unit === 'F' ? fahrenheitToCelsius(numericTemp) : numericTemp;
    let verificationStatus: OcrVerificationStatus = 'Requires Review';
    let extractedReadingC: number | null = null;
    let ocrConfidencePercent: number | null = null;
    let ocrMode: ExpertTemperatureVerificationRecord['ocrIntegrationState'] =
      'Pending Tesseract OCR Backend';

    if (simulatedOcrToggle === 'match') {
      ocrMode = 'Simulated Preview Comparison';
      extractedReadingC = Number(tempInC.toFixed(1));
      ocrConfidencePercent = 95.8;
      // Still requires human verification even when OCR preview matches
      verificationStatus = 'Requires Review';
    } else if (simulatedOcrToggle === 'mismatch') {
      ocrMode = 'Simulated Preview Comparison';
      extractedReadingC = Number((tempInC - 2.3).toFixed(1));
      ocrConfidencePercent = 91.2;
      verificationStatus = 'Mismatch Detected';
    } else if (simulatedOcrToggle === 'unreadable') {
      ocrMode = 'Simulated Preview Comparison';
      extractedReadingC = null;
      ocrConfidencePercent = 28.4;
      verificationStatus = 'Unreadable Evidence';
    }

    const newRecord: ExpertTemperatureVerificationRecord = {
      id: `ETV-2026-${Math.floor(100 + Math.random() * 899)}`,
      stage,
      equipment,
      batchId,
      expertName: currentUser?.name || 'Dr. Meera Patel',
      enteredTemp: numericTemp,
      unit,
      enteredTempC: Number(tempInC.toFixed(2)),
      measuredAt,
      durationMin: Number(durationMin) || 15,
      measurementMethod: method,
      notes: notes.trim() || 'Submitted via Expert Temperature Verification workbench.',
      imageUrl: photoPreview,
      imageFileName: photoName,
      ocrIntegrationState: ocrMode,
      extractedReadingC,
      ocrConfidencePercent,
      verificationStatus,
      humanConfirmed: false,
      auditTrail: [
        {
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
          actor: currentUser?.name || 'Dr. Meera Patel',
          action: `Logged ${numericTemp}°${unit} (${tempInC.toFixed(1)}°C) with photograph "${photoName}". Status: ${verificationStatus}.`,
        },
      ],
    };

    addTempVerification(newRecord);
    setNotes('');
    setFileError(null);
  };

  return (
    <div className="space-y-6">
      <SimulatedBanner label="DairyFlow Expert Temperature Verification · Automated Tesseract OCR engine integration pending; human verification enforced" />

      {/* Critical Governance Disclaimer */}
      <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-sm">
            Mandatory Verification Governance & OCR Limitation Notice
          </div>
          <p className="leading-relaxed">
            Optical Character Recognition (OCR) only reads the digits displayed on an uploaded gauge
            photograph. It does <strong>not</strong> independently prove internal product temperature
            or certify food safety. All records retain original image evidence, maintain an audit
            trail, and require explicit human expert verification. Configured operating limits are
            user-defined thresholds ({thresholds.dairyPasteurizationMinC}–{thresholds.dairyPasteurizationMaxC}°C pasteurization; max {thresholds.dairyColdStorageMaxC}°C cold storage).
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Form: Authorized Dairy Expert Submission */}
        <SectionPanel
          title="Submit Temperature Reading & Photo Evidence"
          subtitle="Log stage measurement and attach thermometer / equipment display photo"
          className="lg:col-span-5"
        >
          <form onSubmit={handleSubmitEvidence} className="space-y-3.5 text-xs">
            {fileError && (
              <div className="p-2.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                {fileError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Production Stage
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                >
                  <option>Raw Milk Reception</option>
                  <option>Filtration</option>
                  <option>Pasteurization</option>
                  <option>Homogenization</option>
                  <option>Processing and Storage</option>
                  <option>Packaging</option>
                  <option>Quality Inspection</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Batch ID
                </label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                >
                  {dairyBatches.map((b) => (
                    <option key={b.batchId} value={b.batchId}>
                      {b.batchId} ({b.productType})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                Equipment
              </label>
              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              >
                <option>HTST Plate Pasteurizer 1</option>
                <option>Batch Vat Pasteurizer B</option>
                <option>Cold Storage Vault A</option>
                <option>Cold Storage Vault B</option>
                <option>Raw Milk Silo #2 Chiller</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Temperature
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={enteredTemp}
                  onChange={(e) => setEnteredTemp(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as 'C' | 'F')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                >
                  <option value="C">°C (Celsius)</option>
                  <option value="F">°F (Fahrenheit)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Duration (min)
                </label>
                <input
                  type="number"
                  min={1}
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Date & Time
                </label>
                <input
                  type="text"
                  value={measuredAt}
                  onChange={(e) => setMeasuredAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Measurement Method
                </label>
                <input
                  type="text"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                Thermometer / Display Photograph Evidence
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Gauge Photo</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPreview(ASSET_IMAGES.thermometerSample);
                    setPhotoName('sanitherm_dt500_72_4c.jpg');
                    setEnteredTemp('72.4');
                    setUnit('C');
                    setFileError(null);
                  }}
                  className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
                >
                  Load Sample Gauge (72.4°C)
                </button>
              </div>
              <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
                <ResilientImage
                  src={photoPreview}
                  alt="Thermometer Evidence Preview"
                  className="w-full h-40 object-cover"
                />
                <div className="px-3 py-1.5 text-[11px] text-slate-300 flex items-center justify-between">
                  <span className="font-mono truncate">{photoName}</span>
                  <span>
                    Equiv:{' '}
                    {unit === 'C'
                      ? `${Number(enteredTemp || 0).toFixed(1)}°C / ${celsiusToFahrenheit(
                          Number(enteredTemp || 0)
                        ).toFixed(1)}°F`
                      : `${fahrenheitToCelsius(Number(enteredTemp || 0)).toFixed(1)}°C`}
                  </span>
                </div>
              </div>
            </div>

            {/* Honest OCR Workflow Mode Selector */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  OCR Verification Pipeline State
                </span>
                <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400">
                  Tesseract Backend Pending
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Live OpenCV + Tesseract OCR runs in the Python FastAPI backend. Select default pending state or test a simulated workflow outcome:
              </p>
              <select
                value={simulatedOcrToggle}
                onChange={(e) =>
                  setSimulatedOcrToggle(
                    e.target.value as 'pending' | 'match' | 'mismatch' | 'unreadable'
                  )
                }
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                <option value="pending">Pending Tesseract OCR Integration (Requires Manual Review)</option>
                <option value="match">Simulated Workflow Demo: OCR Matches Entry (Still Requires Human Sign-Off)</option>
                <option value="mismatch">Simulated Workflow Demo: Mismatch Detected (-2.3°C Discrepancy)</option>
                <option value="unreadable">Simulated Workflow Demo: Blurry / Unreadable Evidence</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                Inspector Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Record sanitation context, probe calibration ID, or gauge visibility..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span>Log Temperature Evidence & Create Audit Record</span>
            </button>
          </form>
        </SectionPanel>

        {/* Right: Verification Queue, Discrepancy Review & Audit Trail */}
        <SectionPanel
          title="Verification Queue & Immutable Audit Trail"
          subtitle="Review uploaded gauge evidence, inspect discrepancies, and execute human sign-off"
          className="lg:col-span-7"
        >
          <div className="space-y-4">
            {tempVerifications.map((rec) => {
              const discrepancy =
                rec.extractedReadingC !== null
                  ? Math.abs(rec.extractedReadingC - rec.enteredTempC)
                  : null;
              const isOverTolerance =
                discrepancy !== null && discrepancy > thresholds.dairyTempMismatchToleranceC;

              return (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        <span className="font-mono">{rec.id}</span>
                        <span aria-hidden="true">·</span>
                        <span>{rec.batchId}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {rec.stage} · {rec.equipment} · Inspector: {rec.expertName} · {rec.measuredAt}
                      </div>
                    </div>
                    <StatusLabel status={rec.verificationStatus} />
                  </div>

                  <div className="grid sm:grid-cols-12 gap-4 items-start">
                    <div className="sm:col-span-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
                      <ResilientImage
                        src={rec.imageUrl}
                        alt={`Evidence for ${rec.id}`}
                        className="w-full h-32 object-cover"
                      />
                      <div className="px-2 py-1 text-[10px] font-mono text-slate-300 truncate">
                        {rec.imageFileName}
                      </div>
                    </div>

                    <div className="sm:col-span-8 space-y-2 text-xs">
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                        <div>
                          <div className="text-[11px] text-slate-500">Expert Entered</div>
                          <div className="font-mono font-semibold text-sm">
                            {rec.enteredTemp}°{rec.unit}{' '}
                            <span className="text-[11px] font-normal text-slate-500">
                              ({rec.enteredTempC}°C)
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-500">OCR Extracted</div>
                          <div className="font-mono font-semibold text-sm">
                            {rec.extractedReadingC !== null
                              ? `${rec.extractedReadingC}°C`
                              : 'Pending OCR'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-500">Confidence / Diff</div>
                          <div className="font-mono font-semibold text-sm">
                            {rec.ocrConfidencePercent !== null
                              ? `${rec.ocrConfidencePercent}%`
                              : 'N/A'}
                            {discrepancy !== null && (
                              <span
                                className={`ml-1 text-[11px] ${
                                  isOverTolerance ? 'text-rose-600' : 'text-emerald-600'
                                }`}
                              >
                                (Δ {discrepancy.toFixed(1)}°C)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 dark:text-slate-300">
                        <span className="font-medium">Method:</span> {rec.measurementMethod} ({rec.durationMin} min)
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300">
                        <span className="font-medium">OCR Engine State:</span> {rec.ocrIntegrationState}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {rec.notes}
                      </div>

                      {/* Human Verification Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {!rec.humanConfirmed && (
                          <button
                            onClick={() =>
                              updateTempVerificationStatus(
                                rec.id,
                                'Verified',
                                currentUser?.name || 'Dr. Meera Patel',
                                'Human inspector visually inspected gauge photo and confirmed temperature accuracy.'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-medium"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Human Verify & Approve</span>
                          </button>
                        )}
                        <button
                          onClick={() =>
                            updateTempVerificationStatus(
                              rec.id,
                              'Mismatch Detected',
                              currentUser?.name || 'Dr. Meera Patel',
                              'Inspector flagged temperature mismatch against gauge photograph.'
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-medium"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>Flag Mismatch</span>
                        </button>
                        <button
                          onClick={() =>
                            updateTempVerificationStatus(
                              rec.id,
                              'Unreadable Evidence',
                              currentUser?.name || 'Dr. Meera Patel',
                              'Marked photo unreadable/blurry; requested re-capture.'
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium"
                        >
                          <Info className="w-3 h-3" />
                          <span>Mark Blurry / Unreadable</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Audit Trail */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Audit Trail</span>
                    </div>
                    <ul className="space-y-1">
                      {rec.auditTrail.map((entry, idx) => (
                        <li key={idx} className="text-[11px] text-slate-500 dark:text-slate-400 flex gap-2">
                          <span className="font-mono shrink-0">{entry.timestamp}</span>
                          <span>—</span>
                          <span>
                            <strong className="font-medium text-slate-700 dark:text-slate-200">
                              {entry.actor}:
                            </strong>{' '}
                            {entry.action}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionPanel>
      </div>
    </div>
  );
};
