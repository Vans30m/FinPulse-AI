import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'finpulse-secret-key-123456';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  user?: {
    id: string;
    email: string;
  };
}

export function protect(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    // Try JWT Bearer token first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1] || '';
        try {
          const decoded = jwt.verify(token, JWT_SECRET as string) as any;
          req.userId = decoded.id || decoded.userId;
          req.userEmail = decoded.email;
          req.user = decoded;
          return next();
        } catch (err) {
          return res.status(401).json({ error: 'Unauthorized: Session is invalid or expired. Please sign in again.' });
        }
    }

    // Fallback: accept X-User-Id header (used by portfolio routes and Google OAuth users)
    const xUserId = req.headers['x-user-id'] as string;
    if (xUserId) {
      req.userId = xUserId;
      return next();
    }

    return res.status(401).json({ error: 'Unauthorized: No valid token or user ID provided' });
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}
