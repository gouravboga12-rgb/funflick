import pool from '../config/db.js';

export async function listStories(req, res) {
  try {
    const currentUserId = req.user?.id || 0;

    // Instagram Model: Unauthenticated guests follow no one, so return empty stories
    if (!currentUserId) {
      return res.json({ stories: [] });
    }

    const [rows] = await pool.query(`
      SELECT 
        s.id, s.user_id, s.media_url, s.media_type, s.caption, s.music, s.sticker, s.created_at, s.status,
        s.likes_count,
        (SELECT COUNT(*) FROM story_likes sl WHERE sl.story_id = s.id AND sl.user_id = ?) AS user_liked,
        u.name, u.username, u.avatar_url
      FROM stories s
      JOIN users u ON s.user_id = u.id
      WHERE (s.expires_at IS NULL OR s.expires_at > NOW()) 
        AND (s.status = 'Approved' OR s.status IS NULL) 
        AND (u.status IS NULL OR u.status != 'Suspended')
        AND (
          s.user_id = ? 
          OR EXISTS (
            SELECT 1 FROM follows f 
            WHERE f.follower_id = ? AND f.following_id = s.user_id
          )
        )
      ORDER BY s.created_at DESC
    `, [currentUserId, currentUserId, currentUserId]);

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
          hasUnseen: true,
          stories: []
        };
      }
      grouped[row.user_id].stories.push({
        id: row.id,
        mediaUrl: row.media_url,
        mediaType: row.media_type,
        caption: row.caption || '',
        music: row.music,
        sticker: row.sticker,
        likesCount: Number(row.likes_count) || 0,
        isLiked: Boolean(row.user_liked),
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

    // Stories publish immediately without waiting for admin approval (expires in 24h)
    const initialStatus = 'Approved';

    const [result] = await pool.query(
      `INSERT INTO stories (user_id, media_url, media_type, caption, music, sticker, expires_at, status)
       VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), ?)`,
      [req.user.id, media_url, media_type, caption, music, sticker, initialStatus]
    );

    // Notify user that story is live
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES (?, 'system', 'Story Published Live! 🌟', 'Your story is now live and will automatically expire in 24 hours.')`,
        [req.user.id]
      );
    } catch (e) {}

    return res.status(201).json({
      message: 'Story published live',
      status: 'Approved',
      storyId: result.insertId,
      story: {
        id: result.insertId,
        mediaUrl: media_url,
        mediaType: media_type,
        caption,
        music,
        sticker,
        time: 'Just now'
      }
    });
  } catch (err) {
    console.error('Create story error:', err);
    return res.status(500).json({ error: 'Failed to create story' });
  }
}

export async function deleteStory(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM stories WHERE id = ? AND (user_id = ? OR ? = 1)', [
      id,
      req.user.id,
      req.user.role === 'admin' ? 1 : 0
    ]);
    return res.json({ success: true, message: 'Story deleted' });
  } catch (err) {
    console.error('Delete story error:', err);
    return res.status(500).json({ error: 'Failed to delete story' });
  }
}
