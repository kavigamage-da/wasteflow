# 17 — User Manual

> **Classifier:** PROPOSED guide for the WasteFlow prototype. Screenshots/labels reflect the delivered
> Android app. Demo figures are synthetic.

## 0. Evidence notice

WasteFlow is a **proposed** system designed to improve traceability and reconciliation of waste
movements. It does not claim to describe current Monroviawatta practice. Any figure shown in
demonstration mode is **DEMO DATA**.

---

## 1. Signing in

1. Open WasteFlow.
2. Enter your username and password (tap the eye icon to reveal the password).
3. Tap **SIGN IN**.

The connection indicator shows `● Online` or `● Offline — demo access only`. If a backend is not
reachable, the built-in demo accounts (see the README) allow full exploration.

---

## 2. Driver / collection crew

### Start a trip
1. From **Home**, tap **Start Trip** (or the + button on **Trips**).
2. Choose **Vehicle**, optional **Route**, **Source LGA**, and type a **Source Area**.
3. Tap **START TRIP**. The start time and driver are captured automatically.
   - A vehicle that already has an active trip cannot start another.

### Record collections
1. Open the trip and tap **ADD COLLECTION**.
2. Enter the **Collection Point**, choose a **Waste Category** (use **Unknown** when the category is
   genuinely unknown), choose a **Measurement Method**, and enter the **Quantity** in kg.
3. Tap **SAVE COLLECTION**. Repeat for each point. The running total updates.

### Complete the trip
1. Tap **COMPLETE TRIP & GENERATE LOAD**.
2. The app creates a **Load ID** (e.g. `LD-20260920-00001`) and a **QR code**.
   - The QR contains only the Load ID — no personal data.
3. Show the QR to the receiving officer, or tap **VIEW LOAD TRACEABILITY**.

> Working offline? Everything is saved locally and shows a **PENDING** badge. It synchronises
> automatically when you regain connectivity.

---

## 3. Facility receiving officer

1. Open **Receiving**.
2. Scan the QR or type the **Load ID**, vehicle or LGA in the search box.
3. Tap the load to open it.
4. Enter the **Received Quantity**, choose the **Measurement Method** and **Condition**.
5. Tap **CONFIRM RECEIVING**.

**If the quantities differ**, the app shows a bold **Quantity Difference** block and requires a
**reason**. Tap **CONFIRM WITH DISCREPANCY**. The declared value is **never** overwritten, and the load
is flagged as an exception.

A load that has already been received cannot be received again.

---

## 4. Facility processing operator

1. Open **Processing** (from Home or the receiving screen).
2. Tap a received load.
3. Enter quantities for **Compost**, **Landfill**, **Transfer** and **Other**.
4. Watch **Allocated / Remaining**.
5. Tap **SAVE PROCESSING**.

**Rule:** `Compost + Landfill + Transfer + Other` must equal the received quantity. If the record is
genuinely not complete, tick **Mark record incomplete** — the reconciliation engine will flag it rather
than pretending the numbers balance.

---

## 5. Traceability (all roles)

1. From a load, tap **VIEW LOAD TRACEABILITY**, or search a Load ID.
2. Read the timeline: Created → Trip → Collection Completed → Arrived → Received → Processed → Final Outcome.
3. The **Reconciliation** block shows declared, received, allocated and the difference.

---

## 6. Sync

1. Open **Sync**.
2. Tap **SYNC NOW**.
3. Review the per-record result list (✓ succeeded, ✗ failed). Tap again to retry failures.

A local record is never deleted before the server confirms it. A conflict shows both the server and
device values so a supervisor can decide.

---

## 7. Profile & sign out

Open **Profile** to see your name, role, LGA and facility, the system description and version, and to
**SIGN OUT**.

---

## 8. Language

The app ships with **English** and **Sinhala**, with structure for **Tamil**. Text is configured in
localisation resources, so switching or adding a language does not change functionality.

---

## 9. Reporting (web dashboard)

1. Open **Reports**.
2. Choose a report (daily, monthly, vehicle, LGA, receiving, processing, transfer, exception,
   data-quality, traceability).
3. Set filters: date range, LGA, facility, waste category.
4. Export as **CSV**, **Excel** or **PDF**. The PDF header shows the reporting period, generation time
   and the filters used.

---

## 10. Troubleshooting

| Symptom | Meaning | Action |
|---|---|---|
| `● Offline` badge | No connectivity | Keep working; records queue locally |
| Badge shows **PENDING** | Not yet synced | Open **Sync → SYNC NOW** |
| **Conflict** shown | Server has a newer version | Supervisor chooses Keep Server / Review |
| "Load already received" | Duplicate receive attempt | Open the load to see its receipt |
| "Allocation must equal received" | Processing rule | Balance the figures or mark incomplete |
| "Vehicle already has an active trip" | Guard | Complete or cancel the existing trip |
| "A reason is required" | Discrepancy rule | Enter the reason for the difference |

---

## 11. Terminology

- **Trip** — a vehicle's collection run.
- **Collection** — a single pickup point with quantity and method.
- **Load** — the unit of traceability created when a trip is submitted; carries the QR.
- **Receipt** — the facility's confirmation of a received load.
- **Processing** — allocation of received waste to compost/landfill/transfer/other.
- **Shipment** — a transfer of waste to a destination, needing destination confirmation.
- **Exception** — a recorded problem that must be visible and resolved.
- **Reconciliation** — comparing declared, received and allocated quantities.
