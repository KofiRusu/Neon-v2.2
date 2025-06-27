/**
 * SharedIntentModel - Core memory layer for Multi-Agent Reasoning Mesh
 * Enables agents to share intentions, coordinate resources, and avoid conflicts
 */

import { PrismaClient } from '@prisma/client';
import { AgentType, IntentStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface AgentIntent {
  id?: string;
  goalPlanId?: string;
  agentId: string;
  agentType: AgentType;
  intention: string;
  resources: {
    timeRequired: number; // minutes
    budgetRequired?: number;
    dependencies: string[];
    exclusiveAccess?: string[]; // Resources that can't be shared
  };
  priority: number; // 1-10 scale
  constraints?: {
    schedule?: {
      earliestStart?: Date;
      latestEnd?: Date;
      blackoutPeriods?: Array<{ start: Date; end: Date }>;
    };
    prerequisites?: string[]; // Intent IDs that must complete first
  };
  status: IntentStatus;
  confidence: number; // 0-1 confidence in success
  estimatedDuration?: number; // minutes
  metadata?: any;
}

export interface ResourceConflict {
  conflictingIntents: string[];
  resourceType: string;
  conflictLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedResolution: 'SEQUENTIAL' | 'PARALLEL' | 'MERGE' | 'ESCALATE';
}

export class SharedIntentModel {
  private static instance: SharedIntentModel;
  private intentCache: Map<string, AgentIntent> = new Map();
  private resourceIndex: Map<string, string[]> = new Map(); // resource -> intent IDs

  static getInstance(): SharedIntentModel {
    if (!SharedIntentModel.instance) {
      SharedIntentModel.instance = new SharedIntentModel();
    }
    return SharedIntentModel.instance;
  }

  /**
   * Post an intention to the shared mesh
   */
  async broadcastIntent(intent: AgentIntent): Promise<string> {
    try {
      const savedIntent = await prisma.sharedIntent.create({
        data: {
          goalPlanId: intent.goalPlanId,
          agentId: intent.agentId,
          agentType: intent.agentType,
          intention: intent.intention,
          resources: intent.resources,
          priority: intent.priority,
          constraints: intent.constraints || {},
          status: intent.status,
          confidence: intent.confidence,
          estimatedDuration: intent.estimatedDuration,
          dependencies: intent.dependencies || [],
          metadata: intent.metadata || {},
        },
      });

      // Update cache and indexes
      intent.id = savedIntent.id;
      this.intentCache.set(savedIntent.id, intent);
      this.updateResourceIndex(savedIntent.id, intent);

      console.log(
        `📡 [SharedIntentModel] Intent broadcasted: ${intent.agentType} -> ${intent.intention}`
      );
      return savedIntent.id;
    } catch (error) {
      console.error('[SharedIntentModel] Error broadcasting intent:', error);
      throw error;
    }
  }

  /**
   * Retrieve intentions by various filters
   */
  async getIntentions(filter: {
    agentType?: AgentType;
    status?: IntentStatus;
    goalPlanId?: string;
    priority?: { min?: number; max?: number };
  }): Promise<AgentIntent[]> {
    try {
      const where: any = {};

      if (filter.agentType) where.agentType = filter.agentType;
      if (filter.status) where.status = filter.status;
      if (filter.goalPlanId) where.goalPlanId = filter.goalPlanId;
      if (filter.priority?.min || filter.priority?.max) {
        where.priority = {};
        if (filter.priority.min) where.priority.gte = filter.priority.min;
        if (filter.priority.max) where.priority.lte = filter.priority.max;
      }

      const intents = await prisma.sharedIntent.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });

      return intents.map(intent => ({
        id: intent.id,
        goalPlanId: intent.goalPlanId || undefined,
        agentId: intent.agentId,
        agentType: intent.agentType,
        intention: intent.intention,
        resources: intent.resources as any,
        priority: intent.priority,
        constraints: intent.constraints as any,
        status: intent.status,
        confidence: intent.confidence,
        estimatedDuration: intent.estimatedDuration || undefined,
        dependencies: intent.dependencies as string[],
        metadata: intent.metadata,
      }));
    } catch (error) {
      console.error('[SharedIntentModel] Error retrieving intentions:', error);
      throw error;
    }
  }

  /**
   * Detect resource conflicts between intentions
   */
  async detectConflicts(newIntent: AgentIntent): Promise<ResourceConflict[]> {
    const conflicts: ResourceConflict[] = [];

    try {
      // Get all active intentions
      const activeIntents = await this.getIntentions({
        status: IntentStatus.APPROVED,
      });

      for (const activeIntent of activeIntents) {
        const conflict = this.analyzeIntentConflict(newIntent, activeIntent);
        if (conflict) {
          conflicts.push(conflict);
        }
      }

      return conflicts;
    } catch (error) {
      console.error('[SharedIntentModel] Error detecting conflicts:', error);
      return [];
    }
  }

  /**
   * Update an intention's status
   */
  async updateIntentStatus(intentId: string, status: IntentStatus, metadata?: any): Promise<void> {
    try {
      await prisma.sharedIntent.update({
        where: { id: intentId },
        data: {
          status,
          metadata: metadata || {},
          updatedAt: new Date(),
        },
      });

      // Update cache
      if (this.intentCache.has(intentId)) {
        const intent = this.intentCache.get(intentId)!;
        intent.status = status;
        if (metadata) intent.metadata = { ...intent.metadata, ...metadata };
      }

      console.log(`🔄 [SharedIntentModel] Intent ${intentId} status updated to ${status}`);
    } catch (error) {
      console.error('[SharedIntentModel] Error updating intent status:', error);
      throw error;
    }
  }

  /**
   * Get agent availability based on current intentions
   */
  async getAgentAvailability(agentId: string): Promise<{
    isAvailable: boolean;
    currentIntentions: AgentIntent[];
    estimatedFreeTime?: Date;
  }> {
    try {
      const currentIntentions = await this.getIntentions({
        status: IntentStatus.EXECUTING,
      });

      const agentIntentions = currentIntentions.filter(intent => intent.agentId === agentId);

      const isAvailable = agentIntentions.length === 0;
      let estimatedFreeTime: Date | undefined;

      if (!isAvailable && agentIntentions.length > 0) {
        // Calculate when agent will be free
        const maxDuration = Math.max(
          ...agentIntentions.map(intent => intent.estimatedDuration || 30)
        );
        estimatedFreeTime = new Date(Date.now() + maxDuration * 60 * 1000);
      }

      return {
        isAvailable,
        currentIntentions: agentIntentions,
        estimatedFreeTime,
      };
    } catch (error) {
      console.error('[SharedIntentModel] Error checking agent availability:', error);
      throw error;
    }
  }

  /**
   * Get similar intentions for learning
   */
  async getSimilarIntentions(intention: string, agentType?: AgentType): Promise<AgentIntent[]> {
    try {
      // Simple keyword-based similarity for now
      // In production, this would use semantic similarity
      const keywords = intention.toLowerCase().split(' ');

      const allIntents = await this.getIntentions({
        agentType,
        status: IntentStatus.COMPLETED,
      });

      const similarIntents = allIntents.filter(intent => {
        const intentText = intent.intention.toLowerCase();
        const matchCount = keywords.filter(keyword => intentText.includes(keyword)).length;
        return matchCount >= Math.ceil(keywords.length * 0.5); // 50% keyword match
      });

      // Sort by confidence score (successful intentions first)
      return similarIntents.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('[SharedIntentModel] Error finding similar intentions:', error);
      return [];
    }
  }

  /**
   * Clean up old intentions
   */
  async cleanup(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      await prisma.sharedIntent.deleteMany({
        where: {
          status: {
            in: [IntentStatus.COMPLETED, IntentStatus.FAILED, IntentStatus.WITHDRAWN],
          },
          updatedAt: {
            lt: cutoffDate,
          },
        },
      });

      // Clear cache for deleted intentions
      this.intentCache.clear();
      this.resourceIndex.clear();

      console.log('🧹 [SharedIntentModel] Cleanup completed');
    } catch (error) {
      console.error('[SharedIntentModel] Error during cleanup:', error);
    }
  }

  // Private helper methods
  private updateResourceIndex(intentId: string, intent: AgentIntent): void {
    const resources = [
      ...intent.resources.dependencies,
      ...(intent.resources.exclusiveAccess || []),
    ];

    resources.forEach(resource => {
      if (!this.resourceIndex.has(resource)) {
        this.resourceIndex.set(resource, []);
      }
      this.resourceIndex.get(resource)!.push(intentId);
    });
  }

  private analyzeIntentConflict(
    intent1: AgentIntent,
    intent2: AgentIntent
  ): ResourceConflict | null {
    const resources1 = new Set([
      ...intent1.resources.dependencies,
      ...(intent1.resources.exclusiveAccess || []),
    ]);

    const resources2 = new Set([
      ...intent2.resources.dependencies,
      ...(intent2.resources.exclusiveAccess || []),
    ]);

    const sharedResources = [...resources1].filter(r => resources2.has(r));

    if (sharedResources.length === 0) return null;

    // Determine conflict level
    const hasExclusiveConflict = sharedResources.some(
      resource =>
        intent1.resources.exclusiveAccess?.includes(resource) ||
        intent2.resources.exclusiveAccess?.includes(resource)
    );

    const conflictLevel = hasExclusiveConflict
      ? 'HIGH'
      : sharedResources.length > 1
        ? 'MEDIUM'
        : 'LOW';

    // Suggest resolution
    let suggestedResolution: ResourceConflict['suggestedResolution'] = 'SEQUENTIAL';

    if (conflictLevel === 'LOW' && intent1.agentType === intent2.agentType) {
      suggestedResolution = 'MERGE';
    } else if (conflictLevel === 'HIGH') {
      suggestedResolution = 'ESCALATE';
    } else if (!hasExclusiveConflict) {
      suggestedResolution = 'PARALLEL';
    }

    return {
      conflictingIntents: [intent1.id!, intent2.id!],
      resourceType: sharedResources[0],
      conflictLevel,
      suggestedResolution,
    };
  }
}

export default SharedIntentModel;
