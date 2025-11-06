
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    // Basic event information
    businessId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Event name cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
        type: String,
        enum: ['workshop', 'appointment', 'class', 'seminar', 'consultation', 'performance', 'meeting', 'other'],
        required: true
    },
    
    // Scheduling information
    startDateTime: {
        type: Date,
        required: true
    },
    endDateTime: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // minutes
        required: true
    },
    timeZone: {
        type: String,
        default: 'Asia/Jerusalem'
    },
    
    // Capacity and registration
    maxParticipants: {
        type: Number,
        required: true,
        min: 1,
        max: 1000
    },
    currentParticipants: {
        type: Number,
        default: 0
    },
    minParticipants: {
        type: Number,
        default: 1
    },
    waitingListEnabled: {
        type: Boolean,
        default: true
    },
    
    // Location information
    location: {
        type: {
            type: String,
            enum: ['physical', 'online', 'hybrid'],
            default: 'physical'
        },
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: { type: String, default: 'Israel' }
        },
        onlineLink: String,
        additionalInfo: String
    },
    
    // Pricing
    pricing: {
        type: {
            type: String,
            enum: ['free', 'paid', 'donation'],
            default: 'free'
        },
        amount: {
            type: Number,
            min: 0
        },
        currency: {
            type: String,
            default: 'ILS'
        },
        paymentMethods: [{
            type: String,
            enum: ['cash', 'credit_card', 'bank_transfer', 'paypal', 'bit']
        }]
    },
    
    // Registration settings
    registrationSettings: {
        openDateTime: {
            type: Date,
            default: Date.now
        },
        closeDateTime: Date,
        requireApproval: {
            type: Boolean,
            default: false
        },
        collectPhone: {
            type: Boolean,
            default: true
        },
        collectEmail: {
            type: Boolean,
            default: true
        },
        customFields: [{
            name: String,
            type: {
                type: String,
                enum: ['text', 'number', 'email', 'phone', 'select', 'checkbox'],
                default: 'text'
            },
            required: {
                type: Boolean,
                default: false
            },
            options: [String] // for select fields
        }]
    },
    
    // Status and settings
    status: {
        type: String,
        enum: ['draft', 'published', 'cancelled', 'completed', 'postponed'],
        default: 'draft'
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringPattern: {
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'yearly']
        },
        interval: Number, // every X frequency
        daysOfWeek: [Number], // 0-6 for Sunday-Saturday
        endDate: Date,
        maxOccurrences: Number
    },
    
    // Notifications and reminders
    notifications: {
        sendConfirmation: {
            type: Boolean,
            default: true
        },
        sendReminders: {
            type: Boolean,
            default: true
        },
        reminderTimes: [{
            type: Number,
            default: [1440, 60] // 24 hours and 1 hour before in minutes
        }],
        customMessages: {
            confirmation: String,
            reminder: String,
            cancellation: String
        }
    },
    
    // Business branding
    branding: {
        logoUrl: String,
        primaryColor: {
            type: String,
            default: '#667eea'
        },
        businessName: String,
        contactPhone: String,
        contactEmail: String
    },
    
    // Participants array - people who registered for the event
    participants: [{
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer'
        },
        name: String,
        email: String,
        phone: String,
        registeredAt: {
            type: Date,
            default: Date.now
        },
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment'
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'free', 'failed', 'refunded'],
            default: 'pending'
        },
        status: {
            type: String,
            enum: ['registered', 'confirmed', 'cancelled', 'attended', 'no_show'],
            default: 'registered'
        },
        notes: String
    }],
    
    // Statistics
    stats: {
        totalRegistrations: {
            type: Number,
            default: 0
        },
        totalNoShows: {
            type: Number,
            default: 0
        },
        totalCancellations: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Number,
            min: 1,
            max: 5
        },
        totalRevenue: {
            type: Number,
            default: 0
        }
    },
    
    // Additional metadata
    tags: [String],
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
    collection: 'events'
});

// Indexes
eventSchema.index({ businessId: 1, status: 1 });
eventSchema.index({ startDateTime: 1, endDateTime: 1 });
eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ 'location.city': 1, category: 1 });

// Virtual fields
eventSchema.virtual('isActive').get(function() {
    return this.status === 'published' && this.endDateTime > new Date();
});

eventSchema.virtual('isFull').get(function() {
    return this.currentParticipants >= this.maxParticipants;
});

eventSchema.virtual('availableSpots').get(function() {
    return Math.max(0, this.maxParticipants - this.currentParticipants);
});

eventSchema.virtual('occupancyRate').get(function() {
    return (this.currentParticipants / this.maxParticipants * 100).toFixed(1);
});

// Instance methods
eventSchema.methods.canRegister = function() {
    if (this.status !== 'published') return { canRegister: false, reason: 'Event not published' };
    if (this.isFull && !this.waitingListEnabled) return { canRegister: false, reason: 'Event is full' };
    if (this.registrationSettings.closeDateTime && new Date() > this.registrationSettings.closeDateTime) {
        return { canRegister: false, reason: 'Registration closed' };
    }
    if (new Date() > this.startDateTime) return { canRegister: false, reason: 'Event already started' };
    
    return { canRegister: true };
};

eventSchema.methods.incrementParticipants = async function() {
    this.currentParticipants += 1;
    this.stats.totalRegistrations += 1;
    return await this.save();
};

eventSchema.methods.decrementParticipants = async function() {
    this.currentParticipants = Math.max(0, this.currentParticipants - 1);
    return await this.save();
};

eventSchema.methods.addRevenue = async function(amount) {
    this.stats.totalRevenue += amount;
    return await this.save();
};

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
