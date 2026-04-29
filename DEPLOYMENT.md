# 🚀 Reis Deployment Guide - Hostinger Business (cPanel)

## Overview
- **Frontend**: React (Vite) → `public_html/`
- **Backend**: Node.js (Express) → Hostinger Node.js App with PM2
- **Database**: MySQL 8.0 (Hostinger)
- **Domain**: `reis-sg.online` (frontend) + `api.reis-sg.online` (backend via reverse proxy)

---

## PHASE 1: Server Setup (One-time)

### 1.1 SSH Access & Terminal
```bash
# cPanel → Advanced → Terminal
# Or SSH:
ssh u123@your-hostinger-server.com
```

### 1.2 Create MySQL Database

**Via cPanel:**
1. Go to **Databases → MySQL Databases**
2. Create database: `u123_reis_db`
3. Create user: `u123_reis` with strong password
4. Grant ALL privileges

**Save connection string:**
```
DATABASE_URL=mysql://u123_reis:YOUR_PASSWORD@localhost:3306/u123_reis_db
```

### 1.3 Enable Node.js App (cPanel)

1. **cPanel → Node.js Selector**
2. Click **Create Application**
3. Set Node.js version: **20.x** (or latest)
4. Click **Back** to see your app

### 1.4 Setup Git Repository on Server

```bash
# SSH into server
ssh u123@your-server.com

# Create directory
mkdir -p ~/public_html/api
cd ~/public_html/api

# Initialize bare repo or clone
git clone https://github.com/YOUR_GITHUB_REPO.git .
```

---

## PHASE 2: Backend Deployment

### 2.1 Install Dependencies & Build

```bash
cd ~/public_html/api/backend

# Install ALL dependencies (including TypeScript, Prisma CLI)
# DON'T use --production flag, we need devDependencies for build
npm install

# Build TypeScript
npm run build

# Verify dist/ exists
ls dist/
```

### 2.2 Setup Environment Variables (cPanel)

**Via cPanel → Setup Node.js App:**
1. Select your app
2. Click **Environment Variables**
3. Add each variable:

```
NODE_ENV          = production
PORT              = 3000
DATABASE_URL      = mysql://u123_reis:PASSWORD@localhost:3306/u123_reis_db
JWT_SECRET        = [64 hex chars — use: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"]
JWT_ACCESS_SECRET = [64 hex chars]
JWT_REFRESH_SECRET= [64 hex chars]
CORS_ORIGIN       = https://reis-sg.online
PAYPAL_MODE       = live
PAYPAL_CLIENT_ID  = [from PayPal]
PAYPAL_CLIENT_SECRET=[from PayPal]
PAYPAL_WEBHOOK_ID = [from PayPal]
R2_ACCOUNT_ID     = [from Cloudflare]
R2_ACCESS_KEY_ID  = [from Cloudflare]
R2_SECRET_ACCESS_KEY=[from Cloudflare]
R2_BUCKET_NAME    = reis-official
R2_PUBLIC_URL     = [your R2 URL]
GHTK_API_TOKEN    = [if using GHTK shipping]
```

### 2.3 Database Migrations

```bash
cd ~/public_html/api

# Run Prisma migrations
npx prisma migrate deploy

# Check migrations applied
npx prisma db execute --stdin < prisma/schema.prisma
```

### 2.4 Start Application with PM2

```bash
# Install PM2 globally (one-time)
npm install -g pm2

# Start app
pm2 start dist/index.js --name "reis-api"

# Save PM2 config for restart on server reboot
pm2 save
pm2 startup
```

**Verify:**
```bash
# Check status
pm2 status

# Check logs
pm2 logs reis-api

# Test endpoint
curl http://localhost:3000/api/v1/health
```

---

## PHASE 3: Frontend Deployment

### 3.1 Build Frontend Locally

```bash
# On your local machine
cd frontend

# Update .env.production with:
VITE_API_URL=https://api.reis-sg.online/api/v1
VITE_APP_URL=https://reis-sg.online

# Build
npm run build

# dist/ folder is ready
```

### 3.2 Upload to public_html

**Option A: Via File Manager (easiest)**
1. cPanel → **File Manager**
2. Navigate to `/home/u123/public_html`
3. Upload `dist/` folder contents

**Option B: Via SSH/rsync (fastest)**
```bash
# From local machine
rsync -avz --progress frontend/dist/ user@server:/home/u123/public_html/

# Or SCP
scp -r frontend/dist/* u123@server:/home/u123/public_html/
```

### 3.3 Create .htaccess for SPA Routing

**Create `/public_html/.htaccess`:**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Skip if file or directory exists
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Rewrite all to index.html for SPA
  RewriteRule ^(.*)$ index.html [L]
</IfModule>
```

---

## PHASE 4: Domain & SSL Setup

### 4.1 Point Domain to Server

**Via Domain Registrar (or cPanel Zone Editor):**
1. Add A record: `@ → server-ip`
2. Add CNAME: `www → @`
3. Add CNAME: `api → @` (or A record with same IP)

### 4.2 Enable SSL Certificates

**cPanel → Security → SSL/TLS:**
1. Click **Install SSL Certificate** on `reis-sg.online`
2. Use **AutoSSL** (free Let's Encrypt)
3. Repeat for `api.reis-sg.online`

**Wait 5-10 minutes for SSL to activate.**

---

## PHASE 5: Reverse Proxy Setup (API Routing)

Since backend Node.js runs on `:3000` but frontend is `public_html/`, we need routing.

### Option A: Proxy via .htaccess (Recommended)

**In `/public_html/.htaccess`, add:**
```apache
# Proxy /api/* to localhost:3000
<IfModule mod_proxy.c>
  ProxyPreserveHost On
  ProxyPassMatch ^/api/(.*) http://localhost:3000/api/$1
  ProxyPassReverse ^/api/(.*) http://localhost:3000/api/$1
</IfModule>
```

### Option B: Subdomain Proxy (If available in cPanel)

1. Create addon domain `api.reis-sg.online` → points to `/home/u123/public_html/api`
2. cPanel auto-routes requests

### Option C: Update CORS in Backend

If using subdomain, update backend env:
```
CORS_ORIGIN=https://api.reis-sg.online
```

---

## Testing & Verification

### 4.1 Test Backend

```bash
# SSH into server
ssh u123@server.com

# Test local endpoint
curl http://localhost:3000/api/v1/health

# Test from outside (via subdomain or reverse proxy)
curl https://api.reis-sg.online/api/v1/health
curl https://reis-sg.online/api/v1/health  # if proxied
```

### 4.2 Test Frontend

```bash
# Open browser
https://reis-sg.online

# Check console for any CORS errors
# Verify API calls to /api/v1/* or https://api.reis-sg.online/api/v1/*
```

### 4.3 Database Verification

```bash
# SSH into server, then:
mysql -u u123_reis -p u123_reis_db

# List tables
SHOW TABLES;
SHOW TABLE STATUS;
```

---

## Continuous Deployment (Automated)

### 5.1 Git Post-Receive Hook

**Create `/home/u123/public_html/api/.git/hooks/post-receive`:**

```bash
#!/bin/bash
set -e

DEPLOY_DIR="/home/u123/public_html/api"
cd $DEPLOY_DIR

echo "🔄 Fetching latest code..."
git fetch origin

echo "📦 Installing dependencies..."
npm install --production

echo "🔨 Building TypeScript..."
npm run build

echo "🗄️  Running migrations..."
npx prisma migrate deploy

echo "🚀 Restarting PM2 app..."
pm2 restart reis-api

echo "✅ Deployment complete!"
```

**Make executable:**
```bash
chmod +x /home/u123/public_html/api/.git/hooks/post-receive
```

### 5.2 Frontend Auto-Deploy

**Create deploy script locally:**

```bash
#!/bin/bash
# deploy-frontend.sh

echo "Building frontend..."
cd frontend
npm run build

echo "Uploading to Hostinger..."
rsync -avz --delete dist/ u123@server:/home/u123/public_html/

echo "✅ Frontend deployed!"
```

---

## Troubleshooting

### Backend not responding
```bash
# Check PM2 status
pm2 status
pm2 logs reis-api

# Restart
pm2 kill
pm2 start dist/index.js --name "reis-api"
```

### Database connection error
```bash
# Verify credentials
mysql -u u123_reis -p

# Check .env DATABASE_URL format
# Should be: mysql://username:password@localhost:3306/dbname
```

### CORS errors
- Check `CORS_ORIGIN` env var matches frontend domain
- Verify backend is running on correct port

### Static files 404
- Verify `.htaccess` is in `public_html/`
- Check SPA routing rewrite rule

### SSL certificate not working
- Wait 10-15 minutes for AutoSSL to activate
- Check domain A record points to server IP
- cPanel → Security → SSL/TLS → Verify status

---

## Maintenance & Monitoring

### 6.1 View Logs

```bash
# Backend logs
pm2 logs reis-api

# Database queries (if enabled)
tail -f /var/log/mysql/query.log

# System logs
tail -f /var/log/error_log
```

### 6.2 Database Backups

```bash
# Export database
mysqldump -u u123_reis -p u123_reis_db > reis_backup.sql

# Download via File Manager
# /home/u123/reis_backup.sql
```

### 6.3 Update Code

```bash
cd ~/public_html/api

git pull origin main
npm install
npm run build
npx prisma migrate deploy
pm2 restart reis-api
```

---

## Quick Checklist ✅

- [ ] SSH access enabled
- [ ] MySQL database created (u123_reis_db)
- [ ] Node.js version selected (20.x)
- [ ] Backend code cloned to ~/public_html/api
- [ ] npm install & npm run build successful
- [ ] .env variables added to cPanel Node.js App settings
- [ ] Database migrations deployed (npx prisma migrate deploy)
- [ ] PM2 started with pm2 start dist/index.js
- [ ] Frontend built and uploaded to public_html/
- [ ] .htaccess created for SPA routing
- [ ] Domain A records point to server IP
- [ ] SSL certificates installed (AutoSSL)
- [ ] API endpoints responding (curl test)
- [ ] Frontend loads without 404s
- [ ] CORS configured correctly

---

## Emergency Recovery

### Rollback Backend

```bash
cd ~/public_html/api
git reset --hard HEAD~1
npm run build
npx prisma migrate resolve --rolled-back [migration-name]
pm2 restart reis-api
```

### Restore Database

```bash
mysql -u u123_reis -p u123_reis_db < reis_backup.sql
```

---

## Support

For Hostinger-specific issues:
- **cPanel Documentation**: https://docs.cpanel.net/
- **Node.js on cPanel**: Search "cPanel Node.js Selector"
- **MySQL**: cPanel → Databases → MySQL Databases

For code issues:
- Check backend logs: `pm2 logs reis-api`
- Check frontend browser console
- Review `.env` variables match schema requirements
