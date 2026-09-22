# 10 — Database

> **Classifier:** PROPOSED. Target: **PostgreSQL 15+**. DDL in `../database/schema.sql`;
> synthetic seed data in `../database/seed.sql`.

## 1. Entity-relationship overview (text)

```
lgas 1───* vehicles
lgas 1───* routes
lgas 1───* users
facilities 1───* users
facilities 1───* receipts
facilities 1───* transfer_shipments (source)

routes 1───* trips
vehicles 1───* trips
users (driver) 1───* trips

trips 1───* collection_events
trips 1───* loads

waste_categories 1───* collection_events
waste_categories 1───* loads

loads 1───0..1 receipts
loads 1───* processing_records
loads *───* transfer_shipments  (through shipment_loads)

transfer_shipments 1───* shipment_loads
transfer_shipments 1───* shipment_receipts
transfer_shipments 1───0..1 processing_records (transfer outcome link)

users 1───* audit_logs
users 1───* exceptions (created_by, assigned_to)
users 1───* notifications

roles 1───* role_permissions *───1 permissions
users *───* roles  (through user_roles)
```

## 2. Core tables

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Accounts | id, name, username, email, password_hash, role_id, lga_id, facility_id, active |
| `roles` | Role catalogue | id, code, name |
| `permissions` | Permission catalogue | id, code (`resource:action`) |
| `role_permissions` | Role→permission map | role_id, permission_id |
| `user_roles` | User→role map (supports multi-role) | user_id, role_id |
| `lgas` | Local authorities | id, code, name, type, active |
| `facilities` | Facilities | id, code, name, reference_capacity_mt_day, active |
| `vehicles` | Fleet | id, vehicle_code, registration_number, vehicle_type, lga_id, capacity_kg, active |
| `routes` | Routes | id, route_name, lga_id, source_area, active |
| `route_assignments` | Route/vehicle/crew assignment | id, route_id, vehicle_id, crew_user_id, assigned_date |
| `waste_categories` | Configurable categories | id, code, name, active |
| `measurement_methods` | Configurable methods | id, code, name |
| `trips` | Trip runs | id, trip_code, route_id, vehicle_id, driver_id, lga_id, start_time, end_time, status, source_area, created_by |
| `collection_events` | Per-point collections | id, trip_id, location_description, lat, lng, waste_category_id, measurement_method_id, quantity_kg, photo_url, collected_at, client_generated_id |
| `loads` | Unit of traceability | id, load_code, trip_id, declared_quantity_kg, waste_category_id, destination_facility_id, status, client_generated_id |
| `receipts` | Facility receiving | id, load_id, facility_id, arrival_time, received_quantity_kg, measurement_method_id, condition, discrepancy_flag, discrepancy_reason, received_by |
| `processing_records` | Allocation | id, load_id, process_type, input_quantity_kg, output_quantity_kg, residual_quantity_kg, compost_kg, landfill_kg, transfer_kg, other_kg, incomplete, processed_at, operator_id, destination_id |
| `compost_batches` | Batch tracking | id, batch_code, input_kg, output_kg, residual_kg, processing_date, operator_id, status |
| `transfer_shipments` | Shipments | id, shipment_code, source_facility_id, destination_name, container_number, quantity_kg, dispatch_time, status, received_time, receiving_reference |
| `shipment_loads` | Shipment↔load link | shipment_id, load_id, quantity_kg |
| `shipment_receipts` | Destination confirmation | id, shipment_id, received_quantity_kg, difference_kg, received_at, received_by |
| `exceptions` | Exception register | id, entity_type, entity_id, exception_type, severity, description, status, created_by, assigned_to, resolution, resolved_at |
| `audit_logs` | Immutable audit | id, user_id, entity_type, entity_id, action, old_values (jsonb), new_values (jsonb), ip, device_info, created_at |
| `notifications` | Notifications | id, user_id, type, title, body, entity_type, entity_id, read_at |
| `sync_events` | Sync audit | id, user_id, client_generated_id, entity_type, result, detail, created_at |
| `attachments` | Photos | id, entity_type, entity_id, file_url, content_type, uploaded_by |

## 3. Integrity rules

- **Foreign keys** on every relationship; `ON DELETE RESTRICT` for operational records.
- **Unique constraints** — `trips.trip_code`, `loads.load_code`, `collection_events.client_generated_id`, `receipts.load_id` (one receipt per load).
- **Check constraints** — `quantity_kg >= 0`, `received_quantity_kg >= 0`, `end_time IS NULL OR end_time >= start_time`.
- **Partial unique index** — at most one active trip per vehicle:
  ```sql
  CREATE UNIQUE INDEX ux_one_active_trip_per_vehicle
    ON trips (vehicle_id)
    WHERE status IN ('DRAFT','IN_PROGRESS');
  ```
- **Transactions** — receiving, processing and reconciliation writes are transactional.
- **Soft deletion** — `active = false` / archival status; important operational records are never hard-deleted.
- **Indexes** — on `loads(load_code)`, `loads(status)`, `trips(vehicle_id,status)`, `collection_events(trip_id)`, `receipts(load_id)`, `audit_logs(entity_type,entity_id)`, `exceptions(status,severity)`, and date columns used by reports.

## 4. Immutability of audit

`audit_logs` has no update/delete path exposed to any role. Recommended: revoke UPDATE/DELETE on the
table from the application role, and append only.

## 5. Reconciliation queries (illustrative)

```sql
-- Declared vs received variance per load
SELECT l.load_code,
       l.declared_quantity_kg,
       r.received_quantity_kg,
       COALESCE(r.received_quantity_kg,0) - l.declared_quantity_kg AS variance
FROM loads l
LEFT JOIN receipts r ON r.load_id = l.id;

-- Received vs allocated variance
SELECT l.load_code,
       r.received_quantity_kg,
       COALESCE(p.compost_kg,0)+COALESCE(p.landfill_kg,0)
         +COALESCE(p.transfer_kg,0)+COALESCE(p.other_kg,0) AS allocated,
       r.received_quantity_kg
         - (COALESCE(p.compost_kg,0)+COALESCE(p.landfill_kg,0)
            +COALESCE(p.transfer_kg,0)+COALESCE(p.other_kg,0)) AS unaccounted
FROM loads l
JOIN receipts r ON r.load_id = l.id
LEFT JOIN processing_records p ON p.load_id = l.id;
```

## 6. Data-completeness scoring

```
completeness = (non-null required fields across eligible records) / (total required fields) * 100
```
Required fields per load: category, quantity, measurement method, destination, receipt (where arrived),
processing record (where received). This is a **system-generated metric**, not a claim about real-world data quality.

## 7. Migration policy

- Versioned SQL migrations; forward-only.
- `development → staging → UAT → production`; backups taken before each production migration.
- No destructive changes to operational tables without an approved migration plan.
