import { query, withTransaction } from '../db/pool';
import { ApiError } from '../http/envelope';
import { writeAudit } from './auditService';
import type { AuthUser } from '../middleware/auth';

export const exceptionService = {
  async list(filters: { status?: string; severity?: string; from?: string; to?: string }) {
    const clauses: string[] = [];
    const params: unknown[] = [];
    const add = (sql: string, value: unknown) => {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    };
    if (filters.status) add('status = ?', filters.status);
    if (filters.severity) add('severity = ?', filters.severity);
    if (filters.from) add('created_at >= ?', filters.from);
    if (filters.to) add('created_at <= ?', filters.to);
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT id, entity_type, entity_id, exception_type, severity, description, status,
              resolution, resolved_at, created_at
       FROM exceptions ${where} ORDER BY created_at DESC LIMIT 200`,
      params
    );
    return rows;
  },

  async update(user: AuthUser, id: string, input: { status?: string; assignedTo?: string | null; resolution?: string | null }, opts: { ip?: string | null; deviceInfo?: string | null }) {
    return withTransaction(async (client) => {
      const existing = await client.query(
        `SELECT id, status, severity, description FROM exceptions WHERE id = $1 FOR UPDATE`,
        [id]
      );
      const row = existing.rows[0];
      if (!row) throw ApiError.notFound('Exception not found');

      const status = input.status ?? row.status;
      const resolvedAt = status === 'RESOLVED' ? new Date().toISOString() : null;

      const updated = await client.query(
        `UPDATE exceptions
           SET status = $1, assigned_to = COALESCE($2, assigned_to), resolution = COALESCE($3, resolution),
               resolved_at = $4
         WHERE id = $5
         RETURNING id, entity_type, entity_id, exception_type, severity, description, status, resolution, resolved_at`,
        [status, input.assignedTo ?? null, input.resolution ?? null, resolvedAt, id]
      );

      await writeAudit({
        userId: user.id,
        entityType: 'exception',
        entityId: id,
        action: 'EXCEPTION_UPDATED',
        oldValues: { status: row.status },
        newValues: { status, resolution: input.resolution ?? null },
        ...opts
      }, client);

      return updated.rows[0];
    });
  }
};
