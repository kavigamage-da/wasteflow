# 16 — Deployment & Operations

> **Classifier:** PROPOSED operational model.

## 1. Environments

```
Development ──► Staging ──► User Acceptance Testing ──► Production
```

| Environment | Purpose | Data |
|---|---|---|
| Development | Local builds, feature work | Synthetic only |
| Staging | Integration verification | Synthetic / anonymised |
| UAT | Stakeholder validation, field pilot dry-runs | Synthetic / approved pilot data |
| Production | Live operation (after approval) | Real operational data |

No environment carries secrets in source; each has its own database credentials and API base URL.

## 2. Reference stack

- Backend (Node.js/TypeScript) and web dashboard (React) containerised with **Docker**.
- Managed **PostgreSQL** with automated backups.
- **HTTPS** termination at the load balancer / reverse proxy.
- **CI/CD** pipeline: build → test → migrate → deploy, with approvals for production.
- Staging and production are separate; production access is least-privilege.

## 3. Configuration & secrets

Environment variables / secret manager only:
`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `STORAGE_*`, `SMTP_*` (if used).
The Android `API_BASE_URL` is a build configuration value. No secret is ever committed.

## 4. Production requirements

HTTPS · secure environment variables · automated backups · monitoring · database migrations ·
error logging · access control · disaster-recovery procedure.

## 5. Backup & restore

- **Daily backup**, encrypted at rest.
- **Retention policy configurable** by administration.
- **Periodic restore testing** to prove recoverability (a backup that has never been restored is unproven).
- No specific government retention period is claimed unless officially approved.

## 6. Monitoring & logging

**Monitor:** API availability and latency, error rate, DB connections/storage, sync failure rate, background job health.

**Log (backend):** authentication events, API errors, synchronization failures, critical business
errors, system events.

**Never log:** passwords, access tokens, unnecessary personal information.

## 7. Migrations

- Forward-only, versioned SQL migrations applied during deployment.
- Production migrations take a pre-migration backup and are reversible by restore if required.
- No destructive change to operational tables without an approved plan.

## 8. Release process

1. Merge to main → CI builds and runs the full test suite.
2. Deploy to staging → smoke tests and integration checks.
3. UAT sign-off with stakeholders.
4. Production deploy during a low-usage window; migration + verification.
5. Post-deploy health checks (`/api/health`, `/api/health/ready`).

## 9. Rollback & disaster recovery

- Application rollback by redeploying the previous image.
- Database rollback by restore from the pre-migration backup.
- DR runbook documents detection, escalation, restore and verification steps.
- RPO/RTO targets are set with stakeholders during deployment planning (not assumed here).

## 10. Operational guardrails

- Reference capacity is a **configurable administrative value** — it is not asserted as a live limit.
- GPS, languages and retention are configuration, not hard-coded.
- The system must keep working without GPS and without continuous connectivity.

## 11. Go-live checklist

- [ ] All ten test scenarios pass in UAT.
- [ ] Security and role tests pass (cross-LGA access denied).
- [ ] Backups run and a restore has been tested.
- [ ] Monitoring and error logging are live.
- [ ] Master data (LGAs, vehicles, facilities, categories) configured by the administrator.
- [ ] Demo data removed or clearly isolated before any real operational use.
- [ ] Access control reviewed; least-privilege roles assigned.
- [ ] DR runbook available and rehearsed.
