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

    const users = rows.map(r => ({
      id: r.id,
      name: r.name,
      username: r.username,
      avatar: r.avatar_url || '/brand/default-avatar.svg',
      role: r.role,
      isInfluencer: Boolean(r.is_influencer),
      followersCount: r.followers_count || 0,
      isFollowing: Boolean(r.is_following),
      isSelf: r.id === currentUserId
    }));

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
        avatar: r.avatar_url || '/brand/default-avatar.svg',
        bio: r.bio || '',
        role: r.role,
        isInfluencer: Boolean(r.is_influencer),
        joinedDate: r.created_at,
        followersCount: r.followers_count || 0,
        followingCount: r.following_count || 0,
        postsCount: r.posts_count || 0,
        iFollowThem: Boolean(r.i_follow_them),
        theyFollowMe: Boolean(r.they_follow_me),
        isSelf: r.id === currentUserId
      }
    });
  } catch (err) {
    console.error('Get user profile error:', err);
    return res.status(500).json({ error: 'Failed to get user profile' });
  }
}
