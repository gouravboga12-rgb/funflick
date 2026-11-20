import crypto from 'crypto';
import pool from '../config/db.js';
import { calculateISTDaysRemaining, formatISTDate, formatISTDateTime } from '../utils/istDateUtils.js';
import { sendPushNotification } from '../services/pushService.js';

export const isPaymentGatewayActive = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  return process.env.PAYMENT_GATEWAY_ACTIVE === 'true' &&
    Boolean(keyId && !keyId.startsWith('rzp_test_') && keySecret);
};

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

    const numPrice = price !== undefined ? Number(price) : null;
    const formattedPriceVal = formatted_price || (numPrice !== null ? (numPrice === 0 ? '₹0' : `₹${numPrice.toLocaleString()}`) : null);
    const featuresJson = features !== undefined
      ? (typeof features === 'string' ? features : JSON.stringify(features || []))
      : null;

    await pool.query(
      `UPDATE subscription_plans SET
        name = COALESCE(?, name),
        price = COALESCE(?, price),
        formatted_price = COALESCE(?, formatted_price),
        period = COALESCE(?, period),
        duration = COALESCE(?, duration),
        label = COALESCE(?, label),
        description = COALESCE(?, description),
        savings = COALESCE(?, savings),
        popular = COALESCE(?, popular),
        active = COALESCE(?, active),
        features = COALESCE(?, features)
      WHERE id = ?`,
      [
        name !== undefined ? name : null,
        numPrice !== null ? numPrice : null,
        formattedPriceVal !== null ? formattedPriceVal : null,
        period !== undefined ? period : null,
        duration !== undefined ? duration : null,
        label !== undefined ? label : null,
        description !== undefined ? description : null,
        savings !== undefined ? savings : null,
        popular !== undefined ? (popular ? 1 : 0) : null,
        active !== undefined ? (active ? 1 : 0) : null,
        featuresJson !== null ? featuresJson : null,
        id
      ]
    );

    // If Admin set free_influencer active = 0, also revoke from users
    if (id === 'free_influencer' && active === false) {
      await pool.query(
        "UPDATE users SET is_influencer = 0, subscription_plan = NULL, subscription_expires_at = NULL WHERE subscription_plan = 'Free Influencer Pass'"
      );
    }

    return res.json({ success: true, message: 'Subscription plan updated successfully' });
  } catch (err) {
    console.error('Update plan error:', err);
    return res.status(500).json({ error: 'Failed to update subscription plan: ' + err.message });
  }
}

export async function deletePlanAdmin(req, res) {
  try {
    const { id } = req.params;
    const [pRows] = await pool.query('SELECT name FROM subscription_plans WHERE id = ?', [id]);
    const planName = pRows[0]?.name || '';

    // If deleting free plan or any plan, revoke influencer status from all users with this plan
    await pool.query(
      `UPDATE users 
       SET is_influencer = 0, subscription_plan = NULL, subscription_expires_at = NULL 
       WHERE subscription_plan = ? OR subscription_plan = 'Free Influencer Pass' OR ? = 'free_influencer'`,
      [planName, id]
    );

    await pool.query('DELETE FROM subscription_plans WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Plan deleted and influencer status revoked from all users on this plan' });
  } catch (err) {
    console.error('Delete plan error:', err);
    return res.status(500).json({ error: 'Failed to delete plan' });
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        price = VALUES(price),
        formatted_price = VALUES(formatted_price),
        period = VALUES(period),
        duration = VALUES(duration),
        label = VALUES(label),
        description = VALUES(description),
        savings = VALUES(savings),
        popular = VALUES(popular),
        active = VALUES(active),
        features = VALUES(features)`,
      [
        planId,
        name || 'Influencer Pass',
        Number(price) || 99,
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
    return res.status(500).json({ error: 'Failed to create subscription plan: ' + err.message });
  }
}

// Admin tool: Reset test / fake subscriptions back to free user
export async function resetTestSubscriptionsAdmin(req, res) {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.body || {};
    if (userId) {
      await pool.query(
        'UPDATE users SET is_influencer = 0, subscription_plan = NULL, subscription_start = NULL, subscription_expires_at = NULL WHERE id = ?',
        [userId]
      );
      await pool.query(
        'DELETE FROM user_subscriptions WHERE user_id = ? AND (payment_gateway LIKE "%test%" OR payment_id LIKE "%PAY_%" OR payment_id LIKE "%rcpt_%" OR payment_id LIKE "%modal%")',
        [userId]
      );
      return res.json({ success: true, message: `User #${userId} subscription reset to Free status` });
    } else {
      await pool.query(
        `UPDATE users 
         SET is_influencer = 0, subscription_plan = NULL, subscription_start = NULL, subscription_expires_at = NULL
         WHERE id IN (
           SELECT user_id FROM user_subscriptions 
           WHERE payment_gateway LIKE "%test%" OR payment_id LIKE "%PAY_%" OR payment_id LIKE "%rcpt_%" OR payment_id LIKE "%modal%"
         )`
      );
      return res.json({ success: true, message: 'All test subscriptions have been reset to Free status' });
    }
  } catch (err) {
    console.error('Reset test subscriptions error:', err);
    return res.status(500).json({ error: 'Failed to reset test subscriptions: ' + err.message });
  }
}

async function executeSubscriptionActivation({ userId, planId, planName, price, durationDays: customDuration, paymentId }) {
  const finalPaymentId = paymentId || `PAY_${Date.now()}`;

  // 1. Determine duration in days from plan or lookup
  let durationDays = parseInt(customDuration, 10);
  let planPrice = (price !== undefined && price !== null && !isNaN(parseInt(price, 10))) ? parseInt(price, 10) : 199;
  let finalPlanName = planName;

  const [planRows] = await pool.query(
    'SELECT id, name, price, duration FROM subscription_plans WHERE id = ? OR name = ? LIMIT 1',
    [planId, planName]
  );

  if (planRows.length > 0) {
    const p = planRows[0];
    finalPlanName = p.name;
    planPrice = Number(p.price) || 0;
    if (!durationDays || isNaN(durationDays)) {
      const dStr = (p.duration || '').toLowerCase();
      if (dStr.includes('lifetime')) durationDays = 3650;
      else if (dStr.includes('365') || dStr.includes('year')) durationDays = 365;
      else if (dStr.includes('90') || dStr.includes('3 month') || dStr.includes('quarter')) durationDays = 90;
      else if (dStr.includes('7') || dStr.includes('week')) durationDays = 7;
      else durationDays = 30;
    }
  } else if (!durationDays || isNaN(durationDays)) {
    if (planId === 'weekly') durationDays = 7;
    else if (planId === 'quarterly') durationDays = 90;
    else if (planId === 'yearly' || planId === 'annual') durationDays = 365;
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

  // 3.5 Duplicate / rapid-click prevention
  const [existingTx] = await pool.query(
    `SELECT id FROM user_subscriptions 
     WHERE payment_id = ? 
        OR (user_id = ? AND plan_id = ? AND created_at >= NOW() - INTERVAL 10 SECOND)
     LIMIT 1`,
    [finalPaymentId, userId, planId]
  );

  if (existingTx.length > 0) {
    return {
      success: true,
      message: 'Subscription already active and recorded',
      isInfluencer: true,
      subscriptionPlan: finalPlanName,
      startDate: baseStartDate,
      expiresAt: baseExpiryDate,
      daysRemaining: totalRemainingDays,
      totalRemainingDays: totalRemainingDays,
    };
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

  return {
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
  };
}

export async function subscribeUser(req, res) {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Direct manual subscription activation requires administrator privileges' });
    }

    const { 
      userId: targetUserId,
      planId = 'monthly', 
      planName = 'Monthly Influencer Pro', 
      price = 199,
      durationDays: customDuration,
      paymentId = '',
      razorpayPaymentId = '' 
    } = req.body;

    const result = await executeSubscriptionActivation({
      userId: targetUserId || req.user.id,
      planId,
      planName,
      price,
      durationDays: customDuration,
      paymentId: paymentId || razorpayPaymentId
    });

    return res.json(result);
  } catch (err) {
    console.error('Subscribe user error:', err);
    return res.status(500).json({ error: 'Failed to activate subscription' });
  }
}

// ----------------------------------------------------
// RAZORPAY OFFICIAL CHECKOUT & VERIFICATION INTEGRATION
// ----------------------------------------------------

export async function createRazorpayOrder(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { planId = 'monthly', price } = req.body;

    // Free Influencer Pass requires zero payment gateway
    if (planId === 'free_influencer' || Number(price) === 0) {
      const orderId = `free_order_${userId}_${Date.now()}`;
      return res.json({
        success: true,
        isFree: true,
        orderId,
        amount: 0,
        currency: 'INR',
        keyId: 'free_plan',
        planId: 'free_influencer',
        planName: 'Free Influencer Pass'
      });
    }

    if (!isPaymentGatewayActive()) {
      return res.status(400).json({
        error: 'Online subscriptions are temporarily paused while payment gateway verification is in progress. Please check back shortly!'
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    let planPrice = Number(price);
    let planName = 'Influencer Plan';
    let durationDays = 30;

    const [planRows] = await pool.query(
      'SELECT id, name, price, duration FROM subscription_plans WHERE id = ? OR name = ? LIMIT 1',
      [planId, planId]
    );

    if (planRows.length > 0) {
      const p = planRows[0];
      planPrice = Number(p.price);
      planName = p.name;
      const dStr = (p.duration || '').toLowerCase();
      if (dStr.includes('365') || dStr.includes('year')) durationDays = 365;
      else if (dStr.includes('90') || dStr.includes('3 month') || dStr.includes('quarter')) durationDays = 90;
      else if (dStr.includes('7') || dStr.includes('week')) durationDays = 7;
      else durationDays = 30;
    } else {
      if (!planPrice) planPrice = 299;
      if (planId === 'weekly') durationDays = 7;
      else if (planId === 'annual' || planId === 'yearly') durationDays = 365;
      else durationDays = 30;
    }

    const amountInPaise = Math.round(planPrice * 100);
    const receipt = `rcpt_${userId}_${Date.now()}`.substring(0, 40);

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes: {
          userId: String(userId),
          planId: String(planId),
          planName: String(planName),
          durationDays: String(durationDays)
        }
      })
    });

    if (!rzpResponse.ok) {
      const errBody = await rzpResponse.text();
      console.error('Razorpay order creation failed:', errBody);
      return res.status(502).json({ error: 'Failed to create Razorpay order', details: errBody });
    }

    const orderData = await rzpResponse.json();

    return res.json({
      success: true,
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      keyId,
      planName,
      planPrice,
      durationDays
    });
  } catch (err) {
    console.error('Create Razorpay order error:', err);
    return res.status(500).json({ error: 'Internal server error while creating order' });
  }
}

export async function verifyRazorpayPayment(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!isPaymentGatewayActive()) {
      return res.status(400).json({
        error: 'Online subscriptions are currently paused for payment gateway verification.'
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const { orderId, paymentId, signature, planId } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing payment verification parameters (orderId, paymentId, signature required)' });
    }

    // 1. Cryptographic HMAC-SHA256 signature verification
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Razorpay signature mismatch:', { expectedSignature, received: signature });
      return res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
    }

    // 2. Fetch payment details from Razorpay API to confirm capture status
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const rzpPayRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    if (!rzpPayRes.ok) {
      return res.status(400).json({ error: 'Could not verify payment with Razorpay' });
    }

    const payData = await rzpPayRes.json();
    if (payData.status !== 'captured' && payData.status !== 'authorized') {
      return res.status(400).json({ error: `Payment status is ${payData.status}, not captured.` });
    }

    // 3. Resolve plan and duration
    let targetPlanId = planId || payData.notes?.planId || 'monthly';
    let durationDays = parseInt(payData.notes?.durationDays, 10);
    let planPrice = Math.round((payData.amount || 0) / 100);
    let planName = payData.notes?.planName || 'Influencer Subscription';

    if (!durationDays || isNaN(durationDays)) {
      const [planRows] = await pool.query(
        'SELECT name, price, duration FROM subscription_plans WHERE id = ? OR name = ? LIMIT 1',
        [targetPlanId, targetPlanId]
      );
      if (planRows.length > 0) {
        planName = planRows[0].name;
        planPrice = planRows[0].price;
        const dStr = (planRows[0].duration || '').toLowerCase();
        if (dStr.includes('365') || dStr.includes('year')) durationDays = 365;
        else if (dStr.includes('90') || dStr.includes('3 month') || dStr.includes('quarter')) durationDays = 90;
        else if (dStr.includes('7') || dStr.includes('week')) durationDays = 7;
        else durationDays = 30;
      } else {
        durationDays = 30;
      }
    }

    // 4. Activate subscription in database
    const result = await executeSubscriptionActivation({
      userId,
      planId: targetPlanId,
      planName,
      price: planPrice,
      durationDays,
      paymentId
    });

    return res.json({
      success: true,
      verified: true,
      message: 'Subscription payment verified and activated!',
      ...result
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    return res.status(500).json({ error: 'Internal server error while verifying payment' });
  }
}

export async function renderCheckoutPage(req, res) {
  const { orderId, amount, planName, planId, token, name = '', email = '', phone = '' } = req.query;

  // Handle Free Plan in-app checkout directly
  if (amount == 0 || planId === 'free_influencer' || (orderId && String(orderId).startsWith('free_'))) {
    const freeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Activate Free Creator Pass</title>
  <style>
    body {
      margin: 0;
      background: #090514;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
      box-sizing: border-box;
    }
    .card {
      background: #140c26;
      border: 1px solid rgba(255, 0, 122, 0.3);
      border-radius: 24px;
      padding: 24px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .header { text-align: center; margin-bottom: 20px; }
    .logo { font-size: 24px; font-weight: 900; color: #ff007a; margin-bottom: 6px; }
    .badge {
      display: inline-block;
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    h2 { font-size: 18px; margin: 8px 0 4px; }
    p.sub { color: #94a3b8; font-size: 12px; margin: 0 0 16px; }
    .form-group { margin-bottom: 12px; text-align: left; }
    label { display: block; font-size: 11px; font-weight: 600; color: #cbd5e1; margin-bottom: 4px; }
    input {
      width: 100%;
      box-sizing: border-box;
      padding: 10px 12px;
      background: #090514;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      color: #fff;
      font-size: 13px;
    }
    input:focus { outline: none; border-color: #ff007a; }
    .or-divider { text-align: center; margin: 12px 0; font-size: 11px; color: #64748b; font-weight: bold; }
    .note { font-size: 11px; color: #ff4da6; background: rgba(255,0,122,0.1); padding: 8px; border-radius: 8px; margin-bottom: 16px; text-align: center; }
    .btn {
      width: 100%;
      background: linear-gradient(135deg, #ff007a 0%, #7928ca 100%);
      color: #fff;
      border: none;
      padding: 14px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn:disabled { opacity: 0.6; }
    #err { color: #f87171; font-size: 11px; margin-top: 8px; text-align: center; display: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">FunFlick</div>
      <div class="badge">FREE CREATOR PASS (₹0)</div>
      <h2>Creator Payout Details</h2>
      <p class="sub">Enter your PhonePe UPI ID, Bank details, or both to receive view & like cash rewards.</p>
    </div>
    <form id="payoutForm">
      <div class="form-group">
        <label>PhonePe / Google Pay UPI ID</label>
        <input type="text" id="upi_id" placeholder="e.g. mobile@ybl or username@upi" />
      </div>
      <div class="or-divider">— OR BANK ACCOUNT (OR BOTH) —</div>
      <div class="form-group">
        <label>Bank Name</label>
        <input type="text" id="bank_name" placeholder="e.g. State Bank of India, HDFC" />
      </div>
      <div class="form-group">
        <label>Bank Account Number</label>
        <input type="text" id="account_number" placeholder="Enter account number" />
      </div>
      <div class="form-group">
        <label>IFSC Code</label>
        <input type="text" id="ifsc_code" placeholder="e.g. SBIN0001234" style="text-transform:uppercase" />
      </div>
      <div class="note">Enter at least PhonePe UPI or Bank details. Either is completely fine!</div>
      <button type="submit" class="btn" id="subBtn">Activate & Start Earning</button>
      <div id="err"></div>
    </form>
  </div>
  <script>
    const form = document.getElementById('payoutForm');
    const errDiv = document.getElementById('err');
    const subBtn = document.getElementById('subBtn');
    const token = '${token || ''}';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errDiv.style.display = 'none';
      const upi_id = document.getElementById('upi_id').value.trim();
      const bank_name = document.getElementById('bank_name').value.trim();
      const account_number = document.getElementById('account_number').value.trim();
      const ifsc_code = document.getElementById('ifsc_code').value.trim().toUpperCase();

      if (!upi_id && (!account_number || !ifsc_code)) {
        errDiv.textContent = 'Please enter at least your PhonePe UPI ID or Bank details.';
        errDiv.style.display = 'block';
        return;
      }

      subBtn.disabled = true;
      subBtn.textContent = 'Activating Free Pass...';

      try {
        const res = await fetch('/api/payouts/details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
          },
          body: JSON.stringify({ upi_id, bank_name, account_number, ifsc_code })
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Failed to save payout details');
        
        // Also call activate-free to complete subscription
        await fetch('/api/subscriptions/activate-free', {
          method: 'POST',
          headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });

        window.location.href = 'funflick://payment-success?plan=Free+Influencer+Pass';
      } catch (err) {
        errDiv.textContent = err.message;
        errDiv.style.display = 'block';
        subBtn.disabled = false;
        subBtn.textContent = 'Activate & Start Earning';
      }
    });
  </script>
</body>
</html>`;
    return res.send(freeHtml);
  }

  if (!isPaymentGatewayActive()) {
    const pausedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>FunFlick Payments Paused</title>
  <style>
    body {
      margin: 0;
      background: #090514;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: #140c26;
      border: 1px solid rgba(255, 0, 122, 0.3);
      border-radius: 24px;
      padding: 36px 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .logo {
      font-size: 28px;
      font-weight: 900;
      color: #ff007a;
      margin-bottom: 16px;
    }
    .badge {
      display: inline-block;
      background: rgba(255, 0, 122, 0.15);
      color: #ff4da6;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 16px;
    }
    h2 {
      font-size: 20px;
      margin: 0 0 12px;
      font-weight: 800;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 24px;
    }
    .btn {
      display: block;
      background: linear-gradient(135deg, #ff007a, #7928ca);
      color: #fff;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 30px;
      font-size: 15px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">FunFlick</div>
    <div class="badge">🔒 Verification in Progress</div>
    <h2>Online Payments Paused</h2>
    <p>Online subscription checkout is temporarily paused while live payment gateway merchant credentials are being finalized. Please check back shortly!</p>
    <a href="funflick://payment-cancel" class="btn">Return to FunFlick App</a>
  </div>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    return res.send(pausedHtml);
  }

  const keyId = process.env.RAZORPAY_KEY_ID || '';
  if (!orderId || !amount) {
    return res.status(400).send('<h3>Invalid checkout request. Missing orderId or amount.</h3>');
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>FunFlick Secure Checkout</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    body {
      margin: 0;
      background: #090514;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: #140c26;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .logo {
      font-size: 28px;
      font-weight: 900;
      color: #ff007a;
      margin-bottom: 8px;
    }
    .plan {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 4px;
      color: #ffffff;
    }
    .amount {
      font-size: 32px;
      font-weight: 800;
      color: #10b981;
      margin: 12px 0 24px;
    }
    .status-text {
      color: #94a3b8;
      font-size: 14px;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .btn {
      background: linear-gradient(135deg, #ff007a, #7928ca);
      color: #fff;
      border: none;
      padding: 14px 28px;
      border-radius: 30px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      width: 100%;
      box-sizing: border-box;
      transition: opacity 0.2s;
    }
    .btn:active {
      opacity: 0.85;
    }
    .cancel-link {
      display: block;
      margin-top: 16px;
      color: #64748b;
      text-decoration: none;
      font-size: 13px;
    }
    .spinner {
      border: 3px solid rgba(255,255,255,0.1);
      border-top: 3px solid #ff007a;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">FunFlick</div>
    <div class="plan">${planName || 'Influencer Subscription'}</div>
    <div class="amount">₹${Math.round(Number(amount) / 100)}</div>
    <div class="spinner" id="spinner"></div>
    <div class="status-text" id="status">Opening Razorpay secure payment gateway...</div>
    <button class="btn" id="retryBtn" style="display:none;" onclick="openCheckout()">Retry Payment</button>
    <a href="funflick://payment-cancel" class="cancel-link">Cancel and return to app</a>
  </div>

  <script>
    const options = {
      key: ${JSON.stringify(keyId)},
      amount: Number(${JSON.stringify(amount)}),
      currency: 'INR',
      name: 'FunFlick',
      description: ${JSON.stringify(planName || 'Influencer Subscription')},
      order_id: ${JSON.stringify(orderId)},
      image: 'https://funflick.in/brand/funflick-logo.png',
      prefill: {
        name: ${JSON.stringify(name || '')},
        email: ${JSON.stringify(email || '')},
        contact: ${JSON.stringify(phone || '')}
      },
      theme: {
        color: '#ff007a'
      },
      handler: async function (response) {
        document.getElementById('status').innerText = 'Verifying payment with FunFlick servers...';
        document.getElementById('spinner').style.display = 'block';
        try {
          const verifyRes = await fetch('/api/subscriptions/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ${token}'
            },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              planId: '${planId}'
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.verified) {
            document.getElementById('status').innerText = '🎉 Payment Verified! Returning to app...';
            window.location.href = 'funflick://payment-success?status=success&paymentId=' + response.razorpay_payment_id + '&orderId=' + response.razorpay_order_id;
          } else {
            document.getElementById('status').innerText = 'Verification Failed: ' + (verifyData.error || 'Unknown error');
            document.getElementById('retryBtn').style.display = 'block';
            document.getElementById('spinner').style.display = 'none';
          }
        } catch (e) {
          document.getElementById('status').innerText = 'Network error verifying payment.';
          document.getElementById('retryBtn').style.display = 'block';
          document.getElementById('spinner').style.display = 'none';
        }
      },
      modal: {
        ondismiss: function () {
          document.getElementById('status').innerText = 'Payment cancelled. Tap below to retry or return.';
          document.getElementById('retryBtn').style.display = 'block';
          document.getElementById('spinner').style.display = 'none';
        }
      }
    };

    function openCheckout() {
      document.getElementById('status').innerText = 'Opening Razorpay checkout...';
      document.getElementById('spinner').style.display = 'block';
      document.getElementById('retryBtn').style.display = 'none';
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response) {
        document.getElementById('status').innerText = 'Payment Failed: ' + (response.error.description || 'Try again.');
        document.getElementById('retryBtn').style.display = 'block';
        document.getElementById('spinner').style.display = 'none';
      });
      rzp.open();
    }

    // Auto open checkout on page load
    window.onload = function() {
      setTimeout(openCheckout, 500);
    };
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
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
    const isFreePlan = u.subscription_plan === 'Free Influencer Pass';
    const expiresAt = u.subscription_expires_at ? new Date(u.subscription_expires_at) : null;
    const isActive = Boolean(
      (u.is_influencer && isFreePlan) ||
      (u.is_influencer && expiresAt && expiresAt > now)
    );
    const daysRemaining = isFreePlan ? null : calculateISTDaysRemaining(expiresAt, now);

    // Fetch subscription purchase history from database
    const [historyRows] = await pool.query(
      `SELECT id, plan_id, plan_name, price, duration_days, payment_id, payment_status, start_date, end_date, created_at
       FROM user_subscriptions
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    const hasStackedPacks = !isFreePlan && historyRows.length > 1 && isActive;
    const futurePacksCount = !isFreePlan && historyRows.length > 1 ? historyRows.length - 1 : 0;
    const totalDaysAdded = isFreePlan ? 0 : historyRows.reduce((acc, h) => acc + (Number(h.duration_days) || 0), 0);
    const formattedExpiry = isFreePlan ? 'Promotional Creator Tier (Active)' : (expiresAt ? formatISTDate(expiresAt) : null);
    const formattedExpiryTime = isFreePlan ? 'Active while promotion is live' : (expiresAt ? formatISTDateTime(expiresAt) : null);
    const formattedStart = u.subscription_start ? formatISTDate(new Date(u.subscription_start)) : null;

    return res.json({
      isActive,
      isFreePlan,
      isExpired: Boolean(!isFreePlan && expiresAt && expiresAt <= now),
      planName: u.subscription_plan || (isActive ? 'Free Influencer Pass' : 'Free Member'),
      startDate: u.subscription_start,
      formattedStart,
      expiresAt: isFreePlan ? null : u.subscription_expires_at,
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

export async function activateFreeSubscription(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has payout details in creator_payout_details
    const [pRows] = await pool.query(
      'SELECT id, bank_name, account_number, ifsc_code, upi_id FROM creator_payout_details WHERE user_id = ?',
      [userId]
    );

    const hasBank = Boolean(pRows[0]?.account_number && pRows[0]?.ifsc_code);
    const hasUpi = Boolean(pRows[0]?.upi_id && pRows[0]?.upi_id.includes('@'));
    const hasPayoutDetails = hasBank || hasUpi;

    if (!hasPayoutDetails) {
      return res.json({
        success: false,
        requiresPayoutDetails: true,
        message: 'Please provide your PhonePe UPI ID or Bank Account details to activate your Free Influencer Pass.'
      });
    }

    // Activate Free Influencer Pass (Lifetime validity)
    const result = await executeSubscriptionActivation({
      userId,
      planId: 'free_influencer',
      planName: 'Free Influencer Pass',
      price: 0,
      paymentId: `free_act_${userId}_${Date.now()}`,
      durationDays: 3650
    });

    await pool.query(
      "UPDATE users SET has_payout_details = 1, is_influencer = 1, subscription_plan = 'Free Influencer Pass', subscription_expires_at = NULL WHERE id = ?",
      [userId]
    );

    return res.json({
      success: true,
      requiresPayoutDetails: false,
      message: '🎉 Free Influencer Pass activated successfully!',
      ...result
    });
  } catch (err) {
    console.error('Activate free subscription error:', err);
    return res.status(500).json({ error: 'Failed to activate free subscription: ' + err.message });
  }
}
