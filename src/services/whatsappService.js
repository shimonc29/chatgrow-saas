const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;
// Safe require with fallback
let WhatsAppConnection;
try {
    WhatsAppConnection = require('../models/WhatsAppConnection');
} catch (error) {
    console.log('WhatsAppConnection model not available - running in fallback mode');
    WhatsAppConnection = null;
}

const { logInfo, logError, logWarning, logDebug } = require('../utils/logger');

class WhatsAppService {
    constructor() {
        this.clients = new Map(); // connectionId -> Client
        this.connectionStates = new Map(); // connectionId -> state info
        this.reconnectTimers = new Map(); // connectionId -> timer
        this.healthCheckInterval = null;
        this.sessionDir = path.join(process.cwd(), 'sessions');

        this.init();
    }

    async init() {
        try {
            // Ensure sessions directory exists
            await this.ensureSessionDirectory();

            // Start health check
            this.startHealthCheck();

            // Restore active connections
            await this.restoreActiveConnections();

            logInfo('WhatsApp service initialized successfully');
        } catch (error) {
            logError('Failed to initialize WhatsApp service', error);
        }
    }

    async ensureSessionDirectory() {
        try {
            await fs.access(this.sessionDir);
        } catch {
            await fs.mkdir(this.sessionDir, { recursive: true });
            logInfo('Created WhatsApp sessions directory', { path: this.sessionDir });
        }
    }

    async createConnection(userId, connectionId, options = {}) {
        try {
            // Check if MongoDB and model are available
            const mongoose = require('mongoose');
            if (mongoose.connection.readyState !== 1 || !WhatsAppConnection) {
                throw new Error('Database or WhatsApp model not available - cannot create WhatsApp connection');
            }

            // Check if connection already exists
            const existingConnection = await WhatsAppConnection.findOne({ connectionId });
            if (existingConnection) {
                throw new Error(`Connection with ID ${connectionId} already exists`);
            }

            // Create connection record
            const connection = new WhatsAppConnection({
                userId,
                connectionId,
                name: options.name || `Connection ${connectionId}`,
                phoneNumber: options.phoneNumber,
                settings: {
                    ...options.settings,
                    autoReconnect: options.autoReconnect !== false,
                    maxReconnectAttempts: options.maxReconnectAttempts || 5,
                    reconnectInterval: options.reconnectInterval || 30000,
                    messageRetryAttempts: options.messageRetryAttempts || 3,
                    messageRetryDelay: options.messageRetryDelay || 5000
                }
            });

            await connection.save();

            // Create WhatsApp client
            const client = await this.createClient(connectionId, connection.settings);

            // Store client and connection state
            this.clients.set(connectionId, client);
            this.connectionStates.set(connectionId, {
                connection,
                reconnectAttempts: 0,
                lastReconnectAttempt: null,
                isConnecting: false
            });

            logInfo('WhatsApp connection created', {
                connectionId,
                userId,
                name: connection.name
            });

            return connection;
        } catch (error) {
            logError('Failed to create WhatsApp connection', error, {
                connectionId,
                userId
            });
            throw error;
        }
    }

    async createClient(connectionId, settings) {
        const sessionPath = path.join(this.sessionDir, connectionId);

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: connectionId,
                dataPath: sessionPath
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            },
            webVersion: '2.2402.5',
            webVersionCache: {
                type: 'local'
            }
        });

        // Set up event handlers
        this.setupClientEvents(client, connectionId, settings);

        return client;
    }

    setupClientEvents(client, connectionId, settings) {
        const connectionState = this.connectionStates.get(connectionId);
        if (!connectionState) return;

        client.on('qr', async (qr) => {
            try {
                const qrDataUrl = await qrcode.toDataURL(qr);
                await connectionState.connection.updateStatus('connecting');

                // Store QR code with expiration
                connectionState.connection.qrCode = qrDataUrl;
                connectionState.connection.qrCodeExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
                await connectionState.connection.save();

                logInfo('QR code generated for WhatsApp connection', {
                    connectionId,
                    qrExpiresAt: connectionState.connection.qrCodeExpiresAt
                });
            } catch (error) {
                logError('Failed to generate QR code', error, { connectionId });
            }
        });

        client.on('ready', async () => {
            try {
                await connectionState.connection.updateStatus('authenticated');

                // Clear QR code
                connectionState.connection.qrCode = null;
                connectionState.connection.qrCodeExpiresAt = null;
                await connectionState.connection.save();

                // Reset reconnect attempts
                connectionState.reconnectAttempts = 0;
                connectionState.lastReconnectAttempt = null;

                logInfo('WhatsApp client ready', {
                    connectionId,
                    phoneNumber: client.info?.wid?.user
                });
            } catch (error) {
                logError('Failed to update connection status to ready', error, { connectionId });
            }
        });

        client.on('authenticated', async () => {
            try {
                await connectionState.connection.updateStatus('authenticated');
                logInfo('WhatsApp client authenticated', { connectionId });
            } catch (error) {
                logError('Failed to update connection status to authenticated', error, { connectionId });
            }
        });

        client.on('auth_failure', async (msg) => {
            try {
                await connectionState.connection.updateStatus('error', `Authentication failed: ${msg}`);
                logError('WhatsApp authentication failed', { connectionId, error: msg });
            } catch (error) {
                logError('Failed to update connection status after auth failure', error, { connectionId });
            }
        });

        client.on('disconnected', async (reason) => {
            try {
                await connectionState.connection.updateStatus('disconnected', `Disconnected: ${reason}`);

                if (settings.autoReconnect && connectionState.reconnectAttempts < settings.maxReconnectAttempts) {
                    await this.scheduleReconnect(connectionId, settings);
                }

                logWarning('WhatsApp client disconnected', {
                    connectionId,
                    reason,
                    reconnectAttempts: connectionState.reconnectAttempts
                });
            } catch (error) {
                logError('Failed to handle disconnection', error, { connectionId });
            }
        });

        client.on('message', async (message) => {
            try {
                await connectionState.connection.incrementMessageCount('received');

                if (settings.enableLogging) {
                    logInfo('WhatsApp message received', {
                        connectionId,
                        from: message.from,
                        type: message.type,
                        hasMedia: message.hasMedia,
                        timestamp: message.timestamp
                    });
                }
            } catch (error) {
                logError('Failed to handle incoming message', error, { connectionId });
            }
        });

        client.on('message_ack', async (msg, ack) => {
            try {
                if (ack === 2) { // Message delivered
                    await connectionState.connection.incrementMessageCount('delivered');
                }

                if (settings.enableLogging) {
                    logDebug('WhatsApp message acknowledgment', {
                        connectionId,
                        messageId: msg.id._serialized,
                        ack,
                        from: msg.from
                    });
                }
            } catch (error) {
                logError('Failed to handle message acknowledgment', error, { connectionId });
            }
        });
    }

    async scheduleReconnect(connectionId, settings) {
        const connectionState = this.connectionStates.get(connectionId);
        if (!connectionState) return;

        connectionState.reconnectAttempts++;
        connectionState.lastReconnectAttempt = new Date();
        connectionState.isConnecting = true;

        // Clear existing timer
        if (this.reconnectTimers.has(connectionId)) {
            clearTimeout(this.reconnectTimers.get(connectionId));
        }

        // Schedule reconnect with exponential backoff
        const delay = Math.min(
            settings.reconnectInterval * Math.pow(2, connectionState.reconnectAttempts - 1),
            300000 // Max 5 minutes
        );

        const timer = setTimeout(async () => {
            try {
                await this.reconnect(connectionId);
            } catch (error) {
                logError('Failed to reconnect WhatsApp client', error, { connectionId });
            }
        }, delay);

        this.reconnectTimers.set(connectionId, timer);

        logInfo('Scheduled WhatsApp reconnection', {
            connectionId,
            attempt: connectionState.reconnectAttempts,
            delay,
            maxAttempts: settings.maxReconnectAttempts
        });
    }

    async reconnect(connectionId) {
        const connectionState = this.connectionStates.get(connectionId);
        if (!connectionState) return;

        try {
            const client = this.clients.get(connectionId);
            if (!client) return;

            await connectionState.connection.updateStatus('connecting');
            await client.initialize();

            logInfo('WhatsApp reconnection successful', {
                connectionId,
                attempt: connectionState.reconnectAttempts
            });
        } catch (error) {
            logError('WhatsApp reconnection failed', error, { connectionId });

            if (connectionState.reconnectAttempts < connectionState.connection.settings.maxReconnectAttempts) {
                await this.scheduleReconnect(connectionId, connectionState.connection.settings);
            } else {
                await connectionState.connection.updateStatus('error', 'Max reconnection attempts exceeded');
                logError('Max reconnection attempts exceeded', { connectionId });
            }
        } finally {
            connectionState.isConnecting = false;
        }
    }

    async sendMessage(connectionId, to, message, options = {}) {
        try {
            const client = this.clients.get(connectionId);
            const connectionState = this.connectionStates.get(connectionId);

            if (!client || !connectionState) {
                throw new Error(`Connection ${connectionId} not found`);
            }

            if (!connectionState.connection.canSendMessages) {
                throw new Error(`Connection ${connectionId} is not ready to send messages`);
            }

            // Format phone number
            const formattedNumber = this.formatPhoneNumber(to);

            // Send message with retry logic
            const result = await this.sendMessageWithRetry(
                client,
                formattedNumber,
                message,
                connectionState.connection.settings,
                options
            );

            // Update stats
            await connectionState.connection.incrementMessageCount('sent');

            logInfo('WhatsApp message sent successfully', {
                connectionId,
                to: formattedNumber,
                messageId: result.id._serialized,
                type: result.type
            });

            return {
                success: true,
                messageId: result.id._serialized,
                timestamp: result.timestamp,
                connectionId
            };
        } catch (error) {
            logError('Failed to send WhatsApp message', error, {
                connectionId,
                to,
                message: typeof message === 'string' ? message.substring(0, 100) : 'Media message'
            });

            // Update error stats
            const connectionState = this.connectionStates.get(connectionId);
            if (connectionState) {
                await connectionState.connection.incrementMessageCount('failed');
            }

            throw error;
        }
    }

    async sendMessageWithRetry(client, to, message, settings, options = {}) {
        let lastError;

        for (let attempt = 1; attempt <= settings.messageRetryAttempts; attempt++) {
            try {
                let result;

                if (typeof message === 'string') {
                    result = await client.sendMessage(to, message, options);
                } else if (message.media) {
                    const media = MessageMedia.fromFilePath(message.media.path);
                    result = await client.sendMessage(to, media, {
                        caption: message.caption,
                        ...options
                    });
                } else {
                    throw new Error('Invalid message format');
                }

                return result;
            } catch (error) {
                lastError = error;

                if (attempt < settings.messageRetryAttempts) {
                    logWarning('Message send attempt failed, retrying', {
                        attempt,
                        maxAttempts: settings.messageRetryAttempts,
                        error: error.message,
                        delay: settings.messageRetryDelay
                    });

                    await this.sleep(settings.messageRetryDelay);
                }
            }
        }

        throw lastError;
    }

    formatPhoneNumber(phoneNumber) {
        // Remove all non-digit characters
        let cleaned = phoneNumber.replace(/\D/g, '');

        // Add country code if not present
        if (!cleaned.startsWith('972')) {
            cleaned = '972' + cleaned;
        }

        // Add @c.us suffix for WhatsApp
        return cleaned + '@c.us';
    }

    async getConnectionStatus(connectionId) {
        try {
            if (!WhatsAppConnection) {
                throw new Error('WhatsApp model not available');
            }

            const connection = await WhatsAppConnection.findOne({ connectionId });
            if (!connection) {
                throw new Error(`Connection ${connectionId} not found`);
            }

            const client = this.clients.get(connectionId);
            const connectionState = this.connectionStates.get(connectionId);

            const status = {
                connectionId,
                userId: connection.userId,
                name: connection.name,
                status: connection.status,
                isActive: connection.isActive,
                isDefault: connection.isDefault,
                canSendMessages: connection.canSendMessages,
                lastHeartbeat: connection.lastHeartbeat,
                lastMessageSent: connection.lastMessageSent,
                lastMessageReceived: connection.lastMessageReceived,
                stats: connection.stats,
                settings: connection.settings,
                health: connection.getHealthStatus()
            };

            if (client && connectionState) {
                status.clientInfo = {
                    isConnected: client.pupPage ? true : false,
                    reconnectAttempts: connectionState.reconnectAttempts,
                    lastReconnectAttempt: connectionState.lastReconnectAttempt,
                    isConnecting: connectionState.isConnecting
                };
            }

            return status;
        } catch (error) {
            logError('Failed to get connection status', error, { connectionId });
            throw error;
        }
    }

    async getQRCode(connectionId) {
        try {
            if (!WhatsAppConnection) {
                throw new Error('WhatsApp model not available');
            }

            const connection = await WhatsAppConnection.findOne({ connectionId });
            if (!connection) {
                throw new Error(`Connection ${connectionId} not found`);
            }

            if (!connection.qrCode || connection.qrCodeExpiresAt < new Date()) {
                throw new Error('QR code not available or expired');
            }

            return {
                qrCode: connection.qrCode,
                expiresAt: connection.qrCodeExpiresAt,
                connectionId
            };
        } catch (error) {
            logError('Failed to get QR code', error, { connectionId });
            throw error;
        }
    }

    async disconnect(connectionId) {
        try {
            const client = this.clients.get(connectionId);
            const connectionState = this.connectionStates.get(connectionId);

            if (client) {
                await client.destroy();
                this.clients.delete(connectionId);
            }

            if (connectionState) {
                // Clear reconnect timer
                if (this.reconnectTimers.has(connectionId)) {
                    clearTimeout(this.reconnectTimers.get(connectionId));
                    this.reconnectTimers.delete(connectionId);
                }

                await connectionState.connection.updateStatus('disconnected');
                this.connectionStates.delete(connectionId);
            }

            logInfo('WhatsApp connection disconnected', { connectionId });
        } catch (error) {
            logError('Failed to disconnect WhatsApp connection', error, { connectionId });
            throw error;
        }
    }

    async deleteConnection(connectionId) {
        try {
            await this.disconnect(connectionId);

            if (WhatsAppConnection) {
                const connection = await WhatsAppConnection.findOne({ connectionId });
                if (connection) {
                    connection.isActive = false;
                    await connection.save();
                }
            }

            logInfo('WhatsApp connection deleted', { connectionId });
        } catch (error) {
            logError('Failed to delete WhatsApp connection', error, { connectionId });
            throw error;
        }
    }

    async restoreActiveConnections() {
        try {
            // Check if MongoDB is available
            const mongoose = require('mongoose');
            if (mongoose.connection.readyState !== 1) {
                logInfo('Skipping WhatsApp connections restore - MongoDB not available');
                return;
            }

            // Only try to restore if models are available
            if (typeof WhatsAppConnection === 'undefined') {
                logInfo('WhatsApp model not available, skipping restore');
                return;
            }

            const activeConnections = await WhatsAppConnection.find({
                isActive: true,
                status: { $in: ['connected', 'authenticated'] }
            });

            logInfo('Restoring active WhatsApp connections', {
                count: activeConnections.length
            });

            for (const connection of activeConnections) {
                try {
                    await this.createConnection(
                        connection.userId,
                        connection.connectionId,
                        {
                            name: connection.name,
                            phoneNumber: connection.phoneNumber,
                            settings: connection.settings
                        }
                    );
                } catch (error) {
                    logError('Failed to restore connection', error, {
                        connectionId: connection.connectionId
                    });
                }
            }
        } catch (error) {
            logInfo('Cannot restore active connections - running in fallback mode', {
                reason: error.message
            });
        }
    }

    startHealthCheck() {
        this.healthCheckInterval = setInterval(async () => {
            try {
                await this.performHealthCheck();
            } catch (error) {
                logError('Health check failed', error);
            }
        }, 60000); // Every minute
    }

    async performHealthCheck() {
        const connections = Array.from(this.connectionStates.values());

        for (const connectionState of connections) {
            try {
                const health = connectionState.connection.getHealthStatus();

                if (!health.isHealthy && connectionState.connection.settings.autoReconnect) {
                    logWarning('Unhealthy connection detected, attempting reconnect', {
                        connectionId: connectionState.connection.connectionId,
                        heartbeatAge: health.heartbeatAge
                    });

                    await this.scheduleReconnect(
                        connectionState.connection.connectionId,
                        connectionState.connection.settings
                    );
                }
            } catch (error) {
                logError('Failed to perform health check for connection', error, {
                    connectionId: connectionState.connection.connectionId
                });
            }
        }
    }

    async getServiceStats() {
        try {
            let stats = {};
            if (WhatsAppConnection) {
                stats = await WhatsAppConnection.getConnectionStats();
            }
            
            const activeConnections = this.clients.size;

            return {
                ...stats,
                activeConnections,
                totalConnections: this.connectionStates.size
            };
        } catch (error) {
            logError('Failed to get service stats', error);
            return {
                activeConnections: this.clients.size,
                totalConnections: this.connectionStates.size
            };
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async cleanup() {
        try {
            // Stop health check
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
            }

            // Clear all reconnect timers
            for (const timer of this.reconnectTimers.values()) {
                clearTimeout(timer);
            }

            // Disconnect all clients
            const disconnectPromises = Array.from(this.clients.keys()).map(connectionId =>
                this.disconnect(connectionId).catch(error =>
                    logError('Failed to disconnect during cleanup', error, { connectionId })
                )
            );

            await Promise.all(disconnectPromises);

            logInfo('WhatsApp service cleanup completed');
        } catch (error) {
            logError('Failed to cleanup WhatsApp service', error);
        }
    }
}

// Create singleton instance
const whatsAppService = new WhatsAppService();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logInfo('Received SIGTERM, cleaning up WhatsApp service');
    await whatsAppService.cleanup();
});

process.on('SIGINT', async () => {
    logInfo('Received SIGINT, cleaning up WhatsApp service');
    await whatsAppService.cleanup();
});

module.exports = whatsAppService;