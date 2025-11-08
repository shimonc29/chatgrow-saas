const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const ProviderSettings = require('../models/ProviderSettings');
const Subscriber = require('../models/Subscriber');
const CardcomProvider = require('../providers/payments/CardcomProvider');
const MeshulamProvider = require('../providers/payments/MeshulamProvider');
const { logInfo, logError } = require('../utils/logger');

class PaymentService {
    /**
     * Get payment provider instance for a specific user (multi-tenant)
     */
    async getProviderForUser(userId) {
        try {
            const settings = await ProviderSettings.findOne({ userId, isActive: true });
            
            if (!settings) {
                throw new Error('Provider settings not found. Please configure payment gateway settings.');
            }

            const gateway = settings.getActivePaymentGateway();
            
            if (!gateway) {
                throw new Error('No payment gateway enabled. Please enable Cardcom or GROW in settings.');
            }

            if (gateway.type === 'cardcom') {
                return new CardcomProvider({
                    terminalNumber: gateway.settings.terminalNumber,
                    apiUsername: gateway.settings.apiUsername,
                    apiPassword: gateway.settings.apiPassword,
                    lowProfileCode: gateway.settings.lowProfileCode,
                    currency: gateway.settings.currency,
                    sandbox: gateway.settings.testMode
                });
            } else if (gateway.type === 'grow') {
                return new MeshulamProvider({
                    apiKey: gateway.settings.apiKey,
                    userId: gateway.settings.userId,
                    pageCode: gateway.settings.pageCode,
                    currency: gateway.settings.currency,
                    sandbox: gateway.settings.testMode
                });
            }

            throw new Error(`Unsupported payment gateway: ${gateway.type}`);

        } catch (error) {
            logError('Failed to get payment provider', { error: error.message, userId });
            throw error;
        }
    }

    async createPayment(userId, customerId, paymentData) {
        try {
            const provider = await this.getProviderForUser(userId);
            const settings = await ProviderSettings.findOne({ userId });
            const gateway = settings.getActivePaymentGateway();
            const user = await Subscriber.findById(userId);

            if (!user) {
                throw new Error('User not found. Unable to process payment.');
            }

            await provider.initialize();

            const payment = new Payment({
                userId,
                customerId,
                amount: paymentData.amount,
                currency: paymentData.currency || gateway.settings.currency || 'ILS',
                method: paymentData.method || 'credit_card',
                provider: gateway.type,
                description: paymentData.description,
                status: 'pending',
                metadata: paymentData.metadata
            });

            await payment.save();

            const hasSplitPayment = !!user.paymentProviderId;
            const platformFeePercentage = hasSplitPayment ? parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '5') : 0;
            const platformFee = hasSplitPayment ? Math.round((paymentData.amount * platformFeePercentage) / 100) : 0;
            const amountToTransfer = hasSplitPayment ? paymentData.amount - platformFee : paymentData.amount;

            const paymentPageData = {
                ...paymentData,
                orderId: payment._id.toString(),
                referenceId: payment._id.toString()
            };

            if (hasSplitPayment) {
                paymentPageData.partnerAccountId = user.paymentProviderId;
                paymentPageData.amountToTransfer = amountToTransfer;
                paymentPageData.platformFee = platformFee;
                paymentPageData.splitPayment = true;
            }

            const result = await provider.createPaymentPage(paymentPageData);

            payment.transactionId = result.transactionId;
            payment.status = 'processing';
            
            if (hasSplitPayment) {
                payment.metadata = {
                    ...(payment.metadata || {}),
                    platformFee,
                    amountToTransfer,
                    partnerAccountId: user.paymentProviderId
                };
            }
            
            await payment.save();

            logInfo('Payment created successfully', {
                paymentId: payment._id,
                userId,
                provider: gateway.type,
                amount: payment.amount,
                platformFee,
                amountToTransfer,
                splitPayment: hasSplitPayment
            });

            return {
                success: true,
                payment,
                paymentUrl: result.paymentUrl,
                transactionId: result.transactionId,
                splitPayment: {
                    enabled: hasSplitPayment,
                    platformFee,
                    amountToTransfer
                }
            };

        } catch (error) {
            logError('Failed to create payment', error, { userId, customerId });
            throw error;
        }
    }

    async getPaymentStatus(userId, paymentId) {
        try {
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                throw new Error('Payment not found');
            }

            if (payment.status === 'completed' || payment.status === 'failed') {
                return payment;
            }

            const provider = await this.getProviderForUser(userId);
            const status = await provider.getPaymentStatus(payment.transactionId);

            payment.status = status.status;
            payment.authNumber = status.authNumber;
            payment.confirmationCode = status.confirmationCode;

            if (status.card) {
                payment.cardLast4 = status.card.last4;
            }

            await payment.save();

            logInfo('Payment status updated', {
                paymentId: payment._id,
                userId,
                status: payment.status
            });

            return payment;

        } catch (error) {
            logError('Failed to get payment status', error, { paymentId, userId });
            throw error;
        }
    }

    async handlePaymentWebhook(userId, payload) {
        try {
            const provider = await this.getProviderForUser(userId);
            
            const isValid = await provider.validateWebhook(payload);
            if (!isValid) {
                throw new Error('Invalid webhook signature');
            }

            const payment = await Payment.findOne({
                transactionId: payload.transactionId || payload.processId,
                userId
            });

            if (!payment) {
                throw new Error('Payment not found for webhook');
            }

            if (payload.status === 'success' || payload.Response === '000') {
                payment.status = 'completed';
                payment.paidAt = new Date();
                payment.authNumber = payload.authNumber || payload.ConfirmationCode;
                payment.confirmationCode = payload.approvalNumber || payload.ConfirmationCode;
            } else {
                payment.status = 'failed';
                payment.failedReason = payload.error || 'Payment failed';
            }

            await payment.save();

            logInfo('Webhook processed successfully', {
                userId,
                paymentId: payment._id,
                status: payment.status
            });

            // Auto-generate receipt for completed payments
            if (payment.status === 'completed') {
                const ReceiptService = require('./ReceiptService');
                await ReceiptService.autoGenerateReceipt(userId, payment._id.toString());
            }

            return payment;

        } catch (error) {
            logError('Failed to process webhook', error, { userId });
            throw error;
        }
    }

    async refundPayment(userId, paymentId, amount, reason) {
        try {
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                throw new Error('Payment not found');
            }

            if (payment.status !== 'completed') {
                throw new Error('Only completed payments can be refunded');
            }

            const provider = await this.getProviderForUser(userId);
            const refundAmount = amount || payment.amount;

            const result = await provider.refundPayment(
                payment.transactionId,
                refundAmount,
                reason
            );

            payment.status = 'refunded';
            payment.refundedAt = new Date();
            payment.refundAmount = refundAmount;
            payment.refundReason = reason;
            payment.refundTransactionId = result.refundTransactionId;
            await payment.save();

            logInfo('Payment refunded successfully', {
                paymentId: payment._id,
                userId,
                refundAmount,
                reason
            });

            return {
                success: true,
                payment,
                refund: result
            };

        } catch (error) {
            logError('Failed to refund payment', error, { paymentId, userId });
            throw error;
        }
    }

    async getUserPayments(userId, filters = {}) {
        try {
            const query = { userId };

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
            logError('Failed to get user payments', error, { userId });
            throw error;
        }
    }

    async getUserRevenue(userId, startDate, endDate) {
        try {
            const query = {
                userId,
                status: 'completed',
                paidAt: {}
            };

            if (startDate) query.paidAt.$gte = new Date(startDate);
            if (endDate) query.paidAt.$lte = new Date(endDate);

            const payments = await Payment.find(query);

            const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
            const totalPayments = payments.length;

            logInfo('User revenue calculated', {
                userId,
                totalRevenue,
                totalPayments
            });

            return {
                totalRevenue,
                totalPayments,
                averagePayment: totalPayments > 0 ? totalRevenue / totalPayments : 0
            };

        } catch (error) {
            logError('Failed to get user revenue', error, { userId });
            throw error;
        }
    }
}

module.exports = new PaymentService();
