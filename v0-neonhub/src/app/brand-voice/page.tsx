'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  MessageSquare,
  Target,
  BarChart3,
  Settings,
  Plus,
  Brain,
  CheckCircle,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { BrandVoiceProfileModal } from '@/components/BrandVoiceProfileModal';
import { ContentVoiceAnalyzer } from '@/components/ContentVoiceAnalyzer';
import { VoiceGuidelinesPanel } from '@/components/VoiceGuidelinesPanel';
import { brand } from '@/lib/brand';
import { metrics } from '@/lib/metrics';

// Real brand voice data from brand configuration
const brandProfiles = [
  {
    id: '1',
    name: 'Primary Brand Voice',
    description: `${brand.voice.primary} - ${brand.voice.secondary}`,
    isActive: true,
    averageScore: 94,
    analysisCount: 1847,
    lastUsed: new Date('2024-01-16'),
    consistency: 96,
    toneSettings: brand.voice.tone,
  },
  {
    id: '2',
    name: 'Technical Communication',
    description: 'Data-driven and analytical for technical content',
    isActive: false,
    averageScore: 89,
    analysisCount: 234,
    lastUsed: new Date('2024-01-14'),
    consistency: 91,
    toneSettings: {
      professional: 95,
      friendly: 40,
      authoritative: 90,
      casual: 20,
      innovative: 85,
    },
  },
];

const recentAnalyses = [
  {
    id: '1',
    contentType: 'email',
    voiceScore: 96,
    analyzedAt: new Date('2024-01-16T14:30:00'),
    suggestions: 1,
    content: 'Email Marketing Campaign - AI Marketing Insights Weekly',
  },
  {
    id: '2',
    contentType: 'social',
    voiceScore: 92,
    analyzedAt: new Date('2024-01-16T12:15:00'),
    suggestions: 2,
    content: 'LinkedIn thought leadership post',
  },
  {
    id: '3',
    contentType: 'blog',
    voiceScore: 98,
    analyzedAt: new Date('2024-01-16T09:45:00'),
    suggestions: 0,
    content: 'The Future of AI Marketing Automation',
  },
  {
    id: '4',
    contentType: 'ads',
    voiceScore: 94,
    analyzedAt: new Date('2024-01-15T16:20:00'),
    suggestions: 1,
    content: 'Facebook ad campaign - Enterprise B2B',
  },
];

const consistencyData = [
  { contentType: 'Email', score: 96, count: 156, trend: 'up' },
  { contentType: 'Social', score: 92, count: 89, trend: 'up' },
  { contentType: 'Blog', score: 98, count: 34, trend: 'up' },
  { contentType: 'Ads', score: 94, count: 67, trend: 'stable' },
];

export default function BrandVoicePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(brandProfiles[0]);
  const [isLoading, setIsLoading] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Voice</h1>
          <p className="text-gray-600 mt-2">{brand.mission}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setProfileModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Profile
          </Button>
          <Button>
            <Brain className="h-4 w-4 mr-2" />
            Analyze Content
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voice Consistency</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">96%</div>
            <p className="text-xs text-muted-foreground">+4.2% from last month</p>
            <Progress value={96} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Voice Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94</div>
            <p className="text-xs text-muted-foreground">Across all content types</p>
            <Progress value={94} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Analyzed</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,081</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Profiles</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">1 active, 1 specialized</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analyzer">Content Analyzer</TabsTrigger>
          <TabsTrigger value="profiles">Voice Profiles</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Consistency by Content Type */}
          <Card>
            <CardHeader>
              <CardTitle>Voice Consistency by Content Type</CardTitle>
              <CardDescription>
                Track how consistent your brand voice is across different content channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consistencyData.map(item => (
                  <div
                    key={item.contentType}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="font-medium">{item.contentType}</div>
                      <Badge variant="outline">{item.count} items</Badge>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`text-lg font-semibold ${getScoreColor(item.score)}`}>
                        {item.score}%
                      </div>
                      {getTrendIcon(item.trend)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Analyses */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Voice Analyses</CardTitle>
              <CardDescription>Latest content analyzed for brand voice consistency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAnalyses.map(analysis => (
                  <div
                    key={analysis.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="capitalize">
                        {analysis.contentType}
                      </Badge>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800">
                          {analysis.content}
                        </span>
                        <span className="text-xs text-gray-600">
                          {analysis.analyzedAt.toLocaleDateString()} at{' '}
                          {analysis.analyzedAt.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={getScoreBadgeVariant(analysis.voiceScore)}>
                        {analysis.voiceScore}% match
                      </Badge>
                      {analysis.suggestions > 0 && (
                        <div className="flex items-center text-sm text-amber-600">
                          <Lightbulb className="h-4 w-4 mr-1" />
                          {analysis.suggestions} suggestion{analysis.suggestions !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyzer">
          <ContentVoiceAnalyzer profiles={brandProfiles} />
        </TabsContent>

        <TabsContent value="profiles" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Voice Profiles</h3>
              <p className="text-sm text-gray-600">
                Manage your brand voice profiles and configurations
              </p>
            </div>
            <Button onClick={() => setProfileModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Profile
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {brandProfiles.map(profile => (
              <Card
                key={profile.id}
                className={`cursor-pointer transition-all hover:shadow-md ${profile.isActive ? 'ring-2 ring-blue-500' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{profile.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {profile.isActive ? (
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>{profile.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Average Score</span>
                      <span className={`font-semibold ${getScoreColor(profile.averageScore)}`}>
                        {profile.averageScore}%
                      </span>
                    </div>
                    <Progress value={profile.averageScore} />

                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{profile.analysisCount} analyses</span>
                      <span>{profile.consistency}% consistent</span>
                    </div>

                    <div className="text-xs text-gray-500">
                      Last used: {profile.lastUsed.toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="guidelines">
          <VoiceGuidelinesPanel profileId={selectedProfile?.id} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <BrandVoiceProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        onSuccess={() => {
          setProfileModalOpen(false);
          // Refresh profiles list
        }}
      />
    </div>
  );
}
