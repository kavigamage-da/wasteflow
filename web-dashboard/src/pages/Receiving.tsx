import { useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { DataTable, Notice, Skeleton, StatusBadge, formatKg } from '../components/ui';
import { api } from '../api/client';
import { useApiData } from '../api/useApiData';
import { demoLoads } from '../demo/demoData';
import type { Load } from '../api/types';

const METHODS = ['WEIGHBRIDGE', 'SCALE', 'MANUAL_ESTIMATE', 'VEHICLE_CAPACITY_ESTIMATE', 'OTHER', 'UNKNOWN'];

export default function ReceivingPage() {
  const loads = useApiData<Load[]>(() => api.get('/loads'), demoLoads);
  const [selected, setSelected] = useState<Load | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queue = useMemo(
    () => ((loads.data ?? demoLoads) as unknown as Load[]).filter((l) => l.receivedQuantityKg === null),
    [loads.data]
  );

  return (
    <Layout title="Receiving">
      <h1 className="page-title">Receiving</h1>
      <p className="page-sub">Scan or search a Load ID, then record the received quantity and measurement method.</p>

      {message ? <Notice kind="info">{message}</Notice> : null}
      {error ? <Notice kind="error">{error}</Notice> : null}

      <div className="card">
        <h3 className="card-title">Incoming Loads</h3>
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
              { key: 'vehicleLabel', header: 'Vehicle' },
              { key: 'lgaName', header: 'Source' },
              { key: 'wasteCategory', header: 'Category' },
              { key: 'declaredQuantityKg', header: 'Declared', align: 'right', render: (r) => formatKg(r.declaredQuantityKg) },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> }
            ]}
          />
        )}
      </div>

      {selected ? (
        <ReceiveForm
          load={selected}
          onClose={() => setSelected(null)}
          onReceived={(msg) => {
            setMessage(msg);
            setSelected(null);
            loads.reload();
          }}
          onError={(msg) => setError(msg)}
        />
      ) : null}
    </Layout>
  );
}

function ReceiveForm({
  load,
  onClose,
  onReceived,
  onError
}: {
  load: Load;
  onClose: () => void;
  onReceived: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [quantity, setQuantity] = useState(String(load.declaredQuantityKg));
  const [method, setMethod] = useState('WEIGHBRIDGE');
  const [condition, setCondition] = useState('Normal');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const qtyValue = Number(quantity);
  const diff = Number.isFinite(qtyValue) ? qtyValue - load.declaredQuantityKg : 0;
  const hasDiscrepancy = Math.abs(diff) > 0.0001;

  const submit = async () => {
    if (!Number.isFinite(qtyValue) || qtyValue < 0) {
      onError('Enter a valid received quantity.');
      return;
    }
    if (hasDiscrepancy && reason.trim() === '') {
      onError('A reason is required when declared and received quantities differ.');
      return;
    }
    setBusy(true);
    try {
      await api.post(`/loads/${encodeURIComponent(load.loadCode)}/receive`, {
        receivedQuantityKg: qtyValue,
        measurementMethod: method,
        condition,
        discrepancyReason: hasDiscrepancy ? reason : undefined
      });
      onReceived(`Load ${load.loadCode} received.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Receiving failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">Receive {load.loadCode}</h3>
      <p className="muted">
        Vehicle {load.vehicleLabel} · Source {load.lgaName} · Declared {formatKg(load.declaredQuantityKg)}
      </p>

      <div className="toolbar">
        <div className="field">
          <label>Received Quantity (kg) *</label>
          <input value={quantity} onChange={(e) => setQuantity(e.target.value)} inputMode="decimal" />
        </div>
        <div className="field">
          <label>Measurement Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => (
              <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Condition</label>
          <input value={condition} onChange={(e) => setCondition(e.target.value)} />
        </div>
      </div>

      {hasDiscrepancy ? (
        <div className="notice error">
          <strong>Quantity Difference.</strong> Declared {load.declaredQuantityKg} kg · Received {qtyValue} kg ·
          Difference {diff > 0 ? '+' : ''}{diff} kg. A reason is required. The original declared value is never overwritten.
          <div className="field" style={{ marginTop: 10, marginBottom: 0, maxWidth: 460 }}>
            <label>Reason for discrepancy *</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. moisture loss in transit" />
          </div>
        </div>
      ) : null}

      <div className="toolbar" style={{ marginBottom: 0 }}>
        <button onClick={submit} disabled={busy}>
          {busy ? 'SAVING…' : hasDiscrepancy ? 'CONFIRM WITH DISCREPANCY' : 'CONFIRM RECEIVING'}
        </button>
        <button className="secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
