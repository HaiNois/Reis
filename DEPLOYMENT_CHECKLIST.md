# 🚀 Reis Hostinger Deployment - Complete Checklist

**Date:** 2026-04-29  
**Domain:** `reis-sg.online`  
**API Subdomain:** `api.reis-sg.online`  
**Database:** MySQL 8.0  
**cPanel User:** `u123` *(replace with your actual username)*

---

## PHASE 1: Pre-Deployment Setup (Hostinger cPanel)

### Hostinger Account & cPanel Access
- [ ] Login to Hostinger → **Dashboard**
- [ ] Go to **cPanel** → Bookmark it
- [ ] Enable **SSH Access** (if not enabled):
  - cPanel → **Advanced → Terminal** → Verify access works
  - Or enable SSH Key from **Security → SSH Access**

### Node.js Setup
- [ ] cPanel → **Node.js Selector**
- [ ] Click **Create Application**
- [ ] Set:
  - **Node.js version:** 20.x (latest stable)
  - Application path: (leave default or set to `/public_html/api`)
- [ ] Take note of the application ID/path

### MySQL Database Setup
- [ ] cPanel → **Databases → MySQL Databases**
- [ ] Create new database:
  - **Database name:** `u123_reis_db` *(auto-prefixed with username)*
  - Database is created as: `u123_u123_reis_db`
- [ ] Create MySQL user:
  - **Username:** `u123_reis` *(prefixed with username)*
  - **Password:** [Generate strong password 16+ chars]
  - Save password securely (LastPass, 1Password, etc.)
- [ ] Grant **ALL PRIVILEGES**:
  - Add user to database: `u123_reis_db`
  - Privileges: Check ALL boxes
- [ ] Get connection string:
  ```
  mysql://u123_reis:PASSWORD@localhost:3306/u123_u123_reis_db
  ```

### Domain & SSL Configuration
- [ ] **Add-On Domain** (if `api.reis-sg.online` is separate):
  - cPanel → **Addon Domains**
  - Domain: `api.reis-sg.online`
  - Public HTML folder: `/public_html/api` or `/public_html` (same)
- [ ] Point DNS:
  - Domain registrar (or cPanel **Zone Editor**):
    - A record: `@ → server-ip`
    - A record: `api → server-ip`
    - CNAME: `www → @`
- [ ] Enable SSL Certificates:
  - cPanel → **Security → SSL/TLS**
  - Click **Install SSL Certificate** for `reis-sg.online`
  - Use **AutoSSL** (free Let's Encrypt)
  - Repeat for `api.reis-sg.online`
  - ⏳ Wait 5-10 minutes for SSL to activate

---

## PHASE 2: Repository Setup on Server

### Clone Repository
- [ ] SSH into Hostinger:
  ```bash
  ssh u123@your-hostinger-server.com
  ```

- [ ] Create deployment directory:
  ```bash
  mkdir -p ~/public_html/api
  cd ~/public_html/api
  ```

- [ ] Clone GitHub repository:
  ```bash
  git clone https://github.com/YOUR_USERNAME/Reis.git .
  cd backend
  ```

- [ ] Verify directory structure:
  ```bash
  ls -la
  # Should see: package.json, prisma/, src/, tsconfig.json, etc.
  ```

---

## PHASE 3: Backend Deployment

### Install Dependencies & Build
- [ ] Install npm packages (ALL dependencies including devDeps for TypeScript build):
  ```bash
  npm install
  # IMPORTANT: Don't use --production flag, we need tsc, prisma CLI
  ```

- [ ] Build TypeScript:
  ```bash
  npm run build
  ```

- [ ] Verify build succeeded:
  ```bash
  ls dist/
  # Should see: index.js, and compiled *.js files
  ```

### Configure Environment Variables

**Via cPanel (Recommended):**
- [ ] cPanel → **Node.js Selector** → Select your app
- [ ] Click **Environment Variables**
- [ ] Add each variable:

  | Variable | Value |
  |----------|-------|
  | `NODE_ENV` | `production` |
  | `PORT` | `3000` |
  | `DATABASE_URL` | `mysql://u123_reis:PASSWORD@localhost:3306/u123_u123_reis_db` |
  | `JWT_SECRET` | [64 hex chars] |
  | `JWT_ACCESS_SECRET` | [64 hex chars] |
  | `JWT_REFRESH_SECRET` | [64 hex chars] |
  | `CORS_ORIGIN` | `https://reis-sg.online` |
  | `PAYPAL_MODE` | `live` |
  | `PAYPAL_CLIENT_ID` | [from PayPal] |
  | `PAYPAL_CLIENT_SECRET` | [from PayPal] |
  | `PAYPAL_WEBHOOK_ID` | [from PayPal] |
  | `R2_ACCOUNT_ID` | [from Cloudflare] |
  | `R2_ACCESS_KEY_ID` | [from Cloudflare] |
  | `R2_SECRET_ACCESS_KEY` | [from Cloudflare] |
  | `R2_BUCKET_NAME` | `reis-official` |
  | `R2_PUBLIC_URL` | [your R2 URL] |
  | `GHTK_API_TOKEN` | [if using GHTK] |

**Generate JWT secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# Repeat 3 times for each secret
```

### Database Migrations
- [ ] Run Prisma migrations:
  ```bash
  npx prisma migrate deploy
  ```

- [ ] Verify migrations applied:
  ```bash
  mysql -u u123_reis -p u123_u123_reis_db
  mysql> SHOW TABLES;
  mysql> exit;
  ```

### Start Application with PM2
- [ ] Install PM2 globally:
  ```bash
  npm install -g pm2
  ```

- [ ] Start application:
  ```bash
  pm2 start dist/index.js --name "reis-api"
  pm2 save
  pm2 startup
  ```

- [ ] Verify PM2 is running:
  ```bash
  pm2 status
  pm2 logs reis-api
  ```

### Test Backend Locally
- [ ] Test health endpoint:
  ```bash
  curl http://localhost:3000/api/v1/health
  # Expected: 200 OK
  ```

---

## PHASE 4: Frontend Deployment

### Build Frontend Locally
- [ ] On **local machine**, in project root:
  ```bash
  cd frontend
  npm install
  npm run build
  ```

- [ ] Verify build directory:
  ```bash
  ls dist/
  # Should see: index.html, assets/, etc.
  ```

### Upload Frontend Files
- [ ] **Option A: File Manager (easiest)**
  - cPanel → **File Manager**
  - Navigate to `public_html`
  - Upload `dist/` folder contents
  - Delete old files first if needed

- [ ] **Option B: SSH/rsync (fastest)**
  ```bash
  # From local machine
  rsync -avz --progress frontend/dist/ u123@server:/home/u123/public_html/
  ```

- [ ] Verify files uploaded:
  ```bash
  ssh u123@server ls -la /home/u123/public_html/
  # Should see: index.html, assets/, css/, js/, etc.
  ```

### Configure SPA Routing
- [ ] Create `.htaccess` in `public_html/`:
  - Copy from `REIS_ROOT/.htaccess` file
  - Upload to `/home/u123/public_html/.htaccess`
  - Verify file permissions: `644`

- [ ] Test SPA routing:
  ```bash
  # From server
  curl -I http://localhost/some-route
  # Should return 200 and serve index.html
  ```

---

## PHASE 5: Domain & SSL Verification

### Test Frontend
- [ ] Open browser:
  ```
  https://reis-sg.online
  ```

- [ ] Check:
  - [ ] Page loads without errors
  - [ ] No 404 for assets
  - [ ] Browser console clean (F12)
  - [ ] HTTPS lock icon visible

### Test Backend API
- [ ] Test API endpoint from browser console:
  ```javascript
  fetch('https://api.reis-sg.online/api/v1/health')
    .then(r => r.json())
    .then(d => console.log(d))
  ```

- [ ] Or via curl:
  ```bash
  curl https://api.reis-sg.online/health
  # Expected: 200 OK with JSON response
  ```

### Check SSL Certificates
- [ ] cPanel → **Security → SSL/TLS**
- [ ] Verify both domains are installed:
  - `reis-sg.online` ✅
  - `api.reis-sg.online` ✅

- [ ] Test SSL:
  ```bash
  curl -I https://reis-sg.online
  curl -I https://api.reis-sg.online
  # Both should return 200, not 404
  ```

---

## PHASE 6: Application Testing

### User Authentication
- [ ] Register new account via frontend
- [ ] Verify account created in database:
  ```bash
  mysql -u u123_reis -p u123_u123_reis_db
  mysql> SELECT * FROM User;
  ```

- [ ] Login with registered account
- [ ] Verify JWT tokens in browser DevTools → Application → Cookies/Storage

### Products & Catalog
- [ ] View product listing
- [ ] View single product detail
- [ ] Check API responses in DevTools → Network tab
- [ ] Verify images load from R2/CDN

### Shopping Cart
- [ ] Add product to cart
- [ ] Update quantity
- [ ] Remove from cart
- [ ] Verify cart persists on page reload

### Checkout Flow
- [ ] Proceed to checkout
- [ ] Fill shipping address
- [ ] Select shipping method (if GHTK integrated)
- [ ] Complete order
- [ ] Verify order created in database

### API Monitoring
- [ ] Check backend logs:
  ```bash
  pm2 logs reis-api
  ```

- [ ] Monitor error rate (should be 0 for happy path)

---

## PHASE 7: Production Verification

### Performance
- [ ] Frontend load time: < 3 seconds
- [ ] API response time: < 500ms
- [ ] Check PageSpeed Insights: https://pagespeed.web.dev/
  - Target: Desktop 90+, Mobile 85+

### Security
- [ ] Test HTTPS everywhere:
  ```bash
  curl -I http://reis-sg.online
  # Should redirect to https://
  ```

- [ ] Check security headers:
  ```bash
  curl -I https://reis-sg.online | grep -i "x-frame\|x-content\|strict"
  ```

### Database Backups
- [ ] Create initial backup:
  ```bash
  mysqldump -u u123_reis -p u123_u123_reis_db > reis_backup.sql
  ```

- [ ] Store backup securely (download to local machine)
- [ ] Setup automatic backups (cPanel → Backup Wizard)

### Monitoring Setup
- [ ] Enable PM2 monitoring:
  ```bash
  pm2 web
  # Access via http://server:9615
  ```

- [ ] Setup log rotation:
  ```bash
  pm2 install pm2-logrotate
  ```

---

## PHASE 8: Continuous Deployment (Optional)

### Auto-Deploy Backend
- [ ] Create post-receive hook:
  ```bash
  mkdir -p ~/public_html/api/.git/hooks
  nano ~/public_html/api/.git/hooks/post-receive
  # Paste content from DEPLOYMENT.md > "Git Post-Receive Hook"
  chmod +x ~/public_html/api/.git/hooks/post-receive
  ```

- [ ] Add GitHub remote:
  ```bash
  cd ~/public_html/api
  git remote add deploy ~/public_html/api.git
  ```

### Local Deploy Scripts
- [ ] Store credentials in `~/.bash_profile`:
  ```bash
  export DEPLOY_HOST="u123@your-server.com"
  export DEPLOY_METHOD="rsync"
  ```

- [ ] Test deploy script:
  ```bash
  bash scripts/deploy-frontend.sh
  bash scripts/deploy-backend.sh  # (run on server)
  ```

---

## PHASE 9: Monitoring & Maintenance

### Daily Checks
- [ ] Frontend loads without errors
- [ ] API responds to requests
- [ ] No PM2 app crashes:
  ```bash
  pm2 status
  ```

- [ ] Check error logs:
  ```bash
  pm2 logs reis-api --err --lines 50
  ```

### Weekly Tasks
- [ ] Database backup via cPanel
- [ ] Review error logs
- [ ] Test critical user flows (checkout)
- [ ] Monitor disk space: `df -h`

### Monthly Tasks
- [ ] Review database size
- [ ] Optimize slow queries (if any)
- [ ] Update packages: `npm update`
- [ ] Check for security patches

---

## Troubleshooting

### Backend not responding
```bash
pm2 status
pm2 restart reis-api
pm2 logs reis-api
```

### CORS errors in browser
- Check `CORS_ORIGIN` in backend env matches frontend domain
- Verify API is accessible: `curl https://api.reis-sg.online/health`

### Database connection failed
```bash
mysql -u u123_reis -p u123_u123_reis_db
# If fails, check credentials in cPanel
```

### Frontend shows 404
- Verify `.htaccess` exists in `/public_html/`
- Check SPA routing rewrite rules
- Test with: `curl -I https://reis-sg.online/any-route`

### SSL certificate not working
- Wait 10-15 minutes for AutoSSL to activate
- Manually trigger: cPanel → **SSL/TLS → AutoSSL**
- Check domain A record points to server IP

---

## Emergency Contacts

- **Hostinger Support:** https://support.hostinger.com/
- **cPanel Documentation:** https://docs.cpanel.net/
- **Prisma Issues:** https://github.com/prisma/prisma/issues
- **Node.js:** https://nodejs.org/

---

## Sign-Off

- [ ] **All items checked and verified** ✅
- [ ] **Live URL working:** https://reis-sg.online ✅
- [ ] **API responding:** https://api.reis-sg.online/api/v1/health ✅
- [ ] **Database connected and populated** ✅
- [ ] **Deployment successful!** 🎉

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Notes:** _______________________________________________________________

