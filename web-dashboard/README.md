# WasteFlow — Web Management Dashboard

React · TypeScript · Vite · Recharts

> **Evidence note.** Proposed TO-BE system. Demonstration figures are **SYNTHETIC** and always carry a
> **DEMO DATA** marker; they are not Monroviawatta operational data.

## Quick start

```bash
npm install
npm run dev            # http://localhost:5173
```

The dev server proxies `/api` to `http://localhost:3000` (see `vite.config.ts`), so start the backend
first. To point at a different backend, create `.env`:

```
VITE_API_BASE_URL=https://your-backend/api
```

### Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server with `/api` proxy |
| `npm run build` | Type-check (`tsc --noEmit`) + production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | TypeScript check only |

## Works without a backend

If the API is unreachable, login falls back to built-in demo accounts and every page renders a
synthetic dataset with a **DEMO MODE / DEMO DATA** banner:

| Username | Password | Role |
|---|---|---|
| driver | driver123 | Driver / Collection Crew |
| supervisor | super123 | Collection Supervisor |
| receiving | receiving123 | Facility Receiving Officer |
| processing | processing123 | Facility Processing Officer |
| officer | officer123 | Provincial Officer |
| admin | admin123 | System Administrator |

## Pages

| Page | Purpose |
|---|---|
| Dashboard | KPI cards, waste by LGA / category, daily trend, processing outcome, vehicle activity, data quality, reference capacity |
| Executive View | Five executive questions, waste-flow chain, capacity reference, load-trace demo (`LD-DEMO-001`) |
| Trips | Trip list with status and recorded quantities |
| Loads | Filterable load table (status, LGA, date, free-text search), row → traceability |
| Receiving | Incoming queue + receive form with automatic discrepancy detection and mandatory reason |
| Processing | Received queue + allocation form enforcing conservation of mass |
| Transfers | Shipment list, create shipment, destination confirmation |
| Exceptions | Severity/status counts, resolution workflow |
| Traceability | Timeline with responsible parties + reconciliation block |
| Reports | 9 report types with filters, on-screen table and CSV export |
| Audit Logs | Append-only audit trail (read-only) |

Role-based navigation: each role only sees the sections it is permitted to use.

## Verified

`npm run build` completes successfully (TypeScript + Vite). The backend it targets was run against
PostgreSQL and exercised end-to-end — see [`../backend/README.md`](../backend/README.md).

## Design system

Deep green `#1B5E20` primary, teal `#00897B` secondary, `#F5F7F6` background, white cards, amber/red/green
status colours, 8px spacing, 14px radius. Status is always shown as text plus colour.
