#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import puppeteer from 'puppeteer';

interface InvoiceData {
  month: string;
  totalCost: number;
  totalExecutions: number;
  campaignBreakdown: {
    id: string;
    name: string;
    type: string;
    totalCost: number;
    executions: number;
    agents: Record<
      string,
      {
        cost: number;
        executions: number;
        tokens: number;
      }
    >;
  }[];
  agentSummary: Record<
    string,
    {
      totalCost: number;
      totalExecutions: number;
      totalTokens: number;
      campaigns: number;
    }
  >;
}

class InvoiceGenerator {
  private prisma: PrismaClient;
  private outputDir: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.outputDir = join(process.cwd(), 'reports', 'invoices');
    this.ensureOutputDir();
  }

  private ensureOutputDir() {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateInvoice(month?: string): Promise<{ pdfPath: string; csvPath: string }> {
    const targetMonth = month || new Date().toISOString().substring(0, 7);
    console.log(`🧾 Generating invoice for ${targetMonth}...`);

    // Fetch billing data
    const invoiceData = await this.fetchInvoiceData(targetMonth);

    // Generate CSV
    const csvPath = await this.generateCSV(invoiceData);

    // Generate PDF
    const pdfPath = await this.generatePDF(invoiceData);

    return { pdfPath, csvPath };
  }

  private async fetchInvoiceData(month: string): Promise<InvoiceData> {
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Fetch billing logs for the month
    const billingLogs = await this.prisma.billingLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        campaign: true,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Calculate totals and breakdowns
    const totalCost = billingLogs.reduce((sum, log) => sum + log.cost, 0);
    const totalExecutions = billingLogs.length;

    // Group by campaign and agent
    const campaignMap = new Map<string, any>();
    const agentMap = new Map<string, any>();

    billingLogs.forEach(log => {
      const campaignId = log.campaignId || 'uncategorized';
      if (!campaignMap.has(campaignId)) {
        campaignMap.set(campaignId, {
          id: campaignId,
          name: log.campaign?.name || 'Uncategorized',
          type: log.campaign?.type || 'UNKNOWN',
          totalCost: 0,
          executions: 0,
          agents: {},
        });
      }

      const campaign = campaignMap.get(campaignId);
      campaign.totalCost += log.cost;
      campaign.executions += 1;

      if (!campaign.agents[log.agentType]) {
        campaign.agents[log.agentType] = { cost: 0, executions: 0, tokens: 0 };
      }
      campaign.agents[log.agentType].cost += log.cost;
      campaign.agents[log.agentType].executions += 1;
      campaign.agents[log.agentType].tokens += log.tokens;

      // Agent summary
      if (!agentMap.has(log.agentType)) {
        agentMap.set(log.agentType, {
          totalCost: 0,
          totalExecutions: 0,
          totalTokens: 0,
          campaigns: new Set(),
        });
      }

      const agent = agentMap.get(log.agentType);
      agent.totalCost += log.cost;
      agent.totalExecutions += 1;
      agent.totalTokens += log.tokens;
      agent.campaigns.add(campaignId);
    });

    // Convert to final format
    const campaignBreakdown = Array.from(campaignMap.values());
    const agentSummary: Record<string, any> = {};

    agentMap.forEach((value, key) => {
      agentSummary[key] = {
        ...value,
        campaigns: value.campaigns.size,
      };
    });

    return {
      month,
      totalCost,
      totalExecutions,
      campaignBreakdown,
      agentSummary,
    };
  }

  private async generateCSV(data: InvoiceData): Promise<string> {
    const filename = `neonhub_invoice_${data.month.replace('-', '_')}.csv`;
    const filepath = join(this.outputDir, filename);

    let csvContent = `NeonHub Enterprise Invoice\nMonth,${data.month}\nTotal Cost,$${data.totalCost.toFixed(4)}\nTotal Executions,${data.totalExecutions}\n\n`;

    csvContent += `Campaign Breakdown\nCampaign ID,Campaign Name,Type,Total Cost,Executions\n`;
    data.campaignBreakdown.forEach(campaign => {
      csvContent += `${campaign.id},${campaign.name},${campaign.type},$${campaign.totalCost.toFixed(4)},${campaign.executions}\n`;
    });

    csvContent += `\nAgent Summary\nAgent Type,Total Cost,Total Executions,Total Tokens,Campaigns Used\n`;
    Object.entries(data.agentSummary).forEach(([agentType, agent]) => {
      csvContent += `${agentType},$${agent.totalCost.toFixed(4)},${agent.totalExecutions},${agent.totalTokens},${agent.campaigns}\n`;
    });

    writeFileSync(filepath, csvContent);
    return filepath;
  }

  private async generatePDF(data: InvoiceData): Promise<string> {
    const filename = `neonhub_invoice_${data.month.replace('-', '_')}.pdf`;
    const filepath = join(this.outputDir, filename);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const htmlContent = this.generateInvoiceHTML(data);
    await page.setContent(htmlContent);
    await page.pdf({
      path: filepath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });

    await browser.close();
    return filepath;
  }

  private generateInvoiceHTML(data: InvoiceData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>NeonHub Enterprise Invoice - ${data.month}</title>
  <style>
    body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #0f172a, #1e1b4b); margin: 0; padding: 20px; }
    .invoice-container { max-width: 1000px; margin: 0 auto; background: rgba(255,255,255,0.95); border-radius: 20px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #8b5cf6, #06b6d4); color: white; padding: 40px; text-align: center; }
    .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
    .content { padding: 40px; }
    .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
    .metric-card { background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .metric-value { font-size: 1.8rem; font-weight: 700; color: #6366f1; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #4f46e5; color: white; padding: 15px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>🚀 NeonHub Enterprise</h1>
      <div>AI Agent Usage Invoice - ${data.month}</div>
    </div>
    <div class="content">
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-value">$${data.totalCost.toFixed(2)}</div>
          <div>Total Cost</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${data.totalExecutions}</div>
          <div>Total Executions</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${Object.keys(data.agentSummary).length}</div>
          <div>Agent Types</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${data.campaignBreakdown.length}</div>
          <div>Campaigns</div>
        </div>
      </div>
      
      <h2>Campaign Breakdown</h2>
      <table>
        <thead>
          <tr><th>Campaign</th><th>Type</th><th>Cost</th><th>Executions</th></tr>
        </thead>
        <tbody>
          ${data.campaignBreakdown
            .map(
              c => `
            <tr><td>${c.name}</td><td>${c.type}</td><td>$${c.totalCost.toFixed(2)}</td><td>${c.executions}</td></tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      
      <h2>Agent Summary</h2>
      <table>
        <thead>
          <tr><th>Agent Type</th><th>Cost</th><th>Executions</th><th>Campaigns</th></tr>
        </thead>
        <tbody>
          ${Object.entries(data.agentSummary)
            .map(
              ([type, agent]) => `
            <tr><td>${type}</td><td>$${agent.totalCost.toFixed(2)}</td><td>${agent.totalExecutions}</td><td>${agent.campaigns}</td></tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
  }

  async close() {
    await this.prisma.$disconnect();
  }
}

// CLI execution
async function main() {
  const month = process.argv[2];
  const generator = new InvoiceGenerator();

  try {
    const { pdfPath, csvPath } = await generator.generateInvoice(month);
    console.log('✅ Invoice generated:');
    console.log(`   PDF: ${pdfPath}`);
    console.log(`   CSV: ${csvPath}`);
  } finally {
    await generator.close();
  }
}

if (require.main === module) {
  main();
}

export { InvoiceGenerator };
