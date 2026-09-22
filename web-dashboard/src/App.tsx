import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import type { RoleCode } from './api/types';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ExecutivePage from './pages/Executive';
import TripsPage from './pages/Trips';
import LoadsPage from './pages/Loads';
import ReceivingPage from './pages/Receiving';
import ProcessingPage from './pages/Processing';
import TransfersPage from './pages/Transfers';
import ExceptionsPage from './pages/Exceptions';
import TraceabilityPage from './pages/Traceability';
import ReportsPage from './pages/Reports';
import AuditPage from './pages/AuditLogs';

function Protected({ children, roles }: { children: ReactElement; roles?: RoleCode[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="card">
        <h3 className="card-title">Access denied</h3>
        <p className="muted">
          Your role ({user.role.replace(/_/g, ' ')}) does not have permission to view this page.
        </p>
      </div>
    );
  }
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<Protected><DashboardPage /></Protected>} />
      <Route
        path="/executive"
        element={
          <Protected roles={['SYSTEM_ADMINISTRATOR', 'PROVINCIAL_OFFICER']}>
            <ExecutivePage />
          </Protected>
        }
      />
      <Route
        path="/trips"
        element={
          <Protected roles={['SYSTEM_ADMINISTRATOR', 'LGA_OFFICER', 'COLLECTION_SUPERVISOR', 'DRIVER', 'PROVINCIAL_OFFICER']}>
            <TripsPage />
          </Protected>
        }
      />
      <Route path="/loads" element={<Protected><LoadsPage /></Protected>} />
      <Route
        path="/receiving"
        element={
          <Protected roles={['SYSTEM_ADMINISTRATOR', 'FACILITY_RECEIVING_OFFICER', 'FACILITY_MANAGER']}>
            <ReceivingPage />
          </Protected>
        }
      />
      <Route
        path="/processing"
        element={
          <Protected roles={['SYSTEM_ADMINISTRATOR', 'FACILITY_PROCESSING_OPERATOR', 'FACILITY_MANAGER']}>
            <ProcessingPage />
          </Protected>
        }
      />
      <Route
        path="/transfers"
        element={
          <Protected roles={['SYSTEM_ADMINISTRATOR', 'FACILITY_PROCESSING_OPERATOR', 'FACILITY_MANAGER', 'FACILITY_RECEIVING_OFFICER']}>
            <TransfersPage />
          </Protected>
        }
      />
      <Route path="/exceptions" element={<Protected><ExceptionsPage /></Protected>} />
      <Route path="/traceability" element={<Protected><TraceabilityPage /></Protected>} />
      <Route
        path="/reports"
        element={
          <Protected roles={['SYSTEM_ADMINISTRATOR', 'PROVINCIAL_OFFICER', 'LGA_OFFICER', 'COLLECTION_SUPERVISOR', 'FACILITY_MANAGER']}>
            <ReportsPage />
          </Protected>
        }
      />
      <Route
        path="/audit"
        element={
          <Protected roles={['SYSTEM_ADMINISTRATOR', 'FACILITY_MANAGER']}>
            <AuditPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
