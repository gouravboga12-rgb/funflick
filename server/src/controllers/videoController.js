import pool from '../config/db.js';

export async function listVideos(req, res) {
  try {
    const { category, limit = 50, offset = 0 } = req.query;
    const currentUserId = req.user?.id || 0;

    let query = `
      SELECT 
        v.id, v.title, v.description, v.category, v.video_url, v.thumbnail_url,
        v.media_type, v.hashtags, v.location, v.audio_title,
        v.duration, v.views_count, v.likes_count, v.created_at, v.status,
        (SELECT COUNT(*) FROM comments c WHERE c.video_id = v.id) AS comments_count,
        (SELECT COUNT(*) FROM likes l WHERE l.video_id = v.id AND l.user_id = ?) AS user_liked,
        u.id AS creator_id, u.name AS creator_name, u.username AS creator_username, u.avatar_url AS creator_avatar
      FROM videos v
      JOIN users u ON v.user_id = u.id
      WHERE v.status = 'Approved'
    `;
    const params = [currentUserId];

    if (category && category !== 'All') {
      query += ' AND v.category = ?';
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
    const { 
      title, 
      description, 
      category, 
      video_url, 
      thumbnail_url, 
      duration,
      media_type = 'video',
      hashtags = '',
      location = '',
      audio_title = ''
    } = req.body;

    if (!video_url || video_url.startsWith('blob:')) {
      return res.status(400).json({ error: 'Valid permanent media URL from AWS S3 is required' });
    }

    const videoTitle = (title && title.trim()) || (description && description.trim().slice(0, 40)) || 'Untitled Video';

    // Normal users go to 'Pending' verification queue; admin goes straight to 'Approved'
    const initialStatus = req.user.role === 'admin' ? 'Approved' : 'Pending';

    // Safe thumbnail fallback
    let safeThumbnail = thumbnail_url || video_url;
    if (typeof safeThumbnail === 'string' && safeThumbnail.length > 5000000) {
      safeThumbnail = video_url;
    }

    const [result] = await pool.query(
      `INSERT INTO videos (user_id, title, description, category, video_url, thumbnail_url, duration, media_type, hashtags, location, audio_title, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        videoTitle,
        description || '',
        category || 'Comedy',
        video_url,
        safeThumbnail,
        duration || 0,
        media_type || 'video',
        hashtags || '',
        location || '',
        audio_title || '',
        initialStatus
      ]
    );

    // Create in-app notification informing user of submission
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES (?, 'system', 'Reel Submitted for Review', ?)`,
        [req.user.id, `Your reel "${videoTitle}" has been submitted for Admin Verification.`]
      );
    } catch (e) {}

    return res.status(201).json({
      message: initialStatus === 'Approved' ? 'Published live to FunFlick' : 'Submitted for Central Admin Verification',
      status: initialStatus,
      videoId: result.insertId,
      video: {
        id: result.insertId,
        user_id: req.user.id,
        title: videoTitle,
        description,
        category,
        video_url,
        thumbnail_url: safeThumbnail,
        media_type,
        duration,
        status: initialStatus,
        likes_count: 0,
        views_count: 0,
        created_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Create video error:', err);
    return res.status(500).json({ error: err.message || 'Failed to publish content' });
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

      // Notify video author if not self
      try {
        const [vRows] = await pool.query('SELECT user_id, title FROM videos WHERE id = ?', [id]);
        if (vRows.length > 0 && vRows[0].user_id !== userId) {
          await pool.query(
            `INSERT INTO notifications (user_id, actor_id, type, title, message, target_id)
             VALUES (?, ?, 'like', 'New Like', ?, ?)`,
            [vRows[0].user_id, userId, `liked your post "${vRows[0].title || 'FunFlick post'}"`, id]
          );
        }
      } catch (err) {}

      return res.json({ liked: true });
    }
  } catch (err) {
    console.error('Toggle like error:', err);
    return res.status(500).json({ error: 'Failed to toggle like' });
  }
}

export async function getComments(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT c.id, c.content, c.created_at, u.name, u.username, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.video_id = ?
       ORDER BY c.created_at ASC`,
      [id]
    );
    const comments = rows.map(r => ({
      id: r.id,
      text: r.content,
      content: r.content,
      user: r.username,
      name: r.name,
      avatar: r.avatar_url || '/brand/default-avatar.svg',
      time: 'Recently',
      created_at: r.created_at
    }));
    return res.json({ comments });
  } catch (err) {
    console.error('Get comments error:', err);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
}

export async function addComment(req, res) {
  try {
    const { id } = req.params;
    const { text, content } = req.body;
    const commentText = (text || content || '').trim();

    if (!commentText) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const [result] = await pool.query(
      `INSERT INTO comments (user_id, video_id, content) VALUES (?, ?, ?)`,
      [req.user.id, id, commentText]
    );

    // Notify video author if not self
    try {
      const [vRows] = await pool.query('SELECT user_id, title FROM videos WHERE id = ?', [id]);
      if (vRows.length > 0 && vRows[0].user_id !== req.user.id) {
        await pool.query(
          `INSERT INTO notifications (user_id, actor_id, type, title, message, target_id)
           VALUES (?, ?, 'comment', 'New Comment', ?, ?)`,
          [vRows[0].user_id, req.user.id, `commented: "${commentText.slice(0, 40)}"`, id]
        );
      }
    } catch (err) {}

    const [userRows] = await pool.query(
      `SELECT id, name, username, avatar_url FROM users WHERE id = ?`,
      [req.user.id]
    );
    const commenter = userRows[0] || {};

    return res.status(201).json({
      comment: {
        id: result.insertId,
        content: commentText,
        text: commentText,
        time: 'Just now',
        created_at: new Date().toISOString(),
        user: commenter.username || req.user.username || 'User',
        name: commenter.name || req.user.name || 'User',
        avatar: commenter.avatar_url || '/brand/default-avatar.svg'
      }
    });
  } catch (err) {
    console.error('Add comment error:', err);
    return res.status(500).json({ error: 'Failed to add comment' });
  }
}

export async function recordView(req, res) {
  try {
    const { id } = req.params;
    await pool.query('UPDATE videos SET views_count = views_count + 1 WHERE id = ?', [id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Record view error:', err);
    return res.status(500).json({ error: 'Failed to record view' });
  }
}

export async function updateVideo(req, res) {
  try {
    const { id } = req.params;
    const { title, description, category, thumbnail_url, video_url } = req.body;
    await pool.query(
      `UPDATE videos SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        thumbnail_url = COALESCE(?, thumbnail_url),
        video_url = COALESCE(?, video_url)
      WHERE id = ? AND (user_id = ? OR ? = 1)`,
      [title, description, category, thumbnail_url, video_url, id, req.user.id, req.user.role === 'admin' ? 1 : 0]
    );
    return res.json({ success: true, message: 'Video updated successfully' });
  } catch (err) {
    console.error('Update video error:', err);
    return res.status(500).json({ error: 'Failed to update video' });
  }
}

export async function deleteVideo(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM comments WHERE video_id = ?', [id]);
    await pool.query('DELETE FROM likes WHERE video_id = ?', [id]);
    const [result] = await pool.query(
      'DELETE FROM videos WHERE id = ? AND (user_id = ? OR ? = 1)',
      [id, req.user.id, req.user.role === 'admin' ? 1 : 0]
    );
    return res.json({ success: true, message: 'Video deleted successfully', affectedRows: result.affectedRows });
  } catch (err) {
    console.error('Delete video error:', err);
    return res.status(500).json({ error: 'Failed to delete video' });
  }
}

export async function deleteComment(req, res) {
  try {
    const { id, commentId } = req.params;
    const [result] = await pool.query(
      'DELETE FROM comments WHERE id = ? AND video_id = ? AND (user_id = ? OR ? = 1)',
      [commentId, id, req.user.id, req.user.role === 'admin' ? 1 : 0]
    );
    return res.json({ success: true, message: 'Comment deleted successfully', affectedRows: result.affectedRows });
  } catch (err) {
    console.error('Delete comment error:', err);
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
}


