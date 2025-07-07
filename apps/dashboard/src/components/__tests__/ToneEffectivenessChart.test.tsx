import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ToneEffectivenessChart from '../ToneEffectivenessChart';

const mockData = [
  {
    tone: 'Professional',
    engagementRate: 78.5,
    conversionRate: 12.3,
    reachRate: 65.7,
    averageScore: 85.2,
    campaignCount: 15,
    trend: 'up',
  },
  {
    tone: 'Casual',
    engagementRate: 65.2,
    conversionRate: 8.7,
    reachRate: 72.1,
    averageScore: 68.7,
    campaignCount: 22,
    trend: 'up',
  },
  {
    tone: 'Friendly',
    engagementRate: 82.1,
    conversionRate: 15.4,
    reachRate: 58.3,
    averageScore: 91.8,
    campaignCount: 8,
    trend: 'down',
  },
];

describe('ToneEffectivenessChart', () => {
  it('renders with default engagement rate metric', () => {
    render(<ToneEffectivenessChart data={mockData} />);
    
    expect(screen.getByText('Tone Effectiveness Comparison')).toBeInTheDocument();
    expect(screen.getByDisplayValue('engagementRate')).toBeInTheDocument();
    
    // Should show all tones
    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('Casual')).toBeInTheDocument();
    expect(screen.getByText('Friendly')).toBeInTheDocument();
  });

  it('switches metrics correctly when dropdown changes', () => {
    render(<ToneEffectivenessChart data={mockData} />);
    
    const metricSelect = screen.getByDisplayValue('engagementRate');
    
    // Change to conversion rate
    fireEvent.change(metricSelect, { target: { value: 'conversionRate' } });
    expect(metricSelect).toHaveValue('conversionRate');
    
    // Change to reach rate
    fireEvent.change(metricSelect, { target: { value: 'reachRate' } });
    expect(metricSelect).toHaveValue('reachRate');
    
    // Change to average score
    fireEvent.change(metricSelect, { target: { value: 'averageScore' } });
    expect(metricSelect).toHaveValue('averageScore');
  });

  it('displays correct values for engagement rate metric', () => {
    render(<ToneEffectivenessChart data={mockData} />);
    
    // Professional should have highest engagement rate (78.5%)
    expect(screen.getByText('78.5%')).toBeInTheDocument();
    expect(screen.getByText('65.2%')).toBeInTheDocument();
    expect(screen.getByText('82.1%')).toBeInTheDocument();
  });

  it('shows trend indicators correctly', () => {
    render(<ToneEffectivenessChart data={mockData} />);
    
    // Should have trend indicators (up/down arrows)
    const trendIcons = screen.getAllByTestId(/trend-icon/i);
    expect(trendIcons.length).toBeGreaterThan(0);
  });

  it('handles hover interactions', () => {
    render(<ToneEffectivenessChart data={mockData} />);
    
    const professionalBar = screen.getByText('Professional').closest('div');
    
    // Hover should work without errors
    if (professionalBar) {
      fireEvent.mouseEnter(professionalBar);
      fireEvent.mouseLeave(professionalBar);
    }
  });

  it('displays performance breakdown for selected metric', () => {
    render(<ToneEffectivenessChart data={mockData} />);
    
    // Should show the best performance tone
    expect(screen.getByText('Performance Breakdown')).toBeInTheDocument();
    
    // Check for ranking indicators
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('calculates summary statistics correctly', () => {
    render(<ToneEffectivenessChart data={mockData} />);
    
    // Should show total campaigns (15 + 22 + 8 = 45)
    expect(screen.getByText('45')).toBeInTheDocument();
    
    // Should show best performance (highest engagement rate = 82.1%)
    expect(screen.getByText('82.1%')).toBeInTheDocument();
    
    // Should show average (calculated average)
    const averageEngagement = ((78.5 + 65.2 + 82.1) / 3).toFixed(1);
    expect(screen.getByText(`${averageEngagement}%`)).toBeInTheDocument();
  });

  it('uses fallback data when no data provided', () => {
    render(<ToneEffectivenessChart />);
    
    // Should render without crashing and show default tones
    expect(screen.getByText('Tone Effectiveness Comparison')).toBeInTheDocument();
    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('Casual')).toBeInTheDocument();
    expect(screen.getByText('Friendly')).toBeInTheDocument();
  });

  it('applies custom time range when provided', () => {
    render(<ToneEffectivenessChart data={mockData} timeRange="30d" />);
    
    // Component should render with custom time range
    expect(screen.getByText('Tone Effectiveness Comparison')).toBeInTheDocument();
  });

  it('shows correct colors for different tones', () => {
    const { container } = render(<ToneEffectivenessChart data={mockData} />);
    
    // Professional should have blue color
    const professionalElements = container.querySelectorAll('.text-neon-blue');
    expect(professionalElements.length).toBeGreaterThan(0);
    
    // Casual should have green color
    const casualElements = container.querySelectorAll('.text-neon-green');
    expect(casualElements.length).toBeGreaterThan(0);
    
    // Friendly should have purple color
    const friendlyElements = container.querySelectorAll('.text-neon-purple');
    expect(friendlyElements.length).toBeGreaterThan(0);
  });

  it('displays campaign counts correctly', () => {
    render(<ToneEffectivenessChart data={mockData} />);
    
    expect(screen.getByText('15 campaigns')).toBeInTheDocument();
    expect(screen.getByText('22 campaigns')).toBeInTheDocument();
    expect(screen.getByText('8 campaigns')).toBeInTheDocument();
  });

  it('handles metric switching with correct value updates', () => {
    render(<ToneEffectivenessChart data={mockData} />);
    
    const metricSelect = screen.getByDisplayValue('engagementRate');
    
    // Switch to conversion rate
    fireEvent.change(metricSelect, { target: { value: 'conversionRate' } });
    
    // Should now show conversion rate values
    expect(screen.getByText('12.3%')).toBeInTheDocument(); // Professional
    expect(screen.getByText('8.7%')).toBeInTheDocument();  // Casual
    expect(screen.getByText('15.4%')).toBeInTheDocument(); // Friendly
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <ToneEffectivenessChart data={mockData} className="custom-chart-class" />
    );
    
    const chartElement = container.firstChild as HTMLElement;
    expect(chartElement).toHaveClass('custom-chart-class');
  });
}); 