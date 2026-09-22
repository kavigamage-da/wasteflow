# 03 — Stakeholders & Roles

> **Evidence classification:** Role definitions are **PROPOSED**. Participation of five LGAs is **VERIFIED** (V2) at a public-report level; the exact current set is **UNVERIFIED** (U9).

## 1. Stakeholder map

| Stakeholder | Interest | Influence | WasteFlow relationship |
|---|---|---|---|
| Provincial administration | District-level oversight, monitoring & evaluation | High | Provincial Officer dashboard + reports |
| Local Government Authorities (LGAs) | Collection performance, their own records | High | LGA/SWM Officer, Collection Supervisor |
| Monroviawatta facility management | Receiving, processing, throughput | High | Facility Manager, Receiving Officer, Processing Operator |
| Collection crews & drivers | Simple field capture | Medium | Mobile app users |
| Citizens | Service quality (indirect) | Low (MVP) | Out of scope; future e-Sabha link |
| System/IT administrators | Platform health, access control | Medium | System Administrator |
| HELP-O / development partners | Systematic data, M&E | Medium | Reporting & evidence discipline |
| Executive / Chief Minister's office | Fast, trustworthy summary | High | Executive presentation mode |

## 2. Role definitions & permissions

Permission model: `resource:action` (e.g. `load:read`, `receipt:create`). Roles are collections of permissions. Enforcement is **server-side**; the mobile app never sends a role that the server trusts.

### ROLE 1 — System Administrator
**Responsibility:** platform configuration and governance.
- Users, roles, permissions
- LGAs, facilities, vehicles, routes
- Waste categories, measurement methods
- System configuration (reference capacity, GPS toggle, languages)
- Audit logs (read; cannot delete)
- All read access

### ROLE 2 — Provincial Officer
- View province-level dashboard
- View participating LGAs
- View facility activity
- Compare reporting periods
- View operational statistics
- Generate and export reports
- **Cannot** modify operational records unless explicitly granted.

### ROLE 3 — LGA / SWM Officer
- Manage collection activities
- Create routes; assign vehicles & crews
- Monitor trips
- View LGA statistics
- Investigate and assign exceptions
- Generate reports (LGA scope)

### ROLE 4 — Collection Supervisor
- Create route sheets
- Assign vehicles and crews
- Create work assignments
- Monitor trip status
- Review collection records
- Raise/resolve operational exceptions (own LGA)

### ROLE 5 — Driver / Collection Crew
Mobile-focused.
- View assigned route
- Start trip
- Record collection (point, category, method, quantity, optional photo)
- Complete trip and submit load
- View sync status

### ROLE 6 — Facility Receiving Officer
- Search / scan Load ID
- View incoming load
- Confirm arrival
- Record received quantity and measurement method
- Record discrepancies (mandatory reason)
- Accept / reject / flag load

### ROLE 7 — Facility Processing Operator
- View received loads
- Record processing allocations
- Allocate material (compost / landfill / transfer / other)
- Record compost input; landfill; transfer quantity
- Create processing records; create compost batches

### ROLE 8 — Facility Manager
- Monitor facility operations
- View incoming waste, processing, transfer activity
- Review exceptions
- Resolve facility exceptions
- Generate facility reports

## 3. Permission matrix (summary)

| Resource:Action | Admin | Provincial | LGA Off. | Supervisor | Driver | Receiving | Processing | Fac. Mgr |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| user:manage | ✅ | – | – | – | – | – | – | – |
| lga:manage | ✅ | – | – | – | – | – | – | – |
| vehicle:manage | ✅ | – | ✅ | – | – | – | – | – |
| route:manage | ✅ | – | ✅ | ✅ | – | – | – | – |
| trip:create | ✅ | – | ✅ | ✅ | ✅ | – | – | – |
| trip:start | ✅ | – | ✅ | ✅ | ✅ | – | – | – |
| collection:create | ✅ | – | ✅ | ✅ | ✅ | – | – | – |
| trip:complete | ✅ | – | ✅ | ✅ | ✅ | – | – | – |
| load:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| load:search | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| receipt:create | ✅ | – | – | – | – | ✅ | – | ✅ |
| processing:create | ✅ | – | – | – | – | – | ✅ | ✅ |
| compost:create | ✅ | – | – | – | – | – | ✅ | ✅ |
| transfer:create | ✅ | – | – | – | – | – | ✅ | ✅ |
| transfer:receive | ✅ | – | – | – | – | ✅ | – | ✅ |
| exception:resolve | ✅ | – | ✅ | ✅ | – | – | – | ✅ |
| report:generate | ✅ | ✅ | ✅ | ✅ | – | – | – | ✅ |
| report:export | ✅ | ✅ | ✅ | ✅ | – | – | – | ✅ |
| audit:read | ✅ | – | – | – | – | – | – | ✅ |
| config:manage | ✅ | – | – | – | – | – | – | – |

*(Indicative; finalize with approved role policy.)*

## 4. Data scoping rules

- A **Driver** from LGA A must not view or modify LGA B's records.
- An **LGA Officer / Supervisor** is scoped to their own LGA.
- A **Facility** role is scoped to its own facility.
- A **Provincial Officer** is read-only district-wide.
- The **server** derives scope from the authenticated user record, never from client-supplied IDs (see [`13-security.md`](13-security.md) §Trust boundary).

## 5. Role-based dashboards

| Role | Default view |
|---|---|
| Provincial Officer | Dashboard + reports + read-only operational data |
| LGA Officer | Dashboard + routes + trips + loads + reports |
| Driver | Today's route + trips + collection |
| Receiving Officer | Receiving queue + load search |
| Processing Operator | Processing queue + batches |
| Facility Manager | Facility dashboard + exceptions + reports |
| Admin | Everything + configuration |

Do **not** show every feature to every user.
