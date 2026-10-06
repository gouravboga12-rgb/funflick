import { Router } from 'express';
import { listNotifications, markAllRead } from '../controllers/notificationController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, listNotifications);
router.post('/mark-all-read', authenticateToken, markAllRead);

export default router;
