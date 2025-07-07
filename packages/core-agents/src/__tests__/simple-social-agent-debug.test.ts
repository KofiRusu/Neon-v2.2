import { SimpleSocialAgent } from '../agents/simple-social-agent';
import { LearningService } from '../utils/LearningService';
import { AgentMemoryStore } from '../memory/AgentMemoryStore';

// Mock the dependencies
jest.mock('../utils/LearningService');
jest.mock('../memory/AgentMemoryStore');

const mockLearningService = LearningService as jest.Mocked<typeof LearningService>;
const mockMemoryStore = AgentMemoryStore as jest.MockedClass<typeof AgentMemoryStore>;

describe('SimpleSocialAgent Debug', () => {
  let socialAgent: SimpleSocialAgent;
  let mockStoreMemory: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock AgentMemoryStore
    mockStoreMemory = jest.fn().mockResolvedValue({
      id: 'memory-123',
      agentId: 'simple-social-agent',
      sessionId: 'campaign-123',
      timestamp: new Date(),
      success: true,
    });

    mockMemoryStore.mockImplementation(() => ({
      storeMemory: mockStoreMemory,
    } as any));

    // Create SimpleSocialAgent instance
    socialAgent = new SimpleSocialAgent();
  });

  it('should debug simple execution without learning', async () => {
    const result = await socialAgent.execute({
      task: 'schedule_post',
      context: {
        content: 'Test post',
        datetime: '2024-01-15T12:00:00.000Z',
        platform: 'instagram'
        // No campaignId - should not use learning
      }
    });

    console.log('Result:', JSON.stringify(result, null, 2));

    if (!result.success) {
      console.log('Error:', result.error);
    }
  });

  it('should debug execution with campaignId', async () => {
    const mockLearningProfile = {
      score: 85,
      toneAdjustment: 'maintain current tone',
      trendAdjustment: 'continue current trends',
      platformStrategy: 'post earlier on Instagram',
    };

    mockLearningService.generateLearningProfile.mockResolvedValue(mockLearningProfile);

    const result = await socialAgent.execute({
      task: 'schedule_post',
      context: {
        content: 'Test post with learning',
        datetime: '2024-01-15T14:00:00.000Z',
        platform: 'instagram',
        campaignId: 'campaign-123'
      }
    });

    console.log('Result with learning:', JSON.stringify(result, null, 2));

    if (!result.success) {
      console.log('Error with learning:', result.error);
    }
  });

  it('should debug timing optimization', async () => {
    console.log('Testing Instagram 3 AM optimization:');
    const instagramTime = (socialAgent as any).getOptimizedPostTime('instagram', '2024-01-15T03:00:00.000Z');
    console.log('Input: 2024-01-15T03:00:00.000Z');
    console.log('Output:', instagramTime);
    
    console.log('\nTesting Facebook 5 AM optimization:');
    const facebookTime = (socialAgent as any).getOptimizedPostTime('facebook', '2024-01-15T05:00:00.000Z');
    console.log('Input: 2024-01-15T05:00:00.000Z');
    console.log('Output:', facebookTime);
    
    console.log('\nTesting Twitter 6 AM optimization:');
    const twitterTime = (socialAgent as any).getOptimizedPostTime('twitter', '2024-01-15T06:00:00.000Z');
    console.log('Input: 2024-01-15T06:00:00.000Z');
    console.log('Output:', twitterTime);
    
    console.log('\nTesting LinkedIn 22 PM optimization:');
    const linkedinTime = (socialAgent as any).getOptimizedPostTime('linkedin', '2024-01-15T22:00:00.000Z');
    console.log('Input: 2024-01-15T22:00:00.000Z');
    console.log('Output:', linkedinTime);
  });

  it('should debug platform extraction', async () => {
    console.log('Testing platform extraction:');
    const strategy = 'focus budget on Instagram and LinkedIn for better engagement on Twitter';
    const platforms = (socialAgent as any).extractPlatformsFromStrategy(strategy);
    console.log('Strategy:', strategy);
    console.log('Extracted platforms:', platforms);
  });
}); 