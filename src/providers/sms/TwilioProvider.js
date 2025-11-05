const SMSProvider = require('../SMSProvider');
const { logInfo, logError } = require('../../utils/logger');

/**
 * Twilio SMS Provider
 * ספק SMS בינלאומי פופולרי
 */
class TwilioProvider extends SMSProvider {
    constructor(config = {}) {
        super(config);
        this.name = 'Twilio';
        this.accountSid = config.accountSid || process.env.TWILIO_ACCOUNT_SID;
        this.authToken = config.authToken || process.env.TWILIO_AUTH_TOKEN;
        this.fromNumber = config.fromNumber || process.env.TWILIO_PHONE_NUMBER;
        this.client = null;
    }

    /**
     * Initialize Twilio client
     */
    async initialize() {
        try {
            if (!this.accountSid || !this.authToken) {
                throw new Error('Twilio Account SID and Auth Token are required');
            }

            const twilio = require('twilio');
            this.client = twilio(this.accountSid, this.authToken);

            logInfo('Twilio provider initialized');
        } catch (error) {
            logError('Failed to initialize Twilio', error);
            throw error;
        }
    }

    /**
     * Send SMS via Twilio
     */
    async send({ to, message, from }) {
        try {
            if (!this.client) {
                await this.initialize();
            }

            // Format phone number to E.164
            const formattedTo = this.formatPhoneNumber(to);
            const formattedFrom = from || this.fromNumber;

            if (!formattedFrom) {
                throw new Error('Twilio from number is required');
            }

            const result = await this.client.messages.create({
                body: message,
                from: formattedFrom,
                to: formattedTo
            });

            logInfo('SMS sent successfully via Twilio', {
                to: formattedTo,
                messageSid: result.sid,
                status: result.status
            });

            return {
                success: true,
                provider: this.name,
                messageId: result.sid,
                to: formattedTo,
                status: result.status
            };

        } catch (error) {
            logError('Failed to send SMS via Twilio', error, { to, message: message.substring(0, 50) });
            return {
                success: false,
                provider: this.name,
                error: error.message,
                to
            };
        }
    }

    /**
     * Verify Twilio credentials
     */
    async verify() {
        try {
            if (!this.accountSid || !this.authToken) {
                return false;
            }

            if (!this.client) {
                await this.initialize();
            }

            // Test API connection by fetching account details
            await this.client.api.accounts(this.accountSid).fetch();

            logInfo('Twilio configuration verified successfully');
            return true;
        } catch (error) {
            logError('Twilio verification failed', error);
            return false;
        }
    }
}

module.exports = TwilioProvider;
