#!/usr/bin/env tsx

import {
  AgentCostEfficiencyAnalyzer,
  type OptimizationSuggestion,
  type AgentEfficiencyMetrics,
} from '../packages/core-agents/src/utils/agentCostEfficiency';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface OptimizationReport {
  generatedAt: Date;
  timeframe: { start: Date; end: Date };
  summary: {
    totalAgentsAnalyzed: number;
    criticalAgents: number;
    poorAgents: number;
    totalPotentialSavings: number;
  };
  agentMetrics: AgentEfficiencyMetrics[];
  suggestions: OptimizationSuggestion[];
  recommendedActions: string[];
}

class AgentCostOptimizer {
  private analyzer: AgentCostEfficiencyAnalyzer;
  private logDir: string;

  constructor() {
    this.analyzer = new AgentCostEfficiencyAnalyzer();
    this.logDir = join(process.cwd(), 'logs', 'optimization');
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  async generateOptimizationReport(daysBack: number = 30): Promise<OptimizationReport> {
    console.log(`🔍 Analyzing agent cost efficiency for the last ${daysBack} days...`);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const timeframe = { start: startDate, end: endDate };

    // Get agent efficiency metrics
    const agentMetrics = await this.analyzer.getAgentEfficiencyMetrics(undefined, timeframe);

    // Get optimization suggestions
    const suggestions = await this.analyzer.generateOptimizationSuggestions(timeframe);

    // Calculate summary statistics
    const criticalAgents = agentMetrics.filter(m => m.efficiencyRating === 'CRITICAL').length;
    const poorAgents = agentMetrics.filter(m => m.efficiencyRating === 'POOR').length;
    const totalPotentialSavings = suggestions.reduce((sum, s) => sum + s.expectedSavings, 0);

    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(agentMetrics, suggestions);

    const report: OptimizationReport = {
      generatedAt: new Date(),
      timeframe,
      summary: {
        totalAgentsAnalyzed: agentMetrics.length,
        criticalAgents,
        poorAgents,
        totalPotentialSavings,
      },
      agentMetrics,
      suggestions,
      recommendedActions,
    };

    return report;
  }

  private generateRecommendedActions(
    metrics: AgentEfficiencyMetrics[],
    suggestions: OptimizationSuggestion[]
  ): string[] {
    const actions: string[] = [];

    // Identify worst performers
    const criticalAgents = metrics.filter(m => m.efficiencyRating === 'CRITICAL');
    const highCostAgents = metrics.filter(m => m.avgCost > 0.05);
    const lowQualityAgents = metrics.filter(m => m.qualityScore < 0.5);

    if (criticalAgents.length > 0) {
      actions.push(
        `🚨 URGENT: Review ${criticalAgents.map(a => a.agentType).join(', ')} agents - critical efficiency issues detected`
      );
    }

    if (highCostAgents.length > 0) {
      actions.push(
        `💰 HIGH COST: Consider model downgrades for ${highCostAgents.map(a => a.agentType).join(', ')} agents`
      );
    }

    if (lowQualityAgents.length > 0) {
      actions.push(
        `🎯 LOW QUALITY: Refine prompts for ${lowQualityAgents.map(a => a.agentType).join(', ')} agents`
      );
    }

    // High-impact suggestions
    const highPrioritySuggestions = suggestions.filter(s => s.priority === 'HIGH');
    if (highPrioritySuggestions.length > 0) {
      actions.push(
        `⚡ QUICK WINS: Implement ${highPrioritySuggestions.length} high-priority optimizations for immediate savings`
      );
    }

    // Potential savings summary
    const totalSavings = suggestions.reduce((sum, s) => sum + s.expectedSavings, 0);
    if (totalSavings > 50) {
      actions.push(
        `💵 SAVINGS OPPORTUNITY: $${totalSavings.toFixed(2)} monthly savings potential identified`
      );
    }

    return actions;
  }

  async generateMarkdownReport(report: OptimizationReport): Promise<string> {
    const reportPath = join(this.logDir, 'agent-efficiency-report.md');

    const markdown = `# 🤖 Agent Cost Efficiency Report

**Generated:** ${report.generatedAt.toISOString()}
**Analysis Period:** ${report.timeframe.start.toDateString()} - ${report.timeframe.end.toDateString()}

---

## 📊 Executive Summary

- **Agents Analyzed:** ${report.summary.totalAgentsAnalyzed}
- **Critical Issues:** ${report.summary.criticalAgents} agents
- **Poor Performance:** ${report.summary.poorAgents} agents  
- **Potential Monthly Savings:** $${report.summary.totalPotentialSavings.toFixed(2)}

### 🎯 Recommended Actions

${report.recommendedActions.map(action => `- ${action}`).join('\n')}

---

## 📈 Agent Performance Analysis

| Agent Type | Runs | Avg Cost | Impact Score | Conversion Rate | Efficiency | Status |
|------------|------|----------|--------------|-----------------|------------|--------|
${report.agentMetrics
  .map(
    metric =>
      `| ${metric.agentType} | ${metric.totalRuns} | $${metric.avgCost.toFixed(4)} | ${metric.avgImpactScore.toFixed(2)} | ${metric.conversionRate.toFixed(1)}% | ${metric.costPerImpact === Infinity ? '∞' : metric.costPerImpact.toFixed(4)} | ${this.getStatusEmoji(metric.efficiencyRating)} ${metric.efficiencyRating} |`
  )
  .join('\n')}

---

## 🛠️ Optimization Suggestions

### High Priority
${report.suggestions
  .filter(s => s.priority === 'HIGH')
  .map(
    suggestion => `
#### ${suggestion.agentType} - ${suggestion.category}
**Priority:** 🔴 ${suggestion.priority}
**Suggestion:** ${suggestion.suggestion}
**Expected Savings:** $${suggestion.expectedSavings.toFixed(2)}/month
**Implementation:** ${suggestion.implementationEffort} effort
`
  )
  .join('\n')}

### Medium Priority
${report.suggestions
  .filter(s => s.priority === 'MEDIUM')
  .map(
    suggestion => `
#### ${suggestion.agentType} - ${suggestion.category}
**Priority:** 🟡 ${suggestion.priority}
**Suggestion:** ${suggestion.suggestion}
**Expected Savings:** $${suggestion.expectedSavings.toFixed(2)}/month
**Implementation:** ${suggestion.implementationEffort} effort
`
  )
  .join('\n')}

---

## 📋 Detailed Agent Analysis

${report.agentMetrics
  .map(
    metric => `
### ${metric.agentType} Agent ${this.getStatusEmoji(metric.efficiencyRating)}

**Performance Metrics:**
- Total Runs: ${metric.totalRuns}
- Average Cost: $${metric.avgCost.toFixed(4)}
- Average Tokens: ${metric.avgTokens.toFixed(0)}
- Impact Score: ${metric.avgImpactScore.toFixed(2)}/1.0
- Conversion Rate: ${metric.conversionRate.toFixed(1)}%
- Quality Score: ${metric.qualityScore.toFixed(2)}/1.0
- Average Retries: ${metric.avgRetryCount.toFixed(1)}
- Execution Time: ${metric.avgExecutionTime.toFixed(0)}ms

**Efficiency Analysis:**
- Cost per Impact: ${metric.costPerImpact === Infinity ? '∞' : `$${metric.costPerImpact.toFixed(4)}`}
- Cost per Conversion: ${metric.costPerConversion === Infinity ? '∞' : `$${metric.costPerConversion.toFixed(4)}`}
- Overall Rating: **${metric.efficiencyRating}**

**Recommended Optimizations:**
${metric.recommendedOptimizations.map(opt => `- ${opt}`).join('\n')}
`
  )
  .join('\n')}

---

## 🔮 Next Steps

1. **Immediate Actions** (This Week):
   - Review critical and poor performing agents
   - Implement high-priority suggestions with low effort
   - Update prompts for worst-performing agent types

2. **Short-term Goals** (This Month):
   - Test model downgrades for high-cost agents
   - Implement retry logic improvements
   - Add quality validation steps

3. **Long-term Strategy** (Next Quarter):
   - Establish automated optimization monitoring
   - Create agent performance benchmarks
   - Implement continuous improvement feedback loops

---

*Report generated by NeonHub Agent Cost Optimizer*
*For questions, review the optimization suggestions or contact the development team*
`;

    writeFileSync(reportPath, markdown);
    return reportPath;
  }

  private getStatusEmoji(rating: string): string {
    switch (rating) {
      case 'EXCELLENT':
        return '🟢';
      case 'GOOD':
        return '🟢';
      case 'AVERAGE':
        return '🟡';
      case 'POOR':
        return '🟠';
      case 'CRITICAL':
        return '🔴';
      default:
        return '⚪';
    }
  }

  async generateImplementationSuggestions(suggestions: OptimizationSuggestion[]): Promise<string> {
    const implPath = join(this.logDir, 'implementation-guide.md');

    const highPriority = suggestions.filter(s => s.priority === 'HIGH');
    const worstAgent = highPriority[0]?.agentType;

    const markdown = `# 🚀 Agent Optimization Implementation Guide

## 🎯 Quick Win Actions (1-2 hours)

### 1. Model Downgrade for High-Cost Agents
\`\`\`typescript
// Update cost-tracker.ts AGENT_COST_PER_1K_TOKENS
export const AGENT_COST_PER_1K_TOKENS = {
  ${highPriority
    .filter(s => s.category === 'COST')
    .map(s => `${s.agentType}: 0.01, // Reduced from current cost`)
    .join('\n  ')}
};
\`\`\`

### 2. Prompt Simplification
\`\`\`typescript
// Example for ${worstAgent || 'CONTENT'} agent
const optimizedPrompt = \`
Generate [specific output] for [context].
Requirements: [bullet points]
Format: [exact format needed]
\`;
// Remove unnecessary examples and verbose instructions
\`\`\`

## 🛠️ Medium Priority Improvements (1-2 days)

### 3. Add Quality Validation
\`\`\`typescript
// Enhanced cost tracking with quality scoring
const result = await runLLMTaskWithCostTracking(taskConfig, {
  ...costConfig,
  qualityValidator: (output) => calculateQualityScore(output),
  impactTracker: (result) => trackBusinessImpact(result),
});
\`\`\`

### 4. Retry Logic Optimization
\`\`\`typescript
// Implement smart retry with exponential backoff
const retryConfig = {
  maxRetries: 2, // Reduced from 3+
  backoffMs: 1000,
  retryConditions: ['rate_limit', 'timeout'], // Not quality issues
};
\`\`\`

## 📋 Implementation Checklist

- [ ] Update model configuration for high-cost agents
- [ ] Simplify prompts for worst-performing agents
- [ ] Add quality scoring to billing logs
- [ ] Implement impact tracking
- [ ] Test optimizations in staging
- [ ] Monitor cost changes for 1 week
- [ ] Generate follow-up optimization report

## 🔍 Monitoring & Validation

After implementing changes, run:
\`\`\`bash
# Check optimization impact
npm run agent-optimizer -- --compare-before-after

# Monitor for 1 week, then generate new report
npm run agent-optimizer -- --days-back 7
\`\`\`

---
*Generated by NeonHub Agent Cost Optimizer*
`;

    writeFileSync(implPath, markdown);
    return implPath;
  }

  async close(): Promise<void> {
    await this.analyzer.close();
  }
}

// CLI execution
async function main() {
  const daysBack = parseInt(process.argv[2]) || 30;
  const optimizer = new AgentCostOptimizer();

  try {
    console.log('🚀 Starting Agent Cost Optimization Analysis...\n');

    // Generate comprehensive report
    const report = await optimizer.generateOptimizationReport(daysBack);

    // Save markdown report
    const reportPath = await optimizer.generateMarkdownReport(report);
    console.log(`📊 Detailed report saved: ${reportPath}`);

    // Generate implementation guide
    const guidePath = await optimizer.generateImplementationSuggestions(report.suggestions);
    console.log(`🛠️ Implementation guide saved: ${guidePath}`);

    // Console summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📈 AGENT OPTIMIZATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`🤖 Agents Analyzed: ${report.summary.totalAgentsAnalyzed}`);
    console.log(`🔴 Critical Issues: ${report.summary.criticalAgents}`);
    console.log(`🟠 Poor Performance: ${report.summary.poorAgents}`);
    console.log(`💰 Potential Savings: $${report.summary.totalPotentialSavings.toFixed(2)}/month`);

    if (report.recommendedActions.length > 0) {
      console.log('\n🎯 TOP RECOMMENDATIONS:');
      report.recommendedActions.slice(0, 3).forEach(action => {
        console.log(`   ${action}`);
      });
    }

    const highPriority = report.suggestions.filter(s => s.priority === 'HIGH');
    if (highPriority.length > 0) {
      console.log(
        `\n⚡ ${highPriority.length} high-priority optimizations ready for implementation`
      );
      console.log(`📋 See implementation guide: ${guidePath}`);
    }

    console.log('\n✅ Optimization analysis complete!');
  } catch (error) {
    console.error('❌ Optimization analysis failed:', error);
    process.exit(1);
  } finally {
    await optimizer.close();
  }
}

if (require.main === module) {
  main();
}

export { AgentCostOptimizer };
