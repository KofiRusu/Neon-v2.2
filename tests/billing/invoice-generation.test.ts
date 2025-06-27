import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { InvoiceGenerator } from '../../scripts/generate-invoice';
import { PrismaClient, AgentType, CampaignType } from '@prisma/client';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    billingLog: {
      findMany: jest.fn(),
    },
    monthlyBudget: {
      findUnique: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}));

// Mock Puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn(),
      pdf: jest.fn(),
    }),
    close: jest.fn(),
  }),
}));

describe('Invoice Generation System', () => {
  let invoiceGenerator: InvoiceGenerator;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    invoiceGenerator = new InvoiceGenerator();
    mockPrisma = invoiceGenerator['prisma'] as jest.Mocked<PrismaClient>;

    // Clean up any existing invoice files
    const invoiceDir = join(process.cwd(), 'reports', 'invoices');
    if (existsSync(invoiceDir)) {
      rmSync(invoiceDir, { recursive: true, force: true });
    }
  });

  afterEach(async () => {
    await invoiceGenerator.close();
  });

  describe('fetchInvoiceData', () => {
    test('should fetch and process billing data correctly', async () => {
      const mockBillingLogs = [
        {
          id: '1',
          agentType: AgentType.CONTENT,
          campaignId: 'campaign-1',
          tokens: 1000,
          cost: 0.04,
          task: 'content-generation',
          timestamp: new Date('2024-11-15'),
          campaign: {
            id: 'campaign-1',
            name: 'Test Campaign 1',
            type: CampaignType.CONTENT_GENERATION,
          },
        },
        {
          id: '2',
          agentType: AgentType.AD,
          campaignId: 'campaign-2',
          tokens: 1500,
          cost: 0.09,
          task: 'ad-optimization',
          timestamp: new Date('2024-11-20'),
          campaign: {
            id: 'campaign-2',
            name: 'Test Campaign 2',
            type: CampaignType.AD_OPTIMIZATION,
          },
        },
        {
          id: '3',
          agentType: AgentType.CONTENT,
          campaignId: 'campaign-1',
          tokens: 800,
          cost: 0.032,
          task: 'content-revision',
          timestamp: new Date('2024-11-25'),
          campaign: {
            id: 'campaign-1',
            name: 'Test Campaign 1',
            type: CampaignType.CONTENT_GENERATION,
          },
        },
      ];

      mockPrisma.billingLog.findMany.mockResolvedValue(mockBillingLogs as any);
      mockPrisma.monthlyBudget.findUnique.mockResolvedValue({
        id: '1',
        month: '2024-11',
        totalBudget: 1000,
        totalSpent: 162,
        alertThreshold: 0.8,
        isAlertSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const invoiceData = await invoiceGenerator['fetchInvoiceData']('2024-11');

      expect(invoiceData.month).toBe('2024-11');
      expect(invoiceData.totalCost).toBe(0.162); // 0.04 + 0.09 + 0.032
      expect(invoiceData.totalExecutions).toBe(3);
      expect(invoiceData.campaignBreakdown).toHaveLength(2);

      // Check campaign breakdown
      const campaign1 = invoiceData.campaignBreakdown.find(c => c.id === 'campaign-1');
      expect(campaign1).toBeDefined();
      expect(campaign1!.name).toBe('Test Campaign 1');
      expect(campaign1!.totalCost).toBe(0.072); // 0.04 + 0.032
      expect(campaign1!.executions).toBe(2);

      // Check agent summary
      expect(invoiceData.agentSummary[AgentType.CONTENT]).toBeDefined();
      expect(invoiceData.agentSummary[AgentType.CONTENT].totalCost).toBe(0.072);
      expect(invoiceData.agentSummary[AgentType.CONTENT].totalExecutions).toBe(2);
      expect(invoiceData.agentSummary[AgentType.CONTENT].campaigns).toBe(1);

      expect(invoiceData.agentSummary[AgentType.AD]).toBeDefined();
      expect(invoiceData.agentSummary[AgentType.AD].totalCost).toBe(0.09);
      expect(invoiceData.agentSummary[AgentType.AD].totalExecutions).toBe(1);
      expect(invoiceData.agentSummary[AgentType.AD].campaigns).toBe(1);
    });

    test('should handle empty billing data', async () => {
      mockPrisma.billingLog.findMany.mockResolvedValue([]);
      mockPrisma.monthlyBudget.findUnique.mockResolvedValue(null);

      const invoiceData = await invoiceGenerator['fetchInvoiceData']('2024-11');

      expect(invoiceData.month).toBe('2024-11');
      expect(invoiceData.totalCost).toBe(0);
      expect(invoiceData.totalExecutions).toBe(0);
      expect(invoiceData.campaignBreakdown).toHaveLength(0);
      expect(Object.keys(invoiceData.agentSummary)).toHaveLength(0);
    });
  });

  describe('generateCSV', () => {
    test('should generate valid CSV content', async () => {
      const mockInvoiceData = {
        month: '2024-11',
        totalCost: 0.162,
        totalExecutions: 3,
        campaignBreakdown: [
          {
            id: 'campaign-1',
            name: 'Test Campaign 1',
            type: 'CONTENT_GENERATION',
            totalCost: 0.072,
            executions: 2,
            agents: {
              CONTENT: { cost: 0.072, executions: 2, tokens: 1800 },
            },
          },
        ],
        agentSummary: {
          CONTENT: {
            totalCost: 0.072,
            totalExecutions: 2,
            totalTokens: 1800,
            campaigns: 1,
          },
        },
      };

      const csvPath = await invoiceGenerator['generateCSV'](mockInvoiceData);

      expect(existsSync(csvPath)).toBe(true);
      expect(csvPath).toContain('neonhub_invoice_2024_11.csv');

      // Read and verify CSV content
      const fs = require('fs');
      const csvContent = fs.readFileSync(csvPath, 'utf-8');

      expect(csvContent).toContain('NeonHub Enterprise Invoice');
      expect(csvContent).toContain('2024-11');
      expect(csvContent).toContain('$0.1620');
      expect(csvContent).toContain('Test Campaign 1');
      expect(csvContent).toContain('CONTENT_GENERATION');
      expect(csvContent).toContain('CONTENT,$0.0720');
    });
  });

  describe('generatePDF', () => {
    test('should generate PDF file', async () => {
      const mockInvoiceData = {
        month: '2024-11',
        totalCost: 0.162,
        totalExecutions: 3,
        campaignBreakdown: [
          {
            id: 'campaign-1',
            name: 'Test Campaign 1',
            type: 'CONTENT_GENERATION',
            totalCost: 0.072,
            executions: 2,
            agents: {
              CONTENT: { cost: 0.072, executions: 2, tokens: 1800 },
            },
          },
        ],
        agentSummary: {
          CONTENT: {
            totalCost: 0.072,
            totalExecutions: 2,
            totalTokens: 1800,
            campaigns: 1,
          },
        },
      };

      const pdfPath = await invoiceGenerator['generatePDF'](mockInvoiceData);

      expect(pdfPath).toContain('neonhub_invoice_2024_11.pdf');
      // Note: In a real test environment, we'd verify the PDF was created
      // For now, we're mocking puppeteer so the file won't actually exist
    });
  });

  describe('generateInvoiceHTML', () => {
    test('should generate valid HTML content', () => {
      const mockInvoiceData = {
        month: '2024-11',
        totalCost: 0.162,
        totalExecutions: 3,
        campaignBreakdown: [
          {
            id: 'campaign-1',
            name: 'Test Campaign 1',
            type: 'CONTENT_GENERATION',
            totalCost: 0.072,
            executions: 2,
            agents: {
              CONTENT: { cost: 0.072, executions: 2, tokens: 1800 },
            },
          },
        ],
        agentSummary: {
          CONTENT: {
            totalCost: 0.072,
            totalExecutions: 2,
            totalTokens: 1800,
            campaigns: 1,
          },
        },
      };

      const html = invoiceGenerator['generateInvoiceHTML'](mockInvoiceData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('NeonHub Enterprise');
      expect(html).toContain('2024-11');
      expect(html).toContain('$0.16');
      expect(html).toContain('Test Campaign 1');
      expect(html).toContain('CONTENT_GENERATION');
      expect(html).toContain('gradient');
      expect(html).toContain('neon');
    });
  });

  describe('generateInvoice integration', () => {
    test('should generate both PDF and CSV files', async () => {
      const mockBillingLogs = [
        {
          id: '1',
          agentType: AgentType.CONTENT,
          campaignId: 'campaign-1',
          tokens: 1000,
          cost: 0.04,
          task: 'content-generation',
          timestamp: new Date('2024-11-15'),
          campaign: {
            id: 'campaign-1',
            name: 'Test Campaign 1',
            type: CampaignType.CONTENT_GENERATION,
          },
        },
      ];

      mockPrisma.billingLog.findMany.mockResolvedValue(mockBillingLogs as any);
      mockPrisma.monthlyBudget.findUnique.mockResolvedValue(null);

      const result = await invoiceGenerator.generateInvoice('2024-11');

      expect(result).toHaveProperty('pdfPath');
      expect(result).toHaveProperty('csvPath');
      expect(result.pdfPath).toContain('neonhub_invoice_2024_11.pdf');
      expect(result.csvPath).toContain('neonhub_invoice_2024_11.csv');

      // Verify CSV was actually created (PDF is mocked)
      expect(existsSync(result.csvPath)).toBe(true);
    });

    test('should use current month when no month specified', async () => {
      mockPrisma.billingLog.findMany.mockResolvedValue([]);
      mockPrisma.monthlyBudget.findUnique.mockResolvedValue(null);

      const result = await invoiceGenerator.generateInvoice();

      const currentMonth = new Date().toISOString().substring(0, 7);
      expect(result.csvPath).toContain(currentMonth.replace('-', '_'));
    });
  });

  describe('error handling', () => {
    test('should handle database connection errors', async () => {
      mockPrisma.billingLog.findMany.mockRejectedValue(new Error('Database connection failed'));

      await expect(invoiceGenerator.generateInvoice('2024-11')).rejects.toThrow(
        'Database connection failed'
      );
    });

    test('should handle file system errors', async () => {
      mockPrisma.billingLog.findMany.mockResolvedValue([]);
      mockPrisma.monthlyBudget.findUnique.mockResolvedValue(null);

      // Mock file system to throw error
      const originalWriteFileSync = require('fs').writeFileSync;
      require('fs').writeFileSync = jest.fn().mockImplementation(() => {
        throw new Error('File system error');
      });

      await expect(invoiceGenerator.generateInvoice('2024-11')).rejects.toThrow(
        'File system error'
      );

      // Restore original function
      require('fs').writeFileSync = originalWriteFileSync;
    });
  });
});
