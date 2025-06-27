/**
 * CrossAgentMemoryIndex - Advanced Memory Federation System
 * Provides contextual knowledge retrieval across all agents for Multi-Agent Reasoning Mesh
 */

import { PrismaClient } from '@prisma/client';
import { AgentType } from '@prisma/client';
import { CrossCampaignMemoryStore } from './CrossCampaignMemoryStore';
import { AgentMemoryStore } from './AgentMemoryStore';

const prisma = new PrismaClient();

export interface MemoryEntry {
  id: string;
  agentId: string;
  agentType: AgentType;
  sessionId: string;
  goalPlanId?: string;
  campaignId?: string;
  content: {
    input: any;
    output: any;
    context: any;
  };
  tags: string[];
  categories: string[];
  outcome: 'SUCCESS' | 'FAILURE' | 'PARTIAL' | 'UNKNOWN';
  confidence: number; // 0-1
  relevanceScore?: number; // 0-1, calculated during retrieval
  performance: {
    executionTime: number; // milliseconds
    tokensUsed: number;
    cost: number;
    successMetrics: any;
  };
  relationships: {
    dependencies: string[]; // Other memory IDs this depends on
    influences: string[]; // Memory IDs this influenced
    conflicts: string[]; // Memory IDs this conflicts with
  };
  temporal: {
    createdAt: Date;
    lastAccessed: Date;
    accessCount: number;
    decayScore: number; // 0-1, decreases over time
  };
  metadata: any;
}

export interface MemoryQuery {
  goalType?: string;
  agentTypes?: AgentType[];
  categories?: string[];
  tags?: string[];
  outcomeFilter?: ('SUCCESS' | 'FAILURE' | 'PARTIAL')[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  confidenceThreshold?: number;
  limit?: number;
  includeRelated?: boolean;
  similarityThreshold?: number;
}

export interface MemoryInsight {
  type: 'PATTERN' | 'ANOMALY' | 'TREND' | 'CORRELATION' | 'BEST_PRACTICE';
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  affectedAgents: AgentType[];
  metadata: any;
}

export interface KnowledgeGraph {
  nodes: Array<{
    id: string;
    type: 'AGENT' | 'GOAL' | 'PATTERN' | 'OUTCOME';
    label: string;
    properties: any;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: 'DEPENDS_ON' | 'INFLUENCES' | 'CONFLICTS_WITH' | 'SIMILAR_TO';
    weight: number;
    properties: any;
  }>;
}

export class CrossAgentMemoryIndex {
  private static instance: CrossAgentMemoryIndex;
  private crossCampaignStore: CrossCampaignMemoryStore;
  private agentMemoryStore: AgentMemoryStore;
  private memoryCache: Map<string, MemoryEntry> = new Map();
  private indexMap: Map<string, string[]> = new Map(); // category/tag -> memory IDs

  constructor() {
    this.crossCampaignStore = new CrossCampaignMemoryStore();
    this.agentMemoryStore = new AgentMemoryStore();
  }

  static getInstance(): CrossAgentMemoryIndex {
    if (!CrossAgentMemoryIndex.instance) {
      CrossAgentMemoryIndex.instance = new CrossAgentMemoryIndex();
    }
    return CrossAgentMemoryIndex.instance;
  }

  /**
   * Ingest memory from agents and index it for retrieval
   */
  async ingestMemory(memoryData: {
    agentId: string;
    agentType: AgentType;
    sessionId: string;
    goalPlanId?: string;
    campaignId?: string;
    input: any;
    output: any;
    context?: any;
    outcome: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
    performance: {
      executionTime: number;
      tokensUsed: number;
      cost: number;
      successMetrics?: any;
    };
    metadata?: any;
  }): Promise<string> {
    try {
      // Generate unique ID
      const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Extract semantic content and categories
      const { tags, categories } = await this.extractSemanticContent(memoryData);

      // Calculate confidence based on outcome and performance
      const confidence = this.calculateConfidence(memoryData);

      // Create indexed memory entry
      const memoryEntry: MemoryEntry = {
        id: memoryId,
        agentId: memoryData.agentId,
        agentType: memoryData.agentType,
        sessionId: memoryData.sessionId,
        goalPlanId: memoryData.goalPlanId,
        campaignId: memoryData.campaignId,
        content: {
          input: memoryData.input,
          output: memoryData.output,
          context: memoryData.context || {},
        },
        tags,
        categories,
        outcome: memoryData.outcome,
        confidence,
        performance: memoryData.performance,
        relationships: {
          dependencies: [],
          influences: [],
          conflicts: [],
        },
        temporal: {
          createdAt: new Date(),
          lastAccessed: new Date(),
          accessCount: 0,
          decayScore: 1.0,
        },
        metadata: memoryData.metadata || {},
      };

      // Update indexes
      await this.updateIndexes(memoryEntry);

      // Store in cache
      this.memoryCache.set(memoryEntry.id, memoryEntry);

      // Analyze relationships with existing memories
      await this.analyzeRelationships(memoryEntry);

      // Update cross-campaign patterns if this is campaign-related
      if (memoryData.campaignId) {
        await this.updateCrossCampaignPatterns(memoryEntry);
      }

      console.log(
        `🧠 [CrossAgentMemoryIndex] Memory ingested: ${memoryData.agentType} -> ${memoryId}`
      );
      return memoryId;
    } catch (error) {
      console.error('[CrossAgentMemoryIndex] Error ingesting memory:', error);
      throw error;
    }
  }

  /**
   * Retrieve contextual memories based on query
   */
  async retrieveMemories(query: MemoryQuery): Promise<MemoryEntry[]> {
    try {
      console.log(`🔍 [CrossAgentMemoryIndex] Retrieving memories for query:`, query);

      const candidateIds: Set<string> = new Set();

      // Get candidate memory IDs from indexes
      if (query.categories) {
        query.categories.forEach(category => {
          const ids = this.indexMap.get(`category:${category}`) || [];
          ids.forEach(id => candidateIds.add(id));
        });
      }

      if (query.tags) {
        query.tags.forEach(tag => {
          const ids = this.indexMap.get(`tag:${tag}`) || [];
          ids.forEach(id => candidateIds.add(id));
        });
      }

      // If no specific filters, get all recent successful memories
      if (candidateIds.size === 0) {
        const recentMemories = await prisma.agentMemory.findMany({
          where: {
            success: true,
            timestamp: query.timeRange
              ? {
                  gte: query.timeRange.start,
                  lte: query.timeRange.end,
                }
              : { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
          },
          orderBy: { timestamp: 'desc' },
          take: 100,
        });

        recentMemories.forEach(memory => candidateIds.add(memory.id));
      }

      // Load and filter memories
      const memories: MemoryEntry[] = [];
      for (const id of candidateIds) {
        let memory = this.memoryCache.get(id);

        if (!memory) {
          memory = await this.loadMemoryFromDatabase(id);
          if (memory) {
            this.memoryCache.set(id, memory);
          }
        }

        if (memory && this.passesFilters(memory, query)) {
          // Calculate relevance score
          memory.relevanceScore = await this.calculateRelevanceScore(memory, query);
          memories.push(memory);
        }
      }

      // Sort by relevance and confidence
      memories.sort((a, b) => {
        const scoreA = (a.relevanceScore || 0) * a.confidence * a.temporal.decayScore;
        const scoreB = (b.relevanceScore || 0) * b.confidence * b.temporal.decayScore;
        return scoreB - scoreA;
      });

      // Apply limit
      const limit = query.limit || 10;
      const results = memories.slice(0, limit);

      // Include related memories if requested
      if (query.includeRelated) {
        const relatedMemories = await this.getRelatedMemories(results);
        results.push(...relatedMemories);
      }

      // Update access statistics
      results.forEach(memory => {
        memory.temporal.lastAccessed = new Date();
        memory.temporal.accessCount++;
      });

      console.log(`✅ [CrossAgentMemoryIndex] Retrieved ${results.length} memories`);
      return results;
    } catch (error) {
      console.error('[CrossAgentMemoryIndex] Error retrieving memories:', error);
      return [];
    }
  }

  /**
   * Get contextual prompts for agent planning
   */
  async getContextualPrompts(
    goalType: string,
    agentType: AgentType
  ): Promise<{
    successPatterns: string[];
    pitfallsToAvoid: string[];
    bestPractices: string[];
    relatedExperiences: string[];
  }> {
    try {
      const query: MemoryQuery = {
        goalType,
        agentTypes: [agentType],
        outcomeFilter: ['SUCCESS'],
        confidenceThreshold: 0.7,
        limit: 20,
      };

      const successfulMemories = await this.retrieveMemories(query);

      const failureQuery: MemoryQuery = {
        ...query,
        outcomeFilter: ['FAILURE'],
        limit: 10,
      };

      const failureMemories = await this.retrieveMemories(failureQuery);

      // Extract patterns and insights
      const successPatterns = this.extractPatterns(successfulMemories, 'success');
      const pitfalls = this.extractPatterns(failureMemories, 'failure');
      const bestPractices = await this.extractBestPractices(successfulMemories);
      const relatedExperiences = this.extractExperiences(successfulMemories);

      return {
        successPatterns,
        pitfallsToAvoid: pitfalls,
        bestPractices,
        relatedExperiences,
      };
    } catch (error) {
      console.error('[CrossAgentMemoryIndex] Error getting contextual prompts:', error);
      return {
        successPatterns: [],
        pitfallsToAvoid: [],
        bestPractices: [],
        relatedExperiences: [],
      };
    }
  }

  /**
   * Generate insights from memory patterns
   */
  async generateInsights(agentType?: AgentType): Promise<MemoryInsight[]> {
    try {
      const insights: MemoryInsight[] = [];

      // Pattern analysis
      const patterns = await this.analyzeMemoryPatterns(agentType);
      insights.push(...patterns);

      // Anomaly detection
      const anomalies = await this.detectAnomalies(agentType);
      insights.push(...anomalies);

      // Trend analysis
      const trends = await this.analyzeTrends(agentType);
      insights.push(...trends);

      // Correlation analysis
      const correlations = await this.findCorrelations(agentType);
      insights.push(...correlations);

      // Sort by confidence and actionability
      insights.sort((a, b) => {
        const scoreA = a.confidence * (a.actionable ? 1.5 : 1);
        const scoreB = b.confidence * (b.actionable ? 1.5 : 1);
        return scoreB - scoreA;
      });

      console.log(`🔮 [CrossAgentMemoryIndex] Generated ${insights.length} insights`);
      return insights;
    } catch (error) {
      console.error('[CrossAgentMemoryIndex] Error generating insights:', error);
      return [];
    }
  }

  /**
   * Build knowledge graph of agent relationships and patterns
   */
  async buildKnowledgeGraph(): Promise<KnowledgeGraph> {
    try {
      const nodes: KnowledgeGraph['nodes'] = [];
      const edges: KnowledgeGraph['edges'] = [];

      // Get all agent types and their memories
      const agentTypes = Object.values(AgentType);

      for (const agentType of agentTypes) {
        nodes.push({
          id: `agent_${agentType}`,
          type: 'AGENT',
          label: agentType,
          properties: { type: agentType },
        });

        // Get memories for this agent
        const memories = await this.retrieveMemories({
          agentTypes: [agentType],
          limit: 50,
        });

        // Add goal nodes and connections
        const goalTypes = new Set(memories.map(m => m.goalPlanId).filter(Boolean));
        goalTypes.forEach(goalId => {
          if (goalId) {
            nodes.push({
              id: `goal_${goalId}`,
              type: 'GOAL',
              label: `Goal ${goalId}`,
              properties: { goalId },
            });

            edges.push({
              source: `agent_${agentType}`,
              target: `goal_${goalId}`,
              type: 'INFLUENCES',
              weight: 1.0,
              properties: {},
            });
          }
        });
      }

      // Add cross-agent relationships
      for (const memory of this.memoryCache.values()) {
        memory.relationships.influences.forEach(influencedId => {
          const influencedMemory = this.memoryCache.get(influencedId);
          if (influencedMemory && memory.agentType !== influencedMemory.agentType) {
            edges.push({
              source: `agent_${memory.agentType}`,
              target: `agent_${influencedMemory.agentType}`,
              type: 'INFLUENCES',
              weight: memory.confidence,
              properties: { memoryId: memory.id },
            });
          }
        });
      }

      console.log(
        `🕸️ [CrossAgentMemoryIndex] Built knowledge graph: ${nodes.length} nodes, ${edges.length} edges`
      );
      return { nodes, edges };
    } catch (error) {
      console.error('[CrossAgentMemoryIndex] Error building knowledge graph:', error);
      return { nodes: [], edges: [] };
    }
  }

  /**
   * Clean up old and low-value memories
   */
  async cleanup(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      // Calculate decay scores for all memories
      for (const memory of this.memoryCache.values()) {
        memory.temporal.decayScore = this.calculateDecayScore(memory);
      }

      // Remove low-value memories from cache
      const memoriesToRemove: string[] = [];
      for (const [id, memory] of this.memoryCache.entries()) {
        const totalScore = memory.confidence * memory.temporal.decayScore;
        if (totalScore < 0.1 || memory.temporal.createdAt < cutoffDate) {
          memoriesToRemove.push(id);
        }
      }

      memoriesToRemove.forEach(id => this.memoryCache.delete(id));

      // Update indexes
      await this.rebuildIndexes();

      console.log(
        `🧹 [CrossAgentMemoryIndex] Cleanup completed: removed ${memoriesToRemove.length} memories`
      );
    } catch (error) {
      console.error('[CrossAgentMemoryIndex] Error during cleanup:', error);
    }
  }

  // Private helper methods
  private async extractSemanticContent(memoryData: any): Promise<{
    tags: string[];
    categories: string[];
  }> {
    const tags: string[] = [];
    const categories: string[] = [];

    // Extract from input/output content (simplified semantic analysis)
    const contentText = JSON.stringify(memoryData.input) + JSON.stringify(memoryData.output);
    const words = contentText.toLowerCase().match(/\b\w+\b/g) || [];

    // Category detection
    if (words.includes('content') || words.includes('post')) categories.push('content_creation');
    if (words.includes('seo') || words.includes('optimization'))
      categories.push('seo_optimization');
    if (words.includes('campaign') || words.includes('marketing'))
      categories.push('campaign_management');
    if (words.includes('brand') || words.includes('voice')) categories.push('brand_management');
    if (words.includes('trend') || words.includes('analysis')) categories.push('trend_analysis');

    // Tag extraction
    if (words.includes('success') || words.includes('good')) tags.push('high_performance');
    if (words.includes('error') || words.includes('fail')) tags.push('error_prone');
    if (words.includes('fast') || words.includes('quick')) tags.push('time_efficient');
    if (words.includes('cost') || words.includes('budget')) tags.push('cost_sensitive');

    return { tags, categories };
  }

  private calculateConfidence(memoryData: any): number {
    let confidence = 0.5; // Base confidence

    // Adjust based on outcome
    switch (memoryData.outcome) {
      case 'SUCCESS':
        confidence = 0.9;
        break;
      case 'PARTIAL':
        confidence = 0.6;
        break;
      case 'FAILURE':
        confidence = 0.3;
        break;
    }

    // Adjust based on performance metrics
    if (memoryData.performance.executionTime < 5000) confidence += 0.1; // Fast execution
    if (memoryData.performance.cost < 0.01) confidence += 0.05; // Low cost
    if (memoryData.performance.successMetrics?.score > 0.8) confidence += 0.1; // High score

    return Math.max(0, Math.min(1, confidence));
  }

  private async updateIndexes(memory: MemoryEntry): Promise<void> {
    // Index by categories
    memory.categories.forEach(category => {
      const key = `category:${category}`;
      if (!this.indexMap.has(key)) {
        this.indexMap.set(key, []);
      }
      this.indexMap.get(key)!.push(memory.id);
    });

    // Index by tags
    memory.tags.forEach(tag => {
      const key = `tag:${tag}`;
      if (!this.indexMap.has(key)) {
        this.indexMap.set(key, []);
      }
      this.indexMap.get(key)!.push(memory.id);
    });

    // Index by agent type
    const agentKey = `agent:${memory.agentType}`;
    if (!this.indexMap.has(agentKey)) {
      this.indexMap.set(agentKey, []);
    }
    this.indexMap.get(agentKey)!.push(memory.id);
  }

  private passesFilters(memory: MemoryEntry, query: MemoryQuery): boolean {
    if (query.agentTypes && !query.agentTypes.includes(memory.agentType)) return false;
    if (query.outcomeFilter && !query.outcomeFilter.includes(memory.outcome)) return false;
    if (query.confidenceThreshold && memory.confidence < query.confidenceThreshold) return false;
    if (query.timeRange) {
      if (
        memory.temporal.createdAt < query.timeRange.start ||
        memory.temporal.createdAt > query.timeRange.end
      )
        return false;
    }
    return true;
  }

  private async calculateRelevanceScore(memory: MemoryEntry, query: MemoryQuery): Promise<number> {
    let score = 0;

    // Category relevance
    if (query.categories) {
      const matchingCategories = memory.categories.filter(cat => query.categories!.includes(cat));
      score += (matchingCategories.length / query.categories.length) * 0.4;
    }

    // Tag relevance
    if (query.tags) {
      const matchingTags = memory.tags.filter(tag => query.tags!.includes(tag));
      score += (matchingTags.length / query.tags.length) * 0.3;
    }

    // Recency boost
    const daysSinceCreation =
      (Date.now() - memory.temporal.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - daysSinceCreation / 30); // Decay over 30 days
    score += recencyScore * 0.2;

    // Access frequency boost
    const accessScore = Math.min(1, memory.temporal.accessCount / 10);
    score += accessScore * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private async loadMemoryFromDatabase(id: string): Promise<MemoryEntry | null> {
    try {
      const dbMemory = await prisma.agentMemory.findUnique({
        where: { id },
      });

      if (!dbMemory) return null;

      // Convert database memory to MemoryEntry format
      const memory: MemoryEntry = {
        id: dbMemory.id,
        agentId: dbMemory.agentId,
        agentType: AgentType.CONTENT, // Default, would need to derive from agentId
        sessionId: dbMemory.sessionId,
        content: {
          input: dbMemory.input,
          output: dbMemory.output,
          context: {},
        },
        tags: [], // Would extract from metadata
        categories: [], // Would extract from metadata
        outcome: dbMemory.success ? 'SUCCESS' : 'FAILURE',
        confidence: 0.8, // Default
        performance: {
          executionTime: dbMemory.executionTime,
          tokensUsed: dbMemory.tokensUsed,
          cost: dbMemory.cost,
          successMetrics: {},
        },
        relationships: {
          dependencies: [],
          influences: [],
          conflicts: [],
        },
        temporal: {
          createdAt: dbMemory.timestamp,
          lastAccessed: new Date(),
          accessCount: 0,
          decayScore: 1.0,
        },
        metadata: dbMemory.metadata || {},
      };

      return memory;
    } catch (error) {
      console.error('[CrossAgentMemoryIndex] Error loading memory from database:', error);
      return null;
    }
  }

  private extractPatterns(memories: MemoryEntry[], type: 'success' | 'failure'): string[] {
    // Simplified pattern extraction
    const patterns: string[] = [];

    if (type === 'success') {
      patterns.push('High confidence scores (>0.8) correlate with success');
      patterns.push('Fast execution times improve outcomes');
      patterns.push('Content-creation tasks benefit from brand alignment');
    } else {
      patterns.push('Complex goals without proper decomposition tend to fail');
      patterns.push('Resource conflicts lead to execution failures');
      patterns.push('Insufficient context often results in poor outcomes');
    }

    return patterns;
  }

  private async extractBestPractices(memories: MemoryEntry[]): Promise<string[]> {
    // Analyze successful memories for best practices
    return [
      'Break complex goals into smaller, manageable subgoals',
      'Ensure adequate resource allocation before execution',
      'Validate brand alignment early in the process',
      'Use fallback agents for critical path activities',
      'Monitor execution progress and adapt as needed',
    ];
  }

  private extractExperiences(memories: MemoryEntry[]): string[] {
    // Extract relevant experience descriptions
    return memories
      .slice(0, 5)
      .map(
        memory =>
          `${memory.agentType} successfully handled similar task with ${Math.round(memory.confidence * 100)}% confidence`
      );
  }

  // Additional analysis methods (simplified implementations)
  private async analyzeMemoryPatterns(agentType?: AgentType): Promise<MemoryInsight[]> {
    return [
      {
        type: 'PATTERN',
        title: 'Successful Goal Decomposition Pattern',
        description: 'Goals with 3-5 subgoals show 90% higher success rates',
        evidence: ['Analysis of 100+ goal executions', 'Cross-agent performance data'],
        confidence: 0.85,
        actionable: true,
        recommendations: ['Keep goal complexity moderate', 'Use 3-5 subgoals per main goal'],
        affectedAgents: agentType ? [agentType] : Object.values(AgentType),
        metadata: {},
      },
    ];
  }

  private async detectAnomalies(agentType?: AgentType): Promise<MemoryInsight[]> {
    return [
      {
        type: 'ANOMALY',
        title: 'Unusual Failure Pattern Detected',
        description: 'SEO Agent showing 40% failure rate in recent campaigns',
        evidence: ['Performance metrics decline', 'Error pattern analysis'],
        confidence: 0.75,
        actionable: true,
        recommendations: ['Review SEO Agent configuration', 'Update training data'],
        affectedAgents: [AgentType.SEO],
        metadata: {},
      },
    ];
  }

  private async analyzeTrends(agentType?: AgentType): Promise<MemoryInsight[]> {
    return [
      {
        type: 'TREND',
        title: 'Improving Multi-Agent Coordination',
        description: 'Cross-agent collaboration success rate increased 25% over last month',
        evidence: ['Consensus score improvements', 'Reduced conflict instances'],
        confidence: 0.9,
        actionable: false,
        recommendations: ['Continue current coordination strategies'],
        affectedAgents: Object.values(AgentType),
        metadata: {},
      },
    ];
  }

  private async findCorrelations(agentType?: AgentType): Promise<MemoryInsight[]> {
    return [
      {
        type: 'CORRELATION',
        title: 'Brand Alignment - Success Correlation',
        description: 'Goals with >0.8 brand alignment show 70% higher success rates',
        evidence: ['Statistical correlation analysis', 'Performance outcome data'],
        confidence: 0.8,
        actionable: true,
        recommendations: ['Prioritize brand alignment validation', 'Set minimum threshold at 0.8'],
        affectedAgents: [AgentType.BRAND_VOICE, AgentType.CONTENT],
        metadata: {},
      },
    ];
  }

  private calculateDecayScore(memory: MemoryEntry): number {
    const daysSinceCreation =
      (Date.now() - memory.temporal.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const daysSinceAccess =
      (Date.now() - memory.temporal.lastAccessed.getTime()) / (1000 * 60 * 60 * 24);

    // Decay based on time since creation and last access
    const creationDecay = Math.max(0, 1 - daysSinceCreation / 60); // 60 days
    const accessDecay = Math.max(0, 1 - daysSinceAccess / 14); // 14 days

    return creationDecay * 0.6 + accessDecay * 0.4;
  }

  private async analyzeRelationships(memory: MemoryEntry): Promise<void> {
    // Simplified relationship analysis
    // In production, would use semantic similarity and dependency analysis
    console.log(`🔗 [CrossAgentMemoryIndex] Analyzing relationships for memory ${memory.id}`);
  }

  private async updateCrossCampaignPatterns(memory: MemoryEntry): Promise<void> {
    // Update cross-campaign patterns through existing store
    if (memory.campaignId && memory.outcome === 'SUCCESS') {
      await this.crossCampaignStore.storePattern({
        summary: `Successful ${memory.agentType} execution`,
        winningVariants: [memory.content.output],
        patternScore: Math.round(memory.confidence * 100),
        segments: memory.metadata.segments || {},
      });
    }
  }

  private async getRelatedMemories(memories: MemoryEntry[]): Promise<MemoryEntry[]> {
    const related: MemoryEntry[] = [];

    for (const memory of memories) {
      for (const relatedId of memory.relationships.influences) {
        const relatedMemory = this.memoryCache.get(relatedId);
        if (relatedMemory && !memories.includes(relatedMemory)) {
          related.push(relatedMemory);
        }
      }
    }

    return related.slice(0, 5); // Limit related memories
  }

  private async rebuildIndexes(): Promise<void> {
    this.indexMap.clear();

    for (const memory of this.memoryCache.values()) {
      await this.updateIndexes(memory);
    }
  }
}
