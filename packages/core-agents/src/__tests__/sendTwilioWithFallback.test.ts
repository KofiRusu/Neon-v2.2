import { sendTwilioWithFallback, getTwilioClient, sendFallbackEmail } from "../utils/sendTwilioWithFallback";
import { logger } from "@neon/utils";

// Mock dependencies
jest.mock("@neon/utils", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../utils/withRetry", () => ({
  withRetryTimeoutFallback: jest.fn(),
}));

const mockWithRetryTimeoutFallback = require("../utils/withRetry").withRetryTimeoutFallback;

// Mock Twilio
const mockTwilioCreate = jest.fn();
const mockTwilioClient = {
  messages: {
    create: mockTwilioCreate,
  },
};

jest.mock('twilio', () => jest.fn(() => mockTwilioClient));

describe('sendTwilioWithFallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment variables
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_WHATSAPP_NUMBER;
  });

  describe('getTwilioClient', () => {
    it('should return null when credentials are not set', () => {
      const client = getTwilioClient();
      expect(client).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        "Twilio credentials not found. Operations will use fallback mode.",
        {},
        "TwilioWrapper"
      );
    });

    it('should initialize Twilio client when credentials are set', () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';

      const client = getTwilioClient();
      expect(client).toBe(mockTwilioClient);
      expect(logger.info).toHaveBeenCalledWith(
        "Twilio client initialized successfully",
        {},
        "TwilioWrapper"
      );
    });

    it('should initialize Twilio client when credentials are provided', () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';

      const client = getTwilioClient();
      expect(client).toBeTruthy();
      expect(client).toBe(mockTwilioClient);
    });
  });

  describe('sendTwilioWithFallback', () => {
    it('should use withRetryTimeoutFallback with correct parameters', async () => {
      const mockResult = {
        success: true,
        sid: 'test_sid',
        status: 'sent'
      };

      mockWithRetryTimeoutFallback.mockResolvedValue(mockResult);

      const result = await sendTwilioWithFallback('+1234567890', 'Test message');

      expect(mockWithRetryTimeoutFallback).toHaveBeenCalledWith(
        expect.any(Function), // The main function
        {
          success: true,
          sid: expect.stringMatching(/^mock_\d+$/),
          status: "fallback_email_sent",
        },
        {
          retries: 3,
          delay: 1500,
          timeoutMs: 20000,
        }
      );

      expect(result).toEqual(mockResult);
    });

    it('should format WhatsApp number correctly', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_WHATSAPP_NUMBER = 'whatsapp:+1234567890';

      mockTwilioCreate.mockResolvedValue({
        sid: 'test_sid',
        status: 'queued'
      });

      // Mock withRetryTimeoutFallback to call the function directly
      mockWithRetryTimeoutFallback.mockImplementation(async (fn: any, _fallback: any, _options: any) => {
        return await fn();
      });

      await sendTwilioWithFallback('+1234567890', 'Test message');

      expect(mockTwilioCreate).toHaveBeenCalledWith({
        from: 'whatsapp:+1234567890',
        to: 'whatsapp:+1234567890',
        body: 'Test message',
      });
    });

    it('should handle phone numbers already formatted for WhatsApp', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_WHATSAPP_NUMBER = 'whatsapp:+1234567890';

      mockTwilioCreate.mockResolvedValue({
        sid: 'test_sid',
        status: 'queued'
      });

      mockWithRetryTimeoutFallback.mockImplementation(async (fn: any, _fallback: any, _options: any) => {
        return await fn();
      });

      await sendTwilioWithFallback('whatsapp:+1234567890', 'Test message');

      expect(mockTwilioCreate).toHaveBeenCalledWith({
        from: 'whatsapp:+1234567890',
        to: 'whatsapp:+1234567890',
        body: 'Test message',
      });
    });

    it('should throw error when Twilio client is not available', async () => {
      // No credentials set, client will be null
      mockWithRetryTimeoutFallback.mockImplementation(async (fn: any, fallback: any, _options: any) => {
        try {
          return await fn();
        } catch (error) {
          return fallback;
        }
      });

      const result = await sendTwilioWithFallback('+1234567890', 'Test message');

      expect(result).toEqual({
        success: true,
        sid: expect.stringMatching(/^mock_\d+$/),
        status: "fallback_email_sent",
      });
    });

    it('should throw error when TWILIO_WHATSAPP_NUMBER is not configured', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      // TWILIO_WHATSAPP_NUMBER not set

      mockWithRetryTimeoutFallback.mockImplementation(async (fn: any, fallback: any, _options: any) => {
        try {
          return await fn();
        } catch (error) {
          return fallback;
        }
      });

      const result = await sendTwilioWithFallback('+1234567890', 'Test message');

      expect(result).toEqual({
        success: true,
        sid: expect.stringMatching(/^mock_\d+$/),
        status: "fallback_email_sent",
      });
    });

    it('should log successful message sending', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_WHATSAPP_NUMBER = 'whatsapp:+1234567890';

      mockTwilioCreate.mockResolvedValue({
        sid: 'test_sid_123',
        status: 'queued'
      });

      mockWithRetryTimeoutFallback.mockImplementation(async (fn: any, _fallback: any, _options: any) => {
        return await fn();
      });

      await sendTwilioWithFallback('+1234567890', 'Test message');

      expect(logger.info).toHaveBeenCalledWith(
        "Twilio message sent successfully",
        { 
          sid: 'test_sid_123',
          status: 'queued',
          to: 'whatsapp:+1234567890'
        },
        "TwilioWrapper"
      );
    });

    it('should return correct response format on success', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_WHATSAPP_NUMBER = 'whatsapp:+1234567890';

      mockTwilioCreate.mockResolvedValue({
        sid: 'test_sid_123',
        status: 'queued'
      });

      mockWithRetryTimeoutFallback.mockImplementation(async (fn: any, _fallback: any, _options: any) => {
        return await fn();
      });

      const result = await sendTwilioWithFallback('+1234567890', 'Test message');

      expect(result).toEqual({
        success: true,
        sid: 'test_sid_123',
        status: 'queued',
      });
    });
  });

  describe('sendFallbackEmail', () => {
    it('should log fallback attempt with recipient and message preview', async () => {
      const result = await sendFallbackEmail('+1234567890', 'This is a test message');

      expect(logger.warn).toHaveBeenCalledWith(
        "Twilio WhatsApp failed, fallback email would be sent",
        { 
          originalRecipient: '+1234567890',
          messagePreview: 'This is a test message'
        },
        "TwilioWrapper"
      );

      expect(result).toEqual({
        success: true,
        messageId: expect.stringMatching(/^fallback_email_\d+$/),
      });
    });

    it('should truncate long messages in preview', async () => {
      const longMessage = 'A'.repeat(150);
      const result = await sendFallbackEmail('+1234567890', longMessage);

      expect(logger.warn).toHaveBeenCalledWith(
        "Twilio WhatsApp failed, fallback email would be sent",
        { 
          originalRecipient: '+1234567890',
          messagePreview: 'A'.repeat(100) + '...'
        },
        "TwilioWrapper"
      );

      expect(result).toEqual({
        success: true,
        messageId: expect.stringMatching(/^fallback_email_\d+$/),
      });
    });

    it('should not truncate short messages', async () => {
      const shortMessage = 'Short message';
      const result = await sendFallbackEmail('+1234567890', shortMessage);

      expect(logger.warn).toHaveBeenCalledWith(
        "Twilio WhatsApp failed, fallback email would be sent",
        { 
          originalRecipient: '+1234567890',
          messagePreview: 'Short message'
        },
        "TwilioWrapper"
      );

      expect(result).toEqual({
        success: true,
        messageId: expect.stringMatching(/^fallback_email_\d+$/),
      });
    });
  });

  describe('Integration with withRetryTimeoutFallback', () => {
    it('should use correct retry configuration', async () => {
      const mockResult = {
        success: true,
        sid: 'test_sid',
        status: 'sent'
      };

      mockWithRetryTimeoutFallback.mockResolvedValue(mockResult);

      await sendTwilioWithFallback('+1234567890', 'Test message');

      const [, , config] = mockWithRetryTimeoutFallback.mock.calls[0];
      expect(config).toEqual({
        retries: 3,
        delay: 1500,
        timeoutMs: 20000,
      });
    });

    it('should provide correct fallback response', async () => {
      const mockResult = {
        success: true,
        sid: 'test_sid',
        status: 'sent'
      };

      mockWithRetryTimeoutFallback.mockResolvedValue(mockResult);

      await sendTwilioWithFallback('+1234567890', 'Test message');

      const [, fallback] = mockWithRetryTimeoutFallback.mock.calls[0];
      expect(fallback).toEqual({
        success: true,
        sid: expect.stringMatching(/^mock_\d+$/),
        status: "fallback_email_sent",
      });
    });
  });
}); 