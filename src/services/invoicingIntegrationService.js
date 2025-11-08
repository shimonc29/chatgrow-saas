const axios = require('axios');
const { logInfo, logError } = require('../utils/logger');

class InvoicingIntegrationService {
  constructor() {
    this.provider = process.env.INVOICING_PROVIDER || 'mock';
  }

  async createInvoiceForCustomer(businessDetails, customerDetails, items, amount) {
    try {
      if (this.provider === 'green_invoice') {
        return await this.createGreenInvoice(businessDetails, customerDetails, items, amount);
      } else if (this.provider === 'icount') {
        return await this.createICountInvoice(businessDetails, customerDetails, items, amount);
      } else {
        return this.createMockInvoice(businessDetails, customerDetails, items, amount);
      }
    } catch (error) {
      logError('Failed to create invoice via integration', {
        provider: this.provider,
        error: error.message
      });
      throw error;
    }
  }

  async createGreenInvoice(businessDetails, customerDetails, items, amount) {
    const apiKey = businessDetails.greenInvoiceApiKey || process.env.GREEN_INVOICE_API_KEY;
    const apiSecret = businessDetails.greenInvoiceApiSecret || process.env.GREEN_INVOICE_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('Green Invoice API credentials not configured');
    }

    const invoiceData = {
      type: 320,
      lang: 'he',
      currency: 'ILS',
      client: {
        name: `${customerDetails.firstName} ${customerDetails.lastName}`,
        emails: [customerDetails.email],
        phone: customerDetails.phone
      },
      income: items.map(item => ({
        description: item.description,
        quantity: item.quantity || 1,
        price: item.price,
        currency: 'ILS',
        vatType: 0
      })),
      remarks: businessDetails.remarks || ''
    };

    const response = await axios.post(
      'https://api.greeninvoice.co.il/api/v1/documents',
      invoiceData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-API-SECRET': apiSecret,
          'Content-Type': 'application/json'
        }
      }
    );

    logInfo('Green Invoice created successfully', {
      invoiceId: response.data.id,
      amount
    });

    return {
      success: true,
      invoiceId: response.data.id,
      invoiceUrl: response.data.url,
      provider: 'green_invoice',
      data: response.data
    };
  }

  async createICountInvoice(businessDetails, customerDetails, items, amount) {
    const apiKey = businessDetails.iCountApiKey || process.env.ICOUNT_API_KEY;
    const companyId = businessDetails.iCountCompanyId || process.env.ICOUNT_COMPANY_ID;

    if (!apiKey || !companyId) {
      throw new Error('iCount API credentials not configured');
    }

    const invoiceData = {
      company_id: companyId,
      client_name: `${customerDetails.firstName} ${customerDetails.lastName}`,
      client_email: customerDetails.email,
      client_phone: customerDetails.phone,
      items: items.map(item => ({
        name: item.description,
        quantity: item.quantity || 1,
        price: item.price,
        total: (item.quantity || 1) * item.price
      })),
      currency: 'ILS',
      lang: 'he'
    };

    const response = await axios.post(
      'https://api.icount.co.il/api/v3.php/doc/create',
      invoiceData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logInfo('iCount Invoice created successfully', {
      invoiceId: response.data.doc_id,
      amount
    });

    return {
      success: true,
      invoiceId: response.data.doc_id,
      invoiceUrl: response.data.doc_url,
      provider: 'icount',
      data: response.data
    };
  }

  createMockInvoice(businessDetails, customerDetails, items, amount) {
    const invoiceId = `MOCK_INV_${Date.now()}`;
    
    logInfo('Mock invoice created', {
      invoiceId,
      amount,
      customer: customerDetails.email
    });

    return {
      success: true,
      invoiceId,
      invoiceUrl: `https://example.com/invoice/${invoiceId}`,
      provider: 'mock',
      data: {
        id: invoiceId,
        customer: customerDetails,
        items,
        total: amount,
        status: 'sent'
      }
    };
  }
}

module.exports = new InvoicingIntegrationService();
