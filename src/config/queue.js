import { Queue } from 'bullmq';
import redis from './redis.js';

export const clickQueue = new Queue('click-events', {
  connection: redis,
});