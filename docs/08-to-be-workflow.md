# 08 — TO-BE Workflow (States & Transitions)

> **Classifier:** PROPOSED. State machines are enforced server-side; the mobile app submits intent,
> not authority.

## 1. Trip state machine

```
        create
          │
          ▼
       DRAFT ──────────► CANCELLED
          │ start
          ▼
     IN_PROGRESS ──────► CANCELLED
          │ complete (+ ≥1 collection)
          ▼
      SUBMITTED ──► (Load generated, QR issued)
```

| From | Event | To | Guard |
|---|---|---|---|
| — | create | DRAFT / IN_PROGRESS | vehicle active; no active trip for vehicle |
| IN_PROGRESS | complete | SUBMITTED | start time set; ≥ 1 collection |
| any | cancel | CANCELLED | not already submitted |

Rules: completed/submitted trips are not editable by normal users; corrections follow the correction workflow.

## 2. Load state machine

```
     SUBMITTED ──► ARRIVED ──► RECEIVED ──► PROCESSING ──► COMPLETED
         │            │           │             │
         │            │           ▼             ▼
         │            │       EXCEPTION ◄───────┘
         └────────────┴───────────┴──► CANCELLED
```

| From | Event | To | Guard |
|---|---|---|---|
| SUBMITTED | arrive | ARRIVED | — |
| SUBMITTED/ARRIVED | receive | RECEIVED | not already received |
| SUBMITTED/ARRIVED | receive with difference | EXCEPTION | mandatory reason |
| RECEIVED | process (complete allocation) | COMPLETED | sum = received or incomplete flag set |
| RECEIVED | process (partial/incomplete) | PROCESSING | incomplete = true |
| PROCESSING | finalise | COMPLETED | sum = received |
| any | cancel | CANCELLED | authorized |

**Discrepancy rule:** declared values are immutable; a difference creates an exception and stores a reason.

## 3. Shipment state machine

```
     DRAFT ──► DISPATCHED ──► IN_TRANSIT ──► RECEIVED
       │            │              │            │
       └────────────┴──────────────┴────────────┴──► EXCEPTION / CANCELLED
                              │
                    no destination confirmation
                              ▼
                    AWAITING CONFIRMATION
```

Rule: without a destination receipt the shipment is `AWAITING CONFIRMATION`. Final delivery is never assumed.

## 4. Sync state machine (client records)

```
     PENDING ──► SYNCING ──► SYNCED
        ▲           │
        │           ├──► FAILED ──► (retry) ──► SYNCING
        │           │
        └───────────┴──► CONFLICT ──► (supervisor) ──► SYNCED / FAILED
```

Rules: idempotency key (`clientGeneratedId`) on every mutation; local records persist until confirmed.

## 5. Exception lifecycle

```
   OPEN ──► IN_REVIEW ──► RESOLVED
     │           │
     └───────────┴──► (escalate) CRITICAL
```

Severity: `CRITICAL`, `WARNING`. Auto-writeback to entity where correction is approved (audited).

## 6. Correction workflow

```
 Original record
       │ raise correction (+ reason)
       ▼
  CORRECTION_DRAFT ──► SUBMITTED ──► SUPERVISOR_REVIEW ──► APPROVED
                                                │
                                                └──► REJECTED (record unchanged)
       │
       ▼
  New value written + audit entry (old → new)
```

Applies only to sensitive corrections — normal operational records are not forced through approval.

## 7. Status vocabulary (shared)

| Status | Colour | Applies to |
|---|---|---|
| DRAFT | Gray | trips, shipments |
| SUBMITTED | Blue | loads |
| IN_PROGRESS / IN_TRANSIT | Purple | trips / shipments |
| RECEIVED | Teal | loads, shipments |
| PROCESSING | Amber | loads |
| COMPLETED | Green | loads, trips |
| EXCEPTION | Red | loads, shipments, exceptions |
| CANCELLED | Dark Gray | trips, loads, shipments |

Colour is never the only signal; the status label is always present.
