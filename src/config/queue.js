import { Queue } from 'bullmq';
import redis from './redis.js';

export const clickQueue = new Queue('click-events', {
  connection: redis,
});

// NEW: Queue for embedding generation
export const embeddingQueue = new Queue("embedding-events", {
  connection: redis,
});