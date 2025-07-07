import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LearningPage from '../page';

// Mock tRPC hooks
const mockGetLearningProfile = jest.fn();
const mockGetFeedbackSummary = jest.fn();

jest.mock('../../../utils/trpc', () => ({
  api: {
    feedback: {
      getLearningProfile: {
        useQuery: () => mockGetLearningProfile(),
      },
      getFeedbackSummary: {
        useQuery: () => mockGetFeedbackSummary(),
      },
    },
  },
}));

const mockLearningProfileData = {
  campaignId: 'test-campaign-123',
  score: 87,
  toneAdjustment: 'Professional tone for better B2B engagement',
  trendAdjustment: 'Leveraging AI trends to increase relevance',
  platformStrategy: 'Focus on LinkedIn and Twitter for professional audience',
  effectivenessScore: 92,
  lastUpdated: '2024-01-20T10:30:00Z',
  adaptationsCount: 15,
  successRate: 89.5,
};

const mockFeedbackSummaryData = {
  totalCampaigns: 45,
  averageEngagement: 78.3,
  totalImpressions: 2500000,
  totalConversions: 4250,
  platformPerformance: [
    {
      platform: 'Instagram',
      engagement: 82.5,
      conversions: 1250,
      roi: 245.7,
      trend: 'up',
    },
    {
      platform: 'LinkedIn',
      engagement: 76.8,
      conversions: 980,
      roi: 312.8,
      trend: 'up',
    },
  ],
  toneEffectiveness: [
    {
      tone: 'Professional',
      engagementRate: 78.5,
      conversionRate: 12.3,
      campaignCount: 15,
      trend: 'up',
    },
    {
      tone: 'Casual',
      engagementRate: 65.2,
      conversionRate: 8.7,
      campaignCount: 22,
      trend: 'up',
    },
  ],
  trendAnalysis: [
    {
      trendName: 'AI Revolution',
      impactScore: 94,
      engagementIncrease: 45.7,
      reachIncrease: 38.2,
      currentStatus: 'peak',
      category: 'Technology',
    },
  ],
  campaignPerformance: [
    {
      id: 'camp-001',
      name: 'Spring Fashion Campaign',
      status: 'active',
      budget: 50000,
      roas: 4.2,
      learningScore: 87.5,
      aiAdjustments: ['Optimized targeting', 'Enhanced creative rotation'],
    },
  ],
};

describe('Learning Page Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page with mock data correctly', async () => {
    mockGetLearningProfile.mockReturnValue({
      data: mockLearningProfileData,
      isLoading: false,
      error: null,
    });

    mockGetFeedbackSummary.mockReturnValue({
      data: mockFeedbackSummaryData,
      isLoading: false,
      error: null,
    });

    render(<LearningPage />);

    // Check main page title
    expect(screen.getByText('AI Learning Dashboard')).toBeInTheDocument();
    
    // Check learning stats are populated
    expect(screen.getByText('45')).toBeInTheDocument(); // Total campaigns
    expect(screen.getByText('78.3%')).toBeInTheDocument(); // Average engagement
    expect(screen.getByText('4,250')).toBeInTheDocument(); // Total conversions

    // Wait for components to render with data
    await waitFor(() => {
      expect(screen.getByText('Learning Profile')).toBeInTheDocument();
      expect(screen.getByText('Tone Effectiveness Comparison')).toBeInTheDocument();
      expect(screen.getByText('Platform ROI Analysis')).toBeInTheDocument();
      expect(screen.getByText('Trend Impact Analysis')).toBeInTheDocument();
      expect(screen.getByText('Campaign Performance & Learning Insights')).toBeInTheDocument();
    });
  });

  it('shows loading states appropriately', () => {
    mockGetLearningProfile.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    mockGetFeedbackSummary.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<LearningPage />);

    // Should show loading indicators
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles error states correctly', () => {
    mockGetLearningProfile.mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: 'Failed to load learning profile' },
    });

    mockGetFeedbackSummary.mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: 'Failed to load feedback summary' },
    });

    render(<LearningPage />);

    // Should show error message
    expect(screen.getByText('Error loading learning data')).toBeInTheDocument();
    expect(screen.getByText('Failed to load learning profile')).toBeInTheDocument();
  });

  it('filters and updates components correctly', async () => {
    mockGetLearningProfile.mockReturnValue({
      data: mockLearningProfileData,
      isLoading: false,
      error: null,
    });

    mockGetFeedbackSummary.mockReturnValue({
      data: mockFeedbackSummaryData,
      isLoading: false,
      error: null,
    });

    render(<LearningPage />);

    // Change campaign filter
    const campaignSelect = screen.getByDisplayValue('All Campaigns');
    fireEvent.change(campaignSelect, { target: { value: 'test-campaign-123' } });

    // Change time range filter
    const timeRangeSelect = screen.getByDisplayValue('Last 7 Days');
    fireEvent.change(timeRangeSelect, { target: { value: '30d' } });

    await waitFor(() => {
      // Components should update with new filters
      expect(campaignSelect).toHaveValue('test-campaign-123');
      expect(timeRangeSelect).toHaveValue('30d');
    });
  });

  it('displays AI recommendations correctly', async () => {
    mockGetLearningProfile.mockReturnValue({
      data: mockLearningProfileData,
      isLoading: false,
      error: null,
    });

    mockGetFeedbackSummary.mockReturnValue({
      data: mockFeedbackSummaryData,
      isLoading: false,
      error: null,
    });

    render(<LearningPage />);

    await waitFor(() => {
      // Should show AI recommendations
      expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Optimize Tone Strategy')).toBeInTheDocument();
      expect(screen.getByText('Leverage Trending Topics')).toBeInTheDocument();
      expect(screen.getByText('Platform Expansion')).toBeInTheDocument();
    });
  });

  it('shows correct learning stats in grid', async () => {
    mockGetLearningProfile.mockReturnValue({
      data: mockLearningProfileData,
      isLoading: false,
      error: null,
    });

    mockGetFeedbackSummary.mockReturnValue({
      data: mockFeedbackSummaryData,
      isLoading: false,
      error: null,
    });

    render(<LearningPage />);

    await waitFor(() => {
      // Check all stats are displayed
      expect(screen.getByText('Total Campaigns')).toBeInTheDocument();
      expect(screen.getByText('Avg Engagement')).toBeInTheDocument();
      expect(screen.getByText('AI Adaptations')).toBeInTheDocument();
      expect(screen.getByText('Performance Uplift')).toBeInTheDocument();
    });
  });

  it('integrates all dashboard components properly', async () => {
    mockGetLearningProfile.mockReturnValue({
      data: mockLearningProfileData,
      isLoading: false,
      error: null,
    });

    mockGetFeedbackSummary.mockReturnValue({
      data: mockFeedbackSummaryData,
      isLoading: false,
      error: null,
    });

    render(<LearningPage />);

    await waitFor(() => {
      // All major components should be present
      expect(screen.getByText('Learning Profile')).toBeInTheDocument();
      expect(screen.getByText('Tone Effectiveness Comparison')).toBeInTheDocument();
      expect(screen.getByText('Platform ROI Analysis')).toBeInTheDocument();
      expect(screen.getByText('Trend Impact Analysis')).toBeInTheDocument();
      expect(screen.getByText('Campaign Performance & Learning Insights')).toBeInTheDocument();

      // Check specific data from mocks is displayed
      expect(screen.getByText('Professional tone for better B2B engagement')).toBeInTheDocument();
      expect(screen.getByText('AI Revolution')).toBeInTheDocument();
      expect(screen.getByText('Spring Fashion Campaign')).toBeInTheDocument();
    });
  });

  it('handles component interactions correctly', async () => {
    mockGetLearningProfile.mockReturnValue({
      data: mockLearningProfileData,
      isLoading: false,
      error: null,
    });

    mockGetFeedbackSummary.mockReturnValue({
      data: mockFeedbackSummaryData,
      isLoading: false,
      error: null,
    });

    render(<LearningPage />);

    await waitFor(() => {
      // Test interaction with learning profile card
      const detailsButton = screen.getByText('Show Details');
      fireEvent.click(detailsButton);
      
      expect(screen.getByText('Campaign ID:')).toBeInTheDocument();
      expect(screen.getByText('test-campaign-123')).toBeInTheDocument();
    });
  });

  it('updates data when filters change', async () => {
    const mockRefetch = jest.fn();
    
    mockGetLearningProfile.mockReturnValue({
      data: mockLearningProfileData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    mockGetFeedbackSummary.mockReturnValue({
      data: mockFeedbackSummaryData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<LearningPage />);

    // Change filters
    const campaignSelect = screen.getByDisplayValue('All Campaigns');
    fireEvent.change(campaignSelect, { target: { value: 'specific-campaign' } });

    await waitFor(() => {
      // Should trigger data refetch (in real implementation)
      expect(campaignSelect).toHaveValue('specific-campaign');
    });
  });

  it('displays fallback data when API returns empty results', () => {
    mockGetLearningProfile.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    mockGetFeedbackSummary.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    render(<LearningPage />);

    // Should still render page structure with fallback data
    expect(screen.getByText('AI Learning Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Campaigns')).toBeInTheDocument();
  });

  it('maintains responsive layout across components', async () => {
    mockGetLearningProfile.mockReturnValue({
      data: mockLearningProfileData,
      isLoading: false,
      error: null,
    });

    mockGetFeedbackSummary.mockReturnValue({
      data: mockFeedbackSummaryData,
      isLoading: false,
      error: null,
    });

    const { container } = render(<LearningPage />);

    await waitFor(() => {
      // Check responsive grid classes are applied
      const gridElements = container.querySelectorAll('.grid');
      expect(gridElements.length).toBeGreaterThan(0);

      // Check glassmorphism classes are applied
      const glassElements = container.querySelectorAll('.glass, .glass-strong');
      expect(glassElements.length).toBeGreaterThan(0);
    });
  });
}); 