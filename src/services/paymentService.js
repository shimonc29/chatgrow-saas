const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const CardcomProvider = require('../providers/payments/CardcomProvider');
const MeshulamProvider = require('../providers/payments/MeshulamProvider');
const TranzilaProvider = require('../providers/payments/TranzilaProvider');
const { logInfo, logError } = require('../utils/logger');

class PaymentService {
    constructor() {
        this.providers = {};
        this.initializeProviders();
    }

    initializeProviders() {
        const defaultProvider = process.env.PAYMENT_PROVIDER || 'cardcom';

        try {
            this.providers.cardcom = new CardcomProvider({
                terminalNumber: process.env.CARDCOM_TERMINAL_NUMBER,
                apiKey: process.env.CARDCOM_API_KEY,
                sandbox: process.env.NODE_ENV !== 'production'
            });

            this.providers.meshulam = new MeshulamProvider({
                apiKey: process.env.MESHULAM_API_KEY,
                pageCode: process.env.MESHULAM_PAGE_CODE,
                userId: process.env.MESHULAM_USER_ID,
                sandbox: process.env.NODE_ENV !== 'production'
            });

            this.providers.tranzila = new TranzilaProvider({
                terminalName: process.env.TRANZILA_TERMINAL_NAME,
                apiKey: process.env.TRANZILA_API_KEY
            });

            this.defaultProvider = defaultProvider;

            logInfo('Payment providers initialized', {
                providers: Object.keys(this.providers),
                defaultProvider: this.defaultProvider
            });

        } catch (error) {
            logError('Failed to initialize payment providers', error);
        }
    }

    getProvider(providerName) {
        const provider = this.providers[providerName || this.defaultProvider];
        if (!provider) {
            throw new Error(`Payment provider '${providerName}' not found`);
        }
        return provider;
    }

    async createPayment(businessId, customerId, paymentData) {
        try {
            const providerName = paymentData.provider || this.defaultProvider;
            const provider = this.getProvider(providerName);

            await provider.initialize();

            const payment = new Payment({
                businessId,
                customerId,
                amount: paymentData.amount,
                currency: paymentData.currency || 'ILS',
                paymentMethod: paymentData.paymentMethod || 'credit_card',
                provider: {
                    name: providerName
                },
                customer: paymentData.customer,
                billing: paymentData.billing,
                relatedTo: paymentData.relatedTo,
                notes: paymentData.notes,
                metadata: paymentData.metadata
            });

            await payment.save();

            const paymentPageData = {
                ...paymentData,
                orderId: payment._id.toString(),
                referenceId: payment._id.toString()
            };

            const result = await provider.createPaymentPage(paymentPageData);

            payment.provider.transactionId = result.transactionId;
            payment.provider.metadata = result.metadata;
            payment.status = 'processing';
            await payment.save();

            logInfo('Payment created successfully', {
                paymentId: payment._id,
                provider: providerName,
                amount: payment.amount
            });

            return {
                success: true,
                payment,
                paymentUrl: result.paymentUrl,
                transactionId: result.transactionId
            };

        } catch (error) {
            logError('Failed to create payment', error, { businessId, customerId });
            throw error;
        }
    }

    async getPaymentStatus(paymentId) {
        try {
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                throw new Error('Payment not found');
            }

            if (payment.status === 'completed' || payment.status === 'failed') {
                return payment;
            }

            const provider = this.getProvider(payment.provider.name);
            const status = await provider.getPaymentStatus(payment.provider.transactionId);

            payment.status = status.status;
            payment.provider.authNumber = status.authNumber;
            payment.provider.confirmationCode = status.confirmationCode;
            payment.provider.metadata = { ...payment.provider.metadata, ...status.metadata };

            if (status.card) {
                payment.card = status.card;
            }

            await payment.save();

            logInfo('Payment status updated', {
                paymentId: payment._id,
                status: payment.status
            });

            return payment;

        } catch (error) {
            logError('Failed to get payment status', error, { paymentId });
            throw error;
        }
    }

    async handlePaymentWebhook(providerName, payload) {
        try {
            const provider = this.getProvider(providerName);
            
            const isValid = await provider.validateWebhook(payload);
            if (!isValid) {
                throw new Error('Invalid webhook signature');
            }

            const payment = await Payment.findOne({
                'provider.transactionId': payload.transactionId || payload.processId
            });

            if (!payment) {
                throw new Error('Payment not found for webhook');
            }

            if (payload.status === 'success' || payload.Response === '000') {
                await payment.markAsCompleted({
                    transactionId: payload.transactionId,
                    authNumber: payload.authNumber || payload.ConfirmationCode,
                    confirmationCode: payload.approvalNumber || payload.ConfirmationCode,
                    metadata: payload
                });
            } else {
                await payment.markAsFailed(payload.error || 'Payment failed');
            }

            logInfo('Webhook processed successfully', {
                provider: providerName,
                paymentId: payment._id,
                status: payment.status
            });

            return payment;

        } catch (error) {
            logError('Failed to process webhook', error, { providerName });
            throw error;
        }
    }

    async refundPayment(paymentId, amount, reason) {
        try {
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                throw new Error('Payment not found');
            }

            if (payment.status !== 'completed') {
                throw new Error('Only completed payments can be refunded');
            }

            const provider = this.getProvider(payment.provider.name);
            const refundAmount = amount || payment.amount;

            const result = await provider.refundPayment(
                payment.provider.transactionId,
                refundAmount,
                reason
            );

            await payment.refundPayment(refundAmount, reason);
            payment.refund.refundTransactionId = result.refundTransactionId;
            await payment.save();

            logInfo('Payment refunded successfully', {
                paymentId: payment._id,
                refundAmount,
                reason
            });

            return {
                success: true,
                payment,
                refund: result
            };

        } catch (error) {
            logError('Failed to refund payment', error, { paymentId });
            throw error;
        }
    }

    async getBusinessPayments(businessId, filters = {}) {
        try {
            const query = { businessId };

            if (filters.status) {
                query.status = filters.status;
            }

            if (filters.startDate || filters.endDate) {
                query.createdAt = {};
                if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
                if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
            }

            if (filters.customerId) {
                query.customerId = filters.customerId;
            }

            const payments = await Payment.find(query)
                .sort({ createdAt: -1 })
                .limit(filters.limit || 100)
                .populate('customerId', 'firstName lastName email phone');

            return payments;

        } catch (error) {
            logError('Failed to get business payments', error, { businessId });
            throw error;
        }
    }

    async getBusinessRevenue(businessId, startDate, endDate) {
        try {
            const revenue = await Payment.getBusinessRevenue(businessId, startDate, endDate);

            logInfo('Business revenue calculated', {
                businessId,
                totalRevenue: revenue.totalRevenue,
                totalPayments: revenue.totalPayments
            });

            return revenue;

        } catch (error) {
            logError('Failed to get business revenue', error, { businessId });
            throw error;
        }
    }
}

module.exports = new PaymentService();
