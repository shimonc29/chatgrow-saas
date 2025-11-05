const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscriber',
        required: true,
        index: true
    },
    
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
        index: true
    },

    relatedTo: {
        type: {
            type: String,
            enum: ['event', 'appointment', 'invoice', 'other'],
            required: true
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'relatedTo.type'
        }
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    currency: {
        type: String,
        default: 'ILS',
        enum: ['ILS', 'USD', 'EUR']
    },

    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
        default: 'pending',
        index: true
    },

    paymentMethod: {
        type: String,
        enum: ['credit_card', 'bit', 'paypal', 'bank_transfer', 'cash', 'other'],
        required: true
    },

    provider: {
        name: {
            type: String,
            enum: ['cardcom', 'meshulam', 'tranzila', 'stripe', 'manual'],
            required: true
        },
        transactionId: String,
        authNumber: String,
        confirmationCode: String,
        metadata: mongoose.Schema.Types.Mixed
    },

    customer: {
        name: String,
        email: String,
        phone: String,
        idNumber: String
    },

    billing: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        address: {
            street: String,
            city: String,
            zip: String,
            country: { type: String, default: 'IL' }
        },
        companyName: String,
        vatNumber: String
    },

    card: {
        lastFourDigits: String,
        brand: String,
        expiryMonth: String,
        expiryYear: String,
        cardToken: String
    },

    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    },

    refund: {
        refunded: { type: Boolean, default: false },
        refundedAt: Date,
        refundAmount: Number,
        refundReason: String,
        refundTransactionId: String
    },

    notes: String,

    metadata: mongoose.Schema.Types.Mixed

}, {
    timestamps: true
});

paymentSchema.index({ 'provider.transactionId': 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ businessId: 1, status: 1 });

paymentSchema.methods.markAsCompleted = function(providerData) {
    this.status = 'completed';
    if (providerData) {
        this.provider.transactionId = providerData.transactionId || this.provider.transactionId;
        this.provider.authNumber = providerData.authNumber || this.provider.authNumber;
        this.provider.confirmationCode = providerData.confirmationCode || this.provider.confirmationCode;
        this.provider.metadata = { ...this.provider.metadata, ...providerData.metadata };
    }
    return this.save();
};

paymentSchema.methods.markAsFailed = function(reason) {
    this.status = 'failed';
    this.notes = this.notes ? `${this.notes}\nFailed: ${reason}` : `Failed: ${reason}`;
    return this.save();
};

paymentSchema.methods.refundPayment = function(amount, reason) {
    this.status = 'refunded';
    this.refund.refunded = true;
    this.refund.refundedAt = new Date();
    this.refund.refundAmount = amount || this.amount;
    this.refund.refundReason = reason;
    return this.save();
};

paymentSchema.statics.getBusinessRevenue = async function(businessId, startDate, endDate) {
    const match = {
        businessId: mongoose.Types.ObjectId(businessId),
        status: 'completed'
    };

    if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const result = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$amount' },
                totalPayments: { $sum: 1 },
                averagePayment: { $avg: '$amount' }
            }
        }
    ]);

    return result[0] || { totalRevenue: 0, totalPayments: 0, averagePayment: 0 };
};

module.exports = mongoose.model('Payment', paymentSchema);
