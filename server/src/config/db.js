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

    connection.release();
    console.log('✅ MySQL schema initialized successfully');
  } catch (err) {
    console.error('❌ Failed to connect to MySQL:', err.message);
  }
}

export default pool;
