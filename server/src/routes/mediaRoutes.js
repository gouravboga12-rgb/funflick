import { Router } from 'express';
import { getUploadUrl, downloadMedia } from '../controllers/mediaController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Presigned S3 upload URL generator (Requires auth)
router.post('/upload-url', authenticateToken, getUploadUrl);

// Proxy media download route with attachment headers
router.get('/download', downloadMedia);

export default router;
