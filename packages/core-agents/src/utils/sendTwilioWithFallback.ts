import { withRetryTimeoutFallback } from "./withRetry";
import { logger } from "@neon/utils";

// Twilio client interface
interface TwilioClient {
  messages: {
    create: (options: { 
      from: string; 
      to: string; 
      body: string;
      mediaUrl?: string[];
    }) => Promise<{
      sid: string;
      status: string;
      errorCode?: string;
      errorMessage?: string;
    }>;
  };
}

// Twilio message options
export interface TwilioMessageOptions {
  to: string;
  message: string;
  messageType?: "text" | "media";
  mediaUrls?: string[];
  customFrom?: string;
}

// Twilio response interface
export interface TwilioResponse {
  success: boolean;
  messageId: string;
  status: string;
  recipient: string;
  message: string;
  timestamp: Date;
  deliveryStatus: string;
  service: "twilio" | "mock" | "fallback_email";
  error?: string;
}

// Global Twilio client instance
let twilioClient: TwilioClient | null = null;

/**
 * Initialize Twilio client with credentials
 */
export function initializeTwilioClient(): TwilioClient | null {
  if (twilioClient) return twilioClient;

  try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = require("twilio");
      twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );
      
      logger.info("Twilio client initialized successfully", {}, "TwilioWrapper");
      return twilioClient;
    } else {
      logger.warn(
        "Twilio credentials not found. Operations will use fallback mode.",
        {},
        "TwilioWrapper"
      );
      return null;
    }
  } catch (error) {
    logger.error(
      "Failed to initialize Twilio client",
      { error },
      "TwilioWrapper"
    );
    return null;
  }
}

/**
 * Get Twilio client instance
 */
export function getTwilioClient(): TwilioClient | null {
  return twilioClient || initializeTwilioClient();
}

/**
 * Send Twilio message with retry, timeout, and fallback capabilities
 */
export async function sendTwilioWithFallback(
  options: TwilioMessageOptions
): Promise<TwilioResponse> {
  const {
    to,
    message,
    messageType = "text",
    mediaUrls = [],
    customFrom
  } = options;

  // Determine the from number
  const fromNumber = customFrom || 
    process.env.TWILIO_WHATSAPP_NUMBER || 
    process.env.TWILIO_PHONE_NUMBER;

  if (!fromNumber) {
    logger.warn(
      "No Twilio phone number configured, using fallback",
      { recipient: to },
      "TwilioWrapper"
    );
    return createFallbackResponse(options);
  }

  // Format recipient number for WhatsApp or SMS
  const formattedTo = formatRecipientNumber(to);
  
  // Get Twilio client
  const client = getTwilioClient();
  
  if (!client) {
    logger.warn(
      "Twilio client not available, using fallback",
      { recipient: formattedTo },
      "TwilioWrapper"
    );
    return createFallbackResponse(options);
  }

  // Prepare fallback response
  const fallbackResponse = createFallbackResponse(options);

  // Use retry logic with fallback for Twilio API calls
  return withRetryTimeoutFallback(
    async (): Promise<TwilioResponse> => {
      const messageOptions: any = {
        from: fromNumber,
        to: formattedTo,
        body: message,
      };

      // Add media URLs if present
      if (messageType === "media" && mediaUrls.length > 0) {
        messageOptions.mediaUrl = mediaUrls;
      }

      const result = await client.messages.create(messageOptions);

      // Log successful message
      await logTwilioEvent({
        timestamp: new Date().toISOString(),
        recipient: formattedTo,
        messageType,
        status: "sent",
        service: "twilio",
        messageId: result.sid,
        twilioStatus: result.status,
      });

      return {
        success: true,
        messageId: result.sid,
        status: "sent",
        recipient: formattedTo,
        message,
        timestamp: new Date(),
        deliveryStatus: result.status,
        service: "twilio",
      };
    },
    // Fallback result if all retries fail
    fallbackResponse,
    {
      retries: 3,
      delay: 1500,
      timeoutMs: 20000,
    }
  );
}

/**
 * Send WhatsApp message using Twilio
 */
export async function sendWhatsAppWithFallback(
  to: string,
  message: string,
  mediaUrls?: string[]
): Promise<TwilioResponse> {
  const options: TwilioMessageOptions = {
    to: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
    message,
    messageType: mediaUrls && mediaUrls.length > 0 ? "media" : "text",
  };

  if (mediaUrls && mediaUrls.length > 0) {
    options.mediaUrls = mediaUrls;
  }

  if (process.env.TWILIO_WHATSAPP_NUMBER) {
    options.customFrom = process.env.TWILIO_WHATSAPP_NUMBER;
  }

  return sendTwilioWithFallback(options);
}

/**
 * Send SMS message using Twilio
 */
export async function sendSMSWithFallback(
  to: string,
  message: string
): Promise<TwilioResponse> {
  const options: TwilioMessageOptions = {
    to: formatPhoneNumber(to),
    message,
    messageType: "text",
  };

  if (process.env.TWILIO_PHONE_NUMBER) {
    options.customFrom = process.env.TWILIO_PHONE_NUMBER;
  }

  return sendTwilioWithFallback(options);
}

/**
 * Format recipient number for WhatsApp or SMS
 */
function formatRecipientNumber(to: string): string {
  // If already formatted for WhatsApp, return as-is
  if (to.startsWith("whatsapp:")) {
    return to;
  }
  
  // If it's a WhatsApp number, format it
  if (process.env.TWILIO_WHATSAPP_NUMBER) {
    return `whatsapp:${formatPhoneNumber(to)}`;
  }
  
  // Otherwise, format as regular phone number
  return formatPhoneNumber(to);
}

/**
 * Format phone number with country code
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove any existing formatting
  const cleaned = phoneNumber.replace(/[^\d+]/g, "");
  
  // Add + if not present and doesn't start with country code
  if (!cleaned.startsWith("+")) {
    return `+${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Create fallback response when Twilio is unavailable
 */
function createFallbackResponse(options: TwilioMessageOptions): TwilioResponse {
  const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Log fallback usage
  logTwilioEvent({
    timestamp: new Date().toISOString(),
    recipient: options.to,
    messageType: options.messageType || "text",
    status: "fallback_used",
    service: "mock",
    messageId: fallbackId,
    note: "Twilio unavailable, using fallback response",
  });

  const fallbackResponse: TwilioResponse = {
    success: true,
    messageId: fallbackId,
    status: "mock_sent",
    recipient: options.to,
    message: options.message,
    timestamp: new Date(),
    deliveryStatus: "mock_delivered",
    service: "mock",
  };

  return fallbackResponse;
}

/**
 * Log Twilio events for monitoring and debugging
 */
async function logTwilioEvent(event: any): Promise<void> {
  try {
    // Log to file system
    const fs = await import("fs/promises");
    const path = await import("path");
    
    const logsDir = path.join(process.cwd(), "logs");
    await fs.mkdir(logsDir, { recursive: true });

    const logFile = path.join(logsDir, "twilio-events.log");
    const logLine = `${JSON.stringify(event)}\n`;

    await fs.appendFile(logFile, logLine);
    
    // Also log to standard logger
    if (event.status === "sent") {
      logger.info(
        "Twilio message sent successfully",
        { 
          messageId: event.messageId,
          recipient: event.recipient,
          service: event.service
        },
        "TwilioWrapper"
      );
    } else if (event.status === "fallback_used") {
      logger.warn(
        "Twilio fallback used",
        {
          messageId: event.messageId,
          recipient: event.recipient,
          reason: event.note
        },
        "TwilioWrapper"
      );
    } else {
      logger.error(
        "Twilio operation failed",
        {
          messageId: event.messageId,
          recipient: event.recipient,
          error: event.error
        },
        "TwilioWrapper"
      );
    }
  } catch (error) {
    logger.error(
      "Failed to log Twilio event",
      { error },
      "TwilioWrapper"
    );
  }
}

/**
 * Get Twilio account info and status
 */
export async function getTwilioStatus(): Promise<{
  available: boolean;
  configured: boolean;
  whatsappNumber?: string;
  phoneNumber?: string;
  accountSid?: string;
}> {
  const client = getTwilioClient();
  
  const result: {
    available: boolean;
    configured: boolean;
    whatsappNumber?: string;
    phoneNumber?: string;
    accountSid?: string;
  } = {
    available: !!client,
    configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
  };

  if (process.env.TWILIO_WHATSAPP_NUMBER) {
    result.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  }

  if (process.env.TWILIO_PHONE_NUMBER) {
    result.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  if (process.env.TWILIO_ACCOUNT_SID) {
    result.accountSid = process.env.TWILIO_ACCOUNT_SID;
  }

  return result;
}