import { Router } from 'express';
import { listStories, createStory, deleteStory, toggleStoryLike } from '../controllers/storyController.js';
import { authenticateToken, optionalAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', optionalAuth, listStories);
router.post('/', authenticateToken, createStory);
router.delete('/:id', authenticateToken, deleteStory);
router.post('/:id/like', authenticateToken, toggleStoryLike);

export default router;
