import { useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { DataTable, Notice, Skeleton, StatusBadge, formatKg } from '../components/ui';
import { api } from '../api/client';
import { useApiData } from '../api/useApiData';
import { demoLoads } from '../demo/demoData';
import type { Load } from '../api/types';

export default function ProcessingPage() {
  const loads = useApiData<Load[]>(() => api.get('/loads'), demoLoads);
  const [selected, setSelected] = useState<Load | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queue = useMemo(
    () => ((loads.data ?? demoLoads) as unknown as Load[]).filter((l) => l.receivedQuantityKg !== null && l.status !== 'COMPLETED'),
    [loads.data]
  );

  return (
    <Layout title="Processing">
      <h1 className="page-title">Processing</h1>
      <p className="page-sub">
        Allocation must equal the received quantity unless the record is explicitly marked incomplete.
      </p>

      {message ? <Notice kind="info">{message}</Notice> : null}
      {error ? <Notice kind="error">{error}</Notice> : null}

      <div className="card">
        <h3 className="card-title">Received Loads Awaiting Processing</h3>
        {loads.loading ? (
          <Skeleton rows={4} />
        ) : (
          <DataTable<Load>
            pageSize={8}
            rows={queue}
            onRowClick={(row) => {
              setSelected(row);
              setMessage(null);
              setError(null);
            }}
            columns={[
              { key: 'loadCode', header: 'Load ID' },
              { key: 'lgaName', header: 'Source' },
              { key: 'wasteCategory', header: 'Category' },
              { key: 'receivedQuantityKg', header: 'Received', align: 'right', render: (r) => formatKg(r.receivedQuantityKg) },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> }
            ]}
          />
        )}
      </div>

      {selected ? (
        <AllocationForm
          load={selected}
          onClose={() => setSelected(null)}
          onSaved={(msg) => {
            setMessage(msg);
            setSelected(null);
            loads.reload();
          }}
          onError={setError}
        />
      ) : null}
    </Layout>
  );
}

function AllocationForm({
  load,
  onClose,
  onSaved,
  onError
}: {
  load: Load;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const received = load.receivedQuantityKg ?? load.declaredQuantityKg;
  const [compost, setCompost] = useState(String(load.compostKg ?? ''));
  const [landfill, setLandfill] = useState(String(load.landfillKg ?? ''));
  const [transfer, setTransfer] = useState(String(load.transferKg ?? ''));
  const [other, setOther] = useState(String(load.otherKg ?? ''));
  const [incomplete, setIncomplete] = useState(false);
  const [busy, setBusy] = useState(false);

  const nums = [compost, landfill, transfer, other].map((v) => (v === '' ? 0 : Number(v)));
  const allocated = nums.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
  const remaining = received - allocated;

  const submit = async () => {
    if (nums.some((n) => !Number.isFinite(n) || n < 0)) {
      onError('Allocations cannot be negative.');
      return;
    }
    if (!incomplete && Math.abs(remaining) > 0.5) {
      onError(`Allocation (${allocated} kg) must equal received quantity (${received} kg), or mark the record incomplete.`);
      return;
    }
    if (allocated > received + 0.5) {
      onError('Allocation cannot exceed the received quantity.');
      return;
    }
    setBusy(true);
    try {
      await api.post(`/loads/${encodeURIComponent(load.loadCode)}/process`, {
        compostKg: nums[0],
        landfillKg: nums[1],
        transferKg: nums[2],
        otherKg: nums[3],
        incomplete
      });
      onSaved(`Processing saved for ${load.loadCode}.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Processing failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">Process {load.loadCode}</h3>
      <p className="muted">Received {formatKg(received)}</p>

      <div className="toolbar">
        <div className="field"><label>Compost Input (kg)</label><input value={compost} onChange={(e) => setCompost(e.target.value)} inputMode="decimal" /></div>
        <div className="field"><label>Landfill (kg)</label><input value={landfill} onChange={(e) => setLandfill(e.target.value)} inputMode="decimal" /></div>
        <div className="field"><label>Transfer (kg)</label><input value={transfer} onChange={(e) => setTransfer(e.target.value)} inputMode="decimal" /></div>
        <div className="field"><label>Other (kg)</label><input value={other} onChange={(e) => setOther(e.target.value)} inputMode="decimal" /></div>
      </div>

      <p>
        Allocated <strong>{allocated} kg</strong> · Remaining{' '}
        <strong style={{ color: remaining === 0 ? 'var(--green)' : 'var(--red)' }}>{remaining} kg</strong>
      </p>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input type="checkbox" checked={incomplete} onChange={(e) => setIncomplete(e.target.checked)} style={{ width: 'auto' }} />
        Mark record incomplete (reconciliation will flag it)
      </label>

      <div className="toolbar" style={{ marginBottom: 0 }}>
        <button onClick={submit} disabled={busy}>{busy ? 'SAVING…' : 'SAVE PROCESSING'}</button>
        <button className="secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
