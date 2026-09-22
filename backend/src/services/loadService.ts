import type { QueryResultRow } from 'pg';
import { query } from '../db/pool';
import { ApiError } from '../http/envelope';

interface LoadRow extends QueryResultRow {
  id: string;
  load_code: string;
  trip_id: string | null;
  trip_code: string | null;
  vehicle_label: string | null;
  lga_name: string | null;
  source_area: string | null;
  waste_category: string | null;
  measurement_method: string | null;
  declared_quantity_kg: string;
  status: string;
  arrival_time: string | null;
  received_quantity_kg: string | null;
  receiving_method: string | null;
  condition: string | null;
  discrepancy_flag: boolean;
  discrepancy_reason: string | null;
  received_by: string | null;
  compost_kg: string | null;
  landfill_kg: string | null;
  transfer_kg: string | null;
  other_kg: string | null;
  processing_incomplete: boolean | null;
  processed_by: string | null;
  created_at: string;
  updated_at: string;
}

export function mapLoad(r: LoadRow) {
  return {
    id: r.id,
    loadCode: r.load_code,
    tripId: r.trip_id,
    tripCode: r.trip_code,
    vehicleLabel: r.vehicle_label ?? '—',
    lgaName: r.lga_name ?? '—',
    sourceArea: r.source_area,
    wasteCategory: r.waste_category ?? 'UNKNOWN',
    measurementMethod: r.measurement_method ?? 'UNKNOWN',
    declaredQuantityKg: Number(r.declared_quantity_kg),
    status: r.status,
    arrivalTime: r.arrival_time,
    receivedQuantityKg: r.received_quantity_kg === null ? null : Number(r.received_quantity_kg),
    receivingMethod: r.receiving_method,
    condition: r.condition,
    discrepancyFlag: r.discrepancy_flag,
    discrepancyReason: r.discrepancy_reason,
    receivedBy: r.received_by,
    compostKg: r.compost_kg === null ? null : Number(r.compost_kg),
    landfillKg: r.landfill_kg === null ? null : Number(r.landfill_kg),
    transferKg: r.transfer_kg === null ? null : Number(r.transfer_kg),
    otherKg: r.other_kg === null ? null : Number(r.other_kg),
    processingIncomplete: r.processing_incomplete ?? true,
    processedBy: r.processed_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export const LOAD_SELECT = `
  SELECT l.id, l.load_code, l.trip_id, t.trip_code, l.declared_quantity_kg, l.status, l.created_at, l.updated_at,
         v.registration_number AS vehicle_label,
         lg.name AS lga_name,
         t.source_area,
         wc.code AS waste_category,
         (SELECT mm.code FROM collection_events ce
            JOIN measurement_methods mm ON mm.id = ce.measurement_method_id
            WHERE ce.trip_id = l.trip_id LIMIT 1) AS measurement_method,
         r.arrival_time, r.received_quantity_kg, r.condition, r.discrepancy_flag, r.discrepancy_reason,
         (SELECT mm2.code FROM measurement_methods mm2 WHERE mm2.id = r.measurement_method_id) AS receiving_method,
         (SELECT u.name FROM users u WHERE u.id = r.received_by) AS received_by,
         p.compost_kg, p.landfill_kg, p.transfer_kg, p.other_kg, p.incomplete AS processing_incomplete,
         (SELECT u2.name FROM users u2 WHERE u2.id = p.operator_id) AS processed_by
  FROM loads l
  LEFT JOIN trips t ON t.id = l.trip_id
  LEFT JOIN vehicles v ON v.id = t.vehicle_id
  LEFT JOIN lgas lg ON lg.id = t.lga_id
  LEFT JOIN waste_categories wc ON wc.id = l.waste_category_id
  LEFT JOIN receipts r ON r.load_id = l.id
  LEFT JOIN processing_records p ON p.load_id = l.id
`;

export const loadService = {
  async list(filters: { status?: string; lgaId?: string; facilityId?: string; from?: string; to?: string; scopeLga?: string | null; scopeFacility?: string | null }) {
    const clauses: string[] = [];
    const params: unknown[] = [];
    const add = (sql: string, value: unknown) => {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    };
    if (filters.status) add('l.status = ?', filters.status);
    if (filters.scopeLga) add('t.lga_id = ?', filters.scopeLga);
    if (filters.lgaId) add('t.lga_id = ?', filters.lgaId);
    if (filters.scopeFacility) add('l.destination_facility_id = ?', filters.scopeFacility);
    if (filters.facilityId) add('l.destination_facility_id = ?', filters.facilityId);
    if (filters.from) add('l.created_at >= ?', filters.from);
    if (filters.to) add('l.created_at <= ?', filters.to);

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await query<LoadRow>(`${LOAD_SELECT} ${where} ORDER BY l.created_at DESC LIMIT 500`, params);
    return rows.map(mapLoad);
  },

  async get(loadCodeOrId: string, scopeLga?: string | null, scopeFacility?: string | null) {
    const clauses: string[] = ['l.load_code = $1 OR l.id::text = $1'];
    const params: unknown[] = [loadCodeOrId];
    if (scopeLga) {
      clauses.push('t.lga_id = $2');
      params.push(scopeLga);
    }
    if (scopeFacility) {
      const idx = params.length + 1;
      clauses.push(`l.destination_facility_id = $${idx}`);
      params.push(scopeFacility);
    }
    const where = clauses.join(' AND ');
    const { rows } = await query<LoadRow>(
      `${LOAD_SELECT} WHERE ${where} LIMIT 1`,
      params
    );
    if (!rows[0]) throw ApiError.notFound('Load not found');
    return mapLoad(rows[0]);
  },

  async search(q: string) {
    const like = `%${q}%`;
    const { rows } = await query<LoadRow>(
      `${LOAD_SELECT}
       WHERE l.load_code ILIKE $1
          OR v.registration_number ILIKE $1
          OR lg.name ILIKE $1
          OR t.trip_code ILIKE $1
       ORDER BY l.created_at DESC LIMIT 50`,
      [like]
    );
    return rows.map(mapLoad);
  },

  /** Full timeline with responsible parties where recorded. */
  async trace(loadCodeOrId: string) {
    const load = await this.get(loadCodeOrId);
    const steps: Array<{ label: string; detail: string | null; at: string | null; completed: boolean }> = [
      { label: 'Created', detail: `Load ${load.loadCode}`, at: load.createdAt, completed: true },
      { label: 'Trip', detail: load.tripCode ?? '—', at: null, completed: load.tripCode !== null },
      { label: 'Collection Completed', detail: `Vehicle ${load.vehicleLabel}`, at: null, completed: true },
      { label: 'Arrived Facility', detail: null, at: load.arrivalTime, completed: load.arrivalTime !== null },
      {
        label: 'Received',
        detail: load.receivedQuantityKg === null ? null : `by ${load.receivedBy ?? '—'}`,
        at: load.arrivalTime,
        completed: load.receivedQuantityKg !== null
      },
      { label: 'Processed', detail: load.processedBy, at: null, completed: !load.processingIncomplete },
      { label: 'Final Outcome', detail: null, at: load.updatedAt, completed: !load.processingIncomplete }
    ];

    const declared = load.declaredQuantityKg;
    const received = load.receivedQuantityKg;
    const allocated = (load.compostKg ?? 0) + (load.landfillKg ?? 0) + (load.transferKg ?? 0) + (load.otherKg ?? 0);

    return {
      load,
      steps,
      reconciliation: {
        declaredKg: declared,
        receivedKg: received,
        allocatedKg: allocated,
        declaredMinusReceived: received === null ? null : received - declared,
        receivedMinusAllocated: received === null ? null : received - allocated
      }
    };
  }
};
