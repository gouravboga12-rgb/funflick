import pool from '../config/db.js';

export async function getSettings(req, res) {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM platform_settings');
    const settings = {
      maxReelDuration: 30,
      maxStoryDuration: 15,
      maxPostDuration: 30,
      adContactEmail: 'ads@funflick.in',
      adContactPhone: '+91 98765 43210',
      adContactWhatsapp: '+91 98765 43210',
      adContactTimings: 'Mon - Sat, 9:00 AM - 7:00 PM IST'
    };
    rows.forEach(r => {
      if (r.setting_key === 'max_reel_duration') settings.maxReelDuration = Number(r.setting_value) || 30;
      if (r.setting_key === 'max_story_duration') settings.maxStoryDuration = Number(r.setting_value) || 15;
      if (r.setting_key === 'max_post_duration') settings.maxPostDuration = Number(r.setting_value) || 30;
      if (r.setting_key === 'ad_contact_email') settings.adContactEmail = r.setting_value;
      if (r.setting_key === 'ad_contact_phone') settings.adContactPhone = r.setting_value;
      if (r.setting_key === 'ad_contact_whatsapp') settings.adContactWhatsapp = r.setting_value;
      if (r.setting_key === 'ad_contact_timings') settings.adContactTimings = r.setting_value;
    });
    return res.json({ success: true, settings });
  } catch (err) {
    console.error('Get settings error:', err);
    return res.status(500).json({ error: 'Failed to fetch platform settings' });
  }
}

export async function updateSettings(req, res) {
  try {
    const { 
      maxReelDuration, 
      maxStoryDuration, 
      maxPostDuration,
      adContactEmail,
      adContactPhone,
      adContactWhatsapp,
      adContactTimings
    } = req.body;

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
    if (adContactEmail !== undefined) {
      await pool.query(
        'INSERT INTO platform_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['ad_contact_email', String(adContactEmail), String(adContactEmail)]
      );
    }
    if (adContactPhone !== undefined) {
      await pool.query(
        'INSERT INTO platform_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['ad_contact_phone', String(adContactPhone), String(adContactPhone)]
      );
    }
    if (adContactWhatsapp !== undefined) {
      await pool.query(
        'INSERT INTO platform_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['ad_contact_whatsapp', String(adContactWhatsapp), String(adContactWhatsapp)]
      );
    }
    if (adContactTimings !== undefined) {
      await pool.query(
        'INSERT INTO platform_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['ad_contact_timings', String(adContactTimings), String(adContactTimings)]
      );
    }

    // Re-fetch all settings to return clean current state
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM platform_settings');
    const updated = {
      maxReelDuration: 30,
      maxStoryDuration: 15,
      maxPostDuration: 30,
      adContactEmail: 'ads@funflick.in',
      adContactPhone: '+91 98765 43210',
      adContactWhatsapp: '+91 98765 43210',
      adContactTimings: 'Mon - Sat, 9:00 AM - 7:00 PM IST'
    };
    rows.forEach(r => {
      if (r.setting_key === 'max_reel_duration') updated.maxReelDuration = Number(r.setting_value) || 30;
      if (r.setting_key === 'max_story_duration') updated.maxStoryDuration = Number(r.setting_value) || 15;
      if (r.setting_key === 'max_post_duration') updated.maxPostDuration = Number(r.setting_value) || 30;
      if (r.setting_key === 'ad_contact_email') updated.adContactEmail = r.setting_value;
      if (r.setting_key === 'ad_contact_phone') updated.adContactPhone = r.setting_value;
      if (r.setting_key === 'ad_contact_whatsapp') updated.adContactWhatsapp = r.setting_value;
      if (r.setting_key === 'ad_contact_timings') updated.adContactTimings = r.setting_value;
    });

    return res.json({
      success: true,
      message: 'Platform settings updated successfully in AWS MySQL',
      settings: updated
    });
  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(500).json({ error: 'Failed to update platform settings' });
  }
}
