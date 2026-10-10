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
  googleLogin,
  googleSelectAccount,
  googleSignupComplete,
  googleAuthStart,
  googleAuthCallback,
  updateContactInfo,
  updateUserProfile,
  deleteAccount,
  adminLogin,
  getAdminMe
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

// Dedicated Admin Authentication (Separate from user app)
router.post('/admin-login', adminLogin);
router.get('/admin-me', authenticateToken, getAdminMe);

// Forgot Password flows (Instagram-style multi-account lookup & reset)
router.post('/forgot-password/lookup', forgotPasswordLookup);
router.post('/forgot-password/reset', forgotPasswordReset);

// Google OAuth (Browser redirect & deep-link flow)
router.get('/google/start', googleAuthStart);
router.get('/google/callback', googleAuthCallback);

// Google OAuth (Direct payload & legacy endpoints)
router.post('/google', googleLogin);
router.post('/google-login', googleLogin);
router.post('/google-select-account', googleSelectAccount);
router.post('/google-signup-complete', googleSignupComplete);

// Protected session check
router.get('/me', authenticateToken, getCurrentUser);

// Update user profile (name, username, bio, avatar)
router.put('/profile', authenticateToken, updateUserProfile);

// Update email & phone from Account Settings
router.put('/profile/contact', authenticateToken, updateContactInfo);

// Permanently delete user account
router.delete('/account', authenticateToken, deleteAccount);

export default router;

