import crypto from 'crypto';
import pool from '../config/db.js';
import { calculateISTDaysRemaining, formatISTDate, formatISTDateTime } from '../utils/istDateUtils.js';
import { sendPushNotification } from '../services/pushService.js';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TjWqonuTX5VmT8';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'Bedi1GN34A0HlH6mgiyQbU3e';

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

async function executeSubscriptionActivation({ userId, planId, planName, price, durationDays: customDuration, paymentId }) {
  const finalPaymentId = paymentId || `PAY_${Date.now()}`;

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
    const userId = req.user.id;
    const { 
      planId = 'monthly', 
      planName = 'Monthly Influencer Pro', 
      price = 199,
      durationDays: customDuration,
      paymentId = '',
      razorpayPaymentId = '' 
    } = req.body;

    const result = await executeSubscriptionActivation({
      userId,
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

    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
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
      keyId: RAZORPAY_KEY_ID,
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

    const { orderId, paymentId, signature, planId } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'Missing payment verification parameters (orderId, paymentId, signature required)' });
    }

    // 1. Cryptographic HMAC-SHA256 signature verification
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Razorpay signature mismatch:', { expectedSignature, received: signature });
      return res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
    }

    // 2. Fetch payment details from Razorpay API to confirm capture status
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
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
      key: '${RAZORPAY_KEY_ID}',
      amount: '${amount}',
      currency: 'INR',
      name: 'FunFlick',
      description: '${planName || 'Influencer Subscription'}',
      order_id: '${orderId}',
      image: 'https://funflick.in/brand/funflick-logo.png',
      prefill: {
        name: '${name}',
        email: '${email}',
        contact: '${phone}'
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
