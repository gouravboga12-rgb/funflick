import { Router } from 'express';
import { 
  getAdminUsers, 
  toggleUserStatus, 
  suspendUserWithDuration,
  reactivateUser,
  getAdminCreators, 
  getAdminReports, 
  resolveAdminReport,
  getAdminContent,
  getAdminPendingContent,
  handleContentModeration,
  deleteAdminContent,
  getAdminActiveStories,
  deleteAdminStory,
  getAdminStats
} from '../controllers/adminController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Middleware ensuring admin role or token
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
};

router.get('/stats', authenticateToken, requireAdmin, getAdminStats);
router.get('/users', authenticateToken, requireAdmin, getAdminUsers);
router.put('/users/:id/status', authenticateToken, requireAdmin, toggleUserStatus);
router.put('/users/:id/suspend', authenticateToken, requireAdmin, suspendUserWithDuration);
router.put('/users/:id/reactivate', authenticateToken, requireAdmin, reactivateUser);
router.get('/creators', authenticateToken, requireAdmin, getAdminCreators);
router.get('/reports', authenticateToken, requireAdmin, getAdminReports);
router.put('/reports/:id/resolve', authenticateToken, requireAdmin, resolveAdminReport);

// Permanent content moderation (Videos, Reels, Photos, Posts)
router.get('/content', authenticateToken, requireAdmin, getAdminContent);
router.get('/content/pending', authenticateToken, requireAdmin, getAdminPendingContent);
router.put('/content/:id/moderate', authenticateToken, requireAdmin, handleContentModeration);
router.delete('/content/:id', authenticateToken, requireAdmin, deleteAdminContent);

// Story moderation (Active stories monitoring, immediate deletion, user suspension)
router.get('/stories', authenticateToken, requireAdmin, getAdminActiveStories);
router.delete('/stories/:id', authenticateToken, requireAdmin, deleteAdminStory);
router.put('/stories/users/:userId/suspend', authenticateToken, requireAdmin, suspendUserWithDuration);
router.put('/stories/users/:userId/reactivate', authenticateToken, requireAdmin, reactivateUser);

export default router;
