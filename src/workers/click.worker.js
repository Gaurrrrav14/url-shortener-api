import { Worker } from 'bullmq';
import redis from '../config/redis.js';
import pool from '../config/db.js';

const worker = new Worker(
  'click-events',
  async (job) => {
    const { urlId, userAgent, ipHash, timestamp } = job.data;

    // 1. Insert into DB
    const query = `
      INSERT INTO clicks (url_id, user_agent, ip_hash, clicked_at)
      VALUES ($1, $2, $3, to_timestamp($4 / 1000.0));
    `;

    await pool.query(query, [urlId, userAgent, ipHash, timestamp]);

    // 2. Increment Redis counter (fast analytics)
    await redis.incr(`clicks:${urlId}`);
  },
  {
    connection: redis,
    concurrency: 10, // process multiple jobs in parallel
  }
);

// Logging (important for debugging)
worker.on('completed', (job) => {
  console.log(`Click processed for URL ${job.data.urlId}`);
});

worker.on('failed', (job, err) => {
  console.error(`Job failed for URL ${job?.data?.urlId}:`, err.message);
});

console.log('Click worker started');