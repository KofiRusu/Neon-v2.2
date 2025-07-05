import { AgentMemoryStore } from "../memory/AgentMemoryStore";
import { logger } from "../logger";

export interface EngagementSignal {
  id: string;
  campaignId: string;
  userId: string;
  signalType: "view" | "click" | "hover" | "scroll" | "download" | "share" | "bookmark" | "comment" | "like" | "conversion";
  timestamp: Date;
  metadata: {
    platform: string;
    contentType: string;
    duration: number; // seconds
    depth: number; // scroll depth, time spent, etc.
    device: string;
    location: string;
    referrer: string;
    sessionId: string;
  };
  value: number; // Engagement value score
}

export interface ConversionSignal {
  id: string;
  campaignId: string;
  userId: string;
  conversionType: "lead" | "purchase" | "signup" | "download" | "subscription" | "trial" | "contact";
  value: number; // Revenue or lead value
  timestamp: Date;
  attributionPath: Array<{
    touchpoint: string;
    timestamp: Date;
    channel: string;
    weight: number;
  }>;
  metadata: {
    product?: string;
    amount?: number;
    currency?: string;
    source: string;
    campaign: string;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  campaignId?: string; // If null, applies to all campaigns
  condition: {
    metric: "conversion_rate" | "engagement_rate" | "cost_per_click" | "cost_per_conversion" | "roas" | "click_rate";
    operator: "below" | "above" | "equals" | "drops_by" | "increases_by";
    threshold: number;
    timeWindow: number; // minutes
  };
  severity: "low" | "medium" | "high" | "critical";
  actions: Array<{
    type: "notify" | "pause_campaign" | "adjust_budget" | "trigger_retargeting";
    parameters: Record<string, any>;
  }>;
  isActive: boolean;
  createdAt: Date;
}

export interface CampaignAlert {
  id: string;
  campaignId: string;
  ruleId: string;
  alertType: "performance_drop" | "budget_exceeded" | "low_quality" | "opportunity";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  currentValue: number;
  expectedValue: number;
  suggestedActions: string[];
  triggeredAt: Date;
  resolvedAt?: Date;
  status: "active" | "acknowledged" | "resolved" | "suppressed";
}

export interface RetargetingTrigger {
  campaignId: string;
  audienceSegment: string;
  triggerCondition: "abandonment" | "engagement_drop" | "conversion_opportunity" | "competitive_threat";
  urgency: "low" | "medium" | "high" | "critical";
  suggestedChannels: string[];
  suggestedContent: {
    tone: string;
    message: string;
    urgency: string;
    personalization: Record<string, any>;
  };
  estimatedImpact: {
    potentialRecovery: number;
    costEstimate: number;
    timeToImplement: number;
  };
}

export interface CampaignFeedback {
  campaignId: string;
  timestamp: Date;
  
  // Real engagement metrics
  engagement: {
    totalSignals: number;
    signalsByType: Record<string, number>;
    averageEngagementTime: number;
    engagementRate: number;
    viralCoefficient: number;
    retentionRate: number;
  };
  
  // Conversion metrics
  conversions: {
    totalConversions: number;
    conversionsByType: Record<string, number>;
    conversionRate: number;
    averageConversionValue: number;
    attributionBreakdown: Record<string, number>;
    timeToConversion: number;
  };
  
  // Performance alerts
  alerts: CampaignAlert[];
  
  // Retargeting opportunities
  retargetingTriggers: RetargetingTrigger[];
  
  // Intelligence insights
  insights: {
    trending: string[];
    declining: string[];
    opportunities: string[];
    risks: string[];
    recommendations: string[];
  };
  
  // Predictive analytics
  predictions: {
    expectedPerformance: Record<string, number>;
    riskFactors: string[];
    optimizationPotential: number;
    budgetRecommendations: Record<string, number>;
  };
}

export class CampaignFeedbackService {
  private memoryStore: AgentMemoryStore;
  private engagementSignals: Map<string, EngagementSignal[]> = new Map();
  private conversionSignals: Map<string, ConversionSignal[]> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, CampaignAlert[]> = new Map();
  private feedbackCache: Map<string, CampaignFeedback> = new Map();

  constructor() {
    this.memoryStore = new AgentMemoryStore();
    this.initializeDefaultAlertRules();
    this.startPeriodicMonitoring();
  }

  /**
   * Track engagement signal from user interaction
   */
  async trackEngagementSignal(signal: Omit<EngagementSignal, 'id' | 'value'>): Promise<void> {
    try {
      const engagementSignal: EngagementSignal = {
        ...signal,
        id: `eng_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        value: this.calculateEngagementValue(signal.signalType, signal.metadata),
      };

      // Store signal
      if (!this.engagementSignals.has(signal.campaignId)) {
        this.engagementSignals.set(signal.campaignId, []);
      }
      this.engagementSignals.get(signal.campaignId)!.push(engagementSignal);

      // Update real-time analytics
      await this.updateRealTimeAnalytics(signal.campaignId);

      // Check for alert conditions
      await this.checkAlertConditions(signal.campaignId);

      logger.info("Engagement signal tracked", { 
        campaignId: signal.campaignId, 
        signalType: signal.signalType, 
        value: engagementSignal.value 
      });

    } catch (error) {
      logger.error("Failed to track engagement signal", { error, campaignId: signal.campaignId });
    }
  }

  /**
   * Track conversion signal
   */
  async trackConversionSignal(signal: Omit<ConversionSignal, 'id'>): Promise<void> {
    try {
      const conversionSignal: ConversionSignal = {
        ...signal,
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      // Store signal
      if (!this.conversionSignals.has(signal.campaignId)) {
        this.conversionSignals.set(signal.campaignId, []);
      }
      this.conversionSignals.get(signal.campaignId)!.push(conversionSignal);

      // Update real-time analytics
      await this.updateRealTimeAnalytics(signal.campaignId);

      // Check for retargeting opportunities
      await this.checkAlertConditions(signal.campaignId);

      // Store in memory for learning
      await this.memoryStore.storeMemory(
        "campaign-feedback",
        `conversion_${signal.campaignId}`,
        conversionSignal,
        {
          campaignId: signal.campaignId,
          conversionType: signal.conversionType,
          value: signal.value.toString(),
        },
      );

      logger.info("Conversion signal tracked", { 
        campaignId: signal.campaignId, 
        conversionType: signal.conversionType, 
        value: signal.value 
      });

    } catch (error) {
      logger.error("Failed to track conversion signal", { error, campaignId: signal.campaignId });
    }
  }

  /**
   * Get comprehensive campaign feedback
   */
  async getCampaignFeedback(campaignId: string): Promise<CampaignFeedback> {
    try {
      // Check cache first
      if (this.feedbackCache.has(campaignId)) {
        const cached = this.feedbackCache.get(campaignId)!;
        // Return cached if less than 5 minutes old
        if (Date.now() - cached.timestamp.getTime() < 5 * 60 * 1000) {
          return cached;
        }
      }

      const engagement = await this.calculateEngagementMetrics(campaignId);
      const conversions = await this.calculateConversionMetrics(campaignId);
      const alerts = this.activeAlerts.get(campaignId) || [];
      const retargetingTriggers = await this.identifyRetargetingTriggers(campaignId);
      const insights = await this.generateInsights(campaignId, engagement, conversions);
      const predictions = await this.generatePredictions(campaignId, engagement, conversions);

      const feedback: CampaignFeedback = {
        campaignId,
        timestamp: new Date(),
        engagement,
        conversions,
        alerts,
        retargetingTriggers,
        insights,
        predictions,
      };

      // Cache the feedback
      this.feedbackCache.set(campaignId, feedback);

      return feedback;
    } catch (error) {
      logger.error("Failed to get campaign feedback", { error, campaignId });
      throw error;
    }
  }

  /**
   * Create alert rule for campaign monitoring
   */
  async createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt'>): Promise<AlertRule> {
    try {
      const alertRule: AlertRule = {
        ...rule,
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
      };

      this.alertRules.set(alertRule.id, alertRule);

      logger.info("Alert rule created", { ruleId: alertRule.id, name: alertRule.name });

      return alertRule;
    } catch (error) {
      logger.error("Failed to create alert rule", { error });
      throw error;
    }
  }

  /**
   * Get all active alerts for a campaign
   */
  async getCampaignAlerts(campaignId: string): Promise<CampaignAlert[]> {
    return this.activeAlerts.get(campaignId) || [];
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      for (const [campaignId, alerts] of this.activeAlerts.entries()) {
        const alert = alerts.find(a => a.id === alertId);
        if (alert) {
          alert.status = "resolved";
          alert.resolvedAt = new Date();
          
          logger.info("Alert resolved", { alertId, campaignId });
          break;
        }
      }
    } catch (error) {
      logger.error("Failed to resolve alert", { error, alertId });
    }
  }

  /**
   * Generate real-time alerts for underperforming campaigns
   */
  private async checkAlertConditions(campaignId: string): Promise<void> {
    try {
      const campaignFeedback = await this.getCampaignFeedback(campaignId);
      const relevantRules = Array.from(this.alertRules.values())
        .filter(rule => rule.isActive && (!rule.campaignId || rule.campaignId === campaignId));

      for (const rule of relevantRules) {
        const shouldAlert = await this.evaluateAlertCondition(rule, campaignFeedback);
        
        if (shouldAlert) {
          await this.triggerAlert(campaignId, rule, campaignFeedback);
        }
      }
    } catch (error) {
      logger.error("Failed to check alert conditions", { error, campaignId });
    }
  }

  /**
   * Identify retargeting opportunities
   */
  private async identifyRetargetingTriggers(campaignId: string): Promise<RetargetingTrigger[]> {
    try {
      const triggers: RetargetingTrigger[] = [];
      const engagementSignals = this.engagementSignals.get(campaignId) || [];
      const conversionSignals = this.conversionSignals.get(campaignId) || [];

      // Abandonment analysis
      const abandonmentTrigger = await this.analyzeAbandonment(campaignId, engagementSignals, conversionSignals);
      if (abandonmentTrigger) {
        triggers.push(abandonmentTrigger);
      }

      // Engagement drop analysis
      const engagementDropTrigger = await this.analyzeEngagementDrop(campaignId, engagementSignals);
      if (engagementDropTrigger) {
        triggers.push(engagementDropTrigger);
      }

      // Conversion opportunity analysis
      const conversionOpportunityTrigger = await this.analyzeConversionOpportunity(campaignId, engagementSignals, conversionSignals);
      if (conversionOpportunityTrigger) {
        triggers.push(conversionOpportunityTrigger);
      }

      return triggers.sort((a, b) => {
        const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      });
    } catch (error) {
      logger.error("Failed to identify retargeting triggers", { error, campaignId });
      return [];
    }
  }

  // Helper methods

  private calculateEngagementValue(signalType: string, metadata: any): number {
    const baseValues = {
      view: 1,
      hover: 2,
      click: 5,
      scroll: 3,
      download: 10,
      share: 15,
      bookmark: 8,
      comment: 12,
      like: 6,
      conversion: 100,
    };

    let value = baseValues[signalType as keyof typeof baseValues] || 1;

    // Apply modifiers based on metadata
    if (metadata.duration > 30) value *= 1.5; // Extended engagement
    if (metadata.depth > 0.7) value *= 1.3; // Deep engagement
    if (metadata.platform === 'mobile') value *= 1.1; // Mobile bonus

    return value;
  }

  private async calculateEngagementMetrics(campaignId: string): Promise<CampaignFeedback['engagement']> {
    const signals = this.engagementSignals.get(campaignId) || [];
    
    if (signals.length === 0) {
      return {
        totalSignals: 0,
        signalsByType: {},
        averageEngagementTime: 0,
        engagementRate: 0,
        viralCoefficient: 0,
        retentionRate: 0,
      };
    }

    const signalsByType = signals.reduce((acc, signal) => {
      acc[signal.signalType] = (acc[signal.signalType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageEngagementTime = signals.reduce((sum, signal) => sum + signal.metadata.duration, 0) / signals.length;
    
    // Calculate engagement rate (unique users who engaged / total reached)
    const uniqueUsers = new Set(signals.map(s => s.userId)).size;
    const estimatedReach = uniqueUsers * 3; // Rough estimate
    const engagementRate = uniqueUsers / estimatedReach;

    // Calculate viral coefficient (shares / total engagements)
    const shares = signalsByType.share || 0;
    const viralCoefficient = shares / signals.length;

    // Calculate retention rate (repeat visitors)
    const userVisits = signals.reduce((acc, signal) => {
      acc[signal.userId] = (acc[signal.userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const repeatUsers = Object.values(userVisits).filter(count => count > 1).length;
    const retentionRate = repeatUsers / uniqueUsers;

    return {
      totalSignals: signals.length,
      signalsByType,
      averageEngagementTime,
      engagementRate,
      viralCoefficient,
      retentionRate,
    };
  }

  private async calculateConversionMetrics(campaignId: string): Promise<CampaignFeedback['conversions']> {
    const conversions = this.conversionSignals.get(campaignId) || [];
    const engagements = this.engagementSignals.get(campaignId) || [];
    
    if (conversions.length === 0) {
      return {
        totalConversions: 0,
        conversionsByType: {},
        conversionRate: 0,
        averageConversionValue: 0,
        attributionBreakdown: {},
        timeToConversion: 0,
      };
    }

    const conversionsByType = conversions.reduce((acc, conversion) => {
      acc[conversion.conversionType] = (acc[conversion.conversionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const uniqueUsers = new Set(engagements.map(e => e.userId)).size;
    const convertedUsers = new Set(conversions.map(c => c.userId)).size;
    const conversionRate = uniqueUsers > 0 ? convertedUsers / uniqueUsers : 0;

    const averageConversionValue = conversions.reduce((sum, conv) => sum + conv.value, 0) / conversions.length;

    // Calculate attribution breakdown
    const attributionBreakdown = conversions.reduce((acc, conversion) => {
      conversion.attributionPath.forEach(touchpoint => {
        acc[touchpoint.channel] = (acc[touchpoint.channel] || 0) + touchpoint.weight;
      });
      return acc;
    }, {} as Record<string, number>);

    // Calculate average time to conversion
    const timeToConversion = conversions.reduce((sum, conversion) => {
      const userEngagements = engagements.filter(e => e.userId === conversion.userId);
      if (userEngagements.length > 0) {
        const firstEngagement = Math.min(...userEngagements.map(e => e.timestamp.getTime()));
        return sum + (conversion.timestamp.getTime() - firstEngagement);
      }
      return sum;
    }, 0) / conversions.length;

    return {
      totalConversions: conversions.length,
      conversionsByType,
      conversionRate,
      averageConversionValue,
      attributionBreakdown,
      timeToConversion: timeToConversion / (1000 * 60 * 60), // Convert to hours
    };
  }

  private async generateInsights(campaignId: string, engagement: any, conversions: any): Promise<CampaignFeedback['insights']> {
    const insights = {
      trending: [] as string[],
      declining: [] as string[],
      opportunities: [] as string[],
      risks: [] as string[],
      recommendations: [] as string[],
    };

    // Trending analysis
    if (engagement.engagementRate > 0.05) {
      insights.trending.push("High engagement rate indicates strong content resonance");
    }
    if (engagement.viralCoefficient > 0.1) {
      insights.trending.push("Content showing viral potential with high share rates");
    }

    // Declining analysis
    if (engagement.engagementRate < 0.02) {
      insights.declining.push("Low engagement suggests content or targeting issues");
    }
    if (conversions.conversionRate < 0.01) {
      insights.declining.push("Poor conversion rate indicates funnel optimization needed");
    }

    // Opportunities
    if (engagement.retentionRate > 0.3) {
      insights.opportunities.push("High retention rate - opportunity to scale audience");
    }
    if (conversions.averageConversionValue > 50) {
      insights.opportunities.push("High-value conversions - increase budget allocation");
    }

    // Risks
    if (engagement.averageEngagementTime < 10) {
      insights.risks.push("Short engagement time suggests content quality issues");
    }

    // Recommendations
    insights.recommendations.push("Monitor engagement patterns for optimization opportunities");
    if (conversions.conversionRate < 0.02) {
      insights.recommendations.push("Implement retargeting campaigns for abandoned users");
    }

    return insights;
  }

  private async generatePredictions(campaignId: string, engagement: any, conversions: any): Promise<CampaignFeedback['predictions']> {
    // Simple predictive model - in production would use ML
    const expectedPerformance = {
      engagement_rate: Math.max(0.01, engagement.engagementRate * 1.1),
      conversion_rate: Math.max(0.005, conversions.conversionRate * 1.05),
      cost_per_conversion: Math.max(10, 50 / Math.max(conversions.conversionRate, 0.01)),
    };

    const riskFactors = [];
    if (engagement.engagementRate < 0.02) riskFactors.push("Low engagement trend");
    if (conversions.conversionRate < 0.01) riskFactors.push("Poor conversion performance");

    const optimizationPotential = Math.min(95, Math.max(10, 
      (engagement.engagementRate + conversions.conversionRate) * 1000
    ));

    const budgetRecommendations = {
      current_efficiency: conversions.averageConversionValue / 50, // Rough cost estimate
      recommended_increase: engagement.engagementRate > 0.05 ? 1.2 : 0.8,
      risk_adjustment: riskFactors.length > 0 ? 0.9 : 1.0,
    };

    return {
      expectedPerformance,
      riskFactors,
      optimizationPotential,
      budgetRecommendations,
    };
  }

  private async evaluateAlertCondition(rule: AlertRule, feedback: CampaignFeedback): Promise<boolean> {
    const { metric, operator, threshold } = rule.condition;
    
    let currentValue: number;
    switch (metric) {
      case "conversion_rate":
        currentValue = feedback.conversions.conversionRate;
        break;
      case "engagement_rate":
        currentValue = feedback.engagement.engagementRate;
        break;
      case "cost_per_conversion":
        currentValue = feedback.predictions.expectedPerformance.cost_per_conversion;
        break;
      default:
        return false;
    }

    switch (operator) {
      case "below":
        return currentValue < threshold;
      case "above":
        return currentValue > threshold;
      case "equals":
        return Math.abs(currentValue - threshold) < 0.001;
      default:
        return false;
    }
  }

  private async triggerAlert(campaignId: string, rule: AlertRule, feedback: CampaignFeedback): Promise<void> {
    const alert: CampaignAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      campaignId,
      ruleId: rule.id,
      alertType: "performance_drop",
      severity: rule.severity,
      message: `${rule.condition.metric} is ${rule.condition.operator} ${rule.condition.threshold}`,
      currentValue: 0, // Would calculate based on metric
      expectedValue: rule.condition.threshold,
      suggestedActions: ["Review targeting", "Adjust budget", "Optimize content"],
      triggeredAt: new Date(),
      status: "active",
    };

    if (!this.activeAlerts.has(campaignId)) {
      this.activeAlerts.set(campaignId, []);
    }
    this.activeAlerts.get(campaignId)!.push(alert);

    // Execute alert actions
    for (const action of rule.actions) {
      await this.executeAlertAction(campaignId, action);
    }

    logger.warn("Campaign alert triggered", { 
      campaignId, 
      alertId: alert.id, 
      severity: alert.severity 
    });
  }

  private async executeAlertAction(campaignId: string, action: any): Promise<void> {
    switch (action.type) {
      case "notify":
        // Send notification (email, Slack, etc.)
        logger.info("Alert notification sent", { campaignId, action: action.type });
        break;
      case "trigger_retargeting":
        // Trigger retargeting campaign
        logger.info("Retargeting triggered by alert", { campaignId });
        break;
      default:
        logger.info("Alert action executed", { campaignId, actionType: action.type });
    }
  }

  private async analyzeAbandonment(campaignId: string, engagements: EngagementSignal[], conversions: ConversionSignal[]): Promise<RetargetingTrigger | null> {
    const clickUsers = new Set(engagements.filter(e => e.signalType === 'click').map(e => e.userId));
    const convertedUsers = new Set(conversions.map(c => c.userId));
    const abandonedUsers = [...clickUsers].filter(userId => !convertedUsers.has(userId));

    if (abandonedUsers.length > 10) {
      return {
        campaignId,
        audienceSegment: "clicked_no_convert",
        triggerCondition: "abandonment",
        urgency: abandonedUsers.length > 50 ? "high" : "medium",
        suggestedChannels: ["email", "facebook_ads"],
        suggestedContent: {
          tone: "urgent",
          message: "Complete your purchase now",
          urgency: "high",
          personalization: { discount: true, product: true },
        },
        estimatedImpact: {
          potentialRecovery: abandonedUsers.length * 0.15,
          costEstimate: abandonedUsers.length * 2,
          timeToImplement: 60, // minutes
        },
      };
    }

    return null;
  }

  private async analyzeEngagementDrop(campaignId: string, engagements: EngagementSignal[]): Promise<RetargetingTrigger | null> {
    if (engagements.length < 100) return null;

    const recentEngagements = engagements.filter(e => 
      Date.now() - e.timestamp.getTime() < 24 * 60 * 60 * 1000
    );
    
    const engagementDropRate = 1 - (recentEngagements.length / (engagements.length / 7)); // Compare to daily average

    if (engagementDropRate > 0.3) {
      return {
        campaignId,
        audienceSegment: "declining_engagement",
        triggerCondition: "engagement_drop",
        urgency: "medium",
        suggestedChannels: ["social", "content_marketing"],
        suggestedContent: {
          tone: "engaging",
          message: "Re-discover what you love",
          urgency: "medium",
          personalization: { content: true, timing: true },
        },
        estimatedImpact: {
          potentialRecovery: recentEngagements.length * 0.25,
          costEstimate: recentEngagements.length * 1.5,
          timeToImplement: 120, // minutes
        },
      };
    }

    return null;
  }

  private async analyzeConversionOpportunity(campaignId: string, engagements: EngagementSignal[], conversions: ConversionSignal[]): Promise<RetargetingTrigger | null> {
    const highEngagementUsers = engagements
      .filter(e => e.value > 10)
      .map(e => e.userId);
    
    const unconvertedHighEngagement = [...new Set(highEngagementUsers)]
      .filter(userId => !conversions.some(c => c.userId === userId));

    if (unconvertedHighEngagement.length > 5) {
      return {
        campaignId,
        audienceSegment: "high_engagement_no_convert",
        triggerCondition: "conversion_opportunity",
        urgency: "high",
        suggestedChannels: ["email", "remarketing"],
        suggestedContent: {
          tone: "persuasive",
          message: "Special offer just for you",
          urgency: "medium",
          personalization: { offer: true, social_proof: true },
        },
        estimatedImpact: {
          potentialRecovery: unconvertedHighEngagement.length * 0.3,
          costEstimate: unconvertedHighEngagement.length * 3,
          timeToImplement: 90, // minutes
        },
      };
    }

    return null;
  }

  private async updateRealTimeAnalytics(campaignId: string): Promise<void> {
    // Clear cache to force refresh
    this.feedbackCache.delete(campaignId);
    
    // Update real-time dashboard data
    const feedback = await this.getCampaignFeedback(campaignId);
    
    // Store updated metrics
    await this.memoryStore.storeMemory(
      "campaign-analytics",
      `realtime_${campaignId}`,
      {
        engagement: feedback.engagement,
        conversions: feedback.conversions,
        timestamp: feedback.timestamp,
      },
      {
        campaignId,
        engagementRate: feedback.engagement.engagementRate.toString(),
        conversionRate: feedback.conversions.conversionRate.toString(),
      },
    );
  }

  private initializeDefaultAlertRules(): void {
    // Low conversion rate alert
    this.createAlertRule({
      name: "Low Conversion Rate",
      condition: {
        metric: "conversion_rate",
        operator: "below",
        threshold: 0.01,
        timeWindow: 60,
      },
      severity: "high",
      actions: [
        { type: "notify", parameters: { channel: "email" } },
        { type: "trigger_retargeting", parameters: { urgency: "high" } },
      ],
      isActive: true,
    });

    // Low engagement rate alert
    this.createAlertRule({
      name: "Low Engagement Rate",
      condition: {
        metric: "engagement_rate",
        operator: "below",
        threshold: 0.02,
        timeWindow: 30,
      },
      severity: "medium",
      actions: [
        { type: "notify", parameters: { channel: "slack" } },
      ],
      isActive: true,
    });
  }

  private startPeriodicMonitoring(): void {
    // Check alerts every 5 minutes
    const monitoringInterval = global.setInterval(async () => {
      try {
        for (const campaignId of this.engagementSignals.keys()) {
          await this.checkAlertConditions(campaignId);
        }
      } catch (error) {
        logger.error("Periodic monitoring failed", { error });
      }
    }, 5 * 60 * 1000);
    
    // Store interval reference for cleanup if needed
    process.on('SIGINT', () => {
      global.clearInterval(monitoringInterval);
    });
  }
}

export default CampaignFeedbackService;