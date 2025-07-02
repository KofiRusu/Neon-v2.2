"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  MessageCircle,
  Activity,
  User,
  Calendar,
  Search,
  Filter,
  Eye,
  BarChart3,
  Play,
} from "lucide-react";
import { formatDistance } from "date-fns";
import Link from "next/link";
import { trpc } from "@/utils/trpc";

interface SessionFilters {
  status?: "ACTIVE" | "COMPLETED" | "ABANDONED" | "ERROR" | "ARCHIVED";
  sortBy: "startedAt" | "lastActivity" | "duration" | "totalMessages";
  sortOrder: "asc" | "desc";
  searchQuery: string;
}

export default function SessionsPage() {
  const [filters, setFilters] = useState<SessionFilters>({
    sortBy: "lastActivity",
    sortOrder: "desc",
    searchQuery: "",
  });
  const [page, setPage] = useState(0);
  const limit = 20;

  const {
    data: sessionsData,
    isLoading,
    error,
  } = trpc.copilot.getSessions.useQuery({
    status: filters.status,
    limit,
    offset: page * limit,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const { data: analytics } = trpc.copilot.getSessionAnalytics.useQuery({
    period: "weekly",
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ABANDONED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ERROR":
        return "bg-red-100 text-red-800 border-red-200";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const filteredSessions =
    sessionsData?.sessions?.filter(
      (session) =>
        !filters.searchQuery ||
        session.title
          ?.toLowerCase()
          .includes(filters.searchQuery.toLowerCase()) ||
        session.sessionId
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase()),
    ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Copilot Sessions
              </h1>
              <p className="text-gray-600 mt-1">
                Analyze and replay your AI assistant interactions
              </p>
            </div>
            <Link href="/copilot">
              <Button variant="outline" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                New Session
              </Button>
            </Link>
          </div>

          {/* Analytics Overview */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.totalSessions}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.activeSessions} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Avg. Session Length
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatDuration(analytics.averageSessionLength)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.totalMessages} total messages
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {(analytics.successRate * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Avg. confidence:{" "}
                    {(analytics.averageConfidence * 100).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Commands
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {analytics.commandExecutions}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.autonomousMessages} autonomous
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search sessions..."
                    value={filters.searchQuery}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        searchQuery: e.target.value,
                      }))
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: value === "all" ? undefined : (value as any),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="ABANDONED">Abandoned</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Sort By
                </label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, sortBy: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastActivity">Last Activity</SelectItem>
                    <SelectItem value="startedAt">Started Date</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                    <SelectItem value="totalMessages">Message Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Order
                </label>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, sortOrder: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : error ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-red-600">
                  Failed to load sessions: {error.message}
                </p>
              </CardContent>
            </Card>
          ) : filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No sessions found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {filters.searchQuery || filters.status
                    ? "Try adjusting your filters"
                    : "Start a new conversation to see sessions here"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSessions.map((session) => (
              <Card
                key={session.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <MessageCircle className="h-6 w-6 text-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {session.title ||
                              `Session ${session.sessionId.slice(-8)}`}
                          </h3>
                          <Badge className={getStatusColor(session.status)}>
                            {session.status.toLowerCase()}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDistance(
                              new Date(session.startedAt),
                              new Date(),
                              { addSuffix: true },
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDuration(session.duration)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {session.totalMessages} messages
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="h-4 w-4" />
                            {formatDistance(
                              new Date(session.lastActivity),
                              new Date(),
                              { addSuffix: true },
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/copilot/sessions/${session.sessionId}/analytics`}
                      >
                        <Button variant="outline" size="sm">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Analytics
                        </Button>
                      </Link>
                      <Link
                        href={`/copilot/sessions/${session.sessionId}/replay`}
                      >
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4 mr-1" />
                          Replay
                        </Button>
                      </Link>
                      <Link href={`/copilot/sessions/${session.sessionId}`}>
                        <Button size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {sessionsData && sessionsData.hasMore && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={() => setPage((prev) => prev + 1)}
              variant="outline"
            >
              Load More Sessions
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
