import { useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { DataTable, Notice, Skeleton } from '../components/ui';
import { api } from '../api/client';
import { useApiData } from '../api/useApiData';
import type { ReportResult } from '../api/types';

const TYPES = [
  { id: 'daily', label: 'Daily Waste Report' },
  { id: 'monthly', label: 'Monthly Waste Report' },
  { id: 'vehicles', label: 'Vehicle Report' },
  { id: 'lgas', label: 'LGA Report' },
  { id: 'processing', label: 'Processing Report' },
  { id: 'transfers', label: 'Transfer Report' },
  { id: 'exceptions', label: 'Exception Report' },
  { id: 'data-quality', label: 'Data Quality Report' },
  { id: 'traceability', label: 'Load Traceability Report' }
];

export default function ReportsPage() {
  const [type, setType] = useState('daily');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [lgaId, setLgaId] = useState('');
  const [facilityId, setFacilityId] = useState('');

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    if (lgaId) p.set('lgaId', lgaId);
    if (facilityId) p.set('facilityId', facilityId);
    return p.toString();
  }, [from, to, lgaId, facilityId]);

  const report = useApiData<ReportResult>(
    () => api.get(`/reports/${type}${query ? `?${query}` : ''}`),
    { title: TYPES.find((t) => t.id === type)?.label ?? 'Report', periodLabel: 'Reporting Period', generatedAt: new Date().toISOString(), filters: {}, rowCount: 0, rows: [] },
    [type, query]
  );

  const result = report.data;
  const columns = result && result.rows.length > 0 ? Object.keys(result.rows[0]) : [];
  const csvHref = `${api.base}/reports/${type}${query ? `?${query}&format=csv` : '?format=csv'}`;

  return (
    <Layout title="Reports">
      <h1 className="page-title">Reports</h1>
      <p className="page-sub">Every figure is traceable back to its operational records.</p>

      <div className="toolbar">
        <div className="field">
          <label>Report</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div className="field"><label>From</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="field"><label>To</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div className="field">
          <label>LGA</label>
          <select value={lgaId} onChange={(e) => setLgaId(e.target.value)}>
            <option value="">All</option>
            <option value="11111111-1111-1111-1111-111111111101">Galle Municipal Council</option>
            <option value="11111111-1111-1111-1111-111111111102">Hikkaduwa Urban Council</option>
          </select>
        </div>
        <div className="field">
          <label>Facility</label>
          <select value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
            <option value="">All</option>
            <option value="22222222-2222-2222-2222-222222222201">Monroviawatta</option>
          </select>
        </div>
        <a href={csvHref} target="_blank" rel="noreferrer">
          <button className="secondary">Export CSV</button>
        </a>
      </div>

      {report.demo ? <Notice kind="demo">DEMO DATA — export requires a running backend.</Notice> : null}
      {report.error ? <Notice kind="error">{report.error}</Notice> : null}

      <div className="card">
        <h3 className="card-title">{result?.title ?? 'Report'}</h3>
        {result ? (
          <p className="muted" style={{ fontSize: 12 }}>
            Generated {new Date(result.generatedAt).toLocaleString()} · {result.rowCount} row(s)
            {Object.keys(result.filters).filter((k) => (result.filters as Record<string, unknown>)[k]).length > 0
              ? ` · filters: ${Object.entries(result.filters)
                  .filter(([, v]) => v)
                  .map(([k, v]) => `${k}=${String(v)}`)
                  .join(', ')}`
              : ''}
          </p>
        ) : null}

        {report.loading ? (
          <Skeleton rows={6} />
        ) : result && result.rows.length > 0 ? (
          <DataTable
            exportName={`wasteflow-${type}`}
            rows={result.rows as unknown as Array<Record<string, unknown>>}
            columns={columns.map((c) => ({ key: c, header: c.replace(/_/g, ' ') }))}
          />
        ) : (
          <Notice kind="demo">No rows returned for the selected filters (or backend unavailable).</Notice>
        )}
      </div>
    </Layout>
  );
}
