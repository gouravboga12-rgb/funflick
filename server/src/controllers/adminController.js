import pool from '../config/db.js';

export async function getAdminUsers(req, res) {
  try {
    const { search = '', status = '', filter = '' } = req.query;

    let query = `
      SELECT 
        u.id, u.name, u.username, u.email, u.phone, u.avatar_url,
        u.role, u.is_influencer, u.subscription_plan, u.subscription_start, u.subscription_expires_at, u.wallet_balance,
        u.status, u.suspended_at, u.suspended_until, u.suspension_reason, u.created_at,
        (SELECT COUNT(*) FROM videos v WHERE v.user_id = u.id) AS posts_count,
        (SELECT COALESCE(SUM(views_count), 0) FROM videos v WHERE v.user_id = u.id) AS total_views
      FROM users u
      WHERE 1=1
    `;
    const params = [];

    if (search.trim()) {
      query += ` AND (u.name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      const q = `%${search.trim()}%`;
      params.push(q, q, q, q);
    }

    if (status && status !== 'all') {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    if (filter === 'influencer') {
      query += ` AND u.is_influencer = 1`;
    }

    query += ` ORDER BY u.created_at DESC`;

    const [rows] = await pool.query(query, params);

    const now = new Date();
    const users = rows.map(r => {
      const expDate = r.subscription_expires_at ? new Date(r.subscription_expires_at) : null;
      const isSubActive = Boolean(r.is_influencer && expDate && expDate > now);

      return {
        id: r.id,
        name: r.name,
        username: r.username,
        email: r.email,
        phone: r.phone || 'Not provided',
        avatar: r.avatar_url || '/brand/default-avatar.svg',
        role: r.role,
        isInfluencer: Boolean(r.is_influencer),
        subscription: r.subscription_plan || (isSubActive ? 'Monthly Influencer Pro' : 'Free Member'),
        subscriptionExpiresAt: r.subscription_expires_at,
        subscriptionStart: r.subscription_start,
        isSubscriptionActive: isSubActive,
        wallet: `₹${(r.wallet_balance || 0).toLocaleString()}`,
        walletBalance: r.wallet_balance || 0,
        joined: new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: r.status || 'Active',
        suspendedAt: r.suspended_at,
        suspendedUntil: r.suspended_until,
        suspensionReason: r.suspension_reason,
        postsCount: r.posts_count || 0,
        totalViews: r.total_views || 0
      };
    });

    return res.json({ 
      users, 
      totalCount: users.length,
      activeCount: users.filter(u => u.status === 'Active').length,
      suspendedCount: users.filter(u => u.status === 'Suspended').length
    });
  } catch (err) {
    console.error('Get admin users error:', err);
    return res.status(500).json({ error: 'Failed to fetch registered users' });
  }
}

export async function toggleUserStatus(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT status, username FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const nextStatus = rows[0].status === 'Active' ? 'Suspended' : 'Active';
    await pool.query('UPDATE users SET status = ?, suspended_until = NULL WHERE id = ?', [nextStatus, id]);

    return res.json({ success: true, status: nextStatus, message: `User status set to ${nextStatus}` });
  } catch (err) {
    console.error('Toggle user status error:', err);
    return res.status(500).json({ error: 'Failed to update user status' });
  }
}

// Suspend account with duration: 1d, 3d, 7d, 30d, custom date, or permanent
export async function suspendUserWithDuration(req, res) {
  try {
    const id = req.params.id || req.params.userId;
    const { 
      duration = '7d', // '1d' | '3d' | '7d' | '30d' | 'custom' | 'permanent'
      customUntil = null,
      reason = 'Violation of FunFlick community safety standards'
    } = req.body;

    const [rows] = await pool.query('SELECT id, name, username, email FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const targetUser = rows[0];

    const now = new Date();
    let suspendedUntil = null;
    let durationLabel = 'Permanent suspension';

    if (duration === '1d') {
      suspendedUntil = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
      durationLabel = '1 Day (24 hours)';
    } else if (duration === '3d') {
      suspendedUntil = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      durationLabel = '3 Days';
    } else if (duration === '7d') {
      suspendedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      durationLabel = '7 Days';
    } else if (duration === '30d') {
      suspendedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      durationLabel = '30 Days';
    } else if (duration === 'custom' && customUntil) {
      suspendedUntil = new Date(customUntil);
      durationLabel = `Custom until ${suspendedUntil.toLocaleDateString('en-IN')}`;
    } else {
      suspendedUntil = null;
      durationLabel = 'Permanent';
    }

    await pool.query(
      `UPDATE users SET 
        status = 'Suspended', 
        suspended_at = NOW(), 
        suspended_until = ?, 
        suspension_reason = ? 
       WHERE id = ?`,
      [suspendedUntil, reason, id]
    );

    const endStr = suspendedUntil 
      ? suspendedUntil.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Permanent (Indefinite)';

    try {
      await pool.query(
        `INSERT INTO notifications (user_id, actor_id, type, title, message)
         VALUES (?, NULL, 'system', 'Account Suspended', ?)`,
        [id, `⚠️ Your account has been suspended until ${endStr}. Reason: ${reason}`]
      );
    } catch (e) {}

    return res.json({
      success: true,
      message: `Account @${targetUser.username} has been suspended (${durationLabel}).`,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        status: 'Suspended',
        suspendedAt: now,
        suspendedUntil,
        reason,
        durationLabel
      }
    });
  } catch (err) {
    console.error('Suspend user with duration error:', err);
    return res.status(500).json({ error: 'Failed to suspend user' });
  }
}

// Reactivate user account
export async function reactivateUser(req, res) {
  try {
    const id = req.params.id || req.params.userId;
    const [rows] = await pool.query('SELECT id, username FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    await pool.query(
      `UPDATE users SET status = 'Active', suspended_until = NULL, suspension_reason = NULL WHERE id = ?`,
      [id]
    );

    try {
      await pool.query(
        `INSERT INTO notifications (user_id, actor_id, type, title, message)
         VALUES (?, NULL, 'system', 'Account Reactivated', '✅ Your FunFlick account has been reactivated. You can now post and interact freely.')`,
        [id]
      );
    } catch (e) {}

    return res.json({
      success: true,
      message: `Account @${rows[0].username} has been reactivated.`,
      status: 'Active'
    });
  } catch (err) {
    console.error('Reactivate user error:', err);
    return res.status(500).json({ error: 'Failed to reactivate user' });
  }
}

// Delete content permanently from platform
export async function deleteAdminContent(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT user_id, title FROM videos WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Content not found' });

    const v = rows[0];
    await pool.query('DELETE FROM videos WHERE id = ?', [id]);

    try {
      await pool.query(
        `INSERT INTO notifications (user_id, actor_id, type, title, message)
         VALUES (?, NULL, 'system', 'Content Removed', ?)`,
        [v.user_id, `Your upload "${v.title || 'Video'}" was removed by Admin for violating community guidelines.`]
      );
    } catch (e) {}

    return res.json({ success: true, message: 'Content permanently deleted' });
  } catch (err) {
    console.error('Delete admin content error:', err);
    return res.status(500).json({ error: 'Failed to delete content' });
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

// 7. Get all subscription payment transactions for admin revenue page
export async function getAdminTransactions(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT
        us.id,
        us.plan_id,
        us.plan_name,
        us.price,
        us.duration_days,
        us.payment_id,
        us.payment_status,
        us.start_date,
        us.end_date,
        us.created_at,
        u.id AS user_id,
        u.name AS user_name,
        u.username,
        u.email AS user_email,
        u.avatar_url AS user_avatar
      FROM user_subscriptions us
      JOIN users u ON us.user_id = u.id
      ORDER BY us.created_at DESC
      LIMIT 500
    `);

    const transactions = rows.map(r => ({
      id: r.id,
      razorpayPaymentId: r.payment_id || `PAY_${r.id}`,
      planId: r.plan_id || 'monthly',
      planName: r.plan_name || 'Monthly Influencer Pro',
      planDuration: r.duration_days ? `${r.duration_days} Days` : '30 Days',
      amount: Number(r.price) || 199,
      status: r.payment_status || 'success',
      date: r.created_at,
      formattedDate: new Date(r.created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
      userName: r.user_name || 'User',
      user: r.username || 'user',
      userEmail: r.user_email || '',
      userAvatar: r.user_avatar || '/brand/default-avatar.svg',
      paymentGateway: 'Razorpay Test',
      userId: r.user_id
    }));

    return res.json({ transactions, totalCount: transactions.length });
  } catch (err) {
    console.error('Get admin transactions error:', err);
    return res.status(500).json({ error: 'Failed to fetch subscription transactions' });
  }
}

// 8. Get live platform overview statistics for admin dashboard
export async function getAdminStats(req, res) {
  try {
    const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) AS totalUsers FROM users WHERE role != 'admin'");
    const [[{ totalCreators }]] = await pool.query("SELECT COUNT(*) AS totalCreators FROM users WHERE role = 'creator' OR is_influencer = 1");
    const [[{ totalVideos }]] = await pool.query("SELECT COUNT(*) AS totalVideos FROM videos WHERE status = 'Approved'");
    const [[{ pendingVideos }]] = await pool.query("SELECT COUNT(*) AS pendingVideos FROM videos WHERE status = 'Pending'");
    const [[{ activeStories }]] = await pool.query("SELECT COUNT(*) AS activeStories FROM stories WHERE expires_at IS NULL OR expires_at > NOW()");
    const [[{ activeSubscriptions }]] = await pool.query("SELECT COUNT(*) AS activeSubscriptions FROM users WHERE is_influencer = 1 AND subscription_expires_at > NOW()");
    const [[{ totalRevenue }]] = await pool.query("SELECT COALESCE(SUM(price), 0) AS totalRevenue FROM user_subscriptions WHERE payment_status = 'success'");
    const [[{ creatorPayments }]] = await pool.query("SELECT COALESCE(SUM(amount), 0) AS creatorPayments FROM creator_payouts WHERE status = 'Paid'");
    const [[{ reportedContent }]] = await pool.query("SELECT COUNT(*) AS reportedContent FROM content_reports WHERE status = 'Pending'");

    return res.json({
      stats: {
        totalUsers,
        totalCreators,
        totalVideos,
        pendingApprovals: Number(pendingVideos),
        activeStories: Number(activeStories),
        activeSubscriptions,
        totalRevenue: Number(totalRevenue),
        creatorPayments: Number(creatorPayments),
        reportedContent: Number(reportedContent)
      }
    });
  } catch (err) {
    console.error('Get admin stats error:', err);
    return res.status(500).json({ error: 'Failed to load platform stats' });
  }
}

// 9. Get all In-App Ads for Admin Management & Mobile Feeds
export async function getAdminAds(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM platform_ads ORDER BY created_at DESC');
    const ads = rows.map(r => ({
      id: r.id,
      title: r.title,
      type: r.type,
      mediaUrl: r.media_url,
      thumbnailUrl: r.thumbnail_url || r.media_url,
      duration: Number(r.duration) || 20,
      allowCloseAfter: Number(r.allow_close_after) || 8,
      active: Boolean(r.active),
      startDate: r.start_date || '2026-10-01',
      endDate: r.end_date || '2026-11-30',
      frequency: r.frequency || 'Every 3 Reels',
      actionUrl: r.action_url || 'https://funflick.in',
      actionText: r.action_text || 'Learn More',
      impressions: Number(r.impressions) || 0,
      clicks: Number(r.clicks) || 0
    }));
    return res.json({ ads });
  } catch (err) {
    console.error('Get admin ads error:', err);
    return res.status(500).json({ error: 'Failed to fetch advertisements' });
  }
}

// 10. Create or update an ad
export async function createAdminAd(req, res) {
  try {
    const {
      id = `ad_${Date.now()}`,
      title,
      type = 'video',
      mediaUrl,
      thumbnailUrl,
      duration = 20,
      allowCloseAfter = 8,
      active = true,
      startDate = '2026-10-01',
      endDate = '2026-11-30',
      frequency = 'Every 3 Reels',
      actionUrl = 'https://funflick.in',
      actionText = 'Learn More'
    } = req.body;

    if (!title || !mediaUrl) {
      return res.status(400).json({ error: 'Title and media URL are required' });
    }

    await pool.query(
      `INSERT INTO platform_ads 
        (id, title, type, media_url, thumbnail_url, duration, allow_close_after, active, start_date, end_date, frequency, action_url, action_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        type = VALUES(type),
        media_url = VALUES(media_url),
        thumbnail_url = VALUES(thumbnail_url),
        duration = VALUES(duration),
        allow_close_after = VALUES(allow_close_after),
        active = VALUES(active),
        start_date = VALUES(start_date),
        end_date = VALUES(end_date),
        frequency = VALUES(frequency),
        action_url = VALUES(action_url),
        action_text = VALUES(action_text)`,
      [
        id,
        title,
        type,
        mediaUrl,
        thumbnailUrl || mediaUrl,
        duration,
        allowCloseAfter,
        active ? 1 : 0,
        startDate,
        endDate,
        frequency,
        actionUrl,
        actionText
      ]
    );

    return res.json({ success: true, message: 'Ad created successfully', id });
  } catch (err) {
    console.error('Create admin ad error:', err);
    return res.status(500).json({ error: 'Failed to save advertisement' });
  }
}

// 11. Delete an ad
export async function deleteAdminAd(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM platform_ads WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Ad deleted successfully' });
  } catch (err) {
    console.error('Delete admin ad error:', err);
    return res.status(500).json({ error: 'Failed to delete advertisement' });
  }
}

// 12. Record Ad Impression / Click (Accessible by mobile feed)
export async function recordAdMetric(req, res) {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'impression' | 'click'
    if (action === 'click') {
      await pool.query('UPDATE platform_ads SET clicks = clicks + 1 WHERE id = ?', [id]);
    } else {
      await pool.query('UPDATE platform_ads SET impressions = impressions + 1 WHERE id = ?', [id]);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record ad metric' });
  }
}

// 13. Get all Influencer & Creator Media for Admin Review & Rewards
export async function getAdminInfluencerMedia(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        v.id,
        v.title,
        v.video_url,
        v.thumbnail_url,
        v.category,
        v.views_count,
        v.likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.video_id = v.id) AS comments_count,
        0 AS shares_count,
        v.created_at,
        u.id AS user_id,
        u.name AS user_name,
        u.username,
        u.avatar_url,
        u.is_influencer,
        u.subscription_plan,
        u.subscription_expires_at
      FROM videos v
      JOIN users u ON v.user_id = u.id
      ORDER BY v.views_count DESC, v.created_at DESC
      LIMIT 250
    `);

    const media = rows.map(r => {
      const isVideo = !(/\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(r.video_url || '') || r.category === 'Photo' || r.category === 'Post');
      const views = Number(r.views_count) || 0;
      const likes = Number(r.likes_count) || 0;
      const comments = Number(r.comments_count) || 0;
      const shares = Number(r.shares_count) || 0;
      const totalInteractions = likes + comments + shares;
      const engRate = views > 0 ? ((totalInteractions / views) * 100).toFixed(1) + '%' : '3.8%';

      const formattedDate = new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const safeAvatar = r.avatar_url || '/brand/default-avatar.svg';
      const safeThumbnail = r.thumbnail_url || r.video_url;

      const isInfluencer = Boolean(r.is_influencer) && (
        !r.subscription_expires_at || new Date(r.subscription_expires_at) > new Date()
      );
      const subscriptionPlan = isInfluencer 
        ? (r.subscription_plan || 'Weekly Influencer') 
        : 'Free User';

      return {
        id: r.id,
        title: r.title || 'Creator Media',
        mediaUrl: r.video_url,
        videoUrl: r.video_url,
        thumbnailUrl: safeThumbnail,
        thumbnail: safeThumbnail,
        contentType: isVideo ? 'video' : 'post',
        category: r.category || 'Reel',
        isInfluencer: isInfluencer,
        influencerName: r.user_name || 'Creator',
        username: r.username || 'user',
        influencerAvatar: safeAvatar,
        avatar: safeAvatar,
        avatarUrl: safeAvatar,
        subscriptionPlan: subscriptionPlan,
        viewsCount: views,
        views: views >= 1000 ? (views / 1000).toFixed(1) + 'K' : views,
        likesCount: likes,
        likes: likes >= 1000 ? (likes / 1000).toFixed(1) + 'K' : likes,
        commentsCount: comments,
        comments: comments >= 1000 ? (comments / 1000).toFixed(1) + 'K' : comments,
        sharesCount: shares,
        shares: shares >= 1000 ? (shares / 1000).toFixed(1) + 'K' : shares,
        engagementRate: engRate,
        paymentStatus: 'Pending Reward',
        paidAmount: 0,
        publishedDate: formattedDate,
        date: formattedDate
      };
    });

    return res.json({ media, totalCount: media.length });
  } catch (err) {
    console.error('Get admin influencer media error:', err);
    return res.status(500).json({ error: 'Failed to fetch influencer media' });
  }
}

