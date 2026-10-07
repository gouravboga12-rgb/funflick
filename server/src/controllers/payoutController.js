import pool from '../config/db.js';

export async function savePayoutDetails(req, res) {
  try {
    const userId = req.user.id;
    const payout_type = req.body.payout_type || req.body.payout_method || 'bank';
    const bank_name = req.body.bank_name || '';
    const account_number = req.body.account_number || '';
    const ifsc_code = req.body.ifsc_code || '';
    const upi_id = req.body.upi_id || '';
    const phone_number = req.body.phone_number || req.body.phone || '';
    const email_id = req.body.email_id || req.body.email || '';

    // Validation
    if (payout_type === 'bank') {
      if (!account_number || !ifsc_code || !bank_name) {
        return res.status(400).json({ error: 'Bank Name, Account Number, and IFSC Code are required for bank payout' });
      }
    } else if (payout_type === 'upi') {
      if (!upi_id) {
        return res.status(400).json({ error: 'UPI ID is required for UPI payout' });
      }
    }

    // Default phone and email from user profile if not provided
    const [uRows] = await pool.query('SELECT phone, email FROM users WHERE id = ?', [userId]);
    const finalPhone = phone_number || uRows[0]?.phone || '';
    const finalEmail = email_id || uRows[0]?.email || '';

    await pool.query(
      `INSERT INTO creator_payout_details (user_id, payout_type, bank_name, account_number, ifsc_code, upi_id, phone_number, email_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        payout_type = VALUES(payout_type),
        bank_name = VALUES(bank_name),
        account_number = VALUES(account_number),
        ifsc_code = VALUES(ifsc_code),
        upi_id = VALUES(upi_id),
        phone_number = VALUES(phone_number),
        email_id = VALUES(email_id),
        updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        payout_type,
        bank_name.trim(),
        account_number.trim(),
        ifsc_code.trim().toUpperCase(),
        upi_id.trim().toLowerCase(),
        finalPhone.trim(),
        finalEmail.trim()
      ]
    );

    return res.json({
      success: true,
      message: 'Payout details saved successfully',
      details: {
        userId,
        payout_type,
        bank_name,
        account_number: account_number ? `••••${account_number.slice(-4)}` : '',
        ifsc_code,
        upi_id,
        phone_number: finalPhone,
        email_id: finalEmail
      }
    });
  } catch (err) {
    console.error('Save payout details error:', err);
    return res.status(500).json({ error: 'Failed to save payout details' });
  }
}

export async function getPayoutDetails(req, res) {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      'SELECT * FROM creator_payout_details WHERE user_id = ?',
      [userId]
    );

    const [uRows] = await pool.query('SELECT phone, email FROM users WHERE id = ?', [userId]);
    const userPhone = uRows[0]?.phone || '';
    const userEmail = uRows[0]?.email || '';

    const d = rows[0] || {};
    const details = {
      payout_type: d.payout_type || 'bank',
      payout_method: d.payout_type || 'bank',
      bank_name: d.bank_name || '',
      account_number: d.account_number || '',
      ifsc_code: d.ifsc_code || '',
      upi_id: d.upi_id || '',
      phone: d.phone_number || userPhone,
      phone_number: d.phone_number || userPhone,
      email: d.email_id || userEmail,
      email_id: d.email_id || userEmail
    };

    return res.json({
      hasDetails: rows.length > 0,
      payoutDetails: details,
      details
    });
  } catch (err) {
    console.error('Get payout details error:', err);
    return res.status(500).json({ error: 'Failed to fetch payout details' });
  }
}

export async function getUserPayoutHistory(req, res) {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT cp.*, v.title AS video_title 
       FROM creator_payouts cp
       LEFT JOIN videos v ON cp.video_id = v.id
       WHERE cp.creator_id = ?
       ORDER BY cp.paid_at DESC`,
      [userId]
    );

    // Fetch user's current live wallet balance from database
    const [uRows] = await pool.query('SELECT wallet_balance FROM users WHERE id = ?', [userId]);
    const walletBalance = Number(uRows[0]?.wallet_balance) || 0;

    const payouts = rows.map(r => ({
      id: r.id,
      amount: r.amount,
      formattedAmount: `₹${Number(r.amount).toLocaleString('en-IN')}`,
      status: r.status,
      method: r.payment_method,
      paymentMethod: r.payment_method,
      payment_method: r.payment_method,
      reference: r.payment_reference,
      paymentReference: r.payment_reference,
      payment_reference: r.payment_reference,
      admin_reference: r.payment_reference,
      date: new Date(r.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      paidAt: r.paid_at,
      payment_date: r.paid_at,
      created_at: r.created_at,
      settledViews: r.settled_views,
      notes: r.notes,
      videoId: r.video_id || null,
      videoTitle: r.video_title || 'Influencer Milestone'
    }));

    return res.json({ 
      payouts, 
      walletBalance,
      totalPaid: payouts.filter(p => p.status === 'Paid').reduce((a, b) => a + Number(b.amount || 0), 0)
    });
  } catch (err) {
    console.error('Get user payout history error:', err);
    return res.status(500).json({ error: 'Failed to fetch payout history' });
  }
}

export async function getAdminEligibleCreators(req, res) {
  try {
    const [creators] = await pool.query(`
      SELECT 
        u.id, u.name, u.username, u.email, u.phone, u.avatar_url,
        u.is_influencer, u.subscription_plan, u.wallet_balance, u.created_at,
        pd.payout_type, pd.bank_name, pd.account_number, pd.ifsc_code, pd.upi_id,
        pd.phone_number AS payout_phone, pd.email_id AS payout_email,
        (SELECT COUNT(*) FROM videos v WHERE v.user_id = u.id) AS posts_count,
        (SELECT COALESCE(SUM(views_count), 0) FROM videos v WHERE v.user_id = u.id) AS total_views,
        (SELECT COALESCE(SUM(likes_count), 0) FROM videos v WHERE v.user_id = u.id) AS total_likes,
        (SELECT COALESCE(SUM(amount), 0) FROM creator_payouts cp WHERE cp.creator_id = u.id) AS total_paid_amount
      FROM users u
      LEFT JOIN creator_payout_details pd ON u.id = pd.user_id
      WHERE u.role != 'admin'
      ORDER BY total_views DESC, u.is_influencer DESC
    `);

    // Fetch payout history for each creator
    const creatorList = [];
    for (const c of creators) {
      const [payoutRows] = await pool.query(
        `SELECT cp.*, v.title AS video_title
         FROM creator_payouts cp
         LEFT JOIN videos v ON v.id = cp.video_id
         WHERE cp.creator_id = ? ORDER BY cp.paid_at DESC`,
        [c.id]
      );

      const hasBankDetails = Boolean(c.account_number && c.ifsc_code);
      const hasUpiDetails = Boolean(c.upi_id);
      const hasAnyDetails = hasBankDetails || hasUpiDetails;

      creatorList.push({
        id: c.id,
        name: c.name,
        username: c.username,
        email: c.email,
        phone: c.phone,
        avatar: c.avatar_url || '/brand/default-avatar.svg',
        isInfluencer: Boolean(c.is_influencer),
        subscriptionPlan: c.subscription_plan || (c.is_influencer ? 'Weekly Influencer' : 'Free User'),
        planName: c.subscription_plan || (c.is_influencer ? 'Weekly Influencer' : 'Free User'),
        walletBalance: c.wallet_balance || 0,
        totalViews: Number(c.total_views) || 0,
        totalLikes: Number(c.total_likes) || 0,
        postsCount: Number(c.posts_count) || 0,
        videosCount: Number(c.posts_count) || 0,
        totalPaid: Number(c.total_paid_amount) || 0,
        totalPaidAmount: Number(c.total_paid_amount) || 0,
        metrics: {
          totalViews: Number(c.total_views) || 0,
          totalLikes: Number(c.total_likes) || 0,
          videosCount: Number(c.posts_count) || 0
        },
        hasPayoutDetails: hasAnyDetails,
        payoutDetails: {
          payout_type: c.payout_type || 'bank',
          bank_name: c.bank_name || '',
          account_number: c.account_number || '',
          ifsc_code: c.ifsc_code || '',
          upi_id: c.upi_id || '',
          registered_phone: c.phone || '',
          registered_email: c.email || '',
          contact_phone: c.payout_phone || c.phone || '',
          contact_email: c.payout_email || c.email || ''
        },
        payoutHistory: payoutRows.map(p => ({
          id: p.id,
          amount: p.amount,
          date: new Date(p.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          method: p.payment_method,
          reference: p.payment_reference,
          notes: p.notes,
          settledViews: p.settled_views,
          videoId: p.video_id || null,
          videoTitle: p.video_title || null
        }))
      });
    }

    return res.json({ creators: creatorList });
  } catch (err) {
    console.error('Get admin eligible creators error:', err);
    return res.status(500).json({ error: 'Failed to fetch eligible creators' });
  }
}

export async function markAsPaidAdmin(req, res) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }

  const creatorId = parseInt(req.body.creator_id, 10);
  const numAmount = parseInt(req.body.amount, 10);
  const videoId = req.body.video_id ? parseInt(req.body.video_id, 10) : null;
  const paymentMethod = String(req.body.payment_method || 'Bank Transfer').slice(0, 50);
  const rawReference = String(req.body.payment_reference || req.body.admin_reference || '').trim().slice(0, 100);
  const notes = String(req.body.notes || '').trim().slice(0, 1000);
  const requestedSettledViews = req.body.settled_views !== undefined && req.body.settled_views !== null && req.body.settled_views !== ''
    ? parseInt(req.body.settled_views, 10)
    : null;

  if (!creatorId || !numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid creator ID and payout amount are required' });
  }
  if (req.body.video_id && !videoId) {
    return res.status(400).json({ error: 'Invalid video ID' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Lock ONLY this creator's row — other creators are never touched
    const [cRows] = await conn.query(
      'SELECT id, name, username, email, phone, is_influencer, subscription_expires_at, subscription_plan FROM users WHERE id = ? FOR UPDATE',
      [creatorId]
    );
    if (cRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Creator not found' });
    }
    const creator = cRows[0];

    // STRICT SUBSCRIPTION RULE: Payouts are exclusively reserved for subscribed creators
    const isSubscribed = Boolean(creator.is_influencer) && (
      !creator.subscription_expires_at || new Date(creator.subscription_expires_at) > new Date()
    );
    if (!isSubscribed) {
      await conn.rollback();
      return res.status(403).json({
        error: `Payout rejected: @${creator.username} is not an active subscribed influencer. Platform rewards are strictly reserved for creators with an active influencer subscription.`
      });
    }

    // Per-video milestone validation (incremental settlement)
    let video = null;
    let previousSettled = 0;
    let settledViews = Number.isFinite(requestedSettledViews) ? requestedSettledViews : 0;

    if (videoId) {
      const [vRows] = await conn.query(
        'SELECT id, user_id, title, views_count FROM videos WHERE id = ? FOR UPDATE',
        [videoId]
      );
      if (vRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'Video not found' });
      }
      video = vRows[0];
      if (Number(video.user_id) !== creatorId) {
        await conn.rollback();
        return res.status(400).json({ error: 'This video does not belong to the selected creator' });
      }

      const [sRows] = await conn.query(
        `SELECT COALESCE(MAX(settled_views), 0) AS settled
         FROM creator_payouts
         WHERE video_id = ? AND status = 'Paid'
         FOR UPDATE`,
        [videoId]
      );
      previousSettled = Number(sRows[0]?.settled) || 0;
      const currentViews = Number(video.views_count) || 0;

      if (!Number.isFinite(requestedSettledViews)) settledViews = currentViews;

      if (settledViews > currentViews) {
        await conn.rollback();
        return res.status(400).json({ error: `Cannot settle ${settledViews.toLocaleString()} views — video only has ${currentViews.toLocaleString()} views` });
      }
      if (settledViews <= previousSettled) {
        await conn.rollback();
        return res.status(409).json({
          error: `Views up to ${previousSettled.toLocaleString()} are already rewarded for this video. No new views to settle.`,
          previousSettled
        });
      }
    }

    // Prevent duplicate payouts with the same bank reference
    if (rawReference) {
      const [existingRef] = await conn.query(
        'SELECT id FROM creator_payouts WHERE payment_reference = ? LIMIT 1',
        [rawReference]
      );
      if (existingRef.length > 0) {
        await conn.rollback();
        return res.status(409).json({ error: 'A payout with this payment reference / UTR already exists' });
      }
    }
    const ref = rawReference || ('FFPAY' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900));

    // Snapshot the destination account at time of payment (audit trail)
    const [pdRows] = await conn.query('SELECT * FROM creator_payout_details WHERE user_id = ?', [creatorId]);
    const detailsSnapshot = pdRows.length > 0
      ? pdRows[0]
      : { fallback: true, phone: creator.phone, email: creator.email, note: 'Registered contact on file' };

    const [result] = await conn.query(
      `INSERT INTO creator_payouts (creator_id, video_id, amount, status, payment_method, payment_reference, payout_details, notes, settled_views)
       VALUES (?, ?, ?, 'Paid', ?, ?, ?, ?, ?)`,
      [creatorId, videoId, numAmount, paymentMethod, ref, JSON.stringify(detailsSnapshot), notes, settledViews]
    );

    await conn.query(
      'UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + ? WHERE id = ?',
      [numAmount, creatorId]
    );

    const milestoneText = video
      ? ` for "${video.title || 'your video'}" (views ${previousSettled.toLocaleString()} → ${settledViews.toLocaleString()})`
      : '';
    const notificationMessage = `₹${numAmount.toLocaleString()} has been paid to your registered payout account${milestoneText}. Ref: ${ref}. Please check your bank / UPI account.`;
    await conn.query(
      `INSERT INTO notifications (user_id, actor_id, type, title, message, target_id)
       VALUES (?, NULL, 'payout', 'Payout Disbursed', ?, ?)`,
      [creatorId, notificationMessage, result.insertId]
    );

    await conn.commit();

    const [wRows] = await pool.query('SELECT wallet_balance FROM users WHERE id = ?', [creatorId]);

    return res.status(201).json({
      success: true,
      message: `Marked ₹${numAmount.toLocaleString()} as Paid to ${creator.username}`,
      payout: {
        id: result.insertId,
        creatorId,
        creatorName: creator.name,
        creatorUsername: creator.username,
        videoId,
        videoTitle: video?.title || null,
        amount: numAmount,
        status: 'Paid',
        paymentMethod,
        paymentReference: ref,
        previousSettledViews: previousSettled,
        settledViews,
        newlySettledViews: video ? settledViews - previousSettled : 0,
        walletBalance: Number(wRows[0]?.wallet_balance) || 0,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        paidAt: new Date().toISOString(),
        notes
      }
    });
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (_) {}
    }
    console.error('Mark as paid error:', err);
    return res.status(500).json({ error: 'Failed to record payout' });
  } finally {
    if (conn) conn.release();
  }
}

// Admin: nudge a creator to add bank / UPI details before a reward can be sent
export async function remindCreatorPayoutDetails(req, res) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  try {
    const creatorId = parseInt(req.body.creator_id, 10);
    const videoId = req.body.video_id ? parseInt(req.body.video_id, 10) : null;
    if (!creatorId) return res.status(400).json({ error: 'Valid creator ID is required' });

    const [cRows] = await pool.query('SELECT id, username FROM users WHERE id = ?', [creatorId]);
    if (cRows.length === 0) return res.status(404).json({ error: 'Creator not found' });

    // Throttle: at most one reminder per creator every 6 hours
    const [recent] = await pool.query(
      `SELECT id FROM notifications
       WHERE user_id = ? AND type = 'payout' AND title = 'Add Payout Details'
         AND created_at > (NOW() - INTERVAL 6 HOUR)
       LIMIT 1`,
      [creatorId]
    );
    if (recent.length > 0) {
      return res.status(429).json({ error: 'A reminder was already sent to this creator in the last 6 hours' });
    }

    await pool.query(
      `INSERT INTO notifications (user_id, actor_id, type, title, message, target_id)
       VALUES (?, NULL, 'payout', 'Add Payout Details', ?, ?)`,
      [
        creatorId,
        'FunFlick wants to send you a creator reward! Please add your Bank Account or UPI ID in Wallet → Payout Details so we can transfer it.',
        videoId
      ]
    );

    return res.json({ success: true, message: `Reminder sent to ${cRows[0].username}` });
  } catch (err) {
    console.error('Remind creator error:', err);
    return res.status(500).json({ error: 'Failed to send reminder' });
  }
}
