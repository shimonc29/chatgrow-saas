const PaymentProvider = require('../PaymentProvider');
const axios = require('axios');
const crypto = require('crypto');

class CardcomProvider extends PaymentProvider {
    constructor(config = {}) {
        super(config);
        this.name = 'cardcom';
        this.terminalNumber = config.terminalNumber || process.env.CARDCOM_TERMINAL_NUMBER;
        this.apiKey = config.apiKey || process.env.CARDCOM_API_KEY;
        this.apiUrl = config.sandbox ? 
            'https://secure.cardcom.solutions/api/v11' : 
            'https://secure.cardcom.solutions/api/v11';
    }

    async initialize() {
        if (!this.terminalNumber || !this.apiKey) {
            throw new Error('Cardcom terminal number and API key are required');
        }
        return true;
    }

    async createPaymentPage(paymentData) {
        this.validatePaymentData(paymentData);

        const payload = {
            TerminalNumber: this.terminalNumber,
            ApiName: this.apiKey,
            
            Amount: this.formatAmount(paymentData.amount),
            Currency: this.getCurrencyCode(paymentData.currency),
            
            CustomerName: paymentData.customer.name,
            CustomerEmail: paymentData.customer.email,
            CustomerPhone: paymentData.customer.phone,
            
            ReturnValue: paymentData.orderId || paymentData.referenceId,
            
            SuccessUrl: paymentData.successUrl || `${process.env.BASE_URL}/payment/success`,
            ErrorUrl: paymentData.errorUrl || `${process.env.BASE_URL}/payment/error`,
            
            InvoiceHead: {
                CustomerName: paymentData.billing?.firstName + ' ' + paymentData.billing?.lastName,
                SendEmail: paymentData.sendInvoice !== false,
                Language: 'he'
            }
        };

        if (paymentData.items && paymentData.items.length > 0) {
            payload.InvoiceLines = paymentData.items.map(item => ({
                Description: item.description,
                Quantity: item.quantity,
                UnitPrice: this.formatAmount(item.unitPrice),
                IsPriceIncludeVAT: true
            }));
        }

        try {
            const response = await axios.post(`${this.apiUrl}/LowProfile/CreateInvoice`, payload);
            
            if (response.data.ResponseCode !== '0') {
                throw new Error(response.data.Description || 'Cardcom payment creation failed');
            }

            return {
                success: true,
                provider: 'cardcom',
                paymentUrl: response.data.Url,
                lowProfileCode: response.data.LowProfileCode,
                transactionId: response.data.InternalDealNumber,
                metadata: {
                    lowProfileId: response.data.LowProfileId
                }
            };

        } catch (error) {
            throw new Error(`Cardcom API error: ${error.message}`);
        }
    }

    async getPaymentStatus(transactionId) {
        try {
            const response = await axios.post(`${this.apiUrl}/GetLowProfileIndicator`, {
                TerminalNumber: this.terminalNumber,
                ApiName: this.apiKey,
                LowProfileId: transactionId
            });

            return {
                status: this.mapStatus(response.data.DealResponse),
                transactionId: response.data.InternalDealNumber,
                authNumber: response.data.AuthNumber,
                confirmationCode: response.data.ConfirmationCode,
                metadata: response.data
            };

        } catch (error) {
            throw new Error(`Failed to get payment status: ${error.message}`);
        }
    }

    async refundPayment(transactionId, amount, reason) {
        try {
            const response = await axios.post(`${this.apiUrl}/CreditDeal`, {
                TerminalNumber: this.terminalNumber,
                ApiName: this.apiKey,
                InternalDealNumber: transactionId,
                Amount: this.formatAmount(amount),
                Reason: reason
            });

            if (response.data.ResponseCode !== '0') {
                throw new Error(response.data.Description);
            }

            return {
                success: true,
                refundTransactionId: response.data.InternalDealNumber,
                metadata: response.data
            };

        } catch (error) {
            throw new Error(`Refund failed: ${error.message}`);
        }
    }

    getCurrencyCode(currency) {
        const codes = { ILS: 1, USD: 2, EUR: 978 };
        return codes[currency] || 1;
    }

    mapStatus(cardcomStatus) {
        const statusMap = {
            '0': 'completed',
            '1': 'failed',
            '2': 'pending'
        };
        return statusMap[cardcomStatus] || 'pending';
    }

    async validateWebhook(payload, signature) {
        return true;
    }
}

module.exports = CardcomProvider;
