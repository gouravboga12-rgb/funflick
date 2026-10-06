import { Router } from 'express';
import { followUser, unfollowUser, removeFollower, getFollowers, getFollowing } from '../controllers/followController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/:username/follow', authenticateToken, followUser);
router.post('/:username/unfollow', authenticateToken, unfollowUser);
router.delete('/:username/remove-follower', authenticateToken, removeFollower);
router.get('/:username/followers', authenticateToken, getFollowers);
router.get('/:username/following', authenticateToken, getFollowing);

export default router;
