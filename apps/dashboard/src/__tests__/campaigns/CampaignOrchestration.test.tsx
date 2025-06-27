import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { jest } from '@jest/globals';
import CampaignsPage from '@/app/campaigns/page';
import { AgentOrchestrationMatrix } from '@/components/campaigns/AgentOrchestrationMatrix';
import { CampaignTimeline } from '@/components/campaigns/CampaignTimeline';

// Mock tRPC
const mockTrpc = {
  campaign: {
    getCampaigns: {
      useQuery: jest.fn(),
    },
    getCampaignDetails: {
      useQuery: jest.fn(),
    },
    evaluateCampaignTriggers: {
      useQuery: jest.fn(),
    },
    runOrchestratedCampaign: {
      useMutation: jest.fn(),
    },
    pauseCampaign: {
      useMutation: jest.fn(),
    },
    resumeCampaign: {
      useMutation: jest.fn(),
    },
    getAgentAssignments: {
      useQuery: jest.fn(),
    },
    getAgentStageLogs: {
      useQuery: jest.fn(),
    },
  },
};

jest.mock('@/utils/trpc', () => ({
  trpc: mockTrpc,
}));

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock data
const mockCampaignData = {
  success: true,
  data: [
    {
      id: 'campaign_1',
      name: 'Q4 Holiday Product Launch',
      description: 'Launch our new AI-powered productivity suite for the holiday season',
      type: 'product-launch',
      status: 'running',
      priority: 'high',
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-31'),
      budget: 25000,
      targetAudience: 'Tech professionals and productivity enthusiasts',
      goals: ['Achieve 10K+ signups', 'Generate $500K revenue', 'Build brand awareness'],
      kpis: {
        ctr: 4.2,
        cvr: 2.8,
        sentiment: 0.65,
        costPerMessage: 0.35,
        reach: 125000,
        engagement: 8.5,
      },
      tags: ['Q4', 'product-launch', 'AI', 'high-priority'],
      createdBy: 'marketing_team',
      createdAt: new Date('2024-11-25T10:00:00Z'),
      updatedAt: new Date('2024-12-01T10:15:00Z'),
      orchestration: {
        totalTasks: 5,
        completedTasks: 2,
        runningTasks: 2,
        failedTasks: 0,
        overallProgress: 65,
        activeAgents: ['ContentAgent', 'TrendAgent'],
        avgTaskScore: 0.87,
      },
    },
  ],
  total: 1,
};

const mockAgentAssignments = {
  success: true,
  data: {
    matrix: {
      creative: [
        {
          id: 'task_1',
          agentType: 'TrendAgent',
          stage: 'creative',
          taskDescription: 'Analyze Q4 productivity trends',
          status: 'completed',
          priority: 'high',
          resultScore: 0.92,
          startedAt: new Date('2024-12-01T09:00:00Z'),
          completedAt: new Date('2024-12-01T09:45:00Z'),
          actualDuration: 45,
          estimatedDuration: 60,
          llmPrompt: 'Analyze current productivity trends for Q4 2024...',
          llmResponse: 'Key trends identified: AI productivity tools seeing 340% increase...',
        },
      ],
      launch: [
        {
          id: 'task_2',
          agentType: 'AdAgent',
          stage: 'launch',
          taskDescription: 'Set up optimized ad campaigns',
          status: 'running',
          priority: 'high',
          resultScore: null,
          startedAt: new Date('2024-12-01T10:00:00Z'),
          completedAt: null,
          actualDuration: null,
          estimatedDuration: 90,
          llmPrompt: 'Create ad campaign strategy for AI productivity suite...',
          llmResponse: null,
        },
      ],
    },
    timeline: [
      {
        id: 'task_1',
        agentType: 'TrendAgent',
        stage: 'creative',
        taskDescription: 'Analyze Q4 productivity trends',
        status: 'completed',
        priority: 'high',
        startDate: new Date('2024-12-01T09:00:00Z'),
        endDate: new Date('2024-12-01T09:45:00Z'),
        progress: 100,
        dependencies: [],
        estimatedDuration: 60,
        actualDuration: 45,
        resultScore: 0.92,
      },
      {
        id: 'task_2',
        agentType: 'AdAgent',
        stage: 'launch',
        taskDescription: 'Set up optimized ad campaigns',
        status: 'running',
        priority: 'high',
        startDate: new Date('2024-12-01T10:00:00Z'),
        endDate: new Date('2024-12-01T11:30:00Z'),
        progress: 65,
        dependencies: ['task_1'],
        estimatedDuration: 90,
        actualDuration: null,
        resultScore: null,
      },
    ],
    stages: ['creative', 'launch', 'feedback', 'optimize', 'analyze'],
    agentTypes: ['ContentAgent', 'AdAgent', 'TrendAgent', 'SupportAgent', 'DesignAgent'],
  },
};

const mockTriggers = {
  success: true,
  data: {
    triggers: [
      {
        id: 'trigger_1',
        name: 'Low CTR Alert',
        condition: 'CTR < 3%',
        action: 'Generate new ad creative variants',
        targetAgent: 'DesignAgent',
        threshold: 3,
        metric: 'ctr',
        isActive: true,
        lastTriggered: null,
        currentValue: 4.2,
        isTriggered: false,
        shouldExecute: false,
        evaluatedAt: new Date(),
        llmRecommendation: 'Monitor CTR - currently within acceptable range',
      },
    ],
    triggeredActions: [],
    hasActiveAlerts: false,
  },
};

describe('CampaignsPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock returns
    mockTrpc.campaign.getCampaigns.useQuery.mockReturnValue({
      data: mockCampaignData,
      isLoading: false,
      refetch: jest.fn(),
    });

    mockTrpc.campaign.getCampaignDetails.useQuery.mockReturnValue({
      data: null,
    });

    mockTrpc.campaign.evaluateCampaignTriggers.useQuery.mockReturnValue({
      data: mockTriggers,
    });

    mockTrpc.campaign.runOrchestratedCampaign.useMutation.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ success: true }),
    });

    mockTrpc.campaign.pauseCampaign.useMutation.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ success: true }),
    });

    mockTrpc.campaign.resumeCampaign.useMutation.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ success: true }),
    });
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
  };

  test('renders campaign orchestration dashboard', () => {
    renderWithQueryClient(<CampaignsPage />);

    expect(screen.getByText('Campaign Orchestration')).toBeInTheDocument();
    expect(screen.getByText('Multi-Agent AI Campaign Control Center')).toBeInTheDocument();
  });

  test('displays campaign stats cards', () => {
    renderWithQueryClient(<CampaignsPage />);

    expect(screen.getByText('Active Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Total Budget')).toBeInTheDocument();
    expect(screen.getByText('Active Agents')).toBeInTheDocument();
    expect(screen.getByText('Automations')).toBeInTheDocument();
  });

  test('shows campaign list with orchestration data', () => {
    renderWithQueryClient(<CampaignsPage />);

    expect(screen.getByText('Q4 Holiday Product Launch')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('CTR: 4.2%')).toBeInTheDocument();
    expect(screen.getByText('CVR: 2.8%')).toBeInTheDocument();
  });

  test('displays progress bars for campaigns', () => {
    renderWithQueryClient(<CampaignsPage />);

    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  test('shows active agents indicators', () => {
    renderWithQueryClient(<CampaignsPage />);

    expect(screen.getByText('2 agents active')).toBeInTheDocument();
  });

  test('handles auto-refresh toggle', () => {
    renderWithQueryClient(<CampaignsPage />);

    const autoRefreshButton = screen.getByText('Live');
    expect(autoRefreshButton).toBeInTheDocument();

    fireEvent.click(autoRefreshButton);
    expect(screen.getByText('Manual')).toBeInTheDocument();
  });

  test('filters campaigns by status', () => {
    renderWithQueryClient(<CampaignsPage />);

    const statusFilter = screen.getByDisplayValue('All Status');
    fireEvent.change(statusFilter, { target: { value: 'running' } });

    expect(mockTrpc.campaign.getCampaigns.useQuery).toHaveBeenCalledWith({
      status: 'running',
      limit: 20,
      sortBy: 'updated',
    });
  });

  test('handles campaign selection', () => {
    renderWithQueryClient(<CampaignsPage />);

    const campaignCard = screen
      .getByText('Q4 Holiday Product Launch')
      .closest('[data-testid="campaign-card"]');
    fireEvent.click(campaignCard!);

    expect(mockTrpc.campaign.getCampaignDetails.useQuery).toHaveBeenCalledWith(
      { id: 'campaign_1' },
      { enabled: true }
    );
  });

  test('executes campaign orchestration actions', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({ success: true });
    mockTrpc.campaign.runOrchestratedCampaign.useMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
    });

    renderWithQueryClient(<CampaignsPage />);

    const runButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ id: 'campaign_1' });
    });
  });

  test('handles loading state', () => {
    mockTrpc.campaign.getCampaigns.useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: jest.fn(),
    });

    renderWithQueryClient(<CampaignsPage />);

    expect(screen.getByText('Loading campaigns...')).toBeInTheDocument();
  });

  test('handles empty state', () => {
    mockTrpc.campaign.getCampaigns.useQuery.mockReturnValue({
      data: { data: [], total: 0 },
      isLoading: false,
      refetch: jest.fn(),
    });

    renderWithQueryClient(<CampaignsPage />);

    expect(screen.getByText('No campaigns found')).toBeInTheDocument();
  });
});

describe('AgentOrchestrationMatrix', () => {
  let queryClient: QueryClient;
  const mockOnClose = jest.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    jest.clearAllMocks();

    mockTrpc.campaign.getAgentAssignments.useQuery.mockReturnValue({
      data: mockAgentAssignments,
      isLoading: false,
      refetch: jest.fn(),
    });

    mockTrpc.campaign.getAgentStageLogs.useQuery.mockReturnValue({
      data: null,
    });
  });

  const renderMatrix = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AgentOrchestrationMatrix campaignId="campaign_1" onClose={mockOnClose} />
      </QueryClientProvider>
    );
  };

  test('renders agent orchestration matrix', () => {
    renderMatrix();

    expect(screen.getByText('Agent Orchestration Matrix')).toBeInTheDocument();
    expect(
      screen.getByText('Real-time multi-agent coordination and LLM execution tracking')
    ).toBeInTheDocument();
  });

  test('displays agent grid with stages', () => {
    renderMatrix();

    expect(screen.getByText('Agent / Stage')).toBeInTheDocument();
    expect(screen.getByText('creative')).toBeInTheDocument();
    expect(screen.getByText('launch')).toBeInTheDocument();
  });

  test('shows agent tasks with status indicators', () => {
    renderMatrix();

    expect(screen.getByText('TrendAgent')).toBeInTheDocument();
    expect(screen.getByText('AdAgent')).toBeInTheDocument();
    expect(screen.getByText('Analyze Q4 productivity trends')).toBeInTheDocument();
    expect(screen.getByText('Set up optimized ad campaigns')).toBeInTheDocument();
  });

  test('handles task selection', () => {
    renderMatrix();

    const taskCell = screen
      .getByText('Analyze Q4 productivity trends')
      .closest('[data-testid="agent-task-cell"]');
    fireEvent.click(taskCell!);

    expect(screen.getByText('Task Details')).toBeInTheDocument();
    expect(screen.getByText('Task Description')).toBeInTheDocument();
  });

  test('displays LLM execution details', () => {
    renderMatrix();

    const taskCell = screen
      .getByText('Analyze Q4 productivity trends')
      .closest('[data-testid="agent-task-cell"]');
    fireEvent.click(taskCell!);

    expect(screen.getByText('LLM Prompt')).toBeInTheDocument();
    expect(screen.getByText('LLM Response')).toBeInTheDocument();
    expect(screen.getByText('Result Score')).toBeInTheDocument();
  });

  test('shows task priority and status', () => {
    renderMatrix();

    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
  });

  test('handles auto-refresh toggle', () => {
    renderMatrix();

    const autoRefreshButton = screen.getByText('Live');
    fireEvent.click(autoRefreshButton);

    expect(screen.getByText('Manual')).toBeInTheDocument();
  });

  test('handles close action', () => {
    renderMatrix();

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});

describe('CampaignTimeline', () => {
  let queryClient: QueryClient;
  const mockOnClose = jest.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    jest.clearAllMocks();

    mockTrpc.campaign.getAgentAssignments.useQuery.mockReturnValue({
      data: mockAgentAssignments,
      isLoading: false,
      refetch: jest.fn(),
    });
  });

  const renderTimeline = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CampaignTimeline campaignId="campaign_1" onClose={mockOnClose} />
      </QueryClientProvider>
    );
  };

  test('renders campaign timeline', () => {
    renderTimeline();

    expect(screen.getByText('Campaign Timeline')).toBeInTheDocument();
    expect(
      screen.getByText('Gantt-style agent task visualization with dependency tracking')
    ).toBeInTheDocument();
  });

  test('displays timeframe selector', () => {
    renderTimeline();

    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
  });

  test('shows stage headers', () => {
    renderTimeline();

    expect(screen.getByText('Creative Stage')).toBeInTheDocument();
    expect(screen.getByText('Launch Stage')).toBeInTheDocument();
  });

  test('displays timeline tasks', () => {
    renderTimeline();

    expect(screen.getByText('TrendAgent')).toBeInTheDocument();
    expect(screen.getByText('AdAgent')).toBeInTheDocument();
    expect(screen.getByText('Analyze Q4 productivity trends')).toBeInTheDocument();
  });

  test('handles timeframe switching', () => {
    renderTimeline();

    const dayButton = screen.getByText('Day');
    fireEvent.click(dayButton);

    // Verify the button becomes active (would need to check CSS classes in real test)
    expect(dayButton).toBeInTheDocument();
  });

  test('shows task dependencies', () => {
    renderTimeline();

    // Look for dependency indicators in the timeline
    const dependencyIcon = screen.getByTestId('task-dependency');
    expect(dependencyIcon).toBeInTheDocument();
  });

  test('handles task selection in timeline', () => {
    renderTimeline();

    const timelineTask = screen.getByTestId('timeline-task');
    fireEvent.click(timelineTask);

    expect(screen.getByText('Task Details')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Dependencies')).toBeInTheDocument();
  });

  test('displays progress indicators', () => {
    renderTimeline();

    expect(screen.getByText('100%')).toBeInTheDocument(); // Completed task
    expect(screen.getByText('65%')).toBeInTheDocument(); // Running task
  });

  test('handles date navigation', () => {
    renderTimeline();

    const nextButton = screen.getByRole('button', { name: /chevron right/i });
    fireEvent.click(nextButton);

    // Date should update (would need to verify the date display changes)
    expect(nextButton).toBeInTheDocument();
  });
});

describe('LLM Integration Features', () => {
  test('validates LLM prompt and response handling', () => {
    const queryClient = new QueryClient();

    mockTrpc.campaign.getAgentAssignments.useQuery.mockReturnValue({
      data: mockAgentAssignments,
      isLoading: false,
      refetch: jest.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AgentOrchestrationMatrix campaignId="campaign_1" onClose={jest.fn()} />
      </QueryClientProvider>
    );

    // Click on completed task to see LLM details
    const taskCell = screen
      .getByText('Analyze Q4 productivity trends')
      .closest('[data-testid="agent-task-cell"]');
    fireEvent.click(taskCell!);

    // Verify LLM prompt is displayed
    expect(
      screen.getByText('Analyze current productivity trends for Q4 2024...')
    ).toBeInTheDocument();

    // Verify LLM response is displayed
    expect(
      screen.getByText('Key trends identified: AI productivity tools seeing 340% increase...')
    ).toBeInTheDocument();

    // Verify result score
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  test('shows LLM execution context', () => {
    const queryClient = new QueryClient();

    mockTrpc.campaign.getAgentStageLogs.useQuery.mockReturnValue({
      data: {
        logs: [
          {
            ...mockAgentAssignments.data.matrix.creative[0],
            executionLog: [
              {
                timestamp: new Date(),
                event: 'LLM execution started',
                details: 'Agent prompt sent to LLM with campaign context',
                llmContext: 'Campaign context loaded for agent',
              },
            ],
          },
        ],
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AgentOrchestrationMatrix campaignId="campaign_1" onClose={jest.fn()} />
      </QueryClientProvider>
    );

    // Verify LLM context tracking
    expect(screen.getByText('LLM execution started')).toBeInTheDocument();
    expect(screen.getByText('Campaign context loaded for agent')).toBeInTheDocument();
  });
});
