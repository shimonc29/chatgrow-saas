const { logInfo, logError, logWarning } = require('../utils/logger');

// Email Providers
const NodemailerProvider = require('../providers/email/NodemailerProvider');
const SendGridProvider = require('../providers/email/SendGridProvider');

// SMS Providers
const TwilioProvider = require('../providers/sms/TwilioProvider');
const MockSMSProvider = require('../providers/sms/MockSMSProvider');

/**
 * Notification Service
 * ניהול מרכזי של כל ההתראות (Email, SMS)
 * תומך בספקים מרובים עם fallback אוטומטי
 */
class NotificationService {
    constructor(config = {}) {
        this.config = config;
        this.emailProviders = [];
        this.smsProviders = [];
        this.initialized = false;
    }

    /**
     * Initialize notification service with configured providers
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            // Initialize Email Providers
            await this.initializeEmailProviders();
            
            // Initialize SMS Providers
            await this.initializeSMSProviders();

            this.initialized = true;
            logInfo('Notification Service initialized successfully', {
                emailProviders: this.emailProviders.map(p => p.getName()),
                smsProviders: this.smsProviders.map(p => p.getName())
            });

        } catch (error) {
            logError('Failed to initialize Notification Service', error);
            throw error;
        }
    }

    /**
     * Initialize email providers based on configuration
     */
    async initializeEmailProviders() {
        const emailConfig = this.config.email || {};

        // SendGrid (if configured)
        if (process.env.SENDGRID_API_KEY) {
            try {
                const sendgrid = new SendGridProvider({
                    apiKey: process.env.SENDGRID_API_KEY,
                    defaultFrom: emailConfig.defaultFrom
                });
                const verified = await sendgrid.verify();
                if (verified) {
                    this.emailProviders.push(sendgrid);
                    logInfo('SendGrid email provider added');
                }
            } catch (error) {
                logWarning('SendGrid provider initialization failed', { error: error.message });
            }
        }

        // Nodemailer (fallback or primary if no SendGrid)
        if (process.env.GMAIL_USER || emailConfig.smtp) {
            try {
                const nodemailer = new NodemailerProvider({
                    smtp: emailConfig.smtp,
                    defaultFrom: emailConfig.defaultFrom
                });
                const verified = await nodemailer.verify();
                if (verified) {
                    this.emailProviders.push(nodemailer);
                    logInfo('Nodemailer email provider added');
                }
            } catch (error) {
                logWarning('Nodemailer provider initialization failed', { error: error.message });
            }
        }

        if (this.emailProviders.length === 0) {
            logWarning('No email providers configured - email sending will fail');
        }
    }

    /**
     * Initialize SMS providers based on configuration
     */
    async initializeSMSProviders() {
        const smsConfig = this.config.sms || {};

        // Twilio (if configured)
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            try {
                const twilio = new TwilioProvider({
                    accountSid: process.env.TWILIO_ACCOUNT_SID,
                    authToken: process.env.TWILIO_AUTH_TOKEN,
                    fromNumber: process.env.TWILIO_PHONE_NUMBER
                });
                const verified = await twilio.verify();
                if (verified) {
                    this.smsProviders.push(twilio);
                    logInfo('Twilio SMS provider added');
                }
            } catch (error) {
                logWarning('Twilio provider initialization failed', { error: error.message });
            }
        }

        // Mock SMS for development (if no real provider)
        if (this.smsProviders.length === 0) {
            const mock = new MockSMSProvider();
            this.smsProviders.push(mock);
            logInfo('Mock SMS provider added (development mode)');
        }
    }

    /**
     * Send email notification
     * @param {Object} options - Email options
     * @param {string|string[]} options.to - Recipient email(s)
     * @param {string} options.subject - Email subject
     * @param {string} options.html - HTML content
     * @param {string} options.text - Plain text (optional)
     * @param {string} options.from - Sender email (optional)
     * @param {string} options.template - Template name (optional, for future use)
     * @returns {Promise<Object>} Send result
     */
    async sendEmail({ to, subject, html, text, from, template }) {
        if (!this.initialized) {
            await this.initialize();
        }

        if (this.emailProviders.length === 0) {
            const error = 'No email providers available';
            logError(error);
            return {
                success: false,
                error,
                provider: null
            };
        }

        // Convert to array if single email
        const recipients = Array.isArray(to) ? to : [to];

        // Try providers in order until one succeeds
        for (const provider of this.emailProviders) {
            try {
                const result = await provider.send({
                    to: recipients[0], // Send to first recipient (can be enhanced for bulk)
                    subject,
                    html,
                    text,
                    from
                });

                if (result.success) {
                    return result;
                }
            } catch (error) {
                logWarning(`Email provider ${provider.getName()} failed, trying next`, {
                    error: error.message
                });
            }
        }

        // All providers failed
        const error = 'All email providers failed';
        logError(error, null, { to, subject });
        return {
            success: false,
            error,
            provider: null
        };
    }

    /**
     * Send SMS notification
     * @param {Object} options - SMS options
     * @param {string|string[]} options.to - Recipient phone number(s)
     * @param {string} options.message - SMS message
     * @param {string} options.from - Sender number (optional)
     * @returns {Promise<Object>} Send result
     */
    async sendSMS({ to, message, from }) {
        if (!this.initialized) {
            await this.initialize();
        }

        if (this.smsProviders.length === 0) {
            const error = 'No SMS providers available';
            logError(error);
            return {
                success: false,
                error,
                provider: null
            };
        }

        // Convert to array if single phone
        const recipients = Array.isArray(to) ? to : [to];

        // Try providers in order until one succeeds
        for (const provider of this.smsProviders) {
            try {
                const result = await provider.send({
                    to: recipients[0], // Send to first recipient
                    message,
                    from
                });

                if (result.success) {
                    return result;
                }
            } catch (error) {
                logWarning(`SMS provider ${provider.getName()} failed, trying next`, {
                    error: error.message
                });
            }
        }

        // All providers failed
        const error = 'All SMS providers failed';
        logError(error, null, { to, message: message.substring(0, 50) });
        return {
            success: false,
            error,
            provider: null
        };
    }

    /**
     * Send notification via both Email and SMS
     * @param {Object} options
     * @param {string} options.email - Email address
     * @param {string} options.phone - Phone number
     * @param {string} options.subject - Email subject
     * @param {string} options.emailHtml - Email HTML content
     * @param {string} options.smsMessage - SMS text message
     * @returns {Promise<Object>} Combined results
     */
    async sendMultiChannel({ email, phone, subject, emailHtml, smsMessage }) {
        const results = {
            email: null,
            sms: null
        };

        // Send email if address provided
        if (email) {
            results.email = await this.sendEmail({
                to: email,
                subject,
                html: emailHtml
            });
        }

        // Send SMS if phone provided
        if (phone) {
            results.sms = await this.sendSMS({
                to: phone,
                message: smsMessage
            });
        }

        return {
            success: (results.email?.success || results.sms?.success),
            results
        };
    }

    /**
     * Send event confirmation notification
     * @param {Object} registration - Registration object
     * @param {Object} event - Event object
     */
    async sendEventConfirmation(registration, event) {
        const { participant } = registration;
        
        const emailHtml = `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">✅ אישור הרשמה לאירוע</h2>
                <p>שלום ${participant.firstName} ${participant.lastName},</p>
                <p>נרשמת בהצלחה לאירוע: <strong>${event.name}</strong></p>
                
                <div style="background: #f5f7fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">פרטי האירוע:</h3>
                    <p><strong>📅 תאריך:</strong> ${new Date(event.startDateTime).toLocaleDateString('he-IL')}</p>
                    <p><strong>🕐 שעה:</strong> ${new Date(event.startDateTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p><strong>📍 מיקום:</strong> ${event.location?.address?.city || 'אונליין'}</p>
                    ${event.pricing?.type === 'paid' ? `<p><strong>💰 מחיר:</strong> ₪${event.pricing.amount}</p>` : ''}
                </div>
                
                <p>נתראה באירוע! 🎉</p>
                <p style="color: #666; font-size: 12px;">צוות ChatGrow</p>
            </div>
        `;

        const smsMessage = `✅ נרשמת לאירוע: ${event.name}\n📅 ${new Date(event.startDateTime).toLocaleDateString('he-IL')} בשעה ${new Date(event.startDateTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}\nנתראה!`;

        return await this.sendMultiChannel({
            email: participant.email,
            phone: participant.phone,
            subject: `אישור הרשמה לאירוע - ${event.name}`,
            emailHtml,
            smsMessage
        });
    }

    /**
     * Send event reminder notification
     * @param {Object} event - Event object
     * @param {string} timeframe - '24h' or '1h'
     */
    async sendEventReminder(event, timeframe = '24h') {
        const timeText = timeframe === '24h' ? 'מחר' : 'בעוד שעה';
        const emoji = timeframe === '24h' ? '📅' : '⏰';
        
        // Send to business owner
        const businessEmail = event.businessId?.email || event.business?.email;
        const businessName = event.businessId?.profile?.businessName || event.business?.name || 'ספק';

        if (businessEmail) {
            const emailHtml = `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #667eea;">${emoji} תזכורת לאירוע ${timeText}</h2>
                    <p>שלום ${businessName},</p>
                    <p>זו תזכורת שהאירוע מתקיים ${timeText}: <strong>${event.title || event.name}</strong></p>
                    
                    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">פרטי האירוע:</h3>
                        <p><strong>📅 תאריך:</strong> ${new Date(event.startDate || event.startDateTime).toLocaleDateString('he-IL')}</p>
                        <p><strong>🕐 שעה:</strong> ${new Date(event.startDate || event.startDateTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p><strong>📍 מיקום:</strong> ${event.location?.address?.city || event.location?.city || 'לא צוין'}</p>
                        <p><strong>👥 משתתפים:</strong> ${event.participants || 0}</p>
                    </div>
                    
                    <p>בהצלחה! 🎉</p>
                    <p style="color: #666; font-size: 12px;">צוות ChatGrow</p>
                </div>
            `;

            const smsMessage = `${emoji} תזכורת: ${timeText} ${event.title || event.name}\n📅 ${new Date(event.startDate || event.startDateTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;

            return await this.sendMultiChannel({
                email: businessEmail,
                phone: event.businessId?.profile?.phone,
                subject: `תזכורת - ${event.title || event.name} ${timeText}`,
                emailHtml,
                smsMessage
            });
        }
    }

    /**
     * Send appointment confirmation
     * @param {Object} appointment - Appointment object
     */
    async sendAppointmentConfirmation(appointment) {
        const customer = appointment.customerId || appointment.customer;
        const customerName = `${customer.firstName} ${customer.lastName}`;
        
        const emailHtml = `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">✅ אישור תור</h2>
                <p>שלום ${customerName},</p>
                <p>תורך אושר בהצלחה!</p>
                
                <div style="background: #f5f7fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">פרטי התור:</h3>
                    <p><strong>📅 תאריך:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString('he-IL')}</p>
                    <p><strong>🕐 שעה:</strong> ${new Date(appointment.appointmentDate).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p><strong>⏱️ משך:</strong> ${appointment.duration || 30} דקות</p>
                    ${appointment.service ? `<p><strong>🎯 שירות:</strong> ${appointment.service}</p>` : ''}
                    ${appointment.notes ? `<p><strong>📝 הערות:</strong> ${appointment.notes}</p>` : ''}
                </div>
                
                <p>נתראה בתור! 📆</p>
                <p style="color: #666; font-size: 12px;">צוות ChatGrow</p>
            </div>
        `;

        const smsMessage = `✅ תור אושר!\n📅 ${new Date(appointment.appointmentDate).toLocaleDateString('he-IL')} ${new Date(appointment.appointmentDate).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}\n⏱️ ${appointment.duration || 30} דקות`;

        return await this.sendMultiChannel({
            email: customer.email,
            phone: customer.phone,
            subject: 'אישור תור',
            emailHtml,
            smsMessage
        });
    }

    /**
     * Send appointment reminder
     * @param {Object} appointment - Appointment object
     * @param {string} timeframe - '24h' or '1h'
     */
    async sendAppointmentReminder(appointment, timeframe = '24h') {
        const timeText = timeframe === '24h' ? 'מחר' : 'בעוד שעה';
        const emoji = timeframe === '24h' ? '📅' : '⏰';
        
        const customer = appointment.customerId || appointment.customer;
        const customerName = `${customer.firstName} ${customer.lastName}`;
        
        const emailHtml = `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">${emoji} תזכורת לתור ${timeText}</h2>
                <p>שלום ${customerName},</p>
                <p>זו תזכורת שיש לך תור ${timeText}!</p>
                
                <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">פרטי התור:</h3>
                    <p><strong>📅 תאריך:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString('he-IL')}</p>
                    <p><strong>🕐 שעה:</strong> ${new Date(appointment.appointmentDate).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p><strong>⏱️ משך:</strong> ${appointment.duration || 30} דקות</p>
                    ${appointment.service ? `<p><strong>🎯 שירות:</strong> ${appointment.service}</p>` : ''}
                </div>
                
                <p>מצפים לראותך! ⏰</p>
                <p style="color: #666; font-size: 12px;">צוות ChatGrow</p>
            </div>
        `;

        const smsMessage = `${emoji} תזכורת: תור ${timeText}\n📅 ${new Date(appointment.appointmentDate).toLocaleDateString('he-IL')} ${new Date(appointment.appointmentDate).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}\n⏱️ ${appointment.duration || 30} דקות`;

        return await this.sendMultiChannel({
            email: customer.email,
            phone: customer.phone,
            subject: `תזכורת - תור ${timeText}`,
            emailHtml,
            smsMessage
        });
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            emailProviders: this.emailProviders.map(p => ({
                name: p.getName(),
                available: true
            })),
            smsProviders: this.smsProviders.map(p => ({
                name: p.getName(),
                available: true
            }))
        };
    }
}

// Export singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
