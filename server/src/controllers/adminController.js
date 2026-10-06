import pool from '../config/db.js';

export async function getAdminUsers(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.name, u.username, u.email, u.phone, u.avatar_url,
        u.role, u.is_influencer, u.subscription_plan, u.wallet_balance,
        u.status, u.created_at,
        (SELECT COUNT(*) FROM videos v WHERE v.user_id = u.id) AS posts_count
      FROM users u
      ORDER BY u.created_at DESC
    `);

    const users = rows.map(r => ({
      id: r.id,
      name: r.name,
      username: r.username,
      email: r.email,
      phone: r.phone || 'Not provided',
      avatar: r.avatar_url || '/brand/default-avatar.svg',
      role: r.role,
      subscription: r.subscription_plan || (r.is_influencer ? 'Monthly (₹199)' : 'None'),
      wallet: `₹${(r.wallet_balance || 0).toLocaleString()}`,
      walletBalance: r.wallet_balance || 0,
      joined: new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: r.status || 'Active',
      postsCount: r.posts_count || 0
    }));

    return res.json({ users, totalCount: users.length });
  } catch (err) {
    console.error('Get admin users error:', err);
    return res.status(500).json({ error: 'Failed to fetch registered users' });
  }
}

export async function toggleUserStatus(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT status FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const nextStatus = rows[0].status === 'Active' ? 'Suspended' : 'Active';
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [nextStatus, id]);

    return res.json({ success: true, status: nextStatus, message: `User status set to ${nextStatus}` });
  } catch (err) {
    console.error('Toggle user status error:', err);
    return res.status(500).json({ error: 'Failed to update user status' });
  }
}

export async function getAdminCreators(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.name, u.username, u.email, u.avatar_url, u.role,
        u.is_influencer, u.subscription_plan, u.created_at,
        (SELECT COUNT(*) FROM videos v WHERE v.user_id = u.id) AS videos_count,
        (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id) AS followers_count,
        (SELECT COALESCE(SUM(views_count), 0) FROM videos v WHERE v.user_id = u.id) AS total_views,
        (SELECT COALESCE(SUM(likes_count), 0) FROM videos v WHERE v.user_id = u.id) AS total_likes
      FROM users u
      WHERE u.role = 'creator' OR u.is_influencer = 1 OR EXISTS (SELECT 1 FROM videos v WHERE v.user_id = u.id)
      ORDER BY followers_count DESC, videos_count DESC
    `);

    const creators = rows.map(r => ({
      id: r.id,
      name: r.name,
      username: r.username,
      email: r.email,
      avatar: r.avatar_url || '/brand/default-avatar.svg',
      isVerified: true,
      isInfluencer: Boolean(r.is_influencer),
      subscriptionPlan: r.subscription_plan || (r.is_influencer ? 'Monthly Influencer Pro' : 'Free Creator'),
      stats: {
        followers: Number(r.followers_count) || 0,
        subscribers: r.is_influencer ? 1 : 0,
        videos: Number(r.videos_count) || 0,
        views: Number(r.total_views) || 0,
        likes: Number(r.total_likes) || 0
      }
    }));

    return res.json({ creators, totalCount: creators.length });
  } catch (err) {
    console.error('Get admin creators error:', err);
    return res.status(500).json({ error: 'Failed to fetch creators' });
  }
}

export async function getAdminReports(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        cr.id, cr.reason, cr.details, cr.status, cr.created_at,
        u.name AS reporter_name, u.username AS reporter_username,
        v.title AS target_title, v.id AS video_id
      FROM content_reports cr
      JOIN users u ON cr.reporter_id = u.id
      LEFT JOIN videos v ON cr.target_video_id = v.id
      WHERE cr.status = 'Pending'
      ORDER BY cr.created_at DESC
    `);

    const reports = rows.map(r => ({
      id: r.id,
      type: 'Content Violation',
      targetTitle: r.target_title || 'Video Post',
      reason: r.reason,
      reporter: r.reporter_username || 'Anonymous',
      date: new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: r.status,
      videoId: r.video_id
    }));

    return res.json({ reports, totalPending: reports.length });
  } catch (err) {
    console.error('Get admin reports error:', err);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
}

export async function resolveAdminReport(req, res) {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'remove' | 'dismiss'

    if (action === 'remove') {
      const [rRows] = await pool.query('SELECT target_video_id FROM content_reports WHERE id = ?', [id]);
      if (rRows.length > 0 && rRows[0].target_video_id) {
        await pool.query('DELETE FROM videos WHERE id = ?', [rRows[0].target_video_id]);
      }
      await pool.query("UPDATE content_reports SET status = 'Resolved' WHERE id = ?", [id]);
    } else {
      await pool.query("UPDATE content_reports SET status = 'Dismissed' WHERE id = ?", [id]);
    }

    return res.json({ success: true, message: 'Report handled' });
  } catch (err) {
    console.error('Resolve report error:', err);
    return res.status(500).json({ error: 'Failed to resolve report' });
  }
}

// 1. Get all content filtered by status (Pending, Approved, Rejected, all)
export async function getAdminContent(req, res) {
  try {
    const { status = 'all' } = req.query;
    let query = `
      SELECT 
        v.id, v.title, v.description AS caption, v.category, v.video_url, v.thumbnail_url,
        v.media_type, v.hashtags, v.location, v.audio_title, v.duration, v.created_at, v.status,
        u.id AS user_id, u.name AS creator_name, u.username AS creator, u.avatar_url AS avatar, u.status AS user_status
      FROM videos v
      JOIN users u ON v.user_id = u.id
    `;
    const params = [];
    if (status && status !== 'all') {
      query += ` WHERE v.status = ?`;
      params.push(status);
    }
    query += ` ORDER BY v.created_at DESC`;
    const [rows] = await pool.query(query, params);

    const content = rows.map(r => {
      // Determine clear content type
      const isVideoFile = r.video_url && Boolean(r.video_url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i));
      let resolvedType = r.media_type || (isVideoFile ? 'video' : 'image');
      let displayType = 'Video';
      if (resolvedType === 'image') {
        displayType = r.category === 'Photo' ? 'Photo' : 'Post';
      } else {
        displayType = (r.category === 'Reel' || r.duration <= 90) ? 'Reel' : 'Video';
      }

      return {
        id: r.id,
        itemType: 'video',
        title: r.title,
        caption: r.caption || '',
        category: r.category || 'Reel',
        mediaUrl: r.video_url,
        thumbnail: r.thumbnail_url || r.video_url,
        contentType: resolvedType,
        displayType,
        hashtags: r.hashtags || '',
        location: r.location || '',
        audioTitle: r.audio_title || '',
        duration: r.duration || 0,
        userId: r.user_id,
        creator: r.creator,
        creatorName: r.creator_name,
        avatar: r.avatar || '/brand/default-avatar.svg',
        userStatus: r.user_status || 'Active',
        date: new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        createdAt: r.created_at,
        status: r.status || 'Pending'
      };
    });

    return res.json({ content, count: content.length });
  } catch (err) {
    console.error('Get admin content error:', err);
    return res.status(500).json({ error: 'Failed to fetch platform content' });
  }
}

// 2. Get pending videos awaiting admin verification (Stories publish immediately and are excluded here)
export async function getAdminPendingContent(req, res) {
  try {
    const [videoRows] = await pool.query(`
      SELECT 
        v.id, v.title, v.description AS caption, v.category, v.video_url, v.thumbnail_url,
        v.media_type, v.hashtags, v.location, v.audio_title, v.duration, v.created_at, v.status,
        u.id AS user_id, u.name AS creator_name, u.username AS creator, u.avatar_url AS avatar, u.status AS user_status
      FROM videos v
      JOIN users u ON v.user_id = u.id
      WHERE v.status = 'Pending'
      ORDER BY v.created_at DESC
    `);

    const pending = videoRows.map(r => {
      const isVideoFile = r.video_url && Boolean(r.video_url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i));
      let resolvedType = r.media_type || (isVideoFile ? 'video' : 'image');
      let displayType = resolvedType === 'image' ? (r.category === 'Photo' ? 'Photo' : 'Post') : ((r.category === 'Reel' || r.duration <= 90) ? 'Reel' : 'Video');

      return {
        id: r.id,
        itemType: 'video',
        title: r.title,
        caption: r.caption || '',
        category: r.category || 'Reel',
        mediaUrl: r.video_url,
        thumbnail: r.thumbnail_url || r.video_url,
        contentType: resolvedType,
        displayType,
        hashtags: r.hashtags || '',
        location: r.location || '',
        audioTitle: r.audio_title || '',
        duration: r.duration || 0,
        userId: r.user_id,
        creator: r.creator,
        creatorName: r.creator_name,
        avatar: r.avatar || '/brand/default-avatar.svg',
        userStatus: r.user_status || 'Active',
        date: new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        createdAt: r.created_at,
        status: r.status
      };
    });

    return res.json({ pending, count: pending.length });
  } catch (err) {
    console.error('Get admin pending content error:', err);
    return res.status(500).json({ error: 'Failed to fetch pending content' });
  }
}

// 3. Moderate content: Approve, Reject, or Reopen for review
export async function handleContentModeration(req, res) {
  try {
    const { id } = req.params;
    const { action, itemType = 'video' } = req.body; // 'approve' | 'reject' | 'reopen'

    let newStatus = 'Pending';
    if (action === 'approve') newStatus = 'Approved';
    else if (action === 'reject') newStatus = 'Rejected';
    else if (action === 'reopen') newStatus = 'Pending';

    if (itemType === 'story') {
      await pool.query("UPDATE stories SET status = ? WHERE id = ?", [newStatus, id]);
    } else {
      await pool.query("UPDATE videos SET status = ? WHERE id = ?", [newStatus, id]);
    }

    // In-app notifications
    try {
      const table = itemType === 'story' ? 'stories' : 'videos';
      const [rows] = await pool.query(
        `SELECT user_id, ${itemType === 'story' ? 'caption AS title' : 'title'} FROM ${table} WHERE id = ?`,
        [id]
      );
      if (rows.length > 0) {
        if (action === 'approve') {
          await pool.query(
            `INSERT INTO notifications (user_id, type, title, message)
             VALUES (?, 'system', 'Content Approved & Published! 🎉', ?)`,
            [rows[0].user_id, `Your ${itemType} "${rows[0].title || 'upload'}" has been approved by admin and is now live on FunFlick!`]
          );
        } else if (action === 'reject') {
          await pool.query(
            `INSERT INTO notifications (user_id, type, title, message)
             VALUES (?, 'system', 'Content Not Approved', ?)`,
            [rows[0].user_id, `Your ${itemType} "${rows[0].title || 'upload'}" was not approved during quality review.`]
          );
        }
      }
    } catch (e) {}

    const message = action === 'approve' 
      ? 'Content approved and published live!' 
      : action === 'reject' 
        ? 'Content marked as rejected.' 
        : 'Content reopened for review (Pending).';

    return res.json({ success: true, status: newStatus, message });
  } catch (err) {
    console.error('Content moderation error:', err);
    return res.status(500).json({ error: 'Failed to moderate content' });
  }
}

// 4. Admin Story Moderation: Get all active, unexpired stories
export async function getAdminActiveStories(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.id, s.user_id, s.media_url, s.media_type, s.caption, s.music, s.sticker,
        s.created_at, s.expires_at, s.status,
        TIMESTAMPDIFF(MINUTE, NOW(), s.expires_at) AS minutes_remaining,
        u.name, u.username, u.avatar_url, u.status AS user_status
      FROM stories s
      JOIN users u ON s.user_id = u.id
      WHERE (s.expires_at IS NULL OR s.expires_at > NOW())
      ORDER BY s.created_at DESC
    `);

    const stories = rows.map(r => {
      const isVideo = r.media_type === 'video' || Boolean(r.media_url?.match(/\.(mp4|webm|mov)(\?.*)?$/i));
      const minsRem = r.minutes_remaining != null ? Math.max(0, r.minutes_remaining) : 1440;
      const hoursRem = Math.floor(minsRem / 60);
      const remText = hoursRem > 0 ? `${hoursRem}h ${minsRem % 60}m` : `${minsRem}m`;

      return {
        id: r.id,
        userId: r.user_id,
        name: r.name,
        username: r.username,
        avatar: r.avatar_url || '/brand/default-avatar.svg',
        userStatus: r.user_status || 'Active',
        mediaUrl: r.media_url,
        mediaType: isVideo ? 'video' : 'image',
        caption: r.caption || '',
        music: r.music || '',
        sticker: r.sticker || '',
        uploadedAt: r.created_at,
        expiresAt: r.expires_at,
        minutesRemaining: minsRem,
        timeRemainingText: remText,
        formattedUpload: new Date(r.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }),
        formattedExpires: r.expires_at ? new Date(r.expires_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'In 24h'
      };
    });

    return res.json({ stories, totalActive: stories.length });
  } catch (err) {
    console.error('Get admin active stories error:', err);
    return res.status(500).json({ error: 'Failed to fetch active stories' });
  }
}

// 5. Admin Story Moderation: Delete violating story immediately
export async function deleteAdminStory(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT user_id, caption FROM stories WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Story not found or already deleted' });
    }

    await pool.query('DELETE FROM stories WHERE id = ?', [id]);

    // Send notification to creator
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES (?, 'system', 'Story Removed by Admin Moderation', 'Your active story was removed by Admin for violating community guidelines.')`,
        [rows[0].user_id]
      );
    } catch (e) {}

    return res.json({ success: true, message: 'Story deleted immediately from platform' });
  } catch (err) {
    console.error('Delete admin story error:', err);
    return res.status(500).json({ error: 'Failed to delete story' });
  }
}

// 6. Admin Story Moderation: Suspend or reactivate creator account
export async function suspendStoryCreator(req, res) {
  try {
    const { userId } = req.params;
    const [rows] = await pool.query('SELECT status, username FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const nextStatus = rows[0].status === 'Active' ? 'Suspended' : 'Active';
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [nextStatus, userId]);

    return res.json({ 
      success: true, 
      userStatus: nextStatus, 
      message: `Account @${rows[0].username} has been ${nextStatus === 'Suspended' ? 'suspended' : 'reactivated'}.` 
    });
  } catch (err) {
    console.error('Suspend creator error:', err);
    return res.status(500).json({ error: 'Failed to update user status' });
  }
}

// 7. Get live platform overview statistics for admin dashboard
export async function getAdminStats(req, res) {
  try {
    const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) AS totalUsers FROM users WHERE role != 'admin'");
    const [[{ totalCreators }]] = await pool.query("SELECT COUNT(*) AS totalCreators FROM users WHERE role = 'creator' OR is_influencer = 1");
    const [[{ totalVideos }]] = await pool.query("SELECT COUNT(*) AS totalVideos FROM videos WHERE status = 'Approved'");
    const [[{ pendingVideos }]] = await pool.query("SELECT COUNT(*) AS pendingVideos FROM videos WHERE status = 'Pending'");
    const [[{ activeStories }]] = await pool.query("SELECT COUNT(*) AS activeStories FROM stories WHERE expires_at IS NULL OR expires_at > NOW()");
    const [[{ activeSubscriptions }]] = await pool.query("SELECT COUNT(*) AS activeSubscriptions FROM users WHERE subscription_plan IS NOT NULL");
    const [[{ creatorPayments }]] = await pool.query("SELECT COALESCE(SUM(amount), 0) AS creatorPayments FROM creator_payouts WHERE status = 'Paid'");
    const [[{ reportedContent }]] = await pool.query("SELECT COUNT(*) AS reportedContent FROM content_reports WHERE status = 'Pending'");

    return res.json({
      stats: {
        totalUsers,
        totalCreators,
        totalVideos,
        pendingApprovals: Number(pendingVideos), // only permanent content requires pending approval
        activeStories: Number(activeStories),
        activeSubscriptions,
        totalRevenue: Number(activeSubscriptions) * 199,
        creatorPayments: Number(creatorPayments),
        reportedContent: Number(reportedContent)
      }
    });
  } catch (err) {
    console.error('Get admin stats error:', err);
    return res.status(500).json({ error: 'Failed to load platform stats' });
  }
}
