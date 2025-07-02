'use client';

import ComingSoon from '../../components/ComingSoon';
import {
  CreditCardIcon,
  ExternalLinkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function BillingPage(): JSX.Element {
  // TODO: Connect Stripe webhook + plan logic
  // This component needs to be connected to:
  // 1. Stripe billing portal for subscription management
  // 2. Plan tier management (Starter, Pro, Enterprise)
  // 3. Usage-based billing calculations
  // 4. Invoice generation and history
  // 5. Payment method management
  // 6. Billing alerts and notifications

  const handleOpenStripePortal = () => {
    // TODO: Implement Stripe customer portal redirect
    console.log('Opening Stripe billing portal...');
    // In real implementation:
    // window.open(stripe.billingPortal.sessions.create({ customer: customerId }));
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-neon-green">Billing</span>
              <span className="text-primary"> Management</span>
            </h1>
            <p className="text-secondary text-lg">
              Manage your subscription, billing, and payment methods
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleOpenStripePortal}
              className="btn-neon-green flex items-center space-x-2"
              disabled={true}
            >
              <CreditCardIcon className="h-5 w-5" />
              <span>Stripe Dashboard</span>
              <ExternalLinkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Current Implementation Notice */}
      <div className="glass-strong p-6 rounded-2xl border border-yellow-400/30 mb-8">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary mb-2">Development in Progress</h3>
            <p className="text-secondary leading-relaxed mb-4">
              The billing system is currently being integrated. Once complete, you'll be able to:
            </p>
            <ul className="text-secondary space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                <span>View and manage your subscription plans</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                <span>Access billing history and invoices</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                <span>Update payment methods and billing information</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                <span>Monitor usage and set billing alerts</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                <span>Access Stripe customer portal for advanced billing management</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Coming Soon Component */}
      <ComingSoon feature="Billing (Coming Soon)" />
    </div>
  );
} 