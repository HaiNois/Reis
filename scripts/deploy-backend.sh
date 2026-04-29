#!/bin/bash
# ============================================================================
# Reis Backend Deployment Script for Hostinger Business
# Usage: ssh u123@server && bash ./deploy-backend.sh
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="$HOME/public_html/api"
APP_NAME="reis-api"
BRANCH="main"

echo -e "${YELLOW}🚀 Starting Reis Backend Deployment...${NC}"
echo "Target directory: $DEPLOY_DIR"
echo "App name: $APP_NAME"
echo ""

# ============================================================================
# Step 1: Navigate to deployment directory
# ============================================================================
if [ ! -d "$DEPLOY_DIR" ]; then
  echo -e "${RED}❌ Directory not found: $DEPLOY_DIR${NC}"
  echo "Please clone the repository first:"
  echo "  mkdir -p $DEPLOY_DIR"
  echo "  cd $DEPLOY_DIR"
  echo "  git clone https://github.com/YOUR_REPO.git ."
  exit 1
fi

cd "$DEPLOY_DIR"
echo -e "${GREEN}✓ Changed directory to $DEPLOY_DIR${NC}"

# ============================================================================
# Step 2: Pull latest code
# ============================================================================
echo -e "${YELLOW}📥 Pulling latest code from $BRANCH...${NC}"
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH
echo -e "${GREEN}✓ Code pulled successfully${NC}"

# ============================================================================
# Step 3: Install dependencies
# ============================================================================
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
cd backend  # Since root directory is backend in the deployment
npm install --production
echo -e "${GREEN}✓ Dependencies installed${NC}"

# ============================================================================
# Step 4: Build TypeScript
# ============================================================================
echo -e "${YELLOW}🔨 Building TypeScript...${NC}"
npm run build

if [ ! -d "dist" ]; then
  echo -e "${RED}❌ Build failed: dist/ directory not found${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Build completed successfully${NC}"

# ============================================================================
# Step 5: Run database migrations
# ============================================================================
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Migration failed${NC}"
  echo "Rolling back PM2 app..."
  pm2 restart $APP_NAME || true
  exit 1
fi

echo -e "${GREEN}✓ Migrations completed${NC}"

# ============================================================================
# Step 6: Restart PM2 app
# ============================================================================
echo -e "${YELLOW}🚀 Restarting PM2 application...${NC}"

if pm2 list | grep -q "$APP_NAME"; then
  pm2 restart $APP_NAME
  echo -e "${GREEN}✓ App restarted${NC}"
else
  echo -e "${YELLOW}⚠️  App not running, starting new instance...${NC}"
  pm2 start dist/index.js --name "$APP_NAME"
  pm2 save
  echo -e "${GREEN}✓ App started${NC}"
fi

# ============================================================================
# Step 7: Verify deployment
# ============================================================================
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
sleep 2

if pm2 list | grep -q "$APP_NAME"; then
  STATUS=$(pm2 list | grep "$APP_NAME" | grep -o "online\|stopped\|errored" | head -1)
  if [ "$STATUS" = "online" ]; then
    echo -e "${GREEN}✓ App is running and healthy${NC}"
  else
    echo -e "${RED}❌ App status: $STATUS${NC}"
    pm2 logs $APP_NAME
    exit 1
  fi
else
  echo -e "${RED}❌ App not found in PM2${NC}"
  pm2 logs $APP_NAME
  exit 1
fi

# ============================================================================
# Step 8: Test endpoint
# ============================================================================
echo -e "${YELLOW}🧪 Testing API endpoint...${NC}"
RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/api/v1/health -o /dev/null)

if [ "$RESPONSE" = "200" ]; then
  echo -e "${GREEN}✓ API is responding correctly${NC}"
else
  echo -e "${YELLOW}⚠️  API returned status code: $RESPONSE${NC}"
  echo "This might be normal if the endpoint doesn't exist. Checking logs:"
  pm2 logs $APP_NAME --lines 10
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "Summary:"
echo "  - Code pulled from: $BRANCH"
echo "  - Built in: $DEPLOY_DIR/backend/dist"
echo "  - App running as: $APP_NAME"
echo ""
echo "Next steps:"
echo "  1. Verify frontend is updated (if changed)"
echo "  2. Test https://reis-sg.online in your browser"
echo "  3. Check logs if any issues: pm2 logs $APP_NAME"
echo ""
