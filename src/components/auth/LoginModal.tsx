import React, { useState, useId } from 'react';
import { LogIn, X, AlertCircle, Shield, Car, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

interface LoginModalProps {
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const { login, availableProfiles, switchUser } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const emailId = useId();
  const passwordId = useId();

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Invalid login credentials.');
      return;
    }

    onClose();
  };

  const handleFastSwitch = (userId: string) => {
    switchUser(userId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <LogIn className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Account Sign In
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Driver & Administrator Authentication
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

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Fast Login Buttons */}
        <div className="mt-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Quick 1-Click Role Access (Demo)
          </span>
          <div className="space-y-2">
            {availableProfiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleFastSwitch(p.id)}
                className="w-full p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    p.role === 'admin'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {p.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <Car className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-900 dark:text-white block">
                      {p.full_name}
                    </strong>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {p.email} • {p.role.toUpperCase()}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Select →
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">or sign in with password</span>
          </div>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleManualLogin} className="space-y-3.5">
          <div>
            <label htmlFor={emailId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Email Address
            </label>
            <input
              id={emailId}
              type="email"
              placeholder="e.g. admin@fleet.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor={passwordId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Password {isSupabaseConfigured && <span className="text-rose-500">*</span>}
            </label>
            <input
              id={passwordId}
              type="password"
              placeholder={isSupabaseConfigured ? 'Enter your password' : 'Optional in demo mode'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="touch-target w-full mt-2 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
