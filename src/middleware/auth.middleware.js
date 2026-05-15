import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1. Validate Authorization header format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Unauthorized');
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // 3. Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    // 4. Continue
    next();
  } catch (err) {
    // Covers invalid, expired, malformed tokens
    throw new UnauthorizedError('Unauthorized');
  }
}