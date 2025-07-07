import { SimpleSocialAgent } from '../agents/simple-social-agent';
import { AgentPayload } from '../base-agent';

describe('SimpleSocialAgent', () => {
  let agent: SimpleSocialAgent;

  beforeEach(() => {
    agent = new SimpleSocialAgent();
  });

  describe('constructor', () => {
    it('should initialize agent with correct properties', () => {
      expect(agent.id).toBe('simple-social-agent');
      expect(agent.name).toBe('SimpleSocialAgent');
      expect(agent.type).toBe('social');
      expect(agent.capabilities).toEqual([
        'generate_post',
        'schedule_post',
        'reply_to_message',
        'get_status',
      ]);
    });
  });

  describe('validate', () => {
    it('should validate correct input', () => {
      const result = agent.validate({ task: 'post' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid input', () => {
      const result = agent.validate({ task: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe('execute', () => {
    it('should execute generate_post task successfully', async () => {
      const payload: AgentPayload = {
        task: 'generate_post',
        context: {
          task: 'generate_post',
          topic: 'neon signs',
          platform: 'instagram',
        },
        priority: 'medium',
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('post');
      expect(response.data).toHaveProperty('platform', 'instagram');
      expect(response.data).toHaveProperty('topic', 'neon signs');
    });

    it('should execute schedule_post task successfully', async () => {
      const payload: AgentPayload = {
        task: 'schedule_post',
        context: {
          task: 'schedule_post',
          content: 'Test post content',
          datetime: '2024-01-01T12:00:00Z',
          platform: 'twitter',
        },
        priority: 'medium',
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('scheduled', true);
      expect(response.data).toHaveProperty('content', 'Test post content');
      expect(response.data).toHaveProperty('platform', 'twitter');
    });

    it('should execute reply_to_message task successfully', async () => {
      const payload: AgentPayload = {
        task: 'reply_to_message',
        context: {
          task: 'reply_to_message',
          message: 'Great service!',
          sentiment: 'positive',
          platform: 'facebook',
        },
        priority: 'medium',
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('reply');
      expect(response.data).toHaveProperty('sentiment', 'positive');
      expect(response.data).toHaveProperty('platform', 'facebook');
    });

    it('should execute get_status task successfully', async () => {
      const payload: AgentPayload = {
        task: 'get_status',
        context: {
          task: 'get_status',
        },
        priority: 'medium',
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('agent', 'SimpleSocialAgent');
      expect(response.data).toHaveProperty('status', 'active');
      expect(response.data).toHaveProperty('capabilities');
    });

    it('should handle unknown task', async () => {
      const payload: AgentPayload = {
        task: 'unknown_task',
        context: {
          task: 'unknown_task',
        },
        priority: 'medium',
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Unknown task: unknown_task');
    });

    it('should handle invalid context for generate_post', async () => {
      const payload: AgentPayload = {
        task: 'generate_post',
        context: {
          task: 'generate_post',
          // Missing required topic and platform
        },
        priority: 'medium',
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Topic and platform are required');
    });

    it('should handle invalid context for schedule_post', async () => {
      const payload: AgentPayload = {
        task: 'schedule_post',
        context: {
          task: 'schedule_post',
          // Missing required content, datetime, and platform
        },
        priority: 'medium',
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Content, datetime, and platform are required');
    });

    it('should handle invalid context for reply_to_message', async () => {
      const payload: AgentPayload = {
        task: 'reply_to_message',
        context: {
          task: 'reply_to_message',
          // Missing required message, sentiment, and platform
        },
        priority: 'medium',
      };

      const response = await agent.execute(payload);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Message, sentiment, and platform are required');
    });
  });

  describe('getStatus', () => {
    it('should return agent status', async () => {
      const status = await agent.getStatus();

      expect(status).toEqual({
        id: 'simple-social-agent',
        name: 'SimpleSocialAgent',
        type: 'social',
        status: 'idle',
        capabilities: [
          'generate_post',
          'schedule_post',
          'reply_to_message',
          'get_status',
        ],
        lastExecution: undefined,
        performance: undefined,
      });
    });
  });
}); 