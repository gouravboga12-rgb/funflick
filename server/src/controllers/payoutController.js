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

    const payouts = rows.map(r => ({
      id: r.id,
      amount: r.amount,
      formattedAmount: `₹${Number(r.amount).toLocaleString()}`,
      status: r.status,
      method: r.payment_method,
      reference: r.payment_reference,
      date: new Date(r.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      paidAt: r.paid_at,
      settledViews: r.settled_views,
      notes: r.notes,
      videoTitle: r.video_title || 'Influencer Milestone'
    }));

    return res.json({ payouts });
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
        'SELECT * FROM creator_payouts WHERE creator_id = ? ORDER BY paid_at DESC',
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
          settledViews: p.settled_views
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
  try {
    const { 
      creator_id, 
      amount, 
      payment_method = 'Bank Transfer', 
      payment_reference = req.body.admin_reference || '', 
      notes = '', 
      settled_views = 0,
      video_id = null 
    } = req.body;

    const numAmount = parseInt(amount, 10);
    if (!creator_id || !numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Valid creator ID and payout amount are required' });
    }

    // Verify creator exists
    const [cRows] = await pool.query('SELECT id, name, username, email, phone FROM users WHERE id = ?', [creator_id]);
    if (cRows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    const creator = cRows[0];

    // Fetch their payout details snapshot
    const [pdRows] = await pool.query('SELECT * FROM creator_payout_details WHERE user_id = ?', [creator_id]);
    const detailsSnapshot = pdRows.length > 0 
      ? pdRows[0] 
      : { fallback: true, phone: creator.phone, email: creator.email, note: 'Registered contact on file' };

    // Prevent duplicate payouts: check if same reference already recorded
    if (payment_reference) {
      const [existingRef] = await pool.query(
        'SELECT id FROM creator_payouts WHERE payment_reference = ?',
        [payment_reference]
      );
      if (existingRef.length > 0) {
        return res.status(400).json({ error: 'A payout with this payment reference already exists' });
      }
    }

    const ref = payment_reference || ('FFPAY' + Math.floor(100000 + Math.random() * 900000));

    // Insert payout record
    const [result] = await pool.query(
      `INSERT INTO creator_payouts (creator_id, video_id, amount, status, payment_method, payment_reference, payout_details, notes, settled_views)
       VALUES (?, ?, ?, 'Paid', ?, ?, ?, ?, ?)`,
      [
        creator_id,
        video_id,
        numAmount,
        payment_method,
        ref,
        JSON.stringify(detailsSnapshot),
        notes,
        settled_views
      ]
    );

    // Update creator's wallet balance
    await pool.query(
      'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?',
      [numAmount, creator_id]
    );

    // Send mandatory user-side notification
    const notificationMessage = `₹${numAmount.toLocaleString()} has been marked as paid to your registered payout account. Please check your bank account or UPI account using the payment details you submitted.`;
    await pool.query(
      `INSERT INTO notifications (user_id, actor_id, type, title, message, target_id)
       VALUES (?, NULL, 'payout', 'Payout Disbursed', ?, ?)`,
      [creator_id, notificationMessage, result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: `Marked ₹${numAmount.toLocaleString()} as Paid to @${creator.username}`,
      payout: {
        id: result.insertId,
        creatorId: creator_id,
        amount: numAmount,
        status: 'Paid',
        paymentMethod: payment_method,
        paymentReference: ref,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        notes
      }
    });
  } catch (err) {
    console.error('Mark as paid error:', err);
    return res.status(500).json({ error: 'Failed to record payout' });
  }
}
