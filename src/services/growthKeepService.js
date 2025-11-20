const CustomerHealth = require('../models/CustomerHealth');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Event = require('../models/Event');
const Appointment = require('../models/Appointment');
const { logInfo, logError } = require('../utils/logger');

class GrowthKeepService {
  async calculateCustomerHealth(businessId, customerId = null) {
    try {
      const query = customerId 
        ? { businessId, _id: customerId }
        : { businessId };
      
      const customers = await Customer.find(query);
      
      logInfo('Calculating customer health', { 
        businessId, 
        customerId, 
        totalCustomers: customers.length 
      });
      
      const results = [];
      
      for (const customer of customers) {
        const healthData = await this.calculateSingleCustomerHealth(businessId, customer);
        results.push(healthData);
      }
      
      logInfo('Customer health calculation completed', { 
        businessId, 
        processed: results.length 
      });
      
      return results;
    } catch (error) {
      logError('Error calculating customer health', { businessId, error: error.message });
      throw error;
    }
  }

  async calculateSingleCustomerHealth(businessId, customer) {
    try {
      const now = new Date();
      
      const payments = await Payment.find({
        businessId,
        customerId: customer._id,
        status: 'completed'
      }).sort({ createdAt: -1 });
      
      const eventRegistrations = await Event.find({
        businessId,
        'participants.customerId': customer._id
      }).sort({ createdAt: -1 });
      
      const appointments = await Appointment.find({
        businessId,
        customerId: customer._id
      }).sort({ createdAt: -1 });
      
      const allInteractions = [
        ...payments.map(p => ({ date: p.createdAt, type: 'payment', amount: p.amount })),
        ...eventRegistrations.map(e => ({ date: e.createdAt, type: 'event', amount: 0 })),
        ...appointments.map(a => ({ date: a.createdAt, type: 'appointment', amount: 0 }))
      ].sort((a, b) => b.date - a.date);
      
      const lastInteractionDate = allInteractions.length > 0 
        ? allInteractions[0].date 
        : customer.createdAt;
      
      const daysSinceLastInteraction = Math.floor(
        (now - new Date(lastInteractionDate)) / (1000 * 60 * 60 * 24)
      );
      
      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
      const totalTransactions = payments.length;
      const totalInteractions = allInteractions.length;
      const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      
      const recencyScore = this.calculateRecencyScore(daysSinceLastInteraction);
      const frequencyScore = this.calculateFrequencyScore(totalInteractions);
      const monetaryScore = this.calculateMonetaryScore(totalRevenue);
      
      const healthRecord = await CustomerHealth.findOneAndUpdate(
        { businessId, customerId: customer._id },
        {
          businessId,
          customerId: customer._id,
          customerName: customer.name,
          customerEmail: customer.email,
          rfmScores: {
            recency: {
              score: recencyScore,
              daysSinceLastInteraction
            },
            frequency: {
              score: frequencyScore,
              totalInteractions
            },
            monetary: {
              score: monetaryScore,
              totalRevenue
            }
          },
          metrics: {
            lastInteractionDate,
            totalTransactions,
            totalEventRegistrations: eventRegistrations.length,
            totalAppointments: appointments.length,
            averageOrderValue,
            lifetimeValue: totalRevenue
          },
          lastCalculatedAt: now
        },
        { upsert: true, new: true }
      );
      
      healthRecord.calculateHealthScore();
      healthRecord.determineSegment();
      healthRecord.determineEngagementTrend();
      
      await healthRecord.save();
      
      return healthRecord;
    } catch (error) {
      logError('Error calculating single customer health', { 
        businessId, 
        customerId: customer._id,
        error: error.message 
      });
      throw error;
    }
  }

  calculateRecencyScore(daysSince) {
    if (daysSince <= 7) return 5;
    if (daysSince <= 30) return 4;
    if (daysSince <= 60) return 3;
    if (daysSince <= 90) return 2;
    return 1;
  }

  calculateFrequencyScore(totalInteractions) {
    if (totalInteractions >= 20) return 5;
    if (totalInteractions >= 10) return 4;
    if (totalInteractions >= 5) return 3;
    if (totalInteractions >= 2) return 2;
    return 1;
  }

  calculateMonetaryScore(totalRevenue) {
    if (totalRevenue >= 10000) return 5;
    if (totalRevenue >= 5000) return 4;
    if (totalRevenue >= 2000) return 3;
    if (totalRevenue >= 500) return 2;
    return 1;
  }

  async getRetentionSummary(businessId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const healthRecords = await CustomerHealth.find({
        businessId,
        lastCalculatedAt: { $gte: startDate }
      });
      
      const segmentCounts = healthRecords.reduce((acc, record) => {
        acc[record.segment] = (acc[record.segment] || 0) + 1;
        return acc;
      }, {});
      
      const churnRiskCounts = healthRecords.reduce((acc, record) => {
        acc[record.churnRisk] = (acc[record.churnRisk] || 0) + 1;
        return acc;
      }, {});
      
      const averageHealthScore = healthRecords.length > 0
        ? healthRecords.reduce((sum, r) => sum + r.healthScore, 0) / healthRecords.length
        : 0;
      
      const atRiskCustomers = healthRecords.filter(r => 
        ['high', 'critical'].includes(r.churnRisk)
      ).length;
      
      const loyalCustomers = healthRecords.filter(r => 
        ['Champions', 'Loyal Customers'].includes(r.segment)
      ).length;
      
      return {
        totalCustomers: healthRecords.length,
        averageHealthScore: Math.round(averageHealthScore),
        segmentCounts,
        churnRiskCounts,
        atRiskCustomers,
        loyalCustomers,
        retentionRate: healthRecords.length > 0 
          ? Math.round((loyalCustomers / healthRecords.length) * 100) 
          : 0
      };
    } catch (error) {
      logError('Error getting retention summary', { businessId, error: error.message });
      throw error;
    }
  }

  async getCustomersBySegment(businessId, segment = null, churnRisk = null) {
    try {
      const query = { businessId };
      
      if (segment) {
        query.segment = segment;
      }
      
      if (churnRisk) {
        query.churnRisk = churnRisk;
      }
      
      const customers = await CustomerHealth.find(query)
        .sort({ healthScore: -1 })
        .limit(100);
      
      return customers;
    } catch (error) {
      logError('Error getting customers by segment', { businessId, error: error.message });
      throw error;
    }
  }

  async identifyWinBackOpportunities(businessId) {
    try {
      const atRiskCustomers = await CustomerHealth.find({
        businessId,
        churnRisk: { $in: ['high', 'critical'] },
        'metrics.lifetimeValue': { $gt: 1000 }
      }).sort({ 'metrics.lifetimeValue': -1 });
      
      return atRiskCustomers.map(customer => ({
        customerId: customer.customerId,
        customerName: customer.customerName,
        customerEmail: customer.customerEmail,
        segment: customer.segment,
        churnRisk: customer.churnRisk,
        lifetimeValue: customer.metrics.lifetimeValue,
        daysSinceLastInteraction: customer.rfmScores.recency.daysSinceLastInteraction,
        recommendation: this.generateWinBackRecommendation(customer)
      }));
    } catch (error) {
      logError('Error identifying win-back opportunities', { businessId, error: error.message });
      throw error;
    }
  }

  generateWinBackRecommendation(customer) {
    const daysSince = customer.rfmScores.recency.daysSinceLastInteraction;
    const ltv = customer.metrics.lifetimeValue;
    
    if (customer.segment === 'Cannot Lose Them') {
      return {
        type: 'urgent_win_back',
        priority: 'high',
        message: `לקוח בעל ערך גבוה (${ltv}₪) - לא פעיל ${daysSince} ימים. מומלץ ליצור קשר אישי מיידי עם הצעה מיוחדת.`,
        actions: ['personal_call', 'special_discount', 'exclusive_event']
      };
    }
    
    if (customer.churnRisk === 'high') {
      return {
        type: 'win_back',
        priority: 'medium',
        message: `לקוח בסיכון - ${daysSince} ימים מאז הפעילות האחרונה. שלח מייל עם הצעה מיוחדת.`,
        actions: ['email_campaign', 'discount_offer', 'feedback_request']
      };
    }
    
    return {
      type: 'nurture',
      priority: 'low',
      message: `לקוח לא פעיל - שמור על קשר עם תוכן מעניין.`,
      actions: ['newsletter', 'content_sharing']
    };
  }
}

module.exports = new GrowthKeepService();
