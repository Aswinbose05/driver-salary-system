import React from 'react';
import { Printer, X, Car, Calendar, CheckCircle2 } from 'lucide-react';
import { UserProfile, WorkRecord, PaymentRecord } from '../../types';
import { formatINR, formatMonthYear, formatDate, getTodayDateString } from '../../lib/dateUtils';

interface PrintablePayslipProps {
  driver: UserProfile;
  monthPeriod: string;
  summary: {
    totalRegularDays: number;
    totalOtDrives: number;
    regularEarnings: number;
    otEarnings: number;
    grossEarnings: number;
    totalPaid: number;
    outstandingBalance: number;
    paymentStatus: string;
    records: WorkRecord[];
    payments: PaymentRecord[];
  };
  onClose: () => void;
}

export const PrintablePayslip: React.FC<PrintablePayslipProps> = ({
  driver,
  monthPeriod,
  summary,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const todayStr = getTodayDateString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-300 shadow-2xl max-w-3xl w-full my-8 print:p-0 print:border-none print:shadow-none">
        {/* Modal Controls (Hidden in print) */}
        <div className="no-print flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              Printable Salary Statement
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="touch-target px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div className="print-card p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl">
          {/* Company Header */}
          <div className="flex items-start justify-between pb-6 border-b-2 border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black">
                  FP
                </div>
                <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
                  FleetPay Transport & Logistics
                </h1>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Fleet Driver Earnings & Monthly Salary Disbursement Voucher
              </p>
              <p className="text-[11px] text-slate-500">
                Official Statement • Currency: INR (₹) • Timezone: Asia/Kolkata
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-md bg-slate-100 border border-slate-300 text-xs font-black uppercase tracking-widest text-slate-800">
                Payslip Voucher
              </span>
              <p className="text-xs font-bold text-slate-700 mt-2">
                Period: {formatMonthYear(monthPeriod)}
              </p>
              <p className="text-[11px] text-slate-500">
                Date Issued: {formatDate(todayStr)}
              </p>
            </div>
          </div>

          {/* Driver & Vehicle Information */}
          <div className="my-6 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Driver Name</span>
              <strong className="text-sm font-black text-slate-900">{driver.full_name}</strong>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Vehicle Number</span>
              <strong className="text-sm font-bold text-slate-900 font-mono">{driver.vehicle_number || 'Fleet'}</strong>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Contact Number</span>
              <strong className="text-slate-800">{driver.phone || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Payment Status</span>
              <strong className={`font-black uppercase ${
                summary.paymentStatus === 'PAID'
                  ? 'text-emerald-700'
                  : summary.paymentStatus === 'PARTIALLY_PAID'
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}>
                {summary.paymentStatus.replace('_', ' ')}
              </strong>
            </div>
          </div>

          {/* Salary Breakdown Table */}
          <div className="mb-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
              Monthly Earnings Breakdown
            </h3>
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Earning Component</th>
                  <th className="py-2.5 px-3 text-center">Quantity / Days</th>
                  <th className="py-2.5 px-3 text-right">Applicable Rate</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    Regular Driving Shift
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold">
                    {summary.totalRegularDays} working days
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">
                    ₹800 / day
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                    {formatINR(summary.regularEarnings)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    Additional Drives (Overtime OT)
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold">
                    {summary.totalOtDrives} extra drives
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">
                    ₹800 / drive
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                    {formatINR(summary.otEarnings)}
                  </td>
                </tr>
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                  <td className="py-3 px-3 uppercase text-slate-900" colSpan={3}>
                    Gross Total Monthly Earnings
                  </td>
                  <td className="py-3 px-3 text-right text-base font-black text-emerald-700 tabular-nums">
                    {formatINR(summary.grossEarnings)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment & Disbursements Table */}
          <div className="mb-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
              Disbursements & Advance Settlement
            </h3>
            {summary.payments.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-200">
                No payments have been recorded for this month yet.
              </p>
            ) : (
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3">Reference / Remarks</th>
                    <th className="py-2 px-3 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 px-3">{formatDate(p.payment_date)}</td>
                      <td className="py-2 px-3 uppercase font-semibold text-slate-700">{p.payment_method}</td>
                      <td className="py-2 px-3 text-slate-600">{p.reference || p.notes || '-'}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">
                        {formatINR(p.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t border-slate-300">
                    <td className="py-2 px-3" colSpan={3}>Total Disbursed</td>
                    <td className="py-2 px-3 text-right font-bold text-indigo-700 tabular-nums">
                      {formatINR(summary.totalPaid)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Net Settlement Balance Box */}
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-extrabold text-slate-700 block">
                Net Outstanding Balance Payable
              </span>
              <span className="text-[11px] text-slate-500">
                Gross Earnings ({formatINR(summary.grossEarnings)}) − Total Paid ({formatINR(summary.totalPaid)})
              </span>
            </div>
            <span className="text-2xl font-black text-slate-900 tabular-nums">
              {formatINR(summary.outstandingBalance)}
            </span>
          </div>

          {/* Signatures for physical documentation */}
          <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-600">
            <div>
              <div className="h-12 border-b border-dashed border-slate-400"></div>
              <p className="mt-2 font-bold text-slate-800">Driver Signature</p>
              <p className="text-[10px] text-slate-500">{driver.full_name}</p>
            </div>

            <div className="text-right">
              <div className="h-12 border-b border-dashed border-slate-400"></div>
              <p className="mt-2 font-bold text-slate-800">Fleet Operations Manager</p>
              <p className="text-[10px] text-slate-500">Authorized Signature & Seal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
