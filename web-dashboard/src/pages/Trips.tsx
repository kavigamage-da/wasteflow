import { Layout } from '../components/Layout';
import { DataTable, Skeleton, StatusBadge, formatDateTime, formatKg } from '../components/ui';
import { api } from '../api/client';
import { useApiData } from '../api/useApiData';
import { demoTrips } from '../demo/demoData';
import type { Trip } from '../api/types';

export default function TripsPage() {
  const trips = useApiData<Trip[]>(() => api.get('/trips'), demoTrips);

  return (
    <Layout title="Trips">
      <h1 className="page-title">Trips</h1>
      <p className="page-sub">Collection runs and their recorded quantities.</p>
      <div className="card">
        {trips.loading ? (
          <Skeleton rows={5} />
        ) : (
          <DataTable<Trip>
            exportName="wasteflow-trips"
            rows={(trips.data ?? demoTrips) as unknown as Trip[]}
            columns={[
              { key: 'tripCode', header: 'Trip ID' },
              { key: 'vehicleId', header: 'Vehicle' },
              { key: 'sourceArea', header: 'Source Area' },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'declaredQuantityKg', header: 'Recorded', align: 'right', render: (r) => formatKg(r.declaredQuantityKg) },
              { key: 'startTime', header: 'Start', render: (r) => formatDateTime(r.startTime) },
              { key: 'endTime', header: 'End', render: (r) => formatDateTime(r.endTime) }
            ]}
          />
        )}
      </div>
    </Layout>
  );
}
