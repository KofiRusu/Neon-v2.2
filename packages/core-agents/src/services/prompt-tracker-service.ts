import { AgentMemoryStore } from "../memory/AgentMemoryStore";
import { logger } from "../logger";

export interface PromptTemplateLog {
  id: string;
  agentType: string;
  prompt: string;
  version: string;
  metadata: {
    tone: string;
    structure: string;
    keywords: string[];
    model: string;
    temperature: number;
    maxTokens: number;
  };
  usage: {
    count: number;
    totalTokens: number;
    totalCost: number;
    averageExecutionTime: number;
  };
  performance: {
    successRate: number;
    qualityScore: number;
    userSatisfaction: number;
    conversionRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptPerformanceMetrics {
  totalUses: number;
  averageTokens: number;
  averageCost: number;
  averageExecutionTime: number;
  successRate: number;
  qualityScore: number;
  userSatisfaction: number;
  conversionRate: number;
  lastUsed: Date;
  trending: boolean;
}

export interface PromptOptimizationSuggestion {
  originalPrompt: string;
  optimizedPrompt: string;
  reasoningCategory: "token_reduction" | "quality_improvement" | "cost_optimization" | "performance_enhancement";
  expectedImprovement: {
    tokenReduction: number;
    costSavings: number;
    qualityIncrease: number;
    performanceGain: number;
  };
  confidence: number;
  implementationComplexity: "low" | "medium" | "high";
  riskAssessment: "low" | "medium" | "high";
}

export class PromptTrackerService {
  private memoryStore: AgentMemoryStore;
  private promptLogs: Map<string, PromptTemplateLog> = new Map();
  private performanceCache: Map<string, PromptPerformanceMetrics> = new Map();

  constructor() {
    this.memoryStore = new AgentMemoryStore();
  }

  /**
   * Log prompt template usage with metadata
   */
  async logPromptTemplate(
    agentType: string,
    prompt: string,
    metadata: {
      tone: string;
      structure: string;
      keywords: string[];
      model?: string;
      temperature?: number;
      maxTokens?: number;
    },
    executionMetrics: {
      tokensUsed: number;
      cost: number;
      executionTime: number;
      success: boolean;
      qualityScore?: number;
      userSatisfaction?: number;
      conversionAchieved?: boolean;
    },
  ): Promise<void> {
    try {
      const promptId = this.generatePromptId(agentType, prompt);
      let promptLog = this.promptLogs.get(promptId);

      if (!promptLog) {
        // Create new prompt log
        promptLog = {
          id: promptId,
          agentType,
          prompt,
          version: "1.0",
          metadata: {
            tone: metadata.tone,
            structure: metadata.structure,
            keywords: metadata.keywords,
            model: metadata.model || "gpt-4",
            temperature: metadata.temperature || 0.7,
            maxTokens: metadata.maxTokens || 1000,
          },
          usage: {
            count: 0,
            totalTokens: 0,
            totalCost: 0,
            averageExecutionTime: 0,
          },
          performance: {
            successRate: 0,
            qualityScore: 0,
            userSatisfaction: 0,
            conversionRate: 0,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        this.promptLogs.set(promptId, promptLog);
      }

      // Update usage metrics
      promptLog.usage.count += 1;
      promptLog.usage.totalTokens += executionMetrics.tokensUsed;
      promptLog.usage.totalCost += executionMetrics.cost;
      promptLog.usage.averageExecutionTime = 
        (promptLog.usage.averageExecutionTime * (promptLog.usage.count - 1) + executionMetrics.executionTime) / promptLog.usage.count;

      // Update performance metrics
      const successCount = promptLog.performance.successRate * (promptLog.usage.count - 1) + (executionMetrics.success ? 1 : 0);
      promptLog.performance.successRate = successCount / promptLog.usage.count;

      if (executionMetrics.qualityScore !== undefined) {
        promptLog.performance.qualityScore = 
          (promptLog.performance.qualityScore * (promptLog.usage.count - 1) + executionMetrics.qualityScore) / promptLog.usage.count;
      }

      if (executionMetrics.userSatisfaction !== undefined) {
        promptLog.performance.userSatisfaction = 
          (promptLog.performance.userSatisfaction * (promptLog.usage.count - 1) + executionMetrics.userSatisfaction) / promptLog.usage.count;
      }

      if (executionMetrics.conversionAchieved !== undefined) {
        const conversionCount = promptLog.performance.conversionRate * (promptLog.usage.count - 1) + (executionMetrics.conversionAchieved ? 1 : 0);
        promptLog.performance.conversionRate = conversionCount / promptLog.usage.count;
      }

      promptLog.updatedAt = new Date();

      // Clear performance cache for this prompt
      this.performanceCache.delete(promptId);

      // Store in memory for persistence
      await this.memoryStore.storeMemory(
        "prompt-tracker",
        `prompt_log_${promptId}`,
        promptLog,
        {
          agentType,
          usage: promptLog.usage.count.toString(),
          performance: promptLog.performance.successRate.toString(),
        },
      );

      logger.info("Prompt template logged", { 
        promptId, 
        agentType, 
        usage: promptLog.usage.count,
        successRate: promptLog.performance.successRate 
      });

    } catch (error) {
      logger.error("Failed to log prompt template", { error, agentType });
    }
  }

  /**
   * Get performance metrics for a specific prompt
   */
  async getPromptPerformance(agentType: string, prompt: string): Promise<PromptPerformanceMetrics | null> {
    try {
      const promptId = this.generatePromptId(agentType, prompt);
      
      // Check cache first
      if (this.performanceCache.has(promptId)) {
        return this.performanceCache.get(promptId)!;
      }

      const promptLog = this.promptLogs.get(promptId);
      if (!promptLog) {
        return null;
      }

      const metrics: PromptPerformanceMetrics = {
        totalUses: promptLog.usage.count,
        averageTokens: promptLog.usage.totalTokens / promptLog.usage.count,
        averageCost: promptLog.usage.totalCost / promptLog.usage.count,
        averageExecutionTime: promptLog.usage.averageExecutionTime,
        successRate: promptLog.performance.successRate,
        qualityScore: promptLog.performance.qualityScore,
        userSatisfaction: promptLog.performance.userSatisfaction,
        conversionRate: promptLog.performance.conversionRate,
        lastUsed: promptLog.updatedAt,
        trending: this.isPromptTrending(promptLog),
      };

      // Cache the metrics
      this.performanceCache.set(promptId, metrics);

      return metrics;
    } catch (error) {
      logger.error("Failed to get prompt performance", { error, agentType });
      return null;
    }
  }

  /**
   * Get all prompt logs for an agent type
   */
  async getAgentPromptLogs(agentType: string): Promise<PromptTemplateLog[]> {
    try {
      const agentLogs = Array.from(this.promptLogs.values())
        .filter(log => log.agentType === agentType)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      return agentLogs;
    } catch (error) {
      logger.error("Failed to get agent prompt logs", { error, agentType });
      return [];
    }
  }

  /**
   * Get top performing prompts across all agents
   */
  async getTopPerformingPrompts(limit: number = 10): Promise<PromptTemplateLog[]> {
    try {
      const allLogs = Array.from(this.promptLogs.values())
        .filter(log => log.usage.count >= 5) // Minimum usage threshold
        .sort((a, b) => {
          // Combined score based on performance metrics
          const scoreA = this.calculateCombinedScore(a);
          const scoreB = this.calculateCombinedScore(b);
          return scoreB - scoreA;
        })
        .slice(0, limit);

      return allLogs;
    } catch (error) {
      logger.error("Failed to get top performing prompts", { error });
      return [];
    }
  }

  /**
   * Generate optimization suggestions for prompts
   */
  async generateOptimizationSuggestions(
    agentType: string,
    currentPrompt: string,
  ): Promise<PromptOptimizationSuggestion[]> {
    try {
      const promptId = this.generatePromptId(agentType, currentPrompt);
      const currentLog = this.promptLogs.get(promptId);

      if (!currentLog) {
        return [];
      }

      const suggestions: PromptOptimizationSuggestion[] = [];

      // Token reduction suggestions
      if (currentLog.usage.totalTokens / currentLog.usage.count > 800) {
        suggestions.push({
          originalPrompt: currentPrompt,
          optimizedPrompt: this.optimizeForTokenReduction(currentPrompt),
          reasoningCategory: "token_reduction",
          expectedImprovement: {
            tokenReduction: 25,
            costSavings: 20,
            qualityIncrease: 0,
            performanceGain: 10,
          },
          confidence: 0.85,
          implementationComplexity: "low",
          riskAssessment: "low",
        });
      }

      // Quality improvement suggestions
      if (currentLog.performance.qualityScore < 0.7) {
        suggestions.push({
          originalPrompt: currentPrompt,
          optimizedPrompt: this.optimizeForQuality(currentPrompt, currentLog.metadata),
          reasoningCategory: "quality_improvement",
          expectedImprovement: {
            tokenReduction: 0,
            costSavings: 0,
            qualityIncrease: 15,
            performanceGain: 20,
          },
          confidence: 0.75,
          implementationComplexity: "medium",
          riskAssessment: "low",
        });
      }

      // Performance enhancement suggestions
      if (currentLog.usage.averageExecutionTime > 5000) {
        suggestions.push({
          originalPrompt: currentPrompt,
          optimizedPrompt: this.optimizeForPerformance(currentPrompt),
          reasoningCategory: "performance_enhancement",
          expectedImprovement: {
            tokenReduction: 10,
            costSavings: 8,
            qualityIncrease: 0,
            performanceGain: 30,
          },
          confidence: 0.80,
          implementationComplexity: "medium",
          riskAssessment: "medium",
        });
      }

      return suggestions.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      logger.error("Failed to generate optimization suggestions", { error, agentType });
      return [];
    }
  }

  /**
   * Get prompt performance dashboard data
   */
  async getDashboardData(): Promise<{
    totalPrompts: number;
    totalUsage: number;
    averageSuccessRate: number;
    averageQualityScore: number;
    topAgents: Array<{ agentType: string; promptCount: number; performance: number }>;
    trendingPrompts: PromptTemplateLog[];
    recentOptimizations: number;
  }> {
    try {
      const allLogs = Array.from(this.promptLogs.values());
      const totalUsage = allLogs.reduce((sum, log) => sum + log.usage.count, 0);
      const averageSuccessRate = allLogs.reduce((sum, log) => sum + log.performance.successRate, 0) / allLogs.length || 0;
      const averageQualityScore = allLogs.reduce((sum, log) => sum + log.performance.qualityScore, 0) / allLogs.length || 0;

      // Calculate top agents by performance
      const agentMap = new Map<string, { count: number; performance: number }>();
      allLogs.forEach(log => {
        if (!agentMap.has(log.agentType)) {
          agentMap.set(log.agentType, { count: 0, performance: 0 });
        }
        const agent = agentMap.get(log.agentType)!;
        agent.count += 1;
        agent.performance += log.performance.successRate;
      });

      const topAgents = Array.from(agentMap.entries())
        .map(([agentType, data]) => ({
          agentType,
          promptCount: data.count,
          performance: data.performance / data.count,
        }))
        .sort((a, b) => b.performance - a.performance)
        .slice(0, 5);

      // Get trending prompts
      const trendingPrompts = allLogs
        .filter(log => this.isPromptTrending(log))
        .sort((a, b) => b.usage.count - a.usage.count)
        .slice(0, 5);

      return {
        totalPrompts: allLogs.length,
        totalUsage,
        averageSuccessRate,
        averageQualityScore,
        topAgents,
        trendingPrompts,
        recentOptimizations: this.countRecentOptimizations(),
      };
    } catch (error) {
      logger.error("Failed to get dashboard data", { error });
      return {
        totalPrompts: 0,
        totalUsage: 0,
        averageSuccessRate: 0,
        averageQualityScore: 0,
        topAgents: [],
        trendingPrompts: [],
        recentOptimizations: 0,
      };
    }
  }

  // Helper methods

  private generatePromptId(agentType: string, prompt: string): string {
    // Generate a consistent ID based on agent type and prompt content
    const hash = this.simpleHash(agentType + prompt);
    return `${agentType}_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private isPromptTrending(log: PromptTemplateLog): boolean {
    const daysSinceCreation = (Date.now() - log.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const usageVelocity = log.usage.count / Math.max(daysSinceCreation, 1);
    
    // Consider trending if used frequently recently
    return usageVelocity > 2 && log.performance.successRate > 0.7;
  }

  private calculateCombinedScore(log: PromptTemplateLog): number {
    // Weighted score combining multiple factors
    const weights = {
      successRate: 0.3,
      qualityScore: 0.25,
      conversionRate: 0.2,
      usageCount: 0.15,
      efficiency: 0.1, // tokens per successful execution
    };

    const efficiency = log.usage.totalTokens / Math.max(log.usage.count * log.performance.successRate, 1);
    const normalizedEfficiency = Math.max(0, 1 - (efficiency / 2000)); // Normalize against 2000 tokens

    return (
      log.performance.successRate * weights.successRate +
      log.performance.qualityScore * weights.qualityScore +
      log.performance.conversionRate * weights.conversionRate +
      Math.min(log.usage.count / 100, 1) * weights.usageCount + // Normalize usage count
      normalizedEfficiency * weights.efficiency
    );
  }

  private optimizeForTokenReduction(prompt: string): string {
    // Simple token reduction optimization
    return prompt
      .replace(/\n\n+/g, '\n') // Remove extra newlines
      .replace(/\s+/g, ' ') // Reduce multiple spaces
      .replace(/Please /g, '') // Remove politeness words
      .replace(/You should /g, '') // Simplify instructions
      .replace(/I want you to /g, '') // Remove verbose instructions
      .trim();
  }

  private optimizeForQuality(prompt: string, metadata: any): string {
    // Add quality-enhancing elements
    let optimized = prompt;

    // Add structure if missing
    if (!prompt.includes('Requirements:') && !prompt.includes('Task:')) {
      optimized = `Task: ${optimized}\n\nRequirements:\n- Follow the specified tone: ${metadata.tone}\n- Include relevant keywords naturally\n- Provide actionable output`;
    }

    // Add validation requirements
    if (!prompt.includes('validation') && !prompt.includes('verify')) {
      optimized += '\n\nValidation: Ensure output meets all requirements before responding.';
    }

    return optimized;
  }

  private optimizeForPerformance(prompt: string): string {
    // Optimize for faster execution
    let optimized = prompt;

    // Add performance hints
    if (!prompt.includes('concise') && !prompt.includes('brief')) {
      optimized = `Be concise and focused. ${optimized}`;
    }

    // Add format constraints
    if (!prompt.includes('format') && !prompt.includes('structure')) {
      optimized += '\n\nFormat: Provide structured, direct responses.';
    }

    return optimized;
  }

  private countRecentOptimizations(): number {
    // Count optimizations from the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return Array.from(this.promptLogs.values())
      .filter(log => log.updatedAt > sevenDaysAgo && log.version !== "1.0")
      .length;
  }

  /**
   * Export prompt logs for analysis
   */
  async exportPromptLogs(agentType?: string): Promise<PromptTemplateLog[]> {
    const logs = agentType 
      ? Array.from(this.promptLogs.values()).filter(log => log.agentType === agentType)
      : Array.from(this.promptLogs.values());

    return logs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Import prompt logs from backup
   */
  async importPromptLogs(logs: PromptTemplateLog[]): Promise<void> {
    try {
      for (const log of logs) {
        this.promptLogs.set(log.id, log);
      }
      
      // Clear cache to force refresh
      this.performanceCache.clear();
      
      logger.info("Prompt logs imported successfully", { count: logs.length });
    } catch (error) {
      logger.error("Failed to import prompt logs", { error });
    }
  }
}

export default PromptTrackerService;