import React, { useState, useEffect, useId } from 'react';
import { CheckCircle2, AlertCircle, Plus, Minus, Calendar, Car, Clock, FileText, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getTodayDateString, formatDate, formatINR, isDateEditable } from '../../lib/dateUtils';
import { WorkRecord } from '../../types';

interface DailyWorkFormProps {
  driverId?: string; // If admin is entering on behalf of driver
  initialRecord?: WorkRecord | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const DailyWorkForm: React.FC<DailyWorkFormProps> = ({
  driverId,
  initialRecord,
  onSuccess,
  onCancel,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const { rates, saveWorkRecord, workRecords, drivers } = useApp();

  const activeDriverId = driverId || (isAdmin ? drivers[0]?.id : currentUser?.id) || '';
  const [selectedDriverId, setSelectedDriverId] = useState<string>(activeDriverId);
  const [workDate, setWorkDate] = useState<string>(initialRecord?.work_date || getTodayDateString());
  const [regularShift, setRegularShift] = useState<boolean>(
    initialRecord !== undefined && initialRecord !== null ? initialRecord.regular_shift : true
  );
  const [otCount, setOtCount] = useState<number>(initialRecord?.ot_count || 0);
  const [notes, setNotes] = useState<string>(initialRecord?.notes || '');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [existingRecord, setExistingRecord] = useState<WorkRecord | null>(null);

  // Form field IDs for accessible labels
  const formDriverId = useId();
  const formWorkDateId = useId();
  const formOtCountId = useId();
  const formNotesId = useId();

  // Current active rates
  const currentRegularRate = initialRecord?.regular_rate || rates.regular_rate;
  const currentOtRate = initialRecord?.ot_rate || rates.ot_rate;

  // Live calculated earnings
  const regularEarnings = regularShift ? currentRegularRate : 0;
  const otEarnings = otCount * currentOtRate;
  const totalEarnings = regularEarnings + otEarnings;

  // Detect if an entry already exists for this driver and date
  useEffect(() => {
    if (!selectedDriverId || !workDate) return;
    const found = workRecords.find(
      (r) => r.driver_id === selectedDriverId && r.work_date === workDate
    );
    if (found && (!initialRecord || found.id !== initialRecord.id)) {
      setExistingRecord(found);
    } else {
      setExistingRecord(null);
    }
  }, [selectedDriverId, workDate, workRecords, initialRecord]);

  const handleOtChange = (val: number) => {
    const clamped = Math.max(0, Math.min(20, Math.floor(val)));
    setOtCount(clamped);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!selectedDriverId) {
      setError('Please select a driver.');
      return;
    }

    if (!workDate) {
      setError('Please choose a valid work date.');
      return;
    }

    // Date editing window check for drivers
    if (!isAdmin && !isDateEditable(workDate, rates.allow_driver_edit_past_days)) {
      setError(`Drivers can only submit or edit work records for the last ${rates.allow_driver_edit_past_days} days. Please contact admin for older dates.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = saveWorkRecord({
        id: initialRecord?.id || existingRecord?.id,
        driver_id: selectedDriverId,
        work_date: workDate,
        regular_shift: regularShift,
        ot_count: otCount,
        notes: notes,
      });

      if (!result.success) {
        setError(result.error || 'Failed to save record.');
        setIsSubmitting(false);
        return;
      }

      // Trigger delightful celebration
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });

      setSuccessMsg(
        existingRecord
          ? `Work record updated! Total: ${formatINR(totalEarnings)}`
          : `Work recorded successfully! Total: ${formatINR(totalEarnings)}`
      );

      setIsSubmitting(false);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  const selectedDriverProfile = drivers.find((d) => d.id === selectedDriverId);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xl max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Car className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            {initialRecord ? 'Edit Work Entry' : 'Log Daily Work'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quick 30-second daily shift & additional drive (OT) logger
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          Rate: {formatINR(currentRegularRate)}/shift
        </span>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {existingRecord && !initialRecord && (
        <div className="mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Duplicate Protected:</strong> An entry already exists for this date (Current: {existingRecord.regular_shift ? 'Yes' : 'No'}, {existingRecord.ot_count} OT, {formatINR(existingRecord.total_earnings)}). Submitting will update this record and will not create a duplicate.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        {/* Driver selector (Admin only) */}
        {isAdmin && (
          <div>
            <label htmlFor={formDriverId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Select Driver
            </label>
            <select
              id={formDriverId}
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {drivers.map((drv) => (
                <option key={drv.id} value={drv.id}>
                  {drv.full_name} ({drv.vehicle_number || 'Fleet'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Work Date Selection */}
        <div>
          <label htmlFor={formWorkDateId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Work Date (Asia/Kolkata)
          </label>
          <div className="relative">
            <input
              id={formWorkDateId}
              type="date"
              value={workDate}
              max={getTodayDateString()}
              onChange={(e) => setWorkDate(e.target.value)}
              className="w-full px-4 py-3 pl-11 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
            <Calendar className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            Selected: <strong className="text-slate-700 dark:text-slate-200">{formatDate(workDate)}</strong>
          </span>
        </div>

        {/* Regular Shift Completed Toggle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Regular Shift Completed?
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {formatINR(currentRegularRate)}/day
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Regular Shift Completed">
            <button
              type="button"
              role="radio"
              aria-checked={regularShift}
              onClick={() => setRegularShift(true)}
              className={`touch-target py-3.5 px-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 border transition-all ${
                regularShift
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>YES ({formatINR(currentRegularRate)})</span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={!regularShift}
              onClick={() => setRegularShift(false)}
              className={`touch-target py-3.5 px-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 border transition-all ${
                !regularShift
                  ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>NO (₹0)</span>
            </button>
          </div>
        </div>

        {/* Additional Drives (OT) Stepper */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor={formOtCountId} className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Additional Drives / OT
            </label>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {formatINR(currentOtRate)} per extra drive
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleOtChange(otCount - 1)}
              disabled={otCount <= 0}
              aria-label="Decrease additional drives"
              className="touch-target w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center border border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Minus className="w-6 h-6" />
            </button>

            <div className="flex-1 text-center">
              <input
                id={formOtCountId}
                type="number"
                min="0"
                max="20"
                value={otCount}
                onChange={(e) => handleOtChange(parseInt(e.target.value, 10) || 0)}
                aria-label="Number of additional drives"
                className="w-full text-center text-3xl font-extrabold py-2 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                {otCount} extra drive{otCount === 1 ? '' : 's'} = {formatINR(otEarnings)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleOtChange(otCount + 1)}
              aria-label="Increase additional drives"
              className="touch-target w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center border border-emerald-700 hover:bg-emerald-700 shadow-sm transition-all"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label htmlFor={formNotesId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Optional Notes (Route, Toll, Trip info)
          </label>
          <input
            id={formNotesId}
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Airport return drop, highway toll included"
            className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Live Calculation Preview Banner */}
        <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60">
          <div className="flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-300 font-medium pb-2 border-b border-emerald-200/60 dark:border-emerald-800/40">
            <span>Calculation Breakdown:</span>
            <span>
              {regularShift ? `Regular (${formatINR(currentRegularRate)})` : 'No regular shift'} + OT ({otCount} × {formatINR(currentOtRate)})
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2.5">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Total Earnings for Date:
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {formatINR(totalEarnings)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="touch-target flex-1 py-3.5 px-5 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="touch-target flex-[2] py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>{isSubmitting ? 'Saving...' : initialRecord ? 'Update Record' : 'Confirm & Save Work'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
