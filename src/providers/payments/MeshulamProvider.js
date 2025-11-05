const PaymentProvider = require('../PaymentProvider');
const axios = require('axios');

class MeshulamProvider extends PaymentProvider {
    constructor(config = {}) {
        super(config);
        this.name = 'meshulam';
        this.apiKey = config.apiKey || process.env.MESHULAM_API_KEY;
        this.pageCode = config.pageCode || process.env.MESHULAM_PAGE_CODE;
        this.userId = config.userId || process.env.MESHULAM_USER_ID;
        this.apiUrl = config.sandbox ? 
            'https://sandbox.meshulam.co.il/api' : 
            'https://secure.meshulam.co.il/api';
    }

    async initialize() {
        if (!this.apiKey || !this.pageCode) {
            throw new Error('Meshulam API key and page code are required');
        }
        return true;
    }

    async createPaymentPage(paymentData) {
        this.validatePaymentData(paymentData);

        const payload = {
            pageCode: this.pageCode,
            apiKey: this.apiKey,
            userId: this.userId,
            
            sum: this.formatAmount(paymentData.amount),
            currency: paymentData.currency || 'ILS',
            
            firstName: paymentData.customer.firstName || paymentData.customer.name?.split(' ')[0],
            lastName: paymentData.customer.lastName || paymentData.customer.name?.split(' ')[1] || '',
            email: paymentData.customer.email,
            phone: paymentData.customer.phone,
            
            description: paymentData.description || 'Payment',
            
            successUrl: paymentData.successUrl || `${process.env.BASE_URL}/payment/success`,
            cancelUrl: paymentData.errorUrl || `${process.env.BASE_URL}/payment/error`,
            notifyUrl: paymentData.webhookUrl || `${process.env.BASE_URL}/api/webhooks/meshulam`,
            
            customFields: {
                cField1: paymentData.orderId || paymentData.referenceId
            }
        };

        if (paymentData.items && paymentData.items.length > 0) {
            payload.products = paymentData.items.map(item => ({
                name: item.description,
                quantity: item.quantity,
                price: this.formatAmount(item.unitPrice)
            }));
        }

        try {
            const response = await axios.post(`${this.apiUrl}/light/server/1.0/createPaymentProcess`, payload);
            
            if (response.data.status !== '1') {
                throw new Error(response.data.err || 'Meshulam payment creation failed');
            }

            return {
                success: true,
                provider: 'meshulam',
                paymentUrl: response.data.url,
                transactionId: response.data.processId,
                processToken: response.data.processToken,
                metadata: {
                    processId: response.data.processId
                }
            };

        } catch (error) {
            throw new Error(`Meshulam API error: ${error.message}`);
        }
    }

    async getPaymentStatus(transactionId) {
        try {
            const response = await axios.post(`${this.apiUrl}/light/server/1.0/getProcessInfo`, {
                pageCode: this.pageCode,
                apiKey: this.apiKey,
                processId: transactionId
            });

            if (response.data.status !== '1') {
                throw new Error(response.data.err);
            }

            return {
                status: this.mapStatus(response.data.data.processStatus),
                transactionId: response.data.data.transactionId,
                authNumber: response.data.data.authNumber,
                confirmationCode: response.data.data.approvalNumber,
                lastFourDigits: response.data.data.lastFourDigits,
                metadata: response.data.data
            };

        } catch (error) {
            throw new Error(`Failed to get payment status: ${error.message}`);
        }
    }

    async refundPayment(transactionId, amount, reason) {
        try {
            const response = await axios.post(`${this.apiUrl}/light/server/1.0/refund`, {
                pageCode: this.pageCode,
                apiKey: this.apiKey,
                transactionId: transactionId,
                sum: this.formatAmount(amount),
                reason: reason || 'Customer request'
            });

            if (response.data.status !== '1') {
                throw new Error(response.data.err);
            }

            return {
                success: true,
                refundTransactionId: response.data.refundTransactionId,
                metadata: response.data
            };

        } catch (error) {
            throw new Error(`Refund failed: ${error.message}`);
        }
    }

    mapStatus(meshulamStatus) {
        const statusMap = {
            '1': 'completed',
            '2': 'pending',
            '3': 'failed',
            '4': 'cancelled'
        };
        return statusMap[meshulamStatus] || 'pending';
    }

    async validateWebhook(payload, signature) {
        return true;
    }
}

module.exports = MeshulamProvider;
