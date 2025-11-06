const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Customer = require('../models/Customer');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');
const { logInfo, logError, logApiRequest } = require('../utils/logger');
const { getServiceDetails, isValidServiceType, getAllServices } = require('../config/serviceTypes');

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
        const publicEvent = {
            _id: event._id,
            title: event.title,
            description: event.description,
            date: event.date,
            time: event.time,
            location: event.location,
            price: event.price,
            currency: event.currency || 'ILS',
            maxParticipants: event.maxParticipants,
            currentParticipants: event.participants ? event.participants.length : 0,
            availableSpots: event.maxParticipants - (event.participants ? event.participants.length : 0),
            imageUrl: event.imageUrl,
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
        const { customer, paymentMethod, provider } = req.body;

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
        // Always use the event's own price field
        const amount = event.price || 0;

        // Create or update customer
        let existingCustomer = await Customer.findOne({
            businessId: event.businessId,
            email: customer.email
        });

        if (!existingCustomer) {
            existingCustomer = new Customer({
                businessId: event.businessId,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                notes: `נרשם לאירוע: ${event.title}`
            });
            await existingCustomer.save();
            logInfo('New customer created from event registration', {
                customerId: existingCustomer._id,
                eventId: event._id
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
                    currency: event.currency || 'ILS',
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
                    notes: `תשלום עבור אירוע: ${event.title}`,
                    metadata: {
                        source: 'event_registration',
                        eventId: event._id.toString(),
                        eventTitle: event.title
                    },
                    relatedTo: {
                        type: 'event',
                        id: event._id
                    }
                });

                await payment.save();
            } else {
                // For gateway payments (Cardcom, Meshulam, Tranzila)
                const paymentData = {
                    amount,
                    currency: event.currency || 'ILS',
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
                    notes: `תשלום עבור אירוע: ${event.title}`,
                    metadata: {
                        source: 'event_registration',
                        eventId: event._id.toString(),
                        eventTitle: event.title
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
                        event: {
                            _id: event._id,
                            title: event.title,
                            date: event.date,
                            time: event.time
                        },
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
                name: event.title,
                startDateTime: new Date(`${event.date}T${event.time || '00:00'}`),
                location: {
                    address: {
                        city: event.location
                    }
                },
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
                event: {
                    _id: event._id,
                    title: event.title,
                    date: event.date,
                    time: event.time,
                    location: event.location
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

// Get available services catalog
router.get('/services', async (req, res) => {
    try {
        const services = getAllServices();
        
        res.json({
            success: true,
            services
        });
    } catch (error) {
        logError('Failed to get services catalog', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת רשימת השירותים'
        });
    }
});

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

// Book an appointment (public)
router.post('/appointments/book', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { businessId, customer, serviceType, dateTime, notes, paymentMethod, provider } = req.body;

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
            existingCustomer = new Customer({
                businessId,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                notes: `הזמין תור: ${serviceType}`
            });
            await existingCustomer.save();
            logInfo('New customer created from appointment booking', {
                customerId: existingCustomer._id,
                serviceType
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

module.exports = router;
