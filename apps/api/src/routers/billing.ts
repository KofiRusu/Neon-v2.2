import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// Enhanced type definitions
interface BillingMetrics {
  totalCost: number;
  totalTokens: number;
  averageCostPerRun: number;
  costByAgentType: Record<string, number>;
  monthlyBudget: number;
  budgetUtilization: number;
  costTrends: Array<{
    date: string;
    cost: number;
    tokens: number;
  }>;
}

interface BudgetAlert {
  id: string;
  threshold: number;
  currentUtilization: number;
  alertType: 'warning' | 'critical' | 'exceeded';
  message: string;
  timestamp: Date;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  agentType?: string;
  period: {
    start: Date;
    end: Date;
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: Date;
  dueDate: Date;
  paidAt?: Date;
}

// Input validation schemas
const budgetConfigSchema = z.object({
  monthlyLimit: z.number().min(0),
  warningThreshold: z.number().min(0).max(100).default(80),
  criticalThreshold: z.number().min(0).max(100).default(95),
  agentLimits: z.record(z.string(), z.number().min(0)).optional(),
  autoShutoff: z.boolean().default(false),
});

const invoiceFiltersSchema = z.object({
  userId: z.string().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

const billingPeriodSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  agentTypes: z.array(z.string()).optional(),
});

export const billingRouter = router({
  // Get current billing metrics
  getMetrics: publicProcedure
    .input(
      z.object({
        period: z.enum(['daily', 'weekly', 'monthly']).default('monthly'),
        agentType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Mock implementation - replace with actual database queries
        const mockMetrics: BillingMetrics = {
          totalCost: 247.56,
          totalTokens: 1245600,
          averageCostPerRun: 2.34,
          costByAgentType: {
            CONTENT: 89.23,
            AD: 67.45,
            SEO: 45.67,
            SOCIAL: 34.21,
            EMAIL: 11.0,
          },
          monthlyBudget: 500.0,
          budgetUtilization: 49.5,
          costTrends: [
            { date: '2024-01-01', cost: 23.45, tokens: 12340 },
            { date: '2024-01-02', cost: 34.56, tokens: 17890 },
            { date: '2024-01-03', cost: 28.9, tokens: 15670 },
          ],
        };

        return {
          success: true,
          data: mockMetrics,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch billing metrics',
        });
      }
    }),

  // Get budget configuration
  getBudgetConfig: publicProcedure.query(async () => {
    try {
      // Mock implementation
      const mockBudgetConfig = {
        monthlyLimit: 500.0,
        warningThreshold: 80,
        criticalThreshold: 95,
        agentLimits: {
          CONTENT: 150.0,
          AD: 120.0,
          SEO: 100.0,
        },
        autoShutoff: false,
        currentUtilization: 49.5,
        remainingBudget: 252.44,
      };

      return {
        success: true,
        data: mockBudgetConfig,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch budget configuration',
      });
    }
  }),

  // Update budget configuration
  updateBudgetConfig: publicProcedure.input(budgetConfigSchema).mutation(async ({ input }) => {
    try {
      // Validate thresholds
      if (input.warningThreshold >= input.criticalThreshold) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Warning threshold must be less than critical threshold',
        });
      }

      // Mock implementation - replace with actual database update
      const updatedConfig = {
        ...input,
        updatedAt: new Date(),
      };

      return {
        success: true,
        data: updatedConfig,
        message: 'Budget configuration updated successfully',
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update budget configuration',
      });
    }
  }),

  // Get budget alerts
  getBudgetAlerts: publicProcedure
    .input(
      z.object({
        active: z.boolean().default(true),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        // Mock implementation
        const mockAlerts: BudgetAlert[] = [
          {
            id: 'alert-001',
            threshold: 80,
            currentUtilization: 85.2,
            alertType: 'warning',
            message: 'Monthly budget utilization has exceeded 80% threshold',
            timestamp: new Date(),
          },
          {
            id: 'alert-002',
            threshold: 100,
            currentUtilization: 120.5,
            alertType: 'exceeded',
            message: 'Content agent has exceeded individual budget limit',
            timestamp: new Date(Date.now() - 3600000),
          },
        ];

        return {
          success: true,
          data: mockAlerts.slice(0, input.limit),
          total: mockAlerts.length,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch budget alerts',
        });
      }
    }),

  // Generate invoice
  generateInvoice: publicProcedure.input(billingPeriodSchema).mutation(async ({ input }) => {
    try {
      // Mock implementation - replace with actual invoice generation logic
      const invoiceNumber = `INV-${Date.now()}`;
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      const mockInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber,
        userId: 'user-123',
        period: {
          start: startDate,
          end: endDate,
        },
        items: [
          {
            id: 'item-001',
            description: 'AI Agent Usage - Content Generation',
            quantity: 150,
            unitPrice: 0.02,
            totalPrice: 3.0,
            agentType: 'CONTENT',
            period: { start: startDate, end: endDate },
          },
          {
            id: 'item-002',
            description: 'AI Agent Usage - Ad Optimization',
            quantity: 89,
            unitPrice: 0.035,
            totalPrice: 3.12,
            agentType: 'AD',
            period: { start: startDate, end: endDate },
          },
        ],
        subtotal: 6.12,
        tax: 0.49,
        total: 6.61,
        status: 'draft',
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      };

      return {
        success: true,
        data: mockInvoice,
        message: 'Invoice generated successfully',
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate invoice',
      });
    }
  }),

  // Get invoices
  getInvoices: publicProcedure.input(invoiceFiltersSchema).query(async ({ input }) => {
    try {
      // Mock implementation
      const mockInvoices: Invoice[] = [
        {
          id: 'inv-001',
          invoiceNumber: 'INV-2024-001',
          userId: 'user-123',
          period: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31'),
          },
          items: [],
          subtotal: 247.56,
          tax: 19.8,
          total: 267.36,
          status: 'paid',
          createdAt: new Date('2024-01-31'),
          dueDate: new Date('2024-02-29'),
          paidAt: new Date('2024-02-15'),
        },
      ];

      // Apply filters
      let filteredInvoices = mockInvoices;

      if (input.userId) {
        filteredInvoices = filteredInvoices.filter(inv => inv.userId === input.userId);
      }

      if (input.status) {
        filteredInvoices = filteredInvoices.filter(inv => inv.status === input.status);
      }

      if (input.startDate) {
        const startDate = new Date(input.startDate);
        filteredInvoices = filteredInvoices.filter(inv => inv.createdAt >= startDate);
      }

      if (input.endDate) {
        const endDate = new Date(input.endDate);
        filteredInvoices = filteredInvoices.filter(inv => inv.createdAt <= endDate);
      }

      // Apply pagination
      const paginatedInvoices = filteredInvoices.slice(input.offset, input.offset + input.limit);

      return {
        success: true,
        data: paginatedInvoices,
        total: filteredInvoices.length,
        hasMore: input.offset + input.limit < filteredInvoices.length,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch invoices',
      });
    }
  }),

  // Get invoice by ID
  getInvoiceById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    try {
      // Mock implementation
      const mockInvoice: Invoice = {
        id: input.id,
        invoiceNumber: 'INV-2024-001',
        userId: 'user-123',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
        items: [
          {
            id: 'item-001',
            description: 'AI Agent Usage - Content Generation',
            quantity: 1520,
            unitPrice: 0.02,
            totalPrice: 30.4,
            agentType: 'CONTENT',
            period: {
              start: new Date('2024-01-01'),
              end: new Date('2024-01-31'),
            },
          },
        ],
        subtotal: 247.56,
        tax: 19.8,
        total: 267.36,
        status: 'paid',
        createdAt: new Date('2024-01-31'),
        dueDate: new Date('2024-02-29'),
        paidAt: new Date('2024-02-15'),
      };

      return {
        success: true,
        data: mockInvoice,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch invoice',
      });
    }
  }),

  // Get cost optimization suggestions
  getOptimizationSuggestions: publicProcedure.query(async () => {
    try {
      const mockSuggestions = [
        {
          id: 'opt-001',
          type: 'model_downgrade',
          agentType: 'CONTENT',
          currentCost: 89.23,
          projectedCost: 62.46,
          savings: 26.77,
          description: 'Switch to gpt-4o-mini for content generation tasks',
          effort: 'low',
          impact: 'high',
        },
        {
          id: 'opt-002',
          type: 'prompt_optimization',
          agentType: 'AD',
          currentCost: 67.45,
          projectedCost: 54.21,
          savings: 13.24,
          description: 'Optimize prompts to reduce token usage',
          effort: 'medium',
          impact: 'medium',
        },
      ];

      return {
        success: true,
        data: mockSuggestions,
        totalSavings: mockSuggestions.reduce((sum, s) => sum + s.savings, 0),
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch optimization suggestions',
      });
    }
  }),
});
