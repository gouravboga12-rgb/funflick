import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Master Admin session token support
  if (token === 'local_admin_token_active') {
    req.user = {
      id: 999999,
      name: 'FunFlick Super Administrator',
      username: 'super_admin',
      email: 'funflick0308@gmail.com',
      role: 'admin',
      isAdminSession: true
    };
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'funflick_secret', async (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    try {
      // Dynamic verification of user suspension & subscription validity in MySQL database
      const pool = (await import('../config/db.js')).default;
      const [uRows] = await pool.query(
        'SELECT id, status, suspended_until, suspension_reason, is_influencer, subscription_expires_at FROM users WHERE id = ?',
        [user.id]
      );

      if (uRows.length > 0) {
        const u = uRows[0];

        // 1. Suspension checks & auto-restoration
        if (u.status === 'Suspended') {
          if (u.suspended_until && new Date(u.suspended_until) <= new Date()) {
            // Suspension duration has expired! Auto-restore account.
            await pool.query('UPDATE users SET status = "Active", suspended_until = NULL, suspension_reason = NULL WHERE id = ?', [user.id]);
            u.status = 'Active';
          } else {
            return res.status(403).json({
              error: 'Your account is suspended by Admin.',
              isSuspended: true,
              suspendedUntil: u.suspended_until,
              isPermanent: !u.suspended_until,
              reason: u.suspension_reason || 'Violation of FunFlick community safety standards'
            });
          }
        }

        // 2. Subscription validity check
        if (u.is_influencer && u.subscription_expires_at && new Date(u.subscription_expires_at) <= new Date()) {
          // Subscription has expired
          await pool.query('UPDATE users SET is_influencer = 0 WHERE id = ?', [user.id]);
          u.is_influencer = 0;
        }

        user.status = u.status;
        user.isInfluencer = Boolean(u.is_influencer);
      }
    } catch (dbErr) {
      // Allow fallback if DB check fails
    }

    req.user = user;
    next();
  });
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'funflick_secret', (err, user) => {
    if (!err && user) {
      req.user = user;
    }
    next();
  });
}
