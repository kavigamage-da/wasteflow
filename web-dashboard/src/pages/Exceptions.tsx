import { useState } from 'react';
import { Layout } from '../components/Layout';
import { DataTable, Notice, Skeleton, StatusBadge, formatDateTime } from '../components/ui';
import { api } from '../api/client';
import { useApiData } from '../api/useApiData';
import { demoExceptions } from '../demo/demoData';
import type { ExceptionsSummary, ExceptionRow } from '../api/types';

export default function ExceptionsPage() {
  const exceptions = useApiData<ExceptionRow[]>(() => api.get('/exceptions'), demoExceptions);
  const summary = useApiData<ExceptionsSummary>(() => api.get('/exceptions/summary'), {
    critical: 1,
    warning: 2,
    open: 2,
    resolved: 1
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ExceptionRow | null>(null);

  const rows = (exceptions.data ?? demoExceptions) as unknown as ExceptionRow[];
  const s = summary.data ?? { critical: 1, warning: 2, open: 2, resolved: 1 };

  return (
    <Layout title="Exceptions">
      <h1 className="page-title">Exception Register</h1>
      <p className="page-sub">Discrepancies, gaps and transfer confirmations that need attention.</p>

      {message ? <Notice kind="info">{message}</Notice> : null}
      {error ? <Notice kind="error">{error}</Notice> : null}

      <div className="kpi-grid">
        <div className="kpi danger"><div className="value">{s.critical}</div><div className="label">Critical</div></div>
        <div className="kpi warn"><div className="value">{s.warning}</div><div className="label">Warning</div></div>
        <div className="kpi"><div className="value">{s.open}</div><div className="label">Open</div></div>
        <div className="kpi"><div className="value">{s.resolved}</div><div className="label">Resolved</div></div>
      </div>

      {selected ? (
        <ResolveForm
          exception={selected}
          onClose={() => setSelected(null)}
          onSaved={(msg) => {
            setMessage(msg);
            setSelected(null);
            exceptions.reload();
            summary.reload();
          }}
          onError={setError}
        />
      ) : null}

      <div className="card">
        <h3 className="card-title">Exceptions</h3>
        {exceptions.loading ? (
          <Skeleton rows={4} />
        ) : (
          <DataTable<ExceptionRow>
            exportName="wasteflow-exceptions"
            rows={rows}
            onRowClick={(row) => setSelected(row)}
            columns={[
              { key: 'exception_type', header: 'Type' },
              { key: 'severity', header: 'Severity' },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'description', header: 'Description' },
              { key: 'created_at', header: 'Raised', render: (r) => formatDateTime(r.created_at) }
            ]}
          />
        )}
      </div>
    </Layout>
  );
}

function ResolveForm({
  exception,
  onClose,
  onSaved,
  onError
}: {
  exception: ExceptionRow;
  onClose: () => void;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [status, setStatus] = useState(exception.status);
  const [resolution, setResolution] = useState(exception.resolution ?? '');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (status === 'RESOLVED' && resolution.trim() === '') {
      onError('A resolution note is required to resolve an exception.');
      return;
    }
    setBusy(true);
    try {
      await api.patch(`/exceptions/${exception.id}`, { status, resolution: resolution || null });
      onSaved('Exception updated.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">Exception — {exception.exception_type}</h3>
      <p className="muted">{exception.description}</p>
      <div className="toolbar">
        <div className="field">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {['OPEN', 'IN_REVIEW', 'RESOLVED'].map((st) => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1, minWidth: 260 }}>
          <label>Resolution / investigation</label>
          <input value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="e.g. spillage confirmed at gate; quantity corrected via approval" />
        </div>
      </div>
      <div className="toolbar" style={{ marginBottom: 0 }}>
        <button onClick={submit} disabled={busy}>{busy ? 'SAVING…' : 'SAVE'}</button>
        <button className="secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
