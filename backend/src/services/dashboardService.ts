import { query } from '../db/pool';
import { config } from '../config';

interface Filters {
  from?: string;
  to?: string;
  lgaId?: string;
  facilityId?: string;
}

function buildLoadFilter(f: Filters, alias = 'l'): { where: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    clauses.push(sql.replace('?', `$${params.length}`));
  };
  if (f.from) add(`${alias}.created_at >= ?`, f.from);
  if (f.to) add(`${alias}.created_at <= ?`, f.to);
  if (f.lgaId) add('t.lga_id = ?', f.lgaId);
  if (f.facilityId) add(`${alias}.destination_facility_id = ?`, f.facilityId);
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

export const dashboardService = {
  async summary(f: Filters) {
    const { where, params } = buildLoadFilter(f);
    const { rows } = await query<{
      total_loads: string;
      recorded: string;
      received: string;
      processed: string;
      transferred: string;
    }>(
      `SELECT
         count(*)::text AS total_loads,
         COALESCE(SUM(l.declared_quantity_kg),0)::text AS recorded,
         COALESCE(SUM(r.received_quantity_kg),0)::text AS received,
         COALESCE(SUM(CASE WHEN p.incomplete = false THEN COALESCE(p.compost_kg,0)+COALESCE(p.landfill_kg,0)+COALESCE(p.transfer_kg,0)+COALESCE(p.other_kg,0) ELSE 0 END),0)::text AS processed,
         COALESCE(SUM(COALESCE(p.transfer_kg,0)),0)::text AS transferred
       FROM loads l
       LEFT JOIN trips t ON t.id = l.trip_id
       LEFT JOIN receipts r ON r.load_id = l.id
       LEFT JOIN processing_records p ON p.load_id = l.id
       ${where}`,
      params
    );
    const exceptions = await query<{ count: string }>(`SELECT count(*)::text AS count FROM exceptions WHERE status <> 'RESOLVED'`);
    const row = rows[0];
    return {
      totalLoadsToday: Number(row?.total_loads ?? 0),
      totalRecordedKg: Number(row?.recorded ?? 0),
      totalReceivedKg: Number(row?.received ?? 0),
      totalProcessedKg: Number(row?.processed ?? 0),
      totalTransferredKg: Number(row?.transferred ?? 0),
      openExceptions: Number(exceptions.rows[0]?.count ?? 0)
    };
  },

  async byLga(f: Filters) {
    const { where, params } = buildLoadFilter(f);
    const { rows } = await query(
      `SELECT COALESCE(lg.name,'Unknown') AS lga_name,
              COALESCE(SUM(l.declared_quantity_kg),0)::float8 AS recorded_kg,
              count(*)::int AS loads
       FROM loads l
       LEFT JOIN trips t ON t.id = l.trip_id
       LEFT JOIN lgas lg ON lg.id = t.lga_id
       ${where}
       GROUP BY lg.name ORDER BY recorded_kg DESC`,
      params
    );
    return rows;
  },

  async byCategory(f: Filters) {
    const { where, params } = buildLoadFilter(f);
    const { rows } = await query(
      `SELECT COALESCE(wc.code,'UNKNOWN') AS category,
              COALESCE(SUM(l.declared_quantity_kg),0)::float8 AS recorded_kg,
              count(*)::int AS loads
       FROM loads l
       LEFT JOIN trips t ON t.id = l.trip_id
       LEFT JOIN waste_categories wc ON wc.id = l.waste_category_id
       ${where}
       GROUP BY wc.code ORDER BY recorded_kg DESC`,
      params
    );
    return rows;
  },

  async trends(f: Filters) {
    const { where, params } = buildLoadFilter(f);
    const { rows } = await query(
      `SELECT to_char(date_trunc('day', l.created_at), 'YYYY-MM-DD') AS day,
              COALESCE(SUM(l.declared_quantity_kg),0)::float8 AS recorded_kg,
              COALESCE(SUM(r.received_quantity_kg),0)::float8 AS received_kg
       FROM loads l
       LEFT JOIN trips t ON t.id = l.trip_id
       LEFT JOIN receipts r ON r.load_id = l.id
       ${where}
       GROUP BY 1 ORDER BY 1`,
      params
    );
    return rows;
  },

  /** Processing outcome split (stacked bar). */
  async outcome(f: Filters) {
    const { where, params } = buildLoadFilter(f);
    const { rows } = await query(
      `SELECT COALESCE(SUM(p.compost_kg),0)::float8 AS compost_kg,
              COALESCE(SUM(p.landfill_kg),0)::float8 AS landfill_kg,
              COALESCE(SUM(p.transfer_kg),0)::float8 AS transfer_kg,
              COALESCE(SUM(p.other_kg),0)::float8 AS other_kg
       FROM loads l
       LEFT JOIN trips t ON t.id = l.trip_id
       LEFT JOIN processing_records p ON p.load_id = l.id
       ${where}`,
      params
    );
    return rows[0] ?? { compost_kg: 0, landfill_kg: 0, transfer_kg: 0, other_kg: 0 };
  },

  async exceptionsSummary() {
    const { rows } = await query(
      `SELECT severity, status, count(*)::int AS count FROM exceptions GROUP BY severity, status`
    );
    const open = rows.filter((r) => r.status !== 'RESOLVED').reduce((a, r) => a + (r.count as number), 0);
    const critical = rows.filter((r) => r.severity === 'CRITICAL' && r.status !== 'RESOLVED').reduce((a, r) => a + (r.count as number), 0);
    const warning = rows.filter((r) => r.severity === 'WARNING' && r.status !== 'RESOLVED').reduce((a, r) => a + (r.count as number), 0);
    const resolved = rows.filter((r) => r.status === 'RESOLVED').reduce((a, r) => a + (r.count as number), 0);
    return { critical, warning, open, resolved, breakdown: rows };
  },

  /** Reference capacity vs recorded. Capacity is a configurable administrative value, not a live limit. */
  async capacity() {
    const { rows } = await query<{ recorded: string }>(
      `SELECT COALESCE(SUM(declared_quantity_kg),0)::text AS recorded FROM loads WHERE created_at >= date_trunc('day', now())`
    );
    const recordedMt = Number(rows[0]?.recorded ?? 0) / 1000;
    const capacity = config.referenceCapacityMtDay;
    return {
      referenceCapacityMtDay: capacity,
      recordedTodayMt: Number(recordedMt.toFixed(2)),
      referenceUtilisationPct: capacity > 0 ? Number(((recordedMt / capacity) * 100).toFixed(1)) : 0,
      label: 'Reference capacity — configurable administrative value'
    };
  },

  /** Declared vs received vs allocated reconciliation. */
  async reconciliation(f: Filters) {
    const { where, params } = buildLoadFilter(f);
    const { rows } = await query(
      `SELECT COALESCE(lg.name,'Unknown') AS lga_name,
              COALESCE(SUM(l.declared_quantity_kg),0)::float8 AS declared_kg,
              COALESCE(SUM(r.received_quantity_kg),0)::float8 AS received_kg,
              COALESCE(SUM(COALESCE(p.compost_kg,0)+COALESCE(p.landfill_kg,0)+COALESCE(p.transfer_kg,0)+COALESCE(p.other_kg,0)),0)::float8 AS allocated_kg
       FROM loads l
       LEFT JOIN trips t ON t.id = l.trip_id
       LEFT JOIN lgas lg ON lg.id = t.lga_id
       LEFT JOIN receipts r ON r.load_id = l.id
       LEFT JOIN processing_records p ON p.load_id = l.id
       ${where}
       GROUP BY lg.name ORDER BY declared_kg DESC`,
      params
    );
    return rows.map((r) => {
      const row = r as { declared_kg: number; received_kg: number; allocated_kg: number; lga_name: string };
      return {
        ...row,
        declaredMinusReceived: Number((row.received_kg - row.declared_kg).toFixed(2)),
        receivedMinusAllocated: Number((row.received_kg - row.allocated_kg).toFixed(2))
      };
    });
  }
};
