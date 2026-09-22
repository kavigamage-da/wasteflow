# 01 — Evidence & Assumption Register (MANDATORY)

Every substantive claim in this design package is classified into exactly one of three states:

- **VERIFIED** — supported by public research / published documentation.
- **UNVERIFIED** — current operational practice that requires field or internal confirmation before it can be treated as fact.
- **PROPOSED** — functionality or workflow designed by WasteFlow.

> **Rule:** Documented facts, unverified assumptions and proposed functionality must **never** be confused.

---

## A. VERIFIED — supported by public research

| # | Statement | Relevance |
|---|---|---|
| V1 | Monroviawatta is an operating waste-management centre at Rajgama. | Establishes the facility node in the chain. |
| V2 | Five Local Government Authorities are publicly reported as participating. | Establishes multi-LGA source structure. |
| V3 | The documented operating model includes segregation, composting and landfill. | Establishes processing outcomes to model. |
| V4 | A 2026 Southern Province announcement reported quantities of sorted and "unidentified" waste, and a Puttalam transfer experiment. | Justifies both an `Unknown/Unclassified` category and a transfer-shipment module. |
| V5 | The published facility capacity is 40 MT/day. | Basis for a **configurable reference capacity**, not a live operational limit. |
| V6 | HELP-O documentation identified historical waste-recording needs. | Establishes a real recording need. |
| V7 | HELP-O's more recent Galle SWM action planning calls for systematic recording of waste-management data and monitoring/evaluation. | Directly motivates this system's reporting & M&E focus. |
| V8 | Public documentation does not establish an end-to-end digital chain connecting collection, vehicle, load, receiving, processing and final destination. | Justifies the *proposed* nature of the integrated chain. |

---

## B. UNVERIFIED — require field/internal confirmation

These must **not** be asserted as current facts anywhere in the product, documentation, demo, or stakeholder presentation.

| # | Unverified item | Why it matters | How to confirm |
|---|---|---|---|
| U1 | Existence/absence of current software at Monroviawatta. | Avoids false "greenfield" claims. | Site IT audit / interviews. |
| U2 | Existence/absence of registers (paper or digital). | Determines migration and training needs. | Site records review. |
| U3 | Existence/absence of a weighbridge. | Determines feasible measurement methods. | Site inspection. |
| U4 | Whether staff currently use paper records. | Affects adoption approach. | Interviews / observation. |
| U5 | Whether staff currently use Excel/spreadsheets. | Affects data migration. | Interviews. |
| U6 | Whether vehicles currently have GPS. | Scope of Phase-2 map/GPS. | Fleet inspection. |
| U7 | Whether every vehicle/crew has a smartphone. | Android rollout feasibility. | Fleet/crew survey. |
| U8 | Current measurement methods used for quantities. | Comparability of historical data. | Observation. |
| U9 | Exact current participation set of LGAs. | Master data accuracy. | LGA correspondence. |
| U10 | Whether the current operational workflow matches the designed TO-BE workflow. | Prevents presenting design as reality. | Process observation. |
| U11 | Current reporting cadence and format. | Report design fit. | Document review. |
| U12 | Actual current daily tonnage vs the published 40 MT/day. | Correct capacity framing. | Operational records. |

---

## C. PROPOSED — designed by WasteFlow

### C1. Capability register

| Capability | Proposed? | Notes |
|---|---|---|
| Weighbridge entry support | PROPOSED | Existence of a weighbridge is UNVERIFIED. |
| GPS/location capture | PROPOSED, optional, configurable | Must not be mandatory; system works without GPS. |
| QR-coded Load ID | PROPOSED | Contains the non-sensitive Load ID only. |
| Offline-first mobile capture | PROPOSED | Room + WorkManager + idempotent sync. |
| Reconciliation engine | PROPOSED | Declared vs received vs allocated variance. |
| Exception engine | PROPOSED | Automated data-quality and quantity exceptions. |
| Immutable audit log | PROPOSED | Users cannot delete audit history. |
| Executive presentation mode | PROPOSED | Demo data clearly marked. |
| Reference capacity monitor | PROPOSED | Additive, needs approval before real use. |
| Configurable waste categories | PROPOSED | Includes `Unknown/Unclassified`. |

### C2. Proposed new identifiers

| Entity | Format | Example |
|---|---|---|
| Trip | `TR-YYYYMMDD-NNN` | `TR-20260920-001` |
| Load | `LD-YYYYMMDD-NNNNN` | `LD-20260920-00001` |
| Compost batch | `CB-YYYYMMDD-NNN` | `CB-20260920-001` |
| Transfer shipment | `TRF-YYYYMMDD-NNN` | `TRF-20260920-001` |
| Collection event | `CL-...` | `CL-003` |
| Vehicle | `VH-NNN` | `VH-001` |

These identifier schemes are **proposed**, not observed current practice.

### C3. Proposed workflow

The `Trip → Load → Receipt → Processing → Transfer/Outcome` chain, the status sets, the discrepancy rules and the correction workflow are all **PROPOSED**. See [`08-to-be-workflow.md`](08-to-be-workflow.md).

---

## D. Explicit non-claims

WasteFlow **does not claim**, and no document or screen in this package may imply, that:

- Monroviawatta currently has no software.
- Monroviawatta currently has no registers.
- Monroviawatta currently has no weighbridge.
- Staff currently use paper records.
- Staff currently use Excel.
- Vehicles currently have GPS.
- Every vehicle currently has a smartphone.
- The existing operational workflow is exactly the workflow designed here.

---

## E. Language rules for UI, docs and presentations

| Instead of (assumes fact) | Use (evidence-safe) |
|---|---|
| "The weighbridge reading" | "Measurement method: Weighbridge *(if applicable)*" |
| "Staff currently record on paper" | "Where records are currently kept, WasteFlow can capture them digitally." |
| "Live vehicle location" | "Last reported status" |
| "Current process is…" | "Proposed workflow is… (subject to field validation)" |
| "Capacity is 40 MT/day" | "Reference capacity: 40 MT/day — configurable administrative value." |
| "94.2% data quality" | "Data completeness (system-generated metric): 94.2%" |

---

## F. Assumption → risk → mitigation

| Assumption (if wrong) | Risk | Mitigation |
|---|---|---|
| A facility user can scan a QR | Receiving bottleneck | Manual Load ID search is always available |
| Connectivity is intermittent, not absent | Sync loss | Offline-first with retry + conflict handling |
| Quantities are broadly comparable across methods | Misleading totals | Always store & display measurement method |
| Category may be unknown | Bad classification data | Explicit `Unknown/Unclassified`; never force a category |
| GPS may not exist | Broken map feature | GPS optional/configurable; map is Phase 2 |
| Five LGAs exactly | Master-data mismatch | LGAs fully configurable, not hard-coded |

---

## G. Review gate

Before any stakeholder presentation using this package:
1. Confirm every displayed figure is either VERIFIED-with-citation or marked **DEMO DATA**.
2. Confirm no UNVERIFIED item is stated as fact.
3. Record any newly confirmed U-item, and move it to section A with its source.
