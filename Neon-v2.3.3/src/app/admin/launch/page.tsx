'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Rocket,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  MessageSquare,
  Target,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

export default function AdminLaunchPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const campaigns = [
    { id: 'campaign-1', name: 'UAE Digital Launch', type: 'CONTENT_GENERATION' },
    { id: 'campaign-2', name: 'Dubai Meta Ads', type: 'ADS' },
    { id: 'campaign-3', name: 'Abu Dhabi B2B', type: 'B2B_OUTREACH' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Rocket className="h-8 w-8 text-purple-400" />
              Launch Intelligence Dashboard
            </h1>
            <p className="text-slate-400">Real-time monitoring for UAE market campaigns</p>
          </div>
        </div>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader className="text-center py-16">
            <CardTitle className="text-white text-xl mb-4">
              🚀 Launch Intelligence Dashboard
            </CardTitle>
            <CardDescription className="text-slate-400 mb-8">
              Monitor campaign execution volume, sentiment analysis, and budget pacing for UAE
              market
            </CardDescription>
            <div className="max-w-md mx-auto">
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Choose a campaign to monitor..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {campaigns.map(campaign => (
                    <SelectItem key={campaign.id} value={campaign.id} className="text-white">
                      {campaign.name} ({campaign.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
