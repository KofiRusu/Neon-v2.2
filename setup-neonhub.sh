#!/bin/bash

# NeonHub AI Marketing Platform - Complete Setup Script
# This script sets up the entire platform with backend and frontend integration

set -e

echo "🚀 NeonHub AI Marketing Platform Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    log_success "Node.js $(node --version) detected"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    log_success "npm $(npm --version) detected"
}

# Install root dependencies
install_root_deps() {
    log_info "Installing root dependencies..."
    npm install
    log_success "Root dependencies installed"
}

# Setup backend API
setup_backend() {
    log_info "Setting up backend API..."
    
    cd apps/api
    log_info "Installing API dependencies..."
    npm install
    
    # Generate Prisma client if schema exists
    if [ -f "../../packages/data-model/prisma/schema.prisma" ]; then
        log_info "Generating Prisma client..."
        cd ../../packages/data-model
        npm install
        npx prisma generate
        cd ../../apps/api
    fi
    
    log_success "Backend API setup complete"
    cd ../..
}

# Setup v0-integration frontend
setup_frontend() {
    log_info "Setting up v0-integration frontend..."
    
    cd v0-integration
    log_info "Installing frontend dependencies..."
    npm install
    
    log_info "Building frontend..."
    npm run build
    
    log_success "v0-integration frontend setup complete"
    cd ..
}

# Setup packages
setup_packages() {
    log_info "Setting up packages..."
    
    # Core agents
    if [ -d "packages/core-agents" ]; then
        log_info "Setting up core-agents..."
        cd packages/core-agents
        npm install
        npm run build
        cd ../..
    fi
    
    # Data model
    if [ -d "packages/data-model" ]; then
        log_info "Setting up data-model..."
        cd packages/data-model
        npm install
        npm run build
        cd ../..
    fi
    
    # Utils
    if [ -d "packages/utils" ]; then
        log_info "Setting up utils..."
        cd packages/utils
        npm install
        npm run build
        cd ../..
    fi
    
    # Types
    if [ -d "packages/types" ]; then
        log_info "Setting up types..."
        cd packages/types
        npm install
        npm run build
        cd ../..
    fi
    
    log_success "Packages setup complete"
}

# Create environment files
setup_env() {
    log_info "Setting up environment files..."
    
    # Root .env
    if [ ! -f ".env" ]; then
        cp env.example .env 2>/dev/null || log_warning "env.example not found, skipping root .env"
    fi
    
    # API .env
    if [ ! -f "apps/api/.env" ] && [ -f "apps/api/.env.example" ]; then
        cp apps/api/.env.example apps/api/.env
    fi
    
    # Frontend .env
    if [ ! -f "v0-integration/.env.local" ]; then
        cat > v0-integration/.env.local << EOL
NEXT_PUBLIC_API_URL=http://localhost:3001
API_PORT=3001
EOL
    fi
    
    log_success "Environment files created"
}

# Start development servers
start_dev_servers() {
    log_info "Starting development servers..."
    
    # Create a simple start script
    cat > start-dev.sh << 'EOL'
#!/bin/bash

echo "🚀 Starting NeonHub Development Servers"

# Start API server in background
echo "Starting API server on port 3001..."
cd apps/api && npm run dev &
API_PID=$!

# Start frontend server in background  
echo "Starting frontend server on port 3002..."
cd ../../v0-integration && npm run dev &
FRONTEND_PID=$!

echo "✅ Servers started!"
echo "🔗 Frontend: http://localhost:3002"
echo "🔗 API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to handle cleanup
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $API_PID $FRONTEND_PID 2>/dev/null || true
    echo "Servers stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for servers
wait
EOL
    
    chmod +x start-dev.sh
    log_success "Development start script created (start-dev.sh)"
}

# Main setup function
main() {
    log_info "Starting NeonHub setup process..."
    
    check_node
    check_npm
    
    install_root_deps
    setup_packages
    setup_backend
    setup_frontend
    setup_env
    start_dev_servers
    
    echo ""
    echo "🎉 NeonHub AI Marketing Platform Setup Complete!"
    echo "==============================================="
    echo ""
    echo "📋 Next Steps:"
    echo "1. Run './start-dev.sh' to start development servers"
    echo "2. Open http://localhost:3002 for the frontend"
    echo "3. API will be available at http://localhost:3001"
    echo ""
    echo "📚 Documentation:"
    echo "- Frontend: v0-integration/ (Next.js + tRPC)"
    echo "- Backend: apps/api/ (tRPC + Prisma)"
    echo "- Components: v0-integration/src/components/"
    echo ""
    echo "🔧 Development Commands:"
    echo "- Frontend: cd v0-integration && npm run dev"
    echo "- Backend: cd apps/api && npm run dev"
    echo "- Build: npm run build (in respective directories)"
    echo ""
    log_success "Setup completed successfully!"
}

# Run main setup
main 