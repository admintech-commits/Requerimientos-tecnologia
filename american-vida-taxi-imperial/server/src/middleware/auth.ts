import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from '../lib/httpError.js';
import type { Role, User } from '../domain/types.js';

export interface AuthRequest extends Request {
  user?: User;
}

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new HttpError(401, 'Sesión requerida'));
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as User & { sub: number };
    req.user = { id: payload.sub, email: payload.email, name: payload.name, role: payload.role };
    next();
  } catch {
    next(new HttpError(401, 'Sesión inválida o expirada'));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new HttpError(403, 'No tienes permisos para esta acción'));
      return;
    }
    next();
  };
}
