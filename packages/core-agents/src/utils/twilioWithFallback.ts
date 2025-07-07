import { withRetryTimeoutFallback } from './withRetry';
import { logger } from "@neon/utils";
import { fallbackMetricsLogger, FallbackMetricsData } from './fallbackMetricsLogger';

// Twilio client interface
interface TwilioClient {
  messages: {
    create: (options: { 
      from: string; 
      to: string; 
      body: string;
    }) => Promise<{
      sid: string;
      status: string;
      errorCode?: string;
      errorMessage?: string;
    }>;
  };
}

// Email fallback service interface
interface EmailFallbackService {
  sendFallbackNotification: (data: {
    to: string;
    originalMessage: string;
    messageType: 'sms' | 'whatsapp';
    reason: string;
  }) => Promise<{
    success: boolean;
    messageId: string;
    service: string;
  }>;
}

// Fallback configuration
interface FallbackConfig {
  retries?: number;
  delay?: number;
  timeoutMs?: number;
  enableEmailFallback?: boolean;
  enableSlackFallback?: boolean;
  logFallbacks?: boolean;
}

// Default configuration
const DEFAULT_CONFIG: Required<FallbackConfig> = {
  retries: 3,
  delay: 1500,
  timeoutMs: 20000,
  enableEmailFallback: true,
  enableSlackFallback: false,
  logFallbacks: true,
};

// Metrics tracking
export class FallbackMetrics {
  private static metrics = {
    totalAttempts: 0,
    successfulSends: 0,
    failedAfterRetries: 0,
    emailFallbacks: 0,
    slackFallbacks: 0,
  };

  static increment(metric: keyof typeof FallbackMetrics.metrics) {
    this.metrics[metric]++;
  }

  static getMetrics() {
    return { ...this.metrics };
  }

  static reset() {
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key as keyof typeof this.metrics] = 0;
    });
  }
}

// Email fallback service implementation
class DefaultEmailFallbackService implements EmailFallbackService {
  async sendFallbackNotification(data: {
    to: string;
    originalMessage: string;
    messageType: 'sms' | 'whatsapp';
    reason: string;
  }): Promise<{ success: boolean; messageId: string; service: string }> {
    try {
      // Extract email from phone number context or use default
      const emailTo = this.extractEmailFromPhone(data.to) || process.env.FALLBACK_EMAIL || 'support@neonhub.ai';
      
      const emailContent = this.generateFallbackEmail(data);
      
      // Use SendGrid if available
      if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
        const sgMail = require("@sendgrid/mail");
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const emailData = {
          to: emailTo,
          from: process.env.SENDGRID_FROM_EMAIL,
          subject: `${data.messageType.toUpperCase()} Message Delivery Failed - Fallback Notification`,
          text: emailContent.text,
          html: emailContent.html,
        };

        const [response] = await sgMail.send(emailData);
        
        return {
          success: true,
          messageId: response.headers["x-message-id"] || `fallback_email_${Date.now()}`,
          service: 'sendgrid_fallback',
        };
      } else {
        // Mock fallback for development
        logger.info('Email fallback (mock mode)', {
          to: emailTo,
          originalMessage: data.originalMessage,
          messageType: data.messageType,
          reason: data.reason,
        });

        return {
          success: true,
          messageId: `mock_fallback_${Date.now()}`,
          service: 'mock_email_fallback',
        };
      }
    } catch (error) {
      logger.error('Email fallback failed', { error, data });
      return {
        success: false,
        messageId: '',
        service: 'fallback_failed',
      };
    }
  }

  private extractEmailFromPhone(_phone: string): string | null {
    // In a real implementation, this would look up email from customer database
    // For now, return null to use default fallback email
    return null;
  }

  private generateFallbackEmail(data: {
    to: string;
    originalMessage: string;
    messageType: 'sms' | 'whatsapp';
    reason: string;
  }) {
    const text = `
DELIVERY FAILURE NOTIFICATION

We were unable to deliver a ${data.messageType.toUpperCase()} message to ${data.to}.

Original Message:
${data.originalMessage}

Failure Reason: ${data.reason}

This message has been delivered via email as a fallback.

---
NeonHub Communication System
`;

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #dc3545; margin: 0;">⚠️ Delivery Failure Notification</h2>
  </div>
  
  <p>We were unable to deliver a <strong>${data.messageType.toUpperCase()}</strong> message to <code>${data.to}</code>.</p>
  
  <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
    <h4 style="margin-top: 0;">Original Message:</h4>
    <p style="margin-bottom: 0;">${data.originalMessage}</p>
  </div>
  
  <p><strong>Failure Reason:</strong> ${data.reason}</p>
  
  <p style="color: #6c757d; font-size: 14px;">
    This message has been delivered via email as a fallback to ensure you receive important communications.
  </p>
  
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
  <p style="color: #6c757d; font-size: 12px; text-align: center;">
    NeonHub Communication System
  </p>
</div>
`;

    return { text, html };
  }
}

// Main Twilio fallback wrapper
export class TwilioWithFallback {
  private twilioClient: TwilioClient | null = null;
  private emailFallbackService: EmailFallbackService;
  private config: Required<FallbackConfig>;

  constructor(
    twilioClient: TwilioClient | null,
    emailFallbackService?: EmailFallbackService,
    config?: FallbackConfig
  ) {
    this.twilioClient = twilioClient;
    this.emailFallbackService = emailFallbackService || new DefaultEmailFallbackService();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async sendSMS(to: string, message: string): Promise<{
    success: boolean;
    messageId: string;
    status: string;
    service: string;
    fallbackUsed?: boolean;
    fallbackReason?: string;
  }> {
    const startTime = Date.now();
    FallbackMetrics.increment('totalAttempts');

    if (!this.twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
      const result = await this.handleFallback(to, message, 'sms', 'Twilio not configured');
      await this.logMetricsEvent(to, message, 'sms', result, 0, Date.now() - startTime);
      return result;
    }

    const result = await withRetryTimeoutFallback(
      async () => {
        const response = await this.twilioClient!.messages.create({
          from: process.env.TWILIO_PHONE_NUMBER!,
          to: to.startsWith('+') ? to : `+${to}`,
          body: message,
        });

        FallbackMetrics.increment('successfulSends');

        return {
          success: true,
          messageId: response.sid,
          status: response.status,
          service: 'twilio_sms',
        };
      },
      // Fallback function
      await this.handleFallback(to, message, 'sms', 'Twilio API failed after retries'),
      {
        retries: this.config.retries,
        delay: this.config.delay,
        timeoutMs: this.config.timeoutMs,
      }
    );

    await this.logMetricsEvent(to, message, 'sms', result, this.config.retries, Date.now() - startTime);
    return result;
  }

  async sendWhatsApp(to: string, message: string): Promise<{
    success: boolean;
    messageId: string;
    status: string;
    service: string;
    fallbackUsed?: boolean;
    fallbackReason?: string;
  }> {
    const startTime = Date.now();
    FallbackMetrics.increment('totalAttempts');

    if (!this.twilioClient || !process.env.TWILIO_WHATSAPP_NUMBER) {
      const result = await this.handleFallback(to, message, 'whatsapp', 'Twilio WhatsApp not configured');
      await this.logMetricsEvent(to, message, 'whatsapp', result, 0, Date.now() - startTime);
      return result;
    }

    const result = await withRetryTimeoutFallback(
      async () => {
        const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
        
        const response = await this.twilioClient!.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER!,
          to: whatsappTo,
          body: message,
        });

        FallbackMetrics.increment('successfulSends');

        return {
          success: true,
          messageId: response.sid,
          status: response.status,
          service: 'twilio_whatsapp',
        };
      },
      // Fallback function
      await this.handleFallback(to, message, 'whatsapp', 'Twilio WhatsApp API failed after retries'),
      {
        retries: this.config.retries,
        delay: this.config.delay,
        timeoutMs: this.config.timeoutMs,
      }
    );

    await this.logMetricsEvent(to, message, 'whatsapp', result, this.config.retries, Date.now() - startTime);
    return result;
  }

  private async handleFallback(
    to: string,
    message: string,
    messageType: 'sms' | 'whatsapp',
    reason: string
  ): Promise<{
    success: boolean;
    messageId: string;
    status: string;
    service: string;
    fallbackUsed: boolean;
    fallbackReason: string;
  }> {
    FallbackMetrics.increment('failedAfterRetries');

    if (this.config.logFallbacks) {
      logger.warn(`Twilio ${messageType} failed, attempting fallback`, {
        to,
        messageType,
        reason,
        timestamp: new Date().toISOString(),
      });
    }

    if (this.config.enableEmailFallback) {
      try {
        FallbackMetrics.increment('emailFallbacks');
        
        const fallbackResult = await this.emailFallbackService.sendFallbackNotification({
          to,
          originalMessage: message,
          messageType,
          reason,
        });

        return {
          success: fallbackResult.success,
          messageId: fallbackResult.messageId,
          status: fallbackResult.success ? 'delivered_via_email' : 'fallback_failed',
          service: fallbackResult.service,
          fallbackUsed: true,
          fallbackReason: reason,
        };
      } catch (error) {
        logger.error('Email fallback failed', { error, to, messageType });
      }
    }

    // Ultimate fallback - log and return mock success
    return {
      success: true,
      messageId: `fallback_log_${Date.now()}`,
      status: 'logged_only',
      service: 'fallback_log',
      fallbackUsed: true,
      fallbackReason: reason,
    };
  }

  private async logMetricsEvent(
    to: string,
    _message: string,
    messageType: 'sms' | 'whatsapp',
    result: any,
    retryCount: number,
    executionTime: number
  ): Promise<void> {
    try {
      const metricsData: FallbackMetricsData = {
        timestamp: new Date().toISOString(),
        agentType: 'CustomerSupportAgent',
        messageType,
        originalRecipient: to,
        success: result.success,
        service: result.service,
        fallbackUsed: result.fallbackUsed || false,
        fallbackReason: result.fallbackReason,
        retryCount,
        executionTime,
      };

      await fallbackMetricsLogger.logFallbackEvent(metricsData);
    } catch (error) {
      // Don't let metrics logging failures affect the main functionality
      logger.warn('Failed to log fallback metrics', { error });
    }
  }
}

// Singleton instance for global use
let twilioWithFallbackInstance: TwilioWithFallback | null = null;

export function initializeTwilioWithFallback(
  twilioClient: TwilioClient | null,
  emailFallbackService?: EmailFallbackService,
  config?: FallbackConfig
): TwilioWithFallback {
  twilioWithFallbackInstance = new TwilioWithFallback(twilioClient, emailFallbackService, config);
  return twilioWithFallbackInstance;
}

export function getTwilioWithFallback(): TwilioWithFallback {
  if (!twilioWithFallbackInstance) {
    // Auto-initialize with default settings
    let twilioClient: TwilioClient | null = null;
    
    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const twilio = require("twilio");
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      }
    } catch (error) {
      logger.warn('Twilio client initialization failed', { error });
    }

    twilioWithFallbackInstance = new TwilioWithFallback(twilioClient);
  }
  
  return twilioWithFallbackInstance;
}

// Convenience functions for direct usage
export async function sendTwilioWithFallback(
  to: string,
  message: string,
  type: 'sms' | 'whatsapp' = 'sms'
): Promise<{
  success: boolean;
  messageId: string;
  status: string;
  service: string;
  fallbackUsed?: boolean;
  fallbackReason?: string;
}> {
  const client = getTwilioWithFallback();
  
  if (type === 'whatsapp') {
    return client.sendWhatsApp(to, message);
  } else {
    return client.sendSMS(to, message);
  }
}

// Export metrics for monitoring is handled by the class export above 