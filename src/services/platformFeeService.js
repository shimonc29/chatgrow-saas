const Payment = require('../models/Payment');
const Subscriber = require('../models/Subscriber');
const invoicingIntegrationService = require('./invoicingIntegrationService');
const { logInfo, logError } = require('../utils/logger');

class PlatformFeeService {
  async calculateMonthlyFees() {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      const payments = await Payment.find({
        createdAt: {
          $gte: startOfMonth,
          $lt: endOfMonth
        },
        status: 'completed',
        'metadata.platformFee': { $exists: true }
      });

      const feesByBusiness = {};

      payments.forEach(payment => {
        const userId = payment.userId || payment.businessId;
        const fee = payment.metadata.platformFee || 0;

        if (!feesByBusiness[userId]) {
          feesByBusiness[userId] = {
            userId,
            totalFees: 0,
            paymentCount: 0,
            payments: []
          };
        }

        feesByBusiness[userId].totalFees += fee;
        feesByBusiness[userId].paymentCount += 1;
        feesByBusiness[userId].payments.push({
          paymentId: payment._id,
          amount: payment.amount,
          fee: fee,
          date: payment.createdAt
        });
      });

      logInfo('Monthly platform fees calculated', {
        businessCount: Object.keys(feesByBusiness).length,
        totalFees: Object.values(feesByBusiness).reduce((sum, b) => sum + b.totalFees, 0)
      });

      return feesByBusiness;
    } catch (error) {
      logError('Failed to calculate monthly fees', { error: error.message });
      throw error;
    }
  }

  async generateMonthlyInvoicesForFees() {
    try {
      const feesByBusiness = await this.calculateMonthlyFees();
      const results = [];

      for (const [userId, feeData] of Object.entries(feesByBusiness)) {
        try {
          const user = await Subscriber.findById(userId);
          
          if (!user || !user.email) {
            logError('User not found for fee invoice', { userId });
            continue;
          }

          const platformDetails = {
            name: process.env.PLATFORM_NAME || 'ChatGrow',
            email: process.env.PLATFORM_EMAIL || 'billing@chatgrow.com',
            phone: process.env.PLATFORM_PHONE || '052-XXX-XXXX',
            businessId: process.env.PLATFORM_BUSINESS_ID || '123456789'
          };

          const customerDetails = {
            firstName: user.profile?.firstName || '',
            lastName: user.profile?.lastName || user.email.split('@')[0],
            email: user.email,
            phone: user.profile?.phone || '',
            businessName: user.profile?.businessName || ''
          };

          const items = [{
            description: `עמלת פלטפורמה - ${new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })} (${feeData.paymentCount} תשלומים)`,
            quantity: 1,
            price: feeData.totalFees
          }];

          const invoiceResult = await invoicingIntegrationService.createInvoiceForCustomer(
            platformDetails,
            customerDetails,
            items,
            feeData.totalFees
          );

          results.push({
            userId,
            email: user.email,
            totalFees: feeData.totalFees,
            paymentCount: feeData.paymentCount,
            invoice: invoiceResult
          });

          logInfo('Monthly fee invoice generated', {
            userId,
            email: user.email,
            totalFees: feeData.totalFees,
            invoiceId: invoiceResult.invoiceId
          });

        } catch (error) {
          logError('Failed to generate fee invoice for business', {
            userId,
            error: error.message
          });
          results.push({
            userId,
            error: error.message,
            failed: true
          });
        }
      }

      return {
        success: true,
        totalBusinesses: Object.keys(feesByBusiness).length,
        successfulInvoices: results.filter(r => !r.failed).length,
        failedInvoices: results.filter(r => r.failed).length,
        results
      };

    } catch (error) {
      logError('Failed to generate monthly fee invoices', { error: error.message });
      throw error;
    }
  }

  async getFeeReportForBusiness(userId, startDate, endDate) {
    try {
      const payments = await Payment.find({
        $or: [{ userId }, { businessId: userId }],
        createdAt: {
          $gte: startDate,
          $lte: endDate
        },
        status: 'completed',
        'metadata.platformFee': { $exists: true }
      });

      const totalFees = payments.reduce((sum, p) => sum + (p.metadata.platformFee || 0), 0);
      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

      return {
        userId,
        startDate,
        endDate,
        paymentCount: payments.length,
        totalRevenue,
        totalFees,
        feePercentage: totalRevenue > 0 ? ((totalFees / totalRevenue) * 100).toFixed(2) : 0,
        payments: payments.map(p => ({
          paymentId: p._id,
          amount: p.amount,
          fee: p.metadata.platformFee,
          date: p.createdAt
        }))
      };
    } catch (error) {
      logError('Failed to get fee report for business', {
        userId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new PlatformFeeService();
