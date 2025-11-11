const express = require('express');
const router = express.Router();
const LandingPage = require('../models/LandingPage');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const { logInfo, logError } = require('../utils/logger');

const authenticateToken = auth.authenticate();

// Get all landing pages for business
router.get('/', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    
    const pages = await LandingPage.find({ businessId })
      .sort({ createdAt: -1 })
      .lean();
    
    logInfo('Landing pages retrieved', {
      businessId,
      count: pages.length
    });
    
    res.json(pages);
  } catch (error) {
    logError('Error fetching landing pages', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Get single landing page by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user.businessId;
    
    const page = await LandingPage.findOne({ _id: id, businessId });
    
    if (!page) {
      return res.status(404).json({ error: 'Landing page not found' });
    }
    
    res.json(page);
  } catch (error) {
    logError('Error fetching landing page', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Create new landing page
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const pageData = {
      ...req.body,
      businessId
    };
    
    const page = new LandingPage(pageData);
    await page.save();
    
    logInfo('Landing page created', {
      businessId,
      pageId: page._id,
      name: page.name
    });
    
    res.status(201).json(page);
  } catch (error) {
    logError('Error creating landing page', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Update landing page
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user.businessId;
    
    const page = await LandingPage.findOneAndUpdate(
      { _id: id, businessId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!page) {
      return res.status(404).json({ error: 'Landing page not found' });
    }
    
    logInfo('Landing page updated', {
      businessId,
      pageId: id
    });
    
    res.json(page);
  } catch (error) {
    logError('Error updating landing page', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Delete landing page
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user.businessId;
    
    const page = await LandingPage.findOneAndDelete({ _id: id, businessId });
    
    if (!page) {
      return res.status(404).json({ error: 'Landing page not found' });
    }
    
    logInfo('Landing page deleted', {
      businessId,
      pageId: id
    });
    
    res.json({ message: 'Landing page deleted successfully' });
  } catch (error) {
    logError('Error deleting landing page', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Duplicate landing page
router.post('/:id/duplicate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user.businessId;
    
    const originalPage = await LandingPage.findOne({ _id: id, businessId });
    
    if (!originalPage) {
      return res.status(404).json({ error: 'Landing page not found' });
    }
    
    const duplicateData = originalPage.toObject();
    delete duplicateData._id;
    delete duplicateData.slug;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    duplicateData.name = `${originalPage.name} - עותק`;
    duplicateData.status = 'draft';
    duplicateData.analytics = {
      views: 0,
      uniqueVisitors: [],
      conversions: 0,
      lastViewed: null
    };
    
    const newPage = new LandingPage(duplicateData);
    await newPage.save();
    
    logInfo('Landing page duplicated', {
      businessId,
      originalId: id,
      newId: newPage._id
    });
    
    res.status(201).json(newPage);
  } catch (error) {
    logError('Error duplicating landing page', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
