'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Play, Pause, TrendingUp, Target, Clock, CheckCircle, XCircle } from 'lucide-react';

interface AutoReplayDashboardProps {
  analytics: any;
  isRunning: boolean;
  onToggle: () => void;
}

export function AutoReplayDashboard({ analytics, isRunning, onToggle }: AutoReplayDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Auto-Replay Engine</h2>
          <p className="text-slate-400">
            Autonomous campaign replay system with pattern-based optimization
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge
            variant="outline"
            className={`${isRunning ? 'text-green-400 border-green-400' : 'text-gray-400 border-gray-400'}`}
          >
            {isRunning ? 'Running' : 'Stopped'}
          </Badge>
          <Button onClick={onToggle} variant={isRunning ? 'destructive' : 'default'}>
            {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isRunning ? 'Stop Engine' : 'Start Engine'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Replays</p>
                <p className="text-2xl font-bold text-white">{analytics?.totalReplays || 0}</p>
              </div>
              <Zap className="w-8 h-8 text-neon-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Success Rate</p>
                <p className="text-2xl font-bold text-white">
                  {analytics
                    ? ((analytics.successfulReplays / analytics.totalReplays) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <Target className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg ROI</p>
                <p className="text-2xl font-bold text-white">
                  {analytics?.averageROI?.toFixed(1) || '0.0'}x
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-neon-purple" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Replays</p>
                <p className="text-2xl font-bold text-white">
                  {analytics?.systemHealth?.activeReplays || 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Replays */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Recent Auto-Replays</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {Math.random() > 0.3 ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <div>
                    <p className="font-medium text-white">Pattern {i} Replay</p>
                    <p className="text-sm text-slate-400">Brand awareness campaign</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-neon-blue">
                    {(Math.random() * 2 + 1).toFixed(1)}x ROI
                  </p>
                  <p className="text-xs text-slate-400">{Math.floor(Math.random() * 24)}h ago</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
