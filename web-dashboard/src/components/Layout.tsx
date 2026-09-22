import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { RoleCode } from '../api/types';

interface NavItem {
  to: string;
  label: string;
  roles?: RoleCode[];
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/executive', label: 'Executive View', roles: ['SYSTEM_ADMINISTRATOR', 'PROVINCIAL_OFFICER'] },
  { to: '/trips', label: 'Trips', roles: ['SYSTEM_ADMINISTRATOR', 'LGA_OFFICER', 'COLLECTION_SUPERVISOR', 'DRIVER', 'PROVINCIAL_OFFICER'] },
  { to: '/loads', label: 'Loads', roles: ['SYSTEM_ADMINISTRATOR', 'LGA_OFFICER', 'COLLECTION_SUPERVISOR', 'DRIVER', 'PROVINCIAL_OFFICER', 'FACILITY_RECEIVING_OFFICER', 'FACILITY_PROCESSING_OPERATOR', 'FACILITY_MANAGER'] },
  { to: '/receiving', label: 'Receiving', roles: ['SYSTEM_ADMINISTRATOR', 'FACILITY_RECEIVING_OFFICER', 'FACILITY_MANAGER'] },
  { to: '/processing', label: 'Processing', roles: ['SYSTEM_ADMINISTRATOR', 'FACILITY_PROCESSING_OPERATOR', 'FACILITY_MANAGER'] },
  { to: '/transfers', label: 'Transfers', roles: ['SYSTEM_ADMINISTRATOR', 'FACILITY_PROCESSING_OPERATOR', 'FACILITY_MANAGER', 'FACILITY_RECEIVING_OFFICER'] },
  { to: '/exceptions', label: 'Exceptions', roles: ['SYSTEM_ADMINISTRATOR', 'LGA_OFFICER', 'COLLECTION_SUPERVISOR', 'PROVINCIAL_OFFICER', 'FACILITY_MANAGER'] },
  { to: '/traceability', label: 'Load Trace', roles: ['SYSTEM_ADMINISTRATOR', 'LGA_OFFICER', 'COLLECTION_SUPERVISOR', 'DRIVER', 'PROVINCIAL_OFFICER', 'FACILITY_RECEIVING_OFFICER', 'FACILITY_PROCESSING_OPERATOR', 'FACILITY_MANAGER'] },
  { to: '/reports', label: 'Reports', roles: ['SYSTEM_ADMINISTRATOR', 'PROVINCIAL_OFFICER', 'LGA_OFFICER', 'COLLECTION_SUPERVISOR', 'FACILITY_MANAGER'] },
  { to: '/audit', label: 'Audit Logs', roles: ['SYSTEM_ADMINISTRATOR', 'FACILITY_MANAGER'] }
];

export function canSee(item: NavItem, role: RoleCode | undefined): boolean {
  if (!item.roles) return true;
  return role !== undefined && item.roles.includes(role);
}

export function Layout({ title, children }: { title: string; children: ReactNode }) {
  const { user, demoMode, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>WASTEFLOW</h1>
          <p>Solid Waste Operations</p>
        </div>
        <nav>
          {NAV.filter((item) => canSee(item, user?.role)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <h2>{title}</h2>
          <div className="user">
            {demoMode ? <span className="badge awaiting">DEMO MODE</span> : null}
            <span>
              {user?.name ?? 'Not signed in'}
              {user ? ` · ${user.role.replace(/_/g, ' ')}` : ''}
            </span>
            <button
              className="secondary"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="content">
          {demoMode ? (
            <div className="notice demo">
              <strong>DEMO DATA.</strong> The backend is unreachable, so synthetic figures are shown.
              These are not Monroviawatta operational data.
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
