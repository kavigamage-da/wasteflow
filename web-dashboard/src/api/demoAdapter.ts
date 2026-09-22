/**
 * DEMO API ADAPTER
 * 
 * Provides mock implementations of all API endpoints for static demo mode.
 * When VITE_DEMO_MODE=true, this adapter intercepts all API calls and returns
 * synthetic data from localStorage or the default demo dataset.
 * 
 * This enables the WasteFlow frontend to work as a self-contained portfolio
 * demonstration without any backend dependency.
 */

import type {
  AuditRow,
  ByCategoryRow,
  ByLgaRow,
  Capacity,
  DashboardSummary,
  ExceptionRow,
  ExceptionsSummary,
  Load,
  LoginResponse,
  OutcomeRow,
  ReconciliationRow,
  ReportResult,
  Trace,
  Transfer,
  TrendRow,
  Trip
} from './types';
import {
  demoAudit,
  demoByCategory,
  demoByLga,
  demoCapacity,
  demoExceptions,
  demoLoads,
  demoOutcome,
  demoReconciliation,
  demoSummary,
  demoTrend,
  demoTrace,
  demoTransfers,
  demoTrips
} from '../demo/demoData';

const DEMO_STORAGE_PREFIX = 'wasteflow_demo_';

// Demo users
const DEMO_USERS: Record<string, any> = {
  driver: { id: 'demo-driver', name: 'Demo Driver', username: 'driver', email: null, role: 'DRIVER', lgaId: 'lga-galle', lgaName: 'Galle Municipal Council', facilityId: null, facilityName: null, active: true },
  supervisor: { id: 'demo-supervisor', name: 'Demo Supervisor', username: 'supervisor', email: null, role: 'COLLECTION_SUPERVISOR', lgaId: 'lga-galle', lgaName: 'Galle Municipal Council', facilityId: null, facilityName: null, active: true },
  receiving: { id: 'demo-receiving', name: 'Demo Receiving', username: 'receiving', email: null, role: 'FACILITY_RECEIVING_OFFICER', lgaId: null, lgaName: null, facilityId: 'fac-monroviawatta', facilityName: 'Monroviawatta', active: true },
  processing: { id: 'demo-processing', name: 'Demo Processing', username: 'processing', email: null, role: 'FACILITY_PROCESSING_OPERATOR', lgaId: null, lgaName: null, facilityId: 'fac-monroviawatta', facilityName: 'Monroviawatta', active: true },
  officer: { id: 'demo-officer', name: 'Demo Provincial Officer', username: 'officer', email: null, role: 'PROVINCIAL_OFFICER', lgaId: null, lgaName: null, facilityId: null, facilityName: null, active: true },
  admin: { id: 'demo-admin', name: 'Demo Administrator', username: 'admin', email: null, role: 'SYSTEM_ADMINISTRATOR', lgaId: null, lgaName: null, facilityId: null, facilityName: null, active: true }
};

const DEMO_PASSWORDS: Record<string, string> = {
  driver: 'driver123',
  supervisor: 'super123',
  receiving: 'receiving123',
  processing: 'processing123',
  officer: 'officer123',
  admin: 'admin123'
};

// localStorage helpers
function getStored<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(`${DEMO_STORAGE_PREFIX}${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${DEMO_STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

// Get demo data from localStorage or use defaults
function getDemoLoads(): Load[] {
  return getStored<Load[]>('loads', demoLoads);
}

function getDemoTransfers(): Transfer[] {
  return getStored<Transfer[]>('transfers', demoTransfers);
}

function getDemoExceptions(): ExceptionRow[] {
  return getStored<ExceptionRow[]>('exceptions', demoExceptions);
}

function getDemoAudit(): AuditRow[] {
  return getStored<AuditRow[]>('audit', demoAudit);
}

// Simulate API delay
function delay(ms: number = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Demo API adapter
export const demoApi = {
  // Authentication
  async login(username: string, password: string): Promise<LoginResponse> {
    await delay(200);
    const key = username.trim().toLowerCase();
    if (DEMO_PASSWORDS[key] === password) {
      const user = DEMO_USERS[key];
      return {
        accessToken: 'demo-token',
        refreshToken: 'demo-refresh-token',
        user
      };
    }
    throw new Error('Invalid credentials');
  },

  // Dashboard
  async getDashboardSummary(): Promise<DashboardSummary> {
    await delay();
    return demoSummary;
  },

  async getDashboardByLga(): Promise<ByLgaRow[]> {
    await delay();
    return demoByLga;
  },

  async getDashboardByCategory(): Promise<ByCategoryRow[]> {
    await delay();
    return demoByCategory;
  },

  async getDashboardTrends(): Promise<TrendRow[]> {
    await delay();
    return demoTrend;
  },

  async getDashboardOutcome(): Promise<OutcomeRow> {
    await delay();
    return demoOutcome;
  },

  async getDashboardCapacity(): Promise<Capacity> {
    await delay();
    return demoCapacity;
  },

  // Trips
  async getTrips(): Promise<Trip[]> {
    await delay();
    return demoTrips;
  },

  // Loads
  async getLoads(): Promise<Load[]> {
    await delay();
    return getDemoLoads();
  },

  async searchLoads(query: string): Promise<Load[]> {
    await delay();
    const loads = getDemoLoads();
    const q = query.toLowerCase();
    return loads.filter(l => 
      l.loadCode.toLowerCase().includes(q) ||
      l.vehicleLabel.toLowerCase().includes(q) ||
      l.lgaName.toLowerCase().includes(q) ||
      (l.tripCode && l.tripCode.toLowerCase().includes(q))
    );
  },

  async receiveLoad(loadCode: string, data: any): Promise<void> {
    await delay(300);
    const loads = getDemoLoads();
    const index = loads.findIndex(l => l.loadCode === loadCode);
    if (index === -1) throw new Error('Load not found');
    
    loads[index] = {
      ...loads[index],
      receivedQuantityKg: data.receivedQuantityKg,
      receivingMethod: data.measurementMethod,
      condition: data.condition,
      discrepancyFlag: data.receivedQuantityKg !== loads[index].declaredQuantityKg,
      discrepancyReason: data.discrepancyReason || null,
      receivedBy: 'Demo Receiving',
      status: 'RECEIVED',
      updatedAt: new Date().toISOString()
    };
    setStored('loads', loads);
    
    // Add audit log
    const audit = getDemoAudit();
    audit.unshift({
      id: Date.now(),
      entity_type: 'load',
      entity_id: loadCode,
      action: 'RECEIVED',
      old_values: { status: 'SUBMITTED' },
      new_values: { status: 'RECEIVED', received_quantity_kg: data.receivedQuantityKg },
      created_at: new Date().toISOString(),
      user_name: 'Demo Receiving'
    });
    setStored('audit', audit);
  },

  async processLoad(loadCode: string, data: any): Promise<void> {
    await delay(300);
    const loads = getDemoLoads();
    const index = loads.findIndex(l => l.loadCode === loadCode);
    if (index === -1) throw new Error('Load not found');
    
    loads[index] = {
      ...loads[index],
      compostKg: data.compostKg,
      landfillKg: data.landfillKg,
      transferKg: data.transferKg,
      otherKg: data.otherKg,
      processingIncomplete: data.incomplete,
      processedBy: 'Demo Processing',
      status: data.incomplete ? 'PROCESSING' : 'COMPLETED',
      updatedAt: new Date().toISOString()
    };
    setStored('loads', loads);
    
    // Add audit log
    const audit = getDemoAudit();
    audit.unshift({
      id: Date.now(),
      entity_type: 'load',
      entity_id: loadCode,
      action: 'PROCESSED',
      old_values: { status: 'RECEIVED' },
      new_values: { status: data.incomplete ? 'PROCESSING' : 'COMPLETED' },
      created_at: new Date().toISOString(),
      user_name: 'Demo Processing'
    });
    setStored('audit', audit);
  },

  async getLoadTrace(loadCode: string): Promise<Trace> {
    await delay();
    return demoTrace(loadCode);
  },

  // Transfers
  async getTransfers(): Promise<Transfer[]> {
    await delay();
    return getDemoTransfers();
  },

  async createTransfer(data: any): Promise<void> {
    await delay(300);
    const transfers = getDemoTransfers();
    const newTransfer: Transfer = {
      id: `s${Date.now()}`,
      shipment_code: `TRF-DEMO-${String(transfers.length + 1).padStart(3, '0')}`,
      destination_name: data.destinationName,
      container_number: data.containerNumber || null,
      quantity_kg: String(data.quantityKg),
      dispatch_time: new Date().toISOString(),
      status: 'AWAITING_CONFIRMATION',
      received_time: null,
      load_count: 0
    };
    transfers.unshift(newTransfer);
    setStored('transfers', transfers);
  },

  async receiveTransfer(transferId: string, data: any): Promise<void> {
    await delay(300);
    const transfers = getDemoTransfers();
    const index = transfers.findIndex(t => t.id === transferId);
    if (index === -1) throw new Error('Transfer not found');
    
    transfers[index] = {
      ...transfers[index],
      status: 'RECEIVED',
      received_time: new Date().toISOString()
    };
    setStored('transfers', transfers);
  },

  // Exceptions
  async getExceptions(): Promise<ExceptionRow[]> {
    await delay();
    return getDemoExceptions();
  },

  async getExceptionsSummary(): Promise<ExceptionsSummary> {
    await delay();
    const exceptions = getDemoExceptions();
    return {
      critical: exceptions.filter(e => e.severity === 'CRITICAL').length,
      warning: exceptions.filter(e => e.severity === 'WARNING').length,
      open: exceptions.filter(e => e.status !== 'RESOLVED').length,
      resolved: exceptions.filter(e => e.status === 'RESOLVED').length
    };
  },

  async updateException(exceptionId: string, data: any): Promise<void> {
    await delay(300);
    const exceptions = getDemoExceptions();
    const index = exceptions.findIndex(e => e.id === exceptionId);
    if (index === -1) throw new Error('Exception not found');
    
    exceptions[index] = {
      ...exceptions[index],
      status: data.status,
      resolution: data.resolution || null,
      resolved_at: data.status === 'RESOLVED' ? new Date().toISOString() : null
    };
    setStored('exceptions', exceptions);
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditRow[]> {
    await delay();
    return getDemoAudit();
  },

  // Reports
  async getReport(type: string): Promise<ReportResult> {
    await delay();
    // Return a basic report structure for demo mode
    return {
      title: `${type.replace(/_/g, ' ')} Report`,
      periodLabel: 'Demo Period',
      generatedAt: new Date().toISOString(),
      filters: {},
      rowCount: 0,
      rows: []
    };
  },

  // Reconciliation
  async getReconciliation(): Promise<ReconciliationRow[]> {
    await delay();
    return demoReconciliation;
  }
};

// Check if demo mode is enabled
export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE === 'true';
}
