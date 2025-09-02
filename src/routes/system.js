
const express = require('express');
const router = express.Router();
const { logInfo, logError } = require('../utils/logger');

// System status
router.get('/status', async (req, res) => {
    try {
        const status = {
            server: {
                uptime: Math.floor(process.uptime()),
                memory: process.memoryUsage(),
                nodeVersion: process.version,
                platform: process.platform
            },
            services: {
                database: 'fallback',
                redis: 'fallback',
                queue: 'active',
                whatsapp: 'active'
            },
            timestamp: new Date()
        };

        res.json({
            success: true,
            data: status,
            message: 'System status retrieved successfully'
        });

    } catch (error) {
        logError('Failed to get system status', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve system status'
        });
    }
});

// System restart (for development)
router.post('/restart', async (req, res) => {
    try {
        logInfo('System restart requested', { 
            requestedBy: req.ip,
            timestamp: new Date()
        });

        res.json({
            success: true,
            message: 'System restart initiated'
        });

        // Restart in development mode
        setTimeout(() => {
            if (process.env.NODE_ENV !== 'production') {
                process.exit(0);
            }
        }, 1000);

    } catch (error) {
        logError('Failed to restart system', error);
        res.status(500).json({
            success: false,
            error: 'Failed to restart system'
        });
    }
});

module.exports = router;
