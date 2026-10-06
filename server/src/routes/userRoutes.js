import { Router } from 'express';
import { searchUsers, getUserProfile } from '../controllers/userController.js';
import { optionalAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Search users & creators by query q, or list top active users
router.get('/search', optionalAuth, searchUsers);
router.get('/', optionalAuth, searchUsers);

// Get user profile summary
router.get('/:username', optionalAuth, getUserProfile);

export default router;
