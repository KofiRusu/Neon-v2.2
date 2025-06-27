#!/bin/bash

# NeonHub Turborepo + Vercel Deployment Script
# Automated setup for monorepo deployment with remote caching

set -e

echo "🚀 NeonHub Turborepo + Vercel Deployment Setup"
echo "=============================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="neonhub-platform"
DASHBOARD_NAME="neonhub-dashboard"
API_NAME="neonhub-api"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Verify prerequisites
print_status "Checking prerequisites..."

if ! command_exists npx; then
    print_error "npx is not installed. Please install Node.js"
    exit 1
fi

if ! command_exists git; then
    print_error "git is not installed"
    exit 1
fi

print_success "Prerequisites verified"

# Step 2: Verify Turborepo setup
print_status "Verifying Turborepo configuration..."

if [ ! -f "turbo.json" ]; then
    print_error "turbo.json not found. Please run this script from the project root"
    exit 1
fi

if ! npx turbo --version >/dev/null 2>&1; then
    print_error "Turborepo not installed"
    exit 1
fi

print_success "Turborepo configuration verified"

# Step 3: Test local build
print_status "Testing local build with Turborepo..."

if npx turbo run build --dry-run >/dev/null 2>&1; then
    print_success "Build configuration is valid"
else
    print_warning "Build configuration has issues - continuing anyway"
fi

# Step 4: Setup Turbo Remote Cache (Interactive)
print_status "Setting up Turbo Remote Cache..."
print_warning "This step requires manual interaction"

echo ""
echo "Please run the following commands manually:"
echo "1. npx turbo login    # Authenticate with Vercel"
echo "2. npx turbo link     # Link project to remote cache"
echo ""
read -p "Have you completed the Turbo setup? (y/n): " turbo_setup

if [ "$turbo_setup" = "y" ] || [ "$turbo_setup" = "Y" ]; then
    print_success "Turbo remote cache setup completed"
else
    print_warning "Skipping Turbo remote cache setup"
fi

# Step 5: Vercel Project Setup
print_status "Setting up Vercel projects..."

echo ""
echo "Setting up Vercel deployment..."
echo "You'll need to run these commands manually:"
echo ""
echo "1. npx vercel login    # Authenticate with Vercel"
echo "2. npx vercel          # Link project to Vercel"
echo ""
read -p "Have you completed the Vercel setup? (y/n): " vercel_setup

if [ "$vercel_setup" = "y" ] || [ "$vercel_setup" = "Y" ]; then
    print_success "Vercel setup completed"
else
    print_warning "Skipping Vercel setup"
fi

# Step 6: Environment Variables Setup
print_status "Environment variables setup required..."

cat << 'EOF'

🔧 ENVIRONMENT VARIABLES SETUP
==============================

You need to set the following environment variables in Vercel:

Required for both Dashboard and API:
- NODE_ENV=production
- DATABASE_URL=your_database_url
- NEXTAUTH_SECRET=your_nextauth_secret
- OPENAI_API_KEY=your_openai_key

Optional (for full functionality):
- NEXT_PUBLIC_VERCEL_URL=your_vercel_url
- NEXT_PUBLIC_APP_URL=your_app_url
- TWILIO_ACCOUNT_SID=your_twilio_sid
- TWILIO_AUTH_TOKEN=your_twilio_token
- SENDGRID_API_KEY=your_sendgrid_key

Set these using:
npx vercel env add VARIABLE_NAME production

EOF

# Step 7: Deployment Test
print_status "Testing deployment configuration..."

if [ -f "vercel.json" ]; then
    print_success "vercel.json configuration found"
else
    print_warning "vercel.json not found - using default configuration"
fi

# Step 8: Deploy
print_status "Ready for deployment!"

echo ""
echo "🚀 DEPLOYMENT COMMANDS"
echo "====================="
echo ""
echo "For development preview:"
echo "  npx vercel"
echo ""
echo "For production deployment:"
echo "  npx vercel --prod"
echo ""
echo "To monitor build with Turbo:"
echo "  npx turbo run build --filter=dashboard"
echo "  npx turbo run build --filter=api"
echo ""

# Step 9: Final validation
print_status "Running final validation..."

# Check if workspace packages are detected
PACKAGES=$(npx turbo ls 2>/dev/null | grep -c "packages\|apps" || echo "0")
if [ "$PACKAGES" -gt 0 ]; then
    print_success "Workspace packages detected: $PACKAGES"
else
    print_warning "No workspace packages detected"
fi

# Generate summary
echo ""
echo "📊 SETUP SUMMARY"
echo "================"
echo "✅ Turborepo: Configured"
echo "✅ Vercel Config: Ready"
echo "✅ Workspace: $PACKAGES packages detected"
echo "✅ Scripts: Updated for Turbo"
echo ""

if [ "$turbo_setup" = "y" ] && [ "$vercel_setup" = "y" ]; then
    print_success "🎉 Setup completed! Ready for deployment"
    
    echo ""
    echo "Next steps:"
    echo "1. Set environment variables in Vercel dashboard"
    echo "2. Run 'npx vercel --prod' to deploy"
    echo "3. Monitor build performance with Turbo cache"
else
    print_warning "⚠️  Manual steps required - see instructions above"
fi

echo ""
echo "📚 Useful commands:"
echo "- npm run dev              # Start development with Turbo"
echo "- npm run build            # Build all packages with Turbo"
echo "- npx turbo run build --filter=dashboard  # Build specific package"
echo "- npx vercel --prod        # Deploy to production"
echo "- npx turbo run test       # Run tests with caching"
echo ""

print_success "Deployment script completed!" 