const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const ProviderSettings = require('../models/ProviderSettings');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const { logInfo, logError } = require('../utils/logger');

class ReceiptService {
  /**
   * Generate Receipt PDF in Hebrew
   * @param {string} userId - Provider's user ID
   * @param {string} paymentId - Payment ID
   * @returns {Object} - { receiptNumber, filePath, fileName }
   */
  static async generateReceipt(userId, paymentId) {
    try {
      // Get provider settings
      const settings = await ProviderSettings.findOne({ userId, isActive: true });
      if (!settings) {
        throw new Error('Provider settings not found');
      }

      // Get payment details
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Only generate receipt for completed payments
      if (payment.status !== 'completed') {
        throw new Error('Receipt can only be generated for completed payments');
      }

      // Get customer details
      const customer = await Customer.findById(payment.customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Generate receipt number
      const receiptNumber = await settings.generateReceiptNumber();

      // Create PDF
      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      // Create receipts directory if not exists
      const receiptsDir = path.join(__dirname, '../../receipts');
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      const fileName = `receipt_${receiptNumber.replace('/', '_')}_${Date.now()}.pdf`;
      const filePath = path.join(receiptsDir, fileName);
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // --- PDF Content (RTL Hebrew) ---

      // Header
      doc.fontSize(24)
         .fillColor('#FFD700')
         .text('👑 ChatGrow', { align: 'right' });

      doc.fontSize(28)
         .fillColor('#000000')
         .text('קבלה', { align: 'right' })
         .moveDown();

      // Company Info
      doc.fontSize(10)
         .fillColor('#000000');
      
      if (settings.invoiceSettings.companyName) {
        doc.text(`שם החברה: ${settings.invoiceSettings.companyName}`, { align: 'right' });
      }
      if (settings.invoiceSettings.companyNumber) {
        doc.text(`ח.פ: ${settings.invoiceSettings.companyNumber}`, { align: 'right' });
      }
      if (settings.invoiceSettings.vatNumber) {
        doc.text(`מספר עוסק מורשה: ${settings.invoiceSettings.vatNumber}`, { align: 'right' });
      }
      if (settings.invoiceSettings.address) {
        const addr = settings.invoiceSettings.address;
        doc.text(`כתובת: ${addr.street || ''}, ${addr.city || ''} ${addr.postalCode || ''}`, { align: 'right' });
      }
      if (settings.invoiceSettings.phone) {
        doc.text(`טלפון: ${settings.invoiceSettings.phone}`, { align: 'right' });
      }

      doc.moveDown();

      // Receipt Details
      doc.fontSize(12)
         .fillColor('#FFD700')
         .text('פרטי קבלה', { align: 'right' })
         .fontSize(10)
         .fillColor('#000000');

      doc.text(`מספר קבלה: ${receiptNumber}`, { align: 'right' });
      doc.text(`תאריך: ${new Date().toLocaleDateString('he-IL')}`, { align: 'right' });
      doc.text(`שיטת תשלום: ${this.getHebrewPaymentMethod(payment.method)}`, { align: 'right' });
      
      if (payment.transactionId) {
        doc.text(`מספר עסקה: ${payment.transactionId}`, { align: 'right' });
      }

      doc.moveDown();

      // Customer Details
      doc.fontSize(12)
         .fillColor('#FFD700')
         .text('פרטי מקבל', { align: 'right' })
         .fontSize(10)
         .fillColor('#000000');

      doc.text(`שם: ${customer.firstName || ''} ${customer.lastName || ''}`, { align: 'right' });
      if (customer.email) {
        doc.text(`אימייל: ${customer.email}`, { align: 'right' });
      }
      if (customer.phone) {
        doc.text(`טלפון: ${customer.phone}`, { align: 'right' });
      }

      doc.moveDown(2);

      // Payment Box (Highlighted)
      const boxTop = doc.y;
      doc.rect(50, boxTop, 495, 80)
         .fillAndStroke('#FFF9E6', '#FFD700');

      doc.fontSize(14)
         .fillColor('#000000')
         .text('סכום ששולם', 70, boxTop + 15, { align: 'right', width: 455 });

      doc.fontSize(24)
         .fillColor('#FFD700')
         .text(`₪${payment.amount.toFixed(2)}`, 70, boxTop + 40, { align: 'center', width: 455 });

      doc.moveDown(4);

      // Description
      if (payment.description) {
        doc.fontSize(11)
           .fillColor('#000000')
           .text(`תיאור: ${payment.description}`, { align: 'right' });
      }

      doc.moveDown();

      // Payment date
      doc.fontSize(10)
         .fillColor('#666666')
         .text(`תאריך תשלום: ${new Date(payment.paidAt || payment.createdAt).toLocaleDateString('he-IL')}`, { align: 'right' });

      // Thank you message
      doc.moveDown(2)
         .fontSize(12)
         .fillColor('#FFD700')
         .text('תודה רבה על התשלום!', { align: 'center' });

      // Notes
      if (settings.invoiceSettings.notes) {
        doc.moveDown()
           .fontSize(9)
           .fillColor('#999999')
           .text(settings.invoiceSettings.notes, { align: 'right' });
      }

      // Footer
      doc.fontSize(8)
         .fillColor('#CCCCCC')
         .text('קבלה זו הופקה באמצעות מערכת ChatGrow', 50, 750, { align: 'center' });

      // Finalize PDF
      doc.end();

      // Wait for file to be written
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // Update payment with receipt number
      payment.receiptNumber = receiptNumber;
      payment.receiptGenerated = true;
      payment.receiptGeneratedAt = new Date();
      await payment.save();

      logInfo(`Receipt ${receiptNumber} generated successfully`, { userId, paymentId });

      return {
        receiptNumber,
        filePath,
        fileName
      };

    } catch (error) {
      logError('Receipt generation failed', { error: error.message, userId, paymentId });
      throw error;
    }
  }

  /**
   * Generate Receipt Manually
   */
  static async generateManualReceipt(userId, receiptData) {
    try {
      const settings = await ProviderSettings.findOne({ userId, isActive: true });
      if (!settings) {
        throw new Error('Provider settings not found');
      }

      const receiptNumber = await settings.generateReceiptNumber();

      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const receiptsDir = path.join(__dirname, '../../receipts');
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      const fileName = `receipt_${receiptNumber.replace('/', '_')}_${Date.now()}.pdf`;
      const filePath = path.join(receiptsDir, fileName);
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Similar structure to generateReceipt but with receiptData
      doc.fontSize(24).fillColor('#FFD700').text('👑 ChatGrow', { align: 'right' });
      doc.fontSize(28).fillColor('#000000').text('קבלה', { align: 'right' }).moveDown();
      
      doc.fontSize(10).text(`מספר קבלה: ${receiptNumber}`, { align: 'right' });
      doc.text(`תאריך: ${new Date().toLocaleDateString('he-IL')}`, { align: 'right' });
      doc.moveDown();

      // Amount box
      const boxTop = doc.y + 50;
      doc.rect(50, boxTop, 495, 80).fillAndStroke('#FFF9E6', '#FFD700');
      doc.fontSize(24).fillColor('#FFD700')
         .text(`₪${receiptData.amount.toFixed(2)}`, 70, boxTop + 30, { align: 'center', width: 455 });

      doc.end();

      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      logInfo(`Manual receipt ${receiptNumber} generated`, { userId });

      return {
        receiptNumber,
        filePath,
        fileName
      };

    } catch (error) {
      logError('Manual receipt generation failed', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get Hebrew payment method
   */
  static getHebrewPaymentMethod(method) {
    const methodMap = {
      'credit_card': 'כרטיס אשראי',
      'debit_card': 'כרטיס חיוב',
      'bank_transfer': 'העברה בנקאית',
      'cash': 'מזומן',
      'check': 'המחאה',
      'paypal': 'PayPal',
      'other': 'אחר'
    };
    return methodMap[method] || method;
  }

  /**
   * List all receipts for a provider
   */
  static async listReceipts(userId, filters = {}) {
    try {
      const query = { userId };
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      const payments = await Payment.find({
        ...query,
        receiptGenerated: true
      }).sort({ receiptGeneratedAt: -1 });

      return payments.map(p => ({
        id: p._id,
        receiptNumber: p.receiptNumber,
        amount: p.amount,
        method: p.method,
        customerName: p.customerName,
        generatedAt: p.receiptGeneratedAt,
        description: p.description
      }));

    } catch (error) {
      logError('Failed to list receipts', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Auto-generate receipt after successful payment
   */
  static async autoGenerateReceipt(userId, paymentId) {
    try {
      const payment = await Payment.findById(paymentId);
      
      // Only auto-generate for completed payments
      if (payment && payment.status === 'completed' && !payment.receiptGenerated) {
        return await this.generateReceipt(userId, paymentId);
      }
      
      return null;
    } catch (error) {
      logError('Auto receipt generation failed', { error: error.message, userId, paymentId });
      // Don't throw - this is automatic, failures shouldn't break the payment flow
      return null;
    }
  }
}

module.exports = ReceiptService;
