# ⚡ Reis Deployment - Quick Start Guide

**For experienced developers — minimal steps to get live.**

---

## Pre-Deployment (15 minutes)

### 1. Hostinger Setup
```bash
# cPanel → Node.js Selector → Create App (20.x)
# cPanel → Databases → Create MySQL DB
# cPanel → Security → SSL/TLS → AutoSSL both domains
# cPanel → Zone Editor → Point DNS to server IP

# Save credentials:
# DATABASE_URL=mysql://u123_reis:PASSWORD@localhost:3306/u123_u123_reis_db
# JWT_SECRET=[generate 3x with: node -e "...randomBytes(48).toString('hex')"]
```

### 2. SSH Access
```bash
ssh u123@your-hostinger-server.com
mkdir -p ~/public_html/api
cd ~/public_html/api
git clone https://github.com/YOUR_REPO.git .
```

---

## Backend Deploy (5 minutes)

```bash
cd ~/public_html/api/backend

# Install & build
npm install --production
npm run build

# Setup env (cPanel Node.js App → Environment Variables)
# NODE_ENV=production
# DATABASE_URL=mysql://...
# JWT_SECRET=...
# CORS_ORIGIN=https://reis-sg.online
# PAYPAL_MODE=live
# PAYPAL_CLIENT_ID=...
# PAYPAL_CLIENT_SECRET=...
# R2_ACCOUNT_ID=...
# etc.

# Database
npx prisma migrate deploy

# Start
npm install -g pm2
pm2 start dist/index.js --name "reis-api"
pm2 save
pm2 startup

# Verify
pm2 status
curl http://localhost:3000/api/v1/health
```

---

## Frontend Deploy (3 minutes)

```bash
# Local machine
cd frontend
npm run build

# Upload to server
rsync -avz --progress dist/ u123@server:/home/u123/public_html/

# Or via File Manager (cPanel):
# - Upload dist/ contents to public_html/
# - Ensure index.html is in /public_html root

# Verify SPA routing
# - Create .htaccess in public_html/ (copy from repo root)
# - Test: https://reis-sg.online/ (any route should work)
```

---

## Verification (2 minutes)

```bash
# Frontend
curl -I https://reis-sg.online
# Expected: 200 OK, Content-Type: text/html

# API
curl https://api.reis-sg.online/api/v1/health
# Expected: 200 OK, JSON response

# Database
mysql -u u123_reis -p u123_u123_reis_db
mysql> SHOW TABLES;
mysql> exit;
```

---

## Deployment Complete ✅

| Component | Status | URL |
|-----------|--------|-----|
| Frontend | ✅ | https://reis-sg.online |
| Backend API | ✅ | https://api.reis-sg.online/api/v1 |
| Database | ✅ | MySQL on Hostinger |
| SSL | ✅ | AutoSSL enabled |

---

## Ongoing Deployments

### Backend Update
```bash
cd ~/public_html/api
git pull origin main
cd backend && npm install && npm run build
npx prisma migrate deploy
pm2 restart reis-api
```

### Frontend Update (local)
```bash
cd frontend && npm run build
rsync -avz --delete dist/ u123@server:/home/u123/public_html/
```

---

## Emergency

```bash
# Restart backend
pm2 restart reis-api

# View logs
pm2 logs reis-api

# Rollback last commit
cd ~/public_html/api && git reset --hard HEAD~1 && npm run build && pm2 restart reis-api

# Database backup
mysqldump -u u123_reis -p u123_u123_reis_db > backup.sql
```

---

## Key Files

- **Deployment guide:** `DEPLOYMENT.md`
- **Complete checklist:** `DEPLOYMENT_CHECKLIST.md`
- **Deploy scripts:** `scripts/deploy-backend.sh` & `scripts/deploy-frontend.sh`
- **SPA routing:** `.htaccess` (copy to `public_html/`)
- **Backend env:** `backend/.env.production` (cPanel management)
- **Frontend env:** `frontend/.env.production` (build-time)

---

**Status:** 🚀 Ready to deploy  
**Time to live:** ~25 minutes  
**Questions?** See `DEPLOYMENT.md` for detailed guide
