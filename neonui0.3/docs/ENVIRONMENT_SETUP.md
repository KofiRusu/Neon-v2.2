# ⚙️ **NeonHub Environment Configuration**

## Complete Production Setup Guide

![Environment](https://img.shields.io/badge/Environment-Production%20Ready-green?style=for-the-badge)
![Variables](https://img.shields.io/badge/Variables-50%2B%20Configured-blue?style=for-the-badge)

> **Complete environment variable configuration for NeonHub production deployment with auto-scaling, monitoring, and third-party integrations.**

---

## 📋 **Table of Contents**

- [🔧 Core System Configuration](#-core-system-configuration)
- [📧 Email Services](#-email-services)
- [📱 SMS Services](#-sms-services)
- [🤖 AI Services](#-ai-services)
- [📊 Analytics & Monitoring](#-analytics--monitoring)
- [🚨 Error Tracking](#-error-tracking)
- [🏗️ Deployment & Scaling](#️-deployment--scaling)
- [🔐 Security & Authentication](#-security--authentication)
- [🗄️ Database & Caching](#️-database--caching)
- [🌍 Third-Party Integrations](#-third-party-integrations)
- [📈 Auto-Scaling Configuration](#-auto-scaling-configuration)
- [✅ Production Checklist](#-production-checklist)

---

## 🔧 **Core System Configuration**

### **Required Variables**

```bash
# Database connection (REQUIRED)
DATABASE_URL="postgresql://username:password@host:5432/neonhub_production"

# NextAuth secret (REQUIRED - generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-super-secure-secret-key-here"

# Application environment
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
```

### **Application Metadata**

```bash
NEXT_PUBLIC_APP_NAME="NeonHub"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_SUPPORT_EMAIL="support@neonhub.com"
```

---

## 📧 **Email Services (SendGrid)**

### **Basic Configuration**

```bash
# SendGrid API key
SENDGRID_API_KEY="SG.your-sendgrid-api-key-here"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
SENDGRID_FROM_NAME="NeonHub Platform"
```

### **Email Templates**

```bash
# Template IDs for different email types
SENDGRID_WELCOME_TEMPLATE_ID="d-welcome-template-id"
SENDGRID_ALERT_TEMPLATE_ID="d-alert-template-id"
SENDGRID_NOTIFICATION_TEMPLATE_ID="d-notification-template-id"
```

### **Setup Guide**

1. Create SendGrid account at https://sendgrid.com
2. Generate API key with "Mail Send" permissions
3. Verify sender email domain
4. Create email templates in SendGrid dashboard
5. Add API key to Vercel environment variables

---

## 📱 **SMS Services (Twilio)**

### **Configuration**

```bash
# Twilio credentials
TWILIO_ACCOUNT_SID="ACyour-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
TWILIO_WHATSAPP_NUMBER="whatsapp:+1234567890"
```

### **Setup Guide**

1. Create Twilio account at https://twilio.com
2. Purchase phone number for SMS
3. Set up WhatsApp Business API (optional)
4. Get Account SID and Auth Token from dashboard
5. Add credentials to environment variables

---

## 🤖 **AI Services**

### **OpenAI Configuration**

```bash
# OpenAI API (for AI agents)
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_ORG_ID="org-your-organization-id"
OPENAI_MODEL="gpt-4"
```

### **Anthropic Configuration**

```bash
# Anthropic API (Claude)
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key"
ANTHROPIC_MODEL="claude-3-sonnet-20240229"
```

### **Setup Guide**

1. **OpenAI**: Get API key from https://platform.openai.com
2. **Anthropic**: Get API key from https://console.anthropic.com
3. Set usage limits and billing alerts
4. Monitor API usage in respective dashboards

---

## 📊 **Analytics & Monitoring**

### **PostHog Analytics**

```bash
NEXT_PUBLIC_POSTHOG_KEY="phc_your-posthog-key"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

### **Google Analytics (Optional)**

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

### **Mixpanel (Optional)**

```bash
NEXT_PUBLIC_MIXPANEL_TOKEN="your-mixpanel-token"
```

### **Vercel Analytics**

```bash
# Automatically configured on Vercel
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="your-vercel-analytics-id"
```

---

## 🚨 **Error Tracking & Monitoring**

### **Sentry Configuration**

```bash
# Sentry error tracking
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
SENTRY_ORG="your-sentry-org"
SENTRY_PROJECT="neonhub"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"
```

### **LogRocket (Optional)**

```bash
NEXT_PUBLIC_LOGROCKET_APP_ID="your-logrocket-app-id"
```

### **Setup Guide**

1. **Sentry**: Create project at https://sentry.io
2. Get DSN from project settings
3. Configure error tracking and performance monitoring
4. Set up alerts for critical errors

---

## 🏗️ **Deployment & Scaling**

### **Vercel Configuration**

```bash
# Vercel deployment
VERCEL_PROJECT_ID="prj_your-vercel-project-id"
VERCEL_ORG_ID="your-vercel-org-id"
VERCEL_TOKEN="your-vercel-token"
```

### **GitHub Actions**

```bash
# CI/CD configuration
GITHUB_TOKEN="ghp_your-github-token"
```

### **Notification Services**

```bash
# Slack notifications
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
SLACK_CHANNEL="#neonhub-alerts"

# Discord notifications (alternative)
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR/WEBHOOK"
```

---

## 🔐 **Security & Authentication**

### **Rate Limiting**

```bash
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW_MS="60000"
```

### **CORS Configuration**

```bash
CORS_ORIGINS="https://your-domain.com,https://admin.your-domain.com"
```

### **JWT Configuration**

```bash
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"
```

---

## 🗄️ **Database & Caching**

### **Database Configuration**

```bash
# Connection pool settings
DATABASE_CONNECTION_LIMIT="10"
DATABASE_POOL_TIMEOUT="20000"
```

### **Redis Cache (Optional)**

```bash
# Redis for caching and sessions
REDIS_URL="redis://username:password@host:port"
REDIS_TLS_URL="rediss://username:password@host:port"
```

### **Database Providers**

#### **Railway (Recommended)**

```bash
# Example Railway PostgreSQL
DATABASE_URL="postgresql://postgres:password@containers-us-west.railway.app:1234/railway"
```

- Automatic backups
- Built-in monitoring
- Easy scaling

#### **PlanetScale**

```bash
# Example PlanetScale MySQL
DATABASE_URL="mysql://username:password@aws.connect.psdb.cloud/database-name?sslaccept=strict"
```

- Branching workflow
- Automatic scaling
- Global replication

#### **Upstash Redis**

```bash
# Example Upstash Redis
REDIS_URL="rediss://:password@us1-touching-hermit-12345.upstash.io:12345"
```

- Serverless Redis
- Global replication
- REST API support

---

## 🌍 **Third-Party Integrations**

### **Stripe Payments (Optional)**

```bash
STRIPE_PUBLIC_KEY="pk_live_your-stripe-public-key"
STRIPE_SECRET_KEY="sk_live_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

### **Zapier Automation**

```bash
ZAPIER_WEBHOOK_URL="https://hooks.zapier.com/hooks/catch/YOUR/WEBHOOK"
```

### **Slack App Integration**

```bash
SLACK_CLIENT_ID="your-slack-client-id"
SLACK_CLIENT_SECRET="your-slack-client-secret"
SLACK_SIGNING_SECRET="your-slack-signing-secret"
```

---

## 📈 **Auto-Scaling Configuration**

### **Performance Thresholds**

```bash
# Auto-scaling triggers
SCALE_UP_CPU_THRESHOLD="80"
SCALE_UP_MEMORY_THRESHOLD="85"
SCALE_UP_RESPONSE_TIME_THRESHOLD="2000"
```

### **Health Check Settings**

```bash
HEALTH_CHECK_INTERVAL="300000"
HEALTH_CHECK_TIMEOUT="30000"
HEALTH_CHECK_RETRIES="3"
```

### **CDN Configuration**

```bash
NEXT_PUBLIC_CDN_URL="https://cdn.your-domain.com"
NEXT_PUBLIC_ASSET_PREFIX=""
```

### **Feature Flags**

```bash
# Feature toggles for scaling
NEXT_PUBLIC_ENABLE_ANALYTICS="true"
NEXT_PUBLIC_ENABLE_CHAT="true"
NEXT_PUBLIC_ENABLE_NOTIFICATIONS="true"
NEXT_PUBLIC_ENABLE_AI_AGENTS="true"
```

---

## 🔧 **Development Configuration**

### **Debug Settings**

```bash
# Development only
DEBUG="false"
VERBOSE_LOGGING="false"
ENABLE_SOURCEMAPS="false"
```

### **API Configuration**

```bash
NEXT_PUBLIC_API_TIMEOUT="10000"
NEXT_PUBLIC_MAX_FILE_SIZE="10485760"
API_RESPONSE_LOGGING="false"
TRPC_DEBUG="false"
```

---

## 🛠️ **Environment Setup Process**

### **1. Local Development**

```bash
# Create .env.local file
cp .env.example .env.local

# Edit with your development values
nano .env.local

# Start development server
npm run dev
```

### **2. Production Deployment**

```bash
# Add to Vercel Dashboard
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add each variable with production values
3. Deploy from main branch
```

### **3. Staging Environment**

```bash
# Create staging deployment
1. Create staging branch
2. Deploy to separate Vercel project
3. Use staging database and services
```

---

## ✅ **Production Checklist**

### **🔐 Security**

- [ ] Strong NEXTAUTH_SECRET (32+ characters)
- [ ] Secure database password
- [ ] API keys restricted to necessary permissions
- [ ] CORS origins properly configured
- [ ] Rate limiting enabled

### **📊 Monitoring**

- [ ] Error tracking (Sentry) configured
- [ ] Analytics (PostHog/GA) enabled
- [ ] Health checks automated
- [ ] Performance monitoring active
- [ ] Alert notifications configured

### **🗄️ Data**

- [ ] Production database configured
- [ ] Database backups automated
- [ ] Redis cache (if using) configured
- [ ] Connection pooling optimized

### **📧 Communications**

- [ ] Email service (SendGrid) verified
- [ ] SMS service (Twilio) tested
- [ ] Alert notifications working
- [ ] Welcome emails functional

### **🚀 Performance**

- [ ] CDN configured
- [ ] Auto-scaling enabled
- [ ] Performance thresholds set
- [ ] Response time monitoring active

### **🔄 CI/CD**

- [ ] GitHub Actions working
- [ ] Automated deployments active
- [ ] Health checks in pipeline
- [ ] Rollback procedures tested

---

## 🎯 **Quick Setup Commands**

### **Generate Secrets**

```bash
# Generate NextAuth secret
openssl rand -base64 32

# Generate JWT secret
openssl rand -hex 32

# Generate API key
openssl rand -base64 24 | tr -d "=+/" | cut -c1-32
```

### **Environment Variable Management**

```bash
# Install Vercel CLI
npm install -g vercel

# Add environment variable
vercel env add VARIABLE_NAME

# List environment variables
vercel env ls

# Pull environment variables
vercel env pull .env.local
```

### **Database Setup**

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Run migrations
npx prisma migrate deploy
```

---

## 📚 **Additional Resources**

### **Documentation**

- 📖 [Main Setup Guide](./README.md)
- 🚀 [Deployment Guide](./DEPLOYMENT.md)
- 📊 [API Reference](./API_REFERENCE.md)
- 🔧 [Monitoring Guide](./MONITORING.md)

### **Service Providers**

- **Database**: Railway, PlanetScale, Supabase
- **Email**: SendGrid, Mailgun, Postmark
- **SMS**: Twilio, MessageBird
- **Analytics**: PostHog, Mixpanel, Google Analytics
- **Error Tracking**: Sentry, LogRocket, Bugsnag
- **Monitoring**: Uptime Robot, Pingdom, StatusCake

---

**⚙️ Complete Environment Configuration for NeonHub AI Marketing Platform**

**Questions?** Check the troubleshooting section in our documentation or contact support@neonhub.com
