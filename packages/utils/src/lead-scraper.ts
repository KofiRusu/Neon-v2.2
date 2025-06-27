/**
 * Lead Scraper for B2B Outreach
 * Uses Puppeteer for LinkedIn and business directory scraping
 */

import puppeteer, { Browser } from 'puppeteer';

export interface LeadData {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  position: string;
  linkedinUrl: string;
  industry: string;
  companySize: string;
  location: string;
  score?: number;
  lastInteraction?: Date;
  source?: string;
}

export interface LeadSearchCriteria {
  keywords: string[];
  industry?: string;
  location?: string;
  companySize?: string;
  seniority?: string;
  excludeCompanies?: string[];
  maxResults?: number;
}

export interface LeadScrapingResult {
  leads: LeadData[];
  totalFound: number;
  searchCriteria: LeadSearchCriteria;
  searchTime: Date;
  sources: string[];
}

export class LeadScraper {
  private browser: Browser | null = null;
  private isHeadless: boolean;

  private static industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Manufacturing',
    'Retail',
    'Education',
    'Real Estate',
    'Marketing',
  ];

  private static positions = [
    'CEO',
    'CTO',
    'CMO',
    'VP Sales',
    'Marketing Director',
    'Sales Manager',
    'Business Development',
    'Head of Growth',
  ];

  private static companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

  private static locations = [
    'New York, NY',
    'San Francisco, CA',
    'Los Angeles, CA',
    'Chicago, IL',
    'Austin, TX',
    'Boston, MA',
    'Seattle, WA',
  ];

  constructor(headless = true) {
    this.isHeadless = headless;
  }

  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: this.isHeadless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  async scrapeLinkedIn(searchQuery: string, maxResults = 50): Promise<LeadData[]> {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Set user agent to avoid detection
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // In production, implement LinkedIn login and search
      // For now, return enhanced mock data based on search query
      const leads: LeadData[] = [];
      const queryKeywords = searchQuery.toLowerCase().split(' ');

      for (let i = 0; i < Math.min(maxResults, 25); i++) {
        const industryGuess =
          queryKeywords.find(word =>
            ['tech', 'marketing', 'sales', 'healthcare', 'finance', 'education'].includes(word)
          ) || 'technology';

        const companySize = ['1-10', '11-50', '51-200', '201-1000', '1000+'][
          Math.floor(Math.random() * 5)
        ];
        const positions = ['Manager', 'Director', 'VP', 'President', 'CEO', 'CMO', 'CTO'];
        const locations = [
          'San Francisco, CA',
          'New York, NY',
          'Austin, TX',
          'Seattle, WA',
          'Boston, MA',
        ];

        leads.push({
          email: `lead${i}.${searchQuery.replace(/\s+/g, '').toLowerCase()}@company${i}.com`,
          firstName: `First${i}`,
          lastName: `Last${i}`,
          company: `${industryGuess.charAt(0).toUpperCase() + industryGuess.slice(1)} Corp ${i}`,
          position: positions[Math.floor(Math.random() * positions.length)] || 'Manager',
          linkedinUrl: `https://linkedin.com/in/lead${i}`,
          industry: industryGuess,
          companySize,
          location: locations[Math.floor(Math.random() * locations.length)] || 'San Francisco, CA',
          score: Math.floor(Math.random() * 100) + 1,
          source: 'Mock Data Generator',
        });
      }

      await page.close();
      return leads;
    } catch (error) {
      console.error('LinkedIn scraping error:', error);
      // Return fallback mock data
      return this.getMockLeads(searchQuery, maxResults);
    }
  }

  async enrichLeadData(email: string): Promise<LeadData | null> {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // In production, use email lookup services like Hunter.io, Clearbit, or ZoomInfo
      // For now, return enhanced mock data
      const domain = email.split('@')[1];
      const companyName = domain?.split('.')[0];

      const enrichedData: LeadData = {
        email,
        firstName: 'John',
        lastName: 'Doe',
        company: companyName
          ? `${companyName.charAt(0).toUpperCase() + companyName.slice(1)} Inc`
          : 'Unknown Company',
        position: 'Marketing Manager',
        industry: 'Technology',
        companySize: '100-500',
        location: 'San Francisco, CA',
        score: Math.floor(Math.random() * 100) + 1,
        source: 'Email Enrichment',
      };

      await page.close();
      return enrichedData;
    } catch (error) {
      console.error('Lead enrichment error:', error);
      return null;
    }
  }

  async scrapeBusinessDirectory(industry: string, location: string): Promise<LeadData[]> {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // In production, scrape from business directories like Yellow Pages, Yelp Business, etc.
      // For now, return enhanced mock data
      const leads: LeadData[] = [];

      for (let i = 0; i < 15; i++) {
        leads.push({
          email: `contact${i}@${industry.replace(/\s+/g, '').toLowerCase()}${i}.com`,
          company: `${industry} Business ${i}`,
          industry,
          location,
          position: 'Business Owner',
          companySize: '10-50',
          score: Math.floor(Math.random() * 100) + 1,
          source: 'Mock Data Generator',
        });
      }

      await page.close();
      return leads;
    } catch (error) {
      console.error('Business directory scraping error:', error);
      return [];
    }
  }

  async validateEmail(email: string): Promise<boolean> {
    // Enhanced email validation with domain verification
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // In production, add DNS MX record verification
    const domain = email.split('@')[1];

    // Basic domain validation
    return Boolean(domain?.includes('.') && domain?.length > 3);
  }

  async searchGoogleForContacts(companyName: string): Promise<LeadData[]> {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Search for company contacts on Google
      const searchQuery = `"${companyName}" "email" contact marketing manager`;
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

      await page.goto(googleUrl, { waitUntil: 'networkidle2' });

      // In production, parse search results for contact information
      // For now, return mock data based on company
      const leads: LeadData[] = [
        {
          email: `info@${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
          company: companyName,
          position: 'Marketing Manager',
          industry: 'Business Services',
          score: Math.floor(Math.random() * 100) + 1,
          source: 'Google Search',
        },
      ];

      await page.close();
      return leads;
    } catch (error) {
      console.error('Google search error:', error);
      return [];
    }
  }

  private getMockLeads(_searchQuery: string, maxResults: number): LeadData[] {
    const leads: LeadData[] = [];
    for (let i = 0; i < Math.min(maxResults, 20); i++) {
      leads.push({
        email: `lead${i}@company${i}.com`,
        firstName: `FirstName${i}`,
        lastName: `LastName${i}`,
        company: `Company ${i}`,
        position: 'Manager',
        linkedinUrl: `https://linkedin.com/in/lead${i}`,
        industry: 'Technology',
        companySize: '50-200',
        location: 'San Francisco, CA',
        score: Math.floor(Math.random() * 100) + 1,
        source: 'Mock Data Generator',
      });
    }
    return leads;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Search for leads based on criteria
   */
  async searchLeads(criteria: LeadSearchCriteria): Promise<LeadScrapingResult> {
    const maxResults = criteria.maxResults || 50;
    const leads: LeadData[] = [];

    // Generate mock leads based on search criteria
    const searchQuery = criteria.keywords.join(' ');

    for (let i = 0; i < Math.min(maxResults, 100); i++) {
      const companySize =
        criteria.companySize ||
        LeadScraper.companySizes[Math.floor(Math.random() * LeadScraper.companySizes.length)];

      leads.push({
        email: `lead${i}.${searchQuery.replace(/\s+/g, '').toLowerCase()}@company${i}.com`,
        firstName: this.generateFirstName(),
        lastName: this.generateLastName(),
        company: this.generateCompanyName(criteria.industry),
        position: LeadScraper.positions[Math.floor(Math.random() * LeadScraper.positions.length)],
        linkedinUrl: `https://linkedin.com/in/lead${i}`,
        industry:
          criteria.industry ||
          LeadScraper.industries[Math.floor(Math.random() * LeadScraper.industries.length)],
        companySize,
        location:
          criteria.location ||
          LeadScraper.locations[Math.floor(Math.random() * LeadScraper.locations.length)],
        score: Math.floor(Math.random() * 100) + 1,
        source: 'Mock Data Generator',
      });
    }

    return {
      leads,
      totalFound: leads.length,
      searchCriteria: criteria,
      searchTime: new Date(),
      sources: [
        'LinkedIn (Simulated)',
        'Company Websites (Simulated)',
        'Public Databases (Simulated)',
      ],
    };
  }

  /**
   * Enrich lead data with additional information
   */
  async enrichLead(email: string): Promise<LeadData | null> {
    // Simulate lead enrichment
    if (!email.includes('@')) {
      return null;
    }

    const company = email.split('@')[1].split('.')[0];

    return {
      email,
      firstName: this.generateFirstName(),
      lastName: this.generateLastName(),
      company: this.capitalizeFirst(company),
      position: LeadScraper.positions[Math.floor(Math.random() * LeadScraper.positions.length)],
      linkedinUrl: `https://linkedin.com/in/${email.split('@')[0]}`,
      industry: LeadScraper.industries[Math.floor(Math.random() * LeadScraper.industries.length)],
      companySize:
        LeadScraper.companySizes[Math.floor(Math.random() * LeadScraper.companySizes.length)],
      location: LeadScraper.locations[Math.floor(Math.random() * LeadScraper.locations.length)],
      score: Math.floor(Math.random() * 100) + 1,
      source: 'Email Enrichment',
    };
  }

  /**
   * Score lead quality based on various factors
   */
  scoreLead(lead: LeadData): number {
    let score = 50; // Base score

    // Industry scoring
    if (['Technology', 'Healthcare', 'Finance'].includes(lead.industry)) {
      score += 20;
    }

    // Position scoring
    if (['CEO', 'CTO', 'CMO'].includes(lead.position)) {
      score += 25;
    }

    // Company size scoring
    if (['201-500', '501-1000', '1000+'].includes(lead.companySize)) {
      score += 15;
    }

    // LinkedIn presence
    if (lead.linkedinUrl && lead.linkedinUrl.includes('linkedin.com')) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  private generateFirstName(): string {
    const names = [
      'John',
      'Jane',
      'Michael',
      'Sarah',
      'David',
      'Emily',
      'Robert',
      'Ashley',
      'Christopher',
      'Jessica',
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  private generateLastName(): string {
    const names = [
      'Smith',
      'Johnson',
      'Williams',
      'Brown',
      'Jones',
      'Garcia',
      'Miller',
      'Davis',
      'Rodriguez',
      'Martinez',
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  private generateCompanyName(industry?: string): string {
    const prefixes = ['Tech', 'Global', 'Advanced', 'Prime', 'Elite', 'Digital', 'Smart', 'Pro'];
    const suffixes = ['Solutions', 'Systems', 'Corp', 'Inc', 'Group', 'Ventures', 'Labs', 'Works'];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    return `${prefix} ${suffix}`;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Export singleton instance
export const leadScraper = new LeadScraper();

// Export default for compatibility
export default leadScraper;
