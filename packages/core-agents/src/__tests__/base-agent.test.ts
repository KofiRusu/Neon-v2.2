import { AbstractAgent, AgentFactory, AgentManager } from '../base-agent';
import { AgentPayload, AgentResult, ContentContext, ContentResult } from '../types';

// Mock agent for testing
class TestAgent extends AbstractAgent {
  constructor(id: string, name: string) {
    super(id, name, 'test', ['test_capability']);
  }

  async execute(payload: AgentPayload): Promise<AgentResult> {
    return this.executeWithErrorHandling(payload, async () => {
      const _context = payload.context as ContentContext;

      if (payload.task === 'fail') {
        throw new Error('Test error');
      }

      const result: ContentResult = {
        content: 'Test content',
        metadata: {
          wordCount: 100,
          tone: 'test',
          keywords: ['test'],
        },
      };

      return result;
    });
  }
}

describe('AbstractAgent', () => {
  let agent: TestAgent;

  beforeEach(() => {
    agent = new TestAgent('test-1', 'Test Agent');
  });

  describe('constructor', () => {
    it('should initialize agent with correct properties', () => {
      expect(agent.id).toBe('test-1');
      expect(agent.name).toBe('Test Agent');
      expect(agent.type).toBe('test');
      expect(agent.capabilities).toEqual(['test_capability']);
    });
  });

  describe('getStatus', () => {
    it('should return agent status', async () => {
      const status = await agent.getStatus();

      expect(status).toEqual({
        id: 'test-1',
        name: 'Test Agent',
        type: 'test',
        status: 'idle',
        capabilities: ['test_capability'],
        lastExecution: undefined,
        performance: undefined,
      });
    });
  });

  describe('validatePayload', () => {
    it('should validate correct payload', () => {
      const payload: AgentPayload = {
        task: 'test_task',
        context: {},
        priority: 'medium',
      };

      expect(agent.validatePayload(payload)).toBe(true);
    });

    it('should reject invalid payload', () => {
      const invalidPayload = {
        task: 123, // Should be string
        priority: 'invalid',
      } as unknown as AgentPayload;

      expect(agent.validatePayload(invalidPayload)).toBe(false);
    });
  });

  describe('getCapabilities', () => {
    it('should return agent capabilities', () => {
      expect(agent.getCapabilities()).toEqual(['test_capability']);
    });
  });

  describe('execute', () => {
    it('should execute task successfully', async () => {
      const payload: AgentPayload = {
        task: 'test_task',
        context: { platform: 'instagram' },
        priority: 'high',
      };

      const result = await agent.execute(payload);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.metadata?.duration).toBeGreaterThan(0);
      expect(result.metadata).toMatchObject({
        agentId: 'test-1',
        agentName: 'Test Agent',
      });
    });

    it('should handle execution errors gracefully', async () => {
      const payload: AgentPayload = {
        task: 'fail',
        context: {},
        priority: 'medium',
      };

      const result = await agent.execute(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
      expect(result.metadata?.duration).toBeGreaterThan(0);
    });

    it('should handle invalid payload', async () => {
      const invalidPayload = {
        task: 123,
      } as unknown as AgentPayload;

      const result = await agent.execute(invalidPayload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid payload');
    });
  });
});

describe('AgentFactory', () => {
  beforeEach(() => {
    // Clear any registered agents
    AgentFactory['agents'].clear();
  });

  describe('registerAgent', () => {
    it('should register agent class', () => {
      AgentFactory.registerAgent('test', TestAgent);

      expect(AgentFactory.getAvailableTypes()).toContain('test');
    });
  });

  describe('createAgent', () => {
    it('should create agent instance', () => {
      AgentFactory.registerAgent('test', TestAgent);

      const agent = AgentFactory.createAgent('test', 'test-1', 'Test Agent');

      expect(agent).toBeInstanceOf(TestAgent);
      expect(agent.id).toBe('test-1');
      expect(agent.name).toBe('Test Agent');
    });

    it('should throw error for unknown agent type', () => {
      expect(() => {
        AgentFactory.createAgent('unknown', 'test-1', 'Test Agent');
      }).toThrow('Unknown agent type: unknown');
    });
  });

  describe('getAvailableTypes', () => {
    it('should return empty array when no agents registered', () => {
      expect(AgentFactory.getAvailableTypes()).toEqual([]);
    });

    it('should return registered agent types', () => {
      AgentFactory.registerAgent('test1', TestAgent);
      AgentFactory.registerAgent('test2', TestAgent);

      const types = AgentFactory.getAvailableTypes();
      expect(types).toContain('test1');
      expect(types).toContain('test2');
      expect(types).toHaveLength(2);
    });
  });
});

describe('AgentManager', () => {
  let manager: AgentManager;
  let agent: TestAgent;

  beforeEach(() => {
    manager = new AgentManager();
    agent = new TestAgent('test-1', 'Test Agent');
  });

  describe('registerAgent', () => {
    it('should register agent', () => {
      manager.registerAgent(agent);

      expect(manager.getAgent('test-1')).toBe(agent);
    });
  });

  describe('getAgent', () => {
    it('should return registered agent', () => {
      manager.registerAgent(agent);

      expect(manager.getAgent('test-1')).toBe(agent);
    });

    it('should return undefined for non-existent agent', () => {
      expect(manager.getAgent('non-existent')).toBeUndefined();
    });
  });

  describe('getAllAgents', () => {
    it('should return all registered agents', () => {
      const agent2 = new TestAgent('test-2', 'Test Agent 2');

      manager.registerAgent(agent);
      manager.registerAgent(agent2);

      const agents = manager.getAllAgents();
      expect(agents).toHaveLength(2);
      expect(agents).toContain(agent);
      expect(agents).toContain(agent2);
    });
  });

  describe('executeAgent', () => {
    it('should execute agent by id', async () => {
      manager.registerAgent(agent);

      const payload: AgentPayload = {
        task: 'test_task',
        context: {},
        priority: 'medium',
      };

      const result = await manager.executeAgent('test-1', payload);

      expect(result.success).toBe(true);
    });

    it('should throw error for non-existent agent', async () => {
      const payload: AgentPayload = {
        task: 'test_task',
        context: {},
        priority: 'medium',
      };

      await expect(manager.executeAgent('non-existent', payload)).rejects.toThrow(
        'Agent not found: non-existent'
      );
    });
  });

  describe('getAgentStatus', () => {
    it('should return agent status', async () => {
      manager.registerAgent(agent);

      const status = await manager.getAgentStatus('test-1');

      expect(status).toBeDefined();
      expect(status?.id).toBe('test-1');
    });

    it('should return null for non-existent agent', async () => {
      const status = await manager.getAgentStatus('non-existent');

      expect(status).toBeNull();
    });
  });

  describe('getAllAgentStatuses', () => {
    it('should return all agent statuses', async () => {
      const agent2 = new TestAgent('test-2', 'Test Agent 2');

      manager.registerAgent(agent);
      manager.registerAgent(agent2);

      const statuses = await manager.getAllAgentStatuses();

      expect(statuses).toHaveLength(2);
      expect(statuses[0]?.id).toBe('test-1');
      expect(statuses[1]?.id).toBe('test-2');
    });
  });

  describe('getAgentsByType', () => {
    it('should return agents by type', () => {
      const agent2 = new TestAgent('test-2', 'Test Agent 2');

      manager.registerAgent(agent);
      manager.registerAgent(agent2);

      const testAgents = manager.getAgentsByType('test');

      expect(testAgents).toHaveLength(2);
      expect(testAgents).toContain(agent);
      expect(testAgents).toContain(agent2);
    });

    it('should return empty array for non-existent type', () => {
      manager.registerAgent(agent);

      const nonExistentAgents = manager.getAgentsByType('non-existent');

      expect(nonExistentAgents).toEqual([]);
    });
  });

  describe('getAgentsByCapability', () => {
    it('should return agents by capability', () => {
      manager.registerAgent(agent);

      const capableAgents = manager.getAgentsByCapability('test_capability');

      expect(capableAgents).toHaveLength(1);
      expect(capableAgents[0]).toBe(agent);
    });

    it('should return empty array for non-existent capability', () => {
      manager.registerAgent(agent);

      const capableAgents = manager.getAgentsByCapability('non-existent');

      expect(capableAgents).toEqual([]);
    });
  });
});
