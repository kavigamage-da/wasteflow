export type RoleCode =
  | 'SYSTEM_ADMINISTRATOR'
  | 'PROVINCIAL_OFFICER'
  | 'LGA_OFFICER'
  | 'COLLECTION_SUPERVISOR'
  | 'DRIVER'
  | 'FACILITY_RECEIVING_OFFICER'
  | 'FACILITY_PROCESSING_OPERATOR'
  | 'FACILITY_MANAGER';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: RoleCode;
  lgaId: string | null;
  lgaName: string | null;
  facilityId: string | null;
  facilityName: string | null;
  active: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Load {
  id: string;
  loadCode: string;
  tripId: string | null;
  tripCode: string | null;
  vehicleLabel: string;
  lgaName: string;
  sourceArea: string | null;
  wasteCategory: string;
  measurementMethod: string;
  declaredQuantityKg: number;
  status: string;
  arrivalTime: string | null;
  receivedQuantityKg: number | null;
  receivingMethod: string | null;
  condition: string | null;
  discrepancyFlag: boolean;
  discrepancyReason: string | null;
  receivedBy: string | null;
  compostKg: number | null;
  landfillKg: number | null;
  transferKg: number | null;
  otherKg: number | null;
  processingIncomplete: boolean;
  processedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  tripCode: string;
  vehicleId: string;
  routeId: string | null;
  lgaId: string;
  sourceArea: string | null;
  status: string;
  startTime: string | null;
  endTime: string | null;
  declaredQuantityKg: number;
}

export interface DashboardSummary {
  totalLoadsToday: number;
  totalRecordedKg: number;
  totalReceivedKg: number;
  totalProcessedKg: number;
  totalTransferredKg: number;
  openExceptions: number;
}

export interface ByLgaRow { lga_name: string; recorded_kg: number; loads: number; }
export interface ByCategoryRow { category: string; recorded_kg: number; loads: number; }
export interface TrendRow { day: string; recorded_kg: number; received_kg: number; }
export interface OutcomeRow { compost_kg: number; landfill_kg: number; transfer_kg: number; other_kg: number; }
export interface Capacity {
  referenceCapacityMtDay: number;
  recordedTodayMt: number;
  referenceUtilisationPct: number;
  label: string;
}
export interface ReconciliationRow {
  lga_name: string;
  declared_kg: number;
  received_kg: number;
  allocated_kg: number;
  declaredMinusReceived: number;
  receivedMinusAllocated: number;
}
export interface ExceptionRow {
  id: string;
  entity_type: string;
  entity_id: string | null;
  exception_type: string;
  severity: string;
  description: string;
  status: string;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
}
export interface ExceptionsSummary {
  critical: number;
  warning: number;
  open: number;
  resolved: number;
}

export interface TraceStep { label: string; detail: string | null; at: string | null; completed: boolean; }
export interface Trace {
  load: Load;
  steps: TraceStep[];
  reconciliation: {
    declaredKg: number;
    receivedKg: number | null;
    allocatedKg: number;
    declaredMinusReceived: number | null;
    receivedMinusAllocated: number | null;
  };
}

export interface Transfer {
  id: string;
  shipment_code: string;
  destination_name: string;
  container_number: string | null;
  quantity_kg: string;
  dispatch_time: string | null;
  status: string;
  received_time: string | null;
  load_count?: number;
}

export interface AuditRow {
  id: number;
  entity_type: string;
  entity_id: string | null;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  user_name: string | null;
}

export interface ReportResult {
  title: string;
  periodLabel: string;
  generatedAt: string;
  filters: Record<string, unknown>;
  rowCount: number;
  rows: Array<Record<string, unknown>>;
}
