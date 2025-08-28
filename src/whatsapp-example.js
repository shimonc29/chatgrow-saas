const whatsAppService = require('./services/whatsappService');
const WhatsAppConnection = require('./models/WhatsAppConnection');
const { logInfo, logError } = require('./utils/logger');

/**
 * Comprehensive WhatsApp Integration Example
 * This file demonstrates how to use the WhatsApp integration system
 */

async function runWhatsAppDemonstration() {
    try {
        logInfo('Starting WhatsApp integration demonstration');

        // Example user ID (in real app, this would come from authentication)
        const userId = '507f1f77bcf86cd799439011';

        // 1. Create a new WhatsApp connection
        console.log('\n=== 1. Creating WhatsApp Connection ===');
        const connectionId = 'conn_' + Date.now();
        
        const connection = await whatsAppService.createConnection(userId, connectionId, {
            name: 'My Business WhatsApp',
            phoneNumber: '+972501234567',
            settings: {
                autoReconnect: true,
                maxReconnectAttempts: 5,
                reconnectInterval: 30000,
                messageRetryAttempts: 3,
                messageRetryDelay: 5000,
                enableLogging: true,
                enableNotifications: true
            }
        });

        console.log('✅ Connection created:', {
            connectionId: connection.connectionId,
            name: connection.name,
            status: connection.status
        });

        // 2. Get QR code for authentication
        console.log('\n=== 2. Getting QR Code ===');
        try {
            const qrData = await whatsAppService.getQRCode(connectionId);
            console.log('✅ QR Code generated:', {
                expiresAt: qrData.expiresAt,
                connectionId: qrData.connectionId
            });
            console.log('📱 Scan this QR code with WhatsApp to authenticate');
        } catch (error) {
            console.log('⚠️ QR code not available yet (normal during initial setup)');
        }

        // 3. Check connection status
        console.log('\n=== 3. Checking Connection Status ===');
        const status = await whatsAppService.getConnectionStatus(connectionId);
        console.log('✅ Connection status:', {
            status: status.status,
            isConnected: status.isConnected,
            canSendMessages: status.canSendMessages,
            lastHeartbeat: status.lastHeartbeat
        });

        // 4. Send a test message (if connection is ready)
        if (status.canSendMessages) {
            console.log('\n=== 4. Sending Test Message ===');
            try {
                const result = await whatsAppService.sendMessage(
                    connectionId,
                    '+972501234567',
                    'Hello from ChatGrow! This is a test message.',
                    { priority: 'normal' }
                );

                console.log('✅ Message sent successfully:', {
                    messageId: result.messageId,
                    timestamp: result.timestamp,
                    connectionId: result.connectionId
                });
            } catch (error) {
                console.log('❌ Failed to send message:', error.message);
            }
        } else {
            console.log('⚠️ Connection not ready for sending messages');
        }

        // 5. Get user connections
        console.log('\n=== 5. Getting User Connections ===');
        const userConnections = await WhatsAppConnection.findByUserId(userId);
        console.log('✅ User connections:', userConnections.map(conn => ({
            connectionId: conn.connectionId,
            name: conn.name,
            status: conn.status,
            isDefault: conn.isDefault
        })));

        // 6. Set connection as default
        console.log('\n=== 6. Setting as Default Connection ===');
        await connection.setAsDefault();
        console.log('✅ Connection set as default');

        // 7. Get service statistics
        console.log('\n=== 7. Getting Service Statistics ===');
        const stats = await whatsAppService.getServiceStats();
        console.log('✅ Service stats:', {
            activeConnections: stats.activeConnections,
            totalConnections: stats.totalConnections,
            totalMessagesSent: stats.totalMessagesSent,
            totalMessagesReceived: stats.totalMessagesReceived
        });

        // 8. Demonstrate bulk messaging (Premium/Enterprise feature)
        console.log('\n=== 8. Bulk Messaging Example ===');
        const bulkMessages = [
            { to: '+972501234567', content: 'Bulk message 1' },
            { to: '+972501234568', content: 'Bulk message 2' },
            { to: '+972501234569', content: 'Bulk message 3' }
        ];

        console.log('📤 Bulk messaging would send to:', bulkMessages.length, 'recipients');
        console.log('💡 This feature requires Premium or Enterprise plan');

        // 9. Demonstrate connection management
        console.log('\n=== 9. Connection Management ===');
        
        // Update connection settings
        await connection.updateStatus('connected');
        console.log('✅ Connection status updated');

        // Get health status
        const health = connection.getHealthStatus();
        console.log('✅ Health status:', {
            isHealthy: health.isHealthy,
            heartbeatAge: health.heartbeatAge,
            canSendMessages: health.canSendMessages
        });

        // 10. Demonstrate error handling
        console.log('\n=== 10. Error Handling Example ===');
        try {
            // Try to send to invalid number
            await whatsAppService.sendMessage(
                connectionId,
                'invalid_number',
                'This should fail'
            );
        } catch (error) {
            console.log('✅ Error properly handled:', error.message);
        }

        // 11. Demonstrate webhook handling
        console.log('\n=== 11. Webhook Handling ===');
        console.log('📡 Webhook endpoint: POST /api/whatsapp/webhook/:connectionId');
        console.log('💡 Configure this URL in your WhatsApp Business API settings');

        // 12. Cleanup demonstration
        console.log('\n=== 12. Cleanup ===');
        console.log('🧹 In production, you would:');
        console.log('   - Keep connections active for ongoing messaging');
        console.log('   - Monitor connection health');
        console.log('   - Handle reconnections automatically');
        console.log('   - Log all activities for audit');

        logInfo('WhatsApp integration demonstration completed successfully');

    } catch (error) {
        logError('WhatsApp demonstration failed', error);
        console.error('❌ Demonstration failed:', error.message);
    }
}

// Example API usage functions
async function exampleApiUsage() {
    console.log('\n=== API Usage Examples ===');

    // 1. Create connection via API
    console.log('\n1. Create Connection:');
    console.log('POST /api/whatsapp/connections');
    console.log(JSON.stringify({
        connectionId: 'my_connection_123',
        name: 'Business WhatsApp',
        phoneNumber: '+972501234567',
        settings: {
            autoReconnect: true,
            maxReconnectAttempts: 5
        }
    }, null, 2));

    // 2. Get QR code via API
    console.log('\n2. Get QR Code:');
    console.log('GET /api/whatsapp/connections/my_connection_123/qr');
    console.log('Response: { qrCode: "data:image/png;base64,...", expiresAt: "..." }');

    // 3. Send message via API
    console.log('\n3. Send Message:');
    console.log('POST /api/whatsapp/connections/my_connection_123/send');
    console.log(JSON.stringify({
        to: '+972501234567',
        message: 'Hello from ChatGrow!',
        options: {
            priority: 'normal'
        }
    }, null, 2));

    // 4. Bulk messaging via API
    console.log('\n4. Bulk Messaging (Premium/Enterprise):');
    console.log('POST /api/whatsapp/bulk/send');
    console.log(JSON.stringify({
        connectionId: 'my_connection_123',
        messages: [
            { to: '+972501234567', content: 'Bulk message 1' },
            { to: '+972501234568', content: 'Bulk message 2' }
        ],
        options: {
            priority: 'low'
        }
    }, null, 2));

    // 5. Get connection status via API
    console.log('\n5. Get Connection Status:');
    console.log('GET /api/whatsapp/connections/my_connection_123');
    console.log('Response includes: status, health, stats, settings');

    // 6. Get service statistics via API
    console.log('\n6. Get Service Statistics:');
    console.log('GET /api/whatsapp/stats');
    console.log('Response includes: user stats, global stats (admin only)');

    // 7. Health check via API
    console.log('\n7. Health Check:');
    console.log('GET /api/whatsapp/health');
    console.log('Response: { status: "healthy", stats: {...} }');
}

// Example webhook handling
function exampleWebhookHandler() {
    console.log('\n=== Webhook Handler Example ===');
    console.log('POST /api/whatsapp/webhook/:connectionId');
    console.log(JSON.stringify({
        message: 'Hello from customer',
        sender: '+972501234567',
        timestamp: new Date().toISOString(),
        type: 'text'
    }, null, 2));
}

// Example error handling
function exampleErrorHandling() {
    console.log('\n=== Error Handling Examples ===');
    
    const errorExamples = [
        {
            error: 'Connection not found',
            solution: 'Verify connectionId exists and belongs to user'
        },
        {
            error: 'Connection not ready',
            solution: 'Wait for authentication or check connection status'
        },
        {
            error: 'Invalid phone number',
            solution: 'Use international format: +972501234567'
        },
        {
            error: 'Rate limit exceeded',
            solution: 'Implement delays between messages'
        },
        {
            error: 'Daily message limit exceeded',
            solution: 'Upgrade plan or wait for daily reset'
        }
    ];

    errorExamples.forEach(({ error, solution }) => {
        console.log(`❌ ${error}`);
        console.log(`💡 Solution: ${solution}\n`);
    });
}

// Example monitoring and logging
function exampleMonitoring() {
    console.log('\n=== Monitoring and Logging ===');
    
    console.log('📊 Key metrics to monitor:');
    console.log('   - Connection health and uptime');
    console.log('   - Message delivery rates');
    console.log('   - Error rates and types');
    console.log('   - Rate limit usage');
    console.log('   - Queue processing times');
    
    console.log('\n📝 Log files to check:');
    console.log('   - logs/error.log - Error messages');
    console.log('   - logs/whatsapp.log - WhatsApp specific events');
    console.log('   - logs/api.log - API request logs');
    
    console.log('\n🔍 Health check endpoints:');
    console.log('   - GET /health - Overall system health');
    console.log('   - GET /api/whatsapp/health - WhatsApp service health');
    console.log('   - GET /api/logs/health - Logging system health');
}

// Run the demonstration
if (require.main === module) {
    console.log('🚀 ChatGrow WhatsApp Integration Examples');
    console.log('==========================================\n');

    // Run the main demonstration
    runWhatsAppDemonstration()
        .then(() => {
            console.log('\n✅ All examples completed successfully!');
        })
        .catch((error) => {
            console.error('\n❌ Examples failed:', error.message);
        })
        .finally(() => {
            // Show additional examples
            exampleApiUsage();
            exampleWebhookHandler();
            exampleErrorHandling();
            exampleMonitoring();
            
            console.log('\n🎉 WhatsApp integration examples completed!');
            console.log('📚 Check the documentation for more details');
        });
}

module.exports = {
    runWhatsAppDemonstration,
    exampleApiUsage,
    exampleWebhookHandler,
    exampleErrorHandling,
    exampleMonitoring
}; 