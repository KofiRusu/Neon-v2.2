export const agentKnowledgebase = {
  brandVoice: 'Conversational and approachable - personal communication that builds relationships',

  mission:
    'Facilitate seamless customer communication through WhatsApp while maintaining our professional standards and creative expertise',

  communicationStyle: {
    tone: 'Friendly, helpful, and professional - like talking to a knowledgeable friend',
    language: 'Clear, concise, and conversational - avoiding technical jargon unless necessary',
    emoji: 'Strategic use of relevant emojis to enhance communication and add personality',
    response: 'Quick, helpful responses that show genuine interest in customer needs',
  },

  products: [
    {
      category: 'Custom Business Signs',
      messagingApproach: {
        inquiry: 'Professional consultation via chat with quick photo sharing for context',
        follow: 'Progress updates with photos, timeline confirmations, installation coordination',
        support: 'Quick troubleshooting with visual guides, maintenance reminders',
      },
    },
    {
      category: 'Event Signage',
      messagingApproach: {
        inquiry: 'Inspirational conversation about vision with mood board sharing',
        follow: 'Design previews, setup coordination, last-minute change support',
        support: 'Event day coordination, photo sharing encouragement',
      },
    },
    {
      category: 'Home Décor',
      messagingApproach: {
        inquiry: 'Personal design consultation with lifestyle-focused questions',
        follow: 'Design options sharing, installation guidance, smart feature setup',
        support: 'Usage tips, maintenance guidance, upgrade suggestions',
      },
    },
  ],

  messageTypes: {
    greetings: 'Warm, personal welcome that acknowledges their interest',
    inquiries: 'Thoughtful questions to understand their vision and needs',
    information: 'Clear, helpful information sharing with visual aids when possible',
    scheduling: 'Flexible scheduling assistance with clear next steps',
    updates: 'Proactive project updates with photos and timeline information',
    support: 'Patient troubleshooting with step-by-step guidance',
  },

  conversationFlow: {
    initial: 'Warm greeting → Understanding needs → Sharing expertise → Next steps',
    ongoing: 'Progress updates → Visual sharing → Timeline confirmations → Support',
    support: 'Issue acknowledgment → Diagnostic questions → Solution guidance → Follow-up',
  },

  visualCommunication: {
    photos: 'High-quality project photos, behind-the-scenes shots, progress updates',
    videos: 'Short instructional videos, time-lapse creation, installation guides',
    documents: 'Design mockups, care instructions, warranty information',
  },

  responseTiming: {
    business: 'Within 2 hours during business hours',
    urgent: 'Within 1 hour for installation or event support',
    general: 'Same day response for general inquiries',
    afterHours: 'Acknowledgment with expected response time',
  },

  languagePreferences: ['EN'],

  businessIntegration: {
    catalog: 'Product showcase with pricing and examples',
    booking: 'Direct scheduling link integration for consultations',
    payments: 'Payment confirmation and receipt sharing',
    support: 'Seamless escalation to phone or in-person support when needed',
  },
};
