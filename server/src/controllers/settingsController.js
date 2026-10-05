import pool from '../config/db.js';

export async function getSettings(req, res) {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM platform_settings');
    const settings = {
      maxReelDuration: 30,
      maxStoryDuration: 15,
      maxPostDuration: 30
    };
    rows.forEach(r => {
      if (r.setting_key === 'max_reel_duration') settings.maxReelDuration = Number(r.setting_value) || 30;
      if (r.setting_key === 'max_story_duration') settings.maxStoryDuration = Number(r.setting_value) || 15;
      if (r.setting_key === 'max_post_duration') settings.maxPostDuration = Number(r.setting_value) || 30;
    });
    return res.json({ success: true, settings });
  } catch (err) {
    console.error('Get settings error:', err);
    return res.status(500).json({ error: 'Failed to fetch platform settings' });
  }
}

export async function updateSettings(req, res) {
  try {
    const { maxReelDuration, maxStoryDuration, maxPostDuration } = req.body;

    if (maxReelDuration !== undefined) {
      await pool.query(
        'INSERT INTO platform_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['max_reel_duration', String(maxReelDuration), String(maxReelDuration)]
      );
    }
    if (maxStoryDuration !== undefined) {
      await pool.query(
        'INSERT INTO platform_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['max_story_duration', String(maxStoryDuration), String(maxStoryDuration)]
      );
    }
    if (maxPostDuration !== undefined) {
      await pool.query(
        'INSERT INTO platform_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['max_post_duration', String(maxPostDuration), String(maxPostDuration)]
      );
    }

    return res.json({
      success: true,
      message: 'Platform settings updated successfully in AWS MySQL',
      settings: {
        maxReelDuration: Number(maxReelDuration) || 30,
        maxStoryDuration: Number(maxStoryDuration) || 15,
        maxPostDuration: Number(maxPostDuration) || 30
      }
    });
  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(500).json({ error: 'Failed to update platform settings' });
  }
}
