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

    const notifications = rows.map(r => ({
      id: r.id,
      type: r.type,
      user: r.actor_username ? `@${r.actor_username}` : 'FunFlick',
      actorName: r.actor_name || 'FunFlick',
      avatar: r.actor_avatar || '/brand/funflick-logo.png',
      text: r.actor_name ? `${r.actor_name} ${r.message}` : r.message,
      title: r.title,
      time: 'Recently',
      created_at: r.created_at,
      unread: !r.is_read,
      targetId: r.target_id
    }));

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
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ error: 'Failed to mark notifications read' });
  }
}
