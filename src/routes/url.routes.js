

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createShortUrl,
  getUserUrls,
  deleteUrl,
  getUrlStatsController
} from '../controllers/url.controller.js';
import { rateLimiter } from '../middleware/rateLimiter.middleware.js';
const router = Router();

// 🔒 Protected routes
router.post('/', authenticate, rateLimiter, createShortUrl);
router.get('/', authenticate, getUserUrls);
router.delete('/:code', authenticate, deleteUrl);
router.get('/:code/stats', authenticate, getUrlStatsController);

export default router;