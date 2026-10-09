import pool from '../config/db.js';

// Search or list real users/creators for tagging, search, and direct messaging
export async function searchUsers(req, res) {
  try {
    const q = (req.query.q || '').trim();
    const currentUserId = req.user?.id || 0;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    let query = `
      SELECT 
        u.id, 
        u.name, 
        u.username, 
        u.avatar_url, 
        u.role, 
        u.is_influencer,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) AS is_following
      FROM users u
      WHERE u.status = 'Active'
    `;
    const params = [currentUserId];

    if (q) {
      query += ` AND (u.username LIKE ? OR u.name LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }

    query += ` ORDER BY followers_count DESC, u.created_at DESC LIMIT ?`;
    params.push(limit);

    const [rows] = await pool.query(query, params);

    const users = rows.map(r => {
      const isSelf = Boolean(
        (currentUserId && r.id === currentUserId) ||
        (req.user?.username && r.username?.toLowerCase() === req.user.username.toLowerCase())
      );
      return {
        id: r.id,
        name: r.name,
        username: r.username,
        avatar: (r.username === 'super_admin')
          ? (r.avatar_url && !r.avatar_url.includes('default-avatar') ? r.avatar_url : '/brand/funflick-logo.png')
          : (r.avatar_url || '/brand/default-avatar.svg'),
        role: r.role,
        isInfluencer: Boolean(r.is_influencer),
        followersCount: r.followers_count || 0,
        isFollowing: Boolean(r.is_following),
        isSelf
      };
    });

    return res.json({ users, count: users.length });
  } catch (err) {
    console.error('Search users error:', err);
    return res.status(500).json({ error: 'Failed to search users' });
  }
}

// Get user profile summary by username
export async function getUserProfile(req, res) {
  try {
    const username = req.params.username;
    const currentUserId = req.user?.id || 0;

    const [rows] = await pool.query(
      `SELECT 
        u.id, u.name, u.username, u.avatar_url, u.bio, u.role, u.is_influencer, u.created_at,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count,
        (SELECT COUNT(*) FROM videos WHERE user_id = u.id) AS posts_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) AS i_follow_them,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id AND following_id = ?) AS they_follow_me
       FROM users u
       WHERE (u.username = ? OR u.id = ?) AND u.status = 'Active'`,
      [currentUserId, currentUserId, username, username]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const r = rows[0];
    return res.json({
      user: {
        id: r.id,
        name: r.name,
        username: r.username,
        avatar: (r.username === 'super_admin')
          ? (r.avatar_url && !r.avatar_url.includes('default-avatar') ? r.avatar_url : '/brand/funflick-logo.png')
          : (r.avatar_url || '/brand/default-avatar.svg'),
        bio: r.bio || '',
        role: r.role,
        isInfluencer: Boolean(r.is_influencer),
        joinedDate: r.created_at,
        followersCount: r.followers_count || 0,
        followingCount: r.following_count || 0,
        postsCount: r.posts_count || 0,
        iFollowThem: Boolean(r.i_follow_them),
        theyFollowMe: Boolean(r.they_follow_me),
        isSelf: Boolean(
          (currentUserId && r.id === currentUserId) ||
          (req.user?.username && r.username?.toLowerCase() === req.user.username.toLowerCase())
        )
      }
    });
  } catch (err) {
    console.error('Get user profile error:', err);
    return res.status(500).json({ error: 'Failed to get user profile' });
  }
}

// Get all users blocked by the authenticated user
export async function getBlockedUsers(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const [rows] = await pool.query(
      `SELECT b.id, b.blocked_username, b.created_at,
              u.name AS user_name, u.avatar_url AS user_avatar
       FROM blocked_users b
       LEFT JOIN users u ON u.username = b.blocked_username
       WHERE b.blocker_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    );

    return res.json({ blockedUsers: rows });
  } catch (err) {
    console.error('Get blocked users error:', err);
    return res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
}

// Block a user by username
export async function blockUser(req, res) {
  try {
    const blockerId = req.user?.id;
    const { username } = req.body;
    if (!blockerId) return res.status(401).json({ error: 'Unauthorized' });
    if (!username) return res.status(400).json({ error: 'Username is required' });

    // Also remove follow relationship both ways
    const [targetUser] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (targetUser.length > 0) {
      const targetId = targetUser[0].id;
      await pool.query('DELETE FROM follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)', [blockerId, targetId, targetId, blockerId]);
    }

    await pool.query(
      `INSERT IGNORE INTO blocked_users (blocker_id, blocked_username) VALUES (?, ?)`,
      [blockerId, username]
    );

    return res.json({ success: true, message: `Blocked @${username}` });
  } catch (err) {
    console.error('Block user error:', err);
    return res.status(500).json({ error: 'Failed to block user' });
  }
}

// Unblock a user by username
export async function unblockUser(req, res) {
  try {
    const blockerId = req.user?.id;
    const { username } = req.body;
    if (!blockerId) return res.status(401).json({ error: 'Unauthorized' });
    if (!username) return res.status(400).json({ error: 'Username is required' });

    await pool.query(
      `DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_username = ?`,
      [blockerId, username]
    );

    return res.json({ success: true, message: `Unblocked @${username}` });
  } catch (err) {
    console.error('Unblock user error:', err);
    return res.status(500).json({ error: 'Failed to unblock user' });
  }
}

// Register or update device Expo push token
export async function updatePushToken(req, res) {
  try {
    const userId = req.user?.id;
    const { pushToken } = req.body;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!pushToken || typeof pushToken !== 'string') {
      return res.status(400).json({ error: 'Valid pushToken is required' });
    }

    await pool.query('UPDATE users SET push_token = ? WHERE id = ?', [pushToken, userId]);
    return res.json({ success: true, message: 'Push token updated successfully' });
  } catch (err) {
    console.error('Update push token error:', err);
    return res.status(500).json({ error: 'Failed to update push token' });
  }
}
