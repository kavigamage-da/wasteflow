import rateLimit from 'express-rate-limit';
import { config } from '../config';

/**
 * Rate limiting configuration
 * 
 * Different limits for different endpoint types:
 * - Auth endpoints: Stricter limits to prevent brute force attacks
 * - API endpoints: Moderate limits to prevent abuse
 * - Public endpoints: Lenient limits to allow legitimate traffic
 */

// Auth endpoints (login, refresh) - stricter limits
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many authentication attempts. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.env === 'development' // Skip rate limiting in development
});

// General API endpoints - moderate limits
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please slow down.' } },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.env === 'development' // Skip rate limiting in development
});

// Write operations (POST, PATCH, DELETE) - stricter limits
export const writeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many write operations. Please slow down.' } },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.env === 'development' // Skip rate limiting in development
});
