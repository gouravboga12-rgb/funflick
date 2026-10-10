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
  getAdminInfluencerMedia,
  getAdminAdRequests,
  approveAdminAdRequest,
  rejectAdminAdRequest,
  deleteAdminAdRequest,
  getAdminStaff,
  createAdminStaff,
  updateAdminStaff,
  deleteAdminStaff,
  toggleAdminStaff
} from '../controllers/adminController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Middleware: Super Administrator privileges only
const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Super Administrator privileges required.' });
  }
  next();
};

// Middleware: Staff (Admin or Moderator) privileges
const requireStaffOrAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'moderator') {
    return res.status(403).json({ error: 'Access denied. Administrator or Moderator privileges required.' });
  }
  next();
};

// -------------------------------------------------------------
// Super Admin Only: System Stats, Users, Revenue, Staff Management
// -------------------------------------------------------------
router.get('/stats', authenticateToken, requireSuperAdmin, getAdminStats);
router.get('/users', authenticateToken, requireSuperAdmin, getAdminUsers);
router.put('/users/:id/status', authenticateToken, requireSuperAdmin, toggleUserStatus);
router.put('/users/:id/suspend', authenticateToken, requireSuperAdmin, suspendUserWithDuration);
router.put('/users/:id/reactivate', authenticateToken, requireSuperAdmin, reactivateUser);
router.get('/creators', authenticateToken, requireSuperAdmin, getAdminCreators);
router.get('/transactions', authenticateToken, requireSuperAdmin, getAdminTransactions);
router.get('/influencer-media', authenticateToken, requireSuperAdmin, getAdminInfluencerMedia);

// Moderator Staff Accounts Management (Super Admin only)
router.get('/staff', authenticateToken, requireSuperAdmin, getAdminStaff);
router.post('/staff', authenticateToken, requireSuperAdmin, createAdminStaff);
router.put('/staff/:id', authenticateToken, requireSuperAdmin, updateAdminStaff);
router.delete('/staff/:id', authenticateToken, requireSuperAdmin, deleteAdminStaff);
router.put('/staff/:id/toggle', authenticateToken, requireSuperAdmin, toggleAdminStaff);

// -------------------------------------------------------------
// Staff & Moderator Accessible Routes (5 permitted sections):
// 1. Reports
// 2. Content Moderation
// 3. Story Moderation
// 4. Ads List & Creation
// 5. Ad Requests
// -------------------------------------------------------------

// 1. Reports & User Help Support
router.get('/reports', authenticateToken, requireStaffOrAdmin, getAdminReports);
router.put('/reports/:id/resolve', authenticateToken, requireStaffOrAdmin, resolveAdminReport);
router.patch('/reports/:id/resolve', authenticateToken, requireStaffOrAdmin, resolveAdminReport);

// 2. Permanent Content Moderation (Videos, Reels, Photos, Posts)
router.get('/content', authenticateToken, requireStaffOrAdmin, getAdminContent);
router.get('/content/pending', authenticateToken, requireStaffOrAdmin, getAdminPendingContent);
router.put('/content/:id/moderate', authenticateToken, requireStaffOrAdmin, handleContentModeration);
router.delete('/content/:id', authenticateToken, requireStaffOrAdmin, deleteAdminContent);

// 3. Story Moderation (Active stories monitoring, immediate deletion, user suspension)
router.get('/stories', authenticateToken, requireStaffOrAdmin, getAdminActiveStories);
router.delete('/stories/:id', authenticateToken, requireStaffOrAdmin, deleteAdminStory);
router.put('/stories/users/:userId/suspend', authenticateToken, requireStaffOrAdmin, suspendUserWithDuration);
router.put('/stories/users/:userId/reactivate', authenticateToken, requireStaffOrAdmin, reactivateUser);

// 4. Ads Management
router.get('/ads', getAdminAds);
router.post('/ads', authenticateToken, requireStaffOrAdmin, createAdminAd);
router.delete('/ads/:id', authenticateToken, requireStaffOrAdmin, deleteAdminAd);
router.post('/ads/:id/metric', recordAdMetric);

// 5. Ad Requests & Ingestion Moderation
router.get('/ad-requests', authenticateToken, requireStaffOrAdmin, getAdminAdRequests);
router.put('/ad-requests/:id/approve', authenticateToken, requireStaffOrAdmin, approveAdminAdRequest);
router.put('/ad-requests/:id/reject', authenticateToken, requireStaffOrAdmin, rejectAdminAdRequest);
router.delete('/ad-requests/:id', authenticateToken, requireStaffOrAdmin, deleteAdminAdRequest);

export default router;

