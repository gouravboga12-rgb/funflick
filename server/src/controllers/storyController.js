import pool from '../config/db.js';

export async function listStories(req, res) {
  try {
    const currentUserId = req.user?.id || 0;
    const { userId, username } = req.query;

    let targetUserId = null;
    if (userId) {
      targetUserId = Number(userId);
    } else if (username) {
      const [uRows] = await pool.query('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
      if (uRows.length > 0) {
        targetUserId = uRows[0].id;
      }
    }

    // 1. Profile Story Viewing (when specific user is requested)
    if (targetUserId) {
      const [targetUserRows] = await pool.query('SELECT id, is_private FROM users WHERE id = ?', [targetUserId]);
      if (targetUserRows.length === 0) {
        return res.json({ stories: [] });
      }

      const isPrivate = Boolean(targetUserRows[0].is_private);
      if (isPrivate && currentUserId !== targetUserId) {
        const [followRows] = await pool.query(
          'SELECT id FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1',
          [currentUserId, targetUserId]
        );
        if (followRows.length === 0) {
          return res.status(403).json({
            error: 'This account is private. Follow this user to view their stories.',
            isPrivate: true,
            stories: []
          });
        }
      }

      const [rows] = await pool.query(`
        SELECT 
          s.id, s.user_id, s.media_url, s.media_type, s.caption, s.music, s.sticker, s.created_at, s.status,
          s.likes_count,
          (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = s.id AND sl.user_id = ?) AS user_liked,
          (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = s.id AND sv.user_id = ?) AS user_viewed,
          u.name, u.username, u.avatar_url
        FROM stories s
        JOIN users u ON s.user_id = u.id
        WHERE s.user_id = ?
          AND (s.expires_at IS NULL OR s.expires_at > NOW()) 
          AND (s.status = 'Approved' OR s.status IS NULL) 
          AND (u.status IS NULL OR u.status != 'Suspended')
        ORDER BY s.created_at ASC
      `, [currentUserId, currentUserId, targetUserId]);

      if (rows.length === 0) {
        return res.json({ stories: [] });
      }

      return res.json({
        stories: [{
          id: `st_user_${targetUserId}`,
          userId: targetUserId,
          username: rows[0]?.username || '',
          name: rows[0]?.name || '',
          avatar: rows[0]?.avatar_url || '/brand/default-avatar.svg',
          hasUnseen: rows.some(r => !r.user_viewed && currentUserId !== targetUserId),
          stories: rows.map(row => ({
            id: row.id,
            mediaUrl: row.media_url,
            mediaType: row.media_type,
            caption: row.caption || '',
            music: row.music || '',
            sticker: row.sticker || '',
            likesCount: Number(row.likes_count) || 0,
            isLiked: Boolean(row.user_liked),
            isViewed: Boolean(row.user_viewed),
            time: 'Active 24h',
            created_at: row.created_at
          }))
        }]
      });
    }

    // 2. Homepage Story Tray:
    // Instagram Rule: Only display stories from:
    // - The logged-in user themselves
    // - Accounts the logged-in user follows
    if (!currentUserId) {
      return res.json({ stories: [] });
    }

    const [rows] = await pool.query(`
      SELECT 
        s.id, s.user_id, s.media_url, s.media_type, s.caption, s.music, s.sticker, s.created_at, s.status,
        s.likes_count,
        (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = s.id AND sl.user_id = ?) AS user_liked,
        (SELECT COUNT(*) FROM story_views sv WHERE sv.story_id = s.id AND sv.user_id = ?) AS user_viewed,
        u.name, u.username, u.avatar_url,
        (CASE WHEN s.user_id = ? THEN 1 ELSE 0 END) AS is_self
      FROM stories s
      JOIN users u ON s.user_id = u.id
      WHERE (s.expires_at IS NULL OR s.expires_at > NOW()) 
        AND (s.status = 'Approved' OR s.status IS NULL) 
        AND (u.status IS NULL OR u.status != 'Suspended')
        AND s.media_url NOT LIKE '%unsplash.com%'
        AND (s.caption IS NULL OR (s.caption NOT LIKE 'Testing user%' AND s.caption NOT LIKE 'Test Story%'))
        AND (
          s.user_id = ?
          OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = s.user_id)
        )
      ORDER BY is_self DESC, s.created_at DESC
      LIMIT 100
    `, [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId]);

    // Group stories by creator
    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.user_id]) {
        grouped[row.user_id] = {
          id: `st_user_${row.user_id}`,
          userId: row.user_id,
          username: row.username,
          name: row.name,
          avatar: row.avatar_url || '/brand/default-avatar.svg',
          hasUnseen: false,
          stories: []
        };
      }
      const isSeen = Boolean(row.user_viewed);
      if (!isSeen && currentUserId !== row.user_id) {
        grouped[row.user_id].hasUnseen = true;
      }
      grouped[row.user_id].stories.push({
        id: row.id,
        mediaUrl: row.media_url,
        mediaType: row.media_type,
        caption: row.caption || '',
        music: row.music || '',
        sticker: row.sticker || '',
        likesCount: Number(row.likes_count) || 0,
        isLiked: Boolean(row.user_liked),
        isViewed: isSeen,
        time: 'Recently',
        created_at: row.created_at
      });
    }

    return res.json({ stories: Object.values(grouped) });
  } catch (err) {
    console.error('List stories error:', err);
    return res.status(500).json({ error: 'Failed to fetch stories' });
  }
}

export async function recordStoryView(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 0;
    if (userId && id) {
      await pool.query(
        'INSERT IGNORE INTO story_views (story_id, user_id) VALUES (?, ?)',
        [id, userId]
      );
    }
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: true });
  }
}

export async function toggleStoryLike(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [existing] = await pool.query(
      'SELECT id FROM story_likes WHERE user_id = ? AND story_id = ?',
      [userId, id]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM story_likes WHERE user_id = ? AND story_id = ?', [userId, id]);
      await pool.query('UPDATE stories SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?', [id]);
      const [cnt] = await pool.query('SELECT likes_count FROM stories WHERE id = ?', [id]);
      return res.json({ liked: false, likesCount: cnt[0]?.likes_count || 0 });
    } else {
      await pool.query('INSERT INTO story_likes (user_id, story_id) VALUES (?, ?)', [userId, id]);
      await pool.query('UPDATE stories SET likes_count = likes_count + 1 WHERE id = ?', [id]);

      // Notify story creator if not self
      try {
        const [sRows] = await pool.query('SELECT user_id FROM stories WHERE id = ?', [id]);
        if (sRows.length > 0 && sRows[0].user_id !== userId) {
          await pool.query(
            `INSERT INTO notifications (user_id, actor_id, type, title, message, target_id)
             VALUES (?, ?, 'like', 'Story Liked ❤️', 'liked your story', ?)`,
            [sRows[0].user_id, userId, id]
          );
        }
      } catch (e) {}

      const [cnt] = await pool.query('SELECT likes_count FROM stories WHERE id = ?', [id]);
      return res.json({ liked: true, likesCount: cnt[0]?.likes_count || 1 });
    }
  } catch (err) {
    console.error('Toggle story like error:', err);
    return res.status(500).json({ error: 'Failed to toggle story like' });
  }
}

export async function createStory(req, res) {
  try {
    const { media_url, media_type = 'image', caption = '', music = '', sticker = '' } = req.body;

    if (!media_url) {
      return res.status(400).json({ error: 'media_url is required' });
    }

    let userId = req.user?.id;
    let userExists = false;

    // Verify user exists in MySQL users table
    if (userId && userId !== 999999) {
      const [uCheck] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
      if (uCheck.length > 0) {
        userExists = true;
      }
    }

    // If userId not found or is 999999 (e.g. legacy admin token), resolve real DB user
    if (!userExists) {
      // 1. Try matching by email or username from JWT
      if (req.user?.email || req.user?.username) {
        const [uMatch] = await pool.query(
          'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
          [req.user.email || '', req.user.username || '']
        );
        if (uMatch.length > 0) {
          userId = uMatch[0].id;
          userExists = true;
        }
      }

      // 2. If admin role, resolve to super_admin
      if (!userExists && (req.user?.role === 'admin' || req.user?.isAdminSession)) {
        const [adminRows] = await pool.query(
          "SELECT id FROM users WHERE email = 'funflick0308@gmail.com' OR username = 'super_admin' OR role = 'admin' LIMIT 1"
        );
        if (adminRows.length > 0) {
          userId = adminRows[0].id;
          userExists = true;
        }
      }
    }

    if (!userId || !userExists) {
      return res.status(401).json({ error: 'Your session is out of date. Please log out and log in again to post a story.' });
    }

    // Deduplication check: prevent duplicate inserts if client submitted twice within 15 seconds
    const [recentDupeStory] = await pool.query(
      'SELECT id FROM stories WHERE user_id = ? AND media_url = ? AND created_at >= NOW() - INTERVAL 15 SECOND LIMIT 1',
      [userId, media_url]
    );
    if (recentDupeStory.length > 0) {
      return res.status(200).json({
        success: true,
        storyId: recentDupeStory[0].id,
        message: 'Story published successfully'
      });
    }

    // Clean strings and sanitize
    const cleanCaption = caption ? String(caption).trim() : '';
    const cleanMusic = music ? String(music).trim() : '';
    const cleanSticker = sticker ? String(sticker).trim() : '';
    const cleanMediaType = (media_type === 'video' || String(media_url).match(/\.(mp4|webm|mov)(\?.*)?$/i)) ? 'video' : 'image';

    // Stories publish immediately without waiting for admin approval (expires in 24h)
    const initialStatus = 'Approved';

    const [result] = await pool.query(
      `INSERT INTO stories (user_id, media_url, media_type, caption, music, sticker, expires_at, status)
       VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), ?)`,
      [userId, media_url, cleanMediaType, cleanCaption, cleanMusic, cleanSticker, initialStatus]
    );

    // Notify user that story is live
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES (?, 'system', 'Story Published Live! 🌟', 'Your story is now live and will automatically expire in 24 hours.')`,
        [userId]
      );
    } catch (e) {}

    return res.status(201).json({
      message: 'Story published live',
      status: 'Approved',
      storyId: result.insertId,
      story: {
        id: result.insertId,
        mediaUrl: media_url,
        mediaType: cleanMediaType,
        caption: cleanCaption,
        music: cleanMusic,
        sticker: cleanSticker,
        time: 'Just now'
      }
    });
  } catch (err) {
    console.error('Create story error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create story' });
  }
}

export async function deleteStory(req, res) {
  try {
    const rawId = req.params.id;
    const cleanId = String(rawId).replace(/^st_user_/, '').replace(/^st_/, '').replace(/^story_/, '');
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || 
                    req.user.role === 'super_admin' || 
                    req.user.role === 'moderator' || 
                    req.user.isAdminSession ||
                    req.user.username === 'mrspysoal_16' ||
                    req.user.username === 'gourav.boga1';

    let [storyRows] = await pool.query('SELECT id, user_id FROM stories WHERE id = ? OR id = ?', [cleanId, rawId]);
    if (storyRows.length === 0 && (String(rawId).startsWith('st_user_') || cleanId === String(userId))) {
      [storyRows] = await pool.query('SELECT id, user_id FROM stories WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [cleanId]);
    }
    if (storyRows.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (String(storyRows[0].user_id) !== String(userId) && !isAdmin) {
      return res.status(403).json({ error: 'You can only delete your own stories' });
    }

    const actualId = storyRows[0].id || cleanId;
    await pool.query('DELETE FROM story_likes WHERE story_id = ?', [actualId]);
    await pool.query('DELETE FROM story_views WHERE story_id = ?', [actualId]);
    await pool.query('DELETE FROM stories WHERE id = ?', [actualId]);

    return res.json({ success: true, message: 'Story deleted successfully', storyId: actualId });
  } catch (err) {
    console.error('Delete story error:', err);
    return res.status(500).json({ error: 'Failed to delete story' });
  }
}
