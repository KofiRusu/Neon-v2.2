# 🚀 NeonHub Unified Full-Stack Workspace

**Unified AI Marketing Platform** - Complete backend + frontend integration in a single production-ready workspace.

## ✨ Features

### 🎯 **Core Functionality**

- **AI Agents**: Content generation, SEO optimization, customer support
- **Campaign Management**: Multi-platform campaign orchestration
- **Analytics Dashboard**: Real-time performance metrics and insights
- **Copilot**: AI-powered reasoning engine and chat interface
- **Support System**: AI-driven customer support and ticket management

### 🔧 **Technical Stack**

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: tRPC, Prisma ORM, PostgreSQL
- **UI Components**: Radix UI, Shadcn/ui, Framer Motion
- **State Management**: React Query, Zustand
- **Testing**: Playwright, Jest
- **Development**: Hot reload, TypeScript strict mode

## 🏗️ **Architecture**

```
neonui0.3/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/trpc/[trpc]/   # tRPC API endpoints
│   │   ├── dashboard/         # Main dashboard
│   │   ├── agents/            # AI agents management
│   │   ├── campaigns/         # Campaign orchestration
│   │   ├── analytics/         # Performance metrics
│   │   ├── copilot/           # AI reasoning interface
│   │   └── support/           # Customer support
│   ├── lib/
│   │   ├── api/               # Backend API logic
│   │   │   ├── routers/       # tRPC routers
│   │   │   ├── trpc.ts        # tRPC configuration
│   │   │   └── root.ts        # Main router
│   │   ├── agents/            # AI agent registry
│   │   └── prisma.ts          # Database client
│   ├── components/            # Reusable UI components
│   └── utils/
│       └── trpc.ts            # tRPC client
├── prisma/
│   └── schema.prisma          # Database schema
└── package.json               # Dependencies & scripts
```

## 🚀 **Quick Start**

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key (optional)

### Installation

```bash
# Clone and enter directory
cd neonui0.3

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and API keys

# Set up database
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

### Access Points

- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:3000/api/trpc/health.check
- **Database Studio**: `npm run db:studio`

## 📊 **API Endpoints**

### Core Routes

- `GET /api/trpc/health.check` - API health status
- `GET /api/trpc/user.getProfile` - User profile
- `POST /api/trpc/support.generateReply` - AI support responses
- `GET /api/trpc/analytics.getOverview` - Analytics dashboard
- `POST /api/trpc/copilot.askCopilot` - AI reasoning engine

### Available Routers

- **health**: System health and status
- **user**: User management and profiles
- **support**: AI-powered customer support
- **analytics**: Performance metrics and insights
- **billing**: Subscription and payment management
- **copilot**: AI reasoning and chat interface
- **settings**: Application configuration
- **logs**: System and agent logging

## 🤖 **AI Agents**

### Registered Agents

1. **Content Agent** - Blog posts, social media content
2. **SEO Agent** - Keyword research, content optimization
3. **Support Agent** - Customer service, sentiment analysis

### Agent Capabilities

- Real-time content generation
- Multi-platform optimization
- Sentiment analysis and response generation
- Performance tracking and analytics

## 🔧 **Development**

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run type-check   # Run TypeScript checks
npm run lint         # Run ESLint
npm run test         # Run Playwright tests
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

### Environment Variables

```env
DATABASE_URL=postgresql://username:password@localhost:5432/neonhub
OPENAI_API_KEY=sk-your-openai-key
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

## 🧪 **Testing**

### Run Tests

```bash
npm run test         # Full test suite
npm run test:ui      # Interactive test UI
npm run test:headed  # Run with browser visible
```

### Test Coverage

- UI component testing
- API endpoint validation
- Agent functionality tests
- Performance metrics testing

## 📈 **Performance**

### Optimizations

- Server-side rendering (SSR)
- Static generation for marketing pages
- API response caching
- Image optimization
- Bundle splitting and lazy loading

### Monitoring

- Real-time performance metrics
- Error tracking and logging
- Agent execution monitoring
- Database query optimization

## 🔐 **Security**

### Features

- Input validation with Zod schemas
- CORS configuration
- Rate limiting
- Environment variable protection
- Secure API endpoints

## 🚀 **Deployment**

### Production Build

```bash
npm run build
npm start
```

### Environment Setup

1. Set production environment variables
2. Configure database connection
3. Set up monitoring and logging
4. Configure CDN for static assets

## 📝 **Contributing**

1. Create feature branch
2. Make changes with proper TypeScript types
3. Add tests for new functionality
4. Run type checking and linting
5. Submit pull request

## 🆘 **Support**

- **Issues**: Create GitHub issue
- **Documentation**: Check `/docs` directory
- **API Reference**: Visit `/api/trpc` endpoints
- **Database Schema**: Review `prisma/schema.prisma`

---

## 🔥 **Recent Updates**

### v1.0.0 - Unified Workspace

- ✅ Complete backend + frontend integration
- ✅ tRPC API with 8+ routers
- ✅ Prisma database integration
- ✅ AI agent registry system
- ✅ Real-time analytics dashboard
- ✅ Production-ready configuration
- ✅ Comprehensive testing suite
- ✅ TypeScript strict mode

**Ready for production deployment! 🚀**
