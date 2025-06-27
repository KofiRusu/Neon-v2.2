// Agent execution context and result types
export interface AgentContext {
  [key: string]: unknown;
}

// Allow undefined context as well
export type AgentContextOrUndefined = AgentContext | undefined;

export interface AdOptimizationResult {
  optimizations: Array<{
    adId: string;
    suggestions: string[];
  }>;
}

export interface BudgetAllocationResult {
  budgetAllocation: {
    facebook: number;
    google: number;
    tiktok: number;
  };
}

export interface ABTestResult {
  testId: string;
  variants: Array<{
    id: string;
    creative: string;
    bid: number;
  }>;
}

export interface PerformanceMetrics {
  metrics: {
    ctr: number;
    cpc: number;
    roas: number;
  };
}

export interface BiddingAdjustment {
  newBids: {
    [adId: string]: number;
  };
}

export interface ContentResult {
  content: string;
  metadata: {
    wordCount: number;
    tone: string;
    keywords: string[];
  };
}

export interface DesignResult {
  design: {
    id: string;
    url: string;
    specifications: {
      width: number;
      height: number;
      format: string;
    };
  };
}

export interface InsightResult {
  insights: Array<{
    type: string;
    confidence: number;
    data: unknown;
  }>;
}

export interface OutreachResult {
  campaigns: Array<{
    id: string;
    type: string;
    status: string;
    // Allow additional dynamic properties
    [key: string]: any;
  }>;
}

export interface TrendResult {
  trends: Array<{
    keyword: string;
    volume: number;
    growth: number;
    [key: string]: any; // Allow additional properties for enhanced trend data
  }>;
  // Optional enhanced properties for Phase 4 capabilities
  analysis?: {
    totalKeywords: number;
    crossPlatformInsights: string[];
    recommendations: string[];
  };
  predictions?: {
    highPotentialContent: any[];
    platformRecommendations: Record<string, string[]>;
    timingInsights: Record<string, string>;
  };
  hashtagInsights?: {
    trendingHashtags: any[];
    declineHashtags: any[];
    platformLeaders: Record<string, string>;
  };
  competitorAnalysis?: {
    marketLeaders: any[];
    emergingCompetitors: any[];
    strategies: string[];
  };
  seasonalInsights?: {
    peakSeasons: string[];
    cyclePatterns: Record<string, string>;
    forecastedPeaks: Record<string, string>;
  };
  aggregationInsights?: {
    dominantPlatforms: string[];
    crossPlatformCorrelations: Record<string, number>;
    unifiedStrategy: string[];
  };
  audienceInsights?: {
    primaryAgeGroup: string;
    topLocations: string[];
    engagementPatterns: string;
  };
}

// Additional types for base-agent compatibility
export interface AgentPayload {
  task: string;
  context: AgentContext;
  priority: 'low' | 'medium' | 'high';
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string | undefined;
  metadata?: {
    timestamp: string;
    duration?: number;
  };
}

export interface ContentContext {
  type?: string;
  platform?: string;
  industry?: string;
  tone?: string;
  keywords?: string[];
}

// Missing type definitions for design-agent
export interface DesignAsset {
  id: string;
  type: 'image' | 'video' | 'graphic' | 'logo';
  url: string;
  metadata: {
    dimensions: { width: number; height: number };
    format: string;
    size: number;
  };
  brandCompliance: {
    score: number;
    violations: string[];
  };
}

export interface BrandGuidelines {
  colors: {
    primary: string[];
    secondary: string[];
    accent: string[];
  };
  typography: {
    primary: string;
    secondary: string;
    headings: string;
  };
  logo: {
    usage: string[];
    spacing: number;
    variations: string[];
  };
  voice: {
    tone: string;
    personality: string[];
    doNots: string[];
  };
}

export interface CreativeSpecification {
  dimensions: { width: number; height: number };
  format: string;
  platform: string;
  requirements: string[];
}

export interface DesignOptimization {
  asset: DesignAsset;
  suggestions: string[];
  expectedImpact: number;
  priority: 'low' | 'medium' | 'high';
}

// Missing type definitions for insight-agent
export interface AnalyticsData {
  timeRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    [key: string]: number;
  };
  dimensions: {
    [key: string]: string | number;
  };
}

export interface MarketingInsight {
  type: 'trend' | 'opportunity' | 'risk' | 'performance';
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  description: string;
  recommendations: string[];
  data: any;
}

export interface TrendAnalysis {
  keyword: string;
  volume: number;
  growth: number;
  seasonality: {
    peak: string;
    low: string;
  };
  competition: number;
  opportunities: string[];
}

export interface ROIAnalysis {
  investment: number;
  return: number;
  roi: number;
  breakdownBy: {
    channel: Record<string, number>;
    campaign: Record<string, number>;
    timeframe: Record<string, number>;
  };
  projections: {
    nextMonth: number;
    nextQuarter: number;
  };
}

// Core agent type definitions

export interface AgentMetadata {
  id: string;
  name: string;
  type: string;
  description: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'error';
  lastExecuted?: Date;
  totalExecutions: number;
  averageExecutionTime: number;
}

export interface AgentHealth {
  agentId: string;
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  successRate: number;
  errorRate: number;
  lastHealthCheck: Date;
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    responseTime: number;
  };
}

export interface ExecutionLog {
  id: string;
  agentId: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

export interface AgentExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
  metadata?: {
    executionTime: number;
    parameters?: Record<string, unknown>;
  };
}

export interface AgentCapability {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AgentConfiguration {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: Record<string, unknown>;
  capabilities: AgentCapability[];
}
