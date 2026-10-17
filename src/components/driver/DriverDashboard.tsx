import React, { useState } from 'react';
import {
  IndianRupee,
  Calendar,
  Clock,
  Car,
  TrendingUp,
  CreditCard,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  Edit2,
  FileText,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import { DailyWorkForm } from './DailyWorkForm';
import {
  getTodayDateString,
  getCurrentMonthString,
  formatDate,
  formatINR,
  formatMonthYear,
  isDateEditable,
} from '../../lib/dateUtils';
import { StorageService } from '../../lib/storage';
import { WorkRecord } from '../../types';

export const DriverDashboard: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { workRecords, payments, rates, selectedMonth } = useApp();
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<WorkRecord | null>(null);

  if (!currentUser) return null;

  const driverId = currentUser.id;
  const todayStr = getTodayDateString();
  const currentMonthStr = getCurrentMonthString();

  // Today's record
  const todayRecord = workRecords.find(
    (r) => r.driver_id === driverId && r.work_date === todayStr
  );
  const todayEarnings = todayRecord ? todayRecord.total_earnings : 0;

  // Monthly summary
  const summary = StorageService.calculateMonthlySummary(driverId, currentMonthStr);

  // Filter records for recent activity (last 10 records)
  const driverRecords = workRecords
    .filter((r) => r.driver_id === driverId)
    .sort((a, b) => b.work_date.localeCompare(a.work_date));

  const recentRecords = driverRecords.slice(0, 10);

  // Prepare chart data for the current month
  // Group days of the month
  const chartData = summary.records.map((r) => {
    const dayNumber = r.work_date.split('-')[2];
    const regEarnings = r.regular_shift ? (r.regular_rate || 800) : 0;
    const otEarnings = (r.ot_count || 0) * (r.ot_rate || 800);
    return {
      date: `${dayNumber} ${formatDate(r.work_date).split(' ')[1]}`,
      regular: regEarnings,
      ot: otEarnings,
      total: r.total_earnings,
      otCount: r.ot_count,
    };
  });

  const handleEditClick = (record: WorkRecord) => {
    setEditingRecord(record);
    setShowLogModal(true);
  };

  const handleCloseModal = () => {
    setShowLogModal(false);
    setEditingRecord(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Driver Welcome & Quick Action Bar */}
      <div className="rounded-3xl p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Driver Portal
            </span>
            <span className="text-xs text-slate-300">Vehicle: {currentUser.vehicle_number || 'KA-01'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1.5 tracking-tight">
            Namaste, {currentUser.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Today is {formatDate(todayStr)}. Keep track of your daily shifts and OT drives.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRecord(todayRecord || null);
            setShowLogModal(true);
          }}
          className="touch-target px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          <span>{todayRecord ? "Update Today's Work" : "Log Today's Work"}</span>
        </button>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Today's Earnings"
          value={formatINR(todayEarnings)}
          subtitle={todayRecord ? `${todayRecord.regular_shift ? '1 Shift' : 'No shift'}, ${todayRecord.ot_count} OT` : 'No entry logged yet'}
          icon={IndianRupee}
          variant="emerald"
        />

        <StatCard
          title="This Month's Gross"
          value={formatINR(summary.grossEarnings)}
          subtitle={formatMonthYear(currentMonthStr)}
          icon={TrendingUp}
          variant="blue"
        />

        <StatCard
          title="Regular Days"
          value={summary.totalRegularDays}
          subtitle={`Earnings: ${formatINR(summary.regularEarnings)}`}
          icon={Calendar}
          variant="slate"
        />

        <StatCard
          title="Total OT Drives"
          value={summary.totalOtDrives}
          subtitle={`OT Pay: ${formatINR(summary.otEarnings)}`}
          icon={Car}
          variant="purple"
        />

        <StatCard
          title="Total Received"
          value={formatINR(summary.totalPaid)}
          subtitle={`${summary.payments.length} payment(s)`}
          icon={CreditCard}
          variant="emerald"
        />

        <StatCard
          title="Balance Due"
          value={formatINR(summary.outstandingBalance)}
          subtitle={summary.paymentStatus === 'PAID' ? 'Fully Cleared' : 'Pending Payment'}
          icon={AlertCircle}
          variant={summary.outstandingBalance > 0 ? 'amber' : 'slate'}
        />
      </div>

      {/* Monthly Chart Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Daily Earnings Breakdown — {formatMonthYear(currentMonthStr)}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Green represents regular shift earnings; Purple represents additional OT drive earnings.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              Regular: {formatINR(summary.regularEarnings)}
            </span>
            <span className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400">
              <span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span>
              OT: {formatINR(summary.otEarnings)}
            </span>
          </div>
        </div>

        <div className="mt-5 h-64 sm:h-72 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Car className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">No work records logged for this month yet.</p>
              <button
                onClick={() => setShowLogModal(true)}
                className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Log your first shift today
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    formatINR(Number(val)),
                    name === 'regular' ? 'Regular Shift' : 'OT Drives',
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: '#334155',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="regular" name="Regular Shift (₹)" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="ot" name="OT Drives (₹)" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Recent Work Records
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing your latest daily entries
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {recentRecords.length} recorded
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          {recentRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No recent work recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Regular Shift</th>
                  <th className="py-3 px-3">OT Drives</th>
                  <th className="py-3 px-3">Rates Snapshot</th>
                  <th className="py-3 px-3">Total Earned</th>
                  <th className="py-3 px-3">Notes</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {recentRecords.map((rec) => {
                  const editable = isDateEditable(rec.work_date, rates.allow_driver_edit_past_days) || isAdmin;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-slate-900 dark:text-white">
                        {formatDate(rec.work_date)}
                        {rec.work_date === todayStr && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            TODAY
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {rec.regular_shift ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Completed ({formatINR(rec.regular_rate || 800)})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Off (₹0)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {rec.ot_count > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                            <Car className="w-3.5 h-3.5 text-purple-600" />
                            {rec.ot_count} drive{rec.ot_count === 1 ? '' : 's'} ({formatINR(rec.ot_count * (rec.ot_rate || 800))})
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">0 extra drives</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        Reg: {formatINR(rec.regular_rate || 800)} | OT: {formatINR(rec.ot_rate || 800)}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums text-base">
                        {formatINR(rec.total_earnings)}
                      </td>
                      <td className="py-3.5 px-3 max-w-xs truncate text-xs text-slate-600 dark:text-slate-400">
                        {rec.notes || '-'}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap text-right">
                        {editable ? (
                          <button
                            onClick={() => handleEditClick(rec)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Locked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Log Work Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-xl my-8">
            <DailyWorkForm
              driverId={driverId}
              initialRecord={editingRecord}
              onSuccess={handleCloseModal}
              onCancel={handleCloseModal}
            />
          </div>
        </div>
      )}
    </div>
  );
};
