# 11 — API Reference

> **Classifier:** PROPOSED. Machine-readable spec: `../api/openapi.yaml`.
> Base URL (example): `https://api.wasteflow.example/api`. HTTPS only.

## Conventions

- **Auth:** `Authorization: Bearer <access token>`; refresh via `POST /api/auth/refresh`.
- **Idempotency:** all mutations accept `clientGeneratedId`. Repeating the same id returns the original
  result rather than creating a duplicate.
- **Pagination:** `?page=1&pageSize=50`; responses include `meta { page, pageSize, total }`.
- **Filtering:** `?from=&to=&lgaId=&facilityId=&categoryId=&status=&method=` on list endpoints.
- **Time:** ISO-8601 UTC.

### Success envelope
```json
{ "success": true, "data": { "id": "LD-20260920-00001" }, "message": "Load successfully received" }
```

### Error envelope
```json
{ "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "Received quantity is required", "field": "received_quantity_kg" } }
```

Common codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `IDEMPOTENT_REPLAY`, `RATE_LIMITED`, `INTERNAL_ERROR`.

---

## Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/login` | body `{username,password}` → `{accessToken,refreshToken,user}` |
| POST | `/api/auth/refresh` | body `{refreshToken}` → new tokens |
| POST | `/api/auth/logout` | invalidates refresh token |
| GET | `/api/auth/me` | current user profile + permissions |

## Users
`GET /api/users` · `POST /api/users` · `GET /api/users/:id` · `PATCH /api/users/:id`
(Admin only; deactivation is `active:false`.)

## LGAs / Facilities / Vehicles / Routes / Categories
`GET|POST /api/lgas`, `PATCH /api/lgas/:id`
`GET /api/facilities`, `PATCH /api/facilities/:id`
`GET|POST /api/vehicles`, `PATCH /api/vehicles/:id`
`GET|POST /api/routes`, `PATCH /api/routes/:id`
`GET|POST /api/waste-categories`, `PATCH /api/waste-categories/:id`
`GET /api/measurement-methods`

## Trips
| Method | Path | Notes |
|---|---|---|
| GET | `/api/trips` | filters: date, lgaId, vehicleId, status |
| POST | `/api/trips` | body `{clientGeneratedId,vehicleId,routeId,lgaId,sourceArea}`; rejects a second active trip per vehicle |
| GET | `/api/trips/:id` | trip + collections + load |
| PATCH | `/api/trips/:id` | limited fields |
| POST | `/api/trips/:id/start` | sets start time, status IN_PROGRESS |
| POST | `/api/trips/:id/complete` | guards ≥1 collection; generates load + QR payload |

## Collections
| Method | Path | Notes |
|---|---|---|
| GET | `/api/trips/:id/collections` | list |
| POST | `/api/trips/:id/collections` | body `{clientGeneratedId,locationDescription,wasteCategory,measurementMethod,quantityKg,latitude?,longitude?,notes?}`; quantity ≥ 0; category may be UNKNOWN |

## Loads
| Method | Path | Notes |
|---|---|---|
| GET | `/api/loads` | list + filters |
| GET | `/api/loads/:id` | load detail |
| GET | `/api/loads/search?q=` | Load ID / vehicle / date / LGA / facility / shipment |
| GET | `/api/loads/:id/trace` | full timeline (actor + timestamp per step) |

## Receiving
| Method | Path | Notes |
|---|---|---|
| POST | `/api/loads/:id/receive` | body `{receivedQuantityKg,measurementMethod,condition?,discrepancyReason?,notes?}`; reason required if different; load cannot be received twice |
| GET | `/api/receipts` | filters: facility, date |

## Processing
| Method | Path | Notes |
|---|---|---|
| POST | `/api/loads/:id/process` | body `{compostKg,landfillKg,transferKg,otherKg,incomplete?,notes?}`; sum = received unless `incomplete` |
| GET | `/api/processing` | list |
| POST | `/api/compost-batches` | create batch |
| GET | `/api/compost-batches` | list |

## Transfers
| Method | Path | Notes |
|---|---|---|
| POST | `/api/transfers` | body `{sourceFacilityId,destinationName,containerNumber,quantityKg,dispatchTime,loadIds[]}` |
| GET | `/api/transfers` | list + filters |
| GET | `/api/transfers/:id` | shipment + linked loads |
| POST | `/api/transfers/:id/receive` | destination confirmation; computes difference; without it status = AWAITING_CONFIRMATION |

## Exceptions
`GET /api/exceptions` · `GET /api/exceptions/:id` · `PATCH /api/exceptions/:id` (assign/resolve)
`GET /api/exceptions/summary` → counts by severity/status

## Reconciliation
`GET /api/reconciliation?from=&to=&lgaId=&facilityId=` → declared, received, allocated, unaccounted, per LGA/facility.

## Dashboard
`GET /api/dashboard/summary` · `/by-lga` · `/by-category` · `/trends` · `/exceptions`
`GET /api/dashboard/capacity` → reference capacity, recorded today, reference utilisation (clearly labelled).

## Reports
`GET /api/reports/daily` · `/monthly` · `/vehicles` · `/lgas` · `/processing` · `/transfers` ·
`/exceptions` · `/data-quality` · `/traceability`
All support `?format=csv|xlsx|pdf` for export.

## Audit
`GET /api/audit-logs?entityType=&entityId=&userId=&from=&to=` — read-only; no delete endpoint exists.

## Health
`GET /api/health` (liveness) · `GET /api/health/ready` (DB + storage readiness).

---

## Security expectations on every protected endpoint

JWT/session validation · role permission check · record scope check (LGA/facility derived from the
**authenticated user**, never from the request body) · DTO validation · rate limiting · audit logging ·
parameterised queries. See `13-security.md`.
