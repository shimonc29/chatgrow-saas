const express = require('express');
const router = express.Router();
const whatsAppController = require('../controllers/whatsappController');
const authMiddleware = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate());

// Request timing middleware
router.use((req, res, next) => {
    req.startTime = Date.now();
    next();
});

// Connection Management Routes
// POST /api/whatsapp/connections - Create new WhatsApp connection
router.post('/connections', whatsAppController.createConnection.bind(whatsAppController));

// GET /api/whatsapp/connections - Get all user connections
router.get('/connections', whatsAppController.getUserConnections.bind(whatsAppController));

// GET /api/whatsapp/connections/:connectionId - Get specific connection status
router.get('/connections/:connectionId', whatsAppController.getConnectionStatus.bind(whatsAppController));

// PUT /api/whatsapp/connections/:connectionId - Update connection
router.put('/connections/:connectionId', whatsAppController.updateConnection.bind(whatsAppController));

// POST /api/whatsapp/connections/:connectionId/default - Set as default connection
router.post('/connections/:connectionId/default', whatsAppController.setDefaultConnection.bind(whatsAppController));

// POST /api/whatsapp/connections/:connectionId/disconnect - Disconnect connection
router.post('/connections/:connectionId/disconnect', whatsAppController.disconnectConnection.bind(whatsAppController));

// DELETE /api/whatsapp/connections/:connectionId - Delete connection
router.delete('/connections/:connectionId', whatsAppController.deleteConnection.bind(whatsAppController));

// QR Code Routes
// GET /api/whatsapp/connections/:connectionId/qr - Get QR code for connection
router.get('/connections/:connectionId/qr', whatsAppController.getQRCode.bind(whatsAppController));

// Message Routes
// POST /api/whatsapp/connections/:connectionId/send - Send WhatsApp message
router.post('/connections/:connectionId/send', whatsAppController.sendMessage.bind(whatsAppController));

// Statistics Routes
// GET /api/whatsapp/stats - Get service statistics
router.get('/stats', whatsAppController.getServiceStats.bind(whatsAppController));

// Health Check Route
// GET /api/whatsapp/health - WhatsApp service health check
router.get('/health', async (req, res) => {
    try {
        const whatsAppService = require('../services/whatsappService');
        const stats = await whatsAppService.getServiceStats();
        
        res.json({
            success: true,
            message: 'WhatsApp service is healthy',
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                stats: {
                    activeConnections: stats.activeConnections,
                    totalConnections: stats.totalConnections,
                    totalMessagesSent: stats.totalMessagesSent,
                    totalMessagesReceived: stats.totalMessagesReceived
                }
            }
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            message: 'WhatsApp service is unhealthy',
            error: error.message
        });
    }
});

// Bulk Operations Routes (Premium/Enterprise only)
// POST /api/whatsapp/bulk/send - Send bulk messages
router.post('/bulk/send', 
    authMiddleware.requirePlan(['premium', 'enterprise']),
    async (req, res) => {
        try {
            const { connectionId, messages, options = {} } = req.body;
            const userId = req.user.id;

            // Validate input
            if (!Array.isArray(messages) || messages.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Messages array is required and cannot be empty'
                });
            }

            if (messages.length > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Maximum 100 messages allowed per bulk send'
                });
            }

            const whatsAppService = require('../services/whatsappService');
            const results = [];
            const errors = [];

            // Process messages with rate limiting
            for (let i = 0; i < messages.length; i++) {
                try {
                    const message = messages[i];
                    const result = await whatsAppService.sendMessage(
                        connectionId,
                        message.to,
                        message.content,
                        { ...options, priority: 'low' }
                    );
                    
                    results.push({
                        index: i,
                        success: true,
                        messageId: result.messageId,
                        to: message.to
                    });

                    // Add delay between messages to respect rate limits
                    if (i < messages.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (error) {
                    errors.push({
                        index: i,
                        success: false,
                        to: messages[i].to,
                        error: error.message
                    });
                }
            }

            res.json({
                success: true,
                message: 'Bulk send completed',
                data: {
                    total: messages.length,
                    successful: results.length,
                    failed: errors.length,
                    results,
                    errors
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to send bulk messages',
                details: error.message
            });
        }
    }
);

// Webhook Routes (for receiving WhatsApp messages)
// POST /api/whatsapp/webhook/:connectionId - Webhook for incoming messages
router.post('/webhook/:connectionId', async (req, res) => {
    try {
        const { connectionId } = req.params;
        const { message, sender, timestamp, type } = req.body;

        // Validate webhook signature (implement your own validation)
        // const signature = req.headers['x-whatsapp-signature'];
        // if (!validateWebhookSignature(signature, req.body)) {
        //     return res.status(401).json({ error: 'Invalid signature' });
        // }

        // Process incoming message
        const whatsAppService = require('../services/whatsappService');
        const connection = await require('../models/WhatsAppConnection').findOne({ connectionId });
        
        if (connection) {
            // Update message received stats
            await connection.incrementMessageCount('received');
            
            // Log the incoming message
            const { logInfo } = require('../utils/logger');
            logInfo('Webhook received', {
                connectionId,
                sender,
                type,
                timestamp
            });
        }

        res.json({ success: true, message: 'Webhook processed' });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to process webhook',
            details: error.message
        });
    }
});

// Admin Routes (Enterprise/Admin only)
// GET /api/whatsapp/admin/connections - Get all connections (admin)
router.get('/admin/connections',
    authMiddleware.requirePlan(['enterprise']),
    async (req, res) => {
        try {
            const { page = 1, limit = 50, status, userId } = req.query;
            const skip = (page - 1) * limit;

            const query = {};
            if (status) query.status = status;
            if (userId) query.userId = userId;

            const connections = await require('../models/WhatsAppConnection')
                .find(query)
                .populate('userId', 'email firstName lastName plan')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await require('../models/WhatsAppConnection').countDocuments(query);

            res.json({
                success: true,
                data: {
                    connections,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get admin connections',
                details: error.message
            });
        }
    }
);

// POST /api/whatsapp/admin/connections/:connectionId/force-reconnect - Force reconnect (admin)
router.post('/admin/connections/:connectionId/force-reconnect',
    authMiddleware.requirePlan(['enterprise']),
    async (req, res) => {
        try {
            const { connectionId } = req.params;
            const whatsAppService = require('../services/whatsappService');

            // Force disconnect and reconnect
            await whatsAppService.disconnect(connectionId);
            
            // Get connection details
            const connection = await require('../models/WhatsAppConnection').findOne({ connectionId });
            if (!connection) {
                return res.status(404).json({
                    success: false,
                    error: 'Connection not found'
                });
            }

            // Recreate connection
            await whatsAppService.createConnection(
                connection.userId,
                connection.connectionId,
                {
                    name: connection.name,
                    phoneNumber: connection.phoneNumber,
                    settings: connection.settings
                }
            );

            res.json({
                success: true,
                message: 'Connection force reconnected successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to force reconnect',
                details: error.message
            });
        }
    }
);

// Error handling middleware for WhatsApp routes
router.use((error, req, res, next) => {
    const { logError } = require('../utils/logger');
    
    logError('WhatsApp route error', error, {
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.id
    });

    res.status(500).json({
        success: false,
        error: 'WhatsApp service error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
});

module.exports = router; 