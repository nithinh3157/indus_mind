import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ClipboardCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calcQualityAcceptanceRate, formatNumber, formatPercent } from '../utils/calculations';
import { KpiCard, SectionPanel, SimulatedBanner, StatusLabel } from '../components/common/UiPrimitives';

export const QualityManagementPage: React.FC = () => {
  const { qualityMetrics, vehicleDefects, dairyBatches, tempVerifications } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'autoforge' | 'dairyflow'>('autoforge');

  const afQ = qualityMetrics.filter((q) => q.industry === 'autoforge');
  const dfQ = qualityMetrics.filter((q) => q.industry === 'dairyflow');

  const afInspected = afQ.reduce((s, q) => s + q.inspectedUnits, 0);
  const afAccepted = afQ.reduce((s, q) => s + q.acceptedUnits, 0);
  const afRework = afQ.reduce((s, q) => s + q.reworkCount, 0);
  const afRejected = afQ.reduce((s, q) => s + q.rejectedUnits, 0);

  const dfInspected = dfQ.reduce((s, q) => s + q.inspectedUnits, 0);
  const dfAccepted = dfQ.reduce((s, q) => s + q.acceptedUnits, 0);
  const dfRejected = dfQ.reduce((s, q) => s + q.rejectedUnits, 0);

  return (
    <div className="space-y-6">
      <SimulatedBanner label="Unified Quality Management · Simulated QC inspection rates, defect counts, and lab metrics" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Quality Management & Defect Governance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Stage acceptance rates, rework tracking, contamination logs, and visual evidence verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
            <button
              onClick={() => setTab('autoforge')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium ${
                tab === 'autoforge'
                  ? 'bg-[#0A1628] text-white dark:bg-blue-600'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              AutoForge Quality
            </button>
            <button
              onClick={() => setTab('dairyflow')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium ${
                tab === 'dairyflow'
                  ? 'bg-emerald-700 text-white dark:bg-emerald-600'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              DairyFlow Lab Quality
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="AutoForge Acceptance Rate"
          value={formatPercent(calcQualityAcceptanceRate(afAccepted, afInspected))}
          subtitle={`${afRework} rework · ${afRejected} rejected`}
          tone="positive"
        />
        <KpiCard
          title="DairyFlow Acceptance Rate"
          value={formatPercent(calcQualityAcceptanceRate(dfAccepted, dfInspected))}
          subtitle={`${formatNumber(dfRejected)} L rejected`}
          tone="positive"
        />
        <KpiCard
          title="Vehicle Visual Evidence Logs"
          value={`${vehicleDefects.length}`}
          subtitle={`${vehicleDefects.filter((d) => d.verificationStatus === 'Pending CV Model').length} pending review`}
          tone="warning"
        />
        <KpiCard
          title="Dairy Temp Evidence Audits"
          value={`${tempVerifications.length}`}
          subtitle={`${tempVerifications.filter((v) => !v.humanConfirmed).length} awaiting expert verification`}
          tone="warning"
        />
      </div>

      {tab === 'autoforge' ? (
        <div className="space-y-6">
          <SectionPanel
            title="AutoForge Stage-Wise Quality Breakdown"
            subtitle="Welding, Painting, Component Assembly, and Final Optical Inspection"
            actions={
              <button
                onClick={() => navigate('/autoforge')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload Vehicle Panel Image</span>
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2 pr-3 font-medium">Stage</th>
                    <th className="py-2 pr-3 font-medium text-right">Inspected</th>
                    <th className="py-2 pr-3 font-medium text-right">Accepted</th>
                    <th className="py-2 pr-3 font-medium text-right">Defects</th>
                    <th className="py-2 pr-3 font-medium text-right">Rework</th>
                    <th className="py-2 pr-3 font-medium text-right">Rejected</th>
                    <th className="py-2 font-medium text-right">Acceptance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {afQ.map((q) => (
                    <tr key={q.stage}>
                      <td className="py-2.5 pr-3 font-medium">{q.stage}</td>
                      <td className="py-2.5 pr-3 text-right font-mono">{q.inspectedUnits}</td>
                      <td className="py-2.5 pr-3 text-right font-mono">{q.acceptedUnits}</td>
                      <td className="py-2.5 pr-3 text-right font-mono">{q.defectCount}</td>
                      <td className="py-2.5 pr-3 text-right font-mono">{q.reworkCount}</td>
                      <td className="py-2.5 pr-3 text-right font-mono">{q.rejectedUnits}</td>
                      <td className="py-2.5 text-right font-mono font-semibold">
                        {formatPercent(calcQualityAcceptanceRate(q.acceptedUnits, q.inspectedUnits))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionPanel>
        </div>
      ) : (
        <SectionPanel
          title="DairyFlow Lab Composition & Contamination Incidents (Simulated)"
          subtitle="Fat %, SNF %, Acidity %, batch inspection outcomes, and thermal verification links"
          actions={
            <button
              onClick={() => navigate('/dairyflow/temperature-verification')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Expert Temp Verification</span>
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-2 pr-3 font-medium">Batch ID</th>
                  <th className="py-2 pr-3 font-medium">Product</th>
                  <th className="py-2 pr-3 font-medium text-right">Fat %</th>
                  <th className="py-2 pr-3 font-medium text-right">SNF %</th>
                  <th className="py-2 pr-3 font-medium text-right">Acidity %</th>
                  <th className="py-2 pr-3 font-medium">Incident / Lab Notes</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dairyBatches.map((b) => (
                  <tr key={b.batchId}>
                    <td className="py-2.5 pr-3 font-mono font-medium whitespace-nowrap">{b.batchId}</td>
                    <td className="py-2.5 pr-3">{b.productType}</td>
                    <td className="py-2.5 pr-3 text-right font-mono">{b.fatPercent}%</td>
                    <td className="py-2.5 pr-3 text-right font-mono">{b.snfPercent}%</td>
                    <td className="py-2.5 pr-3 text-right font-mono">{b.acidityPercent}%</td>
                    <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300 max-w-md">
                      {b.contaminationIncident || 'No contamination or thermal deviations recorded.'}
                    </td>
                    <td className="py-2.5 whitespace-nowrap">
                      <StatusLabel status={b.qualityStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionPanel>
      )}
    </div>
  );
};
