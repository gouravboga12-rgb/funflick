import { Router } from 'express';
import { 
  listVideos, 
  getMyMedia,
  getLikedVideos,
  createVideo, 
  toggleLike, 
  getComments, 
  addComment, 
  deleteComment, 
  recordView, 
  updateVideo, 
  deleteVideo 
} from '../controllers/videoController.js';
import { authenticateToken, optionalAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Public / Authenticated: Browse feed videos with personalized like state
router.get('/', optionalAuth, listVideos);

// Protected: Get authenticated user's own media library (independent per account)
router.get('/my-media', authenticateToken, getMyMedia);

// Protected: Get authenticated user's private liked videos
router.get('/liked', authenticateToken, getLikedVideos);

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
router.delete('/:id/comments/:commentId', authenticateToken, deleteComment);

export default router;

