import pool from '../config/db.js';

export async function listVideos(req, res) {
  try {
    const { category, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT 
        v.id, v.title, v.description, v.category, v.video_url, v.thumbnail_url,
        v.duration, v.views_count, v.likes_count, v.created_at,
        u.id AS creator_id, u.name AS creator_name, u.username AS creator_username, u.avatar_url AS creator_avatar
      FROM videos v
      JOIN users u ON v.user_id = u.id
    `;
    const params = [];

    if (category && category !== 'All') {
      query += ' WHERE v.category = ?';
      params.push(category);
    }

    query += ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);
    return res.json({ videos: rows });
  } catch (err) {
    console.error('List videos error:', err);
    return res.status(500).json({ error: 'Failed to fetch videos' });
  }
}

export async function createVideo(req, res) {
  try {
    const { title, description, category, video_url, thumbnail_url, duration } = req.body;

    if (!title || !video_url) {
      return res.status(400).json({ error: 'Title and video_url are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO videos (user_id, title, description, category, video_url, thumbnail_url, duration)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title,
        description || '',
        category || 'Comedy',
        video_url,
        thumbnail_url || null,
        duration || 0,
      ]
    );

    return res.status(201).json({
      message: 'Video published successfully',
      videoId: result.insertId,
    });
  } catch (err) {
    console.error('Create video error:', err);
    return res.status(500).json({ error: 'Failed to publish video' });
  }
}

export async function toggleLike(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if liked
    const [existing] = await pool.query(
      'SELECT id FROM likes WHERE user_id = ? AND video_id = ?',
      [userId, id]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM likes WHERE user_id = ? AND video_id = ?', [userId, id]);
      await pool.query('UPDATE videos SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?', [id]);
      return res.json({ liked: false });
    } else {
      await pool.query('INSERT INTO likes (user_id, video_id) VALUES (?, ?)', [userId, id]);
      await pool.query('UPDATE videos SET likes_count = likes_count + 1 WHERE id = ?', [id]);
      return res.json({ liked: true });
    }
  } catch (err) {
    console.error('Toggle like error:', err);
    return res.status(500).json({ error: 'Failed to toggle like' });
  }
}
