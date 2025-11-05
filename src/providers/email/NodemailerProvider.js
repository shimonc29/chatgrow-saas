const EmailProvider = require('../EmailProvider');
const { logInfo, logError } = require('../../utils/logger');

/**
 * Nodemailer Email Provider
 * חינמי, מתאים ל-SMTP או Gmail
 */
class NodemailerProvider extends EmailProvider {
    constructor(config = {}) {
        super(config);
        this.name = 'Nodemailer';
        this.transporter = null;
        this.defaultFrom = config.defaultFrom || process.env.EMAIL_FROM || 'noreply@chatgrow.com';
    }

    /**
     * Initialize Nodemailer transporter
     */
    async initialize() {
        try {
            const nodemailer = require('nodemailer');
            
            // Configure transporter based on config
            const transporterConfig = this.config.smtp ? {
                host: this.config.smtp.host,
                port: this.config.smtp.port || 587,
                secure: this.config.smtp.secure || false,
                auth: {
                    user: this.config.smtp.user,
                    pass: this.config.smtp.pass
                }
            } : {
                // Default: use Gmail (requires app password)
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_APP_PASSWORD
                }
            };

            this.transporter = nodemailer.createTransport(transporterConfig);
            
            logInfo('Nodemailer provider initialized', { service: transporterConfig.service || 'SMTP' });
        } catch (error) {
            logError('Failed to initialize Nodemailer', error);
            throw error;
        }
    }

    /**
     * Send email via Nodemailer
     */
    async send({ to, subject, html, text, from }) {
        try {
            if (!this.transporter) {
                await this.initialize();
            }

            const mailOptions = {
                from: from || this.defaultFrom,
                to,
                subject,
                html,
                text: text || html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
            };

            const result = await this.transporter.sendMail(mailOptions);

            logInfo('Email sent successfully via Nodemailer', {
                to,
                subject,
                messageId: result.messageId
            });

            return {
                success: true,
                provider: this.name,
                messageId: result.messageId,
                to
            };

        } catch (error) {
            logError('Failed to send email via Nodemailer', error, { to, subject });
            return {
                success: false,
                provider: this.name,
                error: error.message,
                to
            };
        }
    }

    /**
     * Verify Nodemailer configuration
     */
    async verify() {
        try {
            if (!this.transporter) {
                await this.initialize();
            }
            await this.transporter.verify();
            logInfo('Nodemailer configuration verified successfully');
            return true;
        } catch (error) {
            logError('Nodemailer verification failed', error);
            return false;
        }
    }
}

module.exports = NodemailerProvider;
