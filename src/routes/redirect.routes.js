import { Router } from 'express';
import { redirectUrl } from '../controllers/url.controller.js';
import { rateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// GET /:code
router.get('/:code', rateLimiter, redirectUrl);
export default router;


