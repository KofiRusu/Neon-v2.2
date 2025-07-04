# Agents Router

AI Agent management and execution endpoints

**Category**: Core  
**File**: `apps/api/src/routers/agent.ts`  
**Last Modified**: 7/4/2025

## Procedures

### getTypes

**Type**: `query`  
**Description**: GetTypes endpoint



#### Usage

```typescript
const result = await trpc.agents.getTypes.query();
```



#### Examples

##### Get all agent types

Retrieve list of available AI agent types

**Request:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "data": [
    "ContentAgent",
    "AdAgent",
    "SEOAgent"
  ]
}
```


## Router Metadata

- **Total Procedures**: 1
- **Queries**: 1
- **Mutations**: 0
- **Protected Procedures**: 0

---

*This documentation was auto-generated from tRPC router definitions*
