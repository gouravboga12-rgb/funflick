import { Router } from 'express';
import { listStories, createStory, deleteStory } from '../controllers/storyController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', listStories);
router.post('/', authenticateToken, createStory);
router.delete('/:id', authenticateToken, deleteStory);

export default router;
