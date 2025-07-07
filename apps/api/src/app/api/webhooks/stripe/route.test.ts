import { POST, GET } from './route';
import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';
import Stripe from 'stripe';

// Mock dependencies
jest.mock('stripe');
jest.mock('@neon/data-model', () => ({
  prisma: {
    monthlyBudget: {
      upsert: jest.fn(),
    },
    billingLog: {
      create: jest.fn(),
    },
  },
}));

// Mock environment variables
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';

// Mock Stripe webhook construction
const mockStripe = {
  webhooks: {
    constructEvent: jest.fn(),
  },
  customers: {
    retrieve: jest.fn(),
  },
};

(Stripe as jest.MockedClass<typeof Stripe>).mockImplementation(() => mockStripe as any);

describe('Stripe Webhook Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/webhooks/stripe', () => {
    it('should return health check response', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('supportedEvents');
      expect(data.supportedEvents).toContain('checkout.session.completed');
    });
  });

  describe('POST /api/webhooks/stripe', () => {
    it('should return 400 if no signature is provided', async () => {
      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
        headers: {
          'content-type': 'application/json',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 if signature verification fails', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'invalid-signature',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should handle checkout.session.completed event', async () => {
      const mockEvent = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_test_123',
            customer_email: 'test@example.com',
            amount_total: 5000, // $50.00 in cents
            payment_status: 'paid',
            metadata: {
              source: 'marketing_topup',
            },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid-signature',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const { prisma } = require('@neon/data-model');
      expect(prisma.monthlyBudget.upsert).toHaveBeenCalledWith({
        where: { month: expect.any(String) },
        update: {
          totalBudget: {
            increment: 50.0,
          },
          isAlertSent: false,
        },
        create: {
          month: expect.any(String),
          totalBudget: 50.0,
          totalSpent: 0,
          alertThreshold: 0.8,
          isAlertSent: false,
        },
      });
    });

    it('should handle invoice.payment_succeeded event', async () => {
      const mockEvent = {
        id: 'evt_test_456',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test_123',
            customer: 'cus_test_123',
            customer_email: 'test@example.com',
            amount_paid: 2500, // $25.00 in cents
            number: 'INV-001',
            metadata: {
              source: 'subscription_payment',
            },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid-signature',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const { prisma } = require('@neon/data-model');
      expect(prisma.monthlyBudget.upsert).toHaveBeenCalledWith({
        where: { month: expect.any(String) },
        update: {
          totalBudget: {
            increment: 25.0,
          },
          isAlertSent: false,
        },
        create: {
          month: expect.any(String),
          totalBudget: 25.0,
          totalSpent: 0,
          alertThreshold: 0.8,
          isAlertSent: false,
        },
      });
    });

    it('should handle customer.subscription.updated event', async () => {
      const mockEvent = {
        id: 'evt_test_789',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test_123',
            customer: 'cus_test_123',
            status: 'active',
            items: {
              data: [
                {
                  price: {
                    id: 'price_test_123',
                  },
                },
              ],
            },
            current_period_end: 1234567890,
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);
      mockStripe.customers.retrieve.mockResolvedValue({
        email: 'test@example.com',
      });

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid-signature',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const { prisma } = require('@neon/data-model');
      expect(prisma.billingLog.create).toHaveBeenCalledWith({
        data: {
          agentType: 'BILLING',
          tokens: 0,
          cost: 0,
          task: 'Stripe webhook: customer.subscription.updated',
          executionId: 'evt_test_789',
          metadata: expect.objectContaining({
            stripeEventId: 'evt_test_789',
            stripeEventType: 'customer.subscription.updated',
            customerId: 'cus_test_123',
            customerEmail: 'test@example.com',
            status: 'active',
          }),
        },
      });
    });

    it('should ignore unhandled event types', async () => {
      const mockEvent = {
        id: 'evt_test_999',
        type: 'customer.created',
        data: {
          object: {
            id: 'cus_test_123',
            email: 'test@example.com',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid-signature',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const { prisma } = require('@neon/data-model');
      expect(prisma.monthlyBudget.upsert).not.toHaveBeenCalled();
    });

    it('should handle missing customer email gracefully', async () => {
      const mockEvent = {
        id: 'evt_test_no_email',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_test_123',
            customer_email: null,
            amount_total: 5000,
            payment_status: 'paid',
            metadata: {
              source: 'marketing_topup',
            },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid-signature',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const { prisma } = require('@neon/data-model');
      expect(prisma.monthlyBudget.upsert).not.toHaveBeenCalled();
    });

    it('should handle zero amount gracefully', async () => {
      const mockEvent = {
        id: 'evt_test_zero',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_test_123',
            customer_email: 'test@example.com',
            amount_total: 0,
            payment_status: 'paid',
            metadata: {
              source: 'marketing_topup',
            },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid-signature',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const { prisma } = require('@neon/data-model');
      expect(prisma.monthlyBudget.upsert).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const mockEvent = {
        id: 'evt_test_db_error',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_test_123',
            customer_email: 'test@example.com',
            amount_total: 5000,
            payment_status: 'paid',
            metadata: {
              source: 'marketing_topup',
            },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const { prisma } = require('@neon/data-model');
      prisma.monthlyBudget.upsert.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid-signature',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
}); 