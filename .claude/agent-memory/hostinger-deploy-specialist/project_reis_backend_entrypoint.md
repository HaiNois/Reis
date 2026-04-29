---
name: Reis backend dist entrypoint
description: PM2 entry for Reis backend is dist/index.js (not server.js)
type: project
---

The Reis backend TypeScript source has `src/index.ts` as entrypoint, compiled to `dist/index.js`.

PM2 start command: `pm2 start dist/index.js --name reis-api` (run from `~/public_html/api/backend/`).

**Why:** `package.json` declares `"start": "node dist/index.js"` and `"build": "tsc"`. The default skill template assumes `dist/server.js` — that is wrong for Reis.

**How to apply:** Never recommend `dist/server.js` for Reis. Always check `package.json` start script before suggesting PM2 commands.
