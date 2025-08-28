const Joi = require('joi');
const crypto = require('crypto');
const whatsAppService = require('../services/whatsappService');
const WhatsAppConnection = require('../models/WhatsAppConnection');
const { logInfo, logError, logWarning, logApiRequest } = require('../utils/logger');

class WhatsAppController {
    constructor() {
        this.setupValidationSchemas();
    }

    setupValidationSchemas() {
        this.createConnectionSchema = Joi.object({
            connectionId: Joi.string()
                .pattern(/^[a-zA-Z0-9_-]{8,32}$/)
                .required()
                .messages({
                    'string.pattern.base': 'Connection ID must be 8-32 characters long and contain only letters, numbers, underscores, and hyphens'
                }),
            name: Joi.string()
                .trim()
                .max(100)
                .optional(),
            phoneNumber: Joi.string()
                .pattern(/^\+?[1-9]\d{1,14}$/)
                .optional()
                .messages({
                    'string.pattern.base': 'Please provide a valid phone number'
                }),
            settings: Joi.object({
                autoReconnect: Joi.boolean().default(true),
                maxReconnectAttempts: Joi.number().integer().min(1).max(20).default(5),
                reconnectInterval: Joi.number().integer().min(5000).max(300000).default(30000),
                messageRetryAttempts: Joi.number().integer().min(1).max(10).default(3),
                messageRetryDelay: Joi.number().integer().min(1000).max(60000).default(5000),
                enableLogging: Joi.boolean().default(true),
                enableNotifications: Joi.boolean().default(true)
            }).optional()
        });

        this.sendMessageSchema = Joi.object({
            to: Joi.string()
                .pattern(/^\+?[1-9]\d{1,14}$/)
                .required()
                .messages({
                    'string.pattern.base': 'Please provide a valid phone number'
                }),
            message: Joi.alternatives().try(
                Joi.string().min(1).max(4096),
                Joi.object({
                    media: Joi.object({
                        path: Joi.string().required(),
                        type: Joi.string().valid('image', 'video', 'audio', 'document').required()
                    }).required(),
                    caption: Joi.string().max(1024).optional()
                })
            ).required(),
            options: Joi.object({
                priority: Joi.string().valid('low', 'normal', 'high').default('normal'),
                scheduledAt: Joi.date().min('now').optional(),
                retryOnFailure: Joi.boolean().default(true)
            }).optional()
        });

        this.updateConnectionSchema = Joi.object({
            name: Joi.string().trim().max(100).optional(),
            phoneNumber: Joi.string()
                .pattern(/^\+?[1-9]\d{1,14}$/)
                .optional()
                .messages({
                    'string.pattern.base': 'Please provide a valid phone number'
                }),
            settings: Joi.object({
                autoReconnect: Joi.boolean().optional(),
                maxReconnectAttempts: Joi.number().integer().min(1).max(20).optional(),
                reconnectInterval: Joi.number().integer().min(5000).max(300000).optional(),
                messageRetryAttempts: Joi.number().integer().min(1).max(10).optional(),
                messageRetryDelay: Joi.number().integer().min(1000).max(60000).optional(),
                enableLogging: Joi.boolean().optional(),
                enableNotifications: Joi.boolean().optional()
            }).optional()
        });
    }

    // Create new WhatsApp connection
    async createConnection(req, res) {
        try {
            const { error, value } = this.createConnectionSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.details.map(d => d.message)
                });
            }

            const userId = req.user.id;
            const { connectionId, name, phoneNumber, settings } = value;

            // Check if user can create more connections
            const userConnections = await WhatsAppConnection.findByUserId(userId);
            const user = req.user;
            
            if (userConnections.length >= user.planDetails.maxConnections) {
                return res.status(403).json({
                    success: false,
                    error: 'Connection limit exceeded',
                    details: `You can only have ${user.planDetails.maxConnections} connections with your current plan`
                });
            }

            // Create connection
            const connection = await whatsAppService.createConnection(userId, connectionId, {
                name,
                phoneNumber,
                settings
            });

            logApiRequest(req.method, req.originalUrl, 201, Date.now() - req.startTime, {
                userId,
                connectionId,
                action: 'create_connection'
            });

            res.status(201).json({
                success: true,
                message: 'WhatsApp connection created successfully',
                data: {
                    connection: {
                        id: connection._id,
                        connectionId: connection.connectionId,
                        name: connection.name,
                        status: connection.status,
                        isActive: connection.isActive,
                        createdAt: connection.createdAt
                    }
                }
            });
        } catch (error) {
            logError('Failed to create WhatsApp connection', error, {
                userId: req.user?.id,
                body: req.body
            });

            if (error.message.includes('already exists')) {
                return res.status(409).json({
                    success: false,
                    error: 'Connection already exists',
                    details: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to create WhatsApp connection',
                details: error.message
            });
        }
    }

    // Get QR code for connection
    async getQRCode(req, res) {
        try {
            const { connectionId } = req.params;
            const userId = req.user.id;

            // Verify connection belongs to user
            const connection = await WhatsAppConnection.findOne({
                connectionId,
                userId,
                isActive: true
            });

            if (!connection) {
                return res.status(404).json({
                    success: false,
                    error: 'Connection not found'
                });
            }

            const qrData = await whatsAppService.getQRCode(connectionId);

            logApiRequest(req.method, req.originalUrl, 200, Date.now() - req.startTime, {
                userId,
                connectionId,
                action: 'get_qr_code'
            });

            res.json({
                success: true,
                data: {
                    qrCode: qrData.qrCode,
                    expiresAt: qrData.expiresAt,
                    connectionId: qrData.connectionId
                }
            });
        } catch (error) {
            logError('Failed to get QR code', error, {
                userId: req.user?.id,
                connectionId: req.params.connectionId
            });

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    error: 'Connection not found'
                });
            }

            if (error.message.includes('not available') || error.message.includes('expired')) {
                return res.status(400).json({
                    success: false,
                    error: 'QR code not available',
                    details: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to get QR code',
                details: error.message
            });
        }
    }

    // Send WhatsApp message
    async sendMessage(req, res) {
        try {
            const { error, value } = this.sendMessageSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.details.map(d => d.message)
                });
            }

            const { connectionId } = req.params;
            const { to, message, options } = value;
            const userId = req.user.id;

            // Verify connection belongs to user and is ready
            const connection = await WhatsAppConnection.findOne({
                connectionId,
                userId,
                isActive: true
            });

            if (!connection) {
                return res.status(404).json({
                    success: false,
                    error: 'Connection not found'
                });
            }

            if (!connection.canSendMessages) {
                return res.status(400).json({
                    success: false,
                    error: 'Connection not ready',
                    details: `Connection status: ${connection.status}`
                });
            }

            // Check user's daily message limit
            const user = req.user;
            if (user.usageStats.dailyMessageCount >= user.planDetails.maxMessagesPerDay) {
                return res.status(403).json({
                    success: false,
                    error: 'Daily message limit exceeded',
                    details: `You can only send ${user.planDetails.maxMessagesPerDay} messages per day with your current plan`
                });
            }

            // Send message
            const result = await whatsAppService.sendMessage(connectionId, to, message, options);

            // Update user's message count
            await user.incrementMessageCount('sent');

            logApiRequest(req.method, req.originalUrl, 200, Date.now() - req.startTime, {
                userId,
                connectionId,
                to,
                messageId: result.messageId,
                action: 'send_message'
            });

            res.json({
                success: true,
                message: 'Message sent successfully',
                data: {
                    messageId: result.messageId,
                    timestamp: result.timestamp,
                    connectionId: result.connectionId
                }
            });
        } catch (error) {
            logError('Failed to send WhatsApp message', error, {
                userId: req.user?.id,
                connectionId: req.params.connectionId,
                body: req.body
            });

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    error: 'Connection not found'
                });
            }

            if (error.message.includes('not ready')) {
                return res.status(400).json({
                    success: false,
                    error: 'Connection not ready',
                    details: error.message
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to send message',
                details: error.message
            });
        }
    }

    // Get connection status
    async getConnectionStatus(req, res) {
        try {
            const { connectionId } = req.params;
            const userId = req.user.id;

            // Verify connection belongs to user
            const connection = await WhatsAppConnection.findOne({
                connectionId,
                userId,
                isActive: true
            });

            if (!connection) {
                return res.status(404).json({
                    success: false,
                    error: 'Connection not found'
                });
            }

            const status = await whatsAppService.getConnectionStatus(connectionId);

            logApiRequest(req.method, req.originalUrl, 200, Date.now() - req.startTime, {
                userId,
                connectionId,
                action: 'get_status'
            });

            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            logError('Failed to get connection status', error, {
                userId: req.user?.id,
                connectionId: req.params.connectionId
            });

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    error: 'Connection not found'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to get connection status',
                details: error.message
            });
        }
    }

    // Get all user connections
    async getUserConnections(req, res) {
        try {
            const userId = req.user.id;
            const { status, limit = 50 } = req.query;

            const connections = await WhatsAppConnection.findByUserId(userId, {
                status: status || undefined,
                limit: parseInt(limit)
            });

            const connectionsData = connections.map(conn => ({
                id: conn._id,
                connectionId: conn.connectionId,
                name: conn.name,
                phoneNumber: conn.phoneNumber,
                status: conn.status,
                isActive: conn.isActive,
                isDefault: conn.isDefault,
                canSendMessages: conn.canSendMessages,
                lastHeartbeat: conn.lastHeartbeat,
                lastMessageSent: conn.lastMessageSent,
                lastMessageReceived: conn.lastMessageReceived,
                stats: conn.stats,
                health: conn.getHealthStatus(),
                createdAt: conn.createdAt,
                updatedAt: conn.updatedAt
            }));

            logApiRequest(req.method, req.originalUrl, 200, Date.now() - req.startTime, {
                userId,
                action: 'get_connections',
                count: connectionsData.length
            });

            res.json({
                success: true,
                data: {
                    connections: connectionsData,
                    total: connectionsData.length
                }
            });
        } catch (error) {
            logError('Failed to get user connections', error, {
                userId: req.user?.id
            });

            res.status(500).json({
                success: false,
                error: 'Failed to get connections',
                details: error.message
            });
        }
    }

    // Update connection
    async updateConnection(req, res) {
        try {
            const { error, value } = this.updateConnectionSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.details.map(d => d.message)
                });
            }

            const { connectionId } = req.params;
            const userId = req.user.id;
            const { name, phoneNumber, settings } = value;

            // Verify connection belongs to user
            const connection = await WhatsAppConnection.findOne({
                connectionId,
                userId,
                isActive: true
            });

            if (!connection) {
                return res.status(404).json({
                    success: false,
                    error: 'Connection not found'
                });
            }

            // Update connection
            if (name !== undefined) connection.name = name;
            if (phoneNumber !== undefined) connection.phoneNumber = phoneNumber;
            if (settings) {
                Object.assign(connection.settings, settings);
            }

            await connection.save();

            logApiRequest(req.method, req.originalUrl, 200, Date.now() - req.startTime, {
                userId,
                connectionId,
                action: 'update_connection'
            });

            res.json({
                success: true,
                message: 'Connection updated successfully',
                data: {
                    connection: {
                        id: connection._id,
                        connectionId: connection.connectionId,
                        name: connection.name,
                        phoneNumber: connection.phoneNumber,
                        status: connection.status,
                        settings: connection.settings,
                        updatedAt: connection.updatedAt
                    }
                }
            });
        } catch (error) {
            logError('Failed to update connection', error, {
                userId: req.user?.id,
                connectionId: req.params.connectionId,
                body: req.body
            });

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    error: 'Connection not found'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to update connection',
                details: error.message
            });
        }
    }

    // Set connection as default
    async setDefaultConnection(req, res) {
        try {
            const { connectionId } = req.params;
            const userId = req.user.id;

            // Verify connection belongs to user
            const connection = await WhatsAppConnection.findOne({
                connectionId,
                userId,
                isActive: true
            });

            if (!connection) {
                return res.status(404).json({
                    success: false,
                    error: 'Connection not found'
                });
            }

            await connection.setAsDefault();

            logApiRequest(req.method, req.originalUrl, 200, Date.now() - req.startTime, {
                userId,
                connectionId,
                action: 'set_default_connection'
            });

            res.json({
                success: true,
                message: 'Default connection updated successfully',
                data: {
                    connectionId: connection.connectionId,
                    isDefault: connection.isDefault
                }
            });
        } catch (error) {
            logError('Failed to set default connection', error, {
                userId: req.user?.id,
                connectionId: req.params.connectionId
            });

            res.status(500).json({
                success: false,
                error: 'Failed to set default connection',
                details: error.message
            });
        }
    }

    // Disconnect connection
    async disconnectConnection(req, res) {
        try {
            const { connectionId } = req.params;
            const userId = req.user.id;

            // Verify connection belongs to user
            const connection = await WhatsAppConnection.findOne({
                connectionId,
                userId,
                isActive: true
            });

            if (!connection) {
                return res.status(404).json({
                    success: false,
                    error: 'Connection not found'
                });
            }

            await whatsAppService.disconnect(connectionId);

            logApiRequest(req.method, req.originalUrl, 200, Date.now() - req.startTime, {
                userId,
                connectionId,
                action: 'disconnect_connection'
            });

            res.json({
                success: true,
                message: 'Connection disconnected successfully',
                data: {
                    connectionId: connection.connectionId,
                    status: 'disconnected'
                }
            });
        } catch (error) {
            logError('Failed to disconnect connection', error, {
                userId: req.user?.id,
                connectionId: req.params.connectionId
            });

            res.status(500).json({
                success: false,
                error: 'Failed to disconnect connection',
                details: error.message
            });
        }
    }

    // Delete connection
    async deleteConnection(req, res) {
        try {
            const { connectionId } = req.params;
            const userId = req.user.id;

            // Verify connection belongs to user
            const connection = await WhatsAppConnection.findOne({
                connectionId,
                userId,
                isActive: true
            });

            if (!connection) {
                return res.status(404).json({
                    success: false,
                    error: 'Connection not found'
                });
            }

            await whatsAppService.deleteConnection(connectionId);

            logApiRequest(req.method, req.originalUrl, 200, Date.now() - req.startTime, {
                userId,
                connectionId,
                action: 'delete_connection'
            });

            res.json({
                success: true,
                message: 'Connection deleted successfully',
                data: {
                    connectionId: connection.connectionId
                }
            });
        } catch (error) {
            logError('Failed to delete connection', error, {
                userId: req.user?.id,
                connectionId: req.params.connectionId
            });

            res.status(500).json({
                success: false,
                error: 'Failed to delete connection',
                details: error.message
            });
        }
    }

    // Get service statistics
    async getServiceStats(req, res) {
        try {
            const userId = req.user.id;
            
            // Get user-specific stats
            const userStats = await WhatsAppConnection.getConnectionStats(userId);
            
            // Get global stats (admin only)
            let globalStats = null;
            if (req.user.plan === 'enterprise' || req.user.isAdmin) {
                globalStats = await whatsAppService.getServiceStats();
            }

            logApiRequest(req.method, req.originalUrl, 200, Date.now() - req.startTime, {
                userId,
                action: 'get_service_stats'
            });

            res.json({
                success: true,
                data: {
                    userStats,
                    globalStats
                }
            });
        } catch (error) {
            logError('Failed to get service stats', error, {
                userId: req.user?.id
            });

            res.status(500).json({
                success: false,
                error: 'Failed to get service statistics',
                details: error.message
            });
        }
    }
}

module.exports = new WhatsAppController(); 