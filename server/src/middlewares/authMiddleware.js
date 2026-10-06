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

  jwt.verify(token, process.env.JWT_SECRET || 'funflick_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
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
