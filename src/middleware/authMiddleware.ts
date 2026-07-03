import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SessionStore } from '../controllers/authController';
import { DBEngine } from '../db/db';
import { UserRole } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authorization token required. Please log in.' });
    return;
  }

  let userId: string | null = null;

  // Try to decode JWT first using the JWT_SECRET from environment
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_dev_secret') as any;
    userId = decoded.userId;
  } catch (err) {
    // Fallback to in-memory SessionStore (useful for sandbox development or backward compatibility)
    const session = SessionStore.get(token);
    if (session) {
      if (Date.now() > session.expiresAt) {
        SessionStore.delete(token);
      } else {
        userId = session.userId;
      }
    }
  }

  if (!userId) {
    res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    return;
  }

  const users = DBEngine.getUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    res.status(401).json({ error: 'User account not found.' });
    return;
  }

  // Attach user to the request object
  req.user = user;
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to access this resource.' });
      return;
    }

    next();
  };
}
