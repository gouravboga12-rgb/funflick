import pool from '../config/db.js';

// Format time ago or relative timestamp
function formatTime(dateStr) {
  if (!dateStr) return 'Just now';
  const d = new Date(dateStr);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// 1. Get all active conversations for current user
export async function listConversations(req, res) {
  try {
    const currentUserId = req.user.id;

    // Find distinct conversation partners with their latest message
    const [rows] = await pool.query(
      `
      SELECT 
        u.id AS user_id,
        u.name,
        u.username,
        u.avatar_url,
        m.id AS last_message_id,
        m.message_text AS last_message,
        m.media_url,
        m.media_type,
        m.created_at AS last_time,
        (
          SELECT COUNT(*) 
          FROM messages 
          WHERE sender_id = u.id AND recipient_id = ? AND is_read = 0
        ) AS unread_count
      FROM (
        SELECT 
          CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END AS partner_id,
          MAX(id) AS latest_msg_id
        FROM messages
        WHERE sender_id = ? OR recipient_id = ?
        GROUP BY partner_id
      ) latest
      JOIN messages m ON m.id = latest.latest_msg_id
      JOIN users u ON u.id = latest.partner_id
      ORDER BY m.created_at DESC
      `,
      [currentUserId, currentUserId, currentUserId, currentUserId]
    );

    const conversations = rows.map(r => {
      let preview = r.last_message;
      if (!preview && r.media_url) {
        preview = r.media_type === 'video' ? '🎥 Video' : '📷 Photo';
      }
      return {
        id: `conv_${r.user_id}`,
        userId: r.user_id,
        user: {
          id: r.user_id,
          name: r.name || r.username,
          username: r.username,
          avatar: r.avatar_url || '/brand/default-avatar.svg',
          isOnline: true
        },
        lastMessage: preview || 'Chat started',
        time: formatTime(r.last_time),
        lastTimeRaw: r.last_time,
        unreadCount: Number(r.unread_count) || 0
      };
    });

    return res.json({ conversations });
  } catch (err) {
    console.error('List conversations error:', err);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}

// 2. Get message history with a specific user (by userId or username)
export async function getMessages(req, res) {
  try {
    const currentUserId = req.user.id;
    const { partnerId } = req.params;

    // Check if partnerId is numeric ID or username
    let targetUserId = parseInt(partnerId, 10);
    if (isNaN(targetUserId)) {
      const [uRows] = await pool.query('SELECT id FROM users WHERE username = ? LIMIT 1', [partnerId]);
      if (uRows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      targetUserId = uRows[0].id;
    }

    // Fetch messages between these two users
    const [rows] = await pool.query(
      `
      SELECT 
        id, sender_id, recipient_id, message_text, media_url, media_type, media_name, media_size, is_read, created_at
      FROM messages
      WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
      ORDER BY created_at ASC
      `,
      [currentUserId, targetUserId, targetUserId, currentUserId]
    );

    // Mark incoming messages as read
    await pool.query(
      'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND recipient_id = ? AND is_read = 0',
      [targetUserId, currentUserId]
    );

    const messages = rows.map(m => ({
      id: m.id,
      sender: m.sender_id === currentUserId ? 'me' : 'them',
      senderId: m.sender_id,
      recipientId: m.recipient_id,
      text: m.message_text || '',
      media: m.media_url ? {
        url: m.media_url,
        type: m.media_type || 'image',
        name: m.media_name || 'attachment',
        size: m.media_size || ''
      } : null,
      time: formatTime(m.created_at),
      createdAt: m.created_at,
      isRead: Boolean(m.is_read)
    }));

    return res.json({ messages });
  } catch (err) {
    console.error('Get messages error:', err);
    return res.status(500).json({ error: 'Failed to load messages' });
  }
}

// 3. Send a message to a user
export async function sendMessage(req, res) {
  try {
    const senderId = req.user.id;
    const { partnerId } = req.params;
    const { text, media } = req.body;

    if (!text?.trim() && !media?.url) {
      return res.status(400).json({ error: 'Message content or media is required' });
    }

    // Determine target user ID
    let recipientId = parseInt(partnerId, 10);
    if (isNaN(recipientId)) {
      const [uRows] = await pool.query('SELECT id, name, username FROM users WHERE username = ? LIMIT 1', [partnerId]);
      if (uRows.length === 0) {
        return res.status(404).json({ error: 'Recipient user not found' });
      }
      recipientId = uRows[0].id;
    }

    // Allow self-chat (saved messages / notes to self)
    const isSelfChat = recipientId === senderId;

    // Insert into messages table
    const [result] = await pool.query(
      `
      INSERT INTO messages (sender_id, recipient_id, message_text, media_url, media_type, media_name, media_size, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        senderId,
        recipientId,
        text?.trim() || '',
        media?.url || null,
        media?.type || null,
        media?.name || null,
        media?.size ? String(media.size) : null,
        isSelfChat ? 1 : 0
      ]
    );

    // Fetch sender info for recipient notification
    const [senderRows] = await pool.query('SELECT name, username FROM users WHERE id = ?', [senderId]);
    const senderName = senderRows[0]?.name || senderRows[0]?.username || 'Someone';

    // Insert notification for recipient (if not self-chat)
    if (!isSelfChat) {
      try {
        const notifSnippet = text?.trim() ? text.trim().slice(0, 50) : (media?.type === 'video' ? 'Sent a video' : 'Sent a photo');
        await pool.query(
          `
          INSERT INTO notifications (user_id, actor_id, type, title, message)
          VALUES (?, ?, 'system', 'New Message', ?)
          `,
          [recipientId, senderId, `${senderName}: ${notifSnippet}`]
        );
      } catch (e) {}
    }

    const newMsg = {
      id: result.insertId,
      sender: 'me',
      senderId,
      recipientId,
      text: text?.trim() || '',
      media: media?.url ? {
        url: media.url,
        type: media.type || 'image',
        name: media.name || 'attachment',
        size: media.size ? String(media.size) : ''
      } : null,
      time: 'Just now',
      createdAt: new Date().toISOString(),
      isRead: false
    };

    return res.status(201).json({ message: newMsg });
  } catch (err) {
    console.error('Send message error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
