import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { sendOtpEmail } from '../services/emailService.js';

// Helper to mask email (e.g. f***8@gmail.com)
function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Real-time username uniqueness check
 * Validates format and checks database
 */
export async function checkUsername(req, res) {
  try {
    const raw = req.query.username || req.body.username || '';
    const clean = raw.trim().toLowerCase().replace(/^@/, '');

    if (!clean) {
      return res.status(400).json({ error: 'Username is required', available: false });
    }

    // Instagram style format: letters, numbers, underscores, periods (3-30 chars)
    const validPattern = /^[a-z0-9_.]{3,30}$/;
    if (!validPattern.test(clean)) {
      return res.json({ 
        available: false, 
        username: clean,
        reason: 'Must be 3-30 characters with letters, numbers, underscores or periods only' 
      });
    }

    const [rows] = await pool.query(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      [clean]
    );

    if (rows.length > 0) {
      return res.json({ available: false, username: clean, reason: 'Username is already taken' });
    }

    return res.json({ available: true, username: clean });
  } catch (err) {
    console.error('Check username error:', err);
    return res.status(500).json({ error: 'Server error checking username' });
  }
}

/**
 * Step 1 of Registration: Validate input, create 6-digit OTP, send via Gmail SMTP
 */
export async function sendRegistrationOtp(req, res) {
  try {
    const { name, username, email, phone, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'Full name, unique username, email and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? phone.trim() : null;

    // Check username uniqueness
    const [existingUser] = await pool.query(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      [cleanUsername]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'This User ID is already taken. Please pick another one.' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const passwordHash = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const payload = JSON.stringify({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash
    });

    // Save in email_verifications table
    await pool.query(
      `INSERT INTO email_verifications (email, otp_code, type, target_username, payload, expires_at)
       VALUES (?, ?, 'registration', ?, ?, ?)`,
      [cleanEmail, otpCode, cleanUsername, payload, expiresAt]
    );

    // Send email via Gmail SMTP
    try {
      await sendOtpEmail({
        toEmail: cleanEmail,
        otpCode,
        username: cleanUsername,
        type: 'registration'
      });
      console.log(`✅ [SMTP] Sent registration OTP ${otpCode} to ${cleanEmail}`);
    } catch (mailErr) {
      console.error('❌ [SMTP] Error sending email:', mailErr);
      // Still allow flow in development with mock fallback
    }

    return res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      email: cleanEmail,
      username: cleanUsername
    });
  } catch (err) {
    console.error('Send registration OTP error:', err);
    return res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
  }
}

/**
 * Step 2 of Registration: Verify 6-digit OTP and commit user to database
 */
export async function verifyRegistrationOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit OTP are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    // Find valid OTP record
    const [records] = await pool.query(
      `SELECT * FROM email_verifications 
       WHERE email = ? AND otp_code = ? AND type = 'registration' AND expires_at > NOW() 
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail, cleanOtp]
    );

    if (records.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const record = records[0];
    const data = typeof record.payload === 'string' ? JSON.parse(record.payload) : record.payload;

    // Check again to ensure username is still free
    const [userExists] = await pool.query(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      [data.username]
    );

    if (userExists.length > 0) {
      return res.status(400).json({ error: 'This User ID was just claimed. Please register with another User ID.' });
    }

    // Insert user into users table (Email and phone can be shared across multiple accounts!)
    const [insertResult] = await pool.query(
      `INSERT INTO users (name, username, email, phone, password_hash, avatar_url, role)
       VALUES (?, ?, ?, ?, ?, ?, 'user')`,
      [
        data.name,
        data.username,
        data.email,
        data.phone || null,
        data.passwordHash,
        `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80`
      ]
    );

    // Delete used OTP
    await pool.query('DELETE FROM email_verifications WHERE id = ?', [record.id]);

    const token = jwt.sign(
      { id: insertResult.insertId, username: data.username, email: data.email, role: 'user' },
      process.env.JWT_SECRET || 'funflick_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(201).json({
      message: 'Account created and verified successfully!',
      token,
      user: {
        id: insertResult.insertId,
        name: data.name,
        username: data.username,
        email: data.email,
        phone: data.phone,
        avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80`,
        role: 'user'
      }
    });
  } catch (err) {
    console.error('Verify registration OTP error:', err);
    return res.status(500).json({ error: 'Failed to complete registration' });
  }
}

/**
 * Instagram-Style Login:
 * Accepts Identifier (Username, Email, or Phone Number) + Password.
 * If multiple accounts exist on the same email/phone:
 * - If passwords differ -> immediately logs into the matching account!
 * - If passwords are the same -> returns list of accounts for user to choose!
 */
export async function login(req, res) {
  try {
    const rawIdentifier = req.body.identifier || req.body.emailOrUsername;
    const { password } = req.body;

    if (!rawIdentifier || !password) {
      return res.status(400).json({ error: 'Username/Email/Phone and password are required' });
    }

    const clean = rawIdentifier.trim();
    const cleanHandle = clean.toLowerCase().replace(/^@/, '');

    // Search by username, email, or phone
    const [rows] = await pool.query(
      `SELECT * FROM users 
       WHERE username = ? 
          OR email = ? 
          OR phone = ? 
          OR phone = ?`,
      [cleanHandle, clean.toLowerCase(), clean, clean.replace(/^\+91/, '')]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'No account found with this username, email, or mobile number' });
    }

    // Check which account matches the password
    const matchingAccounts = [];
    for (const user of rows) {
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (isMatch) {
        matchingAccounts.push(user);
      }
    }

    if (matchingAccounts.length === 0) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    // Case 1: Exactly one account matched password -> instant login!
    if (matchingAccounts.length === 1) {
      const user = matchingAccounts[0];
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'funflick_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          avatar_url: user.avatar_url,
          bio: user.bio,
          role: user.role,
        },
      });
    }

    // Case 2: Multiple accounts share email/phone AND have the exact same password!
    // Return account choices (Instagram Account Chooser)
    return res.json({
      requiresAccountChoice: true,
      message: 'Multiple accounts found. Please choose an account to log in.',
      accounts: matchingAccounts.map(u => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        avatar_url: u.avatar_url
      }))
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
}

/**
 * Handle account selection if multiple accounts share email and password
 */
export async function selectAccountLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ? LIMIT 1',
      [cleanUsername]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password for this account' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'funflick_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatar_url,
        bio: user.bio,
        role: user.role,
      }
    });
  } catch (err) {
    console.error('Select account error:', err);
    return res.status(500).json({ error: 'Server error selecting account' });
  }
}

/**
 * Instagram-Style Password Reset Lookup:
 * Accepts Email or Username.
 * If Email -> Finds ALL accounts linked to this email, sends OTP to email.
 * If Username -> Finds that exact account, sends OTP to its linked email.
 */
export async function forgotPasswordLookup(req, res) {
  try {
    const raw = req.body.identifier || '';
    const clean = raw.trim();

    if (!clean) {
      return res.status(400).json({ error: 'Please enter your username, email address, or phone number' });
    }

    const cleanHandle = clean.toLowerCase().replace(/^@/, '');

    // Look for matching users
    const [rows] = await pool.query(
      `SELECT id, name, username, email, avatar_url FROM users 
       WHERE username = ? 
          OR email = ? 
          OR phone = ?`,
      [cleanHandle, clean.toLowerCase(), clean]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No FunFlicks account found with these details.' });
    }

    // Determine target email
    const targetEmail = rows[0].email;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store in email_verifications
    await pool.query(
      `INSERT INTO email_verifications (email, otp_code, type, target_username, expires_at)
       VALUES (?, ?, 'forgot_password', ?, ?)`,
      [targetEmail, otpCode, rows[0].username, expiresAt]
    );

    // Send email via Gmail SMTP
    try {
      await sendOtpEmail({
        toEmail: targetEmail,
        otpCode,
        username: rows.length === 1 ? rows[0].username : '',
        type: 'forgot_password'
      });
      console.log(`✅ [SMTP] Sent password reset OTP ${otpCode} to ${targetEmail}`);
    } catch (mailErr) {
      console.error('❌ [SMTP] Error sending reset email:', mailErr);
    }

    return res.json({
      success: true,
      message: `6-digit reset code sent to ${maskEmail(targetEmail)}`,
      emailMasked: maskEmail(targetEmail),
      targetEmail,
      accounts: rows.map(u => ({
        id: u.id,
        name: u.name,
        username: u.username,
        avatar_url: u.avatar_url
      }))
    });
  } catch (err) {
    console.error('Forgot password lookup error:', err);
    return res.status(500).json({ error: 'Failed to process password reset request' });
  }
}

/**
 * Complete Password Reset:
 * Validates OTP and updates password specifically for the target username!
 */
export async function forgotPasswordReset(req, res) {
  try {
    const { email, username, otp, newPassword } = req.body;

    if (!email || !username || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, username, OTP code, and new password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const cleanOtp = otp.toString().trim();

    // Verify OTP
    const [records] = await pool.query(
      `SELECT * FROM email_verifications 
       WHERE email = ? AND otp_code = ? AND type = 'forgot_password' AND expires_at > NOW() 
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail, cleanOtp]
    );

    if (records.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const record = records[0];
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password ONLY for that specific username!
    const [updateResult] = await pool.query(
      'UPDATE users SET password_hash = ? WHERE username = ?',
      [passwordHash, cleanUsername]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: 'User account not found' });
    }

    // Delete used OTP
    await pool.query('DELETE FROM email_verifications WHERE id = ?', [record.id]);

    return res.json({
      success: true,
      message: `Password for @${cleanUsername} updated successfully! You can now log in.`
    });
  } catch (err) {
    console.error('Password reset error:', err);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
}

/**
 * Get Current User Profile
 */
export async function getCurrentUser(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, username, email, phone, avatar_url, bio, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: rows[0] });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
}

/**
 * Google OAuth Login & Auto-Registration
 */
export async function googleLogin(req, res) {
  try {
    const { email, name, picture, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required from Google' });
    }

    const [existing] = await pool.query(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    let user;
    if (existing.length > 0) {
      user = existing[0];
      if (picture && !user.avatar_url) {
        await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [picture, user.id]);
        user.avatar_url = picture;
      }
    } else {
      const baseUsername = (name || email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .substring(0, 25);
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
      const username = `${baseUsername}_${uniqueSuffix}`;
      const dummyPasswordHash = await bcrypt.hash(`google_${googleId || Date.now()}`, 10);

      const [result] = await pool.query(
        'INSERT INTO users (name, username, email, password_hash, avatar_url, role) VALUES (?, ?, ?, ?, ?, ?)',
        [name || email.split('@')[0], username, email, dummyPasswordHash, picture || null, 'user']
      );

      const [newUserRows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newUserRows[0];
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'funflick_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      message: 'Google authentication successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatar_url,
        bio: user.bio,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(500).json({ error: 'Server error during Google authentication' });
  }
}
