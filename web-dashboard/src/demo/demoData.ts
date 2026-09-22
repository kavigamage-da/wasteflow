/**
 * SYNTHETIC / DEMO DATA ONLY.
 *
 * Used when the backend is unreachable so the dashboard remains fully explorable.
 * It is NOT Monroviawatta operational data and is always surfaced with a DEMO banner.
 */
import type {
  AuditRow,
  ByCategoryRow,
  ByLgaRow,
  Capacity,
  DashboardSummary,
  ExceptionRow,
  Load,
  OutcomeRow,
  ReconciliationRow,
  Trace,
  Transfer,
  TrendRow,
  Trip
} from '../api/types';

const now = Date.now();
const iso = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();

export const DEMO_LGAS = [
  'Galle Municipal Council',
  'Hikkaduwa Urban Council',
  'Rajgama Pradeshiya Sabha',
  'Bope-Poddala Pradeshiya Sabha',
  'Balapitiya Pradeshiya Sabha'
];

export const demoLoads: Load[] = [
  {
    id: 'd1', loadCode: 'LD-DEMO-001', tripId: 't1', tripCode: 'TR-DEMO-001', vehicleLabel: 'DEMO-001',
    lgaName: 'Galle Municipal Council', sourceArea: 'Galle Fort Market', wasteCategory: 'BIODEGRADABLE',
    measurementMethod: 'MANUAL_ESTIMATE', declaredQuantityKg: 2600, status: 'COMPLETED', arrivalTime: iso(120),
    receivedQuantityKg: 2550, receivingMethod: 'WEIGHBRIDGE', condition: 'Normal', discrepancyFlag: true,
    discrepancyReason: 'Moisture loss in transit (demo reason)', receivedBy: 'Demo Receiving',
    compostKg: 1700, landfillKg: 650, transferKg: 200, otherKg: 0, processingIncomplete: false,
    processedBy: 'Demo Processing', createdAt: iso(180), updatedAt: iso(60)
  },
  {
    id: 'd2', loadCode: 'LD-DEMO-002', tripId: 't2', tripCode: 'TR-DEMO-002', vehicleLabel: 'DEMO-002',
    lgaName: 'Galle Municipal Council', sourceArea: 'Karapitiya', wasteCategory: 'MIXED',
    measurementMethod: 'VEHICLE_CAPACITY_ESTIMATE', declaredQuantityKg: 3100, status: 'RECEIVED', arrivalTime: iso(90),
    receivedQuantityKg: 3100, receivingMethod: 'WEIGHBRIDGE', condition: 'Normal', discrepancyFlag: false,
    discrepancyReason: null, receivedBy: 'Demo Receiving', compostKg: null, landfillKg: null, transferKg: null,
    otherKg: null, processingIncomplete: true, processedBy: null, createdAt: iso(95), updatedAt: iso(90)
  },
  {
    id: 'd3', loadCode: 'LD-DEMO-003', tripId: 't3', tripCode: 'TR-DEMO-003', vehicleLabel: 'DEMO-003',
    lgaName: 'Hikkaduwa Urban Council', sourceArea: 'Hikkaduwa Town', wasteCategory: 'RECYCLABLE',
    measurementMethod: 'SCALE', declaredQuantityKg: 1700, status: 'SUBMITTED', arrivalTime: null,
    receivedQuantityKg: null, receivingMethod: null, condition: null, discrepancyFlag: false,
    discrepancyReason: null, receivedBy: null, compostKg: null, landfillKg: null, transferKg: null,
    otherKg: null, processingIncomplete: true, processedBy: null, createdAt: iso(40), updatedAt: iso(40)
  },
  {
    id: 'd4', loadCode: 'LD-DEMO-004', tripId: 't4', tripCode: 'TR-DEMO-004', vehicleLabel: 'DEMO-001',
    lgaName: 'Rajgama Pradeshiya Sabha', sourceArea: 'Rajgama', wasteCategory: 'BIODEGRADABLE',
    measurementMethod: 'WEIGHBRIDGE', declaredQuantityKg: 2000, status: 'PROCESSING', arrivalTime: iso(480),
    receivedQuantityKg: 2000, receivingMethod: 'WEIGHBRIDGE', condition: 'Normal', discrepancyFlag: false,
    discrepancyReason: null, receivedBy: 'Demo Receiving', compostKg: 1400, landfillKg: 400, transferKg: 0,
    otherKg: 0, processingIncomplete: true, processedBy: 'Demo Processing', createdAt: iso(540), updatedAt: iso(360)
  },
  {
    id: 'd5', loadCode: 'LD-DEMO-005', tripId: 't5', tripCode: 'TR-DEMO-005', vehicleLabel: 'DEMO-003',
    lgaName: 'Hikkaduwa Urban Council', sourceArea: 'Hikkaduwa Beach', wasteCategory: 'UNKNOWN',
    measurementMethod: 'UNKNOWN', declaredQuantityKg: 950, status: 'EXCEPTION', arrivalTime: iso(200),
    receivedQuantityKg: 800, receivingMethod: 'MANUAL_ESTIMATE', condition: 'Unusual waste', discrepancyFlag: true,
    discrepancyReason: 'Unidentified stream — pending classification (demo)', receivedBy: 'Demo Receiving',
    compostKg: null, landfillKg: null, transferKg: null, otherKg: null, processingIncomplete: true,
    processedBy: null, createdAt: iso(240), updatedAt: iso(200)
  }
];

export const demoTrips: Trip[] = demoLoads.map((l, i) => ({
  id: `t${i + 1}`,
  tripCode: l.tripCode ?? `TR-DEMO-00${i + 1}`,
  vehicleId: `veh-${i + 1}`,
  routeId: null,
  lgaId: 'lga',
  sourceArea: l.sourceArea,
  status: l.status === 'SUBMITTED' ? 'SUBMITTED' : 'COMPLETED',
  startTime: iso(200 + i * 20),
  endTime: iso(150 + i * 20),
  declaredQuantityKg: l.declaredQuantityKg
}));

export const demoSummary: DashboardSummary = {
  totalLoadsToday: 5,
  totalRecordedKg: 10350,
  totalReceivedKg: 8450,
  totalProcessedKg: 5550,
  totalTransferredKg: 200,
  openExceptions: 2
};

export const demoByLga: ByLgaRow[] = [
  { lga_name: 'Galle Municipal Council', recorded_kg: 5700, loads: 2 },
  { lga_name: 'Hikkaduwa Urban Council', recorded_kg: 2650, loads: 2 },
  { lga_name: 'Rajgama Pradeshiya Sabha', recorded_kg: 2000, loads: 1 }
];

export const demoByCategory: ByCategoryRow[] = [
  { category: 'BIODEGRADABLE', recorded_kg: 4600, loads: 2 },
  { category: 'MIXED', recorded_kg: 3100, loads: 1 },
  { category: 'RECYCLABLE', recorded_kg: 1700, loads: 1 },
  { category: 'UNKNOWN', recorded_kg: 950, loads: 1 }
];

export const demoTrend: TrendRow[] = Array.from({ length: 7 }).map((_, i) => ({
  day: new Date(now - (6 - i) * 86_400_000).toISOString().slice(0, 10),
  recorded_kg: 6000 + Math.round(Math.sin(i) * 1800) + i * 420,
  received_kg: 5700 + Math.round(Math.cos(i) * 1500) + i * 380
}));

export const demoOutcome: OutcomeRow = {
  compost_kg: 3100, landfill_kg: 2150, transfer_kg: 300, other_kg: 0
};

export const demoCapacity: Capacity = {
  referenceCapacityMtDay: 40,
  recordedTodayMt: 8.35,
  referenceUtilisationPct: 20.9,
  label: 'Reference capacity — configurable administrative value'
};

export const demoReconciliation: ReconciliationRow[] = [
  { lga_name: 'Galle Municipal Council', declared_kg: 5700, received_kg: 5650, allocated_kg: 5550, declaredMinusReceived: -50, receivedMinusAllocated: 100 },
  { lga_name: 'Hikkaduwa Urban Council', declared_kg: 2650, received_kg: 2300, allocated_kg: 0, declaredMinusReceived: -350, receivedMinusAllocated: 2300 },
  { lga_name: 'Rajgama Pradeshiya Sabha', declared_kg: 2000, received_kg: 2000, allocated_kg: 1800, declaredMinusReceived: 0, receivedMinusAllocated: 200 }
];

export const demoExceptions: ExceptionRow[] = [
  { id: 'e1', entity_type: 'load', entity_id: 'd1', exception_type: 'QUANTITY_MISMATCH', severity: 'WARNING', description: 'Declared 2,600 kg / received 2,550 kg (difference -50 kg). Reason recorded.', status: 'OPEN', resolution: null, resolved_at: null, created_at: iso(120) },
  { id: 'e2', entity_type: 'load', entity_id: 'd5', exception_type: 'QUANTITY_MISMATCH', severity: 'CRITICAL', description: 'Unidentified stream: declared 950 kg / received 800 kg (difference -150 kg).', status: 'OPEN', resolution: null, resolved_at: null, created_at: iso(200) },
  { id: 'e3', entity_type: 'transfer_shipment', entity_id: 's1', exception_type: 'TRANSFER_AWAITING_CONFIRMATION', severity: 'WARNING', description: 'Shipment TRF-DEMO-001 dispatched; destination confirmation outstanding.', status: 'IN_REVIEW', resolution: null, resolved_at: null, created_at: iso(300) }
];

export const demoTransfers: Transfer[] = [
  { id: 's1', shipment_code: 'TRF-DEMO-001', destination_name: 'Puttalam (experiment)', container_number: 'CONT-001', quantity_kg: '8000.00', dispatch_time: iso(300), status: 'AWAITING_CONFIRMATION', received_time: null, load_count: 3 },
  { id: 's2', shipment_code: 'TRF-DEMO-002', destination_name: 'Compost distribution partner', container_number: 'CONT-002', quantity_kg: '2500.00', dispatch_time: iso(600), status: 'RECEIVED', received_time: iso(400), load_count: 2 }
];

export const demoAudit: AuditRow[] = [
  { id: 3, entity_type: 'load', entity_id: 'LD-DEMO-001', action: 'RECEIVED', old_values: { status: 'SUBMITTED' }, new_values: { status: 'RECEIVED', received_quantity_kg: 2550 }, created_at: iso(120), user_name: 'Demo Receiving' },
  { id: 2, entity_type: 'load', entity_id: 'LD-DEMO-001', action: 'LOAD_CREATED', old_values: null, new_values: { loadCode: 'LD-DEMO-001', declared_quantity_kg: 2600 }, created_at: iso(180), user_name: 'Demo Driver' },
  { id: 1, entity_type: 'trip', entity_id: 'TR-DEMO-001', action: 'TRIP_STARTED', old_values: null, new_values: { tripCode: 'TR-DEMO-001' }, created_at: iso(200), user_name: 'Demo Driver' }
];

export function demoTrace(loadCode: string): Trace {
  const load = demoLoads.find((l) => l.loadCode === loadCode) ?? demoLoads[0];
  const allocated = (load.compostKg ?? 0) + (load.landfillKg ?? 0) + (load.transferKg ?? 0) + (load.otherKg ?? 0);
  return {
    load,
    steps: [
      { label: 'Created', detail: `Load ${load.loadCode}`, at: load.createdAt, completed: true },
      { label: 'Trip', detail: load.tripCode, at: load.createdAt, completed: true },
      { label: 'Collection Completed', detail: `Vehicle ${load.vehicleLabel}`, at: load.createdAt, completed: true },
      { label: 'Arrived Facility', detail: null, at: load.arrivalTime, completed: load.arrivalTime !== null },
      { label: 'Received', detail: load.receivedBy, at: load.arrivalTime, completed: load.receivedQuantityKg !== null },
      { label: 'Processed', detail: load.processedBy, at: load.updatedAt, completed: !load.processingIncomplete },
      { label: 'Final Outcome', detail: null, at: load.updatedAt, completed: !load.processingIncomplete }
    ],
    reconciliation: {
      declaredKg: load.declaredQuantityKg,
      receivedKg: load.receivedQuantityKg,
      allocatedKg: allocated,
      declaredMinusReceived: load.receivedQuantityKg === null ? null : load.receivedQuantityKg - load.declaredQuantityKg,
      receivedMinusAllocated: load.receivedQuantityKg === null ? null : load.receivedQuantityKg - allocated
    }
  };
}
