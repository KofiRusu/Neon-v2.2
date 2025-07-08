import { api } from "../utils/trpc";
import { useMemo } from "react";

interface AgentMetricsData {
  totalAgents: number;
  activeAgents: number;
  averagePerformance: number;
  totalExecutions: number;
  successRate: number;
  errorRate: number;
  averageResponseTime: number;
  topPerformingAgents: Array<{
    name: string;
    type: string;
    performance: number;
    color: string;
  }>;
}

export function useAgentMetrics(timeRange: string = "24h") {
  const { data: agentMetadata, isLoading: isMetadataLoading } =
    api.agent.getMetadata.useQuery();

  const { data: agentHealth, isLoading: isHealthLoading } =
    api.agent.getHealth.useQuery();

  const { data: agentPerformance, isLoading: isPerformanceLoading } =
    api.agent.getPerformance.useQuery({ timeRange });

  const metrics = useMemo((): AgentMetricsData => {
    if (
      !agentMetadata?.success ||
      !agentHealth?.success ||
      !agentPerformance?.success
    ) {
      return {
        totalAgents: 0,
        activeAgents: 0,
        averagePerformance: 0,
        totalExecutions: 0,
        successRate: 0,
        errorRate: 0,
        averageResponseTime: 0,
        topPerformingAgents: [],
      };
    }

    const metadata = agentMetadata.data;
    const health = agentHealth.data;
    const performance = agentPerformance.data;

    const totalAgents = metadata.length;
    const activeAgents = metadata.filter(
      (agent) => agent.status === "active",
    ).length;
    const totalExecutions = metadata.reduce(
      (sum, agent) => sum + agent.totalExecutions,
      0,
    );
    const averageResponseTime =
      metadata.reduce((sum, agent) => sum + agent.averageExecutionTime, 0) /
      totalAgents;

    const topPerformingAgents = metadata
      .map((agent) => ({
        name: agent.name,
        type: agent.type,
        performance:
          health.find((h) => h.agentId === agent.id)?.successRate || 0,
        color: getAgentColor(agent.type),
      }))
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 4);

    return {
      totalAgents,
      activeAgents,
      averagePerformance: performance.successRate,
      totalExecutions,
      successRate: performance.successRate,
      errorRate: performance.errorRate || 0,
      averageResponseTime,
      topPerformingAgents,
    };
  }, [agentMetadata, agentHealth, agentPerformance]);

  const isLoading =
    isMetadataLoading || isHealthLoading || isPerformanceLoading;

  return {
    metrics,
    isLoading,
    error: null,
  };
}

function getAgentColor(agentType: string): string {
  const colorMap: Record<string, string> = {
    CONTENT: "text-blue-400",
    AD: "text-purple-400",
    TREND: "text-green-400",
    SEO: "text-pink-400",
    SOCIAL: "text-yellow-400",
    EMAIL: "text-indigo-400",
    SUPPORT: "text-red-400",
    BRAND_VOICE: "text-orange-400",
  };
  return colorMap[agentType] || "text-gray-400";
}
