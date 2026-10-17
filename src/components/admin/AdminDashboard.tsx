import React, { useState } from 'react';
import {
  Users,
  IndianRupee,
  TrendingUp,
  CreditCard,
  AlertCircle,
  PlusCircle,
  Settings,
  Download,
  Calendar,
  Car,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  UserPlus,
  ShieldCheck,
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
import {
  getCurrentMonthString,
  getTodayDateString,
  formatINR,
  formatMonthYear,
  formatDate,
} from '../../lib/dateUtils';
import { StorageService } from '../../lib/storage';
import { DailyWorkForm } from '../driver/DailyWorkForm';
import { PaymentModal } from './PaymentModal';
import { DriverManagementModal } from './DriverManagementModal';
import { UserProfile } from '../../types';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { currentUser } = useAuth();
  const { drivers, workRecords, payments, rates, selectedMonth, removeDuplicates } = useApp();

  const [showWorkModal, setShowWorkModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showDriverModal, setShowDriverModal] = useState<boolean>(false);
  const [targetDriverId, setTargetDriverId] = useState<string>('');
  const [dedupMsg, setDedupMsg] = useState<string | null>(null);

  const currentMonthStr = getCurrentMonthString();
  const todayStr = getTodayDateString();

  // Aggregate metrics across ALL drivers for the current month
  let fleetGross = 0;
  let fleetRegularDays = 0;
  let fleetOtDrives = 0;
  let fleetPaid = 0;
  let fleetOutstanding = 0;

  // Calculate per-driver statistics
  const driverSummaries = drivers.map((driver) => {
    const summary = StorageService.calculateMonthlySummary(driver.id, currentMonthStr);
    fleetGross += summary.grossEarnings;
    fleetRegularDays += summary.totalRegularDays;
    fleetOtDrives += summary.totalOtDrives;
    fleetPaid += summary.totalPaid;
    fleetOutstanding += summary.outstandingBalance;

    // Check today's entry
    const todayRec = workRecords.find(
      (r) => r.driver_id === driver.id && r.work_date === todayStr
    );

    return {
      driver,
      summary,
      todayRec,
    };
  });

  // Today's total logged fleet earnings
  const todayRecords = workRecords.filter((r) => r.work_date === todayStr);
  const todayFleetEarnings = todayRecords.reduce((sum, r) => sum + r.total_earnings, 0);

  // Prepare 4-driver comparison chart data
  const comparisonChartData = driverSummaries.map((item) => ({
    name: item.driver.full_name.split(' ')[0], // First name for clean mobile chart
    fullName: item.driver.full_name,
    regular: item.summary.regularEarnings,
    ot: item.summary.otEarnings,
    total: item.summary.grossEarnings,
    paid: item.summary.totalPaid,
    balance: item.summary.outstandingBalance,
  }));

  const handleOpenPayment = (driverId?: string) => {
    setTargetDriverId(driverId || (drivers[0]?.id || ''));
    setShowPaymentModal(true);
  };

  const handleOpenWorkEntry = (driverId?: string) => {
    setTargetDriverId(driverId || (drivers[0]?.id || ''));
    setShowWorkModal(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Fleet Hero Header with Quick Admin Actions */}
      <div className="rounded-3xl p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-5 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Fleet Operations & Payroll
            </span>
            <span className="text-xs text-slate-300">
              {drivers.length} Active Fleet Drivers
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1.5 tracking-tight">
            Fleet Overview & Monthly Salary Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Managing earnings, OT drives, rates (₹{rates.regular_rate}/day, ₹{rates.ot_rate}/OT), and payment disbursements.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenWorkEntry()}
            className="touch-target px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Work Entry</span>
          </button>

          <button
            onClick={() => handleOpenPayment()}
            className="touch-target px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={() => setShowDriverModal(true)}
            className="touch-target px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Drivers</span>
          </button>

          <button
            onClick={() => {
              const res = removeDuplicates();
              if (res.removedCount > 0) {
                setDedupMsg(`Deduplication scan complete: Removed ${res.removedCount} duplicate record(s). Strictly 1 record per driver per date retained.`);
              } else {
                setDedupMsg(`Verified: 0 duplicate records found. All ${res.remainingCount} work records are unique.`);
              }
              setTimeout(() => setDedupMsg(null), 4000);
            }}
            className="touch-target px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-1.5"
            title="Scan database to prevent and remove any duplicate records"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Remove Duplicates</span>
          </button>
        </div>
      </div>

      {dedupMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{dedupMsg}</span>
        </div>
      )}

      {/* Combined Fleet KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="Today's Fleet Total"
          value={formatINR(todayFleetEarnings)}
          subtitle={`${todayRecords.length} / ${drivers.length} drivers logged`}
          icon={IndianRupee}
          variant="emerald"
        />

        <StatCard
          title="Combined Monthly Gross"
          value={formatINR(fleetGross)}
          subtitle={formatMonthYear(currentMonthStr)}
          icon={TrendingUp}
          variant="blue"
        />

        <StatCard
          title="Total Working Days"
          value={fleetRegularDays}
          subtitle={`₹${rates.regular_rate}/day rate`}
          icon={Calendar}
          variant="slate"
        />

        <StatCard
          title="Total OT Drives"
          value={fleetOtDrives}
          subtitle={`₹${rates.ot_rate}/OT rate`}
          icon={Car}
          variant="purple"
        />

        <StatCard
          title="Total Disbursed"
          value={formatINR(fleetPaid)}
          subtitle="Payments recorded"
          icon={CreditCard}
          variant="emerald"
        />

        <StatCard
          title="Fleet Balance Due"
          value={formatINR(fleetOutstanding)}
          subtitle={fleetOutstanding > 0 ? 'Pending payout' : 'All cleared'}
          icon={AlertCircle}
          variant={fleetOutstanding > 0 ? 'amber' : 'slate'}
        />
      </div>

      {/* 4 Drivers Performance & Earnings Comparison Cards */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Driver Earnings & Balance Summary — {formatMonthYear(currentMonthStr)}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Individual driver breakdowns, today's work status, and instant payment actions
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('reports')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>Detailed Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {driverSummaries.map(({ driver, summary, todayRec }) => (
            <div
              key={driver.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      {driver.full_name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {driver.vehicle_number || 'KA-01'} • {driver.phone || 'Fleet'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      summary.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : summary.paymentStatus === 'PARTIALLY_PAID'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {summary.paymentStatus.replace('_', ' ')}
                  </span>
                </div>

                {/* Today's status */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Today's Work:</span>
                  {todayRec ? (
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {todayRec.regular_shift ? '1 Shift' : 'Off'}, {todayRec.ot_count} OT ({formatINR(todayRec.total_earnings)})
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenWorkEntry(driver.id)}
                      className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      + Log Today
                    </button>
                  )}
                </div>

                {/* Month Metrics */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Regular Days:</span>
                    <strong className="text-slate-900 dark:text-slate-200">
                      {summary.totalRegularDays} days ({formatINR(summary.regularEarnings)})
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>OT Drives:</span>
                    <strong className="text-slate-900 dark:text-slate-200">
                      {summary.totalOtDrives} drives ({formatINR(summary.otEarnings)})
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Gross Earnings:</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-bold">
                      {formatINR(summary.grossEarnings)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Paid to Date:</span>
                    <strong className="text-emerald-700 dark:text-emerald-400">
                      {formatINR(summary.totalPaid)}
                    </strong>
                  </div>
                </div>

                {/* Outstanding balance badge */}
                <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Balance Due:
                  </span>
                  <span className="text-lg font-black text-amber-800 dark:text-amber-400 tabular-nums">
                    {formatINR(summary.outstandingBalance)}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => handleOpenWorkEntry(driver.id)}
                  className="touch-target flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all text-center"
                >
                  Work Entry
                </button>
                <button
                  onClick={() => handleOpenPayment(driver.id)}
                  className="touch-target flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all text-center"
                >
                  Pay Driver
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4-Driver Comparison Chart (Regular vs OT vs Paid) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Fleet Comparison: Earnings & OT Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparative analysis across all drivers for {formatMonthYear(currentMonthStr)}
            </p>
          </div>
        </div>

        <div className="mt-5 h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 'bold' }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(val: any, name: string) => [
                  formatINR(Number(val)),
                  name === 'regular' ? 'Regular Shift Pay' : name === 'ot' ? 'OT Drives Pay' : 'Paid to Date',
                ]}
                labelFormatter={(name) => `Driver: ${comparisonChartData.find(d => d.name === name)?.fullName || name}`}
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: '#334155',
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend />
              <Bar dataKey="regular" name="Regular Shift (₹)" stackId="earnings" fill="#10b981" radius={[0, 0, 4, 4]} />
              <Bar dataKey="ot" name="OT Drives (₹)" stackId="earnings" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="paid" name="Disbursed (₹)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modals */}
      {showWorkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-xl my-8">
            <DailyWorkForm
              driverId={targetDriverId}
              onSuccess={() => setShowWorkModal(false)}
              onCancel={() => setShowWorkModal(false)}
            />
          </div>
        </div>
      )}

      {showPaymentModal && (
        <PaymentModal
          driverId={targetDriverId}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {showDriverModal && (
        <DriverManagementModal
          onClose={() => setShowDriverModal(false)}
        />
      )}
    </div>
  );
};
