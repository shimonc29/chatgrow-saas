const mongoose = require('mongoose');

const providerSettingsSchema = new mongoose.Schema({
  // Reference to User (provider)
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Email Provider Settings
  emailProvider: {
    type: {
      type: String,
      enum: ['sendgrid', 'smtp', 'none'],
      default: 'none'
    },
    enabled: {
      type: Boolean,
      default: false
    },
    // SendGrid Settings
    sendgrid: {
      apiKey: { type: String },
      fromEmail: { type: String },
      fromName: { type: String }
    },
    // SMTP Settings
    smtp: {
      host: { type: String },
      port: { type: Number },
      secure: { type: Boolean, default: true },
      username: { type: String },
      password: { type: String },
      fromEmail: { type: String },
      fromName: { type: String }
    }
  },

  // SMS Provider Settings
  smsProvider: {
    type: {
      type: String,
      enum: ['twilio', 'none'],
      default: 'none'
    },
    enabled: {
      type: Boolean,
      default: false
    },
    // Twilio Settings
    twilio: {
      accountSid: { type: String },
      authToken: { type: String },
      phoneNumber: { type: String }
    }
  },

  // Payment Gateway Settings
  paymentGateways: {
    // Cardcom
    cardcom: {
      enabled: { type: Boolean, default: false },
      terminalNumber: { type: String },
      apiUsername: { type: String },
      apiPassword: { type: String },
      lowProfileCode: { type: String },
      currency: {
        type: String,
        enum: ['ILS', 'USD', 'EUR'],
        default: 'ILS'
      },
      testMode: { type: Boolean, default: true }
    },
    
    // GROW (Meshulam)
    grow: {
      enabled: { type: Boolean, default: false },
      apiKey: { type: String },
      userId: { type: String },
      pageCode: { type: String },
      currency: {
        type: String,
        enum: ['ILS', 'USD', 'EUR'],
        default: 'ILS'
      },
      testMode: { type: Boolean, default: true }
    }
  },

  // Invoice Settings
  invoiceSettings: {
    companyName: { type: String },
    companyNumber: { type: String },
    vatNumber: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      postalCode: { type: String },
      country: { type: String, default: 'ישראל' }
    },
    phone: { type: String },
    email: { type: String },
    logo: { type: String }, // URL or base64
    
    // Invoice numbering
    nextInvoiceNumber: { type: Number, default: 1 },
    invoicePrefix: { type: String, default: 'INV' },
    
    // Receipt numbering
    nextReceiptNumber: { type: Number, default: 1 },
    receiptPrefix: { type: String, default: 'REC' },

    // Default terms
    paymentTerms: { type: String, default: 'תשלום מיידי' },
    notes: { type: String }
  },

  // Google Calendar Integration
  googleCalendar: {
    enabled: { type: Boolean, default: false },
    accessToken: { type: String },
    refreshToken: { type: String },
    tokenExpiry: { type: Number },
    calendarId: { type: String, default: 'primary' },
    lastSync: { type: Date }
  },

  // Active/Inactive
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster lookups
providerSettingsSchema.index({ userId: 1 });

// Method to get active payment gateway
providerSettingsSchema.methods.getActivePaymentGateway = function() {
  if (this.paymentGateways.cardcom.enabled) {
    return { type: 'cardcom', settings: this.paymentGateways.cardcom };
  }
  if (this.paymentGateways.grow.enabled) {
    return { type: 'grow', settings: this.paymentGateways.grow };
  }
  return null;
};

// Method to get email provider config
providerSettingsSchema.methods.getEmailConfig = function() {
  if (!this.emailProvider.enabled) return null;
  
  const type = this.emailProvider.type;
  if (type === 'sendgrid') {
    return {
      type: 'sendgrid',
      config: this.emailProvider.sendgrid
    };
  } else if (type === 'smtp') {
    return {
      type: 'smtp',
      config: this.emailProvider.smtp
    };
  }
  return null;
};

// Method to get SMS provider config
providerSettingsSchema.methods.getSMSConfig = function() {
  if (!this.smsProvider.enabled) return null;
  
  if (this.smsProvider.type === 'twilio') {
    return {
      type: 'twilio',
      config: this.smsProvider.twilio
    };
  }
  return null;
};

// Generate next invoice number
providerSettingsSchema.methods.generateInvoiceNumber = async function() {
  const invoiceNumber = `${this.invoiceSettings.invoicePrefix}-${String(this.invoiceSettings.nextInvoiceNumber).padStart(6, '0')}`;
  this.invoiceSettings.nextInvoiceNumber += 1;
  await this.save();
  return invoiceNumber;
};

// Generate next receipt number
providerSettingsSchema.methods.generateReceiptNumber = async function() {
  const receiptNumber = `${this.invoiceSettings.receiptPrefix}-${String(this.invoiceSettings.nextReceiptNumber).padStart(6, '0')}`;
  this.invoiceSettings.nextReceiptNumber += 1;
  await this.save();
  return receiptNumber;
};

const ProviderSettings = mongoose.model('ProviderSettings', providerSettingsSchema);

module.exports = ProviderSettings;
