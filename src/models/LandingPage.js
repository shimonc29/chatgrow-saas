const mongoose = require('mongoose');

const landingPageSchema = new mongoose.Schema({
  businessId: {
    type: String,
    required: true,
    index: true
  },
  
  // Basic Info
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  
  // Template
  template: {
    type: String,
    enum: ['modern', 'classic', 'colorful', 'minimal', 'elegant'],
    default: 'modern'
  },
  
  // Content
  content: {
    hero: {
      headline: { type: String, default: '' },
      subheadline: { type: String, default: '' },
      image: { type: String, default: '' },
      ctaText: { type: String, default: 'הירשם עכשיו' },
      ctaColor: { type: String, default: '#8B5CF6' }
    },
    
    about: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      image: { type: String, default: '' }
    },
    
    features: [{
      icon: { type: String, default: '✨' },
      title: { type: String, default: '' },
      description: { type: String, default: '' }
    }],
    
    testimonials: [{
      name: { type: String, default: '' },
      text: { type: String, default: '' },
      avatar: { type: String, default: '' }
    }],
    
    footer: {
      text: { type: String, default: '' },
      links: [{
        label: { type: String, default: '' },
        url: { type: String, default: '' }
      }]
    }
  },
  
  // Styling
  styling: {
    primaryColor: { type: String, default: '#8B5CF6' },
    secondaryColor: { type: String, default: '#EC4899' },
    backgroundColor: { type: String, default: '#FFFFFF' },
    fontFamily: { type: String, default: 'Heebo' },
    buttonStyle: { type: String, default: 'rounded-lg' }
  },
  
  // Connected Entity
  linkedTo: {
    type: { type: String, enum: ['event', 'appointment', 'none'], default: 'none' },
    id: { type: String, default: null }
  },
  
  // SEO
  seo: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    keywords: [{ type: String }],
    ogImage: { type: String, default: '' }
  },
  
  // Analytics
  analytics: {
    views: { type: Number, default: 0 },
    uniqueVisitors: [{ 
      ip: String, 
      timestamp: Date 
    }],
    conversions: { type: Number, default: 0 },
    lastViewed: { type: Date, default: null }
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  
  publishedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Generate unique slug before saving
landingPageSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('name')) {
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^\u0590-\u05FFa-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Update publishedAt when status changes to published
landingPageSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Track page view
landingPageSchema.methods.trackView = async function(ipAddress) {
  this.analytics.views += 1;
  this.analytics.lastViewed = new Date();
  
  // Track unique visitors
  const existingVisitor = this.analytics.uniqueVisitors.find(v => v.ip === ipAddress);
  if (!existingVisitor) {
    this.analytics.uniqueVisitors.push({ ip: ipAddress, timestamp: new Date() });
  }
  
  await this.save();
};

// Track conversion
landingPageSchema.methods.trackConversion = async function() {
  this.analytics.conversions += 1;
  await this.save();
};

const LandingPage = mongoose.model('LandingPage', landingPageSchema);

module.exports = LandingPage;
