import { Router } from 'express';
import { 
  getActivePlans, 
  getAllPlansAdmin, 
  updatePlanAdmin, 
  createPlanAdmin, 
  deletePlanAdmin, 
  subscribeUser,
  getUserSubscriptionStatus 
} from '../controllers/subscriptionController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Public / User side: get active plans
router.get('/plans', getActivePlans);

// User side: activate or extend subscription
router.post('/subscribe', authenticateToken, subscribeUser);

// User side: get subscription status, remaining validity and history
router.get('/my-status', authenticateToken, getUserSubscriptionStatus);

// Admin endpoints
router.get('/admin/plans', authenticateToken, getAllPlansAdmin);
router.post('/admin/plans', authenticateToken, createPlanAdmin);
router.put('/admin/plans/:id', authenticateToken, updatePlanAdmin);
router.delete('/admin/plans/:id', authenticateToken, deletePlanAdmin);

export default router;
