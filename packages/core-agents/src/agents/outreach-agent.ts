import { AbstractAgent, AgentPayload, AgentResult } from '../base-agent';
import { AgentContextOrUndefined, OutreachResult } from '../types';
import crypto from 'crypto';

interface ProposalTemplate {
  id: string;
  name: string;
  type: 'marketing' | 'partnership' | 'sales' | 'general';
  sections: ProposalSection[];
}

interface ProposalSection {
  title: string;
  content: string;
  variables: string[];
  required: boolean;
}

interface ProposalData {
  clientName: string;
  companyName: string;
  proposalTitle: string;
  sections: Record<string, string>;
  customizations: {
    brandColors: { primary: string; secondary: string };
    logo?: string;
    theme: 'modern' | 'classic' | 'minimal';
  };
}

export class OutreachAgent extends AbstractAgent {
  private templates: ProposalTemplate[] = [
    {
      id: 'marketing_proposal',
      name: 'Marketing Campaign Proposal',
      type: 'marketing',
      sections: [
        {
          title: 'Executive Summary',
          content: 'Our marketing strategy for {{clientName}} focuses on...',
          variables: ['clientName'],
          required: true,
        },
        {
          title: 'Campaign Strategy',
          content: 'We propose a multi-channel approach including...',
          variables: [],
          required: true,
        },
        {
          title: 'Timeline & Deliverables',
          content: 'Project timeline spanning {{duration}} with key milestones...',
          variables: ['duration'],
          required: true,
        },
        {
          title: 'Investment & ROI',
          content: 'Total investment of {{budget}} with projected ROI of {{roi}}%',
          variables: ['budget', 'roi'],
          required: true,
        },
      ],
    },
    {
      id: 'partnership_proposal',
      name: 'Strategic Partnership Proposal',
      type: 'partnership',
      sections: [
        {
          title: 'Partnership Overview',
          content: 'Strategic alliance between {{companyName}} and {{clientName}}...',
          variables: ['companyName', 'clientName'],
          required: true,
        },
        {
          title: 'Mutual Benefits',
          content: 'This partnership will provide mutual benefits including...',
          variables: [],
          required: true,
        },
        {
          title: 'Implementation Plan',
          content: 'Partnership rollout over {{timeline}} phases...',
          variables: ['timeline'],
          required: true,
        },
      ],
    },
  ];

  constructor(id: string, name: string) {
    super(id, name, 'outreach', [
      'send_emails',
      'social_outreach',
      'lead_generation',
      'follow_up',
      'campaign_management',
      'generate_pdf_proposal',
      'generate_html_proposal',
      'customize_proposal',
      'proposal_templates',
    ]);
  }

  async execute(payload: AgentPayload): Promise<AgentResult> {
    return this.executeWithErrorHandling(payload, async () => {
      const { task, context } = payload;

      switch (task) {
        case 'send_emails':
          return await this.sendEmails(context);
        case 'social_outreach':
          return await this.socialOutreach(context);
        case 'lead_generation':
          return await this.generateLeads(context);
        case 'follow_up':
          return await this.followUp(context);
        case 'campaign_management':
          return await this.manageCampaign(context);
        case 'generate_pdf_proposal':
          return await this.generatePdfProposal(context);
        case 'generate_html_proposal':
          return await this.generateHtmlProposal(context);
        case 'customize_proposal':
          return await this.customizeProposal(context);
        case 'proposal_templates':
          return await this.getProposalTemplates(context);
        default:
          throw new Error(`Unknown task: ${task}`);
      }
    });
  }

  private async sendEmails(context: AgentContextOrUndefined): Promise<OutreachResult> {
    const emailData = context?.emailData || {};
    const recipients = (
      Array.isArray(context?.recipients) ? context.recipients : ['example@email.com']
    ) as string[];

    return {
      campaigns: recipients.map((recipient, index) => ({
        id: `email_${Date.now()}_${index}`,
        type: 'email',
        status: 'sent',
        recipient,
        subject: (emailData as any).subject || 'Outreach Campaign',
        sentAt: new Date().toISOString(),
      })),
    };
  }

  private async socialOutreach(context: AgentContextOrUndefined): Promise<OutreachResult> {
    const platforms = (
      Array.isArray(context?.platforms) ? context.platforms : ['linkedin', 'twitter']
    ) as string[];

    return {
      campaigns: platforms.map(platform => ({
        id: `social_${platform}_${Date.now()}`,
        type: 'social_media',
        status: 'active',
        platform,
        reach: Math.floor(Math.random() * 10000) + 1000,
      })),
    };
  }

  private async generateLeads(context: AgentContextOrUndefined): Promise<OutreachResult> {
    const targetCriteria = context?.targetCriteria || {};
    const leadCount = Math.floor(Math.random() * 50) + 10;

    return {
      campaigns: [
        {
          id: crypto.randomUUID(),
          type: 'lead_generation',
          status: 'completed',
          generatedLeads: leadCount,
          metadata: {
            searchQuery: (targetCriteria as any).searchQuery || '',
            platform: (targetCriteria as any).platform || '',
            leadCount,
            estimatedReach: leadCount * 3,
          },
        },
      ],
    };
  }

  private async followUp(context: AgentContextOrUndefined): Promise<OutreachResult> {
    const followUpType = (
      typeof context?.followUpType === 'string' ? context.followUpType : 'email'
    ) as string;

    return {
      campaigns: [
        {
          id: crypto.randomUUID(),
          type: 'follow_up',
          status: 'completed',
          followUpType,
          metadata: {
            leadId: context?.leadId || '',
            followUpType,
            scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        },
      ],
    };
  }

  private async manageCampaign(context: AgentContextOrUndefined): Promise<OutreachResult> {
    const campaignId = (
      typeof context?.campaignId === 'string' ? context.campaignId : 'default_campaign'
    ) as string;

    return {
      campaigns: [
        {
          id: campaignId,
          type: 'multi_channel',
          status: 'active',
          metrics: {
            emailsSent: Math.floor(Math.random() * 1000) + 100,
            socialPosts: Math.floor(Math.random() * 50) + 10,
            leadsGenerated: Math.floor(Math.random() * 20) + 5,
          },
        },
      ],
    };
  }

  // New PDF proposal generation
  private async generatePdfProposal(context: AgentContextOrUndefined): Promise<OutreachResult> {
    const proposalData = this.extractProposalData(context);
    const template = this.getTemplate(proposalData.templateId || 'marketing_proposal');

    const pdfContent = this.generatePdfContent(template, proposalData);

    return {
      campaigns: [
        {
          id: `pdf_proposal_${Date.now()}`,
          type: 'proposal_generation',
          status: 'completed',
          format: 'pdf',
          proposal: {
            title: proposalData.proposalTitle,
            client: proposalData.clientName,
            pages: template.sections.length + 2, // +2 for cover and conclusion
            downloadUrl: `/proposals/pdf/${Date.now()}.pdf`,
            content: pdfContent,
          },
        },
      ],
    };
  }

  // New HTML proposal generation
  private async generateHtmlProposal(context: AgentContextOrUndefined): Promise<OutreachResult> {
    const proposalData = this.extractProposalData(context);
    const template = this.getTemplate(proposalData.templateId || 'marketing_proposal');

    const htmlContent = this.generateHtmlContent(template, proposalData);

    return {
      campaigns: [
        {
          id: `html_proposal_${Date.now()}`,
          type: 'proposal_generation',
          status: 'completed',
          format: 'html',
          proposal: {
            title: proposalData.proposalTitle,
            client: proposalData.clientName,
            responsive: true,
            previewUrl: `/proposals/html/${Date.now()}.html`,
            content: htmlContent,
          },
        },
      ],
    };
  }

  private async customizeProposal(context: AgentContextOrUndefined): Promise<OutreachResult> {
    const customizations = context?.customizations || {};
    const proposalId = (
      typeof context?.proposalId === 'string' ? context.proposalId : 'default'
    ) as string;

    return {
      campaigns: [
        {
          id: `custom_proposal_${Date.now()}`,
          type: 'proposal_customization',
          status: 'completed',
          originalProposalId: proposalId,
          customizations: {
            brandColors: (customizations as any).brandColors || {
              primary: '#007bff',
              secondary: '#6c757d',
            },
            typography: (customizations as any).typography || 'modern',
            layout: (customizations as any).layout || 'standard',
            sections: (customizations as any).sections || [],
          },
        },
      ],
    };
  }

  private async getProposalTemplates(context: AgentContextOrUndefined): Promise<OutreachResult> {
    const templateType = (
      typeof context?.templateType === 'string' ? context.templateType : 'all'
    ) as string;

    const filteredTemplates =
      templateType === 'all' ? this.templates : this.templates.filter(t => t.type === templateType);

    return {
      campaigns: [
        {
          id: `templates_${Date.now()}`,
          type: 'template_library',
          status: 'active',
          templates: filteredTemplates.map(t => ({
            id: t.id,
            name: t.name,
            type: t.type,
            sectionCount: t.sections.length,
            variables: t.sections.flatMap(s => s.variables),
          })),
        },
      ],
    };
  }

  // Helper methods for proposal generation
  private extractProposalData(context: AgentContextOrUndefined): any {
    return {
      clientName: (typeof context?.clientName === 'string'
        ? context.clientName
        : 'Valued Client') as string,
      companyName: (typeof context?.companyName === 'string'
        ? context.companyName
        : 'NeonHub') as string,
      proposalTitle: (typeof context?.proposalTitle === 'string'
        ? context.proposalTitle
        : 'Business Proposal') as string,
      templateId: (typeof context?.templateId === 'string'
        ? context.templateId
        : 'marketing_proposal') as string,
      variables: context?.variables || {},
      customizations: context?.customizations || {
        brandColors: { primary: '#007bff', secondary: '#6c757d' },
        theme: 'modern',
      },
    };
  }

  private getTemplate(templateId: string): ProposalTemplate {
    return this.templates.find(t => t.id === templateId) || this.templates[0];
  }

  private generatePdfContent(template: ProposalTemplate, data: any): string {
    // Simulate PDF generation with structured content
    let content = `# ${data.proposalTitle}\n\n`;
    content += `**Prepared for:** ${data.clientName}\n`;
    content += `**Prepared by:** ${data.companyName}\n`;
    content += `**Date:** ${new Date().toLocaleDateString()}\n\n`;

    template.sections.forEach(section => {
      content += `## ${section.title}\n\n`;
      let sectionContent = section.content;

      // Replace variables with actual data
      section.variables.forEach(variable => {
        const value = data.variables[variable] || `{{${variable}}}`;
        sectionContent = sectionContent.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      });

      content += `${sectionContent}\n\n`;
    });

    content += `---\n*This proposal is valid for 30 days from the date of issue.*`;

    return content;
  }

  private generateHtmlContent(template: ProposalTemplate, data: any): string {
    const theme = data.customizations?.theme || 'modern';
    const primaryColor = data.customizations?.brandColors?.primary || '#007bff';
    const secondaryColor = data.customizations?.brandColors?.secondary || '#6c757d';

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.proposalTitle}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid ${primaryColor}; padding-bottom: 20px; }
        .title { color: ${primaryColor}; font-size: 2.5em; margin-bottom: 10px; }
        .subtitle { color: ${secondaryColor}; font-size: 1.2em; }
        .section { margin-bottom: 30px; }
        .section-title { color: ${primaryColor}; font-size: 1.5em; margin-bottom: 15px; border-left: 4px solid ${primaryColor}; padding-left: 15px; }
        .content { color: #333; line-height: 1.8; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: ${secondaryColor}; }
        @media (max-width: 600px) { .container { padding: 20px; } .title { font-size: 2em; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${data.proposalTitle}</h1>
            <p class="subtitle">Prepared for <strong>${data.clientName}</strong></p>
            <p class="subtitle">by ${data.companyName} • ${new Date().toLocaleDateString()}</p>
        </div>`;

    template.sections.forEach(section => {
      html += `
        <div class="section">
            <h2 class="section-title">${section.title}</h2>
            <div class="content">`;

      let sectionContent = section.content;
      section.variables.forEach(variable => {
        const value = data.variables[variable] || `<em>[${variable}]</em>`;
        sectionContent = sectionContent.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      });

      html += `<p>${sectionContent}</p>`;
      html += `
            </div>
        </div>`;
    });

    html += `
        <div class="footer">
            <p><em>This proposal is valid for 30 days from the date of issue.</em></p>
            <p>Generated by NeonHub AI • ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;

    return html;
  }
}
