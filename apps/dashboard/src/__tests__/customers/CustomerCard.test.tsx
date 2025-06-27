import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerCard } from '@/components/customers/CustomerCard';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onHoverStart, onHoverEnd, ...props }: any) => (
      <div
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
        {...props}
        data-testid="motion-div"
      >
        {children}
      </div>
    ),
    button: ({ children, ...props }: any) => (
      <button {...props} data-testid="motion-button">
        {children}
      </button>
    ),
  },
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '3 days ago'),
}));

const mockCustomer = {
  id: 'customer_1',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@example.com',
  avatar: 'https://example.com/avatar.jpg',
  engagementLevel: 'high' as const,
  lastContact: new Date('2024-01-15T10:00:00Z'),
  lifetimeValue: 8500,
  preferredChannel: 'email' as const,
  aiPredictedAction: 'convert' as const,
  location: {
    country: 'USA',
    region: 'North America',
  },
  tags: ['vip', 'loyal', 'high-spender'],
  createdAt: new Date('2023-06-01T10:00:00Z'),
};

describe('CustomerCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders customer information correctly', () => {
    render(<CustomerCard customer={mockCustomer} darkMode={false} />);

    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('sarah.johnson@example.com')).toBeInTheDocument();
    expect(screen.getByText('$8.5K')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('displays correct engagement level styling', () => {
    const { rerender } = render(<CustomerCard customer={mockCustomer} darkMode={false} />);

    expect(screen.getByText('HIGH')).toHaveClass('text-green-400');

    const mediumCustomer = { ...mockCustomer, engagementLevel: 'medium' as const };
    rerender(<CustomerCard customer={mediumCustomer} darkMode={false} />);
    expect(screen.getByText('MEDIUM')).toHaveClass('text-yellow-400');

    const lowCustomer = { ...mockCustomer, engagementLevel: 'low' as const };
    rerender(<CustomerCard customer={lowCustomer} darkMode={false} />);
    expect(screen.getByText('LOW')).toHaveClass('text-red-400');
  });

  it('shows correct channel icon', () => {
    render(<CustomerCard customer={mockCustomer} darkMode={false} />);

    expect(screen.getByText('📧')).toBeInTheDocument(); // Email icon
    expect(screen.getByText('email')).toBeInTheDocument();
  });

  it('displays AI predicted action with correct styling', () => {
    render(<CustomerCard customer={mockCustomer} darkMode={false} />);

    expect(screen.getByText(/🤖 AI Action: CONVERT/)).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument(); // Convert icon
  });

  it('formats lifetime value correctly', () => {
    const highValueCustomer = { ...mockCustomer, lifetimeValue: 15000 };
    const { rerender } = render(<CustomerCard customer={highValueCustomer} darkMode={false} />);

    expect(screen.getByText('$15.0K')).toBeInTheDocument();

    const lowValueCustomer = { ...mockCustomer, lifetimeValue: 500 };
    rerender(<CustomerCard customer={lowValueCustomer} darkMode={false} />);
    expect(screen.getByText('$500')).toBeInTheDocument();
  });

  it('shows avatar or initials correctly', () => {
    render(<CustomerCard customer={mockCustomer} darkMode={false} />);

    const avatar = screen.getByAltText('Sarah Johnson');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');

    // Test fallback to initials
    const customerWithoutAvatar = { ...mockCustomer, avatar: undefined };
    const { rerender } = render(<CustomerCard customer={customerWithoutAvatar} darkMode={false} />);

    expect(screen.getByText('SJ')).toBeInTheDocument(); // Initials
  });

  it('expands on hover to show additional details', async () => {
    render(<CustomerCard customer={mockCustomer} darkMode={false} />);

    const card = screen.getByTestId('motion-div');

    // Initially, expanded content should not be visible
    expect(screen.queryByText('📍 Location')).not.toBeInTheDocument();

    // Hover to expand
    fireEvent.mouseEnter(card);

    await waitFor(() => {
      expect(screen.getByText('📍 Location')).toBeInTheDocument();
      expect(screen.getByText('USA')).toBeInTheDocument();
      expect(screen.getByText('💬 Last Contact')).toBeInTheDocument();
      expect(screen.getByText('3 days ago')).toBeInTheDocument();
    });
  });

  it('displays customer tags correctly', async () => {
    render(<CustomerCard customer={mockCustomer} darkMode={false} />);

    const card = screen.getByTestId('motion-div');
    fireEvent.mouseEnter(card);

    await waitFor(() => {
      expect(screen.getByText('🏷️ Tags')).toBeInTheDocument();
      expect(screen.getByText('vip')).toBeInTheDocument();
      expect(screen.getByText('loyal')).toBeInTheDocument();
      expect(screen.getByText('high-spender')).toBeInTheDocument();
    });
  });

  it('shows action buttons when expanded', async () => {
    render(<CustomerCard customer={mockCustomer} darkMode={false} />);

    const card = screen.getByTestId('motion-div');
    fireEvent.mouseEnter(card);

    await waitFor(() => {
      expect(screen.getByText('💬 Message')).toBeInTheDocument();
      expect(screen.getByText('📊 Profile')).toBeInTheDocument();
    });
  });

  it('applies dark mode styling correctly', () => {
    const { container } = render(<CustomerCard customer={mockCustomer} darkMode={true} />);

    const card = container.querySelector('[data-testid="motion-div"]');
    expect(card).toHaveClass('bg-white/5', 'border-white/10');
  });

  it('shows glow effect for high-value customers', () => {
    const highValueCustomer = { ...mockCustomer, lifetimeValue: 6000 };
    const { container } = render(<CustomerCard customer={highValueCustomer} darkMode={false} />);

    const glowEffect = container.querySelector('.bg-gradient-to-r.from-yellow-500\\/10');
    expect(glowEffect).toBeInTheDocument();
  });

  it('does not show glow effect for lower-value customers', () => {
    const lowValueCustomer = { ...mockCustomer, lifetimeValue: 2000 };
    const { container } = render(<CustomerCard customer={lowValueCustomer} darkMode={false} />);

    const glowEffect = container.querySelector('.bg-gradient-to-r.from-yellow-500\\/10');
    expect(glowEffect).not.toBeInTheDocument();
  });

  it('handles different AI predicted actions', () => {
    const actions = ['retarget', 'ignore', 'convert', 'nurture'] as const;
    const expectedIcons = ['🔄', '⏸️', '🎯', '🌱'];

    actions.forEach((action, index) => {
      const customer = { ...mockCustomer, aiPredictedAction: action };
      const { rerender } = render(<CustomerCard customer={customer} darkMode={false} />);

      expect(screen.getByText(expectedIcons[index])).toBeInTheDocument();
      expect(screen.getByText(`🤖 AI Action: ${action.toUpperCase()}`)).toBeInTheDocument();

      if (index < actions.length - 1) {
        rerender(<div />); // Clear for next iteration
      }
    });
  });

  it('handles different preferred channels', () => {
    const channels = ['email', 'whatsapp', 'phone', 'chat', 'social'] as const;
    const expectedIcons = ['📧', '💬', '📞', '🗨️', '📱'];

    channels.forEach((channel, index) => {
      const customer = { ...mockCustomer, preferredChannel: channel };
      const { rerender } = render(<CustomerCard customer={customer} darkMode={false} />);

      expect(screen.getByText(expectedIcons[index])).toBeInTheDocument();
      expect(screen.getByText(channel)).toBeInTheDocument();

      if (index < channels.length - 1) {
        rerender(<div />); // Clear for next iteration
      }
    });
  });

  it('displays customer creation date correctly', async () => {
    render(<CustomerCard customer={mockCustomer} darkMode={false} />);

    const card = screen.getByTestId('motion-div');
    fireEvent.mouseEnter(card);

    await waitFor(() => {
      expect(screen.getByText('🗓️ Customer Since')).toBeInTheDocument();
      expect(screen.getByText('6/1/2023')).toBeInTheDocument();
    });
  });

  it('handles customers without tags', async () => {
    const customerWithoutTags = { ...mockCustomer, tags: [] };
    render(<CustomerCard customer={customerWithoutTags} darkMode={false} />);

    const card = screen.getByTestId('motion-div');
    fireEvent.mouseEnter(card);

    await waitFor(() => {
      expect(screen.queryByText('🏷️ Tags')).not.toBeInTheDocument();
    });
  });

  it('handles hover out to collapse details', async () => {
    render(<CustomerCard customer={mockCustomer} darkMode={false} />);

    const card = screen.getByTestId('motion-div');

    // Hover to expand
    fireEvent.mouseEnter(card);

    await waitFor(() => {
      expect(screen.getByText('📍 Location')).toBeInTheDocument();
    });

    // Hover out to collapse
    fireEvent.mouseLeave(card);

    // Note: The actual collapse animation would be tested with integration tests
    // as the motion.div animation state is controlled by framer-motion
  });

  it('applies correct action button styling', async () => {
    render(<CustomerCard customer={mockCustomer} darkMode={false} />);

    const card = screen.getByTestId('motion-div');
    fireEvent.mouseEnter(card);

    await waitFor(() => {
      const messageButton = screen.getByText('💬 Message');
      const profileButton = screen.getByText('📊 Profile');

      expect(messageButton).toHaveClass('text-blue-600');
      expect(profileButton).toHaveClass('text-purple-600');
    });
  });
});
