"use client";

import PageLayout from "@/components/page-layout";
import ComingSoon from "@/components/coming-soon";

export default function TeamPage() {
  return (
    <PageLayout
      title="Team Management"
      subtitle="Collaborate with your team on AI marketing campaigns"
    >
      <ComingSoon
        feature="Team Management"
        description="Comprehensive team collaboration tools are being developed. This will include role-based access control, project management, real-time collaboration, and team performance analytics."
        expectedDate="Q2 2024"
      />
    </PageLayout>
  );
}
