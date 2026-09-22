# WasteFlow

**Galle District Solid Waste Operations & Monitoring System**

> A **proposed** digital information system designed to improve traceability, reconciliation, monitoring and reporting of solid-waste movements between Local Government Authorities (LGAs) and the Monroviawatta Solid Waste Management Centre (Rajgama).

---

## ⚠️ Government Deployment Disclaimer

**THIS IS A DEMONSTRATION/PORTFOLIO PROJECT. NOT PRODUCTION SOFTWARE.**

WasteFlow is a software engineering demonstration and portfolio project. It is **NOT** approved, certified, or ready for government deployment. Before any government or institutional deployment, the following must be completed:

- **Security Audit**: Comprehensive penetration testing by certified security professionals
- **Compliance Review**: Review against relevant government IT standards and regulations
- **Legal Review**: Compliance with data protection, privacy, and accessibility laws
- **Stakeholder Approval**: Formal approval from all relevant government authorities
- **Production Hardening**: Additional security measures, monitoring, and operational procedures
- **Disaster Recovery**: Complete backup, recovery, and business continuity planning
- **Performance Testing**: Load testing and scalability validation
- **User Acceptance Testing**: Real-world testing with actual operational staff

The demo data in this system is **synthetic** and must never be presented as real operational data. Demo credentials are for demonstration purposes only.

---

## What this package is

This is the **design & documentation package** for WasteFlow — a complete, implementation-ready specification consisting of:

| Area | Location |
|---|---|
| **Backend API** (Node.js · TypeScript · Express · PostgreSQL) | `backend/` |
| **Web dashboard** (React · TypeScript · Vite · Recharts) | `web-dashboard/` |
| **Android field app** (Kotlin · Compose · Room · offline-first) | `../wasteflow-android/` |
| Project documentation (18 documents) | `docs/` |
| PostgreSQL schema (DDL, constraints, indexes) | `database/schema.sql` |
| Demo/seed data (clearly labelled synthetic) | `database/seed.sql` |
| REST API specification (OpenAPI 3.1) | `api/openapi.yaml` |
| API endpoint reference (human-readable) | `docs/11-api.md` |
| ER diagram (text) | `docs/10-database.md` |

## Run the full system

```bash
# 1) Database
cd backend && docker compose up -d db           # or point DATABASE_URL at any PostgreSQL
cp .env.example .env                             # set DATABASE_URL + JWT secrets

# 2) Backend
npm install && npm run migrate && npm run seed
npm run dev                                      # http://localhost:3000

# 3) Web dashboard (separate terminal)
cd ../web-dashboard && npm install && npm run dev   # http://localhost:5173 (proxies /api)

# 4) Android app — open ../wasteflow-android in Android Studio and Run
```

Demo accounts (synthetic): `driver/driver123` · `supervisor/super123` · `receiving/receiving123` ·
`processing/processing123` · `officer/officer123` · `admin/admin123`.

## Build verification

| Component | Verification | Result |
|---|---|---|
| Backend | `tsc --noEmit` + run against PostgreSQL 15, 18 API scenarios | ✅ pass |
| Web dashboard | `npm run build` (tsc + vite build) | ✅ pass |
| Android app | `./gradlew :app:assembleDebug` (JDK 17, AGP 8.7.3) | ✅ `app-debug.apk` |

See [`../wasteflow-android/BUILD-VERIFIED.md`](../wasteflow-android/BUILD-VERIFIED.md).

## System verification status (2026-09-22)

**VERIFIED — DEMONSTRATION READY**

All high-priority verification and demonstration tasks completed. The system is ready for stakeholder presentation.

### Verification Completed (37/40 tasks)

- ✅ Authentication & JWT flow
- ✅ RBAC for all roles
- ✅ Complete operational workflow (Trip→Load→Receive→Process)
- ✅ Load traceability (LD-DEMO-001)
- ✅ Quantity reconciliation (2,550 kg allocated)
- ✅ Discrepancy management (50 kg difference)
- ✅ Data quality engine
- ✅ Audit logging
- ✅ Dashboard calculations (5 questions answered)
- ✅ Capacity monitoring (REFERENCE CAPACITY labeled)
- ✅ Reports generation (6 report types)
- ✅ Search/filter/sort functionality
- ✅ Android offline-first sync
- ✅ Frontend error handling (professional messages)
- ✅ Security hardening (bcrypt, parameterized queries, JWT)
- ✅ Database integrity (referential integrity verified)
- ✅ API routes tested (8+ endpoints)
- ✅ Health check endpoint
- ✅ Demo mode indicator (professional UI)
- ✅ Golden load demonstration (complete scenario)
- ✅ Role demonstration scripts (6 roles)
- ✅ All demo login accounts verified
- ✅ UI consistency verified
- ✅ Offline demonstration capability
- ✅ Audit demonstration
- ✅ Data quality demonstration
- ✅ VERIFIED/UNVERIFIED/PROPOSED boundaries maintained
- ✅ Stakeholder presentation document created
- ✅ System architecture documented
- ✅ Database documentation verified
- ✅ API documentation verified
- ✅ Startup guide verified
- ✅ Final smoke test passed
- ✅ Browser console check passed
- ✅ Backend log check passed
- ✅ Final security check passed
- ✅ Documentation package verified

### Pending (Low Priority)

- ⏸️ Create/repair test suite (manual verification performed)
- ⏸️ Performance inspection (not required for demonstration)
- ⏸️ Accessibility audit (basic semantic HTML used)

### Documentation

- [`EVIDENCE_AND_ASSUMPTIONS.md`](EVIDENCE_AND_ASSUMPTIONS.md) — Detailed verification evidence
- [`FINAL_IMPLEMENTATION_REPORT.md`](FINAL_IMPLEMENTATION_REPORT.md) — Complete implementation report
- [`STARTUP_GUIDE.md`](STARTUP_GUIDE.md) — Step-by-step startup instructions
- [`DEMO_SCENARIO.md`](DEMO_SCENARIO.md) — Complete demonstration scenario
- [`STAKEHOLDER_PRESENTATION.md`](STAKEHOLDER_PRESENTATION.md) — Professional stakeholder overview

It is intended to support: academic demonstration, software-engineering evaluation, operational pilot discussion, stakeholder review, future field validation, and potential institutional deployment **after proper approval and verification**.

---

## The single most important rule

WasteFlow is a **proposed TO-BE** operational information system. It **must never** present documented facts, unverified assumptions and proposed functionality as if they were the same thing.

See [`docs/01-evidence-and-assumptions.md`](docs/01-evidence-and-assumptions.md). Every document in this package classifies its content as:

- **VERIFIED** — supported by public research.
- **UNVERIFIED** — current operational practice that requires field/internal confirmation.
- **PROPOSED** — functionality designed by WasteFlow.

**WasteFlow does not claim** that Monroviawatta currently has no software, no registers, no weighbridge, that staff use paper or Excel, that vehicles have GPS, that every crew has a smartphone, or that the current workflow matches the design below. Those items are not publicly verified.

---

## Problem in one paragraph

Waste-management information may be generated at multiple stages — collection, transport, facility receiving, processing and transfer — but management needs a consistent way to connect those records, reconcile quantities and produce reliable operational reports. WasteFlow gives every load a unique identity and a connected chain:

```
Trip → Load → Receipt → Processing → Transfer / Final Outcome
```

---

## Target data flow (MVP)

```
COLLECT → RECORD → IDENTIFY → TRANSPORT → RECEIVE
   → RECONCILE → PROCESS → TRANSFER / FINAL OUTCOME
   → REPORT → AUDIT
```

Central value proposition:

- Every important waste movement has a digital record.
- Every quantity has a measurement method.
- Every important handoff has confirmation.
- Every discrepancy is visible.
- Every correction is auditable.
- Every management report is traceable back to operational records.

---

## System users (RBAC)

1. System Administrator
2. Provincial Officer
3. LGA / SWM Officer
4. Collection Supervisor
5. Driver / Collection Crew (mobile)
6. Facility Receiving Officer
7. Facility Processing Operator
8. Facility Manager

See [`docs/03-stakeholders.md`](docs/03-stakeholders.md) and [`docs/04-requirements.md`](docs/04-requirements.md).

---

## Proposed architecture

```
ANDROID MOBILE APP  (Kotlin, Jetpack Compose, Room, WorkManager)
       │  REST / HTTPS (JWT)
       ▼
BACKEND API SERVER  (Node.js, TypeScript, NestJS/Express)
       ├──────────────► PostgreSQL
       └──────────────► File Storage (attachments)
       ▼
WEB MANAGEMENT DASHBOARD  (React, TypeScript, Recharts/ECharts)
```

See [`docs/09-architecture.md`](docs/09-architecture.md).

---

## Documentation index

| # | Document | Purpose |
|---|---|---|
| 00 | [problem-statement.md](docs/00-problem-statement.md) | The information-management problem |
| 01 | [evidence-and-assumptions.md](docs/01-evidence-and-assumptions.md) | VERIFIED / UNVERIFIED / PROPOSED register |
| 02 | [scope.md](docs/02-scope.md) | In / out of scope, boundaries |
| 03 | [stakeholders.md](docs/03-stakeholders.md) | Users, roles, responsibilities |
| 04 | [requirements.md](docs/04-requirements.md) | Functional & non-functional requirements |
| 05 | [user-stories.md](docs/05-user-stories.md) | Role-based user stories + acceptance criteria |
| 06 | [use-cases.md](docs/06-use-cases.md) | Detailed use cases |
| 07 | [process-flow.md](docs/07-process-flow.md) | AS-IS uncertainty / TO-BE process flow |
| 08 | [to-be-workflow.md](docs/08-to-be-workflow.md) | TO-BE workflow states and transitions |
| 09 | [architecture.md](docs/09-architecture.md) | Technical architecture |
| 10 | [database.md](docs/10-database.md) | Data model + ER diagram |
| 11 | [api.md](docs/11-api.md) | REST endpoint reference |
| 12 | [ui-ux.md](docs/12-ui-ux.md) | Design system + screens |
| 13 | [security.md](docs/13-security.md) | Security, privacy, audit |
| 14 | [offline-sync.md](docs/14-offline-sync.md) | Offline-first + sync engine |
| 15 | [testing.md](docs/15-testing.md) | Test strategy + scenarios |
| 16 | [deployment.md](docs/16-deployment.md) | Environments, backup, ops |
| 17 | [user-manual.md](docs/17-user-manual.md) | Task-based operator guide |

---

## Demo scenario (synthetic)

All figures below are **DEMO DATA**, not real Monroviawatta operational data.

```
LGA:       Galle MC
Vehicle:   DEMO-001
Trip:      TR-DEMO-001
Load:      LD-DEMO-001
Declared:  2,600 kg
Received:  2,550 kg   (50 kg discrepancy → Exception)
Compost:   1,700 kg
Landfill:    650 kg
Transfer:    200 kg   (= 2,550 kg allocated)
```

See [`database/seed.sql`](database/seed.sql) and [`docs/15-testing.md`](docs/15-testing.md) Scenario 3.

---

## Boundaries

- **e-Sabha** — citizen complaints (separate system). Possible future integration only.
- **e-Pura Neguma** — general local-government administration.
- **WasteFlow** — operational waste movement, receiving, processing, reconciliation and monitoring.

WasteFlow does not claim to replace existing systems. See [`docs/02-scope.md`](docs/02-scope.md).

---

## Deployment path

```
Development → Staging → User Acceptance Testing → Production
```

See [`docs/16-deployment.md`](docs/16-deployment.md).

---

## Status

Design package — **not yet field-validated**. MVP scope is deliberately limited to reliable operational data capture (`Trip → Load → Receiving → Processing → Transfer → Dashboard → Report`). No AI, blockchain, advanced GPS, IoT or predictive analytics in the MVP. See [`docs/02-scope.md`](docs/02-scope.md) and [`docs/04-requirements.md`](docs/04-requirements.md) §Future.
