import { useMemo, useState, type ReactNode } from 'react';

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/[^a-z]/g, '');
  const cls =
    key.includes('awaiting') ? 'awaiting'
    : key.includes('exception') ? 'exception'
    : key.includes('completed') ? 'completed'
    : key.includes('processing') ? 'processing'
    : key.includes('received') ? 'received'
    : key.includes('intransit') || key.includes('inprogress') ? 'intransit'
    : key.includes('submitted') ? 'submitted'
    : key.includes('cancelled') ? 'cancelled'
    : key.includes('draft') ? 'draft'
    : 'draft';
  return <span className={`badge ${cls}`}>{status.replace(/_/g, ' ')}</span>;
}

export function KpiCard({
  value,
  label,
  tone = 'default'
}: {
  value: string;
  label: string;
  tone?: 'default' | 'warn' | 'danger';
}) {
  return (
    <div className={`kpi ${tone === 'default' ? '' : tone}`}>
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}

export function Notice({
  kind = 'info',
  children
}: {
  kind?: 'info' | 'demo' | 'error';
  children: ReactNode;
}) {
  return <div className={`notice ${kind}`}>{children}</div>;
}

export function DemoTick() {
  return <span className="badge awaiting" style={{ marginLeft: 8 }}>DEMO DATA</span>;
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}

export function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}

export interface Column<T> {
  key: keyof T & string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'right';
}

export function DataTable<T extends object>({
  columns,
  rows,
  onRowClick,
  pageSize = 10,
  exportName
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  pageSize?: number;
  exportName?: string;
}) {
  const [sortKey, setSortKey] = useState<(keyof T & string) | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  const sorted = useMemoRows(rows, sortKey, sortAsc);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, totalPages);
  const pageRows = sorted.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (key: keyof T & string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const exportCsv = () => {
    const headers = columns.map((c) => c.header);
    const lines = [headers.join(',')];
    for (const row of rows) {
      lines.push(
        columns
          .map((c) => {
            const v = row[c.key];
            const s = v === null || v === undefined ? '' : String(v);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(',')
      );
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportName ?? 'wasteflow-export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (rows.length === 0) {
    return <EmptyState title="No records found" message="There are no records matching your current filters." />;
  }

  return (
    <div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={c.align === 'right' ? { textAlign: 'right' } : undefined}
                  onClick={() => toggleSort(c.key)}
                >
                  {c.header}
                  {sortKey === c.key ? (sortAsc ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, idx) => (
              <tr
                key={idx}
                className={onRowClick ? 'clickable' : ''}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} style={c.align === 'right' ? { textAlign: 'right' } : undefined}>
                    {c.render ? c.render(row) : String(row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="toolbar" style={{ marginTop: 12, justifyContent: 'space-between' }}>
        <span className="muted">
          {sorted.length} record{sorted.length === 1 ? '' : 's'} · page {current} of {totalPages}
        </span>
        <span style={{ display: 'flex', gap: 8 }}>
          <button className="secondary" onClick={() => setPage(Math.max(1, current - 1))} disabled={current <= 1}>
            Prev
          </button>
          <button className="secondary" onClick={() => setPage(Math.min(totalPages, current + 1))} disabled={current >= totalPages}>
            Next
          </button>
          {exportName ? (
            <button className="secondary" onClick={exportCsv}>
              Export CSV
            </button>
          ) : null}
        </span>
      </div>
    </div>
  );
}

function useMemoRows<T extends object>(rows: T[], sortKey: (keyof T & string) | null, sortAsc: boolean): T[] {
  return useMemo(() => {
    if (!sortKey) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey] as unknown;
      const bv = b[sortKey] as unknown;
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av;
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [rows, sortKey, sortAsc]);
}

export function formatKg(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (value >= 1000) return `${(value / 1000).toFixed(2)} MT`;
  return `${Math.round(value)} kg`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}
