import { render, screen, fireEvent } from '@testing-library/react';
import { TrendCard } from '@/components/trends/TrendCard';

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
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
}));

const mockTrend = {
  id: 'trend_1',
  title: 'AI-Generated Art Challenge',
  type: 'challenge' as const,
  platform: 'instagram' as const,
  region: 'Global',
  impactScore: 85,
  projectedLift: 25,
  velocity: 45,
  description: 'Users creating art with AI tools and sharing before/after comparisons',
  recommendation: 'Create tutorial content showing AI art creation process with your brand',
  confidence: 0.89,
  detectedAt: new Date('2024-01-15T10:00:00Z'),
  expiresAt: new Date('2024-02-15T10:00:00Z'),
  relatedKeywords: ['trending', 'viral', 'engagement', 'ai', 'art'],
  metrics: {
    mentions: 45000,
    engagement: 125000,
    reach: 2500000,
    growth: 22,
  },
};

describe('TrendCard', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders trend information correctly', () => {
    render(
      <TrendCard trend={mockTrend} darkMode={false} onClick={mockOnClick} isSelected={false} />
    );

    expect(screen.getByText('AI-Generated Art Challenge')).toBeInTheDocument();
    expect(screen.getByText('instagram')).toBeInTheDocument();
    expect(screen.getByText('Global')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Impact')).toBeInTheDocument();
  });

  it('displays correct platform icon and styling', () => {
    render(
      <TrendCard trend={mockTrend} darkMode={false} onClick={mockOnClick} isSelected={false} />
    );

    expect(screen.getByText(/📸/)).toBeInTheDocument(); // Instagram icon
    expect(screen.getByText(/instagram/)).toBeInTheDocument();
  });

  it('shows type icon correctly', () => {
    render(
      <TrendCard trend={mockTrend} darkMode={false} onClick={mockOnClick} isSelected={false} />
    );

    expect(screen.getByText('🎯')).toBeInTheDocument(); // Challenge icon
  });

  it('displays metrics with proper formatting', () => {
    render(
      <TrendCard trend={mockTrend} darkMode={false} onClick={mockOnClick} isSelected={false} />
    );

    expect(screen.getByText('+45')).toBeInTheDocument(); // Velocity
    expect(screen.getByText('+25%')).toBeInTheDocument(); // Projected lift
    expect(screen.getByText('2.5M')).toBeInTheDocument(); // Reach formatted
    expect(screen.getByText('45.0K')).toBeInTheDocument(); // Mentions formatted
  });

  it('displays related keywords correctly', () => {
    render(
      <TrendCard trend={mockTrend} darkMode={false} onClick={mockOnClick} isSelected={false} />
    );

    expect(screen.getByText('#trending')).toBeInTheDocument();
    expect(screen.getByText('#viral')).toBeInTheDocument();
    expect(screen.getByText('#engagement')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument(); // More than 3 keywords
  });

  it('shows AI recommendation', () => {
    render(
      <TrendCard trend={mockTrend} darkMode={false} onClick={mockOnClick} isSelected={false} />
    );

    expect(screen.getByText('🎯 AI Recommendation:')).toBeInTheDocument();
    expect(
      screen.getByText('Create tutorial content showing AI art creation process with your brand')
    ).toBeInTheDocument();
  });

  it('displays confidence with correct emoji', () => {
    render(
      <TrendCard trend={mockTrend} darkMode={false} onClick={mockOnClick} isSelected={false} />
    );

    expect(screen.getByText('✅')).toBeInTheDocument(); // 89% confidence = checkmark
    expect(screen.getByText('89% confidence')).toBeInTheDocument();
  });

  it('handles different confidence levels', () => {
    const trendWithLowConfidence = {
      ...mockTrend,
      confidence: 0.65,
    };

    render(
      <TrendCard
        trend={trendWithLowConfidence}
        darkMode={false}
        onClick={mockOnClick}
        isSelected={false}
      />
    );

    expect(screen.getByText('⚠️')).toBeInTheDocument(); // Low confidence = warning
    expect(screen.getByText('65% confidence')).toBeInTheDocument();
  });

  it('shows correct impact color coding', () => {
    const hotTrend = { ...mockTrend, impactScore: 95 };
    const { rerender } = render(
      <TrendCard trend={hotTrend} darkMode={false} onClick={mockOnClick} isSelected={false} />
    );

    // High impact should have red styling
    expect(screen.getByText('95')).toHaveClass('text-red-400');

    const warmTrend = { ...mockTrend, impactScore: 65 };
    rerender(
      <TrendCard trend={warmTrend} darkMode={false} onClick={mockOnClick} isSelected={false} />
    );

    // Medium impact should have orange styling
    expect(screen.getByText('65')).toHaveClass('text-orange-400');

    const coolTrend = { ...mockTrend, impactScore: 45 };
    rerender(
      <TrendCard trend={coolTrend} darkMode={false} onClick={mockOnClick} isSelected={false} />
    );

    // Low impact should have yellow styling
    expect(screen.getByText('45')).toHaveClass('text-yellow-400');
  });

  it('displays velocity with correct color coding', () => {
    const fastRisingTrend = { ...mockTrend, velocity: 35 };
    const { rerender } = render(
      <TrendCard
        trend={fastRisingTrend}
        darkMode={false}
        onClick={mockOnClick}
        isSelected={false}
      />
    );

    expect(screen.getByText('+35')).toHaveClass('text-green-400'); // Fast rising = green

    const decliningTrend = { ...mockTrend, velocity: -25 };
    rerender(
      <TrendCard trend={decliningTrend} darkMode={false} onClick={mockOnClick} isSelected={false} />
    );

    expect(screen.getByText('-25')).toHaveClass('text-red-400'); // Declining = red
  });

  it('calls onClick when clicked', () => {
    render(
      <TrendCard trend={mockTrend} darkMode={false} onClick={mockOnClick} isSelected={false} />
    );

    fireEvent.click(screen.getByTestId('motion-div'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('applies selected state styling', () => {
    const { container } = render(
      <TrendCard trend={mockTrend} darkMode={false} onClick={mockOnClick} isSelected={true} />
    );

    const card = container.querySelector('[data-testid="motion-div"]');
    expect(card).toHaveClass('ring-2', 'ring-blue-400');
  });

  it('applies dark mode styling correctly', () => {
    const { container } = render(
      <TrendCard trend={mockTrend} darkMode={true} onClick={mockOnClick} isSelected={false} />
    );

    const card = container.querySelector('[data-testid="motion-div"]');
    expect(card).toHaveClass('bg-gradient-to-br');
  });

  it('shows expiry warning for trends expiring soon', () => {
    const expiringTrend = {
      ...mockTrend,
      expiresAt: new Date(Date.now() + 86400000), // 1 day from now
    };

    render(
      <TrendCard trend={expiringTrend} darkMode={false} onClick={mockOnClick} isSelected={false} />
    );

    expect(screen.getByText(/⏰ Expires/)).toBeInTheDocument();
  });

  it('handles different platforms correctly', () => {
    const platforms = ['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin'] as const;

    platforms.forEach(platform => {
      const platformTrend = { ...mockTrend, platform };
      const { unmount } = render(
        <TrendCard
          trend={platformTrend}
          darkMode={false}
          onClick={mockOnClick}
          isSelected={false}
        />
      );

      expect(screen.getByText(platform)).toBeInTheDocument();
      unmount();
    });
  });

  it('handles different trend types correctly', () => {
    const types = ['hashtag', 'sound', 'style', 'challenge', 'format'] as const;
    const typeIcons = ['🏷️', '🎵', '🎨', '🎯', '📱'];

    types.forEach((type, index) => {
      const typeTrend = { ...mockTrend, type };
      const { unmount } = render(
        <TrendCard trend={typeTrend} darkMode={false} onClick={mockOnClick} isSelected={false} />
      );

      expect(screen.getByText(typeIcons[index])).toBeInTheDocument();
      unmount();
    });
  });

  it('formats large numbers correctly', () => {
    const trendWithLargeNumbers = {
      ...mockTrend,
      metrics: {
        mentions: 1500000, // 1.5M
        engagement: 850000, // 850K
        reach: 25000000, // 25M
        growth: 22,
      },
    };

    render(
      <TrendCard
        trend={trendWithLargeNumbers}
        darkMode={false}
        onClick={mockOnClick}
        isSelected={false}
      />
    );

    expect(screen.getByText('25.0M')).toBeInTheDocument(); // Reach
    expect(screen.getByText('1.5M')).toBeInTheDocument(); // Mentions
  });

  it('handles trends without expiry date', () => {
    const noExpiryTrend = {
      ...mockTrend,
      expiresAt: null,
    };

    render(
      <TrendCard trend={noExpiryTrend} darkMode={false} onClick={mockOnClick} isSelected={false} />
    );

    expect(screen.queryByText(/⏰ Expires/)).not.toBeInTheDocument();
  });

  it('displays time since detection', () => {
    render(
      <TrendCard trend={mockTrend} darkMode={false} onClick={mockOnClick} isSelected={false} />
    );

    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });
});
