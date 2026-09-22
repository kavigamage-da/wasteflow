# 09 — Architecture

> **Classifier:** PROPOSED.

## 1. Logical architecture

```
┌───────────────────────────┐
│  ANDROID MOBILE APP        │  Kotlin · Jetpack Compose · MVVM · Room · WorkManager
│  (field & facility users)  │  offline-first, idempotent sync
└─────────────┬──────────────┘
              │ REST over HTTPS (JWT bearer, refresh tokens)
              ▼
┌───────────────────────────┐
│  BACKEND API SERVER        │  Node.js · TypeScript · NestJS/Express
│  auth · RBAC · validation  │  service/repository/controller separation
│  reconciliation · audit    │  exception & data-quality engines
└──────┬──────────────┬──────┘
       │              │
       ▼              ▼
┌────────────┐  ┌───────────────┐
│ PostgreSQL │  │ FILE STORAGE  │  attachment photos (optional, secure)
└────────────┘  └───────────────┘
       ▲
       │ same API
       ▼
┌───────────────────────────┐
│  WEB MANAGEMENT DASHBOARD  │  React · TypeScript · Recharts/ECharts
│  KPIs · tables · reports   │  role-based views + executive mode
└───────────────────────────┘
```

## 2. Recommended technology

| Layer | Stack |
|---|---|
| Android | Kotlin, Jetpack Compose, MVVM, Room, Retrofit, Coroutines, WorkManager |
| Backend | Node.js, TypeScript, Express/NestJS, JWT, bcrypt/Argon2, REST |
| Database | PostgreSQL |
| Web | React, TypeScript, Tailwind or component system, Recharts/ECharts |
| Deployment | Docker, managed PostgreSQL, HTTPS, CI/CD, staging + production |

## 3. Repository / service / controller separation (backend)

- **Controllers** — HTTP concerns only: parse, validate DTO, call service, shape the response envelope.
- **Services** — business rules (guards such as one-active-trip-per-vehicle, conservation of mass, discrepancy reason).
- **Repositories** — data access; parameterised queries; transactions.
- **Engines** — cross-cutting: reconciliation, exception detection, data-quality/completeness, audit.
- **DTO validation** — every input validated before it reaches a service; no trusting of client IDs.

## 4. Mobile architecture

```
ui/screens      Compose screens + ViewModels (MVVM state holders)
ui/navigation   NavHost + role-aware bottom navigation
data/local      Room entities/DAOs (offline store, source of truth on device)
data/remote     Retrofit API + DTOs + auth interceptor
data/repository Repositories + SyncManager (offline-first write path)
data/session    DataStore session/token persistence
sync/           WorkManager periodic sync worker (network-constrained, backoff)
di/             Dependency container
util/           QR, ID generation, connectivity monitor
```

**Write path:** UI → ViewModel → Repository → Room (immediate) → attempt API (best-effort) → mark sync state.
The UI always reads from Room, so it works identically online and offline.

## 5. Request lifecycle (example: receive a load)

```
Officer taps CONFIRM RECEIVING
   ▼
ViewModel validates locally (qty ≥ 0; reason present if discrepancy)
   ▼
Repository.receive() → Room upsert (status RECEIVED/EXCEPTION)
   ▼
POST /api/loads/{id}/receive        (best-effort when online)
   ▼
Server: authN → authZ (facility scope) → validate → service rules
   ▼
DB transaction: insert receipt; update load; create exception if needed; write audit
   ▼
Response envelope { success, data, message } → client marks SYNCED
```

## 6. Failure & degradation strategy

| Failure | Behaviour |
|---|---|
| No connectivity | Local capture; queue drains on reconnect |
| API 4xx validation | Record marked FAILED with the server message; user can correct |
| API 5xx/timeout | Retry with backoff (WorkManager) |
| Conflict (server newer) | Status CONFLICT; supervisor resolves |
| Attachment upload fails | Record stands; attachment retried separately |

## 7. Environment configuration

- Secrets via environment variables (never in source).
- `API_BASE_URL` externalised (Android BuildConfig / web env).
- Reference capacity, GPS toggle, languages, retention are administrative configuration, not constants.

## 8. Phasing

Architecture is delivered in the nine phases in `02-scope.md` §6, MVP restricted to
`Trip → Load → Receiving → Processing → Transfer/Outcome → Dashboard → Report → Audit`.

## 9. Explicitly deferred

Live GPS tracking, weighbridge integration, IoT, predictive analytics, route optimisation,
citizen integration and cross-organisation federation — all deferred until APIs and data ownership
are confirmed and the MVP is validated.
