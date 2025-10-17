import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Malformed Authorization header' });
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('JWT_SECRET missing in environment variables');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    (req as any).user = decoded;
    next();
  });
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    (req as any).user = null;
    (req as any).isGuest = true;
    return next();
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    (req as any).user = null;
    (req as any).isGuest = true;
    return next();
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('JWT_SECRET missing in environment variables');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      (req as any).user = null;
      (req as any).isGuest = true;
    } else {
      (req as any).user = decoded;
      (req as any).isGuest = false;
    }
    next();
  });
};