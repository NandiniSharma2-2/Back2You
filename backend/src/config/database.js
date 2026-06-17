const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'back2you_user',
  password: process.env.DB_PASSWORD || 'back2you_pass',
  database: process.env.DB_NAME || 'back2you',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+00:00',
  charset: 'utf8mb4',
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    logger.info('✅ MySQL database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    logger.error('❌ MySQL connection failed:', error.message);
    throw error;
  }
}

async function query(sql, params = []) {
  try {
    // Use pool.query instead of pool.execute for better parameter handling
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    logger.error('Database query error:', { sql, params, error: error.message });
    throw error;
  }
}

async function transaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { pool, query, transaction, testConnection };
