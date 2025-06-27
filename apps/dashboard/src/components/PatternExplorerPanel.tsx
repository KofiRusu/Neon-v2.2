'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Brain,
  TrendingUp,
  Copy,
  Users,
  Calendar,
  BarChart3,
  Zap,
  Target,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react';

interface Pattern {
  id: string;
  summary: string;
  patternScore: number;
  winningVariants: {
    contentStyles: string[];
    subjects: string[];
    ctaTypes: string[];
    timingWindows: string[];
    agentSequences: string[];
  };
  segments: {
    demographics: Record<string, any>;
    behavioral: Record<string, any>;
    performance: Record<string, number>;
  };
  createdAt: string;
  updatedAt: string;
}

interface VariantStructure {
  type: 'subject' | 'copy' | 'visual' | 'cta' | 'timing';
  structure: string;
  performanceScore: number;
  usageCount: number;
  segments: string[];
}

interface PatternExplorerPanelProps {
  patterns: Pattern[];
  trendingPatterns: Pattern[];
  variantStructures: VariantStructure[];
  refreshKey: number;
}

export function PatternExplorerPanel({
  patterns,
  trendingPatterns,
  variantStructures,
  refreshKey,
}: PatternExplorerPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'high-score' | 'trending' | 'recent'
  >('all');
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  // Filter and search patterns
  const filteredPatterns = useMemo(() => {
    let filtered = patterns;

    // Apply filter
    switch (selectedFilter) {
      case 'high-score':
        filtered = patterns.filter(p => p.patternScore >= 85);
        break;
      case 'trending':
        filtered = trendingPatterns;
        break;
      case 'recent':
        filtered = patterns.filter(p => {
          const createdAt = new Date(p.createdAt);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return createdAt > weekAgo;
        });
        break;
      default:
        filtered = patterns;
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        p =>
          p.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.winningVariants.contentStyles.some(style =>
            style.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          p.winningVariants.agentSequences.some(seq =>
            seq.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    return filtered.sort((a, b) => b.patternScore - a.patternScore);
  }, [patterns, trendingPatterns, searchTerm, selectedFilter]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    if (score >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-500/20 text-green-400 border-green-400';
    if (score >= 80) return 'bg-yellow-500/20 text-yellow-400 border-yellow-400';
    if (score >= 70) return 'bg-orange-500/20 text-orange-400 border-orange-400';
    return 'bg-red-500/20 text-red-400 border-red-400';
  };

  const copyPatternId = (id: string) => {
    navigator.clipboard.writeText(id);
    // You could add a toast notification here
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Pattern Explorer</h2>
          <p className="text-slate-400">
            Discover and analyze successful campaign patterns from {patterns.length} campaigns
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search patterns..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 w-64"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedFilter}
              onChange={e => setSelectedFilter(e.target.value as any)}
              className="bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-white text-sm"
            >
              <option value="all">All Patterns</option>
              <option value="high-score">High Score (85+)</option>
              <option value="trending">Trending</option>
              <option value="recent">Recent (7 days)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Summary */}
      <div className="flex items-center gap-4 text-sm text-slate-400">
        <span>Showing {filteredPatterns.length} patterns</span>
        {selectedFilter !== 'all' && (
          <Badge variant="outline" className="text-neon-blue border-neon-blue">
            {selectedFilter === 'high-score' && 'High Score'}
            {selectedFilter === 'trending' && 'Trending'}
            {selectedFilter === 'recent' && 'Recent'}
          </Badge>
        )}
      </div>

      {/* Patterns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPatterns.map(pattern => (
          <Card
            key={pattern.id}
            className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:border-neon-blue/50 transition-all duration-300"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-white text-lg leading-tight mb-2">
                    {pattern.summary}
                  </CardTitle>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(pattern.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Brain className="w-4 h-4" />
                      ID: {pattern.id.slice(-8)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className={getScoreBadgeColor(pattern.patternScore)}>
                    {pattern.patternScore}/100
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyPatternId(pattern.id)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 p-3 bg-slate-700/30 rounded-lg">
                <div className="text-center">
                  <div className="text-neon-blue font-bold">
                    {pattern.winningVariants.agentSequences.length}
                  </div>
                  <div className="text-xs text-slate-400">Sequences</div>
                </div>
                <div className="text-center">
                  <div className="text-neon-purple font-bold">
                    {pattern.winningVariants.contentStyles.length}
                  </div>
                  <div className="text-xs text-slate-400">Styles</div>
                </div>
                <div className="text-center">
                  <div className="text-green-400 font-bold">
                    {Object.keys(pattern.segments.demographics || {}).length}
                  </div>
                  <div className="text-xs text-slate-400">Segments</div>
                </div>
              </div>

              {/* Winning Variants Preview */}
              <div className="space-y-3">
                {pattern.winningVariants.contentStyles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-neon-blue" />
                      Content Styles
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {pattern.winningVariants.contentStyles.slice(0, 3).map((style, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs text-slate-300 border-slate-600"
                        >
                          {style}
                        </Badge>
                      ))}
                      {pattern.winningVariants.contentStyles.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-xs text-slate-400 border-slate-600"
                        >
                          +{pattern.winningVariants.contentStyles.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {pattern.winningVariants.agentSequences.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-neon-purple" />
                      Agent Sequence
                    </h4>
                    <div className="bg-slate-700/30 rounded px-3 py-2 text-xs font-mono text-slate-300">
                      {pattern.winningVariants.agentSequences[0]?.replace(/-/g, ' → ') ||
                        'No sequence'}
                    </div>
                  </div>
                )}

                {pattern.segments.performance &&
                  Object.keys(pattern.segments.performance).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-green-400" />
                        Performance Metrics
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {Object.entries(pattern.segments.performance)
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <div key={key} className="bg-slate-700/30 rounded p-2 text-center">
                              <div className="font-bold text-white">
                                {typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value}
                              </div>
                              <div className="text-slate-400 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Expand/Collapse Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setExpandedPattern(expandedPattern === pattern.id ? null : pattern.id)
                }
                className="w-full text-slate-400 hover:text-white hover:bg-slate-700/50"
              >
                {expandedPattern === pattern.id ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show Details
                  </>
                )}
              </Button>

              {/* Expanded Details */}
              {expandedPattern === pattern.id && (
                <div className="border-t border-slate-700/50 pt-4 space-y-4">
                  {/* All Winning Variants */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-white mb-2">Subject Lines</h5>
                      <div className="space-y-1">
                        {pattern.winningVariants.subjects.length > 0 ? (
                          pattern.winningVariants.subjects.map((subject, index) => (
                            <div
                              key={index}
                              className="text-sm text-slate-300 bg-slate-700/30 rounded px-2 py-1"
                            >
                              {subject}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-slate-400">No subject data</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-white mb-2">CTA Types</h5>
                      <div className="space-y-1">
                        {pattern.winningVariants.ctaTypes.length > 0 ? (
                          pattern.winningVariants.ctaTypes.map((cta, index) => (
                            <div
                              key={index}
                              className="text-sm text-slate-300 bg-slate-700/30 rounded px-2 py-1"
                            >
                              {cta}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-slate-400">No CTA data</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-white mb-2">Timing Windows</h5>
                      <div className="space-y-1">
                        {pattern.winningVariants.timingWindows.length > 0 ? (
                          pattern.winningVariants.timingWindows.map((timing, index) => (
                            <div
                              key={index}
                              className="text-sm text-slate-300 bg-slate-700/30 rounded px-2 py-1 flex items-center gap-2"
                            >
                              <Clock className="w-3 h-3 text-neon-blue" />
                              {timing}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-slate-400">No timing data</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-white mb-2">Segment Data</h5>
                      <div className="space-y-1">
                        {Object.entries(pattern.segments.demographics || {}).map(([key, value]) => (
                          <div
                            key={key}
                            className="text-sm text-slate-300 bg-slate-700/30 rounded px-2 py-1 flex items-center gap-2"
                          >
                            <Users className="w-3 h-3 text-neon-purple" />
                            {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-slate-700/50">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-neon-blue to-blue-600 hover:from-blue-600 hover:to-neon-blue"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Use as Template
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Clone Pattern
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredPatterns.length === 0 && (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardContent className="text-center py-12">
            <Brain className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No patterns found</h3>
            <p className="text-slate-400 mb-4">
              {searchTerm || selectedFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Run more campaigns to start generating patterns.'}
            </p>
            {(searchTerm || selectedFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedFilter('all');
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Variant Structures Summary */}
      {variantStructures.length > 0 && (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-neon-blue" />
              Top Performing Variant Structures
            </CardTitle>
            <CardDescription className="text-slate-400">
              Most successful content and timing patterns across all campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {variantStructures.slice(0, 6).map((structure, index) => (
                <div key={index} className="p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant="outline"
                      className="text-xs capitalize text-slate-300 border-slate-600"
                    >
                      {structure.type}
                    </Badge>
                    <span
                      className={`text-sm font-bold ${getScoreColor(structure.performanceScore)}`}
                    >
                      {structure.performanceScore.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm text-white font-medium mb-1">{structure.structure}</p>
                  <p className="text-xs text-slate-400">Used in {structure.usageCount} campaigns</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
