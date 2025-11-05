const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const { logInfo, logError } = require('../utils/logger');
const { authenticate } = require('../middleware/auth');

router.post('/create', authenticate, async (req, res) => {
    try {
        const businessId = req.user.id;
        const { customerId, amount, currency, paymentMethod, provider, customer, billing, relatedTo, notes, metadata, successUrl, errorUrl } = req.body;

        if (!customerId || !amount || !customer) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: customerId, amount, customer'
            });
        }

        const paymentData = {
            amount,
            currency: currency || 'ILS',
            paymentMethod: paymentMethod || 'credit_card',
            provider,
            customer,
            billing,
            relatedTo,
            notes,
            metadata,
            successUrl: successUrl || `${process.env.BASE_URL || 'http://localhost:5000'}/payment/success`,
            errorUrl: errorUrl || `${process.env.BASE_URL || 'http://localhost:5000'}/payment/error`
        };

        const result = await paymentService.createPayment(businessId, customerId, paymentData);

        res.status(201).json({
            success: true,
            payment: result.payment,
            paymentUrl: result.paymentUrl,
            transactionId: result.transactionId,
            message: 'תשלום נוצר בהצלחה'
        });

    } catch (error) {
        logError('Failed to create payment via API', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'שגיאה ביצירת התשלום'
        });
    }
});

router.get('/:paymentId/status', authenticate, async (req, res) => {
    try {
        const payment = await paymentService.getPaymentStatus(req.params.paymentId);
        res.json({ success: true, payment, status: payment.status });
    } catch (error) {
        logError('Failed to get payment status', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/:paymentId/refund', authenticate, async (req, res) => {
    try {
        const { amount, reason } = req.body;
        const result = await paymentService.refundPayment(req.params.paymentId, amount, reason);
        res.json({ success: true, payment: result.payment, refund: result.refund, message: 'התשלום זוכה בהצלחה' });
    } catch (error) {
        logError('Failed to refund payment', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/list', authenticate, async (req, res) => {
    try {
        const { status, startDate, endDate, customerId, limit } = req.query;
        const filters = { status, startDate, endDate, customerId, limit: limit ? parseInt(limit) : 100 };
        const payments = await paymentService.getBusinessPayments(req.user.id, filters);
        res.json({ success: true, payments, count: payments.length });
    } catch (error) {
        logError('Failed to get payments list', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/revenue', authenticate, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const revenue = await paymentService.getBusinessRevenue(req.user.id, startDate, endDate);
        res.json({ success: true, revenue });
    } catch (error) {
        logError('Failed to get business revenue', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/webhook/:provider', async (req, res) => {
    try {
        const payment = await paymentService.handlePaymentWebhook(req.params.provider, req.body);
        res.json({ success: true, status: 'processed' });
    } catch (error) {
        logError('Failed to process webhook', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/providers', (req, res) => {
    res.json({
        success: true,
        providers: [
            {
                name: 'cardcom',
                displayName: 'Cardcom',
                supported: !!process.env.CARDCOM_TERMINAL_NUMBER && !!process.env.CARDCOM_API_KEY,
                currency: ['ILS', 'USD', 'EUR']
            },
            {
                name: 'meshulam',
                displayName: 'Meshulam (Grow)',
                supported: !!process.env.MESHULAM_API_KEY && !!process.env.MESHULAM_PAGE_CODE,
                currency: ['ILS', 'USD', 'EUR']
            },
            {
                name: 'tranzila',
                displayName: 'Tranzila',
                supported: !!process.env.TRANZILA_TERMINAL_NAME,
                currency: ['ILS', 'USD', 'EUR', 'GBP']
            }
        ],
        defaultProvider: process.env.PAYMENT_PROVIDER || 'cardcom'
    });
});

module.exports = router;
