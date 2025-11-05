const EmailProvider = require('../EmailProvider');
const { logInfo, logError } = require('../../utils/logger');

/**
 * SendGrid Email Provider
 * מתאים לשליחת מיילים בקנה מידה גדול
 */
class SendGridProvider extends EmailProvider {
    constructor(config = {}) {
        super(config);
        this.name = 'SendGrid';
        this.apiKey = config.apiKey || process.env.SENDGRID_API_KEY;
        this.defaultFrom = config.defaultFrom || process.env.EMAIL_FROM || 'noreply@chatgrow.com';
        this.client = null;
    }

    /**
     * Initialize SendGrid client
     */
    async initialize() {
        try {
            if (!this.apiKey) {
                throw new Error('SendGrid API key is required');
            }

            const sgMail = require('@sendgrid/mail');
            sgMail.setApiKey(this.apiKey);
            this.client = sgMail;

            logInfo('SendGrid provider initialized');
        } catch (error) {
            logError('Failed to initialize SendGrid', error);
            throw error;
        }
    }

    /**
     * Send email via SendGrid
     */
    async send({ to, subject, html, text, from }) {
        try {
            if (!this.client) {
                await this.initialize();
            }

            const msg = {
                to,
                from: from || this.defaultFrom,
                subject,
                html,
                text: text || html.replace(/<[^>]*>/g, '')
            };

            const result = await this.client.send(msg);

            logInfo('Email sent successfully via SendGrid', {
                to,
                subject,
                statusCode: result[0].statusCode
            });

            return {
                success: true,
                provider: this.name,
                messageId: result[0].headers['x-message-id'],
                to
            };

        } catch (error) {
            logError('Failed to send email via SendGrid', error, { to, subject });
            return {
                success: false,
                provider: this.name,
                error: error.message,
                to
            };
        }
    }

    /**
     * Verify SendGrid API key
     */
    async verify() {
        try {
            if (!this.apiKey) {
                return false;
            }
            
            if (!this.client) {
                await this.initialize();
            }

            logInfo('SendGrid configuration verified successfully');
            return true;
        } catch (error) {
            logError('SendGrid verification failed', error);
            return false;
        }
    }
}

module.exports = SendGridProvider;
