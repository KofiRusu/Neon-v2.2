"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  TrendingUp, 
  BarChart3, 
  Eye,
  Sparkles,
  Globe,
  Calendar,
  ArrowUpRight,
  ChevronDown,
  Zap,
  Target,
  Activity
} from "lucide-react";
import { TrendCard } from "./TrendCard";
import { TrendForecast } from "./TrendForecast";

// Mock data for demonstration - in real app this would come from tRPC
const mockTrends = [
  {
    id: "1",
    keyword: "AI Marketing",
    platform: "LINKEDIN" as const,
    category: "technology",
    title: "AI Marketing Automation Trends",
    description: "Advanced AI tools revolutionizing marketing automation and customer engagement strategies",
    viralityScore: 85,
    relevanceScore: 92,
    opportunityScore: 88,
    overallScore: 88,
    volume: 156000,
    growth: 15.2,
    engagement: 0.08,
    shares: 12500,
    likes: 45000,
    comments: 3200,
    region: "global",
    language: "en",
    tags: ["ai", "marketing", "automation", "2024"],
    aiExplanation: "This trend shows strong growth potential due to increasing adoption of AI tools in marketing workflows. The high engagement rates suggest audience interest in automation solutions.",
    status: "active",
    detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: "2",
    keyword: "Sustainable Business",
    platform: "INSTAGRAM" as const,
    category: "lifestyle",
    title: "Sustainable Business Practices",
    description: "Companies showcasing eco-friendly initiatives and sustainable business models",
    viralityScore: 72,
    relevanceScore: 85,
    opportunityScore: 91,
    overallScore: 83,
    volume: 89000,
    growth: 8.7,
    engagement: 0.12,
    shares: 8900,
    likes: 67000,
    comments: 5400,
    region: "global",
    language: "en",
    tags: ["sustainability", "business", "eco", "green"],
    aiExplanation: "Rising consumer consciousness about environmental impact is driving this trend. High opportunity score indicates strong potential for brand alignment.",
    status: "active",
    detectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: "3",
    keyword: "Remote Work Culture",
    platform: "TIKTOK" as const,
    category: "business",
    title: "Remote Work Culture Tips",
    description: "Creative content around remote work setups, productivity tips, and work-life balance",
    viralityScore: 91,
    relevanceScore: 76,
    opportunityScore: 82,
    overallScore: 83,
    volume: 203000,
    growth: 22.1,
    engagement: 0.15,
    shares: 18700,
    likes: 94000,
    comments: 7600,
    region: "global",
    language: "en",
    tags: ["remote", "work", "productivity", "culture"],
    aiExplanation: "High virality on TikTok driven by creative work-from-home content. Strong engagement suggests continued relevance in post-pandemic work culture.",
    status: "active",
    detectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
];

const mockForecast = {
  trendId: "1",
  timeframe: "7d",
  currentScore: 88,
  predictedScore: 93,
  confidence: 0.84,
  trend: "increasing" as const,
  factors: [
    "Recent growth rate: 15.2%",
    "Current momentum: 0.92",
    "Volume trend: 156,000",
    "Platform algorithm changes favoring AI content",
    "Increasing enterprise AI adoption",
  ],
  recommendations: [
    "Capitalize on upward trend immediately",
    "Create educational content about AI marketing tools",
    "Partner with AI tool providers for content collaboration",
    "Focus on LinkedIn for maximum professional reach",
  ],
};

const historicalData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
  overallScore: 75 + Math.random() * 20 + (i * 0.5),
  viralityScore: 70 + Math.random() * 25,
  relevanceScore: 80 + Math.random() * 15,
  opportunityScore: 75 + Math.random() * 20,
  volume: 120000 + Math.random() * 50000,
  growth: -5 + Math.random() * 30,
  momentum: Math.random() * 2 - 1,
}));

interface TrendDashboardProps {
  darkMode?: boolean;
  className?: string;
}

export function TrendDashboard({ darkMode = false, className = "" }: TrendDashboardProps) {
  // State management
  const [trends, setTrends] = useState(mockTrends);
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [regionFilter, setRegionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("overallScore");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);

  // Polling for real-time updates (every 60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh(true); // Silent refresh
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Filter and sort trends
  const filteredTrends = useMemo(() => {
    let filtered = trends.filter((trend) => {
      const matchesSearch = trend.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           trend.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           trend.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPlatform = platformFilter === "ALL" || trend.platform === platformFilter;
      const matchesRegion = regionFilter === "all" || trend.region === regionFilter;

      return matchesSearch && matchesPlatform && matchesRegion;
    });

    // Sort trends
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "overallScore":
          return b.overallScore - a.overallScore;
        case "viralityScore":
          return b.viralityScore - a.viralityScore;
        case "growth":
          return (b.growth || 0) - (a.growth || 0);
        case "detectedAt":
          return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [trends, searchQuery, platformFilter, regionFilter, sortBy]);

  // Get analytics summary
  const analytics = useMemo(() => {
    const totalTrends = trends.length;
    const activeTrends = trends.filter(t => t.status === "active").length;
    const avgScore = trends.reduce((sum, t) => sum + t.overallScore, 0) / trends.length;
    const highGrowthTrends = trends.filter(t => (t.growth || 0) > 15).length;
    
    return {
      totalTrends,
      activeTrends,
      avgScore: avgScore.toFixed(1),
      highGrowthTrends,
    };
  }, [trends]);

  // Get top 3 trends for sidebar widget
  const topTrends = useMemo(() => {
    return trends
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 3);
  }, [trends]);

  const handleRefresh = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In real implementation, this would fetch from tRPC
    // const newTrends = await trpc.trends.getTrends.query({...});
    
    setLastUpdated(new Date());
    if (!silent) setIsRefreshing(false);
  };

  const handleUseTrend = (trendId: string) => {
    // In real implementation, this would integrate with content agent
    const trend = trends.find(t => t.id === trendId);
    if (trend) {
      // Navigate to content creation with trend context
      console.log("Using trend for content creation:", trend);
      // Could trigger a modal or navigate to content agent with pre-filled data
    }
  };

  const handleAnalyzeTrends = async () => {
    // In real implementation, this would call the TrendAgent
    // const result = await trpc.trends.analyzeTrends.mutate({
    //   keywords: ["AI", "marketing", "automation"],
    //   platforms: ["LINKEDIN", "TWITTER"],
    //   region: "global",
    // });
    console.log("Analyzing new trends...");
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Real-Time Trend Dashboard
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Monitor trending topics across platforms • Last updated {lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRefresh()}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          
          <Button
            onClick={handleAnalyzeTrends}
            size="sm"
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Analyze New Trends
          </Button>
        </div>
      </div>

      {/* Top 3 Trends Widget */}
      <Card className={`${darkMode ? "bg-gray-900/50 border-gray-700" : "bg-white"} backdrop-blur-xl`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-lg flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
            <Zap className="w-5 h-5 text-yellow-500" />
            Top 3 Trends Now
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topTrends.map((trend, index) => (
              <motion.div
                key={trend.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border cursor-pointer hover:border-blue-400 transition-colors ${
                  darkMode ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"
                }`}
                onClick={() => setSelectedTrend(trend.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <div className={`text-lg font-bold ${
                    trend.overallScore >= 80 ? "text-emerald-400" : "text-yellow-400"
                  }`}>
                    {trend.overallScore.toFixed(0)}
                  </div>
                </div>
                <h4 className={`font-medium text-sm mb-1 ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {trend.title || trend.keyword}
                </h4>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} line-clamp-2`}>
                  {trend.platform.toLowerCase()} • {trend.growth && `+${trend.growth.toFixed(1)}%`}
                </p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`${darkMode ? "bg-gray-900/50 border-gray-700" : "bg-white"} backdrop-blur-xl`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
              <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Trends</span>
            </div>
            <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              {analytics.totalTrends}
            </div>
          </CardContent>
        </Card>

        <Card className={`${darkMode ? "bg-gray-900/50 border-gray-700" : "bg-white"} backdrop-blur-xl`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
              <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Active</span>
            </div>
            <div className={`text-2xl font-bold text-emerald-400`}>
              {analytics.activeTrends}
            </div>
          </CardContent>
        </Card>

        <Card className={`${darkMode ? "bg-gray-900/50 border-gray-700" : "bg-white"} backdrop-blur-xl`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
              <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Avg Score</span>
            </div>
            <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              {analytics.avgScore}
            </div>
          </CardContent>
        </Card>

        <Card className={`${darkMode ? "bg-gray-900/50 border-gray-700" : "bg-white"} backdrop-blur-xl`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
              <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>High Growth</span>
            </div>
            <div className={`text-2xl font-bold text-emerald-400`}>
              {analytics.highGrowthTrends}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className={`${darkMode ? "bg-gray-900/50 border-gray-700" : "bg-white"} backdrop-blur-xl`}>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                <Input
                  placeholder="Search trends, keywords, or platforms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Platforms</SelectItem>
                  <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                  <SelectItem value="TIKTOK">TikTok</SelectItem>
                  <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                  <SelectItem value="TWITTER">Twitter</SelectItem>
                  <SelectItem value="YOUTUBE">YouTube</SelectItem>
                  <SelectItem value="PINTEREST">Pinterest</SelectItem>
                  <SelectItem value="GOOGLE">Google</SelectItem>
                </SelectContent>
              </Select>

              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="UAE">UAE</SelectItem>
                  <SelectItem value="USA">USA</SelectItem>
                  <SelectItem value="Europe">Europe</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overallScore">Overall Score</SelectItem>
                  <SelectItem value="viralityScore">Virality</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="detectedAt">Recent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={selectedTrend ? "forecast" : "trends"} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger 
            value="trends" 
            onClick={() => setSelectedTrend(null)}
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Trend List ({filteredTrends.length})
          </TabsTrigger>
          <TabsTrigger 
            value="forecast" 
            disabled={!selectedTrend}
            className="gap-2"
          >
            <Activity className="w-4 h-4" />
            Forecast {selectedTrend && `(${trends.find(t => t.id === selectedTrend)?.keyword})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          {/* Trends Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredTrends.map((trend, index) => (
                <motion.div
                  key={trend.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TrendCard
                    trend={trend}
                    darkMode={darkMode}
                    onClick={() => setSelectedTrend(trend.id)}
                    isSelected={selectedTrend === trend.id}
                    onUseTrend={() => handleUseTrend(trend.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredTrends.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-center py-12 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No trends found matching your criteria.</p>
              <p className="text-sm mt-2">Try adjusting your search or filters.</p>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="forecast">
          {selectedTrend && (
            <TrendForecast
              forecast={mockForecast}
              historicalData={historicalData}
              trend={trends.find(t => t.id === selectedTrend)!}
              darkMode={darkMode}
              onViewDetails={() => console.log("View detailed analytics")}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 