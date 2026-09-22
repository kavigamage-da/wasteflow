import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../http/asyncHandler';
import { ok, ApiError } from '../http/envelope';
import { authenticate, requireRole, scopeFor } from '../middleware/auth';
import { authRateLimit, apiRateLimit, writeRateLimit } from '../middleware/rateLimit';
import { authService } from '../services/authService';
import { tripService } from '../services/tripService';
import { loadService } from '../services/loadService';
import { receivingService } from '../services/receivingService';
import { processingService } from '../services/processingService';
import { transferService } from '../services/transferService';
import { dashboardService } from '../services/dashboardService';
import { exceptionService } from '../services/exceptionService';
import { reportService, toCsv, type ReportType } from '../services/reportService';
import { query } from '../db/pool';

export const api = Router();

const meta = (req: Request) => ({ ip: req.ip ?? null, deviceInfo: req.header('user-agent') ?? null });

function filtersFrom(req: Request) {
  return {
    from: typeof req.query.from === 'string' ? req.query.from : undefined,
    to: typeof req.query.to === 'string' ? req.query.to : undefined,
    lgaId: typeof req.query.lgaId === 'string' ? req.query.lgaId : undefined,
    facilityId: typeof req.query.facilityId === 'string' ? req.query.facilityId : undefined,
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    vehicleId: typeof req.query.vehicleId === 'string' ? req.query.vehicleId : undefined
  };
}

// ---------------------------------------------------------------------------
// Health (unauthenticated)
// ---------------------------------------------------------------------------
api.get('/health', (_req: Request, res: Response) => ok(res, { status: 'ok' }));

api.get(
  '/health/ready',
  asyncHandler(async (_req, res) => {
    await query('SELECT 1');
    ok(res, { status: 'ready', db: true });
  })
);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
const loginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });

api.post(
  '/auth/login',
  authRateLimit,
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    ok(res, await authService.login(body.username, body.password), 'Signed in');
  })
);

api.post(
  '/auth/refresh',
  authRateLimit,
  asyncHandler(async (req, res) => {
    const body = z.object({ refreshToken: z.string().min(1) }).parse(req.body);
    const { verifyRefreshToken, signAccessToken } = await import('../middleware/auth');
    const userId = verifyRefreshToken(body.refreshToken);
    const user = await authService.me(userId);
    const token = signAccessToken({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      lgaId: user.lgaId,
      facilityId: user.facilityId
    });
    ok(res, { accessToken: token }, 'Token refreshed');
  })
);

api.post(
  '/auth/logout',
  authenticate,
  asyncHandler(async (_req, res) => {
    ok(res, null, 'Signed out');
  })
);

api.get(
  '/auth/me',
  authenticate,
  asyncHandler(async (req, res) => {
    ok(res, await authService.me(req.user!.id));
  })
);

// ---------------------------------------------------------------------------
// Master data (read-only for all authenticated users)
// ---------------------------------------------------------------------------
api.get('/lgas', authenticate, asyncHandler(async (_req, res) => {
  const { rows } = await query(`SELECT id, code, name, type, active FROM lgas WHERE active ORDER BY name`);
  ok(res, rows);
}));

api.get('/facilities', authenticate, asyncHandler(async (_req, res) => {
  const { rows } = await query(`SELECT id, code, name, reference_capacity_mt_day, active FROM facilities ORDER BY name`);
  ok(res, rows);
}));

api.get('/vehicles', authenticate, asyncHandler(async (_req, res) => {
  const { rows } = await query(
    `SELECT id, vehicle_code, registration_number, vehicle_type, lga_id, capacity_kg, active FROM vehicles WHERE active ORDER BY vehicle_code`
  );
  ok(res, rows);
}));

api.get('/routes', authenticate, asyncHandler(async (_req, res) => {
  const { rows } = await query(`SELECT id, route_name, lga_id, source_area, active FROM routes WHERE active ORDER BY route_name`);
  ok(res, rows);
}));

api.get('/waste-categories', authenticate, asyncHandler(async (_req, res) => {
  const { rows } = await query(`SELECT id, code, name, active FROM waste_categories WHERE active ORDER BY name`);
  ok(res, rows);
}));

api.get('/measurement-methods', authenticate, asyncHandler(async (_req, res) => {
  const { rows } = await query(`SELECT id, code, name FROM measurement_methods ORDER BY name`);
  ok(res, rows);
}));

// ---------------------------------------------------------------------------
// Trips & collections
// ---------------------------------------------------------------------------
const TRIP_ROLES = ['SYSTEM_ADMINISTRATOR', 'LGA_OFFICER', 'COLLECTION_SUPERVISOR', 'DRIVER'] as const;

api.get(
  '/trips',
  authenticate,
  asyncHandler(async (req, res) => {
    const scope = scopeFor(req.user!);
    ok(res, await tripService.list({ ...filtersFrom(req), scopeLga: scope.lgaId }));
  })
);

const startTripSchema = z.object({
  clientGeneratedId: z.string().min(1),
  vehicleId: z.string().uuid(),
  routeId: z.string().uuid().nullish(),
  lgaId: z.string().uuid(),
  sourceArea: z.string().nullish()
});

api.post(
  '/trips',
  authenticate,
  requireRole(...TRIP_ROLES),
  asyncHandler(async (req, res) => {
    const body = startTripSchema.parse(req.body);
    ok(res, await tripService.start(req.user!, body, meta(req)), 'Trip started', 201);
  })
);

api.get(
  '/trips/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const scope = scopeFor(req.user!);
    ok(res, await tripService.get(req.params.id, scope.lgaId));
  })
);

const collectionSchema = z.object({
  clientGeneratedId: z.string().min(1),
  locationDescription: z.string().min(1),
  wasteCategory: z.string().min(1),
  measurementMethod: z.string().min(1),
  quantityKg: z.number().nonnegative(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  notes: z.string().nullish()
});

api.get(
  '/trips/:id/collections',
  authenticate,
  asyncHandler(async (req, res) => {
    const trip = await tripService.get(req.params.id);
    ok(res, trip.collections);
  })
);

api.post(
  '/trips/:id/collections',
  authenticate,
  requireRole(...TRIP_ROLES),
  asyncHandler(async (req, res) => {
    const body = collectionSchema.parse(req.body);
    ok(res, await tripService.addCollection(req.user!, req.params.id, body, meta(req)), 'Collection recorded', 201);
  })
);

api.post(
  '/trips/:id/start',
  authenticate,
  requireRole(...TRIP_ROLES),
  asyncHandler(async (req, res) => {
    ok(res, await tripService.get(req.params.id), 'Trip in progress');
  })
);

api.post(
  '/trips/:id/complete',
  authenticate,
  requireRole(...TRIP_ROLES),
  asyncHandler(async (req, res) => {
    ok(res, await tripService.complete(req.user!, req.params.id, meta(req)), 'Load generated');
  })
);

// ---------------------------------------------------------------------------
// Loads
// ---------------------------------------------------------------------------
api.get(
  '/loads',
  authenticate,
  asyncHandler(async (req, res) => {
    const scope = scopeFor(req.user!);
    ok(res, await loadService.list({ ...filtersFrom(req), scopeLga: scope.lgaId, scopeFacility: scope.facilityId }));
  })
);

// NOTE: declared before /loads/:id so it is not swallowed by the parameterised route.
api.get(
  '/loads/search',
  authenticate,
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    ok(res, await loadService.search(q));
  })
);

api.get(
  '/loads/:id/trace',
  authenticate,
  asyncHandler(async (req, res) => {
    ok(res, await loadService.trace(req.params.id));
  })
);

api.get(
  '/loads/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const scope = scopeFor(req.user!);
    ok(res, await loadService.get(req.params.id, scope.lgaId, scope.facilityId));
  })
);

// ---------------------------------------------------------------------------
// Receiving
// ---------------------------------------------------------------------------
const receiveSchema = z.object({
  receivedQuantityKg: z.number().nonnegative(),
  measurementMethod: z.string().min(1),
  condition: z.string().nullish(),
  discrepancyReason: z.string().nullish(),
  notes: z.string().nullish()
});

api.post(
  '/loads/:id/receive',
  authenticate,
  requireRole('FACILITY_RECEIVING_OFFICER', 'FACILITY_MANAGER', 'SYSTEM_ADMINISTRATOR'),
  writeRateLimit,
  asyncHandler(async (req, res) => {
    const body = receiveSchema.parse(req.body);
    ok(res, await receivingService.receive(req.user!, req.params.id, body, meta(req)), 'Load successfully received');
  })
);

api.get(
  '/receipts',
  authenticate,
  asyncHandler(async (req, res) => {
    const scope = scopeFor(req.user!);
    ok(res, await receivingService.list({ ...filtersFrom(req), facilityId: scope.facilityId ?? filtersFrom(req).facilityId }));
  })
);

// ---------------------------------------------------------------------------
// Processing
// ---------------------------------------------------------------------------
const processSchema = z.object({
  compostKg: z.number().nonnegative(),
  landfillKg: z.number().nonnegative(),
  transferKg: z.number().nonnegative(),
  otherKg: z.number().nonnegative(),
  incomplete: z.boolean().optional(),
  notes: z.string().nullish()
});

api.post(
  '/loads/:id/process',
  authenticate,
  requireRole('FACILITY_PROCESSING_OPERATOR', 'FACILITY_MANAGER', 'SYSTEM_ADMINISTRATOR'),
  writeRateLimit,
  asyncHandler(async (req, res) => {
    const body = processSchema.parse(req.body);
    ok(res, await processingService.process(req.user!, req.params.id, body, meta(req)), 'Processing recorded');
  })
);

api.get(
  '/processing',
  authenticate,
  asyncHandler(async (req, res) => {
    const scope = scopeFor(req.user!);
    ok(res, await processingService.list({ facilityId: scope.facilityId }));
  })
);

api.get('/compost-batches', authenticate, asyncHandler(async (_req, res) => {
  const { rows } = await query(
    `SELECT id, batch_code, input_kg, output_kg, residual_kg, processing_date, status FROM compost_batches ORDER BY created_at DESC`
  );
  ok(res, rows);
}));

api.post(
  '/compost-batches',
  authenticate,
  requireRole('FACILITY_PROCESSING_OPERATOR', 'FACILITY_MANAGER', 'SYSTEM_ADMINISTRATOR'),
  asyncHandler(async (req, res) => {
    const body = z.object({
      inputKg: z.number().nonnegative(),
      outputKg: z.number().nonnegative().optional(),
      residualKg: z.number().nonnegative().optional(),
      notes: z.string().nullish()
    }).parse(req.body);
    ok(res, await processingService.createCompostBatch(req.user!, body), 'Batch created', 201);
  })
);

// ---------------------------------------------------------------------------
// Transfers
// ---------------------------------------------------------------------------
const transferSchema = z.object({
  sourceFacilityId: z.string().uuid().nullish(),
  destinationName: z.string().min(1),
  containerNumber: z.string().nullish(),
  quantityKg: z.number().nonnegative(),
  dispatchTime: z.string().nullish(),
  loadIds: z.array(z.string().uuid()).optional()
});

api.post(
  '/transfers',
  authenticate,
  requireRole('FACILITY_PROCESSING_OPERATOR', 'FACILITY_MANAGER', 'SYSTEM_ADMINISTRATOR'),
  writeRateLimit,
  asyncHandler(async (req, res) => {
    const body = transferSchema.parse(req.body);
    ok(res, await transferService.create(req.user!, body, meta(req)), 'Shipment created', 201);
  })
);

api.get('/transfers', authenticate, asyncHandler(async (req, res) => {
  ok(res, await transferService.list(filtersFrom(req)));
}));

api.get('/transfers/:id', authenticate, asyncHandler(async (req, res) => {
  ok(res, await transferService.get(req.params.id));
}));

api.post(
  '/transfers/:id/receive',
  authenticate,
  requireRole('FACILITY_RECEIVING_OFFICER', 'FACILITY_MANAGER', 'SYSTEM_ADMINISTRATOR'),
  asyncHandler(async (req, res) => {
    const body = z.object({ receivedQuantityKg: z.number().nonnegative() }).parse(req.body);
    ok(res, await transferService.receive(req.user!, req.params.id, body.receivedQuantityKg, meta(req)), 'Shipment receipt recorded');
  })
);

// ---------------------------------------------------------------------------
// Exceptions
// ---------------------------------------------------------------------------
api.get('/exceptions', authenticate, asyncHandler(async (req, res) => {
  ok(res, await exceptionService.list(filtersFrom(req)));
}));

api.get('/exceptions/summary', authenticate, asyncHandler(async (_req, res) => {
  ok(res, await dashboardService.exceptionsSummary());
}));

api.patch(
  '/exceptions/:id',
  authenticate,
  requireRole('COLLECTION_SUPERVISOR', 'LGA_OFFICER', 'FACILITY_MANAGER', 'SYSTEM_ADMINISTRATOR'),
  asyncHandler(async (req, res) => {
    const body = z.object({
      status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED']).optional(),
      assignedTo: z.string().uuid().nullish(),
      resolution: z.string().nullish()
    }).parse(req.body);
    ok(res, await exceptionService.update(req.user!, req.params.id, body, meta(req)), 'Exception updated');
  })
);

// ---------------------------------------------------------------------------
// Dashboard & reconciliation
// ---------------------------------------------------------------------------
api.get('/dashboard/summary', authenticate, asyncHandler(async (req, res) => {
  ok(res, await dashboardService.summary(filtersFrom(req)));
}));
api.get('/dashboard/by-lga', authenticate, asyncHandler(async (req, res) => {
  ok(res, await dashboardService.byLga(filtersFrom(req)));
}));
api.get('/dashboard/by-category', authenticate, asyncHandler(async (req, res) => {
  ok(res, await dashboardService.byCategory(filtersFrom(req)));
}));
api.get('/dashboard/trends', authenticate, asyncHandler(async (req, res) => {
  ok(res, await dashboardService.trends(filtersFrom(req)));
}));
api.get('/dashboard/outcome', authenticate, asyncHandler(async (req, res) => {
  ok(res, await dashboardService.outcome(filtersFrom(req)));
}));
api.get('/dashboard/exceptions', authenticate, asyncHandler(async (_req, res) => {
  ok(res, await dashboardService.exceptionsSummary());
}));
api.get('/dashboard/capacity', authenticate, asyncHandler(async (_req, res) => {
  ok(res, await dashboardService.capacity());
}));
api.get('/reconciliation', authenticate, asyncHandler(async (req, res) => {
  ok(res, await dashboardService.reconciliation(filtersFrom(req)));
}));

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
const REPORT_TYPES: ReportType[] = [
  'daily', 'monthly', 'vehicles', 'lgas', 'processing', 'transfers', 'exceptions', 'data-quality', 'traceability'
];

api.get(
  '/reports/:type',
  authenticate,
  requireRole('PROVINCIAL_OFFICER', 'LGA_OFFICER', 'COLLECTION_SUPERVISOR', 'FACILITY_MANAGER', 'SYSTEM_ADMINISTRATOR'),
  asyncHandler(async (req, res) => {
    const type = req.params.type as ReportType;
    if (!REPORT_TYPES.includes(type)) throw ApiError.validation(`Unknown report type: ${type}`);
    const rows = await reportService.generate(type, filtersFrom(req));
    const format = typeof req.query.format === 'string' ? req.query.format : 'json';

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="wasteflow-${type}.csv"`);
      res.send(toCsv(rows));
      return;
    }

    const description = reportService.describe(type);
    ok(res, {
      ...description,
      generatedAt: new Date().toISOString(),
      filters: filtersFrom(req),
      rowCount: rows.length,
      rows
    });
  })
);

// ---------------------------------------------------------------------------
// Audit logs (read-only; no delete endpoint exists anywhere)
// ---------------------------------------------------------------------------
api.get(
  '/audit-logs',
  authenticate,
  requireRole('SYSTEM_ADMINISTRATOR', 'FACILITY_MANAGER'),
  asyncHandler(async (req, res) => {
    const params: unknown[] = [];
    const clauses: string[] = [];
    if (typeof req.query.entityType === 'string') {
      params.push(req.query.entityType);
      clauses.push(`entity_type = $${params.length}`);
    }
    if (typeof req.query.entityId === 'string') {
      params.push(req.query.entityId);
      clauses.push(`entity_id = $${params.length}`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT a.id, a.entity_type, a.entity_id, a.action, a.old_values, a.new_values, a.created_at,
              u.name AS user_name
       FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
       ${where} ORDER BY a.created_at DESC LIMIT 300`,
      params
    );
    ok(res, rows);
  })
);
