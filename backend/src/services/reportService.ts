import { query } from '../db/pool';
import { ApiError } from '../http/envelope';

export type ReportType =
  | 'daily'
  | 'monthly'
  | 'vehicles'
  | 'lgas'
  | 'processing'
  | 'transfers'
  | 'exceptions'
  | 'data-quality'
  | 'traceability';

interface ReportFilters {
  from?: string;
  to?: string;
  lgaId?: string;
  facilityId?: string;
}

/** Converts an array of flat objects into CSV text. */
export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(','));
  return lines.join('\n');
}

function filterSql(f: ReportFilters, dateColumn = 'l.created_at'): { where: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    clauses.push(sql.replace('?', `$${params.length}`));
  };
  if (f.from) add(`${dateColumn} >= ?`, f.from);
  if (f.to) add(`${dateColumn} <= ?`, f.to);
  if (f.lgaId) add('t.lga_id = ?', f.lgaId);
  if (f.facilityId) add('l.destination_facility_id = ?', f.facilityId);
  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

export const reportService = {
  async generate(type: ReportType, f: ReportFilters): Promise<Array<Record<string, unknown>>> {
    const { where, params } = filterSql(f);
    switch (type) {
      case 'daily':
      case 'monthly': {
        const bucket = type === 'daily' ? 'day' : 'month';
        const { rows } = await query(
          `SELECT to_char(date_trunc('${bucket}', l.created_at), 'YYYY-MM-DD') AS period,
                  count(*)::int AS loads,
                  COALESCE(SUM(l.declared_quantity_kg),0)::float8 AS recorded_kg,
                  COALESCE(SUM(r.received_quantity_kg),0)::float8 AS received_kg,
                  COALESCE(SUM(p.compost_kg),0)::float8 AS compost_kg,
                  COALESCE(SUM(p.landfill_kg),0)::float8 AS landfill_kg,
                  COALESCE(SUM(p.transfer_kg),0)::float8 AS transfer_kg
           FROM loads l
           LEFT JOIN trips t ON t.id = l.trip_id
           LEFT JOIN receipts r ON r.load_id = l.id
           LEFT JOIN processing_records p ON p.load_id = l.id
           ${where}
           GROUP BY 1 ORDER BY 1`,
          params
        );
        return rows;
      }
      case 'vehicles': {
        const { rows } = await query(
          `SELECT v.registration_number AS vehicle,
                  count(DISTINCT t.id)::int AS trips,
                  COALESCE(SUM(l.declared_quantity_kg),0)::float8 AS recorded_kg,
                  count(DISTINCT CASE WHEN l.status = 'EXCEPTION' THEN l.id END)::int AS exceptions
           FROM loads l
           LEFT JOIN trips t ON t.id = l.trip_id
           LEFT JOIN vehicles v ON v.id = t.vehicle_id
           ${where}
           GROUP BY v.registration_number ORDER BY recorded_kg DESC`,
          params
        );
        return rows;
      }
      case 'lgas': {
        const { rows } = await query(
          `SELECT COALESCE(lg.name,'Unknown') AS lga,
                  count(*)::int AS loads,
                  COALESCE(SUM(l.declared_quantity_kg),0)::float8 AS recorded_kg,
                  COALESCE(SUM(r.received_quantity_kg),0)::float8 AS received_kg
           FROM loads l
           LEFT JOIN trips t ON t.id = l.trip_id
           LEFT JOIN lgas lg ON lg.id = t.lga_id
           LEFT JOIN receipts r ON r.load_id = l.id
           ${where}
           GROUP BY lg.name ORDER BY recorded_kg DESC`,
          params
        );
        return rows;
      }
      case 'processing': {
        const { rows } = await query(
          `SELECT l.load_code, p.compost_kg, p.landfill_kg, p.transfer_kg, p.other_kg, p.incomplete, p.processed_at
           FROM loads l LEFT JOIN trips t ON t.id = l.trip_id
           JOIN processing_records p ON p.load_id = l.id
           ${where} ORDER BY p.processed_at DESC LIMIT 500`,
          params
        );
        return rows;
      }
      case 'transfers': {
        const { rows } = await query(
          `SELECT shipment_code, destination_name, container_number, quantity_kg, dispatch_time, status, received_time
           FROM transfer_shipments ORDER BY created_at DESC LIMIT 500`
        );
        return rows;
      }
      case 'exceptions': {
        const { rows } = await query(
          `SELECT entity_type, entity_id, exception_type, severity, status, description, created_at
           FROM exceptions ORDER BY created_at DESC LIMIT 500`
        );
        return rows;
      }
      case 'data-quality': {
        const { rows } = await query(
          `SELECT
             count(*)::int AS total_loads,
             count(*) FILTER (WHERE l.declared_quantity_kg IS NULL OR l.declared_quantity_kg = 0)::int AS missing_weight,
             count(*) FILTER (WHERE l.destination_facility_id IS NULL)::int AS missing_destination,
             count(*) FILTER (WHERE r.id IS NULL)::int AS missing_receipt,
             count(*) FILTER (WHERE p.id IS NULL)::int AS missing_processing
           FROM loads l
           LEFT JOIN trips t ON t.id = l.trip_id
           LEFT JOIN receipts r ON r.load_id = l.id
           LEFT JOIN processing_records p ON p.load_id = l.id
           ${where}`,
          params
        );
        return rows;
      }
      case 'traceability': {
        const { rows } = await query(
          `SELECT l.load_code, t.trip_code, v.registration_number AS vehicle, lg.name AS lga,
                  l.declared_quantity_kg, r.received_quantity_kg, l.status,
                  COALESCE(p.compost_kg,0) AS compost_kg, COALESCE(p.landfill_kg,0) AS landfill_kg,
                  COALESCE(p.transfer_kg,0) AS transfer_kg
           FROM loads l
           LEFT JOIN trips t ON t.id = l.trip_id
           LEFT JOIN vehicles v ON v.id = t.vehicle_id
           LEFT JOIN lgas lg ON lg.id = t.lga_id
           LEFT JOIN receipts r ON r.load_id = l.id
           LEFT JOIN processing_records p ON p.load_id = l.id
           ${where} ORDER BY l.created_at DESC LIMIT 500`,
          params
        );
        return rows;
      }
      default:
        throw ApiError.validation(`Unknown report type: ${type}`);
    }
  },

  describe(type: ReportType): { title: string; periodLabel: string } {
    const titles: Record<ReportType, string> = {
      daily: 'Daily Waste Report',
      monthly: 'Monthly Waste Report',
      vehicles: 'Vehicle Report',
      lgas: 'LGA Report',
      processing: 'Processing Report',
      transfers: 'Transfer Report',
      exceptions: 'Exception Report',
      'data-quality': 'Data Quality Report',
      traceability: 'Load Traceability Report'
    };
    return { title: titles[type] ?? 'Report', periodLabel: 'Reporting Period' };
  }
};
