
const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        message: 'Health service is operational'
    });
});

// Detailed health check
router.get('/detailed', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        services: {
            api: 'operational',
            database: 'fallback',
            queue: 'operational'
        },
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

module.exports = router;
