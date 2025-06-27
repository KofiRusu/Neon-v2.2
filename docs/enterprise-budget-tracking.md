# Enterprise Budget Tracking System

NeonHub v2.1 includes a comprehensive enterprise budget tracking system for
monitoring AI agent costs and managing spending limits in your organization.

## 🎯 Overview

The budget tracking system provides:

- **Real-time cost monitoring** for all AI agent executions
- **Campaign-specific budget tracking** with per-campaign limits
- **Monthly budget caps** with automatic alerts
- **Administrative dashboard** for budget management
- **Automated cost reporting** with detailed breakdowns
- **Budget override controls** for emergency situations

## 🏗️ Architecture

### Database Models

#### BillingLog

Tracks individual agent execution costs:

```typescript
{
  agentType: AgentType,        // Which agent was used
  campaignId?: string,         // Associated campaign
  tokens: number,              // Tokens consumed
  cost: number,                // Calculated cost
  task?: string,               // Task description
  executionId?: string,        // Execution identifier
  impactScore?: number,        // Performance metric (0-1)
  conversionAchieved?: boolean, // Success indicator
  qualityScore?: number,       // Output quality (0-1)
  retryCount?: number,         // Number of retries
  executionTime?: number,      // Duration in milliseconds
  metadata?: Json              // Additional context
}
```

#### CampaignCost

Aggregates costs per campaign:

```typescript
{
  campaignId: string,          // Campaign identifier
  totalCost: number,           // Current total spent
  monthlyBudget?: number,      // Optional spending limit
  currentMonth: string,        // Current billing period
}
```

#### MonthlyBudget

Sets organization-wide spending limits:

```typescript
{
  month: string,               // Format: "YYYY-MM"
  totalBudget: number,         // Monthly spending limit
  totalSpent: number,          // Current total spent
  alertThreshold: number,      // Alert at % of budget (0-1)
  isAlertSent: boolean         // Alert status flag
}
```

## 🔧 Implementation

### 1. Agent Integration

Update your agents to use the budget tracking system:

```typescript
import { BudgetTracker, AgentType } from '@neon/utils';

export class MyAgent extends AbstractAgent {
  async execute(payload: AgentPayload): Promise<AgentResult> {
    // Check budget before execution
    const budgetStatus = await BudgetTracker.checkBudgetStatus();
    if (!budgetStatus.canExecute) {
      throw new Error(
        `Budget exceeded: ${budgetStatus.utilizationPercentage.toFixed(1)}%`
      );
    }

    // Execute your AI task
    const result = await this.performAITask();

    // Track the cost
    await BudgetTracker.trackCost({
      agentType: AgentType.CONTENT,
      campaignId: payload.context?.campaignId,
      tokens: result.tokensUsed,
      task: 'generate_content',
      conversionAchieved: result.success,
      qualityScore: result.confidence,
      metadata: {
        /* additional context */
      },
    });

    return result;
  }
}
```

### 2. Alternative: Automatic Tracking

Use the `executeWithTracking` wrapper for automatic cost tracking:

```typescript
const result = await BudgetTracker.executeWithTracking(
  async () => {
    // Your AI task here
    return await openai.chat.completions.create({...});
  },
  {
    agentType: AgentType.CONTENT,
    campaignId: 'campaign-123',
    task: 'generate_blog_post',
    estimatedTokens: 1000,
    metadata: { topic: 'AI Marketing' }
  }
);
```

## 📊 Admin Dashboard

Access the admin budget dashboard at `/admin/budget` to:

- **View monthly spending** with real-time utilization charts
- **Set budget limits** for campaigns and monthly caps
- **Monitor agent performance** with cost breakdowns
- **Configure alerts** and override settings
- **Export cost reports** in multiple formats

### Key Features

#### Monthly Overview

- Total budget vs. spent amounts
- Utilization percentage with color-coded alerts
- Remaining budget calculations
- Total agent executions count

#### Campaign Management

- Per-campaign cost tracking
- Budget limit enforcement
- Top-spending campaign identification
- Agent usage breakdown per campaign

#### Agent Analytics

- Cost per agent type
- Execution frequency and success rates
- Average cost per execution
- Token usage patterns

#### Budget Controls

- Monthly budget cap setting
- Alert threshold configuration (default: 80%)
- Emergency budget override toggle
- Audit logging for all budget actions

## 🚨 Monitoring & Alerts

### Automated Budget Monitoring

Run the budget monitor script:

```bash
# Full budget check with alerts
npm run budget:check

# Generate cost report only
npm run budget:report

# Or run directly
ts-node scripts/budget-monitor.ts check
```

### Alert Thresholds

1. **Warning (80%)**: Yellow alert, normal operation continues
2. **Critical (95%)**: Orange alert, consider action
3. **Exceeded (100%+)**: Red alert, executions blocked unless override enabled

### Alert Channels

Alerts are logged to:

- Console output with emoji indicators
- `logs/budget/budget-alerts.log` for budget alerts
- `logs/budget/campaign-alerts.log` for campaign alerts
- `logs/budget/alert-{timestamp}.json` for critical alerts

## 📈 Cost Reporting

### Automated Reports

Monthly cost reports are generated in `logs/budget/cost-report-{YYYY-MM}.md`
containing:

- Monthly spending overview
- Campaign cost breakdown
- Agent usage statistics
- Cost optimization suggestions

### Report Contents

```markdown
# Budget Report - 2024-01

## 📊 Monthly Overview

- Total Budget: $1,000.00
- Total Spent: $247.56
- Utilization: 24.8%
- Remaining: $752.44
- Total Executions: 1,247

## 🎯 Campaign Breakdown

### Marketing Campaign Q1 (CONTENT_GENERATION)

- Cost: $89.23
- Budget: $200.00
- Utilization: 44.6%

## 🤖 Agent Usage

### CONTENT

- Total Cost: $89.23
- Tokens Used: 2,230,750
- Executions: 156
- Avg Cost/Execution: $0.0572
```

## 🔧 Configuration

### Environment Variables

```bash
# Budget system configuration
MAX_MONTHLY_BUDGET=1000
DEFAULT_ALERT_THRESHOLD=0.8
ENABLE_BUDGET_OVERRIDE=false

# Database connection for cost tracking
DATABASE_URL="postgresql://..."
```

### Cost Constants

Agent cost rates (per 1K tokens):

```typescript
const AGENT_COST_PER_1K_TOKENS = {
  CONTENT: 0.04, // $0.04 per 1K tokens
  SEO: 0.03, // $0.03 per 1K tokens
  EMAIL_MARKETING: 0.05,
  AD: 0.06, // Higher cost for ad optimization
  DESIGN: 0.07, // Highest cost for design generation
  // ... other agents
};
```

## 🛡️ Security & Compliance

### Access Control

Budget management requires:

- Admin role permissions
- Authenticated session
- Audit logging for all changes

### Data Privacy

- No sensitive campaign data in logs
- Anonymized cost tracking
- GDPR-compliant data retention

### Audit Trail

All budget actions are logged:

- Budget changes with timestamps
- Override activations
- Alert triggers
- Cost anomalies

## 🚀 Best Practices

### 1. Set Realistic Budgets

```typescript
// Monthly budget planning
const monthlyBudget = {
  development: 500, // $500 for dev environment
  staging: 1000, // $1000 for staging
  production: 5000, // $5000 for production
};
```

### 2. Monitor High-Cost Agents

Keep an eye on:

- **Design agents** (highest token usage)
- **Ad optimization** (complex reasoning)
- **Content generation** (volume-based)

### 3. Campaign Budget Allocation

```typescript
// Campaign-specific budgets
const campaignBudgets = {
  'content-marketing': 800,
  'ad-optimization': 1200,
  'social-media': 400,
  'email-campaigns': 600,
};
```

### 4. Cost Optimization

- Use prompt optimization to reduce token usage
- Implement caching for repeated requests
- Choose appropriate model sizes for tasks
- Monitor retry rates and optimize error handling

## 📝 Troubleshooting

### Common Issues

#### 1. Budget Check Failures

```bash
Error: Failed to check budget status
```

**Solution**: Ensure database connection and monthly budget record exists.

#### 2. Cost Tracking Not Working

```bash
Warning: Failed to track agent cost
```

**Solution**: Check Prisma client configuration and database permissions.

#### 3. Dashboard Not Loading Data

**Solution**: Verify tRPC routes are properly configured and database is
accessible.

### Debug Commands

```bash
# Check database connection
npx prisma db push

# Verify budget records
npx prisma studio

# Test budget monitoring
ts-node scripts/budget-monitor.ts check
```

## 🔄 Migration Guide

### From Previous Versions

If upgrading from a previous NeonHub version:

1. **Run database migrations**:

   ```bash
   npx prisma migrate deploy
   ```

2. **Initialize monthly budget**:

   ```bash
   ts-node scripts/budget-monitor.ts check
   ```

3. **Update existing agents** to use `BudgetTracker`

4. **Configure admin access** for budget dashboard

### Rollback Plan

To disable budget tracking:

1. Set `ENABLE_BUDGET_TRACKING=false`
2. Remove budget checks from agent code
3. Dashboard will show historical data only

---

## 📞 Support

For issues with the budget tracking system:

- Check the troubleshooting section above
- Review logs in `logs/budget/`
- Ensure all environment variables are set
- Verify database schema is up to date

**Emergency Budget Override**: Access `/admin/budget` and enable override mode
to temporarily bypass budget limits while investigating issues.
