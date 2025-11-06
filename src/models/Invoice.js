const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    businessId: {
        type: String,
        required: true,
        index: true
    },

    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },

    relatedTo: {
        type: {
            type: String,
            enum: ['event', 'appointment', 'other']
        },
        id: mongoose.Schema.Types.ObjectId
    },

    type: {
        type: String,
        enum: ['invoice', 'receipt', 'tax_invoice', 'credit_note'],
        default: 'invoice'
    },

    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
        default: 'draft',
        index: true
    },

    issueDate: {
        type: Date,
        default: Date.now,
        required: true
    },

    dueDate: {
        type: Date,
        required: true
    },

    business: {
        name: { type: String, required: true },
        businessNumber: String,
        vatNumber: String,
        email: String,
        phone: String,
        address: {
            street: String,
            city: String,
            zip: String,
            country: { type: String, default: 'IL' }
        },
        logo: String
    },

    customer: {
        name: { type: String, required: true },
        email: String,
        phone: String,
        idNumber: String,
        address: {
            street: String,
            city: String,
            zip: String,
            country: { type: String, default: 'IL' }
        },
        companyName: String,
        vatNumber: String
    },

    items: [{
        description: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1, min: 0 },
        unitPrice: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
        taxRate: { type: Number, default: 0, min: 0, max: 100 },
        taxAmount: { type: Number, default: 0, min: 0 }
    }],

    subtotal: {
        type: Number,
        required: true,
        min: 0
    },

    taxTotal: {
        type: Number,
        default: 0,
        min: 0
    },

    discount: {
        type: Number,
        default: 0,
        min: 0
    },

    discountPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    total: {
        type: Number,
        required: true,
        min: 0
    },

    currency: {
        type: String,
        default: 'ILS',
        enum: ['ILS', 'USD', 'EUR']
    },

    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },

    notes: String,

    terms: String,

    pdfUrl: String,

    emailSent: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
        sentTo: String
    },

    metadata: mongoose.Schema.Types.Mixed

}, {
    timestamps: true
});

invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ businessId: 1, status: 1 });
invoiceSchema.index({ businessId: 1, invoiceNumber: 1 }, { unique: true });

invoiceSchema.pre('save', function(next) {
    let subtotal = 0;
    let taxTotal = 0;

    this.items.forEach(item => {
        item.total = item.quantity * item.unitPrice;
        item.taxAmount = (item.total * item.taxRate) / 100;
        subtotal += item.total;
        taxTotal += item.taxAmount;
    });

    this.subtotal = subtotal;
    this.taxTotal = taxTotal;

    if (this.discountPercentage > 0) {
        this.discount = (subtotal * this.discountPercentage) / 100;
    }

    this.total = subtotal + taxTotal - this.discount;

    next();
});

invoiceSchema.methods.markAsPaid = function(paymentId) {
    this.status = 'paid';
    this.paymentId = paymentId;
    return this.save();
};

invoiceSchema.methods.markAsSent = function(email) {
    this.status = 'sent';
    this.emailSent.sent = true;
    this.emailSent.sentAt = new Date();
    this.emailSent.sentTo = email;
    return this.save();
};

invoiceSchema.methods.cancel = function() {
    this.status = 'cancelled';
    return this.save();
};

invoiceSchema.statics.generateInvoiceNumber = async function(businessId) {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}`;
    
    const lastInvoice = await this.findOne({
        businessId,
        invoiceNumber: new RegExp(`^${prefix}`)
    }).sort({ invoiceNumber: -1 });

    let nextNumber = 1;
    if (lastInvoice) {
        const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-').pop());
        nextNumber = lastNumber + 1;
    }

    return `${prefix}-${String(nextNumber).padStart(5, '0')}`;
};

module.exports = mongoose.model('Invoice', invoiceSchema);
