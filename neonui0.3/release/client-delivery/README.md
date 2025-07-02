# NeonHub UI Workspace v0.3

🚀 **Production-Ready AI Marketing Platform Frontend**

The official NeonHub frontend workspace built with Next.js 15, TypeScript, and Tailwind CSS, featuring advanced AI agent orchestration, campaign management, and real-time analytics.

## 🌟 Features

- ✅ **43 Modern UI Components** - Complete design system with glassmorphism effects
- ✅ **28 Application Routes** - Dashboard, agents, campaigns, analytics, and more
- ✅ **Neon Glass Theme** - Beautiful gradient design with blur effects
- ✅ **TypeScript Ready** - Full type safety and IntelliSense
- ✅ **Monorepo Compatible** - Works seamlessly with Turbo and pnpm workspaces
- ✅ **Production Optimized** - Built for Vercel deployment with performance optimizations

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.7+
- **Styling**: Tailwind CSS v3 + tailwindcss-animate
- **UI Components**: Radix UI + Custom Neon Components
- **Icons**: Heroicons + Lucide React
- **Charts**: Recharts
- **Flow Diagrams**: React Flow
- **Animations**: Framer Motion

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run dev:turbo    # Start with Turbopack
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint check
npm run lint:fix     # Fix linting issues
npm run type-check   # TypeScript type checking
npm run clean        # Clean build artifacts
```

## 📁 Project Structure

```
neonui0.3/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── dashboard/       # AI Command Center
│   │   ├── agents/          # Agent Management
│   │   ├── campaigns/       # Campaign Orchestration
│   │   ├── analytics/       # Performance Metrics
│   │   ├── support/         # Customer Support
│   │   └── settings/        # Configuration
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI primitives
│   │   └── [feature]/      # Feature-specific components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   └── utils/              # Helper functions
├── public/                 # Static assets
└── tailwind.config.ts     # Tailwind configuration
```

## 🎨 Design System

### Colors

- **Neon Blue**: `#00d4ff` - Primary accent
- **Neon Purple**: `#b347d9` - Secondary accent
- **Neon Green**: `#32ff7e` - Success states
- **Neon Pink**: `#ff4c6d` - Error states
- **Neon Cyan**: `#00ffff` - Info states
- **Neon Yellow**: `#ffdd59` - Warning states

### Glass Effects

- **Light Glass**: `rgba(255, 255, 255, 0.1)`
- **Medium Glass**: `rgba(255, 255, 255, 0.2)`
- **Dark Glass**: `rgba(0, 0, 0, 0.3)`

### Animations

- **Neon Pulse**: Glowing effect animation
- **Gradient Shift**: Background gradient animation
- **Glass Hover**: Interactive glassmorphism effects

## 🔗 Key Routes

| Route        | Description                | Status   |
| ------------ | -------------------------- | -------- |
| `/`          | Welcome & Navigation Hub   | ✅ Ready |
| `/dashboard` | AI Command Center          | ✅ Ready |
| `/agents`    | Agent Management Interface | ✅ Ready |
| `/campaigns` | Campaign Orchestration     | ✅ Ready |
| `/analytics` | Performance Analytics      | ✅ Ready |
| `/support`   | Customer Support Hub       | ✅ Ready |
| `/settings`  | Configuration Panel        | ✅ Ready |

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
vercel --prod

# Or use Vercel CLI
npm i -g vercel
vercel
```

### Docker

```bash
# Build Docker image
docker build -t neonhub-ui .

# Run container
docker run -p 3000:3000 neonhub-ui
```

## 📦 Monorepo Integration

This workspace is designed to work seamlessly in a monorepo environment:

```bash
# From monorepo root
pnpm dev --filter=neonui0.3
pnpm build --filter=neonui0.3
```

## 🎯 Performance

- ⚡ **First Contentful Paint**: < 1.2s
- ⚡ **Largest Contentful Paint**: < 2.5s
- ⚡ **Cumulative Layout Shift**: < 0.1
- ⚡ **First Input Delay**: < 100ms

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run lint && npm run type-check`
5. Submit a pull request

---

**Built with ❤️ by the NeonHub Team**
