import { AbstractAgent } from '../base-agent';
import type { AgentResult, AgentPayload } from '../base-agent';
import OpenAI from 'openai';
import { logger } from '@neon/utils';
import * as fs from 'fs/promises';
import * as path from 'path';

// Core interfaces for customer support
export interface MessageClassificationInput {
  text: string;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    history?: Array<{
      message: string;
      timestamp: Date;
      channel: string;
    }>;
  };
  context?: {
    channel: 'whatsapp' | 'email' | 'chat' | 'phone' | 'social';
    previousInteractions?: number;
    customerTier?: 'basic' | 'premium' | 'enterprise';
  };
}

export interface MessageClassificationOutput {
  intent:
    | 'inquiry'
    | 'complaint'
    | 'refund'
    | 'support'
    | 'compliment'
    | 'bug_report'
    | 'feature_request'
    | 'billing'
    | 'technical'
    | 'general';
  category: string;
  subcategory?: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  requiresHuman: boolean;
  suggestedActions: string[];
  keywords: string[];
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
}

export interface ReplyGenerationInput {
  message: string;
  classification?: MessageClassificationOutput;
  tone: 'professional' | 'friendly' | 'empathetic' | 'apologetic' | 'informative';
  customer?: {
    name?: string;
    tier?: 'basic' | 'premium' | 'enterprise';
    language?: string;
    preferences?: string[];
  };
  context?: {
    ticketHistory?: Array<{
      message: string;
      response?: string;
      timestamp: Date;
    }>;
    relatedArticles?: Array<{
      title: string;
      url: string;
      relevance: number;
    }>;
    previousResolution?: string;
  };
  constraints?: {
    maxLength?: number;
    includeLinks?: boolean;
    escalationAvailable?: boolean;
  };
}

export interface ReplyGenerationOutput {
  reply: string;
  tone: string;
  confidence: number;
  suggestedFollowUps: string[];
  escalationRecommended: boolean;
  estimatedResolutionTime: number; // minutes
  requiredActions: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    assignee?: string;
  }>;
  relatedResources: Array<{
    type: 'article' | 'faq' | 'tutorial' | 'contact';
    title: string;
    url?: string;
    description?: string;
  }>;
}

export interface SentimentAnalysisInput {
  message: string;
  context?: {
    previousMessages?: string[];
    customerHistory?: string;
    interactionType?: string;
  };
}

export interface SentimentAnalysisOutput {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  confidence: number;
  emotions: Array<{
    emotion: string;
    intensity: number;
  }>;
  urgencyIndicators: string[];
  escalationTriggers: string[];
  customerSatisfactionRisk: 'low' | 'medium' | 'high';
}

export interface EscalationInput {
  message: string;
  ticketId?: string;
  classification?: MessageClassificationOutput;
  sentiment?: SentimentAnalysisOutput;
  reason?: string;
  customerTier?: 'basic' | 'premium' | 'enterprise';
  agentWorkload?: number;
}

export interface EscalationOutput {
  shouldEscalate: boolean;
  escalationLevel: 'supervisor' | 'specialist' | 'manager' | 'senior_management';
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  suggestedAgent?: {
    id: string;
    name: string;
    skills: string[];
    availability: boolean;
  };
  estimatedWaitTime: number; // minutes
  alternativeActions: string[];
  escalationNotes: string;
}

export interface SupportTicket {
  id: string;
  customerId?: string;
  subject: string;
  message: string;
  channel: 'whatsapp' | 'email' | 'chat' | 'phone' | 'social';
  status: 'open' | 'in_progress' | 'pending_customer' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  satisfactionScore?: number;
  tags: string[];
  metadata: Record<string, any>;
}

export interface WhatsAppMessage {
  recipient: string;
  message: {
    type: 'text' | 'image' | 'document' | 'template';
    content: string;
    media?: {
      url: string;
      caption?: string;
      filename?: string;
    };
    template?: {
      name: string;
      language: string;
      parameters?: string[];
    };
  };
  settings: {
    businessId?: string;
    accessToken?: string;
    webhookUrl?: string;
  };
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  lastUpdated: Date;
  author: string;
  status: 'draft' | 'published' | 'archived';
}

// Add Twilio import
interface TwilioClient {
  messages: {
    create: (options: { from: string; to: string; body: string }) => Promise<{
      sid: string;
      status: string;
      errorCode?: string;
      errorMessage?: string;
    }>;
  };
}

let twilioClient: TwilioClient | null = null;

// Initialize Twilio client
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (error) {
  logger.warn(
    'Twilio not available, WhatsApp will run in mock mode',
    { error },
    'CustomerSupportAgent'
  );
}

export class CustomerSupportAgent extends AbstractAgent {
  private openai: OpenAI;
  private tickets: Map<string, SupportTicket> = new Map();
  private knowledgeBase: Map<string, KnowledgeBaseArticle> = new Map();

  constructor() {
    super('customer-support-agent', 'CustomerSupportAgent', 'support', [
      'classify_message',
      'generate_reply',
      'analyze_sentiment',
      'escalate_ticket',
      'create_ticket',
      'update_ticket',
      'send_whatsapp_message',
      'auto_respond',
      'manage_knowledge_base',
      'generate_summary',
      'track_satisfaction',
      'manage_queue',
    ]);

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!process.env.OPENAI_API_KEY) {
      logger.warn(
        'OPENAI_API_KEY not found. CustomerSupportAgent will run in limited mode.',
        {},
        'CustomerSupportAgent'
      );
    }

    this.initializeKnowledgeBase();
  }

  async execute(payload: AgentPayload): Promise<AgentResult> {
    return this.executeWithErrorHandling(payload, async () => {
      const { task, context } = payload;

      switch (task) {
        case 'classify_message':
          return await this.classifyMessageAI(context as MessageClassificationInput);
        case 'generate_reply':
          return await this.generateReplyAI(context as ReplyGenerationInput);
        case 'analyze_sentiment':
          return await this.analyzeSentimentAI(context as SentimentAnalysisInput);
        case 'escalate_ticket':
          return await this.escalateTicket(context as EscalationInput);
        case 'create_ticket':
          return await this.createTicket(context);
        case 'update_ticket':
          return await this.updateTicket(context);
        case 'send_whatsapp_message':
          return await this.sendWhatsAppMessage(context as WhatsAppMessage);
        case 'auto_respond':
          return await this.autoRespond(context);
        case 'manage_knowledge_base':
          return await this.manageKnowledgeBase(context);
        case 'generate_summary':
          return await this.generateTicketSummary(context);
        case 'track_satisfaction':
          return await this.trackCustomerSatisfaction(context);
        case 'manage_queue':
          return await this.manageTicketQueue(context);
        default:
          throw new Error(`Unknown task: ${task}`);
      }
    });
  }

  /**
   * Classify incoming support messages using AI
   */
  async classifyMessage(input: MessageClassificationInput): Promise<MessageClassificationOutput> {
    const { text, customer, context } = input;

    if (!this.openai) {
      return this.classifyMessageFallback(input);
    }

    try {
      const prompt = this.buildClassificationPrompt(text, customer, context);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert customer support message classifier. Analyze customer messages to determine intent, urgency, and required actions with high accuracy.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const aiOutput = response.choices[0]?.message?.content;
      if (!aiOutput) {
        throw new Error('No response from OpenAI');
      }

      return this.parseClassificationOutput(aiOutput, input);
    } catch (error) {
      await this.logAIFallback('message_classification', error);
      logger.error(
        'OpenAI message classification failed, using fallback',
        { error },
        'CustomerSupportAgent'
      );
      return this.classifyMessageFallback(input);
    }
  }

  /**
   * Generate AI-powered support replies
   */
  async generateReply(input: ReplyGenerationInput): Promise<ReplyGenerationOutput> {
    const { message, classification, tone, customer, context, constraints } = input;

    if (!this.openai) {
      return this.generateReplyFallback(input);
    }

    try {
      const prompt = this.buildReplyPrompt(
        message,
        classification,
        tone,
        customer,
        context,
        constraints
      );

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert customer support representative. Generate helpful, empathetic, and professional responses that resolve customer issues effectively.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const aiOutput = response.choices[0]?.message?.content;
      if (!aiOutput) {
        throw new Error('No response from OpenAI');
      }

      return this.parseReplyOutput(aiOutput, input);
    } catch (error) {
      await this.logAIFallback('reply_generation', error);
      logger.error(
        'OpenAI reply generation failed, using fallback',
        { error },
        'CustomerSupportAgent'
      );
      return this.generateReplyFallback(input);
    }
  }

  /**
   * Analyze customer sentiment using AI
   */
  async analyzeSentiment(input: SentimentAnalysisInput): Promise<SentimentAnalysisOutput> {
    const { message, context } = input;

    if (!this.openai) {
      return this.analyzeSentimentFallback(input);
    }

    try {
      const prompt = this.buildSentimentPrompt(message, context);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert sentiment analysis specialist. Analyze customer messages to determine emotional state, satisfaction level, and escalation risks.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 800,
      });

      const aiOutput = response.choices[0]?.message?.content;
      if (!aiOutput) {
        throw new Error('No response from OpenAI');
      }

      return this.parseSentimentOutput(aiOutput, input);
    } catch (error) {
      await this.logAIFallback('sentiment_analysis', error);
      logger.error(
        'OpenAI sentiment analysis failed, using fallback',
        { error },
        'CustomerSupportAgent'
      );
      return this.analyzeSentimentFallback(input);
    }
  }

  /**
   * Determine escalation requirements
   */
  async escalate(input: EscalationInput): Promise<EscalationOutput> {
    const { message, ticketId, classification, sentiment, reason, customerTier, agentWorkload } =
      input;

    // Determine escalation based on multiple factors
    const shouldEscalate = this.shouldEscalateTicket(
      classification,
      sentiment,
      customerTier,
      agentWorkload
    );

    let escalationLevel: 'supervisor' | 'specialist' | 'manager' | 'senior_management' =
      'supervisor';
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    if (sentiment?.sentiment === 'negative' && sentiment?.score < -0.7) {
      escalationLevel = 'manager';
      urgency = 'high';
    }

    if (customerTier === 'enterprise') {
      escalationLevel = 'specialist';
      urgency = 'high';
    }

    if (classification?.urgency === 'critical') {
      escalationLevel = 'manager';
      urgency = 'critical';
    }

    return {
      shouldEscalate,
      escalationLevel,
      reason: reason || this.generateEscalationReason(classification, sentiment),
      urgency,
      suggestedAgent: this.findBestAgent(classification, escalationLevel),
      estimatedWaitTime: this.calculateWaitTime(urgency, escalationLevel),
      alternativeActions: this.suggestAlternativeActions(classification),
      escalationNotes: this.generateEscalationNotes(message, classification, sentiment),
    };
  }

  // Private helper methods for AI integration

  private buildClassificationPrompt(text: string, customer?: any, context?: any): string {
    return `
Analyze this customer support message and classify it:

Message: "${text}"

Customer Info: ${customer ? JSON.stringify(customer, null, 2) : 'Not provided'}
Context: ${context ? JSON.stringify(context, null, 2) : 'Not provided'}

Classify the message and return as JSON:
{
  "intent": "inquiry|complaint|refund|support|compliment|bug_report|feature_request|billing|technical|general",
  "category": "main category",
  "subcategory": "specific subcategory",
  "confidence": 0.95,
  "urgency": "low|medium|high|critical",
  "requiresHuman": true|false,
  "suggestedActions": ["action1", "action2"],
  "keywords": ["keyword1", "keyword2"],
  "entities": [{"type": "order_id", "value": "12345", "confidence": 0.9}]
}

Consider:
- Emotional tone and urgency
- Specific requests or complaints
- Technical vs. non-technical issues
- Customer tier and history
- Required response time
`;
  }

  private buildReplyPrompt(
    message: string,
    classification?: MessageClassificationOutput,
    tone?: string,
    customer?: any,
    context?: any,
    constraints?: any
  ): string {
    return `
Generate a customer support reply for this message:

Customer Message: "${message}"
Classification: ${classification ? JSON.stringify(classification, null, 2) : 'Not provided'}
Requested Tone: ${tone || 'professional'}
Customer Info: ${customer ? JSON.stringify(customer, null, 2) : 'Not provided'}
Context: ${context ? JSON.stringify(context, null, 2) : 'Not provided'}
Constraints: ${constraints ? JSON.stringify(constraints, null, 2) : 'None'}

Generate a helpful response and return as JSON:
{
  "reply": "Your complete response message",
  "tone": "actual tone used",
  "confidence": 0.9,
  "suggestedFollowUps": ["follow-up1", "follow-up2"],
  "escalationRecommended": false,
  "estimatedResolutionTime": 30,
  "requiredActions": [{"action": "send_replacement", "priority": "high"}],
  "relatedResources": [{"type": "article", "title": "How to...", "url": "link"}]
}

Guidelines:
- Be empathetic and understanding
- Provide specific, actionable solutions
- Include relevant resources
- Maintain professional but warm tone
- Address the customer by name if available
- Acknowledge their frustration if applicable
`;
  }

  private buildSentimentPrompt(message: string, context?: any): string {
    return `
Analyze the sentiment and emotional state of this customer message:

Message: "${message}"
Context: ${context ? JSON.stringify(context, null, 2) : 'Not provided'}

Analyze sentiment and return as JSON:
{
  "sentiment": "positive|neutral|negative",
  "score": 0.3,
  "confidence": 0.95,
  "emotions": [{"emotion": "frustrated", "intensity": 0.8}],
  "urgencyIndicators": ["urgent", "asap"],
  "escalationTriggers": ["angry", "lawsuit"],
  "customerSatisfactionRisk": "low|medium|high"
}

Consider:
- Emotional language and tone
- Urgency indicators
- Satisfaction/dissatisfaction signals
- Frustration level
- Politeness vs. aggression
- Risk of customer churn
`;
  }

  private parseClassificationOutput(
    aiOutput: string,
    input: MessageClassificationInput
  ): MessageClassificationOutput {
    try {
      const jsonMatch = aiOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          intent: parsed.intent || 'general',
          category: parsed.category || 'General Inquiry',
          subcategory: parsed.subcategory,
          confidence: parsed.confidence || 0.7,
          urgency: parsed.urgency || 'medium',
          requiresHuman: parsed.requiresHuman || false,
          suggestedActions: parsed.suggestedActions || [],
          keywords: parsed.keywords || [],
          entities: parsed.entities || [],
        };
      }
    } catch (error) {
      logger.error('Failed to parse classification output', { error }, 'CustomerSupportAgent');
    }

    return this.classifyMessageFallback(input);
  }

  private parseReplyOutput(aiOutput: string, input: ReplyGenerationInput): ReplyGenerationOutput {
    try {
      const jsonMatch = aiOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          reply: parsed.reply || "Thank you for contacting us. We'll help you resolve this issue.",
          tone: parsed.tone || input.tone || 'professional',
          confidence: parsed.confidence || 0.7,
          suggestedFollowUps: parsed.suggestedFollowUps || [],
          escalationRecommended: parsed.escalationRecommended || false,
          estimatedResolutionTime: parsed.estimatedResolutionTime || 60,
          requiredActions: parsed.requiredActions || [],
          relatedResources: parsed.relatedResources || [],
        };
      }
    } catch (error) {
      logger.error('Failed to parse reply output', { error }, 'CustomerSupportAgent');
    }

    return this.generateReplyFallback(input);
  }

  private parseSentimentOutput(
    aiOutput: string,
    input: SentimentAnalysisInput
  ): SentimentAnalysisOutput {
    try {
      const jsonMatch = aiOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          sentiment: parsed.sentiment || 'neutral',
          score: parsed.score || 0,
          confidence: parsed.confidence || 0.7,
          emotions: parsed.emotions || [],
          urgencyIndicators: parsed.urgencyIndicators || [],
          escalationTriggers: parsed.escalationTriggers || [],
          customerSatisfactionRisk: parsed.customerSatisfactionRisk || 'low',
        };
      }
    } catch (error) {
      logger.error('Failed to parse sentiment output', { error }, 'CustomerSupportAgent');
    }

    return this.analyzeSentimentFallback(input);
  }

  // Fallback methods when AI is not available

  private classifyMessageFallback(input: MessageClassificationInput): MessageClassificationOutput {
    const { text } = input;
    const lowerText = text.toLowerCase();

    let intent: MessageClassificationOutput['intent'] = 'general';
    let urgency: MessageClassificationOutput['urgency'] = 'medium';
    let requiresHuman = false;

    // Simple keyword-based classification
    if (lowerText.includes('refund') || lowerText.includes('money back')) {
      intent = 'refund';
      urgency = 'high';
      requiresHuman = true;
    } else if (
      lowerText.includes('bug') ||
      lowerText.includes('error') ||
      lowerText.includes('broken')
    ) {
      intent = 'bug_report';
      urgency = 'medium';
    } else if (
      lowerText.includes('angry') ||
      lowerText.includes('frustrated') ||
      lowerText.includes('terrible')
    ) {
      intent = 'complaint';
      urgency = 'high';
      requiresHuman = true;
    } else if (
      lowerText.includes('bill') ||
      lowerText.includes('charge') ||
      lowerText.includes('payment')
    ) {
      intent = 'billing';
      urgency = 'medium';
    } else if (
      lowerText.includes('how') ||
      lowerText.includes('help') ||
      lowerText.includes('support')
    ) {
      intent = 'support';
      urgency = 'low';
    }

    return {
      intent,
      category: this.getCategoryFromIntent(intent),
      confidence: 0.6,
      urgency,
      requiresHuman,
      suggestedActions: ['review_message', 'prepare_response'],
      keywords: this.extractKeywords(text),
      entities: [],
    };
  }

  private generateReplyFallback(input: ReplyGenerationInput): ReplyGenerationOutput {
    const { customer, tone = 'professional' } = input;
    const customerName = customer?.name || 'there';

    return {
      reply: `Hi ${customerName},\n\nThank you for reaching out to us. We've received your message and our team is reviewing it. We'll get back to you shortly with a solution.\n\nBest regards,\nCustomer Support Team`,
      tone,
      confidence: 0.5,
      suggestedFollowUps: ['Check for updates in 24 hours', 'Contact us if urgent'],
      escalationRecommended: false,
      estimatedResolutionTime: 120,
      requiredActions: [],
      relatedResources: [],
    };
  }

  private analyzeSentimentFallback(input: SentimentAnalysisInput): SentimentAnalysisOutput {
    const { message } = input;
    const lowerMessage = message.toLowerCase();

    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    let score = 0;

    const positiveWords = ['great', 'excellent', 'love', 'amazing', 'perfect', 'thank you'];
    const negativeWords = ['terrible', 'awful', 'hate', 'angry', 'frustrated', 'worst'];

    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;

    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = 0.3 + positiveCount * 0.2;
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = -0.3 - negativeCount * 0.2;
    }

    return {
      sentiment,
      score: Math.max(-1, Math.min(1, score)),
      confidence: 0.6,
      emotions: [],
      urgencyIndicators: this.extractUrgencyIndicators(message),
      escalationTriggers: negativeWords.filter(word => lowerMessage.includes(word)),
      customerSatisfactionRisk: negativeCount > 2 ? 'high' : negativeCount > 0 ? 'medium' : 'low',
    };
  }

  // Helper methods

  private shouldEscalateTicket(
    classification?: MessageClassificationOutput,
    sentiment?: SentimentAnalysisOutput,
    customerTier?: string,
    agentWorkload?: number
  ): boolean {
    if (classification?.urgency === 'critical') return true;
    if (sentiment?.sentiment === 'negative' && sentiment?.score < -0.8) return true;
    if (customerTier === 'enterprise' && classification?.urgency === 'high') return true;
    if (agentWorkload && agentWorkload > 15) return true;
    if (classification?.requiresHuman) return true;

    return false;
  }

  private generateEscalationReason(
    classification?: MessageClassificationOutput,
    sentiment?: SentimentAnalysisOutput
  ): string {
    if (classification?.urgency === 'critical') {
      return 'Critical urgency level detected';
    }
    if (sentiment?.sentiment === 'negative' && sentiment?.score < -0.8) {
      return 'Highly negative customer sentiment detected';
    }
    if (classification?.requiresHuman) {
      return 'Issue requires human intervention';
    }
    return 'Standard escalation protocol';
  }

  private findBestAgent(classification?: MessageClassificationOutput, level?: string) {
    // Mock agent assignment logic
    const agents = [
      {
        id: 'agent_001',
        name: 'Sarah Johnson',
        skills: ['technical', 'billing'],
        availability: true,
      },
      {
        id: 'agent_002',
        name: 'Mike Chen',
        skills: ['product', 'integration'],
        availability: true,
      },
      {
        id: 'agent_003',
        name: 'Emily Rodriguez',
        skills: ['customer_success'],
        availability: false,
      },
    ];

    return agents.find(agent => agent.availability) || agents[0];
  }

  private calculateWaitTime(urgency: string, level: string): number {
    const baseTimes = { low: 60, medium: 30, high: 15, critical: 5 };
    const levelMultipliers = { supervisor: 1, specialist: 1.5, manager: 2, senior_management: 3 };

    return (
      (baseTimes[urgency as keyof typeof baseTimes] || 30) *
      (levelMultipliers[level as keyof typeof levelMultipliers] || 1)
    );
  }

  private suggestAlternativeActions(classification?: MessageClassificationOutput): string[] {
    const actions = ['Check knowledge base', 'Review FAQ section'];

    if (classification?.intent === 'technical') {
      actions.push('Try troubleshooting guide', 'Submit bug report');
    } else if (classification?.intent === 'billing') {
      actions.push('Review billing FAQ', 'Check account settings');
    }

    return actions;
  }

  private generateEscalationNotes(
    message: string,
    classification?: MessageClassificationOutput,
    sentiment?: SentimentAnalysisOutput
  ): string {
    let notes = `Customer message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`;

    if (classification) {
      notes += `\nClassification: ${classification.intent} (${classification.confidence})`;
    }

    if (sentiment) {
      notes += `\nSentiment: ${sentiment.sentiment} (${sentiment.score})`;
    }

    return notes;
  }

  private getCategoryFromIntent(intent: string): string {
    const mapping = {
      inquiry: 'General Inquiry',
      complaint: 'Customer Complaint',
      refund: 'Billing & Refunds',
      support: 'Technical Support',
      compliment: 'Customer Feedback',
      bug_report: 'Technical Issues',
      feature_request: 'Product Feedback',
      billing: 'Billing & Payments',
      technical: 'Technical Support',
      general: 'General Inquiry',
    };

    return mapping[intent as keyof typeof mapping] || 'General Inquiry';
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const stopWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
    ];
    return words.filter(word => word.length > 3 && !stopWords.includes(word)).slice(0, 5);
  }

  private extractUrgencyIndicators(message: string): string[] {
    const urgentWords = ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'help'];
    const lowerMessage = message.toLowerCase();
    return urgentWords.filter(word => lowerMessage.includes(word));
  }

  // Wrapper methods for AI features
  private async classifyMessageAI(
    input: MessageClassificationInput
  ): Promise<MessageClassificationOutput> {
    return this.classifyMessage(input);
  }

  private async generateReplyAI(input: ReplyGenerationInput): Promise<ReplyGenerationOutput> {
    return this.generateReply(input);
  }

  private async analyzeSentimentAI(
    input: SentimentAnalysisInput
  ): Promise<SentimentAnalysisOutput> {
    return this.analyzeSentiment(input);
  }

  private async escalateTicket(input: EscalationInput): Promise<EscalationOutput> {
    return this.escalate(input);
  }

  // Additional support methods for tRPC integration

  async createTicket(input: any): Promise<any> {
    const ticketId = input.ticketId || `ticket_${Date.now()}`;

    const ticket: SupportTicket = {
      id: ticketId,
      customerId: input.customer?.customerId,
      subject: input.subject,
      message: input.message,
      channel: input.channel,
      status: 'open',
      priority: input.priority || 'medium',
      category: input.category,
      assignedTo: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      metadata: input.metadata || {},
    };

    this.tickets.set(ticketId, ticket);

    // Auto-classify the message
    const classification = await this.classifyMessage({ text: input.message });

    return {
      success: true,
      ticket: {
        ...ticket,
        classification,
        estimatedResolutionTime: this.estimateResolutionTime(classification),
      },
      message: 'Ticket created successfully',
    };
  }

  async updateTicket(input: any): Promise<any> {
    const { ticketId, update } = input;
    const ticket = this.tickets.get(ticketId);

    if (!ticket) {
      return {
        success: false,
        error: 'Ticket not found',
      };
    }

    Object.assign(ticket, update, { updatedAt: new Date() });
    this.tickets.set(ticketId, ticket);

    return {
      success: true,
      ticket,
      message: 'Ticket updated successfully',
    };
  }

  async sendWhatsAppMessage(input: WhatsAppMessage): Promise<any> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      recipient: input.recipient,
      messageType: input.message.type,
      status: 'pending',
      service: 'twilio',
    };

    try {
      // Use real Twilio if available
      if (twilioClient && process.env.TWILIO_WHATSAPP_NUMBER) {
        const message = await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: input.recipient.startsWith('whatsapp:')
            ? input.recipient
            : `whatsapp:${input.recipient}`,
          body: input.message.content,
        });

        logEntry.status = 'sent';
        await this.logWhatsAppEvent({
          ...logEntry,
          messageId: message.sid,
          twilioStatus: message.status,
        });

        return {
          success: true,
          messageId: message.sid,
          status: 'sent',
          recipient: input.recipient,
          message: input.message.content,
          timestamp: new Date(),
          deliveryStatus: message.status,
          service: 'twilio',
        };
      } else {
        // Fallback mock mode
        logEntry.status = 'mock_sent';
        logEntry.service = 'mock';

        await this.logWhatsAppEvent({
          ...logEntry,
          messageId: `mock_${Date.now()}`,
          note: 'Twilio credentials not configured, using mock mode',
        });

        return {
          success: true,
          messageId: `mock_msg_${Date.now()}`,
          status: 'mock_sent',
          recipient: input.recipient,
          message: input.message.content,
          timestamp: new Date(),
          deliveryStatus: 'mock_delivered',
          service: 'mock',
        };
      }
    } catch (error) {
      logEntry.status = 'failed';
      await this.logWhatsAppEvent({
        ...logEntry,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return error response but don't throw
      return {
        success: false,
        messageId: null,
        status: 'failed',
        recipient: input.recipient,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        service: 'twilio',
      };
    }
  }

  private async logWhatsAppEvent(event: any): Promise<void> {
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      await fs.mkdir(logsDir, { recursive: true });

      const logFile = path.join(logsDir, 'support-agent.log');
      const logLine = `${JSON.stringify(event)}\n`;

      await fs.appendFile(logFile, logLine);
    } catch (error) {
      logger.error('Failed to write WhatsApp log', { error }, 'CustomerSupportAgent');
    }
  }

  private async logAIFallback(operation: string, error: unknown): Promise<void> {
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      await fs.mkdir(logsDir, { recursive: true });

      const logFile = path.join(logsDir, 'ai-fallback.log');
      const logEntry = {
        timestamp: new Date().toISOString(),
        agent: 'CustomerSupportAgent',
        operation,
        error: error instanceof Error ? error.message : String(error),
        fallbackUsed: true,
      };

      await fs.appendFile(logFile, `${JSON.stringify(logEntry)}\n`);
    } catch (logError) {
      logger.error('Failed to write AI fallback log', { logError }, 'CustomerSupportAgent');
    }
  }

  async sendMessage(input: WhatsAppMessage): Promise<any> {
    return await this.sendWhatsAppMessage(input);
  }

  async autoRespond(input: any): Promise<any> {
    const { message, customer } = input;

    // Classify message
    const classification = await this.classifyMessage({ text: message, customer });

    // Generate appropriate response
    const reply = await this.generateReply({
      message,
      classification,
      tone: 'professional',
      customer,
    });

    return {
      success: true,
      response: reply,
      classification,
      shouldEscalate: classification.requiresHuman,
      message: 'Auto-response generated successfully',
    };
  }

  async manageKnowledgeBase(input: any): Promise<any> {
    const { action, data } = input;

    switch (action) {
      case 'search_articles':
        return this.searchKnowledgeBase(data.query);
      case 'add_article':
        return this.addKnowledgeBaseArticle(data);
      case 'get_suggestions':
        return this.getSuggestedArticles(data.message);
      default:
        return { success: false, error: 'Unknown action' };
    }
  }

  async generateTicketSummary(input: any): Promise<any> {
    const { ticketId } = input;
    const ticket = this.tickets.get(ticketId);

    if (!ticket) {
      return { success: false, error: 'Ticket not found' };
    }

    return {
      success: true,
      summary: {
        ticketId,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        resolutionTime: ticket.resolvedAt
          ? (ticket.resolvedAt.getTime() - ticket.createdAt.getTime()) / 60000
          : null,
        summary: `${ticket.category} issue reported via ${ticket.channel}`,
      },
      message: 'Ticket summary generated successfully',
    };
  }

  private async trackCustomerSatisfaction(input: any): Promise<any> {
    return {
      success: true,
      satisfaction: {
        score: 4.2,
        feedback: 'Generally positive',
        trends: 'improving',
      },
    };
  }

  private async manageTicketQueue(input: any): Promise<any> {
    return {
      success: true,
      queue: {
        total: 45,
        urgent: 3,
        highPriority: 8,
        avgWaitTime: 25,
      },
    };
  }

  // Helper methods

  private estimateResolutionTime(classification: MessageClassificationOutput): number {
    const baseTimes = {
      inquiry: 30,
      complaint: 60,
      refund: 120,
      support: 45,
      technical: 90,
      billing: 60,
      general: 30,
    };

    return baseTimes[classification.intent as keyof typeof baseTimes] || 45;
  }

  private searchKnowledgeBase(query: string) {
    const articles = Array.from(this.knowledgeBase.values())
      .filter(
        article =>
          article.title.toLowerCase().includes(query.toLowerCase()) ||
          article.content.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);

    return {
      success: true,
      articles,
      total: articles.length,
    };
  }

  private addKnowledgeBaseArticle(data: any) {
    const article: KnowledgeBaseArticle = {
      id: `article_${Date.now()}`,
      title: data.title,
      content: data.content,
      category: data.category || 'General',
      tags: data.tags || [],
      views: 0,
      helpful: 0,
      lastUpdated: new Date(),
      author: data.author || 'System',
      status: 'published',
    };

    this.knowledgeBase.set(article.id, article);

    return {
      success: true,
      article,
      message: 'Article added successfully',
    };
  }

  private getSuggestedArticles(message: string) {
    // Simple keyword matching for suggestions
    const keywords = this.extractKeywords(message);
    const suggestions = Array.from(this.knowledgeBase.values())
      .filter(article =>
        keywords.some(
          keyword =>
            article.title.toLowerCase().includes(keyword) ||
            article.tags.some(tag => tag.toLowerCase().includes(keyword))
        )
      )
      .slice(0, 3);

    return {
      success: true,
      suggestions,
      total: suggestions.length,
    };
  }

  private initializeKnowledgeBase(): void {
    const defaultArticles: KnowledgeBaseArticle[] = [
      {
        id: 'kb_001',
        title: 'How to Reset Your Password',
        content: 'To reset your password, click on "Forgot Password" on the login page...',
        category: 'Account Management',
        tags: ['password', 'login', 'account'],
        views: 1250,
        helpful: 89,
        lastUpdated: new Date(),
        author: 'Support Team',
        status: 'published',
      },
      {
        id: 'kb_002',
        title: 'Billing and Payment FAQ',
        content: 'Common questions about billing, payments, and subscriptions...',
        category: 'Billing',
        tags: ['billing', 'payment', 'subscription'],
        views: 890,
        helpful: 76,
        lastUpdated: new Date(),
        author: 'Support Team',
        status: 'published',
      },
    ];

    defaultArticles.forEach(article => {
      this.knowledgeBase.set(article.id, article);
    });
  }

  // Public API methods for tRPC integration
  async classifyMessageAPI(
    input: MessageClassificationInput
  ): Promise<MessageClassificationOutput> {
    return this.classifyMessage(input);
  }

  async generateReplyAPI(input: ReplyGenerationInput): Promise<ReplyGenerationOutput> {
    return this.generateReply(input);
  }

  async analyzeSentimentAPI(input: SentimentAnalysisInput): Promise<SentimentAnalysisOutput> {
    return this.analyzeSentiment(input);
  }

  async escalateAPI(input: EscalationInput): Promise<EscalationOutput> {
    return this.escalate(input);
  }
}
