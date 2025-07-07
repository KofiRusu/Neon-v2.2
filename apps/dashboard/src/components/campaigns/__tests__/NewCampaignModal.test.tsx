import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { NewCampaignModal } from '../NewCampaignModal';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock tRPC
jest.mock('@/utils/trpc', () => ({
  trpc: {
    campaignOrchestration: {
      launchCampaign: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
        }),
      },
      simulateCampaign: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
        }),
      },
      validateCampaignInput: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
        }),
      },
    },
  },
}));

describe('NewCampaignModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onLaunch: jest.fn(),
    onSimulate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when isOpen is true', () => {
    render(<NewCampaignModal {...mockProps} />);
    
    expect(screen.getByText('Launch AI Campaign')).toBeInTheDocument();
    expect(screen.getByText('Orchestrate TrendAgent → ContentAgent → SocialAgent')).toBeInTheDocument();
  });

  it('does not render modal when isOpen is false', () => {
    render(<NewCampaignModal {...mockProps} isOpen={false} />);
    
    expect(screen.queryByText('Launch AI Campaign')).not.toBeInTheDocument();
  });

  it('renders step 1 form fields', () => {
    render(<NewCampaignModal {...mockProps} />);
    
    expect(screen.getByLabelText('Campaign Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Campaign Topic')).toBeInTheDocument();
    expect(screen.getByLabelText('Target Audience')).toBeInTheDocument();
    expect(screen.getByLabelText('Tone')).toBeInTheDocument();
  });

  it('allows user to fill in campaign basics', () => {
    render(<NewCampaignModal {...mockProps} />);
    
    const campaignNameInput = screen.getByLabelText('Campaign Name');
    const topicInput = screen.getByLabelText('Campaign Topic');
    const audienceInput = screen.getByLabelText('Target Audience');
    
    fireEvent.change(campaignNameInput, { target: { value: 'Test Campaign' } });
    fireEvent.change(topicInput, { target: { value: 'AI Marketing' } });
    fireEvent.change(audienceInput, { target: { value: 'Marketers' } });
    
    expect(campaignNameInput).toHaveValue('Test Campaign');
    expect(topicInput).toHaveValue('AI Marketing');
    expect(audienceInput).toHaveValue('Marketers');
  });

  it('allows user to select tone', () => {
    render(<NewCampaignModal {...mockProps} />);
    
    const professionalTone = screen.getByText('Professional');
    fireEvent.click(professionalTone);
    
    expect(professionalTone.closest('button')).toHaveClass('bg-purple-500/20');
  });

  it('progresses to step 2 when next is clicked', async () => {
    render(<NewCampaignModal {...mockProps} />);
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Campaign Name'), { target: { value: 'Test Campaign' } });
    fireEvent.change(screen.getByLabelText('Campaign Topic'), { target: { value: 'AI Marketing' } });
    fireEvent.change(screen.getByLabelText('Target Audience'), { target: { value: 'Marketers' } });
    
    // Click next
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Platforms & Content')).toBeInTheDocument();
    });
  });

  it('shows platforms and content types in step 2', async () => {
    render(<NewCampaignModal {...mockProps} />);
    
    // Fill in required fields and go to step 2
    fireEvent.change(screen.getByLabelText('Campaign Name'), { target: { value: 'Test Campaign' } });
    fireEvent.change(screen.getByLabelText('Campaign Topic'), { target: { value: 'AI Marketing' } });
    fireEvent.change(screen.getByLabelText('Target Audience'), { target: { value: 'Marketers' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Select Platforms')).toBeInTheDocument();
      expect(screen.getByText('Content Types')).toBeInTheDocument();
      expect(screen.getByText('Instagram')).toBeInTheDocument();
      expect(screen.getByText('Blog Posts')).toBeInTheDocument();
    });
  });

  it('allows platform selection', async () => {
    render(<NewCampaignModal {...mockProps} />);
    
    // Navigate to step 2
    fireEvent.change(screen.getByLabelText('Campaign Name'), { target: { value: 'Test Campaign' } });
    fireEvent.change(screen.getByLabelText('Campaign Topic'), { target: { value: 'AI Marketing' } });
    fireEvent.change(screen.getByLabelText('Target Audience'), { target: { value: 'Marketers' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      const instagramButton = screen.getByText('Instagram').closest('button');
      fireEvent.click(instagramButton!);
      
      expect(instagramButton).toHaveClass('bg-blue-500/20');
    });
  });

  it('calls onClose when close button is clicked', () => {
    render(<NewCampaignModal {...mockProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('shows campaign preview in step 4', async () => {
    render(<NewCampaignModal {...mockProps} />);
    
    // Fill in all required fields and navigate to step 4
    fireEvent.change(screen.getByLabelText('Campaign Name'), { target: { value: 'Test Campaign' } });
    fireEvent.change(screen.getByLabelText('Campaign Topic'), { target: { value: 'AI Marketing' } });
    fireEvent.change(screen.getByLabelText('Target Audience'), { target: { value: 'Marketers' } });
    
    // Go to step 2
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      // Select platforms and content types
      fireEvent.click(screen.getByText('Instagram').closest('button')!);
      fireEvent.click(screen.getByText('Social Posts').closest('button')!);
      
      // Go to step 3
      fireEvent.click(screen.getByText('Next'));
    });
    
    await waitFor(() => {
      // Go to step 4
      fireEvent.click(screen.getByText('Next'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Campaign Preview')).toBeInTheDocument();
      expect(screen.getByText('Test Campaign')).toBeInTheDocument();
      expect(screen.getByText('AI Marketing')).toBeInTheDocument();
    });
  });

  it('shows both Simulate and Launch buttons in step 4', async () => {
    render(<NewCampaignModal {...mockProps} />);
    
    // Navigate to step 4 with all required fields
    fireEvent.change(screen.getByLabelText('Campaign Name'), { target: { value: 'Test Campaign' } });
    fireEvent.change(screen.getByLabelText('Campaign Topic'), { target: { value: 'AI Marketing' } });
    fireEvent.change(screen.getByLabelText('Target Audience'), { target: { value: 'Marketers' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Instagram').closest('button')!);
      fireEvent.click(screen.getByText('Social Posts').closest('button')!);
      fireEvent.click(screen.getByText('Next'));
    });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Next'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Simulate')).toBeInTheDocument();
      expect(screen.getByText('Launch Campaign')).toBeInTheDocument();
    });
  });

  it('disables next button when required fields are empty', () => {
    render(<NewCampaignModal {...mockProps} />);
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('enables next button when required fields are filled', () => {
    render(<NewCampaignModal {...mockProps} />);
    
    fireEvent.change(screen.getByLabelText('Campaign Name'), { target: { value: 'Test Campaign' } });
    fireEvent.change(screen.getByLabelText('Campaign Topic'), { target: { value: 'AI Marketing' } });
    fireEvent.change(screen.getByLabelText('Target Audience'), { target: { value: 'Marketers' } });
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeEnabled();
  });

  it('shows progress bar with correct percentage', () => {
    render(<NewCampaignModal {...mockProps} />);
    
    const progressBar = document.querySelector('[style*="width: 25%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('shows step indicator', () => {
    render(<NewCampaignModal {...mockProps} />);
    
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
  });
}); 