-- ============================================================================
-- WasteFlow — SYNTHETIC DEMO SEED DATA
--
-- NOT REAL OPERATIONAL DATA. These figures are invented for demonstration and
-- must never be presented as Monroviawatta operating data.
--
-- Requires the pgcrypto extension for password hashing (see schema.sql).
-- Demo password for every seeded account: the username + "123" (e.g. driver123).
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- LGAs (public research reports five participating authorities)
-- ---------------------------------------------------------------------------
INSERT INTO lgas (id, code, name, type, active) VALUES
  ('11111111-1111-1111-1111-111111111101', 'GMC', 'Galle Municipal Council',            'Municipal',          true),
  ('11111111-1111-1111-1111-111111111102', 'HUC', 'Hikkaduwa Urban Council',            'Urban',              true),
  ('11111111-1111-1111-1111-111111111103', 'RPS', 'Rajgama Pradeshiya Sabha',           'Pradeshiya Sabha',   true),
  ('11111111-1111-1111-1111-111111111104', 'BPS', 'Bope-Poddala Pradeshiya Sabha',      'Pradeshiya Sabha',   true),
  ('11111111-1111-1111-1111-111111111105', 'BLS', 'Balapitiya Pradeshiya Sabha',        'Pradeshiya Sabha',   true);

-- ---------------------------------------------------------------------------
-- Facility
-- ---------------------------------------------------------------------------
INSERT INTO facilities (id, code, name, reference_capacity_mt_day, active) VALUES
  ('22222222-2222-2222-2222-222222222201', 'MONRO', 'Monroviawatta Solid Waste Management Centre (Rajgama)', 40.00, true);

-- ---------------------------------------------------------------------------
-- Roles & permissions (illustrative subset)
-- ---------------------------------------------------------------------------
INSERT INTO permissions (code, description) VALUES
  ('trip:create', 'Create a trip'),
  ('collection:create', 'Record a collection'),
  ('load:read', 'Read loads'),
  ('load:search', 'Search loads'),
  ('receipt:create', 'Receive a load'),
  ('processing:create', 'Record processing'),
  ('transfer:create', 'Create a transfer shipment'),
  ('report:generate', 'Generate reports'),
  ('audit:read', 'Read audit logs');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE (r.code = 'DRIVER'                     AND p.code IN ('trip:create','collection:create','load:read'))
   OR (r.code = 'COLLECTION_SUPERVISOR'      AND p.code IN ('trip:create','collection:create','load:read','load:search','report:generate'))
   OR (r.code = 'FACILITY_RECEIVING_OFFICER' AND p.code IN ('load:read','load:search','receipt:create'))
   OR (r.code = 'FACILITY_PROCESSING_OPERATOR' AND p.code IN ('load:read','processing:create','transfer:create'))
   OR (r.code = 'PROVINCIAL_OFFICER'         AND p.code IN ('load:read','load:search','report:generate'))
   OR (r.code = 'SYSTEM_ADMINISTRATOR'       AND p.code IN ('audit:read','report:generate'));

-- ---------------------------------------------------------------------------
-- Demo users (synthetic). Passwords hashed with bcrypt.
-- ---------------------------------------------------------------------------
INSERT INTO users (id, name, username, email, password_hash, role_id, lga_id, facility_id, active) VALUES
  ('33333333-3333-3333-3333-333333333301', 'Demo Driver',        'driver',     'driver@demo.wasteflow',     crypt('driver123',     gen_salt('bf')), (SELECT id FROM roles WHERE code='DRIVER'), '11111111-1111-1111-1111-111111111101', NULL, true),
  ('33333333-3333-3333-3333-333333333302', 'Demo Supervisor',    'supervisor', 'supervisor@demo.wasteflow', crypt('super123',      gen_salt('bf')), (SELECT id FROM roles WHERE code='COLLECTION_SUPERVISOR'), '11111111-1111-1111-1111-111111111101', NULL, true),
  ('33333333-3333-3333-3333-333333333303', 'Demo Receiving',     'receiving',  'receiving@demo.wasteflow',  crypt('receiving123',  gen_salt('bf')), (SELECT id FROM roles WHERE code='FACILITY_RECEIVING_OFFICER'), '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', true),
  ('33333333-3333-3333-3333-333333333304', 'Demo Processing',    'processing', 'processing@demo.wasteflow', crypt('processing123', gen_salt('bf')), (SELECT id FROM roles WHERE code='FACILITY_PROCESSING_OPERATOR'), '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', true),
  ('33333333-3333-3333-3333-333333333305', 'Demo Officer',       'officer',    'officer@demo.wasteflow',    crypt('officer123',    gen_salt('bf')), (SELECT id FROM roles WHERE code='PROVINCIAL_OFFICER'), NULL, NULL, true),
  ('33333333-3333-3333-3333-333333333306', 'Demo Administrator', 'admin',      'admin@demo.wasteflow',      crypt('admin123',      gen_salt('bf')), (SELECT id FROM roles WHERE code='SYSTEM_ADMINISTRATOR'), NULL, NULL, true);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, u.role_id FROM users u WHERE u.role_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Vehicles & routes
-- ---------------------------------------------------------------------------
INSERT INTO vehicles (id, vehicle_code, registration_number, vehicle_type, lga_id, capacity_kg, active) VALUES
  ('44444444-4444-4444-4444-444444444401', 'VH-001', 'DEMO-001', 'Compactor',        '11111111-1111-1111-1111-111111111101', 5000, true),
  ('44444444-4444-4444-4444-444444444402', 'VH-002', 'DEMO-002', 'Tipper',           '11111111-1111-1111-1111-111111111101', 4000, true),
  ('44444444-4444-4444-4444-444444444403', 'VH-003', 'DEMO-003', 'Tractor Trailer',  '11111111-1111-1111-1111-111111111102', 3000, true);

INSERT INTO routes (id, route_name, lga_id, source_area, active) VALUES
  ('55555555-5555-5555-5555-555555555501', 'Market & Fort Loop',      '11111111-1111-1111-1111-111111111101', 'Galle Fort', true),
  ('55555555-5555-5555-5555-555555555502', 'Karapitiya Residential',  '11111111-1111-1111-1111-111111111101', 'Karapitiya', true),
  ('55555555-5555-5555-5555-555555555503', 'Hikkaduwa Coastal',       '11111111-1111-1111-1111-111111111102', 'Hikkaduwa Town', true);

-- ---------------------------------------------------------------------------
-- Demo trip + collections + load (LD-DEMO-001)
-- Declared 2,600 kg  |  Received 2,550 kg  |  50 kg discrepancy
-- Processing: Compost 1,700 + Landfill 650 + Transfer 200 = 2,550 kg (reconciles)
-- ---------------------------------------------------------------------------
INSERT INTO trips (id, trip_code, route_id, vehicle_id, driver_id, lga_id, start_time, end_time, status, source_area) VALUES
  ('66666666-6666-6666-6666-666666666601', 'TR-DEMO-001',
   '55555555-5555-5555-5555-555555555501',
   '44444444-4444-4444-4444-444444444401',
   '33333333-3333-3333-3333-333333333301',
   '11111111-1111-1111-1111-111111111101',
   now() - interval '3 hours', now() - interval '2 hours 10 minutes', 'SUBMITTED', 'Galle Fort Market');

INSERT INTO collection_events (trip_id, location_description, waste_category_id, measurement_method_id, quantity_kg, collected_at) VALUES
  ('66666666-6666-6666-6666-666666666601', 'Market Area',
   (SELECT id FROM waste_categories WHERE code='BIODEGRADABLE'),
   (SELECT id FROM measurement_methods WHERE code='MANUAL_ESTIMATE'), 1200, now() - interval '2 hours 50 minutes'),
  ('66666666-6666-6666-6666-666666666601', 'Residential Area',
   (SELECT id FROM waste_categories WHERE code='NON_BIODEGRADABLE'),
   (SELECT id FROM measurement_methods WHERE code='MANUAL_ESTIMATE'), 600, now() - interval '2 hours 40 minutes'),
  ('66666666-6666-6666-6666-666666666601', 'School Area',
   (SELECT id FROM waste_categories WHERE code='BIODEGRADABLE'),
   (SELECT id FROM measurement_methods WHERE code='MANUAL_ESTIMATE'), 800, now() - interval '2 hours 30 minutes');

INSERT INTO loads (id, load_code, trip_id, declared_quantity_kg, waste_category_id, destination_facility_id, status) VALUES
  ('77777777-7777-7777-7777-777777777701', 'LD-DEMO-001',
   '66666666-6666-6666-6666-666666666601',
   2600,
   (SELECT id FROM waste_categories WHERE code='BIODEGRADABLE'),
   '22222222-2222-2222-2222-222222222201',
   'RECEIVED');

-- Received 2,550 kg from declared 2,600 kg -> discrepancy with a reason.
INSERT INTO receipts (load_id, facility_id, arrival_time, received_quantity_kg, measurement_method_id, condition, discrepancy_flag, discrepancy_reason, received_by) VALUES
  ('77777777-7777-7777-7777-777777777701',
   '22222222-2222-2222-2222-222222222201',
   now() - interval '2 hours',
   2550,
   (SELECT id FROM measurement_methods WHERE code='WEIGHBRIDGE'),
   'Normal', true, 'Moisture loss in transit (demo reason)',
   '33333333-3333-3333-3333-333333333303');

INSERT INTO exceptions (entity_type, entity_id, exception_type, severity, description, status) VALUES
  ('load', '77777777-7777-7777-7777-777777777701', 'QUANTITY_MISMATCH', 'WARNING',
   'Declared 2,600 kg / received 2,550 kg (difference -50 kg). Reason recorded.', 'OPEN');

-- Processing allocation equals received quantity.
INSERT INTO processing_records (load_id, process_type, input_quantity_kg, compost_kg, landfill_kg, transfer_kg, other_kg, incomplete, operator_id) VALUES
  ('77777777-7777-7777-7777-777777777701', 'MIXED_ALLOCATION', 2550, 1700, 650, 200, 0, false,
   '33333333-3333-3333-3333-333333333304');

-- Audit trail for the demo correction/receipt
INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_values, new_values, device_info) VALUES
  ('33333333-3333-3333-3333-333333333303', 'load', 'LD-DEMO-001', 'RECEIVED',
   jsonb_build_object('status','SUBMITTED'),
   jsonb_build_object('status','RECEIVED','received_quantity_kg',2550,'discrepancy_flag',true),
   'DEMO-DEVICE');

COMMIT;

-- ============================================================================
-- Reminder: all data above is SYNTHETIC. Do not present it as real.
-- ============================================================================
