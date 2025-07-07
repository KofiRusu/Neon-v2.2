import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlatformROIMeter from '../PlatformROIMeter';

const mockData = [
  {
    platform: 'Instagram',
    roi: 245.7,
    revenue: 125000,
    cost: 51000,
    campaigns: 12,
    trend: 'up',
    engagement: 78.5,
    conversions: 892,
    ctr: 3.4,
  },
  {
    platform: 'Facebook',
    roi: 189.3,
    revenue: 98000,
    cost: 52000,
    campaigns: 15,
    trend: 'up',
    engagement: 65.2,
    conversions: 654,
    ctr: 2.8,
  },
  {
    platform: 'LinkedIn',
    roi: 312.8,
    revenue: 87000,
    cost: 28000,
    campaigns: 8,
    trend: 'up',
    engagement: 82.1,
    conversions: 445,
    ctr: 4.2,
  },
  {
    platform: 'Twitter',
    roi: 156.4,
    revenue: 45000,
    cost: 29000,
    campaigns: 6,
    trend: 'down',
    engagement: 58.3,
    conversions: 298,
    ctr: 2.1,
  },
];

describe('PlatformROIMeter', () => {
  it('renders all platforms with ROI gauges', () => {
    render(<PlatformROIMeter data={mockData} />);
    
    expect(screen.getByText('Platform ROI Analysis')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Twitter')).toBeInTheDocument();
  });

  it('displays correct ROI percentages', () => {
    render(<PlatformROIMeter data={mockData} />);
    
    expect(screen.getByText('245.7%')).toBeInTheDocument(); // Instagram
    expect(screen.getByText('189.3%')).toBeInTheDocument(); // Facebook
    expect(screen.getByText('312.8%')).toBeInTheDocument(); // LinkedIn
    expect(screen.getByText('156.4%')).toBeInTheDocument(); // Twitter
  });

  it('shows trend indicators correctly', () => {
    render(<PlatformROIMeter data={mockData} />);
    
    // Should display trend arrows for each platform
    const trendIcons = screen.getAllByTestId(/trend-/);
    expect(trendIcons.length).toBe(mockData.length);
  });

  it('switches between gauge and heatmap views', () => {
    render(<PlatformROIMeter data={mockData} />);
    
    // Default should be gauge view
    expect(screen.getByText('Gauge View')).toBeInTheDocument();
    
    // Switch to heatmap view
    const heatmapButton = screen.getByText('Heatmap View');
    fireEvent.click(heatmapButton);
    
    // Should switch to heatmap view
    expect(screen.getByText('Platform Performance Heatmap')).toBeInTheDocument();
  });

  it('filters platforms by performance', () => {
    render(<PlatformROIMeter data={mockData} />);
    
    const filterSelect = screen.getByDisplayValue('all');
    
    // Filter to high performers (>200% ROI)
    fireEvent.change(filterSelect, { target: { value: 'high' } });
    
    // Should only show Instagram (245.7%) and LinkedIn (312.8%)
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    
    // Should not show Facebook and Twitter
    expect(screen.queryByText('Facebook')).not.toBeInTheDocument();
    expect(screen.queryByText('Twitter')).not.toBeInTheDocument();
  });

  it('displays hover stats on platform interaction', () => {
    render(<PlatformROIMeter data={mockData} />);
    
    const instagramGauge = screen.getByText('Instagram').closest('div');
    
    // Hover should show additional stats
    if (instagramGauge) {
      fireEvent.mouseEnter(instagramGauge);
      
      // Should show revenue and cost
      expect(screen.getByText('$125,000')).toBeInTheDocument();
      expect(screen.getByText('$51,000')).toBeInTheDocument();
    }
  });

  it('calculates and displays ROI performance rankings', () => {
    render(<PlatformROIMeter data={mockData} />);
    
    // LinkedIn should be #1 (312.8% ROI)
    const linkedinSection = screen.getByText('LinkedIn').closest('.glass');
    expect(linkedinSection).toContainHTML('#1');
    
    // Instagram should be #2 (245.7% ROI)
    const instagramSection = screen.getByText('Instagram').closest('.glass');
    expect(instagramSection).toContainHTML('#2');
  });

  it('shows correct performance colors based on ROI', () => {
    const { container } = render(<PlatformROIMeter data={mockData} />);
    
    // High ROI (>250%) should have green indicators
    const highROIElements = container.querySelectorAll('.text-neon-green');
    expect(highROIElements.length).toBeGreaterThan(0);
    
    // Medium ROI (150-250%) should have blue indicators
    const mediumROIElements = container.querySelectorAll('.text-neon-blue');
    expect(mediumROIElements.length).toBeGreaterThan(0);
    
    // Low ROI (<150%) should have pink indicators
    const lowROIElements = container.querySelectorAll('.text-neon-pink');
    expect(lowROIElements.length).toBeGreaterThan(0);
  });

  it('displays platform metrics correctly', () => {
    render(<PlatformROIMeter data={mockData} />);
    
    // Check campaign counts
    expect(screen.getByText('12 campaigns')).toBeInTheDocument(); // Instagram
    expect(screen.getByText('15 campaigns')).toBeInTheDocument(); // Facebook
    expect(screen.getByText('8 campaigns')).toBeInTheDocument();  // LinkedIn
    expect(screen.getByText('6 campaigns')).toBeInTheDocument();  // Twitter
  });

  it('calculates summary statistics correctly', () => {
    render(<PlatformROIMeter data={mockData} />);
    
    // Total campaigns (12 + 15 + 8 + 6 = 41)
    expect(screen.getByText('41')).toBeInTheDocument();
    
    // Best ROI (LinkedIn: 312.8%)
    expect(screen.getByText('312.8%')).toBeInTheDocument();
    
    // Total revenue ($125k + $98k + $87k + $45k = $355k)
    expect(screen.getByText('$355,000')).toBeInTheDocument();
  });

  it('uses fallback data when no data provided', () => {
    render(<PlatformROIMeter />);
    
    // Should render without crashing and show default platforms
    expect(screen.getByText('Platform ROI Analysis')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    render(<PlatformROIMeter data={[]} />);
    
    expect(screen.getByText('Platform ROI Analysis')).toBeInTheDocument();
    expect(screen.getByText('No platform data available')).toBeInTheDocument();
  });

  it('sorts platforms by selected metric', () => {
    render(<PlatformROIMeter data={mockData} />);
    
    // Switch to heatmap view to access sorting
    const heatmapButton = screen.getByText('Heatmap View');
    fireEvent.click(heatmapButton);
    
    const sortSelect = screen.getByDisplayValue('roi');
    
    // Sort by revenue
    fireEvent.change(sortSelect, { target: { value: 'revenue' } });
    
    // Instagram should be first (highest revenue: $125k)
    const platformRows = screen.getAllByTestId('platform-row');
    expect(platformRows[0]).toHaveTextContent('Instagram');
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <PlatformROIMeter data={mockData} className="custom-roi-class" />
    );
    
    const roiElement = container.firstChild as HTMLElement;
    expect(roiElement).toHaveClass('custom-roi-class');
  });

  it('displays engagement rates correctly', () => {
    render(<PlatformROIMeter data={mockData} />);
    
    // Check engagement rates
    expect(screen.getByText('78.5%')).toBeInTheDocument(); // Instagram
    expect(screen.getByText('65.2%')).toBeInTheDocument(); // Facebook
    expect(screen.getByText('82.1%')).toBeInTheDocument(); // LinkedIn
    expect(screen.getByText('58.3%')).toBeInTheDocument(); // Twitter
  });

  it('shows conversion data in heatmap view', () => {
    render(<PlatformROIMeter data={mockData} />);
    
    // Switch to heatmap view
    const heatmapButton = screen.getByText('Heatmap View');
    fireEvent.click(heatmapButton);
    
    // Should show conversion counts
    expect(screen.getByText('892')).toBeInTheDocument(); // Instagram conversions
    expect(screen.getByText('654')).toBeInTheDocument(); // Facebook conversions
    expect(screen.getByText('445')).toBeInTheDocument(); // LinkedIn conversions
    expect(screen.getByText('298')).toBeInTheDocument(); // Twitter conversions
  });

  it('handles view toggle correctly', () => {
    render(<PlatformROIMeter data={mockData} />);
    
    // Start in gauge view
    expect(screen.getByText('Gauge View')).toHaveClass('bg-neon-blue');
    expect(screen.getByText('Heatmap View')).not.toHaveClass('bg-neon-blue');
    
    // Toggle to heatmap
    fireEvent.click(screen.getByText('Heatmap View'));
    expect(screen.getByText('Heatmap View')).toHaveClass('bg-neon-blue');
    expect(screen.getByText('Gauge View')).not.toHaveClass('bg-neon-blue');
    
    // Toggle back to gauge
    fireEvent.click(screen.getByText('Gauge View'));
    expect(screen.getByText('Gauge View')).toHaveClass('bg-neon-blue');
    expect(screen.getByText('Heatmap View')).not.toHaveClass('bg-neon-blue');
  });
}); 