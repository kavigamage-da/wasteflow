import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../http/envelope';

/** Maps domain and validation errors to the documented JSON error envelope. */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: first?.message ?? 'Validation failed',
        field: first?.path.join('.') || undefined
      }
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message, field: err.field }
    });
    return;
  }

  // Never leak internals to the client; log server-side only.
  // eslint-disable-next-line no-console
  console.error(`[${req.method} ${req.path}]`, err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
  });
}
