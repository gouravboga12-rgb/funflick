import { Router } from 'express';
import { listStories, createStory, deleteStory, toggleStoryLike, recordStoryView } from '../controllers/storyController.js';
import { authenticateToken, optionalAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', optionalAuth, listStories);
router.post('/', authenticateToken, createStory);
router.delete('/:id', authenticateToken, deleteStory);
router.post('/:id/like', authenticateToken, toggleStoryLike);
router.post('/:id/view', optionalAuth, recordStoryView);

export default router;
