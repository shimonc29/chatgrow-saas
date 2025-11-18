const Redis = require('ioredis');
const { logInfo, logWarning, logError } = require('../utils/logger');

/**
 * Redis Client Manager עם Multi-Tenant Support
 * אכיפת tenantId בכל מפתח cache למניעת דליפת נתונים
 */
class RedisClientManager {
  constructor() {
    this.baseClient = null;
    this.isConnected = false;
    this.initialize();
  }

  /**
   * אתחול Redis Client
   */
  initialize() {
    const redisUrl = process.env.REDIS_URL;

    // אם אין REDIS_URL או שהוא localhost - דלג
    if (!redisUrl || redisUrl.includes('localhost') || redisUrl.includes('127.0.0.1')) {
      logWarning('Redis not configured or pointing to localhost - Caching disabled');
      this.isConnected = false;
      return;
    }

    try {
      this.baseClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      this.baseClient.on('connect', () => {
        logInfo('Redis connected successfully');
        this.isConnected = true;
      });

      this.baseClient.on('error', (error) => {
        logError('Redis connection error', error);
        this.isConnected = false;
      });

      this.baseClient.on('close', () => {
        logWarning('Redis connection closed');
        this.isConnected = false;
      });

    } catch (error) {
      logError('Failed to initialize Redis', error);
      this.isConnected = false;
    }
  }

  /**
   * יוצר Tenant-Scoped Redis Client
   * @param {String} tenantId - Business ID
   */
  getTenantClient(tenantId) {
    if (!this.isConnected || !this.baseClient) {
      return new NoOpRedisClient(); // Fallback when Redis unavailable
    }

    this.validateTenantId(tenantId);

    return new TenantRedisClient(tenantId, this.baseClient);
  }

  /**
   * בדיקת תקינות tenantId (למניעת injection)
   */
  validateTenantId(tenantId) {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new Error('Invalid tenant ID: must be a non-empty string');
    }

    // רק אותיות, מספרים, מקפים, קווים תחתונים
    if (!/^[a-zA-Z0-9-_]+$/.test(tenantId)) {
      throw new Error('Invalid tenant ID format: contains illegal characters');
    }

    if (tenantId.length > 64) {
      throw new Error('Invalid tenant ID: too long (max 64 chars)');
    }
  }

  /**
   * סגירת החיבור ל-Redis
   */
  async disconnect() {
    if (this.baseClient) {
      await this.baseClient.quit();
      this.isConnected = false;
      logInfo('Redis disconnected');
    }
  }

  /**
   * בדיקת סטטוס החיבור
   */
  getStatus() {
    return {
      connected: this.isConnected,
      redis: this.baseClient?.status || 'disconnected'
    };
  }
}

/**
 * Tenant-Scoped Redis Client
 * כל פעולה מקדימה אוטומטית את tenantId למפתח
 */
class TenantRedisClient {
  constructor(tenantId, baseClient) {
    this.tenantId = tenantId;
    this.prefix = `tenant:${tenantId}:`;
    this.redis = baseClient;
  }

  /**
   * שמירת ערך ב-Cache
   * @param {String} key - Cache key (ללא prefix)
   * @param {String|Object} value - ערך לשמירה
   * @param {Number} ttl - Time to live בשניות (optional)
   */
  async set(key, value, ttl = null) {
    try {
      const fullKey = this.prefix + key;
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);

      if (ttl) {
        await this.redis.setex(fullKey, ttl, serializedValue);
      } else {
        await this.redis.set(fullKey, serializedValue);
      }

      return true;
    } catch (error) {
      logError('Redis SET failed', error, { key, tenantId: this.tenantId });
      return false;
    }
  }

  /**
   * קריאת ערך מ-Cache
   * @param {String} key - Cache key
   * @param {Boolean} parseJSON - האם לפרסר JSON אוטומטית
   */
  async get(key, parseJSON = true) {
    try {
      const fullKey = this.prefix + key;
      const value = await this.redis.get(fullKey);

      if (!value) return null;

      if (parseJSON) {
        try {
          return JSON.parse(value);
        } catch {
          return value; // אם לא JSON תקין, החזר כ-string
        }
      }

      return value;
    } catch (error) {
      logError('Redis GET failed', error, { key, tenantId: this.tenantId });
      return null;
    }
  }

  /**
   * מחיקת ערך
   */
  async del(key) {
    try {
      const fullKey = this.prefix + key;
      await this.redis.del(fullKey);
      return true;
    } catch (error) {
      logError('Redis DEL failed', error, { key, tenantId: this.tenantId });
      return false;
    }
  }

  /**
   * מחיקת כל ה-Cache של הדייר (שימוש זהיר!)
   */
  async flushTenantCache() {
    try {
      let cursor = '0';
      const keysToDelete = [];

      do {
        const [nextCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          `${this.prefix}*`,
          'COUNT',
          100
        );

        cursor = nextCursor;
        keysToDelete.push(...keys);
      } while (cursor !== '0');

      if (keysToDelete.length > 0) {
        await this.redis.del(...keysToDelete);
        logInfo('Tenant cache flushed', { tenantId: this.tenantId, keysDeleted: keysToDelete.length });
      }

      return true;
    } catch (error) {
      logError('Failed to flush tenant cache', error, { tenantId: this.tenantId });
      return false;
    }
  }

  /**
   * בדיקה אם מפתח קיים
   */
  async exists(key) {
    try {
      const fullKey = this.prefix + key;
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      logError('Redis EXISTS failed', error, { key, tenantId: this.tenantId });
      return false;
    }
  }

  /**
   * הגדרת TTL למפתח קיים
   */
  async expire(key, ttl) {
    try {
      const fullKey = this.prefix + key;
      await this.redis.expire(fullKey, ttl);
      return true;
    } catch (error) {
      logError('Redis EXPIRE failed', error, { key, tenantId: this.tenantId });
      return false;
    }
  }
}

/**
 * No-Op Redis Client - Fallback כאשר Redis לא זמין
 * מחזיר תמיד null/false אך לא זורק שגיאות
 */
class NoOpRedisClient {
  async set() { return false; }
  async get() { return null; }
  async del() { return false; }
  async exists() { return false; }
  async expire() { return false; }
  async flushTenantCache() { return false; }
}

// Singleton instance
const redisManager = new RedisClientManager();

module.exports = redisManager;
