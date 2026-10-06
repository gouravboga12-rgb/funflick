import { Router } from 'express';
import { 
  getAdminUsers, 
  toggleUserStatus, 
  getAdminCreators, 
  getAdminReports, 
  resolveAdminReport,
  getAdminPendingContent,
  handleContentModeration,
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
router.get('/creators', authenticateToken, requireAdmin, getAdminCreators);
router.get('/reports', authenticateToken, requireAdmin, getAdminReports);
router.put('/reports/:id/resolve', authenticateToken, requireAdmin, resolveAdminReport);
router.get('/content/pending', authenticateToken, requireAdmin, getAdminPendingContent);
router.put('/content/:id/moderate', authenticateToken, requireAdmin, handleContentModeration);

export default router;
