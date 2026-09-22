# 00 — Problem Statement

> **Evidence classification:** This document describes the *information-management problem* WasteFlow is designed to address. It is **PROPOSED** framing built on **VERIFIED** public research. It must not be read as a description of Monroviawatta's current software, registers or workflow.

## 1. Context

Solid-waste management in Galle District involves multiple Local Government Authorities (LGAs), collection crews, vehicles and at least one treatment/disposal facility — the Monroviawatta Solid Waste Management Centre at Rajgama. Waste physically moves through several handoffs:

```
Household / market / institution
        │  collection
        ▼
   Collection crew + vehicle
        │  transport
        ▼
   Facility gate / receiving
        │  receiving confirmation
        ▼
   Processing (segregation, composting, landfill, transfer)
        │  allocation
        ▼
   Final outcome (compost, landfill, transfer, other)
```

## 2. The core problem

> Waste-management information may be generated at multiple stages — collection, transport, facility receiving, processing and transfer — but management needs a consistent way to connect those records, reconcile quantities and produce reliable operational reports.

Where records originate at different stages and in different places, they can describe the same physical load in incompatible ways. A collection team may record one quantity, a receiving point another. Without a shared identifier linking those records, the difference is invisible — and so is the answer to basic management questions.

## 3. The questions the system must answer

### Where did this waste come from?
LGA · collection area · route · vehicle · trip · collection time.

### How much waste was collected?
Quantity · **measurement method** · waste category · collection event.

### Where did it go?
Monroviawatta · processing area · composting · landfill · transfer destination · other authorized destination.

### What happened to it?
Received · processed · composted · landfilled · transferred · exception.

### Can management prove the chain?
Every load must have a unique identity:

```
Trip → Load → Receipt → Processing → Transfer / Final Outcome
```

## 4. Why the problem is real (evidence position)

Public research establishes the *setting* and the *recording need*, but **not** the current digital maturity or exact workflow. See [`01-evidence-and-assumptions.md`](01-evidence-and-assumptions.md).

**VERIFIED elements supporting the problem framing:**
- Monroviawatta is an operating waste-management centre.
- Five Local Government Authorities are publicly reported as participating.
- The documented operating model includes segregation, composting and landfill.
- A 2026 Southern Province announcement reported quantities of sorted and "unidentified" waste and a Puttalam transfer experiment.
- The published facility capacity is 40 MT/day.
- HELP-O documentation identified historical waste-recording needs.
- HELP-O's more recent Galle SWM action planning calls for systematic recording of waste-management data and monitoring/evaluation.
- Public documentation does **not** establish an end-to-end digital chain linking collection, vehicle, load, receiving, processing and final destination.

**UNVERIFIED (must not be asserted):**
- Whether a weighbridge currently exists; how quantities are currently measured.
- Whether registers are paper, spreadsheet or digital.
- Whether vehicles have GPS; whether crews have smartphones.
- Whether five LGAs exactly matches current participation.

## 5. Consequences of the problem

| Observable need | Consequence if unaddressed | WasteFlow response (PROPOSED) |
|---|---|---|
| Records generated at multiple stages | Quantities cannot be reconciled | Unique Load ID spanning the chain |
| Ambiguous waste streams ("unidentified") | Category totals mislead | Explicit `Unknown / Unclassified` category |
| No consistent measurement method | Weights are not comparable | `measurement_method` on every quantity |
| Handoffs without confirmation | Chain-of-custody gaps | Receiving + transfer confirmation records |
| Corrections made silently | Audit risk | Correction workflow + immutable audit log |
| Manual reporting | Slow, error-prone, unverifiable | Reports traceable to operational records |
| Field connectivity varies | Records lost or double-entered | Offline-first mobile + idempotent sync |

## 6. Scope of the problem being solved

The MVP solves **operational information management**: capturing, connecting, reconciling and reporting waste movements. It does **not** solve citizen complaint handling (e-Sabha), general local-government administration (e-Pura Neguma), physical logistics optimization, or route planning.

## 7. Success criteria for the problem

The problem is adequately addressed when:
1. A supervisor can enter any load ID and see its full chain with responsible users and timestamps.
2. Declared vs received vs allocated quantities are always visible, including differences.
3. Discrepancies never silently overwrite original values.
4. Any management report figure can be traced back to the records that produced it.
5. Data-quality gaps are surfaced automatically, not hidden.

These map to the acceptance criteria in [`04-requirements.md`](04-requirements.md) and [`15-testing.md`](15-testing.md).
