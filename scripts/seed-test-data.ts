// Test Data Seeding Script for QA Testing
// Run with: npx tsx scripts/seed-test-data.ts

export interface TestCampaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'seo' | 'ppc';
  status: 'active' | 'paused' | 'draft' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  createdAt: string;
  updatedAt: string;
}

export interface TestUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'marketer' | 'user' | 'viewer';
  lastLogin: string;
  campaignsCreated: number;
  permissions: string[];
}

export interface TestAgent {
  id: string;
  name: string;
  type: 'content' | 'seo' | 'social' | 'email' | 'analytics';
  status: 'active' | 'inactive' | 'error' | 'training';
  tasksCompleted: number;
  accuracy: number;
  lastActive: string;
}

export interface TestAnalytics {
  totalRevenue: number;
  totalCampaigns: number;
  activeUsers: number;
  conversionRate: number;
  avgCTR: number;
  avgCPC: number;
  monthlyGrowth: number;
  topPerformingCampaign: string;
}

export const seedTestData = () => {
  // Generate test campaigns
  const testCampaigns: TestCampaign[] = [
    {
      id: 'camp_001',
      name: 'Summer Email Blast 2024',
      type: 'email',
      status: 'active',
      budget: 5000,
      spent: 2340,
      impressions: 145000,
      clicks: 3450,
      conversions: 234,
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-07-02T14:30:00Z'
    },
    {
      id: 'camp_002',
      name: 'Instagram Engagement Drive',
      type: 'social',
      status: 'active',
      budget: 3000,
      spent: 1875,
      impressions: 89000,
      clicks: 2100,
      conversions: 156,
      createdAt: '2024-06-20T09:15:00Z',
      updatedAt: '2024-07-02T11:45:00Z'
    },
    {
      id: 'camp_003',
      name: 'SEO Content Strategy Q3',
      type: 'seo',
      status: 'paused',
      budget: 8000,
      spent: 4200,
      impressions: 234000,
      clicks: 5600,
      conversions: 445,
      createdAt: '2024-05-01T08:00:00Z',
      updatedAt: '2024-06-30T16:20:00Z'
    },
    {
      id: 'camp_004',
      name: 'Google Ads - Product Launch',
      type: 'ppc',
      status: 'draft',
      budget: 12000,
      spent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      createdAt: '2024-07-01T12:00:00Z',
      updatedAt: '2024-07-02T09:30:00Z'
    },
    {
      id: 'camp_005',
      name: 'Holiday Season Email Series',
      type: 'email',
      status: 'completed',
      budget: 4500,
      spent: 4500,
      impressions: 198000,
      clicks: 4750,
      conversions: 567,
      createdAt: '2024-11-01T10:00:00Z',
      updatedAt: '2024-12-31T23:59:00Z'
    }
  ];

  // Generate test users
  const testUsers: TestUser[] = [
    {
      id: 'user_001',
      name: 'Sarah Marketing Manager',
      email: 'sarah.manager@neonhub.test',
      role: 'marketer',
      lastLogin: '2024-07-02T14:30:00Z',
      campaignsCreated: 12,
      permissions: ['campaigns', 'analytics', 'content', 'social_media']
    },
    {
      id: 'user_002',
      name: 'Admin Test User',
      email: 'admin@neonhub.test',
      role: 'admin',
      lastLogin: '2024-07-02T15:45:00Z',
      campaignsCreated: 5,
      permissions: ['all_access', 'user_management', 'billing', 'system_settings']
    },
    {
      id: 'user_003',
      name: 'John Campaign Creator',
      email: 'john.creator@neonhub.test',
      role: 'user',
      lastLogin: '2024-07-01T09:20:00Z',
      campaignsCreated: 8,
      permissions: ['campaigns', 'basic_analytics']
    },
    {
      id: 'user_004',
      name: 'Lisa Analytics Viewer',
      email: 'lisa.viewer@neonhub.test',
      role: 'viewer',
      lastLogin: '2024-07-02T11:15:00Z',
      campaignsCreated: 0,
      permissions: ['view_analytics', 'view_campaigns']
    }
  ];

  // Generate test AI agents
  const testAgents: TestAgent[] = [
    {
      id: 'agent_001',
      name: 'Content Creator Pro',
      type: 'content',
      status: 'active',
      tasksCompleted: 234,
      accuracy: 94.5,
      lastActive: '2024-07-02T15:30:00Z'
    },
    {
      id: 'agent_002',
      name: 'SEO Optimizer',
      type: 'seo',
      status: 'active',
      tasksCompleted: 156,
      accuracy: 87.2,
      lastActive: '2024-07-02T14:45:00Z'
    },
    {
      id: 'agent_003',
      name: 'Social Media Assistant',
      type: 'social',
      status: 'inactive',
      tasksCompleted: 89,
      accuracy: 91.8,
      lastActive: '2024-07-01T18:20:00Z'
    },
    {
      id: 'agent_004',
      name: 'Email Campaign Bot',
      type: 'email',
      status: 'error',
      tasksCompleted: 45,
      accuracy: 76.3,
      lastActive: '2024-07-02T10:15:00Z'
    },
    {
      id: 'agent_005',
      name: 'Analytics Processor',
      type: 'analytics',
      status: 'training',
      tasksCompleted: 12,
      accuracy: 88.9,
      lastActive: '2024-07-02T13:30:00Z'
    }
  ];

  // Generate test analytics
  const testAnalytics: TestAnalytics = {
    totalRevenue: 234567.89,
    totalCampaigns: 23,
    activeUsers: 8,
    conversionRate: 3.45,
    avgCTR: 2.8,
    avgCPC: 1.23,
    monthlyGrowth: 12.4,
    topPerformingCampaign: 'Summer Email Blast 2024'
  };

  // Seed data object
  const seedData = {
    campaigns: testCampaigns,
    users: testUsers,
    agents: testAgents,
    analytics: testAnalytics,
    metadata: {
      seededAt: new Date().toISOString(),
      version: '1.0.0',
      environment: 'staging'
    }
  };

  // Store in localStorage for frontend access
  if (typeof window !== 'undefined') {
    localStorage.setItem('qa_test_data', JSON.stringify(seedData));
    console.log('✅ Test data seeded successfully!');
    console.log('📊 Campaigns:', testCampaigns.length);
    console.log('👥 Users:', testUsers.length);
    console.log('🤖 AI Agents:', testAgents.length);
    console.log('📈 Analytics ready');
  }

  return seedData;
};

// Auto-seed if running in browser and staging environment
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging') {
  // Only seed if no existing test data
  const existingData = localStorage.getItem('qa_test_data');
  if (!existingData) {
    console.log('🌱 Auto-seeding test data for staging environment...');
    seedTestData();
  }
}

export default seedTestData; 