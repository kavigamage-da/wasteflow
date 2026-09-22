import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { ApiError } from '../http/envelope';

export type RoleCode =
  | 'SYSTEM_ADMINISTRATOR'
  | 'PROVINCIAL_OFFICER'
  | 'LGA_OFFICER'
  | 'COLLECTION_SUPERVISOR'
  | 'DRIVER'
  | 'FACILITY_RECEIVING_OFFICER'
  | 'FACILITY_PROCESSING_OPERATOR'
  | 'FACILITY_MANAGER';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: RoleCode;
  lgaId: string | null;
  facilityId: string | null;
}

/** Access-token claims. Scope is derived from these server-side claims, never from the request body. */
export interface TokenClaims {
  sub: string;
  role: RoleCode;
  lgaId: string | null;
  facilityId: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signAccessToken(user: AuthUser): string {
  const claims: TokenClaims = {
    sub: user.id,
    role: user.role,
    lgaId: user.lgaId,
    facilityId: user.facilityId
  };
  return jwt.sign(claims, config.jwt.secret, { expiresIn: config.jwt.accessTtl as jwt.SignOptions['expiresIn'] });
}

export function signRefreshToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshTtl as jwt.SignOptions['expiresIn']
  });
}

export function verifyRefreshToken(token: string): string {
  const decoded = jwt.verify(token, config.jwt.refreshSecret) as jwt.JwtPayload;
  if (!decoded.sub) throw ApiError.unauthorized('Invalid refresh token');
  return String(decoded.sub);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Verifies the bearer token and attaches the authenticated user. */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    next(ApiError.unauthorized('Missing bearer token'));
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload & TokenClaims;
    req.user = {
      id: String(decoded.sub),
      name: '',
      username: '',
      role: decoded.role,
      lgaId: decoded.lgaId ?? null,
      facilityId: decoded.facilityId ?? null
    };
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

/** Requires the authenticated user to hold one of the given roles. */
export function requireRole(...roles: RoleCode[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden(`Role ${req.user.role} is not permitted for this operation`));
      return;
    }
    next();
  };
}

/**
 * Resolves the record scope for the current user. LGA and facility roles may only
 * touch records in their own scope; district-wide roles receive null (unrestricted).
 */
export function scopeFor(user: AuthUser): { lgaId: string | null; facilityId: string | null } {
  switch (user.role) {
    case 'SYSTEM_ADMINISTRATOR':
    case 'PROVINCIAL_OFFICER':
      return { lgaId: null, facilityId: null };
    case 'FACILITY_RECEIVING_OFFICER':
    case 'FACILITY_PROCESSING_OPERATOR':
    case 'FACILITY_MANAGER':
      return { lgaId: null, facilityId: user.facilityId };
    default:
      return { lgaId: user.lgaId, facilityId: null };
  }
}
