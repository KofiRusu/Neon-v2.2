import { StrategySlide } from '../../agents/boardroom-report-agent';
import { PresentationTheme } from '../PresentationBuilder';

export interface TrendSlideData {
  title: string;
  subtitle?: string;
  primaryTrend: TrendAnalysis;
  secondaryTrends?: TrendAnalysis[];
  timeframe: string;
  dataPoints: number;
  insights: TrendInsight[];
  predictions?: TrendPrediction;
}

export interface TrendAnalysis {
  name: string;
  direction: 'upward' | 'downward' | 'stable' | 'volatile';
  strength: 'weak' | 'moderate' | 'strong';
  magnitude: number; // Percentage change
  confidence: number; // 0-1
  timeSeriesData: { period: string; value: number }[];
  significantEvents?: SignificantEvent[];
}

export interface TrendInsight {
  type: 'opportunity' | 'risk' | 'pattern' | 'anomaly';
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendation?: string;
}

export interface TrendPrediction {
  projectedDirection: 'upward' | 'downward' | 'stable';
  projectedMagnitude: number;
  timeHorizon: string;
  confidence: number;
  assumptions: string[];
}

export interface SignificantEvent {
  date: string;
  description: string;
  impact: number; // Impact magnitude
  type: 'campaign_launch' | 'market_change' | 'competitive_action' | 'seasonal' | 'external';
}

export class TrendSlideTemplate {
  static create(
    data: TrendSlideData,
    theme: PresentationTheme = PresentationTheme.NEON_GLASS
  ): StrategySlide {
    const slide: StrategySlide = {
      slideNumber: 0,
      slideType: 'TREND',
      title: data.title,
      subtitle: data.subtitle,
      mainContent: {
        primaryTrend: data.primaryTrend,
        secondaryTrends: data.secondaryTrends || [],
        timeframe: data.timeframe,
        dataPoints: data.dataPoints,
        insights: data.insights,
        predictions: data.predictions,
        layout: this.determineLayout(data),
      },
      visualConfig: this.generateTrendVisualization(data, theme),
      keyTakeaway: this.generateKeyTakeaway(data),
      businessContext: this.generateBusinessContext(data),
      recommendation: this.generateRecommendation(data),
      sourceMetrics: {
        type: 'trend_analysis',
        timeframe: data.timeframe,
        dataPoints: data.dataPoints,
        timestamp: new Date().toISOString(),
      },
      theme,
      layout: this.determineLayout(data),
    };

    return slide;
  }

  private static determineLayout(data: TrendSlideData): string {
    if (data.secondaryTrends && data.secondaryTrends.length > 2) {
      return 'multi_trend'; // Multiple trend comparison
    } else if (data.predictions) {
      return 'predictive'; // Trend with predictions
    } else if (
      data.primaryTrend.significantEvents &&
      data.primaryTrend.significantEvents.length > 0
    ) {
      return 'annotated'; // Trend with event annotations
    }
    return 'standard'; // Single trend focus
  }

  private static generateTrendVisualization(data: TrendSlideData, theme: PresentationTheme): any {
    const themeColors = this.getThemeColors(theme);
    const primaryData = data.primaryTrend.timeSeriesData;

    const datasets = [
      {
        label: data.primaryTrend.name,
        data: primaryData.map(d => d.value),
        borderColor: this.getTrendColor(data.primaryTrend.direction, themeColors),
        backgroundColor: this.getTrendColor(data.primaryTrend.direction, themeColors, 0.1),
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ];

    // Add secondary trends if present
    if (data.secondaryTrends) {
      data.secondaryTrends.forEach((trend, index) => {
        datasets.push({
          label: trend.name,
          data: trend.timeSeriesData.map(d => d.value),
          borderColor: themeColors.secondary[index % themeColors.secondary.length],
          backgroundColor: `${themeColors.secondary[index % themeColors.secondary.length]}20`,
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 3,
        });
      });
    }

    // Add prediction line if present
    if (data.predictions) {
      const lastValue = primaryData[primaryData.length - 1].value;
      const projectedValue = lastValue * (1 + data.predictions.projectedMagnitude / 100);

      datasets.push({
        label: 'Prediction',
        data: [...new Array(primaryData.length - 1).fill(null), lastValue, projectedValue],
        borderColor: themeColors.accent,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        pointRadius: [0, 0, 0, 6],
        pointBackgroundColor: themeColors.accent,
      });
    }

    return {
      type: 'line',
      data: {
        labels: primaryData.map(d => d.period),
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { color: themeColors.text },
          },
          tooltip: {
            backgroundColor: themeColors.background,
            titleColor: themeColors.text,
            bodyColor: themeColors.text,
            borderColor: themeColors.border,
            borderWidth: 1,
            displayColors: true,
          },
          annotation: data.primaryTrend.significantEvents
            ? {
                annotations: this.createEventAnnotations(
                  data.primaryTrend.significantEvents,
                  themeColors
                ),
              }
            : undefined,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Time Period',
              color: themeColors.text,
            },
            ticks: { color: themeColors.text },
            grid: { color: themeColors.border },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Value',
              color: themeColors.text,
            },
            ticks: { color: themeColors.text },
            grid: { color: themeColors.border },
          },
        },
      },
    };
  }

  private static createEventAnnotations(events: SignificantEvent[], colors: any): any[] {
    return events.map(event => ({
      type: 'line',
      scaleID: 'x',
      value: event.date,
      borderColor: colors.warning,
      borderWidth: 2,
      borderDash: [3, 3],
      label: {
        enabled: true,
        content: event.description,
        position: 'top',
        backgroundColor: colors.warning,
        color: colors.text,
      },
    }));
  }

  private static getTrendColor(direction: string, colors: any, alpha: number = 1): string {
    const colorMap = {
      upward: colors.success,
      downward: colors.danger,
      stable: colors.neutral,
      volatile: colors.warning,
    };

    const color = colorMap[direction] || colors.primary;
    return alpha < 1
      ? `${color}${Math.round(alpha * 255)
          .toString(16)
          .padStart(2, '0')}`
      : color;
  }

  private static getThemeColors(theme: PresentationTheme): any {
    const themes = {
      [PresentationTheme.NEON_GLASS]: {
        primary: '#00ff88',
        accent: '#6366f1',
        text: '#ffffff',
        background: 'rgba(15, 20, 25, 0.9)',
        border: 'rgba(255, 255, 255, 0.1)',
        success: '#00ff88',
        danger: '#ff4757',
        warning: '#ffa502',
        neutral: '#747d8c',
        secondary: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
      },
      [PresentationTheme.EXECUTIVE_DARK]: {
        primary: '#6366f1',
        accent: '#8b5cf6',
        text: '#ffffff',
        background: '#1a1a2e',
        border: '#2d3748',
        success: '#48bb78',
        danger: '#f56565',
        warning: '#ed8936',
        neutral: '#a0aec0',
        secondary: ['#00ff88', '#ec4899', '#f59e0b', '#10b981'],
      },
      [PresentationTheme.CMO_LITE]: {
        primary: '#6366f1',
        accent: '#8b5cf6',
        text: '#1a202c',
        background: '#ffffff',
        border: '#e2e8f0',
        success: '#48bb78',
        danger: '#f56565',
        warning: '#ed8936',
        neutral: '#718096',
        secondary: ['#00ff88', '#ec4899', '#f59e0b', '#10b981'],
      },
    };

    return themes[theme] || themes[PresentationTheme.NEON_GLASS];
  }

  private static generateKeyTakeaway(data: TrendSlideData): string {
    const trend = data.primaryTrend;
    const directionText = this.getDirectionText(trend.direction);
    const strengthText = trend.strength;
    const magnitudeText =
      trend.magnitude > 0 ? `+${trend.magnitude.toFixed(1)}%` : `${trend.magnitude.toFixed(1)}%`;

    return `${trend.name} shows ${strengthText} ${directionText} trend with ${magnitudeText} change over ${data.timeframe}`;
  }

  private static generateBusinessContext(data: TrendSlideData): string {
    const highImpactInsights = data.insights.filter(i => i.impact === 'high').length;
    const opportunities = data.insights.filter(i => i.type === 'opportunity').length;
    const risks = data.insights.filter(i => i.type === 'risk').length;

    if (highImpactInsights > 2) {
      return 'Multiple high-impact trends identified requiring strategic attention and resource allocation';
    } else if (opportunities > risks) {
      return 'Trend analysis reveals significant growth opportunities outweighing potential risks';
    } else if (risks > opportunities) {
      return 'Risk mitigation strategies needed to address concerning trend patterns';
    } else {
      return 'Balanced trend landscape with mixed opportunities and challenges requiring selective focus';
    }
  }

  private static generateRecommendation(data: TrendSlideData): string {
    const actionableInsights = data.insights.filter(i => i.actionable);
    const primaryTrend = data.primaryTrend;

    if (actionableInsights.length > 0) {
      const topAction = actionableInsights.find(i => i.impact === 'high')?.recommendation;
      if (topAction) return topAction;
    }

    if (primaryTrend.direction === 'upward' && primaryTrend.strength === 'strong') {
      return 'Capitalize on positive trend momentum with increased investment and expansion';
    } else if (primaryTrend.direction === 'downward' && primaryTrend.strength === 'strong') {
      return 'Immediate intervention required to reverse declining trend pattern';
    } else if (primaryTrend.direction === 'volatile') {
      return 'Implement stabilization strategies to reduce trend volatility and improve predictability';
    }

    return 'Monitor trend developments closely and prepare adaptive strategies for emerging patterns';
  }

  private static getDirectionText(direction: string): string {
    const directionMap = {
      upward: 'upward',
      downward: 'downward',
      stable: 'stable',
      volatile: 'volatile',
    };
    return directionMap[direction] || direction;
  }

  // Utility methods for common trend slide patterns
  static createROASTrendSlide(
    roasTrendData: {
      timeSeriesData: { period: string; value: number }[];
      events: SignificantEvent[];
      prediction: TrendPrediction;
    },
    theme?: PresentationTheme
  ): StrategySlide {
    const magnitude = this.calculateMagnitude(roasTrendData.timeSeriesData);
    const direction = magnitude > 5 ? 'upward' : magnitude < -5 ? 'downward' : 'stable';

    const slideData: TrendSlideData = {
      title: 'ROAS Trend Analysis',
      subtitle: 'Return on Ad Spend Performance Over Time',
      primaryTrend: {
        name: 'ROAS',
        direction,
        strength:
          Math.abs(magnitude) > 10 ? 'strong' : Math.abs(magnitude) > 5 ? 'moderate' : 'weak',
        magnitude,
        confidence: 0.85,
        timeSeriesData: roasTrendData.timeSeriesData,
        significantEvents: roasTrendData.events,
      },
      timeframe: '12 months',
      dataPoints: roasTrendData.timeSeriesData.length,
      insights: [
        {
          type: magnitude > 0 ? 'opportunity' : 'risk',
          description: `ROAS trend ${magnitude > 0 ? 'improving' : 'declining'} by ${Math.abs(magnitude).toFixed(1)}%`,
          impact: Math.abs(magnitude) > 10 ? 'high' : 'medium',
          actionable: true,
          recommendation:
            magnitude > 0
              ? 'Scale high-performing campaigns to maximize positive trend'
              : 'Investigate declining performance and optimize underperforming campaigns',
        },
      ],
      predictions: roasTrendData.prediction,
    };

    return this.create(slideData, theme);
  }

  static createBrandTrendSlide(
    brandTrendData: {
      alignmentTrend: { period: string; value: number }[];
      consistencyTrend: { period: string; value: number }[];
      events: SignificantEvent[];
    },
    theme?: PresentationTheme
  ): StrategySlide {
    const alignmentMagnitude = this.calculateMagnitude(brandTrendData.alignmentTrend);

    const slideData: TrendSlideData = {
      title: 'Brand Health Trends',
      subtitle: 'Alignment & Consistency Performance',
      primaryTrend: {
        name: 'Brand Alignment Score',
        direction:
          alignmentMagnitude > 2 ? 'upward' : alignmentMagnitude < -2 ? 'downward' : 'stable',
        strength: Math.abs(alignmentMagnitude) > 5 ? 'strong' : 'moderate',
        magnitude: alignmentMagnitude,
        confidence: 0.78,
        timeSeriesData: brandTrendData.alignmentTrend,
        significantEvents: brandTrendData.events,
      },
      secondaryTrends: [
        {
          name: 'Consistency Score',
          direction: 'stable',
          strength: 'moderate',
          magnitude: this.calculateMagnitude(brandTrendData.consistencyTrend),
          confidence: 0.82,
          timeSeriesData: brandTrendData.consistencyTrend,
        },
      ],
      timeframe: '6 months',
      dataPoints: brandTrendData.alignmentTrend.length,
      insights: [
        {
          type: 'pattern',
          description: 'Brand alignment improving across all channels',
          impact: 'medium',
          actionable: true,
          recommendation: 'Continue brand voice optimization and expand to new channels',
        },
      ],
    };

    return this.create(slideData, theme);
  }

  private static calculateMagnitude(timeSeriesData: { period: string; value: number }[]): number {
    if (timeSeriesData.length < 2) return 0;

    const firstValue = timeSeriesData[0].value;
    const lastValue = timeSeriesData[timeSeriesData.length - 1].value;

    return ((lastValue - firstValue) / firstValue) * 100;
  }
}

export default TrendSlideTemplate;
