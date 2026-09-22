-- ============================================================================
-- WasteFlow — Galle District Solid Waste Operations & Monitoring System
-- PostgreSQL schema (PROPOSED)
--
-- Evidence note: this schema describes a proposed TO-BE system. It does not
-- assert current practice at Monroviawatta or any LGA.
-- ============================================================================

BEGIN;

-- Extensions -----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enumerations (kept as CHECK-constrained text for easy extension) ------------
-- Trip status
CREATE DOMAIN trip_status AS text
  CHECK (VALUE IN ('DRAFT','IN_PROGRESS','COMPLETED','SUBMITTED','CANCELLED'));

CREATE DOMAIN load_status AS text
  CHECK (VALUE IN ('SUBMITTED','ARRIVED','RECEIVED','PROCESSING','COMPLETED','EXCEPTION','CANCELLED'));

CREATE DOMAIN shipment_status AS text
  CHECK (VALUE IN ('DRAFT','DISPATCHED','IN_TRANSIT','RECEIVED','AWAITING_CONFIRMATION','EXCEPTION','CANCELLED'));

CREATE DOMAIN exception_severity AS text CHECK (VALUE IN ('CRITICAL','WARNING'));
CREATE DOMAIN exception_status AS text CHECK (VALUE IN ('OPEN','IN_REVIEW','RESOLVED'));

-- ---------------------------------------------------------------------------
-- Identity & access
-- ---------------------------------------------------------------------------
CREATE TABLE roles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,
  name          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,          -- resource:action
  description   text
);

CREATE TABLE role_permissions (
  role_id       uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ---------------------------------------------------------------------------
-- Master data
-- ---------------------------------------------------------------------------
CREATE TABLE lgas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,
  name          text NOT NULL,
  type          text,                            -- Municipal / Urban / Pradeshiya Sabha
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE facilities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,
  name          text NOT NULL,
  -- Reference capacity is a CONFIGURABLE ADMINISTRATIVE VALUE, not a live
  -- operational limit. Published figure referenced: 40 MT/day.
  reference_capacity_mt_day numeric(10,2),
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  username      text NOT NULL UNIQUE,
  email         text UNIQUE,
  phone         text,
  password_hash text NOT NULL,
  role_id       uuid REFERENCES roles(id),
  lga_id        uuid REFERENCES lgas(id),
  facility_id   uuid REFERENCES facilities(id),
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id       uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE vehicles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_code        text NOT NULL UNIQUE,
  registration_number text NOT NULL,
  vehicle_type        text,
  lga_id              uuid NOT NULL REFERENCES lgas(id),
  capacity_kg         numeric(12,2) CHECK (capacity_kg >= 0),
  active              boolean NOT NULL DEFAULT true,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE routes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name    text NOT NULL,
  lga_id        uuid NOT NULL REFERENCES lgas(id),
  source_area   text,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE route_assignments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id      uuid NOT NULL REFERENCES routes(id),
  vehicle_id    uuid REFERENCES vehicles(id),
  crew_user_id  uuid REFERENCES users(id),
  assigned_date date NOT NULL DEFAULT current_date,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE waste_categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,
  name          text NOT NULL,
  -- 'UNKNOWN' is a first-class category: a category is never forced.
  active        boolean NOT NULL DEFAULT true
);

CREATE TABLE measurement_methods (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,           -- WEIGHBRIDGE, SCALE, ...
  name          text NOT NULL,
  active        boolean NOT NULL DEFAULT true
);

-- ---------------------------------------------------------------------------
-- Operations
-- ---------------------------------------------------------------------------
CREATE TABLE trips (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_code     text NOT NULL UNIQUE,
  route_id      uuid REFERENCES routes(id),
  vehicle_id    uuid NOT NULL REFERENCES vehicles(id),
  driver_id     uuid NOT NULL REFERENCES users(id),
  lga_id        uuid NOT NULL REFERENCES lgas(id),
  start_time    timestamptz,
  end_time      timestamptz,
  status        trip_status NOT NULL DEFAULT 'DRAFT',
  source_area   text,
  notes         text,
  created_by    uuid REFERENCES users(id),
  client_generated_id text UNIQUE,              -- idempotency key from mobile
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_trip_times CHECK (end_time IS NULL OR (start_time IS NOT NULL AND end_time >= start_time))
);

-- At most one active trip per vehicle.
CREATE UNIQUE INDEX ux_one_active_trip_per_vehicle
  ON trips (vehicle_id)
  WHERE status IN ('DRAFT','IN_PROGRESS');

CREATE INDEX ix_trips_lga_date ON trips (lga_id, start_time);
CREATE INDEX ix_trips_status ON trips (status);

CREATE TABLE collection_events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id               uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  location_description  text NOT NULL,
  latitude              double precision,
  longitude             double precision,
  waste_category_id     uuid NOT NULL REFERENCES waste_categories(id),
  measurement_method_id uuid NOT NULL REFERENCES measurement_methods(id),
  quantity_kg           numeric(12,2) NOT NULL CHECK (quantity_kg >= 0),
  photo_url             text,
  collected_at          timestamptz NOT NULL DEFAULT now(),
  notes                 text,
  created_by            uuid REFERENCES users(id),
  client_generated_id   text UNIQUE,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_collections_trip ON collection_events (trip_id);

CREATE TABLE loads (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_code              text NOT NULL UNIQUE,
  trip_id                uuid REFERENCES trips(id),
  declared_quantity_kg   numeric(12,2) NOT NULL CHECK (declared_quantity_kg >= 0),
  waste_category_id      uuid NOT NULL REFERENCES waste_categories(id),
  destination_facility_id uuid REFERENCES facilities(id),
  status                 load_status NOT NULL DEFAULT 'SUBMITTED',
  client_generated_id    text UNIQUE,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_loads_status ON loads (status);
CREATE INDEX ix_loads_facility ON loads (destination_facility_id);

CREATE TABLE receipts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id               uuid NOT NULL UNIQUE REFERENCES loads(id),  -- one receipt per load
  facility_id           uuid NOT NULL REFERENCES facilities(id),
  arrival_time          timestamptz,
  received_quantity_kg  numeric(12,2) NOT NULL CHECK (received_quantity_kg >= 0),
  measurement_method_id uuid NOT NULL REFERENCES measurement_methods(id),
  condition             text,
  discrepancy_flag      boolean NOT NULL DEFAULT false,
  discrepancy_reason    text,
  received_by           uuid REFERENCES users(id),
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  -- If there is a discrepancy, a reason is mandatory.
  CONSTRAINT chk_discrepancy_reason
    CHECK (discrepancy_flag = false OR (discrepancy_reason IS NOT NULL AND length(btrim(discrepancy_reason)) > 0))
);

CREATE TABLE processing_records (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id               uuid NOT NULL REFERENCES loads(id),
  process_type          text,
  input_quantity_kg     numeric(12,2) CHECK (input_quantity_kg >= 0),
  output_quantity_kg    numeric(12,2) CHECK (output_quantity_kg >= 0),
  residual_quantity_kg  numeric(12,2) CHECK (residual_quantity_kg >= 0),
  compost_kg            numeric(12,2) NOT NULL DEFAULT 0 CHECK (compost_kg >= 0),
  landfill_kg           numeric(12,2) NOT NULL DEFAULT 0 CHECK (landfill_kg >= 0),
  transfer_kg           numeric(12,2) NOT NULL DEFAULT 0 CHECK (transfer_kg >= 0),
  other_kg              numeric(12,2) NOT NULL DEFAULT 0 CHECK (other_kg >= 0),
  incomplete            boolean NOT NULL DEFAULT false,
  processed_at          timestamptz NOT NULL DEFAULT now(),
  operator_id           uuid REFERENCES users(id),
  destination_id        uuid REFERENCES facilities(id),
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  -- Conservation of mass: allocation must equal input unless marked incomplete.
  CONSTRAINT chk_allocation_within_input
    CHECK (compost_kg + landfill_kg + transfer_kg + other_kg <= COALESCE(input_quantity_kg, compost_kg + landfill_kg + transfer_kg + other_kg) + 0.5)
);

CREATE INDEX ix_processing_load ON processing_records (load_id);

CREATE TABLE compost_batches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code      text NOT NULL UNIQUE,
  input_kg        numeric(12,2) NOT NULL CHECK (input_kg >= 0),
  output_kg       numeric(12,2) CHECK (output_kg >= 0),
  residual_kg     numeric(12,2) CHECK (residual_kg >= 0),
  processing_date date NOT NULL DEFAULT current_date,
  operator_id     uuid REFERENCES users(id),
  status          text NOT NULL DEFAULT 'PROCESSING',
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE transfer_shipments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_code         text NOT NULL UNIQUE,
  source_facility_id    uuid NOT NULL REFERENCES facilities(id),
  destination_name      text NOT NULL,
  container_number      text,
  quantity_kg           numeric(12,2) NOT NULL CHECK (quantity_kg >= 0),
  dispatch_time         timestamptz,
  status                shipment_status NOT NULL DEFAULT 'DRAFT',
  received_time         timestamptz,
  receiving_reference   text,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE shipment_loads (
  shipment_id   uuid NOT NULL REFERENCES transfer_shipments(id) ON DELETE CASCADE,
  load_id       uuid NOT NULL REFERENCES loads(id),
  quantity_kg   numeric(12,2) NOT NULL CHECK (quantity_kg >= 0),
  PRIMARY KEY (shipment_id, load_id)
);

CREATE TABLE shipment_receipts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id           uuid NOT NULL REFERENCES transfer_shipments(id) ON DELETE CASCADE,
  received_quantity_kg  numeric(12,2) NOT NULL CHECK (received_quantity_kg >= 0),
  difference_kg         numeric(12,2),
  received_at           timestamptz NOT NULL DEFAULT now(),
  received_by           uuid REFERENCES users(id),
  notes                 text
);

-- ---------------------------------------------------------------------------
-- Exceptions, audit, notifications, sync, attachments
-- ---------------------------------------------------------------------------
CREATE TABLE exceptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     text NOT NULL,
  entity_id       uuid,
  exception_type  text NOT NULL,
  severity        exception_severity NOT NULL DEFAULT 'WARNING',
  description     text NOT NULL,
  status          exception_status NOT NULL DEFAULT 'OPEN',
  created_by      uuid REFERENCES users(id),
  assigned_to     uuid REFERENCES users(id),
  resolution      text,
  resolved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_exceptions_status ON exceptions (status, severity);
CREATE INDEX ix_exceptions_entity ON exceptions (entity_type, entity_id);

-- Append-only. The application role should have UPDATE/DELETE revoked here.
CREATE TABLE audit_logs (
  id            bigserial PRIMARY KEY,
  user_id       uuid REFERENCES users(id),
  entity_type   text NOT NULL,
  entity_id     text,
  action        text NOT NULL,
  old_values    jsonb,
  new_values    jsonb,
  ip            inet,
  device_info   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_audit_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX ix_audit_user_time ON audit_logs (user_id, created_at DESC);

CREATE TABLE notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          text NOT NULL,
  title         text NOT NULL,
  body          text,
  entity_type   text,
  entity_id     text,
  read_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sync_events (
  id                  bigserial PRIMARY KEY,
  user_id             uuid REFERENCES users(id),
  client_generated_id text NOT NULL,
  entity_type         text NOT NULL,
  result              text NOT NULL,      -- SYNCED, FAILED, CONFLICT, IDEMPOTENT_REPLAY
  detail              text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ux_sync_client_id UNIQUE (client_generated_id)
);

CREATE TABLE attachments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   text NOT NULL,
  entity_id     text NOT NULL,
  file_url      text NOT NULL,
  content_type  text,
  uploaded_by   uuid REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Seed the immutable catalogues (categories & measurement methods)
-- ---------------------------------------------------------------------------
INSERT INTO waste_categories (code, name) VALUES
  ('BIODEGRADABLE',      'Biodegradable'),
  ('NON_BIODEGRADABLE',  'Non-biodegradable'),
  ('MIXED',              'Mixed'),
  ('RECYCLABLE',         'Recyclable'),
  ('OTHER',              'Other'),
  ('UNKNOWN',            'Unknown / Unclassified');

INSERT INTO measurement_methods (code, name) VALUES
  ('WEIGHBRIDGE',               'Weighbridge'),
  ('SCALE',                     'Scale'),
  ('MANUAL_ESTIMATE',           'Manual estimate'),
  ('VEHICLE_CAPACITY_ESTIMATE', 'Vehicle capacity estimate'),
  ('OTHER',                     'Other'),
  ('UNKNOWN',                   'Unknown');

INSERT INTO roles (code, name) VALUES
  ('SYSTEM_ADMINISTRATOR',      'System Administrator'),
  ('PROVINCIAL_OFFICER',        'Provincial Officer'),
  ('LGA_OFFICER',               'LGA / SWM Officer'),
  ('COLLECTION_SUPERVISOR',     'Collection Supervisor'),
  ('DRIVER',                    'Driver / Collection Crew'),
  ('FACILITY_RECEIVING_OFFICER','Facility Receiving Officer'),
  ('FACILITY_PROCESSING_OPERATOR','Facility Processing Operator'),
  ('FACILITY_MANAGER',          'Facility Manager');

COMMIT;

-- ---------------------------------------------------------------------------
-- Operational note on immutability of audit_logs (run as the DB owner):
--   REVOKE UPDATE, DELETE ON audit_logs FROM wasteflow_app;
-- ---------------------------------------------------------------------------
