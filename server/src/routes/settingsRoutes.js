import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Public: Get global settings for media limits & playback
router.get('/', getSettings);

// Protected: Admin updates global settings
router.put('/', authenticateToken, updateSettings);

export default router;
