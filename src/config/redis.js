const redis = require('@redis/client');
const { logInfo, logError, logWarning } = require('../utils/logger');

let redisClient = null;
let isRedisConnected = false;

const connectRedis = async () => {
    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        
        redisClient = redis.createClient({
            url: redisUrl,
            socket: {
                connectTimeout: 5000,
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logError('Redis max retries reached, stopping reconnection attempts');
                        return new Error('Max retries reached');
                    }
                    const delay = Math.min(retries * 100, 3000);
                    logInfo('Redis reconnecting', { attempt: retries, delay });
                    return delay;
                }
            }
        });

        redisClient.on('error', (err) => {
            logError('Redis client error', err);
            isRedisConnected = false;
        });

        redisClient.on('connect', () => {
            logInfo('Redis client connecting...');
        });

        redisClient.on('ready', () => {
            logInfo('Redis client ready', { url: redisUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') });
            isRedisConnected = true;
        });

        redisClient.on('reconnecting', () => {
            logWarning('Redis client reconnecting...');
            isRedisConnected = false;
        });

        redisClient.on('end', () => {
            logWarning('Redis client disconnected');
            isRedisConnected = false;
        });

        await redisClient.connect();

        logInfo('Redis initialized successfully');

        return redisClient;
    } catch (error) {
        logError('Failed to connect to Redis', error);
        logWarning('Running without Redis - using in-memory queue (messages will be lost on restart)');
        isRedisConnected = false;
        return null;
    }
};

const checkRedisConnection = () => {
    return isRedisConnected && redisClient && redisClient.isOpen;
};

const getRedisClient = () => {
    return redisClient;
};

const closeRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        logInfo('Redis connection closed');
    }
};

process.on('SIGINT', async () => {
    await closeRedis();
    process.exit(0);
});

module.exports = {
    connectRedis,
    isRedisConnected: checkRedisConnection,
    getRedisClient,
    closeRedis
};
