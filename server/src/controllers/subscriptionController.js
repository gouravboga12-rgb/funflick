import pool from '../config/db.js';
import { calculateISTDaysRemaining, formatISTDate, formatISTDateTime } from '../utils/istDateUtils.js';
import { sendPushNotification } from '../services/pushService.js';

export async function getActivePlans(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM subscription_plans WHERE active = 1 ORDER BY price ASC'
    );
    const plans = rows.map(r => ({
      ...r,
      popular: Boolean(r.popular),
      active: Boolean(r.active),
      features: typeof r.features === 'string' ? JSON.parse(r.features) : r.features
    }));
    return res.json({ plans });
  } catch (err) {
    console.error('Get active plans error:', err);
    return res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
}

export async function getAllPlansAdmin(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM subscription_plans ORDER BY price ASC'
    );
    const plans = rows.map(r => ({
      ...r,
      popular: Boolean(r.popular),
      active: Boolean(r.active),
      features: typeof r.features === 'string' ? JSON.parse(r.features) : r.features
    }));
    return res.json({ plans });
  } catch (err) {
    console.error('Get admin plans error:', err);
    return res.status(500).json({ error: 'Failed to fetch plans' });
  }
}

export async function updatePlanAdmin(req, res) {
  try {
    const { id } = req.params;
    const { name, price, formatted_price, period, duration, label, description, savings, popular, active, features } = req.body;

    const formattedPriceVal = formatted_price || `₹${Number(price).toLocaleString()}`;
    const featuresJson = typeof features === 'string' ? features : JSON.stringify(features || []);

    await pool.query(
      `UPDATE subscription_plans SET
        name = COALESCE(?, name),
        price = COALESCE(?, price),
        formatted_price = COALESCE(?, formatted_price),
        period = COALESCE(?, period),
        duration = COALESCE(?, duration),
        label = COALESCE(?, label),
        description = COALESCE(?, description),
        savings = ?,
        popular = COALESCE(?, popular),
        active = COALESCE(?, active),
        features = COALESCE(?, features)
      WHERE id = ?`,
      [
        name,
        price,
        formattedPriceVal,
        period,
        duration,
        label,
        description,
        savings,
        popular !== undefined ? (popular ? 1 : 0) : undefined,
        active !== undefined ? (active ? 1 : 0) : undefined,
        featuresJson,
        id
      ]
    );

    return res.json({ success: true, message: 'Subscription plan updated successfully' });
  } catch (err) {
    console.error('Update plan error:', err);
    return res.status(500).json({ error: 'Failed to update subscription plan' });
  }
}

export async function createPlanAdmin(req, res) {
  try {
    const { id, name, price, formatted_price, period, duration, label, description, savings, popular, active, features } = req.body;
    const planId = id || `plan_${Date.now()}`;
    const formattedPriceVal = formatted_price || `₹${Number(price).toLocaleString()}`;
    const featuresJson = typeof features === 'string' ? features : JSON.stringify(features || []);

    await pool.query(
      `INSERT INTO subscription_plans (id, name, price, formatted_price, period, duration, label, description, savings, popular, active, features)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        planId,
        name,
        price,
        formattedPriceVal,
        period || 'month',
        duration || '30 Days',
        label || '',
        description || '',
        savings || null,
        popular ? 1 : 0,
        active !== undefined ? (active ? 1 : 0) : 1,
        featuresJson
      ]
    );

    return res.status(201).json({ success: true, message: 'Plan created successfully', id: planId });
  } catch (err) {
    console.error('Create plan error:', err);
    return res.status(500).json({ error: 'Failed to create subscription plan' });
  }
}

export async function deletePlanAdmin(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM subscription_plans WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Plan deleted' });
  } catch (err) {
    console.error('Delete plan error:', err);
    return res.status(500).json({ error: 'Failed to delete plan' });
  }
}

export async function subscribeUser(req, res) {
  try {
    const userId = req.user.id;
    const { 
      planId = 'monthly', 
      planName = 'Monthly Influencer Pro', 
      price = 199,
      durationDays: customDuration,
      paymentId = '',
      razorpayPaymentId = '' 
    } = req.body;

    const finalPaymentId = paymentId || razorpayPaymentId || `PAY_${Date.now()}`;

    // 1. Determine duration in days from plan or lookup
    let durationDays = parseInt(customDuration, 10);
    let planPrice = parseInt(price, 10) || 199;
    let finalPlanName = planName;

    const [planRows] = await pool.query(
      'SELECT id, name, price, duration FROM subscription_plans WHERE id = ? OR name = ? LIMIT 1',
      [planId, planName]
    );

    if (planRows.length > 0) {
      const p = planRows[0];
      finalPlanName = p.name;
      planPrice = p.price;
      if (!durationDays || isNaN(durationDays)) {
        const dStr = (p.duration || '').toLowerCase();
        if (dStr.includes('365') || dStr.includes('year')) durationDays = 365;
        else if (dStr.includes('90') || dStr.includes('3 month') || dStr.includes('quarter')) durationDays = 90;
        else if (dStr.includes('7') || dStr.includes('week')) durationDays = 7;
        else durationDays = 30;
      }
    } else if (!durationDays || isNaN(durationDays)) {
      if (planId === 'weekly') durationDays = 7;
      else if (planId === 'quarterly') durationDays = 90;
      else if (planId === 'yearly') durationDays = 365;
      else durationDays = 30;
    }

    // 2. Fetch current user subscription state
    const [uRows] = await pool.query(
      'SELECT subscription_expires_at, subscription_start, subscription_plan, is_influencer FROM users WHERE id = ?',
      [userId]
    );

    const now = new Date();
    let baseStartDate = now;
    let baseExpiryDate = now;
    let isExtension = false;

    if (uRows.length > 0 && uRows[0].subscription_expires_at) {
      const existingExpiry = new Date(uRows[0].subscription_expires_at);
      if (existingExpiry > now) {
        // User already has an active subscription! EXTEND the existing expiry date!
        baseExpiryDate = existingExpiry;
        isExtension = true;
        if (uRows[0].subscription_start) {
          baseStartDate = new Date(uRows[0].subscription_start);
        }
      }
    }

    // 3. Calculate new expiry date by adding duration to baseExpiryDate
    const newExpiryDate = new Date(baseExpiryDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const totalRemainingDays = calculateISTDaysRemaining(newExpiryDate, now);

    // 3.5 Duplicate / rapid-click prevention: check if payment_id exists or identical plan purchased in last 10 seconds
    const [existingTx] = await pool.query(
      `SELECT id FROM user_subscriptions 
       WHERE payment_id = ? 
          OR (user_id = ? AND plan_id = ? AND created_at >= NOW() - INTERVAL 10 SECOND)
       LIMIT 1`,
      [finalPaymentId, userId, planId]
    );

    if (existingTx.length > 0) {
      return res.json({
        success: true,
        message: 'Subscription already active and recorded',
        isInfluencer: true,
        subscriptionPlan: finalPlanName,
        startDate: baseStartDate,
        expiresAt: baseExpiryDate,
        daysRemaining: totalRemainingDays,
        totalRemainingDays: totalRemainingDays,
      });
    }

    // 4. Record transaction in user_subscriptions history table
    await pool.query(
      `INSERT INTO user_subscriptions 
        (user_id, plan_id, plan_name, price, duration_days, payment_id, payment_status, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, 'success', ?, ?)`,
      [
        userId,
        planId,
        finalPlanName,
        planPrice,
        durationDays,
        finalPaymentId,
        baseStartDate,
        newExpiryDate
      ]
    );

    // 5. Update user record in MySQL database
    await pool.query(
      `UPDATE users SET 
        is_influencer = 1, 
        subscription_plan = ?, 
        subscription_start = COALESCE(subscription_start, ?),
        subscription_expires_at = ?
       WHERE id = ?`,
      [finalPlanName, baseStartDate, newExpiryDate, userId]
    );

    // 6. User notification with precise validity details as per IST in India
    const expiryDateStr = formatISTDate(newExpiryDate);
    const notificationMsg = isExtension
      ? `🔄 Plan Extended! Added ${durationDays} days to your active subscription. Your new validity is until ${expiryDateStr} (${totalRemainingDays} days left).`
      : `🌟 Subscription Activated! You are an active Influencer on ${finalPlanName}. Valid for ${durationDays} days until ${expiryDateStr}.`;

    try {
      await pool.query(
        `INSERT INTO notifications (user_id, actor_id, type, title, message)
         VALUES (?, NULL, 'system', 'Subscription Updated', ?)`,
        [userId, notificationMsg]
      );

      sendPushNotification(userId, {
        title: isExtension ? '🔄 Subscription Extended!' : '🌟 Influencer Pass Activated!',
        body: notificationMsg,
        data: { type: 'subscription', planName: finalPlanName }
      });
    } catch (e) {}

    return res.json({
      success: true,
      message: isExtension ? 'Subscription extended successfully' : 'Subscription activated successfully',
      isInfluencer: true,
      subscriptionPlan: finalPlanName,
      startDate: baseStartDate,
      expiresAt: newExpiryDate,
      daysRemaining: totalRemainingDays,
      totalRemainingDays: totalRemainingDays,
      durationDaysAdded: durationDays,
      isExtended: isExtension,
      isExtension: isExtension
    });
  } catch (err) {
    console.error('Subscribe user error:', err);
    return res.status(500).json({ error: 'Failed to activate subscription' });
  }
}

// User-side subscription validity status and purchase history
export async function getUserSubscriptionStatus(req, res) {
  try {
    const userId = req.user.id;

    const [uRows] = await pool.query(
      'SELECT subscription_plan, subscription_start, subscription_expires_at, is_influencer FROM users WHERE id = ?',
      [userId]
    );

    if (uRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const u = uRows[0];
    const now = new Date();
    const expiresAt = u.subscription_expires_at ? new Date(u.subscription_expires_at) : null;
    const isActive = Boolean(u.is_influencer && expiresAt && expiresAt > now);
    const daysRemaining = calculateISTDaysRemaining(expiresAt, now);

    // Fetch subscription purchase history from database
    const [historyRows] = await pool.query(
      `SELECT id, plan_id, plan_name, price, duration_days, payment_id, payment_status, start_date, end_date, created_at
       FROM user_subscriptions
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    const hasStackedPacks = historyRows.length > 1 && isActive;
    const futurePacksCount = historyRows.length > 1 ? historyRows.length - 1 : 0;
    const totalDaysAdded = historyRows.reduce((acc, h) => acc + (Number(h.duration_days) || 0), 0);
    const formattedExpiry = expiresAt ? formatISTDate(expiresAt) : null;
    const formattedExpiryTime = expiresAt ? formatISTDateTime(expiresAt) : null;
    const formattedStart = u.subscription_start ? formatISTDate(new Date(u.subscription_start)) : null;

    return res.json({
      isActive,
      isExpired: Boolean(expiresAt && expiresAt <= now),
      planName: u.subscription_plan || (isActive ? 'Monthly Influencer Pro' : 'Free Member'),
      startDate: u.subscription_start,
      formattedStart,
      expiresAt: u.subscription_expires_at,
      formattedExpiry,
      formattedExpiryTime,
      daysRemaining,
      totalRemainingDays: daysRemaining,
      timezone: 'Asia/Kolkata',
      hasStackedPacks,
      futurePacksCount,
      totalDaysAdded,
      history: historyRows.map(h => ({
        id: h.id,
        planId: h.plan_id,
        planName: h.plan_name,
        price: `₹${Number(h.price).toLocaleString('en-IN')}`,
        durationDays: h.duration_days,
        paymentId: h.payment_id,
        status: h.payment_status,
        startDate: h.start_date,
        endDate: h.end_date,
        date: formatISTDate(new Date(h.created_at))
      }))
    });
  } catch (err) {
    console.error('Get subscription status error:', err);
    return res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
}
