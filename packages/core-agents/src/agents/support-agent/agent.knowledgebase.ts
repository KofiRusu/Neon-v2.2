export const agentKnowledgebase = {
  brandVoice:
    'Helpful and patient - combining technical expertise with genuine care for customer success',

  mission:
    'Deliver exceptional customer support that reflects our commitment to quality craftsmanship and customer satisfaction throughout the entire ownership experience',

  servicePhilosophy: {
    core: 'Every customer interaction is an opportunity to exceed expectations',
    principles: [
      'Listen first, solve second',
      'Technical expertise delivered with patience',
      'Proactive support prevents problems',
      'Every issue is a chance to strengthen relationships',
    ],
    approach: 'Consultative support that educates customers while solving immediate needs',
  },

  communicationGuidelines: {
    tone: {
      initial: 'Warm and professional greeting, acknowledgment of their concern',
      diagnostic: 'Patient questioning to understand the full context',
      explanatory: 'Clear, jargon-free explanations with visual aids when helpful',
      resolution: 'Confident solution delivery with follow-up assurance',
    },

    language: {
      preferred: [
        'I understand',
        'Let me help you with that',
        "Here's what I recommend",
        "I'll make sure this is resolved",
      ],
      avoided: ["That's not our fault", 'You should have', "It's obvious", "That's impossible"],
      technical: 'Explain technical concepts in accessible terms with analogies when helpful',
    },

    empathy: {
      acknowledgment: 'Recognize the impact of issues on their business or event',
      validation: 'Confirm their concerns are legitimate and important',
      partnership: 'Position ourselves as partners in their success',
      followthrough: 'Ensure resolution meets their expectations',
    },
  },

  products: [
    {
      category: 'Custom Business Signs',
      supportFocus: {
        commonIssues: [
          'Installation questions',
          'Permit assistance',
          'Maintenance scheduling',
          'Performance optimization',
        ],
        businessImpact:
          'Understand that signage issues can affect customer acquisition and brand perception',
        solutions: 'Prioritize quick resolution with minimal business disruption',
        followup: 'Check business impact and offer additional optimization',
      },
    },
    {
      category: 'Event Signage',
      supportFocus: {
        commonIssues: [
          'Setup assistance',
          'Last-minute changes',
          'Transportation concerns',
          'Event timeline coordination',
        ],
        timeConstraints: 'Events have fixed deadlines requiring urgent response',
        solutions:
          'Flexible support including weekend and evening availability during event seasons',
        followup: 'Post-event satisfaction check and photo sharing encouragement',
      },
    },
    {
      category: 'Home Décor',
      supportFocus: {
        commonIssues: [
          'Installation guidance',
          'Smart controls setup',
          'Design modifications',
          'Integration with home systems',
        ],
        personalNature: 'Home installations are personal expressions requiring thoughtful guidance',
        solutions: 'Patient education and step-by-step guidance for DIY elements',
        followup: 'Satisfaction check and maintenance reminders',
      },
    },
  ],

  supportChannels: {
    phone: {
      priority: 'High - immediate technical issues, installation emergencies',
      approach: 'Direct conversation for complex troubleshooting',
      hours: 'Business hours with emergency callback for urgent issues',
      skills: 'Technical expertise with clear verbal communication',
    },

    email: {
      priority: 'Medium - detailed questions, documentation sharing, follow-up',
      approach: 'Comprehensive responses with visual aids and documentation',
      response: '24-hour response commitment during business days',
      skills: 'Written communication with technical documentation ability',
    },

    chat: {
      priority: 'Medium - quick questions, scheduling, general information',
      approach: 'Immediate response for simple queries, escalation path for complex issues',
      availability: 'Business hours with automated after-hours information',
      skills: 'Rapid assessment and appropriate channel routing',
    },

    whatsapp: {
      priority: 'Medium - visual troubleshooting, installation guidance',
      approach: 'Photo/video sharing for visual problem diagnosis',
      response: 'Same-day response with visual guidance when appropriate',
      skills: 'Visual communication and multimedia support guidance',
    },
  },

  troubleshootingFramework: {
    assessment: {
      questions: [
        'When did the issue first occur?',
        'What were you trying to accomplish?',
        'Have there been any recent changes to the installation?',
        "Can you describe exactly what's happening?",
      ],
      information: 'Gather installation details, environmental factors, usage patterns',
    },

    diagnosis: {
      systematic: 'Work through potential causes from most to least likely',
      documentation: 'Reference installation notes and product specifications',
      testing: 'Guide customer through safe diagnostic steps',
      escalation: 'Know when to involve technical specialists or field service',
    },

    resolution: {
      options: 'Present multiple solutions when available, explaining pros and cons',
      implementation: 'Step-by-step guidance with confirmation at each stage',
      verification: 'Ensure the solution fully addresses the original concern',
      documentation: 'Record resolution for future reference and team learning',
    },
  },

  commonScenarios: {
    installation: {
      issues: [
        'Mounting questions',
        'Electrical connections',
        'Permit requirements',
        'Weather protection',
      ],
      approach: 'Safety first, then step-by-step guidance with visual confirmation',
      resources: 'Installation guides, video tutorials, contractor referrals when needed',
      followup: 'Post-installation check and performance verification',
    },

    technical: {
      issues: ['LED performance', 'Control systems', 'Smart features', 'Dimming problems'],
      approach: 'Systematic diagnosis with customer-guided testing',
      resources: 'Technical manuals, diagnostic tools, replacement part availability',
      followup: 'Performance monitoring and optimization recommendations',
    },

    maintenance: {
      issues: [
        'Cleaning procedures',
        'Performance decline',
        'Component replacement',
        'Preventive care',
      ],
      approach: 'Educational guidance emphasizing proper care techniques',
      resources: 'Maintenance schedules, approved cleaning products, service provider network',
      followup: 'Maintenance reminders and performance tracking',
    },

    warranty: {
      issues: [
        'Claim procedures',
        'Coverage questions',
        'Replacement coordination',
        'Service scheduling',
      ],
      approach: 'Clear explanation of coverage with efficient claim processing',
      resources: 'Warranty documentation, service network, replacement parts inventory',
      followup: 'Satisfaction with warranty service and prevention of future issues',
    },
  },

  escalationProtocols: {
    technical: {
      trigger: 'Issues requiring specialized expertise or on-site evaluation',
      process: 'Gather all diagnostic information, brief specialist, coordinate customer contact',
      timeline: 'Same-day specialist contact for urgent issues, next business day for routine',
    },

    warranty: {
      trigger: 'Claims requiring management approval or complex coverage determinations',
      process: 'Document issue thoroughly, present to warranty manager with recommendation',
      timeline: '24-hour decision on coverage, immediate communication to customer',
    },

    satisfaction: {
      trigger: 'Customer dissatisfaction with resolution or service experience',
      process: 'Immediate manager notification, expedited resolution process',
      timeline: 'Manager contact within 2 hours, resolution plan within 24 hours',
    },
  },

  knowledgeResources: {
    technical: {
      productSpecifications: 'Detailed specs for all current and historical products',
      installationGuides: 'Step-by-step instructions with photos and diagrams',
      troubleshootingFlowcharts: 'Systematic diagnostic processes for common issues',
      partsCatalog: 'Replacement parts availability and compatibility information',
    },

    procedural: {
      warrantyPolicies: 'Coverage details, claim procedures, and service standards',
      escalationGuides: 'When and how to involve specialists and management',
      communicationTemplates: 'Proven language for sensitive situations',
      followupSchedules: 'Systematic approach to post-resolution customer care',
    },

    external: {
      contractorNetwork: 'Qualified installers and service providers by region',
      regulatoryInformation: 'Local codes, permit requirements, and compliance guidance',
      industryResources: 'Technical standards and best practices information',
      trainingMaterials: 'Ongoing education for product updates and service improvements',
    },
  },

  performanceMetrics: {
    response: {
      phone: 'Answer within 3 rings during business hours',
      email: 'Initial response within 4 hours, resolution within 24 hours',
      chat: 'Immediate acknowledgment, resolution or escalation within 15 minutes',
    },

    quality: {
      resolution: '95% first-contact resolution for routine issues',
      satisfaction: 'Customer satisfaction score above 4.5/5.0',
      accuracy: 'Technical solution accuracy verified through follow-up',
    },

    relationship: {
      retention: 'Support experience contributes to customer retention and referrals',
      upsell: 'Natural opportunities for maintenance services and upgrades',
      advocacy: 'Transform satisfied customers into brand advocates',
    },
  },

  seasonalConsiderations: {
    high: {
      months: ['November', 'December', 'January', 'May', 'June'],
      focus: 'Extended hours, priority response for event and holiday installations',
      staffing: 'Additional support coverage for increased volume',
      preparation: 'Pre-season system checks and preventive maintenance outreach',
    },
    medium: {
      months: ['March', 'April', 'July', 'August', 'September'],
      focus: 'Routine support with emphasis on maintenance and optimization',
      training: 'Team development and knowledge base expansion',
      improvement: 'Process refinement and customer feedback integration',
    },
    low: {
      months: ['February', 'October'],
      focus: 'Deep support for complex issues and relationship building',
      projects: 'System improvements, training updates, and process documentation',
      outreach: 'Proactive customer check-ins and satisfaction surveys',
    },
  },

  languagePreferences: ['EN'],

  continuousImprovement: {
    feedback: 'Regular collection and analysis of customer feedback',
    training: 'Ongoing technical training and soft skills development',
    documentation: 'Continuous update of knowledge base and procedures',
    innovation: 'Explore new support tools and communication methods',
  },
};
