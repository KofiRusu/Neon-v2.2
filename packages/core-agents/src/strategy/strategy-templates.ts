import { CampaignGoal, CampaignAudience, CampaignContext } from './CampaignStrategyPlanner';

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: 'product' | 'promotion' | 'engagement' | 'conversion';
  goal: Partial<CampaignGoal>;
  audience: Partial<CampaignAudience>;
  context: Partial<CampaignContext>;
  recommendedChannels: string[];
  estimatedDuration: number; // days
  complexity: 'simple' | 'moderate' | 'complex';
  stages: Array<{
    name: string;
    description: string;
    agents: string[];
    estimatedDuration: number;
  }>;
  kpis: Array<{
    metric: string;
    description: string;
    targetRange: { min: number; max: number };
  }>;
  tips: string[];
  successFactors: string[];
  commonPitfalls: string[];
}

export const strategyTemplates: Record<string, StrategyTemplate> = {
  'product-launch': {
    id: 'product-launch',
    name: 'Product Launch Campaign',
    description:
      'Comprehensive multi-channel campaign for launching new products with maximum market impact',
    category: 'product',
    goal: {
      type: 'product_launch',
      objective: 'Launch new product with market awareness and initial sales momentum',
      kpis: [
        { metric: 'reach', target: 100000, timeframe: '30 days' },
        { metric: 'conversions', target: 500, timeframe: '30 days' },
        { metric: 'brand_mentions', target: 1000, timeframe: '30 days' },
      ],
    },
    audience: {
      segment: 'consumer',
      demographics: {
        ageRange: '25-45',
        interests: ['technology', 'innovation', 'productivity'],
        painPoints: ['time management', 'efficiency', 'cost optimization'],
        channels: ['social', 'email', 'content', 'ads'],
      },
      persona: {
        name: 'Tech-Savvy Professional',
        description: 'Early adopter who values innovative solutions and shares recommendations',
        motivations: ['productivity improvement', 'competitive advantage', 'quality tools'],
        objections: ['price concerns', 'learning curve', 'reliability questions'],
      },
    },
    context: {
      channels: ['social', 'email', 'content', 'ads', 'seo'],
      timeline: {
        startDate: '',
        endDate: '',
      },
    },
    recommendedChannels: ['social', 'email', 'content', 'ads', 'seo'],
    estimatedDuration: 45,
    complexity: 'complex',
    stages: [
      {
        name: 'Market Research & Trend Analysis',
        description: 'Analyze market conditions, competitor landscape, and trending topics',
        agents: ['trend-agent', 'insight-agent'],
        estimatedDuration: 7,
      },
      {
        name: 'Brand Alignment & Messaging',
        description: 'Ensure messaging aligns with brand voice and resonates with target audience',
        agents: ['brand-voice-agent', 'content-agent'],
        estimatedDuration: 10,
      },
      {
        name: 'Content Creation & Optimization',
        description: 'Create compelling content across all channels with SEO optimization',
        agents: ['content-agent', 'seo-agent', 'design-agent'],
        estimatedDuration: 14,
      },
      {
        name: 'Multi-Channel Execution',
        description: 'Launch coordinated campaigns across social, email, and paid channels',
        agents: ['social-agent', 'email-agent', 'ad-agent'],
        estimatedDuration: 21,
      },
      {
        name: 'Performance Monitoring',
        description: 'Track metrics, optimize performance, and generate insights',
        agents: ['insight-agent'],
        estimatedDuration: 30,
      },
    ],
    kpis: [
      {
        metric: 'Brand Awareness Lift',
        description: 'Increase in brand recognition and recall',
        targetRange: { min: 15, max: 35 },
      },
      {
        metric: 'Launch Week Sales',
        description: 'Revenue generated in first week',
        targetRange: { min: 50000, max: 200000 },
      },
      {
        metric: 'Social Engagement Rate',
        description: 'Engagement across social platforms',
        targetRange: { min: 4, max: 8 },
      },
      {
        metric: 'Email Open Rate',
        description: 'Email campaign performance',
        targetRange: { min: 25, max: 40 },
      },
    ],
    tips: [
      'Create anticipation with teaser content 2-3 weeks before launch',
      'Leverage influencer partnerships for authentic endorsements',
      'Coordinate timing across all channels for maximum impact',
      'Prepare customer support for increased inquiries',
      'Use social proof and early customer testimonials',
    ],
    successFactors: [
      'Clear value proposition that addresses real pain points',
      'Consistent messaging across all touchpoints',
      'Strong visual identity and compelling creative assets',
      'Coordinated timing and sequencing of campaign elements',
      'Real-time monitoring and optimization capabilities',
    ],
    commonPitfalls: [
      'Launching without sufficient market research',
      'Inconsistent messaging across channels',
      'Overwhelming audience with too much information',
      'Poor timing or market conditions',
      'Insufficient budget allocation for paid promotion',
    ],
  },

  'seasonal-promo': {
    id: 'seasonal-promo',
    name: 'Seasonal Promotion Campaign',
    description:
      'Time-sensitive promotional campaign leveraging seasonal trends and shopping behaviors',
    category: 'promotion',
    goal: {
      type: 'seasonal_promo',
      objective: 'Maximize sales during seasonal peak with engaging promotional content',
      kpis: [
        { metric: 'sales', target: 150000, timeframe: '21 days' },
        { metric: 'conversions', target: 1000, timeframe: '21 days' },
        { metric: 'engagement', target: 50000, timeframe: '21 days' },
      ],
    },
    audience: {
      segment: 'consumer',
      demographics: {
        ageRange: '18-55',
        interests: ['shopping', 'deals', 'seasonal events'],
        painPoints: ['budget constraints', 'gift selection', 'time pressure'],
        channels: ['social', 'email', 'ads'],
      },
      persona: {
        name: 'Seasonal Shopper',
        description: 'Price-conscious consumer looking for deals during seasonal periods',
        motivations: ['savings', 'gift-giving', 'seasonal celebration'],
        objections: ['price sensitivity', 'decision fatigue', 'time constraints'],
      },
    },
    context: {
      channels: ['social', 'email', 'ads'],
      timeline: {
        startDate: '',
        endDate: '',
      },
    },
    recommendedChannels: ['social', 'email', 'ads'],
    estimatedDuration: 21,
    complexity: 'moderate',
    stages: [
      {
        name: 'Seasonal Trend Research',
        description: 'Identify seasonal trends, shopping patterns, and competitive landscape',
        agents: ['trend-agent'],
        estimatedDuration: 3,
      },
      {
        name: 'Promotional Content Creation',
        description: 'Create urgent, compelling promotional content with strong CTAs',
        agents: ['content-agent', 'design-agent'],
        estimatedDuration: 7,
      },
      {
        name: 'Multi-Channel Launch',
        description: 'Execute coordinated promotional campaign across channels',
        agents: ['social-agent', 'email-agent', 'ad-agent'],
        estimatedDuration: 14,
      },
      {
        name: 'Performance Optimization',
        description: 'Monitor and optimize campaigns for maximum ROI',
        agents: ['insight-agent', 'ad-agent'],
        estimatedDuration: 21,
      },
    ],
    kpis: [
      {
        metric: 'Revenue Increase',
        description: 'Sales lift compared to baseline',
        targetRange: { min: 200, max: 400 },
      },
      {
        metric: 'Ad ROAS',
        description: 'Return on ad spend',
        targetRange: { min: 300, max: 600 },
      },
      {
        metric: 'Email CTR',
        description: 'Email click-through rate',
        targetRange: { min: 8, max: 15 },
      },
    ],
    tips: [
      'Start promotion planning 4-6 weeks before the season',
      'Create urgency with limited-time offers and countdown timers',
      'Use seasonal imagery and themes in all creative assets',
      'Segment email lists based on purchase history and preferences',
      'Monitor competitor pricing and adjust strategies accordingly',
    ],
    successFactors: [
      'Strong promotional offer that provides clear value',
      'Timely execution aligned with seasonal shopping patterns',
      'Eye-catching creative with seasonal themes',
      'Effective use of urgency and scarcity tactics',
      'Coordinated cross-channel messaging',
    ],
    commonPitfalls: [
      'Starting promotional campaigns too late',
      'Weak or confusing promotional offers',
      'Poor inventory planning and stockouts',
      'Inconsistent pricing across channels',
      'Overwhelming customers with too many promotional messages',
    ],
  },

  'b2b-outreach': {
    id: 'b2b-outreach',
    name: 'B2B Lead Generation & Outreach',
    description: 'Targeted outreach campaign for B2B lead generation with personalized messaging',
    category: 'conversion',
    goal: {
      type: 'b2b_outreach',
      objective:
        'Generate qualified B2B leads through strategic outreach and relationship building',
      kpis: [
        { metric: 'leads', target: 200, timeframe: '60 days' },
        { metric: 'conversions', target: 50, timeframe: '60 days' },
        { metric: 'sales', target: 100000, timeframe: '90 days' },
      ],
    },
    audience: {
      segment: 'enterprise',
      demographics: {
        ageRange: '30-55',
        interests: ['business growth', 'efficiency', 'ROI'],
        painPoints: ['scalability', 'cost management', 'competitive pressure'],
        channels: ['email', 'outreach', 'content'],
      },
      persona: {
        name: 'Business Decision Maker',
        description: 'C-level or senior manager focused on business outcomes and ROI',
        motivations: ['business growth', 'competitive advantage', 'operational efficiency'],
        objections: ['budget approval', 'implementation complexity', 'risk assessment'],
      },
    },
    context: {
      channels: ['email', 'outreach', 'content'],
      timeline: {
        startDate: '',
        endDate: '',
      },
    },
    recommendedChannels: ['email', 'outreach', 'content'],
    estimatedDuration: 60,
    complexity: 'complex',
    stages: [
      {
        name: 'Target Account Research',
        description: 'Identify and research high-value target accounts and decision makers',
        agents: ['insight-agent', 'outreach-agent'],
        estimatedDuration: 14,
      },
      {
        name: 'Content & Messaging Development',
        description: 'Create thought leadership content and personalized messaging',
        agents: ['content-agent', 'brand-voice-agent'],
        estimatedDuration: 21,
      },
      {
        name: 'Multi-Touch Outreach Sequence',
        description: 'Execute personalized outreach with multiple touchpoints',
        agents: ['outreach-agent', 'email-agent'],
        estimatedDuration: 45,
      },
      {
        name: 'Relationship Nurturing',
        description: 'Build relationships and guide prospects through sales funnel',
        agents: ['outreach-agent', 'insight-agent'],
        estimatedDuration: 60,
      },
    ],
    kpis: [
      {
        metric: 'Response Rate',
        description: 'Percentage of outreach that receives responses',
        targetRange: { min: 15, max: 30 },
      },
      {
        metric: 'Meeting Conversion Rate',
        description: 'Percentage of responses that book meetings',
        targetRange: { min: 25, max: 50 },
      },
      {
        metric: 'Pipeline Value',
        description: 'Total value of opportunities created',
        targetRange: { min: 500000, max: 2000000 },
      },
    ],
    tips: [
      'Research target accounts thoroughly before outreach',
      'Personalize messages based on company news and challenges',
      'Provide value in every interaction, not just sales pitches',
      'Use multiple channels and touchpoints for better reach',
      'Track and optimize based on response patterns',
    ],
    successFactors: [
      'High-quality prospect research and targeting',
      'Personalized, value-driven messaging',
      'Consistent follow-up and relationship building',
      'Strong thought leadership content',
      'Alignment between marketing and sales teams',
    ],
    commonPitfalls: [
      'Generic, mass-produced outreach messages',
      'Poor prospect research and targeting',
      'Giving up after one or two touchpoints',
      'Focusing on features instead of business value',
      'Lack of systematic follow-up process',
    ],
  },

  'retargeting-campaign': {
    id: 'retargeting-campaign',
    name: 'Retargeting & Re-engagement',
    description:
      'Strategic retargeting campaign to re-engage warm prospects and recover abandoned conversions',
    category: 'conversion',
    goal: {
      type: 'retargeting',
      objective:
        'Re-engage warm prospects and recover abandoned conversions through targeted messaging',
      kpis: [
        { metric: 'conversions', target: 300, timeframe: '30 days' },
        { metric: 'engagement', target: 25000, timeframe: '30 days' },
        { metric: 'sales', target: 75000, timeframe: '30 days' },
      ],
    },
    audience: {
      segment: 'consumer',
      demographics: {
        ageRange: '25-50',
        interests: ['previous site visitors', 'abandoned carts', 'email subscribers'],
        painPoints: ['decision hesitation', 'comparison shopping', 'budget concerns'],
        channels: ['ads', 'email', 'social'],
      },
      persona: {
        name: 'Interested But Hesitant Buyer',
        description: 'Previously engaged prospect who needs additional motivation to convert',
        motivations: ['value confirmation', 'social proof', 'limited-time offers'],
        objections: ['price concerns', 'feature uncertainty', 'trust issues'],
      },
    },
    context: {
      channels: ['ads', 'email', 'social'],
      timeline: {
        startDate: '',
        endDate: '',
      },
    },
    recommendedChannels: ['ads', 'email', 'social'],
    estimatedDuration: 30,
    complexity: 'moderate',
    stages: [
      {
        name: 'Audience Segmentation & Analysis',
        description: 'Analyze user behavior and segment audiences based on engagement level',
        agents: ['insight-agent'],
        estimatedDuration: 5,
      },
      {
        name: 'Targeted Creative Development',
        description: 'Create specific messaging for different audience segments',
        agents: ['content-agent', 'design-agent'],
        estimatedDuration: 10,
      },
      {
        name: 'Multi-Channel Retargeting',
        description: 'Execute retargeting campaigns across ads, email, and social',
        agents: ['ad-agent', 'email-agent', 'social-agent'],
        estimatedDuration: 25,
      },
      {
        name: 'Conversion Optimization',
        description: 'Optimize campaigns based on performance data',
        agents: ['insight-agent', 'ad-agent'],
        estimatedDuration: 30,
      },
    ],
    kpis: [
      {
        metric: 'Retargeting CTR',
        description: 'Click-through rate for retargeting ads',
        targetRange: { min: 2, max: 5 },
      },
      {
        metric: 'Conversion Recovery Rate',
        description: 'Percentage of abandoned actions recovered',
        targetRange: { min: 10, max: 25 },
      },
      {
        metric: 'Cost Per Acquisition',
        description: 'Cost to acquire a customer through retargeting',
        targetRange: { min: 25, max: 75 },
      },
    ],
    tips: [
      'Segment audiences based on their level of engagement',
      'Use dynamic product ads for abandoned cart recovery',
      'Create urgency with limited-time offers or inventory alerts',
      'Test different creative formats and messaging approaches',
      'Exclude recent converters to avoid ad waste',
    ],
    successFactors: [
      'Accurate audience segmentation and targeting',
      'Relevant, personalized messaging for each segment',
      'Strategic timing and frequency of retargeting',
      'Compelling offers that address specific objections',
      'Cross-channel coordination for maximum impact',
    ],
    commonPitfalls: [
      'Over-targeting and ad fatigue',
      'Generic messaging that ignores user behavior',
      'Poor timing of retargeting campaigns',
      'Lack of frequency capping leading to annoyance',
      'Targeting recent customers who already converted',
    ],
  },
};

export function getTemplateByType(campaignType: string): StrategyTemplate | undefined {
  const typeMapping: Record<string, string> = {
    product_launch: 'product-launch',
    seasonal_promo: 'seasonal-promo',
    b2b_outreach: 'b2b-outreach',
    retargeting: 'retargeting-campaign',
  };

  return strategyTemplates[typeMapping[campaignType]];
}

export function getAllTemplates(): StrategyTemplate[] {
  return Object.values(strategyTemplates);
}

export function getTemplatesByCategory(
  category: 'product' | 'promotion' | 'engagement' | 'conversion'
): StrategyTemplate[] {
  return Object.values(strategyTemplates).filter(template => template.category === category);
}

export function getTemplateRecommendations(
  budget?: number,
  timeline?: number,
  channels?: string[]
): StrategyTemplate[] {
  const templates = Object.values(strategyTemplates);

  return templates
    .filter(template => {
      // Filter by timeline if provided
      if (timeline && template.estimatedDuration > timeline) {
        return false;
      }

      // Filter by channels if provided
      if (channels && channels.length > 0) {
        const hasCommonChannel = template.recommendedChannels.some(channel =>
          channels.includes(channel)
        );
        if (!hasCommonChannel) {
          return false;
        }
      }

      // Simple budget filtering (could be more sophisticated)
      if (budget) {
        const complexityBudgetMin = {
          simple: 5000,
          moderate: 15000,
          complex: 30000,
        };

        if (budget < complexityBudgetMin[template.complexity]) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by complexity (simple first) and duration
      const complexityOrder = { simple: 1, moderate: 2, complex: 3 };
      const complexityDiff = complexityOrder[a.complexity] - complexityOrder[b.complexity];
      if (complexityDiff !== 0) return complexityDiff;

      return a.estimatedDuration - b.estimatedDuration;
    });
}

export default strategyTemplates;
