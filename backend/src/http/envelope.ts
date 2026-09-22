import type { Response } from 'express';

/** Consistent success envelope: { success, data, message } */
export function ok<T>(res: Response, data: T, message?: string, status = 200): void {
  res.status(status).json({ success: true, data, message });
}

const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION_ERROR: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  IDEMPOTENT_REPLAY: 200,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500
};

/** Domain error carrying a machine code and an HTTP status. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly field?: string;

  constructor(code: string, message: string, field?: string) {
    super(message);
    this.code = code;
    this.status = STATUS_BY_CODE[code] ?? 400;
    this.field = field;
  }

  static validation(message: string, field?: string): ApiError {
    return new ApiError('VALIDATION_ERROR', message, field);
  }
  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError('FORBIDDEN', message);
  }
  static notFound(message = 'Not found'): ApiError {
    return new ApiError('NOT_FOUND', message);
  }
  static conflict(message: string): ApiError {
    return new ApiError('CONFLICT', message);
  }
  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError('UNAUTHORIZED', message);
  }
}
