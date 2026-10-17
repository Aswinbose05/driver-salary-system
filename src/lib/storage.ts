import { UserProfile, WorkRecord, PaymentRecord, AuditLog, AppRates } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { getTodayDateString } from './dateUtils';

const STORAGE_KEYS = {
  PROFILES: 'driver_mgmt_profiles_v2', // v2 to cleanly migrate to Aswin, Bose & Ajay
  WORK_RECORDS: 'driver_mgmt_work_records_v2',
  PAYMENTS: 'driver_mgmt_payments_v2',
  AUDIT_LOGS: 'driver_mgmt_audit_logs_v2',
  RATES: 'driver_mgmt_rates_v2',
  ACTIVE_USER: 'driver_mgmt_active_user_v2',
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

// Drivers are Bose and Ajay; Admin is Aswin
export const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'admin-aswin',
    email: 'aswin@fleet.local',
    full_name: 'Aswin (Admin)',
    phone: '+91 98765 43200',
    vehicle_number: 'FLEET-HQ',
    role: 'admin',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'drv-bose',
    email: 'bose@driver.local',
    full_name: 'Bose',
    phone: '+91 98765 43210',
    vehicle_number: 'TN-01-EQ-1001',
    role: 'driver',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'drv-ajay',
    email: 'ajay@driver.local',
    full_name: 'Ajay',
    phone: '+91 98765 43211',
    vehicle_number: 'TN-01-EQ-1002',
    role: 'driver',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

// Generate seed records for realistic demonstration (Strictly 1 record per driver per date - ZERO duplicates)
function generateInitialRecords(): { records: WorkRecord[]; payments: PaymentRecord[]; logs: AuditLog[] } {
  const records: WorkRecord[] = [];
  const payments: PaymentRecord[] = [];
  const logs: AuditLog[] = [];

  const today = getTodayDateString();
  const [currYearStr, currMonthStr, currDayStr] = today.split('-');
  const currYear = parseInt(currYearStr, 10);
  const currMonth = parseInt(currMonthStr, 10);
  const currDay = parseInt(currDayStr, 10);

  const drivers = INITIAL_PROFILES.filter((p) => p.role === 'driver');

  drivers.forEach((driver, dIdx) => {
    // Generate records for current month up to today
    for (let day = 1; day <= currDay; day++) {
      const dayOfWeek = (day + dIdx) % 7;
      if (dayOfWeek === 0) continue; // Sunday off

      const dateStr = `${currYear}-${String(currMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Additional drives (OT)
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
        notes: ot > 0 ? `Completed shift + ${ot} extra pickup(s)` : 'Regular day shift',
        created_at: `${dateStr}T18:30:00.000Z`,
        updated_at: `${dateStr}T18:30:00.000Z`,
        created_by: driver.full_name,
      });
    }

    // Previous month: Add a recorded advance/payment
    if (dIdx === 0) {
      payments.push({
        id: `pay-${driver.id}-1`,
        driver_id: driver.id,
        payment_date: `${currYearStr}-${currMonthStr}-05`,
        amount: 5000,
        month_period: `${currYearStr}-${currMonthStr}`,
        payment_method: 'upi',
        reference: 'UPI/2026/0912984928',
        notes: 'Mid-month diesel & advance payment',
        created_at: `${currYearStr}-${currMonthStr}-05T10:00:00.000Z`,
        created_by: 'Aswin (Admin)',
      });
    } else if (dIdx === 1) {
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
        created_by: 'Aswin (Admin)',
      });
    }
  });

  logs.push({
    id: 'log-1',
    actor_id: 'admin-aswin',
    actor_name: 'Aswin (Admin)',
    action: 'CREATE',
    entity_type: 'driver',
    entity_id: 'all',
    details: 'System configured with Admin: Aswin and Drivers: Bose & Ajay. Duplicate check enabled.',
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
    
    // Automatically sanitize and remove any duplicate records on startup
    this.removeDuplicateRecords();
  }

  // --- Duplicate Record Cleaner ---
  /**
   * Scans all work records and guarantees STRICT UNIQUENESS per (driver_id, work_date).
   * If any duplicates exist, retains only the newest updated record and removes all duplicates.
   */
  public static removeDuplicateRecords(actor?: UserProfile): { removedCount: number; remainingCount: number } {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORK_RECORDS);
      if (!data) return { removedCount: 0, remainingCount: 0 };

      const records: WorkRecord[] = JSON.parse(data);
      const seen = new Map<string, WorkRecord>();
      let removedCount = 0;

      // Sort by updated_at descending so that the newest record is kept
      const sorted = [...records].sort(
        (a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
      );

      for (const rec of sorted) {
        const key = `${rec.driver_id}_${rec.work_date}`;
        if (!seen.has(key)) {
          seen.set(key, rec);
        } else {
          removedCount++;
        }
      }

      if (removedCount > 0) {
        const uniqueRecords = Array.from(seen.values()).sort((a, b) => b.work_date.localeCompare(a.work_date));
        localStorage.setItem(STORAGE_KEYS.WORK_RECORDS, JSON.stringify(uniqueRecords));

        const actorName = actor ? actor.full_name : 'System Sanitizer';
        const actorId = actor ? actor.id : 'system';

        this.addAuditLog({
          id: `log-${Date.now()}`,
          actor_id: actorId,
          actor_name: actorName,
          action: 'DELETE',
          entity_type: 'work_record',
          entity_id: 'duplicates',
          details: `Deduplication complete: Purged ${removedCount} duplicate record(s). Strictly enforced 1 record per driver per date.`,
          created_at: new Date().toISOString(),
        });
      }

      return { removedCount, remainingCount: seen.size };
    } catch {
      return { removedCount: 0, remainingCount: 0 };
    }
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
    
    this.addAuditLog({
      id: `log-${Date.now()}`,
      actor_id: actor.id,
      actor_name: actor.full_name,
      action: 'RATE_CHANGE',
      entity_type: 'rate',
      entity_id: 'app_settings',
      details: `Rates updated: Regular ₹${oldRates.regular_rate} -> ₹${rates.regular_rate}, OT ₹${oldRates.ot_rate} -> ₹${rates.ot_rate}. Existing records preserve their snapshot rates.`,
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
   * Strictly enforces:
   * 1. Only ONE record allowed per driver per date (prevents duplicate regular shifts).
   * 2. If a record already exists on that date for that driver, it updates that record.
   * 3. Drops any duplicate occurrences.
   * 4. Freezes current rate snapshot.
   * 5. Accurately calculates total earnings.
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

    const ot = Math.max(0, Math.floor(Number(recordData.ot_count) || 0));

    if (!recordData.work_date) {
      return { success: false, error: 'Work date is required.' };
    }

    if (!recordData.driver_id) {
      return { success: false, error: 'Driver selection is required.' };
    }

    let records = this.getWorkRecords();
    const rates = this.getRates();
    const now = new Date().toISOString();

    // Check for existing record for this driver and date
    const existing = records.find(
      (r) => r.driver_id === recordData.driver_id && r.work_date === recordData.work_date
    );

    // CRITICAL: Filter out any existing records matching this driver and date to guarantee NO duplicates!
    records = records.filter(
      (r) => !(r.driver_id === recordData.driver_id && r.work_date === recordData.work_date)
    );

    let savedRecord: WorkRecord;

    if (existing) {
      // Update existing record
      const regRate = existing.regular_rate || rates.regular_rate;
      const otRate = existing.ot_rate || rates.ot_rate;
      const earnings = (recordData.regular_shift ? regRate : 0) + (ot * otRate);

      savedRecord = {
        ...existing,
        regular_shift: recordData.regular_shift,
        ot_count: ot,
        regular_rate: regRate,
        ot_rate: otRate,
        total_earnings: earnings,
        notes: recordData.notes?.trim() || '',
        updated_at: now,
      };

      records.unshift(savedRecord);
      localStorage.setItem(STORAGE_KEYS.WORK_RECORDS, JSON.stringify(records));

      this.addAuditLog({
        id: `log-${Date.now()}`,
        actor_id: actor.id,
        actor_name: actor.full_name,
        action: 'UPDATE',
        entity_type: 'work_record',
        entity_id: savedRecord.id,
        details: `Updated entry for ${recordData.work_date} (No duplicate): Shift=${recordData.regular_shift ? 'Yes' : 'No'}, OT=${ot}, Total=₹${earnings} (Prev: Shift=${existing.regular_shift ? 'Yes' : 'No'}, OT=${existing.ot_count})`,
        created_at: now,
      });
    } else {
      // Insert new unique record
      const regRate = rates.regular_rate;
      const otRate = rates.ot_rate;
      const earnings = (recordData.regular_shift ? regRate : 0) + (ot * otRate);

      savedRecord = {
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

      records.unshift(savedRecord);
      localStorage.setItem(STORAGE_KEYS.WORK_RECORDS, JSON.stringify(records));

      this.addAuditLog({
        id: `log-${Date.now()}`,
        actor_id: actor.id,
        actor_name: actor.full_name,
        action: 'CREATE',
        entity_type: 'work_record',
        entity_id: savedRecord.id,
        details: `Created entry for ${recordData.work_date}: Shift=${recordData.regular_shift ? 'Yes' : 'No'}, OT=${ot}, Total=₹${earnings}`,
        created_at: now,
      });
    }

    return { success: true, record: savedRecord };
  }

  /**
   * Delete a work record
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
