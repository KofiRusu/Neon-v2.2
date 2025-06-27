import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals';
import { TRPCError } from '@trpc/server';
import { campaignRouter } from './campaign';
import {
  createTRPCMockContext,
  createMockSession,
  createMockCampaign,
} from '../__test__/helpers/mock-context';

describe('campaignRouter', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockContext: any;

  beforeEach(() => {
    mockContext = createTRPCMockContext();
    mockContext.session = createMockSession();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all campaigns for the user', async () => {
      const mockCampaigns = [
        createMockCampaign(),
        { ...createMockCampaign(), id: 'campaign2', name: 'Second Campaign' },
      ];

      mockContext.prisma.campaign.findMany.mockResolvedValue(mockCampaigns);

      const caller = campaignRouter.createCaller(mockContext);
      const result = await caller.getAll();

      expect(result).toEqual(mockCampaigns);
      expect(mockContext.prisma.campaign.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: {
          _count: {
            select: {
              agentExecutions: true,
              analytics: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle database errors', async () => {
      mockContext.prisma.campaign.findMany.mockRejectedValue(new Error('Database error'));

      const caller = campaignRouter.createCaller(mockContext);

      await expect(caller.getAll()).rejects.toThrow(TRPCError);
      expect(mockContext.logger.error).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return campaign by id with related data', async () => {
      const mockCampaign = {
        ...createMockCampaign(),
        agentExecutions: [],
        analytics: [],
        abTests: [],
      };

      mockContext.prisma.campaign.findUnique.mockResolvedValue(mockCampaign);

      const caller = campaignRouter.createCaller(mockContext);
      const result = await caller.getById({ id: 'campaign1' });

      expect(result).toEqual(mockCampaign);
      expect(mockContext.prisma.campaign.findUnique).toHaveBeenCalledWith({
        where: { id: 'campaign1', userId: 'user1' },
        include: {
          agentExecutions: {
            include: { agent: true },
            orderBy: { startedAt: 'desc' },
            take: 10,
          },
          analytics: {
            orderBy: { date: 'desc' },
            take: 30,
          },
          abTests: {
            orderBy: { startDate: 'desc' },
          },
        },
      });
    });

    it('should throw NOT_FOUND for non-existent campaign', async () => {
      mockContext.prisma.campaign.findUnique.mockResolvedValue(null);

      const caller = campaignRouter.createCaller(mockContext);

      await expect(caller.getById({ id: 'nonexistent' })).rejects.toThrow(
        expect.objectContaining({
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        })
      );
    });
  });

  describe('create', () => {
    it('should create a new campaign successfully', async () => {
      const input = {
        name: 'New Campaign',
        description: 'Campaign description',
        type: 'SOCIAL_MEDIA' as const,
        budget: 1000,
        platforms: ['FACEBOOK', 'INSTAGRAM'] as const,
        targetAudience: { age: '18-35', interests: ['tech'] },
      };

      const mockCreatedCampaign = {
        ...createMockCampaign(),
        ...input,
      };

      mockContext.prisma.campaign.create.mockResolvedValue(mockCreatedCampaign);

      const caller = campaignRouter.createCaller(mockContext);
      const result = await caller.create(input);

      expect(result).toEqual(mockCreatedCampaign);
      expect(mockContext.prisma.campaign.create).toHaveBeenCalledWith({
        data: {
          ...input,
          userId: 'user1',
          status: 'DRAFT',
        },
      });
    });

    it('should handle validation errors', async () => {
      const invalidInput = {
        name: '', // Empty name should fail validation
        type: 'SOCIAL_MEDIA' as const,
      };

      const caller = campaignRouter.createCaller(mockContext);

      await expect(caller.create(invalidInput)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update campaign successfully', async () => {
      const existingCampaign = createMockCampaign();
      const updateData = {
        name: 'Updated Campaign',
        budget: 2000,
      };

      mockContext.prisma.campaign.findUnique.mockResolvedValue(existingCampaign);
      mockContext.prisma.campaign.update.mockResolvedValue({
        ...existingCampaign,
        ...updateData,
      });

      const caller = campaignRouter.createCaller(mockContext);
      const result = await caller.update({
        id: 'campaign1',
        ...updateData,
      });

      expect(result.name).toBe('Updated Campaign');
      expect(result.budget).toBe(2000);
    });

    it('should prevent updating non-owned campaigns', async () => {
      mockContext.prisma.campaign.findUnique.mockResolvedValue(null);

      const caller = campaignRouter.createCaller(mockContext);

      await expect(
        caller.update({
          id: 'campaign1',
          name: 'Updated',
        })
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'NOT_FOUND',
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete campaign successfully', async () => {
      const existingCampaign = createMockCampaign();

      mockContext.prisma.campaign.findUnique.mockResolvedValue(existingCampaign);
      mockContext.prisma.campaign.delete.mockResolvedValue(existingCampaign);

      const caller = campaignRouter.createCaller(mockContext);
      const result = await caller.delete({ id: 'campaign1' });

      expect(result.success).toBe(true);
      expect(mockContext.prisma.campaign.delete).toHaveBeenCalledWith({
        where: { id: 'campaign1' },
      });
    });

    it('should prevent deleting non-owned campaigns', async () => {
      mockContext.prisma.campaign.findUnique.mockResolvedValue(null);

      const caller = campaignRouter.createCaller(mockContext);

      await expect(caller.delete({ id: 'campaign1' })).rejects.toThrow(
        expect.objectContaining({
          code: 'NOT_FOUND',
        })
      );
    });
  });

  describe('getMetrics', () => {
    it('should return campaign performance metrics', async () => {
      const _mockMetrics = {
        impressions: 10000,
        clicks: 500,
        conversions: 25,
        cost: 750,
        ctr: 5.0,
        conversionRate: 5.0,
        costPerClick: 1.5,
        costPerConversion: 30,
        roi: 150,
      };

      // Mock the complex analytics aggregation
      mockContext.prisma.analytics.aggregate.mockResolvedValue({
        _sum: {
          impressions: 10000,
          clicks: 500,
          conversions: 25,
          cost: 750,
        },
      });

      const caller = campaignRouter.createCaller(mockContext);
      const result = await caller.getMetrics({
        campaignId: 'campaign1',
        timeRange: '30d',
      });

      expect(result).toEqual(
        expect.objectContaining({
          impressions: expect.any(Number),
          clicks: expect.any(Number),
          conversions: expect.any(Number),
          cost: expect.any(Number),
        })
      );
    });
  });
});
