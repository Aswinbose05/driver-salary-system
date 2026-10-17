import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WorkRecord, PaymentRecord, AuditLog, AppRates, UserProfile } from '../types';
import { StorageService, DEFAULT_RATES } from '../lib/storage';
import { getCurrentMonthString } from '../lib/dateUtils';
import { useAuth } from './AuthContext';

interface AppContextType {
  workRecords: WorkRecord[];
  payments: PaymentRecord[];
  auditLogs: AuditLog[];
  rates: AppRates;
  profiles: UserProfile[];
  drivers: UserProfile[];
  selectedMonth: string;
  theme: 'light' | 'dark';
  setSelectedMonth: (month: string) => void;
  toggleTheme: () => void;
  saveWorkRecord: (data: {
    id?: string;
    driver_id: string;
    work_date: string;
    regular_shift: boolean;
    ot_count: number;
    notes?: string;
  }) => { success: boolean; record?: WorkRecord; error?: string };
  deleteWorkRecord: (recordId: string) => boolean;
  addPayment: (data: Omit<PaymentRecord, 'id' | 'created_at' | 'created_by'>) => PaymentRecord;
  deletePayment: (paymentId: string) => boolean;
  updateRates: (newRates: AppRates) => void;
  saveProfile: (profile: UserProfile) => void;
  resetDemoData: () => void;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [rates, setRates] = useState<AppRates>(DEFAULT_RATES);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('driver_mgmt_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('driver_mgmt_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const refreshData = useCallback(() => {
    StorageService.initialize();
    setWorkRecords(StorageService.getWorkRecords());
    setPayments(StorageService.getPayments());
    setAuditLogs(StorageService.getAuditLogs());
    setRates(StorageService.getRates());
    setProfiles(StorageService.getProfiles());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const saveWorkRecord = (data: {
    id?: string;
    driver_id: string;
    work_date: string;
    regular_shift: boolean;
    ot_count: number;
    notes?: string;
  }) => {
    if (!currentUser) return { success: false, error: 'User is not authenticated' };
    const result = StorageService.saveWorkRecord(data, currentUser);
    if (result.success) {
      refreshData();
    }
    return result;
  };

  const deleteWorkRecord = (recordId: string) => {
    if (!currentUser) return false;
    const ok = StorageService.deleteWorkRecord(recordId, currentUser);
    if (ok) refreshData();
    return ok;
  };

  const addPayment = (data: Omit<PaymentRecord, 'id' | 'created_at' | 'created_by'>) => {
    if (!currentUser) throw new Error('Not authenticated');
    const payment = StorageService.addPayment(data, currentUser);
    refreshData();
    return payment;
  };

  const deletePayment = (paymentId: string) => {
    if (!currentUser) return false;
    const ok = StorageService.deletePayment(paymentId, currentUser);
    if (ok) refreshData();
    return ok;
  };

  const updateRates = (newRates: AppRates) => {
    if (!currentUser) return;
    StorageService.saveRates(newRates, currentUser);
    refreshData();
  };

  const saveProfile = (profile: UserProfile) => {
    StorageService.saveProfile(profile);
    refreshData();
  };

  const resetDemoData = () => {
    StorageService.resetToFactoryDefaults();
    refreshData();
  };

  const drivers = profiles.filter((p) => p.role === 'driver');

  return (
    <AppContext.Provider
      value={{
        workRecords,
        payments,
        auditLogs,
        rates,
        profiles,
        drivers,
        selectedMonth,
        theme,
        setSelectedMonth,
        toggleTheme,
        saveWorkRecord,
        deleteWorkRecord,
        addPayment,
        deletePayment,
        updateRates,
        saveProfile,
        resetDemoData,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
