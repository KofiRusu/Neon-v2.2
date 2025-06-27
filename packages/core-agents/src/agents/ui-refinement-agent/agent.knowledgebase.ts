export const agentKnowledgebase = {
  brandVoice:
    'User-centered and detail-oriented - crafting intuitive experiences that reflect design excellence',

  mission:
    'Create exceptional user experiences that mirror our commitment to quality craftsmanship while making neon design accessible and engaging',

  designSystem: {
    colors: {
      primary: '#FF0080', // Neon Pink - Energy, creativity, CTAs
      secondary: '#00FF88', // Neon Green - Success, innovation
      accent: '#FFD700', // Gold - Premium, quality, highlights
      neutral: '#1A1A1A', // Deep Black - Sophistication
      supporting: {
        electricBlue: '#00D4FF', // Links, interactive elements
        purpleGlow: '#8A2BE2', // Hover states, luxury
        warmWhite: '#FFF8DC', // Backgrounds, readability
        charcoal: '#36454F', // Secondary text, borders
      },
    },

    typography: {
      primary: 'Inter', // Modern, readable, web-optimized
      secondary: 'Poppins', // Friendly, approachable, headings
      accent: 'Neon Glow', // Display font for special applications
      scale: 'Consistent scale from 12px to 48px for hierarchy',
    },

    components: {
      buttons: 'Pill-shaped with gradient fills and glowing hover states',
      forms: 'Rounded corners with focus glow and inline validation',
      cards: 'Subtle elevation with clean layout and visual hierarchy',
      navigation: 'Clean layout with smooth transitions and clear active states',
    },
  },

  userExperienceGuidelines: {
    usabilityPrinciples: [
      'Every element has clear purpose and meaning',
      'Consistent patterns across all interfaces',
      'Immediate feedback for user actions',
      'Inclusive design for all abilities',
      'Minimize cognitive load and steps',
    ],

    userJourney: {
      discovery: 'Visual-first showcase with clear value proposition',
      consideration: 'Educational content with social proof and transparency',
      consultation: 'Streamlined booking with clear expectations',
      collaboration: 'Visual collaboration tools with feedback loops',
      delivery: 'Celebration of completion with ongoing support',
    },

    accessibility: {
      colorContrast: 'WCAG AA compliance with 4.5:1 contrast ratios',
      keyboard: 'Full keyboard accessibility for all functions',
      screenReaders: 'Semantic HTML with proper ARIA labels',
      altText: 'Descriptive alt text for all images',
    },
  },

  interactionDesign: {
    animations: 'Purposeful, delightful, performance-conscious (200-300ms duration)',
    microinteractions: 'Subtle button scaling, smooth form transitions, gentle hover effects',
    transitions: 'Smooth page transitions, fade modals, quick tooltips',
  },

  responsiveDesign: {
    strategy: 'Mobile-first design with progressive enhancement',
    breakpoints: 'Mobile (320-768px), Tablet (769-1024px), Desktop (1025px+)',
    considerations: 'Touch-friendly navigation, readable typography, optimized images',
  },

  performanceOptimization: {
    loading: 'Progressive loading with skeleton screens and lazy loading',
    coreWebVitals: 'LCP under 2.5s, FID under 100ms, CLS under 0.1',
    optimization: 'Code splitting, image optimization, font optimization',
  },

  contentStrategy: {
    voice: 'Expert but approachable, creative but professional',
    hierarchy: 'Benefit-focused headlines, descriptive subheadings, concise body text',
    imagery: 'High-quality, authentic photography showcasing craftsmanship',
  },

  languagePreferences: ['EN'],

  qualityStandards: {
    visual: 'Clear hierarchy using typography, color, and spacing',
    consistency: 'Consistent patterns, components, and interactions',
    accessibility: 'Inclusive design that works for users of all abilities',
    performance: 'Fast, responsive experiences across all devices',
  },
};
