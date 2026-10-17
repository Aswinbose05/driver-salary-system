-- =========================================================================
-- Driver Earnings and Monthly Salary Management System - Initial Seed Data
-- =========================================================================

-- Insert default app rates
INSERT INTO public.app_settings (key, value, description)
VALUES 
  ('rates', '{"regular_rate": 800, "ot_rate": 800, "currency": "INR", "time_zone": "Asia/Kolkata", "allow_driver_edit_past_days": 2}'::jsonb, 'Standard daily shift and OT driving rates in INR')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Admin: Aswin
-- Drivers: Bose and Ajay
--
-- Example for linking Supabase Auth users to profiles:
-- INSERT INTO public.profiles (id, email, full_name, phone, vehicle_number, role, is_active)
-- VALUES 
--   ('<admin_aswin_uuid>', 'aswin@fleet.local', 'Aswin (Admin)', '+91 98765 43200', 'FLEET-HQ', 'admin', true),
--   ('<driver_bose_uuid>', 'bose@driver.local', 'Bose', '+91 98765 43210', 'TN-01-EQ-1001', 'driver', true),
--   ('<driver_ajay_uuid>', 'ajay@driver.local', 'Ajay', '+91 98765 43211', 'TN-01-EQ-1002', 'driver', true);
