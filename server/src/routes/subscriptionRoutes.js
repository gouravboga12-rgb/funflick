import { Router } from 'express';
import { 
  getActivePlans, 
  getAllPlansAdmin, 
  updatePlanAdmin, 
  createPlanAdmin, 
  deletePlanAdmin, 
  subscribeUser 
} from '../controllers/subscriptionController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Public / User side: get active plans
router.get('/plans', getActivePlans);

// User side: activate subscription
router.post('/subscribe', authenticateToken, subscribeUser);

// Admin endpoints
router.get('/admin/plans', authenticateToken, getAllPlansAdmin);
router.post('/admin/plans', authenticateToken, createPlanAdmin);
router.put('/admin/plans/:id', authenticateToken, updatePlanAdmin);
router.delete('/admin/plans/:id', authenticateToken, deletePlanAdmin);

export default router;
