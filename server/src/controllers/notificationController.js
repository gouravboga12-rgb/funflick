import pool from '../config/db.js';

export async function listNotifications(req, res) {
  try {
    const currentUserId = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
        n.id, n.type, n.title, n.message, n.target_id, n.is_read, n.created_at,
        u.name AS actor_name, u.username AS actor_username, u.avatar_url AS actor_avatar
       FROM notifications n
       LEFT JOIN users u ON n.actor_id = u.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [currentUserId]
    );

    const rawList = rows.map(r => {
      const actorName = r.actor_name || '';
      const rawMsg = r.message || '';
      let cleanText = rawMsg;

      if (actorName) {
        if (rawMsg.startsWith('started following you')) {
          cleanText = `${actorName} ${rawMsg}`;
        } else if (!rawMsg.toLowerCase().startsWith(actorName.toLowerCase())) {
          cleanText = `${actorName}: ${rawMsg}`;
        }
      }

      return {
        id: r.id,
        type: r.type,
        user: r.actor_username ? r.actor_username.replace(/^@+/, '') : 'FunFlick',
        actorUsername: r.actor_username ? r.actor_username.replace(/^@+/, '') : '',
        actorName: r.actor_name || 'FunFlick',
        avatar: r.actor_avatar || '/brand/funflick-logo.png',
        text: cleanText,
        title: r.title,
        time: 'Recently',
        created_at: r.created_at,
        unread: !r.is_read,
        targetId: r.target_id
      };
    });

    // Deduplicate repeat notifications (e.g. repeated follow clicks or identical messages)
    const seen = new Set();
    const notifications = [];

    for (const notif of rawList) {
      const dedupKey = notif.type === 'follow'
        ? `follow_${notif.actorUsername || notif.user}`
        : `${notif.type}_${notif.actorUsername || notif.user}_${notif.text}`;

      if (!seen.has(dedupKey)) {
        seen.add(dedupKey);
        notifications.push(notif);
      }
    }

    return res.json({ notifications, unreadCount: notifications.filter(n => n.unread).length });
  } catch (err) {
    console.error('List notifications error:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

export async function markAllRead(req, res) {
  try {
    const currentUserId = req.user.id;
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [currentUserId]);
    return res.json({ success: true, message: 'All notifications marked as read', unreadCount: 0 });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ error: 'Failed to mark notifications read' });
  }
}

export async function clearAllNotifications(req, res) {
  try {
    const currentUserId = req.user.id;
    await pool.query('DELETE FROM notifications WHERE user_id = ?', [currentUserId]);
    return res.json({ success: true, message: 'All notifications cleared successfully', unreadCount: 0 });
  } catch (err) {
    console.error('Clear notifications error:', err);
    return res.status(500).json({ error: 'Failed to clear notifications' });
  }
}
