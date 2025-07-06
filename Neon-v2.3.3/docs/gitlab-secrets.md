# 🔐 GitLab Secrets Management for NeonHub

## Overview

This document outlines the secure management of environment variables and secrets in GitLab CI/CD for NeonHub, ensuring that existing critical credentials remain protected while allowing for safe addition of new platform settings.

## 🛡️ Protected Environment Variables

**⚠️ CRITICAL: These variables are already configured and should NEVER be modified or overwritten:**

### Authentication & Security
- `AUTH_SECRET` - NextAuth.js session secret
- `NEXTAUTH_SECRET` - NextAuth.js configuration secret
- `NEXTAUTH_URL` - Application URL for authentication callbacks

### AI Services
- `OPENAI_API_KEY` - OpenAI API key for AI agents
- `ANTHROPIC_API_KEY` - Anthropic Claude API key (if used)

### Database
- `DATABASE_URL` - PostgreSQL connection string
- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DB` - Database name

### Payment Processing
- `STRIPE_SECRET_KEY` - Stripe payment processing
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook verification

### Email Services
- `SENDGRID_API_KEY` - SendGrid email delivery
- `SENDGRID_FROM_EMAIL` - Verified sender email

### Messaging
- `TWILIO_AUTH_TOKEN` - Twilio WhatsApp messaging
- `TWILIO_ACCOUNT_SID` - Twilio account identifier

## 🔄 GitLab CI/CD Configuration

### Current Protected Variables
These variables are already configured in GitLab and should remain unchanged:

```yaml
# GitLab CI/CD Variables (Protected)
AUTH_SECRET: "[REDACTED]"
OPENAI_API_KEY: "[REDACTED]"
DATABASE_URL: "[REDACTED]"
STRIPE_SECRET_KEY: "[REDACTED]"
SENDGRID_API_KEY: "[REDACTED]"
TWILIO_AUTH_TOKEN: "[REDACTED]"
```

### Adding New Platform Settings Variables

When adding new non-sensitive platform configuration variables, follow these guidelines:

1. **Prefix with `NEON_`** to distinguish from critical credentials
2. **Use descriptive names** that clearly indicate their purpose
3. **Set as non-protected** unless they contain sensitive data
4. **Document in this file** for team visibility

#### Example New Variables (Safe to Add):

```yaml
# Platform Feature Flags
NEON_ENABLE_ANALYTICS: "true"
NEON_ENABLE_WHATSAPP_AGENT: "true"
NEON_ENABLE_BUDGET_TRACKING: "true"

# Webhook URLs (Non-sensitive)
NEON_WEBHOOK_NOTIFICATION_URL: "https://your-domain.com/webhook"
NEON_SLACK_WEBHOOK_URL: "https://hooks.slack.com/your-webhook"
NEON_DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/your-webhook"

# Brand Configuration
NEON_BRAND_PRIMARY_COLOR: "#3B82F6"
NEON_BRAND_SECONDARY_COLOR: "#1E40AF"

# Budget Settings
NEON_MONTHLY_BUDGET_LIMIT: "1000"
NEON_COST_ALERT_THRESHOLD: "800"
```

## 🔧 Environment Setup Instructions

### Development Environment

1. **Create `.env.local`** (never commit this file):
```bash
# Copy from .env.example
cp .env.example .env.local

# Edit with your development values
nano .env.local
```

2. **Use placeholder values for development**:
```bash
# Development placeholder values
DATABASE_URL="postgresql://postgres:password@localhost:5432/neonhub_dev"
AUTH_SECRET="dev-secret-key-minimum-32-characters"
OPENAI_API_KEY="sk-dev-placeholder-key"
```

### Production Environment

1. **GitLab CI/CD Variables** (Project → Settings → CI/CD → Variables)
2. **Mark sensitive variables as Protected and Masked**
3. **Use environment-specific values** (staging vs production)

## 🚀 Deployment Pipeline

### Environment Variable Loading Order

1. **GitLab CI/CD Variables** (highest priority)
2. **Container environment variables**
3. **Application defaults** (lowest priority)

### Safe Deployment Practices

```yaml
# .gitlab-ci.yml
deploy:
  stage: deploy
  script:
    # Verify critical variables exist without exposing values
    - echo "Verifying environment variables..."
    - test -n "$AUTH_SECRET" || (echo "AUTH_SECRET missing" && exit 1)
    - test -n "$DATABASE_URL" || (echo "DATABASE_URL missing" && exit 1)
    - test -n "$OPENAI_API_KEY" || (echo "OPENAI_API_KEY missing" && exit 1)
    
    # Deploy application
    - ./deploy.sh
  only:
    - main
    - develop
```

## 🔍 Security Best Practices

### Variable Management

1. **Never log sensitive values** in CI/CD output
2. **Use masked variables** for all secrets
3. **Rotate credentials regularly** (quarterly minimum)
4. **Audit variable access** through GitLab logs

### Access Control

1. **Maintainer-only access** to protected variables
2. **Separate staging/production** variable scopes
3. **Environment-specific** variable groups

### Monitoring

1. **Alert on variable changes** (GitLab webhooks)
2. **Track variable usage** in deployment logs
3. **Monitor for unauthorized access** attempts

## 📋 Variable Checklist

Before deploying, ensure:

- [ ] All protected variables are properly masked
- [ ] No sensitive data appears in CI/CD logs
- [ ] New variables follow naming conventions
- [ ] Documentation is updated for new variables
- [ ] Environment-specific values are correctly configured

## 🚨 Emergency Procedures

### If Credentials Are Compromised

1. **Immediately rotate affected credentials**
2. **Update GitLab CI/CD variables**
3. **Redeploy affected environments**
4. **Check logs for unauthorized usage**
5. **Notify team via Slack/email**

### Variable Recovery

1. **Check GitLab variable history**
2. **Restore from backup if available**
3. **Contact GitLab admin for audit logs**
4. **Document incident and lessons learned**

## 🔗 Related Documentation

- [Environment Setup Guide](./ENVIRONMENT_SETUP.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Security Guidelines](./SECURITY.md)
- [API Reference](./API_REFERENCE.md)

## 📞 Support

For questions about environment variable management:

1. **Development Team**: @dev-team
2. **DevOps Team**: @devops-team
3. **Security Team**: @security-team

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintained by**: NeonHub Platform Team
