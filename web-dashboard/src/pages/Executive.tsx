import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { DataTable, KpiCard, Notice, formatKg } from '../components/ui';
import { api } from '../api/client';
import { useApiData } from '../api/useApiData';
import { demoByLga, demoCapacity, demoExceptions, demoLoads, demoSummary, demoTrace } from '../demo/demoData';
import type { ByLgaRow, Capacity, DashboardSummary, Load, Trace } from '../api/types';

export default function ExecutivePage() {
  const summary = useApiData<DashboardSummary>(() => api.get('/dashboard/summary'), demoSummary);
  const byLga = useApiData<ByLgaRow[]>(() => api.get('/dashboard/by-lga'), demoByLga);
  const capacity = useApiData<Capacity>(() => api.get('/dashboard/capacity'), demoCapacity);
  const loads = useApiData<Load[]>(() => api.get('/loads'), demoLoads);

  const s = summary.data ?? demoSummary;
  const cap = capacity.data ?? demoCapacity;
  const rows = (loads.data ?? demoLoads) as unknown as Load[];

  return (
    <Layout title="Executive View">
      <div className="exec-hero">
        <h1>WASTEFLOW</h1>
        <p>Galle District — Solid Waste Operations</p>
        <div className="exec-flow">
          <span className="step">Collection</span>
          <span className="arrow">→</span>
          <span className="step">Transport</span>
          <span className="arrow">→</span>
          <span className="step">Receiving</span>
          <span className="arrow">→</span>
          <span className="step">Processing</span>
          <span className="arrow">→</span>
          <span className="step">Final Outcome</span>
        </div>
      </div>

      <Notice kind="demo">
        <strong>DEMO DATA.</strong> Demonstration figures only — not Monroviawatta operational data.
      </Notice>

      <h2 className="page-title" style={{ fontSize: 18 }}>Five questions answered</h2>

      <div className="card">
        <h3 className="card-title">1 &amp; 4 — How much is recorded, and where did it go?</h3>
        <div className="kpi-grid" style={{ marginBottom: 0 }}>
          <KpiCard value={formatKg(s.totalRecordedKg)} label="Waste recorded" />
          <KpiCard value={formatKg(s.totalReceivedKg)} label="Received" />
          <KpiCard value={formatKg(s.totalProcessedKg)} label="Processed" />
          <KpiCard value={formatKg(s.totalTransferredKg)} label="Transferred" />
          <KpiCard value={String(s.openExceptions)} label="Unresolved exceptions" tone="danger" />
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">2 — Which LGA delivered it?</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byLga.data ?? demoByLga}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e6e2" />
              <XAxis dataKey="lga_name" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => `${value} kg`} />
              <Bar dataKey="recorded_kg" name="Recorded (kg)" radius={[6, 6, 0, 0]}>
                {(byLga.data ?? demoByLga).map((_, i) => (
                  <Cell key={i} fill={['#1b5e20', '#00897b', '#4db6ac', '#ffb300', '#78909c'][i % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="card-title">3 &amp; 5 — Capacity reference and data gaps</h3>
          <div className="kpi-grid" style={{ marginBottom: 0 }}>
            <KpiCard value={`${cap.recordedTodayMt} MT`} label="Recorded today" />
            <KpiCard value={`${cap.referenceCapacityMtDay} MT/day`} label="Reference capacity" />
            <KpiCard value={`${cap.referenceUtilisationPct}%`} label="Reference utilisation" tone="warn" />
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>{cap.label}</p>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Waste flow — where records go next</h3>
        {rows.slice(0, 5).map((l) => (
          <div key={l.loadCode} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
            <span className="badge submitted">{l.loadCode}</span>
            <span className="muted">{l.lgaName}</span>
            <span className="muted">· {l.vehicleLabel}</span>
            <span className="muted">· {formatKg(l.declaredQuantityKg)}</span>
            <span className="arrow muted">→</span>
            <span className="badge received">{l.status}</span>
          </div>
        ))}
        <Link to="/traceability" className="muted">Open full traceability →</Link>
      </div>

      <div className="card">
        <h3 className="card-title">Executive load trace demo</h3>
        <ExecTrace />
      </div>

      <div className="card">
        <h3 className="card-title">Open exceptions</h3>
        <DataTable
          pageSize={5}
          rows={demoExceptions as unknown as Array<Record<string, unknown>>}
          columns={[
            { key: 'exception_type', header: 'Type' },
            { key: 'severity', header: 'Severity' },
            { key: 'status', header: 'Status' },
            { key: 'description', header: 'Description' }
          ]}
        />
      </div>

      <div className="toolbar">
        <Link to="/">
          <button className="secondary">View operational dashboard</button>
        </Link>
        <Link to="/reports">
          <button>Generate report</button>
        </Link>
      </div>
    </Layout>
  );
}

function ExecTrace() {
  const [code, setCode] = useState('LD-DEMO-001');
  const trace = useApiData<Trace>(
    () => api.get(`/loads/${encodeURIComponent(code)}/trace`),
    demoTrace(code),
    [code]
  );
  const t = trace.data;

  return (
    <div>
      <div className="field" style={{ maxWidth: 320 }}>
        <label htmlFor="exec-load">Load ID</label>
        <input id="exec-load" value={code} onChange={(e) => setCode(e.target.value)} />
      </div>
      {t ? (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '8px 0 14px' }}>
            {t.steps.map((step, i) => (
              <span key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${step.completed ? 'completed' : 'draft'}`}>{step.label}</span>
                {i < t.steps.length - 1 ? <span className="muted">→</span> : null}
              </span>
            ))}
          </div>
          <table className="data">
            <tbody>
              <tr>
                <td className="muted">Source</td>
                <td>{t.load.lgaName}</td>
                <td className="muted">Vehicle</td>
                <td>{t.load.vehicleLabel}</td>
              </tr>
              <tr>
                <td className="muted">Declared</td>
                <td>{formatKg(t.load.declaredQuantityKg)}</td>
                <td className="muted">Received</td>
                <td>{formatKg(t.reconciliation.receivedKg)}</td>
              </tr>
              <tr>
                <td className="muted">Allocated</td>
                <td>{formatKg(t.reconciliation.allocatedKg)}</td>
                <td className="muted">Variance (declared − received)</td>
                <td>{formatKg(t.reconciliation.declaredMinusReceived)}</td>
              </tr>
            </tbody>
          </table>
        </>
      ) : null}
    </div>
  );
}
