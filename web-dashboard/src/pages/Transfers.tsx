import { useState } from 'react';
import { Layout } from '../components/Layout';
import { DataTable, Notice, Skeleton, StatusBadge, formatDateTime } from '../components/ui';
import { api } from '../api/client';
import { useApiData } from '../api/useApiData';
import { demoTransfers } from '../demo/demoData';
import type { Transfer } from '../api/types';

export default function TransfersPage() {
  const transfers = useApiData<Transfer[]>(() => api.get('/transfers'), demoTransfers);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [receiving, setReceiving] = useState<Transfer | null>(null);

  const rows = (transfers.data ?? demoTransfers) as unknown as Transfer[];

  return (
    <Layout title="Transfers">
      <h1 className="page-title">Transfer Shipments</h1>
      <p className="page-sub">
        Without destination confirmation a shipment remains AWAITING CONFIRMATION — final delivery is never assumed.
      </p>

      {message ? <Notice kind="info">{message}</Notice> : null}
      {error ? <Notice kind="error">{error}</Notice> : null}

      <div className="toolbar">
        <button onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Close' : 'New Transfer'}</button>
      </div>

      {showCreate ? (
        <CreateTransferForm
          onCreated={(msg) => {
            setMessage(msg);
            setShowCreate(false);
            transfers.reload();
          }}
          onError={setError}
        />
      ) : null}

      {receiving ? (
        <ReceiveShipmentForm
          shipment={receiving}
          onClose={() => setReceiving(null)}
          onSaved={(msg) => {
            setMessage(msg);
            setReceiving(null);
            transfers.reload();
          }}
          onError={setError}
        />
      ) : null}

      <div className="card">
        <h3 className="card-title">Shipments</h3>
        {transfers.loading ? (
          <Skeleton rows={4} />
        ) : (
          <DataTable<Transfer>
            exportName="wasteflow-transfers"
            rows={rows}
            onRowClick={(row) => setReceiving(row)}
            columns={[
              { key: 'shipment_code', header: 'Shipment' },
              { key: 'destination_name', header: 'Destination' },
              { key: 'container_number', header: 'Container' },
              { key: 'quantity_kg', header: 'Declared', align: 'right', render: (r) => `${Number(r.quantity_kg).toFixed(0)} kg` },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'dispatch_time', header: 'Dispatched', render: (r) => formatDateTime(r.dispatch_time) },
              { key: 'received_time', header: 'Confirmed', render: (r) => formatDateTime(r.received_time) }
            ]}
          />
        )}
      </div>
    </Layout>
  );
}

function CreateTransferForm({ onCreated, onError }: { onCreated: (msg: string) => void; onError: (msg: string) => void }) {
  const [destination, setDestination] = useState('');
  const [container, setContainer] = useState('');
  const [quantity, setQuantity] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!destination.trim()) return onError('Destination is required.');
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 0) return onError('Enter a valid quantity.');
    setBusy(true);
    try {
      await api.post('/transfers', {
        destinationName: destination,
        containerNumber: container || undefined,
        quantityKg: qty
      });
      onCreated(`Shipment to ${destination} created.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not create shipment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">New Transfer</h3>
      <div className="toolbar">
        <div className="field"><label>Destination *</label><input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Puttalam (experiment)" /></div>
        <div className="field"><label>Container Number</label><input value={container} onChange={(e) => setContainer(e.target.value)} placeholder="CONT-001" /></div>
        <div className="field"><label>Quantity (kg) *</label><input value={quantity} onChange={(e) => setQuantity(e.target.value)} inputMode="decimal" /></div>
      </div>
      <div className="toolbar" style={{ marginBottom: 0 }}>
        <button onClick={submit} disabled={busy}>{busy ? 'CREATING…' : 'CREATE SHIPMENT'}</button>
      </div>
    </div>
  );
}

function ReceiveShipmentForm({
  shipment,
  onClose,
  onSaved,
  onError
}: {
  shipment: Transfer;
  onClose: () => void;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [quantity, setQuantity] = useState(String(Number(shipment.quantity_kg)));
  const [busy, setBusy] = useState(false);
  const diff = Number(quantity) - Number(shipment.quantity_kg);

  const submit = async () => {
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 0) return onError('Enter a valid received quantity.');
    setBusy(true);
    try {
      await api.post(`/transfers/${shipment.id}/receive`, { receivedQuantityKg: qty });
      onSaved(`Shipment ${shipment.shipment_code} confirmed.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Confirmation failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">{shipment.shipment_code} — destination confirmation</h3>
      <p className="muted">Container {shipment.container_number ?? '—'} · Declared {Number(shipment.quantity_kg).toFixed(0)} kg</p>
      {Math.abs(diff) > 0.0001 ? (
        <Notice kind="error">
          Declared {Number(shipment.quantity_kg).toFixed(0)} kg · Received {Number(quantity).toFixed(0)} kg ·
          Difference {diff > 0 ? '+' : ''}{diff.toFixed(0)} kg
        </Notice>
      ) : null}
      <div className="toolbar">
        <div className="field"><label>Received Quantity (kg) *</label><input value={quantity} onChange={(e) => setQuantity(e.target.value)} inputMode="decimal" /></div>
      </div>
      <div className="toolbar" style={{ marginBottom: 0 }}>
        <button onClick={submit} disabled={busy}>{busy ? 'SAVING…' : 'CONFIRM RECEIPT'}</button>
        <button className="secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
