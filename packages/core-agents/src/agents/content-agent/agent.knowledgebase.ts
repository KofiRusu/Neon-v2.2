export const agentKnowledgebase = {
  brandVoice:
    'Creative, Professional, Energetic - with emphasis on storytelling and educational value',

  mission:
    'Create compelling, educational, and engaging content that showcases our neon signage expertise while inspiring customers to transform their spaces',

  contentStrategy: {
    primaryThemes: [
      'Behind-the-scenes craftsmanship',
      'Customer success stories',
      'Design inspiration and trends',
      'Technical education (LED vs traditional)',
      'Local business spotlights',
      'Event transformations',
    ],

    contentPillars: {
      education: {
        weight: 30,
        topics: [
          'LED technology benefits',
          'Installation guides',
          'Maintenance tips',
          'Design principles',
        ],
        tone: 'Expert but accessible, helpful and informative',
      },
      inspiration: {
        weight: 25,
        topics: [
          'Design trends',
          'Color psychology',
          'Space transformation',
          'Creative applications',
        ],
        tone: 'Enthusiastic, creative, aspirational',
      },
      craftsmanship: {
        weight: 25,
        topics: [
          'Manufacturing process',
          'Quality standards',
          'Artist profiles',
          'Technique spotlights',
        ],
        tone: 'Pride in work, attention to detail, authentic',
      },
      community: {
        weight: 20,
        topics: ['Customer spotlights', 'Local partnerships', 'Event coverage', 'Success stories'],
        tone: 'Celebratory, community-focused, supportive',
      },
    },
  },

  products: [
    {
      category: 'Custom Business Signs',
      contentFocus:
        'ROI stories, visibility improvement, professional appearance, customer acquisition impact',
      keyMessaging: 'Transform your business presence with signs that work as hard as you do',
    },
    {
      category: 'Event Signage',
      contentFocus:
        'Memorable moments, photo opportunities, personal celebrations, unique experiences',
      keyMessaging: 'Create unforgettable experiences that guests will remember and share',
    },
    {
      category: 'Home Décor',
      contentFocus: 'Personal expression, lifestyle enhancement, mood lighting, creative spaces',
      keyMessaging: 'Illuminate your personality and create spaces that truly reflect who you are',
    },
  ],

  contentTypes: {
    blog: {
      topics: ['Industry trends', 'Installation guides', 'Design inspiration', 'Case studies'],
      tone: 'Educational and authoritative with creative flair',
      length: '1200-2000 words for comprehensive coverage',
      structure: 'Hook, educational content, practical application, call-to-action',
    },

    social: {
      topics: ['Process videos', 'Before/after photos', 'Customer testimonials', 'Design tips'],
      tone: 'Energetic and visual-first with storytelling elements',
      platforms: {
        instagram: 'Visual storytelling, behind-the-scenes, transformation reveals',
        facebook: 'Community building, local business features, educational content',
        tiktok: 'Quick tips, trending sounds with neon content, time-lapse creation',
        linkedin: 'B2B focused, industry insights, business transformation stories',
      },
    },

    email: {
      topics: [
        'New product announcements',
        'Seasonal promotions',
        'Design contests',
        'Maintenance tips',
      ],
      tone: 'Personal and consultative, like advice from a trusted expert',
      segments: {
        prospects: 'Educational content to build trust and demonstrate expertise',
        customers: 'Exclusive insights, maintenance tips, upgrade opportunities',
        partners: 'Industry updates, collaboration opportunities, referral programs',
      },
    },

    video: {
      topics: [
        'Time-lapse creation',
        'Installation process',
        'Customer interviews',
        'Design tutorials',
      ],
      tone: 'Dynamic and engaging, showcasing the artistry and technical skill',
      formats: [
        'Process documentation',
        'Educational tutorials',
        'Customer testimonials',
        'Design showcases',
      ],
    },
  },

  messagingFramework: {
    problemAware:
      'Many businesses struggle with generic signage that fails to capture attention or reflect their unique brand',
    solutionIntro:
      'Custom neon signage offers unlimited creative possibilities with modern LED efficiency',
    valueProposition:
      'Professional craftsmanship meets innovative technology to create signs that work as marketing investments',
    credibilityIndicators: [
      '48-hour rush capability',
      'Lifetime LED warranty',
      'Local manufacturing',
      'Free design consultation',
    ],
    callToActionTemplates: [
      'Get your free design consultation',
      'See how we can transform your space',
      'Discover your custom solution',
    ],
  },

  editorialGuidelines: {
    headlines:
      "Benefit-focused with creative flair (e.g., 'How Custom Neon Transformed This Restaurant's Evening Revenue')",
    openings: 'Start with a relatable problem or inspiring transformation story',
    structure: 'Problem → Solution → Process → Results → Next Steps',
    evidence: 'Include specific metrics, timelines, and customer quotes when possible',
    closure: 'End with clear next steps and invitation for consultation',
  },

  seasonalContent: {
    high: {
      months: ['November', 'December', 'January', 'May', 'June'],
      content: 'Holiday decoration ideas, wedding season inspiration, grand opening spotlights',
      messaging: 'Premium positioning, extended capabilities, seasonal applications',
    },
    medium: {
      months: ['March', 'April', 'July', 'August', 'September'],
      content: 'Design trends, renovation inspiration, back-to-school business prep',
      messaging: 'Educational focus, trend reporting, practical applications',
    },
    low: {
      months: ['February', 'October'],
      content: 'Maintenance guides, behind-the-scenes content, planning resources',
      messaging: 'Value-add services, education, relationship building',
    },
  },

  languagePreferences: ['EN'],

  qualityStandards: {
    accuracy: 'All technical information must be verified and current',
    authenticity: 'Content should reflect genuine expertise and real customer experiences',
    accessibility: 'Language should be clear and jargon-free unless explained',
    engagement: 'Every piece should provide value and encourage interaction',
    brandAlignment: 'All content must reinforce our creative, professional, energetic brand voice',
  },
};
