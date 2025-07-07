import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LearningProfileCard from '../LearningProfileCard';

const mockProfile = {
  campaignId: 'test-campaign-123',
  score: 85,
  toneAdjustment: 'Professional Tone',
  trendAdjustment: 'Leveraging AI trends for better engagement',
  platformStrategy: 'Focus on Instagram and LinkedIn platforms',
  effectivenessScore: 92,
  lastUpdated: '2024-01-15T10:30:00Z',
  adaptationsCount: 12,
  successRate: 87.5,
};

describe('LearningProfileCard', () => {
  it('renders with correct tone and platform values', () => {
    render(<LearningProfileCard profile={mockProfile} />);
    
    expect(screen.getByText('Professional Tone')).toBeInTheDocument();
    expect(screen.getByText('Leveraging AI trends for better engagement')).toBeInTheDocument();
    expect(screen.getByText('instagram')).toBeInTheDocument();
    expect(screen.getByText('linkedin')).toBeInTheDocument();
  });

  it('displays learning score with correct color coding', () => {
    const highScoreProfile = { ...mockProfile, score: 90 };
    const { rerender } = render(<LearningProfileCard profile={highScoreProfile} />);
    
    // High score (90) should have neon-green color
    const scoreElement = screen.getByText('90');
    expect(scoreElement).toHaveClass('text-neon-green');
    
    // Test medium score
    const mediumScoreProfile = { ...mockProfile, score: 75 };
    rerender(<LearningProfileCard profile={mediumScoreProfile} />);
    const mediumScoreElement = screen.getByText('75');
    expect(mediumScoreElement).toHaveClass('text-neon-blue');
    
    // Test low score
    const lowScoreProfile = { ...mockProfile, score: 45 };
    rerender(<LearningProfileCard profile={lowScoreProfile} />);
    const lowScoreElement = screen.getByText('45');
    expect(lowScoreElement).toHaveClass('text-neon-pink');
  });

  it('shows quick stats correctly', () => {
    render(<LearningProfileCard profile={mockProfile} />);
    
    expect(screen.getByText('12')).toBeInTheDocument(); // adaptationsCount
    expect(screen.getByText('87.5%')).toBeInTheDocument(); // successRate
    expect(screen.getByText('92%')).toBeInTheDocument(); // effectivenessScore
  });

  it('toggles expanded details on button click', () => {
    render(<LearningProfileCard profile={mockProfile} />);
    
    // Initially details should be hidden
    expect(screen.queryByText('Campaign ID:')).not.toBeInTheDocument();
    
    // Click show details button
    const toggleButton = screen.getByText('Show Details');
    fireEvent.click(toggleButton);
    
    // Details should now be visible
    expect(screen.getByText('Campaign ID:')).toBeInTheDocument();
    expect(screen.getByText('test-campaign-123')).toBeInTheDocument();
    expect(screen.getByText('Last Updated:')).toBeInTheDocument();
    
    // Button text should change
    expect(screen.getByText('Show Less')).toBeInTheDocument();
    
    // Click again to hide
    fireEvent.click(screen.getByText('Show Less'));
    expect(screen.queryByText('Campaign ID:')).not.toBeInTheDocument();
  });

  it('calls onToggleExpanded when provided', () => {
    const mockToggle = jest.fn();
    render(<LearningProfileCard profile={mockProfile} onToggleExpanded={mockToggle} />);
    
    const toggleButton = screen.getByText('Show Details');
    fireEvent.click(toggleButton);
    
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('renders with expanded state when isExpanded prop is true', () => {
    render(<LearningProfileCard profile={mockProfile} isExpanded={true} />);
    
    // Details should be visible immediately
    expect(screen.getByText('Campaign ID:')).toBeInTheDocument();
    expect(screen.getByText('Show Less')).toBeInTheDocument();
  });

  it('extracts platforms from strategy string correctly', () => {
    const multiPlatformProfile = {
      ...mockProfile,
      platformStrategy: 'Focus on Facebook, Twitter, and YouTube for maximum reach',
    };
    
    render(<LearningProfileCard profile={multiPlatformProfile} />);
    
    expect(screen.getByText('facebook')).toBeInTheDocument();
    expect(screen.getByText('twitter')).toBeInTheDocument();
    expect(screen.getByText('youtube')).toBeInTheDocument();
  });

  it('shows fallback when no platforms detected', () => {
    const noPlatformProfile = {
      ...mockProfile,
      platformStrategy: 'General strategy without specific platforms',
    };
    
    render(<LearningProfileCard profile={noPlatformProfile} />);
    
    expect(screen.getByText('All platforms')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <LearningProfileCard profile={mockProfile} className="custom-class" />
    );
    
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('custom-class');
  });

  it('displays performance indicator bar with correct width', () => {
    render(<LearningProfileCard profile={mockProfile} />);
    
    const performanceBar = screen.getByRole('progressbar', { hidden: true });
    expect(performanceBar).toHaveStyle({ width: '85%' });
  });

  it('formats last updated date correctly', () => {
    render(<LearningProfileCard profile={mockProfile} isExpanded={true} />);
    
    const dateElement = screen.getByText('1/15/2024');
    expect(dateElement).toBeInTheDocument();
  });
}); 