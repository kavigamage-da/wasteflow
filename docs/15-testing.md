# 15 — Testing Strategy

> **Classifier:** PROPOSED test strategy for the WasteFlow prototype.

## 1. Test layers

| Layer | Scope | Examples |
|---|---|---|
| Unit | Pure rules & services | conservation of mass, discrepancy rules, ID generation |
| Integration | Service + DB | receiving transaction, exception creation, audit write |
| API | HTTP contract | envelopes, validation errors, authZ, idempotency |
| UI (Android/Web) | Screen behaviour | form validation, states, navigation |
| Database | Constraints/triggers | FKs, unique/partial-unique indexes, check constraints |
| Offline | Room + sync | offline capture, retry, conflict |
| Security | AuthN/AuthZ | cross-LGA access denied, no token leakage |
| Role | Permission matrix | each role can/cannot perform expected actions |
| Performance/Load | Throughput/latency | dashboard under load, p95 API latency |

## 2. Mandatory scenarios

### Scenario 1 — Trip to load
Create trip → add collections → complete → Load ID generated (`LD-…`) with QR.

### Scenario 2 — Receiving
Load → facility receiving → quantity confirmed → status `RECEIVED`.

### Scenario 3 — Receiving discrepancy
Declared 2,600 kg, received 2,550 kg → difference −50 kg → reason captured → exception created,
declared value unchanged.

### Scenario 4 — Processing reconciliation
Received load → allocation Compost/Landfill/Transfer/Other → totals reconcile to received.

### Scenario 5 — Transfer to destination
Processing → transfer shipment → dispatch → destination confirmation; without confirmation status is
`AWAITING CONFIRMATION`.

### Scenario 6 — Offline then sync
Mobile offline → create load → connectivity returns → sync succeeds → pending count returns to zero.

### Scenario 7 — Duplicate sync prevention
Replay the same `clientGeneratedId` → server returns the original record; no duplicate.

### Scenario 8 — Unauthorized access
Driver attempts to modify another LGA's record → `403 FORBIDDEN`; no change; audit of the attempt.

### Scenario 9 — Correction with audit
Supervisor corrects a completed record → audit entry records old → new with user and timestamp.

### Scenario 10 — Dashboard filters
Dashboard filtered by LGA/date → totals match the underlying records exactly (no rounding drift beyond display).

## 3. Invariants to assert everywhere

- `quantity_kg >= 0` and `received_quantity_kg >= 0`.
- A load cannot be received twice.
- `Compost + Landfill + Transfer + Other = Received` (unless explicitly incomplete).
- `end_time >= start_time`.
- At most one active trip per vehicle.
- Vehicle and LGA referenced by a trip must be active.
- Completed trips are not editable by normal users.
- Every mutation produces an audit entry.
- Repeating a mutation with the same idempotency key does not duplicate.

## 4. Demo data & the `LD-DEMO-001` walkthrough

Synthetic confirmation of Scenario 3/4:

```
LGA:       Galle MC
Vehicle:   DEMO-001
Trip:      TR-DEMO-001
Load:      LD-DEMO-001
Declared:  2,600 kg
Received:  2,550 kg   →  −50 kg discrepancy → EXCEPTION
Processing:
  Compost:  1,700 kg
  Landfill:   650 kg
  Transfer:   200 kg
  = 2,550 kg (equals received ✔)
```

End-to-end demonstration sequence:
```
Create Trip → Record Collection → Generate Load ID → Scan QR → Receive
→ Detect 50 kg discrepancy → Process → Dashboard → Report
```

## 5. Test data isolation

- Tests never run against production data.
- Seeded demo data is clearly namespaced (`DEMO-`, `LD-DEMO-`) and marked synthetic.
- Assertions about "real" operational figures are forbidden in tests and demos.

## 6. Exit criteria for the MVP

All ten scenarios pass; invariants hold under tests; security and role tests pass; offline and sync
tests pass; dashboards and reports reconcile to underlying records; audit log is complete and immutable.
