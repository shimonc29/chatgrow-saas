const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const paymentService = require('../services/paymentService');
const { logInfo, logError, logApiRequest } = require('../utils/logger');

// Import the shared verifyProviderToken middleware from auth routes
const authRouter = require('./auth');
const verifyProviderToken = authRouter.verifyProviderToken;

// Get payment providers list (MUST be before /:id route)
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

// Get all payments
router.get('/', verifyProviderToken, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { status, startDate, endDate, customerId } = req.query;
        const query = { businessId: req.provider.providerId };
        
        if (status) {
            query.status = status;
        }
        
        if (customerId) {
            query.customerId = customerId;
        }
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }
        
        const payments = await Payment.find(query)
            .populate('customerId', 'firstName lastName phone email')
            .sort({ createdAt: -1 });
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime, {
            businessId: req.provider.providerId,
            paymentCount: payments.length
        });
        
        res.json({
            success: true,
            payments
        });
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get single payment by ID
router.get('/:id', verifyProviderToken, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const payment = await Payment.findOne({
            _id: req.params.id,
            businessId: req.provider.providerId
        }).populate('customerId', 'firstName lastName phone email');
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'תשלום לא נמצא'
            });
        }
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime, {
            businessId: req.provider.providerId,
            paymentId: req.params.id
        });
        
        res.json({
            success: true,
            payment
        });
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Create payment (manual or via payment gateway)
router.post('/create', verifyProviderToken, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const businessId = req.provider.providerId;
        const { customerId, amount, currency, paymentMethod, provider, customer, billing, relatedTo, notes, metadata } = req.body;

        if (!customerId || !amount || !customer) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: customerId, amount, customer'
            });
        }

        // For manual payments, create directly in DB without calling paymentService
        if (!provider || provider === 'manual') {
            const payment = new Payment({
                businessId,
                customerId,
                amount: parseFloat(amount),
                currency: currency || 'ILS',
                paymentMethod: paymentMethod || 'cash',
                status: 'pending',
                customer: {
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone
                },
                provider: {
                    name: 'manual',
                    displayName: 'תשלום ידני'
                },
                notes,
                metadata: metadata || {},
                relatedTo
            });

            await payment.save();

            logApiRequest(req.method, req.originalUrl, 201, Date.now() - startTime, {
                businessId,
                paymentId: payment._id,
                amount: payment.amount
            });

            return res.status(201).json({
                success: true,
                payment,
                message: 'תשלום נוצר בהצלחה'
            });
        }

        // For gateway payments, use paymentService
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
            successUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/payment/success`,
            errorUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/payment/error`
        };

        const result = await paymentService.createPayment(businessId, customerId, paymentData);

        logApiRequest(req.method, req.originalUrl, 201, Date.now() - startTime, {
            businessId,
            paymentId: result.payment._id,
            amount: result.payment.amount
        });

        res.status(201).json({
            success: true,
            payment: result.payment,
            paymentUrl: result.paymentUrl,
            transactionId: result.transactionId,
            message: 'תשלום נוצר בהצלחה'
        });

    } catch (error) {
        logError('Failed to create payment via API', error);
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'שגיאה ביצירת התשלום: ' + error.message
        });
    }
});

// Update payment
router.put('/:id', verifyProviderToken, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const payment = await Payment.findOne({
            _id: req.params.id,
            businessId: req.provider.providerId
        });
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'תשלום לא נמצא'
            });
        }
        
        const allowedUpdates = ['status', 'notes', 'metadata'];
        const updates = {};
        
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });
        
        const updatedPayment = await Payment.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        ).populate('customerId', 'firstName lastName phone email');
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime, {
            businessId: req.provider.providerId,
            paymentId: req.params.id
        });
        
        res.json({
            success: true,
            payment: updatedPayment,
            message: 'תשלום עודכן בהצלחה'
        });
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete payment
router.delete('/:id', verifyProviderToken, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const payment = await Payment.findOneAndDelete({
            _id: req.params.id,
            businessId: req.provider.providerId
        });
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'תשלום לא נמצא'
            });
        }
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime, {
            businessId: req.provider.providerId,
            paymentId: req.params.id
        });
        
        res.json({
            success: true,
            message: 'תשלום נמחק בהצלחה'
        });
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Complete payment (manual completion)
router.post('/:id/complete', verifyProviderToken, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const payment = await Payment.findOne({
            _id: req.params.id,
            businessId: req.provider.providerId
        });
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'תשלום לא נמצא'
            });
        }
        
        if (payment.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'תשלום כבר הושלם'
            });
        }
        
        payment.status = 'completed';
        payment.metadata = {
            ...payment.metadata,
            completedAt: new Date(),
            completedBy: req.provider.providerId,
            completionMethod: 'manual',
            ...(req.body.providerData || {})
        };
        
        await payment.save();
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime, {
            businessId: req.provider.providerId,
            paymentId: req.params.id
        });
        
        res.json({
            success: true,
            payment,
            message: 'תשלום סומן כהושלם'
        });
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get('/:paymentId/status', verifyProviderToken, async (req, res) => {
    try {
        const payment = await Payment.findOne({
            _id: req.params.paymentId,
            businessId: req.provider.providerId
        });
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'תשלום לא נמצא'
            });
        }
        
        res.json({ success: true, payment, status: payment.status });
    } catch (error) {
        logError('Failed to get payment status', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/:paymentId/refund', verifyProviderToken, async (req, res) => {
    try {
        const payment = await Payment.findOne({
            _id: req.params.paymentId,
            businessId: req.provider.providerId
        });
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'תשלום לא נמצא'
            });
        }
        
        const { amount, reason } = req.body;
        const result = await paymentService.refundPayment(req.params.paymentId, amount, reason);
        res.json({ success: true, payment: result.payment, refund: result.refund, message: 'התשלום זוכה בהצלחה' });
    } catch (error) {
        logError('Failed to refund payment', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/list', verifyProviderToken, async (req, res) => {
    try {
        const { status, startDate, endDate, customerId, limit } = req.query;
        const filters = { status, startDate, endDate, customerId, limit: limit ? parseInt(limit) : 100 };
        const payments = await paymentService.getBusinessPayments(req.provider.providerId, filters);
        res.json({ success: true, payments, count: payments.length });
    } catch (error) {
        logError('Failed to get payments list', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/revenue', verifyProviderToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const revenue = await paymentService.getBusinessRevenue(req.provider.providerId, startDate, endDate);
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

module.exports = router;
