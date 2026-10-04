import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export async function register(req, res) {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'All fields (name, username, email, password) are required' });
    }

    // Check if user already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
      [email, username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username or email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (name, username, email, password_hash) VALUES (?, ?, ?, ?)',
      [name, username, email, passwordHash]
    );

    const token = jwt.sign(
      { id: result.insertId, username, email },
      process.env.JWT_SECRET || 'funflick_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: result.insertId, name, username, email, role: 'user' },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration' });
  }
}

export async function login(req, res) {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Email/Username and password are required' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1',
      [emailOrUsername, emailOrUsername]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
        avatar_url: user.avatar_url,
        bio: user.bio,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, username, email, avatar_url, bio, role, created_at FROM users WHERE id = ?',
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

export async function googleLogin(req, res) {
  try {
    const { email, name, picture, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required from Google' });
    }

    // Check if user already exists
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
        .substring(0, 30);
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

