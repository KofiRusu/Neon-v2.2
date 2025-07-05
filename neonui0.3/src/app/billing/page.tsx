"use client";

import PageLayout from "@/components/page-layout";
import ComingSoon from "@/components/coming-soon";

export default function BillingPage() {
  return (
    <PageLayout
      title="Billing & Subscription"
      subtitle="Manage your subscription and billing preferences"
    >
      <ComingSoon
        feature="Billing Management"
        description="Advanced billing and subscription management features are being integrated. This will include usage analytics, plan comparisons, invoice management, and payment method configuration."
        expectedDate="Q1 2024"
      />
    </PageLayout>
  );
}
