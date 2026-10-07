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
  getAdminStats,
  getAdminTransactions,
  getAdminAds,
  createAdminAd,
  deleteAdminAd,
  recordAdMetric,
  getAdminInfluencerMedia
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
router.patch('/reports/:id/resolve', authenticateToken, requireAdmin, resolveAdminReport);

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

// Admin subscription transaction ledger for revenue page
router.get('/transactions', authenticateToken, requireAdmin, getAdminTransactions);

// Influencer Media & Rewards review
router.get('/influencer-media', authenticateToken, requireAdmin, getAdminInfluencerMedia);

// Ads & In-App Promotions management
router.get('/ads', getAdminAds);
router.post('/ads', authenticateToken, requireAdmin, createAdminAd);
router.delete('/ads/:id', authenticateToken, requireAdmin, deleteAdminAd);
router.post('/ads/:id/metric', recordAdMetric);

export default router;

