#!/bin/bash

# NeonHub v2.1 Vercel Deployment Script with Stripe Billing Integration
# Automated deployment with environment validation and billing setup

set -e  # Exit on error

echo "🚀 NeonHub v2.1 Deployment Starting..."
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

# Check if we're in production mode
PRODUCTION=${1:-false}
if [ "$PRODUCTION" = "--production" ] || [ "$PRODUCTION" = "-p" ]; then
    PRODUCTION=true
    echo -e "${YELLOW}⚠️  Production deployment mode enabled${NC}"
else
    PRODUCTION=false
    echo -e "${BLUE}🔧 Preview deployment mode${NC}"
fi

echo ""
echo "📋 Pre-deployment Checklist"
echo "============================================="

# 1. Check for required environment variables
echo "🔍 Checking environment variables..."
REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "OPENAI_API_KEY"
    "STRIPE_SECRET_KEY"
    "STRIPE_PUBLISHABLE_KEY"
    "STRIPE_WEBHOOK_SECRET"
)

missing_vars=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: Missing environment variables:${NC}"
    for var in "${missing_vars[@]}"; do
        echo -e "   - ${var}"
    done
    echo -e "${BLUE}💡 These will need to be set in Vercel dashboard${NC}"
fi

# 2. Validate package dependencies
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "🔄 Installing dependencies..."
    pnpm install
fi

# 3. Run quality checks
echo "🔍 Running quality checks..."
echo "   - Linting code..."
pnpm run lint --silent || echo -e "${YELLOW}⚠️  Lint warnings found${NC}"

echo "   - Type checking..."
pnpm run type-check --silent || echo -e "${YELLOW}⚠️  Type errors found${NC}"

echo "   - Running tests..."
pnpm run test --passWithNoTests --silent || echo -e "${YELLOW}⚠️  Test issues found${NC}"

# 4. Build applications
echo "🏗️  Building applications..."
echo "   - Building dashboard..."
cd apps/dashboard && pnpm run build && cd ../..

echo "   - Building API..."
cd apps/api && pnpm run build && cd ../..

# 5. Database preparation
echo "🗄️  Preparing database..."
echo "   - Generating Prisma client..."
pnpm run db:generate

if [ "$PRODUCTION" = true ]; then
    echo "   - Running database migrations..."
    pnpm run db:migrate:deploy
else
    echo "   - Pushing database schema..."
    pnpm run db:push
fi

# 6. Stripe setup validation
echo "💳 Validating Stripe integration..."
if [ -n "$STRIPE_SECRET_KEY" ]; then
    echo "   ✅ Stripe secret key configured"
else
    echo -e "   ${YELLOW}⚠️  Stripe secret key missing${NC}"
fi

if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
    echo "   ✅ Stripe webhook secret configured"
else
    echo -e "   ${YELLOW}⚠️  Stripe webhook secret missing${NC}"
fi

# 7. Deploy to Vercel
echo ""
echo "🚀 Deploying to Vercel..."
echo "============================================="

if command -v vercel &> /dev/null; then
    if [ "$PRODUCTION" = true ]; then
        echo "🌍 Deploying to production..."
        vercel --prod --yes
    else
        echo "🔍 Deploying to preview..."
        vercel --yes
    fi
else
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
    
    if [ "$PRODUCTION" = true ]; then
        vercel --prod --yes
    else
        vercel --yes
    fi
fi

# 8. Post-deployment validation
echo ""
echo "✅ Post-deployment Validation"
echo "============================================="

# Wait a moment for deployment to propagate
sleep 5

# Get the deployment URL
DEPLOYMENT_URL=$(vercel ls --scope=neonhub | grep -E "https.*vercel\.app" | head -1 | awk '{print $2}')

if [ -n "$DEPLOYMENT_URL" ]; then
    echo "🌐 Deployment URL: $DEPLOYMENT_URL"
    
    # Health check
    echo "🔍 Running health check..."
    if curl -f "$DEPLOYMENT_URL/api/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API health check passed${NC}"
    else
        echo -e "${YELLOW}⚠️  API health check failed${NC}"
    fi
    
    # Stripe webhook validation
    echo "💳 Stripe webhook endpoint: $DEPLOYMENT_URL/api/stripe/webhooks"
    echo -e "${BLUE}💡 Remember to update your Stripe webhook URL!${NC}"
    
else
    echo -e "${YELLOW}⚠️  Could not determine deployment URL${NC}"
fi

# 9. Environment variable checklist
echo ""
echo "🔧 Environment Variables Checklist"
echo "============================================="
echo "Ensure these are set in Vercel dashboard:"
echo ""
echo "📊 Core Variables:"
echo "   DATABASE_URL"
echo "   NEXTAUTH_SECRET"
echo "   NEXTAUTH_URL"
echo "   OPENAI_API_KEY"
echo ""
echo "💳 Stripe Variables:"
echo "   STRIPE_SECRET_KEY"
echo "   STRIPE_PUBLISHABLE_KEY"
echo "   STRIPE_WEBHOOK_SECRET"
echo "   STRIPE_PRICE_ID_BASIC"
echo "   STRIPE_PRICE_ID_PRO"
echo "   STRIPE_PRICE_ID_ENTERPRISE"
echo ""
echo "📱 Advertising Variables:"
echo "   GOOGLE_ADS_DEVELOPER_TOKEN"
echo "   GOOGLE_ADS_CLIENT_ID"
echo "   GOOGLE_ADS_CLIENT_SECRET"
echo "   FACEBOOK_APP_ID"
echo "   FACEBOOK_APP_SECRET"
echo "   AD_BUDGET_LIMIT_DAILY"
echo "   AD_BUDGET_LIMIT_MONTHLY"
echo ""
echo "📧 Communication Variables:"
echo "   SENDGRID_API_KEY"
echo "   SENDGRID_FROM_EMAIL"
echo "   TWILIO_ACCOUNT_SID"
echo "   TWILIO_AUTH_TOKEN"

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "============================================="
echo "Next steps:"
echo "1. 🔧 Configure environment variables in Vercel dashboard"
echo "2. 💳 Set up Stripe webhook: $DEPLOYMENT_URL/api/stripe/webhooks"
echo "3. 📊 Monitor deployment at: https://vercel.com/dashboard"
echo "4. 🔍 Test billing functionality"
echo "5. 📱 Verify ad campaign integrations"
echo ""
echo -e "${BLUE}Happy deploying! 🚀${NC}" 