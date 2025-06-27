# NeonHub Git Workflow Guide

## 🚀 Frontend & UI/UX Development Workflow

This document defines the optimal Git workflow for NeonHub's futuristic
AI-driven marketing dashboard, ensuring smooth collaboration between developers,
UI/UX designers, and AI agent systems.

## 📋 Table of Contents

- [Branching Strategy](#branching-strategy)
- [Environment Management](#environment-management)
- [Commit Conventions](#commit-conventions)
- [Development Workflow](#development-workflow)
- [Agent UI Synchronization](#agent-ui-synchronization)
- [Design System Coordination](#design-system-coordination)
- [Quality Gates](#quality-gates)
- [Deployment Process](#deployment-process)
- [Versioning Strategy](#versioning-strategy)
- [Troubleshooting](#troubleshooting)

## 🌳 Branching Strategy

### Core Branches

```
main (production)
├── develop (integration)
├── staging (pre-production)
└── feature/* (development)
    ├── ui/*
    ├── agent-ui/*
    ├── design-system/*
    └── hotfix/*
```

### Branch Types & Naming

| Branch Type      | Pattern                     | Purpose                    | Merges To          |
| ---------------- | --------------------------- | -------------------------- | ------------------ |
| `main`           | `main`                      | Production-ready code      | -                  |
| `develop`        | `develop`                   | Integration & testing      | `main`             |
| `staging`        | `staging`                   | Pre-production validation  | `main`             |
| `feature/`       | `feature/feature-name`      | General features           | `develop`          |
| `ui/`            | `ui/component-name`         | UI components & pages      | `develop`          |
| `agent-ui/`      | `agent-ui/agent-name`       | Agent interface updates    | `develop`          |
| `design-system/` | `design-system/update-name` | Design tokens & components | `develop`          |
| `hotfix/`        | `hotfix/issue-description`  | Critical production fixes  | `main` + `develop` |
| `release/`       | `release/v1.2.0`            | Release preparation        | `main`             |

### Branch Protection Rules

#### Main Branch

- ❌ Direct pushes blocked
- ✅ 2 required PR reviews
- ✅ Status checks: lint, test, build, e2e
- ✅ Dismiss stale reviews
- ✅ Code owner approval required

#### Develop Branch

- ❌ Direct pushes blocked
- ✅ 1 required PR review
- ✅ Status checks: lint, test, build
- ✅ Auto-merge when all checks pass

#### Staging Branch

- ❌ Direct pushes blocked
- ✅ 1 required PR review
- ✅ Status checks: lint, test, build, e2e, lighthouse
- ✅ Deploy to staging environment

## 🌍 Environment Management

### Environment Mapping

| Environment     | Branch              | Deployment     | URL                            |
| --------------- | ------------------- | -------------- | ------------------------------ |
| **Development** | `feature/*`, `ui/*` | Vercel Preview | `*-git-branch-name.vercel.app` |
| **Integration** | `develop`           | Auto-deploy    | `dev.neonhub.ai`               |
| **Staging**     | `staging`           | Auto-deploy    | `staging.neonhub.ai`           |
| **Production**  | `main`              | Manual trigger | `app.neonhub.ai`               |

### Environment Variables

```bash
# Development
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ENV=development

# Staging
NEXT_PUBLIC_API_URL=https://api-staging.neonhub.ai
NEXT_PUBLIC_ENV=staging

# Production
NEXT_PUBLIC_API_URL=https://api.neonhub.ai
NEXT_PUBLIC_ENV=production
```

## 📝 Commit Conventions

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Commit Types

| Type       | Description            | Example                                                  |
| ---------- | ---------------------- | -------------------------------------------------------- |
| `feat`     | New feature            | `feat(ui): add neon-glass card component`                |
| `fix`      | Bug fix                | `fix(agent-ui): correct ContentAgent loading animation`  |
| `ui`       | UI/UX changes          | `ui(dashboard): implement futuristic sidebar navigation` |
| `agent`    | Agent-related changes  | `agent(content): sync UI with ContentAgent API`          |
| `style`    | Code style changes     | `style(components): apply neon-glass theme tokens`       |
| `refactor` | Code refactoring       | `refactor(ui): optimize component performance`           |
| `test`     | Test additions/changes | `test(ui): add accessibility tests for components`       |
| `docs`     | Documentation          | `docs(workflow): update Git workflow guide`              |
| `build`    | Build system changes   | `build(storybook): add component documentation`          |
| `ci`       | CI/CD changes          | `ci(deploy): add staging environment pipeline`           |

### Scope Guidelines

| Scope           | Description                | Components                                        |
| --------------- | -------------------------- | ------------------------------------------------- |
| `ui`            | UI components & layouts    | `Button`, `Card`, `Modal`, `Layout`               |
| `agent-ui`      | Agent interface components | `AgentPanel`, `ContentEditor`, `MetricsDashboard` |
| `design-system` | Design tokens & theme      | CSS variables, theme tokens, utilities            |
| `dashboard`     | Main dashboard pages       | Analytics, campaigns, insights                    |
| `auth`          | Authentication UI          | Login, signup, profile                            |
| `mobile`        | Mobile-specific UI         | Responsive components, mobile views               |

### Examples

```bash
# ✅ Good commits
feat(ui): add glassmorphism effect to neon cards
fix(agent-ui): resolve TrendAgent chart rendering issue
ui(dashboard): implement animated campaign metrics
agent(content): sync ContentAgent with real-time editor
style(design-system): update neon-blue color tokens
test(ui): add visual regression tests for components

# ❌ Bad commits
update stuff
fix bug
ui changes
wip
```

## 🔄 Development Workflow

### 1. Starting New Work

```bash
# Sync with latest changes
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b ui/neon-analytics-dashboard

# Start development
npm run dev
```

### 2. Development Process

```bash
# Make changes and commit frequently
git add .
git commit -m "feat(ui): add analytics chart component"

# Sync with develop regularly
git fetch origin
git rebase origin/develop

# Push to remote
git push origin ui/neon-analytics-dashboard
```

### 3. Pull Request Process

1. **Create PR** to `develop` branch
2. **PR Template** automatically includes:
   - 📝 Description of changes
   - 🎨 UI/UX impact assessment
   - 🤖 Agent integration notes
   - 📱 Responsive design checklist
   - ♿ Accessibility compliance
   - 🧪 Testing checklist

3. **Automated Checks**:
   - ✅ Lint & format
   - ✅ TypeScript compilation
   - ✅ Unit tests
   - ✅ Build verification
   - ✅ Visual regression tests
   - ✅ Accessibility audit

4. **Vercel Preview** deployed automatically

5. **Code Review** by team members

6. **Merge** after approval

## 🤖 Agent UI Synchronization

### Agent Integration Workflow

```typescript
// Agent UI sync protocol
interface AgentUISync {
  agentType: 'ContentAgent' | 'TrendAgent' | 'SupportAgent';
  uiComponents: string[];
  syncPoints: {
    data: 'real-time' | 'polling' | 'webhook';
    ui: 'immediate' | 'debounced' | 'scheduled';
  };
  fallbackBehavior: 'loading' | 'cached' | 'error';
}
```

### Sync Guidelines

1. **Real-time Updates**: Use WebSocket for live agent data
2. **Loading States**: Always show loading indicators during agent operations
3. **Error Handling**: Graceful degradation when agents are unavailable
4. **Caching**: Cache agent responses for offline functionality
5. **Debugging**: Log all agent-UI interactions for debugging

### Agent-Specific UI Patterns

| Agent        | UI Pattern          | Components                        | Sync Method        |
| ------------ | ------------------- | --------------------------------- | ------------------ |
| ContentAgent | Live editor         | `ContentEditor`, `PreviewPane`    | WebSocket          |
| TrendAgent   | Animated charts     | `TrendChart`, `PredictiveOverlay` | Polling (5s)       |
| SupportAgent | Chat interface      | `ChatBot`, `TicketPanel`          | WebSocket          |
| MetricAgent  | Real-time dashboard | `MetricCards`, `AlertBanner`      | Server-Sent Events |

## 🎨 Design System Coordination

### Component Library Structure

```
packages/design-system/
├── tokens/
│   ├── colors.ts          # Neon color palette
│   ├── spacing.ts         # Spacing scale
│   ├── typography.ts      # Font definitions
│   └── effects.ts         # Glassmorphism effects
├── components/
│   ├── Button/
│   ├── Card/
│   ├── Modal/
│   └── AgentPanel/
└── themes/
    ├── neon-dark.ts       # Default theme
    └── neon-light.ts      # Light variant
```

### Design Token Management

```typescript
// Design tokens with strict typing
export const tokens = {
  colors: {
    neon: {
      blue: '#00D4FF',
      purple: '#8B5CF6',
      green: '#10B981',
    },
    glass: {
      bg: 'rgba(17, 25, 40, 0.75)',
      border: 'rgba(255, 255, 255, 0.18)',
    },
  },
  effects: {
    glassmorphism: 'backdrop-blur-md bg-opacity-75',
    neonGlow: 'shadow-lg shadow-neon-blue/25',
  },
} as const;
```

### Conflict Prevention

1. **Token Versioning**: Use semantic versioning for design tokens
2. **Migration Scripts**: Automated token updates across components
3. **Component Isolation**: Each component owns its specific styles
4. **Global Theme**: Only shared tokens in global theme
5. **Visual Regression**: Automated screenshot testing

## 🔍 Quality Gates

### Pre-commit Hooks

```bash
# Runs on every commit
- Lint staged files (ESLint)
- Format code (Prettier)
- Type check (TypeScript)
- Run affected tests
- Validate commit message
```

### Pre-push Hooks

```bash
# Runs before push
- Full type check
- All tests pass
- Build verification
- Bundle size analysis
- Accessibility audit
```

### CI/CD Pipeline

```yaml
# GitHub Actions pipeline
stages:
  - install # Dependencies
  - lint # ESLint + Prettier
  - type-check # TypeScript
  - test # Unit + Integration
  - build # Next.js build
  - e2e # Playwright tests
  - lighthouse # Performance audit
  - storybook # Component docs
  - deploy # Environment deployment
```

## 🚀 Deployment Process

### Staging Deployment

```bash
# Automatic on merge to staging
git checkout staging
git merge develop
git push origin staging
# ✅ Auto-deploys to staging.neonhub.ai
```

### Production Deployment

```bash
# Create release branch
git checkout -b release/v1.2.0
git merge staging

# Update version
npm version minor
git commit -am "chore: bump version to v1.2.0"

# Create PR to main
# After approval and merge:
git tag v1.2.0
git push origin v1.2.0
# ✅ Triggers production deployment
```

### Rollback Procedure

```bash
# Emergency rollback
git checkout main
git revert HEAD
git push origin main
# ✅ Automatic rollback deployment
```

## 📦 Versioning Strategy

### Component Library Versioning

```json
{
  "name": "@neonhub/design-system",
  "version": "1.2.3",
  "exports": {
    "./components": "./dist/components/index.js",
    "./tokens": "./dist/tokens/index.js",
    "./themes": "./dist/themes/index.js"
  }
}
```

### Release Types

| Type      | Version       | Trigger          | Example           |
| --------- | ------------- | ---------------- | ----------------- |
| **Major** | 1.0.0 → 2.0.0 | Breaking changes | New design system |
| **Minor** | 1.0.0 → 1.1.0 | New features     | New components    |
| **Patch** | 1.0.0 → 1.0.1 | Bug fixes        | Component fixes   |

### Auto-versioning

```bash
# Semantic release based on commits
feat: ✅ minor version bump
fix: ✅ patch version bump
BREAKING CHANGE: ✅ major version bump
```

## 🔧 Troubleshooting

### Common Issues

| Issue                                | Solution                                                        |
| ------------------------------------ | --------------------------------------------------------------- |
| **Merge conflicts in design tokens** | Use `npm run tokens:migrate`                                    |
| **Agent UI out of sync**             | Check WebSocket connection, restart dev server                  |
| **Build failures**                   | Run `npm run clean && npm install`                              |
| **Failed pre-push hooks**            | Fix issues individually with `npm run lint:fix`, `npm run test` |
| **Storybook build errors**           | Update component stories, check imports                         |

### Debug Commands

```bash
# Check workspace health
npm run workspace:validate

# Debug agent connections
npm run debug:agents

# Analyze bundle size
npm run analyze:bundle

# Test accessibility
npm run test:a11y

# Generate component docs
npm run storybook:build
```

## 📚 Additional Resources

- [Component Library Documentation](./storybook-docs.md)
- [Agent Integration Guide](./agent-integration.md)
- [Design System Guidelines](./design-system.md)
- [Performance Optimization](./performance.md)
- [Accessibility Standards](./accessibility.md)

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: NeonHub Development Team
