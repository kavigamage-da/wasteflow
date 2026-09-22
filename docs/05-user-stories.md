# 05 — User Stories

> Format: `As a <role> I want <capability> so that <benefit>`. Acceptance criteria are testable.
> **Classifier:** PROPOSED.

## Driver / Collection Crew
- **US-D1** As a driver I want to start a trip from my phone so that my run is recorded with the correct vehicle and route.
  - *AC:* Vehicle and LGA required; start time auto-captured; a second active trip for the same vehicle is blocked.
- **US-D2** As a driver I want to record a collection in a few taps so that reporting does not slow down my route.
  - *AC:* Point, category, method and quantity captured; `Unknown` selectable; quantity ≥ 0.
- **US-D3** As a driver I want the app to work with no signal so that I never lose a record.
  - *AC:* Trip/collection saved locally; `PENDING` shown; syncs automatically on reconnect.
- **US-D4** As a driver I want to complete a trip and get a Load ID + QR so that the facility can identify my load.
  - *AC:* Completion blocked with no collections; Load ID generated; QR contains only the Load ID.

## Collection Supervisor
- **US-S1** As a supervisor I want to see all trips and their sync status so that I can spot missing records.
- **US-S2** As a supervisor I want discrepancies and sync failures raised as exceptions so that I can investigate.
- **US-S3** As a supervisor I want to correct a completed record with a reason and audit trail so that history is trustworthy.

## LGA / SWM Officer
- **US-L1** As an LGA officer I want LGA-scoped dashboards and reports so that I can report collection performance.
- **US-L2** As an LGA officer I want to manage routes and assign vehicles/crews so that work assignments reflect reality.

## Facility Receiving Officer
- **US-R1** As a receiving officer I want to scan or search a Load ID so that I can retrieve the incoming load quickly.
  - *AC:* Unknown ID shows a clear empty state; known ID shows vehicle, source, category, declared quantity, arrival.
- **US-R2** As a receiving officer I want automatic discrepancy detection with a mandatory reason so that differences are recorded, not hidden.
  - *AC:* Declared ≠ received requires a reason; declared value never overwritten; load flagged `EXCEPTION`.
- **US-R3** As a receiving officer I want to reject or flag a load so that problems are visible downstream.

## Facility Processing Operator
- **US-P1** As a processing operator I want to allocate received quantity across outcomes so that the destination of every kg is recorded.
  - *AC:* `Compost + Landfill + Transfer + Other = Received`, unless marked incomplete.
- **US-P2** As a processing operator I want to record compost batches so that inputs, outputs and residuals are traceable.

## Facility Manager
- **US-F1** As a facility manager I want incoming/processing/transfer overviews so that I can manage throughput.
- **US-F2** As a facility manager I want facility reports and exception review so that I can act on problems.

## Provincial Officer
- **US-O1** As a provincial officer I want a district-wide read-only dashboard so that I can monitor participating LGAs.
- **US-O2** As a provincial officer I want to compare reporting periods so that I can see trends.
- **US-O3** As a provincial officer I want to export reports so that I can share them officially.

## System Administrator
- **US-A1** As an admin I want to manage users, roles, LGAs, vehicles, facilities and categories so that master data stays accurate.
  - *AC:* No list is hard-coded; deactivation is soft (`active = false`).
- **US-A2** As an admin I want immutable audit logs so that changes are attributable.

## Executive / Chief Minister
- **US-E1** As an executive I want a single screen answering where waste came from, where it went and where the gaps are so that I can assess operations quickly.
  - *AC:* Demo figures are clearly marked **DEMO DATA**.
- **US-E2** As an executive I want to enter a Load ID and see its chain from source to final outcome.

## Cross-cutting stories
- **US-X1** As any user I want search across Load/Trip/vehicle/LGA/date/facility/shipment so that I can find records fast.
- **US-X2** As any user I want clear empty, loading and error states so that the app never appears broken.
- **US-X3** As any user I want Sinhala or English so that I can work in my language.
