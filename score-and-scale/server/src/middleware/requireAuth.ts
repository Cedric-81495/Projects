import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  userId: string;
  role: 'user' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken;

  // No cookie at all = guest / never logged in. Distinct from an expired
  // token so the client doesn't bother calling /refresh for plain guests.
  if (!token) {
    return res.status(401).json({ code: 'NOT_AUTHENTICATED', error: 'No active session' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    // Cookie was present but invalid/expired — this IS worth a refresh attempt.
    return res.status(401).json({ code: 'TOKEN_EXPIRED', error: 'Access token expired' });
  }
}
