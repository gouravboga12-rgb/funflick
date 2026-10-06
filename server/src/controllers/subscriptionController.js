import pool from '../config/db.js';

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
    const { planName, razorpayPaymentId } = req.body;

    await pool.query(
      'UPDATE users SET is_influencer = 1, subscription_plan = ? WHERE id = ?',
      [planName || 'Monthly Influencer Pro', userId]
    );

    // Add user notification
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, actor_id, type, title, message)
         VALUES (?, NULL, 'system', 'Influencer Activated', ?)`,
        [userId, `🎉 You are now an active FunFlick Influencer (${planName || 'Influencer Pro'})! You can now receive payouts.`]
      );
    } catch (e) {}

    return res.json({
      success: true,
      message: 'Subscription activated',
      isInfluencer: true,
      subscriptionPlan: planName
    });
  } catch (err) {
    console.error('Subscribe user error:', err);
    return res.status(500).json({ error: 'Failed to activate subscription' });
  }
}
