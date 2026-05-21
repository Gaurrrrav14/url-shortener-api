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
  countClicksByUrlId,
  countClicksLast24hByUrlId
} from '../repositories/url.repository.js';
import { NotFoundError } from '../utils/errors.js';
import { ForbiddenError } from '../utils/errors.js';

import redis from '../config/redis.js';

import { embeddingQueue } from "../config/queue.js";

import { searchUrlsByEmbedding } from '../repositories/url.repository.js';
import { generateEmbedding } from './embedding.service.js';

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

  await embeddingQueue.add("generate-embedding", {
  urlId: row.id,
  originalUrl: row.original_url,
});

  return `${env.BASE_URL}/${shortCode}`;
}

// Resolve URL
export async function resolveUrl(code) {
  const cacheKey = `url:${code}`;

  // 1. Try Redis cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached); // { id, originalUrl }
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

  const result = {
    id: row.id,
    originalUrl: row.original_url,
  };

  // 4. Store in Redis (cache-aside)
  try {
    await redis.setex(cacheKey, 3600, JSON.stringify(result)); // 1 hour TTL
  } catch (err) {
    console.error('Redis SET error:', err.message);
  }

  return result;
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

  // Ownership check
  if (row.user_id !== userId) {
    throw new ForbiddenError();
  }

  const urlId = row.id;

  // 1. Redis → total clicks (fast)
  let totalClicks = 0;
  try {
    const cached = await redis.get(`clicks:${urlId}`);
    totalClicks = cached ? Number(cached) : 0;
  } catch (err) {
    console.error('Redis GET error:', err.message);
  }

  // 2. Repository → last 24h clicks
  const clicksLast24h = await countClicksLast24hByUrlId(urlId);

  return {
    totalClicks,
    clicksLast24h,
    createdAt: row.created_at,
    originalUrl: row.original_url,
  };
}

export async function searchUrls(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('Invalid search query');
  }

  const cleanedQuery = query.trim();

  // ✅ Keep SAME input shape — just cleaner values
  const embedding = await generateEmbedding({
    title: cleanedQuery,
    description: "",
    originalUrl: "",
  });

  if (!embedding) {
    throw new Error('Failed to generate embedding');
  }

  const results = await searchUrlsByEmbedding(embedding);

  const formatted = results.map((row) => ({
    shortCode: row.short_code,
    originalUrl: row.original_url,
    title: row.page_title,
    summary: row.page_summary,
    similarity: Number((1 / (1 + row.distance)).toFixed(4)),
    createdAt: row.created_at,
  }));

  // ✅ IMPORTANT: re-sort globally by similarity
  // DISTINCT ON breaks global ordering otherwise
  return formatted.sort((a, b) => b.similarity - a.similarity);
}