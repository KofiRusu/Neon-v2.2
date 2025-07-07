import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CampaignPerformanceTable from '../CampaignPerformanceTable';

const mockData = [
  {
    id: 'camp-001',
    name: 'Spring Fashion Campaign',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-02-15',
    budget: 50000,
    spent: 35000,
    impressions: 1250000,
    clicks: 42500,
    conversions: 892,
    ctr: 3.4,
    conversionRate: 2.1,
    cpa: 39.24,
    roas: 4.2,
    learningScore: 87.5,
    lastLearningUpdate: '2024-01-20T10:30:00Z',
    aiAdjustments: [
      'Optimized targeting for 25-34 demographic',
      'Adjusted bid strategy for peak hours',
      'Enhanced creative rotation',
    ],
    toneStrategy: 'Casual',
    platformFocus: 'Instagram, Facebook',
    trendAdoption: 'Spring trends, fashion week hashtags',
  },
  {
    id: 'camp-002', 
    name: 'Tech Product Launch',
    status: 'completed',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    budget: 75000,
    spent: 72000,
    impressions: 890000,
    clicks: 32100,
    conversions: 654,
    ctr: 3.6,
    conversionRate: 2.0,
    cpa: 110.09,
    roas: 3.8,
    learningScore: 92.1,
    lastLearningUpdate: '2024-01-31T15:45:00Z',
    aiAdjustments: [
      'Refined keyword targeting',
      'Optimized landing page experience',
    ],
    toneStrategy: 'Professional',
    platformFocus: 'LinkedIn, Google Ads',
    trendAdoption: 'AI innovation trends, tech news cycles',
  },
  {
    id: 'camp-003',
    name: 'Holiday Sales Blitz',
    status: 'paused',
    startDate: '2023-12-01',
    endDate: '2023-12-31', 
    budget: 100000,
    spent: 85000,
    impressions: 2100000,
    clicks: 78400,
    conversions: 1567,
    ctr: 3.7,
    conversionRate: 2.0,
    cpa: 54.24,
    roas: 5.1,
    learningScore: 94.8,
    lastLearningUpdate: '2023-12-30T09:15:00Z',
    aiAdjustments: [
      'Dynamic pricing optimization',
      'Real-time inventory-based targeting',
      'Urgency messaging optimization',
      'Cross-platform audience sync',
    ],
    toneStrategy: 'Urgent',
    platformFocus: 'Facebook, Instagram, Google Ads',
    trendAdoption: 'Black Friday, holiday shopping, gift guides',
  },
];

describe('CampaignPerformanceTable', () => {
  it('renders campaign table with all campaigns', () => {
    render(<CampaignPerformanceTable data={mockData} />);
    
    expect(screen.getByText('Campaign Performance & Learning Insights')).toBeInTheDocument();
    expect(screen.getByText('Spring Fashion Campaign')).toBeInTheDocument();
    expect(screen.getByText('Tech Product Launch')).toBeInTheDocument();
    expect(screen.getByText('Holiday Sales Blitz')).toBeInTheDocument();
  });

  it('displays campaign metrics correctly', () => {
    render(<CampaignPerformanceTable data={mockData} />);
    
    // Check budget values
    expect(screen.getByText('$50,000')).toBeInTheDocument(); // Spring Fashion budget
    expect(screen.getByText('$75,000')).toBeInTheDocument(); // Tech Product budget
    expect(screen.getByText('$100,000')).toBeInTheDocument(); // Holiday Sales budget
    
    // Check ROAS values
    expect(screen.getByText('4.2x')).toBeInTheDocument(); // Spring Fashion ROAS
    expect(screen.getByText('3.8x')).toBeInTheDocument(); // Tech Product ROAS
    expect(screen.getByText('5.1x')).toBeInTheDocument(); // Holiday Sales ROAS
  });

  it('shows learning scores with correct formatting', () => {
    render(<CampaignPerformanceTable data={mockData} />);
    
    expect(screen.getByText('87.5')).toBeInTheDocument(); // Spring Fashion
    expect(screen.getByText('92.1')).toBeInTheDocument(); // Tech Product
    expect(screen.getByText('94.8')).toBeInTheDocument(); // Holiday Sales
  });

  it('displays status indicators with correct styling', () => {
    render(<CampaignPerformanceTable data={mockData} />);
    
    // Check status badges
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument(); 
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('sorts campaigns by different columns', () => {
    render(<CampaignPerformanceTable data={mockData} />);
    
    // Click on ROAS column to sort
    const roasHeader = screen.getByText('ROAS');
    fireEvent.click(roasHeader);
    
    // Holiday Sales should be first (highest ROAS: 5.1x)
    const rows = screen.getAllByTestId(/campaign-row/);
    expect(rows[0]).toHaveTextContent('Holiday Sales Blitz');
    
    // Click again to reverse sort
    fireEvent.click(roasHeader);
    
    // Tech Product should be first (lowest ROAS: 3.8x)
    const reversedRows = screen.getAllByTestId(/campaign-row/);
    expect(reversedRows[0]).toHaveTextContent('Tech Product Launch');
  });

  it('filters campaigns by status', () => {
    render(<CampaignPerformanceTable data={mockData} />);
    
    const statusFilter = screen.getByDisplayValue('all');
    
    // Filter to only active campaigns
    fireEvent.change(statusFilter, { target: { value: 'active' } });
    
    // Should only show Spring Fashion Campaign
    expect(screen.getByText('Spring Fashion Campaign')).toBeInTheDocument();
    expect(screen.queryByText('Tech Product Launch')).not.toBeInTheDocument();
    expect(screen.queryByText('Holiday Sales Blitz')).not.toBeInTheDocument();
  });

  it('expands campaign details on row click', () => {
    render(<CampaignPerformanceTable data={mockData} />);
    
    // Click on Spring Fashion Campaign row
    const springCampaign = screen.getByText('Spring Fashion Campaign').closest('tr');
    fireEvent.click(springCampaign!);
    
    // Should show expanded details
    expect(screen.getByText('AI Learning Insights')).toBeInTheDocument();
    expect(screen.getByText('Strategy Details')).toBeInTheDocument();
    expect(screen.getByText('Performance Breakdown')).toBeInTheDocument();
    
    // Should show AI adjustments
    expect(screen.getByText('Optimized targeting for 25-34 demographic')).toBeInTheDocument();
    expect(screen.getByText('Adjusted bid strategy for peak hours')).toBeInTheDocument();
    expect(screen.getByText('Enhanced creative rotation')).toBeInTheDocument();
  });

  it('displays tone and platform strategies', () => {
    render(<CampaignPerformanceTable data={mockData} />);
    
    // Expand Spring Fashion Campaign
    const springCampaign = screen.getByText('Spring Fashion Campaign').closest('tr');
    fireEvent.click(springCampaign!);
    
    // Should show strategy details
    expect(screen.getByText('Casual')).toBeInTheDocument(); // Tone
    expect(screen.getByText('Instagram, Facebook')).toBeInTheDocument(); // Platform
    expect(screen.getByText('Spring trends, fashion week hashtags')).toBeInTheDocument(); // Trends
  });

  it('shows AI adaptation indicators', () => {
    render(<CampaignPerformanceTable data={mockData} />);
    
    // Should show adaptation counts as badges
    expect(screen.getByText('3')).toBeInTheDocument(); // Spring Fashion (3 adjustments)
    expect(screen.getByText('2')).toBeInTheDocument(); // Tech Product (2 adjustments)
    expect(screen.getByText('4')).toBeInTheDocument(); // Holiday Sales (4 adjustments)
  });

  it('calculates CTR and conversion rates correctly', () => {
    render(<CampaignPerformanceTable data={mockData} />);
    
    // Check CTR values
    expect(screen.getByText('3.4%')).toBeInTheDocument(); // Spring Fashion CTR
    expect(screen.getByText('3.6%')).toBeInTheDocument(); // Tech Product CTR
    expect(screen.getByText('3.7%')).toBeInTheDocument(); // Holiday Sales CTR
    
    // Check conversion rates
    expect(screen.getByText('2.1%')).toBeInTheDocument(); // Spring Fashion conversion
    expect(screen.getByText('2.0%')).toBeInTheDocument(); // Tech Product conversion
    expect(screen.getByText('2.0%')).toBeInTheDocument(); // Holiday Sales conversion
  });

  it('formats last learning update timestamps', () => {
    render(<CampaignPerformanceTable data={mockData} />);
    
    // Expand Spring Fashion Campaign to see details
    const springCampaign = screen.getByText('Spring Fashion Campaign').closest('tr');
    fireEvent.click(springCampaign!);
    
    // Should show formatted timestamp
    expect(screen.getByText('1/20/2024')).toBeInTheDocument();
  });

  it('shows spend vs budget with progress indicators', () => {
    render(<CampaignPerformanceTable data={mockData} />);
    
    // Check spent amounts
    expect(screen.getByText('$35,000')).toBeInTheDocument(); // Spring Fashion spent
    expect(screen.getByText('$72,000')).toBeInTheDocument(); // Tech Product spent
    expect(screen.getByText('$85,000')).toBeInTheDocument(); // Holiday Sales spent
  });

  it('uses fallback data when no data provided', () => {
    render(<CampaignPerformanceTable />);
    
    // Should render without crashing and show default campaigns
    expect(screen.getByText('Campaign Performance & Learning Insights')).toBeInTheDocument();
    expect(screen.getByText('Spring Fashion Campaign')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    render(<CampaignPerformanceTable data={[]} />);
    
    expect(screen.getByText('Campaign Performance & Learning Insights')).toBeInTheDocument();
    expect(screen.getByText('No campaigns available')).toBeInTheDocument();
  });

  it('displays cost per acquisition correctly', () => {
    render(<CampaignPerformanceTable data={mockData} />);
    
    // Check CPA values
    expect(screen.getByText('$39.24')).toBeInTheDocument(); // Spring Fashion CPA
    expect(screen.getByText('$110.09')).toBeInTheDocument(); // Tech Product CPA
    expect(screen.getByText('$54.24')).toBeInTheDocument(); // Holiday Sales CPA
  });

  it('collapses expanded row on second click', () => {
    render(<CampaignPerformanceTable data={mockData} />);
    
    const springCampaign = screen.getByText('Spring Fashion Campaign').closest('tr');
    
    // First click to expand
    fireEvent.click(springCampaign!);
    expect(screen.getByText('AI Learning Insights')).toBeInTheDocument();
    
    // Second click to collapse
    fireEvent.click(springCampaign!);
    expect(screen.queryByText('AI Learning Insights')).not.toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <CampaignPerformanceTable data={mockData} className="custom-table-class" />
    );
    
    const tableElement = container.firstChild as HTMLElement;
    expect(tableElement).toHaveClass('custom-table-class');
  });

  it('shows performance indicators with correct colors', () => {
    const { container } = render(<CampaignPerformanceTable data={mockData} />);
    
    // High-performing campaigns should have green indicators
    const greenElements = container.querySelectorAll('.text-neon-green');
    expect(greenElements.length).toBeGreaterThan(0);
    
    // Medium-performing campaigns should have blue indicators  
    const blueElements = container.querySelectorAll('.text-neon-blue');
    expect(blueElements.length).toBeGreaterThan(0);
  });

  it('displays trend adoption information correctly', () => {
    render(<CampaignPerformanceTable data={mockData} />);
    
    // Expand Holiday Sales Campaign
    const holidayCampaign = screen.getByText('Holiday Sales Blitz').closest('tr');
    fireEvent.click(holidayCampaign!);
    
    // Should show trend adoption details
    expect(screen.getByText('Black Friday, holiday shopping, gift guides')).toBeInTheDocument();
  });
}); 