import { AbstractAgent, AgentPayload, AgentResult } from "../base-agent";
import { PrismaClient } from "@neon/data-model";
import { logger } from "@neon/utils";
import OpenAI from "openai";
import { withRetryTimeoutFallback } from "../utils/withRetry";

export interface SEOAlertContext {
  campaignId?: string;
  urls?: string[];
  alertTypes?: string[];
  timeframe?: string; // "24h", "7d", "30d"
  thresholds?: {
    scoreDropThreshold?: number;
    keywordCannibalThreshold?: number;
    metadataCompleteness?: number;
  };
}

export interface SEOAlertResult extends AgentResult {
  alerts: SEOAlertData[];
  summary: {
    totalAlerts: number;
    criticalAlerts: number;
    warningAlerts: number;
    infoAlerts: number;
    topIssues: string[];
  };
  recommendations: string[];
  trends: {
    alertTrends: Array<{ date: string; count: number; severity: string }>;
    commonIssues: Array<{ type: string; frequency: number }>;
  };
}

export interface SEOAlertData {
  id?: string;
  campaignId?: string;
  url: string;
  alertType: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  aiReason?: string;
  suggestion?: string;
  threshold?: number;
  currentValue?: number;
  previousValue?: number;
  metadata?: Record<string, any>;
  priority: number;
  isResolved?: boolean;
  createdAt?: Date;
}

export class SEOAlertAgent extends AbstractAgent {
  private prisma: PrismaClient;
  private openai: OpenAI;
  private readonly ALERT_THRESHOLDS = {
    SCORE_DROP_CRITICAL: 20,
    SCORE_DROP_WARNING: 10,
    KEYWORD_CANNIBALIZATION_THRESHOLD: 3,
    METADATA_COMPLETENESS_THRESHOLD: 0.7,
    OPPORTUNITY_SCORE_THRESHOLD: 80,
  };

  constructor() {
    super("seo-alert-agent", "SEOAlertAgent", "seo", [
      "monitor_seo_performance",
      "detect_score_drops",
      "identify_keyword_cannibalization",
      "check_metadata_completeness",
      "find_opportunities",
      "generate_alerts",
      "analyze_alert_trends",
    ]);

    this.prisma = new PrismaClient();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!process.env.OPENAI_API_KEY) {
      logger.warn(
        "OPENAI_API_KEY not found. SEO Alert Agent will run in limited mode.",
        {},
        "SEOAlertAgent",
      );
    }
  }

  async execute(payload: AgentPayload): Promise<AgentResult> {
    return this.executeWithErrorHandling(payload, async () => {
      const { task, context } = payload;
      const alertContext = context as SEOAlertContext;

      switch (task) {
        case "monitor_seo_performance":
          return await this.monitorSEOPerformance(alertContext);
        case "detect_score_drops":
          return await this.detectScoreDrops(alertContext);
        case "identify_keyword_cannibalization":
          return await this.identifyKeywordCannibalization(alertContext);
        case "check_metadata_completeness":
          return await this.checkMetadataCompleteness(alertContext);
        case "find_opportunities":
          return await this.findOpportunities(alertContext);
        case "generate_alerts":
          return await this.generateAlerts(alertContext);
        case "analyze_alert_trends":
          return await this.analyzeAlertTrends(alertContext);
        default:
          throw new Error(`Unknown task: ${task}`);
      }
    });
  }

  /**
   * Main monitoring function that runs comprehensive SEO analysis
   */
  async monitorSEOPerformance(
    context: SEOAlertContext,
  ): Promise<SEOAlertResult> {
    const { campaignId, timeframe = "24h" } = context;
    const alerts: SEOAlertData[] = [];

    try {
      // Get recent SEO analyses for the campaign
      const recentAnalyses = await this.getRecentSEOAnalyses(campaignId, timeframe);
      
      if (recentAnalyses.length === 0) {
        return {
          alerts: [],
          summary: {
            totalAlerts: 0,
            criticalAlerts: 0,
            warningAlerts: 0,
            infoAlerts: 0,
            topIssues: [],
          },
          recommendations: ["No recent SEO analyses found. Consider running SEO analysis on your key pages."],
          trends: {
            alertTrends: [],
            commonIssues: [],
          },
        };
      }

      // Run all monitoring checks
      const scoreDropAlerts = await this.detectScoreDrops(context);
      const cannibalizationAlerts = await this.identifyKeywordCannibalization(context);
      const metadataAlerts = await this.checkMetadataCompleteness(context);
      const opportunityAlerts = await this.findOpportunities(context);

      // Combine all alerts
      alerts.push(...scoreDropAlerts.alerts);
      alerts.push(...cannibalizationAlerts.alerts);
      alerts.push(...metadataAlerts.alerts);
      alerts.push(...opportunityAlerts.alerts);

      // Generate AI insights for the alerts
      const aiInsights = await this.generateAIInsights(alerts, recentAnalyses);

      // Save alerts to database
      await this.saveAlerts(alerts);

      return {
        alerts,
        summary: this.generateAlertSummary(alerts),
        recommendations: aiInsights.recommendations,
        trends: await this.getAlertTrends(campaignId, timeframe),
      };
    } catch (error) {
      logger.error("SEO performance monitoring failed", error as Error, "SEOAlertAgent");
      return this.getFallbackResult();
    }
  }

  /**
   * Detect significant score drops in SEO performance
   */
  async detectScoreDrops(context: SEOAlertContext): Promise<SEOAlertResult> {
    const { campaignId, thresholds } = context;
    const alerts: SEOAlertData[] = [];
    const scoreDropThreshold = thresholds?.scoreDropThreshold || this.ALERT_THRESHOLDS.SCORE_DROP_WARNING;

    try {
      // Get SEO analyses with score comparisons
      const scoreComparisons = await this.getScoreComparisons(campaignId);

      for (const comparison of scoreComparisons) {
        const scoreDrop = comparison.previousScore - comparison.currentScore;
        
        if (scoreDrop >= this.ALERT_THRESHOLDS.SCORE_DROP_CRITICAL) {
          alerts.push({
            url: comparison.url,
            alertType: "score_drop",
            severity: "critical",
            title: `Critical SEO Score Drop: ${comparison.url}`,
            message: `SEO score dropped by ${scoreDrop} points (${comparison.previousScore} → ${comparison.currentScore})`,
            threshold: this.ALERT_THRESHOLDS.SCORE_DROP_CRITICAL,
            currentValue: comparison.currentScore,
            previousValue: comparison.previousScore,
            priority: 10,
            campaignId,
            metadata: {
              analysisIds: [comparison.previousAnalysisId, comparison.currentAnalysisId],
              timeframe: comparison.timeframe,
            },
          });
        } else if (scoreDrop >= scoreDropThreshold) {
          alerts.push({
            url: comparison.url,
            alertType: "score_drop",
            severity: "warning",
            title: `SEO Score Drop Detected: ${comparison.url}`,
            message: `SEO score dropped by ${scoreDrop} points (${comparison.previousScore} → ${comparison.currentScore})`,
            threshold: scoreDropThreshold,
            currentValue: comparison.currentScore,
            previousValue: comparison.previousScore,
            priority: 7,
            campaignId,
            metadata: {
              analysisIds: [comparison.previousAnalysisId, comparison.currentAnalysisId],
              timeframe: comparison.timeframe,
            },
          });
        }
      }

      // Generate AI explanations for score drops
      for (const alert of alerts) {
        alert.aiReason = await this.generateScoreDropReason(alert);
        alert.suggestion = await this.generateScoreDropSuggestion(alert);
      }

      return {
        alerts,
        summary: this.generateAlertSummary(alerts),
        recommendations: this.generateScoreDropRecommendations(alerts),
        trends: { alertTrends: [], commonIssues: [] },
      };
    } catch (error) {
      logger.error("Score drop detection failed", error as Error, "SEOAlertAgent");
      return { alerts: [], summary: { totalAlerts: 0, criticalAlerts: 0, warningAlerts: 0, infoAlerts: 0, topIssues: [] }, recommendations: [], trends: { alertTrends: [], commonIssues: [] } };
    }
  }

  /**
   * Identify keyword cannibalization issues
   */
  async identifyKeywordCannibalization(context: SEOAlertContext): Promise<SEOAlertResult> {
    const { campaignId } = context;
    const alerts: SEOAlertData[] = [];

    try {
      // Get keyword analysis data from recent SEO analyses
      const keywordConflicts = await this.getKeywordConflicts(campaignId);

      for (const conflict of keywordConflicts) {
        if (conflict.conflictingUrls.length >= this.ALERT_THRESHOLDS.KEYWORD_CANNIBALIZATION_THRESHOLD) {
          alerts.push({
            url: conflict.conflictingUrls[0], // Primary URL
            alertType: "keyword_cannibalization",
            severity: "warning",
            title: `Keyword Cannibalization: "${conflict.keyword}"`,
            message: `Keyword "${conflict.keyword}" is being targeted by ${conflict.conflictingUrls.length} pages: ${conflict.conflictingUrls.join(", ")}`,
            threshold: this.ALERT_THRESHOLDS.KEYWORD_CANNIBALIZATION_THRESHOLD,
            currentValue: conflict.conflictingUrls.length,
            priority: 6,
            campaignId,
            metadata: {
              keyword: conflict.keyword,
              conflictingUrls: conflict.conflictingUrls,
              density: conflict.avgDensity,
            },
          });
        }
      }

      // Generate AI suggestions for cannibalization issues
      for (const alert of alerts) {
        alert.aiReason = await this.generateCannibalizationReason(alert);
        alert.suggestion = await this.generateCannibalizationSuggestion(alert);
      }

      return {
        alerts,
        summary: this.generateAlertSummary(alerts),
        recommendations: this.generateCannibalizationRecommendations(alerts),
        trends: { alertTrends: [], commonIssues: [] },
      };
    } catch (error) {
      logger.error("Keyword cannibalization detection failed", error as Error, "SEOAlertAgent");
      return { alerts: [], summary: { totalAlerts: 0, criticalAlerts: 0, warningAlerts: 0, infoAlerts: 0, topIssues: [] }, recommendations: [], trends: { alertTrends: [], commonIssues: [] } };
    }
  }

  /**
   * Check metadata completeness across pages
   */
  async checkMetadataCompleteness(context: SEOAlertContext): Promise<SEOAlertResult> {
    const { campaignId } = context;
    const alerts: SEOAlertData[] = [];

    try {
      // Get metadata analysis from recent SEO analyses
      const metadataIssues = await this.getMetadataIssues(campaignId);

      for (const issue of metadataIssues) {
        const completenessScore = issue.completenessScore;
        
        if (completenessScore < this.ALERT_THRESHOLDS.METADATA_COMPLETENESS_THRESHOLD) {
          const severity = completenessScore < 0.3 ? "critical" : "warning";
          const priority = completenessScore < 0.3 ? 9 : 5;

          alerts.push({
            url: issue.url,
            alertType: "missing_metadata",
            severity,
            title: `Incomplete Metadata: ${issue.url}`,
            message: `Page metadata is ${Math.round(completenessScore * 100)}% complete. Missing: ${issue.missingFields.join(", ")}`,
            threshold: this.ALERT_THRESHOLDS.METADATA_COMPLETENESS_THRESHOLD,
            currentValue: completenessScore,
            priority,
            campaignId,
            metadata: {
              missingFields: issue.missingFields,
              presentFields: issue.presentFields,
              recommendations: issue.recommendations,
            },
          });
        }
      }

      // Generate AI suggestions for metadata issues
      for (const alert of alerts) {
        alert.aiReason = await this.generateMetadataReason(alert);
        alert.suggestion = await this.generateMetadataSuggestion(alert);
      }

      return {
        alerts,
        summary: this.generateAlertSummary(alerts),
        recommendations: this.generateMetadataRecommendations(alerts),
        trends: { alertTrends: [], commonIssues: [] },
      };
    } catch (error) {
      logger.error("Metadata completeness check failed", error as Error, "SEOAlertAgent");
      return { alerts: [], summary: { totalAlerts: 0, criticalAlerts: 0, warningAlerts: 0, infoAlerts: 0, topIssues: [] }, recommendations: [], trends: { alertTrends: [], commonIssues: [] } };
    }
  }

  /**
   * Find SEO opportunities
   */
  async findOpportunities(context: SEOAlertContext): Promise<SEOAlertResult> {
    const { campaignId } = context;
    const alerts: SEOAlertData[] = [];

    try {
      // Get opportunity analysis from recent SEO analyses
      const opportunities = await this.getOpportunities(campaignId);

      for (const opportunity of opportunities) {
        if (opportunity.score >= this.ALERT_THRESHOLDS.OPPORTUNITY_SCORE_THRESHOLD) {
          alerts.push({
            url: opportunity.url,
            alertType: "opportunity",
            severity: "info",
            title: `SEO Opportunity: ${opportunity.type}`,
            message: `High-value opportunity detected: ${opportunity.description}`,
            threshold: this.ALERT_THRESHOLDS.OPPORTUNITY_SCORE_THRESHOLD,
            currentValue: opportunity.score,
            priority: 4,
            campaignId,
            metadata: {
              opportunityType: opportunity.type,
              potentialImpact: opportunity.impact,
              difficulty: opportunity.difficulty,
              keywords: opportunity.keywords,
            },
          });
        }
      }

      // Generate AI insights for opportunities
      for (const alert of alerts) {
        alert.aiReason = await this.generateOpportunityReason(alert);
        alert.suggestion = await this.generateOpportunitySuggestion(alert);
      }

      return {
        alerts,
        summary: this.generateAlertSummary(alerts),
        recommendations: this.generateOpportunityRecommendations(alerts),
        trends: { alertTrends: [], commonIssues: [] },
      };
    } catch (error) {
      logger.error("Opportunity detection failed", error as Error, "SEOAlertAgent");
      return { alerts: [], summary: { totalAlerts: 0, criticalAlerts: 0, warningAlerts: 0, infoAlerts: 0, topIssues: [] }, recommendations: [], trends: { alertTrends: [], commonIssues: [] } };
    }
  }

  /**
   * Generate comprehensive alerts for a campaign
   */
  async generateAlerts(context: SEOAlertContext): Promise<SEOAlertResult> {
    return await this.monitorSEOPerformance(context);
  }

  /**
   * Analyze alert trends over time
   */
  async analyzeAlertTrends(context: SEOAlertContext): Promise<SEOAlertResult> {
    const { campaignId, timeframe = "30d" } = context;

    try {
      const trends = await this.getAlertTrends(campaignId, timeframe);
      const commonIssues = await this.getCommonIssues(campaignId, timeframe);

      return {
        alerts: [],
        summary: { totalAlerts: 0, criticalAlerts: 0, warningAlerts: 0, infoAlerts: 0, topIssues: [] },
        recommendations: this.generateTrendRecommendations(trends, commonIssues),
        trends: {
          alertTrends: trends.alertTrends,
          commonIssues: commonIssues,
        },
      };
    } catch (error) {
      logger.error("Alert trend analysis failed", error as Error, "SEOAlertAgent");
      return { alerts: [], summary: { totalAlerts: 0, criticalAlerts: 0, warningAlerts: 0, infoAlerts: 0, topIssues: [] }, recommendations: [], trends: { alertTrends: [], commonIssues: [] } };
    }
  }

  // Helper methods for data retrieval
  private async getRecentSEOAnalyses(campaignId?: string, timeframe: string = "24h") {
    const hoursBack = this.getHoursFromTimeframe(timeframe);
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    return await this.prisma.sEOAnalysis.findMany({
      where: {
        campaignId,
        createdAt: {
          gte: since,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        seoEntry: true,
      },
    });
  }

  private async getScoreComparisons(campaignId?: string) {
    // Get recent analyses grouped by URL for comparison
    const analyses = await this.prisma.sEOAnalysis.findMany({
      where: {
        campaignId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limit to recent analyses
    });

    const urlGroups: Record<string, any[]> = {};
    analyses.forEach(analysis => {
      if (!urlGroups[analysis.pageUrl]) {
        urlGroups[analysis.pageUrl] = [];
      }
      urlGroups[analysis.pageUrl].push(analysis);
    });

    const comparisons = [];
    for (const [url, urlAnalyses] of Object.entries(urlGroups)) {
      if (urlAnalyses.length >= 2) {
        const current = urlAnalyses[0]; // Most recent
        const previous = urlAnalyses[1]; // Second most recent
        
        comparisons.push({
          url,
          currentScore: current.score,
          previousScore: previous.score,
          currentAnalysisId: current.id,
          previousAnalysisId: previous.id,
          timeframe: Math.abs(current.createdAt.getTime() - previous.createdAt.getTime()) / (1000 * 60 * 60), // Hours
        });
      }
    }

    return comparisons;
  }

  private async getKeywordConflicts(campaignId?: string) {
    // Analyze keyword usage across pages to find conflicts
    const analyses = await this.prisma.sEOAnalysis.findMany({
      where: {
        campaignId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Recent analyses
    });

    const keywordUsage: Record<string, { urls: string[], density: number }> = {};
    
    analyses.forEach(analysis => {
      if (analysis.keywords && typeof analysis.keywords === 'object' && Array.isArray(analysis.keywords)) {
        analysis.keywords.forEach((kwData: any) => {
          if (kwData.keyword && kwData.density) {
            if (!keywordUsage[kwData.keyword]) {
              keywordUsage[kwData.keyword] = { urls: [], density: 0 };
            }
            keywordUsage[kwData.keyword].urls.push(analysis.pageUrl);
            keywordUsage[kwData.keyword].density += kwData.density;
          }
        });
      }
    });

    const conflicts = [];
    for (const [keyword, usage] of Object.entries(keywordUsage)) {
      const uniqueUrls = [...new Set(usage.urls)];
      if (uniqueUrls.length > 1) {
        conflicts.push({
          keyword,
          conflictingUrls: uniqueUrls,
          avgDensity: usage.density / usage.urls.length,
        });
      }
    }

    return conflicts;
  }

  private async getMetadataIssues(campaignId?: string) {
    const analyses = await this.prisma.sEOAnalysis.findMany({
      where: {
        campaignId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    const issues = [];
    for (const analysis of analyses) {
      if (analysis.suggestions && typeof analysis.suggestions === 'object' && Array.isArray(analysis.suggestions)) {
        const metadataIssues = analysis.suggestions.filter((suggestion: any) => 
          suggestion.type === 'meta' || suggestion.type === 'title'
        );
        
        if (metadataIssues.length > 0) {
          const missingFields = metadataIssues.map((issue: any) => issue.type);
          const completenessScore = 1 - (metadataIssues.length / 5); // Assume 5 key metadata fields
          
          issues.push({
            url: analysis.pageUrl,
            missingFields,
            presentFields: [],
            completenessScore,
            recommendations: metadataIssues.map((issue: any) => issue.message),
          });
        }
      }
    }

    return issues;
  }

  private async getOpportunities(campaignId?: string) {
    const analyses = await this.prisma.sEOAnalysis.findMany({
      where: {
        campaignId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    const opportunities = [];
    for (const analysis of analyses) {
      if (analysis.suggestions && typeof analysis.suggestions === 'object' && Array.isArray(analysis.suggestions)) {
        const lowEffortHighImpact = analysis.suggestions.filter((suggestion: any) => 
          suggestion.effort === 'easy' && suggestion.impact === 'high'
        );
        
        lowEffortHighImpact.forEach((opportunity: any) => {
          opportunities.push({
            url: analysis.pageUrl,
            type: opportunity.type,
            description: opportunity.message,
            score: opportunity.priority * 10, // Convert priority to score
            impact: opportunity.impact,
            difficulty: opportunity.effort,
            keywords: analysis.keywords || [],
          });
        });
      }
    }

    return opportunities;
  }

  private async getAlertTrends(campaignId?: string, timeframe: string) {
    const hoursBack = this.getHoursFromTimeframe(timeframe);
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const alerts = await this.prisma.sEOAlert.findMany({
      where: {
        campaignId,
        createdAt: {
          gte: since,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group alerts by date and severity
    const trendData: Record<string, Record<string, number>> = {};
    alerts.forEach(alert => {
      const date = alert.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!trendData[date]) {
        trendData[date] = { critical: 0, warning: 0, info: 0 };
      }
      trendData[date][alert.severity]++;
    });

    const alertTrends = Object.entries(trendData).map(([date, counts]) => ({
      date,
      count: counts.critical + counts.warning + counts.info,
      severity: counts.critical > 0 ? 'critical' : counts.warning > 0 ? 'warning' : 'info',
    }));

    return { alertTrends };
  }

  private async getCommonIssues(campaignId?: string, timeframe: string) {
    const hoursBack = this.getHoursFromTimeframe(timeframe);
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const alerts = await this.prisma.sEOAlert.findMany({
      where: {
        campaignId,
        createdAt: {
          gte: since,
        },
      },
    });

    const issueFrequency: Record<string, number> = {};
    alerts.forEach(alert => {
      issueFrequency[alert.alertType] = (issueFrequency[alert.alertType] || 0) + 1;
    });

    return Object.entries(issueFrequency).map(([type, frequency]) => ({
      type,
      frequency,
    }));
  }

  // AI-powered insight generation
  private async generateAIInsights(alerts: SEOAlertData[], analyses: any[]) {
    if (!this.openai) {
      return { recommendations: this.getFallbackRecommendations(alerts) };
    }

    const prompt = this.buildInsightPrompt(alerts, analyses);
    
    return await withRetryTimeoutFallback(
      async () => {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are an expert SEO analyst. Provide actionable insights and recommendations based on SEO alerts and analysis data.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });

        const aiOutput = response.choices[0]?.message?.content;
        if (!aiOutput) {
          throw new Error("No response from OpenAI");
        }

        return this.parseAIInsights(aiOutput);
      },
      async () => {
        logger.warn("AI insights generation failed, using fallback", {}, "SEOAlertAgent");
        return { recommendations: this.getFallbackRecommendations(alerts) };
      },
      { retries: 2, delay: 1000, timeoutMs: 20000 }
    );
  }

  private buildInsightPrompt(alerts: SEOAlertData[], analyses: any[]): string {
    const alertSummary = alerts.map(alert => 
      `${alert.severity.toUpperCase()}: ${alert.title} - ${alert.message}`
    ).join('\n');

    const analysisSummary = analyses.slice(0, 5).map(analysis => 
      `URL: ${analysis.pageUrl}, Score: ${analysis.score}, Issues: ${JSON.stringify(analysis.issues).slice(0, 100)}...`
    ).join('\n');

    return `
Analyze these SEO alerts and provide actionable recommendations:

ALERTS:
${alertSummary}

RECENT ANALYSES:
${analysisSummary}

Please provide:
1. Top 3 priority recommendations
2. Root cause analysis for critical issues
3. Quick wins that can be implemented immediately
4. Long-term strategy suggestions

Keep recommendations specific and actionable.
`;
  }

  private parseAIInsights(aiOutput: string) {
    const lines = aiOutput.split('\n').filter(line => line.trim().length > 0);
    const recommendations = lines.filter(line => 
      line.includes('•') || line.includes('-') || line.includes('1.') || line.includes('2.') || line.includes('3.')
    ).map(line => line.replace(/^[\s\-•\d.]*/, '').trim());

    return {
      recommendations: recommendations.length > 0 ? recommendations : this.getFallbackRecommendations([]),
    };
  }

  // Generate AI reasons and suggestions for specific alert types
  private async generateScoreDropReason(alert: SEOAlertData): Promise<string> {
    if (!this.openai) {
      return `Score dropped from ${alert.previousValue} to ${alert.currentValue}. This could be due to content changes, technical issues, or algorithm updates.`;
    }

    const prompt = `Explain why this SEO score dropped from ${alert.previousValue} to ${alert.currentValue} for URL: ${alert.url}. Provide a brief, technical explanation.`;
    
    return await withRetryTimeoutFallback(
      async () => {
        const response = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are an SEO expert. Explain SEO score drops concisely." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 150,
        });

        return response.choices[0]?.message?.content || "Score drop detected due to SEO performance changes.";
      },
      async () => `Score dropped from ${alert.previousValue} to ${alert.currentValue}. This could be due to content changes, technical issues, or algorithm updates.`,
      { retries: 1, delay: 500, timeoutMs: 10000 }
    );
  }

  private async generateScoreDropSuggestion(alert: SEOAlertData): Promise<string> {
    if (!this.openai) {
      return "Review recent content changes, check for technical issues, and ensure meta tags are optimized.";
    }

    const prompt = `Suggest specific actions to fix an SEO score drop from ${alert.previousValue} to ${alert.currentValue} for URL: ${alert.url}. Provide 2-3 actionable steps.`;
    
    return await withRetryTimeoutFallback(
      async () => {
        const response = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are an SEO expert. Provide actionable SEO improvement suggestions." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 200,
        });

        return response.choices[0]?.message?.content || "Review content quality, check technical SEO, and optimize meta tags.";
      },
      async () => "Review recent content changes, check for technical issues, and ensure meta tags are optimized.",
      { retries: 1, delay: 500, timeoutMs: 10000 }
    );
  }

  private async generateCannibalizationReason(alert: SEOAlertData): Promise<string> {
    const keyword = alert.metadata?.keyword || "keyword";
    const urlCount = alert.metadata?.conflictingUrls?.length || 0;
    
    return `Multiple pages (${urlCount}) are targeting the same keyword "${keyword}", which can confuse search engines about which page to rank for this term.`;
  }

  private async generateCannibalizationSuggestion(alert: SEOAlertData): Promise<string> {
    const keyword = alert.metadata?.keyword || "keyword";
    
    return `Consolidate content or differentiate keyword targeting. Consider: 1) Choose one primary page for "${keyword}" 2) Use long-tail variations for other pages 3) Implement canonical tags if appropriate.`;
  }

  private async generateMetadataReason(alert: SEOAlertData): Promise<string> {
    const missingFields = alert.metadata?.missingFields || [];
    return `Missing essential metadata fields: ${missingFields.join(", ")}. Complete metadata helps search engines understand and rank your content.`;
  }

  private async generateMetadataSuggestion(alert: SEOAlertData): Promise<string> {
    const missingFields = alert.metadata?.missingFields || [];
    return `Add missing metadata: ${missingFields.map(field => 
      field === 'title' ? 'Create compelling title with target keyword' :
      field === 'meta' ? 'Write 150-160 char meta description' :
      `Optimize ${field} field`
    ).join(", ")}.`;
  }

  private async generateOpportunityReason(alert: SEOAlertData): Promise<string> {
    const type = alert.metadata?.opportunityType || "SEO improvement";
    return `High-impact ${type} opportunity identified with relatively low implementation effort.`;
  }

  private async generateOpportunitySuggestion(alert: SEOAlertData): Promise<string> {
    const type = alert.metadata?.opportunityType || "improvement";
    return `Implement this ${type} opportunity to gain competitive advantage with minimal effort investment.`;
  }

  // Helper methods for recommendations
  private generateAlertSummary(alerts: SEOAlertData[]) {
    const criticalAlerts = alerts.filter(a => a.severity === "critical").length;
    const warningAlerts = alerts.filter(a => a.severity === "warning").length;
    const infoAlerts = alerts.filter(a => a.severity === "info").length;

    const topIssues = alerts
      .reduce((acc, alert) => {
        acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topIssuesList = Object.entries(topIssues)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type]) => type);

    return {
      totalAlerts: alerts.length,
      criticalAlerts,
      warningAlerts,
      infoAlerts,
      topIssues: topIssuesList,
    };
  }

  private generateScoreDropRecommendations(alerts: SEOAlertData[]): string[] {
    const recommendations = [];
    const criticalDrops = alerts.filter(a => a.severity === "critical").length;
    
    if (criticalDrops > 0) {
      recommendations.push(`${criticalDrops} critical score drops detected - immediate action required`);
    }
    
    recommendations.push("Review recent content changes and technical modifications");
    recommendations.push("Check for broken links and crawl errors");
    recommendations.push("Ensure meta tags and structured data are intact");
    
    return recommendations;
  }

  private generateCannibalizationRecommendations(alerts: SEOAlertData[]): string[] {
    const recommendations = [];
    const conflictCount = alerts.length;
    
    if (conflictCount > 0) {
      recommendations.push(`${conflictCount} keyword cannibalization issues found`);
      recommendations.push("Consolidate similar content or differentiate keyword targeting");
      recommendations.push("Consider using canonical tags for duplicate content");
    }
    
    return recommendations;
  }

  private generateMetadataRecommendations(alerts: SEOAlertData[]): string[] {
    const recommendations = [];
    const missingMetadata = alerts.length;
    
    if (missingMetadata > 0) {
      recommendations.push(`${missingMetadata} pages have incomplete metadata`);
      recommendations.push("Prioritize adding meta descriptions and title tags");
      recommendations.push("Ensure all pages have unique and descriptive metadata");
    }
    
    return recommendations;
  }

  private generateOpportunityRecommendations(alerts: SEOAlertData[]): string[] {
    const recommendations = [];
    const opportunities = alerts.length;
    
    if (opportunities > 0) {
      recommendations.push(`${opportunities} high-value SEO opportunities identified`);
      recommendations.push("Focus on quick wins with high impact and low effort");
      recommendations.push("Implement opportunities in order of priority score");
    }
    
    return recommendations;
  }

  private generateTrendRecommendations(trends: any, commonIssues: any[]): string[] {
    const recommendations = [];
    
    if (commonIssues.length > 0) {
      const topIssue = commonIssues[0];
      recommendations.push(`Most common issue: ${topIssue.type} (${topIssue.frequency} occurrences)`);
      recommendations.push("Consider implementing systematic fixes for recurring issues");
    }
    
    recommendations.push("Monitor alert trends to identify patterns");
    recommendations.push("Set up proactive monitoring to catch issues early");
    
    return recommendations;
  }

  private getFallbackRecommendations(alerts: SEOAlertData[]): string[] {
    const recommendations = [];
    
    if (alerts.length > 0) {
      recommendations.push("Review and address all identified SEO alerts");
      recommendations.push("Focus on critical and warning-level alerts first");
      recommendations.push("Monitor SEO performance regularly");
    } else {
      recommendations.push("No critical SEO issues detected");
      recommendations.push("Continue monitoring SEO performance");
      recommendations.push("Consider running additional SEO analyses");
    }
    
    return recommendations;
  }

  private getFallbackResult(): SEOAlertResult {
    return {
      alerts: [],
      summary: {
        totalAlerts: 0,
        criticalAlerts: 0,
        warningAlerts: 0,
        infoAlerts: 0,
        topIssues: [],
      },
      recommendations: [
        "SEO monitoring temporarily unavailable",
        "Consider manual SEO review",
        "Check system logs for issues",
      ],
      trends: {
        alertTrends: [],
        commonIssues: [],
      },
    };
  }

  private getHoursFromTimeframe(timeframe: string): number {
    switch (timeframe) {
      case "24h":
        return 24;
      case "7d":
        return 168;
      case "30d":
        return 720;
      default:
        return 24;
    }
  }

  // Save alerts to database
  private async saveAlerts(alerts: SEOAlertData[]) {
    try {
      for (const alert of alerts) {
        await this.prisma.sEOAlert.create({
          data: {
            campaignId: alert.campaignId,
            url: alert.url,
            alertType: alert.alertType,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            aiReason: alert.aiReason,
            suggestion: alert.suggestion,
            threshold: alert.threshold,
            currentValue: alert.currentValue,
            previousValue: alert.previousValue,
            metadata: alert.metadata,
            priority: alert.priority,
            isRead: false,
            isResolved: false,
          },
        });
      }
    } catch (error) {
      logger.error("Failed to save alerts to database", error as Error, "SEOAlertAgent");
    }
  }

  // Public methods for external use
  async getSEOAlerts(campaignId?: string, options?: { limit?: number; severity?: string[] }) {
    const where: any = {};
    
    if (campaignId) {
      where.campaignId = campaignId;
    }
    
    if (options?.severity) {
      where.severity = { in: options.severity };
    }

    return await this.prisma.sEOAlert.findMany({
      where,
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      take: options?.limit || 50,
    });
  }

  async markAlertResolved(alertId: string, resolvedBy?: string) {
    return await this.prisma.sEOAlert.update({
      where: { id: alertId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy,
      },
    });
  }

  async markAlertRead(alertId: string) {
    return await this.prisma.sEOAlert.update({
      where: { id: alertId },
      data: { isRead: true },
    });
  }
} 