#!/bin/bash

# Reis Backend Deployment Script for Hostinger hPanel

set -e  # Exit on error

echo "🚀 Starting Reis Backend Deployment..."

# Navigate to backend directory
cd backend

echo "📦 Installing dependencies (including devDeps)..."
npm ci --include=dev

echo "🔨 Building TypeScript..."
npm run build

echo "✅ Build completed successfully!"

# Optional: Run migrations (uncomment if auto-migrate needed)
# echo "🗄️ Running database migrations..."
# npx prisma migrate deploy

echo "✨ Deployment complete!"
