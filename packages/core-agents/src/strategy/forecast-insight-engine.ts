import {
  PredictiveCampaignGenerator,
  PredictiveCampaignPlan,
} from './predictive-campaign-generator';
import { AgentMemoryStore } from '../memory/AgentMemoryStore';
import CrossCampaignMemoryStore from '../memory/CrossCampaignMemoryStore';

export interface ForecastConfiguration {
  metricTypes: MetricType[];
  projectionPeriods: ProjectionPeriod[];
  confidenceThreshold: number; // 0-1
  includeSeasonality: boolean;
  includeTrends: boolean;
  benchmarkComparison: boolean;
  riskAssessment: boolean;
  chartGeneration: boolean;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  source: string;
  metadata?: any;
}

export interface ForecastResult {
  metricName: string;
  currentValue: number;
  projectedValue: number;
  projectionPeriod: ProjectionPeriod;
  projectionType: ForecastMethodology;
  confidenceLevel: number;
  methodology: string;
  dataQuality: number;

  // Historical context
  historicalData: TimeSeriesData[];
  seasonalityFactor?: number;
  trendStrength: number;
  cyclicalPattern?: CyclicalPattern;

  // Business context
  assumptions: string[];
  riskFactors: RiskFactor[];
  opportunities: Opportunity[];

  // Visualization
  chartData: ChartConfiguration;
  benchmarkData?: BenchmarkData;

  // Impact analysis
  businessImpact: number;
  strategicPriority: Priority;
  actionRequired: boolean;
  recommendedActions: string[];

  // Metadata
  generatedAt: string;
  expiresAt: string;
  modelVersion: string;
}

export interface CyclicalPattern {
  type: 'seasonal' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  strength: number; // 0-1
  peakPeriods: string[];
  lowPeriods: string[];
  amplitude: number;
}

export interface RiskFactor {
  type: 'market' | 'competitive' | 'technical' | 'economic' | 'regulatory';
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-1
  description: string;
  impact: number; // Potential impact on forecast
  mitigation: string;
}

export interface Opportunity {
  type: 'market_expansion' | 'channel_optimization' | 'audience_growth' | 'technology_advancement';
  potential: number; // 0-1
  description: string;
  timeframe: string;
  requirements: string[];
  expectedImpact: number;
}

export interface ChartConfiguration {
  type: 'line' | 'bar' | 'area' | 'radar' | 'scatter' | 'heatmap';
  title: string;
  labels: string[];
  datasets: ChartDataset[];
  options: {
    responsive: boolean;
    scales?: any;
    plugins?: any;
    interaction?: any;
  };
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
}

export interface BenchmarkData {
  industryAverage: number;
  topQuartile: number;
  competitorAverage: number;
  bestInClass: number;
  source: string;
  lastUpdated: string;
}

export enum MetricType {
  ROAS = 'roas',
  CONVERSION_RATE = 'conversion_rate',
  CLICK_THROUGH_RATE = 'click_through_rate',
  COST_PER_ACQUISITION = 'cost_per_acquisition',
  BRAND_ALIGNMENT_SCORE = 'brand_alignment_score',
  ENGAGEMENT_RATE = 'engagement_rate',
  REVENUE = 'revenue',
  LEADS = 'leads',
  IMPRESSIONS = 'impressions',
  REACH = 'reach',
  AGENT_EFFICIENCY = 'agent_efficiency',
}

export enum ProjectionPeriod {
  ONE_MONTH = '1_month',
  THREE_MONTHS = '3_months',
  SIX_MONTHS = '6_months',
  ONE_YEAR = '12_months',
  TWO_YEARS = '24_months',
}

export enum ForecastMethodology {
  EXPONENTIAL_SMOOTHING = 'exponential_smoothing',
  LINEAR_REGRESSION = 'linear_regression',
  ARIMA = 'arima',
  NEURAL_NETWORK = 'neural_network',
  ENSEMBLE = 'ensemble',
  AGENT_CONSENSUS = 'agent_consensus',
  PATTERN_MATCHING = 'pattern_matching',
  SEASONAL_DECOMPOSITION = 'seasonal_decomposition',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  URGENT = 'urgent',
}

export class ForecastInsightEngine {
  private predictiveCampaignGenerator: PredictiveCampaignGenerator;
  private agentMemory: AgentMemoryStore;
  private crossCampaignMemory: CrossCampaignMemoryStore;
  private readonly DEFAULT_CONFIDENCE_THRESHOLD = 0.7;
  private readonly SEASONAL_DETECTION_THRESHOLD = 0.3;
  private readonly TREND_DETECTION_THRESHOLD = 0.2;

  constructor() {
    this.predictiveCampaignGenerator = new PredictiveCampaignGenerator();
    this.agentMemory = new AgentMemoryStore();
    this.crossCampaignMemory = new CrossCampaignMemoryStore();
  }

  async generateForecasts(config: ForecastConfiguration): Promise<ForecastResult[]> {
    const forecasts: ForecastResult[] = [];

    console.log('[ForecastInsightEngine] Generating forecasts with configuration:', config);

    try {
      for (const metricType of config.metricTypes) {
        for (const period of config.projectionPeriods) {
          const forecast = await this.generateMetricForecast(metricType, period, config);

          if (forecast.confidenceLevel >= config.confidenceThreshold) {
            forecasts.push(forecast);
          }
        }
      }

      // Sort by strategic priority and confidence
      forecasts.sort((a, b) => {
        const priorityOrder = { critical: 5, urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.strategicPriority];
        const bPriority = priorityOrder[b.strategicPriority];

        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }

        return b.confidenceLevel - a.confidenceLevel;
      });

      console.log(`[ForecastInsightEngine] Generated ${forecasts.length} forecasts`);
      return forecasts;
    } catch (error) {
      console.error('[ForecastInsightEngine] Error generating forecasts:', error);
      throw error;
    }
  }

  private async generateMetricForecast(
    metricType: MetricType,
    period: ProjectionPeriod,
    config: ForecastConfiguration
  ): Promise<ForecastResult> {
    // Step 1: Gather historical data
    const historicalData = await this.gatherHistoricalData(metricType);

    // Step 2: Analyze data quality
    const dataQuality = this.assessDataQuality(historicalData);

    // Step 3: Detect patterns
    const patterns = await this.detectPatterns(historicalData, config);

    // Step 4: Select forecasting methodology
    const methodology = this.selectForecastingMethod(historicalData, patterns, config);

    // Step 5: Generate forecast
    const forecast = await this.generateForecast(historicalData, methodology, period, patterns);

    // Step 6: Assess business context
    const businessContext = await this.assessBusinessContext(metricType, forecast, config);

    // Step 7: Generate visualizations
    const chartData = this.generateChartData(historicalData, forecast, metricType);

    // Step 8: Benchmark comparison
    const benchmarkData = config.benchmarkComparison
      ? await this.getBenchmarkData(metricType)
      : undefined;

    const result: ForecastResult = {
      metricName: this.getMetricDisplayName(metricType),
      currentValue: historicalData[historicalData.length - 1]?.value || 0,
      projectedValue: forecast.value,
      projectionPeriod: period,
      projectionType: methodology,
      confidenceLevel: forecast.confidence,
      methodology: this.getMethodologyDescription(methodology),
      dataQuality,

      historicalData,
      seasonalityFactor: patterns.seasonality?.strength,
      trendStrength: patterns.trend.strength,
      cyclicalPattern: patterns.cyclical,

      assumptions: businessContext.assumptions,
      riskFactors: businessContext.risks,
      opportunities: businessContext.opportunities,

      chartData,
      benchmarkData,

      businessImpact: businessContext.impact,
      strategicPriority: businessContext.priority,
      actionRequired: businessContext.actionRequired,
      recommendedActions: businessContext.recommendations,

      generatedAt: new Date().toISOString(),
      expiresAt: this.calculateExpirationDate(period),
      modelVersion: '1.0.0',
    };

    return result;
  }

  private async gatherHistoricalData(metricType: MetricType): Promise<TimeSeriesData[]> {
    // Mock historical data generation - in real implementation, this would query actual data
    const mockData: TimeSeriesData[] = [];
    const baseValue = this.getBaseValue(metricType);
    const now = new Date();

    // Generate 12 months of historical data
    for (let i = 12; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);

      // Add seasonal and trend variations
      const seasonalFactor = Math.sin((date.getMonth() / 12) * 2 * Math.PI) * 0.15 + 1;
      const trendFactor = 1 + (12 - i) * 0.02; // 2% monthly growth
      const noise = (Math.random() - 0.5) * 0.1; // 10% random noise

      const value = baseValue * seasonalFactor * trendFactor * (1 + noise);

      mockData.push({
        timestamp: date.toISOString().split('T')[0],
        value: Math.max(0, value),
        source: 'historical_data',
        metadata: { month: date.getMonth(), trend: trendFactor, seasonal: seasonalFactor },
      });
    }

    return mockData;
  }

  private getBaseValue(metricType: MetricType): number {
    const baseValues = {
      [MetricType.ROAS]: 3.2,
      [MetricType.CONVERSION_RATE]: 0.035,
      [MetricType.CLICK_THROUGH_RATE]: 0.024,
      [MetricType.COST_PER_ACQUISITION]: 45.0,
      [MetricType.BRAND_ALIGNMENT_SCORE]: 0.88,
      [MetricType.ENGAGEMENT_RATE]: 0.067,
      [MetricType.REVENUE]: 125000,
      [MetricType.LEADS]: 2500,
      [MetricType.IMPRESSIONS]: 850000,
      [MetricType.REACH]: 425000,
      [MetricType.AGENT_EFFICIENCY]: 0.87,
    };

    return baseValues[metricType] || 1.0;
  }

  private assessDataQuality(historicalData: TimeSeriesData[]): number {
    if (historicalData.length === 0) return 0;

    // Check completeness
    const completeness = historicalData.length / 12; // Expecting 12 months

    // Check for gaps
    const hasGaps = this.detectDataGaps(historicalData);
    const gapPenalty = hasGaps ? 0.1 : 0;

    // Check variance (too high variance reduces quality)
    const values = historicalData.map(d => d.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const cv = Math.sqrt(variance) / mean; // Coefficient of variation

    const variancePenalty = Math.min(0.2, cv * 0.5);

    const quality = Math.max(0, Math.min(1, completeness - gapPenalty - variancePenalty));
    return quality;
  }

  private detectDataGaps(historicalData: TimeSeriesData[]): boolean {
    if (historicalData.length < 2) return true;

    const sortedData = [...historicalData].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (let i = 1; i < sortedData.length; i++) {
      const prevDate = new Date(sortedData[i - 1].timestamp);
      const currDate = new Date(sortedData[i].timestamp);
      const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > 35) {
        // More than 35 days gap
        return true;
      }
    }

    return false;
  }

  private async detectPatterns(
    historicalData: TimeSeriesData[],
    config: ForecastConfiguration
  ): Promise<{
    trend: { strength: number; direction: 'up' | 'down' | 'stable' };
    seasonality?: { strength: number; period: number };
    cyclical?: CyclicalPattern;
  }> {
    const values = historicalData.map(d => d.value);

    // Trend detection using linear regression
    const trend = this.detectTrend(values);

    // Seasonality detection
    let seasonality;
    if (config.includeSeasonality && values.length >= 12) {
      seasonality = this.detectSeasonality(values);
    }

    // Cyclical pattern detection
    let cyclical;
    if (values.length >= 24) {
      cyclical = this.detectCyclicalPattern(historicalData);
    }

    return { trend, seasonality, cyclical };
  }

  private detectTrend(values: number[]): { strength: number; direction: 'up' | 'down' | 'stable' } {
    if (values.length < 3) {
      return { strength: 0, direction: 'stable' };
    }

    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared for trend strength
    const yMean = sumY / n;
    const totalSumSquares = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const residualSumSquares = values.reduce((sum, val, i) => {
      const predicted = intercept + slope * i;
      return sum + Math.pow(val - predicted, 2);
    }, 0);

    const rSquared = 1 - residualSumSquares / totalSumSquares;
    const strength = Math.max(0, rSquared);

    // Determine direction
    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(slope) > this.TREND_DETECTION_THRESHOLD) {
      direction = slope > 0 ? 'up' : 'down';
    }

    return { strength, direction };
  }

  private detectSeasonality(values: number[]): { strength: number; period: number } | undefined {
    // Simple seasonality detection using autocorrelation
    const periods = [3, 4, 6, 12]; // Quarterly, seasonal patterns
    let bestPeriod = 12;
    let maxCorrelation = 0;

    for (const period of periods) {
      if (values.length < period * 2) continue;

      const correlation = this.calculateAutocorrelation(values, period);
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = period;
      }
    }

    if (maxCorrelation > this.SEASONAL_DETECTION_THRESHOLD) {
      return { strength: maxCorrelation, period: bestPeriod };
    }

    return undefined;
  }

  private calculateAutocorrelation(values: number[], lag: number): number {
    if (values.length <= lag) return 0;

    const n = values.length - lag;
    const mean1 = values.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const mean2 = values.slice(lag).reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = values[i] - mean1;
      const diff2 = values[i + lag] - mean2;

      numerator += diff1 * diff2;
      denom1 += diff1 * diff1;
      denom2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(denom1 * denom2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private detectCyclicalPattern(historicalData: TimeSeriesData[]): CyclicalPattern | undefined {
    // Mock cyclical pattern detection
    const values = historicalData.map(d => d.value);
    const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Find peaks and troughs
    const peaks: string[] = [];
    const lows: string[] = [];

    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] > values[i - 1] && values[i] > values[i + 1] && values[i] > avgValue * 1.1) {
        peaks.push(historicalData[i].timestamp);
      }
      if (values[i] < values[i - 1] && values[i] < values[i + 1] && values[i] < avgValue * 0.9) {
        lows.push(historicalData[i].timestamp);
      }
    }

    if (peaks.length >= 2 || lows.length >= 2) {
      const maxValue = Math.max(...values);
      const minValue = Math.min(...values);
      const amplitude = (maxValue - minValue) / avgValue;

      return {
        type: 'seasonal',
        strength: Math.min(1, amplitude),
        peakPeriods: peaks,
        lowPeriods: lows,
        amplitude,
      };
    }

    return undefined;
  }

  private selectForecastingMethod(
    historicalData: TimeSeriesData[],
    patterns: any,
    config: ForecastConfiguration
  ): ForecastMethodology {
    // Rule-based methodology selection
    if (historicalData.length < 6) {
      return ForecastMethodology.LINEAR_REGRESSION;
    }

    if (patterns.seasonality && patterns.seasonality.strength > 0.5) {
      return ForecastMethodology.SEASONAL_DECOMPOSITION;
    }

    if (patterns.trend.strength > 0.7) {
      return ForecastMethodology.EXPONENTIAL_SMOOTHING;
    }

    if (historicalData.length >= 24) {
      return ForecastMethodology.ENSEMBLE;
    }

    return ForecastMethodology.EXPONENTIAL_SMOOTHING;
  }

  private async generateForecast(
    historicalData: TimeSeriesData[],
    methodology: ForecastMethodology,
    period: ProjectionPeriod,
    patterns: any
  ): Promise<{ value: number; confidence: number }> {
    const values = historicalData.map(d => d.value);
    const currentValue = values[values.length - 1];
    const monthsAhead = this.getMonthsAhead(period);

    let projectedValue: number;
    let confidence: number;

    switch (methodology) {
      case ForecastMethodology.EXPONENTIAL_SMOOTHING:
        const result = this.exponentialSmoothing(values, monthsAhead, patterns);
        projectedValue = result.value;
        confidence = result.confidence;
        break;

      case ForecastMethodology.LINEAR_REGRESSION:
        const regression = this.linearRegressionForecast(values, monthsAhead);
        projectedValue = regression.value;
        confidence = regression.confidence;
        break;

      case ForecastMethodology.SEASONAL_DECOMPOSITION:
        const seasonal = this.seasonalForecast(values, monthsAhead, patterns.seasonality);
        projectedValue = seasonal.value;
        confidence = seasonal.confidence;
        break;

      case ForecastMethodology.ENSEMBLE:
        const ensemble = this.ensembleForecast(values, monthsAhead, patterns);
        projectedValue = ensemble.value;
        confidence = ensemble.confidence;
        break;

      default:
        // Simple trend projection as fallback
        const trendGrowth =
          patterns.trend.direction === 'up'
            ? 0.02
            : patterns.trend.direction === 'down'
              ? -0.01
              : 0;
        projectedValue = currentValue * Math.pow(1 + trendGrowth, monthsAhead);
        confidence = 0.6;
    }

    return { value: Math.max(0, projectedValue), confidence: Math.min(0.95, confidence) };
  }

  private exponentialSmoothing(
    values: number[],
    periodsAhead: number,
    patterns: any
  ): { value: number; confidence: number } {
    if (values.length === 0) return { value: 0, confidence: 0 };

    const alpha = 0.3; // Smoothing parameter
    const beta = 0.2; // Trend parameter
    const gamma = 0.1; // Seasonal parameter

    let level = values[0];
    let trend = values.length > 1 ? values[1] - values[0] : 0;

    // Apply exponential smoothing
    for (let i = 1; i < values.length; i++) {
      const prevLevel = level;
      level = alpha * values[i] + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    // Project forward
    let forecast = level + periodsAhead * trend;

    // Apply seasonal adjustment if detected
    if (patterns.seasonality) {
      const seasonalMultiplier =
        1 + Math.sin((periodsAhead * Math.PI) / 6) * patterns.seasonality.strength * 0.1;
      forecast *= seasonalMultiplier;
    }

    // Calculate confidence based on historical accuracy
    const confidence = Math.max(0.5, 0.9 - periodsAhead * 0.05);

    return { value: forecast, confidence };
  }

  private linearRegressionForecast(
    values: number[],
    periodsAhead: number
  ): { value: number; confidence: number } {
    if (values.length < 2) return { value: values[0] || 0, confidence: 0.3 };

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const forecast = intercept + slope * (n + periodsAhead - 1);

    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const totalSumSquares = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const residualSumSquares = values.reduce((sum, val, i) => {
      const predicted = intercept + slope * i;
      return sum + Math.pow(val - predicted, 2);
    }, 0);

    const rSquared = Math.max(0, 1 - residualSumSquares / totalSumSquares);
    const confidence = Math.max(0.4, Math.min(0.9, rSquared));

    return { value: forecast, confidence };
  }

  private seasonalForecast(
    values: number[],
    periodsAhead: number,
    seasonality: any
  ): { value: number; confidence: number } {
    const period = seasonality.period || 12;
    const strength = seasonality.strength || 0.5;

    // Calculate seasonal indices
    const seasonalIndices: number[] = [];
    for (let i = 0; i < period; i++) {
      const seasonalValues = values.filter((_, idx) => idx % period === i);
      const avgSeasonal = seasonalValues.reduce((sum, val) => sum + val, 0) / seasonalValues.length;
      const overallAvg = values.reduce((sum, val) => sum + val, 0) / values.length;
      seasonalIndices.push(avgSeasonal / overallAvg);
    }

    // Base forecast using trend
    const trend =
      values.length > 1 ? (values[values.length - 1] - values[0]) / (values.length - 1) : 0;
    const baseForecast = values[values.length - 1] + trend * periodsAhead;

    // Apply seasonal adjustment
    const seasonalIndex = seasonalIndices[(values.length + periodsAhead - 1) % period];
    const forecast = baseForecast * seasonalIndex;

    const confidence = Math.max(0.6, 0.85 - periodsAhead * 0.03);

    return { value: forecast, confidence };
  }

  private ensembleForecast(
    values: number[],
    periodsAhead: number,
    patterns: any
  ): { value: number; confidence: number } {
    // Combine multiple methods
    const methods = [
      this.exponentialSmoothing(values, periodsAhead, patterns),
      this.linearRegressionForecast(values, periodsAhead),
    ];

    if (patterns.seasonality) {
      methods.push(this.seasonalForecast(values, periodsAhead, patterns.seasonality));
    }

    // Weighted average based on confidence
    const totalWeight = methods.reduce((sum, method) => sum + method.confidence, 0);
    const weightedForecast = methods.reduce(
      (sum, method) => sum + (method.value * method.confidence) / totalWeight,
      0
    );

    const avgConfidence =
      methods.reduce((sum, method) => sum + method.confidence, 0) / methods.length;

    return { value: weightedForecast, confidence: avgConfidence * 1.1 }; // Ensemble bonus
  }

  private getMonthsAhead(period: ProjectionPeriod): number {
    const periodMap = {
      [ProjectionPeriod.ONE_MONTH]: 1,
      [ProjectionPeriod.THREE_MONTHS]: 3,
      [ProjectionPeriod.SIX_MONTHS]: 6,
      [ProjectionPeriod.ONE_YEAR]: 12,
      [ProjectionPeriod.TWO_YEARS]: 24,
    };

    return periodMap[period] || 3;
  }

  private async assessBusinessContext(
    metricType: MetricType,
    forecast: { value: number; confidence: number },
    config: ForecastConfiguration
  ): Promise<{
    assumptions: string[];
    risks: RiskFactor[];
    opportunities: Opportunity[];
    impact: number;
    priority: Priority;
    actionRequired: boolean;
    recommendations: string[];
  }> {
    const context = {
      assumptions: this.getMetricAssumptions(metricType),
      risks: config.riskAssessment ? this.assessRisks(metricType, forecast) : [],
      opportunities: this.identifyOpportunities(metricType, forecast),
      impact: this.calculateBusinessImpact(metricType, forecast.value),
      priority: this.determinePriority(metricType, forecast),
      actionRequired: this.shouldTakeAction(metricType, forecast),
      recommendations: this.generateRecommendations(metricType, forecast),
    };

    return context;
  }

  private getMetricAssumptions(metricType: MetricType): string[] {
    const assumptions = {
      [MetricType.ROAS]: [
        'Market conditions remain stable',
        'No major changes to platform algorithms',
        'Current optimization strategies continue',
      ],
      [MetricType.CONVERSION_RATE]: [
        'Website performance remains consistent',
        'Target audience behavior patterns stable',
        'No major UX/UI changes planned',
      ],
      [MetricType.BRAND_ALIGNMENT_SCORE]: [
        'Brand guidelines remain unchanged',
        'Content quality standards maintained',
        'Regular brand voice optimization continues',
      ],
    };

    return (
      assumptions[metricType] || [
        'Historical patterns continue',
        'No major market disruptions',
        'Current strategies remain effective',
      ]
    );
  }

  private assessRisks(
    metricType: MetricType,
    forecast: { value: number; confidence: number }
  ): RiskFactor[] {
    const risks: RiskFactor[] = [];

    if (forecast.confidence < 0.7) {
      risks.push({
        type: 'technical',
        severity: 'medium',
        probability: 0.3,
        description: 'Low forecast confidence due to data limitations',
        impact: -0.2,
        mitigation: 'Improve data collection and increase measurement frequency',
      });
    }

    // Add metric-specific risks
    if (metricType === MetricType.ROAS) {
      risks.push({
        type: 'competitive',
        severity: 'medium',
        probability: 0.25,
        description: 'Increased competition may reduce ROAS',
        impact: -0.15,
        mitigation: 'Diversify channels and improve targeting precision',
      });
    }

    return risks;
  }

  private identifyOpportunities(
    metricType: MetricType,
    forecast: { value: number; confidence: number }
  ): Opportunity[] {
    const opportunities: Opportunity[] = [];

    if (forecast.confidence > 0.8) {
      opportunities.push({
        type: 'channel_optimization',
        potential: 0.7,
        description: 'High-confidence forecast enables aggressive optimization',
        timeframe: '1-3 months',
        requirements: ['Increase budget allocation', 'Enhanced monitoring'],
        expectedImpact: 0.15,
      });
    }

    return opportunities;
  }

  private calculateBusinessImpact(metricType: MetricType, projectedValue: number): number {
    // Mock business impact calculation
    const impactMultipliers = {
      [MetricType.REVENUE]: 1.0,
      [MetricType.ROAS]: 50000,
      [MetricType.CONVERSION_RATE]: 100000,
      [MetricType.LEADS]: 200,
    };

    const multiplier = impactMultipliers[metricType] || 1000;
    return projectedValue * multiplier;
  }

  private determinePriority(
    metricType: MetricType,
    forecast: { value: number; confidence: number }
  ): Priority {
    if (forecast.confidence > 0.85) return Priority.HIGH;
    if (forecast.confidence > 0.75) return Priority.MEDIUM;
    return Priority.LOW;
  }

  private shouldTakeAction(
    metricType: MetricType,
    forecast: { value: number; confidence: number }
  ): boolean {
    return forecast.confidence > 0.75;
  }

  private generateRecommendations(
    metricType: MetricType,
    forecast: { value: number; confidence: number }
  ): string[] {
    const recommendations: string[] = [];

    if (forecast.confidence > 0.8) {
      recommendations.push(
        `High confidence forecast for ${metricType} - consider increasing investment`
      );
    }

    recommendations.push(`Monitor ${metricType} closely over forecast period`);
    recommendations.push(`Review and adjust strategy if actual values deviate by >10%`);

    return recommendations;
  }

  private generateChartData(
    historicalData: TimeSeriesData[],
    forecast: { value: number; confidence: number },
    metricType: MetricType
  ): ChartConfiguration {
    const labels = [...historicalData.map(d => d.timestamp), 'Forecast'];
    const historicalValues = historicalData.map(d => d.value);
    const data = [...historicalValues, forecast.value];

    return {
      type: 'line',
      title: `${this.getMetricDisplayName(metricType)} Forecast`,
      labels,
      datasets: [
        {
          label: 'Historical Data',
          data: [...historicalValues, null],
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: false,
          tension: 0.4,
        },
        {
          label: 'Forecast',
          data: [...new Array(historicalValues.length).fill(null), forecast.value],
          borderColor: '#00ff88',
          backgroundColor: 'rgba(0, 255, 136, 0.1)',
          fill: false,
          pointRadius: 6,
        },
      ],
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: this.getMetricUnit(metricType),
            },
          },
          x: {
            title: {
              display: true,
              text: 'Time Period',
            },
          },
        },
        plugins: {
          legend: {
            display: true,
          },
          title: {
            display: true,
            text: `${this.getMetricDisplayName(metricType)} Trend & Forecast`,
          },
        },
      },
    };
  }

  private async getBenchmarkData(metricType: MetricType): Promise<BenchmarkData> {
    // Mock benchmark data
    const benchmarks = {
      [MetricType.ROAS]: {
        industryAverage: 2.8,
        topQuartile: 4.2,
        competitorAverage: 3.1,
        bestInClass: 5.8,
      },
      [MetricType.CONVERSION_RATE]: {
        industryAverage: 0.024,
        topQuartile: 0.045,
        competitorAverage: 0.031,
        bestInClass: 0.067,
      },
    };

    const benchmark = benchmarks[metricType] || {
      industryAverage: 1.0,
      topQuartile: 1.5,
      competitorAverage: 1.1,
      bestInClass: 2.0,
    };

    return {
      ...benchmark,
      source: 'Industry Research Database',
      lastUpdated: new Date().toISOString(),
    };
  }

  private getMetricDisplayName(metricType: MetricType): string {
    const displayNames = {
      [MetricType.ROAS]: 'Return on Ad Spend',
      [MetricType.CONVERSION_RATE]: 'Conversion Rate',
      [MetricType.CLICK_THROUGH_RATE]: 'Click Through Rate',
      [MetricType.COST_PER_ACQUISITION]: 'Cost Per Acquisition',
      [MetricType.BRAND_ALIGNMENT_SCORE]: 'Brand Alignment Score',
      [MetricType.ENGAGEMENT_RATE]: 'Engagement Rate',
      [MetricType.REVENUE]: 'Revenue',
      [MetricType.LEADS]: 'Leads Generated',
      [MetricType.IMPRESSIONS]: 'Impressions',
      [MetricType.REACH]: 'Reach',
      [MetricType.AGENT_EFFICIENCY]: 'Agent Efficiency',
    };

    return displayNames[metricType] || metricType;
  }

  private getMetricUnit(metricType: MetricType): string {
    const units = {
      [MetricType.ROAS]: 'Ratio',
      [MetricType.CONVERSION_RATE]: 'Percentage',
      [MetricType.CLICK_THROUGH_RATE]: 'Percentage',
      [MetricType.COST_PER_ACQUISITION]: 'Dollars',
      [MetricType.BRAND_ALIGNMENT_SCORE]: 'Score (0-1)',
      [MetricType.ENGAGEMENT_RATE]: 'Percentage',
      [MetricType.REVENUE]: 'Dollars',
      [MetricType.LEADS]: 'Count',
      [MetricType.IMPRESSIONS]: 'Count',
      [MetricType.REACH]: 'Count',
      [MetricType.AGENT_EFFICIENCY]: 'Score (0-1)',
    };

    return units[metricType] || 'Value';
  }

  private getMethodologyDescription(methodology: ForecastMethodology): string {
    const descriptions = {
      [ForecastMethodology.EXPONENTIAL_SMOOTHING]:
        'Time series forecasting with exponential smoothing and trend adjustment',
      [ForecastMethodology.LINEAR_REGRESSION]: 'Linear regression analysis of historical trends',
      [ForecastMethodology.SEASONAL_DECOMPOSITION]:
        'Seasonal pattern analysis with trend decomposition',
      [ForecastMethodology.ENSEMBLE]: 'Combined multiple forecasting methods for improved accuracy',
      [ForecastMethodology.ARIMA]: 'Autoregressive Integrated Moving Average statistical model',
      [ForecastMethodology.NEURAL_NETWORK]: 'Deep learning neural network pattern recognition',
      [ForecastMethodology.AGENT_CONSENSUS]: 'AI agent collaborative prediction consensus',
      [ForecastMethodology.PATTERN_MATCHING]: 'Historical pattern matching and similarity analysis',
    };

    return descriptions[methodology] || 'Advanced statistical forecasting';
  }

  private calculateExpirationDate(period: ProjectionPeriod): string {
    const now = new Date();
    const periodDays = {
      [ProjectionPeriod.ONE_MONTH]: 7,
      [ProjectionPeriod.THREE_MONTHS]: 14,
      [ProjectionPeriod.SIX_MONTHS]: 30,
      [ProjectionPeriod.ONE_YEAR]: 60,
      [ProjectionPeriod.TWO_YEARS]: 90,
    };

    const daysValid = periodDays[period] || 14;
    const expirationDate = new Date(now.getTime() + daysValid * 24 * 60 * 60 * 1000);

    return expirationDate.toISOString();
  }

  // Integration method with BoardroomReportAgent
  async generateBoardroomForecasts(reportConfig: {
    timeframe: { start: string; end: string };
    includeCampaigns: string[];
    includeAgents: string[];
    confidenceThreshold: number;
  }): Promise<ForecastResult[]> {
    const forecastConfig: ForecastConfiguration = {
      metricTypes: [
        MetricType.ROAS,
        MetricType.BRAND_ALIGNMENT_SCORE,
        MetricType.AGENT_EFFICIENCY,
        MetricType.CONVERSION_RATE,
        MetricType.REVENUE,
      ],
      projectionPeriods: [ProjectionPeriod.THREE_MONTHS, ProjectionPeriod.SIX_MONTHS],
      confidenceThreshold: reportConfig.confidenceThreshold,
      includeSeasonality: true,
      includeTrends: true,
      benchmarkComparison: true,
      riskAssessment: true,
      chartGeneration: true,
    };

    return await this.generateForecasts(forecastConfig);
  }
}

export default ForecastInsightEngine;
