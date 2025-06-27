/**
 * Campaign Templates - Predefined Strategies for Campaign Goals
 */

import type { CampaignGoal, CampaignChannel } from '../agents/campaign-agent';

export interface CampaignTemplate {
  id: string;
  name: string;
  goal: string;
  description: string;
  channels: string[];
  duration: string;
  phases: CampaignPhase[];
  metrics: CampaignMetrics;
  content: ContentTemplate;
  audience: AudienceTemplate;
  timing: TimingTemplate;
}

export interface CampaignPhase {
  name: string;
  duration: string;
  description: string;
  agents: string[];
  deliverables: string[];
  dependencies?: string[];
}

export interface CampaignMetrics {
  primary: string[];
  secondary: string[];
  targets: Record<string, number>;
  tracking: string[];
}

export interface ContentTemplate {
  subjectLines: string[];
  headlines: string[];
  emailTemplates: string[];
  socialTemplates: string[];
  ctaVariants: string[];
  toneGuidelines: string;
}

export interface AudienceTemplate {
  segments: string[];
  personas: string[];
  channels: string[];
  behaviors: string[];
}

export interface TimingTemplate {
  bestDays: string[];
  bestTimes: string[];
  frequency: string;
  sequence: string[];
}

export const BRAND_AWARENESS_TEMPLATE: CampaignTemplate = {
  id: 'brand_awareness_template',
  name: 'Brand Awareness Campaign',
  goal: 'brand_awareness',
  description: 'Build brand recognition and establish market presence',
  channels: ['email', 'social_media', 'content_marketing'],
  duration: '4 weeks',
  phases: [
    {
      name: 'Research & Planning',
      duration: '3 days',
      description: 'Analyze market and define brand positioning',
      agents: ['insight-agent', 'brand-voice-agent'],
      deliverables: ['market_analysis', 'brand_guidelines', 'content_strategy'],
    },
    {
      name: 'Content Creation',
      duration: '5 days',
      description: 'Develop brand-focused content across channels',
      agents: ['content-agent', 'design-agent', 'social-agent'],
      deliverables: ['brand_content', 'visual_assets', 'social_content'],
    },
    {
      name: 'Launch & Distribution',
      duration: '2 weeks',
      description: 'Deploy content across all channels',
      agents: ['email-agent', 'social-agent'],
      deliverables: ['email_campaigns', 'social_posts', 'content_distribution'],
    },
    {
      name: 'Monitoring & Optimization',
      duration: '2 weeks',
      description: 'Track performance and optimize messaging',
      agents: ['insight-agent', 'campaign-agent'],
      deliverables: ['performance_reports', 'optimization_recommendations'],
    },
  ],
  metrics: {
    primary: ['brand_mentions', 'reach', 'impressions', 'share_of_voice'],
    secondary: ['engagement_rate', 'website_traffic', 'social_followers'],
    targets: {
      brand_mentions: 500,
      reach: 50000,
      impressions: 200000,
      engagement_rate: 0.05,
    },
    tracking: ['utm_tracking', 'brand_monitoring', 'social_listening'],
  },
  content: {
    subjectLines: [
      'Introducing [Brand]: Your New Marketing Partner',
      'Meet the Future of [Industry]',
      'Why [Target Audience] Choose [Brand]',
    ],
    headlines: [
      'Transform Your [Industry] Experience',
      'Innovation Meets Excellence',
      'The [Brand] Difference',
    ],
    emailTemplates: ['brand_introduction', 'value_proposition', 'brand_story'],
    socialTemplates: ['brand_announcement', 'behind_the_scenes', 'customer_spotlight'],
    ctaVariants: [
      'Learn More About Us',
      'Discover Our Story',
      'See What Makes Us Different',
      'Join Our Community',
    ],
    toneGuidelines: 'Professional yet approachable, confident, inspiring',
  },
  audience: {
    segments: ['potential_customers', 'industry_professionals', 'stakeholders'],
    personas: ['decision_makers', 'influencers', 'early_adopters'],
    channels: ['email', 'linkedin', 'twitter', 'blog'],
    behaviors: ['researching_solutions', 'following_industry_trends', 'networking'],
  },
  timing: {
    bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
    bestTimes: ['10:00 AM', '2:00 PM'],
    frequency: '2-3 times per week',
    sequence: ['introduction', 'value_prop', 'social_proof', 'call_to_action'],
  },
};

export const LEAD_GENERATION_TEMPLATE: CampaignTemplate = {
  id: 'lead_generation_template',
  name: 'Lead Generation Campaign',
  goal: 'lead_generation',
  description: 'Generate qualified leads and build prospect database',
  channels: ['email', 'paid_ads', 'content_marketing'],
  duration: '6 weeks',
  phases: [
    {
      name: 'Lead Magnet Creation',
      duration: '1 week',
      description: 'Develop valuable content offers',
      agents: ['content-agent', 'design-agent'],
      deliverables: ['lead_magnets', 'landing_pages', 'forms'],
    },
    {
      name: 'Campaign Setup',
      duration: '3 days',
      description: 'Configure tracking and automation',
      agents: ['email-agent', 'ad-agent'],
      deliverables: ['email_sequences', 'ad_campaigns', 'tracking_setup'],
    },
    {
      name: 'Lead Acquisition',
      duration: '4 weeks',
      description: 'Drive traffic and capture leads',
      agents: ['ad-agent', 'social-agent', 'email-agent'],
      deliverables: ['active_campaigns', 'lead_capture', 'nurture_sequences'],
    },
    {
      name: 'Lead Qualification',
      duration: '1 week',
      description: 'Score and qualify captured leads',
      agents: ['insight-agent', 'outreach-agent'],
      deliverables: ['lead_scores', 'qualification_reports', 'handoff_to_sales'],
    },
  ],
  metrics: {
    primary: ['leads_generated', 'cost_per_lead', 'lead_quality_score'],
    secondary: ['conversion_rate', 'email_signups', 'form_completions'],
    targets: {
      leads_generated: 500,
      cost_per_lead: 25,
      lead_quality_score: 0.7,
      conversion_rate: 0.15,
    },
    tracking: ['utm_tracking', 'conversion_tracking', 'lead_scoring'],
  },
  content: {
    subjectLines: [
      'Free [Resource]: [Specific Benefit]',
      'Unlock Your [Desired Outcome] Strategy',
      'Get Your Complimentary [Industry] Guide',
    ],
    headlines: [
      'Get Your Free [Resource] Now',
      'Instant Access: [Benefit-Driven Title]',
      'Download Your [Industry] Success Kit',
    ],
    emailTemplates: ['lead_magnet_offer', 'value_delivery', 'nurture_sequence'],
    socialTemplates: ['free_resource_promo', 'testimonial_social_proof', 'problem_solution'],
    ctaVariants: [
      'Download Now',
      'Get Instant Access',
      'Claim Your Free Guide',
      'Start Your Journey',
    ],
    toneGuidelines: 'Helpful, authoritative, benefit-focused, urgent but not pushy',
  },
  audience: {
    segments: ['prospects', 'lookalike_audiences', 'retargeting_audiences'],
    personas: ['decision_makers', 'researchers', 'problem_solvers'],
    channels: ['email', 'google_ads', 'facebook_ads', 'linkedin'],
    behaviors: ['researching_solutions', 'downloading_resources', 'seeking_help'],
  },
  timing: {
    bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
    bestTimes: ['9:00 AM', '1:00 PM', '3:00 PM'],
    frequency: 'Daily for ads, 2x weekly for email',
    sequence: ['awareness', 'interest', 'consideration', 'conversion'],
  },
};

// Template registry
export const CAMPAIGN_TEMPLATES: Record<string, CampaignTemplate> = {
  brand_awareness: BRAND_AWARENESS_TEMPLATE,
  lead_generation: LEAD_GENERATION_TEMPLATE,
};

export function getCampaignTemplate(goal: string): CampaignTemplate | null {
  return CAMPAIGN_TEMPLATES[goal] || null;
}

export function getAvailableTemplates(): CampaignTemplate[] {
  return Object.values(CAMPAIGN_TEMPLATES);
}

export function getTemplatesByChannel(channel: CampaignChannel): CampaignTemplate[] {
  return Object.values(CAMPAIGN_TEMPLATES).filter(template => template.channels.includes(channel));
}

export function customizeTemplate(
  template: CampaignTemplate,
  customizations: Partial<CampaignTemplate>
): CampaignTemplate {
  return {
    ...template,
    ...customizations,
    id: `${template.id}_custom_${Date.now()}`,
  };
}
