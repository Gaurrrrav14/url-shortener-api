import redis from '../config/redis.js';

const WINDOW_SIZE_IN_SECONDS = 60;
const MAX_REQUESTS = 60;

export async function rateLimiter(req, res, next) {
  const ip = req.ip.replace('::ffff:', '');
  const key = `rl:${ip}`;

  const now = Date.now();
  const windowStart = now - WINDOW_SIZE_IN_SECONDS * 1000;

  try {
    // =========================
    // ROUND TRIP 1: CLEAN + COUNT
    // =========================
    const multi = redis.multi();

    multi.zremrangebyscore(key, 0, windowStart); // remove old
    multi.zcard(key); // count current
    multi.zrange(key, 0, 0, 'WITHSCORES'); // oldest entry

    const results = await multi.exec();

    // Safer destructuring
    const [, requestCount] = results[1];
    const [, oldest] = results[2];

    if (requestCount >= MAX_REQUESTS) {
      let retryAfter = 1;

      if (oldest && oldest.length === 2) {
        const oldestTimestamp = parseInt(oldest[1], 10);
        const diff =
          WINDOW_SIZE_IN_SECONDS * 1000 - (now - oldestTimestamp);

        retryAfter = Math.max(1, Math.ceil(diff / 1000));
      }

      return res
        .status(429)
        .set('Retry-After', retryAfter)
        .json({
          status: 'error',
          message: 'Too many requests. Please try again later.',
        });
    }

    // =========================
    // ROUND TRIP 2: WRITE
    // =========================
    const writeMulti = redis.multi();

    writeMulti.zadd(key, now, now); // add current request
    writeMulti.expire(key, WINDOW_SIZE_IN_SECONDS); // auto cleanup

    await writeMulti.exec();

    next();
  } catch (err) {
    console.error('Rate limiter error:', err.message);

    // Fail open (important design choice)
    next();
  }
}