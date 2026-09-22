# 02 — Scope

> **Evidence classification:** This scope is **PROPOSED**. It does not assert current practice at Monroviawatta or any LGA.

## 1. Purpose

Define what WasteFlow will and will not deliver, so that expectations during pilot discussion remain grounded in what the system can actually do.

## 2. In scope (MVP)

The MVP focuses on **reliable operational data capture and traceability**:

1. **Authentication & RBAC** — 8 roles, permission enforcement server-side.
2. **Master data** — LGAs, facilities, vehicles, waste categories, routes, users. All configurable; none hard-coded.
3. **Trips** — creation, assignment, start/complete, lifecycle states.
4. **Collections** — per-trip collection events with category, quantity, measurement method, optional photo/GPS.
5. **Loads** — a unique Load ID generated on trip submission; QRs encode the Load ID only.
6. **Receiving** — search/scan a load, record received quantity + method, detect discrepancy, accept/reject/flag.
7. **Processing** — allocation across Compost / Landfill / Transfer / Other (and Unknown/pending) with conservation enforcement.
8. **Compost batches** — batch records with input, output, residual, status.
9. **Transfers** — shipment creation, dispatch, destination confirmation, awaiting-confirmation state.
10. **Reconciliation** — declared vs received vs allocated variance, always shown.
11. **Exceptions** — automated and manual exception register with severity and resolution.
12. **Audit** — immutable log of important changes.
13. **Reporting** — daily, monthly, vehicle, LGA, receiving, processing, transfer, exception, data-quality, traceability; export to CSV/XLSX/PDF.
14. **Dashboards** — operational dashboard, role-specific views, executive presentation mode (demo-labelled).
15. **Offline-first mobile** — capture without connectivity, sync with idempotency and conflict handling.

## 3. Out of scope (MVP)

| Excluded | Reason |
|---|---|
| e-Sabha citizen complaints | Separate system; possible future integration only. |
| e-Pura Neguma administration | Separate system. |
| Route optimization | Requires reliable baseline data first. |
| Predictive analytics / forecasting | Requires historical data. |
| AI, blockchain, facial recognition | Do not serve the core problem; add risk. |
| IoT sensors | Future, after validation. |
| Automatic weighbridge integration | Feasibility UNVERIFIED; manual entry supported first. |
| Live GPS tracking | Existence of GPS UNVERIFIED; map is Phase 2. |
| Citizen-facing application | Out of operational scope. |
| Financial costing / billing | Requires confirmed data ownership and rates. |
| Cross-organization data federation | Requires governance agreements. |

## 4. System boundaries

```
┌─────────────────────────────────────────────────────────────┐
│  e-Sabha                     e-Pura Neguma                  │
│  Citizen complaints          General local-government admin │
│  (SEPARATE — not replaced)   (SEPARATE — not replaced)      │
└─────────────────────────────────────────────────────────────┘
                          │  future, if approved
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  WASTEFLOW                                                  │
│  Operational waste movement: collection, transport,         │
│  receiving, processing, transfer, reconciliation, monitoring│
└─────────────────────────────────────────────────────────────┘
                          │  future, if APIs/data ownership confirmed
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  External systems: weighbridge, GPS, ERP, payments          │
└─────────────────────────────────────────────────────────────┘
```

WasteFlow should not claim to replace existing systems. Future integration is conditional on API availability and confirmed data ownership.

## 5. Future scope (post-MVP validation)

- GPS integration (vehicle location), configurable and optional.
- Weighbridge integration (automatic weight capture) — subject to U3 confirmation.
- IoT facility monitoring.
- Predictive analytics and forecasting.
- Route optimization.
- Selected e-Sabha information integration.
- Push notifications.
- Tamil localization (architecture already supports it).
- Advanced analytics / trend analysis.
- External system integration after governance approval.

## 6. Phasing

| Phase | Deliverable |
|---|---|
| 1 Foundation | Repo, backend, PostgreSQL, auth, RBAC, migrations, API structure |
| 2 Master data | LGAs, vehicles, users, facilities, waste categories |
| 3 Core operations | Routes, trips, collections, loads, QR IDs |
| 4 Facility | Receiving, discrepancies, processing, compost batches, transfers |
| 5 Web dashboard | KPIs, charts, tables, filters, search, traceability |
| 6 Reporting | Daily/monthly/LGA/vehicle/processing/transfer/reconciliation reports |
| 7 Offline | Room, sync queue, retry, conflict handling, offline status |
| 8 Audit & data quality | Audit logs, exception engine, completeness, reconciliation |
| 9 Testing | Unit, integration, API, UI, DB, offline, security, role, load tests |

## 7. Scope guardrails

- **No overengineering.** MVP is `Trip → Load → Receiving → Processing → Transfer/Outcome → Dashboard → Report`.
- **No misleading KPIs.** No claims of money saved, fuel saved, emissions reduced or productivity increased unless a real baseline exists. (See §requirements NFR-KPI.)
- **No fake real-time.** If GPS is absent, show "Last reported status", never simulated live tracking.
- **No silent data changes.** Corrections go through the correction workflow and are audited.
- **No forced categories.** `Unknown/Unclassified` is always available.
