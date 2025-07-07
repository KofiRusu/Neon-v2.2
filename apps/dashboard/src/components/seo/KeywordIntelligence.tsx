"use client";

import { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import {
  TagIcon,
  ClipboardIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  FireIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { useKeywordSuggestions, type KeywordSuggestion } from "../../hooks/useSEO";
import { toast } from "react-hot-toast";

interface KeywordIntelligenceProps {
  campaignId: string;
  className?: string;
}

type SortField = "keyword" | "relevance" | "difficulty" | "opportunity" | "createdAt";
type SortOrder = "asc" | "desc";

export default function KeywordIntelligence({ campaignId, className }: KeywordIntelligenceProps) {
  const [sortField, setSortField] = useState<SortField>("relevance");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [intentFilter, setIntentFilter] = useState<"all" | "commercial" | "informational" | "navigational" | "transactional">("all");
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

  // Fetch keyword suggestions
  const { data: keywords, isLoading, error, refetch } = useKeywordSuggestions(campaignId, 100);

  // Filter and sort keywords
  const filteredAndSortedKeywords = useMemo(() => {
    if (!keywords?.success || !keywords.data) return [];

    let filtered = keywords.data;

    // Apply intent filter
    if (intentFilter !== "all") {
      filtered = filtered.filter((keyword) => keyword.intent === intentFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((keyword) =>
        keyword.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
        keyword.reason?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case "keyword":
          aValue = a.keyword.toLowerCase();
          bValue = b.keyword.toLowerCase();
          break;
        case "relevance":
          aValue = a.relevance || 0;
          bValue = b.relevance || 0;
          break;
        case "difficulty":
          aValue = a.difficulty || 0;
          bValue = b.difficulty || 0;
          break;
        case "opportunity":
          aValue = a.opportunity || 0;
          bValue = b.opportunity || 0;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [keywords, intentFilter, searchQuery, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKeyword(label);
      toast.success(`"${text}" copied to clipboard!`);
      setTimeout(() => setCopiedKeyword(null), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  }, []);

  const copyAllKeywords = useCallback(async () => {
    const keywordList = filteredAndSortedKeywords.map(k => k.keyword).join(", ");
    try {
      await navigator.clipboard.writeText(keywordList);
      toast.success(`${filteredAndSortedKeywords.length} keywords copied to clipboard!`);
    } catch (err) {
      toast.error("Failed to copy keywords");
    }
  }, [filteredAndSortedKeywords]);

  const exportToCSV = useCallback(() => {
    if (filteredAndSortedKeywords.length === 0) {
      toast.error("No keywords to export");
      return;
    }

    const headers = [
      "Keyword",
      "Relevance",
      "Difficulty", 
      "Opportunity",
      "Search Volume",
      "Intent",
      "Reason",
      "Date Added"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredAndSortedKeywords.map(keyword => [
        `"${keyword.keyword}"`,
        keyword.relevance || "",
        keyword.difficulty || "",
        keyword.opportunity || "",
        keyword.searchVolume || "",
        keyword.intent || "",
        `"${keyword.reason || ""}"`,
        format(new Date(keyword.createdAt), "yyyy-MM-dd")
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `seo-keywords-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredAndSortedKeywords.length} keywords to CSV!`);
  }, [filteredAndSortedKeywords]);

  const getIntentIcon = (intent?: string) => {
    switch (intent) {
      case "commercial":
        return <FireIcon className="h-4 w-4 text-green-400" />;
      case "transactional":
        return <StarIcon className="h-4 w-4 text-blue-400" />;
      case "navigational":
        return <ArrowTrendingUpIcon className="h-4 w-4 text-purple-400" />;
      case "informational":
        return <SparklesIcon className="h-4 w-4 text-yellow-400" />;
      default:
        return <TagIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getIntentColor = (intent?: string) => {
    switch (intent) {
      case "commercial":
        return "bg-green-100 text-green-800";
      case "transactional":
        return "bg-blue-100 text-blue-800";
      case "navigational":
        return "bg-purple-100 text-purple-800";
      case "informational":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return "text-gray-400";
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getOpportunityBadge = (opportunity?: number) => {
    if (!opportunity) return null;
    if (opportunity >= 80) return "High";
    if (opportunity >= 60) return "Medium";
    return "Low";
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
          <span className="ml-3 text-primary">Loading keyword intelligence...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`glass-strong p-6 rounded-2xl ${className}`}>
        <div className="text-center py-12">
          <TagIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">Failed to Load Keywords</h3>
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
          <div className="w-10 h-10 bg-neon-green rounded-xl flex items-center justify-center">
            <TagIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">Keyword Intelligence</h2>
            <p className="text-secondary text-sm">
              {filteredAndSortedKeywords.length} of {keywords?.data?.length || 0} keywords
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={copyAllKeywords}
            disabled={filteredAndSortedKeywords.length === 0}
            className="btn-neon-green text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ClipboardIcon className="h-4 w-4 mr-2" />
            Copy All
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredAndSortedKeywords.length === 0}
            className="btn-neon-purple text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary" />
            <input
              type="text"
              placeholder="Search keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-neon-blue"
            />
          </div>
        </div>

        {/* Intent Filter */}
        <select
          value={intentFilter}
          onChange={(e) => setIntentFilter(e.target.value as typeof intentFilter)}
          className="px-4 py-2 bg-surface border border-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-neon-blue"
        >
          <option value="all">All Intents</option>
          <option value="commercial">Commercial</option>
          <option value="transactional">Transactional</option>
          <option value="informational">Informational</option>
          <option value="navigational">Navigational</option>
        </select>
      </div>

      {/* Keywords Table */}
      {filteredAndSortedKeywords.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("keyword")}
                  >
                    <div className="flex items-center">
                      <TagIcon className="h-4 w-4 mr-2" />
                      Keyword
                      <SortIcon field="keyword" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("relevance")}
                  >
                    <div className="flex items-center">
                      Relevance
                      <SortIcon field="relevance" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("difficulty")}
                  >
                    <div className="flex items-center">
                      Difficulty
                      <SortIcon field="difficulty" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("opportunity")}
                  >
                    <div className="flex items-center">
                      Opportunity
                      <SortIcon field="opportunity" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Intent
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center">
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
                {filteredAndSortedKeywords.map((keyword) => (
                  <tr key={keyword.id} className="hover:bg-surface transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-primary">{keyword.keyword}</div>
                          {keyword.reason && (
                            <div className="text-xs text-secondary mt-1 max-w-xs truncate">
                              {keyword.reason}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => copyToClipboard(keyword.keyword, keyword.keyword)}
                          className="ml-2 p-1 text-secondary hover:text-neon-blue transition-colors"
                          title="Copy keyword"
                        >
                          {copiedKeyword === keyword.keyword ? (
                            <ClipboardDocumentCheckIcon className="h-4 w-4 text-green-400" />
                          ) : (
                            <ClipboardIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-semibold ${getScoreColor(keyword.relevance)}`}>
                          {keyword.relevance ? `${keyword.relevance}%` : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-semibold ${getScoreColor(100 - (keyword.difficulty || 0))}`}>
                          {keyword.difficulty ? `${keyword.difficulty}%` : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-semibold ${getScoreColor(keyword.opportunity)}`}>
                          {keyword.opportunity ? `${keyword.opportunity}%` : "—"}
                        </span>
                        {getOpportunityBadge(keyword.opportunity) && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            getOpportunityBadge(keyword.opportunity) === "High" 
                              ? "bg-green-100 text-green-800"
                              : getOpportunityBadge(keyword.opportunity) === "Medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {getOpportunityBadge(keyword.opportunity)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                      {keyword.searchVolume ? (
                        <span className="capitalize">{keyword.searchVolume}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {keyword.intent ? (
                        <div className="flex items-center space-x-2">
                          {getIntentIcon(keyword.intent)}
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${getIntentColor(keyword.intent)}`}>
                            {keyword.intent}
                          </span>
                        </div>
                      ) : (
                        <span className="text-secondary text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                      {format(new Date(keyword.createdAt), "MMM dd")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => copyToClipboard(keyword.keyword, `copy-${keyword.id}`)}
                        className="text-neon-blue hover:text-neon-purple transition-colors"
                      >
                        {copiedKeyword === `copy-${keyword.id}` ? (
                          <ClipboardDocumentCheckIcon className="h-4 w-4" />
                        ) : (
                          <ClipboardIcon className="h-4 w-4" />
                        )}
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
          <TagIcon className="h-12 w-12 text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No Keywords Found</h3>
          <p className="text-secondary">
            {searchQuery || intentFilter !== "all" 
              ? "Try adjusting your filters to see more keywords."
              : "Start analyzing content to build your keyword intelligence database."
            }
          </p>
        </div>
      )}

      {/* Stats Summary */}
      {filteredAndSortedKeywords.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface/30 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-primary">
              {filteredAndSortedKeywords.filter(k => (k.relevance || 0) >= 80).length}
            </div>
            <div className="text-xs text-secondary">High Relevance</div>
          </div>
          <div className="bg-surface/30 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-primary">
              {filteredAndSortedKeywords.filter(k => (k.difficulty || 0) <= 40).length}
            </div>
            <div className="text-xs text-secondary">Low Competition</div>
          </div>
          <div className="bg-surface/30 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-primary">
              {filteredAndSortedKeywords.filter(k => k.intent === "commercial").length}
            </div>
            <div className="text-xs text-secondary">Commercial Intent</div>
          </div>
          <div className="bg-surface/30 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-primary">
              {filteredAndSortedKeywords.filter(k => (k.opportunity || 0) >= 70).length}
            </div>
            <div className="text-xs text-secondary">High Opportunity</div>
          </div>
        </div>
      )}
    </div>
  );
} 