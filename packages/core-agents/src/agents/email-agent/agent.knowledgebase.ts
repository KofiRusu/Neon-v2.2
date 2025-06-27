export const agentKnowledgebase = {
  brandVoice: 'Personal and consultative - like advice from a trusted neon artisan and friend',

  mission:
    'Build lasting relationships through personalized email communications that educate, inspire, and guide customers through their custom neon journey',

  emailStrategy: {
    segmentation: {
      prospects: {
        messaging: 'Educational content to build trust and demonstrate expertise',
        frequency: 'Weekly educational newsletter + targeted campaigns',
        tone: 'Helpful expert sharing valuable insights',
      },

      activeCustomers: {
        messaging: 'Project updates, exclusive previews, maintenance tips, upgrade opportunities',
        frequency: 'Bi-weekly updates + project-specific communications',
        tone: 'Partner in their success, celebrating their vision',
      },

      pastCustomers: {
        messaging:
          'Maintenance reminders, new services, referral opportunities, anniversary celebrations',
        frequency: 'Monthly relationship maintenance + seasonal outreach',
        tone: 'Grateful for partnership, ongoing support available',
      },

      businessOwners: {
        messaging:
          'ROI case studies, business growth tips, industry trends, partnership opportunities',
        frequency: 'Weekly business insights + promotional campaigns',
        tone: 'Business advisor focused on their success',
      },

      eventPlanners: {
        messaging:
          'Seasonal inspiration, new event solutions, planning resources, portfolio updates',
        frequency: 'Bi-weekly inspiration + event season campaigns',
        tone: 'Creative collaborator and reliable partner',
      },

      homeowners: {
        messaging: 'Design inspiration, home décor trends, seasonal ideas, personal stories',
        frequency: 'Weekly lifestyle content + holiday campaigns',
        tone: 'Design friend sharing exciting possibilities',
      },
    },
  },

  products: [
    {
      category: 'Custom Business Signs',
      emailMessaging: {
        subject: 'How [Business Type] owners are attracting 40% more customers',
        preview: "See the transformation that's changing everything...",
        body: 'Professional, ROI-focused storytelling with specific business outcomes',
        cta: 'Get Your Free Business Sign Consultation',
      },
    },
    {
      category: 'Event Signage',
      emailMessaging: {
        subject: "The secret to Instagram-worthy events (it's not what you think)",
        preview: 'One addition that makes everything magical...',
        body: 'Emotional, celebration-focused with visual inspiration',
        cta: 'Design Your Perfect Event Sign',
      },
    },
    {
      category: 'Home Décor',
      emailMessaging: {
        subject: 'Your home is missing this one thing (and your guests notice)',
        preview: 'The finishing touch that changes everything...',
        body: 'Personal, lifestyle-oriented with mood and ambiance focus',
        cta: 'Create Your Custom Home Neon',
      },
    },
  ],

  contentTypes: {
    newsletter: {
      structure:
        'Personal greeting → Featured project/story → Educational tip → Community highlight → Clear CTA',
      tone: 'Conversational and informative, like updates from a talented friend',
      frequency: 'Weekly',
      topics: [
        'Featured customer transformations',
        'Design tips',
        'Behind-the-scenes stories',
        'Seasonal inspiration',
      ],
    },

    educational: {
      structure:
        'Problem identification → Expert explanation → Practical solution → Implementation support',
      tone: 'Expert but approachable, focused on empowering the reader',
      series: [
        'LED vs Traditional Neon Guide',
        'Maintenance Made Simple',
        'Design Psychology in Lighting',
      ],
      topics: [
        'Technical education',
        'Design principles',
        'Installation guides',
        'Care instructions',
      ],
    },

    promotional: {
      structure:
        'Compelling hook → Value demonstration → Social proof → Urgency/scarcity → Strong CTA',
      tone: 'Exciting but not pushy, focused on opportunity and value',
      timing: 'Seasonal campaigns, new service launches, limited-time offers',
      balance: '80% value, 20% promotion',
    },

    nurture: {
      structure:
        'Personal connection → Valuable insight → Relevant example → Soft invitation to engage',
      tone: 'Supportive and encouraging, building confidence in their vision',
      journey: [
        'Vision development',
        'Design exploration',
        'Technical understanding',
        'Decision support',
      ],
      goals: 'Move prospects closer to consultation booking',
    },

    retention: {
      structure: 'Appreciation → Exclusive value → Community connection → Future opportunities',
      tone: 'Grateful and supportive, maintaining the relationship',
      content: [
        'Maintenance tips',
        'Upgrade options',
        'Referral opportunities',
        'Anniversary recognition',
      ],
      timing: 'Regular touchpoints throughout customer lifecycle',
    },
  },

  messagingFramework: {
    opening: {
      personal: 'Hi [Name], I hope your [previous project/business/event] is bringing you joy!',
      educational: 'I get asked this question all the time: [common customer question]',
      story: 'Yesterday, I met with a [customer type] who told me the most amazing story...',
      seasonal: "As [season] approaches, I'm seeing more [customer type] interested in...",
    },

    value: {
      education: "Here's what most people don't know about [topic]...",
      inspiration: 'Imagine walking into [space] and seeing [transformation]...',
      social: 'Just last week, [customer] told me their [outcome/result]...',
      technical: 'The difference between [old way] and [new way] is...',
    },

    credibility: {
      experience: 'In our [X] years of crafting custom neon...',
      results: '[Specific metric] of our customers report [positive outcome]',
      process: 'Our [unique process/approach] ensures [customer benefit]',
      guarantee: "We're so confident in [aspect] that we [specific promise]",
    },

    cta: {
      consultation:
        "Ready to see how custom neon can transform your [space/business/event]? Let's chat!",
      educational: "Want to learn more? I've put together a comprehensive guide...",
      social: "I'd love to hear about your [project/vision/space] - just reply and tell me!",
      urgency: 'This [offer/opportunity] is only available until [date]...',
    },
  },

  automationSequences: {
    welcome: {
      trigger: 'Newsletter signup',
      sequence: [
        'Day 0: Welcome + Brand story + Free design guide',
        'Day 3: Customer transformation story + Process overview',
        'Day 7: LED vs Traditional education + Consultation offer',
        'Day 14: Local business spotlight + Community invitation',
        'Day 21: Seasonal inspiration + Project planning tips',
      ],
      tone: 'Welcoming expert sharing valuable insights',
    },

    consultation: {
      trigger: 'Consultation form completion',
      sequence: [
        'Immediate: Confirmation + What to expect + Preparation tips',
        'Day 1: Inspiration gallery + Relevant case studies',
        'Day 3: Technical guide + Process overview',
        'Day 7: Pricing guide + Investment perspective',
      ],
      tone: 'Professional preparation and excitement building',
    },

    postProject: {
      trigger: 'Project completion',
      sequence: [
        'Day 0: Celebration + Care instructions + Photo request',
        'Day 7: Follow-up + Satisfaction check + Referral ask',
        'Day 30: Maintenance reminder + Additional services',
        'Day 90: Quarterly check-in + Upgrade opportunities',
        'Day 365: Anniversary celebration + Loyalty program',
      ],
      tone: 'Proud partnership and ongoing support',
    },
  },

  designGuidelines: {
    template: 'Clean, modern design that lets content shine',
    colors: 'Brand colors as accents, primarily clean white/gray with neon highlights',
    images: 'High-quality project photos, behind-the-scenes shots, customer testimonials',
    mobile: 'Mobile-first design with clear CTAs and readable fonts',
    accessibility: 'Alt text for images, clear heading structure, sufficient color contrast',
  },

  personalization: {
    basic: 'Name, location, customer segment, previous project type',
    behavioral: 'Email engagement, website behavior, consultation status',
    contextual: 'Season, local events, business type, project timeline',
    dynamic: 'Recent project photos, relevant case studies, personalized recommendations',
  },

  seasonalCampaigns: {
    high: {
      months: ['November', 'December', 'January', 'May', 'June'],
      themes: ['Holiday business preparation', 'Wedding season planning', 'Grand opening support'],
      frequency: '2x per week',
      urgency: 'Rush services available, premium positioning',
    },
    medium: {
      months: ['March', 'April', 'July', 'August', 'September'],
      themes: ['Spring renovation', 'Summer events', 'Back-to-school business prep'],
      frequency: 'Weekly',
      focus: 'Educational content with promotional elements',
    },
    low: {
      months: ['February', 'October'],
      themes: ['Maintenance focus', 'Planning ahead', 'Relationship building'],
      frequency: 'Bi-weekly',
      content: 'Value-added services and education',
    },
  },

  languagePreferences: ['EN'],

  complianceRequirements: {
    canSpam: 'Clear unsubscribe, sender identification, truthful subject lines',
    gdpr: 'Explicit consent, data processing transparency, easy opt-out',
    accessibility: 'Screen reader compatible, clear navigation, alt text',
    brandConsistency: 'Maintain voice across all communications, template adherence',
  },

  performanceMetrics: {
    engagement: 'Target 25% open rate, 5% click rate',
    conversion: 'Track consultation bookings, quote requests from email',
    retention: 'Monitor list growth, unsubscribe rates, engagement over time',
    revenue: 'Attribution to email campaigns, customer lifetime value impact',
  },
};
