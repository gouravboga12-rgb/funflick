import { Router } from 'express';
import { listNotifications, markAllRead, clearAllNotifications } from '../controllers/notificationController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, listNotifications);
router.post('/mark-all-read', authenticateToken, markAllRead);
router.post('/read-all', authenticateToken, markAllRead);
router.delete('/', authenticateToken, clearAllNotifications);
router.post('/clear-all', authenticateToken, clearAllNotifications);

export default router;
