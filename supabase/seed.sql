-- =========================================================================
-- Driver Earnings and Monthly Salary Management System - Initial Seed Data
-- =========================================================================

-- Note: When using Supabase Auth, accounts are created via auth.users.
-- Below is a helper snippet that links authentication IDs to the profiles table.
-- In local or staging environments, you can run this script to provision profiles:

-- Insert default app rates
INSERT INTO public.app_settings (key, value, description)
VALUES 
  ('rates', '{"regular_rate": 800, "ot_rate": 800, "currency": "INR", "time_zone": "Asia/Kolkata", "allow_driver_edit_past_days": 2}'::jsonb, 'Standard daily shift and OT driving rates in INR')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Note for Admin & Driver account creation:
-- 1. Create users in Supabase Auth Dashboard -> Users -> Invite User (or via CLI)
-- 2. Insert matching profile rows in public.profiles:
--
-- Example:
-- INSERT INTO public.profiles (id, email, full_name, phone, vehicle_number, role, is_active)
-- VALUES 
--   ('<admin_uuid>', 'admin@fleet.local', 'Vikram Singh (Admin)', '+91 98765 43200', 'FLEET-HQ', 'admin', true),
--   ('<driver1_uuid>', 'ramesh@driver.local', 'Ramesh Kumar', '+91 98765 43210', 'KA-01-EQ-1001', 'driver', true),
--   ('<driver2_uuid>', 'suresh@driver.local', 'Suresh Patel', '+91 98765 43211', 'KA-01-EQ-1002', 'driver', true),
--   ('<driver3_uuid>', 'rajesh@driver.local', 'Rajesh Sharma', '+91 98765 43212', 'KA-01-EQ-1003', 'driver', true),
--   ('<driver4_uuid>', 'mahesh@driver.local', 'Mahesh Verma', '+91 98765 43213', 'KA-01-EQ-1004', 'driver', true);
