import { z } from 'zod';
import env from '../config/env.js';
import { encode } from '../utils/base62.js';
import {
  createUrl,
  updateShortCode,
  findByShortCode,
  findByUserId,
  deleteByCode,
  findByUserIdWithClicks,
  countClicksByUrlId
} from '../repositories/url.repository.js';
import { NotFoundError } from '../utils/errors.js';
import { ForbiddenError } from '../utils/errors.js';

import redis from '../config/redis.js';

const urlSchema = z.string().url();

export async function shortenUrl(originalUrl, userId = null) {
  let parsedUrl;

  try {
    parsedUrl = urlSchema.parse(originalUrl);
  } catch (err) {
    throw err;
  }

  const row = await createUrl(parsedUrl, userId);

  const shortCode = encode(row.id);

  await updateShortCode(row.id, shortCode);

  return `${env.BASE_URL}/${shortCode}`;
}

// Resolve URL
export async function resolveUrl(code) {
  const cacheKey = `url:${code}`;

  // 1. Try Redis cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (err) {
    console.error('Redis GET error:', err.message);
    // fail silently → fallback to DB
  }

  // 2. Fallback to DB
  const row = await findByShortCode(code);

  if (!row) {
    throw new NotFoundError('Short URL not found');
  }

  // 3. Expiry check (IMPORTANT: before caching)
  if (row.expires_at) {
    const now = new Date();
    const expiryDate = new Date(row.expires_at);

    if (now > expiryDate) {
      throw new NotFoundError('Short URL expired');
    }
  }

  const originalUrl = row.original_url;

  // 4. Store in Redis (cache-aside)
  try {
    await redis.setex(cacheKey, 3600, originalUrl); // 1 hour TTL
  } catch (err) {
    console.error('Redis SET error:', err.message);
  }

  return originalUrl;
}


// Get all URLs for a user
export async function getUrlsByUser(userId) {
  return findByUserIdWithClicks(userId);
}

// Delete a URL (with ownership enforcement)

export async function deleteUrlByCode(code, userId) {
  const deleted = await deleteByCode(code, userId);

  if (!deleted) {
    throw new NotFoundError('URL not found');
  }

  // Invalidate cache
  try {
    await redis.del(`url:${code}`);
  } catch (err) {
    console.error('Redis DEL error:', err.message);
  }
}

export async function getUrlStats(code, userId) {
  const row = await findByShortCode(code);

  if (!row) {
    throw new NotFoundError('URL not found');
  }

  // 🔐 Ownership check (CRITICAL)
  if (row.user_id !== userId) {
    throw new ForbiddenError();
  }

  const totalClicks = await countClicksByUrlId(row.id);

  return {
    totalClicks,
    createdAt: row.created_at,
    originalUrl: row.original_url,
  };
}