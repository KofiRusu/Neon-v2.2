import {
  TwilioWithFallback,
  sendTwilioWithFallback,
  getTwilioWithFallback,
  initializeTwilioWithFallback,
  FallbackMetrics,
} from '../utils/twilioWithFallback';

// Mock dependencies
jest.mock('@neon/utils', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock SendGrid
const mockSendGridSend = jest.fn();
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: mockSendGridSend,
}), { virtual: true });

describe('TwilioWithFallback', () => {
  let mockTwilioClient: any;
  let mockEmailService: any;
  let twilioWithFallback: TwilioWithFallback;

  beforeEach(() => {
    jest.clearAllMocks();
    FallbackMetrics.reset();

    // Mock Twilio client
    mockTwilioClient = {
      messages: {
        create: jest.fn(),
      },
    };

    // Mock email fallback service
    mockEmailService = {
      sendFallbackNotification: jest.fn(),
    };

    // Set up environment variables
    process.env.TWILIO_PHONE_NUMBER = '+1234567890';
    process.env.TWILIO_WHATSAPP_NUMBER = 'whatsapp:+1234567890';
    process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
    process.env.SENDGRID_FROM_EMAIL = 'test@neonhub.ai';

    twilioWithFallback = new TwilioWithFallback(mockTwilioClient, mockEmailService, {
      retries: 2,
      delay: 100,
      timeoutMs: 5000,
    });
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.TWILIO_PHONE_NUMBER;
    delete process.env.TWILIO_WHATSAPP_NUMBER;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_FROM_EMAIL;
  });

  describe('SMS Functionality', () => {
    it('should send SMS successfully on first attempt', async () => {
      const mockResponse = {
        sid: 'test-message-id',
        status: 'queued',
      };
      mockTwilioClient.messages.create.mockResolvedValue(mockResponse);

      const result = await twilioWithFallback.sendSMS('+1234567890', 'Test message');

      expect(result).toEqual({
        success: true,
        messageId: 'test-message-id',
        status: 'queued',
        service: 'twilio_sms',
      });

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        from: '+1234567890',
        to: '+1234567890',
        body: 'Test message',
      });

      const metrics = FallbackMetrics.getMetrics();
      expect(metrics.totalAttempts).toBe(1);
      expect(metrics.successfulSends).toBe(1);
      expect(metrics.failedAfterRetries).toBe(0);
    });

    it('should retry SMS and eventually succeed', async () => {
      mockTwilioClient.messages.create
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({
          sid: 'test-message-id',
          status: 'queued',
        });

      const result = await twilioWithFallback.sendSMS('+1234567890', 'Test message');

      expect(result.success).toBe(true);
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(2);

      const metrics = FallbackMetrics.getMetrics();
      expect(metrics.totalAttempts).toBe(1);
      expect(metrics.successfulSends).toBe(1);
    });

    it('should fallback to email when SMS fails after retries', async () => {
      mockTwilioClient.messages.create.mockRejectedValue(new Error('Service unavailable'));
      mockEmailService.sendFallbackNotification.mockResolvedValue({
        success: true,
        messageId: 'fallback-email-id',
        service: 'sendgrid_fallback',
      });

      const result = await twilioWithFallback.sendSMS('+1234567890', 'Test message');

      expect(result).toEqual({
        success: true,
        messageId: 'fallback-email-id',
        status: 'delivered_via_email',
        service: 'sendgrid_fallback',
        fallbackUsed: true,
        fallbackReason: 'Twilio API failed after retries',
      });

      expect(mockEmailService.sendFallbackNotification).toHaveBeenCalledWith({
        to: '+1234567890',
        originalMessage: 'Test message',
        messageType: 'sms',
        reason: 'Twilio API failed after retries',
      });

      const metrics = FallbackMetrics.getMetrics();
      expect(metrics.failedAfterRetries).toBe(1);
      expect(metrics.emailFallbacks).toBe(1);
    });

    it('should handle missing Twilio configuration', async () => {
      delete process.env.TWILIO_PHONE_NUMBER;
      mockEmailService.sendFallbackNotification.mockResolvedValue({
        success: true,
        messageId: 'fallback-email-id',
        service: 'sendgrid_fallback',
      });

      const result = await twilioWithFallback.sendSMS('+1234567890', 'Test message');

      expect(result.fallbackUsed).toBe(true);
      expect(result.fallbackReason).toBe('Twilio not configured');
      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled();
    });
  });

  describe('WhatsApp Functionality', () => {
    it('should send WhatsApp message successfully', async () => {
      const mockResponse = {
        sid: 'whatsapp-message-id',
        status: 'queued',
      };
      mockTwilioClient.messages.create.mockResolvedValue(mockResponse);

      const result = await twilioWithFallback.sendWhatsApp('+1234567890', 'Test WhatsApp message');

      expect(result).toEqual({
        success: true,
        messageId: 'whatsapp-message-id',
        status: 'queued',
        service: 'twilio_whatsapp',
      });

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        from: 'whatsapp:+1234567890',
        to: 'whatsapp:+1234567890',
        body: 'Test WhatsApp message',
      });
    });

    it('should handle WhatsApp number already prefixed', async () => {
      const mockResponse = {
        sid: 'whatsapp-message-id',
        status: 'queued',
      };
      mockTwilioClient.messages.create.mockResolvedValue(mockResponse);

      await twilioWithFallback.sendWhatsApp('whatsapp:+1234567890', 'Test message');

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        from: 'whatsapp:+1234567890',
        to: 'whatsapp:+1234567890',
        body: 'Test message',
      });
    });

    it('should fallback to email when WhatsApp fails', async () => {
      mockTwilioClient.messages.create.mockRejectedValue(new Error('WhatsApp service down'));
      mockEmailService.sendFallbackNotification.mockResolvedValue({
        success: true,
        messageId: 'fallback-email-id',
        service: 'sendgrid_fallback',
      });

      const result = await twilioWithFallback.sendWhatsApp('+1234567890', 'Test message');

      expect(result.fallbackUsed).toBe(true);
      expect(mockEmailService.sendFallbackNotification).toHaveBeenCalledWith({
        to: '+1234567890',
        originalMessage: 'Test message',
        messageType: 'whatsapp',
        reason: 'Twilio WhatsApp API failed after retries',
      });
    });
  });

  describe('Default Email Fallback Service', () => {
    let twilioWithDefaultFallback: TwilioWithFallback;

    beforeEach(() => {
      twilioWithDefaultFallback = new TwilioWithFallback(mockTwilioClient);
    });

    it('should use SendGrid when configured', async () => {
      mockSendGridSend.mockResolvedValue([{
        statusCode: 202,
        headers: { 'x-message-id': 'sendgrid-message-id' },
      }, {}]);

      mockTwilioClient.messages.create.mockRejectedValue(new Error('Twilio error'));

      const result = await twilioWithDefaultFallback.sendSMS('+1234567890', 'Test message');

      expect(result.success).toBe(true);
      expect(result.service).toBe('sendgrid_fallback');
      expect(mockSendGridSend).toHaveBeenCalled();
    });

    it('should use mock mode when SendGrid not configured', async () => {
      delete process.env.SENDGRID_API_KEY;
      mockTwilioClient.messages.create.mockRejectedValue(new Error('Twilio error'));

      const result = await twilioWithDefaultFallback.sendSMS('+1234567890', 'Test message');

      expect(result.success).toBe(true);
      expect(result.service).toBe('mock_email_fallback');
      expect(mockSendGridSend).not.toHaveBeenCalled();
    });
  });

  describe('Convenience Functions', () => {
    it('should send SMS using convenience function', async () => {
      // Initialize with mock client
      initializeTwilioWithFallback(mockTwilioClient);

      mockTwilioClient.messages.create.mockResolvedValue({
        sid: 'convenience-sms-id',
        status: 'queued',
      });

      const result = await sendTwilioWithFallback('+1234567890', 'Convenience SMS');

      expect(result.success).toBe(true);
      expect(result.service).toBe('twilio_sms');
    });

    it('should send WhatsApp using convenience function', async () => {
      initializeTwilioWithFallback(mockTwilioClient);

      mockTwilioClient.messages.create.mockResolvedValue({
        sid: 'convenience-whatsapp-id',
        status: 'queued',
      });

      const result = await sendTwilioWithFallback('+1234567890', 'Convenience WhatsApp', 'whatsapp');

      expect(result.success).toBe(true);
      expect(result.service).toBe('twilio_whatsapp');
    });

    it('should auto-initialize when not explicitly initialized', async () => {
      // Reset instance
      (getTwilioWithFallback as any).twilioWithFallbackInstance = null;

      const result = await sendTwilioWithFallback('+1234567890', 'Auto-init test');

      expect(result.success).toBe(true);
      expect(result.fallbackUsed).toBe(true); // Since we don't have real Twilio configured
    });
  });

  describe('Metrics Tracking', () => {
    it('should track metrics correctly for successful sends', async () => {
      mockTwilioClient.messages.create.mockResolvedValue({
        sid: 'test-id',
        status: 'queued',
      });

      await twilioWithFallback.sendSMS('+1234567890', 'Test 1');
      await twilioWithFallback.sendWhatsApp('+1234567890', 'Test 2');

      const metrics = FallbackMetrics.getMetrics();
      expect(metrics.totalAttempts).toBe(2);
      expect(metrics.successfulSends).toBe(2);
      expect(metrics.failedAfterRetries).toBe(0);
      expect(metrics.emailFallbacks).toBe(0);
    });

    it('should track metrics correctly for fallbacks', async () => {
      mockTwilioClient.messages.create.mockRejectedValue(new Error('Always fail'));
      mockEmailService.sendFallbackNotification.mockResolvedValue({
        success: true,
        messageId: 'fallback-id',
        service: 'email',
      });

      await twilioWithFallback.sendSMS('+1234567890', 'Test 1');
      await twilioWithFallback.sendWhatsApp('+1234567890', 'Test 2');

      const metrics = FallbackMetrics.getMetrics();
      expect(metrics.totalAttempts).toBe(2);
      expect(metrics.successfulSends).toBe(0);
      expect(metrics.failedAfterRetries).toBe(2);
      expect(metrics.emailFallbacks).toBe(2);
    });

    it('should reset metrics correctly', async () => {
      FallbackMetrics.increment('totalAttempts');
      FallbackMetrics.increment('successfulSends');

      let metrics = FallbackMetrics.getMetrics();
      expect(metrics.totalAttempts).toBe(1);
      expect(metrics.successfulSends).toBe(1);

      FallbackMetrics.reset();

      metrics = FallbackMetrics.getMetrics();
      expect(metrics.totalAttempts).toBe(0);
      expect(metrics.successfulSends).toBe(0);
    });
  });

  describe('Configuration Options', () => {
    it('should respect custom retry configuration', async () => {
      const customTwilio = new TwilioWithFallback(mockTwilioClient, mockEmailService, {
        retries: 1,
        delay: 50,
        timeoutMs: 1000,
      });

      mockTwilioClient.messages.create.mockRejectedValue(new Error('Fail'));
      mockEmailService.sendFallbackNotification.mockResolvedValue({
        success: true,
        messageId: 'fallback-id',
        service: 'email',
      });

      const startTime = Date.now();
      await customTwilio.sendSMS('+1234567890', 'Test');
      const endTime = Date.now();

      // Should fail faster with only 1 retry
      expect(endTime - startTime).toBeLessThan(500);
      expect(mockTwilioClient.messages.create).toHaveBeenCalledTimes(1);
    });

    it('should disable email fallback when configured', async () => {
      const noFallbackTwilio = new TwilioWithFallback(mockTwilioClient, mockEmailService, {
        enableEmailFallback: false,
      });

      mockTwilioClient.messages.create.mockRejectedValue(new Error('Fail'));

      const result = await noFallbackTwilio.sendSMS('+1234567890', 'Test');

      expect(result.service).toBe('fallback_log');
      expect(mockEmailService.sendFallbackNotification).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle email fallback service failure gracefully', async () => {
      mockTwilioClient.messages.create.mockRejectedValue(new Error('Twilio error'));
      mockEmailService.sendFallbackNotification.mockRejectedValue(new Error('Email service down'));

      const result = await twilioWithFallback.sendSMS('+1234567890', 'Test');

      expect(result.service).toBe('fallback_log');
      expect(result.fallbackUsed).toBe(true);
      expect(result.success).toBe(true); // Should still report success with ultimate fallback
    });

    it('should handle Twilio client being null', async () => {
      const nullClientTwilio = new TwilioWithFallback(null, mockEmailService);
      mockEmailService.sendFallbackNotification.mockResolvedValue({
        success: true,
        messageId: 'fallback-id',
        service: 'email',
      });

      const result = await nullClientTwilio.sendSMS('+1234567890', 'Test');

      expect(result.fallbackUsed).toBe(true);
      expect(result.fallbackReason).toBe('Twilio not configured');
    });
  });
}); 