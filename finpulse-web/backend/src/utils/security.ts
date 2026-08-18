import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Global rate limiter (200 requests per 15 mins)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200, // Limit each IP to 200 requests per 15 minutes
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// Stricter rate limiter for sensitive authentication & OTP routes to prevent brute-forcing
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // Limit each IP to 20 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many authentication or OTP attempts, please try again after 15 minutes.'
  }
});

// SQL Injection sanitizer patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|UNION|DROP|ALTER|CREATE|TRUNCATE|DATABASE|GRANT|REVOKE)\b)/i,
  /(--|#|\/\*|\*\/)/, // SQL comment markers
  /(\bor\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i, // OR '1'='1' style bypasses
  /(\band\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i, // AND '1'='1' style logic
  /UNION\s+(ALL\s+)?SELECT/i,
  /WAITFOR\s+DELAY/i, // Time-based injection
  /BENCHMARK\(/i      // Heavy execution injection
];

const SKIP_FIELDS = new Set(['profilePhoto', 'profile_photo', 'document', 'fileData', 'imageData']);

function containsSqlInjection(value: any, key: string | null = null): boolean {
  if (key && SKIP_FIELDS.has(key)) return false;

  if (typeof value === 'string') {
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(value)) {
        return true;
      }
    }
  } else if (value && typeof value === 'object') {
    for (const k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k)) {
        if (containsSqlInjection(value[k], k)) {
          return true;
        }
      }
    }
  }
  return false;
}

export const sqlInjectionSanitizer = (req: Request, res: Response, next: NextFunction) => {
  if (
    containsSqlInjection(req.body) ||
    containsSqlInjection(req.query) ||
    containsSqlInjection(req.params)
  ) {
    console.warn(`[SECURITY WARNING]: Blocked potential SQL Injection attack from IP: ${req.ip}`);
    return res.status(400).json({
      status: 400,
      message: 'Suspicious input detected. Request rejected for security purposes.'
    });
  }
  next();
};
