/**
 * Base SMS Provider Interface
 * כל ספקי ה-SMS צריכים לממש את הממשק הזה
 */
class SMSProvider {
    constructor(config = {}) {
        this.config = config;
        this.name = 'BaseSMSProvider';
    }

    /**
     * Send SMS
     * @param {Object} options - SMS options
     * @param {string} options.to - Recipient phone number (E.164 format recommended)
     * @param {string} options.message - SMS message content
     * @param {string} options.from - Sender phone number (optional)
     * @returns {Promise<Object>} Send result
     */
    async send({ to, message, from }) {
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

    /**
     * Format phone number to E.164 format (+972XXXXXXXXX)
     * @param {string} phone - Phone number
     * @param {string} defaultCountryCode - Default country code (default: '972' for Israel)
     * @returns {string} Formatted phone number
     */
    formatPhoneNumber(phone, defaultCountryCode = '972') {
        if (!phone) return null;
        
        // Remove all non-digit characters
        let cleaned = phone.replace(/\D/g, '');
        
        // If starts with 0, remove it (Israeli format)
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        
        // If doesn't start with country code, add it
        if (!cleaned.startsWith(defaultCountryCode)) {
            cleaned = defaultCountryCode + cleaned;
        }
        
        // Add + prefix for E.164 format
        if (!cleaned.startsWith('+')) {
            cleaned = '+' + cleaned;
        }
        
        return cleaned;
    }
}

module.exports = SMSProvider;
