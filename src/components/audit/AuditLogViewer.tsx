import React, { useState } from 'react';
import { History, Search, ShieldCheck, Clock, User, Filter, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTime } from '../../lib/dateUtils';
import { AuditAction } from '../../types';

export const AuditLogViewer: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      log.actor_name.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q)
    );
  });

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'DELETE':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'RATE_CHANGE':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'PAYMENT':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            System Audit Trail & History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete tamper-evident log of all record insertions, edits, deletions, rate changes, and payments
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Audit Trail Active</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="RATE_CHANGE">RATE_CHANGE</option>
            <option value="PAYMENT">PAYMENT</option>
            <option value="LOGIN">LOGIN</option>
          </select>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search details or actor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72 pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No audit logs found matching criteria.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-3">Timestamp (IST)</th>
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Entity</th>
                  <th className="py-3 px-3">Change Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-xs sm:text-sm">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-xs">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {log.actor_name}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 uppercase font-semibold text-xs whitespace-nowrap">
                      {log.entity_type}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300 font-normal">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
