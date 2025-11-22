const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Customer = require('../models/Customer');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const LandingPage = require('../models/LandingPage');
const Availability = require('../models/Availability');
const Subscriber = require('../models/Subscriber');
const ProviderSettings = require('../models/ProviderSettings');
const ConversionEvent = require('../models/ConversionEvent');
const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');
const { incrementCustomerCount } = require('../middleware/customerLimit');
const { logInfo, logError, logApiRequest } = require('../utils/logger');
const { getServiceDetails, isValidServiceType, getAllServices } = require('../config/serviceTypes');

// Helper: Format event date and time with timezone awareness
function formatEventDateTime(startDateTime, timeZone = 'Asia/Jerusalem') {
    const dateTimeOptions = { 
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    
    const parts = new Intl.DateTimeFormat('en-CA', dateTimeOptions).formatToParts(new Date(startDateTime));
    const date = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;
    const time = `${parts.find(p => p.type === 'hour').value}:${parts.find(p => p.type === 'minute').value}`;
    
    return { date, time };
}

// Helper: Normalize location display for frontend
function normalizeLocation(location) {
    if (!location) return 'לא צוין';
    
    if (typeof location === 'object') {
        // Online events
        if (location.type === 'online' && location.onlineLink) {
            return location.onlineLink;
        }
        
        // Physical address
        if (location.address) {
            const addr = location.address;
            const addressParts = [addr.street, addr.city, addr.state].filter(Boolean);
            if (addressParts.length > 0) {
                return addressParts.join(', ');
            }
        }
        
        // Fallback to additionalInfo
        if (location.additionalInfo) {
            return location.additionalInfo;
        }
        
        return 'לא צוין';
    }
    
    return location; // String fallback
}

// Get available payment options for an event
router.get('/events/:id/payment-options', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'אירוע לא נמצא'
            });
        }

        // Check if business owner has Tranzila
        const user = await Subscriber.findById(event.businessId);
        const hasTranzila = !!(user && user.tranzilaTerminal);

        // Check payment gateways configured in ProviderSettings
        const providerSettings = await ProviderSettings.findOne({ userId: event.businessId });
        
        const hasCardcom = !!(
            providerSettings && 
            providerSettings.paymentGateways?.cardcom?.enabled &&
            providerSettings.paymentGateways?.cardcom?.terminalNumber
        );
        
        const hasMeshulam = !!(
            providerSettings && 
            providerSettings.paymentGateways?.meshulam?.enabled &&
            providerSettings.paymentGateways?.meshulam?.apiKey
        );
        
        const hasExternalPayment = !!(
            providerSettings && 
            providerSettings.paymentGateways?.externalPayment?.enabled && 
            providerSettings.paymentGateways?.externalPayment?.paymentUrl
        );

        const externalPaymentLabel = providerSettings?.paymentGateways?.externalPayment?.description || 'תשלום חיצוני';

        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime, {
            eventId: event._id,
            hasTranzila,
            hasCardcom,
            hasMeshulam,
            hasExternalPayment
        });

        res.json({
            success: true,
            paymentOptions: {
                manual: true,
                tranzila: hasTranzila,
                cardcom: hasCardcom,
                meshulam: hasMeshulam,
                external: hasExternalPayment,
                externalLabel: externalPaymentLabel
            }
        });

    } catch (error) {
        logError('Failed to get payment options', { error: error.message, eventId: req.params.id });
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת אפשרויות תשלום'
        });
    }
});

// Get public event details
router.get('/events/:id', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'אירוע לא נמצא'
            });
        }

        // Only show published events
        if (event.status !== 'published') {
            return res.status(403).json({
                success: false,
                message: 'אירוע זה אינו פעיל כרגע'
            });
        }

        // Return public event details (hide sensitive business info)
        // Map Event model fields to the format expected by frontend
        const { date: dateString, time: timeString } = formatEventDateTime(event.startDateTime, event.timeZone);
        
        const publicEvent = {
            _id: event._id,
            title: event.name,
            description: event.description,
            date: dateString,
            time: timeString,
            location: normalizeLocation(event.location),
            price: event.pricing?.amount || 0,
            currency: event.pricing?.currency || 'ILS',
            maxParticipants: event.maxParticipants,
            currentParticipants: event.participants ? event.participants.length : 0,
            availableSpots: event.maxParticipants - (event.participants ? event.participants.length : 0),
            imageUrl: event.branding?.logoUrl,
            status: event.status
        };

        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime, {
            eventId: event._id
        });

        res.json({
            success: true,
            event: publicEvent
        });

    } catch (error) {
        logError('Failed to get public event', error);
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת האירוע'
        });
    }
});

// Register for an event (public)
router.post('/events/:id/register', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { customer, paymentMethod, provider, sourceKey, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referralCode } = req.body;

        if (!customer || !customer.firstName || !customer.lastName || !customer.email || !customer.phone) {
            return res.status(400).json({
                success: false,
                message: 'נא למלא את כל השדות הנדרשים'
            });
        }

        // Get event details
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'אירוע לא נמצא'
            });
        }

        if (event.status !== 'published') {
            return res.status(403).json({
                success: false,
                message: 'אירוע זה אינו פעיל כרגע'
            });
        }

        // Atomic check: ensure event is not full
        // Using MongoDB's $where to atomically check capacity before adding participant
        const currentParticipants = event.participants ? event.participants.length : 0;
        if (currentParticipants >= event.maxParticipants) {
            return res.status(400).json({
                success: false,
                message: 'אירוע זה מלא, אין מקומות פנויים'
            });
        }

        // Server-side price validation - NEVER trust client input!
        // Always use the event's own price field from pricing object
        const amount = event.pricing?.amount || 0;

        // Create or update customer
        let existingCustomer = await Customer.findOne({
            businessId: event.businessId,
            email: customer.email
        });

        if (!existingCustomer) {
            // Query PostgreSQL Subscriber by ID
            const user = await Subscriber.findById(event.businessId);
            
            if (!user) {
                logError('Business owner not found', { businessId: event.businessId, eventId: event._id });
                return res.status(404).json({
                    success: false,
                    message: 'בעל העסק לא נמצא'
                });
            }

            if (user.subscriptionStatus === 'FREE' && user.currentCustomerCount >= user.maxCustomers) {
                return res.status(403).json({
                    success: false,
                    message: 'לא ניתן להירשם כרגע - בעל העסק הגיע למכסת הלקוחות המקסימלית בתוכנית החינמית.',
                    code: 'BUSINESS_CUSTOMER_LIMIT_REACHED'
                });
            }

            existingCustomer = new Customer({
                businessId: event.businessId,
                userId: event.businessId,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                notes: `נרשם לאירוע: ${event.name}`,
                // Lead source tracking
                sourceKey: sourceKey || `event:${event._id}`,
                utmSource,
                utmMedium,
                utmCampaign,
                utmTerm,
                utmContent,
                referralCode
            });
            await existingCustomer.save();
            
            await incrementCustomerCount(event.businessId);
            
            logInfo('New customer created from event registration', {
                customerId: existingCustomer._id,
                eventId: event._id,
                customerCount: user.currentCustomerCount + 1
            });
        }

        // Prepare participant entry for atomic update
        const participantEntry = {
            customerId: existingCustomer._id,
            name: `${customer.firstName} ${customer.lastName}`,
            email: customer.email,
            phone: customer.phone,
            registeredAt: new Date(),
            paymentId: null,
            paymentStatus: amount > 0 ? 'pending' : 'free'
        };

        // Create payment BEFORE adding to event (to ensure payment exists)
        let payment;

        if (amount > 0) {
            // For manual payments (cash, bank transfer, Bit)
            if (!provider || provider === 'manual') {
                payment = new Payment({
                    businessId: event.businessId,
                    customerId: existingCustomer._id,
                    amount: parseFloat(amount),
                    currency: event.pricing?.currency || 'ILS',
                    paymentMethod: paymentMethod || 'credit_card',
                    status: 'pending',
                    customer: {
                        name: `${customer.firstName} ${customer.lastName}`,
                        email: customer.email,
                        phone: customer.phone
                    },
                    provider: {
                        name: 'manual',
                        displayName: 'תשלום ידני'
                    },
                    notes: `תשלום עבור אירוע: ${event.name}`,
                    metadata: {
                        source: 'event_registration',
                        eventId: event._id.toString(),
                        eventTitle: event.name
                    },
                    relatedTo: {
                        type: 'event',
                        id: event._id
                    }
                });

                await payment.save();
            } else if (provider === 'external') {
                // For external payment link
                const providerSettings = await ProviderSettings.findOne({ userId: event.businessId });
                
                if (!providerSettings || !providerSettings.paymentGateways?.externalPayment?.enabled || !providerSettings.paymentGateways?.externalPayment?.paymentUrl) {
                    return res.status(400).json({
                        success: false,
                        message: 'קישור תשלום חיצוני לא מוגדר'
                    });
                }

                payment = new Payment({
                    businessId: event.businessId,
                    customerId: existingCustomer._id,
                    amount: parseFloat(amount),
                    currency: event.pricing?.currency || 'ILS',
                    paymentMethod: paymentMethod || 'credit_card',
                    status: 'pending',
                    customer: {
                        name: `${customer.firstName} ${customer.lastName}`,
                        email: customer.email,
                        phone: customer.phone
                    },
                    provider: {
                        name: 'external',
                        displayName: providerSettings.paymentGateways.externalPayment.description || 'תשלום חיצוני'
                    },
                    notes: `תשלום עבור אירוע: ${event.name}`,
                    metadata: {
                        source: 'event_registration',
                        eventId: event._id.toString(),
                        eventTitle: event.name,
                        externalPaymentUrl: providerSettings.paymentGateways.externalPayment.paymentUrl
                    },
                    relatedTo: {
                        type: 'event',
                        id: event._id
                    }
                });

                await payment.save();

                // Return external payment URL
                return res.status(201).json({
                    success: true,
                    requiresRedirect: true,
                    paymentUrl: providerSettings.paymentGateways.externalPayment.paymentUrl,
                    payment: payment,
                    customer: existingCustomer,
                    event: (() => {
                        const { date, time } = formatEventDateTime(event.startDateTime, event.timeZone);
                        return {
                            _id: event._id,
                            title: event.name,
                            date,
                            time,
                            location: normalizeLocation(event.location)
                        };
                    })(),
                    message: 'מעבר לדף תשלום...'
                });
            } else {
                // For gateway payments (Cardcom, Meshulam, Tranzila)
                const paymentData = {
                    amount,
                    currency: event.pricing?.currency || 'ILS',
                    paymentMethod: paymentMethod || 'credit_card',
                    provider,
                    customer: {
                        name: `${customer.firstName} ${customer.lastName}`,
                        email: customer.email,
                        phone: customer.phone
                    },
                    relatedTo: {
                        type: 'event',
                        id: event._id
                    },
                    notes: `תשלום עבור אירוע: ${event.name}`,
                    metadata: {
                        source: 'event_registration',
                        eventId: event._id.toString(),
                        eventTitle: event.name
                    },
                    successUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/payment/success?type=event&id=${event._id}`,
                    errorUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/payment/error?type=event&id=${event._id}`
                };

                const result = await paymentService.createPayment(event.businessId, existingCustomer._id, paymentData);
                payment = result.payment;

                // For gateway payments, return payment URL
                if (result.paymentUrl) {
                    return res.status(201).json({
                        success: true,
                        requiresRedirect: true,
                        paymentUrl: result.paymentUrl,
                        payment: payment,
                        customer: existingCustomer,
                        event: (() => {
                            const { date, time } = formatEventDateTime(event.startDateTime, event.timeZone);
                            return {
                                _id: event._id,
                                title: event.name,
                                date,
                                time,
                                location: normalizeLocation(event.location)
                            };
                        })(),
                        message: 'מעבר לעמוד תשלום...'
                    });
                }
            }
        }

        // Update participant entry with payment ID
        if (payment) {
            participantEntry.paymentId = payment._id;
            participantEntry.paymentStatus = payment.status;
        }

        // ATOMIC UPDATE: Add participant only if event hasn't reached max capacity
        // This prevents race conditions where multiple users register simultaneously
        const updateResult = await Event.findOneAndUpdate(
            {
                _id: event._id,
                $expr: {
                    $lt: [{ $size: { $ifNull: ['$participants', []] } }, event.maxParticipants]
                }
            },
            {
                $push: { participants: participantEntry }
            },
            { new: true }
        );

        if (!updateResult) {
            // Event became full between our check and update
            // Rollback payment if created
            if (payment) {
                await Payment.findByIdAndUpdate(payment._id, { status: 'cancelled' });
            }
            
            return res.status(400).json({
                success: false,
                message: 'האירוע התמלא ברגע האחרון. אנא נסה אירוע אחר.'
            });
        }

        event = updateResult;

        // Create appointment in calendar for this event registration
        try {
            const eventStartDate = new Date(event.startDateTime);
            const eventEndDate = new Date(event.endDateTime || event.startDateTime);
            
            // Calculate duration in minutes
            const durationMinutes = Math.round((eventEndDate - eventStartDate) / 60000);
            
            // Extract date and time components
            const appointmentDate = new Date(eventStartDate);
            appointmentDate.setHours(0, 0, 0, 0);
            
            const startTimeStr = `${eventStartDate.getHours().toString().padStart(2, '0')}:${eventStartDate.getMinutes().toString().padStart(2, '0')}`;
            const endTimeStr = `${eventEndDate.getHours().toString().padStart(2, '0')}:${eventEndDate.getMinutes().toString().padStart(2, '0')}`;
            
            const eventAppointment = new Appointment({
                businessId: event.businessId,
                serviceType: 'workshop',
                serviceName: event.name,
                customer: {
                    customerId: existingCustomer._id,
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    phone: customer.phone,
                    email: customer.email,
                    notes: `השתתפות באירוע: ${event.name}`
                },
                appointmentDate: appointmentDate,
                startTime: startTimeStr,
                endTime: endTimeStr,
                duration: durationMinutes > 0 ? durationMinutes : 60,
                price: amount,
                currency: event.pricing?.currency || 'ILS',
                paymentStatus: payment ? payment.status : (amount > 0 ? 'pending' : 'paid'),
                paymentMethod: payment?.paymentMethod,
                status: 'confirmed',
                source: 'event_registration',
                notes: `השתתפות באירוע: ${event.name}`,
                relatedEventId: event._id
            });
            
            await eventAppointment.save();
            
            logInfo('Created appointment for event registration', {
                appointmentId: eventAppointment._id,
                eventId: event._id,
                customerId: existingCustomer._id
            });
        } catch (apptError) {
            logError('Failed to create appointment for event registration', apptError);
        }

        // Send confirmation email and SMS
        try {
            const registration = {
                participant: {
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    email: customer.email,
                    phone: customer.phone
                }
            };
            
            const eventForNotification = {
                name: event.name,
                startDateTime: event.startDateTime,
                location: event.location,
                pricing: {
                    type: amount > 0 ? 'paid' : 'free',
                    amount: amount
                }
            };
            
            await notificationService.sendEventConfirmation(registration, eventForNotification);
        } catch (notifError) {
            logError('Failed to send registration confirmation', notifError);
        }

        logApiRequest(req.method, req.originalUrl, 201, Date.now() - startTime, {
            eventId: event._id,
            customerId: existingCustomer._id,
            paymentId: payment ? payment._id : null
        });

        res.status(201).json({
            success: true,
            message: 'נרשמת בהצלחה לאירוע!',
            registration: {
                event: (() => {
                    const { date, time } = formatEventDateTime(event.startDateTime, event.timeZone);
                    return {
                        _id: event._id,
                        title: event.name,
                        date,
                        time,
                        location: normalizeLocation(event.location)
                    };
                })(),
                customer: {
                    _id: existingCustomer._id,
                    name: `${customer.firstName} ${customer.lastName}`,
                    email: customer.email,
                    phone: customer.phone
                },
                payment: payment ? {
                    _id: payment._id,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: payment.status,
                    paymentMethod: payment.paymentMethod
                } : null
            }
        });

    } catch (error) {
        logError('Failed to register for event', error);
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'שגיאה בהרשמה לאירוע: ' + error.message
        });
    }
});

// Get existing appointments for a provider (for display on booking page)
router.get('/appointments/existing', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { providerId } = req.query;
        
        if (!providerId) {
            return res.status(400).json({
                success: false,
                message: 'נדרש providerId'
            });
        }
        
        // Get all confirmed appointments from today onwards
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const appointments = await Appointment.find({
            businessId: providerId,
            status: { $in: ['confirmed', 'pending'] },
            appointmentDate: { $gte: today }
        })
        .sort({ appointmentDate: 1, startTime: 1 })
        .limit(50)
        .lean();
        
        // Format appointments for display
        const formattedAppointments = appointments.map(appt => {
            const date = new Date(appt.appointmentDate);
            const dateStr = date.toLocaleDateString('he-IL', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
            });
            
            return {
                service: appt.serviceName || appt.serviceType,
                date: dateStr,
                time: appt.startTime,
                endTime: appt.endTime,
                status: appt.status
            };
        });
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime, {
            providerId,
            appointmentCount: formattedAppointments.length
        });
        
        res.json({
            success: true,
            appointments: formattedAppointments
        });
        
    } catch (error) {
        logError('Failed to fetch existing appointments', error);
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת התורים: ' + error.message
        });
    }
});

// Get available services catalog
router.get('/services', async (req, res) => {
    try {
        const { providerId } = req.query;
        
        if (!providerId) {
            return res.status(400).json({
                success: false,
                message: 'נדרש providerId'
            });
        }
        
        const availability = await Availability.findOne({ providerId });
        
        if (!availability || !availability.services) {
            return res.json({
                success: true,
                services: []
            });
        }
        
        const activeServices = availability.services.filter(s => s.isActive).map(s => ({
            _id: s._id,
            name: s.name,
            description: s.description,
            duration: s.duration,
            price: s.price,
            currency: s.currency
        }));
        
        res.json({
            success: true,
            services: activeServices
        });
    } catch (error) {
        logError('Failed to get services catalog', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת רשימת השירותים'
        });
    }
});

// Get existing appointments for a provider (for display on booking page)
router.get('/appointments/existing', async (req, res) => {
    try {
        const { providerId } = req.query;
        
        if (!providerId) {
            return res.status(400).json({
                success: false,
                message: 'נדרש providerId'
            });
        }
        
        const now = new Date();
        const futureAppointments = await Appointment.find({
            businessId: providerId,
            appointmentDate: { $gte: now },
            status: { $nin: ['cancelled'] }
        })
        .sort({ appointmentDate: 1, startTime: 1 })
        .limit(50)
        .lean();
        
        const appointments = futureAppointments.map(appt => {
            const dateStr = new Date(appt.appointmentDate).toLocaleDateString('he-IL', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            
            return {
                date: dateStr,
                time: appt.startTime,
                endTime: appt.endTime,
                service: appt.serviceName,
                duration: appt.duration
            };
        });
        
        res.json({
            success: true,
            appointments
        });
    } catch (error) {
        logError('Failed to get existing appointments', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת התורים הקיימים'
        });
    }
});

// Get available time slots for a specific date and service
router.get('/availability/slots', async (req, res) => {
    try {
        const { providerId, date, serviceId } = req.query;
        
        if (!providerId || !date) {
            return res.status(400).json({
                success: false,
                message: 'נדרש providerId ו-date'
            });
        }
        
        if (!serviceId) {
            return res.status(400).json({
                success: false,
                message: 'נדרש serviceId'
            });
        }
        
        const availability = await Availability.findOne({ providerId });
        
        if (!availability) {
            return res.json({
                success: true,
                slots: [],
                message: 'לא נמצאו הגדרות זמינות'
            });
        }
        
        const service = availability.services.id(serviceId);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'שירות לא נמצא'
            });
        }
        
        if (!service.isActive) {
            return res.json({
                success: true,
                slots: [],
                message: 'שירות זה אינו פעיל כרגע'
            });
        }
        
        const requestedDate = new Date(date);
        
        const normalizedRequestedDate = new Date(requestedDate);
        normalizedRequestedDate.setHours(0, 0, 0, 0);
        
        const normalizedNow = new Date();
        normalizedNow.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.ceil((normalizedRequestedDate - normalizedNow) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > availability.maxAdvanceBookingDays) {
            return res.json({
                success: true,
                slots: [],
                message: `ניתן לקבוע תור עד ${availability.maxAdvanceBookingDays} ימים מראש`
            });
        }
        
        const minAdvanceMs = availability.minAdvanceBookingHours * 60 * 60 * 1000;
        
        const dayOfWeek = normalizedRequestedDate.getDay();
        
        const isBlocked = availability.blockedDates.some(blocked => {
            const blockedDate = new Date(blocked.date);
            return blockedDate.toDateString() === requestedDate.toDateString();
        });
        
        if (isBlocked) {
            return res.json({
                success: true,
                slots: [],
                message: 'תאריך זה חסום'
            });
        }
        
        if (service.allowedDaysOfWeek && service.allowedDaysOfWeek.length > 0) {
            if (!service.allowedDaysOfWeek.includes(dayOfWeek)) {
                return res.json({
                    success: true,
                    slots: [],
                    message: 'שירות זה אינו זמין ביום זה'
                });
            }
        }
        
        const daySchedule = availability.weeklySchedule.find(d => d.dayOfWeek === dayOfWeek);
        
        if (!daySchedule || !daySchedule.isAvailable || !daySchedule.timeSlots || daySchedule.timeSlots.length === 0) {
            return res.json({
                success: true,
                slots: [],
                message: 'אין זמינות ביום זה'
            });
        }
        
        let workingTimeSlots = daySchedule.timeSlots;
        
        if (service.allowedTimeRanges && service.allowedTimeRanges.length > 0) {
            workingTimeSlots = intersectTimeRanges(daySchedule.timeSlots, service.allowedTimeRanges);
        }
        
        if (workingTimeSlots.length === 0) {
            return res.json({
                success: true,
                slots: [],
                message: 'אין שעות זמינות לשירות זה ביום זה'
            });
        }
        
        const dayStart = new Date(requestedDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(requestedDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        const existingAppointments = await Appointment.find({
            businessId: providerId,
            date: {
                $gte: dayStart,
                $lte: dayEnd
            },
            status: { $in: ['scheduled', 'confirmed'] }
        });
        
        const existingEvents = await Event.find({
            businessId: providerId,
            startDateTime: {
                $gte: dayStart,
                $lte: dayEnd
            },
            status: 'published'
        });
        
        const slots = [];
        let totalSlotsBeforeMinAdvance = 0;
        let slotsFilteredByMinAdvance = 0;
        
        for (const timeSlot of workingTimeSlots) {
            const [startHour, startMinute] = timeSlot.startTime.split(':').map(Number);
            const [endHour, endMinute] = timeSlot.endTime.split(':').map(Number);
            
            let currentMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;
            
            while (currentMinutes + service.duration <= endMinutes) {
                const slotHour = Math.floor(currentMinutes / 60);
                const slotMinute = currentMinutes % 60;
                const slotTime = `${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}`;
                
                const slotEndMinutes = currentMinutes + service.duration;
                const slotEndHour = Math.floor(slotEndMinutes / 60);
                const slotEndMinute = slotEndMinutes % 60;
                const slotEndTime = `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMinute).padStart(2, '0')}`;
                
                const hasConflict = existingAppointments.some(appt => {
                    return timeRangesOverlap(slotTime, slotEndTime, appt.startTime, appt.endTime);
                }) || existingEvents.some(evt => {
                    const evtDate = new Date(evt.startDateTime);
                    const evtStartTime = `${String(evtDate.getHours()).padStart(2, '0')}:${String(evtDate.getMinutes()).padStart(2, '0')}`;
                    const evtEndDate = new Date(evt.endDateTime || new Date(evt.startDateTime.getTime() + 60 * 60 * 1000));
                    const evtEndTime = `${String(evtEndDate.getHours()).padStart(2, '0')}:${String(evtEndDate.getMinutes()).padStart(2, '0')}`;
                    return timeRangesOverlap(slotTime, slotEndTime, evtStartTime, evtEndTime);
                });
                
                if (!hasConflict) {
                    totalSlotsBeforeMinAdvance++;
                    const slotDateTime = new Date(requestedDate);
                    slotDateTime.setHours(slotHour, slotMinute, 0, 0);
                    
                    if (slotDateTime.getTime() >= Date.now() + minAdvanceMs) {
                        slots.push(slotDateTime.toISOString());
                    } else {
                        slotsFilteredByMinAdvance++;
                    }
                }
                
                currentMinutes += service.duration + availability.bufferTime;
            }
        }
        
        if (slots.length === 0 && slotsFilteredByMinAdvance > 0) {
            return res.json({
                success: true,
                slots: [],
                message: `נדרש לקבוע תור לפחות ${availability.minAdvanceBookingHours} שעות מראש`
            });
        }
        
        res.json({
            success: true,
            date,
            serviceId,
            slots
        });
    } catch (error) {
        logError('Failed to get available slots', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת שעות פנויות'
        });
    }
});

function intersectTimeRanges(globalRanges, serviceRanges) {
    const result = [];
    
    for (const globalRange of globalRanges) {
        for (const serviceRange of serviceRanges) {
            const start = maxTime(globalRange.startTime, serviceRange.startTime);
            const end = minTime(globalRange.endTime, serviceRange.endTime);
            
            if (start < end) {
                result.push({ startTime: start, endTime: end });
            }
        }
    }
    
    return result;
}

function maxTime(time1, time2) {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    
    if (minutes1 > minutes2) return time1;
    return time2;
}

function minTime(time1, time2) {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    
    if (minutes1 < minutes2) return time1;
    return time2;
}

function timeRangesOverlap(start1, end1, start2, end2) {
    const [h1, m1] = start1.split(':').map(Number);
    const [h2, m2] = end1.split(':').map(Number);
    const [h3, m3] = start2.split(':').map(Number);
    const [h4, m4] = end2.split(':').map(Number);
    
    const s1 = h1 * 60 + m1;
    const e1 = h2 * 60 + m2;
    const s2 = h3 * 60 + m3;
    const e2 = h4 * 60 + m4;
    
    return s1 < e2 && s2 < e1;
}

// Get available appointment slots
router.get('/appointments/available', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { businessId, serviceType, date } = req.query;

        if (!businessId) {
            return res.status(400).json({
                success: false,
                message: 'נדרש businessId'
            });
        }

        // Build query
        const query = {
            businessId,
            status: 'scheduled'
        };

        if (serviceType) {
            query.serviceType = serviceType;
        }

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            
            query.dateTime = {
                $gte: startDate,
                $lte: endDate
            };
        }

        // Get all scheduled appointments for the business
        const appointments = await Appointment.find(query).sort({ dateTime: 1 });

        // Return available time slots (this is a simplified version)
        // In a real system, you'd have business hours configuration
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime, {
            businessId,
            appointmentCount: appointments.length
        });

        res.json({
            success: true,
            appointments: appointments.map(apt => ({
                _id: apt._id,
                dateTime: apt.dateTime,
                serviceType: apt.serviceType,
                duration: apt.duration,
                status: apt.status
            }))
        });

    } catch (error) {
        logError('Failed to get available appointments', error);
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת תורים זמינים'
        });
    }
});

// Get available payment options for appointments
router.get('/appointments/payment-options', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { businessId } = req.query;
        
        if (!businessId) {
            return res.status(400).json({
                success: false,
                message: 'נדרש businessId'
            });
        }

        // Check if business owner has Tranzila
        const user = await Subscriber.findById(businessId);
        const hasTranzila = !!(user && user.tranzilaTerminal);

        // Check payment gateways configured in ProviderSettings
        const providerSettings = await ProviderSettings.findOne({ userId: businessId });
        
        const hasCardcom = !!(
            providerSettings && 
            providerSettings.paymentGateways?.cardcom?.enabled &&
            providerSettings.paymentGateways?.cardcom?.terminalNumber
        );
        
        const hasMeshulam = !!(
            providerSettings && 
            providerSettings.paymentGateways?.meshulam?.enabled &&
            providerSettings.paymentGateways?.meshulam?.apiKey
        );
        
        const hasExternalPayment = !!(
            providerSettings && 
            providerSettings.paymentGateways?.externalPayment?.enabled && 
            providerSettings.paymentGateways?.externalPayment?.paymentUrl
        );

        const externalPaymentLabel = providerSettings?.paymentGateways?.externalPayment?.description || 'תשלום חיצוני';

        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime, {
            businessId,
            hasTranzila,
            hasCardcom,
            hasMeshulam,
            hasExternalPayment
        });

        res.json({
            success: true,
            paymentOptions: {
                manual: true,
                tranzila: hasTranzila,
                cardcom: hasCardcom,
                meshulam: hasMeshulam,
                external: hasExternalPayment,
                externalLabel: externalPaymentLabel
            }
        });

    } catch (error) {
        logError('Failed to get appointment payment options', { error: error.message, businessId: req.query.businessId });
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת אפשרויות תשלום'
        });
    }
});

// Book an appointment (public)
router.post('/appointments/book', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { businessId, customer, serviceType, dateTime, notes, paymentMethod, provider, sourceKey, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referralCode } = req.body;

        if (!businessId || !customer || !customer.firstName || !customer.lastName || !customer.email || !customer.phone || !serviceType || !dateTime) {
            return res.status(400).json({
                success: false,
                message: 'נא למלא את כל השדות הנדרשים'
            });
        }

        // SECURITY: Validate service type and get SERVER-SIDE price/duration
        // NEVER trust client-supplied price or duration!
        if (!isValidServiceType(serviceType)) {
            return res.status(400).json({
                success: false,
                message: 'סוג שירות לא חוקי'
            });
        }

        const serviceDetails = getServiceDetails(serviceType);
        const price = serviceDetails.price;
        const duration = serviceDetails.duration;

        // Calculate appointment end time based on SERVER-SIDE duration
        const appointmentStart = new Date(dateTime);
        const appointmentEnd = new Date(appointmentStart.getTime() + duration * 60000);

        // Check for overlapping appointments (atomic check with duration)
        const overlappingAppointment = await Appointment.findOne({
            businessId,
            status: { $in: ['scheduled', 'confirmed'] },
            $or: [
                // New appointment starts during existing appointment
                {
                    dateTime: { $lte: appointmentStart },
                    $expr: {
                        $gte: [
                            { $add: ['$dateTime', { $multiply: ['$duration', 60000] }] },
                            appointmentStart
                        ]
                    }
                },
                // New appointment ends during existing appointment
                {
                    dateTime: { $gte: appointmentStart, $lt: appointmentEnd }
                }
            ]
        });

        if (overlappingAppointment) {
            return res.status(400).json({
                success: false,
                message: 'זמן זה כבר תפוס, נא לבחור שעה אחרת'
            });
        }

        // Create or update customer
        let existingCustomer = await Customer.findOne({
            businessId,
            email: customer.email
        });

        if (!existingCustomer) {
            const user = await Subscriber.findById(businessId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'בעל העסק לא נמצא'
                });
            }

            if (user.subscriptionStatus === 'FREE' && user.currentCustomerCount >= user.maxCustomers) {
                return res.status(403).json({
                    success: false,
                    message: 'לא ניתן להזמין תור כרגע - בעל העסק הגיע למכסת הלקוחות המקסימלית בתוכנית החינמית.',
                    code: 'BUSINESS_CUSTOMER_LIMIT_REACHED'
                });
            }

            existingCustomer = new Customer({
                businessId,
                userId: businessId,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                notes: `הזמין תור: ${serviceType}`,
                // Lead source tracking
                sourceKey: sourceKey || `appointment:${businessId}`,
                utmSource,
                utmMedium,
                utmCampaign,
                utmTerm,
                utmContent,
                referralCode
            });
            await existingCustomer.save();
            
            await incrementCustomerCount(businessId);
            
            logInfo('New customer created from appointment booking', {
                customerId: existingCustomer._id,
                serviceType,
                customerCount: user.currentCustomerCount + 1
            });
        }

        // Create appointment with SERVER-VALIDATED duration
        // Extract date and time components
        const appointmentDate = new Date(appointmentStart);
        appointmentDate.setHours(0, 0, 0, 0); // Reset time to midnight for date field
        
        const startTimeStr = `${appointmentStart.getHours().toString().padStart(2, '0')}:${appointmentStart.getMinutes().toString().padStart(2, '0')}`;
        const endTimeStr = `${appointmentEnd.getHours().toString().padStart(2, '0')}:${appointmentEnd.getMinutes().toString().padStart(2, '0')}`;
        
        const appointment = new Appointment({
            businessId,
            serviceType,
            serviceName: serviceDetails.name, // Required field
            customer: {
                customerId: existingCustomer._id,
                firstName: customer.firstName,
                lastName: customer.lastName,
                phone: customer.phone,
                email: customer.email,
                notes: notes || ''
            },
            appointmentDate: appointmentDate, // Date only
            startTime: startTimeStr, // Time as string "HH:MM"
            endTime: endTimeStr, // Time as string "HH:MM"
            duration: duration, // From server-side catalog (in minutes)
            price: price, // From server-side catalog
            currency: 'ILS',
            paymentStatus: price > 0 ? 'pending' : 'paid',
            paymentMethod: paymentMethod || (price > 0 ? 'credit_card' : null),
            status: 'scheduled',
            source: 'web',
            notes: notes || `תור ל${serviceDetails.name}`
        });

        await appointment.save();

        // Create payment using SERVER-VALIDATED price
        let payment;
        const amount = price; // From server-side catalog, not client input!

        if (amount > 0) {
            if (!provider || provider === 'manual') {
                payment = new Payment({
                    businessId,
                    customerId: existingCustomer._id,
                    amount: parseFloat(amount),
                    currency: 'ILS',
                    paymentMethod: paymentMethod || 'credit_card',
                    status: 'pending',
                    customer: {
                        name: `${customer.firstName} ${customer.lastName}`,
                        email: customer.email,
                        phone: customer.phone
                    },
                    provider: {
                        name: 'manual',
                        displayName: 'תשלום ידני'
                    },
                    notes: `תשלום עבור תור: ${serviceType}`,
                    metadata: {
                        source: 'appointment_booking',
                        appointmentId: appointment._id.toString(),
                        serviceType
                    },
                    relatedTo: {
                        type: 'appointment',
                        id: appointment._id
                    }
                });

                await payment.save();
            } else {
                const paymentData = {
                    amount,
                    currency: 'ILS',
                    paymentMethod: paymentMethod || 'credit_card',
                    provider,
                    customer: {
                        name: `${customer.firstName} ${customer.lastName}`,
                        email: customer.email,
                        phone: customer.phone
                    },
                    relatedTo: {
                        type: 'appointment',
                        id: appointment._id
                    },
                    notes: `תשלום עבור תור: ${serviceType}`,
                    metadata: {
                        source: 'appointment_booking',
                        appointmentId: appointment._id.toString(),
                        serviceType
                    },
                    successUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/payment/success?type=appointment&id=${appointment._id}`,
                    errorUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/payment/error?type=appointment&id=${appointment._id}`
                };

                const result = await paymentService.createPayment(businessId, existingCustomer._id, paymentData);
                payment = result.payment;

                if (result.paymentUrl) {
                    return res.status(201).json({
                        success: true,
                        requiresRedirect: true,
                        paymentUrl: result.paymentUrl,
                        payment: payment,
                        customer: existingCustomer,
                        appointment: {
                            _id: appointment._id,
                            serviceType: appointment.serviceType,
                            dateTime: appointment.dateTime
                        },
                        message: 'מעבר לעמוד תשלום...'
                    });
                }
            }
        }

        // Send confirmation notifications
        try {
            const appointmentForNotification = {
                ...appointment.toObject(),
                customerId: {
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    email: customer.email,
                    phone: customer.phone
                },
                customer: {
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    email: customer.email,
                    phone: customer.phone
                }
            };
            
            await notificationService.sendAppointmentConfirmation(appointmentForNotification);
        } catch (notifError) {
            logError('Failed to send appointment confirmation', notifError);
        }

        logApiRequest(req.method, req.originalUrl, 201, Date.now() - startTime, {
            appointmentId: appointment._id,
            customerId: existingCustomer._id,
            paymentId: payment ? payment._id : null
        });

        res.status(201).json({
            success: true,
            message: 'התור נקבע בהצלחה!',
            booking: {
                appointment: {
                    _id: appointment._id,
                    serviceType: appointment.serviceType,
                    dateTime: appointment.dateTime,
                    duration: appointment.duration,
                    status: appointment.status
                },
                customer: {
                    _id: existingCustomer._id,
                    name: `${customer.firstName} ${customer.lastName}`,
                    email: customer.email,
                    phone: customer.phone
                },
                payment: payment ? {
                    _id: payment._id,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: payment.status,
                    paymentMethod: payment.paymentMethod
                } : null
            }
        });

    } catch (error) {
        logError('Failed to book appointment', error);
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'שגיאה בקביעת התור: ' + error.message
        });
    }
});

// Public Landing Pages Routes
// View landing page by slug
router.get('/landing/:slug', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { slug } = req.params;
        
        const page = await LandingPage.findOne({ slug, status: 'published' });
        
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'דף לא נמצא'
            });
        }
        
        // Track view
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        await page.trackView(ipAddress);
        
        // Get linked entity if exists
        let linkedEntity = null;
        if (page.linkedTo.type === 'event' && page.linkedTo.id) {
            linkedEntity = await Event.findById(page.linkedTo.id);
        }
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime, {
            slug,
            pageId: page._id,
            views: page.analytics.views
        });
        
        res.json({
            success: true,
            page,
            linkedEntity
        });
    } catch (error) {
        logError('Failed to view landing page', error);
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת הדף'
        });
    }
});

// Track conversion on landing page
router.post('/landing/:slug/convert', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { slug } = req.params;
        const { sourceKey, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, referralCode } = req.body;
        
        const page = await LandingPage.findOne({ slug, status: 'published' });
        
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'דף לא נמצא'
            });
        }
        
        await page.trackConversion();
        
        // Create ConversionEvent for analytics tracking with source data
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';
        
        await ConversionEvent.create({
            businessId: page.businessId,
            sourceType: 'landing_page',
            sourceKey: sourceKey || `landing-page:${slug}`,
            landingPageId: page._id,
            metadata: {
                utmSource,
                utmMedium,
                utmCampaign,
                utmTerm,
                utmContent,
                referralCode,
                slug
            },
            ipAddress,
            userAgent
        });
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime, {
            slug,
            pageId: page._id,
            conversions: page.analytics.conversions,
            sourceKey: sourceKey || `landing-page:${slug}`
        });
        
        res.json({ 
            success: true 
        });
    } catch (error) {
        logError('Failed to track conversion', error);
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'שגיאה במעקב המרה'
        });
    }
});

module.exports = router;
