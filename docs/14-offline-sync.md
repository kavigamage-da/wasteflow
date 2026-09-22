# 14 — Offline-First & Sync

> **Classifier:** PROPOSED. This behaviour is **mandatory** for the mobile app.

## 1. Principle

Field connectivity cannot be assumed. The device is a full participant, not a thin client: records are
written to the local database first and the network is treated as an eventually-available synchroniser.

```
User action → ViewModel validation → Room write (immediate) → UI updates from Room
                                            │
                                            └─► best-effort API call → mark sync state
```

Guarantees:
1. No local record is deleted before the server confirms it.
2. Every mutation carries an **idempotency key** (`clientGeneratedId`).
3. Failures are surfaced to the user, never swallowed.

## 2. Local schema (Room)

| Entity | Key fields |
|---|---|
| `trips` | clientId (PK), serverId, tripCode, vehicleId, lgaId, startTime, endTime, status, declaredQuantityKg, loadCode, syncStatus |
| `collections` | clientId (PK), serverId, tripClientId (FK), locationDescription, wasteCategory, measurementMethod, quantityKg, lat/lng, photoUri, collectedAt, syncStatus |
| `loads` | loadCode (PK), serverId, tripClientId, declaredQuantityKg, status, receivedQuantityKg, receivingMethod, compost/landfill/transfer/other, discrepancyFlag, syncStatus |
| `users` | id (PK), name, role, lgaId, facilityId (session cache; revalidated online) |

Every syncable record carries:
`client_generated_id · created_at · updated_at · sync_status`.

## 3. Sync states

```
PENDING → SYNCING → SYNCED
   ▲          │
   │          ├→ FAILED ──retry──► SYNCING
   │          │
   └──────────┴→ CONFLICT ──supervisor──► SYNCED / FAILED
```

## 4. Sync engine behaviour

Online ordering: **trips → collections → (loads as part of trip completion)**. The server is the
authority for final codes once a record is acknowledged.

```
Pending Records: 5
Syncing...
✓ Trip TR-001
✓ Load LD-001
✓ Load LD-002
✓ Collection CL-003
✗ Load LD-004          [Retry]
```

- Triggered on reconnect and by a periodic **WorkManager** job (network-constrained, exponential backoff).
- Each record is submitted individually so one failure does not block the rest.
- The result list is shown per record with the server's message on failure.

## 5. Idempotency

The client generates a stable `clientGeneratedId` when the record is created, **not** when it is sent.
Retries reuse the same id. The server, on seeing a known id, returns the original result
(`IDEMPOTENT_REPLAY`) instead of creating a duplicate.

## 6. Conflict handling

If the server holds a newer version than the device:

```
CONFLICT DETECTED
Server Version   2,500 kg
Device Version   2,450 kg
[ Keep Server ]  [ Review ]
```

- Surfaced in the Sync screen with status `CONFLICT`.
- A supervisor resolves it; the outcome is recorded.
- Conflicts never auto-overwrite silently.

## 7. What can be captured offline

- Start trip
- Record collection
- Complete trip
- Receiving records (where permitted)
- Processing records (where permitted)

## 8. Offline UI contract

```
● Offline
Data will be saved locally.
It will synchronize when connectivity returns.
```

- Sync screen shows a pending count per record type.
- Loads/trips created offline show a `PENDING` badge until confirmed.
- The app is fully navigable while offline; reads always come from Room.

## 9. Failure taxonomy

| Failure | Handling |
|---|---|
| No connectivity | Stay `PENDING`; retry on reconnect |
| Server validation (4xx) | `FAILED` + message; user corrects |
| Server error/timeout (5xx) | `FAILED`; automatic retry with backoff |
| Version conflict | `CONFLICT`; supervisor resolves |
| Attachment upload failure | Record syncs; attachment retried separately |

## 10. Acceptance criteria

1. Creating a trip and collections with no network keeps every record and syncs it later.
2. Re-sending a synced record does not create a duplicate.
3. A conflict shows both values and requires a decision.
4. The pending count reaches zero after a successful sync.
5. No record is ever deleted locally before server confirmation.
