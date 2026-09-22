import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { KpiCard, Notice, Skeleton, StatusBadge, formatDateTime, formatKg } from '../components/ui';
import { api } from '../api/client';
import { useApiData } from '../api/useApiData';
import { demoTrace } from '../demo/demoData';
import type { Trace } from '../api/types';

export default function TraceabilityPage() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('load') ?? 'LD-DEMO-001');
  const [submitted, setSubmitted] = useState(params.get('load') ?? 'LD-DEMO-001');

  const trace = useApiData<Trace>(() => api.get(`/loads/${encodeURIComponent(submitted)}/trace`), demoTrace(submitted), [submitted]);

  const t = trace.data;

  return (
    <Layout title="Traceability">
      <h1 className="page-title">Load Traceability</h1>
      <p className="page-sub">Enter a Load ID to see the full chain, with responsible parties and reconciliation.</p>

      <div className="toolbar">
        <div className="field" style={{ minWidth: 260 }}>
          <label>Load ID</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setSubmitted(code.trim());
            }}
            placeholder="LD-20260920-00001"
          />
        </div>
        <button onClick={() => setSubmitted(code.trim())}>Search</button>
      </div>

      {trace.loading ? (
        <Skeleton rows={5} />
      ) : t ? (
        <>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h3 className="card-title" style={{ margin: 0 }}>LOAD {t.load.loadCode}</h3>
              <StatusBadge status={t.load.status} />
            </div>
            <p className="muted">
              {t.load.lgaName} · Vehicle {t.load.vehicleLabel} · {t.load.wasteCategory.replace(/_/g, ' ')} ·
              measured by {t.load.measurementMethod.replace(/_/g, ' ')}
            </p>

            <div style={{ marginTop: 12 }}>
              {t.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '6px 0' }}>
                  <span className={`badge ${step.completed ? 'completed' : 'draft'}`}>{step.completed ? '✓' : '○'}</span>
                  <div>
                    <strong>{step.label}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {step.detail ?? '—'}{step.at ? ` · ${formatDateTime(step.at)}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Reconciliation</h3>
            <div className="kpi-grid" style={{ marginBottom: 0 }}>
              <KpiCard value={formatKg(t.reconciliation.declaredKg)} label="Declared" />
              <KpiCard value={formatKg(t.reconciliation.receivedKg)} label="Received" />
              <KpiCard value={formatKg(t.reconciliation.allocatedKg)} label="Allocated" />
              <KpiCard
                value={formatKg(t.reconciliation.declaredMinusReceived)}
                label="Declared − Received"
                tone={t.reconciliation.declaredMinusReceived !== 0 ? 'danger' : 'default'}
              />
              <KpiCard
                value={formatKg(t.reconciliation.receivedMinusAllocated)}
                label="Received − Allocated"
                tone={t.reconciliation.receivedMinusAllocated !== 0 ? 'warn' : 'default'}
              />
            </div>
            {t.load.discrepancyReason ? (
              <Notice kind="error">
                <strong>Discrepancy reason:</strong> {t.load.discrepancyReason}
              </Notice>
            ) : null}
          </div>
        </>
      ) : null}
    </Layout>
  );
}
