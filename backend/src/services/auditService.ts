import type { PoolClient } from 'pg';
import { pool } from '../db/pool';

export interface AuditEntry {
  userId: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  oldValues?: unknown;
  newValues?: unknown;
  ip?: string | null;
  deviceInfo?: string | null;
}

/**
 * Append-only audit trail. There is no update or delete path anywhere in the codebase —
 * the database role should additionally have UPDATE/DELETE revoked on audit_logs.
 */
export async function writeAudit(entry: AuditEntry, client?: PoolClient): Promise<void> {
  const sql = `
    INSERT INTO audit_logs (user_id, entity_type, entity_id, action, old_values, new_values, ip, device_info)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;
  const params = [
    entry.userId,
    entry.entityType,
    entry.entityId,
    entry.action,
    entry.oldValues === undefined ? null : JSON.stringify(entry.oldValues),
    entry.newValues === undefined ? null : JSON.stringify(entry.newValues),
    entry.ip ?? null,
    entry.deviceInfo ?? null
  ];
  if (client) {
    await client.query(sql, params as never[]);
  } else {
    await pool.query(sql, params as never[]);
  }
}
