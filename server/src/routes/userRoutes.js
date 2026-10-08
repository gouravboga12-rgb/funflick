import { Router } from 'express';
import { 
  searchUsers, 
  getUserProfile, 
  getBlockedUsers, 
  blockUser, 
  unblockUser 
} from '../controllers/userController.js';
import { optionalAuth, authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Blocked users management (authenticated)
router.get('/blocked', authenticateToken, getBlockedUsers);
router.post('/block', authenticateToken, blockUser);
router.post('/unblock', authenticateToken, unblockUser);

// Search users & creators by query q, or list top active users
router.get('/search', optionalAuth, searchUsers);
router.get('/', optionalAuth, searchUsers);

// Get user profile summary
router.get('/:username', optionalAuth, getUserProfile);

export default router;
