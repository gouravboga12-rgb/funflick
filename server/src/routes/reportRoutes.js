import { Router } from 'express';
import { createReport, getMyReports } from '../controllers/reportController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Submit a new content report (protected)
router.post('/', authenticateToken, createReport);

// View user's own submitted reports (protected)
router.get('/my-reports', authenticateToken, getMyReports);

export default router;
