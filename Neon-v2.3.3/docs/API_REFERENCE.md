# 📊 **NeonHub API Reference**

## Complete tRPC Endpoint Documentation

![tRPC](https://img.shields.io/badge/tRPC-11.0-purple?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge)

> **Complete reference for all NeonHub API endpoints with examples and response schemas.**

---

## 📋 **Table of Contents**

- [🔗 Base URLs](#-base-urls)
- [🏥 Health & Status](#-health--status)
- [👤 User Management](#-user-management)
- [🤖 AI Agents](#-ai-agents)
- [🚨 Support & Alerts](#-support--alerts)
- [📊 Analytics](#-analytics)
- [🔧 System Status](#-system-status)
- [⚠️ Error Handling](#️-error-handling)
- [📝 Authentication](#-authentication)

---

## 🔗 **Base URLs**

### **Development**

```
http://localhost:3000/api/trpc
```

### **Production**

```
https://your-domain.com/api/trpc
```

### **System Endpoints**

```
https://your-domain.com/api/status
https://your-domain.com/api/analytics/track
```

---

## 🏥 **Health & Status**

### **Health Check**

**Endpoint:** `GET /api/trpc/health.ping`

**Description:** Basic health check to verify API is operational.

**Request:**

```bash
curl https://your-domain.com/api/trpc/health.ping
```

**Response:**

```json
{
  "result": {
    "data": {
      "message": "pong",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "status": "healthy"
    }
  }
}
```

**Response Schema:**

```typescript
type HealthResponse = {
  message: string;
  timestamp: string;
  status: "healthy" | "degraded" | "down";
};
```

---

## 👤 **User Management**

### **Get User Profile**

**Endpoint:** `GET /api/trpc/user.getProfile`

**Description:** Retrieve current user profile information.

**Request:**

```bash
curl https://your-domain.com/api/trpc/user.getProfile
```

**Response:**

```json
{
  "result": {
    "data": {
      "id": "1",
      "name": "Demo User",
      "email": "demo@neonhub.com",
      "avatar": null,
      "role": "user"
    }
  }
}
```

**Response Schema:**

```typescript
type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: "user" | "admin" | "manager";
};
```

### **Update User Profile**

**Endpoint:** `POST /api/trpc/user.updateProfile`

**Description:** Update user profile information.

**Request:**

```bash
curl -X POST https://your-domain.com/api/trpc/user.updateProfile \
  -H "Content-Type: application/json" \
  -d '{"name": "New Name", "email": "new@email.com"}'
```

**Request Schema:**

```typescript
type UpdateProfileInput = {
  name?: string;
  email?: string; // Must be valid email format
};
```

**Response:**

```json
{
  "result": {
    "data": {
      "success": true,
      "message": "Profile updated successfully",
      "data": {
        "name": "New Name",
        "email": "new@email.com"
      }
    }
  }
}
```

---

## 🤖 **AI Agents**

### **Get All Agents**

**Endpoint:** `GET /api/trpc/agents.getAll`

**Description:** Retrieve list of all available AI agents.

**Request:**

```bash
curl https://your-domain.com/api/trpc/agents.getAll
```

**Response:**

```json
{
  "result": {
    "data": [
      {
        "id": "1",
        "name": "Content Generator",
        "description": "AI-powered content creation and optimization",
        "status": "active",
        "type": "content"
      },
      {
        "id": "2",
        "name": "SEO Optimizer",
        "description": "Search engine optimization and keyword analysis",
        "status": "active",
        "type": "seo"
      }
    ]
  }
}
```

**Response Schema:**

```typescript
type Agent = {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "maintenance";
  type: "content" | "seo" | "email" | "social" | "support";
};
```

### **Get Agent by ID**

**Endpoint:** `GET /api/trpc/agents.getById?input="AGENT_ID"`

**Description:** Retrieve detailed information about a specific agent.

**Request:**

```bash
curl https://your-domain.com/api/trpc/agents.getById?input="1"
```

**Response:**

```json
{
  "result": {
    "data": {
      "id": "1",
      "name": "Content Generator",
      "description": "AI-powered content creation and optimization",
      "status": "active",
      "type": "content",
      "config": {},
      "createdAt": "2024-01-01T00:00:00.000Z",
      "metrics": {
        "tasksCompleted": 156,
        "successRate": 94.2,
        "avgResponseTime": "2.3s"
      }
    }
  }
}
```

**Response Schema:**

```typescript
type AgentDetails = Agent & {
  config: Record<string, any>;
  createdAt: string;
  metrics?: {
    tasksCompleted: number;
    successRate: number;
    avgResponseTime: string;
  };
};
```

---

## 🚨 **Support & Alerts**

### **Send Alert**

**Endpoint:** `POST /api/trpc/support.sendAlert`

**Description:** Send email, SMS, or multi-channel alerts.

**Request:**

```bash
curl -X POST https://your-domain.com/api/trpc/support.sendAlert \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "recipient": "user@example.com",
    "subject": "Test Alert",
    "message": "This is a test alert from NeonHub",
    "urgency": "high"
  }'
```

**Request Schema:**

```typescript
type SendAlertInput = {
  type: "email" | "sms" | "both";
  recipient: string;
  subject?: string; // Required for email
  message: string;
  urgency: "low" | "medium" | "high";
};
```

**Response:**

```json
{
  "result": {
    "data": {
      "success": true,
      "message": "Alert sent successfully",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## 📊 **Analytics**

### **Track Event**

**Endpoint:** `POST /api/analytics/track`

**Description:** Track user events and behaviors for analytics.

**Request:**

```bash
curl -X POST https://your-domain.com/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "event": "page_view",
    "properties": {
      "page": "/campaigns",
      "user": "demo_user",
      "campaign_id": "camp_123"
    }
  }'
```

**Request Schema:**

```typescript
type TrackEventInput = {
  event: string;
  properties?: Record<string, any>;
};
```

**Response:**

```json
{
  "success": true,
  "message": "Event tracked successfully",
  "eventId": "evt_1234567890_abc123"
}
```

**Automatic Properties Added:**

```typescript
type AnalyticsEvent = {
  event: string;
  properties: {
    timestamp: string;
    userAgent: string;
    ip: string;
    referer: string;
    page: string;
    // ... custom properties
  };
};
```

---

## 🔧 **System Status**

### **Comprehensive System Status**

**Endpoint:** `GET /api/status`

**Description:** Detailed system health, performance, and application metrics.

**Request:**

```bash
curl https://your-domain.com/api/status
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "system": {
    "uptime": 86400,
    "memory": {
      "heapUsed": 50331648,
      "heapTotal": 67108864,
      "external": 1441792
    },
    "env": "production",
    "nodeVersion": "v18.17.0",
    "platform": "linux",
    "pid": 1234
  },
  "health": {
    "api": true,
    "database": true,
    "memory": true,
    "response": true
  },
  "performance": {
    "responseTime": 15,
    "memoryUsage": {
      "used": 48,
      "total": 64,
      "external": 1
    },
    "uptime": {
      "seconds": 86400,
      "formatted": "1d 0h 0m 0s"
    }
  },
  "application": {
    "name": "NeonHub",
    "version": "1.0.0",
    "build": "abc123",
    "deployment": "production.vercel.app",
    "region": "us-east-1"
  },
  "endpoints": {
    "health": "/api/trpc/health.ping",
    "analytics": "/api/analytics/track",
    "status": "/api/status"
  }
}
```

---

## ⚠️ **Error Handling**

### **Error Response Format**

```json
{
  "error": {
    "json": {
      "message": "Error description",
      "code": -32600,
      "data": {
        "code": "BAD_REQUEST",
        "httpStatus": 400,
        "path": "endpoint.path",
        "zodError": {
          "fieldErrors": {},
          "formErrors": ["Validation error message"]
        }
      }
    }
  }
}
```

### **Common Error Codes**

- **400 Bad Request**: Invalid input parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Endpoint or resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### **Validation Errors**

```json
{
  "error": {
    "json": {
      "message": "[{\"code\":\"invalid_type\",\"expected\":\"string\",\"received\":\"undefined\",\"path\":[],\"message\":\"Required\"}]",
      "code": -32600,
      "data": {
        "code": "BAD_REQUEST",
        "httpStatus": 400,
        "zodError": {
          "fieldErrors": {
            "email": ["Invalid email format"]
          },
          "formErrors": []
        }
      }
    }
  }
}
```

---

## 📝 **Authentication**

### **Current Status**

- No authentication required for current endpoints
- All endpoints are public for demo purposes

### **Future Implementation**

```typescript
// When authentication is added:
type AuthenticatedRequest = {
  headers: {
    Authorization: `Bearer ${string}`;
  };
};

type UserContext = {
  user: {
    id: string;
    email: string;
    role: string;
  };
};
```

---

## 🔄 **Batch Requests**

### **tRPC Batch Query**

**Description:** Execute multiple queries in a single request.

**Request:**

```bash
curl "https://your-domain.com/api/trpc/health.ping,user.getProfile?batch=1&input={}"
```

**Response:**

```json
[
  {
    "result": {
      "data": {
        "message": "pong",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "status": "healthy"
      }
    }
  },
  {
    "result": {
      "data": {
        "id": "1",
        "name": "Demo User",
        "email": "demo@neonhub.com"
      }
    }
  }
]
```

---

## 📊 **Rate Limits**

### **Current Limits**

- **Default**: 100 requests per minute per IP
- **Analytics**: 1000 events per minute per IP
- **Alerts**: 10 alerts per minute per recipient

### **Headers**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

---

## 🧪 **Testing Endpoints**

### **Quick Health Test**

```bash
# Test all core endpoints
curl https://your-domain.com/api/trpc/health.ping
curl https://your-domain.com/api/status
curl https://your-domain.com/api/trpc/user.getProfile
curl https://your-domain.com/api/trpc/agents.getAll
```

### **Analytics Test**

```bash
curl -X POST https://your-domain.com/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{"event":"api_test","properties":{"source":"documentation"}}'
```

---

## 📚 **SDK Usage**

### **Frontend (React)**

```typescript
import { api } from "@/utils/trpc";

// React Query hooks
const { data: health } = api.health.ping.useQuery();
const { data: user } = api.user.getProfile.useQuery();
const updateProfile = api.user.updateProfile.useMutation();

// Usage
await updateProfile.mutateAsync({
  name: "New Name",
  email: "new@email.com",
});
```

### **Node.js Client**

```typescript
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "./server/root";

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "https://your-domain.com/api/trpc",
    }),
  ],
});

// Usage
const health = await client.health.ping.query();
const agents = await client.agents.getAll.query();
```

---

## 🔧 **Development Tools**

### **tRPC DevTools**

- **Panel**: Available in development mode
- **Network Tab**: Inspect requests/responses
- **Type Safety**: Full TypeScript integration

### **API Testing**

- **Postman Collection**: Available in `/docs/postman/`
- **Insomnia Collection**: Available in `/docs/insomnia/`
- **curl Examples**: Throughout this documentation

---

**📊 Complete API Reference for NeonHub AI Marketing Platform**

**Need help?** Contact support@neonhub.com or create an issue on GitHub.
