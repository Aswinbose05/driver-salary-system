import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../lib/storage';
import { formatINR, isDateEditable, getRecentMonths } from '../lib/dateUtils';
import { UserProfile, WorkRecord } from '../types';

const mockAdmin: UserProfile = {
  id: 'admin-aswin',
  email: 'aswin@fleet.local',
  full_name: 'Aswin (Admin)',
  phone: '+91 98765 43200',
  vehicle_number: 'FLEET-HQ',
  role: 'admin',
  is_active: true,
  created_at: new Date().toISOString(),
};

const mockDriverBose: UserProfile = {
  id: 'drv-bose',
  email: 'bose@driver.local',
  full_name: 'Bose',
  phone: '+91 98765 43210',
  vehicle_number: 'TN-01-EQ-1001',
  role: 'driver',
  is_active: true,
  created_at: new Date().toISOString(),
};

const mockDriverAjay: UserProfile = {
  id: 'drv-ajay',
  email: 'ajay@driver.local',
  full_name: 'Ajay',
  phone: '+91 98765 43211',
  vehicle_number: 'TN-01-EQ-1002',
  role: 'driver',
  is_active: true,
  created_at: new Date().toISOString(),
};

describe('Driver Salary & Earnings System Business Logic Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    StorageService.initialize();
  });

  it('calculates regular shift earnings correctly for Bose (1 day = ₹800)', () => {
    const res = StorageService.saveWorkRecord(
      {
        driver_id: mockDriverBose.id,
        work_date: '2026-10-01',
        regular_shift: true,
        ot_count: 0,
        notes: 'Regular shift test',
      },
      mockDriverBose
    );

    expect(res.success).toBe(true);
    expect(res.record?.total_earnings).toBe(800);
    expect(res.record?.regular_rate).toBe(800);
    expect(res.record?.ot_rate).toBe(800);
  });

  it('calculates multiple OT drives correctly for Ajay (Regular 1 + 2 OT = ₹2,400)', () => {
    // 1 regular shift (800) + 2 OT drives (2 * 800 = 1600) = 2400
    const res = StorageService.saveWorkRecord(
      {
        driver_id: mockDriverAjay.id,
        work_date: '2026-10-02',
        regular_shift: true,
        ot_count: 2,
        notes: 'Shift plus 2 OT drives',
      },
      mockDriverAjay
    );

    expect(res.success).toBe(true);
    expect(res.record?.total_earnings).toBe(2400);
  });

  it('calculates zero-earnings for no-work day (shift: false, ot: 0)', () => {
    const res = StorageService.saveWorkRecord(
      {
        driver_id: mockDriverBose.id,
        work_date: '2026-10-03',
        regular_shift: false,
        ot_count: 0,
        notes: 'Day off',
      },
      mockDriverBose
    );

    expect(res.success).toBe(true);
    expect(res.record?.total_earnings).toBe(0);
  });

  it('calculates only OT drives on a non-regular shift day (shift: false, ot: 3 = ₹2,400)', () => {
    const res = StorageService.saveWorkRecord(
      {
        driver_id: mockDriverBose.id,
        work_date: '2026-10-04',
        regular_shift: false,
        ot_count: 3,
        notes: 'Only 3 OT drives on Sunday',
      },
      mockDriverBose
    );

    expect(res.success).toBe(true);
    expect(res.record?.total_earnings).toBe(2400);
  });

  it('strictly prevents duplicate regular shift entries for the same date and updates instead', () => {
    // First entry: regular shift only (800)
    const first = StorageService.saveWorkRecord(
      {
        driver_id: mockDriverBose.id,
        work_date: '2026-10-05',
        regular_shift: true,
        ot_count: 0,
      },
      mockDriverBose
    );
    expect(first.success).toBe(true);
    expect(first.record?.total_earnings).toBe(800);

    // Second entry for the SAME driver and SAME date with 1 OT drive
    const second = StorageService.saveWorkRecord(
      {
        driver_id: mockDriverBose.id,
        work_date: '2026-10-05',
        regular_shift: true,
        ot_count: 1,
      },
      mockDriverBose
    );
    expect(second.success).toBe(true);
    expect(second.record?.total_earnings).toBe(1600);

    // Verify there is only ONE record for this date in storage (NO DUPLICATES)
    const allRecords = StorageService.getWorkRecords();
    const dateRecords = allRecords.filter(
      (r) => r.driver_id === mockDriverBose.id && r.work_date === '2026-10-05'
    );
    expect(dateRecords.length).toBe(1);
  });

  it('detects and purges duplicate records via removeDuplicateRecords', () => {
    // Intentionally inject duplicate records into storage
    const records = StorageService.getWorkRecords();
    const dup1: WorkRecord = {
      id: 'dup-1',
      driver_id: mockDriverBose.id,
      work_date: '2026-10-18',
      regular_shift: true,
      ot_count: 0,
      regular_rate: 800,
      ot_rate: 800,
      total_earnings: 800,
      created_at: '2026-10-18T10:00:00.000Z',
      updated_at: '2026-10-18T10:00:00.000Z',
      created_by: 'Bose',
    };
    const dup2: WorkRecord = {
      id: 'dup-2',
      driver_id: mockDriverBose.id,
      work_date: '2026-10-18',
      regular_shift: true,
      ot_count: 2,
      regular_rate: 800,
      ot_rate: 800,
      total_earnings: 2400,
      created_at: '2026-10-18T12:00:00.000Z',
      updated_at: '2026-10-18T12:00:00.000Z',
      created_by: 'Bose',
    };

    records.push(dup1, dup2);
    localStorage.setItem('driver_mgmt_work_records_v2', JSON.stringify(records));

    // Run deduplication
    const result = StorageService.removeDuplicateRecords(mockAdmin);
    expect(result.removedCount).toBeGreaterThanOrEqual(1);

    // Verify exactly 1 record remains for 2026-10-18
    const cleaned = StorageService.getWorkRecords();
    const remainingForDate = cleaned.filter(
      (r) => r.driver_id === mockDriverBose.id && r.work_date === '2026-10-18'
    );
    expect(remainingForDate.length).toBe(1);
    // Preserves the newer updated one (dup2 with total 2400)
    expect(remainingForDate[0].total_earnings).toBe(2400);
  });

  it('preserves historical earnings when rates are changed in app_settings', () => {
    // 1. Create a record at initial rate ₹800
    const rec1 = StorageService.saveWorkRecord(
      {
        driver_id: mockDriverBose.id,
        work_date: '2026-10-10',
        regular_shift: true,
        ot_count: 1,
      },
      mockDriverBose
    );
    expect(rec1.record?.total_earnings).toBe(1600); // 800 + 800

    // 2. Admin Aswin changes the rates to ₹1,000 for shift and ₹1,000 for OT
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
        driver_id: mockDriverBose.id,
        work_date: '2026-10-11',
        regular_shift: true,
        ot_count: 1,
      },
      mockDriverBose
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
        driver_id: mockDriverBose.id,
        work_date: '2026-09-01',
        regular_shift: true,
        ot_count: 1,
      },
      mockDriverBose
    );

    // Day 2: Regular + 0 OT = 800
    StorageService.saveWorkRecord(
      {
        driver_id: mockDriverBose.id,
        work_date: '2026-09-02',
        regular_shift: true,
        ot_count: 0,
      },
      mockDriverBose
    );

    // Total gross = 1600 + 800 = 2400
    const summaryBeforePayment = StorageService.calculateMonthlySummary(mockDriverBose.id, month);
    expect(summaryBeforePayment.grossEarnings).toBe(2400);
    expect(summaryBeforePayment.totalPaid).toBe(0);
    expect(summaryBeforePayment.outstandingBalance).toBe(2400);
    expect(summaryBeforePayment.paymentStatus).toBe('UNPAID');

    // Make partial payment of ₹1000
    StorageService.addPayment(
      {
        driver_id: mockDriverBose.id,
        payment_date: '2026-09-10',
        amount: 1000,
        month_period: month,
        payment_method: 'upi',
      },
      mockAdmin
    );

    const summaryAfterPartial = StorageService.calculateMonthlySummary(mockDriverBose.id, month);
    expect(summaryAfterPartial.totalPaid).toBe(1000);
    expect(summaryAfterPartial.outstandingBalance).toBe(1400); // 2400 - 1000
    expect(summaryAfterPartial.paymentStatus).toBe('PARTIALLY_PAID');

    // Make remaining settlement of ₹1400
    StorageService.addPayment(
      {
        driver_id: mockDriverBose.id,
        payment_date: '2026-09-25',
        amount: 1400,
        month_period: month,
        payment_method: 'bank_transfer',
      },
      mockAdmin
    );

    const summaryFinal = StorageService.calculateMonthlySummary(mockDriverBose.id, month);
    expect(summaryFinal.totalPaid).toBe(2400);
    expect(summaryFinal.outstandingBalance).toBe(0);
    expect(summaryFinal.paymentStatus).toBe('PAID');
  });

  it('guarantees driver-to-driver data isolation in monthly summaries between Bose and Ajay', () => {
    // Bose's work
    StorageService.saveWorkRecord(
      {
        driver_id: mockDriverBose.id,
        work_date: '2026-08-01',
        regular_shift: true,
        ot_count: 2,
      },
      mockDriverBose
    );

    // Ajay's work
    StorageService.saveWorkRecord(
      {
        driver_id: mockDriverAjay.id,
        work_date: '2026-08-01',
        regular_shift: true,
        ot_count: 0,
      },
      mockDriverAjay
    );

    const summaryBose = StorageService.calculateMonthlySummary(mockDriverBose.id, '2026-08');
    const summaryAjay = StorageService.calculateMonthlySummary(mockDriverAjay.id, '2026-08');

    // Bose: 800 + 1600 = 2400
    expect(summaryBose.grossEarnings).toBe(2400);
    expect(summaryBose.totalOtDrives).toBe(2);

    // Ajay: 800
    expect(summaryAjay.grossEarnings).toBe(800);
    expect(summaryAjay.totalOtDrives).toBe(0);
  });

  it('correctly handles month/year transitions in month selectors', () => {
    const months = getRecentMonths(12);
    expect(months.length).toBe(12);
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
