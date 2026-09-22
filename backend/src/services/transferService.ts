import { query, withTransaction } from '../db/pool';
import { ApiError } from '../http/envelope';
import { writeAudit } from './auditService';
import { ids } from '../utils/ids';
import type { AuthUser } from '../middleware/auth';

interface CreateTransferInput {
  sourceFacilityId?: string | null;
  destinationName: string;
  containerNumber?: string | null;
  quantityKg: number;
  dispatchTime?: string | null;
  loadIds?: string[];
}

export const transferService = {
  async create(user: AuthUser, input: CreateTransferInput, opts: { ip?: string | null; deviceInfo?: string | null }) {
    if (input.quantityKg < 0) throw ApiError.validation('Quantity must be zero or greater', 'quantityKg');
    if (!input.destinationName?.trim()) throw ApiError.validation('Destination is required', 'destinationName');

    return withTransaction(async (client) => {
      const sourceFacilityId =
        input.sourceFacilityId ??
        user.facilityId ??
        (await client.query<{ id: string }>(`SELECT id FROM facilities WHERE active LIMIT 1`)).rows[0]?.id;
      if (!sourceFacilityId) throw ApiError.validation('Source facility is required', 'sourceFacilityId');

      const seqRow = await client.query<{ count: string }>(`SELECT count(*)::text AS count FROM transfer_shipments`);
      const seq = Number(seqRow.rows[0]?.count ?? '0') + 1;
      const shipmentCode = ids.shipment(seq);

      const inserted = await client.query(
        `INSERT INTO transfer_shipments
           (shipment_code, source_facility_id, destination_name, container_number, quantity_kg, dispatch_time, status)
         VALUES ($1,$2,$3,$4,$5,$6,'DISPATCHED')
         RETURNING id, shipment_code, destination_name, container_number, quantity_kg, status, dispatch_time`,
        [
          shipmentCode,
          sourceFacilityId,
          input.destinationName,
          input.containerNumber ?? null,
          input.quantityKg,
          input.dispatchTime ?? new Date().toISOString()
        ]
      );

      const shipmentId = inserted.rows[0].id;
      for (const loadId of input.loadIds ?? []) {
        await client.query(
          `INSERT INTO shipment_loads (shipment_id, load_id, quantity_kg)
           VALUES ($1, $2, COALESCE((SELECT declared_quantity_kg FROM loads WHERE id = $2), 0))
           ON CONFLICT DO NOTHING`,
          [shipmentId, loadId]
        );
      }

      await writeAudit({
        userId: user.id,
        entityType: 'transfer_shipment',
        entityId: shipmentId,
        action: 'SHIPMENT_CREATED',
        newValues: { shipmentCode, destinationName: input.destinationName, quantityKg: input.quantityKg },
        ...opts
      }, client);

      return inserted.rows[0];
    });
  },

  async list(filters: { status?: string }) {
    const params: unknown[] = [];
    const where = filters.status ? `WHERE ts.status = $1` : '';
    if (filters.status) params.push(filters.status);
    const { rows } = await query(
      `SELECT ts.id, ts.shipment_code, ts.destination_name, ts.container_number, ts.quantity_kg,
              ts.dispatch_time, ts.status, ts.received_time,
              (SELECT count(*) FROM shipment_loads sl WHERE sl.shipment_id = ts.id) AS load_count
       FROM transfer_shipments ts ${where} ORDER BY ts.created_at DESC LIMIT 200`,
      params
    );
    return rows;
  },

  async get(id: string) {
    const { rows } = await query(
      `SELECT ts.*, f.name AS source_facility_name
       FROM transfer_shipments ts JOIN facilities f ON f.id = ts.source_facility_id
       WHERE ts.id::text = $1 OR ts.shipment_code = $1 LIMIT 1`,
      [id]
    );
    if (!rows[0]) throw ApiError.notFound('Shipment not found');
    const loads = await query(
      `SELECT sl.load_id, l.load_code, sl.quantity_kg FROM shipment_loads sl
       JOIN loads l ON l.id = sl.load_id WHERE sl.shipment_id = $1`,
      [rows[0].id]
    );
    return { ...rows[0], loads: loads.rows };
  },

  /** Destination confirmation. Without it the shipment remains AWAITING_CONFIRMATION. */
  async receive(user: AuthUser, id: string, receivedQuantityKg: number, opts: { ip?: string | null; deviceInfo?: string | null }) {
    if (receivedQuantityKg < 0) throw ApiError.validation('Received quantity must be zero or greater');

    return withTransaction(async (client) => {
      const shipment = await client.query<{ id: string; quantity_kg: string; status: string }>(
        `SELECT id, quantity_kg, status FROM transfer_shipments WHERE id::text = $1 OR shipment_code = $1 FOR UPDATE`,
        [id]
      );
      const row = shipment.rows[0];
      if (!row) throw ApiError.notFound('Shipment not found');

      const difference = receivedQuantityKg - Number(row.quantity_kg);
      await client.query(
        `INSERT INTO shipment_receipts (shipment_id, received_quantity_kg, difference_kg, received_by)
         VALUES ($1,$2,$3,$4)`,
        [row.id, receivedQuantityKg, difference, user.id]
      );

      const newStatus = Math.abs(difference) > 0.0001 ? 'EXCEPTION' : 'RECEIVED';
      await client.query(
        `UPDATE transfer_shipments SET status=$1, received_time=now(), updated_at=now() WHERE id=$2`,
        [newStatus, row.id]
      );

      if (Math.abs(difference) > 0.0001) {
        await client.query(
          `INSERT INTO exceptions (entity_type, entity_id, exception_type, severity, description, status, created_by)
           VALUES ('transfer_shipment', $1, 'TRANSFER_QUANTITY_MISMATCH', 'WARNING', $2, 'OPEN', $3)`,
          [row.id, `Declared ${row.quantity_kg} kg / received ${receivedQuantityKg} kg (difference ${difference} kg).`, user.id]
        );
      }

      await writeAudit({
        userId: user.id,
        entityType: 'transfer_shipment',
        entityId: row.id,
        action: 'SHIPMENT_RECEIVED',
        oldValues: { status: row.status },
        newValues: { status: newStatus, receivedQuantityKg, difference },
        ...opts
      }, client);

      return { id: row.id, status: newStatus, receivedQuantityKg, difference };
    });
  },

  /** Mark a dispatched shipment as awaiting destination confirmation. */
  async markAwaitingConfirmation(id: string) {
    const { rows } = await query(
      `UPDATE transfer_shipments SET status='AWAITING_CONFIRMATION', updated_at=now()
       WHERE (id::text = $1 OR shipment_code = $1) AND status IN ('DRAFT','DISPATCHED','IN_TRANSIT')
       RETURNING id, shipment_code, status`,
      [id]
    );
    if (!rows[0]) throw ApiError.notFound('Shipment not found or already confirmed');
    return rows[0];
  }
};
