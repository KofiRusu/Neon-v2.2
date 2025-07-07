import { PrismaClient } from "@prisma/client";
import { AbstractAgent, AgentPayload, AgentResult } from "../base-agent";
import { AgentContextOrUndefined } from "../types";
import { logger } from "../logger";

// Agent imports for data collection
import { ContentAgent } from "../agents/content-agent";
import { EmailAgent } from "../agents/email-agent";
import { SupportAgent } from "../agents/support-agent";
import { TrendAgent } from "../agents/trend-agent";
import { SEOAlertAgent } from "../agents/seo-alert-agent";

interface MetricData {
  agentName: string;
  agentType: string;
  campaignId?: string;
  executionId?: string;
  metricType: string;
  metricSubtype?: string;
  category?: string;
  value: number;
  previousValue?: number;
  target?: number;
  unit?: string;
  region?: string;
  platform?: string;
  language?: string;
  timeframe?: string;
  trend?: "increasing" | "decreasing" | "stable";
  changePercent?: number;
  performance?: "excellent" | "good" | "average" | "poor" | "critical";
  confidence?: number;
  source: "direct" | "calculated" | "aggregated" | "estimated";
  aggregationLevel?: string;
  metadata?: any;
  tags?: string[];
  timestamp?: Date;
}

interface AgentMetricsSource {
  getMetrics(timeframe: string): Promise<MetricData[]>;
  getAgentType(): string;
  getAgentName(): string;
}

interface AggregationConfig {
  batchSize: number;
  retryAttempts: number;
  retryDelayMs: number;
  timeoutMs: number;
  enabledAgents: string[];
  aggregationIntervals: string[];
  defaultTimeframe: string;
}

export class AgentMetricsAggregator {
  private prisma: PrismaClient;
  private agents: Map<string, AgentMetricsSource>;
  private config: AggregationConfig;
  private isRunning: boolean = false;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
    this.agents = new Map();
    this.config = {
      batchSize: 100,
      retryAttempts: 3,
      retryDelayMs: 1000,
      timeoutMs: 30000,
      enabledAgents: ["ContentAgent", "SEOAgent", "EmailAgent", "SupportAgent", "TrendAgent"],
      aggregationIntervals: ["hourly", "daily", "weekly"],
      defaultTimeframe: "24h",
    };
    
    this.initializeAgents();
  }

  private initializeAgents(): void {
    // Initialize metric collection adapters for each agent
    this.registerAgent("ContentAgent", new ContentAgentMetricsAdapter());
    this.registerAgent("SEOAgent", new SEOAgentMetricsAdapter());
    this.registerAgent("EmailAgent", new EmailAgentMetricsAdapter());
    this.registerAgent("SupportAgent", new SupportAgentMetricsAdapter());
    this.registerAgent("TrendAgent", new TrendAgentMetricsAdapter());
  }

  private registerAgent(name: string, adapter: AgentMetricsSource): void {
    this.agents.set(name, adapter);
    logger.info(`Registered metrics adapter for ${name}`);
  }

  // Main aggregation method called by scheduler
  public async aggregateMetrics(timeframe: string = "1h"): Promise<{
    success: boolean;
    processed: number;
    errors: number;
    batchId: string;
    duration: number;
  }> {
    if (this.isRunning) {
      throw new Error("Metrics aggregation is already running");
    }

    this.isRunning = true;
    const startTime = Date.now();
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let totalProcessed = 0;
    let totalErrors = 0;

    try {
      logger.info(`Starting metrics aggregation for timeframe: ${timeframe}, batchId: ${batchId}`);

      // Collect metrics from all enabled agents
      const allMetrics: MetricData[] = [];
      
      for (const agentName of this.config.enabledAgents) {
        try {
          const adapter = this.agents.get(agentName);
          if (!adapter) {
            logger.warn(`No adapter found for agent: ${agentName}`);
            continue;
          }

          logger.info(`Collecting metrics from ${agentName}...`);
          const agentMetrics = await this.collectAgentMetricsWithRetry(adapter, timeframe);
          
          // Add batch metadata
          const enhancedMetrics = agentMetrics.map(metric => ({
            ...metric,
            batchId,
            source: metric.source || "direct" as const,
            timestamp: metric.timestamp || new Date(),
            recordedAt: new Date(),
          }));

          allMetrics.push(...enhancedMetrics);
          logger.info(`Collected ${agentMetrics.length} metrics from ${agentName}`);
          
        } catch (error) {
          totalErrors++;
          logger.error(`Failed to collect metrics from ${agentName}:`, error);
        }
      }

      // Process metrics in batches
      const batches = this.chunkArray(allMetrics, this.config.batchSize);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        try {
          await this.storeBatchMetrics(batch, batchId);
          totalProcessed += batch.length;
          logger.info(`Processed batch ${i + 1}/${batches.length}: ${batch.length} metrics`);
        } catch (error) {
          totalErrors += batch.length;
          logger.error(`Failed to process batch ${i + 1}:`, error);
        }
      }

      // Generate aggregated insights
      await this.generateAggregatedMetrics(batchId, timeframe);

      const duration = Date.now() - startTime;
      logger.info(`Metrics aggregation completed. Processed: ${totalProcessed}, Errors: ${totalErrors}, Duration: ${duration}ms`);

      return {
        success: totalErrors === 0,
        processed: totalProcessed,
        errors: totalErrors,
        batchId,
        duration,
      };

    } catch (error) {
      logger.error("Critical error in metrics aggregation:", error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async collectAgentMetricsWithRetry(
    adapter: AgentMetricsSource,
    timeframe: string
  ): Promise<MetricData[]> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), this.config.timeoutMs)
        );
        
        const metricsPromise = adapter.getMetrics(timeframe);
        const metrics = await Promise.race([metricsPromise, timeoutPromise]);
        
        return metrics;
        
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Attempt ${attempt}/${this.config.retryAttempts} failed for ${adapter.getAgentName()}:`, error);
        
        if (attempt < this.config.retryAttempts) {
          const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error("All retry attempts failed");
  }

  private async storeBatchMetrics(metrics: MetricData[], batchId: string): Promise<void> {
    try {
      const prismaMetrics = metrics.map(metric => ({
        agentName: metric.agentName,
        agentType: metric.agentType as any, // Prisma enum
        campaignId: metric.campaignId,
        executionId: metric.executionId,
        metricType: metric.metricType,
        metricSubtype: metric.metricSubtype,
        category: metric.category,
        value: metric.value,
        previousValue: metric.previousValue,
        target: metric.target,
        unit: metric.unit,
        region: metric.region,
        platform: metric.platform as any, // Prisma enum
        language: metric.language,
        timeframe: metric.timeframe,
        trend: metric.trend,
        changePercent: metric.changePercent,
        performance: metric.performance,
        confidence: metric.confidence,
        source: metric.source,
        aggregationLevel: metric.aggregationLevel || "individual",
        batchId,
        timestamp: metric.timestamp || new Date(),
        metadata: metric.metadata,
        tags: metric.tags || [],
      }));

      await this.prisma.agentMetric.createMany({
        data: prismaMetrics,
        skipDuplicates: true,
      });

    } catch (error) {
      logger.error("Failed to store batch metrics:", error);
      throw error;
    }
  }

  private async generateAggregatedMetrics(batchId: string, timeframe: string): Promise<void> {
    try {
      // Generate campaign-level aggregations
      await this.generateCampaignAggregations(batchId, timeframe);
      
      // Generate agent-type aggregations
      await this.generateAgentTypeAggregations(batchId, timeframe);
      
      // Generate global aggregations
      await this.generateGlobalAggregations(batchId, timeframe);
      
      logger.info(`Generated aggregated metrics for batch: ${batchId}`);
      
    } catch (error) {
      logger.error("Failed to generate aggregated metrics:", error);
      throw error;
    }
  }

  private async generateCampaignAggregations(batchId: string, timeframe: string): Promise<void> {
    // Aggregate metrics by campaign
    const campaigns = await this.prisma.agentMetric.groupBy({
      by: ['campaignId'],
      where: {
        batchId,
        campaignId: { not: null },
      },
      _avg: { value: true },
      _sum: { value: true },
      _count: { value: true },
    });

    const aggregatedMetrics = campaigns.map(campaign => ({
      agentName: "System",
      agentType: "SYSTEM" as const,
      campaignId: campaign.campaignId,
      metricType: "aggregated_performance",
      category: "campaign",
      value: campaign._avg.value || 0,
      source: "aggregated" as const,
      aggregationLevel: "campaign",
      batchId,
      timestamp: new Date(),
      metadata: {
        totalCount: campaign._count.value,
        totalSum: campaign._sum.value,
        aggregationType: "campaign_summary",
      },
    }));

    if (aggregatedMetrics.length > 0) {
      await this.prisma.agentMetric.createMany({
        data: aggregatedMetrics,
      });
    }
  }

  private async generateAgentTypeAggregations(batchId: string, timeframe: string): Promise<void> {
    // Aggregate metrics by agent type
    const agentTypes = await this.prisma.agentMetric.groupBy({
      by: ['agentType', 'metricType'],
      where: { batchId },
      _avg: { value: true },
      _sum: { value: true },
      _count: { value: true },
    });

    const aggregatedMetrics = agentTypes.map(agentType => ({
      agentName: `${agentType.agentType}_Aggregated`,
      agentType: agentType.agentType,
      metricType: `aggregated_${agentType.metricType}`,
      category: "agent_type",
      value: agentType._avg.value || 0,
      source: "aggregated" as const,
      aggregationLevel: "agent_type",
      batchId,
      timestamp: new Date(),
      metadata: {
        totalCount: agentType._count.value,
        totalSum: agentType._sum.value,
        aggregationType: "agent_type_summary",
      },
    }));

    if (aggregatedMetrics.length > 0) {
      await this.prisma.agentMetric.createMany({
        data: aggregatedMetrics,
      });
    }
  }

  private async generateGlobalAggregations(batchId: string, timeframe: string): Promise<void> {
    // Generate global system metrics
    const globalStats = await this.prisma.agentMetric.aggregate({
      where: { batchId },
      _avg: { value: true },
      _sum: { value: true },
      _count: { value: true },
    });

    const globalMetric = {
      agentName: "System",
      agentType: "SYSTEM" as const,
      metricType: "global_performance",
      category: "system",
      value: globalStats._avg.value || 0,
      source: "aggregated" as const,
      aggregationLevel: "global",
      batchId,
      timestamp: new Date(),
      metadata: {
        totalCount: globalStats._count.value,
        totalSum: globalStats._sum.value,
        aggregationType: "global_summary",
        timeframe,
      },
    };

    await this.prisma.agentMetric.create({
      data: globalMetric,
    });
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Public methods for getting metrics
  public async getMetricsByAgent(
    agentName: string,
    timeframe: string = "24h"
  ): Promise<MetricData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - parseInt(timeframe.replace('h', '')));

    const metrics = await this.prisma.agentMetric.findMany({
      where: {
        agentName,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return metrics.map(this.mapPrismaToMetricData);
  }

  public async getMetricsByType(
    metricType: string,
    timeframe: string = "24h"
  ): Promise<MetricData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - parseInt(timeframe.replace('h', '')));

    const metrics = await this.prisma.agentMetric.findMany({
      where: {
        metricType,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return metrics.map(this.mapPrismaToMetricData);
  }

  public async getCampaignMetrics(
    campaignId: string,
    timeframe: string = "24h"
  ): Promise<MetricData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - parseInt(timeframe.replace('h', '')));

    const metrics = await this.prisma.agentMetric.findMany({
      where: {
        campaignId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return metrics.map(this.mapPrismaToMetricData);
  }

  private mapPrismaToMetricData(prismaMetric: any): MetricData {
    return {
      agentName: prismaMetric.agentName,
      agentType: prismaMetric.agentType,
      campaignId: prismaMetric.campaignId,
      executionId: prismaMetric.executionId,
      metricType: prismaMetric.metricType,
      metricSubtype: prismaMetric.metricSubtype,
      category: prismaMetric.category,
      value: prismaMetric.value,
      previousValue: prismaMetric.previousValue,
      target: prismaMetric.target,
      unit: prismaMetric.unit,
      region: prismaMetric.region,
      platform: prismaMetric.platform,
      language: prismaMetric.language,
      timeframe: prismaMetric.timeframe,
      trend: prismaMetric.trend,
      changePercent: prismaMetric.changePercent,
      performance: prismaMetric.performance,
      confidence: prismaMetric.confidence,
      source: prismaMetric.source,
      aggregationLevel: prismaMetric.aggregationLevel,
      metadata: prismaMetric.metadata,
      tags: prismaMetric.tags,
      timestamp: prismaMetric.timestamp,
    };
  }
}

// Agent-specific metric adapters

class ContentAgentMetricsAdapter implements AgentMetricsSource {
  getAgentType(): string { return "CONTENT"; }
  getAgentName(): string { return "ContentAgent"; }

  async getMetrics(timeframe: string): Promise<MetricData[]> {
    // In a real implementation, this would query actual ContentAgent data
    const metrics: MetricData[] = [
      {
        agentName: "ContentAgent",
        agentType: "CONTENT",
        metricType: "engagement",
        metricSubtype: "likes",
        category: "social",
        value: Math.random() * 1000,
        unit: "count",
        source: "direct",
        performance: "good",
        confidence: 0.85,
      },
      {
        agentName: "ContentAgent",
        agentType: "CONTENT",
        metricType: "reach",
        category: "social",
        value: Math.random() * 10000,
        unit: "count",
        source: "direct",
        performance: "excellent",
        confidence: 0.92,
      },
    ];

    return metrics;
  }
}

class SEOAgentMetricsAdapter implements AgentMetricsSource {
  getAgentType(): string { return "SEO"; }
  getAgentName(): string { return "SEOAgent"; }

  async getMetrics(timeframe: string): Promise<MetricData[]> {
    const metrics: MetricData[] = [
      {
        agentName: "SEOAgent",
        agentType: "SEO",
        metricType: "performance",
        metricSubtype: "seo_score",
        category: "seo",
        value: 75 + Math.random() * 25,
        unit: "score",
        source: "direct",
        performance: "good",
        confidence: 0.88,
      },
      {
        agentName: "SEOAgent",
        agentType: "SEO",
        metricType: "quality",
        metricSubtype: "keyword_ranking",
        category: "seo",
        value: Math.floor(Math.random() * 100) + 1,
        unit: "rank",
        source: "direct",
        performance: "average",
        confidence: 0.75,
      },
    ];

    return metrics;
  }
}

class EmailAgentMetricsAdapter implements AgentMetricsSource {
  getAgentType(): string { return "EMAIL"; }
  getAgentName(): string { return "EmailAgent"; }

  async getMetrics(timeframe: string): Promise<MetricData[]> {
    const metrics: MetricData[] = [
      {
        agentName: "EmailAgent",
        agentType: "EMAIL",
        metricType: "engagement",
        metricSubtype: "open_rate",
        category: "email",
        value: 0.15 + Math.random() * 0.2,
        unit: "percentage",
        source: "direct",
        performance: "good",
        confidence: 0.95,
      },
      {
        agentName: "EmailAgent",
        agentType: "EMAIL",
        metricType: "conversions",
        metricSubtype: "click_rate",
        category: "email",
        value: 0.05 + Math.random() * 0.1,
        unit: "percentage",
        source: "direct",
        performance: "average",
        confidence: 0.90,
      },
    ];

    return metrics;
  }
}

class SupportAgentMetricsAdapter implements AgentMetricsSource {
  getAgentType(): string { return "SUPPORT"; }
  getAgentName(): string { return "SupportAgent"; }

  async getMetrics(timeframe: string): Promise<MetricData[]> {
    const metrics: MetricData[] = [
      {
        agentName: "SupportAgent",
        agentType: "SUPPORT",
        metricType: "performance",
        metricSubtype: "response_time",
        category: "support",
        value: 60 + Math.random() * 300, // seconds
        unit: "seconds",
        source: "direct",
        performance: "excellent",
        confidence: 0.98,
      },
      {
        agentName: "SupportAgent",
        agentType: "SUPPORT",
        metricType: "quality",
        metricSubtype: "satisfaction_score",
        category: "support",
        value: 4.0 + Math.random() * 1.0,
        unit: "score",
        source: "direct",
        performance: "excellent",
        confidence: 0.93,
      },
    ];

    return metrics;
  }
}

class TrendAgentMetricsAdapter implements AgentMetricsSource {
  getAgentType(): string { return "TREND"; }
  getAgentName(): string { return "TrendAgent"; }

  async getMetrics(timeframe: string): Promise<MetricData[]> {
    const metrics: MetricData[] = [
      {
        agentName: "TrendAgent",
        agentType: "TREND",
        metricType: "performance",
        metricSubtype: "trend_accuracy",
        category: "trends",
        value: 0.7 + Math.random() * 0.3,
        unit: "percentage",
        source: "direct",
        performance: "excellent",
        confidence: 0.87,
      },
      {
        agentName: "TrendAgent",
        agentType: "TREND",
        metricType: "quality",
        metricSubtype: "prediction_score",
        category: "trends",
        value: 80 + Math.random() * 20,
        unit: "score",
        source: "direct",
        performance: "good",
        confidence: 0.82,
      },
    ];

    return metrics;
  }
}

export { MetricData, AgentMetricsSource, AggregationConfig }; 