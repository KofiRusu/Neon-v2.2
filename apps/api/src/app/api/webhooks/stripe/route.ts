import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@neon/data-model';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Supported event types for billing
const HANDLED_EVENTS = [
  'checkout.session.completed',
  'invoice.payment_succeeded',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
  'customer.subscription.created',
] as const;

type HandledEvent = typeof HANDLED_EVENTS[number];

// Billing service to handle funds addition
class BillingService {
  /**
   * Add funds to user's marketing budget
   */
  static async addFunds(email: string, amount: number, source: string = 'stripe'): Promise<void> {
    try {
      // Convert amount from cents to dollars
      const amountInDollars = amount / 100;
      
      // Get current month
      const currentMonth = new Date().toISOString().substring(0, 7);
      
      // Update monthly budget - increase both totalBudget and reset alertThreshold if needed
      await prisma.monthlyBudget.upsert({
        where: { month: currentMonth },
        update: {
          totalBudget: {
            increment: amountInDollars,
          },
          // Reset alert if budget was exceeded and now it's not
          isAlertSent: false,
        },
        create: {
          month: currentMonth,
          totalBudget: amountInDollars,
          totalSpent: 0,
          alertThreshold: 0.8,
          isAlertSent: false,
        },
      });

      console.log(`✅ Added $${amountInDollars} to budget for ${email} from ${source}`);
    } catch (error) {
      console.error('❌ Failed to add funds:', error);
      throw error;
    }
  }

  /**
   * Log Stripe webhook event for audit trail
   */
  static async logStripeEvent(
    eventId: string,
    eventType: string,
    customerId: string | null,
    customerEmail: string | null,
    amount: number | null,
    status: string,
    metadata: any = {}
  ): Promise<void> {
    try {
      // Create a simple log entry - you might want to create a dedicated StripeEventLog model
      await prisma.billingLog.create({
        data: {
          agentType: 'BILLING' as any, // Using existing enum, or you could extend it
          tokens: 0,
          cost: 0,
          task: `Stripe webhook: ${eventType}`,
          executionId: eventId,
          metadata: {
            stripeEventId: eventId,
            stripeEventType: eventType,
            customerId,
            customerEmail,
            amount,
            status,
            source: 'stripe_webhook',
            timestamp: new Date().toISOString(),
            ...metadata,
          },
        },
      });
    } catch (error) {
      console.error('❌ Failed to log Stripe event:', error);
      // Don't throw here - logging failure shouldn't break the webhook
    }
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get raw body and stripe signature
    const rawBody = await req.text();
    const headersList = headers();
    const sig = headersList.get('stripe-signature');

    if (!sig) {
      console.error('❌ No Stripe signature found');
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`🔔 Received Stripe webhook: ${event.type} (${event.id})`);

    // Check if we handle this event type
    if (!HANDLED_EVENTS.includes(event.type as HandledEvent)) {
      console.log(`⏭️  Ignoring unhandled event type: ${event.type}`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email || session.customer_email;
        const amountTotal = session.amount_total || 0;
        const source = session.metadata?.source || 'marketing_topup';

        if (customerEmail && amountTotal > 0) {
          await BillingService.addFunds(customerEmail, amountTotal, source);
          
          await BillingService.logStripeEvent(
            event.id,
            event.type,
            session.customer as string,
            customerEmail,
            amountTotal,
            'completed',
            {
              sessionId: session.id,
              paymentStatus: session.payment_status,
              source,
            }
          );
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerEmail = invoice.customer_email;
        const amountPaid = invoice.amount_paid || 0;
        const source = invoice.metadata?.source || 'subscription_payment';

        if (customerEmail && amountPaid > 0) {
          await BillingService.addFunds(customerEmail, amountPaid, source);
          
          await BillingService.logStripeEvent(
            event.id,
            event.type,
            invoice.customer as string,
            customerEmail,
            amountPaid,
            'paid',
            {
              invoiceId: invoice.id,
              invoiceNumber: invoice.number,
              source,
            }
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Get customer email from Stripe
        let customerEmail: string | null = null;
        try {
          const customer = await stripe.customers.retrieve(customerId);
          customerEmail = (customer as Stripe.Customer).email;
        } catch (error) {
          console.error('Failed to retrieve customer:', error);
        }

        await BillingService.logStripeEvent(
          event.id,
          event.type,
          customerId,
          customerEmail,
          null,
          subscription.status,
          {
            subscriptionId: subscription.id,
            planId: subscription.items.data[0]?.price?.id,
            status: subscription.status,
            currentPeriodEnd: subscription.current_period_end,
          }
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Get customer email from Stripe
        let customerEmail: string | null = null;
        try {
          const customer = await stripe.customers.retrieve(customerId);
          customerEmail = (customer as Stripe.Customer).email;
        } catch (error) {
          console.error('Failed to retrieve customer:', error);
        }

        await BillingService.logStripeEvent(
          event.id,
          event.type,
          customerId,
          customerEmail,
          null,
          'cancelled',
          {
            subscriptionId: subscription.id,
            cancelledAt: subscription.canceled_at,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          }
        );
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerEmail = invoice.customer_email;
        const amountDue = invoice.amount_due || 0;

        await BillingService.logStripeEvent(
          event.id,
          event.type,
          invoice.customer as string,
          customerEmail,
          amountDue,
          'failed',
          {
            invoiceId: invoice.id,
            invoiceNumber: invoice.number,
            attemptCount: invoice.attempt_count,
            nextPaymentAttempt: invoice.next_payment_attempt,
          }
        );
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Get customer email from Stripe
        let customerEmail: string | null = null;
        try {
          const customer = await stripe.customers.retrieve(customerId);
          customerEmail = (customer as Stripe.Customer).email;
        } catch (error) {
          console.error('Failed to retrieve customer:', error);
        }

        await BillingService.logStripeEvent(
          event.id,
          event.type,
          customerId,
          customerEmail,
          null,
          subscription.status,
          {
            subscriptionId: subscription.id,
            planId: subscription.items.data[0]?.price?.id,
            trialEnd: subscription.trial_end,
            currentPeriodEnd: subscription.current_period_end,
          }
        );
        break;
      }

      default: {
        console.log(`⚠️  Unhandled event type: ${event.type}`);
        break;
      }
    }

    console.log(`✅ Successfully processed ${event.type} webhook`);
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('❌ Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Health check endpoint for webhook testing
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    supportedEvents: HANDLED_EVENTS,
  });
} 