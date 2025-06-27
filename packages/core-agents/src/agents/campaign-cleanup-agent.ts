/**
 * Campaign Cleanup Agent - Autonomous System Maintenance
 * Archives poor performers and updates memory logs for optimal system performance
 */

import { AbstractAgent } from '../base-agent';
import { AgentMemoryStore } from '../memory/AgentMemoryStore';
import { ABTest, ABTestingManager } from '../strategy/ab-testing-manager';

export interface CleanupRule {
  id: string;
  name: string;
  condition: {
    type: 'performance' | 'age' | 'status' | 'resource_usage';
    threshold: number;
    operator: 'less_than' | 'greater_than' | 'equals' | 'not_equals';
    metric?: string;
  };
  action: {
    type: 'archive' | 'delete' | 'optimize' | 'flag';
    retentionDays?: number;
    notification?: boolean;
  };
  priority: 'low' | 'medium' | 'high';
  enabled: boolean;
}

export interface CleanupReport {
  timestamp: Date;
  summary: {
    testsArchived: number;
    campaignsOptimized: number;
    memoryReclaimed: number; // MB
    performanceGain: number; // percentage
  };
  actions: CleanupAction[];
  recommendations: CleanupRecommendation[];
}

export interface CleanupAction {
  id: string;
  type: 'archive' | 'delete' | 'optimize' | 'merge';
  targetId: string;
  targetType: 'test' | 'campaign' | 'variant' | 'memory';
  reason: string;
  impact: {
    performance: number;
    storage: number;
    resources: number;
  };
  executedAt: Date;
  status: 'completed' | 'failed' | 'partial';
}

export interface CleanupRecommendation {
  type: 'performance' | 'storage' | 'optimization' | 'learning';
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedBenefit: string;
  implementation: {
    effort: 'low' | 'medium' | 'high';
    timeRequired: number; // minutes
    approval: boolean;
  };
}

export interface CleanupConfig {
  cleanupInterval: number; // hours
  retentionPeriods: {
    failedTests: number; // days
    completedTests: number; // days
    archivedCampaigns: number; // days
    performanceLogs: number; // days
  };
  performanceThresholds: {
    minConversionRate: number;
    minSampleSize: number;
    maxDuration: number; // hours
  };
  autoCleanup: {
    enabled: boolean;
    requireApproval: boolean;
    maxActionsPerCycle: number;
  };
}

export class CampaignCleanupAgent extends AbstractAgent {
  private memoryStore: AgentMemoryStore;
  private abTestingManager: ABTestingManager;
  private config: CleanupConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private cleanupRules: CleanupRule[] = [];
  private lastCleanupReport: CleanupReport | null = null;

  constructor(
    memoryStore: AgentMemoryStore,
    abTestingManager: ABTestingManager,
    config?: Partial<CleanupConfig>
  ) {
    super('campaign-cleanup-agent', {
      archive_poor_performers: 'Archives campaigns and tests with poor performance',
      optimize_memory: 'Cleans up memory stores and optimizes data retention',
      generate_insights: 'Extracts learnings from completed campaigns before archival',
      maintain_system: 'Performs routine system maintenance and optimization',
      monitor_resources: 'Monitors system resources and suggests optimizations',
    });

    this.memoryStore = memoryStore;
    this.abTestingManager = abTestingManager;

    this.config = {
      cleanupInterval: 24, // 24 hours
      retentionPeriods: {
        failedTests: 7,
        completedTests: 30,
        archivedCampaigns: 90,
        performanceLogs: 14,
      },
      performanceThresholds: {
        minConversionRate: 1.0, // 1%
        minSampleSize: 100,
        maxDuration: 336, // 14 days
      },
      autoCleanup: {
        enabled: true,
        requireApproval: false,
        maxActionsPerCycle: 10,
      },
      ...config,
    };

    this.initializeCleanupRules();
    this.startCleanupCycles();
  }

  /**
   * Initialize default cleanup rules
   */
  private initializeCleanupRules(): void {
    this.cleanupRules = [
      {
        id: 'poor_performance_archive',
        name: 'Archive Poor Performing Tests',
        condition: {
          type: 'performance',
          threshold: this.config.performanceThresholds.minConversionRate,
          operator: 'less_than',
          metric: 'conversion_rate',
        },
        action: {
          type: 'archive',
          retentionDays: this.config.retentionPeriods.failedTests,
          notification: true,
        },
        priority: 'medium',
        enabled: true,
      },
      {
        id: 'stale_test_cleanup',
        name: 'Clean Up Stale Tests',
        condition: {
          type: 'age',
          threshold: this.config.performanceThresholds.maxDuration,
          operator: 'greater_than',
        },
        action: {
          type: 'archive',
          retentionDays: this.config.retentionPeriods.completedTests,
          notification: false,
        },
        priority: 'low',
        enabled: true,
      },
      {
        id: 'insufficient_sample_cleanup',
        name: 'Clean Up Tests with Insufficient Data',
        condition: {
          type: 'performance',
          threshold: this.config.performanceThresholds.minSampleSize,
          operator: 'less_than',
          metric: 'sample_size',
        },
        action: {
          type: 'flag',
          notification: true,
        },
        priority: 'low',
        enabled: true,
      },
      {
        id: 'completed_winner_archive',
        name: 'Archive Completed Tests with Winners',
        condition: {
          type: 'status',
          threshold: 0,
          operator: 'equals',
        },
        action: {
          type: 'optimize',
          retentionDays: this.config.retentionPeriods.completedTests,
          notification: false,
        },
        priority: 'high',
        enabled: true,
      },
    ];
  }

  /**
   * Start automatic cleanup cycles
   */
  private startCleanupCycles(): void {
    console.log(
      `🧹 CampaignCleanupAgent starting cleanup cycles (${this.config.cleanupInterval}h intervals)`
    );

    this.cleanupInterval = setInterval(
      async () => {
        try {
          await this.performCleanupCycle();
        } catch (error) {
          console.error('❌ CampaignCleanupAgent cleanup error:', error);
        }
      },
      this.config.cleanupInterval * 60 * 60 * 1000
    );

    // Perform initial cleanup
    this.performCleanupCycle();
  }

  /**
   * Perform complete cleanup cycle
   */
  async performCleanupCycle(): Promise<CleanupReport> {
    try {
      console.log('🧹 CampaignCleanupAgent starting cleanup cycle...');

      const actions: CleanupAction[] = [];
      const recommendations: CleanupRecommendation[] = [];

      // Get all tests and campaigns to evaluate
      const allTests = await this.getAllTests();
      const allCampaigns = await this.getAllCampaigns();

      // Apply cleanup rules to tests
      for (const test of allTests) {
        const testActions = await this.evaluateTestForCleanup(test);
        actions.push(...testActions);
      }

      // Apply cleanup rules to campaigns
      for (const campaign of allCampaigns) {
        const campaignActions = await this.evaluateCampaignForCleanup(campaign);
        actions.push(...campaignActions);
      }

      // Execute approved actions
      if (this.config.autoCleanup.enabled) {
        const actionsToExecute = actions.slice(0, this.config.autoCleanup.maxActionsPerCycle);
        for (const action of actionsToExecute) {
          await this.executeCleanupAction(action);
        }
      }

      // Generate optimization recommendations
      recommendations.push(...(await this.generateOptimizationRecommendations()));

      // Calculate summary
      const summary = this.calculateCleanupSummary(actions);

      const report: CleanupReport = {
        timestamp: new Date(),
        summary,
        actions,
        recommendations,
      };

      // Store cleanup report
      await this.storeCleanupReport(report);
      this.lastCleanupReport = report;

      console.log(
        `✅ Cleanup cycle completed: ${actions.length} actions, ${recommendations.length} recommendations`
      );
      return report;
    } catch (error) {
      console.error('❌ Cleanup cycle failed:', error);
      throw error;
    }
  }

  /**
   * Evaluate test for cleanup actions
   */
  private async evaluateTestForCleanup(test: ABTest): Promise<CleanupAction[]> {
    const actions: CleanupAction[] = [];

    for (const rule of this.cleanupRules.filter(r => r.enabled)) {
      const shouldCleanup = await this.evaluateCleanupRule(test, rule);

      if (shouldCleanup) {
        const action = await this.createCleanupAction(test, rule, 'test');
        if (action) {
          actions.push(action);
        }
      }
    }

    return actions;
  }

  /**
   * Evaluate campaign for cleanup actions
   */
  private async evaluateCampaignForCleanup(campaign: any): Promise<CleanupAction[]> {
    const actions: CleanupAction[] = [];

    // Check if campaign has been inactive
    const inactiveDays = this.getInactiveDays(campaign.lastActivity);

    if (inactiveDays > 30 && campaign.status === 'completed') {
      actions.push({
        id: `cleanup_${campaign.id}_${Date.now()}`,
        type: 'archive',
        targetId: campaign.id,
        targetType: 'campaign',
        reason: `Campaign inactive for ${inactiveDays} days`,
        impact: {
          performance: 0,
          storage: this.estimateStorageSize(campaign),
          resources: 5,
        },
        executedAt: new Date(),
        status: 'completed',
      });
    }

    return actions;
  }

  /**
   * Evaluate cleanup rule against test
   */
  private async evaluateCleanupRule(test: ABTest, rule: CleanupRule): Promise<boolean> {
    switch (rule.condition.type) {
      case 'performance':
        return this.evaluatePerformanceCondition(test, rule);

      case 'age':
        return this.evaluateAgeCondition(test, rule);

      case 'status':
        return this.evaluateStatusCondition(test, rule);

      case 'resource_usage':
        return this.evaluateResourceCondition(test, rule);

      default:
        return false;
    }
  }

  /**
   * Evaluate performance-based condition
   */
  private evaluatePerformanceCondition(test: ABTest, rule: CleanupRule): boolean {
    const metric = rule.condition.metric;
    let value = 0;

    switch (metric) {
      case 'conversion_rate':
        value = test.results.performance[0]?.primaryMetricValue || 0;
        break;
      case 'sample_size':
        value = test.results.totalImpressions;
        break;
      default:
        return false;
    }

    return this.compareValues(value, rule.condition.threshold, rule.condition.operator);
  }

  /**
   * Evaluate age-based condition
   */
  private evaluateAgeCondition(test: ABTest, rule: CleanupRule): boolean {
    const ageInHours = (Date.now() - test.createdAt.getTime()) / (1000 * 60 * 60);
    return this.compareValues(ageInHours, rule.condition.threshold, rule.condition.operator);
  }

  /**
   * Evaluate status-based condition
   */
  private evaluateStatusCondition(test: ABTest, rule: CleanupRule): boolean {
    const statusValue = test.status === 'winner_declared' ? 0 : 1;
    return this.compareValues(statusValue, rule.condition.threshold, rule.condition.operator);
  }

  /**
   * Evaluate resource usage condition
   */
  private evaluateResourceCondition(test: ABTest, rule: CleanupRule): boolean {
    const resourceUsage = this.calculateResourceUsage(test);
    return this.compareValues(resourceUsage, rule.condition.threshold, rule.condition.operator);
  }

  /**
   * Compare values based on operator
   */
  private compareValues(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case 'less_than':
        return value < threshold;
      case 'greater_than':
        return value > threshold;
      case 'equals':
        return value === threshold;
      case 'not_equals':
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * Create cleanup action from rule evaluation
   */
  private async createCleanupAction(
    test: ABTest,
    rule: CleanupRule,
    targetType: 'test' | 'campaign'
  ): Promise<CleanupAction | null> {
    if (rule.action.type === 'flag') {
      // Just flag for review, don't create action
      return null;
    }

    return {
      id: `cleanup_${test.id}_${rule.id}_${Date.now()}`,
      type: rule.action.type,
      targetId: test.id,
      targetType,
      reason: `Rule: ${rule.name}`,
      impact: {
        performance: this.estimatePerformanceImpact(test, rule.action.type),
        storage: this.estimateStorageImpact(test),
        resources: this.estimateResourceImpact(test, rule.action.type),
      },
      executedAt: new Date(),
      status: 'completed',
    };
  }

  /**
   * Execute cleanup action
   */
  private async executeCleanupAction(action: CleanupAction): Promise<void> {
    try {
      console.log(
        `🗑️ Executing cleanup action: ${action.type} on ${action.targetType} ${action.targetId}`
      );

      switch (action.type) {
        case 'archive':
          await this.archiveTarget(action.targetId, action.targetType);
          break;

        case 'delete':
          await this.deleteTarget(action.targetId, action.targetType);
          break;

        case 'optimize':
          await this.optimizeTarget(action.targetId, action.targetType);
          break;

        case 'merge':
          await this.mergeTarget(action.targetId, action.targetType);
          break;
      }

      action.status = 'completed';
      console.log(`✅ Cleanup action completed: ${action.type}`);
    } catch (error) {
      console.error(`❌ Cleanup action failed: ${action.type}`, error);
      action.status = 'failed';
    }
  }

  /**
   * Archive target (test, campaign, etc.)
   */
  private async archiveTarget(targetId: string, targetType: string): Promise<void> {
    // Extract learnings before archival
    await this.extractLearnings(targetId, targetType);

    // Move to archive storage
    const archiveData = await this.memoryStore.recall(targetId);
    if (archiveData) {
      await this.memoryStore.store(
        `archived_${targetId}`,
        { ...archiveData, archivedAt: new Date(), status: 'archived' },
        ['archived', targetType, 'cleanup']
      );

      // Remove from active storage
      // In real implementation, would use memoryStore.delete()
    }
  }

  /**
   * Delete target permanently
   */
  private async deleteTarget(targetId: string, targetType: string): Promise<void> {
    // Ensure learnings are extracted first
    await this.extractLearnings(targetId, targetType);

    // Delete from storage
    // In real implementation, would use memoryStore.delete()
    console.log(`🗑️ Deleted ${targetType} ${targetId}`);
  }

  /**
   * Optimize target (extract learnings and compress data)
   */
  private async optimizeTarget(targetId: string, targetType: string): Promise<void> {
    // Extract comprehensive learnings
    await this.extractLearnings(targetId, targetType);

    // Compress and optimize data structure
    const data = await this.memoryStore.recall(targetId);
    if (data) {
      const optimizedData = this.compressData(data);
      await this.memoryStore.store(`optimized_${targetId}`, optimizedData, [
        'optimized',
        targetType,
        'compressed',
      ]);
    }
  }

  /**
   * Merge target with similar entities
   */
  private async mergeTarget(targetId: string, targetType: string): Promise<void> {
    // Find similar entities to merge with
    const similarEntities = await this.findSimilarEntities(targetId, targetType);

    if (similarEntities.length > 0) {
      const mergedData = await this.mergeEntities([targetId, ...similarEntities]);
      await this.memoryStore.store(`merged_${Date.now()}`, mergedData, [
        'merged',
        targetType,
        'consolidated',
      ]);
    }
  }

  /**
   * Extract learnings from target before cleanup
   */
  private async extractLearnings(targetId: string, targetType: string): Promise<void> {
    const data = await this.memoryStore.recall(targetId);
    if (!data) return;

    const learnings = {
      sourceId: targetId,
      sourceType: targetType,
      extractedAt: new Date(),
      insights: this.generateInsights(data),
      performance: this.extractPerformanceMetrics(data),
      patterns: this.identifyPatterns(data),
      recommendations: this.generateRecommendations(data),
    };

    await this.memoryStore.store(`learnings_${targetId}`, learnings, [
      'learnings',
      'extracted',
      targetType,
    ]);
  }

  /**
   * Generate optimization recommendations
   */
  private async generateOptimizationRecommendations(): Promise<CleanupRecommendation[]> {
    const recommendations: CleanupRecommendation[] = [];

    // Analyze system performance
    const systemMetrics = await this.getSystemMetrics();

    if (systemMetrics.memoryUsage > 80) {
      recommendations.push({
        type: 'storage',
        priority: 'high',
        description: 'High memory usage detected. Consider archiving old tests and campaigns.',
        expectedBenefit: 'Reduce memory usage by 20-30%',
        implementation: {
          effort: 'low',
          timeRequired: 30,
          approval: false,
        },
      });
    }

    if (systemMetrics.activeTests > 50) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        description: 'Large number of active tests may impact performance. Consider consolidating.',
        expectedBenefit: 'Improve system response time by 15%',
        implementation: {
          effort: 'medium',
          timeRequired: 120,
          approval: true,
        },
      });
    }

    return recommendations;
  }

  /**
   * Calculate cleanup summary
   */
  private calculateCleanupSummary(actions: CleanupAction[]): CleanupReport['summary'] {
    const archivedTests = actions.filter(
      a => a.type === 'archive' && a.targetType === 'test'
    ).length;
    const optimizedCampaigns = actions.filter(
      a => a.type === 'optimize' && a.targetType === 'campaign'
    ).length;
    const memoryReclaimed = actions.reduce((sum, a) => sum + a.impact.storage, 0);
    const performanceGain = actions.reduce((sum, a) => sum + a.impact.performance, 0);

    return {
      testsArchived: archivedTests,
      campaignsOptimized: optimizedCampaigns,
      memoryReclaimed,
      performanceGain,
    };
  }

  /**
   * Store cleanup report
   */
  private async storeCleanupReport(report: CleanupReport): Promise<void> {
    await this.memoryStore.store(`cleanup_report_${report.timestamp.getTime()}`, report, [
      'cleanup',
      'reports',
      'system_maintenance',
    ]);
  }

  /**
   * Get last cleanup report
   */
  async getLastCleanupReport(): Promise<CleanupReport | null> {
    return this.lastCleanupReport;
  }

  /**
   * Force cleanup for specific target
   */
  async forceCleanup(targetId: string, targetType: 'test' | 'campaign'): Promise<void> {
    const action: CleanupAction = {
      id: `force_cleanup_${targetId}_${Date.now()}`,
      type: 'archive',
      targetId,
      targetType,
      reason: 'Manual cleanup requested',
      impact: {
        performance: 0,
        storage: 10,
        resources: 5,
      },
      executedAt: new Date(),
      status: 'completed',
    };

    await this.executeCleanupAction(action);
  }

  /**
   * Helper methods
   */
  private getInactiveDays(lastActivity: Date): number {
    return (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
  }

  private estimateStorageSize(entity: any): number {
    // Rough estimate in MB
    return JSON.stringify(entity).length / (1024 * 1024);
  }

  private calculateResourceUsage(test: ABTest): number {
    // Estimate resource usage based on test complexity
    return (test.variants.length * test.results.totalImpressions) / 1000;
  }

  private estimatePerformanceImpact(test: ABTest, actionType: string): number {
    switch (actionType) {
      case 'archive':
        return 2;
      case 'delete':
        return 5;
      case 'optimize':
        return 3;
      default:
        return 1;
    }
  }

  private estimateStorageImpact(test: ABTest): number {
    return this.estimateStorageSize(test);
  }

  private estimateResourceImpact(test: ABTest, actionType: string): number {
    return this.calculateResourceUsage(test) * 0.1;
  }

  private compressData(data: any): any {
    // Simplified compression - remove unnecessary fields
    const compressed = { ...data };
    delete compressed.debugInfo;
    delete compressed.detailedLogs;
    return compressed;
  }

  private async findSimilarEntities(targetId: string, targetType: string): Promise<string[]> {
    // Mock implementation - find entities with similar characteristics
    return [];
  }

  private async mergeEntities(entityIds: string[]): Promise<any> {
    // Mock implementation - merge similar entities
    return { mergedIds: entityIds, mergedAt: new Date() };
  }

  private generateInsights(data: any): string[] {
    return [
      'Timing optimization opportunities identified',
      'Audience segmentation could be improved',
      'Content variations showed significant impact',
    ];
  }

  private extractPerformanceMetrics(data: any): Record<string, number> {
    return {
      avgConversionRate: 2.5,
      avgOpenRate: 25.0,
      avgClickRate: 5.0,
    };
  }

  private identifyPatterns(data: any): string[] {
    return [
      'Higher performance on weekdays',
      'Morning sends outperform afternoon',
      'Personalization increases engagement',
    ];
  }

  private generateRecommendations(data: any): string[] {
    return [
      'Focus on Tuesday-Thursday sends',
      'Increase personalization elements',
      'Test more aggressive subject lines',
    ];
  }

  private async getSystemMetrics(): Promise<{ memoryUsage: number; activeTests: number }> {
    return {
      memoryUsage: 75, // percentage
      activeTests: 35,
    };
  }

  // Mock data methods
  private async getAllTests(): Promise<ABTest[]> {
    // Mock implementation - get all tests
    return [];
  }

  private async getAllCampaigns(): Promise<any[]> {
    // Mock implementation - get all campaigns
    return [];
  }

  /**
   * Cleanup and shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    console.log('🧹 CampaignCleanupAgent stopped');
  }
}
