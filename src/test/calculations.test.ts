import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../lib/storage';
import { formatINR, isDateEditable, getRecentMonths } from '../lib/dateUtils';
import { UserProfile } from '../types';

const mockAdmin: UserProfile = {
  id: 'admin-1',
  email: 'admin@fleet.local',
  full_name: 'Vikram Singh (Admin)',
  phone: '+91 98765 43200',
  vehicle_number: 'HQ',
  role: 'admin',
  is_active: true,
  created_at: new Date().toISOString(),
};

const mockDriver1: UserProfile = {
  id: 'drv-test-1',
  email: 'driver1@test.local',
  full_name: 'Ramesh Test',
  phone: '+91 98765 43210',
  vehicle_number: 'KA-01-1001',
  role: 'driver',
  is_active: true,
  created_at: new Date().toISOString(),
};

const mockDriver2: UserProfile = {
  id: 'drv-test-2',
  email: 'driver2@test.local',
  full_name: 'Suresh Test',
  phone: '+91 98765 43211',
  vehicle_number: 'KA-01-1002',
  role: 'driver',
  is_active: true,
  created_at: new Date().toISOString(),
};

describe('Driver Salary & Earnings System Business Logic Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    StorageService.initialize();
  });

  it('calculates regular shift earnings correctly (1 day = ₹800)', () => {
    const res = StorageService.saveWorkRecord(
      {
        driver_id: mockDriver1.id,
        work_date: '2026-10-01',
        regular_shift: true,
        ot_count: 0,
        notes: 'Regular shift test',
      },
      mockDriver1
    );

    expect(res.success).toBe(true);
    expect(res.record?.total_earnings).toBe(800);
    expect(res.record?.regular_rate).toBe(800);
    expect(res.record?.ot_rate).toBe(800);
  });

  it('calculates multiple OT drives correctly (Regular 1 + 2 OT = ₹2,400)', () => {
    // 1 regular shift (800) + 2 OT drives (2 * 800 = 1600) = 2400
    const res = StorageService.saveWorkRecord(
      {
        driver_id: mockDriver1.id,
        work_date: '2026-10-02',
        regular_shift: true,
        ot_count: 2,
        notes: 'Shift plus 2 OT drives',
      },
      mockDriver1
    );

    expect(res.success).toBe(true);
    expect(res.record?.total_earnings).toBe(2400);
  });

  it('calculates zero-earnings for no-work day (shift: false, ot: 0)', () => {
    const res = StorageService.saveWorkRecord(
      {
        driver_id: mockDriver1.id,
        work_date: '2026-10-03',
        regular_shift: false,
        ot_count: 0,
        notes: 'Day off',
      },
      mockDriver1
    );

    expect(res.success).toBe(true);
    expect(res.record?.total_earnings).toBe(0);
  });

  it('calculates only OT drives on a non-regular shift day (shift: false, ot: 3 = ₹2,400)', () => {
    const res = StorageService.saveWorkRecord(
      {
        driver_id: mockDriver1.id,
        work_date: '2026-10-04',
        regular_shift: false,
        ot_count: 3,
        notes: 'Only 3 OT drives on Sunday',
      },
      mockDriver1
    );

    expect(res.success).toBe(true);
    expect(res.record?.total_earnings).toBe(2400);
  });

  it('prevents duplicate regular shift entries for the same date and updates instead', () => {
    // First entry: regular shift only (800)
    const first = StorageService.saveWorkRecord(
      {
        driver_id: mockDriver1.id,
        work_date: '2026-10-05',
        regular_shift: true,
        ot_count: 0,
      },
      mockDriver1
    );
    expect(first.success).toBe(true);
    expect(first.record?.total_earnings).toBe(800);

    // Second entry for the SAME driver and SAME date with 1 OT drive
    const second = StorageService.saveWorkRecord(
      {
        driver_id: mockDriver1.id,
        work_date: '2026-10-05',
        regular_shift: true,
        ot_count: 1,
      },
      mockDriver1
    );
    expect(second.success).toBe(true);
    expect(second.record?.total_earnings).toBe(1600);

    // Verify there is only ONE record for this date in storage
    const allRecords = StorageService.getWorkRecords();
    const dateRecords = allRecords.filter(
      (r) => r.driver_id === mockDriver1.id && r.work_date === '2026-10-05'
    );
    expect(dateRecords.length).toBe(1);
  });

  it('preserves historical earnings when rates are changed in app_settings', () => {
    // 1. Create a record at initial rate ₹800
    const rec1 = StorageService.saveWorkRecord(
      {
        driver_id: mockDriver1.id,
        work_date: '2026-10-10',
        regular_shift: true,
        ot_count: 1,
      },
      mockDriver1
    );
    expect(rec1.record?.total_earnings).toBe(1600); // 800 + 800

    // 2. Admin changes the rates to ₹1,000 for shift and ₹1,000 for OT
    StorageService.saveRates(
      {
        regular_rate: 1000,
        ot_rate: 1000,
        allow_driver_edit_past_days: 2,
        system_name: 'Fleet System',
        currency: 'INR',
        time_zone: 'Asia/Kolkata',
      },
      mockAdmin
    );

    // 3. Create a new record at the new rate
    const rec2 = StorageService.saveWorkRecord(
      {
        driver_id: mockDriver1.id,
        work_date: '2026-10-11',
        regular_shift: true,
        ot_count: 1,
      },
      mockDriver1
    );
    expect(rec2.record?.total_earnings).toBe(2000); // 1000 + 1000

    // 4. Verify historical rec1 still preserves original 1600 (not updated to 2000!)
    const allRecords = StorageService.getWorkRecords();
    const savedRec1 = allRecords.find((r) => r.id === rec1.record?.id);
    expect(savedRec1?.total_earnings).toBe(1600);
    expect(savedRec1?.regular_rate).toBe(800);
  });

  it('calculates monthly summary, partial payments, and outstanding balances correctly', () => {
    const month = '2026-09';

    // Day 1: Regular + 1 OT = 1600
    StorageService.saveWorkRecord(
      {
        driver_id: mockDriver1.id,
        work_date: '2026-09-01',
        regular_shift: true,
        ot_count: 1,
      },
      mockDriver1
    );

    // Day 2: Regular + 0 OT = 800
    StorageService.saveWorkRecord(
      {
        driver_id: mockDriver1.id,
        work_date: '2026-09-02',
        regular_shift: true,
        ot_count: 0,
      },
      mockDriver1
    );

    // Total gross = 1600 + 800 = 2400
    const summaryBeforePayment = StorageService.calculateMonthlySummary(mockDriver1.id, month);
    expect(summaryBeforePayment.grossEarnings).toBe(2400);
    expect(summaryBeforePayment.totalPaid).toBe(0);
    expect(summaryBeforePayment.outstandingBalance).toBe(2400);
    expect(summaryBeforePayment.paymentStatus).toBe('UNPAID');

    // Make partial payment of ₹1000
    StorageService.addPayment(
      {
        driver_id: mockDriver1.id,
        payment_date: '2026-09-10',
        amount: 1000,
        month_period: month,
        payment_method: 'upi',
      },
      mockAdmin
    );

    const summaryAfterPartial = StorageService.calculateMonthlySummary(mockDriver1.id, month);
    expect(summaryAfterPartial.totalPaid).toBe(1000);
    expect(summaryAfterPartial.outstandingBalance).toBe(1400); // 2400 - 1000
    expect(summaryAfterPartial.paymentStatus).toBe('PARTIALLY_PAID');

    // Make remaining settlement of ₹1400
    StorageService.addPayment(
      {
        driver_id: mockDriver1.id,
        payment_date: '2026-09-25',
        amount: 1400,
        month_period: month,
        payment_method: 'bank_transfer',
      },
      mockAdmin
    );

    const summaryFinal = StorageService.calculateMonthlySummary(mockDriver1.id, month);
    expect(summaryFinal.totalPaid).toBe(2400);
    expect(summaryFinal.outstandingBalance).toBe(0);
    expect(summaryFinal.paymentStatus).toBe('PAID');
  });

  it('guarantees driver-to-driver data isolation in monthly summaries', () => {
    // Driver 1 work
    StorageService.saveWorkRecord(
      {
        driver_id: mockDriver1.id,
        work_date: '2026-08-01',
        regular_shift: true,
        ot_count: 2,
      },
      mockDriver1
    );

    // Driver 2 work
    StorageService.saveWorkRecord(
      {
        driver_id: mockDriver2.id,
        work_date: '2026-08-01',
        regular_shift: true,
        ot_count: 0,
      },
      mockDriver2
    );

    const summary1 = StorageService.calculateMonthlySummary(mockDriver1.id, '2026-08');
    const summary2 = StorageService.calculateMonthlySummary(mockDriver2.id, '2026-08');

    // Driver 1: 800 + 1600 = 2400
    expect(summary1.grossEarnings).toBe(2400);
    expect(summary1.totalOtDrives).toBe(2);

    // Driver 2: 800
    expect(summary2.grossEarnings).toBe(800);
    expect(summary2.totalOtDrives).toBe(0);
  });

  it('correctly handles month/year transitions in month selectors', () => {
    const months = getRecentMonths(12);
    expect(months.length).toBe(12);
    // Every value should follow YYYY-MM
    months.forEach((m) => {
      expect(m.value).toMatch(/^\d{4}-\d{2}$/);
      expect(m.label.length).toBeGreaterThan(3);
    });
  });

  it('formats Indian currency properly with ₹ symbol', () => {
    expect(formatINR(800)).toBe('₹800');
    expect(formatINR(2400)).toBe('₹2,400');
    expect(formatINR(120000)).toBe('₹1,20,000');
  });
});
