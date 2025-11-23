const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { pool: postgresPool } = require('../config/postgres');
const { logInfo, logError } = require('../utils/logger');

/**
 * @swagger
 * /monitoring/health:
 *   get:
 *     summary: Comprehensive health check
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: System health status
 */
router.get('/health', async (req, res) => {
  const checks = {};
  let overallHealthy = true;

  // Check MongoDB
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      checks.mongodb = { status: 'healthy', latency: 0 };
    } else {
      checks.mongodb = { status: 'disconnected' };
      overallHealthy = false;
    }
  } catch (error) {
    checks.mongodb = { status: 'unhealthy', error: error.message };
    overallHealthy = false;
  }

  // Check PostgreSQL
  try {
    const start = Date.now();
    const client = await postgresPool.connect();
    await client.query('SELECT 1');
    client.release();
    checks.postgresql = { status: 'healthy', latency: Date.now() - start };
  } catch (error) {
    checks.postgresql = { status: 'unhealthy', error: error.message };
    overallHealthy = false;
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  checks.memory = {
    status: 'healthy',
    heapUsed: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100, // MB
    heapTotal: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100, // MB
    rss: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100, // MB
  };

  // Check uptime
  const uptime = process.uptime();
  checks.uptime = {
    seconds: Math.floor(uptime),
    formatted: formatUptime(uptime),
  };

  res.status(overallHealthy ? 200 : 503).json({
    status: overallHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * @swagger
 * /monitoring/readiness:
 *   get:
 *     summary: Readiness probe for Kubernetes/Docker
 *     tags: [Monitoring]
 */
router.get('/readiness', async (req, res) => {
  try {
    // Check if MongoDB is connected
    const mongoReady = mongoose.connection.readyState === 1;

    // Check if PostgreSQL is connected
    let postgresReady = false;
    try {
      const client = await postgresPool.connect();
      client.release();
      postgresReady = true;
    } catch (error) {
      postgresReady = false;
    }

    if (mongoReady && postgresReady) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({
        status: 'not ready',
        mongodb: mongoReady ? 'connected' : 'disconnected',
        postgresql: postgresReady ? 'connected' : 'disconnected',
      });
    }
  } catch (error) {
    logError('Readiness check failed', error);
    res.status(503).json({ status: 'error', message: error.message });
  }
});

/**
 * @swagger
 * /monitoring/liveness:
 *   get:
 *     summary: Liveness probe for Kubernetes/Docker
 *     tags: [Monitoring]
 */
router.get('/liveness', (req, res) => {
  // Simple liveness check - just return 200 if server is responding
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

/**
 * @swagger
 * /monitoring/metrics:
 *   get:
 *     summary: Application metrics
 *     tags: [Monitoring]
 */
router.get('/metrics', (req, res) => {
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    platform: process.platform,
    version: process.version,
    pid: process.pid,
  };

  res.json(metrics);
});

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  parts.push(`${secs}s`);

  return parts.join(' ');
}

module.exports = router;
