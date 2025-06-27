import { render, screen, fireEvent } from '@testing-library/react';
import { AgentCard } from '@/components/agents/AgentCard';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, ...props }: any) => (
      <div onClick={onClick} {...props} data-testid="motion-div">
        {children}
      </div>
    ),
  },
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 minutes ago'),
}));

const mockAgent = {
  id: 'test-agent',
  name: 'Test Agent',
  category: 'content' as const,
  description: 'Test agent description',
  capabilities: ['generate_content', 'analyze_text', 'optimize_seo'],
  version: '2.1.0',
  status: 'active' as const,
};

const mockHealth = {
  id: 'test-agent',
  status: 'healthy' as const,
  responseTime: 150,
  lastHealthCheck: new Date(),
  lastRun: new Date(),
  uptime: 95,
  errorRate: 2.5,
  performance: {
    avgResponseTime: 140,
    successRate: 98.5,
    totalExecutions: 245,
    lastExecutionDuration: 180,
  },
};

describe('AgentCard', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders agent information correctly', () => {
    render(
      <AgentCard agent={mockAgent} health={mockHealth} darkMode={false} onClick={mockOnClick} />
    );

    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(screen.getByText('Test agent description')).toBeInTheDocument();
    expect(screen.getByText('v2.1.0')).toBeInTheDocument();
  });

  it('displays health status correctly', () => {
    render(
      <AgentCard agent={mockAgent} health={mockHealth} darkMode={false} onClick={mockOnClick} />
    );

    expect(screen.getByText('HEALTHY')).toBeInTheDocument();
    expect(screen.getByText('150ms')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('98.5%')).toBeInTheDocument();
    expect(screen.getByText('245')).toBeInTheDocument();
  });

  it('handles missing health data gracefully', () => {
    render(
      <AgentCard agent={mockAgent} health={undefined} darkMode={false} onClick={mockOnClick} />
    );

    expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
    expect(screen.queryByText('150ms')).not.toBeInTheDocument();
  });

  it('displays capabilities with proper formatting', () => {
    render(
      <AgentCard agent={mockAgent} health={mockHealth} darkMode={false} onClick={mockOnClick} />
    );

    expect(screen.getByText('generate content')).toBeInTheDocument();
    expect(screen.getByText('analyze text')).toBeInTheDocument();
    expect(screen.getByText('optimize seo')).toBeInTheDocument();
  });

  it('shows "+X more" when there are more than 3 capabilities', () => {
    const agentWithManyCaps = {
      ...mockAgent,
      capabilities: ['cap1', 'cap2', 'cap3', 'cap4', 'cap5'],
    };

    render(
      <AgentCard
        agent={agentWithManyCaps}
        health={mockHealth}
        darkMode={false}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    render(
      <AgentCard agent={mockAgent} health={mockHealth} darkMode={false} onClick={mockOnClick} />
    );

    fireEvent.click(screen.getByTestId('motion-div'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('applies dark mode styles correctly', () => {
    const { container } = render(
      <AgentCard agent={mockAgent} health={mockHealth} darkMode={true} onClick={mockOnClick} />
    );

    // Check for dark mode classes
    const card = container.querySelector('[data-testid="motion-div"]');
    expect(card).toHaveClass('bg-gradient-to-br');
  });

  it('displays correct performance colors based on values', () => {
    const slowAgent = {
      ...mockHealth,
      responseTime: 800,
      performance: {
        ...mockHealth.performance,
        successRate: 60,
      },
    };

    render(
      <AgentCard agent={mockAgent} health={slowAgent} darkMode={false} onClick={mockOnClick} />
    );

    // Response time should be red (>500ms)
    expect(screen.getByText('800ms')).toHaveClass('text-red-400');

    // Success rate should be red (<70%)
    expect(screen.getByText('60.0%')).toHaveClass('text-red-400');
  });

  it('displays last run time when available', () => {
    render(
      <AgentCard agent={mockAgent} health={mockHealth} darkMode={false} onClick={mockOnClick} />
    );

    expect(screen.getByText(/Last run: 2 minutes ago/)).toBeInTheDocument();
  });

  it('handles different agent categories correctly', () => {
    const categories = ['content', 'marketing', 'analytics', 'automation', 'support'] as const;

    categories.forEach(category => {
      const { unmount } = render(
        <AgentCard
          agent={{ ...mockAgent, category }}
          health={mockHealth}
          darkMode={false}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText(category)).toBeInTheDocument();
      unmount();
    });
  });

  it('handles different health statuses correctly', () => {
    const statuses = ['healthy', 'degraded', 'unhealthy', 'offline'] as const;

    statuses.forEach(status => {
      const { unmount } = render(
        <AgentCard
          agent={mockAgent}
          health={{ ...mockHealth, status }}
          darkMode={false}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText(status.toUpperCase())).toBeInTheDocument();
      unmount();
    });
  });
});
