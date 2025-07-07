"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  MagnifyingGlassIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  LinkIcon,
  TagIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { useHistoricalSEOAnalyses, type HistoricalSEOAnalysis } from "../../hooks/useSEO";

interface SEOBulkResultsProps {
  campaignId: string;
  className?: string;
}

type SortField = "createdAt" | "score" | "url";
type SortOrder = "asc" | "desc";

export default function SEOBulkResults({ campaignId, className }: SEOBulkResultsProps) {
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterScore, setFilterScore] = useState<"all" | "excellent" | "good" | "poor">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState<HistoricalSEOAnalysis | null>(null);

  // Fetch historical data
  const { data: analyses, isLoading, error, refetch } = useHistoricalSEOAnalyses(campaignId, 50);

  // Filter and sort analyses
  const filteredAndSortedAnalyses = useMemo(() => {
    if (!analyses?.success || !analyses.data) return [];

    let filtered = analyses.data;

    // Apply score filter
    if (filterScore !== "all") {
      filtered = filtered.filter((analysis) => {
        const score = analysis.score;
        switch (filterScore) {
          case "excellent":
            return score >= 80;
          case "good":
            return score >= 60 && score < 80;
          case "poor":
            return score < 60;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((analysis) =>
        analysis.pageUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
        analysis.seoEntry?.url.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "score":
          aValue = a.score;
          bValue = b.score;
          break;
        case "url":
          aValue = a.pageUrl.toLowerCase();
          bValue = b.pageUrl.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [analyses, filterScore, searchQuery, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
    if (score >= 60) return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
    return <XCircleIcon className="h-5 w-5 text-red-400" />;
  };

  const getStatusBadge = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? 
      <ArrowUpIcon className="h-4 w-4 ml-1" /> : 
      <ArrowDownIcon className="h-4 w-4 ml-1" />;
  };

  if (isLoading) {
    return (
      <div className={`glass-strong p-6 rounded-2xl ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
          <span className="ml-3 text-primary">Loading SEO analyses...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`glass-strong p-6 rounded-2xl ${className}`}>
        <div className="text-center py-12">
          <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">Failed to Load SEO Data</h3>
          <p className="text-secondary mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="btn-neon text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-strong p-6 rounded-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-neon-blue rounded-xl flex items-center justify-center">
            <ChartBarIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">SEO Analysis History</h2>
            <p className="text-secondary text-sm">
              {filteredAndSortedAnalyses.length} of {analyses?.data?.length || 0} analyses
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-neon-purple text-sm"
        >
          Refresh Data
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary" />
            <input
              type="text"
              placeholder="Search by URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-neon-blue"
            />
          </div>
        </div>

        {/* Score Filter */}
        <select
          value={filterScore}
          onChange={(e) => setFilterScore(e.target.value as typeof filterScore)}
          className="px-4 py-2 bg-surface border border-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-neon-blue"
        >
          <option value="all">All Scores</option>
          <option value="excellent">Excellent (80+)</option>
          <option value="good">Good (60-79)</option>
          <option value="poor">Poor (&lt;60)</option>
        </select>
      </div>

      {/* Results Table */}
      {filteredAndSortedAnalyses.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("url")}
                  >
                    <div className="flex items-center">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      URL
                      <SortIcon field="url" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("score")}
                  >
                    <div className="flex items-center">
                      <ChartBarIcon className="h-4 w-4 mr-2" />
                      SEO Score
                      <SortIcon field="score" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    <div className="flex items-center">
                      <TagIcon className="h-4 w-4 mr-2" />
                      Keywords
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Issues
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Date
                      <SortIcon field="createdAt" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-dark divide-y divide-border">
                {filteredAndSortedAnalyses.map((analysis) => (
                  <tr key={analysis.id} className="hover:bg-surface transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-primary truncate max-w-xs">
                            {analysis.pageUrl}
                          </div>
                          {analysis.seoEntry?.metadata && typeof analysis.seoEntry.metadata === 'object' && 
                           'title' in analysis.seoEntry.metadata && (
                            <div className="text-xs text-secondary truncate max-w-xs">
                              {analysis.seoEntry.metadata.title as string}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getScoreIcon(analysis.score)}
                        <span className={`ml-2 text-sm font-semibold ${getScoreColor(analysis.score)}`}>
                          {analysis.score}
                        </span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusBadge(analysis.score)}`}>
                          {analysis.score >= 80 ? "Excellent" : analysis.score >= 60 ? "Good" : "Poor"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-primary">
                        {Array.isArray(analysis.keywords) ? (
                          <div className="flex flex-wrap gap-1">
                            {analysis.keywords.slice(0, 3).map((keyword: any, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-neon-blue/20 text-neon-blue text-xs rounded-full"
                              >
                                {typeof keyword === 'object' && keyword.keyword ? keyword.keyword : keyword}
                              </span>
                            ))}
                            {analysis.keywords.length > 3 && (
                              <span className="px-2 py-1 bg-surface text-secondary text-xs rounded-full">
                                +{analysis.keywords.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-secondary text-xs">No keywords</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-primary">
                        {Array.isArray(analysis.issues) && analysis.issues.length > 0 ? (
                          <div className="flex items-center">
                            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="text-xs">{analysis.issues.length} issues</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <CheckCircleIcon className="h-4 w-4 text-green-400 mr-1" />
                            <span className="text-xs">No issues</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                      {format(new Date(analysis.createdAt), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedAnalysis(analysis)}
                        className="text-neon-blue hover:text-neon-purple transition-colors flex items-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <ChartBarIcon className="h-12 w-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No SEO Analyses Found</h3>
          <p className="text-secondary">
            {searchQuery || filterScore !== "all" 
              ? "Try adjusting your filters to see more results."
              : "Start by analyzing some URLs to see historical data here."
            }
          </p>
        </div>
      )}

      {/* Analysis Detail Modal */}
      {selectedAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-primary">SEO Analysis Details</h3>
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="text-secondary hover:text-primary"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h4 className="font-semibold text-primary mb-2">Page Information</h4>
                  <div className="bg-surface p-4 rounded-lg">
                    <p className="text-sm"><span className="font-medium">URL:</span> {selectedAnalysis.pageUrl}</p>
                    <p className="text-sm"><span className="font-medium">Score:</span> 
                      <span className={`ml-1 font-bold ${getScoreColor(selectedAnalysis.score)}`}>
                        {selectedAnalysis.score}/100
                      </span>
                    </p>
                    <p className="text-sm"><span className="font-medium">Analyzed:</span> {format(new Date(selectedAnalysis.createdAt), "PPpp")}</p>
                  </div>
                </div>

                {/* Keywords */}
                {Array.isArray(selectedAnalysis.keywords) && selectedAnalysis.keywords.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-primary mb-2">Keywords</h4>
                    <div className="bg-surface p-4 rounded-lg">
                      <div className="flex flex-wrap gap-2">
                        {selectedAnalysis.keywords.map((keyword: any, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-neon-blue/20 text-neon-blue text-sm rounded-full"
                          >
                            {typeof keyword === 'object' && keyword.keyword ? keyword.keyword : keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Issues */}
                {Array.isArray(selectedAnalysis.issues) && selectedAnalysis.issues.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-primary mb-2">Issues & Recommendations</h4>
                    <div className="bg-surface p-4 rounded-lg space-y-3">
                      {selectedAnalysis.issues.map((issue: any, index: number) => (
                        <div key={index} className="border-l-4 border-yellow-400 pl-4">
                          <p className="font-medium text-primary">{issue.type || "SEO Issue"}</p>
                          <p className="text-sm text-secondary">{issue.message || JSON.stringify(issue)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 