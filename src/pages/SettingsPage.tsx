import React, { useState } from 'react';
import { Check, Database, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SectionPanel } from '../components/common/UiPrimitives';

export const SettingsPage: React.FC = () => {
  const { thresholds, updateThresholds, darkMode, toggleDarkMode } = useApp();
  const [form, setForm] = useState(thresholds);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateThresholds(form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
          Platform Settings & Backend Architecture
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure user-defined operating limits, display preferences, and review FastAPI + MySQL integration specs
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <SectionPanel
          title="Configurable Operating Thresholds"
          subtitle="Plant-specific limits configured by engineering & dairy quality leads (not hardcoded regulatory claims)"
          className="lg:col-span-6"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Dairy Pasteurization Min (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.dairyPasteurizationMinC}
                  onChange={(e) =>
                    setForm({ ...form, dairyPasteurizationMinC: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Dairy Pasteurization Max (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.dairyPasteurizationMaxC}
                  onChange={(e) =>
                    setForm({ ...form, dairyPasteurizationMaxC: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Cold Storage Ceiling (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.dairyColdStorageMaxC}
                  onChange={(e) =>
                    setForm({ ...form, dairyColdStorageMaxC: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  OCR Mismatch Tolerance (±°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.dairyTempMismatchToleranceC}
                  onChange={(e) =>
                    setForm({ ...form, dairyTempMismatchToleranceC: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Stage Delay Warning (%)
                </label>
                <input
                  type="number"
                  value={form.autoforgeDelayWarningPercent}
                  onChange={(e) =>
                    setForm({ ...form, autoforgeDelayWarningPercent: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  High Machine Utilization Threshold (%)
                </label>
                <input
                  type="number"
                  value={form.machineUtilizationWarningPercent}
                  onChange={(e) =>
                    setForm({ ...form, machineUtilizationWarningPercent: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <label className="flex items-center justify-between cursor-pointer">
                <span>Dark Appearance Mode</span>
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 font-medium"
                >
                  {darkMode ? 'Dark Enabled' : 'Light Enabled'}
                </button>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span>Display Simulated Dataset Banners</span>
                <input
                  type="checkbox"
                  checked={form.showSimulatedBadges}
                  onChange={(e) => setForm({ ...form, showSimulatedBadges: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 dark:bg-blue-600 text-white font-medium"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Thresholds</span>
              </button>
              {savedNotice && (
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>Thresholds updated</span>
                </span>
              )}
            </div>
          </form>
        </SectionPanel>

        <SectionPanel
          title="Planned Python FastAPI & MySQL Integration Blueprint"
          subtitle="Structured adapter architecture prepared for Stage 7 backend connection"
          className="lg:col-span-6"
        >
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
              <Database className="w-4 h-4 text-blue-600" />
              <span>Target Backend Stack (Preferred Architecture)</span>
            </div>
            <p>
              The React frontend communicates through <code className="font-mono">src/services/indusmindApiService.ts</code>, allowing seamless migration from the current simulated dataset to Python FastAPI + MySQL + Scikit-learn + OpenCV/Tesseract OCR without rewriting UI components.
            </p>
            <div className="p-3 rounded-lg bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto space-y-1">
              <div>GET  /api/v1/overview/summary</div>
              <div>GET  /api/v1/autoforge/stages & /vehicles</div>
              <div>POST /api/v1/autoforge/defects/upload (OpenCV/PyTorch)</div>
              <div>GET  /api/v1/dairyflow/batches & /temperature</div>
              <div>POST /api/v1/dairyflow/temperature-verification/ocr (Tesseract)</div>
              <div>GET  /api/v1/analytics/bottlenecks & /predictive</div>
              <div>GET  /api/v1/finance/ledger</div>
            </div>
            <div className="text-[11px] text-slate-500">
              MySQL Core Tables: <span className="font-mono">factories, manufacturing_stages, machines, vehicle_orders, vehicle_defect_inspections, dairy_batches, temperature_verifications, inventory_items, financial_ledgers, alerts</span>.
            </div>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
};
