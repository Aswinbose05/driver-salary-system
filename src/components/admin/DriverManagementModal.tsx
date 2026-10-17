import React, { useState, useId } from 'react';
import { Users, X, UserPlus, CheckCircle2, AlertCircle, Edit2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { UserProfile } from '../../types';
import { StorageService } from '../../lib/storage';

interface DriverManagementModalProps {
  onClose: () => void;
}

export const DriverManagementModal: React.FC<DriverManagementModalProps> = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { drivers, saveProfile } = useApp();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Accessible IDs for inputs
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const vehicleId = useId();
  const statusId = useId();

  const handleStartAdd = () => {
    setIsEditing(true);
    setEditingId(null);
    setFullName('');
    setEmail('');
    setPhone('+91 ');
    setVehicleNumber('KA-01-');
    setIsActive(true);
    setError(null);
  };

  const handleStartEdit = (driver: UserProfile) => {
    setIsEditing(true);
    setEditingId(driver.id);
    setFullName(driver.full_name);
    setEmail(driver.email);
    setPhone(driver.phone || '');
    setVehicleNumber(driver.vehicle_number || '');
    setIsActive(driver.is_active);
    setError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError('Driver full name is required.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const profile: UserProfile = {
        id: editingId || `drv-${Date.now()}`,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        phone: phone.trim(),
        vehicle_number: vehicleNumber.trim().toUpperCase(),
        role: 'driver',
        is_active: isActive,
        created_at: editingId ? (drivers.find((d) => d.id === editingId)?.created_at || now) : now,
      };

      saveProfile(profile);

      if (currentUser) {
        StorageService.addAuditLog({
          id: `log-${Date.now()}`,
          actor_id: currentUser.id,
          actor_name: currentUser.full_name,
          action: editingId ? 'UPDATE' : 'CREATE',
          entity_type: 'driver',
          entity_id: profile.id,
          details: `${editingId ? 'Updated' : 'Created'} driver profile: ${profile.full_name} (${profile.vehicle_number || 'N/A'})`,
          created_at: now,
        });
      }

      setSuccess(`Driver ${profile.full_name} saved successfully.`);
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save driver profile.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Driver Accounts Management
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage fleet drivers, contact numbers, and vehicle assignments
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
            <span className="font-bold">{success}</span>
          </div>
        )}

        {/* Content Mode: List or Form */}
        {isEditing ? (
          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={nameId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  id={nameId}
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor={emailId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Email (Login ID)
                </label>
                <input
                  id={emailId}
                  type="email"
                  placeholder="ramesh@driver.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={phoneId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Phone Number
                </label>
                <input
                  id={phoneId}
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor={vehicleId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Assigned Vehicle No.
                </label>
                <input
                  id={vehicleId}
                  type="text"
                  placeholder="KA-01-EQ-1001"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor={statusId} className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Account Status
              </label>
              <select
                id={statusId}
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="true">Active (Can log work and view salary)</option>
                <option value="false">Inactive / Suspended</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="touch-target flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm"
              >
                Back to List
              </button>
              <button
                type="submit"
                className="touch-target flex-[2] py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{editingId ? 'Update Driver Profile' : 'Save New Driver'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {drivers.length} Registered Drivers
              </span>
              <button
                onClick={handleStartAdd}
                className="touch-target inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Driver</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-slate-700 dark:text-slate-300 text-sm">
                      {driver.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {driver.full_name}
                        </h4>
                        {!driver.is_active && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {driver.email} • {driver.phone || 'No phone'} • <span className="font-mono">{driver.vehicle_number || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartEdit(driver)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    title="Edit Driver"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={onClose}
                className="touch-target py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
