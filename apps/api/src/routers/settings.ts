import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../server/trpc';

// Input validation schemas
const SettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.any(),
  type: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY', 'ENCRYPTED']),
  category: z.string().min(1).max(50),
  description: z.string().optional(),
  isSystem: z.boolean().default(false),
  isEncrypted: z.boolean().default(false),
  userId: z.string().optional(),
});

const SettingUpdateSchema = z.object({
  id: z.string(),
  value: z.any(),
  description: z.string().optional(),
});

const APIKeySchema = z.object({
  name: z.string().min(1).max(100),
  service: z.string().min(1).max(50),
  key: z.string().min(10), // Full key for creation
});

const APIKeyUpdateSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  isActive: z.boolean().optional(),
});

const PromptTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  template: z.string().min(1),
  variables: z.array(z.string()).default([]),
  description: z.string().optional(),
  version: z.string().default('1.0'),
  isActive: z.boolean().default(true),
  createdBy: z.string().optional(),
});

const PromptTemplateUpdateSchema = PromptTemplateSchema.partial().extend({
  id: z.string(),
});

export const settingsRouter = createTRPCRouter({
  // === SETTINGS MANAGEMENT ===

  // Get all settings with filtering
  getSettings: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        userId: z.string().optional(),
        includeSystem: z.boolean().default(false),
        includeEncrypted: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.category) where.category = input.category;
      if (input.userId) where.userId = input.userId;
      if (!input.includeSystem) where.isSystem = false;

      const settings = await ctx.db.setting.findMany({
        where,
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
        select: {
          id: true,
          key: true,
          value: input.includeEncrypted ? true : { select: {} }, // Hide encrypted values unless requested
          type: true,
          category: true,
          description: true,
          isSystem: true,
          isEncrypted: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Mask encrypted values for security
      const processedSettings = settings.map(setting => ({
        ...setting,
        value: setting.isEncrypted && !input.includeEncrypted ? '[ENCRYPTED]' : setting.value,
      }));

      return {
        settings: processedSettings,
        count: settings.length,
      };
    }),

  // Get single setting by key
  getSetting: publicProcedure
    .input(
      z.object({
        key: z.string(),
        userId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = { key: input.key };
      if (input.userId) where.userId = input.userId;

      const setting = await ctx.db.setting.findFirst({
        where,
      });

      if (!setting) {
        throw new Error('Setting not found');
      }

      // Mask encrypted values
      if (setting.isEncrypted) {
        setting.value = '[ENCRYPTED]';
      }

      return setting;
    }),

  // Create or update setting
  setSetting: protectedProcedure.input(SettingSchema).mutation(async ({ ctx, input }) => {
    try {
      // Check if setting already exists
      const existing = await ctx.db.setting.findFirst({
        where: {
          key: input.key,
          userId: input.userId || null,
        },
      });

      let setting;
      if (existing) {
        // Update existing setting
        setting = await ctx.db.setting.update({
          where: { id: existing.id },
          data: {
            value: input.value,
            type: input.type,
            description: input.description,
            isEncrypted: input.isEncrypted,
          },
        });
      } else {
        // Create new setting
        setting = await ctx.db.setting.create({
          data: input,
        });
      }

      // Log the event
      await ctx.db.aIEventLog.create({
        data: {
          agent: 'SettingsManager',
          action: existing ? 'setting_updated' : 'setting_created',
          metadata: {
            settingId: setting.id,
            settingKey: setting.key,
            settingCategory: setting.category,
            isSystem: setting.isSystem,
            isEncrypted: setting.isEncrypted,
          },
        },
      });

      return {
        success: true,
        setting: {
          ...setting,
          value: setting.isEncrypted ? '[ENCRYPTED]' : setting.value,
        },
      };
    } catch (error) {
      throw new Error(`Failed to set setting: ${error}`);
    }
  }),

  // Update setting value
  updateSetting: protectedProcedure.input(SettingUpdateSchema).mutation(async ({ ctx, input }) => {
    try {
      const setting = await ctx.db.setting.update({
        where: { id: input.id },
        data: {
          value: input.value,
          description: input.description,
        },
      });

      // Log the event
      await ctx.db.aIEventLog.create({
        data: {
          agent: 'SettingsManager',
          action: 'setting_updated',
          metadata: {
            settingId: setting.id,
            settingKey: setting.key,
          },
        },
      });

      return {
        success: true,
        setting: {
          ...setting,
          value: setting.isEncrypted ? '[ENCRYPTED]' : setting.value,
        },
      };
    } catch (error) {
      throw new Error(`Failed to update setting: ${error}`);
    }
  }),

  // Delete setting
  deleteSetting: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const setting = await ctx.db.setting.findUnique({
          where: { id: input.id },
          select: { id: true, key: true, isSystem: true },
        });

        if (!setting) {
          throw new Error('Setting not found');
        }

        if (setting.isSystem) {
          throw new Error('Cannot delete system settings');
        }

        await ctx.db.setting.delete({
          where: { id: input.id },
        });

        // Log the event
        await ctx.db.aIEventLog.create({
          data: {
            agent: 'SettingsManager',
            action: 'setting_deleted',
            metadata: {
              settingId: setting.id,
              settingKey: setting.key,
            },
          },
        });

        return {
          success: true,
          message: 'Setting deleted successfully',
        };
      } catch (error) {
        throw new Error(`Failed to delete setting: ${error}`);
      }
    }),

  // === API KEY MANAGEMENT ===

  // Get API keys (masked for security)
  getAPIKeys: protectedProcedure
    .input(
      z.object({
        service: z.string().optional(),
        includeInactive: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.service) where.service = input.service;
      if (!input.includeInactive) where.isActive = true;

      const apiKeys = await ctx.db.aPIKey.findMany({
        where,
        orderBy: [{ service: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          service: true,
          keyPreview: true,
          isActive: true,
          lastUsed: true,
          usageCount: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        apiKeys,
        count: apiKeys.length,
      };
    }),

  // Create API key
  createAPIKey: protectedProcedure.input(APIKeySchema).mutation(async ({ ctx, input }) => {
    try {
      // Create preview (first 4 chars + masked)
      const keyPreview = `${input.key.substring(0, 4)}...${'*'.repeat(input.key.length - 8)}${input.key.substring(input.key.length - 4)}`;

      const apiKey = await ctx.db.aPIKey.create({
        data: {
          name: input.name,
          service: input.service,
          keyPreview,
          isActive: true,
          createdBy: ctx.session?.user?.id || 'system',
        },
      });

      // Store the actual key in settings (encrypted)
      await ctx.db.setting.create({
        data: {
          key: `api_key_${apiKey.id}`,
          value: input.key,
          type: 'ENCRYPTED',
          category: 'api_keys',
          description: `API key for ${input.service} - ${input.name}`,
          isSystem: true,
          isEncrypted: true,
        },
      });

      // Log the event
      await ctx.db.aIEventLog.create({
        data: {
          agent: 'SettingsManager',
          action: 'api_key_created',
          metadata: {
            apiKeyId: apiKey.id,
            service: apiKey.service,
            name: apiKey.name,
            createdBy: apiKey.createdBy,
          },
        },
      });

      return {
        success: true,
        apiKey,
      };
    } catch (error) {
      throw new Error(`Failed to create API key: ${error}`);
    }
  }),

  // Update API key
  updateAPIKey: protectedProcedure.input(APIKeyUpdateSchema).mutation(async ({ ctx, input }) => {
    try {
      const { id, ...updateData } = input;

      const apiKey = await ctx.db.aPIKey.update({
        where: { id },
        data: updateData,
      });

      // Log the event
      await ctx.db.aIEventLog.create({
        data: {
          agent: 'SettingsManager',
          action: 'api_key_updated',
          metadata: {
            apiKeyId: apiKey.id,
            service: apiKey.service,
            name: apiKey.name,
            updatedFields: Object.keys(updateData),
          },
        },
      });

      return {
        success: true,
        apiKey,
      };
    } catch (error) {
      throw new Error(`Failed to update API key: ${error}`);
    }
  }),

  // Delete API key
  deleteAPIKey: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const apiKey = await ctx.db.aPIKey.findUnique({
          where: { id: input.id },
          select: { id: true, name: true, service: true },
        });

        if (!apiKey) {
          throw new Error('API key not found');
        }

        // Delete the API key
        await ctx.db.aPIKey.delete({
          where: { id: input.id },
        });

        // Delete the associated encrypted setting
        await ctx.db.setting.deleteMany({
          where: { key: `api_key_${input.id}` },
        });

        // Log the event
        await ctx.db.aIEventLog.create({
          data: {
            agent: 'SettingsManager',
            action: 'api_key_deleted',
            metadata: {
              apiKeyId: apiKey.id,
              service: apiKey.service,
              name: apiKey.name,
            },
          },
        });

        return {
          success: true,
          message: 'API key deleted successfully',
        };
      } catch (error) {
        throw new Error(`Failed to delete API key: ${error}`);
      }
    }),

  // Record API key usage
  recordAPIKeyUsage: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const apiKey = await ctx.db.aPIKey.update({
          where: { id: input.id },
          data: {
            lastUsed: new Date(),
            usageCount: { increment: 1 },
          },
        });

        return {
          success: true,
          apiKey,
        };
      } catch (error) {
        throw new Error(`Failed to record API key usage: ${error}`);
      }
    }),

  // === PROMPT TEMPLATE MANAGEMENT ===

  // Get prompt templates
  getPromptTemplates: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        isActive: z.boolean().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.category) where.category = input.category;
      if (input.isActive !== undefined) where.isActive = input.isActive;
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
          { category: { contains: input.search, mode: 'insensitive' } },
        ];
      }

      const [templates, totalCount] = await Promise.all([
        ctx.db.promptTemplate.findMany({
          where,
          orderBy: [{ category: 'asc' }, { usage: 'desc' }, { name: 'asc' }],
          skip: input.offset,
          take: input.limit,
        }),
        ctx.db.promptTemplate.count({ where }),
      ]);

      return {
        templates,
        totalCount,
        hasMore: input.offset + input.limit < totalCount,
      };
    }),

  // Get single prompt template
  getPromptTemplate: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.promptTemplate.findUnique({
        where: { id: input.id },
      });

      if (!template) {
        throw new Error('Prompt template not found');
      }

      return template;
    }),

  // Create prompt template
  createPromptTemplate: protectedProcedure
    .input(PromptTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const template = await ctx.db.promptTemplate.create({
          data: {
            ...input,
            createdBy: ctx.session?.user?.id || 'system',
          },
        });

        // Log the event
        await ctx.db.aIEventLog.create({
          data: {
            agent: 'SettingsManager',
            action: 'prompt_template_created',
            metadata: {
              templateId: template.id,
              templateName: template.name,
              category: template.category,
              createdBy: template.createdBy,
            },
          },
        });

        return {
          success: true,
          template,
        };
      } catch (error) {
        throw new Error(`Failed to create prompt template: ${error}`);
      }
    }),

  // Update prompt template
  updatePromptTemplate: protectedProcedure
    .input(PromptTemplateUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input;

        const template = await ctx.db.promptTemplate.update({
          where: { id },
          data: updateData,
        });

        // Log the event
        await ctx.db.aIEventLog.create({
          data: {
            agent: 'SettingsManager',
            action: 'prompt_template_updated',
            metadata: {
              templateId: template.id,
              templateName: template.name,
              updatedFields: Object.keys(updateData),
            },
          },
        });

        return {
          success: true,
          template,
        };
      } catch (error) {
        throw new Error(`Failed to update prompt template: ${error}`);
      }
    }),

  // Delete prompt template
  deletePromptTemplate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const template = await ctx.db.promptTemplate.findUnique({
          where: { id: input.id },
          select: { id: true, name: true, category: true },
        });

        if (!template) {
          throw new Error('Prompt template not found');
        }

        await ctx.db.promptTemplate.delete({
          where: { id: input.id },
        });

        // Log the event
        await ctx.db.aIEventLog.create({
          data: {
            agent: 'SettingsManager',
            action: 'prompt_template_deleted',
            metadata: {
              templateId: template.id,
              templateName: template.name,
              category: template.category,
            },
          },
        });

        return {
          success: true,
          message: 'Prompt template deleted successfully',
        };
      } catch (error) {
        throw new Error(`Failed to delete prompt template: ${error}`);
      }
    }),

  // Record prompt template usage
  recordTemplateUsage: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const template = await ctx.db.promptTemplate.update({
          where: { id: input.id },
          data: {
            usage: { increment: 1 },
          },
        });

        return {
          success: true,
          template,
        };
      } catch (error) {
        throw new Error(`Failed to record template usage: ${error}`);
      }
    }),

  // Get system configuration summary
  getSystemConfig: publicProcedure.query(async ({ ctx }) => {
    const [totalSettings, activeAPIKeys, activeTemplates, systemSettings, recentActivity] =
      await Promise.all([
        ctx.db.setting.count(),
        ctx.db.aPIKey.count({ where: { isActive: true } }),
        ctx.db.promptTemplate.count({ where: { isActive: true } }),
        ctx.db.setting.count({ where: { isSystem: true } }),
        ctx.db.aIEventLog.findMany({
          where: {
            agent: 'SettingsManager',
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            action: true,
            createdAt: true,
            metadata: true,
          },
        }),
      ]);

    return {
      summary: {
        totalSettings,
        activeAPIKeys,
        activeTemplates,
        systemSettings,
      },
      recentActivity,
    };
  }),
});
