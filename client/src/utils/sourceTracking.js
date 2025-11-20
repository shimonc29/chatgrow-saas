/**
 * Utility functions for capturing and managing lead source tracking
 * Extracts UTM parameters, source keys, and referral codes from URL
 */

/**
 * Extract all source tracking parameters from current URL
 * @returns {Object} Object containing sourceKey, UTM fields, and referralCode
 */
export const extractSourceTracking = () => {
  const params = new URLSearchParams(window.location.search);

  return {
    sourceKey: params.get('source') || params.get('src') || null,
    utmSource: params.get('utm_source') || null,
    utmMedium: params.get('utm_medium') || null,
    utmCampaign: params.get('utm_campaign') || null,
    utmTerm: params.get('utm_term') || null,
    utmContent: params.get('utm_content') || null,
    referralCode: params.get('ref') || params.get('referral') || null,
  };
};

/**
 * Store source tracking in sessionStorage for multi-step forms
 * @param {Object} tracking - Source tracking object
 */
export const storeSourceTracking = (tracking) => {
  try {
    sessionStorage.setItem('sourceTracking', JSON.stringify(tracking));
  } catch (error) {
    console.warn('Failed to store source tracking:', error);
  }
};

/**
 * Retrieve stored source tracking from sessionStorage
 * @returns {Object|null} Stored source tracking or null
 */
export const getStoredSourceTracking = () => {
  try {
    const stored = sessionStorage.getItem('sourceTracking');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to retrieve source tracking:', error);
    return null;
  }
};

/**
 * Get source tracking - either from URL or from sessionStorage
 * @returns {Object} Source tracking object
 */
export const getSourceTracking = () => {
  // First try to get from URL
  const urlTracking = extractSourceTracking();
  
  // If no tracking in URL, try sessionStorage
  if (!hasSourceData(urlTracking)) {
    const storedTracking = getStoredSourceTracking();
    if (storedTracking) {
      return storedTracking;
    }
  } else {
    // Store in session for future pages
    storeSourceTracking(urlTracking);
  }

  return urlTracking;
};

/**
 * Check if tracking object has any actual data
 * @param {Object} tracking - Source tracking object
 * @returns {boolean} True if has data
 */
export const hasSourceData = (tracking) => {
  return Object.values(tracking).some(value => value !== null);
};

/**
 * Clear stored source tracking (useful after successful conversion)
 */
export const clearSourceTracking = () => {
  try {
    sessionStorage.removeItem('sourceTracking');
  } catch (error) {
    console.warn('Failed to clear source tracking:', error);
  }
};

/**
 * Build source key from context (e.g., landing page slug, event ID)
 * @param {string} type - Type of source (landing-page, event, appointment)
 * @param {string} id - ID or slug of the source
 * @returns {string} Formatted source key
 */
export const buildSourceKey = (type, id) => {
  return `${type}:${id}`;
};
