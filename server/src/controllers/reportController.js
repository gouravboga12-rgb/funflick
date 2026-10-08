import pool from '../config/db.js';

// User: Submit a report for a video, reel, or post
export async function createReport(req, res) {
  try {
    const reporterId = req.user?.id;
    if (!reporterId) {
      return res.status(401).json({ error: 'You must be logged in to report content' });
    }

    const targetVideoId = parseInt(req.body.targetVideoId || req.body.videoId || req.body.postId, 10);
    const reason = String(req.body.reason || 'Inappropriate content').trim().slice(0, 255);
    const details = req.body.details ? String(req.body.details).trim().slice(0, 2000) : null;

    if (!targetVideoId) {
      return res.status(400).json({ error: 'Valid target content ID is required' });
    }

    // Verify target content exists in MySQL
    const [vRows] = await pool.query(
      'SELECT id, user_id, title FROM videos WHERE id = ?',
      [targetVideoId]
    );

    if (vRows.length === 0) {
      return res.status(404).json({ error: 'The reported content was not found or has already been removed' });
    }

    const video = vRows[0];

    // Prevent reporting own content
    if (Number(video.user_id) === Number(reporterId)) {
      return res.status(400).json({ error: 'You cannot report your own content' });
    }

    // Check if an existing 'Pending' report already exists by this user for this content
    const [existingPending] = await pool.query(
      `SELECT id FROM content_reports 
       WHERE reporter_id = ? AND target_video_id = ? AND status = 'Pending'
       LIMIT 1`,
      [reporterId, targetVideoId]
    );

    if (existingPending.length > 0) {
      // Update existing pending report with newest reason/details and refresh timestamp
      await pool.query(
        `UPDATE content_reports 
         SET reason = ?, details = ?, created_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [reason, details, existingPending[0].id]
      );
      return res.status(200).json({
        success: true,
        message: 'Report received and updated for FunFlick Admin Moderation.',
        reportId: existingPending[0].id
      });
    }

    // Insert a new report into content_reports with status 'Pending'
    const [result] = await pool.query(
      `INSERT INTO content_reports (reporter_id, target_video_id, reason, details, status)
       VALUES (?, ?, ?, ?, 'Pending')`,
      [reporterId, targetVideoId, reason, details]
    );

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Thank you for helping keep FunFlick safe!',
      reportId: result.insertId
    });
  } catch (err) {
    console.error('Create content report error:', err);
    return res.status(500).json({ error: 'Failed to submit report. Please try again later.' });
  }
}

// User: Get history of reports submitted by the authenticated user
export async function getMyReports(req, res) {
  try {
    const reporterId = req.user?.id;
    if (!reporterId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [rows] = await pool.query(
      `SELECT cr.id, cr.reason, cr.details, cr.status, cr.created_at,
              v.title AS video_title, v.thumbnail_url
       FROM content_reports cr
       LEFT JOIN videos v ON cr.target_video_id = v.id
       WHERE cr.reporter_id = ?
       ORDER BY cr.created_at DESC
       LIMIT 50`,
      [reporterId]
    );

    return res.json({ reports: rows });
  } catch (err) {
    console.error('Get my reports error:', err);
    return res.status(500).json({ error: 'Failed to fetch your reports' });
  }
}
