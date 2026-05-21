import {
  shortenUrl,
  resolveUrl,
  getUrlsByUser,
  deleteUrlByCode,
  getUrlStats
} from '../services/url.service.js';

import { clickQueue } from '../config/queue.js';
import crypto from 'crypto';

import { searchUrls } from '../services/url.service.js';

// POST /api/urls
export async function createShortUrl(req, res) {
  const { original_url } = req.body;

  const userId = req.user?.userId || null;

  const shortUrl = await shortenUrl(original_url, userId);

  res.status(201).json({
    shortUrl,
    originalUrl: original_url,
  });
}

// GET /:code

export async function redirectUrl(req, res) {
  const { code } = req.params;

  const { id, originalUrl } = await resolveUrl(code);

  // Hash IP (privacy-safe)
  const ip = req.ip;
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

  // Add async job (DO NOT await)
  clickQueue.add('click', {
    urlId: id,
    userAgent: req.headers['user-agent'] || '',
    ipHash,
    timestamp: Date.now(),
  });

  res.redirect(302, originalUrl);
}


// GET /api/urls
export async function getUserUrls(req, res) {
  const userId = req.user.userId;

  const urls = await getUrlsByUser(userId);

  const formatted = urls.map((url) => ({
  shortCode: url.short_code,
  originalUrl: url.original_url,
  clickCount: Number(url.click_count),
  createdAt: url.created_at,
  }));

  res.status(200).json(formatted);
}

// DELETE /api/urls/:code
export async function deleteUrl(req, res) {
  const userId = req.user.userId;
  const { code } = req.params;

  await deleteUrlByCode(code, userId);

  res.status(204).send();
}

export async function getUrlStatsController(req, res) {
  const userId = req.user.userId;
  const { code } = req.params;

  const stats = await getUrlStats(code, userId);

  res.status(200).json(stats);
}

export async function searchUrlsController(req, res) {
  const { q } = req.query;

  const results = await searchUrls(q);

  res.status(200).json(results);
}