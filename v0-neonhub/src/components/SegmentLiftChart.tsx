'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Target, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';

interface SegmentLiftChartProps {
  segmentData: any;
  performanceInsights: any[];
}

export function SegmentLiftChart({ segmentData, performanceInsights }: SegmentLiftChartProps) {
  const segments = [
    {
      name: 'Young Professionals',
      performance: 88,
      lift: 15,
      size: 25000,
      color: 'text-neon-blue',
    },
    { name: 'Small Business', performance: 92, lift: 23, size: 18000, color: 'text-neon-purple' },
    { name: 'Tech Enthusiasts', performance: 95, lift: 28, size: 12000, color: 'text-green-400' },
    { name: 'Enterprise', performance: 76, lift: -5, size: 35000, color: 'text-yellow-400' },
    { name: 'Retail', performance: 82, lift: 8, size: 22000, color: 'text-orange-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Segment Performance Analytics</h2>
        <p className="text-slate-400">
          Audience lift analysis and segment-specific pattern insights
        </p>
      </div>

      {/* Segment Performance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments.map((segment, index) => (
          <Card key={index} className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-white text-lg">
                {segment.name}
                <Badge
                  variant="outline"
                  className={`${segment.performance > 85 ? 'text-green-400 border-green-400' : 'text-yellow-400 border-yellow-400'}`}
                >
                  {segment.performance}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <Users className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                  <div className="text-sm font-bold text-white">
                    {(segment.size / 1000).toFixed(0)}K
                  </div>
                  <div className="text-xs text-slate-400">Audience</div>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    {segment.lift > 0 ? (
                      <ArrowUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div
                    className={`text-sm font-bold ${segment.lift > 0 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {segment.lift > 0 ? '+' : ''}
                    {segment.lift}%
                  </div>
                  <div className="text-xs text-slate-400">Lift</div>
                </div>
              </div>

              {/* Performance Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Performance Score</span>
                  <span className={segment.color}>{segment.performance}/100</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${
                      segment.performance > 90
                        ? 'from-green-400 to-green-500'
                        : segment.performance > 80
                          ? 'from-yellow-400 to-yellow-500'
                          : 'from-red-400 to-red-500'
                    }`}
                    style={{ width: `${segment.performance}%` }}
                  ></div>
                </div>
              </div>

              {/* Quick Insights */}
              <div className="pt-2 border-t border-slate-700/50">
                <p className="text-xs text-slate-400">
                  {segment.performance > 90
                    ? '🎯 Top performer'
                    : segment.performance > 80
                      ? '✅ Strong performance'
                      : '⚠️ Needs optimization'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Segment Insights Summary */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-neon-blue" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Performing Segments */}
            <div>
              <h4 className="font-medium text-white mb-3">Top Performing Segments</h4>
              <div className="space-y-2">
                {segments
                  .sort((a, b) => b.performance - a.performance)
                  .slice(0, 3)
                  .map((segment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-slate-700/30 rounded"
                    >
                      <span className="text-slate-300">{segment.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={segment.color}>{segment.performance}</span>
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Optimization Opportunities */}
            <div>
              <h4 className="font-medium text-white mb-3">Optimization Opportunities</h4>
              <div className="space-y-2">
                <div className="p-3 bg-slate-700/30 rounded">
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-neon-blue mt-0.5" />
                    <div>
                      <p className="text-sm text-white font-medium">Tech Enthusiasts</p>
                      <p className="text-xs text-slate-400">
                        Highest engagement - increase budget allocation
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
