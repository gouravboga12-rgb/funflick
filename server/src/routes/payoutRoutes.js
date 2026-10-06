import { Router } from 'express';
import { 
  savePayoutDetails, 
  getPayoutDetails, 
  getUserPayoutHistory,
  getAdminEligibleCreators,
  markAsPaidAdmin
} from '../controllers/payoutController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// User endpoints
router.post('/details', authenticateToken, savePayoutDetails);
router.get('/details', authenticateToken, getPayoutDetails);
router.get('/my-history', authenticateToken, getUserPayoutHistory);

// Admin endpoints
router.get('/admin/creators', authenticateToken, getAdminEligibleCreators);
router.post('/admin/mark-paid', authenticateToken, markAsPaidAdmin);

export default router;
