import { Router } from 'express';
import { 
  getAdminAds, 
  recordAdMetric, 
  createAdRequest, 
  getUserAdRequests 
} from '../controllers/adminController.js';
import { authenticateToken, optionalAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Public: Get all active advertisements for mobile app
router.get('/', getAdminAds);

// Public: Record ad impression or click
router.post('/:id/metric', recordAdMetric);

// Public / Authenticated: Submit a new ad request
router.post('/request', optionalAuth, createAdRequest);

// Authenticated: Get user's own submitted ad requests
router.get('/my-requests', authenticateToken, getUserAdRequests);

export default router;
