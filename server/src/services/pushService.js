import pool from '../config/db.js';

/**
 * Send an Expo Push Notification to a specific target user
 * @param {number} targetUserId Database ID of target user
 * @param {object} messagePayload { title, body, data }
 */
export async function sendPushNotification(targetUserId, { title, body, data = {} }) {
  try {
    if (!targetUserId) return;
    const [rows] = await pool.query('SELECT push_token FROM users WHERE id = ?', [targetUserId]);
    if (!rows.length || !rows[0].push_token) return;

    const rawToken = String(rows[0].push_token || '').trim().replace(/^["']|["']$/g, '');
    if (!rawToken.startsWith('ExponentPushToken[') && !rawToken.startsWith('ExpoPushToken[')) {
      console.log(`User ${targetUserId} has non-expo push token format:`, rawToken);
      return;
    }

    const message = {
      to: rawToken,
      sound: 'default',
      title: title || 'FunFlick',
      body: body || '',
      data: data,
      priority: 'high',
      channelId: 'default',
      badge: 1,
      _displayInForeground: true,
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log(`Push notification sent to user ${targetUserId}:`, result);
    return result;
  } catch (err) {
    console.warn('Push notification delivery error:', err.message);
  }
}

/**
 * Broadcast an announcement push notification to all users with active push tokens
 * @param {object} messagePayload { title, body, data }
 */
export async function broadcastPushNotification({ title, body, data = {} }) {
  try {
    const [rows] = await pool.query(
      "SELECT push_token FROM users WHERE push_token IS NOT NULL AND push_token != '' AND status = 'Active'"
    );

    const validTokens = rows
      .map(r => r.push_token)
      .filter(t => t && (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken[')));

    if (validTokens.length === 0) return;

    // Send in chunks of 100 per Expo documentation
    for (let i = 0; i < validTokens.length; i += 100) {
      const chunk = validTokens.slice(i, i + 100);
      const messages = chunk.map(token => ({
        to: token,
        sound: 'default',
        title: title || 'FunFlick Announcement',
        body: body || '',
        data: data,
        priority: 'high'
      }));

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
    }
  } catch (err) {
    console.warn('Broadcast push error:', err.message);
  }
}
