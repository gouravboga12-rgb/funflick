import pool from '../config/db.js';
import { sendPushNotification } from '../services/pushService.js';

export async function listVideos(req, res) {
  try {
    const { category, username, userId, creator_id, limit = 50, offset = 0 } = req.query;
    const currentUserId = req.user?.id || 0;

    let query = `
      SELECT 
        v.id, v.title, v.description, v.category, v.video_url, v.thumbnail_url,
        v.media_type, v.hashtags, v.location, v.audio_title,
        v.duration, v.views_count, v.likes_count, v.created_at, v.status,
        (SELECT COUNT(*) FROM comments c WHERE c.video_id = v.id) AS comments_count,
        (SELECT COUNT(*) FROM likes l WHERE l.video_id = v.id AND l.user_id = ?) AS user_liked,
        (SELECT COUNT(*) FROM follows f WHERE f.follower_id = ? AND f.following_id = u.id) AS user_following,
        u.id AS creator_id, u.name AS creator_name, u.username AS creator_username, u.avatar_url AS creator_avatar
      FROM videos v
      JOIN users u ON v.user_id = u.id
      WHERE v.status = 'Approved' 
        AND (v.moderation_status IS NULL OR v.moderation_status != 'Rejected')
        AND (u.status IS NULL OR u.status != 'Suspended')
    `;
    const params = [currentUserId, currentUserId];

    if (category && category !== 'All') {
      query += ' AND v.category = ?';
      params.push(category);
    }

    if (username) {
      query += ' AND u.username = ?';
      params.push(username);
    }

    const targetUserId = userId || creator_id;
    if (targetUserId) {
      query += ' AND u.id = ?';
      params.push(targetUserId);
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

// Authenticated user's private liked videos (only visible to the user who liked them)
export async function getLikedVideos(req, res) {
  try {
    const currentUserId = req.user.id;

    const [rows] = await pool.query(`
      SELECT 
        v.id, v.title, v.description, v.category, v.video_url, v.thumbnail_url,
        v.media_type, v.hashtags, v.location, v.audio_title,
        v.duration, v.views_count, v.likes_count, v.created_at, v.status,
        (SELECT COUNT(*) FROM comments c WHERE c.video_id = v.id) AS comments_count,
        1 AS user_liked,
        u.id AS creator_id, u.name AS creator_name, u.username AS creator_username, u.avatar_url AS creator_avatar
      FROM likes l
      JOIN videos v ON l.video_id = v.id
      JOIN users u ON v.user_id = u.id
      WHERE l.user_id = ? AND v.status = 'Approved' AND (u.status IS NULL OR u.status != 'Suspended')
      ORDER BY l.created_at DESC
    `, [currentUserId]);

    return res.json({ videos: rows, count: rows.length });
  } catch (err) {
    console.error('Get liked videos error:', err);
    return res.status(500).json({ error: 'Failed to fetch liked videos' });
  }
}

// Authenticated user's private media library (all statuses: Pending, Approved, Rejected)
export async function getMyMedia(req, res) {
  try {
    const currentUserId = req.user.id;

    const [rows] = await pool.query(`
      SELECT 
        v.id, v.title, v.description, v.category, v.video_url, v.thumbnail_url,
        v.media_type, v.hashtags, v.location, v.audio_title,
        v.duration, v.views_count, v.likes_count, v.created_at, v.status,
        (SELECT COUNT(*) FROM comments c WHERE c.video_id = v.id) AS comments_count,
        (SELECT COUNT(*) FROM likes l WHERE l.video_id = v.id AND l.user_id = ?) AS user_liked
      FROM videos v
      WHERE v.user_id = ?
      ORDER BY v.created_at DESC
    `, [currentUserId, currentUserId]);

    const media = rows.map(v => ({
      id: v.id,
      title: v.title,
      caption: v.description || v.title,
      category: v.category,
      mediaType: v.media_type,
      mediaUrl: v.video_url,
      thumbnail: v.thumbnail_url || v.video_url,
      posterUrl: v.thumbnail_url || v.video_url,
      hashtags: v.hashtags || '',
      duration: v.duration,
      views: String(v.views_count || 0),
      likes: Number(v.likes_count || 0),
      commentsCount: Number(v.comments_count || 0),
      status: v.status || 'Pending',
      date: new Date(v.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      createdAt: v.created_at
    }));

    return res.json({ media, count: media.length });
  } catch (err) {
    console.error('Get my media error:', err);
    return res.status(500).json({ error: 'Failed to load your media' });
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

    // Directly publish to feed globally; queue in Admin Moderation Desk
    const initialStatus = 'Approved';
    const moderationStatus = req.user.role === 'admin' ? 'Approved' : 'Pending';

    // Safe thumbnail fallback
    let safeThumbnail = thumbnail_url || video_url;
    if (typeof safeThumbnail === 'string' && safeThumbnail.length > 5000000) {
      safeThumbnail = video_url;
    }

    let userId = req.user?.id;
    let userExists = false;

    if (userId && userId !== 999999) {
      const [uCheck] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
      if (uCheck.length > 0) {
        userExists = true;
      }
    }

    if (!userExists) {
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
      return res.status(401).json({ error: 'Valid user account required to publish post' });
    }

    // Deduplication check: prevent duplicate inserts if client submitted twice within 15 seconds
    const [recentDupe] = await pool.query(
      'SELECT id FROM videos WHERE user_id = ? AND video_url = ? AND created_at >= NOW() - INTERVAL 15 SECOND LIMIT 1',
      [userId, video_url]
    );
    if (recentDupe.length > 0) {
      return res.status(200).json({
        success: true,
        videoId: recentDupe[0].id,
        message: 'Post published successfully'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO videos (user_id, title, description, category, video_url, thumbnail_url, duration, media_type, hashtags, location, audio_title, status, moderation_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
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
        initialStatus,
        moderationStatus
      ]
    );

    // Create in-app notification confirming upload
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES (?, 'system', 'Reel Published Live! 🎉', ?)`,
        [req.user.id, `Your reel "${videoTitle}" is now live on FunFlick! Admin Moderation will verify content standards.`]
      );
    } catch (e) {}

    return res.status(201).json({
      message: 'Published live to FunFlick and sent to Admin Verification Queue',
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

          // Dispatch mobile push notification
          sendPushNotification(vRows[0].user_id, {
            title: '❤️ New Like on FunFlick',
            body: `${req.user?.name || req.user?.username || 'Someone'} liked your post "${vRows[0].title || 'FunFlick post'}"`,
            data: { type: 'like', videoId: id }
          });
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
      `SELECT c.id, c.user_id, c.content, c.created_at, u.name, u.username, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.video_id = ?
       ORDER BY c.created_at ASC`,
      [id]
    );
    const comments = rows.map(r => ({
      id: r.id,
      user_id: r.user_id,
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

        sendPushNotification(vRows[0].user_id, {
          title: '💬 New Comment on FunFlick',
          body: `${req.user?.name || req.user?.username || 'Someone'} commented: "${commentText.slice(0, 50)}"`,
          data: { type: 'comment', videoId: id }
        });
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

// Get single video details by ID (for direct links, modals, and moderation comparison)
export async function getVideoById(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id || 0;

    const [rows] = await pool.query(`
      SELECT 
        v.id, v.title, v.description, v.category, v.video_url, v.thumbnail_url,
        v.media_type, v.hashtags, v.location, v.audio_title,
        v.duration, v.views_count, v.likes_count, v.created_at, v.status,
        (SELECT COUNT(*) FROM comments c WHERE c.video_id = v.id) AS comments_count,
        (SELECT COUNT(*) FROM likes l WHERE l.video_id = v.id AND l.user_id = ?) AS user_liked,
        (SELECT COUNT(*) FROM follows f WHERE f.follower_id = ? AND f.following_id = u.id) AS user_following,
        u.id AS creator_id, u.name AS creator_name, u.username AS creator_username, u.avatar_url AS creator_avatar, u.status AS creator_status
      FROM videos v
      JOIN users u ON v.user_id = u.id
      WHERE v.id = ?
    `, [currentUserId, currentUserId, id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const r = rows[0];
    const isVideo = !(/\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(r.video_url || '') || r.category === 'Photo' || r.category === 'Post');

    return res.json({
      video: {
        id: r.id,
        title: r.title,
        caption: r.description || r.title,
        description: r.description,
        category: r.category || 'Comedy',
        mediaType: r.media_type || (isVideo ? 'video' : 'image'),
        mediaUrl: r.video_url,
        videoUrl: r.video_url,
        posterUrl: r.thumbnail_url || r.video_url,
        thumbnailUrl: r.thumbnail_url || r.video_url,
        thumbnail: r.thumbnail_url || r.video_url,
        likesCount: r.likes_count || 0,
        viewsCount: String(r.views_count || '0'),
        commentsCount: r.comments_count || 0,
        status: r.status,
        timeAgo: new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        createdAt: r.created_at,
        isLiked: Boolean(r.user_liked),
        isFollowing: Boolean(r.user_following),
        creator: {
          id: r.creator_id,
          name: r.creator_name,
          username: r.creator_username,
          avatar: (r.creator_username === 'super_admin') 
            ? (r.creator_avatar && !r.creator_avatar.includes('default-avatar') ? r.creator_avatar : '/brand/funflick-logo.png')
            : (r.creator_avatar || '/brand/default-avatar.svg'),
          status: r.creator_status
        }
      }
    });
  } catch (err) {
    console.error('Get video by ID error:', err);
    return res.status(500).json({ error: 'Failed to fetch video details' });
  }
}


