const PaymentProvider = require('../PaymentProvider');
const axios = require('axios');
const crypto = require('crypto');

class TranzilaProvider extends PaymentProvider {
    constructor(config = {}) {
        super(config);
        this.name = 'tranzila';
        this.terminal = config.terminal || process.env.TRANZILA_TERMINAL;
        this.apiUrl = 'https://direct.tranzila.com';
    }

    async initialize() {
        if (!this.terminal) {
            throw new Error('Tranzila terminal is required');
        }
        return true;
    }

    async createPaymentPage(paymentData) {
        this.validatePaymentData(paymentData);

        const successUrl = paymentData.successUrl || `${process.env.BASE_URL}/payment/success`;
        const errorUrl = paymentData.errorUrl || `${process.env.BASE_URL}/payment/error`;

        const payload = {
            supplier: this.terminal,
            sum: this.formatAmount(paymentData.amount),
            currency: this.getCurrencyCode(paymentData.currency),
            
            cred_type: '1',
            
            contact: paymentData.customer.name || '',
            email: paymentData.customer.email || '',
            phone: paymentData.customer.phone || '',
            
            pdesc: paymentData.description || 'Payment',
            
            tranmode: 'A',
            
            success_url_address: successUrl,
            fail_url_address: errorUrl,
            
            orderId: paymentData.orderId || paymentData.referenceId || ''
        };

        try {
            const formParams = new URLSearchParams(payload).toString();
            const paymentUrl = `${this.apiUrl}/${this.terminal}?${formParams}`;

            return {
                success: true,
                paymentUrl: paymentUrl,
                transactionId: paymentData.orderId || paymentData.referenceId,
                provider: 'tranzila',
                terminal: this.terminal
            };
        } catch (error) {
            console.error('Tranzila payment page creation failed:', error);
            throw new Error(`Tranzila error: ${error.message}`);
        }
    }

    async getPaymentStatus(transactionId) {
        try {
            const response = await axios.post(`${this.apiUrl}/${this.terminal}`, {
                supplier: this.terminal,
                tranmode: 'V',
                TranzilaTK: transactionId
            });

            const status = this.mapStatus(response.data.Response);

            return {
                status: status,
                transactionId: transactionId,
                rawResponse: response.data
            };
        } catch (error) {
            console.error('Tranzila status check failed:', error);
            throw new Error(`Status check error: ${error.message}`);
        }
    }

    async refundPayment(transactionId, amount, reason) {
        try {
            const response = await axios.post(`${this.apiUrl}/${this.terminal}`, {
                supplier: this.terminal,
                tranmode: 'C',
                TranzilaTK: transactionId,
                sum: this.formatAmount(amount)
            });

            if (response.data.Response === '000') {
                return {
                    success: true,
                    refundId: response.data.ConfirmationCode,
                    message: 'Refund processed successfully'
                };
            }

            throw new Error(response.data.ErrorMessage || 'Refund failed');
        } catch (error) {
            console.error('Tranzila refund failed:', error);
            throw new Error(`Refund error: ${error.message}`);
        }
    }

    async cancelPayment(transactionId) {
        return this.refundPayment(transactionId, null, 'Cancellation');
    }

    mapStatus(responseCode) {
        const statusMap = {
            '000': 'completed',
            '001': 'pending',
            '002': 'failed',
            '003': 'cancelled'
        };
        return statusMap[responseCode] || 'unknown';
    }

    getCurrencyCode(currency) {
        const currencyMap = {
            'ILS': '1',
            'USD': '2',
            'EUR': '3',
            'GBP': '4'
        };
        return currencyMap[currency] || '1';
    }

    async validateWebhook(payload, signature) {
        return true;
    }
}

module.exports = TranzilaProvider;
