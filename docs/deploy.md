# NeonHub AI Marketing Ecosystem - Deployment Guide

## 🚀 Overview

This guide covers the complete deployment process for the NeonHub AI Marketing
Ecosystem, from local development to production environments.

## 📋 Prerequisites

### Required Tools

- Node.js 18+
- Docker & Docker Compose
- Git
- PostgreSQL 14+
- Redis 6+
- OpenAI API key
- Vercel account (for frontend deployment)
- PlanetScale account (for database hosting)

### Environment Variables

Create `.env` files for each environment:

```bash
# .env.local (Development)
DATABASE_URL="postgresql://user:password@localhost:5432/neonhub_dev"
REDIS_URL="redis://localhost:6379"
OPENAI_API_KEY="your-openai-api-key"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# .env.production (Production)
DATABASE_URL="your-planetscale-url"
REDIS_URL="your-redis-url"
OPENAI_API_KEY="your-openai-api-key"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
```

## 🏗️ Local Development Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd neonhub-ai-ecosystem
npm install
```

### 2. Database Setup

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 3. Start Development Servers

```bash
# Start all services
npm run dev

# Or start individually
npm run dev:dashboard  # Next.js dashboard on :3000
npm run dev:api        # API server on :3001
```

### 4. Verify Setup

- Dashboard: http://localhost:3000
- API: http://localhost:3001
- Prisma Studio: http://localhost:5555

## 🐳 Docker Development Environment

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: neonhub_dev
      POSTGRES_USER: neonhub
      POSTGRES_PASSWORD: password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  dashboard:
    build:
      context: .
      dockerfile: docker/Dockerfile.dashboard
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules

  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
```

### Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up volumes
docker-compose down -v
```

## 🧪 Staging Environment

### 1. Staging Infrastructure

- **Frontend**: Vercel (staging branch)
- **Backend**: Railway or Render
- **Database**: PlanetScale (staging branch)
- **Redis**: Upstash Redis

### 2. Staging Deployment

```bash
# Deploy to staging
git checkout staging
git merge develop
git push origin staging

# Vercel will auto-deploy from staging branch
# API will deploy via Railway/Render webhook
```

### 3. Staging Verification

- Run automated tests
- Verify database migrations
- Test AI agent functionality
- Check performance metrics

## 🏭 Production Deployment

### 1. Production Infrastructure

#### Frontend (Vercel)

```bash
# Deploy to production
git checkout main
git merge staging
git push origin main

# Vercel will auto-deploy from main branch
```

#### Backend (Railway/Render)

- Connect GitHub repository
- Set production environment variables
- Configure auto-deploy from main branch
- Set up health checks

#### Database (PlanetScale)

```bash
# Create production database
npx prisma db push --schema=packages/data-model/prisma/schema.prisma

# Run migrations
npx prisma migrate deploy --schema=packages/data-model/prisma/schema.prisma
```

### 2. Production Environment Variables

```bash
# Production .env
DATABASE_URL="your-planetscale-production-url"
REDIS_URL="your-upstash-redis-url"
OPENAI_API_KEY="your-production-openai-key"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://neonhub.com"
VERCEL_URL="https://neonhub.com"
```

### 3. Production Verification Checklist

- [ ] All environment variables set
- [ ] Database migrations completed
- [ ] SSL certificates configured
- [ ] CDN configured
- [ ] Monitoring tools active
- [ ] Backup systems configured
- [ ] Security scanning completed

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run test:e2e

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Staging
        run: |
          # Deploy to staging environment
          echo "Deploying to staging..."

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Production
        run: |
          # Deploy to production environment
          echo "Deploying to production..."
```

## 📊 Monitoring & Observability

### Application Monitoring

- **Vercel Analytics**: Frontend performance
- **Railway/Render Metrics**: Backend performance
- **PlanetScale Insights**: Database performance
- **Upstash Redis**: Cache performance

### Error Tracking

```bash
# Install Sentry
npm install @sentry/nextjs @sentry/node

# Configure in next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig({
  // your existing config
}, {
  // Sentry config
  silent: true,
  org: "your-org",
  project: "neonhub-ai-ecosystem",
});
```

### Health Checks

```typescript
// apps/api/src/health.ts
export async function healthCheck() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis connection
    await redis.ping();

    // Check OpenAI API
    await openai.models.list();

    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```

## 🔐 Security Configuration

### SSL/TLS

- Vercel provides automatic SSL
- Configure custom domain with SSL
- Enable HSTS headers

### API Security

```typescript
// Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

### Environment Security

- Use secrets management
- Rotate API keys regularly
- Enable audit logging
- Configure firewall rules

## 📈 Performance Optimization

### Frontend Optimization

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-cdn-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizeCss: true,
  },
  compress: true,
};
```

### Backend Optimization

```typescript
// Caching strategy
import { cache } from 'react';

export const getCachedData = cache(async (key: string) => {
  // Implementation
});

// Database optimization
const optimizedQuery = await prisma.campaign.findMany({
  select: {
    id: true,
    name: true,
    metrics: true,
  },
  where: {
    status: 'ACTIVE',
  },
  take: 100,
});
```

## 🔄 Rollback Procedures

### Database Rollback

```bash
# Rollback to previous migration
npx prisma migrate reset --schema=packages/data-model/prisma/schema.prisma

# Or rollback specific migration
npx prisma migrate resolve --rolled-back <migration-name>
```

### Application Rollback

```bash
# Vercel rollback
vercel rollback <deployment-url>

# Railway/Render rollback
# Use dashboard to rollback to previous deployment
```

### Emergency Rollback

```bash
# Quick rollback to previous commit
git revert HEAD
git push origin main

# Or force push to previous commit
git reset --hard HEAD~1
git push --force origin main
```

## 🧪 Testing in Production

### Blue-Green Deployment

1. Deploy new version to green environment
2. Run smoke tests
3. Switch traffic to green environment
4. Monitor for issues
5. Keep blue environment as backup

### Canary Deployment

1. Deploy to 5% of users
2. Monitor metrics
3. Gradually increase to 100%
4. Rollback if issues detected

## 📋 Post-Deployment Checklist

### Immediate Checks

- [ ] All services responding
- [ ] Database connections working
- [ ] AI agents functioning
- [ ] Monitoring alerts configured
- [ ] Error tracking active

### Performance Checks

- [ ] Response times acceptable
- [ ] Database query performance
- [ ] Cache hit rates
- [ ] Memory usage stable
- [ ] CPU usage normal

### Security Checks

- [ ] SSL certificates valid
- [ ] API endpoints secured
- [ ] Environment variables protected
- [ ] Access logs monitored
- [ ] Security scans passed

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check database status
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

#### Redis Connection Issues

```bash
# Check Redis status
docker-compose ps redis

# Test Redis connection
redis-cli ping
```

#### AI Agent Issues

```bash
# Check OpenAI API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Check agent logs
npm run logs:agents
```

### Emergency Contacts

- **DevOps**: [contact info]
- **Database Admin**: [contact info]
- **Security Team**: [contact info]

---

_This deployment guide should be updated as the infrastructure evolves and new
deployment patterns are established._
