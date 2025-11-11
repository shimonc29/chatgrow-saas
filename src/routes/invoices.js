const express = require('express');
const router = express.Router();
const invoiceService = require('../services/invoiceService');
const { logInfo, logError } = require('../utils/logger');
const auth = require('../middleware/auth');

const authenticate = auth.authenticate();

router.post('/create', authenticate, async (req, res) => {
    try {
        const businessId = req.user.id;
        const invoiceData = req.body;

        if (!invoiceData.customerId || !invoiceData.items || invoiceData.items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: customerId, items'
            });
        }

        const result = await invoiceService.createInvoice(businessId, invoiceData);

        logInfo('Invoice created via API', {
            businessId,
            invoiceId: result.invoice._id,
            invoiceNumber: result.invoice.invoiceNumber
        });

        res.status(201).json({
            success: true,
            invoice: result.invoice,
            message: 'חשבונית נוצרה בהצלחה'
        });

    } catch (error) {
        logError('Failed to create invoice via API', error, {
            businessId: req.user?.id
        });

        res.status(500).json({
            success: false,
            error: error.message,
            message: 'שגיאה ביצירת החשבונית'
        });
    }
});

router.post('/:invoiceId/generate-pdf', authenticate, async (req, res) => {
    try {
        const { invoiceId } = req.params;

        const result = await invoiceService.generatePDF(invoiceId);

        res.json({
            success: true,
            filePath: result.filePath,
            fileName: result.fileName,
            message: 'PDF נוצר בהצלחה'
        });

    } catch (error) {
        logError('Failed to generate PDF', error, {
            invoiceId: req.params.invoiceId
        });

        res.status(500).json({
            success: false,
            error: error.message,
            message: 'שגיאה ביצירת PDF'
        });
    }
});

router.post('/:invoiceId/send', authenticate, async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const { to, subject } = req.body;

        const result = await invoiceService.sendInvoiceByEmail(invoiceId, { to, subject });

        res.json({
            success: true,
            invoice: result.invoice,
            message: 'החשבונית נשלחה בהצלחה'
        });

    } catch (error) {
        logError('Failed to send invoice', error, {
            invoiceId: req.params.invoiceId
        });

        res.status(500).json({
            success: false,
            error: error.message,
            message: 'שגיאה בשליחת החשבונית'
        });
    }
});

router.post('/from-payment/:paymentId', authenticate, async (req, res) => {
    try {
        const { paymentId } = req.params;

        const result = await invoiceService.createInvoiceFromPayment(paymentId);

        logInfo('Invoice created from payment', {
            paymentId,
            invoiceId: result.invoice._id
        });

        res.status(201).json({
            success: true,
            invoice: result.invoice,
            message: 'חשבונית נוצרה מהתשלום בהצלחה'
        });

    } catch (error) {
        logError('Failed to create invoice from payment', error, {
            paymentId: req.params.paymentId
        });

        res.status(500).json({
            success: false,
            error: error.message,
            message: 'שגיאה ביצירת חשבונית מהתשלום'
        });
    }
});

router.get('/list', authenticate, async (req, res) => {
    try {
        const businessId = req.user.id;
        const { status, startDate, endDate, limit } = req.query;

        const filters = {
            status,
            startDate,
            endDate,
            limit: limit ? parseInt(limit) : 100
        };

        const invoices = await invoiceService.getBusinessInvoices(businessId, filters);

        res.json({
            success: true,
            invoices,
            count: invoices.length
        });

    } catch (error) {
        logError('Failed to get invoices list', error, {
            businessId: req.user?.id
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/:invoiceId', authenticate, async (req, res) => {
    try {
        const Invoice = require('../models/Invoice');
        const invoice = await Invoice.findById(req.params.invoiceId);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                error: 'Invoice not found'
            });
        }

        res.json({
            success: true,
            invoice
        });

    } catch (error) {
        logError('Failed to get invoice', error, {
            invoiceId: req.params.invoiceId
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.patch('/:invoiceId/status', authenticate, async (req, res) => {
    try {
        const Invoice = require('../models/Invoice');
        const { status } = req.body;
        
        const invoice = await Invoice.findById(req.params.invoiceId);
        if (!invoice) {
            return res.status(404).json({
                success: false,
                error: 'Invoice not found'
            });
        }

        if (status === 'paid') {
            await invoice.markAsPaid();
        } else if (status === 'cancelled') {
            await invoice.cancel();
        } else {
            invoice.status = status;
            await invoice.save();
        }

        res.json({
            success: true,
            invoice,
            message: 'סטטוס החשבונית עודכן'
        });

    } catch (error) {
        logError('Failed to update invoice status', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
