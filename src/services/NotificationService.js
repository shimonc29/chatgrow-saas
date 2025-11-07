const nodemailer = require('nodemailer');
const ProviderSettings = require('../models/ProviderSettings');
const { logInfo, logError } = require('../utils/logger');

class NotificationService {
  /**
   * Send Email using provider-specific settings
   * @param {string} userId - Provider's user ID
   * @param {Object} emailData - { to, subject, text, html }
   */
  static async sendEmail(userId, emailData) {
    try {
      // Get provider settings
      const settings = await ProviderSettings.findOne({ userId, isActive: true });
      
      if (!settings || !settings.emailProvider.enabled) {
        throw new Error('Email provider not configured or disabled');
      }

      const emailConfig = settings.getEmailConfig();
      if (!emailConfig) {
        throw new Error('Email configuration not found');
      }

      let result;
      
      if (emailConfig.type === 'sendgrid') {
        result = await this.sendViaSendGrid(emailConfig.config, emailData);
      } else if (emailConfig.type === 'smtp') {
        result = await this.sendViaSMTP(emailConfig.config, emailData);
      } else {
        throw new Error(`Unsupported email provider: ${emailConfig.type}`);
      }

      logInfo(`Email sent successfully to ${emailData.to} via ${emailConfig.type}`, { userId });
      return result;
    } catch (error) {
      logError('Email sending failed', { error: error.message, userId, to: emailData.to });
      throw error;
    }
  }

  /**
   * Send Email via SendGrid
   */
  static async sendViaSendGrid(config, emailData) {
    const sgMail = require('@sendgrid/mail');
    
    if (!config.apiKey) {
      throw new Error('SendGrid API key not configured');
    }

    sgMail.setApiKey(config.apiKey);

    const msg = {
      to: emailData.to,
      from: {
        email: config.fromEmail || emailData.from,
        name: config.fromName || 'ChatGrow'
      },
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html || emailData.text
    };

    const result = await sgMail.send(msg);
    return { success: true, provider: 'sendgrid', messageId: result[0].headers['x-message-id'] };
  }

  /**
   * Send Email via SMTP
   */
  static async sendViaSMTP(config, emailData) {
    if (!config.host || !config.port || !config.username || !config.password) {
      throw new Error('SMTP configuration incomplete');
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure || true,
      auth: {
        user: config.username,
        pass: config.password
      }
    });

    const mailOptions = {
      from: `${config.fromName || 'ChatGrow'} <${config.fromEmail}>`,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html || emailData.text
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, provider: 'smtp', messageId: info.messageId };
  }

  /**
   * Send SMS using provider-specific settings
   * @param {string} userId - Provider's user ID
   * @param {Object} smsData - { to, body }
   */
  static async sendSMS(userId, smsData) {
    try {
      // Get provider settings
      const settings = await ProviderSettings.findOne({ userId, isActive: true });
      
      if (!settings || !settings.smsProvider.enabled) {
        throw new Error('SMS provider not configured or disabled');
      }

      const smsConfig = settings.getSMSConfig();
      if (!smsConfig) {
        throw new Error('SMS configuration not found');
      }

      let result;
      
      if (smsConfig.type === 'twilio') {
        result = await this.sendViaTwilio(smsConfig.config, smsData);
      } else {
        throw new Error(`Unsupported SMS provider: ${smsConfig.type}`);
      }

      logInfo(`SMS sent successfully to ${smsData.to} via ${smsConfig.type}`, { userId });
      return result;
    } catch (error) {
      logError('SMS sending failed', { error: error.message, userId, to: smsData.to });
      throw error;
    }
  }

  /**
   * Send SMS via Twilio
   */
  static async sendViaTwilio(config, smsData) {
    if (!config.accountSid || !config.authToken || !config.phoneNumber) {
      throw new Error('Twilio configuration incomplete');
    }

    const twilio = require('twilio');
    const client = twilio(config.accountSid, config.authToken);

    const message = await client.messages.create({
      body: smsData.body,
      from: config.phoneNumber,
      to: smsData.to
    });

    return { 
      success: true, 
      provider: 'twilio', 
      messageId: message.sid,
      status: message.status
    };
  }

  /**
   * Send bulk emails
   * @param {string} userId - Provider's user ID
   * @param {Array} recipients - Array of email data objects
   */
  static async sendBulkEmails(userId, recipients) {
    const results = {
      sent: [],
      failed: []
    };

    for (const emailData of recipients) {
      try {
        const result = await this.sendEmail(userId, emailData);
        results.sent.push({ email: emailData.to, result });
      } catch (error) {
        results.failed.push({ email: emailData.to, error: error.message });
      }
    }

    return results;
  }

  /**
   * Send bulk SMS
   * @param {string} userId - Provider's user ID
   * @param {Array} recipients - Array of SMS data objects
   */
  static async sendBulkSMS(userId, recipients) {
    const results = {
      sent: [],
      failed: []
    };

    for (const smsData of recipients) {
      try {
        const result = await this.sendSMS(userId, smsData);
        results.sent.push({ phone: smsData.to, result });
      } catch (error) {
        results.failed.push({ phone: smsData.to, error: error.message });
      }
    }

    return results;
  }

  /**
   * Test email configuration
   */
  static async testEmailConfig(userId) {
    const testEmail = {
      to: 'test@example.com', // This should be overridden by real test
      subject: 'Test Email from ChatGrow',
      text: 'If you receive this email, your email configuration is working correctly!',
      html: '<p>If you receive this email, your email configuration is working correctly!</p>'
    };

    try {
      await this.sendEmail(userId, testEmail);
      return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Test SMS configuration
   */
  static async testSMSConfig(userId) {
    const testSMS = {
      to: '+1234567890', // This should be overridden by real test
      body: 'Test SMS from ChatGrow. Your SMS configuration is working!'
    };

    try {
      await this.sendSMS(userId, testSMS);
      return { success: true, message: 'Test SMS sent successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = NotificationService;
