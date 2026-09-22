const API_BASE: string = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

const TOKEN_KEY = 'wasteflow_token';
const USER_KEY = 'wasteflow_user';

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

/** Single request helper. Throws ApiError for domain errors, TypeError for network failures. */
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
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
  return err instanceof TypeError || (err instanceof ApiError && err.status >= 500);
}
