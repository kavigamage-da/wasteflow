import { query, withTransaction } from '../db/pool';
import { ApiError } from '../http/envelope';
import { writeAudit } from './auditService';
import { mapLoad, LOAD_SELECT } from './loadService';
import type { AuthUser } from '../middleware/auth';

interface ProcessInput {
  compostKg: number;
  landfillKg: number;
  transferKg: number;
  otherKg: number;
  incomplete?: boolean;
  notes?: string | null;
}

export const processingService = {
  async process(user: AuthUser, loadCode: string, input: ProcessInput, opts: { ip?: string | null; deviceInfo?: string | null }) {
    const values = [input.compostKg, input.landfillKg, input.transferKg, input.otherKg];
    if (values.some((v) => v < 0 || Number.isNaN(v))) {
      throw ApiError.validation('Allocations cannot be negative');
    }
    const incomplete = input.incomplete ?? false;

    return withTransaction(async (client) => {
      // Lock the load row on its own: `FOR UPDATE` cannot be applied through a LEFT JOIN.
      const loadRes = await client.query<{ id: string; status: string }>(
        `SELECT id, status FROM loads WHERE load_code = $1 OR id::text = $1 FOR UPDATE`,
        [loadCode]
      );
      const load = loadRes.rows[0];
      if (!load) throw ApiError.notFound('Load not found');

      const receiptRes = await client.query<{ received: string | null }>(
        `SELECT received_quantity_kg AS received FROM receipts WHERE load_id = $1`,
        [load.id]
      );
      const receivedRaw = receiptRes.rows[0]?.received ?? null;
      if (receivedRaw === null) throw ApiError.validation('Load must be received before processing.');

      const received = Number(receivedRaw);
      const allocated = values.reduce((a, b) => a + b, 0);

      if (!incomplete && Math.abs(allocated - received) > 0.5) {
        throw ApiError.validation(
          `Allocation (${allocated} kg) must equal received quantity (${received} kg), or mark the record incomplete.`,
          'compostKg'
        );
      }
      if (allocated > received + 0.5) {
        throw ApiError.validation('Allocation cannot exceed the received quantity.');
      }

      const existing = await client.query(`SELECT id FROM processing_records WHERE load_id = $1`, [load.id]);
      if (existing.rows[0]) {
        await client.query(
          `UPDATE processing_records
             SET compost_kg=$1, landfill_kg=$2, transfer_kg=$3, other_kg=$4, incomplete=$5,
                 input_quantity_kg=$6, operator_id=$7, notes=$8, processed_at=now()
           WHERE load_id=$9`,
          [input.compostKg, input.landfillKg, input.transferKg, input.otherKg, incomplete, received, user.id, input.notes ?? null, load.id]
        );
      } else {
        await client.query(
          `INSERT INTO processing_records
             (load_id, process_type, input_quantity_kg, compost_kg, landfill_kg, transfer_kg, other_kg, incomplete, operator_id, notes)
           VALUES ($1,'MIXED_ALLOCATION',$2,$3,$4,$5,$6,$7,$8,$9)`,
          [load.id, received, input.compostKg, input.landfillKg, input.transferKg, input.otherKg, incomplete, user.id, input.notes ?? null]
        );
      }

      const newStatus = incomplete ? 'PROCESSING' : 'COMPLETED';
      await client.query(`UPDATE loads SET status=$1, updated_at=now() WHERE id=$2`, [newStatus, load.id]);

      await writeAudit({
        userId: user.id,
        entityType: 'load',
        entityId: load.id,
        action: 'PROCESSED',
        oldValues: { status: load.status },
        newValues: {
          status: newStatus,
          compostKg: input.compostKg,
          landfillKg: input.landfillKg,
          transferKg: input.transferKg,
          otherKg: input.otherKg,
          incomplete
        },
        ...opts
      }, client);

      const updated = await client.query(LOAD_SELECT + ` WHERE l.id = $1`, [load.id]);
      return mapLoad(updated.rows[0]);
    });
  },

  async list(filters: { facilityId?: string | null }) {
    const params: unknown[] = [];
    let where = '';
    if (filters.facilityId) {
      params.push(filters.facilityId);
      where = `WHERE l.destination_facility_id = $1`;
    }
    const { rows } = await query(
      `SELECT p.id, l.load_code, p.compost_kg, p.landfill_kg, p.transfer_kg, p.other_kg,
              p.incomplete, p.processed_at
       FROM processing_records p JOIN loads l ON l.id = p.load_id
       ${where} ORDER BY p.processed_at DESC LIMIT 200`,
      params
    );
    return rows;
  },

  async createCompostBatch(user: AuthUser, input: { inputKg: number; outputKg?: number; residualKg?: number; notes?: string | null }) {
    if (input.inputKg < 0) throw ApiError.validation('Input quantity must be zero or greater');
    const seqRow = await query<{ count: string }>(`SELECT count(*)::text AS count FROM compost_batches`);
    const seq = Number(seqRow.rows[0]?.count ?? '0') + 1;
    const { ids } = await import('../utils/ids');
    const batchCode = ids.compostBatch(seq);
    const { rows } = await query(
      `INSERT INTO compost_batches (batch_code, input_kg, output_kg, residual_kg, operator_id, status, notes)
       VALUES ($1,$2,$3,$4,$5,'PROCESSING',$6)
       RETURNING id, batch_code, input_kg, output_kg, residual_kg, status`,
      [batchCode, input.inputKg, input.outputKg ?? null, input.residualKg ?? null, user.id, input.notes ?? null]
    );
    return rows[0];
  }
};
