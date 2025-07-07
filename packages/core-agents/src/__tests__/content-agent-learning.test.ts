import { ContentAgent } from '../agents/content-agent';
import { LearningService } from '../utils/LearningService';

// Mock LearningService
jest.mock('../utils/LearningService');
const mockLearningService = LearningService as jest.Mocked<typeof LearningService>;

// Mock logger and BudgetTracker
jest.mock('@neon/utils', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  BudgetTracker: {
    checkBudgetStatus: jest.fn().mockResolvedValue({ canExecute: true, utilizationPercentage: 50 }),
    trackCost: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('ContentAgent Learning Integration', () => {
  let contentAgent: ContentAgent;

  beforeEach(() => {
    contentAgent = new ContentAgent();
    jest.clearAllMocks();
  });

  it('should apply learning profile recommendations for tone adjustment', async () => {
    // Mock learning profile that suggests casual tone
    const mockLearningProfile = {
      score: 65,
      toneAdjustment: 'make tone more casual for better engagement',
      trendAdjustment: 'focus on trending hashtags',
      platformStrategy: 'post more frequently on Instagram',
    };

    mockLearningService.generateLearningProfile.mockResolvedValue(mockLearningProfile);

    // Mock OpenAI response
    const mockOpenAIResponse = {
      choices: [{ message: { content: 'Test content with casual tone' } }],
      usage: { total_tokens: 150 },
    };

    // Mock the openai property
    (contentAgent as any).openai = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(mockOpenAIResponse),
        },
      },
    };

    // Mock memoryStore
    (contentAgent as any).memoryStore = {
      store: jest.fn().mockResolvedValue(undefined),
    };

    // Test content generation with campaignId
    const result = await contentAgent.generateContent({
      topic: 'AI Marketing',
      type: 'social_post',
      tone: 'professional', // Original tone
      audience: 'marketers',
      campaignId: 'test-campaign-123',
    });

    // Verify learning profile was called
    expect(mockLearningService.generateLearningProfile).toHaveBeenCalledWith('test-campaign-123');

    // Verify content was generated successfully
    expect(result.success).toBe(true);
    expect(result.content).toBe('Test content with casual tone');
    expect(result.tokensUsed).toBe(150);
  });

  it('should handle learning profile generation failure gracefully', async () => {
    // Mock learning profile generation failure
    mockLearningService.generateLearningProfile.mockRejectedValue(new Error('Learning profile failed'));

    // Mock OpenAI response
    const mockOpenAIResponse = {
      choices: [{ message: { content: 'Test content with original tone' } }],
      usage: { total_tokens: 120 },
    };

    (contentAgent as any).openai = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(mockOpenAIResponse),
        },
      },
    };

    (contentAgent as any).memoryStore = {
      store: jest.fn().mockResolvedValue(undefined),
    };

    // Test content generation with campaignId but failing learning profile
    const result = await contentAgent.generateContent({
      topic: 'AI Marketing',
      type: 'social_post',
      tone: 'professional',
      audience: 'marketers',
      campaignId: 'test-campaign-123',
    });

    // Verify learning profile was attempted
    expect(mockLearningService.generateLearningProfile).toHaveBeenCalledWith('test-campaign-123');

    // Verify content was still generated with fallback
    expect(result.success).toBe(true);
    expect(result.content).toBe('Test content with original tone');
  });

  it('should work without campaignId (no learning adaptations)', async () => {
    // Mock OpenAI response
    const mockOpenAIResponse = {
      choices: [{ message: { content: 'Test content without learning' } }],
      usage: { total_tokens: 100 },
    };

    (contentAgent as any).openai = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(mockOpenAIResponse),
        },
      },
    };

    // Test content generation without campaignId
    const result = await contentAgent.generateContent({
      topic: 'AI Marketing',
      type: 'social_post',
      tone: 'professional',
      audience: 'marketers',
      // No campaignId provided
    });

    // Verify learning profile was NOT called
    expect(mockLearningService.generateLearningProfile).not.toHaveBeenCalled();

    // Verify content was generated successfully
    expect(result.success).toBe(true);
    expect(result.content).toBe('Test content without learning');
  });

  it('should apply friendly tone when learning profile suggests it', async () => {
    // Mock learning profile that suggests friendly tone
    const mockLearningProfile = {
      score: 70,
      toneAdjustment: 'make tone more friendly to increase engagement',
      trendAdjustment: 'boost trending keywords',
      platformStrategy: 'increase posting frequency',
    };

    mockLearningService.generateLearningProfile.mockResolvedValue(mockLearningProfile);

    const mockOpenAIResponse = {
      choices: [{ message: { content: 'Test content with friendly tone' } }],
      usage: { total_tokens: 140 },
    };

    (contentAgent as any).openai = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(mockOpenAIResponse),
        },
      },
    };

    (contentAgent as any).memoryStore = {
      store: jest.fn().mockResolvedValue(undefined),
    };

    const result = await contentAgent.generateContent({
      topic: 'AI Marketing',
      type: 'social_post',
      tone: 'professional',
      audience: 'marketers',
      campaignId: 'test-campaign-456',
    });

    expect(result.success).toBe(true);
    expect(mockLearningService.generateLearningProfile).toHaveBeenCalledWith('test-campaign-456');
  });

  it('should maintain professional tone for high-performing campaigns', async () => {
    // Mock learning profile with high score that suggests maintaining professional tone
    const mockLearningProfile = {
      score: 85,
      toneAdjustment: 'maintain professional tone - performing well',
      trendAdjustment: 'continue current trend strategy',
      platformStrategy: 'maintain current posting schedule',
    };

    mockLearningService.generateLearningProfile.mockResolvedValue(mockLearningProfile);

    const mockOpenAIResponse = {
      choices: [{ message: { content: 'Test professional content' } }],
      usage: { total_tokens: 130 },
    };

    (contentAgent as any).openai = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(mockOpenAIResponse),
        },
      },
    };

    (contentAgent as any).memoryStore = {
      store: jest.fn().mockResolvedValue(undefined),
    };

    const result = await contentAgent.generateContent({
      topic: 'AI Marketing',
      type: 'social_post',
      tone: 'professional',
      audience: 'marketers',
      campaignId: 'test-campaign-789',
    });

    expect(result.success).toBe(true);
    expect(mockLearningService.generateLearningProfile).toHaveBeenCalledWith('test-campaign-789');
  });
}); 