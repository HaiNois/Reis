---
name: hostinger-deploy
description: Deploy applications to Hostinger Business web hosting. Use this skill when the user mentions deploying to Hostinger, uploading to Hostinger, Hostinger Business setup, deploying Node.js backend or React frontend on Hostinger, Hostinger deployment, or setting up production environment on Hostinger Business plan. Triggers on phrases like "deploy to Hostinger", "Hostinger Business", "upload to Hostinger", "Hostinger deployment", "cPanel Node.js", "Hostinger VPS", "production deploy on Hostinger".
---

# Hostinger Business Deployment Guide

Hostinger Business là shared hosting với **cPanel** và hỗ trợ **Node.js**.

## Đặc điểm Hostinger Business

- **cPanel** control panel
- **Node.js Selector** - chọn phiên bản Node.js
- **SSH Access** - có thể bật trong cPanel
- **PostgreSQL** - Database wizard trong cPanel
- **SSL Free** - Let's Encrypt qua cPanel
- **File Manager** - upload files trực tiếp

## Deployment Options

### Option A: Git Deployment (Khuyến nghị)

#### 1. Setup Git Repository on Hostinger
- Login cPanel → **Git™ Version Control** → Create
- Repository path: `/home/username/reis-backend`
- Clone URL: sẽ cung cấp

#### 2. Clone Repository via SSH
```bash
ssh username@your-server
cd ~/reis-backend
git clone https://github.com/your-repo.git .
```

#### 3. Setup Node.js Application
```bash
# Mở Node.js Selector trong cPanel
# Chọn phiên bản Node.js (20.x)

# Install dependencies
npm install

# Build
npm run build

# Setup environment
cp .env.example .env
nano .env  # Edit production values

# Run migrations
npx prisma migrate deploy

# Start app với PM2
npm install -g pm2
pm2 start dist/index.js --name "reis-api"
pm2 save
```

### Option B: File Manager Upload

#### Backend
1. **cPanel → File Manager**
2. Navigate to `public_html` or create folder `api`
3. Upload và unzip backend code
4. **Terminal (cPanel → Advanced → Terminal)** hoặc SSH

```bash
cd ~/api
npm install
npm run build
cp .env.example .env
# Edit .env
npx prisma migrate deploy
pm2 start dist/index.js --name "reis-api"
```

#### Frontend Build locally
```bash
# Local machine
cd frontend
npm run build
# Upload dist/ folder contents via File Manager
```

### Option C: Git Auto-Deploy

#### Setup Post-Receive Hook
```bash
# On Hostinger via SSH
cd ~/reis-backend
mkdir -p .githooks

cat > .githooks/post-receive << 'EOF'
#!/bin/bash
git --work-tree=$HOME/reis-backend checkout -f
cd $HOME/reis-backend
npm install
npm run build
pm2 restart reis-api
EOF

chmod +x .githooks/post-receive
```

## Database Setup (PostgreSQL)

### Create Database via cPanel
1. **cPanel → Databases → PostgreSQL® Databases**
2. Create database: `reis_db`
3. Create user và gán quyền
4. Note connection string

### Connection String
```env
DATABASE_URL=postgresql://username_db:password@localhost:5434/reis_db
```

## Environment Variables Production

```env
# Backend .env - Hostinger Business
NODE_ENV=production
PORT=3000

# Database (từ cPanel PostgreSQL)
DATABASE_URL=postgresql://username_db:password@localhost:5434/reis_db

# JWT
JWT_SECRET=your-production-secret-min-32-chars
JWT_ACCESS_SECRET=access-production-secret
JWT_REFRESH_SECRET=refresh-production-secret

# CORS - Domain của bạn
CORS_ORIGIN=https://yourdomain.com

# PayPal (live)
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=your-live-client-id
PAYPAL_CLIENT_SECRET=your-live-secret

# R2/CDN
R2_PUBLIC_URL=https://pub.yourdomain.com
```

## Node.js Application Setup

### Setup via cPanel
1. **cPanel → Setup Node.js App**
2. Click **Create Application**
3. Configure:
   - **App root**: `/home/username/reis-backend`
   - **App startup file**: `dist/index.js`
   - **Application mode**: Production
   - **Node.js version**: 20.x

4. **Environment Variables** → Add từng biến

### Or via Terminal/SSH
```bash
# Check Node.js
node --version
npm --version

# Navigate to app
cd ~/reis-backend

# Install dependencies
npm install

# Build
npm run build

# Environment
cp .env.example .env
nano .env

# Database migrate
npx prisma migrate deploy

# Start with PM2
npm install -g pm2
pm2 start dist/index.js --name "reis-api"
pm2 save
pm2 startup  # Setup init script
```

## Frontend Deployment

### Build locally
```bash
# Update frontend/.env
VITE_API_URL=https://api.yourdomain.com/api/v1

npm run build
```

### Upload via File Manager
1. **cPanel → File Manager**
2. Navigate to `public_html`
3. Upload contents của `dist/` folder

### Hoặc upload qua SSH
```bash
# Local
rsync -avz --progress dist/ username@your-server:/home/username/public_html/
```

## Domain & SSL Setup

### Point Domain
1. **cPanel → Domains → Zone Editor**
2. Add A record: `@ → server-ip`
3. Add CNAME: `www → @`

### Enable SSL
1. **cPanel → Security → SSL/TLS**
2. Click **Install SSL Certificate** on your domain
3. Hoặc dùng **Let's Encrypt AutoSSL** (tự động)

## Nginx Configuration (nếu có VPS features)

Nếu Hostinger Business có proxy features:
```
# Frontend: public_html/
# Backend API: Node.js app

# API Proxy qua .htaccess (Apache)
RewriteEngine On
RewriteRule ^api/(.*)$ http://localhost:3000/$1 [P,L]
```

Hoặc setup reverse proxy trong cPanel (nếu có Nginx features).

## Troubleshooting

### App không chạy
```bash
# Check PM2
pm2 status
pm2 logs reis-api

# Check port
lsof -i :3000

# Restart
pm2 restart reis-api
```

### Database connection failed
- Verify DATABASE_URL trong cPanel
- Check PostgreSQL service đang chạy
- Verify credentials

### SSL Certificate Issue
- AutoSSL trong cPanel → Enable
- Hoặc manual install qua SSL/TLS page

## Checklist Deploy

- [ ] SSH Access enabled (cPanel → Terminal)
- [ ] Node.js version selected (cPanel Node.js Selector)
- [ ] PostgreSQL database created
- [ ] Backend code uploaded/clone
- [ ] Environment variables configured
- [ ] `npm install` & `npm run build`
- [ ] Database migrations run
- [ ] PM2 setup for persistence
- [ ] Domain pointed to server
- [ ] SSL certificate installed
- [ ] Test API: `https://api.yourdomain.com/api/v1/products`
- [ ] Test Frontend: `https://yourdomain.com`

## Quick Deploy Commands

```bash
# 1. SSH vào server
ssh username@your-server

# 2. Navigate
cd ~/reis-backend

# 3. Pull latest
git pull origin main

# 4. Install & Build
npm install
npm run build

# 5. Update env
nano .env

# 6. Migrate DB
npx prisma migrate deploy

# 7. Restart
pm2 restart reis-api

# 8. Check
pm2 status
curl localhost:3000/api/v1/health
```
