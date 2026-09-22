// Import demo adapter
import { demoApi } from './demoAdapter';

const API_BASE: string = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

const TOKEN_KEY = 'wasteflow_token';
const USER_KEY = 'wasteflow_user';

// Demo mode detection
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function getStoredUser<T>(): T | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}
export function setStoredUser(user: unknown | null): void {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code?: string; message?: string; field?: string };
}

/** Route demo API requests to the demo adapter */
async function demoRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = new URL(path, 'http://localhost');
  const pathname = url.pathname;
  const method = init.method?.toUpperCase() ?? 'GET';
  const body = init.body ? JSON.parse(init.body as string) : undefined;

  // Login
  if (pathname === '/auth/login' && method === 'POST') {
    return await demoApi.login(body.username, body.password) as T;
  }

  // Dashboard
  if (pathname === '/dashboard/summary') return await demoApi.getDashboardSummary() as T;
  if (pathname === '/dashboard/by-lga') return await demoApi.getDashboardByLga() as T;
  if (pathname === '/dashboard/by-category') return await demoApi.getDashboardByCategory() as T;
  if (pathname === '/dashboard/trends') return await demoApi.getDashboardTrends() as T;
  if (pathname === '/dashboard/outcome') return await demoApi.getDashboardOutcome() as T;
  if (pathname === '/dashboard/capacity') return await demoApi.getDashboardCapacity() as T;

  // Trips
  if (pathname === '/trips') return await demoApi.getTrips() as T;

  // Loads
  if (pathname === '/loads' && method === 'GET') {
    const searchParams = url.searchParams;
    if (searchParams.has('q')) {
      return await demoApi.searchLoads(searchParams.get('q')!) as T;
    }
    return await demoApi.getLoads() as T;
  }
  if (pathname.match(/\/loads\/[^/]+\/receive/) && method === 'POST') {
    const loadCode = pathname.split('/')[2];
    await demoApi.receiveLoad(loadCode, body);
    return undefined as T;
  }
  if (pathname.match(/\/loads\/[^/]+\/process/) && method === 'POST') {
    const loadCode = pathname.split('/')[2];
    await demoApi.processLoad(loadCode, body);
    return undefined as T;
  }
  if (pathname.match(/\/loads\/[^/]+\/trace/) && method === 'GET') {
    const loadCode = pathname.split('/')[2];
    return await demoApi.getLoadTrace(loadCode) as T;
  }

  // Transfers
  if (pathname === '/transfers' && method === 'GET') return await demoApi.getTransfers() as T;
  if (pathname === '/transfers' && method === 'POST') {
    await demoApi.createTransfer(body);
    return undefined as T;
  }
  if (pathname.match(/\/transfers\/[^/]+\/receive/) && method === 'POST') {
    const transferId = pathname.split('/')[2];
    await demoApi.receiveTransfer(transferId, body);
    return undefined as T;
  }

  // Exceptions
  if (pathname === '/exceptions' && method === 'GET') return await demoApi.getExceptions() as T;
  if (pathname === '/exceptions/summary' && method === 'GET') return await demoApi.getExceptionsSummary() as T;
  if (pathname.match(/\/exceptions\/[^/]+/) && method === 'PATCH') {
    const exceptionId = pathname.split('/')[2];
    await demoApi.updateException(exceptionId, body);
    return undefined as T;
  }

  // Audit Logs
  if (pathname === '/audit-logs' && method === 'GET') return await demoApi.getAuditLogs() as T;

  // Reports
  if (pathname.match(/\/reports\/[^/]+/) && method === 'GET') {
    const reportType = pathname.split('/')[2];
    return await demoApi.getReport(reportType) as T;
  }

  // Reconciliation
  if (pathname === '/reconciliation' && method === 'GET') return await demoApi.getReconciliation() as T;

  // Default: return empty data for unimplemented endpoints
  console.warn(`Demo adapter: unimplemented endpoint ${method} ${pathname}`);
  return undefined as T;
}

/** Single request helper. Throws ApiError for domain errors, TypeError for network failures. */
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Use demo adapter when in demo mode
  if (DEMO_MODE) {
    return await demoRequest<T>(path, init);
  }

  const token = getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
  const text = await response.text();
  let body: Envelope<T> | null = null;
  try {
    body = text ? (JSON.parse(text) as Envelope<T>) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const code = body?.error?.code ?? `HTTP_${response.status}`;
    const message = body?.error?.message ?? response.statusText ?? 'Request failed';
    throw new ApiError(code, message, response.status);
  }
  if (!body || body.success === false) {
    const code = body?.error?.code ?? 'UNKNOWN';
    const message = body?.error?.message ?? 'Request failed';
    throw new ApiError(code, message, response.status);
  }
  return body.data as T;
}

export const api = {
  base: API_BASE,
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) })
};

/** True when the failure is a network/offline problem (as opposed to a domain error). */
export function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError || (err instanceof ApiError && (err.status >= 500 || err.status === 404));
}
