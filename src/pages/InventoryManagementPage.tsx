import React, { useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatNumber } from '../utils/calculations';
import {
  KpiCard,
  SearchInput,
  SectionPanel,
  SimulatedBanner,
  StatusLabel,
} from '../components/common/UiPrimitives';

export const InventoryManagementPage: React.FC = () => {
  const { inventory, industryScope, restockInventoryItem } = useApp();
  const [search, setSearch] = useState('');
  const [filterInd, setFilterInd] = useState<'all' | 'autoforge' | 'dairyflow'>(
    industryScope === 'autoforge' || industryScope === 'dairyflow' ? industryScope : 'all'
  );
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState<number>(20);

  const filtered = inventory.filter((item) => {
    const indMatch = filterInd === 'all' || item.industry === filterInd;
    const textMatch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    return indMatch && textMatch;
  });

  const criticalCount = filtered.filter((i) => i.status === 'Critical Reorder').length;
  const lowCount = filtered.filter((i) => i.status === 'Low Stock').length;
  const totalValuation = filtered.reduce((s, i) => s + i.currentStock * i.unitCost, 0);

  const handleRestock = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (restockQty <= 0) return;
    restockInventoryItem(id, restockQty);
    setRestockId(null);
  };

  return (
    <div className="space-y-6">
      <SimulatedBanner label="Unified Materials & Cold-Chain Inventory · Stock levels, consumption, and wastage are simulated" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Tracked Inventory SKUs" value={`${filtered.length}`} subtitle="Raw materials, parts & packaging" />
        <KpiCard
          title="Critical Reorder Alerts"
          value={`${criticalCount}`}
          subtitle={`${lowCount} items in Low Stock buffer`}
          tone={criticalCount > 0 ? 'critical' : 'positive'}
        />
        <KpiCard
          title="Simulated Stock Valuation"
          value={formatCurrency(totalValuation)}
          subtitle="Current on-hand inventory value"
        />
        <KpiCard
          title="Wastage Incidents Tracked"
          value={`${filtered.reduce((s, i) => s + (i.wastageUnits > 0 ? 1 : 0), 0)} SKUs`}
          subtitle="Material scrap & film waste monitored"
          tone="warning"
        />
      </div>

      <SectionPanel
        title="Inventory Stock, Consumption & Reorder Control"
        subtitle="Steel, EV components, coatings, chilled raw milk, pouch film rolls, and labels"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              {(['all', 'autoforge', 'dairyflow'] as const).map((ind) => (
                <button
                  key={ind}
                  onClick={() => setFilterInd(ind)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                    filterInd === ind
                      ? 'bg-slate-900 text-white dark:bg-blue-600'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {ind === 'all' ? 'All' : ind === 'autoforge' ? 'AutoForge' : 'DairyFlow'}
                </button>
              ))}
            </div>
            <SearchInput value={search} onChange={setSearch} placeholder="Search SKU, material..." />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-2 pr-3 font-medium">SKU & Material</th>
                <th className="py-2 pr-3 font-medium">Industry / Category</th>
                <th className="py-2 pr-3 font-medium text-right">Current Stock</th>
                <th className="py-2 pr-3 font-medium text-right">Reorder At</th>
                <th className="py-2 pr-3 font-medium text-right">Daily Use</th>
                <th className="py-2 pr-3 font-medium text-right">Wastage</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 pr-3">
                    <div className="font-medium text-slate-900 dark:text-white">{item.name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{item.sku}</div>
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {item.industry === 'autoforge' ? 'AutoForge' : 'DairyFlow'} · {item.category}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono font-semibold whitespace-nowrap">
                    {formatNumber(item.currentStock)} {item.unit}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono text-slate-500 whitespace-nowrap">
                    {formatNumber(item.reorderLevel)} {item.unit}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono whitespace-nowrap">
                    {formatNumber(item.dailyConsumption)} /day
                  </td>
                  <td className="py-2.5 pr-3 text-right font-mono whitespace-nowrap">
                    {item.wastageUnits} {item.unit}
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap">
                    <StatusLabel status={item.status} />
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    {restockId === item.id ? (
                      <form
                        onSubmit={(e) => handleRestock(e, item.id)}
                        className="inline-flex items-center gap-1.5"
                      >
                        <input
                          type="number"
                          min={1}
                          value={restockQty}
                          onChange={(e) => setRestockQty(Number(e.target.value))}
                          className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs"
                        />
                        <button
                          type="submit"
                          className="px-2 py-1 rounded bg-emerald-700 text-white text-[11px] font-medium"
                        >
                          Add
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          setRestockId(item.id);
                          setRestockQty(Math.max(10, Math.round(item.reorderLevel * 0.5)));
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium"
                      >
                        <PackagePlus className="w-3 h-3" />
                        <span>Restock</span>
                      </button>
                    )}
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
