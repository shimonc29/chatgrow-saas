const express = require('express');
const router = express.Router();
const LandingPage = require('../../models/LandingPage');
const Event = require('../../models/Event');
const logger = require('../../services/LoggerService');

// View landing page by slug (public route)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const page = await LandingPage.findOne({ slug, status: 'published' });
    
    if (!page) {
      return res.status(404).json({ error: 'Landing page not found' });
    }
    
    // Track view
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await page.trackView(ipAddress);
    
    // Get linked entity if exists
    let linkedEntity = null;
    if (page.linkedTo.type === 'event' && page.linkedTo.id) {
      linkedEntity = await Event.findById(page.linkedTo.id);
    }
    
    logger.info('Landing page viewed', {
      slug,
      pageId: page._id,
      views: page.analytics.views
    });
    
    res.json({
      page,
      linkedEntity
    });
  } catch (error) {
    logger.error('Error viewing landing page', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Track conversion
router.post('/:slug/convert', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const page = await LandingPage.findOne({ slug, status: 'published' });
    
    if (!page) {
      return res.status(404).json({ error: 'Landing page not found' });
    }
    
    await page.trackConversion();
    
    logger.info('Landing page conversion tracked', {
      slug,
      pageId: page._id,
      conversions: page.analytics.conversions
    });
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error tracking conversion', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
