import { Router } from 'express';
import { listVideos, createVideo, toggleLike } from '../controllers/videoController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Public: Browse feed videos
router.get('/', listVideos);

// Protected: Publish video to feed
router.post('/', authenticateToken, createVideo);

// Protected: Like / Unlike video
router.post('/:id/like', authenticateToken, toggleLike);

export default router;
