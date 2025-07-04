# 🔐 GitLab CI/CD Environment Variables Configuration

This document provides comprehensive guidance for configuring environment variables in GitLab for the NeonHub CI/CD pipeline.

## 📍 **Where to Configure Variables**

Navigate to your GitLab project:

```
GitLab → Project → Settings → CI/CD → Variables
```

## 🛡️ **Security Guidelines**

- **Always mask sensitive variables** (API keys, tokens, passwords)
- **Use protected variables** for production secrets
- **Never commit secrets** to version control
- **Rotate secrets regularly** (every 90 days recommended)
- **Use environment-specific variables** when possible

## 📋 **Required Environment Variables**

### **Core Application Variables**

| Variable             | Description                    | Masked? | Protected? | Example Value                                       |
| -------------------- | ------------------------------ | ------- | ---------- | --------------------------------------------------- |
| `OPENAI_API_KEY`     | OpenAI API key for AI services | ✅      | ✅         | `sk-proj-...`                                       |
| `STRIPE_SECRET_KEY`  | Stripe secret key for payments | ✅      | ✅         | `sk_test_...`                                       |
| `SENDGRID_API_KEY`   | SendGrid API key for email     | ✅      | ✅         | `SG.AbCdEf...`                                      |
| `TWILIO_AUTH_TOKEN`  | Twilio authentication token    | ✅      | ✅         | `your-twilio-token`                                 |
| `VERCEL_DEPLOY_HOOK` | Vercel deployment webhook URL  | ✅      | ✅         | `https://api.vercel.com/v1/integrations/deploy/...` |

### **Database & Authentication**

| Variable          | Description                               | Masked? | Protected? | Example Value                                  |
| ----------------- | ----------------------------------------- | ------- | ---------- | ---------------------------------------------- |
| `DATABASE_URL`    | PostgreSQL database connection string     | ✅      | ✅         | `postgresql://user:pass@host:5432/db`          |
| `REDIS_URL`       | Redis cache connection string             | ✅      | ✅         | `redis://user:pass@host:6379`                  |
| `NEXTAUTH_SECRET` | NextAuth.js secret for session encryption | ✅      | ✅         | `J0BfoOwAuhbkJS128JM9W2CKWgjxfhsNzsTwe0MLiDA=` |
| `NEXTAUTH_URL`    | NextAuth.js callback URL                  | ❌      | ✅         | `https://your-domain.com`                      |

### **Additional Services**

| Variable              | Description                       | Masked? | Protected? | Example Value                          |
| --------------------- | --------------------------------- | ------- | ---------- | -------------------------------------- |
| `ANTHROPIC_API_KEY`   | Anthropic Claude API key          | ✅      | ✅         | `sk-ant-...`                           |
| `SLACK_WEBHOOK_URL`   | Slack webhook for notifications   | ✅      | ❌         | `https://hooks.slack.com/...`          |
| `DISCORD_WEBHOOK_URL` | Discord webhook for notifications | ✅      | ❌         | `https://discord.com/api/webhooks/...` |
| `SENTRY_DSN`          | Sentry error tracking DSN         | ✅      | ❌         | `https://...@sentry.io/...`            |

### **Development & Configuration**

| Variable               | Description           | Masked? | Protected? | Example Value                           |
| ---------------------- | --------------------- | ------- | ---------- | --------------------------------------- |
| `NODE_ENV`             | Node.js environment   | ❌      | ❌         | `production`                            |
| `VERCEL_URL`           | Vercel deployment URL | ❌      | ❌         | `https://neonhub-production.vercel.app` |
| `SITE_URL`             | Primary site URL      | ❌      | ❌         | `https://your-domain.com`               |
| `MONTHLY_BUDGET_LIMIT` | Monthly spend limit   | ❌      | ❌         | `1000`                                  |

## 🔧 **Step-by-Step Setup Guide**

### **1. Access GitLab Variables**

1. Go to your GitLab project
2. Navigate to **Settings** → **CI/CD**
3. Expand the **Variables** section
4. Click **Add variable**

### **2. Configure Each Variable**

For each variable in the table above:

1. **Key**: Enter the exact variable name (e.g., `OPENAI_API_KEY`)
2. **Value**: Enter the actual value (e.g., `sk-proj-xyz123...`)
3. **Type**: Leave as "Variable" (default)
4. **Environment scope**:
   - Use `*` for all environments
   - Use `production` for production-only variables
5. **Flags**:
   - ✅ **Protect variable**: For production secrets
   - ✅ **Mask variable**: For sensitive data
   - ❌ **Expand variable reference**: Usually not needed

### **3. Variable Naming Convention**

- Use **UPPER_CASE** with underscores
- Be descriptive and consistent
- Group related variables with prefixes (e.g., `STRIPE_*`, `TWILIO_*`)

### **4. Testing Variables**

After setup, test in a pipeline:

```bash
# In your .gitlab-ci.yml
test:variables:
  script:
    - echo "Testing environment variables..."
    - test -n "$OPENAI_API_KEY" && echo "✅ OpenAI API key configured"
    - test -n "$STRIPE_SECRET_KEY" && echo "✅ Stripe secret key configured"
    - test -n "$SENDGRID_API_KEY" && echo "✅ SendGrid API key configured"
```

## 🚀 **Production-Specific Variables**

### **Protected Variables**

Set these variables with the **"Protect variable"** flag enabled:

- `STRIPE_SECRET_KEY`
- `OPENAI_API_KEY`
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `VERCEL_DEPLOY_HOOK`

### **Environment Scoping**

Use environment-specific variables for:

- `DATABASE_URL` (different for dev/staging/prod)
- `NEXTAUTH_URL` (different domains)
- `VERCEL_DEPLOY_HOOK` (different deployment targets)

## 🔍 **Security Best Practices**

### **Variable Security Checklist**

- [ ] All API keys are masked
- [ ] Production secrets are protected
- [ ] No secrets in repository code
- [ ] Regular secret rotation scheduled
- [ ] Audit log monitoring enabled
- [ ] Least privilege access granted

### **Emergency Procedures**

If a secret is compromised:

1. **Immediately rotate** the secret at the provider
2. **Update GitLab variable** with new value
3. **Trigger new pipeline** to deploy with new secret
4. **Audit access logs** for unauthorized usage
5. **Document incident** for security review

## 📊 **Monitoring & Alerts**

### **Variable Usage Tracking**

Monitor which variables are used in pipelines:

- Check pipeline logs for variable references
- Set up alerts for failed variable access
- Regular audit of unused variables

### **Cost Monitoring**

For API services with usage-based pricing:

- Set up billing alerts at the provider level
- Monitor usage via `MONTHLY_BUDGET_LIMIT`
- Regular review of API usage patterns

## 🎯 **Troubleshooting**

### **Common Issues**

| Problem                      | Solution                                     |
| ---------------------------- | -------------------------------------------- |
| `Variable not found`         | Check variable name spelling and case        |
| `Permission denied`          | Verify variable is not protected for branch  |
| `Webhook failed`             | Check `VERCEL_DEPLOY_HOOK` URL format        |
| `Database connection failed` | Verify `DATABASE_URL` format and credentials |

### **Debugging Commands**

```bash
# Check if variable is available (without revealing value)
test -n "$VARIABLE_NAME" && echo "Variable is set" || echo "Variable is missing"

# List all environment variables (be careful with sensitive data)
env | grep -E '^(OPENAI|STRIPE|SENDGRID|TWILIO|VERCEL)' | cut -d'=' -f1
```

## 📚 **Additional Resources**

- [GitLab CI/CD Variables Documentation](https://docs.gitlab.com/ee/ci/variables/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Security Best Practices](https://docs.gitlab.com/ee/ci/variables/#cicd-variable-security)

---

**⚠️ Important**: Never share this configuration with unauthorized personnel. Treat all masked variables as highly sensitive information.

**🔄 Last Updated**: Configure variables immediately after project setup and before first pipeline execution.
