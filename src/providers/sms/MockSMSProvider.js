const SMSProvider = require('../SMSProvider');
const { logInfo } = require('../../utils/logger');

/**
 * Mock SMS Provider for Development/Testing
 * מדמה שליחת SMS ללא שליחה ממשית
 */
class MockSMSProvider extends SMSProvider {
    constructor(config = {}) {
        super(config);
        this.name = 'MockSMS';
        this.sentMessages = [];
    }

    /**
     * Simulate sending SMS
     */
    async send({ to, message, from }) {
        const formattedTo = this.formatPhoneNumber(to);
        const messageId = `mock_sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const result = {
            messageId,
            to: formattedTo,
            from: from || '+972501234567',
            message,
            timestamp: new Date().toISOString()
        };

        this.sentMessages.push(result);

        logInfo('📱 MOCK SMS SENT (not really)', {
            to: formattedTo,
            message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
            messageId
        });

        console.log('\n=== MOCK SMS ===');
        console.log(`To: ${formattedTo}`);
        console.log(`From: ${result.from}`);
        console.log(`Message: ${message}`);
        console.log('================\n');

        return {
            success: true,
            provider: this.name,
            messageId,
            to: formattedTo
        };
    }

    /**
     * Mock verification always succeeds
     */
    async verify() {
        logInfo('Mock SMS provider verified (always true in development)');
        return true;
    }

    /**
     * Get all sent messages (for testing)
     */
    getSentMessages() {
        return this.sentMessages;
    }

    /**
     * Clear sent messages (for testing)
     */
    clearSentMessages() {
        this.sentMessages = [];
    }
}

module.exports = MockSMSProvider;
