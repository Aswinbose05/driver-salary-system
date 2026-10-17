export type UserRole = 'admin' | 'driver';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  vehicle_number: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface WorkRecord {
  id: string;
  driver_id: string;
  work_date: string; // YYYY-MM-DD
  regular_shift: boolean; // Yes = worked regular shift
  ot_count: number; // 0 or more additional drives
  regular_rate: number; // Snapshot of rate on entry (e.g. 800)
  ot_rate: number; // Snapshot of rate on entry (e.g. 800)
  total_earnings: number; // Calculated: (regular_shift ? regular_rate : 0) + (ot_count * ot_rate)
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string; // user id or name
}

export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';

export interface PaymentRecord {
  id: string;
  driver_id: string;
  payment_date: string; // YYYY-MM-DD
  amount: number;
  month_period: string; // YYYY-MM
  payment_method: PaymentMethod;
  reference?: string; // UPI txn id, cheque number, etc.
  notes?: string;
  created_at: string;
  created_by: string;
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RATE_CHANGE' | 'PAYMENT' | 'LOGIN' | 'PASSWORD_CHANGE';

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  action: AuditAction;
  entity_type: 'work_record' | 'payment' | 'rate' | 'driver' | 'auth';
  entity_id: string;
  details: string; // JSON or human readable diff description
  created_at: string;
}

export interface AppRates {
  regular_rate: number; // Default 800
  ot_rate: number; // Default 800
  allow_driver_edit_past_days: number; // 0 = only today, 1 = yesterday and today, etc.
  system_name: string;
  currency: string;
  time_zone: string;
}

export interface DriverMonthlySummary {
  driver_id: string;
  driver_name: string;
  month_period: string; // YYYY-MM
  total_regular_days: number;
  total_ot_drives: number;
  regular_earnings: number;
  ot_earnings: number;
  gross_earnings: number;
  total_paid: number;
  outstanding_balance: number;
  payment_status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  records_count: number;
}
