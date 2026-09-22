# 13 — Security, Privacy & Audit

> **Classifier:** PROPOSED controls for the WasteFlow system. They do not assert the security posture
> of any existing system.

## 1. Authentication

- Username/email + password over HTTPS.
- Password hashing with **bcrypt** or **Argon2** (never reversible, never logged, never returned by any API).
- Short-lived **JWT access tokens** + **refresh tokens** with rotation.
- Token expiry and explicit logout (refresh token invalidation).
- Failed-login **rate limiting** and **account lockout** with backoff.
- Session persistence on mobile via encrypted DataStore; tokens are cleared on logout.

## 2. Authorization (RBAC + scope)

- Permissions are `resource:action`; roles are sets of permissions (see `03-stakeholders.md`).
- **Enforcement is server-side.** The client never asserts its own role.
- **Record scope** is derived from the authenticated user record:
  - Driver → own LGA (and own trips where applicable).
  - LGA Officer / Supervisor → own LGA.
  - Facility roles → own facility.
  - Provincial Officer → read-only, district-wide.
  - Admin → configuration + read.
- **Never trust IDs from the mobile app.** Example: a driver from LGA A must not be able to modify LGA B's records.
  The server re-derives scope and rejects out-of-scope operations with `403 FORBIDDEN`.

## 3. Input validation & injection defence

- DTO validation on every endpoint (types, ranges, required fields, enum membership).
- Parameterised queries / ORM bindings — no string-built SQL.
- Output encoding and strict JSON envelopes.
- Uploaded attachment type/size validation; stored outside the web root.

## 4. Transport & infrastructure

- HTTPS everywhere; HSTS recommended.
- Secrets in environment variables / secret manager — **never** in source or images.
- Least-privilege database role; separate credentials per environment.
- Container images scanned; dependencies kept current.

## 5. Audit logging

Every important change records:
`user · action · entity_type · entity_id · timestamp · old_value · new_value · IP/device metadata`.

Example:
```
Officer A      Changed received quantity
2,500 kg  →  2,450 kg
20 Sep 2026 10:52
```

- Audit rows are **append-only**. No role has an update or delete path; the DB application role has
  `UPDATE`/`DELETE` revoked on `audit_logs`.
- Corrections to completed records go through the correction workflow and are always audited.

## 6. Logging discipline

**Log:** authentication events, API errors, sync failures, critical business errors, system events.

**Never log:** passwords, access/refresh tokens, full personal records, or unnecessary personal information.

## 7. Privacy

- Collect only information necessary for operations.
- Driver/worker information is accessible only to authorized personnel.
- QR codes contain **only** the Load ID — no personal data.
- GPS capture is optional and configurable; the system must function without it.
- Photo attachments are optional and stored securely; not mandatory unless operationally justified.

## 8. Data integrity as a security property

- Foreign keys, unique constraints, check constraints, transactions and indexes (see `10-database.md`).
- Soft deletion (`active = false`) — important operational records are never hard-deleted.
- Idempotency keys prevent duplicate operational records from sync retries.

## 9. Availability & recovery

- Daily encrypted backups with a configurable retention policy.
- Periodic **restore testing**.
- Disaster-recovery procedure documented; RPO/RTO targets set during deployment planning.
- No specific governmental retention period is claimed unless officially approved.

## 10. Secure development practice

- TypeScript strict mode; linting; code review.
- Automated tests including **security tests** and **role tests** (see `15-testing.md`).
- Dependency updates and vulnerability scanning in CI.

## 11. Threat notes specific to WasteFlow

| Threat | Mitigation |
|---|---|
| Falsified quantity to hide losses | Discrepancy reason + immutable audit + reconciliation variance |
| Duplicate submission from offline retry | Idempotency key; server replay returns original |
| Cross-LGA record tampering | Server-derived scope; ID distrust |
| Unauthorized correction of history | Correction workflow + audit old→new |
| Token theft | Short-lived tokens, refresh rotation, logout invalidation |
| Enumeration of loads | Authorization checks + rate limiting; no bulk unauthenticated reads |

## 12. Security acceptance criteria

1. A driver cannot read or write another LGA's records.
2. Tokens and passwords never appear in logs or API responses.
3. Audit history cannot be modified or deleted by any role.
4. Every mutation is validated server-side.
5. Replaying the same `clientGeneratedId` does not create a duplicate.
