import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Layout } from '../components/Layout';
import { DataTable, KpiCard, Notice, Skeleton, StatusBadge, formatDateTime, formatKg } from '../components/ui';
import { api } from '../api/client';
import { useApiData } from '../api/useApiData';
import { useAuth } from '../auth/AuthContext';
import {
  demoByCategory,
  demoByLga,
  demoCapacity,
  demoExceptions,
  demoLoads,
  demoOutcome,
  demoSummary,
  demoTrend
} from '../demo/demoData';
import type {
  ByCategoryRow,
  ByLgaRow,
  Capacity,
  DashboardSummary,
  Load,
  OutcomeRow,
  TrendRow
} from '../api/types';

const CATEGORY_COLORS = ['#1b5e20', '#00897b', '#4db6ac', '#ffb300', '#d32f2f', '#78909c'];

export default function DashboardPage() {
  const { user } = useAuth();
  const summary = useApiData<DashboardSummary>(() => api.get('/dashboard/summary'), demoSummary);
  const byLga = useApiData<ByLgaRow[]>(() => api.get('/dashboard/by-lga'), demoByLga);
  const byCategory = useApiData<ByCategoryRow[]>(() => api.get('/dashboard/by-category'), demoByCategory);
  const trends = useApiData<TrendRow[]>(() => api.get('/dashboard/trends'), demoTrend);
  const outcome = useApiData<OutcomeRow>(() => api.get('/dashboard/outcome'), demoOutcome);
  const capacity = useApiData<Capacity>(() => api.get('/dashboard/capacity'), demoCapacity);
  const loads = useApiData<Load[]>(() => api.get('/loads'), demoLoads);

  const s = summary.data ?? demoSummary;
  const cap = capacity.data ?? demoCapacity;
  const role = user?.role;

  const outcomeData = [
    { name: 'Compost', kg: Math.round((outcome.data ?? demoOutcome).compost_kg) },
    { name: 'Landfill', kg: Math.round((outcome.data ?? demoOutcome).landfill_kg) },
    { name: 'Transfer', kg: Math.round((outcome.data ?? demoOutcome).transfer_kg) },
    { name: 'Other', kg: Math.round((outcome.data ?? demoOutcome).other_kg) }
  ];

  return (
    <Layout title="Dashboard">
      <h1 className="page-title">
        {role === 'DRIVER' ? 'Driver Dashboard' :
         role === 'COLLECTION_SUPERVISOR' ? 'Supervisor Dashboard' :
         role === 'FACILITY_RECEIVING_OFFICER' ? 'Receiving Dashboard' :
         role === 'FACILITY_PROCESSING_OPERATOR' ? 'Processing Dashboard' :
         role === 'PROVINCIAL_OFFICER' ? 'Provincial Dashboard' :
         role === 'SYSTEM_ADMINISTRATOR' ? 'Administrator Dashboard' :
         'Operational Dashboard'}
      </h1>
      <p className="page-sub">
        {role === 'DRIVER' ? 'Your assigned trips and collection activity.' :
         role === 'COLLECTION_SUPERVISOR' ? 'Collection operations monitoring.' :
         role === 'FACILITY_RECEIVING_OFFICER' ? 'Facility receiving operations.' :
         role === 'FACILITY_PROCESSING_OPERATOR' ? 'Processing operations and reconciliation.' :
         role === 'PROVINCIAL_OFFICER' ? 'District-wide waste operations monitoring.' :
         role === 'SYSTEM_ADMINISTRATOR' ? 'System administration and configuration.' :
         'Waste moved through collection, receiving, processing and transfer.'}
      </p>

      {summary.loading ? (
        <Skeleton rows={3} />
      ) : (
        <div className="kpi-grid">
          {role === 'DRIVER' ? (
            <>
              <KpiCard value={String(s.totalLoadsToday)} label="My loads today" />
              <KpiCard value={formatKg(s.totalRecordedKg)} label="Collected today" />
              <KpiCard value={String(s.openExceptions)} label="My exceptions" tone={s.openExceptions > 0 ? 'danger' : 'default'} />
            </>
          ) : role === 'COLLECTION_SUPERVISOR' ? (
            <>
              <KpiCard value={String(s.totalLoadsToday)} label="Active trips" />
              <KpiCard value={formatKg(s.totalRecordedKg)} label="Collected today" />
              <KpiCard value={String(s.openExceptions)} label="Open exceptions" tone={s.openExceptions > 0 ? 'danger' : 'default'} />
            </>
          ) : role === 'FACILITY_RECEIVING_OFFICER' ? (
            <>
              <KpiCard value={String(s.totalLoadsToday)} label="Incoming loads" />
              <KpiCard value={formatKg(s.totalReceivedKg)} label="Received today" />
              <KpiCard value={String(s.openExceptions)} label="Discrepancies" tone={s.openExceptions > 0 ? 'danger' : 'default'} />
            </>
          ) : role === 'FACILITY_PROCESSING_OPERATOR' ? (
            <>
              <KpiCard value={String(s.totalLoadsToday)} label="Awaiting processing" />
              <KpiCard value={formatKg(s.totalProcessedKg)} label="Processed today" />
              <KpiCard value={String(s.openExceptions)} label="Processing exceptions" tone={s.openExceptions > 0 ? 'danger' : 'default'} />
            </>
          ) : role === 'PROVINCIAL_OFFICER' || role === 'SYSTEM_ADMINISTRATOR' ? (
            <>
              <KpiCard value={String(s.totalLoadsToday)} label="Total loads" />
              <KpiCard value={formatKg(s.totalRecordedKg)} label="Total waste" />
              <KpiCard value={formatKg(s.totalReceivedKg)} label="Received" />
              <KpiCard value={formatKg(s.totalProcessedKg)} label="Processed" />
              <KpiCard value={formatKg(s.totalTransferredKg)} label="Transferred" />
              <KpiCard value={String(s.openExceptions)} label="Open exceptions" tone={s.openExceptions > 0 ? 'danger' : 'default'} />
            </>
          ) : (
            <>
              <KpiCard value={String(s.totalLoadsToday)} label="Loads recorded" />
              <KpiCard value={formatKg(s.totalRecordedKg)} label="Total waste recorded" />
              <KpiCard value={formatKg(s.totalReceivedKg)} label="Received" />
              <KpiCard value={formatKg(s.totalProcessedKg)} label="Processing" />
              <KpiCard value={formatKg(s.totalTransferredKg)} label="Transferred" />
              <KpiCard value={String(s.openExceptions)} label="Open exceptions" tone={s.openExceptions > 0 ? 'danger' : 'default'} />
            </>
          )}
        </div>
      )}

      {(role === 'PROVINCIAL_OFFICER' || role === 'SYSTEM_ADMINISTRATOR') && (
        <div className="card">
          <h3 className="card-title">Reference Capacity</h3>
          <div className="kpi-grid" style={{ marginBottom: 0 }}>
            <KpiCard value={`${cap.referenceCapacityMtDay} MT/day`} label="Reference capacity" />
            <KpiCard value={`${cap.recordedTodayMt} MT`} label="Recorded today" />
            <KpiCard value={`${cap.referenceUtilisationPct}%`} label="Reference utilisation" tone="warn" />
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>{cap.label}</p>
        </div>
      )}

      {(role === 'PROVINCIAL_OFFICER' || role === 'SYSTEM_ADMINISTRATOR') && (
        <div className="grid-2">
          <div className="card">
            <h3 className="card-title">Waste by LGA</h3>
            {byLga.loading ? (
              <Skeleton rows={4} />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byLga.data ?? demoByLga}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e6e2" />
                  <XAxis dataKey="lga_name" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => `${value} kg`} />
                  <Bar dataKey="recorded_kg" fill="#1b5e20" radius={[6, 6, 0, 0]} name="Recorded (kg)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <h3 className="card-title">Waste by Category</h3>
            {byCategory.loading ? (
              <Skeleton rows={4} />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={byCategory.data ?? demoByCategory}
                    dataKey="recorded_kg"
                    nameKey="category"
                    innerRadius={52}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {(byCategory.data ?? demoByCategory).map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => `${value} kg`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {(role === 'PROVINCIAL_OFFICER' || role === 'SYSTEM_ADMINISTRATOR' || role === 'COLLECTION_SUPERVISOR' || role === 'FACILITY_PROCESSING_OPERATOR') && (
        <div className="grid-2">
          <div className="card">
            <h3 className="card-title">Daily Waste Trend</h3>
            {trends.loading ? (
              <Skeleton rows={4} />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trends.data ?? demoTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e6e2" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => `${value} kg`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="recorded_kg" stroke="#1b5e20" strokeWidth={2} name="Recorded" />
                  <Line type="monotone" dataKey="received_kg" stroke="#00897b" strokeWidth={2} name="Received" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {(role === 'FACILITY_PROCESSING_OPERATOR' || role === 'PROVINCIAL_OFFICER' || role === 'SYSTEM_ADMINISTRATOR') && (
            <div className="card">
              <h3 className="card-title">Processing Outcome</h3>
              {outcome.loading ? (
                <Skeleton rows={4} />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={outcomeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e6e2" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => `${value} kg`} />
                    <Bar dataKey="kg" name="Allocated (kg)" radius={[6, 6, 0, 0]}>
                      {outcomeData.map((_, i) => (
                        <Cell key={i} fill={['#2e7d32', '#78909c', '#6a1b9a', '#ffb300'][i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h3 className="card-title">
          {role === 'DRIVER' ? 'My Loads' :
           role === 'COLLECTION_SUPERVISOR' ? 'Collection Activity' :
           role === 'FACILITY_RECEIVING_OFFICER' ? 'Receiving Queue' :
           role === 'FACILITY_PROCESSING_OPERATOR' ? 'Processing Queue' :
           'Vehicle & Load Activity'}
        </h3>
        {loads.error ? <Notice kind="error">{loads.error}</Notice> : null}
        {loads.loading ? (
          <Skeleton rows={4} />
        ) : (
          <DataTable<Load>
            exportName="wasteflow-loads"
            rows={(loads.data ?? demoLoads) as unknown as Load[]}
            columns={[
              { key: 'loadCode', header: 'Load ID' },
              { key: 'vehicleLabel', header: 'Vehicle' },
              { key: 'lgaName', header: 'LGA' },
              { key: 'wasteCategory', header: 'Category' },
              { key: 'declaredQuantityKg', header: 'Declared', align: 'right', render: (r) => formatKg(r.declaredQuantityKg) },
              { key: 'receivedQuantityKg', header: 'Received', align: 'right', render: (r) => formatKg(r.receivedQuantityKg) },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'updatedAt', header: 'Updated', render: (r) => formatDateTime(r.updatedAt) }
            ]}
          />
        )}
      </div>

      {(role === 'PROVINCIAL_OFFICER' || role === 'SYSTEM_ADMINISTRATOR') && (
        <div className="card">
          <h3 className="card-title">Data Quality</h3>
          <DataQuality />
        </div>
      )}
    </Layout>
  );
}

function DataQuality() {
  const loads = demoLoads;
  const complete = loads.filter((l) => l.receivedQuantityKg !== null && l.wasteCategory !== 'UNKNOWN').length;
  const missingWeight = loads.filter((l) => !l.declaredQuantityKg).length;
  const missingDestination = loads.filter((l) => l.receivedQuantityKg === null).length;
  const total = loads.length;
  const completeness = ((complete / total) * 100).toFixed(1);

  return (
    <div className="kpi-grid" style={{ marginBottom: 0 }}>
      <KpiCard value={`${completeness}%`} label="Data completeness (system metric)" />
      <KpiCard value={String(missingWeight)} label="Missing weight" tone="warn" />
      <KpiCard value={String(missingDestination)} label="Awaiting receipt / destination" tone="warn" />
      <KpiCard value={String((demoExceptions ?? []).filter((e) => e.status !== 'RESOLVED').length)} label="Open exceptions" tone="danger" />
    </div>
  );
}
