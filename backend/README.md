# WasteFlow — Backend API

Node.js · TypeScript · Express · PostgreSQL · JWT · RBAC

> **Evidence note.** WasteFlow is a **proposed TO-BE** operational system. It does not claim that
> Monroviawatta currently has no software/registers/weighbridge, that staff use paper or Excel, that
> vehicles have GPS, or that the current workflow matches this design. Seeded figures are **SYNTHETIC**.

## Quick start

### 1. Database

```bash
# Option A — Docker
docker compose up -d db

# Option B — local PostgreSQL
createdb wasteflow
```

### 2. Configure

```bash
cp .env.example .env      # then edit DATABASE_URL and JWT secrets
```

### 3. Install, migrate, seed, run

```bash
npm install
npm run migrate           # applies ../database/schema.sql
npm run seed              # loads synthetic demo data
npm run dev               # http://localhost:3000
```

| Script | Purpose |
|---|---|
| `npm run dev` | Watch-mode dev server (tsx) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled server |
| `npm run typecheck` | TypeScript check only |
| `npm run migrate` / `npm run seed` | Apply schema / load demo data |

## Verified

This backend was **run against PostgreSQL 15** and exercised end-to-end. See
[`../docs/15-testing.md`](../docs/15-testing.md) for the full scenario list. Confirmed behaviours:

- Login (correct → 200, wrong → **401**), `/auth/me`.
- **RBAC**: a driver calling receiving returns **403**.
- **Duplicate active trip per vehicle** → **409**.
- **Discrepancy without a reason** → **422**; with a reason → load flagged **EXCEPTION** and the
  declared value is **unchanged**.
- **Double receive** → **409**.
- **Processing that does not reconcile** → **422**; reconciling allocation → **COMPLETED**;
  `incomplete: true` accepted and left as `PROCESSING`.
- **Idempotency**: the same `clientGeneratedId` returns the same trip, no duplicate.
- **Traceability** returns the full timeline + reconciliation.
- **Reports** (JSON + CSV), **reconciliation**, **dashboard summary**, **capacity** (labelled reference value).
- **Audit log** populated; **no delete route exists** for audit records (DELETE → 404).

## API surface

See [`../docs/11-api.md`](../docs/11-api.md) and [`../api/openapi.yaml`](../api/openapi.yaml).

```
POST /api/auth/login | refresh | logout        GET /api/auth/me
GET  /api/lgas | facilities | vehicles | routes | waste-categories | measurement-methods
GET  /api/trips           POST /api/trips        GET /api/trips/:id
POST /api/trips/:id/collections                  POST /api/trips/:id/complete
GET  /api/loads | /loads/search | /loads/:id | /loads/:id/trace
POST /api/loads/:id/receive                      POST /api/loads/:id/process
GET  /api/receipts | /processing | /compost-batches
GET  /api/transfers | /transfers/:id             POST /api/transfers | /transfers/:id/receive
GET  /api/exceptions | /exceptions/summary       PATCH /api/exceptions/:id
GET  /api/dashboard/summary | by-lga | by-category | trends | outcome | exceptions | capacity
GET  /api/reconciliation                         GET /api/reports/:type[?format=csv]
GET  /api/audit-logs                             GET /api/health | /health/ready
```

## Response envelopes

```json
{ "success": true, "data": { "id": "LD-20260920-00001" }, "message": "Load successfully received" }
```
```json
{ "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "Received quantity is required", "field": "received_quantity_kg" } }
```

## Security

- Passwords hashed with bcrypt (`crypt(..., gen_salt('bf'))` in seed; bcryptjs for verification).
- Short-lived access tokens + refresh tokens; tokens are never logged.
- **Scope is derived server-side** from the authenticated user — client-supplied IDs are never trusted.
- Parameterised queries only; DTO validation with zod; consistent error envelope.
- Audit rows are append-only; the SQL schema comments how to revoke UPDATE/DELETE from the app role.

## Layout

```
src/config.ts          Environment configuration
src/db/                Pool, migrate, seed
src/http/              Envelope + async handler
src/middleware/        Auth/RBAC, error handler
src/services/          auth, trip, load, receiving, processing, transfer, dashboard, exception, report, audit
src/routes/index.ts    All API routes
src/app.ts, server.ts  Express app + entrypoint
```
