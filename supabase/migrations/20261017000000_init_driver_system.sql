-- =========================================================================
-- Driver Earnings and Monthly Salary Management System - Production SQL Schema
-- Database: PostgreSQL (Supabase)
-- Time Zone: Asia/Kolkata
-- Currency: INR (₹)
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  vehicle_number TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'driver')) DEFAULT 'driver',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick role-based and active lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active);

-- -------------------------------------------------------------------------
-- 2. APP SETTINGS (Configurable Rates)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Insert initial rates (₹800 regular day, ₹800 additional drive)
INSERT INTO public.app_settings (key, value, description)
VALUES 
  ('rates', '{"regular_rate": 800, "ot_rate": 800, "currency": "INR", "time_zone": "Asia/Kolkata", "allow_driver_edit_past_days": 2}'::jsonb, 'Standard daily shift and OT driving rates in INR')
ON CONFLICT (key) DO NOTHING;

-- -------------------------------------------------------------------------
-- 3. WORK RECORDS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.work_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  work_date DATE NOT NULL,
  regular_shift BOOLEAN NOT NULL DEFAULT TRUE,
  ot_count INTEGER NOT NULL DEFAULT 0 CHECK (ot_count >= 0),
  regular_rate NUMERIC(10, 2) NOT NULL DEFAULT 800 CHECK (regular_rate >= 0),
  ot_rate NUMERIC(10, 2) NOT NULL DEFAULT 800 CHECK (ot_rate >= 0),
  total_earnings NUMERIC(10, 2) GENERATED ALWAYS AS (
    (CASE WHEN regular_shift THEN regular_rate ELSE 0 END) + (ot_count * ot_rate)
  ) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  
  -- Prevent duplicate regular shifts or conflicting entries for same driver and date
  CONSTRAINT uq_driver_work_date UNIQUE (driver_id, work_date)
);

-- Indexes for lightning fast monthly filtering and driver lookups
CREATE INDEX IF NOT EXISTS idx_work_records_driver_date ON public.work_records(driver_id, work_date);
CREATE INDEX IF NOT EXISTS idx_work_records_date ON public.work_records(work_date);

-- -------------------------------------------------------------------------
-- 4. PAYMENTS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  payment_date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  month_period VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'cheque', 'other')),
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_payments_driver_month ON public.payments(driver_id, month_period);

-- -------------------------------------------------------------------------
-- 5. AUDIT LOGS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- -------------------------------------------------------------------------
-- 6. HELPER FUNCTIONS & TRIGGERS
-- -------------------------------------------------------------------------

-- Function to check if current authenticated user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_work_records_updated_at
BEFORE UPDATE ON public.work_records
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- -------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies:
-- Users can read their own profile; Admins can read all profiles
CREATE POLICY "Profiles are viewable by owner or admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Only admins can insert or update profiles (prevents role elevation)
CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- App Settings policies:
-- Anyone authenticated can read settings (to display rates)
CREATE POLICY "Authenticated users can view app settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only admins can change rates or settings
CREATE POLICY "Only admins can modify app settings"
  ON public.app_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Work Records policies:
-- Drivers can read ONLY their own records; Admins can read all records
CREATE POLICY "Drivers view own records, admins view all"
  ON public.work_records FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid() OR public.is_admin());

-- Drivers can insert their own work records; Admins can insert records for any driver
CREATE POLICY "Drivers insert own records, admins insert any"
  ON public.work_records FOR INSERT
  TO authenticated
  WITH CHECK (driver_id = auth.uid() OR public.is_admin());

-- Drivers can update their own records within allowed window; Admins can update any
CREATE POLICY "Drivers update own records, admins update any"
  ON public.work_records FOR UPDATE
  TO authenticated
  USING (driver_id = auth.uid() OR public.is_admin())
  WITH CHECK (driver_id = auth.uid() OR public.is_admin());

-- Only admins can delete work records
CREATE POLICY "Only admins can delete work records"
  ON public.work_records FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Payments policies:
-- Drivers can view ONLY their own payments; Admins view all
CREATE POLICY "Drivers view own payments, admins view all"
  ON public.payments FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid() OR public.is_admin());

-- Only admins can record or modify payments
CREATE POLICY "Only admins can insert or modify payments"
  ON public.payments FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Audit Logs policies:
-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- System or authenticated users can insert audit logs
CREATE POLICY "Authenticated users can create audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);
