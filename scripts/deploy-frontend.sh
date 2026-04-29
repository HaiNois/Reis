#!/bin/bash
# ============================================================================
# Reis Frontend Deployment Script
# Usage (local machine): bash scripts/deploy-frontend.sh
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
FRONTEND_DIR="$(pwd)/frontend"
DEPLOY_HOST="${DEPLOY_HOST:-u123@your-server.com}"
DEPLOY_PATH="/home/u123/public_html"
DEPLOY_METHOD="${DEPLOY_METHOD:-rsync}"  # rsync or scp

echo -e "${YELLOW}🚀 Starting Reis Frontend Deployment...${NC}"
echo "Frontend directory: $FRONTEND_DIR"
echo "Deploy to: $DEPLOY_HOST:$DEPLOY_PATH"
echo "Method: $DEPLOY_METHOD"
echo ""

# ============================================================================
# Step 1: Verify frontend directory
# ============================================================================
if [ ! -d "$FRONTEND_DIR" ]; then
  echo -e "${RED}❌ Frontend directory not found: $FRONTEND_DIR${NC}"
  exit 1
fi

cd "$FRONTEND_DIR"
echo -e "${GREEN}✓ Frontend directory found${NC}"

# ============================================================================
# Step 2: Install dependencies
# ============================================================================
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# ============================================================================
# Step 3: Build for production
# ============================================================================
echo -e "${YELLOW}🔨 Building for production...${NC}"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
  echo -e "${YELLOW}⚠️  .env.production not found, using .env${NC}"
  cp .env .env.production
fi

npm run build

if [ ! -d "dist" ]; then
  echo -e "${RED}❌ Build failed: dist/ directory not found${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Build completed${NC}"
echo "  Build size: $(du -sh dist | cut -f1)"

# ============================================================================
# Step 4: Deploy to server
# ============================================================================
echo -e "${YELLOW}📤 Deploying to server...${NC}"

if [ "$DEPLOY_METHOD" = "rsync" ]; then
  echo "Using rsync..."
  rsync -avz --progress --delete dist/ "$DEPLOY_HOST:$DEPLOY_PATH/" || {
    echo -e "${RED}❌ Rsync failed${NC}"
    exit 1
  }
elif [ "$DEPLOY_METHOD" = "scp" ]; then
  echo "Using SCP..."
  scp -r dist/* "$DEPLOY_HOST:$DEPLOY_PATH/" || {
    echo -e "${RED}❌ SCP failed${NC}"
    exit 1
  }
else
  echo -e "${RED}❌ Invalid deploy method: $DEPLOY_METHOD${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Files uploaded successfully${NC}"

# ============================================================================
# Step 5: Verify deployment
# ============================================================================
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"

# Extract host and user for connection test
HOST=$(echo "$DEPLOY_HOST" | cut -d@ -f2)
USER=$(echo "$DEPLOY_HOST" | cut -d@ -f1)

echo "Testing SSH connection..."
ssh -o ConnectTimeout=10 "$DEPLOY_HOST" ls -la "$DEPLOY_PATH/index.html" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Deployment verified${NC}"
else
  echo -e "${RED}⚠️  Could not verify deployment via SSH${NC}"
  echo "Please check manually:"
  echo "  ssh $DEPLOY_HOST ls -la $DEPLOY_PATH/"
fi

# ============================================================================
# Step 6: Cache busting (optional)
# ============================================================================
echo -e "${YELLOW}🔄 Clearing server cache...${NC}"

ssh "$DEPLOY_HOST" "bash -c '
  # Clear common cache locations if they exist
  rm -f /home/$USER/public_html/.htaccess.cache 2>/dev/null || true

  # Restart PHP if caching
  service php-fpm reload 2>/dev/null || true

  echo \"Cache cleared\"
'" || echo "Note: Some cache commands may not be available"

echo -e "${GREEN}✓ Cache operations completed${NC}"

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${GREEN}✅ Frontend deployment completed!${NC}"
echo ""
echo "Summary:"
echo "  - Build directory: $FRONTEND_DIR/dist"
echo "  - Deployed to: $DEPLOY_HOST:$DEPLOY_PATH"
echo "  - Method: $DEPLOY_METHOD"
echo ""
echo "Next steps:"
echo "  1. Open https://reis-sg.online in your browser"
echo "  2. Clear browser cache (Ctrl+Shift+Delete)"
echo "  3. Check browser console for errors (F12)"
echo "  4. Verify API calls to /api/v1/* or https://api.reis-sg.online/api/v1/*"
echo ""
echo "To deploy again:"
echo "  bash scripts/deploy-frontend.sh"
echo ""
