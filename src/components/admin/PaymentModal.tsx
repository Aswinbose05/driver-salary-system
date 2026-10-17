import React, { useState, useEffect, useId } from 'react';
import { CreditCard, X, CheckCircle2, AlertCircle, Sparkles, IndianRupee, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';
import {
  getTodayDateString,
  getCurrentMonthString,
  getRecentMonths,
  formatINR,
  formatMonthYear,
} from '../../lib/dateUtils';
import { StorageService } from '../../lib/storage';

interface PaymentModalProps {
  driverId?: string;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ driverId, onClose }) => {
  const { drivers, addPayment, payments } = useApp();
  const initialDriverId = driverId || (drivers[0]?.id || '');
  
  const [selectedDriverId, setSelectedDriverId] = useState<string>(initialDriverId);
  const [monthPeriod, setMonthPeriod] = useState<string>(getCurrentMonthString());
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDateString());
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Form IDs for accessible labels
  const formDriverId = useId();
  const formMonthPeriodId = useId();
  const formPaymentDateId = useId();
  const formAmountId = useId();
  const formPaymentMethodId = useId();
  const formReferenceId = useId();
  const formNotesId = useId();

  // Dynamic summary of selected driver & month
  const [summary, setSummary] = useState(() =>
    StorageService.calculateMonthlySummary(initialDriverId, getCurrentMonthString())
  );

  useEffect(() => {
    if (selectedDriverId && monthPeriod) {
      const s = StorageService.calculateMonthlySummary(selectedDriverId, monthPeriod);
      setSummary(s);
      // Auto-suggest outstanding balance if empty
      if (s.outstandingBalance > 0 && !amount) {
        setAmount(String(s.outstandingBalance));
      }
    }
  }, [selectedDriverId, monthPeriod]);

  const handlePayFull = () => {
    if (summary.outstandingBalance > 0) {
      setAmount(String(summary.outstandingBalance));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    try {
      addPayment({
        driver_id: selectedDriverId,
        payment_date: paymentDate,
        amount: numAmount,
        month_period: monthPeriod,
        payment_method: paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to record payment.');
    }
  };

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId);
  const recentMonths = getRecentMonths(12);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Record Driver Payment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Disburse full or partial monthly salary/advance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-bold">Payment of {formatINR(parseFloat(amount))} successfully recorded!</span>
          </div>
        )}

        {/* Driver Salary Status Preview */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
            <span>Period:</span>
            <strong className="text-slate-900 dark:text-slate-200">{formatMonthYear(monthPeriod)}</strong>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Gross Monthly Earnings:</span>
            <strong className="text-slate-900 dark:text-slate-200">{formatINR(summary.grossEarnings)}</strong>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Already Paid:</span>
            <strong className="text-emerald-700 dark:text-emerald-400">{formatINR(summary.totalPaid)}</strong>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700 font-bold">
            <span className="text-amber-800 dark:text-amber-300">Outstanding Balance:</span>
            <div className="flex items-center gap-2">
              <span className="text-base text-amber-800 dark:text-amber-300 tabular-nums">
                {formatINR(summary.outstandingBalance)}
              </span>
              {summary.outstandingBalance > 0 && (
                <button
                  type="button"
                  onClick={handlePayFull}
                  className="px-2 py-0.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]"
                >
                  Pay Full
                </button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Driver & Month selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={formDriverId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Driver
              </label>
              <select
                id={formDriverId}
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {drivers.map((drv) => (
                  <option key={drv.id} value={drv.id}>
                    {drv.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={formMonthPeriodId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Covered Month
              </label>
              <select
                id={formMonthPeriodId}
                value={monthPeriod}
                onChange={(e) => setMonthPeriod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {recentMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Date & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={formPaymentDateId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Payment Date
              </label>
              <input
                id={formPaymentDateId}
                type="date"
                value={paymentDate}
                max={getTodayDateString()}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor={formAmountId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Amount (INR ₹)
              </label>
              <div className="relative">
                <input
                  id={formAmountId}
                  type="number"
                  step="1"
                  min="1"
                  placeholder="e.g. 15000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-base font-extrabold focus:ring-2 focus:ring-indigo-500 focus:outline-none tabular-nums"
                  required
                />
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
              </div>
            </div>
          </div>

          {/* Payment Method & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={formPaymentMethodId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Payment Method
              </label>
              <select
                id={formPaymentMethodId}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                <option value="bank_transfer">Bank Transfer (IMPS / NEFT)</option>
                <option value="cash">Cash Voucher</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor={formReferenceId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Reference / Txn ID
              </label>
              <input
                id={formReferenceId}
                type="text"
                placeholder="e.g. UPI/2026/8291..."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor={formNotesId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Payment Remarks
            </label>
            <input
              id={formNotesId}
              type="text"
              placeholder="e.g. Monthly salary final settlement + food allowance"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="touch-target flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="touch-target flex-[2] py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Confirm & Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
