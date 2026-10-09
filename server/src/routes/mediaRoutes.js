import { Router } from 'express';
import { getUploadUrl, downloadMedia } from '../controllers/mediaController.js';
import { optionalAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Presigned S3 upload URL generator (Allow optional auth so ad submissions & guests can also get upload URLs)
router.post('/upload-url', optionalAuth, getUploadUrl);

// Proxy media download route with attachment headers
router.get('/download', downloadMedia);

export default router;
