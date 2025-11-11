const express = require('express');
const router = express.Router();
const ReceiptService = require('../services/ReceiptService');
const auth = require('../middleware/auth');
const { logInfo, logError } = require('../utils/logger');
const path = require('path');

const authenticateToken = auth.authenticate();

// Generate receipt for a payment
router.post('/generate/:paymentId', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const receipt = await ReceiptService.generateReceipt(
      req.user.id,
      paymentId
    );

    res.json({
      success: true,
      message: 'Receipt generated successfully',
      receipt
    });
  } catch (error) {
    logError('Receipt generation failed', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: error.message });
  }
});

// Generate manual receipt
router.post('/manual', authenticateToken, async (req, res) => {
  try {
    const receiptData = req.body;

    const receipt = await ReceiptService.generateManualReceipt(
      req.user.id,
      receiptData
    );

    res.json({
      success: true,
      message: 'Manual receipt generated successfully',
      receipt
    });
  } catch (error) {
    logError('Manual receipt generation failed', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: error.message });
  }
});

// List all receipts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const filters = {
      status: req.query.status
    };

    const receipts = await ReceiptService.listReceipts(req.user.id, filters);

    res.json(receipts);
  } catch (error) {
    logError('Failed to list receipts', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: error.message });
  }
});

// Download receipt PDF
router.get('/download/:receiptNumber', authenticateToken, async (req, res) => {
  try {
    const { receiptNumber } = req.params;
    const receiptsDir = path.join(__dirname, '../../receipts');
    const fileName = `receipt_${receiptNumber.replace('/', '_')}`;
    
    // Find the file (there may be a timestamp)
    const fs = require('fs');
    const files = fs.readdirSync(receiptsDir).filter(f => f.startsWith(fileName));
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'Receipt file not found' });
    }

    const filePath = path.join(receiptsDir, files[0]);
    res.download(filePath);
  } catch (error) {
    logError('Receipt download failed', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
