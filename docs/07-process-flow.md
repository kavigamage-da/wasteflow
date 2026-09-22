# 07 — Process Flow

> **Critical classifier:** The **AS-IS** section describes **UNVERIFIED** practice. It must be read as
> "what is not established by public research", not as a factual description. The **TO-BE** section is
> **PROPOSED**.

## 1. AS-IS — what public research does and does not establish

**VERIFIED at the setting level**
- Monroviawatta operates as a waste-management centre.
- Five LGAs are publicly reported as participating.
- The documented model includes segregation, composting and landfill.
- A 2026 Southern Province announcement reported sorted and "unidentified" waste quantities and a Puttalam transfer experiment.
- Published capacity: 40 MT/day.
- HELP-O documentation identified recording needs and later called for systematic recording and M&E.

**UNVERIFIED (do not assert)**
- Whether any software exists at the facility.
- Whether registers exist (paper or digital).
- Whether a weighbridge exists.
- Whether staff use paper or Excel.
- Whether vehicles have GPS; whether crews have smartphones.
- The exact current workflow and the exact participant set.

**Therefore** the diagram below is a *conceptual* view of the physical flow, not a claim about current
information systems.

```
Collection points (households, markets, institutions)
        │
        ▼
LGA collection crew + vehicle ──► (measurement method unknown/unverified)
        │
        ▼
Transport to Monroviawatta
        │
        ▼
Facility gate / receiving ──► (receiving records unknown/unverified)
        │
        ▼
Segregation ──► Composting ──┐
        │                     │
        └──► Landfill ─────────┼──► Final outcome
                              │
        └──► Transfer (e.g. Puttalam experiment) ──┘
```

**The documented gap:** public documentation does **not** establish an end-to-end digital chain linking
collection, vehicle, load, receiving, processing and final destination.

## 2. TO-BE process flow (proposed)

```
   COLLECT                 RECORD                  IDENTIFY
   crew gathers waste ──►  trip + collections ──►  complete trip → Load ID + QR
       │                        │                        │
       │  offline? save to Room │                        │
       ▼                        ▼                        ▼
   TRANSPORT  ───────────►  RECEIVE  ───────────►  RECONCILE
   vehicle moves load      scan/search Load ID      declared vs received
                           record qty + method      discrepancy → reason
       │                        │                        │
       ▼                        ▼                        ▼
   PROCESS  ────────────►  TRANSFER / FINAL OUTCOME  ──►  REPORT
   allocate compost/       shipment + destination        daily/monthly/
   landfill/transfer       confirmation                    LGA/vehicle…
       │                        │                        │
       └────────────────────────┴────────────────────────┴──►  AUDIT
```

## 3. Handoff control points

Every handoff is a place where a quantity, a category, a responsible party and a timestamp should exist.

| # | Handoff | From → To | Recorded evidence | Discrepancy rule |
|---|---|---|---|---|
| H1 | Collection → Trip | Crew → Supervisor | Collection event with qty + method | qty ≥ 0; category may be Unknown |
| H2 | Trip → Load | Field → System | Load ID generated, QR | unique ID |
| H3 | Load → Receiving | Driver → Facility | Receipt with received qty + method | declared ≠ received → mandatory reason |
| H4 | Receiving → Processing | Facility in → Facility out | Processing allocation | sum = received unless incomplete |
| H5 | Processing → Transfer | Facility → Destination | Shipment + destination receipt | awaiting confirmation if no receipt |
| H6 | All → Reporting | System → Management | Reports traceable to records | variance always shown |

## 4. Roles across the flow

| Stage | Primary role |
|---|---|
| Collect / record | Driver / Collection Crew |
| Assign / monitor | Collection Supervisor, LGA Officer |
| Identify (Load/QR) | Driver (generates), Receiving (scans) |
| Receive | Facility Receiving Officer |
| Reconcile | Facility Manager / Supervisor |
| Process | Facility Processing Operator |
| Transfer | Processing Operator / Facility Manager |
| Report | Provincial / LGA / Facility Manager |
| Oversee | System Administrator |

## 5. Exception paths inside the flow

```
declared ≠ received ─────────────► EXCEPTION (reason required)
received but not processed ──────► EXCEPTION (processing gap)
processed but not finalised ─────► EXCEPTION
dispatched, no destination receipt ► AWAITING CONFIRMATION
offline sync failure ────────────► SYNC exception + retry
duplicate vehicle/trip/load ─────► DUPLICATE exception
```

## 6. Non-goals in this flow

- No route optimisation, no live GPS dependence, no predictive analytics in the MVP.
- No citizen complaint intake (that is e-Sabha; integration is future scope).
- No claims of cost, fuel or emissions savings without a verified baseline.
