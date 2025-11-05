/**
 * Base Email Provider Interface
 * כל ספקי האימייל צריכים לממש את הממשק הזה
 */
class EmailProvider {
    constructor(config = {}) {
        this.config = config;
        this.name = 'BaseEmailProvider';
    }

    /**
     * Send email
     * @param {Object} options - Email options
     * @param {string} options.to - Recipient email
     * @param {string} options.subject - Email subject
     * @param {string} options.html - HTML content
     * @param {string} options.text - Plain text content (optional)
     * @param {string} options.from - Sender email (optional)
     * @returns {Promise<Object>} Send result
     */
    async send({ to, subject, html, text, from }) {
        throw new Error('send() must be implemented by the provider');
    }

    /**
     * Verify provider connection/configuration
     * @returns {Promise<boolean>}
     */
    async verify() {
        throw new Error('verify() must be implemented by the provider');
    }

    /**
     * Get provider name
     * @returns {string}
     */
    getName() {
        return this.name;
    }
}

module.exports = EmailProvider;
