import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  Users,
  Car,
  TrendingUp,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  getCurrentMonthString,
  getRecentMonths,
  formatINR,
  formatMonthYear,
  formatDate,
} from '../../lib/dateUtils';
import { StorageService } from '../../lib/storage';
import { PrintablePayslip } from './PrintablePayslip';
import { DailyWorkForm } from '../driver/DailyWorkForm';
import { WorkRecord, UserProfile } from '../../types';

export const MonthlyReport: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { drivers, workRecords, rates, deleteWorkRecord, removeDuplicates } = useApp();

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString());
  const [selectedDriverId, setSelectedDriverId] = useState<string>(
    isAdmin ? 'ALL' : (currentUser?.id || '')
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingRecord, setEditingRecord] = useState<WorkRecord | null>(null);
  const [showPayslipModal, setShowPayslipModal] = useState<boolean>(false);
  const [payslipDriver, setPayslipDriver] = useState<UserProfile | null>(null);

  const recentMonths = getRecentMonths(12);

  // Available drivers based on permissions
  const visibleDrivers = useMemo(() => {
    if (!isAdmin && currentUser) {
      return drivers.filter((d) => d.id === currentUser.id);
    }
    return drivers;
  }, [drivers, isAdmin, currentUser]);

  // Active drivers to compute summary for
  const targetDrivers = useMemo(() => {
    if (selectedDriverId === 'ALL') {
      return visibleDrivers;
    }
    return visibleDrivers.filter((d) => d.id === selectedDriverId);
  }, [visibleDrivers, selectedDriverId]);

  // Aggregate monthly summaries
  const summaries = useMemo(() => {
    return targetDrivers.map((driver) => ({
      driver,
      summary: StorageService.calculateMonthlySummary(driver.id, selectedMonth),
    }));
  }, [targetDrivers, selectedMonth, workRecords]);

  // Combined totals
  const combined = useMemo(() => {
    let regularDays = 0;
    let otDrives = 0;
    let regEarnings = 0;
    let otEarnings = 0;
    let gross = 0;
    let paid = 0;
    let balance = 0;

    summaries.forEach(({ summary }) => {
      regularDays += summary.totalRegularDays;
      otDrives += summary.totalOtDrives;
      regEarnings += summary.regularEarnings;
      otEarnings += summary.otEarnings;
      gross += summary.grossEarnings;
      paid += summary.totalPaid;
      balance += summary.outstandingBalance;
    });

    return {
      regularDays,
      otDrives,
      regEarnings,
      otEarnings,
      gross,
      paid,
      balance,
    };
  }, [summaries]);

  // Filter individual detailed work records
  const filteredRecords = useMemo(() => {
    const list: (WorkRecord & { driverName: string })[] = [];

    targetDrivers.forEach((driver) => {
      const records = workRecords.filter(
        (r) => r.driver_id === driver.id && r.work_date.startsWith(selectedMonth)
      );
      records.forEach((r) => {
        list.push({ ...r, driverName: driver.full_name });
      });
    });

    return list
      .filter((r) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          r.driverName.toLowerCase().includes(q) ||
          r.work_date.includes(q) ||
          (r.notes && r.notes.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.work_date.localeCompare(a.work_date));
  }, [targetDrivers, selectedMonth, workRecords, searchTerm]);

  // Export to standard CSV
  const handleExportCSV = () => {
    const headers = [
      'Work Date',
      'Driver Name',
      'Regular Shift',
      'Regular Rate (INR)',
      'Additional Drives (OT)',
      'OT Rate (INR)',
      'Regular Earnings (INR)',
      'OT Earnings (INR)',
      'Gross Daily Earnings (INR)',
      'Notes',
    ];

    const rows = filteredRecords.map((r) => [
      r.work_date,
      `"${r.driverName.replace(/"/g, '""')}"`,
      r.regular_shift ? 'Yes' : 'No',
      r.regular_rate || 800,
      r.ot_count,
      r.ot_rate || 800,
      r.regular_shift ? (r.regular_rate || 800) : 0,
      r.ot_count * (r.ot_rate || 800),
      r.total_earnings,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    // Add summary row at bottom
    rows.push([
      'TOTALS',
      `"${selectedDriverId === 'ALL' ? 'Combined Fleet' : (targetDrivers[0]?.full_name || '')}"`,
      `${combined.regularDays} Days`,
      '-',
      `${combined.otDrives} Drives`,
      '-',
      combined.regEarnings,
      combined.otEarnings,
      combined.gross,
      `"Total Paid: ${formatINR(combined.paid)}, Outstanding: ${formatINR(combined.balance)}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `driver-earnings-report-${selectedMonth}-${selectedDriverId.toLowerCase()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenPayslip = (driver: UserProfile) => {
    setPayslipDriver(driver);
    setShowPayslipModal(true);
  };

  const handleDeleteRecord = (record: WorkRecord) => {
    if (!isAdmin) return;
    if (window.confirm(`Are you sure you want to permanently delete work record for ${record.work_date} (Earnings: ${formatINR(record.total_earnings)})?`)) {
      deleteWorkRecord(record.id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Monthly Earnings Reports & Payslips
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Calculated from verified daily shift and OT records for {formatMonthYear(selectedMonth)}
          </p>
        </div>

        {/* Export & Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="touch-target px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {targetDrivers.length === 1 && (
            <button
              onClick={() => handleOpenPayslip(targetDrivers[0])}
              className="touch-target px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Payslip</span>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => {
                const res = removeDuplicates();
                if (res.removedCount > 0) {
                  alert(`Deduplication scan complete: Removed ${res.removedCount} duplicate record(s). Strictly 1 record per driver per date retained.`);
                } else {
                  alert(`Zero duplicates found! All ${res.remainingCount} work records are verified unique.`);
                }
              }}
              className="touch-target px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 border border-slate-700"
              title="Scan and clean any duplicate records"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Remove Duplicates</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Dropdown */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {recentMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Driver Filter (Admin only) */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="ALL">All 4 Drivers (Combined)</option>
                {drivers.map((drv) => (
                  <option key={drv.id} value={drv.id}>
                    {drv.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search filter */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search date, notes, driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Driver Summary Cards (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaries.map(({ driver, summary }) => (
          <div
            key={driver.id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {driver.full_name}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {driver.vehicle_number || 'Fleet'}
                  </span>
                </div>
                <button
                  onClick={() => handleOpenPayslip(driver)}
                  className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Voucher</span>
                </button>
              </div>

              <div className="mt-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Regular Days:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {summary.totalRegularDays} ({formatINR(summary.regularEarnings)})
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>OT Drives:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {summary.totalOtDrives} ({formatINR(summary.otEarnings)})
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-semibold">
                  <span>Gross Earnings:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {formatINR(summary.grossEarnings)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Total Paid:</span>
                  <span className="font-bold text-indigo-700 dark:text-indigo-400">
                    {formatINR(summary.totalPaid)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-400">
                Outstanding: {formatINR(summary.outstandingBalance)}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
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
          </div>
        ))}
      </div>

      {/* Detailed Work Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Daily Shift & OT Records
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Itemized daily breakdown showing snapshot rates and computed earnings
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {filteredRecords.length} records found
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No daily records found for {formatMonthYear(selectedMonth)}.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Driver</th>
                  <th className="py-3 px-3">Regular Shift</th>
                  <th className="py-3 px-3">OT Drives</th>
                  <th className="py-3 px-3">Rate Snapshot</th>
                  <th className="py-3 px-3">Daily Earnings</th>
                  <th className="py-3 px-3">Notes</th>
                  {isAdmin && <th className="py-3 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-xs sm:text-sm">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatDate(r.work_date)}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {r.driverName}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {r.regular_shift ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Yes ({formatINR(r.regular_rate || 800)})
                        </span>
                      ) : (
                        <span className="text-slate-400">No (₹0)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {r.ot_count > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                          <Car className="w-3 h-3 text-purple-600" />
                          {r.ot_count} OT ({formatINR(r.ot_count * (r.ot_rate || 800))})
                        </span>
                      ) : (
                        <span className="text-slate-400">0 OT</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 tabular-nums text-xs whitespace-nowrap">
                      ₹{r.regular_rate || 800} / ₹{r.ot_rate || 800}
                    </td>
                    <td className="py-3.5 px-3 font-black text-emerald-700 dark:text-emerald-400 tabular-nums text-base whitespace-nowrap">
                      {formatINR(r.total_earnings)}
                    </td>
                    <td className="py-3.5 px-3 max-w-xs truncate text-xs text-slate-500 dark:text-slate-400">
                      {r.notes || '-'}
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingRecord(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(r)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-xl my-8">
            <DailyWorkForm
              driverId={editingRecord.driver_id}
              initialRecord={editingRecord}
              onSuccess={() => setEditingRecord(null)}
              onCancel={() => setEditingRecord(null)}
            />
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {showPayslipModal && payslipDriver && (
        <PrintablePayslip
          driver={payslipDriver}
          monthPeriod={selectedMonth}
          summary={StorageService.calculateMonthlySummary(payslipDriver.id, selectedMonth)}
          onClose={() => setShowPayslipModal(false)}
        />
      )}
    </div>
  );
};
