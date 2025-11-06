const { Pool } = require('pg');
const { logInfo, logWarning, logError } = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logError('Unexpected error on idle PostgreSQL client', err);
});

async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logInfo('PostgreSQL connection pool ready');
    return true;
  } catch (error) {
    logWarning('PostgreSQL connection test failed', { error: error.message });
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
