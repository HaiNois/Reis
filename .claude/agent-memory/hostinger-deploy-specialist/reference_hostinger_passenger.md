---
name: Hostinger Business Node.js uses Passenger
description: cPanel Node.js Selector on Hostinger Business runs apps under Passenger, which has implications for PORT and PM2
type: reference
---

cPanel Node.js Selector (Hostinger Business plan) runs Node.js apps under Phusion Passenger. Implications:

- Passenger ignores the `PORT` env var — it uses its own Unix socket bound to the cPanel-defined application URL
- App entry script must export an Express app instance, OR Passenger must be bypassed by running PM2 separately on a TCP port
- Reis project bypasses Passenger and runs PM2 on `localhost:3000` directly, with reverse-proxy via .htaccess or subdomain
- This means cPanel "Node.js App" panel is used only for env var management and Node version selection — actual process is managed by PM2 via SSH

**Where to verify:** SSH `pm2 list` to confirm PM2 is the active manager, not Passenger. Hostinger SSH terminal at cPanel → Advanced → Terminal.

**Limitations on Business plan:** PM2 cluster mode may not work due to shared-hosting CPU limits — use single-process mode (`-i 1` or default) instead of `-i max`.
