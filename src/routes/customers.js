const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const authMiddleware = require('../middleware/auth');
const { logApiRequest } = require('../utils/logger');

// Get all customers for business
router.get('/', authMiddleware.authenticate(), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { status, search } = req.query;
        const query = { businessId: req.user.id };
        
        if (status) {
            query.status = status;
        }
        
        let customers;
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            customers = await Customer.find({
                ...query,
                $or: [
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { phone: searchRegex },
                    { email: searchRegex }
                ]
            }).sort({ createdAt: -1 });
        } else {
            customers = await Customer.find(query).sort({ createdAt: -1 });
        }
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime, {
            businessId: req.user.id,
            customerCount: customers.length
        });
        
        res.json({
            success: true,
            customers
        });
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create new customer
router.post('/', authMiddleware.authenticate(), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { fullName, email, phone, notes } = req.body;
        
        // Split full name into firstName and lastName
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || firstName;
        
        const customer = new Customer({
            businessId: req.user.id,
            firstName,
            lastName,
            email,
            phone,
            servicePreferences: {
                notes
            }
        });
        
        await customer.save();
        
        logApiRequest(req.method, req.originalUrl, 201, Date.now() - startTime, {
            businessId: req.user.id,
            customerName: fullName
        });
        
        res.status(201).json({
            success: true,
            customer,
            message: 'לקוח נוסף בהצלחה'
        });
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get specific customer
router.get('/:customerId', authMiddleware.authenticate(), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const customer = await Customer.findOne({
            _id: req.params.customerId,
            businessId: req.user.id
        });
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'לקוח לא נמצא'
            });
        }
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime);
        res.json({
            success: true,
            customer
        });
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update customer
router.put('/:customerId', authMiddleware.authenticate(), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { fullName, email, phone, notes } = req.body;
        
        const updateData = { email, phone };
        
        if (fullName) {
            const nameParts = fullName.trim().split(' ');
            updateData.firstName = nameParts[0];
            updateData.lastName = nameParts.slice(1).join(' ') || nameParts[0];
        }
        
        if (notes !== undefined) {
            updateData['servicePreferences.notes'] = notes;
        }
        
        const customer = await Customer.findOneAndUpdate(
            { _id: req.params.customerId, businessId: req.user.id },
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'לקוח לא נמצא'
            });
        }
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime);
        res.json({
            success: true,
            customer,
            message: 'לקוח עודכן בהצלחה'
        });
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete customer
router.delete('/:customerId', authMiddleware.authenticate(), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const customer = await Customer.findOneAndUpdate(
            { _id: req.params.customerId, businessId: req.user.id },
            { status: 'inactive' },
            { new: true }
        );
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'לקוח לא נמצא'
            });
        }
        
        logApiRequest(req.method, req.originalUrl, 200, Date.now() - startTime);
        res.json({
            success: true,
            message: 'לקוח הוסר בהצלחה'
        });
        
    } catch (error) {
        logApiRequest(req.method, req.originalUrl, 500, Date.now() - startTime, {
            error: error.message
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
