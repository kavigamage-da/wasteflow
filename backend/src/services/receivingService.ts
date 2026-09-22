import { query, withTransaction } from '../db/pool';
import { ApiError } from '../http/envelope';
import { writeAudit } from './auditService';
import { mapLoad, LOAD_SELECT } from './loadService';
import type { AuthUser } from '../middleware/auth';

interface ReceiptInput {
  receivedQuantityKg: number;
  measurementMethod: string;
  condition?: string | null;
  discrepancyReason?: string | null;
  notes?: string | null;
}

export const receivingService = {
  async receive(user: AuthUser, loadCode: string, input: ReceiptInput, opts: { ip?: string | null; deviceInfo?: string | null }) {
    if (input.receivedQuantityKg < 0) throw ApiError.validation('Received quantity must be zero or greater', 'receivedQuantityKg');

    return withTransaction(async (client) => {
      const loadRes = await client.query<{ id: string; declared_quantity_kg: string; status: string }>(
        `SELECT id, declared_quantity_kg, status FROM loads WHERE load_code = $1 OR id::text = $1 FOR UPDATE`,
        [loadCode]
      );
      const load = loadRes.rows[0];
      if (!load) throw ApiError.notFound('Load not found');

      const existing = await client.query(`SELECT id FROM receipts WHERE load_id = $1`, [load.id]);
      if (existing.rows[0]) throw ApiError.conflict('This load has already been received.');

      const method = await client.query<{ id: string }>(`SELECT id FROM measurement_methods WHERE code = $1`, [input.measurementMethod]);
      if (!method.rows[0]) throw ApiError.validation('Unknown measurement method', 'measurementMethod');

      const declared = Number(load.declared_quantity_kg);
      const discrepancy = Math.abs(input.receivedQuantityKg - declared) > 0.0001;
      if (discrepancy && (!input.discrepancyReason || input.discrepancyReason.trim() === '')) {
        throw ApiError.validation(
          'A reason is required when declared and received quantities differ.',
          'discrepancyReason'
        );
      }

      const facilityId = user.facilityId ?? (await client.query<{ id: string }>(`SELECT id FROM facilities WHERE active LIMIT 1`)).rows[0]?.id ?? null;

      const receipt = await client.query(
        `INSERT INTO receipts (load_id, facility_id, arrival_time, received_quantity_kg, measurement_method_id,
                               condition, discrepancy_flag, discrepancy_reason, received_by, notes)
         VALUES ($1,$2, now(), $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          load.id,
          facilityId,
          input.receivedQuantityKg,
          method.rows[0].id,
          input.condition ?? null,
          discrepancy,
          input.discrepancyReason ?? null,
          user.id,
          input.notes ?? null
        ]
      );

      const newStatus = discrepancy ? 'EXCEPTION' : 'RECEIVED';
      await client.query(`UPDATE loads SET status = $1, updated_at = now() WHERE id = $2`, [newStatus, load.id]);

      if (discrepancy) {
        await client.query(
          `INSERT INTO exceptions (entity_type, entity_id, exception_type, severity, description, status, created_by)
           VALUES ('load', $1, 'QUANTITY_MISMATCH', 'WARNING', $2, 'OPEN', $3)`,
          [
            load.id,
            `Declared ${declared} kg / received ${input.receivedQuantityKg} kg (difference ${input.receivedQuantityKg - declared} kg). Reason recorded.`,
            user.id
          ]
        );
      }

      await writeAudit({
        userId: user.id,
        entityType: 'load',
        entityId: load.id,
        action: 'RECEIVED',
        oldValues: { status: load.status, declaredQuantityKg: declared },
        newValues: { status: newStatus, receivedQuantityKg: input.receivedQuantityKg, discrepancy, receiptId: receipt.rows[0].id },
        ...opts
      }, client);

      const updated = await client.query(LOAD_SELECT + ` WHERE l.id = $1`, [load.id]);
      return mapLoad(updated.rows[0]);
    });
  },

  async list(filters: { facilityId?: string | null; from?: string; to?: string }) {
    const clauses: string[] = [];
    const params: unknown[] = [];
    const add = (sql: string, value: unknown) => {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    };
    if (filters.facilityId) add('r.facility_id = ?', filters.facilityId);
    if (filters.from) add('r.created_at >= ?', filters.from);
    if (filters.to) add('r.created_at <= ?', filters.to);
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT r.id, l.load_code, r.received_quantity_kg, r.arrival_time, r.discrepancy_flag,
              r.discrepancy_reason, r.condition
       FROM receipts r JOIN loads l ON l.id = r.load_id
       ${where} ORDER BY r.created_at DESC LIMIT 200`,
      params
    );
    return rows;
  }
};
