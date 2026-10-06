import { Router } from 'express';
import { listConversations, getMessages, sendMessage } from '../controllers/messageController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Get list of active direct message conversations
router.get('/conversations', authenticateToken, listConversations);

// Get messages for a specific conversation / user
router.get('/:partnerId', authenticateToken, getMessages);

// Send message to a specific user
router.post('/:partnerId', authenticateToken, sendMessage);

export default router;
