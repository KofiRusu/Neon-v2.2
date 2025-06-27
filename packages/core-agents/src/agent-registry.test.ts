import { describe, it, expect, afterEach, beforeAll } from '@jest/globals';
import {
  registerAllAgents,
  getRegisteredAgents,
  getRegisteredAgentTypes,
  isAgentTypeRegistered,
  getAgentByType,
  getAgentsByCategory,
  createAgentInstance,
  checkAgentHealth,
  checkAllAgentHealth,
  getRegistryStats,
  createSEOAgent,
  createEmailMarketingAgent,
  createCustomerSupportAgent,
  AGENT_REGISTRY,
  AGENT_CAPABILITIES,
  AgentRegistryEntry,
} from './agent-registry';

// Mock the logger to avoid console output during tests
jest.mock('@neon/utils', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('AgentRegistry', () => {
  beforeAll(() => {
    // Ensure agents are registered before running tests
    registerAllAgents();
  });

  afterEach(() => {
    // Clear any mocks after each test
    jest.clearAllMocks();
  });

  describe('AGENT_REGISTRY constant', () => {
    it('should contain all 13 required agents', () => {
      const registryKeys = Object.keys(AGENT_REGISTRY);
      expect(registryKeys).toHaveLength(13);

      const expectedAgents = [
        'content',
        'seo',
        'ad',
        'outreach',
        'trend',
        'insight',
        'design',
        'email',
        'support',
        'brandvoice',
        'social',
        'uirefinement',
        'whatsapp',
      ];

      expectedAgents.forEach(agentKey => {
        expect(registryKeys).toContain(agentKey);
      });
    });

    it('should have properly structured agent entries', () => {
      Object.values(AGENT_REGISTRY).forEach((entry: AgentRegistryEntry) => {
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('name');
        expect(entry).toHaveProperty('type');
        expect(entry).toHaveProperty('description');
        expect(entry).toHaveProperty('capabilities');
        expect(entry).toHaveProperty('version');
        expect(entry).toHaveProperty('status');
        expect(entry).toHaveProperty('agentClass');
        expect(entry).toHaveProperty('category');

        expect(typeof entry.id).toBe('string');
        expect(typeof entry.name).toBe('string');
        expect(typeof entry.type).toBe('string');
        expect(typeof entry.description).toBe('string');
        expect(Array.isArray(entry.capabilities)).toBe(true);
        expect(typeof entry.version).toBe('string');
        expect(['active', 'inactive', 'maintenance']).toContain(entry.status);
        expect(typeof entry.agentClass).toBe('function');
        expect([
          'content',
          'marketing',
          'design',
          'analytics',
          'communication',
          'optimization',
        ]).toContain(entry.category);
      });
    });

    it('should have unique agent IDs and types', () => {
      const ids = Object.values(AGENT_REGISTRY).map(entry => entry.id);
      const types = Object.values(AGENT_REGISTRY).map(entry => entry.type);

      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(types).size).toBe(types.length);
    });
  });

  describe('registerAllAgents', () => {
    it('should register agents without throwing errors', () => {
      expect(() => registerAllAgents()).not.toThrow();
    });
  });

  describe('getRegisteredAgents', () => {
    it('should return all registered agents', () => {
      const agents = getRegisteredAgents();
      expect(agents).toHaveLength(13);
      expect(agents).toEqual(Object.values(AGENT_REGISTRY));
    });

    it('should return agents with complete metadata', () => {
      const agents = getRegisteredAgents();
      agents.forEach(agent => {
        expect(agent.capabilities.length).toBeGreaterThan(0);
        expect(agent.description.length).toBeGreaterThan(0);
        expect(agent.version).toBe('1.0.0');
      });
    });
  });

  describe('getRegisteredAgentTypes', () => {
    it('should return all agent types', () => {
      const types = getRegisteredAgentTypes();
      expect(types).toHaveLength(13);

      const expectedTypes = [
        'content',
        'seo',
        'ad',
        'outreach',
        'trend',
        'insight',
        'design',
        'email',
        'support',
        'brand_voice',
        'social',
        'ui-refinement',
        'whatsapp',
      ];

      expectedTypes.forEach(type => {
        expect(types).toContain(type);
      });
    });
  });

  describe('isAgentTypeRegistered', () => {
    it('should return true for registered agent types', () => {
      expect(isAgentTypeRegistered('content')).toBe(true);
      expect(isAgentTypeRegistered('seo')).toBe(true);
      expect(isAgentTypeRegistered('brand_voice')).toBe(true);
      expect(isAgentTypeRegistered('whatsapp')).toBe(true);
    });

    it('should return false for unregistered agent types', () => {
      expect(isAgentTypeRegistered('unknown')).toBe(false);
      expect(isAgentTypeRegistered('test')).toBe(false);
      expect(isAgentTypeRegistered('')).toBe(false);
    });
  });

  describe('getAgentByType', () => {
    it('should return agent entry for valid types', () => {
      const contentAgent = getAgentByType('content');
      expect(contentAgent).toBeDefined();
      expect(contentAgent?.type).toBe('content');
      expect(contentAgent?.name).toBe('Content Agent');
    });

    it('should return undefined for invalid types', () => {
      expect(getAgentByType('unknown')).toBeUndefined();
      expect(getAgentByType('')).toBeUndefined();
    });
  });

  describe('getAgentsByCategory', () => {
    it('should return agents for valid categories', () => {
      const marketingAgents = getAgentsByCategory('marketing');
      expect(marketingAgents.length).toBeGreaterThan(0);
      marketingAgents.forEach(agent => {
        expect(agent.category).toBe('marketing');
      });
    });

    it('should return empty array for invalid categories', () => {
      const unknownAgents = getAgentsByCategory('unknown');
      expect(unknownAgents).toEqual([]);
    });

    it('should categorize all agents correctly', () => {
      const categories = [
        'content',
        'marketing',
        'design',
        'analytics',
        'communication',
        'optimization',
      ];
      categories.forEach(category => {
        const agents = getAgentsByCategory(category);
        expect(agents.length).toBeGreaterThan(0);
      });
    });
  });

  describe('createAgentInstance', () => {
    it('should create agent instances for valid types', () => {
      const contentAgent = createAgentInstance('content');
      expect(contentAgent).toBeDefined();
      expect(contentAgent.type).toBe('content');
      expect(contentAgent.id).toContain('content-agent');
    });

    it('should create agent instances with custom IDs', () => {
      const customId = 'custom-test-123';
      const agent = createAgentInstance('seo', customId);
      expect(agent.id).toBe(customId);
    });

    it('should throw error for invalid agent types', () => {
      expect(() => createAgentInstance('unknown')).toThrow('Agent type not found: unknown');
    });
  });

  describe('checkAgentHealth', () => {
    it('should return health report for valid agents', async () => {
      const healthReport = await checkAgentHealth('content');

      expect(healthReport).toHaveProperty('agentId');
      expect(healthReport).toHaveProperty('agentName');
      expect(healthReport).toHaveProperty('healthy');
      expect(healthReport).toHaveProperty('status');
      expect(healthReport).toHaveProperty('lastCheck');
      expect(healthReport).toHaveProperty('responseTime');

      expect(typeof healthReport.healthy).toBe('boolean');
      expect(healthReport.lastCheck).toBeInstanceOf(Date);
      expect(typeof healthReport.responseTime).toBe('number');
    });

    it('should handle invalid agent types gracefully', async () => {
      const healthReport = await checkAgentHealth('unknown');

      expect(healthReport.healthy).toBe(false);
      expect(healthReport.error).toBeDefined();
      expect(healthReport.agentId).toBe('unknown');
    });
  });

  describe('checkAllAgentHealth', () => {
    it('should return health reports for all agents', async () => {
      const healthReports = await checkAllAgentHealth();

      expect(healthReports).toHaveLength(13);

      healthReports.forEach(report => {
        expect(report).toHaveProperty('agentId');
        expect(report).toHaveProperty('agentName');
        expect(report).toHaveProperty('healthy');
        expect(report).toHaveProperty('status');
        expect(report).toHaveProperty('lastCheck');
        expect(typeof report.healthy).toBe('boolean');
      });
    });

    it('should complete within reasonable time', async () => {
      const startTime = Date.now();
      await checkAllAgentHealth();
      const duration = Date.now() - startTime;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('getRegistryStats', () => {
    it('should return comprehensive registry statistics', () => {
      const stats = getRegistryStats();

      expect(stats).toHaveProperty('totalAgents');
      expect(stats).toHaveProperty('categories');
      expect(stats).toHaveProperty('capabilities');
      expect(stats).toHaveProperty('activeAgents');
      expect(stats).toHaveProperty('inactiveAgents');

      expect(stats.totalAgents).toBe(13);
      expect(stats.activeAgents).toBeGreaterThan(0);
      expect(stats.totalAgents).toBe(stats.activeAgents + stats.inactiveAgents);
    });

    it('should correctly count categories', () => {
      const stats = getRegistryStats();
      const expectedCategories = [
        'content',
        'marketing',
        'design',
        'analytics',
        'communication',
        'optimization',
      ];

      expectedCategories.forEach(category => {
        expect(stats.categories[category]).toBeGreaterThan(0);
      });
    });

    it('should count capabilities correctly', () => {
      const stats = getRegistryStats();

      expect(Object.keys(stats.capabilities).length).toBeGreaterThan(0);
      Object.values(stats.capabilities).forEach(count => {
        expect(count).toBeGreaterThan(0);
      });
    });
  });

  describe('Legacy functions', () => {
    describe('createSEOAgent', () => {
      it('should create SEO agent instance', () => {
        const seoAgent = createSEOAgent();
        expect(seoAgent).toBeDefined();
        expect(seoAgent.type).toBe('seo');
      });
    });

    describe('createEmailMarketingAgent', () => {
      it('should create email marketing agent instance', () => {
        const emailAgent = createEmailMarketingAgent();
        expect(emailAgent).toBeDefined();
        expect(emailAgent.type).toBe('email');
      });
    });

    describe('createCustomerSupportAgent', () => {
      it('should create customer support agent instance', () => {
        const supportAgent = createCustomerSupportAgent();
        expect(supportAgent).toBeDefined();
        expect(supportAgent.type).toBe('support');
      });
    });
  });

  describe('AGENT_CAPABILITIES', () => {
    it('should contain capabilities for all agent types', () => {
      const agentTypes = getRegisteredAgentTypes();

      agentTypes.forEach(type => {
        expect(AGENT_CAPABILITIES).toHaveProperty(type);
        const capabilities = AGENT_CAPABILITIES[type];
        expect(Array.isArray(capabilities)).toBe(true);
        expect(capabilities?.length).toBeGreaterThan(0);
      });
    });

    it('should match registry capabilities', () => {
      Object.values(AGENT_REGISTRY).forEach(entry => {
        expect(AGENT_CAPABILITIES[entry.type]).toEqual(entry.capabilities);
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty string inputs gracefully', () => {
      expect(isAgentTypeRegistered('')).toBe(false);
      expect(getAgentByType('')).toBeUndefined();
      expect(getAgentsByCategory('')).toEqual([]);
    });

    it('should handle null/undefined inputs gracefully', () => {
      expect(() => isAgentTypeRegistered(null as unknown as string)).not.toThrow();
      expect(() => getAgentByType(undefined as unknown as string)).not.toThrow();
      expect(() => getAgentsByCategory(null as unknown as string)).not.toThrow();
    });

    it('should maintain immutability of registry', () => {
      const agents = getRegisteredAgents();
      const originalLength = agents.length;

      // Attempt to modify returned array
      agents.push({} as AgentRegistryEntry);

      // Original registry should be unaffected
      expect(getRegisteredAgents()).toHaveLength(originalLength);
    });
  });

  describe('Performance', () => {
    it('should execute registry operations quickly', () => {
      const startTime = Date.now();

      // Perform multiple operations
      getRegisteredAgents();
      getRegisteredAgentTypes();
      getRegistryStats();
      isAgentTypeRegistered('content');
      getAgentByType('seo');
      getAgentsByCategory('marketing');

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });
  });

  describe('Agent instantiation', () => {
    it('should create unique instances for the same agent type', () => {
      const agent1 = createAgentInstance('content');
      const agent2 = createAgentInstance('content');

      expect(agent1.id).not.toBe(agent2.id);
      expect(agent1).not.toBe(agent2);
    });

    it('should create instances with correct capabilities', () => {
      const contentAgent = createAgentInstance('content');
      const contentEntry = AGENT_REGISTRY.content;
      expect(contentEntry).toBeDefined();
      const expectedCapabilities = contentEntry?.capabilities ?? [];

      expect(contentAgent.getCapabilities()).toEqual(expectedCapabilities);
    });
  });
});
