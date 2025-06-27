import { AbstractAgent, AgentPayload, AgentResult } from '../base-agent';

interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  isGroup?: boolean;
  groupId?: string;
}

interface WhatsAppContact {
  phone: string;
  name?: string;
  profilePicture?: string;
  lastSeen?: Date;
  isBlocked?: boolean;
  tags?: string[];
}

interface SupportTicket {
  id: string;
  customerId: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  messages: WhatsAppMessage[];
  assignedAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WhatsAppAgent extends AbstractAgent {
  private contacts: Map<string, WhatsAppContact> = new Map();
  private activeTickets: Map<string, SupportTicket> = new Map();
  private messageTemplates: Map<string, string> = new Map();

  constructor(id: string, name: string) {
    super(id, name, 'whatsapp', [
      'send_message',
      'receive_message',
      'manage_contacts',
      'create_ticket',
      'automated_response',
      'bulk_message',
      'status_update',
    ]);

    this.initializeTemplates();
  }

  async execute(payload: AgentPayload): Promise<AgentResult> {
    return this.executeWithErrorHandling(payload, async () => {
      const { task, context } = payload;

      switch (task) {
        case 'send_message':
          return await this.sendMessage(context || {});
        case 'receive_message':
          return await this.processMessage(context || {});
        case 'manage_contacts':
          return await this.manageContacts(context || {});
        case 'create_ticket':
          return await this.createSupportTicket(context || {});
        case 'automated_response':
          return await this.generateAutomatedResponse(context || {});
        case 'bulk_message':
          return await this.sendBulkMessage(context || {});
        case 'status_update':
          return await this.updateMessageStatus(context || {});
        default:
          throw new Error(`Unknown task: ${task}`);
      }
    });
  }

  private async sendMessage(context: any): Promise<any> {
    const { to, content, type = 'text', templateId, variables = {}, priority = 'normal' } = context;

    if (!to || !content) {
      throw new Error('Recipient and content are required');
    }

    // Get template if specified
    let messageContent = content;
    if (templateId) {
      const template = this.messageTemplates.get(templateId);
      if (template) {
        messageContent = this.processTemplate(template, variables);
      }
    }

    // Create message
    const message: WhatsAppMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: 'neonhub_business', // Our business number
      to,
      content: messageContent,
      timestamp: new Date(),
      type,
      status: 'sent',
    };

    // Simulate message delivery
    const deliverySuccess = Math.random() > 0.05; // 95% success rate
    message.status = deliverySuccess ? 'delivered' : 'failed';

    // Store contact if new
    if (!this.contacts.has(to)) {
      this.contacts.set(to, {
        phone: to,
        name: `Customer ${to.slice(-4)}`,
        lastSeen: new Date(),
      });
    }

    return {
      message,
      status: deliverySuccess ? 'success' : 'failed',
      deliveryTime: new Date(),
      estimatedReadTime: deliverySuccess ? new Date(Date.now() + Math.random() * 3600000) : null, // 0-1 hour
      cost: this.calculateMessageCost(type, content.length),
      metadata: {
        templateUsed: templateId || null,
        priority,
        agentId: this.id,
      },
    };
  }

  private async processMessage(_context: any): Promise<any> {
    // Handle incoming messages and route to appropriate handlers
    const incomingMessage: WhatsAppMessage = {
      id: `incoming_${Date.now()}`,
      from: '+1234567890',
      to: 'neonhub_business',
      content: 'Hello, I need help with my neon sign order',
      timestamp: new Date(),
      type: 'text',
      status: 'delivered',
    };

    // Analyze intent
    const intent = this.analyzeIntent(incomingMessage.content);

    // Check for existing ticket
    const existingTicket = this.findTicketByCustomer(incomingMessage.from);

    if (existingTicket) {
      // Add to existing ticket
      existingTicket.messages.push(incomingMessage);
      existingTicket.updatedAt = new Date();

      return {
        action: 'ticket_updated',
        ticketId: existingTicket.id,
        message: incomingMessage,
        intent,
        suggestedResponse: this.generateResponse(intent, existingTicket),
        requiresHumanIntervention: intent.confidence < 0.7,
      };
    } else {
      // Create new ticket if support-related
      if (intent.type === 'support' || intent.type === 'complaint') {
        const ticket = await this.createSupportTicket({
          customerId: incomingMessage.from,
          subject: intent.subject,
          priority: intent.priority,
          initialMessage: incomingMessage,
        });

        return {
          action: 'ticket_created',
          ticketId: ticket.id,
          message: incomingMessage,
          intent,
          suggestedResponse: this.generateResponse(intent),
          autoResponse: intent.confidence > 0.8,
        };
      } else {
        // Handle as general inquiry
        return {
          action: 'general_inquiry',
          message: incomingMessage,
          intent,
          suggestedResponse: this.generateResponse(intent),
          autoResponse: true,
        };
      }
    }
  }

  private async manageContacts(context: any): Promise<any> {
    const { action, contactData } = context;

    switch (action) {
      case 'add':
        return this.addContact(contactData);
      case 'update':
        return this.updateContact(contactData);
      case 'block':
        return this.blockContact(contactData.phone);
      case 'unblock':
        return this.unblockContact(contactData.phone);
      case 'tag':
        return this.tagContact(contactData.phone, contactData.tags);
      case 'list':
        return this.listContacts(contactData.filters);
      default:
        throw new Error(`Unknown contact action: ${action}`);
    }
  }

  private async createSupportTicket(context: any): Promise<any> {
    const {
      customerId,
      subject,
      priority = 'medium',
      initialMessage,
      category = 'general',
    } = context;

    const ticket: SupportTicket = {
      id: `ticket_${Date.now()}`,
      customerId,
      subject: subject || 'WhatsApp Support Request',
      status: 'open',
      priority,
      messages: initialMessage ? [initialMessage] : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.activeTickets.set(ticket.id, ticket);

    // Auto-assign based on category and priority
    const assignedAgent = this.autoAssignAgent(category, priority);
    if (assignedAgent) {
      ticket.assignedAgent = assignedAgent;
    }

    return {
      ticket,
      estimatedResponseTime: this.calculateResponseTime(priority),
      autoAssigned: !!assignedAgent,
      suggestedActions: [
        'Send acknowledgment message',
        'Gather customer information',
        'Escalate if high priority',
      ],
      metadata: {
        category,
        createdBy: this.id,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async generateAutomatedResponse(context: any): Promise<any> {
    const { message, intent, customerHistory = [] } = context;

    // Generate contextual response
    const responseTemplate = this.selectResponseTemplate(intent.type);
    const personalizedResponse = this.personalizeResponse(responseTemplate, {
      customerName: this.getCustomerName(message.from),
      intent: intent.type,
      ...intent.entities,
    });

    return {
      response: personalizedResponse,
      confidence: intent.confidence,
      sendImmediately: intent.confidence > 0.8,
      requiresApproval: intent.confidence < 0.6,
      followUpActions: this.suggestFollowUpActions(intent),
      escalation:
        intent.urgency === 'high'
          ? {
              reason: 'High urgency detected',
              department: 'customer_service',
              eta: '15 minutes',
            }
          : null,
    };
  }

  private async sendBulkMessage(context: any): Promise<any> {
    const { recipients, content, templateId, variables = {}, sendTime, batchSize = 100 } = context;

    if (!recipients || recipients.length === 0) {
      throw new Error('No recipients specified');
    }

    // Process in batches to avoid rate limiting
    const batches = this.createBatches(recipients, batchSize);
    const results = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchResults = await Promise.all(
        batch.map(async recipient => {
          try {
            const result = await this.sendMessage({
              to: recipient,
              content,
              templateId,
              variables: { ...variables, customerName: this.getCustomerName(recipient) },
            });
            return { recipient, status: 'success', messageId: result.message.id };
          } catch (error) {
            return {
              recipient,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );

      results.push(...batchResults);

      // Rate limiting delay between batches
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;

    return {
      totalRecipients: recipients.length,
      successful,
      failed,
      successRate: `${((successful / recipients.length) * 100).toFixed(2)}%`,
      results: results.slice(0, 50), // Return first 50 for preview
      batchCount: batches.length,
      estimatedCost: successful * 0.05, // Estimated cost per message
      completedAt: new Date(),
      metadata: {
        templateUsed: templateId,
        batchSize,
        sendTime: sendTime || 'immediate',
      },
    };
  }

  private async updateMessageStatus(context: any): Promise<any> {
    const { messageId, status, timestamp } = context;

    // Simulate status update
    return {
      messageId,
      oldStatus: 'delivered',
      newStatus: status,
      timestamp: timestamp || new Date(),
      webhook: {
        delivered: status === 'delivered',
        read: status === 'read',
        readTimestamp: status === 'read' ? new Date() : null,
      },
    };
  }

  private async manageTickets(context: any): Promise<any> {
    const {
      action,
      ticketId,
      ticket: _ticket,
      priority = 'medium',
      category = 'general',
    } = context;

    switch (action) {
      case 'update_priority':
        return this.updateTicketPriority(ticketId, priority);
      case 'assign_agent':
        return this.assignTicketToAgent(ticketId, context.agentId);
      case 'add_note':
        return this.addTicketNote(ticketId, context.note);
      case 'close':
        return this.closeTicket(ticketId, context.resolution);
      case 'escalate':
        return this.escalateTicket(ticketId, context.reason);
      default:
        throw new Error(`Unknown ticket action: ${action}`);
    }
  }

  // Helper methods
  private initializeTemplates(): void {
    this.messageTemplates.set(
      'welcome',
      'Hello {{customerName}}! Welcome to NeonHub. How can we help you today?'
    );

    this.messageTemplates.set(
      'order_confirmation',
      'Hi {{customerName}}, your neon sign order #{{orderNumber}} has been confirmed. Estimated delivery: {{deliveryDate}}'
    );

    this.messageTemplates.set(
      'support_received',
      "Thank you for contacting NeonHub support. We've received your message and will respond within {{responseTime}}."
    );

    this.messageTemplates.set(
      'order_shipped',
      'Great news {{customerName}}! Your order #{{orderNumber}} has shipped. Track it here: {{trackingUrl}}'
    );
  }

  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, variables[key] || '');
    });
    return processed;
  }

  private calculateMessageCost(type: string, length: number): number {
    const baseCost = 0.05; // $0.05 per text message
    const multipliers = {
      text: 1,
      image: 2,
      video: 3,
      audio: 2,
      document: 1.5,
    };

    const lengthMultiplier = length > 160 ? Math.ceil(length / 160) : 1;
    return baseCost * (multipliers[type as keyof typeof multipliers] || 1) * lengthMultiplier;
  }

  private analyzeIntent(content: string): any {
    // Simple intent analysis (would use NLP service in production)
    const keywords = content.toLowerCase();

    if (keywords.includes('order') || keywords.includes('purchase')) {
      return {
        type: 'order_inquiry',
        confidence: 0.9,
        entities: { orderNumber: this.extractOrderNumber(content) },
        urgency: 'medium',
        subject: 'Order Inquiry',
      };
    } else if (
      keywords.includes('problem') ||
      keywords.includes('issue') ||
      keywords.includes('complaint')
    ) {
      return {
        type: 'complaint',
        confidence: 0.85,
        entities: {},
        urgency: 'high',
        priority: 'high',
        subject: 'Customer Complaint',
      };
    } else if (keywords.includes('help') || keywords.includes('support')) {
      return {
        type: 'support',
        confidence: 0.8,
        entities: {},
        urgency: 'medium',
        priority: 'medium',
        subject: 'Support Request',
      };
    } else {
      return {
        type: 'general',
        confidence: 0.6,
        entities: {},
        urgency: 'low',
        subject: 'General Inquiry',
      };
    }
  }

  private findTicketByCustomer(customerId: string): SupportTicket | undefined {
    return Array.from(this.activeTickets.values()).find(
      ticket => ticket.customerId === customerId && ticket.status !== 'closed'
    );
  }

  private generateResponse(intent: any, ticket?: SupportTicket): string {
    const responses = {
      order_inquiry: 'I can help you with your order. Could you please provide your order number?',
      support: "I'm here to help! Could you please describe the issue you're experiencing?",
      complaint:
        'I sincerely apologize for any inconvenience. Let me help resolve this issue for you immediately.',
      general: 'Hello! Thanks for reaching out to NeonHub. How can I assist you today?',
    };

    return responses[intent.type as keyof typeof responses] || responses.general;
  }

  private selectResponseTemplate(intentType: string): string {
    const templates = {
      order_inquiry: 'order_status',
      support: 'support_received',
      complaint: 'urgent_response',
      general: 'welcome',
    };

    return (
      this.messageTemplates.get(templates[intentType as keyof typeof templates] || 'welcome') ||
      'Hello! How can I help you?'
    );
  }

  private personalizeResponse(template: string, variables: Record<string, any>): string {
    return this.processTemplate(template, variables);
  }

  private suggestFollowUpActions(intent: any): string[] {
    const actions = {
      order_inquiry: [
        'Check order status',
        'Provide tracking information',
        'Update delivery estimate',
      ],
      support: ['Gather more details', 'Provide troubleshooting steps', 'Schedule callback'],
      complaint: ['Escalate to supervisor', 'Offer compensation', 'Schedule urgent call'],
      general: ['Provide product information', 'Share catalog', 'Offer consultation'],
    };

    return actions[intent.type as keyof typeof actions] || ['Provide general assistance'];
  }

  private autoAssignAgent(category: string, priority: string): string | undefined {
    // Simple auto-assignment logic
    if (priority === 'urgent' || priority === 'high') {
      return 'senior_agent_001';
    } else if (category === 'technical') {
      return 'tech_agent_001';
    } else {
      return 'agent_001';
    }
  }

  private calculateResponseTime(priority: string): string {
    const times = {
      urgent: '5 minutes',
      high: '15 minutes',
      medium: '1 hour',
      low: '4 hours',
    };

    return times[priority as keyof typeof times] || '1 hour';
  }

  private getCustomerName(phone: string): string {
    const contact = this.contacts.get(phone);
    return contact?.name || `Customer ${phone.slice(-4)}`;
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private extractOrderNumber(content: string): string | null {
    const match = content.match(/#(\w+)/);
    return match?.[1] || null;
  }

  private addContact(contactData: any): any {
    const { phone, name, tags = [] } = contactData;

    const contact: WhatsAppContact = {
      phone,
      name,
      tags,
      lastSeen: new Date(),
    };

    this.contacts.set(phone, contact);

    return {
      contact,
      message: 'Contact added successfully',
    };
  }

  private updateContact(contactData: any): any {
    const { phone, ...updates } = contactData;
    const existingContact = this.contacts.get(phone);

    if (!existingContact) {
      throw new Error('Contact not found');
    }

    const updatedContact = { ...existingContact, ...updates };
    this.contacts.set(phone, updatedContact);

    return {
      contact: updatedContact,
      message: 'Contact updated successfully',
    };
  }

  private blockContact(phone: string): any {
    const contact = this.contacts.get(phone);
    if (contact) {
      contact.isBlocked = true;
      this.contacts.set(phone, contact);
    }

    return {
      phone,
      blocked: true,
      message: 'Contact blocked successfully',
    };
  }

  private unblockContact(phone: string): any {
    const contact = this.contacts.get(phone);
    if (contact) {
      contact.isBlocked = false;
      this.contacts.set(phone, contact);
    }

    return {
      phone,
      blocked: false,
      message: 'Contact unblocked successfully',
    };
  }

  private tagContact(phone: string, tags: string[]): any {
    const contact = this.contacts.get(phone);
    if (contact) {
      contact.tags = [...(contact.tags || []), ...tags];
      this.contacts.set(phone, contact);
    }

    return {
      phone,
      tags: contact?.tags || [],
      message: 'Tags added successfully',
    };
  }

  private listContacts(_filters: any): any {
    const contacts = Array.from(this.contacts.values());

    return {
      contacts: contacts.slice(0, 50), // Limit to 50 for performance
      totalCount: contacts.length,
      blockedCount: contacts.filter(c => c.isBlocked).length,
    };
  }

  private updateTicketPriority(ticketId: string, _newPriority: string): any {
    const _ticket = this.activeTickets.get(ticketId);
    if (!_ticket) {
      throw new Error('Ticket not found');
    }

    return {
      ticketId,
      message: 'Priority updated successfully',
    };
  }

  private assignTicketToAgent(ticketId: string, agentId: string): any {
    const ticket = this.activeTickets.get(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.assignedAgent = agentId;

    return {
      ticketId,
      agentId,
      message: 'Ticket assigned successfully',
    };
  }

  private addTicketNote(ticketId: string, note: string): any {
    const ticket = this.activeTickets.get(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return {
      ticketId,
      note,
      addedAt: new Date(),
      message: 'Note added successfully',
    };
  }

  private closeTicket(ticketId: string, resolution: string): any {
    const ticket = this.activeTickets.get(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.status = 'closed';
    ticket.updatedAt = new Date();

    return {
      ticketId,
      status: 'closed',
      resolution,
      closedAt: new Date(),
      message: 'Ticket closed successfully',
    };
  }

  private escalateTicket(ticketId: string, reason: string): any {
    const ticket = this.activeTickets.get(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.priority = 'urgent';
    ticket.updatedAt = new Date();

    return {
      ticketId,
      escalated: true,
      reason,
      newPriority: 'urgent',
      escalatedAt: new Date(),
      message: 'Ticket escalated successfully',
    };
  }
}
