---
name: Reis Hostinger setup architecture
description: Path-based deployment topology, paths and process manager for Reis on Hostinger Business
type: project
---

Reis production runs on Hostinger Business (cPanel) at reis-sg.online with this topology:

- Frontend: React (Vite) static build in `~/public_html/` with SPA routing via `.htaccess`
- Backend: Node.js (Express) cloned to `~/public_html/api/`, code lives under `~/public_html/api/backend/`, build output at `~/public_html/api/backend/dist/index.js`
- Database: MySQL 8.0 on Hostinger (DB user/db prefixed with cPanel user, e.g. `u123_reis`)
- Process manager: PM2 (`pm2 start dist/index.js --name reis-api`), pm2 save + pm2 startup configured
- Node version: 20.x (via cPanel Node.js Selector)
- Env vars: managed in cPanel Node.js App "Environment Variables" panel (NOT a .env file on server)
- API port: backend listens on 3000 internally; reverse proxy is either subdomain `api.reis-sg.online` or .htaccess mod_proxy `/api/* → localhost:3000`

**Why:** This is a hybrid setup — cPanel-style hosting plus Node.js. Important to remember the backend lives under `public_html/api/backend/` (two levels deep from public_html), not in a separate process directory.

**How to apply:** Any deployment commands must `cd ~/public_html/api/backend` before npm install/build/migrations. PM2 entry script must be invoked from that directory so node_modules resolves correctly.
