'use client';

import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Rocket,
  Target,
  DollarSign,
  Calendar,
  Users,
  Brain,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
} from 'lucide-react';

export function PredictiveCampaignDesigner() {
  const [formData, setFormData] = useState({
    objective: '',
    budget: '',
    timeline: '',
    targetAudience: {
      demographics: '',
      interests: '',
      size: '',
    },
  });

  const generateCampaign = trpc.insights.generatePredictiveCampaign.useMutation();

  const handleGenerate = async () => {
    await generateCampaign.mutateAsync({
      objective: formData.objective,
      budget: parseInt(formData.budget),
      timeline: parseInt(formData.timeline),
      targetAudience: {
        demographics: formData.targetAudience.demographics,
        interests: formData.targetAudience.interests,
        estimatedSize: formData.targetAudience.size,
      },
    });
  };

  const plan = generateCampaign.data?.data?.mainPlan;
  const readiness = generateCampaign.data?.data?.executionReadiness;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Rocket className="w-5 h-5 mr-2 text-neon-blue" />
            Campaign Designer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="objective" className="text-slate-300">
              Campaign Objective
            </Label>
            <Textarea
              id="objective"
              placeholder="Describe your campaign goals..."
              value={formData.objective}
              onChange={e => setFormData({ ...formData, objective: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget" className="text-slate-300">
                Budget ($)
              </Label>
              <Input
                id="budget"
                type="number"
                placeholder="10000"
                value={formData.budget}
                onChange={e => setFormData({ ...formData, budget: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white mt-1"
              />
            </div>
            <div>
              <Label htmlFor="timeline" className="text-slate-300">
                Timeline (days)
              </Label>
              <Input
                id="timeline"
                type="number"
                placeholder="30"
                value={formData.timeline}
                onChange={e => setFormData({ ...formData, timeline: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Target Audience</Label>
            <div className="space-y-3 mt-2">
              <Input
                placeholder="Demographics (e.g., 25-45, urban professionals)"
                value={formData.targetAudience.demographics}
                onChange={e =>
                  setFormData({
                    ...formData,
                    targetAudience: { ...formData.targetAudience, demographics: e.target.value },
                  })
                }
                className="bg-slate-700/50 border-slate-600 text-white"
              />
              <Input
                placeholder="Interests (e.g., technology, business)"
                value={formData.targetAudience.interests}
                onChange={e =>
                  setFormData({
                    ...formData,
                    targetAudience: { ...formData.targetAudience, interests: e.target.value },
                  })
                }
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generateCampaign.isLoading || !formData.objective || !formData.budget}
            className="w-full bg-gradient-to-r from-neon-blue to-blue-600 hover:from-blue-600 hover:to-neon-blue"
          >
            {generateCampaign.isLoading ? (
              <>
                <Brain className="w-4 h-4 mr-2 animate-pulse" />
                Generating Plan...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Generate Campaign
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Plan */}
      {plan && (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-neon-purple" />
                {plan.name}
              </span>
              <Badge
                variant="outline"
                className={`${plan.confidence > 80 ? 'text-green-400 border-green-400' : 'text-yellow-400 border-yellow-400'}`}
              >
                {plan.confidence}% Confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{plan.expectedROI.toFixed(1)}x</div>
                <div className="text-xs text-slate-400">Expected ROI</div>
              </div>
              <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                <Calendar className="w-6 h-6 text-neon-blue mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{plan.timeline.totalDuration}</div>
                <div className="text-xs text-slate-400">Days</div>
              </div>
              <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                <Users className="w-6 h-6 text-neon-purple mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{plan.targetSegments.length}</div>
                <div className="text-xs text-slate-400">Segments</div>
              </div>
            </div>

            {/* Campaign Phases */}
            <div>
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-neon-blue" />
                Campaign Phases
              </h4>
              <div className="space-y-2">
                {plan.timeline.phases.map((phase, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-white">{phase.name}</p>
                      <p className="text-sm text-slate-400">{phase.agents.join(', ')}</p>
                    </div>
                    <Badge variant="outline" className="text-slate-300 border-slate-600">
                      {phase.duration} days
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Readiness Status */}
            {readiness && (
              <div className="p-4 bg-slate-700/30 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">Execution Readiness</h4>
                  {readiness.readyToLaunch ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  )}
                </div>

                {readiness.readyToLaunch ? (
                  <div className="space-y-2">
                    <p className="text-sm text-green-400">✅ Ready to launch</p>
                    <Button className="w-full bg-gradient-to-r from-green-500 to-green-600">
                      <Zap className="w-4 h-4 mr-2" />
                      Launch Campaign
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-yellow-400">⚠️ Review blockers before launch</p>
                    {readiness.blockers.map((blocker, index) => (
                      <p key={index} className="text-xs text-slate-400">
                        • {blocker}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {plan.recommendations && (
              <div>
                <h4 className="font-medium text-white mb-3">AI Recommendations</h4>
                <div className="space-y-2">
                  {plan.recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 bg-neon-blue rounded-full mt-2 flex-shrink-0"></div>
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
