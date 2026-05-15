import Redis from 'ioredis';
import env from './env.js';

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // BullMQ 
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

//Connection success
redis.on('connect', () => {
  console.log('🟢 Redis connected');
});

//Ready (fully usable)
redis.on('ready', () => {
  console.log('🟢 Redis ready');
});

//MUST HAVE — prevents crash on Redis failure
redis.on('error', (err) => {
  console.error('🔴 Redis error:', err);
});

//Optional but useful
redis.on('close', () => {
  console.warn('🟡 Redis connection closed');
});

export default redis;