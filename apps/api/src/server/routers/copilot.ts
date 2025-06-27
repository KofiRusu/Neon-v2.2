import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { observable } from '@trpc/server/observable';
// Replaced with mock implementation above
// Mock implementations for missing modules
const mockCommandRouter = {
  routeCommand: async (command: string) => {
    return { action: 'mock_action', result: `Routed command: ${command}` };
  },
};

const mockVoiceTranscriber = {
  transcribe: async (audioData: unknown) => {
    return { text: 'Mock transcribed text', confidence: 0.9 };
  },
};
// Mock agent registry functions
const mockAgentRegistry = {
  executeAgentCommand: async (
    agentType: string,
    command: string,
    params?: Record<string, unknown>
  ) => {
    return {
      success: true,
      result: `Mock execution of ${command} on ${agentType}`,
      executionTime: 150,
      metadata: params || {},
    };
  },

  getAllCommandSchemas: () => {
    return {
      CONTENT: ['generate', 'analyze', 'optimize'],
      AD: ['create', 'optimize', 'analyze'],
      SEO: ['optimize', 'analyze', 'report'],
    };
  },

  getAgentCommandSchemas: (agentType: string) => {
    const schemas = mockAgentRegistry.getAllCommandSchemas();
    return schemas[agentType as keyof typeof schemas] || [];
  },
};

const { executeAgentCommand, getAllCommandSchemas, getAgentCommandSchemas } = mockAgentRegistry;

// Input validation schemas
const MessageTypeSchema = z.enum(['query', 'command', 'clarification', 'confirmation', 'feedback']);

const CopilotMessageSchema = z.object({
  input: z.string().min(1, 'Input cannot be empty').max(2000, 'Input too long'),
  messageType: MessageTypeSchema.optional().default('query'),
  sessionId: z.string().optional(),
  context: z
    .object({
      timeframe: z
        .object({
          start: z.string(),
          end: z.string(),
        })
        .optional(),
      focusArea: z
        .enum(['performance', 'brand', 'content', 'forecasting', 'campaigns', 'analytics'])
        .optional(),
      filters: z
        .object({
          brands: z.array(z.string()).optional(),
          channels: z.array(z.string()).optional(),
          metrics: z.array(z.string()).optional(),
        })
        .optional(),
    })
    .optional(),
});

const StreamingRequestSchema = z.object({
  input: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
  enableStreaming: z.boolean().default(true),
  chunkSize: z.number().min(10).max(500).default(50),
});

const VoiceTranscriptionSchema = z.object({
  audioData: z.string().min(1, 'Audio data required'), // Base64 encoded audio
  provider: z.enum(['whisper', 'deepgram', 'azure', 'google']).default('whisper'),
  language: z.string().optional().default('en'),
  enableTimestamps: z.boolean().default(true),
  enablePunctuation: z.boolean().default(true),
});

const CommandExecutionSchema = z.object({
  agentType: z.string().min(1, 'Agent type required'),
  action: z.string().min(1, 'Action required'),
  parameters: z.record(z.any()).default({}),
  sessionId: z.string().optional(),
  dryRun: z.boolean().default(false),
  requireApproval: z.boolean().default(false),
});

const GetSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID required'),
});

const UpdateSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID required'),
  title: z.string().optional(),
  context: z.record(z.any()).optional(),
  preferences: z
    .object({
      responseStyle: z.enum(['concise', 'detailed', 'executive']).optional(),
      notificationLevel: z.enum(['minimal', 'standard', 'verbose']).optional(),
      autoExecution: z.boolean().optional(),
      preferredFormats: z.array(z.string()).optional(),
    })
    .optional(),
});

// Response schemas
const CopilotResponseSchema = z.object({
  messageId: z.string(),
  content: z.string(),
  confidence: z.number().min(0).max(1),
  intent: z
    .object({
      primaryAction: z.string(),
      entityType: z.string().optional(),
      parameters: z.record(z.any()),
      confidence: z.number(),
    })
    .optional(),
  suggestedActions: z
    .array(
      z.object({
        label: z.string(),
        action: z.string(),
        confidence: z.number(),
        description: z.string().optional(),
        estimatedTime: z.number().optional(),
      })
    )
    .optional(),
  attachments: z
    .array(
      z.object({
        type: z.enum(['report', 'chart', 'campaign', 'insight', 'forecast']),
        id: z.string(),
        title: z.string(),
        preview: z.string().optional(),
        downloadUrl: z.string().optional(),
      })
    )
    .optional(),
  executionPlan: z
    .array(
      z.object({
        stepId: z.string(),
        description: z.string(),
        agentType: z.string(),
        estimatedDuration: z.number(),
        parameters: z.record(z.any()),
      })
    )
    .optional(),
  requiresApproval: z.boolean().optional(),
});

const StreamingChunkSchema = z.object({
  chunkId: z.string(),
  content: z.string(),
  isPartial: z.boolean(),
  confidence: z.number().optional(),
  timestamp: z.string(),
  metadata: z.record(z.any()).optional(),
});

const TranscriptionResultSchema = z.object({
  text: z.string(),
  confidence: z.number(),
  duration: z.number(),
  provider: z.string(),
  segments: z
    .array(
      z.object({
        text: z.string(),
        start: z.number(),
        end: z.number(),
        confidence: z.number(),
      })
    )
    .optional(),
  metadata: z
    .object({
      processingTime: z.number(),
      languageDetected: z.string().optional(),
      qualityScore: z.number().optional(),
    })
    .optional(),
});

const CommandResultSchema = z.object({
  success: z.boolean(),
  executionId: z.string(),
  data: z.any().optional(),
  error: z.string().optional(),
  duration: z.number(),
  confidence: z.number().optional(),
  agentResults: z
    .array(
      z.object({
        agentType: z.string(),
        status: z.enum(['pending', 'running', 'completed', 'failed']),
        output: z.any().optional(),
        confidence: z.number().optional(),
        duration: z.number().optional(),
      })
    )
    .optional(),
});

// Create agent instances
const copilotAgent = mockLLMCopilotAgent;
const commandRouter = mockCommandRouter;
const voiceTranscriber = mockVoiceTranscriber;

// Mock LLM Copilot Agent to replace missing import
const mockLLMCopilotAgent = {
  processMessage: async (message: string, context?: Record<string, unknown>) => {
    return {
      response: `Mock response to: "${message}"`,
      confidence: 0.85,
      suggestions: ['suggestion 1', 'suggestion 2'],
      metadata: {
        processingTime: 250,
        model: 'gpt-4',
        context: context || {},
      },
    };
  },

  getConversationHistory: async (sessionId: string) => {
    return [
      {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Hello! How can I help you today?',
        timestamp: new Date(),
      },
    ];
  },

  clearConversation: async (sessionId: string) => {
    return { success: true, message: 'Conversation cleared' };
  },
};

// Helper functions
async function getUserId(ctx: any): Promise<string> {
  // Mock user ID - in production would extract from authentication context
  return ctx.user?.id || 'user_demo_123';
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function validateUserPermissions(userId: string, action: string): Promise<boolean> {
  // Mock permission validation - in production would check user roles/permissions
  const adminActions = ['executeCommand', 'scheduleReport', 'pauseCampaign'];
  const userRole = 'admin'; // Mock - would get from database

  if (adminActions.includes(action) && userRole !== 'admin') {
    return false;
  }

  return true;
}

function logCopilotInteraction(data: any): void {
  console.log('[Copilot API]', JSON.stringify(data, null, 2));
}

export const copilotRouter = router({
  // Main copilot conversation endpoint
  askCopilot: publicProcedure
    .input(CopilotMessageSchema)
    .output(CopilotResponseSchema)
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      const userId = await getUserId(ctx);
      const sessionId = input.sessionId || generateSessionId();

      try {
        logCopilotInteraction({
          action: 'askCopilot',
          userId,
          sessionId,
          input: input.input,
          messageType: input.messageType,
        });

        // Process message through LLM Copilot Agent
        const response = await copilotAgent.processMessage(
          input.input,
          sessionId,
          userId,
          input.messageType
        );

        // Log successful interaction
        logCopilotInteraction({
          action: 'askCopilot_success',
          userId,
          sessionId,
          confidence: response.confidence,
          responseLength: response.content.length,
          processingTime: Date.now() - startTime,
        });

        return response;
      } catch (error) {
        console.error('[Copilot API] askCopilot failed:', error);

        logCopilotInteraction({
          action: 'askCopilot_error',
          userId,
          sessionId,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - startTime,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process copilot message',
          cause: error,
        });
      }
    }),

  // Streaming copilot response endpoint
  streamCopilotResponse: publicProcedure
    .input(StreamingRequestSchema)
    .subscription(({ input, ctx }) => {
      const userId = getUserId(ctx);
      const sessionId = input.sessionId || generateSessionId();

      return observable<z.infer<typeof StreamingChunkSchema>>(emit => {
        let chunkCounter = 0;
        let fullResponse = '';

        const processStreamingResponse = async () => {
          try {
            logCopilotInteraction({
              action: 'streamCopilotResponse_start',
              userId,
              sessionId,
              input: input.input,
            });

            // Get the full response first
            const response = await copilotAgent.processMessage(
              input.input,
              sessionId,
              await userId,
              'query'
            );

            fullResponse = response.content;
            const chunks = chunkText(fullResponse, input.chunkSize);

            // Stream chunks with realistic delays
            for (let i = 0; i < chunks.length; i++) {
              const chunk = chunks[i];
              const isLast = i === chunks.length - 1;

              emit.next({
                chunkId: `chunk_${++chunkCounter}`,
                content: chunk,
                isPartial: !isLast,
                confidence: response.confidence,
                timestamp: new Date().toISOString(),
                metadata: {
                  chunkIndex: i + 1,
                  totalChunks: chunks.length,
                  isComplete: isLast,
                },
              });

              // Add realistic streaming delay
              if (!isLast) {
                await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
              }
            }

            // Send final completion chunk
            emit.next({
              chunkId: `chunk_complete_${Date.now()}`,
              content: '',
              isPartial: false,
              confidence: response.confidence,
              timestamp: new Date().toISOString(),
              metadata: {
                streaming_complete: true,
                totalLength: fullResponse.length,
                executionPlan: response.executionPlan,
                suggestedActions: response.suggestedActions,
              },
            });

            emit.complete();

            logCopilotInteraction({
              action: 'streamCopilotResponse_complete',
              userId,
              sessionId,
              chunksStreamed: chunkCounter,
              responseLength: fullResponse.length,
            });
          } catch (error) {
            console.error('[Copilot API] Streaming failed:', error);

            emit.error(
              new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Streaming response failed',
                cause: error,
              })
            );

            logCopilotInteraction({
              action: 'streamCopilotResponse_error',
              userId,
              sessionId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        };

        processStreamingResponse();

        // Cleanup function
        return () => {
          console.log(`[Copilot API] Stream cleanup for session: ${sessionId}`);
        };
      });
    }),

  // Voice transcription endpoint
  transcribeVoice: publicProcedure
    .input(VoiceTranscriptionSchema)
    .output(TranscriptionResultSchema)
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      const userId = await getUserId(ctx);

      try {
        // Check permissions
        const hasPermission = await validateUserPermissions(userId, 'transcribeVoice');
        if (!hasPermission) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Insufficient permissions for voice transcription',
          });
        }

        logCopilotInteraction({
          action: 'transcribeVoice',
          userId,
          provider: input.provider,
          language: input.language,
        });

        // Configure transcriber
        voiceTranscriber.updateConfig({
          provider: input.provider,
          language: input.language,
          enableTimestamps: input.enableTimestamps,
          enablePunctuation: input.enablePunctuation,
        });

        // Simulate audio file from base64 data
        const mockAudioFile = {
          data: input.audioData,
          format: 'wav',
          size: input.audioData.length * 0.75, // Rough estimate for base64 to binary
        };

        // Transcribe audio
        const result = await voiceTranscriber.transcribeFile(mockAudioFile);

        logCopilotInteraction({
          action: 'transcribeVoice_success',
          userId,
          confidence: result.confidence,
          textLength: result.text.length,
          processingTime: Date.now() - startTime,
        });

        return result;
      } catch (error) {
        console.error('[Copilot API] Voice transcription failed:', error);

        logCopilotInteraction({
          action: 'transcribeVoice_error',
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - startTime,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Voice transcription failed',
          cause: error,
        });
      }
    }),

  // Command execution endpoint
  executeCommand: publicProcedure
    .input(CommandExecutionSchema)
    .output(CommandResultSchema)
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      const userId = await getUserId(ctx);
      const sessionId = input.sessionId || generateSessionId();

      try {
        // Validate permissions
        const hasPermission = await validateUserPermissions(userId, 'executeCommand');
        if (!hasPermission) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to execute commands',
          });
        }

        logCopilotInteraction({
          action: 'executeCommand',
          userId,
          sessionId,
          agentType: input.agentType,
          commandAction: input.action,
          dryRun: input.dryRun,
        });

        // Execute command through command router
        const context = {
          sessionId,
          userId,
          intent: {
            primaryAction: input.action,
            parameters: input.parameters,
            confidence: 0.9,
          },
          originalCommand: `${input.agentType}:${input.action}`,
          environment: {
            timezone: 'UTC',
            locale: 'en-US',
            debugMode: false,
            dryRun: input.dryRun,
            verbose: true,
          },
          permissions: {
            canExecuteCommands: true,
            canAccessReports: true,
            canManageCampaigns: true,
            canViewFinancials: true,
            roleLevel: 'admin' as const,
            allowedAgents: ['all'],
          },
          constraints: {
            maxExecutionTime: 30000,
            maxBudgetImpact: 10000,
            requiresApproval: input.requireApproval,
            approvalThreshold: 1000,
            allowBackgroundExecution: true,
          },
        };

        const result = await commandRouter.processCommand(
          `Execute ${input.action} on ${input.agentType}`,
          context
        );

        // Transform result to match schema
        const transformedResult = {
          success: result.status === 'completed',
          executionId: result.executionId,
          data: result.finalOutput,
          error: result.errors?.[0]?.message,
          duration: result.duration || Date.now() - startTime,
          confidence: result.confidence,
          agentResults: result.agentResults.map(ar => ({
            agentType: ar.agentType,
            status: ar.status as 'pending' | 'running' | 'completed' | 'failed',
            output: ar.output,
            confidence: ar.confidence,
            duration: ar.duration,
          })),
        };

        logCopilotInteraction({
          action: 'executeCommand_success',
          userId,
          sessionId,
          executionId: result.executionId,
          success: transformedResult.success,
          processingTime: transformedResult.duration,
        });

        return transformedResult;
      } catch (error) {
        console.error('[Copilot API] Command execution failed:', error);

        logCopilotInteraction({
          action: 'executeCommand_error',
          userId,
          sessionId,
          agentType: input.agentType,
          commandAction: input.action,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - startTime,
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Command execution failed',
          cause: error,
        });
      }
    }),

  // Session management endpoints
  getSession: publicProcedure.input(GetSessionSchema).query(async ({ input, ctx }) => {
    const userId = await getUserId(ctx);

    try {
      const session = await copilotAgent.getSession(input.sessionId);

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      // Ensure user owns the session
      if (session.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied to session',
        });
      }

      return session;
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve session',
        cause: error,
      });
    }
  }),

  updateSession: publicProcedure.input(UpdateSessionSchema).mutation(async ({ input, ctx }) => {
    const userId = await getUserId(ctx);

    try {
      const session = await copilotAgent.getSession(input.sessionId);

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      if (session.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied to session',
        });
      }

      // Update session (mock implementation)
      const updatedSession = {
        ...session,
        ...(input.title && { title: input.title }),
        ...(input.context && { context: { ...session.context, ...input.context } }),
        ...(input.preferences && { preferences: { ...session.preferences, ...input.preferences } }),
      };

      logCopilotInteraction({
        action: 'updateSession',
        userId,
        sessionId: input.sessionId,
        updates: Object.keys(input).filter(key => key !== 'sessionId'),
      });

      return updatedSession;
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update session',
        cause: error,
      });
    }
  }),

  clearSession: publicProcedure.input(GetSessionSchema).mutation(async ({ input, ctx }) => {
    const userId = await getUserId(ctx);

    try {
      const session = await copilotAgent.getSession(input.sessionId);

      if (session && session.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied to session',
        });
      }

      await copilotAgent.clearSession(input.sessionId);

      logCopilotInteraction({
        action: 'clearSession',
        userId,
        sessionId: input.sessionId,
      });

      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to clear session',
        cause: error,
      });
    }
  }),

  // Analytics and monitoring endpoints
  getActiveExecutions: publicProcedure.query(async ({ ctx }) => {
    const userId = await getUserId(ctx);

    try {
      const executions = commandRouter.getActiveExecutions();

      // Filter executions for current user (mock implementation)
      const userExecutions = executions.filter(exec =>
        exec.agentResults.some(ar => ar.metadata?.userId === userId)
      );

      return userExecutions;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve active executions',
        cause: error,
      });
    }
  }),

  getSystemMetrics: publicProcedure.query(async ({ ctx }) => {
    const userId = await getUserId(ctx);

    // Check admin permissions
    const hasPermission = await validateUserPermissions(userId, 'getSystemMetrics');
    if (!hasPermission) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to view system metrics',
      });
    }

    try {
      const metrics = commandRouter.getSystemMetrics();
      const activeSessions = await copilotAgent.getActiveSessionCount();

      return {
        ...metrics,
        activeSessions,
        systemStatus: 'healthy',
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve system metrics',
        cause: error,
      });
    }
  }),

  // Agent capability discovery
  getAvailableAgents: publicProcedure.query(async () => {
    try {
      const schemas = getAllCommandSchemas();

      return Object.entries(schemas).map(([agentType, commandSchemas]) => ({
        agentType,
        name: formatAgentName(agentType),
        description: getAgentDescription(agentType),
        capabilities: commandSchemas.length,
        commands: commandSchemas.map(schema => ({
          action: schema.action,
          description: schema.description,
          estimatedDuration: schema.estimatedDuration,
          budgetImpact: schema.budgetImpact,
          permissions: schema.permissions,
        })),
      }));
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve available agents',
        cause: error,
      });
    }
  }),

  getAgentCapabilities: publicProcedure
    .input(z.object({ agentType: z.string() }))
    .query(async ({ input }) => {
      try {
        const schemas = getAgentCommandSchemas(input.agentType);

        if (schemas.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Agent type '${input.agentType}' not found`,
          });
        }

        return {
          agentType: input.agentType,
          name: formatAgentName(input.agentType),
          description: getAgentDescription(input.agentType),
          commands: schemas,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve agent capabilities',
          cause: error,
        });
      }
    }),

  // Health check endpoint
  healthCheck: publicProcedure.query(async () => {
    try {
      const copilotHealth = (await copilotAgent.getActiveSessionCount()) >= 0;
      const voiceHealth = await voiceTranscriber.healthCheck();
      const commandRouterHealth = commandRouter.getActiveExecutions().length >= 0;

      const overallHealth = copilotHealth && voiceHealth && commandRouterHealth;

      return {
        status: overallHealth ? 'healthy' : 'degraded',
        services: {
          copilot: copilotHealth ? 'healthy' : 'unhealthy',
          voiceTranscriber: voiceHealth ? 'healthy' : 'unhealthy',
          commandRouter: commandRouterHealth ? 'healthy' : 'unhealthy',
        },
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };
    }
  }),
});

// Helper functions
function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  const words = text.split(' ');
  let currentChunk = '';

  for (const word of words) {
    if (currentChunk.length + word.length + 1 <= chunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + word;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = word;
      } else {
        // Handle very long words
        chunks.push(word.substring(0, chunkSize));
        currentChunk = word.substring(chunkSize);
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function formatAgentName(agentType: string): string {
  return agentType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getAgentDescription(agentType: string): string {
  const descriptions: { [key: string]: string } = {
    'llm-copilot': 'Natural language processing and conversation management',
    boardroom: 'Executive presentation and boardroom report generation',
    executive: 'Executive summary and strategic report compilation',
    campaign: 'Marketing campaign planning, execution, and optimization',
    content: 'AI-powered content generation and creative development',
    insight: 'Performance analytics and business intelligence',
    trend: 'Market trend analysis and predictive insights',
    'brand-voice': 'Brand consistency and voice alignment analysis',
    'social-media': 'Social media content creation and management',
  };

  return descriptions[agentType] || 'Specialized AI agent for marketing automation';
}

export type CopilotRouter = typeof copilotRouter;
