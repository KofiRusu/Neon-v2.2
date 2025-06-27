import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { AgentType } from '@prisma/client';
import { RefinementTask } from './SuggestionProcessor';

export interface PromptTemplate {
  agentType: AgentType;
  version: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  parameters: Record<string, any>;
  metadata: {
    createdAt: Date;
    optimizedFrom?: string;
    optimizationReason?: string;
    expectedImprovements: string[];
  };
}

export interface PromptComparisonResult {
  originalVersion: string;
  optimizedVersion: string;
  tokenReduction: number;
  costReduction: number;
  qualityScore: number;
  recommendApproval: boolean;
  improvements: string[];
  concerns: string[];
}

export class PromptAutoUpdater {
  private promptsDir: string;
  private versionsDir: string;

  constructor() {
    this.promptsDir = join(process.cwd(), 'agent-prompts');
    this.versionsDir = join(this.promptsDir, 'v2');
    this.ensureDirectories();
  }

  /**
   * Ensure prompt directories exist
   */
  private ensureDirectories(): void {
    if (!existsSync(this.promptsDir)) {
      mkdirSync(this.promptsDir, { recursive: true });
    }
    if (!existsSync(this.versionsDir)) {
      mkdirSync(this.versionsDir, { recursive: true });
    }
  }

  /**
   * Process prompt simplification task
   */
  async processPromptSimplification(task: RefinementTask): Promise<PromptTemplate> {
    const currentPrompt = await this.loadCurrentPrompt(task.agentType);
    const optimizedPrompt = await this.optimizePrompt(currentPrompt, task);

    // Save optimized version
    const optimizedTemplate = await this.saveOptimizedPrompt(optimizedPrompt, task);

    return optimizedTemplate;
  }

  /**
   * Load current prompt template for agent
   */
  private async loadCurrentPrompt(agentType: AgentType): Promise<PromptTemplate> {
    const promptPath = join(this.promptsDir, `${agentType.toLowerCase()}.prompt.ts`);

    // If no current prompt exists, create a default one
    if (!existsSync(promptPath)) {
      return this.createDefaultPrompt(agentType);
    }

    try {
      const promptContent = readFileSync(promptPath, 'utf8');
      return this.parsePromptFile(promptContent, agentType);
    } catch (error) {
      console.warn(`Failed to load prompt for ${agentType}, using default:`, error);
      return this.createDefaultPrompt(agentType);
    }
  }

  /**
   * Create default prompt template for agent type
   */
  private createDefaultPrompt(agentType: AgentType): PromptTemplate {
    const defaultPrompts: Record<AgentType, string> = {
      [AgentType.CONTENT]: `You are a content creation specialist. Generate high-quality, engaging content that aligns with brand voice and marketing objectives.

Task: Create content for the specified format and audience.
Requirements:
- Follow brand guidelines
- Optimize for engagement
- Include relevant keywords
- Maintain consistent tone

Format your response with clear structure and actionable content.`,

      [AgentType.AD]: `You are an advertising optimization expert. Create and optimize ad campaigns for maximum ROI and performance.

Task: Generate advertising content and strategy recommendations.
Requirements:
- Focus on conversion optimization
- Target audience alignment
- Budget efficiency
- Performance tracking

Provide specific, measurable recommendations.`,

      [AgentType.SEO]: `You are an SEO optimization specialist. Analyze and improve content for search engine performance.

Task: Provide SEO analysis and optimization recommendations.
Requirements:
- Keyword optimization
- Technical SEO factors
- Content structure
- Performance metrics

Focus on actionable, high-impact improvements.`,

      [AgentType.SOCIAL]: `You are a social media strategist. Create engaging social content and campaign strategies.

Task: Develop social media content and strategy.
Requirements:
- Platform-specific optimization
- Engagement focus
- Brand consistency
- Trend awareness

Deliver platform-optimized, engaging content.`,

      [AgentType.EMAIL]: `You are an email marketing specialist. Create effective email campaigns and sequences.

Task: Generate email content and campaign strategies.
Requirements:
- Personalization
- Conversion focus
- Subject line optimization
- Segmentation strategy

Provide email content optimized for engagement and conversion.`,

      [AgentType.TREND]: `You are a trend analysis expert. Identify and analyze market trends for strategic insights.

Task: Analyze trends and provide strategic recommendations.
Requirements:
- Data-driven insights
- Market analysis
- Competitive intelligence
- Future predictions

Deliver actionable trend insights and recommendations.`,

      [AgentType.INSIGHT]: `You are a marketing insights analyst. Generate data-driven insights and recommendations.

Task: Analyze data and provide strategic insights.
Requirements:
- Statistical analysis
- Performance metrics
- ROI calculations
- Strategic recommendations

Focus on actionable, data-backed insights.`,

      [AgentType.DESIGN]: `You are a design strategist. Provide design recommendations and creative direction.

Task: Generate design strategy and recommendations.
Requirements:
- Brand alignment
- User experience focus
- Visual hierarchy
- Conversion optimization

Deliver clear, actionable design guidance.`,

      [AgentType.WHATSAPP]: `You are a WhatsApp marketing specialist. Create engaging messaging strategies.

Task: Develop WhatsApp marketing content and strategy.
Requirements:
- Conversational tone
- Quick response focus
- Personalization
- Action-oriented

Provide WhatsApp-optimized messaging strategies.`,

      [AgentType.SUPPORT]: `You are a customer support specialist. Provide helpful, professional support responses.

Task: Generate support responses and strategies.
Requirements:
- Problem-solving focus
- Professional tone
- Clear instructions
- Customer satisfaction

Deliver helpful, solution-focused support content.`,

      [AgentType.BRAND_VOICE]: `You are a brand voice specialist. Ensure consistent brand communication across all channels.

Task: Analyze and optimize brand voice consistency.
Requirements:
- Brand guidelines compliance
- Tone consistency
- Message alignment
- Voice guidelines

Provide brand voice analysis and recommendations.`,

      [AgentType.CAMPAIGN]: `You are a campaign strategy expert. Design and optimize marketing campaigns.

Task: Develop comprehensive campaign strategies.
Requirements:
- Multi-channel approach
- Goal alignment
- Performance optimization
- ROI focus

Deliver strategic, results-driven campaign plans.`,

      [AgentType.OUTREACH]: `You are an outreach specialist. Create effective outreach strategies and content.

Task: Generate outreach campaigns and content.
Requirements:
- Personalization
- Relationship building
- Value proposition
- Response optimization

Provide effective outreach strategies and templates.`,
    };

    return {
      agentType,
      version: 'v1.0',
      prompt: defaultPrompts[agentType] || 'You are a helpful marketing AI assistant.',
      temperature: 0.7,
      maxTokens: 1000,
      parameters: {},
      metadata: {
        createdAt: new Date(),
        expectedImprovements: ['Initial default prompt template'],
      },
    };
  }

  /**
   * Parse prompt file content into PromptTemplate
   */
  private parsePromptFile(content: string, agentType: AgentType): PromptTemplate {
    // Extract prompt sections using regex
    const promptMatch = content.match(/prompt:\s*`([^`]+)`/s);
    const temperatureMatch = content.match(/temperature:\s*([0-9.]+)/);
    const maxTokensMatch = content.match(/maxTokens:\s*([0-9]+)/);
    const versionMatch = content.match(/version:\s*['"]([^'"]+)['"]/);

    return {
      agentType,
      version: versionMatch?.[1] || 'v1.0',
      prompt: promptMatch?.[1] || 'Default prompt',
      temperature: parseFloat(temperatureMatch?.[1] || '0.7'),
      maxTokens: parseInt(maxTokensMatch?.[1] || '1000'),
      parameters: {},
      metadata: {
        createdAt: new Date(),
        expectedImprovements: ['Parsed from existing file'],
      },
    };
  }

  /**
   * Optimize prompt based on refinement task
   */
  private async optimizePrompt(
    currentPrompt: PromptTemplate,
    task: RefinementTask
  ): Promise<PromptTemplate> {
    let optimizedPrompt = { ...currentPrompt };
    optimizedPrompt.version = this.generateNewVersion(currentPrompt.version);
    optimizedPrompt.metadata = {
      ...currentPrompt.metadata,
      createdAt: new Date(),
      optimizedFrom: currentPrompt.version,
      optimizationReason: task.description,
      expectedImprovements: [],
    };

    switch (task.taskType) {
      case 'PROMPT_SIMPLIFICATION':
        optimizedPrompt = await this.simplifyPrompt(optimizedPrompt, task);
        break;
      case 'MODEL_DOWNGRADE':
        optimizedPrompt = await this.optimizeForModelDowngrade(optimizedPrompt, task);
        break;
      case 'RETRY_OPTIMIZATION':
        optimizedPrompt = await this.optimizeForReliability(optimizedPrompt, task);
        break;
      case 'QUALITY_ENHANCEMENT':
        optimizedPrompt = await this.enhanceQuality(optimizedPrompt, task);
        break;
    }

    return optimizedPrompt;
  }

  /**
   * Simplify prompt to reduce token usage
   */
  private async simplifyPrompt(
    prompt: PromptTemplate,
    task: RefinementTask
  ): Promise<PromptTemplate> {
    let simplifiedPrompt = prompt.prompt;
    const improvements: string[] = [];

    // Remove excessive examples and verbose explanations
    simplifiedPrompt = simplifiedPrompt
      .replace(/For example[^.]*\./g, '') // Remove example sentences
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove multiple line breaks
      .trim();

    // Reduce temperature for more focused output
    prompt.temperature = Math.max(0.3, prompt.temperature - 0.2);
    improvements.push(`Reduced temperature to ${prompt.temperature} for more focused output`);

    // Reduce max tokens if cost reduction is significant
    if (task.expectedSavings > 50) {
      prompt.maxTokens = Math.max(500, Math.floor(prompt.maxTokens * 0.8));
      improvements.push(`Reduced max tokens to ${prompt.maxTokens} for cost efficiency`);
    }

    // Create more concise, action-oriented prompt
    const lines = simplifiedPrompt.split('\n').filter(line => line.trim());
    const essentialLines = lines.filter(
      line =>
        line.includes('Task:') ||
        line.includes('Requirements:') ||
        line.includes('-') ||
        line.length < 100 // Keep only concise lines
    );

    prompt.prompt = essentialLines.join('\n');
    improvements.push('Removed verbose explanations and examples');
    improvements.push('Focused on essential task requirements');

    prompt.metadata.expectedImprovements = improvements;
    return prompt;
  }

  /**
   * Optimize prompt for model downgrade (gpt-4 -> gpt-4o-mini)
   */
  private async optimizeForModelDowngrade(
    prompt: PromptTemplate,
    task: RefinementTask
  ): Promise<PromptTemplate> {
    const improvements: string[] = [];

    // Add more specific instructions for smaller model
    const enhancedPrompt = `${prompt.prompt}

IMPORTANT: Provide direct, specific responses. Focus on:
1. Clear, actionable recommendations
2. Specific numbers and metrics when possible
3. Structured format for easy parsing
4. Avoid lengthy explanations

Output format: Use bullet points and clear sections.`;

    prompt.prompt = enhancedPrompt;
    prompt.temperature = 0.5; // More focused for smaller model
    improvements.push('Added specific instructions for model efficiency');
    improvements.push('Optimized for gpt-4o-mini model capabilities');
    improvements.push('Reduced temperature for more consistent output');

    prompt.parameters.targetModel = task.parameters.targetModel || 'gpt-4o-mini';
    prompt.metadata.expectedImprovements = improvements;

    return prompt;
  }

  /**
   * Optimize prompt for reliability (reduce retries)
   */
  private async optimizeForReliability(
    prompt: PromptTemplate,
    task: RefinementTask
  ): Promise<PromptTemplate> {
    const improvements: string[] = [];

    // Add validation and error prevention
    const reliablePrompt = `${prompt.prompt}

VALIDATION REQUIREMENTS:
- Verify all outputs meet specified criteria
- Include confidence score (1-10) for your response
- If uncertain, provide best available option with explanation
- Use consistent formatting as shown in examples

Quality check: Ensure response is complete and addresses all requirements.`;

    prompt.prompt = reliablePrompt;
    prompt.temperature = Math.max(0.3, prompt.temperature - 0.1); // More consistent
    improvements.push('Added validation requirements to reduce failures');
    improvements.push('Included confidence scoring for output quality');
    improvements.push('Enhanced error prevention instructions');

    prompt.metadata.expectedImprovements = improvements;
    return prompt;
  }

  /**
   * Enhance prompt quality for better impact
   */
  private async enhanceQuality(
    prompt: PromptTemplate,
    task: RefinementTask
  ): Promise<PromptTemplate> {
    const improvements: string[] = [];

    // Add quality enhancement sections
    const qualityPrompt = `${prompt.prompt}

QUALITY ENHANCEMENT:
- Provide specific, measurable recommendations
- Include relevant metrics and KPIs
- Consider industry best practices
- Align with business objectives
- Offer implementation steps

Success criteria: Response should be actionable and drive measurable results.`;

    prompt.prompt = qualityPrompt;
    improvements.push('Added quality enhancement requirements');
    improvements.push('Included success criteria for better outcomes');
    improvements.push('Enhanced focus on measurable results');

    prompt.metadata.expectedImprovements = improvements;
    return prompt;
  }

  /**
   * Generate new version number
   */
  private generateNewVersion(currentVersion: string): string {
    const versionMatch = currentVersion.match(/v?(\d+)\.(\d+)/);
    if (versionMatch) {
      const major = parseInt(versionMatch[1]);
      const minor = parseInt(versionMatch[2]);
      return `v${major}.${minor + 1}`;
    }
    return 'v2.0';
  }

  /**
   * Save optimized prompt to v2 directory
   */
  private async saveOptimizedPrompt(
    prompt: PromptTemplate,
    task: RefinementTask
  ): Promise<PromptTemplate> {
    const filename = `${prompt.agentType}.prompt.ts`;
    const filepath = join(this.versionsDir, filename);

    const promptFileContent = this.generatePromptFileContent(prompt, task);

    writeFileSync(filepath, promptFileContent);

    return prompt;
  }

  /**
   * Generate TypeScript file content for prompt
   */
  private generatePromptFileContent(prompt: PromptTemplate, task: RefinementTask): string {
    return `// Auto-generated optimized prompt for ${prompt.agentType}
// Generated: ${new Date().toISOString()}
// Optimized from: ${prompt.metadata.optimizedFrom || 'default'}
// Optimization reason: ${prompt.metadata.optimizationReason || 'efficiency improvement'}

export const ${prompt.agentType.toLowerCase()}PromptV2 = {
  version: "${prompt.version}",
  agentType: "${prompt.agentType}",
  
  prompt: \`${prompt.prompt}\`,
  
  temperature: ${prompt.temperature},
  maxTokens: ${prompt.maxTokens},
  
  optimization: {
    taskId: "${task.id}",
    expectedSavings: ${task.expectedSavings},
    optimizationType: "${task.taskType}",
    improvements: [
${prompt.metadata.expectedImprovements.map(imp => `      "${imp}"`).join(',\n')}
    ]
  },
  
  metadata: {
    createdAt: "${prompt.metadata.createdAt.toISOString()}",
    optimizedFrom: "${prompt.metadata.optimizedFrom || 'v1.0'}",
    optimizationReason: "${prompt.metadata.optimizationReason || ''}",
  }
};

export default ${prompt.agentType.toLowerCase()}PromptV2;
`;
  }

  /**
   * Run comparison test between original and optimized prompt
   */
  async runComparisonTest(
    originalPrompt: PromptTemplate,
    optimizedPrompt: PromptTemplate,
    testInput: string = 'Generate a marketing strategy for a new product launch'
  ): Promise<PromptComparisonResult> {
    // Simulate prompt testing (in production, this would call actual LLM)
    const originalTokens = this.estimateTokens(originalPrompt.prompt + testInput);
    const optimizedTokens = this.estimateTokens(optimizedPrompt.prompt + testInput);

    const tokenReduction = ((originalTokens - optimizedTokens) / originalTokens) * 100;
    const costReduction = tokenReduction * 0.8; // Approximate cost reduction

    // Simulate quality scoring
    const qualityScore = this.calculateQualityScore(optimizedPrompt);

    const improvements: string[] = [];
    const concerns: string[] = [];

    if (tokenReduction > 20) {
      improvements.push(`Significant token reduction: ${tokenReduction.toFixed(1)}%`);
    }

    if (costReduction > 15) {
      improvements.push(`Cost reduction: ${costReduction.toFixed(1)}%`);
    }

    if (qualityScore > 0.8) {
      improvements.push('Quality score maintained above 80%');
    } else if (qualityScore < 0.6) {
      concerns.push('Quality score below 60% - review needed');
    }

    if (tokenReduction < 5) {
      concerns.push('Minimal token reduction achieved');
    }

    return {
      originalVersion: originalPrompt.version,
      optimizedVersion: optimizedPrompt.version,
      tokenReduction,
      costReduction,
      qualityScore,
      recommendApproval: qualityScore > 0.7 && tokenReduction > 10,
      improvements,
      concerns,
    };
  }

  /**
   * Estimate token count for prompt
   */
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate quality score for optimized prompt
   */
  private calculateQualityScore(prompt: PromptTemplate): number {
    let score = 0.5; // Base score

    // Check for specific instructions
    if (prompt.prompt.includes('Requirements:')) score += 0.1;
    if (prompt.prompt.includes('Task:')) score += 0.1;
    if (prompt.prompt.includes('Format:')) score += 0.1;

    // Check for validation
    if (prompt.prompt.includes('validation') || prompt.prompt.includes('verify')) score += 0.1;

    // Check for specificity
    if (prompt.prompt.includes('specific') || prompt.prompt.includes('measurable')) score += 0.1;

    // Temperature optimization
    if (prompt.temperature >= 0.3 && prompt.temperature <= 0.7) score += 0.1;

    return Math.min(1.0, score);
  }

  /**
   * Get all optimized prompts
   */
  getOptimizedPrompts(): string[] {
    if (!existsSync(this.versionsDir)) return [];

    const fs = require('fs');
    return fs
      .readdirSync(this.versionsDir)
      .filter((file: string) => file.endsWith('.prompt.ts'))
      .map((file: string) => join(this.versionsDir, file));
  }
}
