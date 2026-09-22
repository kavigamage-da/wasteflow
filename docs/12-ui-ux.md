# 12 — UI / UX Design System

> **Classifier:** PROPOSED. Applies to both the Android app and the web dashboard.

## 1. Visual language

Professional public-sector system. Deep green primary, teal secondary, calm neutral background.

| Token | Value | Use |
|---|---|---|
| Primary | Deep Green `#1B5E20` | App bars, primary actions, headings |
| Secondary | Teal `#00897B` | KPI accents, receipts |
| Background | `#F5F7F6` | App/page background |
| Cards | White `#FFFFFF` | Content surfaces |
| Text | Dark charcoal `#212121` | Body text |
| Muted text | `#5F6B63` | Secondary labels |
| Warning | Amber `#FFB300` | Processing, pending |
| Error | Red `#D32F2F` | Exceptions, destructive |
| Success | Green `#2E7D32` | Completed |
| Divider | `#E0E6E2` | Table rules, separators |

**Rules:** 8px spacing system · 12–16px border radius · subtle shadows only · accessible contrast ·
clean tables · clear icons. **Avoid:** excessive gradients, gaming-style interfaces, unnecessary
animation, huge decorative graphics, confusing dashboards.

## 2. Status colours

| Status | Colour |
|---|---|
| DRAFT | Gray |
| SUBMITTED | Blue |
| IN TRANSIT / IN PROGRESS | Purple |
| RECEIVED | Teal |
| PROCESSING | Amber |
| COMPLETED | Green |
| EXCEPTION | Red |
| CANCELLED | Dark Gray |

Status is always shown as **text + colour** (never colour alone).

## 3. Android app

### Navigation
Field roles (driver/crew/supervisor): `Home · Trips · Receiving · Sync · Profile`.
Facility roles: `Home · Receiving · Processing · Sync · Profile`.

### Field-first principles
Large touch targets (≥44dp) · minimal typing · simple navigation · Sinhala + English ·
offline-first · clear status colours · fast forms · automatic timestamps · automatic user info ·
automatic IDs · confirmation before irreversible actions.

### Login
```
WASTEFLOW
Solid Waste Operations System
[ Username ]
[ Password            👁 ]
[         SIGN IN         ]
Forgot password?     Connection: ● Online
```

### Home dashboard
`Good day, Officer` → KPI cards (Trips · Recorded · Pending sync) → quick actions
(Start Trip · My Trips · Receiving · Processing) → recent loads with status badges.

### Start Trip
Vehicle · Route · Driver (auto) · Crew · Source LGA · Source Area · Start Time (auto) → `START TRIP`.
After creation: Trip ID, vehicle, `● IN PROGRESS`, `[ ADD COLLECTION ]`.

### Add Collection
Collection Point · Waste Category (dropdown, includes Unknown) · Measurement Method (dropdown) ·
Quantity (kg) · Notes · `[ Add Photo ]` → `SAVE COLLECTION`.
Collection list shows numbered entries and a running total.

### Complete Trip
Trip Summary (vehicle, collections count, total) → `[ SUBMIT TRIP ]` → `Load ID`, QR, status
`SUBMITTED`, `[ VIEW LOAD ]`.

### Receiving
`[ SCAN QR ]` or Load ID search → Load Found (vehicle, source, type, declared quantity, arrival) →
Received Quantity · Measurement Method · Condition · Notes → confirm.
On difference: bold **Quantity Difference** block, reason required, `[ CONFIRM WITH DISCREPANCY ]`.
The declared value is never overwritten.

### Processing
Load · Received quantity → Compost · Landfill · Transfer · Other → live
`Allocated / Remaining` with `[ SAVE PROCESSING ]`. Sum must equal received unless marked incomplete.

### Sync
`Pending Records`, per-record ✓/✗ list, `Retry`. Offline message: "Data will be saved locally. It will
synchronize when connectivity returns."

## 4. Web dashboard

```
┌───────────────────────────────────────────────┐
│ WASTEFLOW                     Officer ▼        │
├────────────┬──────────────────────────────────┤
│ Dashboard  │                                  │
│ Trips      │           MAIN CONTENT           │
│ Loads      │                                  │
│ Receiving  │                                  │
│ Processing │                                  │
│ Transfers  │                                  │
│ Reports    │                                  │
│ Exceptions │                                  │
│ Vehicles   │                                  │
│ LGAs       │                                  │
│ Users      │                                  │
│ Audit Logs │                                  │
│ Settings   │                                  │
└────────────┴──────────────────────────────────┘
```

### Dashboard KPIs
Total Loads Today · Total Waste Recorded · Received · Processing · Transferred · Exceptions.
*(Demo values only; never presented as real Monroviawatta figures.)*

### Charts
Waste by LGA (bar) · Waste by Category (donut) · Daily Waste Trend (line) ·
Processing Outcome (stacked bar: Compost/Landfill/Transfer/Other) · Vehicle Activity (table) ·
Data Quality (complete records, missing weight, missing destination, other).

### Filter bar (on every dashboard)
`Date [Today ▼] · LGA [All ▼] · Facility [All ▼] · Waste Type [All ▼] · [Apply] · [Reset]`

### Capacity monitor
```
Reference Capacity  40 MT/day        (configurable administrative value)
Recorded Today      32.4 MT
Reference Utilisation 81%
```
Always labelled: **Reference capacity — configurable administrative value.**

## 5. Table UX
Sorting · pagination · column visibility · export · row click · status badges.
Example columns: `Load ID · Vehicle · LGA · Qty · Status`.

## 6. Empty / loading / error states

**Empty**
```
No Loads Found
There are no loads matching your current filters.
[ Clear Filters ]
```

**Loading** — skeleton loaders; never freeze the interface.

**Error**
```
Unable to load records.
Your internet connection may be unavailable.
[ Retry ]
```

**Offline (mobile)**
```
You're offline.
Your data is saved locally and will sync automatically.
```

## 7. Search & filtering
Global search supports Load ID, Trip ID, vehicle registration, LGA, date, facility, shipment ID.
Every table supports date range, LGA, vehicle, category, status, facility, measurement method, plus
**Clear filters** and **Save filter**.

## 8. Real-time honesty
There is no fake live tracking. Where GPS is unavailable the UI shows **Last reported status**.
A map module (collection areas, route, optional vehicle location, facility, transfer destination) is
Phase 2 and must function without GPS.

## 9. Accessibility
Large fonts · screen-reader labels · high contrast · clear focus states · ≥44px touch targets ·
no colour-only information · Sinhala/English text support.

## 10. Language
Initial: **English + Sinhala**. Architecture supports future **Tamil**. All text lives in
localisation resources — never hard-coded in the UI.

## 11. Executive presentation mode
One screen answering five questions: how much is recorded · which LGA · where it went ·
how much processed/transferred/unresolved · where the gaps are. All figures carry a **DEMO DATA** marker
in demonstration mode. Includes a load-trace demo: enter `LD-DEMO-001` and walk
`Source → Vehicle → Collection → Facility → Received → Processing → Outcome`.
