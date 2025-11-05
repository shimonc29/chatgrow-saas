class PaymentProvider {
    constructor(config = {}) {
        this.config = config;
        this.name = 'base';
    }

    async initialize() {
        throw new Error('initialize() must be implemented by payment provider');
    }

    async createPayment(paymentData) {
        throw new Error('createPayment() must be implemented by payment provider');
    }

    async createPaymentPage(paymentData) {
        throw new Error('createPaymentPage() must be implemented by payment provider');
    }

    async getPaymentStatus(transactionId) {
        throw new Error('getPaymentStatus() must be implemented by payment provider');
    }

    async refundPayment(transactionId, amount, reason) {
        throw new Error('refundPayment() must be implemented by payment provider');
    }

    async cancelPayment(transactionId) {
        throw new Error('cancelPayment() must be implemented by payment provider');
    }

    async validateWebhook(payload, signature) {
        throw new Error('validateWebhook() must be implemented by payment provider');
    }

    formatAmount(amount) {
        return parseFloat(amount).toFixed(2);
    }

    validatePaymentData(paymentData) {
        const required = ['amount', 'currency', 'customer'];
        const missing = required.filter(field => !paymentData[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required payment fields: ${missing.join(', ')}`);
        }

        if (paymentData.amount <= 0) {
            throw new Error('Payment amount must be greater than 0');
        }

        return true;
    }
}

module.exports = PaymentProvider;
