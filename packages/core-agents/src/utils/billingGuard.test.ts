import { 
  BillingGuard, 
  BudgetInsufficientError, 
  enforceAgentBudget, 
  logAgentSpend,
  AGENT_EXECUTION_COSTS,
  TASK_COMPLEXITY_MULTIPLIERS 
} from './billingGuard';

// Mock the logger
jest.mock('@neon/utils', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('BillingGuard', () => {
  let billingGuard: BillingGuard;

  beforeEach(() => {
    billingGuard = BillingGuard.getInstance();
    billingGuard.setOverride(false); // Reset override for each test
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('BillingGuard Instance', () => {
    it('should return the same instance (singleton)', () => {
      const instance1 = BillingGuard.getInstance();
      const instance2 = BillingGuard.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should allow setting and getting override status', () => {
      expect(billingGuard.isOverrideEnabled()).toBe(false);
      
      billingGuard.setOverride(true);
      expect(billingGuard.isOverrideEnabled()).toBe(true);
      
      billingGuard.setOverride(false);
      expect(billingGuard.isOverrideEnabled()).toBe(false);
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate correct base costs for different agent types', () => {
      expect(AGENT_EXECUTION_COSTS.CONTENT).toBe(0.05);
      expect(AGENT_EXECUTION_COSTS.AD).toBe(0.08);
      expect(AGENT_EXECUTION_COSTS.DESIGN).toBe(0.10);
      expect(AGENT_EXECUTION_COSTS.CUSTOMER_SUPPORT).toBe(0.02);
    });

    it('should apply complexity multipliers correctly', () => {
      expect(TASK_COMPLEXITY_MULTIPLIERS.simple).toBe(1.0);
      expect(TASK_COMPLEXITY_MULTIPLIERS.standard).toBe(1.2);
      expect(TASK_COMPLEXITY_MULTIPLIERS.complex).toBe(1.5);
      expect(TASK_COMPLEXITY_MULTIPLIERS.premium).toBe(2.0);
    });
  });

  describe('Budget Enforcement', () => {
    it('should allow execution when budget is sufficient', async () => {
      // Mock sufficient budget
      jest.spyOn(billingGuard as any, 'checkCurrentBudget').mockResolvedValue({
        totalBudget: 100,
        totalSpent: 20,
        remainingBudget: 80,
        utilizationPercentage: 20,
        isOverBudget: false,
        isNearBudget: false,
      });

      jest.spyOn(billingGuard as any, 'calculateEstimatedCost').mockReturnValue(5);

      const result = await billingGuard.enforceAgentBudget({
        agentType: 'CONTENT',
        estimatedCost: 5,
        task: 'generate_post',
        userId: 'user123',
      });

      expect(result.canExecute).toBe(true);
      expect(result.remainingBudget).toBe(80);
      expect(result.estimatedCost).toBe(5);
    });

    it('should throw BudgetInsufficientError when budget is insufficient', async () => {
      // Mock insufficient budget
      jest.spyOn(billingGuard as any, 'checkCurrentBudget').mockResolvedValue({
        totalBudget: 100,
        totalSpent: 98,
        remainingBudget: 2,
        utilizationPercentage: 98,
        isOverBudget: false,
        isNearBudget: true,
      });

      jest.spyOn(billingGuard as any, 'calculateEstimatedCost').mockReturnValue(5);

      await expect(billingGuard.enforceAgentBudget({
        agentType: 'CONTENT',
        estimatedCost: 5,
        task: 'generate_post',
        userId: 'user123',
      })).rejects.toThrow(BudgetInsufficientError);
    });

    it('should allow execution when override is enabled', async () => {
      billingGuard.setOverride(true);

      // Mock insufficient budget
      jest.spyOn(billingGuard as any, 'checkCurrentBudget').mockResolvedValue({
        totalBudget: 100,
        totalSpent: 98,
        remainingBudget: 2,
        utilizationPercentage: 98,
        isOverBudget: false,
        isNearBudget: true,
      });

      jest.spyOn(billingGuard as any, 'calculateEstimatedCost').mockReturnValue(5);

      const result = await billingGuard.enforceAgentBudget({
        agentType: 'CONTENT',
        estimatedCost: 5,
        task: 'generate_post',
        userId: 'user123',
      });

      expect(result.canExecute).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should handle system errors gracefully', async () => {
      // Mock system error
      jest.spyOn(billingGuard as any, 'checkCurrentBudget').mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await billingGuard.enforceAgentBudget({
        agentType: 'CONTENT',
        estimatedCost: 5,
        task: 'generate_post',
        userId: 'user123',
      });

      // Should allow execution on system error to prevent system breakdown
      expect(result.canExecute).toBe(true);
      expect(result.reason).toBe('Budget check system error - execution allowed');
    });
  });

  describe('Spend Logging', () => {
    it('should log spend successfully', async () => {
      // Mock successful API call
      jest.spyOn(billingGuard as any, 'makeApiCall').mockResolvedValue({
        success: true,
        id: 'log_123',
      });

      await expect(billingGuard.logAgentSpend({
        agentType: 'CONTENT',
        actualCost: 0.05,
        campaignId: 'camp_123',
        task: 'generate_post',
        userId: 'user123',
        executionId: 'exec_123',
        tokens: 1000,
        executionTime: 2500,
        success: true,
      })).resolves.not.toThrow();
    });

    it('should handle logging failures gracefully', async () => {
      // Mock API failure
      jest.spyOn(billingGuard as any, 'makeApiCall').mockRejectedValue(
        new Error('API call failed')
      );

      // Should not throw error even when logging fails
      await expect(billingGuard.logAgentSpend({
        agentType: 'CONTENT',
        actualCost: 0.05,
        campaignId: 'camp_123',
        task: 'generate_post',
        userId: 'user123',
        executionId: 'exec_123',
        tokens: 1000,
        executionTime: 2500,
        success: true,
      })).resolves.not.toThrow();
    });
  });

  describe('Convenience Functions', () => {
    it('should enforce budget using convenience function', async () => {
      jest.spyOn(billingGuard, 'enforceAgentBudget').mockResolvedValue({
        canExecute: true,
        currentBudget: 100,
        estimatedCost: 5,
        remainingBudget: 95,
        utilizationPercentage: 5,
        isOverBudget: false,
        isNearBudget: false,
      });

      const result = await enforceAgentBudget('CONTENT', 'generate_post', {
        campaignId: 'camp_123',
        userId: 'user123',
        complexity: 'standard',
      });

      expect(result.canExecute).toBe(true);
      expect(billingGuard.enforceAgentBudget).toHaveBeenCalledWith(
        expect.objectContaining({
          agentType: 'CONTENT',
          task: 'generate_post',
          campaignId: 'camp_123',
          userId: 'user123',
        })
      );
    });

    it('should log spend using convenience function', async () => {
      jest.spyOn(billingGuard, 'logAgentSpend').mockResolvedValue();

      await logAgentSpend('CONTENT', 0.05, {
        campaignId: 'camp_123',
        task: 'generate_post',
        userId: 'user123',
        executionId: 'exec_123',
        tokens: 1000,
        executionTime: 2500,
        success: true,
      });

      expect(billingGuard.logAgentSpend).toHaveBeenCalledWith(
        expect.objectContaining({
          agentType: 'CONTENT',
          actualCost: 0.05,
          campaignId: 'camp_123',
          task: 'generate_post',
          userId: 'user123',
          success: true,
        })
      );
    });
  });

  describe('BudgetInsufficientError', () => {
    it('should create error with correct properties', () => {
      const error = new BudgetInsufficientError(
        'Insufficient budget',
        10.50,
        15.75,
        'Please add funds'
      );

      expect(error.name).toBe('BudgetInsufficientError');
      expect(error.message).toBe('Insufficient budget');
      expect(error.currentBudget).toBe(10.50);
      expect(error.requiredCost).toBe(15.75);
      expect(error.suggestedAction).toBe('Please add funds');
    });

    it('should use default suggested action', () => {
      const error = new BudgetInsufficientError(
        'Insufficient budget',
        10.50,
        15.75
      );

      expect(error.suggestedAction).toBe('Please top up your budget to continue using AI agents');
    });
  });

  describe('Mock API Responses', () => {
    it('should return mock budget status', () => {
      const mockResponse = (billingGuard as any).getMockApiResponse('billing.getBudgetStatus', {});
      
      expect(mockResponse).toHaveProperty('totalBudget');
      expect(mockResponse).toHaveProperty('totalSpent');
      expect(mockResponse).toHaveProperty('remainingBudget');
      expect(mockResponse).toHaveProperty('utilizationPercentage');
      expect(mockResponse).toHaveProperty('isOverBudget');
      expect(mockResponse).toHaveProperty('isNearBudget');
    });

    it('should return mock cost logging response', () => {
      const params = { tokens: 1000, agentType: 'CONTENT' };
      const mockResponse = (billingGuard as any).getMockApiResponse('billing.logAgentCost', params);
      
      expect(mockResponse).toHaveProperty('success');
      expect(mockResponse).toHaveProperty('id');
      expect(mockResponse).toHaveProperty('cost');
      expect(mockResponse.success).toBe(true);
    });
  });

  describe('Cost Estimation', () => {
    it('should calculate cost with complexity multipliers', () => {
      const baseOptions = {
        agentType: 'CONTENT',
        estimatedCost: 0,
        task: 'generate_post',
        metadata: { complexity: 'complex' }
      };

      const estimatedCost = (billingGuard as any).calculateEstimatedCost(baseOptions);
      
      // Content base cost (0.05) * complex multiplier (1.5) = 0.075
      expect(estimatedCost).toBe(0.08); // Rounded to 2 decimal places
    });

    it('should apply premium multiplier for premium tasks', () => {
      const baseOptions = {
        agentType: 'CONTENT',
        estimatedCost: 0,
        task: 'generate_comprehensive_report',
        metadata: { complexity: 'standard' }
      };

      const estimatedCost = (billingGuard as any).calculateEstimatedCost(baseOptions);
      
      // Content base cost (0.05) * standard multiplier (1.2) * premium multiplier (1.5) = 0.09
      expect(estimatedCost).toBe(0.09);
    });

    it('should use default values for unknown agent types and complexities', () => {
      const baseOptions = {
        agentType: 'UNKNOWN_AGENT',
        estimatedCost: 0,
        task: 'unknown_task',
        metadata: { complexity: 'unknown' }
      };

      const estimatedCost = (billingGuard as any).calculateEstimatedCost(baseOptions);
      
      // Should use default cost (0.05) and default multiplier (1.2)
      expect(estimatedCost).toBe(0.06);
    });
  });

  describe('Token Estimation', () => {
    it('should estimate tokens from cost', () => {
      const tokens = (billingGuard as any).estimateTokensFromCost(0.10, 'CONTENT');
      
      // $0.10 * 50K tokens per dollar = 5000 tokens
      expect(tokens).toBe(5000);
    });

    it('should handle zero cost', () => {
      const tokens = (billingGuard as any).estimateTokensFromCost(0, 'CONTENT');
      expect(tokens).toBe(0);
    });
  });
}); 