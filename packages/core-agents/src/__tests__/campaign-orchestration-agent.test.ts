import { CampaignOrchestrationAgent } from '../agents/campaign-orchestration-agent';
import { TrendAgent } from '../agents/trend-agent';
import { ContentAgent } from '../agents/content-agent';
import { SimpleSocialAgent } from '../agents/simple-social-agent';
import { AgentPayload } from '../base-agent';

// Mock all coordinated agents
jest.mock('../agents/trend-agent');
jest.mock('../agents/content-agent');
jest.mock('../agents/simple-social-agent');

// Mock BudgetTracker
jest.mock('@neon/utils', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  BudgetTracker: {
    checkBudgetStatus: jest.fn(() => Promise.resolve({
      canExecute: true,
      utilizationPercentage: 45.2,
    })),
    trackCost: jest.fn(() => Promise.resolve()),
  },
}));

// Mock the coordinated agents
const mockTrendAgent = TrendAgent as jest.MockedClass<typeof TrendAgent>;
const mockContentAgent = ContentAgent as jest.MockedClass<typeof ContentAgent>;
const mockSocialAgent = SimpleSocialAgent as jest.MockedClass<typeof SimpleSocialAgent>;

describe('CampaignOrchestrationAgent', () => {
  let orchestrationAgent: CampaignOrchestrationAgent;
  let mockTrendAgentInstance: jest.Mocked<TrendAgent>;
  let mockContentAgentInstance: jest.Mocked<ContentAgent>;
  let mockSocialAgentInstance: jest.Mocked<SimpleSocialAgent>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock instances for coordinated agents
    mockTrendAgentInstance = {
      id: 'trend-agent-1',
      execute: jest.fn(),
    } as any;
    
    mockContentAgentInstance = {
      id: 'content-agent-1',
      execute: jest.fn(),
    } as any;
    
    mockSocialAgentInstance = {
      id: 'social-agent-1',
      execute: jest.fn(),
    } as any;

    // Mock agent constructors
    mockTrendAgent.mockImplementation(() => mockTrendAgentInstance);
    mockContentAgent.mockImplementation(() => mockContentAgentInstance);
    mockSocialAgent.mockImplementation(() => mockSocialAgentInstance);

    // Create CampaignOrchestrationAgent instance
    orchestrationAgent = new CampaignOrchestrationAgent();
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(orchestrationAgent.id).toBe('campaign-orchestration-agent');
      expect(orchestrationAgent.name).toBe('CampaignOrchestrationAgent');
      expect(orchestrationAgent.type).toBe('orchestration');
      expect(orchestrationAgent.capabilities).toContain('launch_campaign');
      expect(orchestrationAgent.capabilities).toContain('simulate_campaign');
      expect(orchestrationAgent.capabilities).toContain('get_orchestration_status');
    });

    it('should initialize coordinated agents', () => {
      expect(mockTrendAgent).toHaveBeenCalledTimes(1);
      expect(mockContentAgent).toHaveBeenCalledTimes(1);
      expect(mockSocialAgent).toHaveBeenCalledTimes(1);
    });
  });

  describe('launchCampaign', () => {
    const validCampaignInput = {
      campaignName: 'Test Campaign',
      topic: 'AI Marketing',
      audience: 'Tech Professionals',
      platforms: ['instagram', 'linkedin'] as const,
      contentTypes: ['blog', 'social_post'] as const,
      tone: 'professional' as const,
      scheduling: { immediate: true },
    };

    beforeEach(() => {
      // Mock successful agent responses
      mockTrendAgentInstance.execute.mockResolvedValue({
        success: true,
        data: {
          trends: [
            { id: 'trend1', name: 'AI Revolution', impactScore: 95 },
            { id: 'trend2', name: 'Marketing Automation', impactScore: 88 },
          ],
        },
      });

      mockContentAgentInstance.execute.mockResolvedValue({
        success: true,
        data: {
          content: 'Generated AI marketing content with professional tone.',
          suggestedTitle: 'AI Marketing for Tech Professionals',
          hashtags: ['#AI', '#Marketing', '#TechProfessionals'],
          seoScore: 85,
          readingTime: '3 min',
        },
      });

      mockSocialAgentInstance.execute.mockResolvedValue({
        success: true,
        data: {
          postId: 'post123',
          scheduledTime: new Date().toISOString(),
          status: 'scheduled',
        },
      });
    });

    it('should launch campaign successfully', async () => {
      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: validCampaignInput,
        priority: 'high',
      };

      const result = await orchestrationAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('completed');
      expect(result.data.campaignId).toContain('campaign_');
      expect(result.data.summary.trendsUsed).toHaveLength(2);
      expect(result.data.summary.contentGenerated).toBe(4); // 2 platforms × 2 content types
      expect(result.data.summary.totalCost).toBeGreaterThan(0);
    });

    it('should execute all pipeline stages', async () => {
      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: validCampaignInput,
        priority: 'high',
      };

      const result = await orchestrationAgent.execute(payload);

      expect(result.data.stages.trendDetection.status).toBe('completed');
      expect(result.data.stages.contentGeneration.status).toBe('completed');
      expect(result.data.stages.socialPosting.status).toBe('completed');
    });

    it('should validate required input fields', async () => {
      const invalidInput = {
        campaignName: '',
        topic: '',
        audience: '',
        platforms: [],
        contentTypes: [],
      };

      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: invalidInput,
        priority: 'high',
      };

      const result = await orchestrationAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Campaign name is required');
    });

    it('should handle trend detection failure', async () => {
      mockTrendAgentInstance.execute.mockResolvedValue({
        success: false,
        error: 'Trend detection failed',
      });

      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: validCampaignInput,
        priority: 'high',
      };

      const result = await orchestrationAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('failed');
      expect(result.data.errorMessage).toContain('Trend detection failed');
    });

    it('should handle content generation failure gracefully', async () => {
      mockContentAgentInstance.execute.mockResolvedValue({
        success: false,
        error: 'Content generation failed',
      });

      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: validCampaignInput,
        priority: 'high',
      };

      const result = await orchestrationAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('completed');
      expect(result.data.summary.contentGenerated).toBe(0);
    });

    it('should handle social posting failure gracefully', async () => {
      mockSocialAgentInstance.execute.mockResolvedValue({
        success: false,
        error: 'Social posting failed',
      });

      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: validCampaignInput,
        priority: 'high',
      };

      const result = await orchestrationAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('completed');
      expect(result.data.summary.postsScheduled).toBe(0);
    });

    it('should calculate costs correctly', async () => {
      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: validCampaignInput,
        priority: 'high',
      };

      const result = await orchestrationAgent.execute(payload);

      expect(result.data.summary.totalCost).toBe(0.34); // 0.10 trend + 0.20 content + 0.04 social (2 posts)
    });

    it('should estimate reach based on platforms', async () => {
      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: validCampaignInput,
        priority: 'high',
      };

      const result = await orchestrationAgent.execute(payload);

      expect(result.data.summary.estimatedReach).toBeGreaterThan(0);
    });

    it('should track execution time for each stage', async () => {
      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: validCampaignInput,
        priority: 'high',
      };

      const result = await orchestrationAgent.execute(payload);

      expect(result.data.stages.trendDetection.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.data.stages.contentGeneration.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.data.stages.socialPosting.executionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('simulateCampaign', () => {
    const validCampaignInput = {
      campaignName: 'Test Simulation',
      topic: 'AI Marketing',
      audience: 'Tech Professionals',
      platforms: ['instagram', 'linkedin'] as const,
      contentTypes: ['blog', 'social_post'] as const,
      tone: 'professional' as const,
    };

    beforeEach(() => {
      // Mock successful agent responses
      mockTrendAgentInstance.execute.mockResolvedValue({
        success: true,
        data: {
          trends: [
            { id: 'trend1', name: 'AI Revolution', impactScore: 95 },
          ],
        },
      });

      mockContentAgentInstance.execute.mockResolvedValue({
        success: true,
        data: {
          content: 'Generated content for simulation.',
          suggestedTitle: 'Test Title',
          hashtags: ['#Test'],
          seoScore: 80,
          readingTime: '2 min',
        },
      });
    });

    it('should simulate campaign without posting', async () => {
      const payload: AgentPayload = {
        task: 'simulate_campaign',
        context: validCampaignInput,
        priority: 'medium',
      };

      const result = await orchestrationAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.campaignId).toContain('simulation_');
      expect(result.data.status).toBe('completed');
      expect(result.data.stages.socialPosting.output.simulationMode).toBe(true);
      expect(result.data.summary.postsScheduled).toBe(0);
    });

    it('should execute trend detection and content generation', async () => {
      const payload: AgentPayload = {
        task: 'simulate_campaign',
        context: validCampaignInput,
        priority: 'medium',
      };

      const result = await orchestrationAgent.execute(payload);

      expect(mockTrendAgentInstance.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          task: 'detect_trends',
          context: expect.objectContaining({
            platforms: validCampaignInput.platforms,
          }),
        })
      );

      expect(mockContentAgentInstance.execute).toHaveBeenCalledTimes(4); // 2 platforms × 2 content types
      expect(result.data.summary.contentGenerated).toBe(4);
    });

    it('should not call social agent for posting', async () => {
      const payload: AgentPayload = {
        task: 'simulate_campaign',
        context: validCampaignInput,
        priority: 'medium',
      };

      await orchestrationAgent.execute(payload);

      expect(mockSocialAgentInstance.execute).not.toHaveBeenCalled();
    });
  });

  describe('getOrchestrationStatus', () => {
    it('should return orchestration status', async () => {
      const payload: AgentPayload = {
        task: 'get_orchestration_status',
        context: {},
        priority: 'low',
      };

      const result = await orchestrationAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.agentId).toBe('campaign-orchestration-agent');
      expect(result.data.status).toBe('active');
      expect(result.data.orchestrationMetrics).toBeDefined();
      expect(result.data.agentCoordination).toBeDefined();
      expect(result.data.performance).toBeDefined();
    });

    it('should return specific campaign details when campaignId provided', async () => {
      const payload: AgentPayload = {
        task: 'get_orchestration_status',
        context: { campaignId: 'campaign_123' },
        priority: 'low',
      };

      const result = await orchestrationAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.specificCampaign).toBeDefined();
      expect(result.data.specificCampaign.campaignId).toBe('campaign_123');
    });

    it('should include orchestration metrics', async () => {
      const payload: AgentPayload = {
        task: 'get_orchestration_status',
        context: {},
        priority: 'low',
      };

      const result = await orchestrationAgent.execute(payload);

      expect(result.data.orchestrationMetrics.totalCampaigns).toBeGreaterThan(0);
      expect(result.data.orchestrationMetrics.successfulCampaigns).toBeGreaterThan(0);
      expect(result.data.orchestrationMetrics.averageExecutionTime).toBeDefined();
    });

    it('should include agent coordination health', async () => {
      const payload: AgentPayload = {
        task: 'get_orchestration_status',
        context: {},
        priority: 'low',
      };

      const result = await orchestrationAgent.execute(payload);

      expect(result.data.agentCoordination.trendAgentStatus).toBe('healthy');
      expect(result.data.agentCoordination.contentAgentStatus).toBe('healthy');
      expect(result.data.agentCoordination.socialAgentStatus).toBe('healthy');
    });
  });

  describe('Campaign Management', () => {
    describe('pauseCampaign', () => {
      it('should pause campaign successfully', async () => {
        const payload: AgentPayload = {
          task: 'pause_campaign',
          context: { campaignId: 'campaign_123' },
          priority: 'high',
        };

        const result = await orchestrationAgent.execute(payload);

        expect(result.success).toBe(true);
        expect(result.data.campaignId).toBe('campaign_123');
        expect(result.data.status).toBe('paused');
        expect(result.data.pausedAt).toBeDefined();
      });

      it('should throw error if campaignId not provided', async () => {
        const payload: AgentPayload = {
          task: 'pause_campaign',
          context: {},
          priority: 'high',
        };

        const result = await orchestrationAgent.execute(payload);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Campaign ID is required to pause campaign');
      });
    });

    describe('resumeCampaign', () => {
      it('should resume campaign successfully', async () => {
        const payload: AgentPayload = {
          task: 'resume_campaign',
          context: { campaignId: 'campaign_123' },
          priority: 'high',
        };

        const result = await orchestrationAgent.execute(payload);

        expect(result.success).toBe(true);
        expect(result.data.campaignId).toBe('campaign_123');
        expect(result.data.status).toBe('resumed');
        expect(result.data.resumedAt).toBeDefined();
      });

      it('should throw error if campaignId not provided', async () => {
        const payload: AgentPayload = {
          task: 'resume_campaign',
          context: {},
          priority: 'high',
        };

        const result = await orchestrationAgent.execute(payload);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Campaign ID is required to resume campaign');
      });
    });

    describe('cancelCampaign', () => {
      it('should cancel campaign successfully', async () => {
        const payload: AgentPayload = {
          task: 'cancel_campaign',
          context: { campaignId: 'campaign_123' },
          priority: 'high',
        };

        const result = await orchestrationAgent.execute(payload);

        expect(result.success).toBe(true);
        expect(result.data.campaignId).toBe('campaign_123');
        expect(result.data.status).toBe('cancelled');
        expect(result.data.cancelledAt).toBeDefined();
      });

      it('should throw error if campaignId not provided', async () => {
        const payload: AgentPayload = {
          task: 'cancel_campaign',
          context: {},
          priority: 'high',
        };

        const result = await orchestrationAgent.execute(payload);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Campaign ID is required to cancel campaign');
      });
    });

    describe('getCampaignHistory', () => {
      it('should return campaign history', async () => {
        const payload: AgentPayload = {
          task: 'get_campaign_history',
          context: {},
          priority: 'low',
        };

        const result = await orchestrationAgent.execute(payload);

        expect(result.success).toBe(true);
        expect(result.data.totalCampaigns).toBeGreaterThan(0);
        expect(result.data.recentCampaigns).toBeDefined();
        expect(Array.isArray(result.data.recentCampaigns)).toBe(true);
      });

      it('should include recent campaign details', async () => {
        const payload: AgentPayload = {
          task: 'get_campaign_history',
          context: {},
          priority: 'low',
        };

        const result = await orchestrationAgent.execute(payload);

        expect(result.data.recentCampaigns.length).toBeGreaterThan(0);
        expect(result.data.recentCampaigns[0].campaignId).toBeDefined();
        expect(result.data.recentCampaigns[0].performance).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown task', async () => {
      const payload: AgentPayload = {
        task: 'unknown_task',
        context: {},
        priority: 'low',
      };

      const result = await orchestrationAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown task: unknown_task');
    });

    it('should handle budget exceeded error', async () => {
      const { BudgetTracker } = require('@neon/utils');
      BudgetTracker.checkBudgetStatus.mockResolvedValue({
        canExecute: false,
        utilizationPercentage: 95.5,
      });

      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: {
          campaignName: 'Test Campaign',
          topic: 'AI Marketing',
          audience: 'Tech Professionals',
          platforms: ['instagram'],
          contentTypes: ['social_post'],
        },
        priority: 'high',
      };

      const result = await orchestrationAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('failed');
      expect(result.data.errorMessage).toContain('Budget exceeded');
    });

    it('should handle campaign cost exceeding budget limit', async () => {
      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: {
          campaignName: 'Test Campaign',
          topic: 'AI Marketing',
          audience: 'Tech Professionals',
          platforms: ['instagram'],
          contentTypes: ['social_post'],
          budget: { max: 0.05, currency: 'USD' },
        },
        priority: 'high',
      };

      const result = await orchestrationAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('failed');
      expect(result.data.errorMessage).toContain('Budget exceeded');
    });
  });

  describe('Performance and Metrics', () => {
    it('should track campaign execution metrics', async () => {
      const { BudgetTracker } = require('@neon/utils');
      
      // Reset budget status to allow execution
      BudgetTracker.checkBudgetStatus.mockResolvedValue({
        canExecute: true,
        utilizationPercentage: 45.2,
      });

      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: {
          campaignName: 'Test Campaign',
          topic: 'AI Marketing',
          audience: 'Tech Professionals',
          platforms: ['instagram'],
          contentTypes: ['social_post'],
        },
        priority: 'high',
      };

      // Mock agent responses with complete data structure
      mockTrendAgentInstance.execute.mockResolvedValue({
        success: true,
        data: { trends: [{ id: 'trend1', name: 'Test Trend' }] },
      });

      mockContentAgentInstance.execute.mockResolvedValue({
        success: true,
        data: { 
          content: 'Test content', 
          suggestedTitle: 'Test', 
          hashtags: [],
          seoScore: 85,
          readingTime: '2 min'
        },
      });

      mockSocialAgentInstance.execute.mockResolvedValue({
        success: true,
        data: { 
          postId: 'post123', 
          scheduledTime: new Date().toISOString(),
          status: 'scheduled'
        },
      });

      await orchestrationAgent.execute(payload);

      expect(BudgetTracker.trackCost).toHaveBeenCalledWith(
        expect.objectContaining({
          agentType: 'ORCHESTRATION',
          task: 'complete_campaign',
          conversionAchieved: true,
          qualityScore: 0.9,
        })
      );
    });

    it('should track failed campaign metrics', async () => {
      const { BudgetTracker } = require('@neon/utils');
      
      mockTrendAgentInstance.execute.mockResolvedValue({
        success: false,
        error: 'Test error',
      });

      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: {
          campaignName: 'Test Campaign',
          topic: 'AI Marketing',
          audience: 'Tech Professionals',
          platforms: ['instagram'],
          contentTypes: ['social_post'],
        },
        priority: 'high',
      };

      await orchestrationAgent.execute(payload);

      expect(BudgetTracker.trackCost).toHaveBeenCalledWith(
        expect.objectContaining({
          agentType: 'ORCHESTRATION',
          task: 'failed_campaign',
          conversionAchieved: false,
          qualityScore: 0,
        })
      );
    });

    it('should calculate success rate correctly', async () => {
      const payload: AgentPayload = {
        task: 'get_orchestration_status',
        context: {},
        priority: 'low',
      };

      const result = await orchestrationAgent.execute(payload);

      const successRate = parseFloat(result.data.performance.successRate.replace('%', ''));
      expect(successRate).toBeGreaterThan(90);
      expect(successRate).toBeLessThan(100);
    });
  });

  describe('Input Validation', () => {
    it('should validate campaign name', async () => {
      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: {
          campaignName: '',
          topic: 'AI Marketing',
          audience: 'Tech Professionals',
          platforms: ['instagram'],
          contentTypes: ['social_post'],
        },
        priority: 'high',
      };

      const result = await orchestrationAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Campaign name is required');
    });

    it('should validate platforms array', async () => {
      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: {
          campaignName: 'Test Campaign',
          topic: 'AI Marketing',
          audience: 'Tech Professionals',
          platforms: [],
          contentTypes: ['social_post'],
        },
        priority: 'high',
      };

      const result = await orchestrationAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('At least one platform is required');
    });

    it('should validate content types array', async () => {
      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: {
          campaignName: 'Test Campaign',
          topic: 'AI Marketing',
          audience: 'Tech Professionals',
          platforms: ['instagram'],
          contentTypes: [],
        },
        priority: 'high',
      };

      const result = await orchestrationAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('At least one content type is required');
    });

    it('should validate budget values', async () => {
      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: {
          campaignName: 'Test Campaign',
          topic: 'AI Marketing',
          audience: 'Tech Professionals',
          platforms: ['instagram'],
          contentTypes: ['social_post'],
          budget: { max: -1, currency: 'USD' },
        },
        priority: 'high',
      };

      const result = await orchestrationAgent.execute(payload);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Budget must be positive');
    });
  });

  describe('Scheduling and Timing', () => {
    it('should handle immediate scheduling', async () => {
      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: {
          campaignName: 'Test Campaign',
          topic: 'AI Marketing',
          audience: 'Tech Professionals',
          platforms: ['instagram'],
          contentTypes: ['social_post'],
          scheduling: { immediate: true },
        },
        priority: 'high',
      };

      // Mock agent responses
      mockTrendAgentInstance.execute.mockResolvedValue({
        success: true,
        data: { trends: [{ id: 'trend1', name: 'Test Trend' }] },
      });

      mockContentAgentInstance.execute.mockResolvedValue({
        success: true,
        data: { content: 'Test content', suggestedTitle: 'Test', hashtags: [] },
      });

      mockSocialAgentInstance.execute.mockResolvedValue({
        success: true,
        data: { postId: 'post123', scheduledTime: new Date().toISOString() },
      });

      const result = await orchestrationAgent.execute(payload);

              expect(result.success).toBe(true);
        expect(result.data.summary.postsScheduled).toBe(1); // One social post scheduled
    });

    it('should handle scheduled posting', async () => {
      const futureTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
      
      const payload: AgentPayload = {
        task: 'launch_campaign',
        context: {
          campaignName: 'Test Campaign',
          topic: 'AI Marketing',
          audience: 'Tech Professionals',
          platforms: ['instagram'],
          contentTypes: ['social_post'],
          scheduling: { immediate: false, scheduledTime: futureTime },
        },
        priority: 'high',
      };

      // Mock agent responses
      mockTrendAgentInstance.execute.mockResolvedValue({
        success: true,
        data: { trends: [{ id: 'trend1', name: 'Test Trend' }] },
      });

      mockContentAgentInstance.execute.mockResolvedValue({
        success: true,
        data: { content: 'Test content', suggestedTitle: 'Test', hashtags: [] },
      });

      const result = await orchestrationAgent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data.stages.socialPosting).toBeDefined();
      expect(result.data.stages.socialPosting.output.scheduledForLater).toBe(true);
    });
  });
}); 