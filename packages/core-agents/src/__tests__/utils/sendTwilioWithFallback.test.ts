import {
  sendTwilioWithFallback,
  sendWhatsAppWithFallback,
  sendSMSWithFallback,
  initializeTwilioClient,
  getTwilioStatus,
  TwilioMessageOptions,
} from '../../utils/sendTwilioWithFallback';

// Mock dependencies
jest.mock('@neon/utils', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../utils/withRetry', () => ({
  withRetryTimeoutFallback: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  appendFile: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

// Mock Twilio
const mockTwilioCreate = jest.fn();
const mockTwilioClient = {
  messages: {
    create: mockTwilioCreate,
  },
};

jest.mock('twilio', () => jest.fn(() => mockTwilioClient));

const { withRetryTimeoutFallback } = require('../../utils/withRetry');

describe('sendTwilioWithFallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // Reset environment variables
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_WHATSAPP_NUMBER;
    delete process.env.TWILIO_PHONE_NUMBER;
    
    // Mock withRetryTimeoutFallback to call the function directly for testing
    withRetryTimeoutFallback.mockImplementation(async (fn: any, fallback: any) => {
      try {
        return await fn();
      } catch (error) {
        return fallback;
      }
    });
  });

  describe('initializeTwilioClient', () => {
    it('should initialize Twilio client when credentials are provided', () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';

      const client = initializeTwilioClient();

      expect(client).toBeTruthy();
      expect(require('twilio')).toHaveBeenCalledWith('test_sid', 'test_token');
    });

    it('should return null when credentials are missing', () => {
      const client = initializeTwilioClient();

      expect(client).toBeNull();
      expect(require('twilio')).not.toHaveBeenCalled();
    });

    it('should handle Twilio initialization errors', () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      
      require('twilio').mockImplementationOnce(() => {
        throw new Error('Twilio initialization failed');
      });

      const client = initializeTwilioClient();

      expect(client).toBeNull();
    });
  });

  describe('sendTwilioWithFallback', () => {
    const mockOptions: TwilioMessageOptions = {
      to: '+1234567890',
      message: 'Test message',
      messageType: 'text',
    };

    it('should send message successfully when Twilio is available', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1987654321';

      const mockResponse = {
        sid: 'test_message_sid',
        status: 'sent',
      };

      mockTwilioCreate.mockResolvedValueOnce(mockResponse);

      const result = await sendTwilioWithFallback(mockOptions);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test_message_sid');
      expect(result.service).toBe('twilio');
      expect(result.deliveryStatus).toBe('sent');
    });

    it('should use fallback when Twilio client is not available', async () => {
      const result = await sendTwilioWithFallback(mockOptions);

      expect(result.success).toBe(true);
      expect(result.service).toBe('mock');
      expect(result.status).toBe('mock_sent');
      expect(result.messageId).toContain('fallback_');
    });

    it('should use fallback when no phone number is configured', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      // No phone number set

      const result = await sendTwilioWithFallback(mockOptions);

      expect(result.success).toBe(true);
      expect(result.service).toBe('mock');
      expect(result.status).toBe('mock_sent');
    });

    it('should handle media messages', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1987654321';

      const mediaOptions: TwilioMessageOptions = {
        to: '+1234567890',
        message: 'Test media message',
        messageType: 'media',
        mediaUrls: ['https://example.com/image.jpg'],
      };

      const mockResponse = {
        sid: 'test_media_sid',
        status: 'sent',
      };

      mockTwilioCreate.mockResolvedValueOnce(mockResponse);

      await sendTwilioWithFallback(mediaOptions);

      expect(mockTwilioCreate).toHaveBeenCalledWith({
        from: '+1987654321',
        to: '+1234567890',
        body: 'Test media message',
        mediaUrl: ['https://example.com/image.jpg'],
      });
    });

    it('should use custom from number when provided', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';

      const customOptions: TwilioMessageOptions = {
        to: '+1234567890',
        message: 'Test message',
        customFrom: '+1555555555',
      };

      const mockResponse = {
        sid: 'test_custom_sid',
        status: 'sent',
      };

      mockTwilioCreate.mockResolvedValueOnce(mockResponse);

      await sendTwilioWithFallback(customOptions);

      expect(mockTwilioCreate).toHaveBeenCalledWith({
        from: '+1555555555',
        to: '+1234567890',
        body: 'Test message',
      });
    });

    it('should use fallback when Twilio API call fails', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1987654321';

             // Mock withRetryTimeoutFallback to simulate failure and use fallback
       withRetryTimeoutFallback.mockImplementationOnce(async (fn: any, fallback: any) => {
         try {
           await fn();
         } catch (error) {
           return fallback;
         }
       });

      mockTwilioCreate.mockRejectedValueOnce(new Error('Twilio API error'));

      const result = await sendTwilioWithFallback(mockOptions);

      expect(result.success).toBe(true);
      expect(result.service).toBe('mock');
      expect(result.messageId).toContain('fallback_');
    });
  });

  describe('sendWhatsAppWithFallback', () => {
    it('should format WhatsApp number correctly', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_WHATSAPP_NUMBER = 'whatsapp:+1987654321';

      const mockResponse = {
        sid: 'whatsapp_test_sid',
        status: 'sent',
      };

      mockTwilioCreate.mockResolvedValueOnce(mockResponse);

      await sendWhatsAppWithFallback('+1234567890', 'Hello WhatsApp');

      expect(mockTwilioCreate).toHaveBeenCalledWith({
        from: 'whatsapp:+1987654321',
        to: 'whatsapp:+1234567890',
        body: 'Hello WhatsApp',
      });
    });

    it('should handle already formatted WhatsApp numbers', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_WHATSAPP_NUMBER = 'whatsapp:+1987654321';

      const mockResponse = {
        sid: 'whatsapp_test_sid',
        status: 'sent',
      };

      mockTwilioCreate.mockResolvedValueOnce(mockResponse);

      await sendWhatsAppWithFallback('whatsapp:+1234567890', 'Hello WhatsApp');

      expect(mockTwilioCreate).toHaveBeenCalledWith({
        from: 'whatsapp:+1987654321',
        to: 'whatsapp:+1234567890',
        body: 'Hello WhatsApp',
      });
    });

    it('should handle media messages in WhatsApp', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_WHATSAPP_NUMBER = 'whatsapp:+1987654321';

      const mockResponse = {
        sid: 'whatsapp_media_sid',
        status: 'sent',
      };

      mockTwilioCreate.mockResolvedValueOnce(mockResponse);

      await sendWhatsAppWithFallback(
        '+1234567890',
        'Check out this image',
        ['https://example.com/image.jpg']
      );

      expect(mockTwilioCreate).toHaveBeenCalledWith({
        from: 'whatsapp:+1987654321',
        to: 'whatsapp:+1234567890',
        body: 'Check out this image',
        mediaUrl: ['https://example.com/image.jpg'],
      });
    });
  });

  describe('sendSMSWithFallback', () => {
    it('should send SMS with proper phone number formatting', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1987654321';

      const mockResponse = {
        sid: 'sms_test_sid',
        status: 'sent',
      };

      mockTwilioCreate.mockResolvedValueOnce(mockResponse);

      await sendSMSWithFallback('1234567890', 'Hello SMS');

      expect(mockTwilioCreate).toHaveBeenCalledWith({
        from: '+1987654321',
        to: '+1234567890',
        body: 'Hello SMS',
      });
    });

    it('should handle already formatted phone numbers', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1987654321';

      const mockResponse = {
        sid: 'sms_test_sid',
        status: 'sent',
      };

      mockTwilioCreate.mockResolvedValueOnce(mockResponse);

      await sendSMSWithFallback('+1234567890', 'Hello SMS');

      expect(mockTwilioCreate).toHaveBeenCalledWith({
        from: '+1987654321',
        to: '+1234567890',
        body: 'Hello SMS',
      });
    });
  });

  describe('getTwilioStatus', () => {
    it('should return correct status when Twilio is fully configured', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_WHATSAPP_NUMBER = 'whatsapp:+1987654321';
      process.env.TWILIO_PHONE_NUMBER = '+1987654321';

      const status = await getTwilioStatus();

      expect(status).toEqual({
        available: true,
        configured: true,
        whatsappNumber: 'whatsapp:+1987654321',
        phoneNumber: '+1987654321',
        accountSid: 'test_sid',
      });
    });

    it('should return correct status when Twilio is not configured', async () => {
      const status = await getTwilioStatus();

      expect(status).toEqual({
        available: false,
        configured: false,
      });
    });

    it('should return partial configuration status', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1987654321';
      // WhatsApp number not set

      const status = await getTwilioStatus();

      expect(status).toEqual({
        available: true,
        configured: true,
        phoneNumber: '+1987654321',
        accountSid: 'test_sid',
      });
    });
  });

  describe('phone number formatting', () => {
    it('should format various phone number formats correctly', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1987654321';

      const mockResponse = {
        sid: 'format_test_sid',
        status: 'sent',
      };

      mockTwilioCreate.mockResolvedValue(mockResponse);

      // Test various formats
      const phoneNumbers = [
        '1234567890',
        '+1234567890',
        '(123) 456-7890',
        '123-456-7890',
        '123.456.7890',
      ];

      for (const phone of phoneNumbers) {
        await sendSMSWithFallback(phone, 'Test message');
      }

      // All should be formatted to +1234567890
      expect(mockTwilioCreate).toHaveBeenCalledTimes(phoneNumbers.length);
      mockTwilioCreate.mock.calls.forEach((call) => {
        expect(call[0].to).toBe('+1234567890');
      });
    });
  });

  describe('error handling and logging', () => {
    it('should log successful messages', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1987654321';

      const mockResponse = {
        sid: 'log_test_sid',
        status: 'sent',
      };

      mockTwilioCreate.mockResolvedValueOnce(mockResponse);

      await sendSMSWithFallback('+1234567890', 'Test message');

      const { logger } = require('@neon/utils');
      expect(logger.info).toHaveBeenCalledWith(
        'Twilio message sent successfully',
        expect.objectContaining({
          messageId: 'log_test_sid',
          recipient: '+1234567890',
          service: 'twilio',
        }),
        'TwilioWrapper'
      );
    });

    it('should log fallback usage', async () => {
      await sendSMSWithFallback('+1234567890', 'Test message');

      const { logger } = require('@neon/utils');
      expect(logger.warn).toHaveBeenCalledWith(
        'Twilio fallback used',
        expect.objectContaining({
          recipient: '+1234567890',
          reason: 'Twilio unavailable, using fallback response',
        }),
        'TwilioWrapper'
      );
    });
  });

  describe('retry and timeout configuration', () => {
    it('should call withRetryTimeoutFallback with correct parameters', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1987654321';

      const mockResponse = {
        sid: 'retry_test_sid',
        status: 'sent',
      };

      mockTwilioCreate.mockResolvedValueOnce(mockResponse);

      await sendSMSWithFallback('+1234567890', 'Test message');

      expect(withRetryTimeoutFallback).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          success: true,
          service: 'mock',
          status: 'mock_sent',
        }),
        {
          retries: 3,
          delay: 1500,
          timeoutMs: 20000,
        }
      );
    });
  });
});