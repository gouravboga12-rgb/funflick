import pool from '../config/db.js';

export async function listStories(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.id, s.user_id, s.media_url, s.media_type, s.caption, s.music, s.sticker, s.created_at, s.status,
        u.name, u.username, u.avatar_url
      FROM stories s
      JOIN users u ON s.user_id = u.id
      WHERE (s.expires_at IS NULL OR s.expires_at > NOW()) AND s.status = 'Approved'
      ORDER BY s.created_at DESC
    `);

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

export async function createStory(req, res) {
  try {
    const { media_url, media_type = 'image', caption = '', music = '', sticker = '' } = req.body;

    if (!media_url) {
      return res.status(400).json({ error: 'media_url is required' });
    }

    const initialStatus = req.user.role === 'admin' ? 'Approved' : 'Pending';

    const [result] = await pool.query(
      `INSERT INTO stories (user_id, media_url, media_type, caption, music, sticker, expires_at, status)
       VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), ?)`,
      [req.user.id, media_url, media_type, caption, music, sticker, initialStatus]
    );

    // Notify user of submission
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES (?, 'system', 'Story Submitted for Review', 'Your story has been submitted for Admin Verification.')`,
        [req.user.id]
      );
    } catch (e) {}

    return res.status(201).json({
      message: initialStatus === 'Approved' ? 'Story published live' : 'Story submitted for Admin Verification',
      status: initialStatus,
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
