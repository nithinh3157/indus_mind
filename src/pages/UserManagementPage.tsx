import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  SearchInput,
  SectionPanel,
  StatusLabel,
} from '../components/common/UiPrimitives';
import { UserAccount, UserRole } from '../types/indusmind';

export const UserManagementPage: React.FC = () => {
  const { users, factories, addUserAccount } = useApp();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('DairyFlow Quality Expert');
  const [assignedFactory, setAssignedFactory] = useState(factories[0]?.name || 'All INDUSMIND Sites');
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.includes('@')) {
      setFormError('Provide a valid operator name and email address.');
      return;
    }
    setFormError(null);
    const access: UserAccount['industryAccess'] = role.includes('AutoForge')
      ? 'autoforge'
      : role.includes('DairyFlow')
      ? 'dairyflow'
      : 'all';

    addUserAccount({
      id: `USR-${String(users.length + 1).padStart(2, '0')}`,
      name: name.trim(),
      email: email.trim(),
      role,
      assignedFactory,
      industryAccess: access,
      status: 'Active',
      lastLogin: 'Never (Newly Provisioned)',
    });
    setName('');
    setEmail('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
          User & Role Access Management
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage single-sign-on operators across AutoForge, DairyFlow, and Corporate Analytics
        </p>
      </div>

      <SectionPanel
        title="Authorized Personnel Directory"
        subtitle="Role-based industry access permissions (simulated directory)"
        actions={
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, role..." />
            <button
              onClick={() => setShowAdd((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-blue-600 text-white text-xs font-medium whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Operator</span>
            </button>
          </div>
        }
      >
        {showAdd && (
          <form
            onSubmit={handleAddUser}
            className="mb-5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3 text-xs"
          >
            {formError && <div className="text-rose-600">{formError}</div>}
            <div className="grid sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Priya Nair"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@indusmind.io"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option>Plant Director</option>
                  <option>AutoForge Operations Lead</option>
                  <option>DairyFlow Quality Expert</option>
                  <option>Maintenance Engineer</option>
                  <option>Financial Analyst</option>
                  <option>Systems Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">Assigned Facility</label>
                <select
                  value={assignedFactory}
                  onChange={(e) => setAssignedFactory(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option>All INDUSMIND Sites</option>
                  {factories.map((f) => (
                    <option key={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-blue-600 text-white font-medium"
            >
              Provision Account
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-2 pr-3 font-medium">User</th>
                <th className="py-2 pr-3 font-medium">Role</th>
                <th className="py-2 pr-3 font-medium">Assigned Factory</th>
                <th className="py-2 pr-3 font-medium">Module Access</th>
                <th className="py-2 pr-3 font-medium">Last Login</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 pr-3">
                    <div className="font-medium text-slate-900 dark:text-white">{u.name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{u.email}</div>
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap">{u.role}</td>
                  <td className="py-2.5 pr-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {u.assignedFactory}
                  </td>
                  <td className="py-2.5 pr-3 font-mono uppercase text-[11px]">{u.industryAccess}</td>
                  <td className="py-2.5 pr-3 font-mono text-slate-500 whitespace-nowrap">{u.lastLogin}</td>
                  <td className="py-2.5 whitespace-nowrap">
                    <StatusLabel status={u.status} />
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
