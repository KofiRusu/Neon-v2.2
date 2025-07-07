import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Example seed data demonstrating Campaign-Agent relationships
export async function seedCampaignAgentRelationships() {
  try {
    // Create a user (campaign creator and agent assignee)
    const user = await prisma.user.create({
      data: {
        email: "campaign.manager@neonhub.com",
        name: "Campaign Manager",
        role: "MANAGER"
      }
    });

    // Create agents
    const contentAgent = await prisma.agent.create({
      data: {
        name: "Content Generation Agent",
        type: "CONTENT",
        status: "ACTIVE",
        capabilities: {
          platforms: ["INSTAGRAM", "TIKTOK", "TWITTER"],
          contentTypes: ["POST", "STORY", "REEL"]
        },
        assignedToId: user.id
      }
    });

    const seoAgent = await prisma.agent.create({
      data: {
        name: "SEO Optimization Agent", 
        type: "SEO",
        status: "ACTIVE",
        capabilities: {
          keywords: true,
          metaOptimization: true,
          contentOptimization: true
        },
        assignedToId: user.id
      }
    });

    // Create a campaign with multiple agents
    const campaign = await prisma.campaign.create({
      data: {
        name: "Q4 Product Launch Campaign",
        description: "Multi-platform campaign for new product launch",
        type: "PRODUCT_LAUNCH",
        status: "DRAFT",
        budget: 50000,
        platforms: ["INSTAGRAM", "TIKTOK", "TWITTER", "LINKEDIN"],
        userId: user.id,
        createdById: user.id,
        agents: {
          connect: [
            { id: contentAgent.id },
            { id: seoAgent.id }
          ]
        }
      }
    });

    console.log("✅ Campaign created with agents:");
    console.log(`📋 Campaign: ${campaign.name}`);
    console.log(`👥 Agents: ${[contentAgent.name, seoAgent.name].join(", ")}`);
    console.log(`👤 Created by: ${user.name}`);

    // Verify relationships work
    const campaignWithAgents = await prisma.campaign.findUnique({
      where: { id: campaign.id },
      include: {
        agents: true,
        createdBy: true,
        user: true
      }
    });

    const agentWithCampaigns = await prisma.agent.findUnique({
      where: { id: contentAgent.id },
      include: {
        campaigns: true,
        assignedTo: true
      }
    });

    console.log("\n✅ Relationships verified:");
    console.log(`📊 Campaign has ${campaignWithAgents?.agents.length} agents`);
    console.log(`🤖 Agent is in ${agentWithCampaigns?.campaigns.length} campaigns`);

    return { campaign, agents: [contentAgent, seoAgent], user };

  } catch (error) {
    console.error("❌ Error seeding relationships:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Export the relationship queries for use in tRPC
export const campaignAgentQueries = {
  // Get campaign with all agents
  getCampaignWithAgents: (campaignId: string) => 
    prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        agents: {
          include: {
            assignedTo: true
          }
        },
        createdBy: true,
        user: true
      }
    }),

  // Get agent with all campaigns
  getAgentWithCampaigns: (agentId: string) =>
    prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        campaigns: {
          include: {
            createdBy: true,
            user: true
          }
        },
        assignedTo: true
      }
    }),

  // Add agent to campaign
  addAgentToCampaign: (campaignId: string, agentId: string) =>
    prisma.campaign.update({
      where: { id: campaignId },
      data: {
        agents: {
          connect: { id: agentId }
        }
      }
    }),

  // Remove agent from campaign
  removeAgentFromCampaign: (campaignId: string, agentId: string) =>
    prisma.campaign.update({
      where: { id: campaignId },
      data: {
        agents: {
          disconnect: { id: agentId }
        }
      }
    })
}; 