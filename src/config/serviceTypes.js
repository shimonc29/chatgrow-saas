// Service catalog configuration
// This is the single source of truth for service types, durations, and prices
// NEVER trust client-supplied prices - always validate against this catalog

const SERVICE_CATALOG = {
    consultation: {
        name: 'ייעוץ',
        duration: 30,
        price: 150,
        description: 'פגישת ייעוץ ראשונית'
    },
    treatment: {
        name: 'טיפול',
        duration: 60,
        price: 300,
        description: 'טיפול מלא'
    },
    followup: {
        name: 'מעקב',
        duration: 45,
        price: 200,
        description: 'פגישת מעקב'
    },
    workshop: {
        name: 'סדנה',
        duration: 120,
        price: 500,
        description: 'סדנה קבוצתית'
    },
    assessment: {
        name: 'הערכה',
        duration: 90,
        price: 400,
        description: 'הערכה מקצועית'
    }
};

/**
 * Get service details by type
 * @param {string} serviceType - Service type identifier
 * @returns {Object|null} Service details or null if not found
 */
function getServiceDetails(serviceType) {
    return SERVICE_CATALOG[serviceType] || null;
}

/**
 * Validate service type exists
 * @param {string} serviceType - Service type identifier
 * @returns {boolean} True if service exists
 */
function isValidServiceType(serviceType) {
    return SERVICE_CATALOG.hasOwnProperty(serviceType);
}

/**
 * Get all available services
 * @returns {Array} Array of service objects with type, name, duration, price
 */
function getAllServices() {
    return Object.keys(SERVICE_CATALOG).map(key => ({
        type: key,
        ...SERVICE_CATALOG[key]
    }));
}

module.exports = {
    SERVICE_CATALOG,
    getServiceDetails,
    isValidServiceType,
    getAllServices
};
