# 06 — Use Cases

> **Classifier:** PROPOSED. Actors map to the role definitions in `03-stakeholders.md`.

## UC-01 Record a collection trip (Driver)
**Preconditions:** Signed in; vehicle and LGA available; may be offline.
**Main flow:**
1. Driver opens Start Trip.
2. Selects vehicle (active only), optional route, source LGA, source area.
3. System captures start time and driver automatically; validates no active trip for the vehicle.
4. Trip created with status `IN_PROGRESS`, saved locally, queued for sync.
5. Driver adds one or more collections (point, category, method, quantity, optional photo/GPS).
6. Driver completes the trip; system validates ≥ 1 collection and a start time.

**Alternative flows:**
- *A1* No collection recorded → completion blocked with a clear message.
- *A2* Offline → all records `PENDING`; sync on reconnect.
- *A3* Duplicate active trip for vehicle → blocked.

**Postcondition:** Trip `SUBMITTED`; Load created with unique `LD-YYYYMMDD-NNNNN` and a QR.

## UC-02 Receive a load (Receiving Officer)
1. Officer scans the QR or searches the Load ID.
2. System returns the load (vehicle, source, category, declared quantity, arrival).
3. Officer enters received quantity + measurement method + condition.
4. If declared ≠ received, system requires a reason and flags a discrepancy.

**Postcondition:** Receipt recorded; load `RECEIVED` or `EXCEPTION`; declared value unchanged.
**Exception:** Load already received → blocked.

## UC-03 Process a load (Processing Operator)
1. Operator opens the processing queue (loads received, not completed).
2. Allocates Compost / Landfill / Transfer / Other.
3. System enforces conservation: sum must equal received, unless marked incomplete.

**Postcondition:** Processing record created; load `PROCESSING` or `COMPLETED`.

## UC-04 Create a transfer shipment (Processing Operator / Manager)
1. Source facility defaulted; select destination.
2. Enter container number, category, quantity, dispatch date; link loads.
3. Shipment created as `DRAFT` → `DISPATCHED` → `IN_TRANSIT`.
4. Destination confirms receipt (declared vs received).

**Alternative:** No destination confirmation → `AWAITING CONFIRMATION` (final delivery not assumed).

## UC-05 Trace a load (any authorized user)
1. Enter Load ID (or arrive from search/QR).
2. System shows the timeline: Created → Trip → Collection → Arrived → Received → Processing → Outcome, each with responsible user and timestamp where recorded.
3. System shows the reconciliation block (declared / received / allocated / variance).

## UC-06 Investigate and resolve an exception (Supervisor / LGA Officer)
1. Supervisor opens the exception register.
2. Reviews severity, entity and description.
3. Records investigation, reason and resolution (assign to a user where needed).

**Postcondition:** Exception `RESOLVED` with resolution text; audit entry created.

## UC-07 Correct a completed record (Supervisor, approved)
1. User raises a correction request against a completed record with a reason.
2. Request enters `SUBMITTED` → `Supervisor Review`.
3. On approval the system writes the new value and an audit entry (old → new).

**Guarantee:** Historical values are never silently overwritten.

## UC-08 Synchronise offline records (Driver / facility user)
1. Device regains connectivity.
2. Sync engine submits each pending record with its `clientGeneratedId`.
3. Server accepts (idempotent) or rejects; per-record result shown.

**Alternative:** Server has a newer version → `CONFLICT`; user chooses Keep Server / Review.
**Guarantee:** No local record is deleted before server confirmation.

## UC-09 Generate and export a report (Provincial / LGA / Facility Manager)
1. User selects report type, period and filters (date, LGA, facility, category).
2. System computes totals from operational records.
3. User exports CSV / Excel / PDF; PDF header shows period, generated time and filters used.

## UC-10 Manage master data (Administrator)
1. Admin adds/updates LGAs, facilities, vehicles, routes, categories, users.
2. Deactivation is soft; referential integrity preserved.

## Use-case to requirement traceability
| Use case | Requirements |
|---|---|
| UC-01 | FR-3, FR-4, FR-5, FR-14 |
| UC-02 | FR-6, FR-10 |
| UC-03 | FR-7, FR-10, FR-11 |
| UC-04 | FR-8 |
| UC-05 | FR-9, FR-11 |
| UC-06 | FR-10, FR-13 |
| UC-07 | FR-13 |
| UC-08 | FR-14 |
| UC-09 | FR-12 |
| UC-10 | FR-2 |
