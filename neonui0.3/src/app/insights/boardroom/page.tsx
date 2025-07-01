'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  FileText,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Eye,
  Share2,
  Settings,
} from 'lucide-react';

// Mock types for the boardroom functionality
interface BoardroomReport {
  id: string;
  title: string;
  subtitle?: string;
  reportType: string;
  quarter?: string;
  theme: string;
  overallScore: number;
  brandHealthScore: number;
  overallROAS: number;
  totalRevenue: number;
  keyTakeaways: string[];
  strategicRecommendations: string[];
  slides: StrategySlide[];
  forecasts: ForecastInsight[];
  generationTime: number;
  confidenceScore: number;
  createdAt: string;
}

interface StrategySlide {
  slideNumber: number;
  slideType: string;
  title: string;
  subtitle?: string;
  keyTakeaway?: string;
  businessContext?: string;
  recommendation?: string;
  theme: string;
}

interface ForecastInsight {
  metricName: string;
  currentValue: number;
  projectedValue: number;
  projectionPeriod: string;
  confidenceLevel: number;
  businessImpact: number;
  strategicPriority: string;
  actionRequired: boolean;
}

// Custom hooks for data fetching
const useBoardroomReports = () => {
  const [reports, setReports] = useState<BoardroomReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data fetch
    setTimeout(() => {
      setReports([
        {
          id: 'qbr_2024_q1',
          title: 'Q1 2024 Quarterly Business Review',
          subtitle: 'Strategic Performance & Forward Outlook',
          reportType: 'QBR',
          quarter: 'Q1 2024',
          theme: 'NEON_GLASS',
          overallScore: 87,
          brandHealthScore: 91,
          overallROAS: 3.4,
          totalRevenue: 1250000,
          keyTakeaways: [
            'Exceeded ROAS targets by 13% across all campaigns',
            'Brand alignment improved by 15% quarter-over-quarter',
            'AI agent efficiency increased by 28%',
            'Video content strategy yielding 87% success rate',
          ],
          strategicRecommendations: [
            'Scale high-performing video content campaigns',
            'Implement cross-platform brand consistency guidelines',
            'Invest in advanced AI agent collaboration',
          ],
          slides: [
            {
              slideNumber: 1,
              slideType: 'TITLE',
              title: 'Q1 2024 Strategic Review',
              theme: 'NEON_GLASS',
            },
            {
              slideNumber: 2,
              slideType: 'EXECUTIVE_SUMMARY',
              title: 'Executive Summary',
              keyTakeaway: 'Strong performance across all key metrics',
              theme: 'NEON_GLASS',
            },
            {
              slideNumber: 3,
              slideType: 'FINANCIAL_OVERVIEW',
              title: 'Financial Performance',
              keyTakeaway: 'Revenue up 23% with 3.4x ROAS',
              theme: 'NEON_GLASS',
            },
            {
              slideNumber: 4,
              slideType: 'AGENT_HIGHLIGHT',
              title: 'AI Agent Performance',
              keyTakeaway: '92% average success rate achieved',
              theme: 'NEON_GLASS',
            },
            {
              slideNumber: 5,
              slideType: 'FORECAST',
              title: 'Strategic Forecasts',
              keyTakeaway: 'Projected 16% improvement over next quarter',
              theme: 'NEON_GLASS',
            },
          ],
          forecasts: [
            {
              metricName: 'Overall ROAS',
              currentValue: 3.4,
              projectedValue: 3.8,
              projectionPeriod: '3_MONTHS',
              confidenceLevel: 0.85,
              businessImpact: 125000,
              strategicPriority: 'HIGH',
              actionRequired: true,
            },
            {
              metricName: 'Brand Alignment Score',
              currentValue: 0.91,
              projectedValue: 0.94,
              projectionPeriod: '6_MONTHS',
              confidenceLevel: 0.78,
              businessImpact: 85000,
              strategicPriority: 'MEDIUM',
              actionRequired: false,
            },
          ],
          generationTime: 2847,
          confidenceScore: 0.82,
          createdAt: '2024-01-15T10:30:00Z',
        },
        {
          id: 'monthly_2024_03',
          title: 'March 2024 Strategic Overview',
          subtitle: 'Monthly Performance & Optimization Insights',
          reportType: 'MONTHLY_STRATEGY',
          theme: 'EXECUTIVE_DARK',
          overallScore: 92,
          brandHealthScore: 89,
          overallROAS: 3.6,
          totalRevenue: 485000,
          keyTakeaways: [
            'Campaign optimization yielding 12% ROAS improvement',
            'Cross-platform consistency at 94%',
            'New AI agents showing 85% success rate',
          ],
          strategicRecommendations: [
            'Accelerate high-performing campaign scaling',
            'Implement new optimization algorithms',
          ],
          slides: [
            {
              slideNumber: 1,
              slideType: 'TITLE',
              title: 'March 2024 Overview',
              theme: 'EXECUTIVE_DARK',
            },
            {
              slideNumber: 2,
              slideType: 'METRIC',
              title: 'Key Metrics',
              keyTakeaway: 'All metrics trending positive',
              theme: 'EXECUTIVE_DARK',
            },
            {
              slideNumber: 3,
              slideType: 'TREND',
              title: 'Performance Trends',
              keyTakeaway: 'Consistent upward trajectory',
              theme: 'EXECUTIVE_DARK',
            },
          ],
          forecasts: [
            {
              metricName: 'Monthly Revenue',
              currentValue: 485000,
              projectedValue: 520000,
              projectionPeriod: '1_MONTH',
              confidenceLevel: 0.91,
              businessImpact: 35000,
              strategicPriority: 'HIGH',
              actionRequired: true,
            },
          ],
          generationTime: 1823,
          confidenceScore: 0.89,
          createdAt: '2024-03-31T16:45:00Z',
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return { reports, loading };
};

const useForecastInsights = () => {
  const [insights, setInsights] = useState<ForecastInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock forecast data
    setTimeout(() => {
      setInsights([
        {
          metricName: 'Revenue Growth',
          currentValue: 1250000,
          projectedValue: 1450000,
          projectionPeriod: '3_MONTHS',
          confidenceLevel: 0.87,
          businessImpact: 200000,
          strategicPriority: 'CRITICAL',
          actionRequired: true,
        },
        {
          metricName: 'Cost Per Acquisition',
          currentValue: 45,
          projectedValue: 38,
          projectionPeriod: '6_MONTHS',
          confidenceLevel: 0.83,
          businessImpact: 95000,
          strategicPriority: 'HIGH',
          actionRequired: true,
        },
        {
          metricName: 'Agent Efficiency',
          currentValue: 0.87,
          projectedValue: 0.93,
          projectionPeriod: '3_MONTHS',
          confidenceLevel: 0.79,
          businessImpact: 125000,
          strategicPriority: 'MEDIUM',
          actionRequired: false,
        },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  return { insights, loading };
};

// Mock chart component
const ForecastChart: React.FC<{ insight: ForecastInsight }> = ({ insight }) => {
  const changePercent =
    ((insight.projectedValue - insight.currentValue) / insight.currentValue) * 100;
  const isPositive = changePercent > 0;

  return (
    <div className="h-48 bg-gray-900/20 rounded-lg border border-gray-700 p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">{insight.metricName}</h4>
        <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs">
          {isPositive ? (
            <TrendingUp className="w-3 h-3 mr-1" />
          ) : (
            <TrendingDown className="w-3 h-3 mr-1" />
          )}
          {changePercent.toFixed(1)}%
        </Badge>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-neon-green mb-1">
            {typeof insight.projectedValue === 'number' && insight.projectedValue > 1000
              ? `$${(insight.projectedValue / 1000).toFixed(0)}K`
              : insight.projectedValue.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">
            from{' '}
            {typeof insight.currentValue === 'number' && insight.currentValue > 1000
              ? `$${(insight.currentValue / 1000).toFixed(0)}K`
              : insight.currentValue.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mt-2">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Confidence</span>
          <span>{(insight.confidenceLevel * 100).toFixed(0)}%</span>
        </div>
        <Progress value={insight.confidenceLevel * 100} className="h-1" />
      </div>
    </div>
  );
};

// Slide preview component
const SlidePreview: React.FC<{ slide: StrategySlide; isActive: boolean; onClick: () => void }> = ({
  slide,
  isActive,
  onClick,
}) => {
  const getSlideIcon = (type: string) => {
    switch (type) {
      case 'EXECUTIVE_SUMMARY':
        return <BarChart3 className="w-4 h-4" />;
      case 'FINANCIAL_OVERVIEW':
        return <PieChart className="w-4 h-4" />;
      case 'AGENT_HIGHLIGHT':
        return <Zap className="w-4 h-4" />;
      case 'FORECAST':
        return <TrendingUp className="w-4 h-4" />;
      case 'METRIC':
        return <Activity className="w-4 h-4" />;
      case 'TREND':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 ${
        isActive
          ? 'border-neon-green shadow-lg shadow-neon-green/20 bg-gray-900/60'
          : 'border-gray-700 hover:border-gray-600 bg-gray-900/20'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div
              className={`p-2 rounded-lg ${isActive ? 'bg-neon-green/20 text-neon-green' : 'bg-gray-800 text-gray-400'}`}
            >
              {getSlideIcon(slide.slideType)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-gray-500">#{slide.slideNumber}</span>
              <Badge variant="outline" className="text-xs">
                {slide.slideType.replace('_', ' ')}
              </Badge>
            </div>
            <h4 className="font-medium text-gray-200 text-sm truncate">{slide.title}</h4>
            {slide.keyTakeaway && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{slide.keyTakeaway}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main component
export default function BoardroomDashboard() {
  const { reports, loading: reportsLoading } = useBoardroomReports();
  const { insights, loading: insightsLoading } = useForecastInsights();
  const [selectedReport, setSelectedReport] = useState<BoardroomReport | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (reports.length > 0 && !selectedReport) {
      setSelectedReport(reports[0]);
    }
  }, [reports, selectedReport]);

  const handleDownload = (format: string, reportId: string) => {
    // Mock download functionality
    console.log(`Downloading ${format} for report ${reportId}`);
    // In production, this would trigger actual file download
  };

  const handleNotionExport = (reportId: string) => {
    // Mock Notion export
    console.log(`Exporting to Notion: ${reportId}`);
  };

  const nextSlide = () => {
    if (selectedReport && activeSlide < selectedReport.slides.length - 1) {
      setActiveSlide(activeSlide + 1);
    }
  };

  const prevSlide = () => {
    if (activeSlide > 0) {
      setActiveSlide(activeSlide - 1);
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // Auto-advance slides when playing
    if (!isPlaying) {
      const interval = setInterval(() => {
        setActiveSlide(prev => {
          if (selectedReport && prev >= selectedReport.slides.length - 1) {
            setIsPlaying(false);
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 3000);
    }
  };

  if (reportsLoading || insightsLoading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mx-auto mb-4"></div>
          <p className="text-gray-400">Loading boardroom intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Boardroom Strategy Center</h1>
              <p className="text-gray-400 mt-1">
                AI-Generated Executive Presentations & Strategic Forecasts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button className="bg-neon-green hover:bg-neon-green/90 text-gray-900">
                <Zap className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900/50">
            <TabsTrigger value="reports">Executive Reports</TabsTrigger>
            <TabsTrigger value="forecasts">Forecast Analytics</TabsTrigger>
            <TabsTrigger value="insights">Strategic Insights</TabsTrigger>
          </TabsList>

          {/* Executive Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Report List */}
              <div className="lg:col-span-1">
                <Card className="bg-gray-900/30 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg">Available Reports</CardTitle>
                    <CardDescription>AI-generated strategic presentations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {reports.map(report => (
                      <Card
                        key={report.id}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedReport?.id === report.id
                            ? 'border-neon-green bg-gray-800/50'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                        onClick={() => {
                          setSelectedReport(report);
                          setActiveSlide(0);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline" className="text-xs">
                              {report.reportType}
                            </Badge>
                            <div className="text-right">
                              <div className="text-sm font-bold text-neon-green">
                                {report.overallScore}%
                              </div>
                              <div className="text-xs text-gray-400">Score</div>
                            </div>
                          </div>
                          <h4 className="font-medium text-sm text-gray-200 mb-1">{report.title}</h4>
                          <p className="text-xs text-gray-400 mb-2">{report.subtitle}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(report.createdAt).toLocaleDateString()}
                            </span>
                            <span>{report.slides.length} slides</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Main Report Viewer */}
              <div className="lg:col-span-2">
                {selectedReport && (
                  <Card className="bg-gray-900/30 border-gray-700 h-[600px]">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{selectedReport.title}</CardTitle>
                          <CardDescription>{selectedReport.subtitle}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={prevSlide}
                            disabled={activeSlide === 0}
                          >
                            <SkipBack className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={togglePlayback}>
                            {isPlaying ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={nextSlide}
                            disabled={activeSlide === selectedReport.slides.length - 1}
                          >
                            <SkipForward className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="h-[500px] flex flex-col">
                      {/* Slide Content */}
                      <div className="flex-1 bg-gray-800/30 rounded-lg p-6 mb-4 flex items-center justify-center">
                        {selectedReport.slides[activeSlide] ? (
                          <div className="text-center max-w-2xl">
                            <div className="text-xs text-gray-400 mb-2">
                              Slide {activeSlide + 1} of {selectedReport.slides.length}
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">
                              {selectedReport.slides[activeSlide].title}
                            </h2>
                            {selectedReport.slides[activeSlide].subtitle && (
                              <p className="text-lg text-gray-300 mb-6">
                                {selectedReport.slides[activeSlide].subtitle}
                              </p>
                            )}
                            {selectedReport.slides[activeSlide].keyTakeaway && (
                              <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-4">
                                <div className="text-sm font-medium text-neon-green mb-2">
                                  Key Takeaway
                                </div>
                                <p className="text-gray-300">
                                  {selectedReport.slides[activeSlide].keyTakeaway}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-400">Select a slide to view content</div>
                        )}
                      </div>

                      {/* Slide Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Progress</span>
                          <span>
                            {activeSlide + 1} / {selectedReport.slides.length}
                          </span>
                        </div>
                        <Progress
                          value={((activeSlide + 1) / selectedReport.slides.length) * 100}
                          className="h-1"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Download & Tools Panel */}
              <div className="lg:col-span-1">
                <div className="space-y-4">
                  {/* Quick Actions */}
                  <Card className="bg-gray-900/30 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-sm">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => selectedReport && handleDownload('PDF', selectedReport.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => selectedReport && handleDownload('PPTX', selectedReport.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PPTX
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => selectedReport && handleNotionExport(selectedReport.id)}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Export to Notion
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Eye className="w-4 h-4 mr-2" />
                        Present Mode
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Report Stats */}
                  {selectedReport && (
                    <Card className="bg-gray-900/30 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Report Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Overall Score</span>
                          <span className="font-medium text-neon-green">
                            {selectedReport.overallScore}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Brand Health</span>
                          <span className="font-medium">{selectedReport.brandHealthScore}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">ROAS</span>
                          <span className="font-medium">
                            {selectedReport.overallROAS.toFixed(1)}x
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Revenue</span>
                          <span className="font-medium">
                            ${(selectedReport.totalRevenue / 1000).toFixed(0)}K
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Confidence</span>
                          <span className="font-medium">
                            {(selectedReport.confidenceScore * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Generation Time</span>
                          <span className="font-medium">{selectedReport.generationTime}ms</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Slide Explorer */}
                  {selectedReport && (
                    <Card className="bg-gray-900/30 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-sm">Slide Navigator</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedReport.slides.map((slide, index) => (
                          <SlidePreview
                            key={slide.slideNumber}
                            slide={slide}
                            isActive={index === activeSlide}
                            onClick={() => setActiveSlide(index)}
                          />
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Forecast Analytics Tab */}
          <TabsContent value="forecasts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {insights.map((insight, index) => (
                <ForecastChart key={index} insight={insight} />
              ))}
            </div>

            <Card className="bg-gray-900/30 border-gray-700">
              <CardHeader>
                <CardTitle>Forecast Summary</CardTitle>
                <CardDescription>
                  AI-powered predictive analytics for strategic planning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {insights.map((insight, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-200">{insight.metricName}</h4>
                        <Badge
                          variant={
                            insight.strategicPriority === 'CRITICAL' ? 'destructive' : 'default'
                          }
                        >
                          {insight.strategicPriority}
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold text-neon-green">
                        {typeof insight.projectedValue === 'number' && insight.projectedValue > 1000
                          ? `$${(insight.projectedValue / 1000).toFixed(0)}K`
                          : insight.projectedValue.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {insight.projectionPeriod.replace('_', ' ')} projection
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={insight.confidenceLevel * 100} className="flex-1 h-1" />
                        <span className="text-xs text-gray-400">
                          {(insight.confidenceLevel * 100).toFixed(0)}%
                        </span>
                      </div>
                      {insight.actionRequired && (
                        <div className="flex items-center gap-1 text-xs text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          Action Required
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Strategic Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900/30 border-gray-700">
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                  <CardDescription>Real-time intelligence system status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">AI Agents Active</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">12/12</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Last Report Generated</span>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">2 hours ago</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Data Freshness</span>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">Real-time</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Forecast Accuracy</span>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-neon-green" />
                        <span className="text-sm font-medium">87% (30d avg)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/30 border-gray-700">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest strategic intelligence updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        time: '2m ago',
                        event: 'Q1 Report generated successfully',
                        status: 'success',
                      },
                      { time: '15m ago', event: 'New forecast model deployed', status: 'info' },
                      { time: '1h ago', event: 'Brand alignment score updated', status: 'success' },
                      { time: '2h ago', event: 'Campaign performance analyzed', status: 'success' },
                      {
                        time: '3h ago',
                        event: 'Strategic recommendations updated',
                        status: 'info',
                      },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.status === 'success' ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="text-sm text-gray-300">{activity.event}</div>
                          <div className="text-xs text-gray-500">{activity.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
