# 🔐 GitLab CI/CD Environment Variables & Secrets

## Critical Production Secrets (DO NOT MODIFY)

⚠️ **WARNING**: The following secrets are critical for production operation and should NOT be modified without proper authorization:

### Core Authentication & Security
- `AUTH_SECRET` - NextAuth authentication secret
- `NEXTAUTH_SECRET` - NextAuth authentication secret (alternative naming)
- `JWT_SECRET` - JWT token signing secret

### API Keys & External Services
- `OPENAI_API_KEY` - OpenAI API access key
- `ANTHROPIC_API_KEY` - Anthropic (Claude) API access key
- `STRIPE_SECRET_KEY` - Stripe payment processing secret key
- `SENDGRID_API_KEY` - SendGrid email service API key
- `TWILIO_AUTH_TOKEN` - Twilio SMS/WhatsApp authentication token

### Database & Infrastructure
- `DATABASE_URL` - Primary database connection string
- `REDIS_URL` - Redis cache connection string
- `VERCEL_TOKEN` - Vercel deployment token

---

## New Platform Settings Variables

✅ **SAFE TO ADD**: The following variables can be safely added to manage platform features:

### Feature Flags
```bash
# Feature toggles for platform functionality
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_BUDGET_TRACKING=true
NEXT_PUBLIC_ENABLE_WHATSAPP_AGENT=true
NEXT_PUBLIC_ENABLE_SOCIAL_AGENTS=true
NEXT_PUBLIC_ENABLE_EMAIL_CAMPAIGNS=true
```

### Notification Webhooks
```bash
# External notification endpoints
WEBHOOK_NOTIFICATION_URL=https://your-webhook-endpoint.com/notify
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/WEBHOOK
TEAMS_WEBHOOK_URL=https://your-org.webhook.office.com/webhookb2/YOUR/WEBHOOK
```

### Visual & Branding Settings
```bash
# Brand customization
NEXT_PUBLIC_BRAND_PRIMARY_COLOR=#3B82F6
NEXT_PUBLIC_BRAND_SECONDARY_COLOR=#1E40AF
NEXT_PUBLIC_BRAND_ACCENT_COLOR=#10B981
NEXT_PUBLIC_COMPANY_NAME="Your Company Name"
NEXT_PUBLIC_SUPPORT_EMAIL=support@yourcompany.com
```

### Budget & Cost Management
```bash
# Budget configuration
MONTHLY_BUDGET_LIMIT=1000
COST_ALERT_THRESHOLD=800
BUDGET_CURRENCY=USD
COST_TRACKING_ENABLED=true
```

### Performance & Scaling
```bash
# Performance thresholds
SCALE_UP_CPU_THRESHOLD=80
SCALE_UP_MEMORY_THRESHOLD=85
SCALE_UP_RESPONSE_TIME_THRESHOLD=2000
HEALTH_CHECK_INTERVAL=300000
```

### Regional & Localization
```bash
# Regional settings
NEXT_PUBLIC_DEFAULT_REGION=UAE
NEXT_PUBLIC_DEFAULT_LANGUAGE=en
NEXT_PUBLIC_SUPPORTED_LANGUAGES=en,ar,fr
NEXT_PUBLIC_TIMEZONE=Asia/Dubai
```

---

## Platform Settings Management

### Database-Stored Settings
The new Platform Settings system stores non-sensitive configuration in the database through the `PlatformSetting` model:

```sql
-- Example platform settings
INSERT INTO platform_settings (key, value, category, readonly) VALUES
('ENABLE_ANALYTICS', 'true', 'feature-flags', false),
('WEBHOOK_NOTIFICATION_URL', 'https://your-webhook.com', 'webhooks', false),
('BRAND_PRIMARY_COLOR', '#3B82F6', 'branding', false),
('MONTHLY_BUDGET_LIMIT', '1000', 'budget', false);
```

### Protected Settings
Certain settings are marked as `readonly=true` to prevent modification through the admin interface:

- System-critical configurations
- Security-related settings
- Integration endpoints that require approval

---

## Safe Management Practices

### ✅ DO:
- Add new webhook URLs for notifications
- Modify feature flags and visual settings
- Update budget limits and thresholds
- Configure regional and language preferences
- Test new integrations in staging first

### ❌ DON'T:
- Modify core authentication secrets
- Change database connection strings without coordination
- Update API keys without proper key rotation procedures
- Remove critical environment variables
- Modify production secrets without approval

---

## Variable Addition Process

### 1. Non-Sensitive Settings
For feature flags, colors, and basic configuration:
```bash
# Add directly to GitLab CI/CD Variables
Settings → CI/CD → Variables → Add Variable
```

### 2. Webhook & Integration URLs
For external service webhooks:
```bash
# Verify endpoint security first
# Add with appropriate environment scope
# Test in staging environment
```

### 3. Sensitive Credentials
For API keys and secrets:
```bash
# Follow proper key rotation procedures
# Coordinate with DevOps team
# Update in all environments simultaneously
# Document in secure location
```

---

## Environment Scopes

### Production (`production`)
- All critical secrets and API keys
- Production database URLs
- Live webhook endpoints

### Staging (`staging`)
- Test API keys and sandbox credentials
- Staging database connections
- Development webhook endpoints

### Development (`development`)
- Local development overrides
- Mock service endpoints
- Debug flags and settings

---

## Monitoring & Alerts

### Setting Changes
- All production secret changes trigger alerts
- Staging changes require approval
- Development changes are logged

### Access Control
- Only authorized personnel can modify production secrets
- Platform settings can be managed by admin users
- Feature flags have separate permissions

---

## Backup & Recovery

### Critical Secrets
- Stored in secure key management system
- Backed up encrypted in multiple locations
- Recovery procedures documented separately

### Platform Settings
- Exported from database regularly
- Version controlled in configuration repository
- Can be restored from backup snapshots

---

## Troubleshooting

### Common Issues
1. **Setting not taking effect**: Check environment scope and restart application
2. **Permission denied**: Verify user has appropriate role and access
3. **Webhook not working**: Validate URL and check network access
4. **Feature flag ignored**: Ensure proper naming convention (NEXT_PUBLIC_ prefix for client-side)

### Support Contacts
- **Infrastructure Issues**: DevOps Team
- **Security Concerns**: Security Team  
- **Application Settings**: Development Team
- **Emergency Access**: On-call Engineer

---

## Recent Changes

### Added Variables (Safe)
- `WEBHOOK_NOTIFICATION_URL` - Centralized notification endpoint
- `NEXT_PUBLIC_ENABLE_*` - Feature flag series for platform features
- `BRAND_*_COLOR` - Visual branding customization
- `BUDGET_*` - Cost management and tracking

### Protected Variables (Do Not Modify)
- All `*_SECRET` and `*_KEY` variables
- Database connection strings
- Authentication tokens
- Core infrastructure credentials

---

**Last Updated**: 2024-01-01  
**Next Review**: Quarterly  
**Owner**: Platform Engineering Team