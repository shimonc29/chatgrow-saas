const PaymentProvider = require('../PaymentProvider');
const axios = require('axios');

class TranzilaProvider extends PaymentProvider {
    constructor(config = {}) {
        super(config);
        this.name = 'tranzila';
        this.terminalName = config.terminalName || process.env.TRANZILA_TERMINAL_NAME;
        this.apiKey = config.apiKey || process.env.TRANZILA_API_KEY;
        this.apiUrl = 'https://direct.tranzila.com';
    }

    async initialize() {
        if (!this.terminalName) {
            throw new Error('Tranzila terminal name is required');
        }
        return true;
    }

    async createPaymentPage(paymentData) {
        this.validatePaymentData(paymentData);

        const payload = {
            supplier: this.terminalName,
            sum: this.formatAmount(paymentData.amount),
            currency: this.getCurrencyCode(paymentData.currency),
            
            contact: paymentData.customer.name,
            email: paymentData.customer.email,
            phone: paymentData.customer.phone,
            
            description: paymentData.description || 'Payment',
            
            success_url: paymentData.successUrl || `${process.env.BASE_URL}/payment/success`,
            fail_url: paymentData.errorUrl || `${process.env.BASE_URL}/payment/error`,
            notify_url: paymentData.webhookUrl || `${process.env.BASE_URL}/api/webhooks/tranzila`,
            
            lang: 'he',
            
            cred_type: '1',
            
            custom_field: paymentData.orderId || paymentData.referenceId
        };

        if (this.apiKey) {
            payload.TranzilaPW = this.apiKey;
        }

        try {
            const queryString = new URLSearchParams(payload).toString();
            const paymentUrl = `${this.apiUrl}/${this.terminalName}?${queryString}`;

            return {
                success: true,
                provider: 'tranzila',
                paymentUrl: paymentUrl,
                transactionId: paymentData.orderId || `trz-${Date.now()}`,
                metadata: {
                    terminalName: this.terminalName
                }
            };

        } catch (error) {
            throw new Error(`Tranzila payment creation error: ${error.message}`);
        }
    }

    async getPaymentStatus(transactionId) {
        try {
            const response = await axios.post(`${this.apiUrl}/${this.terminalName}`, {
                supplier: this.terminalName,
                TranzilaPW: this.apiKey,
                tranmode: 'V',
                index: transactionId
            });

            const data = this.parseResponse(response.data);

            return {
                status: data.Response === '000' ? 'completed' : 'failed',
                transactionId: data.index,
                authNumber: data.ConfirmationCode,
                confirmationCode: data.ConfirmationCode,
                metadata: data
            };

        } catch (error) {
            throw new Error(`Failed to get payment status: ${error.message}`);
        }
    }

    async refundPayment(transactionId, amount, reason) {
        try {
            const response = await axios.post(`${this.apiUrl}/${this.terminalName}`, {
                supplier: this.terminalName,
                TranzilaPW: this.apiKey,
                tranmode: 'C',
                index: transactionId,
                sum: this.formatAmount(amount),
                remarks: reason || 'Customer refund'
            });

            const data = this.parseResponse(response.data);

            if (data.Response !== '000') {
                throw new Error(data.error || 'Refund failed');
            }

            return {
                success: true,
                refundTransactionId: data.index,
                metadata: data
            };

        } catch (error) {
            throw new Error(`Refund failed: ${error.message}`);
        }
    }

    getCurrencyCode(currency) {
        const codes = { ILS: '1', USD: '2', EUR: '3', GBP: '4' };
        return codes[currency] || '1';
    }

    parseResponse(responseText) {
        const params = {};
        responseText.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            params[key] = decodeURIComponent(value || '');
        });
        return params;
    }

    async validateWebhook(payload, signature) {
        return true;
    }
}

module.exports = TranzilaProvider;
