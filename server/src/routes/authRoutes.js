import { Router } from 'express';
import { 
  checkUsername,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  login, 
  selectAccountLogin,
  forgotPasswordLookup,
  forgotPasswordReset,
  getCurrentUser, 
  googleLogin 
} from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Registration flow
router.get('/check-username', checkUsername);
router.post('/send-otp', sendRegistrationOtp);
router.post('/verify-otp', verifyRegistrationOtp);

// Login flows (Instagram-style multi-account resolution)
router.post('/login', login);
router.post('/select-account', selectAccountLogin);

// Forgot Password flows (Instagram-style multi-account lookup & reset)
router.post('/forgot-password/lookup', forgotPasswordLookup);
router.post('/forgot-password/reset', forgotPasswordReset);

// Google OAuth
router.post('/google', googleLogin);

// Protected session check
router.get('/me', authenticateToken, getCurrentUser);

export default router;
