import type { QueryResultRow } from 'pg';
import { query, withTransaction } from '../db/pool';
import { ApiError } from '../http/envelope';
import { ids } from '../utils/ids';
import { writeAudit } from './auditService';
import type { AuthUser } from '../middleware/auth';

interface TxOptions {
  ip?: string | null;
  deviceInfo?: string | null;
}

interface TripRow extends QueryResultRow {
  id: string;
  trip_code: string;
  vehicle_id: string;
  route_id: string | null;
  lga_id: string;
  source_area: string | null;
  status: string;
  start_time: string | null;
  end_time: string | null;
  declared_quantity_kg: string | null;
  client_generated_id: string | null;
}

interface CollectionRow extends QueryResultRow {
  id: string;
  location_description: string;
  waste_category: string;
  measurement_method: string;
  quantity_kg: string;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  collected_at: string;
}

function mapTrip(row: TripRow) {
  return {
    id: row.id,
    tripCode: row.trip_code,
    vehicleId: row.vehicle_id,
    routeId: row.route_id,
    lgaId: row.lga_id,
    sourceArea: row.source_area,
    status: row.status,
    startTime: row.start_time,
    endTime: row.end_time,
    declaredQuantityKg: Number(row.declared_quantity_kg ?? 0),
    clientGeneratedId: row.client_generated_id
  };
}

function mapCollection(row: CollectionRow) {
  return {
    id: row.id,
    locationDescription: row.location_description,
    wasteCategory: row.waste_category,
    measurementMethod: row.measurement_method,
    quantityKg: Number(row.quantity_kg),
    latitude: row.latitude,
    longitude: row.longitude,
    notes: row.notes,
    collectedAt: row.collected_at
  };
}

const TRIP_SELECT = `
  SELECT t.id, t.trip_code, t.vehicle_id, t.route_id, t.lga_id, t.source_area, t.status,
         t.start_time, t.end_time, t.client_generated_id,
         (SELECT COALESCE(SUM(ce.quantity_kg),0) FROM collection_events ce WHERE ce.trip_id = t.id) AS declared_quantity_kg
  FROM trips t
`;

export const tripService = {
  async list(filters: { lgaId?: string; vehicleId?: string; status?: string; from?: string; to?: string; scopeLga: string | null }) {
    const clauses: string[] = [];
    const params: unknown[] = [];
    const add = (sql: string, value: unknown) => {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    };
    if (filters.scopeLga) add('t.lga_id = ?', filters.scopeLga);
    if (filters.lgaId) add('t.lga_id = ?', filters.lgaId);
    if (filters.vehicleId) add('t.vehicle_id = ?', filters.vehicleId);
    if (filters.status) add('t.status = ?', filters.status);
    if (filters.from) add('t.start_time >= ?', filters.from);
    if (filters.to) add('t.start_time <= ?', filters.to);

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await query<TripRow>(`${TRIP_SELECT} ${where} ORDER BY t.created_at DESC LIMIT 200`, params);
    return rows.map(mapTrip);
  },

  async get(tripId: string, scopeLga?: string | null) {
    const clauses: string[] = ['t.id = $1'];
    const params: unknown[] = [tripId];
    if (scopeLga) {
      clauses.push('t.lga_id = $2');
      params.push(scopeLga);
    }
    const where = clauses.join(' AND ');
    const { rows } = await query<TripRow>(`${TRIP_SELECT} WHERE ${where}`, params);
    const trip = rows[0];
    if (!trip) throw ApiError.notFound('Trip not found');

    const collections = await query<CollectionRow>(
      `SELECT ce.id, ce.location_description, wc.code AS waste_category, mm.code AS measurement_method,
              ce.quantity_kg, ce.latitude, ce.longitude, ce.notes, ce.collected_at
       FROM collection_events ce
       JOIN waste_categories wc ON wc.id = ce.waste_category_id
       JOIN measurement_methods mm ON mm.id = ce.measurement_method_id
       WHERE ce.trip_id = $1 ORDER BY ce.collected_at ASC`,
      [tripId]
    );
    return { ...mapTrip(trip), collections: collections.rows.map(mapCollection) };
  },

  /** Create a trip. Guard: one active trip per vehicle. Idempotent on clientGeneratedId. */
  async start(user: AuthUser, input: {
    clientGeneratedId: string;
    vehicleId: string;
    routeId?: string | null;
    lgaId: string;
    sourceArea?: string | null;
  }, opts: TxOptions) {
    if (!input.clientGeneratedId) throw ApiError.validation('clientGeneratedId is required', 'clientGeneratedId');

    return withTransaction(async (client) => {
      const existing = await client.query<TripRow>(`${TRIP_SELECT} WHERE t.client_generated_id = $1`, [input.clientGeneratedId]);
      if (existing.rows[0]) return mapTrip(existing.rows[0]); // idempotent replay

      const vehicle = await client.query(`SELECT id, active FROM vehicles WHERE id = $1`, [input.vehicleId]);
      if (!vehicle.rows[0]) throw ApiError.validation('Vehicle not found', 'vehicleId');
      if (!vehicle.rows[0].active) throw ApiError.validation('Vehicle is not active', 'vehicleId');

      const lga = await client.query(`SELECT id, active FROM lgas WHERE id = $1`, [input.lgaId]);
      if (!lga.rows[0]) throw ApiError.validation('LGA not found', 'lgaId');
      if (!lga.rows[0].active) throw ApiError.validation('LGA is not active', 'lgaId');

      const active = await client.query(
        `SELECT id FROM trips WHERE vehicle_id = $1 AND status IN ('DRAFT','IN_PROGRESS') LIMIT 1`,
        [input.vehicleId]
      );
      if (active.rows[0]) throw ApiError.conflict('This vehicle already has an active trip.');

      const seqRow = await client.query<{ count: string }>(`SELECT count(*)::text AS count FROM trips`);
      const seq = Number(seqRow.rows[0]?.count ?? '0') + 1;

      const inserted = await client.query<TripRow>(
        `INSERT INTO trips (trip_code, route_id, vehicle_id, driver_id, lga_id, start_time, status, source_area, created_by, client_generated_id)
         VALUES ($1,$2,$3,$4,$5, now(), 'IN_PROGRESS', $6, $4, $7)
         RETURNING id, trip_code, vehicle_id, route_id, lga_id, source_area, status, start_time, end_time, client_generated_id, NULL::numeric AS declared_quantity_kg`,
        [ids.trip(seq), input.routeId ?? null, input.vehicleId, user.id, input.lgaId, input.sourceArea ?? null, input.clientGeneratedId]
      );

      await writeAudit({
        userId: user.id,
        entityType: 'trip',
        entityId: inserted.rows[0].id,
        action: 'TRIP_STARTED',
        newValues: { tripCode: inserted.rows[0].trip_code, vehicleId: input.vehicleId, lgaId: input.lgaId },
        ...opts
      }, client);

      return mapTrip(inserted.rows[0]);
    });
  },

  async addCollection(user: AuthUser, tripId: string, input: {
    clientGeneratedId: string;
    locationDescription: string;
    wasteCategory: string;
    measurementMethod: string;
    quantityKg: number;
    latitude?: number | null;
    longitude?: number | null;
    notes?: string | null;
  }, opts: TxOptions) {
    if (input.quantityKg < 0) throw ApiError.validation('Quantity must be zero or greater', 'quantityKg');

    return withTransaction(async (client) => {
      const dup = await client.query(
        `SELECT id FROM collection_events WHERE client_generated_id = $1`,
        [input.clientGeneratedId]
      );
      if (dup.rows[0]) {
        const existing = await client.query<CollectionRow>(
          `SELECT ce.id, ce.location_description, wc.code AS waste_category, mm.code AS measurement_method,
                  ce.quantity_kg, ce.latitude, ce.longitude, ce.notes, ce.collected_at
           FROM collection_events ce
           JOIN waste_categories wc ON wc.id = ce.waste_category_id
           JOIN measurement_methods mm ON mm.id = ce.measurement_method_id
           WHERE ce.id = $1`,
          [dup.rows[0].id]
        );
        return mapCollection(existing.rows[0]);
      }

      const trip = await client.query(`SELECT id FROM trips WHERE id = $1`, [tripId]);
      if (!trip.rows[0]) throw ApiError.notFound('Trip not found');

      const category = await client.query<{ id: string }>(`SELECT id FROM waste_categories WHERE code = $1`, [input.wasteCategory]);
      if (!category.rows[0]) throw ApiError.validation('Unknown waste category', 'wasteCategory');

      const method = await client.query<{ id: string }>(`SELECT id FROM measurement_methods WHERE code = $1`, [input.measurementMethod]);
      if (!method.rows[0]) throw ApiError.validation('Unknown measurement method', 'measurementMethod');

      const inserted = await client.query<CollectionRow>(
        `INSERT INTO collection_events
           (trip_id, location_description, latitude, longitude, waste_category_id, measurement_method_id,
            quantity_kg, collected_at, notes, created_by, client_generated_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7, now(), $8, $9, $10)
         RETURNING id,
                   location_description,
                   (SELECT code FROM waste_categories WHERE id = $5) AS waste_category,
                   (SELECT code FROM measurement_methods WHERE id = $6) AS measurement_method,
                   quantity_kg, latitude, longitude, notes, collected_at`,
        [
          tripId,
          input.locationDescription,
          input.latitude ?? null,
          input.longitude ?? null,
          category.rows[0].id,
          method.rows[0].id,
          input.quantityKg,
          input.notes ?? null,
          user.id,
          input.clientGeneratedId
        ]
      );

      await writeAudit({
        userId: user.id,
        entityType: 'collection',
        entityId: inserted.rows[0].id,
        action: 'COLLECTION_RECORDED',
        newValues: { tripId, quantityKg: input.quantityKg, wasteCategory: input.wasteCategory, measurementMethod: input.measurementMethod },
        ...opts
      }, client);

      return mapCollection(inserted.rows[0]);
    });
  },

  /** Complete a trip and generate its Load ID + QR payload (the Load ID itself). */
  async complete(user: AuthUser, tripId: string, opts: TxOptions) {
    return withTransaction(async (client) => {
      const trip = await client.query<TripRow>(`${TRIP_SELECT} WHERE t.id = $1 FOR UPDATE`, [tripId]);
      const row = trip.rows[0];
      if (!row) throw ApiError.notFound('Trip not found');
      if (row.status === 'SUBMITTED') {
        const load = await client.query(
          `SELECT id, load_code, declared_quantity_kg, status FROM loads WHERE trip_id = $1 LIMIT 1`,
          [tripId]
        );
        if (load.rows[0]) return load.rows[0]; // idempotent
      }
      if (row.start_time === null) throw ApiError.validation('Trip has no start time');

      const totals = await client.query<{ total: string | null; category: string | null; method: string | null }>(
        `SELECT COALESCE(SUM(ce.quantity_kg),0)::text AS total,
                (SELECT wc.code FROM collection_events c2
                   JOIN waste_categories wc ON wc.id = c2.waste_category_id
                   WHERE c2.trip_id = $1
                   GROUP BY wc.code ORDER BY SUM(c2.quantity_kg) DESC LIMIT 1) AS category,
                (SELECT mm.code FROM collection_events c3
                   JOIN measurement_methods mm ON mm.id = c3.measurement_method_id
                   WHERE c3.trip_id = $1 LIMIT 1) AS method
         FROM collection_events ce WHERE ce.trip_id = $1`,
        [tripId]
      );
      const total = Number(totals.rows[0]?.total ?? '0');
      if (total <= 0) throw ApiError.validation('Record at least one collection before completing.');

      const categoryCode = totals.rows[0]?.category ?? 'UNKNOWN';
      const categoryId = await client.query<{ id: string }>(`SELECT id FROM waste_categories WHERE code = $1`, [categoryCode]);

      const seqRow = await client.query<{ count: string }>(`SELECT count(*)::text AS count FROM loads`);
      const seq = Number(seqRow.rows[0]?.count ?? '0') + 1;
      const loadCode = ids.load(seq);

      const inserted = await client.query(
        `INSERT INTO loads (load_code, trip_id, declared_quantity_kg, waste_category_id, destination_facility_id, status)
         VALUES ($1,$2,$3,$4,(SELECT id FROM facilities WHERE active LIMIT 1),'SUBMITTED')
         RETURNING id, load_code, declared_quantity_kg, status`,
        [loadCode, tripId, total, categoryId.rows[0]?.id ?? null]
      );

      await client.query(`UPDATE trips SET status = 'SUBMITTED', end_time = now(), updated_at = now() WHERE id = $1`, [tripId]);

      await writeAudit({
        userId: user.id,
        entityType: 'load',
        entityId: inserted.rows[0].id,
        action: 'LOAD_CREATED',
        newValues: { loadCode, tripId, declaredQuantityKg: total },
        ...opts
      }, client);

      return { ...inserted.rows[0], qrPayload: loadCode };
    });
  }
};
