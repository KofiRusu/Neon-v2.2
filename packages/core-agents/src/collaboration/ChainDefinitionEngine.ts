import { 
  AgentType, 
  ChainType,
  ChainExecutionMode,
  ChainCategory,
  ChainComplexity,
  ChainStepType,
  PrismaClient 
} from '@neon/data-model';
import { ChainDefinition, ChainStepDefinition, SuccessCriteria } from './AgentChainOrchestrator';

export interface ChainGoal {
  primary: string;
  secondary?: string[];
  targetMetrics?: {
    name: string;
    target: number;
    operator: 'greater_than' | 'less_than' | 'equals';
  }[];
  constraints?: {
    maxCost?: number;
    maxTime?: number;
    requiredAgents?: AgentType[];
    forbiddenAgents?: AgentType[];
  };
}

export interface ChainTemplate {
  id: string;
  name: string;
  description: string;
  category: ChainCategory;
  complexity: ChainComplexity;
  definition: ChainDefinition;
  agentTypes: AgentType[];
  successRate: number;
  averageCost: number;
  averageExecutionTime: number;
}

export interface DynamicChainRequest {
  goal: ChainGoal;
  context?: {
    campaignId?: string;
    industry?: string;
    region?: string;
    language?: string;
  };
  preferences?: {
    preferredAgents?: AgentType[];
    executionMode?: ChainExecutionMode;
    maxSteps?: number;
    prioritizeSpeed?: boolean;
    prioritizeCost?: boolean;
    prioritizeQuality?: boolean;
  };
}

export interface ChainRecommendation {
  template?: ChainTemplate;
  customChain?: ChainDefinition;
  confidence: number;
  reasoning: string;
  expectedOutcome: {
    successProbability: number;
    estimatedCost: number;
    estimatedTime: number;
    qualityScore: number;
  };
  alternatives?: ChainRecommendation[];
}

export class ChainDefinitionEngine {
  private prisma: PrismaClient;
  private predefinedTemplates: Map<string, ChainTemplate> = new Map();
  private agentCapabilities: Map<AgentType, AgentCapability> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.initializePredefinedTemplates();
    this.initializeAgentCapabilities();
  }

  /**
   * Generate a chain recommendation based on goals
   */
  public async recommendChain(request: DynamicChainRequest): Promise<ChainRecommendation> {
    console.log(`Generating chain recommendation for goal: ${request.goal.primary}`);

    // First, try to find a matching template
    const templateMatch = await this.findMatchingTemplate(request);
    
    if (templateMatch && templateMatch.confidence > 0.8) {
      return templateMatch;
    }

    // If no good template match, generate a custom chain
    const customChain = await this.generateCustomChain(request);
    
    return {
      customChain,
      confidence: 0.75,
      reasoning: 'Generated custom chain based on goal analysis and agent capabilities',
      expectedOutcome: await this.estimateChainOutcome(customChain),
      alternatives: templateMatch ? [templateMatch] : undefined
    };
  }

  /**
   * Get all available templates
   */
  public async getAvailableTemplates(filters?: {
    category?: ChainCategory;
    complexity?: ChainComplexity;
    agentTypes?: AgentType[];
  }): Promise<ChainTemplate[]> {
    const templates = Array.from(this.predefinedTemplates.values());
    
    if (!filters) return templates;

    return templates.filter(template => {
      if (filters.category && template.category !== filters.category) return false;
      if (filters.complexity && template.complexity !== filters.complexity) return false;
      if (filters.agentTypes && !filters.agentTypes.every(agent => template.agentTypes.includes(agent))) return false;
      return true;
    });
  }

  /**
   * Create a new custom template
   */
  public async createCustomTemplate(
    name: string,
    description: string,
    definition: ChainDefinition,
    category: ChainCategory,
    createdBy?: string
  ): Promise<ChainTemplate> {
    const template: ChainTemplate = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      category,
      complexity: this.determineComplexity(definition),
      definition,
      agentTypes: definition.steps.map(step => step.agentType),
      successRate: 0.5, // Default for new templates
      averageCost: 0,
      averageExecutionTime: 0
    };

    // Save to database
    await this.saveTemplateToDatabase(template, createdBy);
    
    // Add to local cache
    this.predefinedTemplates.set(template.id, template);

    return template;
  }

  /**
   * Generate a custom chain based on goals
   */
  private async generateCustomChain(request: DynamicChainRequest): Promise<ChainDefinition> {
    const goal = request.goal;
    const preferences = request.preferences || {};

    // Analyze goal to determine required agents
    const requiredAgents = await this.analyzeGoalForAgents(goal.primary, goal.secondary);
    
    // Apply constraints and preferences
    const filteredAgents = this.applyAgentConstraints(requiredAgents, goal.constraints, preferences);
    
    // Determine optimal execution order
    const orderedSteps = await this.determineExecutionOrder(filteredAgents, goal);
    
    // Generate chain definition
    const chainDefinition: ChainDefinition = {
      name: `Custom Chain: ${goal.primary}`,
      description: `Dynamically generated chain for: ${goal.primary}`,
      chainType: this.determineChainType(orderedSteps, preferences),
      executionMode: preferences.executionMode || ChainExecutionMode.SEQUENTIAL,
      steps: orderedSteps,
      successCriteria: this.generateSuccessCriteria(goal),
      maxRetries: 3,
      timeoutMinutes: goal.constraints?.maxTime || 60,
      budgetLimit: goal.constraints?.maxCost
    };

    return chainDefinition;
  }

  /**
   * Find matching template for request
   */
  private async findMatchingTemplate(request: DynamicChainRequest): Promise<ChainRecommendation | null> {
    const goal = request.goal;
    const templates = Array.from(this.predefinedTemplates.values());
    
    let bestMatch: ChainTemplate | null = null;
    let bestScore = 0;

    for (const template of templates) {
      const score = this.calculateTemplateMatchScore(template, request);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = template;
      }
    }

    if (bestMatch && bestScore > 0.6) {
      return {
        template: bestMatch,
        confidence: bestScore,
        reasoning: `Template "${bestMatch.name}" matches your goal with ${(bestScore * 100).toFixed(1)}% confidence`,
        expectedOutcome: {
          successProbability: bestMatch.successRate,
          estimatedCost: bestMatch.averageCost,
          estimatedTime: bestMatch.averageExecutionTime,
          qualityScore: 0.85
        }
      };
    }

    return null;
  }

  /**
   * Calculate how well a template matches a request
   */
  private calculateTemplateMatchScore(template: ChainTemplate, request: DynamicChainRequest): number {
    let score = 0;
    const goal = request.goal;

    // Goal matching (40% weight)
    const goalScore = this.calculateGoalMatchScore(template, goal);
    score += goalScore * 0.4;

    // Agent matching (30% weight)
    const agentScore = this.calculateAgentMatchScore(template, request);
    score += agentScore * 0.3;

    // Constraint matching (20% weight)
    const constraintScore = this.calculateConstraintMatchScore(template, goal.constraints);
    score += constraintScore * 0.2;

    // Performance matching (10% weight)
    const performanceScore = template.successRate;
    score += performanceScore * 0.1;

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Analyze goal text to determine required agents
   */
  private async analyzeGoalForAgents(primaryGoal: string, secondaryGoals?: string[]): Promise<AgentType[]> {
    const agents: AgentType[] = [];
    const goalText = [primaryGoal, ...(secondaryGoals || [])].join(' ').toLowerCase();

    // Content-related goals
    if (goalText.includes('content') || goalText.includes('post') || goalText.includes('write') || 
        goalText.includes('copy') || goalText.includes('article') || goalText.includes('blog')) {
      agents.push(AgentType.CONTENT_AGENT);
    }

    // SEO-related goals
    if (goalText.includes('seo') || goalText.includes('search') || goalText.includes('ranking') || 
        goalText.includes('keywords') || goalText.includes('optimize')) {
      agents.push(AgentType.SEO_AGENT);
    }

    // Social media goals
    if (goalText.includes('social') || goalText.includes('viral') || goalText.includes('engagement') || 
        goalText.includes('followers') || goalText.includes('share')) {
      agents.push(AgentType.SOCIAL_AGENT);
    }

    // Email marketing goals
    if (goalText.includes('email') || goalText.includes('newsletter') || goalText.includes('nurture') || 
        goalText.includes('campaign') || goalText.includes('subscribe')) {
      agents.push(AgentType.EMAIL_AGENT);
    }

    // Trend analysis goals
    if (goalText.includes('trend') || goalText.includes('viral') || goalText.includes('popular') || 
        goalText.includes('trending') || goalText.includes('market')) {
      agents.push(AgentType.TREND_AGENT);
    }

    // Support goals
    if (goalText.includes('support') || goalText.includes('help') || goalText.includes('customer') || 
        goalText.includes('service')) {
      agents.push(AgentType.SUPPORT_AGENT);
    }

    // If no specific agents identified, add insight agent for analysis
    if (agents.length === 0) {
      agents.push(AgentType.CONTENT_AGENT, AgentType.TREND_AGENT);
    }

    return agents;
  }

  /**
   * Initialize predefined chain templates
   */
  private initializePredefinedTemplates(): void {
    // Viral Content Chain
    this.predefinedTemplates.set('viral_content', {
      id: 'viral_content',
      name: 'Viral Content Creation',
      description: 'Create viral content by analyzing trends and optimizing for engagement',
      category: ChainCategory.CONTENT_CREATION,
      complexity: ChainComplexity.MODERATE,
      definition: {
        name: 'Viral Content Creation',
        description: 'End-to-end viral content creation process',
        chainType: ChainType.SEQUENTIAL,
        executionMode: ChainExecutionMode.SEQUENTIAL,
        steps: [
          {
            stepNumber: 0,
            stepName: 'Trend Analysis',
            stepType: ChainStepType.AGENT_EXECUTION,
            agentType: AgentType.TREND_AGENT,
            agentConfig: { focus: 'viral_content', timeframe: '24h' }
          },
          {
            stepNumber: 1,
            stepName: 'Content Generation',
            stepType: ChainStepType.AGENT_EXECUTION,
            agentType: AgentType.CONTENT_AGENT,
            dependsOn: [0],
            agentConfig: { style: 'viral', optimize_for: 'engagement' }
          },
          {
            stepNumber: 2,
            stepName: 'Social Optimization',
            stepType: ChainStepType.AGENT_EXECUTION,
            agentType: AgentType.SOCIAL_AGENT,
            dependsOn: [1],
            agentConfig: { platforms: ['instagram', 'tiktok', 'twitter'] }
          }
        ],
        successCriteria: {
          minStepsCompleted: 3,
          minQualityScore: 0.7
        }
      },
      agentTypes: [AgentType.TREND_AGENT, AgentType.CONTENT_AGENT, AgentType.SOCIAL_AGENT],
      successRate: 0.85,
      averageCost: 0.15,
      averageExecutionTime: 180000 // 3 minutes
    });

    // Lead Nurture Chain
    this.predefinedTemplates.set('lead_nurture', {
      id: 'lead_nurture',
      name: 'Lead Nurturing Campaign',
      description: 'Comprehensive lead nurturing with personalized content and email sequences',
      category: ChainCategory.LEAD_GENERATION,
      complexity: ChainComplexity.COMPLEX,
      definition: {
        name: 'Lead Nurturing Campaign',
        description: 'Multi-touch lead nurturing process',
        chainType: ChainType.SEQUENTIAL,
        executionMode: ChainExecutionMode.SEQUENTIAL,
        steps: [
          {
            stepNumber: 0,
            stepName: 'Market Research',
            stepType: ChainStepType.AGENT_EXECUTION,
            agentType: AgentType.TREND_AGENT,
            agentConfig: { focus: 'lead_behavior', analysis_depth: 'deep' }
          },
          {
            stepNumber: 1,
            stepName: 'Educational Content',
            stepType: ChainStepType.AGENT_EXECUTION,
            agentType: AgentType.CONTENT_AGENT,
            dependsOn: [0],
            agentConfig: { type: 'educational', format: 'multi' }
          },
          {
            stepNumber: 2,
            stepName: 'Email Sequence',
            stepType: ChainStepType.AGENT_EXECUTION,
            agentType: AgentType.EMAIL_AGENT,
            dependsOn: [1],
            agentConfig: { sequence_type: 'nurture', personalization: 'high' }
          },
          {
            stepNumber: 3,
            stepName: 'Follow-up Support',
            stepType: ChainStepType.AGENT_EXECUTION,
            agentType: AgentType.SUPPORT_AGENT,
            dependsOn: [2],
            agentConfig: { mode: 'proactive', channels: ['email', 'chat'] }
          }
        ],
        successCriteria: {
          minStepsCompleted: 4,
          minQualityScore: 0.8
        }
      },
      agentTypes: [AgentType.TREND_AGENT, AgentType.CONTENT_AGENT, AgentType.EMAIL_AGENT, AgentType.SUPPORT_AGENT],
      successRate: 0.78,
      averageCost: 0.25,
      averageExecutionTime: 300000 // 5 minutes
    });

    // SEO Optimization Chain
    this.predefinedTemplates.set('seo_optimization', {
      id: 'seo_optimization',
      name: 'SEO Optimization Campaign',
      description: 'Complete SEO optimization with content and technical improvements',
      category: ChainCategory.SEO_OPTIMIZATION,
      complexity: ChainComplexity.MODERATE,
      definition: {
        name: 'SEO Optimization Campaign',
        description: 'Comprehensive SEO improvement process',
        chainType: ChainType.PARALLEL,
        executionMode: ChainExecutionMode.PARALLEL,
        steps: [
          {
            stepNumber: 0,
            stepName: 'Keyword Research',
            stepType: ChainStepType.AGENT_EXECUTION,
            agentType: AgentType.SEO_AGENT,
            agentConfig: { task: 'keyword_research', depth: 'comprehensive' }
          },
          {
            stepNumber: 1,
            stepName: 'Content Optimization',
            stepType: ChainStepType.AGENT_EXECUTION,
            agentType: AgentType.CONTENT_AGENT,
            dependsOn: [0],
            agentConfig: { optimize_for: 'seo', keyword_integration: 'natural' }
          },
          {
            stepNumber: 2,
            stepName: 'Technical SEO',
            stepType: ChainStepType.AGENT_EXECUTION,
            agentType: AgentType.SEO_AGENT,
            agentConfig: { task: 'technical_audit', fix_issues: true }
          }
        ],
        successCriteria: {
          minStepsCompleted: 3,
          minQualityScore: 0.75
        }
      },
      agentTypes: [AgentType.SEO_AGENT, AgentType.CONTENT_AGENT],
      successRate: 0.82,
      averageCost: 0.18,
      averageExecutionTime: 240000 // 4 minutes
    });
  }

  /**
   * Initialize agent capabilities
   */
  private initializeAgentCapabilities(): void {
    this.agentCapabilities.set(AgentType.CONTENT_AGENT, {
      strengths: ['content_creation', 'copywriting', 'storytelling', 'seo_content'],
      weaknesses: ['technical_analysis', 'data_processing'],
      avgExecutionTime: 60000,
      avgCost: 0.05,
      successRate: 0.88
    });

    this.agentCapabilities.set(AgentType.TREND_AGENT, {
      strengths: ['market_analysis', 'trend_detection', 'data_analysis', 'insights'],
      weaknesses: ['content_creation', 'customer_interaction'],
      avgExecutionTime: 45000,
      avgCost: 0.04,
      successRate: 0.85
    });

    this.agentCapabilities.set(AgentType.SEO_AGENT, {
      strengths: ['keyword_research', 'technical_seo', 'optimization', 'analytics'],
      weaknesses: ['creative_content', 'social_media'],
      avgExecutionTime: 90000,
      avgCost: 0.06,
      successRate: 0.83
    });

    this.agentCapabilities.set(AgentType.SOCIAL_AGENT, {
      strengths: ['social_media', 'engagement', 'viral_content', 'community'],
      weaknesses: ['technical_analysis', 'long_form_content'],
      avgExecutionTime: 30000,
      avgCost: 0.03,
      successRate: 0.86
    });

    this.agentCapabilities.set(AgentType.EMAIL_AGENT, {
      strengths: ['email_marketing', 'automation', 'personalization', 'sequences'],
      weaknesses: ['social_media', 'seo_technical'],
      avgExecutionTime: 75000,
      avgCost: 0.05,
      successRate: 0.87
    });

    this.agentCapabilities.set(AgentType.SUPPORT_AGENT, {
      strengths: ['customer_service', 'problem_solving', 'communication', 'empathy'],
      weaknesses: ['content_creation', 'technical_optimization'],
      avgExecutionTime: 50000,
      avgCost: 0.04,
      successRate: 0.89
    });
  }

  // Utility methods
  private determineComplexity(definition: ChainDefinition): ChainComplexity {
    const stepCount = definition.steps.length;
    const hasConditions = definition.conditions && definition.conditions.length > 0;
    const hasParallel = definition.executionMode === ChainExecutionMode.PARALLEL;

    if (stepCount <= 3 && !hasConditions && !hasParallel) return ChainComplexity.SIMPLE;
    if (stepCount <= 5) return ChainComplexity.MODERATE;
    if (stepCount <= 8) return ChainComplexity.COMPLEX;
    return ChainComplexity.ADVANCED;
  }

  private calculateGoalMatchScore(template: ChainTemplate, goal: ChainGoal): number {
    // Simplified goal matching based on keywords and category
    const goalText = goal.primary.toLowerCase();
    const templateName = template.name.toLowerCase();
    const templateDesc = template.description.toLowerCase();

    let score = 0;

    // Direct keyword matching
    const keywords = goalText.split(' ');
    for (const keyword of keywords) {
      if (templateName.includes(keyword) || templateDesc.includes(keyword)) {
        score += 0.2;
      }
    }

    // Category-based matching
    const categoryMatches = {
      'content': ChainCategory.CONTENT_CREATION,
      'lead': ChainCategory.LEAD_GENERATION,
      'seo': ChainCategory.SEO_OPTIMIZATION,
      'social': ChainCategory.SOCIAL_MEDIA,
      'email': ChainCategory.EMAIL_MARKETING,
      'support': ChainCategory.CUSTOMER_SUPPORT
    };

    for (const [keyword, category] of Object.entries(categoryMatches)) {
      if (goalText.includes(keyword) && template.category === category) {
        score += 0.4;
        break;
      }
    }

    return Math.min(1, score);
  }

  private calculateAgentMatchScore(template: ChainTemplate, request: DynamicChainRequest): number {
    const preferences = request.preferences;
    if (!preferences?.preferredAgents) return 0.5; // Neutral score

    const overlap = template.agentTypes.filter(agent => 
      preferences.preferredAgents!.includes(agent)
    ).length;

    return overlap / Math.max(template.agentTypes.length, preferences.preferredAgents.length);
  }

  private calculateConstraintMatchScore(template: ChainTemplate, constraints?: any): number {
    if (!constraints) return 1; // No constraints = perfect match

    let score = 1;

    if (constraints.maxCost && template.averageCost > constraints.maxCost) {
      score -= 0.3;
    }

    if (constraints.maxTime && template.averageExecutionTime > constraints.maxTime * 1000) {
      score -= 0.3;
    }

    if (constraints.requiredAgents) {
      const hasRequired = constraints.requiredAgents.every((agent: AgentType) => 
        template.agentTypes.includes(agent)
      );
      if (!hasRequired) score -= 0.4;
    }

    if (constraints.forbiddenAgents) {
      const hasForbidden = constraints.forbiddenAgents.some((agent: AgentType) => 
        template.agentTypes.includes(agent)
      );
      if (hasForbidden) score -= 0.5;
    }

    return Math.max(0, score);
  }

  private applyAgentConstraints(
    agents: AgentType[], 
    constraints?: any, 
    preferences?: any
  ): AgentType[] {
    let filtered = [...agents];

    // Apply forbidden agents constraint
    if (constraints?.forbiddenAgents) {
      filtered = filtered.filter(agent => !constraints.forbiddenAgents.includes(agent));
    }

    // Add required agents
    if (constraints?.requiredAgents) {
      for (const agent of constraints.requiredAgents) {
        if (!filtered.includes(agent)) {
          filtered.push(agent);
        }
      }
    }

    // Apply preferred agents if available
    if (preferences?.preferredAgents) {
      const preferred = preferences.preferredAgents.filter((agent: AgentType) => 
        filtered.includes(agent)
      );
      if (preferred.length > 0) {
        filtered = preferred;
      }
    }

    return filtered;
  }

  private async determineExecutionOrder(agents: AgentType[], goal: ChainGoal): Promise<ChainStepDefinition[]> {
    const steps: ChainStepDefinition[] = [];
    
    // Define logical dependencies between agents
    const dependencies: Record<AgentType, AgentType[]> = {
      [AgentType.CONTENT_AGENT]: [AgentType.TREND_AGENT, AgentType.SEO_AGENT],
      [AgentType.SOCIAL_AGENT]: [AgentType.CONTENT_AGENT, AgentType.TREND_AGENT],
      [AgentType.EMAIL_AGENT]: [AgentType.CONTENT_AGENT],
      [AgentType.SUPPORT_AGENT]: [AgentType.EMAIL_AGENT, AgentType.SOCIAL_AGENT],
      [AgentType.SEO_AGENT]: [],
      [AgentType.TREND_AGENT]: []
    };

    // Sort agents based on dependencies
    const sorted = this.topologicalSort(agents, dependencies);

    // Create step definitions
    for (let i = 0; i < sorted.length; i++) {
      const agent = sorted[i];
      const dependsOn: number[] = [];

      // Find dependencies in the current chain
      const agentDeps = dependencies[agent] || [];
      for (const dep of agentDeps) {
        const depIndex = sorted.indexOf(dep);
        if (depIndex !== -1 && depIndex < i) {
          dependsOn.push(depIndex);
        }
      }

      steps.push({
        stepNumber: i,
        stepName: `${agent.replace('_AGENT', '').toLowerCase()} execution`,
        stepType: ChainStepType.AGENT_EXECUTION,
        agentType: agent,
        dependsOn: dependsOn.length > 0 ? dependsOn : undefined,
        agentConfig: this.getDefaultAgentConfig(agent, goal)
      });
    }

    return steps;
  }

  private topologicalSort(agents: AgentType[], dependencies: Record<AgentType, AgentType[]>): AgentType[] {
    const visited = new Set<AgentType>();
    const temp = new Set<AgentType>();
    const result: AgentType[] = [];

    const visit = (agent: AgentType) => {
      if (temp.has(agent)) return; // Cycle detection (simplified)
      if (visited.has(agent)) return;

      temp.add(agent);
      
      const deps = dependencies[agent] || [];
      for (const dep of deps) {
        if (agents.includes(dep)) {
          visit(dep);
        }
      }

      temp.delete(agent);
      visited.add(agent);
      result.push(agent);
    };

    for (const agent of agents) {
      if (!visited.has(agent)) {
        visit(agent);
      }
    }

    return result;
  }

  private getDefaultAgentConfig(agent: AgentType, goal: ChainGoal): Record<string, any> {
    const baseConfig = {
      goal: goal.primary,
      context: goal.secondary
    };

    switch (agent) {
      case AgentType.TREND_AGENT:
        return { ...baseConfig, analysis_type: 'market_trends', timeframe: '7d' };
      case AgentType.CONTENT_AGENT:
        return { ...baseConfig, content_type: 'multi_format', optimization: 'engagement' };
      case AgentType.SEO_AGENT:
        return { ...baseConfig, focus: 'optimization', include_technical: true };
      case AgentType.SOCIAL_AGENT:
        return { ...baseConfig, platforms: 'auto_select', engagement_focus: true };
      case AgentType.EMAIL_AGENT:
        return { ...baseConfig, campaign_type: 'automated', personalization: 'medium' };
      case AgentType.SUPPORT_AGENT:
        return { ...baseConfig, mode: 'proactive', response_style: 'helpful' };
      default:
        return baseConfig;
    }
  }

  private determineChainType(steps: ChainStepDefinition[], preferences?: any): ChainType {
    const hasDependencies = steps.some(step => step.dependsOn && step.dependsOn.length > 0);
    
    if (!hasDependencies) return ChainType.PARALLEL;
    if (preferences?.prioritizeSpeed) return ChainType.PARALLEL;
    return ChainType.SEQUENTIAL;
  }

  private generateSuccessCriteria(goal: ChainGoal): SuccessCriteria {
    const criteria: SuccessCriteria = {
      minQualityScore: 0.7,
      maxErrorRate: 0.2
    };

    // Add custom criteria based on goal
    if (goal.targetMetrics) {
      criteria.customConditions = {
        targetMetrics: goal.targetMetrics
      };
    }

    return criteria;
  }

  private async estimateChainOutcome(chain: ChainDefinition): Promise<{
    successProbability: number;
    estimatedCost: number;
    estimatedTime: number;
    qualityScore: number;
  }> {
    let totalCost = 0;
    let totalTime = 0;
    let avgSuccessRate = 0;
    let avgQuality = 0;

    for (const step of chain.steps) {
      const capability = this.agentCapabilities.get(step.agentType);
      if (capability) {
        totalCost += capability.avgCost;
        totalTime += capability.avgExecutionTime;
        avgSuccessRate += capability.successRate;
        avgQuality += 0.8; // Default quality estimate
      }
    }

    return {
      successProbability: avgSuccessRate / chain.steps.length,
      estimatedCost: totalCost,
      estimatedTime: totalTime,
      qualityScore: avgQuality / chain.steps.length
    };
  }

  private async saveTemplateToDatabase(template: ChainTemplate, createdBy?: string): Promise<void> {
    await this.prisma.chainTemplate.create({
      data: {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        templateData: template.definition,
        agentTypes: template.agentTypes,
        complexity: template.complexity,
        usageCount: 0,
        successRate: template.successRate,
        averageCost: template.averageCost,
        averageExecutionTime: template.averageExecutionTime,
        useCase: 'general',
        tags: [],
        isOfficial: true,
        isVerified: true,
        version: '1.0',
        createdBy
      }
    });
  }
}

// Supporting interfaces
interface AgentCapability {
  strengths: string[];
  weaknesses: string[];
  avgExecutionTime: number;
  avgCost: number;
  successRate: number;
}

export default ChainDefinitionEngine; 