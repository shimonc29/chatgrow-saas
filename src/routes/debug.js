const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { authenticateToken } = require('../middleware/auth');
const { logInfo } = require('../utils/logger');

/**
 * Debug endpoint to verify source tracking is working
 * GET /api/debug/sample-leads?limit=10
 * Returns recent customers with their source tracking data
 */
router.get('/sample-leads', authenticateToken, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const businessId = req.user.id;

        // Fetch recent customers for this business with source tracking
        const customers = await Customer.find({ businessId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .select('firstName lastName email phone createdAt sourceKey utmSource utmMedium utmCampaign utmTerm utmContent referralCode');

        logInfo('Sample leads debug query', { 
            businessId, 
            count: customers.length 
        });

        // Format response
        const formattedCustomers = customers.map(customer => ({
            name: `${customer.firstName} ${customer.lastName}`,
            email: customer.email,
            phone: customer.phone,
            createdAt: customer.createdAt,
            sourceTracking: {
                sourceKey: customer.sourceKey || null,
                utmSource: customer.utmSource || null,
                utmMedium: customer.utmMedium || null,
                utmCampaign: customer.utmCampaign || null,
                utmTerm: customer.utmTerm || null,
                utmContent: customer.utmContent || null,
                referralCode: customer.referralCode || null
            }
        }));

        res.json({
            success: true,
            count: formattedCustomers.length,
            customers: formattedCustomers
        });

    } catch (error) {
        console.error('Error fetching sample leads:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת לידים לדוגמה',
            error: error.message
        });
    }
});

/**
 * Debug endpoint to get source tracking statistics
 * GET /api/debug/source-stats
 * Returns aggregated statistics by sourceKey
 */
router.get('/source-stats', authenticateToken, async (req, res) => {
    try {
        const businessId = req.user.id;

        // Aggregate customers by sourceKey
        const sourceStats = await Customer.aggregate([
            { $match: { businessId } },
            {
                $group: {
                    _id: '$sourceKey',
                    count: { $sum: 1 },
                    utmSources: { $addToSet: '$utmSource' },
                    utmMediums: { $addToSet: '$utmMedium' },
                    utmCampaigns: { $addToSet: '$utmCampaign' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        logInfo('Source stats debug query', { 
            businessId, 
            uniqueSources: sourceStats.length 
        });

        res.json({
            success: true,
            totalSources: sourceStats.length,
            sources: sourceStats.map(stat => ({
                sourceKey: stat._id || 'unknown',
                count: stat.count,
                utmSources: stat.utmSources.filter(Boolean),
                utmMediums: stat.utmMediums.filter(Boolean),
                utmCampaigns: stat.utmCampaigns.filter(Boolean)
            }))
        });

    } catch (error) {
        console.error('Error fetching source stats:', error);
        res.status(500).json({
            success: false,
            message: 'שגיאה בטעינת סטטיסטיקות מקורות',
            error: error.message
        });
    }
});

module.exports = router;
