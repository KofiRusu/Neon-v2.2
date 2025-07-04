# NeonHub API Reference

Comprehensive API documentation for NeonHub AI Marketing Platform

## Overview

This API reference provides comprehensive documentation for all NeonHub tRPC endpoints. The API is organized into logical routers that handle different aspects of the marketing automation platform.

## Base URL

```
/api/trpc
```

## Authentication

Some endpoints require authentication. Protected procedures are marked with 🔒 in the documentation.

## Available Routers

### Agents Router
- **Category**: Core
- **Description**: AI Agent management and execution endpoints
- **Procedures**: 1
- **Documentation**: [agents.md](agents.md)

### Campaigns Router
- **Category**: Core
- **Description**: Campaign orchestration and management endpoints
- **Procedures**: 1
- **Documentation**: [campaigns.md](campaigns.md)

### Metrics Router
- **Category**: Core
- **Description**: Performance metrics and analytics endpoints
- **Procedures**: 0
- **Documentation**: [metrics.md](metrics.md)



## Quick Start

```typescript
import { trpc } from '@/utils/trpc';

// Example: Get all agent types
const agentTypes = await trpc.agents.getTypes.query();

// Example: Execute agent command
const result = await trpc.agents.execute.mutate({
  agentType: 'ContentAgent',
  command: 'generate-content',
  parameters: { topic: 'AI marketing' }
});
```

## Error Handling

All endpoints return responses in a consistent format:

```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}
```

## Rate Limiting

API endpoints are rate-limited to ensure optimal performance:
- **Query endpoints**: 100 requests per minute
- **Mutation endpoints**: 50 requests per minute

## Support

For API support and questions:
- 📧 Email: dev-support@neonhub.ai
- 💬 Discord: [NeonHub Community](https://discord.gg/neonhub)
- 📖 Documentation: [Full Documentation](../README.md)

---

*Last updated: 2025-07-04T00:45:54.285Z*
*Generated automatically from tRPC definitions*
