import { Layout } from '../components/Layout';
import { DataTable, Notice, Skeleton, formatDateTime } from '../components/ui';
import { api } from '../api/client';
import { useApiData } from '../api/useApiData';
import { demoAudit } from '../demo/demoData';
import type { AuditRow } from '../api/types';

export default function AuditLogsPage() {
  const audit = useApiData<AuditRow[]>(() => api.get('/audit-logs'), demoAudit);

  return (
    <Layout title="Audit Logs">
      <h1 className="page-title">Audit Logs</h1>
      <p className="page-sub">Append-only. No user can modify or delete audit history.</p>

      <Notice kind="info">
        Every important change records the user, action, entity, old and new values, and a timestamp.
        There is no delete endpoint for audit records.
      </Notice>

      <div className="card">
        {audit.loading ? (
          <Skeleton rows={6} />
        ) : (
          <DataTable<AuditRow>
            exportName="wasteflow-audit"
            rows={(audit.data ?? demoAudit) as unknown as AuditRow[]}
            columns={[
              { key: 'created_at', header: 'When', render: (r) => formatDateTime(r.created_at) },
              { key: 'user_name', header: 'User', render: (r) => r.user_name ?? '—' },
              { key: 'action', header: 'Action' },
              { key: 'entity_type', header: 'Entity' },
              { key: 'entity_id', header: 'Entity ID', render: (r) => r.entity_id ?? '—' },
              {
                key: 'old_values',
                header: 'Old → New',
                render: (r) => (
                  <span style={{ fontSize: 12 }}>
                    {r.old_values ? JSON.stringify(r.old_values) : '—'} → {r.new_values ? JSON.stringify(r.new_values) : '—'}
                  </span>
                )
              }
            ]}
          />
        )}
      </div>
    </Layout>
  );
}
