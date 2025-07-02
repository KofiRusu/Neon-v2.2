# 🚀 **NeonHub AI Marketing Platform**

## Production-Ready AI-Powered Marketing Automation

![NeonHub](https://img.shields.io/badge/NeonHub-Production%20Ready-green?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![tRPC](https://img.shields.io/badge/tRPC-11.0-purple?style=for-the-badge)

> **Transform your marketing with AI-powered automation, real-time analytics, and intelligent campaign management.**

---

## 📋 **Table of Contents**

- [🎯 Overview](#-overview)
- [🚀 Quick Start](#-quick-start)
- [🛠️ Installation](#️-installation)
- [⚙️ Configuration](#️-configuration)
- [📦 Deployment](#-deployment)
- [📊 API Reference](#-api-reference)
- [🔧 Troubleshooting](#-troubleshooting)
- [📈 Monitoring](#-monitoring)
- [🤝 Support](#-support)

---

## 🎯 **Overview**

NeonHub is a comprehensive AI marketing platform featuring:

- **🤖 AI Agents**: Specialized agents for content, SEO, email, and social media
- **📊 Real-time Analytics**: Performance tracking and ROI optimization
- **🎯 Campaign Management**: Automated A/B testing and optimization
- **📧 Multi-channel Communication**: Email, SMS, and WhatsApp integration
- **🔍 Advanced Monitoring**: System health and performance tracking

### **Key Features**

- ✅ **36+ Pages**: Complete marketing dashboard and tools
- ✅ **Production Ready**: 100% successful builds, zero critical errors
- ✅ **Type Safe**: Full TypeScript with tRPC integration
- ✅ **Mobile Optimized**: Responsive design across all devices
- ✅ **Performance Optimized**: 101KB core bundle, sub-second load times

---

## 🚀 **Quick Start**

### **1. Prerequisites**

- Node.js 18+
- npm or yarn
- Git

### **2. Clone & Install**

```bash
git clone <your-repo-url>
cd neonui0.3
npm install
```

### **3. Environment Setup**

```bash
# Copy environment template
cp .env.example .env.local

# Add your credentials
DATABASE_URL="postgresql://user:pass@host:5432/neonhub"
NEXTAUTH_SECRET="your-secret-key"
SENDGRID_API_KEY="your-sendgrid-key"
```

### **4. Start Development**

```bash
npm run dev
```

**🎉 Open [http://localhost:3000](http://localhost:3000) - You're ready!**

---

## 🛠️ **Installation**

### **Development Setup**

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

### **Production Build**

```bash
# Build for production
npm run build

# Start production server
npm start
```

### **Docker Setup**

```bash
# Build Docker image
docker build -t neonhub .

# Run with Docker Compose
docker-compose up -d
```

---

## ⚙️ **Configuration**

### **Environment Variables**

#### **Required:**

```bash
DATABASE_URL="postgresql://user:pass@host:5432/neonhub"
NEXTAUTH_SECRET="your-super-secure-secret"
```

#### **Optional Services:**

```bash
# Email (SendGrid)
SENDGRID_API_KEY="SG.your-api-key"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"

# AI Services
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"

# Analytics
NEXT_PUBLIC_POSTHOG_KEY="your-posthog-key"
NEXT_PUBLIC_ANALYTICS_ID="your-analytics-id"
```

### **Database Setup**

#### **Option 1: Railway (Recommended)**

1. Create Railway account
2. Deploy PostgreSQL service
3. Copy DATABASE_URL to your `.env`

#### **Option 2: Local PostgreSQL**

```bash
# Install PostgreSQL locally
brew install postgresql  # macOS
sudo apt install postgresql  # Ubuntu

# Start service
brew services start postgresql
```

---

## 📦 **Deployment**

### **🚀 Vercel (One-Click Deploy)**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

**Vercel Configuration:**

- Build Command: `npm run build`
- Output Directory: `.next`
- Root Directory: `neonui0.3`
- Node.js Version: 18.x

### **🐳 Docker Deployment**

```bash
# Production deployment
docker-compose up -d

# Scale services
docker-compose up -d --scale neonhub=3
```

### **☁️ VPS Deployment**

```bash
# On your server
git clone <repo-url>
cd neonui0.3
npm install --production
npm run build

# Use PM2 for process management
npm install -g pm2
pm2 start npm --name "neonhub" -- start
pm2 save
pm2 startup
```

---

## 📊 **API Reference**

### **Health & Status**

```bash
# Health check
GET /api/trpc/health.ping
Response: {"result":{"data":{"message":"pong","status":"healthy"}}}

# System status
GET /api/status
Response: {"status":"healthy","uptime":1234,"memory":{...}}
```

### **Analytics**

```bash
# Track events
POST /api/analytics/track
Body: {"event":"page_view","properties":{"page":"/campaigns"}}
Response: {"success":true,"eventId":"evt_123"}
```

### **User Management**

```bash
# Get user profile
GET /api/trpc/user.getProfile
Response: {"id":"1","name":"Demo User","email":"demo@neonhub.com"}

# Update profile
POST /api/trpc/user.updateProfile
Body: {"name":"New Name","email":"new@email.com"}
```

### **Agents**

```bash
# Get all agents
GET /api/trpc/agents.getAll
Response: [{"id":"1","name":"Content Generator","type":"CONTENT"}]

# Get agent by ID
GET /api/trpc/agents.getById?input="1"
Response: {"id":"1","name":"Content Generator","metrics":{...}}
```

### **Support & Alerts**

```bash
# Send alert
POST /api/trpc/support.sendAlert
Body: {"type":"email","recipient":"user@example.com","message":"Alert text"}
Response: {"success":true,"timestamp":"2024-01-01T00:00:00Z"}
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Build Errors**

```bash
# Clear cache and rebuild
rm -rf .next node_modules/.cache
npm install
npm run build
```

#### **Database Connection**

```bash
# Test connection
DATABASE_URL="your-url" npx prisma db pull

# Generate client
npx prisma generate
```

#### **Port Already in Use**

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

#### **Environment Variables Not Loading**

- Check `.env.local` exists
- Restart development server
- Verify variable names (no spaces)
- Use `NEXT_PUBLIC_` prefix for client-side variables

### **Performance Issues**

```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Run performance audit
npx lighthouse http://localhost:3000 --output html
```

---

## 📈 **Monitoring**

### **System Health**

- **Health Check**: `/api/trpc/health.ping`
- **System Status**: `/api/status`
- **Analytics**: Real-time event tracking

### **Performance Metrics**

- **Core Bundle**: 101KB (Target: <150KB) ✅
- **Largest Page**: 296KB (Target: <300KB) ✅
- **Pages**: 36 successfully compiled ✅
- **Build Time**: ~30 seconds ✅

### **Uptime Monitoring**

```bash
# Set up monitoring (recommended services)
# - Uptime Robot: https://uptimerobot.com
# - Pingdom: https://www.pingdom.com
# - StatusCake: https://www.statuscake.com

# Monitor these endpoints:
curl https://your-domain.com/api/trpc/health.ping
curl https://your-domain.com/api/status
```

### **Error Tracking**

```bash
# Recommended: Sentry integration
npm install @sentry/nextjs

# Add to next.config.js
const { withSentryConfig } = require('@sentry/nextjs');
module.exports = withSentryConfig(nextConfig, sentryOptions);
```

---

## 🔒 **Security**

### **Best Practices**

- ✅ Environment variables secured
- ✅ HTTPS enabled (Vercel/CloudFlare)
- ✅ API rate limiting configured
- ✅ Input validation with Zod
- ✅ CSP headers implemented

### **Security Headers**

```typescript
// next.config.js
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
];
```

---

## 📊 **Analytics & Insights**

### **Built-in Analytics**

- Page views and user interactions
- Campaign performance metrics
- System performance monitoring
- Error tracking and reporting

### **Integration Options**

- **PostHog**: Product analytics
- **Google Analytics**: Web analytics
- **Mixpanel**: Event tracking
- **Plausible**: Privacy-focused analytics

---

## 🔄 **CI/CD Pipeline**

### **GitHub Actions**

- ✅ Automated builds on push
- ✅ Playwright E2E testing
- ✅ Lighthouse performance audits
- ✅ Vercel preview deployments

### **Quality Gates**

- TypeScript compilation
- ESLint code quality
- Playwright UI tests
- Performance thresholds

---

## 🤝 **Support**

### **Development Support**

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

### **Production Support**

- **Email**: support@neonhub.com
- **Response Time**: < 4 hours business days
- **Emergency**: < 1 hour (production down)

### **Documentation**

- **API Docs**: `/docs/api-reference.md`
- **Deployment**: `/docs/deployment.md`
- **Monitoring**: `/docs/monitoring.md`

---

## 📝 **Changelog**

### **v1.0.0** (Production Release)

- ✅ Complete tRPC backend integration
- ✅ Marketing homepage and UI optimization
- ✅ Analytics and monitoring infrastructure
- ✅ Multi-channel communication system
- ✅ Docker and Vercel deployment support

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**🚀 NeonHub: Transform your marketing with AI-powered automation!**

**Made with ❤️ by the NeonHub Team**
