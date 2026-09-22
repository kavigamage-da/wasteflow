# 04 — Requirements

> **Classifier:** Functional requirements are **PROPOSED**. No requirement asserts current Monroviawatta practice.

## 1. Functional requirements

### FR-1 Authentication & access
- **FR-1.1** Users authenticate with username/email + password over HTTPS.
- **FR-1.2** Sessions use short-lived access tokens + refresh tokens; tokens are never logged.
- **FR-1.3** RBAC enforced server-side; client-supplied role/IDs are never trusted.
- **FR-1.4** Records are scoped: a driver sees only their LGA; a facility role only its facility.
- **FR-1.5** Failed-login rate limiting and account lockout.
- **FR-1.6** Audit log immutable and readable only by authorized roles.

### FR-2 Master data (configurable, never hard-coded)
- **FR-2.1** LGAs (code, name, type, active).
- **FR-2.2** Facilities (name, capacity reference, active).
- **FR-2.3** Vehicles (code, registration, type, LGA, capacity, active).
- **FR-2.4** Routes + route assignments.
- **FR-2.5** Waste categories incl. `Unknown/Unclassified`.
- **FR-2.6** Measurement methods incl. `Weighbridge`, `Scale`, `Manual estimate`, `Vehicle capacity estimate`, `Other`, `Unknown`.
- **FR-2.7** Users (name, username, email, role, LGA, facility, active).

### FR-3 Trips
- **FR-3.1** Create a trip with vehicle, route (optional), LGA, source area, auto driver + auto start time.
- **FR-3.2** Prevent a second active trip for the same vehicle.
- **FR-3.3** Trip states: `DRAFT, IN_PROGRESS, COMPLETED, SUBMITTED, CANCELLED`.
- **FR-3.4** Completed trips are not editable by normal users; corrections go through the correction workflow.

### FR-4 Collections
- **FR-4.1** Record a collection: point, category, measurement method, quantity, optional photo, optional GPS, notes, auto timestamp.
- **FR-4.2** `Unknown/Unclassified` always selectable — a category is never forced.
- **FR-4.3** Quantity is stored with its measurement method for every entry.

### FR-5 Loads & identity
- **FR-5.1** Completing a trip generates a unique Load ID `LD-YYYYMMDD-NNNNN`.
- **FR-5.2** A Load QR encodes **only** the Load ID (no personal data).
- **FR-5.3** Load states: `SUBMITTED, ARRIVED, RECEIVED, PROCESSING, COMPLETED, EXCEPTION, CANCELLED`.

### FR-6 Receiving
- **FR-6.1** Search or scan a Load ID to retrieve the load.
- **FR-6.2** Record received quantity, measurement method, condition, notes.
- **FR-6.3** If declared ≠ received, a discrepancy reason is **mandatory**; the declared value is never overwritten.
- **FR-6.4** Accept / reject / flag the load.
- **FR-6.5** A load cannot be received twice.

### FR-7 Processing
- **FR-7.1** Allocate received quantity across Compost / Landfill / Transfer / Other (and Unknown/pending).
- **FR-7.2** Enforce `Compost + Landfill + Transfer + Other = Received` unless the record is explicitly marked incomplete.
- **FR-7.3** Compost batches record input, output, residual, operator, status.

### FR-8 Transfers
- **FR-8.1** Create a shipment (source facility, destination, container no., category, quantity, dispatch date, related loads).
- **FR-8.2** Shipment states: `DRAFT, DISPATCHED, IN_TRANSIT, RECEIVED, EXCEPTION, CANCELLED`.
- **FR-8.3** Without destination confirmation the state remains `AWAITING CONFIRMATION`; final delivery is never assumed.

### FR-9 Traceability
- **FR-9.1** Enter any Load ID and see the full chain with responsible users and timestamps.
- **FR-9.2** Reconciliation block shows declared, received, allocated and variance.

### FR-10 Exceptions
- **FR-10.1** Detect: missing quantity, duplicate load, vehicle/LGA mismatch, declared-received difference, received-not-processed, processed-not-finalised, transfer awaiting confirmation, offline sync failure, invalid timestamp.
- **FR-10.2** Severity (Critical/Warning) and status (Open/Resolved) are tracked; resolution is recorded.

### FR-11 Reconciliation & data quality
- **FR-11.1** Compute `Declared − Received` and `Received − Allocated`; always display both.
- **FR-11.2** Never hide a difference; allow a supervisor to record reason/investigation/correction/approval.
- **FR-11.3** Data completeness score = completed required fields ÷ total required fields × 100 (system metric).

### FR-12 Reporting & export
- **FR-12.1** Daily, monthly, vehicle, LGA, receiving, processing, transfer, exception, data-quality and traceability reports.
- **FR-12.2** Filters: date, LGA, facility, waste category.
- **FR-12.3** Export CSV, Excel, PDF; PDF carries a header (reporting period, generated time, prepared-by) and the filters used.

### FR-13 Audit & corrections
- **FR-13.1** Log user, action, entity, entity id, timestamp, old value, new value, device metadata.
- **FR-13.2** Audit history cannot be deleted by any user.
- **FR-13.3** Sensitive corrections follow `Draft → Submitted → Supervisor Review → Approved`; historical data is never silently modified.

### FR-14 Offline & sync
- **FR-14.1** Capture trips, collections and permitted receiving/processing without connectivity (Room).
- **FR-14.2** Each local record carries `client_generated_id, created_at, updated_at, sync_status`.
- **FR-14.3** Sync states: `PENDING, SYNCING, SYNCED, FAILED, CONFLICT`.
- **FR-14.4** Idempotency keys prevent duplicate submission; local records are not deleted before server confirmation.
- **FR-14.5** Conflicts show server vs device values; a supervisor resolves (keep server / review).

### FR-15 Notifications
- Assignment, receiving, exception, processing, transfer and sync notifications.

## 2. Non-functional requirements

### NFR-1 Security
Secure hashing (bcrypt/Argon2), JWT expiry, refresh tokens, input validation & sanitisation, parameterised queries, HTTPS, rate limiting, secure secret storage, no secrets in source, tested backups. See `13-security.md`.

### NFR-2 Performance
Dashboard summary < 2 s at typical district volumes; API p95 < 500 ms for list endpoints; mobile screens respond < 300 ms from local cache.

### NFR-3 Availability & durability
Daily encrypted backups with configurable retention and periodic restore testing. No claimed retention period beyond what is officially approved.

### NFR-4 Offline capability
The mobile app remains usable with no connectivity; the queue drains automatically on reconnect.

### NFR-5 Accessibility
Minimum ~44dp touch targets, screen-reader labels, high contrast, no colour-only information, Sinhala/English support.

### NFR-6 Localisation
All UI text in resource files; architecture supports English, Sinhala and future Tamil. No hard-coded UI text.

### NFR-7 Maintainability
TypeScript strict mode on the backend; clean architecture; repository/service/controller separation; DTO validation; Android MVVM + repository pattern; linting and formatting; automated tests.

### NFR-8 Auditability
Every important change is attributable and reversible-by-record (via corrections), not by deletion.

### NFR-9 KPI honesty (guardrail)
The system must **not** claim money saved, fuel saved, emissions reduced or productivity increased unless an actual baseline exists. Such metrics may be calculated later, after reliable data collection.

### NFR-10 Privacy
Collect only information necessary for operations. Driver/worker information accessible only to authorized personnel.

## 3. Constraints

- **C-1** MVP must not include AI, blockchain, advanced GPS, predictive analytics, facial recognition, unnecessary IoT or a citizen application.
- **C-2** GPS is optional and configurable; the system must function without it.
- **C-3** If real-time GPS is unavailable, show "Last reported status", never simulated live tracking.
- **C-4** The database is PostgreSQL.
- **C-5** WasteFlow does not replace e-Sabha or e-Pura Neguma.
