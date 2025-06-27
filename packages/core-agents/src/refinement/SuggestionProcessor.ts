import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { AgentType } from '@prisma/client';

export interface RefinementTask {
  id: string;
  agentType: AgentType;
  taskType:
    | 'PROMPT_SIMPLIFICATION'
    | 'MODEL_DOWNGRADE'
    | 'RETRY_OPTIMIZATION'
    | 'QUALITY_ENHANCEMENT';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  expectedSavings: number;
  implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  parameters: Record<string, unknown>;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
}

export interface OptimizationSuggestion {
  agentType: string;
  priority: string;
  category: string;
  suggestion: string;
  expectedSavings: number;
  implementationEffort: string;
}

export class SuggestionProcessor {
  private tasksQueue: RefinementTask[] = [];
  private reportsDir: string;

  constructor() {
    this.reportsDir = join(process.cwd(), 'logs', 'optimization');
  }

  /**
   * Parse optimization report and extract actionable suggestions
   */
  async parseOptimizationReport(reportPath?: string): Promise<RefinementTask[]> {
    const defaultReportPath = join(this.reportsDir, 'agent-efficiency-report.md');
    const targetPath = reportPath || defaultReportPath;

    if (!existsSync(targetPath)) {
      throw new Error(`Optimization report not found at: ${targetPath}`);
    }

    const reportContent = readFileSync(targetPath, 'utf8');
    const suggestions = this.extractSuggestionsFromMarkdown(reportContent);

    const tasks: RefinementTask[] = [];

    for (const suggestion of suggestions) {
      const task = await this.convertSuggestionToTask(suggestion);
      if (task) {
        tasks.push(task);
      }
    }

    this.tasksQueue.push(...tasks);
    return tasks;
  }

  /**
   * Extract optimization suggestions from markdown report
   */
  private extractSuggestionsFromMarkdown(content: string): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Parse High Priority suggestions
    const highPrioritySection = this.extractSection(
      content,
      '### High Priority',
      '### Medium Priority'
    );
    const highPrioritySuggestions = this.parseSuggestionSection(highPrioritySection, 'HIGH');
    suggestions.push(...highPrioritySuggestions);

    // Parse Medium Priority suggestions
    const mediumPrioritySection = this.extractSection(content, '### Medium Priority', '---');
    const mediumPrioritySuggestions = this.parseSuggestionSection(mediumPrioritySection, 'MEDIUM');
    suggestions.push(...mediumPrioritySuggestions);

    return suggestions;
  }

  /**
   * Extract a section between two markers from markdown content
   */
  private extractSection(content: string, startMarker: string, endMarker: string): string {
    const startIndex = content.indexOf(startMarker);
    if (startIndex === -1) return '';

    const endIndex = content.indexOf(endMarker, startIndex + startMarker.length);
    if (endIndex === -1) return content.substring(startIndex);

    return content.substring(startIndex, endIndex);
  }

  /**
   * Parse suggestions from a markdown section
   */
  private parseSuggestionSection(
    sectionContent: string,
    priority: string
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Split by #### to get individual suggestions
    const suggestionBlocks = sectionContent.split('####').slice(1); // Remove first empty element

    for (const block of suggestionBlocks) {
      const suggestion = this.parseSuggestionBlock(block, priority);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  /**
   * Parse individual suggestion block
   */
  private parseSuggestionBlock(block: string, priority: string): OptimizationSuggestion | null {
    const lines = block.trim().split('\n');
    if (lines.length === 0) return null;

    // Extract agent type and category from first line
    const titleMatch = lines[0].match(/^(.+?)\s*-\s*(.+)$/);
    if (!titleMatch) return null;

    const agentType = titleMatch[1].trim();
    const category = titleMatch[2].trim();

    // Extract suggestion text
    const suggestionLine = lines.find(line => line.includes('**Suggestion:**'));
    const suggestion = suggestionLine
      ? suggestionLine.replace(/\*\*Suggestion:\*\*\s*/, '').trim()
      : '';

    // Extract expected savings
    const savingsLine = lines.find(line => line.includes('**Expected Savings:**'));
    const expectedSavings = savingsLine
      ? parseFloat(savingsLine.match(/\$([0-9.]+)/)?.[1] || '0')
      : 0;

    // Extract implementation effort
    const effortLine = lines.find(line => line.includes('**Implementation:**'));
    const implementationEffort = effortLine
      ? effortLine
          .replace(/\*\*Implementation:\*\*\s*/, '')
          .replace(' effort', '')
          .trim()
      : 'MEDIUM';

    return {
      agentType,
      priority,
      category,
      suggestion,
      expectedSavings,
      implementationEffort,
    };
  }

  /**
   * Convert optimization suggestion to refinement task
   */
  private async convertSuggestionToTask(
    suggestion: OptimizationSuggestion
  ): Promise<RefinementTask | null> {
    const agentType = this.mapStringToAgentType(suggestion.agentType);
    if (!agentType) return null;

    const taskType = this.determineTaskType(suggestion);
    const parameters = this.extractTaskParameters(suggestion);

    const task: RefinementTask = {
      id: this.generateTaskId(),
      agentType,
      taskType,
      priority: suggestion.priority as 'HIGH' | 'MEDIUM' | 'LOW',
      description: suggestion.suggestion,
      expectedSavings: suggestion.expectedSavings,
      implementationEffort: suggestion.implementationEffort as 'LOW' | 'MEDIUM' | 'HIGH',
      parameters,
      status: 'PENDING',
      createdAt: new Date(),
    };

    return task;
  }

  /**
   * Map string agent type to AgentType enum
   */
  private mapStringToAgentType(agentTypeString: string): AgentType | null {
    const mapping: Record<string, AgentType> = {
      CONTENT: AgentType.CONTENT,
      AD: AgentType.AD,
      SEO: AgentType.SEO,
      SOCIAL: AgentType.SOCIAL,
      EMAIL: AgentType.EMAIL,
      TREND: AgentType.TREND,
      INSIGHT: AgentType.INSIGHT,
      DESIGN: AgentType.DESIGN,
      WHATSAPP: AgentType.WHATSAPP,
      SUPPORT: AgentType.SUPPORT,
      BRAND_VOICE: AgentType.BRAND_VOICE,
      CAMPAIGN: AgentType.CAMPAIGN,
      OUTREACH: AgentType.OUTREACH,
    };

    return mapping[agentTypeString.toUpperCase()] || null;
  }

  /**
   * Determine task type from suggestion
   */
  private determineTaskType(suggestion: OptimizationSuggestion): RefinementTask['taskType'] {
    const suggestionText = suggestion.suggestion.toLowerCase();

    if (suggestionText.includes('gpt-4o-mini') || suggestionText.includes('model')) {
      return 'MODEL_DOWNGRADE';
    }
    if (
      suggestionText.includes('prompt') &&
      (suggestionText.includes('simplify') || suggestionText.includes('reduce'))
    ) {
      return 'PROMPT_SIMPLIFICATION';
    }
    if (suggestionText.includes('retry') || suggestionText.includes('error handling')) {
      return 'RETRY_OPTIMIZATION';
    }
    if (suggestionText.includes('quality') || suggestionText.includes('refine')) {
      return 'QUALITY_ENHANCEMENT';
    }

    return 'PROMPT_SIMPLIFICATION'; // Default
  }

  /**
   * Extract task-specific parameters from suggestion
   */
  private extractTaskParameters(suggestion: OptimizationSuggestion): Record<string, unknown> {
    const parameters: Record<string, unknown> = {};
    const suggestionText = suggestion.suggestion;

    // Extract cost reduction percentage
    const costMatch = suggestionText.match(/from \$([0-9.]+) to.*?\$([0-9.]+)/);
    if (costMatch) {
      parameters.currentCost = parseFloat(costMatch[1]);
      parameters.targetCost = parseFloat(costMatch[2]);
      parameters.costReduction =
        (((parameters.currentCost as number) - parameters.targetCost) as number) /
        (parameters.currentCost as number);
    }

    // Extract retry rate targets
    const retryMatch = suggestionText.match(/from ([0-9.]+) to <([0-9.]+)/);
    if (retryMatch) {
      parameters.currentRetryRate = parseFloat(retryMatch[1]);
      parameters.targetRetryRate = parseFloat(retryMatch[2]);
    }

    // Extract quality score targets
    const qualityMatch = suggestionText.match(/from ([0-9.]+) to >([0-9.]+)/);
    if (qualityMatch) {
      parameters.currentQualityScore = parseFloat(qualityMatch[1]);
      parameters.targetQualityScore = parseFloat(qualityMatch[2]);
    }

    // Extract model suggestions
    if (suggestionText.includes('gpt-4o-mini')) {
      parameters.targetModel = 'gpt-4o-mini';
    }

    return parameters;
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `task_${timestamp}_${random}`;
  }

  /**
   * Get pending tasks
   */
  getPendingTasks(): RefinementTask[] {
    return this.tasksQueue.filter(task => task.status === 'PENDING');
  }

  /**
   * Get tasks by agent type
   */
  getTasksByAgent(agentType: AgentType): RefinementTask[] {
    return this.tasksQueue.filter(task => task.agentType === agentType);
  }

  /**
   * Get tasks by type
   */
  getTasksByType(taskType: RefinementTask['taskType']): RefinementTask[] {
    return this.tasksQueue.filter(task => task.taskType === taskType);
  }

  /**
   * Update task status
   */
  updateTaskStatus(taskId: string, status: RefinementTask['status']): boolean {
    const task = this.tasksQueue.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      return true;
    }
    return false;
  }

  /**
   * Get tasks summary
   */
  getTasksSummary(): {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
    totalSavings: number;
  } {
    const total = this.tasksQueue.length;
    const pending = this.tasksQueue.filter(t => t.status === 'PENDING').length;
    const inProgress = this.tasksQueue.filter(t => t.status === 'IN_PROGRESS').length;
    const completed = this.tasksQueue.filter(t => t.status === 'COMPLETED').length;
    const failed = this.tasksQueue.filter(t => t.status === 'FAILED').length;
    const totalSavings = this.tasksQueue.reduce((sum, task) => sum + task.expectedSavings, 0);

    return {
      total,
      pending,
      inProgress,
      completed,
      failed,
      totalSavings,
    };
  }

  /**
   * Clear completed tasks
   */
  clearCompletedTasks(): number {
    const initialLength = this.tasksQueue.length;
    this.tasksQueue = this.tasksQueue.filter(task => task.status !== 'COMPLETED');
    return initialLength - this.tasksQueue.length;
  }
}
