const nodemailer = require('nodemailer');
const axios = require('axios');
const { logInfo, logError, logWarning, logDebug } = require('./logger');

class AlertService {
    constructor() {
        this.alertHistory = new Map();
        this.alertCooldowns = new Map();
        this.notificationChannels = new Map();
        this.alertTemplates = new Map();
        this.init();
    }

    async init() {
        try {
            // Initialize notification channels
            await this.initializeChannels();
            
            // Setup alert templates
            this.setupAlertTemplates();
            
            // Setup alert cooldowns
            this.setupAlertCooldowns();
            
            logInfo('Alert service initialized successfully');
        } catch (error) {
            logError('Failed to initialize alert service', error);
        }
    }

    async initializeChannels() {
        // Email channel
        if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
            this.notificationChannels.set('email', {
                type: 'email',
                config: {
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT),
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                },
                enabled: true
            });
        }

        // Slack channel
        if (process.env.SLACK_WEBHOOK_URL) {
            this.notificationChannels.set('slack', {
                type: 'slack',
                config: {
                    webhookUrl: process.env.SLACK_WEBHOOK_URL,
                    channel: process.env.SLACK_CHANNEL || '#alerts',
                    username: process.env.SLACK_USERNAME || 'ChatGrow Alerts'
                },
                enabled: true
            });
        }

        // Discord channel
        if (process.env.DISCORD_WEBHOOK_URL) {
            this.notificationChannels.set('discord', {
                type: 'discord',
                config: {
                    webhookUrl: process.env.DISCORD_WEBHOOK_URL
                },
                enabled: true
            });
        }

        // Webhook channel
        if (process.env.WEBHOOK_URL) {
            this.notificationChannels.set('webhook', {
                type: 'webhook',
                config: {
                    url: process.env.WEBHOOK_URL,
                    method: process.env.WEBHOOK_METHOD || 'POST',
                    headers: process.env.WEBHOOK_HEADERS ? JSON.parse(process.env.WEBHOOK_HEADERS) : {}
                },
                enabled: true
            });
        }

        logInfo('Notification channels initialized', {
            channels: Array.from(this.notificationChannels.keys())
        });
    }

    setupAlertTemplates() {
        // Health issue template
        this.alertTemplates.set('health_issue', {
            email: {
                subject: '🚨 ChatGrow Health Alert: {{title}}',
                body: `
                    <h2>🚨 System Health Alert</h2>
                    <p><strong>Title:</strong> {{title}}</p>
                    <p><strong>Message:</strong> {{message}}</p>
                    <p><strong>Severity:</strong> <span style="color: {{severityColor}}">{{severity}}</span></p>
                    <p><strong>Timestamp:</strong> {{timestamp}}</p>
                    
                    {{#if details.issues}}
                    <h3>Affected Services:</h3>
                    <ul>
                        {{#each details.issues}}
                        <li><strong>{{service}}</strong>: {{error}} ({{responseTime}}ms)</li>
                        {{/each}}
                    </ul>
                    {{/if}}
                    
                    <p><strong>Overall Health:</strong> {{details.overallHealth}}</p>
                    
                    <hr>
                    <p><small>This alert was sent by ChatGrow Health Monitoring System</small></p>
                `
            },
            slack: {
                color: '{{severityColor}}',
                title: '🚨 {{title}}',
                text: '{{message}}',
                fields: [
                    { title: 'Severity', value: '{{severity}}', short: true },
                    { title: 'Timestamp', value: '{{timestamp}}', short: true },
                    { title: 'Overall Health', value: '{{details.overallHealth}}', short: true }
                ]
            }
        });

        // Rate limit warning template
        this.alertTemplates.set('rate_limit_warning', {
            email: {
                subject: '⚠️ Rate Limit Warning: {{connectionId}}',
                body: `
                    <h2>⚠️ Rate Limit Warning</h2>
                    <p><strong>Connection ID:</strong> {{connectionId}}</p>
                    <p><strong>Message:</strong> {{message}}</p>
                    <p><strong>Current Count:</strong> {{details.messageCount}}</p>
                    <p><strong>Daily Limit:</strong> {{details.dailyLimit}}</p>
                    <p><strong>Next Allowed:</strong> {{details.nextAllowedTime}}</p>
                    
                    <hr>
                    <p><small>This alert was sent by ChatGrow Rate Limiting System</small></p>
                `
            },
            slack: {
                color: '#ffa500',
                title: '⚠️ Rate Limit Warning',
                text: '{{message}}',
                fields: [
                    { title: 'Connection ID', value: '{{connectionId}}', short: true },
                    { title: 'Message Count', value: '{{details.messageCount}}', short: true },
                    { title: 'Daily Limit', value: '{{details.dailyLimit}}', short: true }
                ]
            }
        });

        // WhatsApp connection issue template
        this.alertTemplates.set('whatsapp_connection_issue', {
            email: {
                subject: '📱 WhatsApp Connection Issue: {{connectionId}}',
                body: `
                    <h2>📱 WhatsApp Connection Issue</h2>
                    <p><strong>Connection ID:</strong> {{connectionId}}</p>
                    <p><strong>Status:</strong> {{status}}</p>
                    <p><strong>Error:</strong> {{error}}</p>
                    <p><strong>Timestamp:</strong> {{timestamp}}</p>
                    
                    {{#if details}}
                    <h3>Details:</h3>
                    <pre>{{JSON.stringify details null 2}}</pre>
                    {{/if}}
                    
                    <hr>
                    <p><small>This alert was sent by ChatGrow WhatsApp Service</small></p>
                `
            },
            slack: {
                color: '#ff6b6b',
                title: '📱 WhatsApp Connection Issue',
                text: '{{error}}',
                fields: [
                    { title: 'Connection ID', value: '{{connectionId}}', short: true },
                    { title: 'Status', value: '{{status}}', short: true },
                    { title: 'Timestamp', value: '{{timestamp}}', short: true }
                ]
            }
        });

        // Queue issue template
        this.alertTemplates.set('queue_issue', {
            email: {
                subject: '⚡ Queue Processing Issue',
                body: `
                    <h2>⚡ Queue Processing Issue</h2>
                    <p><strong>Message:</strong> {{message}}</p>
                    <p><strong>Job ID:</strong> {{jobId}}</p>
                    <p><strong>Error:</strong> {{error}}</p>
                    <p><strong>Timestamp:</strong> {{timestamp}}</p>
                    
                    {{#if details}}
                    <h3>Queue Details:</h3>
                    <ul>
                        <li>Waiting: {{details.waiting}}</li>
                        <li>Active: {{details.active}}</li>
                        <li>Failed: {{details.failed}}</li>
                        <li>Completed: {{details.completed}}</li>
                    </ul>
                    {{/if}}
                    
                    <hr>
                    <p><small>This alert was sent by ChatGrow Queue System</small></p>
                `
            },
            slack: {
                color: '#ff6b6b',
                title: '⚡ Queue Processing Issue',
                text: '{{message}}',
                fields: [
                    { title: 'Job ID', value: '{{jobId}}', short: true },
                    { title: 'Error', value: '{{error}}', short: false }
                ]
            }
        });
    }

    setupAlertCooldowns() {
        // Define cooldown periods for different alert types
        this.alertCooldowns.set('health_issue', 300000); // 5 minutes
        this.alertCooldowns.set('rate_limit_warning', 600000); // 10 minutes
        this.alertCooldowns.set('whatsapp_connection_issue', 300000); // 5 minutes
        this.alertCooldowns.set('queue_issue', 120000); // 2 minutes
    }

    async sendAlert(alertData) {
        const {
            type = 'general',
            severity = 'info',
            title,
            message,
            details = {},
            channels = ['email', 'slack'],
            cooldown = true
        } = alertData;

        try {
            // Check cooldown
            if (cooldown && this.isInCooldown(type, details)) {
                logDebug('Alert suppressed due to cooldown', { type, details });
                return;
            }

            // Get template
            const template = this.alertTemplates.get(type) || this.alertTemplates.get('general');
            if (!template) {
                logWarning('No template found for alert type', { type });
                return;
            }

            // Prepare alert data
            const alertPayload = this.prepareAlertPayload(alertData, template);

            // Send to each channel
            const results = [];
            for (const channelName of channels) {
                const channel = this.notificationChannels.get(channelName);
                if (channel && channel.enabled) {
                    try {
                        const result = await this.sendToChannel(channel, alertPayload);
                        results.push({ channel: channelName, success: true, result });
                    } catch (error) {
                        logError(`Failed to send alert to ${channelName}`, error);
                        results.push({ channel: channelName, success: false, error: error.message });
                    }
                }
            }

            // Log alert
            this.logAlert(alertData, results);

            return results;

        } catch (error) {
            logError('Failed to send alert', error, alertData);
            throw error;
        }
    }

    prepareAlertPayload(alertData, template) {
        const {
            type,
            severity,
            title,
            message,
            details = {},
            timestamp = new Date()
        } = alertData;

        const severityColors = {
            info: '#3498db',
            warning: '#f39c12',
            error: '#e74c3c',
            critical: '#c0392b'
        };

        const payload = {
            type,
            severity,
            title,
            message,
            details,
            timestamp: timestamp.toISOString(),
            severityColor: severityColors[severity] || severityColors.info
        };

        // Process templates
        const processedPayload = {};
        Object.entries(template).forEach(([channel, channelTemplate]) => {
            processedPayload[channel] = this.processTemplate(channelTemplate, payload);
        });

        return processedPayload;
    }

    processTemplate(template, data) {
        let processed = JSON.stringify(template);
        
        // Replace placeholders
        Object.entries(data).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            if (typeof value === 'object') {
                processed = processed.replace(placeholder, JSON.stringify(value, null, 2));
            } else {
                processed = processed.replace(new RegExp(placeholder, 'g'), value);
            }
        });

        return JSON.parse(processed);
    }

    async sendToChannel(channel, payload) {
        switch (channel.type) {
            case 'email':
                return await this.sendEmail(channel.config, payload.email);
            
            case 'slack':
                return await this.sendSlack(channel.config, payload.slack);
            
            case 'discord':
                return await this.sendDiscord(channel.config, payload.slack); // Reuse Slack format
            
            case 'webhook':
                return await this.sendWebhook(channel.config, payload);
            
            default:
                throw new Error(`Unsupported channel type: ${channel.type}`);
        }
    }

    async sendEmail(config, emailPayload) {
        const transporter = nodemailer.createTransporter(config);
        
        const mailOptions = {
            from: process.env.SMTP_FROM || config.auth.user,
            to: process.env.ALERT_EMAIL_TO || config.auth.user,
            subject: emailPayload.subject,
            html: emailPayload.body
        };

        const result = await transporter.sendMail(mailOptions);
        logInfo('Alert email sent successfully', { messageId: result.messageId });
        return result;
    }

    async sendSlack(config, slackPayload) {
        const message = {
            channel: config.channel,
            username: config.username,
            attachments: [{
                color: slackPayload.color,
                title: slackPayload.title,
                text: slackPayload.text,
                fields: slackPayload.fields || [],
                footer: 'ChatGrow Alert System',
                ts: Math.floor(Date.now() / 1000)
            }]
        };

        const response = await axios.post(config.webhookUrl, message);
        
        if (response.status === 200) {
            logInfo('Alert Slack message sent successfully');
            return response.data;
        } else {
            throw new Error(`Slack API returned status ${response.status}`);
        }
    }

    async sendDiscord(config, discordPayload) {
        const message = {
            embeds: [{
                title: discordPayload.title,
                description: discordPayload.text,
                color: parseInt(discordPayload.color.replace('#', ''), 16),
                fields: discordPayload.fields || [],
                footer: {
                    text: 'ChatGrow Alert System'
                },
                timestamp: new Date().toISOString()
            }]
        };

        const response = await axios.post(config.webhookUrl, message);
        
        if (response.status === 204) {
            logInfo('Alert Discord message sent successfully');
            return response.data;
        } else {
            throw new Error(`Discord API returned status ${response.status}`);
        }
    }

    async sendWebhook(config, payload) {
        const response = await axios({
            method: config.method || 'POST',
            url: config.url,
            headers: config.headers,
            data: payload
        });

        logInfo('Alert webhook sent successfully', { status: response.status });
        return response.data;
    }

    isInCooldown(type, details) {
        const cooldownPeriod = this.alertCooldowns.get(type);
        if (!cooldownPeriod) return false;

        const alertKey = this.generateAlertKey(type, details);
        const lastAlert = this.alertHistory.get(alertKey);
        
        if (!lastAlert) return false;

        return (Date.now() - lastAlert) < cooldownPeriod;
    }

    generateAlertKey(type, details) {
        // Create a unique key based on alert type and relevant details
        const keyParts = [type];
        
        if (details.connectionId) keyParts.push(details.connectionId);
        if (details.service) keyParts.push(details.service);
        if (details.jobId) keyParts.push(details.jobId);
        
        return keyParts.join(':');
    }

    logAlert(alertData, results) {
        const alertKey = this.generateAlertKey(alertData.type, alertData.details);
        this.alertHistory.set(alertKey, Date.now());

        logInfo('Alert sent', {
            type: alertData.type,
            severity: alertData.severity,
            title: alertData.title,
            results: results.map(r => ({ channel: r.channel, success: r.success }))
        });
    }

    // Utility methods for specific alert types
    async sendHealthAlert(issues, healthResults) {
        return await this.sendAlert({
            type: 'health_issue',
            severity: 'warning',
            title: 'System Health Issues Detected',
            message: `Found ${issues.length} unhealthy services`,
            details: {
                issues,
                overallHealth: healthResults.overall,
                timestamp: healthResults.timestamp
            }
        });
    }

    async sendRateLimitAlert(connectionId, message, details) {
        return await this.sendAlert({
            type: 'rate_limit_warning',
            severity: 'warning',
            title: 'Rate Limit Warning',
            message,
            details: {
                connectionId,
                ...details
            }
        });
    }

    async sendWhatsAppConnectionAlert(connectionId, status, error, details = {}) {
        return await this.sendAlert({
            type: 'whatsapp_connection_issue',
            severity: 'error',
            title: 'WhatsApp Connection Issue',
            message: `Connection ${connectionId} has status: ${status}`,
            details: {
                connectionId,
                status,
                error,
                ...details
            }
        });
    }

    async sendQueueAlert(jobId, message, error, details = {}) {
        return await this.sendAlert({
            type: 'queue_issue',
            severity: 'error',
            title: 'Queue Processing Issue',
            message,
            details: {
                jobId,
                error,
                ...details
            }
        });
    }

    // Alert management methods
    getAlertHistory(limit = 50) {
        const history = Array.from(this.alertHistory.entries())
            .map(([key, timestamp]) => ({
                key,
                timestamp,
                date: new Date(timestamp)
            }))
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);

        return history;
    }

    clearAlertHistory() {
        this.alertHistory.clear();
        logInfo('Alert history cleared');
    }

    getAlertStats() {
        const now = Date.now();
        const oneHourAgo = now - 3600000;
        const oneDayAgo = now - 86400000;

        const recentAlerts = Array.from(this.alertHistory.values())
            .filter(timestamp => timestamp > oneHourAgo);

        const dailyAlerts = Array.from(this.alertHistory.values())
            .filter(timestamp => timestamp > oneDayAgo);

        return {
            total: this.alertHistory.size,
            lastHour: recentAlerts.length,
            lastDay: dailyAlerts.length,
            channels: Array.from(this.notificationChannels.keys())
        };
    }

    async testAlert(channel = 'email') {
        const testAlert = {
            type: 'test',
            severity: 'info',
            title: 'Test Alert',
            message: 'This is a test alert from ChatGrow Alert System',
            details: {
                timestamp: new Date().toISOString(),
                test: true
            },
            channels: [channel],
            cooldown: false
        };

        return await this.sendAlert(testAlert);
    }

    async cleanup() {
        // Clean up old alert history (older than 7 days)
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        for (const [key, timestamp] of this.alertHistory.entries()) {
            if (timestamp < sevenDaysAgo) {
                this.alertHistory.delete(key);
            }
        }

        logInfo('Alert service cleaned up');
    }
}

const alertService = new AlertService();

// Graceful shutdown
process.on('SIGTERM', async () => {
    await alertService.cleanup();
});

process.on('SIGINT', async () => {
    await alertService.cleanup();
});

// Export both the service instance and the sendAlert function for convenience
module.exports = {
    alertService,
    sendAlert: (alertData) => alertService.sendAlert(alertData),
    sendHealthAlert: (issues, healthResults) => alertService.sendHealthAlert(issues, healthResults),
    sendRateLimitAlert: (connectionId, message, details) => alertService.sendRateLimitAlert(connectionId, message, details),
    sendWhatsAppConnectionAlert: (connectionId, status, error, details) => alertService.sendWhatsAppConnectionAlert(connectionId, status, error, details),
    sendQueueAlert: (jobId, message, error, details) => alertService.sendQueueAlert(jobId, message, error, details)
}; 