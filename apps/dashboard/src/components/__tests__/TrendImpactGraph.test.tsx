import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrendImpactGraph from '../TrendImpactGraph';

const mockData = [
  {
    trendName: 'AI Revolution',
    hashtag: '#AIRevolution',
    impactScore: 94,
    engagementIncrease: 45.7,
    reachIncrease: 38.2,
    conversionIncrease: 28.9,
    campaignCount: 8,
    firstSeen: '2024-01-15',
    peakDate: '2024-01-20',
    currentStatus: 'peak' as const,
    category: 'Technology',
    relatedKeywords: ['artificial intelligence', 'machine learning', 'automation'],
  },
  {
    trendName: 'Sustainable Living',
    hashtag: '#SustainableLiving',
    impactScore: 87,
    engagementIncrease: 32.1,
    reachIncrease: 41.8,
    conversionIncrease: 22.4,
    campaignCount: 12,
    firstSeen: '2024-01-10',
    peakDate: '2024-01-18',
    currentStatus: 'stable' as const,
    category: 'Lifestyle',
    relatedKeywords: ['eco-friendly', 'green living', 'sustainability'],
  },
  {
    trendName: 'Remote Work Tips',
    hashtag: '#RemoteWork',
    impactScore: 76,
    engagementIncrease: 28.3,
    reachIncrease: 25.7,
    conversionIncrease: 18.9,
    campaignCount: 15,
    firstSeen: '2024-01-12',
    peakDate: '2024-01-17',
    currentStatus: 'declining' as const,
    category: 'Business',
    relatedKeywords: ['work from home', 'productivity', 'digital nomad'],
  },
];

describe('TrendImpactGraph', () => {
  it('renders trend analysis with all trends', () => {
    render(<TrendImpactGraph data={mockData} />);
    
    expect(screen.getByText('Trend Impact Analysis')).toBeInTheDocument();
    expect(screen.getByText('AI Revolution')).toBeInTheDocument();
    expect(screen.getByText('Sustainable Living')).toBeInTheDocument();
    expect(screen.getByText('Remote Work Tips')).toBeInTheDocument();
  });

  it('displays correct impact scores', () => {
    render(<TrendImpactGraph data={mockData} />);
    
    expect(screen.getByText('94')).toBeInTheDocument(); // AI Revolution
    expect(screen.getByText('87')).toBeInTheDocument(); // Sustainable Living
    expect(screen.getByText('76')).toBeInTheDocument(); // Remote Work Tips
  });

  it('shows status indicators with correct colors', () => {
    render(<TrendImpactGraph data={mockData} />);
    
    // Peak status should show as "peak"
    expect(screen.getByText('peak')).toBeInTheDocument();
    expect(screen.getByText('stable')).toBeInTheDocument();
    expect(screen.getByText('declining')).toBeInTheDocument();
  });

  it('displays hashtags and categories correctly', () => {
    render(<TrendImpactGraph data={mockData} />);
    
    expect(screen.getByText('#AIRevolution')).toBeInTheDocument();
    expect(screen.getByText('#SustainableLiving')).toBeInTheDocument();
    expect(screen.getByText('#RemoteWork')).toBeInTheDocument();
    
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Lifestyle')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
  });

  it('shows engagement increases correctly', () => {
    render(<TrendImpactGraph data={mockData} />);
    
    expect(screen.getByText('+45.7%')).toBeInTheDocument(); // AI Revolution engagement
    expect(screen.getByText('+32.1%')).toBeInTheDocument(); // Sustainable Living engagement
    expect(screen.getByText('+28.3%')).toBeInTheDocument(); // Remote Work engagement
  });

  it('expands trend details on click', () => {
    render(<TrendImpactGraph data={mockData} showDetails={true} />);
    
    // Click on AI Revolution trend
    const aiTrend = screen.getByText('AI Revolution').closest('div');
    fireEvent.click(aiTrend!);
    
    // Should show expanded details
    expect(screen.getByText('First Seen:')).toBeInTheDocument();
    expect(screen.getByText('Peak Date:')).toBeInTheDocument();
    expect(screen.getByText('Related Keywords:')).toBeInTheDocument();
    
    // Should show keywords
    expect(screen.getByText('artificial intelligence')).toBeInTheDocument();
    expect(screen.getByText('machine learning')).toBeInTheDocument();
    expect(screen.getByText('automation')).toBeInTheDocument();
  });

  it('sorts trends correctly by different metrics', () => {
    render(<TrendImpactGraph data={mockData} />);
    
    const sortSelect = screen.getByDisplayValue('impactScore');
    
    // Sort by engagement increase
    fireEvent.change(sortSelect, { target: { value: 'engagementIncrease' } });
    
    // AI Revolution should be first (highest engagement: 45.7%)
    const trends = screen.getAllByTestId(/trend-item/);
    expect(trends[0]).toHaveTextContent('AI Revolution');
    
    // Sort by campaign count
    fireEvent.change(sortSelect, { target: { value: 'campaignCount' } });
    
    // Remote Work should be first (highest campaign count: 15)
    const trendsAfterSort = screen.getAllByTestId(/trend-item/);
    expect(trendsAfterSort[0]).toHaveTextContent('Remote Work Tips');
  });

  it('displays performance summary correctly', () => {
    render(<TrendImpactGraph data={mockData} />);
    
    // Should show counts for each status
    expect(screen.getByText('1')).toBeInTheDocument(); // Rising trends count
    expect(screen.getByText('1')).toBeInTheDocument(); // Peak trends count
    expect(screen.getByText('1')).toBeInTheDocument(); // Stable trends count
    
    // Should show total trends
    expect(screen.getByText('3')).toBeInTheDocument(); // Total trends count
  });

  it('calculates and displays summary stats', () => {
    render(<TrendImpactGraph data={mockData} />);
    
    // Highest impact score should be 94
    expect(screen.getByText('94')).toBeInTheDocument();
    
    // Average engagement should be calculated
    const avgEngagement = ((45.7 + 32.1 + 28.3) / 3).toFixed(1);
    expect(screen.getByText(`${avgEngagement}%`)).toBeInTheDocument();
    
    // Total campaigns (8 + 12 + 15 = 35)
    expect(screen.getByText('35')).toBeInTheDocument();
  });

  it('shows top performing trends section', () => {
    render(<TrendImpactGraph data={mockData} />);
    
    expect(screen.getByText('Top Performing Trends')).toBeInTheDocument();
    
    // Should show top 3 trends (limited by slice(0, 4))
    const topTrends = screen.getAllByTestId(/top-trend/);
    expect(topTrends.length).toBeLessThanOrEqual(4);
  });

  it('formats dates correctly in expanded view', () => {
    render(<TrendImpactGraph data={mockData} showDetails={true} />);
    
    // Expand AI Revolution trend
    const aiTrend = screen.getByText('AI Revolution').closest('div');
    fireEvent.click(aiTrend!);
    
    // Should show formatted dates
    expect(screen.getByText('1/15/2024')).toBeInTheDocument(); // First seen
    expect(screen.getByText('1/20/2024')).toBeInTheDocument(); // Peak date
  });

  it('collapses trend details on second click', () => {
    render(<TrendImpactGraph data={mockData} showDetails={true} />);
    
    const aiTrend = screen.getByText('AI Revolution').closest('div');
    
    // First click to expand
    fireEvent.click(aiTrend!);
    expect(screen.getByText('First Seen:')).toBeInTheDocument();
    
    // Second click to collapse
    fireEvent.click(aiTrend!);
    expect(screen.queryByText('First Seen:')).not.toBeInTheDocument();
  });

  it('uses fallback data when no data provided', () => {
    render(<TrendImpactGraph />);
    
    // Should render without crashing and show default trends
    expect(screen.getByText('Trend Impact Analysis')).toBeInTheDocument();
    expect(screen.getByText('AI Revolution')).toBeInTheDocument();
    expect(screen.getByText('Sustainable Living')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    render(<TrendImpactGraph data={[]} />);
    
    expect(screen.getByText('Trend Impact Analysis')).toBeInTheDocument();
    // Should show empty state or fallback
    expect(screen.getByText('0')).toBeInTheDocument(); // Total trends
  });

  it('displays reach and conversion increases', () => {
    render(<TrendImpactGraph data={mockData} />);
    
    // Check reach increases
    expect(screen.getByText('+38.2%')).toBeInTheDocument(); // AI Revolution reach
    expect(screen.getByText('+41.8%')).toBeInTheDocument(); // Sustainable Living reach
    expect(screen.getByText('+25.7%')).toBeInTheDocument(); // Remote Work reach
    
    // Check conversion increases
    expect(screen.getByText('+28.9%')).toBeInTheDocument(); // AI Revolution conversion
    expect(screen.getByText('+22.4%')).toBeInTheDocument(); // Sustainable Living conversion
    expect(screen.getByText('+18.9%')).toBeInTheDocument(); // Remote Work conversion
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <TrendImpactGraph data={mockData} className="custom-trend-class" />
    );
    
    const trendElement = container.firstChild as HTMLElement;
    expect(trendElement).toHaveClass('custom-trend-class');
  });

  it('shows correct status icons for each trend state', () => {
    render(<TrendImpactGraph data={mockData} />);
    
    // Each trend should have appropriate status icon
    const statusIcons = screen.getAllByTestId(/status-icon/);
    expect(statusIcons.length).toBe(mockData.length);
  });

  it('displays impact bars with correct proportions', () => {
    render(<TrendImpactGraph data={mockData} />);
    
    // AI Revolution has highest impact (94), so should have widest bar
    const aiTrendBar = screen.getByTestId('impact-bar-AI Revolution');
    expect(aiTrendBar).toHaveStyle({ width: '100%' }); // Should be 100% as it's the highest
  });
}); 