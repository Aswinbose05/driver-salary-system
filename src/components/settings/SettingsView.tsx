import React, { useState, useId } from 'react';
import {
  Settings,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { formatINR } from '../../lib/dateUtils';

export const SettingsView: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { rates, updateRates, resetDemoData } = useApp();

  const [regularRate, setRegularRate] = useState<string>(String(rates.regular_rate));
  const [otRate, setOtRate] = useState<string>(String(rates.ot_rate));
  const [allowPastDays, setAllowPastDays] = useState<string>(String(rates.allow_driver_edit_past_days));
  const [systemName, setSystemName] = useState<string>(rates.system_name);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form IDs
  const regularRateId = useId();
  const otRateId = useId();
  const allowPastDaysId = useId();
  const systemNameId = useId();

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admin Privileges Required</h2>
        <p className="text-xs text-slate-500 mt-1">
          Only authorized fleet administrators can modify application settings and rate structures.
        </p>
      </div>
    );
  }

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const reg = parseFloat(regularRate);
    const ot = parseFloat(otRate);
    const days = parseInt(allowPastDays, 10);

    if (isNaN(reg) || reg < 0) {
      setError('Please provide a valid non-negative regular shift rate.');
      return;
    }

    if (isNaN(ot) || ot < 0) {
      setError('Please provide a valid non-negative OT drive rate.');
      return;
    }

    updateRates({
      regular_rate: reg,
      ot_rate: ot,
      allow_driver_edit_past_days: isNaN(days) ? 0 : days,
      system_name: systemName.trim() || 'Fleet Driver Salary Management',
      currency: 'INR',
      time_zone: 'Asia/Kolkata',
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all mock records, payments, and logs back to the initial 4-driver demonstration state?'
      )
    ) {
      resetDemoData();
      alert('Demo data has been reset to factory defaults.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          Fleet Rates & Configuration Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure payment rates, driver permissions, and financial rules. Historical records preserve their rates snapshot.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">Settings and payment rates updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <IndianRupee className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Standard Payment Rates (INR ₹)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor={regularRateId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Regular Driving Day Rate
              </label>
              <div className="relative">
                <input
                  id={regularRateId}
                  type="number"
                  step="1"
                  min="0"
                  value={regularRate}
                  onChange={(e) => setRegularRate(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black text-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none tabular-nums"
                  required
                />
                <span className="absolute left-3.5 top-3.5 text-slate-400 font-bold">₹</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Standard payment for 1 regular day shift (Default: ₹800)
              </span>
            </div>

            <div>
              <label htmlFor={otRateId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Additional Drive (OT) Rate
              </label>
              <div className="relative">
                <input
                  id={otRateId}
                  type="number"
                  step="1"
                  min="0"
                  value={otRate}
                  onChange={(e) => setOtRate(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-black text-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none tabular-nums"
                  required
                />
                <span className="absolute left-3.5 top-3.5 text-slate-400 font-bold">₹</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Payment per extra overtime drive (Default: ₹800)
              </span>
            </div>
          </div>

          {/* Historical Integrity Guarantee Banner */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">Historical Financial Integrity Protection:</strong>
              When payment rates are modified here, all newly created work records will apply these new rates. Previously recorded work entries in the database permanently preserve their original snapshot rates, ensuring past salary slips and audit balances never change retroactively.
            </div>
          </div>

          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Driver Permissions & General Settings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor={allowPastDaysId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Driver Past Record Edit Window
              </label>
              <select
                id={allowPastDaysId}
                value={allowPastDays}
                onChange={(e) => setAllowPastDays(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="0">Today Only (0 past days)</option>
                <option value="1">Yesterday & Today (1 past day)</option>
                <option value="2">Up to 2 days ago (Recommended)</option>
                <option value="7">Up to 7 days ago</option>
                <option value="30">Current Month (Up to 30 days)</option>
              </select>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Drivers can edit submitted records within this window. Admins can edit any date.
              </span>
            </div>

            <div>
              <label htmlFor={systemNameId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Application Brand Title
              </label>
              <input
                id={systemNameId}
                type="text"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="touch-target px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Save & Apply Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* Backend & Environment Status Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Backend Storage Engine & Free Deployment Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-500 font-bold block mb-1">Database Mode:</span>
            {isSupabaseConfigured ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Live Supabase PostgreSQL Connected
              </span>
            ) : (
              <div>
                <span className="text-indigo-700 dark:text-indigo-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Local High-Fidelity Persistent Storage Active
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ready out of the box with zero setup. Set <code className="text-slate-700 dark:text-slate-300 font-mono">VITE_SUPABASE_URL</code> & <code className="text-slate-700 dark:text-slate-300 font-mono">VITE_SUPABASE_ANON_KEY</code> in <code className="font-mono">.env</code> to connect cloud PostgreSQL.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-slate-500 font-bold block mb-1">Currency & Timezone:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Indian Rupee (INR ₹) • Asia/Kolkata (IST +05:30)
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              Complies with Indian date and currency formatting standards.
            </p>
          </div>
        </div>

        {/* Demo reset action */}
        <div className="pt-2 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Need to restart testing from a clean slate?
          </p>
          <button
            type="button"
            onClick={handleResetData}
            className="touch-target px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Factory Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
