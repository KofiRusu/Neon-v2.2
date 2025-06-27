import { StrategySlide } from '../../agents/boardroom-report-agent';
import { PresentationTheme } from '../PresentationBuilder';

export interface MetricSlideData {
  title: string;
  subtitle?: string;
  metrics: MetricItem[];
  chartConfig?: ChartConfig;
  comparison?: ComparisonData;
  trend?: TrendData;
  highlights?: string[];
}

export interface MetricItem {
  label: string;
  value: string | number;
  unit?: string;
  change?: number; // Percentage change
  changeLabel?: string; // Custom change label
  status: 'positive' | 'negative' | 'neutral';
  target?: number;
  benchmark?: number;
  format?: 'currency' | 'percentage' | 'number' | 'ratio';
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'gauge' | 'sparkline';
  data: number[];
  labels?: string[];
  colors?: string[];
  showValues?: boolean;
}

export interface ComparisonData {
  current: number;
  previous: number;
  target: number;
  industry: number;
  labels: {
    current: string;
    previous: string;
    target: string;
    industry: string;
  };
}

export interface TrendData {
  direction: 'up' | 'down' | 'stable';
  strength: 'weak' | 'moderate' | 'strong';
  duration: string; // e.g., "3 months"
  confidence: number; // 0-1
}

export class MetricSlideTemplate {
  static create(
    data: MetricSlideData,
    theme: PresentationTheme = PresentationTheme.NEON_GLASS
  ): StrategySlide {
    const slide: StrategySlide = {
      slideNumber: 0, // Will be set by presentation builder
      slideType: 'METRIC',
      title: data.title,
      subtitle: data.subtitle,
      mainContent: {
        metrics: data.metrics,
        chartConfig: data.chartConfig,
        comparison: data.comparison,
        trend: data.trend,
        highlights: data.highlights,
        layout: this.determineLayout(data),
      },
      visualConfig: data.chartConfig
        ? this.generateChartVisualization(data.chartConfig, theme)
        : undefined,
      keyTakeaway: this.generateKeyTakeaway(data),
      businessContext: this.generateBusinessContext(data),
      recommendation: this.generateRecommendation(data),
      sourceMetrics: {
        type: 'metric_slide',
        metrics: data.metrics.map(m => m.label),
        timestamp: new Date().toISOString(),
      },
      theme,
      layout: this.determineLayout(data),
    };

    return slide;
  }

  private static determineLayout(data: MetricSlideData): string {
    if (data.chartConfig && data.metrics.length <= 4) {
      return 'split'; // Chart on one side, metrics on the other
    } else if (data.metrics.length > 6) {
      return 'grid'; // Grid layout for many metrics
    } else if (data.comparison) {
      return 'comparison'; // Comparison-focused layout
    }
    return 'standard'; // Default layout
  }

  private static generateChartVisualization(config: ChartConfig, theme: PresentationTheme): any {
    const themeColors = this.getThemeColors(theme);

    return {
      type: config.type,
      data: {
        labels: config.labels || config.data.map((_, i) => `Period ${i + 1}`),
        datasets: [
          {
            label: 'Metrics',
            data: config.data,
            backgroundColor: config.colors || themeColors.primary,
            borderColor: themeColors.accent,
            borderWidth: 2,
            fill: config.type === 'line' ? false : true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: config.type !== 'gauge',
            labels: { color: themeColors.text },
          },
          tooltip: {
            backgroundColor: themeColors.background,
            titleColor: themeColors.text,
            bodyColor: themeColors.text,
            borderColor: themeColors.border,
            borderWidth: 1,
          },
        },
        scales:
          config.type !== 'gauge'
            ? {
                x: {
                  ticks: { color: themeColors.text },
                  grid: { color: themeColors.border },
                },
                y: {
                  ticks: { color: themeColors.text },
                  grid: { color: themeColors.border },
                  beginAtZero: true,
                },
              }
            : undefined,
      },
    };
  }

  private static getThemeColors(theme: PresentationTheme): any {
    const themes = {
      [PresentationTheme.NEON_GLASS]: {
        primary: '#00ff88',
        accent: '#6366f1',
        text: '#ffffff',
        background: 'rgba(15, 20, 25, 0.9)',
        border: 'rgba(255, 255, 255, 0.1)',
      },
      [PresentationTheme.EXECUTIVE_DARK]: {
        primary: '#6366f1',
        accent: '#8b5cf6',
        text: '#ffffff',
        background: '#1a1a2e',
        border: '#2d3748',
      },
      [PresentationTheme.CMO_LITE]: {
        primary: '#6366f1',
        accent: '#8b5cf6',
        text: '#1a202c',
        background: '#ffffff',
        border: '#e2e8f0',
      },
    };

    return themes[theme] || themes[PresentationTheme.NEON_GLASS];
  }

  private static generateKeyTakeaway(data: MetricSlideData): string {
    const topMetric = this.getTopPerformingMetric(data.metrics);
    const trendDirection = data.trend?.direction || 'stable';

    if (topMetric) {
      const changeText = topMetric.change
        ? `${topMetric.change > 0 ? '+' : ''}${topMetric.change.toFixed(1)}%`
        : '';

      return `${topMetric.label} is ${this.getStatusText(topMetric.status)} at ${topMetric.value}${topMetric.unit || ''} ${changeText}`;
    }

    return `Metrics showing ${trendDirection} trend across key performance indicators`;
  }

  private static generateBusinessContext(data: MetricSlideData): string {
    const positiveTrends = data.metrics.filter(m => m.status === 'positive').length;
    const totalMetrics = data.metrics.length;
    const performanceRatio = positiveTrends / totalMetrics;

    if (performanceRatio >= 0.8) {
      return 'Strong performance across most key metrics indicates effective strategy execution';
    } else if (performanceRatio >= 0.6) {
      return 'Mixed performance suggests opportunities for optimization in underperforming areas';
    } else {
      return 'Multiple metrics below target require strategic intervention and resource reallocation';
    }
  }

  private static generateRecommendation(data: MetricSlideData): string {
    const negativeMetrics = data.metrics.filter(m => m.status === 'negative');

    if (negativeMetrics.length === 0) {
      return 'Continue current strategies while exploring opportunities for further optimization';
    } else if (negativeMetrics.length <= 2) {
      return `Focus improvement efforts on ${negativeMetrics.map(m => m.label).join(' and ')}`;
    } else {
      return 'Comprehensive review needed for underperforming metrics with immediate action plan';
    }
  }

  private static getTopPerformingMetric(metrics: MetricItem[]): MetricItem | null {
    const positiveMetrics = metrics.filter(m => m.status === 'positive');
    if (positiveMetrics.length === 0) return null;

    // Return metric with highest change or first positive metric
    return positiveMetrics.reduce((best, current) => {
      const bestChange = best.change || 0;
      const currentChange = current.change || 0;
      return currentChange > bestChange ? current : best;
    });
  }

  private static getStatusText(status: 'positive' | 'negative' | 'neutral'): string {
    const statusMap = {
      positive: 'performing well',
      negative: 'underperforming',
      neutral: 'stable',
    };
    return statusMap[status];
  }

  // Utility methods for common metric slide patterns
  static createROASSlide(
    roasData: {
      current: number;
      target: number;
      change: number;
      campaigns: { name: string; roas: number }[];
    },
    theme?: PresentationTheme
  ): StrategySlide {
    const slideData: MetricSlideData = {
      title: 'Return on Ad Spend (ROAS)',
      subtitle: 'Campaign Performance Overview',
      metrics: [
        {
          label: 'Overall ROAS',
          value: roasData.current.toFixed(1),
          unit: 'x',
          change: roasData.change,
          status: roasData.current >= roasData.target ? 'positive' : 'negative',
          target: roasData.target,
          format: 'ratio',
        },
        {
          label: 'Target Achievement',
          value: ((roasData.current / roasData.target) * 100).toFixed(0),
          unit: '%',
          status: roasData.current >= roasData.target ? 'positive' : 'negative',
          format: 'percentage',
        },
      ],
      chartConfig: {
        type: 'bar',
        data: roasData.campaigns.map(c => c.roas),
        labels: roasData.campaigns.map(c => c.name),
        showValues: true,
      },
      highlights: [
        `Current ROAS: ${roasData.current.toFixed(1)}x`,
        `Target ROAS: ${roasData.target.toFixed(1)}x`,
        `Best Performing: ${
          roasData.campaigns.reduce((best, current) => (current.roas > best.roas ? current : best))
            .name
        }`,
      ],
    };

    return this.create(slideData, theme);
  }

  static createConversionSlide(
    conversionData: {
      rate: number;
      volume: number;
      cost: number;
      trends: number[];
    },
    theme?: PresentationTheme
  ): StrategySlide {
    const slideData: MetricSlideData = {
      title: 'Conversion Performance',
      subtitle: 'Lead Generation & Customer Acquisition',
      metrics: [
        {
          label: 'Conversion Rate',
          value: (conversionData.rate * 100).toFixed(1),
          unit: '%',
          status: conversionData.rate > 0.03 ? 'positive' : 'negative',
          format: 'percentage',
        },
        {
          label: 'Total Conversions',
          value: conversionData.volume.toLocaleString(),
          status: 'positive',
          format: 'number',
        },
        {
          label: 'Cost Per Conversion',
          value: conversionData.cost.toFixed(0),
          unit: '$',
          status: conversionData.cost < 50 ? 'positive' : 'negative',
          format: 'currency',
        },
      ],
      chartConfig: {
        type: 'line',
        data: conversionData.trends,
        labels: conversionData.trends.map((_, i) => `Month ${i + 1}`),
        showValues: false,
      },
    };

    return this.create(slideData, theme);
  }

  static createBrandAlignmentSlide(
    brandData: {
      overallScore: number;
      consistency: number;
      guidelines: number;
      byChannel: { channel: string; score: number }[];
    },
    theme?: PresentationTheme
  ): StrategySlide {
    const slideData: MetricSlideData = {
      title: 'Brand Alignment Score',
      subtitle: 'Consistency Across Channels & Campaigns',
      metrics: [
        {
          label: 'Overall Score',
          value: (brandData.overallScore * 100).toFixed(0),
          unit: '%',
          status: brandData.overallScore > 0.85 ? 'positive' : 'negative',
          format: 'percentage',
        },
        {
          label: 'Consistency Rating',
          value: (brandData.consistency * 100).toFixed(0),
          unit: '%',
          status: brandData.consistency > 0.9 ? 'positive' : 'neutral',
          format: 'percentage',
        },
        {
          label: 'Guidelines Adherence',
          value: (brandData.guidelines * 100).toFixed(0),
          unit: '%',
          status: brandData.guidelines > 0.95 ? 'positive' : 'negative',
          format: 'percentage',
        },
      ],
      chartConfig: {
        type: 'bar',
        data: brandData.byChannel.map(c => c.score * 100),
        labels: brandData.byChannel.map(c => c.channel),
        showValues: true,
      },
    };

    return this.create(slideData, theme);
  }
}

export default MetricSlideTemplate;
