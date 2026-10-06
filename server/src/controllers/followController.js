import pool from '../config/db.js';

export async function followUser(req, res) {
  try {
    const targetUsername = req.params.username;
    const currentUserId = req.user.id;

    // Find target user by username or id
    const [targetRows] = await pool.query(
      'SELECT id, name, username FROM users WHERE username = ? OR id = ?',
      [targetUsername, targetUsername]
    );

    if (targetRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = targetRows[0];

    // Cannot follow self!
    if (targetUser.id === currentUserId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    await pool.query(
      'INSERT IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)',
      [currentUserId, targetUser.id]
    );

    // Create real notification for target user
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, actor_id, type, title, message)
         VALUES (?, ?, 'follow', 'New Follower', ?)`,
        [targetUser.id, currentUserId, `started following you.`]
      );
    } catch (e) {}

    return res.json({ success: true, following: true, message: `Now following @${targetUser.username}` });
  } catch (err) {
    console.error('Follow user error:', err);
    return res.status(500).json({ error: 'Failed to follow user' });
  }
}

export async function unfollowUser(req, res) {
  try {
    const targetUsername = req.params.username;
    const currentUserId = req.user.id;

    const [targetRows] = await pool.query(
      'SELECT id, username FROM users WHERE username = ? OR id = ?',
      [targetUsername, targetUsername]
    );

    if (targetRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = targetRows[0];

    await pool.query(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
      [currentUserId, targetUser.id]
    );

    return res.json({ success: true, following: false, message: `Unfollowed @${targetUser.username}` });
  } catch (err) {
    console.error('Unfollow user error:', err);
    return res.status(500).json({ error: 'Failed to unfollow user' });
  }
}

export async function removeFollower(req, res) {
  try {
    const followerUsername = req.params.username;
    const currentUserId = req.user.id;

    const [followerRows] = await pool.query(
      'SELECT id, username FROM users WHERE username = ? OR id = ?',
      [followerUsername, followerUsername]
    );

    if (followerRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followerUser = followerRows[0];

    // Remove them from following me
    await pool.query(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerUser.id, currentUserId]
    );

    return res.json({ success: true, message: `Removed @${followerUser.username} from your followers` });
  } catch (err) {
    console.error('Remove follower error:', err);
    return res.status(500).json({ error: 'Failed to remove follower' });
  }
}

export async function getFollowers(req, res) {
  try {
    const username = req.params.username;
    const currentUserId = req.user?.id || 0;

    const [userRows] = await pool.query(
      'SELECT id, username FROM users WHERE username = ? OR id = ?',
      [username, username]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUserId = userRows[0].id;

    const [rows] = await pool.query(
      `SELECT 
        u.id, u.name, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) AS i_follow_them,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id AND following_id = ?) AS they_follow_me
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = ?
       ORDER BY f.created_at DESC`,
      [currentUserId, currentUserId, targetUserId]
    );

    const followers = rows.map(r => ({
      id: r.id,
      name: r.name,
      username: r.username,
      avatar: r.avatar_url || '/brand/default-avatar.svg',
      iFollowThem: Boolean(r.i_follow_them),
      theyFollowMe: Boolean(r.they_follow_me),
      isSelf: r.id === currentUserId
    }));

    return res.json({ followers, count: followers.length });
  } catch (err) {
    console.error('Get followers error:', err);
    return res.status(500).json({ error: 'Failed to fetch followers' });
  }
}

export async function getFollowing(req, res) {
  try {
    const username = req.params.username;
    const currentUserId = req.user?.id || 0;

    const [userRows] = await pool.query(
      'SELECT id, username FROM users WHERE username = ? OR id = ?',
      [username, username]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUserId = userRows[0].id;

    const [rows] = await pool.query(
      `SELECT 
        u.id, u.name, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) AS i_follow_them,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id AND following_id = ?) AS they_follow_me
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = ?
       ORDER BY f.created_at DESC`,
      [currentUserId, currentUserId, targetUserId]
    );

    const following = rows.map(r => ({
      id: r.id,
      name: r.name,
      username: r.username,
      avatar: r.avatar_url || '/brand/default-avatar.svg',
      iFollowThem: Boolean(r.i_follow_them),
      theyFollowMe: Boolean(r.they_follow_me),
      isSelf: r.id === currentUserId
    }));

    return res.json({ following, count: following.length });
  } catch (err) {
    console.error('Get following error:', err);
    return res.status(500).json({ error: 'Failed to fetch following' });
  }
}
