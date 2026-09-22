import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { DataTable, Skeleton, StatusBadge, formatDateTime, formatKg } from '../components/ui';
import { api } from '../api/client';
import { useApiData } from '../api/useApiData';
import { demoLoads } from '../demo/demoData';
import type { Load } from '../api/types';

export default function LoadsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [lgaId, setLgaId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [q, setQ] = useState('');

  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (lgaId) params.set('lgaId', lgaId);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();

  const loads = useApiData<Load[]>(
    () => (q ? api.get(`/loads/search?q=${encodeURIComponent(q)}`) : api.get(`/loads${query ? `?${query}` : ''}`)),
    demoLoads,
    [query, q]
  );

  const rows = (loads.data ?? demoLoads) as unknown as Load[];

  return (
    <Layout title="Loads">
      <h1 className="page-title">Loads</h1>
      <p className="page-sub">Every load carries a unique identity from collection to final outcome.</p>

      <div className="toolbar">
        <div className="field">
          <label>Search</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Load ID / vehicle / LGA / trip" />
        </div>
        <div className="field">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {['SUBMITTED', 'RECEIVED', 'PROCESSING', 'COMPLETED', 'EXCEPTION'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>LGA</label>
          <select value={lgaId} onChange={(e) => setLgaId(e.target.value)}>
            <option value="">All</option>
            <option value="11111111-1111-1111-1111-111111111101">Galle Municipal Council</option>
            <option value="11111111-1111-1111-1111-111111111102">Hikkaduwa Urban Council</option>
          </select>
        </div>
        <div className="field">
          <label>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button
          className="secondary"
          onClick={() => {
            setStatus('');
            setLgaId('');
            setFrom('');
            setTo('');
            setQ('');
          }}
        >
          Clear filters
        </button>
      </div>

      <div className="card">
        {loads.loading ? (
          <Skeleton rows={6} />
        ) : (
          <DataTable<Load>
            exportName="wasteflow-loads"
            rows={rows}
            onRowClick={(row) => navigate(`/traceability?load=${row.loadCode}`)}
            columns={[
              { key: 'loadCode', header: 'Load ID' },
              { key: 'vehicleLabel', header: 'Vehicle' },
              { key: 'lgaName', header: 'LGA' },
              { key: 'wasteCategory', header: 'Category' },
              { key: 'measurementMethod', header: 'Method' },
              { key: 'declaredQuantityKg', header: 'Declared', align: 'right', render: (r) => formatKg(r.declaredQuantityKg) },
              { key: 'receivedQuantityKg', header: 'Received', align: 'right', render: (r) => formatKg(r.receivedQuantityKg) },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'updatedAt', header: 'Updated', render: (r) => formatDateTime(r.updatedAt) }
            ]}
          />
        )}
      </div>
    </Layout>
  );
}
