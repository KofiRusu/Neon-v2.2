import { BoardroomReport, StrategySlide } from '../agents/boardroom-report-agent';
import { ForecastResult } from './forecast-insight-engine';

export interface PresentationConfig {
  theme: PresentationTheme;
  format: OutputFormat[];
  includeTableOfContents: boolean;
  includeCoverPage: boolean;
  includeAppendix: boolean;
  customBranding?: BrandingConfig;
  pageSize: 'A4' | 'Letter' | '16:9' | '4:3';
  orientation: 'portrait' | 'landscape';
}

export interface BrandingConfig {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  companyName: string;
  tagline?: string;
}

export interface PresentationOutput {
  id: string;
  title: string;
  formats: {
    markdown?: string;
    html?: string;
    pdf?: string; // Base64 encoded for mock
    pptx?: string; // Base64 encoded for mock
  };
  metadata: {
    slideCount: number;
    generationTime: number;
    theme: string;
    createdAt: string;
    fileSize?: number;
  };
  downloadUrls?: {
    pdf?: string;
    pptx?: string;
    html?: string;
  };
}

export enum PresentationTheme {
  NEON_GLASS = 'neon_glass',
  EXECUTIVE_DARK = 'executive_dark',
  CMO_LITE = 'cmo_lite',
  BRANDED = 'branded',
  MINIMAL = 'minimal',
}

export enum OutputFormat {
  MARKDOWN = 'markdown',
  HTML = 'html',
  PDF = 'pdf',
  PPTX = 'pptx',
}

export class PresentationBuilder {
  private readonly DEFAULT_THEME = PresentationTheme.NEON_GLASS;
  private readonly SLIDE_TRANSITION_DURATION = 300;

  constructor() {}

  async buildPresentation(
    report: BoardroomReport,
    config: PresentationConfig
  ): Promise<PresentationOutput> {
    const startTime = Date.now();

    console.log('[PresentationBuilder] Building presentation:', {
      reportId: report.id,
      theme: config.theme,
      formats: config.format,
    });

    try {
      const presentation: PresentationOutput = {
        id: `pres_${Date.now()}`,
        title: report.title,
        formats: {},
        metadata: {
          slideCount:
            report.slides.length +
            (config.includeCoverPage ? 1 : 0) +
            (config.includeTableOfContents ? 1 : 0),
          generationTime: 0,
          theme: config.theme,
          createdAt: new Date().toISOString(),
        },
      };

      // Generate content in requested formats
      for (const format of config.format) {
        switch (format) {
          case OutputFormat.MARKDOWN:
            presentation.formats.markdown = await this.generateMarkdown(report, config);
            break;
          case OutputFormat.HTML:
            presentation.formats.html = await this.generateHTML(report, config);
            break;
          case OutputFormat.PDF:
            presentation.formats.pdf = await this.generatePDF(report, config);
            break;
          case OutputFormat.PPTX:
            presentation.formats.pptx = await this.generatePPTX(report, config);
            break;
        }
      }

      presentation.metadata.generationTime = Date.now() - startTime;
      presentation.downloadUrls = this.generateDownloadUrls(presentation);

      console.log('[PresentationBuilder] Presentation built successfully:', {
        id: presentation.id,
        formats: Object.keys(presentation.formats),
        slideCount: presentation.metadata.slideCount,
        generationTime: presentation.metadata.generationTime,
      });

      return presentation;
    } catch (error) {
      console.error('[PresentationBuilder] Error building presentation:', error);
      throw error;
    }
  }

  private async generateMarkdown(
    report: BoardroomReport,
    config: PresentationConfig
  ): Promise<string> {
    let markdown = '';

    // Cover page
    if (config.includeCoverPage) {
      markdown += this.generateMarkdownCoverPage(report, config);
    }

    // Table of contents
    if (config.includeTableOfContents) {
      markdown += this.generateMarkdownTableOfContents(report);
    }

    // Slides
    for (const slide of report.slides) {
      markdown += this.generateMarkdownSlide(slide, config);
    }

    // Appendix
    if (config.includeAppendix) {
      markdown += this.generateMarkdownAppendix(report);
    }

    return markdown;
  }

  private generateMarkdownCoverPage(report: BoardroomReport, config: PresentationConfig): string {
    const branding = config.customBranding;

    return `---
title: ${report.title}
subtitle: ${report.subtitle || ''}
author: ${branding?.companyName || 'NeonHub AI Marketing Intelligence'}
date: ${new Date().toLocaleDateString()}
theme: ${config.theme}
---

# ${report.title}

${report.subtitle ? `## ${report.subtitle}` : ''}

**Presented by:** ${branding?.companyName || 'NeonHub AI Marketing Intelligence'}  
**Generated:** ${new Date().toLocaleDateString()}  
**Report Period:** ${report.timeframeCovered.start} - ${report.timeframeCovered.end}  
**Overall Score:** ${report.overallScore}/100  
**Confidence Level:** ${(report.confidenceScore * 100).toFixed(0)}%

${branding?.tagline ? `*${branding.tagline}*` : '*Powered by Advanced AI Marketing Intelligence*'}

---

`;
  }

  private generateMarkdownTableOfContents(report: BoardroomReport): string {
    let toc = `# Table of Contents

`;

    report.slides.forEach((slide, index) => {
      toc += `${index + 1}. [${slide.title}](#slide-${slide.slideNumber})\n`;
    });

    toc += `\n---\n\n`;
    return toc;
  }

  private generateMarkdownSlide(slide: StrategySlide, config: PresentationConfig): string {
    let slideMarkdown = `# ${slide.title} {#slide-${slide.slideNumber}}

`;

    if (slide.subtitle) {
      slideMarkdown += `## ${slide.subtitle}

`;
    }

    // Main content based on slide type
    slideMarkdown += this.generateSlideContent(slide);

    // Key takeaway
    if (slide.keyTakeaway) {
      slideMarkdown += `
> **Key Takeaway:** ${slide.keyTakeaway}
`;
    }

    // Business context
    if (slide.businessContext) {
      slideMarkdown += `
**Business Context:** ${slide.businessContext}
`;
    }

    // Recommendation
    if (slide.recommendation) {
      slideMarkdown += `
**Recommendation:** ${slide.recommendation}
`;
    }

    slideMarkdown += `\n---\n\n`;
    return slideMarkdown;
  }

  private generateSlideContent(slide: StrategySlide): string {
    const content = slide.mainContent;

    switch (slide.slideType) {
      case 'EXECUTIVE_SUMMARY':
        return this.generateExecutiveSummaryContent(content);
      case 'FINANCIAL_OVERVIEW':
        return this.generateFinancialOverviewContent(content);
      case 'METRIC':
        return this.generateMetricContent(content);
      case 'AGENT_HIGHLIGHT':
        return this.generateAgentHighlightContent(content);
      case 'FORECAST':
        return this.generateForecastContent(content);
      case 'STRATEGIC_RECOMMENDATION':
        return this.generateStrategicRecommendationContent(content);
      default:
        return this.generateGenericContent(content);
    }
  }

  private generateExecutiveSummaryContent(content: any): string {
    let summary = '';

    if (content.keyMetrics) {
      summary += `## Key Performance Indicators

| Metric | Value | Trend |
|--------|-------|--------|
`;
      content.keyMetrics.forEach((metric: any) => {
        summary += `| ${metric.label} | ${metric.value} | ${metric.trend} |\n`;
      });
      summary += '\n';
    }

    if (content.keyTakeaways) {
      summary += `## Key Takeaways

`;
      content.keyTakeaways.forEach((takeaway: string) => {
        summary += `- ${takeaway}\n`;
      });
      summary += '\n';
    }

    return summary;
  }

  private generateFinancialOverviewContent(content: any): string {
    let financial = '';

    financial += `## Financial Performance Summary

- **Total Budget:** $${(content.totalBudget / 1000).toFixed(0)}K
- **Total Spend:** $${(content.totalSpend / 1000).toFixed(0)}K
- **Total Revenue:** $${(content.totalRevenue / 1000).toFixed(0)}K
- **Overall ROAS:** ${content.overallROAS.toFixed(1)}x
- **Cost Savings:** $${(content.costSavings / 1000).toFixed(0)}K
- **Budget Efficiency:** ${(content.budgetEfficiency * 100).toFixed(0)}%

`;

    if (content.chartData) {
      financial += `### Budget Allocation Breakdown

*[Chart: ${content.chartData.type} showing budget distribution]*

`;
    }

    return financial;
  }

  private generateMetricContent(content: any): string {
    return `## Performance Metrics

${JSON.stringify(content, null, 2)}

`;
  }

  private generateAgentHighlightContent(content: any): string {
    let agentContent = '';

    if (content.topPerformingAgent) {
      agentContent += `## Top Performing Agent: ${content.topPerformingAgent.agentType}

- **Impact Score:** ${(content.topPerformingAgent.impactScore * 100).toFixed(0)}%
- **Success Rate:** ${(content.topPerformingAgent.successRate * 100).toFixed(0)}%
- **Executions:** ${content.topPerformingAgent.totalExecutions}

`;
    }

    if (content.agentMetrics) {
      agentContent += `## Agent Performance Overview

| Agent | Score | Executions | Impact |
|-------|-------|------------|---------|
`;
      content.agentMetrics.forEach((agent: any) => {
        agentContent += `| ${agent.agent} | ${agent.score}% | ${agent.executions} | ${agent.impact} |\n`;
      });
      agentContent += '\n';
    }

    if (content.collaborationScore) {
      agentContent += `**Collaboration Efficiency:** ${(content.collaborationScore * 100).toFixed(0)}%

`;
    }

    return agentContent;
  }

  private generateForecastContent(content: any): string {
    let forecastContent = '';

    if (content.forecasts) {
      forecastContent += `## Predictive Analytics

| Metric | Current | Projected | Confidence | Timeline |
|--------|---------|-----------|------------|----------|
`;
      content.forecasts.forEach((forecast: any) => {
        forecastContent += `| ${forecast.metric} | ${forecast.current} | ${forecast.projected} | ${(forecast.confidence * 100).toFixed(0)}% | ${forecast.timeline} |\n`;
      });
      forecastContent += '\n';
    }

    return forecastContent;
  }

  private generateStrategicRecommendationContent(content: any): string {
    let recommendations = '';

    if (content.recommendations) {
      recommendations += `## Strategic Recommendations

`;
      content.recommendations.forEach((rec: string, index: number) => {
        recommendations += `${index + 1}. ${rec}\n`;
      });
      recommendations += '\n';
    }

    if (content.nextQuarterGoals) {
      recommendations += `## Next Quarter Goals

`;
      content.nextQuarterGoals.forEach((goal: string) => {
        recommendations += `- ${goal}\n`;
      });
      recommendations += '\n';
    }

    if (content.priorityMatrix) {
      recommendations += `## Priority Matrix

| Action | Impact | Effort | Priority |
|--------|--------|--------|----------|
`;
      content.priorityMatrix.forEach((item: any) => {
        recommendations += `| ${item.action} | ${item.impact} | ${item.effort} | ${item.priority} |\n`;
      });
      recommendations += '\n';
    }

    return recommendations;
  }

  private generateGenericContent(content: any): string {
    if (typeof content === 'string') {
      return `${content}\n\n`;
    }

    return `\`\`\`json
${JSON.stringify(content, null, 2)}
\`\`\`

`;
  }

  private generateMarkdownAppendix(report: BoardroomReport): string {
    return `# Appendix

## Methodology

This report was generated using NeonHub's AI-powered analytics engine, incorporating:

- **Data Sources:** ${report.dataPoints} data points from campaigns, agent performance, and market trends
- **Analysis Period:** ${report.timeframeCovered.start} to ${report.timeframeCovered.end}
- **Confidence Level:** ${(report.confidenceScore * 100).toFixed(0)}%
- **Generation Time:** ${report.generationTime}ms

## Data Quality

- **Campaigns Analyzed:** ${report.campaignsCovered.length}
- **Agents Evaluated:** ${report.agentsCovered.length}
- **Forecast Models:** ${report.forecasts.length} predictive models applied

## Definitions

- **ROAS:** Return on Advertising Spend
- **Brand Alignment Score:** Consistency with brand guidelines (0-100%)
- **Agent Efficiency:** AI agent task completion rate and quality score
- **Business Impact:** Projected financial impact in dollars

---

*Generated by NeonHub AI Marketing Intelligence System*  
*Report ID: ${report.id}*  
*Generated: ${report.createdAt}*
`;
  }

  private async generateHTML(report: BoardroomReport, config: PresentationConfig): Promise<string> {
    const markdown = await this.generateMarkdown(report, config);
    const themeCSS = this.getThemeCSS(config.theme, config.customBranding);

    // Convert markdown to HTML (simplified - in real implementation would use marked.js or similar)
    let html = this.markdownToHTML(markdown);

    // Wrap in HTML document
    html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
        ${themeCSS}
        
        /* Presentation-specific styles */
        .slide {
            min-height: 100vh;
            padding: 60px 80px;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .slide h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            border-bottom: 3px solid var(--accent-color);
            padding-bottom: 0.5rem;
        }
        
        .slide h2 {
            font-size: 1.8rem;
            margin-bottom: 1.5rem;
            color: var(--secondary-color);
        }
        
        .chart-placeholder {
            background: var(--card-bg);
            border: 2px dashed var(--border-color);
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            margin: 20px 0;
            font-style: italic;
            color: var(--muted-color);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }
        
        th {
            background: var(--accent-bg);
            font-weight: 600;
        }
        
        .metric-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .metric-card {
            background: var(--card-bg);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            text-align: center;
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: var(--accent-color);
            margin: 10px 0;
        }
        
        .trend-positive { color: #00ff88; }
        .trend-negative { color: #ff4757; }
        
        blockquote {
            background: var(--accent-bg);
            border-left: 4px solid var(--accent-color);
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        
        @media print {
            .slide { page-break-after: always; }
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    ${html}
    
    <script>
        // Initialize charts after page load
        document.addEventListener('DOMContentLoaded', function() {
            // Add chart initialization logic here
            console.log('Boardroom presentation loaded');
        });
    </script>
</body>
</html>`;

    return html;
  }

  private getThemeCSS(theme: PresentationTheme, branding?: BrandingConfig): string {
    const themes = {
      [PresentationTheme.NEON_GLASS]: `
        :root {
          --bg-color: #0f1419;
          --card-bg: rgba(255, 255, 255, 0.05);
          --accent-bg: rgba(0, 255, 136, 0.1);
          --text-color: #ffffff;
          --accent-color: #00ff88;
          --secondary-color: #6366f1;
          --border-color: rgba(255, 255, 255, 0.1);
          --muted-color: rgba(255, 255, 255, 0.6);
        }
        
        body {
          background: linear-gradient(135deg, #0f1419, #1a1a2e);
          color: var(--text-color);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.6;
        }
        
        /* Glassmorphism effects */
        .slide {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          margin: 20px;
        }
      `,

      [PresentationTheme.EXECUTIVE_DARK]: `
        :root {
          --bg-color: #1a1a2e;
          --card-bg: #16213e;
          --accent-bg: #0f3460;
          --text-color: #ffffff;
          --accent-color: #6366f1;
          --secondary-color: #8b5cf6;
          --border-color: #2d3748;
          --muted-color: #a0aec0;
        }
        
        body {
          background: var(--bg-color);
          color: var(--text-color);
          font-family: 'Georgia', 'Times New Roman', serif;
          line-height: 1.7;
        }
        
        .slide {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
        }
      `,

      [PresentationTheme.CMO_LITE]: `
        :root {
          --bg-color: #ffffff;
          --card-bg: #f8fafc;
          --accent-bg: #e2e8f0;
          --text-color: #1a202c;
          --accent-color: #6366f1;
          --secondary-color: #8b5cf6;
          --border-color: #e2e8f0;
          --muted-color: #718096;
        }
        
        body {
          background: var(--bg-color);
          color: var(--text-color);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.6;
        }
        
        .slide {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
        }
      `,
    };

    let themeCSS = themes[theme] || themes[PresentationTheme.NEON_GLASS];

    // Apply custom branding if provided
    if (branding) {
      themeCSS += `
        :root {
          --primary-brand-color: ${branding.primaryColor};
          --secondary-brand-color: ${branding.secondaryColor};
          --brand-font: ${branding.fontFamily};
        }
        
        body { font-family: var(--brand-font), var(--text-color); }
        .slide h1 { color: var(--primary-brand-color); }
        .accent { color: var(--secondary-brand-color); }
      `;
    }

    return themeCSS;
  }

  private markdownToHTML(markdown: string): string {
    // Simplified markdown to HTML conversion
    // In production, would use a proper markdown parser like marked.js

    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<div class="slide"><h1>$1</h1>')

      // Bold and italic
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')

      // Lists
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')

      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')

      // Line breaks
      .replace(/\n\n/g, '</div><div class="slide">')
      .replace(/\n/g, '<br>')

      // Tables (simplified)
      .replace(/\|/g, '</td><td>')
      .replace(/^<\/td><td>/gm, '<tr><td>')
      .replace(/<\/td><td>$/gm, '</td></tr>');

    // Wrap in final slide div
    html = `<div class="slide">${html}</div>`;

    return html;
  }

  private async generatePDF(report: BoardroomReport, config: PresentationConfig): Promise<string> {
    // Mock PDF generation - in production would use puppeteer or similar
    const pdfContent = {
      title: report.title,
      pages: report.slides.length + 2, // +2 for cover and TOC
      format: config.pageSize,
      orientation: config.orientation,
      theme: config.theme,
      generatedAt: new Date().toISOString(),
    };

    // Return base64 encoded mock PDF
    return Buffer.from(JSON.stringify(pdfContent)).toString('base64');
  }

  private async generatePPTX(report: BoardroomReport, config: PresentationConfig): Promise<string> {
    // Mock PPTX generation - in production would use officegen or similar
    const pptxContent = {
      title: report.title,
      slides: report.slides.map(slide => ({
        title: slide.title,
        type: slide.slideType,
        content: slide.mainContent,
      })),
      theme: config.theme,
      generatedAt: new Date().toISOString(),
    };

    // Return base64 encoded mock PPTX
    return Buffer.from(JSON.stringify(pptxContent)).toString('base64');
  }

  private generateDownloadUrls(presentation: PresentationOutput): any {
    // Mock download URLs - in production would be actual file URLs
    const baseUrl = 'https://api.neonhub.ai/downloads';
    const urls: any = {};

    if (presentation.formats.pdf) {
      urls.pdf = `${baseUrl}/pdf/${presentation.id}.pdf`;
    }

    if (presentation.formats.pptx) {
      urls.pptx = `${baseUrl}/pptx/${presentation.id}.pptx`;
    }

    if (presentation.formats.html) {
      urls.html = `${baseUrl}/html/${presentation.id}.html`;
    }

    return urls;
  }

  // Quick build method for common boardroom presentations
  async buildBoardroomPresentation(report: BoardroomReport): Promise<PresentationOutput> {
    const config: PresentationConfig = {
      theme: PresentationTheme.NEON_GLASS,
      format: [OutputFormat.HTML, OutputFormat.MARKDOWN, OutputFormat.PDF],
      includeTableOfContents: true,
      includeCoverPage: true,
      includeAppendix: true,
      pageSize: '16:9',
      orientation: 'landscape',
    };

    return await this.buildPresentation(report, config);
  }

  // Executive-friendly version
  async buildExecutivePresentation(
    report: BoardroomReport,
    branding?: BrandingConfig
  ): Promise<PresentationOutput> {
    const config: PresentationConfig = {
      theme: PresentationTheme.EXECUTIVE_DARK,
      format: [OutputFormat.HTML, OutputFormat.PDF, OutputFormat.PPTX],
      includeTableOfContents: true,
      includeCoverPage: true,
      includeAppendix: false,
      customBranding: branding,
      pageSize: 'A4',
      orientation: 'landscape',
    };

    return await this.buildPresentation(report, config);
  }
}

export default PresentationBuilder;
