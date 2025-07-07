import { 
  AgentType, 
  HandoffType,
  ChainExecutionContext,
  PrismaClient 
} from '@neon/data-model';

export interface HandoffData {
  fromAgent: AgentType;
  toAgent: AgentType;
  handoffType: HandoffType;
  data: Record<string, any>;
  context: HandoffContext;
  metadata?: Record<string, any>;
}

export interface HandoffContext {
  executionId: string;
  campaignId?: string;
  chainId?: string;
  preservedContext?: Record<string, any>;
  userContext?: Record<string, any>;
  performanceHints?: PerformanceHint[];
}

export interface PerformanceHint {
  type: 'optimization' | 'preference' | 'constraint' | 'priority';
  key: string;
  value: any;
  confidence: number;
  source: AgentType;
}

export interface HandoffValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  qualityScore: number;
  suggestions: string[];
}

export interface HandoffResult {
  success: boolean;
  handoffId: string;
  transferTime: number;
  dataSize: number;
  validation: HandoffValidation;
  optimizations?: HandoffOptimization[];
}

export interface HandoffOptimization {
  type: 'compression' | 'filtering' | 'transformation' | 'caching';
  description: string;
  savedTime: number;
  savedSize: number;
}

export interface CommunicationChannel {
  fromAgent: AgentType;
  toAgent: AgentType;
  protocol: string;
  encryption: boolean;
  compression: boolean;
  reliability: number;
  averageLatency: number;
}

export class AgentCommunicationProtocol {
  private prisma: PrismaClient;
  private channels: Map<string, CommunicationChannel> = new Map();
  private handoffHistory: Map<string, HandoffData[]> = new Map();
  private performanceMetrics: Map<string, any> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.initializeCommunicationChannels();
  }

  /**
   * Create a handoff between two agents
   */
  public async createHandoff(
    executionId: string,
    fromStepId: string,
    fromAgent: AgentType,
    agentResult: Record<string, any>,
    context: any
  ): Promise<HandoffResult> {
    const startTime = Date.now();

    try {
      // Determine target agent for next step
      const toAgent = await this.determineNextAgent(executionId, fromAgent);
      if (!toAgent) {
        throw new Error('No target agent found for handoff');
      }

      // Prepare handoff data
      const handoffData = await this.prepareHandoffData(
        fromAgent,
        toAgent,
        agentResult,
        context
      );

      // Validate handoff data
      const validation = await this.validateHandoffData(handoffData);
      if (!validation.isValid) {
        throw new Error(`Handoff validation failed: ${validation.errors.join(', ')}`);
      }

      // Optimize handoff if needed
      const optimizedData = await this.optimizeHandoff(handoffData);

      // Create handoff record
      const handoffRecord = await this.createHandoffRecord(
        executionId,
        fromStepId,
        optimizedData,
        validation
      );

      // Store handoff in history
      this.addToHandoffHistory(executionId, optimizedData);

      // Calculate performance metrics
      const transferTime = Date.now() - startTime;
      const dataSize = this.calculateDataSize(optimizedData.data);

      // Update performance metrics
      await this.updatePerformanceMetrics(fromAgent, toAgent, transferTime, dataSize);

      return {
        success: true,
        handoffId: handoffRecord.id,
        transferTime,
        dataSize,
        validation,
        optimizations: optimizedData.metadata?.optimizations
      };

    } catch (error) {
      console.error(`Handoff creation failed: ${error}`);
      
      return {
        success: false,
        handoffId: '',
        transferTime: Date.now() - startTime,
        dataSize: 0,
        validation: {
          isValid: false,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          warnings: [],
          qualityScore: 0,
          suggestions: []
        }
      };
    }
  }

  /**
   * Receive handoff data for an agent
   */
  public async receiveHandoff(
    executionId: string,
    toStepId: string,
    toAgent: AgentType
  ): Promise<{
    data: Record<string, any>;
    context: HandoffContext;
    performanceHints: PerformanceHint[];
  }> {
    try {
      // Find the most recent handoff for this agent
      const handoff = await this.prisma.agentHandoff.findFirst({
        where: {
          executionId,
          toStepId,
          toAgent
        },
        orderBy: { transferredAt: 'desc' },
        include: {
          fromStep: true,
          toStep: true
        }
      });

      if (!handoff) {
        throw new Error(`No handoff found for ${toAgent} in execution ${executionId}`);
      }

      // Parse handoff data
      const handoffData = handoff.handoffData as Record<string, any>;
      const contextData = handoff.contextData as Record<string, any>;
      const optimizationHints = handoff.optimizationHints as PerformanceHint[];

      // Update processing metrics
      await this.updateProcessingMetrics(handoff.id);

      return {
        data: handoffData,
        context: {
          executionId,
          campaignId: handoff.execution?.campaignId,
          chainId: handoff.execution?.chainId,
          preservedContext: contextData?.preserved,
          userContext: contextData?.user,
          performanceHints: optimizationHints
        },
        performanceHints: optimizationHints || []
      };

    } catch (error) {
      console.error(`Handoff receive failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get handoff history for an execution
   */
  public async getHandoffHistory(executionId: string): Promise<HandoffData[]> {
    const history = this.handoffHistory.get(executionId);
    if (history) {
      return history;
    }

    // Load from database if not in memory
    const handoffs = await this.prisma.agentHandoff.findMany({
      where: { executionId },
      orderBy: { handoffNumber: 'asc' },
      include: {
        fromStep: true,
        toStep: true
      }
    });

    const handoffData = handoffs.map(h => ({
      fromAgent: h.fromAgent,
      toAgent: h.toAgent,
      handoffType: h.handoffType,
      data: h.handoffData as Record<string, any>,
      context: {
        executionId: h.executionId,
        campaignId: h.execution?.campaignId,
        preservedContext: (h.contextData as any)?.preserved,
        userContext: (h.contextData as any)?.user
      } as HandoffContext,
      metadata: h.metadata as Record<string, any>
    }));

    this.handoffHistory.set(executionId, handoffData);
    return handoffData;
  }

  /**
   * Analyze handoff patterns for optimization
   */
  public async analyzeHandoffPatterns(
    agentType?: AgentType,
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    patterns: HandoffPattern[];
    recommendations: string[];
    performance: {
      averageTransferTime: number;
      averageDataSize: number;
      successRate: number;
      mostEfficientPairs: Array<{ from: AgentType; to: AgentType; efficiency: number }>;
    };
  }> {
    const whereClause: any = {};
    
    if (agentType) {
      whereClause.OR = [
        { fromAgent: agentType },
        { toAgent: agentType }
      ];
    }

    if (timeRange) {
      whereClause.transferredAt = {
        gte: timeRange.start,
        lte: timeRange.end
      };
    }

    const handoffs = await this.prisma.agentHandoff.findMany({
      where: whereClause,
      include: {
        execution: {
          select: {
            status: true,
            totalCost: true,
            successRate: true
          }
        }
      }
    });

    // Analyze patterns
    const patterns = this.extractHandoffPatterns(handoffs);
    const recommendations = this.generateOptimizationRecommendations(patterns);
    const performance = this.calculateHandoffPerformance(handoffs);

    return {
      patterns,
      recommendations,
      performance
    };
  }

  /**
   * Create optimized communication channel
   */
  public createOptimizedChannel(
    fromAgent: AgentType,
    toAgent: AgentType,
    requirements?: {
      prioritizeSpeed?: boolean;
      prioritizeReliability?: boolean;
      maxLatency?: number;
      encryptionRequired?: boolean;
    }
  ): CommunicationChannel {
    const channelKey = `${fromAgent}_to_${toAgent}`;
    
    // Check if channel already exists
    const existing = this.channels.get(channelKey);
    if (existing && this.meetsRequirements(existing, requirements)) {
      return existing;
    }

    // Create new optimized channel
    const channel: CommunicationChannel = {
      fromAgent,
      toAgent,
      protocol: this.selectOptimalProtocol(fromAgent, toAgent, requirements),
      encryption: requirements?.encryptionRequired || false,
      compression: this.shouldUseCompression(fromAgent, toAgent),
      reliability: this.calculateChannelReliability(fromAgent, toAgent),
      averageLatency: this.estimateLatency(fromAgent, toAgent, requirements)
    };

    this.channels.set(channelKey, channel);
    return channel;
  }

  // Private methods

  private initializeCommunicationChannels(): void {
    // Initialize default channels between common agent pairs
    const agentPairs = [
      [AgentType.TREND_AGENT, AgentType.CONTENT_AGENT],
      [AgentType.CONTENT_AGENT, AgentType.SOCIAL_AGENT],
      [AgentType.CONTENT_AGENT, AgentType.EMAIL_AGENT],
      [AgentType.SEO_AGENT, AgentType.CONTENT_AGENT],
      [AgentType.EMAIL_AGENT, AgentType.SUPPORT_AGENT],
      [AgentType.SOCIAL_AGENT, AgentType.SUPPORT_AGENT]
    ];

    for (const [from, to] of agentPairs) {
      this.createOptimizedChannel(from as AgentType, to as AgentType);
    }
  }

  private async determineNextAgent(executionId: string, currentAgent: AgentType): Promise<AgentType | null> {
    // Get execution details to find next step
    const execution = await this.prisma.chainExecution.findUnique({
      where: { id: executionId },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' }
        }
      }
    });

    if (!execution || !execution.steps) return null;

    // Find current step
    const currentStep = execution.steps.find(step => step.agentType === currentAgent);
    if (!currentStep) return null;

    // Find next step
    const nextStep = execution.steps.find(step => step.stepNumber > currentStep.stepNumber);
    return nextStep ? nextStep.agentType : null;
  }

  private async prepareHandoffData(
    fromAgent: AgentType,
    toAgent: AgentType,
    agentResult: Record<string, any>,
    context: any
  ): Promise<HandoffData> {
    // Determine optimal handoff type
    const handoffType = this.determineHandoffType(fromAgent, toAgent, agentResult);

    // Prepare data based on handoff type
    let handoffData: Record<string, any> = {};

    switch (handoffType) {
      case HandoffType.DATA_ONLY:
        handoffData = agentResult.output || agentResult;
        break;
      
      case HandoffType.DATA_WITH_CONTEXT:
        handoffData = {
          ...agentResult.output || agentResult,
          context: this.extractRelevantContext(context, toAgent)
        };
        break;
      
      case HandoffType.FULL_STATE:
        handoffData = {
          ...agentResult,
          state: context,
          metadata: this.generateMetadata(fromAgent, toAgent)
        };
        break;
      
      default:
        handoffData = agentResult.output || agentResult;
    }

    return {
      fromAgent,
      toAgent,
      handoffType,
      data: handoffData,
      context: {
        executionId: context.executionId,
        campaignId: context.campaignId,
        chainId: context.chainId,
        preservedContext: this.preserveContext(context, toAgent),
        performanceHints: this.generatePerformanceHints(fromAgent, toAgent, agentResult)
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        optimization: this.getOptimizationLevel(fromAgent, toAgent)
      }
    };
  }

  private async validateHandoffData(handoffData: HandoffData): Promise<HandoffValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let qualityScore = 1.0;

    // Basic validation
    if (!handoffData.data || Object.keys(handoffData.data).length === 0) {
      errors.push('Handoff data is empty');
      qualityScore -= 0.5;
    }

    // Type validation
    if (!this.isValidDataType(handoffData.data)) {
      errors.push('Invalid data type for handoff');
      qualityScore -= 0.3;
    }

    // Size validation
    const dataSize = this.calculateDataSize(handoffData.data);
    if (dataSize > 10 * 1024 * 1024) { // 10MB limit
      warnings.push('Large data size may impact performance');
      suggestions.push('Consider using compression or data references');
      qualityScore -= 0.1;
    }

    // Agent compatibility validation
    const compatibility = this.checkAgentCompatibility(handoffData.fromAgent, handoffData.toAgent);
    if (compatibility < 0.7) {
      warnings.push('Low compatibility between agents may require data transformation');
      suggestions.push('Consider adding data transformation layer');
      qualityScore -= 0.1;
    }

    // Context validation
    if (!handoffData.context.executionId) {
      errors.push('Missing execution context');
      qualityScore -= 0.2;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      qualityScore: Math.max(0, qualityScore),
      suggestions
    };
  }

  private async optimizeHandoff(handoffData: HandoffData): Promise<HandoffData> {
    const optimizations: HandoffOptimization[] = [];
    let optimizedData = { ...handoffData };

    // Compression optimization
    const dataSize = this.calculateDataSize(handoffData.data);
    if (dataSize > 1024 * 1024) { // 1MB threshold
      const compressed = this.compressData(handoffData.data);
      optimizedData.data = compressed.data;
      optimizations.push({
        type: 'compression',
        description: 'Applied data compression to reduce transfer size',
        savedTime: compressed.savedTime,
        savedSize: compressed.savedSize
      });
    }

    // Data filtering optimization
    const relevantFields = this.getRelevantFields(handoffData.fromAgent, handoffData.toAgent);
    if (relevantFields) {
      const filtered = this.filterData(optimizedData.data, relevantFields);
      optimizedData.data = filtered.data;
      optimizations.push({
        type: 'filtering',
        description: 'Filtered data to include only relevant fields',
        savedTime: filtered.savedTime,
        savedSize: filtered.savedSize
      });
    }

    // Data transformation optimization
    const transformation = this.getOptimalTransformation(handoffData.fromAgent, handoffData.toAgent);
    if (transformation) {
      optimizedData.data = this.transformData(optimizedData.data, transformation);
      optimizations.push({
        type: 'transformation',
        description: 'Applied data transformation for better compatibility',
        savedTime: 0,
        savedSize: 0
      });
    }

    // Add optimization metadata
    optimizedData.metadata = {
      ...optimizedData.metadata,
      optimizations,
      optimizedAt: new Date().toISOString()
    };

    return optimizedData;
  }

  private async createHandoffRecord(
    executionId: string,
    fromStepId: string,
    handoffData: HandoffData,
    validation: HandoffValidation
  ): Promise<any> {
    // Get next handoff number
    const handoffNumber = await this.getNextHandoffNumber(executionId);

    // Find the target step
    const toStep = await this.findTargetStep(executionId, handoffData.toAgent);

    return await this.prisma.agentHandoff.create({
      data: {
        executionId,
        fromStepId,
        toStepId: toStep?.id || '',
        handoffNumber,
        fromAgent: handoffData.fromAgent,
        toAgent: handoffData.toAgent,
        handoffType: handoffData.handoffType,
        handoffData: handoffData.data,
        dataSize: this.calculateDataSize(handoffData.data),
        confidence: validation.qualityScore,
        qualityScore: validation.qualityScore,
        validationPassed: validation.isValid,
        validationErrors: validation.errors.length > 0 ? validation.errors : null,
        contextData: handoffData.context.preservedContext,
        campaignContext: handoffData.context.campaignId ? { campaignId: handoffData.context.campaignId } : null,
        optimizationHints: handoffData.context.performanceHints,
        metadata: handoffData.metadata
      }
    });
  }

  private addToHandoffHistory(executionId: string, handoffData: HandoffData): void {
    const history = this.handoffHistory.get(executionId) || [];
    history.push(handoffData);
    this.handoffHistory.set(executionId, history);
  }

  private async updatePerformanceMetrics(
    fromAgent: AgentType,
    toAgent: AgentType,
    transferTime: number,
    dataSize: number
  ): Promise<void> {
    const key = `${fromAgent}_to_${toAgent}`;
    const current = this.performanceMetrics.get(key) || {
      totalTransfers: 0,
      totalTime: 0,
      totalSize: 0,
      successCount: 0
    };

    current.totalTransfers++;
    current.totalTime += transferTime;
    current.totalSize += dataSize;
    current.successCount++;

    this.performanceMetrics.set(key, current);
  }

  private async updateProcessingMetrics(handoffId: string): Promise<void> {
    const processingTime = Date.now();
    
    await this.prisma.agentHandoff.update({
      where: { id: handoffId },
      data: {
        processingTime: processingTime
      }
    });
  }

  // Utility methods

  private determineHandoffType(fromAgent: AgentType, toAgent: AgentType, result: Record<string, any>): HandoffType {
    // Complex analysis to determine optimal handoff type
    const resultSize = this.calculateDataSize(result);
    const hasContext = result.context || result.metadata;
    
    if (resultSize > 5 * 1024 * 1024) { // 5MB
      return HandoffType.REFERENCE;
    } else if (hasContext || this.requiresFullContext(fromAgent, toAgent)) {
      return HandoffType.FULL_STATE;
    } else if (this.requiresContext(fromAgent, toAgent)) {
      return HandoffType.DATA_WITH_CONTEXT;
    } else {
      return HandoffType.DATA_ONLY;
    }
  }

  private calculateDataSize(data: any): number {
    return JSON.stringify(data).length;
  }

  private isValidDataType(data: any): boolean {
    return typeof data === 'object' && data !== null && !Array.isArray(data);
  }

  private checkAgentCompatibility(fromAgent: AgentType, toAgent: AgentType): number {
    // Simplified compatibility matrix
    const compatibilityMatrix: Record<string, Record<string, number>> = {
      [AgentType.TREND_AGENT]: {
        [AgentType.CONTENT_AGENT]: 0.9,
        [AgentType.SOCIAL_AGENT]: 0.8,
        [AgentType.SEO_AGENT]: 0.7
      },
      [AgentType.CONTENT_AGENT]: {
        [AgentType.SOCIAL_AGENT]: 0.95,
        [AgentType.EMAIL_AGENT]: 0.9,
        [AgentType.SEO_AGENT]: 0.85
      },
      [AgentType.SOCIAL_AGENT]: {
        [AgentType.SUPPORT_AGENT]: 0.8,
        [AgentType.EMAIL_AGENT]: 0.7
      },
      [AgentType.EMAIL_AGENT]: {
        [AgentType.SUPPORT_AGENT]: 0.85
      }
    };

    return compatibilityMatrix[fromAgent]?.[toAgent] || 0.5;
  }

  private extractRelevantContext(context: any, toAgent: AgentType): Record<string, any> {
    // Extract context relevant to the target agent
    const relevantContext: Record<string, any> = {};
    
    if (context.campaignId) relevantContext.campaignId = context.campaignId;
    if (context.goal) relevantContext.goal = context.goal;
    if (context.preferences) relevantContext.preferences = context.preferences;
    
    // Agent-specific context
    switch (toAgent) {
      case AgentType.CONTENT_AGENT:
        if (context.brandVoice) relevantContext.brandVoice = context.brandVoice;
        if (context.style) relevantContext.style = context.style;
        break;
      case AgentType.SOCIAL_AGENT:
        if (context.platforms) relevantContext.platforms = context.platforms;
        if (context.engagement) relevantContext.engagement = context.engagement;
        break;
      case AgentType.EMAIL_AGENT:
        if (context.segments) relevantContext.segments = context.segments;
        if (context.personalization) relevantContext.personalization = context.personalization;
        break;
    }

    return relevantContext;
  }

  private preserveContext(context: any, toAgent: AgentType): Record<string, any> {
    // Preserve context that needs to be maintained across handoffs
    return {
      executionId: context.executionId,
      chainId: context.chainId,
      startTime: context.startTime,
      originalGoal: context.originalGoal,
      constraints: context.constraints
    };
  }

  private generatePerformanceHints(
    fromAgent: AgentType,
    toAgent: AgentType,
    result: Record<string, any>
  ): PerformanceHint[] {
    const hints: PerformanceHint[] = [];

    // Quality-based hints
    if (result.confidence && result.confidence > 0.9) {
      hints.push({
        type: 'optimization',
        key: 'high_confidence_input',
        value: true,
        confidence: result.confidence,
        source: fromAgent
      });
    }

    // Performance-based hints
    if (result.executionTime && result.executionTime < 30000) { // Less than 30 seconds
      hints.push({
        type: 'preference',
        key: 'fast_execution_preferred',
        value: true,
        confidence: 0.8,
        source: fromAgent
      });
    }

    return hints;
  }

  private generateMetadata(fromAgent: AgentType, toAgent: AgentType): Record<string, any> {
    return {
      transferId: `${fromAgent}_to_${toAgent}_${Date.now()}`,
      protocol: 'standard',
      compression: false,
      encryption: false,
      priority: 'normal'
    };
  }

  private getOptimizationLevel(fromAgent: AgentType, toAgent: AgentType): string {
    const compatibility = this.checkAgentCompatibility(fromAgent, toAgent);
    
    if (compatibility > 0.9) return 'minimal';
    if (compatibility > 0.7) return 'standard';
    return 'aggressive';
  }

  private compressData(data: any): { data: any; savedTime: number; savedSize: number } {
    // Simplified compression simulation
    const originalSize = this.calculateDataSize(data);
    const compressedSize = Math.floor(originalSize * 0.3); // 70% compression
    
    return {
      data: { compressed: true, originalData: data },
      savedTime: 100, // ms
      savedSize: originalSize - compressedSize
    };
  }

  private getRelevantFields(fromAgent: AgentType, toAgent: AgentType): string[] | null {
    // Define relevant fields for each agent pair
    const fieldMap: Record<string, Record<string, string[]>> = {
      [AgentType.TREND_AGENT]: {
        [AgentType.CONTENT_AGENT]: ['trends', 'keywords', 'sentiment', 'topics'],
        [AgentType.SOCIAL_AGENT]: ['engagement_trends', 'hashtags', 'viral_content']
      },
      [AgentType.CONTENT_AGENT]: {
        [AgentType.SOCIAL_AGENT]: ['content', 'title', 'description', 'tags'],
        [AgentType.EMAIL_AGENT]: ['content', 'subject', 'call_to_action']
      }
    };

    return fieldMap[fromAgent]?.[toAgent] || null;
  }

  private filterData(data: any, relevantFields: string[]): { data: any; savedTime: number; savedSize: number } {
    const originalSize = this.calculateDataSize(data);
    const filtered: Record<string, any> = {};
    
    for (const field of relevantFields) {
      if (data[field] !== undefined) {
        filtered[field] = data[field];
      }
    }

    const newSize = this.calculateDataSize(filtered);
    
    return {
      data: filtered,
      savedTime: 50, // ms
      savedSize: originalSize - newSize
    };
  }

  private getOptimalTransformation(fromAgent: AgentType, toAgent: AgentType): string | null {
    // Define transformations needed between agent pairs
    const transformationMap: Record<string, Record<string, string>> = {
      [AgentType.TREND_AGENT]: {
        [AgentType.CONTENT_AGENT]: 'trend_to_content_context'
      },
      [AgentType.CONTENT_AGENT]: {
        [AgentType.SOCIAL_AGENT]: 'content_to_social_format'
      }
    };

    return transformationMap[fromAgent]?.[toAgent] || null;
  }

  private transformData(data: any, transformation: string): any {
    // Apply specific transformations based on type
    switch (transformation) {
      case 'trend_to_content_context':
        return {
          context: data,
          contentRequirements: {
            style: data.trending_style || 'engaging',
            topics: data.trending_topics || [],
            keywords: data.keywords || []
          }
        };
      
      case 'content_to_social_format':
        return {
          content: data.content,
          socialMeta: {
            title: data.title,
            description: data.description,
            hashtags: data.hashtags || [],
            platforms: data.platforms || ['instagram', 'twitter']
          }
        };
      
      default:
        return data;
    }
  }

  private requiresFullContext(fromAgent: AgentType, toAgent: AgentType): boolean {
    // Determine if full context is required for this agent pair
    const fullContextPairs = [
      [AgentType.TREND_AGENT, AgentType.CONTENT_AGENT],
      [AgentType.CONTENT_AGENT, AgentType.EMAIL_AGENT]
    ];

    return fullContextPairs.some(pair => pair[0] === fromAgent && pair[1] === toAgent);
  }

  private requiresContext(fromAgent: AgentType, toAgent: AgentType): boolean {
    // Most agent pairs benefit from context
    return true;
  }

  private selectOptimalProtocol(fromAgent: AgentType, toAgent: AgentType, requirements?: any): string {
    if (requirements?.prioritizeSpeed) return 'fast_transfer';
    if (requirements?.prioritizeReliability) return 'reliable_transfer';
    return 'standard';
  }

  private shouldUseCompression(fromAgent: AgentType, toAgent: AgentType): boolean {
    // Use compression for data-heavy agents
    const heavyDataAgents = [AgentType.TREND_AGENT, AgentType.SEO_AGENT];
    return heavyDataAgents.includes(fromAgent) || heavyDataAgents.includes(toAgent);
  }

  private calculateChannelReliability(fromAgent: AgentType, toAgent: AgentType): number {
    const compatibility = this.checkAgentCompatibility(fromAgent, toAgent);
    return Math.min(0.99, 0.8 + compatibility * 0.19);
  }

  private estimateLatency(fromAgent: AgentType, toAgent: AgentType, requirements?: any): number {
    let baseLatency = 50; // ms
    
    if (requirements?.prioritizeSpeed) baseLatency *= 0.5;
    if (requirements?.encryptionRequired) baseLatency *= 1.2;
    
    return baseLatency;
  }

  private meetsRequirements(channel: CommunicationChannel, requirements?: any): boolean {
    if (!requirements) return true;
    
    if (requirements.maxLatency && channel.averageLatency > requirements.maxLatency) return false;
    if (requirements.encryptionRequired && !channel.encryption) return false;
    
    return true;
  }

  private extractHandoffPatterns(handoffs: any[]): HandoffPattern[] {
    // Analyze handoffs to extract patterns
    const patterns: HandoffPattern[] = [];
    
    // Group by agent pairs
    const pairGroups = new Map<string, any[]>();
    for (const handoff of handoffs) {
      const key = `${handoff.fromAgent}_to_${handoff.toAgent}`;
      if (!pairGroups.has(key)) {
        pairGroups.set(key, []);
      }
      pairGroups.get(key)!.push(handoff);
    }

    // Extract patterns for each pair
    for (const [pairKey, pairHandoffs] of pairGroups) {
      const [fromAgent, , toAgent] = pairKey.split('_');
      
      patterns.push({
        fromAgent: fromAgent as AgentType,
        toAgent: toAgent as AgentType,
        frequency: pairHandoffs.length,
        averageTransferTime: pairHandoffs.reduce((sum, h) => sum + (h.transferTime || 0), 0) / pairHandoffs.length,
        averageDataSize: pairHandoffs.reduce((sum, h) => sum + (h.dataSize || 0), 0) / pairHandoffs.length,
        successRate: pairHandoffs.filter(h => h.success).length / pairHandoffs.length,
        commonDataTypes: this.extractCommonDataTypes(pairHandoffs)
      });
    }

    return patterns;
  }

  private generateOptimizationRecommendations(patterns: HandoffPattern[]): string[] {
    const recommendations: string[] = [];
    
    for (const pattern of patterns) {
      if (pattern.successRate < 0.9) {
        recommendations.push(`Improve reliability for ${pattern.fromAgent} to ${pattern.toAgent} handoffs`);
      }
      
      if (pattern.averageTransferTime > 1000) {
        recommendations.push(`Optimize transfer speed for ${pattern.fromAgent} to ${pattern.toAgent} handoffs`);
      }
      
      if (pattern.averageDataSize > 5 * 1024 * 1024) {
        recommendations.push(`Consider data compression for ${pattern.fromAgent} to ${pattern.toAgent} handoffs`);
      }
    }

    return recommendations;
  }

  private calculateHandoffPerformance(handoffs: any[]): any {
    const successful = handoffs.filter(h => h.success);
    
    return {
      averageTransferTime: handoffs.reduce((sum, h) => sum + (h.transferTime || 0), 0) / handoffs.length,
      averageDataSize: handoffs.reduce((sum, h) => sum + (h.dataSize || 0), 0) / handoffs.length,
      successRate: successful.length / handoffs.length,
      mostEfficientPairs: this.findMostEfficientPairs(handoffs)
    };
  }

  private findMostEfficientPairs(handoffs: any[]): Array<{ from: AgentType; to: AgentType; efficiency: number }> {
    const pairEfficiency = new Map<string, { transferTime: number; count: number; from: AgentType; to: AgentType }>();
    
    for (const handoff of handoffs) {
      const key = `${handoff.fromAgent}_to_${handoff.toAgent}`;
      const existing = pairEfficiency.get(key) || { transferTime: 0, count: 0, from: handoff.fromAgent, to: handoff.toAgent };
      
      existing.transferTime += handoff.transferTime || 0;
      existing.count++;
      
      pairEfficiency.set(key, existing);
    }

    return Array.from(pairEfficiency.values())
      .map(pair => ({
        from: pair.from,
        to: pair.to,
        efficiency: 1000 / (pair.transferTime / pair.count) // Higher is better
      }))
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 5);
  }

  private extractCommonDataTypes(handoffs: any[]): string[] {
    const dataTypes = new Map<string, number>();
    
    for (const handoff of handoffs) {
      const data = handoff.handoffData as Record<string, any>;
      if (data) {
        for (const key of Object.keys(data)) {
          dataTypes.set(key, (dataTypes.get(key) || 0) + 1);
        }
      }
    }

    return Array.from(dataTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  }

  private async getNextHandoffNumber(executionId: string): Promise<number> {
    const lastHandoff = await this.prisma.agentHandoff.findFirst({
      where: { executionId },
      orderBy: { handoffNumber: 'desc' }
    });
    
    return (lastHandoff?.handoffNumber || 0) + 1;
  }

  private async findTargetStep(executionId: string, toAgent: AgentType): Promise<any> {
    return await this.prisma.chainStep.findFirst({
      where: {
        executionId,
        agentType: toAgent
      }
    });
  }
}

// Supporting interfaces
interface HandoffPattern {
  fromAgent: AgentType;
  toAgent: AgentType;
  frequency: number;
  averageTransferTime: number;
  averageDataSize: number;
  successRate: number;
  commonDataTypes: string[];
}

export default AgentCommunicationProtocol; 