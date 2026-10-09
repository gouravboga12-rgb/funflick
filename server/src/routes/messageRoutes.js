import { Router } from 'express';
import { listConversations, getMessages, sendMessage, deleteMessage } from '../controllers/messageController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Get list of active direct message conversations
router.get('/conversations', authenticateToken, listConversations);

// Send message (via body recipientId)
router.post('/', authenticateToken, sendMessage);

// Send message to a specific user (via param)
router.post('/:partnerId', authenticateToken, sendMessage);

// Get messages for a specific conversation / user
router.get('/:partnerId', authenticateToken, getMessages);

// Delete / Unsend a message
router.delete('/:id', authenticateToken, deleteMessage);

export default router;
