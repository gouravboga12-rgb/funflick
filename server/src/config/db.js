import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'funflick_user',
  password: process.env.DB_PASSWORD || 'FunFlick2026!SecurePass',
  database: process.env.DB_NAME || 'funflick_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database:', process.env.DB_NAME);

    // Create tables if not exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(120) NOT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url TEXT DEFAULT NULL,
        bio TEXT DEFAULT NULL,
        role ENUM('user', 'creator', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_phone (phone)
      ) ENGINE=InnoDB;
    `);

    // Migration helper: add phone column if not present
    try {
      const [colRows] = await connection.query(`
        SHOW COLUMNS FROM users LIKE 'phone'
      `);
      if (colRows.length === 0) {
        await connection.query(`ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL AFTER email`);
      }
    } catch (err) {}

    // Migration helper: drop unique constraint on email if present
    try {
      const [indexRows] = await connection.query(`
        SHOW INDEX FROM users WHERE Column_name = 'email' AND Non_unique = 0
      `);
      if (indexRows.length > 0) {
        await connection.query(`ALTER TABLE users DROP INDEX \`${indexRows[0].Key_name}\``);
        await connection.query(`ALTER TABLE users ADD INDEX idx_email (email)`);
      }
    } catch (err) {}

    // Email Verifications / OTP table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(120) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        type ENUM('registration', 'forgot_password') DEFAULT 'registration',
        target_username VARCHAR(50) DEFAULT NULL,
        payload JSON DEFAULT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_otp (email, otp_code)
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(50) DEFAULT 'Comedy',
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        duration INT DEFAULT 0,
        views_count INT DEFAULT 0,
        likes_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        video_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY user_video_like (user_id, video_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        video_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Migration helper: add user columns if not present
    const userCols = [
      { name: 'is_influencer', def: 'TINYINT DEFAULT 0' },
      { name: 'subscription_plan', def: 'VARCHAR(100) DEFAULT NULL' },
      { name: 'wallet_balance', def: 'INT DEFAULT 0' },
      { name: 'status', def: "ENUM('Active', 'Suspended') DEFAULT 'Active'" }
    ];
    for (const col of userCols) {
      try {
        const [cRows] = await connection.query(`SHOW COLUMNS FROM users LIKE '${col.name}'`);
        if (cRows.length === 0) {
          await connection.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
        }
      } catch (e) {}
    }

    // Migration helper: add video columns if not present
    const videoCols = [
      { name: 'media_type', def: "ENUM('video', 'image') DEFAULT 'video'" },
      { name: 'hashtags', def: 'TEXT DEFAULT NULL' },
      { name: 'location', def: 'VARCHAR(150) DEFAULT NULL' },
      { name: 'audio_title', def: 'VARCHAR(150) DEFAULT NULL' },
      { name: 'status', def: "ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending'" }
    ];
    for (const col of videoCols) {
      try {
        const [vRows] = await connection.query(`SHOW COLUMNS FROM videos LIKE '${col.name}'`);
        if (vRows.length === 0) {
          await connection.query(`ALTER TABLE videos ADD COLUMN ${col.name} ${col.def}`);
        }
      } catch (e) {}
    }

    try {
      await connection.query("UPDATE videos SET status = 'Approved' WHERE status IS NULL");
    } catch (e) {}

    // Follows table (Instagram-style real following/follower graph)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS follows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        follower_id INT NOT NULL,
        following_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_follow (follower_id, following_id),
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Stories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        media_url TEXT NOT NULL,
        media_type ENUM('image', 'video') DEFAULT 'image',
        caption TEXT DEFAULT NULL,
        music VARCHAR(150) DEFAULT NULL,
        sticker VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Notifications table (real database events only)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        actor_id INT DEFAULT NULL,
        type ENUM('follow', 'like', 'comment', 'payout', 'system') NOT NULL,
        title VARCHAR(200) DEFAULT NULL,
        message TEXT NOT NULL,
        target_id INT DEFAULT NULL,
        is_read TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Dynamic Subscription Plans Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price INT NOT NULL,
        formatted_price VARCHAR(50) NOT NULL,
        period VARCHAR(50) NOT NULL,
        duration VARCHAR(50) NOT NULL,
        label VARCHAR(100) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        savings VARCHAR(50) DEFAULT NULL,
        popular TINYINT DEFAULT 0,
        active TINYINT DEFAULT 1,
        features JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Seed default subscription plans if empty
    const [existingPlans] = await connection.query('SELECT COUNT(*) as count FROM subscription_plans');
    if (existingPlans[0].count === 0) {
      const defaultPlans = [
        {
          id: 'weekly',
          name: 'Weekly Influencer',
          price: 99,
          formatted_price: '₹99',
          period: 'week',
          duration: '7 Days',
          label: 'Starter Pass',
          description: 'Perfect for trying Influencer analytics & rewards for 7 days',
          savings: null,
          popular: 0,
          active: 1,
          features: JSON.stringify([
            'Official Influencer status badge',
            'Advanced performance analytics (Views, Likes, Comments, Shares, Saves)',
            'Engagement rate analysis',
            'Eligible for Admin Content Cash Rewards',
            'Fast-track creator support'
          ])
        },
        {
          id: 'monthly',
          name: 'Monthly Influencer Pro',
          price: 199,
          formatted_price: '₹199',
          period: 'month',
          duration: '30 Days',
          label: 'Most Popular',
          description: 'Billed monthly. Cancel anytime.',
          savings: 'Save 45%',
          popular: 1,
          active: 1,
          features: JSON.stringify([
            'Official Influencer status badge',
            'Full in-depth video & reel analytics',
            'Views, Likes, Comments, Shares, Saves & Engagement %',
            'Eligible for Admin Performance Cash Rewards',
            'Direct wallet earnings transfer',
            'Priority content indexing in Discover'
          ])
        },
        {
          id: 'quarterly',
          name: 'Quarterly Influencer Star',
          price: 499,
          formatted_price: '₹499',
          period: '3 months',
          duration: '90 Days',
          label: 'Best Value',
          description: '₹166/month. Save more for consistent creators.',
          savings: 'Save 60%',
          popular: 0,
          active: 1,
          features: JSON.stringify([
            'All Monthly Influencer Pro benefits',
            'Quarterly Influencer spotlight boost',
            'Top priority for Admin performance payouts',
            'Exclusive brand promotion opportunities',
            'Dedicated influencer manager'
          ])
        },
        {
          id: 'yearly',
          name: 'Annual VIP Influencer',
          price: 1499,
          formatted_price: '₹1,499',
          period: 'year',
          duration: '365 Days',
          label: 'VIP Access',
          description: '₹125/month. For serious professional creators.',
          savings: 'Save 70%',
          popular: 0,
          active: 1,
          features: JSON.stringify([
            'All Quarterly benefits included',
            'VIP Gold Influencer verification badge',
            'Maximum tier for Admin content cash rewards',
            'Invitation to FunFlick Creator Summits',
            'Early access to all upcoming monetization tools'
          ])
        }
      ];

      for (const p of defaultPlans) {
        await connection.query(
          `INSERT INTO subscription_plans (id, name, price, formatted_price, period, duration, label, description, savings, popular, active, features)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.id, p.name, p.price, p.formatted_price, p.period, p.duration, p.label, p.description, p.savings, p.popular, p.active, p.features]
        );
      }
    }

    // Creator Payout Details Table (Bank & UPI Details)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS creator_payout_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        payout_type ENUM('bank', 'upi') NOT NULL DEFAULT 'bank',
        bank_name VARCHAR(120) DEFAULT NULL,
        account_number VARCHAR(50) DEFAULT NULL,
        ifsc_code VARCHAR(30) DEFAULT NULL,
        upi_id VARCHAR(100) DEFAULT NULL,
        phone_number VARCHAR(30) DEFAULT NULL,
        email_id VARCHAR(120) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Creator Payout Transactions & Audit Trail
    await connection.query(`
      CREATE TABLE IF NOT EXISTS creator_payouts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        creator_id INT NOT NULL,
        video_id INT DEFAULT NULL,
        amount INT NOT NULL,
        status ENUM('Pending', 'Paid') DEFAULT 'Paid',
        payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
        payment_reference VARCHAR(100) DEFAULT NULL,
        payout_details JSON DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        settled_views INT DEFAULT 0,
        paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Content Reports & Moderation Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS content_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reporter_id INT NOT NULL,
        target_video_id INT DEFAULT NULL,
        reason VARCHAR(255) NOT NULL,
        details TEXT,
        status ENUM('Pending', 'Resolved', 'Dismissed') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    connection.release();
    console.log('✅ MySQL schema initialized successfully');
  } catch (err) {
    console.error('❌ Failed to connect to MySQL:', err.message);
  }
}

export default pool;
