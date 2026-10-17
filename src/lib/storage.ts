import { UserProfile, WorkRecord, PaymentRecord, AuditLog, AppRates } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { getTodayDateString } from './dateUtils';

const STORAGE_KEYS = {
  PROFILES: 'driver_mgmt_profiles',
  WORK_RECORDS: 'driver_mgmt_work_records',
  PAYMENTS: 'driver_mgmt_payments',
  AUDIT_LOGS: 'driver_mgmt_audit_logs',
  RATES: 'driver_mgmt_rates',
  ACTIVE_USER: 'driver_mgmt_active_user',
  THEME: 'driver_mgmt_theme',
};

// Default system rates
export const DEFAULT_RATES: AppRates = {
  regular_rate: 800,
  ot_rate: 800,
  allow_driver_edit_past_days: 2,
  system_name: 'Fleet Driver Salary Management',
  currency: 'INR',
  time_zone: 'Asia/Kolkata',
};

// Initial four drivers + admin
export const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'admin-1',
    email: 'admin@fleet.local',
    full_name: 'Vikram Singh (Admin)',
    phone: '+91 98765 43200',
    vehicle_number: 'FLEET-HQ',
    role: 'admin',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'drv-1',
    email: 'ramesh@driver.local',
    full_name: 'Ramesh Kumar',
    phone: '+91 98765 43210',
    vehicle_number: 'KA-01-EQ-1001',
    role: 'driver',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'drv-2',
    email: 'suresh@driver.local',
    full_name: 'Suresh Patel',
    phone: '+91 98765 43211',
    vehicle_number: 'KA-01-EQ-1002',
    role: 'driver',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'drv-3',
    email: 'rajesh@driver.local',
    full_name: 'Rajesh Sharma',
    phone: '+91 98765 43212',
    vehicle_number: 'KA-01-EQ-1003',
    role: 'driver',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'drv-4',
    email: 'mahesh@driver.local',
    full_name: 'Mahesh Verma',
    phone: '+91 98765 43213',
    vehicle_number: 'KA-01-EQ-1004',
    role: 'driver',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

// Generate seed records for realistic demonstration
function generateInitialRecords(): { records: WorkRecord[]; payments: PaymentRecord[]; logs: AuditLog[] } {
  const records: WorkRecord[] = [];
  const payments: PaymentRecord[] = [];
  const logs: AuditLog[] = [];

  const today = getTodayDateString();
  const [currYearStr, currMonthStr, currDayStr] = today.split('-');
  const currYear = parseInt(currYearStr, 10);
  const currMonth = parseInt(currMonthStr, 10);
  const currDay = parseInt(currDayStr, 10);

  // Populate days up to today for current month
  const drivers = INITIAL_PROFILES.filter((p) => p.role === 'driver');

  drivers.forEach((driver, dIdx) => {
    // Generate records for current month
    for (let day = 1; day <= currDay; day++) {
      // Simulate typical driving schedule: 6 days working, 1 day off
      const dayOfWeek = (day + dIdx) % 7;
      if (dayOfWeek === 0) continue; // Sunday off

      const dateStr = `${currYear}-${String(currMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Additional drives (OT): some days 0, some 1, some 2, occasional 3
      let ot = 0;
      if ((day + dIdx) % 4 === 0) ot = 2;
      else if ((day + dIdx) % 2 === 0) ot = 1;
      else if ((day * 3 + dIdx) % 7 === 0) ot = 3;

      const regShift = true;
      const regRate = 800;
      const otRate = 800;
      const earnings = (regShift ? regRate : 0) + (ot * otRate);

      records.push({
        id: `rec-${driver.id}-${dateStr}`,
        driver_id: driver.id,
        work_date: dateStr,
        regular_shift: regShift,
        ot_count: ot,
        regular_rate: regRate,
        ot_rate: otRate,
        total_earnings: earnings,
        notes: ot > 0 ? `Completed regular route + ${ot} airport / express pickup(s)` : 'Regular day shift',
        created_at: `${dateStr}T18:30:00.000Z`,
        updated_at: `${dateStr}T18:30:00.000Z`,
        created_by: driver.full_name,
      });
    }

    // Previous month: Add a recorded payment
    let prevYear = currYear;
    let prevMonth = currMonth - 1;
    if (prevMonth <= 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const prevMonthStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    
    // Add realistic payments
    if (dIdx === 0) {
      // Ramesh: Advance payment for current month
      payments.push({
        id: `pay-${driver.id}-1`,
        driver_id: driver.id,
        payment_date: `${currYearStr}-${currMonthStr}-05`,
        amount: 5000,
        month_period: `${currYearStr}-${currMonthStr}`,
        payment_method: 'upi',
        reference: 'UPI/2026/0912984928',
        notes: 'Mid-month diesel & allowance advance',
        created_at: `${currYearStr}-${currMonthStr}-05T10:00:00.000Z`,
        created_by: 'Vikram Singh (Admin)',
      });
    } else if (dIdx === 1) {
      // Suresh: Bank transfer
      payments.push({
        id: `pay-${driver.id}-1`,
        driver_id: driver.id,
        payment_date: `${currYearStr}-${currMonthStr}-08`,
        amount: 8000,
        month_period: `${currYearStr}-${currMonthStr}`,
        payment_method: 'bank_transfer',
        reference: 'IMPS/9812739182',
        notes: 'First installment payment',
        created_at: `${currYearStr}-${currMonthStr}-08T11:30:00.000Z`,
        created_by: 'Vikram Singh (Admin)',
      });
    }
  });

  logs.push({
    id: 'log-1',
    actor_id: 'admin-1',
    actor_name: 'Vikram Singh (Admin)',
    action: 'CREATE',
    entity_type: 'driver',
    entity_id: 'all',
    details: 'System initialized with 4 primary fleet driver profiles and default rates (₹800/shift, ₹800/OT).',
    created_at: `${currYearStr}-${currMonthStr}-01T00:00:00.000Z`,
  });

  return { records, payments, logs };
}

export class StorageService {
  private static isInitialized = false;

  public static initialize() {
    if (this.isInitialized) return;

    if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
    }

    if (!localStorage.getItem(STORAGE_KEYS.RATES)) {
      localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(DEFAULT_RATES));
    }

    if (!localStorage.getItem(STORAGE_KEYS.WORK_RECORDS)) {
      const { records, payments, logs } = generateInitialRecords();
      localStorage.setItem(STORAGE_KEYS.WORK_RECORDS, JSON.stringify(records));
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    }

    this.isInitialized = true;
  }

  // --- Profiles ---
  public static getProfiles(): UserProfile[] {
    this.initialize();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILES);
      return data ? JSON.parse(data) : INITIAL_PROFILES;
    } catch {
      return INITIAL_PROFILES;
    }
  }

  public static saveProfile(profile: UserProfile): void {
    const profiles = this.getProfiles();
    const idx = profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) {
      profiles[idx] = profile;
    } else {
      profiles.push(profile);
    }
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  }

  // --- Rates ---
  public static getRates(): AppRates {
    this.initialize();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RATES);
      return data ? JSON.parse(data) : DEFAULT_RATES;
    } catch {
      return DEFAULT_RATES;
    }
  }

  public static saveRates(rates: AppRates, actor: UserProfile): void {
    const oldRates = this.getRates();
    localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(rates));
    
    // Log rate update in audit log
    this.addAuditLog({
      id: `log-${Date.now()}`,
      actor_id: actor.id,
      actor_name: actor.full_name,
      action: 'RATE_CHANGE',
      entity_type: 'rate',
      entity_id: 'app_settings',
      details: `Rates updated: Regular ₹${oldRates.regular_rate} -> ₹${rates.regular_rate}, OT ₹${oldRates.ot_rate} -> ₹${rates.ot_rate}. Existing historical records preserve their recorded rate snapshots.`,
      created_at: new Date().toISOString(),
    });
  }

  // --- Work Records ---
  public static getWorkRecords(): WorkRecord[] {
    this.initialize();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORK_RECORDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save or Update a Work Record
   * Enforces business rules:
   * 1. OT count must be non-negative integer.
   * 2. Only ONE record allowed per driver per date (prevents duplicate regular shift).
   * 3. Freezes current regular_rate and ot_rate snapshot for new records.
   * 4. Accurately calculates total earnings = (regular_shift ? regular_rate : 0) + (ot_count * ot_rate).
   * 5. Writes an audit log entry for changes.
   */
  public static saveWorkRecord(
    recordData: {
      id?: string;
      driver_id: string;
      work_date: string;
      regular_shift: boolean;
      ot_count: number;
      notes?: string;
    },
    actor: UserProfile
  ): { success: boolean; record?: WorkRecord; error?: string } {
    this.initialize();

    // Validation 1: OT count non-negative
    const ot = Math.max(0, Math.floor(Number(recordData.ot_count) || 0));

    // Validation 2: Ensure valid date
    if (!recordData.work_date) {
      return { success: false, error: 'Work date is required.' };
    }

    const records = this.getWorkRecords();
    const rates = this.getRates();

    // Check for existing record on this date for this driver
    const existingIndex = records.findIndex(
      (r) => r.driver_id === recordData.driver_id && r.work_date === recordData.work_date
    );

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      // Editing existing record
      const existing = records[existingIndex];
      
      // Preserve original rate snapshot unless specifically admin override
      const regRate = existing.regular_rate || rates.regular_rate;
      const otRate = existing.ot_rate || rates.ot_rate;
      const earnings = (recordData.regular_shift ? regRate : 0) + (ot * otRate);

      const updatedRecord: WorkRecord = {
        ...existing,
        regular_shift: recordData.regular_shift,
        ot_count: ot,
        regular_rate: regRate,
        ot_rate: otRate,
        total_earnings: earnings,
        notes: recordData.notes?.trim() || '',
        updated_at: now,
      };

      records[existingIndex] = updatedRecord;
      localStorage.setItem(STORAGE_KEYS.WORK_RECORDS, JSON.stringify(records));

      this.addAuditLog({
        id: `log-${Date.now()}`,
        actor_id: actor.id,
        actor_name: actor.full_name,
        action: 'UPDATE',
        entity_type: 'work_record',
        entity_id: updatedRecord.id,
        details: `Updated entry for ${recordData.work_date}: Shift=${recordData.regular_shift ? 'Yes' : 'No'}, OT=${ot}, Total=₹${earnings} (Prev: Shift=${existing.regular_shift ? 'Yes' : 'No'}, OT=${existing.ot_count}, Total=₹${existing.total_earnings})`,
        created_at: now,
      });

      return { success: true, record: updatedRecord };
    } else {
      // Create new record
      const regRate = rates.regular_rate;
      const otRate = rates.ot_rate;
      const earnings = (recordData.regular_shift ? regRate : 0) + (ot * otRate);

      const newRecord: WorkRecord = {
        id: recordData.id || `rec-${recordData.driver_id}-${recordData.work_date}`,
        driver_id: recordData.driver_id,
        work_date: recordData.work_date,
        regular_shift: recordData.regular_shift,
        ot_count: ot,
        regular_rate: regRate,
        ot_rate: otRate,
        total_earnings: earnings,
        notes: recordData.notes?.trim() || '',
        created_at: now,
        updated_at: now,
        created_by: actor.full_name,
      };

      records.push(newRecord);
      localStorage.setItem(STORAGE_KEYS.WORK_RECORDS, JSON.stringify(records));

      this.addAuditLog({
        id: `log-${Date.now()}`,
        actor_id: actor.id,
        actor_name: actor.full_name,
        action: 'CREATE',
        entity_type: 'work_record',
        entity_id: newRecord.id,
        details: `Created entry for ${recordData.work_date}: Shift=${recordData.regular_shift ? 'Yes' : 'No'}, OT=${ot}, Total=₹${earnings}`,
        created_at: now,
      });

      return { success: true, record: newRecord };
    }
  }

  /**
   * Delete a work record (Admin only or permitted)
   */
  public static deleteWorkRecord(recordId: string, actor: UserProfile): boolean {
    const records = this.getWorkRecords();
    const existing = records.find((r) => r.id === recordId);
    if (!existing) return false;

    const filtered = records.filter((r) => r.id !== recordId);
    localStorage.setItem(STORAGE_KEYS.WORK_RECORDS, JSON.stringify(filtered));

    this.addAuditLog({
      id: `log-${Date.now()}`,
      actor_id: actor.id,
      actor_name: actor.full_name,
      action: 'DELETE',
      entity_type: 'work_record',
      entity_id: recordId,
      details: `Deleted work record for ${existing.work_date} (Earnings: ₹${existing.total_earnings})`,
      created_at: new Date().toISOString(),
    });

    return true;
  }

  // --- Payments ---
  public static getPayments(): PaymentRecord[] {
    this.initialize();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static addPayment(
    paymentData: Omit<PaymentRecord, 'id' | 'created_at' | 'created_by'>,
    actor: UserProfile
  ): PaymentRecord {
    const payments = this.getPayments();
    const now = new Date().toISOString();
    const newPayment: PaymentRecord = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      created_at: now,
      created_by: actor.full_name,
    };

    payments.push(newPayment);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));

    this.addAuditLog({
      id: `log-${Date.now()}`,
      actor_id: actor.id,
      actor_name: actor.full_name,
      action: 'PAYMENT',
      entity_type: 'payment',
      entity_id: newPayment.id,
      details: `Recorded payment of ₹${paymentData.amount} for period ${paymentData.month_period} via ${paymentData.payment_method.toUpperCase()}${paymentData.reference ? ` (Ref: ${paymentData.reference})` : ''}`,
      created_at: now,
    });

    return newPayment;
  }

  public static deletePayment(paymentId: string, actor: UserProfile): boolean {
    const payments = this.getPayments();
    const existing = payments.find((p) => p.id === paymentId);
    if (!existing) return false;

    const filtered = payments.filter((p) => p.id !== paymentId);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(filtered));

    this.addAuditLog({
      id: `log-${Date.now()}`,
      actor_id: actor.id,
      actor_name: actor.full_name,
      action: 'DELETE',
      entity_type: 'payment',
      entity_id: paymentId,
      details: `Deleted payment record of ₹${existing.amount} for period ${existing.month_period}`,
      created_at: new Date().toISOString(),
    });

    return true;
  }

  // --- Audit Logs ---
  public static getAuditLogs(): AuditLog[] {
    this.initialize();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      const logs: AuditLog[] = data ? JSON.parse(data) : [];
      return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch {
      return [];
    }
  }

  public static addAuditLog(log: AuditLog): void {
    const logs = this.getAuditLogs();
    logs.unshift(log);
    // Keep last 500 logs to maintain lightweight local storage
    if (logs.length > 500) {
      logs.length = 500;
    }
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  // --- Calculations for Monthly Reports ---
  public static calculateMonthlySummary(driverId: string, monthPeriod: string): {
    totalRegularDays: number;
    totalOtDrives: number;
    regularEarnings: number;
    otEarnings: number;
    grossEarnings: number;
    totalPaid: number;
    outstandingBalance: number;
    paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
    records: WorkRecord[];
    payments: PaymentRecord[];
  } {
    const allRecords = this.getWorkRecords();
    const allPayments = this.getPayments();

    // Filter by driver and month prefix (YYYY-MM)
    const records = allRecords
      .filter((r) => r.driver_id === driverId && r.work_date.startsWith(monthPeriod))
      .sort((a, b) => a.work_date.localeCompare(b.work_date));

    const payments = allPayments
      .filter((p) => p.driver_id === driverId && p.month_period === monthPeriod)
      .sort((a, b) => a.payment_date.localeCompare(b.payment_date));

    let totalRegularDays = 0;
    let totalOtDrives = 0;
    let regularEarnings = 0;
    let otEarnings = 0;

    records.forEach((r) => {
      if (r.regular_shift) {
        totalRegularDays += 1;
        regularEarnings += (r.regular_rate || 800);
      }
      totalOtDrives += (r.ot_count || 0);
      otEarnings += (r.ot_count || 0) * (r.ot_rate || 800);
    });

    const grossEarnings = regularEarnings + otEarnings;
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const outstandingBalance = Math.max(0, grossEarnings - totalPaid);

    let paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' = 'UNPAID';
    if (grossEarnings > 0) {
      if (totalPaid >= grossEarnings) {
        paymentStatus = 'PAID';
      } else if (totalPaid > 0) {
        paymentStatus = 'PARTIALLY_PAID';
      }
    } else if (totalPaid > 0) {
      paymentStatus = 'PAID';
    }

    return {
      totalRegularDays,
      totalOtDrives,
      regularEarnings,
      otEarnings,
      grossEarnings,
      totalPaid,
      outstandingBalance,
      paymentStatus,
      records,
      payments,
    };
  }

  // --- Reset to Factory Demo Data ---
  public static resetToFactoryDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
    localStorage.removeItem(STORAGE_KEYS.WORK_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.RATES);
    this.isInitialized = false;
    this.initialize();
  }
}
