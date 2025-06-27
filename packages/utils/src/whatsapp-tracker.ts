import { db as prisma } from '@neon/data-model';
import { BudgetTracker } from './budget-tracker';

export interface WhatsAppLead {
  whatsappNumber: string;
  campaignId: string;
  stage: 'inquiry' | 'qualified' | 'demo' | 'proposal' | 'closed';
  language: 'ar' | 'en';
  region: string;
  messageCount?: number;
  lastActivity?: Date;
  metadata?: any;
}

export interface WhatsAppMessage {
  from: string;
  to: string;
  text: string;
  timestamp: Date;
  direction: 'inbound' | 'outbound';
  language: string;
  campaignId?: string;
}

export class WhatsAppTracker {
  /**
   * Track a new WhatsApp lead and calculate quality score
   */
  static async trackLead(options: WhatsAppLead): Promise<void> {
    const {
      whatsappNumber,
      campaignId,
      stage,
      language,
      region,
      messageCount = 1,
      lastActivity,
      metadata,
    } = options;

    try {
      // Calculate lead quality score based on various factors
      const qualityScore = this.calculateLeadQuality({
        stage,
        messageCount,
        language,
        responseTime: metadata?.responseTime,
        hasBusinessNumber: this.isBusinessNumber(whatsappNumber),
        metadata,
      });

      // Determine potential deal value based on stage and region
      const value = this.estimateDealValue(stage, region);

      // Track lead quality metric
      await prisma.leadQualityMetric.create({
        data: {
          campaignId,
          source: 'whatsapp',
          stage,
          score: qualityScore,
          value,
          responseTime: metadata?.responseTime,
          region,
          language,
          whatsappNumber,
          messageCount,
          lastActivity: lastActivity || new Date(),
        },
      });

      // Also create B2B lead record if it doesn't exist
      await this.upsertB2BLead({
        whatsappNumber,
        campaignId,
        language,
        region,
        stage,
        qualityScore,
        metadata,
      });

      console.log(
        `📱 WhatsApp lead tracked: ${whatsappNumber} (${qualityScore.toFixed(1)}/100 quality score)`
      );
    } catch (error) {
      console.error('Failed to track WhatsApp lead:', error);
    }
  }

  /**
   * Process WhatsApp message and extract insights
   */
  static async processMessage(message: WhatsAppMessage): Promise<void> {
    const { from, to, text, timestamp, direction, language, campaignId } = message;

    try {
      // Track sentiment for the message
      if (text && text.length > 10) {
        await BudgetTracker.trackSentiment({
          text,
          platform: 'WEBSITE', // WhatsApp messages tracked as website interactions
          language,
          campaignId,
          source: 'whatsapp',
          region: 'UAE',
          metadata: {
            direction,
            from,
            to,
            timestamp: timestamp.toISOString(),
          },
        });
      }

      // Update lead activity if this is an inbound message
      if (direction === 'inbound' && campaignId) {
        await this.updateLeadActivity(from, campaignId);
      }

      console.log(`💬 WhatsApp message processed: ${direction} from ${from} (${language})`);
    } catch (error) {
      console.error('Failed to process WhatsApp message:', error);
    }
  }

  /**
   * Calculate lead quality score (0-100)
   */
  private static calculateLeadQuality(options: {
    stage: string;
    messageCount: number;
    language: string;
    responseTime?: number;
    hasBusinessNumber: boolean;
    metadata?: any;
  }): number {
    const { stage, messageCount, language, responseTime, hasBusinessNumber, metadata } = options;

    let score = 0;

    // Stage-based scoring (most important factor)
    switch (stage) {
      case 'inquiry':
        score += 20;
        break;
      case 'qualified':
        score += 40;
        break;
      case 'demo':
        score += 60;
        break;
      case 'proposal':
        score += 80;
        break;
      case 'closed':
        score += 100;
        break;
    }

    // Message engagement scoring
    if (messageCount > 1) score += 10;
    if (messageCount > 5) score += 10;
    if (messageCount > 10) score += 10;

    // Language preference (Arabic shows local market focus)
    if (language === 'ar') score += 5;

    // Response time scoring (faster response = higher quality)
    if (responseTime) {
      if (responseTime < 300)
        score += 15; // < 5 minutes
      else if (responseTime < 1800)
        score += 10; // < 30 minutes
      else if (responseTime < 3600) score += 5; // < 1 hour
    }

    // Business number indicator
    if (hasBusinessNumber) score += 10;

    // Time of day interaction (business hours in UAE)
    const currentHour = new Date().getHours();
    if (currentHour >= 9 && currentHour <= 17) score += 5;

    // Additional metadata scoring
    if (metadata?.hasBusinessProfile) score += 10;
    if (metadata?.hasVerifiedNumber) score += 5;
    if (metadata?.isCompanyDomain) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Estimate deal value based on stage and region
   */
  private static estimateDealValue(stage: string, region: string): number {
    const baseValues = {
      inquiry: 1000,
      qualified: 2500,
      demo: 5000,
      proposal: 10000,
      closed: 15000,
    };

    // UAE market multiplier
    const regionMultiplier = region === 'UAE' ? 1.5 : 1.0;

    return (baseValues[stage as keyof typeof baseValues] || 0) * regionMultiplier;
  }

  /**
   * Check if phone number appears to be a business number
   */
  private static isBusinessNumber(phoneNumber: string): boolean {
    // Simple heuristics for UAE business numbers
    // In production, use a proper phone number validation service
    const uaeBusinessPrefixes = ['+971-4', '+971-2', '+971-6', '+971-7'];
    return uaeBusinessPrefixes.some(prefix => phoneNumber.startsWith(prefix));
  }

  /**
   * Create or update B2B lead record
   */
  private static async upsertB2BLead(options: {
    whatsappNumber: string;
    campaignId: string;
    language: string;
    region: string;
    stage: string;
    qualityScore: number;
    metadata?: any;
  }): Promise<void> {
    const { whatsappNumber, campaignId, language, region, stage, qualityScore, metadata } = options;

    try {
      // Try to find existing lead by WhatsApp number
      let lead = await prisma.b2BLead.findFirst({
        where: { phone: whatsappNumber },
      });

      if (lead) {
        // Update existing lead
        await prisma.b2BLead.update({
          where: { id: lead.id },
          data: {
            status: stage,
            score: qualityScore,
            lastContactAt: new Date(),
            location: region,
          },
        });
      } else {
        // Create new lead
        await prisma.b2BLead.create({
          data: {
            email: metadata?.email || `${whatsappNumber.replace('+', '')}@whatsapp.placeholder`,
            phone: whatsappNumber,
            source: 'whatsapp',
            status: stage,
            score: qualityScore,
            location: region,
            lastContactAt: new Date(),
            industry: metadata?.industry || 'Unknown',
            companySize: metadata?.companySize || 'Unknown',
            campaigns: {
              connect: { id: campaignId },
            },
          },
        });
      }
    } catch (error) {
      console.error('Failed to upsert B2B lead:', error);
    }
  }

  /**
   * Update lead activity timestamp and message count
   */
  private static async updateLeadActivity(
    whatsappNumber: string,
    campaignId: string
  ): Promise<void> {
    try {
      // Update lead quality metric
      const existingMetric = await prisma.leadQualityMetric.findFirst({
        where: {
          whatsappNumber,
          campaignId,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingMetric) {
        await prisma.leadQualityMetric.update({
          where: { id: existingMetric.id },
          data: {
            messageCount: { increment: 1 },
            lastActivity: new Date(),
          },
        });
      }

      // Update B2B lead
      const lead = await prisma.b2BLead.findFirst({
        where: { phone: whatsappNumber },
      });

      if (lead) {
        await prisma.b2BLead.update({
          where: { id: lead.id },
          data: {
            lastContactAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error('Failed to update lead activity:', error);
    }
  }

  /**
   * Get WhatsApp funnel performance for a campaign
   */
  static async getFunnelPerformance(campaignId: string, timeRange: number = 7): Promise<any> {
    const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);

    try {
      const leadMetrics = await prisma.leadQualityMetric.findMany({
        where: {
          campaignId,
          source: 'whatsapp',
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate funnel conversion rates
      const stageBreakdown = leadMetrics.reduce(
        (acc, metric) => {
          acc[metric.stage] = (acc[metric.stage] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const totalLeads = leadMetrics.length;
      const avgQualityScore =
        totalLeads > 0
          ? leadMetrics.reduce((sum, metric) => sum + metric.score, 0) / totalLeads
          : 0;

      const avgResponseTime = leadMetrics
        .filter(m => m.responseTime)
        .reduce((sum, metric, _, arr) => sum + (metric.responseTime || 0) / arr.length, 0);

      const languageBreakdown = leadMetrics.reduce(
        (acc, metric) => {
          acc[metric.language] = (acc[metric.language] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalLeads,
        avgQualityScore,
        avgResponseTime,
        stageBreakdown,
        languageBreakdown,
        conversionRate: stageBreakdown.closed ? (stageBreakdown.closed / totalLeads) * 100 : 0,
        funnelHealth:
          avgQualityScore > 60 ? 'good' : avgQualityScore > 40 ? 'fair' : 'needs_improvement',
      };
    } catch (error) {
      console.error('Failed to get funnel performance:', error);
      return null;
    }
  }

  /**
   * Create alerts for funnel performance issues
   */
  static async monitorFunnelHealth(campaignId: string): Promise<void> {
    try {
      const performance = await this.getFunnelPerformance(campaignId, 7);

      if (!performance) return;

      // Create alerts based on performance thresholds
      if (performance.avgQualityScore < 40) {
        await BudgetTracker.createAlert({
          campaignId,
          alertType: 'funnel_quality_low',
          severity: 'warning',
          title: 'WhatsApp Funnel Quality Drop',
          message: `Average lead quality score has dropped to ${performance.avgQualityScore.toFixed(1)}/100. Consider reviewing targeting or messaging.`,
          currentValue: performance.avgQualityScore,
          threshold: 40,
        });
      }

      if (performance.avgResponseTime > 3600) {
        // 1 hour
        await BudgetTracker.createAlert({
          campaignId,
          alertType: 'response_time_slow',
          severity: 'info',
          title: 'Slow WhatsApp Response Time',
          message: `Average response time is ${Math.round(performance.avgResponseTime / 60)} minutes. Consider faster response automation.`,
          currentValue: performance.avgResponseTime,
          threshold: 3600,
        });
      }

      if (performance.conversionRate < 5) {
        await BudgetTracker.createAlert({
          campaignId,
          alertType: 'conversion_rate_low',
          severity: 'warning',
          title: 'Low WhatsApp Conversion Rate',
          message: `Conversion rate is only ${performance.conversionRate.toFixed(1)}%. Review funnel optimization opportunities.`,
          currentValue: performance.conversionRate,
          threshold: 5,
        });
      }
    } catch (error) {
      console.error('Failed to monitor funnel health:', error);
    }
  }
}

// Export utility functions
export const trackWhatsAppLead = WhatsAppTracker.trackLead;
export const processWhatsAppMessage = WhatsAppTracker.processMessage;
export const getWhatsAppFunnelPerformance = WhatsAppTracker.getFunnelPerformance;
export const monitorWhatsAppFunnelHealth = WhatsAppTracker.monitorFunnelHealth;
