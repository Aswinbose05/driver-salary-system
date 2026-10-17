import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { DriverDashboard } from './components/driver/DriverDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MonthlyReport } from './components/reports/MonthlyReport';
import { AuditLogViewer } from './components/audit/AuditLogViewer';
import { SettingsView } from './components/settings/SettingsView';
import { TIME_ZONE, CURRENCY_SYMBOL } from './lib/dateUtils';

const MainLayout: React.FC = () => {
  const { currentUser, isAdmin, isLoading } = useAuth();
  const { rates } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold">Loading Driver Management System...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isAdmin ? (
          <>
            {activeTab === 'dashboard' && <AdminDashboard onNavigateTab={setActiveTab} />}
            {activeTab === 'reports' && <MonthlyReport />}
            {activeTab === 'audit' && <AuditLogViewer />}
            {activeTab === 'settings' && <SettingsView />}
          </>
        ) : (
          <>
            {activeTab === 'dashboard' && <DriverDashboard />}
            {activeTab === 'reports' && <MonthlyReport />}
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <span>© {new Date().getFullYear()} {rates.system_name}</span>
            <span>•</span>
            <span>Currency: Indian Rupees ({CURRENCY_SYMBOL})</span>
            <span>•</span>
            <span>Timezone: {TIME_ZONE}</span>
          </div>

          <div className="flex items-center gap-3 font-semibold text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Shift: ₹{rates.regular_rate}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              OT: ₹{rates.ot_rate}
            </span>
            <span className="text-slate-400">4 Active Drivers</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </AuthProvider>
  );
}
