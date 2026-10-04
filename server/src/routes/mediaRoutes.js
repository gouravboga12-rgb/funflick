import { Router } from 'express';
import { getUploadUrl } from '../controllers/mediaController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Presigned S3 upload URL generator (Requires auth)
router.post('/upload-url', authenticateToken, getUploadUrl);

export default router;
