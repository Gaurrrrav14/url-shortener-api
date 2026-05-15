import express from 'express';

import env from './src/config/env.js';
import pool from './src/config/db.js';
import redis from './src/config/redis.js';

import urlRoutes from './src/routes/url.routes.js';
import redirectRoutes from './src/routes/redirect.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import { ZodError } from 'zod';
import { AppError } from './src/utils/errors.js';

const app = express();

app.use(express.json());

/**
 * GET /health
 */
app.get('/health', async (req, res) => {
  let postgresStatus = 'down';
  let redisStatus = 'down';

  // Check Postgres
  try {
    await pool.query('SELECT 1');
    postgresStatus = 'up';
  } catch (err) {
    console.error('Postgres health check failed:', err.message);
  }

  // Check Redis
  try {
    const result = await redis.ping();
    if (result === 'PONG') {
      redisStatus = 'up';
    }
  } catch (err) {
    console.error('Redis health check failed:', err.message);
  }

  const isHealthy = postgresStatus === 'up' && redisStatus === 'up';

  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    postgres: postgresStatus,
    redis: redisStatus,
  });
});
/**
 * NEW: Auth routes (public)
 */
app.use('/api/auth', authRoutes);

/**
 * NEW: API routes
 */
app.use('/api/urls', urlRoutes);

/**
 * MUST BE LAST: redirect routes
 */
app.use('/', redirectRoutes);

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  // 1. Handle custom application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // 2. Handle Zod validation errors
//   if (err instanceof ZodError) {
//   return res.status(400).json({
//     error: 'Validation failed',
//     details: err.issues.map((e) => ({
//       field: e.path.join('.'),
//       message: e.message,
//     })),
//   });
// }

if (err instanceof ZodError) {
  return res.status(400).json({
    error: 'Validation failed',
    details: (err.issues || []).map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    })),
  });
}

  // 3. Unknown / unexpected errors (DO NOT leak details)
  console.error('Unhandled error:', err);

  return res.status(500).json({
    error: 'Internal Server Error',
  });
});

/**
 * Start server
 */
app.listen(env.PORT, () => {
  console.log(`🚀 Server running on port ${env.PORT}`);
});