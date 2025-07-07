import { 
  AgentType, 
  ChainType,
  ChainExecutionMode,
  ChainTriggerType,
  ChainExecutionStatus,
  ChainStepStatus,
  ChainStepType,
  HandoffType,
  PrismaClient 
} from '@neon/data-model';
import { AgentCommunicationProtocol } from './AgentCommunicationProtocol';
import { ChainPerformanceAnalyzer } from './ChainPerformanceAnalyzer';

export interface ChainDefinition {
  id?: string;
  name: string;
  description?: string;
  chainType: ChainType;
  executionMode: ChainExecutionMode;
  steps: ChainStepDefinition[];
  conditions?: ChainCondition[];
  successCriteria: SuccessCriteria;
  maxRetries?: number;
  timeoutMinutes?: number;
  budgetLimit?: number;
}

export interface ChainStepDefinition {
  stepNumber: number;
  stepName: string;
  stepType: ChainStepType;
  agentType: AgentType;
  agentConfig?: Record<string, any>;
  dependsOn?: number[];
  conditions?: StepCondition[];
  retries?: number;
  timeout?: number;
  inputMapping?: Record<string, string>;
  outputMapping?: Record<string, string>;
}

export interface ChainCondition {
  type: 'if' | 'while' | 'unless';
  expression: string;
  steps: number[];
  elseSteps?: number[];
}

export interface StepCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface SuccessCriteria {
  minStepsCompleted?: number;
  requiredSteps?: number[];
  minQualityScore?: number;
  maxErrorRate?: number;
  customConditions?: Record<string, any>;
}

export interface ChainExecutionContext {
  executionId: string;
  chainId: string;
  campaignId?: string;
  triggeredBy?: string;
  triggerType: ChainTriggerType;
  triggerData?: Record<string, any>;
  environment: string;
  config?: Record<string, any>;
}

export interface ChainExecutionResult {
  success: boolean;
  executionId: string;
  finalResult?: Record<string, any>;
  outputs: Record<string, any>;
  performance: ChainPerformanceData;
  errors?: ChainError[];
  stepResults: StepExecutionResult[];
}

export interface StepExecutionResult {
  stepNumber: number;
  stepName: string;
  agentType: AgentType;
  success: boolean;
  output?: Record<string, any>;
  error?: string;
  executionTime: number;
  cost: number;
  confidence?: number;
  qualityScore?: number;
}

export interface ChainPerformanceData {
  totalExecutionTime: number;
  totalCost: number;
  successRate: number;
  averageStepTime: number;
  bottlenecks: string[];
  recommendations: string[];
}

export interface ChainError {
  stepNumber?: number;
  agentType?: AgentType;
  errorType: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  recoverable: boolean;
}

export class AgentChainOrchestrator {
  private prisma: PrismaClient;
  private communicationProtocol: AgentCommunicationProtocol;
  private performanceAnalyzer: ChainPerformanceAnalyzer;
  private activeExecutions: Map<string, ChainExecutionState> = new Map();
  private agentRegistry: Map<AgentType, any> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.communicationProtocol = new AgentCommunicationProtocol(prisma);
    this.performanceAnalyzer = new ChainPerformanceAnalyzer(prisma);
  }

  /**
   * Execute a complete agent chain
   */
  public async executeChain(
    chainDefinition: ChainDefinition,
    context: ChainExecutionContext
  ): Promise<ChainExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Create execution record
      const execution = await this.createChainExecution(chainDefinition, context);
      context.executionId = execution.id;

      // Initialize execution state
      const executionState = this.initializeExecutionState(chainDefinition, context);
      this.activeExecutions.set(context.executionId, executionState);

      console.log(`Starting chain execution: ${chainDefinition.name} (${context.executionId})`);

      // Execute the chain based on execution mode
      const result = await this.executeChainSteps(chainDefinition, context, executionState);

      // Finalize execution
      await this.finalizeExecution(context.executionId, result);

      // Analyze performance
      const performance = await this.performanceAnalyzer.analyzeChainExecution(context.executionId);

      return {
        ...result,
        performance: performance || {
          totalExecutionTime: Date.now() - startTime,
          totalCost: result.stepResults.reduce((sum, step) => sum + step.cost, 0),
          successRate: result.success ? 1.0 : 0.0,
          averageStepTime: (Date.now() - startTime) / result.stepResults.length,
          bottlenecks: [],
          recommendations: []
        }
      };

    } catch (error) {
      console.error(`Chain execution failed: ${error}`);
      
      // Update execution status to failed
      await this.updateExecutionStatus(context.executionId, ChainExecutionStatus.FAILED, {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      });

      throw error;
    } finally {
      // Clean up execution state
      this.activeExecutions.delete(context.executionId);
    }
  }

  /**
   * Execute chain steps based on execution mode
   */
  private async executeChainSteps(
    chainDefinition: ChainDefinition,
    context: ChainExecutionContext,
    executionState: ChainExecutionState
  ): Promise<ChainExecutionResult> {
    const stepResults: StepExecutionResult[] = [];
    const outputs: Record<string, any> = {};
    const errors: ChainError[] = [];

    try {
      await this.updateExecutionStatus(context.executionId, ChainExecutionStatus.RUNNING);

      switch (chainDefinition.executionMode) {
        case ChainExecutionMode.SEQUENTIAL:
          for (const step of chainDefinition.steps.sort((a, b) => a.stepNumber - b.stepNumber)) {
            const result = await this.executeStep(step, context, executionState, outputs);
            stepResults.push(result);
            
            if (result.success && result.output) {
              outputs[`step_${step.stepNumber}`] = result.output;
              outputs[step.stepName] = result.output;
            } else if (!result.success) {
              errors.push({
                stepNumber: step.stepNumber,
                agentType: step.agentType,
                errorType: 'execution_error',
                message: result.error || 'Step execution failed',
                timestamp: new Date(),
                recoverable: step.retries ? step.retries > 0 : false
              });
              
              // Handle failure based on chain configuration
              if (!await this.handleStepFailure(step, result, chainDefinition, context)) {
                break; // Stop execution if failure is not recoverable
              }
            }
          }
          break;

        case ChainExecutionMode.PARALLEL:
          const parallelResults = await this.executeStepsInParallel(
            chainDefinition.steps, 
            context, 
            executionState
          );
          stepResults.push(...parallelResults.stepResults);
          Object.assign(outputs, parallelResults.outputs);
          errors.push(...parallelResults.errors);
          break;

        case ChainExecutionMode.ADAPTIVE:
          const adaptiveResults = await this.executeStepsAdaptively(
            chainDefinition.steps,
            context,
            executionState
          );
          stepResults.push(...adaptiveResults.stepResults);
          Object.assign(outputs, adaptiveResults.outputs);
          errors.push(...adaptiveResults.errors);
          break;

        default:
          throw new Error(`Unsupported execution mode: ${chainDefinition.executionMode}`);
      }

      // Evaluate success criteria
      const success = this.evaluateSuccessCriteria(chainDefinition.successCriteria, stepResults, outputs);

      // Update execution status
      await this.updateExecutionStatus(
        context.executionId, 
        success ? ChainExecutionStatus.COMPLETED : ChainExecutionStatus.FAILED
      );

      // Generate final result
      const finalResult = await this.aggregateResults(outputs, stepResults);

      return {
        success,
        executionId: context.executionId,
        finalResult,
        outputs,
        stepResults,
        errors: errors.length > 0 ? errors : undefined,
        performance: {
          totalExecutionTime: 0, // Will be calculated by performance analyzer
          totalCost: stepResults.reduce((sum, step) => sum + step.cost, 0),
          successRate: success ? 1.0 : 0.0,
          averageStepTime: 0,
          bottlenecks: [],
          recommendations: []
        }
      };

    } catch (error) {
      await this.updateExecutionStatus(context.executionId, ChainExecutionStatus.FAILED);
      throw error;
    }
  }

  /**
   * Execute a single step in the chain
   */
  private async executeStep(
    step: ChainStepDefinition,
    context: ChainExecutionContext,
    executionState: ChainExecutionState,
    availableOutputs: Record<string, any>
  ): Promise<StepExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Check dependencies
      if (step.dependsOn && step.dependsOn.length > 0) {
        const dependenciesMet = await this.checkDependencies(step.dependsOn, executionState);
        if (!dependenciesMet) {
          throw new Error(`Dependencies not met for step ${step.stepNumber}`);
        }
      }

      // Check step conditions
      if (step.conditions && step.conditions.length > 0) {
        const conditionsMet = this.evaluateStepConditions(step.conditions, availableOutputs);
        if (!conditionsMet) {
          return {
            stepNumber: step.stepNumber,
            stepName: step.stepName,
            agentType: step.agentType,
            success: true, // Skipped steps are considered successful
            executionTime: Date.now() - startTime,
            cost: 0
          };
        }
      }

      // Create step record
      const stepRecord = await this.createStepRecord(step, context);

      // Prepare input data for the agent
      const inputData = this.prepareStepInput(step, availableOutputs);

      // Execute the agent
      const agentResult = await this.executeAgent(step.agentType, inputData, step.agentConfig);

      // Process handoff if there are subsequent steps
      if (step.stepNumber < executionState.totalSteps - 1) {
        await this.communicationProtocol.createHandoff(
          context.executionId,
          stepRecord.id,
          step.agentType,
          agentResult,
          context
        );
      }

      // Update step record
      await this.updateStepRecord(stepRecord.id, ChainStepStatus.COMPLETED, {
        outputData: agentResult.output,
        confidence: agentResult.confidence,
        qualityScore: agentResult.qualityScore,
        executionTime: Date.now() - startTime,
        cost: agentResult.cost || 0
      });

      return {
        stepNumber: step.stepNumber,
        stepName: step.stepName,
        agentType: step.agentType,
        success: true,
        output: agentResult.output,
        executionTime: Date.now() - startTime,
        cost: agentResult.cost || 0,
        confidence: agentResult.confidence,
        qualityScore: agentResult.qualityScore
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update step record with error
      const stepRecord = await this.createStepRecord(step, context);
      await this.updateStepRecord(stepRecord.id, ChainStepStatus.FAILED, {
        errorData: { message: errorMessage, details: error },
        executionTime
      });

      return {
        stepNumber: step.stepNumber,
        stepName: step.stepName,
        agentType: step.agentType,
        success: false,
        error: errorMessage,
        executionTime,
        cost: 0
      };
    }
  }

  /**
   * Execute steps in parallel
   */
  private async executeStepsInParallel(
    steps: ChainStepDefinition[],
    context: ChainExecutionContext,
    executionState: ChainExecutionState
  ): Promise<{
    stepResults: StepExecutionResult[];
    outputs: Record<string, any>;
    errors: ChainError[];
  }> {
    const outputs: Record<string, any> = {};
    const errors: ChainError[] = [];

    // Group steps by dependency level
    const stepGroups = this.groupStepsByDependencies(steps);

    const allResults: StepExecutionResult[] = [];

    // Execute each group in sequence, but steps within a group in parallel
    for (const group of stepGroups) {
      const groupPromises = group.map(step => 
        this.executeStep(step, context, executionState, outputs)
      );

      const groupResults = await Promise.allSettled(groupPromises);

      // Process results
      for (let i = 0; i < groupResults.length; i++) {
        const result = groupResults[i];
        const step = group[i];

        if (result.status === 'fulfilled') {
          const stepResult = result.value;
          allResults.push(stepResult);

          if (stepResult.success && stepResult.output) {
            outputs[`step_${step.stepNumber}`] = stepResult.output;
            outputs[step.stepName] = stepResult.output;
          }
        } else {
          errors.push({
            stepNumber: step.stepNumber,
            agentType: step.agentType,
            errorType: 'parallel_execution_error',
            message: result.reason?.message || 'Parallel execution failed',
            timestamp: new Date(),
            recoverable: false
          });

          allResults.push({
            stepNumber: step.stepNumber,
            stepName: step.stepName,
            agentType: step.agentType,
            success: false,
            error: result.reason?.message || 'Parallel execution failed',
            executionTime: 0,
            cost: 0
          });
        }
      }
    }

    return {
      stepResults: allResults,
      outputs,
      errors
    };
  }

  /**
   * Execute steps adaptively based on performance and dependencies
   */
  private async executeStepsAdaptively(
    steps: ChainStepDefinition[],
    context: ChainExecutionContext,
    executionState: ChainExecutionState
  ): Promise<{
    stepResults: StepExecutionResult[];
    outputs: Record<string, any>;
    errors: ChainError[];
  }> {
    // Analyze dependencies and performance to determine optimal execution order
    const optimizedOrder = await this.optimizeExecutionOrder(steps, context);
    
    // Execute in optimized order
    const outputs: Record<string, any> = {};
    const errors: ChainError[] = [];
    const stepResults: StepExecutionResult[] = [];

    for (const step of optimizedOrder) {
      const result = await this.executeStep(step, context, executionState, outputs);
      stepResults.push(result);

      if (result.success && result.output) {
        outputs[`step_${step.stepNumber}`] = result.output;
        outputs[step.stepName] = result.output;
      } else if (!result.success) {
        errors.push({
          stepNumber: step.stepNumber,
          agentType: step.agentType,
          errorType: 'adaptive_execution_error',
          message: result.error || 'Adaptive execution failed',
          timestamp: new Date(),
          recoverable: step.retries ? step.retries > 0 : false
        });
      }
    }

    return { stepResults, outputs, errors };
  }

  // Utility methods

  private async createChainExecution(
    chainDefinition: ChainDefinition,
    context: ChainExecutionContext
  ): Promise<any> {
    return await this.prisma.chainExecution.create({
      data: {
        chainId: context.chainId,
        executionNumber: await this.getNextExecutionNumber(context.chainId),
        triggeredBy: context.triggeredBy,
        triggerType: context.triggerType,
        triggerData: context.triggerData,
        campaignId: context.campaignId,
        campaignName: context.campaignId ? await this.getCampaignName(context.campaignId) : undefined,
        status: ChainExecutionStatus.PENDING,
        totalSteps: chainDefinition.steps.length,
        executionConfig: context.config,
        environment: context.environment
      }
    });
  }

  private initializeExecutionState(
    chainDefinition: ChainDefinition,
    context: ChainExecutionContext
  ): ChainExecutionState {
    return {
      executionId: context.executionId,
      chainDefinition,
      context,
      totalSteps: chainDefinition.steps.length,
      completedSteps: 0,
      stepStates: new Map(),
      startTime: Date.now()
    };
  }

  private async updateExecutionStatus(
    executionId: string,
    status: ChainExecutionStatus,
    additionalData?: Record<string, any>
  ): Promise<void> {
    const updateData: any = {
      status,
      lastActivity: new Date()
    };

    if (status === ChainExecutionStatus.COMPLETED) {
      updateData.completedAt = new Date();
    } else if (status === ChainExecutionStatus.FAILED) {
      updateData.failedAt = new Date();
      if (additionalData?.error) {
        updateData.errorDetails = additionalData;
      }
    }

    await this.prisma.chainExecution.update({
      where: { id: executionId },
      data: updateData
    });
  }

  private async createStepRecord(
    step: ChainStepDefinition,
    context: ChainExecutionContext
  ): Promise<any> {
    return await this.prisma.chainStep.create({
      data: {
        executionId: context.executionId,
        stepNumber: step.stepNumber,
        stepName: step.stepName,
        stepType: step.stepType,
        agentType: step.agentType,
        stepConfig: step.agentConfig || {},
        dependsOn: step.dependsOn || [],
        conditions: step.conditions || [],
        status: ChainStepStatus.RUNNING
      }
    });
  }

  private async updateStepRecord(
    stepId: string,
    status: ChainStepStatus,
    data: Record<string, any>
  ): Promise<void> {
    const updateData: any = {
      status,
      ...data
    };

    if (status === ChainStepStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    await this.prisma.chainStep.update({
      where: { id: stepId },
      data: updateData
    });
  }

  private async executeAgent(
    agentType: AgentType,
    inputData: Record<string, any>,
    config?: Record<string, any>
  ): Promise<{
    output: Record<string, any>;
    confidence?: number;
    qualityScore?: number;
    cost?: number;
  }> {
    // This would integrate with the actual agent execution system
    // For now, return a mock result
    return {
      output: {
        agentType,
        result: `Processed by ${agentType}`,
        data: inputData,
        timestamp: new Date().toISOString()
      },
      confidence: 0.85,
      qualityScore: 0.9,
      cost: 0.05
    };
  }

  private prepareStepInput(
    step: ChainStepDefinition,
    availableOutputs: Record<string, any>
  ): Record<string, any> {
    const input: Record<string, any> = {};

    // Apply input mapping if defined
    if (step.inputMapping) {
      for (const [inputKey, outputKey] of Object.entries(step.inputMapping)) {
        if (availableOutputs[outputKey] !== undefined) {
          input[inputKey] = availableOutputs[outputKey];
        }
      }
    } else {
      // Default: pass all available outputs
      Object.assign(input, availableOutputs);
    }

    return input;
  }

  private evaluateSuccessCriteria(
    criteria: SuccessCriteria,
    stepResults: StepExecutionResult[],
    outputs: Record<string, any>
  ): boolean {
    const completedSteps = stepResults.filter(r => r.success).length;
    const totalSteps = stepResults.length;

    // Check minimum steps completed
    if (criteria.minStepsCompleted && completedSteps < criteria.minStepsCompleted) {
      return false;
    }

    // Check required steps
    if (criteria.requiredSteps) {
      const requiredCompleted = criteria.requiredSteps.every(stepNum =>
        stepResults.find(r => r.stepNumber === stepNum)?.success
      );
      if (!requiredCompleted) {
        return false;
      }
    }

    // Check minimum quality score
    if (criteria.minQualityScore) {
      const avgQuality = stepResults.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / totalSteps;
      if (avgQuality < criteria.minQualityScore) {
        return false;
      }
    }

    // Check maximum error rate
    if (criteria.maxErrorRate) {
      const errorRate = (totalSteps - completedSteps) / totalSteps;
      if (errorRate > criteria.maxErrorRate) {
        return false;
      }
    }

    return true;
  }

  private async aggregateResults(
    outputs: Record<string, any>,
    stepResults: StepExecutionResult[]
  ): Promise<Record<string, any>> {
    // Combine all outputs into a final result
    return {
      summary: {
        totalSteps: stepResults.length,
        successfulSteps: stepResults.filter(r => r.success).length,
        totalCost: stepResults.reduce((sum, r) => sum + r.cost, 0),
        averageConfidence: stepResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / stepResults.length
      },
      outputs,
      stepSummaries: stepResults.map(r => ({
        stepNumber: r.stepNumber,
        stepName: r.stepName,
        agentType: r.agentType,
        success: r.success,
        confidence: r.confidence
      }))
    };
  }

  // Additional utility methods would be implemented here...
  
  private async checkDependencies(dependsOn: number[], executionState: ChainExecutionState): Promise<boolean> {
    // Check if all dependent steps are completed
    return true; // Simplified implementation
  }

  private evaluateStepConditions(conditions: StepCondition[], outputs: Record<string, any>): boolean {
    // Evaluate step conditions
    return true; // Simplified implementation
  }

  private async handleStepFailure(
    step: ChainStepDefinition,
    result: StepExecutionResult,
    chainDefinition: ChainDefinition,
    context: ChainExecutionContext
  ): Promise<boolean> {
    // Handle step failure with retries and fallbacks
    return false; // Simplified implementation
  }

  private groupStepsByDependencies(steps: ChainStepDefinition[]): ChainStepDefinition[][] {
    // Group steps by their dependency levels for parallel execution
    const groups: ChainStepDefinition[][] = [];
    const processed = new Set<number>();

    let currentLevel = 0;
    while (processed.size < steps.length) {
      const currentGroup = steps.filter(step => {
        if (processed.has(step.stepNumber)) return false;
        if (!step.dependsOn || step.dependsOn.length === 0) return currentLevel === 0;
        return step.dependsOn.every(dep => processed.has(dep));
      });

      if (currentGroup.length === 0) break; // Prevent infinite loop

      groups.push(currentGroup);
      currentGroup.forEach(step => processed.add(step.stepNumber));
      currentLevel++;
    }

    return groups;
  }

  private async optimizeExecutionOrder(
    steps: ChainStepDefinition[],
    context: ChainExecutionContext
  ): Promise<ChainStepDefinition[]> {
    // Optimize execution order based on dependencies and performance
    return steps.sort((a, b) => a.stepNumber - b.stepNumber); // Simplified implementation
  }

  private async getNextExecutionNumber(chainId: string): Promise<number> {
    const lastExecution = await this.prisma.chainExecution.findFirst({
      where: { chainId },
      orderBy: { executionNumber: 'desc' }
    });
    
    return (lastExecution?.executionNumber || 0) + 1;
  }

  private async getCampaignName(campaignId: string): Promise<string | undefined> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { name: true }
    });
    
    return campaign?.name;
  }

  private async finalizeExecution(executionId: string, result: ChainExecutionResult): Promise<void> {
    await this.prisma.chainExecution.update({
      where: { id: executionId },
      data: {
        finalResult: result.finalResult,
        outputs: result.outputs,
        totalCost: result.performance.totalCost,
        successRate: result.performance.successRate,
        agentsUsed: result.stepResults.map(r => r.agentType),
        resultQuality: result.stepResults.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / result.stepResults.length
      }
    });
  }
}

// Supporting interfaces
interface ChainExecutionState {
  executionId: string;
  chainDefinition: ChainDefinition;
  context: ChainExecutionContext;
  totalSteps: number;
  completedSteps: number;
  stepStates: Map<number, any>;
  startTime: number;
}

export default AgentChainOrchestrator; 