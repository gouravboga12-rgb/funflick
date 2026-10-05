import { Router } from 'express';
import { listVideos, createVideo, toggleLike, getComments, addComment, recordView, updateVideo, deleteVideo } from '../controllers/videoController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Public: Browse feed videos
router.get('/', listVideos);

// Protected: Publish video to feed
router.post('/', authenticateToken, createVideo);

// Protected: Update video
router.put('/:id', authenticateToken, updateVideo);

// Protected: Delete video
router.delete('/:id', authenticateToken, deleteVideo);

// Protected: Like / Unlike video
router.post('/:id/like', authenticateToken, toggleLike);

// Public / Protected: View count increment
router.post('/:id/view', recordView);

// Public / Protected: Comments
router.get('/:id/comments', getComments);
router.post('/:id/comments', authenticateToken, addComment);

export default router;

