import { Router } from 'express';
import { 
  savePayoutDetails, 
  getPayoutDetails, 
  getUserPayoutHistory,
  getAdminEligibleCreators,
  markAsPaidAdmin,
  remindCreatorPayoutDetails
} from '../controllers/payoutController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Admin-only guard: creator bank / UPI data must never reach non-admin tokens
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
};

// User endpoints
router.post('/details', authenticateToken, savePayoutDetails);
router.get('/details', authenticateToken, getPayoutDetails);
router.get('/my-history', authenticateToken, getUserPayoutHistory);

// Admin endpoints
router.get('/admin/creators', authenticateToken, requireAdmin, getAdminEligibleCreators);
router.post('/admin/mark-paid', authenticateToken, requireAdmin, markAsPaidAdmin);
router.post('/admin/remind-creator', authenticateToken, requireAdmin, remindCreatorPayoutDetails);

export default router;
