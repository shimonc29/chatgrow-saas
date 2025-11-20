const GrowthOpportunity = require('../models/GrowthOpportunity');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const Event = require('../models/Event');
const Appointment = require('../models/Appointment');
const CustomerHealth = require('../models/CustomerHealth');

class GrowthGrowService {
  async identifyGrowthOpportunities(businessId) {
    const opportunities = [];

    const upsellOps = await this.identifyUpsellOpportunities(businessId);
    const crossSellOps = await this.identifyCrossSellOpportunities(businessId);
    const frequencyOps = await this.identifyFrequencyBoostOpportunities(businessId);
    const premiumOps = await this.identifyPremiumServiceOpportunities(businessId);
    const packageOps = await this.identifyPackageUpgradeOpportunities(businessId);

    opportunities.push(...upsellOps, ...crossSellOps, ...frequencyOps, ...premiumOps, ...packageOps);

    for (const opp of opportunities) {
      const existing = await GrowthOpportunity.findOne({
        businessId,
        customerId: opp.customerId,
        opportunityType: opp.opportunityType,
        status: 'PENDING'
      });

      if (!existing) {
        await GrowthOpportunity.create(opp);
      }
    }

    return opportunities.length;
  }

  async identifyUpsellOpportunities(businessId) {
    const opportunities = [];

    const customers = await Customer.find({ businessId }).lean();

    for (const customer of customers) {
      const payments = await Payment.find({
        businessId,
        customerId: customer._id,
        status: 'completed'
      }).sort({ createdAt: -1 }).limit(10).lean();

      if (payments.length === 0) continue;

      const avgValue = payments.reduce((sum, p) => sum + p.amount, 0) / payments.length;
      const maxValue = Math.max(...payments.map(p => p.amount));
      const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);

      if (payments.length >= 3 && avgValue > 100 && maxValue < avgValue * 2) {
        const potentialValue = avgValue * 1.5;

        opportunities.push({
          businessId,
          customerId: customer._id,
          opportunityType: 'UPSELL',
          title: `הזדמנות Upsell - ${customer.name}`,
          description: `לקוח עם ממוצע תשלום ₪${Math.round(avgValue)}. פוטנציאל לשדרוג לשירותים premium.`,
          potentialValue: potentialValue - avgValue,
          confidence: totalSpent > 1000 ? 'HIGH' : 'MEDIUM',
          priority: totalSpent > 1500 ? 'HIGH' : 'MEDIUM',
          recommendations: [
            {
              action: 'הצע חבילת premium',
              reasoning: `הלקוח הוכיח נאמנות עם ${payments.length} תשלומים`,
              expectedImpact: `העלאת ערך ממוצע ל-₪${Math.round(potentialValue)}`
            },
            {
              action: 'שלח הצעה מותאמת אישית',
              reasoning: 'לקוח עם היסטוריה חיובית',
              expectedImpact: 'סיכוי גבוה לקבלה'
            }
          ],
          customerMetrics: {
            currentCLV: totalSpent,
            projectedCLV: totalSpent * 1.5,
            avgTransactionValue: avgValue,
            purchaseFrequency: payments.length,
            lastPurchaseDate: payments[0]?.createdAt,
            totalSpent,
            engagement: 'HIGH'
          },
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      }
    }

    return opportunities;
  }

  async identifyCrossSellOpportunities(businessId) {
    const opportunities = [];

    const customers = await Customer.find({ businessId }).lean();

    for (const customer of customers) {
      const eventRegistrations = await Event.find({
        businessId,
        'participants.customerId': customer._id
      }).lean();

      const appointments = await Appointment.find({
        businessId,
        customerId: customer._id
      }).lean();

      const hasEvents = eventRegistrations.length > 0;
      const hasAppointments = appointments.length > 0;

      if (hasEvents && !hasAppointments) {
        opportunities.push({
          businessId,
          customerId: customer._id,
          opportunityType: 'CROSS_SELL',
          title: `הזדמנות Cross-Sell - ${customer.name}`,
          description: `לקוח משתתף באירועים אך לא קבע פגישות. פוטנציאל לפגישות ייעוץ.`,
          potentialValue: 300,
          confidence: 'MEDIUM',
          priority: eventRegistrations.length > 2 ? 'HIGH' : 'MEDIUM',
          recommendations: [
            {
              action: 'הצע פגישת ייעוץ אישית',
              reasoning: 'לקוח מעורב באירועים - סיכוי גבוה לעניין',
              expectedImpact: 'הוספת ערוץ הכנסה נוסף'
            }
          ],
          customerMetrics: {
            engagement: 'MEDIUM'
          },
          historicalPatterns: {
            preferredServices: ['events'],
            peakPurchaseTimes: []
          },
          expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
        });
      } else if (!hasEvents && hasAppointments && appointments.length > 2) {
        opportunities.push({
          businessId,
          customerId: customer._id,
          opportunityType: 'CROSS_SELL',
          title: `הזדמנות Cross-Sell - ${customer.name}`,
          description: `לקוח קבע ${appointments.length} פגישות. פוטנציאל להשתתפות באירועים.`,
          potentialValue: 200,
          confidence: 'MEDIUM',
          priority: 'MEDIUM',
          recommendations: [
            {
              action: 'שלח הזמנה לאירוע הבא',
              reasoning: 'לקוח מעורב בפגישות - סיכוי טוב לעניין באירועים',
              expectedImpact: 'הרחבת מעורבות הלקוח'
            }
          ],
          customerMetrics: {
            engagement: 'MEDIUM'
          },
          historicalPatterns: {
            preferredServices: ['appointments'],
            peakPurchaseTimes: []
          },
          expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
        });
      }
    }

    return opportunities;
  }

  async identifyFrequencyBoostOpportunities(businessId) {
    const opportunities = [];

    const healthRecords = await CustomerHealth.find({
      businessId,
      rfmScores: { $exists: true }
    }).lean();

    for (const health of healthRecords) {
      const frequencyScore = health.rfmScores?.frequency || 0;
      const monetaryScore = health.rfmScores?.monetary || 0;
      const recencyScore = health.rfmScores?.recency || 0;

      if (monetaryScore >= 4 && frequencyScore <= 2 && recencyScore >= 3) {
        const customer = await Customer.findById(health.customerId).lean();
        if (!customer) continue;

        opportunities.push({
          businessId,
          customerId: health.customerId,
          opportunityType: 'FREQUENCY_BOOST',
          title: `הגדלת תדירות - ${customer.name}`,
          description: `לקוח עם ערך גבוה (₪${health.totalRevenue || 0}) אך תדירות רכישה נמוכה.`,
          potentialValue: (health.totalRevenue || 0) * 0.5,
          confidence: 'HIGH',
          priority: 'HIGH',
          recommendations: [
            {
              action: 'הצע תוכנית נאמנות',
              reasoning: 'לקוח בעל ערך - עידוד לרכישות תכופות יותר',
              expectedImpact: 'הגדלת frequency ב-50%'
            },
            {
              action: 'שלח תזכורות מותאמות אישית',
              reasoning: 'לקוח רכש לאחרונה - זמן טוב ליצירת קשר',
              expectedImpact: 'שיפור מעורבות'
            }
          ],
          customerMetrics: {
            currentCLV: health.totalRevenue || 0,
            projectedCLV: (health.totalRevenue || 0) * 1.5,
            engagement: health.engagementTrend || 'STABLE'
          },
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        });
      }
    }

    return opportunities;
  }

  async identifyPremiumServiceOpportunities(businessId) {
    const opportunities = [];

    const healthRecords = await CustomerHealth.find({
      businessId,
      segment: { $in: ['Champions', 'Loyal Customers'] }
    }).lean();

    for (const health of healthRecords) {
      const customer = await Customer.findById(health.customerId).lean();
      if (!customer) continue;

      const totalRevenue = health.totalRevenue || 0;

      if (totalRevenue > 2000) {
        opportunities.push({
          businessId,
          customerId: health.customerId,
          opportunityType: 'PREMIUM_SERVICE',
          title: `שדרוג לשירות VIP - ${customer.name}`,
          description: `לקוח ${health.segment} עם הכנסה כוללת של ₪${totalRevenue}. מועמד מצוין לשירות VIP.`,
          potentialValue: totalRevenue * 0.3,
          confidence: 'HIGH',
          priority: 'CRITICAL',
          recommendations: [
            {
              action: 'הצע חבילת VIP בלעדית',
              reasoning: 'לקוח top-tier - ראוי ליחס מיוחד',
              expectedImpact: 'הגדלת LTV ב-30%'
            },
            {
              action: 'קבע פגישה אישית',
              reasoning: 'בניית קשר אישי עם לקוח מפתח',
              expectedImpact: 'חיזוק נאמנות'
            }
          ],
          customerMetrics: {
            currentCLV: totalRevenue,
            projectedCLV: totalRevenue * 1.3,
            engagement: 'HIGH'
          },
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        });
      }
    }

    return opportunities;
  }

  async identifyPackageUpgradeOpportunities(businessId) {
    const opportunities = [];

    const customers = await Customer.find({ businessId }).lean();

    for (const customer of customers) {
      const payments = await Payment.find({
        businessId,
        customerId: customer._id,
        status: 'completed'
      }).sort({ createdAt: -1 }).limit(20).lean();

      if (payments.length < 3) continue;

      const eventRegistrations = await Event.find({
        businessId,
        'participants.customerId': customer._id
      }).lean();

      const appointments = await Appointment.find({
        businessId,
        customerId: customer._id
      }).lean();

      const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
      const avgValue = totalSpent / payments.length;

      const hasMultipleServiceTypes = eventRegistrations.length > 0 && appointments.length > 0;
      const hasRecurringPayments = payments.length >= 5;

      if ((hasMultipleServiceTypes || hasRecurringPayments) && totalSpent > 500) {
        const packageSavings = totalSpent * 0.15;
        const potentialValue = totalSpent * 0.2;

        opportunities.push({
          businessId,
          customerId: customer._id,
          opportunityType: 'PACKAGE_UPGRADE',
          title: `שדרוג לחבילה - ${customer.name}`,
          description: `לקוח עם ${payments.length} תשלומים (₪${Math.round(totalSpent)} סה"כ). פוטנציאל לחבילה חודשית/שנתית.`,
          potentialValue,
          confidence: hasRecurringPayments ? 'HIGH' : 'MEDIUM',
          priority: totalSpent > 1000 ? 'HIGH' : 'MEDIUM',
          recommendations: [
            {
              action: 'הצע חבילה חודשית כוללת',
              reasoning: `לקוח עם ${payments.length} תשלומים - מתאים לחבילה קבועה`,
              expectedImpact: `חיסכון של ₪${Math.round(packageSavings)} ללקוח + הכנסה קבועה לעסק`
            },
            {
              action: 'הדגש את היתרון הכלכלי',
              reasoning: 'הצגת החיסכון תגדיל סיכוי להמרה',
              expectedImpact: 'שיפור conversion rate'
            },
            {
              action: 'הצע תקופת ניסיון מוזלת',
              reasoning: 'הפחתת חסם כניסה לחבילה',
              expectedImpact: 'הגדלת נכונות לנסות'
            }
          ],
          customerMetrics: {
            currentCLV: totalSpent,
            projectedCLV: totalSpent * 1.3,
            avgTransactionValue: avgValue,
            purchaseFrequency: payments.length,
            totalSpent,
            engagement: hasRecurringPayments ? 'HIGH' : 'MEDIUM'
          },
          historicalPatterns: {
            preferredServices: [
              ...(eventRegistrations.length > 0 ? ['events'] : []),
              ...(appointments.length > 0 ? ['appointments'] : [])
            ],
            peakPurchaseTimes: [],
            priceRange: {
              min: Math.min(...payments.map(p => p.amount)),
              max: Math.max(...payments.map(p => p.amount)),
              avg: avgValue
            }
          },
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        });
      }
    }

    return opportunities;
  }

  async getGrowthSummary(businessId) {
    const totalOpportunities = await GrowthOpportunity.countDocuments({
      businessId,
      status: 'PENDING'
    });

    const totalPotentialValue = await GrowthOpportunity.getTotalPotentialValue(businessId);
    const totalRealizedValue = await GrowthOpportunity.getTotalRealizedValue(businessId);
    const conversionRate = await GrowthOpportunity.calculateConversionRate(businessId);

    const opportunitiesByType = await GrowthOpportunity.aggregate([
      { $match: { businessId, status: 'PENDING' } },
      {
        $group: {
          _id: '$opportunityType',
          count: { $sum: 1 },
          totalValue: { $sum: '$potentialValue' }
        }
      }
    ]);

    const opportunitiesByPriority = await GrowthOpportunity.aggregate([
      { $match: { businessId, status: 'PENDING' } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const topOpportunities = await GrowthOpportunity.find({
      businessId,
      status: 'PENDING'
    })
      .populate('customerId', 'name email phone')
      .sort({ potentialValue: -1, priority: -1 })
      .limit(10)
      .lean();

    const recentAccepted = await GrowthOpportunity.find({
      businessId,
      status: 'ACCEPTED'
    })
      .sort({ actionDate: -1 })
      .limit(5)
      .lean();

    return {
      summary: {
        totalOpportunities,
        totalPotentialValue: Math.round(totalPotentialValue),
        totalRealizedValue: Math.round(totalRealizedValue),
        conversionRate: Math.round(conversionRate * 10) / 10,
        avgOpportunityValue: totalOpportunities > 0 ? Math.round(totalPotentialValue / totalOpportunities) : 0
      },
      breakdown: {
        byType: opportunitiesByType.map(item => ({
          type: item._id,
          count: item.count,
          totalValue: Math.round(item.totalValue)
        })),
        byPriority: opportunitiesByPriority.map(item => ({
          priority: item._id,
          count: item.count
        }))
      },
      topOpportunities: topOpportunities.map(opp => ({
        id: opp._id,
        customer: opp.customerId,
        type: opp.opportunityType,
        title: opp.title,
        description: opp.description,
        potentialValue: opp.potentialValue,
        confidence: opp.confidence,
        priority: opp.priority,
        recommendations: opp.recommendations
      })),
      recentWins: recentAccepted.map(opp => ({
        type: opp.opportunityType,
        actualValue: opp.actualValue,
        actionDate: opp.actionDate
      }))
    };
  }

  async getOpportunitiesByType(businessId, type, status = 'PENDING') {
    return await GrowthOpportunity.find({
      businessId,
      opportunityType: type,
      status
    })
      .populate('customerId', 'name email phone')
      .sort({ potentialValue: -1 })
      .lean();
  }

  async updateOpportunityStatus(opportunityId, businessId, status, actualValue, notes) {
    const opportunity = await GrowthOpportunity.findOne({
      _id: opportunityId,
      businessId
    });

    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    if (status === 'ACCEPTED') {
      await opportunity.markAsAccepted(actualValue, notes);
    } else if (status === 'REJECTED') {
      await opportunity.markAsRejected(notes);
    } else {
      opportunity.status = status;
      await opportunity.save();
    }

    return opportunity;
  }

  async getRevenueExpansionMetrics(businessId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const acceptedOpportunities = await GrowthOpportunity.find({
      businessId,
      status: 'ACCEPTED',
      actionDate: { $gte: startDate }
    }).lean();

    const totalExpansion = acceptedOpportunities.reduce((sum, opp) => sum + (opp.actualValue || 0), 0);
    const avgDealSize = acceptedOpportunities.length > 0 ? totalExpansion / acceptedOpportunities.length : 0;

    const expansionByType = await GrowthOpportunity.aggregate([
      {
        $match: {
          businessId,
          status: 'ACCEPTED',
          actionDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$opportunityType',
          count: { $sum: 1 },
          totalValue: { $sum: '$actualValue' }
        }
      }
    ]);

    return {
      totalExpansion: Math.round(totalExpansion),
      dealsAccepted: acceptedOpportunities.length,
      avgDealSize: Math.round(avgDealSize),
      expansionByType: expansionByType.map(item => ({
        type: item._id,
        count: item.count,
        value: Math.round(item.totalValue || 0)
      }))
    };
  }
}

module.exports = new GrowthGrowService();
