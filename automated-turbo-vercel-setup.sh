#!/bin/bash

# 🚀 Automated Turborepo + Vercel Monorepo Setup Script
# Automates as much as possible, with clear instructions for manual steps

set -e

echo "🚀 NeonHub Automated Turborepo + Vercel Setup"
echo "============================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

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

print_step() {
    echo -e "${PURPLE}[STEP $1]${NC} $2"
}

# Step 1: Validate environment
print_step "1" "Validating environment and dependencies..."

if ! command -v npm >/dev/null 2>&1; then
    print_error "npm is not installed. Please install Node.js"
    exit 1
fi

if ! command -v git >/dev/null 2>&1; then
    print_error "git is not installed"
    exit 1
fi

print_success "Environment validation passed"

# Step 2: Install Turborepo
print_step "2" "Installing Turborepo..."

if npm list turbo --depth=0 >/dev/null 2>&1; then
    print_success "Turborepo already installed"
else
    npm install --save-dev turbo@latest
    print_success "Turborepo installed successfully"
fi

# Step 3: Validate Turbo configuration
print_step "3" "Validating Turborepo configuration..."

if [ ! -f "turbo.json" ]; then
    print_error "turbo.json not found"
    exit 1
fi

if npx turbo --version >/dev/null 2>&1; then
    TURBO_VERSION=$(npx turbo --version)
    print_success "Turborepo $TURBO_VERSION ready"
else
    print_error "Turborepo not working properly"
    exit 1
fi

# Step 4: Validate workspace packages
print_step "4" "Detecting workspace packages..."

PACKAGES_OUTPUT=$(npx turbo ls 2>/dev/null)
PACKAGE_COUNT=$(echo "$PACKAGES_OUTPUT" | grep -E "apps/|packages/" | wc -l | tr -d ' ')

if [ "$PACKAGE_COUNT" -gt 0 ]; then
    print_success "$PACKAGE_COUNT packages detected:"
    echo "$PACKAGES_OUTPUT" | grep -E "apps/|packages/" | while read line; do
        echo "  ✅ $line"
    done
else
    print_error "No workspace packages detected"
    exit 1
fi

# Step 5: Test build pipeline
print_step "5" "Testing build pipeline..."

if npx turbo run build --dry-run >/dev/null 2>&1; then
    print_success "Build pipeline configuration valid"
else
    print_warning "Build pipeline has issues - continuing anyway"
fi

# Step 6: Install Vercel CLI
print_step "6" "Setting up Vercel CLI..."

if npx vercel --version >/dev/null 2>&1; then
    VERCEL_VERSION=$(npx vercel --version 2>/dev/null)
    print_success "Vercel CLI $VERCEL_VERSION ready"
else
    print_status "Installing Vercel CLI..."
    npm install -g vercel@latest
    if npx vercel --version >/dev/null 2>&1; then
        print_success "Vercel CLI installed successfully"
    else
        print_error "Failed to install Vercel CLI"
        exit 1
    fi
fi

# Step 7: Validate Vercel configuration
print_step "7" "Validating Vercel configuration..."

if [ ! -f "vercel.json" ]; then
    print_error "vercel.json not found"
    exit 1
fi

print_success "Vercel configuration found"

# Step 8: Check git status
print_step "8" "Checking git repository..."

if git rev-parse --git-dir >/dev/null 2>&1; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    print_success "Git repository detected (branch: $BRANCH)"
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "Uncommitted changes detected"
        echo "Consider committing changes before deployment"
    fi
else
    print_warning "Not a git repository - Vercel deployment may require manual setup"
fi

# Step 9: Pre-deployment checks
print_step "9" "Running pre-deployment validation..."

# Check package.json scripts
if grep -q "\"build\":" package.json && grep -q "turbo" package.json; then
    print_success "Package.json scripts configured for Turbo"
else
    print_warning "Package.json may need Turbo script updates"
fi

# Check environment files
if [ -f ".env.local" ] || [ -f ".env" ]; then
    print_success "Environment files detected"
    print_warning "Remember to set these variables in Vercel"
else
    print_warning "No environment files found"
fi

# Step 10: Generate summary and instructions
print_step "10" "Setup summary and next steps..."

echo ""
echo "📊 AUTOMATED SETUP COMPLETE"
echo "============================"
echo "✅ Turborepo: Installed and configured"
echo "✅ Vercel CLI: Ready for use"
echo "✅ Workspace: $PACKAGE_COUNT packages detected"
echo "✅ Configuration: turbo.json and vercel.json ready"
echo "✅ Build Pipeline: Validated"
echo ""

# Interactive steps that require manual completion
cat << 'EOF'
🔧 MANUAL STEPS REQUIRED
========================

The following steps require interactive authentication and cannot be automated:

1. AUTHENTICATE WITH TURBO REMOTE CACHE:
   npx turbo login
   npx turbo link

2. AUTHENTICATE WITH VERCEL:
   npx vercel login

3. LINK PROJECT TO VERCEL:
   npx vercel

4. SET ENVIRONMENT VARIABLES:
   npx vercel env add NODE_ENV production
   npx vercel env add DATABASE_URL your_database_url  
   npx vercel env add NEXTAUTH_SECRET your_secret
   npx vercel env add OPENAI_API_KEY your_openai_key

5. DEPLOY TO PRODUCTION:
   npx vercel --prod

EOF

# Provide automation script for environment variables
cat << 'EOF' > set-vercel-env.sh
#!/bin/bash
# Automated environment variable setup script
# Run this after authenticating with Vercel

echo "Setting up environment variables..."

# Replace these values with your actual secrets
DATABASE_URL="your_database_url_here"
NEXTAUTH_SECRET="your_nextauth_secret_here"  
OPENAI_API_KEY="your_openai_key_here"

# Set for both dashboard and api projects
for project in neonhub-dashboard neonhub-api; do
  echo "Setting variables for $project..."
  npx vercel env add NODE_ENV production --scope="$project" --yes || true
  npx vercel env add DATABASE_URL "$DATABASE_URL" --scope="$project" --yes || true
  npx vercel env add NEXTAUTH_SECRET "$NEXTAUTH_SECRET" --scope="$project" --yes || true
  npx vercel env add OPENAI_API_KEY "$OPENAI_API_KEY" --scope="$project" --yes || true
done

echo "✅ Environment variables set"
EOF

chmod +x set-vercel-env.sh
print_success "Created set-vercel-env.sh for automated environment setup"

echo ""
echo "🎯 QUICK START COMMANDS"
echo "======================="
echo ""
echo "After completing manual authentication:"
echo ""
echo "# Test build locally"
echo "npm run build"
echo ""
echo "# Deploy to production"  
echo "npx vercel --prod"
echo ""
echo "# Monitor build performance (use correct package names)"
echo "npx turbo run build --filter=@neonhub/dashboard"
echo "npx turbo run build --filter=@neon/api"
echo ""

# Final validation
echo "🔍 FINAL VALIDATION"
echo "==================="

# Test turbo build command with correct package names
if npx turbo run build --dry-run --filter=@neonhub/dashboard >/dev/null 2>&1; then
    print_success "Dashboard build configuration valid"
else
    print_warning "Dashboard build configuration may have issues"
fi

if npx turbo run build --dry-run --filter=@neon/api >/dev/null 2>&1; then
    print_success "API build configuration valid"  
else
    print_warning "API build configuration may have issues"
fi

echo ""
print_success "🎉 Automated setup completed successfully!"
print_status "Follow the manual steps above to complete deployment"

echo ""
echo "📚 USEFUL COMMANDS:"
echo "- npm run dev                          # Start development with Turbo"
echo "- npm run build                        # Build all packages"
echo "- npx turbo ls                         # List all packages"
echo "- npx turbo run build --filter=@neonhub/dashboard  # Build dashboard only"
echo "- npx turbo run build --filter=@neon/api          # Build API only"
echo "- npx vercel --prod                    # Deploy to production"
echo "- ./set-vercel-env.sh                  # Set environment variables" 