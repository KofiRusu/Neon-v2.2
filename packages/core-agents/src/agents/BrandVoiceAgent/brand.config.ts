/**
 * NeonHub Brand Voice Configuration
 * Central knowledgebase for all brand voice, tone, and messaging decisions
 * Used by BrandVoiceAgent for consistent brand communication across all channels
 */

export interface BrandVoiceConfig {
  tagline: string;
  mission: string;
  tone: string;
  targetEmotions: string[];
  adjectives: string[];
  idealCustomer: {
    persona: string;
    intentions: string[];
  };
  contentFilters: {
    avoidWords: string[];
    enforceToneCheck: boolean;
    flagOffToneContent: boolean;
  };
  slogans: string[];
  localization: {
    strategy: string;
    fallbackLanguage: string;
    regionToneOverrides: Record<string, string>;
  };
  autoOptimization: {
    enableAdTesting: boolean;
    pauseUnderperformers: boolean;
  };
  feedback: {
    reviewExample: string;
    dreamQuote: string;
  };
  contentPreferences: {
    types: string[];
    holidayAdaptation: boolean;
    trendIntegration: boolean;
  };
  compliance: {
    protectedElements: string[];
    approvalProtocol: string;
    alertTerms: string[];
  };
  brandDNA: {
    personalityAsHuman: string;
    referenceBrands: string[];
    voiceSwitch: {
      b2b: string;
      b2c: string;
    };
  };
  // Extended NeonHub-specific configurations
  messaging: {
    valueProposition: string;
    keyMessages: string[];
    uniqueSellingPropositions: string[];
  };
  vocabulary: {
    preferred: string[];
    prohibited: string[];
    brandTerms: string[];
    industryTerms: string[];
  };
  styleGuide: {
    sentenceLength: string;
    paragraphLength: string;
    readingLevel: string;
    punctuation: string;
    formatting: Record<string, string>;
  };
  audienceSegments: Record<
    string,
    {
      tone: string;
      vocabulary: string[];
      messagingFocus: string[];
    }
  >;
}

export const brandVoiceConfig: BrandVoiceConfig = {
  tagline: "Illuminate Your Brand's Potential",
  mission:
    'Empowering businesses to achieve consistent, intelligent, and impactful brand communication through AI-powered automation',
  tone: 'professional, innovative, customer-centric',
  targetEmotions: ['confidence', 'empowerment', 'trust', 'excitement', 'clarity'],
  adjectives: [
    'intelligent',
    'efficient',
    'innovative',
    'reliable',
    'scalable',
    'premium',
    'cutting-edge',
  ],

  idealCustomer: {
    persona:
      'Growth-focused business owner or marketing professional seeking to scale their brand presence efficiently',
    intentions: [
      'automate marketing workflows',
      'maintain consistent brand voice',
      'scale content creation',
      'improve campaign performance',
      'integrate AI into marketing strategy',
    ],
  },

  contentFilters: {
    avoidWords: [
      'cheap',
      'basic',
      'simple',
      'easy',
      'quick fix',
      'magic',
      'overnight success',
      'guaranteed',
      'instant',
      'effortless',
      'amateur',
      'outdated',
      'traditional',
    ],
    enforceToneCheck: true,
    flagOffToneContent: true,
  },

  slogans: [
    'Power Your Brand with Intelligence',
    'Where AI Meets Brand Excellence',
    'Transform. Automate. Dominate.',
    'Your Brand, Amplified by AI',
    'Intelligent Marketing, Exponential Growth',
  ],

  localization: {
    strategy: 'region-specific with cultural adaptation',
    fallbackLanguage: 'en',
    regionToneOverrides: {
      'en-US': 'confident and results-driven',
      'en-GB': 'professional and refined',
      'en-AU': 'friendly and approachable',
      fr: 'sophisticated and elegant',
      de: 'precise and technical',
      es: 'warm and relationship-focused',
      ja: 'respectful and detail-oriented',
      zh: 'harmonious and growth-oriented',
    },
  },

  autoOptimization: {
    enableAdTesting: true,
    pauseUnderperformers: true,
  },

  feedback: {
    reviewExample:
      'NeonHub transformed our marketing approach - our brand voice is now consistent across all channels and our engagement rates have tripled.',
    dreamQuote:
      'Finally, an AI solution that understands our brand as well as we do, but executes it better than we ever could.',
  },

  contentPreferences: {
    types: [
      'landing pages',
      'email campaigns',
      'social media posts',
      'blog articles',
      'ad copy',
      'product descriptions',
      'case studies',
      'whitepapers',
      'video scripts',
      'webinar content',
      'sales presentations',
    ],
    holidayAdaptation: true,
    trendIntegration: true,
  },

  compliance: {
    protectedElements: [
      'brand name',
      'logo usage',
      'visual identity',
      'core messaging',
      'value propositions',
    ],
    approvalProtocol: 'automated scoring with human review for high-stakes content',
    alertTerms: [
      'NSFW',
      'political',
      'controversial',
      'competitors',
      'negative sentiment',
      'off-brand',
      'low quality',
      'misleading',
      'compliance risk',
    ],
  },

  brandDNA: {
    personalityAsHuman:
      'A forward-thinking technology executive who combines deep industry expertise with genuine care for client success - confident, articulate, and always seeking innovative solutions',
    referenceBrands: ['HubSpot', 'Salesforce', 'Shopify', 'Mailchimp', 'Canva'],
    voiceSwitch: {
      b2b: 'authoritative and solution-focused with industry expertise',
      b2c: 'approachable and benefit-driven with clear value communication',
    },
  },

  // Extended NeonHub-specific configurations
  messaging: {
    valueProposition:
      'Transform your marketing with intelligent automation that maintains perfect brand consistency while scaling your content creation and campaign performance.',
    keyMessages: [
      'AI-powered marketing automation that understands your brand',
      'Scale your content without sacrificing quality or consistency',
      'Turn marketing complexity into competitive advantage',
      'Your brand voice, amplified by artificial intelligence',
      'From fragmented campaigns to unified brand experience',
    ],
    uniqueSellingPropositions: [
      'Only AI platform that learns and maintains your specific brand voice',
      'Complete marketing automation suite with built-in brand intelligence',
      'Seamless integration across all marketing channels and platforms',
      'Predictive analytics that optimize campaigns in real-time',
      'White-glove onboarding with dedicated brand voice training',
    ],
  },

  vocabulary: {
    preferred: [
      'innovative',
      'intelligent',
      'optimize',
      'efficiency',
      'solution',
      'strategy',
      'automation',
      'scalable',
      'insights',
      'performance',
      'growth',
      'transformation',
      'streamline',
      'integration',
      'analytics',
      'personalization',
      'engagement',
      'conversion',
      'ROI',
      'data-driven',
      'cutting-edge',
      'breakthrough',
    ],
    prohibited: [
      'cheap',
      'basic',
      'simple',
      'easy',
      'quick fix',
      'magic',
      'hack',
      'secret',
      'trick',
      'guaranteed',
      'instant',
      'effortless',
      'amateur',
      'outdated',
      'old-school',
      'traditional',
      'boring',
      'generic',
    ],
    brandTerms: [
      'NeonHub',
      'AI-powered',
      'intelligent automation',
      'brand intelligence',
      'unified marketing',
      'smart campaigns',
      'predictive optimization',
      'brand consistency engine',
      'marketing amplification',
    ],
    industryTerms: [
      'marketing automation',
      'brand management',
      'content marketing',
      'social media marketing',
      'email marketing',
      'digital advertising',
      'customer journey',
      'lead generation',
      'conversion optimization',
      'marketing analytics',
      'customer acquisition',
      'brand awareness',
      'thought leadership',
      'omnichannel marketing',
    ],
  },

  styleGuide: {
    sentenceLength: 'medium (15-25 words average)',
    paragraphLength: 'short-to-medium (3-5 sentences)',
    readingLevel: 'professional (grade 12-14)',
    punctuation: 'standard with strategic use of em-dashes and colons for emphasis',
    formatting: {
      headlines: 'Title case with power words and clear value',
      subheadings: 'Sentence case with action orientation',
      bulletPoints: 'Parallel structure with strong verbs',
      callToAction: 'Imperative voice with specific benefit',
      testimonials: 'First person with specific results',
    },
  },

  audienceSegments: {
    enterprise: {
      tone: 'authoritative and strategic',
      vocabulary: [
        'enterprise-grade',
        'scalability',
        'ROI',
        'integration',
        'security',
        'compliance',
      ],
      messagingFocus: [
        'cost reduction',
        'efficiency gains',
        'competitive advantage',
        'risk mitigation',
      ],
    },
    smb: {
      tone: 'approachable and growth-focused',
      vocabulary: ['affordable', 'easy-to-use', 'quick setup', 'support', 'results', 'growth'],
      messagingFocus: [
        'time savings',
        'simple implementation',
        'immediate impact',
        'business growth',
      ],
    },
    agencies: {
      tone: 'collaborative and expertise-driven',
      vocabulary: [
        'client results',
        'campaign performance',
        'reporting',
        'white-label',
        'scalability',
      ],
      messagingFocus: [
        'client success',
        'operational efficiency',
        'competitive differentiation',
        'revenue growth',
      ],
    },
    ecommerce: {
      tone: 'results-driven and conversion-focused',
      vocabulary: [
        'sales',
        'conversion',
        'revenue',
        'customer lifetime value',
        'retention',
        'personalization',
      ],
      messagingFocus: [
        'increased sales',
        'customer experience',
        'conversion optimization',
        'market expansion',
      ],
    },
    saas: {
      tone: 'technical and innovation-focused',
      vocabulary: ['integration', 'API', 'automation', 'workflow', 'efficiency', 'user experience'],
      messagingFocus: [
        'product-market fit',
        'user engagement',
        'growth metrics',
        'technical excellence',
      ],
    },
  },
};

export default brandVoiceConfig;
