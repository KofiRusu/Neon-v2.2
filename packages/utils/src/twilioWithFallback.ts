import { logger } from "./logger";

// Node.js globals
declare const process: {
  env: Record<string, string | undefined>;
};

declare const require: (module: string) => any;

// Interfaces
export interface TwilioMessage {
  to: string;
  message: string;
  type?: "sms" | "whatsapp";
  from?: string;
}

export interface TwilioFallbackOptions {
  enableEmailFallback?: boolean;
  enableSlackFallback?: boolean;
  adminNotifications?: boolean;
  slackWebhookUrl?: string;
  emailFromAddress?: string;
  adminEmail?: string;
  adminSlackChannel?: string;
}

export interface TwilioFallbackResult {
  success: boolean;
  messageId?: string;
  status: "sent" | "failed" | "fallback_email" | "fallback_slack";
  service: "twilio" | "email" | "slack" | "mock";
  error?: string;
  fallbackUsed?: boolean;
  deliveryStatus?: string;
}

// Initialize Twilio client
let twilioClient: any = null;

try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require("twilio");
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }
} catch (error) {
  logger.warn(
    "Twilio not available, will run in fallback mode",
    { error },
    "TwilioFallback",
  );
}

// Initialize SendGrid client for email fallback
let sendGridClient: any = null;

try {
  if (process.env.SENDGRID_API_KEY) {
    const sgMail = require("@sendgrid/mail");
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sendGridClient = sgMail;
  }
} catch (error) {
  logger.warn(
    "SendGrid not available, email fallback disabled",
    { error },
    "TwilioFallback",
  );
}

/**
 * Send Twilio SMS with fallback to email or Slack
 */
export async function sendTwilioWithFallback(
  message: TwilioMessage,
  options: TwilioFallbackOptions = {},
): Promise<TwilioFallbackResult> {
  const {
    enableEmailFallback = true,
    enableSlackFallback = true,
    adminNotifications = true,
    slackWebhookUrl = process.env.SLACK_WEBHOOK_URL,
    emailFromAddress = process.env.SENDGRID_FROM_EMAIL,
    adminEmail = process.env.ADMIN_EMAIL,
    adminSlackChannel = process.env.ADMIN_SLACK_CHANNEL,
  } = options;

  const logEntry = {
    timestamp: new Date().toISOString(),
    recipient: message.to,
    messageType: message.type || "sms",
    status: "pending",
    service: "twilio",
  };

  try {
    // Attempt to send via Twilio
    const result = await sendTwilioSMS(message);
    if (result.success) {
      logger.info(
        `Twilio message sent successfully to ${message.to}`,
        { messageId: result.messageId, service: result.service },
        "TwilioFallback",
      );
      return result;
    } else {
      throw new Error(result.error || "Twilio send failed");
    }
  } catch (error) {
    logger.error(
      `Twilio failed for ${message.to}`,
      { error: error instanceof Error ? error.message : String(error) },
      "TwilioFallback",
    );

    // Try email fallback
    if (enableEmailFallback) {
      try {
        const emailResult = await sendFallbackEmail(message, emailFromAddress);
        if (emailResult.success) {
          logger.info(
            `Email fallback successful for ${message.to}`,
            { messageId: emailResult.messageId },
            "TwilioFallback",
          );

                     // Notify admin if enabled
           if (adminNotifications) {
             await notifyAdmin(
               "Twilio fallback to email used",
               `SMS to ${message.to} failed, email fallback successful`,
               { 
                 ...(slackWebhookUrl && { slackWebhookUrl }),
                 ...(adminEmail && { adminEmail }),
                 ...(adminSlackChannel && { adminSlackChannel }),
               },
             );
           }

          return emailResult;
        }
      } catch (emailError) {
        logger.error(
          `Email fallback failed for ${message.to}`,
          {
            error:
              emailError instanceof Error
                ? emailError.message
                : String(emailError),
          },
          "TwilioFallback",
        );
      }
    }

    // Try Slack fallback
    if (enableSlackFallback && slackWebhookUrl) {
      try {
        const slackResult = await sendFallbackSlack(message, slackWebhookUrl);
        if (slackResult.success) {
          logger.info(
            `Slack fallback successful for ${message.to}`,
            { messageId: slackResult.messageId },
            "TwilioFallback",
          );

                     // Notify admin if enabled
           if (adminNotifications) {
             await notifyAdmin(
               "Twilio fallback to Slack used",
               `SMS to ${message.to} failed, Slack fallback successful`,
               { 
                 ...(slackWebhookUrl && { slackWebhookUrl }),
                 ...(adminEmail && { adminEmail }),
                 ...(adminSlackChannel && { adminSlackChannel }),
               },
             );
           }

          return slackResult;
        }
      } catch (slackError) {
        logger.error(
          `Slack fallback failed for ${message.to}`,
          {
            error:
              slackError instanceof Error
                ? slackError.message
                : String(slackError),
          },
          "TwilioFallback",
        );
      }
    }

    // All methods failed
    const errorMessage = `All communication methods failed for ${message.to}`;
    logger.error(errorMessage, { originalError: error }, "TwilioFallback");

         // Notify admin of complete failure
     if (adminNotifications) {
       await notifyAdmin(
         "Critical: All communication methods failed",
         `Failed to deliver message to ${message.to} via SMS, email, and Slack`,
         { 
           ...(slackWebhookUrl && { slackWebhookUrl }),
           ...(adminEmail && { adminEmail }),
           ...(adminSlackChannel && { adminSlackChannel }),
         },
       );
     }

    return {
      success: false,
      status: "failed",
      service: "twilio",
      error: errorMessage,
      fallbackUsed: true,
    };
  }
}

/**
 * Send SMS via Twilio
 */
async function sendTwilioSMS(message: TwilioMessage): Promise<TwilioFallbackResult> {
  if (!twilioClient) {
    throw new Error("Twilio client not initialized");
  }

  const fromNumber = message.from || 
    (message.type === "whatsapp" 
      ? process.env.TWILIO_WHATSAPP_NUMBER 
      : process.env.TWILIO_PHONE_NUMBER);

  if (!fromNumber) {
    throw new Error("No Twilio phone number configured");
  }

  const toNumber = message.type === "whatsapp" && !message.to.startsWith("whatsapp:")
    ? `whatsapp:${message.to}`
    : message.to;

  const twilioMessage = await twilioClient.messages.create({
    from: fromNumber,
    to: toNumber,
    body: message.message,
  });

  return {
    success: true,
    messageId: twilioMessage.sid,
    status: "sent",
    service: "twilio",
    deliveryStatus: twilioMessage.status,
  };
}

/**
 * Send email fallback
 */
async function sendFallbackEmail(
  message: TwilioMessage,
  fromAddress?: string,
): Promise<TwilioFallbackResult> {
  if (!sendGridClient || !fromAddress) {
    throw new Error("SendGrid not configured for email fallback");
  }

  // Extract email from phone number or use as-is if it's an email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmail = emailRegex.test(message.to);
  
  if (!isEmail) {
    throw new Error("Cannot send email fallback to non-email address");
  }

  const emailData = {
    to: message.to,
    from: fromAddress,
    subject: "Important Message (SMS Fallback)",
    text: `${message.message}\n\n---\nThis message was sent via email because SMS delivery failed.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">Important Message</h2>
          <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">SMS delivery failed - sent via email</p>
        </div>
        <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
          <p style="color: #333; line-height: 1.5; margin: 0;">${message.message.replace(/\n/g, '<br>')}</p>
        </div>
        <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 4px; border-left: 4px solid #ffc107;">
          <p style="color: #856404; font-size: 14px; margin: 0;">
            <strong>Note:</strong> This message was originally intended to be sent via SMS but was delivered via email due to delivery issues.
          </p>
        </div>
      </div>
    `,
  };

  const [response] = await sendGridClient.send(emailData);

  return {
    success: true,
    messageId: response.headers["x-message-id"] || `email_${Date.now()}`,
    status: "fallback_email",
    service: "email",
    fallbackUsed: true,
    deliveryStatus: response.statusCode === 202 ? "accepted" : "unknown",
  };
}

/**
 * Send Slack fallback
 */
async function sendFallbackSlack(
  message: TwilioMessage,
  webhookUrl: string,
): Promise<TwilioFallbackResult> {
  const slackMessage = {
    text: `📱 SMS Fallback Message`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*SMS Fallback Message*\n*Intended recipient:* ${message.to}\n*Message:* ${message.message}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "⚠️ Original SMS delivery failed - message posted to Slack",
          },
        ],
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(slackMessage),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
  }

  return {
    success: true,
    messageId: `slack_${Date.now()}`,
    status: "fallback_slack",
    service: "slack",
    fallbackUsed: true,
    deliveryStatus: "posted",
  };
}

/**
 * Notify admin of fallback usage
 */
async function notifyAdmin(
  subject: string,
  message: string,
  options: {
    slackWebhookUrl?: string;
    adminEmail?: string;
    adminSlackChannel?: string;
  },
): Promise<void> {
  const { slackWebhookUrl, adminEmail, adminSlackChannel } = options;

  // Try Slack notification first
  if (slackWebhookUrl) {
    try {
      const slackPayload = {
        text: `🚨 ${subject}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${subject}*\n${message}`,
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `⏰ ${new Date().toISOString()}`,
              },
            ],
          },
        ],
      };

      const response = await fetch(slackWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(slackPayload),
      });

      if (response.ok) {
        logger.info("Admin notification sent via Slack", {}, "TwilioFallback");
        return;
      }
    } catch (error) {
      logger.error(
        "Failed to send admin notification via Slack",
        { error },
        "TwilioFallback",
      );
    }
  }

  // Try email notification
  if (adminEmail && sendGridClient && process.env.SENDGRID_FROM_EMAIL) {
    try {
      const emailData = {
        to: adminEmail,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `🚨 ${subject}`,
        text: `${message}\n\nTime: ${new Date().toISOString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
              <h2 style="color: #856404; margin: 0;">🚨 ${subject}</h2>
              <p style="color: #856404; margin: 15px 0 0 0;">${message}</p>
              <p style="color: #6c757d; font-size: 14px; margin: 15px 0 0 0;">
                Time: ${new Date().toISOString()}
              </p>
            </div>
          </div>
        `,
      };

      await sendGridClient.send(emailData);
      logger.info("Admin notification sent via email", {}, "TwilioFallback");
    } catch (error) {
      logger.error(
        "Failed to send admin notification via email",
        { error },
        "TwilioFallback",
      );
    }
  }
}

/**
 * Convenience function for SMS
 */
export async function sendSMSWithFallback(
  to: string,
  message: string,
  options?: TwilioFallbackOptions,
): Promise<TwilioFallbackResult> {
  return sendTwilioWithFallback({ to, message, type: "sms" }, options);
}

/**
 * Convenience function for WhatsApp
 */
export async function sendWhatsAppWithFallback(
  to: string,
  message: string,
  options?: TwilioFallbackOptions,
): Promise<TwilioFallbackResult> {
  return sendTwilioWithFallback({ to, message, type: "whatsapp" }, options);
}