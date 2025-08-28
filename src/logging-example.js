const LogService = require('./services/logService');
const { 
    logInfo, 
    logError, 
    logWarning, 
    logDebug,
    logWhatsAppMessage,
    logWhatsAppError,
    logQueueJob,
    logQueueError,
    logRateLimit,
    logApiRequest,
    logDatabaseOperation
} = require('./utils/logger');

// Initialize log service
const logService = new LogService();

/**
 * Example usage of the comprehensive logging system
 */
async function demonstrateLogging() {
    console.log('🚀 Starting Logging System Demonstration...\n');

    try {
        // 1. Basic logging examples
        console.log('1. Basic Logging Examples:');
        logInfo('Application started successfully', { version: '1.0.0', environment: 'development' });
        logDebug('Debug information', { userId: '123', action: 'login' });
        logWarning('Rate limit approaching', { connectionId: 'conn_123', messageCount: 45 });
        logError('Database connection failed', new Error('Connection timeout'), { retryAttempt: 3 });

        // 2. WhatsApp specific logging
        console.log('\n2. WhatsApp Message Logging:');
        logWhatsAppMessage('conn_123', 'msg_456', '+972501234567', 'sent', {
            messageType: 'text',
            contentLength: 150
        });

        logWhatsAppError('conn_123', 'msg_789', '+972501234567', new Error('Invalid phone number'), {
            retryCount: 2
        });

        // 3. Queue logging
        console.log('\n3. Queue Job Logging:');
        logQueueJob('job_123', 'messageQueue', 'processing', {
            connectionId: 'conn_123',
            priority: 'high'
        });

        logQueueError('job_456', 'messageQueue', new Error('WhatsApp API error'), {
            connectionId: 'conn_123',
            retryAttempt: 1
        });

        // 4. Rate limiting logging
        console.log('\n4. Rate Limiting Logging:');
        logRateLimit('conn_123', 'message_sent', {
            currentCount: 50,
            limit: 60,
            timeWindow: '1 hour'
        });

        // 5. API request logging
        console.log('\n5. API Request Logging:');
        logApiRequest('POST', '/api/messages', 200, 150, {
            userId: '123',
            connectionId: 'conn_123'
        });

        logApiRequest('GET', '/api/logs/stats', 429, 50, {
            userId: '123',
            rateLimited: true
        });

        // 6. Database operation logging
        console.log('\n6. Database Operation Logging:');
        logDatabaseOperation('find', 'message_logs', 25, {
            query: { connectionId: 'conn_123' },
            resultCount: 50
        });

        console.log('\n✅ Basic logging examples completed!\n');

    } catch (error) {
        logError('Error in logging demonstration', error);
    }
}

/**
 * Example of logging message lifecycle
 */
async function demonstrateMessageLifecycle() {
    console.log('📨 Message Lifecycle Logging Example:');
    
    try {
        const messageData = {
            messageId: `msg_${Date.now()}`,
            connectionId: 'conn_123',
            recipient: '+972501234567',
            messageContent: 'Hello from ChatGrow!',
            messageType: 'text',
            userId: 'user_123',
            clientId: 'client_456'
        };

        // 1. Log message creation
        console.log('1. Creating message log...');
        const messageLog = await logService.logMessage(messageData);
        console.log(`   ✅ Message logged with ID: ${messageLog.messageId}`);

        // 2. Update status to sent
        console.log('2. Updating status to sent...');
        await logService.updateMessageStatus(messageLog.messageId, 'sent', {
            processingTime: 150,
            whatsappMessageId: 'wa_msg_123'
        });
        console.log('   ✅ Status updated to sent');

        // 3. Update status to delivered
        console.log('3. Updating status to delivered...');
        await logService.updateMessageStatus(messageLog.messageId, 'delivered', {
            deliveryTime: 2000
        });
        console.log('   ✅ Status updated to delivered');

        // 4. Update status to read
        console.log('4. Updating status to read...');
        await logService.updateMessageStatus(messageLog.messageId, 'read');
        console.log('   ✅ Status updated to read');

        console.log('\n✅ Message lifecycle logging completed!\n');

    } catch (error) {
        logError('Error in message lifecycle demonstration', error);
    }
}

/**
 * Example of retrieving message history and statistics
 */
async function demonstrateMessageRetrieval() {
    console.log('📊 Message Retrieval and Statistics Example:');
    
    try {
        // 1. Get message history
        console.log('1. Getting message history...');
        const history = await logService.getMessageHistory({
            connectionId: 'conn_123',
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });
        console.log(`   ✅ Retrieved ${history.messages.length} messages`);

        // 2. Get delivery statistics
        console.log('2. Getting delivery statistics...');
        const stats = await logService.getDeliveryStats({
            connectionId: 'conn_123',
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            endDate: new Date()
        });
        console.log(`   ✅ Success rate: ${stats.successRate}%`);
        console.log(`   ✅ Total messages: ${stats.totalMessages}`);

        // 3. Get connection-specific stats
        console.log('3. Getting connection statistics...');
        const connectionStats = await logService.getConnectionStats('conn_123', {
            startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            endDate: new Date()
        });
        console.log(`   ✅ Connection stats retrieved for: ${connectionStats.connectionId}`);

        // 4. Generate comprehensive report
        console.log('4. Generating comprehensive report...');
        const report = await logService.generateReport({
            connectionId: 'conn_123',
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
            includeDailyStats: true,
            includeFailedMessages: true
        });
        console.log(`   ✅ Report generated with ${report.recommendations.length} recommendations`);

        console.log('\n✅ Message retrieval and statistics completed!\n');

    } catch (error) {
        logError('Error in message retrieval demonstration', error);
    }
}

/**
 * Example of error handling and failed message analysis
 */
async function demonstrateErrorHandling() {
    console.log('⚠️ Error Handling and Failed Message Analysis:');
    
    try {
        // 1. Log a failed message
        console.log('1. Logging a failed message...');
        const failedMessageData = {
            messageId: `msg_failed_${Date.now()}`,
            connectionId: 'conn_123',
            recipient: '+972501234567',
            messageContent: 'This message will fail',
            messageType: 'text',
            status: 'failed'
        };

        const failedLog = await logService.logMessage(failedMessageData);
        await logService.updateMessageStatus(failedLog.messageId, 'failed', {
            error: {
                code: 'INVALID_PHONE',
                message: 'Invalid phone number format',
                details: { providedNumber: '+972501234567' }
            },
            retryCount: 3
        });
        console.log('   ✅ Failed message logged');

        // 2. Get failed messages
        console.log('2. Retrieving failed messages...');
        const failedMessages = await logService.getMessageHistory({
            status: 'failed',
            limit: 10,
            sortBy: 'failedAt',
            sortOrder: 'desc'
        });
        console.log(`   ✅ Retrieved ${failedMessages.messages.length} failed messages`);

        // 3. Analyze error patterns
        console.log('3. Analyzing error patterns...');
        const errorPatterns = failedMessages.messages.reduce((patterns, msg) => {
            const errorCode = msg.error?.code || 'UNKNOWN';
            patterns[errorCode] = (patterns[errorCode] || 0) + 1;
            return patterns;
        }, {});
        console.log('   ✅ Error patterns:', errorPatterns);

        console.log('\n✅ Error handling demonstration completed!\n');

    } catch (error) {
        logError('Error in error handling demonstration', error);
    }
}

/**
 * Example of log maintenance and cleanup
 */
async function demonstrateLogMaintenance() {
    console.log('🧹 Log Maintenance and Cleanup Example:');
    
    try {
        // 1. Clean old logs
        console.log('1. Cleaning old logs...');
        const cleanupResult = await logService.cleanOldLogs(90); // Keep logs for 90 days
        console.log(`   ✅ Cleaned ${cleanupResult.deletedCount} old log entries`);

        // 2. Health check
        console.log('2. Performing health check...');
        const MessageLog = require('./models/MessageLog');
        const totalMessages = await MessageLog.countDocuments();
        const recentMessages = await MessageLog.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        console.log(`   ✅ Total messages in database: ${totalMessages}`);
        console.log(`   ✅ Messages in last 24 hours: ${recentMessages}`);

        console.log('\n✅ Log maintenance demonstration completed!\n');

    } catch (error) {
        logError('Error in log maintenance demonstration', error);
    }
}

/**
 * Main demonstration function
 */
async function runLoggingDemonstration() {
    console.log('🎯 ChatGrow Logging System Demonstration\n');
    console.log('=' .repeat(50));

    try {
        await demonstrateLogging();
        await demonstrateMessageLifecycle();
        await demonstrateMessageRetrieval();
        await demonstrateErrorHandling();
        await demonstrateLogMaintenance();

        console.log('🎉 All logging demonstrations completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   ✅ Basic logging with different levels');
        console.log('   ✅ WhatsApp message lifecycle tracking');
        console.log('   ✅ Message history and statistics retrieval');
        console.log('   ✅ Error handling and failed message analysis');
        console.log('   ✅ Log maintenance and cleanup operations');
        console.log('\n🚀 The logging system is ready for production use!');

    } catch (error) {
        console.error('❌ Error in logging demonstration:', error.message);
        logError('Logging demonstration failed', error);
    }
}

// Export for use in other files
module.exports = {
    demonstrateLogging,
    demonstrateMessageLifecycle,
    demonstrateMessageRetrieval,
    demonstrateErrorHandling,
    demonstrateLogMaintenance,
    runLoggingDemonstration
};

// Run demonstration if this file is executed directly
if (require.main === module) {
    runLoggingDemonstration().catch(console.error);
} 